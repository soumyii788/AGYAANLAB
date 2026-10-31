#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r gapzero_backend/requirements.txt

echo "==> Collecting static files..."
python gapzero_backend/manage.py collectstatic --no-input

echo "==> Running database migrations..."
python gapzero_backend/manage.py migrate

echo "==> Seeding initial demo data and accounts..."
python gapzero_backend/manage.py seed_data
