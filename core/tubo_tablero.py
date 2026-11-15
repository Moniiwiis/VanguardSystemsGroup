"""Vista adicional del Tablero Kanban del Tubo SGR.

Implementación aditiva: no reemplaza gestion_tubo, ni crea modelos, migraciones
ni cambia las reglas de negocio de las atenciones existentes.
"""
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import redirect, render

from accounts.models import Delegacion
from activities.models import AtencionCiudadana
from core.context_processors import global_context


@login_required
def gestion_tubo_tablero(request):
    ctx = global_context(request)
    permisos = ctx['permisos']
    if not (permisos.get('ver_atenciones') or permisos.get('ver_reportes') or permisos.get('es_admin')):
        return redirect('gestion_inicio')

    es_admin = permisos.get('es_admin', False)
    delegacion_activa = ctx.get('delegacion_activa')
    delegaciones = Delegacion.objects.filter(estado='Activa').order_by('nombre')
    delegacion_seleccionada = None
    atenciones = AtencionCiudadana.objects.filter(va_a_tubo=True).select_related(
        'delegacion', 'usuario_responsable', 'actividad', 'vecino', 'organizacion'
    )

    if es_admin:
        delegacion_id = request.GET.get('delegacion', '').strip()
        if delegacion_id.isdigit():
            delegacion_seleccionada = delegaciones.filter(pk=int(delegacion_id)).first()
            if delegacion_seleccionada is not None:
                atenciones = atenciones.filter(delegacion=delegacion_seleccionada)
    elif delegacion_activa is not None:
        delegacion_seleccionada = delegacion_activa
        atenciones = atenciones.filter(delegacion=delegacion_activa)
    else:
        atenciones = atenciones.none()

    busqueda = request.GET.get('q', '').strip()[:150]
    if busqueda:
        atenciones = atenciones.filter(
            Q(codigo_atencion__icontains=busqueda)
            | Q(solicitante__icontains=busqueda)
            | Q(descripcion__icontains=busqueda)
            | Q(area_apoyo__icontains=busqueda)
            | Q(usuario_responsable__username__icontains=busqueda)
            | Q(usuario_responsable__first_name__icontains=busqueda)
            | Q(usuario_responsable__last_name__icontains=busqueda)
        )

    # Mismas equivalencias de estado que la vista tabular vigente.
    columnas_config = (
        ('ingresados', '1. INGRESADOS', ('Registrada', 'Ingresado'), 'slate'),
        ('pendientes', '2. PENDIENTES', ('Pendiente',), 'red'),
        ('proceso', '3. EN PROCESO', ('En proceso',), 'amber'),
        ('realizados', '4. REALIZADOS', ('Resuelta', 'Realizado', 'REALIZADO'), 'green'),
    )
    columnas = []
    totales = {}
    limite_por_columna = 100

    for clave, titulo, estados, color in columnas_config:
        grupo = atenciones.filter(estado__in=estados).order_by('-created_at', '-id')
        cantidad = grupo.count()
        totales[clave] = cantidad
        columnas.append({
            'clave': clave,
            'titulo': titulo,
            'color': color,
            'cantidad': cantidad,
            'registros': list(grupo[:limite_por_columna]),
            'hay_mas': cantidad > limite_por_columna,
        })

    # Mantener el mismo denominador que los indicadores de la vista tabular: todas las
    # atenciones marcadas para Tubo, incluidas las canceladas (no visibles como columna).
    total = atenciones.count()
    cancelados = atenciones.filter(estado='Cancelada').count()
    realizados = totales['realizados']
    pendientes = totales['pendientes']
    porcentaje = round(realizados * 100 / total, 1) if total else 0
    porcentaje_pendientes = round(pendientes * 100 / total, 1) if total else 0

    ctx.update({
        'columnas_tablero': columnas,
        'total_tubo_tablero': total,
        'total_cancelados_tablero': cancelados,
        'realizados_tablero': realizados,
        'proceso_tablero': totales['proceso'],
        'pendientes_tablero': pendientes,
        'porcentaje_tubo_tablero': porcentaje,
        'porcentaje_pendientes_tablero': porcentaje_pendientes,
        'alerta_tubo_tablero': porcentaje_pendientes > 10,
        'busqueda_tablero': busqueda,
        'es_admin': es_admin,
        'delegaciones_tablero': delegaciones if es_admin else [],
        'delegacion_seleccionada_tablero': delegacion_seleccionada,
    })
    return render(request, 'gestion/tubo_tablero.html', ctx)
