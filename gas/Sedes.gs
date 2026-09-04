/**
 * SERVICIO DE SEDES EDUCATIVAS (Google Sheets: SEDES)
 */

const SedesService = {
  obtenerSedes: function(codigoEstablecimiento) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.SEDES);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx]);
      if (!codigoEstablecimiento || item.codigo_establecimiento === codigoEstablecimiento) {
        list.push(item);
      }
    }
    return list;
  }
};
