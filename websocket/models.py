from django.conf import settings
from django.db import models
from django.db.models import F, Q


class ChatMessage(models.Model):
    chat_id = models.CharField(max_length=64, db_index=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages_sent',
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages_received',
    )
    message = models.CharField(max_length=300)
    leido = models.BooleanField(default=False)
    editado = models.BooleanField(default=False)
    eliminado = models.BooleanField(default=False)
    oculto_para = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ('created_at', 'id')
        indexes = [
            models.Index(
                fields=('chat_id', 'created_at'),
                name='chat_id_created_idx',
            ),
            models.Index(
                fields=('recipient', 'leido', 'created_at'),
                name='chat_unread_recipient_idx',
            ),
            models.Index(
                fields=('sender', 'recipient', 'created_at'),
                name='chat_sender_recipient_idx',
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(sender=F('recipient')),
                name='chat_message_no_self_send',
            ),
        ]

    def __str__(self):
        return f'{self.sender_id} -> {self.recipient_id}: {self.message[:40]}'


class ChatContactPreference(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_contact_settings',
    )
    contact = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_contact_preferences',
    )
    display_name = models.CharField(max_length=80, blank=True)
    hidden_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('owner', 'contact'),
                name='chat_contact_preference_unique',
            ),
            models.CheckConstraint(
                condition=~Q(owner=F('contact')),
                name='chat_contact_preference_no_self',
            ),
        ]


class TechnicalSupportMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='technical_support_messages',
    )
    sender_name = models.CharField(max_length=150)
    delegation_name = models.CharField(max_length=120)
    message = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ('created_at', 'id')
        indexes = [
            models.Index(
                fields=('created_at', 'id'),
                name='support_msg_created_idx',
            ),
        ]


class LegacyRoomMessageArchive(models.Model):
    original_message_id = models.PositiveBigIntegerField(unique=True)
    sender_id = models.PositiveBigIntegerField()
    room_id = models.CharField(max_length=64)
    message = models.CharField(max_length=300)
    created_at = models.DateTimeField()

    class Meta:
        ordering = ('created_at', 'original_message_id')
