import json
import logging
import os
import tempfile
import uuid
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)
_CHAT_BUFFER = []
_CHAT_FILE = os.path.join(tempfile.gettempdir(), "sgr_chat_history.json")


def _ensure_chat_db_table():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sgr_chat_messages (
                msg_id VARCHAR(64) PRIMARY KEY,
                username VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                org_id VARCHAR(50) NOT NULL,
                time_str VARCHAR(20) NOT NULL,
                created_ts DOUBLE PRECISION NOT NULL
            )
            """
        )


def _load_shared_chat_history():
    try:
        _ensure_chat_db_table()
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT msg_id, username, message, org_id, time_str FROM sgr_chat_messages ORDER BY created_ts DESC LIMIT 40"
            )
            rows = cursor.fetchall()
        if rows is not None:
            items = [
                {
                    "id": r[0],
                    "type": "chat_message",
                    "username": r[1],
                    "message": r[2],
                    "org_id": r[3],
                    "time": r[4],
                }
                for r in reversed(rows)
            ]
            return items
    except Exception:
        pass

    try:
        if os.path.exists(_CHAT_FILE):
            with open(_CHAT_FILE, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                if isinstance(data, list):
                    return data[-40:]
    except Exception:
        pass
    return list(_CHAT_BUFFER)


def _save_shared_chat_message(msg_payload):
    try:
        _CHAT_BUFFER.append(msg_payload)
        if len(_CHAT_BUFFER) > 50:
            del _CHAT_BUFFER[:-50]
    except Exception:
        pass

    try:
        _ensure_chat_db_table()
        now_ts = timezone.now().timestamp()
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(1) FROM sgr_chat_messages WHERE msg_id = %s",
                [msg_payload["id"]],
            )
            exists = cursor.fetchone()[0]
            if not exists:
                cursor.execute(
                    """
                    INSERT INTO sgr_chat_messages (msg_id, username, message, org_id, time_str, created_ts)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    [
                        msg_payload["id"],
                        msg_payload["username"],
                        msg_payload["message"],
                        str(msg_payload.get("org_id", "global")),
                        msg_payload["time"],
                        now_ts,
                    ],
                )
    except Exception as e:
        logger.error(f"Error guardando chat en BD: {e}")

    try:
        history = []
        if os.path.exists(_CHAT_FILE):
            with open(_CHAT_FILE, "r", encoding="utf-8") as fh:
                history = json.load(fh)
        if not any(m.get("id") == msg_payload.get("id") for m in history):
            history.append(msg_payload)
        with open(_CHAT_FILE, "w", encoding="utf-8") as fh:
            json.dump(history[-50:], fh, ensure_ascii=False)
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

def publish_chat_message(user, org_id, message, msg_id=None):
    """
    Publica un mensaje en la sala de chat de la organización (Guía de Clase 11).
    """
    msg_payload = {
        "id": msg_id or uuid.uuid4().hex,
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


def get_recent_chat_messages(org_id=None):
    history = _load_shared_chat_history()
    return history[-35:]

