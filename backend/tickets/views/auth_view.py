"""
Authentication views for the ticketing system.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


class LogoutView(APIView):
    """
    View to handle user logout by blacklisting the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handle POST request for logout.
        
        Args:
            request: The request object containing the refresh token in request.data.
            
        Returns:
            Response: Success message if logout is successful, error message otherwise.
        """
        try:
            # Extract the refresh token from the request body
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            
            # Blacklist the token to prevent further use
            token.blacklist()

            return Response(
                {"detail": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )

        except Exception:
            # Handle cases where the token might be invalid, missing, or already expired
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
