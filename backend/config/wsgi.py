"""
WSGI configuration for the HelpDesk project.

This module exposes the WSGI callable as a module-level variable named `application`.
WSGI (Web Server Gateway Interface) is the standard for running Django on
synchronous servers like Gunicorn or uWSGI.
"""

import os

from django.core.wsgi import get_wsgi_application

# Set the default Django settings module for the 'wsgi' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# The application object is used by the WSGI server to handle requests.
application = get_wsgi_application()

