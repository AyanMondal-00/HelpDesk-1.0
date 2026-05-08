"""
Core system views for the HelpDesk application.
This module provides read-only endpoints for retrieving system-wide configuration
data such as issue categories, sub-issue types, and company types.
"""

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from core.models import Issue, SubIssue, CompanyType
from core.serializers import IssueSerializer, SubIssueSerializer, CompanyTypeSerializer


class IssueListView(generics.ListAPIView):
    """
    API endpoint that lists all available high-level issue categories.
    Used for populating dropdowns during ticket creation.
    Required Authentication: JWT Token.
    """
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]


class SubIssueListView(generics.ListAPIView):
    """
    API endpoint that lists all specific sub-issue types.
    Can be filtered by parent 'issue' via query parameters if implemented by frontend.
    Required Authentication: JWT Token.
    """
    queryset = SubIssue.objects.all()
    serializer_class = SubIssueSerializer
    permission_classes = [IsAuthenticated]


class CompanyTypeListView(generics.ListAPIView):
    """
    API endpoint that lists all valid types of client companies.
    Used for categorization of client organizations.
    Required Authentication: JWT Token.
    """
    queryset = CompanyType.objects.all()
    serializer_class = CompanyTypeSerializer
    permission_classes = [IsAuthenticated]
