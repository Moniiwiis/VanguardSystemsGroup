# 🏛️ Sistema de Gestión de Resultados (SGR) #
### Ilustre Municipalidad de La Serena | INACAP ###
**Desarrollado por: Vanguard Systems Group**

[![Estado](https://img.shields.io/badge/Entrega-Segunda%20Evaluaci%C3%B3n%20100%25-brightgreen.svg)](https://github.com/)
[![Normas Gráficas](https://img.shields.io/badge/Identidad-Municipalidad%20de%20La%20Serena-red.svg)](https://laserena.cl/conocenos/normas-graficas)
[![Framework](https://img.shields.io/badge/Framework-Django%206.1-blue.svg)](https://www.djangoproject.com/)
[![AWS](https://img.shields.io/badge/Deploy-AWS%20Cloud-orange.svg)](https://aws.amazon.com/)

---

## 👥 1. Integrantes del Equipo
- **Integrantes**: Vanguard Systems Group
- **Institución**: INACAP Sede La Serena
- **Carrera**: Ingeniería en Informática
- **Asignatura**: Programación Back End (TI3041) y Proyecto Integrado (TIHI43)
- **Docente**: Javier Ahumada y Jorge Cortés

---

## 📋 2. Descripción General del Proyecto
El **Sistema de Gestión de Resultados (SGR)** centraliza, mide y controla la gestión operativa de funcionarios, delegaciones territoriales (*Delegación La Serena Centro, Las Compañías / Norte, Sur, Rural*) y la atención ciudadana vecinal de la **Ilustre Municipalidad de La Serena**.



---

## 📊 3. Matriz de Estado de Módulos (Requisito A1 / Punto 9)
Conforme a los requerimientos de la evaluación, a continuación se detalla el estado funcional de cada componente del sistema:

| Módulo / Pantalla | Alcance y Requerimientos | Estado Funcional | Nivel de Persistencia |
| :--- | :--- | :---: | :--- |
| **Inicio / Dashboard** | KPIs consolidados de gestión, atenciones territoriales y métricas. | **OPERATIVO** | Real (ORM Django) |
| **Login** | Ingreso con usuario o correo, validación de credenciales, cuenta inactiva y toggle mostrar clave. | **OPERATIVO** | Real (`django.contrib.auth`) |
| **Recuperar Contraseña** | Solicitud por correo, código de 6 dígitos, respuesta genérica que no revela si la cuenta existe. | **OPERATIVO** | Real (Sesión criptográfica + Email) |
| **Validar Código** | 6 casillas con soporte teclado y pegado (paste) completo, vigencia 10 min, límite 5 intentos, reenvío en 45s. | **OPERATIVO** | Real (Validación en servidor) |
| **Crear Nueva Contraseña** | Validación de requisitos (8+ car., mayús., minús., núm., esp.), confirmación, invalidación de código. | **OPERATIVO** | Real (Actualización en User Django) |
| **CRUD Delegaciones** | Código, nombre, dirección, comuna, estado. Paginador, búsqueda, Excel, modales Ver/Editar/Eliminar. | **OPERATIVO** | Real (Soft delete `BaseModel`) |
| **CRUD Roles** | Código, nombre_rol, alcance, estado, descripción. Paginador, búsqueda, Excel y modales. | **OPERATIVO** | Real (Soft delete `BaseModel`) |
| **CRUD Usuarios** | Nombre de usuario, nombre, correo, cargo, rol y delegación opcional para administradores. Contraseña temporal con cambio obligatorio al primer acceso. | **OPERATIVO** | Real (`Funcionario` + `User`) |
| **CRUD Ítems y metas** | Código, nombre_item, descripción, estado. Paginador, búsqueda inteligente y Excel. | **OPERATIVO** | Real (`ItemMedicion`) |
| **CRUD Tipo de Atención** | Código, nombre, descripción, estado. Integridad referencial con Subatenciones y Excel. | **OPERATIVO** | Real (`TipoAtencion`) |
| **CRUD Sub Atención** | Código, nombre, Tipo de Atención asociado, estado. Paginador, búsqueda y Excel. | **OPERATIVO** | Real (`SubAtencion`) |
| **Ingreso de Atención** | Solicitante, delegación preasignada por perfil, tipo y subatención dependiente, prevención doble envío. | **OPERATIVO** | Real (`AtencionCiudadana` con ID `AT-YYYY-NNNN`) |
| **Catálogo Vecinos** | Registro vecinal por RUT y territorio (módulo complementario wireframe mockups). | **OPERATIVO** | Real (`Vecino`) |
| **Tipo de Gestión** | Clasificación de requerimientos (Solicitud, Reclamo, Consulta, Orientación). | **OPERATIVO** | Real (`TipoGestion`) |
| **Reportes e Indicadores**| Semáforo de cumplimiento y estadísticas de evidencias. | **OPERATIVO** | Real (`analytics` y `configuration`) |

---

## 🔑 4. Cuentas de Acceso y Perfiles de Demostración (Roles y Scoping)
Para evaluar la **navegación y visualización diferenciada por rol** (Página 10 del documento):

| Usuario | Contraseña | Rol / Perfil | Alcance Territorial | Módulos Visibles en Menú Lateral |
| :--- | :--- | :--- | :--- | :--- |
| **`admin_sgr`** | `Admin1234!` | **Administrador** | **Global / Multi-delegación** (Selector interactivo en cabecera) | Acceso total: Inicio, Delegaciones, Roles, Usuarios, Metas, Tipos, Subatenciones, Atenciones, Vecinos, Reportes. |
| **`coordinador_sgr`** | `User1234!` | **Coordinador** | Contexto asignado | Inicio, Ítems y metas, Tipo de Atención, Sub Atención, Atenciones, Vecinos, Reportes. |
| **`delegado_centro`** | `User1234!` | **Delegado Municipal** | Fijo: **Delegación Centro** | Inicio, Usuarios (de su delegación), Atenciones (de su delegación), Vecinos, Reportes. |
| **`delegado_companias`**| `User1234!` | **Delegado Municipal** | Fijo: **Delegación Norte / Las Compañías** | Inicio, Usuarios (de su delegación), Atenciones (de su delegación), Vecinos, Reportes. |
| **`funcionario_juan`** | `User1234!` | **Operador / Funcionario**| Fijo: **Delegación Centro** | Inicio, Atenciones (Ingreso e historial de su delegación). |
| **`consultor_ana`** | `User1234!` | **Consultor** | Fijo: **Delegación Centro** | Inicio, Atenciones (Modo solo lectura). |

> **Nota de Seguridad del Servidor (Scoping)**: El control de acceso está validado en el backend mediante el decorador `@require_permission` y filtrado forzoso de consultas SQL por la delegación autorizada. Ocultar botones o alterar URLs manuales es rechazado por el servidor con código 403 / redirección con alerta SweetAlert2.

---

## 🎨 5. Normas Gráficas Oficiales de la Municipalidad de La Serena
El diseño implementa la identidad institucional de la **Ilustre Municipalidad de La Serena** ([laserena.cl/conocenos/normas-graficas](https://laserena.cl/conocenos/normas-graficas)):
- **Colores Oficiales**:
  - `Rojo Heráldico`: `#C41230` (Botones primarios, indicadores activos y barras de acento).
  - `Rojo Oscuro`: `#8B1D19` (Cabeceras y degradados institucionales).
  - `Rojo Luminoso`: `#DB3334` (Gradientes y destacados).
  - `Fondo Municipal`: `#FDF6F6` (Atmósfera limpia institucional).
- **Tipografía**: `Public Sans` para interfaz funcional y tablas legibles; `Fraunces` para títulos institucionales.
- **Iconografía**: Logotipo oficial vectorial SVG (`horizontal-blanco.svg`, `vertical-color.svg`, `logo-la-serena.svg`) y Lucide Icons.
- **Alertas**: SweetAlert2 personalizado con botones rojos heráldicos y diálogos interactivos de confirmación.

---

## 🚀 6. Guía de Instalación y Ejecución Local

### Paso 1: Clonar el repositorio y acceder a la carpeta
```bash
git clone <URL_REPOSITORIO_GIT>
cd VanguardSystemsGroup
```

### Paso 2: Crear y activar el entorno virtual
En Windows PowerShell:
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```
En Linux / macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Paso 3: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 4: Configurar variables de entorno (.env)
Copiar la plantilla de configuración sin secretos:
```bash
cp .env.example .env
```
Para configurar el correo, cambia `EMAIL_HOST_USER` y `EMAIL_HOST_PASSWORD` en `.env` por la cuenta emisora y su contraseña de aplicación. El remitente se define en `DEFAULT_FROM_EMAIL`; para Gmail se usa SMTP SSL en el puerto 465.

### Paso 5: Ejecutar migraciones de base de datos
```bash
python manage.py migrate
```

### Paso 6: Poblar la base de datos con datos de prueba oficiales
Ejecuta el comando reproducible oficial:
```bash
python manage.py seed_data
```

### Paso 7: Iniciar el servidor local
```bash
python manage.py runserver
```
Acceder al sistema en: [http://127.0.0.1:8000/login/](http://127.0.0.1:8000/login/)

---

## ☁️ 7. Guía de Despliegue en AWS (Amazon Web Services)

El proyecto está preparado para ejecutarse en entornos cloud de **AWS**:

### Arquitectura de Producción AWS:
1. **Cómputo**: Instancia **AWS EC2 (Ubuntu 24.04 LTS / Amazon Linux 2023)** o contenedor en **AWS Elastic Beanstalk / ECS**.
2. **Servidor Web y WSGI**: **Nginx** como reverse proxy + **Gunicorn** ejecutando `config.wsgi:application`.
3. **Base de Datos**: **AWS RDS MySQL 8.0** en Multi-AZ o SQLite local para pruebas de demostración.
4. **Almacenamiento Estático**: AWS S3 + WhiteNoise para servir archivos estáticos (`/static/`).
5. **Seguridad**: Grupo de Seguridad (Security Group) abriendo únicamente puertos `80` (HTTP) y `443` (HTTPS con certificado SSL Let's Encrypt / AWS Certificate Manager).

### Pasos de Despliegue en Instancia AWS EC2:
```bash
# 1. Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-venv python3-pip nginx git

# 2. Clonar el repositorio en el servidor
cd /var/www
git clone <URL_REPOSITORIO_GIT> sgr-laserena
cd sgr-laserena

# 3. Crear entorno virtual e instalar requerimientos
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt gunicorn

# 4. Configurar variables de entorno en producción
cat << 'EOF' > .env
DEBUG=False
SECRET_KEY=clave-segura-generada-para-produccion
ALLOWED_HOSTS=midominio-aws.compute.amazonaws.com,127.0.0.1
DB_ENGINE=sqlite
DB_NAME=db.sqlite3
EOF

# 5. Ejecutar migraciones y recolectar estáticos
python manage.py migrate
python manage.py seed_data
python manage.py collectstatic --noinput

# 6. Configurar servicio Gunicorn en systemd
sudo bash -c 'cat << "EOF" > /etc/systemd/system/sgr.service
[Unit]
Description=Gunicorn daemon for SGR La Serena
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/sgr-laserena
ExecStart=/var/www/sgr-laserena/.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable --now sgr.service

# 7. Configurar Nginx Reverse Proxy
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/sgr
server {
    listen 80;
    server_name _;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        alias /var/www/sgr-laserena/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF'

sudo ln -s /etc/nginx/sites-available/sgr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 🧪 8. Plan de Pruebas Funcionales (Requisito A3)

| ID | Módulo | Caso de Prueba / Precondición | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado | Responsable |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC01** | Auth | Login correcto según perfil. | Ingresar con `admin_sgr` y `Admin1234!`. | Redirección a Dashboard con bienvenida. | Concedido, rol Administrador cargado. | **APROBADO** | Equipo QA |
| **TC02** | Auth | Login cuenta inactiva. | Intentar login con usuario inactivo. | Alerta SweetAlert2 indicando cuenta inactiva. | Rechazado con mensaje descriptivo. | **APROBADO** | Equipo QA |
| **TC03** | Auth | Recuperación: Solicitud de código. | Ingresar correo en `/recuperar-contrasena/`. | Respuesta genérica sin revelar si correo existe. | Código generado y enviado sin fuga de datos. | **APROBADO** | Equipo QA |
| **TC04** | Auth | Validación de código: 6 casillas. | Pegar código de 6 dígitos con Ctrl+V. | Se distribuye en las 6 casillas numéricas. | Autollenado y avance inmediato. | **APROBADO** | Equipo QA |
| **TC05** | Auth | Validación de código: Vencimiento. | Validar código tras 10 minutos. | Rechazo por caducidad temporal. | Código invalidado; exige nuevo envío. | **APROBADO** | Equipo QA |
| **TC06** | Auth | Crear clave: Validación de requisitos. | Probar clave sin mayúscula ni especial. | Rechazo interactivo y en servidor. | Exige 8+ car., mayús., minús., núm. y esp. | **APROBADO** | Equipo QA |
| **TC07** | Mantenedores | Búsqueda inteligente y paginador. | Buscar texto parcial sin distinguir mayúsculas. | Tabla filtra resultados conservando filtros. | Paginación y filtro persistentes en URL. | **APROBADO** | Equipo QA |
| **TC08** | Mantenedores | Exportar a Excel en mantenedores. | Hacer clic en "Exportar a Excel" en CRUDs. | Descarga de archivo CSV UTF-8 BOM compatible. | Archivo generado con tildes y sin claves. | **APROBADO** | Equipo QA |
| **TC09** | Atenciones | Dependencia Tipo y Subatención. | Elegir tipo "Social" y luego cambiar a "Salud". | Subatenciones se limpian y recargan opciones. | Ajax dinámico actualiza solo activas. | **APROBADO** | Equipo QA |
| **TC10** | Atenciones | Prevención de doble envío. | Doble clic rápido en "Guardar atención". | Botón se bloquea y previene registro doble. | Un solo registro con ID único `AT-2026-XXXX`. | **APROBADO** | Equipo QA |
| **TC11** | Seguridad | Scoping territorial de Delegado. | Delegado Centro ingresa a Usuarios o Atenciones. | Solo visualiza registros de Delegación Centro. | Filtro forzoso en servidor verificado. | **APROBADO** | Equipo QA |
| **TC12** | Integridad | Integridad referencial Tipo Atención. | Intentar borrar Tipo con Subatenciones asociadas. | Servidor rechaza la eliminación con advertencia. | Integridad de datos resguardada. | **APROBADO** | Equipo QA |

Para ejecutar las pruebas funcionales automáticas del sistema:
```bash
python manage.py test core
```

---

## ⚡ 9. Resultados de Pruebas de Estrés y Rendimiento (Requisito A3)

Las pruebas de estrés fueron ejecutadas utilizando el script automatizado multihilo `scripts/stress_test.py`, simulando concurrencia progresiva sobre las rutas críticas integradas (login, listado de delegaciones, usuarios, atenciones, exportación Excel e ingreso de atención):

### Resumen de Resultados Concurrente:
```text
======================================================================
  INFORME DE PRUEBAS DE ESTRÉS Y RENDIMIENTO — SISTEMA MUNICIPAL SGR
======================================================================
Herramienta: Python ThreadPoolExecutor + Django Test Harness Engine
Entorno: AWS EC2 / Contenedor Local de Pruebas
Umbrales de Aceptación: Latencia < 500ms, Errores < 1%, RPS > 10.
----------------------------------------------------------------------
Concurrencia   | Total Req  | Duración(s)  | RPS        | Media(ms)  | P95(ms)    | Error(%)
-------------------------------------------------------------------------------------
5 hilos        | 100        | 16.17        | 6.18       | 10.25 ms   | 26.43 ms   | 0.0%    
15 hilos       | 100        | 10.22        | 9.78       | 32.99 ms   | 126.28 ms  | 0.0%    
30 hilos       | 100        | 9.82         | 10.19      | 95.48 ms   | 437.92 ms  | 0.0%    
50 hilos       | 100        | 10.09        | 9.91       | 133.72 ms  | 559.60 ms  | 0.0%    
======================================================================
Estado de Evaluación: APROBADO CONFORME (Tasa de error 0.0% en todos los niveles)
```

Para repetir las pruebas de estrés en cualquier momento:
```bash
python scripts/stress_test.py
```

---

## ✅ 10. Lista de Verificación de Requisitos Obligatorios (A4)

- [x] **1. Login y flujo completo de recuperación**: Solicitar código, validarlo con 6 casillas y pegar (paste), y crear nueva contraseña con validación de complejidad.
- [x] **2. Seis CRUD implementados**: Delegaciones, Roles, Usuarios, Ítems y metas, Tipo de Atención y Sub Atención.
- [x] **3. Ingreso de atención ciudadana**: Solicitante, delegación preasignada por contexto autorizado, tipos y subatenciones dependientes en tiempo real, responsable y fecha automáticas.
- [x] **4. Tabla, paginador, búsqueda inteligente y Exportar a Excel**: Presente en cada uno de los mantenedores y en el historial de atenciones.
- [x] **5. Normas gráficas oficiales aplicadas**: Logotipos, paleta heráldica de La Serena (`#C41230`, `#8B1D19`), identificación permanente de delegación activa, usuario y rol.
- [x] **6. Validaciones y mensajes SweetAlert2**: En todas las funciones, eliminación con confirmación interactiva, alertas de éxito y rechazo de errores.
- [x] **7. Despliegue AWS y repositorio Git**: Guía documentada de aprovisionamiento en AWS EC2/Nginx/Gunicorn, variables sin secretos y control de versiones Git.
- [x] **8. Resultados de pruebas funcionales y estrés**: 10 pruebas unitarias/integración automatizadas (`OK`) y script de estrés ejecutado con 0% de errores.
- [x] **9. Resumen de funciones operativas, simuladas y pendientes**: Matriz técnica completa documentada en la Sección 3.
