from django.db import models


class ExtractionJob(models.Model):
    job_id           = models.UUIDField(primary_key=True)
    target           = models.CharField(max_length=255)
    article_filename = models.CharField(max_length=255)
    status           = models.CharField(max_length=16)  # pending/running/done/failed
    output_path      = models.CharField(max_length=512, blank=True)
    pockets_json     = models.JSONField(null=True, blank=True)
    error            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
