from rest_framework import serializers
from .models import Source


class SourceSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    extracted_text_preview = serializers.SerializerMethodField()

    class Meta:
        model = Source
        fields = [
            'id',
            'project',
            'project_title',
            'added_by',
            'added_by_name',
            'title',
            'source_type',
            'processing_status',
            'original_url',
            'canonical_url',
            'publication_date',
            'modified_date',
            'authors',
            'pdf_file',
            'file_size',
            'page_count',
            'extracted_text',
            'extracted_text_preview',
            'extracted_pages',
            'content_hash',
            'error_message',
            'metadata',
            'url',
            'doi',
            'publication_year',
            'journal',
            'abstract',
            'status',
            'relevance_score',
            'tags',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'added_by',
            'content_hash',
            'file_size',
            'page_count',
            'extracted_pages',
            'canonical_url',
            'created_at',
            'updated_at',
        ]

    def get_extracted_text_preview(self, obj):
        text = obj.extracted_text or obj.abstract or ''
        return text[:350] + ('...' if len(text) > 350 else '')


class SourceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing cards without heavy full text payloads."""
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    extracted_text_preview = serializers.SerializerMethodField()

    class Meta:
        model = Source
        fields = [
            'id',
            'project',
            'project_title',
            'added_by_name',
            'title',
            'source_type',
            'processing_status',
            'original_url',
            'canonical_url',
            'publication_date',
            'authors',
            'file_size',
            'page_count',
            'extracted_text_preview',
            'content_hash',
            'error_message',
            'journal',
            'doi',
            'created_at',
        ]

    def get_extracted_text_preview(self, obj):
        text = obj.extracted_text or obj.abstract or ''
        return text[:250] + ('...' if len(text) > 250 else '')
