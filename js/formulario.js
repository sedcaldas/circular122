/**
 * CONTROLADOR DEL FORMULARIO DE ENVÍO DE PLANES DE CONTINGENCIA (RECTOR)
 * Flujo de 4 Pasos:
 * Paso 1: Identificación Institucional
 * Paso 2: Selección de Sedes Afectadas (Catálogo Oficial de Sedes)
 * Paso 3: Datos del Responsable
 * Paso 4: Carga Documental
 */

class SedFormularioController {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.currentVersion = '01';
    this.editingEnvioId = null;
    this.sedesList = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.populateMunicipios();
    this.renderDocumentCards();
    this.checkForDraft();
  }

  setupEventListeners() {
    // Selector de municipio
    const selectMuni = document.getElementById('formMunicipio');
    if (selectMuni) {
      selectMuni.addEventListener('change', (e) => this.onMunicipioChange(e.target.value));
    }

    // Selector de institución
    const selectInst = document.getElementById('formInstitucion');
    if (selectInst) {
      selectInst.addEventListener('change', (e) => this.onInstitucionChange(e.target.value));
    }

    // Selector de Sede del Catálogo Oficial
    const selectSedeCat = document.getElementById('selectNuevaSedeCatalogo');
    if (selectSedeCat) {
      selectSedeCat.addEventListener('change', (e) => this.onSedeCatalogoChange(e.target.value));
    }

    // Botón agregar sede
    const btnAddSede = document.getElementById('btnAddSede');
    if (btnAddSede) {
      btnAddSede.addEventListener('click', () => this.addSedeRow());
    }

    // Botón agregar todas las sedes de la IE
    const btnAddAllSedes = document.getElementById('btnAddAllSedes');
    if (btnAddAllSedes) {
      btnAddAllSedes.addEventListener('click', () => this.addAllSedesFromIE());
    }

    // Botones de navegación de pasos
    document.querySelectorAll('.step-item').forEach(stepEl => {
      stepEl.addEventListener('click', () => {
        const stepNum = parseInt(stepEl.getAttribute('data-step'));
        if (stepNum < this.currentStep || this.validateCurrentStep()) {
          this.goToStep(stepNum);
        }
      });
    });

    const btnNext = document.getElementById('btnNextStep');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextStep());
    }

    const btnPrev = document.getElementById('btnPrevStep');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.prevStep());
    }

    // Botón Guardar Borrador
    const btnDraft = document.getElementById('btnSaveDraft');
    if (btnDraft) {
      btnDraft.addEventListener('click', () => this.saveDraft());
    }

    // Botón Revisar Envío
    const btnReview = document.getElementById('btnReviewSubmit');
    if (btnReview) {
      btnReview.addEventListener('click', () => this.openReviewModal());
    }

    // Botón Confirmar Envío Final en Modal
    const btnConfirm = document.getElementById('btnConfirmSubmit');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => this.submitFinal());
    }
  }

  populateMunicipios() {
    const select = document.getElementById('formMunicipio');
    if (!select) return;

    select.innerHTML = '<option value="">-- Seleccione Municipio --</option>';
    SED_CATALOGO_MUNICIPIOS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      select.appendChild(opt);
    });
  }

  onMunicipioChange(municipio) {
    const selectInst = document.getElementById('formInstitucion');
    const inputDane = document.getElementById('formCodigoDane');
    const selectSedeCat = document.getElementById('selectNuevaSedeCatalogo');
    if (!selectInst) return;

    selectInst.innerHTML = '<option value="">-- Seleccione Institución Educativa --</option>';
    if (inputDane) inputDane.value = '';
    if (selectSedeCat) {
      selectSedeCat.innerHTML = '<option value="">-- Seleccione Institución Primero --</option>';
      selectSedeCat.disabled = true;
    }

    if (!municipio) {
      selectInst.disabled = true;
      return;
    }

    const filtradas = SED_CATALOGO_INSTITUCIONES.filter(i => i.municipio === municipio);
    filtradas.forEach(i => {
      const opt = document.createElement('option');
      opt.value = i.codigo_establecimiento;
      opt.textContent = `${i.nombre_establecimiento} (${i.codigo_establecimiento})`;
      opt.dataset.nombre = i.nombre_establecimiento;
      selectInst.appendChild(opt);
    });

    selectInst.disabled = false;
  }

  onInstitucionChange(codigoDANE) {
    const inputDane = document.getElementById('formCodigoDane');
    if (inputDane) {
      inputDane.value = codigoDANE || '';
    }

    this.populateSedesDropdown(codigoDANE);
  }

  populateSedesDropdown(codigoDANE) {
    const selectSedeCat = document.getElementById('selectNuevaSedeCatalogo');
    if (!selectSedeCat) return;

    if (!codigoDANE) {
      selectSedeCat.innerHTML = '<option value="">-- Seleccione Institución Primero --</option>';
      selectSedeCat.disabled = true;
      return;
    }

    // Filtrar sedes del catálogo por código de establecimiento
    const sedesIE = SED_CATALOGO_SEDES.filter(s => s.codigo_establecimiento === codigoDANE);

    if (sedesIE.length === 0) {
      selectSedeCat.innerHTML = '<option value="">-- No se encontraron sedes registradas --</option>';
      selectSedeCat.disabled = true;
      return;
    }

    selectSedeCat.innerHTML = '<option value="">-- Seleccione Sede Oficial del Catálogo --</option>';
    sedesIE.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.codigo_sede;
      opt.textContent = `${s.nombre_sede} (DANE Sede: ${s.codigo_sede})`;
      opt.dataset.nombre = s.nombre_sede;
      opt.dataset.codigo = s.codigo_sede;
      selectSedeCat.appendChild(opt);
    });

    selectSedeCat.disabled = false;

    // Si aún no hay sedes en la lista, agregar automáticamente la Sede Principal por defecto
    if (this.sedesList.length === 0 && sedesIE.length > 0) {
      const principal = sedesIE.find(s => s.codigo_sede === codigoDANE) || sedesIE[0];
      this.sedesList = [
        {
          codigo_sede: principal.codigo_sede,
          nombre: principal.nombre_sede,
          nivel: 'Leve',
          modalidad: 'Alternancia'
        }
      ];
      this.renderSedesTable();
    }
  }

  onSedeCatalogoChange(codigoSede) {
    const selectSedeCat = document.getElementById('selectNuevaSedeCatalogo');
    const inputNombre = document.getElementById('inputNuevaSedeNombre');
    const inputCodSede = document.getElementById('inputNuevaSedeCodigo');

    if (!codigoSede || !selectSedeCat) return;

    const opt = selectSedeCat.options[selectSedeCat.selectedIndex];
    if (opt && opt.dataset.nombre) {
      if (inputNombre) inputNombre.value = opt.dataset.nombre;
      if (inputCodSede) inputCodSede.value = opt.dataset.codigo;
    }
  }

  // --- GESTIÓN DE SEDES AFECTADAS (PASO 2) ---
  addSedeRow() {
    const selectSedeCat = document.getElementById('selectNuevaSedeCatalogo');
    const inputNombre = document.getElementById('inputNuevaSedeNombre');
    const inputCodSede = document.getElementById('inputNuevaSedeCodigo');
    const selectNivel = document.getElementById('selectNuevaSedeNivel');
    const selectMod = document.getElementById('selectNuevaSedeMod');

    let codigoSede = inputCodSede ? inputCodSede.value.trim() : '';
    let nombre = inputNombre ? inputNombre.value.trim() : '';

    if (!nombre && selectSedeCat && selectSedeCat.value) {
      const opt = selectSedeCat.options[selectSedeCat.selectedIndex];
      nombre = opt.dataset.nombre;
      codigoSede = opt.dataset.codigo;
    }

    const nivel = selectNivel ? selectNivel.value : 'Leve';
    const modalidad = selectMod ? selectMod.value : 'Alternancia';

    if (!nombre) {
      app.showToast('Por favor seleccione una sede del catálogo o ingrese el nombre.', 'warning');
      return;
    }

    // Verificar si ya está en la lista
    const exists = this.sedesList.some(s => s.codigo_sede === codigoSede && s.nombre === nombre);
    if (exists) {
      app.showToast('Esta sede ya se encuentra agregada en la lista.', 'warning');
      return;
    }

    this.sedesList.push({
      codigo_sede: codigoSede || document.getElementById('formCodigoDane').value,
      nombre: nombre,
      nivel: nivel,
      modalidad: modalidad
    });

    if (inputNombre) inputNombre.value = '';
    if (inputCodSede) inputCodSede.value = '';
    if (selectSedeCat) selectSedeCat.value = '';

    this.renderSedesTable();
    app.showToast('Sede agregada al plan de contingencia.', 'success');
  }

  addAllSedesFromIE() {
    const codDane = document.getElementById('formCodigoDane').value;
    if (!codDane) {
      app.showToast('Seleccione primero una institución educativa en el Paso 1.', 'warning');
      return;
    }

    const sedesIE = SED_CATALOGO_SEDES.filter(s => s.codigo_establecimiento === codDane);
    if (sedesIE.length === 0) {
      app.showToast('No se encontraron sedes registradas para esta institución.', 'warning');
      return;
    }

    this.sedesList = sedesIE.map(s => ({
      codigo_sede: s.codigo_sede,
      nombre: s.nombre_sede,
      nivel: 'Leve',
      modalidad: 'Alternancia'
    }));

    this.renderSedesTable();
    app.showToast(`Se cargaron ${sedesIE.length} sedes oficiales de la institución.`, 'success');
  }

  removeSede(index) {
    this.sedesList.splice(index, 1);
    this.renderSedesTable();
  }

  renderSedesTable() {
    const tbody = document.getElementById('sedesTableBody');
    if (!tbody) return;

    if (this.sedesList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="padding: 1.5rem; color: var(--text-muted);">
            No se han registrado sedes. Seleccione una sede en el selector superior y haga clic en "Agregar Sede".
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.sedesList.map((s, idx) => `
      <tr>
        <td><code>${s.codigo_sede || '-'}</code></td>
        <td><strong>${s.nombre}</strong></td>
        <td>
          <span class="badge ${s.nivel === 'Severa' ? 'badge-correction' : s.nivel === 'Moderada' ? 'badge-review' : s.nivel === 'Sin Afectacion' ? 'badge-approved' : 'badge-draft'}">
            ${s.nivel}
          </span>
        </td>
        <td>${s.modalidad}</td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="formController.removeSede(${idx})">
            ✕ Quitar
          </button>
        </td>
      </tr>
    `).join('');
  }

  // --- RENDERIZADO DE TARJETAS DE CARGA DOCUMENTAL (PASO 4) ---
  renderDocumentCards() {
    const container = document.getElementById('docCardsContainer');
    if (!container) return;

    container.innerHTML = APP_CONFIG.DOCUMENTOS_REQUERIDOS.map(doc => {
      const fileData = docManager.getFile(doc.tipo);
      const isUploaded = !!fileData;

      return `
        <div class="doc-card ${doc.obligatorio ? 'mandatory' : 'optional'} ${isUploaded ? 'uploaded' : ''}" id="card-doc-${doc.tipo}">
          <div class="doc-card-header">
            <div class="doc-card-title">${doc.icono} ${doc.nombre}</div>
            <span class="doc-badge ${doc.obligatorio ? 'req' : 'opt'}">
              ${doc.obligatorio ? 'Obligatorio' : 'Opcional'}
            </span>
          </div>
          <p class="doc-card-desc">${doc.descripcion}</p>
          
          <div class="doc-dropzone" id="dropzone-${doc.tipo}" onclick="document.getElementById('input-file-${doc.tipo}').click()">
            <input type="file" id="input-file-${doc.tipo}" style="display:none;" 
                   accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                   onchange="formController.handleFileSelected('${doc.tipo}', this.files[0])">
            <div class="dropzone-icon">📁</div>
            <div class="dropzone-text">Haga clic o arrastre el archivo aquí</div>
            <div class="dropzone-subtext">PDF, DOCX, XLSX, JPG o PNG (Máx. 10 MB)</div>
          </div>

          <div id="file-info-${doc.tipo}" style="${isUploaded ? '' : 'display:none;'}">
            ${isUploaded ? `
              <div class="file-info-chip">
                <span class="file-info-name">✓ ${fileData.nombreOriginal}</span>
                <span class="badge badge-approved">v${fileData.version}</span>
                <button type="button" class="file-remove-btn" onclick="formController.removeUploadedFile('${doc.tipo}')">✕</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Configurar Drag & Drop
    APP_CONFIG.DOCUMENTOS_REQUERIDOS.forEach(doc => {
      const dropzone = document.getElementById(`dropzone-${doc.tipo}`);
      if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            this.handleFileSelected(doc.tipo, e.dataTransfer.files[0]);
          }
        });
      }
    });
  }

  async handleFileSelected(tipo, file) {
    if (!file) return;

    const validation = docManager.validateFile(file);
    if (!validation.valid) {
      app.showToast(validation.error, 'error');
      return;
    }

    const codDane = document.getElementById('formCodigoDane').value || '117000000000';
    try {
      const base64 = await docManager.readFileAsBase64(file);
      const isReemplazo = this.currentVersion !== '01';
      docManager.setFile(tipo, file, base64, codDane, this.currentVersion, isReemplazo);
      
      this.renderDocumentCards();
      app.showToast(`Archivo para "${tipo}" cargado correctamente.`, 'success');
    } catch (err) {
      app.showToast('Error al leer el archivo seleccionado.', 'error');
    }
  }

  removeUploadedFile(tipo) {
    docManager.removeFile(tipo);
    this.renderDocumentCards();
    app.showToast(`Archivo de "${tipo}" removido.`, 'warning');
  }

  // --- NAVEGACIÓN Y VALIDACIÓN DE PASOS ---
  validateCurrentStep() {
    if (this.currentStep === 1) {
      const muni = document.getElementById('formMunicipio').value;
      const inst = document.getElementById('formInstitucion').value;
      if (!muni || !inst) {
        app.showToast('Por favor seleccione el Municipio y la Institución Educativa.', 'warning');
        return false;
      }
    } else if (this.currentStep === 2) {
      if (this.sedesList.length === 0) {
        app.showToast('Debe incluir al menos una sede educativa en el plan de contingencia.', 'warning');
        return false;
      }
    } else if (this.currentStep === 3) {
      const nombre = document.getElementById('formRespNombre').value.trim();
      const cargo = document.getElementById('formRespCargo').value.trim();
      const correo = document.getElementById('formRespCorreo').value.trim();
      const tel = document.getElementById('formRespTel').value.trim();

      if (!nombre || !cargo || !correo || !tel) {
        app.showToast('Todos los campos del responsable institucional son obligatorios.', 'warning');
        return false;
      }

      if (!correo.includes('@') || !correo.includes('.')) {
        app.showToast('Por favor ingrese un correo electrónico válido.', 'warning');
        return false;
      }
    } else if (this.currentStep === 4) {
      const checkDocs = docManager.validateMandatoryDocuments();
      if (!checkDocs.complete) {
        app.showToast(`Faltan documentos obligatorios: ${checkDocs.missingDocs.join(', ')}`, 'error');
        return false;
      }
    }
    return true;
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.goToStep(this.currentStep + 1);
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(stepNumber) {
    this.currentStep = stepNumber;

    // Actualizar bubbles del stepper
    document.querySelectorAll('.step-item').forEach(item => {
      const step = parseInt(item.getAttribute('data-step'));
      item.classList.remove('active', 'completed');
      if (step === this.currentStep) {
        item.classList.add('active');
      } else if (step < this.currentStep) {
        item.classList.add('completed');
      }
    });

    // Mostrar sección correspondiente
    document.querySelectorAll('.form-step-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const activeSec = document.getElementById(`step-section-${this.currentStep}`);
    if (activeSec) activeSec.classList.add('active');

    // Botones de control
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnReview = document.getElementById('btnReviewSubmit');

    if (btnPrev) btnPrev.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
    if (btnReview) btnReview.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- GUARDAR Y RESTAURAR BORRADOR ---
  saveDraft() {
    const draftData = {
      municipio: document.getElementById('formMunicipio').value,
      codigo_establecimiento: document.getElementById('formCodigoDane').value,
      nombre_establecimiento: document.getElementById('formInstitucion').options[document.getElementById('formInstitucion').selectedIndex]?.dataset.nombre || '',
      nombre_responsable: document.getElementById('formRespNombre').value,
      cargo_responsable: document.getElementById('formRespCargo').value,
      correo_usuario: document.getElementById('formRespCorreo').value,
      telefono_responsable: document.getElementById('formRespTel').value,
      observaciones_adicionales: document.getElementById('formRespObservaciones')?.value || '',
      sedes_afectadas: this.sedesList,
      version: this.currentVersion,
      savedAt: new Date().toISOString()
    };

    db.saveBorrador(draftData);
    app.showToast('Borrador guardado exitosamente en este navegador.', 'success');
  }

  checkForDraft() {
    const draft = db.getBorrador();
    if (draft && draft.codigo_establecimiento) {
      const banner = document.getElementById('draftResumeBanner');
      if (banner) {
        banner.style.display = 'flex';
        document.getElementById('draftResumeInfo').textContent = 
          `Existe un borrador guardado para ${draft.nombre_establecimiento || draft.municipio} (${draft.savedAt.substring(0,10)})`;
      }
    }
  }

  restoreDraft() {
    const draft = db.getBorrador();
    if (!draft) return;

    document.getElementById('formMunicipio').value = draft.municipio;
    this.onMunicipioChange(draft.municipio);

    setTimeout(() => {
      document.getElementById('formInstitucion').value = draft.codigo_establecimiento;
      document.getElementById('formCodigoDane').value = draft.codigo_establecimiento;
      this.populateSedesDropdown(draft.codigo_establecimiento);
      
      document.getElementById('formRespNombre').value = draft.nombre_responsable || '';
      document.getElementById('formRespCargo').value = draft.cargo_responsable || '';
      document.getElementById('formRespCorreo').value = draft.correo_usuario || '';
      document.getElementById('formRespTel').value = draft.telefono_responsable || '';
      if (document.getElementById('formRespObservaciones')) {
        document.getElementById('formRespObservaciones').value = draft.observaciones_adicionales || '';
      }
      this.sedesList = draft.sedes_afectadas || [];
      this.renderSedesTable();
      this.currentVersion = draft.version || '01';

      const banner = document.getElementById('draftResumeBanner');
      if (banner) banner.style.display = 'none';

      app.showToast('Borrador restaurado correctamente.', 'success');
    }, 100);
  }

  discardDraft() {
    db.clearBorrador();
    const banner = document.getElementById('draftResumeBanner');
    if (banner) banner.style.display = 'none';
    app.showToast('Borrador descartado.', 'info');
  }

  // --- REVISIÓN PREVIA AL ENVÍO ---
  openReviewModal() {
    if (!this.validateCurrentStep()) return;

    const muni = document.getElementById('formMunicipio').value;
    const selectInst = document.getElementById('formInstitucion');
    const nomInst = selectInst.options[selectInst.selectedIndex]?.dataset.nombre || selectInst.value;
    const codDane = document.getElementById('formCodigoDane').value;
    const respNombre = document.getElementById('formRespNombre').value;
    const respCargo = document.getElementById('formRespCargo').value;
    const respCorreo = document.getElementById('formRespCorreo').value;
    const respTel = document.getElementById('formRespTel').value;

    const files = docManager.getAllFiles();

    document.getElementById('modalReviewContent').innerHTML = `
      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <h4 style="color: var(--brand-primary); margin-bottom: 0.5rem;">Institución Educativa</h4>
        <p><strong>Municipio:</strong> ${muni}</p>
        <p><strong>Nombre:</strong> ${nomInst}</p>
        <p><strong>Código DANE IE:</strong> <code>${codDane}</code></p>
        <p><strong>Versión a Radicar:</strong> <span class="badge badge-sent">v${this.currentVersion}</span></p>
      </div>

      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <h4 style="color: var(--brand-primary); margin-bottom: 0.5rem;">Sedes Incluidas (${this.sedesList.length})</h4>
        <ul style="padding-left: 1.2rem; font-size: 0.9rem;">
          ${this.sedesList.map(s => `<li><strong>[${s.codigo_sede || 'DANE'}] ${s.nombre}:</strong> Afectación ${s.nivel} (Estrategia: ${s.modalidad})</li>`).join('')}
        </ul>
      </div>

      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <h4 style="color: var(--brand-primary); margin-bottom: 0.5rem;">Responsable del Envío</h4>
        <p><strong>Nombre:</strong> ${respNombre} (${respCargo})</p>
        <p><strong>Correo de Contacto:</strong> ${respCorreo}</p>
        <p><strong>Teléfono:</strong> ${respTel}</p>
      </div>

      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
        <h4 style="color: var(--brand-primary); margin-bottom: 0.5rem;">Documentos Adjuntos (${files.length})</h4>
        <ul style="padding-left: 1.2rem; font-size: 0.9rem;">
          ${files.map(f => `<li>✓ <strong>${f.tipo}:</strong> ${f.nombreSistema} (${(f.size/1024).toFixed(1)} KB)</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('modalReviewEnvio').classList.add('active');
  }

  closeReviewModal() {
    document.getElementById('modalReviewEnvio').classList.remove('active');
  }

  // --- ENVÍO FINAL ---
  async submitFinal() {
    this.closeReviewModal();

    const muni = document.getElementById('formMunicipio').value;
    const selectInst = document.getElementById('formInstitucion');
    const nomInst = selectInst.options[selectInst.selectedIndex]?.dataset.nombre || selectInst.value;
    const codDane = document.getElementById('formCodigoDane').value;
    const respNombre = document.getElementById('formRespNombre').value;
    const respCargo = document.getElementById('formRespCargo').value;
    const respCorreo = document.getElementById('formRespCorreo').value;
    const respTel = document.getElementById('formRespTel').value;
    const obs = document.getElementById('formRespObservaciones')?.value || '';

    // Generar radicado único
    const radicado = this.editingEnvioId || 'ENV-2026-' + Math.floor(100000 + Math.random() * 900000);
    const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const files = docManager.getAllFiles();
    const docsPayload = files.map((f, i) => ({
      id_documento: `DOC-${radicado.replace('ENV-2026-','')}-${(i+1).toString().padStart(2,'0')}`,
      id_envio: radicado,
      municipio: muni,
      codigo_establecimiento: codDane,
      tipo_documento: f.tipo,
      nombre_original: f.nombreOriginal,
      nombre_sistema: f.nombreSistema,
      base64: f.base64,
      id_drive: `DRIVE-${Date.now()}-${i}`,
      url_drive: '#',
      version: f.version,
      fecha_carga: fechaHora,
      usuario_carga: respCorreo,
      estado_revision: 'PENDIENTE',
      observaciones: ''
    }));

    const envioPayload = {
      id_envio: radicado,
      fecha_envio: fechaHora.substring(0, 10),
      hora_envio: fechaHora.substring(11),
      municipio: muni,
      codigo_establecimiento: codDane,
      nombre_establecimiento: nomInst,
      id_usuario: auth.getUser().id_usuario,
      correo_usuario: respCorreo,
      nombre_responsable: respNombre,
      cargo_responsable: respCargo,
      telefono_responsable: respTel,
      version: this.currentVersion,
      estado: 'EN_REVISION',
      fecha_ultima_actualizacion: fechaHora,
      observaciones_generales: obs || 'Envío de plan de contingencia radicado.',
      sedes_afectadas: this.sedesList
    };

    try {
      app.showLoading(true, 'Radicando plan de contingencia en el sistema...');
      const response = await api.crearEnvio({ envio: envioPayload, documentos: docsPayload });
      app.showLoading(false);

      // Limpiar borrador
      db.clearBorrador();

      // Mostrar pantalla de éxito
      this.showSuccessScreen(envioPayload, docsPayload);
    } catch (err) {
      app.showLoading(false);
      app.showToast('Error al radicar el plan de contingencia: ' + err.message, 'error');
    }
  }

  showSuccessScreen(envio, docs) {
    document.getElementById('formWizardContainer').style.display = 'none';
    const successBox = document.getElementById('formSuccessContainer');
    if (successBox) {
      successBox.style.display = 'block';
      document.getElementById('successRadicadoNum').textContent = envio.id_envio;
      document.getElementById('successInstNombre').textContent = `${envio.nombre_establecimiento} (${envio.codigo_establecimiento})`;
      document.getElementById('successVersionNum').textContent = `Versión ${envio.version}`;
      document.getElementById('successEmailSentTo').textContent = envio.correo_usuario;
      document.getElementById('successFechaHora').textContent = `${envio.fecha_envio} a las ${envio.hora_envio}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    docManager.reset();
    this.sedesList = [];
    this.currentStep = 1;
    this.currentVersion = '01';
    this.editingEnvioId = null;

    document.getElementById('formInstitucion').innerHTML = '<option value="">-- Seleccione Institución Educativa --</option>';
    document.getElementById('formInstitucion').disabled = true;
    document.getElementById('selectNuevaSedeCatalogo').innerHTML = '<option value="">-- Seleccione Institución Primero --</option>';
    document.getElementById('selectNuevaSedeCatalogo').disabled = true;

    document.getElementById('formMunicipio').value = '';
    document.getElementById('formCodigoDane').value = '';
    document.getElementById('formRespNombre').value = '';
    document.getElementById('formRespCargo').value = '';
    document.getElementById('formRespCorreo').value = '';
    document.getElementById('formRespTel').value = '';
    if (document.getElementById('formRespObservaciones')) {
      document.getElementById('formRespObservaciones').value = '';
    }

    this.renderSedesTable();
    this.renderDocumentCards();
    this.goToStep(1);

    document.getElementById('formWizardContainer').style.display = 'block';
    document.getElementById('formSuccessContainer').style.display = 'none';
  }

  prepareNewVersion(envioPrevio, docsPrevios) {
    this.resetForm();
    this.editingEnvioId = envioPrevio.id_envio;
    const nextVerNum = parseInt(envioPrevio.version) + 1;
    this.currentVersion = nextVerNum.toString().padStart(2, '0');

    document.getElementById('formMunicipio').value = envioPrevio.municipio;
    this.onMunicipioChange(envioPrevio.municipio);

    setTimeout(() => {
      document.getElementById('formInstitucion').value = envioPrevio.codigo_establecimiento;
      document.getElementById('formCodigoDane').value = envioPrevio.codigo_establecimiento;
      this.populateSedesDropdown(envioPrevio.codigo_establecimiento);

      document.getElementById('formRespNombre').value = envioPrevio.nombre_responsable || '';
      document.getElementById('formRespCargo').value = envioPrevio.cargo_responsable || '';
      document.getElementById('formRespCorreo').value = envioPrevio.correo_usuario || '';
      document.getElementById('formRespTel').value = envioPrevio.telefono_responsable || '';
      this.sedesList = envioPrevio.sedes_afectadas || [];
      this.renderSedesTable();

      app.switchTab('formulario');
      app.showToast(`Preparando Versión ${this.currentVersion} para radicar subsanaciones.`, 'info');
    }, 100);
  }
}

let formController;
