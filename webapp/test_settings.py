"""Test-only settings overrides."""
from .settings import *  # noqa: F401, F403

# Django 4.0 requires CSRF_TRUSTED_ORIGINS values to include a scheme.
CSRF_TRUSTED_ORIGINS = ["https://group3.gcs-camp-conference.org"]
