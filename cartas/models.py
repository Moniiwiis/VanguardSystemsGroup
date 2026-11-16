from django.conf import settings
from django.db import models
from accounts.models import Delegacion


class Carta(models.Model):
    """Hoja TUBO CARTAS / CARTAS de la matriz SGR 2026.

    Registro de correspondencia independiente de Atenciones Ciudadanas.
    El N° de oficina de partes NO es único en la matriz de referencia.
    """
    ESTADOS = [
        ('EN PROCESO', 'EN PROCESO'),
        ('APROBADA', 'APROBADA'),
        ('FINALIZADA', 'FINALIZADA'),
        ('NO APLICA', 'NO APLICA'),
    ]
    delegacion = models.ForeignKey(Delegacion, on_delete=models.PROTECT, related_name='cartas')
    fecha = models.DateField(verbose_name='Fecha de ingreso')
    numero = models.CharField(max_length=60, verbose_name='Nº de carta')
    para = models.CharField(max_length=160, verbose_name='Para')
    remite = models.CharField(max_length=180, verbose_name='Remite')
    fono_contacto = models.CharField(max_length=60, blank=True, verbose_name='Fono contacto')
    actividad_tema = models.TextField(verbose_name='Actividad o tema')
    # En Excel hay tanto fechas como textos (ej. VARIAS FECHAS, 16 AL 19/07)
    fecha_actividad = models.CharField(max_length=100, blank=True, verbose_name='Fecha de la actividad')
    encargado_seguimiento = models.CharField(max_length=160, blank=True, verbose_name='Encargado de seguimiento')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='EN PROCESO')
    pronunciamiento = models.TextField(blank=True)
    derivada_a = models.CharField(max_length=180, blank=True, verbose_name='Derivada a')
    observacion = models.TextField(blank=True)
    unidad = models.CharField(max_length=100, blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cartas_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'Carta de Oficina de Partes'
        verbose_name_plural = 'Cartas de Oficina de Partes'
        indexes = [models.Index(fields=['delegacion','estado'], name='carta_deleg_estado_idx')]

    def __str__(self):
        return f'Carta {self.numero} — {self.remite}'
