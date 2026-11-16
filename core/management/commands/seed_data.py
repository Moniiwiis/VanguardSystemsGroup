"""
Comando de población de datos para el Sistema Municipal - Municipalidad de La Serena.
Evaluación 3 - Proyecto Integrado 4to Semestre INACAP.

Genera:
  - Delegaciones, Sectores, Roles, Cargos
  - 6 cuentas de evaluación (admin_a, editor_a, lector_a, lector_b, cliente_1, cliente_2)
  - Cuentas de operación adicionales
  - >2.000 OrganizacionComunitaria desde fixtures/base_datos_JJVV.xlsx
  - Atenciones ciudadanas desde fixtures/matriz_sgr.xlsx
  - Vecinos con RUTs válidos Módulo 11
"""

import os
import re
import datetime
import random
import unicodedata
import openpyxl

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User, Permission
from django.utils import timezone

from accounts.models import Delegacion, Cargo, Funcionario, Rol, FuncionarioRol, Sector
from activities.models import (
    Actividad, Vecino, AtencionCiudadana, OrganizacionComunitaria, TipoGestion,
)
from agenda.models import CompromisoAgenda
from core.utils import separar_nombre_completo, separar_nombre_usuario

try:
    from configuration.models import (
        TipoAtencion, SubAtencion, Periodo, CatalogoActividad, ItemMedicion, ConfiguracionMeta, AreaApoyo
    )
except ImportError:
    TipoAtencion = SubAtencion = Periodo = CatalogoActividad = ItemMedicion = ConfiguracionMeta = AreaApoyo = None

# ---------------------------------------------------------------------------
# Utilidades RUT Módulo 11
# ---------------------------------------------------------------------------

def calcular_dv(numero):
    """Calcula dígito verificador RUT chileno (Módulo 11)."""
    s, m = 0, 2
    for d in reversed(str(numero)):
        s += int(d) * m
        m = m + 1 if m < 7 else 2
    resto = s % 11
    if resto == 0:
        return '0'
    elif resto == 1:
        return 'K'
    else:
        return str(11 - resto)


def formatear_rut(numero):
    """Devuelve RUT formateado como '12.345.678-9'."""
    dv = calcular_dv(numero)
    s = str(numero)
    if len(s) > 6:
        s = s[:-6] + '.' + s[-6:-3] + '.' + s[-3:]
    elif len(s) > 3:
        s = s[:-3] + '.' + s[-3:]
    return f"{s}-{dv}"


# Pool de RUTs únicos para vecinos generados (3.000.000 - 25.000.000)
_ruts_usados = set()

def gen_rut():
    """Genera RUT chileno único y válido."""
    while True:
        n = random.randint(3_000_000, 25_000_000)
        if n not in _ruts_usados:
            _ruts_usados.add(n)
            return formatear_rut(n)


# ---------------------------------------------------------------------------
# Clase Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = ('Puebla la base de datos con datos de evaluación:\n'
            '  - 6 cuentas de evaluación\n'
            '  - >2.000 organizaciones desde base_datos_JJVV.xlsx\n'
            '  - Atenciones desde matriz_sgr.xlsx')

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(
            "=== Iniciando seed de datos municipales (Evaluación 3) ==="))

        # Pre-cargar números base de RUT ya usados para garantizar idempotencia
        for r_ex in list(Vecino.all_objects.values_list('rut', flat=True)) + list(
            Funcionario.all_objects.exclude(rut__isnull=True).values_list('rut', flat=True)
        ):
            dig = ''.join(ch for ch in (r_ex or '').split('-')[0] if ch.isdigit())
            if dig.isdigit():
                _ruts_usados.add(int(dig))

        # ------------------------------------------------------------------
        # 1. DELEGACIONES
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando delegaciones...")
        del_centro, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Centro",
            defaults={'codigo': 'DEL01', 'direccion': 'Los Carrera 301',
                      'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Urbano Central'}
        )
        del_centro.codigo = 'DEL01'; del_centro.estado = 'Activa'
        del_centro.deleted_at = None; del_centro.save()

        del_norte, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Norte",
            defaults={'codigo': 'DEL02', 'direccion': 'Av. Las Compañías 450',
                      'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Sector Norte'}
        )
        del_norte.codigo = 'DEL02'; del_norte.estado = 'Activa'
        del_norte.deleted_at = None; del_norte.save()

        del_sur, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Sur",
            defaults={'codigo': 'DEL03', 'direccion': 'Av. Cuatro Esquinas 890',
                      'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Sector Sur'}
        )
        del_sur.codigo = 'DEL03'; del_sur.estado = 'Activa'
        del_sur.deleted_at = None; del_sur.save()

        del_rural, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Rural",
            defaults={'codigo': 'DEL04', 'direccion': 'Camino Elqui Km 12',
                      'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Valle de Elqui'}
        )
        del_rural.codigo = 'DEL04'; del_rural.estado = 'Activa'
        del_rural.deleted_at = None; del_rural.save()

        # ------------------------------------------------------------------
        # 2. SECTORES
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando sectores...")
        sectores_data = [
            ('SEC-CEN01', 'Casco Histórico', del_centro),
            ('SEC-CEN02', 'Balmaceda y Estadio', del_centro),
            ('SEC-CEN03', 'La Florida y El Pino', del_centro),
            ('SEC-CEN04', 'Caleta San Pedro', del_centro),
            ('SEC-CEN05', 'Costanera y Av. del Mar', del_centro),
            ('SEC-NOR01', 'Compañía Alta', del_norte),
            ('SEC-NOR02', 'Compañía Baja', del_norte),
            ('SEC-NOR03', 'Villa Lambert y Parque Islón', del_norte),
            ('SEC-NOR04', 'Villa Los Aromos', del_norte),
            ('SEC-NOR05', 'El Romero Urbano', del_norte),
            ('SEC-SUR01', 'San Joaquín', del_sur),
            ('SEC-SUR02', 'El Milagro I y II', del_sur),
            ('SEC-SUR03', 'La Pampa Tradicional', del_sur),
            ('SEC-SUR04', 'Barrio Universitario', del_sur),
            ('SEC-SUR05', 'Colina El Pino Sur', del_sur),
            ('SEC-RUR01', 'Algarrobito', del_rural),
            ('SEC-RUR02', 'Altovalsol', del_rural),
            ('SEC-RUR03', 'Las Rojas', del_rural),
            ('SEC-RUR04', 'Lambert Rural', del_rural),
            ('SEC-RUR05', 'Pelícana y Quebrada de Talca', del_rural),
        ]
        sectores_dict = {}
        delegaciones_por_territorio = {}
        for cod, nom, del_obj in sectores_data:
            sec, _ = Sector.all_objects.get_or_create(
                codigo=cod,
                defaults={'nombre': nom, 'delegacion': del_obj, 'estado': 'Activo'}
            )
            sec.nombre = nom; sec.delegacion = del_obj
            sec.estado = 'Activo'; sec.deleted_at = None; sec.save()
            sectores_dict[cod] = sec
            delegaciones_por_territorio[nom.upper()] = del_obj

        # ------------------------------------------------------------------
        # 3. ROLES
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando roles...")

        def mk_rol(nombre, codigo, alcance, descripcion):
            r, _ = Rol.all_objects.get_or_create(
                nombre_rol=nombre,
                defaults={'codigo': codigo, 'alcance': alcance,
                          'estado': 'Activo', 'descripcion': descripcion}
            )
            r.codigo = codigo; r.alcance = alcance
            r.estado = 'Activo'; r.descripcion = descripcion
            r.deleted_at = None; r.save()
            return r

        rol_admin    = mk_rol("Administrador",    "ROL01", "Autorizado", "Acceso total al sistema municipal.")
        rol_operador = mk_rol("Operador",          "ROL02", "Delegación", "Ingreso y atención ciudadana en su delegación.")
        rol_consultor = mk_rol("Consultor",        "ROL03", "Lectura",    "Solo lectura y seguimiento.")
        rol_coord    = mk_rol("Coordinador",       "ROL04", "Autorizado", "Supervisión de metas y reportes territoriales.")
        rol_delegado = mk_rol("Delegado Municipal","ROL05", "Delegación", "Gestión directiva de su delegación.")
        rol_cliente  = mk_rol("Cliente",           "ROL06", "Personal",   "Vecino ciudadano con acceso al portal.")

        # ------------------------------------------------------------------
        # 4. CARGOS
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando cargos...")

        def mk_cargo(nombre, descripcion=''):
            c, _ = Cargo.all_objects.get_or_create(
                nombre_cargo=nombre,
                defaults={'descripcion': descripcion}
            )
            return c

        cargo_admin     = mk_cargo("Administrador Sistema", "Administración del sistema municipal.")
        cargo_gestor    = mk_cargo("Gestor Social", "Atención y derivación de requerimientos sociales.")
        cargo_coord     = mk_cargo("Coordinador Territorial", "Supervisión de compromisos comunitarios.")
        cargo_inspector = mk_cargo("Inspector Municipal", "Fiscalización y respuesta a denuncias.")
        cargo_ciudadano = mk_cargo("Ciudadano", "Usuario ciudadano portal vecinal.")
        cargo_org       = mk_cargo("Organización / JJVV", "Cuenta ciudadana de organización comunitaria.")

        # ------------------------------------------------------------------
        # 5. TIPOS DE ATENCIÓN Y SUB-ATENCIONES
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando tipos de atención...")
        tipos_map = {}  # nombre -> objeto TipoAtencion

        tipos_nombres = [
            ("Social",          "TA001", "Apoyo y derivación social."),
            ("Salud",           "TA002", "Orientación y derivación de salud."),
            ("Educación",       "TA003", "Apoyo escolar y becas municipales."),
            ("Vivienda",        "TA004", "Regularización y mejoras habitacionales."),
            ("Medioambiente",   "TA005", "Denuncias y gestión ambiental."),
            ("Seguridad",       "TA006", "Coordinación con fuerzas de orden."),
            ("Infraestructura", "TA007", "Obras, veredas y luminaria."),
            ("Deportes",        "TA008", "Programas deportivos y recreativos."),
            ("Cultura",         "TA009", "Talleres y actividades culturales."),
            ("Trámites",        "TA010", "Certificados, permisos y documentos."),
        ]
        for nombre_ta, codigo_ta, desc_ta in tipos_nombres:
            if TipoAtencion:
                ta, _ = TipoAtencion.all_objects.get_or_create(
                    nombre=nombre_ta,
                    defaults={'codigo': codigo_ta, 'descripcion': desc_ta, 'estado': 'Activo'}
                )
                ta.codigo = codigo_ta; ta.descripcion = desc_ta
                ta.estado = 'Activo'; ta.deleted_at = None; ta.save()
                tipos_map[nombre_ta.upper()] = ta

        sub_atenciones = [
            ("Ayuda social",          "SA001", "Social"),
            ("Subsidio habitacional", "SA002", "Social"),
            ("Consulta médica",       "SA003", "Salud"),
            ("Derivación CESFAM",     "SA004", "Salud"),
            ("Beca municipal",        "SA005", "Educación"),
            ("Mejora térmica",        "SA006", "Vivienda"),
            ("Regularización DFL2",   "SA007", "Vivienda"),
            ("Denuncia ambiental",    "SA008", "Medioambiente"),
            ("Luminaria pública",     "SA009", "Infraestructura"),
            ("Certificado domicilio", "SA010", "Trámites"),
        ]
        subatenciones_map = {}
        for nombre_sa, codigo_sa, tipo_nombre_sa in sub_atenciones:
            if SubAtencion and tipo_nombre_sa.upper() in tipos_map:
                sa, _ = SubAtencion.all_objects.get_or_create(
                    nombre=nombre_sa,
                    tipo_atencion=tipos_map[tipo_nombre_sa.upper()],
                    defaults={'codigo': codigo_sa, 'estado': 'Activa'}
                )
                sa.codigo = codigo_sa; sa.estado = 'Activa'
                sa.deleted_at = None; sa.save()
                subatenciones_map[nombre_sa.upper()] = sa

        ta_default = tipos_map.get('SOCIAL')
        sa_default = subatenciones_map.get('AYUDA SOCIAL')

        # ------------------------------------------------------------------
        # 5b. ÁREAS / PERSONAS / CUADRILLAS DE APOYO
        # ------------------------------------------------------------------
        if AreaApoyo:
            areas_apoyo_seed = [
                ("AA001", "Obras Municipales", "Área Municipal", "Dirección de Obras Municipales y bacheo."),
                ("AA002", "Parques y Jardines", "Área Municipal", "Mantención de áreas verdes y arbolado."),
                ("AA003", "DISERCO", "Área Municipal", "Dirección de Desarrollo Comunitario."),
                ("AA004", "OROC", "Área Municipal", "Organizaciones Comunitarias."),
                ("AA005", "Dirección de Tránsito", "Área Municipal", "Señalética y seguridad vial."),
                ("AA006", "Alumbrado Público", "Área Municipal", "Reposición y mantención de luminarias."),
                ("AA007", "Aseo y Ornato", "Área Municipal", "Retiro de microbasurales y limpieza."),
                ("AA008", "Cuadrilla Territorial Centro", "Cuadrilla", "Cuadrilla operativa Delegación Centro."),
                ("AA009", "Cuadrilla Territorial Norte", "Cuadrilla", "Cuadrilla operativa Las Compañías."),
                ("AA010", "Inspector de Turno", "Persona", "Apoyo en terreno para fiscalización."),
            ]
            for cod_aa, nom_aa, tipo_aa, desc_aa in areas_apoyo_seed:
                aa, _ = AreaApoyo.all_objects.get_or_create(
                    nombre=nom_aa,
                    defaults={'codigo': cod_aa, 'tipo': tipo_aa, 'descripcion': desc_aa, 'estado': 'Activo'}
                )
                aa.codigo = cod_aa
                aa.tipo = tipo_aa
                aa.descripcion = desc_aa
                aa.estado = 'Activo'
                aa.deleted_at = None
                aa.save()

        # ------------------------------------------------------------------
        # 6. TIPO DE GESTIÓN (para vecinos)
        # ------------------------------------------------------------------
        tg_sol, _ = TipoGestion.all_objects.get_or_create(
            nombre="Solicitud", defaults={'descripcion': 'Solicitud general', 'estado': 'Activo'}
        )
        tg_rec, _ = TipoGestion.all_objects.get_or_create(
            nombre="Reclamo", defaults={'descripcion': 'Reclamos vecinales', 'estado': 'Activo'}
        )

        # ------------------------------------------------------------------
        # 7. USUARIOS - CUENTAS DE EVALUACIÓN (6 exactas requeridas)
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando 6 cuentas de evaluación...")
        all_perms = Permission.objects.filter(
            content_type__app_label__in=['accounts', 'activities', 'agenda', 'configuration']
        )

        def mk_user_funcionario(username, password, first_name, last_name, email,
                                identificador, delegacion, cargo, rol,
                                is_staff=False, is_superuser=False, perms=None,
                                rut='', telefono=''):
            pn, sn, ap, am = separar_nombre_usuario(first_name, last_name)
            u, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'first_name': first_name, 'last_name': last_name,
                          'is_staff': is_staff, 'is_superuser': is_superuser}
            )
            u.first_name = first_name; u.last_name = last_name
            u.email = email; u.is_staff = is_staff; u.is_superuser = is_superuser
            u.set_password(password); u.is_active = True; u.save()
            if perms:
                u.user_permissions.set(perms)
            f, _ = Funcionario.all_objects.get_or_create(
                user=u,
                defaults={'identificador_institucional': identificador,
                          'delegacion': delegacion, 'cargo': cargo, 'estado': 'Activo'}
            )
            f.identificador_institucional = identificador
            f.primer_nombre = pn; f.segundo_nombre = sn
            f.apellido_paterno = ap; f.apellido_materno = am
            if rut:
                f.rut = rut
            if telefono:
                f.telefono = telefono
            f.delegacion = delegacion; f.cargo = cargo
            f.debe_cambiar_contrasena = False
            f.estado = 'Activo'; f.deleted_at = None; f.save()
            # Asignar rol
            fr = FuncionarioRol.all_objects.filter(funcionario=f, rol=rol).first()
            if fr:
                fr.deleted_at = None; fr.save()
            else:
                FuncionarioRol.objects.create(funcionario=f, rol=rol)
            return u, f

        # ➊ admin_a — Administrador, Delegación Centro
        u_admin_a, f_admin_a = mk_user_funcionario(
            username='admin_a', password='Admin1234!',
            first_name='Administrador', last_name='Evaluación A',
            email='admin_a@laserena.cl',
            identificador='EVAL-ADM-A', delegacion=del_centro,
            cargo=cargo_admin, rol=rol_admin,
            is_staff=True, is_superuser=True,
            rut=formatear_rut(14111001), telefono='+56 9 5100 0001'
        )

        # ➋ editor_a — Operador/Editor, Delegación Centro
        u_editor_a, f_editor_a = mk_user_funcionario(
            username='editor_a', password='Editor1234!',
            first_name='Editor', last_name='Evaluación A',
            email='editor_a@laserena.cl',
            identificador='EVAL-EDT-A', delegacion=del_centro,
            cargo=cargo_gestor, rol=rol_operador,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111002), telefono='+56 9 5100 0002'
        )

        # ➌ lector_a — Consultor/Lector, Delegación Centro
        u_lector_a, f_lector_a = mk_user_funcionario(
            username='lector_a', password='Lector1234!',
            first_name='Lector', last_name='Evaluación A',
            email='lector_a@laserena.cl',
            identificador='EVAL-LEC-A', delegacion=del_centro,
            cargo=cargo_inspector, rol=rol_consultor,
            is_staff=False,
            rut=formatear_rut(14111003), telefono='+56 9 5100 0003'
        )

        # ➍ lector_b — Consultor/Lector, Delegación Norte (Las Compañías)
        u_lector_b, f_lector_b = mk_user_funcionario(
            username='lector_b', password='Lector1234!',
            first_name='Lector', last_name='Evaluación B',
            email='lector_b@laserena.cl',
            identificador='EVAL-LEC-B', delegacion=del_norte,
            cargo=cargo_inspector, rol=rol_consultor,
            is_staff=False,
            rut=formatear_rut(14111004), telefono='+56 9 5100 0004'
        )

        # ➎ cliente_1 — Cliente, crea vecino propio (RUT 12.345.678-9)
        u_cliente1, _ = User.objects.get_or_create(
            username='cliente_1',
            defaults={'email': 'cliente1@vecino.cl', 'first_name': 'María', 'last_name': 'González Pérez',
                      'is_staff': False, 'is_superuser': False}
        )
        u_cliente1.first_name = 'María'; u_cliente1.last_name = 'González Pérez'
        u_cliente1.email = 'cliente1@vecino.cl'
        u_cliente1.set_password('Cliente1234!'); u_cliente1.is_active = True; u_cliente1.save()
        f_c1, _ = Funcionario.all_objects.get_or_create(
            user=u_cliente1,
            defaults={'identificador_institucional': 'VEC-C1', 'delegacion': del_centro,
                      'cargo': cargo_ciudadano, 'estado': 'Activo'}
        )
        f_c1.identificador_institucional = 'VEC-C1'
        f_c1.primer_nombre = 'María'; f_c1.segundo_nombre = ''
        f_c1.apellido_paterno = 'González'; f_c1.apellido_materno = 'Pérez'
        f_c1.rut = '12.345.678-9'; f_c1.telefono = '+56 9 8765 4321'
        f_c1.delegacion = del_centro; f_c1.cargo = cargo_ciudadano
        f_c1.debe_cambiar_contrasena = False
        f_c1.estado = 'Activo'; f_c1.deleted_at = None; f_c1.save()
        fr_c1 = FuncionarioRol.all_objects.filter(funcionario=f_c1, rol=rol_cliente).first()
        if fr_c1:
            fr_c1.deleted_at = None; fr_c1.save()
        else:
            FuncionarioRol.objects.create(funcionario=f_c1, rol=rol_cliente)
        # Vecino asociado
        v_cliente1, _ = Vecino.all_objects.get_or_create(
            rut='12.345.678-9',
            defaults={'nombre': 'María González Pérez',
                      'primer_nombre': 'María', 'segundo_nombre': '',
                      'apellido_paterno': 'González', 'apellido_materno': 'Pérez',
                      'direccion': 'Av. Balmaceda 120, La Serena',
                      'telefono': '+56 9 8765 4321', 'delegacion': del_centro,
                      'sector': sectores_dict.get('SEC-CEN01'),
                      'territorio': 'Casco Histórico', 'tipo_gestion': tg_sol, 'estado': 'Activo'}
        )
        v_cliente1.nombre = 'María González Pérez'
        v_cliente1.primer_nombre = 'María'; v_cliente1.apellido_paterno = 'González'; v_cliente1.apellido_materno = 'Pérez'
        v_cliente1.deleted_at = None; v_cliente1.save()

        # ➏ cliente_2 — Cliente, crea vecino propio (RUT 9.876.543-2)
        u_cliente2, _ = User.objects.get_or_create(
            username='cliente_2',
            defaults={'email': 'cliente2@vecino.cl', 'first_name': 'Pedro', 'last_name': 'Rojas Soto',
                      'is_staff': False, 'is_superuser': False}
        )
        u_cliente2.first_name = 'Pedro'; u_cliente2.last_name = 'Rojas Soto'
        u_cliente2.email = 'cliente2@vecino.cl'
        u_cliente2.set_password('Cliente1234!'); u_cliente2.is_active = True; u_cliente2.save()
        f_c2, _ = Funcionario.all_objects.get_or_create(
            user=u_cliente2,
            defaults={'identificador_institucional': 'VEC-C2', 'delegacion': del_norte,
                      'cargo': cargo_ciudadano, 'estado': 'Activo'}
        )
        f_c2.identificador_institucional = 'VEC-C2'
        f_c2.primer_nombre = 'Pedro'; f_c2.segundo_nombre = ''
        f_c2.apellido_paterno = 'Rojas'; f_c2.apellido_materno = 'Soto'
        f_c2.rut = '9.876.543-2'; f_c2.telefono = '+56 9 7654 3210'
        f_c2.delegacion = del_norte; f_c2.cargo = cargo_ciudadano
        f_c2.debe_cambiar_contrasena = False
        f_c2.estado = 'Activo'; f_c2.deleted_at = None; f_c2.save()
        fr_c2 = FuncionarioRol.all_objects.filter(funcionario=f_c2, rol=rol_cliente).first()
        if fr_c2:
            fr_c2.deleted_at = None; fr_c2.save()
        else:
            FuncionarioRol.objects.create(funcionario=f_c2, rol=rol_cliente)
        v_cliente2, _ = Vecino.all_objects.get_or_create(
            rut='9.876.543-2',
            defaults={'nombre': 'Pedro Rojas Soto',
                      'primer_nombre': 'Pedro', 'segundo_nombre': '',
                      'apellido_paterno': 'Rojas', 'apellido_materno': 'Soto',
                      'direccion': "Calle O'Higgins 455, Las Compañías",
                      'telefono': '+56 9 7654 3210', 'delegacion': del_norte,
                      'sector': sectores_dict.get('SEC-NOR01'),
                      'territorio': 'Compañía Alta', 'tipo_gestion': tg_rec, 'estado': 'Activo'}
        )
        v_cliente2.nombre = 'Pedro Rojas Soto'
        v_cliente2.primer_nombre = 'Pedro'; v_cliente2.apellido_paterno = 'Rojas'; v_cliente2.apellido_materno = 'Soto'
        v_cliente2.deleted_at = None; v_cliente2.save()

        # Cuentas de operación adicionales (superadmin y operadores de sistema)
        self.stdout.write("▶ Creando cuentas adicionales de operación...")
        mk_user_funcionario(
            username='admin_sgr', password='Admin1234!',
            first_name='Administrador', last_name='General',
            email='admin@laserena.cl', identificador='ADM-001',
            delegacion=None, cargo=cargo_coord, rol=rol_admin,
            is_staff=True, is_superuser=True,
            rut=formatear_rut(14111005), telefono='+56 9 5100 0005'
        )
        mk_user_funcionario(
            username='delegado_centro', password='User1234!',
            first_name='Carlos', last_name='Mendoza Silva',
            email='delegado.centro@laserena.cl', identificador='DEL-001',
            delegacion=del_centro, cargo=cargo_coord, rol=rol_delegado,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111006), telefono='+56 9 5100 0006'
        )
        mk_user_funcionario(
            username='delegado_companias', password='User1234!',
            first_name='María', last_name='Rojas Barraza',
            email='delegado.companias@laserena.cl', identificador='DEL-002',
            delegacion=del_norte, cargo=cargo_coord, rol=rol_delegado,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111007), telefono='+56 9 5100 0007'
        )
        mk_user_funcionario(
            username='delegado_sur', password='User1234!',
            first_name='Gonzalo', last_name='Herrera Vega',
            email='delegado.sur@laserena.cl', identificador='DEL-003',
            delegacion=del_sur, cargo=cargo_coord, rol=rol_delegado,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111008), telefono='+56 9 5100 0008'
        )
        mk_user_funcionario(
            username='delegado_rural', password='User1234!',
            first_name='Patricia', last_name='Vega Moreno',
            email='delegado.rural@laserena.cl', identificador='DEL-004',
            delegacion=del_rural, cargo=cargo_coord, rol=rol_delegado,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111009), telefono='+56 9 5100 0009'
        )
        mk_user_funcionario(
            username='funcionario_juan', password='User1234!',
            first_name='Juan', last_name='Pérez López',
            email='juan.perez@laserena.cl', identificador='FUN-101',
            delegacion=del_centro, cargo=cargo_gestor, rol=rol_operador,
            is_staff=True, perms=all_perms,
            rut=formatear_rut(14111010), telefono='+56 9 5100 0010'
        )
        mk_user_funcionario(
            username='consultor_ana', password='User1234!',
            first_name='Ana', last_name='Ejemplo Flores',
            email='ana.ejemplo@laserena.cl', identificador='CON-201',
            delegacion=del_centro, cargo=cargo_inspector, rol=rol_consultor,
            rut=formatear_rut(14111011), telefono='+56 9 5100 0011'
        )

        # Referencia al usuario editor para las atenciones
        u_editor = User.objects.filter(username='editor_a').first()
        u_admin_sys = User.objects.filter(username='admin_sgr').first() or u_editor

        # ------------------------------------------------------------------
        # 8. ORGANIZACIONES COMUNITARIAS desde base_datos_JJVV.xlsx
        # ------------------------------------------------------------------
        self.stdout.write("▶ Importando Organizaciones Comunitarias desde JJVV xlsx...")

        xlsx_jjvv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.dirname(__file__)))), 'fixtures', 'base_datos_JJVV.xlsx')

        # Mapa de territorio → delegacion (aproximación por nombre de sector/territorio)
        # La columna TERRIT. DELEG. tiene nombres de sectores/localidades
        territorio_delegacion_map = {
            # Norte / Las Compañías
            'COMPAÑÍA': del_norte, 'COMPANIAS': del_norte, 'COMPAÑIAS': del_norte,
            'LATORRE': del_norte, 'LAMBERT': del_norte, 'ROMERO': del_norte,
            'ALFALFARES': del_norte, 'RINCONADA': del_norte, 'PUCLARO': del_norte,
            'MARQUESA': del_norte, 'ISLÓN': del_norte, 'ISLON': del_norte,
            # Sur
            'PAMPA': del_sur, 'MILAGRO': del_sur, 'SAN JOAQUÍN': del_sur,
            'JOAQUIN': del_sur, 'CUATRO ESQUINAS': del_sur, 'TIERRAS BLANCAS': del_sur,
            'PEÑUELAS': del_sur, 'PENUELAS': del_sur,
            # Rural
            'ALGARROBITO': del_rural, 'ALTOVALSOL': del_rural, 'ROJAS': del_rural,
            'PELÍCANA': del_rural, 'PELICANA': del_rural, 'TALCA': del_rural,
            'VILLASECA': del_rural, 'GUALLIGUAICA': del_rural, 'ANTENA': del_rural,
            'CERES': del_rural, 'MARQUESA': del_rural, 'TOTORALILLO': del_rural,
            'GUANGUAL': del_rural, 'CERRILLOS': del_rural,
            # Centro (default)
        }

        def resolver_delegacion(territorio_str):
            """Mapea texto de territorio a delegacion."""
            if not territorio_str:
                return del_centro
            t = str(territorio_str).upper().strip()
            for clave, deleg in territorio_delegacion_map.items():
                if clave in t:
                    return deleg
            return del_centro

        tipo_choices_validos = [c[0] for c in OrganizacionComunitaria.TIPO_CHOICES]

        def resolver_tipo(nombre_org):
            """Infiere tipo de organización desde el nombre."""
            n = str(nombre_org).upper() if nombre_org else ''
            if 'JUNTA' in n or 'JJVV' in n or 'VECIN' in n:
                return 'Junta de Vecinos'
            if 'ADULTO MAYOR' in n or 'ADULTO' in n or 'ANCIAN' in n:
                return 'Club de Adulto Mayor'
            if 'DEPORT' in n or 'CLUB' in n or 'FUTBOL' in n or 'FÚTBOL' in n:
                return 'Organización Deportiva'
            if 'MADRES' in n or 'MADRE' in n or 'CENMA' in n:
                return 'Centro de Madres'
            if 'COMITÉ' in n or 'COMITE' in n or 'SEGURIDAD' in n or 'VIGILANCIA' in n:
                return 'Comité de Vecinos/Seguridad'
            if 'CULTURAL' in n or 'JUVENIL' in n or 'JOVEN' in n or 'ARTE' in n:
                return 'Agrupación Cultural/Juvenil'
            if 'VIVIENDA' in n or 'ALLEGADO' in n or 'AGUA' in n or 'APR' in n:
                return 'Comité de Vivienda/APR'
            return 'Otra Organización Funcional'

        orgs_creadas = 0
        orgs_ya_existentes = 0

        try:
            wb_jjvv = openpyxl.load_workbook(xlsx_jjvv, read_only=True, data_only=True)
            ws_jjvv = wb_jjvv.active

            for row_idx, row in enumerate(ws_jjvv.iter_rows(min_row=2, values_only=True), start=2):
                if not row or not row[0]:
                    continue

                nombre_org = str(row[0]).strip()[:200] if row[0] else ''
                domicilio  = str(row[1]).strip()[:250] if row[1] else ''
                territorio = str(row[2]).strip()[:100] if row[2] else ''
                socios_raw = row[3]
                f_const_raw = row[4]
                num_pj_raw  = row[5]
                f_insc_raw  = row[6]
                reg_dir_raw = row[7]

                if not nombre_org:
                    continue

                socios_num = 0
                if socios_raw is not None:
                    try:
                        socios_num = max(0, int(float(str(socios_raw))))
                    except (ValueError, TypeError):
                        socios_num = 0

                fecha_const = None
                if f_const_raw:
                    if hasattr(f_const_raw, 'date'):
                        fecha_const = f_const_raw.date() if hasattr(f_const_raw, 'date') else f_const_raw
                    elif isinstance(f_const_raw, datetime.datetime):
                        fecha_const = f_const_raw.date()
                    elif isinstance(f_const_raw, datetime.date):
                        fecha_const = f_const_raw

                fecha_insc = None
                if f_insc_raw:
                    if isinstance(f_insc_raw, datetime.datetime):
                        fecha_insc = f_insc_raw.date()
                    elif isinstance(f_insc_raw, datetime.date):
                        fecha_insc = f_insc_raw

                num_pj = str(num_pj_raw).strip()[:50] if num_pj_raw else ''
                reg_dir = str(reg_dir_raw).strip()[:50] if reg_dir_raw else ''

                deleg = resolver_delegacion(territorio)
                tipo_org = resolver_tipo(nombre_org)

                # Verificar si ya existe (por nombre + domicilio)
                existe = OrganizacionComunitaria.all_objects.filter(
                    nombre__iexact=nombre_org
                ).first()

                if existe:
                    # Actualizar campos si está en DB
                    existe.domicilio_legal = domicilio or existe.domicilio_legal
                    existe.territorio = territorio or existe.territorio
                    existe.socios_activos = socios_num if socios_num > 0 else existe.socios_activos
                    existe.delegacion = deleg
                    existe.deleted_at = None
                    existe.save()
                    orgs_ya_existentes += 1
                else:
                    OrganizacionComunitaria.objects.create(
                        nombre=nombre_org,
                        tipo_organizacion=tipo_org,
                        domicilio_legal=domicilio,
                        delegacion=deleg,
                        territorio=territorio,
                        socios_activos=socios_num,
                        fecha_constitucion=fecha_const,
                        numero_registro_pj=num_pj,
                        fecha_inscripcion_registro=fecha_insc,
                        registro_directiva_numero=reg_dir,
                        estado='Activa'
                    )
                    orgs_creadas += 1

            wb_jjvv.close()
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ Organizaciones: {orgs_creadas} creadas, {orgs_ya_existentes} actualizadas "
                f"(total en DB: {OrganizacionComunitaria.objects.count()})"
            ))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  ⚠ Error importando JJVV xlsx: {exc}"))

        # ------------------------------------------------------------------
        # 9. VECINOS ADICIONALES (con nombres estructurados y cuentas ciudadanas VEC-)
        # ------------------------------------------------------------------
        self.stdout.write("▶ Creando vecinos adicionales y cuentas ciudadanas...")

        def _slug_ascii(txt):
            norm = unicodedata.normalize('NFKD', (txt or '').strip().lower())
            cleaned = ''.join(c for c in norm if not unicodedata.combining(c))
            return re.sub(r'[^a-z0-9]+', '', cleaned)

        nombres_pool = [
            ('Alejandra', 'Muñoz'), ('Carlos', 'Espinoza'), ('Diana', 'Flores'),
            ('Eduardo', 'Reyes'), ('Fernanda', 'Soto'), ('Gustavo', 'Vásquez'),
            ('Helena', 'Morales'), ('Ignacio', 'Castro'), ('Javiera', 'Ortiz'),
            ('Leonardo', 'Jara'), ('Marcela', 'Figueroa'), ('Nicolás', 'Ibáñez'),
            ('Olga', 'Pinto'), ('Pablo', 'Ramos'), ('Renata', 'Alvarado'),
            ('Sebastián', 'Torres'), ('Tamara', 'Pérez'), ('Ulises', 'Bravo'),
            ('Valentina', 'Guerrero'), ('Walter', 'Silva'), ('Ximena', 'Vega'),
            ('Yolanda', 'Sepúlveda'), ('Zulema', 'Contreras'), ('Andrés', 'Núñez'),
            ('Beatriz', 'Godoy'), ('César', 'Herrera'), ('Daniela', 'López'),
        ]
        apellidos_mat_pool = ['Martínez', 'González', 'Sánchez', 'Pérez', 'Rodríguez']
        calles_pool = [
            'Calle Los Pinos', 'Av. Balmaceda', 'Pasaje El Sauce', 'Calle Prat',
            'Calle Los Álamos', 'Pasaje Los Jazmines', 'Av. Francisco de Aguirre',
            'Calle Colón', 'Calle Cordovez', 'Av. El Santo', 'Calle Los Arrayanes',
            'Pasaje La Cantera', 'Av. Juan XXIII', 'Calle Larraín Alcalde',
        ]
        delegaciones_list = [del_centro, del_norte, del_sur, del_rural]
        sectores_list = list(sectores_dict.values())

        vecinos_existentes = Vecino.objects.count()
        vecinos_a_crear = max(0, 60 - vecinos_existentes)

        for i in range(vecinos_a_crear):
            nombre_tuple = random.choice(nombres_pool)
            pn_v = nombre_tuple[0]
            ap_v = nombre_tuple[1]
            am_v = random.choice(apellidos_mat_pool)
            nombre_v = f"{pn_v} {ap_v} {am_v}"
            calle_v = random.choice(calles_pool)
            num_v = random.randint(10, 2000)
            dir_v = f"{calle_v} {num_v}"
            del_v = random.choice(delegaciones_list)
            sec_v = random.choice([s for s in sectores_list if s.delegacion == del_v] or [None])
            tel_v = f"+56 9 {random.randint(1000,9999)} {random.randint(1000,9999)}"
            rut_v = gen_rut()
            Vecino.objects.create(
                rut=rut_v,
                nombre=nombre_v,
                primer_nombre=pn_v,
                segundo_nombre='',
                apellido_paterno=ap_v,
                apellido_materno=am_v,
                direccion=dir_v,
                telefono=tel_v,
                delegacion=del_v,
                sector=sec_v,
                territorio=sec_v.nombre if sec_v else del_v.nombre,
                tipo_gestion=random.choice([tg_sol, tg_rec]),
                estado='Activo',
            )

        hashed_cliente_pwd = make_password('Cliente1234!')
        for v_item in Vecino.objects.select_related('delegacion', 'sector').all():
            pn_v, sn_v, ap_v, am_v = v_item.get_partes_nombre()
            if not v_item.primer_nombre or not v_item.apellido_paterno:
                v_item.primer_nombre = pn_v
                v_item.segundo_nombre = sn_v
                v_item.apellido_paterno = ap_v
                v_item.apellido_materno = am_v
                v_item.save(update_fields=[
                    'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'updated_at'
                ])

            if v_item.id in (v_cliente1.id, v_cliente2.id) or not v_item.rut:
                continue

            clean_rut_v = ''.join(ch for ch in v_item.rut.upper() if ch.isalnum())
            ident_v = f"VEC-{clean_rut_v}"[:20]
            func_v = Funcionario.all_objects.select_related('user').filter(
                identificador_institucional=ident_v
            ).first()
            if not func_v:
                correo_v = f"{_slug_ascii(pn_v) or 'vecino'}.{_slug_ascii(ap_v) or 'user'}.{v_item.id}@vecino.cl"
                u_v, created_u = User.objects.get_or_create(
                    username=v_item.rut,
                    defaults={
                        'email': correo_v,
                        'first_name': v_item.nombre[:150],
                        'password': hashed_cliente_pwd,
                        'is_staff': False,
                        'is_active': True,
                    },
                )
                if created_u:
                    u_v.password = hashed_cliente_pwd
                    u_v.save(update_fields=['password'])
                func_v = Funcionario.all_objects.create(
                    user=u_v,
                    identificador_institucional=ident_v,
                    primer_nombre=pn_v[:50],
                    segundo_nombre=sn_v[:50],
                    apellido_paterno=ap_v[:50],
                    apellido_materno=am_v[:50],
                    rut=v_item.rut,
                    delegacion=v_item.delegacion,
                    cargo=cargo_ciudadano,
                    telefono=(v_item.telefono or '')[:20],
                    estado='Activo',
                    debe_cambiar_contrasena=False,
                )
                FuncionarioRol.objects.get_or_create(funcionario=func_v, rol=rol_cliente)

        # ------------------------------------------------------------------
        # 9.5 ORGANIZACIONES DESTACADAS CON DIRECTIVA (VECINOS) Y CUENTA PORTAL (ORG-)
        # ------------------------------------------------------------------
        self.stdout.write("▶ Configurando Juntas de Vecinos con directiva, cuentas portal ORG- y registros...")
        vecinos_por_del = {
            d.id: list(Vecino.objects.filter(delegacion=d, estado='Activo').order_by('id'))
            for d in delegaciones_list
        }
        vecinos_fallback = list(Vecino.objects.filter(estado='Activo').order_by('id'))

        def _correo_vecino(v_obj):
            clean_r = ''.join(ch for ch in (v_obj.rut or '').upper() if ch.isalnum())
            ident = f"VEC-{clean_r}"[:20]
            fv = Funcionario.all_objects.select_related('user').filter(identificador_institucional=ident).first()
            if fv and fv.user.email:
                return fv.user.email
            if v_obj.rut == '12.345.678-9':
                return 'cliente1@vecino.cl'
            if v_obj.rut == '9.876.543-2':
                return 'cliente2@vecino.cl'
            return f"vecino.{v_obj.id}@vecino.cl"

        def _nombre_corto_vec(v_obj):
            p_n, _s_n, a_p, _a_m = v_obj.get_partes_nombre()
            return ' '.join(p for p in (p_n, a_p) if p).strip() or v_obj.nombre

        demo_orgs_spec = [
            ('JJVV N° 1 Casco Histórico', del_centro, sectores_dict.get('SEC-CEN01'), formatear_rut(65111001), 'jjvv.centro@organizacion.cl', 'PJ-1001', 'DIR-2026-01', 'Av. Balmaceda 320'),
            ('JJVV N° 12 Las Compañías', del_norte, sectores_dict.get('SEC-NOR01'), formatear_rut(65111002), 'jjvv.norte@organizacion.cl', 'PJ-1002', 'DIR-2026-02', 'Av. Viña del Mar 480'),
            ('JJVV El Milagro I', del_sur, sectores_dict.get('SEC-SUR02'), formatear_rut(65111003), 'jjvv.sur@organizacion.cl', 'PJ-1003', 'DIR-2026-03', 'Av. Cuatro Esquinas 910'),
            ('JJVV Algarrobito', del_rural, sectores_dict.get('SEC-RUR01'), formatear_rut(65111004), 'jjvv.rural@organizacion.cl', 'PJ-1004', 'DIR-2026-04', 'Camino Elqui Km 12'),
        ]

        hoy = timezone.localdate()
        for idx_o, (nom_o, del_o, sec_o, rut_o, email_o, pj_o, dir_o, dom_o) in enumerate(demo_orgs_spec, start=1):
            pool_o = vecinos_por_del.get(del_o.id) or vecinos_fallback
            if len(pool_o) < 3:
                pool_o = vecinos_fallback
            v_pres = pool_o[0] if len(pool_o) >= 1 else v_cliente1
            v_tes = pool_o[1] if len(pool_o) >= 2 else v_pres
            v_sec = pool_o[2] if len(pool_o) >= 3 else v_pres

            org_demo, _ = OrganizacionComunitaria.all_objects.get_or_create(
                nombre=nom_o,
                defaults={
                    'tipo_organizacion': 'Junta de Vecinos',
                    'domicilio_legal': dom_o,
                    'delegacion': del_o,
                    'sector': sec_o,
                    'territorio': sec_o.nombre if sec_o else del_o.nombre,
                    'socios_activos': 45 + (idx_o * 10),
                    'fecha_constitucion': datetime.date(2015, 5, 10 + idx_o),
                    'fecha_inscripcion_registro': hoy,
                    'numero_registro_pj': pj_o,
                    'personalidad_juridica': pj_o,
                    'registro_directiva_numero': dir_o,
                    'rut': rut_o,
                    'estado': 'Activa',
                },
            )
            org_demo.tipo_organizacion = 'Junta de Vecinos'
            org_demo.domicilio_legal = org_demo.domicilio_legal or dom_o
            org_demo.delegacion = del_o
            org_demo.sector = sec_o
            org_demo.territorio = sec_o.nombre if sec_o else del_o.nombre
            org_demo.numero_registro_pj = pj_o
            org_demo.personalidad_juridica = pj_o
            org_demo.registro_directiva_numero = dir_o
            org_demo.fecha_constitucion = org_demo.fecha_constitucion or datetime.date(2015, 5, 10 + idx_o)
            org_demo.fecha_inscripcion_registro = org_demo.fecha_inscripcion_registro or hoy
            org_demo.rut = rut_o
            org_demo.contacto_prioritario = 'presidente'
            org_demo.presidente_nombre = _nombre_corto_vec(v_pres)
            org_demo.presidente_rut = v_pres.rut
            org_demo.presidente_telefono = v_pres.telefono
            org_demo.presidente_correo = _correo_vecino(v_pres)
            org_demo.tesorero_nombre = _nombre_corto_vec(v_tes)
            org_demo.tesorero_rut = v_tes.rut
            org_demo.tesorero_telefono = v_tes.telefono
            org_demo.tesorero_correo = _correo_vecino(v_tes)
            org_demo.secretario_nombre = _nombre_corto_vec(v_sec)
            org_demo.secretario_rut = v_sec.rut
            org_demo.secretario_telefono = v_sec.telefono
            org_demo.secretario_correo = _correo_vecino(v_sec)
            org_demo.representante_legal = org_demo.presidente_nombre
            org_demo.telefono_contacto = org_demo.presidente_telefono
            org_demo.email_contacto = email_o
            org_demo.estado = 'Activa'
            org_demo.deleted_at = None
            org_demo.save()

            ident_org = f"ORG-{org_demo.id:05d}"[:20]
            func_org = Funcionario.all_objects.select_related('user').filter(
                identificador_institucional=ident_org
            ).first()
            if not func_org:
                u_org, created_uo = User.objects.get_or_create(
                    username=rut_o,
                    defaults={
                        'email': email_o,
                        'first_name': org_demo.nombre[:150],
                        'password': hashed_cliente_pwd,
                        'is_staff': False,
                        'is_active': True,
                    },
                )
                if created_uo:
                    u_org.password = hashed_cliente_pwd
                    u_org.save(update_fields=['password'])
                func_org = Funcionario.all_objects.create(
                    user=u_org,
                    identificador_institucional=ident_org,
                    rut=rut_o,
                    delegacion=del_o,
                    cargo=cargo_org,
                    telefono=(org_demo.telefono_contacto or '')[:20],
                    estado='Activo',
                    debe_cambiar_contrasena=False,
                )
                FuncionarioRol.objects.get_or_create(funcionario=func_org, rol=rol_cliente)
            else:
                func_org.user.first_name = org_demo.nombre[:150]
                func_org.user.email = email_o
                func_org.user.is_active = True
                func_org.user.save(update_fields=['first_name', 'email', 'is_active'])
                func_org.rut = rut_o
                func_org.telefono = (org_demo.telefono_contacto or '')[:20]
                func_org.delegacion = del_o
                func_org.debe_cambiar_contrasena = False
                func_org.deleted_at = None
                func_org.save()
                FuncionarioRol.objects.get_or_create(funcionario=func_org, rol=rol_cliente)

            AtencionCiudadana.all_objects.get_or_create(
                codigo_atencion=f"AT-ORG-{idx_o:05d}",
                defaults={
                    'solicitante': f"{org_demo.nombre} ({org_demo.tipo_organizacion})"[:150],
                    'organizacion': org_demo,
                    'delegacion': del_o,
                    'tipo_atencion': ta_default,
                    'sub_atencion': sa_default,
                    'descripcion': f"Mejoramiento de sede social y luminarias para {org_demo.nombre}.",
                    'avance_observaciones': 'En evaluación técnica por equipo territorial.',
                    'area_apoyo': 'SECPLAN / Obras',
                    'origen': 'EXT',
                    'fecha_compromiso': hoy + datetime.timedelta(days=15),
                    'va_a_tubo': True,
                    'usuario_responsable': u_editor or u_admin_sys,
                    'creado_por': u_editor or u_admin_sys,
                    'estado': 'En proceso',
                },
            )
            if not CompromisoAgenda.objects.filter(organizacion=org_demo).exists():
                CompromisoAgenda.objects.create(
                    delegacion=del_o,
                    sector=sec_o,
                    organizacion=org_demo,
                    origen='EXT',
                    solicitante=org_demo.nombre[:150],
                    territorio=sec_o.nombre if sec_o else del_o.nombre,
                    responsable=f_editor_a,
                    creado_por=u_editor or u_admin_sys,
                    area_apoyo='Operaciones Municipales',
                    fecha_comprometida=hoy + datetime.timedelta(days=20),
                    estado='Registrada',
                    observacion=f"Operativo de mantención comunitaria junto a {org_demo.nombre}.",
                )

        # ------------------------------------------------------------------
        # 10. ATENCIONES CIUDADANAS desde matriz_sgr.xlsx
        # ------------------------------------------------------------------
        self.stdout.write("▶ Importando Atenciones desde matriz territorial xlsx...")

        xlsx_sgr = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.dirname(__file__)))), 'fixtures', 'matriz_sgr.xlsx')

        estados_validos = {'Registrada', 'En proceso', 'Derivada', 'Resuelta', 'Cerrada'}
        estado_map = {
            'REALIZADO': 'Resuelta', 'COMPLETADO': 'Resuelta', 'TERMINADO': 'Resuelta',
            'EN PROCESO': 'En proceso', 'PROCESO': 'En proceso', 'PENDIENTE': 'Registrada',
            'DERIVADO': 'Derivada', 'CERRADO': 'Cerrada',
        }

        vecinos_all = list(Vecino.objects.all())
        at_creadas = 0
        at_errores = 0
        at_contador = AtencionCiudadana.objects.count()

        try:
            wb_sgr = openpyxl.load_workbook(xlsx_sgr, read_only=True, data_only=True)
            ws_sgr = wb_sgr.active

            # La fila 2 tiene cabeceras reales, datos desde fila 3
            for row_idx, row in enumerate(ws_sgr.iter_rows(min_row=3, values_only=True), start=3):
                if not row or not row[2]:
                    continue

                nro_raw        = row[0]   # N°
                fecha_raw      = row[1]   # FECHA SOLICITUD
                actividad      = row[2]   # ACTIVIDAD/SOLICITUD/PROBLEMA
                origen_raw     = row[3]   # INT EXT
                solicitante_r  = row[4]   # SOLICITANTE
                territorio_r   = row[5]   # TERRITORIO
                responsable_r  = row[6]   # RESPONSABLE
                fecha_comp_raw = row[7]   # FECHA COMPROMISO
                area_apoyo_r   = row[9]   # ÁREA/PERSONA APOYO
                avance_r       = row[10]  # AVANCE, OBSERVACIONES
                estatus_raw    = row[11]  # ESTATUS

                if not actividad:
                    continue

                descripcion = str(actividad).strip()[:1000]
                solicitante = str(solicitante_r).strip()[:150] if solicitante_r else 'Vecino/a'
                avance = str(avance_r).strip()[:1000] if avance_r else ''
                area_apoyo = str(area_apoyo_r).strip()[:80] if area_apoyo_r else ''
                origen = 'EXT' if str(origen_raw or '').upper().strip() == 'EXT' else 'INT'

                estado_str = str(estatus_raw or '').upper().strip()
                estado = estado_map.get(estado_str, 'Registrada')

                # Fecha solicitud
                fecha_solicitud = None
                if fecha_raw and isinstance(fecha_raw, datetime.datetime):
                    fecha_solicitud = fecha_raw.date()
                elif fecha_raw and isinstance(fecha_raw, datetime.date):
                    fecha_solicitud = fecha_raw

                # Fecha compromiso
                fecha_compromiso = None
                if fecha_comp_raw and isinstance(fecha_comp_raw, datetime.datetime):
                    fecha_compromiso = fecha_comp_raw.date()
                elif fecha_comp_raw and isinstance(fecha_comp_raw, datetime.date):
                    fecha_compromiso = fecha_comp_raw

                # Delegación por territorio
                deleg = resolver_delegacion(str(territorio_r or ''))

                # Tipo de atención por área/texto
                ta_obj = ta_default
                if area_apoyo_r:
                    texto_area = str(area_apoyo_r).upper()
                    for clave, ta_cand in tipos_map.items():
                        if clave in texto_area:
                            ta_obj = ta_cand
                            break

                # Código correlativo
                at_contador += 1
                codigo = f"AT-LS-{at_contador:05d}"

                # Vecino aleatorio o cliente_1
                vec_obj = random.choice(vecinos_all) if vecinos_all and random.random() > 0.3 else v_cliente1

                try:
                    at_obj, created = AtencionCiudadana.all_objects.get_or_create(
                        codigo_atencion=codigo,
                        defaults={
                            'solicitante': solicitante[:150],
                            'vecino': vec_obj,
                            'delegacion': deleg,
                            'tipo_atencion': ta_obj,
                            'sub_atencion': sa_default,
                            'descripcion': descripcion,
                            'avance_observaciones': avance,
                            'area_apoyo': area_apoyo,
                            'origen': origen,
                            'fecha_compromiso': fecha_compromiso,
                            'usuario_responsable': u_editor or u_admin_sys,
                            'creado_por': u_editor or u_admin_sys,
                            'estado': estado,
                        }
                    )
                    if created:
                        at_creadas += 1
                except Exception:
                    at_errores += 1

            wb_sgr.close()
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ Atenciones: {at_creadas} creadas, {at_errores} errores "
                f"(total en DB: {AtencionCiudadana.objects.count()})"
            ))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  ⚠ Error importando atenciones xlsx: {exc}"))

        # ------------------------------------------------------------------
        # 11. ATENCIONES ADICIONALES MASIVAS (para garantizar ≥ 2000 total)
        # ------------------------------------------------------------------
        total_at_actual = AtencionCiudadana.objects.count()
        objetivo = 2100
        if total_at_actual < objetivo:
            faltantes = objetivo - total_at_actual
            self.stdout.write(f"▶ Creando {faltantes} atenciones adicionales para alcanzar ≥{objetivo}...")

            descripciones_pool = [
                "Solicitud de inspección por acumulación de residuos en la vía pública.",
                "Requerimiento de mejora de luminaria pública en pasaje deteriorado.",
                "Consulta por programa de subsidio habitacional para adultos mayores.",
                "Denuncia por ruidos molestos en horario de descanso nocturno.",
                "Solicitud de poda de árbol peligroso en vereda.",
                "Derivación para atención médica de urgencia social.",
                "Trámite de certificado de residencia para postulación a beca.",
                "Reclamo por demora en respuesta de solicitud anterior.",
                "Consulta sobre talleres de capacitación para adultos.",
                "Solicitud de apoyo para reparación de canaleta de agua lluvia.",
                "Requerimiento de asistente social para caso familia vulnerable.",
                "Solicitud de inscripción en taller deportivo comunitario.",
                "Consulta por contaminación de canal de regadío.",
                "Denuncia de construcción irregular en sector residencial.",
                "Solicitud de mediación por conflicto vecinal.",
                "Requerimiento de apoyo para postular a bono de agua potable.",
                "Consulta sobre requisitos para organización comunitaria.",
                "Solicitud de permiso para evento cultural en plaza.",
                "Denuncia de persona en situación de calle con problemas de salud.",
                "Solicitud de apoyo para actividad de adulto mayor.",
            ]
            estados_pool = ['Registrada', 'En proceso', 'Resuelta', 'Derivada']
            origenes_pool = ['INT', 'EXT']
            at_contador_extra = AtencionCiudadana.all_objects.count()

            for i in range(faltantes):
                at_contador_extra += 1
                codigo = f"AT-BULK-{at_contador_extra:05d}"
                deleg = random.choice(delegaciones_list)
                ta_obj = random.choice(list(tipos_map.values())) if tipos_map else ta_default
                vec_obj = random.choice(vecinos_all) if vecinos_all else v_cliente1
                descripcion = random.choice(descripciones_pool)
                estado = random.choice(estados_pool)
                origen = random.choice(origenes_pool)
                dias_atras = random.randint(0, 365)
                fecha_at = datetime.date.today() - datetime.timedelta(days=dias_atras)

                try:
                    AtencionCiudadana.objects.create(
                        codigo_atencion=codigo,
                        solicitante=vec_obj.nombre[:150] if vec_obj else 'Vecino/a',
                        vecino=vec_obj,
                        delegacion=deleg,
                        tipo_atencion=ta_obj,
                        sub_atencion=sa_default,
                        descripcion=descripcion,
                        origen=origen,
                        usuario_responsable=u_editor or u_admin_sys,
                        creado_por=u_editor or u_admin_sys,
                        estado=estado,
                    )
                except Exception:
                    pass

            self.stdout.write(self.style.SUCCESS(
                f"  ✓ Total atenciones en DB: {AtencionCiudadana.objects.count()}"
            ))

        # ------------------------------------------------------------------
        # RESUMEN FINAL
        # ------------------------------------------------------------------
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ SEED COMPLETADO EXITOSAMENTE"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"  OrganizacionesComunitarias: {OrganizacionComunitaria.objects.count()}")
        self.stdout.write(f"  Vecinos:                    {Vecino.objects.count()}")
        self.stdout.write(f"  Atenciones Ciudadanas:      {AtencionCiudadana.objects.count()}")
        self.stdout.write(f"  Usuarios:                   {User.objects.count()}")
        self.stdout.write("\n" + "─" * 60)
        self.stdout.write("🔑 CUENTAS DE EVALUACIÓN (6 cuentas requeridas):")
        self.stdout.write("─" * 60)
        self.stdout.write("  ➊ admin_a      | Admin1234!   | Administrador   | Delegación Centro")
        self.stdout.write("  ➋ editor_a     | Editor1234!  | Operador/Editor | Delegación Centro")
        self.stdout.write("  ➌ lector_a     | Lector1234!  | Consultor       | Delegación Centro")
        self.stdout.write("  ➍ lector_b     | Lector1234!  | Consultor       | Delegación Norte")
        self.stdout.write("  ➎ cliente_1    | Cliente1234! | Cliente/Vecino  | Portal Ciudadano")
        self.stdout.write("  ➏ cliente_2    | Cliente1234! | Cliente/Vecino  | Portal Ciudadano")
        self.stdout.write("─" * 60)
        self.stdout.write("🔑 CUENTAS DE ORGANIZACIÓN / JJVV (Portal Organización):")
        self.stdout.write(f"  {formatear_rut(65111001)} / jjvv.centro@organizacion.cl | Cliente1234! | JJVV N° 1 Casco Histórico")
        self.stdout.write(f"  {formatear_rut(65111002)} / jjvv.norte@organizacion.cl  | Cliente1234! | JJVV N° 12 Las Compañías")
        self.stdout.write("─" * 60)
        self.stdout.write("🔑 CUENTAS ADICIONALES DE OPERACIÓN:")
        self.stdout.write("  admin_sgr         | Admin1234!   | Superadmin Global")
        self.stdout.write("  delegado_centro   | User1234!    | Delegado Centro")
        self.stdout.write("  delegado_companias| User1234!    | Delegado Norte")
        self.stdout.write("  delegado_sur      | User1234!    | Delegado Sur")
        self.stdout.write("  delegado_rural    | User1234!    | Delegado Rural")
        self.stdout.write("  funcionario_juan  | User1234!    | Operador Centro")
        self.stdout.write("  consultor_ana     | User1234!    | Consultor Centro")
        self.stdout.write("=" * 60)
