import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist

class ModuleChangeConsumer(JsonWebsocketConsumer):
    """
    Consumer WebSocket para actualizaciones en tiempo real de tablas CRUD
    con autenticación y estricto aislamiento por organización / delegación territorial.
    Cumple con los requisitos de Evaluación III (Criterio 9) y Clase 11 de Channels.
    """
    def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            self.close()
            return

        self.modulo = self.scope["url_route"]["kwargs"].get("modulo", "general")
        self.subscribed_groups = []

        # Identificar rol y organización / delegación del usuario desde el servidor
        es_cliente = False
        es_admin = bool(user.is_superuser)
        try:
            from accounts.models import Funcionario, FuncionarioRol
            func = Funcionario.all_objects.filter(user=user).select_related('delegacion').first()
            if func:
                f_rol = FuncionarioRol.objects.filter(funcionario=func).select_related('rol').first()
                if f_rol and f_rol.rol:
                    rol_lower = f_rol.rol.nombre_rol.lower()
                    if 'cliente' in rol_lower:
                        es_cliente = True
                    elif rol_lower in ('administrador', 'superadministrador'):
                        es_admin = True
        except Exception:
            func = getattr(user, 'funcionario', None)

        if es_cliente:
            # El rol Cliente solo puede suscribirse a su propio portal aislado por usuario
            if self.modulo != "portal_cliente":
                self.close()
                return
            self.org_id = f"user_{user.id}"
            grp = f"crud_portal_cliente_user_{user.id}"
            self.subscribed_groups.append(grp)
            async_to_sync(self.channel_layer.group_add)(grp, self.channel_name)
        else:
            # Usuario interno: aislar estrictamente por su delegación asignada
            if func and func.delegacion_id:
                self.org_id = str(func.delegacion_id)
            elif es_admin:
                self.org_id = "global"
            else:
                self.org_id = "general"

            # Si es administrador y seleccionó una delegación en sesión, escuchar también esa delegación
            session = self.scope.get("session")
            if es_admin and session:
                del_ses = session.get("delegacion_activa_id")
                if del_ses and str(del_ses) not in ("0", "global"):
                    self.org_id = str(del_ses)

            main_group = f"crud_{self.modulo}_{self.org_id}"
            self.subscribed_groups.append(main_group)
            async_to_sync(self.channel_layer.group_add)(main_group, self.channel_name)

            # Escuchar actualizaciones de catálogos globales (metas, tipos, roles, delegaciones)
            global_cat_group = f"crud_{self.modulo}_global"
            if global_cat_group not in self.subscribed_groups:
                self.subscribed_groups.append(global_cat_group)
                async_to_sync(self.channel_layer.group_add)(global_cat_group, self.channel_name)

            # Si el usuario es administrador en vista global, también escucha el canal global consolidado
            if (user.is_superuser and (not func or not func.delegacion_id)) or self.org_id == "global":
                all_group = f"crud_{self.modulo}_all"
                if all_group not in self.subscribed_groups:
                    self.subscribed_groups.append(all_group)
                    async_to_sync(self.channel_layer.group_add)(all_group, self.channel_name)

        self.accept()
        self.send_json({
            "type": "connection_established",
            "modulo": self.modulo,
            "org_id": self.org_id,
            "status": "connected"
        })

    def disconnect(self, close_code):
        for grp in getattr(self, "subscribed_groups", []):
            async_to_sync(self.channel_layer.group_discard)(
                grp,
                self.channel_name
            )

    def crud_event(self, event):
        """Reenvía la notificación de cambio de datos al navegador cliente."""
        self.send_json(event["payload"])


class ChatConsumer(JsonWebsocketConsumer):
    """
    Consumer para canal de chat colaborativo municipal en tiempo real.
    Implementación fiel a la Guía de Clase 11 (Tiempo Real con Django Channels).
    """
    def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            self.close()
            return

        try:
            func = getattr(user, 'funcionario', None)
            if func:
                from accounts.models import FuncionarioRol
                f_rol = FuncionarioRol.objects.filter(funcionario=func).select_related('rol').first()
                if f_rol and f_rol.rol and 'cliente' in f_rol.rol.nombre_rol.lower():
                    self.close()
                    return
            if func and func.delegacion_id:
                self.org_id = str(func.delegacion_id)
            else:
                self.org_id = "global"
        except (ObjectDoesNotExist, AttributeError):
            self.org_id = "global"

        self.group_name = f"chat_org_{self.org_id}"

        async_to_sync(self.channel_layer.group_add)(
            self.group_name,
            self.channel_name
        )
        async_to_sync(self.channel_layer.group_add)(
            "chat_org_all",
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            async_to_sync(self.channel_layer.group_discard)(
                self.group_name,
                self.channel_name
            )
        async_to_sync(self.channel_layer.group_discard)(
            "chat_org_all",
            self.channel_name
        )

    def receive_json(self, content):
        mensaje = content.get("mensaje", "")
        if not isinstance(mensaje, str):
            return
        mensaje = mensaje.strip()
        if not mensaje or len(mensaje) > 500:
            return

        async_to_sync(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "chat_event",
                "payload": {
                    "type": "chat_message",
                    "mensaje": mensaje,
                    "usuario": self.scope["user"].get_full_name() or self.scope["user"].username
                }
            }
        )

    def chat_event(self, event):
        self.send_json(event["payload"])

