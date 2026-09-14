import React, { useState, useEffect, useRef, useCallback } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";
import {
  Search, Mic, Sun, Moon, MapPin, Camera, Clock, ChevronRight, ChevronLeft,
  ArrowRight, Trash2, Car, ShieldAlert, HeartHandshake, Briefcase, Stethoscope,
  Waves, Zap, TreeDeciduous, Lock, Users, Bell, X, Check, Building2, Star,
  CheckCircle2, CalendarDays, Truck, XCircle, Sparkles, AlertTriangle,
  ShieldCheck, MessageSquare, Phone, Ban, Receipt, Home, UserCheck, Radio,
  Wrench, ClipboardList, ArrowUpDown, Image as ImageIcon, Info, Plus, LogOut,
  Fingerprint, WifiOff, Cloud, Server, Landmark, TrendingUp, FileText, Download,
  MessageCircle, GraduationCap, IdCard, QrCode, Gauge, Fuel, Package, PenTool,
  Volume2, Navigation, UserPlus, Play, Zap as Bolt, Eye, Edit3, Filter, Layers, Database, GitBranch, Network, Table, HelpCircle, CheckCircle, AlertCircle
} from "https://esm.sh/lucide-react@0.446.0?deps=react@18";

/* ---------------------------------------------------------------------
   TOKENS — Colores Institucionales Ilustre Municipalidad de La Serena
   - Rojo Luminoso: #DB3334 (RGB: 219, 51, 52)
   - Rojo Heráldico: #C41230 (RGB: 196, 18, 48)
   - Rojo Oscuro:   #8B1D19 (RGB: 139, 29, 25)
--------------------------------------------------------------------- */
const PALETTE = {
  light: {
    bg: "#FFFFFF", bgAlt: "#FDF6F6", surface: "#FFFFFF", surfaceAlt: "#F9ECEE",
    ink: "#241016", inkSoft: "#6E4650", inkFaint: "#A9868D",
    border: "rgba(196,18,48,0.18)", borderStrong: "rgba(196,18,48,0.32)",
    copper: "#C41230", copperInk: "#8B1D19", copperSoft: "#FCEBEB",
    rojoLuminoso: "#DB3334", rojoHeraldico: "#C41230", rojoOscuro: "#8B1D19",
    sage: "#4F7452", sageSoft: "#DDE7DA",
    ocean: "#2B5876", oceanSoft: "#D9E4EA",
    teal: "#356F68", tealSoft: "#D8E7E4",
    gold: "#A6791F", goldSoft: "#EFE1BE",
    red: "#DB3334", redSoft: "#FCEBEB",
  },
  dark: {
    bg: "#1B0D12", bgAlt: "#2A1219", surface: "#25121A", surfaceAlt: "#2F1720",
    ink: "#F5E8EB", inkSoft: "#C9A3AD", inkFaint: "#8E6A73",
    border: "rgba(245,232,235,0.14)", borderStrong: "rgba(245,232,235,0.26)",
    copper: "#DB3334", copperInk: "#F6C6D2", copperSoft: "#4A1F2B",
    rojoLuminoso: "#FF5455", rojoHeraldico: "#E5394B", rojoOscuro: "#B82428",
    sage: "#8DB18E", sageSoft: "#233229",
    ocean: "#7FA9C4", oceanSoft: "#1D2E37",
    teal: "#83B5AE", tealSoft: "#1C2E2B",
    gold: "#D6AF5C", goldSoft: "#332912",
    red: "#FF5455", redSoft: "#3A2019",
  },
};
const FONT_DISPLAY = "'Fraunces', ui-serif, Georgia, serif";
const FONT_BODY = "'Public Sans', ui-sans-serif, system-ui, sans-serif";

/* ---------------------------------------------------------------------
   DATOS
--------------------------------------------------------------------- */
const DEPARTMENTS = [
  {
    id: "dept-aseo", nombre: "Aseo, Ornato y Medio Ambiente", desc: "Recolección, áreas verdes, poda", icon: Trash2, key: "sage",
    kw: ["basura", "poda", "árbol", "arbol", "aseo", "reciclaje", "areas verdes"],
    servicios: [
      { nombre: "Retiro de residuos domiciliarios", desc: "Solicita un retiro extraordinario de basura o escombros" },
      { nombre: "Mantención de áreas verdes", desc: "Riego, corte de pasto o mantención de una plaza o bandejón" },
      { nombre: "Limpieza de calles y veredas", desc: "Reporta acumulación de basura o barrido de una calle" },
      { nombre: "Poda y retiro de árboles", desc: "Solicita poda, tala o retiro de un árbol en riesgo" },
    ]
  },
  {
    id: "dept-tramites", nombre: "Trámites y Vehículos", desc: "Licencias, permisos, señaléticas", icon: Car, key: "ocean",
    kw: ["licencia", "permiso de circulación", "vehiculo", "vehículo", "señaletica", "conducir"],
    servicios: [
      { nombre: "Licencia de conducir", desc: "Renovación, clases o duplicado de tu licencia" },
      { nombre: "Permiso de circulación", desc: "Paga o renueva el permiso de circulación de tu vehículo" },
      { nombre: "Señalética vial", desc: "Solicita instalación o reparación de una señal de tránsito" },
    ]
  },
  {
    id: "dept-seguridad", nombre: "Seguridad y Fiscalización", desc: "Patrullajes, ruidos, autos abandonados", icon: ShieldAlert, key: "red",
    kw: ["seguridad", "ruido", "auto abandonado", "patrullaje", "fiscalizacion"],
    servicios: [
      { nombre: "Reporte de auto abandonado", desc: "Informa un vehículo abandonado hace más de 5 días" },
      { nombre: "Patrullaje preventivo", desc: "Solicita rondas de seguridad para tu calle o pasaje" },
      { nombre: "Denuncia de ruidos molestos", desc: "Reporta ruidos que superen el horario permitido" },
    ]
  },
  {
    id: "dept-dideco", nombre: "Desarrollo Social (DIDECO)", desc: "Subsidios, becas, ayudas de emergencia", icon: HeartHandshake, key: "copper",
    kw: ["subsidio", "beca", "ayuda", "saco de lluvia", "caja de alimentos", "emergencia"],
    servicios: [
      { nombre: "Subsidio único familiar", desc: "Postula o consulta el estado de tu subsidio" },
      { nombre: "Becas municipales", desc: "Postulación a becas de estudios básicos, medios o superiores" },
      { nombre: "Ayuda de emergencia", desc: "Sacos de arena para lluvia, cajas de alimentos u otros insumos" },
    ]
  },
  {
    id: "dept-fomento", nombre: "Fomento Productivo", desc: "Bolsa de empleo OMIL, ferias", icon: Briefcase, key: "gold",
    kw: ["empleo", "omil", "feria", "emprendedor", "trabajo"],
    servicios: [
      { nombre: "Bolsa de empleo OMIL", desc: "Publica tu currículum o revisa ofertas laborales" },
      { nombre: "Feria de emprendedores", desc: "Inscribe tu emprendimiento en la próxima feria comunal" },
      { nombre: "Capacitación laboral", desc: "Cursos y talleres gratuitos con certificación municipal" },
    ]
  },
  {
    id: "dept-salud", nombre: "Salud y Mascotas", desc: "CESFAM, veterinaria, microchip", icon: Stethoscope, key: "teal",
    kw: ["salud", "mascota", "veterinaria", "cesfam", "microchip", "hora medica"],
    servicios: [
      { nombre: "Hora médica CESFAM", desc: "Agenda una hora en tu centro de salud familiar" },
      { nombre: "Hora veterinaria municipal", desc: "Consulta, vacunación o esterilización para tu mascota" },
      { nombre: "Microchip para mascotas", desc: "Agenda la implantación gratuita de microchip" },
    ]
  },
];

const AI_ROUTES = [
  ...DEPARTMENTS.map((d) => ({ kw: d.kw, role: "vecino", screen: "A", hi: d.id })),
  { kw: ["seguimiento", "mi solicitud", "donde esta", "dónde está", "rastrear"], role: "vecino", screen: "C", hi: "seguimiento-card" },
  { kw: ["calificar", "evaluar", "estrellas", "calificacion"], role: "vecino", screen: "D", hi: "calificacion-card" },
  { kw: ["formulario", "nueva solicitud", "solicitar"], role: "vecino", screen: "B", hi: "form-card" },
  { kw: ["fraude", "sospechoso", "sospecha", "duplicidad"], role: "admin", screen: "E", hi: "tabla-fraude" },
  { kw: ["auditoria", "auditoría", "queja", "reclamo"], role: "admin", screen: "F", hi: "bandeja-auditoria" },
  { kw: ["crisis", "emergencia comunal", "inundacion", "inundación", "cable cortado"], role: "admin", screen: "G", hi: "mapa-crisis" },
  { kw: ["matriz sgr", "sgr", "seguimiento de gestion", "seguimiento de gestión", "cumplimiento ponderado", "meta trimestre", "tubo de trabajo", "semaforo", "semáforo", "ponderador", "delegacion", "delegación"], role: "admin", screen: "SGR", hi: "sgr-card" },
  { kw: ["asignar", "asignación", "despacho"], role: "admin", screen: "ASIGNACION", hi: "asignacion-card" },
  { kw: ["trabajador", "cuadrilla", "quien trabajo", "evidencia", "rendimiento"], role: "admin", screen: "CUADRILLAS", hi: "cuadrillas-card" },
  { kw: ["usuario problematico", "lista negra", "bloqueado", "prioridad social"], role: "admin", screen: "USUARIOS", hi: "usuarios-card" },
  { kw: ["noticia", "alerta", "publicar", "contenido"], role: "admin", screen: "CONTENIDO", hi: "contenido-card" },
  { kw: ["presupuesto", "bodega", "stock"], role: "admin", screen: "PRESUPUESTO", hi: "presupuesto-card" },
  { kw: ["auditoria interna", "corrupcion", "corrupción", "hash", "log"], role: "admin", screen: "CONTROL", hi: "control-card" },
  { kw: ["sensor", "iot", "satelital"], role: "admin", screen: "IOT", hi: "iot-card" },
  { kw: ["reporte", "cuenta publica", "cuenta pública", "informe"], role: "admin", screen: "REPORTES", hi: "reportes-card" },
];

const SEED_CONTENIDOS = [
  { tipo: "Alerta", tag: "red", titulo: "Corte de agua programado", cuerpo: "Sector norte, miércoles de 08:00 a 14:00 hrs por mantención de matriz.", autor: "Comunicaciones municipales" },
  { tipo: "Noticia", tag: "ocean", titulo: "Nueva plaza en Población Cordillera", cuerpo: "Inauguración este sábado con actividades para toda la familia.", autor: "Comunicaciones municipales" },
  { tipo: "Alerta", tag: "gold", titulo: "Vientos fuertes durante la noche", cuerpo: "Se recomienda asegurar objetos sueltos en patios y balcones.", autor: "Comunicaciones municipales" },
  { tipo: "Noticia", tag: "sage", titulo: "Campaña de poda municipal", cuerpo: "Solicita la poda de árboles en tu cuadra hasta el 30 de septiembre.", autor: "Comunicaciones municipales" },
];

const KPIS = [
  { id: "revision", label: "En revisión", icon: Search, key: "ocean" },
  { id: "aceptados", label: "Aceptados", icon: CheckCircle2, key: "sage" },
  { id: "programados", label: "Programados", icon: CalendarDays, key: "teal" },
  { id: "transito", label: "En tránsito", icon: Truck, key: "gold" },
  { id: "rechazados", label: "Rechazados", icon: XCircle, key: "red" },
  { id: "finalizados", label: "Finalizados", icon: Sparkles, key: "copper" },
  { id: "auditoria", label: "Auditoría (1-2★)", icon: AlertTriangle, key: "red" },
];
const SOLICITUDES_POR_ESTADO = {
  revision: [{ id: "20512", vecino: "Teresa Álvarez S.", depto: "Aseo y Ornato", fecha: "01-09-2026" }, { id: "20513", vecino: "Ismael Rojas D.", depto: "Trámites y Vehículos", fecha: "01-09-2026" }, { id: "20514", vecino: "Paula Fuentes C.", depto: "DIDECO", fecha: "31-08-2026" }],
  aceptados: [{ id: "20498", vecino: "Cristian Muñoz P.", depto: "Seguridad y Fiscalización", fecha: "30-08-2026" }, { id: "20501", vecino: "Loreto Sepúlveda", depto: "Salud y Mascotas", fecha: "30-08-2026" }],
  programados: [{ id: "20487", vecino: "María Elena Soto Pardo", depto: "Aseo y Ornato", fecha: "29-08-2026" }, { id: "20490", vecino: "Héctor Bravo L.", depto: "Fomento Productivo", fecha: "29-08-2026" }],
  transito: [{ id: "20481", vecino: "Rosa Martínez G.", depto: "Aseo y Ornato", fecha: "01-09-2026" }],
  rechazados: [{ id: "20470", vecino: "Sergio Bahamondes R.", depto: "DIDECO", fecha: "27-08-2026" }],
  finalizados: [{ id: "20455", vecino: "Antonia Vergara T.", depto: "DIDECO", fecha: "24-08-2026" }, { id: "20460", vecino: "Manuel Ávila S.", depto: "Aseo y Ornato", fecha: "25-08-2026" }],
  auditoria: [{ id: "20430", vecino: "Vecino reservado", depto: "Aseo y Ornato", fecha: "20-08-2026" }, { id: "20441", vecino: "Vecino reservado", depto: "Seguridad y Fiscalización", fecha: "22-08-2026" }],
};
const FRAUDE_ROWS = [
  { rut: "8.221.345-6", beneficio: "Saco de lluvia", direccion: "Pasaje Los Nogales 231", alerta: null, reincidencias: 0 },
  { rut: "15.902.114-K", beneficio: "Saco de lluvia", direccion: "Pasaje Los Nogales 231", alerta: "RUT distinto solicitando el mismo beneficio en una dirección que ya recibió ayuda ayer.", reincidencias: 4 },
  { rut: "11.045.678-9", beneficio: "Caja de alimentos", direccion: "Av. Circunvalación 1420", alerta: null, reincidencias: 0 },
  { rut: "7.334.221-5", beneficio: "Subsidio agua potable", direccion: "Los Copihues 88", alerta: "Solicitud repetida para la misma dirección en menos de 30 días.", reincidencias: 2 },
];
const QUEJAS = [
  { func: "Luis Andrade M.", depto: "Aseo y Ornato", rating: 1, comentario: "El camión no pasó en todo el mes y nadie respondió mis llamados." },
  { func: "Carla Núñez P.", depto: "Fiscalización", rating: 2, comentario: "Llegó tarde y trató mal a mi mamá, que es adulta mayor." },
];
const SEED_INCIDENTES = [
  { tipo: "Inundación", lugar: "Sector Ribera", icon: Waves, key: "ocean", top: "30%", left: "22%", fuente: "copiloto", publicado: false },
  { tipo: "Cable cortado", lugar: "Av. Principal", icon: Zap, key: "gold", top: "55%", left: "62%", fuente: "sensor", publicado: true },
  { tipo: "Árbol caído", lugar: "Plaza de Armas", icon: TreeDeciduous, key: "sage", top: "68%", left: "40%", fuente: "terreno", publicado: false },
];
const FUENTE_LABEL = {
  copiloto: { texto: "Reportado por un vecino vía Copiloto IA", icon: Users },
  sensor: { texto: "Detectado por sensores municipales", icon: Radio },
  terreno: { texto: "Cargado en terreno por una cuadrilla", icon: Wrench },
};

const WORKERS_PERFIL = [
  {
    nombre: "Pedro Ilabaca R.", rut: "9.876.543-2", especialidad: "Aseo y Ornato",
    avgEstrellas: 4.6, tiempoPromedio: "18 min por tarea", felicitaciones: 21, amonestaciones: 2,
    turno: { inicio: "08:02", colacion: "13:00 – 13:45", termino: "—", horasConduccion: 5.4 }, fatiga: true,
    vehiculo: { patente: "RVXK-27", combustible: 62, km: 84210, mantencion: "18-09-2026" },
    inventario: { herramientas: ["2 palas", "1 motosierra", "12 conos"], materiales: [{ nombre: "Sacos de arena", actual: 5, total: 50 }] },
    sancion: { motivo: "Reclamo 1★ — camión no pasó en todo el mes", fecha: "29-08-2026", descargo: "El pasaje estaba bloqueado por una obra vial no informada por la constructora; subí foto de la barrera.", evidencia: true, resuelto: false }
  },
  {
    nombre: "Katherine Solís V.", rut: "14.221.098-7", especialidad: "Fiscalización",
    avgEstrellas: 4.9, tiempoPromedio: "24 min por tarea", felicitaciones: 15, amonestaciones: 0,
    turno: { inicio: "08:10", colacion: "13:15 – 14:00", termino: "17:05", horasConduccion: 2.1 }, fatiga: false,
    vehiculo: { patente: "SFGH-19", combustible: 88, km: 41530, mantencion: "02-11-2026" },
    inventario: { herramientas: ["Cinemómetro", "Cámara"], materiales: [{ nombre: "Actas de infracción", actual: 34, total: 50 }] },
    sancion: null
  },
];
const PENDIENTES_ASIGNACION = [
  { id: "20512", vecino: "Teresa Álvarez S.", depto: "Aseo, Ornato y Medio Ambiente", direccion: "Los Boldos 233" },
  { id: "20513", vecino: "Cristian Muñoz P.", depto: "Seguridad y Fiscalización", direccion: "Camino Real 88" },
];
const TRABAJOS = [
  { trabajador: "Pedro Ilabaca R.", rut: "9.876.543-2", fecha: "28-08-2026", hora: "15:10", tarea: "Retiro de escombros — Los Aromos 482", colaboradores: ["Ramón Toledo G."], antesVerificada: true, despuesVerificada: false },
  { trabajador: "Katherine Solís V.", rut: "14.221.098-7", fecha: "27-08-2026", hora: "11:40", tarea: "Fiscalización de ruidos molestos — Av. Los Pinos 120", colaboradores: [], antesVerificada: true, despuesVerificada: true },
];
const SEED_USERS = [
  { nombre: "María Elena Soto Pardo", rut: "12.345.678-9", direccion: "Los Aromos 482, Villa Las Compañías", cerradas: 14, canceladas: 1, bloqueoAuto: false, bloqueoManual: false, rsh: 40, adultoMayor: false, postrado: false, ninos: true, deudas: [] },
  { nombre: "Sergio Bahamondes Rivas", rut: "6.884.221-3", direccion: "Camino El Sauce 1210", cerradas: 27, canceladas: 6, bloqueoAuto: true, bloqueoManual: false, rsh: 65, adultoMayor: true, postrado: false, ninos: false, deudas: ["Patente comercial vencida", "Multa de tránsito impaga"] },
  { nombre: "Fresia Contreras Leiva", rut: "10.552.884-1", direccion: "Pje. Las Camelias 55", cerradas: 5, canceladas: 0, bloqueoAuto: false, bloqueoManual: true, rsh: 22, adultoMayor: true, postrado: true, ninos: false, deudas: ["Deuda derecho de aseo"] },
  { nombre: "Ignacio Pardo Muñoz", rut: "18.220.774-5", direccion: "Av. Las Torres 900", cerradas: 2, canceladas: 0, bloqueoAuto: false, bloqueoManual: false, rsh: 78, adultoMayor: false, postrado: false, ninos: false, deudas: [] },
];
const TESTIMONIOS = [
  { nombre: "Rosa M.", estrellas: 5, texto: "Vinieron el mismo día que reporté el poste sin luz. Excelente atención." },
  { nombre: "Jorge T.", estrellas: 4, texto: "Rápidos con el permiso de circulación, todo lo hice desde la app." },
  { nombre: "Antonia V.", estrellas: 5, texto: "Me ayudaron con la caja de alimentos justo cuando más lo necesitaba." },
  { nombre: "Manuel Á.", estrellas: 4, texto: "Podaron el árbol de la vereda en menos de una semana." },
];
const IMPACTO = [
  { val: 1240, label: "sacos de lluvia entregados esta semana" }, { val: 45, label: "luminarias reparadas hoy" },
  { val: 312, label: "licencias renovadas este mes" }, { val: 89, label: "empleos gestionados vía OMIL" },
];
const BODEGA_SEED = [
  { nombre: "Sacos de arena", actual: 320, total: 1000, key: "copper" },
  { nombre: "Cajas de alimentos", actual: 140, total: 500, key: "sage" },
  { nombre: "Señaléticas viales", actual: 26, total: 200, key: "ocean" },
];
const PRESUPUESTO = [
  { depto: "Aseo y Ornato", ejecutado: 68, key: "sage" }, { depto: "DIDECO", ejecutado: 82, key: "copper" },
  { depto: "Seguridad", ejecutado: 45, key: "red" }, { depto: "Trámites", ejecutado: 30, key: "ocean" },
  { depto: "Fomento", ejecutado: 55, key: "gold" }, { depto: "Salud", ejecutado: 60, key: "teal" },
];
const CONTROL_LOG = [
  { fecha: "01-09-2026 09:14", actor: "Supervisor J. Rojas", accion: "Aprobó por excepción la solicitud N.º 15902 (marcada por fraude)", hash: "0x4a1f7c…9c2d" },
  { fecha: "31-08-2026 17:02", actor: "Admin M. Paredes", accion: "Archivó el reclamo de 1★ N.º 20430", hash: "0x88be21…5f10" },
  { fecha: "30-08-2026 11:45", actor: "Sistema (IA)", accion: "Bloqueó automáticamente al RUT 15.902.114-K por reincidencia", hash: "0x1c9aa4…77e3" },
  { fecha: "29-08-2026 08:30", actor: "Supervisor K. Solís", accion: "Cambió el estado de la solicitud N.º 20487 a Programada", hash: "0x9fd302…e61a" },
];
const SENSORES = [
  { tipo: "Contenedor de basura", lugar: "Plaza Los Álamos", nivel: 100, estado: "Cuadrilla despachada automáticamente", icon: Trash2, key: "red" },
  { tipo: "Sensor de caudal", lugar: "Canal Municipal Norte", nivel: 72, estado: "Riesgo moderado de desborde", icon: Waves, key: "gold" },
  { tipo: "Contenedor de basura", lugar: "Av. Circunvalación", nivel: 45, estado: "Nivel normal", icon: Trash2, key: "sage" },
];
const HASHES = ["0x2f9a1e…", "0x71cdb4…", "0x9e044f…", "0x33ab90…", "0x6f12aa…", "0xd0871c…"];
const AGENDA_TRABAJADOR = [
  { hora: "09:00", direccion: "Los Aromos 482", tarea: "Retiro de escombros" },
  { hora: "10:15", direccion: "Pje. Las Camelias 55", tarea: "Entrega de sacos de arena" },
  { hora: "11:30", direccion: "Av. Circunvalación 1420", tarea: "Poda de árbol" },
];
const DEPTS_HEADS = ["Aseo y Ornato", "DIDECO", "Seguridad y Fiscalización"];
const CHAT_SEED = {
  "Aseo y Ornato": [{ from: "jefe", texto: "Buenas tardes alcalde, tres cuadrillas reforzando el sector norte por la acumulación de basura." }, { from: "alcalde", texto: "Perfecto, mantenme informado cada 2 horas." }],
  "DIDECO": [{ from: "jefe", texto: "Ya distribuimos 620 de los 1.000 sacos de arena programados para este temporal." }],
  "Seguridad y Fiscalización": [{ from: "jefe", texto: "Sin incidentes mayores durante la noche, dos patrullajes reforzados en el sector poniente." }],
};

/* ---------------------------------------------------------------------
   MATRIZ SGR — Seguimiento de Gestión y Resultados (Delegaciones)
--------------------------------------------------------------------- */
const SGR_DELEGACIONES = ["Rural", "Centro", "Avenida del Mar", "Las Compañías", "La Pampa", "La Antena"];
const SGR_CUMPLIMIENTO_MINIMO = 80;
const SGR_PERIODO = { inicio: "01-07-2026", termino: "30-09-2026", dias: 91, hoy: "26-08-2026", diasTranscurridos: 56 };

const SGR_FUNCIONARIOS = [
  {
    nombre: "M. Fonseca P.", cargo: "Territorial OO.CC. 1", delegacion: "Rural",
    items: [
      { item: "Atención de usuario teléfono y presencial", ponderador: 15, meta: 36, avance: 7 },
      { item: "Visitas y reuniones con organizaciones", ponderador: 20, meta: 24, avance: 6 },
      { item: "Conformación de directivas definitiva", ponderador: 25, meta: 3, avance: 0 },
      { item: "Gestión de talleres y actividades", ponderador: 20, meta: 20, avance: 3 },
      { item: "Emergencia", ponderador: 5, meta: 9, avance: 9 },
      { item: "Soluciones al ingreso al tubo", ponderador: 15, meta: 80, avance: 87.5, esPct: true },
    ]
  },
  {
    nombre: "C. Contreras", cargo: "Territorial OO.CC. — Org. Comunitarias", delegacion: "Rural",
    items: [
      { item: "Atención de usuario teléfono y presencial", ponderador: 10, meta: 45, avance: 11 },
      { item: "Visitas, reuniones con organizaciones", ponderador: 15, meta: 24, avance: 3 },
      { item: "Conformación de directivas definitiva", ponderador: 25, meta: 2, avance: 0 },
      { item: "Gestión de talleres y actividades", ponderador: 15, meta: 24, avance: 6 },
      { item: "Emergencia", ponderador: 5, meta: 8, avance: 8 },
      { item: "Soluciones al ingreso al tubo", ponderador: 30, meta: 80, avance: 100, esPct: true },
    ]
  },
  {
    nombre: "A. Barrientos", cargo: "Coordinador de Servicios a la Comunidad", delegacion: "Las Compañías",
    items: [
      { item: "Sección alumbrado público", ponderador: 25, meta: 24, avance: 2, esPct: false },
      { item: "Diserco / Maquinaria de compactación", ponderador: 25, meta: 24, avance: 24 },
      { item: "Diserco / Sección aseo", ponderador: 25, meta: 24, avance: 3 },
      { item: "Requerimientos varios en terreno", ponderador: 25, meta: 24, avance: 3 },
    ]
  },
  {
    nombre: "P. Rojas", cargo: "Apoyo Administrativo", delegacion: "Rural",
    items: [
      { item: "Llamadas preventivas a usuarios", ponderador: 25, meta: 90, avance: 0 },
      { item: "Informe de inventarios", ponderador: 25, meta: 1, avance: 1 },
      { item: "Informe a comunicaciones", ponderador: 25, meta: 12, avance: 2 },
      { item: "Atención de usuario teléfono y presencial", ponderador: 25, meta: 240, avance: 213 },
    ]
  },
];

function sgrCumplimientoFuncionario(f) {
  const filas = f.items.map((it) => {
    const pct = it.esPct ? (it.avance / it.meta) * 100 : (it.avance / it.meta) * 100;
    const ponderado = (it.ponderador / 100) * pct;
    return { ...it, pct, ponderado };
  });
  const total = filas.reduce((acc, it) => acc + it.ponderado, 0);
  return { filas, total };
}

const SGR_TUBO = [
  { fecha: "01/07/26", actividad: "Solicitud de reunión por vehículos mal estacionados", tipo: "Ext", responsable: "V. Castillo (CAM)", territorio: "Latorre", area: "Tránsito", compromiso: "17/07/26", estatus: "Pendiente" },
  { fecha: "06/07/26", actividad: "Solicitud de poda en sector de Uruguay con Pasaje Totoral", tipo: "Ext", responsable: "Luis Bolados", territorio: "Toqui", area: "Áreas verdes", compromiso: "13/07/26", estatus: "Pendiente" },
  { fecha: "06/07/26", actividad: "Taller alfabetización digital para mujeres", tipo: "Int", responsable: "Marite Veliz", territorio: "Latorre", area: "Área mujeres", compromiso: "13/07 al 29/07", estatus: "Realizado" },
  { fecha: "02/07/26", actividad: "Solicitud de iluminación en final de calle Panamá / Agrup. Raíces del Barrio", tipo: "Ext", responsable: "Alberto Barrientos", territorio: "Zorrilla", area: "Sección alumbrado", compromiso: "02/08/26", estatus: "Pendiente" },
  { fecha: "01/06/26", actividad: "Solicita maquinaria pesada para el sector de la Villa", tipo: "Ext", responsable: "Alberto Barrientos", territorio: "Selección", compromiso: "10/07/26", area: "Diserco / Maquinaria", estatus: "Realizado" },
  { fecha: "03/07/26", actividad: "Solicita evaluación y retiro de escombros en calle Balmaceda 109", tipo: "Ext", responsable: "Alberto Barrientos", territorio: "Selección", compromiso: "10/08/26", area: "Diserco / Aseo", estatus: "En proceso" },
  { fecha: "06/07/26", actividad: "Solicitud de repintados JJVV doña Gabriela", tipo: "Ext", responsable: "V. Castillo (CAM)", territorio: "Latorre", compromiso: "31/08/26", area: "Tránsito", estatus: "En proceso" },
  { fecha: "06/07/26", actividad: "Poda JJVV doña Gabriela en calle Premio Nobel pasado río Cogotí", tipo: "Ext", responsable: "Doris López", territorio: "Latorre", compromiso: "31/08/26", area: "Diserco", estatus: "En proceso" },
];
const SGR_ESTATUS_COLOR = { Ingresado: "gold", Pendiente: "red", "En proceso": "ocean", Realizado: "sage" };

const SGR_SEMAFORO = [
  { area: "Gestor Social 1", responsable: "Devora Cortes", objetivo: 50.6, avance: 116.9 },
  { area: "Gestor Social 4", responsable: "Patricia Jiménez Rojas", objetivo: 50.6, avance: 93.6 },
  { area: "Gestor Social 3", responsable: "—", objetivo: 50.6, avance: 57.2 },
  { area: "Gestor Social 2", responsable: "Marite Veliz", objetivo: 50.6, avance: 56.1 },
  { area: "Planificación y Gestión", responsable: "Erika Miles", objetivo: 50.6, avance: 49.4 },
  { area: "Coor. Serv. Comunidad", responsable: "Alberto Barrientos", objetivo: 50.6, avance: 17.5 },
  { area: "Apoyo Administrativo", responsable: "Alejandro Vega", objetivo: 50.6, avance: 46.1 },
  { area: "Gestor Social 5", responsable: "Fernanda Lamas", objetivo: 50.6, avance: 37.1 },
  { area: "Territorial OO.CC. 3", responsable: "Victoria Castillo (CAM)", objetivo: 50.6, avance: 21.9 },
  { area: "Territorial OO.CC. 2", responsable: "Katherine Bozzo", objetivo: 39.6, avance: 15.5 },
  { area: "Territorial OO.CC. 1", responsable: "Luis Bolados", objetivo: 50.6, avance: 18.0 },
  { area: "Territorial OO.CC. 4", responsable: "Daniela Rodríguez", objetivo: 50.6, avance: 7.1 },
];
function sgrSemaforoColor(avance, objetivo) {
  if (avance >= objetivo) return "sage";
  if (avance >= objetivo * 0.6) return "gold";
  return "red";
}

const SGR_RESUMEN_DELEGACION = [
  { area: "Gestor Social 1", responsable: "Araceli Hernández", avance: 126.7, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 426, ingresosDiarios: 7.61 },
  { area: "Gestor Social 3", responsable: "Sofía Velásquez", avance: 109.3, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 317, ingresosDiarios: 5.66 },
  { area: "Prof. Planif. y Control", responsable: "María Ángeles González", avance: 95.7, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 160, ingresosDiarios: 2.86 },
  { area: "Territorial OO.CC. 1", responsable: "Gloria Araya", avance: 64.8, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 88, ingresosDiarios: 1.57 },
  { area: "Gestor Social 2", responsable: "Ximena Pía Ibaceta", avance: 64.5, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 404, ingresosDiarios: 7.21 },
  { area: "Coordinador Diserco", responsable: "Reinaldo Soto", avance: 61.0, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 147, ingresosDiarios: 2.63 },
  { area: "Apoyo Administrativo", responsable: "Patricia Rojas", avance: 27.4, ultimoIngreso: "26/08/2026", diasSinIngreso: 0, nIngresos: 100, ingresosDiarios: 1.79 },
];
const SGR_META_DELEGACION = { meta: 50.6, logrado: 78.5 };

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
function initials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function useCountUp(target, durationMs = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (now) => { const p = Math.min(1, (now - start) / durationMs); setVal(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}
function prioridadScore(u) { return (100 - u.rsh) + (u.adultoMayor ? 15 : 0) + (u.postrado ? 25 : 0) + (u.ninos ? 10 : 0); }
function Bar({ T, pct, color, height = 8 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: T.surfaceAlt }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   ROOT APP
--------------------------------------------------------------------- */
function App() {
  const [theme, setTheme] = useState("light");
  const T = PALETTE[theme];

  const [role, setRole] = useState("inicio"); // inicio | login | vecino | trabajador | admin | alcalde | transparencia
  const [vecinoScreen, setVecinoScreen] = useState("A");
  const [adminScreen, setAdminScreen] = useState("EMPLEADOS");
  const [trabajadorScreen, setTrabajadorScreen] = useState("FICHAJE");
  const [activeDept, setActiveDept] = useState(null);
  const [tramiteActivo, setTramiteActivo] = useState(null);
  const [handsFree, setHandsFree] = useState(false);

  const [copilotText, setCopilotText] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const highlightTimer = useRef(null);

  const [contenidos, setContenidos] = useState(SEED_CONTENIDOS);
  const [incidentes, setIncidentes] = useState(SEED_INCIDENTES);

  const runCopilot = useCallback((raw) => {
    const q = (raw || copilotText).toLowerCase().trim();
    if (!q) return;
    let match = null;
    for (const r of AI_ROUTES) if (r.kw.some((k) => q.includes(k))) { match = r; break; }
    if (match) {
      setRole(match.role);
      if (match.role === "vecino") setVecinoScreen(match.screen);
      if (match.role === "admin") setAdminScreen(match.screen);
      setHighlightId(match.hi);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightId(null), 2400);
    }
  }, [copilotText]);
  useEffect(() => () => highlightTimer.current && clearTimeout(highlightTimer.current), []);

  const goDept = (dept) => { setActiveDept(dept); setVecinoScreen("DEPT"); };
  const goForm = (dept, servicio) => { setTramiteActivo({ dept, servicio }); setVecinoScreen("B"); };
  const doLogin = (r) => { setRole(r); if (r === "vecino") setVecinoScreen("A"); if (r === "admin") setAdminScreen("SGR"); if (r === "trabajador") setTrabajadorScreen("FICHAJE"); };

  const authenticated = ["vecino", "trabajador", "admin", "alcalde", "transparencia"].includes(role);

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: FONT_BODY, minHeight: "100%" }} className="w-full min-h-screen transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${T.copper}; color: ${T.surface}; }
        input, textarea, button, select { font-family: ${FONT_BODY}; }
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 ${T.copper}88; } 70% { box-shadow: 0 0 0 12px ${T.copper}00; } 100% { box-shadow: 0 0 0 0 ${T.copper}00; } }
        .copilot-pulse { animation: pulseRing 1s ease-out 2; border-color: ${T.copper} !important; }
        @keyframes blinkDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(1.25); } }
        .blink-dot { animation: blinkDot 1.6s ease-in-out infinite; }
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 ${T.copper}55; } 100% { box-shadow: 0 0 0 40px ${T.copper}00; } }
        .mic-pulse { animation: micPulse 1.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .copilot-pulse, .blink-dot, .mic-pulse { animation: none; } }
        .scrollbar-none::-webkit-scrollbar { display: none; } .scrollbar-none { scrollbar-width: none; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, [tabindex]:focus-visible { outline: 2.5px solid ${T.copper}; outline-offset: 2px; }
      `}</style>

      {role === "inicio" && <PaginaInicio T={T} theme={theme} setTheme={setTheme} contenidos={contenidos} onLogin={() => setRole("login")} onVerTransparencia={() => setRole("transparencia")} />}
      {role === "login" && <PaginaLogin T={T} theme={theme} setTheme={setTheme} onLogin={doLogin} onBack={() => setRole("inicio")} />}

      {authenticated && (
        <>
          <TopBar T={T} theme={theme} setTheme={setTheme} role={role} setRole={setRole}
            copilotText={copilotText} setCopilotText={setCopilotText} runCopilot={runCopilot}
            handsFree={handsFree} setHandsFree={setHandsFree} showCopilot={role === "vecino"} />

          {handsFree && role === "vecino" ? (
            <HandsFreeOverlay T={T} onExit={() => setHandsFree(false)} />
          ) : (
            <main className="max-w-[1400px] mx-auto px-4 md:px-8 pb-28 md:pb-16">
              {role === "vecino" && (
                <VecinoPortal T={T} screen={vecinoScreen} setScreen={setVecinoScreen} highlightId={highlightId}
                  contenidos={contenidos} activeDept={activeDept} goDept={goDept} goForm={goForm} tramiteActivo={tramiteActivo} />
              )}
              {role === "trabajador" && <TrabajadorPortal T={T} screen={trabajadorScreen} setScreen={setTrabajadorScreen} />}
              {role === "admin" && (
                <AdminPanel T={T} screen={adminScreen} setScreen={setAdminScreen} highlightId={highlightId}
                  contenidos={contenidos} setContenidos={setContenidos} incidentes={incidentes} setIncidentes={setIncidentes} />
              )}
              {role === "alcalde" && <AlcaldePanel T={T} />}
              {role === "transparencia" && <TransparenciaWall T={T} />}
            </main>
          )}

          {role === "vecino" && !handsFree && ["A", "B", "C", "D", "MAS"].includes(vecinoScreen) && (
            <MobileTabBar T={T} screen={vecinoScreen} setScreen={setVecinoScreen} />
          )}
          {role === "trabajador" && <TrabajadorTabBar T={T} screen={trabajadorScreen} setScreen={setTrabajadorScreen} />}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   LOGOS INSTITUCIONALES OFICIALES (HORIZONTAL Y VERTICAL)
--------------------------------------------------------------------- */
function LogoHorizontal({ height = 44 }) {
  const [imgIndex, setImgIndex] = React.useState(0);
  const sources = ["./horizontal-blanco.svg", "./horizontal-blanco.png", "./logo-la-serena.svg"];

  const handleImgError = () => setImgIndex((prev) => prev + 1);

  if (imgIndex < sources.length) {
    return (
      <div className="flex items-center shrink-0 select-none py-1">
        <img
          src={sources[imgIndex]}
          alt="La Serena — Ilustre Municipalidad"
          style={{ height: `${height}px` }}
          className="w-auto object-contain drop-shadow-sm max-h-[52px]"
          onError={handleImgError}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 shrink-0 select-none py-1">
      <img src="./logo-la-serena.svg" alt="La Serena" style={{ height: `${height}px` }} className="w-auto object-contain" />
      <div className="flex flex-col justify-center leading-none text-white">
        <span className="font-serif font-black text-[20px] tracking-wider" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>LA SERENA</span>
        <span className="font-sans font-bold text-[9px] tracking-[0.2em] uppercase opacity-90">ILUSTRE MUNICIPALIDAD</span>
      </div>
    </div>
  );
}

function LogoVerticalSmall({ height = 36 }) {
  const [srcIdx, setSrcIdx] = React.useState(0);
  const sources = ["./vertical-color.svg", "./logo-la-serena.svg"];

  if (srcIdx < sources.length) {
    return (
      <img
        src={sources[srcIdx]}
        alt="Escudo Oficial La Serena"
        style={{ height: `${height}px` }}
        className="w-auto object-contain shrink-0 drop-shadow-xs select-none"
        onError={() => setSrcIdx((i) => i + 1)}
      />
    );
  }

  return (
    <svg width="28" height="34" viewBox="0 0 160 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-xs">
      <path d="M6 6H154V100C154 140 120 164 80 164C40 164 6 140 6 100V6Z" stroke="#C41230" strokeWidth="6" fill="none" />
      <rect x="42" y="62" width="76" height="40" stroke="#C41230" strokeWidth="4" fill="none" />
    </svg>
  );
}

function LogoVertical({ height = 85, color }) {
  return <LogoVerticalSmall height={height} />;
}

function LogoLaSerena({ height = 44 }) {
  return <LogoHorizontal height={height} />;
}


/* ---------------------------------------------------------------------
   PÁGINA DE INICIO PÚBLICA
--------------------------------------------------------------------- */
function PaginaInicio({ T, theme, setTheme, contenidos, onLogin, onVerTransparencia }) {
  const pasos = [
    { icon: IdCard, texto: "Ingresa con tu RUT" },
    { icon: ClipboardList, texto: "Elige tu trámite" },
    { icon: Truck, texto: "Sigue a tu cuadrilla" },
  ];
  return (
    <div style={{ background: T.bg }}>
      <header className="sticky top-0 z-30 shadow-md transition-colors" style={{ background: `linear-gradient(90deg, ${T.rojoOscuro} 0%, ${T.rojoHeraldico} 100%)`, color: "#FFFFFF" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <LogoLaSerena color="#FFFFFF" />
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/20" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button onClick={onLogin} className="px-5 py-2.5 rounded-full text-[13px] font-bold shadow-md transition-transform active:scale-95" style={{ background: "#FFFFFF", color: T.rojoHeraldico }}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-14">
        {/* Banner Hero principal con el color institucional del fondo de la imagen */}
        <section className="rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-xl" style={{ background: `linear-gradient(135deg, ${T.rojoOscuro} 0%, ${T.rojoHeraldico} 50%, ${T.rojoLuminoso} 100%)`, color: "#FFFFFF" }}>
          <div className="absolute inset-0 opacity-15" style={{ background: `repeating-linear-gradient(115deg, transparent, transparent 26px, rgba(255,255,255,0.25) 26px, rgba(255,255,255,0.25) 27px)` }} />
          <div className="relative max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#FFFFFF" }} /> Ilustre Municipalidad de La Serena
            </div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1.08, marginTop: 16 }}>
              Innovación, Transparencia y Eficiencia para nuestra Comuna
            </h1>
            <p style={{ fontSize: 15, opacity: 0.95, marginTop: 14, lineHeight: 1.55 }}>
              Todos tus trámites municipales, el seguimiento de tus solicitudes y la información de tu comuna, en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={onLogin} className="px-6 py-3.5 rounded-2xl text-[14px] font-bold flex items-center gap-2 shadow-lg transition-all hover:opacity-95 active:scale-95" style={{ background: "#FFFFFF", color: T.rojoOscuro }}>
                Comenzar ahora <ArrowRight size={17} />
              </button>
              <button onClick={onVerTransparencia} className="px-6 py-3.5 rounded-2xl text-[14px] font-bold transition-all hover:bg-white/25" style={{ background: "rgba(255,255,255,0.16)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}>
                Ver muro de transparencia
              </button>
            </div>
          </div>
        </section>

        {/* Paleta Oficial de Colores Institucionales */}
        <section className="rounded-3xl p-6 md:p-8 shadow-sm" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} color={T.rojoHeraldico} />
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>Colores Institucionales — Ilustre Municipalidad de La Serena</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 text-white flex flex-col justify-between h-32 shadow-md transition-transform hover:scale-[1.02]" style={{ background: "#DB3334" }}>
              <span className="font-bold text-base">Rojo Luminoso</span>
              <div className="text-xs opacity-90 font-mono leading-relaxed">
                HEX: #DB3334<br />RGB: 219, 51, 52<br />Pantone: 200 C
              </div>
            </div>
            <div className="rounded-2xl p-5 text-white flex flex-col justify-between h-32 shadow-md transition-transform hover:scale-[1.02]" style={{ background: "#C41230" }}>
              <span className="font-bold text-base">Rojo Heráldico</span>
              <div className="text-xs opacity-90 font-mono leading-relaxed">
                HEX: #C41230<br />RGB: 196, 18, 48<br />Pantone: 200 C
              </div>
            </div>
            <div className="rounded-2xl p-5 text-white flex flex-col justify-between h-32 shadow-md transition-transform hover:scale-[1.02]" style={{ background: "#8B1D19" }}>
              <span className="font-bold text-base">Rojo Oscuro</span>
              <div className="text-xs opacity-90 font-mono leading-relaxed">
                HEX: #8B1D19<br />RGB: 139, 29, 25<br />Pantone: 200 C
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle T={T}>Aprende a usar tu plataforma</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {pasos.map((p, i) => {
              const Icon = p.icon; return (
                <div key={i} className="rounded-3xl p-6 flex flex-col items-center text-center gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: T.copperSoft, color: T.copperInk }}><Icon size={22} /></div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.inkFaint }}>PASO {i + 1}</p>
                  <p style={{ fontSize: 14.5, fontWeight: 700 }}>{p.texto}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle T={T}>Vecinos felices</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TESTIMONIOS.slice(0, 2).map((t, i) => (
              <div key={i} className="rounded-3xl p-6 flex flex-col gap-2.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, s) => <Star key={s} size={13} color={T.gold} fill={s < t.estrellas ? T.gold : "transparent"} />)}</div>
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>&ldquo;{t.texto}&rdquo;</p>
                <p style={{ fontSize: 12, color: T.inkSoft, fontWeight: 700 }}>{t.nombre}</p>
              </div>
            ))}
          </div>
          <button onClick={onVerTransparencia} className="mt-3.5 text-[12.5px] font-bold" style={{ color: T.copper }}>Ver todos los comentarios →</button>
        </section>

        <section>
          <SectionTitle T={T}>Noticias municipales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {contenidos.filter((c) => c.tipo === "Noticia").slice(0, 3).map((n, i) => (
              <div key={i} className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                <div className="h-28" style={{ background: `linear-gradient(135deg, ${T[n.tag]}, ${T.rojoOscuro})` }} />
                <div className="p-4">
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{n.titulo}</p>
                  <p style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>{n.cuerpo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   LOGIN Y RECUPERACIÓN
--------------------------------------------------------------------- */
function PaginaLogin({ T, theme, setTheme, onLogin, onBack }) {
  const [step, setStep] = useState("form"); // form | roles | recover-rut | recover-otp | recover-new | recover-done
  const roles = [
    { id: "vecino", label: "Vecino", icon: Home, desc: "Solicita ayuda y sigue tus trámites" },
    { id: "trabajador", label: "Trabajador municipal", icon: Wrench, desc: "Cuadrillas y fichaje de terreno" },
    { id: "admin", label: "Administrador", icon: ShieldCheck, desc: "Jefe de departamento / supervisor" },
    { id: "alcalde", label: "Alcalde", icon: Landmark, desc: "Panel estratégico y de auditoría" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
      </div>
      <div className="w-full max-w-md rounded-3xl p-7 md:p-9 flex flex-col gap-5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={step === "form" ? onBack : () => setStep("form")} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 12.5, fontWeight: 600 }}><ChevronLeft size={15} /> Volver</button>
        {/* Logo Vertical Color a la izquierda de Acceso Unificado */}
        <div className="flex items-center gap-3 my-1 border-b pb-3" style={{ borderColor: T.border }}>
          <LogoVerticalSmall height={36} />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: T.ink }}>
            Acceso Unificado a la Plataforma
          </h2>
        </div>

        {step === "form" && (
          <>
            <button className="rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2" style={{ background: "#2B5876", color: "#fff" }}>
              <IdCard size={18} /> Ingresar con ClaveÚnica
            </button>
            <div className="flex items-center gap-3"><div className="h-px flex-1" style={{ background: T.border }} /><span style={{ fontSize: 11, color: T.inkFaint }}>o con tu clave local</span><div className="h-px flex-1" style={{ background: T.border }} /></div>
            <div className="flex flex-col gap-2.5">
              <input placeholder="RUT (ej. 12.345.678-9)" className="rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
              <input type="password" placeholder="Contraseña" className="rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            </div>
            <button onClick={() => setStep("roles")} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: T.copper, color: T.surface }}>Ingresar</button>
            <button onClick={() => setStep("recover-rut")} className="text-center text-[12.5px] font-semibold" style={{ color: T.inkSoft }}>¿Olvidaste tu contraseña?</button>
          </>
        )}

        {step === "roles" && (
          <>
            <p style={{ fontSize: 12.5, color: T.inkSoft }}>Tu RUT tiene más de un perfil asociado. Elige con cuál deseas continuar (demostración):</p>
            <div className="flex flex-col gap-2.5">
              {roles.map((r) => {
                const Icon = r.icon; return (
                  <button key={r.id} onClick={() => onLogin(r.id)} className="rounded-2xl p-4 flex items-center gap-3 text-left" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk }}><Icon size={17} /></div>
                    <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{r.label}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{r.desc}</p></div>
                    <ChevronRight size={16} color={T.inkFaint} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "recover-rut" && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700 }}>Paso 1 — Ingresa tu RUT</p>
            <input placeholder="RUT (ej. 12.345.678-9)" className="rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button onClick={() => setStep("recover-otp")} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: T.copper, color: T.surface }}>Buscar cuenta</button>
          </>
        )}

        {step === "recover-otp" && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700 }}>Paso 2 — Validación de correo</p>
            <p style={{ fontSize: 12.5, color: T.inkSoft }}>Enviamos un código a <b>m*****z@gmail.com</b>. Ingrésalo a continuación.</p>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }, (_, i) => <input key={i} maxLength={1} className="w-10 h-12 rounded-xl text-center text-[16px] font-bold outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />)}
            </div>
            <button className="text-center text-[12px] font-semibold" style={{ color: T.copper }}>Reenviar código</button>
            <button onClick={() => setStep("recover-new")} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: T.copper, color: T.surface }}>Validar código</button>
          </>
        )}

        {step === "recover-new" && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700 }}>Paso 3 — Nueva contraseña</p>
            <input type="password" placeholder="Nueva contraseña" className="rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <input type="password" placeholder="Confirmar contraseña" className="rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button onClick={() => setStep("form")} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: T.copper, color: T.surface }}>Guardar nueva contraseña</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TOP BAR (autenticado)
--------------------------------------------------------------------- */
function TopBar({ T, theme, setTheme, role, setRole, copilotText, setCopilotText, runCopilot, handsFree, setHandsFree, showCopilot }) {
  return (
    <header className="sticky top-0 z-30 shadow-md transition-colors" style={{ background: `linear-gradient(90deg, ${T.rojoOscuro} 0%, ${T.rojoHeraldico} 100%)`, color: "#FFFFFF" }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoHorizontal height={42} />
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }} className="hidden md:inline-block px-3 py-1 rounded-full text-[11px] font-bold capitalize">
              {role === "admin" ? "Panel Administrador" : role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RoleSwitch T={T} role={role} setRole={setRole} />
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Cambiar modo claro/oscuro" className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white hover:bg-white/20 transition-all" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} opacity={0.9} />}
            </button>
            <button onClick={() => setRole("inicio")} aria-label="Cerrar sesión" className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white hover:bg-white/20 transition-all" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {showCopilot && (
          <form onSubmit={(e) => { e.preventDefault(); runCopilot(); }} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-md" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)" }}>
            <Search size={18} color="#6E4650" className="shrink-0" />
            <input value={copilotText} onChange={(e) => setCopilotText(e.target.value)} placeholder="Copiloto IA — dicta o escribe lo que necesitas: “quiero pedir el retiro de un árbol caído”" style={{ color: "#241016", fontSize: 14.5 }} className="flex-1 bg-transparent outline-none placeholder:text-gray-400 min-w-0 font-medium" />
            <button type="button" onClick={() => setHandsFree(true)} aria-label="Modo manos libres" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95" style={{ background: "#D9E4EA", color: "#2B5876" }} title="Modo manos libres"><Volume2 size={16} /></button>
            <button type="button" aria-label="Dictar por voz" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95" style={{ background: T.rojoHeraldico, color: "#FFFFFF" }}><Mic size={16} /></button>
          </form>
        )}
      </div>
    </header>
  );
}

function RoleSwitch({ T, role, setRole }) {
  const items = [{ id: "vecino", label: "Vecino" }, { id: "trabajador", label: "Trabajador" }, { id: "admin", label: "Admin" }, { id: "alcalde", label: "Alcalde" }, { id: "transparencia", label: "Transparencia" }];
  return (
    <select value={role} onChange={(e) => setRole(e.target.value)} className="hidden md:block rounded-full px-4 py-2 text-[13px] font-semibold outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }}>
      {items.map((it) => <option key={it.id} value={it.id} style={{ background: "#25121A", color: "#FFFFFF" }}>{it.label}</option>)}
    </select>
  );
}

function MobileTabBar({ T, screen, setScreen }) {
  const tabs = [{ id: "A", label: "Inicio", icon: Building2 }, { id: "B", label: "Solicitar", icon: MessageSquare }, { id: "C", label: "Seguir", icon: Truck }, { id: "D", label: "Calificar", icon: Star }, { id: "MAS", label: "Más", icon: Users }];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around px-2 pt-1" style={{ background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
      {tabs.map((t) => {
        const active = screen === t.id; const Icon = t.icon; return (
          <button key={t.id} onClick={() => setScreen(t.id)} className="flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1 rounded-xl" style={{ color: active ? T.copper : T.inkFaint }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 2} /><span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TrabajadorTabBar({ T, screen, setScreen }) {
  const tabs = [{ id: "FICHAJE", label: "Fichaje", icon: Fingerprint }, { id: "AGENDA", label: "Mi agenda", icon: Navigation }, { id: "TAREA", label: "Tarea activa", icon: ClipboardList }, { id: "CIERRE", label: "Cerrar tarea", icon: PenTool }];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around px-2 pt-1" style={{ background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
      {tabs.map((t) => {
        const active = screen === t.id; const Icon = t.icon; return (
          <button key={t.id} onClick={() => setScreen(t.id)} className="flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1 rounded-xl" style={{ color: active ? T.copper : T.inkFaint }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 2} /><span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------------------------------------------------------------
   MODO MANOS LIBRES
--------------------------------------------------------------------- */
function HandsFreeOverlay({ T, onExit }) {
  const [fase, setFase] = useState("escuchando");
  useEffect(() => {
    const t1 = setTimeout(() => setFase("procesando"), 1800);
    const t2 = setTimeout(() => setFase("listo"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-14 flex flex-col items-center gap-7 text-center min-h-[70vh] justify-center">
      <p style={{ fontSize: 12.5, fontWeight: 700, color: T.inkFaint }}>MODO MANOS LIBRES — pensado para usar caminando o al volante</p>
      <div className="mic-pulse w-28 h-28 rounded-full flex items-center justify-center" style={{ background: T.copper }}><Mic size={44} color={T.surface} /></div>
      {fase === "escuchando" && <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Escuchando… di algo como &ldquo;Reportar semáforo malo&rdquo;</p>}
      {fase === "procesando" && <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>&ldquo;Reportar semáforo malo&rdquo; — procesando con tu ubicación GPS…</p>}
      {fase === "listo" && (
        <div className="rounded-3xl p-6 flex items-center gap-3" style={{ background: T.sageSoft, color: T.sage }}>
          <CheckCircle2 size={22} className="shrink-0" />
          <p style={{ fontSize: 14, fontWeight: 700, textAlign: "left" }}>Ticket de Seguridad y Fiscalización creado automáticamente con tu ubicación actual.</p>
        </div>
      )}
      <button onClick={onExit} className="px-5 py-3 rounded-2xl text-[13.5px] font-bold" style={{ background: T.surface, border: `1.5px solid ${T.border}`, color: T.ink }}>Salir del modo manos libres</button>
    </div>
  );
}

/* ---------------------------------------------------------------------
   VECINO PORTAL
--------------------------------------------------------------------- */
function VecinoPortal({ T, screen, setScreen, highlightId, contenidos, activeDept, goDept, goForm, tramiteActivo }) {
  const tabs = [{ id: "A", label: "Dashboard" }, { id: "B", label: "Nueva solicitud" }, { id: "C", label: "Seguimiento" }, { id: "D", label: "Calificación" }, { id: "COMUNIDAD", label: "Comunidad" }, { id: "FICHA", label: "Mi ficha" }];
  return (
    <div className="pt-5 md:pt-7">
      {screen !== "DEPT" && (
        <div className="hidden md:flex gap-1.5 mb-6 rounded-full p-1 w-fit overflow-x-auto scrollbar-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          {tabs.map((t) => {
            const active = screen === t.id; return (
              <button key={t.id} onClick={() => setScreen(t.id)} className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap" style={{ background: active ? T.copper : "transparent", color: active ? T.surface : T.inkSoft }}>{t.label}</button>
            );
          })}
        </div>
      )}

      {screen === "A" && <PantallaDashboard T={T} highlightId={highlightId} contenidos={contenidos} goDept={goDept} />}
      {screen === "DEPT" && activeDept && <PantallaDepartamento T={T} dept={activeDept} onBack={() => setScreen("A")} onServicio={(s) => goForm(activeDept, s)} />}
      {screen === "B" && <PantallaFormulario T={T} highlightId={highlightId} tramiteActivo={tramiteActivo} />}
      {screen === "C" && <PantallaSeguimiento T={T} highlightId={highlightId} />}
      {screen === "D" && <PantallaCalificacion T={T} highlightId={highlightId} />}
      {screen === "MAS" && <PantallaMas T={T} setScreen={setScreen} />}
      {screen === "COMUNIDAD" && <PantallaComunidad T={T} />}
      {screen === "FICHA" && <PantallaMiFicha T={T} />}
    </div>
  );
}

function PantallaMas({ T, setScreen }) {
  const items = [{ id: "COMUNIDAD", label: "Red de Apoyo Vecinal", icon: Users, desc: "Ofrécete como voluntario o pide ayuda" }, { id: "FICHA", label: "Mi Ficha Ciudadana", icon: IdCard, desc: "Tus documentos y cargas de asistencia" }];
  return (
    <div className="flex flex-col gap-2.5 max-w-xl">
      {items.map((it) => {
        const Icon = it.icon; return (
          <button key={it.id} onClick={() => setScreen(it.id)} className="rounded-3xl p-4 flex items-center gap-3.5 text-left" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk }}><Icon size={20} /></div>
            <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 700 }}>{it.label}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{it.desc}</p></div>
            <ChevronRight size={17} color={T.inkFaint} />
          </button>
        );
      })}
    </div>
  );
}

/* ---- Pantalla A: Dashboard ---- */
function PantallaDashboard({ T, highlightId, contenidos, goDept }) {
  const [geo, setGeo] = useState(false);
  const sugerencias = [
    { icon: GraduationCap, color: "copper", texto: "Detectamos que un menor de tu hogar está en edad de ingresar a Kínder 2027.", cta: "Ver colegios municipales" },
    { icon: Car, color: "ocean", texto: "Tu licencia de conducir vence en 2 meses.", cta: "Renovar ahora" },
  ];
  return (
    <div className="flex flex-col gap-6">
      {geo && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: T.goldSoft, color: T.gold }}>
          <Bell size={18} className="shrink-0" />
          <p style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Tu cuadrilla municipal está a la vuelta de la esquina. Asegúrate de tener acceso despejado.</p>
          <button onClick={() => setGeo(false)}><X size={15} /></button>
        </div>
      )}
      <section className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ background: `linear-gradient(120deg, ${T.copper} 0%, ${T.copperInk} 100%)`, color: T.surface }}>
        <div>
          <p style={{ opacity: 0.85, fontSize: 13.5 }}>Buenas tardes</p>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>María Elena Soto Pardo</h1>
          <p style={{ opacity: 0.9, fontSize: 13, marginTop: 6 }}>RUT 12.345.678-9 · Los Aromos 482, Villa Las Compañías</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 self-start" style={{ background: "rgba(255,255,255,0.16)" }}><Bell size={18} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>2 solicitudes activas</span></div>
      </section>

      <section className="flex flex-col gap-2.5">
        {sugerencias.map((s, i) => {
          const Icon = s.icon; const accent = T[s.color]; const accentSoft = T[`${s.color}Soft`]; return (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3.5" style={{ background: accentSoft }}>
              <Icon size={20} color={accent} className="shrink-0" />
              <p style={{ fontSize: 12.5, color: accent, fontWeight: 600, flex: 1 }}>{s.texto}</p>
              <button className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ background: accent, color: T.surface }}>{s.cta}</button>
            </div>
          );
        })}
      </section>

      <section>
        <SectionTitle T={T}>Departamentos municipales</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {DEPARTMENTS.map((d) => {
            const Icon = d.icon; const accent = T[d.key]; const accentSoft = T[`${d.key}Soft`]; const isHi = highlightId === d.id; return (
              <button key={d.id} onClick={() => goDept(d)} className={`text-left rounded-3xl p-4 md:p-5 flex flex-col gap-3 min-h-[132px] ${isHi ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${isHi ? accent : T.border}` }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: accentSoft, color: accent }}><Icon size={20} /></div>
                <div><p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{d.nombre}</p><p style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>{d.desc}</p></div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3.5">
          <SectionTitle T={T} noMargin>Noticias y alertas comunales</SectionTitle>
          <button onClick={() => setGeo(true)} style={{ fontSize: 10.5, color: T.inkFaint }} className="hidden sm:block">Simular alerta de proximidad</button>
        </div>
        <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
          {contenidos.map((n, i) => {
            const accent = T[n.tag]; const accentSoft = T[`${n.tag}Soft`]; return (
              <div key={i} className="rounded-3xl p-5 shrink-0 w-[260px] md:w-[300px] flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                <span className="w-fit px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: accentSoft, color: accent }}>{n.tipo === "Alerta" ? "Alerta comunal" : "Noticia"}</span>
                <p style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, lineHeight: 1.25 }}>{n.titulo}</p>
                <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.45 }}>{n.cuerpo}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PantallaDepartamento({ T, dept, onBack, onServicio }) {
  const Icon = dept.icon; const accent = T[dept.key]; const accentSoft = T[`${dept.key}Soft`];
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 13, fontWeight: 600 }}><ChevronLeft size={16} /> Volver al inicio</button>
      <div className="rounded-3xl p-6 flex items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accentSoft, color: accent }}><Icon size={26} /></div>
        <div><h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>{dept.nombre}</h1><p style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{dept.desc}</p></div>
      </div>
      <div className="flex flex-col gap-2.5">
        {dept.servicios.map((s, i) => (
          <button key={i} onClick={() => onServicio(s)} className="rounded-2xl p-4 flex items-center justify-between gap-3 text-left" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div><p style={{ fontSize: 14.5, fontWeight: 700 }}>{s.nombre}</p><p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{s.desc}</p></div>
            <ChevronRight size={18} color={accent} className="shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PantallaFormulario({ T, highlightId, tramiteActivo }) {
  const [jurada, setJurada] = useState(false);
  const [paraQuien, setParaQuien] = useState("titular");
  const deptNombre = tramiteActivo?.dept?.nombre || "Aseo, Ornato y Medio Ambiente";
  const servicioNombre = tramiteActivo?.servicio?.nombre || "Retiro de residuos domiciliarios";
  return (
    <div className={`max-w-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 ${highlightId === "form-card" ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      {/* Logo Vertical Color a la izquierda de la Solicitud */}
      <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: T.border }}>
        <LogoVerticalSmall height={36} />
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: T.copper }}>{deptNombre}</p>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Solicitud: {servicioNombre}</h2>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>¿Para quién es esta solicitud?</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[{ id: "titular", label: "Para mí" }, { id: "carga1", label: "Juan Soto H. (padre)" }].map((op) => (
            <button key={op.id} onClick={() => setParaQuien(op.id)} className="px-3.5 py-2 rounded-full text-[12.5px] font-bold" style={{ background: paraQuien === op.id ? T.copper : T.surfaceAlt, color: paraQuien === op.id ? T.surface : T.inkSoft }}>{op.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <ReadOnlyField T={T} label="RUT" value={paraQuien === "titular" ? "12.345.678-9" : "5.221.334-8"} />
        <ReadOnlyField T={T} label="Nombre completo" value={paraQuien === "titular" ? "María Elena Soto Pardo" : "Juan Soto Herrera"} />
        <div className="sm:col-span-2"><ReadOnlyField T={T} label="Dirección registrada" value="Los Aromos 482, Villa Las Compañías" /></div>
      </div>
      <div>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>Ajusta el punto exacto en el mapa</label>
        <div className="mt-2 rounded-2xl h-52 relative overflow-hidden" style={{ background: `repeating-linear-gradient(0deg, ${T.bgAlt}, ${T.bgAlt} 23px, transparent 23px, transparent 24px), repeating-linear-gradient(90deg, ${T.bgAlt}, ${T.bgAlt} 23px, transparent 23px, transparent 24px), ${T.surfaceAlt}`, border: `1.5px solid ${T.border}` }}>
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
            <MapPin size={30} color={T.copper} fill={T.copperSoft} />
            <span style={{ fontSize: 11.5, color: T.inkSoft, background: `${T.surface}CC`, padding: "3px 8px", borderRadius: 999 }}>Arrastra el pin para ajustar tu ubicación</span>
          </div>
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-2xl p-4" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <input type="checkbox" checked={jurada} onChange={(e) => setJurada(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0" style={{ accentColor: T.copper }} />
        <span style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>Declaro bajo juramento simple que la información entregada es verídica y que no he recibido previamente este mismo beneficio para la dirección indicada.</span>
      </label>
      <button disabled={!jurada} className="rounded-2xl py-3.5 font-bold text-[14.5px] flex items-center justify-center gap-2 transition-opacity" style={{ background: T.copper, color: T.surface, opacity: jurada ? 1 : 0.45 }}>Enviar solicitud <ArrowRight size={17} /></button>
    </div>
  );
}
function ReadOnlyField({ T, label, value }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkFaint }}>{label}</label>
      <div className="mt-1.5 rounded-xl px-3.5 py-3 flex items-center justify-between" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: "not-allowed" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span><Lock size={14} color={T.inkFaint} />
      </div>
    </div>
  );
}

function PantallaSeguimiento({ T, highlightId }) {
  const [showReprog, setShowReprog] = useState(false);
  const [selDay, setSelDay] = useState(null);
  const [geo, setGeo] = useState(false);
  const pasos = ["Recibida", "En revisión", "Aceptada", "Programada", "En tránsito", "Finalizada"];
  const actual = 4;
  return (
    <div className={`max-w-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-7 ${highlightId === "seguimiento-card" ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <div><p style={{ fontSize: 12.5, fontWeight: 700, color: T.copper }}>Solicitud N.º 20487</p><h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600 }}>Retiro de escombros</h2></div>

      {geo && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: T.goldSoft, color: T.gold }}>
          <Bell size={18} className="shrink-0" /><p style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Tu cuadrilla está a menos de 3 cuadras. ¡Asegúrate de tener acceso despejado!</p><button onClick={() => setGeo(false)}><X size={15} /></button>
        </div>
      )}

      <div className="flex items-center">
        {pasos.map((p, i) => {
          const done = i <= actual; return (
            <React.Fragment key={p}>
              <div className="flex flex-col items-center gap-1" style={{ width: 0, minWidth: "fit-content" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? T.copper : T.surfaceAlt, border: `1.5px solid ${done ? T.copper : T.border}`, color: done ? T.surface : T.inkFaint }}>{done ? <Check size={15} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}</div>
                <span style={{ fontSize: 9.5, color: done ? T.ink : T.inkFaint, fontWeight: done ? 700 : 500, textAlign: "center", width: 62 }}>{p}</span>
                {done && <span style={{ fontSize: 7.5, color: T.inkFaint, fontFamily: "monospace" }}>{HASHES[i]}</span>}
              </div>
              {i < pasos.length - 1 && <div className="flex-1 h-[2px] mb-4" style={{ background: i < actual ? T.copper : T.border }} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 16, fontFamily: FONT_DISPLAY }}>{initials("Pedro Ilabaca")}</div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 700 }}>Pedro Ilabaca R.</p>
          <p style={{ fontSize: 12, color: T.inkSoft }}>RUT 9.876.543-2 · Cuadrilla Aseo y Ornato</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 700, background: T.oceanSoft, color: T.ocean }}>Patente RVXK-27</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: T.surface, border: `1px solid ${T.border}` }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffffff", border: `1px solid ${T.borderStrong}` }} /> Blanco / franja verde</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surface, border: `1px solid ${T.border}` }} aria-label="Llamar"><Phone size={15} /></button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: T.goldSoft, color: T.gold }}><Clock size={20} className="shrink-0" /><p style={{ fontSize: 13.5, fontWeight: 700 }}>Llegada estimada: jueves entre 14:00 y 16:30 hrs</p></div>

      <div className="flex gap-2.5 flex-wrap">
        <button onClick={() => setShowReprog(true)} className="flex-1 rounded-2xl py-3 font-bold text-[13.5px]" style={{ background: "transparent", border: `1.5px solid ${T.red}`, color: T.red }}>No estaré en casa / Reprogramar</button>
        <button onClick={() => setGeo(true)} className="rounded-2xl py-3 px-4 font-bold text-[12px]" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Simular geocerca</button>
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: T.surfaceAlt, border: `1px dashed ${T.borderStrong}` }}>
        <QrCode size={22} color={T.inkFaint} className="shrink-0" />
        <div className="flex-1"><p style={{ fontSize: 12, fontWeight: 700 }}>Comprobante inmutable de esta entrega</p><p style={{ fontSize: 10.5, color: T.inkFaint, fontFamily: "monospace" }}>Hash: 0x9fd302…e61a — no puede ser alterado, ni siquiera por administradores.</p></div>
      </div>

      {showReprog && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(12,20,18,0.55)" }} onClick={() => setShowReprog(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[380px] rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface }}>
            <div className="flex items-center justify-between"><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Elige una nueva fecha</h3><button onClick={() => setShowReprog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}><X size={15} /></button></div>
            <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <button key={d} onClick={() => setSelDay(d)} className="aspect-square rounded-xl flex items-center justify-center text-[12.5px] font-semibold" style={{ background: selDay === d ? T.copper : T.surfaceAlt, color: selDay === d ? T.surface : T.ink, border: `1px solid ${selDay === d ? T.copper : T.border}` }}>{d}</button>)}</div>
            <button disabled={!selDay} onClick={() => setShowReprog(false)} className="rounded-2xl py-3 font-bold text-[13.5px]" style={{ background: T.copper, color: T.surface, opacity: selDay ? 1 : 0.45 }}>Confirmar nueva fecha</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PantallaCalificacion({ T, highlightId }) {
  const [rating, setRating] = useState(4); const [hover, setHover] = useState(0);
  return (
    <div className={`max-w-xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 ${highlightId === "calificacion-card" ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <div><p style={{ fontSize: 12.5, fontWeight: 700, color: T.copper }}>Solicitud N.º 20481 · Finalizada</p><h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600 }}>¿Cómo estuvo la atención?</h2></div>
      <div className="flex justify-center gap-2 py-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} aria-label={`${n} estrellas`}><Star size={38} strokeWidth={1.5} color={T.gold} fill={(hover || rating) >= n ? T.gold : "transparent"} /></button>)}</div>
      <div><label style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>Cuéntanos más (opcional)</label><textarea rows={4} placeholder="¿Qué se puede mejorar?" className="mt-2 w-full rounded-2xl p-4 outline-none resize-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 14, color: T.ink }} /></div>
      <button className="rounded-2xl py-3 flex items-center justify-center gap-2 font-bold text-[13.5px]" style={{ background: T.surfaceAlt, border: `1.5px dashed ${T.borderStrong}`, color: T.inkSoft }}><Camera size={17} /> Subir evidencia fotográfica</button>
      <button className="rounded-2xl py-3.5 font-bold text-[14.5px]" style={{ background: T.copper, color: T.surface }}>Enviar calificación</button>
    </div>
  );
}

/* ---- Comunidad (red de apoyo voluntaria) ---- */
function PantallaComunidad({ T }) {
  const [voluntario, setVoluntario] = useState(false);
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <SectionTitle T={T}>Red de Apoyo Vecinal Voluntaria</SectionTitle>
      <label className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <input type="checkbox" checked={voluntario} onChange={(e) => setVoluntario(e.target.checked)} className="w-5 h-5 shrink-0" style={{ accentColor: T.copper }} />
        <div><p style={{ fontSize: 14, fontWeight: 700 }}>Quiero ser voluntario en emergencias</p><p style={{ fontSize: 12.5, color: T.inkSoft }}>Te avisaremos si un vecino cercano necesita ayuda durante un temporal.</p></div>
      </label>
      {voluntario && (
        <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.sageSoft }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.sage }}>¡Gracias! Estás en la red activa. Vecinos que podrías ayudar cerca de ti:</p>
          <div className="rounded-2xl p-3.5 flex items-center justify-between gap-3" style={{ background: T.surface }}>
            <div><p style={{ fontSize: 13, fontWeight: 700 }}>Don Segundo Bravo (86 años)</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>Los Aromos 510 · necesita ayuda con sacos de arena</p></div>
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold" style={{ background: T.sageSoft, color: T.sage }}>2 voluntarios ya asignados</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Mi Ficha Ciudadana (identidad autogestionada) ---- */
function PantallaMiFicha({ T }) {
  const [cargas, setCargas] = useState([{ nombre: "Juan Soto Herrera", rut: "5.221.334-8", parentesco: "Padre" }]);
  const [showAdd, setShowAdd] = useState(false);
  const docs = [
    { nombre: "Certificado de Nacimiento", estado: "Verificado", compartidoCon: ["DIDECO", "Vivienda"] },
    { nombre: "Ficha de Protección Social", estado: "Verificado", compartidoCon: ["DIDECO", "Salud"] },
    { nombre: "Registro de Propiedad", estado: "Pendiente de validación", compartidoCon: [] },
  ];
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <SectionTitle T={T}>Mi Ficha Ciudadana</SectionTitle>
        <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: -8 }}>Sube tus documentos una sola vez; se comparten internamente entre direcciones con tu autorización.</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {docs.map((d, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <FileText size={20} color={T.inkFaint} className="shrink-0" />
            <div className="flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 700 }}>{d.nombre}</p>
              <p style={{ fontSize: 11.5, color: d.estado === "Verificado" ? T.sage : T.gold, fontWeight: 700 }}>{d.estado}</p>
              {d.compartidoCon.length > 0 && <p style={{ fontSize: 11, color: T.inkFaint }}>Compartido con: {d.compartidoCon.join(", ")}</p>}
            </div>
            <button className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: T.copperSoft, color: T.copperInk }}>Compartir</button>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5"><SectionTitle T={T} noMargin>Cargas de asistencia</SectionTitle><button onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: T.copper }}><UserPlus size={14} /> Agregar</button></div>
        <div className="flex flex-col gap-2">
          {cargas.map((c, i) => (
            <div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 11 }}>{initials(c.nombre)}</div>
              <div className="flex-1"><p style={{ fontSize: 13, fontWeight: 700 }}>{c.nombre}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>RUT {c.rut} · {c.parentesco}</p></div>
            </div>
          ))}
        </div>
        {showAdd && (
          <div className="mt-2.5 rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <input id="carga-nombre" placeholder="Nombre completo" className="rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surface, border: `1px solid ${T.border}` }} />
            <input id="carga-rut" placeholder="RUT" className="rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surface, border: `1px solid ${T.border}` }} />
            <input id="carga-parentesco" placeholder="Parentesco (ej. Madre)" className="rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surface, border: `1px solid ${T.border}` }} />
            <button onClick={() => {
              const n = document.getElementById("carga-nombre").value, r = document.getElementById("carga-rut").value, p = document.getElementById("carga-parentesco").value;
              if (n && r) { setCargas((c) => [...c, { nombre: n, rut: r, parentesco: p || "Familiar" }]); setShowAdd(false); }
            }} className="rounded-xl py-2.5 font-bold text-[12.5px]" style={{ background: T.copper, color: T.surface }}>Guardar carga</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PORTAL DEL TRABAJADOR
--------------------------------------------------------------------- */
function TrabajadorPortal({ T, screen, setScreen }) {
  return (
    <div className="pt-5 md:pt-7">
      <div className="hidden md:flex gap-1.5 mb-6 rounded-full p-1 w-fit" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        {[{ id: "FICHAJE", label: "Fichaje" }, { id: "AGENDA", label: "Mi agenda" }, { id: "TAREA", label: "Tarea activa" }, { id: "CIERRE", label: "Cierre de tarea" }].map((t) => {
          const active = screen === t.id; return (
            <button key={t.id} onClick={() => setScreen(t.id)} className="px-4 py-2 rounded-full text-[13px] font-semibold" style={{ background: active ? T.copper : "transparent", color: active ? T.surface : T.inkSoft }}>{t.label}</button>
          );
        })}
      </div>
      {screen === "FICHAJE" && <PantallaFichaje T={T} />}
      {screen === "AGENDA" && <PantallaAgenda T={T} />}
      {screen === "TAREA" && <PantallaTareaActiva T={T} />}
      {screen === "CIERRE" && <PantallaCierreTarea T={T} />}
    </div>
  );
}

function PantallaFichaje({ T }) {
  const [jornada, setJornada] = useState("sin-iniciar"); // sin-iniciar | activa | colacion | terminada
  const [horaInicio, setHoraInicio] = useState(null);
  return (
    <div className="max-w-md rounded-3xl p-7 flex flex-col gap-5 items-center text-center" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <Fingerprint size={32} color={T.copper} />
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Fichaje digital</h2>
      {jornada === "sin-iniciar" && <p style={{ fontSize: 12.5, color: T.inkSoft }}>Marca tu ingreso al iniciar tu turno.</p>}
      {jornada !== "sin-iniciar" && <p style={{ fontSize: 12.5, color: T.inkSoft }}>Jornada iniciada a las {horaInicio} hrs · GPS capturado en Depósito Municipal Sector Norte</p>}

      {jornada === "sin-iniciar" && (
        <button onClick={() => { setHoraInicio(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })); setJornada("activa"); }} className="w-full rounded-3xl py-6 font-bold text-[16px]" style={{ background: T.sage, color: T.surface }}>Iniciar Jornada</button>
      )}
      {jornada === "activa" && (
        <>
          <button onClick={() => setJornada("colacion")} className="w-full rounded-3xl py-5 font-bold text-[14.5px]" style={{ background: T.goldSoft, color: T.gold }}>Marcar pausa de colación</button>
          <button onClick={() => setJornada("terminada")} className="w-full rounded-3xl py-6 font-bold text-[16px]" style={{ background: T.red, color: T.surface }}>Finalizar Jornada</button>
        </>
      )}
      {jornada === "colacion" && (
        <button onClick={() => setJornada("activa")} className="w-full rounded-3xl py-6 font-bold text-[16px]" style={{ background: T.sage, color: T.surface }}>Reanudar Jornada</button>
      )}
      {jornada === "terminada" && (
        <div className="w-full rounded-3xl py-6 flex items-center justify-center gap-2" style={{ background: T.sageSoft, color: T.sage }}><CheckCircle2 size={20} /><span style={{ fontWeight: 700 }}>Jornada finalizada, buen trabajo</span></div>
      )}
    </div>
  );
}

function PantallaAgenda({ T }) {
  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Mi agenda del día · ruta optimizada por IA</h2>
      <div className="rounded-3xl h-56 relative overflow-hidden" style={{ background: `repeating-linear-gradient(0deg, ${T.bgAlt}, ${T.bgAlt} 27px, transparent 27px, transparent 28px), repeating-linear-gradient(90deg, ${T.bgAlt}, ${T.bgAlt} 27px, transparent 27px, transparent 28px), ${T.surfaceAlt}`, border: `1.5px solid ${T.border}` }}>
        <svg viewBox="0 0 300 200" className="absolute inset-0 w-full h-full"><polyline points="40,150 120,90 200,110 260,50" fill="none" stroke={T.copper} strokeWidth="3" strokeDasharray="6 5" /></svg>
        {[{ x: "13%", y: "75%" }, { x: "40%", y: "45%" }, { x: "66%", y: "55%" }, { x: "86%", y: "25%" }].map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ top: p.y, left: p.x, background: T.copper, color: T.surface }}>{i + 1}</div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {AGENDA_TRABAJADOR.map((a, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold" style={{ background: T.copperSoft, color: T.copperInk, fontSize: 12 }}>{i + 1}</div>
            <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{a.tarea}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{a.direccion} · {a.hora} hrs</p></div>
            <Navigation size={16} color={T.copper} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PantallaTareaActiva({ T }) {
  const [showImprevisto, setShowImprevisto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: T.copper }}>Tarea activa</p>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Entrega de 10 sacos de arena</h2>
        <p style={{ fontSize: 13.5, color: T.inkSoft }}>Calle Prat #123</p>
        <div className="rounded-2xl p-3.5" style={{ background: T.goldSoft, color: T.gold }}><p style={{ fontSize: 12.5, fontWeight: 700 }}>Nota del vecino: &ldquo;Tocar el timbre fuerte, timbre malo.&rdquo;</p></div>
        {!enviado ? (
          <button onClick={() => setShowImprevisto(true)} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: "transparent", border: `1.5px solid ${T.red}`, color: T.red }}>Registrar imprevisto</button>
        ) : (
          <div className="rounded-2xl p-3.5 flex items-center gap-2" style={{ background: T.sageSoft, color: T.sage }}><CheckCircle2 size={17} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Reprogramación notificada automáticamente al vecino</span></div>
        )}
      </div>
      {showImprevisto && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(12,20,18,0.55)" }} onClick={() => setShowImprevisto(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[380px] rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Vecino no está en casa</h3>
            <div className="h-32 rounded-2xl flex items-center justify-center" style={{ background: T.surfaceAlt }}><Camera size={26} color={T.inkFaint} /></div>
            <p style={{ fontSize: 11.5, color: T.inkSoft }}>Toma una foto de la puerta cerrada como evidencia.</p>
            <button onClick={() => { setShowImprevisto(false); setEnviado(true); }} className="rounded-2xl py-3 font-bold text-[13.5px]" style={{ background: T.red, color: T.surface }}>Confirmar imprevisto</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PantallaCierreTarea({ T }) {
  const [foto, setFoto] = useState(false);
  const [firmado, setFirmado] = useState(false);
  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Cierre de tarea</h2>
        <button onClick={() => setFoto(true)} className="h-36 rounded-2xl flex flex-col items-center justify-center gap-2" style={{ background: foto ? T.sageSoft : T.surfaceAlt, border: `1.5px dashed ${T.borderStrong}` }}>
          {foto ? <><CheckCircle2 size={26} color={T.sage} /><span style={{ fontSize: 12, fontWeight: 700, color: T.sage }}>Foto del trabajo terminado capturada</span></> : <><Camera size={26} color={T.inkFaint} /><span style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint }}>Tomar foto del trabajo terminado</span></>}
        </button>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>Firma digital del vecino</label>
          <button onClick={() => setFirmado(true)} className="mt-2 w-full h-28 rounded-2xl flex items-center justify-center" style={{ background: T.surfaceAlt, border: `1.5px dashed ${T.borderStrong}` }}>
            {firmado ? <svg width="140" height="40" viewBox="0 0 140 40"><path d="M5 30 Q20 5 35 25 T70 20 T105 30 T135 10" fill="none" stroke={T.copper} strokeWidth="2.5" /></svg> : <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 700 }}>Firmar aquí</span>}
          </button>
        </div>
        <button disabled={!foto || !firmado} className="rounded-2xl py-3.5 font-bold text-[14.5px]" style={{ background: T.copper, color: T.surface, opacity: foto && firmado ? 1 : 0.45 }}>Confirmar entrega</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   ADMIN PANEL
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   SEED DATA & COMPONENTS: GESTIÓN DE EMPLEADOS / FUNCIONARIOS (SGR)
   Mockups 1 a 8 — Relación de Artefactos & Diagramas (Clases, Requerimientos, DER)
--------------------------------------------------------------------- */


/* Helper de Validación y Formateo de RUT Chileno (RF-010) */
function formatRut(rutRaw) {
  let value = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (value.length <= 1) return value;
  const dv = value.slice(-1);
  let body = value.slice(0, -1);
  body = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return `${body}-${dv}`;
}
function validarRutChileno(rutStr) {
  const clean = rutStr.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let suma = 0;
  let multiplo = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
  return dvCalc === dv;
}


const SEED_EMPLEADOS = [
  {
    rut: "12.345.678-9",
    nombre: "Juan",
    apellido: "Pérez",
    cargo: "Analista RRHH",
    departamento: "Recursos Humanos",
    delegacion: "Centro",
    correo: "juan.perez@empresa.cl",
    telefono: "+56 9 1234 5678",
    fechaIngreso: "20/03/2024",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    procesosActivos: ["Contrato vigente", "Solicitud de vacaciones pendiente"],
    metasSGR: { avance: 85, meta: 100, semaforo: "sage", ponderado: 21.25 },
    compromisos: [
      { actividad: "Capacitación de nuevo personal municipal", fecha: "28/08/2026", territorio: "Centro", estatus: "Realizado" },
      { actividad: "Evaluación de clima laboral en delegaciones", fecha: "15/09/2026", territorio: "Las Compañías", estatus: "En proceso" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0012", fecha: "25/08/2026 10:30", desc: "Registro de asistencia taller RRHH", estatus: "Aprobado" }
    ]
  },
  {
    rut: "15.987.654-3",
    nombre: "María",
    apellido: "López",
    cargo: "Asistente",
    departamento: "Recursos Humanos",
    delegacion: "La Antena",
    correo: "maria.lopez@empresa.cl",
    telefono: "+56 9 8765 4321",
    fechaIngreso: "15/01/2023",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
    procesosActivos: ["Licencia médica tramitada"],
    metasSGR: { avance: 92, meta: 100, semaforo: "sage", ponderado: 23.0 },
    compromisos: [
      { actividad: "Revisión de carpetas de funcionarios", fecha: "30/08/2026", territorio: "La Antena", estatus: "Realizado" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0044", fecha: "26/08/2026 14:15", desc: "Acta de inventario RRHH", estatus: "Aprobado" }
    ]
  },
  {
    rut: "17.654.321-0",
    nombre: "Carlos",
    apellido: "Gómez",
    cargo: "Desarrollador",
    departamento: "Tecnología",
    delegacion: "Las Compañías",
    correo: "carlos.gomez@empresa.cl",
    telefono: "+56 9 5555 1234",
    fechaIngreso: "10/06/2022",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    procesosActivos: ["Compromisos pendientes en agenda SGR"],
    metasSGR: { avance: 78, meta: 100, semaforo: "gold", ponderado: 19.5 },
    compromisos: [
      { actividad: "Despliegue módulo de firma digital SGR", fecha: "10/09/2026", territorio: "Las Compañías", estatus: "Pendiente" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0089", fecha: "24/08/2026 16:45", desc: "Pruebas de API y base de datos", estatus: "Aprobado" }
    ]
  },
  {
    rut: "18.456.987-2",
    nombre: "Laura",
    apellido: "Torres",
    cargo: "Contador",
    departamento: "Finanzas",
    delegacion: "Avenida del Mar",
    correo: "laura.torres@empresa.cl",
    telefono: "+56 9 4444 8888",
    fechaIngreso: "01/11/2021",
    estado: "Inactivo",
    imagen: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
    procesosActivos: [],
    metasSGR: { avance: 45, meta: 100, semaforo: "red", ponderado: 11.25 },
    compromisos: [],
    evidencias: []
  },
  {
    rut: "19.876.543-1",
    nombre: "Pedro",
    apellido: "Ramírez",
    cargo: "Soporte TI",
    departamento: "Tecnología",
    delegacion: "La Pampa",
    correo: "pedro.ramirez@empresa.cl",
    telefono: "+56 9 9999 1111",
    fechaIngreso: "05/04/2024",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    procesosActivos: [],
    metasSGR: { avance: 95, meta: 100, semaforo: "sage", ponderado: 23.75 },
    compromisos: [
      { actividad: "Mantención de red de delegación La Pampa", fecha: "02/09/2026", territorio: "La Pampa", estatus: "Realizado" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0105", fecha: "26/08/2026 11:00", desc: "Reporte de velocidad y conectividad", estatus: "Aprobado" }
    ]
  },
  {
    rut: "13.111.222-3",
    nombre: "M. Fonseca",
    apellido: "Pardo",
    cargo: "Territorial OO.CC. 1",
    departamento: "Aseo, Ornato y Medio Ambiente",
    delegacion: "Rural",
    correo: "m.fonseca@laserena.cl",
    telefono: "+56 9 7777 3333",
    fechaIngreso: "12/08/2020",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80",
    procesosActivos: ["Visitas a terrero programadas"],
    metasSGR: { avance: 88, meta: 100, semaforo: "sage", ponderado: 22.0 },
    compromisos: [
      { actividad: "Reunión JJVV sector El Romero", fecha: "05/09/2026", territorio: "Rural", estatus: "En proceso" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0201", fecha: "22/08/2026 09:30", desc: "Fotografía de operativo de limpieza", estatus: "Aprobado" }
    ]
  },
  {
    rut: "14.221.098-7",
    nombre: "Katherine",
    apellido: "Solís",
    cargo: "Fiscalizador",
    departamento: "Seguridad y Fiscalización",
    delegacion: "Centro",
    correo: "ksolis@laserena.cl",
    telefono: "+56 9 2222 5555",
    fechaIngreso: "01/03/2021",
    estado: "Activo",
    imagen: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80",
    procesosActivos: ["Actas de infracción en revisión"],
    metasSGR: { avance: 98, meta: 100, semaforo: "sage", ponderado: 24.5 },
    compromisos: [
      { actividad: "Inspección de ruidos molestos sector centro", fecha: "01/09/2026", territorio: "Centro", estatus: "Realizado" }
    ],
    evidencias: [
      { codigo: "EVD-2026-0310", fecha: "25/08/2026 23:15", desc: "Medición sonométrica aprobada", estatus: "Aprobado" }
    ]
  }
];

/* ---------------------------------------------------------------------
   MOCKUP 1: DASHBOARD / LISTA DE EMPLEADOS (FUNCIONARIOS)
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
--------------------------------------------------------------------- */
function ModalConfirmarEliminar({ T, emp, onClose, onConfirmar }) {
  if (!emp) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl animate-scale-up" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
          <X size={14} />
        </button>

        {/* Icono Rojo de Basura / Advertencia */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 shadow-inner" style={{ background: T.redSoft, color: T.red }}>
          <Trash2 size={32} />
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>Confirmar Eliminación</h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>
            ¿Está seguro de que desea eliminar a este empleado? Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Ficha Resumen del Empleado a Eliminar */}
        <div className="w-full rounded-2xl p-3.5 text-left text-[12.5px] flex flex-col gap-1.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div className="flex justify-between py-1 border-b" style={{ borderColor: T.border }}>
            <span style={{ color: T.inkSoft }}>Rut:</span>
            <span className="font-mono font-bold">{emp.rut}</span>
          </div>
          <div className="flex justify-between py-1 border-b" style={{ borderColor: T.border }}>
            <span style={{ color: T.inkSoft }}>Nombre:</span>
            <span className="font-bold">{emp.nombre} {emp.apellido}</span>
          </div>
          <div className="flex justify-between py-1">
            <span style={{ color: T.inkSoft }}>Cargo:</span>
            <span>{emp.cargo}</span>
          </div>
        </div>

        {/* Botones de Confirmar / Denegar (Cancelar) */}
        <div className="flex gap-2.5 w-full mt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold shadow-md" style={{ background: T.red, color: T.surface }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}


function PantallaGestionEmpleados({ T, empleados, setEmpleados, onNuevo, onVer, onEditar }) {
  const [busqueda, setBusqueda] = useState("");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  // Active Modals
  const [modalDuplicado, setModalDuplicado] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [modalRestriccion, setModalRestriccion] = useState(null);
  const [modalSinResultados, setModalSinResultados] = useState(false);
  const [modalBuscar, setModalBuscar] = useState(false);

  const deptsList = ["Todos", "Recursos Humanos", "Tecnología", "Finanzas", "Aseo, Ornato y Medio Ambiente", "Seguridad y Fiscalización", "DIDECO"];

  const filtrados = empleados.filter((e) => {
    const q = busqueda.toLowerCase().trim();
    const matchQ = !q || e.rut.toLowerCase().includes(q) || `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) || e.cargo.toLowerCase().includes(q);
    const matchDept = deptFilter === "Todos" || e.departamento === deptFilter;
    const matchEstado = estadoFilter === "Todos" || e.estado === estadoFilter;
    return matchQ && matchDept && matchEstado;
  });

  const totalPaginas = Math.ceil(filtrados.length / porPagina) || 1;
  const paginados = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(null);

  const intentarEliminar = (emp) => {
    if (emp.procesosActivos && emp.procesosActivos.length > 0) {
      setModalRestriccion({
        rut: emp.rut,
        nombre: `${emp.nombre} ${emp.apellido}`,
        procesos: emp.procesosActivos
      });
    } else {
      setModalConfirmarEliminar(emp);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header del Mockup 1 */}
      <div className="rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={22} color={T.copper} />
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700 }}>Gestión de Empleados</h1>
          </div>
          <p style={{ fontSize: 13, color: T.inkSoft }}>Administra la información de los empleados de la organización.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={() => setModalBuscar(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>
            <Filter size={15} /> Filtros
          </button>
          <button onClick={onNuevo} className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-[13px] font-bold shadow-md transition-transform active:scale-95" style={{ background: T.copper, color: T.surface }}>
            <Plus size={16} /> + Nuevo Empleado
          </button>
        </div>
      </div>

      

      {/* Controles de Búsqueda y Filtro Principal */}
      <div className="rounded-3xl p-4 flex flex-col md:flex-row gap-3 items-center" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color={T.inkFaint} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar empleado por Rut, nombre o cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-[13px] outline-none transition-colors"
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
          />
        </div>

        <div className="flex gap-2.5 w-full md:w-auto overflow-x-auto">
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPagina(1); }}
            className="px-3.5 py-2.5 rounded-2xl text-[12.5px] outline-none font-semibold shrink-0"
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
          >
            <option value="Todos">Departamento: Todos</option>
            {deptsList.filter(d => d !== "Todos").map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value); setPagina(1); }}
            className="px-3.5 py-2.5 rounded-2xl text-[12.5px] outline-none font-semibold shrink-0"
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Empleados (Mockup 1 Screenshot) */}
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceAlt, borderBottom: `1.5px solid ${T.border}` }}>
                {["Rut", "Nombre", "Cargo", "Departamento", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: 11.5, fontWeight: 700, color: T.inkFaint, letterSpacing: 0.3 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[13px]" style={{ color: T.inkFaint }}>
                    No se encontraron empleados que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginados.map((emp) => {
                  const esActivo = emp.estado === "Activo";
                  return (
                    <tr key={emp.rut} className="hover:bg-black/5 transition-colors" style={{ borderTop: `1px solid ${T.border}` }}>
                      <td className="px-5 py-4 font-mono font-bold text-[13px]" style={{ color: T.ink }}>
                        {emp.rut}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 13.5, fontWeight: 700 }}>
                        <div className="flex items-center gap-2.5">
                          <img src={emp.imagen} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: `1px solid ${T.border}` }} />
                          <span>{emp.nombre} {emp.apellido}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: T.inkSoft }}>
                        {emp.cargo}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: T.inkSoft }}>
                        {emp.departamento}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold inline-block" style={{ background: esActivo ? T.sageSoft : T.redSoft, color: esActivo ? T.sage : T.red }}>
                          {emp.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onVer(emp)} title="Consultar Ficha Detalle (Mockup 4)" className="p-2 rounded-xl transition-colors hover:scale-110" style={{ background: T.surfaceAlt, color: T.ocean }}>
                            <Eye size={15} />
                          </button>
                          <button onClick={() => onEditar(emp)} title="Editar Empleado (Mockup 2)" className="p-2 rounded-xl transition-colors hover:scale-110" style={{ background: T.surfaceAlt, color: T.gold }}>
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => intentarEliminar(emp)} title="Eliminar (Evalúa procesos activos - Mockup 7)" className="p-2 rounded-xl transition-colors hover:scale-110" style={{ background: T.redSoft, color: T.red }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación del Mockup 1 */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <p style={{ fontSize: 12, color: T.inkFaint }}>
            Mostrando {filtrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, filtrados.length)} de {filtrados.length} registros
          </p>

          <div className="flex items-center gap-1">
            <button disabled={pagina === 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPagina(n)} className="w-8 h-8 rounded-xl text-[12px] font-bold" style={{ background: pagina === n ? T.copper : T.surface, color: pagina === n ? T.surface : T.ink, border: `1px solid ${T.border}` }}>
                {n}
              </button>
            ))}
            <button disabled={pagina === totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals Rendidos */}
      {modalDuplicado && <ModalEmpleadoDuplicado T={T} emp={modalDuplicado} onClose={() => setModalDuplicado(null)} onVerRegistro={() => { const found = empleados.find(e => e.rut === modalDuplicado.rut); if (found) onVer(found); setModalDuplicado(null); }} />}
      {modalError && <ModalErrorValidacion T={T} emailInput={modalError} onClose={() => setModalError(null)} />}
      {modalRestriccion && <ModalOperacionNoPermitida T={T} emp={modalRestriccion} onClose={() => setModalRestriccion(null)} />}
      {modalSinResultados && <ModalSinResultados T={T} onClose={() => setModalSinResultados(false)} />}
      {modalConfirmarEliminar && (
        <ModalConfirmarEliminar
          T={T}
          emp={modalConfirmarEliminar}
          onClose={() => setModalConfirmarEliminar(null)}
          onConfirmar={() => {
            setEmpleados((prev) => prev.filter((item) => item.rut !== modalConfirmarEliminar.rut));
            setModalConfirmarEliminar(null);
          }}
        />
      )}
      {modalBuscar && <ModalBuscarEmpleado T={T} empleados={empleados} onClose={() => setModalBuscar(false)} onSeleccionar={(e) => { onVer(e); setModalBuscar(false); }} onSinCoincidencias={() => { setModalBuscar(false); setModalSinResultados(true); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 2: REGISTRAR / EDITAR EMPLEADO
--------------------------------------------------------------------- */
function PantallaRegistrarEmpleado({ T, empleados, setEmpleados, empEditar, onVolver, triggerDuplicado, triggerError }) {
  const [rut, setRut] = useState(empEditar ? empEditar.rut : "");
  const [nombre, setNombre] = useState(empEditar ? empEditar.nombre : "");
  const [apellido, setApellido] = useState(empEditar ? empEditar.apellido : "");
  const [correo, setCorreo] = useState(empEditar ? empEditar.correo : "");
  const [cargo, setCargo] = useState(empEditar ? empEditar.cargo : "Analista RRHH");
  const [departamento, setDepartamento] = useState(empEditar ? empEditar.departamento : "Recursos Humanos");
  const [fechaIngreso, setFechaIngreso] = useState(empEditar ? empEditar.fechaIngreso : "2024-03-20");
  const [estado, setEstado] = useState(empEditar ? empEditar.estado : "Activo");
  const [imagen, setImagen] = useState(empEditar ? empEditar.imagen : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80");

  const [modalDuplicado, setModalDuplicado] = useState(null);
  const [modalError, setModalError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const rutLimpio = rut.trim();
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoLimpio = correo.trim();

    // Validación RF-010: Campos obligatorios incompletos
    if (!rutLimpio || !nombreLimpio || !apellidoLimpio || !correoLimpio) {
      setModalError("Todos los campos marcados con (*) son obligatorios");
      return;
    }

    // Validación Mockup 5 / RF-009: RUT Duplicado en la base de datos
    if (!empEditar && empleados.some((emp) => emp.rut.trim() === rutLimpio)) {
      const existe = empleados.find((emp) => emp.rut.trim() === rutLimpio);
      setModalDuplicado({ rut: rutLimpio, nombre: `${existe ? existe.nombre + " " + existe.apellido : "Empleado Existente"}` });
      return;
    }

    // Validación Mockup 6 / RF-010: Formato de correo electrónico (debe incluir @ y dominio válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoLimpio)) {
      setModalError(correoLimpio || "correo.invalido");
      return;
    }

    // Guardar Empleado
    if (empEditar) {
      setEmpleados((prev) => prev.map((item) => (item.rut === empEditar.rut ? { ...item, rut, nombre, apellido, correo, cargo, departamento, fechaIngreso, estado, imagen } : item)));
    } else {
      const nuevoObj = {
        rut, nombre, apellido, correo, cargo, departamento,
        delegacion: "Centro", fechaIngreso, estado, imagen,
        telefono: "+56 9 1234 5678", procesosActivos: ["Contrato inicial firmado"],
        metasSGR: { avance: 100, meta: 100, semaforo: "sage", ponderado: 25.0 },
        compromisos: [], evidencias: []
      };
      setEmpleados((prev) => [nuevoObj, ...prev]);
    }
    onVolver();
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Breadcrumb del Mockup 2 */}
      <div className="flex items-center gap-2 text-[13px]" style={{ color: T.inkSoft }}>
        <span className="cursor-pointer hover:underline" onClick={onVolver}>Empleados</span>
        <ChevronRight size={14} />
        <span className="font-bold" style={{ color: T.copper }}>{empEditar ? "Editar Empleado" : "Nuevo Empleado"}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Logo Vertical Color a la izquierda del texto en Formulario de Empleados */}
        <div className="rounded-3xl p-5 flex items-center gap-3.5 shadow-xs" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <LogoVerticalSmall height={38} />
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>
              {empEditar ? "Modificar Ficha de Empleado" : "Registro de Nuevo Empleado"}
            </h2>
            <p style={{ fontSize: 12.5, color: T.inkSoft }}>Formulario Oficial de Gestión de Personal Municipal</p>
          </div>
        </div>

        {/* Card 1: Información Personal */}
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Información Personal</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Rut *</label>
              <input
                required
                disabled={!!empEditar}
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 12.345.678-9"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Nombre *</label>
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingrese nombre"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Apellido *</label>
              <input
                required
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ingrese apellido"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Correo *</label>
              <input
                required
                type="text"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@empresa.cl"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: T.inkFaint }}>Tip de prueba: escribe &quot;juan.perez@empresa&quot; (sin .cl) para probar el Modal de Error de Validación.</p>
            </div>

            {/* Recuadro Carga de Imagen (Mockup 2) */}
            <div className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center" style={{ background: T.surfaceAlt, border: `1px dashed ${T.borderStrong}` }}>
              <img src={imagen} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm" />
              <button
                type="button"
                onClick={() => setImagen("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80")}
                className="px-3 py-1.5 rounded-xl text-[11.5px] font-bold"
                style={{ background: T.surface, color: T.copper, border: `1px solid ${T.border}` }}
              >
                Subir imagen
              </button>
              <span style={{ fontSize: 10, color: T.inkFaint }}>JPG, PNG. Máx 2MB</span>
            </div>
          </div>
        </div>

        {/* Card 2: Información Laboral */}
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Información Laboral</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Cargo *</label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              >
                <option value="Analista RRHH">Analista RRHH</option>
                <option value="Asistente">Asistente</option>
                <option value="Desarrollador">Desarrollador</option>
                <option value="Contador">Contador</option>
                <option value="Soporte TI">Soporte TI</option>
                <option value="Territorial OO.CC. 1">Territorial OO.CC. 1</option>
                <option value="Fiscalizador">Fiscalizador</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Departamento *</label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              >
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Aseo, Ornato y Medio Ambiente">Aseo y Ornato</option>
                <option value="Seguridad y Fiscalización">Seguridad y Fiscalización</option>
                <option value="DIDECO">DIDECO</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Fecha de Ingreso *</label>
              <input
                required
                type="date"
                value={fechaIngreso.includes('/') ? fechaIngreso.split('/').reverse().join('-') : fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: T.inkSoft }}>Estado *</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none font-bold"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: estado === "Activo" ? T.sage : T.red }}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones de acción formulario */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onVolver} className="px-6 py-3 rounded-2xl text-[13px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>
            Cancelar
          </button>
          <button type="submit" className="px-7 py-3 rounded-2xl text-[13px] font-bold shadow-md" style={{ background: T.copper, color: T.surface }}>
            Guardar
          </button>
        </div>
      </form>

      {/* Modals integrados */}
      {modalDuplicado && <ModalEmpleadoDuplicado T={T} emp={modalDuplicado} onClose={() => setModalDuplicado(null)} onVerRegistro={() => { onVolver(); }} />}
      {modalError && <ModalErrorValidacion T={T} emailInput={modalError} onClose={() => setModalError(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 4: CONSULTAR EMPLEADO (FICHA DETALLE)
--------------------------------------------------------------------- */
function PantallaConsultarEmpleado({ T, emp, onVolver }) {
  const [tabIndex, setTabIndex] = useState(0);

  if (!emp) return null;

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Top Header Mockup 4 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: T.inkSoft }}>
          <span className="cursor-pointer hover:underline" onClick={onVolver}>Empleados</span>
          <ChevronRight size={14} />
          <span>Consulta</span>
          <ChevronRight size={14} />
          <span className="font-bold" style={{ color: T.copper }}>Detalle</span>
        </div>

        <button onClick={onVolver} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>
          <ChevronLeft size={15} /> Volver al listado
        </button>
      </div>

      {/* Main Profile Card (Mockup 4 Screenshot) */}
      <div className="rounded-3xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        {/* Left Profile Summary */}
        <div className="flex flex-col items-center text-center p-5 rounded-2xl w-full md:w-56 shrink-0" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <img src={emp.imagen} alt="" className="w-24 h-24 rounded-full object-cover mb-3 shadow-md" style={{ border: `3px solid ${T.surface}` }} />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>{emp.nombre} {emp.apellido}</h2>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{emp.cargo}</p>
          <span className="mt-3 px-3 py-1 rounded-full text-[11.5px] font-bold" style={{ background: emp.estado === "Activo" ? T.sageSoft : T.redSoft, color: emp.estado === "Activo" ? T.sage : T.red }}>
            {emp.estado}
          </span>
        </div>

        {/* Right Info Grid */}
        <div className="flex-1 w-full flex flex-col gap-4">
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
            Información del Empleado
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-[13px]">
            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Rut:</span>
              <span className="font-mono font-bold" style={{ color: T.ink }}>{emp.rut}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Cargo:</span>
              <span>{emp.cargo}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Nombre:</span>
              <span>{emp.nombre}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Departamento:</span>
              <span>{emp.departamento}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Apellido:</span>
              <span>{emp.apellido}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Fecha de Ingreso:</span>
              <span>{emp.fechaIngreso}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Correo:</span>
              <span style={{ color: T.ocean, fontWeight: 600 }}>{emp.correo}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Estado:</span>
              <span className="font-bold" style={{ color: emp.estado === "Activo" ? T.sage : T.red }}>{emp.estado}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Teléfono:</span>
              <span>{emp.telefono || "+56 9 1234 5678"}</span>
            </div>

            <div>
              <span className="block font-bold" style={{ color: T.inkSoft, fontSize: 11.5 }}>Delegación Asignada:</span>
              <span>{emp.delegacion || "Centro"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Sección de Integración SGR (Sistema de Gestión de Resultados) */}
      <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
          <h3 className="flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600 }}>
            <ClipboardList size={18} color={T.copper} /> Desempeño y Registro SGR
          </h3>

          <div className="flex gap-1.5 rounded-full p-1" style={{ background: T.surfaceAlt }}>
            {["Ficha SGR", "Agenda SGR", "Evidencias"].map((t, i) => (
              <button key={t} onClick={() => setTabIndex(i)} className="px-3.5 py-1.5 rounded-full text-[11.5px] font-bold" style={{ background: tabIndex === i ? T.copper : "transparent", color: tabIndex === i ? T.surface : T.inkSoft }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tabIndex === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: T.surfaceAlt }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Meta Trimestral e Indicadores</p>
                <p style={{ fontSize: 11, color: T.inkFaint }}>Cumplimiento acumulado al día de hoy</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: T[`${emp.metasSGR ? emp.metasSGR.semaforo : "sage"}Soft`], color: T[emp.metasSGR ? emp.metasSGR.semaforo : "sage"] }}>
                  {emp.metasSGR ? emp.metasSGR.avance : 85}% Cumplimiento ({emp.metasSGR ? emp.metasSGR.ponderado : 21.25}% Ponderado)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ background: T.surfaceAlt }}>
                    <th className="text-left p-2.5">Item de Medición SGR</th>
                    <th className="text-left p-2.5">Ponderador</th>
                    <th className="text-left p-2.5">Meta</th>
                    <th className="text-left p-2.5">Avance Real</th>
                    <th className="text-left p-2.5">Semáforo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: `1px solid ${T.border}` }}>
                    <td className="p-2.5">Atención de usuarios y consultas presenciales</td>
                    <td className="p-2.5">25%</td>
                    <td className="p-2.5">40</td>
                    <td className="p-2.5 font-bold">36</td>
                    <td className="p-2.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: T.sage }} /></td>
                  </tr>
                  <tr style={{ borderTop: `1px solid ${T.border}` }}>
                    <td className="p-2.5">Reuniones y solicitudes comunitarias</td>
                    <td className="p-2.5">25%</td>
                    <td className="p-2.5">20</td>
                    <td className="p-2.5 font-bold">18</td>
                    <td className="p-2.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: T.sage }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabIndex === 1 && (
          <div className="flex flex-col gap-2">
            {emp.compromisos && emp.compromisos.length > 0 ? (
              emp.compromisos.map((c, i) => (
                <div key={i} className="p-3.5 rounded-2xl flex items-center justify-between text-[12.5px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <div>
                    <p className="font-bold">{c.actividad}</p>
                    <p style={{ fontSize: 11, color: T.inkFaint }}>Fecha comprometida: {c.fecha} · Territorio: {c.territorio}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: T.oceanSoft, color: T.ocean }}>
                    {c.estatus}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 12, color: T.inkFaint }}>No registra compromisos pendientes en la agenda colectiva SGR.</p>
            )}
          </div>
        )}

        {tabIndex === 2 && (
          <div className="flex flex-col gap-2">
            {emp.evidencias && emp.evidencias.length > 0 ? (
              emp.evidencias.map((ev, i) => (
                <div key={i} className="p-3.5 rounded-2xl flex items-center justify-between text-[12.5px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.surface, color: T.copper }}>
                      <ImageIcon size={16} />
                    </div>
                    <div>
                      <p className="font-mono font-bold">{ev.codigo}</p>
                      <p style={{ fontSize: 11, color: T.inkFaint }}>{ev.desc} · {ev.fecha}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: T.sageSoft, color: T.sage }}>
                    {ev.estatus}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 12, color: T.inkFaint }}>Sin evidencias cargadas.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 3: MODAL BUSCAR EMPLEADO
--------------------------------------------------------------------- */
function ModalBuscarEmpleado({ T, empleados, onClose, onSeleccionar, onSinCoincidencias }) {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [resultados, setResultados] = useState(empleados);

  const ejecutarBusqueda = () => {
    const res = empleados.filter((e) => {
      const matchRut = !rut || e.rut.toLowerCase().includes(rut.toLowerCase());
      const matchNombre = !nombre || `${e.nombre} ${e.apellido}`.toLowerCase().includes(nombre.toLowerCase());
      const matchCargo = !cargo || e.cargo === cargo;
      const matchEstado = estado === "Todos" || e.estado === estado;
      return matchRut && matchNombre && matchCargo && matchEstado;
    });

    if (res.length === 0) {
      onSinCoincidencias();
    } else {
      setResultados(res);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl rounded-3xl p-6 flex flex-col gap-5 shadow-2xl animate-fade-in" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        {/* Header Modal 3 */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-2.5">
            <LogoVerticalSmall height={30} />
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>
              Buscar Empleado
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
            <X size={16} />
          </button>
        </div>

        {/* Inputs Filtros Mockup 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold mb-1" style={{ color: T.inkSoft }}>Rut</label>
            <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="Ingrese rut" className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1" style={{ color: T.inkSoft }}>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ingrese nombre" className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1" style={{ color: T.inkSoft }}>Cargo</label>
            <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
              <option value="">Seleccione cargo</option>
              <option value="Analista RRHH">Analista RRHH</option>
              <option value="Asistente">Asistente</option>
              <option value="Desarrollador">Desarrollador</option>
              <option value="Contador">Contador</option>
              <option value="Soporte TI">Soporte TI</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1" style={{ color: T.inkSoft }}>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={ejecutarBusqueda} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12.5px] font-bold shadow-sm" style={{ background: T.copper, color: T.surface }}>
            <Search size={14} /> Buscar
          </button>
        </div>

        {/* Tabla Resultados Mockup 3 */}
        <div className="rounded-2xl overflow-hidden border max-h-60 overflow-y-auto" style={{ borderColor: T.border }}>
          <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                <th className="text-left p-3">Rut</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Cargo</th>
                <th className="text-left p-3">Departamento</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.rut} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="p-3 font-mono font-bold">{r.rut}</td>
                  <td className="p-3 font-bold">{r.nombre} {r.apellido}</td>
                  <td className="p-3">{r.cargo}</td>
                  <td className="p-3">{r.departamento}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: r.estado === "Activo" ? T.sageSoft : T.redSoft, color: r.estado === "Activo" ? T.sage : T.red }}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => onSeleccionar(r)} className="px-3 py-1 rounded-xl text-[11.5px] font-bold" style={{ background: T.copper, color: T.surface }}>
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 5: MODAL EMPLEADO DUPLICADO
--------------------------------------------------------------------- */
function ModalEmpleadoDuplicado({ T, emp, onClose, onVerRegistro }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl animate-scale-up" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
          <X size={14} />
        </button>

        {/* Icono Naranja Advertencia Mockup 5 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 shadow-inner" style={{ background: T.goldSoft, color: T.gold }}>
          <AlertTriangle size={32} />
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>Empleado Duplicado</h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>
            Ya existe un empleado registrado con el Rut ingresado.
          </p>
        </div>

        <div className="w-full rounded-2xl p-3.5 text-left text-[12.5px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div className="flex justify-between py-1 border-b" style={{ borderColor: T.border }}>
            <span style={{ color: T.inkSoft }}>Rut:</span>
            <span className="font-mono font-bold">{emp ? emp.rut : "12.345.678-9"}</span>
          </div>
          <div className="flex justify-between py-1 pt-2">
            <span style={{ color: T.inkSoft }}>Nombre:</span>
            <span className="font-bold">{emp ? emp.nombre : "Juan Pérez"}</span>
          </div>
        </div>

        <div className="flex gap-2.5 w-full mt-1">
          <button onClick={onVerRegistro} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.ink, border: `1px solid ${T.border}` }}>
            Ver Registro
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold shadow-sm" style={{ background: T.copper, color: T.surface }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 6: MODAL ERROR DE VALIDACIÓN
--------------------------------------------------------------------- */
function ModalErrorValidacion({ T, emailInput, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl animate-scale-up" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
          <X size={14} />
        </button>

        {/* Icono Rojo Cruz Mockup 6 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 shadow-inner" style={{ background: T.redSoft, color: T.red }}>
          <XCircle size={34} />
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>Error de Validación</h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>
            El correo electrónico ingresado no cumple con el formato válido.
          </p>
        </div>

        {/* Campo Destacado en Rojo (Mockup 6 Screenshot) */}
        <div className="w-full rounded-2xl p-3 text-center" style={{ background: T.redSoft, border: `1.5px solid ${T.red}` }}>
          <span className="font-mono text-[13px] font-bold" style={{ color: T.red }}>
            {emailInput || "juan.perez@empresa"}
          </span>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-2xl text-[13px] font-bold shadow-md mt-1" style={{ background: T.copper, color: T.surface }}>
          Aceptar
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 7: MODAL OPERACIÓN NO PERMITIDA (PROCESOS ACTIVOS)
--------------------------------------------------------------------- */
function ModalOperacionNoPermitida({ T, emp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl animate-scale-up" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
          <X size={14} />
        </button>

        {/* Icono Amarillo Info Mockup 7 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 shadow-inner" style={{ background: T.goldSoft, color: T.gold }}>
          <Info size={34} />
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>Operación No Permitida</h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>
            El empleado posee procesos activos asociados y no puede ser eliminado.
          </p>
        </div>

        {/* Cuadro de Procesos Activos (Mockup 7 Screenshot) */}
        <div className="w-full rounded-2xl p-4 text-left text-[12.5px] flex flex-col gap-2" style={{ background: "#FFFBEB", border: `1.5px solid #FCD34D`, color: "#92400E" }}>
          {emp && emp.procesos && emp.procesos.length > 0 ? (
            emp.procesos.map((p, i) => (
              <div key={i} className="flex items-center gap-2 font-semibold">
                <span>•</span> <span>{p}</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-2 font-semibold"><span>•</span> <span>Contrato vigente</span></div>
              <div className="flex items-center gap-2 font-semibold"><span>•</span> <span>Solicitud de vacaciones pendiente</span></div>
              <div className="flex items-center gap-2 font-semibold"><span>•</span> <span>Compromisos pendientes en agenda SGR</span></div>
            </>
          )}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-2xl text-[13px] font-bold shadow-md mt-1" style={{ background: T.copper, color: T.surface }}>
          Aceptar
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MOCKUP 8: MODAL SIN COINCIDENCIAS / SIN RESULTADOS
--------------------------------------------------------------------- */
function ModalSinResultados({ T, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl animate-scale-up" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceAlt }}>
          <X size={14} />
        </button>

        {/* Icono Lupa Azul Mockup 8 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 shadow-inner" style={{ background: T.oceanSoft, color: T.ocean }}>
          <Search size={34} />
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>Sin Resultados</h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>
            No se encontraron empleados que coincidan con los criterios de búsqueda.
          </p>
        </div>

        <button onClick={onClose} className="px-6 py-2.5 rounded-2xl text-[12.5px] font-bold shadow-sm mt-1" style={{ background: T.surfaceAlt, color: T.copper, border: `1px solid ${T.border}` }}>
          Nueva Búsqueda
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PESTAÑA DE ARTEFACTOS Y DIAGRAMAS (CLASES, REQUERIMIENTOS, DER)
--------------------------------------------------------------------- */
function PantallaDiagramasSGR({ T }) {
  const [subTab, setSubTab] = useState("CLASES");

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Arquitectura & Modelos SGR</h2>
          <p style={{ fontSize: 12.5, color: T.inkSoft }}>Inspección interactiva de diagramas y matriz de trazabilidad formal del proyecto.</p>
        </div>

        <div className="flex gap-1.5 rounded-full p-1 overflow-x-auto scrollbar-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          {[
            { id: "CLASES", label: "Diagrama Clases" },
            { id: "REQ", label: "Diagrama Requerimientos" },
            { id: "DER", label: "Modelo Entidad-Relación (DER)" },
            { id: "TRAZABILIDAD", label: "Matriz Trazabilidad" },
          ].map((t) => (
            <button key={t.id} onClick={() => setSubTab(t.id)} className="px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: subTab === t.id ? T.copper : "transparent", color: subTab === t.id ? T.surface : T.inkSoft }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === "CLASES" && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }} className="flex items-center gap-2">
            <GitBranch size={18} color={T.copper} /> Diagrama de Clases (UML SGR)
          </h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft }}>
            Estructura de clases del dominio SGR implementada en el sistema.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { name: "AuthUser", attrs: ["-id_auth: int", "-username: String", "-password: String", "-email: String", "-is_active: boolean"], methods: ["+iniciarSesion()", "+actualizarPassword()"] },
              { name: "Funcionario", attrs: ["-id_funcionario: int", "-identificador_institucional: String", "-estado: String"], methods: ["+obtenerPerfil()", "+consultarMetas()"] },
              { name: "Delegacion", attrs: ["-id_delegacion: int", "-nombre: String", "-estado: String", "-ambito: String"], methods: ["+obtenerFuncionarios()"] },
              { name: "Cargo", attrs: ["-id_cargo: int", "-nombre_cargo: String", "-descripcion: String"], methods: ["+obtenerCargos()"] },
              { name: "Periodo", attrs: ["-id_periodo: int", "-fecha_inicio: Date", "-fecha_termino: Date", "-dias_computables: int"], methods: ["+esActivo()", "+cerrarPeriodo()"] },
              { name: "ItemMedicion", attrs: ["-id_item: int", "-nombre_item: String", "-unidad_medida: String"], methods: ["+asociarCatalogo()"] },
              { name: "ConfiguracionMeta", attrs: ["-id_meta: int", "-valor_objetivo: float", "-ponderacion: float", "-umbral_minimo: float"], methods: ["+calcularAvance()", "+verificarCumplimiento()"] },
              { name: "Actividad", attrs: ["-id_actividad: int", "-codigo_evidencia_unico: String", "-fecha_actividad: Date", "-descripcion_solicitud: String"], methods: ["+registrarActividad()", "+asociarEvidencia()"] },
              { name: "Evidencia", attrs: ["-id_evidencia: int", "-ruta_archivo_url: String", "-metadatos: String"], methods: ["+subirArchivo()", "+obtenerUrl()"] },
              { name: "ValidacionEvidencia", attrs: ["-id_validacion: int", "-resultado: String", "-observaciones: String"], methods: ["+aprobarEvidencia()", "+rechazarEvidencia()"] },
              { name: "CompromisoAgenda", attrs: ["-id_compromiso: int", "-solicitante: String", "-territorio: String", "-fecha_comprometida: Date"], methods: ["+registrarCompromiso()", "+actualizarEstado()"] },
              { name: "AtencionSocialGestion", attrs: ["-id_gestion: int", "-numero_gestion: int", "-tipo_gestion: String"], methods: ["+validarLimiteTresGestiones()"] },
            ].map((cls, i) => (
              <div key={i} className="rounded-2xl p-4 flex flex-col gap-2 font-mono text-[11px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <div className="font-bold text-[13px] border-b pb-1 text-center" style={{ color: T.copper, borderColor: T.border }}>
                  «class» {cls.name}
                </div>
                <div className="flex flex-col gap-0.5" style={{ color: T.inkSoft }}>
                  {cls.attrs.map((a, j) => <div key={j}>{a}</div>)}
                </div>
                <div className="border-t pt-1 flex flex-col gap-0.5 font-semibold" style={{ color: T.sage, borderColor: T.border }}>
                  {cls.methods.map((m, j) => <div key={j}>{m}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "REQ" && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }} className="flex items-center gap-2">
            <Layers size={18} color={T.copper} /> Diagrama de Requerimientos (SysML)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              { id: "RQ-EP-REP", title: "Generar Tableros e Informes", reqs: ["RQ-RF028: Mostrar tableros personal y de delegación", "RQ-RNF002: Tiempo de respuesta <= 2 seg"] },
              { id: "RQ-EP-MED", title: "Calcular Desempeño y Semáforos", reqs: ["RQ-RF022: Calcular avance real y % cumplimiento", "RQ-RF026: Calcular meta esperada al día", "RQ-RF027: Mostrar semáforo diario (Verde/Ámbar/Rojo)"] },
              { id: "RQ-EP-AGENDA", title: "Gestionar Agenda Colectiva", reqs: ["RQ-RF016: Crear y asignar compromisos", "RQ-RF018: Transiciones Ingresado -> Pendiente -> En proceso -> Realizado", "RQ-RF019: Controlar plazos y vencimientos"] },
              { id: "RQ-EP-ACT", title: "Gestionar Actividades y Evidencias", reqs: ["RQ-RF009: Registrar actividad diaria", "RQ-RF011: Generar código único de evidencia inmutable", "RQ-RF012: Asociar evidencia fotográfica", "RQ-RF013: Validar evidencia (Verificador)", "RQ-RF014: Controlar puntuación por validación"] },
              { id: "RQ-EP-CONF", title: "Configurar Parámetros del Sistema", reqs: ["RQ-RF001: Administrar delegaciones y usuarios", "RQ-RF004: Configurar catálogos y períodos", "RQ-RF006: Configurar metas y ponderaciones (suma 100%)", "RQ-RNF005: Seguridad y Autorización por Rol"] }
            ].map((ep, i) => (
              <div key={i} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: T.border }}>
                  <span className="font-mono font-bold text-[12px]" style={{ color: T.copper }}>{ep.id}</span>
                  <span className="font-bold text-[13px]">{ep.title}</span>
                </div>
                <div className="flex flex-col gap-1 text-[12px]" style={{ color: T.inkSoft }}>
                  {ep.reqs.map((r, j) => (
                    <div key={j} className="flex items-start gap-1.5">
                      <span style={{ color: T.sage }}>✓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "DER" && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }} className="flex items-center gap-2">
            <Database size={18} color={T.copper} /> Modelo Entidad-Relación (DER / ERD MySQL)
          </h3>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {[
                { name: "AUTH_USER", pk: "id_auth INT", fields: ["username VARCHAR(150)", "password VARCHAR(128)", "email VARCHAR(254)", "is_active TINYINT(1)"] },
                { name: "FUNCIONARIO", pk: "id_funcionario INT", fields: ["id_auth INT (FK)", "identificador_institucional VARCHAR(20)", "id_delegacion INT (FK)", "id_cargo INT (FK)", "estado VARCHAR(20)"] },
                { name: "DELEGACION", pk: "id_delegacion INT", fields: ["nombre VARCHAR(100)", "estado VARCHAR(20)", "ambito VARCHAR(100)"] },
                { name: "CARGO", pk: "id_cargo INT", fields: ["nombre_cargo VARCHAR(100)", "descripcion TEXT"] },
                { name: "PERIODO", pk: "id_periodo INT", fields: ["fecha_inicio DATE", "fecha_termino DATE", "dias_computables INT", "estado VARCHAR(20)"] },
                { name: "ITEM_MEDICION", pk: "id_item INT", fields: ["id_cargo INT (FK)", "nombre_item VARCHAR(150)", "unidad_medida VARCHAR(50)"] },
                { name: "CONFIGURACION_META", pk: "id_meta INT", fields: ["id_item INT (FK)", "id_periodo INT (FK)", "id_funcionario INT (FK)", "valor_objetivo DECIMAL(10,2)", "ponderacion DECIMAL(5,2)"] },
                { name: "ACTIVIDAD", pk: "id_actividad INT", fields: ["codigo_evidencia_unico VARCHAR(50)", "fecha_actividad DATE", "id_funcionario INT (FK)", "id_item INT (FK)", "id_periodo INT (FK)"] },
                { name: "EVIDENCIA", pk: "id_evidencia INT", fields: ["id_actividad INT (FK)", "ruta_archivo_url VARCHAR(255)", "metadatos TEXT"] },
                { name: "VALIDACION_EVIDENCIA", pk: "id_validacion INT", fields: ["id_actividad INT (FK)", "id_verificador INT (FK)", "resultado VARCHAR(30)", "observaciones TEXT"] },
                { name: "COMPROMISO_AGENDA", pk: "id_compromiso INT", fields: ["solicitante VARCHAR(100)", "territorio VARCHAR(100)", "id_responsable INT (FK)", "fecha_comprometida DATE", "estado VARCHAR(30)"] }
              ].map((tbl, i) => (
                <div key={i} className="rounded-2xl p-4 font-mono text-[11px] flex flex-col gap-1.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <div className="font-bold text-[13px] border-b pb-1 flex items-center justify-between" style={{ color: T.copper, borderColor: T.border }}>
                    <span>{tbl.name}</span>
                    <Table size={13} />
                  </div>
                  <div className="font-bold" style={{ color: T.gold }}>PK: {tbl.pk}</div>
                  <div className="flex flex-col gap-0.5" style={{ color: T.inkSoft }}>
                    {tbl.fields.map((f, j) => <div key={j}>{f}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "TRAZABILIDAD" && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }} className="flex items-center gap-2">
            <Network size={18} color={T.copper} /> Mapa de Trazabilidad (Guía vs. Mockups)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, borderBottom: `1.5px solid ${T.border}` }}>
                  <th className="p-3 text-left">Caso de Uso</th>
                  <th className="p-3 text-left">Mockup / Prototipo Implementado</th>
                  <th className="p-3 text-left">Estado de Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cu: "Registrar Empleado", mockup: "Mockup 2: Pantalla Registro de Empleado", est: "Verificado" },
                  { cu: "Editar Empleado", mockup: "Mockup 2: Pantalla Modificar Empleado", est: "Verificado" },
                  { cu: "Eliminar Empleado", mockup: "Mockup 1 & 7: Eliminación y Restricción de Procesos", est: "Verificado" },
                  { cu: "Consultar Empleado", mockup: "Mockup 4: Pantalla Consulta de Empleados (Ficha Detalle)", est: "Verificado" },
                  { cu: "Buscar Empleado", mockup: "Mockup 3: Componente Reutilizable de Búsqueda", est: "Verificado" },
                  { cu: "Validar Datos de Empleado", mockup: "Mockup 6: Mensajes y Error de Validación Format de Correo", est: "Verificado" },
                  { cu: "Gestionar Error de Validación", mockup: "Mockup 6: Modal de Error", est: "Verificado" },
                  { cu: "Detectar Datos Incompletos", mockup: "Mockup 2 & 6: Mensajes de Campos Obligatorios", est: "Verificado" },
                  { cu: "Notificar Empleado Duplicado", mockup: "Mockup 5: Modal de Advertencia por RUT Duplicado", est: "Verificado" },
                  { cu: "Notificar Empleado con Procesos Activos", mockup: "Mockup 7: Modal de Restricción de Operación", est: "Verificado" },
                  { cu: "Consulta Sin Coincidencias", mockup: "Mockup 8: Mensaje de Búsqueda sin Resultados", est: "Verificado" },
                ].map((m, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td className="p-3 font-bold">{m.cu}</td>
                    <td className="p-3" style={{ color: T.ocean }}>{m.mockup}</td>
                    <td className="p-3">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: T.sageSoft, color: T.sage }}>
                        ✓ {m.est}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


function AdminPanel({ T, screen, setScreen, highlightId, contenidos, setContenidos, incidentes, setIncidentes }) {
  const [openKpi, setOpenKpi] = useState(null);
  const [empleados, setEmpleados] = useState(SEED_EMPLEADOS);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [subVista, setSubVista] = useState("LISTA"); // LISTA, NUEVO, EDITAR, DETALLE

  const tabs = [
    { id: "EMPLEADOS", label: "Gestión Empleados" },
    
    { id: "SGR", label: "Matriz SGR" },
    { id: "ASIGNACION", label: "Asignación" }, { id: "CUADRILLAS", label: "Trabajadores" }, { id: "E", label: "Anti-fraude" },
    { id: "F", label: "Auditoría calidad" }, { id: "G", label: "Crisis" }, { id: "IOT", label: "Sensores IoT" },
    { id: "USUARIOS", label: "Usuarios" }, { id: "CONTENIDO", label: "Noticias/alertas" }, { id: "PRESUPUESTO", label: "Presupuesto" },
    { id: "CONTROL", label: "Auditoría interna" }, { id: "REPORTES", label: "Reportes IA" }, { id: "SISTEMA", label: "Sistema" },
  ];
  const kpiCounts = { revision: 34, aceptados: 128, programados: 61, transito: 19, rechazados: 7, finalizados: 902, auditoria: 5 };

  return (
    <div className="pt-5 md:pt-7 flex flex-col gap-6">
      <section>
        <SectionTitle T={T}>Estado general de solicitudes</SectionTitle>
        <p style={{ fontSize: 11.5, color: T.inkFaint, marginTop: -8, marginBottom: 10 }}>Toca un estado para ver el listado completo</p>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2">
          {KPIS.map((k, i) => {
            const Icon = k.icon; const accent = T[k.key]; const accentSoft = T[`${k.key}Soft`]; return (
              <React.Fragment key={k.id}>
                <button onClick={() => setOpenKpi(k.id)} className="text-left rounded-3xl p-4 flex flex-col gap-2 shrink-0 w-[140px]" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accentSoft, color: accent }}><Icon size={15} /></div>
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, lineHeight: 1 }}>{kpiCounts[k.id]}</p>
                  <p style={{ fontSize: 11, color: T.inkSoft, fontWeight: 600 }}>{k.label}</p>
                </button>
                {i < KPIS.length - 1 && <ChevronRight size={16} color={T.inkFaint} className="shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Barra de Pestañas Multilínea y Visible (Flex-Wrap) */}
      <div className="rounded-3xl p-3 flex flex-wrap gap-2 w-full shadow-sm" style={{ background: T.surfaceAlt, border: `1.5px solid ${T.border}` }}>
        {tabs.map((t) => {
          const active = screen === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setScreen(t.id)}
              className="px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              style={{
                background: active ? T.copper : T.surface,
                color: active ? T.surface : T.inkSoft,
                border: `1.5px solid ${active ? T.copper : T.border}`,
                boxShadow: active ? "0 4px 14px rgba(196,18,48,0.22)" : "none"
              }}
            >
              {Icon && <Icon size={16} color={active ? T.surface : T.copper} />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {screen === "EMPLEADOS" && (
        <>
          {subVista === "LISTA" && (
            <PantallaGestionEmpleados
              T={T}
              empleados={empleados}
              setEmpleados={setEmpleados}
              onNuevo={() => { setEmpSeleccionado(null); setSubVista("NUEVO"); }}
              onVer={(emp) => { setEmpSeleccionado(emp); setSubVista("DETALLE"); }}
              onEditar={(emp) => { setEmpSeleccionado(emp); setSubVista("EDITAR"); }}
            />
          )}
          {subVista === "NUEVO" && (
            <PantallaRegistrarEmpleado
              T={T}
              empleados={empleados}
              setEmpleados={setEmpleados}
              empEditar={null}
              onVolver={() => setSubVista("LISTA")}
            />
          )}
          {subVista === "EDITAR" && (
            <PantallaRegistrarEmpleado
              T={T}
              empleados={empleados}
              setEmpleados={setEmpleados}
              empEditar={empSeleccionado}
              onVolver={() => setSubVista("LISTA")}
            />
          )}
          {subVista === "DETALLE" && (
            <PantallaConsultarEmpleado
              T={T}
              emp={empSeleccionado}
              onVolver={() => setSubVista("LISTA")}
            />
          )}
        </>
      )}
      
      {screen === "SGR" && <PantallaSGR T={T} highlightId={highlightId} />}
      {screen === "ASIGNACION" && <PantallaAsignacion T={T} highlightId={highlightId} />}
      {screen === "CUADRILLAS" && <PantallaCuadrillas T={T} highlightId={highlightId} />}
      {screen === "E" && <PantallaFraude T={T} highlightId={highlightId} />}
      {screen === "F" && <PantallaAuditoria T={T} highlightId={highlightId} />}
      {screen === "G" && <PantallaCrisis T={T} highlightId={highlightId} incidentes={incidentes} setIncidentes={setIncidentes} setContenidos={setContenidos} />}
      {screen === "IOT" && <PantallaIoT T={T} highlightId={highlightId} />}
      {screen === "USUARIOS" && <PantallaUsuarios T={T} highlightId={highlightId} />}
      {screen === "CONTENIDO" && <PantallaContenido T={T} highlightId={highlightId} contenidos={contenidos} setContenidos={setContenidos} />}
      {screen === "PRESUPUESTO" && <PantallaPresupuesto T={T} highlightId={highlightId} />}
      {screen === "CONTROL" && <PantallaControl T={T} highlightId={highlightId} />}
      {screen === "REPORTES" && <PantallaReportes T={T} highlightId={highlightId} />}
      {screen === "SISTEMA" && <PantallaSistema T={T} />}

      {openKpi && <ModalListado T={T} title={KPIS.find((k) => k.id === openKpi).label} onClose={() => setOpenKpi(null)} rows={SOLICITUDES_POR_ESTADO[openKpi] || []} />}
    </div>
  );
}

function ModalListado({ T, title, onClose, rows }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(12,20,18,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[540px] max-h-[80vh] overflow-y-auto rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4" style={{ background: T.surface }}>
        <div className="flex items-center justify-between"><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>{title} · listado completo</h3><button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt }}><X size={15} /></button></div>
        <div className="flex flex-col gap-2">
          {rows.length === 0 && <p style={{ fontSize: 13, color: T.inkSoft }}>No hay solicitudes en este estado.</p>}
          {rows.map((r, i) => (
            <div key={i} className="rounded-2xl p-3.5 flex items-center justify-between gap-3" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div><p style={{ fontSize: 13.5, fontWeight: 700 }}>N.º {r.id} · {r.vecino}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{r.depto}</p></div>
              <span style={{ fontSize: 11.5, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.fecha}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Asignación (con despacho autónomo) ---- */
function PantallaAsignacion({ T, highlightId }) {
  const [asignaciones, setAsignaciones] = useState({});
  const autoDespacho = () => {
    const nuevo = {};
    PENDIENTES_ASIGNACION.forEach((p, i) => { nuevo[p.id] = { w: WORKERS_PERFIL[i % WORKERS_PERFIL.length].nombre, f: "2026-09-04", h: "15:00", auto: true }; });
    setAsignaciones(nuevo);
  };
  return (
    <div className={`flex flex-col gap-3.5 ${highlightId === "asignacion-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between" style={{ background: `linear-gradient(120deg, ${T.copperInk}, ${T.copper})`, color: T.surface }}>
        <div><p style={{ fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Bolt size={17} /> Despacho automático por IA (Zero-Touch)</p><p style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>Evalúa habilidades, inventario, cercanía geográfica y prioridad social para armar la agenda en segundos.</p></div>
        <button onClick={autoDespacho} className="px-4 py-2.5 rounded-2xl text-[12.5px] font-bold whitespace-nowrap" style={{ background: T.surface, color: T.copperInk }}>Ejecutar despacho automático</button>
      </div>
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Solicitudes aceptadas, pendientes de asignar a una cuadrilla.</p>
      {PENDIENTES_ASIGNACION.map((p) => {
        const asignado = asignaciones[p.id];
        return (
          <div key={p.id} className="rounded-3xl p-5 flex flex-col md:flex-row md:items-center gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="md:w-56 shrink-0"><p style={{ fontSize: 13.5, fontWeight: 700 }}>N.º {p.id} · {p.vecino}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{p.depto}</p><p style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{p.direccion}</p></div>
            {!asignado ? (
              <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
                <select id={`w-${p.id}`} defaultValue="" className="rounded-xl px-3 py-2.5 text-[13px] flex-1" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
                  <option value="" disabled>Elegir trabajador</option>
                  {WORKERS_PERFIL.map((w) => <option key={w.rut} value={w.nombre}>{w.nombre} — {w.especialidad}</option>)}
                </select>
                <input id={`f-${p.id}`} type="date" defaultValue="2026-09-04" className="rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
                <input id={`h-${p.id}`} type="time" defaultValue="15:00" className="rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
                <button onClick={() => { const w = document.getElementById(`w-${p.id}`).value, f = document.getElementById(`f-${p.id}`).value, h = document.getElementById(`h-${p.id}`).value; if (w) setAsignaciones((s) => ({ ...s, [p.id]: { w, f, h } })); }} className="rounded-xl px-4 py-2.5 text-[12.5px] font-bold whitespace-nowrap" style={{ background: T.copper, color: T.surface }}>Asignar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 flex-1" style={{ background: T.sageSoft, color: T.sage }}><CheckCircle2 size={16} className="shrink-0" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{asignado.auto && "⚡ "}Asignado a {asignado.w} · {asignado.f} {asignado.h} hrs</span></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Trabajadores: rendimiento, asistencia, inventario, vehículo, amonestaciones ---- */
function FotoEvidencia({ T, label, verificada }) {
  return (
    <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ border: `1.5px solid ${T.border}` }}>
      <div className="h-28 flex items-center justify-center" style={{ background: T.surfaceAlt }}><ImageIcon size={26} color={T.inkFaint} /></div>
      <div className="p-2.5 flex flex-col gap-1.5">
        <span style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint }}>{label}</span>
        {verificada ? <span className="flex items-center gap-1 px-2 py-1 rounded-full w-fit" style={{ background: T.sageSoft, color: T.sage, fontSize: 10.5, fontWeight: 700 }}><CheckCircle2 size={11} /> Capturada en el momento</span>
          : <span className="flex items-center gap-1 px-2 py-1 rounded-full w-fit" style={{ background: T.goldSoft, color: T.gold, fontSize: 10.5, fontWeight: 700 }}><AlertTriangle size={11} /> Podría ser de galería</span>}
      </div>
    </div>
  );
}

function PantallaCuadrillas({ T, highlightId }) {
  const [detalle, setDetalle] = useState(null);
  return (
    <div className={`flex flex-col gap-4 ${highlightId === "cuadrillas-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Ficha de rendimiento, asistencia, inventario del vehículo y bandeja de descargos por trabajador.</p>

      {WORKERS_PERFIL.map((w) => (
        <div key={w.rut} className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <button onClick={() => setDetalle(detalle === w.rut ? null : w.rut)} className="w-full p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 13 }}>{initials(w.nombre)}</div>
              <div className="text-left">
                <p style={{ fontSize: 14, fontWeight: 700 }}>{w.nombre}</p>
                <p style={{ fontSize: 11.5, color: T.inkSoft }}>RUT {w.rut} · {w.especialidad}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: T.goldSoft, color: T.gold, fontSize: 11.5, fontWeight: 700 }}><Star size={11} fill={T.gold} /> {w.avgEstrellas}</span>
              {w.fatiga && <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: T.redSoft, color: T.red, fontSize: 11, fontWeight: 700 }}><Gauge size={11} /> Fatiga</span>}
              <ChevronRight size={17} color={T.inkFaint} style={{ transform: detalle === w.rut ? "rotate(90deg)" : "none" }} />
            </div>
          </button>

          {detalle === w.rut && (
            <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: `1px solid ${T.border}` }}>
              {w.fatiga && (
                <div className="rounded-2xl p-3.5 flex items-center gap-2.5 mt-4" style={{ background: T.redSoft, color: T.red }}><Gauge size={16} className="shrink-0" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Lleva {w.turno.horasConduccion}h conduciendo el camión tolva — se sugiere ordenar un relevo.</span></div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <MiniStat T={T} icon={Star} label="Promedio del mes" value={`${w.avgEstrellas}★`} />
                <MiniStat T={T} icon={Clock} label="Tiempo por tarea" value={w.tiempoPromedio} small />
                <MiniStat T={T} icon={CheckCircle2} label="Felicitaciones" value={w.felicitaciones} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Felicitaciones vs. amonestaciones</p>
                <div className="flex items-end gap-3 h-20">
                  <div className="flex flex-col items-center gap-1 flex-1"><div className="w-full rounded-t-lg" style={{ height: `${Math.min(70, w.felicitaciones * 3)}px`, background: T.sage }} /><span style={{ fontSize: 10.5, color: T.inkFaint }}>{w.felicitaciones} felic.</span></div>
                  <div className="flex flex-col items-center gap-1 flex-1"><div className="w-full rounded-t-lg" style={{ height: `${Math.max(6, w.amonestaciones * 20)}px`, background: T.red }} /><span style={{ fontSize: 10.5, color: T.inkFaint }}>{w.amonestaciones} amon.</span></div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Turno de hoy</p>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-xl p-2.5" style={{ background: T.surfaceAlt }}><p style={{ fontSize: 10, color: T.inkFaint }}>Inicio</p><p style={{ fontSize: 13, fontWeight: 700 }}>{w.turno.inicio}</p></div>
                  <div className="rounded-xl p-2.5" style={{ background: T.surfaceAlt }}><p style={{ fontSize: 10, color: T.inkFaint }}>Colación</p><p style={{ fontSize: 13, fontWeight: 700 }}>{w.turno.colacion}</p></div>
                  <div className="rounded-xl p-2.5" style={{ background: T.surfaceAlt }}><p style={{ fontSize: 10, color: T.inkFaint }}>Término</p><p style={{ fontSize: 13, fontWeight: 700 }}>{w.turno.termino}</p></div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Inventario del vehículo</p>
                <div className="rounded-2xl p-3.5 flex flex-col gap-2.5" style={{ background: T.surfaceAlt }}>
                  <p style={{ fontSize: 12, color: T.inkSoft }}>Herramientas: {w.inventario.herramientas.join(", ")}</p>
                  {w.inventario.materiales.map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1"><span style={{ fontSize: 12, fontWeight: 600 }}>{m.nombre}</span><span style={{ fontSize: 11.5, color: T.inkFaint }}>{m.actual} / {m.total}</span></div>
                      <Bar T={T} pct={(m.actual / m.total) * 100} color={m.actual / m.total < 0.2 ? T.red : T.copper} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Hoja de vida de conducción y vehículo</p>
                <div className="rounded-2xl p-3.5 flex flex-col gap-2.5" style={{ background: T.surfaceAlt }}>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>Patente {w.vehiculo.patente} · {w.vehiculo.km.toLocaleString("es-CL")} km · próxima mantención {w.vehiculo.mantencion}</p>
                  <div className="flex items-center gap-2"><Fuel size={14} color={T.inkFaint} /><Bar T={T} pct={w.vehiculo.combustible} color={T.ocean} /><span style={{ fontSize: 11, color: T.inkFaint }}>{w.vehiculo.combustible}%</span></div>
                </div>
              </div>

              {w.sancion && (
                <div>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Bandeja de respuesta a amonestaciones</p>
                  <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: T.redSoft }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: T.red }}>Carta enviada: {w.sancion.motivo}</p>
                    <p style={{ fontSize: 11, color: T.inkFaint }}>{w.sancion.fecha}</p>
                    <div className="rounded-xl p-3" style={{ background: T.surface }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft }}>Descargo del trabajador</p>
                      <p style={{ fontSize: 12.5, marginTop: 3 }}>&ldquo;{w.sancion.descargo}&rdquo;</p>
                      {w.sancion.evidencia && <span className="flex items-center gap-1 mt-2 text-[11px] font-bold" style={{ color: T.ocean }}><ImageIcon size={12} /> Foto adjunta del portón cerrado</span>}
                    </div>
                    <div className="flex gap-2"><button className="flex-1 px-3 py-2 rounded-xl text-[11.5px] font-bold" style={{ border: `1.5px solid ${T.sage}`, color: T.sage }}>Aceptar descargo</button><button className="flex-1 px-3 py-2 rounded-xl text-[11.5px] font-bold" style={{ background: T.red, color: T.surface }}>Mantener sanción</button></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <SectionTitle T={T}>Registro de tareas y evidencia</SectionTitle>
      {TRABAJOS.map((t, i) => (
        <div key={i} className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:justify-between">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 13 }}>{initials(t.trabajador)}</div><div><p style={{ fontSize: 14, fontWeight: 700 }}>{t.trabajador}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>RUT {t.rut}</p></div></div>
            <div className="text-left sm:text-right"><p style={{ fontSize: 12.5, fontWeight: 700 }}>{t.fecha} · {t.hora} hrs</p>{t.colaboradores.length > 0 && <p style={{ fontSize: 11.5, color: T.inkSoft }}>Con la ayuda de: {t.colaboradores.join(", ")}</p>}</div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{t.tarea}</p>
          <div className="flex gap-3"><FotoEvidencia T={T} label="ANTES" verificada={t.antesVerificada} /><FotoEvidencia T={T} label="DESPUÉS" verificada={t.despuesVerificada} /></div>
        </div>
      ))}
    </div>
  );
}
function MiniStat({ T, icon: Icon, label, value, warn, small }) {
  return (
    <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-1.5" style={{ color: warn ? T.red : T.inkFaint }}><Icon size={13} /><span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span></div>
      <span style={{ fontFamily: small ? FONT_BODY : FONT_DISPLAY, fontSize: small ? 13 : 20, fontWeight: small ? 700 : 600, color: warn ? T.red : T.ink }}>{value}</span>
    </div>
  );
}

/* ---- Anti-fraude ---- */
function PantallaFraude({ T, highlightId }) {
  return (
    <div className={`rounded-3xl overflow-hidden ${highlightId === "tabla-fraude" ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <div className="p-5 md:p-6 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${T.border}` }}><ShieldCheck size={19} color={T.copper} /><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Centro de control anti-fraude</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.surfaceAlt }}>{["RUT solicitante", "Beneficio", "Dirección", "Alerta de la IA", "Reincidencias", "Acciones"].map((h) => <th key={h} className="text-left px-5 py-3" style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {FRAUDE_ROWS.map((r, i) => {
              const sospechosa = !!r.alerta; const bloquear = r.reincidencias >= 3; return (
                <tr key={i} style={{ background: sospechosa ? T.redSoft : "transparent", borderTop: `1px solid ${T.border}` }}>
                  <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{r.rut}</td>
                  <td className="px-5 py-3.5" style={{ fontSize: 13, whiteSpace: "nowrap" }}>{r.beneficio}</td>
                  <td className="px-5 py-3.5" style={{ fontSize: 13, whiteSpace: "nowrap" }}>{r.direccion}</td>
                  <td className="px-5 py-3.5" style={{ fontSize: 12.5, minWidth: 220, color: sospechosa ? T.red : T.inkFaint }}>{sospechosa ? <span className="flex items-start gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {r.alerta}</span> : "Sin observaciones"}</td>
                  <td className="px-5 py-3.5">{sospechosa ? <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: bloquear ? T.redSoft : T.goldSoft, color: bloquear ? T.red : T.gold }}>{r.reincidencias}/3</span> : "—"}</td>
                  <td className="px-5 py-3.5">{sospechosa ? (
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ border: `1.5px solid ${T.gold}`, color: T.gold }}>Aprobar por excepción</button>
                      {bloquear ? <button className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ background: T.red, color: T.surface }}>Rechazar y bloquear</button> : <button className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ border: `1.5px solid ${T.red}`, color: T.red }}>Rechazar</button>}
                    </div>
                  ) : <span style={{ fontSize: 11.5, color: T.sage, fontWeight: 700 }}>Validada</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: T.inkFaint, padding: "12px 20px" }}>Con menos de 3 reincidencias solo se ofrece “Rechazar”; desde 3 reincidencias se habilita además “Rechazar y bloquear”.</p>
    </div>
  );
}

function PantallaAuditoria({ T, highlightId }) {
  return (
    <div className={`flex flex-col gap-4 ${highlightId === "bandeja-auditoria" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 w-fit" style={{ background: T.redSoft, color: T.red }}><Lock size={16} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Bandeja privada — visible solo para supervisores</span></div>
      {QUEJAS.map((q, i) => (
        <div key={i} className="rounded-3xl p-5 flex flex-col md:flex-row gap-4 md:items-center" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="flex items-center gap-3 md:w-56 shrink-0"><div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 13 }}>{initials(q.func)}</div><div><p style={{ fontSize: 13.5, fontWeight: 700 }}>{q.func}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{q.depto}</p></div></div>
          <div className="flex-1"><div className="flex gap-0.5 mb-1.5">{Array.from({ length: 5 }, (_, s) => <Star key={s} size={13} color={T.gold} fill={s < q.rating ? T.gold : "transparent"} />)}</div><p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.4 }}>“{q.comentario}”</p></div>
          <button className="px-4 py-2.5 rounded-2xl text-[12.5px] font-bold whitespace-nowrap shrink-0" style={{ background: T.red, color: T.surface }}>Iniciar amonestación / investigar</button>
        </div>
      ))}
    </div>
  );
}

function PantallaCrisis({ T, highlightId, incidentes, setIncidentes, setContenidos }) {
  const publicar = (idx) => {
    const inc = incidentes[idx];
    setContenidos((c) => [{ tipo: "Alerta", tag: "red", titulo: `Alerta: ${inc.tipo} en ${inc.lugar}`, cuerpo: "Equipos municipales atendiendo la emergencia. Se recomienda precaución en el sector.", autor: "Panel de Crisis" }, ...c]);
    setIncidentes((arr) => arr.map((it, i) => (i === idx ? { ...it, publicado: true } : it)));
  };
  return (
    <div className={`flex flex-col gap-4 ${highlightId === "mapa-crisis" ? "copilot-pulse rounded-3xl" : ""}`}>
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Los incidentes se generan cuando el Copiloto IA detecta palabras de emergencia en una solicitud, cuando un sensor municipal reporta una falla, o cuando una cuadrilla los carga en terreno.</p>
      <div className="rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row gap-5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="relative flex-1 rounded-3xl h-72 md:h-96 overflow-hidden" style={{ background: `repeating-linear-gradient(0deg, ${T.bgAlt}, ${T.bgAlt} 27px, transparent 27px, transparent 28px), repeating-linear-gradient(90deg, ${T.bgAlt}, ${T.bgAlt} 27px, transparent 27px, transparent 28px), ${T.surfaceAlt}`, border: `1.5px solid ${T.border}` }}>
          {incidentes.map((inc, i) => {
            const accent = T[inc.key]; const Icon = inc.icon; return (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: inc.top, left: inc.left }}><div className="blink-dot w-4 h-4 rounded-full" style={{ background: accent }} /><div className="absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.surface, border: `1.5px solid ${accent}`, color: accent }}><Icon size={12} /></div></div>
            );
          })}
        </div>
        <div className="lg:w-80 shrink-0 flex flex-col gap-2.5">
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600 }}>Incidentes activos</p>
          {incidentes.map((inc, i) => {
            const accent = T[inc.key]; const Icon = inc.icon; const fuente = FUENTE_LABEL[inc.fuente]; const FIcon = fuente.icon; return (
              <div key={i} className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.surface, color: accent }}><Icon size={16} /></div><div className="flex-1 min-w-0"><p style={{ fontSize: 13, fontWeight: 700 }}>{inc.tipo}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{inc.lugar}</p></div></div>
                <p className="flex items-center gap-1.5" style={{ fontSize: 10.5, color: T.inkFaint }}><FIcon size={11} /> {fuente.texto}</p>
                <button onClick={() => publicar(i)} disabled={inc.publicado} className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-bold" style={{ background: inc.publicado ? T.sageSoft : T.copper, color: inc.publicado ? T.sage : T.surface }}><Bell size={12} /> {inc.publicado ? "Publicada como alerta" : "Publicar alerta a vecinos"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Sensores IoT / satelital ---- */
function PantallaIoT({ T, highlightId }) {
  return (
    <div className={`flex flex-col gap-3.5 ${highlightId === "iot-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Capa de sensores IoT municipales: contenedores de basura y sensores de caudal conectados en tiempo real.</p>
      {SENSORES.map((s, i) => {
        const Icon = s.icon; const accent = T[s.key]; const accentSoft = T[`${s.key}Soft`]; return (
          <div key={i} className="rounded-3xl p-4 flex items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accentSoft, color: accent }}><Icon size={20} /></div>
            <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{s.tipo} — {s.lugar}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{s.estado}</p><div className="mt-1.5 max-w-[220px]"><Bar T={T} pct={s.nivel} color={accent} /></div></div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: accent }}>{s.nivel}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Usuarios ---- */
function Switch({ T, on, color }) { const c = color || T.sage; return <div className="w-10 h-6 rounded-full flex items-center px-0.5 shrink-0" style={{ background: on ? c : T.border, justifyContent: on ? "flex-end" : "flex-start" }}><div className="w-5 h-5 rounded-full" style={{ background: T.surface }} /></div>; }
function PantallaUsuarios({ T, highlightId }) {
  const [orden, setOrden] = useState(false);
  const [manual, setManual] = useState(SEED_USERS.map((u) => u.bloqueoManual));
  const lista = orden ? [...SEED_USERS].sort((a, b) => prioridadScore(b) - prioridadScore(a)) : SEED_USERS;
  return (
    <div className={`flex flex-col gap-4 ${highlightId === "usuarios-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <p style={{ fontSize: 12.5, color: T.inkSoft, maxWidth: 480 }}>Ficha de cada vecino para prevenir fraude, priorizar ayuda social y controlar deudas municipales.</p>
        <button onClick={() => setOrden((v) => !v)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold whitespace-nowrap" style={{ background: orden ? T.copper : T.surfaceAlt, color: orden ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}><ArrowUpDown size={14} /> Ordenar por prioridad social</button>
      </div>
      {lista.map((u) => {
        const idx = SEED_USERS.indexOf(u); const bloqueado = u.bloqueoAuto || manual[idx]; return (
          <div key={u.rut} className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${bloqueado ? T.red : T.border}` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 13 }}>{initials(u.nombre)}</div><div><p style={{ fontSize: 14, fontWeight: 700 }}>{u.nombre}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>RUT {u.rut} · {u.direccion}</p></div></div>
              {bloqueado && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ background: T.redSoft, color: T.red, fontSize: 11, fontWeight: 700 }}><Ban size={12} /> {u.bloqueoAuto ? "Lista negra automática" : "Bloqueado manualmente"}</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MiniStat T={T} icon={ClipboardList} label="Solicitudes cerradas" value={u.cerradas} />
              <MiniStat T={T} icon={XCircle} label="Canceladas / reprog. última hora" value={u.canceladas} warn={u.canceladas >= 3} />
              <MiniStat T={T} icon={Home} label="Tramo RSH" value={`${u.rsh}%`} />
              <div className="rounded-2xl p-3 flex items-center justify-between gap-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}><span style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft }}>Bloqueo manual</span><button onClick={() => setManual((arr) => arr.map((v, i) => (i === idx ? !v : v)))}><Switch T={T} on={manual[idx]} color={T.red} /></button></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {u.adultoMayor && <TagChip T={T} icon={UserCheck} text="Adulto mayor en el hogar" color="ocean" />}
              {u.postrado && <TagChip T={T} icon={Info} text="Persona postrada" color="red" />}
              {u.ninos && <TagChip T={T} icon={Users} text="Niños en el hogar" color="sage" />}
              {u.deudas.map((d, i) => <TagChip key={i} T={T} icon={Receipt} text={d} color="gold" />)}
              {u.deudas.length === 0 && !u.adultoMayor && !u.postrado && !u.ninos && <span style={{ fontSize: 11.5, color: T.inkFaint }}>Sin indicadores adicionales</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function TagChip({ T, icon: Icon, text, color }) { const accent = T[color]; const accentSoft = T[`${color}Soft`]; return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: accentSoft, color: accent, fontSize: 11, fontWeight: 700 }}><Icon size={12} /> {text}</span>; }

/* ---- Contenido: noticias y alertas ---- */
function PantallaContenido({ T, highlightId, contenidos, setContenidos }) {
  const [tipo, setTipo] = useState("Noticia"); const [titulo, setTitulo] = useState(""); const [cuerpo, setCuerpo] = useState("");
  const publicar = () => { if (!titulo.trim() || !cuerpo.trim()) return; setContenidos((c) => [{ tipo, tag: tipo === "Alerta" ? "red" : "ocean", titulo, cuerpo, autor: "Tú (equipo municipal)" }, ...c]); setTitulo(""); setCuerpo(""); };
  return (
    <div className={`flex flex-col gap-5 ${highlightId === "contenido-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <p style={{ fontSize: 12.5, color: T.inkSoft, maxWidth: 560 }}>Aquí el equipo municipal redacta las noticias y alertas que ven los vecinos. Las alertas también pueden publicarse con un clic desde el Panel de Crisis.</p>
      <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="flex gap-1.5">{["Noticia", "Alerta"].map((op) => <button key={op} onClick={() => setTipo(op)} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold" style={{ background: tipo === op ? T.copper : T.surfaceAlt, color: tipo === op ? T.surface : T.inkSoft }}>{op}</button>)}</div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={3} placeholder="Cuerpo del mensaje" className="rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none resize-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
        <button onClick={publicar} className="self-start flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-bold" style={{ background: T.copper, color: T.surface }}><Plus size={14} /> Publicar a vecinos</button>
      </div>
      <div className="flex flex-col gap-2.5">{contenidos.map((n, i) => {
        const accent = T[n.tag]; const accentSoft = T[`${n.tag}Soft`]; return (
          <div key={i} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0" style={{ background: accentSoft, color: accent }}>{n.tipo}</span>
            <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{n.titulo}</p><p style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{n.cuerpo}</p><p style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 4 }}>Publicado por {n.autor}</p></div>
          </div>
        );
      })}</div>
    </div>
  );
}

/* ---- Presupuesto / simulador ---- */
function PantallaPresupuesto({ T, highlightId }) {
  const [bodega, setBodega] = useState(BODEGA_SEED);
  const simular = () => setBodega((arr) => arr.map((b, i) => (i === 0 ? { ...b, actual: Math.max(0, b.actual - 50) } : b)));
  return (
    <div className={`flex flex-col gap-6 ${highlightId === "presupuesto-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <section>
        <SectionTitle T={T}>Presupuesto ejecutado por dirección</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESUPUESTO.map((p, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
              <div className="flex justify-between mb-1.5"><span style={{ fontSize: 13, fontWeight: 700 }}>{p.depto}</span><span style={{ fontSize: 12, color: T.inkFaint }}>{p.ejecutado}% ejecutado</span></div>
              <Bar T={T} pct={p.ejecutado} color={T[p.key]} height={10} />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-3.5"><SectionTitle T={T} noMargin>Bodega municipal central</SectionTitle><button onClick={simular} className="px-3.5 py-2 rounded-full text-[11.5px] font-bold" style={{ background: T.copper, color: T.surface }}>Simular aprobación de 50 sacos de arena</button></div>
        <div className="flex flex-col gap-3">
          {bodega.map((b, i) => {
            const pct = (b.actual / b.total) * 100; const alerta = pct <= 15; return (
              <div key={i} className="rounded-2xl p-4" style={{ background: T.surface, border: `1.5px solid ${alerta ? T.red : T.border}` }}>
                <div className="flex justify-between mb-1.5"><span style={{ fontSize: 13, fontWeight: 700 }}>{b.nombre}</span><span style={{ fontSize: 12, color: alerta ? T.red : T.inkFaint, fontWeight: alerta ? 700 : 500 }}>{b.actual} / {b.total} {alerta && "· stock bajo"}</span></div>
                <Bar T={T} pct={pct} color={alerta ? T.red : T[b.key]} height={10} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---- Auditoría interna (anticorrupción) ---- */
function PantallaControl({ T, highlightId }) {
  return (
    <div className={`rounded-3xl overflow-hidden ${highlightId === "control-card" ? "copilot-pulse" : ""}`} style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <div className="p-5 md:p-6 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${T.border}` }}><Lock size={18} color={T.copper} /><div><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Registro de auditoría interna</h3><p style={{ fontSize: 11.5, color: T.inkFaint }}>Registro imborrable de "quién hizo qué" — cada acción queda firmada con un hash único.</p></div></div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.surfaceAlt }}>{["Fecha y hora", "Funcionario", "Acción", "Firma (hash)"].map((h) => <th key={h} className="text-left px-5 py-3" style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>{CONTROL_LOG.map((l, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
              <td className="px-5 py-3.5" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{l.fecha}</td>
              <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{l.actor}</td>
              <td className="px-5 py-3.5" style={{ fontSize: 12.5 }}>{l.accion}</td>
              <td className="px-5 py-3.5" style={{ fontSize: 11, fontFamily: "monospace", color: T.inkFaint, whiteSpace: "nowrap" }}>{l.hash}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- Reportes IA ---- */
function PantallaReportes({ T, highlightId }) {
  const [generado, setGenerado] = useState(false);
  return (
    <div className={`flex flex-col gap-5 items-center text-center py-6 ${highlightId === "reportes-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <FileText size={30} color={T.copper} />
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Constructor de Reportes Ejecutivos</h2>
      <p style={{ fontSize: 13, color: T.inkSoft, maxWidth: 460 }}>La IA toma solicitudes aprobadas, tiempos de respuesta, felicitaciones de vecinos y ahorros de combustible, y redacta dos informes listos para el Concejo Municipal.</p>
      <button onClick={() => setGenerado(true)} className="px-6 py-4 rounded-2xl font-bold text-[15px]" style={{ background: T.copper, color: T.surface }}>Generar Cuenta Pública Mensual con IA</button>
      {generado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg mt-2">
          <div className="rounded-3xl p-5 flex flex-col items-center gap-2.5 text-center" style={{ background: T.sageSoft }}>
            <FileText size={24} color={T.sage} /><p style={{ fontSize: 13.5, fontWeight: 700, color: T.sage }}>Informe de Logros</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>Solicitudes resueltas, felicitaciones y ahorros</p>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11.5px] font-bold" style={{ background: T.sage, color: T.surface }}><Download size={13} /> Descargar PDF</button>
          </div>
          <div className="rounded-3xl p-5 flex flex-col items-center gap-2.5 text-center" style={{ background: T.redSoft }}>
            <FileText size={24} color={T.red} /><p style={{ fontSize: 13.5, fontWeight: 700, color: T.red }}>Informe de Incidencias</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>Reclamos, retrasos y solicitudes rechazadas</p>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11.5px] font-bold" style={{ background: T.red, color: T.surface }}><Download size={13} /> Descargar PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Matriz SGR: Seguimiento de Gestión y Resultados ---- */
function PantallaSGR({ T, highlightId }) {
  const [tab, setTab] = useState("RESUMEN");
  const tabs = [
    { id: "RESUMEN", label: "Resumen delegación" }, { id: "PERSONAL", label: "Pestaña personal" },
    { id: "TUBO", label: "Tubo de trabajo" }, { id: "SEMAFORO", label: "Semáforo" },
  ];
  return (
    <div className={`flex flex-col gap-5 ${highlightId === "sgr-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: T.copperSoft }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><ClipboardList size={20} /></div>
          <div>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.copperInk }}>Matriz SGR — Seguimiento de Gestión y Resultados</p>
            <p style={{ fontSize: 11.5, color: T.inkSoft }}>Período {SGR_PERIODO.inicio} al {SGR_PERIODO.termino} · Cumplimiento mínimo exigido {SGR_CUMPLIMIENTO_MINIMO}%</p>
          </div>
        </div>
        <div className="text-center sm:text-right shrink-0">
          <p style={{ fontSize: 10, color: T.copperInk, fontWeight: 700, letterSpacing: 0.3 }}>AVANCE ESPERADO AL {SGR_PERIODO.hoy}</p>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: T.copperInk }}>{((SGR_PERIODO.diasTranscurridos / SGR_PERIODO.dias) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl p-2 w-full" style={{ background: T.surfaceAlt, border: `1.5px solid ${T.border}` }}>
        {tabs.map((t) => { const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap" style={{ background: active ? T.copper : T.surface, color: active ? T.surface : T.inkSoft, border: `1px solid ${active ? T.copper : T.border}` }}>{t.label}</button>; })}
      </div>

      {tab === "RESUMEN" && <SGRResumen T={T} />}
      {tab === "PERSONAL" && <SGRPersonal T={T} />}
      {tab === "TUBO" && <SGRTubo T={T} />}
      {tab === "SEMAFORO" && <SGRSemaforo T={T} />}
    </div>
  );
}
function SGRResumen({ T }) {
  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Visión global de la delegación: fecha del último ingreso, días sin registrar actividad, cantidad de ingresos y promedio diario por funcionario.</p>
      <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surfaceAlt }}>{["Área", "Responsable", "Avance", "Estado", "Último ingreso", "Días sin ingresar", "N.º ingresos", "Ingresos/día"].map((h) => <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10.5, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{SGR_RESUMEN_DELEGACION.map((r, i) => {
              const color = sgrSemaforoColor(r.avance, SGR_META_DELEGACION.meta); return (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3" style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{r.area}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkSoft, whiteSpace: "nowrap" }}>{r.responsable}</td>
                  <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: T[color] }}>{r.avance.toFixed(1)}%</td>
                  <td className="px-4 py-3"><span className="inline-block w-3 h-3 rounded-full" style={{ background: T[color] }} /></td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.ultimoIngreso}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: r.diasSinIngreso > 0 ? T.red : T.inkFaint, fontWeight: r.diasSinIngreso > 0 ? 700 : 500 }}>{r.diasSinIngreso}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12 }}>{r.nIngresos}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12 }}>{r.ingresosDiarios}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <div><p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Meta según avance del día</p><p style={{ fontSize: 12, color: T.inkFaint }}>{SGR_PERIODO.diasTranscurridos} de {SGR_PERIODO.dias} días transcurridos</p></div>
        <div className="text-right"><p style={{ fontSize: 11, color: T.inkFaint }}>Meta {SGR_META_DELEGACION.meta}%</p><p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: T.sage }}>{SGR_META_DELEGACION.logrado}% logrado</p></div>
      </div>
    </div>
  );
}
function SGRPersonal({ T }) {
  const [abierto, setAbierto] = useState(null);
  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Cada funcionario se mide por ítem: ponderador (peso de la tarea), meta trimestral, avance logrado y cumplimiento ponderado.</p>
      {SGR_FUNCIONARIOS.map((f, i) => {
        const { filas, total } = sgrCumplimientoFuncionario(f); const bajoMinimo = total < SGR_CUMPLIMIENTO_MINIMO; return (
          <div key={i} className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <button onClick={() => setAbierto(abierto === i ? null : i)} className="w-full p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 13 }}>{initials(f.nombre)}</div>
                <div className="text-left"><p style={{ fontSize: 14, fontWeight: 700 }}>{f.nombre}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{f.cargo} · Delegación {f.delegacion}</p></div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-full" style={{ background: bajoMinimo ? T.redSoft : T.sageSoft, color: bajoMinimo ? T.red : T.sage, fontSize: 12, fontWeight: 700 }}>{total.toFixed(1)}%</span>
                <ChevronRight size={17} color={T.inkFaint} style={{ transform: abierto === i ? "rotate(90deg)" : "none" }} />
              </div>
            </button>
            {abierto === i && (
              <div className="px-5 pb-5" style={{ borderTop: `1px solid ${T.border}` }}>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full" style={{ borderCollapse: "collapse" }}>
                    <thead><tr>{["Ítem", "Ponderador", "Meta", "Avance", "% cumpl.", "Ponderado"].map((h) => <th key={h} className="text-left pb-2 pr-3" style={{ fontSize: 10.5, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                    <tbody>{filas.map((it, j) => (
                      <tr key={j} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td className="py-2 pr-3" style={{ fontSize: 12 }}>{it.item}</td>
                        <td className="py-2 pr-3" style={{ fontSize: 12, color: T.inkFaint }}>{it.ponderador}%</td>
                        <td className="py-2 pr-3" style={{ fontSize: 12, color: T.inkFaint }}>{it.esPct ? `${it.meta}%` : it.meta}</td>
                        <td className="py-2 pr-3" style={{ fontSize: 12, color: T.inkFaint }}>{it.esPct ? `${it.avance}%` : it.avance}</td>
                        <td className="py-2 pr-3" style={{ fontSize: 12, fontWeight: 700, color: it.pct >= 100 ? T.sage : it.pct >= 60 ? T.gold : T.red }}>{it.pct.toFixed(0)}%</td>
                        <td className="py-2 pr-3" style={{ fontSize: 12, fontWeight: 700 }}>{it.ponderado.toFixed(1)}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="mt-3"><Bar T={T} pct={total} color={bajoMinimo ? T.red : T.sage} height={10} /></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function SGRTubo({ T }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      <div className="p-4" style={{ borderBottom: `1px solid ${T.border}` }}><p style={{ fontSize: 12, color: T.inkSoft }}>Agenda colectiva de compromisos a futuro: cada solicitud cambia de estado — Ingresado → Pendiente → En proceso → Realizado — para que cualquier funcionario pueda hacer seguimiento.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.surfaceAlt }}>{["Fecha", "Actividad / solicitud", "Territorio", "Responsable", "Compromiso", "Área", "Estado"].map((h) => <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10.5, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>{SGR_TUBO.map((r, i) => {
            const color = SGR_ESTATUS_COLOR[r.estatus] || "gold"; return (
              <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.fecha}</td>
                <td className="px-4 py-3" style={{ fontSize: 12.5, maxWidth: 260 }}>{r.actividad}<span style={{ fontSize: 10.5, color: T.inkFaint }}> · {r.tipo}</span></td>
                <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.territorio}</td>
                <td className="px-4 py-3" style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{r.responsable}</td>
                <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.compromiso}</td>
                <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.area}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full inline-block" style={{ background: T[`${color}Soft`], color: T[color], fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{r.estatus}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
function SGRSemaforo({ T }) {
  const promedio = SGR_SEMAFORO.reduce((a, r) => a + r.avance, 0) / SGR_SEMAFORO.length;
  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>El semáforo muestra el cumplimiento al día de cada funcionario respecto de la meta trimestral (100% en {SGR_PERIODO.dias} días).</p>
      <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surfaceAlt }}>{["Área", "Responsable", "Objetivo al día", "Avance", "Estado"].map((h) => <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10.5, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{SGR_SEMAFORO.map((r, i) => {
              const color = sgrSemaforoColor(r.avance, r.objetivo); return (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3" style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{r.area}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkSoft, whiteSpace: "nowrap" }}>{r.responsable}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint }}>{r.objetivo.toFixed(1)}%</td>
                  <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: T[color] }}>{r.avance.toFixed(1)}%</td>
                  <td className="px-4 py-3"><span className="inline-block w-3.5 h-3.5 rounded-full" style={{ background: T[color] }} /></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <div><p style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Promedio general del semáforo</p><p style={{ fontSize: 12, color: T.inkFaint }}>Meta al día: {SGR_META_DELEGACION.meta}% · Cumplimiento mínimo {SGR_CUMPLIMIENTO_MINIMO}%</p></div>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: T[sgrSemaforoColor(promedio, SGR_META_DELEGACION.meta)] }}>{promedio.toFixed(1)}%</p>
      </div>
    </div>
  );
}

/* ---- Escudos finales del sistema ---- */
function PantallaSistema({ T }) {
  const items = [
    { icon: WifiOff, titulo: "Modo de operación offline", desc: "Activo — 3 trabajadores en terreno sincronizando datos guardados sin señal.", color: "ocean" },
    { icon: Fingerprint, titulo: "Autenticación biométrica", desc: "Habilitada en la App móvil (FaceID / huella) con cifrado de extremo a extremo.", color: "sage" },
    { icon: Cloud, titulo: "Respaldo híbrido", desc: "Nube (AWS/Azure) + respaldo automático cada hora en servidores municipales. Última sincronización: hace 12 min.", color: "gold" },
  ];
  return (
    <div className="flex flex-col gap-3.5 max-w-2xl">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Componentes invisibles para el vecino, vitales para la resiliencia y seguridad de la plataforma.</p>
      {items.map((it, i) => {
        const Icon = it.icon; const accent = T[it.color]; const accentSoft = T[`${it.color}Soft`]; return (
          <div key={i} className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accentSoft, color: accent }}><Icon size={22} /></div>
            <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 700 }}>{it.titulo}</p><p style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{it.desc}</p></div>
            <Server size={16} color={T.inkFaint} className="hidden sm:block" />
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------
   PANEL DEL ALCALDE
--------------------------------------------------------------------- */
function AlcaldePanel({ T }) {
  const [tab, setTab] = useState(DEPTS_HEADS[0]);
  const [chats, setChats] = useState(CHAT_SEED);
  const [msg, setMsg] = useState("");
  const total = PRESUPUESTO.reduce((s, p) => s + p.ejecutado, 0);
  let acumulado = 0;

  const enviar = () => { if (!msg.trim()) return; setChats((c) => ({ ...c, [tab]: [...c[tab], { from: "alcalde", texto: msg }] })); setMsg(""); };

  return (
    <div className="pt-5 md:pt-7 flex flex-col gap-8">
      <section>
        <SectionTitle T={T}>Dashboard macro de la comuna</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}><p style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 700 }}>Tiempo promedio de respuesta</p><p style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, marginTop: 4 }}>2,4 días</p></div>
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}><p style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 700 }}>Solicitudes resueltas este mes</p><p style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, marginTop: 4 }}>87%</p></div>
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}><p style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 700 }}>Satisfacción vecinal</p><p style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, marginTop: 4 }}>4,3 ★</p></div>
        </div>
      </section>

      <section>
        <SectionTitle T={T}>Presupuesto ejecutado por Dirección</SectionTitle>
        <div className="rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-7" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="w-40 h-40 rounded-full shrink-0" style={{ background: `conic-gradient(${PRESUPUESTO.map((p) => { const start = (acumulado / total) * 360; acumulado += p.ejecutado; const end = (acumulado / total) * 360; return `${T[p.key]} ${start}deg ${end}deg`; }).join(", ")})` }} />
          <div className="flex-1 flex flex-col gap-2 w-full">
            {PRESUPUESTO.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: T[p.key] }} /><span style={{ fontSize: 12.5, flex: 1 }}>{p.depto}</span><span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>{Math.round((p.ejecutado / total) * 100)}%</span></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle T={T}>Canal de comunicación con Jefes de Departamento</SectionTitle>
        <div className="rounded-3xl overflow-hidden flex flex-col" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 420 }}>
          <div className="flex gap-1.5 p-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            {DEPTS_HEADS.map((d) => <button key={d} onClick={() => setTab(d)} className="px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: tab === d ? T.copper : T.surfaceAlt, color: tab === d ? T.surface : T.inkSoft }}>{d}</button>)}
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {chats[tab].map((m, i) => (
              <div key={i} className="max-w-[75%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: m.from === "alcalde" ? "flex-end" : "flex-start", background: m.from === "alcalde" ? T.copper : T.surfaceAlt, color: m.from === "alcalde" ? T.surface : T.ink }}>
                <p style={{ fontSize: 13 }}>{m.texto}</p>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Mensaje para ${tab}`} className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><MessageCircle size={16} /></button>
          </form>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MURO PÚBLICO DE TRANSPARENCIA
--------------------------------------------------------------------- */
function TransparenciaWall({ T }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx((v) => (v + 1) % TESTIMONIOS.length), 5000); return () => clearInterval(t); }, []);
  return (
    <div className="pt-5 md:pt-7 flex flex-col gap-10">
      <section className="text-center max-w-xl mx-auto"><p style={{ fontSize: 12.5, fontWeight: 700, color: T.copper }}>Transparencia municipal</p><h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, marginTop: 4 }}>Lo que dicen los vecinos</h1><p style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 8 }}>Comentarios de 4 y 5 estrellas, aprobados por la supervisión municipal.</p></section>
      <section className="flex items-center gap-3 max-w-xl mx-auto w-full">
        <button onClick={() => setIdx((v) => (v - 1 + TESTIMONIOS.length) % TESTIMONIOS.length)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surface, border: `1px solid ${T.border}` }}><ChevronLeft size={17} /></button>
        <div className="flex-1 rounded-3xl p-7 text-center flex flex-col items-center gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}><div className="flex gap-0.5">{Array.from({ length: 5 }, (_, s) => <Star key={s} size={16} color={T.gold} fill={s < TESTIMONIOS[idx].estrellas ? T.gold : "transparent"} />)}</div><p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, lineHeight: 1.4 }}>&ldquo;{TESTIMONIOS[idx].texto}&rdquo;</p><p style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 700 }}>{TESTIMONIOS[idx].nombre}</p></div>
        <button onClick={() => setIdx((v) => (v + 1) % TESTIMONIOS.length)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surface, border: `1px solid ${T.border}` }}><ChevronRight size={17} /></button>
      </section>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto w-full">{IMPACTO.map((it, i) => <ImpactoCard key={i} T={T} val={it.val} label={it.label} />)}</section>
    </div>
  );
}
function ImpactoCard({ T, val, label }) { const n = useCountUp(val); return <div className="rounded-3xl p-5 text-center flex flex-col items-center gap-1.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}><p style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: T.copper, fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("es-CL")}</p><p style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.35 }}>{label}</p></div>; }

/* ---------------------------------------------------------------------
   SHARED
--------------------------------------------------------------------- */
function SectionTitle({ T, children, noMargin }) { return <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, marginBottom: noMargin ? 0 : 14 }}>{children}</h2>; }

const root = createRoot(document.getElementById("root"));
root.render(<App />);
