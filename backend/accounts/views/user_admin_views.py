"""
Administrative views for managing user accounts in the HelpDesk system.
This module provides endpoints for system administrators to list, create, retrieve, 
and update user accounts and their associated profiles (Client/Member).
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from accounts.serializers.user_admin_serializer import UserAdminSerializer

# Get the custom User model configured for the project
User = get_user_model()


class UserAdminListView(APIView):
    """
    API View to list all users and create new user accounts.
    Accessible only by users with the Admin role.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """
        Retrieve a list of all users, ordered by their join date (newest first).
        
        Args:
            request: The HTTP request object.
            
        Returns:
            Response: A list of serialized user data.
        """
        # Fetch all users and order them by date joined descending
        users = User.objects.all().order_by("-date_joined")
        serializer = UserAdminSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a new user account and its associated profile (Client or Member).
        
        Args:
            request: The HTTP request object containing user and profile data.
            
        Returns:
            Response: The serialized data of the created user or validation errors.
        """
        serializer = UserAdminSerializer(data=request.data)
        if serializer.is_valid():
            # The serializer handles atomic creation of both User and Profile
            user = serializer.save()
            return Response(UserAdminSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAdminDetailView(APIView):
    """
    API View to retrieve, update, or partially update a specific user account.
    Accessible only by users with the Admin role.
    """
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        """
        Helper method to retrieve a user by primary key or raise a 404 error.
        
        Args:
            pk: The primary key of the user to retrieve.
            
        Returns:
            User: The user instance if found.
        """
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        """
        Retrieve details of a specific user.
        
        Args:
            request: The HTTP request object.
            pk: The primary key of the user.
            
        Returns:
            Response: Serialized data of the requested user.
        """
        user = self.get_object(pk)
        serializer = UserAdminSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        """
        Update an existing user account.
        Supports partial updates where only provided fields are changed.
        
        Args:
            request: The HTTP request object containing the updated fields.
            pk: The primary key of the user.
            
        Returns:
            Response: Serialized data of the updated user or validation errors.
        """
        user = self.get_object(pk)
        # partial=True allows omitting the password and other fields safely during updates
        serializer = UserAdminSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserAdminSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """
        Partially update an existing user account.
        Delegates to the put method with partial=True.
        
        Args:
            request: The HTTP request object.
            pk: The primary key of the user.
            
        Returns:
            Response: Serialized data of the updated user.
        """
        return self.put(request, pk)
