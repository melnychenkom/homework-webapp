import uuid
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_GET, require_POST

from . import services
from .models import ExtractionJob


@require_GET
def index(request):
    return render(request, 'extractor/index.html')


@require_POST
def submit_pipeline(request):
    pdb_file = request.FILES.get('pdb_file')
    article_file = request.FILES.get('article_file')
    target = request.POST.get('target', '')

    try:
        job_id_str = services.submit_pipeline(pdb_file, article_file, target)
    except services.PocketExtractorError as e:
        return JsonResponse({'error': str(e)}, status=502)

    job_uuid = uuid.UUID(job_id_str)
    article_filename = article_file.name if article_file else ''
    ExtractionJob.objects.create(
        job_id=job_uuid,
        target=target,
        article_filename=article_filename,
        status='pending',
    )
    return JsonResponse({'job_id': str(job_uuid)})


@require_POST
def submit_extract(request):
    article_file = request.FILES.get('article_file')
    target = request.POST.get('target', '')
    kwargs = {k: request.POST[k] for k in
              ('extraction_model', 'filter_model', 'refine_model')
              if k in request.POST}
    kwargs['filter_step'] = 'true' if request.POST.get('filter_step') else 'false'
    kwargs['refine_step'] = 'true' if request.POST.get('refine_step') else 'false'

    try:
        job_id_str = services.submit_extract(article_file, target, **kwargs)
    except services.PocketExtractorError as e:
        return JsonResponse({'error': str(e)}, status=502)

    job_uuid = uuid.UUID(job_id_str)
    ExtractionJob.objects.create(
        job_id=job_uuid,
        target=target,
        article_filename=article_file.name if article_file else '',
        status='pending',
        job_type='extract',
    )
    return JsonResponse({'job_id': str(job_uuid)})


@require_GET
def job_detail(request, job_id):
    get_object_or_404(ExtractionJob, pk=job_id)
    return render(request, 'extractor/index.html')


@require_GET
def job_status(request, job_id):
    job = get_object_or_404(ExtractionJob, pk=job_id)
    poll_error = None

    if job.status not in ('done', 'failed'):
        try:
            data = services.poll_job(str(job_id), job_type=job.job_type)
        except services.PollTimeout:
            pass  # server busy processing — just return current DB state
        except services.PocketExtractorError as e:
            poll_error = str(e)
        else:
            new_status = data.get('status', job.status)
            if new_status != job.status:
                job.status = new_status
                job.output_path = data.get('result', {}).get('output_path', '') if isinstance(data.get('result'), dict) else ''
                job.pockets_json = data.get('result')
                job.error = data.get('error', '')
                job.save()

    return JsonResponse({
        'job_id': str(job.job_id),
        'target': job.target,
        'article_filename': job.article_filename,
        'created_at': job.created_at.isoformat(),
        'status': job.status,
        'pockets_json': job.pockets_json,
        'output_path': job.output_path,
        'error': job.error,
        'poll_error': poll_error,
    })


def serve_file(request, job_id, file_path):
    results_root = Path(settings.RESULTS_ROOT)
    job_dir = results_root / 'jobs' / str(job_id)
    target = (job_dir / file_path).resolve()

    # Prevent path traversal
    try:
        target.relative_to(results_root.resolve())
    except ValueError:
        raise Http404

    if not target.exists():
        raise Http404

    return FileResponse(open(target, 'rb'))
