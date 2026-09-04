# SKILL: Construcción del Sistema de Gestión y Seguimiento de Planes de Contingencia – SED Caldas

## 1. Propósito del skill

Este skill define las instrucciones para diseñar, construir, configurar, probar y mantener una aplicación web institucional para la Secretaría de Educación de Caldas (SED Caldas), destinada a la gestión de información y documentación relacionada con los planes de contingencia de las sedes educativas.

La aplicación permitirá que los rectores o responsables autorizados:

1. Registren información institucional.
2. Seleccionen municipio e institución educativa.
3. Identifiquen las sedes afectadas.
4. Carguen documentos.
5. Completen o reemplacen información previamente enviada.
6. Consulten el estado de sus envíos.
7. Reciban confirmaciones por correo electrónico.

Los coordinadores autorizados podrán:

1. Consultar la información recibida.
2. Filtrar por municipio e institución educativa.
3. Revisar los documentos.
4. Evaluar el cumplimiento de criterios.
5. Registrar observaciones.
6. Aprobar o solicitar correcciones.
7. Generar automáticamente comunicaciones a las instituciones.

---

# 2. Principio fundamental de arquitectura

La solución debe separar claramente:

### Frontend

Interfaz utilizada por los usuarios.

### Backend

Lógica de negocio y seguridad.

### Base transaccional

Información estructurada del proceso.

### Repositorio documental

Archivos cargados por las instituciones.

### Servicio de notificaciones

Correos electrónicos.

La arquitectura será:

```text
┌──────────────────────────────────────────────┐
│                 USUARIOS                     │
│                                              │
│ Rectores / Coordinadores / Administradores  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              GITHUB PAGES                    │
│                                              │
│ HTML + CSS + JavaScript                      │
│ Interfaz institucional                       │
└──────────────────────┬───────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────┐
│          GOOGLE APPS SCRIPT                  │
│                                              │
│ API / Backend / Seguridad / Lógica           │
└─────────────┬───────────────┬────────────────┘
              │               │
              ▼               ▼
┌────────────────────┐   ┌─────────────────────┐
│ GOOGLE SHEETS      │   │ GOOGLE DRIVE        │
│                    │   │                     │
│ Base transaccional │   │ Repositorio         │
│ Catálogos          │   │ documental          │
│ Usuarios           │   │                     │
│ Envíos             │   │ PDFs/DOCX/XLSX/etc. │
│ Evaluaciones       │   │                     │
│ Auditoría          │   │                     │
└────────────────────┘   └─────────────────────┘
              │
              ▼
       ┌──────────────┐
       │    GMAIL     │
       │ Notificaciones│
       └──────────────┘
```

---

# 3. Regla de separación de responsabilidades

El sistema debe aplicar obligatoriamente esta regla:

> **Google Sheets administra los datos estructurados, estados, versiones, usuarios, evaluaciones y auditoría. Google Drive almacena exclusivamente los documentos y evidencias.**

No utilizar Google Drive como base de datos.

No utilizar nombres de archivos como mecanismo de control del estado del proceso.

No utilizar GitHub para almacenar documentos institucionales cargados por las IE.

GitHub debe contener exclusivamente el código fuente y documentación técnica del proyecto.

---

# 4. Tecnologías

Utilizar:

## Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap o CSS institucional propio
* GitHub Pages

## Backend

* Google Apps Script
* Web App
* Google Sheets API mediante Apps Script
* Google DriveApp
* GmailApp
* LockService
* Utilities

## Almacenamiento

* Google Sheets para datos estructurados.
* Google Drive para documentos.

## Control de código

* GitHub.
* Git.
* GitHub Pages.

---

# 5. Catálogo institucional

Utilizar como fuente inicial el archivo:

`SedesCAldas.csv`

El catálogo debe convertirse en la hoja:

`INSTITUCIONES`

Campos mínimos:

```text
municipio
codigo_establecimiento
nombre_establecimiento
```

El código del establecimiento debe utilizarse como identificador institucional.

El usuario no debe digitar manualmente el nombre de la institución.

El sistema debe realizar:

```text
Municipio seleccionado
        ↓
Filtro de instituciones
        ↓
Instituciones correspondientes
```

Esto evita errores de digitación.

---

# 6. Catálogo de sedes

Crear una estructura independiente para las sedes.

Hoja:

`SEDES`

Campos:

```text
id_sede
municipio
codigo_establecimiento
codigo_sede
nombre_sede
estado
```

La estructura debe permitir posteriormente incorporar el catálogo oficial de sedes cuando se disponga de los códigos y nombres correspondientes.

La aplicación no debe asumir que el código del establecimiento es igual al código de la sede.

---

# 7. Base de datos transaccional

Crear Google Sheet:

`SED_Caldas_Planes_Contingencia`

Este archivo será la fuente de verdad del proceso administrativo.

## Hojas

```text
INSTITUCIONES
SEDES
USUARIOS
ENVIOS
DOCUMENTOS
EVALUACIONES
CRITERIOS_EVALUACION
ASIGNACIONES
AUDITORIA
CONFIGURACION
```

---

# 8. Hoja USUARIOS

Campos:

```text
id_usuario
nombre
cargo
correo
telefono
municipio
codigo_establecimiento
rol
estado
fecha_registro
fecha_actualizacion
```

Roles:

```text
RECTOR
COORDINADOR
ADMINISTRADOR
CONSULTA
```

El rol debe determinar los permisos.

---

# 9. Hoja ENVIOS

Representa cada operación de envío realizada por una institución.

Campos:

```text
id_envio
fecha_envio
hora_envio
municipio
codigo_establecimiento
nombre_establecimiento
id_usuario
correo_usuario
version
estado
fecha_ultima_actualizacion
observaciones_generales
```

Estados:

```text
BORRADOR
ENVIADO
EN_REVISION
REQUIERE_CORRECCION
APROBADO
```

---

# 10. Hoja DOCUMENTOS

Cada documento debe tener un registro independiente.

Campos:

```text
id_documento
id_envio
municipio
codigo_establecimiento
tipo_documento
nombre_original
nombre_sistema
id_drive
url_drive
version
fecha_carga
usuario_carga
estado_revision
observaciones
```

Tipos:

```text
PlanContingencia
SedesAfectadas
Estrategia
Cronograma
EvidenciaActividades
Requerimientos
```

---

# 11. Documentos requeridos

La aplicación debe permitir cargar:

### 1. Plan de contingencia

Código:

`PlanContingencia`

### 2. Relación de sedes afectadas y estado actual

Código:

`SedesAfectadas`

### 3. Estrategia para garantizar la prestación del servicio educativo

Código:

`Estrategia`

### 4. Cronograma de implementación

Código:

`Cronograma`

### 5. Evidencias de las actividades desarrolladas

Código:

`EvidenciaActividades`

### 6. Requerimientos de apoyo

Código:

`Requerimientos`

---

# 12. Nomenclatura de documentos

El nombre lógico debe ser:

```text
IE_CODDANE_Nombredocumento
```

Ejemplo:

```text
IE_117013000123_PlanContingencia.pdf
IE_117013000123_SedesAfectadas.pdf
IE_117013000123_Estrategia.pdf
IE_117013000123_Cronograma.pdf
IE_117013000123_EvidenciaActividades.pdf
IE_117013000123_Requerimientos.pdf
```

Cuando exista una nueva versión:

```text
IE_117013000123_PlanContingencia_v02.pdf
```

La extensión original debe conservarse.

---

# 13. Organización de Google Drive

Crear una carpeta raíz:

```text
SED CALDAS - PLANES DE CONTINGENCIA
```

Estructura:

```text
SED CALDAS - PLANES DE CONTINGENCIA
│
├── AGUADAS
│   │
│   ├── IE_117013000123
│   │   ├── v01
│   │   └── v02
│   │
│   └── IE_117013000456
│
├── ANSERMA
│   └── ...
│
├── ARANZAZU
│   └── ...
│
└── ...
```

Dentro de cada institución:

```text
IE_CODDANE
│
├── v01
│   ├── IE_CODDANE_PlanContingencia.pdf
│   ├── IE_CODDANE_SedesAfectadas.pdf
│   ├── IE_CODDANE_Estrategia.pdf
│   ├── IE_CODDANE_Cronograma.pdf
│   ├── IE_CODDANE_EvidenciaActividades.pdf
│   └── IE_CODDANE_Requerimientos.pdf
│
└── v02
    └── ...
```

La versión debe corresponder con la versión registrada en `ENVIOS`.

---

# 14. Regla crítica de almacenamiento

No sobrescribir físicamente un documento aprobado o previamente evaluado.

Cuando se reemplace información:

```text
Versión 1
    ↓
Observaciones
    ↓
Versión 2
```

La versión 1 debe permanecer disponible para auditoría.

La versión 2 será la versión activa.

---

# 15. Reemplazo parcial

La aplicación debe permitir reemplazar solamente los documentos que requieran modificación.

Ejemplo:

```text
PlanContingencia       → conserva V1
SedesAfectadas         → conserva V1
Estrategia             → V2
Cronograma             → conserva V1
EvidenciaActividades   → V2
Requerimientos         → conserva V1
```

El sistema debe registrar qué documentos fueron actualizados.

---

# 16. Flujo institucional

```text
RECTOR
  │
  ▼
Selecciona municipio
  │
  ▼
Selecciona institución
  │
  ▼
Selecciona sedes
  │
  ▼
Registra responsable
  │
  ▼
Carga documentos
  │
  ▼
Validación
  │
  ▼
Confirmación
  │
  ▼
ENVÍO
  │
  ▼
EN REVISIÓN
```

---

# 17. Flujo de revisión

```text
EN REVISIÓN
       │
       ▼
COORDINADOR
       │
       ▼
Revisión de documentos
       │
       ▼
¿Cumple?
   ┌───┴────┐
   │        │
  SI       NO
   │        │
   ▼        ▼
APROBADO  REQUIERE
          CORRECCIÓN
              │
              ▼
       Correo a institución
              │
              ▼
       Nueva versión
              │
              ▼
          REVISIÓN
```

---

# 18. Módulo de evaluación

Crear pantalla:

```text
REVISIÓN DE PLAN DE CONTINGENCIA

Municipio:       [Todos ▼]

Institución:     [Todas ▼]

Estado:          [Todos ▼]

[ BUSCAR ]
```

Cada resultado debe mostrar:

```text
Municipio
Institución
Código DANE
Versión
Fecha
Estado
Coordinador
[REVISAR]
```

---

# 19. Evaluación por documento

Cada documento debe presentar:

```text
Documento:
PlanContingencia

Versión:
02

[ ABRIR DOCUMENTO ]

Resultado:

○ CUMPLE
○ NO CUMPLE

Observaciones:

[_____________________________________]

[ GUARDAR EVALUACIÓN ]
```

---

# 20. Criterios parametrizados

Los criterios no deben estar codificados directamente en JavaScript.

Utilizar:

`CRITERIOS_EVALUACION`

Campos:

```text
id_criterio
tipo_documento
criterio
descripcion
obligatorio
activo
```

Ejemplo:

```text
PlanContingencia
"El documento presenta el plan adoptado para la sede."
SI
```

Esto permitirá modificar los criterios sin modificar el software.

---

# 21. Resultado global

El backend debe calcular automáticamente el estado.

Regla:

```text
Todos los documentos obligatorios cumplen
             ↓
          APROBADO
```

Si al menos un documento obligatorio no cumple:

```text
      REQUIERE_CORRECCION
```

No permitir que el frontend determine unilateralmente el resultado final.

El cálculo debe realizarse en Apps Script.

---

# 22. Correcciones

Cuando exista incumplimiento, el sistema debe identificar:

```text
Documento
Criterio incumplido
Observación
Coordinador
Fecha
```

Ejemplo:

```text
ESTRATEGIA
No cumple

Observación:
Debe especificar las acciones para garantizar
la continuidad del servicio educativo.

EVIDENCIAS
No cumple

Observación:
Las evidencias deben permitir verificar las
actividades efectivamente desarrolladas.
```

---

# 23. Correo de confirmación

Después de un envío exitoso:

```text
Para: correo registrado

Asunto:
Confirmación de recepción – Plan de contingencia – [IE]
```

Incluir:

* Institución.
* Municipio.
* Código DANE.
* Responsable.
* Fecha.
* Hora.
* Versión.
* Documentos recibidos.
* Estado.
* Número de envío.

---

# 24. Correo de observaciones

Cuando el resultado sea:

`REQUIERE_CORRECCION`

enviar automáticamente un correo.

Debe incluir:

* Institución.
* Municipio.
* Código DANE.
* Versión evaluada.
* Documentos observados.
* Criterios incumplidos.
* Observaciones del coordinador.
* Instrucción para realizar nuevamente el envío.

---

# 25. Múltiples coordinadores

La aplicación debe soportar varios coordinadores.

No codificar coordinadores directamente.

Utilizar:

`USUARIOS`

y:

`ASIGNACIONES`

Ejemplo:

```text
Municipio       Coordinador
Aguadas         Coordinador 01
Anserma         Coordinador 02
Aranzazu        Coordinador 01
```

También permitir que un coordinador pueda tener acceso a varios municipios.

---

# 26. Seguridad y autorización

La autenticación debe realizarse preferiblemente mediante cuentas institucionales Google.

El backend debe validar:

```text
usuario
rol
institución
permisos
estado
```

Nunca confiar únicamente en los datos enviados desde JavaScript.

El frontend puede ocultar opciones, pero **la autorización real debe ejecutarse en Apps Script**.

---

# 27. Protección de credenciales

Nunca almacenar en GitHub:

```text
API Keys
Tokens
Contraseñas
Credenciales
IDs sensibles
Claves privadas
```

Los identificadores y configuraciones sensibles deben permanecer en:

`Config.gs`

o en propiedades del proyecto de Apps Script:

`PropertiesService`

---

# 28. Control de concurrencia

Utilizar:

`LockService`

en operaciones críticas:

* Crear envío.
* Crear versión.
* Crear carpeta.
* Registrar evaluación.
* Actualizar estado.
* Reemplazar documentos.

Esto evita inconsistencias cuando dos usuarios realizan operaciones simultáneas.

---

# 29. Auditoría

Registrar en:

`AUDITORIA`

como mínimo:

```text
id_auditoria
fecha_hora
usuario
rol
accion
municipio
codigo_establecimiento
id_envio
id_documento
version
resultado
observacion
```

Acciones:

```text
LOGIN
CREAR_ENVIO
CARGAR_DOCUMENTO
ACTUALIZAR_DOCUMENTO
CREAR_VERSION
ENVIAR
INICIAR_REVISION
EVALUAR_DOCUMENTO
SOLICITAR_CORRECCION
APROBAR
ENVIAR_CORREO
```

---

# 30. Dashboard

Crear módulo para funcionarios autorizados.

Indicadores:

```text
Instituciones
Enviadas
En revisión
Aprobadas
Requieren corrección
Pendientes
```

Filtros:

```text
Municipio
Institución
Estado
Fecha
Coordinador
Versión
```

Visualizaciones:

* Instituciones por municipio.
* Estado de los planes.
* Porcentaje aprobado.
* Porcentaje con correcciones.
* Documentos pendientes.
* Documentos observados.
* Evolución temporal de envíos.

---

# 31. Diseño institucional

La aplicación debe tomar como referencia visual:

`sedcaldas.edu.co`

Antes de desarrollar el CSS, analizar:

* Logo.
* Colores.
* Tipografía.
* Encabezado.
* Menú.
* Botones.
* Tarjetas.
* Formularios.
* Pie de página.

La aplicación debe tener identidad institucional consistente, pero no copiar código fuente del sitio.

---

# 32. Estructura del frontend

```text
sed-caldas-contingencia/
│
├── index.html
│
├── css/
│   └── styles.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── instituciones.js
│   ├── formulario.js
│   ├── documentos.js
│   ├── consultas.js
│   ├── evaluacion.js
│   └── dashboard.js
│
├── assets/
│   ├── logo.png
│   └── favicon.ico
│
├── data/
│   └── sedes.csv
│
└── README.md
```

---

# 33. Estructura de Apps Script

```text
SED_Caldas_Contingencia/
│
├── Code.gs
├── Config.gs
├── Auth.gs
├── Instituciones.gs
├── Sedes.gs
├── Usuarios.gs
├── Envios.gs
├── Documentos.gs
├── Drive.gs
├── Evaluaciones.gs
├── Criterios.gs
├── Correos.gs
├── Auditoria.gs
├── Dashboard.gs
└── Utils.gs
```

---

# 34. API

La aplicación debe comunicarse con Apps Script mediante una API controlada.

Operaciones:

```text
obtenerMunicipios
obtenerInstituciones
obtenerSedes
obtenerUsuario
crearEnvio
guardarBorrador
cargarDocumento
crearVersion
obtenerEnvio
obtenerDocumentos
obtenerEnvios
evaluarDocumento
finalizarEvaluacion
obtenerDashboard
```

El frontend nunca debe acceder directamente a Google Drive o Google Sheets.

---

# 35. Configuración

Utilizar:

`Config.gs`

para parámetros no sensibles:

```javascript
const CONFIG = {
  VERSION: "1.0.0",
  MAX_FILE_SIZE_MB: 10,
  ROOT_FOLDER_NAME: "SED CALDAS - PLANES DE CONTINGENCIA",
  EMAIL_FROM_NAME: "SED Caldas"
};
```

Los IDs de recursos deben almacenarse preferiblemente mediante:

```text
PropertiesService
```

y no quedar expuestos en el frontend.

---

# 36. Validación de archivos

Permitir inicialmente:

```text
PDF
DOCX
XLSX
JPG
JPEG
PNG
```

Validar:

* Extensión.
* MIME type.
* Tamaño.
* Documento requerido.
* Integridad básica.
* Usuario autorizado.

El límite de tamaño debe ser configurable.

---

# 37. Formulario

Dividir en cuatro etapas:

### Paso 1

Identificación institucional.

### Paso 2

Responsable.

### Paso 3

Sedes afectadas.

### Paso 4

Documentos.

Finalmente:

```text
[ GUARDAR BORRADOR ]

[ REVISAR INFORMACIÓN ]

[ ENVIAR ]
```

---

# 38. Guardar borrador

El usuario debe poder abandonar el proceso sin perder la información.

Estado:

`BORRADOR`

Al regresar:

```text
Continuar envío
```

El sistema debe recuperar:

* Institución.
* Responsable.
* Sedes.
* Documentos cargados.
* Información diligenciada.

---

# 39. Confirmación antes del envío

Antes de enviar definitivamente:

```text
RESUMEN DEL ENVÍO

Institución:
Código:

Responsable:
Cargo:
Correo:
Teléfono:

Sedes:
[lista]

Documentos:
✓ Plan de contingencia
✓ Sedes afectadas
✓ Estrategia
✓ Cronograma
✓ Evidencias
✓ Requerimientos

[ VOLVER ]

[ CONFIRMAR ENVÍO ]
```

---

# 40. Resultado del envío

Después del envío:

```text
✓ INFORMACIÓN ENVIADA CORRECTAMENTE

Institución:
IE XXXXX

Versión:
01

Número de envío:
ENV-2026-000001

Se ha enviado una confirmación al correo registrado.

Estado:
EN REVISIÓN
```

---

# 41. Control de versiones

Cada envío debe generar un número de versión institucional.

Ejemplo:

```text
V01
V02
V03
```

El sistema debe mantener:

```text
versión
fecha
usuario
documentos
evaluaciones
observaciones
estado
```

La versión activa será la última enviada que se encuentre en proceso.

---

# 42. No eliminación física

Por defecto:

> Los documentos enviados no deben eliminarse físicamente.

Si una nueva versión sustituye una anterior, la anterior pasa a estado:

`HISTORICA`

y permanece disponible para auditoría.

---

# 43. Arquitectura de seguridad

Debe existir separación entre:

```text
Repositorio documental
        ≠
Base de datos
        ≠
Código fuente
```

Por tanto:

```text
GitHub
→ código

Google Sheets
→ información estructurada

Google Drive
→ documentos

Apps Script
→ lógica y autorización
```

---

# 44. Recuperación ante errores

Si la carga del documento falla:

```text
NO registrar el documento como cargado
```

Si Drive guarda el documento pero falla el registro en Sheets:

```text
registrar operación pendiente
```

o ejecutar una operación compensatoria.

No permitir estados inconsistentes como:

```text
Sheets = cargado
Drive = inexistente
```

---

# 45. Idempotencia

Las operaciones críticas deben evitar duplicados.

Si un usuario presiona dos veces:

`ENVIAR`

no deben crearse dos envíos idénticos.

Generar un identificador único:

```text
id_envio
```

y verificarlo antes de completar la operación.

---

# 46. GitHub

Repositorio:

```text
sed-caldas-contingencia
```

Ramas:

```text
main
develop
feature/*
```

`main` debe contener únicamente versiones probadas.

GitHub Pages debe publicar el frontend.

---

# 47. Separación entre desarrollo y producción

Crear como mínimo:

```text
DESARROLLO
PRODUCCIÓN
```

No utilizar el mismo Google Sheet y carpeta Drive durante las pruebas y la operación real.

Ejemplo:

```text
SED_CONTINGENCIA_DEV
SED_CONTINGENCIA_PROD
```

Esto evita contaminar los datos institucionales reales durante el desarrollo.

---

# 48. Fases de construcción

## FASE 1 — MVP

Construir:

1. Frontend.
2. Catálogo institucional.
3. Selección municipio.
4. Selección institución.
5. Registro responsable.
6. Carga documental.
7. Google Drive.
8. Google Sheets.
9. Confirmación por correo.

## FASE 2 — Versionamiento

Implementar:

1. Borradores.
2. Versiones.
3. Reemplazo parcial.
4. Historial.
5. Auditoría.

## FASE 3 — Evaluación

Implementar:

1. Usuarios coordinadores.
2. Criterios.
3. Evaluación.
4. Observaciones.
5. Aprobación.
6. Solicitud de corrección.
7. Notificación.

## FASE 4 — Dashboard

Implementar:

1. Indicadores.
2. Filtros.
3. Gráficos.
4. Reportes.
5. Exportaciones.

---

# 49. Pruebas

Antes de producción realizar pruebas de:

### Funcionales

* Registro.
* Carga.
* Reemplazo.
* Evaluación.
* Corrección.
* Aprobación.

### Seguridad

* Usuario no autorizado.
* Rector intentando acceder a otra IE.
* Rector intentando evaluar.
* Coordinador intentando modificar documentos.
* Acceso directo a endpoints.

### Concurrencia

* Dos envíos simultáneos.
* Dos cargas simultáneas.
* Dos evaluaciones simultáneas.

### Integridad

Verificar que:

```text
Envío ↔ Documento ↔ Drive ↔ Evaluación
```

mantengan relaciones correctas.

---

# 50. Criterios de aceptación

La solución será aceptada cuando:

### Instituciones

* Municipio se seleccione desde catálogo.
* Institución se filtre por municipio.
* No se permita institución inexistente.

### Documentos

* Se puedan cargar los seis documentos.
* Se almacenen correctamente en Drive.
* Se utilice la nomenclatura definida.
* Se mantengan las versiones.
* Se permita reemplazo parcial.

### Información

* Responsable registrado.
* Cargo registrado.
* Correo registrado.
* Teléfono registrado.

### Notificaciones

* Confirmación automática.
* Observaciones automáticas.
* Comunicación de aprobación.

### Evaluación

* Coordinadores autorizados.
* Criterios parametrizados.
* Evaluación por documento.
* Observaciones.
* Resultado global.

### Seguridad

* Autorización en backend.
* Credenciales fuera de GitHub.
* Auditoría.
* Control de concurrencia.

---

# 51. Principios de desarrollo

El agente que implemente este skill debe:

1. No inventar información institucional.
2. No modificar códigos DANE.
3. No asumir que establecimiento y sede son la misma entidad.
4. No almacenar documentos institucionales en GitHub.
5. No exponer credenciales.
6. No utilizar Drive como base de datos.
7. Mantener trazabilidad de versiones.
8. Validar permisos en backend.
9. Parametrizar criterios de evaluación.
10. Diseñar el sistema para futuras ampliaciones.
11. Mantener separación entre desarrollo y producción.
12. Priorizar integridad, trazabilidad y seguridad de la información.

---

# 52. Resultado final esperado

Construir una aplicación web:

**“Sistema de Gestión y Seguimiento de Planes de Contingencia – SED Caldas”**

que permita:

```text
RECTOR
   │
   ├── Seleccionar institución
   ├── Registrar responsable
   ├── Seleccionar sedes
   ├── Cargar documentos
   ├── Actualizar información
   └── Consultar estado
             │
             ▼
        APPS SCRIPT
             │
       ┌─────┴─────┐
       ▼           ▼
    SHEETS       DRIVE
       │           │
       └─────┬─────┘
             ▼
       COORDINADOR
             │
       ┌─────┴─────┐
       ▼           ▼
   APROBADO   CORRECCIÓN
                   │
                   ▼
              CORREO IE
                   │
                   ▼
              NUEVA VERSIÓN
```

La solución debe quedar preparada para evolucionar posteriormente hacia otros procesos de recolección, seguimiento y evaluación documental de la Secretaría de Educación de Caldas.
