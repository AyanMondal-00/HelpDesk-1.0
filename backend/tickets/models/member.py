"""
Member model for the tickets application.

This module defines the Member profile for support staff (MEMBER role),
including their specialties (the type of issues they handle) and availability status.
"""
from django.db import models
from django.conf import settings
from core.models import Issue
from core.models.base import TimeStampedModel


class Member(TimeStampedModel):
    """
    Support Member profile linked to MEMBER role users.
    
    Represents support staff who are assigned to handle tickets.
    Each member has a specialty (Issue type they handle).
    Members are matched to tickets based on the ticket's issue specialty.
    """

    # Reference to User account (must be MEMBER role)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'MEMBER'},
        help_text="Associated user account with MEMBER role"
    )

    # Area of expertise/specialization (Issue category they handle)
    specialty = models.ForeignKey(
        Issue,
        on_delete=models.PROTECT,
        help_text="The issue type/category this member specializes in"
    )

    # Whether this member is actively working
    is_active = models.BooleanField(
        default=True,
        help_text="If False, member will not be assigned new tickets"
    )

    def __str__(self):
        """Return the username as the string representation."""
        return self.user.username
