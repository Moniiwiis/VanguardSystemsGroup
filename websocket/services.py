import json
import logging
import os
import tempfile
import uuid
from asgiref.sync import async_to_sync
try:
    from channels.layers import get_channel_layer
except ImportError:
    def get_channel_layer():
        return None
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

_RECENT_EMISSIONS = {}


def publish_module_changed(modulo, org_id, action, record_id, extra_data=None, extra_groups=None):
    """
    Publica una notificación de cambio de módulo en tiempo real a través de Channels.
    Se despacha típicamente dentro de transaction.on_commit() tras guardar en BD.
    """
    try:
        import time
        now_mono = time.monotonic()
        dedup_key = f"{modulo}:{org_id}:{action}:{record_id}"
        if now_mono - _RECENT_EMISSIONS.get(dedup_key, 0.0) < 0.2:
            return
        _RECENT_EMISSIONS[dedup_key] = now_mono
        if len(_RECENT_EMISSIONS) > 500:
            _RECENT_EMISSIONS.clear()

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

        modulos_destino = {modulo, "general", "inicio"}
        if modulo in ("atenciones", "tubo", "actividades"):
            modulos_destino.update({"atenciones", "tubo", "inicio", "reportes", "actividades"})
        elif modulo in ("metas", "configuracion", "periodos"):
            modulos_destino.update({"metas", "configuracion", "reportes", "inicio"})
        elif modulo in ("delegaciones", "roles", "usuarios"):
            modulos_destino.update({modulo, "usuarios", "inicio"})
        elif modulo in ("tipo_atencion", "sub_atencion"):
            modulos_destino.update({"tipo_atencion", "sub_atencion", "atenciones"})

        grupos = set()
        for mod in modulos_destino:
            grupos.add(f"crud_{mod}_{org_id}")
            grupos.add(f"crud_{mod}_all")

        if extra_groups:
            grupos.update(extra_groups)

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


def register_realtime_crud_signals():
    """
    Conecta señales post_save y post_delete con transaction.on_commit()
    para que absolutamente todos los módulos del sistema reflejen los cambios en tiempo real.
    """
    import sys
    if "seed_data" in sys.argv or "migrate" in sys.argv or "flush" in sys.argv:
        return

    from django.db import transaction
    from django.db.models.signals import post_save, post_delete

    MODEL_MODULE_MAP = {
        "Delegacion": ("delegaciones", lambda inst: "global"),
        "Rol": ("roles", lambda inst: "global"),
        "Funcionario": ("usuarios", lambda inst: str(inst.delegacion_id) if getattr(inst, "delegacion_id", None) else "global"),
        "FuncionarioRol": ("usuarios", lambda inst: str(inst.funcionario.delegacion_id) if getattr(inst, "funcionario_id", None) and getattr(inst.funcionario, "delegacion_id", None) else "global"),
        "Sector": ("sectores", lambda inst: str(inst.delegacion_id) if getattr(inst, "delegacion_id", None) else "global"),
        "ItemMedicion": ("metas", lambda inst: "global"),
        "Periodo": ("metas", lambda inst: "global"),
        "ConfiguracionMeta": ("configuracion", lambda inst: str(inst.funcionario.delegacion_id) if getattr(inst, "funcionario_id", None) and getattr(inst.funcionario, "delegacion_id", None) else "global"),
        "TipoAtencion": ("tipo_atencion", lambda inst: "global"),
        "SubAtencion": ("sub_atencion", lambda inst: "global"),
        "TipoGestion": ("tipo_gestion", lambda inst: "global"),
        "Vecino": ("vecinos", lambda inst: str(inst.delegacion_id) if getattr(inst, "delegacion_id", None) else "global"),
        "OrganizacionComunitaria": ("organizaciones", lambda inst: str(inst.delegacion_id) if getattr(inst, "delegacion_id", None) else "global"),
        "AtencionCiudadana": ("atenciones", lambda inst: str(inst.delegacion_id) if getattr(inst, "delegacion_id", None) else "global"),
        "Actividad": ("atenciones", lambda inst: str(inst.funcionario.delegacion_id) if getattr(inst, "funcionario_id", None) and getattr(inst.funcionario, "delegacion_id", None) else "global"),
        "ValidacionEvidencia": ("atenciones", lambda inst: str(inst.actividad.funcionario.delegacion_id) if getattr(inst, "actividad_id", None) and getattr(inst.actividad, "funcionario_id", None) and getattr(inst.actividad.funcionario, "delegacion_id", None) else "global"),
        "EvidenciaArchivo": ("atenciones", lambda inst: str(inst.actividad.funcionario.delegacion_id) if getattr(inst, "actividad_id", None) and getattr(inst.actividad, "funcionario_id", None) and getattr(inst.actividad.funcionario, "delegacion_id", None) else "global"),
        "CompromisoAgenda": ("agenda", lambda inst: "global"),
        "AjusteDesempenio": ("reportes", lambda inst: str(inst.funcionario.delegacion_id) if getattr(inst, "funcionario_id", None) and getattr(inst.funcionario, "delegacion_id", None) else "global"),
    }

    def _handle_model_change(sender, instance, created=False, is_delete=False, **kwargs):
        model_name = sender.__name__
        if model_name not in MODEL_MODULE_MAP:
            return
        modulo, org_resolver = MODEL_MODULE_MAP[model_name]
        try:
            org_id = org_resolver(instance)
        except Exception:
            org_id = "global"

        if is_delete or getattr(instance, "deleted_at", None) is not None:
            action = "delete"
        elif created:
            action = "create"
        else:
            action = "update"

        rec_id = getattr(instance, "pk", 0) or 0
        extra_groups = set()
        if model_name in ("AtencionCiudadana", "Vecino"):
            if getattr(instance, "creado_por_id", None):
                extra_groups.add(f"crud_portal_cliente_user_{instance.creado_por_id}")
            vec_id = getattr(instance, "vecino_id", None) if model_name == "AtencionCiudadana" else getattr(instance, "pk", None)
            if vec_id in (1, 2):
                from django.contrib.auth.models import User
                target_uname = "cliente_1" if vec_id == 1 else "cliente_2"
                u_obj = User.objects.filter(username=target_uname).only("id").first()
                if u_obj:
                    extra_groups.add(f"crud_portal_cliente_user_{u_obj.id}")

        transaction.on_commit(
            lambda: publish_module_changed(
                modulo, org_id, action, rec_id, extra_groups=extra_groups
            )
        )

    def _on_post_save(sender, instance, created, **kwargs):
        _handle_model_change(sender, instance, created=created, is_delete=False, **kwargs)

    def _on_post_delete(sender, instance, **kwargs):
        _handle_model_change(sender, instance, created=False, is_delete=True, **kwargs)

    post_save.connect(_on_post_save, dispatch_uid="sgr_realtime_post_save")
    post_delete.connect(_on_post_delete, dispatch_uid="sgr_realtime_post_delete")

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

