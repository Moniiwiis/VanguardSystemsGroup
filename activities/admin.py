from django.contrib import admin
from core.admin import BaseScopedModelAdmin
from .models import Actividad, Evidencia, ValidacionEvidencia, AtencionSocialGestion

class EvidenciaInline(admin.TabularInline):
    model = Evidencia
    extra = 1

class ValidacionEvidenciaInline(admin.StackedInline):
    model = ValidacionEvidencia
    extra = 1

class AtencionSocialGestionInline(admin.TabularInline):
    model = AtencionSocialGestion
    extra = 1

@admin.register(Actividad)
class ActividadAdmin(BaseScopedModelAdmin):
    list_display = ('codigo_evidencia_unico', 'fecha_actividad', 'funcionario', 'get_delegacion', 'item', 'periodo', 'estado_validacion')

    @admin.display(description='Delegación', ordering='funcionario__delegacion__nombre')
    def get_delegacion(self, obj):
        return obj.funcionario.delegacion.nombre if (obj.funcionario and obj.funcionario.delegacion) else "-"
    search_fields = (
        'codigo_evidencia_unico',
        'funcionario__user__username',
        'funcionario__user__first_name',
        'funcionario__user__last_name',
        'funcionario__identificador_institucional',
        'descripcion_solicitud'
    )
    list_filter = ('periodo', 'item__cargo', 'funcionario__delegacion', 'fecha_actividad')
    date_hierarchy = 'fecha_actividad'
    list_select_related = ('funcionario__user', 'funcionario__delegacion', 'item', 'periodo')
    readonly_fields = ('created_at', 'updated_at', 'codigo_evidencia_unico')
    inlines = [EvidenciaInline, ValidacionEvidenciaInline, AtencionSocialGestionInline]
    actions = ['aprobar_evidencias', 'rechazar_evidencias']

    @admin.action(description="Aprobar evidencias para actividades seleccionadas")
    def aprobar_evidencias(self, request, queryset):
        verificador = getattr(request.user, 'funcionario', None)
        count = 0
        for act in queryset:
            ValidacionEvidencia.objects.create(
                actividad=act,
                verificador=verificador if verificador else act.funcionario,
                resultado='Aprobado',
                observaciones='Validación masiva aprobada por el verificador.'
            )
            count += 1
        self.message_user(request, f"Se registraron {count} aprobaciones de evidencia.")

    @admin.action(description="Rechazar evidencias para actividades seleccionadas")
    def rechazar_evidencias(self, request, queryset):
        verificador = getattr(request.user, 'funcionario', None)
        count = 0
        for act in queryset:
            ValidacionEvidencia.objects.create(
                actividad=act,
                verificador=verificador if verificador else act.funcionario,
                resultado='Rechazado',
                observaciones='Rechazado por inconsistencia o falta de evidencia requerida.'
            )
            count += 1
        self.message_user(request, f"Se registraron {count} rechazos de evidencia.")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(funcionario__delegacion=request.user.funcionario.delegacion)
        return qs

@admin.register(Evidencia)
class EvidenciaAdmin(BaseScopedModelAdmin):
    list_display = ('actividad', 'ruta_archivo_url', 'created_at')
    search_fields = ('actividad__codigo_evidencia_unico', 'ruta_archivo_url')
    list_select_related = ('actividad',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(actividad__funcionario__delegacion=request.user.funcionario.delegacion)
        return qs

@admin.register(ValidacionEvidencia)
class ValidacionEvidenciaAdmin(BaseScopedModelAdmin):
    list_display = ('actividad', 'verificador', 'resultado', 'created_at')
    search_fields = (
        'actividad__codigo_evidencia_unico',
        'verificador__user__username',
        'verificador__user__first_name',
        'verificador__user__last_name'
    )
    list_filter = ('resultado',)
    list_select_related = ('actividad', 'verificador__user')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(actividad__funcionario__delegacion=request.user.funcionario.delegacion)
        return qs

@admin.register(AtencionSocialGestion)
class AtencionSocialGestionAdmin(BaseScopedModelAdmin):
    list_display = ('actividad', 'numero_gestion', 'tipo_gestion', 'fecha_gestion')
    search_fields = ('actividad__codigo_evidencia_unico', 'tipo_gestion', 'resultado_gestion')
    list_filter = ('tipo_gestion',)
    list_select_related = ('actividad',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'funcionario') and request.user.funcionario.delegacion:
            return qs.filter(actividad__funcionario__delegacion=request.user.funcionario.delegacion)
        return qs