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

class Cargo(BaseModel):
    nombre_cargo = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.nombre_cargo

class Funcionario(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='funcionario')
    identificador_institucional = models.CharField(max_length=20, unique=True)
    delegacion = models.ForeignKey(Delegacion, on_delete=models.RESTRICT, null=True, blank=True)
    cargo = models.ForeignKey(Cargo, on_delete=models.RESTRICT)
    estado = models.CharField(max_length=20, default='Activo')

    def __str__(self):
        return f"{self.user.username} - {self.identificador_institucional}"

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

class FuncionarioRol(BaseModel):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('funcionario', 'rol')