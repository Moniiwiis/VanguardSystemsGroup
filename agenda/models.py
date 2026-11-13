from django.db import models
from core.models import BaseModel

class CompromisoAgenda(BaseModel):
    actividad_origen = models.ForeignKey("activities.Actividad", on_delete=models.SET_NULL, null=True, blank=True)
    delegacion = models.ForeignKey("accounts.Delegacion", on_delete=models.SET_NULL, null=True, blank=True, related_name='compromisos_sector')
    sector = models.ForeignKey("accounts.Sector", on_delete=models.SET_NULL, null=True, blank=True, related_name='compromisos_tubo')
    organizacion = models.ForeignKey("activities.OrganizacionComunitaria", on_delete=models.SET_NULL, null=True, blank=True, related_name='compromisos_sector')
    origen = models.CharField(max_length=10, default='INT', verbose_name="Interno o Externo")
    solicitante = models.CharField(max_length=150)
    territorio = models.CharField(max_length=100, null=True, blank=True)
    responsable = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT)
    creado_por = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True, related_name='compromisos_sector_creados')
    area_apoyo = models.CharField(max_length=100, null=True, blank=True)
    fecha_comprometida = models.DateField()
    estado = models.CharField(max_length=30, default='Registrada')
    observacion = models.TextField(null=True, blank=True)
    avance_observaciones = models.TextField(null=True, blank=True, verbose_name="Avance u Observaciones")

    def get_codigo_tubo(self):
        return f"TUB-S{self.id:04d}" if self.id else "TUB-S0000"

    def get_codigo_sector(self):
        return f"SEC-{self.id:04d}" if self.id else "SEC-0000"

    def save(self, *args, **kwargs):
        if self.sector:
            if not self.territorio:
                self.territorio = self.sector.nombre
            if not self.delegacion_id and self.sector.delegacion_id:
                self.delegacion_id = self.sector.delegacion_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_codigo_tubo()} - {self.solicitante} ({self.estado})"

class AjusteDesempenio(BaseModel):
    funcionario = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT, related_name='ajustes')
    periodo = models.ForeignKey("configuration.Periodo", on_delete=models.RESTRICT)
    concepto = models.CharField(max_length=50)
    valor_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    motivo = models.TextField()
    autorizador = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT, related_name='ajustes_autorizados')