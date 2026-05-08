"""
Views for dashboard analytics and summaries.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from tickets.permissions import IsAdminUserRole, IsAdminOrMember
from tickets.services.dashboard_service import (
    get_status_summary,
    get_monthly_summary,
    get_client_wise_summary,
    get_member_wise_summary,
)


class DashboardSummaryView(APIView):
    """
    View to provide a summary of ticket statuses.
    Accessible to all authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get status distribution summary for the authenticated user.
        """
        data = get_status_summary(request.user)
        return Response(data)


class MonthlyAnalyticsView(APIView):
    """
    View to provide monthly ticket creation trends.
    Accessible to all authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get monthly analytics for the authenticated user.
        """
        data = get_monthly_summary(request.user)
        return Response(data)


class ClientWiseAnalyticsView(APIView):
    """
    View to provide ticket distribution by client.
    Restricted to Admin and Support Member roles.
    """
    permission_classes = [IsAuthenticated, IsAdminOrMember]

    def get(self, request):
        """
        Get client-wise ticket distribution.
        """
        data = get_client_wise_summary(request.user)
        return Response(data)


class MemberWiseAnalyticsView(APIView):
    """
    View to provide ticket distribution by support member.
    Restricted to Admin role only due to sensitivity.
    """
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        """
        Get member-wise workload distribution.
        """
        data = get_member_wise_summary(request.user)
        return Response(data)
