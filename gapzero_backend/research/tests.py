from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import ResearchProject, ResearchNote

User = get_user_model()


class ResearchProjectTests(TestCase):
    """Test ResearchProject model and API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='lead_researcher',
            email='lead@gapzero.ai',
            password='SecurePassword123!',
            first_name='Marie',
            last_name='Curie',
            role='researcher'
        )
        login_response = self.client.post('/api/v1/auth/login/', {
            'email': 'lead@gapzero.ai',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_research_project(self):
        project_data = {
            'title': 'Investigating Undetected Gaps in Deep Reinforcement Learning',
            'description': 'A comprehensive exploration into sample efficiency deficiencies and unexplored reward landscape topographies.',
            'domain': 'technology',
            'status': 'active',
            'keywords': ['reinforcement learning', 'sample efficiency', 'reward landscape'],
            'gap_score': 74.5,
            'gap_summary': 'Missing exploration on non-stationary distribution shifts in offline benchmarks.',
        }
        response = self.client.post('/api/v1/research/projects/', project_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], project_data['title'])
        self.assertEqual(response.data['owner_name'], 'Marie Curie')
        self.assertEqual(ResearchProject.objects.count(), 1)

    def test_list_research_projects(self):
        ResearchProject.objects.create(
            title='Project Alpha: Quantum Entanglement Gaps',
            description='Study of decoherence metrics.',
            domain='science',
            status='active',
            owner=self.user,
            gap_score=82.0
        )
        response = self.client.get('/api/v1/research/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Project Alpha: Quantum Entanglement Gaps')

    def test_research_project_stats(self):
        ResearchProject.objects.create(
            title='Project 1',
            description='Desc 1',
            domain='technology',
            status='active',
            owner=self.user
        )
        ResearchProject.objects.create(
            title='Project 2',
            description='Desc 2',
            domain='healthcare',
            status='draft',
            owner=self.user
        )
        response = self.client.get('/api/v1/research/projects/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['by_status']['active'], 1)
        self.assertEqual(response.data['by_status']['draft'], 1)
        self.assertEqual(response.data['by_domain']['technology'], 1)
        self.assertEqual(response.data['by_domain']['healthcare'], 1)

    def test_create_and_list_research_note(self):
        project = ResearchProject.objects.create(
            title='Genomic Variant Gaps',
            description='Detecting uncharacterized variant clusters.',
            domain='healthcare',
            status='active',
            owner=self.user
        )
        note_data = {
            'title': 'Preliminary Finding: Exome batch divergence',
            'content': 'Observed high disparity in coverage depth across chromosomes 3 and 17.',
            'is_pinned': True
        }
        create_res = self.client.post(f'/api/v1/research/projects/{project.id}/notes/', note_data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ResearchNote.objects.count(), 1)

        list_res = self.client.get(f'/api/v1/research/projects/{project.id}/notes/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['count'], 1)
