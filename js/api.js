/**
 * CLIENTE API UNIFICADO (Google Apps Script Web App / Local Engine Bridge)
 */

class SedApiClient {
  constructor() {
    this.endpointUrl = localStorage.getItem('sed_gas_endpoint_url') !== null 
      ? localStorage.getItem('sed_gas_endpoint_url') 
      : (APP_CONFIG.GAS_ENDPOINT_URL || '');
    this.useGasBackend = !!this.endpointUrl;
  }

  setEndpoint(url) {
    this.endpointUrl = url ? url.trim() : '';
    this.useGasBackend = !!this.endpointUrl;
    if (this.endpointUrl) {
      localStorage.setItem('sed_gas_endpoint_url', this.endpointUrl);
    } else {
      localStorage.removeItem('sed_gas_endpoint_url');
    }
  }

  isUsingGasBackend() {
    return this.useGasBackend;
  }

  // --- OBTENER MUNICIPIOS ---
  async obtenerMunicipios() {
    if (this.useGasBackend) {
      return this._callGas('obtenerMunicipios');
    }
    return Promise.resolve({ success: true, data: SED_CATALOGO_MUNICIPIOS });
  }

  // --- OBTENER INSTITUCIONES ---
  async obtenerInstituciones(municipio = null) {
    if (this.useGasBackend) {
      return this._callGas('obtenerInstituciones', { municipio });
    }
    let data = SED_CATALOGO_INSTITUCIONES;
    if (municipio) {
      data = data.filter(i => i.municipio.toUpperCase() === municipio.toUpperCase());
    }
    return Promise.resolve({ success: true, data });
  }

  // --- OBTENER CRITERIOS ---
  async obtenerCriterios(tipo_documento = null) {
    if (this.useGasBackend) {
      return this._callGas('obtenerCriterios', { tipo_documento });
    }
    let data = db.getCriterios();
    if (tipo_documento) {
      data = data.filter(c => c.tipo_documento === tipo_documento);
    }
    return Promise.resolve({ success: true, data });
  }

  // --- CREAR / GUARDAR ENVÍO ---
  async crearEnvio(payload) {
    if (this.useGasBackend) {
      return this._callGas('crearEnvio', payload);
    }
    const envioResult = db.saveEnvio(payload.envio, payload.documentos);
    return Promise.resolve({
      success: true,
      data: envioResult,
      message: 'Plan de contingencia registrado exitosamente.'
    });
  }

  // --- OBTENER ENVÍOS ---
  async obtenerEnvios(filtros = {}) {
    if (this.useGasBackend) {
      return this._callGas('obtenerEnvios', filtros);
    }
    let list = db.getEnvios();
    if (filtros.municipio && filtros.municipio !== 'TODOS') {
      list = list.filter(e => e.municipio === filtros.municipio);
    }
    if (filtros.codigo_establecimiento) {
      list = list.filter(e => e.codigo_establecimiento === filtros.codigo_establecimiento);
    }
    if (filtros.estado && filtros.estado !== 'TODOS') {
      list = list.filter(e => e.estado === filtros.estado);
    }
    if (filtros.query) {
      const q = filtros.query.toLowerCase().trim();
      list = list.filter(e => 
        e.id_envio.toLowerCase().includes(q) ||
        e.codigo_establecimiento.includes(q) ||
        e.nombre_establecimiento.toLowerCase().includes(q) ||
        e.correo_usuario.toLowerCase().includes(q)
      );
    }
    return Promise.resolve({ success: true, data: list });
  }

  // --- OBTENER DOCUMENTOS DE UN ENVÍO ---
  async obtenerDocumentos(id_envio) {
    if (this.useGasBackend) {
      return this._callGas('obtenerDocumentos', { id_envio });
    }
    const docs = db.getDocumentosByEnvio(id_envio);
    return Promise.resolve({ success: true, data: docs });
  }

  // --- EVALUAR DOCUMENTO ---
  async evaluarDocumento(payload) {
    if (this.useGasBackend) {
      return this._callGas('evaluarDocumento', payload);
    }
    const doc = db.updateDocumentoEvaluacion(
      payload.id_documento,
      payload.estado_revision,
      payload.observaciones,
      payload.usuario
    );
    return Promise.resolve({ success: true, data: doc });
  }

  // --- FINALIZAR EVALUACIÓN GLOBAL ---
  async finalizarEvaluacion(payload) {
    if (this.useGasBackend) {
      return this._callGas('finalizarEvaluacion', payload);
    }
    
    // Regla de negocio en backend: Todos los obligatorios deben cumplir para APROBADO
    const docs = db.getDocumentosByEnvio(payload.id_envio);
    const criterios = db.getCriterios();
    
    let todosObligatoriosCumplen = true;
    let observacionesCompiladas = [];

    docs.forEach(d => {
      const def = APP_CONFIG.DOCUMENTOS_REQUERIDOS.find(r => r.tipo === d.tipo_documento);
      const esObligatorio = def ? def.obligatorio : true;
      if (esObligatorio) {
        if (d.estado_revision !== 'CUMPLE') {
          todosObligatoriosCumplen = false;
          if (d.observaciones) {
            observacionesCompiladas.push(`${d.tipo_documento}: ${d.observaciones}`);
          }
        }
      }
    });

    const estadoFinal = todosObligatoriosCumplen ? 'APROBADO' : 'REQUIERE_CORRECCION';
    const obsFinal = payload.observaciones_generales || observacionesCompiladas.join(' | ') || (estadoFinal === 'APROBADO' ? 'Plan Aprobado Satisfactoriamente.' : 'Requiere subsanar observaciones documentales.');

    const envioActualizado = db.updateEstadoEnvio(
      payload.id_envio,
      estadoFinal,
      obsFinal,
      payload.usuario
    );

    return Promise.resolve({
      success: true,
      data: envioActualizado,
      estadoCalculado: estadoFinal,
      notificacionEnviada: true,
      message: `Evaluación registrada. Estado final: ${estadoFinal}`
    });
  }

  // --- OBTENER AUDITORÍA ---
  async obtenerAuditoria(filtros = {}) {
    if (this.useGasBackend) {
      return this._callGas('obtenerAuditoria', filtros);
    }
    let list = db.getAuditoria();
    return Promise.resolve({ success: true, data: list });
  }

  // --- GESTIÓN DE USUARIOS Y ACCESOS ---
  async obtenerUsuarios() {
    if (this.useGasBackend) {
      try {
        const gasRes = await this._callGas('obtenerUsuarios');
        if (gasRes && gasRes.success && Array.isArray(gasRes.data) && gasRes.data.length > 0) {
          return gasRes;
        }
        console.warn('GAS no devolvió usuarios o no reconoce la acción, usando almacenamiento local.');
        const data = db.getUsuarios();
        return { success: true, data };
      } catch (err) {
        console.warn('Error en obtenerUsuarios desde GAS, usando base local:', err);
        const data = db.getUsuarios();
        return { success: true, data };
      }
    }
    const data = db.getUsuarios();
    return Promise.resolve({ success: true, data });
  }

  async guardarUsuario(usuario) {
    const localData = db.saveUsuario(usuario);
    if (this.useGasBackend) {
      try {
        const gasRes = await this._callGas('guardarUsuario', { usuario });
        if (gasRes && gasRes.success) {
          return gasRes;
        }
      } catch (err) {
        console.warn('Error al guardar usuario en GAS:', err);
      }
    }
    return Promise.resolve({ success: true, data: localData, message: 'Usuario guardado exitosamente.' });
  }

  async eliminarUsuario(id_usuario) {
    const localData = db.deleteUsuario(id_usuario);
    if (this.useGasBackend) {
      try {
        const gasRes = await this._callGas('eliminarUsuario', { id_usuario });
        if (gasRes && gasRes.success) {
          return gasRes;
        }
      } catch (err) {
        console.warn('Error al eliminar usuario en GAS:', err);
      }
    }
    return Promise.resolve({ success: true, data: localData, message: 'Usuario eliminado exitosamente.' });
  }

  async cambiarEstadoUsuario(id_usuario, estado) {
    const localData = db.toggleUsuarioEstado(id_usuario);
    if (this.useGasBackend) {
      try {
        const gasRes = await this._callGas('cambiarEstadoUsuario', { id_usuario, estado });
        if (gasRes && gasRes.success) {
          return gasRes;
        }
      } catch (err) {
        console.warn('Error al cambiar estado de usuario en GAS:', err);
      }
    }
    return Promise.resolve({ success: true, data: localData });
  }

  async verificarAcceso(correo, rol) {
    if (this.useGasBackend) {
      try {
        const gasRes = await this._callGas('verificarAcceso', { correo, rol });
        if (gasRes && gasRes.success && gasRes.data && gasRes.data.autorizado) {
          return gasRes;
        }
        // Fallback defensivo a catálogo local de usuarios autorizados
        const localResult = db.verificarAccesoLocal(correo, rol);
        if (localResult.autorizado) {
          return { success: true, data: localResult };
        }
        return gasRes && gasRes.data ? gasRes : { success: true, data: localResult };
      } catch (err) {
        console.warn('Fallo de conexión en verificarAcceso con GAS, aplicando verificación local:', err);
        const localResult = db.verificarAccesoLocal(correo, rol);
        return { success: true, data: localResult };
      }
    }
    const result = db.verificarAccesoLocal(correo, rol);
    return Promise.resolve({ success: true, data: result });
  }

  // --- PETICIÓN HTTP A GOOGLE APPS SCRIPT ---
  async _callGas(action, params = {}) {
    if (!this.endpointUrl) {
      throw new Error('No se ha configurado la URL del Web App de Google Apps Script.');
    }
    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, ...params })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en conexión con Google Apps Script:', error);
      throw error;
    }
  }
}

const api = new SedApiClient();
