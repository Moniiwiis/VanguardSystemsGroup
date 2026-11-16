from django.db import migrations


def sync_vecinos(apps, schema_editor):
    from core.utils import separar_nombre_completo

    Vecino = apps.get_model('activities', 'Vecino')
    for vec in Vecino.objects.all():
        if not (vec.primer_nombre or vec.apellido_paterno) and vec.nombre:
            pn, sn, ap, am = separar_nombre_completo(vec.nombre)
            vec.primer_nombre = pn[:50]
            vec.segundo_nombre = sn[:50]
            vec.apellido_paterno = ap[:50]
            vec.apellido_materno = am[:50]
            vec.save(update_fields=[
                'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno'
            ])


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0018_vecino_apellido_materno_vecino_apellido_paterno_and_more'),
    ]

    operations = [
        migrations.RunPython(sync_vecinos, migrations.RunPython.noop),
    ]
