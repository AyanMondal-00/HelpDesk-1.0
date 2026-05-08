# Generated migration for TicketMessage model

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0009_alter_client_company_name_alter_client_company_type_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TicketMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('content', models.TextField(help_text='The message content')),
                ('is_read', models.BooleanField(default=False, help_text='Whether the message has been read by the recipient')),
                ('sender', models.ForeignKey(help_text='The user who sent this message', on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
                ('ticket', models.ForeignKey(help_text='The ticket this message belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='tickets.ticket')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
