from django.urls import path
from core.views import IssueListView, SubIssueListView, CompanyTypeListView

urlpatterns = [
    path("issues/", IssueListView.as_view()),
    path("subissues/", SubIssueListView.as_view()),
    path("company-types/", CompanyTypeListView.as_view()),
]