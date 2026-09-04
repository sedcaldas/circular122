/**
 * SERVICIO DE CONSULTA DE INSTITUCIONES Y MUNICIPIOS
 */

const InstitucionesService = {
  obtenerMunicipios: function() {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.INSTITUCIONES);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const muniIdx = headers.indexOf('municipio');

    const munis = new Set();
    for (let i = 1; i < data.length; i++) {
      if (data[i][muniIdx]) {
        munis.add(data[i][muniIdx].toString().trim());
      }
    }
    return Array.from(munis).sort();
  },

  obtenerInstituciones: function(municipioFiltro) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.INSTITUCIONES);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const muniIdx = headers.indexOf('municipio');
    const codIdx = headers.indexOf('codigo_establecimiento');
    const nomIdx = headers.indexOf('nombre_establecimiento');

    const result = [];
    for (let i = 1; i < data.length; i++) {
      const muni = data[i][muniIdx] ? data[i][muniIdx].toString().trim() : '';
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
