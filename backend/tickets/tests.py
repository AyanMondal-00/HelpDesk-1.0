from django.test import TestCase
from accounts.models import User
from tickets.models import Client, Ticket
from core.models import Issue, SubIssue, CompanyType

class TicketNumberGenerationTestCase(TestCase):
    def setUp(self):
        # Create standard test data
        self.user = User.objects.create_user(
            username="testclient",
            email="testclient@example.com",
            password="testpassword",
            role=User.Role.CLIENT
        )
        self.company_type = CompanyType.objects.create(name="Corporate")
        self.client_obj = Client.objects.create(
            user=self.user,
            company_name="Test Company",
            company_type=self.company_type,
            whatsapp_number="1234567890"
        )
        self.issue = Issue.objects.create(name="Software Issue")
        self.sub_issue = SubIssue.objects.create(
            issue=self.issue,
            name="Bug Report"
        )

    def test_ticket_number_generation_sequential(self):
        # First ticket
        t1 = Ticket.objects.create(
            client=self.client_obj,
            issue=self.issue,
            sub_issue=self.sub_issue,
            description="First bug"
        )
        self.assertEqual(t1.ticket_number, "INC00001")

        # Second ticket
        t2 = Ticket.objects.create(
            client=self.client_obj,
            issue=self.issue,
            sub_issue=self.sub_issue,
            description="Second bug"
        )
        self.assertEqual(t2.ticket_number, "INC00002")

        # Third ticket
        t3 = Ticket.objects.create(
            client=self.client_obj,
            issue=self.issue,
            sub_issue=self.sub_issue,
            description="Third bug"
        )
        self.assertEqual(t3.ticket_number, "INC00003")

