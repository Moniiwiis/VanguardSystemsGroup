from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.template.loader import render_to_string

from accounts.models import Funcionario
from core.context_processors import global_context

CUSTOM_ERROR_TEMPLATES = {
    400: 'errors/400.html',
    403: 'errors/403.html',
    404: 'errors/404.html',
    500: 'errors/500.html',
}


def _get_asset_prefixes():
    static_url = settings.STATIC_URL
    media_url = settings.MEDIA_URL
    static_path = static_url if static_url.startswith('/') else f'/{static_url}'
    media_path = media_url if media_url.startswith('/') else f'/{media_url}'
    return (static_path, media_path)


class CustomErrorPagesMiddleware:
    """Muestra las plantillas personalizadas errors/{400,403,404,500}.html incluso con DEBUG=True."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        status_code = response.status_code
        if not settings.DEBUG or status_code not in CUSTOM_ERROR_TEMPLATES:
            return response
        if getattr(response, '_is_custom_error_page', False):
            return response
        if request.path.startswith(_get_asset_prefixes()) or request.path.startswith('/gestion/api/'):
            return response
        if response.get('Content-Type', '').startswith('application/json'):
            return response
        accept = request.headers.get('Accept', '')
        if 'application/json' in accept and 'text/html' not in accept:
            return response

        template_name = CUSTOM_ERROR_TEMPLATES[status_code]
        if status_code == 500:
            custom_resp = HttpResponse(render_to_string(template_name), status=500)
        else:
            try:
                custom_resp = render(request, template_name, status=status_code)
            except Exception:
                custom_resp = HttpResponse(render_to_string(template_name), status=status_code)
        custom_resp._is_custom_error_page = True
        return custom_resp


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
                    resp_403 = render(request, 'errors/403.html', status=403)
                    resp_403._is_custom_error_page = True
                    return resp_403

        return self.get_response(request)
