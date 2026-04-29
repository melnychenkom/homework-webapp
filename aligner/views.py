from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_GET, require_POST

from .models import AnalysisJob


@require_GET
def index(request):
    return render(request, 'aligner/index.html')


@require_POST
def upload_fasta(request):
    fasta_file = request.FILES.get('fasta_file')
    name = request.POST.get('name', '')

    if not fasta_file:
        return JsonResponse({'error': 'No FASTA file provided'}, status=400)

    job = AnalysisJob.objects.create(
        name=name,
        fasta_filename=fasta_file.name,
        status='pending',
    )
    return JsonResponse({'job_id': str(job.job_id)})


@require_GET
def jobs_list(request):
    jobs = AnalysisJob.objects.order_by('-created_at')[:10]
    return JsonResponse({'jobs': [
        {
            'job_id': str(j.job_id),
            'name': j.name,
            'status': j.status,
            'created_at': j.created_at.isoformat(),
        }
        for j in jobs
    ]})


@require_GET
def job_detail(request, job_id):
    get_object_or_404(AnalysisJob, pk=job_id)
    return render(request, 'aligner/index.html')


@require_GET
def job_status(request, job_id):
    job = get_object_or_404(AnalysisJob, pk=job_id)
    return JsonResponse({
        'job_id': str(job.job_id),
        'name': job.name,
        'fasta_filename': job.fasta_filename,
        'created_at': job.created_at.isoformat(),
        'status': job.status,
        'results_json': job.results_json,
        'output_path': job.output_path,
        'error': job.error,
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
