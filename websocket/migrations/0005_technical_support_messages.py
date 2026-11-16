import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('websocket', '0004_message_actions_contact_preferences'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TechnicalSupportMessage',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),
                ('sender_name', models.CharField(max_length=150)),
                ('delegation_name', models.CharField(max_length=120)),
                ('message', models.CharField(max_length=300)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='technical_support_messages',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ('created_at', 'id'),
                'indexes': [
                    models.Index(
                        fields=['created_at', 'id'],
                        name='support_msg_created_idx',
                    ),
                ],
            },
        ),
    ]
