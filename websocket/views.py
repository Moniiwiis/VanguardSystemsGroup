from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from .services import publish_chat_message, get_recent_chat_messages

def _resolve_user_org_id(user):
    try:
        func = getattr(user, 'funcionario', None)
        return str(func.delegacion_id) if func and func.delegacion_id else 'global'
    except (ObjectDoesNotExist, AttributeError):
        return 'global'

@login_required
def chat_room(request):
    return render(request, "websocket/chat.html")

@login_required
@require_POST
def send_message(request):
    org_id = _resolve_user_org_id(request.user)

    message = request.POST.get("message", "").strip()
    msg_id = request.POST.get("id", "").strip() or None
    if not 1 <= len(message) <= 300:
        return JsonResponse({"error": "Mensaje inválido. Debe tener entre 1 y 300 caracteres."}, status=400)

    msg_payload = publish_chat_message(request.user, org_id, message, msg_id=msg_id)
    return JsonResponse({"ok": True, "item": msg_payload})

@login_required
def messages_feed(request):
    org_id = _resolve_user_org_id(request.user)
    return JsonResponse({"ok": True, "messages": get_recent_chat_messages(org_id)})

