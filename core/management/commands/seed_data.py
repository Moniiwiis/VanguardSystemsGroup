from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Permission
from django.utils import timezone
import datetime
from accounts.models import Delegacion, Cargo, Funcionario, Rol, FuncionarioRol, Sector
from configuration.models import (
    Periodo, CatalogoActividad, ItemMedicion, ConfiguracionMeta,
    TipoAtencion, SubAtencion
)
from activities.models import (
    Actividad, Evidencia, ValidacionEvidencia, AtencionSocialGestion,
    TipoGestion, Vecino, AtencionCiudadana
)
from agenda.models import CompromisoAgenda, AjusteDesempenio

class Command(BaseCommand):
    help = 'Puebla la base de datos con información demostrativa reproducible según requerimientos de Segunda Evaluación SGR'

    def handle(self, *args, **options):
        self.stdout.write("Cargando datos semillas completos en la base de datos SGR...")

        def assign_role(func, rol):
            fr = FuncionarioRol.all_objects.filter(funcionario=func, rol=rol).first()
            if fr:
                fr.deleted_at = None
                fr.save()
            else:
                FuncionarioRol.objects.create(funcionario=func, rol=rol)

        # 1. Delegaciones Municipales (Wireframe C3)
        del_centro, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Centro",
            defaults={'codigo': 'DEL01', 'direccion': 'Los Carrera 301', 'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Urbano Central'}
        )
        del_centro.codigo = 'DEL01'
        del_centro.comuna = 'La Serena'
        del_centro.direccion = 'Los Carrera 301'
        del_centro.estado = 'Activa'
        del_centro.deleted_at = None
        del_centro.save()

        del_norte, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Norte",
            defaults={'codigo': 'DEL02', 'direccion': 'Av. Las Compañías 450', 'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Sector Norte'}
        )
        del_norte.codigo = 'DEL02'
        del_norte.comuna = 'La Serena'
        del_norte.direccion = 'Av. Las Compañías 450'
        del_norte.estado = 'Activa'
        del_norte.deleted_at = None
        del_norte.save()

        del_sur, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Sur",
            defaults={'codigo': 'DEL03', 'direccion': 'Av. Cuatro Esquinas 890', 'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Sector Sur'}
        )
        del_sur.codigo = 'DEL03'
        del_sur.comuna = 'La Serena'
        del_sur.direccion = 'Av. Cuatro Esquinas 890'
        del_sur.estado = 'Activa'
        del_sur.deleted_at = None
        del_sur.save()

        del_rural, _ = Delegacion.all_objects.get_or_create(
            nombre="Delegación Rural",
            defaults={'codigo': 'DEL04', 'direccion': 'Camino Elqui Km 12', 'comuna': 'La Serena', 'estado': 'Activa', 'ambito': 'Valle de Elqui'}
        )
        del_rural.codigo = 'DEL04'
        del_rural.comuna = 'La Serena'
        del_rural.direccion = 'Camino Elqui Km 12'
        del_rural.estado = 'Activa'
        del_rural.deleted_at = None
        del_rural.save()

        # 1.1 Sectores Territoriales por Delegación
        sectores_data = [
            # Centro
            ('SEC-CEN01', 'Casco Histórico', del_centro, 'Sector fundacional, Plaza de Armas y La Recova'),
            ('SEC-CEN02', 'Balmaceda y Estadio', del_centro, 'Eje comercial y deportivo'),
            ('SEC-CEN03', 'La Florida y El Pino', del_centro, 'Sectores residenciales tradicionales del centro alto'),
            ('SEC-CEN04', 'Caleta San Pedro', del_centro, 'Borde costero y caleta de pescadores'),
            ('SEC-CEN05', 'Costanera y Av. del Mar', del_centro, 'Franja turística y residencial costera'),
            # Norte (Las Compañías)
            ('SEC-NOR01', 'Compañía Alta', del_norte, 'Población Juan Soldado y El Romero norte'),
            ('SEC-NOR02', 'Compañía Baja', del_norte, 'Sindicato, Villa Las Rosas y ribera río Elqui'),
            ('SEC-NOR03', 'Villa Lambert y Parque Islon', del_norte, 'Área residencial y equipamiento comunitario'),
            ('SEC-NOR04', 'Villa Los Aromos', del_norte, 'Sector residencial oriente de Las Compañías'),
            ('SEC-NOR05', 'El Romero Urbano', del_norte, 'Poblaciones de expansión norte'),
            # Sur (La Pampa / El Milagro)
            ('SEC-SUR01', 'San Joaquín', del_sur, 'Barrio residencial consolidado'),
            ('SEC-SUR02', 'El Milagro I y II', del_sur, 'Sectores residenciales de crecimiento sur-oriente'),
            ('SEC-SUR03', 'La Pampa Tradicional', del_sur, 'Eje Cuatro Esquinas y Larraín Alcalde'),
            ('SEC-SUR04', 'Barrio Universitario', del_sur, 'Zona universitaria y residencias'),
            ('SEC-SUR05', 'Colina El Pino Sur', del_sur, 'Límite sur urbano'),
            # Rural
            ('SEC-RUR01', 'Algarrobito', del_rural, 'Localidad rural tradicional Valle del Elqui'),
            ('SEC-RUR02', 'Altovalsol', del_rural, 'Comunidad agrícola y villorrios rurales'),
            ('SEC-RUR03', 'Las Rojas', del_rural, 'Poblado rural histórico'),
            ('SEC-RUR04', 'Lambert Rural', del_rural, 'Comunidad minera y agrícola tradicional'),
            ('SEC-RUR05', 'Pelícana y Quebrada de Talca', del_rural, 'Sectores rurales del interior'),
        ]
        sectores_dict = {}
        for cod, nom, del_obj, desc in sectores_data:
            sec, _ = Sector.all_objects.get_or_create(
                codigo=cod,
                defaults={'nombre': nom, 'delegacion': del_obj, 'descripcion': desc, 'estado': 'Activo'}
            )
            sec.nombre = nom
            sec.delegacion = del_obj
            sec.descripcion = desc
            sec.estado = 'Activo'
            sec.deleted_at = None
            sec.save()
            sectores_dict[cod] = sec

        # 2. Roles (Wireframe C3)
        rol_admin, _ = Rol.all_objects.get_or_create(
            nombre_rol="Administrador",
            defaults={'codigo': 'ROL01', 'alcance': 'Autorizado', 'estado': 'Activo', 'descripcion': 'Acceso total y configuración de todo el sistema municipal.'}
        )
        rol_admin.codigo = 'ROL01'
        rol_admin.alcance = 'Autorizado'
        rol_admin.estado = 'Activo'
        rol_admin.descripcion = 'Acceso total y configuración de todo el sistema municipal.'
        rol_admin.deleted_at = None
        rol_admin.save()

        rol_operador, _ = Rol.all_objects.get_or_create(
            nombre_rol="Operador",
            defaults={'codigo': 'ROL02', 'alcance': 'Delegación', 'estado': 'Activo', 'descripcion': 'Ingreso y atención ciudadana en su delegación.'}
        )
        rol_operador.codigo = 'ROL02'
        rol_operador.alcance = 'Delegación'
        rol_operador.estado = 'Activo'
        rol_operador.descripcion = 'Ingreso y atención ciudadana en su delegación.'
        rol_operador.deleted_at = None
        rol_operador.save()

        rol_consultor, _ = Rol.all_objects.get_or_create(
            nombre_rol="Consultor",
            defaults={'codigo': 'ROL03', 'alcance': 'Lectura', 'estado': 'Activo', 'descripcion': 'Consulta y seguimiento en modo solo lectura.'}
        )
        rol_consultor.codigo = 'ROL03'
        rol_consultor.alcance = 'Lectura'
        rol_consultor.estado = 'Activo'
        rol_consultor.descripcion = 'Consulta y seguimiento en modo solo lectura.'
        rol_consultor.deleted_at = None
        rol_consultor.save()

        rol_coord, _ = Rol.all_objects.get_or_create(
            nombre_rol="Coordinador",
            defaults={'codigo': 'ROL04', 'alcance': 'Autorizado', 'estado': 'Activo', 'descripcion': 'Supervisión de metas, tipos de atención y reportes territoriales.'}
        )
        rol_coord.codigo = 'ROL04'
        rol_coord.alcance = 'Autorizado'
        rol_coord.estado = 'Activo'
        rol_coord.descripcion = 'Supervisión de metas, tipos de atención y reportes territoriales.'
        rol_coord.deleted_at = None
        rol_coord.save()

        rol_delegado, _ = Rol.all_objects.get_or_create(
            nombre_rol="Delegado Municipal",
            defaults={'codigo': 'ROL05', 'alcance': 'Delegación', 'estado': 'Activo', 'descripcion': 'Gestión directiva de usuarios y atenciones en su delegación.'}
        )
        rol_delegado.codigo = 'ROL05'
        rol_delegado.alcance = 'Delegación'
        rol_delegado.estado = 'Activo'
        rol_delegado.descripcion = 'Gestión directiva de usuarios y atenciones en su delegación.'
        rol_delegado.deleted_at = None
        rol_delegado.save()

        # 3. Cargos
        cargo_gestor, _ = Cargo.all_objects.get_or_create(
            nombre_cargo="Gestor Social",
            defaults={'descripcion': 'Atención y derivación de requerimientos sociales vecinales.'}
        )
        cargo_coord, _ = Cargo.all_objects.get_or_create(
            nombre_cargo="Coordinador Territorial",
            defaults={'descripcion': 'Supervisión de compromisos e intervenciones comunitarias.'}
        )
        cargo_inspector, _ = Cargo.all_objects.get_or_create(
            nombre_cargo="Inspector Municipal",
            defaults={'descripcion': 'Fiscalización y respuesta a denuncias urbanas.'}
        )

        # 4. Usuarios y Funcionarios de Prueba
        all_perms = Permission.objects.filter(
            content_type__app_label__in=['accounts', 'activities', 'agenda', 'configuration', 'analytics']
        )

        # a) Superadministrador (Ámbito Global Comunal)
        u_admin, _ = User.objects.get_or_create(
            username="admin_sgr",
            defaults={'email': "admin@laserena.cl", 'first_name': "Administrador General", 'is_staff': True, 'is_superuser': True}
        )
        u_admin.first_name = "Administrador General"
        u_admin.email = "admin@laserena.cl"
        u_admin.set_password("Admin1234!")
        u_admin.is_active = True
        u_admin.save()
        f_admin, _ = Funcionario.all_objects.get_or_create(
            user=u_admin,
            defaults={'identificador_institucional': "ADM-001", 'delegacion': None, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_admin.delegacion = None
        f_admin.deleted_at = None
        f_admin.save()
        assign_role(f_admin, rol_admin)

        # Si existe el usuario 'admin' en la base local, configurarlo también como Global
        u_admin_local = User.objects.filter(username="admin").first()
        if u_admin_local:
            f_admin_local = Funcionario.all_objects.filter(user=u_admin_local).first()
            if f_admin_local:
                f_admin_local.delegacion = None
                f_admin_local.save()

        # b) Coordinador General
        u_coord, _ = User.objects.get_or_create(
            username="coordinador_sgr",
            defaults={'email': "coordinador@laserena.cl", 'first_name': "Patricia Morales", 'is_staff': True, 'is_superuser': False}
        )
        u_coord.first_name = "Patricia Morales"
        u_coord.email = "coordinador@laserena.cl"
        u_coord.set_password("User1234!")
        u_coord.is_active = True
        u_coord.save()
        u_coord.user_permissions.set(all_perms)
        f_coord, _ = Funcionario.all_objects.get_or_create(
            user=u_coord,
            defaults={'identificador_institucional': "COO-001", 'delegacion': del_centro, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_coord.delegacion = del_centro
        f_coord.deleted_at = None
        f_coord.save()
        assign_role(f_coord, rol_coord)

        # c) Delegado Centro
        u_centro, _ = User.objects.get_or_create(
            username="delegado_centro",
            defaults={'email': "delegado.centro@laserena.cl", 'first_name': "Carlos Mendoza", 'is_staff': True, 'is_superuser': False}
        )
        u_centro.first_name = "Carlos Mendoza"
        u_centro.email = "delegado.centro@laserena.cl"
        u_centro.set_password("User1234!")
        u_centro.is_active = True
        u_centro.save()
        u_centro.user_permissions.set(all_perms)
        f_centro, _ = Funcionario.all_objects.get_or_create(
            user=u_centro,
            defaults={'identificador_institucional': "DEL-001", 'delegacion': del_centro, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_centro.delegacion = del_centro
        f_centro.deleted_at = None
        f_centro.save()
        assign_role(f_centro, rol_delegado)

        # d) Delegado Las Compañías (Norte)
        u_comp, _ = User.objects.get_or_create(
            username="delegado_companias",
            defaults={'email': "delegado.companias@laserena.cl", 'first_name': "María Rojas", 'is_staff': True, 'is_superuser': False}
        )
        u_comp.first_name = "María Rojas"
        u_comp.email = "delegado.companias@laserena.cl"
        u_comp.set_password("User1234!")
        u_comp.is_active = True
        u_comp.save()
        u_comp.user_permissions.set(all_perms)
        f_comp, _ = Funcionario.all_objects.get_or_create(
            user=u_comp,
            defaults={'identificador_institucional': "DEL-002", 'delegacion': del_norte, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_comp.delegacion = del_norte
        f_comp.deleted_at = None
        f_comp.save()
        assign_role(f_comp, rol_delegado)

        # e) Funcionario / Operador Juan
        u_juan, _ = User.objects.get_or_create(
            username="funcionario_juan",
            defaults={'email': "juan.perez@laserena.cl", 'first_name': "Juan Pérez", 'is_staff': True, 'is_superuser': False}
        )
        u_juan.first_name = "Juan Pérez"
        u_juan.email = "juan.perez@laserena.cl"
        u_juan.set_password("User1234!")
        u_juan.is_active = True
        u_juan.save()
        u_juan.user_permissions.set(all_perms)
        f_juan, _ = Funcionario.all_objects.get_or_create(
            user=u_juan,
            defaults={'identificador_institucional': "FUN-101", 'delegacion': del_centro, 'cargo': cargo_gestor, 'estado': "Activo"}
        )
        f_juan.delegacion = del_centro
        f_juan.deleted_at = None
        f_juan.save()
        assign_role(f_juan, rol_operador)

        # f) Consultor Ana
        u_ana, _ = User.objects.get_or_create(
            username="consultor_ana",
            defaults={'email': "ana.ejemplo@laserena.cl", 'first_name': "Ana Ejemplo", 'is_staff': False, 'is_superuser': False}
        )
        u_ana.first_name = "Ana Ejemplo"
        u_ana.email = "ana.ejemplo@laserena.cl"
        u_ana.set_password("User1234!")
        u_ana.is_active = True
        u_ana.save()
        f_ana, _ = Funcionario.all_objects.get_or_create(
            user=u_ana,
            defaults={'identificador_institucional': "CON-201", 'delegacion': del_centro, 'cargo': cargo_inspector, 'estado': "Activo"}
        )
        f_ana.delegacion = del_centro
        f_ana.deleted_at = None
        f_ana.save()
        assign_role(f_ana, rol_consultor)

        # g) Delegado Sur
        u_sur, _ = User.objects.get_or_create(
            username="delegado_sur",
            defaults={'email': "delegado.sur@laserena.cl", 'first_name': "Gonzalo Herrera", 'is_staff': True, 'is_superuser': False}
        )
        u_sur.first_name = "Gonzalo Herrera"
        u_sur.email = "delegado.sur@laserena.cl"
        u_sur.set_password("User1234!")
        u_sur.is_active = True
        u_sur.save()
        u_sur.user_permissions.set(all_perms)
        f_sur, _ = Funcionario.all_objects.get_or_create(
            user=u_sur,
            defaults={'identificador_institucional': "DEL-003", 'delegacion': del_sur, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_sur.delegacion = del_sur
        f_sur.deleted_at = None
        f_sur.save()
        assign_role(f_sur, rol_delegado)

        # h) Delegado Rural
        u_rural, _ = User.objects.get_or_create(
            username="delegado_rural",
            defaults={'email': "delegado.rural@laserena.cl", 'first_name': "Patricia Vega", 'is_staff': True, 'is_superuser': False}
        )
        u_rural.first_name = "Patricia Vega"
        u_rural.email = "delegado.rural@laserena.cl"
        u_rural.set_password("User1234!")
        u_rural.is_active = True
        u_rural.save()
        u_rural.user_permissions.set(all_perms)
        f_rural, _ = Funcionario.all_objects.get_or_create(
            user=u_rural,
            defaults={'identificador_institucional': "DEL-004", 'delegacion': del_rural, 'cargo': cargo_coord, 'estado': "Activo"}
        )
        f_rural.delegacion = del_rural
        f_rural.deleted_at = None
        f_rural.save()
        assign_role(f_rural, rol_delegado)

        # 5. Período
        periodo_actual, _ = Periodo.all_objects.get_or_create(
            fecha_inicio=datetime.date(2026, 7, 1),
            fecha_termino=datetime.date(2026, 9, 30),
            defaults={'dias_computables': 91, 'estado': 'Abierto'}
        )
        periodo_actual.deleted_at = None
        periodo_actual.save()

        # 6. Catálogo Actividad
        cat_social, _ = CatalogoActividad.all_objects.get_or_create(
            tipo_actividad="Atención Social",
            servicio="Asistencia Vecinal Directa",
            defaults={'tipo_atencion': 'Presencial', 'subtipo_atencion': 'Registro Ficha Familiar', 'estado': 'Activo'}
        )
        cat_terr, _ = CatalogoActividad.all_objects.get_or_create(
            tipo_actividad="Operativo Territorial",
            servicio="Limpieza y Desmalezado",
            defaults={'tipo_atencion': 'Terreno', 'subtipo_atencion': 'Intervención Comunitaria', 'estado': 'Activo'}
        )

        # 7. Ítems y metas (Wireframe C4)
        item1, _ = ItemMedicion.all_objects.get_or_create(
            nombre_item="Cobertura",
            defaults={'codigo': 'IT001', 'descripcion': 'Atenciones', 'unidad_medida': 'Atenciones', 'cargo': cargo_gestor, 'catalogo': cat_social, 'estado': 'Activo'}
        )
        item1.codigo = 'IT001'
        item1.descripcion = 'Atenciones'
        item1.estado = 'Activo'
        item1.deleted_at = None
        item1.save()

        item2, _ = ItemMedicion.all_objects.get_or_create(
            nombre_item="Satisfacción",
            defaults={'codigo': 'IT002', 'descripcion': 'Experiencia', 'unidad_medida': '%', 'cargo': cargo_coord, 'catalogo': cat_terr, 'estado': 'Activo'}
        )
        item2.codigo = 'IT002'
        item2.descripcion = 'Experiencia'
        item2.estado = 'Activo'
        item2.deleted_at = None
        item2.save()

        item3, _ = ItemMedicion.all_objects.get_or_create(
            nombre_item="Tiempos",
            defaults={'codigo': 'IT003', 'descripcion': 'Respuesta', 'unidad_medida': 'Horas', 'cargo': cargo_inspector, 'catalogo': cat_social, 'estado': 'Activo'}
        )
        item3.codigo = 'IT003'
        item3.descripcion = 'Respuesta'
        item3.estado = 'Activo'
        item3.deleted_at = None
        item3.save()

        # Configuración de metas
        meta1, _ = ConfiguracionMeta.all_objects.get_or_create(
            item=item1, periodo=periodo_actual, funcionario=f_juan,
            defaults={'valor_objetivo': 20.0, 'ponderacion': 50.0, 'umbral_minimo': 80.0, 'maximo_computable': 150.0}
        )
        meta1.deleted_at = None
        meta1.save()

        meta2, _ = ConfiguracionMeta.all_objects.get_or_create(
            item=item2, periodo=periodo_actual, funcionario=f_comp,
            defaults={'valor_objetivo': 10.0, 'ponderacion': 50.0, 'umbral_minimo': 80.0, 'maximo_computable': 150.0}
        )
        meta2.deleted_at = None
        meta2.save()

        # 8. Tipo de Atención (Wireframe C5)
        ta_social, _ = TipoAtencion.all_objects.get_or_create(
            nombre="Social",
            defaults={'codigo': 'TA001', 'descripcion': 'Apoyo social', 'estado': 'Activo'}
        )
        ta_social.codigo = 'TA001'
        ta_social.descripcion = 'Apoyo social'
        ta_social.estado = 'Activo'
        ta_social.deleted_at = None
        ta_social.save()

        ta_salud, _ = TipoAtencion.all_objects.get_or_create(
            nombre="Salud",
            defaults={'codigo': 'TA002', 'descripcion': 'Orientación', 'estado': 'Activo'}
        )
        ta_salud.codigo = 'TA002'
        ta_salud.descripcion = 'Orientación'
        ta_salud.estado = 'Activo'
        ta_salud.deleted_at = None
        ta_salud.save()

        ta_educ, _ = TipoAtencion.all_objects.get_or_create(
            nombre="Educación",
            defaults={'codigo': 'TA003', 'descripcion': 'Apoyo escolar', 'estado': 'Activo'}
        )
        ta_educ.codigo = 'TA003'
        ta_educ.descripcion = 'Apoyo escolar'
        ta_educ.estado = 'Activo'
        ta_educ.deleted_at = None
        ta_educ.save()

        # 9. Sub Atención (Wireframe C5)
        sa_social, _ = SubAtencion.all_objects.get_or_create(
            nombre="Ayuda social",
            tipo_atencion=ta_social,
            defaults={'codigo': 'SA001', 'estado': 'Activa'}
        )
        sa_social.codigo = 'SA001'
        sa_social.estado = 'Activa'
        sa_social.deleted_at = None
        sa_social.save()

        sa_salud, _ = SubAtencion.all_objects.get_or_create(
            nombre="Consulta médica",
            tipo_atencion=ta_salud,
            defaults={'codigo': 'SA002', 'estado': 'Activa'}
        )
        sa_salud.codigo = 'SA002'
        sa_salud.estado = 'Activa'
        sa_salud.deleted_at = None
        sa_salud.save()

        sa_educ, _ = SubAtencion.all_objects.get_or_create(
            nombre="Beca municipal",
            tipo_atencion=ta_educ,
            defaults={'codigo': 'SA003', 'estado': 'Activa'}
        )
        sa_educ.codigo = 'SA003'
        sa_educ.estado = 'Activa'
        sa_educ.deleted_at = None
        sa_educ.save()

        # 10. Tipo de Gestión
        tg_sol, _ = TipoGestion.all_objects.get_or_create(
            nombre="Solicitud",
            defaults={'descripcion': 'Solicitudes y requerimientos directos', 'estado': 'Activo'}
        )
        tg_rec, _ = TipoGestion.all_objects.get_or_create(
            nombre="Reclamo",
            defaults={'descripcion': 'Reclamos vecinales', 'estado': 'Activo'}
        )

        # 11. Vecinos (Padrón Territorial Comunal)
        vecinos_data = [
            # Centro
            ('12.345.678-9', 'Ana González', 'Av. Balmaceda 120', '+56 9 8765 4321', del_centro, sectores_dict.get('SEC-CEN01'), tg_sol),
            ('14.892.311-K', 'Jorge Valenzuela Silva', 'Calle Prat 540', '+56 9 7812 3456', del_centro, sectores_dict.get('SEC-CEN01'), tg_sol),
            ('16.450.812-3', 'Carmen Gloria Tapia', 'Pasaje Los Naranjos 231, La Florida', '+56 9 9123 4567', del_centro, sectores_dict.get('SEC-CEN03'), tg_sol),
            ('11.782.903-4', 'Héctor Pizarro Godoy', 'Calle Pescadores 78, Caleta San Pedro', '+56 9 8234 5678', del_centro, sectores_dict.get('SEC-CEN04'), tg_rec),
            # Norte (Las Compañías)
            ('9.876.543-2', 'Pedro Rojas', "Calle O'Higgins 455", '+56 9 7654 3210', del_norte, sectores_dict.get('SEC-NOR01'), tg_rec),
            ('17.345.901-8', 'Marcela Araya Barraza', 'Av. Monjitas Oriente 1205', '+56 9 6543 2198', del_norte, sectores_dict.get('SEC-NOR02'), tg_sol),
            ('13.567.890-5', 'Guillermo Cortés Núñez', 'Pasaje La Cantera 44, Villa Lambert', '+56 9 7432 1890', del_norte, sectores_dict.get('SEC-NOR03'), tg_sol),
            ('19.012.435-6', 'Francisca Morales Díaz', 'Calle Los Aromos 312', '+56 9 8321 0987', del_norte, sectores_dict.get('SEC-NOR04'), tg_sol),
            # Sur (La Pampa / El Milagro)
            ('15.234.567-1', 'María Castillo', 'Pasaje Los Pinos 89', '+56 9 6543 2109', del_sur, sectores_dict.get('SEC-SUR01'), tg_sol),
            ('18.234.901-2', 'Rodrigo Santander Vega', 'Av. Cuatro Esquinas 1420', '+56 9 9456 7812', del_sur, sectores_dict.get('SEC-SUR03'), tg_rec),
            ('20.123.876-4', 'Camila Herrera Bravo', 'Calle Los Plátanos 650, El Milagro', '+56 9 6123 9874', del_sur, sectores_dict.get('SEC-SUR02'), tg_sol),
            # Rural
            ('10.456.789-0', 'Esteban Barraza Pastén', 'Calle Principal s/n, Algarrobito', '+56 9 7654 0981', del_rural, sectores_dict.get('SEC-RUR01'), tg_sol),
            ('12.987.654-3', 'Rosa Elena Villalobos', 'Camino Interior Parcela 14, Altovalsol', '+56 9 8543 2109', del_rural, sectores_dict.get('SEC-RUR02'), tg_sol),
            ('14.321.789-7', 'Luis Aguilera Carvajal', 'Sector La Cancha, Las Rojas', '+56 9 9876 5432', del_rural, sectores_dict.get('SEC-RUR03'), tg_rec),
        ]
        vecinos_dict = {}
        for rut_v, nom_v, dir_v, tel_v, del_v, sec_v, tg_v in vecinos_data:
            v_obj, _ = Vecino.all_objects.get_or_create(
                rut=rut_v,
                defaults={
                    'nombre': nom_v,
                    'direccion': dir_v,
                    'telefono': tel_v,
                    'delegacion': del_v,
                    'sector': sec_v,
                    'territorio': sec_v.nombre if sec_v else (del_v.nombre if del_v else 'Centro'),
                    'tipo_gestion': tg_v,
                    'estado': 'Activo'
                }
            )
            v_obj.nombre = nom_v
            v_obj.direccion = dir_v
            v_obj.telefono = tel_v
            v_obj.delegacion = del_v
            v_obj.sector = sec_v
            v_obj.territorio = sec_v.nombre if sec_v else (del_v.nombre if del_v else 'Centro')
            v_obj.tipo_gestion = tg_v
            v_obj.estado = 'Activo'
            v_obj.deleted_at = None
            v_obj.save()
            vecinos_dict[rut_v] = v_obj

        # 12. Atenciones Ciudadanas (Wireframe C6)
        atenciones_data = [
            (
                "AT-2026-0001",
                "Ana González (12.345.678-9)",
                vecinos_dict.get('12.345.678-9'),
                del_centro,
                ta_social,
                sa_social,
                "Solicitud de subsidio familiar por emergencia habitacional en sector centro.",
                u_juan,
                "Registrada"
            ),
            (
                "AT-2026-0002",
                "Pedro Rojas (9.876.543-2)",
                vecinos_dict.get('9.876.543-2'),
                del_norte,
                ta_salud,
                sa_salud,
                "Derivación para atención geriátrica preventiva en CESFAM Las Compañías.",
                u_comp,
                "En proceso"
            ),
            (
                "AT-2026-0003",
                "María Castillo (15.234.567-1)",
                vecinos_dict.get('15.234.567-1'),
                del_sur,
                ta_educ,
                sa_educ,
                "Postulación a beca municipal de transporte escolar enseñanza media.",
                u_sur,
                "Resuelta"
            ),
            (
                "AT-2026-0004",
                "Jorge Valenzuela Silva (14.892.311-K)",
                vecinos_dict.get('14.892.311-K'),
                del_centro,
                ta_social,
                sa_social,
                "Orientación y postulación a programa de mejoramiento térmico de vivienda.",
                u_centro,
                "Registrada"
            ),
            (
                "AT-2026-0005",
                "Marcela Araya Barraza (17.345.901-8)",
                vecinos_dict.get('17.345.901-8'),
                del_norte,
                ta_educ,
                sa_educ,
                "Asesoría para regularización de estudios y nivelación de adultos mayores.",
                u_comp,
                "En proceso"
            ),
            (
                "AT-2026-0006",
                "Esteban Barraza Pastén (10.456.789-0)",
                vecinos_dict.get('10.456.789-0'),
                del_rural,
                ta_social,
                sa_social,
                "Requerimiento de apoyo social y abastecimiento hídrico en Algarrobito.",
                u_rural,
                "Registrada"
            ),
            (
                "AT-2026-0007",
                "Héctor Pizarro Godoy (11.782.903-4)",
                vecinos_dict.get('11.782.903-4'),
                del_centro,
                ta_salud,
                sa_salud,
                "Coordinación de operativo de vacunación e higiene en Caleta San Pedro.",
                u_juan,
                "Derivada"
            ),
            (
                "AT-2026-0008",
                "Camila Herrera Bravo (20.123.876-4)",
                vecinos_dict.get('20.123.876-4'),
                del_sur,
                ta_social,
                sa_social,
                "Inscripción en talleres deportivos y comunitarios de la Delegación Sur.",
                u_sur,
                "Resuelta"
            ),
        ]
        for cod_at, sol, vec_obj, del_at, ta_at, sa_at, desc_at, resp_at, est_at in atenciones_data:
            at_obj, _ = AtencionCiudadana.all_objects.get_or_create(
                codigo_atencion=cod_at,
                defaults={
                    'solicitante': sol,
                    'vecino': vec_obj,
                    'delegacion': del_at,
                    'tipo_atencion': ta_at,
                    'sub_atencion': sa_at,
                    'descripcion': desc_at,
                    'usuario_responsable': resp_at,
                    'estado': est_at
                }
            )
            at_obj.solicitante = sol
            at_obj.vecino = vec_obj
            at_obj.delegacion = del_at
            at_obj.tipo_atencion = ta_at
            at_obj.sub_atencion = sa_at
            at_obj.descripcion = desc_at
            at_obj.usuario_responsable = resp_at
            at_obj.estado = est_at
            at_obj.deleted_at = None
            at_obj.save()

        self.stdout.write(self.style.SUCCESS("[OK] Base de datos SGR poblada exitosamente con datos semillas oficiales."))
        self.stdout.write("--------------------------------------------------")
        self.stdout.write("CUENTAS DE ACCESO LISTAS PARA PRUEBAS Y EVALUACIÓN:")
        self.stdout.write("  1) admin_sgr         | Clave: Admin1234! | Rol: Administrador       (Acceso Global + Multi-delegación)")
        self.stdout.write("  2) coordinador_sgr   | Clave: User1234!  | Rol: Coordinador         (Metas, Atenciones, Reportes)")
        self.stdout.write("  3) delegado_centro   | Clave: User1234!  | Rol: Delegado Municipal  (Delegación Centro)")
        self.stdout.write("  4) delegado_companias| Clave: User1234!  | Rol: Delegado Municipal  (Delegación Norte / Las Compañías)")
        self.stdout.write("  5) delegado_sur      | Clave: User1234!  | Rol: Delegado Municipal  (Delegación Sur)")
        self.stdout.write("  6) delegado_rural    | Clave: User1234!  | Rol: Delegado Municipal  (Delegación Rural)")
        self.stdout.write("  7) funcionario_juan  | Clave: User1234!  | Rol: Operador            (Ingreso de Atención Centro)")
        self.stdout.write("  8) consultor_ana     | Clave: User1234!  | Rol: Consultor           (Solo Lectura)")
        self.stdout.write("--------------------------------------------------")
