import json
import subprocess
from pathlib import Path

_CLASS_DIR = Path('/opt/java')


def count_nucleotides(sequence: str) -> dict:
    result = subprocess.run(
        ['java', '-cp', str(_CLASS_DIR), 'NucleotideCounter', sequence],
        capture_output=True, text=True, timeout=10,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Java error: {result.stderr[:200]}")
    return json.loads(result.stdout)
