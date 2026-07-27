"""
Ticket model and custom QuerySet for the tickets application.

This module contains the core ticketing logic, including status workflows,
role-based filtering, and time tracking for ticket progression.
"""
import uuid
from django.db import models
from core.models import Issue, SubIssue
from .client import Client
from .member import Member
from core.models.base import TimeStampedModel
from smart_selects.db_fields import ChainedForeignKey
from accounts.models import User


# ============================================================
# TICKET QUERYSET - Role-based filtering
# ============================================================
class TicketQuerySet(models.QuerySet):
    """
    Custom QuerySet for role-based ticket filtering.
    Ensures users can only see tickets they have access to:
    - ADMIN: sees all tickets
    - MEMBER: sees only tickets assigned to them
    - CLIENT: sees only their own tickets
    """

    def for_user(self, user):
        """
        Filter tickets based on user role.
        
        Args:
            user: The User instance requesting the tickets.
            
        Returns:
            A filtered QuerySet containing only tickets the user is allowed to view.
        """
        if user.role == User.Role.ADMIN:
            return self  # Admins see everything

        if user.role == User.Role.MEMBER:
            return self.filter(assigned_to__user=user)  # Members see assigned tickets

        if user.role == User.Role.CLIENT:
            return self.filter(client__user=user)  # Clients see own tickets

        return self.none()  # No access for other roles


class Ticket(TimeStampedModel):
    """
    Main Ticket model - core entity of the ticketing system.
    
    Workflow Status: CREATED -> ASSIGNED -> STARTED -> RESOLVED -> CLOSED
    
    Features:
    - Unique UUID ticket number for tracking
    - Chained selection: Issue -> SubIssue -> Member specialty matching
    - Status-based workflow with time tracking
    - Full audit trail with timestamps (created_at, updated_at)
    - Role-based access control via TicketQuerySet
    """

    # ============================================================
    # STATUS WORKFLOW
    # ============================================================
    class Status(models.TextChoices):
        """Ticket status progression through workflow"""
        CREATED = 'CREATED', 'Created'      # Initial state
        ASSIGNED = 'ASSIGNED', 'Assigned'   # Assigned to member
        STARTED = 'STARTED', 'Started'      # Member working on it
        RESOLVED = 'RESOLVED', 'Resolved'   # Issue resolved
        CLOSED = 'CLOSED', 'Closed'         # Final state

    ticket_number = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='tickets'
    )

    issue = models.ForeignKey(
        Issue,
        on_delete=models.PROTECT
    )

    sub_issue = ChainedForeignKey(
        SubIssue,
        chained_field="issue",
        chained_model_field="issue",
        show_all=False,
        auto_choose=True,
        sort=True,
        on_delete=models.PROTECT
    )

    description = models.TextField()

    assigned_to = ChainedForeignKey(
        Member,
        chained_field="issue",
        chained_model_field="specialty",
        show_all=False,
        auto_choose=False,
        sort=True,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED
    )

    assigned_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # 👇 Attach custom manager
    objects = TicketQuerySet.as_manager()

    def get_allowed_transitions(self, user):
        """
        Determine which status transitions are allowed for the given user.
        
        Args:
            user: The User instance attempting to change the status.
            
        Returns:
            A list of status strings representing valid next states.
        """
        transitions = {
            "CREATED": ["ASSIGNED"],
            "ASSIGNED": ["STARTED"],
            "STARTED": ["RESOLVED"],
            "RESOLVED": ["CLOSED"],
            "CLOSED": [],
        }
        allowed = transitions.get(self.status, [])
        
        # MEMBER cannot close tickets
        if user.role == User.Role.MEMBER:
            allowed = [s for s in allowed if s != self.Status.CLOSED]
        
        # CLIENT cannot update tickets (status transitions)
        if user.role == User.Role.CLIENT:
            allowed = []
        
        return allowed

    def save(self, *args, **kwargs):
        """
        Override save to prevent modifications to closed tickets and trigger
        notifications when a support member is assigned.
        """
        is_new = self.pk is None
        assigned_changed = False

        if not is_new:
            # Check if current ticket in DB is already closed
            old_instance = Ticket.objects.get(pk=self.pk)
            old_status = old_instance.status

            if old_status == self.Status.CLOSED:
                raise ValueError("Closed tickets cannot be modified.")

            # Check if assignment changed
            if self.assigned_to and old_instance.assigned_to != self.assigned_to:
                assigned_changed = True
        else:
            # If created with a member assigned right away
            if self.assigned_to:
                assigned_changed = True

        super().save(*args, **kwargs)

        # Send email notification after successful save
        if assigned_changed and self.assigned_to and self.assigned_to.user.email:
            self.send_assignment_email()

    def send_assignment_email(self):
        """
        Send an email notification to the assigned support member.
        """
        from django.core.mail import send_mail
        from django.conf import settings
        
        subject = f"[Helpdesk] New Ticket Assigned: {self.ticket_number}"
        message = f"""Hi {self.assigned_to.user.username},

You have been assigned to handle a new helpdesk ticket.

Ticket Details:
- Ticket Number: {self.ticket_number}
- Issue: {self.issue.name}
- Sub-Issue: {self.sub_issue.name}
- Client Company: {self.client.company_name}
- Description: {self.description}

Please take care and respond to customer as soon as possible.

Best regards,
Silicon Systems 
"""
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [self.assigned_to.user.email],
            fail_silently=True,
        )

    def __str__(self):
        """Return string representation of the ticket (number and status)."""
        return f"{self.ticket_number} - {self.status}"
