import uuid

from django.db import models


class AnalysisJob(models.Model):
    job_id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name           = models.CharField(max_length=255)
    fasta_filename = models.CharField(max_length=255)
    status         = models.CharField(max_length=16)  # pending/running/done/failed
    results_json   = models.JSONField(null=True, blank=True)
    output_path    = models.CharField(max_length=512, blank=True)
    error          = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
