"""
Common app models - Shared/reusable models
"""
from django.db import models
from django.conf import settings


class Tag(models.Model):
    """Shared tags used across the platform."""
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#38BDF8')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ActivityLog(models.Model):
    """Platform-wide activity log."""

    class Action(models.TextChoices):
        CREATED = 'created', 'Created'
        UPDATED = 'updated', 'Updated'
        DELETED = 'deleted', 'Deleted'
        VIEWED = 'viewed', 'Viewed'
        ANALYZED = 'analyzed', 'Analyzed'
        EXPORTED = 'exported', 'Exported'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    resource_type = models.CharField(max_length=50)
    resource_id = models.IntegerField(null=True, blank=True)
    resource_title = models.CharField(max_length=300, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'common_activity_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} {self.action} {self.resource_type}"
