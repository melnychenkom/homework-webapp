from django.contrib import admin
from .models import AnalysisJob


@admin.register(AnalysisJob)
class AnalysisJobAdmin(admin.ModelAdmin):
    list_display = ['job_id', 'name', 'fasta_filename', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'fasta_filename']
    readonly_fields = ['job_id', 'created_at', 'results_json', 'output_path']
    ordering = ['-created_at']
