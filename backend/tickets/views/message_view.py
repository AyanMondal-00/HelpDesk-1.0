"""
Views for handling ticket messages and communication between clients and support.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters
from tickets.models import TicketMessage, Ticket
from tickets.serializers import (
    TicketMessageSerializer,
    TicketMessageCreateSerializer,
)
from accounts.models import User


class TicketMessageListView(generics.ListAPIView):
    """
    List all messages for a specific ticket.
    
    Access Control:
    - ADMIN: Can view messages for any ticket
    - MEMBER: Can view messages for tickets assigned to them
    - CLIENT: Can view messages for their own tickets
    """

    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_fields = ['is_read']
    ordering = ['created_at']

    def get_queryset(self):
        """
        Return messages for the specified ticket, filtered by user role and access permissions.
        
        Returns:
            QuerySet: A filtered queryset of TicketMessage objects.
        """
        ticket_id = self.kwargs.get('ticket_id')
        
        # Verify ticket exists before attempting to fetch messages
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return TicketMessage.objects.none()

        # Check user access to this ticket based on their role
        user = self.request.user
        has_access = False

        if user.role == User.Role.ADMIN:
            has_access = True
        elif user.role == User.Role.MEMBER:
            # Members can only see messages for tickets they are assigned to
            has_access = (ticket.assigned_to and ticket.assigned_to.user == user)
        elif user.role == User.Role.CLIENT:
            # Clients can only see messages for tickets they created
            has_access = (ticket.client.user == user)

        if not has_access:
            return TicketMessage.objects.none()

        # Return all messages for this ticket, sorted by creation date as specified in 'ordering'
        return TicketMessage.objects.filter(ticket=ticket)


class TicketMessageCreateView(generics.CreateAPIView):
    """
    Create a new message for a specific ticket.
    
    Access Control:
    - ADMIN: Can create messages on any ticket
    - MEMBER: Can create messages on assigned tickets
    - CLIENT: Can create messages on their own tickets
    """

    serializer_class = TicketMessageCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Create message and validate user access to the ticket.
        Automatically sets the sender to the current user.
        
        Args:
            serializer: The serializer instance for the new message.
            
        Raises:
            NotFound: If the ticket does not exist.
            PermissionDenied: If the user does not have access to the ticket.
        """
        ticket_id = self.kwargs.get('ticket_id')

        # Verify ticket exists
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            raise NotFound("Ticket not found.")

        # Check user access to this ticket
        user = self.request.user
        has_access = False

        if user.role == User.Role.ADMIN:
            has_access = True
        elif user.role == User.Role.MEMBER:
            has_access = (ticket.assigned_to and ticket.assigned_to.user == user)
        elif user.role == User.Role.CLIENT:
            has_access = (ticket.client.user == user)

        if not has_access:
            raise PermissionDenied(
                "You do not have permission to add messages to this ticket."
            )

        # Create message with ticket and sender (current authenticated user)
        serializer.save(ticket=ticket, sender=user)


class TicketMessageMarkReadView(generics.UpdateAPIView):
    """
    Mark a specific message as read.
    
    Only the intended recipient of the message or the ADMIN can mark it as read.
    """

    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return all messages accessible to the user based on their role.
        
        Returns:
            QuerySet: A filtered queryset of TicketMessage objects.
        """
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return TicketMessage.objects.all()
        
        # For non-admin users, only return messages for tickets they have access to
        if user.role == User.Role.MEMBER:
            return TicketMessage.objects.filter(
                ticket__assigned_to__user=user
            )
        
        if user.role == User.Role.CLIENT:
            return TicketMessage.objects.filter(
                ticket__client__user=user
            )
        
        return TicketMessage.objects.none()

    def perform_update(self, serializer):
        """
        Only allow updating the is_read field for authorized users.
        
        Args:
            serializer: The serializer instance for the update.
            
        Raises:
            PermissionDenied: If the user is not authorized to mark the message as read.
        """
        message = self.get_object()
        
        # Allow admin and the recipient to mark as read
        if self.request.user.role == User.Role.ADMIN:
            serializer.save()
        elif message.ticket.client.user == self.request.user:
            # Client marking message from member as read
            serializer.save()
        elif (message.ticket.assigned_to and 
              message.ticket.assigned_to.user == self.request.user):
            # Member marking message from client as read
            serializer.save()
        else:
            raise PermissionDenied(
                "You cannot mark this message as read."
            )

    def patch(self, request, *args, **kwargs):
        """
        Only allow patching the is_read field.
        
        Args:
            request: The request object.
            
        Returns:
            Response: The updated message data.
            
        Raises:
            PermissionDenied: If an attempt is made to update fields other than is_read.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Explicitly restrict updates to the 'is_read' field only
        if 'is_read' in request.data:
            instance.is_read = request.data['is_read']
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(
                data=serializer.data,
                status=status.HTTP_200_OK
            )
        else:
            raise PermissionDenied(
                "Only is_read field can be updated."
            )
