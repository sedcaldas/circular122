/**
 * SERVICIO DE AUDITORÍA Y TRAZABILIDAD (Google Sheets: AUDITORIA)
 */

var AuditoriaService = {
  registrar: function(entry) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
    if (!sheet) return;

    const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const idAudit = 'AUD-' + Date.now().toString(36).toUpperCase();

    sheet.appendRow([
      idAudit,
      nowStr,
      entry.usuario || 'Desconocido',
      entry.rol || 'RECTOR',
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
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx]);
      list.push(item);
    }
    return list.reverse().slice(0, 100);
  }
};
