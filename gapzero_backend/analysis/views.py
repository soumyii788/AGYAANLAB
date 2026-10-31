import logging
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from research.models import ResearchProject
from sources.models import Source
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
from .serializers import (
    AnalysisSerializer,
    ClaimSerializer,
    EvidenceSerializer,
    ResearchQuestionSerializer,
    QuestionCoverageSerializer,
    FindingSerializer,
    FindingEvidenceSerializer,
    ChecklistItemSerializer,
)
from .core_engine import (
    InformationGapDetector,
    ContradictionDetector,
    FreshnessAnalyzer,
    VerificationChecklistGenerator,
    UnifiedIntelligenceOrchestrator,
)
from .claim_extraction_service import (
    ClaimExtractionEngine,
    LLMConfigurationError,
    LLMRateLimitError,
    LLMAPIError,
    ExtractionServiceError,
)
from common.ai_service import analyze_research_gaps

logger = logging.getLogger(__name__)


class AnalysisListCreateView(generics.ListCreateAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'analysis_type', 'status']
    ordering_fields = ['created_at', 'status', 'title']

    def get_queryset(self):
        user = self.request.user
        queryset = Analysis.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        analysis_type = self.request.query_params.get('type')
        if analysis_type:
            queryset = queryset.filter(analysis_type=analysis_type)

        return queryset


class AnalysisDetailView(generics.RetrieveAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Analysis.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()


class RunGapAnalysisView(APIView):
    """
    Executes real negative-space gap detection using Groq LLM
    across all ingested literature sources and project notes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Check permissions
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have access to this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        sources = list(project.sources.all())
        notes = list(project.notes.all())

        started_at = timezone.now()

        try:
            # Real LLM call via Groq
            ai_result = analyze_research_gaps(project, sources, notes)

            # Update project gap score and summary
            if 'gap_score' in ai_result:
                project.gap_score = float(ai_result['gap_score'])
            if 'gap_summary' in ai_result and ai_result['gap_summary']:
                project.gap_summary = ai_result['gap_summary']
            project.save()

            # Record analysis in database
            analysis = Analysis.objects.create(
                project=project,
                created_by=request.user,
                analysis_type=Analysis.AnalysisType.GAP_DETECTION,
                status=Analysis.Status.COMPLETED,
                title=f"Empirical Gap Detection — {project.title[:60]}",
                parameters={
                    'sources_analyzed': len(sources),
                    'notes_analyzed': len(notes),
                },
                results=ai_result,
                started_at=started_at,
                completed_at=timezone.now(),
            )

            serializer = AnalysisSerializer(analysis)
            return Response({
                'analysis': serializer.data,
                'project': {
                    'id': project.id,
                    'gap_score': project.gap_score,
                    'gap_summary': project.gap_summary,
                },
                'message': 'Negative space analysis completed successfully.'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            Analysis.objects.create(
                project=project,
                created_by=request.user,
                analysis_type=Analysis.AnalysisType.GAP_DETECTION,
                status=Analysis.Status.FAILED,
                title=f"Failed Gap Detection — {project.title[:60]}",
                error_message=str(e),
                started_at=started_at,
                completed_at=timezone.now(),
            )
            return Response(
                {'error': f"AI Gap detection failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# CLAIM & EVIDENCE EXTRACTION VIEWS
# =============================================================================

class ExtractClaimsView(APIView):
    """
    Executes AI extraction to convert an ingested source into atomic,
    verifiable claims backed by exact verbatim passages.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        source_id = request.data.get('source_id')
        project_id = request.data.get('project_id')

        if not source_id and not project_id:
            return Response(
                {'error': 'Either source_id or project_id must be provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        engine = ClaimExtractionEngine(user=user)

        # Single source extraction
        if source_id:
            source = get_object_or_404(Source, pk=source_id)

            # Check permission
            if source.project and source.project.owner != user and not source.project.collaborators.filter(id=user.id).exists():
                if source.added_by != user:
                    return Response(
                        {'error': 'You do not have permission to analyze this source.'},
                        status=status.HTTP_403_FORBIDDEN
                    )

            try:
                result = engine.extract_from_source(source)
                serialized_claims = ClaimSerializer(result['saved_claims'], many=True).data

                return Response({
                    'message': f"Extracted {result['claims_extracted']} verified claims from '{source.title}'.",
                    'source_id': source.id,
                    'source_title': source.title,
                    'claims_extracted': result['claims_extracted'],
                    'claims_rejected': result['claims_rejected'],
                    'claims': serialized_claims,
                }, status=status.HTTP_201_CREATED)

            except LLMConfigurationError as e:
                # Requirement: If API key is unavailable, display a proper configuration error rather than returning fabricated analysis
                return Response({
                    'error': 'LLM API Configuration Required',
                    'detail': str(e),
                    'code': 'LLM_CONFIG_MISSING'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            except LLMRateLimitError as e:
                return Response({
                    'error': 'Rate Limit Exceeded',
                    'detail': str(e),
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            except ExtractionServiceError as e:
                return Response({
                    'error': 'Extraction Failed',
                    'detail': str(e),
                }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            except Exception as e:
                logger.exception("Unexpected error during claim extraction")
                return Response({
                    'error': f"Internal extraction error: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Multi-source project extraction
        if project_id:
            project = get_object_or_404(ResearchProject, pk=project_id)
            if project.owner != user and not project.collaborators.filter(id=user.id).exists():
                return Response(
                    {'error': 'You do not have permission to analyze this project.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            sources = project.sources.filter(
                Q(processing_status=Source.ProcessingStatus.COMPLETED) |
                Q(processing_status='completed')
            )

            if not sources.exists():
                return Response({
                    'error': 'No completed sources found in this project to extract claims from.'
                }, status=status.HTTP_400_BAD_REQUEST)

            total_extracted = 0
            total_rejected = 0
            results_list = []

            try:
                for src in sources:
                    res = engine.extract_from_source(src)
                    total_extracted += res['claims_extracted']
                    total_rejected += res['claims_rejected']
                    results_list.append({
                        'source_id': src.id,
                        'source_title': src.title,
                        'extracted': res['claims_extracted'],
                    })

                all_claims = Claim.objects.filter(project=project)
                serialized = ClaimSerializer(all_claims, many=True).data

                return Response({
                    'message': f"Extracted {total_extracted} verified claims across {len(sources)} source(s).",
                    'total_extracted': total_extracted,
                    'total_rejected': total_rejected,
                    'sources_analyzed': len(sources),
                    'results': results_list,
                    'claims': serialized,
                }, status=status.HTTP_201_CREATED)

            except LLMConfigurationError as e:
                return Response({
                    'error': 'LLM API Configuration Required',
                    'detail': str(e),
                    'code': 'LLM_CONFIG_MISSING'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            except Exception as e:
                logger.exception("Unexpected error during project claim extraction")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClaimListView(generics.ListAPIView):
    """
    Lists extracted claims with comprehensive filtering:
    - project
    - source
    - claim_type (empirical, methodological, theoretical, etc.)
    - min_confidence
    - search (searches claim_text, subject, attribute, value, passage)
    """
    serializer_class = ClaimSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['claim_text', 'subject', 'attribute', 'value', 'evidence_items__passage']
    ordering_fields = ['created_at', 'confidence', 'subject', 'claim_type']

    def get_queryset(self):
        user = self.request.user
        queryset = Claim.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True) | Q(created_by=user)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        source_id = self.request.query_params.get('source')
        if source_id:
            queryset = queryset.filter(source_id=source_id)

        claim_type = self.request.query_params.get('claim_type') or self.request.query_params.get('type')
        if claim_type and claim_type != 'all':
            queryset = queryset.filter(claim_type=claim_type)

        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            try:
                queryset = queryset.filter(confidence__gte=float(min_confidence))
            except ValueError:
                pass

        return queryset.prefetch_related('evidence_items', 'source', 'project')


class ClaimDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieves a single claim with nested evidence items, or deletes it.
    """
    serializer_class = ClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Claim.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(created_by=user)
        ).distinct()


class EvidenceListView(generics.ListAPIView):
    """
    Lists evidence passages with source provenance and verification status.
    """
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['passage', 'source__title', 'claim__subject']
    ordering_fields = ['created_at', 'page_number', 'similarity_score']

    def get_queryset(self):
        user = self.request.user
        queryset = Evidence.objects.filter(
            Q(claim__project__owner=user) | Q(claim__project__collaborators=user) | Q(claim__created_by=user)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(claim__project_id=project_id)

        source_id = self.request.query_params.get('source')
        if source_id:
            queryset = queryset.filter(source_id=source_id)

        claim_id = self.request.query_params.get('claim')
        if claim_id:
            queryset = queryset.filter(claim_id=claim_id)

        return queryset.select_related('claim', 'source')


class EvidenceExplorerStatsView(APIView):
    """
    Returns aggregated metrics and distributions for the Evidence Explorer dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        project_id = request.query_params.get('project')

        claims_qs = Claim.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(created_by=user)
        ).distinct()
        evidence_qs = Evidence.objects.filter(
            Q(claim__project__owner=user) | Q(claim__project__collaborators=user) | Q(claim__created_by=user)
        ).distinct()

        if project_id and project_id != 'all':
            claims_qs = claims_qs.filter(project_id=project_id)
            evidence_qs = evidence_qs.filter(claim__project_id=project_id)

        total_claims = claims_qs.count()
        total_evidence = evidence_qs.count()
        avg_confidence = claims_qs.aggregate(avg=Avg('confidence'))['avg'] or 0.0

        # Claims by type
        type_counts = dict(claims_qs.values('claim_type').annotate(count=Count('id')).values_list('claim_type', 'count'))

        # Sources with extracted claims
        sources_count = claims_qs.values('source_id').distinct().count()

        return Response({
            'total_claims': total_claims,
            'total_evidence': total_evidence,
            'sources_analyzed': sources_count,
            'avg_confidence': round(avg_confidence * 100, 1),
            'claims_by_type': type_counts,
        })


# =============================================================================
# CORE INTELLIGENCE ENGINE VIEWS (MODULES 1 - 4 & ORCHESTRATION)
# =============================================================================

class RunIntelligenceEngineView(APIView):
    """
    Executes the complete 4-module intelligence pipeline:
    1. Information Gap Detection
    2. Contradiction Detection
    3. Freshness Analysis
    4. Verification Checklist
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response({'error': 'You do not have access to this project.'}, status=status.HTTP_403_FORBIDDEN)

        policy = request.data.get('policy', {})
        force_regenerate = request.data.get('force_regenerate_questions', False)

        try:
            orchestrator = UnifiedIntelligenceOrchestrator(project, user=request.user, policy=policy)
            results = orchestrator.run_full_pipeline(force_regenerate_questions=force_regenerate)
            return Response(results, status=status.HTTP_201_CREATED)

        except LLMConfigurationError as e:
            return Response({
                'error': 'LLM API Configuration Required',
                'detail': str(e),
                'code': 'LLM_CONFIG_MISSING'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except LLMRateLimitError as e:
            return Response({'error': 'Rate Limit Exceeded', 'detail': str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        except Exception as e:
            logger.exception("Unified intelligence pipeline execution error")
            return Response({'error': f"Intelligence engine execution failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RunModule1GapDetectionView(APIView):
    """Runs Module 1 (Information Gap Detection) independently."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)
        force_regenerate = request.data.get('force_regenerate', False)

        try:
            detector = InformationGapDetector(project, user=request.user)
            results = detector.run(force_regenerate=force_regenerate)
            return Response(results, status=status.HTTP_200_OK)
        except LLMConfigurationError as e:
            return Response({'error': 'LLM Configuration Error', 'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception("Module 1 Gap Detection error")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RunModule2ContradictionView(APIView):
    """Runs Module 2 (Contradiction Detection) independently."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)

        try:
            detector = ContradictionDetector(project, user=request.user)
            results = detector.run()
            return Response(results, status=status.HTTP_200_OK)
        except LLMConfigurationError as e:
            return Response({'error': 'LLM Configuration Error', 'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception("Module 2 Contradiction error")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RunModule3FreshnessView(APIView):
    """Runs Module 3 (Freshness Analysis) independently."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)
        policy = request.data.get('policy', {})

        try:
            analyzer = FreshnessAnalyzer(project, policy=policy, user=request.user)
            results = analyzer.run()
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Module 3 Freshness error")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RunModule4ChecklistView(APIView):
    """Runs Module 4 (Verification Checklist) independently."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)
        refresh = request.data.get('refresh', False)

        try:
            generator = VerificationChecklistGenerator(project, user=request.user)
            results = generator.run(refresh=refresh)
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Module 4 Checklist error")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# QUERIES: QUESTIONS, FINDINGS, CHECKLIST, STATUS
# =============================================================================

class ResearchQuestionListView(generics.ListAPIView):
    """Lists research subquestions with their coverage metrics."""
    serializer_class = ResearchQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question_text', 'domain_category', 'coverage__resolution_explanation']
    ordering_fields = ['importance', 'created_at', 'coverage__coverage_score']

    def get_queryset(self):
        user = self.request.user
        queryset = ResearchQuestion.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        importance = self.request.query_params.get('importance')
        if importance and importance != 'all':
            queryset = queryset.filter(importance=importance)

        coverage_status = self.request.query_params.get('status')
        if coverage_status and coverage_status != 'all':
            queryset = queryset.filter(coverage__status=coverage_status)

        return queryset.select_related('coverage', 'project')


class FindingListView(generics.ListAPIView):
    """
    Lists epistemic findings (gaps, contradictions, freshness warnings)
    with linked multi-source evidence.
    """
    serializer_class = FindingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'explanation', 'metadata']
    ordering_fields = ['severity', 'created_at', 'finding_type']

    def get_queryset(self):
        user = self.request.user
        queryset = Finding.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        finding_type = self.request.query_params.get('type') or self.request.query_params.get('finding_type')
        if finding_type and finding_type != 'all':
            queryset = queryset.filter(finding_type=finding_type)

        severity = self.request.query_params.get('severity')
        if severity and severity != 'all':
            queryset = queryset.filter(severity=severity)

        return queryset.prefetch_related('evidence_links', 'project', 'question')


class FindingDetailView(generics.RetrieveAPIView):
    """Retrieves full details of a finding with preserved evidence links."""
    serializer_class = FindingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Finding.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()


class ChecklistItemListView(generics.ListCreateAPIView):
    """Lists and creates actionable verification tasks."""
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['task_text', 'rationale', 'finding__title']
    ordering_fields = ['is_completed', 'priority', 'created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = ChecklistItem.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        priority = self.request.query_params.get('priority')
        if priority and priority != 'all':
            queryset = queryset.filter(priority=priority)

        is_completed = self.request.query_params.get('completed') or self.request.query_params.get('is_completed')
        if is_completed is not None and is_completed != 'all':
            val = is_completed.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(is_completed=val)

        return queryset.select_related('project', 'finding', 'completed_by')

    def perform_create(self, serializer):
        serializer.save()


class ChecklistItemToggleView(APIView):
    """Toggles or updates the completion status of a checklist item."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        item = get_object_or_404(ChecklistItem, pk=pk)

        # Check access
        if item.project.owner != request.user and not item.project.collaborators.filter(id=request.user.id).exists():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        completed_val = request.data.get('is_completed')
        if completed_val is None:
            new_status = not item.is_completed
        else:
            new_status = bool(completed_val)

        item.is_completed = new_status
        item.completed_at = timezone.now() if new_status else None
        item.completed_by = request.user if new_status else None
        item.save()

        serializer = ChecklistItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalysisStatusView(APIView):
    """
    Returns high-level intelligence engine status and metric counts for a project.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        project_id = request.query_params.get('project')
        if not project_id:
            return Response({'error': 'project query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Questions
        questions_qs = ResearchQuestion.objects.filter(project=project)
        total_q = questions_qs.count()
        unanswered_q = questions_qs.filter(coverage__status='unanswered').count()
        partial_q = questions_qs.filter(coverage__status='partially_answered').count()
        answered_q = questions_qs.filter(coverage__status='answered').count()

        # Findings
        findings_qs = Finding.objects.filter(project=project)
        gaps_count = findings_qs.filter(finding_type='gap').count()
        contradictions_count = findings_qs.filter(finding_type='contradiction').count()
        freshness_count = findings_qs.filter(finding_type='freshness').count()

        # Checklist
        checklist_qs = ChecklistItem.objects.filter(project=project)
        total_tasks = checklist_qs.count()
        completed_tasks = checklist_qs.filter(is_completed=True).count()
        pending_tasks = total_tasks - completed_tasks

        # Sources
        sources_count = project.sources.count()
        claims_count = Claim.objects.filter(project=project).count()

        return Response({
            'project_id': project.id,
            'gap_score': project.gap_score,
            'gap_summary': project.gap_summary,
            'questions': {
                'total': total_q,
                'unanswered': unanswered_q,
                'partially_answered': partial_q,
                'answered': answered_q,
            },
            'findings': {
                'total': findings_qs.count(),
                'gaps': gaps_count,
                'contradictions': contradictions_count,
                'freshness_warnings': freshness_count,
            },
            'checklist': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': pending_tasks,
            },
            'corpus': {
                'sources': sources_count,
                'claims': claims_count,
            }
        })

