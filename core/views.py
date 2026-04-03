from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .models import Feedback


@require_GET
def messages(request):
    feedback_list = Feedback.objects.all()
    return render(request, 'core/messages.html', {'messages': feedback_list})


def index(request):
    return render(request, 'core/index.html')


@require_POST
def submit(request):
    name = request.POST.get('name', '').strip()
    email = request.POST.get('email', '').strip()
    message = request.POST.get('message', '').strip()

    if not (name and email and message):
        return JsonResponse(
            {'success': False, 'message': 'Заповніть усі поля форми.'},
            status=422,
        )

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse(
            {'success': False, 'message': 'Вкажіть коректний email.'},
            status=422,
        )

    Feedback.objects.create(username=name, email=email, message=message)
    return JsonResponse(
        {'success': True, 'message': f'Дякуємо, {name}! Ваше повідомлення отримано.'}
    )


@require_POST
def delete_message(request):
    try:
        msg_id = int(request.POST.get('id', ''))
    except (ValueError, TypeError):
        return JsonResponse(
            {'success': False, 'message': 'Некоректний ідентифікатор.'},
            status=422,
        )

    deleted, _ = Feedback.objects.filter(id=msg_id).delete()
    if not deleted:
        return JsonResponse(
            {'success': False, 'message': 'Повідомлення не знайдено.'},
            status=404,
        )

    return JsonResponse({'success': True, 'message': 'Повідомлення видалено.'})
