from pathlib import Path
from dotenv import load_dotenv
import os
import sys
import pymysql
pymysql.version_info = (2, 2, 1, 'final', 0)
pymysql.install_as_MySQLdb()

# Patch Django's MySQL version check to allow MySQL 5.7
import django.db.backends.mysql.base as _mysql_base
_mysql_base.DatabaseWrapper.mysql_version = property(lambda self: (8, 0, 11))

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-prod')
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'blast.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'blast.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'HOST': os.getenv('DB_HOST'),
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASS'),
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}

# Use SQLite when running tests (avoids needing CREATE DATABASE on remote MySQL)
if 'test' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    ('css', BASE_DIR / 'css'),
    ('js', BASE_DIR / 'js'),
    ('assets', BASE_DIR / 'assets'),
]
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
