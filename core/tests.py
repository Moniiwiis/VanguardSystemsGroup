from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

from accounts.models import Delegacion, Rol, Cargo, Funcionario, FuncionarioRol
from configuration.models import TipoAtencion, SubAtencion, ItemMedicion
from activities.models import AtencionCiudadana


class SistemaMunicipalTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Delegaciones
        self.del_centro = Delegacion.objects.create(
            codigo='DEL01', nombre='Delegación Centro', comuna='La Serena', direccion='Los Carrera 301', estado='Activa'
        )
        self.del_norte = Delegacion.objects.create(
            codigo='DEL02', nombre='Delegación Norte', comuna='La Serena', direccion='Las Compañías 450', estado='Activa'
        )

        # Roles
        self.rol_admin = Rol.objects.create(codigo='ROL01', nombre_rol='Administrador', alcance='Autorizado', estado='Activo')
        self.rol_delegado = Rol.objects.create(codigo='ROL02', nombre_rol='Delegado Municipal', alcance='Delegación', estado='Activo')
        self.rol_operador = Rol.objects.create(codigo='ROL03', nombre_rol='Operador', alcance='Delegación', estado='Activo')

        # Cargos
        self.cargo = Cargo.objects.create(nombre_cargo='Coordinador Territorial')

        # Usuarios
        # 1. Admin
        self.user_admin = User.objects.create_user(
            username='admin_sgr', email='admin@laserena.cl', password='Admin1234!', is_staff=True, is_superuser=True
        )
        self.func_admin = Funcionario.objects.create(
            user=self.user_admin, identificador_institucional='ADM-001', delegacion=self.del_centro, cargo=self.cargo
        )
        FuncionarioRol.objects.create(funcionario=self.func_admin, rol=self.rol_admin)

        # 2. Delegado Centro
        self.user_delegado = User.objects.create_user(
            username='delegado_centro', email='delegado@laserena.cl', password='User1234!', is_staff=True
        )
        self.func_delegado = Funcionario.objects.create(
            user=self.user_delegado, identificador_institucional='DEL-001', delegacion=self.del_centro, cargo=self.cargo
        )
        FuncionarioRol.objects.create(funcionario=self.func_delegado, rol=self.rol_delegado)

        # 3. Operador
        self.user_operador = User.objects.create_user(
            username='funcionario_juan', email='juan@laserena.cl', password='User1234!', is_staff=True
        )
        self.func_operador = Funcionario.objects.create(
            user=self.user_operador, identificador_institucional='FUN-101', delegacion=self.del_centro, cargo=self.cargo
        )
        FuncionarioRol.objects.create(funcionario=self.func_operador, rol=self.rol_operador)

        # 4. Inactivo
        self.user_inactivo = User.objects.create_user(
            username='inactivo', email='inactivo@laserena.cl', password='User1234!', is_active=False
        )

        # Tipos y Subatenciones
        self.tipo_social = TipoAtencion.objects.create(codigo='TA001', nombre='Social', estado='Activo')
        self.sub_social = SubAtencion.objects.create(codigo='SA001', nombre='Ayuda social', tipo_atencion=self.tipo_social, estado='Activa')

        # Item meta
        self.item_meta = ItemMedicion.objects.create(codigo='IT001', nombre_item='Cobertura', estado='Activo')

    # --- 1. PRUEBAS DE AUTENTICACIÓN Y RECUPERACIÓN ---

    def test_login_exitoso_y_redireccion_segun_perfil(self):
        # Admin ingresa y va a inicio
        resp = self.client.post(reverse('login'), {'username': 'admin_sgr', 'password': 'Admin1234!'})
        self.assertRedirects(resp, reverse('gestion_inicio'))

        self.client.logout()

        # Operador ingresa y va directo a atenciones
        resp_op = self.client.post(reverse('login'), {'username': 'funcionario_juan', 'password': 'User1234!'})
        self.assertRedirects(resp_op, reverse('gestion_atenciones'))

    def test_login_cuenta_inactiva_rechazada(self):
        resp = self.client.post(reverse('login'), {'username': 'inactivo', 'password': 'User1234!'})
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "inactiva")

    def test_login_credenciales_invalidas(self):
        resp = self.client.post(reverse('login'), {'username': 'admin_sgr', 'password': 'WrongPassword!'})
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Credenciales incorrectas")

    def test_flujo_completo_recuperacion_contrasena(self):
        # Paso 1: Solicitar código
        resp1 = self.client.post(reverse('recuperar_contrasena'), {'email': 'admin@laserena.cl'})
        self.assertRedirects(resp1, reverse('validar_codigo'))
        session = self.client.session
        code = session.get('recovery_code')
        self.assertIsNotNone(code)
        self.assertEqual(len(code), 6)

        # Paso 2: Validar código incorrecto incrementa intentos
        resp2_bad = self.client.post(reverse('validar_codigo'), {
            'code_1': '0', 'code_2': '0', 'code_3': '0', 'code_4': '0', 'code_5': '0', 'code_6': '0'
        })
        self.assertEqual(self.client.session.get('recovery_attempts'), 1)

        # Paso 2: Validar código correcto
        resp2_ok = self.client.post(reverse('validar_codigo'), {
            f'code_{i+1}': code[i] for i in range(6)
        })
        self.assertRedirects(resp2_ok, reverse('nueva_contrasena'))
        self.assertTrue(self.client.session.get('recovery_verified'))

        # Paso 3: Crear nueva clave
        # Falla si no cumple requisitos (sin número ni especial)
        resp3_fail = self.client.post(reverse('nueva_contrasena'), {
            'nueva_contrasena': 'SoloLetras',
            'confirmar_contrasena': 'SoloLetras'
        })
        self.assertEqual(resp3_fail.status_code, 200)

        # Éxito con contraseña robusta
        resp3_ok = self.client.post(reverse('nueva_contrasena'), {
            'nueva_contrasena': 'NuevaClave2026!',
            'confirmar_contrasena': 'NuevaClave2026!'
        })
        self.assertRedirects(resp3_ok, reverse('login'))

        # Probar login con nueva clave
        resp_login_new = self.client.post(reverse('login'), {'username': 'admin_sgr', 'password': 'NuevaClave2026!'})
        self.assertRedirects(resp_login_new, reverse('gestion_inicio'))

        # Clave anterior debe ser rechazada
        self.client.logout()
        resp_old = self.client.post(reverse('login'), {'username': 'admin_sgr', 'password': 'Admin1234!'})
        self.assertEqual(resp_old.status_code, 200)

    # --- 2. PRUEBAS DE LOS SEIS CRUDS Y EXCEL ---

    def test_crud_delegaciones_y_exportar_excel(self):
        self.client.force_login(self.user_admin)

        # Crear
        resp_crear = self.client.post(reverse('gestion_delegaciones'), {
            'codigo': 'DEL05', 'nombre': 'Delegación Las Compañías Sur', 'comuna': 'La Serena', 'estado': 'Activa'
        })
        self.assertRedirects(resp_crear, reverse('gestion_delegaciones'))
        self.assertTrue(Delegacion.objects.filter(codigo='DEL05').exists())

        del_id = Delegacion.objects.get(codigo='DEL05').id

        # Editar
        self.client.post(reverse('gestion_delegaciones_editar', args=[del_id]), {
            'codigo': 'DEL05', 'nombre': 'Delegación Sur Editada', 'comuna': 'La Serena', 'estado': 'Activa'
        })
        self.assertEqual(Delegacion.objects.get(id=del_id).nombre, 'Delegación Sur Editada')

        # Exportar a Excel
        resp_excel = self.client.get(reverse('gestion_delegaciones'), {'export': 'excel'})
        self.assertEqual(resp_excel.status_code, 200)
        self.assertIn('text/csv', resp_excel['Content-Type'])
        self.assertIn('Delegación Sur Editada', resp_excel.content.decode('utf-8-sig'))

        # Eliminar
        self.client.post(reverse('gestion_delegaciones_eliminar', args=[del_id]))
        self.assertFalse(Delegacion.objects.filter(id=del_id).exists())

    def test_crud_roles(self):
        self.client.force_login(self.user_admin)
        # Crear
        self.client.post(reverse('gestion_roles'), {
            'codigo': 'ROL10', 'nombre_rol': 'Fiscalizador', 'alcance': 'Delegación', 'estado': 'Activo'
        })
        rol = Rol.objects.get(codigo='ROL10')
        self.assertEqual(rol.nombre_rol, 'Fiscalizador')

        # Exportar
        resp_excel = self.client.get(reverse('gestion_roles'), {'export': 'excel'})
        self.assertIn('Fiscalizador', resp_excel.content.decode('utf-8-sig'))

    def test_scoping_usuarios_por_delegacion(self):
        # Admin ve usuarios de todas las delegaciones
        self.client.force_login(self.user_admin)
        resp_admin = self.client.get(reverse('gestion_usuarios'))
        self.assertEqual(resp_admin.status_code, 200)

        # Delegado Centro solo ve los de su delegación Centro
        self.client.force_login(self.user_delegado)
        resp_delegado = self.client.get(reverse('gestion_usuarios'))
        self.assertEqual(resp_delegado.status_code, 200)
        # No debe ver funcionarios asignados a Norte
        func_norte = Funcionario.objects.create(
            user=User.objects.create_user(username='user_norte', email='norte@laserena.cl', password='User1234!'),
            identificador_institucional='NOR-01',
            delegacion=self.del_norte,
            cargo=self.cargo
        )
        resp_delegado_scoped = self.client.get(reverse('gestion_usuarios'))
        self.assertNotContains(resp_delegado_scoped, 'user_norte')

    def test_integridad_referencial_tipo_atencion(self):
        self.client.force_login(self.user_admin)
        # Intentar eliminar TipoAtencion con SubAtenciones asociadas debe ser rechazado
        self.client.post(reverse('gestion_tipo_atencion_eliminar', args=[self.tipo_social.id]))
        self.assertTrue(TipoAtencion.objects.filter(id=self.tipo_social.id).exists())

    # --- 3. PRUEBAS DE INGRESO DE ATENCIÓN CIUDADANA ---

    def test_ingreso_atencion_ciudadana_y_doble_envio(self):
        self.client.force_login(self.user_operador)

        # Guardar atención
        data = {
            'solicitante': 'María González (12.345.678-9)',
            'tipo_atencion_id': self.tipo_social.id,
            'sub_atencion_id': self.sub_social.id,
            'descripcion': 'Solicitud urgente de alimentos y frazadas.'
        }
        resp = self.client.post(reverse('gestion_atenciones'), data)
        self.assertRedirects(resp, reverse('gestion_atenciones'))

        # Verificar que se creó y tiene código de atención único
        atencion = AtencionCiudadana.objects.filter(solicitante='María González (12.345.678-9)').first()
        self.assertIsNotNone(atencion)
        self.assertTrue(atencion.codigo_atencion.startswith('AT-'))
        self.assertEqual(atencion.delegacion, self.del_centro)
        self.assertEqual(atencion.usuario_responsable, self.user_operador)

        # Prevención de doble envío inmediato
        resp_duplicado = self.client.post(reverse('gestion_atenciones'), data)
        # Solo debe existir una atención con ese solicitante
        self.assertEqual(AtencionCiudadana.objects.filter(solicitante='María González (12.345.678-9)').count(), 1)

    def test_api_subatenciones_dependientes(self):
        self.client.force_login(self.user_operador)
        resp = self.client.get(reverse('api_subatenciones', args=[self.tipo_social.id]))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data['subatenciones']), 1)
        self.assertEqual(data['subatenciones'][0]['nombre'], 'Ayuda social')
