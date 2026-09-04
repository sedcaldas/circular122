/**
 * GESTOR DE VALIDACIÓN Y PROCESAMIENTO DOCUMENTAL
 * Nomenclatura oficial: IE_CODDANE_TipoDocumento_vXX.ext
 */

class SedDocumentManager {
  constructor() {
    this.uploadedFiles = {}; // { tipo: { file, base64, nombreOriginal, nombreSistema, version, size, esReemplazo } }
  }

  reset() {
    this.uploadedFiles = {};
  }

  setFile(tipo, fileObj, base64Content, codDane, version = '01', esReemplazo = false) {
    const ext = fileObj.name.split('.').pop().toLowerCase();
    const nombreSistema = `IE_${codDane}_${tipo}_v${version.toString().padStart(2, '0')}.${ext}`;

    this.uploadedFiles[tipo] = {
      file: fileObj,
      base64: base64Content,
      nombreOriginal: fileObj.name,
      nombreSistema: nombreSistema,
      tipo: tipo,
      version: version.toString().padStart(2, '0'),
      size: fileObj.size,
      mimeType: fileObj.type || 'application/octet-stream',
      esReemplazo: esReemplazo,
      fechaCarga: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    return this.uploadedFiles[tipo];
  }

  getFile(tipo) {
    return this.uploadedFiles[tipo] || null;
  }

  removeFile(tipo) {
    delete this.uploadedFiles[tipo];
  }

  getAllFiles() {
    return Object.values(this.uploadedFiles);
  }

  validateFile(file) {
    // 1. Validar extensión
    const ext = file.name.split('.').pop().toLowerCase();
    if (!APP_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Formato de archivo .${ext} no permitido. Formatos admitidos: ${APP_CONFIG.ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
      };
    }

    // 2. Validar tamaño máximo
    const maxBytes = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `El archivo supera el tamaño máximo permitido de ${APP_CONFIG.MAX_FILE_SIZE_MB} MB (${(file.size / (1024*1024)).toFixed(1)} MB).`
      };
    }

    // 3. Validar no vacío
    if (file.size === 0) {
      return {
        valid: false,
        error: 'El archivo seleccionado está vacío (0 bytes).'
      };
    }

    return { valid: true };
  }

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1] || '');
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  validateMandatoryDocuments() {
    const missing = [];
    APP_CONFIG.DOCUMENTOS_REQUERIDOS.forEach(docDef => {
      if (docDef.obligatorio && !this.uploadedFiles[docDef.tipo]) {
        missing.push(docDef.nombre);
      }
    });
    return {
      complete: missing.length === 0,
      missingDocs: missing
    };
  }
}

const docManager = new SedDocumentManager();
