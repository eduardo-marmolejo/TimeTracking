# Changelog

Todos los cambios relevantes de Time Tracking. El formato sigue las ideas de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-11

Primera versión pública. Recoge la evolución completa del proyecto: migración de la maqueta web a una aplicación de escritorio con persistencia real, internacionalización, temas, exportación e importación de datos.

### Añadido

**Aplicación y arquitectura**
- Aplicación WinForms sobre .NET 10 (`net10.0-windows`) que hospeda la interfaz en WebView2 mediante un host virtual interno (`app.local`), sin servidor HTTP externo.
- Base de datos SQLite local creada automáticamente en el primer arranque, junto al ejecutable (`AppContext.BaseDirectory`).
- Esquema embebido (`Esquema.sql`) con las tablas `Usuarios`, `Projects` y `RegistroTiempo`; inicialización idempotente y migraciones ligeras sin pérdida de datos.
- Puente JavaScript ↔ C# (`JsBridge`) con contrato `{ op, requestId, payload }`, validación de origen, lista blanca de operaciones, respuesta `ok`/`error` y tiempo máximo de espera de 60 s.
- Copia de seguridad automática en cada arranque, en `backups\`, conservando las **6 más recientes**.
- Distribución portable: ejecutable, carpeta `web\`, base de datos y copias en una sola carpeta; no requiere instalación ni permisos de administrador.

**Proyectos**
- Alta de proyectos con validación de nombre obligatorio y único.
- Edición del nombre desde el dashboard (botón de lápiz, modal con validación y control de duplicados).
- Tarjetas de proyecto con métricas de registros y tiempo total.
- Búsqueda y filtrado de proyectos en el dashboard.

**Registros de tiempo**
- Fila de captura integrada en la tabla para añadir registros sin salir de la vista.
- Cálculo automático del tiempo invertido a partir de hora de inicio, hora de fin y descanso.
- Edición en línea de fecha, inicio, fin, descanso y observaciones.
- Eliminación de registros con confirmación.
- Validaciones de fecha, coherencia horaria, descanso, duplicados y solapes.
- Selección múltiple con checkbox por fila y «seleccionar todo»; el total muestra la suma de los seleccionados o el total del proyecto si no hay selección.
- Búsqueda de registros dentro del proyecto.
- Conservación de la selección y alineación de columnas durante la edición en línea.

**Exportación e importación**
- Exportación a **PDF** en formato Tabloid apaisado mediante el motor de impresión de WebView2 (`Page.printToPDF` con respaldo `PrintToPdfStreamAsync`).
- Importación de **Tekla Save History** (`.txt`/`.log`): agrupación por fecha y usuario, primera y última hora de cada jornada, truncado de segundos a minutos, descanso 0 y observación «Importado desde Tekla Save History».
- Vista previa de la importación antes de aplicar cambios.
- Selección de usuarios cuando el archivo de Tekla contiene varios.
- Omisión automática de registros duplicados o solapados durante la importación.

**Interfaz**
- Internacionalización **español/inglés** con diccionario en JavaScript, atributos `data-i18n` y persistencia en `localStorage` (`tt-lang`).
- Tema **claro/oscuro** con variables CSS y persistencia en `localStorage` (`tt-theme`).
- Modal de configuración para establecer o cambiar el nombre del usuario, con saludo personalizado.
- Diseño responsive y tipografías locales (Inter y JetBrains Mono), sin dependencias de CDN.
- Iconos de aplicación incluidos en el ejecutable.
- Formatos de la interfaz: fechas `MM/dd/yyyy`, horas de reloj en 12 h con `AM/PM` y duraciones en `hh:mm`.
- Estilo de tabla unificado: encabezado verde (`#3DBF91`) con texto blanco, filas alternas (zebra) y fila de captura sólida (`#88DC65`) con hover propio en ambos temas.
- Botones «Exportar a PDF» e «Importar Tekla Save History» con el estilo primario (`tt-btn tt-btn-primary`), legibles en tema claro y oscuro.
- Tooltip de «Seleccionar todo» traducido en ambos idiomas.

### Cambiado
- Migración de la maqueta original con Tailwind (CDN y configuración en línea) a **CSS puro** con clases prefijo `tt-*`.
- Unificación del JavaScript de las páginas en un único `web/js/script.js`, con los bloques por página y los manejadores `submit` trasladados desde atributos en línea.
- Sustitución de la exportación a Excel por exportación a **PDF**.
- Formato de fecha de la interfaz cambiado de `dd/MM/yyyy` a `MM/dd/yyyy`; la base de datos sigue guardando ISO `YYYY-MM-DD`.
- Separación entre horas de reloj y duraciones: inicio/fin se muestran en 12 h con `AM/PM`; descanso y totales se muestran como duración, sin `AM/PM`.
- Retención de copias de seguridad ampliada de 3 a **6** archivos.
- Fila activa de edición y botones del dashboard adaptados a las variables del tema en lugar de colores fijos.
- Estilos de botones, tarjetas, métricas, iconos y tabla ajustados para funcionar con los dos temas.

### Corregido
- Textos del modal de nuevo proyecto y de las validaciones principales pasados al sistema de traducciones (antes estaban fijos en español).
- Recorte del menú de configuración por `z-index` y desbordamiento.
- Desalineación de columnas al entrar en edición en línea (se conserva el checkbox y se reserva la celda de acciones).
- Aviso y control de duplicados al renombrar proyectos.
- Importación de Tekla con múltiples usuarios y con jornadas sin hora final válida (se omiten de forma controlada).
- Contraste y hover de la fila de captura y de las filas alternas en ambos temas.

### Historial de hitos de desarrollo
- **Análisis y plan**: inventario del proyecto, diagnóstico de la integración C# ↔ web ↔ SQLite, diseño del esquema y del puente, matriz de pruebas y plan por fases.
- **Fase 1 — Separación web**: migración de Tailwind a CSS puro, conversión del HTML a clases `tt-*`, unificación del JavaScript y auditoría del resultado.
- **Fase 2 — Internacionalización**: diccionario ES/EN, selector de idioma, atributos de traducción y persistencia.
- **Fase 3 — Tema claro/oscuro**: variables CSS, lógica de tema y adaptación de componentes.
- **Fase 4 — Pulido**: botones, tarjetas, métricas, fila activa y textos complementarios.
- **Integración funcional**: SQLite, puente JS-C#, CRUD de usuarios/proyectos/registros, exportación PDF e importación de Tekla.
- **2026-11-11 — 1.0.0**: formato de fecha `MM/dd/yyyy`, reloj de 12 h, estilo definitivo de tabla, retención de 6 copias y primera publicación en GitHub con binarios de release.
