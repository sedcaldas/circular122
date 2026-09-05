/**
 * CONFIGURACIÓN GLOBAL DEL SISTEMA
 * Sistema de Gestión y Seguimiento de Planes de Contingencia - SED Caldas
 */

const APP_CONFIG = {
  VERSION: "1.0.0",
  VIGENCIA: "2026",
  CIRCULAR_REF: "Circular N° 122 del 24 de agosto de 2026",
  GAS_ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbx_WZU8pn2qOUthP_n5gBNwu1-0LJTPwULmsIvnBAnqvyfZtgjHByg00H7HIAJE8nP_/exec",
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ],
  
  // Storage Keys
  STORAGE_KEYS: {
    ENVIOS: 'sed_caldas_envios',
    DOCUMENTOS: 'sed_caldas_documentos',
    EVALUACIONES: 'sed_caldas_evaluaciones',
    CRITERIOS: 'sed_caldas_criterios',
    ASIGNACIONES: 'sed_caldas_asignaciones',
    USUARIOS: 'sed_caldas_usuarios',
    AUDITORIA: 'sed_caldas_auditoria',
    BORRADOR: 'sed_caldas_borrador_actual',
    CONFIG: 'sed_caldas_system_config',
    CURRENT_USER: 'sed_caldas_current_user'
  },

  // Documentos Oficiales Requeridos según Circular 122 y SKILLS.md
  DOCUMENTOS_REQUERIDOS: [
    {
      tipo: 'PlanContingencia',
      nombre: 'Plan de Contingencia Adoptado',
      descripcion: 'Documento formal que presenta el plan de contingencia adoptado para las sedes de la institución.',
      obligatorio: true,
      icono: '📄'
    },
    {
      tipo: 'SedesAfectadas',
      nombre: 'Relación de Sedes Afectadas y Estado Actual',
      descripcion: 'Diagnóstico detallado de cada sede con nivel de afectación, daños y condiciones de habitabilidad.',
      obligatorio: true,
      icono: '🏫'
    },
    {
      tipo: 'Estrategia',
      nombre: 'Estrategia para Garantizar el Servicio Educativo',
      descripcion: 'Acciones definidas (reubicación temporal, alternancia, guías impresas, acompañamiento virtual, etc.).',
      obligatorio: true,
      icono: '🎯'
    },
    {
      tipo: 'Cronograma',
      nombre: 'Cronograma de Implementación',
      descripcion: 'Fases, fechas y responsables para la ejecución del plan de contingencia y normalización académica.',
      obligatorio: true,
      icono: '📅'
    },
    {
      tipo: 'EvidenciaActividades',
      nombre: 'Evidencias de Actividades Desarrolladas',
      descripcion: 'Soportes, actas de consejo directivo, registros fotográficos y socialización durante la semana institucional.',
      obligatorio: true,
      icono: '📸'
    },
    {
      tipo: 'Requerimientos',
      nombre: 'Requerimientos de Apoyo a la SED',
      descripcion: 'Solicitudes de apoyo técnico, pedagógico, administrativo o financiero necesarias para la atención.',
      obligatorio: false,
      icono: '🤝'
    }
  ],

  // Estados Oficiales de los Envíos
  ESTADOS: {
    BORRADOR: { label: 'Borrador', badgeClass: 'badge-draft' },
    ENVIADO: { label: 'Enviado', badgeClass: 'badge-sent' },
    EN_REVISION: { label: 'En Revisión', badgeClass: 'badge-review' },
    REQUIERE_CORRECCION: { label: 'Requiere Corrección', badgeClass: 'badge-correction' },
    APROBADO: { label: 'Aprobado', badgeClass: 'badge-approved' }
  },

  // Roles de Usuario
  ROLES: {
    RECTOR: 'RECTOR',
    COORDINADOR: 'COORDINADOR',
    ADMINISTRADOR: 'ADMINISTRADOR'
  }
};
