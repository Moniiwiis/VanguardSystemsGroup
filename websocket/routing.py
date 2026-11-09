from django.urls import path
from .consumers import ModuleChangeConsumer, ChatConsumer

websocket_urlpatterns = [
    path("ws/crud/<str:modulo>/", ModuleChangeConsumer.as_asgi()),
    path("ws/chat/", ChatConsumer.as_asgi()),
]

