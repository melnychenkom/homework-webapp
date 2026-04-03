import requests
from django.conf import settings


class PocketExtractorError(Exception):
    pass


def submit_pipeline(pdb_file, article_file, target, **kwargs) -> str:
    """POST /pipeline/async → returns job_id string."""
    url = f"{settings.LANGGRAPH_URL}/pipeline/async"
    try:
        resp = requests.post(
            url,
            files={
                'pdb_file': pdb_file,
                'article_file': article_file,
            },
            data={'target': target, **kwargs},
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise PocketExtractorError(str(e)) from e
    return resp.json()['job_id']


def poll_job(job_id: str) -> dict:
    """GET /pipeline/jobs/{job_id} → returns dict with keys: status, result, error."""
    url = f"{settings.LANGGRAPH_URL}/pipeline/jobs/{job_id}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise PocketExtractorError(str(e)) from e
    return resp.json()


def submit_extract(article_file, target) -> dict:
    """POST /extract/file → MOCKED: returns hardcoded stub response."""
    return {
        'status': 'done',
        'target': target,
        'pockets': [
            {'id': 1, 'score': 0.91, 'residues': ['ALA42', 'GLY55', 'LYS78']},
            {'id': 2, 'score': 0.74, 'residues': ['VAL12', 'PHE30']},
        ],
    }
