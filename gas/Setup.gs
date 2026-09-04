/**
 * SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN AUTOMÁTICA
 * Crea las 10 hojas de Google Sheets y la estructura de Google Drive
 */

function setupSistemaCompleto() {
  var ss = getSpreadsheet();
  
  // 1. Estructura de Hojas y Encabezados
  var schema = {
    INSTITUCIONES: [
      'municipio', 'codigo_establecimiento', 'nombre_establecimiento'
    ],
    SEDES: [
      'id_sede', 'municipio', 'codigo_establecimiento', 'codigo_sede', 'nombre_sede', 'estado'
    ],
    USUARIOS: [
      'id_usuario', 'nombre', 'cargo', 'correo', 'telefono', 'municipio', 'codigo_establecimiento', 'rol', 'estado', 'fecha_registro', 'fecha_actualizacion'
    ],
    ENVIOS: [
      'id_envio', 'fecha_envio', 'hora_envio', 'municipio', 'codigo_establecimiento', 'nombre_establecimiento', 'id_usuario', 'correo_usuario', 'version', 'estado', 'fecha_ultima_actualizacion', 'observaciones_generales'
    ],
    DOCUMENTOS: [
      'id_documento', 'id_envio', 'municipio', 'codigo_establecimiento', 'tipo_documento', 'nombre_original', 'nombre_sistema', 'id_drive', 'url_drive', 'version', 'fecha_carga', 'usuario_carga', 'estado_revision', 'observaciones'
    ],
    EVALUACIONES: [
      'id_evaluacion', 'id_envio', 'id_documento', 'id_criterio', 'dictamen', 'observacion', 'evaluador', 'fecha_evaluacion'
    ],
    CRITERIOS_EVALUACION: [
      'id_criterio', 'tipo_documento', 'criterio', 'descripcion', 'obligatorio', 'activo'
    ],
    ASIGNACIONES: [
      'id_asignacion', 'municipio', 'id_coordinador', 'nombre_coordinador'
    ],
    AUDITORIA: [
      'id_auditoria', 'fecha_hora', 'usuario', 'rol', 'accion', 'municipio', 'codigo_establecimiento', 'id_envio', 'id_documento', 'version', 'resultado', 'observacion'
    ],
    CONFIGURACION: [
      'clave', 'valor', 'descripcion'
    ]
  };

  for (var sheetName in schema) {
    var headers = schema[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.clear();
    sheet.appendRow(headers);
    
    // Formato de cabecera institucional
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#007a33');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 2. Cargar Criterios Iniciales
  var sheetCrit = ss.getSheetByName(CONFIG.SHEETS.CRITERIOS_EVALUACION);
  var criterios = [
    ['CRIT-001', 'PlanContingencia', 'Adopción formal y alcance del plan', 'El documento presenta el plan de contingencia adoptado formalmente.', 'SI', 'SI'],
    ['CRIT-002', 'PlanContingencia', 'Protocolos de emergencia y evacuación', 'Se detallan protocolos de evacuación y zonas seguras.', 'SI', 'SI'],
    ['CRIT-003', 'SedesAfectadas', 'Identificación de daños por sede', 'Se discriminan sedes con nivel de daño y habitabilidad.', 'SI', 'SI'],
    ['CRIT-004', 'SedesAfectadas', 'Censo escolar afectado', 'Estudiantes y docentes impactados por sede.', 'SI', 'SI'],
    ['CRIT-005', 'Estrategia', 'Modalidad pedagógica definida', 'Se define la modalidad (alternancia, guías impresas, virtualidad).', 'SI', 'SI'],
    ['CRIT-006', 'Cronograma', 'Planificación temporal coherente', 'Fases y fechas claras para el restablecimiento del servicio.', 'SI', 'SI'],
    ['CRIT-007', 'EvidenciaActividades', 'Soportes de desarrollo institucional', 'Actas, listas y registro de actividades desarrolladas.', 'SI', 'SI'],
    ['CRIT-008', 'Requerimientos', 'Solicitudes de apoyo técnico/financiero', 'Justificación puntual de necesidades requeridas a la SED.', 'NO', 'SI']
  ];
  criterios.forEach(function(c) { sheetCrit.appendRow(c); });

  // 3. Crear Carpeta Raíz en Google Drive
  try {
    var driveRoot = DriveService.getRootFolder();
    Logger.log('Configuración completada con éxito.');
    Logger.log('Carpeta Drive: ' + driveRoot.getUrl());
  } catch (e) {
    Logger.log('Aviso Drive: ' + e.message);
  }
}
