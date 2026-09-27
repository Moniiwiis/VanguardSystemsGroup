from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.gestion_inicio, name='gestion_inicio'),
    path('gestion/', views.gestion_inicio, name='gestion_inicio_alt'),

    # Funcionarios CRUD
    path('gestion/funcionarios/', views.gestion_funcionarios, name='gestion_funcionarios'),
    path('gestion/funcionarios/<int:funcionario_id>/editar/', views.gestion_funcionarios_editar, name='gestion_funcionarios_editar'),
    path('gestion/funcionarios/<int:funcionario_id>/eliminar/', views.gestion_funcionarios_eliminar, name='gestion_funcionarios_eliminar'),

    # Actividades CRUD
    path('gestion/actividades/', views.gestion_actividades, name='gestion_actividades'),
    path('gestion/actividades/<int:actividad_id>/editar/', views.gestion_actividades_editar, name='gestion_actividades_editar'),
    path('gestion/actividades/<int:actividad_id>/eliminar/', views.gestion_actividades_eliminar, name='gestion_actividades_eliminar'),

    # Agenda CRUD
    path('gestion/agenda/', views.gestion_agenda, name='gestion_agenda'),
    path('gestion/agenda/<int:compromiso_id>/editar/', views.gestion_agenda_editar, name='gestion_agenda_editar'),
    path('gestion/agenda/<int:compromiso_id>/eliminar/', views.gestion_agenda_eliminar, name='gestion_agenda_eliminar'),

    # Configuracion CRUD
    path('gestion/configuracion/', views.gestion_configuracion, name='gestion_configuracion'),
    path('gestion/configuracion/<int:meta_id>/editar/', views.gestion_configuracion_editar, name='gestion_configuracion_editar'),
    path('gestion/configuracion/<int:meta_id>/eliminar/', views.gestion_configuracion_eliminar, name='gestion_configuracion_eliminar'),

    # Reportes
    path('gestion/reportes/', views.gestion_reportes, name='gestion_reportes'),
]
