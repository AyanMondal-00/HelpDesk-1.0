from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend that allows authentication using either
    the username or the email address.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        
        try:
            # Look up the user by username OR email (case-insensitive)
            user = UserModel.objects.filter(
                Q(username__iexact=username) | Q(email__iexact=username)
            ).first()
            
            if user is None:
                # Run password hashers to protect against timing attacks
                UserModel().set_password(password)
                return None
        except Exception:
            UserModel().set_password(password)
            return None

        # Check password and check if user is active/can authenticate
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
