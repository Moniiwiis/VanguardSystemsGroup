from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from .services import publish_chat_message

@login_required
def chat_room(request):
    return render(request, "websocket/chat.html")

@login_required
@require_POST
def send_message(request):
    try:
        func = getattr(request.user, 'funcionario', None)
        org_id = func.delegacion_id if func and func.delegacion_id else 'global'
    except (ObjectDoesNotExist, AttributeError):
        org_id = 'global'

    message = request.POST.get("message", "").strip()
    if not 1 <= len(message) <= 300:
        return JsonResponse({"error": "Mensaje inválido. Debe tener entre 1 y 300 caracteres."}, status=400)

    publish_chat_message(request.user, org_id, message)
    return JsonResponse({"ok": True})

