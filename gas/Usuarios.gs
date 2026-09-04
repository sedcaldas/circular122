/**
 * SERVICIO DE USUARIOS Y ROLES (Google Sheets: USUARIOS)
 */

var UsuariosService = {
  obtenerUsuarios: function() {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
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
    return list;
  }
};
