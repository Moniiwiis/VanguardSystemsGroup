import logging
import secrets
import datetime
from smtplib import SMTPException
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django import forms
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.mail.message import BadHeaderError
from django.core.paginator import Paginator
from django.core.validators import validate_email
from django.db.models import OuterRef, Q, Subquery
from django.utils import timezone
from django.http import JsonResponse, HttpResponseForbidden

from core.context_processors import global_context
from core.utils import export_to_excel_csv, build_accent_query
from activities.models import (
    Actividad, Evidencia, ValidacionEvidencia, TipoGestion, Vecino, AtencionCiudadana
)
from agenda.models import CompromisoAgenda
from configuration.models import (
    ConfiguracionMeta, Periodo, ItemMedicion, CatalogoActividad,
    TipoAtencion, SubAtencion
)
from accounts.models import Funcionario, Cargo, Delegacion, Sector, Rol, FuncionarioRol

logger = logging.getLogger(__name__)


def _send_recovery_code(email, code):
    sent_count = send_mail(
        subject='Código de Recuperación — Sistema Municipal La Serena',
        message=(
            "Estimado/a funcionario/a:\n\n"
            "Has solicitado restablecer tu contraseña en el Sistema Municipal SGR.\n"
            f"Tu código de verificación de 6 dígitos es: {code}\n\n"
            "Este código es válido por 10 minutos.\n"
            "Si no solicitaste este cambio, ignora este mensaje.\n\n"
            "Ilustre Municipalidad de La Serena"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    if sent_count != 1:
        raise SMTPException("El backend de correo no confirmó el envío del mensaje.")


def _clear_recovery_session(request):
    for key in (
        'recovery_code',
        'recovery_email',
        'recovery_user_id',
        'recovery_code_time',
        'recovery_attempts',
        'recovery_verified',
        'recovery_resend_allowed',
    ):
        request.session.pop(key, None)


def _apply_list_ordering(queryset, request, options, default):
    ordering = request.GET.get('orden', default)
    allowed = {value for value, _label in options}
    if ordering not in allowed:
        ordering = default
    return queryset.order_by(ordering), ordering


DEFAULT_NEW_USER_PASSWORD = "User1234!"


def _validate_password(password):
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres."
    if not any(character.isupper() for character in password):
        return "La contraseña debe contener al menos una letra mayúscula."
    if not any(character.islower() for character in password):
        return "La contraseña debe contener al menos una letra minúscula."
    if not any(character.isdigit() for character in password):
        return "La contraseña debe contener al menos un número."
    if not any(character in "!@#$%^&*()_+-=[]{}|;:,.<>?" for character in password):
        return "La contraseña debe contener al menos un carácter especial."
    return None


ALLOWED_PAGE_SIZES = {5, 15, 30}


def _get_page_size(request, session_key='page_size'):
    """
    Clase 10 (Diapositivas 15-16):
    Paginación profesional con persistencia en sesión (5, 15, 30).
    - Valida contra whitelist ALLOWED_PAGE_SIZES.
    - Si llega por GET, actualiza request.session (si está disponible).
    - Si no llega por GET, recupera de request.session.
    - Valor por defecto: 15.
    """
    raw_size = request.GET.get('page_size')
    session = getattr(request, 'session', None)
    if raw_size:
        try:
            selected_size = int(raw_size)
            if selected_size in ALLOWED_PAGE_SIZES:
                if session is not None:
                    session[session_key] = selected_size
                    if hasattr(session, 'modified'):
                        session.modified = True
                return selected_size
        except (TypeError, ValueError):
            pass
    if session is not None:
        return session.get(session_key, 15)
    return 15


def _paginate_queryset(request, queryset, session_key='page_size'):
    """
    Clase 10 (Diapositiva 17):
    Conserva la consulta al paginar:
    params = request.GET.copy()
    params.pop('page', None)
    query_params = params.urlencode()
    """
    page_size = _get_page_size(request, session_key)
    paginator = Paginator(queryset, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    params = request.GET.copy()
    params.pop('page', None)
    query_params = params.urlencode()

    return page_obj, page_size, query_params


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

            if func and func.debe_cambiar_contrasena:
                return redirect('cambiar_contrasena_inicial')

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


@login_required
def cambiar_contrasena_inicial_view(request):
    funcionario = get_object_or_404(
        Funcionario,
        user=request.user,
        debe_cambiar_contrasena=True,
    )

    if request.method == 'POST':
        password = request.POST.get('nueva_contrasena', '')
        confirmation = request.POST.get('confirmar_contrasena', '')
        error = _validate_password(password)
        if error:
            messages.error(request, error)
        elif password != confirmation:
            messages.error(request, "Las contraseñas no coinciden.")
        else:
            request.user.set_password(password)
            request.user.save()
            funcionario.debe_cambiar_contrasena = False
            funcionario.save(update_fields=['debe_cambiar_contrasena', 'updated_at'])
            update_session_auth_hash(request, request.user)
            messages.success(request, "Contraseña actualizada. Ya puedes usar el sistema.")
            return redirect('gestion_inicio')

    return render(request, 'auth/cambiar_contrasena_inicial.html')


def recuperar_contrasena_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "Por favor ingresa un correo electrónico válido.")
            return render(request, 'auth/recuperar_contrasena.html')

        user = User.objects.filter(email__iexact=email).first()
        _clear_recovery_session(request)
        request.session['recovery_email'] = email
        now = timezone.now()
        request.session['recovery_code_time'] = now.timestamp()
        request.session['recovery_attempts'] = 0
        request.session['recovery_verified'] = False
        request.session['recovery_resend_allowed'] = (
            now + datetime.timedelta(seconds=45)
        ).timestamp()

        if user:
            code = f"{secrets.randbelow(1_000_000):06d}"
            try:
                _send_recovery_code(user.email, code)
            except (OSError, SMTPException, BadHeaderError):
                logger.exception("No se pudo enviar el código de recuperación.")
                _clear_recovery_session(request)
                messages.error(
                    request,
                    "No fue posible enviar el correo en este momento. "
                    "Verifica la configuración SMTP e inténtalo nuevamente.",
                )
                return redirect('recuperar_contrasena')

            request.session['recovery_code'] = code
            request.session['recovery_user_id'] = user.id

        messages.success(
            request,
            "Si la cuenta existe, recibirás instrucciones en el correo asociado.",
        )
        return redirect('validar_codigo')

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

    user_id = request.session.get('recovery_user_id')
    if user_id:
        user = User.objects.filter(id=user_id, email__iexact=email).first()
        if not user:
            _clear_recovery_session(request)
            messages.error(request, "La sesión de recuperación expiró. Inicia el proceso nuevamente.")
            return redirect('recuperar_contrasena')

        code = f"{secrets.randbelow(1_000_000):06d}"
        try:
            _send_recovery_code(user.email, code)
        except (OSError, SMTPException, BadHeaderError):
            logger.exception("No se pudo reenviar el código de recuperación.")
            messages.error(
                request,
                "No fue posible enviar el correo en este momento. "
                "Verifica la configuración SMTP e inténtalo nuevamente.",
            )
            return redirect('validar_codigo')

        request.session['recovery_code'] = code
        request.session['recovery_code_time'] = now_ts
        request.session['recovery_attempts'] = 0

    request.session['recovery_resend_allowed'] = (
        timezone.now() + datetime.timedelta(seconds=45)
    ).timestamp()
    messages.success(
        request,
        "Si la cuenta existe, recibirás un nuevo código en el correo asociado.",
    )
    return redirect('validar_codigo')


def validar_codigo_view(request):
    email = request.session.get('recovery_email')
    if not email:
        messages.error(request, "Inicia nuevamente la recuperación de contraseña.")
        return redirect('recuperar_contrasena')

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

        if (
            entered_code
            and actual_code
            and request.session.get('recovery_user_id')
            and entered_code == str(actual_code)
        ):
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
        user_id = request.session.get('recovery_user_id')
        user = User.objects.filter(id=user_id, email__iexact=email).first()
        if user:
            user.set_password(pass1)
            user.save()
            Funcionario.all_objects.filter(user=user).update(
                debe_cambiar_contrasena=False,
            )
        else:
            _clear_recovery_session(request)
            messages.error(request, "La sesión de recuperación expiró. Inicia el proceso nuevamente.")
            return redirect('recuperar_contrasena')

        # Invalidar de inmediato código y limpiar sesión
        _clear_recovery_session(request)

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

    referer = request.META.get('HTTP_REFERER', '')

    if del_id == 0:
        request.session['delegacion_activa_id'] = 'global'
        messages.success(request, "Contexto territorial cambiado a 'Global (Todas las delegaciones)'.")
        if referer:
            from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
            u = urlparse(referer)
            q = parse_qs(u.query)
            q.pop('delegacion', None)
            q.pop('page', None)
            new_query = urlencode(q, doseq=True)
            return redirect(urlunparse((u.scheme, u.netloc, u.path, u.params, new_query, u.fragment)))
        return redirect('gestion_inicio')

    nueva_del = get_object_or_404(Delegacion, id=del_id, estado='Activa')
    request.session['delegacion_activa_id'] = nueva_del.id
    messages.success(request, f"Contexto territorial cambiado a '{nueva_del.nombre}'.")

    if referer:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        u = urlparse(referer)
        q = parse_qs(u.query)
        q['delegacion'] = [str(nueva_del.id)]
        q.pop('page', None)
        new_query = urlencode(q, doseq=True)
        return redirect(urlunparse((u.scheme, u.netloc, u.path, u.params, new_query, u.fragment)))
    return redirect('gestion_inicio')


# --- INICIO / DASHBOARD ---

@login_required
def gestion_inicio(request):
    ctx = global_context(request)
    del_activa = ctx['delegacion_activa']
    es_admin = ctx['permisos']['es_admin']

    # Métricas territoriales específicas de la delegación activa
    if del_activa:
        atenciones_del_qs = AtencionCiudadana.objects.filter(delegacion=del_activa)
        funcionarios_del_qs = Funcionario.objects.filter(delegacion=del_activa)
        metas_del_qs = ConfiguracionMeta.objects.filter(funcionario__delegacion=del_activa).select_related('periodo', 'item', 'funcionario')
        val_del_qs = ValidacionEvidencia.objects.filter(actividad__funcionario__delegacion=del_activa)
    else:
        atenciones_del_qs = AtencionCiudadana.objects.none()
        funcionarios_del_qs = Funcionario.objects.none()
        metas_del_qs = ConfiguracionMeta.objects.none()
        val_del_qs = ValidacionEvidencia.objects.none()

    total_atenciones_del = atenciones_del_qs.count()
    atenciones_resueltas_del = atenciones_del_qs.filter(estado__iexact='Resuelta').count()
    atenciones_proceso_del = atenciones_del_qs.filter(estado__iexact='En proceso').count()
    atenciones_registradas_del = atenciones_del_qs.filter(estado__iexact='Registrada').count()
    pct_resueltas_del = round((atenciones_resueltas_del / total_atenciones_del) * 100, 1) if total_atenciones_del > 0 else 0.0

    total_funcionarios_del = funcionarios_del_qs.count()

    metas_list = list(metas_del_qs)
    total_metas_del = len(metas_list)
    if metas_list:
        cumplimientos = [m.cumplimiento_ponderado() for m in metas_list]
        promedio_meta_del = round(sum(cumplimientos) / len(cumplimientos), 1)
        verdes_del = sum(1 for m in metas_list if m.estado_semaforo() == 'VERDE')
        ambares_del = sum(1 for m in metas_list if m.estado_semaforo() == 'AMBAR')
        rojos_del = sum(1 for m in metas_list if m.estado_semaforo() == 'ROJO')
    else:
        promedio_meta_del = 0.0
        verdes_del = 0
        ambares_del = 0
        rojos_del = 0

    total_val_del = val_del_qs.count()
    aprobadas_val_del = val_del_qs.filter(resultado__iexact='Aprobado').count()
    pct_aprobadas_del = round((aprobadas_val_del / total_val_del) * 100, 1) if total_val_del > 0 else 100.0

    ultimas_atenciones = atenciones_del_qs.select_related(
        'tipo_atencion', 'sub_atencion', 'delegacion', 'usuario_responsable'
    ).order_by('-fecha_registro')[:5]

    # Métricas globales comunales
    total_delegaciones = Delegacion.objects.filter(estado='Activa').count()
    total_atenciones_global = AtencionCiudadana.objects.count()
    total_usuarios_global = User.objects.filter(is_active=True).count()
    total_items_metas = ItemMedicion.objects.count()
    total_tipos_atencion = TipoAtencion.objects.count()
    total_subatenciones = SubAtencion.objects.count()
    total_roles = Rol.objects.count()

    context = {
        # Métricas de la delegación activa
        'total_atenciones_del': total_atenciones_del,
        'atenciones_resueltas_del': atenciones_resueltas_del,
        'atenciones_proceso_del': atenciones_proceso_del,
        'atenciones_registradas_del': atenciones_registradas_del,
        'pct_resueltas_del': pct_resueltas_del,
        'total_funcionarios_del': total_funcionarios_del,
        'total_metas_del': total_metas_del,
        'promedio_meta_del': promedio_meta_del,
        'verdes_del': verdes_del,
        'ambares_del': ambares_del,
        'rojos_del': rojos_del,
        'total_val_del': total_val_del,
        'aprobadas_val_del': aprobadas_val_del,
        'pct_aprobadas_del': pct_aprobadas_del,
        'ultimas_atenciones': ultimas_atenciones,

        # Métricas globales comunales
        'total_delegaciones': total_delegaciones,
        'total_atenciones_global': total_atenciones_global,
        'total_usuarios': total_usuarios_global,
        'total_items_metas': total_items_metas,
        'total_tipos_atencion': total_tipos_atencion,
        'total_subatenciones': total_subatenciones,
        'total_roles': total_roles,
        'es_admin': es_admin,
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

    qs = Delegacion.objects.all().order_by('-id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'direccion', 'comuna'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguas'),
        ('-id', 'Más recientes'),
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    # Exportar a Excel
    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Dirección', 'Comuna', 'Estado']
        rows = [[d.get_codigo(), d.nombre, d.direccion or '', d.comuna or '', d.estado] for d in qs]
        return export_to_excel_csv("delegaciones_municipales", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/delegaciones.html', {
        'page_obj': page_obj,
        'delegaciones': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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

    qs = Rol.objects.all().order_by('-id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre_rol', 'alcance', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('nombre_rol', 'Nombre A-Z'),
        ('-nombre_rol', 'Nombre Z-A'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Rol', 'Alcance', 'Estado', 'Descripción']
        rows = [[r.get_codigo(), r.nombre_rol, r.alcance, r.estado, r.descripcion or ''] for r in qs]
        return export_to_excel_csv("roles_sistema", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/roles.html', {
        'page_obj': page_obj,
        'roles': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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
        username = request.POST.get('username', '').strip()
        rol_id = request.POST.get('rol_id')
        cargo_id = request.POST.get('cargo_id')
        delegacion_id = request.POST.get('delegacion_id')
        estado = request.POST.get('estado', 'Activo')

        # Restricción de seguridad del Delegado Municipal
        if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin']:
            delegacion_id = del_activa.id if del_activa else None

        rol_obj = Rol.objects.filter(id=rol_id, estado='Activo').first()
        cargo_obj = Cargo.objects.filter(id=cargo_id).first()
        if not nombre or not correo or not username or not rol_obj or not cargo_obj:
            messages.error(request, "Nombre, usuario, correo, rol y cargo son obligatorios.")
        elif (
            not ctx['permisos']['es_admin']
            and rol_obj.nombre_rol.strip().casefold()
            in {'administrador', 'superadministrador'}
        ):
            messages.error(request, "Solo un administrador puede asignar el rol de administrador.")
        elif User.objects.filter(username__iexact=username).exists():
            messages.error(request, "Ese nombre de usuario ya está registrado.")
        elif User.objects.filter(email__iexact=correo).exists():
            messages.error(request, "Ese correo electrónico ya está registrado.")
        else:
            rol_es_administrador = rol_obj.nombre_rol.strip().casefold() in {
                'administrador',
                'superadministrador',
            }
            del_obj = None
            requiere_delegacion = rol_obj.alcance.strip().casefold() == 'delegación'
            if not rol_es_administrador and requiere_delegacion and not delegacion_id:
                messages.error(request, "Este rol requiere una delegación.")
                return redirect('gestion_usuarios')
            if not rol_es_administrador and delegacion_id:
                del_obj = Delegacion.objects.filter(
                    id=delegacion_id,
                    estado='Activa',
                ).first()
                if not del_obj:
                    messages.error(request, "Selecciona una delegación activa válida.")
                    return redirect('gestion_usuarios')

            user = User.objects.create_user(
                username=username,
                email=correo,
                first_name=nombre,
                password=DEFAULT_NEW_USER_PASSWORD,
                is_staff=True,
            )
            user.is_active = (estado == 'Activo')
            user.save()

            func = Funcionario.all_objects.get_or_create(
                user=user,
                defaults={
                    'identificador_institucional': f"USR-{user.id:03d}",
                    'delegacion': del_obj,
                    'cargo': cargo_obj,
                    'estado': estado
                }
            )[0]
            func.delegacion = del_obj
            func.cargo = cargo_obj
            func.estado = estado
            func.debe_cambiar_contrasena = True
            func.deleted_at = None
            func.save()

            FuncionarioRol.objects.filter(funcionario=func).delete()
            fr = FuncionarioRol.all_objects.filter(funcionario=func, rol=rol_obj).first()
            if fr:
                fr.deleted_at = None
                fr.save()
            else:
                FuncionarioRol.objects.create(funcionario=func, rol=rol_obj)

            messages.success(
                request,
                f"Usuario '{username}' creado. Contraseña temporal: "
                f"{DEFAULT_NEW_USER_PASSWORD}. Deberá cambiarla al iniciar sesión.",
            )
            return redirect('gestion_usuarios')

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()
    filtro_delegacion = request.GET.get('delegacion', '').strip()
    todas_delegaciones = Delegacion.objects.filter(estado='Activa').order_by('id')
    delegacion_seleccionada = None

    qs = Funcionario.objects.select_related(
        'user', 'delegacion', 'cargo'
    ).prefetch_related('funcionariorol_set__rol').order_by('-id')

    # Scoping de seguridad en el servidor:
    # Delegado Municipal solo ve usuarios de su delegación asignada
    if ctx['permisos']['es_delegado'] and not ctx['permisos']['es_admin'] and del_activa:
        qs = qs.filter(delegacion=del_activa)
        delegacion_seleccionada = del_activa
    elif ctx['permisos']['es_admin']:
        if filtro_delegacion and filtro_delegacion.isdigit():
            delegacion_seleccionada = Delegacion.objects.filter(id=int(filtro_delegacion), estado='Activa').first()
            if delegacion_seleccionada:
                qs = qs.filter(delegacion=delegacion_seleccionada)

    if q:
        qs = qs.filter(build_accent_query(['user__first_name', 'user__email', 'user__username', 'delegacion__nombre'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('user__first_name', 'Nombre A-Z'),
        ('-user__first_name', 'Nombre Z-A'),
        ('user__email', 'Correo'),
        ('delegacion__nombre', 'Delegación'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    # Exportar a Excel (sin claves, tokens ni datos sensibles)
    if request.GET.get('export') == 'excel':
        headers = ['Usuario', 'Nombre', 'Correo Electrónico', 'Cargo', 'Rol Principal', 'Delegación', 'Estado']
        rows = []
        for f in qs:
            rol_p = f.funcionariorol_set.first()
            rol_txt = rol_p.rol.nombre_rol if rol_p and rol_p.rol else 'Funcionario'
            del_txt = f.delegacion.nombre if f.delegacion else 'Sin delegación'
            rows.append([
                f.user.username,
                f.user.first_name or f.user.username,
                f.user.email,
                f.cargo.nombre_cargo,
                rol_txt,
                del_txt,
                f.estado,
            ])
        return export_to_excel_csv("usuarios_sistema", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    roles = Rol.objects.filter(estado='Activo')
    cargos = Cargo.objects.all().order_by('nombre_cargo')
    delegaciones = ctx['delegaciones_autorizadas']

    return render(request, 'gestion/usuarios.html', {
        'page_obj': page_obj,
        'funcionarios': page_obj.object_list,
        'roles': roles,
        'cargos': cargos,
        'delegaciones': delegaciones,
        'todas_delegaciones': todas_delegaciones,
        'delegacion_seleccionada': delegacion_seleccionada,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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
        rol_id = request.POST.get('rol_id')
        rol_obj = Rol.objects.filter(id=rol_id, estado='Activo').first() if rol_id else None
        cargo_id = request.POST.get('cargo_id')
        cargo_obj = Cargo.objects.filter(id=cargo_id).first() if cargo_id else None
        if not cargo_obj:
            messages.error(request, "Selecciona un cargo válido.")
            return redirect('gestion_usuarios')
        if rol_id and not rol_obj:
            messages.error(request, "Selecciona un rol válido.")
            return redirect('gestion_usuarios')
        if (
            rol_obj
            and not ctx['permisos']['es_admin']
            and rol_obj.nombre_rol.strip().casefold()
            in {'administrador', 'superadministrador'}
        ):
            messages.error(request, "Solo un administrador puede asignar el rol de administrador.")
            return redirect('gestion_usuarios')

        if ctx['permisos']['es_admin'] and rol_obj:
            es_rol_administrador = rol_obj.nombre_rol.strip().casefold() in {
                'administrador',
                'superadministrador',
            }
            del_id = request.POST.get('delegacion_id', '').strip()
            if (
                not es_rol_administrador
                and rol_obj.alcance.strip().casefold() == 'delegación'
                and not del_id
            ):
                messages.error(request, "Este rol requiere una delegación.")
                return redirect('gestion_usuarios')
            if not es_rol_administrador and del_id and not Delegacion.objects.filter(
                id=del_id,
                estado='Activa',
            ).exists():
                messages.error(request, "Selecciona una delegación activa válida.")
                return redirect('gestion_usuarios')

        estado = request.POST.get('estado', funcionario.estado)
        funcionario.user.first_name = request.POST.get('nombre', funcionario.user.first_name).strip()
        funcionario.user.email = request.POST.get('correo', funcionario.user.email).strip()
        funcionario.user.is_active = (estado == 'Activo')
        funcionario.user.save()

        funcionario.cargo = cargo_obj

        if ctx['permisos']['es_admin']:
            del_id = request.POST.get('delegacion_id')
            if rol_obj and rol_obj.nombre_rol.strip().casefold() in {
                'administrador',
                'superadministrador',
            }:
                funcionario.delegacion = None
            elif del_id:
                funcionario.delegacion_id = del_id
            else:
                funcionario.delegacion = None
        elif ctx['permisos']['es_delegado'] and ctx['delegacion_activa']:
            funcionario.delegacion = ctx['delegacion_activa']

        funcionario.estado = estado
        funcionario.save()

        if rol_obj:
            if rol_obj.nombre_rol.strip().casefold() in {
                'administrador',
                'superadministrador',
            }:
                funcionario.delegacion = None
                funcionario.save(update_fields=['delegacion', 'updated_at'])
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

    qs = ItemMedicion.objects.all().order_by('-id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre_item', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('nombre_item', 'Nombre A-Z'),
        ('-nombre_item', 'Nombre Z-A'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Descripción', 'Estado']
        rows = [[it.get_codigo(), it.nombre_item, it.descripcion or '', it.estado] for it in qs]
        return export_to_excel_csv("items_metas", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/metas.html', {
        'page_obj': page_obj,
        'items': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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

    qs = TipoAtencion.objects.all().order_by('-id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'descripcion'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Descripción', 'Estado']
        rows = [[ta.get_codigo(), ta.nombre, ta.descripcion or '', ta.estado] for ta in qs]
        return export_to_excel_csv("tipos_de_atencion", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, 'gestion/tipo_atencion.html', {
        'page_obj': page_obj,
        'tipos': page_obj.object_list,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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

    qs = SubAtencion.objects.select_related('tipo_atencion').all().order_by('-id')
    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'tipo_atencion__nombre'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguas'),
        ('-id', 'Más recientes'),
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('tipo_atencion__nombre', 'Tipo de atención'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Nombre', 'Tipo de Atención Asociado', 'Estado']
        rows = [[sa.get_codigo(), sa.nombre, sa.tipo_atencion.nombre, sa.estado] for sa in qs]
        return export_to_excel_csv("sub_atenciones", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    tipos = TipoAtencion.objects.filter(estado='Activo')

    return render(request, 'gestion/sub_atencion.html', {
        'page_obj': page_obj,
        'subs': page_obj.object_list,
        'tipos': tipos,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
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


@login_required
def api_sectores_por_delegacion(request, delegacion_id):
    sectores = Sector.objects.filter(delegacion_id=delegacion_id, estado='Activo').order_by('nombre').values('id', 'codigo', 'nombre')
    return JsonResponse({'sectores': list(sectores)})


# --- 7. INGRESO DE ATENCIÓN CIUDADANA (Wireframe C6 - Diseño 11) ---

@login_required
def gestion_atenciones(request):
    ctx = global_context(request)
    del_activa = ctx['delegacion_activa']

    # Procesar guardado de atención
    if request.method == 'POST':
        if not ctx['permisos'].get('puede_ingresar_atencion', True):
            messages.error(request, "Acceso denegado: El perfil Consultor opera exclusivamente en modo solo lectura y no puede ingresar atenciones.")
            return redirect('gestion_atenciones')

        modo_vecino = request.POST.get('modo_vecino', 'existente')
        solicitante = request.POST.get('solicitante', '').strip()
        tipo_id = request.POST.get('tipo_atencion_id')
        sub_id = request.POST.get('sub_atencion_id')
        descripcion = request.POST.get('descripcion', '').strip()
        vecino_id = request.POST.get('vecino_id')
        responsable_id = request.POST.get('responsable_id')

        # Manejo de nuevo vecino si se ingresaron los datos en el formulario
        nuevo_nombre = request.POST.get('nuevo_vecino_nombre', '').strip()
        nuevo_rut = request.POST.get('nuevo_vecino_rut', '').strip()
        nuevo_tel = request.POST.get('nuevo_vecino_telefono', '').strip()
        nuevo_dir = request.POST.get('nuevo_vecino_direccion', '').strip()
        nuevo_sec_id = request.POST.get('nuevo_vecino_sector_id')

        vecino_obj = None
        if modo_vecino == 'nuevo' or (nuevo_nombre and nuevo_rut):
            if not nuevo_nombre or not nuevo_rut:
                messages.error(request, "Para registrar un nuevo vecino debe ingresar al menos el Nombre completo y el RUT.")
                return redirect('gestion_atenciones')

            sector_obj = None
            if nuevo_sec_id and nuevo_sec_id.isdigit():
                sec_filter = Sector.objects.filter(id=int(nuevo_sec_id), estado='Activo')
                if del_activa:
                    sec_filter = sec_filter.filter(delegacion=del_activa)
                sector_obj = sec_filter.first()

            territorio_val = sector_obj.nombre if sector_obj else (del_activa.nombre if del_activa else 'General')

            # Buscar si ya existe por RUT o crearlo en el padrón
            vecino_obj = Vecino.objects.filter(rut=nuevo_rut).first()
            if not vecino_obj:
                vecino_obj = Vecino.objects.create(
                    nombre=nuevo_nombre,
                    rut=nuevo_rut,
                    telefono=nuevo_tel,
                    direccion=nuevo_dir,
                    delegacion=del_activa,
                    sector=sector_obj,
                    territorio=territorio_val,
                    estado='Activo'
                )
            else:
                actualizado = False
                if nuevo_nombre and vecino_obj.nombre != nuevo_nombre:
                    vecino_obj.nombre = nuevo_nombre
                    actualizado = True
                if nuevo_tel and not vecino_obj.telefono:
                    vecino_obj.telefono = nuevo_tel
                    actualizado = True
                if nuevo_dir and not vecino_obj.direccion:
                    vecino_obj.direccion = nuevo_dir
                    actualizado = True
                if del_activa and not vecino_obj.delegacion:
                    vecino_obj.delegacion = del_activa
                    actualizado = True
                if sector_obj and not vecino_obj.sector:
                    vecino_obj.sector = sector_obj
                    vecino_obj.territorio = sector_obj.nombre
                    actualizado = True
                if actualizado:
                    vecino_obj.save()
            solicitante = f"{vecino_obj.nombre} ({vecino_obj.rut})"
        elif vecino_id and vecino_id.isdigit():
            vecino_obj = Vecino.objects.filter(id=int(vecino_id)).first()
            if vecino_obj and not solicitante:
                solicitante = f"{vecino_obj.nombre} ({vecino_obj.rut})"

        # Determinar representante asignado para la atención
        responsable_user = request.user
        if responsable_id and responsable_id.isdigit():
            user_encontrado = User.objects.filter(id=int(responsable_id), is_active=True).first()
            if user_encontrado:
                responsable_user = user_encontrado

        if not solicitante or not tipo_id or not sub_id or not descripcion:
            messages.error(request, "Todos los campos marcados con (*) son obligatorios.")
        elif not del_activa:
            messages.error(request, "Error de contexto: No se identificó la delegación activa autorizada.")
        else:
            tipo_obj = get_object_or_404(TipoAtencion, id=tipo_id)
            sub_obj = get_object_or_404(SubAtencion, id=sub_id, tipo_atencion=tipo_obj)

            # Prevenir doble envío comprobando si ya existe un registro idéntico en los últimos 15 segundos
            tiempo_limite = timezone.now() - datetime.timedelta(seconds=15)
            duplicado = AtencionCiudadana.objects.filter(
                solicitante=solicitante,
                creado_por=request.user,
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
                usuario_responsable=responsable_user,
                creado_por=request.user,
                estado='Registrada'
            )
            # Notificación y confirmación de atención generada
            messages.success(request, f"¡Atención ingresada exitosamente! Identificador generado: {atencion.codigo_atencion}")
            return redirect('gestion_atenciones')

    q = request.GET.get('q', '').strip()
    filtro_tipo = request.GET.get('tipo', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()
    filtro_delegacion_raw = request.GET.get('delegacion')
    filtro_delegacion = filtro_delegacion_raw.strip() if filtro_delegacion_raw is not None else None
    todas_delegaciones = Delegacion.objects.filter(estado='Activa').order_by('id')
    delegacion_seleccionada = None

    qs_base = AtencionCiudadana.objects.select_related(
        'delegacion', 'tipo_atencion', 'sub_atencion', 'usuario_responsable', 'creado_por', 'vecino', 'actividad'
    ).prefetch_related('actividad__evidencias')

    # Scoping territorial por perfil (si no es admin global, se restringe a su delegación activa)
    if not ctx['permisos']['es_admin']:
        if del_activa:
            qs_base = qs_base.filter(delegacion=del_activa)
        else:
            qs_base = qs_base.none()
        delegacion_seleccionada = del_activa
    elif ctx['permisos']['es_admin']:
        if filtro_delegacion_raw is not None:
            # El administrador interactuó con el filtro de la tabla de forma independiente
            if filtro_delegacion and filtro_delegacion.isdigit():
                delegacion_seleccionada = Delegacion.objects.filter(id=int(filtro_delegacion), estado='Activa').first()
                if delegacion_seleccionada:
                    qs_base = qs_base.filter(delegacion=delegacion_seleccionada)
            else:
                # El administrador eligió explícitamente "Todas" en la tabla
                delegacion_seleccionada = None
        elif del_activa:
            # Si no viene en la URL, se inicializa con la delegación activa
            delegacion_seleccionada = del_activa
            qs_base = qs_base.filter(delegacion=del_activa)

    # Conteo de solicitudes por estado (Registradas, En proceso, Resueltas, Canceladas)
    total_registradas = qs_base.filter(estado__iexact='Registrada').count()
    total_en_proceso = qs_base.filter(estado__iexact='En proceso').count()
    total_resueltas = qs_base.filter(estado__iexact='Resuelta').count()
    total_canceladas = qs_base.filter(estado__iexact='Cancelada').count()
    total_general = qs_base.count()

    qs = qs_base.order_by('-id')

    if q:
        qs = qs.filter(build_accent_query([
            'codigo_atencion', 'solicitante', 'descripcion',
            'sub_atencion__nombre', 'tipo_atencion__nombre', 'delegacion__nombre',
            'actividad__codigo_evidencia_unico',
            'usuario_responsable__first_name', 'usuario_responsable__last_name', 'usuario_responsable__username',
            'creado_por__first_name', 'creado_por__last_name', 'creado_por__username'
        ], q))
    if filtro_tipo:
        qs = qs.filter(tipo_atencion__nombre__iexact=filtro_tipo)
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('-created_at', 'Más recientes'),
        ('created_at', 'Más antiguas'),
        ('solicitante', 'Solicitante A-Z'),
        ('-solicitante', 'Solicitante Z-A'),
        ('estado', 'Estado'),
        ('tipo_atencion__nombre', 'Tipo de atención'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-created_at')

    # Exportar a Excel
    if request.GET.get('export') == 'excel':
        headers = ['Identificador', 'Solicitante', 'Delegación', 'Tipo de Atención', 'Sub Atención', 'Responsable / Asignado', 'Creado Por', 'Fecha y Hora', 'Estado Atención', 'Código Evidencia', 'Estado Evidencia']
        rows = []
        for a in qs:
            creador_nombre = a.creado_por.get_full_name() or a.creado_por.username if a.creado_por else 'Sistema'
            resp_nombre = a.usuario_responsable.get_full_name() or a.usuario_responsable.username
            rows.append([
                a.codigo_atencion,
                a.solicitante,
                a.delegacion.nombre,
                a.tipo_atencion.nombre,
                a.sub_atencion.nombre,
                resp_nombre,
                creador_nombre,
                a.created_at.strftime('%d/%m/%Y %H:%M'),
                a.estado,
                a.get_evidencia_codigo(),
                a.estado_evidencia()
            ])
        return export_to_excel_csv("atenciones_ciudadanas", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    tipos_activos = TipoAtencion.objects.filter(estado='Activo')
    vecinos_catalogo = Vecino.objects.filter(estado='Activo').order_by('nombre')
    if not ctx['permisos']['es_admin'] and del_activa:
        vecinos_catalogo = vecinos_catalogo.filter(
            Q(delegacion=del_activa) | (Q(delegacion__isnull=True) & Q(territorio__icontains=del_activa.nombre))
        )
    vecinos_catalogo = vecinos_catalogo[:150]

    # Representantes / Funcionarios disponibles para asignación (filtrados exclusivamente por delegación)
    delegacion_efectiva = del_activa or delegacion_seleccionada
    representantes_qs = User.objects.filter(is_active=True).select_related('funcionario__delegacion', 'funcionario__cargo')
    if delegacion_efectiva:
        representantes_qs = representantes_qs.filter(
            Q(funcionario__delegacion=delegacion_efectiva) | Q(id=request.user.id)
        ).distinct()
    representantes_qs = representantes_qs.order_by('first_name', 'username')
    representantes_disponibles = []
    for u in representantes_qs:
        cargo_nom = ""
        del_nom = ""
        if hasattr(u, 'funcionario') and u.funcionario:
            if u.funcionario.cargo:
                cargo_nom = u.funcionario.cargo.nombre_cargo
            if u.funcionario.delegacion:
                del_nom = u.funcionario.delegacion.nombre
        nombre_completo = u.get_full_name() or u.username
        label = f"{nombre_completo} ({u.username})"
        if cargo_nom:
            label += f" · {cargo_nom}"
        if del_nom:
            label += f" [{del_nom}]"
        representantes_disponibles.append({
            'id': u.id,
            'nombre': nombre_completo,
            'username': u.username,
            'label': label,
            'es_actual': (u.id == request.user.id)
        })

    if del_activa:
        sectores_disponibles = Sector.objects.filter(delegacion=del_activa, estado='Activo').order_by('nombre')
    elif delegacion_seleccionada:
        sectores_disponibles = Sector.objects.filter(delegacion=delegacion_seleccionada, estado='Activo').order_by('nombre')
    else:
        sectores_disponibles = Sector.objects.filter(estado='Activo').order_by('delegacion__nombre', 'nombre')

    return render(request, 'gestion/atenciones.html', {
        'page_obj': page_obj,
        'atenciones': page_obj.object_list,
        'tipos_activos': tipos_activos,
        'vecinos': vecinos_catalogo,
        'sectores': sectores_disponibles,
        'representantes_disponibles': representantes_disponibles,
        'todas_delegaciones': todas_delegaciones,
        'delegacion_seleccionada': delegacion_seleccionada,
        'q': q,
        'filtro_tipo': filtro_tipo,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_registros': qs.count(),
        'total_registradas': total_registradas,
        'total_en_proceso': total_en_proceso,
        'total_resueltas': total_resueltas,
        'total_canceladas': total_canceladas,
        'total_general': total_general,
    })


@login_required
def gestion_atenciones_estado(request, atencion_id):
    ctx = global_context(request)
    if not ctx['permisos'].get('puede_cambiar_estado_atencion', True):
        messages.error(request, "Acceso denegado: El perfil Consultor opera exclusivamente en modo solo lectura.")
        return redirect('gestion_atenciones')

    atencion = get_object_or_404(AtencionCiudadana, id=atencion_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    # Scoping de seguridad territorial
    if not es_admin:
        if del_activa and atencion.delegacion != del_activa:
            messages.error(request, "Acceso denegado: No tienes autorización para gestionar atenciones de otra delegación.")
            return redirect('gestion_atenciones')

    if request.method == 'POST':
        nuevo_estado = request.POST.get('nuevo_estado', '').strip()
        estados_validos = ['Registrada', 'En proceso', 'Resuelta', 'Cancelada']
        if nuevo_estado in estados_validos:
            anterior = atencion.estado
            atencion.estado = nuevo_estado
            atencion.save()
            messages.success(request, f"¡Atención {atencion.codigo_atencion} actualizada exitosamente a '{nuevo_estado}'!")
        else:
            messages.error(request, "Estado no válido.")

    return redirect('gestion_atenciones')


@login_required
def gestion_atenciones_validar_evidencia(request, atencion_id):
    ctx = global_context(request)
    if not (ctx['permisos']['es_admin'] or ctx['permisos']['es_coordinador'] or ctx['permisos']['es_delegado']):
        messages.error(request, "Acceso denegado: No tienes autorización para auditar o validar evidencias.")
        return redirect('gestion_atenciones')

    atencion = get_object_or_404(AtencionCiudadana, id=atencion_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    # Scoping territorial
    if not es_admin:
        if del_activa and atencion.delegacion != del_activa:
            messages.error(request, "Acceso denegado: No puedes validar evidencias de otra delegación.")
            return redirect('gestion_atenciones')

    actividad = atencion.actividad
    if not actividad:
        messages.error(request, "Esta atención aún no tiene una actividad asociada para validar evidencias.")
        return redirect('gestion_atenciones')

    funcionario_actual = ctx['funcionario_actual']
    if not funcionario_actual:
        messages.error(request, "No se encontró un perfil de funcionario para registrar la validación.")
        return redirect('gestion_atenciones')

    if request.method == 'POST':
        resultado = request.POST.get('resultado_evidencia', 'Aprobado').strip()
        observaciones = request.POST.get('observaciones', f'Validación de evidencia para atención {atencion.codigo_atencion}').strip()
        if resultado not in {'Aprobado', 'Rechazado'}:
            messages.error(request, "El resultado de validación no es válido.")
            return redirect('gestion_atenciones')
        if resultado == 'Aprobado':
            evidence_files = actividad.evidencias.filter(
                Q(imagen__gt='') | Q(archivo__gt='')
            )
            has_before = evidence_files.filter(momento='antes').exists()
            has_after = evidence_files.filter(momento='despues').exists()
            if not has_before or not has_after:
                messages.error(
                    request,
                    "Para aprobar, adjunta al menos un archivo de evidencia de antes "
                    "y otro de después del trabajo.",
                )
                return redirect('gestion_atenciones')

        val, _ = ValidacionEvidencia.objects.get_or_create(
            actividad=actividad,
            defaults={
                'verificador': funcionario_actual,
                'resultado': resultado,
                'observaciones': observaciones
            }
        )
        val.resultado = resultado
        val.verificador = funcionario_actual
        val.observaciones = observaciones
        val.save()

        # Si se aprueba la evidencia, pasar la atención a Resuelta si estaba Registrada
        if resultado == 'Aprobado' and atencion.estado in ['Registrada', 'En proceso']:
            atencion.estado = 'Resuelta'
            atencion.save(update_fields=['estado'])

        messages.success(request, f"¡Evidencia {actividad.codigo_evidencia_unico} de atención {atencion.codigo_atencion} validada como '{resultado}'! El Semáforo SGR se ha actualizado.")

    return redirect('gestion_atenciones')


@login_required
def gestion_atenciones_subir_evidencia(request, atencion_id):
    ctx = global_context(request)
    if request.method != 'POST' or not ctx['permisos'].get('puede_ingresar_atencion', True):
        messages.error(request, "No tienes autorización para adjuntar evidencias.")
        return redirect('gestion_atenciones')

    atencion = get_object_or_404(
        AtencionCiudadana.objects.select_related('actividad', 'delegacion'),
        id=atencion_id,
    )
    es_admin = ctx['permisos']['es_admin']
    if not es_admin:
        delegacion_activa = ctx['delegacion_activa']
        if not delegacion_activa or atencion.delegacion != delegacion_activa:
            messages.error(request, "No puedes adjuntar evidencias a atenciones de otra delegación.")
            return redirect('gestion_atenciones')

    actividad = atencion.actividad
    if not actividad:
        messages.error(request, "Esta atención aún no tiene una actividad asociada.")
        return redirect('gestion_atenciones')
    if actividad.estado_validacion() == 'Aprobado':
        messages.error(request, "La evidencia ya fue aprobada y no se puede modificar.")
        return redirect('gestion_atenciones')

    momento = request.POST.get('momento', '').strip()
    imagenes = request.FILES.getlist('imagenes')
    archivos = request.FILES.getlist('archivos')
    if momento not in {'antes', 'despues'}:
        messages.error(request, "Selecciona si la evidencia corresponde al antes o después del trabajo.")
        return redirect('gestion_atenciones')
    if not imagenes and not archivos:
        messages.error(request, "Selecciona al menos una imagen o archivo para adjuntar.")
        return redirect('gestion_atenciones')

    try:
        imagenes = [forms.ImageField().clean(imagen) for imagen in imagenes]
    except ValidationError:
        messages.error(request, "Una de las imágenes no es válida. Selecciona archivos de imagen compatibles.")
        return redirect('gestion_atenciones')

    for imagen in imagenes:
        Evidencia.objects.create(
            actividad=actividad,
            imagen=imagen,
            momento=momento,
        )
    for archivo in archivos:
        Evidencia.objects.create(
            actividad=actividad,
            archivo=archivo,
            momento=momento,
        )

    validacion = ValidacionEvidencia.objects.filter(actividad=actividad).order_by('-created_at').first()
    if validacion:
        validacion.resultado = 'Pendiente'
        validacion.observaciones = "Se adjuntó nueva evidencia; requiere revisión."
        validacion.save(update_fields=['resultado', 'observaciones', 'updated_at'])

    messages.success(request, "La evidencia se adjuntó correctamente y quedó pendiente de revisión.")
    return redirect('gestion_atenciones')


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

    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()
    tipos = TipoGestion.objects.all()
    if q:
        tipos = tipos.filter(build_accent_query(['nombre', 'descripcion'], q))
    if filtro_estado:
        tipos = tipos.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('estado', 'Estado'),
    ]
    tipos, orden = _apply_list_ordering(tipos, request, orden_opciones, '-id')
    page_size = _get_page_size(request)
    total_tipos = tipos.count()
    page_obj = Paginator(tipos, page_size).get_page(request.GET.get('page', 1))

    return render(request, 'gestion/tipo_gestion.html', {
        'tipos': page_obj.object_list,
        'page_obj': page_obj,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_tipos': total_tipos,
    })


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
        messages.error(request, "Acceso denegado: Tu perfil no tiene permisos para ver o gestionar vecinos.")
        return redirect('gestion_inicio')

    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']
    todas_delegaciones = Delegacion.objects.filter(estado='Activa').order_by('id')

    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        rut = request.POST.get('rut', '').strip()
        direccion = request.POST.get('direccion', '').strip()
        telefono = request.POST.get('telefono', '').strip()
        sector_id = request.POST.get('sector_id')
        tipo_gestion_id = request.POST.get('tipo_gestion_id')
        estado = request.POST.get('estado', 'Activo')

        # La delegación queda estrictamente bloqueada según la delegación activa
        if del_activa:
            del_obj = del_activa
        elif es_admin:
            delegacion_id = request.POST.get('delegacion_id')
            del_obj = Delegacion.objects.filter(id=delegacion_id).first() if delegacion_id else Delegacion.objects.first()
        else:
            del_obj = None

        sector_obj = None
        if sector_id and sector_id.isdigit():
            sec_qs = Sector.objects.filter(id=int(sector_id), estado='Activo')
            if del_obj:
                sec_qs = sec_qs.filter(delegacion=del_obj)
            sector_obj = sec_qs.first()

        territorio = sector_obj.nombre if sector_obj else (request.POST.get('territorio', '').strip() or (del_obj.nombre if del_obj else ''))

        if nombre and rut:
            Vecino.objects.create(
                nombre=nombre,
                rut=rut,
                direccion=direccion,
                telefono=telefono,
                delegacion=del_obj,
                sector=sector_obj,
                territorio=territorio,
                tipo_gestion_id=tipo_gestion_id if tipo_gestion_id else None,
                estado=estado
            )
            messages.success(request, f"Vecino/a '{nombre}' registrado exitosamente en {del_obj.nombre if del_obj else 'el padrón'}.")
            return redirect('gestion_vecinos')
        else:
            messages.error(request, "El nombre y RUT son obligatorios.")

    q = request.GET.get('q', '').strip()
    filtro_delegacion_raw = request.GET.get('delegacion')
    filtro_delegacion = filtro_delegacion_raw.strip() if filtro_delegacion_raw is not None else None
    filtro_estado = request.GET.get('estado', '').strip()

    qs = Vecino.objects.select_related('tipo_gestion', 'delegacion', 'sector').order_by('-id')

    # Scoping territorial estricto
    delegacion_seleccionada = None
    if not es_admin:
        if del_activa:
            qs = qs.filter(Q(delegacion=del_activa) | (Q(delegacion__isnull=True) & Q(territorio__icontains=del_activa.nombre)))
        else:
            qs = qs.none()
        delegacion_seleccionada = del_activa
    else:
        if filtro_delegacion_raw is not None:
            # El administrador interactuó con el filtro de la tabla de forma independiente
            if filtro_delegacion and filtro_delegacion.isdigit():
                delegacion_seleccionada = Delegacion.objects.filter(id=int(filtro_delegacion), estado='Activa').first()
                if delegacion_seleccionada:
                    qs = qs.filter(delegacion=delegacion_seleccionada)
            else:
                # El administrador eligió explícitamente "Todas" en la tabla
                delegacion_seleccionada = None
        elif del_activa:
            # Si no viene en la URL, se inicializa con la delegación activa
            delegacion_seleccionada = del_activa
            qs = qs.filter(delegacion=del_activa)

    if q:
        qs = qs.filter(build_accent_query([
            'nombre', 'rut', 'direccion', 'territorio', 'sector__nombre', 'tipo_gestion__nombre',
            'delegacion__nombre',
        ], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('id', 'Más antiguos'),
        ('-id', 'Más recientes'),
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('rut', 'RUT'),
        ('delegacion__nombre', 'Delegación'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-id')

    tipos_gestion = TipoGestion.objects.all()
    page_size = _get_page_size(request)
    total_vecinos = qs.count()
    page_obj = Paginator(qs, page_size).get_page(request.GET.get('page', 1))

    if del_activa:
        sectores_vecinos = Sector.objects.filter(delegacion=del_activa, estado='Activo').order_by('nombre')
    elif delegacion_seleccionada:
        sectores_vecinos = Sector.objects.filter(delegacion=delegacion_seleccionada, estado='Activo').order_by('nombre')
    else:
        sectores_vecinos = Sector.objects.filter(estado='Activo').order_by('delegacion__nombre', 'nombre')

    return render(request, 'gestion/vecinos.html', {
        'vecinos': page_obj.object_list,
        'page_obj': page_obj,
        'tipos_gestion': tipos_gestion,
        'todas_delegaciones': todas_delegaciones,
        'delegacion_seleccionada': delegacion_seleccionada,
        'sectores': sectores_vecinos,
        'es_admin': es_admin,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_vecinos': total_vecinos
    })


@login_required
def gestion_vecinos_editar(request, vecino_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_vecinos']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    vecino = get_object_or_404(Vecino, id=vecino_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    # Control de acceso en servidor: denegar edición a vecinos fuera de su ámbito territorial
    if not es_admin:
        if vecino.delegacion and vecino.delegacion != del_activa:
            messages.error(request, "Acceso denegado: No tienes autorización para modificar información de vecinos de otra delegación.")
            return redirect('gestion_vecinos')

    if request.method == 'POST':
        vecino.nombre = request.POST.get('nombre', vecino.nombre).strip()
        vecino.rut = request.POST.get('rut', vecino.rut).strip()
        vecino.direccion = request.POST.get('direccion', vecino.direccion).strip()
        vecino.telefono = request.POST.get('telefono', vecino.telefono).strip()

        # Actualizar sector si fue seleccionado
        sec_id = request.POST.get('sector_id')
        if sec_id and sec_id.isdigit():
            sec_obj = Sector.objects.filter(id=int(sec_id)).first()
            if sec_obj:
                vecino.sector = sec_obj
                vecino.territorio = sec_obj.nombre
        else:
            vecino.territorio = request.POST.get('territorio', vecino.territorio).strip()

        if es_admin and not del_activa:
            del_id = request.POST.get('delegacion_id')
            if del_id:
                vecino.delegacion = Delegacion.objects.filter(id=del_id).first()
        elif del_activa:
            vecino.delegacion = del_activa

        tg_id = request.POST.get('tipo_gestion_id')
        vecino.tipo_gestion_id = tg_id if tg_id else None
        vecino.estado = request.POST.get('estado', vecino.estado)
        vecino.save()
        messages.success(request, f"Vecino/a '{vecino.nombre}' actualizado/a exitosamente.")
    return redirect('gestion_vecinos')


@login_required
def gestion_vecinos_eliminar(request, vecino_id):
    ctx = global_context(request)
    if not ctx['permisos']['ver_vecinos']:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_inicio')

    vecino = get_object_or_404(Vecino, id=vecino_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    # Control de acceso en servidor
    if not es_admin:
        if vecino.delegacion and vecino.delegacion != del_activa:
            messages.error(request, "Acceso denegado: No tienes autorización para eliminar vecinos de otra delegación.")
            return redirect('gestion_vecinos')

    if request.method == 'POST':
        nombre = vecino.nombre
        vecino.delete()
        messages.success(request, f"Vecino/a '{nombre}' eliminado/a.")
    return redirect('gestion_vecinos')


# --- 10. SECTORES Y TERRITORIOS POR DELEGACIÓN ---

@login_required
def gestion_sectores(request):
    ctx = global_context(request)
    if not ctx['permisos'].get('ver_sectores', True):
        messages.error(request, "Acceso denegado: No cuentas con permisos para gestionar sectores territoriales.")
        return redirect('gestion_inicio')

    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']
    todas_delegaciones = Delegacion.objects.filter(estado='Activa').order_by('id')

    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        codigo = request.POST.get('codigo', '').strip().upper()
        descripcion = request.POST.get('descripcion', '').strip()
        estado = request.POST.get('estado', 'Activo')

        if del_activa:
            del_obj = del_activa
        elif es_admin:
            delegacion_id = request.POST.get('delegacion_id')
            del_obj = Delegacion.objects.filter(id=delegacion_id).first() if delegacion_id else None
        else:
            del_obj = None

        if not nombre:
            messages.error(request, "El nombre del sector o territorio es obligatorio.")
        elif not del_obj:
            messages.error(request, "Debes seleccionar o contar con una delegación territorial activa.")
        else:
            if not codigo:
                count = Sector.all_objects.filter(delegacion=del_obj).count() + 1
                codigo = f"SEC{count:02d}"
            Sector.objects.create(
                codigo=codigo,
                nombre=nombre,
                delegacion=del_obj,
                descripcion=descripcion,
                estado=estado
            )
            messages.success(request, f"Sector/Territorio '{nombre}' registrado exitosamente para {del_obj.nombre}.")
            return redirect('gestion_sectores')

    q = request.GET.get('q', '').strip()
    filtro_delegacion_raw = request.GET.get('delegacion')
    filtro_delegacion = filtro_delegacion_raw.strip() if filtro_delegacion_raw is not None else None
    filtro_estado = request.GET.get('estado', '').strip()

    qs = Sector.objects.select_related('delegacion').order_by('delegacion__nombre', 'nombre')

    delegacion_seleccionada = None
    if not es_admin:
        if del_activa:
            qs = qs.filter(delegacion=del_activa)
        else:
            qs = qs.none()
        delegacion_seleccionada = del_activa
    else:
        if filtro_delegacion_raw is not None:
            if filtro_delegacion and filtro_delegacion.isdigit():
                delegacion_seleccionada = Delegacion.objects.filter(id=int(filtro_delegacion), estado='Activa').first()
                if delegacion_seleccionada:
                    qs = qs.filter(delegacion=delegacion_seleccionada)
            else:
                delegacion_seleccionada = None
        elif del_activa:
            delegacion_seleccionada = del_activa
            qs = qs.filter(delegacion=del_activa)

    if q:
        qs = qs.filter(build_accent_query(['codigo', 'nombre', 'descripcion', 'delegacion__nombre'], q))
    if filtro_estado:
        qs = qs.filter(estado__iexact=filtro_estado)

    orden_opciones = [
        ('nombre', 'Nombre A-Z'),
        ('-nombre', 'Nombre Z-A'),
        ('codigo', 'Código'),
        ('delegacion__nombre', 'Delegación'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, 'nombre')

    if request.GET.get('export') == 'excel':
        headers = ['Código', 'Sector / Territorio', 'Delegación', 'Descripción', 'Estado']
        rows = [[s.get_codigo(), s.nombre, s.delegacion.nombre, s.descripcion or '', s.estado] for s in qs]
        return export_to_excel_csv("sectores_territoriales", headers, rows)

    page_size = _get_page_size(request)
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(request.GET.get('page', 1))

    return render(request, 'gestion/sectores.html', {
        'page_obj': page_obj,
        'sectores': page_obj.object_list,
        'todas_delegaciones': todas_delegaciones,
        'delegacion_seleccionada': delegacion_seleccionada,
        'es_admin': es_admin,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_registros': qs.count()
    })


@login_required
def gestion_sectores_editar(request, sector_id):
    ctx = global_context(request)
    sector = get_object_or_404(Sector, id=sector_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    if not es_admin and del_activa and sector.delegacion != del_activa:
        messages.error(request, "Acceso denegado: No puedes modificar sectores de otra delegación.")
        return redirect('gestion_sectores')

    if request.method == 'POST':
        sector.nombre = request.POST.get('nombre', sector.nombre).strip()
        sector.codigo = request.POST.get('codigo', sector.codigo).strip().upper()
        sector.descripcion = request.POST.get('descripcion', sector.descripcion).strip()
        sector.estado = request.POST.get('estado', sector.estado)
        if es_admin and not del_activa:
            del_id = request.POST.get('delegacion_id')
            if del_id:
                del_obj = Delegacion.objects.filter(id=del_id).first()
                if del_obj:
                    sector.delegacion = del_obj
        sector.save()
        messages.success(request, f"Sector '{sector.nombre}' actualizado exitosamente.")
    return redirect('gestion_sectores')


@login_required
def gestion_sectores_eliminar(request, sector_id):
    ctx = global_context(request)
    sector = get_object_or_404(Sector, id=sector_id)
    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']

    if not es_admin and del_activa and sector.delegacion != del_activa:
        messages.error(request, "Acceso denegado.")
        return redirect('gestion_sectores')

    if request.method == 'POST':
        if Vecino.objects.filter(sector=sector).exists():
            messages.error(request, f"No se puede eliminar el sector '{sector.nombre}' porque está asignado a vecinos en el padrón.")
            return redirect('gestion_sectores')

        nombre = sector.nombre
        sector.delete()
        messages.success(request, f"Sector '{nombre}' eliminado exitosamente.")
    return redirect('gestion_sectores')


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
    if request.method == 'POST':
        fecha_actividad = request.POST.get('fecha_actividad', '').strip()
        descripcion = request.POST.get('descripcion_solicitud', '').strip()
        accion = request.POST.get('accion_ejecutada', '').strip()
        funcionario_id = request.POST.get('funcionario_id', '')
        item_id = request.POST.get('item_id', '')
        periodo_id = request.POST.get('periodo_id', '')

        if not all((fecha_actividad, descripcion, accion, funcionario_id, item_id, periodo_id)):
            messages.error(request, "Completa todos los campos obligatorios de la actividad.")
            return redirect('gestion_actividades')
        if not all(value.isdigit() for value in (funcionario_id, item_id, periodo_id)):
            messages.error(request, "Selecciona un funcionario, ítem y período válidos.")
            return redirect('gestion_actividades')

        funcionario = Funcionario.objects.filter(id=int(funcionario_id)).first()
        item = ItemMedicion.objects.filter(id=int(item_id)).first()
        periodo = Periodo.objects.filter(id=int(periodo_id)).first()
        if not all((funcionario, item, periodo)):
            messages.error(request, "Selecciona un funcionario, ítem y período válidos.")
            return redirect('gestion_actividades')

        try:
            fecha_actividad = forms.DateField().clean(fecha_actividad)
        except ValidationError:
            messages.error(request, "La fecha de la actividad no es válida.")
            return redirect('gestion_actividades')

        if not periodo.fecha_inicio <= fecha_actividad <= periodo.fecha_termino:
            messages.error(request, "La fecha de la actividad debe estar dentro del período seleccionado.")
            return redirect('gestion_actividades')

        actividad = Actividad.objects.create(
            fecha_actividad=fecha_actividad,
            descripcion_solicitud=descripcion,
            accion_ejecutada=accion,
            contacto_nombre=request.POST.get('contacto_nombre', '').strip(),
            contacto_telefono=request.POST.get('contacto_telefono', '').strip(),
            funcionario=funcionario,
            item=item,
            periodo=periodo,
        )
        messages.success(request, f"Actividad '{actividad.codigo_evidencia_unico}' registrada correctamente.")
        return redirect('gestion_actividades')

    q = request.GET.get('q', '').strip()
    filtro_validacion = request.GET.get('validacion', '').strip()
    actividades = Actividad.objects.select_related(
        'funcionario__user', 'item', 'periodo'
    ).prefetch_related('evidencias').annotate(
        estado_validacion_actual=Subquery(
            ValidacionEvidencia.objects.filter(
                actividad_id=OuterRef('pk')
            ).order_by('-created_at').values('resultado')[:1]
        )
    )
    if q:
        actividades = actividades.filter(build_accent_query([
            'codigo_evidencia_unico', 'descripcion_solicitud', 'accion_ejecutada',
            'contacto_nombre', 'funcionario__user__first_name',
            'funcionario__user__username', 'item__nombre_item',
        ], q))
        if filtro_validacion == 'Pendiente':
            actividades = actividades.filter(estado_validacion_actual__isnull=True)
        elif filtro_validacion in ('Aprobado', 'Rechazado'):
            actividades = actividades.filter(
                estado_validacion_actual__iexact=filtro_validacion
            )

    orden_opciones = [
        ('-fecha_actividad', 'Fecha: recientes primero'),
        ('fecha_actividad', 'Fecha: antiguas primero'),
        ('codigo_evidencia_unico', 'Código A-Z'),
        ('funcionario__user__first_name', 'Funcionario A-Z'),
        ('item__nombre_item', 'Ítem A-Z'),
    ]
    actividades, orden = _apply_list_ordering(
        actividades, request, orden_opciones, '-fecha_actividad'
    )
    page_size = _get_page_size(request)
    page_obj = Paginator(actividades, page_size).get_page(request.GET.get('page', 1))

    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()

    return render(request, 'gestion/actividades.html', {
        'actividades': page_obj.object_list,
        'page_obj': page_obj,
        'q': q,
        'filtro_validacion': filtro_validacion,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_registros': actividades.count(),
        'funcionarios': funcionarios,
        'items': items,
        'periodos': periodos,
    })

@login_required
def gestion_actividades_editar(request, actividad_id):
    actividad = get_object_or_404(Actividad, id=actividad_id)
    if request.method == 'POST':
        try:
            fecha_actividad = forms.DateField().clean(
                request.POST.get('fecha_actividad', '').strip()
            )
        except ValidationError:
            messages.error(request, "La fecha de la actividad no es válida.")
            return redirect('gestion_actividades')

        actividad.fecha_actividad = fecha_actividad
        actividad.descripcion_solicitud = request.POST.get(
            'descripcion_solicitud', actividad.descripcion_solicitud
        ).strip()
        actividad.accion_ejecutada = request.POST.get(
            'accion_ejecutada', actividad.accion_ejecutada
        ).strip()
        actividad.contacto_nombre = request.POST.get(
            'contacto_nombre', actividad.contacto_nombre
        ).strip()
        actividad.contacto_telefono = request.POST.get(
            'contacto_telefono', actividad.contacto_telefono
        ).strip()
        actividad.save()
        messages.success(request, "Actividad actualizada correctamente.")
    return redirect('gestion_actividades')

@login_required
def gestion_actividades_eliminar(request, actividad_id):
    actividad = get_object_or_404(Actividad, id=actividad_id)
    actividad.delete()
    return redirect('gestion_actividades')


@login_required
def gestion_agenda(request):
    q = request.GET.get('q', '').strip()
    filtro_estado = request.GET.get('estado', '').strip()
    compromisos = CompromisoAgenda.objects.select_related(
        'responsable__user', 'actividad_origen'
    ).all()
    if q:
        compromisos = compromisos.filter(build_accent_query([
            'solicitante', 'territorio', 'area_apoyo', 'observacion',
            'responsable__user__first_name', 'responsable__user__username',
        ], q))
    if filtro_estado:
        compromisos = compromisos.filter(estado__iexact=filtro_estado)
    orden_opciones = [
        ('-fecha_comprometida', 'Fecha: próximas primero'),
        ('fecha_comprometida', 'Fecha: lejanas primero'),
        ('solicitante', 'Solicitante A-Z'),
        ('-solicitante', 'Solicitante Z-A'),
        ('estado', 'Estado'),
    ]
    compromisos, orden = _apply_list_ordering(
        compromisos, request, orden_opciones, '-fecha_comprometida'
    )
    page_size = _get_page_size(request)
    page_obj = Paginator(compromisos, page_size).get_page(request.GET.get('page', 1))
    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')
    return render(request, 'gestion/agenda.html', {
        'compromisos': page_obj.object_list,
        'page_obj': page_obj,
        'q': q,
        'filtro_estado': filtro_estado,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_registros': compromisos.count(),
        'estados': CompromisoAgenda.objects.values_list(
            'estado', flat=True
        ).distinct().order_by('estado'),
        'funcionarios': funcionarios,
    })

@login_required
def gestion_agenda_editar(request, compromiso_id):
    return redirect('gestion_agenda')

@login_required
def gestion_agenda_eliminar(request, compromiso_id):
    return redirect('gestion_agenda')


@login_required
def gestion_configuracion(request):
    q = request.GET.get('q', '').strip()
    metas = ConfiguracionMeta.objects.select_related(
        'item', 'periodo', 'funcionario__user'
    ).all()
    if q:
        metas = metas.filter(build_accent_query([
            'item__nombre_item', 'item__descripcion', 'periodo__estado',
            'funcionario__user__first_name', 'funcionario__user__username',
        ], q))
    orden_opciones = [
        ('id', 'Más antiguas'),
        ('-id', 'Más recientes'),
        ('item__nombre_item', 'Ítem A-Z'),
        ('-item__nombre_item', 'Ítem Z-A'),
        ('periodo__fecha_inicio', 'Período: antiguos primero'),
        ('-periodo__fecha_inicio', 'Período: recientes primero'),
    ]
    metas, orden = _apply_list_ordering(metas, request, orden_opciones, '-id')
    page_size = _get_page_size(request)
    page_obj = Paginator(metas, page_size).get_page(request.GET.get('page', 1))
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()
    funcionarios = Funcionario.objects.select_related('user').all()
    return render(request, 'gestion/configuracion.html', {
        'metas': page_obj.object_list,
        'page_obj': page_obj,
        'q': q,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'total_registros': metas.count(),
        'items': items,
        'periodos': periodos,
        'funcionarios': funcionarios,
    })

@login_required
def gestion_configuracion_editar(request, meta_id):
    return redirect('gestion_configuracion')

@login_required
def gestion_configuracion_eliminar(request, meta_id):
    return redirect('gestion_configuracion')


@login_required
def gestion_evidencias_validar(request, actividad_id):
    ctx = global_context(request)
    if not (ctx['permisos']['es_admin'] or ctx['permisos']['es_coordinador']):
        messages.error(request, "Acceso denegado: Solo Administrador y Coordinador pueden validar evidencias SGR.")
        return redirect('gestion_reportes')

    actividad = get_object_or_404(Actividad, id=actividad_id)
    funcionario_actual = ctx['funcionario_actual']
    if not funcionario_actual:
        funcionario_actual = Funcionario.objects.first()

    if request.method == 'POST':
        resultado = request.POST.get('resultado', 'Aprobado').strip()
        observaciones = request.POST.get('observaciones', 'Validado desde panel de auditoría SGR').strip()

        val, _ = ValidacionEvidencia.objects.get_or_create(
            actividad=actividad,
            defaults={
                'verificador': funcionario_actual,
                'resultado': resultado,
                'observaciones': observaciones
            }
        )
        val.resultado = resultado
        val.verificador = funcionario_actual
        val.observaciones = observaciones
        val.save()

        messages.success(request, f"¡Evidencia {actividad.codigo_evidencia_unico} actualizada como '{resultado}'! El Semáforo SGR se ha recalculado.")

    referer = request.META.get('HTTP_REFERER')
    return redirect(referer if referer else 'gestion_reportes')


@login_required
def gestion_metas_simular_evidencia(request, meta_id):
    ctx = global_context(request)
    if not (ctx['permisos']['es_admin'] or ctx['permisos']['es_coordinador']):
        messages.error(request, "Acceso denegado: Solo Administrador y Coordinador pueden generar y validar evidencias.")
        return redirect('gestion_reportes')

    meta = get_object_or_404(ConfiguracionMeta, id=meta_id)
    funcionario_actual = ctx['funcionario_actual']
    func_destino = meta.funcionario or funcionario_actual or Funcionario.objects.first()

    if request.method == 'POST':
        hoy = timezone.now().date()
        fecha_act = hoy
        if meta.periodo.fecha_inicio <= hoy <= meta.periodo.fecha_termino:
            fecha_act = hoy
        elif hoy > meta.periodo.fecha_termino:
            fecha_act = meta.periodo.fecha_termino
        else:
            fecha_act = meta.periodo.fecha_inicio

        act = Actividad.objects.create(
            fecha_actividad=fecha_act,
            descripcion_solicitud=f"Operativo en terreno para cumplimiento de meta {meta.item.nombre_item}",
            accion_ejecutada=f"Ejecución verificada de requerimiento territorial para {meta.item.nombre_item}",
            funcionario=func_destino,
            item=meta.item,
            periodo=meta.periodo
        )
        ValidacionEvidencia.objects.create(
            actividad=act,
            verificador=funcionario_actual or func_destino,
            resultado='Aprobado',
            observaciones='Evidencia validada y aprobada para cumplimiento SGR.'
        )
        messages.success(request, f"¡Nueva evidencia aprobada para '{meta.item.nombre_item}'! Avance: {meta.calcular_avance()} de {meta.valor_objetivo} ({meta.porcentaje_cumplimiento()}% — Semáforo: {meta.estado_semaforo()}).")

    referer = request.META.get('HTTP_REFERER')
    return redirect(referer if referer else 'gestion_reportes')


@login_required
def gestion_reportes(request):
    ctx = global_context(request)
    if not ctx['permisos']['ver_reportes']:
        messages.error(request, "Acceso denegado: Se requiere perfil directivo para acceder a reportes.")
        return redirect('gestion_inicio')

    es_admin = ctx['permisos']['es_admin']
    del_activa = ctx['delegacion_activa']
    q = request.GET.get('q', '').strip()
    todas_delegaciones = Delegacion.objects.filter(estado='Activa').order_by('id')

    # Scoping territorial estricto en el servidor
    delegacion_seleccionada = None
    if es_admin:
        del_param = request.GET.get('delegacion', '').strip()
        if del_param and del_param.isdigit():
            delegacion_seleccionada = Delegacion.objects.filter(id=int(del_param), estado='Activa').first()
        elif del_param == 'todas':
            delegacion_seleccionada = None
        else:
            delegacion_seleccionada = None
    else:
        # Para delegados, coordinadores u otros roles no admin: bloqueo estricto a su delegación activa asignada
        delegacion_seleccionada = del_activa

    # Filtrar metas de desempeño SGR
    metas_qs = ConfiguracionMeta.objects.select_related(
        'periodo', 'item', 'funcionario', 'funcionario__delegacion', 'funcionario__user'
    ).order_by('id')

    if not es_admin:
        if del_activa:
            metas_qs = metas_qs.filter(funcionario__delegacion=del_activa)
        else:
            metas_qs = metas_qs.none()
    elif delegacion_seleccionada:
        metas_qs = metas_qs.filter(funcionario__delegacion=delegacion_seleccionada)

    if q:
        metas_qs = metas_qs.filter(build_accent_query([
            'item__nombre_item', 'item__descripcion', 'periodo__estado',
            'funcionario__user__first_name', 'funcionario__user__username',
        ], q))
    orden_opciones = [
        ('id', 'Más antiguas'),
        ('-id', 'Más recientes'),
        ('item__nombre_item', 'Ítem A-Z'),
        ('-item__nombre_item', 'Ítem Z-A'),
        ('periodo__fecha_inicio', 'Período: antiguo primero'),
        ('-periodo__fecha_inicio', 'Período: reciente primero'),
    ]
    metas_qs, orden = _apply_list_ordering(
        metas_qs, request, orden_opciones, '-id'
    )

    # Exportación a Excel/CSV respetando los permisos de delegación
    if request.GET.get('export') == 'excel':
        headers = [
            'Ítem de Medición', 'Período', 'Delegación', 'Asignación',
            'Meta Objetivo', 'Ponderación (%)', 'Cumplimiento (%)',
            'Cumplimiento Ponderado (%)', 'Estado Semáforo'
        ]
        rows = []
        for m in metas_qs:
            del_nombre = m.funcionario.delegacion.nombre if (m.funcionario and m.funcionario.delegacion) else "Global"
            asig_nombre = str(m.funcionario.user.first_name or m.funcionario.user.username) if m.funcionario else "Global Cargo"
            rows.append([
                str(m.item.nombre_item),
                str(m.periodo),
                del_nombre,
                asig_nombre,
                float(m.valor_objetivo) if m.valor_objetivo else 0,
                f"{m.ponderacion}%",
                f"{m.porcentaje_cumplimiento()}%",
                f"{m.cumplimiento_ponderado()}%",
                m.estado_semaforo()
            ])
        nom_del = delegacion_seleccionada.codigo if delegacion_seleccionada else ('todas' if es_admin else (del_activa.codigo if del_activa else 'delegacion'))
        return export_to_excel_csv(f"reportes_analiticos_{nom_del}", headers, rows)

    # Métricas y semáforos territoriales
    metas_list = list(metas_qs)
    verdes = sum(1 for m in metas_list if m.estado_semaforo() == 'VERDE')
    ambares = sum(1 for m in metas_list if m.estado_semaforo() == 'AMBAR')
    rojos = sum(1 for m in metas_list if m.estado_semaforo() == 'ROJO')
    page_size = _get_page_size(request)
    page_obj = Paginator(metas_list, page_size).get_page(request.GET.get('page', 1))

    # Validaciones y evidencias territoriales
    val_qs = ValidacionEvidencia.objects.select_related('actividad__funcionario__delegacion')
    if not es_admin:
        if del_activa:
            val_qs = val_qs.filter(actividad__funcionario__delegacion=del_activa)
        else:
            val_qs = val_qs.none()
    elif delegacion_seleccionada:
        val_qs = val_qs.filter(actividad__funcionario__delegacion=delegacion_seleccionada)

    total_val = val_qs.count()
    aprobadas = val_qs.filter(resultado__iexact='Aprobado').count()
    pct_aprobadas = round((aprobadas / total_val) * 100, 1) if total_val > 0 else 100.0
    pct_pendientes = round(100 - pct_aprobadas, 1) if total_val > 0 else 0.0

    # Atenciones ciudadanas territoriales
    atenciones_qs = AtencionCiudadana.objects.select_related('delegacion')
    if not es_admin:
        if del_activa:
            atenciones_qs = atenciones_qs.filter(delegacion=del_activa)
        else:
            atenciones_qs = atenciones_qs.none()
    elif delegacion_seleccionada:
        atenciones_qs = atenciones_qs.filter(delegacion=delegacion_seleccionada)

    total_atenciones = atenciones_qs.count()
    atenciones_resueltas = atenciones_qs.filter(estado__iexact='Resuelta').count()
    atenciones_proceso = atenciones_qs.filter(estado__iexact='En proceso').count()
    pct_resueltas = round((atenciones_resueltas / total_atenciones) * 100, 1) if total_atenciones > 0 else 0.0

    context = {
        'metas': page_obj.object_list,
        'page_obj': page_obj,
        'verdes': verdes,
        'ambares': ambares,
        'rojos': rojos,
        'total_val': total_val,
        'aprobadas_val': aprobadas,
        'pct_aprobadas': pct_aprobadas,
        'pct_pendientes': pct_pendientes,
        'total_atenciones': total_atenciones,
        'atenciones_resueltas': atenciones_resueltas,
        'atenciones_proceso': atenciones_proceso,
        'pct_resueltas': pct_resueltas,
        'total_metas': len(metas_list),
        'todas_delegaciones': todas_delegaciones,
        'delegacion_seleccionada': delegacion_seleccionada,
        'es_admin': es_admin,
        'q': q,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
    }
    return render(request, 'gestion/reportes.html', context)
