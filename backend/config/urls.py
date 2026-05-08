"""
Main URL configuration for the HelpDesk project.

This module routes requests to the appropriate application-specific URL
configurations or directly to views for core services like admin and JWT auth.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django Administration portal
    path('admin/', admin.site.urls),

    # Authentication endpoints using SimpleJWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Application-specific API endpoints
    path("api/", include("tickets.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),

    # Chained selection support for dependent dropdowns in the admin
    path('chaining/', include('smart_selects.urls')),
]