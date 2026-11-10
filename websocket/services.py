import json
import logging
import os
import uuid
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)
_CHAT_BUFFER = []
_CHAT_FILE = os.path.join(settings.BASE_DIR, "media", "chat_history.json")


def _load_shared_chat_history():
    try:
        if os.path.exists(_CHAT_FILE):
            with open(_CHAT_FILE, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                if isinstance(data, list):
                    return data[-50:]
    except Exception:
        pass
    return list(_CHAT_BUFFER)


def _save_shared_chat_message(msg_payload):
    try:
        _CHAT_BUFFER.append(msg_payload)
        if len(_CHAT_BUFFER) > 50:
            del _CHAT_BUFFER[:-50]
        os.makedirs(os.path.dirname(_CHAT_FILE), exist_ok=True)
        history = _load_shared_chat_history()
        if not any(m.get("id") == msg_payload.get("id") for m in history):
            history.append(msg_payload)
        history = history[-50:]
        with open(_CHAT_FILE, "w", encoding="utf-8") as fh:
            json.dump(history, fh, ensure_ascii=False)
    except Exception:
        pass

def publish_module_changed(modulo, org_id, action, record_id, extra_data=None):
    """
    Publica una notificación de cambio de módulo en tiempo real a través de Channels.
    Se despacha típicamente dentro de transaction.on_commit() tras guardar en BD.
    
    Parámetros:
    - modulo: string identificador ('atenciones', 'vecinos', etc.)
    - org_id: identificador de la delegación u organización (ej. '1', '2', 'global')
    - action: 'create', 'update', 'delete', 'status_change'
    - record_id: ID del registro modificado
    - extra_data: dict opcional con metadatos autorizados
    """
    try:
        layer = get_channel_layer()
        if layer is None:
            logger.warning("Channel layer no configurado, omitiendo notificación WebSocket.")
            return

        payload = {
            "type": "crud_update",
            "modulo": modulo,
            "module": modulo,
            "action": action,
            "record_id": record_id,
            "timestamp": timezone.now().strftime('%H:%M:%S'),
            "data": extra_data or {}
        }

        modulos_destino = {modulo, "general"}
        if modulo in ("atenciones", "tubo", "actividades"):
            modulos_destino.update({"atenciones", "tubo", "inicio", "reportes"})

        grupos = set()
        for mod in modulos_destino:
            grupos.add(f"crud_{mod}_{org_id}")
            grupos.add(f"crud_{mod}_all")

        for grp in grupos:
            async_to_sync(layer.group_send)(
                grp,
                {
                    "type": "crud_event",
                    "payload": payload
                }
            )
    except Exception as e:
        logger.error(f"Error al emitir evento WebSocket en publish_module_changed: {e}")

def publish_chat_message(user, org_id, message):
    """
    Publica un mensaje en la sala de chat de la organización (Guía de Clase 11).
    """
    msg_payload = {
        "id": uuid.uuid4().hex,
        "type": "chat_message",
        "username": user.get_full_name() or user.username,
        "message": message,
        "org_id": str(org_id),
        "time": timezone.now().strftime('%H:%M')
    }
    _save_shared_chat_message(msg_payload)

    try:
        layer = get_channel_layer()
        if layer is None:
            return msg_payload

        for grp in {f"chat_org_{org_id}", "chat_org_global", "chat_org_all"}:
            async_to_sync(layer.group_send)(
                grp,
                {
                    "type": "chat_event",
                    "payload": msg_payload
                }
            )
    except Exception as e:
        logger.error(f"Error en publish_chat_message: {e}")
    return msg_payload


def get_recent_chat_messages(org_id):
    history = _load_shared_chat_history()
    org_str = str(org_id)
    if org_str == "global":
        return history[-30:]
    return [m for m in history if m.get("org_id") in (org_str, "global", None)][-30:]

