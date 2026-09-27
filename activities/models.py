import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import BaseModel

class Actividad(BaseModel):
    codigo_evidencia_unico = models.CharField(max_length=50, unique=True, blank=True)
    fecha_actividad = models.DateField()
    descripcion_solicitud = models.TextField()
    accion_ejecutada = models.TextField()
    contacto_nombre = models.CharField(max_length=100, null=True, blank=True)
    contacto_telefono = models.CharField(max_length=20, null=True, blank=True)
    funcionario = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT)
    item = models.ForeignKey("configuration.ItemMedicion", on_delete=models.RESTRICT)
    periodo = models.ForeignKey("configuration.Periodo", on_delete=models.RESTRICT)

    def clean(self):
        super().clean()
        if self.fecha_actividad and self.periodo:
            if self.fecha_actividad < self.periodo.fecha_inicio or self.fecha_actividad > self.periodo.fecha_termino:
                raise ValidationError({'fecha_actividad': f'La fecha de la actividad debe estar dentro del período configurado ({self.periodo.fecha_inicio} a {self.periodo.fecha_termino}).'})

    def save(self, *args, **kwargs):
        if not self.codigo_evidencia_unico:
            fecha_str = timezone.now().strftime('%Y%m%d')
            uid = uuid.uuid4().hex[:6].upper()
            self.codigo_evidencia_unico = f"EVI-{fecha_str}-{uid}"
        super().save(*args, **kwargs)

    def estado_validacion(self):
        val = ValidacionEvidencia.objects.filter(actividad=self).order_by('-created_at').first()
        if not val:
            return 'Pendiente'
        return val.resultado

    def __str__(self):
        return f"Actividad {self.codigo_evidencia_unico}"

class Evidencia(BaseModel):
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='evidencias')
    ruta_archivo_url = models.CharField(max_length=255)
    metadatos = models.TextField(null=True, blank=True)

class ValidacionEvidencia(BaseModel):
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE)
    verificador = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT)
    resultado = models.CharField(max_length=30)
    observaciones = models.TextField(null=True, blank=True)

class AtencionSocialGestion(BaseModel):
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE)
    numero_gestion = models.IntegerField()
    tipo_gestion = models.CharField(max_length=100)
    fecha_gestion = models.DateField()
    resultado_gestion = models.TextField(null=True, blank=True)
    class Meta:
        # Garantiza que una actividad no tenga dos veces la gestión número 1, 2 o 3
        unique_together = ('actividad', 'numero_gestion')

    def __str__(self):
        return f"Gestión {self.numero_gestion} - Actividad {self.actividad.codigo_evidencia_unico}"