"""
Research app serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ResearchProject, ResearchNote

User = get_user_model()


class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ResearchNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = ResearchNote
        fields = ['id', 'project', 'author', 'author_name', 'title', 'content',
                  'is_pinned', 'created_at', 'updated_at']
        read_only_fields = ['id', 'project', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class ResearchProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    collaborators = CollaboratorSerializer(many=True, read_only=True)
    collaborator_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=User.objects.all(),
        source='collaborators', required=False
    )
    sources_count = serializers.ReadOnlyField()
    analyses_count = serializers.ReadOnlyField()

    class Meta:
        model = ResearchProject
        fields = [
            'id', 'title', 'description', 'domain', 'status', 'keywords',
            'owner', 'owner_name', 'owner_email', 'collaborators', 'collaborator_ids',
            'gap_summary', 'gap_score', 'is_public',
            'sources_count', 'analyses_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ResearchProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project list views."""
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    sources_count = serializers.ReadOnlyField()
    analyses_count = serializers.ReadOnlyField()

    class Meta:
        model = ResearchProject
        fields = [
            'id', 'title', 'description', 'domain', 'status', 'keywords',
            'owner_name', 'gap_score', 'gap_summary', 'is_public',
            'sources_count', 'analyses_count',
            'created_at', 'updated_at'
        ]
