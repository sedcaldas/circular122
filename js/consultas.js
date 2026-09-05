/**
 * MÓDULO DE CONSULTA, TRAZABILIDAD Y SEGUIMIENTO DE ENVÍOS
 */

class SedConsultasController {
  constructor() {
    this.currentList = [];
    this.init();
  }

  init() {
    const inputSearch = document.getElementById('inputConsultaSearch');
    const selectMuni = document.getElementById('selectConsultaMunicipio');
    const selectEstado = document.getElementById('selectConsultaEstado');
    const btnSearch = document.getElementById('btnConsultaBuscar');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => this.ejecutarConsulta());
    }
    if (inputSearch) {
      inputSearch.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.ejecutarConsulta();
      });
    }
    if (selectMuni) {
      selectMuni.addEventListener('change', () => this.ejecutarConsulta());
    }
    if (selectEstado) {
      selectEstado.addEventListener('change', () => this.ejecutarConsulta());
    }

    this.populateFiltros();
  }

  populateFiltros() {
    const selectMuni = document.getElementById('selectConsultaMunicipio');
    if (!selectMuni) return;

    selectMuni.innerHTML = '<option value="TODOS">-- Todos los Municipios --</option>';
    SED_CATALOGO_MUNICIPIOS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      selectMuni.appendChild(opt);
    });
  }

  async ejecutarConsulta() {
    const role = typeof auth !== 'undefined' ? auth.getRole() : 'RECTOR';
    if (role !== 'COORDINADOR' && role !== 'ADMINISTRADOR') {
      return;
    }

    const query = document.getElementById('inputConsultaSearch')?.value.trim() || '';
    const municipio = document.getElementById('selectConsultaMunicipio')?.value || 'TODOS';
    const estado = document.getElementById('selectConsultaEstado')?.value || 'TODOS';

    try {
      const response = await api.obtenerEnvios({ query, municipio, estado });
      if (response.success) {
        this.currentList = response.data;
        this.renderResultados();
      }
    } catch (err) {
      app.showToast('Error al consultar registros: ' + err.message, 'error');
    }
  }

  renderResultados() {
    const tbody = document.getElementById('tablaConsultasBody');
    const countBadge = document.getElementById('consultaResultCount');
    if (!tbody) return;

    if (countBadge) {
      countBadge.textContent = `${this.currentList.length} registro(s) encontrado(s)`;
    }

    if (this.currentList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No se encontraron envíos con los criterios de búsqueda especificados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.currentList.map(item => {
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
          <td>
            <div style="font-size: 0.85rem;">${item.fecha_envio}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.hora_envio}</div>
          </td>
          <td><span class="badge ${estadoConf.badgeClass}">${estadoConf.label}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="consultasController.verDetalleEnvio('${item.id_envio}')">
              🔍 Ver Detalle
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async verDetalleEnvio(id_envio) {
    const envio = this.currentList.find(e => e.id_envio === id_envio) || db.getEnvioById(id_envio);
    if (!envio) return;

    const docs = await api.obtenerDocumentos(id_envio);
    const docsList = docs.data || [];

    const estadoConf = APP_CONFIG.ESTADOS[envio.estado] || { label: envio.estado, badgeClass: 'badge-draft' };

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: var(--brand-primary);">${envio.nombre_establecimiento}</h3>
          <span style="font-size: 0.88rem; color: var(--text-muted);">Radicado: <strong>${envio.id_envio}</strong> | DANE: <code>${envio.codigo_establecimiento}</code> | ${envio.municipio}</span>
        </div>
        <span class="badge ${estadoConf.badgeClass}" style="font-size: 0.9rem; padding: 0.4rem 0.85rem;">${estadoConf.label}</span>
      </div>

      <!-- Timeline del Proceso -->
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-title">Radicación Inicial (v${envio.version})</span>
              <span class="timeline-date">${envio.fecha_envio} ${envio.hora_envio}</span>
            </div>
            <p style="font-size: 0.85rem;">Responsable: <strong>${envio.nombre_responsable}</strong> (${envio.cargo_responsable}) - ${envio.correo_usuario}</p>
          </div>
        </div>

        <div class="timeline-item ${envio.estado === 'APROBADO' ? 'approved' : envio.estado === 'REQUIERE_CORRECCION' ? 'correction' : ''}">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-title">Dictamen de la Secretaría de Educación</span>
              <span class="timeline-date">${envio.fecha_ultima_actualizacion || 'En proceso'}</span>
            </div>
            <p style="font-size: 0.88rem; margin-top: 0.3rem;">
              <strong>Observaciones generales:</strong> ${envio.observaciones_generales || 'En proceso de evaluación técnica por el equipo directivo.'}
            </p>
          </div>
        </div>
      </div>

      <!-- Detalle de Sedes Afectadas -->
      <h4 style="color: var(--brand-primary); margin: 1.25rem 0 0.5rem;">Sedes Afectadas y Estrategias</h4>
      <div class="table-responsive" style="margin-bottom: 1.25rem;">
        <table class="table-sed">
          <thead>
            <tr>
              <th>Sede</th>
              <th>Nivel de Daño</th>
              <th>Modalidad Propuesta</th>
            </tr>
          </thead>
          <tbody>
            ${(envio.sedes_afectadas || []).map(s => `
              <tr>
                <td><strong>${s.nombre}</strong></td>
                <td><span class="badge ${s.nivel === 'Severa' ? 'badge-correction' : s.nivel === 'Moderada' ? 'badge-review' : 'badge-draft'}">${s.nivel}</span></td>
                <td>${s.modalidad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Detalle de Documentos y Evaluaciones -->
      <h4 style="color: var(--brand-primary); margin: 1.25rem 0 0.5rem;">Documentos Adjuntos y Estado de Revisión</h4>
      <div class="table-responsive">
        <table class="table-sed">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Versión</th>
              <th>Estado</th>
              <th>Observación Técnica</th>
            </tr>
          </thead>
          <tbody>
            ${docsList.map(d => `
              <tr>
                <td>
                  <strong>${d.tipo_documento}</strong>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">
                    ${d.nombre_original}
                    ${d.url_drive && d.url_drive !== '#' ? ` · <a href="${d.url_drive}" target="_blank" rel="noopener noreferrer" style="color: var(--brand-primary); text-decoration: underline; font-weight: 600;">Abrir en Drive ↗</a>` : ''}
                  </div>
                </td>
                <td>v${d.version}</td>
                <td>
                  <span class="badge ${d.estado_revision === 'CUMPLE' ? 'badge-approved' : d.estado_revision === 'NO CUMPLE' ? 'badge-correction' : 'badge-draft'}">
                    ${d.estado_revision}
                  </span>
                </td>
                <td style="font-size: 0.82rem; color: ${d.estado_revision === 'NO CUMPLE' ? '#e11d48' : 'inherit'};">
                  ${d.observaciones || '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('modalConsultaDetailContent').innerHTML = html;

    // Botón de subsanar / nueva versión
    const btnSubsanar = document.getElementById('btnSubsanarEnvio');
    if (btnSubsanar) {
      if (envio.estado === 'REQUIERE_CORRECCION' && (auth.getRole() === 'RECTOR' || auth.getRole() === 'ADMINISTRADOR')) {
        btnSubsanar.style.display = 'inline-flex';
        btnSubsanar.onclick = () => {
          this.closeDetalleModal();
          formController.prepareNewVersion(envio, docsList);
        };
      } else {
        btnSubsanar.style.display = 'none';
      }
    }

    document.getElementById('modalConsultaDetail').classList.add('active');
  }

  closeDetalleModal() {
    document.getElementById('modalConsultaDetail').classList.remove('active');
  }
}

let consultasController;
