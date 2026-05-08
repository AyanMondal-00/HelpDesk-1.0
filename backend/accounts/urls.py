from django.urls import path
from accounts.views import ProfileView
from accounts.views.user_admin_views import UserAdminListView, UserAdminDetailView

urlpatterns = [
    path("me/", ProfileView.as_view()),
    path("users/", UserAdminListView.as_view()),
    path("users/<int:pk>/", UserAdminDetailView.as_view()),
]