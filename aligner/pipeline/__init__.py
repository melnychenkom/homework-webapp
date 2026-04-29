from pathlib import Path

from .alignment import align_sequences
from .export import to_results_json
from .parser import parse_fasta


def run_pipeline(job, fasta_path: Path) -> None:
    job.status = "running"
    job.save(update_fields=["status"])
    try:
        sequences = parse_fasta(fasta_path)
        alignment = align_sequences(sequences)
        job.results_json = to_results_json(sequences, alignment)
        job.status = "done"
    except Exception as exc:
        job.status = "failed"
        job.error = str(exc)
    job.save(update_fields=["status", "results_json", "error"])
