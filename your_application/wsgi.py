import os
import sys
from pathlib import Path

# Add gapzero_backend to sys.path so apps, settings, and manage can be found
BASE_DIR = Path(__file__).resolve().parent.parent / 'gapzero_backend'
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gapzero_backend.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
