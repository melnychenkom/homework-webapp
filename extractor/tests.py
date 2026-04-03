import uuid
from pathlib import Path
from io import BytesIO
from unittest.mock import patch
import tempfile
import os

from django.test import TestCase, Client, override_settings
from django.urls import reverse

from .models import ExtractionJob


class ExtractionJobModelTest(TestCase):
    def test_create_job(self):
        job_id = uuid.uuid4()
        job = ExtractionJob.objects.create(
            job_id=job_id,
            target='protein_X',
            article_filename='paper.pdf',
            status='pending',
        )
        fetched = ExtractionJob.objects.get(pk=job_id)
        self.assertEqual(fetched.target, 'protein_X')
        self.assertEqual(fetched.status, 'pending')
        self.assertEqual(fetched.article_filename, 'paper.pdf')
        self.assertIsNone(fetched.pockets_json)
        self.assertEqual(fetched.error, '')


class SubmitPipelineViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('extractor.views.services.submit_pipeline')
    def test_creates_job_and_redirects(self, mock_submit):
        job_id = str(uuid.uuid4())
        mock_submit.return_value = job_id

        pdb = BytesIO(b'ATOM ...')
        pdb.name = 'test.pdb'
        article = BytesIO(b'Abstract ...')
        article.name = 'paper.pdf'

        resp = self.client.post(
            reverse('submit_pipeline'),
            {'target': 'EGFR', 'pdb_file': pdb, 'article_file': article},
        )

        self.assertEqual(resp.status_code, 302)
        self.assertRedirects(resp, reverse('job_detail', kwargs={'job_id': job_id}))
        self.assertTrue(ExtractionJob.objects.filter(pk=job_id).exists())
        job = ExtractionJob.objects.get(pk=job_id)
        self.assertEqual(job.status, 'pending')
        self.assertEqual(job.target, 'EGFR')

    @patch('extractor.views.services.submit_pipeline')
    def test_service_error_returns_502(self, mock_submit):
        from extractor.services import PocketExtractorError
        mock_submit.side_effect = PocketExtractorError('connection refused')

        pdb = BytesIO(b'ATOM ...')
        pdb.name = 'test.pdb'
        article = BytesIO(b'text')
        article.name = 'paper.pdf'

        resp = self.client.post(
            reverse('submit_pipeline'),
            {'target': 'X', 'pdb_file': pdb, 'article_file': article},
        )
        self.assertEqual(resp.status_code, 502)


class SubmitExtractViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('extractor.views.services.submit_extract')
    def test_renders_result_no_db_record(self, mock_extract):
        mock_extract.return_value = {
            'status': 'done',
            'target': 'TP53',
            'pockets': [{'id': 1, 'score': 0.9, 'residues': ['ALA1']}],
        }
        article = BytesIO(b'text')
        article.name = 'paper.pdf'

        resp = self.client.post(
            reverse('submit_extract'),
            {'target': 'TP53', 'article_file': article},
        )

        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, 'TP53')
        self.assertEqual(ExtractionJob.objects.count(), 0)


class JobStatusViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.job_id = uuid.uuid4()
        self.job = ExtractionJob.objects.create(
            job_id=self.job_id,
            target='BRCA1',
            article_filename='paper.pdf',
            status='pending',
        )

    @patch('extractor.views.services.poll_job')
    def test_status_pending_to_running(self, mock_poll):
        mock_poll.return_value = {'status': 'running', 'result': None, 'error': ''}

        resp = self.client.get(reverse('job_status', kwargs={'job_id': self.job_id}))

        self.assertEqual(resp.status_code, 200)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'running')

    @patch('extractor.views.services.poll_job')
    def test_status_running_to_done(self, mock_poll):
        self.job.status = 'running'
        self.job.save()
        mock_poll.return_value = {
            'status': 'done',
            'result': {'output_path': '/results/job.zip', 'pockets': []},
            'error': '',
        }

        resp = self.client.get(reverse('job_status', kwargs={'job_id': self.job_id}))

        self.assertEqual(resp.status_code, 200)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'done')

    @patch('extractor.views.services.poll_job')
    def test_no_poll_when_done(self, mock_poll):
        self.job.status = 'done'
        self.job.save()

        self.client.get(reverse('job_status', kwargs={'job_id': self.job_id}))
        mock_poll.assert_not_called()


class ServeFileViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.job_id = uuid.uuid4()
        ExtractionJob.objects.create(
            job_id=self.job_id,
            target='X',
            article_filename='a.pdf',
            status='done',
        )

    def test_serves_existing_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            job_dir = Path(tmpdir) / 'jobs' / str(self.job_id)
            job_dir.mkdir(parents=True)
            (job_dir / 'result.txt').write_text('data')

            with override_settings(RESULTS_ROOT=tmpdir):
                resp = self.client.get(
                    reverse('serve_file', kwargs={'job_id': self.job_id, 'file_path': 'result.txt'})
                )
            self.assertEqual(resp.status_code, 200)

    def test_missing_file_returns_404(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with override_settings(RESULTS_ROOT=tmpdir):
                resp = self.client.get(
                    reverse('serve_file', kwargs={'job_id': self.job_id, 'file_path': 'missing.txt'})
                )
            self.assertEqual(resp.status_code, 404)

    def test_path_traversal_returns_404(self):
        with tempfile.TemporaryDirectory() as parent:
            results_root = Path(parent) / 'results'
            results_root.mkdir()
            # secret.txt is outside RESULTS_ROOT (one level above)
            secret = Path(parent) / 'secret.txt'
            secret.write_text('secret')

            with override_settings(RESULTS_ROOT=str(results_root)):
                resp = self.client.get(
                    reverse('serve_file', kwargs={
                        'job_id': self.job_id,
                        'file_path': '../../secret.txt',
                    })
                )
            self.assertEqual(resp.status_code, 404)
