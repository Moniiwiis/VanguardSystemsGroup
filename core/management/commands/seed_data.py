from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
from accounts.models import Delegacion, Cargo, Funcionario, Rol, FuncionarioRol
from configuration.models import Periodo, CatalogoActividad, ItemMedicion, ConfiguracionMeta
from activities.models import Actividad, Evidencia, ValidacionEvidencia, AtencionSocialGestion
from agenda.models import CompromisoAgenda, AjusteDesempenio

class Command(BaseCommand):
    help = 'Puebla la base de datos con información demostrativa reproducible para la Evaluación Sumativa II SGR'

    def handle(self, *args, **options):
        self.stdout.write("Cargando datos semillas en la base de datos SGR...")

        # 1. Delegaciones
        del_centro, _ = Delegacion.objects.get_or_create(
            nombre="Delegación La Serena Centro",
            defaults={'estado': 'Activa', 'ambito': 'Urbano Central'}
        )
        del_companias, _ = Delegacion.objects.get_or_create(
            nombre="Delegación Las Compañías",
            defaults={'estado': 'Activa', 'ambito': 'Sector Norte'}
        )
        del_rural, _ = Delegacion.objects.get_or_create(
            nombre="Delegación Rural",
            defaults={'estado': 'Activa', 'ambito': 'Valle de Elqui / Rural'}
        )

        # 2. Roles
        rol_admin, _ = Rol.objects.get_or_create(nombre_rol="Administrador")
        rol_delegado, _ = Rol.objects.get_or_create(nombre_rol="Delegado / Jefatura")
        rol_funcionario, _ = Rol.objects.get_or_create(nombre_rol="Funcionario")
        rol_verificador, _ = Rol.objects.get_or_create(nombre_rol="Verificador")

        # 3. Cargos
        cargo_gestor, _ = Cargo.objects.get_or_create(
            nombre_cargo="Gestor Social",
            defaults={'descripcion': 'Atención y derivación de requerimientos sociales vecinales.'}
        )
        cargo_coord, _ = Cargo.objects.get_or_create(
            nombre_cargo="Coordinador Territorial",
            defaults={'descripcion': 'Supervisión de compromisos e intervenciones comunitarias.'}
        )
        cargo_inspector, _ = Cargo.objects.get_or_create(
            nombre_cargo="Inspector Municipal",
            defaults={'descripcion': 'Fiscalización y respuesta a denuncias urbanas.'}
        )

        # 4. Usuarios y Funcionarios
        # a) Superusuario Administrador
        u_admin, created = User.objects.get_or_create(
            username="admin_sgr",
            defaults={
                'email': "admin@laserena.cl",
                'first_name': "Administrador",
                'last_name': "General",
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            u_admin.set_password("Admin1234!")
            u_admin.save()

        f_admin, _ = Funcionario.objects.get_or_create(
            user=u_admin,
            defaults={
                'identificador_institucional': "ADM-001",
                'delegacion': del_centro,
                'cargo': cargo_coord,
                'estado': "Activo"
            }
        )
        FuncionarioRol.objects.get_or_create(funcionario=f_admin, rol=rol_admin)

        # b) Usuario Limitado / Delegado Centro
        u_centro, created = User.objects.get_or_create(
            username="delegado_centro",
            defaults={
                'email': "delegado.centro@laserena.cl",
                'first_name': "Carlos",
                'last_name': "Mendoza",
                'is_staff': True,
                'is_superuser': False
            }
        )
        if created:
            u_centro.set_password("User1234!")
            u_centro.save()

        f_centro, _ = Funcionario.objects.get_or_create(
            user=u_centro,
            defaults={
                'identificador_institucional': "DEL-001",
                'delegacion': del_centro,
                'cargo': cargo_coord,
                'estado': "Activo"
            }
        )
        FuncionarioRol.objects.get_or_create(funcionario=f_centro, rol=rol_delegado)

        # c) Usuario Limitado / Delegado Las Compañías
        u_comp, created = User.objects.get_or_create(
            username="delegado_companias",
            defaults={
                'email': "delegado.companias@laserena.cl",
                'first_name': "María",
                'last_name': "Rojas",
                'is_staff': True,
                'is_superuser': False
            }
        )
        if created:
            u_comp.set_password("User1234!")
            u_comp.save()

        f_comp, _ = Funcionario.objects.get_or_create(
            user=u_comp,
            defaults={
                'identificador_institucional': "DEL-002",
                'delegacion': del_companias,
                'cargo': cargo_coord,
                'estado': "Activo"
            }
        )
        FuncionarioRol.objects.get_or_create(funcionario=f_comp, rol=rol_delegado)

        # d) Funcionario Centro
        u_juan, created = User.objects.get_or_create(
            username="funcionario_juan",
            defaults={
                'email': "juan.perez@laserena.cl",
                'first_name': "Juan",
                'last_name': "Pérez",
                'is_staff': True,
                'is_superuser': False
            }
        )
        if created:
            u_juan.set_password("User1234!")
            u_juan.save()

        f_juan, _ = Funcionario.objects.get_or_create(
            user=u_juan,
            defaults={
                'identificador_institucional': "FUN-101",
                'delegacion': del_centro,
                'cargo': cargo_gestor,
                'estado': "Activo"
            }
        )
        FuncionarioRol.objects.get_or_create(funcionario=f_juan, rol=rol_funcionario)

        # e) Asignar permisos de modelos de Django a los usuarios de staff
        from django.contrib.auth.models import Permission
        all_perms = Permission.objects.filter(
            content_type__app_label__in=['accounts', 'activities', 'agenda', 'configuration', 'analytics']
        )
        u_centro.user_permissions.set(all_perms)
        u_comp.user_permissions.set(all_perms)
        u_juan.user_permissions.set(all_perms)

        # 5. Período de medición
        periodo_actual, _ = Periodo.objects.get_or_create(
            fecha_inicio=datetime.date(2026, 7, 1),
            fecha_termino=datetime.date(2026, 9, 30),
            defaults={'dias_computables': 91, 'estado': 'Abierto'}
        )

        # 6. Catálogos e Ítems de Medición
        cat_social, _ = CatalogoActividad.objects.get_or_create(
            tipo_actividad="Atención Social",
            servicio="Asistencia Vecinal Directa",
            defaults={'tipo_atencion': 'Presencial', 'subtipo_atencion': 'Registro Ficha Familiar', 'estado': 'Activo'}
        )

        cat_terr, _ = CatalogoActividad.objects.get_or_create(
            tipo_actividad="Operativo Territorial",
            servicio="Limpieza y Desmalezado",
            defaults={'tipo_atencion': 'Terreno', 'subtipo_atencion': 'Intervención Comunitaria', 'estado': 'Activo'}
        )

        item_social, _ = ItemMedicion.objects.get_or_create(
            nombre_item="Fichas Sociales Ejecutadas",
            cargo=cargo_gestor,
            defaults={'catalogo': cat_social, 'unidad_medida': 'Fichas'}
        )

        item_terr, _ = ItemMedicion.objects.get_or_create(
            nombre_item="Operativos Territoriales Concluidos",
            cargo=cargo_coord,
            defaults={'catalogo': cat_terr, 'unidad_medida': 'Operativos'}
        )

        # 7. Configuración de Metas
        meta_juan, _ = ConfiguracionMeta.objects.get_or_create(
            item=item_social,
            periodo=periodo_actual,
            funcionario=f_juan,
            defaults={'valor_objetivo': 10.0, 'ponderacion': 40.0, 'umbral_minimo': 80.0, 'maximo_computable': 150.0}
        )

        meta_comp, _ = ConfiguracionMeta.objects.get_or_create(
            item=item_terr,
            periodo=periodo_actual,
            funcionario=f_comp,
            defaults={'valor_objetivo': 5.0, 'ponderacion': 60.0, 'umbral_minimo': 80.0, 'maximo_computable': 150.0}
        )

        # 8. Actividades y Evidencias
        act1, created1 = Actividad.objects.get_or_create(
            descripcion_solicitud="Solicitud de entrega de alimentos por emergencia invernal",
            defaults={
                'fecha_actividad': datetime.date(2026, 8, 10),
                'accion_ejecutada': "Evaluación social realizada y caja entregada en domicilio",
                'contacto_nombre': "Ana Gutiérrez",
                'contacto_telefono': "+56912345678",
                'funcionario': f_juan,
                'item': item_social,
                'periodo': periodo_actual
            }
        )
        if created1:
            Evidencia.objects.create(
                actividad=act1,
                ruta_archivo_url="evidencias/2026/08/act1_foto.jpg",
                metadatos="GPS: -29.9045, -71.2489 | Fecha: 2026-08-10"
            )
            ValidacionEvidencia.objects.create(
                actividad=act1,
                verificador=f_centro,
                resultado="Aprobado",
                observaciones="Fotografía conforme con firma de recepción"
            )
            AtencionSocialGestion.objects.create(
                actividad=act1,
                numero_gestion=1,
                tipo_gestion="Entrevista Inicial",
                fecha_gestion=datetime.date(2026, 8, 10),
                resultado_gestion="Aprobada ayuda de emergencia"
            )

        act2, created2 = Actividad.objects.get_or_create(
            descripcion_solicitud="Operativo de limpieza de microbasural en Av. Las Compañías",
            defaults={
                'fecha_actividad': datetime.date(2026, 8, 15),
                'accion_ejecutada': "Despacho de maquinaria pesada y retiro de 4 toneladas de escombros",
                'contacto_nombre': "Roberto Gómez (Junta de Vecinos #4)",
                'contacto_telefono': "+56987654321",
                'funcionario': f_comp,
                'item': item_terr,
                'periodo': periodo_actual
            }
        )
        if created2:
            Evidencia.objects.create(
                actividad=act2,
                ruta_archivo_url="evidencias/2026/08/act2_limpieza.jpg",
                metadatos="Fotografía panorámica del terreno despejado"
            )
            ValidacionEvidencia.objects.create(
                actividad=act2,
                verificador=f_admin,
                resultado="Aprobado",
                observaciones="Terreno verificado libre de escombros"
            )

        # 9. Agenda Colectiva (Compromisos)
        CompromisoAgenda.objects.get_or_create(
            solicitante="Junta de Vecinos El Milagro",
            responsable=f_juan,
            defaults={
                'actividad_origen': act1,
                'territorio': "La Serena Centro",
                'area_apoyo': "DIDECO",
                'fecha_comprometida': datetime.date(2026, 9, 28),
                'estado': 'En proceso',
                'observacion': 'Reunión de coordinación vecinal por seguridad'
            }
        )

        CompromisoAgenda.objects.get_or_create(
            solicitante="Comité de Adelanto Las Compañías",
            responsable=f_comp,
            defaults={
                'actividad_origen': act2,
                'territorio': "Las Compañías Sector Norte",
                'area_apoyo': "Operaciones",
                'fecha_comprometida': datetime.date(2026, 9, 30),
                'estado': 'Ingresado',
                'observacion': 'Instalación de contenedores comunitarios'
            }
        )

        # 10. Ejemplo de Borrado Lógico (deleted_at) para cumplir requerimiento explícito
        act_deleted, created_del = Actividad.all_objects.get_or_create(
            descripcion_solicitud="Solicitud duplicada ingresada por error",
            defaults={
                'fecha_actividad': datetime.date(2026, 8, 1),
                'accion_ejecutada': "Registro anulado",
                'contacto_nombre': "Registro Pruebas",
                'contacto_telefono': "00000000",
                'funcionario': f_juan,
                'item': item_social,
                'periodo': periodo_actual,
                'deleted_at': timezone.now()
            }
        )

        self.stdout.write(self.style.SUCCESS("[OK] Carga de datos semillas finalizada exitosamente."))
        self.stdout.write(self.style.SUCCESS("Cuentas de prueba creadas:"))
        self.stdout.write("  1) admin_sgr / Admin1234! (Superusuario - Acceso total)")
        self.stdout.write("  2) delegado_centro / User1234! (Limitado a Delegación Centro)")
        self.stdout.write("  3) delegado_companias / User1234! (Limitado a Delegación Las Compañías)")
        self.stdout.write("  4) funcionario_juan / User1234! (Funcionario La Serena Centro)")
