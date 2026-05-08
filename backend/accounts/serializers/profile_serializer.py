"""
Serializers for user profile data in the HelpDesk system.
This module handles the transformation of User model instances into JSON format
for profile-related API endpoints.
"""

from rest_framework import serializers
from accounts.models import User


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model to expose basic profile information.
    Used by the authenticated user to view their own account details.
    """
    class Meta:
        """
        Meta configuration for ProfileSerializer.
        Maps the serializer to the User model and specifies the exposed fields.
        """
        model = User
        fields = ["id", "username", "email", "role"]
