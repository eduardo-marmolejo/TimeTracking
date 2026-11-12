// TimeTrack - js/bridge.js
// Puente con C#: window.tt.<grupo>.<accion>(...) devuelve una Promise.
// El JS nunca habla SQL ni conoce rutas; solo pide operaciones de la lista blanca.
(function () {
  'use strict';

  const webview = window.chrome && window.chrome.webview ? window.chrome.webview : null;
  const pendientes = new Map();
  const TIMEOUT_MS = 60000;
  let siguienteId = 1;

  function disponible() {
    return !!webview;
  }

  function crearError(mensaje) {
    const error = new Error(mensaje);
    error.esPuente = true;
    return error;
  }

  function recibir(evento) {
    let mensaje = evento.data;
    try {
      if (typeof mensaje === 'string') mensaje = JSON.parse(mensaje);
    } catch (e) {
      console.error('Respuesta del puente no válida:', e);
      return;
    }
    if (!mensaje || typeof mensaje.requestId !== 'string') return;

    const pendiente = pendientes.get(mensaje.requestId);
    if (!pendiente) return; // respuesta tardía de una petición ya vencida

    pendientes.delete(mensaje.requestId);
    clearTimeout(pendiente.temporizador);

    if (mensaje.ok) pendiente.resolve(mensaje.data);
    else pendiente.reject(crearError(mensaje.error || 'Error desconocido.'));
  }

  if (webview) webview.addEventListener('message', recibir);

  /**
   * Envía una operación al puente.
   * @param {string} op       Operación de la lista blanca (ej. 'projects.list').
   * @param {object} [payload] Datos de la operación.
   * @returns {Promise<any>}
   */
  function llamar(op, payload) {
    if (!webview) {
      return Promise.reject(crearError('El puente solo funciona dentro de la aplicación.'));
    }

    const requestId = 'r' + (siguienteId++);
    return new Promise(function (resolve, reject) {
      const temporizador = setTimeout(function () {
        pendientes.delete(requestId);
        reject(crearError('La aplicación no respondió a tiempo.'));
      }, TIMEOUT_MS);

      pendientes.set(requestId, { resolve: resolve, reject: reject, temporizador: temporizador });

      try {
        webview.postMessage({ op: op, requestId: requestId, payload: payload || {} });
      } catch (e) {
        clearTimeout(temporizador);
        pendientes.delete(requestId);
        reject(crearError('No se pudo enviar la petición: ' + e.message));
      }
    });
  }

  window.tt = {
    disponible: disponible,
    llamar: llamar,

    ping: function () {
      return llamar('ping');
    },

    usuario: {
      obtener: function () {
        return llamar('user.get');
      },
      guardar: function (nombre) {
        return llamar('user.set', { nombre: nombre });
      }
    },

    proyectos: {
      listar: function () {
        return llamar('projects.list');
      },
      crear: function (nombre) {
        return llamar('projects.create', { nombre: nombre });
      },
      editar: function (id, nombre) {
        return llamar('projects.update', { id: id, nombre: nombre });
      }
    },

    registros: {
      listar: function (idProyecto) {
        return llamar('entries.list', { idProyecto: idProyecto });
      },
      crear: function (datos) {
        return llamar('entries.create', datos);
      },
      editar: function (datos) {
        return llamar('entries.update', datos);
      },
      eliminar: function (id) {
        return llamar('entries.delete', { id: id });
      }
    },

    exportarPdf: function (idProyecto) {
      return llamar('export.pdf', { idProyecto: idProyecto });
    },

    importarTekla: function (idProyecto) {
      return llamar('import.tekla', { idProyecto: idProyecto });
    },

    importarTeklaPreview: function (idProyecto) {
      return llamar('import.tekla.preview', { idProyecto: idProyecto });
    },

    importarTeklaAplicar: function (idProyecto, rutaArchivo, usuarios) {
      return llamar('import.tekla.apply', { idProyecto: idProyecto, rutaArchivo: rutaArchivo, usuarios: usuarios || [] });
    }
  };
})();
