# Sistema de Gestión y Seguimiento de Planes de Contingencia – SED Caldas

> **Secretaría de Educación Departamental de Caldas**  
> En cumplimiento de la **Circular Nº 122 del 24 de agosto de 2026** y la **Resolución No. 3119-6**, frente a la emergencia por el evento sísmico del 10 de agosto de 2026.

---

## 🏛️ Descripción General

Aplicación web institucional orientada a la recepción, versionamiento, evaluación técnica y seguimiento de los planes de contingencia radicados por los directivos docentes (rectores) de las instituciones educativas oficiales de los 26 municipios no certificados del Departamento de Caldas.

El sistema garantiza:
1. **Catálogo Oficial Inmutable**: Selección parametrizada de municipio e institución educativa con autocompletado y bloqueo del código DANE (163 IEs oficiales).
2. **Carga y Validación de los 6 Documentos Obligatorios**:
   - `PlanContingencia` (*Plan de Contingencia Adoptado*)
   - `SedesAfectadas` (*Relación de Sedes Afectadas y Estado Actual*)
   - `Estrategia` (*Estrategia de Continuidad del Servicio Educativo*)
   - `Cronograma` (*Cronograma de Implementación*)
   - `EvidenciaActividades` (*Evidencias de la Semana de Desarrollo Institucional*)
   - `Requerimientos` (*Requerimientos de Apoyo Técnico, Administrativo o Financiero*)
3. **Nomenclatura Estandarizada Automática**: `IE_[CODDANE]_[TipoDocumento]_v[XX].[ext]`
4. **Versionamiento No Destructivo**: Soporte para V01, V02... con retención histórica en Google Drive y reemplazo parcial de archivos observados.
5. **Evaluación Parametrizada por Criterios**: Módulo para coordinadores de la SED con cálculo automático de resultado global (`APROBADO` / `REQUIERE_CORRECCION`).
6. **Notificaciones Automáticas por Correo**: Confirmación de radicación con radicado único `ENV-2026-XXXXXX` y oficios de retroalimentación técnica.
7. **Dashboard Directivo y Métricas**: Indicadores de cobertura institucional, gráficos interactivos y exportación de consolidados a CSV y versión imprimible.
8. **Auditoría Transaccional**: Registro riguroso de cada operación en la hoja `AUDITORIA`.

---

## 🏗️ Arquitectura del Sistema

```text
┌──────────────────────────────────────────────┐
│           USUARIOS INSTITUCIONALES           │
│   (Rectores / Coordinadores / Directivos)    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│         FRONTEND WEB (GitHub Pages)          │
│                                              │
│ HTML5 + Vanilla CSS + JavaScript Modular     │
│ Asistente de 4 Pasos | Dashboard | Consultas │
└──────────────────────┬───────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────┐
│             GOOGLE APPS SCRIPT               │
│           (gas/Code.gs - REST API)           │
│   Auth / LockService / Validaciones / Reglas │
└─────────────┬───────────────┬────────────────┘
              │               │
              ▼               ▼
┌────────────────────┐   ┌─────────────────────┐
│   GOOGLE SHEETS    │   │    GOOGLE DRIVE     │
│ Base Transaccional │   │ Repositorio Oficial │
│ (10 Hojas de datos)│   │  Carpetas por DANE  │
└────────────────────┘   └─────────────────────┘
              │
              ▼
       ┌──────────────┐
       │  GMAIL APP   │
       │Notificaciones│
       └──────────────┘
```

---

## 📁 Estructura del Repositorio

```text
Circular 122/
│
├── index.html                   # Interfaz de usuario Single Page Application (SPA)
│
├── css/
│   └── styles.css               # Diseño institucional moderno de la SED Caldas
│
├── js/
│   ├── config.js                # Constantes, tipos de documentos y estados
│   ├── data.js                  # Catálogo de 26 municipios y 163 IEs de Caldas
│   ├── storage.js               # Motor de persistencia y simulación local
│   ├── api.js                   # Cliente HTTP unificado (GAS Web App / Local)
│   ├── auth.js                  # Gestión de roles (Rector, Coordinador, Admin, Consulta)
│   ├── documentos.js            # Validación, nomenclatura oficial y base64
│   ├── formulario.js            # Asistente de 4 pasos (Institución, Responsable, Sedes, Docs)
│   ├── consultas.js             # Búsqueda por DANE/Radicado con línea de tiempo
│   ├── evaluacion.js            # Bandeja de revisión por criterios y cálculo automático
│   ├── dashboard.js             # Gráficos Canvas, métricas KPI y exportación CSV
│   ├── admin.js                 # Editor de criterios, asignaciones y log de auditoría
│   └── app.js                   # Orquestador y sistema de notificaciones toast
│
├── assets/
│   └── logo-sedcaldas.svg       # Emblema e identidad visual de la SED Caldas
│
├── data/
│   ├── SedesCAldas.csv          # Base de datos fuente original
│   ├── instituciones.json       # JSON estructurado de las 163 instituciones
│   └── criterios_iniciales.json # Criterios oficiales parametrizados
│
└── gas/                         # Suite Backend Google Apps Script
    ├── Code.gs                  # Router de acciones API doGet / doPost
    ├── Config.gs                # Nombres de hojas, Drive root y límites
    ├── Auth.gs                  # Validación de roles y permisos
    ├── Instituciones.gs         # Consultas de catálogo
    ├── Sedes.gs                 # Gestión de sedes
    ├── Usuarios.gs              # Gestión de usuarios
    ├── Envios.gs                # Transacciones de envíos con LockService
    ├── Documentos.gs            # Versionamiento y reemplazo parcial
    ├── Drive.gs                 # Estructura jerárquica de carpetas en Drive
    ├── Evaluaciones.gs          # Calificación y cálculo automático de estado
    ├── Criterios.gs             # Gestión de criterios dinámicos
    ├── Correos.gs               # Plantillas HTML de correo con GmailApp
    ├── Auditoria.gs             # Registro de auditoría
    ├── Dashboard.gs             # Endpoints de estadísticas
    ├── Setup.gs                 # Inicializador automático de las 10 hojas
    └── appsscript.json          # Manifiesto de Apps Script
```

---

## 🚀 Despliegue y Puesta en Marcha

### 1. Ejecución Local Inmediata
La aplicación cuenta con un **motor de simulación y almacenamiento local persistente**. No requiere ningún servidor externo para pruebas completas:
1. Abra `index.html` directamente en su navegador web (o mediante Live Server).
2. Utilice el selector de perfil en el encabezado para cambiar entre **Rector**, **Coordinador**, **Administrador** y **Consulta**.
3. Realice radicaciones, evaluaciones por criterios, consultas de trazabilidad y visualización de auditoría.

### 2. Publicación en GitHub Pages
1. Suba el proyecto a un repositorio en GitHub (ej. `sed-caldas-contingencia`).
2. Vaya a **Settings > Pages**.
3. Seleccione la rama `main` y la carpeta `/ (root)`.
4. Haga clic en **Save**. Su aplicación quedará disponible en `https://<usuario>.github.io/sed-caldas-contingencia/`.

### 3. Conexión con Google Apps Script y Google Drive (Producción)
1. Cree una nueva hoja de cálculo en Google Drive denominada: `SED_Caldas_Planes_Contingencia`.
2. Vaya a **Extensiones > Apps Script**.
3. Puede optar por cualquiera de estas dos opciones:
   - **Opción A (Recomendada y más rápida):** Copie todo el contenido del archivo [`gas/CodigoCompleto.gs`](gas/CodigoCompleto.gs) en el archivo `Código.gs` del editor de Apps Script.
   - **Opción B (Modular):** Copie individualmente los archivos de la carpeta [`gas/`](gas/).
4. **Carpeta Raíz de Google Drive:**
   - La carpeta raíz oficial configurada es: `1bIV0LOJ3KeUlD5zUwwdwJGAxqDeUOiMa` (`ROOT_FOLDER_ID`).
   - También puede configurarla en Apps Script en **Configuración del proyecto > Propiedades de la secuencia de comandos (Script Properties)** con la clave `ROOT_FOLDER_ID` y valor `1bIV0LOJ3KeUlD5zUwwdwJGAxqDeUOiMa`.
5. En el menú de funciones de Apps Script, seleccione **`setupSistemaCompleto`** y haga clic en **Ejecutar** para inicializar las hojas y verificar los permisos de Google Drive.
6. Haga clic en **Implementar > Nueva implementación > Tipo: Aplicación web**.
   - **Ejecutar como:** *Yo (tu cuenta)*.
   - **Quién tiene acceso:** *Cualquier persona* (`Anyone`).
7. Copie la **URL de la aplicación web** generada (termina en `/exec`).
8. En el portal web, vaya a **Administración > Configuración > Vinculación con Google Apps Script Web App**, pegue la URL y haga clic en **Guardar Configuración**.
