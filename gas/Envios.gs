/**
 * SERVICIO TRANSACCIONAL DE ENVÍOS (Google Sheets: ENVIOS)
 */

var EnviosService = {
  crearEnvio: function(envioData, documentosData) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    if (!sheet) throw new Error('Hoja ENVIOS no encontrada.');

    const now = new Date();
    const fecha = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const hora = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    const fechaHora = `${fecha} ${hora}`;

    const idEnvio = envioData.id_envio || `ENV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const version = (envioData.version || '01').toString().padStart(2, '0');

    // Registrar en Hoja ENVIOS
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

    // Procesar Documentos en Drive y en Hoja DOCUMENTOS
    if (documentosData && documentosData.length > 0) {
      documentosData.forEach((doc, idx) => {
        let driveResult = { id_drive: '', url_drive: '', nombre_sistema: doc.nombre_sistema };
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

        DocumentosService.registrarDocumento({
          id_documento: `DOC-${idEnvio.replace('ENV-2026-','')}-${(idx+1).toString().padStart(2,'0')}`,
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

    // Auditoría
    AuditoriaService.registrar({
      usuario: envioData.correo_usuario,
      rol: 'RECTOR',
      accion: version === '01' ? 'CREAR_ENVIO' : 'CREAR_VERSION',
      municipio: envioData.municipio,
      codigo_establecimiento: envioData.codigo_establecimiento,
      id_envio: idEnvio,
      version: version,
      resultado: 'EXITO',
      observacion: `Plan de contingencia radicado (${documentosData ? documentosData.length : 0} documentos).`
    });

    // Enviar correo de confirmación de radicación
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
      console.error('Error al enviar correo:', e);
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
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ENVIOS);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx]);

      let match = true;
      if (filtros.municipio && filtros.municipio !== 'TODOS' && item.municipio !== filtros.municipio) match = false;
      if (filtros.codigo_establecimiento && item.codigo_establecimiento !== filtros.codigo_establecimiento) match = false;
      if (filtros.estado && filtros.estado !== 'TODOS' && item.estado !== filtros.estado) match = false;

      if (match) list.push(item);
    }

    return list.reverse();
  }
};
