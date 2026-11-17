from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.decorators.http import require_GET, require_POST
from accounts.models import Cargo, Delegacion, Funcionario, Sector
from core.context_processors import global_context
from .models import ChatContactPreference, ChatMessage
from .services import (
    build_direct_room_id,
    can_contact_user,
    can_access_support_channel,
    delete_chat_message,
    get_active_conversations,
    get_chat_access,
    get_chat_contacts,
    get_recent_chat_messages,
    get_recent_support_messages,
    get_unread_counts_by_sender,
    mark_chat_messages_read,
    parse_direct_room_id,
    publish_chat_message,
    publish_support_message,
    resolve_chat_room,
    SUPPORT_CHANNEL_ID,
    update_chat_message,
)


def _employee_details(user_ids):
    return {
        employee.user_id: employee
        for employee in Funcionario.objects.filter(
            user_id__in=user_ids,
        ).select_related('cargo', 'sector', 'delegacion')
    }


def _user_label(user):
    return user.get_full_name() or user.username


def _chat_url_for_contact(contact_id):
    query = urlencode({'contact': contact_id})
    return '{}?{}'.format(reverse('websocket:chat_index'), query)


@login_required
@xframe_options_sameorigin
def chat_room(request):
    ctx = global_context(request)
    access = get_chat_access(request.user)
    if ctx.get('permisos', {}).get('es_cliente') or access['es_cliente']:
        return redirect('portal_cliente')
    support_channel = request.GET.get('support') == '1'
    if support_channel and not can_access_support_channel(request.user):
        messages.error(request, 'No tienes permiso para acceder a Soporte Técnico.')
        return redirect('websocket:chat_index')
    if request.GET.get('room') and not support_channel:
        legacy_contact_id = request.GET.get('contact', '').strip()
        legacy_contact = (
            get_user_model().objects.filter(
                pk=legacy_contact_id,
                is_active=True,
            ).first()
            if legacy_contact_id.isdigit()
            else None
        )
        if can_contact_user(request.user, legacy_contact, actor_access=access):
            return redirect(_chat_url_for_contact(legacy_contact.pk))
        messages.info(
            request,
            'Las salas compartidas fueron reemplazadas por chats privados. '
            'Selecciona un contacto para continuar.',
        )
        return redirect('websocket:chat_index')

    contact_id = request.GET.get('contact', '').strip() if not support_channel else ''
    conversation_id = SUPPORT_CHANNEL_ID if support_channel else request.GET.get(
        'chat_id',
        request.GET.get('conversation', ''),
    ).strip()
    if contact_id and conversation_id:
        messages.error(request, 'Selecciona un contacto o una conversación, no ambos.')
        return redirect('websocket:chat_index')

    conversation_read_only = False
    direct_contact = None
    participants = []
    initial_messages = []
    conversation_title = 'Soporte Técnico' if support_channel else 'Selecciona una conversación'
    conversation_subtitle = (
        'Canal compartido para reportar fallas, errores y archivos perdidos.'
        if support_channel
        else 'Tus mensajes privados aparecerán aquí.'
    )
    alignment_user_id = request.user.pk

    if support_channel:
        initial_messages = get_recent_support_messages(request.GET.get('q', ''))
    elif contact_id:
        contact = (
            get_user_model().objects.filter(pk=contact_id).first()
            if contact_id.isdigit()
            else None
        )
        if not can_contact_user(request.user, contact, actor_access=access):
            messages.error(request, 'No tienes permiso para contactar a ese usuario.')
            return redirect('websocket:chat_index')
        direct_contact = contact
        conversation_id = build_direct_room_id(request.user.pk, contact.pk)
    elif conversation_id:
        if not resolve_chat_room(request.user, conversation_id):
            messages.error(request, 'No tienes permiso para acceder a esa conversación.')
            return redirect('websocket:chat_index')
        participant_ids = parse_direct_room_id(conversation_id)
        participants = list(
            get_user_model().objects.filter(pk__in=participant_ids).order_by('pk')
        )
        if len(participants) != 2:
            messages.error(request, 'La conversación solicitada ya no está disponible.')
            return redirect('websocket:chat_index')
        conversation_read_only = request.user.pk not in participant_ids
        if not conversation_read_only:
            direct_contact = next(
                participant
                for participant in participants
                if participant.pk != request.user.pk
            )

    if conversation_id and not support_channel:
        participant_ids = parse_direct_room_id(conversation_id)
        if not participants:
            participants = list(
                get_user_model().objects.filter(pk__in=participant_ids).order_by('pk')
            )
        employee_details = _employee_details(participant_ids)
        first_user, second_user = participants
        first_name = _user_label(first_user)
        second_name = _user_label(second_user)
        first_employee = employee_details.get(first_user.pk)
        second_employee = employee_details.get(second_user.pk)
        first_delegation = (
            first_employee.delegacion.nombre
            if first_employee and first_employee.delegacion_id
            else 'Sin delegación'
        )
        second_delegation = (
            second_employee.delegacion.nombre
            if second_employee and second_employee.delegacion_id
            else 'Sin delegación'
        )
        if conversation_read_only:
            conversation_title = f'{first_name} ↔ {second_name}'
            conversation_subtitle = (
                f'{first_delegation} · {second_delegation} · '
                'Vista global de solo lectura'
            )
            alignment_user_id = first_user.pk
        else:
            display_name = ChatContactPreference.objects.filter(
                owner=request.user,
                contact=direct_contact,
            ).values_list('display_name', flat=True).first()
            conversation_title = display_name or _user_label(direct_contact)
            direct_employee = employee_details.get(direct_contact.pk)
            cargo = (
                direct_employee.cargo.nombre_cargo
                if direct_employee and direct_employee.cargo_id
                else 'Funcionario'
            )
            delegation = (
                direct_employee.delegacion.nombre
                if direct_employee and direct_employee.delegacion_id
                else 'Sin delegación'
            )
            conversation_subtitle = f'{cargo} · {delegation}'
        if request.user.pk in participant_ids:
            mark_chat_messages_read(request.user, conversation_id)
        initial_messages = get_recent_chat_messages(conversation_id, request.user)

    can_send_message = bool(
        support_channel
        or (
            conversation_id
            and direct_contact
            and not conversation_read_only
            and can_contact_user(request.user, direct_contact, actor_access=access)
        )
    )
    cargos_filtro = Cargo.objects.order_by('nombre_cargo')
    can_filter_delegaciones = access['es_admin'] or access['es_global']
    delegaciones_filtro = Delegacion.objects.filter(estado='Activa').order_by('id') if can_filter_delegaciones else []
    delegacion_seleccionada_chat = None
    if can_filter_delegaciones:
        if 'delegacion' in request.GET:
            del_param = request.GET.get('delegacion', '').strip()
            if del_param.isdigit():
                delegacion_seleccionada_chat = Delegacion.objects.filter(
                    id=int(del_param),
                    estado='Activa',
                ).first()
        elif ctx.get('delegacion_activa'):
            delegacion_seleccionada_chat = ctx['delegacion_activa']

    return render(request, 'websocket/chat.html', {
        'conversation_id': conversation_id,
        'is_support_channel': support_channel,
        'support_query': request.GET.get('q', '').strip() if support_channel else '',
        'support_messages_url': reverse('websocket:support_messages'),
        'support_send_url': reverse('websocket:support_send'),
        'direct_contact': direct_contact,
        'conversation_participants': participants,
        'conversation_read_only': conversation_read_only,
        'conversation_title': conversation_title,
        'conversation_subtitle': conversation_subtitle,
        'alignment_user_id': alignment_user_id,
        'initial_messages': initial_messages,
        'chat_contacts_url': reverse('websocket:contacts'),
        'can_manage_contacts': access['es_admin'],
        'is_chat_global': access['es_global'],
        'can_filter_delegaciones': can_filter_delegaciones,
        'cargos_filtro': cargos_filtro,
        'delegaciones_filtro': delegaciones_filtro,
        'delegacion_seleccionada_chat': delegacion_seleccionada_chat,
        'can_send_message': can_send_message,
        'chat_widget_mode': request.GET.get('widget') == '1',
        'message_action_url': reverse('websocket:message_action'),
        'contact_preference_url': reverse('websocket:contact_preference', args=[0]),
        **ctx,
    })


@login_required
@require_POST
def send_message(request):
    access = get_chat_access(request.user)
    if access['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)

    conversation_id = request.POST.get(
        'chat_id',
        request.POST.get('conversation', ''),
    ).strip()
    participants = parse_direct_room_id(conversation_id)
    if (
        not participants
        or request.user.pk not in participants
        or not resolve_chat_room(request.user, conversation_id)
    ):
        return JsonResponse(
            {'error': 'No tienes permiso para enviar mensajes en esta conversación.'},
            status=403,
        )

    message = request.POST.get('message', '').strip()
    if not 1 <= len(message) <= 300:
        return JsonResponse(
            {'error': 'Mensaje inválido. Debe tener entre 1 y 300 caracteres.'},
            status=400,
        )

    try:
        payload = publish_chat_message(request.user, conversation_id, message)
    except PermissionError:
        return JsonResponse({'error': 'No tienes permiso para enviar el mensaje.'}, status=403)
    return JsonResponse({'ok': True, 'item': payload})


@login_required
@require_GET
def support_messages_feed(request):
    query = request.GET.get('q', '').strip()
    if len(query) > 100:
        return JsonResponse({'error': 'La búsqueda no puede superar 100 caracteres.'}, status=400)
    if not can_access_support_channel(request.user):
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)
    return JsonResponse({
        'ok': True,
        'messages': get_recent_support_messages(query),
    })


@login_required
@require_POST
def support_send_message(request):
    if not can_access_support_channel(request.user):
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)
    message = request.POST.get('message', '')
    try:
        payload = publish_support_message(request.user, message)
    except ValueError as error:
        return JsonResponse({'error': str(error)}, status=400)
    except PermissionError as error:
        return JsonResponse({'error': str(error)}, status=403)
    return JsonResponse({'ok': True, 'item': payload})


@login_required
@require_GET
def messages_feed(request):
    access = get_chat_access(request.user)
    if access['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)

    conversation_id = request.GET.get(
        'chat_id',
        request.GET.get('conversation', ''),
    ).strip()
    if not resolve_chat_room(request.user, conversation_id):
        return JsonResponse(
            {'error': 'No tienes permiso para acceder a esta conversación.'},
            status=403,
        )
    return JsonResponse({
        'ok': True,
        'messages': get_recent_chat_messages(conversation_id, request.user),
    })


@login_required
@require_POST
def message_action(request):
    if get_chat_access(request.user)['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)

    conversation_id = request.POST.get('chat_id', '').strip()
    message_id = request.POST.get('message_id', '').strip()
    action = request.POST.get('action', '').strip()
    if not message_id.isdigit():
        return JsonResponse({'error': 'El mensaje no es válido.'}, status=400)
    if action == 'edit':
        new_text = request.POST.get('message', '').strip()
        if not 1 <= len(new_text) <= 300:
            return JsonResponse(
                {'error': 'El mensaje debe tener entre 1 y 300 caracteres.'},
                status=400,
            )
        try:
            payload = update_chat_message(
                request.user,
                conversation_id,
                int(message_id),
                new_text,
            )
        except ChatMessage.DoesNotExist:
            return JsonResponse({'error': 'El mensaje no existe.'}, status=404)
        except PermissionError as error:
            return JsonResponse({'error': str(error)}, status=403)
    elif action in {'delete_everyone', 'delete_me'}:
        try:
            payload = delete_chat_message(
                request.user,
                conversation_id,
                int(message_id),
                'everyone' if action == 'delete_everyone' else 'me',
            )
        except ChatMessage.DoesNotExist:
            return JsonResponse({'error': 'El mensaje no existe.'}, status=404)
        except PermissionError as error:
            return JsonResponse({'error': str(error)}, status=403)
    else:
        return JsonResponse({'error': 'La acción no es válida.'}, status=400)
    return JsonResponse({'ok': True, 'item': payload})


@login_required
@require_POST
def contact_preference(request, contact_id):
    if get_chat_access(request.user)['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)
    contact = get_user_model().objects.filter(pk=contact_id, is_active=True).first()
    if not contact or contact.pk == request.user.pk or not (
        can_contact_user(request.user, contact)
        or can_contact_user(contact, request.user)
    ):
        return JsonResponse({'error': 'No tienes permiso para modificar este contacto.'}, status=403)

    action = request.POST.get('action', '').strip()
    if action == 'rename':
        display_name = request.POST.get('display_name', '').strip()
        if len(display_name) > 80:
            return JsonResponse({'error': 'El apodo no puede superar 80 caracteres.'}, status=400)
        preference, _ = ChatContactPreference.objects.get_or_create(
            owner=request.user,
            contact=contact,
        )
        preference.display_name = display_name
        preference.save(update_fields=('display_name',))
    elif action == 'hide':
        preference, _ = ChatContactPreference.objects.get_or_create(
            owner=request.user,
            contact=contact,
        )
        preference.hidden_at = timezone.now()
        preference.save(update_fields=('hidden_at',))
    else:
        return JsonResponse({'error': 'La acción no es válida.'}, status=400)
    return JsonResponse({'ok': True})


@login_required
@require_GET
def contacts_feed(request):
    access = get_chat_access(request.user)
    if access['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)

    contacts = list(get_chat_contacts(request.user, request.GET))
    display_names = dict(
        ChatContactPreference.objects.filter(
            owner=request.user,
            contact_id__in=[contact.user_id for contact in contacts],
        ).values_list('contact_id', 'display_name')
    )
    unread_counts = get_unread_counts_by_sender(
        request.user,
        [contact.user_id for contact in contacts],
    )
    contact_user_ids = {contact.user_id for contact in contacts}
    last_msg_by_contact = {}
    if contact_user_ids:
        user_messages = ChatMessage.objects.filter(
            (Q(sender=request.user) & Q(recipient_id__in=contact_user_ids))
            | (Q(recipient=request.user) & Q(sender_id__in=contact_user_ids))
        ).order_by('-created_at', '-id')
        for msg in user_messages.iterator():
            if request.user.pk in (msg.oculto_para or []):
                continue
            other_id = msg.recipient_id if msg.sender_id == request.user.pk else msg.sender_id
            if other_id not in last_msg_by_contact:
                last_msg_by_contact[other_id] = {
                    'message': msg.message,
                    'time': timezone.localtime(msg.created_at).strftime('%H:%M'),
                    'ts': msg.created_at.timestamp(),
                    'sender_id': msg.sender_id,
                }
                if len(last_msg_by_contact) == len(contact_user_ids):
                    break

    scope = request.GET.get('scope', '').strip().lower()
    response_contacts = []
    for contact in contacts:
        last_info = last_msg_by_contact.get(contact.user_id)
        if scope == 'active' and not last_info:
            continue
        response_contacts.append({
            'id': contact.user_id,
            'rut': contact.identificador_institucional,
            'nombre': contact.user.first_name,
            'apellido': contact.user.last_name,
            'cargo': contact.cargo.nombre_cargo if contact.cargo_id else '',
            'seccion': contact.sector.nombre if contact.sector_id else '',
            'delegacion': contact.delegacion.nombre if contact.delegacion_id else 'Global',
            'rol': contact.funcionariorol_set.first().rol.nombre_rol
            if contact.funcionariorol_set.exists()
            else 'Funcionario',
            'puede_contactar': can_contact_user(
                request.user,
                contact,
                actor_access=access,
            ),
            'activo': contact.estado,
            'unread_count': unread_counts.get(contact.user_id, 0),
            'display_name': display_names.get(contact.user_id, ''),
            'has_messages': bool(last_info),
            'last_message': last_info['message'] if last_info else '',
            'last_time': last_info['time'] if last_info else '',
            'last_ts': last_info['ts'] if last_info else 0,
        })

    if scope == 'active':
        response_contacts.sort(key=lambda item: (-item['last_ts'], item['nombre'], item['apellido']))

    return JsonResponse({
        'ok': True,
        'contacts': response_contacts,
        'conversations': get_active_conversations(request.GET) if access['es_global'] else [],
    })


@login_required
@require_POST
def mark_read(request):
    access = get_chat_access(request.user)
    if access['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)
    conversation_id = request.POST.get(
        'chat_id',
        request.POST.get('conversation', ''),
    ).strip()
    participants = parse_direct_room_id(conversation_id)
    if (
        not participants
        or request.user.pk not in participants
        or not resolve_chat_room(request.user, conversation_id)
    ):
        return JsonResponse(
            {'error': 'Solo los participantes pueden marcar sus mensajes como leídos.'},
            status=403,
        )
    updated = mark_chat_messages_read(request.user, conversation_id)
    return JsonResponse({'ok': True, 'marked_read': updated})


def _chat_notification_url(sender_id):
    return _chat_url_for_contact(sender_id)


@login_required
@require_GET
def unread_count(request):
    access = get_chat_access(request.user)
    if access['es_cliente']:
        return JsonResponse({'error': 'Acceso denegado.'}, status=403)

    after_value = request.GET.get('notified_after') or request.GET.get('after')
    notification_after = parse_datetime(after_value) if after_value else timezone.now()
    if notification_after is None or notification_after.utcoffset() is None:
        return JsonResponse({'error': 'La fecha de consulta no es válida.'}, status=400)

    unread_messages = ChatMessage.objects.filter(
        recipient=request.user,
        leido=False,
    )
    unread_rows = list(unread_messages.values_list('oculto_para', flat=True))
    unread_total = sum(
        1 for hidden_for in unread_rows
        if request.user.pk not in (hidden_for or [])
    )
    notifications = [
        message for message in ChatMessage.objects.filter(
            recipient=request.user,
            created_at__gt=notification_after,
            leido=False,
        )
        .select_related('sender')
        .order_by('created_at', 'id')[:100]
        if request.user.pk not in (message.oculto_para or [])
    ][:20]
    notification_count = sum(
        1 for hidden_for in ChatMessage.objects.filter(
            recipient=request.user,
            created_at__gt=notification_after,
            leido=False,
        ).values_list('oculto_para', flat=True)
        if request.user.pk not in (hidden_for or [])
    )
    notifications_through = (
        notifications[-1].created_at
        if notification_count > len(notifications)
        else timezone.now()
    )
    return JsonResponse({
        'ok': True,
        'unread': unread_total,
        'notifications': [
            {
                'id': str(message.id),
                'sender': _user_label(message.sender),
                'message': message.message,
                'url': _chat_notification_url(message.sender_id),
            }
            for message in notifications
        ],
        'notifications_through': notifications_through.isoformat(),
    })
