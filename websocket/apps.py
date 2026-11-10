from django.apps import AppConfig

class WebsocketConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'websocket'

    def ready(self):
        from .services import register_realtime_crud_signals
        register_realtime_crud_signals()


