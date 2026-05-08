"""
Views for filtering support staff members based on ticket issue specialty.
Note: This view is similar to MemberFilterView and handles staff-specific lookups.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from tickets.models import Ticket
from tickets.models.member import Member
from accounts.models import User


class FilterMemberByIssueView(APIView):
    """
    API view to get a list of support members eligible for assignment to a specific ticket.
    
    Members are filtered based on whether their specialty matches the ticket's issue type.
    This ensures that tickets are only assigned to staff with relevant expertise.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        """
        Retrieve eligible support members for the given ticket.
        
        Args:
            request: The request object.
            ticket_id: The ID of the ticket for which to find eligible members.
            
        Returns:
            Response: A list of objects containing member ID and username.
            
        Raises:
            PermissionDenied: If a client attempts to access this endpoint.
            NotFound: If the ticket is not found or not accessible to the user.
        """
        user = request.user

        # 🔒 Security: Clients are not permitted to see the list of internal support members
        if user.role == User.Role.CLIENT:
            raise PermissionDenied("Clients cannot view eligible members.")

        # 🔐 Secure ticket lookup ensuring role-based access control
        ticket = (
            Ticket.objects
            .for_user(user)
            .filter(id=ticket_id)
            .first()
        )

        if not ticket:
            raise NotFound("Ticket not found.")

        # 👇 Fetch Member profiles (the support staff model) where specialty matches the ticket's issue
        member_queryset = Member.objects.filter(
            specialty=ticket.issue
        ).select_related("user")

        # Construct the response data using the Member ID and the associated User's username
        data = [
            {
                "id": member.id,  # Important: Return Member ID for assignment purposes
                "username": member.user.username
            }
            for member in member_queryset
        ]

        return Response(data)
