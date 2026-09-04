/**
 * ==============================================================================
 * SISTEMA DE GESTIÓN Y SEGUIMIENTO DE PLANES DE CONTINGENCIA - SED CALDAS
 * CIRCULAR Nº 122 - VIGENCIA 2026
 * 
 * ARCHIVO ÚNICO CONSOLIDADO PARA GOOGLE APPS SCRIPT (GAS)
 * ==============================================================================
 * 
 * Instrucciones de uso en Google Apps Script:
 * 1. Cree un proyecto de Apps Script vinculado a su Hoja de Google Sheets o independiente.
 * 2. Pegue la totalidad de este código en el editor (reemplazando cualquier archivo duplicado).
 * 3. Seleccione la función 'setupSistemaCompleto' en la barra superior y haga clic en 'Ejecutar'.
 * 4. Otorgue los permisos de Google Sheets, Drive y Gmail solicitados.
 * 5. Haga clic en 'Implementar' > 'Nueva implementación' > Tipo: 'Aplicación web'.
 *    - Ejecutar como: "Yo" (su cuenta)
 *    - Quién tiene acceso: "Cualquier persona" (o según política institucional)
 * 6. Copie la URL de la aplicación web y configúrela en el frontend (js/config.js).
 */

// ==============================================================================
// 1. CONFIGURACIÓN GENERAL
// ==============================================================================

var CONFIG = {
  VERSION: "1.0.0",
  VIGENCIA: "2026",
  MAX_FILE_SIZE_MB: 10,
  ROOT_FOLDER_NAME: "SED CALDAS - PLANES DE CONTINGENCIA",
  ROOT_FOLDER_ID: "1bIV0LOJ3KeUlD5zUwwdwJGAxqDeUOiMa",
  EMAIL_FROM_NAME: "Secretaría de Educación de Caldas",
  
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

  DOCUMENTOS_REQUERIDOS: [
    "PlanContingencia",
    "SedesAfectadas",
    "Estrategia",
    "Cronograma",
    "EvidenciaActividades",
    "Requerimientos"
  ]
};

function getSpreadsheet() {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ==============================================================================
// 2. ENRUTADOR HTTP (API REST / WEBHOOK)
// ==============================================================================

function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "API SED Caldas - Planes de Contingencia Circular 122",
    version: CONFIG.VERSION,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var result;

    switch (action) {
      case 'obtenerMunicipios':
        result = InstitucionesService.obtenerMunicipios();
        break;

      case 'obtenerInstituciones':
        result = InstitucionesService.obtenerInstituciones(postData.municipio);
        break;

      case 'obtenerSedes':
        result = SedesService.obtenerSedes(postData.codigo_establecimiento);
        break;

      case 'obtenerCriterios':
        result = CriteriosService.obtenerCriterios(postData.tipo_documento);
        break;

      case 'crearEnvio':
        result = EnviosService.crearEnvio(postData.envio, postData.documentos);
        break;

      case 'obtenerEnvios':
        result = EnviosService.obtenerEnvios(postData);
        break;

      case 'obtenerDocumentos':
        result = DocumentosService.obtenerDocumentos(postData.id_envio);
        break;

      case 'evaluarDocumento':
        result = EvaluacionesService.evaluarDocumento(postData);
        break;

      case 'finalizarEvaluacion':
        result = EvaluacionesService.finalizarEvaluacion(postData);
        break;

      case 'obtenerAuditoria':
        result = AuditoriaService.obtenerAuditoria(postData);
        break;

      case 'obtenerDashboard':
        result = DashboardService.obtenerDashboard();
        break;

      case 'obtenerUsuarios':
        result = UsuariosService.obtenerUsuarios();
        break;

      case 'guardarUsuario':
        result = UsuariosService.guardarUsuario(postData.usuario);
        break;

      case 'eliminarUsuario':
        result = UsuariosService.eliminarUsuario(postData.id_usuario);
        break;

      case 'cambiarEstadoUsuario':
        result = UsuariosService.cambiarEstadoUsuario(postData.id_usuario, postData.estado);
        break;

      case 'verificarAcceso':
        result = UsuariosService.verificarAcceso(postData.correo, postData.rol);
        break;

      default:
        throw new Error("Acción no reconocida: " + action);
    }

    return createJsonResponse({
      success: true,
      data: result
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.message
    });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 3. SERVICIO DE INSTITUCIONES Y MUNICIPIOS
// ==============================================================================

var InstitucionesService = {
  obtenerMunicipios: function() {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.INSTITUCIONES);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var muniIdx = headers.indexOf('municipio');

    var munis = {};
    for (var i = 1; i < data.length; i++) {
      var m = data[i][muniIdx];
      if (m) {
        var trimmed = m.toString().trim();
        if (trimmed.toUpperCase() !== 'MANIZALES') {
          munis[trimmed] = true;
        }
      }
    }
    return Object.keys(munis).sort();
  },

  obtenerInstituciones: function(municipioFiltro) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.INSTITUCIONES);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var muniIdx = headers.indexOf('municipio');
    var codIdx = headers.indexOf('codigo_establecimiento');
    var nomIdx = headers.indexOf('nombre_establecimiento');

    var result = [];
    for (var i = 1; i < data.length; i++) {
      var muni = data[i][muniIdx] ? data[i][muniIdx].toString().trim() : '';
      if (muni.toUpperCase() === 'MANIZALES') continue;

      if (!municipioFiltro || muni.toUpperCase() === municipioFiltro.toUpperCase()) {
        result.push({
          municipio: muni,
          codigo_establecimiento: data[i][codIdx] ? data[i][codIdx].toString().trim() : '',
          nombre_establecimiento: data[i][nomIdx] ? data[i][nomIdx].toString().trim() : ''
        });
      }
    }
    return result;
  }
};

// ==============================================================================
// 4. SERVICIO DE SEDES EDUCATIVAS
// ==============================================================================

var SedesService = {
  obtenerSedes: function(codigoEstablecimiento) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.SEDES);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      headers.forEach(function(h, idx) { item[h] = row[idx]; });
      if (!codigoEstablecimiento || item.codigo_establecimiento === codigoEstablecimiento) {
        list.push(item);
      }
    }
    return list;
  }
};

// ==============================================================================
// 5. SERVICIO DE CRITERIOS DE EVALUACIÓN
// ==============================================================================

var CriteriosService = {
  obtenerCriterios: function(tipoDocFiltro) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.CRITERIOS_EVALUACION);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      headers.forEach(function(h, idx) { item[h] = row[idx]; });
      if (!tipoDocFiltro || item.tipo_documento === tipoDocFiltro) {
        list.push(item);
      }
    }
    return list;
  }
};

// ==============================================================================
// 6. SERVICIO TRANSACCIONAL DE ENVÍOS
// ==============================================================================

var EnviosService = {
  crearEnvio: function(envioData, documentosData) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    if (!sheet) throw new Error('Hoja ENVIOS no encontrada.');

    var now = new Date();
    var fecha = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var hora = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    var fechaHora = fecha + ' ' + hora;

    var idEnvio = envioData.id_envio || ('ENV-2026-' + Math.floor(100000 + Math.random() * 900000));
    var version = (envioData.version || '01').toString();
    if (version.length < 2) version = '0' + version;

    sheet.appendRow([
      idEnvio,
      fecha,
      hora,
      envioData.municipio,
      envioData.codigo_establecimiento,
      envioData.nombre_establecimiento,
      envioData.id_usuario || 'ANON',
      envioData.correo_usuario,
      version,
      'EN_REVISION',
      fechaHora,
      envioData.observaciones_generales || ''
    ]);

    if (documentosData && documentosData.length > 0) {
      documentosData.forEach(function(doc, idx) {
        var driveResult = { id_drive: '', url_drive: '', nombre_sistema: doc.nombre_sistema };
        if (doc.base64) {
          try {
            driveResult = DriveService.guardarArchivo(
              envioData.municipio,
              envioData.codigo_establecimiento,
              version,
              doc.tipo_documento,
              doc.nombre_original,
              doc.base64
            );
          } catch (e) {
            Logger.log('Error al guardar archivo en Drive para ' + doc.tipo_documento + ': ' + e.message);
          }
        }

        var docNum = (idx + 1).toString();
        if (docNum.length < 2) docNum = '0' + docNum;

        DocumentosService.registrarDocumento({
          id_documento: 'DOC-' + idEnvio.replace('ENV-2026-', '') + '-' + docNum,
          id_envio: idEnvio,
          municipio: envioData.municipio,
          codigo_establecimiento: envioData.codigo_establecimiento,
          tipo_documento: doc.tipo_documento,
          nombre_original: doc.nombre_original,
          nombre_sistema: driveResult.nombre_sistema || doc.nombre_sistema,
          id_drive: driveResult.id_drive,
          url_drive: driveResult.url_drive,
          version: version,
          fecha_carga: fechaHora,
          usuario_carga: envioData.correo_usuario,
          estado_revision: 'PENDIENTE',
          observaciones: ''
        });
      });
    }

    AuditoriaService.registrar({
      usuario: envioData.correo_usuario,
      rol: 'RECTOR',
      accion: version === '01' ? 'CREAR_ENVIO' : 'CREAR_VERSION',
      municipio: envioData.municipio,
      codigo_establecimiento: envioData.codigo_establecimiento,
      id_envio: idEnvio,
      version: version,
      resultado: 'EXITO',
      observacion: 'Plan de contingencia radicado (' + (documentosData ? documentosData.length : 0) + ' documentos).'
    });

    try {
      CorreosService.enviarConfirmacionRecepcion({
        correo: envioData.correo_usuario,
        id_envio: idEnvio,
        institucion: envioData.nombre_establecimiento,
        municipio: envioData.municipio,
        codigo_establecimiento: envioData.codigo_establecimiento,
        version: version,
        fecha: fechaHora,
        documentos: documentosData || []
      });
    } catch (e) {
      Logger.log('Error al enviar correo: ' + e.message);
    }

    return {
      id_envio: idEnvio,
      version: version,
      estado: 'EN_REVISION',
      fecha_envio: fecha,
      hora_envio: hora
    };
  },

  obtenerEnvios: function(filtros) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];
    filtros = filtros || {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      headers.forEach(function(h, idx) { item[h] = row[idx]; });

      var match = true;
      if (filtros.municipio && filtros.municipio !== 'TODOS' && item.municipio !== filtros.municipio) match = false;
      if (filtros.codigo_establecimiento && item.codigo_establecimiento !== filtros.codigo_establecimiento) match = false;
      if (filtros.estado && filtros.estado !== 'TODOS' && item.estado !== filtros.estado) match = false;

      if (match) list.push(item);
    }

    return list.reverse();
  }
};

// ==============================================================================
// 7. SERVICIO DE DOCUMENTOS
// ==============================================================================

var DocumentosService = {
  registrarDocumento: function(doc) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
    if (!sheet) return;

    sheet.appendRow([
      doc.id_documento,
      doc.id_envio,
      doc.municipio,
      doc.codigo_establecimiento,
      doc.tipo_documento,
      doc.nombre_original,
      doc.nombre_sistema,
      doc.id_drive,
      doc.url_drive,
      doc.version,
      doc.fecha_carga,
      doc.usuario_carga,
      doc.estado_revision || 'PENDIENTE',
      doc.observaciones || ''
    ]);
  },

  obtenerDocumentos: function(id_envio) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      headers.forEach(function(h, idx) { item[h] = row[idx]; });
      if (item.id_envio === id_envio) {
        list.push(item);
      }
    }
    return list;
  },

  actualizarRevision: function(id_documento, estado_revision, observaciones) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf('id_documento');
    var estadoIdx = headers.indexOf('estado_revision');
    var obsIdx = headers.indexOf('observaciones');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id_documento) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(estado_revision);
        sheet.getRange(i + 1, obsIdx + 1).setValue(observaciones || '');
        break;
      }
    }
  }
};

// ==============================================================================
// 8. SERVICIO DE EVALUACIONES TÉCNICAS
// ==============================================================================

var EvaluacionesService = {
  evaluarDocumento: function(payload) {
    DocumentosService.actualizarRevision(
      payload.id_documento,
      payload.estado_revision,
      payload.observaciones
    );

    AuditoriaService.registrar({
      usuario: payload.usuario || 'Coordinador',
      rol: 'COORDINADOR',
      accion: 'EVALUAR_DOCUMENTO',
      id_documento: payload.id_documento,
      resultado: payload.estado_revision,
      observacion: payload.observaciones || ''
    });

    return { success: true };
  },

  finalizarEvaluacion: function(payload) {
    var idEnvio = payload.id_envio;
    var docs = DocumentosService.obtenerDocumentos(idEnvio);

    var todosObligatoriosCumplen = true;
    var observados = [];

    docs.forEach(function(d) {
      var esOpcional = d.tipo_documento === 'Requerimientos';
      if (!esOpcional) {
        if (d.estado_revision !== 'CUMPLE') {
          todosObligatoriosCumplen = false;
          observados.push(d.tipo_documento + ': ' + (d.observaciones || 'No cumple con los criterios'));
        }
      }
    });

    var estadoFinal = todosObligatoriosCumplen ? 'APROBADO' : 'REQUIERE_CORRECCION';
    var obsGeneral = payload.observaciones_generales || observados.join(' | ') || (estadoFinal === 'APROBADO' ? 'Plan de contingencia validado y aprobado.' : 'Requiere subsanación.');

    var ss = getSpreadsheet();
    var sheetEnvios = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    var data = sheetEnvios.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf('id_envio');
    var estadoIdx = headers.indexOf('estado');
    var obsIdx = headers.indexOf('observaciones_generales');
    var fechaUpdIdx = headers.indexOf('fecha_ultima_actualizacion');

    var envioActual = null;
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idEnvio) {
        sheetEnvios.getRange(i + 1, estadoIdx + 1).setValue(estadoFinal);
        sheetEnvios.getRange(i + 1, obsIdx + 1).setValue(obsGeneral);
        sheetEnvios.getRange(i + 1, fechaUpdIdx + 1).setValue(nowStr);

        envioActual = {};
        headers.forEach(function(h, idx) { envioActual[h] = data[i][idx]; });
        envioActual.estado = estadoFinal;
        envioActual.observaciones_generales = obsGeneral;
        break;
      }
    }

    AuditoriaService.registrar({
      usuario: payload.usuario || 'Coordinador',
      rol: 'COORDINADOR',
      accion: estadoFinal === 'APROBADO' ? 'APROBAR' : 'SOLICITAR_CORRECCION',
      id_envio: idEnvio,
      resultado: estadoFinal,
      observacion: obsGeneral
    });

    if (envioActual && envioActual.correo_usuario) {
      try {
        if (estadoFinal === 'APROBADO') {
          CorreosService.enviarNotificacionAprobacion(envioActual);
        } else {
          CorreosService.enviarSolicitudCorreccion(envioActual, observados);
        }
      } catch (e) {
        Logger.log('Error enviando notificación: ' + e.message);
      }
    }

    return {
      id_envio: idEnvio,
      estadoFinal: estadoFinal,
      observaciones: obsGeneral
    };
  }
};

// ==============================================================================
// 9. SERVICIO DE ALMACENAMIENTO EN GOOGLE DRIVE
// ==============================================================================

var DriveService = {
  getRootFolder: function() {
    // 1. Prioridad: Buscar por ID si está configurado en Script Properties o en CONFIG
    var folderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID') || CONFIG.ROOT_FOLDER_ID;
    if (folderId && folderId.toString().trim() !== '') {
      try {
        return DriveApp.getFolderById(folderId.toString().trim());
      } catch (e) {
        Logger.log('Aviso: No se pudo acceder por ROOT_FOLDER_ID (' + folderId + '): ' + e.message);
      }
    }

    // 2. Fallback: Buscar por nombre en Google Drive
    var folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }

    // 3. Crear nueva carpeta raíz si no existe
    return DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  },

  getOrCreateSubfolder: function(parentFolder, folderName) {
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parentFolder.createFolder(folderName);
  },

  guardarArchivo: function(municipio, codigoDANE, version, tipoDocumento, nombreOriginal, base64Data) {
    var root = this.getRootFolder();
    var muniFolder = this.getOrCreateSubfolder(root, (municipio || 'SIN_MUNICIPIO').toUpperCase());
    var ieFolder = this.getOrCreateSubfolder(muniFolder, 'IE_' + codigoDANE);
    var verPad = version.toString();
    if (verPad.length < 2) verPad = '0' + verPad;
    var verFolder = this.getOrCreateSubfolder(ieFolder, 'v' + verPad);

    var parts = nombreOriginal.split('.');
    var ext = parts.length > 1 ? parts.pop() : 'pdf';
    var nombreSistema = 'IE_' + codigoDANE + '_' + tipoDocumento + '_v' + verPad + '.' + ext;

    // Limpieza de prefijo Base64 (data:application/pdf;base64,...) si viene incluido
    var cleanBase64 = base64Data;
    if (cleanBase64 && cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, this.getMimeType(ext), nombreSistema);
    
    var file = verFolder.createFile(blob);
    file.setDescription('Plan de Contingencia - ' + tipoDocumento + ' - Versión ' + version);

    return {
      id_drive: file.getId(),
      url_drive: file.getUrl(),
      nombre_sistema: nombreSistema
    };
  },

  getMimeType: function(ext) {
    var map = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };
    return map[ext.toLowerCase()] || 'application/octet-stream';
  }
};

// ==============================================================================
// 10. SERVICIO DE CORREOS ELECTRÓNICOS
// ==============================================================================

var CorreosService = {
  enviarConfirmacionRecepcion: function(datos) {
    var asunto = 'Confirmación de recepción – Plan de contingencia – ' + datos.institucion;
    var cuerpoHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">' +
      '<div style="background: #007a33; color: #ffffff; padding: 1.5rem; text-align: center;">' +
      '<h2 style="margin: 0; font-size: 1.3rem;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>' +
      '<p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Constancia de Radicación - Circular Nº 122</p>' +
      '</div>' +
      '<div style="padding: 1.5rem; background: #ffffff;">' +
      '<p>Apreciado(a) Directivo(a) Docente:</p>' +
      '<p>Le confirmamos que el <strong>Plan de Contingencia</strong> ha sido radicado exitosamente en el sistema institucional.</p>' +
      '<table style="width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem;">' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Número de Radicado:</strong></td><td style="padding: 6px;"><code>' + datos.id_envio + '</code></td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Institución Educativa:</strong></td><td style="padding: 6px;">' + datos.institucion + '</td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Municipio:</strong></td><td style="padding: 6px;">' + datos.municipio + '</td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Código DANE:</strong></td><td style="padding: 6px;">' + datos.codigo_establecimiento + '</td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Versión:</strong></td><td style="padding: 6px;">v' + datos.version + '</td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Fecha y Hora:</strong></td><td style="padding: 6px;">' + datos.fecha + '</td></tr>' +
      '<tr><td style="padding: 6px; color: #64748b;"><strong>Estado Actual:</strong></td><td style="padding: 6px;"><strong style="color: #d97706;">EN REVISIÓN</strong></td></tr>' +
      '</table>' +
      '<p style="font-size: 0.85rem; color: #64748b;">El equipo directivo y técnico de la SED Caldas revisará la documentación y emitirá el dictamen oficial correspondiente.</p>' +
      '</div>' +
      '<div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">' +
      'Gobernación de Caldas – Secretaría de Educación Departamental' +
      '</div></div>';

    GmailApp.sendEmail(datos.correo, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  },

  enviarSolicitudCorreccion: function(envio, observados) {
    var asunto = 'Requerimiento de Corrección – Plan de contingencia – ' + envio.nombre_establecimiento;
    var listado = observados.map(function(o) { return '<li>' + o + '</li>'; }).join('');
    var cuerpoHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">' +
      '<div style="background: #be123c; color: #ffffff; padding: 1.5rem; text-align: center;">' +
      '<h2 style="margin: 0; font-size: 1.3rem;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>' +
      '<p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Observaciones Técnicas al Plan de Contingencia</p>' +
      '</div>' +
      '<div style="padding: 1.5rem; background: #ffffff;">' +
      '<p>Apreciado(a) Rector(a):</p>' +
      '<p>Tras la evaluación técnica realizada al Plan de Contingencia radicado (<strong>' + envio.id_envio + '</strong> - v' + envio.version + '), se ha determinado que el documento <strong>REQUIERE CORRECCIÓN</strong>.</p>' +
      '<div style="background: #fff1f2; border-left: 4px solid #be123c; padding: 1rem; margin: 1rem 0;">' +
      '<h4 style="margin: 0 0 0.5rem; color: #9f1239;">Documentos y Criterios a Subsanar:</h4>' +
      '<ul style="margin: 0; padding-left: 1.2rem; font-size: 0.9rem;">' + listado + '</ul>' +
      '</div>' +
      '<p><strong>Instrucciones para radicar nueva versión:</strong></p>' +
      '<ol style="font-size: 0.9rem; padding-left: 1.2rem; color: #334155;">' +
      '<li>Ingrese al portal de planes de contingencia.</li>' +
      '<li>Consulte su radicado con el código DANE <strong>' + envio.codigo_establecimiento + '</strong>.</li>' +
      '<li>Haga clic en <em>"Subsanar / Radicar Nueva Versión"</em>.</li>' +
      '<li>Reemplace únicamente los documentos observados y confirme el envío.</li>' +
      '</ol></div>' +
      '<div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">' +
      'Gobernación de Caldas – Secretaría de Educación Departamental' +
      '</div></div>';

    GmailApp.sendEmail(envio.correo_usuario, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  },

  enviarNotificacionAprobacion: function(envio) {
    var asunto = 'Aprobación de Plan de Contingencia – ' + envio.nombre_establecimiento;
    var cuerpoHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">' +
      '<div style="background: #007a33; color: #ffffff; padding: 1.5rem; text-align: center;">' +
      '<h2 style="margin: 0; font-size: 1.3rem;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>' +
      '<p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Constancia de Aprobación de Plan de Contingencia</p>' +
      '</div>' +
      '<div style="padding: 1.5rem; background: #ffffff;">' +
      '<p>Apreciado(a) Rector(a):</p>' +
      '<p>Nos complace informarle que el <strong>Plan de Contingencia</strong> radicado bajo el número <strong>' + envio.id_envio + '</strong> (Versión ' + envio.version + ') ha sido <strong>APROBADO SATISFACTORIAMENTE</strong> por la Secretaría de Educación de Caldas.</p>' +
      '<div style="background: #f0fdf4; border-left: 4px solid #007a33; padding: 1rem; margin: 1rem 0;">' +
      '<p style="margin: 0; color: #166534; font-weight: bold;">El plan cumple con todos los requerimientos establecidos en la Circular Nº 122.</p>' +
      '</div></div>' +
      '<div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">' +
      'Gobernación de Caldas – Secretaría de Educación Departamental' +
      '</div></div>';

    GmailApp.sendEmail(envio.correo_usuario, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  }
};

// ==============================================================================
// 11. SERVICIO DE AUDITORÍA Y TRAZABILIDAD
// ==============================================================================

var AuditoriaService = {
  registrar: function(entry) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
    if (!sheet) return;

    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var idAudit = 'AUD-' + Date.now().toString(36).toUpperCase();

    sheet.appendRow([
      idAudit,
      nowStr,
      entry.usuario || 'Desconocido',
      entry.rol || 'CONSULTA',
      entry.accion || 'ACCION',
      entry.municipio || '',
      entry.codigo_establecimiento || '',
      entry.id_envio || '',
      entry.id_documento || '',
      entry.version || '01',
      entry.resultado || 'EXITO',
      entry.observacion || ''
    ]);
  },

  obtenerAuditoria: function(filtros) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      headers.forEach(function(h, idx) { item[h] = row[idx]; });
      list.push(item);
    }
    return list.reverse().slice(0, 100);
  }
};

// ==============================================================================
// 12. SERVICIO DE USUARIOS Y ROLES
// ==============================================================================

var UsuariosService = {
  obtenerUsuarios: function() {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var list = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[3]) continue;
      var item = {};
      headers.forEach(function(h, idx) {
        item[h] = row[idx] !== undefined ? row[idx].toString().trim() : '';
      });
      list.push(item);
    }
    return list;
  },

  guardarUsuario: function(usuarioData) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) throw new Error('Hoja USUARIOS no encontrada.');

    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf('id_usuario');
    var emailIdx = headers.indexOf('correo');

    var idUsuario = usuarioData.id_usuario || ('USR-' + Math.floor(100 + Math.random() * 900));
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if ((idIdx >= 0 && data[i][idIdx] === idUsuario) || (emailIdx >= 0 && data[i][emailIdx].toString().toLowerCase() === usuarioData.correo.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }

    var rowValues = [
      idUsuario,
      usuarioData.nombre || '',
      usuarioData.cargo || '',
      (usuarioData.correo || '').toLowerCase().trim(),
      usuarioData.telefono || '',
      usuarioData.municipio || 'TODOS',
      usuarioData.codigo_establecimiento || '',
      (usuarioData.rol || 'COORDINADOR').toUpperCase().trim(),
      (usuarioData.estado || 'ACTIVO').toUpperCase().trim(),
      usuarioData.fecha_registro || now,
      now
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return {
      success: true,
      id_usuario: idUsuario,
      usuario: usuarioData
    };
  },

  eliminarUsuario: function(idUsuario) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return false;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf('id_usuario');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idUsuario) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  },

  cambiarEstadoUsuario: function(idUsuario, nuevoEstado) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return false;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf('id_usuario');
    var estadoIdx = headers.indexOf('estado');
    var actIdx = headers.indexOf('fecha_actualizacion');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idUsuario) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(nuevoEstado.toUpperCase());
        if (actIdx >= 0) {
          var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          sheet.getRange(i + 1, actIdx + 1).setValue(now);
        }
        return true;
      }
    }
    return false;
  },

  verificarAcceso: function(correo, rolRequerido) {
    var usuarios = this.obtenerUsuarios();
    var emailNorm = (correo || '').toLowerCase().trim();
    var rolNorm = (rolRequerido || '').toUpperCase().trim();

    var user = null;
    for (var i = 0; i < usuarios.length; i++) {
      if ((usuarios[i].correo || '').toLowerCase().trim() === emailNorm && usuarios[i].estado === 'ACTIVO') {
        user = usuarios[i];
        break;
      }
    }

    if (!user) {
      return { autorizado: false, mensaje: 'Usuario no registrado o inactivo en el sistema.' };
    }

    if (user.rol === 'ADMINISTRADOR') {
      return { autorizado: true, usuario: user };
    }

    if (user.rol === rolNorm) {
      return { autorizado: true, usuario: user };
    }

    return { autorizado: false, mensaje: 'El correo ' + correo + ' no tiene permisos para el perfil ' + rolRequerido + '.' };
  }
};

// ==============================================================================
// 13. SERVICIO DE DASHBOARD Y MÉTRICAS
// ==============================================================================

var DashboardService = {
  obtenerDashboard: function() {
    var envios = EnviosService.obtenerEnvios({});
    var totalIEs = InstitucionesService.obtenerInstituciones().length || 163;

    var aprobados = 0;
    var correccion = 0;
    var revision = 0;

    envios.forEach(function(e) {
      if (e.estado === 'APROBADO') aprobados++;
      else if (e.estado === 'REQUIERE_CORRECCION') correccion++;
      else revision++;
    });

    return {
      totalIEs: totalIEs,
      radicados: envios.length,
      aprobados: aprobados,
      correccion: correccion,
      enRevision: revision,
      pendientes: Math.max(0, totalIEs - envios.length)
    };
  }
};

// ==============================================================================
// 14. INSTALACIÓN Y CONFIGURACIÓN AUTOMÁTICA (SETUP)
// ==============================================================================

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

  // 3. Cargar Usuarios Iniciales Autorizados
  var sheetUsers = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
  var fechaNow = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  var usuariosIniciales = [
    ['USR-001', 'Rector Marino Gómez', 'Rector', 'rector.marinogomez@sedcaldas.edu.co', '3104567890', 'AGUADAS', '117013000306', 'RECTOR', 'ACTIVO', fechaNow, fechaNow],
    ['USR-002', 'Dra. María Elena Restrepo', 'Coordinadora de Calidad y Cobertura', 'maria.restrepo@sedcaldas.gov.co', '3123456781', 'TODOS', '', 'COORDINADOR', 'ACTIVO', fechaNow, fechaNow],
    ['USR-003', 'Ing. Carlos Alberto Morales', 'Administrador del Sistema', 'admin.sistemas@sedcaldas.gov.co', '3119876543', 'TODOS', '', 'ADMINISTRADOR', 'ACTIVO', fechaNow, fechaNow],
    ['USR-004', 'Supervisión Departamental SED', 'Coordinador Técnico', 'hadiaz@sedcaldas.edu.co', '3100000000', 'TODOS', '', 'ADMINISTRADOR', 'ACTIVO', fechaNow, fechaNow]
  ];
  usuariosIniciales.forEach(function(u) { sheetUsers.appendRow(u); });

  // 4. Crear Carpeta Raíz en Google Drive
  try {
    var driveRoot = DriveService.getRootFolder();
    Logger.log('Carpeta Drive creada/vinculada: ' + driveRoot.getUrl());
  } catch (e) {
    Logger.log('Aviso Drive: ' + e.message);
  }

  Logger.log('Configuración completada con éxito.');
}
