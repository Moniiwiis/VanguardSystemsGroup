import re
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django.db.models import F, Q


def migrate_legacy_messages(apps, schema_editor):
    ChatMessage = apps.get_model('websocket', 'ChatMessage')
    LegacyRoomMessageArchive = apps.get_model(
        'websocket',
        'LegacyRoomMessageArchive',
    )
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    database = schema_editor.connection.alias

    for message in ChatMessage.objects.using(database).all().iterator():
        match = re.fullmatch(r'direct_(\d+)_(\d+)', message.room_id or '')
        if match:
            first_id, second_id = (int(value) for value in match.groups())
            recipient_id = (
                second_id if message.sender_id == first_id
                else first_id if message.sender_id == second_id
                else None
            )
            if (
                recipient_id
                and first_id < second_id
                and User.objects.using(database).filter(pk=recipient_id).exists()
            ):
                ChatMessage.objects.using(database).filter(pk=message.pk).update(
                    recipient_id=recipient_id,
                    leido=True,
                )
                continue

        LegacyRoomMessageArchive.objects.using(database).create(
            original_message_id=message.pk,
            sender_id=message.sender_id,
            room_id=message.room_id,
            message=message.message,
            created_at=message.created_at,
        )
        ChatMessage.objects.using(database).filter(pk=message.pk).delete()


def restore_legacy_messages(apps, schema_editor):
    ChatMessage = apps.get_model('websocket', 'ChatMessage')
    LegacyRoomMessageArchive = apps.get_model(
        'websocket',
        'LegacyRoomMessageArchive',
    )
    database = schema_editor.connection.alias

    for message in ChatMessage.objects.using(database).all().iterator():
        first_id, second_id = sorted((message.sender_id, message.recipient_id))
        ChatMessage.objects.using(database).filter(pk=message.pk).update(
            room_id=f'direct_{first_id}_{second_id}',
        )
    for message in LegacyRoomMessageArchive.objects.using(database).all().iterator():
        ChatMessage.objects.using(database).create(
            id=message.original_message_id,
            sender_id=message.sender_id,
            room_id=message.room_id,
            message=message.message,
            created_at=message.created_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('websocket', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='LegacyRoomMessageArchive',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),
                ('original_message_id', models.PositiveBigIntegerField(unique=True)),
                ('sender_id', models.PositiveBigIntegerField()),
                ('room_id', models.CharField(max_length=64)),
                ('message', models.CharField(max_length=300)),
                ('created_at', models.DateTimeField()),
            ],
            options={
                'ordering': ('created_at', 'original_message_id'),
            },
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='recipient',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='chat_messages_received',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='leido',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(migrate_legacy_messages, restore_legacy_messages),
        migrations.AlterField(
            model_name='chatmessage',
            name='recipient',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='chat_messages_received',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='leido',
            field=models.BooleanField(default=False),
        ),
        migrations.RemoveField(
            model_name='chatmessage',
            name='room_id',
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(
                fields=['recipient', 'leido', 'created_at'],
                name='chat_unread_recipient_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(
                fields=['sender', 'recipient', 'created_at'],
                name='chat_sender_recipient_idx',
            ),
        ),
        migrations.AddConstraint(
            model_name='chatmessage',
            constraint=models.CheckConstraint(
                condition=~Q(sender=F('recipient')),
                name='chat_message_no_self_send',
            ),
        ),
    ]
