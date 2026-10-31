from rest_framework import serializers
from .models import Analysis, Claim, Evidence


class AnalysisSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'results', 'error_message',
                            'started_at', 'completed_at', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EvidenceSerializer(serializers.ModelSerializer):
    source_title = serializers.CharField(source='source.title', read_only=True)
    source_url = serializers.SerializerMethodField()
    source_type = serializers.CharField(source='source.source_type', read_only=True)

    class Meta:
        model = Evidence
        fields = [
            'id',
            'claim',
            'source',
            'source_title',
            'source_url',
            'source_type',
            'passage',
            'page_number',
            'char_start',
            'char_end',
            'similarity_score',
            'is_verified',
            'created_at',
        ]
        read_only_fields = fields

    def get_source_url(self, obj):
        if not obj.source:
            return ""
        return obj.source.canonical_url or obj.source.original_url or obj.source.url or ""


class ClaimSerializer(serializers.ModelSerializer):
    evidence_items = EvidenceSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    source_title = serializers.CharField(source='source.title', read_only=True)
    source_url = serializers.SerializerMethodField()
    source_type = serializers.CharField(source='source.source_type', read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id',
            'project',
            'project_title',
            'source',
            'source_title',
            'source_url',
            'source_type',
            'claim_text',
            'subject',
            'attribute',
            'value',
            'claim_type',
            'confidence',
            'evidence_items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_source_url(self, obj):
        if not obj.source:
            return ""
        return obj.source.canonical_url or obj.source.original_url or obj.source.url or ""
