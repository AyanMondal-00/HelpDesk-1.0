"""
SubIssue model for the core application.

This module defines specific sub-categories related to a main Issue category.
"""
from django.db import models
from .base import TimeStampedModel
from .issue import Issue
from smart_selects.db_fields import ChainedForeignKey


class SubIssue(TimeStampedModel):
    """
    Represents a more specific issue that belongs to a parent Issue category.
    """

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=150)

    def __str__(self):
        """Return a string representation including the parent issue and sub-issue name."""
        return f"{self.issue.name} - {self.name}"
