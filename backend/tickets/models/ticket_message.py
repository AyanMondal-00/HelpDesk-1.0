"""
TicketMessage model for the tickets application.

This module handles communication between clients and support members
within the context of a specific ticket, allowing for discussion and 
status updates through messages.
"""
from django.db import models
from django.conf import settings
from core.models.base import TimeStampedModel
from .ticket import Ticket


class TicketMessage(TimeStampedModel):
    """
    Ticket-level messaging for communication between clients and assigned members.
    
    Features:
    - Messages linked to specific tickets
    - Sender is a User (can be CLIENT or MEMBER)
    - Read status tracking
    - Role-based visibility handled at serializer/view level
    - Admin can view all messages for a ticket
    - Clients and members can only see messages for tickets they have access to
    """

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="The ticket this message belongs to"
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text="The user who sent this message"
    )

    content = models.TextField(
        help_text="The message content"
    )

    is_read = models.BooleanField(
        default=False,
        help_text="Whether the message has been read by the recipient"
    )

    def __str__(self):
        """Return a string representation identifying the sender and ticket."""
        return f"Message from {self.sender.username} on Ticket {self.ticket.ticket_number}"
