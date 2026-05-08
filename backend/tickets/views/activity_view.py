"""
Views for handling ticket activity history.
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from tickets.models import TicketActivity, Ticket
from tickets.serializers import TicketActivitySerializer


class TicketActivityListView(generics.ListAPIView):
    """
    API view to list all activities for a specific ticket.
    
    Provides a chronological audit log of all changes made to a ticket,
    including status transitions and assignment updates.
    """
    serializer_class = TicketActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Get the list of activities for a ticket, filtered by user accessibility.
        
        Returns:
            QuerySet: A filtered queryset of TicketActivity objects ordered by creation date (newest first).
        
        Raises:
            NotFound: If the ticket doesn't exist or the user doesn't have permission to view it.
        """
        user = self.request.user
        ticket_id = self.kwargs["ticket_id"]

        # 🔐 Secure ticket lookup using role-based filtering
        # Ensures that users can only see activities for tickets they have access to
        ticket = Ticket.objects.for_user(user).filter(id=ticket_id).first()

        if not ticket:
            raise NotFound("Ticket not found.")

        # Return activities only for accessible ticket
        return (
            TicketActivity.objects
            .filter(ticket=ticket)
            .order_by("-created_at")
        )
