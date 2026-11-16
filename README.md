# Sistema de Gestión Territorial — Municipalidad de La Serena
**VanguardSystemsGroup · Proyecto Integrado y Programación BackEnd - INACAP La Serena 2026**

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

## 🌐 Despliegue en AWS (Criterio 5)
- **URL Pública:** `http://34.227.36.243`
- **Servidor Web y ASGI:** Nginx 1.24 (Reverse Proxy) + Daphne 4.2.3 (ASGI)
- **Base de Datos:** MySQL / SQLite persistente con soporte transaccional
- **Soporte:** HTTP y WebSockets (`ws://`) completamente operativos en producción con DEBUG=False.

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

### Cuentas de Organización / JJVV (Portal Organización)

| Organización | Usuario / RUT | Correo | Contraseña | Delegación |
|---|---|---|---|---|
| **JJVV N° 1 Casco Histórico** | `65.111.001-7` | `jjvv.centro@organizacion.cl` | `Cliente1234!` | Delegación Centro |
| **JJVV N° 12 Las Compañías** | `65.111.002-5` | `jjvv.norte@organizacion.cl` | `Cliente1234!` | Delegación Norte |
| **JJVV El Milagro I** | `65.111.003-3` | `jjvv.sur@organizacion.cl` | `Cliente1234!` | Delegación Sur |
| **JJVV Algarrobito** | `65.111.004-1` | `jjvv.rural@organizacion.cl` | `Cliente1234!` | Delegación Rural |

### Cuentas Adicionales de Operación (Funcionarios)

| Usuario | Correo | Contraseña | Rol | Delegación |
|---|---|---|---|---|
| `admin_sgr` | `admin@laserena.cl` | `Admin1234!` | Superadministrador | Global |
| `delegado_centro` | `delegado.centro@laserena.cl` | `User1234!` | Delegado Municipal | Centro |
| `delegado_companias` | `delegado.companias@laserena.cl` | `User1234!` | Delegado Municipal | Norte / Las Compañías |
| `delegado_sur` | `delegado.sur@laserena.cl` | `User1234!` | Delegado Municipal | Sur |
| `delegado_rural` | `delegado.rural@laserena.cl` | `User1234!` | Delegado Municipal | Rural |
| `funcionario_juan` | `juan.perez@laserena.cl` | `User1234!` | Operador | Centro |
| `consultor_ana` | `ana.ejemplo@laserena.cl` | `User1234!` | Consultor | Centro |

> **Nota sobre inicio de sesión:**
> - Los **Funcionarios** pueden ingresar con su **usuario** (generado como inicial + apellido paterno al crear nuevos registros) o con su **correo electrónico**.
> - Los **Vecinos** y **Organizaciones / JJVV** pueden ingresar con su **RUT** o con su **correo electrónico** (los vecinos generados por el seed usan contraseña `Cliente1234!`).

---

## 👥 Matriz de Responsabilidades y Recorridos de Prueba (Página 4 y Criterio 5)

| Alias | Rol | Ámbito / Delegación | Responsabilidad en el Sistema | Acciones Permitidas | Acciones Restringidas | Recorrido de Prueba y Resultado Esperado |
|---|---|---|---|---|---|---|
| **Administrador A** (`admin_a`) | Administrador | Delegación Centro (conmutación global) | Gestión integral del sistema y administración de usuarios. | Ver, crear, editar, archivar y eliminar registros; gestionar usuarios y delegaciones; exportar Excel. | Restricciones de seguridad general. | Iniciar sesión → ingresar a `/gestion/usuarios/` → crear/editar usuario → verificar persistencia → eliminar registro con confirmación SweetAlert2 → operación exitosa con retroalimentación. |
| **Editor A** (`editor_a`) | Operador / Editor | Delegación Centro | Registro y gestión operativa territorial. | Ver, crear y editar dentro de Delegación Centro; adjuntar evidencias; exportar Excel. | **No puede eliminar ni archivar registros** (bloqueado por UI y backend). | Iniciar sesión → registrar atención en modal → verificar actualización en tiempo real en sesión de lector sin F5 → intentar eliminar registro por URL o petición directa → **recibe rechazo (403/Alerta de acceso denegado)**. |
| **Lector A** (`lector_a`) | Consultor / Lector | Delegación Centro | Consulta, seguimiento y auditoría territorial. | Ver y exportar a Excel exclusivamente registros autorizados del ámbito Centro. | **No puede crear, editar, archivar ni eliminar registros**. | Iniciar sesión → observar tabla de atenciones sin recargar mientras Editor A guarda un registro (actualización WebSocket sin F5) → intentar crear o editar registro vía URL/POST → **rechazo (403)**. |
| **Lector B** (`lector_b`) | Consultor / Lector | Delegación Norte (Las Compañías) | Consulta y auditoría territorial norte. | Ver y exportar a Excel exclusivamente registros del ámbito Norte. | **No puede acceder a registros de Delegación Centro ni otros ámbitos**. | Iniciar sesión → verificar que solo se muestran registros de Delegación Norte → intentar acceder por ID a una atención de Delegación Centro → **rechazo 404/403 sin revelar datos ajenos**. No recibe eventos WebSocket de Centro. |
| **Cliente 1** (`cliente_1`) | Cliente / Vecino | Portal Ciudadano | Consulta de requerimientos personales y perfil propio. | Consultar únicamente sus propias atenciones ciudadanas y estado; editar su foto de perfil con Croppr.js. | **Acceso denegado a módulos administrativos (`/gestion/...`) y a datos de otros clientes**. | Iniciar sesión → redirige a `/portal/` → consulta sus solicitudes → abre detalle propio → edita foto con recorte Croppr.js → intenta acceder a `/portal/atencion/{id_cliente_2}/` → **rechazo sin revelar datos**. |
| **Cliente 2** (`cliente_2`) | Cliente / Vecino | Portal Ciudadano | Consulta de requerimientos personales y perfil propio. | Consultar únicamente sus propias atenciones ciudadanas y estado; editar su foto de perfil con Croppr.js. | **Acceso denegado a módulos administrativos y a datos de otros clientes**. | Iniciar sesión en navegador/incógnito independiente → verificar que sus solicitudes son distintas a las de Cliente 1 → intentar URL administrativa (`/gestion/atenciones/`) → **bloqueo inmediato con redirección o 403**. |

---

## 📊 Datos Semilla (Seed)

| Entidad | Total en DB | Fuente |
|---|---|---|
| Organizaciones Comunitarias / JJVV | **2.712+** | `fixtures/base_datos_JJVV.xlsx` + 4 JJVV destacadas con directiva y cuentas `ORG-` |
| Atenciones Ciudadanas | **2.200+** | `fixtures/matriz_sgr.xlsx` + generadas + vinculadas a JJVV |
| Vecinos | **62+** | Seed con nombres estructurados y cuentas ciudadanas `VEC-` |
| Usuarios | **79+** | Funcionarios + vecinos ciudadanos + cuentas de organizaciones |

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
- Usa Django Channels sobre ASGI; los mensajes se envían en conversaciones estrictamente 1 a 1.
- Cada mensaje registra emisor, receptor y `leido`. Los participantes solo pueden consultar mensajes dirigidos a ellos o enviados por ellos. Delegación Global puede revisar todas las conversaciones activas; las conversaciones ajenas son de solo lectura.
- Delegación Global puede iniciar un chat privado con cualquier funcionario; delegados pueden contactar a administración y los demás usuarios solo a personas autorizadas de su delegación.
- Los mensajes entrantes actualizan las burbujas de no leídos por contacto. Abrir la conversación marca como leídos los mensajes recibidos. WebSockets notifican los mensajes nuevos en tiempo real.
- El directorio permite filtrar contactos por RUT/ID, nombre, apellido, cargo, sección y delegación. Administración gestiona los contactos desde **Usuarios**.
- El `chat_id` persistido se calcula como `direct_<menor user_id>_<mayor user_id>`; así es estable, no depende de quién inicia y distingue dos pares de usuarios incluso dentro de las mismas delegaciones. Mensajes, consultas y WebSockets usan exclusivamente ese identificador.
- La migración `websocket.0002_private_messages` conserva el historial de salas compartidas en un archivo separado no expuesto por el chat, y `websocket.0003_chat_id` agrega y rellena el ID único de cada pareja privada.
- Después de actualizar, ejecutar `python manage.py migrate`.
- El directorio permite filtrar contactos por RUT/ID, nombre, apellido, cargo, sección y delegación. Administración gestiona los contactos desde **Usuarios**.
- Después de actualizar, ejecutar `python manage.py migrate` para crear el historial de mensajes y asignación de sección a funcionarios.

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
| Metas | `/metas/` | Coordinador |
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
- **Atenciones** → botón "Exportar Excel" → columnas Matriz Territorial
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
│   └── matriz_sgr.xlsx         # Atenciones territoriales
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

*Sistema desarrollado como proyecto académico para la asignatura Proyecto Integrado y Programación BackEnd — INACAP La Serena, 4to Semestre 2026.*
