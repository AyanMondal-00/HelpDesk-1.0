"""
Services for generating dashboard statistics.

This module provides functions to aggregate ticket data for dashboard
visualizations, filtered by the requesting user's permissions.
"""

from django.db.models import Count
from django.db.models.functions import TruncMonth
from tickets.models import Ticket


def get_status_summary(user):
    """
    Generate a summary of ticket counts grouped by status.

    Args:
        user: The user for whom to generate the summary.

    Returns:
        dict: A dictionary containing total ticket count and counts for each status.
    """
    queryset = Ticket.objects.for_user(user)

    summary = queryset.values("status").annotate(count=Count("id"))

    data = {
        "total_tickets": queryset.count(),
        "created": 0,
        "assigned": 0,
        "started": 0,
        "resolved": 0,
        "closed": 0,
    }

    for item in summary:
        status = item["status"].lower()
        data[status] = item["count"]

    return data


def get_monthly_summary(user):
    """
    Generate a summary of ticket counts grouped by month of creation.

    Args:
        user: The user for whom to generate the summary.

    Returns:
        QuerySet: A list of dictionaries with 'month' and 'count'.
    """
    queryset = Ticket.objects.for_user(user)

    monthly_data = (
        queryset
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )

    return monthly_data


def get_client_wise_summary(user):
    """
    Generate a summary of ticket counts grouped by client.

    Args:
        user: The user for whom to generate the summary.

    Returns:
        QuerySet: A list of dictionaries with 'client__user__username' and 'count'.
    """
    queryset = Ticket.objects.for_user(user)

    data = (
        queryset
        .values("client__user__username")
        .annotate(count=Count("id"))
    )

    return data


def get_member_wise_summary(user):
    """
    Generate a summary of ticket counts grouped by assigned member.

    Args:
        user: The user for whom to generate the summary.

    Returns:
        QuerySet: A list of dictionaries with 'assigned_to__user__username' and 'count'.
    """
    queryset = Ticket.objects.for_user(user)

    data = (
        queryset
        .values("assigned_to__user__username")
        .annotate(count=Count("id"))
    )

    return data