from django.contrib import admin
from core.admin import BaseScopedModelAdmin
from .models import CompromisoAgenda, AjusteDesempenio

@admin.register(CompromisoAgenda)
class CompromisoAgendaAdmin(BaseScopedModelAdmin):
    list_display = ('solicitante', 'responsable', 'get_delegacion', 'fecha_comprometida', 'estado', 'territorio')
    search_fields = ('solicitante', 'responsable__user__username', 'territorio')
    list_filter = ('estado', 'fecha_comprometida')
    date_hierarchy = 'fecha_comprometida'
    list_select_related = ('responsable__user', 'responsable__delegacion', 'actividad_origen')
    actions = ['marcar_como_realizado', 'marcar_como_en_proceso']

    @admin.display(description='Delegación', ordering='responsable__delegacion__nombre')
    def get_delegacion(self, obj):
        return obj.responsable.delegacion.nombre if (obj.responsable and obj.responsable.delegacion) else "-"

    @admin.action(description="Marcar compromisos seleccionados como 'Realizado'")
    def marcar_como_realizado(self, request, queryset):
        updated = queryset.update(estado='Realizado')
        self.message_user(request, f"{updated} compromisos marcados como Realizados.")

    @admin.action(description="Marcar compromisos seleccionados como 'En proceso'")
    def marcar_como_en_proceso(self, request, queryset):
        updated = queryset.update(estado='En proceso')
        self.message_user(request, f"{updated} compromisos actualizados a En proceso.")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(responsable__delegacion=request.user.funcionario.delegacion)
        return qs

@admin.register(AjusteDesempenio)
class AjusteDesempenioAdmin(BaseScopedModelAdmin):
    list_display = ('funcionario', 'periodo', 'concepto', 'valor_porcentaje', 'autorizador')
    list_filter = ('periodo', 'concepto')
    list_select_related = ('funcionario__user', 'periodo', 'autorizador__user')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(funcionario__delegacion=request.user.funcionario.delegacion)
        return qs