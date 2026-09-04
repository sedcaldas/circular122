/**
 * SERVICIO DE EVALUACIÓN TÉCNICA (Google Sheets: EVALUACIONES y ENVIOS)
 */

const EvaluacionesService = {
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
    const idEnvio = payload.id_envio;
    const docs = DocumentosService.obtenerDocumentos(idEnvio);
    const criterios = CriteriosService.obtenerCriterios();

    // Regla de Negocio: Todos los obligatorios deben tener CUMPLE
    let todosObligatoriosCumplen = true;
    const observados = [];

    docs.forEach(d => {
      // Por defecto los 5 primeros son obligatorios
      const esOpcional = d.tipo_documento === 'Requerimientos';
      if (!esOpcional) {
        if (d.estado_revision !== 'CUMPLE') {
          todosObligatoriosCumplen = false;
          observados.push(`${d.tipo_documento}: ${d.observaciones || 'No cumple con los criterios'}`);
        }
      }
    });

    const estadoFinal = todosObligatoriosCumplen ? 'APROBADO' : 'REQUIERE_CORRECCION';
    const obsGeneral = payload.observaciones_generales || observados.join(' | ') || (estadoFinal === 'APROBADO' ? 'Plan de contingencia validado y aprobado.' : 'Requiere subsanación.');

    // Actualizar estado en Hoja ENVIOS
    const ss = getSpreadsheet();
    const sheetEnvios = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    const data = sheetEnvios.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id_envio');
    const estadoIdx = headers.indexOf('estado');
    const obsIdx = headers.indexOf('observaciones_generales');
    const fechaUpdIdx = headers.indexOf('fecha_ultima_actualizacion');

    let envioActual = null;
    const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idEnvio) {
        sheetEnvios.getRange(i + 1, estadoIdx + 1).setValue(estadoFinal);
        sheetEnvios.getRange(i + 1, obsIdx + 1).setValue(obsGeneral);
        sheetEnvios.getRange(i + 1, fechaUpdIdx + 1).setValue(nowStr);

        envioActual = {};
        headers.forEach((h, idx) => envioActual[h] = data[i][idx]);
        envioActual.estado = estadoFinal;
        envioActual.observaciones_generales = obsGeneral;
        break;
      }
    }

    // Registrar en Auditoría
    AuditoriaService.registrar({
      usuario: payload.usuario || 'Coordinador',
      rol: 'COORDINADOR',
      accion: estadoFinal === 'APROBADO' ? 'APROBAR' : 'SOLICITAR_CORRECCION',
      id_envio: idEnvio,
      resultado: estadoFinal,
      observacion: obsGeneral
    });

    // Enviar correo de notificación
    if (envioActual && envioActual.correo_usuario) {
      if (estadoFinal === 'APROBADO') {
        CorreosService.enviarNotificacionAprobacion(envioActual);
      } else {
        CorreosService.enviarSolicitudCorreccion(envioActual, observados);
      }
    }

    return {
      id_envio: idEnvio,
      estadoFinal: estadoFinal,
      observaciones: obsGeneral
    };
  }
};
