import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

logger = logging.getLogger(__name__)

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
    try:
        layer = get_channel_layer()
        if layer is None:
            return

        async_to_sync(layer.group_send)(
            f"chat_org_{org_id}",
            {
                "type": "chat_event",
                "payload": {
                    "type": "chat_message",
                    "username": user.get_full_name() or user.username,
                    "message": message,
                    "time": timezone.now().strftime('%H:%M')
                }
            }
        )
    except Exception as e:
        logger.error(f"Error en publish_chat_message: {e}")

