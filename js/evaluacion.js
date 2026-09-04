/**
 * MÓDULO DE REVISIÓN Y EVALUACIÓN DOCUMENTAL (COORDINADOR)
 * Evaluación por criterios parametrizados y cálculo automático de resultado global
 */

class SedEvaluacionController {
  constructor() {
    this.enviosPendientes = [];
    this.evaluandoEnvio = null;
    this.evaluandoDocs = [];
    this.criteriosMap = {};
    this.init();
  }

  init() {
    const selectMuni = document.getElementById('selectEvalMunicipio');
    const selectEstado = document.getElementById('selectEvalEstado');
    const btnRefrescar = document.getElementById('btnEvalRefrescar');

    if (selectMuni) selectMuni.addEventListener('change', () => this.cargarBandeja());
    if (selectEstado) selectEstado.addEventListener('change', () => this.cargarBandeja());
    if (btnRefrescar) btnRefrescar.addEventListener('click', () => this.cargarBandeja());

    this.populateFiltros();
  }

  populateFiltros() {
    const selectMuni = document.getElementById('selectEvalMunicipio');
    if (!selectMuni) return;

    selectMuni.innerHTML = '<option value="TODOS">-- Todos los Municipios --</option>';
    SED_CATALOGO_MUNICIPIOS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      selectMuni.appendChild(opt);
    });
  }

  async cargarBandeja() {
    const municipio = document.getElementById('selectEvalMunicipio')?.value || 'TODOS';
    const estado = document.getElementById('selectEvalEstado')?.value || 'TODOS';

    try {
      const response = await api.obtenerEnvios({ municipio, estado });
      if (response.success) {
        this.enviosPendientes = response.data;
        this.renderBandeja();
      }
    } catch (err) {
      app.showToast('Error al cargar bandeja de evaluación: ' + err.message, 'error');
    }
  }

  renderBandeja() {
    const tbody = document.getElementById('tablaEvaluacionBody');
    const badgeCount = document.getElementById('evalPendingCount');
    if (!tbody) return;

    if (badgeCount) {
      const count = this.enviosPendientes.filter(e => e.estado === 'EN_REVISION' || e.estado === 'ENVIADO').length;
      badgeCount.textContent = `${count} pendientes de revisión`;
    }

    if (this.enviosPendientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No hay solicitudes que coincidan con los filtros seleccionados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.enviosPendientes.map(item => {
      const estadoConf = APP_CONFIG.ESTADOS[item.estado] || { label: item.estado, badgeClass: 'badge-draft' };

      return `
        <tr>
          <td><strong style="color: var(--brand-primary);">${item.id_envio}</strong></td>
          <td><strong>${item.municipio}</strong></td>
          <td>
            <div style="font-weight: 600;">${item.nombre_establecimiento}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">DANE: <code>${item.codigo_establecimiento}</code></div>
          </td>
          <td><span class="badge badge-sent">v${item.version}</span></td>
          <td>${item.fecha_envio}</td>
          <td><span class="badge ${estadoConf.badgeClass}">${estadoConf.label}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-primary btn-sm" onclick="evaluacionController.abrirModalEvaluacion('${item.id_envio}')">
              ✍️ Evaluar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async abrirModalEvaluacion(id_envio) {
    this.evaluandoEnvio = this.enviosPendientes.find(e => e.id_envio === id_envio) || db.getEnvioById(id_envio);
    if (!this.evaluandoEnvio) return;

    const resDocs = await api.obtenerDocumentos(id_envio);
    this.evaluandoDocs = resDocs.data || [];

    const resCrit = await api.obtenerCriterios();
    const todosCriterios = resCrit.data || [];

    document.getElementById('evalModalTitle').textContent = `Evaluación: ${this.evaluandoEnvio.nombre_establecimiento}`;
    document.getElementById('evalModalSub').textContent = `Radicado: ${this.evaluandoEnvio.id_envio} | Versión ${this.evaluandoEnvio.version} | ${this.evaluandoEnvio.municipio}`;

    const container = document.getElementById('evalDocsListContainer');
    if (!container) return;

    container.innerHTML = this.evaluandoDocs.map((doc, idx) => {
      const docDef = APP_CONFIG.DOCUMENTOS_REQUERIDOS.find(d => d.tipo === doc.tipo_documento) || {
        nombre: doc.tipo_documento,
        icono: '📄',
        obligatorio: true
      };

      const criteriosDoc = todosCriterios.filter(c => c.tipo_documento === doc.tipo_documento && c.activo === 'SI');

      return `
        <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid ${docDef.obligatorio ? 'var(--brand-primary)' : 'var(--brand-gold)'};">
          <div class="card-header" style="background: var(--bg-subtle);">
            <div>
              <strong style="font-size: 1.05rem;">${docDef.icono} ${docDef.nombre}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.2rem;">
                <span>Archivo: <code>${doc.nombre_sistema}</code> (${doc.nombre_original})</span>
                ${doc.url_drive && doc.url_drive !== '#' ? `<a href="${doc.url_drive}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--brand-secondary-light); color: var(--brand-secondary-dark); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-decoration: none;">🔗 Abrir en Google Drive ↗</a>` : ''}
              </div>
            </div>
            <span class="badge ${docDef.obligatorio ? 'badge-draft' : 'badge-draft'}">
              ${docDef.obligatorio ? 'Obligatorio' : 'Opcional'}
            </span>
          </div>

          <div class="card-body" style="padding: 1.25rem;">
            <!-- Criterios aplicables -->
            <div style="margin-bottom: 1rem; background: #ffffff; border: 1px solid var(--border-light); padding: 0.85rem; border-radius: var(--radius-sm);">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
                Criterios de Evaluación Aplicables
              </div>
              <ul style="font-size: 0.85rem; padding-left: 1.2rem; color: var(--text-main);">
                ${criteriosDoc.length > 0 ? criteriosDoc.map(c => `
                  <li><strong>${c.criterio}:</strong> ${c.descripcion}</li>
                `).join('') : '<li>Verificación de consistencia institucional y pertinencia temática.</li>'}
              </ul>
            </div>

            <!-- Calificación del Documento -->
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap;">
              <label style="font-weight: 700; font-size: 0.9rem;">Dictamen:</label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; color: #166534; font-weight: 600;">
                <input type="radio" name="dictamen_${doc.id_documento}" value="CUMPLE" 
                       ${doc.estado_revision === 'CUMPLE' ? 'checked' : ''}
                       onchange="evaluacionController.updateDocScore('${doc.id_documento}', 'CUMPLE')">
                ✓ CUMPLE
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; color: #dc2626; font-weight: 600;">
                <input type="radio" name="dictamen_${doc.id_documento}" value="NO CUMPLE" 
                       ${doc.estado_revision === 'NO CUMPLE' ? 'checked' : ''}
                       onchange="evaluacionController.updateDocScore('${doc.id_documento}', 'NO CUMPLE')">
                ✕ NO CUMPLE
              </label>
            </div>

            <!-- Observaciones específicas -->
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem;">Observaciones / Instrucciones de corrección para este documento:</label>
              <input type="text" class="form-control" id="obs_${doc.id_documento}" 
                     placeholder="Ej: Especificar el cronograma detallado de entrega de guías pedagógicas..."
                     value="${doc.observaciones || ''}"
                     oninput="evaluacionController.updateDocObs('${doc.id_documento}', this.value)">
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('modalEvaluacion').classList.add('active');
  }

  updateDocScore(id_documento, score) {
    const doc = this.evaluandoDocs.find(d => d.id_documento === id_documento);
    if (doc) {
      doc.estado_revision = score;
    }
  }

  updateDocObs(id_documento, obs) {
    const doc = this.evaluandoDocs.find(d => d.id_documento === id_documento);
    if (doc) {
      doc.observaciones = obs;
    }
  }

  closeModalEvaluacion() {
    document.getElementById('modalEvaluacion').classList.remove('active');
  }

  async guardarEvaluacionCompleta() {
    if (!this.evaluandoEnvio) return;

    const unreviewed = this.evaluandoDocs.filter(d => !d.estado_revision || d.estado_revision === 'PENDIENTE');
    if (unreviewed.length > 0) {
      if (!confirm(`Hay ${unreviewed.length} documento(s) sin dictamen expreso. ¿Desea continuar calificándolos como pendientes?`)) {
        return;
      }
    }

    try {
      app.showLoading(true, 'Guardando evaluación y calculando resultado institucional...');

      // 1. Guardar cada documento
      for (const doc of this.evaluandoDocs) {
        await api.evaluarDocumento({
          id_documento: doc.id_documento,
          estado_revision: doc.estado_revision || 'NO CUMPLE',
          observaciones: doc.observaciones || '',
          usuario: auth.getUser().correo
        });
      }

      // 2. Finalizar evaluación global
      const obsGenerales = document.getElementById('evalObservacionesGenerales')?.value || '';
      const result = await api.finalizarEvaluacion({
        id_envio: this.evaluandoEnvio.id_envio,
        observaciones_generales: obsGenerales,
        usuario: auth.getUser().correo
      });

      app.showLoading(false);
      this.closeModalEvaluacion();

      app.showToast(`Evaluación guardada con éxito. Dictamen final: ${result.estadoCalculado}`, 'success');
      this.cargarBandeja();

      // Mostrar modal de confirmación de correo
      this.mostrarNotificacionCorreoEnviada(this.evaluandoEnvio, result.estadoCalculado, obsGenerales);
    } catch (err) {
      app.showLoading(false);
      app.showToast('Error al guardar la evaluación: ' + err.message, 'error');
    }
  }

  mostrarNotificacionCorreoEnviada(envio, estadoFinal, observaciones) {
    const emailSubject = estadoFinal === 'APROBADO' 
      ? `Aprobación de Plan de Contingencia – ${envio.nombre_establecimiento}`
      : `Requerimiento de Corrección – Plan de Contingencia – ${envio.nombre_establecimiento}`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="background: #0f4c81; color: #ffffff; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
          <h3 style="margin:0;">SECRETARÍA DE EDUCACIÓN DE CALDAS</h3>
          <p style="margin:0; font-size: 0.85rem;">Notificación Oficial - Circular Nº 122</p>
        </div>
        
        <p>Estimado(a) Rector(a) / Directivo docente:</p>
        <p>Se ha emitido el dictamen oficial para el <strong>Plan de Contingencia</strong> radicado bajo el número <strong>${envio.id_envio}</strong> (Versión ${envio.version}).</p>
        
        <div style="background: ${estadoFinal === 'APROBADO' ? '#f0fdf4' : '#fff1f2'}; border-left: 4px solid ${estadoFinal === 'APROBADO' ? '#15803d' : '#be123c'}; padding: 1rem; margin: 1rem 0;">
          <h4 style="margin:0; color: ${estadoFinal === 'APROBADO' ? '#15803d' : '#be123c'};">ESTADO: ${estadoFinal}</h4>
          <p style="margin-top: 0.5rem; font-size: 0.9rem;"><strong>Observaciones del Evaluador:</strong> ${observaciones || (estadoFinal === 'APROBADO' ? 'El plan cumple con todos los lineamientos establecidos.' : 'Se requiere subsanar las observaciones en los documentos indicados.')}</p>
        </div>

        <p style="font-size: 0.85rem; color: #64748b;">Para radicar una nueva versión o consultar el estado detallado, ingrese al portal institucional de planes de contingencia con el código DANE <strong>${envio.codigo_establecimiento}</strong>.</p>
      </div>
    `;

    document.getElementById('modalEmailPreviewSubject').textContent = emailSubject;
    document.getElementById('modalEmailPreviewTo').textContent = envio.correo_usuario;
    document.getElementById('modalEmailPreviewBody').innerHTML = emailBody;
    document.getElementById('modalEmailPreview').classList.add('active');
  }

  closeEmailPreviewModal() {
    document.getElementById('modalEmailPreview').classList.remove('active');
  }
}

let evaluacionController;
