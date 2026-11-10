# Sistema Municipal SGR — Municipalidad de La Serena
**VanguardSystemsGroup · Proyecto Integrado 4to Semestre INACAP · Evaluación 3**

---

## Requisitos del Sistema

| Componente | Versión |
|---|---|
| Python | 3.11+ |
| Django | 4.x |
| Django Channels | 4.3.2 |
| Daphne (ASGI) | 4.2.3 |
| openpyxl | 3.1.5 |
| Pillow | (para fotos de perfil) |

---

## Instalación y Puesta en Marcha

```bash
# 1. Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Aplicar migraciones
python manage.py migrate

# 4. Poblar la base de datos (organizaciones, atenciones, cuentas)
python manage.py seed_data

# 5. Iniciar servidor con soporte WebSocket (Daphne)
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

---

## 🔑 Cuentas de Evaluación (6 requeridas)

| # | Usuario | Contraseña | Rol | Delegación |
|---|---|---|---|---|
| ➊ | `admin_a` | `Admin1234!` | **Administrador** | Delegación Centro (acceso global) |
| ➋ | `editor_a` | `Editor1234!` | **Operador / Editor** | Delegación Centro |
| ➌ | `lector_a` | `Lector1234!` | **Consultor / Lector** | Delegación Centro |
| ➍ | `lector_b` | `Lector1234!` | **Consultor / Lector** | Delegación Norte (Las Compañías) |
| ➎ | `cliente_1` | `Cliente1234!` | **Cliente / Vecino** | Portal Ciudadano |
| ➏ | `cliente_2` | `Cliente1234!` | **Cliente / Vecino** | Portal Ciudadano |

### Cuentas Adicionales de Operación

| Usuario | Contraseña | Rol | Delegación |
|---|---|---|---|
| `admin_sgr` | `Admin1234!` | Superadministrador | Global |
| `delegado_centro` | `User1234!` | Delegado Municipal | Centro |
| `delegado_companias` | `User1234!` | Delegado Municipal | Norte / Las Compañías |
| `delegado_sur` | `User1234!` | Delegado Municipal | Sur |
| `delegado_rural` | `User1234!` | Delegado Municipal | Rural |
| `funcionario_juan` | `User1234!` | Operador | Centro |
| `consultor_ana` | `User1234!` | Consultor | Centro |

---

## 📊 Datos Semilla (Seed)

| Entidad | Total en DB | Fuente |
|---|---|---|
| Organizaciones Comunitarias / JJVV | **2.708** | `fixtures/base_datos_JJVV.xlsx` |
| Atenciones Ciudadanas | **2.100** | `fixtures/matriz_sgr.xlsx` + generadas |
| Vecinos | **60** | Seed + datos xlsx |
| Usuarios | **14** | Cuentas de evaluación + operación |

> Para re-ejecutar el seed: `python manage.py seed_data`  
> El script usa `get_or_create` — es seguro ejecutarlo múltiples veces.

---

## 🌐 WebSocket Real-Time (Django Channels)

### Conexión desde JavaScript

```javascript
// Atenciones en tiempo real
const ws = new WebSocket(`ws://${location.host}/ws/crud/atenciones/`);

// Organizaciones en tiempo real
const ws = new WebSocket(`ws://${location.host}/ws/crud/organizaciones/`);

// Vecinos en tiempo real
const ws = new WebSocket(`ws://${location.host}/ws/crud/vecinos/`);
```

### Flujo de actualización sin F5

1. Usuario A crea/edita/elimina un registro → Django emite `publish_module_changed()`
2. `transaction.on_commit()` → señal WebSocket al grupo de delegación
3. Todos los navegadores conectados reciben el evento
4. Tabla se recarga silenciosamente vía AJAX (`recargarTabla()`)

### Chat en Vivo

- URL: `/chat/`
- Namespaced: `websocket:chat_index`
- Requiere Daphne/ASGI (no funciona con `runserver` estándar)

---

## 📸 Foto de Perfil con Croppr.js

1. Ir a **Mi Perfil** → **Cambiar Foto**
2. Seleccionar imagen → se abre el recortador (relación 1:1)
3. Arrastrar para encuadrar → **Guardar Foto**
4. El sistema procesa el canvas 300×300px y guarda en `media/perfiles/`

---

## 🏘️ Portal Ciudadano (Rol Cliente)

Los usuarios con rol **Cliente** ven exclusivamente:
- Sus propias solicitudes ciudadanas
- Estado de cada solicitud (Registrada / En proceso / Resuelta)
- Formulario para nueva solicitud
- Detalle de cada atención con evidencias

> Los clientes **no** tienen acceso a listados administrativos.

---

## 📋 Módulos del Sistema

| Módulo | URL | Rol mínimo |
|---|---|---|
| Dashboard | `/inicio/` | Operador |
| Atenciones Ciudadanas | `/atenciones/` | Operador |
| Vecinos | `/vecinos/` | Operador |
| Organizaciones / JJVV | `/organizaciones/` | Operador |
| Metas SGR | `/metas/` | Coordinador |
| Tipos de Atención | `/tipo-atencion/` | Coordinador |
| Delegaciones | `/delegaciones/` | Administrador |
| Roles | `/roles/` | Administrador |
| Usuarios | `/usuarios/` | Administrador |
| Reportes | `/reportes/` | Delegado |
| Portal Ciudadano | `/portal/` | Cliente |
| Mi Perfil | `/perfil/` | Todos |
| Chat en Vivo | `/chat/` | Todos |

---

## 📤 Exportación a Excel (.xlsx)

Disponible en los módulos:
- **Atenciones** → botón "Exportar Excel" → columnas SGR Matrix
- **Organizaciones** → botón "Exportar Excel" → coherente con `base_datos_JJVV.xlsx`
- **Vecinos** → botón "Exportar Excel"

---

## ✅ Validaciones Implementadas

### RUT Chileno (Módulo 11)

- **Frontend**: Formato automático mientras escribe (`12.345.678-9`), feedback rojo/verde en tiempo real
- **Backend**: `validar_rut()` en `core/utils.py` — Módulo 11 estricto
- **Modelo**: `Vecino.clean()` llama `validar_rut()` antes de guardar
- **Campos**: Todos los inputs con `name="rut"` o `data-rut="true"`

### Límite de Caracteres (maxlength en todo)

| Campo | Límite HTML | Límite Backend |
|---|---|---|
| Nombre vecino/funcionario | 150 | `validar_largo(150)` |
| RUT | 12 | `validar_largo(20)` |
| Teléfono | 20 | `validar_largo(20)` |
| Dirección | 200 | `validar_largo(200)` |
| Descripción / Avance | 1000 | `validar_largo(1000)` |
| Nombre organización | 200 | `validar_largo(200)` |
| Domicilio legal | 250 | `validar_largo(250)` |
| Representante legal | 150 | `validar_largo(150)` |

---

## 🔄 Paginación con Sesión Persistente

Opciones: **5 / 15 / 30** registros por página.  
La selección se guarda en sesión — no se pierde al navegar entre páginas o aplicar filtros.

```
?page_size=5    # 5 registros
?page_size=15   # 15 registros (default)
?page_size=30   # 30 registros
```

---

## 🚨 Páginas de Error Personalizadas

| Error | Descripción | Plantilla |
|---|---|---|
| 400 | Solicitud incorrecta | `templates/errors/400.html` |
| 403 | Acceso prohibido | `templates/errors/403.html` |
| 404 | Página no encontrada | `templates/errors/404.html` |
| 500 | Error interno del servidor | `templates/errors/500.html` |

Registradas en `config/urls.py` como `handler400`, `handler403`, `handler404`, `handler500`.

---

## 🗂️ Estructura del Proyecto

```
VanguardSystemsGroup/
├── accounts/          # Modelos: Funcionario, Rol, Delegación, Sector
├── activities/        # Modelos: AtencionCiudadana, Vecino, OrganizacionComunitaria
├── agenda/            # Compromisos y ajustes de desempeño
├── analytics/         # Reportes y métricas
├── configuration/     # TipoAtencion, SubAtencion, Periodo, Metas
├── core/              # Views principal, utils, context_processors
│   └── management/commands/seed_data.py
├── websocket/         # Django Channels: chat y CRUD en tiempo real
├── config/            # settings.py, urls.py, asgi.py
├── templates/
│   ├── base.html
│   ├── auth/          # login, perfil, cambio contraseña
│   ├── errors/        # 400, 403, 404, 500
│   ├── gestion/       # atenciones, vecinos, organizaciones, ...
│   └── portal/        # Portal ciudadano cliente
├── fixtures/
│   ├── base_datos_JJVV.xlsx   # 2.708 organizaciones comunitarias
│   └── matriz_sgr.xlsx         # Atenciones SGR
└── media/perfiles/    # Fotos de perfil (Croppr.js)
```

---

## 🔧 Variables de Entorno (.env)

```env
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

---

*Sistema desarrollado como proyecto académico para la asignatura Proyecto Integrado — INACAP La Serena, 4to Semestre 2026.*
