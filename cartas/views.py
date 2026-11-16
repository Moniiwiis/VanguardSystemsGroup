import csv
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import Http404, HttpResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from accounts.models import Delegacion
from core.context_processors import global_context
from .forms import CartaForm
from .models import Carta


def _acceso(request):
    ctx = global_context(request)
    permisos = ctx['permisos']
    if permisos.get('es_cliente') or not permisos.get('ver_atenciones'):
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
    qs = _alcance(request, ctx)
    # El alcance de edición es SIEMPRE la delegación del usuario, sin aceptar filtros GET.
    if not ctx['permisos'].get('es_admin'):
        qs = Carta.objects.filter(delegacion=ctx['delegacion_activa']) if ctx.get('delegacion_activa') else Carta.objects.none()
    else:
        qs = Carta.objects.all()
    return get_object_or_404(qs, pk=pk)


def _safe_csv(value):
    """Evita ejecución de fórmulas al abrir el CSV en Excel."""
    s = str(value if value is not None else '')
    return "'" + s if s.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')) else s


@login_required
def listado(request):
    ctx = _acceso(request)
    qs = _alcance(request, ctx)
    total_base = qs.count()
    totales = {status: qs.filter(estado=status).count() for status, _ in Carta.ESTADOS}
    q = request.GET.get('q', '').strip()[:150]
    estado = request.GET.get('estado', '').strip()
    if estado in dict(Carta.ESTADOS):
        qs = qs.filter(estado=estado)
    else:
        estado = ''
    if q:
        qs = qs.filter(
            Q(numero__icontains=q) | Q(remite__icontains=q) | Q(para__icontains=q)
            | Q(actividad_tema__icontains=q) | Q(encargado_seguimiento__icontains=q)
            | Q(derivada_a__icontains=q) | Q(unidad__icontains=q)
        )
    if request.GET.get('export') == 'csv':
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="tubo_cartas_sgr.csv"'
        response.write('\ufeff')
        writer = csv.writer(response, delimiter=';')
        writer.writerow(['Fecha', 'Nº', 'Para', 'Remite', 'Fono contacto', 'Actividad o tema', 'Fecha de la actividad', 'Encargado de seguimiento', 'Estado', 'Pronunciamiento', 'Derivada a', 'Observación', 'Unidad', 'Delegación'])
        for c in qs.iterator():
            writer.writerow([_safe_csv(x) for x in [c.fecha, c.numero, c.para, c.remite, c.fono_contacto, c.actividad_tema, c.fecha_actividad, c.encargado_seguimiento, c.estado, c.pronunciamiento, c.derivada_a, c.observacion, c.unidad, c.delegacion.nombre]])
        return response
    from django.core.paginator import Paginator
    page_obj = Paginator(qs, 20).get_page(request.GET.get('page'))
    ctx.update({
        'page_obj':page_obj, 'q_cartas':q, 'estado_filtro':estado,
        'total_cartas':total_base,'totales_cartas':totales,
        'estados_cartas':Carta.ESTADOS,
        'delegaciones_cartas': Delegacion.objects.filter(estado='Activa').order_by('nombre') if ctx['permisos'].get('es_admin') else [],
        'delegacion_filtro':request.GET.get('delegacion',''),
        'query_export':request.GET.urlencode(),
        'puede_editar_cartas':ctx['permisos'].get('puede_editar',False),
        'puede_eliminar_cartas':ctx['permisos'].get('es_admin',False),
    })
    return render(request, 'cartas/listado.html', ctx)


@login_required
def formulario(request, pk=None):
    ctx = _acceso(request)
    if not ctx['permisos'].get('puede_editar'):
        messages.error(request, 'No tienes permiso para modificar cartas.')
        return redirect('cartas_listado')
    carta = _registro(request,ctx,pk) if pk is not None else None
    if request.method == 'POST':
        form = CartaForm(request.POST, instance=carta)
        if form.is_valid():
            delegacion = carta.delegacion if carta else ctx.get('delegacion_activa')
            if not delegacion:
                messages.error(request,'Selecciona una delegación activa antes de registrar una carta.')
            else:
                obj = form.save(commit=False)
                obj.delegacion = delegacion
                if not carta:obj.creado_por=request.user
                obj.save()
                messages.success(request, 'Carta guardada correctamente.')
                return redirect('cartas_listado')
    else:
        form = CartaForm(instance=carta, initial={'fecha': timezone.localdate()} if carta is None else None)
    ctx.update({'form_carta':form,'carta':carta})
    return render(request,'cartas/formulario.html',ctx)


@login_required
def detalle(request,pk):
    ctx=_acceso(request)
    ctx['carta'] = _registro(request,ctx,pk)
    return render(request,'cartas/detalle.html',ctx)


@login_required
def eliminar(request, pk):
    """Solo un administrador puede borrar una carta, mediante POST y CSRF."""
    ctx = _acceso(request)
    if not ctx['permisos'].get('es_admin', False):
        messages.error(request, 'Solo un administrador puede eliminar cartas.')
        return redirect('cartas_listado')

    carta = _registro(request, ctx, pk)
    if request.method == 'POST':
        numero = carta.numero
        carta.delete()
        messages.success(request, f'La carta Nº {numero} fue eliminada correctamente.')
        return redirect('cartas_listado')
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET', 'POST'])
    ctx['carta'] = carta
    return render(request, 'cartas/confirmar_eliminar.html', ctx)
