"""
Serializers for core HelpDesk system models.
This module handles the serialization of system configuration entities 
like Issues, SubIssues, and CompanyTypes.
"""

from rest_framework import serializers
from core.models import Issue, SubIssue, CompanyType


class IssueSerializer(serializers.ModelSerializer):
    """
    Serializer for high-level Issue categories.
    Exposes ID and the human-readable name.
    """
    class Meta:
        """Meta configuration for IssueSerializer."""
        model = Issue
        fields = ["id", "name"]


class SubIssueSerializer(serializers.ModelSerializer):
    """
    Serializer for specific SubIssue types.
    Includes a reference to the parent 'issue'.
    """
    class Meta:
        """Meta configuration for SubIssueSerializer."""
        model = SubIssue
        fields = ["id", "name", "issue"]


class CompanyTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for CompanyType entities.
    Used for categorizing client organizations.
    """
    class Meta:
        """Meta configuration for CompanyTypeSerializer."""
        model = CompanyType
        fields = ["id", "name"]
