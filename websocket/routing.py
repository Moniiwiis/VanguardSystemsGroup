from django.urls import path
from .consumers import (
    ChatConsumer,
    ChatNotificationsConsumer,
    ModuleChangeConsumer,
    TechnicalSupportConsumer,
)

websocket_urlpatterns = [
    path("ws/crud/<str:modulo>/", ModuleChangeConsumer.as_asgi()),
    path("ws/chat/", ChatConsumer.as_asgi()),
    path("ws/chat/support/", TechnicalSupportConsumer.as_asgi()),
    path("ws/chat/notifications/", ChatNotificationsConsumer.as_asgi()),
]

