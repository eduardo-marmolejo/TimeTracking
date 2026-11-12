using Microsoft.Web.WebView2.Core;
using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using Time_Tacking.Datos;

namespace Time_Tacking.WebView
{
    /// <summary>
    /// Puente entre el JavaScript de la interfaz y la capa Datos.
    /// El JS solo puede pedir las operaciones de la lista blanca; nunca ve SQL ni rutas.
    /// Contrato: { op, requestId, payload } -> { requestId, ok, data | error }.
    /// </summary>
    public sealed class JsBridge
    {
        private const string HostPermitido = "app.local";

        private readonly CoreWebView2 _core;
        private readonly System.Windows.Forms.Control? _uiControl;

        private static JsBridge? _instanciaActual;

        private static JsBridge InstanciaActual => _instanciaActual ?? throw new InvalidOperationException("JsBridge no inicializado");

        public JsBridge(CoreWebView2 core, System.Windows.Forms.Control? uiControl = null)
        {
            _core = core;
            _instanciaActual = this;
            _uiControl = uiControl;
            _core.WebMessageReceived += OnWebMessageReceived;
        }

        private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            // Solo la página servida por el host virtual de la app puede usar el puente.
            if (!EsOrigenPermitido(e.Source)) return;

            string? requestId = null;
            try
            {
                string mensajePlano = e.WebMessageAsJson;
                using var doc = JsonDocument.Parse(mensajePlano);
                var raiz = doc.RootElement;

                // El JS puede mandar el objeto tal cual o como texto JSON.
                if (raiz.ValueKind == JsonValueKind.String)
                {
                    string? textoInterno = raiz.GetString();
                    if (string.IsNullOrWhiteSpace(textoInterno)) return;
                    using var doc2 = JsonDocument.Parse(textoInterno);
                    raiz = doc2.RootElement.Clone();
                    // Ahora trabajamos con un clone fuera del using
                }

                // Extraer todo con strings/copia antes de salir
                string? reqIdStr = null;
                if (raiz.ValueKind == JsonValueKind.Object && raiz.TryGetProperty("requestId", out var ridEl) && ridEl.ValueKind == JsonValueKind.String)
                    reqIdStr = ridEl.GetString();

                string opStr = string.Empty;
                if (raiz.ValueKind == JsonValueKind.Object && raiz.TryGetProperty("op", out var opEl2) && opEl2.ValueKind == JsonValueKind.String)
                    opStr = opEl2.GetString() ?? string.Empty;

                string payloadJsonStr = "null";
                if (raiz.ValueKind == JsonValueKind.Object && raiz.TryGetProperty("payload", out var pEl))
                {
                    if (pEl.ValueKind == JsonValueKind.Undefined || pEl.ValueKind == JsonValueKind.Null)
                        payloadJsonStr = "null";
                    else
                        payloadJsonStr = pEl.GetRawText();
                }

                requestId = reqIdStr;

                if (string.Equals(opStr, "export.pdf", StringComparison.OrdinalIgnoreCase) || string.Equals(opStr, "export.excel", StringComparison.OrdinalIgnoreCase))
                {
                    var reqIdCaptura = reqIdStr;
                    var payloadCapturaJson = payloadJsonStr;
                    if (_uiControl != null && _uiControl.IsHandleCreated && !_uiControl.IsDisposed)
                    {
                        _uiControl.BeginInvoke(new Action(async () =>
                        {
                            await ExportarPdfAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                        }));
                    }
                    else
                    {
                        _ = ExportarPdfAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                    }
                    return;
                }

                if (string.Equals(opStr, "import.tekla", StringComparison.OrdinalIgnoreCase))
                {
                    var reqIdCaptura = reqIdStr;
                    var payloadCapturaJson = payloadJsonStr;
                    if (_uiControl != null && _uiControl.IsHandleCreated && !_uiControl.IsDisposed)
                    {
                        _uiControl.BeginInvoke(new Action(async () =>
                        {
                            await ImportarTeklaAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                        }));
                    }
                    else
                    {
                        _ = ImportarTeklaAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                    }
                    return;
                }

                if (string.Equals(opStr, "import.tekla.preview", StringComparison.OrdinalIgnoreCase))
                {
                    var reqIdCaptura = reqIdStr;
                    var payloadCapturaJson = payloadJsonStr;
                    if (_uiControl != null && _uiControl.IsHandleCreated && !_uiControl.IsDisposed)
                    {
                        _uiControl.BeginInvoke(new Action(async () =>
                        {
                            await ImportarTeklaPreviewAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                        }));
                    }
                    else
                    {
                        _ = ImportarTeklaPreviewAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                    }
                    return;
                }

                if (string.Equals(opStr, "import.tekla.apply", StringComparison.OrdinalIgnoreCase))
                {
                    var reqIdCaptura = reqIdStr;
                    var payloadCapturaJson = payloadJsonStr;
                    if (_uiControl != null && _uiControl.IsHandleCreated && !_uiControl.IsDisposed)
                    {
                        _uiControl.BeginInvoke(new Action(async () =>
                        {
                            await ImportarTeklaApplyAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                        }));
                    }
                    else
                    {
                        _ = ImportarTeklaApplyAsyncConRespuesta(reqIdCaptura, payloadCapturaJson);
                    }
                    return;
                }

                JsonElement payloadElemFinal = default;
                if (payloadJsonStr != "null")
                {
                    using var pd3 = JsonDocument.Parse(payloadJsonStr);
                    payloadElemFinal = pd3.RootElement.Clone();
                }

                var datosFinal = Ejecutar(opStr, payloadElemFinal);
                Responder(requestId, true, datosFinal, null );
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, "Error interno: " + ex.Message);
            }
            finally
            {
                // envuelto ya no se usa
            }
        }

        private static object? Ejecutar(string op, JsonElement payload) => op switch
        {
            "ping" => new { pong = true, hora = DateTime.Now.ToString("HH:mm:ss") },

            "user.get" => new { nombre = RepoUsuario.ObtenerNombre() },
            "user.set" => GuardarNombre(payload),

            "projects.list" => ListarProyectos(),
            "projects.create" => CrearProyecto(payload),
            "projects.update" => EditarProyecto(payload),

            "entries.list" => ListarRegistros(payload),
            "entries.create" => CrearRegistro(payload),
            "entries.update" => EditarRegistro(payload),
            "entries.delete" => EliminarRegistro(payload),

            "export.pdf" => InstanciaActual.ExportarPdf(payload),
            "export.excel" => InstanciaActual.ExportarPdf(payload),

            _ => throw new DatosException($"Operación no permitida: {op}")
        };

        // ---------- Operaciones ----------

        private static object GuardarNombre(JsonElement p)
        {
            var nombre = TextoRequerido(p, "nombre");
            RepoUsuario.GuardarNombre(nombre);
            return new { nombre = nombre.Trim() };
        }

        private static object ListarProyectos()
        {
            return RepoProyectos.ListarConTotales()
                .Select(p => new
                {
                    id = p.Id,
                    nombre = p.Nombre,
                    creado = FechaDeCreacion(p.CreadoEn),
                    totalMinutos = p.TotalMinutos,
                    totalTexto = HorasYMinutos(p.TotalMinutos)
                })
                .ToList();
        }

        private static object CrearProyecto(JsonElement p)
        {
            var nombre = TextoRequerido(p, "nombre");
            var id = RepoProyectos.Crear(nombre);
            return new { id, nombre = nombre.Trim() };
        }

        private static object EditarProyecto(JsonElement p)
        {
            var id = EnteroRequerido(p, "id");
            var nombre = TextoRequerido(p, "nombre");
            RepoProyectos.Editar(id, nombre);
            return new { id, nombre = nombre.Trim() };
        }

        private static object ListarRegistros(JsonElement p)
        {
            var idProyecto = EnteroRequerido(p, "idProyecto");
            return RepoRegistros.Listar(idProyecto)
                .Select(r => new
                {
                    id = r.Id,
                    idProyecto = r.IdProyecto,
                    fecha = Convertidores.IsoAFecha(r.Fecha),
                    inicio = Convertidores.MinutosAReloj(r.Inicio),
                    final = Convertidores.MinutosAReloj(r.Final),
                    descanso = Convertidores.MinutosADuracion(r.Descanso),
                    totalMinutos = r.TotalMinutos,
                    totalTexto = Convertidores.MinutosADuracion(r.TotalMinutos) + " h",
                    observaciones = r.Observaciones
                })
                .ToList();
        }

        private static object CrearRegistro(JsonElement p)
        {
            var idProyecto = EnteroRequerido(p, "idProyecto");
            var fecha = Convertidores.FechaAIso(TextoRequerido(p, "fecha"));
            var inicio = Convertidores.RelojAMinutos(TextoRequerido(p, "inicio"));
            var final = Convertidores.RelojAMinutos(TextoRequerido(p, "final"));
            var descanso = MinutosOpcionales(p, "descanso");
            var observaciones = TextoOpcional(p, "observaciones");

            var id = RepoRegistros.Agregar(idProyecto, fecha, inicio, final, descanso, observaciones);
            return new { id, totalMinutos = final - inicio - descanso };
        }

        private static object EditarRegistro(JsonElement p)
        {
            var id = EnteroRequerido(p, "id");
            var fecha = Convertidores.FechaAIso(TextoRequerido(p, "fecha"));
            var inicio = Convertidores.RelojAMinutos(TextoRequerido(p, "inicio"));
            var final = Convertidores.RelojAMinutos(TextoRequerido(p, "final"));
            var descanso = MinutosOpcionales(p, "descanso");
            var observaciones = TextoOpcional(p, "observaciones");

            RepoRegistros.Editar(id, fecha, inicio, final, descanso, observaciones);
            return new { id, totalMinutos = final - inicio - descanso };
        }

        private static object EliminarRegistro(JsonElement p)
        {
            var id = EnteroRequerido(p, "id");
            RepoRegistros.Eliminar(id);
            return new { id };
        }

        private async Task ExportarPdfAsyncConRespuesta(string? requestId, string payloadJson)
        {
            JsonElement p = default;
            if (!string.IsNullOrWhiteSpace(payloadJson) && payloadJson != "null")
            {
                using var pd = JsonDocument.Parse(payloadJson);
                p = pd.RootElement.Clone();
            }
            try
            {
                var datosPdf = await ExportarPdfAsync(p);
                Responder(requestId, true, datosPdf, null );
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
        }

        private async Task ExportarPdfAsyncConRespuesta(string? requestId, JsonElement p)
        {
            try
            {
                var datosPdf = await ExportarPdfAsync(p);
                Responder(requestId, true, datosPdf, null );
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
        }

        private async Task<object> ExportarPdfAsync(JsonElement p)
        {
            var idProyecto = EnteroRequerido(p, "idProyecto");

            var proyectos = RepoProyectos.ListarConTotales();
            var proyecto = proyectos.FirstOrDefault(pr => pr.Id == idProyecto);
            var nombreProyecto = proyecto?.Nombre ?? $"Proyecto_{idProyecto}";

            string nombreLimpio = string.Concat(nombreProyecto.Where(ch => !Path.GetInvalidFileNameChars().Contains(ch))).Trim();
            if (string.IsNullOrWhiteSpace(nombreLimpio)) nombreLimpio = $"Proyecto_{idProyecto}";
            string nombreSugerido = $"TimeSheet - {nombreLimpio} - {DateTime.Now:yyyy-MM-dd}.pdf";

            string? ruta = null;
            try
            {
                Form? formActivo = Application.OpenForms.Count > 0 ? Application.OpenForms[0] : null;
                if (formActivo != null && formActivo.InvokeRequired)
                {
                    formActivo.Invoke(new Action(() =>
                    {
                        using var dlg = new SaveFileDialog
                        {
                            Filter = "Archivos PDF (*.pdf)|*.pdf",
                            FileName = nombreSugerido,
                            Title = "Guardar exportación PDF"
                        };
                        if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                        {
                            ruta = dlg.FileName;
                        }
                    }));
                }
                else
                {
                    using var dlg = new SaveFileDialog
                    {
                        Filter = "Archivos PDF (*.pdf)|*.pdf",
                        FileName = nombreSugerido,
                        Title = "Guardar exportación PDF"
                    };
                    if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                    {
                        ruta = dlg.FileName;
                    }
                }
            }
            catch
            {
                var escritorio = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                ruta = Path.Combine(escritorio, nombreSugerido);
            }

            if (string.IsNullOrWhiteSpace(ruta))
            {
                throw new DatosException("Exportación cancelada.");
            }

            try
            {
                string json = "{\"landscape\":true,\"printBackground\":true,\"preferCSSPageSize\":false,\"scale\":0.95,\"paperWidth\":11,\"paperHeight\":17,\"marginTop\":0.25,\"marginBottom\":0.25,\"marginLeft\":0.25,\"marginRight\":0.25}";
                string resultado = await _core.CallDevToolsProtocolMethodAsync("Page.printToPDF", json);
                using var docPdf = JsonDocument.Parse(resultado);
                if (docPdf.RootElement.TryGetProperty("data", out var dataEl))
                {
                    string b64 = dataEl.GetString() ?? string.Empty;
                    if (!string.IsNullOrEmpty(b64))
                    {
                        byte[] bytes = Convert.FromBase64String(b64);
                        File.WriteAllBytes(ruta, bytes);
                        return new { path = ruta };
                    }
                }
            }
            catch { }

            var settings = _core.Environment.CreatePrintSettings();
            settings.Orientation = CoreWebView2PrintOrientation.Landscape;
            settings.ShouldPrintBackgrounds = true;
            settings.ShouldPrintHeaderAndFooter = false;

            var stream = await _core.PrintToPdfStreamAsync(settings);

            using (var fs = File.Create(ruta))
            {
                await stream.CopyToAsync(fs);
            }
            stream.Dispose();

            return new { path = ruta };
        }

        private object ExportarPdf(JsonElement p)
        {
            return ExportarPdfAsync(p).GetAwaiter().GetResult();
        }

        private object IniciarImportarTekla(string? requestId, string? payloadJson)
        {
            _ = ImportarTeklaAsyncConRespuesta(requestId, payloadJson);
            return new { enProceso = true };
        }

        private async Task ImportarTeklaAsyncConRespuesta(string? requestId, string? payloadJson)
        {
            JsonElement p = default;
            if (!string.IsNullOrWhiteSpace(payloadJson) && payloadJson != "null")
            {
                try
                {
                    using var pd = JsonDocument.Parse(payloadJson);
                    p = pd.RootElement.Clone();
                }
                catch { }
            }

            try
            {
                var datos = await ImportarTeklaAsync(p);
                Responder(requestId, true, datos, null);
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
        }

        private async Task ImportarTeklaPreviewAsyncConRespuesta(string? requestId, string? payloadJson)
        {
            try
            {
                var rutaArchivo = SeleccionarArchivoTekla();
                if (string.IsNullOrWhiteSpace(rutaArchivo) || !File.Exists(rutaArchivo))
                    throw new DatosException("No se seleccionó ningún archivo.");

                var datos = await Task.Run(() => GenerarPreviewTekla(rutaArchivo));
                Responder(requestId, true, datos, null);
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
        }

        private async Task ImportarTeklaApplyAsyncConRespuesta(string? requestId, string? payloadJson)
        {
            JsonElement p = default;
            if (!string.IsNullOrWhiteSpace(payloadJson) && payloadJson != "null")
            {
                try
                {
                    using var pd = JsonDocument.Parse(payloadJson);
                    p = pd.RootElement.Clone();
                }
                catch { }
            }

            try
            {
                var idProyecto = EnteroRequerido(p, "idProyecto");
                var rutaArchivo = TextoRequerido(p, "rutaArchivo");
                var usuarios = ExtraerListaStrings(p, "usuarios");
                if (string.IsNullOrWhiteSpace(rutaArchivo) || !File.Exists(rutaArchivo))
                    throw new DatosException("No se encontró el archivo seleccionado.");

                var datos = await Task.Run(() => AplicarImportacionTekla(idProyecto, rutaArchivo, usuarios));
                Responder(requestId, true, datos, null);
            }
            catch (DatosException ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
            catch (Exception ex)
            {
                Responder(requestId, false, null, ex.Message);
            }
        }

        private static List<string> ExtraerListaStrings(JsonElement p, string campo)
        {
            var lista = new List<string>();
            if (p.ValueKind != JsonValueKind.Object || !p.TryGetProperty(campo, out var v)) return lista;
            if (v.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in v.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String)
                    {
                        var s = item.GetString();
                        if (!string.IsNullOrWhiteSpace(s)) lista.Add(s);
                    }
                }
            }
            else if (v.ValueKind == JsonValueKind.String)
            {
                var s = v.GetString();
                if (!string.IsNullOrWhiteSpace(s)) lista.Add(s);
            }
            return lista;
        }

        private async Task<object> ImportarTeklaAsync(JsonElement p)
        {
            var idProyecto = EnteroRequerido(p, "idProyecto");

            string? rutaArchivo = null;
            try
            {
                Form? formActivo = Application.OpenForms.Count > 0 ? Application.OpenForms[0] : null;
                if (formActivo != null && formActivo.InvokeRequired)
                {
                    formActivo.Invoke(new Action(() =>
                    {
                        using var dlg = new OpenFileDialog
                        {
                            Filter = "Archivos de texto (*.txt;*.log)|*.txt;*.log|Todos los archivos (*.*)|*.*",
                            Title = "Seleccionar save_history.log",
                            Multiselect = false
                        };
                        if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                        {
                            rutaArchivo = dlg.FileName;
                        }
                    }));
                }
                else
                {
                    using var dlg = new OpenFileDialog
                    {
                        Filter = "Archivos de texto (*.txt;*.log)|*.txt;*.log|Todos los archivos (*.*)|*.*",
                        Title = "Seleccionar save_history.log",
                        Multiselect = false
                    };
                    if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                    {
                        rutaArchivo = dlg.FileName;
                    }
                }
            }
            catch
            {
                // Si falla el diálogo, no hacer nada
            }

            if (string.IsNullOrWhiteSpace(rutaArchivo) || !File.Exists(rutaArchivo))
            {
                throw new DatosException("No se seleccionó ningún archivo.");
            }

            return await Task.Run(() => ImportarTeklaAutoAplicar(idProyecto, rutaArchivo));
        }

        private string? SeleccionarArchivoTekla()
        {
            string? rutaArchivo = null;
            try
            {
                Form? formActivo = Application.OpenForms.Count > 0 ? Application.OpenForms[0] : null;
                if (formActivo != null && formActivo.InvokeRequired)
                {
                    formActivo.Invoke(new Action(() =>
                    {
                        using var dlg = new OpenFileDialog
                        {
                            Filter = "Archivos de texto (*.txt;*.log)|*.txt;*.log|Todos los archivos (*.*)|*.*",
                            Title = "Seleccionar save_history.log",
                            Multiselect = false
                        };
                        if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                        {
                            rutaArchivo = dlg.FileName;
                        }
                    }));
                }
                else
                {
                    using var dlg = new OpenFileDialog
                    {
                        Filter = "Archivos de texto (*.txt;*.log)|*.txt;*.log|Todos los archivos (*.*)|*.*",
                        Title = "Seleccionar save_history.log",
                        Multiselect = false
                    };
                    if (dlg.ShowDialog(formActivo) == DialogResult.OK)
                    {
                        rutaArchivo = dlg.FileName;
                    }
                }
            }
            catch { }
            return rutaArchivo;
        }

        private static List<(string fechaIso, int minutos, DateTime fechaHora, string usuario)> ParsearTeklaConUsuarios(string rutaArchivo)
        {
            var entradas = new List<(string fechaIso, int minutos, DateTime fechaHora, string usuario)>();
            string[] lineas = File.ReadAllLines(rutaArchivo);
            var regexSave = new Regex(@"\*\*\*\s+(?:Save|Autosave)\s+(\d{2}/\d{2}/\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})(am|pm)", RegexOptions.IgnoreCase);
            var regexUser = new Regex(@"\*\*\*\s+User:\s*(.+)", RegexOptions.IgnoreCase);

            (string fechaIso, int minutos, DateTime fechaHora)? pendiente = null;

            for (int i = 0; i < lineas.Length; i++)
            {
                string linea = lineas[i] ?? string.Empty;
                var mSave = regexSave.Match(linea);
                if (mSave.Success)
                {
                    if (pendiente.HasValue)
                    {
                        entradas.Add((pendiente.Value.fechaIso, pendiente.Value.minutos, pendiente.Value.fechaHora, string.Empty));
                        pendiente = null;
                    }

                    string fechaStr = mSave.Groups[1].Value;
                    int hora = int.Parse(mSave.Groups[2].Value);
                    int minuto = int.Parse(mSave.Groups[3].Value);
                    int segundo = int.Parse(mSave.Groups[4].Value);
                    string ampm = mSave.Groups[5].Value.ToLower();

                    if (ampm == "pm" && hora < 12) hora += 12;
                    if (ampm == "am" && hora == 12) hora = 0;

                    if (!DateTime.TryParseExact(fechaStr, "MM/dd/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
                        continue;

                    int minutosDesdeMedianoche = hora * 60 + minuto;
                    string claveFecha = fecha.ToString("yyyy-MM-dd");
                    pendiente = (claveFecha, minutosDesdeMedianoche, new DateTime(fecha.Year, fecha.Month, fecha.Day, hora, minuto, segundo));
                    continue;
                }

                if (pendiente.HasValue)
                {
                    var mUser = regexUser.Match(linea);
                    if (mUser.Success)
                    {
                        string usuario = (mUser.Groups[1].Value ?? string.Empty).Trim();
                        entradas.Add((pendiente.Value.fechaIso, pendiente.Value.minutos, pendiente.Value.fechaHora, usuario));
                        pendiente = null;
                        continue;
                    }

                    // Si aparece otro bloque Save/Autosave (ya manejado arriba) o se acaba contexto, se resolverá
                }
            }

            if (pendiente.HasValue)
            {
                entradas.Add((pendiente.Value.fechaIso, pendiente.Value.minutos, pendiente.Value.fechaHora, string.Empty));
            }

            return entradas;
        }

        private static string RemarkParaTekla(string fechaIso, string? usuario)
        {
            if (string.IsNullOrWhiteSpace(usuario)) return "-";
            if (!DateTime.TryParseExact(fechaIso, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
                return "-";
            string dia = fecha.ToString("dddd", CultureInfo.InvariantCulture).ToUpperInvariant();
            string usr = usuario.Trim().ToUpperInvariant();
            return $"{dia} / {usr}";
        }

        private object ImportarTeklaAutoAplicar(long idProyecto, string rutaArchivo)
        {
            var preview = GenerarPreviewTekla(rutaArchivo);
            var usuarios = ((IEnumerable<object>)preview.GetType().GetProperty("usuarios")!.GetValue(preview)!)
                .Select(u => (string)u.GetType().GetProperty("nombre")!.GetValue(u)!)
                .ToList();
            List<string> seleccion;
            if (usuarios.Count <= 1)
                seleccion = usuarios;
            else
                seleccion = usuarios; // fallback: si se llama por flujo antiguo, importar todos
            return AplicarImportacionTekla(idProyecto, rutaArchivo, seleccion);
        }

        private static object GenerarPreviewTekla(string rutaArchivo)
        {
            var entradas = ParsearTeklaConUsuarios(rutaArchivo);
            if (entradas.Count == 0)
                throw new DatosException("No se encontraron registros válidos en el archivo.");

            var grupos = entradas
                .GroupBy(e => string.IsNullOrWhiteSpace(e.usuario) ? "" : e.usuario.Trim())
                .Select(g => new
                {
                    nombre = g.Key,
                    fechasCount = g.Select(x => x.fechaIso).Distinct().Count(),
                    entradasCount = g.Count()
                })
                .OrderBy(x => x.nombre)
                .ToList();

            var usuarios = grupos.Where(g => !string.IsNullOrWhiteSpace(g.nombre)).Select(g => (object)new { nombre = g.nombre, fechasCount = g.fechasCount, entradasCount = g.entradasCount }).ToList();
            // si hay entradas sin usuario, las incluimos como item especial? Para selección usamos solo usuarios con nombre; sin usuario se maneja en apply si corresponde
            bool tieneSinUsuario = grupos.Any(g => string.IsNullOrWhiteSpace(g.nombre));

            return new
            {
                rutaArchivo = rutaArchivo,
                usuarios = usuarios,
                tieneSinUsuario = tieneSinUsuario,
                totalFechas = entradas.Select(e => e.fechaIso).Distinct().Count(),
                totalEntradas = entradas.Count,
                tieneMultiplesUsuarios = usuarios.Count > 1
            };
        }

        private object AplicarImportacionTekla(long idProyecto, string rutaArchivo, List<string> usuariosSeleccionados)
        {
            var entradas = ParsearTeklaConUsuarios(rutaArchivo);
            if (entradas.Count == 0)
                throw new DatosException("No se encontraron registros válidos en el archivo.");

            bool incluirTodos = usuariosSeleccionados == null || usuariosSeleccionados.Count == 0 || usuariosSeleccionados.Any(u => string.Equals(u, "__ALL__", StringComparison.OrdinalIgnoreCase));
            var setUsuarios = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (!incluirTodos && usuariosSeleccionados != null)
            {
                foreach (var u in usuariosSeleccionados)
                    if (!string.IsNullOrWhiteSpace(u)) setUsuarios.Add(u.Trim());
            }

            // Filtrar entradas
            var filtradas = entradas.Where(e =>
            {
                bool sinUsuario = string.IsNullOrWhiteSpace(e.usuario);
                if (incluirTodos) return true;
                if (sinUsuario) return setUsuarios.Contains("") || setUsuarios.Contains("__NONE__");
                return setUsuarios.Contains(e.usuario.Trim());
            }).ToList();

            // Si no se especificó nada y hay usuarios, por defecto incluir todos con nombre? mejor incluir todos
            if (filtradas.Count == 0 && incluirTodos == false && usuariosSeleccionados != null && usuariosSeleccionados.Count == 0)
            {
                filtradas = entradas;
                incluirTodos = true;
            }
            if (filtradas.Count == 0 && incluirTodos)
                filtradas = entradas;

            if (filtradas.Count == 0)
                throw new DatosException("No se seleccionaron usuarios para importar.");

            var grupos = filtradas
                .GroupBy(e => new { e.fechaIso, Usuario = (e.usuario ?? string.Empty).Trim() })
                .ToList();

            bool modoMultiUsuario = grupos
                .Select(g => g.Key.Usuario)
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count() > 1;

            int creados = 0;
            int omitidos = 0;

            List<Datos.Registro> existentesCache = new List<Datos.Registro>();
            try { existentesCache = RepoRegistros.Listar(idProyecto); } catch { }

            foreach (var g in grupos)
            {
                var lista = g.ToList();
                if (lista.Count == 0) continue;
                var primero = lista.OrderBy(x => x.fechaHora).First();
                var ultimo = lista.OrderBy(x => x.fechaHora).Last();
                int inicioMin = primero.minutos;
                int finalMin = ultimo.minutos;
                if (finalMin <= inicioMin) { omitidos++; continue; }

                string fechaIso = g.Key.fechaIso;
                string usuario = g.Key.Usuario;
                string remarks = RemarkParaTekla(fechaIso, usuario);

                try
                {
                    bool exacto = existentesCache.Any(r => r.Fecha == fechaIso && r.Inicio == inicioMin && r.Final == finalMin);
                    if (exacto) { omitidos++; continue; }

                    // Multiusuario (por ahora): permitir solapes entre usuarios/registros importados aunque coincidan en fecha.
                    if (!modoMultiUsuario)
                    {
                        bool solapaExistente = existentesCache.Any(r => r.Fecha == fechaIso && inicioMin < r.Final && finalMin > r.Inicio);
                        if (solapaExistente) { omitidos++; continue; }
                    }
                }
                catch { }

                try
                {
                    RepoRegistros.Agregar(idProyecto, fechaIso, inicioMin, finalMin, 0, remarks);
                    try { existentesCache = RepoRegistros.Listar(idProyecto); } catch { }
                    creados++;
                }
                catch (DatosException) { omitidos++; }
                catch { omitidos++; }
            }

            return new { creados = creados, omitidos = omitidos, totalFechas = grupos.Select(g => g.Key.fechaIso).Distinct().Count() };
        }

        // ---------- Respuesta ----------

        private void Responder(string? requestId, bool ok, object? data, string? error)
        {
            var json = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["requestId"] = requestId,
                ["ok"] = ok,
                ["data"] = data,
                ["error"] = error
            });
            _core.PostWebMessageAsJson(json);
        }

        // ---------- Utilidades ----------

        private static bool EsOrigenPermitido(string? source)
        {
            return Uri.TryCreate(source, UriKind.Absolute, out var uri)
                && uri.Scheme == Uri.UriSchemeHttps
                && string.Equals(uri.Host, HostPermitido, StringComparison.OrdinalIgnoreCase);
        }

        private static string? TextoOpcional(JsonElement p, string campo)
        {
            if (p.ValueKind != JsonValueKind.Object || !p.TryGetProperty(campo, out var v)) return null;
            return v.ValueKind == JsonValueKind.String ? v.GetString() : null;
        }

        private static string TextoRequerido(JsonElement p, string campo)
        {
            var valor = TextoOpcional(p, campo);
            if (string.IsNullOrWhiteSpace(valor))
                throw new DatosException($"Falta el campo '{campo}'.");
            return valor;
        }

        private static long EnteroRequerido(JsonElement p, string campo)
        {
            if (p.ValueKind != JsonValueKind.Object ||
                !p.TryGetProperty(campo, out var v) ||
                !v.TryGetInt64(out var numero))
                throw new DatosException($"Falta el campo '{campo}'.");
            return numero;
        }

        /// <summary>Minutos a partir de una duración "HH:MM"; si no viene el campo, 0.</summary>
        private static int MinutosOpcionales(JsonElement p, string campo)
        {
            var texto = TextoOpcional(p, campo);
            return string.IsNullOrWhiteSpace(texto) ? 0 : Convertidores.DuracionAMinutos(texto);
        }

        /// <summary>"125h 30m" para las tarjetas del dashboard.</summary>
        private static string HorasYMinutos(long minutos)
        {
            if (minutos < 0) minutos = 0;
            return $"{minutos / 60}h {minutos % 60:00}m";
        }

        /// <summary>CreateAt viene como "YYYY-MM-DD HH:MM:SS"; la tarjeta muestra MM/dd/yyyy.</summary>
        private static string FechaDeCreacion(string createAt)
        {
            if (createAt.Length >= 10 &&
                DateTime.TryParseExact(createAt[..10], "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
                return d.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
            return createAt;
        }
    }
}
