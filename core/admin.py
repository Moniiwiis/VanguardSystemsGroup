from django.contrib import admin

class BaseScopedModelAdmin(admin.ModelAdmin):
    """
    Clase base para que todos los usuarios staff (delegados, funcionarios) tengan
    permisos de módulo y vista/edición en Django Admin, aplicando luego la restricción 
    de visibilidad (Scoping por Delegación) mediante get_queryset().
    """
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
