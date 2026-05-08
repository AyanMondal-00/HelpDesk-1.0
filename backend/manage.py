#!/usr/bin/env python
"""
Command-line utility for administrative tasks in the HelpDesk project.

This script acts as a wrapper around django-admin, providing a convenient way
to run management commands such as starting the server, running migrations,
and creating superusers.
"""
import os
import sys


def main():
    """
    Configure the environment and execute the requested management command.
    """
    # Set default settings module if not already provided via environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # Provide a helpful error message if Django is missing
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
        
    # Delegate command execution to Django's management utility
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

