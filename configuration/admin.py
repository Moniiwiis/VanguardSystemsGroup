from django.contrib import admin
from .models import Periodo, CatalogoActividad, ItemMedicion, ConfiguracionMeta

@admin.register(Periodo)
class PeriodoAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_inicio', 'fecha_termino', 'dias_computables', 'estado')
    list_filter = ('estado',)
    ordering = ('-fecha_inicio',)

@admin.register(CatalogoActividad)
class CatalogoActividadAdmin(admin.ModelAdmin):
    list_display = ('tipo_actividad', 'servicio', 'tipo_atencion', 'subtipo_atencion', 'estado')
    search_fields = ('tipo_actividad', 'servicio')
    list_filter = ('estado', 'tipo_actividad')

@admin.register(ItemMedicion)
class ItemMedicionAdmin(admin.ModelAdmin):
    list_display = ('nombre_item', 'cargo', 'catalogo', 'unidad_medida')
    search_fields = ('nombre_item', 'cargo__nombre_cargo')
    list_filter = ('cargo',)
    list_select_related = ('cargo', 'catalogo')

@admin.register(ConfiguracionMeta)
class ConfiguracionMetaAdmin(admin.ModelAdmin):
    list_display = ('item', 'periodo', 'funcionario', 'valor_objetivo', 'ponderacion', 'umbral_minimo', 'maximo_computable')
    list_filter = ('periodo', 'item__cargo')
    list_select_related = ('item', 'periodo', 'funcionario__user')