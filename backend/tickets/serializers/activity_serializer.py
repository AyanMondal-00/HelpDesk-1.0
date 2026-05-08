"""
Serializers for ticket activity tracking.

This module defines the serializer for the TicketActivity model, used to
represent history of status changes and other activities on a ticket.
"""

from rest_framework import serializers
from tickets.models import TicketActivity


class TicketActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for the TicketActivity model.

    Provides a read-only representation of ticket activity, including
    status transitions and the user who performed the change.
    """

    changed_by = serializers.StringRelatedField()

    class Meta:
        model = TicketActivity
        fields = [
            "id",
            "old_status",
            "new_status",
            "changed_by",
            "created_at",
        ]