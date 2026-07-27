"""
Main views for ticket CRUD operations and lifecycle management.
"""
from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from tickets.models import Ticket, Client
from tickets.serializers import (
    TicketSerializer,
    TicketCreateSerializer,
    TicketStatusUpdateSerializer,
)
from accounts.models import User
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import NotFound


class TicketDetailView(generics.RetrieveAPIView):
    """
    API view to retrieve details of a specific ticket.
    
    Ensures that users can only access tickets they have permission to view.
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return the queryset of tickets accessible to the current user.
        """
        return Ticket.objects.for_user(self.request.user)

    def get_object(self):
        """
        Retrieve the ticket object and verify access.
        
        Returns:
            Ticket: The requested ticket instance.
            
        Raises:
            NotFound: If the ticket does not exist or is not accessible.
        """
        queryset = self.get_queryset()
        ticket_id = self.kwargs["pk"]

        ticket = queryset.filter(id=ticket_id).first()

        if not ticket:
            raise NotFound("Ticket not found.")

        return ticket


class TicketFilter(django_filters.FilterSet):
    """
    Filter set for Ticket listing.
    
    Provides capabilities to filter by creation date range, status, issue, and assignment.
    """
    created_after = django_filters.DateFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = Ticket
        fields = ["status", "issue", "assigned_to"]


class TicketListView(generics.ListAPIView):
    """
    API view to list all tickets accessible to the user.
    
    Supports filtering, searching by description or ticket number, 
    and ordering by creation date or status.
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = TicketFilter

    search_fields = ["description", "ticket_number"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Return tickets the user is authorized to see based on their role.
        """
        return Ticket.objects.for_user(self.request.user)


class TicketCreateView(generics.CreateAPIView):
    """
    API view to handle the creation of new tickets.
    
    Only users with the CLIENT or ADMIN role are permitted to create tickets.
    """
    serializer_class = TicketCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Validate user role and associate the ticket with the client's profile.
        
        Args:
            serializer: The ticket create serializer.
            
        Raises:
            PermissionDenied: If the user is not a client or admin.
        """
        user = self.request.user

        if user.role != User.Role.CLIENT and user.role != User.Role.ADMIN:
            raise permissions.PermissionDenied("Only clients and admins can create tickets.")

        if user.role == User.Role.CLIENT:
            # Associate the new ticket with the Client profile linked to the User
            client = Client.objects.get(user=user)
            serializer.save(client=client)
        else:
            # For admin, the client is already validated and set in validated_data by the serializer
            serializer.save()



class TicketStatusUpdateView(generics.UpdateAPIView):
    """
    API view to update ticket status or assignment.
    
    Implements business rules for transitions and role-based restrictions.
    """
    serializer_class = TicketStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Restrict the update operations to tickets the user is authorized to access.
        """
        return Ticket.objects.for_user(self.request.user)

    def perform_update(self, serializer):
        """
        Perform updates while enforcing workflow and role-based rules.
        
        Args:
            serializer: The update serializer.
            
        Raises:
            PermissionDenied: If business rules or role restrictions are violated.
        """
        ticket = self.get_object()
        user = self.request.user

        # Security check: CLIENTs are not allowed to manually update ticket attributes
        if user.role == User.Role.CLIENT:
            raise PermissionDenied("Clients cannot update tickets.")

        # Workflow rule: Support members cannot perform the final 'CLOSE' action
        if user.role == User.Role.MEMBER and serializer.validated_data.get("status") == Ticket.Status.CLOSED:
            raise PermissionDenied("Member cannot close tickets.")

        # Assignment rule: Only ADMINs have the authority to assign or reassign members
        if user.role != User.Role.ADMIN and "assigned_to" in serializer.validated_data:
            raise PermissionDenied("Only admin can assign members.")
            
        # Store old status to track changes for the activity log
        old_status = ticket.status
        
        # Apply the validated changes to the ticket
        serializer.save()
        
        # Log activity if the status has transitioned
        new_status = serializer.validated_data.get("status", ticket.status)
        if old_status != new_status:
            from tickets.models import TicketActivity
            TicketActivity.objects.create(
                ticket=ticket,
                changed_by=user,
                old_status=old_status,
                new_status=new_status
            )
