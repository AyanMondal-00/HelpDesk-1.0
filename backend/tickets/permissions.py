from rest_framework.permissions import BasePermission
from accounts.models import User


class IsAdminUserRole(BasePermission):
    """
    Allow access only to users with ADMIN role.
    Used for admin-only endpoints (user management, analytics, etc.)
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsMemberUserRole(BasePermission):
    """
    Allow access only to users with MEMBER role.
    Used for member-only operations (view assigned tickets, update status)
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.MEMBER
        )


class IsClientUserRole(BasePermission):
    """
    Allow access only to users with CLIENT role.
    Used for client operations (create tickets, view own tickets)
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.CLIENT
        )


class IsAdminOrMember(BasePermission):
    """
    Allow access to ADMIN and MEMBER roles.
    Used for endpoints that both admins and members need (dashboard analytics)
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [
                User.Role.ADMIN,
                User.Role.MEMBER,
            ]
        )