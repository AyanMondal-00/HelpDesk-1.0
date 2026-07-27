"""
Core system views for the HelpDesk application.
This module provides read-only endpoints for retrieving system-wide configuration
data such as issue categories, sub-issue types, and company types.
"""

from rest_framework import generics, permissions

from core.models import Issue, SubIssue, CompanyType
from core.serializers import IssueSerializer, SubIssueSerializer, CompanyTypeSerializer


class IssueListView(generics.ListCreateAPIView):
    """
    API endpoint that lists all available high-level issue categories,
    and allows admins to create new ones.
    Required Authentication: JWT Token (GET), Admin JWT Token (POST).
    """
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class SubIssueListView(generics.ListCreateAPIView):
    """
    API endpoint that lists all specific sub-issue types,
    and allows admins to create new ones.
    Required Authentication: JWT Token (GET), Admin JWT Token (POST).
    """
    queryset = SubIssue.objects.all()
    serializer_class = SubIssueSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class CompanyTypeListView(generics.ListAPIView):
    """
    API endpoint that lists all valid types of client companies.
    Used for categorization of client organizations.
    Required Authentication: JWT Token.
    """
    queryset = CompanyType.objects.all()
    serializer_class = CompanyTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
