import logging
from pathlib import Path

from .alignment import align_sequences
from .export import to_results_json
from .parser import parse_fasta
from .tree import build_trees

logger = logging.getLogger(__name__)


def run_pipeline(job, fasta_path: Path) -> None:
    job.status = "running"
    job.save(update_fields=["status"])
    try:
        sequences = parse_fasta(fasta_path)
        alignment = align_sequences(sequences)
        results = to_results_json(sequences, alignment)
        seq_ids = [s["id"] for s in sequences]
        try:
            results["trees"] = build_trees(alignment, seq_ids)
        except Exception as exc:
            logger.warning("Tree building failed: %s", exc)
            results["trees"] = None
        job.results_json = results
        job.status = "done"
    except Exception as exc:
        job.status = "failed"
        job.error = str(exc)
    job.save(update_fields=["status", "results_json", "error"])
