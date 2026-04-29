from pathlib import Path
import tempfile

from django.test import TestCase, Client, override_settings
from django.urls import reverse

from .models import AnalysisJob


class AnalysisJobModelTest(TestCase):
    def test_create_job(self):
        job = AnalysisJob.objects.create(
            name='test_run',
            fasta_filename='sequences.fasta',
            status='pending',
        )
        fetched = AnalysisJob.objects.get(pk=job.job_id)
        self.assertEqual(fetched.name, 'test_run')
        self.assertEqual(fetched.status, 'pending')
        self.assertEqual(fetched.fasta_filename, 'sequences.fasta')
        self.assertIsNone(fetched.results_json)
        self.assertEqual(fetched.error, '')


class ServeFileViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.job = AnalysisJob.objects.create(
            name='test',
            fasta_filename='seqs.fasta',
            status='done',
        )

    def test_serves_existing_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            job_dir = Path(tmpdir) / 'jobs' / str(self.job.job_id)
            job_dir.mkdir(parents=True)
            (job_dir / 'result.nwk').write_text('(A,B);')

            with override_settings(RESULTS_ROOT=tmpdir):
                resp = self.client.get(
                    reverse('serve_file', kwargs={'job_id': self.job.job_id, 'file_path': 'result.nwk'})
                )
            self.assertEqual(resp.status_code, 200)

    def test_missing_file_returns_404(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with override_settings(RESULTS_ROOT=tmpdir):
                resp = self.client.get(
                    reverse('serve_file', kwargs={'job_id': self.job.job_id, 'file_path': 'missing.nwk'})
                )
            self.assertEqual(resp.status_code, 404)

    def test_path_traversal_returns_404(self):
        with tempfile.TemporaryDirectory() as parent:
            results_root = Path(parent) / 'results'
            results_root.mkdir()
            secret = Path(parent) / 'secret.txt'
            secret.write_text('secret')

            with override_settings(RESULTS_ROOT=str(results_root)):
                resp = self.client.get(
                    reverse('serve_file', kwargs={
                        'job_id': self.job.job_id,
                        'file_path': '../../secret.txt',
                    })
                )
            self.assertEqual(resp.status_code, 404)
