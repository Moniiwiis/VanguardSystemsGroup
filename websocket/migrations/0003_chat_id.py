from django.db import migrations, models


def populate_chat_ids(apps, schema_editor):
    ChatMessage = apps.get_model('websocket', 'ChatMessage')
    database = schema_editor.connection.alias
    for message in ChatMessage.objects.using(database).only(
        'pk',
        'sender_id',
        'recipient_id',
    ).iterator():
        first_id, second_id = sorted((message.sender_id, message.recipient_id))
        ChatMessage.objects.using(database).filter(pk=message.pk).update(
            chat_id=f'direct_{first_id}_{second_id}',
        )


class Migration(migrations.Migration):

    dependencies = [
        ('websocket', '0002_private_messages'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='chat_id',
            field=models.CharField(
                db_index=True,
                default='',
                max_length=64,
            ),
            preserve_default=False,
        ),
        migrations.RunPython(populate_chat_ids, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(
                fields=['chat_id', 'created_at'],
                name='chat_id_created_idx',
            ),
        ),
    ]
