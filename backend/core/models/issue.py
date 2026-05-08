"""
Issue model for the core application.

This module defines the high-level categories of issues that can be reported.
"""
from django.db import models
from .base import TimeStampedModel


class Issue(TimeStampedModel):
    """
    Represents a primary category of technical or administrative issue.
    """
    name = models.CharField(max_length=150, unique=True)

    def __str__(self):
        """Return the string representation of the issue."""
        return self.name
