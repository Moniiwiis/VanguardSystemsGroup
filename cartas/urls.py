from django.urls import path
from . import views

urlpatterns = [
    path('', views.listado, name='cartas_listado'),
    path('nueva/', views.formulario, name='cartas_nueva'),
    path('<int:pk>/', views.detalle, name='cartas_detalle'),
    path('<int:pk>/editar/', views.formulario, name='cartas_editar'),
    path('<int:pk>/estado/', views.cambiar_estado, name='cartas_cambiar_estado'),
    path('<int:pk>/eliminar/', views.eliminar, name='cartas_eliminar'),
]
