from django.db import migrations


def sync_funcionarios(apps, schema_editor):
    from core.utils import construir_nombre_completo, separar_nombre_usuario, validar_rut

    Funcionario = apps.get_model('accounts', 'Funcionario')
    Vecino = apps.get_model('activities', 'Vecino')

    for func in Funcionario.objects.select_related('user').all():
        user = func.user
        changed_func = []

        if not (func.primer_nombre or func.apellido_paterno):
            pn, sn, ap, am = separar_nombre_usuario(user.first_name, user.last_name)
            pn, sn, ap, am = pn[:50], sn[:50], ap[:50], am[:50]
            if pn or ap:
                func.primer_nombre = pn
                func.segundo_nombre = sn
                func.apellido_paterno = ap
                func.apellido_materno = am
                changed_func.extend([
                    'primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno'
                ])
                compuesto = construir_nombre_completo(pn, sn, ap, am)[:150]
                if compuesto and (user.first_name != compuesto or user.last_name):
                    user.first_name = compuesto
                    user.last_name = ''
                    user.save(update_fields=['first_name', 'last_name'])

        if not func.rut:
            ident = (func.identificador_institucional or '').strip()
            vec = Vecino.objects.filter(rut__iexact=user.username).first()
            if not vec and ident.upper().startswith('VEC-'):
                ok_rut, rut_fmt = validar_rut(ident[4:])
                if ok_rut:
                    vec = Vecino.objects.filter(rut__iexact=rut_fmt).first()
                    if not vec:
                        func.rut = rut_fmt
                        changed_func.append('rut')
            if vec and vec.rut and not func.rut:
                ok_vec_rut, rut_fmt = validar_rut(vec.rut)
                if ok_vec_rut:
                    func.rut = rut_fmt
                    changed_func.append('rut')

        if changed_func:
            func.save(update_fields=changed_func)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_funcionario_rut'),
        ('activities', '0018_vecino_apellido_materno_vecino_apellido_paterno_and_more'),
    ]

    operations = [
        migrations.RunPython(sync_funcionarios, migrations.RunPython.noop),
    ]
