"""
Client model for the tickets application.

This module defines the Client profile which extends User information
specifically for client-side users of the helpdesk system, storing
organization details and contact information.
"""
from django.db import models
from django.conf import settings
from core.models import CompanyType
from core.models.base import TimeStampedModel


class Client(TimeStampedModel):
    """
    Client profile linked to CLIENT role users.
    
    Stores organization/company information for clients who use the ticketing system.
    Each client is associated with exactly one User account via OneToOne relationship.
    """

    # Reference to User account (must be CLIENT role)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'CLIENT'},
        help_text="Associated user account with CLIENT role"
    )

    # Client organization name
    company_name = models.CharField(
        max_length=255,
        help_text="Name of the client company/organization"
    )

    # Type of company/organization
    company_type = models.ForeignKey(
        CompanyType,
        on_delete=models.PROTECT,
        help_text="Classification of company type (e.g., IT, Healthcare)"
    )

    # Contract terms
    contract_duration = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Duration/terms of the contract with client"
    )

    # Client email address
    email = models.EmailField(
        help_text="Primary email address for client communication"
    )

    # Client WhatsApp number (for communication)
    whatsapp_number = models.CharField(
        max_length=20,
        help_text="WhatsApp number for direct client communication"
    )

    def __str__(self):
        """Return the company name as the string representation."""
        return self.company_name
