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


def submit_extract(article_file, target, **kwargs) -> str:
    """POST /extract/file/async → returns job_id string."""
    url = f"{settings.LANGGRAPH_URL}/extract/file/async"
    try:
        resp = requests.post(
            url,
            files={'file': article_file},
            data={'target': target, **kwargs},
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise PocketExtractorError(str(e)) from e
    return resp.json()['job_id']


class PollTimeout(Exception):
    """Raised when the backend is busy and didn't respond in time."""


def poll_job(job_id: str, job_type: str = 'pipeline') -> dict:
    """GET job status from the appropriate backend endpoint."""
    path = 'extract/jobs' if job_type == 'extract' else 'pipeline/jobs'
    url = f"{settings.LANGGRAPH_URL}/{path}/{job_id}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except requests.ReadTimeout as e:
        raise PollTimeout('backend busy') from e
    except requests.RequestException as e:
        raise PocketExtractorError(str(e)) from e
    return resp.json()
