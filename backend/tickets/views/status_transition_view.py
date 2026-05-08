"""
Views for handling ticket workflow status transitions.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from tickets.models import Ticket


class TicketAllowedTransitionsView(APIView):
    """
    API view to retrieve allowed status transitions for a specific ticket.
    
    The list of allowed transitions depends on the current status of the ticket
    and the role of the user requesting the information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        """
        Get the list of allowed statuses a ticket can transition to.
        
        Args:
            request: The request object.
            ticket_id: The ID of the ticket.
            
        Returns:
            Response: A dictionary containing the current status and a list of allowed next statuses.
            
        Raises:
            NotFound: If the ticket is not found or not accessible to the user.
        """
        user = request.user

        # 🔐 Secure ticket lookup using role-based filtering
        # Ensures that users can only see transitions for tickets they are authorized to access
        ticket = (
            Ticket.objects
            .for_user(user)
            .filter(id=ticket_id)
            .first()
        )

        if not ticket:
            raise NotFound("Ticket not found.")

        # Determine which status transitions are available based on workflow rules and user role
        allowed = ticket.get_allowed_transitions(user)

        return Response({
            "current_status": ticket.status,
            "allowed_statuses": allowed
        })
