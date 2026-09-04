/**
 * MÓDULO DE ADMINISTRACIÓN, PARAMETRIZACIÓN Y AUDITORÍA
 */

class SedAdminController {
  constructor() {
    this.init();
  }

  init() {
    // Pestañas internas de administración
    document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subtab = btn.dataset.subtab;
        this.switchSubtab(subtab);
      });
    });

    // Guardar URL de Backend Google Apps Script
    const btnSaveGasUrl = document.getElementById('btnSaveGasUrl');
    if (btnSaveGasUrl) {
      btnSaveGasUrl.addEventListener('click', () => {
        const url = document.getElementById('inputGasWebAppUrl')?.value || '';
        api.setEndpoint(url);
        app.updateEnvIndicator();
        app.showToast(url ? 'URL de Google Apps Script vinculada correctamente.' : 'Modo autónomo / simulación activado.', 'success');
      });
    }

    // Modal nuevo criterio
    const btnNewCrit = document.getElementById('btnOpenNewCriterioModal');
    if (btnNewCrit) {
      btnNewCrit.addEventListener('click', () => this.abrirModalCriterio());
    }

    const btnSaveCrit = document.getElementById('btnSaveCriterio');
    if (btnSaveCrit) {
      btnSaveCrit.addEventListener('click', () => this.guardarCriterio());
    }
  }

  switchSubtab(subtabId) {
    document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-subtab-pane').forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    const btn = document.querySelector(`.admin-subtab-btn[data-subtab="${subtabId}"]`);
    const pane = document.getElementById(`admin-pane-${subtabId}`);

    if (btn) btn.classList.add('active');
    if (pane) {
      pane.classList.add('active');
      pane.style.display = 'block';
    }

    if (subtabId === 'criterios') this.cargarCriterios();
    if (subtabId === 'auditoria') this.cargarAuditoria();
    if (subtabId === 'coordinadores') this.cargarAsignaciones();
    if (subtabId === 'config') this.cargarConfig();
  }

  // --- GESTIÓN DE CRITERIOS ---
  cargarCriterios() {
    const tbody = document.getElementById('tablaAdminCriteriosBody');
    if (!tbody) return;

    const criterios = db.getCriterios();
    tbody.innerHTML = criterios.map(c => `
      <tr>
        <td><code>${c.id_criterio}</code></td>
        <td><strong>${c.tipo_documento}</strong></td>
        <td><strong>${c.criterio}</strong></td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${c.descripcion}</td>
        <td>
          <span class="badge ${c.obligatorio === 'SI' ? 'badge-draft' : 'badge-draft'}">
            ${c.obligatorio}
          </span>
        </td>
        <td>
          <span class="badge ${c.activo === 'SI' ? 'badge-approved' : 'badge-correction'}">
            ${c.activo === 'SI' ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="adminController.eliminarCriterio('${c.id_criterio}')">
            ✕
          </button>
        </td>
      </tr>
    `).join('');
  }

  abrirModalCriterio() {
    const selectDoc = document.getElementById('critFormTipoDoc');
    if (selectDoc) {
      selectDoc.innerHTML = APP_CONFIG.DOCUMENTOS_REQUERIDOS.map(d => `
        <option value="${d.tipo}">${d.nombre} (${d.tipo})</option>
      `).join('');
    }
    document.getElementById('critFormNombre').value = '';
    document.getElementById('critFormDesc').value = '';
    document.getElementById('critFormObligatorio').value = 'SI';
    document.getElementById('critFormActivo').value = 'SI';

    document.getElementById('modalAdminCriterio').classList.add('active');
  }

  closeModalCriterio() {
    document.getElementById('modalAdminCriterio').classList.remove('active');
  }

  guardarCriterio() {
    const tipo = document.getElementById('critFormTipoDoc').value;
    const nombre = document.getElementById('critFormNombre').value.trim();
    const desc = document.getElementById('critFormDesc').value.trim();
    const obli = document.getElementById('critFormObligatorio').value;
    const act = document.getElementById('critFormActivo').value;

    if (!nombre || !desc) {
      app.showToast('Por favor ingrese el título y la descripción del criterio.', 'warning');
      return;
    }

    db.saveCriterio({
      tipo_documento: tipo,
      criterio: nombre,
      descripcion: desc,
      obligatorio: obli,
      activo: act
    });

    this.closeModalCriterio();
    this.cargarCriterios();
    app.showToast('Criterio de evaluación guardado exitosamente.', 'success');
  }

  eliminarCriterio(id_criterio) {
    if (confirm(`¿Está seguro de eliminar el criterio ${id_criterio}?`)) {
      db.deleteCriterio(id_criterio);
      this.cargarCriterios();
      app.showToast('Criterio eliminado.', 'info');
    }
  }

  // --- GESTIÓN DE ASIGNACIONES ---
  cargarAsignaciones() {
    const tbody = document.getElementById('tablaAdminAsignacionesBody');
    if (!tbody) return;

    const asg = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ASIGNACIONES) || '[]');
    tbody.innerHTML = asg.map(a => `
      <tr>
        <td><code>${a.id_asignacion}</code></td>
        <td><strong>${a.municipio}</strong></td>
        <td>${a.nombre_coordinador}</td>
        <td><span class="badge badge-approved">Asignado</span></td>
      </tr>
    `).join('');
  }

  // --- GESTIÓN DE AUDITORÍA ---
  async cargarAuditoria() {
    const tbody = document.getElementById('tablaAdminAuditoriaBody');
    if (!tbody) return;

    const res = await api.obtenerAuditoria();
    const logs = res.data || [];

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">No hay registros de auditoría aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td><span style="font-size: 0.78rem; font-family: monospace;">${l.fecha_hora}</span></td>
        <td><strong>${l.usuario}</strong></td>
        <td><span class="badge badge-sent">${l.rol}</span></td>
        <td><code>${l.accion}</code></td>
        <td>${l.municipio || '-'}</td>
        <td><span class="badge ${l.resultado === 'APROBADO' || l.resultado === 'EXITO' ? 'badge-approved' : l.resultado === 'REQUIERE_CORRECCION' ? 'badge-correction' : 'badge-draft'}">${l.resultado}</span></td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${l.observacion}</td>
      </tr>
    `).join('');
  }

  cargarConfig() {
    const inputUrl = document.getElementById('inputGasWebAppUrl');
    if (inputUrl) {
      inputUrl.value = api.endpointUrl || APP_CONFIG.GAS_ENDPOINT_URL || '';
    }
  }
}

let adminController;
