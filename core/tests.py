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
from activities.models import Actividad, AtencionCiudadana, Evidencia, ValidacionEvidencia, Vecino
from configuration.models import ItemMedicion, Periodo, SubAtencion, TipoAtencion
from core.utils import build_accent_query
from core.views import _apply_list_ordering, _get_page_size


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
        self.assertTrue(created_user.check_password('User1234!'))
        self.assertTrue(funcionario.debe_cambiar_contrasena)
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

    def test_creacion_con_nuevo_vecino_y_representante(self):
        self.client.force_login(self.creador)
        post_data = {
            'modo_vecino': 'nuevo',
            'nuevo_vecino_nombre': 'Pedro Vecino Nuevo',
            'nuevo_vecino_rut': '12.345.678-9',
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
        vecino = Vecino.objects.filter(rut='12.345.678-9').first()
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
            'rut': '18.999.888-7',
            'telefono': '+56911223344',
            'direccion': 'Avenida Central 456',
            'delegacion_id': self.delegacion2.id,  # Intento de bypass
            'sector_id': self.sector1.id,
            'estado': 'Activo',
        })
        self.assertRedirects(response, reverse('gestion_vecinos'))

        vecino = Vecino.objects.filter(rut='18.999.888-7').first()
        self.assertIsNotNone(vecino)
        # La delegación queda estrictamente bloqueada a la delegación activa
        self.assertEqual(vecino.delegacion, self.delegacion1)
        self.assertEqual(vecino.sector, self.sector1)
        self.assertEqual(vecino.territorio, 'Villa Lambert')

    def test_atencion_con_nuevo_vecino_guarda_sector_y_delegacion_bloqueada(self):
        self.client.force_login(self.user_delegado)

        response = self.client.post(reverse('gestion_atenciones'), {
            'modo_vecino': 'nuevo',
            'nuevo_vecino_nombre': 'Rodrigo Tapia',
            'nuevo_vecino_rut': '15.444.333-2',
            'nuevo_vecino_telefono': '+56998877665',
            'nuevo_vecino_direccion': 'Calle del Sol 789',
            'nuevo_vecino_sector_id': self.sector1.id,
            'tipo_atencion_id': self.tipo.id,
            'sub_atencion_id': self.sub.id,
            'responsable_id': self.user_delegado.id,
            'descripcion': 'Atención con registro de nuevo vecino territorial.',
        })
        self.assertRedirects(response, reverse('gestion_atenciones'))

        vecino = Vecino.objects.filter(rut='15.444.333-2').first()
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



