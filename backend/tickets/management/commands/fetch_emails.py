import os
from django.core.management.base import BaseCommand
import imaplib
import email
import re

from datetime import datetime, timedelta

from tickets.models.ticket import Ticket
from tickets.models.client import Client
from core.models import Issue, SubIssue


class Command(BaseCommand):
    help = "Fetch emails and create tickets"

    def handle(self, *args, **kwargs):
        # Fetch email from environment variables first, fallback to default
        EMAIL = os.getenv('GEMAIL') or os.getenv('EMAIL_HOST_USER') or "samirmondal1789@gmail.com"
        PASSWORD = os.getenv('GPASSWORD') or os.getenv('EMAIL_HOST_PASSWORD')

        if not PASSWORD:
            self.stdout.write(self.style.ERROR("Error: GPASSWORD/EMAIL_HOST_PASSWORD environment variable is not set."))
            return

        try:
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(EMAIL, PASSWORD)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"IMAP Connection/Authentication failed: {e}"))
            return

        try:
            mail.select("inbox")
            since_date = (datetime.now() - timedelta(days=7)).strftime("%d-%b-%Y")
            status, messages = mail.search(None, f'(UNSEEN SINCE {since_date})')
            
            if status != "OK" or not messages[0]:
                self.stdout.write(self.style.SUCCESS("No unread emails found"))
                return

            mail_ids = messages[0].split()

            if not mail_ids:
                self.stdout.write(self.style.SUCCESS("No unread emails found"))
                return

            self.stdout.write(self.style.SUCCESS(f"Found {len(mail_ids)} unread emails. Processing..."))

            for mail_id in mail_ids:
                try:
                    status, msg_data = mail.fetch(mail_id, "(RFC822)")
                    if status != "OK" or not msg_data:
                        self.stdout.write(self.style.WARNING(f"Failed to fetch email ID: {mail_id}"))
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    # Extract sender email
                    sender_email = email.utils.parseaddr(msg["From"])[1]
                    self.stdout.write(f"\nProcessing email from: {sender_email}")

                    # Extract body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            if content_type == "text/plain":
                                charset = part.get_content_charset() or 'utf-8'
                                body = part.get_payload(decode=True).decode(charset, errors='replace')
                                break
                    else:
                        charset = msg.get_content_charset() or 'utf-8'
                        body = msg.get_payload(decode=True).decode(charset, errors='replace')

                    # Parse fields using robust regex with DOTALL and non-greedy lookaheads
                    issue_match = re.search(
                        r"Issue\s*[:=-]\s*(.*?)\s*(?=(?:Sub\s*[-]?\s*Issue|Description)\s*[:=-]|$)",
                        body,
                        re.IGNORECASE | re.DOTALL
                    )
                    sub_issue_match = re.search(
                        r"Sub\s*[-]?\s*Issue\s*[:=-]\s*(.*?)\s*(?=(?:Issue|Description)\s*[:=-]|$)",
                        body,
                        re.IGNORECASE | re.DOTALL
                    )
                    description_match = re.search(
                        r"Description\s*[:=-]\s*(.*?)\s*(?=(?:Issue|Sub\s*[-]?\s*Issue)\s*[:=-]|$)",
                        body,
                        re.IGNORECASE | re.DOTALL
                    )

                    issue = " ".join(issue_match.group(1).split()) if (issue_match and issue_match.group(1)) else None
                    sub_issue = " ".join(sub_issue_match.group(1).split()) if (sub_issue_match and sub_issue_match.group(1)) else None
                    description = description_match.group(1).strip() if (description_match and description_match.group(1)) else None

                    self.stdout.write(f"Issue: {issue}")
                    self.stdout.write(f"Sub Issue: {sub_issue}")
                    self.stdout.write(f"Description: {description}")

                    if not issue or not sub_issue:
                        self.stdout.write(self.style.WARNING("Missing Issue or Sub Issue in email. Marking as read to avoid infinite loop."))
                        mail.store(mail_id, '+FLAGS', '\\Seen')
                        continue

                    # Find client by sender email
                    try:
                        client = Client.objects.get(email__iexact=sender_email)
                    except Client.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Client with email '{sender_email}' not found. Marking email as read."))
                        mail.store(mail_id, '+FLAGS', '\\Seen')
                        continue

                    # Get Issue and SubIssue objects
                    try:
                        issue_obj = Issue.objects.get(name__iexact=issue)
                    except Issue.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Issue '{issue}' not found in DB. Marking email as read."))
                        mail.store(mail_id, '+FLAGS', '\\Seen')
                        continue

                    try:
                        # Fix: Check that the SubIssue matches both the name and the linked issue_obj
                        sub_issue_obj = SubIssue.objects.get(issue=issue_obj, name__iexact=sub_issue)
                    except SubIssue.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"SubIssue '{sub_issue}' not found under Issue '{issue}' in DB. Marking email as read."))
                        mail.store(mail_id, '+FLAGS', '\\Seen')
                        continue
                    except SubIssue.MultipleObjectsReturned:
                        self.stdout.write(self.style.ERROR(f"Multiple SubIssues found with name '{sub_issue}' under '{issue}'. Marking email as read."))
                        mail.store(mail_id, '+FLAGS', '\\Seen')
                        continue

                    # Create ticket
                    ticket = Ticket.objects.create(
                        client=client,
                        issue=issue_obj,
                        sub_issue=sub_issue_obj,
                        description=description or ""
                    )

                    self.stdout.write(self.style.SUCCESS(f"Ticket Created Successfully. Ticket Number: {ticket.ticket_number}"))
                    
                    # Successfully processed, mark as read
                    mail.store(mail_id, '+FLAGS', '\\Seen')

                except Exception as loop_err:
                    self.stdout.write(self.style.ERROR(f"Unexpected error processing email {mail_id}: {loop_err}"))
                    # Mark seen on loop error to prevent blocking other email processing indefinitely
                    mail.store(mail_id, '+FLAGS', '\\Seen')

        finally:
            mail.logout()