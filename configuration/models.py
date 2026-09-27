from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import BaseModel

class Periodo(BaseModel):
    fecha_inicio = models.DateField()
    fecha_termino = models.DateField()
    dias_computables = models.IntegerField()
    estado = models.CharField(max_length=20, default='Abierto')

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_termino:
            if self.fecha_termino < self.fecha_inicio:
                raise ValidationError({'fecha_termino': 'La fecha de término no puede ser anterior a la fecha de inicio.'})
        if self.dias_computables is not None and self.dias_computables <= 0:
            raise ValidationError({'dias_computables': 'Los días computables deben ser mayores a cero.'})

    def dias_transcurridos(self):
        hoy = timezone.now().date()
        if hoy < self.fecha_inicio:
            return 0
        if hoy > self.fecha_termino:
            return self.dias_computables
        delta = (hoy - self.fecha_inicio).days
        return min(delta, self.dias_computables)

    def meta_esperada_al_dia(self):
        if not self.dias_computables or self.dias_computables <= 0:
            return 100.0
        pct = (self.dias_transcurridos() / float(self.dias_computables)) * 100.0
        return min(round(pct, 2), 100.0)

    def __str__(self):
        return f"Período {self.fecha_inicio} a {self.fecha_termino}"

class CatalogoActividad(BaseModel):
    tipo_actividad = models.CharField(max_length=100)
    servicio = models.CharField(max_length=100)
    tipo_atencion = models.CharField(max_length=100, null=True, blank=True)
    subtipo_atencion = models.CharField(max_length=100, null=True, blank=True)
    estado = models.CharField(max_length=20, default='Activo')

    def __str__(self):
        return f"{self.tipo_actividad} - {self.servicio}"

class ItemMedicion(BaseModel):
    cargo = models.ForeignKey("accounts.Cargo", on_delete=models.RESTRICT)
    catalogo = models.ForeignKey(CatalogoActividad, on_delete=models.RESTRICT)
    nombre_item = models.CharField(max_length=150)
    unidad_medida = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.nombre_item

class ConfiguracionMeta(BaseModel):
    item = models.ForeignKey(ItemMedicion, on_delete=models.RESTRICT)
    periodo = models.ForeignKey(Periodo, on_delete=models.RESTRICT)
    funcionario = models.ForeignKey("accounts.Funcionario", on_delete=models.SET_NULL, null=True, blank=True)
    valor_objetivo = models.DecimalField(max_digits=10, decimal_places=2)
    ponderacion = models.DecimalField(max_digits=5, decimal_places=2)
    umbral_minimo = models.DecimalField(max_digits=5, decimal_places=2, default=80.00)
    maximo_computable = models.DecimalField(max_digits=5, decimal_places=2, default=150.00)

    def clean(self):
        super().clean()
        if self.valor_objetivo is not None and self.valor_objetivo <= 0:
            raise ValidationError({'valor_objetivo': 'El valor objetivo de la meta debe ser estrictamente mayor a 0.'})
        if self.ponderacion is not None and (self.ponderacion < 0 or self.ponderacion > 100):
            raise ValidationError({'ponderacion': 'La ponderación debe estar entre 0% y 100%.'})

    class Meta:
        # Asegura que no exista una meta duplicada para la misma combinación de ítem, período y funcionario
        unique_together = ('item', 'periodo', 'funcionario')

    def calcular_avance(self):
        from activities.models import Actividad, ValidacionEvidencia
        qs = Actividad.objects.filter(item=self.item, periodo=self.periodo)
        if self.funcionario:
            qs = qs.filter(funcionario=self.funcionario)
        
        valid_ids = ValidacionEvidencia.objects.filter(resultado__iexact='Aprobado').values_list('actividad_id', flat=True)
        if ValidacionEvidencia.objects.exists():
            qs = qs.filter(id__in=valid_ids)
        return qs.count()

    def porcentaje_cumplimiento(self):
        obj = float(self.valor_objetivo) if self.valor_objetivo else 0.0
        if obj <= 0:
            return 0.0
        avance = self.calcular_avance()
        return round((avance / obj) * 100.0, 2)

    def cumplimiento_ponderado(self):
        pct = self.porcentaje_cumplimiento()
        pond = float(self.ponderacion) if self.ponderacion else 0.0
        res = (pond * pct) / 100.0
        max_comp = float(self.maximo_computable) if self.maximo_computable else 150.0
        return round(min(res, max_comp), 2)

    def estado_semaforo(self):
        pct = self.porcentaje_cumplimiento()
        esperado = self.periodo.meta_esperada_al_dia()
        if pct >= esperado:
            return 'VERDE'
        elif pct >= 0.6 * esperado:
            return 'AMBAR'
        else:
            return 'ROJO'

    def __str__(self):
        return f"Meta para {self.item} - Período {self.periodo}"