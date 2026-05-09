from pathlib import Path
import tempfile
from io import StringIO
import os
from unittest.mock import patch
import json as json_module
import subprocess

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


class DistanceMatrixTest(TestCase):
    def _make_alignment(self, seqs_str):
        import biotite.sequence as seq_module
        import biotite.sequence.align as align_module
        seqs = [seq_module.NucleotideSequence(s) for s in seqs_str]
        matrix = align_module.SubstitutionMatrix.std_nucleotide_matrix()
        alignment, *_ = align_module.align_multiple(seqs, matrix=matrix, gap_penalty=-6)
        return alignment

    def test_identical_sequences_have_zero_distance(self):
        from aligner.pipeline.tree import _pairwise_distances
        alignment = self._make_alignment(["ATCGATCG", "ATCGATCG", "ATCGATCG"])
        dist = _pairwise_distances(alignment)
        self.assertAlmostEqual(dist[0, 1], 0.0)
        self.assertAlmostEqual(dist[0, 2], 0.0)
        self.assertAlmostEqual(dist[1, 2], 0.0)

    def test_distance_is_symmetric(self):
        from aligner.pipeline.tree import _pairwise_distances
        alignment = self._make_alignment(["ATCGATCG", "ATCAATCG", "TTCGATCG"])
        dist = _pairwise_distances(alignment)
        import numpy as np
        np.testing.assert_array_almost_equal(dist, dist.T)

    def test_different_sequences_have_positive_distance(self):
        from aligner.pipeline.tree import _pairwise_distances
        # Use sequences that differ but are still alignable by biotite's align_multiple
        alignment = self._make_alignment(["ATCGATCG", "TTCGATCG", "ATCGTTCG"])
        dist = _pairwise_distances(alignment)
        self.assertGreater(dist[0, 1], 0.0)
        self.assertGreater(dist[0, 2], 0.0)
        self.assertGreater(dist[1, 2], 0.0)


class BuildTreesTest(TestCase):
    def _make_alignment(self, seqs_str):
        import biotite.sequence as seq_module
        import biotite.sequence.align as align_module
        seqs = [seq_module.NucleotideSequence(s) for s in seqs_str]
        matrix = align_module.SubstitutionMatrix.std_nucleotide_matrix()
        alignment, *_ = align_module.align_multiple(seqs, matrix=matrix, gap_penalty=-6)
        return alignment

    def test_build_trees_returns_nj_and_upgma_newick(self):
        from aligner.pipeline.tree import build_trees
        from Bio import Phylo
        alignment = self._make_alignment(["ATCGATCG", "ATCAATCG", "TTCGATCG"])
        result = build_trees(alignment, ["seq1", "seq2", "seq3"])
        for key in ("nj", "upgma"):
            self.assertIsNotNone(result[key], f"{key} should not be None")
            trees = list(Phylo.parse(StringIO(result[key]), "newick"))
            self.assertEqual(len(trees), 1, f"{key} should produce exactly 1 tree")
        self.assertIn("ml", result)

    def test_fewer_than_two_seq_ids_returns_nulls(self):
        from aligner.pipeline.tree import build_trees
        import biotite.sequence as seq_module
        import biotite.sequence.align as align_module
        seqs = [seq_module.NucleotideSequence("ATCG"), seq_module.NucleotideSequence("TTCG")]
        matrix = align_module.SubstitutionMatrix.std_nucleotide_matrix()
        alignment, *_ = align_module.align_multiple(seqs, matrix=matrix, gap_penalty=-6)
        result = build_trees(alignment, ["only_one"])
        self.assertEqual(result, {"nj": None, "upgma": None, "ml": None})


class MLTreeTest(TestCase):
    def _make_alignment(self, seqs_str):
        import biotite.sequence as seq_module
        import biotite.sequence.align as align_module
        seqs = [seq_module.NucleotideSequence(s) for s in seqs_str]
        matrix = align_module.SubstitutionMatrix.std_nucleotide_matrix()
        alignment, *_ = align_module.align_multiple(seqs, matrix=matrix, gap_penalty=-6)
        return alignment

    @patch('aligner.pipeline.tree.subprocess.run')
    def test_ml_returns_newick_on_success(self, mock_run):
        from aligner.pipeline.tree import _ml_tree
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = '(seq1:0.1,seq2:0.2,seq3:0.3);'
        alignment = self._make_alignment(["ATCGATCG", "ATCAATCG", "TTCGATCG"])
        result = _ml_tree(alignment, ["seq1", "seq2", "seq3"])
        self.assertEqual(result, '(seq1:0.1,seq2:0.2,seq3:0.3);')

    @patch('aligner.pipeline.tree.subprocess.run', side_effect=FileNotFoundError)
    def test_ml_returns_none_when_fasttree_missing(self, mock_run):
        from aligner.pipeline.tree import _ml_tree
        alignment = self._make_alignment(["ATCGATCG", "ATCAATCG", "TTCGATCG"])
        result = _ml_tree(alignment, ["seq1", "seq2", "seq3"])
        self.assertIsNone(result)

    @patch('aligner.pipeline.tree.subprocess.run')
    def test_ml_returns_none_on_nonzero_exit(self, mock_run):
        from aligner.pipeline.tree import _ml_tree
        mock_run.return_value.returncode = 1
        mock_run.return_value.stderr = 'error'
        mock_run.return_value.stdout = ''
        alignment = self._make_alignment(["ATCGATCG", "ATCAATCG", "TTCGATCG"])
        result = _ml_tree(alignment, ["seq1", "seq2", "seq3"])
        self.assertIsNone(result)


class PipelineTreeIntegrationTest(TestCase):
    def test_pipeline_adds_trees_to_results_json(self):
        import tempfile
        from pathlib import Path
        from aligner.pipeline import run_pipeline

        fasta_content = (
            ">seq1\nATCGATCGATCGATCG\n"
            ">seq2\nATCGATTGATCGATCG\n"
            ">seq3\nATCGATCGATCGATCC\n"
        )
        job = AnalysisJob.objects.create(
            name='tree_integ', fasta_filename='test.fasta', status='pending'
        )
        with tempfile.NamedTemporaryFile(mode='w', suffix='.fasta', delete=False) as f:
            f.write(fasta_content)
            tmp_path = f.name
        try:
            run_pipeline(job, Path(tmp_path))
        finally:
            os.unlink(tmp_path)

        job.refresh_from_db()
        self.assertEqual(job.status, 'done')
        self.assertIn('trees', job.results_json)
        trees = job.results_json['trees']
        self.assertIsNotNone(trees['nj'])
        self.assertIsNotNone(trees['upgma'])
        self.assertIn('ml', trees)  # key must exist even if FastTree not installed


class RunHistogramTest(TestCase):
    @patch('aligner.pipeline.histogram.subprocess.run')
    def test_returns_sequences_and_plot_svg(self, mock_run):
        from aligner.pipeline.histogram import run_histogram
        payload = {
            'sequences': [{'id': 'seq1', 'length': 25, 'sequence': 'ATCG'}],
            'plot_svg': '<svg></svg>',
        }
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = json_module.dumps(payload)
        result = run_histogram()
        self.assertEqual(result['sequences'], payload['sequences'])
        self.assertEqual(result['plot_svg'], payload['plot_svg'])

    @patch('aligner.pipeline.histogram.subprocess.run')
    def test_raises_on_nonzero_exit(self, mock_run):
        from aligner.pipeline.histogram import run_histogram
        mock_run.return_value.returncode = 1
        mock_run.return_value.stdout = ''
        mock_run.return_value.stderr = 'Error: package not found'
        with self.assertRaises(RuntimeError) as ctx:
            run_histogram()
        self.assertIn('R execution failed', str(ctx.exception))

    @patch('aligner.pipeline.histogram.subprocess.run',
           side_effect=subprocess.TimeoutExpired('Rscript', 30))
    def test_raises_on_timeout(self, mock_run):
        from aligner.pipeline.histogram import run_histogram
        with self.assertRaises(RuntimeError) as ctx:
            run_histogram()
        self.assertIn('timed out', str(ctx.exception))
