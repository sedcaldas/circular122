/**
 * SERVICIO TRANSACCIONAL DE DOCUMENTOS (Google Sheets: DOCUMENTOS)
 */

const DocumentosService = {
  registrarDocumento: function(doc) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
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
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx]);
      if (item.id_envio === id_envio) {
        list.push(item);
      }
    }
    return list;
  },

  actualizarRevision: function(id_documento, estado_revision, observaciones) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTOS);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id_documento');
    const estadoIdx = headers.indexOf('estado_revision');
    const obsIdx = headers.indexOf('observaciones');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id_documento) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(estado_revision);
        sheet.getRange(i + 1, obsIdx + 1).setValue(observaciones || '');
        break;
      }
    }
  }
};
