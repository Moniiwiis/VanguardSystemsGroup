import uuid
import datetime
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import BaseModel

class Actividad(BaseModel):
    """
    Registro de actividad del Tubo SGR.
    Criterios de registro:
      - da_puntaje: False si es coordinación/gestión interna, o si falta contacto_nombre/contacto_telefono,
                    o si el creador es delegado registrando su propia gestión.
      - es_gestion_delegado: True cuando el funcionario tiene rol Delegado y registra la actividad para sí mismo.
      - Cierre de semana: lunes de la semana siguiente (semana lunes-viernes).
      - Tope 120%: el puntaje se ajusta equitativamente hasta el 120% del objetivo.
    """
    # Categoría de la gestión territorial
    TIPO_GESTION_CHOICES = [
        ('accion', 'Acción realizada'),
        ('coordinacion', 'Coordinación interna'),
        ('felicitacion', 'Felicitación / Reconocimiento'),
        ('otro', 'Otra gestión'),
    ]

    codigo_evidencia_unico = models.CharField(max_length=50, unique=True, blank=True)
    fecha_actividad = models.DateField()
    descripcion_solicitud = models.TextField()
    accion_ejecutada = models.TextField()
    contacto_nombre = models.CharField(max_length=100, null=True, blank=True)
    contacto_telefono = models.CharField(max_length=20, null=True, blank=True)
    funcionario = models.ForeignKey("accounts.Funcionario", on_delete=models.RESTRICT)
    item = models.ForeignKey("configuration.ItemMedicion", on_delete=models.RESTRICT)
    periodo = models.ForeignKey("configuration.Periodo", on_delete=models.RESTRICT)

    # ── Campos de control Tubo SGR ────────────────────────────────────────────
    tipo_registro = models.CharField(
        max_length=20, choices=TIPO_GESTION_CHOICES,
        default='accion', verbose_name='Tipo de registro'
    )
    da_puntaje = models.BooleanField(
        default=True,
        verbose_name='Da puntaje',
        help_text='False si es coordinación, falta contacto, o el delegado registra su propia gestión.'
    )
    es_gestion_delegado = models.BooleanField(
        default=False,
        verbose_name='Gestión del Delegado',
        help_text='Gestiones del delegado no se contabilizan en el puntaje del equipo.'
    )
    motivo_sin_punto = models.CharField(
        max_length=200, null=True, blank=True,
        verbose_name='Observación de registro',
        help_text='Detalle de validación del registro.'
    )
    va_a_tubo = models.BooleanField(
        default=False,
        verbose_name='Va a Tubo de Trabajo',
        help_text='Indica si esta actividad forma parte del Tubo de Trabajo SGR para seguimiento a futuro.'
    )

    def clean(self):
        super().clean()
        if self.fecha_actividad and self.periodo:
            if self.fecha_actividad < self.periodo.fecha_inicio or self.fecha_actividad > self.periodo.fecha_termino:
                raise ValidationError({'fecha_actividad': f'La fecha de la actividad debe estar dentro del período configurado ({self.periodo.fecha_inicio} a {self.periodo.fecha_termino}).'})

    @staticmethod
    def _lunes_de_semana(fecha):
        """Devuelve el lunes de la semana ISO a la que pertenece 'fecha'."""
        return fecha - timezone.timedelta(days=fecha.weekday())

    @classmethod
    def limite_diario_alcanzado(cls, funcionario, fecha=None):
        """
        Consulta de ingresos diarios por funcionario (sin bloqueo).
        Retorna (alcanzado: bool, conteo_actual: int).
        """
        from django.utils import timezone as tz
        hoy = fecha or tz.now().date()
        conteo = cls.objects.filter(funcionario=funcionario, fecha_actividad=hoy).count()
        return False, conteo

    @classmethod
    def semana_cerrada(cls, fecha_actividad):
        """
        La semana (lun-vie) se cierra el lunes de la semana siguiente.
        Retorna True si ya no se pueden ingresar actividades para esa semana.
        """
        from django.utils import timezone as tz
        hoy = tz.now().date()
        lunes_actividad = cls._lunes_de_semana(fecha_actividad)
        lunes_cierre = lunes_actividad + timezone.timedelta(weeks=1)
        return hoy > lunes_cierre

    def _evaluar_puntaje(self):
        """
        Aplica los criterios del sistema para determinar si da_puntaje = True/False.
        Modifica self.da_puntaje y self.motivo_sin_punto directamente.
        """
        razones = []

        # Si el funcionario es Delegado registrando su propia gestión:
        if self.es_gestion_delegado:
            razones.append("Gestión realizada por el delegado (se contabiliza como otra gestión)")

        # Datos de contacto solicitante:
        nombre_ok = bool(self.contacto_nombre and str(self.contacto_nombre).strip())
        telefono_ok = bool(self.contacto_telefono and str(self.contacto_telefono).strip())
        if not nombre_ok or not telefono_ok:
            faltantes = []
            if not nombre_ok:
                faltantes.append("nombre de contacto")
            if not telefono_ok:
                faltantes.append("teléfono de contacto")
            razones.append(f"Faltan datos de contacto: {', '.join(faltantes)}")

        # Coordinaciones, envíos de correo, invitaciones, gestiones internas:
        if self.tipo_registro in ('coordinacion', 'felicitacion', 'otro'):
            etiquetas = {
                'coordinacion': 'Coordinación / gestión interna',
                'felicitacion': 'Felicitación / reconocimiento',
                'otro': 'Gestión sin acción directa en terreno',
            }
            razones.append(etiquetas.get(self.tipo_registro, 'Gestión sin acción directa'))

        if razones:
            self.da_puntaje = False
            self.motivo_sin_punto = '; '.join(razones)[:200]
        else:
            self.da_puntaje = True
            self.motivo_sin_punto = None

    def save(self, *args, **kwargs):
        if not self.codigo_evidencia_unico:
            fecha_str = timezone.now().strftime('%Y%m%d')
            uid = uuid.uuid4().hex[:6].upper()
            self.codigo_evidencia_unico = f"EVI-{fecha_str}-{uid}"
        self._evaluar_puntaje()
        super().save(*args, **kwargs)

    def estado_validacion(self):
        val = ValidacionEvidencia.objects.filter(actividad=self).order_by('-created_at').first()
        if not val:
            return 'Pendiente'
        return val.resultado

    def tiene_evidencias_completas(self):
        evis = self.evidencias.filter(
            Q(imagen__gt='') | Q(archivo__gt='')
        )
        return evis.filter(momento='antes').exists() and evis.filter(momento='despues').exists()

    def __str__(self):
        return f"Actividad {self.codigo_evidencia_unico} {'✓' if self.da_puntaje else '✗'}"

class Evidencia(BaseModel):
    MOMENTO_CHOICES = [
        ('antes', 'Antes del trabajo'),
        ('despues', 'Después del trabajo'),
    ]

    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='evidencias')
    ruta_archivo_url = models.CharField(max_length=255, blank=True)
    imagen = models.ImageField(upload_to='evidencias/imagenes/', null=True, blank=True)
    archivo = models.FileField(upload_to='evidencias/archivos/', null=True, blank=True)
    momento = models.CharField(max_length=10, choices=MOMENTO_CHOICES, default='despues')
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

class TipoGestion(BaseModel):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='Activo')

    def __str__(self):
        return self.nombre

class OrganizacionComunitaria(BaseModel):
    """
    Organizaciones Comunitarias y Juntas de Vecinos de la comuna de La Serena.
    Coherente con la matriz territorial OROC y el archivo 'base datos JJVV sin verificar.xlsx'.
    """
    TIPO_CHOICES = [
        ('Junta de Vecinos', 'Junta de Vecinos'),
        ('Club de Adulto Mayor', 'Club de Adulto Mayor'),
        ('Organización Deportiva', 'Organización Deportiva'),
        ('Centro de Madres', 'Centro de Madres'),
        ('Comité de Vecinos/Seguridad', 'Comité de Vecinos o Seguridad'),
        ('Agrupación Cultural/Juvenil', 'Agrupación Cultural o Juvenil'),
        ('Comité de Vivienda/APR', 'Comité de Vivienda o APR'),
        ('Otra Organización Funcional', 'Otra Organización Funcional'),
    ]

    nombre = models.CharField(max_length=200)
    tipo_organizacion = models.CharField(max_length=100, choices=TIPO_CHOICES, default='Junta de Vecinos')
    domicilio_legal = models.CharField(max_length=250, null=True, blank=True)
    delegacion = models.ForeignKey("accounts.Delegacion", on_delete=models.SET_NULL, null=True, blank=True, related_name='organizaciones')
    sector = models.ForeignKey("accounts.Sector", on_delete=models.SET_NULL, null=True, blank=True, related_name='organizaciones')
    territorio = models.CharField(max_length=100, null=True, blank=True)
    socios_activos = models.IntegerField(default=0)
    fecha_constitucion = models.DateField(null=True, blank=True)
    numero_registro_pj = models.CharField(max_length=50, null=True, blank=True, verbose_name="N° Reg. Personalidad Jurídica")
    fecha_inscripcion_registro = models.DateField(null=True, blank=True, verbose_name="Fecha Inscripción Registro")
    registro_directiva_numero = models.CharField(max_length=50, null=True, blank=True, verbose_name="Registro Directiva N°")
    estado = models.CharField(max_length=20, default='Activa')
    # Campos adicionales coherentes con archivo JJVV xlsx
    rut = models.CharField(max_length=20, null=True, blank=True, verbose_name="RUT Organización")
    personalidad_juridica = models.CharField(max_length=100, null=True, blank=True, verbose_name="Personalidad Jurídica")
    representante_legal = models.CharField(max_length=150, null=True, blank=True, verbose_name="Representante Legal")
    telefono_contacto = models.CharField(max_length=20, null=True, blank=True, verbose_name="Teléfono Contacto")
    email_contacto = models.EmailField(max_length=100, null=True, blank=True, verbose_name="Correo Contacto")
    direccion_sede = models.CharField(max_length=250, null=True, blank=True, verbose_name="Dirección Sede")
    # Directiva estructurada (Presidente, Tesorero, Secretario)
    presidente_nombre = models.CharField(max_length=150, null=True, blank=True, verbose_name="Presidente - Nombre y Apellido")
    presidente_rut = models.CharField(max_length=20, null=True, blank=True, verbose_name="Presidente - RUT")
    presidente_correo = models.EmailField(max_length=100, null=True, blank=True, verbose_name="Presidente - Correo")
    tesorero_nombre = models.CharField(max_length=150, null=True, blank=True, verbose_name="Tesorero - Nombre y Apellido")
    tesorero_rut = models.CharField(max_length=20, null=True, blank=True, verbose_name="Tesorero - RUT")
    tesorero_correo = models.EmailField(max_length=100, null=True, blank=True, verbose_name="Tesorero - Correo")
    secretario_nombre = models.CharField(max_length=150, null=True, blank=True, verbose_name="Secretario - Nombre y Apellido")
    secretario_rut = models.CharField(max_length=20, null=True, blank=True, verbose_name="Secretario - RUT")
    secretario_correo = models.EmailField(max_length=100, null=True, blank=True, verbose_name="Secretario - Correo")
    directiva_actual = models.TextField(null=True, blank=True, verbose_name="Directiva Actual")
    observaciones = models.TextField(null=True, blank=True, verbose_name="Observaciones")

    def clean(self):
        super().clean()
        from core.utils import validar_direccion
        if self.nombre and len(self.nombre.strip()) > 200:
            raise ValidationError({'nombre': 'El nombre de la organización no puede exceder los 200 caracteres.'})
        if self.socios_activos is not None and self.socios_activos < 0:
            raise ValidationError({'socios_activos': 'El número de socios activos no puede ser negativo.'})
        if self.domicilio_legal:
            ok_dom, err_dom = validar_direccion(self.domicilio_legal, 'Domicilio Legal', 250)
            if not ok_dom:
                raise ValidationError({'domicilio_legal': err_dom})
        if self.direccion_sede:
            ok_sede, err_sede = validar_direccion(self.direccion_sede, 'Dirección Sede', 250)
            if not ok_sede:
                raise ValidationError({'direccion_sede': err_sede})

    def save(self, *args, **kwargs):
        if self.sector:
            if not self.territorio:
                self.territorio = self.sector.nombre
            if not self.delegacion:
                self.delegacion = self.sector.delegacion
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.tipo_organizacion})"

    class Meta:
        verbose_name = "Organización Comunitaria / JJVV"
        verbose_name_plural = "Organizaciones Comunitarias / JJVV"
        ordering = ['nombre']

class Vecino(BaseModel):
    nombre = models.CharField(max_length=150)
    rut = models.CharField(max_length=20, unique=True)
    direccion = models.CharField(max_length=200, null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    delegacion = models.ForeignKey("accounts.Delegacion", on_delete=models.SET_NULL, null=True, blank=True)
    sector = models.ForeignKey("accounts.Sector", on_delete=models.SET_NULL, null=True, blank=True, related_name='vecinos')
    territorio = models.CharField(max_length=100, null=True, blank=True)
    tipo_gestion = models.ForeignKey(TipoGestion, on_delete=models.SET_NULL, null=True, blank=True)
    estado = models.CharField(max_length=20, default='Activo')

    def clean(self):
        super().clean()
        from core.utils import validar_rut, validar_direccion
        if self.rut:
            valido, res = validar_rut(self.rut)
            if not valido:
                raise ValidationError({'rut': res})
            self.rut = res
        if self.nombre and len(self.nombre.strip()) > 150:
            raise ValidationError({'nombre': 'El nombre no puede exceder 150 caracteres.'})
        if self.direccion:
            ok_dir, err_dir = validar_direccion(self.direccion, 'Dirección', 200)
            if not ok_dir:
                raise ValidationError({'direccion': err_dir})

    def save(self, *args, **kwargs):
        from core.utils import validar_rut
        if self.rut:
            valido, res = validar_rut(self.rut)
            if valido:
                self.rut = res
        if self.sector:
            if not self.territorio:
                self.territorio = self.sector.nombre
            if not self.delegacion:
                self.delegacion = self.sector.delegacion
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.rut})"

class AtencionCiudadana(BaseModel):
    codigo_atencion = models.CharField(max_length=50, unique=True, blank=True)
    solicitante = models.CharField(max_length=150)
    vecino = models.ForeignKey(Vecino, on_delete=models.SET_NULL, null=True, blank=True)
    organizacion = models.ForeignKey(OrganizacionComunitaria, on_delete=models.SET_NULL, null=True, blank=True, related_name='atenciones')
    delegacion = models.ForeignKey("accounts.Delegacion", on_delete=models.RESTRICT)
    tipo_atencion = models.ForeignKey("configuration.TipoAtencion", on_delete=models.RESTRICT)
    sub_atencion = models.ForeignKey("configuration.SubAtencion", on_delete=models.RESTRICT)
    descripcion = models.TextField()
    origen = models.CharField(max_length=10, default='EXT', verbose_name="Interno o Externo")
    area_apoyo = models.CharField(max_length=100, null=True, blank=True, verbose_name="Área o Persona de Apoyo")
    fecha_compromiso = models.DateField(null=True, blank=True, verbose_name="Fecha de Compromiso")
    avance_observaciones = models.TextField(null=True, blank=True, verbose_name="Avance u Observaciones")
    telefono_contacto = models.CharField(max_length=30, null=True, blank=True, verbose_name="Teléfono de Contacto")
    usuario_responsable = models.ForeignKey("auth.User", on_delete=models.RESTRICT)
    creado_por = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True, related_name='atenciones_creadas', verbose_name="Creado por")
    fecha_registro = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=30, default='Registrada')
    actividad = models.ForeignKey(Actividad, on_delete=models.SET_NULL, null=True, blank=True, related_name='atenciones')
    # ── Tipo de registro propagado a la Actividad auto-creada ──
    tipo_registro = models.CharField(
        max_length=20,
        choices=Actividad.TIPO_GESTION_CHOICES,
        default='accion',
        verbose_name='Tipo de registro',
        help_text='Tipo de gestión territorial efectuada.',
    )
    # ── Matriz SGR (Lógica del Tubo): ¿Va a Tubo de Trabajo? ──
    va_a_tubo = models.BooleanField(
        default=False,
        verbose_name='Va a Tubo de Trabajo',
        help_text='Define si este requerimiento se gestiona en el Tubo de Trabajo SGR con fecha de compromiso a futuro.',
    )

    def get_evidencia_codigo(self):
        if self.actividad and self.actividad.codigo_evidencia_unico:
            return self.actividad.codigo_evidencia_unico
        return f"EVI-{self.codigo_atencion.replace('AT-', '')}"

    def get_codigo_tubo(self):
        return f"TUB-{self.id:05d}" if self.id else "TUB-00000"

    def estado_evidencia(self):
        if self.actividad:
            return self.actividad.estado_validacion()
        return "Pendiente"

    def tiene_evidencias_completas(self):
        if not self.actividad_id:
            return False
        return self.actividad.tiene_evidencias_completas()

    def save(self, *args, **kwargs):
        is_new = self.id is None
        if not self.codigo_atencion:
            year = timezone.now().year
            last = AtencionCiudadana.all_objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            uid = uuid.uuid4().hex[:4].upper()
            self.codigo_atencion = f"AT-{year}-{next_num:04d}-{uid}"
        if not self.creado_por and self.usuario_responsable:
            self.creado_por = self.usuario_responsable
        super().save(*args, **kwargs)

        if not self.actividad_id:
            get_or_create_actividad_para_atencion(self)

    def __str__(self):
        return f"{self.codigo_atencion} - {self.solicitante}"


def get_or_create_actividad_para_atencion(atencion):
    """
    Garantiza que una AtencionCiudadana tenga una Actividad vinculada con código EVI único,
    generando dinámicamente cualquier dependencia faltante en la base de datos (Funcionario, Periodo, ItemMedicion).
    """
    if atencion.actividad_id:
        try:
            return atencion.actividad
        except Exception:
            pass

    import datetime
    from django.utils import timezone
    from configuration.models import Periodo, ItemMedicion
    from accounts.models import Funcionario, FuncionarioRol, Delegacion, Cargo
    from django.contrib.auth.models import User

    # 1. Funcionario responsable
    func = None
    if atencion.usuario_responsable_id:
        func = Funcionario.all_objects.filter(user_id=atencion.usuario_responsable_id).first()
    if not func and atencion.delegacion_id:
        func = Funcionario.all_objects.filter(delegacion_id=atencion.delegacion_id).first()
    if not func:
        func = Funcionario.all_objects.first()
    if not func:
        del_obj = atencion.delegacion or Delegacion.objects.first()
        if not del_obj:
            del_obj = Delegacion.objects.create(nombre="Delegación Centro", codigo="DEL01", estado="Activa")
        cargo_obj = Cargo.objects.first()
        if not cargo_obj:
            cargo_obj = Cargo.objects.create(nombre_cargo="Operador Territorial", estado="Activo")
        user_obj = atencion.usuario_responsable or atencion.creado_por or User.objects.filter(is_superuser=True).first() or User.objects.first()
        func = Funcionario.objects.create(
            user=user_obj,
            identificador_institucional=f"FUNC-{user_obj.id if user_obj else 1:04d}",
            cargo=cargo_obj,
            delegacion=del_obj,
            estado="Activo",
        )

    # 2. Período
    periodo = Periodo.objects.filter(estado='Abierto').first() or Periodo.objects.first()
    if not periodo:
        anio = timezone.now().year
        periodo = Periodo.objects.create(
            fecha_inicio=datetime.date(anio, 1, 1),
            fecha_termino=datetime.date(anio, 12, 31),
            dias_computables=365,
            estado='Abierto',
        )

    # 3. Ítem de medición
    item = None
    if atencion.tipo_atencion and 'social' in atencion.tipo_atencion.nombre.lower():
        item = ItemMedicion.objects.filter(nombre_item__icontains='social').first()
    if not item:
        item = ItemMedicion.objects.filter(nombre_item__icontains='operativo').first()
    if not item:
        item = ItemMedicion.objects.first()
    if not item:
        item = ItemMedicion.objects.create(
            nombre_item="Atención Ciudadana y Requerimientos Territoriales",
            descripcion="Ítem base para requerimientos territoriales y evidencias SGR",
            estado="Activo",
        )

    # 4. Fecha válida
    hoy = timezone.now().date()
    fecha_act = hoy
    if periodo.fecha_inicio and periodo.fecha_termino:
        if hoy < periodo.fecha_inicio:
            fecha_act = periodo.fecha_inicio
        elif hoy > periodo.fecha_termino:
            fecha_act = periodo.fecha_termino

    # 5. Código único de evidencia EVI
    fecha_str = timezone.now().strftime('%Y%m%d')
    uid = uuid.uuid4().hex[:6].upper()
    cod_evi = f"EVI-{fecha_str}-{uid}"

    # 6. Datos de contacto seguros
    contacto_nombre = (atencion.solicitante[:100] if atencion.solicitante else 'Vecino/a')
    contacto_tel = (
        atencion.telefono_contacto
        or (atencion.vecino.telefono if atencion.vecino else None)
        or (atencion.organizacion.telefono_contacto if atencion.organizacion else None)
    )
    if contacto_tel:
        contacto_tel = str(contacto_tel)[:20]

    # 7. Rol delegado
    es_delegado = False
    if func:
        fr = FuncionarioRol.objects.filter(funcionario=func).select_related('rol').first()
        if fr and fr.rol and 'delegado' in fr.rol.nombre_rol.lower():
            es_delegado = True

    # 8. Crear actividad
    actividad = Actividad.objects.create(
        codigo_evidencia_unico=cod_evi,
        fecha_actividad=fecha_act,
        descripcion_solicitud=atencion.descripcion or f"Solicitud ciudadana {atencion.codigo_atencion}",
        accion_ejecutada=f"Atención ciudadana {atencion.codigo_atencion} ({atencion.tipo_atencion.nombre if atencion.tipo_atencion else 'General'})",
        contacto_nombre=contacto_nombre,
        contacto_telefono=contacto_tel,
        funcionario=func,
        item=item,
        periodo=periodo,
        tipo_registro=getattr(atencion, 'tipo_registro', 'accion') or 'accion',
        es_gestion_delegado=es_delegado,
        va_a_tubo=getattr(atencion, 'va_a_tubo', False),
    )

    AtencionCiudadana.all_objects.filter(id=atencion.id).update(actividad=actividad)
    atencion.actividad = actividad
    return actividad
