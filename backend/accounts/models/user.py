"""
User models for the accounts app.
Defines the custom User model with role-based access control.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    
    Provides role-based access control with three user types:
    - ADMIN: Full system access
    - MEMBER: Support staff who handle tickets
    - CLIENT: End users who create and track tickets
    """

    class Role(models.TextChoices):
        """User role choices"""
        ADMIN = "ADMIN", "Admin"
        MEMBER = "MEMBER", "Member"
        CLIENT = "CLIENT", "Client"

    # User's role in the system (determines permissions)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CLIENT,
        help_text="User's role determines system access and permissions"
    )

    def __str__(self):
        """String representation: username - role"""
        return f"{self.username} - {self.role}"