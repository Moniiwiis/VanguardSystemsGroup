import datetime
from io import BytesIO
import re
from tempfile import TemporaryDirectory

from django.contrib.auth.models import User
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, RequestFactory, TestCase, override_settings
from django.urls import reverse
from PIL import Image

from accounts.models import Cargo, Delegacion, Funcionario, FuncionarioRol, Rol, Sector
from activities.models import Actividad, AtencionCiudadana, Evidencia, OrganizacionComunitaria, ValidacionEvidencia, Vecino
from agenda.models import CompromisoAgenda
from configuration.models import ItemMedicion, Periodo, SubAtencion, TipoAtencion
from core.utils import build_accent_query
from core.views import _apply_list_ordering, _get_page_size, _validate_password


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class LoginAndRecoveryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='funcionario',
            email='funcionario@example.test',
            password='Prueba123!',
        )

    def test_login_accepts_username_and_email(self):
        for identifier in ('funcionario', 'funcionario@example.test'):
            response = self.client.post(reverse('login'), {
                'username': identifier,
                'password': 'Prueba123!',
            })
            self.assertEqual(response.status_code, 302)
            self.assertEqual(
                str(self.client.session['_auth_user_id']),
                str(self.user.id),
            )
            self.client.post(reverse('logout'))

    def test_csrf_protected_login_accepts_both_username_and_email(self):
        for identifier in ('funcionario', 'funcionario@example.test'):
            client = Client(enforce_csrf_checks=True)
            login_page = client.get(reverse('login'))
            token_match = re.search(
                rb'name="csrfmiddlewaretoken" value="([^"]+)"',
                login_page.content,
            )
            self.assertIsNotNone(token_match)

            response = client.post(reverse('login'), {
                'username': identifier,
                'password': 'Prueba123!',
                'csrfmiddlewaretoken': token_match.group(1).decode(),
            })

            self.assertEqual(response.status_code, 302)

    def test_recovery_sends_code_only_to_registered_email(self):
        response = self.client.post(reverse('recuperar_contrasena'), {
            'email': 'FUNCIONARIO@example.test',
        })

        self.assertRedirects(response, reverse('validar_codigo'), fetch_redirect_response=False)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertIn(self.client.session['recovery_code'], mail.outbox[0].body)
        self.assertEqual(self.client.session['recovery_user_id'], self.user.id)

    def test_unknown_email_is_not_sent_a_recovery_code(self):
        response = self.client.post(reverse('recuperar_contrasena'), {
            'email': 'unknown@example.test',
        })

        self.assertRedirects(response, reverse('validar_codigo'), fetch_redirect_response=False)
        self.assertEqual(mail.outbox, [])
        self.assertNotIn('recovery_code', self.client.session)
        self.assertNotIn('recovery_user_id', self.client.session)

    def test_resend_delivers_a_new_email(self):
        self.client.post(reverse('recuperar_contrasena'), {
            'email': self.user.email,
        })
        session = self.client.session
        session['recovery_resend_allowed'] = 0
        session.save()

        response = self.client.get(reverse('reenviar_codigo'))

        self.assertRedirects(response, reverse('validar_codigo'), fetch_redirect_response=False)
        self.assertEqual(len(mail.outbox), 2)

    def test_password_recovery_also_completes_forced_password_change(self):
        cargo = Cargo.objects.create(nombre_cargo='Funcionario')
        funcionario = Funcionario.objects.create(
            user=self.user,
            identificador_institucional='RECOVERY-001',
            cargo=cargo,
            debe_cambiar_contrasena=True,
        )
        session = self.client.session
        session['recovery_verified'] = True
        session['recovery_email'] = self.user.email
        session['recovery_user_id'] = self.user.id
        session.save()

        response = self.client.post(reverse('nueva_contrasena'), {
            'nueva_contrasena': 'ClaveNueva123!',
            'confirmar_contrasena': 'ClaveNueva123!',
        })

        self.assertRedirects(
            response,
            reverse('login'),
            fetch_redirect_response=False,
        )
        funcionario.refresh_from_db()
        self.assertFalse(funcionario.debe_cambiar_contrasena)


class SearchAndOrderingTests(TestCase):
    def test_accent_search_matches_names_with_or_without_accents(self):
        user = User.objects.create_user(
            username='jose',
            first_name='José',
            password='Prueba123!',
        )

        self.assertTrue(
            User.objects.filter(build_accent_query(['first_name'], 'jose')).filter(
                id=user.id
            ).exists()
        )
        self.assertTrue(
            User.objects.filter(build_accent_query(['first_name'], 'josé')).filter(
                id=user.id
            ).exists()
        )

    def test_ordering_uses_only_allowed_fields_and_defaults_when_invalid(self):
        User.objects.create_user(username='zeta', password='Prueba123!')
        User.objects.create_user(username='alfa', password='Prueba123!')
        options = [('username', 'Nombre'), ('-username', 'Nombre descendente')]

        request = RequestFactory().get('/?orden=-username')
        queryset, ordering = _apply_list_ordering(
            User.objects.all(), request, options, 'username'
        )
        self.assertEqual(ordering, '-username')
        self.assertEqual(list(queryset.values_list('username', flat=True)), ['zeta', 'alfa'])

        request = RequestFactory().get('/?orden=password')
        _queryset, ordering = _apply_list_ordering(
            User.objects.all(), request, options, 'username'
        )
        self.assertEqual(ordering, 'username')

    def test_page_size_accepts_only_five_fifteen_or_thirty(self):
        for requested_size, expected_size in (
            ('5', 5),
            ('15', 15),
            ('30', 30),
            ('10', 15),
            ('invalid', 15),
        ):
            request = RequestFactory().get('/', {'page_size': requested_size})
            self.assertEqual(_get_page_size(request), expected_size)

    def test_page_size_persists_in_session_on_refresh(self):
        """Clase 10 (Evidencia Esperada): Elegir 30, refrescar sin page_size y verificar que la sesión conserva 30."""
        # 1. Petición GET con page_size=30
        request1 = RequestFactory().get('/?page_size=30')
        request1.session = {}
        size1 = _get_page_size(request1, 'test_page_size')
        self.assertEqual(size1, 30)
        self.assertEqual(request1.session.get('test_page_size'), 30)

        # 2. Refrescar / siguiente petición sin parámetro page_size en URL
        request2 = RequestFactory().get('/')
        request2.session = request1.session  # conserva la misma sesión
        size2 = _get_page_size(request2, 'test_page_size')
        self.assertEqual(size2, 30)  # La sesión recuerda 30


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class UserManagementTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.test',
            password='Admin1234!',
        )
        self.cargo = Cargo.objects.create(nombre_cargo='Coordinación')
        self.admin_role = Rol.objects.create(
            nombre_rol='Administrador',
            alcance='Autorizado',
            estado='Activo',
        )

    def test_admin_can_create_unassigned_admin_with_temporary_password(self):
        self.client.force_login(self.admin)

        response = self.client.post(reverse('gestion_usuarios'), {
            'nombre': 'Usuario de prueba',
            'username': 'usuario_prueba',
            'correo': 'usuario@example.test',
            'cargo_id': str(self.cargo.id),
            'rol_id': str(self.admin_role.id),
            'estado': 'Activo',
            'delegacion_id': '',
        })

        self.assertRedirects(
            response,
            reverse('gestion_usuarios'),
            fetch_redirect_response=False,
        )
        created_user = User.objects.get(username='usuario_prueba')
        funcionario = Funcionario.objects.get(user=created_user)
        self.assertTrue(funcionario.debe_cambiar_contrasena)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['usuario@example.test'])
        self.assertIn('usuario_prueba', mail.outbox[0].body)
        pw_match = re.search(r'Contraseña provisoria:\s*(\S+)', mail.outbox[0].body)
        self.assertIsNotNone(pw_match)
        provisional_pw = pw_match.group(1)
        self.assertIsNone(_validate_password(provisional_pw))
        self.assertTrue(created_user.check_password(provisional_pw))
        self.assertEqual(funcionario.cargo, self.cargo)
        self.assertIsNone(funcionario.delegacion)
        list_response = self.client.get(
            reverse('gestion_usuarios'),
            {'page_size': '30'},
        )
        self.assertContains(list_response, 'usuario_prueba')
        self.assertEqual(
            list_response.context['page_obj'].paginator.per_page,
            30,
        )

    def test_first_login_requires_password_change_and_clears_flag(self):
        user = User.objects.create_user(
            username='primer_ingreso',
            password='User1234!',
        )
        funcionario = Funcionario.objects.create(
            user=user,
            identificador_institucional='USR-FIRST',
            cargo=self.cargo,
            debe_cambiar_contrasena=True,
        )
        self.client.force_login(user)

        protected_response = self.client.get(reverse('gestion_usuarios'))
        self.assertRedirects(
            protected_response,
            reverse('cambiar_contrasena_inicial'),
            fetch_redirect_response=False,
        )
        self.assertEqual(
            self.client.get(reverse('cambiar_contrasena_inicial')).status_code,
            200,
        )

        response = self.client.post(reverse('cambiar_contrasena_inicial'), {
            'nueva_contrasena': 'MiNuevaClave123!',
            'confirmar_contrasena': 'MiNuevaClave123!',
        })

        self.assertRedirects(
            response,
            reverse('gestion_inicio'),
            fetch_redirect_response=False,
        )
        funcionario.refresh_from_db()
        user.refresh_from_db()
        self.assertFalse(funcionario.debe_cambiar_contrasena)
        self.assertTrue(user.check_password('MiNuevaClave123!'))
        post_change_response = self.client.get(reverse('gestion_usuarios'))
        self.assertRedirects(
            post_change_response,
            reverse('gestion_inicio'),
            fetch_redirect_response=False,
        )


class ActivityEvidenceUploadTests(TestCase):
    def test_evidence_is_added_after_attention_and_requires_before_and_after_to_approve(self):
        user = User.objects.create_superuser(
            username='administrador',
            email='admin@example.test',
            password='Prueba123!',
        )
        delegacion = Delegacion.objects.create(nombre='Centro')
        cargo = Cargo.objects.create(nombre_cargo='Funcionario')
        funcionario = Funcionario.objects.create(
            user=user,
            identificador_institucional='FUNC-001',
            cargo=cargo,
            delegacion=delegacion,
        )
        periodo = Periodo.objects.create(
            fecha_inicio='2026-01-01',
            fecha_termino='2026-12-31',
            dias_computables=365,
        )
        item = ItemMedicion.objects.create(nombre_item='Actividad comunitaria')
        tipo = TipoAtencion.objects.create(nombre='Asistencia')
        sub_atencion = SubAtencion.objects.create(
            nombre='Apoyo',
            tipo_atencion=tipo,
        )
        actividad = Actividad.objects.create(
            fecha_actividad='2026-10-15',
            descripcion_solicitud='Trabajo solicitado',
            accion_ejecutada='Trabajo completado',
            funcionario=funcionario,
            item=item,
            periodo=periodo,
        )
        atencion = AtencionCiudadana.objects.create(
            solicitante='Vecino de prueba',
            delegacion=delegacion,
            tipo_atencion=tipo,
            sub_atencion=sub_atencion,
            descripcion='Solicitud de prueba',
            usuario_responsable=user,
            actividad=actividad,
        )
        self.client.force_login(user)

        image_content = BytesIO()
        Image.new('RGB', (1, 1), color='red').save(image_content, format='PNG')

        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                self.assertFalse(Evidencia.objects.filter(actividad=actividad).exists())
                before_response = self.client.post(
                    reverse('gestion_atenciones_subir_evidencia', args=[atencion.id]),
                    {
                        'momento': 'antes',
                        'imagenes': [
                            SimpleUploadedFile(
                                'antes.png',
                                image_content.getvalue(),
                                content_type='image/png',
                            ),
                        ],
                        'archivos': [
                            SimpleUploadedFile(
                                'respaldo.txt',
                                b'Respaldo',
                                content_type='text/plain',
                            ),
                        ],
                    },
                )
                self.assertRedirects(
                    before_response,
                    reverse('gestion_atenciones'),
                    fetch_redirect_response=False,
                )
                self.assertEqual(Evidencia.objects.filter(actividad=actividad).count(), 2)
                self.assertRedirects(
                    self.client.post(
                        reverse('gestion_atenciones_validar_evidencia', args=[atencion.id]),
                        {'resultado_evidencia': 'Aprobado'},
                    ),
                    reverse('gestion_atenciones'),
                    fetch_redirect_response=False,
                )
                self.assertFalse(
                    ValidacionEvidencia.objects.filter(actividad=actividad).exists()
                )
                # Tampoco debe permitir rechazar si falta la evidencia del despues
                self.assertRedirects(
                    self.client.post(
                        reverse('gestion_atenciones_validar_evidencia', args=[atencion.id]),
                        {'resultado_evidencia': 'Rechazado'},
                    ),
                    reverse('gestion_atenciones'),
                    fetch_redirect_response=False,
                )
                self.assertFalse(
                    ValidacionEvidencia.objects.filter(actividad=actividad).exists()
                )

                after_response = self.client.post(
                    reverse('gestion_atenciones_subir_evidencia', args=[atencion.id]),
                    {
                        'momento': 'despues',
                        'imagenes': [
                            SimpleUploadedFile(
                                'despues.png',
                                image_content.getvalue(),
                                content_type='image/png',
                            ),
                        ],
                    },
                )
                self.assertRedirects(
                    after_response,
                    reverse('gestion_atenciones'),
                    fetch_redirect_response=False,
                )
                self.assertContains(
                    self.client.get(reverse('gestion_atenciones')),
                    'Antes del trabajo',
                )
                approval_response = self.client.post(
                    reverse('gestion_atenciones_validar_evidencia', args=[atencion.id]),
                    {'resultado_evidencia': 'Aprobado'},
                )
                self.assertRedirects(
                    approval_response,
                    reverse('gestion_atenciones'),
                    fetch_redirect_response=False,
                )
                self.assertEqual(
                    ValidacionEvidencia.objects.get(actividad=actividad).resultado,
                    'Aprobado',
                )


class AtencionCiudadanaEnhancementTests(TestCase):
    def setUp(self):
        self.creador = User.objects.create_user(
            username='creador_user',
            first_name='Carlos',
            last_name='Creador',
            email='creador@example.test',
            password='Prueba123!',
        )
        self.representante = User.objects.create_user(
            username='representante_user',
            first_name='Ana',
            last_name='Representante',
            email='rep@example.test',
            password='Prueba123!',
        )
        self.delegacion = Delegacion.objects.create(nombre='Delegación Las Compañías', estado='Activa')
        self.cargo = Cargo.objects.create(nombre_cargo='Gestor Territorial')
        self.func_creador = Funcionario.objects.create(
            user=self.creador,
            identificador_institucional='FUNC-CR01',
            cargo=self.cargo,
            delegacion=self.delegacion,
            estado='Activo',
        )
        self.func_rep = Funcionario.objects.create(
            user=self.representante,
            identificador_institucional='FUNC-RP02',
            cargo=self.cargo,
            delegacion=self.delegacion,
            estado='Activo',
        )
        self.rol_delegado = Rol.objects.create(nombre_rol='Delegado', alcance='Delegación', estado='Activo')
        from accounts.models import FuncionarioRol
        FuncionarioRol.objects.create(funcionario=self.func_creador, rol=self.rol_delegado)
        self.tipo = TipoAtencion.objects.create(nombre='Social', estado='Activo')
        self.sub = SubAtencion.objects.create(nombre='Subvención', tipo_atencion=self.tipo, estado='Activa')

    def test_admin_dashboard_global_consolida_datos_de_todas_las_delegaciones(self):
        delegacion2 = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        user2 = User.objects.create_user(
            username='funcionario_centro',
            first_name='Luis',
            last_name='Centro',
            password='Prueba123!',
        )
        Funcionario.objects.create(
            user=user2,
            identificador_institucional='FUNC-CEN03',
            cargo=self.cargo,
            delegacion=delegacion2,
            estado='Activo',
        )
        AtencionCiudadana.objects.create(
            solicitante='Vecino Las Compañías',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Atención registrada en la primera delegación.',
            usuario_responsable=self.creador,
            estado='Resuelta',
        )
        AtencionCiudadana.objects.create(
            solicitante='Vecino Centro',
            delegacion=delegacion2,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Atención registrada en la segunda delegación.',
            usuario_responsable=user2,
            estado='En proceso',
        )
        admin_user = User.objects.create_superuser(
            username='admin_dashboard',
            email='admin_dashboard@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        global_response = self.client.get(reverse('gestion_inicio'))
        self.assertEqual(global_response.status_code, 200)
        self.assertTrue(global_response.context['es_admin_global'])
        self.assertEqual(global_response.context['total_atenciones_del'], 2)
        self.assertEqual(global_response.context['total_funcionarios_del'], 3)
        self.assertEqual(
            {atencion.delegacion_id for atencion in global_response.context['ultimas_atenciones']},
            {self.delegacion.id, delegacion2.id},
        )

        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion.id
        session.save()
        territorial_response = self.client.get(reverse('gestion_inicio'))
        self.assertFalse(territorial_response.context['es_admin_global'])
        self.assertEqual(territorial_response.context['total_atenciones_del'], 1)
        self.assertEqual(territorial_response.context['total_funcionarios_del'], 2)

    def test_vecinos_disponibles_se_limita_a_delegacion_activa_incluso_para_admin(self):
        delegacion2 = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        vecino1 = Vecino.objects.create(
            nombre='Vecina Las Compañías',
            rut='11.111.111-1',
            delegacion=self.delegacion,
            estado='Activo',
        )
        vecino2 = Vecino.objects.create(
            nombre='Vecino Centro',
            rut='22.222.222-2',
            delegacion=delegacion2,
            estado='Activo',
        )
        admin_user = User.objects.create_superuser(
            username='admin_vecinos',
            email='admin_vecinos@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        global_response = self.client.get(reverse('gestion_atenciones'))
        self.assertEqual(list(global_response.context['vecinos']), [])

        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion.id
        session.save()
        response = self.client.get(reverse('gestion_atenciones'))
        vecino_ids = {vecino.id for vecino in response.context['vecinos']}
        self.assertIn(vecino1.id, vecino_ids)
        self.assertNotIn(vecino2.id, vecino_ids)

    def test_atencion_no_acepta_vecino_de_otra_delegacion(self):
        delegacion2 = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        vecino_externo = Vecino.objects.create(
            nombre='Vecino Centro',
            rut='33.333.333-3',
            delegacion=delegacion2,
            estado='Activo',
        )
        admin_user = User.objects.create_superuser(
            username='admin_atencion',
            email='admin_atencion@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)
        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion.id
        session.save()

        response = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'existente',
            'solicitante': f'{vecino_externo.nombre} ({vecino_externo.rut})',
            'vecino_id': vecino_externo.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Atención intentando vincular un vecino de otro territorio.',
        })

        self.assertRedirects(response, reverse('gestion_atenciones'))
        self.assertFalse(AtencionCiudadana.objects.exists())

    def test_creacion_con_nuevo_vecino_y_representante(self):
        self.client.force_login(self.creador)
        post_data = {
            'modo_vecino': 'nuevo',
            'nuevo_vecino_nombre': 'Pedro Vecino Nuevo',
            'nuevo_vecino_rut': '12.345.678-5',
            'nuevo_vecino_telefono': '+56987654321',
            'nuevo_vecino_direccion': 'Pasaje Los Aromos 123',
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'responsable_id': self.representante.id,
            'descripcion': 'Vecino solicita mediación comunitaria por poda de árboles.',
        }
        response = self.client.post(reverse('gestion_atenciones'), post_data)
        self.assertRedirects(response, reverse('gestion_atenciones'))

        # 1. Verificar que el nuevo vecino fue creado en la BD
        vecino = Vecino.objects.filter(rut='12.345.678-5').first()
        self.assertIsNotNone(vecino)
        self.assertEqual(vecino.nombre, 'Pedro Vecino Nuevo')

        # 2. Verificar que la atención quedó vinculada al creador y al representante
        atencion = AtencionCiudadana.objects.filter(vecino=vecino).first()
        self.assertIsNotNone(atencion)
        self.assertEqual(atencion.creado_por, self.creador)
        self.assertEqual(atencion.usuario_responsable, self.representante)
        self.assertEqual(atencion.estado, 'Registrada')

        # 3. Verificar que la vista de atenciones expone los contadores por estado
        page_response = self.client.get(reverse('gestion_atenciones'))
        self.assertEqual(page_response.status_code, 200)
        self.assertIn('total_registradas', page_response.context)
        self.assertIn('total_en_proceso', page_response.context)
        self.assertIn('total_resueltas', page_response.context)
        self.assertIn('total_canceladas', page_response.context)
        self.assertGreaterEqual(page_response.context['total_registradas'], 1)

    def test_editar_atencion_permite_reasignar_encargado_en_la_delegacion(self):
        self.client.force_login(self.creador)
        tipo_nuevo = TipoAtencion.objects.create(nombre='Nuevo tipo', estado='Activo')
        sub_nueva = SubAtencion.objects.create(
            nombre='Nueva subatención',
            tipo_atencion=tipo_nuevo,
            estado='Activa',
        )
        atencion = AtencionCiudadana.objects.create(
            solicitante='Solicitante original',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Descripción original',
            usuario_responsable=self.creador,
        )
        response_get = self.client.get(reverse('gestion_atenciones'))
        self.assertEqual(response_get.status_code, 200)
        self.assertContains(response_get, 'Vecino solicitante:')
        self.assertNotContains(response_get, 'Cambiar vecino')
        self.assertContains(response_get, 'at-edit-responsable')
        self.assertContains(response_get, 'max-w-4xl')

        response = self.client.post(reverse('gestion_atenciones_editar', args=[atencion.id]), {
            'descripcion': 'Descripción actualizada',
            'responsable_id': self.representante.id,
            'tipo_atencion_id': tipo_nuevo.id,
            'sub_atencion_id': sub_nueva.id,
        })

        self.assertRedirects(response, reverse('gestion_atenciones'))
        atencion.refresh_from_db()
        self.assertEqual(atencion.solicitante, 'Solicitante original')
        self.assertEqual(atencion.descripcion, 'Descripción actualizada')
        self.assertEqual(atencion.usuario_responsable, self.representante)
        self.assertEqual(atencion.tipo_atencion, self.tipo)
        self.assertEqual(atencion.sub_atencion, self.sub)
        if atencion.actividad_id:
            atencion.actividad.refresh_from_db()
            self.assertEqual(atencion.actividad.funcionario, self.func_rep)

    def test_editar_atencion_rechaza_encargado_de_otra_delegacion(self):
        otra_delegacion = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        usuario_externo = User.objects.create_user(
            username='encargado_externo',
            password='Prueba123!',
        )
        Funcionario.objects.create(
            user=usuario_externo,
            identificador_institucional='FUNC-EXT01',
            cargo=self.cargo,
            delegacion=otra_delegacion,
            estado='Activo',
        )
        self.client.force_login(self.creador)
        atencion = AtencionCiudadana.objects.create(
            solicitante='Solicitante',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Descripción',
            usuario_responsable=self.creador,
        )

        response = self.client.post(reverse('gestion_atenciones_editar', args=[atencion.id]), {
            'descripcion': 'Descripción',
            'responsable_id': usuario_externo.id,
        })

        self.assertRedirects(response, reverse('gestion_atenciones'))
        atencion.refresh_from_db()
        self.assertEqual(atencion.usuario_responsable, self.creador)

    def test_editar_atencion_no_permite_cambiar_vecino_solicitante(self):
        vecino_actual = Vecino.objects.create(
            nombre='Vecina original',
            rut='31.111.111-1',
            delegacion=self.delegacion,
            estado='Activo',
        )
        self.client.force_login(self.creador)
        atencion = AtencionCiudadana.objects.create(
            solicitante=f'{vecino_actual.nombre} ({vecino_actual.rut})',
            vecino=vecino_actual,
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Descripción',
            usuario_responsable=self.creador,
        )

        response = self.client.post(reverse('gestion_atenciones_editar', args=[atencion.id]), {
            'solicitante': 'Cambio no autorizado',
            'vecino_id': vecino_actual.id + 100,
            'cambiar_vecino': '1',
            'descripcion': 'Descripción actualizada',
            'responsable_id': self.creador.id,
        })
        self.assertRedirects(response, reverse('gestion_atenciones'))
        atencion.refresh_from_db()
        self.assertEqual(atencion.solicitante, f'{vecino_actual.nombre} ({vecino_actual.rut})')
        self.assertEqual(atencion.vecino, vecino_actual)

    def test_eliminar_atencion_es_borrado_logico_y_conserva_actividad(self):
        self.client.force_login(self.creador)
        atencion = AtencionCiudadana.objects.create(
            solicitante='Solicitante',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Descripción',
            usuario_responsable=self.creador,
        )
        actividad_id = atencion.actividad_id
        total_actividades = Actividad.objects.count()

        response = self.client.post(reverse('gestion_atenciones_eliminar', args=[atencion.id]))

        self.assertRedirects(response, reverse('gestion_atenciones'))
        self.assertFalse(AtencionCiudadana.objects.filter(id=atencion.id).exists())
        atencion_eliminada = AtencionCiudadana.all_objects.get(id=atencion.id)
        self.assertIsNotNone(atencion_eliminada.deleted_at)
        self.assertEqual(Actividad.objects.count(), total_actividades)
        if actividad_id:
            self.assertTrue(Actividad.objects.filter(id=actividad_id).exists())

    def test_representantes_filtrados_por_delegacion(self):
        # Crear otra delegación y otro funcionario
        otra_del = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        otro_user = User.objects.create_user(
            username='otro_funcionario',
            first_name='Pedro',
            last_name='Centro',
            email='pedro@example.test',
            password='Prueba123!',
        )
        Funcionario.objects.create(
            user=otro_user,
            identificador_institucional='FUNC-CEN01',
            cargo=self.cargo,
            delegacion=otra_del,
            estado='Activo',
        )

        self.client.force_login(self.creador)
        response = self.client.get(reverse('gestion_atenciones'))
        self.assertEqual(response.status_code, 200)

        rep_ids = [r['id'] for r in response.context['representantes_disponibles']]
        self.assertIn(self.representante.id, rep_ids)
        self.assertIn(self.creador.id, rep_ids)
        # El funcionario de otra delegación NO debe aparecer
        self.assertNotIn(otro_user.id, rep_ids)



class SectorYTerritorioTests(TestCase):
    def setUp(self):
        self.delegacion1 = Delegacion.objects.create(nombre='Delegación Las Compañías', estado='Activa')
        self.delegacion2 = Delegacion.objects.create(nombre='Delegación La Pampa', estado='Activa')

        self.user_delegado = User.objects.create_user(
            username='delegado_lc',
            first_name='Mónica',
            last_name='Soto',
            email='monica@example.test',
            password='Prueba123!',
        )
        self.cargo = Cargo.objects.create(nombre_cargo='Delegado Territorial')
        self.func_delegado = Funcionario.objects.create(
            user=self.user_delegado,
            identificador_institucional='FUNC-DEL01',
            cargo=self.cargo,
            delegacion=self.delegacion1,
            estado='Activo',
        )
        self.rol_delegado = Rol.objects.create(nombre_rol='Delegado', alcance='Delegación', estado='Activo')
        FuncionarioRol.objects.create(funcionario=self.func_delegado, rol=self.rol_delegado)

        self.tipo = TipoAtencion.objects.create(nombre='Social', estado='Activo')
        self.sub = SubAtencion.objects.create(nombre='Subvención', tipo_atencion=self.tipo, estado='Activa')

        self.sector1 = Sector.objects.create(
            codigo='SEC-LC01',
            nombre='Villa Lambert',
            delegacion=self.delegacion1,
            estado='Activo',
        )
        self.sector2 = Sector.objects.create(
            codigo='SEC-PAM01',
            nombre='San Joaquín',
            delegacion=self.delegacion2,
            estado='Activo',
        )

    def test_crud_sectores_y_api(self):
        self.client.force_login(self.user_delegado)

        # 1. Crear nuevo sector
        response = self.client.post(reverse('gestion_sectores'), {
            'nombre': 'El Romero',
            'codigo': 'SEC-LC02',
            'descripcion': 'Sector rural norte',
            'estado': 'Activo',
        })
        self.assertRedirects(response, reverse('gestion_sectores'))
        nuevo_sector = Sector.objects.filter(nombre='El Romero').first()
        self.assertIsNotNone(nuevo_sector)
        self.assertEqual(nuevo_sector.delegacion, self.delegacion1)

        # 2. Modificar sector
        response_edit = self.client.post(reverse('gestion_sectores_editar', args=[nuevo_sector.id]), {
            'nombre': 'El Romero Alto',
            'codigo': 'SEC-LC02-MOD',
            'descripcion': 'Actualizado',
            'estado': 'Activo',
        })
        self.assertRedirects(response_edit, reverse('gestion_sectores'))
        nuevo_sector.refresh_from_db()
        self.assertEqual(nuevo_sector.nombre, 'El Romero Alto')

        # 3. Consultar API de sectores por delegación
        api_response = self.client.get(reverse('api_sectores', args=[self.delegacion1.id]))
        self.assertEqual(api_response.status_code, 200)
        data = api_response.json()
        items = data.get('sectores', data)
        nombres = [item['nombre'] for item in items]
        self.assertIn('Villa Lambert', nombres)
        self.assertIn('El Romero Alto', nombres)
        self.assertNotIn('San Joaquín', nombres)

    def test_creacion_vecino_bloquea_delegacion_activa_y_asigna_sector(self):
        self.client.force_login(self.user_delegado)

        # Intentar enviar otra delegacion en POST: debe quedar bloqueada a su delegación activa (delegacion1)
        response = self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Mariana Valenzuela',
            'rut': '18.999.888-0',
            'telefono': '+56911223344',
            'direccion': 'Avenida Central 456',
            'delegacion_id': self.delegacion2.id,  # Intento de bypass
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertRedirects(response, reverse('gestion_vecinos'))

        vecino = Vecino.objects.filter(rut='18.999.888-0').first()
        self.assertIsNotNone(vecino)
        # La delegación queda estrictamente bloqueada a la delegación activa
        self.assertEqual(vecino.delegacion, self.delegacion1)
        self.assertEqual(vecino.sector, self.sector1)
        self.assertEqual(vecino.territorio, 'Villa Lambert')

    def test_admin_puede_cambiar_delegacion_y_sector_de_vecino(self):
        admin_user = User.objects.create_superuser(
            username='admin_mudanza',
            email='admin_mudanza@example.test',
            password='Prueba123!',
        )
        vecino = Vecino.objects.create(
            nombre='Vecina en mudanza',
            rut='12.345.678-5',
            delegacion=self.delegacion1,
            sector=self.sector1,
            estado='Activo',
        )
        self.client.force_login(admin_user)

        response = self.client.post(reverse('gestion_vecinos_editar', args=[vecino.id]), {
            'nombre': vecino.nombre,
            'rut': vecino.rut,
            'direccion': '',
            'telefono': '',
            'delegacion_id': self.delegacion2.id,
            'sector_id': self.sector2.id,
            'estado': 'Activo',
        })

        self.assertRedirects(response, reverse('gestion_vecinos'))
        vecino.refresh_from_db()
        self.assertEqual(vecino.delegacion, self.delegacion2)
        self.assertEqual(vecino.sector, self.sector2)
        self.assertEqual(vecino.territorio, self.sector2.nombre)

        response = self.client.post(reverse('gestion_vecinos_editar', args=[vecino.id]), {
            'nombre': vecino.nombre,
            'rut': vecino.rut,
            'direccion': '',
            'telefono': '',
            'delegacion_id': self.delegacion1.id,
            'sector_id': self.sector2.id,
            'estado': 'Activo',
        })

        self.assertRedirects(response, reverse('gestion_vecinos'))
        vecino.refresh_from_db()
        self.assertEqual(vecino.delegacion, self.delegacion2)
        self.assertEqual(vecino.sector, self.sector2)

    def test_creacion_admin_exige_delegacion_activa_y_la_usa(self):
        admin_user = User.objects.create_superuser(
            username='admin_alta_vecinos',
            email='admin_alta_vecinos@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        response = self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Vecino en contexto activo',
            'rut': '13.345.678-5',
            'delegacion_id': self.delegacion2.id,
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertRedirects(response, reverse('gestion_vecinos'))
        self.assertFalse(Vecino.objects.filter(rut='13.345.678-5').exists())

        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion1.id
        session.save()
        response = self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Vecino en contexto activo',
            'rut': '13.345.678-3',
            'delegacion_id': self.delegacion2.id,
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })

        self.assertRedirects(response, reverse('gestion_vecinos'))
        vecino = Vecino.objects.get(rut='13.345.678-3')
        self.assertEqual(vecino.delegacion, self.delegacion1)

    def test_atencion_con_nuevo_vecino_guarda_sector_y_delegacion_bloqueada(self):
        self.client.force_login(self.user_delegado)

        response = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'nuevo',
            'nuevo_vecino_nombre': 'Rodrigo Tapia',
            'nuevo_vecino_rut': '15.444.333-9',
            'nuevo_vecino_telefono': '+56998877665',
            'nuevo_vecino_direccion': 'Calle del Sol 789',
            'nuevo_vecino_sector_id': self.sector1.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'responsable_id': self.user_delegado.id,
            'descripcion': 'Atención con registro de nuevo vecino territorial.',
        })
        self.assertRedirects(response, reverse('gestion_atenciones'))

        vecino = Vecino.objects.filter(rut='15.444.333-9').first()
        self.assertIsNotNone(vecino)
        self.assertEqual(vecino.delegacion, self.delegacion1)
        self.assertEqual(vecino.sector, self.sector1)
        self.assertEqual(vecino.territorio, 'Villa Lambert')

    def test_admin_cambio_delegacion_activa_actualiza_filtros(self):
        admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        # Simular cambio de delegación activa desde /gestion/vecinos/
        referer_url = reverse('gestion_vecinos')
        response = self.client.get(
            reverse('cambiar_delegacion', args=[self.delegacion1.id]),
            HTTP_REFERER=referer_url
        )
        # Debe redirigir agregando ?delegacion=<id>
        self.assertIn(f'delegacion={self.delegacion1.id}', response.url)

        # Al cargar vecinos con esa delegación activa, los sectores mostrados corresponden estrictamente a esa delegación
        page_response = self.client.get(reverse('gestion_vecinos'))
        self.assertEqual(page_response.status_code, 200)
        self.assertEqual(page_response.context['delegacion_activa'], self.delegacion1)
        sectores_ctx = page_response.context['sectores']
        self.assertIn(self.sector1, sectores_ctx)
        self.assertNotIn(self.sector2, sectores_ctx)

    def test_admin_filtro_tabla_funciona_por_separado(self):
        admin_user = User.objects.create_superuser(
            username='admin_filtro',
            email='admin_filtro@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        # Crear vecinos en ambas delegaciones
        v1 = Vecino.objects.create(nombre='Vecino Del 1', rut='1.111.111-1', delegacion=self.delegacion1, sector=self.sector1, estado='Activo')
        v2 = Vecino.objects.create(nombre='Vecino Del 2', rut='2.222.222-2', delegacion=self.delegacion2, sector=self.sector2, estado='Activo')

        # Establecer delegación activa en session como delegacion1
        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion1.id
        session.save()

        # 1. Filtro tabla 'Todas' explícito: ?delegacion=
        resp_todas = self.client.get(reverse('gestion_vecinos') + '?delegacion=')
        self.assertEqual(resp_todas.status_code, 200)
        self.assertIsNone(resp_todas.context['delegacion_seleccionada'])
        vecinos_ids = [v.id for v in resp_todas.context['vecinos']]
        self.assertIn(v1.id, vecinos_ids)
        self.assertIn(v2.id, vecinos_ids)

        # 2. Filtro tabla delegacion2 por separado: ?delegacion=<delegacion2.id>
        resp_del2 = self.client.get(reverse('gestion_vecinos') + f'?delegacion={self.delegacion2.id}')
        self.assertEqual(resp_del2.status_code, 200)
        self.assertEqual(resp_del2.context['delegacion_seleccionada'], self.delegacion2)
        vecinos_ids_2 = [v.id for v in resp_del2.context['vecinos']]
        self.assertNotIn(v1.id, vecinos_ids_2)
        self.assertIn(v2.id, vecinos_ids_2)
        # La delegación activa en cabecera sigue siendo delegacion1
        self.assertEqual(resp_del2.context['delegacion_activa'], self.delegacion1)

    def test_admin_modo_global_renderiza_sin_errores(self):
        admin_user = User.objects.create_superuser(
            username='admin_global',
            email='admin_global@example.test',
            password='Prueba123!',
        )
        self.client.force_login(admin_user)

        # Cambiar a modo Global (0)
        resp_cambio = self.client.get(reverse('cambiar_delegacion', args=[0]))
        self.assertEqual(resp_cambio.status_code, 302)

        # Vecino sin delegación y con delegación
        Vecino.objects.create(nombre='Vecino Sin Del', rut='3.333.333-3', delegacion=None, estado='Activo')
        Vecino.objects.create(nombre='Vecino Con Del', rut='4.444.444-4', delegacion=self.delegacion1, estado='Activo')

        # Comprobar que gestion_vecinos carga con status 200 sin errores de lookup
        resp_vecinos = self.client.get(reverse('gestion_vecinos'))
        self.assertEqual(resp_vecinos.status_code, 200)
        self.assertIsNone(resp_vecinos.context.get('delegacion_activa'))
        self.assertContains(
            resp_vecinos,
            "Selecciona una delegación activa en la cabecera para registrar un vecino.",
        )
        self.assertNotContains(resp_vecinos, ">Nuevo Vecino</span>")

        # Comprobar que gestion_atenciones carga con status 200
        resp_atenciones = self.client.get(reverse('gestion_atenciones'))
        self.assertEqual(resp_atenciones.status_code, 200)

        # Comprobar que gestion_sectores carga con status 200
        resp_sectores = self.client.get(reverse('gestion_sectores'))
        self.assertEqual(resp_sectores.status_code, 200)

    def test_direccion_requiere_letras_y_numeros(self):
        self.client.force_login(self.user_delegado)

        # Dirección solo con letras: debe ser rechazada
        self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Vecino Sin Número',
            'rut': '18.999.888-0',
            'direccion': 'Avenida Francisco de Aguirre',
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertFalse(Vecino.objects.filter(rut='18.999.888-0').exists())

        # Dirección solo con números: debe ser rechazada
        self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Vecino Solo Números',
            'rut': '18.999.888-0',
            'direccion': '12345',
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertFalse(Vecino.objects.filter(rut='18.999.888-0').exists())

        # Dirección con letras y números: debe aceptarse
        self.client.post(reverse('gestion_vecinos'), {
            'nombre': 'Vecino Dirección Completa',
            'rut': '18.999.888-0',
            'direccion': 'Avenida Francisco de Aguirre 123',
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertTrue(Vecino.objects.filter(rut='18.999.888-0').exists())


class TuboCompromisoYOrganizacionesTests(TestCase):
    def setUp(self):
        self.delegacion = Delegacion.objects.create(nombre='Delegación Centro', estado='Activa')
        self.otra_delegacion = Delegacion.objects.create(nombre='Delegación Norte', estado='Activa')
        self.cargo = Cargo.objects.create(nombre_cargo='Delegado Territorial')
        self.user = User.objects.create_user(
            username='delegado_tubo',
            first_name='Carla',
            last_name='Vega',
            email='carla@example.test',
            password='Prueba123!',
        )
        self.func = Funcionario.objects.create(
            user=self.user,
            identificador_institucional='FUNC-TUB01',
            cargo=self.cargo,
            delegacion=self.delegacion,
            estado='Activo',
        )
        self.rol = Rol.objects.create(nombre_rol='Delegado', alcance='Delegación', estado='Activo')
        FuncionarioRol.objects.create(funcionario=self.func, rol=self.rol)
        self.tipo = TipoAtencion.objects.create(nombre='Social', estado='Activo')
        self.sub = SubAtencion.objects.create(nombre='Luminarias', tipo_atencion=self.tipo, estado='Activa')
        self.org_local = OrganizacionComunitaria.objects.create(
            nombre='JJVV El Brillador',
            tipo_organizacion='Junta de Vecinos',
            delegacion=self.delegacion,
            territorio='El Brillador',
            representante_legal='Marta Henríquez',
            telefono_contacto='+56 9 1234 5678',
            estado='Activo',
        )
        self.org_externa = OrganizacionComunitaria.objects.create(
            nombre='JJVV Las Compañías Norte',
            tipo_organizacion='Junta de Vecinos',
            delegacion=self.otra_delegacion,
            estado='Activo',
        )

    def test_atencion_permite_jjvv_existente_y_nueva(self):
        self.client.force_login(self.user)

        # 1. Crear atención con JJVV existente y envío a Tubo de Compromiso
        resp = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'organizacion',
            'organizacion_id': self.org_local.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Instalación de reductores de velocidad en Av. Islón',
            'va_a_tubo': '1',
            'fecha_compromiso': '2026-12-01',
            'area_apoyo': 'Dirección de Tránsito',
            'origen': 'EXT',
        })
        self.assertRedirects(resp, reverse('gestion_atenciones'))
        at1 = AtencionCiudadana.objects.filter(organizacion=self.org_local).first()
        self.assertIsNotNone(at1)
        self.assertTrue(at1.va_a_tubo)
        self.assertIn('JJVV El Brillador', at1.solicitante)
        self.assertEqual(at1.area_apoyo, 'Dirección de Tránsito')
        self.assertEqual(at1.get_codigo_tubo(), f'TUB-{at1.id:05d}')

        # 2. Crear nueva JJVV inline dentro de la atención
        resp_new = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'organizacion',
            'crear_nueva_org': '1',
            'nueva_org_nombre': 'JJVV Terrazas del Brillador',
            'nueva_org_tipo': 'Junta de Vecinos',
            'nueva_org_representante': 'Carlos Pérez',
            'nueva_org_telefono': '+56 9 8765 4321',
            'nueva_org_direccion': 'Av. El Brillador 450',
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Solicitud de poda',
            'va_a_tubo': '0',
        })
        self.assertRedirects(resp_new, reverse('gestion_atenciones'))
        nueva_org = OrganizacionComunitaria.objects.filter(nombre='JJVV Terrazas del Brillador').first()
        self.assertIsNotNone(nueva_org)
        at2 = AtencionCiudadana.objects.filter(organizacion=nueva_org).first()
        self.assertIsNotNone(at2)
        self.assertFalse(at2.va_a_tubo)

        # 3. Una JJVV de otra delegación NO se expone ni puede vincularse
        resp_get = self.client.get(reverse('gestion_atenciones'))
        org_ids = [o['id'] for o in resp_get.context['organizaciones']]
        self.assertIn(self.org_local.id, org_ids)
        self.assertNotIn(self.org_externa.id, org_ids)

    def test_regla_estricta_no_crear_tubo_sin_atencion_ni_sector(self):
        self.client.force_login(self.user)

        # 1. POST directo en /gestion/tubo/ sin sector_id NO crea registros
        total_antes = AtencionCiudadana.objects.count()
        resp_tubo_post = self.client.post(reverse('gestion_tubo'), {
            'descripcion': 'Intento suelto',
            'va_a_tubo': '1',
        })
        self.assertRedirects(resp_tubo_post, reverse('gestion_tubo'))
        self.assertEqual(AtencionCiudadana.objects.count(), total_antes)
        self.assertEqual(CompromisoAgenda.objects.count(), 0)

        # 2. POST en /gestion/agenda/ redirige al Tubo sin crear CompromisoAgenda independiente
        resp_agenda_post = self.client.post(reverse('gestion_agenda'), {
            'solicitante': 'Alguien sin atención',
            'fecha_comprometida': '2026-12-10',
        })
        self.assertRedirects(resp_agenda_post, reverse('gestion_tubo'))
        self.assertEqual(CompromisoAgenda.objects.count(), 0)

        # 3. En atenciones: marcar va_a_tubo='1' SIN fecha_compromiso es rechazado
        self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'organizacion',
            'organizacion_id': self.org_local.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Compromiso sin fecha',
            'va_a_tubo': '1',
            'fecha_compromiso': '',
        })
        self.assertEqual(AtencionCiudadana.objects.filter(descripcion='Compromiso sin fecha').count(), 0)

        # 4. Con va_a_tubo='0', incluso si envían fecha_compromiso/area_apoyo, NO entra al Tubo
        self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'organizacion',
            'organizacion_id': self.org_local.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Atención regular limpia',
            'va_a_tubo': '0',
            'fecha_compromiso': '2026-12-05',
            'area_apoyo': 'Tránsito',
        })
        at_reg = AtencionCiudadana.objects.get(descripcion='Atención regular limpia')
        self.assertFalse(at_reg.va_a_tubo)
        self.assertIsNone(at_reg.fecha_compromiso)
        self.assertEqual(at_reg.area_apoyo, '')

    def test_tubo_vistas_tabla_y_canvas_y_transicion_estado(self):
        self.client.force_login(self.user)

        at_ing = AtencionCiudadana.objects.create(
            solicitante='Marta Henríquez',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Revisión de luminarias en Pasaje Las Rosas',
            usuario_responsable=self.user,
            estado='Registrada',
            va_a_tubo=True,
            fecha_compromiso=datetime.date(2026, 12, 1),
            area_apoyo='Alumbrado',
        )
        at_pend = AtencionCiudadana.objects.create(
            solicitante='JJVV El Brillador',
            organizacion=self.org_local,
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Salida a terreno y catastro con dirigentes',
            usuario_responsable=self.user,
            estado='Pendiente',
            va_a_tubo=True,
            fecha_compromiso=datetime.date(2026, 12, 2),
            area_apoyo='Obras Municipales',
        )
        at_real = AtencionCiudadana.objects.create(
            solicitante='Beatriz Ossa',
            delegacion=self.delegacion,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            descripcion='Evaluación social urgente',
            usuario_responsable=self.user,
            estado='Resuelta',
            va_a_tubo=True,
            fecha_compromiso=datetime.date(2026, 11, 20),
        )

        # Vista Tabla
        resp_tabla = self.client.get(reverse('gestion_tubo') + '?vista=tabla')
        self.assertEqual(resp_tabla.status_code, 200)
        self.assertEqual(resp_tabla.context['vista'], 'tabla')
        self.assertContains(resp_tabla, 'Tubo de Compromiso SGR')
        self.assertContains(resp_tabla, at_ing.get_codigo_tubo())

        # Vista Canvas (Kanban 4 columnas + mismas 6 tarjetas KPI que Tabla)
        resp_canvas = self.client.get(reverse('gestion_tubo') + '?vista=canvas')
        self.assertEqual(resp_canvas.status_code, 200)
        self.assertEqual(resp_canvas.context['vista'], 'canvas')
        self.assertContains(resp_canvas, '1. INGRESADOS')
        self.assertContains(resp_canvas, '2. PENDIENTES')
        self.assertContains(resp_canvas, '3. EN PROCESO')
        self.assertContains(resp_canvas, '4. REALIZADOS')
        for kpi in ('Total Tubo', 'Ingresados', 'En Proceso', 'Pendientes', 'Realizados', '% Cumplimiento'):
            self.assertContains(resp_canvas, kpi)
        self.assertContains(resp_canvas, at_ing.get_codigo_tubo())
        self.assertContains(resp_canvas, at_pend.get_codigo_tubo())
        self.assertContains(resp_canvas, at_real.get_codigo_tubo())

        # Sesión recuerda vista=canvas si se omite parámetro
        resp_persist = self.client.get(reverse('gestion_tubo'))
        self.assertEqual(resp_persist.context['vista'], 'canvas')

        # Transición AJAX en Canvas (Ingresado -> En proceso -> Realizado)
        resp_ajax = self.client.post(
            reverse('gestion_tubo_cambiar_estado', args=[at_ing.id]),
            {'nuevo_estado': 'En proceso'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(resp_ajax.status_code, 200)
        self.assertEqual(resp_ajax.json()['estado'], 'En proceso')
        at_ing.refresh_from_db()
        self.assertEqual(at_ing.estado, 'En proceso')

        resp_realizar = self.client.post(
            reverse('gestion_tubo_cambiar_estado', args=[at_ing.id]),
            {'nuevo_estado': 'Realizado'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(resp_realizar.status_code, 200)
        self.assertEqual(resp_realizar.json()['estado'], 'Resuelta')
        at_ing.refresh_from_db()
        self.assertEqual(at_ing.estado, 'Resuelta')

    def test_compromiso_sectorial_directo_en_tubo(self):
        self.client.force_login(self.user)
        sector = Sector.objects.create(nombre='Sector Las Rosas', delegacion=self.delegacion, estado='Activo')

        resp = self.client.post(reverse('gestion_tubo'), {
            'sector_id': sector.id,
            'organizacion_id': self.org_local.id,
            'solicitante': 'Mesa Territorial Las Rosas',
            'origen': 'INT',
            'descripcion': 'Operativo de limpieza y bacheo sectorial',
            'fecha_compromiso': '2026-12-15',
            'area_apoyo': 'OOCC Municipal',
            'avance_observaciones': 'Coordinado con cuadrilla norte',
        })
        self.assertRedirects(resp, reverse('gestion_tubo'))
        self.assertEqual(AtencionCiudadana.objects.count(), 0)
        comp = CompromisoAgenda.objects.filter(sector=sector).first()
        self.assertIsNotNone(comp)
        self.assertEqual(comp.delegacion, self.delegacion)
        self.assertEqual(comp.estado, 'Registrada')
        self.assertEqual(comp.get_codigo_tubo(), f'TUB-S{comp.id:04d}')

        # Se visualiza en Tabla y Canvas junto con botones de edición
        resp_tabla = self.client.get(reverse('gestion_tubo') + '?vista=tabla')
        self.assertContains(resp_tabla, comp.get_codigo_tubo())
        self.assertContains(resp_tabla, 'Sector Las Rosas')

        resp_canvas = self.client.get(reverse('gestion_tubo') + '?vista=canvas')
        self.assertContains(resp_canvas, comp.get_codigo_tubo())
        self.assertContains(resp_canvas, 'Mesa Territorial Las Rosas')

        # Transición AJAX en Canvas para compromiso sectorial
        resp_proc = self.client.post(
            reverse('gestion_tubo_sector_cambiar_estado', args=[comp.id]),
            {'nuevo_estado': 'En proceso'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(resp_proc.status_code, 200)
        self.assertEqual(resp_proc.json()['estado'], 'En proceso')

        resp_done = self.client.post(
            reverse('gestion_tubo_sector_cambiar_estado', args=[comp.id]),
            {'nuevo_estado': 'Realizado'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(resp_done.status_code, 200)
        self.assertEqual(resp_done.json()['estado'], 'Resuelta')
        comp.refresh_from_db()
        self.assertEqual(comp.estado, 'Resuelta')

        # Edición del compromiso sectorial
        resp_edit = self.client.post(reverse('gestion_tubo_sector_editar', args=[comp.id]), {
            'descripcion': 'Operativo ampliado con áreas verdes',
            'estado': 'Pendiente',
            'responsable_id': self.user.id,
            'fecha_compromiso': '2026-12-20',
            'area_apoyo': 'Parques y Jardines',
            'avance_observaciones': 'Pendiente camión aljibe',
        })
        self.assertRedirects(resp_edit, reverse('gestion_tubo'))
        comp.refresh_from_db()
        self.assertEqual(comp.observacion, 'Operativo ampliado con áreas verdes')
        self.assertEqual(comp.estado, 'Pendiente')
        self.assertEqual(comp.area_apoyo, 'Parques y Jardines')

        # Eliminación lógica por usuario con permiso de eliminación (superuser/admin)
        admin = User.objects.create_superuser('admin_tubo_del', 'admin_t@example.test', 'Admin123!')
        self.client.force_login(admin)
        resp_del = self.client.post(reverse('gestion_tubo_sector_eliminar', args=[comp.id]))
        self.assertRedirects(resp_del, reverse('gestion_tubo'))
        self.assertFalse(CompromisoAgenda.objects.filter(id=comp.id).exists())

    def test_directiva_jjvv_presidente_tesorero_secretario_crud_y_atencion(self):
        self.client.force_login(self.user)

        # 1. Rechaza RUT o correo inválido en directiva
        antes = OrganizacionComunitaria.objects.count()
        self.client.post(reverse('gestion_organizaciones'), {
            'nombre': 'JJVV RUT Inválido',
            'tipo_organizacion': 'Junta de Vecinos',
            'presidente_nombre': 'Ana Pérez',
            'presidente_rut': '12.345.678-0',
            'presidente_correo': 'ana@jjvv.cl',
        })
        self.assertEqual(OrganizacionComunitaria.objects.count(), antes)

        # 2. Crea JJVV con Presidente, Tesorero y Secretario válidos
        resp_create = self.client.post(reverse('gestion_organizaciones'), {
            'nombre': 'JJVV Vista Hermosa',
            'tipo_organizacion': 'Junta de Vecinos',
            'representante_legal': 'Ana Pérez',
            'presidente_nombre': 'Ana Pérez Soto',
            'presidente_rut': '11111111-1',
            'presidente_correo': 'presidencia@vistahermosa.cl',
            'tesorero_nombre': 'Luis Rojas Moya',
            'tesorero_rut': '12345678-5',
            'tesorero_correo': 'tesoreria@vistahermosa.cl',
            'secretario_nombre': 'Sofía Díaz Vera',
            'secretario_rut': '8765432-K',
            'secretario_correo': 'secretaria@vistahermosa.cl',
            'estado': 'Activa',
        })
        self.assertRedirects(resp_create, reverse('gestion_organizaciones'))
        org = OrganizacionComunitaria.objects.get(nombre='JJVV Vista Hermosa')
        self.assertEqual(org.presidente_nombre, 'Ana Pérez Soto')
        self.assertEqual(org.presidente_rut, '11.111.111-1')
        self.assertEqual(org.presidente_correo, 'presidencia@vistahermosa.cl')
        self.assertEqual(org.tesorero_nombre, 'Luis Rojas Moya')
        self.assertEqual(org.tesorero_rut, '12.345.678-5')
        self.assertEqual(org.secretario_rut, '8.765.432-K')
        self.assertEqual(org.secretario_correo, 'secretaria@vistahermosa.cl')

        # 3. Edita directiva existente
        resp_edit = self.client.post(reverse('gestion_organizaciones_editar', args=[org.id]), {
            'nombre': 'JJVV Vista Hermosa Sur',
            'tipo_organizacion': 'Junta de Vecinos',
            'presidente_nombre': 'Ana Pérez Soto',
            'presidente_rut': '111111111',
            'presidente_correo': 'ana@vistahermosa.cl',
            'tesorero_nombre': 'Mario Lagos',
            'tesorero_rut': '',
            'tesorero_correo': 'mario@vistahermosa.cl',
            'secretario_nombre': 'Sofía Díaz Vera',
            'secretario_rut': '8765432k',
            'secretario_correo': 'sofia@vistahermosa.cl',
            'estado': 'Activa',
        })
        self.assertRedirects(resp_edit, reverse('gestion_organizaciones'))
        org.refresh_from_db()
        self.assertEqual(org.nombre, 'JJVV Vista Hermosa Sur')
        self.assertEqual(org.presidente_correo, 'ana@vistahermosa.cl')
        self.assertEqual(org.tesorero_nombre, 'Mario Lagos')
        self.assertEqual(org.secretario_rut, '8.765.432-K')

        # 4. Crear nueva JJVV inline en Atención Ciudadana con directiva completa
        resp_at = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'organizacion',
            'crear_nueva_org': '1',
            'nueva_org_nombre': 'Club Adulto Mayor Sol Naciente',
            'nueva_org_tipo': 'Club Adulto Mayor',
            'nueva_org_presidente_nombre': 'Rosa Muñoz',
            'nueva_org_presidente_rut': '11111111-1',
            'nueva_org_presidente_correo': 'rosa@solnaciente.cl',
            'nueva_org_tesorero_nombre': 'Pedro Jara',
            'nueva_org_tesorero_rut': '12345678-5',
            'nueva_org_tesorero_correo': 'pedro@solnaciente.cl',
            'nueva_org_secretario_nombre': 'Elena Paredes',
            'nueva_org_secretario_rut': '8765432-K',
            'nueva_org_secretario_correo': 'elena@solnaciente.cl',
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'descripcion': 'Atención inline con directiva completa',
            'va_a_tubo': '0',
        })
        self.assertRedirects(resp_at, reverse('gestion_atenciones'))
        club = OrganizacionComunitaria.objects.get(nombre='Club Adulto Mayor Sol Naciente')
        self.assertEqual(club.presidente_rut, '11.111.111-1')
        self.assertEqual(club.tesorero_correo, 'pedro@solnaciente.cl')
        self.assertEqual(club.secretario_nombre, 'Elena Paredes')

    def test_editar_atencion_sube_evidencias_al_guardar_y_eliminar_en_tubo(self):
        from io import BytesIO
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        admin = User.objects.create_superuser('admin_evi_tubo', 'admin_et@example.test', 'Admin123!')
        sector_norte = Sector.objects.create(nombre='Sector Las Compañías', delegacion=self.delegacion, estado='Activo')
        vecino_tel = Vecino.objects.create(
            nombre='Carlos Muñoz',
            rut='15.555.555-5',
            telefono='+56 9 8877 6655',
            delegacion=self.delegacion,
            sector=sector_norte,
            territorio='Sector Las Compañías',
            estado='Activo',
        )
        at = AtencionCiudadana.objects.create(
            delegacion=self.delegacion,
            vecino=vecino_tel,
            tipo_atencion=self.tipo,
            sub_atencion=self.sub,
            usuario_responsable=self.user,
            creado_por=self.user,
            solicitante=f'{vecino_tel.nombre} ({vecino_tel.rut})',
            descripcion='Revisión de luminaria LED en esquina',
            va_a_tubo=True,
            fecha_compromiso=datetime.date(2026, 12, 18),
        )

        self.client.force_login(self.user)
        # Teléfono del vecino y sector elegido visibles en Atenciones y Tubo (Tabla y Canvas)
        resp_at_list = self.client.get(reverse('gestion_atenciones'))
        self.assertContains(resp_at_list, '+56 9 8877 6655')
        self.assertContains(resp_at_list, 'Sector Las Compañías')

        resp_tubo_canvas = self.client.get(reverse('gestion_tubo') + '?vista=canvas')
        self.assertContains(resp_tubo_canvas, 'Sector Las Compañías')

        # Al guardar edición con imagen/archivo adjunto, la evidencia se guarda aunque no se presione "Adjuntar Evidencia"
        buf = BytesIO()
        Image.new('RGB', (12, 12), color='red').save(buf, format='PNG')
        img_file = SimpleUploadedFile('antes_obra.png', buf.getvalue(), content_type='image/png')
        pdf_file = SimpleUploadedFile('respaldo_acta.txt', b'Acta respaldo SGR', content_type='text/plain')

        tubo_url = reverse('gestion_tubo')
        resp_save = self.client.post(
            reverse('gestion_atenciones_editar', args=[at.id]),
            {
                'descripcion': 'Luminaria revisada con respaldo adjunto al guardar',
                'responsable_id': self.user.id,
                'estado': 'En proceso',
                'va_a_tubo': 'true',
                'fecha_compromiso': '2026-12-22',
                'area_apoyo': 'Alumbrado Público',
                'avance_observaciones': 'Se adjuntó respaldo al guardar',
                'momento': 'antes',
                'imagenes': [img_file],
                'archivos': [pdf_file],
            },
            HTTP_REFERER=tubo_url,
        )
        self.assertRedirects(resp_save, tubo_url)
        at.refresh_from_db()
        self.assertEqual(at.descripcion, 'Luminaria revisada con respaldo adjunto al guardar')
        self.assertIsNotNone(at.actividad)
        self.assertEqual(at.actividad.evidencias.filter(momento='antes').count(), 2)

        # Eliminación directa desde Tubo redirige de vuelta al Tubo cuando tiene HTTP_REFERER
        self.client.force_login(admin)
        resp_del_tubo = self.client.post(
            reverse('gestion_atenciones_eliminar', args=[at.id]),
            HTTP_REFERER=tubo_url,
        )
        self.assertRedirects(resp_del_tubo, tubo_url)
        self.assertFalse(AtencionCiudadana.objects.filter(id=at.id).exists())

    def test_compromiso_sectorial_solo_con_delegacion_activa_y_scoping_formularios(self):
        from accounts.models import Cargo
        admin = User.objects.create_superuser('admin_scope_check', 'admin_sc@example.test', 'Admin123!')
        del_otra = Delegacion.objects.create(nombre='Delegación Sur', codigo='SUR')
        sector_norte = Sector.objects.create(nombre='Sector Norte Activo', delegacion=self.delegacion, estado='Activo')
        sector_sur = Sector.objects.create(nombre='Sector Sur Oculto', delegacion=del_otra, estado='Activo')
        vecino_sur = Vecino.objects.create(
            nombre='Vecino Sur Aislado',
            rut='16.666.666-6',
            delegacion=del_otra,
            sector=sector_sur,
            estado='Activo',
        )
        org_sur = OrganizacionComunitaria.objects.create(
            nombre='JJVV Sur Oculta',
            tipo_organizacion='Junta de Vecinos',
            delegacion=del_otra,
            sector=sector_sur,
            estado='Activa',
        )
        user_sur = User.objects.create_user('func_sur_aislado', 'fsur@example.test', 'Pass123!', first_name='Pedro Sur')
        cargo_test = Cargo.objects.create(nombre_cargo='Gestor Territorial')
        Funcionario.objects.create(user=user_sur, delegacion=del_otra, cargo=cargo_test, estado='Activo')

        # Admin sin delegación activa (modo Global) NO puede crear compromiso sectorial y los formularios no mezclan regiones
        self.client.force_login(admin)
        resp_tubo_global = self.client.get(reverse('gestion_tubo'))
        self.assertFalse(resp_tubo_global.context['puede_crear_compromiso_sector'])
        self.assertEqual(resp_tubo_global.context['sectores_tubo'].count(), 0)
        self.assertEqual(len(resp_tubo_global.context['organizaciones_tubo']), 0)

        resp_post_global = self.client.post(reverse('gestion_tubo'), {
            'sector_id': sector_norte.id,
            'descripcion': 'Intento sin delegación activa',
            'fecha_compromiso': '2026-12-25',
        })
        self.assertRedirects(resp_post_global, reverse('gestion_tubo'))
        self.assertEqual(CompromisoAgenda.objects.filter(observacion='Intento sin delegación activa').count(), 0)

        # Seleccionando Delegación Norte como delegación activa para admin -> solo ve Norte y sí puede crear
        session = self.client.session
        session['delegacion_activa_id'] = self.delegacion.id
        session.save()

        resp_tubo_norte = self.client.get(reverse('gestion_tubo'))
        self.assertTrue(resp_tubo_norte.context['puede_crear_compromiso_sector'])
        sec_ids_tubo = set(resp_tubo_norte.context['sectores_tubo'].values_list('id', flat=True))
        self.assertIn(sector_norte.id, sec_ids_tubo)
        self.assertNotIn(sector_sur.id, sec_ids_tubo)
        org_ids_tubo = {o['id'] for o in resp_tubo_norte.context['organizaciones_tubo']}
        self.assertIn(self.org_local.id, org_ids_tubo)
        self.assertNotIn(org_sur.id, org_ids_tubo)
        rep_ids_tubo = {e['id'] for e in resp_tubo_norte.context['encargados_modal_tubo']}
        self.assertNotIn(user_sur.id, rep_ids_tubo)

        resp_at_norte = self.client.get(reverse('gestion_atenciones'))
        self.assertNotIn(sector_sur.id, set(resp_at_norte.context['sectores'].values_list('id', flat=True)))
        self.assertNotIn(vecino_sur.id, set(resp_at_norte.context['vecinos'].values_list('id', flat=True)))
        self.assertNotIn(org_sur.id, {o['id'] for o in resp_at_norte.context['organizaciones']})
        self.assertNotIn(user_sur.id, {r['id'] for r in resp_at_norte.context['representantes_disponibles']})

        resp_vec_norte = self.client.get(reverse('gestion_vecinos'))
        self.assertNotIn(sector_sur.id, set(resp_vec_norte.context['sectores'].values_list('id', flat=True)))

        resp_org_norte = self.client.get(reverse('gestion_organizaciones'))
        self.assertNotIn(sector_sur.id, set(resp_org_norte.context['sectores'].values_list('id', flat=True)))

        resp_act_norte = self.client.get(reverse('gestion_actividades'))
        self.assertNotIn(user_sur.id, set(resp_act_norte.context['funcionarios'].values_list('user_id', flat=True)))
