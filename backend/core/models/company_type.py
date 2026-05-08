"""
CompanyType model for the core application.

This module defines the types of companies that can be associated with clients.
"""
from django.db import models
from .base import TimeStampedModel


class CompanyType(TimeStampedModel):
    """
    Represents a classification for companies (e.g., 'Internal', 'External', 'Partner').
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        """Return the string representation of the company type."""
        return self.name
