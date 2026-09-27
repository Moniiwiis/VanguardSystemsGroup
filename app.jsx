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
  { kw: ["gps", "ubicacion", "ubicación", "terreno", "donde esta", "dónde está", "cumple", "asistio", "asistió"], role: "admin", screen: "GPS", hi: "gps-card" },
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
const HASHES = ["0x2f9a1e…", "0x71cdb4…", "0x9e044f…", "0x33ab90…", "0x6f12aa…", "0xd0871c…"];
/* Solicitudes del vecino conectado */
const SOLICITUDES_VECINO = [
  { id: "20487", titulo: "Retiro de escombros", depto: "Aseo, Ornato y Medio Ambiente", direccion: "Los Aromos 482", fecha: "29-08-2026", estado: "En tránsito", paso: 4, activa: true, cuadrilla: "Pedro Ilabaca R.", eta: "Jueves entre 14:00 y 16:30 hrs", key: "gold" },
  { id: "20502", titulo: "Poda de árbol en la vereda", depto: "Aseo, Ornato y Medio Ambiente", direccion: "Los Aromos 482", fecha: "01-09-2026", estado: "Programada", paso: 3, activa: true, cuadrilla: "Por asignar", eta: "Semana del 15 de septiembre", key: "teal" },
  { id: "20455", titulo: "Caja de alimentos", depto: "Desarrollo Social (DIDECO)", direccion: "Los Aromos 482", fecha: "24-08-2026", estado: "Finalizada", paso: 6, activa: false, cuadrilla: "Sofía Núñez A.", eta: "Entregada el 26-08-2026", key: "sage" },
];

/* Establecimientos municipales para la postulación a Kínder */
const COLEGIOS_MUNICIPALES = [
  { nombre: "Escuela José Manuel Balmaceda", direccion: "Av. Balmaceda 1240, Centro", distancia: "1,2 km de tu casa", vacantes: 28, jornada: "Jornada Escolar Completa", sello: "Ciencias y medio ambiente", pie: true },
  { nombre: "Escuela República de Siria", direccion: "Los Carrera 880, Las Compañías", distancia: "2,4 km de tu casa", vacantes: 15, jornada: "Media jornada (mañana)", sello: "Artes y música", pie: true },
  { nombre: "Escuela Gabriela Mistral", direccion: "Pje. Los Olivos 55, La Antena", distancia: "3,1 km de tu casa", vacantes: 6, jornada: "Jornada Escolar Completa", sello: "Deportes", pie: false },
  { nombre: "Escuela Pedro Aguirre Cerda", direccion: "Camino Real 320, La Pampa", distancia: "4,0 km de tu casa", vacantes: 32, jornada: "Jornada Escolar Completa", sello: "Inglés intensivo", pie: true },
];

const AGENDA_TRABAJADOR = [
  { hora: "09:00", direccion: "Los Aromos 482", tarea: "Retiro de escombros" },
  { hora: "10:15", direccion: "Pje. Las Camelias 55", tarea: "Entrega de sacos de arena" },
  { hora: "11:30", direccion: "Av. Circunvalación 1420", tarea: "Poda de árbol" },
];
const DEPTS_SECCIONES = [
  {
    titulo: "Delegaciones Municipales de La Serena",
    items: ["Las Compañías", "La Antena", "La Pampa", "Avenida del Mar", "Centro", "Rural"],
  },
  {
    titulo: "Áreas de Gestión Interna y Soporte",
    items: [
      "Dirección de Gestión de Personas (RR.HH.)",
      "Dirección de Administración y Finanzas (DAF)",
      "Dirección de Asesoría Jurídica",
      "Secretaría Comunal de Planificación (SECPLAN)",
    ],
  },
  {
    titulo: "Áreas de Servicio Público y Operativas",
    items: [
      "Dirección de Obras Municipales (DOM)",
      "Dirección de Tránsito y Transporte Público",
      "Dirección de Aseo y Ornato",
      "Dirección de Seguridad Ciudadana",
    ],
  },
  {
    titulo: "Áreas Sociales, Comunitarias y de Control",
    items: ["Dirección de Desarrollo Comunitario (DIDECO)", "Secretaría Municipal", "Dirección de Control"],
  },
];
const DEPTS_HEADS = DEPTS_SECCIONES.flatMap((s) => s.items);
const CHAT_SEED = {
  "Las Compañías": [{ from: "jefe", texto: "Alcaldesa, la delegación Las Compañías reporta buena asistencia en la ronda de organizaciones comunitarias de esta semana." }],
  "La Antena": [{ from: "jefe", texto: "Buenas tardes alcaldesa, en La Antena avanzamos con la revisión de carpetas de funcionarios, sin incidentes." }],
  "La Pampa": [{ from: "jefe", texto: "Alcaldesa, se realizó la mantención de la red de la delegación La Pampa según lo programado." }],
  "Avenida del Mar": [{ from: "jefe", texto: "Reporte de la delegación Avenida del Mar: fiscalización de comercio ambulante sin novedades." }],
  "Centro": [{ from: "jefe", texto: "Alcaldesa, la delegación Centro registra alta demanda de atención vecinal esta semana." }],
  "Rural": [{ from: "jefe", texto: "Buenas tardes alcaldesa, se realizó reunión con la JJVV del sector El Romero en el territorio rural." }],
  "Dirección de Gestión de Personas (RR.HH.)": [{ from: "jefe", texto: "Alcaldesa, quedó cerrado el proceso de evaluación de clima laboral en las delegaciones." }],
  "Dirección de Administración y Finanzas (DAF)": [{ from: "jefe", texto: "Se actualizó el estado de ejecución presupuestaria del mes, disponible para su revisión." }],
  "Dirección de Asesoría Jurídica": [{ from: "jefe", texto: "Alcaldesa, quedan pendientes dos informes jurídicos por firmar esta semana." }],
  "Secretaría Comunal de Planificación (SECPLAN)": [{ from: "jefe", texto: "Avanza la formulación del plan de inversión municipal para el próximo periodo." }],
  "Dirección de Obras Municipales (DOM)": [{ from: "jefe", texto: "Alcaldesa, se aprobaron 8 permisos de edificación esta semana, sin observaciones críticas." }],
  "Dirección de Tránsito y Transporte Público": [{ from: "jefe", texto: "Se instalará nueva señalética en el sector poniente durante los próximos días." }],
  "Dirección de Aseo y Ornato": [{ from: "jefe", texto: "Buenas tardes alcaldesa, tres cuadrillas reforzando el sector norte por la acumulación de basura." }, { from: "alcaldesa", texto: "Perfecto, mantenme informada cada 2 horas." }],
  "Dirección de Seguridad Ciudadana": [{ from: "jefe", texto: "Sin incidentes mayores durante la noche, dos patrullajes reforzados en el sector poniente." }],
  "Dirección de Desarrollo Comunitario (DIDECO)": [{ from: "jefe", texto: "Ya distribuimos 620 de los 1.000 sacos de arena programados para este temporal." }],
  "Secretaría Municipal": [{ from: "jefe", texto: "Alcaldesa, el acta de la última sesión de concejo quedó lista para su firma." }],
  "Dirección de Control": [{ from: "jefe", texto: "Se realizó la auditoría interna trimestral; el informe está disponible para su revisión." }],
};

/* ---------------------------------------------------------------------
   TRABAJADOR ACTUAL · CHATS INTERNOS · GPS DE TERRENO
--------------------------------------------------------------------- */
const TRABAJADOR_ACTUAL = { nombre: "Pedro Ilabaca R.", rut: "9.876.543-2", cuadrilla: "Aseo y Ornato", supervisor: "Marcela Tapia V." };
const ADMIN_ACTUAL = { nombre: "Marcela Tapia V.", cargo: "Administradora · Encargada de asignación de tareas" };

/* Chat directo Trabajador <-> Administrador encargado de asignarle tareas */
const CHAT_TRABAJADORES_SEED = {
  "Pedro Ilabaca R.": [
    { from: "admin", texto: "Pedro, te asigné el retiro de escombros en Los Aromos 482 a las 09:00.", hora: "08:42" },
    { from: "trabajador", texto: "Recibido. Voy en camino con la cuadrilla.", hora: "08:45" },
  ],
  "Katherine Solís V.": [
    { from: "admin", texto: "Katherine, fiscalización de ruidos en Av. Los Pinos 120 a las 11:30.", hora: "10:55" },
    { from: "trabajador", texto: "Llegué al punto pero el local está cerrado, ¿qué hago?", hora: "11:38" },
  ],
  "Jorge Peralta M.": [
    { from: "trabajador", texto: "Se rompió la manguera del camión, no puedo continuar la ruta.", hora: "10:12" },
  ],
  "Sofía Núñez A.": [
    { from: "admin", texto: "Sofía, confirma la entrega de sacos de arena en Las Camelias 55.", hora: "09:30" },
    { from: "trabajador", texto: "Entregados los 10 sacos, foto del antes y después ya subida.", hora: "10:20" },
  ],
};

/* Chat directo Administrador <-> Alcaldesa */
const CHAT_ADMIN_ALCALDESA_SEED = [
  { from: "admin", texto: "Alcaldesa, buenos días. El reporte de cumplimiento de terreno de hoy está al 82%.", hora: "08:30" },
  { from: "alcaldesa", texto: "Gracias Marcela. ¿Qué pasó con el trabajador que no marcó llegada?", hora: "08:50" },
];

/* Posiciones GPS y cumplimiento de trabajadores con tareas asignadas */
const GPS_TRABAJADORES = [
  {
    nombre: "Pedro Ilabaca R.", rut: "9.876.543-2", cuadrilla: "Aseo y Ornato", delegacion: "Centro",
    tarea: "Retiro de escombros", direccion: "Los Aromos 482", horaAsignada: "09:00", horaLlegada: "09:07",
    estado: "En sitio", cumple: true, distancia: "12 m del punto asignado", bateria: 78, senal: "hace 1 min",
    x: 22, y: 64, evidenciaAntes: true, evidenciaDespues: false,
  },
  {
    nombre: "Sofía Núñez A.", rut: "16.884.220-5", cuadrilla: "Aseo y Ornato", delegacion: "Las Compañías",
    tarea: "Entrega de sacos de arena", direccion: "Pje. Las Camelias 55", horaAsignada: "10:15", horaLlegada: "10:11",
    estado: "Finalizada", cumple: true, distancia: "5 m del punto asignado", bateria: 64, senal: "hace 3 min",
    x: 44, y: 38, evidenciaAntes: true, evidenciaDespues: true,
  },
  {
    nombre: "Katherine Solís V.", rut: "14.221.098-7", cuadrilla: "Seguridad Ciudadana", delegacion: "Centro",
    tarea: "Fiscalización de ruidos molestos", direccion: "Av. Los Pinos 120", horaAsignada: "11:30", horaLlegada: "11:38",
    estado: "En sitio", cumple: true, distancia: "28 m del punto asignado", bateria: 41, senal: "hace 2 min",
    x: 67, y: 52, evidenciaAntes: true, evidenciaDespues: false,
  },
  {
    nombre: "Jorge Peralta M.", rut: "13.004.771-9", cuadrilla: "Aseo y Ornato", delegacion: "La Antena",
    tarea: "Poda de árbol", direccion: "Av. Circunvalación 1420", horaAsignada: "11:30", horaLlegada: null,
    estado: "En ruta", cumple: null, distancia: "1,8 km del punto asignado", bateria: 55, senal: "hace 4 min",
    x: 80, y: 26, evidenciaAntes: false, evidenciaDespues: false,
  },
  {
    nombre: "Luis Andrade M.", rut: "11.457.309-K", cuadrilla: "Aseo y Ornato", delegacion: "La Pampa",
    tarea: "Retiro de microbasural", direccion: "Los Boldos 233", horaAsignada: "09:30", horaLlegada: null,
    estado: "No asistió", cumple: false, distancia: "Sin registro en el punto", bateria: 12, senal: "hace 2 h 40 min",
    x: 12, y: 22, evidenciaAntes: false, evidenciaDespues: false,
  },
  {
    nombre: "Rodrigo Vera C.", rut: "15.330.882-4", cuadrilla: "Tránsito", delegacion: "Avenida del Mar",
    tarea: "Reposición de señalética", direccion: "Av. del Mar 2100", horaAsignada: "10:00", horaLlegada: "10:02",
    estado: "Fuera de zona", cumple: false, distancia: "3,4 km fuera del polígono asignado", bateria: 88, senal: "hace 1 min",
    x: 56, y: 78, evidenciaAntes: false, evidenciaDespues: false,
  },
];

const GPS_COLOR_ESTADO = { "En sitio": "sage", "Finalizada": "ocean", "En ruta": "gold", "No asistió": "red", "Fuera de zona": "red" };

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
  const [alcaldesaVista, setAlcaldesaVista] = useState("RESUMEN");
  const [activeDept, setActiveDept] = useState(null);
  const [tramiteActivo, setTramiteActivo] = useState(null);
  const [handsFree, setHandsFree] = useState(false);

  const [copilotText, setCopilotText] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const highlightTimer = useRef(null);

  const [contenidos, setContenidos] = useState(SEED_CONTENIDOS);
  const [incidentes, setIncidentes] = useState(SEED_INCIDENTES);

  /* Chats compartidos entre paneles: lo que se escribe en uno se ve en el otro */
  const [chatTrabajadores, setChatTrabajadores] = useState(CHAT_TRABAJADORES_SEED);
  const [chatAdminAlcaldesa, setChatAdminAlcaldesa] = useState(CHAT_ADMIN_ALCALDESA_SEED);
  const [chatDirecciones, setChatDirecciones] = useState(CHAT_SEED);

  /* Tareas creadas por el asistente IA (aparecen en Asignación del admin) */
  const [asignacionesIA, setAsignacionesIA] = useState([]);

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
      {role === "login" && <PaginaLogin T={T} theme={theme} setTheme={setTheme} onLogin={doLogin} onBack={() => setRole("inicio")} onClaveUnica={() => setRole("claveunica")} />}
      {role === "claveunica" && <PaginaClaveUnica T={T} theme={theme} setTheme={setTheme} onLogin={doLogin} onBack={() => setRole("login")} />}

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
              {role === "trabajador" && (
                <TrabajadorPortal T={T} screen={trabajadorScreen} setScreen={setTrabajadorScreen}
                  chatTrabajadores={chatTrabajadores} setChatTrabajadores={setChatTrabajadores} />
              )}
              {role === "admin" && (
                <AdminPanel T={T} screen={adminScreen} setScreen={setAdminScreen} highlightId={highlightId}
                  contenidos={contenidos} setContenidos={setContenidos} incidentes={incidentes} setIncidentes={setIncidentes}
                  chatTrabajadores={chatTrabajadores} setChatTrabajadores={setChatTrabajadores}
                  chatAdminAlcaldesa={chatAdminAlcaldesa} setChatAdminAlcaldesa={setChatAdminAlcaldesa}
                  asignacionesIA={asignacionesIA} />
              )}
              {role === "alcalde" && (
                <AlcaldePanel T={T} contenidos={contenidos} incidentes={incidentes}
                  vista={alcaldesaVista} setVista={setAlcaldesaVista}
                  chatDirecciones={chatDirecciones} setChatDirecciones={setChatDirecciones}
                  chatTrabajadores={chatTrabajadores}
                  chatAdminAlcaldesa={chatAdminAlcaldesa} setChatAdminAlcaldesa={setChatAdminAlcaldesa} />
              )}
              {role === "transparencia" && <TransparenciaWall T={T} />}
            </main>
          )}

          {role === "vecino" && !handsFree && ["A", "B", "C", "D", "MAS"].includes(vecinoScreen) && (
            <MobileTabBar T={T} screen={vecinoScreen} setScreen={setVecinoScreen} />
          )}
          {role === "trabajador" && <TrabajadorTabBar T={T} screen={trabajadorScreen} setScreen={setTrabajadorScreen} />}

          {role !== "transparencia" && !handsFree && (
            <AsistenteIA
              T={T}
              role={role}
              chatTrabajadores={chatTrabajadores}
              chatAdminAlcaldesa={chatAdminAlcaldesa}
              agregarAsignacionIA={(t) => { setAsignacionesIA((a) => [t, ...a]); setAdminScreen("ASIGNACION"); }}
              irA={(destino) => {
                if (role === "trabajador") setTrabajadorScreen(destino);
                else if (role === "admin") setAdminScreen(destino);
                else if (role === "vecino") setVecinoScreen(destino);
                else if (role === "alcalde") setAlcaldesaVista(destino);
              }}
            />
          )}
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
function PaginaLogin({ T, theme, setTheme, onLogin, onBack, onClaveUnica }) {
  const [step, setStep] = useState("form"); // form | roles | recover-rut | recover-otp | recover-new | recover-done
  const roles = [
    { id: "vecino", label: "Vecino", icon: Home, desc: "Solicita ayuda y sigue tus trámites" },
    { id: "trabajador", label: "Trabajador municipal", icon: Wrench, desc: "Cuadrillas y fichaje de terreno" },
    { id: "admin", label: "Administrador", icon: ShieldCheck, desc: "Jefe de departamento / supervisor" },
    { id: "alcalde", label: "Alcaldesa", icon: Landmark, desc: "Panel estratégico y de auditoría" },
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
            <button onClick={onClaveUnica} className="rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2" style={{ background: "#2B5876", color: "#fff" }}>
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
   PÁGINA CLAVE ÚNICA (autenticación del Estado)
--------------------------------------------------------------------- */
function PaginaClaveUnica({ T, theme, setTheme, onLogin, onBack }) {
  const [paso, setPaso] = useState("credenciales"); // credenciales | verificando | autorizar | roles
  const [rut, setRut] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const AZUL = "#0F69B4", AZUL_OSC = "#0B4E85";

  const roles = [
    { id: "vecino", label: "Vecino", icon: Home, desc: "Solicita ayuda y sigue tus trámites" },
    { id: "trabajador", label: "Trabajador municipal", icon: Wrench, desc: "Cuadrillas y fichaje de terreno" },
    { id: "admin", label: "Administrador", icon: ShieldCheck, desc: "Jefe de departamento / supervisor" },
    { id: "alcalde", label: "Alcaldesa", icon: Landmark, desc: "Panel estratégico y de auditoría" },
  ];

  const continuar = () => {
    if (!rut.trim() || !clave.trim()) { setError("Debes ingresar tu RUN y tu ClaveÚnica."); return; }
    if (!validarRutChileno(rut)) { setError("El RUN ingresado no es válido. Revisa el dígito verificador."); return; }
    setError(""); setPaso("verificando");
    setTimeout(() => setPaso("autorizar"), 1400);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme === "light" ? "#F3F6FA" : T.bg }}>
      {/* Barra superior estilo Gobierno de Chile */}
      <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: AZUL_OSC, color: "#fff" }}>
        <div className="flex items-center gap-2.5">
          <IdCard size={22} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>ClaveÚnica</p>
            <p style={{ fontSize: 10.5, opacity: 0.85 }}>Gobierno de Chile · Identidad digital</p>
          </div>
        </div>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl p-7 md:p-9 flex flex-col gap-5" style={{ background: T.surface, border: `1.5px solid ${T.border}`, boxShadow: "0 10px 40px rgba(11,78,133,0.10)" }}>
          <button onClick={paso === "credenciales" ? onBack : () => { setPaso("credenciales"); setError(""); }} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 12.5, fontWeight: 600 }}>
            <ChevronLeft size={15} /> Volver
          </button>

          {paso === "credenciales" && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: AZUL, color: "#fff" }}><IdCard size={26} /></div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700 }}>Ingresa con tu ClaveÚnica</h2>
                <p style={{ fontSize: 12.5, color: T.inkSoft }}>La Municipalidad de La Serena solicita verificar tu identidad para acceder a la plataforma.</p>
              </div>

              <div className="flex flex-col gap-2.5">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>RUN</label>
                  <input value={rut} onChange={(e) => setRut(formatRut(e.target.value))} placeholder="12.345.678-9" maxLength={12}
                    className="mt-1 w-full rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${error ? T.red : T.border}`, color: T.ink }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>ClaveÚnica</label>
                  <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Tu ClaveÚnica"
                    className="mt-1 w-full rounded-xl px-3.5 py-3 text-[14px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${error ? T.red : T.border}`, color: T.ink }} />
                </div>
              </div>

              {error && <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: T.redSoft, color: T.red }}><AlertCircle size={15} className="shrink-0 mt-0.5" /><p style={{ fontSize: 12, fontWeight: 600 }}>{error}</p></div>}

              <button onClick={continuar} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: AZUL, color: "#fff" }}>Continuar</button>

              <div className="flex flex-col gap-1.5 text-center">
                <button style={{ fontSize: 12.5, fontWeight: 600, color: AZUL }}>¿Olvidaste tu ClaveÚnica?</button>
                <button style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>Solicitar ClaveÚnica en ChileAtiende</button>
              </div>

              <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <Lock size={14} className="shrink-0 mt-0.5" color={T.sage} />
                <p style={{ fontSize: 11, color: T.inkSoft, lineHeight: 1.4 }}>Conexión cifrada. La Municipalidad no almacena tu ClaveÚnica: sólo recibe la confirmación de tu identidad.</p>
              </div>
            </>
          )}

          {paso === "verificando" && (
            <div className="py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mic-pulse" style={{ background: AZUL, color: "#fff" }}><Fingerprint size={28} /></div>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>Verificando tu identidad…</p>
              <p style={{ fontSize: 12.5, color: T.inkSoft }}>Consultando el Registro Civil e Identificación</p>
            </div>
          )}

          {paso === "autorizar" && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.sageSoft, color: T.sage }}><CheckCircle2 size={26} /></div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Identidad verificada</h2>
                <p style={{ fontSize: 12.5, color: T.inkSoft }}>RUN {rut} · Autoriza los datos que se compartirán con la Municipalidad de La Serena.</p>
              </div>
              <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                {["Nombre completo y RUN", "Correo electrónico registrado", "Comuna de residencia"].map((d, i) => (
                  <div key={i} className="flex items-center gap-2"><Check size={14} color={T.sage} className="shrink-0" /><span style={{ fontSize: 12.5 }}>{d}</span></div>
                ))}
              </div>
              <button onClick={() => setPaso("roles")} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: AZUL, color: "#fff" }}>Autorizar y continuar</button>
              <button onClick={onBack} className="rounded-2xl py-3 font-bold text-[13px]" style={{ background: "transparent", border: `1.5px solid ${T.border}`, color: T.inkSoft }}>Cancelar</button>
            </>
          )}

          {paso === "roles" && (
            <>
              <p style={{ fontSize: 12.5, color: T.inkSoft }}>Tu RUN tiene más de un perfil asociado en la Municipalidad. Elige con cuál continuar:</p>
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
        </div>
      </div>

      <div className="px-4 py-4 text-center"><p style={{ fontSize: 11, color: T.inkFaint }}>ClaveÚnica es el sistema de identidad digital del Estado de Chile · Demostración académica</p></div>
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
  const items = [{ id: "vecino", label: "Vecino" }, { id: "trabajador", label: "Trabajador" }, { id: "admin", label: "Admin" }, { id: "alcalde", label: "Alcaldesa" }, { id: "transparencia", label: "Transparencia" }];
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
  const tabs = [{ id: "FICHAJE", label: "Fichaje", icon: Fingerprint }, { id: "AGENDA", label: "Agenda", icon: Navigation }, { id: "TAREA", label: "Tarea", icon: ClipboardList }, { id: "EVIDENCIA", label: "Fotos", icon: Camera }, { id: "CHAT", label: "Chat", icon: MessageCircle }, { id: "CIERRE", label: "Cerrar", icon: PenTool }];
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

      {screen === "A" && <PantallaDashboard T={T} highlightId={highlightId} contenidos={contenidos} goDept={goDept} goScreen={setScreen} />}
      {screen === "DEPT" && activeDept && <PantallaDepartamento T={T} dept={activeDept} onBack={() => setScreen("A")} onServicio={(s) => goForm(activeDept, s)} />}
      {screen === "B" && <PantallaFormulario T={T} highlightId={highlightId} tramiteActivo={tramiteActivo} />}
      {screen === "C" && <PantallaSeguimiento T={T} highlightId={highlightId} />}
      {screen === "D" && <PantallaCalificacion T={T} highlightId={highlightId} />}
      {screen === "MAS" && <PantallaMas T={T} setScreen={setScreen} />}
      {screen === "COMUNIDAD" && <PantallaComunidad T={T} />}
      {screen === "FICHA" && <PantallaMiFicha T={T} />}
      {screen === "ACTIVAS" && <PantallaSolicitudesActivas T={T} onVolver={() => setScreen("A")} onSeguir={() => setScreen("C")} />}
      {screen === "COLEGIOS" && <PantallaColegios T={T} onVolver={() => setScreen("A")} />}
      {screen === "LICENCIA" && <PantallaLicencia T={T} onVolver={() => setScreen("A")} />}
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
function PantallaDashboard({ T, highlightId, contenidos, goDept, goScreen }) {
  const [geo, setGeo] = useState(false);
  const sugerencias = [
    { icon: GraduationCap, color: "copper", texto: "Detectamos que un menor de tu hogar está en edad de ingresar a Kínder 2027.", cta: "Ver colegios municipales", ir: "COLEGIOS" },
    { icon: Car, color: "ocean", texto: "Tu licencia de conducir vence en 2 meses.", cta: "Renovar ahora", ir: "LICENCIA" },
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
        <button onClick={() => goScreen("ACTIVAS")} className="flex items-center gap-2 rounded-2xl px-4 py-3 self-start transition-transform active:scale-95" style={{ background: "rgba(255,255,255,0.16)" }}><Bell size={18} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{SOLICITUDES_VECINO.filter((x) => x.activa).length} solicitudes activas</span><ChevronRight size={16} /></button>
      </section>

      <section className="flex flex-col gap-2.5">
        {sugerencias.map((s, i) => {
          const Icon = s.icon; const accent = T[s.color]; const accentSoft = T[`${s.color}Soft`]; return (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3.5" style={{ background: accentSoft }}>
              <Icon size={20} color={accent} className="shrink-0" />
              <p style={{ fontSize: 12.5, color: accent, fontWeight: 600, flex: 1 }}>{s.texto}</p>
              <button onClick={() => goScreen(s.ir)} className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ background: accent, color: T.surface }}>{s.cta}</button>
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

/* ---- Vecino: mis solicitudes activas ---- */
function PantallaSolicitudesActivas({ T, onVolver, onSeguir }) {
  const [filtro, setFiltro] = useState("activas");
  const pasos = ["Recibida", "En revisión", "Aceptada", "Programada", "En tránsito", "Finalizada"];
  const lista = filtro === "activas" ? SOLICITUDES_VECINO.filter((s) => s.activa) : SOLICITUDES_VECINO;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <button onClick={onVolver} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 13, fontWeight: 600 }}><ChevronLeft size={16} /> Volver al inicio</button>

      <div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600 }}>Mis solicitudes</h1>
        <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>Aquí ves en qué va cada trámite que pediste a la Municipalidad.</p>
      </div>

      <div className="flex gap-1.5">
        {[{ id: "activas", label: "Activas" }, { id: "todas", label: "Todas" }].map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)} className="px-4 py-2 rounded-full text-[12.5px] font-bold" style={{ background: filtro === f.id ? T.copper : T.surfaceAlt, color: filtro === f.id ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>{f.label}</button>
        ))}
      </div>

      {lista.map((sol) => (
        <div key={sol.id} className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: T.copper }}>Solicitud N.º {sol.id}</p>
              <p style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{sol.titulo}</p>
              <p style={{ fontSize: 12, color: T.inkSoft }}>{sol.depto} · ingresada el {sol.fecha}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full shrink-0" style={{ background: T[`${sol.key}Soft`], color: T[sol.key], fontSize: 11.5, fontWeight: 800 }}>{sol.estado}</span>
          </div>

          {/* Mini línea de tiempo */}
          <div className="flex items-center gap-1">
            {pasos.map((ps, i) => (
              <React.Fragment key={ps}>
                <div className="flex flex-col items-center gap-1" style={{ minWidth: "fit-content" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: i < sol.paso ? T.copper : T.surfaceAlt, border: `1.5px solid ${i < sol.paso ? T.copper : T.border}`, color: T.surface }}>
                    {i < sol.paso && <Check size={11} />}
                  </div>
                  <span style={{ fontSize: 8.5, color: i < sol.paso ? T.ink : T.inkFaint, textAlign: "center", width: 48, lineHeight: 1.2 }}>{ps}</span>
                </div>
                {i < pasos.length - 1 && <div className="flex-1 h-[2px] mb-4" style={{ background: i < sol.paso - 1 ? T.copper : T.border }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-2xl p-3.5" style={{ background: T.surfaceAlt }}>
              <p style={{ fontSize: 10.5, color: T.inkFaint, fontWeight: 700 }}>DIRECCIÓN</p>
              <p style={{ fontSize: 12.5, fontWeight: 600 }}>{sol.direccion}</p>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: T.surfaceAlt }}>
              <p style={{ fontSize: 10.5, color: T.inkFaint, fontWeight: 700 }}>CUADRILLA A CARGO</p>
              <p style={{ fontSize: 12.5, fontWeight: 600 }}>{sol.cuadrilla}</p>
            </div>
          </div>

          <div className="rounded-2xl p-3.5 flex items-center gap-2.5" style={{ background: T[`${sol.key}Soft`], color: T[sol.key] }}>
            <Clock size={16} className="shrink-0" />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{sol.eta}</span>
          </div>

          {sol.activa && (
            <button onClick={onSeguir} className="self-start rounded-2xl px-5 py-2.5 text-[12.5px] font-bold flex items-center gap-1.5" style={{ background: T.copper, color: T.surface }}>
              Ver seguimiento detallado <ArrowRight size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---- Vecino: colegios municipales (Kínder 2027) ---- */
function PantallaColegios({ T, onVolver }) {
  const [postulados, setPostulados] = useState([]);
  const [jornadaFiltro, setJornadaFiltro] = useState("Todas");

  const lista = jornadaFiltro === "Todas" ? COLEGIOS_MUNICIPALES : COLEGIOS_MUNICIPALES.filter((c) => c.jornada.startsWith(jornadaFiltro));

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <button onClick={onVolver} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 13, fontWeight: 600 }}><ChevronLeft size={16} /> Volver al inicio</button>

      <div className="rounded-3xl p-6 flex items-start gap-4" style={{ background: `linear-gradient(120deg, ${T.copperSoft}, ${T.surface})`, border: `1.5px solid ${T.border}` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><GraduationCap size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Colegios municipales · Kínder 2027</h1>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>Detectamos que un menor de tu hogar está en edad de ingresar a Kínder. Aquí puedes revisar los establecimientos con vacantes y manifestar tu interés.</p>
        </div>
      </div>

      {/* Plazos */}
      <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700 }}>Fechas del proceso</p>
        {[
          { f: "01 al 30 de septiembre 2026", t: "Postulación en el Sistema de Admisión Escolar", activo: true },
          { f: "Noviembre 2026", t: "Publicación de resultados", activo: false },
          { f: "Diciembre 2026", t: "Matrícula en el establecimiento asignado", activo: false },
        ].map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: e.activo ? T.sage : T.border }} />
            <div><p style={{ fontSize: 12.5, fontWeight: 700 }}>{e.t}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{e.f}{e.activo && " · en curso"}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {["Todas", "Jornada", "Media"].map((j) => (
          <button key={j} onClick={() => setJornadaFiltro(j)} className="px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: jornadaFiltro === j ? T.copper : T.surfaceAlt, color: jornadaFiltro === j ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>
            {j === "Todas" ? "Todas las jornadas" : j === "Jornada" ? "Jornada completa" : "Media jornada"}
          </button>
        ))}
      </div>

      {lista.map((c) => {
        const post = postulados.includes(c.nombre);
        const pocas = c.vacantes <= 10;
        return (
          <div key={c.nombre} className="rounded-3xl p-5 flex flex-col gap-3.5" style={{ background: T.surface, border: `1.5px solid ${post ? T.sage : T.border}` }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 15, fontWeight: 700 }}>{c.nombre}</p>
                <p style={{ fontSize: 12, color: T.inkSoft }}>{c.direccion}</p>
                <p style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{c.distancia}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full shrink-0" style={{ background: pocas ? T.goldSoft : T.sageSoft, color: pocas ? T.gold : T.sage, fontSize: 11, fontWeight: 700 }}>
                {c.vacantes} vacantes{pocas && " · pocas"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <TagChip T={T} icon={Clock} text={c.jornada} color="ocean" />
              <TagChip T={T} icon={Sparkles} text={c.sello} color="copper" />
              {c.pie && <TagChip T={T} icon={HeartHandshake} text="Programa de Integración (PIE)" color="sage" />}
            </div>

            {post ? (
              <div className="rounded-2xl p-3.5 flex items-center gap-2" style={{ background: T.sageSoft, color: T.sage }}>
                <CheckCircle2 size={16} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Interés registrado. Te contactaremos con los pasos de postulación.</span>
              </div>
            ) : (
              <button onClick={() => setPostulados((a) => [...a, c.nombre])} className="self-start rounded-2xl px-5 py-2.5 text-[12.5px] font-bold" style={{ background: T.copper, color: T.surface }}>
                Me interesa este colegio
              </button>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <Info size={15} color={T.inkFaint} className="shrink-0 mt-0.5" />
        <p style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.45 }}>Manifestar interés aquí no reemplaza la postulación oficial en el Sistema de Admisión Escolar, pero la Municipalidad te acompañará en el trámite y te avisará de los plazos.</p>
      </div>
    </div>
  );
}

/* ---- Vecino: renovación de licencia de conducir ---- */
function PantallaLicencia({ T, onVolver }) {
  const [paso, setPaso] = useState(0);
  const [hora, setHora] = useState(null);
  const [listo, setListo] = useState(false);

  const requisitos = [
    { t: "Cédula de identidad vigente", ok: true, nota: "Validada con el Registro Civil" },
    { t: "Licencia actual (clase B)", ok: true, nota: "Vence el 16-11-2026" },
    { t: "Certificado de antecedentes", ok: true, nota: "Obtenido automáticamente" },
    { t: "Examen médico y psicotécnico", ok: false, nota: "Se realiza el día de tu hora" },
    { t: "Sin multas de tránsito impagas", ok: true, nota: "Sin deudas registradas" },
  ];

  const horas = ["Lun 21 · 09:00", "Lun 21 · 11:30", "Mar 22 · 08:30", "Mié 23 · 15:00", "Jue 24 · 10:00", "Vie 25 · 12:00"];

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <button onClick={onVolver} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 13, fontWeight: 600 }}><ChevronLeft size={16} /> Volver al inicio</button>

      <div className="rounded-3xl p-6 flex items-start gap-4" style={{ background: `linear-gradient(120deg, ${T.oceanSoft}, ${T.surface})`, border: `1.5px solid ${T.border}` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.ocean, color: "#fff" }}><Car size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Renovación de licencia de conducir</h1>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>Tu licencia clase B vence el <b>16 de noviembre de 2026</b>. Puedes renovarla desde 90 días antes del vencimiento.</p>
        </div>
      </div>

      {/* Cuenta regresiva */}
      <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.gold}` }}>
        <Clock size={22} color={T.gold} className="shrink-0" />
        <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>Quedan 2 meses</p><p style={{ fontSize: 12, color: T.inkSoft }}>Si conduces con la licencia vencida arriesgas multa y retiro del vehículo.</p></div>
      </div>

      {/* Requisitos */}
      <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700 }}>Requisitos</p>
        {requisitos.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: r.ok ? T.sageSoft : T.goldSoft, color: r.ok ? T.sage : T.gold }}>
              {r.ok ? <Check size={11} /> : <Clock size={11} />}
            </div>
            <div><p style={{ fontSize: 12.5, fontWeight: 600 }}>{r.t}</p><p style={{ fontSize: 11, color: T.inkFaint }}>{r.nota}</p></div>
          </div>
        ))}
      </div>

      {/* Costo */}
      <div className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700 }}>Costo del trámite</p>
        <div className="flex justify-between"><span style={{ fontSize: 12.5, color: T.inkSoft }}>Derecho municipal</span><span style={{ fontSize: 12.5, fontWeight: 700 }}>1,0 UTM aprox.</span></div>
        <div className="flex justify-between"><span style={{ fontSize: 12.5, color: T.inkSoft }}>Examen médico</span><span style={{ fontSize: 12.5, fontWeight: 700 }}>Incluido</span></div>
        <p style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>El valor exacto se confirma en la Dirección de Tránsito el día de tu hora. Puedes pagar en caja o con tarjeta.</p>
      </div>

      {/* Agendar */}
      {!listo ? (
        <div className="rounded-3xl p-5 flex flex-col gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <p style={{ fontSize: 13.5, fontWeight: 700 }}>Elige tu hora en la Dirección de Tránsito</p>
          <p style={{ fontSize: 11.5, color: T.inkSoft }}>Av. Francisco de Aguirre 300, Centro · atención de lunes a viernes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {horas.map((h) => (
              <button key={h} onClick={() => setHora(h)} className="rounded-xl py-2.5 text-[12px] font-bold" style={{ background: hora === h ? T.copper : T.surfaceAlt, color: hora === h ? T.surface : T.ink, border: `1px solid ${hora === h ? T.copper : T.border}` }}>{h}</button>
            ))}
          </div>
          <button disabled={!hora} onClick={() => setListo(true)} className="rounded-2xl py-3.5 font-bold text-[14px]" style={{ background: T.copper, color: T.surface, opacity: hora ? 1 : 0.45 }}>
            Confirmar hora
          </button>
        </div>
      ) : (
        <div className="rounded-3xl p-6 flex flex-col items-center text-center gap-3" style={{ background: T.sageSoft }}>
          <CheckCircle2 size={32} color={T.sage} />
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: T.sage }}>Hora confirmada</p>
          <p style={{ fontSize: 12.5, color: T.inkSoft }}>{hora} hrs · Dirección de Tránsito, Av. Francisco de Aguirre 300. Te enviamos el comprobante y un recordatorio el día anterior.</p>
          <button onClick={onVolver} className="rounded-2xl px-5 py-2.5 text-[12.5px] font-bold" style={{ background: T.sage, color: T.surface }}>Volver al inicio</button>
        </div>
      )}
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
function TrabajadorPortal({ T, screen, setScreen, chatTrabajadores, setChatTrabajadores }) {
  return (
    <div className="pt-5 md:pt-7">
      <div className="hidden md:flex flex-wrap gap-1.5 mb-6 rounded-full p-1 w-fit" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        {[{ id: "FICHAJE", label: "Fichaje" }, { id: "AGENDA", label: "Mi agenda" }, { id: "TAREA", label: "Tarea activa" }, { id: "EVIDENCIA", label: "Fotos antes/después" }, { id: "CHAT", label: "Chat con mi jefatura" }, { id: "CIERRE", label: "Cierre de tarea" }].map((t) => {
          const active = screen === t.id; return (
            <button key={t.id} onClick={() => setScreen(t.id)} className="px-4 py-2 rounded-full text-[13px] font-semibold" style={{ background: active ? T.copper : "transparent", color: active ? T.surface : T.inkSoft }}>{t.label}</button>
          );
        })}
      </div>
      {screen === "FICHAJE" && <PantallaFichaje T={T} />}
      {screen === "AGENDA" && <PantallaAgenda T={T} />}
      {screen === "TAREA" && <PantallaTareaActiva T={T} />}
      {screen === "EVIDENCIA" && <PantallaEvidenciaFotos T={T} />}
      {screen === "CHAT" && <PantallaChatTrabajador T={T} chatTrabajadores={chatTrabajadores} setChatTrabajadores={setChatTrabajadores} />}
      {screen === "CIERRE" && <PantallaCierreTarea T={T} />}
    </div>
  );
}

/* ---- Trabajador: cámara de evidencia ANTES / DESPUÉS ---- */
function PantallaEvidenciaFotos({ T }) {
  const [tareaIdx, setTareaIdx] = useState(0);
  const [capturas, setCapturas] = useState(AGENDA_TRABAJADOR.map(() => ({ antes: null, despues: null })));
  const [camara, setCamara] = useState(null); // null | "antes" | "despues"
  const [flash, setFlash] = useState(false);

  const tarea = AGENDA_TRABAJADOR[tareaIdx];
  const actual = capturas[tareaIdx];

  const disparar = () => {
    setFlash(true);
    setTimeout(() => {
      const sello = { hora: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }), gps: "-29.9027, -71.2519", dir: tarea.direccion };
      setCapturas((c) => c.map((v, i) => (i === tareaIdx ? { ...v, [camara]: sello } : v)));
      setFlash(false); setCamara(null);
    }, 420);
  };

  const completas = actual.antes && actual.despues;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Fotos del antes y el después</h2>
        <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>Esta pantalla sólo permite tomar fotos con la cámara: no se pueden subir imágenes de la galería. Cada foto queda sellada con hora y GPS para que tu jefatura y la Alcaldesa puedan verificar el trabajo.</p>
      </div>

      {/* Selector de tarea */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {AGENDA_TRABAJADOR.map((a, i) => {
          const act = tareaIdx === i; const c = capturas[i];
          const listo = c.antes && c.despues;
          return (
            <button key={i} onClick={() => setTareaIdx(i)} className="px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap flex items-center gap-1.5" style={{ background: act ? T.copper : T.surfaceAlt, color: act ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>
              {listo && <CheckCircle2 size={12} />} {a.hora} · {a.tarea}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk }}><ClipboardList size={18} /></div>
          <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 700 }}>{tarea.tarea}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{tarea.direccion} · {tarea.hora} hrs</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ k: "antes", label: "ANTES del trabajo", color: "gold" }, { k: "despues", label: "DESPUÉS del trabajo", color: "sage" }].map((slot) => {
            const foto = actual[slot.k]; const accent = T[slot.color]; const accentSoft = T[`${slot.color}Soft`];
            const bloqueado = slot.k === "despues" && !actual.antes;
            return (
              <div key={slot.k} className="rounded-2xl overflow-hidden flex flex-col" style={{ border: `1.5px solid ${foto ? accent : T.border}` }}>
                <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: accentSoft, color: accent }}>
                  <Camera size={13} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3 }}>{slot.label}</span>
                </div>
                {foto ? (
                  <div className="p-3 flex flex-col gap-2">
                    {/* Miniatura simulada de la foto capturada */}
                    <div className="h-28 rounded-xl relative overflow-hidden flex items-end" style={{ background: `linear-gradient(160deg, ${accentSoft}, ${T.surfaceAlt})` }}>
                      <div className="absolute inset-0 flex items-center justify-center"><ImageIcon size={26} color={accent} /></div>
                      <div className="relative w-full px-2 py-1" style={{ background: "rgba(0,0,0,0.55)" }}>
                        <p style={{ fontSize: 9.5, color: "#fff", fontWeight: 700 }}>{foto.hora} hrs · GPS {foto.gps}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5"><ShieldCheck size={12} color={T.sage} /><span style={{ fontSize: 10.5, color: T.sage, fontWeight: 700 }}>Foto sellada, no editable</span></div>
                    <button onClick={() => setCamara(slot.k)} className="rounded-xl py-2 text-[11.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Repetir foto</button>
                  </div>
                ) : (
                  <button disabled={bloqueado} onClick={() => setCamara(slot.k)} className="h-[152px] flex flex-col items-center justify-center gap-2 px-3" style={{ background: T.surfaceAlt, opacity: bloqueado ? 0.5 : 1 }}>
                    <Camera size={24} color={T.inkFaint} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkFaint, textAlign: "center" }}>{bloqueado ? "Primero toma la foto del ANTES" : "Abrir cámara y tomar foto"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {completas ? (
          <div className="rounded-2xl p-3.5 flex items-center gap-2" style={{ background: T.sageSoft, color: T.sage }}>
            <CheckCircle2 size={17} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Evidencia completa enviada a tu jefatura. Visible también para la Alcaldesa.</span>
          </div>
        ) : (
          <p style={{ fontSize: 11.5, color: T.inkFaint }}>Debes tomar ambas fotos para que la tarea pueda cerrarse.</p>
        )}
      </div>

      {/* Visor de cámara */}
      {camara && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0B0B0C" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ color: "#fff" }}>
            <button onClick={() => setCamara(null)} className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}><X size={17} /> Cerrar</button>
            <span className="px-2.5 py-1 rounded-full" style={{ background: camara === "antes" ? "#A6791F" : "#4F7452", fontSize: 11, fontWeight: 800 }}>{camara === "antes" ? "FOTO ANTES" : "FOTO DESPUÉS"}</span>
          </div>
          <div className="flex-1 relative flex items-center justify-center" style={{ background: "#161618" }}>
            {/* Simulación del visor */}
            <div className="absolute inset-6 rounded-2xl" style={{ border: "2px solid rgba(255,255,255,0.25)" }} />
            <div className="text-center flex flex-col items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Camera size={40} />
              <p style={{ fontSize: 12.5 }}>Encuadra el lugar del trabajo</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-xl px-3 py-2" style={{ background: "rgba(0,0,0,0.6)" }}>
              <p style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{tarea.direccion}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>GPS -29.9027, -71.2519 · {new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} hrs</p>
            </div>
            {flash && <div className="absolute inset-0" style={{ background: "#fff", opacity: 0.85 }} />}
          </div>
          <div className="py-7 flex items-center justify-center" style={{ background: "#0B0B0C" }}>
            <button onClick={disparar} className="w-[74px] h-[74px] rounded-full flex items-center justify-center" style={{ background: "#fff", border: "5px solid rgba(255,255,255,0.35)" }}>
              <span className="w-14 h-14 rounded-full" style={{ background: "#fff", border: "2px solid #0B0B0C" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Trabajador: chat directo con el administrador que le asigna tareas ---- */
function PantallaChatTrabajador({ T, chatTrabajadores, setChatTrabajadores }) {
  const [msg, setMsg] = useState("");
  const yo = TRABAJADOR_ACTUAL.nombre;
  const hilo = chatTrabajadores[yo] || [];
  const finRef = useRef(null);
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [hilo.length]);

  const enviar = (texto) => {
    const t = (texto ?? msg).trim(); if (!t) return;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setChatTrabajadores((c) => ({ ...c, [yo]: [...(c[yo] || []), { from: "trabajador", texto: t, hora }] }));
    setMsg("");
  };

  const rapidas = ["No puedo acceder al lugar", "Se me averió el equipo", "El vecino no está en casa", "Necesito apoyo de otra cuadrilla", "Tarea terminada"];

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Chat directo con mi jefatura</h2>
        <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>Escríbele directamente a quien te asigna las tareas si ocurre cualquier imprevisto en terreno. La Alcaldesa también puede ver esta conversación.</p>
      </div>

      <div className="rounded-3xl overflow-hidden flex flex-col" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 460 }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 12 }}>{initials(ADMIN_ACTUAL.nombre)}</div>
          <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{ADMIN_ACTUAL.nombre}</p><p style={{ fontSize: 11, color: T.inkSoft }}>{ADMIN_ACTUAL.cargo}</p></div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: T.sageSoft, color: T.sage, fontSize: 10.5, fontWeight: 700 }}><span className="w-1.5 h-1.5 rounded-full blink-dot" style={{ background: T.sage }} /> En línea</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {hilo.map((m, i) => (
            <div key={i} className="max-w-[78%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: m.from === "trabajador" ? "flex-end" : "flex-start", background: m.from === "trabajador" ? T.copper : T.surfaceAlt, color: m.from === "trabajador" ? T.surface : T.ink }}>
              <p style={{ fontSize: 13 }}>{m.texto}</p>
              {m.hora && <p style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.hora}</p>}
            </div>
          ))}
          <div ref={finRef} />
        </div>

        <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {rapidas.map((r) => <button key={r} onClick={() => enviar(r)} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>{r}</button>)}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe lo que está ocurriendo…" className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
          <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><MessageCircle size={16} /></button>
        </form>
      </div>
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


function AdminPanel({ T, screen, setScreen, highlightId, contenidos, setContenidos, incidentes, setIncidentes, chatTrabajadores, setChatTrabajadores, chatAdminAlcaldesa, setChatAdminAlcaldesa, asignacionesIA }) {
  const [openKpi, setOpenKpi] = useState(null);
  const [empleados, setEmpleados] = useState(SEED_EMPLEADOS);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [subVista, setSubVista] = useState("LISTA"); // LISTA, NUEVO, EDITAR, DETALLE

  const tabs = [
    { id: "EMPLEADOS", label: "Gestión Empleados" },
    
    { id: "SGR", label: "Matriz SGR" },
    { id: "ASIGNACION", label: "Asignación" }, { id: "CUADRILLAS", label: "Trabajadores" },
    { id: "GPS", label: "GPS en terreno" }, { id: "CHAT", label: "Chat interno" },
    { id: "E", label: "Anti-fraude" },
    { id: "F", label: "Auditoría calidad" }, { id: "G", label: "Crisis" },
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
      {screen === "ASIGNACION" && <PantallaAsignacion T={T} highlightId={highlightId} asignacionesIA={asignacionesIA} setChatTrabajadores={setChatTrabajadores} />}
      {screen === "CUADRILLAS" && <PantallaCuadrillas T={T} highlightId={highlightId} />}
      {screen === "E" && <PantallaFraude T={T} highlightId={highlightId} />}
      {screen === "F" && <PantallaAuditoria T={T} highlightId={highlightId} />}
      {screen === "G" && <PantallaCrisis T={T} highlightId={highlightId} incidentes={incidentes} setIncidentes={setIncidentes} setContenidos={setContenidos} />}
      {screen === "GPS" && <PantallaGPSTerreno T={T} />}
      {screen === "CHAT" && (
        <PantallaChatAdmin T={T}
          chatTrabajadores={chatTrabajadores} setChatTrabajadores={setChatTrabajadores}
          chatAdminAlcaldesa={chatAdminAlcaldesa} setChatAdminAlcaldesa={setChatAdminAlcaldesa} />
      )}
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
function PantallaAsignacion({ T, highlightId, asignacionesIA, setChatTrabajadores }) {
  const [asignaciones, setAsignaciones] = useState({});
  const [form, setForm] = useState({});

  const campo = (id, k, v) => setForm((f) => ({ ...f, [id]: { ...(f[id] || {}), [k]: v } }));
  const datos = (id) => form[id] || { w: "", f: "2026-09-04", h: "15:00", instrucciones: "", materiales: "", prioridad: "Normal" };

  const asignar = (p) => {
    const d = datos(p.id);
    if (!d.w || !d.instrucciones.trim()) return;
    setAsignaciones((s) => ({ ...s, [p.id]: { ...d } }));
    // El trabajador recibe la instrucción en su chat
    if (setChatTrabajadores) {
      const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      const texto = `Nueva tarea asignada (N.º ${p.id}) en ${p.direccion}, el ${d.f} a las ${d.h} hrs. Instrucciones: ${d.instrucciones}` + (d.materiales ? ` Materiales: ${d.materiales}.` : "");
      setChatTrabajadores((c) => ({ ...c, [d.w]: [...(c[d.w] || []), { from: "admin", texto, hora }] }));
    }
  };

  const autoDespacho = () => {
    const nuevo = {};
    PENDIENTES_ASIGNACION.forEach((p, i) => {
      const w = WORKERS_PERFIL[i % WORKERS_PERFIL.length].nombre;
      nuevo[p.id] = { w, f: "2026-09-04", h: "15:00", auto: true, prioridad: "Normal", materiales: "Según catálogo del servicio", instrucciones: `Atender la solicitud N.º ${p.id} de ${p.vecino} en ${p.direccion}. Tomar foto del antes y del después y registrar el cierre en la app.` };
    });
    setAsignaciones(nuevo);
  };

  const todas = [...PENDIENTES_ASIGNACION, ...(asignacionesIA || [])];

  return (
    <div className={`flex flex-col gap-3.5 ${highlightId === "asignacion-card" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between" style={{ background: `linear-gradient(120deg, ${T.copperInk}, ${T.copper})`, color: T.surface }}>
        <div><p style={{ fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Bolt size={17} /> Despacho automático por IA (Zero-Touch)</p><p style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>Evalúa habilidades, inventario, cercanía geográfica y prioridad social, y redacta las instrucciones base para cada cuadrilla.</p></div>
        <button onClick={autoDespacho} className="px-4 py-2.5 rounded-2xl text-[12.5px] font-bold whitespace-nowrap" style={{ background: T.surface, color: T.copperInk }}>Ejecutar despacho automático</button>
      </div>

      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Solicitudes pendientes de asignar. Debes indicar por escrito qué tiene que hacer el trabajador: ese texto le llega directo a su chat y a su tarea del día.</p>

      {todas.map((p) => {
        const asignado = asignaciones[p.id];
        const d = datos(p.id);
        const listo = d.w && d.instrucciones.trim();
        return (
          <div key={p.id} className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${p.creadaPorIA ? T.copper : T.border}` }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700 }}>N.º {p.id} · {p.vecino}</p>
                <p style={{ fontSize: 12, color: T.inkSoft }}>{p.depto}</p>
                <p style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{p.direccion}</p>
              </div>
              {p.creadaPorIA && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: T.copperSoft, color: T.copperInk, fontSize: 10.5, fontWeight: 700 }}><Sparkles size={11} /> Creada por el asistente IA</span>}
            </div>

            {!asignado ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <select value={d.w} onChange={(e) => campo(p.id, "w", e.target.value)} className="rounded-xl px-3 py-2.5 text-[13px] sm:col-span-2" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
                    <option value="" disabled>Elegir trabajador</option>
                    {WORKERS_PERFIL.map((w) => <option key={w.rut} value={w.nombre}>{w.nombre} — {w.especialidad}</option>)}
                    {GPS_TRABAJADORES.map((g) => <option key={g.rut} value={g.nombre}>{g.nombre} — {g.cuadrilla}</option>)}
                  </select>
                  <input type="date" value={d.f} onChange={(e) => campo(p.id, "f", e.target.value)} className="rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
                  <input type="time" value={d.h} onChange={(e) => campo(p.id, "h", e.target.value)} className="rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>¿Qué tiene que hacer el trabajador? *</label>
                  <textarea
                    value={d.instrucciones}
                    onChange={(e) => campo(p.id, "instrucciones", e.target.value)}
                    rows={3}
                    placeholder="Ej: Retirar los escombros del antejardín, cargarlos en el camión tolva y dejar la vereda barrida. Tocar el timbre fuerte, el vecino es adulto mayor."
                    className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Materiales o herramientas</label>
                    <input value={d.materiales} onChange={(e) => campo(p.id, "materiales", e.target.value)} placeholder="Ej: 10 sacos de arena, 2 palas" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Prioridad</label>
                    <select value={d.prioridad} onChange={(e) => campo(p.id, "prioridad", e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
                      <option>Normal</option><option>Alta</option><option>Urgente</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => asignar(p)} disabled={!listo} className="self-start rounded-xl px-5 py-2.5 text-[12.5px] font-bold" style={{ background: T.copper, color: T.surface, opacity: listo ? 1 : 0.45 }}>
                  Asignar y enviar instrucciones
                </button>
                {!listo && <p style={{ fontSize: 11, color: T.inkFaint }}>Elige un trabajador y escribe las instrucciones para poder asignar.</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: T.sageSoft, color: T.sage }}>
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{asignado.auto && "⚡ "}Asignado a {asignado.w} · {asignado.f} {asignado.h} hrs · prioridad {asignado.prioridad}</span>
                </div>
                <div className="rounded-2xl p-3.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.inkFaint, letterSpacing: 0.3 }}>INSTRUCCIONES ENVIADAS</p>
                  <p style={{ fontSize: 12.5, marginTop: 4 }}>{asignado.instrucciones}</p>
                  {asignado.materiales && <p style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4 }}>Materiales: {asignado.materiales}</p>}
                </div>
                <button onClick={() => setAsignaciones((s) => { const c = { ...s }; delete c[p.id]; return c; })} className="self-start rounded-xl px-4 py-2 text-[11.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Editar asignación</button>
              </div>
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
          : <span className="flex items-center gap-1 px-2 py-1 rounded-full w-fit" style={{ background: T.goldSoft, color: T.gold, fontSize: 10.5, fontWeight: 700 }}><Clock size={11} /> Pendiente de captura</span>}
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

function PantallaAuditoria({ T, highlightId, soloLectura }) {
  const [amonestando, setAmonestando] = useState(null);
  const [emitidas, setEmitidas] = useState({});

  if (amonestando !== null) {
    return (
      <PantallaAmonestacion
        T={T}
        queja={QUEJAS[amonestando]}
        onVolver={() => setAmonestando(null)}
        onEmitir={(datos) => { setEmitidas((e) => ({ ...e, [amonestando]: datos })); setAmonestando(null); }}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${highlightId === "bandeja-auditoria" ? "copilot-pulse rounded-3xl" : ""}`}>
      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 w-fit" style={{ background: T.redSoft, color: T.red }}><Lock size={16} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Bandeja privada — visible solo para supervisores</span></div>
      {QUEJAS.map((q, i) => {
        const emitida = emitidas[i];
        return (
          <div key={i} className="rounded-3xl p-5 flex flex-col md:flex-row gap-4 md:items-center" style={{ background: T.surface, border: `1.5px solid ${emitida ? T.red : T.border}` }}>
            <div className="flex items-center gap-3 md:w-56 shrink-0"><div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 13 }}>{initials(q.func)}</div><div><p style={{ fontSize: 13.5, fontWeight: 700 }}>{q.func}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{q.depto}</p></div></div>
            <div className="flex-1">
              <div className="flex gap-0.5 mb-1.5">{Array.from({ length: 5 }, (_, s2) => <Star key={s2} size={13} color={T.gold} fill={s2 < q.rating ? T.gold : "transparent"} />)}</div>
              <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.4 }}>&ldquo;{q.comentario}&rdquo;</p>
              {emitida && <p style={{ fontSize: 11.5, color: T.red, fontWeight: 700, marginTop: 6 }}>Amonestación {emitida.tipo} emitida el {emitida.fecha} · folio {emitida.folio}</p>}
            </div>
            {soloLectura ? (
              <span className="px-3 py-1.5 rounded-full shrink-0" style={{ background: T.oceanSoft, color: T.ocean, fontSize: 11, fontWeight: 700 }}>Sólo lectura</span>
            ) : emitida ? (
              <span className="px-4 py-2.5 rounded-2xl shrink-0 flex items-center gap-1.5" style={{ background: T.redSoft, color: T.red, fontSize: 12, fontWeight: 700 }}><CheckCircle2 size={14} /> Amonestación emitida</span>
            ) : (
              <button onClick={() => setAmonestando(i)} className="px-4 py-2.5 rounded-2xl text-[12.5px] font-bold whitespace-nowrap shrink-0" style={{ background: T.red, color: T.surface }}>Iniciar amonestación / investigar</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Página para redactar y emitir una amonestación ---- */
function PantallaAmonestacion({ T, queja, onVolver, onEmitir }) {
  const [tipo, setTipo] = useState("Verbal");
  const [motivo, setMotivo] = useState("");
  const [hechos, setHechos] = useState("");
  const [medida, setMedida] = useState("");
  const [plazoDescargo, setPlazoDescargo] = useState("5");
  const [notificar, setNotificar] = useState(true);
  const [adjuntos, setAdjuntos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);

  const folio = `AM-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
  const listo = motivo.trim() && hechos.trim() && medida.trim();

  const tipos = [
    { id: "Verbal", desc: "Queda en la hoja de vida, sin efecto en la remuneración", color: "gold" },
    { id: "Escrita", desc: "Carta formal con copia a la Dirección de Gestión de Personas", color: "red" },
    { id: "Investigación", desc: "Abre un sumario interno antes de resolver la sanción", color: "ocean" },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <button onClick={onVolver} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 12.5, fontWeight: 600 }}><ChevronLeft size={15} /> Volver a la bandeja</button>

      <div className="rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.red}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.redSoft, color: T.red }}><AlertTriangle size={26} /></div>
        <div className="flex-1">
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600 }}>Amonestación a {queja.func}</h2>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{queja.depto} · folio {folio}</p>
        </div>
      </div>

      {/* Antecedente que origina la amonestación */}
      <div className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700 }}>Antecedente: calificación del vecino</p>
        <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, s) => <Star key={s} size={14} color={T.gold} fill={s < queja.rating ? T.gold : "transparent"} />)}</div>
        <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.45 }}>&ldquo;{queja.comentario}&rdquo;</p>
      </div>

      {/* Tipo de medida */}
      <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700 }}>Tipo de medida</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {tipos.map((t) => {
            const act = tipo === t.id;
            return (
              <button key={t.id} onClick={() => setTipo(t.id)} className="rounded-2xl p-4 text-left" style={{ background: act ? T[`${t.color}Soft`] : T.surfaceAlt, border: `1.5px solid ${act ? T[t.color] : T.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: act ? T[t.color] : T.ink }}>{t.id}</p>
                <p style={{ fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.3 }}>{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Redacción */}
      <div className="rounded-3xl p-5 flex flex-col gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Motivo (una línea) *</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Incumplimiento de ruta de recolección y falta de respuesta al vecino" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Descripción de los hechos *</label>
          <textarea value={hechos} onChange={(e) => setHechos(e.target.value)} rows={4} placeholder="Detalla qué ocurrió, cuándo, dónde y qué evidencia existe (fotos, GPS, registros de la app)." className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Medida correctiva solicitada *</label>
          <textarea value={medida} onChange={(e) => setMedida(e.target.value)} rows={3} placeholder="Ej: Repetir la recolección del sector esta semana y participar en la capacitación de trato al usuario." className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Plazo para presentar descargos</label>
            <select value={plazoDescargo} onChange={(e) => setPlazoDescargo(e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
              <option value="3">3 días hábiles</option>
              <option value="5">5 días hábiles</option>
              <option value="10">10 días hábiles</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Evidencia adjunta</label>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              {["Fotos del trabajo", "Registro GPS", "Audio de reclamo"].map((a) => {
                const act = adjuntos.includes(a);
                return (
                  <button key={a} onClick={() => setAdjuntos((arr) => act ? arr.filter((x) => x !== a) : [...arr, a])} className="px-3 py-2 rounded-xl text-[11.5px] font-bold" style={{ background: act ? T.copperSoft : T.surfaceAlt, color: act ? T.copperInk : T.inkSoft, border: `1px solid ${act ? T.copper : T.border}` }}>
                    {act && "✓ "}{a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl p-3.5" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <input type="checkbox" checked={notificar} onChange={(e) => setNotificar(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" style={{ accentColor: T.copper }} />
          <span style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45 }}>Notificar al trabajador por la app y al correo institucional, y dejar copia en la Dirección de Gestión de Personas.</span>
        </label>
      </div>

      {/* Vista previa del documento */}
      {listo && (
        <div className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: T.surfaceAlt, border: `1.5px dashed ${T.borderStrong}` }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: T.inkFaint, letterSpacing: 0.3 }}>VISTA PREVIA DEL DOCUMENTO</p>
          <p style={{ fontSize: 12.5, lineHeight: 1.55 }}>
            En La Serena, a {new Date().toLocaleDateString("es-CL")}, la Ilustre Municipalidad de La Serena comunica a <b>{queja.func}</b>, de {queja.depto}, una <b>amonestación {tipo.toLowerCase()}</b> por: {motivo}. Hechos: {hechos} Medida correctiva: {medida} El funcionario dispone de {plazoDescargo} días hábiles para presentar descargos a través de la plataforma.
          </p>
          {adjuntos.length > 0 && <p style={{ fontSize: 11.5, color: T.inkSoft }}>Evidencia adjunta: {adjuntos.join(", ")}.</p>}
        </div>
      )}

      <div className="flex gap-2.5 flex-wrap">
        <button onClick={onVolver} className="px-5 py-3 rounded-2xl text-[13px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Cancelar</button>
        <button disabled={!listo} onClick={() => setConfirmando(true)} className="px-6 py-3 rounded-2xl text-[13px] font-bold" style={{ background: T.red, color: T.surface, opacity: listo ? 1 : 0.45 }}>Emitir amonestación</button>
      </div>
      {!listo && <p style={{ fontSize: 11.5, color: T.inkFaint }}>Completa motivo, hechos y medida correctiva para poder emitirla.</p>}

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,20,18,0.6)" }} onClick={() => setConfirmando(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-4" style={{ background: T.surface }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: T.redSoft, color: T.red }}><AlertTriangle size={28} /></div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>Confirmar emisión</h3>
            <p style={{ fontSize: 12.5, color: T.inkSoft }}>Se emitirá una amonestación {tipo.toLowerCase()} a {queja.func}. Quedará registrada en su hoja de vida y en la auditoría interna con folio {folio}.</p>
            <div className="flex gap-2.5 w-full">
              <button onClick={() => setConfirmando(false)} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Volver</button>
              <button onClick={() => onEmitir({ tipo, motivo, folio, fecha: new Date().toLocaleDateString("es-CL") })} className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.red, color: T.surface }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
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

/* ---- Seguimiento GPS de terreno y chat interno ---- */
/* ---- GPS EN TERRENO: seguimiento de trabajadores con tareas asignadas ---- */
function PantallaGPSTerreno({ T, soloLectura }) {
  const [sel, setSel] = useState(GPS_TRABAJADORES[0].nombre);
  const [filtro, setFiltro] = useState("Todos");

  const filtros = ["Todos", "En sitio", "En ruta", "No asistió", "Fuera de zona", "Finalizada"];
  const lista = filtro === "Todos" ? GPS_TRABAJADORES : GPS_TRABAJADORES.filter((g) => g.estado === filtro);
  const activo = GPS_TRABAJADORES.find((g) => g.nombre === sel) || GPS_TRABAJADORES[0];

  const cumplen = GPS_TRABAJADORES.filter((g) => g.cumple === true).length;
  const incumplen = GPS_TRABAJADORES.filter((g) => g.cumple === false).length;
  const enProceso = GPS_TRABAJADORES.filter((g) => g.cumple === null).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p style={{ fontSize: 12.5, color: T.inkSoft, maxWidth: 620 }}>
          Ubicación en tiempo real de cada trabajador con tarea asignada. Permite verificar si llegó o no al punto, si está dentro de la zona asignada y si cumplió o no con la tarea.
        </p>
        {soloLectura && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ background: T.oceanSoft, color: T.ocean, fontSize: 11, fontWeight: 700 }}><Eye size={12} /> Sólo lectura</span>}
      </div>

      {/* Resumen de cumplimiento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Cumplen", value: cumplen, color: "sage", icon: CheckCircle2 },
          { label: "No cumplen", value: incumplen, color: "red", icon: XCircle },
          { label: "En proceso", value: enProceso, color: "gold", icon: Clock },
          { label: "Total en terreno", value: GPS_TRABAJADORES.length, color: "ocean", icon: Users },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: T[`${k.color}Soft`], color: T[k.color] }}><k.icon size={15} /></div>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: T.inkSoft, fontWeight: 600 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2"><MapPin size={15} color={T.copper} /><p style={{ fontSize: 13, fontWeight: 700 }}>Mapa de La Serena · posiciones en vivo</p></div>
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: T.inkSoft }}><span className="w-1.5 h-1.5 rounded-full blink-dot" style={{ background: T.sage }} /> Actualizado hace 1 min</span>
        </div>
        <div className="relative h-72" style={{ background: `repeating-linear-gradient(0deg, ${T.bgAlt}, ${T.bgAlt} 31px, transparent 31px, transparent 32px), repeating-linear-gradient(90deg, ${T.bgAlt}, ${T.bgAlt} 31px, transparent 31px, transparent 32px), ${T.surfaceAlt}` }}>
          {/* Línea de costa referencial */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path d="M0,88 C18,84 26,94 42,90 C58,86 70,96 100,92 L100,100 L0,100 Z" fill={T.oceanSoft} opacity="0.75" />
          </svg>
          {GPS_TRABAJADORES.map((g) => {
            const color = T[GPS_COLOR_ESTADO[g.estado]];
            const act = g.nombre === sel;
            return (
              <button key={g.rut} onClick={() => setSel(g.nombre)} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${g.x}%`, top: `${g.y}%` }}>
                <span className={`rounded-full flex items-center justify-center ${g.estado === "En ruta" ? "blink-dot" : ""}`} style={{ width: act ? 30 : 22, height: act ? 30 : 22, background: color, color: "#fff", border: `2.5px solid ${T.surface}`, boxShadow: act ? `0 0 0 5px ${color}33` : "none", fontSize: 9.5, fontWeight: 800 }}>
                  {initials(g.nombre)}
                </span>
                {act && <span className="px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 9.5, fontWeight: 700 }}>{g.nombre}</span>}
              </button>
            );
          })}
        </div>
        {/* Leyenda */}
        <div className="px-4 py-3 flex flex-wrap gap-3" style={{ borderTop: `1px solid ${T.border}` }}>
          {Object.entries(GPS_COLOR_ESTADO).map(([est, c]) => (
            <span key={est} className="flex items-center gap-1.5" style={{ fontSize: 11, color: T.inkSoft, fontWeight: 600 }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: T[c] }} /> {est}</span>
          ))}
        </div>
      </div>

      {/* Detalle del trabajador seleccionado */}
      <div className="rounded-3xl p-5 flex flex-col gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T[GPS_COLOR_ESTADO[activo.estado]]}` }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 13 }}>{initials(activo.nombre)}</div>
            <div>
              <p style={{ fontSize: 14.5, fontWeight: 700 }}>{activo.nombre}</p>
              <p style={{ fontSize: 11.5, color: T.inkSoft }}>RUT {activo.rut} · Cuadrilla {activo.cuadrilla} · Delegación {activo.delegacion}</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full" style={{ background: T[`${GPS_COLOR_ESTADO[activo.estado]}Soft`], color: T[GPS_COLOR_ESTADO[activo.estado]], fontSize: 11.5, fontWeight: 800 }}>{activo.estado}</span>
        </div>

        <div className="rounded-2xl p-3.5" style={{ background: T.surfaceAlt }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{activo.tarea}</p>
          <p style={{ fontSize: 12, color: T.inkSoft }}>{activo.direccion}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MiniStat T={T} icon={Clock} label="Hora asignada" value={`${activo.horaAsignada} hrs`} />
          <MiniStat T={T} icon={MapPin} label="Marcó llegada" value={activo.horaLlegada ? `${activo.horaLlegada} hrs` : "Sin registro"} warn={!activo.horaLlegada} />
          <MiniStat T={T} icon={Navigation} label="Precisión GPS" value={activo.distancia} warn={activo.cumple === false} />
          <MiniStat T={T} icon={Radio} label="Última señal" value={activo.senal} warn={activo.senal.includes("h")} />
        </div>

        <div className="flex flex-wrap gap-2">
          {activo.cumple === true && <TagChip T={T} icon={CheckCircle2} text="Cumple con la tarea asignada" color="sage" />}
          {activo.cumple === false && <TagChip T={T} icon={AlertTriangle} text="No cumple — requiere justificación" color="red" />}
          {activo.cumple === null && <TagChip T={T} icon={Clock} text="En proceso, aún dentro del horario" color="gold" />}
          <TagChip T={T} icon={Camera} text={activo.evidenciaAntes ? "Foto ANTES recibida" : "Sin foto ANTES"} color={activo.evidenciaAntes ? "sage" : "red"} />
          <TagChip T={T} icon={Camera} text={activo.evidenciaDespues ? "Foto DESPUÉS recibida" : "Sin foto DESPUÉS"} color={activo.evidenciaDespues ? "sage" : "gold"} />
          <TagChip T={T} icon={Gauge} text={`Batería ${activo.bateria}%`} color={activo.bateria < 20 ? "red" : "ocean"} />
        </div>
      </div>

      {/* Listado con filtros */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {filtros.map((f) => <button key={f} onClick={() => setFiltro(f)} className="px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: filtro === f ? T.copper : T.surfaceAlt, color: filtro === f ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>{f}</button>)}
      </div>
      <div className="flex flex-col gap-2.5">
        {lista.map((g) => {
          const color = T[GPS_COLOR_ESTADO[g.estado]];
          return (
            <button key={g.rut} onClick={() => setSel(g.nombre)} className="rounded-2xl p-4 flex items-center gap-3.5 text-left" style={{ background: T.surface, border: `1.5px solid ${sel === g.nombre ? color : T.border}` }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 13.5, fontWeight: 700 }}>{g.nombre}</p>
                <p style={{ fontSize: 11.5, color: T.inkSoft }}>{g.tarea} · {g.direccion}</p>
              </div>
              <div className="text-right shrink-0">
                <p style={{ fontSize: 11.5, fontWeight: 800, color }}>{g.estado}</p>
                <p style={{ fontSize: 10.5, color: T.inkFaint }}>{g.horaLlegada ? `Llegó ${g.horaLlegada}` : "Sin llegada"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- CHAT INTERNO DEL ADMINISTRADOR ---- */
function PantallaChatAdmin({ T, chatTrabajadores, setChatTrabajadores, chatAdminAlcaldesa, setChatAdminAlcaldesa }) {
  const [canal, setCanal] = useState(Object.keys(chatTrabajadores)[0]);
  const [msg, setMsg] = useState("");
  const esAlcaldesa = canal === "__ALCALDESA__";
  const hilo = esAlcaldesa ? chatAdminAlcaldesa : (chatTrabajadores[canal] || []);
  const finRef = useRef(null);
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [hilo.length, canal]);

  const enviar = () => {
    const t = msg.trim(); if (!t) return;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    if (esAlcaldesa) setChatAdminAlcaldesa((c) => [...c, { from: "admin", texto: t, hora }]);
    else setChatTrabajadores((c) => ({ ...c, [canal]: [...(c[canal] || []), { from: "admin", texto: t, hora }] }));
    setMsg("");
  };

  const nombreCanal = esAlcaldesa ? "Alcaldesa" : canal;

  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: 12.5, color: T.inkSoft, maxWidth: 640 }}>
        Comunicación directa con cada trabajador en terreno y con la Alcaldesa. Todas estas conversaciones son visibles para la Alcaldesa, de modo que nada quede oculto.
      </p>

      <div className="rounded-3xl overflow-hidden flex flex-col sm:flex-row" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 500 }}>
        {/* Canales */}
        <div className="sm:w-60 shrink-0 overflow-y-auto p-2.5 flex flex-col gap-1" style={{ borderRight: `1px solid ${T.border}` }}>
          <p className="px-2.5 pt-1 pb-1.5" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", color: T.inkFaint }}>Jefatura superior</p>
          <button onClick={() => setCanal("__ALCALDESA__")} className="text-left px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: esAlcaldesa ? T.copper : "transparent", color: esAlcaldesa ? T.surface : T.ink }}>
            <Landmark size={14} className="shrink-0" />
            <span style={{ fontSize: 12.5, fontWeight: esAlcaldesa ? 700 : 500 }}>Alcaldesa</span>
          </button>

          <p className="px-2.5 pt-3 pb-1.5" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", color: T.inkFaint }}>Trabajadores en terreno</p>
          {Object.keys(chatTrabajadores).map((n) => {
            const act = canal === n;
            const ultimo = chatTrabajadores[n][chatTrabajadores[n].length - 1];
            const pendiente = ultimo?.from === "trabajador";
            return (
              <button key={n} onClick={() => setCanal(n)} className="text-left px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: act ? T.copper : "transparent", color: act ? T.surface : T.ink }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: act ? "rgba(255,255,255,0.22)" : T.surfaceAlt, fontSize: 10, fontWeight: 700 }}>{initials(n)}</span>
                <span style={{ fontSize: 12.5, fontWeight: act ? 700 : 500, flex: 1, lineHeight: 1.2 }}>{n}</span>
                {pendiente && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: act ? T.surface : T.red }} />}
              </button>
            );
          })}
        </div>

        {/* Hilo */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 11.5 }}>{esAlcaldesa ? <Landmark size={15} /> : initials(nombreCanal)}</div>
            <div className="flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 700 }}>{nombreCanal}</p>
              <p style={{ fontSize: 11, color: T.inkSoft }}>{esAlcaldesa ? "Canal directo con la máxima autoridad comunal" : "Trabajador municipal en terreno"}</p>
            </div>
            {!esAlcaldesa && <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: T.oceanSoft, color: T.ocean, fontSize: 10.5, fontWeight: 700 }}><Eye size={11} /> Visible para la Alcaldesa</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {hilo.length === 0 && <p style={{ fontSize: 12.5, color: T.inkFaint, textAlign: "center", marginTop: 20 }}>Sin mensajes en este canal.</p>}
            {hilo.map((m, i) => {
              const propio = m.from === "admin";
              return (
                <div key={i} className="max-w-[78%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: propio ? "flex-end" : "flex-start", background: propio ? T.copper : T.surfaceAlt, color: propio ? T.surface : T.ink }}>
                  <p style={{ fontSize: 13 }}>{m.texto}</p>
                  {m.hora && <p style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.hora}</p>}
                </div>
              );
            })}
            <div ref={finRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Mensaje para ${nombreCanal}`} className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><MessageCircle size={16} /></button>
          </form>
        </div>
      </div>
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
  const [filas, setFilas] = useState(SGR_TUBO);
  const [abierto, setAbierto] = useState(false);
  const vacio = { fecha: "", actividad: "", tipo: "Ext", responsable: "", territorio: "", compromiso: "", area: "", estatus: "Ingresado" };
  const [nuevo, setNuevo] = useState(vacio);
  const [editIdx, setEditIdx] = useState(null);

  const set = (k, v) => setNuevo((n) => ({ ...n, [k]: v }));
  const listo = nuevo.fecha && nuevo.actividad.trim() && nuevo.responsable.trim();

  const guardar = () => {
    if (!listo) return;
    if (editIdx !== null) {
      setFilas((f) => f.map((r, i) => (i === editIdx ? nuevo : r)));
    } else {
      setFilas((f) => [nuevo, ...f]);
    }
    setNuevo(vacio); setAbierto(false); setEditIdx(null);
  };

  const editar = (i) => { setNuevo(filas[i]); setEditIdx(i); setAbierto(true); };
  const eliminar = (i) => setFilas((f) => f.filter((_, j) => j !== i));
  const cambiarEstado = (i, estatus) => setFilas((f) => f.map((r, j) => (j === i ? { ...r, estatus } : r)));

  const areas = ["Tránsito", "Áreas verdes", "Sección alumbrado", "Diserco", "Diserco / Aseo", "Diserco / Maquinaria", "Área mujeres", "Obras", "DIDECO"];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <p style={{ fontSize: 12, color: T.inkSoft, flex: 1 }}>Agenda colectiva de compromisos: cada solicitud cambia de estado — Ingresado → Pendiente → En proceso → Realizado. Puedes agregar, editar y cerrar registros aquí mismo.</p>
        <button onClick={() => { setNuevo(vacio); setEditIdx(null); setAbierto((v) => !v); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[12.5px] font-bold whitespace-nowrap shrink-0" style={{ background: abierto ? T.surfaceAlt : T.copper, color: abierto ? T.inkSoft : T.surface, border: `1px solid ${abierto ? T.border : T.copper}` }}>
          {abierto ? <><X size={14} /> Cerrar formulario</> : <><Plus size={15} /> Agregar registro</>}
        </button>
      </div>

      {abierto && (
        <div className="rounded-3xl p-5 flex flex-col gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.copper}` }}>
          <p style={{ fontSize: 13.5, fontWeight: 700 }}>{editIdx !== null ? "Editar registro del tubo" : "Nuevo registro del tubo de trabajo"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Fecha de ingreso *</label>
              <input type="date" value={nuevo.fecha.includes("/") ? "" : nuevo.fecha} onChange={(e) => set("fecha", e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Tipo</label>
              <select value={nuevo.tipo} onChange={(e) => set("tipo", e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
                <option value="Ext">Externo (vecino u organización)</option>
                <option value="Int">Interno (municipal)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Fecha comprometida</label>
              <input type="date" value={nuevo.compromiso.includes("/") ? "" : nuevo.compromiso} onChange={(e) => set("compromiso", e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Actividad o solicitud *</label>
            <textarea value={nuevo.actividad} onChange={(e) => set("actividad", e.target.value)} rows={2} placeholder="Ej: Solicitud de poda en sector Uruguay con Pasaje Totoral" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Responsable *</label>
              <input list="sgr-responsables" value={nuevo.responsable} onChange={(e) => set("responsable", e.target.value)} placeholder="Nombre del funcionario" className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
              <datalist id="sgr-responsables">
                {SGR_SEMAFORO.map((r) => <option key={r.responsable} value={r.responsable} />)}
                {SGR_FUNCIONARIOS.map((f) => <option key={f.nombre} value={f.nombre} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Territorio</label>
              <input list="sgr-territorios" value={nuevo.territorio} onChange={(e) => set("territorio", e.target.value)} placeholder="Ej: Latorre" className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
              <datalist id="sgr-territorios">
                {SGR_DELEGACIONES.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Área</label>
              <select value={nuevo.area} onChange={(e) => set("area", e.target.value)} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px]" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }}>
                <option value="">Seleccionar área</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>Estado inicial</label>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {Object.keys(SGR_ESTATUS_COLOR).map((e) => {
                const act = nuevo.estatus === e; const c = SGR_ESTATUS_COLOR[e];
                return <button key={e} onClick={() => set("estatus", e)} className="px-3.5 py-2 rounded-full text-[12px] font-bold" style={{ background: act ? T[c] : T.surfaceAlt, color: act ? T.surface : T.inkSoft, border: `1px solid ${act ? T[c] : T.border}` }}>{e}</button>;
              })}
            </div>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => { setAbierto(false); setEditIdx(null); setNuevo(vacio); }} className="px-5 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>Cancelar</button>
            <button onClick={guardar} disabled={!listo} className="px-5 py-2.5 rounded-2xl text-[12.5px] font-bold" style={{ background: T.copper, color: T.surface, opacity: listo ? 1 : 0.45 }}>{editIdx !== null ? "Guardar cambios" : "Agregar al tubo"}</button>
          </div>
          {!listo && <p style={{ fontSize: 11, color: T.inkFaint }}>Completa fecha, actividad y responsable.</p>}
        </div>
      )}

      <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surfaceAlt }}>{["Fecha", "Actividad / solicitud", "Territorio", "Responsable", "Compromiso", "Área", "Estado", "Acciones"].map((h) => <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10.5, fontWeight: 700, color: T.inkFaint, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{filas.map((r, i) => {
              const color = SGR_ESTATUS_COLOR[r.estatus] || "gold"; return (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.fecha}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12.5, maxWidth: 260 }}>{r.actividad}<span style={{ fontSize: 10.5, color: T.inkFaint }}> · {r.tipo}</span></td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.territorio}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{r.responsable}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.compromiso}</td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: T.inkFaint, whiteSpace: "nowrap" }}>{r.area}</td>
                  <td className="px-4 py-3">
                    <select value={r.estatus} onChange={(e) => cambiarEstado(i, e.target.value)} className="px-2.5 py-1 rounded-full outline-none" style={{ background: T[`${color}Soft`], color: T[color], fontSize: 11, fontWeight: 700, border: `1px solid ${T[color]}33` }}>
                      {Object.keys(SGR_ESTATUS_COLOR).map((e) => <option key={e} value={e} style={{ background: T.surface, color: T.ink }}>{e}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => editar(i)} title="Editar" className="p-1.5 rounded-lg" style={{ background: T.surfaceAlt, color: T.gold }}><Edit3 size={13} /></button>
                      <button onClick={() => eliminar(i)} title="Eliminar" className="p-1.5 rounded-lg" style={{ background: T.redSoft, color: T.red }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <p style={{ fontSize: 11.5, color: T.inkFaint }}>{filas.length} registros en el tubo de trabajo</p>
        </div>
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
const SISTEMA_ITEMS = [
  { id: "OFFLINE", icon: WifiOff, titulo: "Modo de operación offline", desc: "Activo — 3 trabajadores en terreno sincronizando datos guardados sin señal.", color: "ocean" },
  { id: "BIOMETRIA", icon: Fingerprint, titulo: "Autenticación biométrica", desc: "Habilitada en la App móvil (FaceID / huella) con cifrado de extremo a extremo.", color: "sage" },
  { id: "RESPALDO", icon: Cloud, titulo: "Respaldo híbrido", desc: "Nube (AWS/Azure) + respaldo automático cada hora en servidores municipales. Última sincronización: hace 12 min.", color: "gold" },
];

function PantallaSistema({ T }) {
  const [detalle, setDetalle] = useState(null);

  if (detalle === "OFFLINE") return <SistemaOffline T={T} onVolver={() => setDetalle(null)} />;
  if (detalle === "BIOMETRIA") return <SistemaBiometria T={T} onVolver={() => setDetalle(null)} />;
  if (detalle === "RESPALDO") return <SistemaRespaldo T={T} onVolver={() => setDetalle(null)} />;

  return (
    <div className="flex flex-col gap-3.5 max-w-2xl">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Componentes invisibles para el vecino, vitales para la resiliencia y seguridad de la plataforma. Toca cada uno para ver su página de detalle.</p>
      {SISTEMA_ITEMS.map((it) => {
        const Icon = it.icon; const accent = T[it.color]; const accentSoft = T[`${it.color}Soft`]; return (
          <button key={it.id} onClick={() => setDetalle(it.id)} className="rounded-3xl p-5 flex items-center gap-4 text-left" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accentSoft, color: accent }}><Icon size={22} /></div>
            <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 700 }}>{it.titulo}</p><p style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{it.desc}</p></div>
            <ChevronRight size={17} color={T.inkFaint} className="shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function SistemaHeader({ T, onVolver, icon: Icon, color, titulo, bajada, estado }) {
  const accent = T[color], accentSoft = T[`${color}Soft`];
  return (
    <div className="flex flex-col gap-4">
      <button onClick={onVolver} className="flex items-center gap-1.5 w-fit" style={{ color: T.inkSoft, fontSize: 12.5, fontWeight: 600 }}><ChevronLeft size={15} /> Volver a Sistema</button>
      <div className="rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accentSoft, color: accent }}><Icon size={26} /></div>
        <div className="flex-1">
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>{titulo}</h2>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{bajada}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full w-fit shrink-0" style={{ background: accentSoft, color: accent, fontSize: 11.5, fontWeight: 800 }}>{estado}</span>
      </div>
    </div>
  );
}

function SistemaCard({ T, children, titulo }) {
  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
      {titulo && <p style={{ fontSize: 13.5, fontWeight: 700 }}>{titulo}</p>}
      {children}
    </div>
  );
}

/* ---- Página 1: Modo de operación offline ---- */
function SistemaOffline({ T, onVolver }) {
  const enTerreno = [
    { nombre: "Pedro Ilabaca R.", zona: "Los Aromos 482", pendientes: 4, desde: "09:12", estado: "Sin señal" },
    { nombre: "Jorge Peralta M.", zona: "Sector rural El Romero", pendientes: 7, desde: "08:40", estado: "Sin señal" },
    { nombre: "Luis Andrade M.", zona: "Quebrada La Pampa", pendientes: 2, desde: "10:05", estado: "Señal intermitente" },
  ];
  const totalPend = enTerreno.reduce((s, t) => s + t.pendientes, 0);
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <SistemaHeader T={T} onVolver={onVolver} icon={WifiOff} color="ocean" titulo="Modo de operación offline"
        bajada="La aplicación de terreno sigue funcionando sin cobertura: guarda fichajes, fotos y formularios en el teléfono y los sincroniza apenas recupera señal."
        estado="Activo" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MiniStat T={T} icon={Users} label="Trabajadores offline" value={enTerreno.length} />
        <MiniStat T={T} icon={Package} label="Registros en cola" value={totalPend} warn={totalPend > 10} />
        <MiniStat T={T} icon={Clock} label="Máx. tiempo sin señal" value="2 h 35 min" />
        <MiniStat T={T} icon={CheckCircle2} label="Sincronizaciones hoy" value="47 de 47" />
      </div>

      <SistemaCard T={T} titulo="Trabajadores operando sin señal">
        {enTerreno.map((t, i) => (
          <div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surface, fontWeight: 700, fontSize: 11 }}>{initials(t.nombre)}</div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 700 }}>{t.nombre}</p>
              <p style={{ fontSize: 11.5, color: T.inkSoft }}>{t.zona} · sin conexión desde las {t.desde} hrs</p>
            </div>
            <div className="text-right shrink-0">
              <p style={{ fontSize: 12, fontWeight: 800, color: T.ocean }}>{t.pendientes}</p>
              <p style={{ fontSize: 10, color: T.inkFaint }}>en cola</p>
            </div>
          </div>
        ))}
      </SistemaCard>

      <SistemaCard T={T} titulo="Qué se guarda sin conexión">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {["Fichaje de entrada, colación y salida", "Fotos del antes y el después con GPS y hora", "Formularios de cierre y firma del vecino", "Registro de imprevistos en terreno"].map((d, i) => (
            <div key={i} className="flex items-start gap-2"><Check size={14} color={T.sage} className="shrink-0 mt-0.5" /><span style={{ fontSize: 12.5 }}>{d}</span></div>
          ))}
        </div>
      </SistemaCard>

      <SistemaCard T={T} titulo="Cómo funciona la sincronización">
        {[
          { n: 1, t: "Captura local cifrada", d: "El dato se guarda en el teléfono con cifrado AES-256 y un sello de hora que no puede modificarse." },
          { n: 2, t: "Cola de envío ordenada", d: "Cada registro entra a una cola en el orden en que ocurrió, para que la trazabilidad no se altere." },
          { n: 3, t: "Reconexión automática", d: "Al detectar señal, la app envía la cola en segundo plano sin que el trabajador tenga que hacer nada." },
          { n: 4, t: "Confirmación y verificación", d: "El servidor responde con un hash de confirmación que queda registrado en la auditoría interna." },
        ].map((p) => (
          <div key={p.n} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: T.oceanSoft, color: T.ocean, fontSize: 12, fontWeight: 800 }}>{p.n}</span>
            <div><p style={{ fontSize: 13, fontWeight: 700 }}>{p.t}</p><p style={{ fontSize: 12, color: T.inkSoft }}>{p.d}</p></div>
          </div>
        ))}
      </SistemaCard>
    </div>
  );
}

/* ---- Página 2: Autenticación biométrica ---- */
function SistemaBiometria({ T, onVolver }) {
  const [faceId, setFaceId] = useState(true);
  const [huella, setHuella] = useState(true);
  const [doblePaso, setDoblePaso] = useState(true);

  const registros = [
    { quien: "Pedro Ilabaca R.", metodo: "Huella dactilar", hora: "08:42", disp: "Android · Motorola G54", ok: true },
    { quien: "Marcela Tapia V.", metodo: "FaceID", hora: "08:15", disp: "iPhone 13", ok: true },
    { quien: "Katherine Solís V.", metodo: "Huella dactilar", hora: "07:58", disp: "Android · Samsung A34", ok: true },
    { quien: "Desconocido", metodo: "Huella no reconocida", hora: "07:31", disp: "Android · dispositivo no registrado", ok: false },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <SistemaHeader T={T} onVolver={onVolver} icon={Fingerprint} color="sage" titulo="Autenticación biométrica"
        bajada="El acceso a la App móvil se valida con huella dactilar o reconocimiento facial del propio dispositivo, con cifrado de extremo a extremo."
        estado="Habilitada" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MiniStat T={T} icon={UserCheck} label="Usuarios inscritos" value="184" />
        <MiniStat T={T} icon={CheckCircle2} label="Accesos válidos hoy" value="312" />
        <MiniStat T={T} icon={AlertTriangle} label="Intentos rechazados" value="3" warn />
        <MiniStat T={T} icon={Lock} label="Cifrado" value="AES-256 E2E" />
      </div>

      <SistemaCard T={T} titulo="Métodos habilitados">
        {[
          { label: "FaceID / reconocimiento facial", desc: "Disponible en dispositivos iOS compatibles", on: faceId, set: setFaceId },
          { label: "Huella dactilar", desc: "Disponible en dispositivos Android e iOS", on: huella, set: setHuella },
          { label: "Doble factor para perfiles administrativos", desc: "Biometría + código de 6 dígitos al correo institucional", on: doblePaso, set: setDoblePaso },
        ].map((m, i) => (
          <div key={i} className="rounded-2xl p-3.5 flex items-center justify-between gap-3" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <div className="flex-1"><p style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{m.desc}</p></div>
            <button onClick={() => m.set((v) => !v)}><Switch T={T} on={m.on} /></button>
          </div>
        ))}
      </SistemaCard>

      <SistemaCard T={T} titulo="Últimos accesos biométricos">
        {registros.map((r, i) => (
          <div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: T.surfaceAlt, border: `1px solid ${r.ok ? T.border : T.red}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.ok ? T.sageSoft : T.redSoft, color: r.ok ? T.sage : T.red }}>
              {r.ok ? <Fingerprint size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 700 }}>{r.quien}</p>
              <p style={{ fontSize: 11.5, color: T.inkSoft }}>{r.metodo} · {r.disp}</p>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>{r.hora}</span>
          </div>
        ))}
      </SistemaCard>

      <SistemaCard T={T} titulo="Protección de los datos biométricos">
        <div className="flex flex-col gap-2">
          {[
            "La huella y el rostro nunca salen del teléfono: el municipio sólo recibe una confirmación firmada.",
            "No se almacena ninguna imagen ni plantilla biométrica en los servidores municipales.",
            "Si el dispositivo se pierde, el acceso se revoca desde Usuarios sin afectar la cuenta.",
          ].map((d, i) => <div key={i} className="flex items-start gap-2"><ShieldCheck size={14} color={T.sage} className="shrink-0 mt-0.5" /><span style={{ fontSize: 12.5 }}>{d}</span></div>)}
        </div>
      </SistemaCard>
    </div>
  );
}

/* ---- Página 3: Respaldo híbrido ---- */
function SistemaRespaldo({ T, onVolver }) {
  const historial = [
    { hora: "13:00", destino: "Nube AWS · Región São Paulo", tamano: "1,8 GB", estado: "Correcto" },
    { hora: "12:00", destino: "Servidor municipal · Sala TI La Serena", tamano: "1,8 GB", estado: "Correcto" },
    { hora: "11:00", destino: "Nube Azure · Región Brazil South", tamano: "1,7 GB", estado: "Correcto" },
    { hora: "10:00", destino: "Servidor municipal · Sala TI La Serena", tamano: "1,7 GB", estado: "Correcto" },
    { hora: "09:00", destino: "Nube AWS · Región São Paulo", tamano: "1,7 GB", estado: "Con reintento" },
  ];
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <SistemaHeader T={T} onVolver={onVolver} icon={Cloud} color="gold" titulo="Respaldo híbrido"
        bajada="Los datos se respaldan cada hora en la nube (AWS/Azure) y en servidores dentro del municipio, de modo que una falla en uno no implique pérdida de información."
        estado="Última sincronización: hace 12 min" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MiniStat T={T} icon={Clock} label="Frecuencia" value="Cada 1 hora" />
        <MiniStat T={T} icon={Database} label="Volumen respaldado" value="1,8 GB" />
        <MiniStat T={T} icon={CheckCircle2} label="Respaldos correctos (30 d)" value="718 de 720" />
        <MiniStat T={T} icon={TrendingUp} label="Tiempo de recuperación" value="< 15 min" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Cloud, color: "ocean", titulo: "Copia en la nube", items: ["AWS · São Paulo (principal)", "Azure · Brazil South (espejo)", "Cifrado en tránsito y en reposo", "Retención de 90 días"] },
          { icon: Server, color: "sage", titulo: "Copia en servidores municipales", items: ["Sala TI del edificio consistorial", "Copia completa diaria a las 02:00", "Aislada de internet (air-gapped)", "Retención de 30 días"] },
        ].map((b, i) => (
          <div key={i} className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T[`${b.color}Soft`], color: T[b.color] }}><b.icon size={18} /></div>
              <p style={{ fontSize: 13.5, fontWeight: 700 }}>{b.titulo}</p>
            </div>
            {b.items.map((it, j) => <div key={j} className="flex items-start gap-2"><Check size={13} color={T[b.color]} className="shrink-0 mt-0.5" /><span style={{ fontSize: 12 }}>{it}</span></div>)}
          </div>
        ))}
      </div>

      <SistemaCard T={T} titulo="Historial de respaldos de hoy">
        {historial.map((h, i) => {
          const ok = h.estado === "Correcto";
          return (
            <div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: ok ? T.sageSoft : T.goldSoft, color: ok ? T.sage : T.gold }}>
                {ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12.5, fontWeight: 700 }}>{h.destino}</p>
                <p style={{ fontSize: 11, color: T.inkSoft }}>{h.hora} hrs · {h.tamano}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full shrink-0" style={{ background: ok ? T.sageSoft : T.goldSoft, color: ok ? T.sage : T.gold, fontSize: 10.5, fontWeight: 700 }}>{h.estado}</span>
            </div>
          );
        })}
      </SistemaCard>

      <SistemaCard T={T} titulo="Plan de recuperación ante desastres">
        <div className="flex flex-col gap-2">
          {[
            "Si cae la nube, el sistema opera desde los servidores municipales sin interrumpir la atención al vecino.",
            "Si cae la sala TI del municipio, la plataforma sigue funcionando desde la nube.",
            "Prueba de restauración completa cada trimestre, con acta firmada por la Dirección de Control.",
          ].map((d, i) => <div key={i} className="flex items-start gap-2"><ShieldCheck size={14} color={T.gold} className="shrink-0 mt-0.5" /><span style={{ fontSize: 12.5 }}>{d}</span></div>)}
        </div>
      </SistemaCard>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PANEL DEL ALCALDE
--------------------------------------------------------------------- */
function AlcaldePanel({ T, contenidos, incidentes, chatDirecciones, setChatDirecciones, chatTrabajadores, chatAdminAlcaldesa, setChatAdminAlcaldesa, vista, setVista }) {

  const tabs = [
    { id: "RESUMEN", label: "Resumen comunal", icon: Gauge },
    { id: "OPERACION", label: "Vista del Admin", icon: Eye },
    { id: "TERRENO", label: "Trabajadores en terreno", icon: MapPin },
    { id: "CHATS", label: "Delegaciones y Direcciones", icon: MessageCircle },
    { id: "SUPERVISION", label: "Supervisión de chats", icon: ShieldCheck },
  ];

  return (
    <div className="pt-5 md:pt-7 flex flex-col gap-6">
      {/* Encabezado */}
      <div className="rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: `linear-gradient(135deg, ${T.copperSoft}, ${T.surface})`, border: `1.5px solid ${T.border}` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><Landmark size={22} /></div>
        <div className="flex-1">
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Panel de la Alcaldesa</h1>
          <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>Visión completa de la gestión municipal: lo mismo que ve el Administrador, en modo de sólo lectura, más los canales directos con cada delegación, dirección y con el propio Administrador.</p>
        </div>
      </div>

      {/* Navegación */}
      <div className="rounded-3xl p-3 flex flex-wrap gap-2 w-full" style={{ background: T.surfaceAlt, border: `1.5px solid ${T.border}` }}>
        {tabs.map((t) => {
          const active = vista === t.id; const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setVista(t.id)}
              className="px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 transition-all active:scale-95"
              style={{ background: active ? T.copper : T.surface, color: active ? T.surface : T.inkSoft, border: `1.5px solid ${active ? T.copper : T.border}`, boxShadow: active ? "0 4px 14px rgba(196,18,48,0.22)" : "none" }}>
              <Icon size={16} color={active ? T.surface : T.copper} /><span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {vista === "RESUMEN" && <AlcaldesaResumen T={T} contenidos={contenidos} incidentes={incidentes} />}
      {vista === "OPERACION" && <AlcaldesaOperacion T={T} incidentes={incidentes} />}
      {vista === "TERRENO" && <PantallaGPSTerreno T={T} soloLectura />}
      {vista === "CHATS" && <AlcaldesaChats T={T} chats={chatDirecciones} setChats={setChatDirecciones} />}
      {vista === "SUPERVISION" && (
        <AlcaldesaSupervision T={T} chatTrabajadores={chatTrabajadores}
          chatAdminAlcaldesa={chatAdminAlcaldesa} setChatAdminAlcaldesa={setChatAdminAlcaldesa} />
      )}
    </div>
  );
}

/* ---- Alcaldesa · Resumen comunal ---- */
function AlcaldesaResumen({ T, contenidos, incidentes }) {
  const total = PRESUPUESTO.reduce((s, p) => s + p.ejecutado, 0);
  let acumulado = 0;
  const criticos = GPS_TRABAJADORES.filter((g) => g.cumple === false);
  const alertasCalidad = QUEJAS.length;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle T={T}>Dashboard macro de la comuna</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { l: "Tiempo promedio de respuesta", v: "2,4 días", quien: `Más lento: ${GPS_TRABAJADORES[4].cuadrilla}` },
            { l: "Solicitudes resueltas este mes", v: "87%", quien: `Mejor área: ${PRESUPUESTO[1].depto}` },
            { l: "Satisfacción vecinal", v: "4,3 ★", quien: `Mejor evaluado: ${WORKERS_PERFIL[1].nombre}` },
            { l: "Trabajadores en terreno", v: GPS_TRABAJADORES.length, quien: GPS_TRABAJADORES.filter((g) => g.estado === "En sitio").map((g) => g.nombre.split(" ")[0]).join(", ") + " en sitio" },
            { l: "Incumplimientos hoy", v: criticos.length, warn: criticos.length > 0, quien: criticos.map((g) => g.nombre).join(" · ") || "Nadie" },
            { l: "Alertas de calidad", v: alertasCalidad, warn: alertasCalidad > 0, quien: QUEJAS.map((q) => q.func).join(" · ") },
          ].map((k, i) => (
            <div key={i} className="rounded-3xl p-4 flex flex-col" style={{ background: T.surface, border: `1.5px solid ${k.warn ? T.red : T.border}` }}>
              <p style={{ fontSize: 11, color: T.inkFaint, fontWeight: 700, lineHeight: 1.3 }}>{k.l}</p>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, marginTop: 4, color: k.warn ? T.red : T.ink }}>{k.v}</p>
              <p style={{ fontSize: 10.5, color: k.warn ? T.red : T.inkSoft, marginTop: 4, lineHeight: 1.3, fontWeight: 600 }}>{k.quien}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quién está a cargo de qué */}
      <section>
        <SectionTitle T={T}>Quién está a cargo hoy</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-3xl p-5 flex items-center gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 12 }}>{initials(ADMIN_ACTUAL.nombre)}</div>
            <div className="flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 700 }}>{ADMIN_ACTUAL.nombre}</p>
              <p style={{ fontSize: 11.5, color: T.inkSoft }}>{ADMIN_ACTUAL.cargo}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full shrink-0" style={{ background: T.sageSoft, color: T.sage, fontSize: 10.5, fontWeight: 700 }}>En turno</span>
          </div>
          {GPS_TRABAJADORES.slice(0, 5).map((g) => {
            const color = T[GPS_COLOR_ESTADO[g.estado]];
            return (
              <div key={g.rut} className="rounded-3xl p-5 flex items-center gap-3.5" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: T.surfaceAlt, fontWeight: 700, fontSize: 12 }}>{initials(g.nombre)}</div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13.5, fontWeight: 700 }}>{g.nombre}</p>
                  <p style={{ fontSize: 11.5, color: T.inkSoft }}>{g.tarea} · {g.direccion}</p>
                  <p style={{ fontSize: 10.5, color: T.inkFaint }}>Delegación {g.delegacion} · cuadrilla {g.cuadrilla}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full shrink-0" style={{ background: T[`${GPS_COLOR_ESTADO[g.estado]}Soft`], color, fontSize: 10.5, fontWeight: 700 }}>{g.estado}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alertas que requieren su atención */}
      <section>
        <SectionTitle T={T}>Requiere su atención</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {criticos.map((g) => (
            <div key={g.rut} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.surface, border: `1.5px solid ${T.red}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.redSoft, color: T.red }}><AlertTriangle size={16} /></div>
              <div className="flex-1">
                <p style={{ fontSize: 13.5, fontWeight: 700 }}>{g.nombre} — {g.estado}</p>
                <p style={{ fontSize: 12, color: T.inkSoft }}>{g.tarea} · {g.direccion} · {g.distancia}</p>
              </div>
            </div>
          ))}
          {(incidentes || []).filter((i) => !i.publicado).map((i, idx) => (
            <div key={`inc-${idx}`} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.surface, border: `1.5px solid ${T.gold}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.goldSoft, color: T.gold }}><Bolt size={16} /></div>
              <div className="flex-1">
                <p style={{ fontSize: 13.5, fontWeight: 700 }}>Incidente sin alerta publicada: {i.tipo}</p>
                <p style={{ fontSize: 12, color: T.inkSoft }}>{i.lugar} · aún no se comunica a los vecinos</p>
              </div>
            </div>
          ))}
          {criticos.length === 0 && <p style={{ fontSize: 12.5, color: T.inkSoft }}>Sin alertas críticas en este momento.</p>}
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
        <SectionTitle T={T}>Últimas publicaciones a la comunidad</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {(contenidos || []).slice(0, 4).map((c, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
              <span className="px-2.5 py-1 rounded-full shrink-0" style={{ background: T[`${c.tag}Soft`], color: T[c.tag], fontSize: 10.5, fontWeight: 800 }}>{c.tipo}</span>
              <div className="flex-1"><p style={{ fontSize: 13, fontWeight: 700 }}>{c.titulo}</p><p style={{ fontSize: 11.5, color: T.inkSoft }}>{c.autor}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---- Alcaldesa · Vista espejo del Admin (sólo lectura) ---- */
function AlcaldesaOperacion({ T, incidentes }) {
  const [sub, setSub] = useState("SOLICITUDES");
  const [openKpi, setOpenKpi] = useState(null);
  const kpiCounts = { revision: 34, aceptados: 128, programados: 61, transito: 19, rechazados: 7, finalizados: 902, auditoria: 5 };

  const subs = [
    { id: "SOLICITUDES", label: "Solicitudes" },
    { id: "CUADRILLAS", label: "Trabajadores" },
    { id: "CALIDAD", label: "Auditoría calidad" },
    { id: "CRISIS", label: "Crisis" },
    { id: "PRESUPUESTO", label: "Presupuesto" },
    { id: "CONTROL", label: "Auditoría interna" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.oceanSoft, border: `1px solid ${T.ocean}33` }}>
        <Eye size={17} color={T.ocean} className="shrink-0 mt-0.5" />
        <p style={{ fontSize: 12.5, color: T.ocean, fontWeight: 600 }}>
          Está viendo exactamente la misma información que maneja el Administrador, en modo de sólo lectura: puede revisarlo todo sin entrar al panel de Admin y sin poder modificar sus registros.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {subs.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} className="px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap" style={{ background: sub === s.id ? T.copper : T.surfaceAlt, color: sub === s.id ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>{s.label}</button>
        ))}
      </div>

      {sub === "SOLICITUDES" && (
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: 12.5, color: T.inkSoft }}>Estado general de todas las solicitudes de la comuna. Toca un estado para ver el listado completo.</p>
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
        </div>
      )}

      {sub === "CUADRILLAS" && <PantallaCuadrillas T={T} />}
      {sub === "CALIDAD" && <PantallaAuditoria T={T} soloLectura />}
      {sub === "CRISIS" && <AlcaldesaCrisisLectura T={T} incidentes={incidentes} />}
      {sub === "PRESUPUESTO" && <PantallaPresupuesto T={T} />}
      {sub === "CONTROL" && <PantallaControl T={T} />}

      {openKpi && <ModalListado T={T} title={KPIS.find((k) => k.id === openKpi).label} onClose={() => setOpenKpi(null)} rows={SOLICITUDES_POR_ESTADO[openKpi] || []} />}
    </div>
  );
}

/* Crisis en modo lectura para la Alcaldesa */
function AlcaldesaCrisisLectura({ T, incidentes }) {
  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: 12.5, color: T.inkSoft }}>Incidentes activos gestionados por el Administrador. Sólo lectura: la publicación de alertas la realiza el equipo municipal.</p>
      {(incidentes || []).map((i, idx) => (
        <div key={idx} className="rounded-3xl p-5 flex items-start gap-4" style={{ background: T.surface, border: `1.5px solid ${T.border}` }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T[`${i.key}Soft`], color: T[i.key] }}>{i.icon ? <i.icon size={19} /> : <AlertTriangle size={19} />}</div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 700 }}>{i.tipo} — {i.lugar}</p>
            <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{FUENTE_LABEL[i.fuente]?.texto || "En seguimiento por el equipo de emergencia."}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-2" style={{ background: i.publicado ? T.sageSoft : T.goldSoft, color: i.publicado ? T.sage : T.gold, fontSize: 10.5, fontWeight: 700 }}>
              {i.publicado ? "Alerta publicada a los vecinos" : "Sin alerta publicada"}
            </span>
          </div>
        </div>
      ))}
      {(!incidentes || incidentes.length === 0) && <p style={{ fontSize: 12.5, color: T.inkSoft }}>Sin incidentes activos.</p>}
    </div>
  );
}

/* ---- Alcaldesa · Chats con delegaciones y direcciones ---- */
function AlcaldesaChats({ T, chats, setChats }) {
  const [tab, setTab] = useState(DEPTS_HEADS[0]);
  const [seccionAbierta, setSeccionAbierta] = useState(DEPTS_SECCIONES[0].titulo);
  const [msg, setMsg] = useState("");
  const finRef = useRef(null);
  const hilo = chats[tab] || [];
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [hilo.length, tab]);

  const enviar = () => {
    const t = msg.trim(); if (!t) return;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setChats((c) => ({ ...c, [tab]: [...(c[tab] || []), { from: "alcaldesa", texto: t, hora }] }));
    setMsg("");
  };

  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: 12.5, color: T.inkSoft, maxWidth: 680 }}>
        Cada delegación y dirección tiene su propio chat privado con su encargado o encargada. Usted puede revisar cualquiera en cualquier momento y preguntar directamente qué está ocurriendo.
      </p>

      <div className="rounded-3xl overflow-hidden flex flex-col sm:flex-row" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 520 }}>
        <div className="sm:w-64 shrink-0 overflow-y-auto p-2.5 flex flex-col gap-1" style={{ borderRight: `1px solid ${T.border}` }}>
          {DEPTS_SECCIONES.map((sec) => {
            const abierta = seccionAbierta === sec.titulo;
            return (
              <div key={sec.titulo} className="flex flex-col">
                <button onClick={() => setSeccionAbierta(abierta ? "" : sec.titulo)} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left">
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", color: T.inkFaint, lineHeight: 1.3 }}>{sec.titulo}</span>
                  <ChevronRight size={13} color={T.inkFaint} style={{ transform: abierta ? "rotate(90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
                </button>
                {abierta && (
                  <div className="flex flex-col gap-1 pb-1.5">
                    {sec.items.map((d) => {
                      const activo = tab === d;
                      const ultimo = (chats[d] || [])[(chats[d] || []).length - 1];
                      const pendiente = ultimo?.from === "jefe";
                      return (
                        <button key={d} onClick={() => setTab(d)} className="text-left px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: activo ? T.copper : "transparent", color: activo ? T.surface : T.ink }}>
                          <MessageCircle size={13} style={{ flexShrink: 0, opacity: activo ? 1 : 0.55 }} />
                          <span style={{ fontSize: 12, fontWeight: activo ? 700 : 500, flex: 1, lineHeight: 1.25 }}>{d}</span>
                          {pendiente && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: activo ? T.surface : T.sage }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.sage }} />
            <p style={{ fontSize: 13, fontWeight: 700 }}>{tab}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {hilo.length === 0 && <p style={{ fontSize: 12.5, color: T.inkFaint, textAlign: "center", marginTop: 20 }}>Sin mensajes todavía en este canal.</p>}
            {hilo.map((m, i) => {
              const propio = m.from === "alcaldesa";
              return (
                <div key={i} className="max-w-[78%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: propio ? "flex-end" : "flex-start", background: propio ? T.copper : T.surfaceAlt, color: propio ? T.surface : T.ink }}>
                  <p style={{ fontSize: 13 }}>{m.texto}</p>
                  {m.hora && <p style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.hora}</p>}
                </div>
              );
            })}
            <div ref={finRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Preguntar a ${tab}`} className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><MessageCircle size={16} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---- Alcaldesa · Supervisión de los chats internos del Admin ---- */
function AlcaldesaSupervision({ T, chatTrabajadores, chatAdminAlcaldesa, setChatAdminAlcaldesa }) {
  const nombres = Object.keys(chatTrabajadores);
  const [sel, setSel] = useState(nombres[0]);
  const [msg, setMsg] = useState("");
  const finRef = useRef(null);
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatAdminAlcaldesa.length]);

  const preguntar = (texto) => {
    const t = (texto ?? msg).trim(); if (!t) return;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setChatAdminAlcaldesa((c) => [...c, { from: "alcaldesa", texto: t, hora }]);
    setMsg("");
  };

  const hiloSel = chatTrabajadores[sel] || [];
  const gpsSel = GPS_TRABAJADORES.find((g) => g.nombre === sel);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: T.copperSoft, border: `1px solid ${T.copper}33` }}>
        <ShieldCheck size={17} color={T.copperInk} className="shrink-0 mt-0.5" />
        <p style={{ fontSize: 12.5, color: T.copperInk, fontWeight: 600 }}>
          Aquí ve todas las conversaciones entre el Administrador y los trabajadores en terreno. Si ocurre algo, puede leerlo directamente y preguntarle al Administrador qué pasó, sin que nadie pueda ocultarle información.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chats intervenidos (lectura) */}
        <div className="rounded-3xl overflow-hidden flex flex-col" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 520 }}>
          <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700 }}>Chats Administrador ↔ Trabajadores</p>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: T.oceanSoft, color: T.ocean, fontSize: 10.5, fontWeight: 700 }}><Eye size={11} /> Sólo lectura</span>
          </div>

          <div className="flex gap-1.5 p-2.5 overflow-x-auto scrollbar-none" style={{ borderBottom: `1px solid ${T.border}` }}>
            {nombres.map((n) => (
              <button key={n} onClick={() => setSel(n)} className="px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap shrink-0" style={{ background: sel === n ? T.copper : T.surfaceAlt, color: sel === n ? T.surface : T.inkSoft, border: `1px solid ${T.border}` }}>{n}</button>
            ))}
          </div>

          {gpsSel && (
            <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap" style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
              <span className="w-2 h-2 rounded-full" style={{ background: T[GPS_COLOR_ESTADO[gpsSel.estado]] }} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{gpsSel.estado}</span>
              <span style={{ fontSize: 11, color: T.inkSoft }}>· {gpsSel.tarea} · {gpsSel.horaLlegada ? `llegó ${gpsSel.horaLlegada}` : "sin registro de llegada"}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {hiloSel.map((m, i) => (
              <div key={i} className="max-w-[80%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: m.from === "admin" ? "flex-end" : "flex-start", background: m.from === "admin" ? T.oceanSoft : T.surfaceAlt, color: T.ink, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: T.inkFaint, marginBottom: 2 }}>{m.from === "admin" ? "ADMINISTRADOR" : sel.toUpperCase()}</p>
                <p style={{ fontSize: 12.5 }}>{m.texto}</p>
                {m.hora && <p style={{ fontSize: 9.5, color: T.inkFaint, marginTop: 3, textAlign: "right" }}>{m.hora}</p>}
              </div>
            ))}
            {hiloSel.length === 0 && <p style={{ fontSize: 12.5, color: T.inkFaint, textAlign: "center", marginTop: 20 }}>Sin mensajes en este canal.</p>}
          </div>

          <div className="p-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 11, color: T.inkFaint }}>No puede escribir en el chat del Administrador con su equipo, pero sí preguntarle directamente:</p>
            <button onClick={() => preguntar(`Vi el chat con ${sel}. ¿Qué ocurrió exactamente y cómo se resolvió?`)} className="rounded-xl py-2.5 text-[12.5px] font-bold" style={{ background: T.copper, color: T.surface }}>
              Preguntar al Administrador sobre este caso
            </button>
          </div>
        </div>

        {/* Chat directo con el Administrador */}
        <div className="rounded-3xl overflow-hidden flex flex-col" style={{ background: T.surface, border: `1.5px solid ${T.border}`, height: 520 }}>
          <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.copperSoft, color: T.copperInk, fontWeight: 700, fontSize: 11.5 }}>{initials(ADMIN_ACTUAL.nombre)}</div>
            <div className="flex-1"><p style={{ fontSize: 13.5, fontWeight: 700 }}>{ADMIN_ACTUAL.nombre}</p><p style={{ fontSize: 11, color: T.inkSoft }}>{ADMIN_ACTUAL.cargo}</p></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {chatAdminAlcaldesa.map((m, i) => {
              const propio = m.from === "alcaldesa";
              return (
                <div key={i} className="max-w-[78%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: propio ? "flex-end" : "flex-start", background: propio ? T.copper : T.surfaceAlt, color: propio ? T.surface : T.ink }}>
                  <p style={{ fontSize: 13 }}>{m.texto}</p>
                  {m.hora && <p style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.hora}</p>}
                </div>
              );
            })}
            <div ref={finRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); preguntar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Preguntar al Administrador…" className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><MessageCircle size={16} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   ASISTENTE IA — disponible para vecino, trabajador, admin y alcaldesa
--------------------------------------------------------------------- */

/* Base de conocimiento: qué es cada parte de la plataforma, por rol */
const IA_CONOCIMIENTO = {
  comun: [
    { kw: ["que es esta pagina", "qué es esta página", "que es esto", "para que sirve la plataforma", "como funciona la plataforma", "cómo funciona la plataforma"], r: "Es la plataforma municipal de La Serena. Reúne en un solo lugar los trámites del vecino, el trabajo diario de las cuadrillas, la gestión del Administrador y la supervisión de la Alcaldesa. Todo lo que ocurre queda registrado, así que nadie puede ocultar información." },
    { kw: ["modo oscuro", "cambiar tema", "color"], r: "Arriba a la derecha hay un botón con una luna o un sol: ahí cambias entre modo claro y oscuro." },
    { kw: ["cerrar sesion", "cerrar sesión", "salir"], r: "El botón con la flecha en la esquina superior derecha cierra tu sesión y te devuelve a la página de inicio." },
    { kw: ["clave unica", "claveúnica", "clave única"], r: "Puedes entrar con ClaveÚnica, la identidad digital del Estado. En la pantalla de acceso está el botón azul; te pide tu RUN y tu clave, verifica tu identidad con el Registro Civil y luego eliges con qué perfil entrar." },
    { kw: ["quien eres", "quién eres", "que eres", "qué eres"], r: "Soy el asistente de la plataforma municipal. Te ayudo a encontrar cosas, te aviso de lo pendiente y puedo explicarte para qué sirve cada sección. Pregúntame lo que necesites." },
  ],
  vecino: [
    { kw: ["solicitud", "pedir", "solicitar", "tramite", "trámite"], r: "Para pedir algo entra a “Nueva solicitud”, elige el departamento y el servicio, revisa tus datos y envía. Después puedes seguir el avance en “Seguimiento”." },
    { kw: ["seguimiento", "en que va", "en qué va", "estado de mi solicitud"], r: "En “Seguimiento” ves la línea de tiempo de tu solicitud: recibida, en revisión, aceptada, programada, en tránsito y finalizada. También aparece quién es el trabajador asignado y la hora estimada de llegada." },
    { kw: ["colegio", "kinder", "kínder", "matricula", "matrícula", "escuela"], r: "En el inicio aparece la tarjeta de Kínder 2027. Al tocar “Ver colegios municipales” se abre la lista de establecimientos con vacantes, jornada, sello educativo y las fechas del proceso de admisión." },
    { kw: ["licencia", "conducir", "renovar"], r: "Tu licencia clase B vence el 16 de noviembre. En el inicio, la tarjeta “Renovar ahora” te lleva a los requisitos, el costo y la reserva de hora en la Dirección de Tránsito." },
    { kw: ["calificar", "evaluar", "estrellas"], r: "Cuando una solicitud termina puedes calificarla con estrellas en la pestaña “Calificación”. Las notas de 1 y 2 estrellas llegan directo a la bandeja de auditoría de la Municipalidad." },
    { kw: ["ficha", "documentos"], r: "En “Mi ficha” subes tus documentos una sola vez y decides con qué direcciones municipales se comparten. También puedes registrar cargas familiares." },
    { kw: ["voluntario", "comunidad", "ayudar"], r: "En “Comunidad” puedes inscribirte como voluntario en emergencias; te avisaremos si un vecino cercano necesita ayuda durante un temporal." },
  ],
  trabajador: [
    { kw: ["donde", "dónde", "ir", "direccion", "dirección", "voy"], r: null, dinamico: "ruta" },
    { kw: ["que tengo que hacer", "qué tengo que hacer", "tarea", "tareas", "pendiente"], r: null, dinamico: "tareas" },
    { kw: ["mensaje", "chat", "jefatura", "jefe"], r: null, dinamico: "mensajes" },
    { kw: ["foto", "antes", "despues", "después", "evidencia"], r: "En la pestaña “Fotos antes/después” abres la cámara y tomas la foto del antes y del después. No se puede subir de la galería: solo cámara, y cada foto queda sellada con la hora y el GPS." },
    { kw: ["fichaje", "marcar", "jornada", "colacion", "colación"], r: "En “Fichaje” marcas el inicio de tu jornada, la pausa de colación y el término. Queda guardada la hora y tu ubicación." },
    { kw: ["cerrar tarea", "cierre", "firma"], r: "En “Cierre de tarea” tomas la foto del trabajo terminado y pides la firma del vecino. Recién ahí la tarea queda cerrada." },
    { kw: ["imprevisto", "problema", "no puedo"], r: "Si algo te impide trabajar, avísalo por el chat con tu jefatura o usa “Registrar imprevisto” en la tarea activa. Queda respaldado para que no te perjudique después." },
  ],
  admin: [
    { kw: ["asignar", "asignacion", "asignación", "despacho"], r: "En “Asignación” eliges al trabajador, la fecha y la hora, y debes escribir qué tiene que hacer. Ese texto le llega directo a su chat. También puedes usar el despacho automático para que la IA arme una propuesta." },
    { kw: ["gps", "terreno", "donde estan", "dónde están", "cumplio", "cumplió"], r: null, dinamico: "gps" },
    { kw: ["chat", "mensaje", "trabajadores"], r: null, dinamico: "mensajes_admin" },
    { kw: ["sgr", "matriz", "tubo"], r: "La Matriz SGR mide el desempeño: el resumen por delegación, la ficha personal con ponderadores y metas, el tubo de trabajo (donde agregas, editas y cierras compromisos) y el semáforo de cumplimiento." },
    { kw: ["amonestacion", "amonestación", "queja", "reclamo", "auditoria calidad", "auditoría calidad"], r: "En “Auditoría calidad” llegan las calificaciones de 1 y 2 estrellas. Al tocar “Iniciar amonestación” se abre la página donde eliges el tipo de medida, describes los hechos, la medida correctiva y el plazo de descargos, y emites el documento con folio." },
    { kw: ["empleado", "funcionario", "contratar", "registrar"], r: "En “Gestión Empleados” registras, editas, consultas y eliminas funcionarios. El sistema valida el RUT, detecta duplicados y bloquea la eliminación si la persona tiene procesos activos." },
    { kw: ["fraude", "duplicado"], r: "El centro anti-fraude cruza RUT, dirección y beneficio. Si detecta repeticiones marca la fila en rojo, y desde 3 reincidencias habilita el bloqueo." },
    { kw: ["crisis", "emergencia", "alerta"], r: "El panel de Crisis muestra los incidentes activos en el mapa y te permite publicar la alerta a los vecinos con un clic." },
    { kw: ["presupuesto", "bodega", "stock"], r: "En “Presupuesto” ves la ejecución por dirección y el stock de la bodega municipal, con aviso cuando algo baja del 15%." },
  ],
  alcalde: [
    { kw: ["resumen", "como va", "cómo va", "estado de la comuna"], r: null, dinamico: "resumen_alcaldesa" },
    { kw: ["incumpl", "no cumple", "problema", "alerta"], r: null, dinamico: "alertas_alcaldesa" },
    { kw: ["chat", "delegacion", "delegación", "direccion", "dirección"], r: "En “Delegaciones y Direcciones” cada unidad tiene su propio chat con su encargado. Puedes leer cualquiera y escribir directamente para preguntar qué está ocurriendo." },
    { kw: ["supervision", "supervisión", "ocultar", "transparencia"], r: "En “Supervisión de chats” lees las conversaciones entre el Administrador y cada trabajador. Son de sólo lectura, pero con un botón puedes preguntarle al Administrador por cualquier caso. Así nadie puede ocultarle información." },
    { kw: ["admin", "administrador", "que ve el admin", "qué ve el admin"], r: "En “Vista del Admin” ve la misma información operativa que maneja el Administrador —solicitudes, trabajadores, auditoría de calidad, crisis, presupuesto y auditoría interna— en modo de sólo lectura, sin tener que entrar a su panel." },
    { kw: ["terreno", "gps", "trabajadores"], r: null, dinamico: "gps" },
  ],
};

const IA_SUGERENCIAS = {
  vecino: ["¿En qué va mi solicitud?", "¿Cómo pido un retiro de escombros?", "Cuéntame de los colegios municipales", "¿Cómo renuevo mi licencia?"],
  trabajador: ["¿A dónde tengo que ir ahora?", "¿Qué tareas me quedan?", "¿Tengo mensajes?", "¿Cómo tomo la foto del antes?"],
  admin: ["¿Cómo está el terreno?", "¿Tengo mensajes nuevos?", "Asigna a Pedro entregar sacos en Los Aromos 482", "¿Cómo emito una amonestación?"],
  alcalde: ["¿Cómo va la comuna hoy?", "¿Hay incumplimientos?", "¿Para qué sirve la supervisión de chats?", "¿Qué veo de lo del Admin?"],
};

const IA_NOMBRE = { vecino: "Asistente vecinal", trabajador: "Asistente de terreno", admin: "Asistente del Administrador", alcalde: "Asistente de la Alcaldesa" };

function normalizar(t) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function AsistenteIA({ T, role, chatTrabajadores, chatAdminAlcaldesa, agregarAsignacionIA, irA }) {
  const [abierto, setAbierto] = useState(false);
  const [msg, setMsg] = useState("");
  const [vistos, setVistos] = useState(false);
  const finRef = useRef(null);

  const saludo = {
    vecino: "Hola, soy tu asistente. Puedo explicarte cómo hacer un trámite, decirte en qué va tu solicitud o guiarte por cualquier parte de la plataforma.",
    trabajador: `Hola ${TRABAJADOR_ACTUAL.nombre.split(" ")[0]}. Puedo decirte a dónde ir, qué tienes que hacer, si tienes mensajes de tu jefatura o explicarte cualquier parte de la app.`,
    admin: `Hola ${ADMIN_ACTUAL.nombre.split(" ")[0]}. Puedo asignarle tareas a un trabajador por ti, avisarte de mensajes nuevos, resumirte el estado del terreno o explicarte cualquier sección.`,
    alcalde: "Buen día, Alcaldesa. Puedo resumirle el estado de la comuna, avisarle de incumplimientos o explicarle cualquier sección del panel.",
  }[role];

  const [hilo, setHilo] = useState([{ from: "ia", texto: saludo }]);

  /* --- Avisos automáticos según el rol --- */
  const avisos = React.useMemo(() => {
    const out = [];
    if (role === "trabajador") {
      const mios = chatTrabajadores[TRABAJADOR_ACTUAL.nombre] || [];
      const ultimo = mios[mios.length - 1];
      if (ultimo?.from === "admin") out.push({ icon: MessageCircle, color: "copper", texto: `Tienes un mensaje de ${ADMIN_ACTUAL.nombre}: “${ultimo.texto.slice(0, 70)}${ultimo.texto.length > 70 ? "…" : ""}”`, ir: "CHAT" });
      out.push({ icon: ClipboardList, color: "ocean", texto: `Tienes ${AGENDA_TRABAJADOR.length} tareas para hoy. La próxima es ${AGENDA_TRABAJADOR[0].tarea} en ${AGENDA_TRABAJADOR[0].direccion} a las ${AGENDA_TRABAJADOR[0].hora}.`, ir: "AGENDA" });
      out.push({ icon: Camera, color: "gold", texto: "Recuerda tomar la foto del antes y del después de cada trabajo, o la tarea no se puede cerrar.", ir: "EVIDENCIA" });
    }
    if (role === "admin") {
      Object.entries(chatTrabajadores).forEach(([nombre, hist]) => {
        const u = hist[hist.length - 1];
        if (u?.from === "trabajador") out.push({ icon: MessageCircle, color: "red", texto: `${nombre} te escribió: “${u.texto.slice(0, 70)}${u.texto.length > 70 ? "…" : ""}”`, ir: "CHAT" });
      });
      const ua = chatAdminAlcaldesa[chatAdminAlcaldesa.length - 1];
      if (ua?.from === "alcaldesa") out.push({ icon: Landmark, color: "copper", texto: `La Alcaldesa te preguntó: “${ua.texto.slice(0, 70)}${ua.texto.length > 70 ? "…" : ""}”`, ir: "CHAT" });
      GPS_TRABAJADORES.filter((g) => g.cumple === false).forEach((g) => {
        out.push({ icon: AlertTriangle, color: "red", texto: `${g.nombre} figura como “${g.estado}” en ${g.tarea}. Requiere que lo revises.`, ir: "GPS" });
      });
    }
    if (role === "alcalde") {
      const criticos = GPS_TRABAJADORES.filter((g) => g.cumple === false);
      if (criticos.length) out.push({ icon: AlertTriangle, color: "red", texto: `Hay ${criticos.length} incumplimientos hoy: ${criticos.map((g) => g.nombre).join(" y ")}.`, ir: "TERRENO" });
      Object.entries(chatTrabajadores).forEach(([nombre, hist]) => {
        const u = hist[hist.length - 1];
        if (u?.from === "trabajador") out.push({ icon: Eye, color: "ocean", texto: `${nombre} reportó algo a la jefatura: “${u.texto.slice(0, 60)}…”. Puede revisarlo en Supervisión de chats.`, ir: "SUPERVISION" });
      });
    }
    if (role === "vecino") {
      const act = SOLICITUDES_VECINO.filter((x) => x.activa);
      if (act.length) out.push({ icon: Truck, color: "gold", texto: `Tu solicitud N.º ${act[0].id} (${act[0].titulo}) está ${act[0].estado.toLowerCase()}. Llegada estimada: ${act[0].eta}.`, ir: "ACTIVAS" });
      out.push({ icon: GraduationCap, color: "copper", texto: "La postulación a Kínder 2027 está abierta hasta el 30 de septiembre.", ir: "COLEGIOS" });
    }
    return out;
  }, [role, chatTrabajadores, chatAdminAlcaldesa]);

  useEffect(() => { if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [hilo.length, abierto]);
  useEffect(() => { if (abierto) setVistos(true); }, [abierto]);

  /* --- Motor de respuestas --- */
  const responderDinamico = (clave) => {
    if (clave === "ruta") {
      const a = AGENDA_TRABAJADOR[0];
      return `Tu próxima parada es ${a.direccion}, a las ${a.hora} hrs, para ${a.tarea.toLowerCase()}. En “Mi agenda” tienes la ruta optimizada con las ${AGENDA_TRABAJADOR.length} paradas del día.`;
    }
    if (clave === "tareas") {
      return `Tienes ${AGENDA_TRABAJADOR.length} tareas hoy:\n` + AGENDA_TRABAJADOR.map((a, i) => `${i + 1}. ${a.hora} — ${a.tarea} (${a.direccion})`).join("\n") + "\nRecuerda la foto del antes y del después en cada una.";
    }
    if (clave === "mensajes") {
      const mios = chatTrabajadores[TRABAJADOR_ACTUAL.nombre] || [];
      const u = mios[mios.length - 1];
      if (u?.from === "admin") return `Sí. ${ADMIN_ACTUAL.nombre} te escribió: “${u.texto}”. Puedes responderle en la pestaña “Chat con mi jefatura”.`;
      return "No tienes mensajes nuevos de tu jefatura. Si ocurre algo en terreno, escríbele por el chat y queda registrado.";
    }
    if (clave === "mensajes_admin") {
      const pend = Object.entries(chatTrabajadores).filter(([, h]) => h[h.length - 1]?.from === "trabajador");
      const ua = chatAdminAlcaldesa[chatAdminAlcaldesa.length - 1];
      let r = pend.length ? `Tienes ${pend.length} mensajes por responder:\n` + pend.map(([n, h]) => `• ${n}: “${h[h.length - 1].texto}”`).join("\n") : "No hay mensajes de trabajadores sin responder.";
      if (ua?.from === "alcaldesa") r += `\n\nAdemás, la Alcaldesa le preguntó: “${ua.texto}”`;
      return r;
    }
    if (clave === "gps") {
      const cumplen = GPS_TRABAJADORES.filter((g) => g.cumple === true).length;
      const no = GPS_TRABAJADORES.filter((g) => g.cumple === false);
      const ruta = GPS_TRABAJADORES.filter((g) => g.cumple === null).length;
      let r = `En terreno hay ${GPS_TRABAJADORES.length} trabajadores: ${cumplen} cumpliendo, ${ruta} en proceso y ${no.length} con problemas.`;
      if (no.length) r += "\n\nCon problemas:\n" + no.map((g) => `• ${g.nombre} — ${g.estado} (${g.distancia})`).join("\n");
      return r;
    }
    if (clave === "resumen_alcaldesa") {
      const criticos = GPS_TRABAJADORES.filter((g) => g.cumple === false);
      return `Hoy: tiempo promedio de respuesta 2,4 días, 87% de solicitudes resueltas y satisfacción vecinal 4,3 estrellas. Hay ${GPS_TRABAJADORES.length} trabajadores en terreno y ${criticos.length} incumplimientos${criticos.length ? ` (${criticos.map((g) => g.nombre).join(", ")})` : ""}. También hay ${QUEJAS.length} calificaciones bajas esperando resolución.`;
    }
    if (clave === "alertas_alcaldesa") {
      const criticos = GPS_TRABAJADORES.filter((g) => g.cumple === false);
      if (!criticos.length) return "No hay incumplimientos registrados en este momento.";
      return "Sí, estos casos requieren su atención:\n" + criticos.map((g) => `• ${g.nombre}: ${g.estado} en ${g.tarea} (${g.direccion}). ${g.distancia}.`).join("\n") + "\n\nPuede preguntarle al Administrador desde Supervisión de chats.";
    }
    return null;
  };

  /* Intenta interpretar una orden de asignación (solo admin) */
  const intentarAsignar = (texto) => {
    const t = normalizar(texto);
    const esOrden = ["asigna", "asignar", "agrega", "agregar", "anota", "anotar", "encarga", "manda", "envia", "enviar"].some((v) => t.includes(v));
    if (!esOrden) return null;

    const candidatos = [...GPS_TRABAJADORES.map((g) => g.nombre), ...WORKERS_PERFIL.map((w) => w.nombre)];
    let trabajador = candidatos.find((n) => t.includes(normalizar(n.split(" ")[0])));
    if (!trabajador) return { error: "No reconocí a qué trabajador te refieres. Dime su nombre, por ejemplo: “asigna a Pedro entregar sacos en Los Aromos 482”." };

    // Qué hacer: lo que va después del nombre
    const idxNombre = t.indexOf(normalizar(trabajador.split(" ")[0]));
    let resto = texto.slice(idxNombre + trabajador.split(" ")[0].length).trim();
    resto = resto.replace(/^(que|a|de|para|:)\s+/i, "").trim();
    if (resto.length < 5) return { error: "Entendí a quién asignar, pero no qué debe hacer. Dime la tarea y el lugar." };

    // Dirección aproximada: lo que va después de "en"
    let direccion = "Por confirmar";
    const m = resto.match(/\b(?:en|hacia|hasta)\s+(.{4,60})$/i);
    if (m) direccion = m[1].trim().replace(/[.]$/, "");

    return { trabajador, tarea: resto, direccion };
  };

  const responder = (texto) => {
    const t = normalizar(texto);

    // 1) Orden de asignación (admin)
    if (role === "admin") {
      const asign = intentarAsignar(texto);
      if (asign) {
        if (asign.error) return asign.error;
        const id = String(20600 + Math.floor(Math.random() * 99));
        agregarAsignacionIA({
          id, vecino: "Solicitud interna", depto: "Asignación directa del Administrador",
          direccion: asign.direccion, creadaPorIA: true, tareaSugerida: asign.tarea, trabajadorSugerido: asign.trabajador,
        });
        return `Listo. Creé la tarea N.º ${id} para ${asign.trabajador}: “${asign.tarea}”${asign.direccion !== "Por confirmar" ? ` en ${asign.direccion}` : ""}. Quedó en la pestaña “Asignación” marcada como creada por el asistente, para que confirmes la fecha, la hora y afines las instrucciones antes de enviarla.`;
      }
    }

    // 2) Conocimiento del rol y común
    const bases = [...(IA_CONOCIMIENTO[role] || []), ...IA_CONOCIMIENTO.comun];
    for (const b of bases) {
      if (b.kw.some((k) => t.includes(normalizar(k)))) {
        if (b.dinamico) { const d = responderDinamico(b.dinamico); if (d) return d; }
        if (b.r) return b.r;
      }
    }

    // 3) Saludos y cortesía
    if (["hola", "buenas", "buenos dias", "buenas tardes"].some((k) => t.includes(k))) return saludo;
    if (["gracias", "perfecto", "listo"].some((k) => t.includes(k))) return "Con gusto. Si necesitas algo más, aquí estoy.";

    // 4) Sin coincidencia
    return "No estoy seguro de haber entendido. Puedo explicarte para qué sirve cada sección, decirte qué tienes pendiente" + (role === "admin" ? ", o asignarle una tarea a un trabajador si me dices a quién, qué debe hacer y dónde" : "") + ". ¿Sobre qué te ayudo?";
  };

  const enviar = (texto) => {
    const t = (texto ?? msg).trim(); if (!t) return;
    setHilo((h) => [...h, { from: "yo", texto: t }]);
    setMsg("");
    setTimeout(() => setHilo((h) => [...h, { from: "ia", texto: responder(t) }]), 320);
  };

  const pendientes = vistos ? 0 : avisos.length;

  return (
    <>
      {/* Botón flotante */}
      {!abierto && (
        <button onClick={() => setAbierto(true)} className="fixed z-40 flex items-center gap-2 rounded-full shadow-lg transition-transform active:scale-95"
          style={{ right: 18, bottom: "max(84px, calc(env(safe-area-inset-bottom) + 84px))", background: T.copper, color: T.surface, padding: "13px 18px" }}>
          <Sparkles size={18} />
          <span style={{ fontSize: 13, fontWeight: 700 }} className="hidden sm:inline">Asistente</span>
          {pendientes > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center blink-dot" style={{ background: T.gold, color: "#241016", fontSize: 10.5, fontWeight: 800, border: `2px solid ${T.surface}` }}>{pendientes}</span>
          )}
        </button>
      )}

      {/* Panel */}
      {abierto && (
        <div className="fixed z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{ right: 12, left: 12, bottom: 12, maxWidth: 420, marginLeft: "auto", height: "min(620px, 82vh)", background: T.surface, border: `1.5px solid ${T.border}` }}>

          {/* Encabezado */}
          <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: `linear-gradient(120deg, ${T.rojoOscuro}, ${T.rojoHeraldico})`, color: "#fff" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}><Sparkles size={17} /></div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13.5, fontWeight: 700 }}>{IA_NOMBRE[role]}</p>
              <p style={{ fontSize: 10.5, opacity: 0.85 }}>Te avisa lo pendiente y te explica la plataforma</p>
            </div>
            <button onClick={() => setAbierto(false)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}><X size={16} /></button>
          </div>

          {/* Avisos */}
          {avisos.length > 0 && (
            <div className="px-3 py-2.5 flex flex-col gap-1.5 max-h-[150px] overflow-y-auto" style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: T.inkFaint, letterSpacing: 0.3 }}>AVISOS PARA TI</p>
              {avisos.map((a, i) => {
                const Icon = a.icon; const accent = T[a.color];
                return (
                  <button key={i} onClick={() => { if (irA && a.ir) { irA(a.ir); setAbierto(false); } }} className="rounded-xl p-2.5 flex items-start gap-2 text-left" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <Icon size={13} color={accent} className="shrink-0 mt-0.5" />
                    <span style={{ fontSize: 11.5, lineHeight: 1.35, flex: 1 }}>{a.texto}</span>
                    {a.ir && <ChevronRight size={13} color={T.inkFaint} className="shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Conversación */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {hilo.map((m, i) => (
              <div key={i} className="max-w-[86%] rounded-2xl px-3.5 py-2.5" style={{ alignSelf: m.from === "yo" ? "flex-end" : "flex-start", background: m.from === "yo" ? T.copper : T.surfaceAlt, color: m.from === "yo" ? T.surface : T.ink }}>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-line" }}>{m.texto}</p>
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {/* Sugerencias */}
          <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            {(IA_SUGERENCIAS[role] || []).map((q) => (
              <button key={q} onClick={() => enviar(q)} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0" style={{ background: T.surfaceAlt, color: T.inkSoft, border: `1px solid ${T.border}` }}>{q}</button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe o pide algo…" className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.ink }} />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.copper, color: T.surface }}><ArrowRight size={16} /></button>
          </form>
        </div>
      )}
    </>
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
