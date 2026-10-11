from django.contrib import admin

class SoftDeleteListFilter(admin.SimpleListFilter):
    title = 'Estado de Borrado (Soft Delete)'
    parameter_name = 'soft_deleted'

    def lookups(self, request, model_admin):
        return (
            ('activos', 'Solo Activos (Predeterminado)'),
            ('eliminados', 'Solo Eliminados (Soft Delete)'),
            ('todos', 'Todos (Activos + Eliminados)'),
        )

    def queryset(self, request, queryset):
        val = self.value()
        if val == 'eliminados':
            return queryset.filter(deleted_at__isnull=False)
        elif val == 'todos':
            return queryset
        # Por defecto (None o 'activos') mostramos solo los registros activos
        return queryset.filter(deleted_at__isnull=True)

class BaseScopedModelAdmin(admin.ModelAdmin):
    """
    Clase base para que todos los usuarios staff (delegados, funcionarios) tengan
    permisos de módulo y vista/edición en Django Admin, aplicando luego la restricción 
    de visibilidad (Scoping por Delegación) mediante get_queryset() y soporte de borrado lógico.
    """
    def get_queryset(self, request):
        if hasattr(self.model, 'all_objects'):
            return self.model.all_objects.all()
        return super().get_queryset(request)

    def get_list_filter(self, request):
        filters = list(super().get_list_filter(request) or [])
        if SoftDeleteListFilter not in filters and hasattr(self.model, 'deleted_at'):
            filters.append(SoftDeleteListFilter)
        return filters

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj) or [])
        if hasattr(self.model, 'deleted_at') and 'deleted_at' not in fields:
            fields.append('deleted_at')
        return fields

    def has_module_permission(self, request):
        return request.user.is_active and (request.user.is_staff or request.user.is_superuser)


    def has_view_permission(self, request, obj=None):
        return request.user.is_active and (request.user.is_staff or request.user.is_superuser)

    def has_change_permission(self, request, obj=None):
        return request.user.is_active and (request.user.is_staff or request.user.is_superuser)

    def has_add_permission(self, request):
        return request.user.is_active and (request.user.is_staff or request.user.is_superuser)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_active and (request.user.is_staff or request.user.is_superuser)

    def delete_model(self, request, obj):
        """Asegura que la eliminación individual ejecute el borrado lógico (Soft Delete)."""
        obj.delete()

    def delete_queryset(self, request, queryset):
        """Asegura que la eliminación masiva ejecute el borrado lógico (Soft Delete)."""
        queryset.delete()


