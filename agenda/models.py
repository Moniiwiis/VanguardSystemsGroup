from django.db import models
from core.models import BaseModel

class CompromisoAgenda(BaseModel):
    actividad_origen = models.ForeignKey("activities.Actividad", on_delete=models.SET_NULL, null=True, blank=True)
    solicitante = models.CharField(max_length=100)
    territorio = models.CharField(max_length=100, null=True, blank=True)
    responsable = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT)
    area_apoyo = models.CharField(max_length=100, null=True, blank=True)
    fecha_comprometida = models.DateField()
    estado = models.CharField(max_length=30, default='Ingresado')
    observacion = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Compromiso: {self.solicitante} ({self.estado})"

class AjusteDesempenio(BaseModel):
    funcionario = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT, related_name='ajustes')
    periodo = models.ForeignKey("configuration.Periodo", on_delete=models.RESTRICT)
    concepto = models.CharField(max_length=50)
    valor_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    motivo = models.TextField()
    autorizador = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT, related_name='ajustes_autorizados')