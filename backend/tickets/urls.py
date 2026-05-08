from django.urls import path
from tickets.views import (
    TicketListView,
    TicketCreateView,
    TicketStatusUpdateView,
    DashboardSummaryView,
    TicketActivityListView,
    TicketAllowedTransitionsView,
    FilterMemberByIssueView,
    LogoutView,
    TicketMessageListView,
    TicketMessageCreateView,
    TicketMessageMarkReadView,
)
from .views.dashboard_view import (
    DashboardSummaryView,
    MonthlyAnalyticsView,
    ClientWiseAnalyticsView,
    MemberWiseAnalyticsView,
)
from .views.ticket_views import TicketDetailView

urlpatterns = [
    path("tickets/", TicketListView.as_view()),
    path("tickets/create/", TicketCreateView.as_view()),
    path("tickets/<int:pk>/update/", TicketStatusUpdateView.as_view()),
    path("dashboard/", DashboardSummaryView.as_view()),
    path("tickets/<int:ticket_id>/activity/", TicketActivityListView.as_view()),
    path("tickets/<int:ticket_id>/allowed-transitions/", TicketAllowedTransitionsView.as_view()),
    path("tickets/<int:ticket_id>/eligible-members/", FilterMemberByIssueView.as_view()),
    path("tickets/<int:ticket_id>/messages/", TicketMessageListView.as_view(), name="ticket-messages-list"),
    path("tickets/<int:ticket_id>/messages/create/", TicketMessageCreateView.as_view(), name="ticket-messages-create"),
    path("tickets/<int:ticket_id>/messages/<int:pk>/mark-read/", TicketMessageMarkReadView.as_view(), name="ticket-message-mark-read"),
    path("dashboard/summary/", DashboardSummaryView.as_view()),
    path("dashboard/monthly/", MonthlyAnalyticsView.as_view()),
    path("dashboard/client-wise/", ClientWiseAnalyticsView.as_view()),
    path("dashboard/member-wise/", MemberWiseAnalyticsView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("tickets/<int:pk>/", TicketDetailView.as_view()),
]