/**
 * SERVICIO DE NOTIFICACIONES POR CORREO ELECTRÓNICO (GmailApp)
 */

var CorreosService = {
  enviarConfirmacionRecepcion: function(datos) {
    const asunto = `Confirmación de recepción – Plan de contingencia – ${datos.institucion}`;
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0f4c81; color: #ffffff; padding: 1.5rem; text-align: center;">
          <h2 style="margin: 0;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Constancia de Radicación - Circular Nº 122</p>
        </div>
        <div style="padding: 1.5rem; background: #ffffff;">
          <p>Apreciado(a) Directivo(a) Docente:</p>
          <p>Le confirmamos que el <strong>Plan de Contingencia</strong> ha sido radicado exitosamente en el sistema institucional.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem;">
            <tr><td style="padding: 6px; color: #64748b;"><strong>Número de Envío / Radicado:</strong></td><td style="padding: 6px;"><code>${datos.id_envio}</code></td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Institución Educativa:</strong></td><td style="padding: 6px;">${datos.institucion}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Municipio:</strong></td><td style="padding: 6px;">${datos.municipio}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Código DANE:</strong></td><td style="padding: 6px;">${datos.codigo_establecimiento}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Versión:</strong></td><td style="padding: 6px;">v${datos.version}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Fecha y Hora:</strong></td><td style="padding: 6px;">${datos.fecha}</td></tr>
            <tr><td style="padding: 6px; color: #64748b;"><strong>Estado Actual:</strong></td><td style="padding: 6px;"><strong style="color: #d97706;">EN REVISIÓN</strong></td></tr>
          </table>

          <p style="font-size: 0.85rem; color: #64748b;">El equipo de supervisión y directivo de la SED Caldas revisará la documentación y emitirá el dictamen oficial correspondiente.</p>
        </div>
        <div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">
          Gobernación de Caldas – Secretaría de Educación Departamental
        </div>
      </div>
    `;

    GmailApp.sendEmail(datos.correo, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  },

  enviarSolicitudCorreccion: function(envio, observados) {
    const asunto = `Requerimiento de Corrección – Plan de contingencia – ${envio.nombre_establecimiento}`;
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #be123c; color: #ffffff; padding: 1.5rem; text-align: center;">
          <h2 style="margin: 0;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Observaciones Técnicas al Plan de Contingencia</p>
        </div>
        <div style="padding: 1.5rem; background: #ffffff;">
          <p>Apreciado(a) Rector(a):</p>
          <p>Tras la evaluación técnica realizada al Plan de Contingencia radicado (<strong>${envio.id_envio}</strong> - v${envio.version}), se ha determinado que el documento <strong>REQUIERE CORRECCIÓN</strong>.</p>
          
          <div style="background: #fff1f2; border-left: 4px solid #be123c; padding: 1rem; margin: 1rem 0;">
            <h4 style="margin: 0 0 0.5rem; color: #9f1239;">Documentos y Criterios a Subsanar:</h4>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.9rem;">
              ${observados.map(o => `<li>${o}</li>`).join('')}
            </ul>
          </div>

          <p><strong>Instrucciones para nueva versión:</strong></p>
          <ol style="font-size: 0.9rem; padding-left: 1.2rem; color: #334155;">
            <li>Ingrese al portal institucional de planes de contingencia.</li>
            <li>Consulte su radicado con el código DANE <strong>${envio.codigo_establecimiento}</strong>.</li>
            <li>Haga clic en <em>"Subsanar / Radicar Nueva Versión"</em>.</li>
            <li>Reemplace únicamente los documentos observados y confirme el envío.</li>
          </ol>
        </div>
        <div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">
          Gobernación de Caldas – Secretaría de Educación Departamental
        </div>
      </div>
    `;

    GmailApp.sendEmail(envio.correo_usuario, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  },

  enviarNotificacionAprobacion: function(envio) {
    const asunto = `Aprobación de Plan de Contingencia – ${envio.nombre_establecimiento}`;
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #15803d; color: #ffffff; padding: 1.5rem; text-align: center;">
          <h2 style="margin: 0;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h2>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Constancia de Aprobación de Plan de Contingencia</p>
        </div>
        <div style="padding: 1.5rem; background: #ffffff;">
          <p>Apreciado(a) Rector(a):</p>
          <p>Nos complace informarle que el <strong>Plan de Contingencia</strong> radicado bajo el número <strong>${envio.id_envio}</strong> (Versión ${envio.version}) ha sido <strong>APROBADO SATISFACTORIAMENTE</strong> por la Secretaría de Educación de Caldas.</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #15803d; padding: 1rem; margin: 1rem 0;">
            <p style="margin: 0; color: #166534; font-weight: bold;">El plan cumple con todos los criterios de la Circular Nº 122.</p>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 1rem; text-align: center; font-size: 0.8rem; color: #64748b;">
          Gobernación de Caldas – Secretaría de Educación Departamental
        </div>
      </div>
    `;

    GmailApp.sendEmail(envio.correo_usuario, asunto, '', {
      htmlBody: cuerpoHtml,
      name: CONFIG.EMAIL_FROM_NAME
    });
  }
};
