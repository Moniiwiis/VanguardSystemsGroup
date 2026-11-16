from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.models import Delegacion, Funcionario
from configuration.models import AreaApoyo
from core.context_processors import global_context
from core.utils import build_accent_query, export_to_excel_xlsx
from core.views import _apply_list_ordering, _funcionarios_municipales_qs, _get_page_size
from .forms import CartaForm
from .models import Carta


EXCEL_UNIDADES_CARTAS = [
    'Alcaldía',
    'Asesoría Jurídica',
    'Delegación Avenida del Mar',
    'Delegado',
    'DISERCO',
    'DOM',
    'Fomento',
    'Gabinete',
    'Patentes',
    'Patrocinios',
    'Seguridad Ciudadana',
    'Tránsito',
    'Turismo',
]


def _acceso(request):
    ctx = global_context(request)
    permisos = ctx['permisos']
    if permisos.get('es_cliente') or not (permisos.get('ver_atenciones') or permisos.get('es_admin')):
        raise Http404('Módulo no disponible')
    return ctx


def _alcance(request, ctx):
    qs = Carta.objects.select_related('delegacion', 'creado_por')
    if ctx['permisos'].get('es_admin'):
        id_del = request.GET.get('delegacion', '').strip()
        if id_del:
            if not id_del.isdigit():
                return qs.none()
            qs = qs.filter(delegacion_id=int(id_del))
    elif ctx.get('delegacion_activa'):
        qs = qs.filter(delegacion=ctx['delegacion_activa'])
    else:
        qs = qs.none()
    return qs


def _registro(request, ctx, pk):
    if not ctx['permisos'].get('es_admin'):
        qs = (
            Carta.objects.filter(delegacion=ctx['delegacion_activa'])
            if ctx.get('delegacion_activa')
            else Carta.objects.none()
        )
    else:
        qs = Carta.objects.all()
    return get_object_or_404(qs, pk=pk)


def _catalogos_cartas(delegacion):
    """Construye opciones buscables para Encargado de Seguimiento y Derivada a."""
    items = []
    seen = set()

    def _add(label, meta='', search=''):
        key = label.strip()
        if not key or key.casefold() in seen:
            return
        seen.add(key.casefold())
        items.append({'label': key, 'meta': meta, 'search': search or f"{key} {meta}".strip()})

    funcs = _funcionarios_municipales_qs(
        Funcionario.objects.filter(estado__iexact='Activo', user__is_active=True)
    ).select_related('user', 'cargo', 'delegacion').order_by('user__first_name', 'user__username')
    if delegacion:
        funcs = funcs.filter(delegacion=delegacion)
    for f in funcs:
        cargo = f.cargo.nombre_cargo if f.cargo else 'Funcionario'
        del_n = f.delegacion.nombre if f.delegacion else ''
        _add(f.get_nombre_corto(), f"{cargo}{' · ' + del_n if del_n else ''}")

    for aa in AreaApoyo.objects.filter(estado='Activo').order_by('nombre'):
        _add(aa.nombre, aa.tipo)

    for u in EXCEL_UNIDADES_CARTAS:
        _add(u, 'Unidad / Departamento Municipal')

    return items


@login_required
def listado(request):
    ctx = _acceso(request)
    qs_base = _alcance(request, ctx)
    total_base = qs_base.count()
    totales = {status: qs_base.filter(estado=status).count() for status, _ in Carta.ESTADOS}
    total_unidades = qs_base.filter(unidad='1').count()

    q = request.GET.get('q', '').strip()[:150]
    estado = request.GET.get('estado', '').strip()
    para_filtro = request.GET.get('para', '').strip()
    pron_filtro = request.GET.get('pronunciamiento', '').strip()

    qs = qs_base
    if estado in dict(Carta.ESTADOS):
        qs = qs.filter(estado=estado)
    else:
        estado = ''
    if para_filtro in dict(Carta.PARA_CHOICES):
        qs = qs.filter(para=para_filtro)
    else:
        para_filtro = ''
    if pron_filtro in dict(Carta.PRONUNCIAMIENTO_CHOICES):
        qs = qs.filter(pronunciamiento=pron_filtro)
    else:
        pron_filtro = ''

    if q:
        qs = qs.filter(
            build_accent_query(
                [
                    'numero', 'remite', 'para', 'actividad_tema',
                    'encargado_seguimiento', 'derivada_a', 'pronunciamiento', 'observacion',
                ],
                q,
            )
        )

    orden_opciones = [
        ('-fecha', 'Más recientes'),
        ('fecha', 'Más antiguas'),
        ('numero', 'N° Carta A-Z'),
        ('-id', 'Último ingreso'),
        ('estado', 'Estado'),
    ]
    qs, orden = _apply_list_ordering(qs, request, orden_opciones, '-fecha')

    if request.GET.get('export') in {'excel', 'csv'}:
        headers = [
            'Fecha', 'Nº', 'Para', 'Remite', 'Fono contacto', 'Actividad o tema',
            'Fecha de la actividad', 'Encargado de seguimiento', 'Estado',
            'Pronunciamiento', 'Derivada a', 'Observación', 'Unidad', 'Delegación',
        ]
        rows = [
            [
                c.fecha.strftime('%d/%m/%Y') if c.fecha else '',
                c.numero or 'S/N',
                c.para,
                c.remite,
                c.fono_contacto or '',
                c.actividad_tema,
                c.fecha_actividad or '',
                c.encargado_seguimiento or '',
                c.estado and c.get_estado_display() or '',
                c.get_pronunciamiento_display() if c.pronunciamiento else 'No aplica',
                c.derivada_a or '',
                c.observacion or '',
                c.unidad or '1',
                c.delegacion.nombre if c.delegacion else '',
            ]
            for c in qs.iterator()
        ]
        return export_to_excel_xlsx("TuboCartas", "Tubo de Cartas", headers, rows)

    page_size = _get_page_size(request)
    page_obj = Paginator(qs, page_size).get_page(request.GET.get('page', 1))

    delegacion_filtro = request.GET.get('delegacion', '').strip()
    delegacion_seleccionada = (
        Delegacion.objects.filter(id=int(delegacion_filtro), estado='Activa').first()
        if (ctx['permisos'].get('es_admin') and delegacion_filtro.isdigit())
        else None
    )

    params = request.GET.copy()
    params.pop('page', None)
    params.pop('export', None)

    ctx.update({
        'page_obj': page_obj,
        'q_cartas': q,
        'estado_filtro': estado,
        'para_filtro': para_filtro,
        'pron_filtro': pron_filtro,
        'total_cartas': total_base,
        'total_unidades': total_unidades,
        'total_en_proceso': totales.get('EN PROCESO', 0),
        'total_aprobadas': totales.get('APROBADA', 0),
        'total_finalizadas': totales.get('FINALIZADA', 0),
        'total_no_aplica': totales.get('NO APLICA', 0),
        'total_registros': qs.count(),
        'totales_cartas': totales,
        'estados_cartas': Carta.ESTADOS,
        'para_choices': Carta.PARA_CHOICES,
        'pron_choices': Carta.PRONUNCIAMIENTO_CHOICES,
        'delegaciones_cartas': Delegacion.objects.filter(estado='Activa').order_by('id') if ctx['permisos'].get('es_admin') else [],
        'delegacion_filtro': delegacion_filtro,
        'delegacion_seleccionada': delegacion_seleccionada,
        'orden': orden,
        'orden_opciones': orden_opciones,
        'page_size': page_size,
        'query_params': params.urlencode(),
        'query_export': params.urlencode(),
        'puede_editar_cartas': ctx['permisos'].get('puede_editar', False),
        'puede_eliminar_cartas': ctx['permisos'].get('es_admin', False),
    })
    return render(request, 'cartas/listado.html', ctx)


@login_required
def formulario(request, pk=None):
    ctx = _acceso(request)
    if not ctx['permisos'].get('puede_editar'):
        messages.error(request, 'No tienes permiso para modificar cartas.')
        return redirect('cartas_listado')
    carta = _registro(request, ctx, pk) if pk is not None else None
    delegacion_ref = carta.delegacion if carta else ctx.get('delegacion_activa')
    if request.method == 'POST':
        form = CartaForm(request.POST, instance=carta)
        if form.is_valid():
            if not delegacion_ref:
                messages.error(request, 'Selecciona una delegación activa antes de registrar una carta.')
            else:
                obj = form.save(commit=False)
                obj.delegacion = delegacion_ref
                if not carta:
                    obj.creado_por = request.user
                obj.save()
                messages.success(request, 'Carta guardada correctamente.')
                return redirect('cartas_listado')
    else:
        form = CartaForm(instance=carta, initial={'fecha': timezone.localdate()} if carta is None else None)

    catalogo_personas_unidades = _catalogos_cartas(delegacion_ref)
    ctx.update({
        'form_carta': form,
        'carta': carta,
        'catalogo_cartas_items': catalogo_personas_unidades,
    })
    return render(request, 'cartas/formulario.html', ctx)


@login_required
def detalle(request, pk):
    ctx = _acceso(request)
    ctx['carta'] = _registro(request, ctx, pk)
    return render(request, 'cartas/detalle.html', ctx)


@login_required
def eliminar(request, pk):
    """Solo un administrador puede borrar una carta, mediante POST y CSRF."""
    ctx = _acceso(request)
    if not ctx['permisos'].get('es_admin', False):
        messages.error(request, 'Solo un administrador puede eliminar cartas.')
        return redirect('cartas_listado')

    carta = _registro(request, ctx, pk)
    if request.method == 'POST':
        numero = carta.numero or 'S/N'
        carta.delete()
        messages.success(request, f'La carta Nº {numero} fue eliminada correctamente.')
        return redirect('cartas_listado')
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET', 'POST'])
    ctx['carta'] = carta
    return render(request, 'cartas/confirmar_eliminar.html', ctx)
