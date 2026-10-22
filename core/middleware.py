from django.conf import settings
from django.shortcuts import redirect

from accounts.models import Funcionario


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

        return self.get_response(request)
