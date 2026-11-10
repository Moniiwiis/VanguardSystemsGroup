from django.conf import settings
from django.shortcuts import redirect, render

from accounts.models import Funcionario
from core.context_processors import global_context


class PasswordChangeRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            must_change_password = Funcionario.objects.filter(
                user=request.user,
                debe_cambiar_contrasena=True,
            ).exists()
            static_url = settings.STATIC_URL
            media_url = settings.MEDIA_URL
            static_path = static_url if static_url.startswith('/') else f'/{static_url}'
            media_path = media_url if media_url.startswith('/') else f'/{media_url}'
            allowed_paths = {
                '/cambiar-contrasena-inicial/',
                '/logout/',
            }
            is_asset = request.path.startswith((static_path, media_path))
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
