"""
ASGI configuration for the HelpDesk project.

This module exposes the ASGI callable as a module-level variable named `application`.
ASGI (Asynchronous Server Gateway Interface) is used for running the project on
asynchronous servers like Daphne or Uvicorn.
"""

import os

from django.core.asgi import get_asgi_application

# Set the default Django settings module for the 'asgi' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# The application object is used by the ASGI server to handle requests.
application = get_asgi_application()

