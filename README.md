# Time Tracking

Aplicación de escritorio para Windows que registra y calcula el tiempo de trabajo por proyecto y por usuario. La interfaz es una web local (HTML/CSS/JavaScript) alojada dentro de una ventana WinForms mediante WebView2, y todos los datos se guardan en una base de datos SQLite que vive junto al ejecutable: **no requiere internet, servidor ni instalación**.

---

## Descripción

Time Tracking nace para sustituir las hojas de cálculo de control de horas por una herramienta de escritorio sencilla y portable. Permite dar de alta proyectos, abrirlos y anotar cada jornada con hora de inicio, hora de fin, descanso y observaciones; el programa valida los datos, calcula el tiempo invertido y ofrece totales, búsqueda y exportación en PDF. También puede importar el historial de guardados de Tekla Structures (*Save History*) para reconstruir las jornadas automáticamente.

Todo se ejecuta en local. La base de datos y las copias de seguridad se crean en la misma carpeta que `Time Tracking.exe`.

---

## Funcionalidades

### Proyectos
- Crear proyectos con nombre único (validación de duplicados).
- Editar el nombre de un proyecto desde el dashboard.
- Listado con métricas por proyecto (número de registros y tiempo total).
- Búsqueda y filtrado de proyectos.

### Registros de tiempo
- Alta de registros en una fila de captura dentro de la propia tabla.
- Edición en línea de cualquier registro (fecha, inicio, fin, descanso, observaciones).
- Eliminación de registros con confirmación.
- Cálculo automático del **tiempo invertido** a partir de inicio, fin y descanso.
- Validaciones: fecha válida, hora final posterior a la inicial, descanso coherente, sin duplicados ni solapes.
- Selección múltiple con checkbox (incluido «seleccionar todo») y total de los registros seleccionados; si no hay selección se muestra el total del proyecto.
- Búsqueda dentro de los registros del proyecto.

### Exportación e importación
- **Exportar a PDF**: genera el listado del proyecto en formato Tabloid apaisado usando el motor de impresión de WebView2.
- **Importar Tekla Save History**: lee archivos `.txt`/`.log`, agrupa las entradas por fecha y usuario, toma la primera y la última hora de cada jornada y crea los registros (descanso 0). Incluye vista previa, selección de usuarios cuando el archivo contiene varios y omisión de duplicados/solapes.

### Interfaz
- Idioma **español / inglés** con conmutador en la cabecera (persistido en `localStorage`).
- Tema **claro / oscuro** (persistido en `localStorage`).
- Diseño responsive, tipografías locales (sin CDN) y estilos propios con prefijo `tt-*`.
- Saludo personalizado y modal de configuración para establecer o cambiar el nombre de usuario.
- Formatos de la interfaz: fechas `MM/dd/yyyy`, horas de reloj en 12 h con `AM/PM`, descansos y totales como duración (`hh:mm`).

### Datos
- Base de datos SQLite local creada automáticamente en el primer arranque.
- Copia de seguridad automática al iniciar la aplicación, conservando las **6 más recientes** en la carpeta `backups/`.
- Esquema versionado y migraciones ligeras sin pérdida de datos.

---

## Requisitos

| Elemento | Requisito |
|---|---|
| Sistema operativo | Windows 10 u 11 (x64 o ARM64) |
| Runtime de .NET | **.NET 10 Desktop Runtime** (`Microsoft.WindowsDesktop.App` 10.0) |
| Runtime de WebView2 | **Microsoft Edge WebView2 Runtime** (incluido en Windows 11; instalable en Windows 10) |
| Compilación | .NET 10 SDK |
| Espacio en disco | ~90 MB descomprimido |
| Red | No necesaria en tiempo de ejecución |

> La versión publicada es *framework-dependent*: no incluye el runtime de .NET. Si el equipo no lo tiene, Windows mostrará un aviso al abrir el ejecutable con el enlace de descarga.

---

## Instalación

1. Entra en [Releases](https://github.com/eduardo-marmolejo/TimeTracking/releases/latest) y descarga `TimeTracking-1.0.0-win-x64.zip`.
2. Descomprime el ZIP en una carpeta con permisos de escritura (por ejemplo `C:\Apps\TimeTracking`). No hace falta instalador ni permisos de administrador.
3. Realiza un acceso directo en el escritorio de `Time Tracking.exe`.
4. Ejecuta el programa.
5. En el primer arranque la aplicación crea `TimeTracking.db` y la carpeta `backups/` junto al ejecutable, y pide el nombre del usuario.

Para actualizar, cierra la aplicación, sustituye los archivos por los de la nueva versión y conserva `TimeTracking.db` y `backups/`.

---

## Uso

### Flujo básico
1. **Crear un proyecto** desde el dashboard con el botón «Nuevo proyecto».
2. **Abrir el proyecto** haciendo clic en su tarjeta.
3. **Añadir un registro** en la fila de captura: fecha, hora de inicio, hora de fin, descanso y observaciones. El tiempo invertido se calcula al instante.
4. **Editar** cualquier registro con el botón de lápiz (edición en línea) o **eliminarlo** con el botón de papelera.
5. Marca registros con los checkboxes para ver el **total seleccionado**; el botón «Seleccionar todo» alterna la selección completa.
6. **Exportar a PDF** para obtener el listado imprimible del proyecto.

### Formatos de entrada
| Campo | Formato | Ejemplo |
|---|---|---|
| Fecha | `MM/dd/yyyy` | `03/15/2026` |
| Inicio / Final | Reloj 12 h | `08:30 AM`, `05:45 PM` |
| Descanso | Duración | `01:00` |
| Tiempo invertido | Calculado | `08:15` |

### Importar Tekla Save History
1. Abre el proyecto y pulsa «Importar Tekla Save History».
2. Selecciona el archivo `.txt` o `.log`.
3. Revisa la vista previa. Si hay varios usuarios, elige cuáles importar.
4. Confirma: se crean los registros y se informa de los omitidos por duplicado o solape.

### Copias de seguridad
En cada arranque se guarda una copia en `backups\TimeTracking_AAAA-MM-DD_HH-mm-ss.db`. Se conservan las 6 más recientes; las anteriores se eliminan automáticamente.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  WinForms (net10.0-windows)                                  │
│                                                              │
│  Program.cs ──► copia de seguridad ──► BaseDatos.Inicializar │
│       │                                                      │
│       └──► Form1 (WebView2)                                  │
│                │  host virtual https://app.local             │
│                ▼                                             │
│         web/ (HTML + CSS + JS vanilla)                       │
│                │  postMessage  { op, requestId, payload }    │
│                ▼                                             │
│         JsBridge (lista blanca de operaciones)               │
│                │                                             │
│                ▼                                             │
│         Datos/  RepoUsuario · RepoProyectos · RepoRegistros  │
│                │                                             │
│                ▼                                             │
│         SQLite  TimeTracking.db (junto al .exe)              │
└──────────────────────────────────────────────────────────────┘
```

### Capas
- **Presentación**: WinForms hospeda un `WebView2` que carga la web estática desde un host virtual (`app.local`). No hay servidor HTTP externo.
- **Puente**: [`WebView/JsBridge.cs`](Time%20Tacking/WebView/JsBridge.cs) recibe mensajes JSON del JavaScript, valida el origen y solo atiende operaciones de una lista blanca. Cada respuesta lleva el mismo `requestId` y un resultado `ok`/`error`.
- **Datos**: [`Datos/`](Time%20Tacking/Datos) contiene la conexión SQLite, el esquema embebido (`Esquema.sql`), los repositorios por entidad y los conversores de fecha/hora.
- **Interfaz web**: [`web/`](Time%20Tacking/web) con `index.html` (dashboard) y `registroProyecto.html` (detalle del proyecto), CSS propio en `styles.css`, lógica en `script.js` y envoltorio del puente en `bridge.js`.

### Operaciones del puente
| Operación | Uso |
|---|---|
| `user.get` / `user.set` | Nombre del usuario local |
| `projects.list` / `projects.create` / `projects.update` | Alta, listado y edición de proyectos |
| `entries.list` / `entries.create` / `entries.update` / `entries.delete` | CRUD de registros |
| `export.pdf` | Exportación a PDF (`export.excel` se mantiene como alias) |
| `import.tekla` / `import.tekla.preview` / `import.tekla.apply` | Importación de Tekla Save History, con vista previa y aplicación |

### Estructura del repositorio
```
TimeTacking.slnx               Solución .NET
Time Tacking/
├─ Program.cs                  Arranque, copias de seguridad y BD
├─ Form1.cs / Form1.Designer.cs Ventana principal y WebView2
├─ Datos/
│  ├─ BaseDatos.cs             Conexión, ruta y creación del esquema
│  ├─ Esquema.sql              Esquema embebido (Usuarios, Projects, RegistroTiempo)
│  ├─ Modelos.cs
│  ├─ RepoUsuario.cs
│  ├─ RepoProyectos.cs
│  ├─ RepoRegistros.cs
│  └─ Convertidores.cs         Fechas ISO, reloj 12 h y duraciones
├─ WebView/JsBridge.cs         Puente JS ↔ C#
├─ web/                        Interfaz (HTML, CSS, JS, fuentes, imágenes)
└─ ico/                        Iconos de la aplicación
```

---

## Datos y privacidad

- Todos los datos son locales. La aplicación no envía información a ningún servidor.
- La base de datos se guarda en `AppContext.BaseDirectory\TimeTracking.db`, junto al ejecutable.
- Las copias de seguridad se guardan en `backups\` en esa misma carpeta.
- Para trasladar la aplicación basta con copiar la carpeta completa (ejecutable, `web\`, `TimeTracking.db` y `backups\`).

---

## Autor

**Eduardo Marmolejo Ornelas** - 2026

## Licencia

Este proyecto se distribuye bajo la **licencia MIT**. Consulta el archivo [LICENSE](LICENSE) para el texto completo.

Copyright © 2026 Eduardo Marmolejo.
