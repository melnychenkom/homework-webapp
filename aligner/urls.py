from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("upload/", views.upload_fasta, name="upload_fasta"),
    path("jobs/", views.jobs_list, name="jobs_list"),
    path("jobs/<uuid:job_id>/", views.job_detail, name="job_detail"),
    path("jobs/<uuid:job_id>/status/", views.job_status, name="job_status"),
    path(
        "jobs/<uuid:job_id>/files/<path:file_path>/",
        views.serve_file,
        name="serve_file",
    ),
    path("histogram/", views.index, name="histogram"),
    path("histogram/data/", views.histogram_data, name="histogram_data"),
]
