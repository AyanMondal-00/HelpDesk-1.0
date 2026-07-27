from django.test import TestCase
from django.contrib.auth import authenticate
from accounts.models import User

class EmailOrUsernameAuthTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="securepassword123"
        )

    def test_authenticate_by_username(self):
        user = authenticate(username="testuser", password="securepassword123")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "testuser")

    def test_authenticate_by_email(self):
        user = authenticate(username="testuser@example.com", password="securepassword123")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "testuser")

    def test_authenticate_by_username_case_insensitive(self):
        user = authenticate(username="TESTUSER", password="securepassword123")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "testuser")

    def test_authenticate_by_email_case_insensitive(self):
        user = authenticate(username="TESTUSER@EXAMPLE.COM", password="securepassword123")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "testuser")

    def test_authenticate_wrong_password(self):
        user = authenticate(username="testuser", password="wrongpassword")
        self.assertIsNone(user)
        
        user_by_email = authenticate(username="testuser@example.com", password="wrongpassword")
        self.assertIsNone(user_by_email)

    def test_authenticate_non_existent_user(self):
        user = authenticate(username="doesnotexist", password="somepassword")
        self.assertIsNone(user)

