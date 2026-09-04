/**
 * SERVICIO DE ALMACENAMIENTO DOCUMENTAL EN GOOGLE DRIVE
 * Jerarquía: ROOT / [MUNICIPIO] / IE_[CODDANE] / v[XX]
 */

const DriveService = {
  getRootFolder: function() {
    const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
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
    const muniFolder = this.getOrCreateSubfolder(root, municipio.toUpperCase());
    const ieFolder = this.getOrCreateSubfolder(muniFolder, `IE_${codigoDANE}`);
    const verFolder = this.getOrCreateSubfolder(ieFolder, `v${version.toString().padStart(2, '0')}`);

    const ext = nombreOriginal.split('.').pop();
    const nombreSistema = `IE_${codigoDANE}_${tipoDocumento}_v${version.toString().padStart(2, '0')}.${ext}`;

    const decoded = Utilities.base64Decode(base64Data);
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
