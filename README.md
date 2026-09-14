# 🏛️ Sistema de Gestión de Resultados (SGR)
### Ilustre Municipalidad de La Serena — Proyecto Integrador

[![Estado](https://img.shields.io/badge/Estado-Completado-brightgreen.svg)](https://github.com/)
[![Institución](https://img.shields.io/badge/Institución-INACAP-red.svg)](https://www.inacap.cl/)
[![Tecnologías](https://img.shields.io/badge/Tech-HTML5%20%7C%20JS%20React%20%7C%20TailwindCSS-blue.svg)](https://react.dev/)

---

## 📋 Descripción del Proyecto

El **Sistema de Gestión de Resultados (SGR)** es una solución web responsiva desarrollada para centralizar, medir y controlar la gestión operativa de funcionarios y delegaciones de la **Ilustre Municipalidad de La Serena** (*Delegación Rural, Centro, Las Compañías, Avenida del Mar, La Pampa y La Antena*).

La plataforma permite realizar el seguimiento de solicitudes ciudadanas, gestionar la agenda colectiva de compromisos futuros, respaldar la ejecución mediante evidencias fotográficas con códigos únicos inmutables y calcular automáticamente los indicadores de cumplimiento ponderado y el semáforo diario de desempeño.

---

## 🌟 Características Principales

### 1. 👥 Gestión de Empleados y Funcionarios (CRUD Completo)
- **Lista General & Filtros**: Búsqueda en tiempo real por RUT, nombre o cargo; filtros por Departamento/Delegación y Estado (*Activo / Inactivo*); tabla con paginación interactiva.
- **Registro y Edición de Personal**: Formulario con validación de obligatoriedad (*), verificación de formato de correo electrónico y control de RUT único en base de datos.
- **Ficha Detalle del Empleado**: Vista de consulta con perfil laboral, métricas SGR individuales, metas trimestrales, compromisos asignados y catálogo de evidencias cargadas.

### 2. 🛡️ Modales de Validación y Seguridad (Guía RF-010 & CA-07)
- **Modal Confirmar Eliminación**: Confirmación requerida (*Confirmar / Cancelar*) antes de eliminar registros sin procesos pendientes.
- **Modal Operación No Permitida** *(Mockup 7)*: Restricción de eliminación para empleados con procesos activos (*Contrato vigente, Vacaciones pendientes, Compromisos SGR pendientes*).
- **Modal Empleado Duplicado** *(Mockup 5)*: Detección de RUT existente en la base de datos.
- **Modal Error de Validación** *(Mockup 6)*: Detección de correos electrónicos con formato inválido.
- **Modal Sin Coincidencias** *(Mockup 8)*: Aviso de búsquedas sin resultados en el sistema.

### 3. 📊 Matriz SGR (Seguimiento de Gestión y Resultados)
- **Resumen de Delegación**: Indicadores consolidados por área (*último ingreso, días sin ingresar, cantidad de ingresos y promedio diario*).
- **Pestaña Personal**: Medición por ítem, ponderador de peso (suma 100%), meta trimestral, avance real y cálculo de cumplimiento ponderado.
- **Tubo de Trabajo / Agenda Colectiva**: Seguimiento de compromisos con transiciones de estado (*Ingresado → Pendiente → En proceso → Realizado*).
- **Semáforo Diario de Avance**:
  - 🟢 **Verde**: Avance igual o superior a la meta acumulada esperada al día.
  - 🟡 **Ámbar**: Avance entre el 60% y menos del 100% de la meta esperada.
  - 🔴 **Rojo**: Avance inferior al 60% de la meta esperada.

### 4. 🏙️ Portal Vecino & Copiloto IA
- Asistente inteligente con dictado por voz para dirigir trámites y solicitudes comunitarias (*Aseo y Ornato, DIDECO, Seguridad, Trámites y Vehículos, Fomento Productivo, Salud*).
- Muro público de transparencia y mapa de crisis comunal en tiempo real.

### 5. 🔒 Auditoría Interna y Anti-Fraude
- Registro imborrable de operaciones críticas firmado mediante firmas criptográficas HASH (`0x...`) para garantizar la trazabilidad (RNF-008).

---

## 🎨 Identidad Visual e Integración de Logos

El diseño respeta estrictamente la paleta de colores institucional de la **Ilustre Municipalidad de La Serena**:
- **Rojo Heráldico**: `#C41230`
- **Rojo Luminoso**: `#DB3334`
- **Rojo Oscuro**: `#8B1D19`

### Reglas de Aplicación de Logos:
1. **Logo Horizontal (`horizontal-blanco.svg` / `horizontal-blanco.png`)**: Integrado en las barras superiores de navegación (*headers*) de todas las páginas de la plataforma.
2. **Logo Vertical (`vertical-color.svg`)**: Posicionado a la izquierda del texto de encabezado en la parte superior de todos los formularios (*Inicio de Sesión, Registro de Empleados, Solicitudes Vecinales*).

---

## 📂 Estructura del Repositorio

```
VanguardSystemsGroup/
├── README.md                # Documentación oficial del proyecto integrador
├── index.html               # Punto de entrada web principal (Listo para GitHub Pages)
├── app.jsx                  # Código fuente completo con componentes React y lógica SGR
├── horizontal-blanco.svg    # Logo horizontal blanco institucional
├── horizontal-color.svg     # Logo horizontal color institucional
├── horizontal-blanco.png    # Logo horizontal en formato PNG
├── vertical-color.svg       # Logo vertical a color para encabezados de formularios
├── vertical-blanco.svg      # Logo vertical blanco
├── logo-la-serena.svg       # Escudo institucional oficial de La Serena

```

---

## 🚀 Instrucciones de Instalación y Ejecución

### Opción 1: Ejecución Directa (Sin Servidor Local)
Simplemente haz **doble clic** sobre el archivo `index.html` en la raíz del repositorio para abrir la aplicación web interactiva en cualquier navegador (*Chrome, Edge, Firefox, Safari*).

### Opción 2: Ejecución mediante Servidor Local HTTP
Si deseas ejecutar la aplicación mediante un servidor local:

```bash
# Con Python 3
python -m http.server 8080

# Luego abre en tu navegador:
# http://localhost:8080
```

---

## 🌐 Despliegue en Vivo con GitHub Pages

Para publicar este proyecto en vivo desde GitHub:

1. Subir los archivos al repositorio:
   ```bash
   git add .
   git commit -m "Publicación del Sistema SGR La Serena con README"
   git push origin main
   ```
2. Ir a **Settings > Pages** en tu repositorio de GitHub.
3. En **Source**, seleccionar la rama `main` y la carpeta `/ (root)`.
4. Guardar. En 1 minuto tendrás la aplicación web disponible públicamente.

---

## 👥 Equipo y Créditos

- **Institución**: INACAP — Caso Académico Ilustre Municipalidad de La Serena.
- **Asignatura**: Proyecto Integrado.
- **Versión**: 1.0 — Documento y Sistema Consolidado SGR.
