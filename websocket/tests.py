from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from config.asgi import application
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from accounts.models import Cargo, Delegacion, Funcionario, FuncionarioRol, Rol, Sector
from .models import ChatMessage, TechnicalSupportMessage
from .services import (
    build_chat_id,
    build_direct_room_id,
    publish_chat_message,
    publish_support_message,
    resolve_chat_room,
)


class PrivateChatTests(TestCase):
    def setUp(self):
        self.centro = Delegacion.objects.create(nombre='Centro', estado='Activa')
        self.norte = Delegacion.objects.create(nombre='Norte', estado='Activa')
        self.sur = Delegacion.objects.create(nombre='Sur', estado='Activa')
        self.sector = Sector.objects.create(
            nombre='Centro Histórico',
            delegacion=self.centro,
            estado='Activo',
        )
        self.cargo = Cargo.objects.create(nombre_cargo='Gestor Territorial')
        self.operador = Rol.objects.create(nombre_rol='Operador', alcance='Delegación')
        self.delegado = Rol.objects.create(
            nombre_rol='Delegado Municipal',
            alcance='Delegación',
        )
        self.global_role = Rol.objects.create(
            nombre_rol='Delegación Global',
            alcance='Global',
        )
        self.admin_role = Rol.objects.create(
            nombre_rol='Administrador',
            alcance='Global',
        )
        self.trabajador = self.create_employee(
            'trabajador',
            '1.111.111-1',
            self.centro,
            self.operador,
            first_name='María Elena',
            last_name='Pérez',
            sector=self.sector,
        )
        self.colega = self.create_employee(
            'colega',
            '2.222.222-2',
            self.centro,
            self.delegado,
            first_name='Diego',
            last_name='Rojas',
            sector=self.sector,
        )
        self.norte_a = self.create_employee(
            'norte_a',
            '3.333.333-3',
            self.norte,
            self.operador,
            first_name='Ana',
            last_name='Silva',
        )
        self.norte_b = self.create_employee(
            'norte_b',
            '4.444.444-4',
            self.norte,
            self.delegado,
            first_name='Rosa',
            last_name='Pizarro',
        )
        self.sur_worker = self.create_employee(
            'sur_worker',
            '5.555.555-5',
            self.sur,
            self.operador,
            first_name='Luis',
            last_name='González',
        )

    def create_employee(
        self,
        username,
        rut,
        delegation,
        role,
        first_name,
        last_name='',
        sector=None,
    ):
        user = User.objects.create_user(
            username=username,
            password='test-password',
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
        )
        employee = Funcionario.objects.create(
            user=user,
            identificador_institucional=rut,
            delegacion=delegation,
            sector=sector,
            cargo=self.cargo,
        )
        FuncionarioRol.objects.create(funcionario=employee, rol=role)
        return user

    def make_message(self, sender, recipient, text, leido=False):
        return ChatMessage.objects.create(
            chat_id=build_chat_id(sender.pk, recipient.pk),
            sender=sender,
            recipient=recipient,
            message=text,
            leido=leido,
        )

    def test_worker_can_only_start_private_chats_with_authorized_contacts(self):
        self.client.force_login(self.trabajador)
        own_chat = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': self.colega.pk},
        )
        cross_delegation_chat = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': self.norte_a.pk},
        )
        old_shared_room = self.client.get(
            reverse('websocket:chat_index'),
            {'room': f'delegacion_{self.centro.pk}'},
        )

        self.assertEqual(own_chat.status_code, 200)
        self.assertContains(own_chat, 'Privado 1 a 1')
        self.assertEqual(cross_delegation_chat.status_code, 302)
        self.assertEqual(old_shared_room.status_code, 302)

    def test_old_room_link_redirects_to_the_private_chat_interface(self):
        self.client.force_login(self.trabajador)
        response = self.client.get(
            reverse('websocket:chat_index'),
            {
                'room': f'delegacion_{self.centro.pk}',
                'contact': self.colega.pk,
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';')[0], 'text/html')
        self.assertContains(response, 'Privado 1 a 1')
        self.assertEqual(
            response.redirect_chain[-1][0],
            f"{reverse('websocket:chat_index')}?contact={self.colega.pk}",
        )

    def test_chat_widget_mode_omits_a_nested_floating_widget(self):
        self.client.force_login(self.trabajador)
        response = self.client.get(
            reverse('websocket:chat_index'),
            {'widget': '1'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('X-Frame-Options'), 'SAMEORIGIN')
        self.assertContains(response, 'chat-widget-mode')
        self.assertNotContains(response, 'id="chat-bubble"')
        self.assertContains(response, 'Filtrar Cargo: Todos')
        self.assertContains(response, 'Filtrar Estado: Activos')
        self.assertNotContains(response, 'Filtrar Sección: Todas')
        self.assertNotContains(response, 'Filtrar Delegación: Todas')
        self.assertNotContains(response, 'name="rut"')
        self.assertNotContains(response, 'name="nombre"')
        self.assertNotContains(response, 'name="apellido"')

        global_user = self.create_employee(
            'global_filter_user',
            '8.888.888-8',
            None,
            self.global_role,
            first_name='Global',
        )
        self.client.force_login(global_user)
        global_page = self.client.get(reverse('websocket:chat_index'))
        self.assertEqual(global_page.status_code, 200)
        self.assertContains(global_page, 'Filtrar Delegación: Todas')
        self.assertContains(global_page, f'{self.centro.get_codigo()} — {self.centro.nombre}')
        self.assertContains(global_page, '>En línea</span>')

        # Si el admin/global cambia la delegación activa, el filtro del chat se sincroniza,
        # y puede cambiarse independientemente por URL/selector
        session = self.client.session
        session['delegacion_activa_id'] = self.norte.pk
        session.save()
        synced_page = self.client.get(reverse('websocket:chat_index'))
        self.assertEqual(synced_page.context['delegacion_seleccionada_chat'].pk, self.norte.pk)
        override_page = self.client.get(reverse('websocket:chat_index'), {'delegacion': ''})
        self.assertIsNone(override_page.context['delegacion_seleccionada_chat'])
        self.assertContains(override_page, 'id="btn-new-conversation"')
        self.assertContains(override_page, 'Conversaciones activas')
        self.assertNotContains(override_page, 'id="global-conversations-section"')
        self.assertContains(override_page, 'id="advanced-filters"\n               class="hidden absolute left-0 right-0 top-full')

        # scope=active devuelve solo contactos con mensajes previos; sin scope devuelve todos (Nueva conversación)
        self.client.force_login(self.trabajador)
        empty_active = self.client.get(reverse('websocket:contacts'), {'scope': 'active'}).json()
        self.assertEqual(empty_active['contacts'], [])
        all_contacts = self.client.get(reverse('websocket:contacts')).json()
        self.assertTrue(any(c['id'] == self.colega.pk for c in all_contacts['contacts']))
        self.make_message(self.trabajador, self.colega, 'Hola colega')
        with_active = self.client.get(reverse('websocket:contacts'), {'scope': 'active'}).json()
        self.assertEqual([c['id'] for c in with_active['contacts']], [self.colega.pk])
        self.assertEqual(with_active['contacts'][0]['last_message'], 'Hola colega')

        # Propio a la derecha en rojo (justify-end + bg-[#C41230]) y recibido a la izquierda en blanco (justify-start + bg-white)
        self.make_message(self.colega, self.trabajador, 'Respuesta recibida')
        chat_view = self.client.get(reverse('websocket:chat_index'), {'contact': self.colega.pk})
        html_chat = chat_view.content.decode('utf-8')
        self.assertIn('flex justify-end', html_chat)
        self.assertIn('chat-message-own bg-[#C41230] text-white', html_chat)
        self.assertIn('flex justify-start', html_chat)
        self.assertIn('chat-message-other bg-white text-slate-800', html_chat)
        self.assertIn("(ownMessage ? 'justify-end' : 'justify-start')", html_chat)

        # Verificar filtro de estado Activo/Inactivo para administrador
        inactivo = self.create_employee(
            'inactivo_chat',
            '9.111.111-1',
            self.centro,
            self.operador,
            first_name='Inactivo',
        )
        emp_inactivo = Funcionario.objects.get(user=inactivo)
        emp_inactivo.estado = 'Inactivo'
        emp_inactivo.save(update_fields=['estado'])
        resp_inact = self.client.get(reverse('websocket:contacts'), {'estado': 'Inactivo'}).json()
        self.assertTrue(any(c['id'] == inactivo.pk for c in resp_inact['contacts']))
        self.assertFalse(any(c['id'] == self.trabajador.pk for c in resp_inact['contacts']))

    def test_aura_widget_is_hidden_until_a_provider_is_configured(self):
        employee = Funcionario.objects.get(user=self.trabajador)
        employee.tratamiento = 'femenino'
        employee.save(update_fields=['tratamiento'])
        self.client.force_login(self.trabajador)

        response = self.client.get(reverse('websocket:chat_index'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="chat-bubble"')
        self.assertNotContains(response, 'id="aura-launcher"')
        self.assertNotContains(response, 'id="aura-panel"')
        self.assertNotContains(response, 'enviarPromptIA')

    def test_user_management_can_save_aura_greeting_treatment(self):
        manager = User.objects.create_superuser(
            username='aura_manager',
            email='aura-manager@example.test',
            password='test-password',
        )
        employee = Funcionario.objects.get(user=self.trabajador)
        self.client.force_login(manager)

        page = self.client.get(reverse('gestion_usuarios'))
        updated = self.client.post(
            reverse('gestion_usuarios_editar', args=[employee.pk]),
            {
                'nombre': self.trabajador.first_name,
                'correo': 'trabajador@example.test',
                'identificador_contacto': employee.identificador_institucional,
                'cargo_id': self.cargo.pk,
                'rol_id': self.operador.pk,
                'delegacion_id': self.centro.pk,
                'sector_id': self.sector.pk,
                'estado': 'Activo',
                'tratamiento': 'femenino',
            },
        )

        employee.refresh_from_db()
        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'Tratamiento del saludo de AURA')
        self.assertEqual(updated.status_code, 302)
        self.assertEqual(employee.tratamiento, 'femenino')

    def test_support_channel_is_shared_identifies_authors_and_searches_messages(self):
        self.client.force_login(self.trabajador)
        page = self.client.get(
            reverse('websocket:chat_index'),
            {'support': '1'},
        )
        sent = self.client.post(
            reverse('websocket:support_send'),
            {'message': 'Se perdió un archivo importante'},
        )

        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'Soporte Técnico')
        self.assertContains(page, 'Buscar mensajes')
        self.assertEqual(sent.status_code, 200)
        self.assertEqual(
            sent.json()['item']['username'],
            'María Elena Pérez - Delegación Centro',
        )
        support_message = TechnicalSupportMessage.objects.get()
        self.assertEqual(support_message.sender_id, self.trabajador.pk)
        self.assertEqual(support_message.delegation_name, 'Delegación Centro')

        self.client.force_login(self.sur_worker)
        search_results = self.client.get(
            reverse('websocket:support_messages'),
            {'q': 'archivo'},
        )
        no_match = self.client.get(
            reverse('websocket:support_messages'),
            {'q': 'pegado'},
        )
        self.assertEqual(search_results.status_code, 200)
        self.assertEqual(
            search_results.json()['messages'][0]['username'],
            'María Elena Pérez - Delegación Centro',
        )
        self.assertEqual(len(no_match.json()['messages']), 0)

    def test_support_channel_rejects_clients_and_broadcasts_across_delegations(self):
        client_role = Rol.objects.create(nombre_rol='Cliente', alcance='Delegación')
        client_user = self.create_employee(
            'support_client',
            '6.666.666-6',
            self.centro,
            client_role,
            first_name='Cliente',
        )
        self.client.force_login(client_user)
        denied = self.client.get(reverse('websocket:support_messages'))
        self.assertEqual(denied.status_code, 403)
        client_cookie = self.client.cookies['sessionid'].value

        async def reject_support_client():
            communicator = WebsocketCommunicator(
                application,
                '/ws/chat/support/',
                headers=[(
                    b'cookie',
                    f'sessionid={client_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            if connected:
                await communicator.disconnect()
            return connected

        self.assertFalse(async_to_sync(reject_support_client)())

        self.client.force_login(self.sur_worker)
        session_cookie = self.client.cookies['sessionid'].value

        async def receive_support_message():
            communicator = WebsocketCommunicator(
                application,
                '/ws/chat/support/',
                headers=[(
                    b'cookie',
                    f'sessionid={session_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await sync_to_async(publish_support_message, thread_sensitive=True)(
                self.trabajador,
                'La web presenta un error',
            )
            payload = await communicator.receive_json_from(timeout=2)
            await communicator.disconnect()
            return payload

        event = async_to_sync(receive_support_message)()
        self.assertEqual(event['type'], 'support_message')
        self.assertEqual(event['delegation'], 'Delegación Centro')
        self.assertEqual(event['message'], 'La web presenta un error')

    def test_user_cannot_read_or_infer_another_pair_conversation(self):
        conversation_id = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)
        message = self.make_message(
            self.norte_a,
            self.norte_b,
            'Mensaje entre Norte y Norte',
        )
        self.client.force_login(self.trabajador)

        response = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': conversation_id},
        )
        unread = self.client.get(reverse('websocket:unread')).json()
        contacts = self.client.get(reverse('websocket:contacts')).json()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(unread['unread'], 0)
        self.assertEqual(contacts['conversations'], [])
        self.assertFalse(resolve_chat_room(self.trabajador, conversation_id))
        self.assertFalse(message.leido)

    def test_sending_persists_sender_recipient_and_unread_state(self):
        self.client.force_login(self.trabajador)
        conversation_id = build_direct_room_id(self.trabajador.pk, self.colega.pk)
        response = self.client.post(
            reverse('websocket:send'),
            {'chat_id': conversation_id, 'message': 'Hola, colega'},
        )

        self.assertEqual(response.status_code, 200)
        message = ChatMessage.objects.get()
        self.assertEqual(message.sender_id, self.trabajador.pk)
        self.assertEqual(message.recipient_id, self.colega.pk)
        self.assertFalse(message.leido)
        self.assertEqual(response.json()['item']['conversation_id'], conversation_id)

    def test_chat_id_is_canonical_persisted_and_used_to_filter_message_feeds(self):
        self.client.force_login(self.trabajador)
        forward_id = build_chat_id(self.trabajador.pk, self.colega.pk)
        reverse_id = build_chat_id(self.colega.pk, self.trabajador.pk)
        other_pair_id = build_chat_id(self.norte_a.pk, self.norte_b.pk)
        first = self.client.post(
            reverse('websocket:send'),
            {'chat_id': forward_id, 'message': 'Privado para colega'},
        )
        self.make_message(
            self.norte_a,
            self.norte_b,
            'No debe aparecer en este chat',
        )

        feed = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': reverse_id},
        )
        stored_message = ChatMessage.objects.get(sender=self.trabajador)

        self.assertEqual(forward_id, reverse_id)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()['item']['chat_id'], forward_id)
        self.assertEqual(stored_message.chat_id, forward_id)
        self.assertEqual(
            [item['chat_id'] for item in feed.json()['messages']],
            [forward_id],
        )
        self.assertNotEqual(forward_id, other_pair_id)

    def test_contact_unread_badge_is_exact_and_opening_chat_marks_messages_read(self):
        self.make_message(self.colega, self.trabajador, 'Primer mensaje')
        self.make_message(self.colega, self.trabajador, 'Segundo mensaje')
        self.make_message(self.trabajador, self.colega, 'Mensaje saliente')
        self.client.force_login(self.trabajador)

        contact_response = self.client.get(reverse('websocket:contacts'))
        contact = next(
            entry
            for entry in contact_response.json()['contacts']
            if entry['id'] == self.colega.pk
        )
        self.assertEqual(contact['unread_count'], 2)
        self.assertEqual(self.client.get(reverse('websocket:unread')).json()['unread'], 2)

        opened = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': self.colega.pk},
        )

        self.assertEqual(opened.status_code, 200)
        self.assertEqual(
            ChatMessage.objects.filter(
                sender=self.colega,
                recipient=self.trabajador,
                leido=False,
            ).count(),
            0,
        )
        updated_contact = next(
            entry
            for entry in self.client.get(reverse('websocket:contacts')).json()['contacts']
            if entry['id'] == self.colega.pk
        )
        self.assertEqual(updated_contact['unread_count'], 0)
        self.assertEqual(self.client.get(reverse('websocket:unread')).json()['unread'], 0)

    def test_global_can_review_all_active_conversations_without_marking_them_read(self):
        global_user = self.create_employee(
            'global',
            '6.666.666-6',
            None,
            self.global_role,
            first_name='Global',
        )
        conversation_id = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)
        message = self.make_message(self.norte_a, self.norte_b, 'Solo para la revisión global')
        self.client.force_login(global_user)

        conversations = self.client.get(reverse('websocket:contacts')).json()['conversations']
        self.assertTrue(any(item['conversation_id'] == conversation_id for item in conversations))
        page = self.client.get(
            reverse('websocket:chat_index'),
            {'chat_id': conversation_id},
        )
        feed = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': conversation_id},
        )
        cannot_mark = self.client.post(
            reverse('websocket:mark_read'),
            {'chat_id': conversation_id},
        )
        cannot_write_as_third_party = self.client.post(
            reverse('websocket:send'),
            {'chat_id': conversation_id, 'message': 'No intervenir en el chat ajeno'},
        )

        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'Vista Global de solo lectura')
        self.assertNotContains(page, 'id="chat-form"')
        self.assertEqual(feed.status_code, 200)
        self.assertEqual(feed.json()['messages'][0]['message'], message.message)
        self.assertEqual(cannot_mark.status_code, 403)
        self.assertEqual(cannot_write_as_third_party.status_code, 403)
        message.refresh_from_db()
        self.assertFalse(message.leido)

    def test_global_can_start_a_separate_private_conversation_with_any_user(self):
        global_user = self.create_employee(
            'global_sender',
            '7.777.777-7',
            None,
            self.global_role,
            first_name='Global',
        )
        self.client.force_login(global_user)
        conversation_id = build_direct_room_id(global_user.pk, self.sur_worker.pk)
        response = self.client.post(
            reverse('websocket:send'),
            {'chat_id': conversation_id, 'message': 'Consulta privada'},
        )

        self.assertEqual(response.status_code, 200)
        message = ChatMessage.objects.get()
        self.assertEqual(message.recipient_id, self.sur_worker.pk)

    def test_global_can_filter_contacts_and_active_conversations_by_delegation(self):
        global_user = self.create_employee(
            'global_filter',
            '7.777.777-8',
            None,
            self.global_role,
            first_name='Global',
        )
        north_conversation = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)
        south_conversation = build_direct_room_id(self.trabajador.pk, self.sur_worker.pk)
        self.make_message(self.norte_a, self.norte_b, 'Chat Norte')
        self.make_message(self.trabajador, self.sur_worker, 'Chat Sur')
        self.client.force_login(global_user)

        response = self.client.get(
            reverse('websocket:contacts'),
            {'delegacion': 'Norte'},
        ).json()

        self.assertTrue(any(
            item['conversation_id'] == north_conversation
            for item in response['conversations']
        ))
        self.assertFalse(any(
            item['conversation_id'] == south_conversation
            for item in response['conversations']
        ))
        self.assertTrue(all(
            contact['delegacion'] == 'Norte'
            for contact in response['contacts']
        ))

    def test_only_delegates_can_start_a_chat_with_an_administrator(self):
        admin = self.create_employee(
            'admin_contact',
            '8.888.888-8',
            None,
            self.admin_role,
            first_name='Carolina',
        )
        delegate_page = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': admin.pk},
        )
        self.assertEqual(delegate_page.status_code, 302)

        self.client.force_login(self.colega)
        delegate_page = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': admin.pk},
        )
        self.assertEqual(delegate_page.status_code, 200)

        self.client.force_login(self.trabajador)
        worker_page = self.client.get(
            reverse('websocket:chat_index'),
            {'contact': admin.pk},
        )
        self.assertEqual(worker_page.status_code, 302)

    def test_admin_can_manage_contacts_but_cannot_read_other_pairs(self):
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.test',
            password='test-password',
        )
        unrelated_conversation = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)
        self.make_message(self.norte_a, self.norte_b, 'Privado de Norte')
        self.client.force_login(admin)

        page = self.client.get(reverse('websocket:chat_index'))
        messages = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': unrelated_conversation},
        )

        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'Gestionar directorio')
        self.assertEqual(messages.status_code, 403)

    def test_contact_filters_remain_available_and_include_unread_counts(self):
        self.client.force_login(self.trabajador)
        response = self.client.get(
            reverse('websocket:contacts'),
            {
                'rut': '2.222',
                'nombre': 'Diego',
                'apellido': 'Rojas',
                'cargo': 'Gestor',
                'seccion': 'Centro',
                'delegacion': 'Centro',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['contacts']), 1)
        self.assertEqual(response.json()['contacts'][0]['rut'], '2.222.222-2')
        self.assertEqual(response.json()['contacts'][0]['unread_count'], 0)

    def test_only_sender_can_edit_and_delete_for_everyone(self):
        message = self.make_message(self.trabajador, self.colega, 'Texto inicial')
        conversation_id = message.chat_id
        action_url = reverse('websocket:message_action')
        self.client.force_login(self.colega)

        rejected_edit = self.client.post(
            action_url,
            {
                'chat_id': conversation_id,
                'message_id': message.pk,
                'action': 'edit',
                'message': 'Cambio no autorizado',
            },
        )
        rejected_delete = self.client.post(
            action_url,
            {
                'chat_id': conversation_id,
                'message_id': message.pk,
                'action': 'delete_everyone',
            },
        )
        self.assertEqual(rejected_edit.status_code, 403)
        self.assertEqual(rejected_delete.status_code, 403)

        self.client.force_login(self.trabajador)
        edited = self.client.post(
            action_url,
            {
                'chat_id': conversation_id,
                'message_id': message.pk,
                'action': 'edit',
                'message': 'Texto corregido',
            },
        )
        self.assertEqual(edited.status_code, 200)
        self.assertTrue(edited.json()['item']['editado'])
        self.assertEqual(edited.json()['item']['message'], 'Texto corregido')

        deleted = self.client.post(
            action_url,
            {
                'chat_id': conversation_id,
                'message_id': message.pk,
                'action': 'delete_everyone',
            },
        )
        message.refresh_from_db()
        self.assertEqual(deleted.status_code, 200)
        self.assertTrue(message.eliminado)
        self.assertEqual(message.message, 'Este mensaje fue eliminado')

    def test_delete_for_me_is_private_and_contact_preferences_reappear_on_message(self):
        incoming = self.make_message(self.colega, self.trabajador, 'Solo oculto para mí')
        self.client.force_login(self.trabajador)
        action_url = reverse('websocket:message_action')
        delete_response = self.client.post(
            action_url,
            {
                'chat_id': incoming.chat_id,
                'message_id': incoming.pk,
                'action': 'delete_me',
            },
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(
            self.client.get(
                reverse('websocket:messages'),
                {'chat_id': incoming.chat_id},
            ).json()['messages'],
            [],
        )
        self.assertEqual(self.client.get(reverse('websocket:unread')).json()['unread'], 0)
        self.client.force_login(self.colega)
        self.assertEqual(
            self.client.get(
                reverse('websocket:messages'),
                {'chat_id': incoming.chat_id},
            ).json()['messages'][0]['message'],
            'Solo oculto para mí',
        )

        self.client.force_login(self.trabajador)
        preference_url = reverse(
            'websocket:contact_preference',
            args=[self.colega.pk],
        )
        renamed = self.client.post(
            preference_url,
            {'action': 'rename', 'display_name': 'Mi colega'},
        )
        self.assertEqual(renamed.status_code, 200)
        self.assertContains(
            self.client.get(
                reverse('websocket:chat_index'),
                {'contact': self.colega.pk},
            ),
            'Mi colega',
        )
        self.assertEqual(
            next(
                contact
                for contact in self.client.get(reverse('websocket:contacts')).json()['contacts']
                if contact['id'] == self.colega.pk
            )['display_name'],
            'Mi colega',
        )
        hidden = self.client.post(preference_url, {'action': 'hide'})
        self.assertEqual(hidden.status_code, 200)
        self.assertNotIn(
            self.colega.pk,
            [
                contact['id']
                for contact in self.client.get(reverse('websocket:contacts')).json()['contacts']
            ],
        )

        publish_chat_message(
            self.colega,
            incoming.chat_id,
            'Nuevo mensaje que restaura el chat',
        )
        restored = self.client.get(reverse('websocket:contacts')).json()['contacts']
        contact = next(contact for contact in restored if contact['id'] == self.colega.pk)
        self.assertEqual(contact['display_name'], 'Mi colega')
        self.assertEqual(contact['unread_count'], 1)

    def test_active_messages_are_visible_to_participants_only(self):
        conversation_id = build_direct_room_id(self.trabajador.pk, self.colega.pk)
        self.make_message(self.trabajador, self.colega, 'Entre colegas')
        self.client.force_login(self.colega)

        response = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': conversation_id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['messages'][0]['sender_id'], self.trabajador.pk)
        self.assertEqual(response.json()['messages'][0]['recipient_id'], self.colega.pk)

    def test_recipient_gets_private_message_notification_over_websocket(self):
        self.client.force_login(self.colega)
        session_cookie = self.client.cookies['sessionid'].value
        conversation_id = build_direct_room_id(self.trabajador.pk, self.colega.pk)

        async def receive_notification():
            communicator = WebsocketCommunicator(
                application,
                '/ws/chat/notifications/',
                headers=[(
                    b'cookie',
                    f'sessionid={session_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await sync_to_async(publish_chat_message, thread_sensitive=True)(
                self.trabajador,
                conversation_id,
                'Aviso en tiempo real',
            )
            notification = await communicator.receive_json_from(timeout=2)
            await communicator.disconnect()
            return notification

        notification = async_to_sync(receive_notification)()

        self.assertEqual(notification['type'], 'chat_notification')
        self.assertEqual(notification['sender_id'], self.trabajador.pk)
        self.assertEqual(notification['recipient_id'], self.colega.pk)
        self.assertEqual(notification['message'], 'Aviso en tiempo real')

    def test_unrelated_delegation_does_not_receive_private_notification(self):
        self.client.force_login(self.sur_worker)
        session_cookie = self.client.cookies['sessionid'].value
        chat_id = build_chat_id(self.norte_a.pk, self.norte_b.pk)

        async def verify_no_notification():
            communicator = WebsocketCommunicator(
                application,
                '/ws/chat/notifications/',
                headers=[(
                    b'cookie',
                    f'sessionid={session_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await sync_to_async(publish_chat_message, thread_sensitive=True)(
                self.norte_a,
                chat_id,
                'Este aviso solo pertenece a Norte',
            )
            received = await communicator.receive_nothing(timeout=0.1)
            await communicator.disconnect()
            return received

        self.assertTrue(async_to_sync(verify_no_notification)())

    def test_global_gets_realtime_activity_from_another_pair(self):
        global_user = self.create_employee(
            'global_live',
            '7.777.777-9',
            None,
            self.global_role,
            first_name='Global',
        )
        self.client.force_login(global_user)
        session_cookie = self.client.cookies['sessionid'].value
        conversation_id = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)

        async def receive_global_activity():
            communicator = WebsocketCommunicator(
                application,
                '/ws/chat/notifications/',
                headers=[(
                    b'cookie',
                    f'sessionid={session_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await sync_to_async(publish_chat_message, thread_sensitive=True)(
                self.norte_a,
                conversation_id,
                'Actividad para Global',
            )
            notification = await communicator.receive_json_from(timeout=2)
            await communicator.disconnect()
            return notification

        notification = async_to_sync(receive_global_activity)()

        self.assertEqual(notification['conversation_id'], conversation_id)
        self.assertEqual(notification['message'], 'Actividad para Global')

    def test_nonparticipant_cannot_subscribe_to_another_private_chat(self):
        self.client.force_login(self.trabajador)
        session_cookie = self.client.cookies['sessionid'].value
        conversation_id = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)

        async def attempt_connection():
            communicator = WebsocketCommunicator(
                application,
                f'/ws/chat/?chat_id={conversation_id}',
                headers=[(
                    b'cookie',
                    f'sessionid={session_cookie}'.encode('ascii'),
                )],
            )
            connected, _ = await communicator.connect()
            if connected:
                await communicator.disconnect()
            return connected

        self.assertFalse(async_to_sync(attempt_connection)())

    def test_global_access_requires_the_named_global_role(self):
        legacy_global_scope_role = Rol.objects.create(
            nombre_rol='Delegado Municipal',
            alcance='Global',
        )
        not_global = self.create_employee(
            'legacy_global_scope',
            '9.999.999-9',
            self.centro,
            legacy_global_scope_role,
            first_name='Delegado',
        )
        conversation_id = build_direct_room_id(self.norte_a.pk, self.norte_b.pk)
        self.make_message(self.norte_a, self.norte_b, 'No es un rol global especial')
        self.client.force_login(not_global)

        response = self.client.get(
            reverse('websocket:messages'),
            {'chat_id': conversation_id},
        )

        self.assertEqual(response.status_code, 403)
