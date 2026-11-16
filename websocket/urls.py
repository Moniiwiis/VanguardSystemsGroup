from django.urls import path
from . import views

app_name = "websocket"

urlpatterns = [
    path("", views.chat_room, name="chat_index"),
    path("send/", views.send_message, name="send"),
    path("support/send/", views.support_send_message, name="support_send"),
    path("support/messages/", views.support_messages_feed, name="support_messages"),
    path("messages/", views.messages_feed, name="messages"),
    path("message-action/", views.message_action, name="message_action"),
    path("contacts/", views.contacts_feed, name="contacts"),
    path("contacts/<int:contact_id>/preference/", views.contact_preference, name="contact_preference"),
    path("unread/", views.unread_count, name="unread"),
    path("read/", views.mark_read, name="mark_read"),
]

