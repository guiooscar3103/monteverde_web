/**
 * mock-data.js - Datos simulados para el prototipo del Colegio MonteVerde
 * 
 * Este archivo contiene datos de ejemplo para:
 * - Cursos
 * - Estudiantes
 * - Notas
 * - Asistencia
 * - Observaciones
 * - Mensajes
 * - Usuarios (docente y familia)
 * 
 * Versión simplificada: un solo curso (7B – Matemáticas) para claridad en el prototipo.
 */

export const DATA = {
  // === Periodos académicos ===
  periodos: ["2025-P1", "2025-P2"],

  // === Cursos ===
  // Simplificado: solo un curso para el prototipo
  cursos: [
    { id: "7B-MAT", nombre: "7°B – Matemáticas" }
  ],

  // === Estudiantes del curso ===
  estudiantes: [
    { id: "e01", nombre: "Juan Martínez" },
    { id: "e02", nombre: "Ana Ruiz" },
    { id: "e03", nombre: "Carlos Martínez" },
    { id: "e04", nombre: "Lucía Gómez" },
    { id: "e05", nombre: "Sofía Hernández" }
  ],

  // === Notas por curso, periodo y estudiante ===
  notas: {
    "7B-MAT|2025-P1": {
      "e01": 4.2,
      "e02": 3.8,
      "e03": 2.9,
      "e04": 4.8,
      "e05": 3.2
    },
    "7B-MAT|2025-P2": {
      "e01": 4.5,
      "e02": 4.0,
      "e03": 3.5,
      "e04": 4.9,
      "e05": 3.7
    }
  },

  // === Asistencia por fecha y estudiante ===
  asistencia: {
    "7B-MAT|2025-09-01": { "e01": "P", "e02": "A", "e03": "P", "e04": "P", "e05": "P" },
    "7B-MAT|2025-09-02": { "e01": "P", "e02": "P", "e03": "A", "e04": "P", "e05": "A" },
    "7B-MAT|2025-09-03": { "e01": "P", "e02": "P", "e03": "P", "e04": "P", "e05": "P" }
  },

  // === Observaciones por estudiante ===
  observador: {
    "e01": [
      { fecha: "2025-08-20", tipo: "Reconocimiento", desc: "Excelente participación en clase de matemáticas." },
      { fecha: "2025-09-02", tipo: "Llamado de atención", desc: "No trajo la tarea asignada." }
    ],
    "e02": [
      { fecha: "2025-08-21", tipo: "Reconocimiento", desc: "Gran progreso en comprensión lectora." }
    ],
    "e03": [
      { fecha: "2025-08-25", tipo: "Llamado de atención", desc: "Interrumpió varias veces durante la clase." }
    ],
    "e04": [
      { fecha: "2025-08-30", tipo: "Reconocimiento", desc: "Ganadora del concurso de ortografía del colegio." }
    ],
    "e05": [
      { fecha: "2025-09-01", tipo: "Observación", desc: "Presentó síntomas de gripe, se retiró antes de terminar la clase." }
    ]
  },

  // === Mensajes del sistema ===
  mensajes: [
    {
      id: "m1",
      asunto: "Reunión general de padres",
      de: "Coordinación Académica",
      para: "todos",
      preview: "Se invita a reunión general el 10 de septiembre a las 6:00 PM."
    },
    {
      id: "m2",
      asunto: "Entrega de boletines",
      de: "Docente",
      para: "todos",
      preview: "Recordatorio: los boletines del segundo periodo se entregarán el 15 de septiembre."
    },
    {
      id: "m3",
      asunto: "Salida pedagógica",
      de: "Docente",
      para: "7B",
      preview: "El grupo 7°B realizará una salida pedagógica al museo de ciencias el 20 de septiembre."
    },
    {
      id: "m4",
      asunto: "Falta de tareas",
      de: "Docente",
      para: "familia-carlos",
      preview: "El estudiante Carlos Pérez no ha entregado las últimas tres tareas de matemáticas."
    }
  ],

  // === Información del usuario activo (simulación de sesión) ===
  usuarioActivo: {
    rol: "docente", // o "familia"
    id: "familia-carlos", // solo usado si rol === "familia"
    nombre: "Carlos M."
  },

  // === Vinculación familia-estudiantes ===
  familiaEstudiantes: {
    "familia-carlos": ["e01", "e03"] // Juan y Carlos
  }
};