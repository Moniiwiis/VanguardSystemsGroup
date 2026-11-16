import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import F, Q


class Migration(migrations.Migration):

    dependencies = [
        ('websocket', '0003_chat_id'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='editado',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='eliminado',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='oculto_para',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.CreateModel(
            name='ChatContactPreference',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),
                ('display_name', models.CharField(blank=True, max_length=80)),
                ('hidden_at', models.DateTimeField(blank=True, null=True)),
                ('contact', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='chat_contact_preferences',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('owner', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='chat_contact_settings',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name='chatcontactpreference',
            constraint=models.UniqueConstraint(
                fields=('owner', 'contact'),
                name='chat_contact_preference_unique',
            ),
        ),
        migrations.AddConstraint(
            model_name='chatcontactpreference',
            constraint=models.CheckConstraint(
                condition=~Q(owner=F('contact')),
                name='chat_contact_preference_no_self',
            ),
        ),
    ]
