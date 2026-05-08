"""
TicketActivity model for the tickets application.

This module tracks the history of status changes for each ticket,
providing an audit trail of who changed what and when.
"""
from django.db import models
from django.conf import settings
from core.models.base import TimeStampedModel


class TicketActivity(TimeStampedModel):
    """
    Records a status transition for a ticket.
    
    Attributes:
        ticket: The ticket being updated.
        changed_by: The user who performed the status change.
        old_status: The status before the change.
        new_status: The status after the change.
    """

    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        related_name='activities'
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)

    def __str__(self):
        """Return a string representation of the activity transition."""
        return f"{self.ticket.ticket_number} - {self.old_status} → {self.new_status}"
