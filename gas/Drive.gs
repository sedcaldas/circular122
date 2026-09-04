/**
 * SERVICIO DE ALMACENAMIENTO DOCUMENTAL EN GOOGLE DRIVE
 * Jerarquía: ROOT / [MUNICIPIO] / IE_[CODDANE] / v[XX]
 */

var DriveService = {
  getRootFolder: function() {
    // 1. Prioridad: Buscar por ID si está configurado en Script Properties o en CONFIG
    const folderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID') || CONFIG.ROOT_FOLDER_ID;
    if (folderId && folderId.trim() !== '') {
      try {
        return DriveApp.getFolderById(folderId.trim());
      } catch (e) {
        Logger.log('Aviso: No se pudo acceder por ROOT_FOLDER_ID (' + folderId + '): ' + e.message);
      }
    }

    // 2. Fallback: Buscar por nombre en Google Drive
    const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }

    // 3. Crear nueva carpeta raíz si no existe
    return DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  },

  getOrCreateSubfolder: function(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parentFolder.createFolder(folderName);
  },

  guardarArchivo: function(municipio, codigoDANE, version, tipoDocumento, nombreOriginal, base64Data) {
    const root = this.getRootFolder();
    const muniFolder = this.getOrCreateSubfolder(root, (municipio || 'SIN_MUNICIPIO').toUpperCase());
    const ieFolder = this.getOrCreateSubfolder(muniFolder, `IE_${codigoDANE}`);
    const verFolder = this.getOrCreateSubfolder(ieFolder, `v${version.toString().padStart(2, '0')}`);

    const ext = nombreOriginal.split('.').pop();
    const nombreSistema = `IE_${codigoDANE}_${tipoDocumento}_v${version.toString().padStart(2, '0')}.${ext}`;

    // Limpieza de prefijo Base64 (data:application/pdf;base64,...) si viene incluido
    let cleanBase64 = base64Data;
    if (cleanBase64 && cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    const decoded = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decoded, this.getMimeType(ext), nombreSistema);
    
    const file = verFolder.createFile(blob);
    file.setDescription(`Plan de Contingencia - ${tipoDocumento} - Versión ${version}`);

    return {
      id_drive: file.getId(),
      url_drive: file.getUrl(),
      nombre_sistema: nombreSistema
    };
  },

  getMimeType: function(ext) {
    const map = {
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
