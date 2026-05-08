"""
Admin configuration for the tickets application.

This module provides sophisticated admin interfaces for managing tickets,
including dynamic forms for dependent dropdowns (Issue -> SubIssue/Member),
status transition validation, and message management.
"""
from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError

from .models import Client, Member, Ticket, TicketActivity, TicketMessage
from core.models import SubIssue
from accounts.models import User


# ---------------------------------------------------
# Custom Admin Form (for dynamic filtering)
# ---------------------------------------------------
class TicketAdminForm(forms.ModelForm):
    """
    Custom form for Ticket administration to handle dynamic filtering.
    
    Filters SubIssue and Member choices based on the selected Issue.
    """
    class Meta:
        model = Ticket
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        """
        Initialize the form with dynamic querysets based on current data or instance.
        """
        super().__init__(*args, **kwargs)

        # Dynamic filtering for Add & Change view
        if 'issue' in self.data:
            # When the form is being submitted or updated via AJAX
            try:
                issue_id = int(self.data.get('issue'))
                self.fields['sub_issue'].queryset = SubIssue.objects.filter(issue_id=issue_id)
                self.fields['assigned_to'].queryset = Member.objects.filter(
                    specialty_id=issue_id,
                    is_active=True
                )
            except (ValueError, TypeError):
                pass

        elif self.instance.pk:
            # When editing an existing ticket
            self.fields['sub_issue'].queryset = SubIssue.objects.filter(
                issue=self.instance.issue
            )
            self.fields['assigned_to'].queryset = Member.objects.filter(
                specialty=self.instance.issue,
                is_active=True
            )
        else:
            # When opening a blank 'Add Ticket' form
            self.fields['sub_issue'].queryset = SubIssue.objects.none()
            self.fields['assigned_to'].queryset = Member.objects.none()


# ---------------------------------------------------
# Ticket Admin
# ---------------------------------------------------
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """
    Admin interface for the Ticket model.
    
    Includes custom validation for status transitions and automatic
    logging of status changes to TicketActivity.
    """
    form = TicketAdminForm

    # ------------------------------
    # Status Transition Rules
    # ------------------------------
    def get_allowed_transitions(self, current_status, user):
        """
        Return a list of allowed next statuses based on current status and user role.
        """

        transitions = {
            Ticket.Status.CREATED: [Ticket.Status.ASSIGNED],
            Ticket.Status.ASSIGNED: [Ticket.Status.STARTED],
            Ticket.Status.STARTED: [Ticket.Status.RESOLVED],
            Ticket.Status.RESOLVED: [Ticket.Status.CLOSED],
            Ticket.Status.CLOSED: [],
        }

        allowed = transitions.get(current_status, [])

        # Member (staff) cannot close tickets
        if user.role == User.Role.MEMBER:
            allowed = [s for s in allowed if s != Ticket.Status.CLOSED]

        # Client cannot change status via admin
        if user.role == User.Role.CLIENT:
            allowed = []

        return allowed

    # ------------------------------
    # Save Model Override
    # ------------------------------
    def save_model(self, request, obj, form, change):
        """
        Override save_model to validate status transitions and log activity.
        """

        old_status = None

        if change:
            # Only validate transitions if the ticket already exists
            old_status = Ticket.objects.get(pk=obj.pk).status

            if old_status != obj.status:
                allowed = self.get_allowed_transitions(old_status, request.user)

                if obj.status not in allowed:
                    raise ValidationError(
                        f"Transition from {old_status} to {obj.status} is not allowed for your role."
                    )

        super().save_model(request, obj, form, change)

        # Log activity if status changed
        if change and old_status != obj.status:
            TicketActivity.objects.create(
                ticket=obj,
                changed_by=request.user,
                old_status=old_status,
                new_status=obj.status
            )


# ---------------------------------------------------
# Other Registrations
# ---------------------------------------------------
# Register simpler models using default ModelAdmin
admin.site.register(Client)
admin.site.register(Member)
admin.site.register(TicketActivity)


# ---------------------------------------------------
# Ticket Message Admin
# ---------------------------------------------------
@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    """
    Admin interface for viewing and managing ticket messages.
    """
    
    list_display = ('id', 'ticket', 'sender', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at', 'sender__role')
    search_fields = ('content', 'sender__username', 'ticket__ticket_number')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sender')
    
    fieldsets = (
        ('Message Info', {
            'fields': ('id', 'ticket', 'sender', 'content')
        }),
        ('Status', {
            'fields': ('is_read',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        """Only allow staff members to create messages via the admin interface."""
        return request.user.is_staff
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers have permission to delete messages."""
        return request.user.is_superuser
