from django.contrib import admin
from .models import Tag, ActivityLog


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'created_at']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'resource_title', 'created_at']
    list_filter = ['action', 'resource_type']
    readonly_fields = ['created_at']
