from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from research.models import ResearchProject, ResearchNote
from sources.models import Source
from analysis.models import Analysis

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demonstration data for AGYAAN LAB'

    def handle(self, *args, **options):
        # Update or create Superuser / Lead Researcher for AGYAAN LAB
        user = User.objects.filter(username='admin').first()
        if user:
            user.email = 'admin@agyaanlab.ai'
            user.organization = 'AGYAAN LAB Intelligence'
            user.set_password('agyaanlab123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Updated user: admin@agyaanlab.ai / agyaanlab123'))
        else:
            user = User.objects.create_superuser(
                username='admin',
                email='admin@agyaanlab.ai',
                password='agyaanlab123',
                first_name='Chief',
                last_name='Scientist',
                role='admin',
                organization='AGYAAN LAB Intelligence',
                bio='Pioneering negative-space literature intelligence and automated research gap discovery.'
            )
            self.stdout.write(self.style.SUCCESS('Created user: admin@agyaanlab.ai / agyaanlab123'))

        # Demo project
        p1 = ResearchProject.objects.filter(owner=user).first()
        if not p1:
            p1 = ResearchProject.objects.create(
                title='Autonomous Agent Self-Correction in Ambiguous Environments',
                owner=user,
                description='Evaluating the frontier of autonomous reflection loops when faced with non-deterministic environmental feedback and sparse reward functions.',
                domain='technology',
                status='active',
                keywords=['AI agents', 'reinforcement learning', 'self-correction', 'sparse rewards'],
                gap_score=85.0,
                gap_summary='Current literature predominantly evaluates reflection on deterministic benchmarks. Zero established meta-analyses evaluate failure recovery latency across asynchronous distributed agent topologies.',
                is_public=True,
            )

        self.stdout.write(self.style.SUCCESS('Successfully configured AGYAAN LAB sample data.'))
