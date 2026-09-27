"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.gestion_inicio, name='gestion_inicio'),
    path('gestion/', views.gestion_inicio, name='gestion_inicio_alt'),
    path('gestion/funcionarios/', views.gestion_funcionarios, name='gestion_funcionarios'),
    path('gestion/actividades/', views.gestion_actividades, name='gestion_actividades'),
    path('gestion/agenda/', views.gestion_agenda, name='gestion_agenda'),
    path('gestion/configuracion/', views.gestion_configuracion, name='gestion_configuracion'),
    path('gestion/reportes/', views.gestion_reportes, name='gestion_reportes'),
]


