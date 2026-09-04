/**
 * GESTIÓN DE SESIÓN, AUTORIZACIÓN Y CONTROL DE ACCESOS POR PERFIL
 */

class SedAuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.pendingTargetRole = null;
  }

  loadCurrentUser() {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch (e) {}
    }
    // Default: Rector inicial
    return SED_USUARIOS_INICIALES[0];
  }

  setCurrentUser(user, isAuth = false) {
    this.currentUser = {
      ...user,
      authenticated: isAuth
    };
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.applyRolePermissions();
    this.updateUserBadge();

    // Log auditoría
    db.logAudit({
      usuario: user.correo || user.nombre,
      rol: user.rol,
      accion: isAuth ? 'LOGIN_AUTORIZADO' : 'CAMBIO_PERFIL',
      municipio: user.municipio || 'TODOS',
      codigo_establecimiento: user.codigo_establecimiento || '',
      resultado: 'EXITO',
      observacion: `Sesión activa con perfil ${user.rol} (${user.nombre || user.correo})`
    });
  }

  getUser() {
    return this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.rol : APP_CONFIG.ROLES.CONSULTA;
  }

  isAuthenticated() {
    return !!(this.currentUser && this.currentUser.authenticated);
  }

  // --- SOLICITUD DE CAMBIO DE ROL CON CONTROL DE ACCESO ---
  requestRoleChange(targetRole) {
    // Roles libres / públicos
    if (targetRole === 'RECTOR' || targetRole === 'CONSULTA') {
      const defaultUser = SED_USUARIOS_INICIALES.find(u => u.rol === targetRole) || {
        id_usuario: 'USR-PUB',
        nombre: targetRole === 'RECTOR' ? 'Directivo Docente' : 'Ciudadano / Consulta',
        cargo: targetRole === 'RECTOR' ? 'Rector' : 'Consulta Pública',
        correo: targetRole === 'RECTOR' ? 'rectoria@sedcaldas.edu.co' : 'consulta@sedcaldas.edu.co',
        municipio: 'TODOS',
        codigo_establecimiento: '',
        rol: targetRole
      };
      this.setCurrentUser(defaultUser, false);
      if (typeof app !== 'undefined') {
        app.showToast(`Perfil cambiado a: ${targetRole}`, 'info');
      }
      return;
    }

    // Si ya está autenticado con ese rol o como Administrador
    if (this.isAuthenticated() && (this.getRole() === targetRole || this.getRole() === 'ADMINISTRADOR')) {
      if (typeof app !== 'undefined') {
        app.showToast(`Perfil activo: ${this.currentUser.nombre} (${this.getRole()})`, 'info');
      }
      return;
    }

    // Abrir modal de autenticación para perfiles protegidos
    this.openLoginModal(targetRole);
  }

  openLoginModal(targetRole) {
    this.pendingTargetRole = targetRole;

    const modal = document.getElementById('modalAuthLogin');
    const roleTitle = document.getElementById('authModalRoleTitle');
    const emailInput = document.getElementById('authInputEmail');
    const errorBox = document.getElementById('authModalError');

    if (roleTitle) {
      roleTitle.textContent = targetRole === 'ADMINISTRADOR' ? 'Administrador del Sistema' : 'Coordinador Departamental SED';
    }
    if (emailInput) {
      emailInput.value = '';
    }
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.textContent = '';
    }

    if (modal) {
      modal.classList.add('active');
      setTimeout(() => emailInput?.focus(), 150);
    }
  }

  closeLoginModal() {
    const modal = document.getElementById('modalAuthLogin');
    if (modal) {
      modal.classList.remove('active');
    }
    this.pendingTargetRole = null;
    this.applyRolePermissions(); // Revertir selector al rol actual
  }

  async submitLogin() {
    const emailInput = document.getElementById('authInputEmail');
    const errorBox = document.getElementById('authModalError');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const targetRole = this.pendingTargetRole || 'COORDINADOR';

    if (!email) {
      if (errorBox) {
        errorBox.textContent = 'Por favor ingrese su correo electrónico institucional.';
        errorBox.style.display = 'block';
      }
      return;
    }

    try {
      if (typeof app !== 'undefined') app.showLoading(true, 'Verificando credenciales autorizadas...');
      const response = await api.verificarAcceso(email, targetRole);
      if (typeof app !== 'undefined') app.showLoading(false);

      const result = response.data || response;

      if (result.autorizado && result.usuario) {
        // Acceso concedido
        this.setCurrentUser(result.usuario, true);
        this.closeLoginModal();
        if (typeof app !== 'undefined') {
          app.showToast(`✓ Acceso concedido: ${result.usuario.nombre} (${result.usuario.rol})`, 'success');
        }
      } else {
        // Acceso denegado
        if (errorBox) {
          errorBox.textContent = result.mensaje || `El correo ${email} no está autorizado para el perfil ${targetRole}.`;
          errorBox.style.display = 'block';
        }
        db.logAudit({
          usuario: email,
          rol: targetRole,
          accion: 'ACCESO_DENEGADO',
          resultado: 'FALLO',
          observacion: `Intento de acceso no autorizado al perfil ${targetRole}`
        });
      }
    } catch (err) {
      if (typeof app !== 'undefined') app.showLoading(false);
      if (errorBox) {
        errorBox.textContent = 'Error al validar credenciales: ' + err.message;
        errorBox.style.display = 'block';
      }
    }
  }

  logout() {
    const prevUser = this.currentUser ? this.currentUser.nombre : 'Usuario';
    const defaultRector = SED_USUARIOS_INICIALES[0];
    this.setCurrentUser(defaultRector, false);

    if (typeof app !== 'undefined') {
      app.showToast(`Sesión de ${prevUser} cerrada. Perfil restablecido.`, 'info');
    }
  }

  updateUserBadge() {
    const badgeEl = document.getElementById('headerUserBadgeContainer');
    if (!badgeEl) return;

    if (this.isAuthenticated()) {
      badgeEl.innerHTML = `
        <span class="auth-user-chip">
          <span class="auth-user-dot"></span>
          <span class="auth-user-name">${this.currentUser.nombre}</span>
          <span class="auth-user-role-tag">${this.currentUser.rol}</span>
          <button type="button" class="auth-logout-btn" onclick="auth.logout()" title="Cerrar sesión de este perfil">✕ Salir</button>
        </span>
      `;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.innerHTML = '';
      badgeEl.style.display = 'none';
    }
  }

  applyRolePermissions() {
    const role = this.getRole();

    // Actualizar selector de rol en header
    const roleSelect = document.getElementById('headerRoleSelect');
    if (roleSelect) {
      roleSelect.value = role;
    }

    // Pestañas visibles según rol
    const tabFormulario = document.getElementById('tab-nav-formulario');
    const tabConsultas = document.getElementById('tab-nav-consultas');
    const tabEvaluacion = document.getElementById('tab-nav-evaluacion');
    const tabDashboard = document.getElementById('tab-nav-dashboard');
    const tabAdmin = document.getElementById('tab-nav-admin');

    // Reglas estrictas de visibilidad
    if (tabFormulario) tabFormulario.style.display = (role === 'RECTOR' || role === 'ADMINISTRADOR') ? 'inline-flex' : 'none';
    if (tabConsultas) tabConsultas.style.display = 'inline-flex';
    if (tabEvaluacion) tabEvaluacion.style.display = (role === 'COORDINADOR' || role === 'ADMINISTRADOR') ? 'inline-flex' : 'none';
    if (tabDashboard) tabDashboard.style.display = (role === 'COORDINADOR' || role === 'ADMINISTRADOR' || role === 'CONSULTA') ? 'inline-flex' : 'none';
    
    // Solo ADMINISTRADOR puede ver y acceder a la pestaña de administración
    if (tabAdmin) tabAdmin.style.display = (role === 'ADMINISTRADOR') ? 'inline-flex' : 'none';

    // Redirigir a pestaña permitida si la actual está oculta para este rol
    if (typeof app !== 'undefined' && app.activeTab) {
      const activeBtn = document.getElementById(`tab-nav-${app.activeTab}`);
      if (activeBtn && activeBtn.style.display === 'none') {
        if (role === 'COORDINADOR') app.switchTab('evaluacion');
        else if (role === 'CONSULTA') app.switchTab('consultas');
        else if (role === 'RECTOR') app.switchTab('formulario');
        else if (role === 'ADMINISTRADOR') app.switchTab('formulario');
      }
    }

    this.updateUserBadge();

    // Disparar evento de cambio de rol
    window.dispatchEvent(new CustomEvent('sedRoleChanged', { detail: { role, user: this.currentUser } }));
  }
}

const auth = new SedAuthManager();
