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

    // Modal nuevo usuario / acceso
    const btnNewUser = document.getElementById('btnOpenNewUsuarioModal');
    if (btnNewUser) {
      btnNewUser.addEventListener('click', () => this.abrirModalUsuario());
    }

    const btnSaveUser = document.getElementById('btnSaveUsuario');
    if (btnSaveUser) {
      btnSaveUser.addEventListener('click', () => this.guardarUsuario());
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

    if (subtabId === 'usuarios') this.cargarUsuarios();
    if (subtabId === 'criterios') this.cargarCriterios();
    if (subtabId === 'auditoria') this.cargarAuditoria();
    if (subtabId === 'coordinadores') this.cargarAsignaciones();
    if (subtabId === 'config') this.cargarConfig();
  }

  // --- GESTIÓN Y CONTROL DE ACCESOS Y USUARIOS ---
  async cargarUsuarios() {
    const tbody = document.getElementById('tablaAdminUsuariosBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Cargando usuarios autorizados...</td></tr>`;

    try {
      const res = await api.obtenerUsuarios();
      const users = res.data || [];

      if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No hay usuarios registrados.</td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(u => `
        <tr>
          <td><code>${u.id_usuario}</code></td>
          <td>
            <strong>${u.nombre}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${u.cargo || 'Funcionario'}</div>
          </td>
          <td>
            <a href="mailto:${u.correo}" style="color: var(--brand-primary); font-weight: 600; text-decoration: none;">
              ${u.correo}
            </a>
          </td>
          <td>
            <span class="badge ${u.rol === 'ADMINISTRADOR' ? 'badge-correction' : u.rol === 'COORDINADOR' ? 'badge-review' : 'badge-draft'}" style="font-weight: 700;">
              ${u.rol === 'ADMINISTRADOR' ? '🛡️ ADMINISTRADOR' : u.rol === 'COORDINADOR' ? '✍️ COORDINADOR' : u.rol === 'RECTOR' ? '📝 RECTOR' : '👁️ CONSULTA'}
            </span>
          </td>
          <td>
            <span style="font-size: 0.85rem;">${u.municipio || 'TODOS'}</span>
          </td>
          <td>
            <span class="badge ${u.estado === 'ACTIVO' ? 'badge-approved' : 'badge-draft'}">
              ${u.estado === 'ACTIVO' ? '✓ Activo' : '✕ Inactivo'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-outline-primary btn-sm" title="Editar datos" onclick="adminController.abrirModalUsuario('${u.id_usuario}')">
              ✏️
            </button>
            <button type="button" class="btn btn-sm ${u.estado === 'ACTIVO' ? 'btn-outline-warning' : 'btn-outline-success'}" title="${u.estado === 'ACTIVO' ? 'Desactivar acceso' : 'Activar acceso'}" onclick="adminController.toggleEstadoUsuario('${u.id_usuario}', '${u.estado}')">
              ${u.estado === 'ACTIVO' ? '🚫' : '✓'}
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm" title="Eliminar usuario" onclick="adminController.eliminarUsuario('${u.id_usuario}', '${u.nombre}')">
              🗑️
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--brand-danger); padding: 1.5rem;">Error al cargar usuarios: ${err.message}</td></tr>`;
    }
  }

  async abrirModalUsuario(id_usuario = null) {
    const titleEl = document.getElementById('userModalTitle');
    const inputId = document.getElementById('userFormId');
    const inputNombre = document.getElementById('userFormNombre');
    const inputEmail = document.getElementById('userFormEmail');
    const inputCargo = document.getElementById('userFormCargo');
    const selectRol = document.getElementById('userFormRol');
    const selectMuni = document.getElementById('userFormMunicipio');
    const inputTel = document.getElementById('userFormTel');
    const selectEstado = document.getElementById('userFormEstado');

    // Poblar dropdown de municipios
    if (selectMuni && selectMuni.options.length <= 1) {
      selectMuni.innerHTML = '<option value="TODOS">TODOS (Nivel Departamental)</option>';
      SED_CATALOGO_MUNICIPIOS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        selectMuni.appendChild(opt);
      });
    }

    if (id_usuario) {
      if (titleEl) titleEl.textContent = '✏️ Editar Usuario y Permisos de Acceso';
      const res = await api.obtenerUsuarios();
      const user = (res.data || []).find(u => u.id_usuario === id_usuario);
      if (user) {
        if (inputId) inputId.value = user.id_usuario;
        if (inputNombre) inputNombre.value = user.nombre || '';
        if (inputEmail) inputEmail.value = user.correo || '';
        if (inputCargo) inputCargo.value = user.cargo || '';
        if (selectRol) selectRol.value = user.rol || 'COORDINADOR';
        if (selectMuni) selectMuni.value = user.municipio || 'TODOS';
        if (inputTel) inputTel.value = user.telefono || '';
        if (selectEstado) selectEstado.value = user.estado || 'ACTIVO';
      }
    } else {
      if (titleEl) titleEl.textContent = '➕ Registrar Nuevo Usuario Autorizado';
      if (inputId) inputId.value = '';
      if (inputNombre) inputNombre.value = '';
      if (inputEmail) inputEmail.value = '';
      if (inputCargo) inputCargo.value = '';
      if (selectRol) selectRol.value = 'COORDINADOR';
      if (selectMuni) selectMuni.value = 'TODOS';
      if (inputTel) inputTel.value = '';
      if (selectEstado) selectEstado.value = 'ACTIVO';
    }

    const modal = document.getElementById('modalAdminUsuario');
    if (modal) modal.classList.add('active');
  }

  closeModalUsuario() {
    const modal = document.getElementById('modalAdminUsuario');
    if (modal) modal.classList.remove('active');
  }

  async guardarUsuario() {
    const id_usuario = document.getElementById('userFormId')?.value || '';
    const nombre = document.getElementById('userFormNombre')?.value.trim();
    const correo = document.getElementById('userFormEmail')?.value.trim().toLowerCase();
    const cargo = document.getElementById('userFormCargo')?.value.trim();
    const rol = document.getElementById('userFormRol')?.value || 'COORDINADOR';
    const municipio = document.getElementById('userFormMunicipio')?.value || 'TODOS';
    const telefono = document.getElementById('userFormTel')?.value.trim();
    const estado = document.getElementById('userFormEstado')?.value || 'ACTIVO';

    if (!nombre || !correo) {
      app.showToast('Por favor ingrese el nombre completo y el correo electrónico.', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      app.showToast('Por favor ingrese un formato de correo electrónico válido.', 'warning');
      return;
    }

    const userData = {
      id_usuario: id_usuario || null,
      nombre,
      correo,
      cargo: cargo || (rol === 'ADMINISTRADOR' ? 'Administrador SED' : 'Coordinador SED'),
      rol,
      municipio,
      codigo_establecimiento: '',
      telefono: telefono || '',
      estado
    };

    try {
      app.showLoading(true, 'Guardando usuario y actualizando permisos...');
      await api.guardarUsuario(userData);
      app.showLoading(false);

      this.closeModalUsuario();
      this.cargarUsuarios();
      app.showToast(`Usuario ${nombre} guardado exitosamente con rol ${rol}.`, 'success');
    } catch (err) {
      app.showLoading(false);
      app.showToast('Error al guardar usuario: ' + err.message, 'error');
    }
  }

  async eliminarUsuario(id_usuario, nombre) {
    if (confirm(`¿Está seguro de revocar el acceso y eliminar al usuario "${nombre}" (${id_usuario})?`)) {
      try {
        app.showLoading(true, 'Eliminando usuario...');
        await api.eliminarUsuario(id_usuario);
        app.showLoading(false);

        this.cargarUsuarios();
        app.showToast(`Usuario ${nombre} eliminado.`, 'info');
      } catch (err) {
        app.showLoading(false);
        app.showToast('Error al eliminar usuario: ' + err.message, 'error');
      }
    }
  }

  async toggleEstadoUsuario(id_usuario, estadoActual) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      app.showLoading(true, 'Actualizando estado de acceso...');
      await api.cambiarEstadoUsuario(id_usuario, nuevoEstado);
      app.showLoading(false);

      this.cargarUsuarios();
      app.showToast(`Estado de usuario cambiado a ${nuevoEstado}.`, 'info');
    } catch (err) {
      app.showLoading(false);
      app.showToast('Error al cambiar estado: ' + err.message, 'error');
    }
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
