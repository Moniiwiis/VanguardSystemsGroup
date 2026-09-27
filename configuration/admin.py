from django.contrib import admin
from django.db import models
from core.admin import BaseScopedModelAdmin
from .models import Periodo, CatalogoActividad, ItemMedicion, ConfiguracionMeta

@admin.register(Periodo)
class PeriodoAdmin(BaseScopedModelAdmin):
    list_display = ('id', 'fecha_inicio', 'fecha_termino', 'dias_computables', 'estado')
    list_filter = ('estado',)
    ordering = ('-fecha_inicio',)

@admin.register(CatalogoActividad)
class CatalogoActividadAdmin(BaseScopedModelAdmin):
    list_display = ('tipo_actividad', 'servicio', 'tipo_atencion', 'subtipo_atencion', 'estado')
    search_fields = ('tipo_actividad', 'servicio')
    list_filter = ('estado', 'tipo_actividad')

@admin.register(ItemMedicion)
class ItemMedicionAdmin(BaseScopedModelAdmin):
    list_display = ('nombre_item', 'cargo', 'catalogo', 'unidad_medida')
    search_fields = ('nombre_item', 'cargo__nombre_cargo')
    list_filter = ('cargo',)
    list_select_related = ('cargo', 'catalogo')

@admin.register(ConfiguracionMeta)
class ConfiguracionMetaAdmin(BaseScopedModelAdmin):
    list_display = ('item', 'periodo', 'funcionario', 'valor_objetivo', 'ponderacion', 'umbral_minimo', 'maximo_computable')
    list_filter = ('periodo', 'item__cargo')
    list_select_related = ('item', 'periodo', 'funcionario__user')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(
                models.Q(funcionario__delegacion=request.user.funcionario.delegacion) |
                models.Q(item__cargo=request.user.funcionario.cargo) |
                models.Q(funcionario=request.user.funcionario)
            ).distinct()
        return qs