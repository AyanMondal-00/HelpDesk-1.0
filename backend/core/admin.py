"""
Admin configuration for the core application.

This module registers the core models (CompanyType, Issue, SubIssue) 
with the Django admin site to allow for easy management through the web interface.
"""
from django.contrib import admin
from .models import CompanyType, Issue, SubIssue


# Register core models to the Django admin interface
admin.site.register(CompanyType)
admin.site.register(Issue)
admin.site.register(SubIssue)
