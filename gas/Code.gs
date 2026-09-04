/**
 * ENTRYPOINT Y ENRUTADOR DE API - GOOGLE APPS SCRIPT
 */

function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "API SED Caldas - Planes de Contingencia",
    version: CONFIG.VERSION,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Control de concurrencia
    lock.waitLock(30000);

    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    let result;

    switch (action) {
      case 'obtenerMunicipios':
        result = InstitucionesService.obtenerMunicipios();
        break;

      case 'obtenerInstituciones':
        result = InstitucionesService.obtenerInstituciones(postData.municipio);
        break;

      case 'obtenerCriterios':
        result = CriteriosService.obtenerCriterios(postData.tipo_documento);
        break;

      case 'crearEnvio':
        result = EnviosService.crearEnvio(postData.envio, postData.documentos);
        break;

      case 'obtenerEnvios':
        result = EnviosService.obtenerEnvios(postData);
        break;

      case 'obtenerDocumentos':
        result = DocumentosService.obtenerDocumentos(postData.id_envio);
        break;

      case 'evaluarDocumento':
        result = EvaluacionesService.evaluarDocumento(postData);
        break;

      case 'finalizarEvaluacion':
        result = EvaluacionesService.finalizarEvaluacion(postData);
        break;

      case 'obtenerAuditoria':
        result = AuditoriaService.obtenerAuditoria(postData);
        break;

      case 'obtenerDashboard':
        result = DashboardService.obtenerDashboard();
        break;

      default:
        throw new Error(`Acción no reconocida: ${action}`);
    }

    return createJsonResponse({
      success: true,
      data: result
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.message
    });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
