from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_funcionario_sector'),
    ]

    operations = [
        migrations.AddField(
            model_name='funcionario',
            name='tratamiento',
            field=models.CharField(
                choices=[
                    ('masculino', 'Estimado'),
                    ('femenino', 'Estimada'),
                    ('neutral', 'Estimado/a'),
                ],
                default='neutral',
                max_length=10,
                verbose_name='Tratamiento del saludo',
            ),
        ),
    ]
