/**
 * GESTIÓN DE SESIÓN Y AUTORIZACIÓN DE ROLES
 */

class SedAuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
  }

  loadCurrentUser() {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    // Default: Rector
    return SED_USUARIOS_INICIALES[0];
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.applyRolePermissions();
    
    // Log auditoría
    db.logAudit({
      usuario: user.correo,
      rol: user.rol,
      accion: 'LOGIN',
      municipio: user.municipio,
      codigo_establecimiento: user.codigo_establecimiento,
      resultado: 'EXITO',
      observacion: `Inicio de sesión con perfil ${user.rol}`
    });
  }

  getUser() {
    return this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.rol : APP_CONFIG.ROLES.CONSULTA;
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

    if (tabFormulario) tabFormulario.style.display = (role === 'RECTOR' || role === 'ADMINISTRADOR') ? 'inline-flex' : 'none';
    if (tabConsultas) tabConsultas.style.display = 'inline-flex';
    if (tabEvaluacion) tabEvaluacion.style.display = (role === 'COORDINADOR' || role === 'ADMINISTRADOR') ? 'inline-flex' : 'none';
    if (tabDashboard) tabDashboard.style.display = (role === 'COORDINADOR' || role === 'ADMINISTRADOR' || role === 'CONSULTA') ? 'inline-flex' : 'none';
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

    // Disparar evento de cambio de rol
    window.dispatchEvent(new CustomEvent('sedRoleChanged', { detail: { role, user: this.currentUser } }));
  }
}

const auth = new SedAuthManager();
