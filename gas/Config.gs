/**
 * CONFIGURACIÓN INSTITUCIONAL BACKEND - GOOGLE APPS SCRIPT
 * Sistema de Gestión y Seguimiento de Planes de Contingencia - SED Caldas
 */

var CONFIG = {
  VERSION: "1.0.0",
  VIGENCIA: "2026",
  MAX_FILE_SIZE_MB: 10,
  ROOT_FOLDER_NAME: "SED CALDAS - PLANES DE CONTINGENCIA",
  ROOT_FOLDER_ID: "1bIV0LOJ3KeUlD5zUwwdwJGAxqDeUOiMa",
  EMAIL_FROM_NAME: "Secretaría de Educación de Caldas",
  
  // Hojas de la Base Transaccional en Google Sheets
  SHEETS: {
    INSTITUCIONES: "INSTITUCIONES",
    SEDES: "SEDES",
    USUARIOS: "USUARIOS",
    ENVIOS: "ENVIOS",
    DOCUMENTOS: "DOCUMENTOS",
    EVALUACIONES: "EVALUACIONES",
    CRITERIOS_EVALUACION: "CRITERIOS_EVALUACION",
    ASIGNACIONES: "ASIGNACIONES",
    AUDITORIA: "AUDITORIA",
    CONFIGURACION: "CONFIGURACION"
  },

  // Tipos de Documentos Requeridos
  DOCUMENTOS_REQUERIDOS: [
    "PlanContingencia",
    "SedesAfectadas",
    "Estrategia",
    "Cronograma",
    "EvidenciaActividades",
    "Requerimientos"
  ]
};

/**
 * Obtener la hoja de cálculo activa vinculada
 */
function getSpreadsheet() {
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
