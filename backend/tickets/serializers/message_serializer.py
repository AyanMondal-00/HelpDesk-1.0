"""
Serializers for ticket messages.

This module handles the serialization and deserialization of TicketMessage objects,
supporting both the display of message threads and the creation of new messages.
"""

from rest_framework import serializers
from tickets.models import TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for TicketMessage model.

    Provides a detailed representation of a ticket message, including expanded
    information about the sender such as their username and role.
    """

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

    class Meta:
        model = TicketMessage
        fields = [
            "id",
            "ticket",
            "sender",
            "sender_id",
            "sender_username",
            "sender_role",
            "content",
            "is_read",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sender",
            "sender_id",
            "sender_username",
            "sender_role",
            "created_at",
            "updated_at",
        ]


class TicketMessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new ticket messages.

    Focuses on the content of the message. The ticket and sender fields are
    typically handled by the view logic during the save process.
    """

    class Meta:
        model = TicketMessage
        fields = ["content"]

