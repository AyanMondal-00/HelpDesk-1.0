from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.models import Issue, SubIssue
from core.serializers import IssueSerializer, SubIssueSerializer


class IssueListView(generics.ListAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for dropdown lists
    
    def get_queryset(self):
        return Issue.objects.all()


class SubIssueListView(generics.ListAPIView):
    queryset = SubIssue.objects.all()
    serializer_class = SubIssueSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for dropdown lists
    
    def get_queryset(self):
        return SubIssue.objects.all()
