"""
Serializers for ticket-related operations.

This module provides serializers for viewing, creating, and updating tickets,
including handling nested message data and complex status transition validation.
"""

from rest_framework import serializers
from tickets.models import Ticket
from accounts.models import User


class TicketMessageNestedSerializer(serializers.Serializer):
    """
    Minimal serializer for messages when included in ticket detail.

    Used as a nested serializer within TicketSerializer to provide a
    read-only view of messages associated with a ticket.
    """
    id = serializers.IntegerField(read_only=True)
    sender_username = serializers.CharField(
        source="sender.username",
        read_only=True
    )
    sender_id = serializers.IntegerField(
        source="sender.id",
        read_only=True
    )
    sender_role = serializers.CharField(
        source="sender.role",
        read_only=True
    )
    content = serializers.CharField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class TicketSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Ticket model.

    Aggregates information from related models (Client, Issue, Member) and
    includes nested message history. Used primarily for ticket detail views.
    """

    # Client info
    client_name = serializers.CharField(source="client.user.username", read_only=True)
    client_email = serializers.CharField(source="client.user.email", read_only=True)
    company_name = serializers.CharField(source="client.company_name", read_only=True)
    client_phone = serializers.CharField(source="client.whatsapp_number", read_only=True)

    # Issue info
    issue_name = serializers.CharField(source="issue.name", read_only=True)
    sub_issue_name = serializers.CharField(source="sub_issue.name", read_only=True)

    # Member info
    assigned_member = serializers.CharField(
        source="assigned_to.user.username",
        read_only=True,
        allow_null=True
    )

    # Messages (nested)
    messages = TicketMessageNestedSerializer(
        read_only=True,
        many=True
    )

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_number",
            "status",
            "description",
            "created_at",
            "updated_at",
            "client",
            "issue",
            "sub_issue",
            "assigned_to",
            "client_name",
            "client_email",
            "company_name",
            "client_phone",
            "issue_name",
            "sub_issue_name",
            "assigned_member",
            "messages",
        ]
        read_only_fields = ["ticket_number", "created_at", "updated_at", "messages"]


class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new Ticket.

    Handles initial ticket creation with validation to ensure the selected
    sub-issue is logically linked to the selected issue.
    """
    class Meta:
        model = Ticket
        fields = ["issue", "sub_issue", "description", "client"]
        extra_kwargs = {
            "client": {"required": False, "allow_null": True}
        }

    def validate(self, data):
        """
        Validate that the sub_issue belongs to the selected issue.
        """
        if data["sub_issue"].issue != data["issue"]:
            raise serializers.ValidationError(
                "Selected sub-issue does not belong to selected issue."
            )
        
        request = self.context.get("request")
        if request and request.user and request.user.role == User.Role.ADMIN:
            if not data.get("client"):
                raise serializers.ValidationError(
                    {"client": "Client is required for admin ticket creation."}
                )
        return data


class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating ticket status and assignment.

    Implements business logic for allowed status transitions and ensures
    that assigned members have the correct specialty for the ticket's issue.
    """
    class Meta:
        model = Ticket
        fields = ["status", "assigned_to"]

    def validate(self, data):
        """
        Perform complex validation for status transitions and member assignments.
        """
        ticket = self.instance
        user = self.context["request"].user

        # Only validate active status updates
        if "status" in data:
            # Define allowed state transitions
            transitions = {
                Ticket.Status.CREATED: [Ticket.Status.ASSIGNED],
                Ticket.Status.ASSIGNED: [Ticket.Status.STARTED],
                Ticket.Status.STARTED: [Ticket.Status.RESOLVED],
                Ticket.Status.RESOLVED: [Ticket.Status.CLOSED],
                Ticket.Status.CLOSED: [],
            }

            allowed = transitions.get(ticket.status, [])

            # Members are restricted from closing tickets directly
            if user.role == User.Role.MEMBER:
                allowed = [s for s in allowed if s != Ticket.Status.CLOSED]

            # Clients are not allowed to manually trigger status transitions
            if user.role == User.Role.CLIENT:
                raise serializers.ValidationError("Clients cannot update ticket status.")

            # Check if the requested transition is valid
            if data["status"] not in allowed:
                raise serializers.ValidationError(
                    f"Transition from {ticket.status} to {data['status']} not allowed."
                )

        # Validate assigned_to field
        if "assigned_to" in data and data["assigned_to"]:
            # Handle both ID and object formats
            assigned_to_value = data["assigned_to"]
            
            # If it's an ID (integer), fetch the Member object
            if isinstance(assigned_to_value, int):
                from tickets.models import Member
                try:
                    member = Member.objects.get(id=assigned_to_value)
                    assigned_to_value = member
                except Member.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Invalid member ID '{assigned_to_value}' – member does not exist."
                    )
            
            # Ensure member's expertise matches the ticket's issue category
            if assigned_to_value.specialty != ticket.issue:
                raise serializers.ValidationError(
                    "Assigned member does not match ticket issue."
                )
            
            # Update the data with the Member object
            data["assigned_to"] = assigned_to_value

        return data