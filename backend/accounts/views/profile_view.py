"""
Views for handling user profile information in the HelpDesk system.
This module provides endpoints for users to retrieve their own account details.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.serializers import ProfileSerializer


class ProfileView(APIView):
    """
    API endpoint that allows users to view their own profile information.
    Required Authentication: JWT Token.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return the profile details of the currently authenticated user.
        
        Args:
            request: The HTTP request object containing the user's authentication details.
            
        Returns:
            Response: A DRF Response object containing the serialized user profile data.
        """
        # Serialize the current user instance from the request
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
