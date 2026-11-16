from django.conf import settings
from django.shortcuts import redirect, render

from accounts.models import Funcionario
from core.context_processors import global_context


def _get_asset_prefixes():
    static_url = settings.STATIC_URL
    media_url = settings.MEDIA_URL
    static_path = static_url if static_url.startswith('/') else f'/{static_url}'
    media_path = media_url if media_url.startswith('/') else f'/{media_url}'
    return (static_path, media_path)


class CustomErrorPagesMiddleware:
    """Muestra la plantilla personalizada errors/404.html incluso cuando DEBUG=True."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if settings.DEBUG and response.status_code == 404:
            if request.path.startswith(_get_asset_prefixes()) or request.path.startswith('/gestion/api/'):
                return response
            accept = request.headers.get('Accept', '')
            if 'application/json' in accept and 'text/html' not in accept:
                return response
            return render(request, 'errors/404.html', status=404)
        return response


class PasswordChangeRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            must_change_password = Funcionario.objects.filter(
                user=request.user,
                debe_cambiar_contrasena=True,
            ).exists()
            allowed_paths = {
                '/cambiar-contrasena-inicial/',
                '/logout/',
            }
            is_asset = request.path.startswith(_get_asset_prefixes())
            if must_change_password and not is_asset and request.path not in allowed_paths:
                return redirect('cambiar_contrasena_inicial')

            # Aislamiento estricto en servidor para rol Cliente:
            # Solo puede consultar sus propios datos/registros (/portal-cliente/) y editar su perfil/foto (/perfil/)
            ctx = global_context(request)
            if ctx.get('permisos', {}).get('es_cliente') and not is_asset:
                path = request.path
                if path in ('/', '/gestion/', '/login/', '/accounts/login/'):
                    return redirect('portal_cliente')
                allowed_client_prefixes = (
                    '/portal-cliente/',
                    '/perfil/',
                    '/cambiar-contrasena-inicial/',
                    '/logout/',
                )
                if not path.startswith(allowed_client_prefixes):
                    return render(request, 'errors/403.html', status=403)

        return self.get_response(request)
