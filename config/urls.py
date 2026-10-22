from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Flow
    path('login/', views.login_view, name='login'),
    path('accounts/login/', views.login_view, name='accounts_login'),
    path('logout/', views.logout_view, name='logout'),
    path('recuperar-contrasena/', views.recuperar_contrasena_view, name='recuperar_contrasena'),
    path('reenviar-codigo/', views.reenviar_codigo_view, name='reenviar_codigo'),
    path('validar-codigo/', views.validar_codigo_view, name='validar_codigo'),
    path('nueva-contrasena/', views.nueva_contrasena_view, name='nueva_contrasena'),
    path('cambiar-contrasena-inicial/', views.cambiar_contrasena_inicial_view, name='cambiar_contrasena_inicial'),

    # Contexto y APIs
    path('gestion/cambiar-delegacion/<int:del_id>/', views.cambiar_delegacion_view, name='cambiar_delegacion'),
    path('gestion/api/subatenciones/<int:tipo_id>/', views.api_subatenciones, name='api_subatenciones'),
    path('gestion/api/sectores/<int:delegacion_id>/', views.api_sectores_por_delegacion, name='api_sectores'),

    # Inicio
    path('', views.gestion_inicio, name='gestion_inicio'),
    path('gestion/', views.gestion_inicio, name='gestion_inicio_alt'),

    # Mantenedores (PDF Wireframes)
    # 1. Delegaciones Municipales
    path('gestion/delegaciones/', views.gestion_delegaciones, name='gestion_delegaciones'),
    path('gestion/delegaciones/<int:del_id>/editar/', views.gestion_delegaciones_editar, name='gestion_delegaciones_editar'),
    path('gestion/delegaciones/<int:del_id>/eliminar/', views.gestion_delegaciones_eliminar, name='gestion_delegaciones_eliminar'),

    # 2. Usuarios
    path('gestion/usuarios/', views.gestion_usuarios, name='gestion_usuarios'),
    path('gestion/usuarios/<int:user_id>/editar/', views.gestion_usuarios_editar, name='gestion_usuarios_editar'),
    path('gestion/usuarios/<int:user_id>/eliminar/', views.gestion_usuarios_eliminar, name='gestion_usuarios_eliminar'),

    # 3. Roles
    path('gestion/roles/', views.gestion_roles, name='gestion_roles'),
    path('gestion/roles/<int:rol_id>/editar/', views.gestion_roles_editar, name='gestion_roles_editar'),
    path('gestion/roles/<int:rol_id>/eliminar/', views.gestion_roles_eliminar, name='gestion_roles_eliminar'),

    # 4. Metas
    path('gestion/metas/', views.gestion_metas, name='gestion_metas'),
    path('gestion/metas/<int:item_id>/editar/', views.gestion_metas_editar, name='gestion_metas_editar'),
    path('gestion/metas/<int:item_id>/eliminar/', views.gestion_metas_eliminar, name='gestion_metas_eliminar'),

    # 5. Tipo de Atención
    path('gestion/tipo-atencion/', views.gestion_tipo_atencion, name='gestion_tipo_atencion'),
    path('gestion/tipo-atencion/<int:tipo_id>/editar/', views.gestion_tipo_atencion_editar, name='gestion_tipo_atencion_editar'),
    path('gestion/tipo-atencion/<int:tipo_id>/eliminar/', views.gestion_tipo_atencion_eliminar, name='gestion_tipo_atencion_eliminar'),

    # 6. Sub Atención
    path('gestion/sub-atencion/', views.gestion_sub_atencion, name='gestion_sub_atencion'),
    path('gestion/sub-atencion/<int:sub_id>/editar/', views.gestion_sub_atencion_editar, name='gestion_sub_atencion_editar'),
    path('gestion/sub-atencion/<int:sub_id>/eliminar/', views.gestion_sub_atencion_eliminar, name='gestion_sub_atencion_eliminar'),

    # 7. Atenciones
    path('gestion/atenciones/', views.gestion_atenciones, name='gestion_atenciones'),
    path('gestion/atenciones/<int:atencion_id>/estado/', views.gestion_atenciones_estado, name='gestion_atenciones_estado'),
    path('gestion/atenciones/<int:atencion_id>/validar-evidencia/', views.gestion_atenciones_validar_evidencia, name='gestion_atenciones_validar_evidencia'),
    path('gestion/atenciones/<int:atencion_id>/evidencia/', views.gestion_atenciones_subir_evidencia, name='gestion_atenciones_subir_evidencia'),
    path('gestion/evidencias/<int:actividad_id>/validar/', views.gestion_evidencias_validar, name='gestion_evidencias_validar'),
    path('gestion/metas/<int:meta_id>/simular-evidencia/', views.gestion_metas_simular_evidencia, name='gestion_metas_simular_evidencia'),

    # 8. Tipo de Gestión
    path('gestion/tipo-gestion/', views.gestion_tipo_gestion, name='gestion_tipo_gestion'),
    path('gestion/tipo-gestion/<int:tg_id>/editar/', views.gestion_tipo_gestion_editar, name='gestion_tipo_gestion_editar'),
    path('gestion/tipo-gestion/<int:tg_id>/eliminar/', views.gestion_tipo_gestion_eliminar, name='gestion_tipo_gestion_eliminar'),

    # 9. Vecinos CRUD
    path('gestion/vecinos/', views.gestion_vecinos, name='gestion_vecinos'),
    path('gestion/vecinos/<int:vecino_id>/editar/', views.gestion_vecinos_editar, name='gestion_vecinos_editar'),
    path('gestion/vecinos/<int:vecino_id>/eliminar/', views.gestion_vecinos_eliminar, name='gestion_vecinos_eliminar'),

    # 10. Sectores / Territorios CRUD
    path('gestion/sectores/', views.gestion_sectores, name='gestion_sectores'),
    path('gestion/sectores/<int:sector_id>/editar/', views.gestion_sectores_editar, name='gestion_sectores_editar'),
    path('gestion/sectores/<int:sector_id>/eliminar/', views.gestion_sectores_eliminar, name='gestion_sectores_eliminar'),

    # Legacy routes
    path('gestion/funcionarios/', views.gestion_funcionarios, name='gestion_funcionarios'),
    path('gestion/funcionarios/<int:funcionario_id>/editar/', views.gestion_funcionarios_editar, name='gestion_funcionarios_editar'),
    path('gestion/funcionarios/<int:funcionario_id>/eliminar/', views.gestion_funcionarios_eliminar, name='gestion_funcionarios_eliminar'),

    path('gestion/actividades/', views.gestion_actividades, name='gestion_actividades'),
    path('gestion/actividades/<int:actividad_id>/editar/', views.gestion_actividades_editar, name='gestion_actividades_editar'),
    path('gestion/actividades/<int:actividad_id>/eliminar/', views.gestion_actividades_eliminar, name='gestion_actividades_eliminar'),

    path('gestion/agenda/', views.gestion_agenda, name='gestion_agenda'),
    path('gestion/agenda/<int:compromiso_id>/editar/', views.gestion_agenda_editar, name='gestion_agenda_editar'),
    path('gestion/agenda/<int:compromiso_id>/eliminar/', views.gestion_agenda_eliminar, name='gestion_agenda_eliminar'),

    path('gestion/configuracion/', views.gestion_configuracion, name='gestion_configuracion'),
    path('gestion/configuracion/<int:meta_id>/editar/', views.gestion_configuracion_editar, name='gestion_configuracion_editar'),
    path('gestion/configuracion/<int:meta_id>/eliminar/', views.gestion_configuracion_eliminar, name='gestion_configuracion_eliminar'),

    path('gestion/reportes/', views.gestion_reportes, name='gestion_reportes'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
