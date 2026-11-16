from django import template

from core.utils import obtener_nombre_corto

register = template.Library()


@register.filter(name='nombre_corto')
def nombre_corto_filter(obj):
    """Muestra únicamente el primer nombre y el apellido paterno del funcionario/vecino/usuario."""
    return obtener_nombre_corto(obj)
