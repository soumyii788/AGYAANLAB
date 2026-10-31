from django.contrib import admin
from .models import Source


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'source_type', 'status', 'project', 'publication_year']
    list_filter = ['source_type', 'status']
    search_fields = ['title', 'authors', 'doi']
