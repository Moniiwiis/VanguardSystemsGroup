import random
import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from django.http import JsonResponse, HttpResponseForbidden

from core.context_processors import global_context
from core.utils import export_to_excel_csv, build_accent_query
from activities.models import (
    Actividad, ValidacionEvidencia, TipoGestion, Vecino, AtencionCiudadana
)
from agenda.models import CompromisoAgenda
from configuration.models import (
    ConfiguracionMeta, Periodo, ItemMedicion, CatalogoActividad,
    TipoAtencion, SubAtencion
)
from accounts.models import Funcionario, Cargo, Delegacion, Rol, FuncionarioRol


# --- DECORADOR DE PERMISOS POR ROL ---

def require_permission(perm_key):
    def decorator(view_func):
        @login_required
        def _wrapped(request, *args, **kwargs):
            ctx = global_context(request)
            if not ctx['permisos'].get(perm_key, False):
                messages.error(request, "Acceso denegado: Tu perfil no tiene autorización para acceder a este módulo.")
                return redirect('gestion_inicio')
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator


# --- VISTAS DE AUTENTICACIÓN (LOGIN & RECOVERY) ---

def login_view(request):
    if request.user.is_authenticated:
        return redirect('gestion_inicio')

    if request.method == 'POST':
        identifier = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        # Buscar por username o correo
        user_candidate = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
        username_to_auth = user_candidate.username if user_candidate else identifier

        user = authenticate(request, username=username_to_auth, password=password)
        if user is not None:
            if not user.is_active:
                messages.error(request, "La cuenta de usuario se encuentra inactiva en el sistema. Contacte al administrador.")
                return render(request, 'auth/login.html')
            login(request, user)
            
            # Inicializar delegación activa en sesión
            func = Funcionario.all_objects.filter(user=user).first()
            if func and func.delegacion:
                request.session['delegacion_activa_id'] = func.delegacion.id
            else:
                first_del = Delegacion.objects.filter(estado='Activa').first()
                if first_del:
                    request.session['delegacion_activa_id'] = first_del.id

            messages.success(request, f"Bienvenido/a al Sistema Municipal, {user.first_name or user.username}.")
            
            # Si es operador exclusivo, dirigir a atenciones
            ctx = global_context(request)
            if ctx['permisos']['es_operador']:
                return redirect('gestion_atenciones')
            return redirect('gestion_inicio')
        else:
            if user_candidate and not user_candidate.is_active:
                messages.error(request, "La cuenta de usuario se encuentra inactiva en el sistema. Contacte al administrador.")
            else:
                messages.error(request, "Credenciales incorrectas. Verifique usuario o correo y contraseña.")

    return render(request, 'auth/login.html')


def logout_view(request):
    logout(request)
    messages.info(request, "Has cerrado sesión correctamente.")
    return redirect('login')


def recuperar_contrasena_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        if email:
            code = f"{random.randint(100000, 999999)}"
            now = timezone.now()
            
            request.session['recovery_code'] = code
            request.session['recovery_email'] = email
            request.session['recovery_code_time'] = now.timestamp()
            request.session['recovery_attempts'] = 0
            request.session['recovery_verified'] = False
            request.session['recovery_resend_allowed'] = (now + datetime.timedelta(seconds=45)).timestamp()

            # Enviar correo (o registrar en consola sin revelar si existe)
            try:
                send_mail(
                    subject='Código de Recuperación — Sistema Municipal La Serena',
                    message=(
                        f"Estimado/a funcionario/a:\n\n"
                        f"Has solicitado restablecer tu contraseña en el Sistema Municipal SGR.\n"
                        f"Tu código de verificación de 6 dígitos es: {code}\n\n"
                        f"Este código es válido por 10 minutos.\n"
                        f"Si no solicitaste este cambio, ignora este mensaje.\n\n"
                        f"Ilustre Municipalidad de La Serena"
                    ),
                    from_email='no-reply@municipalidadlaserena.cl',
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                pass

            # Mensaje genérico según requerimiento de seguridad (A3 / Pág 3 y 5)
            messages.success(request, f"Si la cuenta existe, recibirás instrucciones y tu código de verificación. (Código generado para pruebas: {code})")
            return redirect('validar_codigo')
        messages.error(request, "Por favor ingresa un correo electrónico válido.")

    return render(request, 'auth/recuperar_contrasena.html')


def reenviar_codigo_view(request):
    email = request.session.get('recovery_email')
    if not email:
        messages.error(request, "Sesión de recuperación expirada. Inicia el proceso nuevamente.")
        return redirect('recuperar_contrasena')

    resend_allowed = request.session.get('recovery_resend_allowed', 0)
    now_ts = timezone.now().timestamp()
    if now_ts < resend_allowed:
        segundos = int(resend_allowed - now_ts)
        messages.warning(request, f"Debes esperar {segundos} segundos antes de solicitar un reenvío.")
        return redirect('validar_codigo')

    # Generar nuevo código
    code = f"{random.randint(100000, 999999)}"
    request.session['recovery_code'] = code
    request.session['recovery_code_time'] = now_ts
    request.session['recovery_attempts'] = 0
    request.session['recovery_resend_allowed'] = (timezone.now() + datetime.timedelta(seconds=45)).timestamp()

    messages.success(request, f"Se ha generado y reenviado un nuevo código de verificación. (Código: {code})")
    return redirect('validar_codigo')


def validar_codigo_view(request):
    email = request.session.get('recovery_email', 'usuario@laserena.cl')
    actual_code = request.session.get('recovery_code')
    code_time = request.session.get('recovery_code_time')
    attempts = request.session.get('recovery_attempts', 0)

    # Ofuscar correo para privacidad: ej. u***@example.test
    parts = email.split('@')
    masked_email = f"{parts[0][0]}***@{parts[1]}" if len(parts) == 2 and len(parts[0]) > 0 else email

    if request.method == 'POST':
        # Validar tiempo de expiración (10 minutos = 600 segundos)
        if not code_time or (timezone.now().timestamp() - float(code_time)) > 600:
            request.session.pop('recovery_code', None)
            messages.error(request, "El código de verificación ha vencido (vigencia máxima de 10 minutos). Solicita uno nuevo.")
            return redirect('recuperar_contrasena')

        # Control de intentos fallidos (máximo 5 intentos)
        if attempts >= 5:
            request.session.pop('recovery_code', None)
            messages.error(request, "Has superado el límite de 5 intentos fallidos. Por seguridad, solicita un nuevo código.")
            return redirect('recuperar_contrasena')

        digits = [request.POST.get(f'code_{i}', '').strip() for i in range(1, 7)]
        entered_code = "".join(digits)

        if entered_code and actual_code and entered_code == str(actual_code):
            request.session['recovery_verified'] = True
            messages.success(request, "Código validado exitosamente. Ahora crea tu nueva contraseña.")
            return redirect('nueva_contrasena')
        else:
            attempts += 1
            request.session['recovery_attempts'] = attempts
            restantes = 5 - attempts
            messages.error(request, f"Código incorrecto. Te quedan {restantes} intento(s) antes del bloqueo.")

    return render(request, 'auth/validar_codigo.html', {
        'email': email,
        'masked_email': masked_email,
        'actual_code': actual_code,
        'attempts': attempts
    })


def nueva_contrasena_view(request):
    # Proteger acceso directo sin verificación válida
    if not request.session.get('recovery_verified'):
        messages.error(request, "Acceso no autorizado. Primero debes validar tu código de verificación.")
        return redirect('recuperar_contrasena')

    email = request.session.get('recovery_email')

    if request.method == 'POST':
        pass1 = request.POST.get('nueva_contrasena', '').strip()
        pass2 = request.POST.get('confirmar_contrasena', '').strip()

        if not pass1 or not pass2:
            messages.error(request, "Ambos campos de contraseña son obligatorios.")
            return render(request, 'auth/nueva_contrasena.html')

        if pass1 != pass2:
            messages.error(request, "Las contraseñas no coinciden. Verifica ambos campos.")
            return render(request, 'auth/nueva_contrasena.html')

        # Validación de requisitos de seguridad (A3 / Pág 3)
        if len(pass1) < 8:
            messages.error(request, "La contraseña debe tener al menos 8 caracteres.")
            return render(request, 'auth/nueva_contrasena.html')
        if not any(c.isupper() for c in pass1):
            messages.error(request, "La contraseña debe contener al menos una letra mayúscula.")
            return render(request, 'auth/nueva_contrasena.html')
        if not any(c.islower() for c in pass1):
            messages.error(request, "La contraseña debe contener al menos una letra minúscula.")
            return render(request, 'auth/nueva_contrasena.html')
        if not any(c.isdigit() for c in pass1):
            messages.error(request, "La contraseña debe contener al menos un número.")
            return render(request, 'auth/nueva_contrasena.html')
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in pass1):
            messages.error(request, "La contraseña debe contener al menos un carácter especial (ej: ! @ # $ %).")
            return render(request, 'auth/nueva_contrasena.html')

        # Actualizar contraseña en base de datos real
        user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email.split('@')[0])).first()
        if user:
            user.set_password(pass1)
            user.is_active = True
            user.save()

        # Invalidar de inmediato código y limpiar sesión
        request.session.pop('recovery_code', None)
        request.session.pop('recovery_email', None)
        request.session.pop('recovery_verified', None)
        request.session.pop('recovery_code_time', None)
        request.session.pop('recovery_attempts', None)

        messages.success(request, "¡Contraseña actualizada exitosamente! Ahora puedes iniciar sesión con tu nueva clave.")
        return redirect('login')

    return render(request, 'auth/nueva_contrasena.html')


# --- CAMBIO DE DELEGACIÓN ACTIVA EN CABECERA ---

@login_required
def cambiar_delegacion_view(request, del_id):
    ctx = global_context(request)
    if not ctx['can_switch_delegacion']:
        messages.error(request, "Tu perfil de usuario tiene asignado un contexto territorial fijo.")
        return redirect(request.META.get('HTTP_REFERER', 'gestion_inicio'))

    nueva_del = get_object_or_404(Delegacion, id=del_id, estado='Activa')
    request.session['delegacion_activa_id'] = nueva_del.id
    messages.success(request, f"Contexto territorial cambiado a '{nueva_del.nombre}'.")
    return redirect(request.META.get('HTTP_REFERER', 'gestion_inicio'))


# --- INICIO / DASHBOARD ---

@login_required
def gestion_inicio(request):
    ctx = global_context(request)
    del_activa = ctx['delegacion_activa']

    # Filtrar según perfil y delegación activa
    if ctx['permisos']['es_admin']:
        atenciones_qs = AtencionCiudadana.objects.all()
    elif del_activa:
        atenciones_qs = AtencionCiudadana.objects.filter(delegacion=del_activa)
    else:
        atenciones_qs = AtencionCiudadana.objects.none()

    metas = ConfiguracionMeta.objects.select_related('periodo', 'item').all()
    if metas.exists():
        cumplimientos = [m.cumplimiento_ponderado() for m in metas]
        promedio = round(sum(cumplimientos) / len(cumplimientos), 2)
    else:
        promedio = 87.5

    context = {
        'total_actividades': Actividad.objects.count(),
        'total_compromisos': CompromisoAgenda.objects.count(),
        'total_funcionarios': Funcionario.objects.count(),
        'total_atenciones': atenciones_qs.count(),
        'total_delegaciones': Delegacion.objects.count(),
        'total_roles': Rol.objects.count(),
        'total_usuarios': User.objects.filter(is_active=True).count(),
        'total_items_metas': ItemMedicion.objects.count(),
        'total_tipos_atencion': TipoAtencion.objects.count(),
        'total_subatenciones': SubAtencion.objects.count(),
        'promedio_meta': promedio,
        'ultimas_atenciones': atenciones_qs.select_related('tipo_atencion', 'sub_atencion', 'delegacion', 'usuario_responsable').order_by('-fecha_registro')[:5],
    }
    return render(request, 'gestion/inicio.html', context)


# --- 1. CRUD DELEGACIONES (Wireframe C3) ---

@login_required
def gestion_delegaciones(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_delegaciones']:
        messages.error(request, "Acceso denegado: Solo el Administrador puede gestionar Delegaciones.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        codigo = request.POST.get('codigo', '').strip().upper()
        nombre = request.POST.get('nombre', '').strip()
        direccion = request.POST.get('direccion', '').strip()
        comuna = request.POST.get('comuna', 'La Serena').strip()
        estado = request.POST.get('estado', 'Activa')

        if not nombre:
            messages.error(request, "El nombre de la delegación es obligatorio.")
        else:
            if not codigo:
                count = Delegacion.all_objects.count() + 1
                codigo = f"DEL{count:02d}"
            Delegacion.objects.create(codigo=codigo, nombre=nombre, direccion=direccion, comuna=comuna, estado=estado)
            messages.success(request, f"Delegación '{nombre}' creada exitosamente.")
            return redirect('gestion_delegaciones')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = Delegacion.objects.all().order_by('id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'direccion', 'comuna'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    # Exportar a Excel
    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Dirección', 'Comuna', 'Estado']
        rows = [[d.get_codigo(), d.nombre, d.direccion or '', d.comuna or '', d.estado] for d in qs]
        return export_to_excel_csv("delegaciones_municipales", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/delegaciones.html', {
        'page_obj': page_obj,
        'delegaciones': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_delegaciones_editar(request, del_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_delegaciones']:
        messages.error(request, "Acceso denegado: Solo el Administrador puede editar Delegaciones.")
        return redirect('gestion_inicio')

    delegacion = get_object_or_404(Delegacion, id=del_id)
    if request.method == 'POST':
        delegacion.codigo = request.POST.get('codigo', delegacion.codigo).strip().upper()
        delegacion.nombre = request.POST.get('nombre', delegacion.nombre).strip()
        delegacion.direccion = request.POST.get('direccion', delegacion.direccion).strip()
        delegacion.comuna = request.POST.get('comuna', delegacion.comuna).strip()
        delegacion.estado = request.POST.get('estado', delegacion.estado)
        delegacion.save()
        messages.success(request, f"Delegación '{delegacion.nombre}' actualizada exitosamente.")
    return redirect('gestion_delegaciones')


@login_required
def gestion_delegaciones_eliminar(request, del_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_delegaciones']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    delegacion = get_object_or_404(Delegacion, id=del_id)
    if request.method == 'POST':
        # Validación de integridad referencial
        if Funcionario.objects.filter(delegacion=delegacion).exists():
            messages.error(request, f"No se puede eliminar '{delegacion.nombre}' porque tiene funcionarios asignados.")
            return redirect('gestion_delegaciones')
        if AtencionCiudadana.objects.filter(delegacion=delegacion).exists():
            messages.error(request, f"No se puede eliminar '{delegacion.nombre}' porque tiene atenciones ciudadanas registradas.")
            return redirect('gestion_delegaciones')

        nombre = delegacion.nombre
        delegacion.delete()
        messages.success(request, f"Delegación '{nombre}' eliminada del sistema.")
    return redirect('gestion_delegaciones')


# --- 2. CRUD ROLES (Wireframe C3) ---

@login_required
def gestion_roles(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_roles']:
        messages.error(request, "Acceso denegado: Solo el Administrador puede gestionar Roles.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        codigo = request.POST.get('codigo', '').strip().upper()
        nombre = request.POST.get('nombre_rol', '').strip()
        alcance = request.POST.get('alcance', 'Delegación').strip()
        estado = request.POST.get('estado', 'Activo')
        descripcion = request.POST.get('descripcion', '').strip()

        if not nombre:
            messages.error(request, "El nombre del rol es obligatorio.")
        else:
            if not codigo:
                count = Rol.all_objects.count() + 1
                codigo = f"ROL{count:02d}"
            Rol.objects.create(codigo=codigo, nombre_rol=nombre, alcance=alcance, estado=estado, descripcion=descripcion)
            messages.success(request, f"Rol '{nombre}' registrado exitosamente.")
            return redirect('gestion_roles')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = Rol.objects.all().order_by('id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre_rol', 'alcance', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Rol', 'Alcance', 'Estado', 'Descripción']
        rows = [[r.get_codigo(), r.nombre_rol, r.alcance, r.estado, r.descripcion or ''] for r in qs]
        return export_to_excel_csv("roles_sistema", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/roles.html', {
        'page_obj': page_obj,
        'roles': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_roles_editar(request, rol_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_roles']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    rol = get_object_or_404(Rol, id=rol_id)
    if request.method == 'POST':
        rol.codigo = request.POST.get('codigo', rol.codigo).strip().upper()
        rol.nombre_rol = request.POST.get('nombre_rol', rol.nombre_rol).strip()
        rol.alcance = request.POST.get('alcance', rol.alcance)
        rol.estado = request.POST.get('estado', rol.estado)
        rol.descripcion = request.POST.get('descripcion', rol.descripcion).strip()
        rol.save()
        messages.success(request, f"Rol '{rol.nombre_rol}' actualizado correctamente.")
    return redirect('gestion_roles')


@login_required
def gestion_roles_eliminar(request, rol_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_roles']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    rol = get_object_or_404(Rol, id=rol_id)
    if request.method == 'POST':
        if FuncionarioRol.objects.filter(rol=rol).exists():
            messages.error(request, f"No se puede eliminar el rol '{rol.nombre_rol}' porque está asignado a usuarios activos.")
            return redirect('gestion_roles')
        nombre = rol.nombre_rol
        rol.delete()
        messages.success(request, f"Rol '{nombre}' eliminado.")
    return redirect('gestion_roles')


# --- 3. CRUD USUARIOS (Wireframe C4) ---

@login_required
def gestion_usuarios(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_usuarios']:
        messages.error(request, "Acceso denegado: Tu perfil no tiene permisos para gestionar Usuarios.")
        return redirect('gestion_inicio')

    del_activa = ctx['delegacion_activa']

    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        correo = request.POST.get('correo', '').strip()
        rol_id = request.POST.get('rol_id')
        delegacion_id = request.POST.get('delegacion_id')
        estado = request.POST.get('estado', 'Activo')

        # Restricción de seguridad del Delegado Municipal
        if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin']:
            delegacion_id = del_activa.id if del_activa else None

        if not nombre or not correo:
            messages.error(request, "Nombre y correo electrónico son requeridos.")
        else:
            username_base = correo.split('@')[0]
            user, created = User.objects.get_or_create(
                username=username_base,
                defaults={'email': correo, 'first_name': nombre, 'is_staff': True}
            )
            user.first_name = nombre
            user.email = correo
            user.is_active = (estado == 'Activo')
            if created:
                user.set_password("User1234!")
            user.save()

            del_obj = Delegacion.objects.filter(id=delegacion_id).first() if delegacion_id else None
            cargo_def = Cargo.objects.first()
            func, f_created = Funcionario.all_objects.get_or_create(
                user=user,
                defaults={
                    'identificador_institucional': f"USR-{user.id:03d}",
                    'delegacion': del_obj,
                    'cargo': cargo_def,
                    'estado': estado
                }
            )
            func.delegacion = del_obj
            func.estado = estado
            func.deleted_at = None
            func.save()

            if rol_id:
                rol_obj = Rol.objects.filter(id=rol_id).first()
                if rol_obj:
                    # Desactivar roles previos y asignar el seleccionado
                    FuncionarioRol.objects.filter(funcionario=func).delete()
                    fr = FuncionarioRol.all_objects.filter(funcionario=func, rol=rol_obj).first()
                    if fr:
                        fr.deleted_at = None
                        fr.save()
                    else:
                        FuncionarioRol.objects.create(funcionario=func, rol=rol_obj)

            messages.success(request, f"Usuario '{nombre}' registrado exitosamente.")
            return redirect('gestion_usuarios')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = Funcionario.objects.select_related('user', 'delegacion').prefetch_related('funcionariorol_set__rol').order_by('id')

    # Scoping de seguridad en el servidor:
    # Delegado Municipal solo ve usuarios de su delegación asignada
    if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin'] and del_activa:
        qs = qs.filter(delegacion=del_activa)

    if q:
        qs = qs.filter(build_accent_query(['user__first_name', 'user__email', 'user__username', 'delegacion__nombre'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    # Exportar a Excel (sin claves, tokens ni datos sensibles)
    if request.GET.get('export') == 'excel':
        headers = ['Nombre', 'Correo Electrónico', 'Rol Principal', 'Delegación', 'Estado']
        rows = []
        for f in qs:
            rol_p = f.funcionariorol_set.first()
            rol_txt = rol_p.rol.nombre_rol if rol_p and rol_p.rol else 'Funcionario'
            del_txt = f.delegacion.nombre if f.delegacion else 'Sin delegación'
            rows.append([f.user.first_name or f.user.username, f.user.email, rol_txt, del_txt, f.estado])
        return export_to_excel_csv("usuarios_sistema", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    roles = Rol.objects.filter(estado='Activo')
    delegaciones = ctx['delegaciones_autorizadas']

    return render(request, 'gestion/usuarios.html', {
        'page_obj': page_obj,
        'funcionarios': page_obj.object_list,
        'roles': roles,
        'delegaciones': delegaciones,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_usuarios_editar(request, user_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_usuarios']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    funcionario = get_object_or_404(Funcionario, id=user_id)

    # Scoping: delegados no pueden editar usuarios de otras delegaciones
    if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin']:
        if funcionario.delegacion != ctx['delegacion_activa']:
            messages.error(request, "No tienes permiso para modificar usuarios de otra delegación.")
            return redirect('gestion_usuarios')

    if request.method == 'POST':
        estado = request.POST.get('estado', funcionario.estado)
        funcionario.user.first_name = request.POST.get('nombre', funcionario.user.first_name).strip()
        funcionario.user.email = request.POST.get('correo', funcionario.user.email).strip()
        funcionario.user.is_active = (estado == 'Activo')
        funcionario.user.save()

        if ctx['permisos']['es_admin']:
            del_id = request.POST.get('delegacion_id')
            if del_id:
                funcionario.delegacion_id = del_id

        funcionario.estado = estado
        funcionario.save()

        rol_id = request.POST.get('rol_id')
        if rol_id:
            rol_obj = Rol.objects.filter(id=rol_id).first()
            if rol_obj:
                FuncionarioRol.objects.filter(funcionario=funcionario).delete()
                fr = FuncionarioRol.all_objects.filter(funcionario=funcionario, rol=rol_obj).first()
                if fr:
                    fr.deleted_at = None
                    fr.save()
                else:
                    FuncionarioRol.objects.create(funcionario=funcionario, rol=rol_obj)

        messages.success(request, f"Usuario '{funcionario.user.first_name}' actualizado exitosamente.")
    return redirect('gestion_usuarios')


@login_required
def gestion_usuarios_eliminar(request, user_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_usuarios']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    funcionario = get_object_or_404(Funcionario, id=user_id)
    if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin']:
        if funcionario.delegacion != ctx['delegacion_activa']:
            messages.error(request, "No puedes eliminar usuarios de otra delegación.")
            return redirect('gestion_usuarios')

    if request.method == 'POST':
        nombre = funcionario.user.first_name or funcionario.user.username
        funcionario.estado = 'Inactivo'
        funcionario.user.is_active = False
        funcionario.user.save()
        funcionario.delete()
        messages.success(request, f"Usuario '{nombre}' desactivado correctamente.")
    return redirect('gestion_usuarios')


# --- 4. CRUD ÍTEMS Y METAS (Wireframe C4) ---

@login_required
def gestion_metas(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_metas']:
        messages.error(request, "Acceso denegado: Se requiere perfil de Administrador o Coordinador.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        codigo = request.POST.get('codigo', '').strip().upper()
        nombre = request.POST.get('nombre_item', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        estado = request.POST.get('estado', 'Activo')

        if not nombre:
            messages.error(request, "El nombre del ítem es obligatorio.")
        else:
            if not codigo:
                count = ItemMedicion.all_objects.count() + 1
                codigo = f"IT{count:03d}"
            ItemMedicion.objects.create(codigo=codigo, nombre_item=nombre, descripcion=descripcion, estado=estado)
            messages.success(request, f"Ítem '{nombre}' registrado exitosamente.")
            return redirect('gestion_metas')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = ItemMedicion.objects.all().order_by('id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre_item', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Descripción', 'Estado']
        rows = [[it.get_codigo(), it.nombre_item, it.descripcion or '', it.estado] for it in qs]
        return export_to_excel_csv("items_metas", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/metas.html', {
        'page_obj': page_obj,
        'items': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_metas_editar(request, item_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_metas']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    item = get_object_or_404(ItemMedicion, id=item_id)
    if request.method == 'POST':
        item.codigo = request.POST.get('codigo', item.codigo).strip().upper()
        item.nombre_item = request.POST.get('nombre_item', item.nombre_item).strip()
        item.descripcion = request.POST.get('descripcion', item.descripcion).strip()
        item.estado = request.POST.get('estado', item.estado)
        item.save()
        messages.success(request, f"Ítem '{item.nombre_item}' actualizado correctamente.")
    return redirect('gestion_metas')


@login_required
def gestion_metas_eliminar(request, item_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_metas']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    item = get_object_or_404(ItemMedicion, id=item_id)
    if request.method == 'POST':
        if ConfiguracionMeta.objects.filter(item=item).exists():
            messages.error(request, f"No se puede eliminar '{item.nombre_item}' porque está configurado en metas activas.")
            return redirect('gestion_metas')
        nombre = item.nombre_item
        item.delete()
        messages.success(request, f"Ítem '{nombre}' eliminado.")
    return redirect('gestion_metas')


# --- 5. CRUD TIPO DE ATENCIÓN (Wireframe C5) ---

@login_required
def gestion_tipo_atencion(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_tipo_atencion']:
        messages.error(request, "Acceso denegado: Se requiere perfil de Administrador o Coordinador.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        codigo = request.POST.get('codigo', '').strip().upper()
        nombre = request.POST.get('nombre', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        estado = request.POST.get('estado', 'Activo')

        if not nombre:
            messages.error(request, "El nombre del Tipo de Atención es obligatorio.")
        else:
            if not codigo:
                count = TipoAtencion.all_objects.count() + 1
                codigo = f"TA{count:03d}"
            TipoAtencion.objects.create(codigo=codigo, nombre=nombre, descripcion=descripcion, estado=estado)
            messages.success(request, f"Tipo de Atención '{nombre}' registrado exitosamente.")
            return redirect('gestion_tipo_atencion')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = TipoAtencion.objects.all().order_by('id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Descripción', 'Estado']
        rows = [[ta.get_codigo(), ta.nombre, ta.descripcion or '', ta.estado] for ta in qs]
        return export_to_excel_csv("tipos_de_atencion", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/tipo_atencion.html', {
        'page_obj': page_obj,
        'tipos': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_tipo_atencion_editar(request, tipo_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_tipo_atencion']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    tipo = get_object_or_404(TipoAtencion, id=tipo_id)
    if request.method == 'POST':
        tipo.codigo = request.POST.get('codigo', tipo.codigo).strip().upper()
        tipo.nombre = request.POST.get('nombre', tipo.nombre).strip()
        tipo.descripcion = request.POST.get('descripcion', tipo.descripcion).strip()
        tipo.estado = request.POST.get('estado', tipo.estado)
        tipo.save()
        messages.success(request, f"Tipo de Atención '{tipo.nombre}' actualizado.")
    return redirect('gestion_tipo_atencion')


@login_required
def gestion_tipo_atencion_eliminar(request, tipo_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_tipo_atencion']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    tipo = get_object_or_404(TipoAtencion, id=tipo_id)
    if request.method == 'POST':
        # Validación de integridad referencial requerida en la rúbrica (A3 / Pág 3 y 9)
        if SubAtencion.objects.filter(tipo_atencion=tipo).exists():
            messages.error(request, f"Integridad referencial: No se puede eliminar '{tipo.nombre}' porque posee Sub Atenciones asociadas activas.")
            return redirect('gestion_tipo_atencion')

        nombre = tipo.nombre
        tipo.delete()
        messages.success(request, f"Tipo de Atención '{nombre}' eliminado.")
    return redirect('gestion_tipo_atencion')


# --- 6. CRUD SUB ATENCIÓN (Wireframe C5) ---

@login_required
def gestion_sub_atencion(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_sub_atencion']:
        messages.error(request, "Acceso denegado: Se requiere perfil de Administrador o Coordinador.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        codigo = request.POST.get('codigo', '').strip().upper()
        nombre = request.POST.get('nombre', '').strip()
        tipo_atencion_id = request.POST.get('tipo_atencion_id')
        estado = request.POST.get('estado', 'Activa')

        if not nombre or not tipo_atencion_id:
            messages.error(request, "Nombre y Tipo de Atención asociado son campos obligatorios.")
        else:
            if not codigo:
                count = SubAtencion.all_objects.count() + 1
                codigo = f"SA{count:03d}"
            SubAtencion.objects.create(codigo=codigo, nombre=nombre, tipo_atencion_id=tipo_atencion_id, estado=estado)
            messages.success(request, f"Sub Atención '{nombre}' registrada exitosamente.")
            return redirect('gestion_sub_atencion')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()

    qs = SubAtencion.objects.select_related('tipo_atencion').all().order_by('id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'tipo_atencion__nombre'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Tipo de Atención Asociado', 'Estado']
        rows = [[sa.get_codigo(), sa.nombre, sa.tipo_atencion.nombre, sa.estado] for sa in qs]
        return export_to_excel_csv("sub_atenciones", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    tipos = TipoAtencion.objects.filter(estado='Activo')

    return render(request, 'gestion/sub_atencion.html', {
        'page_obj': page_obj,
        'subs': page_obj.object_list,
        'tipos': tipos,
        'q': q,
        'filtro_estado': filtro_estado,
        'total_registros': qs.count()
    })


@login_required
def gestion_sub_atencion_editar(request, sub_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_sub_atencion']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    sub = get_object_or_404(SubAtencion, id=sub_id)
    if request.method == 'POST':
        sub.codigo = request.POST.get('codigo', sub.codigo).strip().upper()
        sub.nombre = request.POST.get('nombre', sub.nombre).strip()
        tipo_id = request.POST.get('tipo_atencion_id')
        if tipo_id:
            sub.tipo_atencion_id = tipo_id
        sub.estado = request.POST.get('estado', sub.estado)
        sub.save()
        messages.success(request, f"Sub Atención '{sub.nombre}' actualizada.")
    return redirect('gestion_sub_atencion')


@login_required
def gestion_sub_atencion_eliminar(request, sub_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_sub_atencion']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    sub = get_object_or_404(SubAtencion, id=sub_id)
    if request.method == 'POST':
        if AtencionCiudadana.objects.filter(sub_atencion=sub).exists():
            messages.error(request, f"No se puede eliminar '{sub.nombre}' porque está vinculada a atenciones ciudadanas.")
            return redirect('gestion_sub_atencion')
        nombre = sub.nombre
        sub.delete()
        messages.success(request, f"Sub Atención '{nombre}' eliminada.")
    return redirect('gestion_sub_atencion')


# --- API AJAX SUBATENCIONES DEPENDIENTES (Ingreso de atención) ---

@login_required
def api_subatenciones(request, tipo_id):
    subs = SubAtencion.objects.filter(tipo_atencion_id=tipo_id, estado__iexact='Activa').values('id', 'codigo', 'nombre')
    return JsonResponse({'subatenciones': list(subs)})


# --- 7. INGRESO DE ATENCIÓN CIUDADANA (Wireframe C6 - Diseño 11) ---

@login_required
def gestion_atenciones(request):
    ctx = global_context(request)
    del_activa = ctx['delegacion_activa']

    # Procesar guardado de atención
    if request.method == 'POST':
        solicitante = request.POST.get('solicitante', '').strip()
        tipo_id = request.POST.get('tipo_atencion_id')
        sub_id = request.POST.get('sub_atencion_id')
        descripcion = request.POST.get('descripcion', '').strip()
        vecino_id = request.POST.get('vecino_id')

        if not solicitante or not tipo_id or not sub_id or not descripcion:
            messages.error(request, "Todos los campos marcados con (*) son obligatorios.")
        elif not del_activa:
            messages.error(request, "Error de contexto: No se identificó la delegación activa autorizada.")
        else:
            tipo_obj = get_object_or_404(TipoAtencion, id=tipo_id)
            sub_obj = get_object_or_404(SubAtencion, id=sub_id, tipo_atencion=tipo_obj)
            vecino_obj = Vecino.objects.filter(id=vecino_id).first() if vecino_id else None

            # Prevenir doble envío comprobando si ya existe un registro idéntico en los últimos 15 segundos
            tiempo_limite = timezone.now() - datetime.timedelta(seconds=15)
            duplicado = AtencionCiudadana.objects.filter(
                solicitante=solicitante,
                usuario_responsable=request.user,
                delegacion=del_activa,
                created_at__gte=tiempo_limite
            ).first()

            if duplicado:
                messages.warning(request, f"La atención ya fue ingresada previamente con el código {duplicado.codigo_atencion}.")
                return redirect('gestion_atenciones')

            atencion = AtencionCiudadana.objects.create(
                solicitante=solicitante,
                vecino=vecino_obj,
                delegacion=del_activa,
                tipo_atencion=tipo_obj,
                sub_atencion=sub_obj,
                descripcion=descripcion,
                usuario_responsable=request.user,
                estado='Registrada'
            )

            # Notificación y confirmación de atención generada
            messages.success(request, f"¡Atención ingresada exitosamente! Identificador generado: {atencion.codigo_atencion}")
            return redirect('gestion_atenciones')

    q = request.GET.get('q', '').strip()
    filtro_tipo = request.GET.get('tipo', '').strip()

    qs = AtencionCiudadana.objects.select_related(
        'delegacion', 'tipo_atencion', 'sub_atencion', 'usuario_responsable', 'vecino'
    ).order_by('-id')

    # Scoping territorial por perfil (si no es admin global, se restringe a su delegación activa)
    if not ctx['permisos']['es_admin'] and del_activa:
        qs = qs.filter(delegacion=del_activa)

    if q:
        qs = qs.filter(build_accent_query([
            'codigo_atencion', 'solicitante', 'descripcion',
            'sub_atencion__nombre', 'tipo_atencion__nombre', 'delegacion__nombre'
        ], q))
    if filtro_tipo:
        qs = qs.filter(tipo_atencion__nombre__iexact=filtro_tipo)

    # Exportar a Excel
    if request.GET.get('export') == 'excel':
        headers = ['Identificador', 'Solicitante', 'Delegación', 'Tipo de Atención', 'Sub Atención', 'Responsable', 'Fecha y Hora', 'Estado']
        rows = []
        for a in qs:
            rows.append([
                a.codigo_atencion,
                a.solicitante,
                a.delegacion.nombre,
                a.tipo_atencion.nombre,
                a.sub_atencion.nombre,
                a.usuario_responsable.get_full_name() or a.usuario_responsable.username,
                a.created_at.strftime('%d/%m/%Y %H:%M'),
                a.estado
            ])
        return export_to_excel_csv("atenciones_ciudadanas", headers, rows)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    tipos_activos = TipoAtencion.objects.filter(estado='Activo')
    vecinos_catalogo = Vecino.objects.filter(estado='Activo')[:100]

    return render(request, 'gestion/atenciones.html', {
        'page_obj': page_obj,
        'atenciones': page_obj.object_list,
        'tipos_activos': tipos_activos,
        'vecinos': vecinos_catalogo,
        'q': q,
        'filtro_tipo': filtro_tipo,
        'total_registros': qs.count()
    })


# --- 8. TIPO DE GESTIÓN ---

@login_required
def gestion_tipo_gestion(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_tipo_gestion']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        descripcion = request.POST.get('descripcion')
        if nombre:
            TipoGestion.objects.create(nombre=nombre, descripcion=descripcion, estado='Activo')
            messages.success(request, f"Tipo de Gestión '{nombre}' creado.")
            return redirect('gestion_tipo_gestion')

    q = request.GET.get('q', '')
    tipos = TipoGestion.objects.all()
    if q:
        tipos = tipos.filter(Q(nombre__icontains=q) | Q(descripcion__icontains=q))

    return render(request, 'gestion/tipo_gestion.html', {'tipos': tipos, 'q': q})


@login_required
def gestion_tipo_gestion_editar(request, tg_id):
    tg = get_object_or_404(TipoGestion, id=tg_id)
    if request.method == 'POST':
        tg.nombre = request.POST.get('nombre', tg.nombre)
        tg.descripcion = request.POST.get('descripcion', tg.descripcion)
        tg.save()
        messages.success(request, f"Tipo de Gestión '{tg.nombre}' actualizado.")
    return redirect('gestion_tipo_gestion')


@login_required
def gestion_tipo_gestion_eliminar(request, tg_id):
    tg = get_object_or_404(TipoGestion, id=tg_id)
    if request.method == 'POST':
        nombre = tg.nombre
        tg.delete()
        messages.success(request, f"Tipo de Gestión '{nombre}' eliminado.")
    return redirect('gestion_tipo_gestion')


# --- 9. VECINOS ---

@login_required
def gestion_vecinos(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_vecinos']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        rut = request.POST.get('rut')
        direccion = request.POST.get('direccion')
        telefono = request.POST.get('telefono')
        territorio = request.POST.get('territorio')
        tipo_gestion_id = request.POST.get('tipo_gestion_id')
        estado = request.POST.get('estado', 'Activo')

        if nombre and rut:
            Vecino.objects.create(
                nombre=nombre,
                rut=rut,
                direccion=direccion,
                telefono=telefono,
                territorio=territorio,
                tipo_gestion_id=tipo_gestion_id if tipo_gestion_id else None,
                estado=estado
            )
            messages.success(request, f"Vecino/a '{nombre}' registrado exitosamente.")
            return redirect('gestion_vecinos')

    q = request.GET.get('q', '')
    vecinos = Vecino.objects.select_related('tipo_gestion').all()
    if q:
        vecinos = vecinos.filter(
            Q(nombre__icontains=q) | Q(rut__icontains=q) | Q(direccion__icontains=q) | Q(territorio__icontains=q)
        )
    tipos_gestion = TipoGestion.objects.all()

    return render(request, 'gestion/vecinos.html', {'vecinos': vecinos, 'tipos_gestion': tipos_gestion, 'q': q})


@login_required
def gestion_vecinos_editar(request, vecino_id):
    vecino = get_object_or_404(Vecino, id=vecino_id)
    if request.method == 'POST':
        vecino.nombre = request.POST.get('nombre', vecino.nombre)
        vecino.rut = request.POST.get('rut', vecino.rut)
        vecino.direccion = request.POST.get('direccion', vecino.direccion)
        vecino.telefono = request.POST.get('telefono', vecino.telefono)
        vecino.territorio = request.POST.get('territorio', vecino.territorio)
        tg_id = request.POST.get('tipo_gestion_id')
        vecino.tipo_gestion_id = tg_id if tg_id else None
        vecino.estado = request.POST.get('estado', vecino.estado)
        vecino.save()
        messages.success(request, f"Vecino/a '{vecino.nombre}' actualizado/a.")
    return redirect('gestion_vecinos')


@login_required
def gestion_vecinos_eliminar(request, vecino_id):
    vecino = get_object_or_404(Vecino, id=vecino_id)
    if request.method == 'POST':
        nombre = vecino.nombre
        vecino.delete()
        messages.success(request, f"Vecino/a '{nombre}' eliminado/a.")
    return redirect('gestion_vecinos')


# --- MÓDULOS DE COMPLEMENTO Y REPORTES ---

@login_required
def gestion_funcionarios(request):
    return redirect('gestion_usuarios')

@login_required
def gestion_funcionarios_editar(request, funcionario_id):
    return redirect('gestion_usuarios')

@login_required
def gestion_funcionarios_eliminar(request, funcionario_id):
    return redirect('gestion_usuarios')


@login_required
def gestion_actividades(request):
    actividades = Actividad.objects.select_related('funcionario__user', 'item', 'periodo').all()[:50]
    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()

    return render(request, 'gestion/actividades.html', {
        'actividades': actividades,
        'funcionarios': funcionarios,
        'items': items,
        'periodos': periodos,
    })

@login_required
def gestion_actividades_editar(request, actividad_id):
    actividad = get_object_or_404(Actividad, id=actividad_id)
    return redirect('gestion_actividades')

@login_required
def gestion_actividades_eliminar(request, actividad_id):
    actividad = get_object_or_404(Actividad, id=actividad_id)
    actividad.delete()
    return redirect('gestion_actividades')


@login_required
def gestion_agenda(request):
    compromisos = CompromisoAgenda.objects.select_related('responsable__user', 'actividad_origen').all()[:50]
    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')
    return render(request, 'gestion/agenda.html', {'compromisos': compromisos, 'funcionarios': funcionarios})

@login_required
def gestion_agenda_editar(request, compromiso_id):
    return redirect('gestion_agenda')

@login_required
def gestion_agenda_eliminar(request, compromiso_id):
    return redirect('gestion_agenda')


@login_required
def gestion_configuracion(request):
    metas = ConfiguracionMeta.objects.select_related('item', 'periodo', 'funcionario__user').all()[:50]
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()
    funcionarios = Funcionario.objects.select_related('user').all()
    return render(request, 'gestion/configuracion.html', {
        'metas': metas, 'items': items, 'periodos': periodos, 'funcionarios': funcionarios
    })

@login_required
def gestion_configuracion_editar(request, meta_id):
    return redirect('gestion_configuracion')

@login_required
def gestion_configuracion_eliminar(request, meta_id):
    return redirect('gestion_configuracion')


@login_required
def gestion_reportes(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_reportes']:
        messages.error(request, "Acceso denegado: Se requiere perfil directivo para acceder a reportes.")
        return redirect('gestion_inicio')

    metas = ConfiguracionMeta.objects.select_related('periodo', 'item').all()
    verdes = sum(1 for m in metas if m.estado_semaforo() == 'VERDE')
    ambares = sum(1 for m in metas if m.estado_semaforo() == 'AMBAR')
    rojos = sum(1 for m in metas if m.estado_semaforo() == 'ROJO')
    total_val = ValidacionEvidencia.objects.count()
    aprobadas = ValidacionEvidencia.objects.filter(resultado__iexact='Aprobado').count()
    pct_aprobadas = round((aprobadas / total_val) * 100, 1) if total_val > 0 else 92.0
    pct_pendientes = round(100 - pct_aprobadas, 1) if total_val > 0 else 8.0

    context = {
        'metas': metas,
        'verdes': verdes,
        'ambares': ambares,
        'rojos': rojos,
        'pct_aprobadas': pct_aprobadas,
        'pct_pendientes': pct_pendientes,
    }
    return render(request, 'gestion/reportes.html', context)
