from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial=True
    dependencies=[('accounts','0001_initial'), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations=[
        migrations.CreateModel(
            name='Carta',
            fields=[
                ('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),
                ('fecha',models.DateField(verbose_name='Fecha de ingreso')),
                ('numero',models.CharField(max_length=60,verbose_name='Nº de carta')),
                ('para',models.CharField(max_length=160,verbose_name='Para')),
                ('remite',models.CharField(max_length=180,verbose_name='Remite')),
                ('fono_contacto',models.CharField(blank=True,max_length=60,verbose_name='Fono contacto')),
                ('actividad_tema',models.TextField(verbose_name='Actividad o tema')),
                ('fecha_actividad',models.CharField(blank=True,max_length=100,verbose_name='Fecha de la actividad')),
                ('encargado_seguimiento',models.CharField(blank=True,max_length=160,verbose_name='Encargado de seguimiento')),
                ('estado',models.CharField(choices=[('EN PROCESO','EN PROCESO'),('APROBADA','APROBADA'),('FINALIZADA','FINALIZADA'),('NO APLICA','NO APLICA')],default='EN PROCESO',max_length=20)),
                ('pronunciamiento',models.TextField(blank=True)),
                ('derivada_a',models.CharField(blank=True,max_length=180,verbose_name='Derivada a')),
                ('observacion',models.TextField(blank=True)),
                ('unidad',models.CharField(blank=True,max_length=100)),
                ('created_at',models.DateTimeField(auto_now_add=True)),
                ('updated_at',models.DateTimeField(auto_now=True)),
                ('creado_por',models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.SET_NULL,related_name='cartas_creadas',to=settings.AUTH_USER_MODEL)),
                ('delegacion',models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,related_name='cartas',to='accounts.delegacion')),
            ],
            options={'verbose_name':'Carta de Oficina de Partes','verbose_name_plural':'Cartas de Oficina de Partes','ordering':['-fecha','-id']},
        ),
        migrations.AddIndex(model_name='carta',index=models.Index(fields=['delegacion','estado'],name='carta_deleg_estado_idx')),
    ]
