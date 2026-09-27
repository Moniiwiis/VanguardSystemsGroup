from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.models import User
from activities.models import Actividad, ValidacionEvidencia
from agenda.models import CompromisoAgenda
from configuration.models import ConfiguracionMeta, Periodo, ItemMedicion, CatalogoActividad
from accounts.models import Funcionario, Cargo, Delegacion

def gestion_inicio(request):
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
        'promedio_meta': promedio,
    }
    return render(request, 'gestion/inicio.html', context)

def gestion_funcionarios(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        identificador = request.POST.get('identificador_institucional')
        cargo_id = request.POST.get('cargo_id')
        delegacion_id = request.POST.get('delegacion_id')
        estado = request.POST.get('estado', 'Activo')

        if username and identificador and cargo_id:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'first_name': username}
            )
            Funcionario.objects.create(
                user=user,
                identificador_institucional=identificador,
                cargo_id=cargo_id,
                delegacion_id=delegacion_id if delegacion_id else None,
                estado=estado
            )
            messages.success(request, f"Funcionario '{username}' registrado correctamente.")
            return redirect('gestion_funcionarios')
        else:
            messages.error(request, "Por favor completa los campos obligatorios.")

    funcionarios = Funcionario.objects.select_related('user', 'cargo', 'delegacion').prefetch_related('funcionariorol_set__rol').all()[:50]
    cargos = Cargo.objects.all()
    delegaciones = Delegacion.objects.all()
    total_funcionarios = Funcionario.objects.count()
    activos = Funcionario.objects.filter(estado__iexact='Activo').count()
    total_delegaciones = delegaciones.count()

    context = {
        'funcionarios': funcionarios,
        'cargos': cargos,
        'delegaciones': delegaciones,
        'total_funcionarios': total_funcionarios,
        'activos': activos,
        'total_delegaciones': total_delegaciones,
    }
    return render(request, 'gestion/funcionarios.html', context)

def gestion_actividades(request):
    if request.method == 'POST':
        fecha = request.POST.get('fecha_actividad')
        solicitud = request.POST.get('descripcion_solicitud')
        accion = request.POST.get('accion_ejecutada')
        contacto_nombre = request.POST.get('contacto_nombre')
        contacto_telefono = request.POST.get('contacto_telefono')
        funcionario_id = request.POST.get('funcionario_id')
        item_id = request.POST.get('item_id')
        periodo_id = request.POST.get('periodo_id')

        if fecha and solicitud and accion and funcionario_id and item_id and periodo_id:
            Actividad.objects.create(
                fecha_actividad=fecha,
                descripcion_solicitud=solicitud,
                accion_ejecutada=accion,
                contacto_nombre=contacto_nombre,
                contacto_telefono=contacto_telefono,
                funcionario_id=funcionario_id,
                item_id=item_id,
                periodo_id=periodo_id
            )
            messages.success(request, "Actividad registrada con código de evidencia único autogenerado.")
            return redirect('gestion_actividades')
        else:
            messages.error(request, "Por favor completa los campos obligatorios para la actividad.")

    actividades = Actividad.objects.select_related('funcionario__user', 'item', 'periodo').all()[:50]
    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()

    context = {
        'actividades': actividades,
        'funcionarios': funcionarios,
        'items': items,
        'periodos': periodos,
    }
    return render(request, 'gestion/actividades.html', context)

def gestion_agenda(request):
    if request.method == 'POST':
        solicitante = request.POST.get('solicitante')
        territorio = request.POST.get('territorio')
        responsable_id = request.POST.get('responsable_id')
        area_apoyo = request.POST.get('area_apoyo')
        fecha_comp = request.POST.get('fecha_comprometida')
        observacion = request.POST.get('observacion')

        if solicitante and responsable_id and fecha_comp:
            CompromisoAgenda.objects.create(
                solicitante=solicitante,
                territorio=territorio,
                responsable_id=responsable_id,
                area_apoyo=area_apoyo,
                fecha_comprometida=fecha_comp,
                observacion=observacion,
                estado='Ingresado'
            )
            messages.success(request, "Compromiso de agenda ingresado exitosamente.")
            return redirect('gestion_agenda')
        else:
            messages.error(request, "Faltan campos requeridos para registrar el compromiso.")

    compromisos = CompromisoAgenda.objects.select_related('responsable__user', 'actividad_origen').all()[:50]
    funcionarios = Funcionario.objects.select_related('user').filter(estado='Activo')

    context = {
        'compromisos': compromisos,
        'funcionarios': funcionarios,
    }
    return render(request, 'gestion/agenda.html', context)

def gestion_configuracion(request):
    if request.method == 'POST':
        item_id = request.POST.get('item_id')
        periodo_id = request.POST.get('periodo_id')
        funcionario_id = request.POST.get('funcionario_id')
        objetivo = request.POST.get('valor_objetivo')
        ponderacion = request.POST.get('ponderacion')
        umbral = request.POST.get('umbral_minimo', 80.00)
        max_comp = request.POST.get('maximo_computable', 150.00)

        if item_id and periodo_id and objetivo and ponderacion:
            ConfiguracionMeta.objects.create(
                item_id=item_id,
                periodo_id=periodo_id,
                funcionario_id=funcionario_id if funcionario_id else None,
                valor_objetivo=objetivo,
                ponderacion=ponderacion,
                umbral_minimo=umbral,
                maximo_computable=max_comp
            )
            messages.success(request, "Meta configurada correctamente.")
            return redirect('gestion_configuracion')
        else:
            messages.error(request, "Completa los parámetros requeridos para crear la meta.")

    metas = ConfiguracionMeta.objects.select_related('item', 'periodo', 'funcionario__user').all()[:50]
    items = ItemMedicion.objects.all()
    periodos = Periodo.objects.all()
    funcionarios = Funcionario.objects.select_related('user').all()

    context = {
        'metas': metas,
        'items': items,
        'periodos': periodos,
        'funcionarios': funcionarios,
    }
    return render(request, 'gestion/configuracion.html', context)

def gestion_reportes(request):
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

