from django.conf import settings


def vite(request):
    return {
        'vite_dev': settings.VITE_DEV_MODE,
        'vite_dev_server': settings.VITE_DEV_SERVER,
    }
