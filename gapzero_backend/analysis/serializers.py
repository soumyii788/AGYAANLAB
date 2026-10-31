from rest_framework import serializers
from .models import (
    Analysis,
    Claim,
    Evidence,
    ResearchQuestion,
    QuestionCoverage,
    Finding,
    FindingEvidence,
    ChecklistItem,
)


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


# =============================================================================
# RESEARCH QUESTIONS & COVERAGE SERIALIZERS
# =============================================================================

class QuestionCoverageSerializer(serializers.ModelSerializer):
    mapped_claims = ClaimSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionCoverage
        fields = [
            'id',
            'status',
            'coverage_score',
            'resolution_explanation',
            'mapped_claims',
            'last_evaluated_at',
        ]
        read_only_fields = fields


class ResearchQuestionSerializer(serializers.ModelSerializer):
    coverage = QuestionCoverageSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = ResearchQuestion
        fields = [
            'id',
            'project',
            'project_title',
            'question_text',
            'importance',
            'domain_category',
            'coverage',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# FINDINGS & FINDING EVIDENCE SERIALIZERS
# =============================================================================

class FindingEvidenceSerializer(serializers.ModelSerializer):
    source_title = serializers.CharField(source='source.title', read_only=True)
    source_url = serializers.SerializerMethodField()
    source_type = serializers.CharField(source='source.source_type', read_only=True)
    claim_subject = serializers.CharField(source='claim.subject', read_only=True)
    claim_value = serializers.CharField(source='claim.value', read_only=True)

    class Meta:
        model = FindingEvidence
        fields = [
            'id',
            'finding',
            'evidence',
            'claim',
            'claim_subject',
            'claim_value',
            'source',
            'source_title',
            'source_url',
            'source_type',
            'passage',
            'role',
            'created_at',
        ]
        read_only_fields = fields

    def get_source_url(self, obj):
        if not obj.source:
            return ""
        return obj.source.canonical_url or obj.source.original_url or obj.source.url or ""


class FindingSerializer(serializers.ModelSerializer):
    evidence_links = FindingEvidenceSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)

    class Meta:
        model = Finding
        fields = [
            'id',
            'project',
            'project_title',
            'finding_type',
            'severity',
            'title',
            'description',
            'explanation',
            'is_ai_suggestion',
            'question',
            'question_text',
            'metadata',
            'evidence_links',
            'created_at',
        ]
        read_only_fields = fields


# =============================================================================
# CHECKLIST ITEM SERIALIZER
# =============================================================================

class ChecklistItemSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    finding_title = serializers.CharField(source='finding.title', read_only=True)
    finding_type = serializers.CharField(source='finding.finding_type', read_only=True)
    completed_by_name = serializers.CharField(source='completed_by.full_name', read_only=True)

    class Meta:
        model = ChecklistItem
        fields = [
            'id',
            'project',
            'project_title',
            'finding',
            'finding_title',
            'finding_type',
            'task_text',
            'rationale',
            'priority',
            'is_completed',
            'completed_at',
            'completed_by',
            'completed_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
