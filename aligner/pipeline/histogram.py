import json
import os
import subprocess
import tempfile
from pathlib import Path

_SCRIPT_PATH = Path(__file__).parent / "histogram.R"


def run_histogram() -> dict:
    r_code = _SCRIPT_PATH.read_text()
    with tempfile.NamedTemporaryFile(mode='w', suffix='.R', delete=False) as f:
        f.write(r_code)
        script_path = f.name
    try:
        result = subprocess.run(
            ['Rscript', script_path],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError(f"R execution failed: {result.stderr[:500]}")
        try:
            data = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"R produced invalid JSON: {exc}") from exc
        data['r_code'] = r_code
        return data
    except subprocess.TimeoutExpired:
        raise RuntimeError("R script timed out")
    finally:
        try:
            os.unlink(script_path)
        except OSError:
            pass
