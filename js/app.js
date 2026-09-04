/**
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (SPA)
 * Orquestador de módulos, enrutamiento por pestañas y notificaciones
 */

class SedApp {
  constructor() {
    this.activeTab = 'formulario';
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Inicializar Controladores
      formController = new SedFormularioController();
      consultasController = new SedConsultasController();
      evaluacionController = new SedEvaluacionController();
      dashboardController = new SedDashboardController();
      adminController = new SedAdminController();

      // 2. Eventos de Pestañas
      document.querySelectorAll('.nav-item-btn, .nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const target = tab.dataset.tab;
          this.switchTab(target);
        });
      });

      // 3. Evento Selector de Roles con Control de Accesos
      const roleSelect = document.getElementById('headerRoleSelect');
      if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
          const newRole = e.target.value;
          auth.requestRoleChange(newRole);
        });
      }

      // 4. Inicializar permisos y modo
      auth.applyRolePermissions();
      this.updateEnvIndicator();

      // 5. Cargar primera vista
      this.switchTab('formulario');
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Actualizar tabs visuales
    document.querySelectorAll('.nav-item-btn, .nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });

    // Actualizar paneles
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });

    // Cargas perezosas según pestaña
    if (tabId === 'consultas') {
      consultasController.ejecutarConsulta();
    } else if (tabId === 'evaluacion') {
      evaluacionController.cargarBandeja();
    } else if (tabId === 'dashboard') {
      dashboardController.actualizarDashboard();
    } else if (tabId === 'admin') {
      adminController.switchSubtab('criterios');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateEnvIndicator() {
    const isGas = api.isUsingGasBackend();
    const badge = document.getElementById('headerEnvBadge');
    if (badge) {
      if (isGas) {
        badge.className = 'env-badge prod';
        badge.textContent = 'PROD (Google Apps Script)';
      } else {
        badge.className = 'env-badge demo';
        badge.textContent = 'MODO LOCAL / DEMO';
      }
    }
  }

  // --- NOTIFICACIONES TOAST ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.1rem; font-weight: bold;">${icon}</span>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- LOADING OVERLAY ---
  showLoading(show, message = 'Cargando...') {
    const overlay = document.getElementById('loadingOverlay');
    const msgEl = document.getElementById('loadingMessage');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
      if (msgEl) msgEl.textContent = message;
    }
  }
}

const app = new SedApp();
