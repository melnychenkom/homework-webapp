from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('messages/', views.messages, name='messages'),
    path('submit/', views.submit, name='submit'),
    path('delete/', views.delete_message, name='delete_message'),
]
