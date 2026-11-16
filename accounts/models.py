from django.db import models
from django.contrib.auth.models import User
from core.models import BaseModel

class Delegacion(BaseModel):
    codigo = models.CharField(max_length=20, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200, null=True, blank=True)
    comuna = models.CharField(max_length=100, null=True, blank=True)
    estado = models.CharField(max_length=20, default='Activa')
    ambito = models.CharField(max_length=100, null=True, blank=True)

    def get_codigo(self):
        if self.codigo:
            return self.codigo
        return f"DEL{self.id:02d}" if self.id else "DEL01"

    def __str__(self):
        return f"{self.get_codigo()} - {self.nombre}"

    class Meta:
        db_table = 'accounts_delegation'

class Sector(BaseModel):
    codigo = models.CharField(max_length=20, null=True, blank=True)
    nombre = models.CharField(max_length=150)
    delegacion = models.ForeignKey(Delegacion, on_delete=models.CASCADE, related_name='sectores')
    descripcion = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='Activo')

    def get_codigo(self):
        if self.codigo:
            return self.codigo
        return f"SEC{self.id:02d}" if self.id else "SEC01"

    def __str__(self):
        return f"{self.nombre} ({self.delegacion.nombre})"

    class Meta:
        db_table = 'accounts_sector'
        verbose_name = "Sector / Territorio"
        verbose_name_plural = "Sectores / Territorios"
        ordering = ['delegacion', 'nombre']

class Cargo(BaseModel):
    nombre_cargo = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.nombre_cargo

    class Meta:
        db_table = 'accounts_position'

class Funcionario(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='funcionario')
    identificador_institucional = models.CharField(max_length=20, unique=True)
    rut = models.CharField(max_length=20, null=True, blank=True)
    primer_nombre = models.CharField(max_length=50, blank=True, default='')
    segundo_nombre = models.CharField(max_length=50, blank=True, default='')
    apellido_paterno = models.CharField(max_length=50, blank=True, default='')
    apellido_materno = models.CharField(max_length=50, blank=True, default='')
    delegacion = models.ForeignKey(Delegacion, on_delete=models.RESTRICT, null=True, blank=True)
    cargo = models.ForeignKey(Cargo, on_delete=models.RESTRICT)
    estado = models.CharField(max_length=20, default='Activo')
    debe_cambiar_contrasena = models.BooleanField(default=False)
    foto = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True, verbose_name='Teléfono de contacto')

    def get_partes_nombre(self):
        from core.utils import separar_nombre_usuario
        if self.primer_nombre or self.apellido_paterno:
            return (
                self.primer_nombre,
                self.segundo_nombre,
                self.apellido_paterno,
                self.apellido_materno,
            )
        return separar_nombre_usuario(self.user.first_name, self.user.last_name)

    def get_nombre_corto(self):
        pn, _sn, ap, _am = self.get_partes_nombre()
        return ' '.join(p for p in (pn, ap) if p).strip() or self.user.username

    def get_nombre_completo(self):
        from core.utils import construir_nombre_completo
        pn, sn, ap, am = self.get_partes_nombre()
        return construir_nombre_completo(pn, sn, ap, am) or self.user.first_name or self.user.username

    def get_foto_url(self):
        if self.foto and hasattr(self.foto, 'url'):
            return self.foto.url
        return None

    def get_rut(self):
        if self.rut:
            return self.rut
        from activities.models import Vecino
        from core.utils import validar_rut
        if self.identificador_institucional and self.identificador_institucional.startswith('VEC-'):
            raw = self.identificador_institucional[4:]
            ok, fmt = validar_rut(raw)
            if ok:
                return fmt
        vec = Vecino.objects.filter(rut=self.user.username).first()
        return vec.rut if vec else ''

    def __str__(self):
        return f"{self.user.username} - {self.identificador_institucional}"

    class Meta:
        db_table = 'accounts_staff'

class Rol(BaseModel):
    codigo = models.CharField(max_length=20, null=True, blank=True)
    nombre_rol = models.CharField(max_length=50)
    descripcion = models.TextField(null=True, blank=True)
    alcance = models.CharField(max_length=50, default='Delegación')
    estado = models.CharField(max_length=20, default='Activo')
    permisos = models.TextField(null=True, blank=True)

    def get_codigo(self):
        if self.codigo:
            return self.codigo
        return f"ROL{self.id:02d}" if self.id else "ROL01"

    def __str__(self):
        return self.nombre_rol

    class Meta:
        db_table = 'accounts_role'

class FuncionarioRol(BaseModel):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)

    class Meta:
        db_table = 'accounts_staff_role'
        unique_together = ('funcionario', 'rol')