/**
 * SERVICIO DE DASHBOARD Y AGREGACIONES (Google Apps Script)
 */

const DashboardService = {
  obtenerDashboard: function() {
    const envios = EnviosService.obtenerEnvios({});
    const totalIEs = InstitucionesService.obtenerInstituciones().length;

    let aprobados = 0;
    let correccion = 0;
    let revision = 0;

    envios.forEach(e => {
      if (e.estado === 'APROBADO') aprobados++;
      else if (e.estado === 'REQUIERE_CORRECCION') correccion++;
      else revision++;
    });

    return {
      totalIEs: totalIEs,
      radicados: envios.length,
      aprobados: aprobados,
      correccion: correccion,
      enRevision: revision,
      pendientes: Math.max(0, totalIEs - envios.length)
    };
  }
};
