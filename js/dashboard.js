/**
 * DASHBOARD Y ANALÍTICA INSTITUCIONAL (SED CALDAS)
 * Métricas en tiempo real, gráficos de cumplimiento y reportes exportables
 */

class SedDashboardController {
  constructor() {
    this.init();
  }

  init() {
    const btnExportCsv = document.getElementById('btnDashboardExportCsv');
    const btnPrint = document.getElementById('btnDashboardPrint');

    if (btnExportCsv) btnExportCsv.addEventListener('click', () => this.exportarConsolidadoCSV());
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());
  }

  async actualizarDashboard() {
    try {
      const resEnvios = await api.obtenerEnvios();
      const envios = resEnvios.data || [];
      const totalIEs = SED_CATALOGO_INSTITUCIONES.length;

      // Calcular KPIs
      const aprobados = envios.filter(e => e.estado === 'APROBADO').length;
      const correccion = envios.filter(e => e.estado === 'REQUIERE_CORRECCION').length;
      const revision = envios.filter(e => e.estado === 'EN_REVISION' || e.estado === 'ENVIADO').length;
      const enviadosTotal = envios.length;
      const pendientes = Math.max(0, totalIEs - enviadosTotal);

      const pctAprobados = totalIEs > 0 ? ((aprobados / totalIEs) * 100).toFixed(1) : '0';
      const pctRadicados = totalIEs > 0 ? ((enviadosTotal / totalIEs) * 100).toFixed(1) : '0';

      // Actualizar Elementos DOM
      this.setText('kpiTotalIEs', totalIEs);
      this.setText('kpiRadicados', enviadosTotal);
      this.setText('kpiPctRadicados', `${pctRadicados}% de cobertura`);
      this.setText('kpiEnRevision', revision);
      this.setText('kpiAprobados', aprobados);
      this.setText('kpiPctAprobados', `${pctAprobados}% del total`);
      this.setText('kpiCorreccion', correccion);
      this.setText('kpiPendientes', pendientes);

      // Renderizar Gráficos de Canvas
      this.renderGraficoEstados(aprobados, correccion, revision, pendientes);
      this.renderGraficoMunicipios(envios);
      this.renderTablaResumenMunicipal(envios);
    } catch (err) {
      console.error('Error al actualizar dashboard:', err);
    }
  }

  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  renderGraficoEstados(aprobados, correccion, revision, pendientes) {
    const canvas = document.getElementById('chartEstadosCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [
      { label: 'Aprobados', value: aprobados, color: '#10b981' },
      { label: 'En Revisión', value: revision, color: '#f59e0b' },
      { label: 'Corrección', value: correccion, color: '#e11d48' },
      { label: 'Sin Radicar', value: pendientes, color: '#94a3b8' }
    ];

    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    let startAngle = -Math.PI / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    data.forEach(slice => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      startAngle += sliceAngle;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Centro texto
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}`, centerX, centerY - 6);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Total IEs', centerX, centerY + 12);
  }

  renderGraficoMunicipios(envios) {
    const canvas = document.getElementById('chartMunicipiosCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Agrupar envíos por los 10 primeros municipios
    const muniCounts = {};
    SED_CATALOGO_MUNICIPIOS.forEach(m => muniCounts[m] = 0);
    envios.forEach(e => {
      if (muniCounts[e.municipio] !== undefined) muniCounts[e.municipio]++;
    });

    const topMunis = Object.entries(muniCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const maxVal = Math.max(...topMunis.map(m => m[1]), 5);
    const barWidth = 28;
    const gap = 16;
    const startX = 50;
    const baseY = canvas.height - 35;
    const chartHeight = canvas.height - 60;

    topMunis.forEach((item, idx) => {
      const x = startX + idx * (barWidth + gap);
      const h = (item[1] / maxVal) * chartHeight;
      const y = baseY - h;

      // Barra
      ctx.fillStyle = item[1] > 0 ? '#0f4c81' : '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, [4, 4, 0, 0]);
      ctx.fill();

      // Valor encima
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item[1]}`, x + barWidth / 2, y - 5);

      // Nombre Municipio truncado
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.fillText(item[0].substring(0, 5), x + barWidth / 2, baseY + 15);
    });
  }

  renderTablaResumenMunicipal(envios) {
    const tbody = document.getElementById('tablaResumenMunicipalBody');
    if (!tbody) return;

    // Calcular desglose por municipio
    const stats = {};
    SED_CATALOGO_MUNICIPIOS.forEach(m => {
      const totalMuni = SED_CATALOGO_INSTITUCIONES.filter(i => i.municipio === m).length;
      stats[m] = { total: totalMuni, rad: 0, apr: 0, rev: 0, cor: 0 };
    });

    envios.forEach(e => {
      if (stats[e.municipio]) {
        stats[e.municipio].rad++;
        if (e.estado === 'APROBADO') stats[e.municipio].apr++;
        if (e.estado === 'EN_REVISION' || e.estado === 'ENVIADO') stats[e.municipio].rev++;
        if (e.estado === 'REQUIERE_CORRECCION') stats[e.municipio].cor++;
      }
    });

    tbody.innerHTML = Object.entries(stats).map(([muni, s]) => {
      const pct = s.total > 0 ? Math.round((s.apr / s.total) * 100) : 0;
      return `
        <tr>
          <td><strong>${muni}</strong></td>
          <td>${s.total}</td>
          <td>${s.rad}</td>
          <td><span class="badge badge-approved">${s.apr}</span></td>
          <td><span class="badge badge-review">${s.rev}</span></td>
          <td><span class="badge badge-correction">${s.cor}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: #10b981;"></div>
              </div>
              <span style="font-weight: 700; font-size: 0.8rem;">${pct}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  exportarConsolidadoCSV() {
    const envios = db.getEnvios();
    if (envios.length === 0) {
      app.showToast('No hay registros de planes de contingencia para exportar.', 'warning');
      return;
    }

    const headers = [
      'Radicado', 'Municipio', 'Codigo_DANE_IE', 'Institucion', 'Codigo_DANE_Sede', 'Nombre_Sede', 'Nivel_Afectacion', 'Modalidad_Pedagogica', 'Version',
      'Estado', 'Fecha_Envio', 'Responsable', 'Cargo', 'Correo', 'Telefono', 'Observaciones'
    ];

    const rows = [];
    envios.forEach(e => {
      const sedes = (e.sedes_afectadas && e.sedes_afectadas.length > 0) 
        ? e.sedes_afectadas 
        : [{ codigo_sede: e.codigo_establecimiento, nombre: 'Sede Principal', nivel: 'Leve', modalidad: 'Alternancia' }];

      sedes.forEach(s => {
        rows.push([
          `"${e.id_envio}"`,
          `"${e.municipio}"`,
          `"${e.codigo_establecimiento}"`,
          `"${e.nombre_establecimiento.replace(/"/g, '""')}"`,
          `"${s.codigo_sede || e.codigo_establecimiento}"`,
          `"${(s.nombre || '').replace(/"/g, '""')}"`,
          `"${s.nivel || 'Leve'}"`,
          `"${s.modalidad || 'Alternancia'}"`,
          `"${e.version}"`,
          `"${e.estado}"`,
          `"${e.fecha_envio} ${e.hora_envio}"`,
          `"${e.nombre_responsable || ''}"`,
          `"${e.cargo_responsable || ''}"`,
          `"${e.correo_usuario || ''}"`,
          `"${e.telefono_responsable || ''}"`,
          `"${(e.observaciones_generales || '').replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SED_Caldas_Planes_Contingencia_Sedes_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    app.showToast('Consolidado con sedes descargado exitosamente en formato Excel/CSV.', 'success');
  }
}

let dashboardController;
