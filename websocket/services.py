import logging
import unicodedata
from asgiref.sync import async_to_sync
try:
    from channels.layers import get_channel_layer
except ImportError:
    def get_channel_layer():
        return None
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import Funcionario
from .models import ChatContactPreference, ChatMessage, TechnicalSupportMessage

logger = logging.getLogger(__name__)
SUPPORT_CHANNEL_ID = 'technical_support'


def _normalize_role(value):
    normalized = unicodedata.normalize('NFKD', value or '')
    return ''.join(
        character for character in normalized
        if not unicodedata.combining(character)
    ).casefold().strip()


def _role_names(funcionario):
    return [
        _normalize_role(entry.rol.nombre_rol)
        for entry in funcionario.funcionariorol_set.all()
        if entry.rol
    ]


def get_chat_access(user):
    funcionario = Funcionario.objects.filter(user=user).select_related(
        'delegacion',
    ).first()
    roles = _role_names(funcionario) if funcionario else []
    es_admin = bool(
        user.is_superuser
        or any(name in {'administrador', 'superadministrador'} for name in roles)
    )
    alcance_global = 'delegacion global' in roles
    es_admin = es_admin or alcance_global
    es_delegado = any('delegad' in name for name in roles)
    es_cliente = any('cliente' in name for name in roles)

    return {
        'funcionario': funcionario,
        'es_admin': es_admin,
        'es_delegado': es_delegado,
        'es_global': alcance_global,
        'es_cliente': es_cliente,
    }


def can_access_support_channel(user):
    if not user or not user.is_authenticated or not user.is_active:
        return False
    access = get_chat_access(user)
    if access['es_cliente']:
        return False
    funcionario = access['funcionario']
    return bool(
        user.is_superuser
        or funcionario and (funcionario.estado or '').casefold() == 'activo'
    )


def _support_delegation_label(user):
    access = get_chat_access(user)
    funcionario = access['funcionario']
    delegation = (
        funcionario.delegacion.nombre
        if funcionario and funcionario.delegacion_id
        else 'Global' if access['es_global'] else 'Administración'
        if user.is_superuser else 'Sin delegación'
    )
    return (
        delegation
        if 'delegaci' in _normalize_role(delegation)
        else f'Delegación {delegation}'
    )


def get_recent_support_messages(query=''):
    messages = TechnicalSupportMessage.objects.select_related('sender')
    query = query.strip()
    if query:
        messages = messages.filter(
            Q(message__icontains=query)
            | Q(sender_name__icontains=query)
            | Q(delegation_name__icontains=query)
        )
    return [
        {
            'id': str(message.pk),
            'type': 'support_message',
            'chat_id': SUPPORT_CHANNEL_ID,
            'sender_id': message.sender_id,
            'sender_name': message.sender_name,
            'delegation': message.delegation_name,
            'username': f'{message.sender_name} - {message.delegation_name}',
            'message': message.message,
            'time': timezone.localtime(message.created_at).strftime('%H:%M'),
        }
        for message in messages.order_by('-created_at', '-id')[:200][::-1]
    ]


def publish_support_message(user, message):
    if not can_access_support_channel(user):
        raise PermissionError('No tienes permiso para usar Soporte Técnico.')
    message = message.strip()
    if not 1 <= len(message) <= 300:
        raise ValueError('El mensaje debe tener entre 1 y 300 caracteres.')

    sender_name = user.get_full_name() or user.username
    support_message = TechnicalSupportMessage.objects.create(
        sender=user,
        sender_name=sender_name,
        delegation_name=_support_delegation_label(user),
        message=message,
    )
    payload = {
        'id': str(support_message.pk),
        'type': 'support_message',
        'chat_id': SUPPORT_CHANNEL_ID,
        'sender_id': user.pk,
        'sender_name': support_message.sender_name,
        'delegation': support_message.delegation_name,
        'username': f'{support_message.sender_name} - {support_message.delegation_name}',
        'message': support_message.message,
        'time': timezone.localtime(support_message.created_at).strftime('%H:%M'),
    }
    try:
        layer = get_channel_layer()
        if layer is not None:
            async_to_sync(layer.group_send)(
                'technical_support_room',
                {
                    'type': 'support_event',
                    'payload': payload,
                },
            )
    except Exception:
        logger.exception('Error al emitir un mensaje de Soporte Técnico.')
    return payload


def build_direct_room_id(user_id, contact_id):
    return build_chat_id(user_id, contact_id)


def build_chat_id(user_id, contact_id):
    first_id, second_id = sorted((int(user_id), int(contact_id)))
    return f'direct_{first_id}_{second_id}'


def parse_direct_room_id(room_id):
    if not isinstance(room_id, str):
        return None
    parts = room_id.split('_')
    if (
        len(parts) != 3
        or parts[0] != 'direct'
        or not parts[1].isdigit()
        or not parts[2].isdigit()
    ):
        return None
    first_id, second_id = int(parts[1]), int(parts[2])
    if first_id <= 0 or first_id >= second_id:
        return None
    return first_id, second_id


def can_contact_user(user, contact, actor_access=None):
    if not contact:
        return False

    if isinstance(contact, Funcionario):
        contact_funcionario = contact
        contact_user = contact.user
        if (contact_funcionario.estado or '').casefold() != 'activo' or not contact_user.is_active:
            return False
        contact_role_names = _role_names(contact_funcionario)
        contact_is_admin = bool(
            contact_user.is_superuser
            or any(
                name in {'administrador', 'superadministrador', 'delegacion global'}
                for name in contact_role_names
            )
        )
        contact_is_cliente = any('cliente' in name for name in contact_role_names)
    else:
        contact_user = contact
        contact_funcionario = Funcionario.objects.filter(
            user=contact_user,
            estado__iexact='Activo',
            user__is_active=True,
        ).select_related('delegacion').first()
        if not contact_funcionario:
            return False
        contact_role_names = _role_names(contact_funcionario)
        contact_is_admin = bool(
            contact_user.is_superuser
            or any(
                name in {'administrador', 'superadministrador', 'delegacion global'}
                for name in contact_role_names
            )
        )
        contact_is_cliente = any('cliente' in name for name in contact_role_names)

    if user.pk == contact_user.pk:
        return False
    access = actor_access or get_chat_access(user)
    if access['es_cliente']:
        return False
    if contact_is_cliente or not contact_user.is_active:
        return False
    if access['es_global']:
        return True

    funcionario = access['funcionario']
    same_delegation = bool(
        funcionario
        and funcionario.delegacion_id
        and funcionario.delegacion_id == contact_funcionario.delegacion_id
    )
    if access['es_admin']:
        return contact_is_admin or same_delegation
    if contact_is_admin and access['es_delegado']:
        return True
    if same_delegation:
        return True
    return False


def resolve_chat_room(user, room_id=None):
    access = get_chat_access(user)
    participants = parse_direct_room_id(room_id)
    if not participants:
        return None

    if get_user_model().objects.filter(pk__in=participants).count() != 2:
        return None
    if user.pk not in participants:
        if not access['es_global']:
            return None
        return room_id if ChatMessage.objects.filter(chat_id=room_id).exists() else None

    other_id = participants[1] if participants[0] == user.pk else participants[0]
    contact = get_user_model().objects.filter(pk=other_id, is_active=True).first()
    return room_id if can_contact_user(user, contact, actor_access=access) else None


def get_chat_contacts(user, filters=None):
    access = get_chat_access(user)
    if access['es_cliente']:
        return []

    filters = filters or {}
    contacts = Funcionario.objects.filter(
        estado__iexact='Activo',
        user__is_active=True,
    ).select_related('user', 'cargo', 'sector', 'delegacion').prefetch_related(
        'funcionariorol_set__rol',
    ).exclude(
        funcionariorol__rol__nombre_rol__icontains='cliente',
    ).exclude(
        user__chat_contact_preferences__owner=user,
        user__chat_contact_preferences__hidden_at__isnull=False,
    ).distinct()

    admin_contact = (
        Q(user__is_superuser=True)
        | Q(funcionariorol__rol__nombre_rol__iregex=r'administrador|superadministrador')
        | Q(funcionariorol__rol__nombre_rol__iexact='Delegación Global')
    )
    if not access['es_global']:
        funcionario = access['funcionario']
        if access['es_admin']:
            if funcionario and funcionario.delegacion_id:
                contacts = contacts.filter(
                    Q(delegacion_id=funcionario.delegacion_id) | admin_contact
                )
            else:
                contacts = contacts.filter(admin_contact)
        elif funcionario and funcionario.delegacion_id:
            delegation_filter = Q(delegacion_id=funcionario.delegacion_id)
            if access['es_delegado']:
                delegation_filter |= admin_contact
            contacts = contacts.filter(delegation_filter)
        else:
            return []

    rut = filters.get('rut', '').strip()
    query = filters.get('q', '').strip()
    nombre = filters.get('nombre', '').strip()
    apellido = filters.get('apellido', '').strip()
    cargo = filters.get('cargo', '').strip()
    seccion = filters.get('seccion', '').strip()
    delegacion = filters.get('delegacion', '').strip()
    if rut:
        contacts = contacts.filter(identificador_institucional__icontains=rut)
    if query:
        contacts = contacts.filter(
            Q(identificador_institucional__icontains=query)
            | Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
            | Q(cargo__nombre_cargo__icontains=query)
            | Q(sector__nombre__icontains=query)
            | Q(delegacion__nombre__icontains=query)
        )
    if nombre:
        contacts = contacts.filter(
            Q(user__first_name__icontains=nombre)
            | Q(user__last_name__icontains=nombre)
        )
    if apellido:
        contacts = contacts.filter(
            Q(user__last_name__icontains=apellido)
            | Q(user__first_name__icontains=apellido)
        )
    if cargo:
        contacts = contacts.filter(cargo__nombre_cargo__icontains=cargo)
    if seccion:
        contacts = contacts.filter(sector__nombre__icontains=seccion)
    if delegacion and access['es_global']:
        if delegacion.isdigit():
            contacts = contacts.filter(delegacion_id=int(delegacion))
        else:
            contacts = contacts.filter(delegacion__nombre__icontains=delegacion)

    return contacts.exclude(user=user).order_by('user__first_name', 'user__last_name')


def get_unread_counts_by_sender(user, sender_ids):
    counts = {}
    for sender_id, hidden_for in ChatMessage.objects.filter(
        recipient=user,
        sender_id__in=sender_ids,
        leido=False,
    ).values_list('sender_id', 'oculto_para'):
        if user.pk not in (hidden_for or []):
            counts[sender_id] = counts.get(sender_id, 0) + 1
    return counts


def get_active_conversations(filters=None):
    filters = filters or {}
    chat_ids = ChatMessage.objects.values_list('chat_id', flat=True).distinct()
    participant_pairs = {
        participants
        for chat_id in chat_ids
        if (participants := parse_direct_room_id(chat_id))
    }
    participant_ids = {user_id for pair in participant_pairs for user_id in pair}
    users = get_user_model().objects.filter(pk__in=participant_ids).in_bulk()
    funcionarios = {
        funcionario.user_id: funcionario
        for funcionario in Funcionario.objects.filter(
            user_id__in=participant_ids,
        ).select_related('delegacion')
    }
    conversations = []
    for first_id, second_id in participant_pairs:
        chat_id = build_chat_id(first_id, second_id)
        first_user = users.get(first_id)
        second_user = users.get(second_id)
        if not first_user or not second_user:
            continue
        pair_messages = ChatMessage.objects.filter(chat_id=chat_id)
        latest = pair_messages.select_related('sender').order_by(
            '-created_at', '-id'
        ).first()
        if not latest:
            continue

        first_name = first_user.get_full_name() or first_user.username
        second_name = second_user.get_full_name() or second_user.username
        first_funcionario = funcionarios.get(first_id)
        second_funcionario = funcionarios.get(second_id)
        first_delegation = (
            first_funcionario.delegacion.nombre
            if first_funcionario and first_funcionario.delegacion_id
            else 'Sin delegación'
        )
        second_delegation = (
            second_funcionario.delegacion.nombre
            if second_funcionario and second_funcionario.delegacion_id
            else 'Sin delegación'
        )
        search_values = {
            'q': ' '.join((first_name, second_name, latest.message)),
            'rut': ' '.join((
                first_funcionario.identificador_institucional
                if first_funcionario else '',
                second_funcionario.identificador_institucional
                if second_funcionario else '',
            )),
            'nombre': ' '.join((first_user.first_name, second_user.first_name)),
            'apellido': ' '.join((first_user.last_name, second_user.last_name)),
            'cargo': ' '.join((
                first_funcionario.cargo.nombre_cargo
                if first_funcionario and first_funcionario.cargo_id else '',
                second_funcionario.cargo.nombre_cargo
                if second_funcionario and second_funcionario.cargo_id else '',
            )),
            'seccion': ' '.join((
                first_funcionario.sector.nombre
                if first_funcionario and first_funcionario.sector_id else '',
                second_funcionario.sector.nombre
                if second_funcionario and second_funcionario.sector_id else '',
            )),
            'delegacion': ' '.join((first_delegation, second_delegation)),
        }
        if any(
            value.strip()
            and _normalize_role(value.strip()) not in _normalize_role(search_values[field])
            for field, value in (
                (name, filters.get(name, ''))
                for name in search_values
            )
        ):
            continue
        conversations.append({
            'chat_id': chat_id,
            'conversation_id': chat_id,
            'id': chat_id,
            'label': (
                f'{first_name} · {first_delegation} ↔ '
                f'{second_name} · {second_delegation}'
            ),
            'last_message': latest.message,
            'last_sender': latest.sender.get_full_name() or latest.sender.username,
            'last_time': timezone.localtime(latest.created_at).strftime('%H:%M'),
            'unread_count': pair_messages.filter(leido=False).count(),
            'last_created_at': latest.created_at,
        })
    return sorted(
        conversations,
        key=lambda item: (item['last_created_at'], item['conversation_id']),
        reverse=True,
    )


def get_recent_chat_messages(chat_id, user):
    participants = parse_direct_room_id(chat_id)
    if not participants or not resolve_chat_room(user, chat_id):
        return []
    messages = ChatMessage.objects.filter(chat_id=chat_id)
    result = []
    for message in messages.select_related('sender').order_by(
        '-created_at', '-id'
    )[:100][::-1]:
        if user.pk in (message.oculto_para or []):
            continue
        result.append({
            'id': str(message.id),
            'type': 'chat_message',
            'sender_id': message.sender_id,
            'recipient_id': message.recipient_id,
            'leido': message.leido,
            'editado': message.editado,
            'eliminado': message.eliminado,
            'username': message.sender.get_full_name() or message.sender.username,
            'message': message.message,
            'chat_id': chat_id,
            'conversation_id': chat_id,
            'time': timezone.localtime(message.created_at).strftime('%H:%M'),
        })
    return result


def mark_chat_messages_read(user, chat_id):
    participants = parse_direct_room_id(chat_id)
    if not participants or user.pk not in participants or not resolve_chat_room(user, chat_id):
        return 0
    other_id = participants[1] if participants[0] == user.pk else participants[0]
    return ChatMessage.objects.filter(
        chat_id=chat_id,
        sender_id=other_id,
        recipient=user,
        leido=False,
    ).update(leido=True)


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

def publish_chat_message(user, chat_id, message):
    participants = parse_direct_room_id(chat_id)
    if not participants or user.pk not in participants or not resolve_chat_room(user, chat_id):
        raise PermissionError('No tienes permiso para enviar mensajes en esta conversación.')

    recipient_id = participants[1] if participants[0] == user.pk else participants[0]
    recipient = get_user_model().objects.filter(pk=recipient_id, is_active=True).first()
    if not can_contact_user(user, recipient):
        raise PermissionError('No tienes permiso para contactar a este usuario.')
    chat_message = ChatMessage.objects.create(
        chat_id=chat_id,
        sender=user,
        recipient=recipient,
        message=message,
    )
    ChatContactPreference.objects.filter(
        owner=recipient,
        contact=user,
        hidden_at__isnull=False,
    ).update(hidden_at=None)
    msg_payload = {
        "id": str(chat_message.id),
        "type": "chat_message",
        "sender_id": user.pk,
        "recipient_id": recipient.pk,
        "leido": chat_message.leido,
        "editado": chat_message.editado,
        "eliminado": chat_message.eliminado,
        "username": user.get_full_name() or user.username,
        "message": message,
        "chat_id": chat_id,
        "conversation_id": chat_id,
        "time": timezone.localtime(chat_message.created_at).strftime('%H:%M'),
    }

    try:
        layer = get_channel_layer()
        if layer is not None:
            async_to_sync(layer.group_send)(
                f"chat_room_{chat_id}",
                {
                    "type": "chat_event",
                    "payload": msg_payload
                }
            )
            unread_count = ChatMessage.objects.filter(
                sender=user,
                recipient=recipient,
                leido=False,
            ).count()
            notification_payload = {
                "type": "chat_notification",
                "chat_id": chat_id,
                "conversation_id": chat_id,
                "sender_id": user.pk,
                "recipient_id": recipient.pk,
                "sender": user.get_full_name() or user.username,
                "message": message,
                "unread_count": unread_count,
                "time": msg_payload["time"],
            }
            async_to_sync(layer.group_send)(
                f"chat_notifications_user_{recipient.pk}",
                {
                    "type": "chat_notification",
                    "payload": notification_payload,
                },
            )
            async_to_sync(layer.group_send)(
                "chat_notifications_global",
                {
                    "type": "chat_notification",
                    "payload": notification_payload,
                },
            )
    except Exception:
        logger.exception("Error al emitir el mensaje del chat en tiempo real.")
    return msg_payload


def update_chat_message(user, chat_id, message_id, new_text):
    participants = parse_direct_room_id(chat_id)
    if (
        not participants
        or user.pk not in participants
        or not resolve_chat_room(user, chat_id)
    ):
        raise PermissionError('No tienes permiso para modificar esta conversación.')

    with transaction.atomic():
        chat_message = ChatMessage.objects.select_for_update().filter(
            pk=message_id,
            chat_id=chat_id,
        ).first()
        if not chat_message:
            raise ChatMessage.DoesNotExist
        if chat_message.sender_id != user.pk:
            raise PermissionError('Solo puedes editar tus propios mensajes.')
        if chat_message.eliminado:
            raise PermissionError('No puedes editar un mensaje eliminado.')
        chat_message.message = new_text
        chat_message.editado = True
        chat_message.save(update_fields=('message', 'editado'))

    return publish_chat_message_update(chat_message, 'updated')


def delete_chat_message(user, chat_id, message_id, scope):
    participants = parse_direct_room_id(chat_id)
    if (
        not participants
        or user.pk not in participants
        or not resolve_chat_room(user, chat_id)
    ):
        raise PermissionError('No tienes permiso para modificar esta conversación.')
    if scope not in {'everyone', 'me'}:
        raise ValueError('El alcance de eliminación no es válido.')

    with transaction.atomic():
        chat_message = ChatMessage.objects.select_for_update().filter(
            pk=message_id,
            chat_id=chat_id,
        ).first()
        if not chat_message:
            raise ChatMessage.DoesNotExist
        if scope == 'everyone':
            if chat_message.sender_id != user.pk:
                raise PermissionError('Solo el emisor puede eliminar para todos.')
            if not chat_message.eliminado:
                chat_message.message = 'Este mensaje fue eliminado'
                chat_message.eliminado = True
                chat_message.save(update_fields=('message', 'eliminado'))
        else:
            hidden_for = list(chat_message.oculto_para or [])
            if user.pk not in hidden_for:
                hidden_for.append(user.pk)
                chat_message.oculto_para = hidden_for
                chat_message.save(update_fields=('oculto_para',))

    return publish_chat_message_update(
        chat_message,
        'deleted' if scope == 'everyone' else 'hidden',
        user_id=user.pk,
    )


def publish_chat_message_update(chat_message, action, user_id=None):
    if action == 'hidden':
        payload = {
            'type': 'chat_message_hidden',
            'id': str(chat_message.pk),
            'chat_id': chat_message.chat_id,
            'user_id': user_id,
        }
    else:
        payload = {
            'type': 'chat_message_updated',
            'id': str(chat_message.pk),
            'chat_id': chat_message.chat_id,
            'sender_id': chat_message.sender_id,
            'recipient_id': chat_message.recipient_id,
            'message': chat_message.message,
            'editado': chat_message.editado,
            'eliminado': chat_message.eliminado,
        }
    try:
        layer = get_channel_layer()
        if layer is not None:
            async_to_sync(layer.group_send)(
                f'chat_room_{chat_message.chat_id}',
                {
                    'type': 'chat_event',
                    'payload': payload,
                },
            )
    except Exception:
        logger.exception('Error al emitir la actualización de un mensaje.')
    return payload

