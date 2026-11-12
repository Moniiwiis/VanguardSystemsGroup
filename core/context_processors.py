from accounts.models import Delegacion, Funcionario, FuncionarioRol, Rol

def global_context(request):
    if not request.user.is_authenticated:
        return {
            'user_rol_name': 'Invitado',
            'delegacion_activa': None,
            'delegaciones_autorizadas': [],
            'can_switch_delegacion': False,
            'permisos': {}
        }

    # Obtener funcionario asociado
    funcionario = Funcionario.all_objects.filter(user=request.user).first()

    # Determinar rol principal
    rol_name = "Operador"
    if request.user.is_superuser:
        rol_name = "Administrador"
    elif funcionario:
        f_rol = FuncionarioRol.objects.filter(funcionario=funcionario).select_related('rol').first()
        if f_rol and f_rol.rol:
            rol_name = f_rol.rol.nombre_rol
        elif request.user.is_staff:
            rol_name = "Administrador"

    # Determinar alcance de delegaciones
    es_admin = (rol_name.lower() in ['administrador', 'superadministrador']) or request.user.is_superuser
    todas_activas = list(Delegacion.objects.filter(estado='Activa').order_by('id'))

    delegacion_activa = None
    if es_admin:
        delegaciones_autorizadas = todas_activas
        can_switch = True
        delegacion_sesion_id = request.session.get('delegacion_activa_id')
        if delegacion_sesion_id and delegacion_sesion_id != 'global' and str(delegacion_sesion_id) != '0':
            delegacion_activa = Delegacion.objects.filter(id=delegacion_sesion_id, estado='Activa').first()
        elif delegacion_sesion_id is None and funcionario and funcionario.delegacion:
            delegacion_activa = funcionario.delegacion
            request.session['delegacion_activa_id'] = delegacion_activa.id
        else:
            delegacion_activa = None  # Ámbito Global comunal
    else:
        # Fijo estrictamente en su delegación asignada para delegados y otros usuarios no admin
        if funcionario and funcionario.delegacion:
            delegacion_activa = funcionario.delegacion
            delegaciones_autorizadas = [funcionario.delegacion]
            request.session['delegacion_activa_id'] = delegacion_activa.id
        elif todas_activas:
            delegacion_activa = todas_activas[0]
            delegaciones_autorizadas = [delegacion_activa]
        else:
            delegaciones_autorizadas = []
        can_switch = False

    # Permisos por rol para visualización de menús y acceso (Página 10 del documento)
    # Roles definidos: Administrador, Coordinador, Delegado Municipal, Operador/Funcionario, Consultor, Cliente
    es_coordinador = es_admin or ('coordinador' in rol_name.lower())
    es_delegado = es_admin or ('delegado' in rol_name.lower())
    es_operador = ('operador' in rol_name.lower()) or ('funcionario' in rol_name.lower())
    es_consultor = ('consultor' in rol_name.lower()) or ('lector' in rol_name.lower())
    es_cliente = ('cliente' in rol_name.lower())

    permisos = {
        'es_admin': es_admin,
        'es_coordinador': es_coordinador,
        'es_delegado': es_delegado,
        'es_operador': es_operador,
        'es_consultor': es_consultor,
        'es_cliente': es_cliente,
        'puede_crear': not (es_consultor or es_cliente),
        'puede_editar': not (es_consultor or es_cliente),
        'puede_eliminar': es_admin or es_coordinador or es_delegado,
        'puede_ingresar_atencion': not (es_consultor or es_cliente),
        'puede_cambiar_estado_atencion': not (es_consultor or es_cliente),
        # Módulos permitidos en el menú lateral:
        'ver_inicio': not es_cliente,
        'ver_delegaciones': es_admin,
        'ver_roles': es_admin,
        'ver_usuarios': es_admin or es_delegado,
        'ver_metas': es_admin or es_coordinador,
        'ver_tipo_atencion': es_admin or es_coordinador,
        'ver_sub_atencion': es_admin or es_coordinador,
        'ver_atenciones': not es_cliente,
        'ver_organizaciones': not es_cliente,
        'ver_tipo_gestion': es_admin or es_coordinador,
        'ver_vecinos': not es_cliente,
        'ver_sectores': not es_cliente,
        'ver_reportes': es_admin or es_coordinador or es_delegado,
        'ver_portal_cliente': es_cliente,
    }

    return {
        'funcionario_actual': funcionario,
        'user_rol_name': rol_name,
        'delegacion_activa': delegacion_activa,
        'delegaciones_autorizadas': delegaciones_autorizadas,
        'can_switch_delegacion': can_switch,
        'permisos': permisos,
    }
