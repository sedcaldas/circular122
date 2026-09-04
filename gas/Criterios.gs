/**
 * SERVICIO DE CRITERIOS PARAMETRIZADOS (Google Sheets: CRITERIOS_EVALUACION)
 */

const CriteriosService = {
  obtenerCriterios: function(tipoDocFiltro) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CRITERIOS_EVALUACION);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx]);
      if (!tipoDocFiltro || item.tipo_documento === tipoDocFiltro) {
        list.push(item);
      }
    }
    return list;
  }
};
