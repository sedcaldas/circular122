/**
 * SERVICIO TRANSACCIONAL DE USUARIOS Y CONTROL DE ACCESOS (Google Sheets: USUARIOS)
 */

var UsuariosService = {
  obtenerUsuarios: function() {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    const list = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[3]) continue; // Fila vacía
      const item = {};
      headers.forEach((h, idx) => item[h] = row[idx] !== undefined ? row[idx].toString().trim() : '');
      list.push(item);
    }
    return list;
  },

  guardarUsuario: function(usuarioData) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) throw new Error('Hoja USUARIOS no encontrada.');

    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id_usuario');
    const emailIdx = headers.indexOf('correo');

    const idUsuario = usuarioData.id_usuario || `USR-${Math.floor(100 + Math.random() * 900)}`;
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if ((idIdx >= 0 && data[i][idIdx] === idUsuario) || (emailIdx >= 0 && data[i][emailIdx].toString().toLowerCase() === usuarioData.correo.toLowerCase())) {
        rowIndex = i + 1;
        break;
      }
    }

    const rowValues = [
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
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id_usuario');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idUsuario) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  },

  cambiarEstadoUsuario: function(idUsuario, nuevoEstado) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.USUARIOS);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id_usuario');
    const estadoIdx = headers.indexOf('estado');
    const actIdx = headers.indexOf('fecha_actualizacion');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idUsuario) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(nuevoEstado.toUpperCase());
        if (actIdx >= 0) {
          const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          sheet.getRange(i + 1, actIdx + 1).setValue(now);
        }
        return true;
      }
    }
    return false;
  },

  verificarAcceso: function(correo, rolRequerido) {
    const usuarios = this.obtenerUsuarios();
    const emailNorm = (correo || '').toLowerCase().trim();
    const rolNorm = (rolRequerido || '').toUpperCase().trim();

    const user = usuarios.find(u => (u.correo || '').toLowerCase().trim() === emailNorm && u.estado === 'ACTIVO');
    if (!user) {
      return { autorizado: false, mensaje: 'Usuario no registrado o inactivo en el sistema.' };
    }

    // Administrador tiene acceso total a todos los roles
    if (user.rol === 'ADMINISTRADOR') {
      return { autorizado: true, usuario: user };
    }

    if (user.rol === rolNorm) {
      return { autorizado: true, usuario: user };
    }

    return { autorizado: false, mensaje: `El correo ${correo} no tiene permisos para el perfil ${rolRequerido}.` };
  }
};
