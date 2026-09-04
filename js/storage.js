/**
 * MOTOR DE ALMACENAMIENTO Y SIMULACIÓN LOCAL (Google Sheets & Drive Bridge)
 * Permite la operación autónoma y el almacenamiento local persistente
 */

class SedStorageEngine {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    // Inicializar Criterios si no existen
    if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CRITERIOS)) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CRITERIOS, JSON.stringify(SED_CRITERIOS_INICIALES));
    }

    // Inicializar Usuarios
    if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USUARIOS)) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USUARIOS, JSON.stringify(SED_USUARIOS_INICIALES));
    }

    // Inicializar Asignaciones
    if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ASIGNACIONES)) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ASIGNACIONES, JSON.stringify(SED_ASIGNACIONES_INICIALES));
    }

    // Inicializar Auditoría
    if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUDITORIA)) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUDITORIA, JSON.stringify([]));
    }

    // Inicializar Envíos y Documentos con datos semilla de demostración si está vacío
    if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ENVIOS)) {
      this.seedInitialData();
    }
  }

  seedInitialData() {
    const seedEnvios = [
      {
        id_envio: 'ENV-2026-000101',
        fecha_envio: '2026-08-26',
        hora_envio: '09:30:15',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        nombre_establecimiento: 'INSTITUCION EDUCATIVA MARINO GOMEZ ESTRADA',
        id_usuario: 'USR-001',
        correo_usuario: 'rector.marinogomez@sedcaldas.edu.co',
        nombre_responsable: 'Lic. Marino Gómez Estrada',
        cargo_responsable: 'Rector',
        telefono_responsable: '3104567890',
        version: '01',
        estado: 'APROBADO',
        fecha_ultima_actualizacion: '2026-08-27 14:20:00',
        observaciones_generales: 'Plan de contingencia y protocolos de evacuación validados satisfactoriamente.',
        sedes_afectadas: [
          { nombre: 'Sede Principal Marino Gómez', nivel: 'Leve', modalidad: 'Alternancia' },
          { nombre: 'Sede San Vicente', nivel: 'Moderada', modalidad: 'Guías Impresas' }
        ]
      },
      {
        id_envio: 'ENV-2026-000102',
        fecha_envio: '2026-08-28',
        hora_envio: '11:15:40',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        nombre_establecimiento: 'INSTITUCION EDUCATIVA SANTA TERESITA',
        id_usuario: 'USR-004',
        correo_usuario: 'rector.santateresita@sedcaldas.edu.co',
        nombre_responsable: 'Hna. Gloria Amparo Morales',
        cargo_responsable: 'Rectora',
        telefono_responsable: '3128901234',
        version: '01',
        estado: 'REQUIERE_CORRECCION',
        fecha_ultima_actualizacion: '2026-08-29 10:45:00',
        observaciones_generales: 'La estrategia pedagógica debe especificar el cronograma de entrega de talleres impresos.',
        sedes_afectadas: [
          { nombre: 'Sede Central Santa Teresita', nivel: 'Moderada', modalidad: 'Reubicación temporal' }
        ]
      },
      {
        id_envio: 'ENV-2026-000103',
        fecha_envio: '2026-09-01',
        hora_envio: '16:05:22',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        nombre_establecimiento: 'INSTITUCION EDUCATIVA FLORENCIA',
        id_usuario: 'USR-005',
        correo_usuario: 'rectoria.florencia@sedcaldas.edu.co',
        nombre_responsable: 'Mg. Jairo Alonso Castaño',
        cargo_responsable: 'Rector',
        telefono_responsable: '3147778899',
        version: '01',
        estado: 'EN_REVISION',
        fecha_ultima_actualizacion: '2026-09-01 16:05:22',
        observaciones_generales: 'En proceso de revisión por parte de la coordinación departamental.',
        sedes_afectadas: [
          { nombre: 'Sede Florencia Central', nivel: 'Severa', modalidad: 'Guías y Encuentros periódicos' },
          { nombre: 'Sede Rural La Selva', nivel: 'Leve', modalidad: 'Presencial con ajustes' }
        ]
      }
    ];

    const seedDocumentos = [
      // Documentos de ENV-2026-000101
      {
        id_documento: 'DOC-101-01',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'PlanContingencia',
        nombre_original: 'Plan_Contingencia_MarinoGomez_2026.pdf',
        nombre_sistema: 'IE_117013000306_PlanContingencia_v01.pdf',
        id_drive: 'DRIVE-FILE-101-01',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Cumple a cabalidad.'
      },
      {
        id_documento: 'DOC-101-02',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'SedesAfectadas',
        nombre_original: 'Diagnostico_Sedes_Afectadas.pdf',
        nombre_sistema: 'IE_117013000306_SedesAfectadas_v01.pdf',
        id_drive: 'DRIVE-FILE-101-02',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Afectación correctamente diagnosticada.'
      },
      {
        id_documento: 'DOC-101-03',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'Estrategia',
        nombre_original: 'Estrategia_Continuidad_Pedagogica.pdf',
        nombre_sistema: 'IE_117013000306_Estrategia_v01.pdf',
        id_drive: 'DRIVE-FILE-101-03',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Estrategia viable y aprobada.'
      },
      {
        id_documento: 'DOC-101-04',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'Cronograma',
        nombre_original: 'Cronograma_Actividades.xlsx',
        nombre_sistema: 'IE_117013000306_Cronograma_v01.xlsx',
        id_drive: 'DRIVE-FILE-101-04',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Cronograma coherente.'
      },
      {
        id_documento: 'DOC-101-05',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'EvidenciaActividades',
        nombre_original: 'Acta_Consejo_Directivo_Evidencias.pdf',
        nombre_sistema: 'IE_117013000306_EvidenciaActividades_v01.pdf',
        id_drive: 'DRIVE-FILE-101-05',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Actas y firmas válidas.'
      },
      {
        id_documento: 'DOC-101-06',
        id_envio: 'ENV-2026-000101',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        tipo_documento: 'Requerimientos',
        nombre_original: 'Solicitud_Apoyo_SED.pdf',
        nombre_sistema: 'IE_117013000306_Requerimientos_v01.pdf',
        id_drive: 'DRIVE-FILE-101-06',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-26 09:30:15',
        usuario_carga: 'rector.marinogomez@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Radicada ante infraestructura.'
      },

      // Documentos de ENV-2026-000102 (Santa Teresita - Chinchiná)
      {
        id_documento: 'DOC-102-01',
        id_envio: 'ENV-2026-000102',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        tipo_documento: 'PlanContingencia',
        nombre_original: 'Plan_Contingencia_ST.pdf',
        nombre_sistema: 'IE_117174000349_PlanContingencia_v01.pdf',
        id_drive: 'DRIVE-FILE-102-01',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-28 11:15:40',
        usuario_carga: 'rector.santateresita@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Aprobado.'
      },
      {
        id_documento: 'DOC-102-02',
        id_envio: 'ENV-2026-000102',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        tipo_documento: 'SedesAfectadas',
        nombre_original: 'Afectaciones_Sedes.pdf',
        nombre_sistema: 'IE_117174000349_SedesAfectadas_v01.pdf',
        id_drive: 'DRIVE-FILE-102-02',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-28 11:15:40',
        usuario_carga: 'rector.santateresita@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Aprobado.'
      },
      {
        id_documento: 'DOC-102-03',
        id_envio: 'ENV-2026-000102',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        tipo_documento: 'Estrategia',
        nombre_original: 'Estrategia_Pedagogica.pdf',
        nombre_sistema: 'IE_117174000349_Estrategia_v01.pdf',
        id_drive: 'DRIVE-FILE-102-03',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-28 11:15:40',
        usuario_carga: 'rector.santateresita@sedcaldas.edu.co',
        estado_revision: 'NO CUMPLE',
        observaciones: 'Debe especificar el cronograma de entrega de talleres impresos y los canales de contacto docente.'
      },
      {
        id_documento: 'DOC-102-04',
        id_envio: 'ENV-2026-000102',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        tipo_documento: 'Cronograma',
        nombre_original: 'Cronograma.xlsx',
        nombre_sistema: 'IE_117174000349_Cronograma_v01.xlsx',
        id_drive: 'DRIVE-FILE-102-04',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-28 11:15:40',
        usuario_carga: 'rector.santateresita@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Aceptable.'
      },
      {
        id_documento: 'DOC-102-05',
        id_envio: 'ENV-2026-000102',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        tipo_documento: 'EvidenciaActividades',
        nombre_original: 'Evidencias_Fotos.pdf',
        nombre_sistema: 'IE_117174000349_EvidenciaActividades_v01.pdf',
        id_drive: 'DRIVE-FILE-102-05',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-08-28 11:15:40',
        usuario_carga: 'rector.santateresita@sedcaldas.edu.co',
        estado_revision: 'CUMPLE',
        observaciones: 'Fotos y actas verificadas.'
      },

      // Documentos de ENV-2026-000103 (Florencia - Riosucio)
      {
        id_documento: 'DOC-103-01',
        id_envio: 'ENV-2026-000103',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        tipo_documento: 'PlanContingencia',
        nombre_original: 'Plan_Contingencia_Florencia.pdf',
        nombre_sistema: 'IE_217614000880_PlanContingencia_v01.pdf',
        id_drive: 'DRIVE-FILE-103-01',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-09-01 16:05:22',
        usuario_carga: 'rectoria.florencia@sedcaldas.edu.co',
        estado_revision: 'PENDIENTE',
        observaciones: ''
      },
      {
        id_documento: 'DOC-103-02',
        id_envio: 'ENV-2026-000103',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        tipo_documento: 'SedesAfectadas',
        nombre_original: 'Sedes_Afectadas_Florencia.pdf',
        nombre_sistema: 'IE_217614000880_SedesAfectadas_v01.pdf',
        id_drive: 'DRIVE-FILE-103-02',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-09-01 16:05:22',
        usuario_carga: 'rectoria.florencia@sedcaldas.edu.co',
        estado_revision: 'PENDIENTE',
        observaciones: ''
      },
      {
        id_documento: 'DOC-103-03',
        id_envio: 'ENV-2026-000103',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        tipo_documento: 'Estrategia',
        nombre_original: 'Estrategia_Florencia.pdf',
        nombre_sistema: 'IE_217614000880_Estrategia_v01.pdf',
        id_drive: 'DRIVE-FILE-103-03',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-09-01 16:05:22',
        usuario_carga: 'rectoria.florencia@sedcaldas.edu.co',
        estado_revision: 'PENDIENTE',
        observaciones: ''
      },
      {
        id_documento: 'DOC-103-04',
        id_envio: 'ENV-2026-000103',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        tipo_documento: 'Cronograma',
        nombre_original: 'Cronograma_Florencia.xlsx',
        nombre_sistema: 'IE_217614000880_Cronograma_v01.xlsx',
        id_drive: 'DRIVE-FILE-103-04',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-09-01 16:05:22',
        usuario_carga: 'rectoria.florencia@sedcaldas.edu.co',
        estado_revision: 'PENDIENTE',
        observaciones: ''
      },
      {
        id_documento: 'DOC-103-05',
        id_envio: 'ENV-2026-000103',
        municipio: 'RIOSUCIO',
        codigo_establecimiento: '217614000880',
        tipo_documento: 'EvidenciaActividades',
        nombre_original: 'Evidencias_Florencia.pdf',
        nombre_sistema: 'IE_217614000880_EvidenciaActividades_v01.pdf',
        id_drive: 'DRIVE-FILE-103-05',
        url_drive: '#',
        version: '01',
        fecha_carga: '2026-09-01 16:05:22',
        usuario_carga: 'rectoria.florencia@sedcaldas.edu.co',
        estado_revision: 'PENDIENTE',
        observaciones: ''
      }
    ];

    const seedAuditoria = [
      {
        id_auditoria: 'AUD-001',
        fecha_hora: '2026-08-26 09:30:15',
        usuario: 'rector.marinogomez@sedcaldas.edu.co',
        rol: 'RECTOR',
        accion: 'CREAR_ENVIO',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        id_envio: 'ENV-2026-000101',
        version: '01',
        resultado: 'EXITO',
        observacion: 'Envío inicial registrado.'
      },
      {
        id_auditoria: 'AUD-002',
        fecha_hora: '2026-08-27 14:20:00',
        usuario: 'maria.restrepo@sedcaldas.gov.co',
        rol: 'COORDINADOR',
        accion: 'APROBAR',
        municipio: 'AGUADAS',
        codigo_establecimiento: '117013000306',
        id_envio: 'ENV-2026-000101',
        version: '01',
        resultado: 'APROBADO',
        observacion: 'Plan de contingencia evaluado y aprobado en su totalidad.'
      },
      {
        id_auditoria: 'AUD-003',
        fecha_hora: '2026-08-29 10:45:00',
        usuario: 'maria.restrepo@sedcaldas.gov.co',
        rol: 'COORDINADOR',
        accion: 'SOLICITAR_CORRECCION',
        municipio: 'CHINCHINÁ',
        codigo_establecimiento: '117174000349',
        id_envio: 'ENV-2026-000102',
        version: '01',
        resultado: 'REQUIERE_CORRECCION',
        observacion: 'Observación en Estrategia pedagógica notificada por correo.'
      }
    ];

    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ENVIOS, JSON.stringify(seedEnvios));
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DOCUMENTOS, JSON.stringify(seedDocumentos));
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUDITORIA, JSON.stringify(seedAuditoria));
  }

  // --- MÉTODOS DE AUDITORÍA ---
  logAudit(data) {
    const list = this.getAuditoria();
    const entry = {
      id_auditoria: 'AUD-' + Date.now().toString(36).toUpperCase(),
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
      usuario: data.usuario || 'Anonimo',
      rol: data.rol || 'CONSULTA',
      accion: data.accion || 'ACCION',
      municipio: data.municipio || '',
      codigo_establecimiento: data.codigo_establecimiento || '',
      id_envio: data.id_envio || '',
      id_documento: data.id_documento || '',
      version: data.version || '01',
      resultado: data.resultado || 'EXITO',
      observacion: data.observacion || ''
    };
    list.unshift(entry);
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUDITORIA, JSON.stringify(list));
    return entry;
  }

  getAuditoria() {
    return JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUDITORIA) || '[]');
  }

  // --- MÉTODOS DE ENVÍOS ---
  getEnvios() {
    return JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ENVIOS) || '[]');
  }

  getEnvioById(id_envio) {
    const list = this.getEnvios();
    return list.find(e => e.id_envio === id_envio) || null;
  }

  getEnviosByCodigo(codigo_establecimiento) {
    const list = this.getEnvios();
    return list.filter(e => e.codigo_establecimiento === codigo_establecimiento);
  }

  saveEnvio(envioData, documentosData) {
    const envios = this.getEnvios();
    const documentos = this.getDocumentos();

    // Comprobar si es nueva versión de un envío existente
    const index = envios.findIndex(e => e.id_envio === envioData.id_envio);
    if (index >= 0) {
      envios[index] = { ...envios[index], ...envioData, fecha_ultima_actualizacion: new Date().toISOString().replace('T', ' ').substring(0, 19) };
    } else {
      envios.unshift(envioData);
    }
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ENVIOS, JSON.stringify(envios));

    // Guardar / Reemplazar documentos
    if (documentosData && documentosData.length > 0) {
      documentosData.forEach(newDoc => {
        const docIdx = documentos.findIndex(d => d.id_envio === newDoc.id_envio && d.tipo_documento === newDoc.tipo_documento && d.version === newDoc.version);
        if (docIdx >= 0) {
          documentos[docIdx] = newDoc;
        } else {
          documentos.push(newDoc);
        }
      });
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DOCUMENTOS, JSON.stringify(documentos));
    }

    // Auditoría
    this.logAudit({
      usuario: envioData.correo_usuario,
      rol: 'RECTOR',
      accion: envioData.version === '01' ? 'CREAR_ENVIO' : 'CREAR_VERSION',
      municipio: envioData.municipio,
      codigo_establecimiento: envioData.codigo_establecimiento,
      id_envio: envioData.id_envio,
      version: envioData.version,
      resultado: envioData.estado,
      observacion: `Envío registrado con ${documentosData ? documentosData.length : 0} documentos.`
    });

    return envioData;
  }

  updateEstadoEnvio(id_envio, nuevoEstado, observaciones, usuarioEvaluador) {
    const envios = this.getEnvios();
    const index = envios.findIndex(e => e.id_envio === id_envio);
    if (index >= 0) {
      envios[index].estado = nuevoEstado;
      if (observaciones) {
        envios[index].observaciones_generales = observaciones;
      }
      envios[index].fecha_ultima_actualizacion = new Date().toISOString().replace('T', ' ').substring(0, 19);
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ENVIOS, JSON.stringify(envios));

      this.logAudit({
        usuario: usuarioEvaluador || 'Coordinador',
        rol: 'COORDINADOR',
        accion: nuevoEstado === 'APROBADO' ? 'APROBAR' : 'SOLICITAR_CORRECCION',
        municipio: envios[index].municipio,
        codigo_establecimiento: envios[index].codigo_establecimiento,
        id_envio: id_envio,
        version: envios[index].version,
        resultado: nuevoEstado,
        observacion: observaciones || `Estado actualizado a ${nuevoEstado}`
      });

      return envios[index];
    }
    return null;
  }

  // --- MÉTODOS DE DOCUMENTOS ---
  getDocumentos() {
    return JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DOCUMENTOS) || '[]');
  }

  getDocumentosByEnvio(id_envio) {
    const list = this.getDocumentos();
    return list.filter(d => d.id_envio === id_envio);
  }

  updateDocumentoEvaluacion(id_documento, estado_revision, observaciones, usuario) {
    const list = this.getDocumentos();
    const idx = list.findIndex(d => d.id_documento === id_documento);
    if (idx >= 0) {
      list[idx].estado_revision = estado_revision;
      list[idx].observaciones = observaciones;
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DOCUMENTOS, JSON.stringify(list));

      this.logAudit({
        usuario: usuario || 'Coordinador',
        rol: 'COORDINADOR',
        accion: 'EVALUAR_DOCUMENTO',
        municipio: list[idx].municipio,
        codigo_establecimiento: list[idx].codigo_establecimiento,
        id_envio: list[idx].id_envio,
        id_documento: id_documento,
        version: list[idx].version,
        resultado: estado_revision,
        observacion: `Documento ${list[idx].tipo_documento}: ${estado_revision}. ${observaciones}`
      });

      return list[idx];
    }
    return null;
  }

  // --- MÉTODOS DE CRITERIOS ---
  getCriterios() {
    return JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CRITERIOS) || '[]');
  }

  saveCriterio(criterio) {
    const list = this.getCriterios();
    const idx = list.findIndex(c => c.id_criterio === criterio.id_criterio);
    if (idx >= 0) {
      list[idx] = criterio;
    } else {
      criterio.id_criterio = 'CRIT-' + (list.length + 1).toString().padStart(3, '0');
      list.push(criterio);
    }
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CRITERIOS, JSON.stringify(list));
    return list;
  }

  deleteCriterio(id_criterio) {
    let list = this.getCriterios();
    list = list.filter(c => c.id_criterio !== id_criterio);
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CRITERIOS, JSON.stringify(list));
    return list;
  }

  // --- MÉTODOS DE BORRADOR ---
  saveBorrador(data) {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.BORRADOR, JSON.stringify(data));
  }

  getBorrador() {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.BORRADOR);
    return raw ? JSON.parse(raw) : null;
  }

  clearBorrador() {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.BORRADOR);
  }
}

const db = new SedStorageEngine();
