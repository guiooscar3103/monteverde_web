import { GraduationCap, Calendar, Users } from 'lucide-react';

/**
 * Genera iniciales a partir de un nombre.
 * Ej: "Carlos Rodríguez" -> "CR"
 */
export function getInitials(nombre) {
  if (!nombre) return 'U';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Plantillas de acciones rápidas para chat de familias
 */
export const ACCIONES_RAPIDAS = [
  {
    id: 'rendimiento',
    titulo: 'Consultar rendimiento académico',
    descripcion: 'Hablar con el docente sobre calificaciones y proceso escolar.',
    icono: GraduationCap,
    asunto: 'Consulta sobre rendimiento académico',
    texto: 'Hola, quisiera consultar sobre el rendimiento académico de mi hijo/a.'
  },
  {
    id: 'inasistencia',
    titulo: 'Justificar una inasistencia',
    descripcion: 'Informar y justificar una ausencia médica o personal.',
    icono: Calendar,
    asunto: 'Justificación de inasistencia',
    texto: 'Hola, quisiera informar y justificar una inasistencia de mi hijo/a.'
  },
  {
    id: 'cita',
    titulo: 'Solicitar cita de atención a padres',
    descripcion: 'Coordinar una reunión presencial o virtual con el docente.',
    icono: Users,
    asunto: 'Solicitud de cita de atención a padres',
    texto: 'Hola, quisiera solicitar una cita de atención para conversar sobre el proceso académico de mi hijo/a.'
  }
];
