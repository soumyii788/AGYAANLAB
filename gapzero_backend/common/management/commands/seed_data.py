from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from research.models import ResearchProject, ResearchNote
from sources.models import Source
from analysis.models import Analysis

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demonstration data for GAPZERO'

    def handle(self, *args, **options):
        # Create Superuser / Lead Researcher
        user, created = User.objects.get_or_create(
            email='admin@gapzero.ai',
            defaults={
                'username': 'admin',
                'first_name': 'Chief',
                'last_name': 'Scientist',
                'role': 'admin',
                'organization': 'GAPZERO Intelligence Labs',
                'bio': 'Pioneering negative-space literature intelligence and automated research gap discovery.',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            user.set_password('gapzero123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created user: admin@gapzero.ai / gapzero123'))
        else:
            self.stdout.write('User admin@gapzero.ai already exists.')

        # Create demo research projects
        p1, p1_created = ResearchProject.objects.get_or_create(
            title='Autonomous Agent Self-Correction in Ambiguous Environments',
            owner=user,
            defaults={
                'description': 'Evaluating the frontier of autonomous reflection loops when faced with non-deterministic environmental feedback and sparse reward functions.',
                'domain': 'technology',
                'status': 'active',
                'keywords': ['AI agents', 'reinforcement learning', 'self-correction', 'sparse rewards'],
                'gap_score': 84.5,
                'gap_summary': 'Current literature predominantly evaluates reflection on deterministic benchmarks (e.g., HumanEval, GSM8K). Zero established meta-analyses evaluate failure recovery latency across asynchronous distributed agent topologies.',
                'is_public': True,
            }
        )

        p2, p2_created = ResearchProject.objects.get_or_create(
            title='CRISPR Off-Target Epigenetic Perturbations in Neural Progenitors',
            owner=user,
            defaults={
                'description': 'Cross-modal investigation of unintended histone deacetylation flanking prime-edited genomic coordinates.',
                'domain': 'healthcare',
                'status': 'active',
                'keywords': ['genomics', 'CRISPR', 'epigenetics', 'prime editing'],
                'gap_score': 68.2,
                'gap_summary': 'Longitudinal chromatin conformation tracking post-editing remains largely uncatalogued in public repositories past 72 hours.',
                'is_public': True,
            }
        )

        p3, p3_created = ResearchProject.objects.get_or_create(
            title='High-Entropy Perovskite Stability in High-Humidity Solar Cells',
            owner=user,
            defaults={
                'description': 'Predictive degradation kinetics under accelerated environmental thermal-moisture stress testing.',
                'domain': 'science',
                'status': 'draft',
                'keywords': ['materials science', 'perovskites', 'solar cells', 'degradation'],
                'gap_score': 52.0,
                'gap_summary': 'Phase boundary stability data missing under combined 85°C / 85% RH conditions.',
                'is_public': False,
            }
        )

        if p1_created:
            # Add sources to p1
            Source.objects.create(
                project=p1,
                added_by=user,
                title='Reflexion: Language Agents with Verbal Reinforcement Learning',
                authors=['Noah Shinn', 'Federico Cassano', 'Ashwin Gopinath', 'Karthik Narasimhan', 'Shunyu Yao'],
                source_type='paper',
                publication_year=2023,
                journal='NeurIPS 2023',
                doi='10.48550/arXiv.2303.11366',
                abstract='Language agents that learn through linguistic feedback and reflection across trials without updating model weights.',
                status='reviewed',
                relevance_score=94.0,
                tags=['reflection', 'RL', 'agents']
            )

            Source.objects.create(
                project=p1,
                added_by=user,
                title='Toolformer: Language Models Can Teach Themselves to Use Tools',
                authors=['Timo Schick', 'Jane Dwivedi-Yu', 'Roberto Dessi', 'Roberta Raileanu'],
                source_type='paper',
                publication_year=2023,
                journal='NeurIPS 2023',
                doi='10.48550/arXiv.2302.04761',
                abstract='Language models trained to decide which APIs to call, when to call them, what arguments to pass, and how to incorporate results.',
                status='cited',
                relevance_score=88.5,
                tags=['tools', 'agents', 'APIs']
            )

            ResearchNote.objects.create(
                project=p1,
                author=user,
                title='Critical Gap: Asynchronous State Invalidation',
                content='None of the cited literature tests how verbal reflection handles contradictory intermediate states during multi-agent race conditions.',
                is_pinned=True
            )

            Analysis.objects.create(
                project=p1,
                created_by=user,
                title='Multi-Agent Collision & Failure Recovery Gap Analysis',
                analysis_type='gap_detection',
                status='completed',
                parameters={'depth': 'deep', 'sources_scanned': 42},
                results={
                    'unaddressed_hypotheses': [
                        'Latency-induced hallucinations in distributed consensus loops',
                        'Cascading error amplification in cyclic reflection topologies'
                    ],
                    'coverage_percentage': 41.2,
                    'citation_deficit_score': 8.9
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded GAPZERO sample data.'))
