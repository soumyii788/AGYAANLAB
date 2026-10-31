from django.contrib import admin
from .models import ResearchProject, ResearchNote


@admin.register(ResearchProject)
class ResearchProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'domain', 'status', 'owner', 'gap_score', 'created_at']
    list_filter = ['status', 'domain', 'is_public']
    search_fields = ['title', 'description']
    filter_horizontal = ['collaborators']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ResearchNote)
class ResearchNoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'author', 'is_pinned', 'created_at']
    list_filter = ['is_pinned']
    search_fields = ['title', 'content']
