// TimeTrack - js/script.js
// JS unificado de las 3 paginas. Cada IIFE fue extraida VERBATIM del HTML original
// (sin renombrar, limpiar ni modificar nada, incluidos los strings con clases Tailwind).
// Cada IIFE es autoejecutable y actua solo si sus IDs existen en la pagina actual.

// ===== index.html =====
    (function initDashboard() {
      const modal = document.getElementById('new-project-modal');
      const openBtn = document.getElementById('open-new-project-btn');
      const closeBtn = document.getElementById('close-modal-btn');
      const cancelBtn = document.getElementById('btn-cancel-modal');
      const heroClock = document.getElementById('hero-live-clock');

      function openModal() {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeModal() {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        const form = document.getElementById('create-project-form');
        if (form) form.reset();
      }

      if (openBtn) openBtn.addEventListener('click', openModal);
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

      // Close modal on click outside
      if (modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === modal) closeModal();
        });
      }

      // Esc cierra el modal (solo si esta abierto)
      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
      });

      // Guardar proyecto
      const createForm = document.getElementById('create-project-form');
      const projectNameInput = document.getElementById('project-name');
      const projectHelp = document.getElementById('project-help');
      const submitProjectBtn = document.getElementById('btn-submit-project');
      const btnOriginalText = submitProjectBtn ? submitProjectBtn.textContent : 'Crear proyecto';

      function setProjectError(msg) {
        if (projectHelp) {
          if (msg) {
            projectHelp.textContent = msg;
            projectHelp.style.color = 'var(--color-danger-text)';
          } else {
            try { projectHelp.textContent = (typeof t === 'function') ? t('modal_project_help') : 'Elige un nombre claro y descriptivo.'; } catch (e) { projectHelp.textContent = 'Elige un nombre claro y descriptivo.'; }
            projectHelp.style.color = '';
          }
        }
      }

      if (createForm) {
        createForm.addEventListener('submit', function(e) {
          e.preventDefault();

          if (!window.tt || !tt.disponible()) {
            setProjectError('Abre esta pantalla desde la aplicación para crear proyectos.');
            return;
          }

          if (!projectNameInput) return;
          const nombre = (projectNameInput.value || '').trim();
          if (nombre.length === 0) {
            try { setProjectError((typeof t === 'function') ? t('project_name_empty') : 'El nombre del proyecto no puede estar vacío.'); } catch (e) { setProjectError('El nombre del proyecto no puede estar vacío.'); }
            projectNameInput.focus();
            return;
          }

          setProjectError('');
          if (submitProjectBtn) {
            submitProjectBtn.disabled = true;
            submitProjectBtn.textContent = 'Creando...';
          }

          tt.proyectos.crear(nombre)
            .then(function (res) {
              if (!res || !res.id) throw new Error('Respuesta inválida del servidor.');
              closeModal();
              window.location.href = 'registroProyecto.html?project=' + encodeURIComponent(res.id);
            })
            .catch(function (err) {
              setProjectError(err && err.message ? err.message : 'No se pudo crear el proyecto.');
            })
            .finally(function () {
              if (submitProjectBtn) {
                submitProjectBtn.disabled = false;
                submitProjectBtn.textContent = btnOriginalText;
              }
            });
        });
      }

      if (modal) {
        modal.addEventListener('click', function() {
          setProjectError('');
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          setProjectError('');
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          setProjectError('');
        });
      }
      if (openBtn) {
        openBtn.addEventListener('click', function() {
          setProjectError('');
          if (projectNameInput) {
            projectNameInput.value = '';
            setTimeout(function() { projectNameInput.focus(); }, 50);
          }
        });
      }

      // Live Timer increment simulation
      let totalSeconds = 5085; // 01:24:45
      setInterval(function() {
        totalSeconds++;
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        if (heroClock) {
          heroClock.textContent = `${hours}:${minutes}:${seconds}`;
        }
      }, 1000);
    })();

// ===== registroProyecto.html =====
    (function initTimeCalculations() {
      const startInput = document.getElementById('newRowStart');
      const finishInput = document.getElementById('newRowFinish');
      const offInput = document.getElementById('newRowOff');
      const calculatedDisplay = document.getElementById('calculatedLiveTime');
      const addRecordBtn = document.getElementById('addRecordBtn');
      const editingRow = document.getElementById('activeEditingRow');

      function parseMinutes(timeStr) {
        if (!timeStr) return 0;
        var t = String(timeStr).trim();
        var m = t.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
        if (m) {
          var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
          var ap = m[3].toUpperCase();
          if (isNaN(h) || isNaN(min)) return 0;
          if (ap === 'AM') h = (h === 12) ? 0 : h;
          else h = (h === 12) ? 12 : h + 12;
          return h * 60 + min;
        }
        if (!t.includes(':')) return 0;
        var p = t.split(':');
        var hh = parseInt(p[0], 10), mm = parseInt(p[1], 10);
        return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
      }

      function formatHoursMinutes(totalMinutes) {
        if (totalMinutes < 0) totalMinutes = 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} h`;
      }

      function updateCalculatedTime() {
        if (!startInput || !finishInput || !offInput || !calculatedDisplay) return;
        const startMin = parseMinutes(startInput.value);
        const finishMin = parseMinutes(finishInput.value);
        const offMin = parseMinutes(offInput.value);
        
        let netMinutes = finishMin - startMin - offMin;
        if (netMinutes < 0) netMinutes = 0;
        calculatedDisplay.textContent = formatHoursMinutes(netMinutes);
      }

      [startInput, finishInput, offInput].forEach(input => {
        if (input) {
          input.addEventListener('input', updateCalculatedTime);
        }
      });

      if (addRecordBtn && editingRow) {
        addRecordBtn.addEventListener('click', () => {
          editingRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const remarks = document.getElementById('newRowRemarks');
          if (remarks) {
            remarks.focus();
            remarks.select();
          }
        });
      }

      const exportBtn = document.getElementById('exportPdfBtn') || document.getElementById('exportPdfBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
          if (!window.tt || !tt.disponible || !tt.disponible()) {
            alert('La exportación solo funciona dentro de la aplicación.');
            return;
          }
          const proyectoId = typeof id !== 'undefined' ? id : Number(new URLSearchParams(window.location.search).get('project'));
          if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
            alert('No se pudo identificar el proyecto.');
            return;
          }
          const originalHtml = exportBtn.innerHTML;
          const originalDisabled = exportBtn.disabled;
          exportBtn.disabled = true;
          try { exportBtn.innerHTML = (typeof t === 'function') ? t('export_pdf') + '...' : 'Exportando...'; } catch (e) { exportBtn.innerHTML = 'Exportando...'; }
          try {
            if (typeof tt.exportarPdf === 'function') {
              const res = await tt.exportarPdf(proyectoId);
              try { exportBtn.innerHTML = (typeof t === 'function') ? t('export_downloaded') : 'Descargado'; } catch (e) { exportBtn.innerHTML = 'Descargado'; }
              setTimeout(() => {
                exportBtn.innerHTML = originalHtml;
                exportBtn.disabled = originalDisabled;
              }, 1500);
              if (res && res.path) {
                console.log('PDF exportado:', res.path);
              }
            } else if (typeof tt.exportarExcel === 'function') {
              const res = await tt.exportarExcel(proyectoId);
              try { exportBtn.innerHTML = (typeof t === 'function') ? t('export_downloaded') : 'Descargado'; } catch (e) { exportBtn.innerHTML = 'Descargado'; }
              setTimeout(() => {
                exportBtn.innerHTML = originalHtml;
                exportBtn.disabled = originalDisabled;
              }, 1500);
              if (res && res.path) {
                console.log('Pdf exportado:', res.path);
              }
            } else {
              throw new Error('Método de exportación no disponible');
            }
          } catch (err) {
            alert(err && err.message ? err.message : String(err));
            exportBtn.innerHTML = originalHtml;
            exportBtn.disabled = originalDisabled;
          }
        });
      }

      const importTeklaBtn = document.getElementById('importTeklaBtn');
      if (importTeklaBtn) {
        const teklaModal = document.getElementById('tekla-users-modal');
        const teklaList = document.getElementById('tekla-users-list');
        const teklaClose = document.getElementById('tekla-users-close');
        const teklaCancel = document.getElementById('tekla-users-cancel');
        const teklaConfirm = document.getElementById('tekla-users-confirm');
        let teklaPreviewData = null;

        function cerrarTeklaModal() {
          if (teklaModal) teklaModal.style.display = 'none';
          teklaPreviewData = null;
        }

        function abrirTeklaModal(preview) {
          teklaPreviewData = preview;
          if (!teklaModal || !teklaList) return;
          teklaList.innerHTML = '';
          const usuarios = Array.isArray(preview.usuarios) ? preview.usuarios : [];
          if (usuarios.length === 0) {
            const p = document.createElement('p');
            p.textContent = (typeof t === 'function') ? t('tekla_modal_no_users') : 'No se detectaron usuarios.';
            p.style.margin = '8px';
            teklaList.appendChild(p);
          } else {
            const allWrap = document.createElement('label');
            allWrap.style.display = 'flex';
            allWrap.style.alignItems = 'center';
            allWrap.style.gap = '8px';
            allWrap.style.padding = '6px 4px';
            allWrap.style.borderBottom = '1px solid var(--border-color, #eee)';
            allWrap.style.fontWeight = '600';
            const allCb = document.createElement('input');
            allCb.type = 'checkbox';
            allCb.id = 'tekla-user-all';
            allCb.checked = true;
            const allText = document.createElement('span');
            allText.textContent = (typeof t === 'function') ? t('tekla_modal_all_users') : 'Todos';
            allWrap.appendChild(allCb);
            allWrap.appendChild(allText);
            teklaList.appendChild(allWrap);

            usuarios.forEach(function (u, idx) {
              const wrap = document.createElement('label');
              wrap.style.display = 'flex';
              wrap.style.alignItems = 'center';
              wrap.style.gap = '8px';
              wrap.style.padding = '6px 4px';
              const cb = document.createElement('input');
              cb.type = 'checkbox';
              cb.className = 'tekla-user-cb';
              cb.value = u.nombre || '';
              cb.checked = true;
              cb.setAttribute('data-idx', String(idx));
              const txt = document.createElement('span');
              txt.textContent = u.nombre || '';
              wrap.appendChild(cb);
              wrap.appendChild(txt);
              teklaList.appendChild(wrap);
            });

            allCb.addEventListener('change', function () {
              const checks = teklaList.querySelectorAll('.tekla-user-cb');
              checks.forEach(function (c) { c.checked = allCb.checked; });
            });
            teklaList.addEventListener('change', function (e) {
              if (e.target && e.target.classList && e.target.classList.contains('tekla-user-cb')) {
                const checks = Array.from(teklaList.querySelectorAll('.tekla-user-cb'));
                const allChecked = checks.length > 0 && checks.every(function (c) { return c.checked; });
                const anyChecked = checks.some(function (c) { return c.checked; });
                allCb.checked = allChecked;
                allCb.indeterminate = anyChecked && !allChecked;
              }
            });
          }
          teklaModal.style.display = 'flex';
        }

        async function aplicarTeklaSeleccion(usuarios) {
          if (!teklaPreviewData || !teklaPreviewData.rutaArchivo) throw new Error('No hay datos de vista previa.');
          const proyectoId = typeof id !== 'undefined' ? id : Number(new URLSearchParams(window.location.search).get('project'));
          return await tt.importarTeklaAplicar(proyectoId, teklaPreviewData.rutaArchivo, usuarios);
        }

        if (teklaClose) teklaClose.addEventListener('click', cerrarTeklaModal);
        if (teklaCancel) teklaCancel.addEventListener('click', cerrarTeklaModal);
        if (teklaModal) teklaModal.addEventListener('click', function (e) { if (e.target === teklaModal) cerrarTeklaModal(); });
        if (teklaConfirm) {
          teklaConfirm.addEventListener('click', async function () {
            if (!teklaPreviewData) return;
            const proyectoId = typeof id !== 'undefined' ? id : Number(new URLSearchParams(window.location.search).get('project'));
            const allCb = document.getElementById('tekla-user-all');
            const checks = teklaList ? Array.from(teklaList.querySelectorAll('.tekla-user-cb')) : [];
            let usuarios = [];
            if (allCb && allCb.checked && !allCb.indeterminate) {
              usuarios = ['__ALL__'];
            } else {
              usuarios = checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
            }
            if (usuarios.length === 0) {
              alert((typeof t === 'function') ? t('tekla_modal_desc') : 'Selecciona al menos un usuario.');
              return;
            }
            teklaConfirm.disabled = true;
            try { teklaConfirm.textContent = (typeof t === 'function') ? t('importing_tekla') : 'Importando...'; } catch (e) {}
            try {
              const res = await tt.importarTeklaAplicar(proyectoId, teklaPreviewData.rutaArchivo, usuarios);
              cerrarTeklaModal();
              if (res && typeof res.creados === 'number') {
                alert('Importación completada. Registros creados: ' + res.creados + '. Omitidos: ' + (res.omitidos || 0) + '.');
              } else {
                alert('Importación completada.');
              }
              if (typeof recargar === 'function') await recargar(); else location.reload();
            } catch (err) {
              alert(err && err.message ? err.message : String(err));
            } finally {
              teklaConfirm.disabled = false;
              try { teklaConfirm.textContent = (typeof t === 'function') ? t('tekla_modal_import') : 'Importar'; } catch (e) { teklaConfirm.textContent = 'Importar'; }
            }
          });
        }

        importTeklaBtn.addEventListener('click', async () => {
          if (!window.tt || !tt.disponible || !tt.disponible()) {
            alert('La importación solo funciona dentro de la aplicación.');
            return;
          }
          const proyectoId = typeof id !== 'undefined' ? id : Number(new URLSearchParams(window.location.search).get('project'));
          if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
            alert('No se pudo identificar el proyecto.');
            return;
          }
          if (typeof tt.importarTeklaPreview !== 'function' || typeof tt.importarTeklaAplicar !== 'function') {
            alert('Método de importación no disponible.');
            return;
          }
          const originalHtml = importTeklaBtn.innerHTML;
          const originalDisabled = importTeklaBtn.disabled;
          importTeklaBtn.disabled = true;
          try { importTeklaBtn.textContent = (typeof t === 'function') ? t('importing_tekla') : 'Importando...'; } catch (e) { importTeklaBtn.textContent = 'Importando...'; }
          try {
            const preview = await tt.importarTeklaPreview(proyectoId);
            const usuarios = Array.isArray(preview && preview.usuarios) ? preview.usuarios : [];
            if (usuarios.length <= 1) {
              // auto aplicar (incluye caso sin usuarios con nombre? preview incluye solo usuarios con nombre)
              const seleccion = usuarios.length === 1 ? [usuarios[0].nombre] : ['__ALL__'];
              const res = await tt.importarTeklaAplicar(proyectoId, preview.rutaArchivo, seleccion);
              if (res && typeof res.creados === 'number') {
                alert('Importación completada. Registros creados: ' + res.creados + '. Omitidos: ' + (res.omitidos || 0) + '.');
              } else {
                alert('Importación completada.');
              }
              if (typeof recargar === 'function') await recargar(); else location.reload();
            } else {
              abrirTeklaModal(preview);
            }
          } catch (err) {
            alert(err && err.message ? err.message : String(err));
          } finally {
            importTeklaBtn.disabled = originalDisabled;
            importTeklaBtn.innerHTML = originalHtml;
          }
        });
      }
    })();

// ===== i18n =====
    const I18N = {
      es: {
        title_dashboard: 'Time Tracking - Dashboard',
        title_project: 'Time Tracking - Detalles del Proyecto',
        nav_dashboard: 'Dashboard',
        greeting_morning: '¡Buenos días',
        greeting_afternoon: '¡Buenas tardes',
        greeting_night: '¡Buenas noches',
        btn_new_project: 'Nuevo proyecto',
        section_my_projects: 'Mis proyectos',
        filter_placeholder: 'Filtrar proyectos...',
        modal_create_title: 'Crear nuevo proyecto',
        modal_project_name: 'Nombre del proyecto',
        modal_required: 'Obligatorio',
        modal_project_help: 'Elige un nombre claro y descriptivo.',
        modal_cancel: 'Cancelar',
        modal_create: 'Crear proyecto',
        back_to_dashboard: '← Volver al dashboard',
        breadcrumb_dashboard: 'Dashboard',
        project_loading: 'Cargando…',
        project_not_found: 'Proyecto no encontrado',
        total_time_invested: 'Tiempo total invertido',
        export_pdf: 'Exportar a PDF',
        export_downloaded: 'Descargado',
        add_record: '+ Añadir registro',
        import_tekla_history: 'Importar Tekla Save History',
        importing_tekla: 'Importando...',
        tekla_modal_title: 'Seleccionar usuarios a importar',
        tekla_modal_desc: 'Se detectaron varios usuarios en el archivo. Selecciona cuáles quieres importar.',
        tekla_modal_import: 'Importar',
        tekla_modal_all_users: 'Todos',
        tekla_modal_no_users: 'No se detectaron usuarios con nombre en el archivo.',
        tekla_user_dates: 'fechas',
        tekla_user_entries: 'entradas',
        search_placeholder: 'Buscar observaciones o fechas...',
        table_date: 'Fecha',
        select_all_records: 'Seleccionar todo',
        table_start: 'Inicio',
        table_finish: 'Final',
        table_off: 'Descanso',
        table_invested: 'Tiempo Invertido',
        table_remarks: 'Observaciones',
        table_actions: 'Acciones',
        table_actions: 'Acciones',
        formula_text: 'Fórmula de cálculo:',
        formula_calc: 'Tiempo Invertido = Hora Final − Hora Inicial − Descanso',
        new_row_remarks_placeholder: '¿En qué has trabajado hoy? Describir tarea...',
        view_details: 'Ver detalles',
        created_on: 'Creado el',
        time_invested_label: 'Tiempo invertido',
        no_projects_all: 'Todavía no hay proyectos. Crea el primero con «Nuevo proyecto».',
        no_projects_filter: 'No hay proyectos que coincidan con "{q}".',
        open_from_app_projects: 'Abre esta pantalla desde la aplicación para ver tus proyectos.',
        load_projects_error: 'No se pudieron cargar los proyectos:',
        no_records_all: 'Todavía no hay registros en este proyecto.',
        no_records_filter: 'No hay registros que coincidan con la búsqueda.',
        open_from_app_records: 'Abre esta pantalla desde la aplicación para ver los registros.',
        select_project_from_dashboard: 'Selecciona un proyecto desde el dashboard.',
        project_no_longer_exists: 'Este proyecto ya no existe. Vuelve al dashboard.',
        load_records_error: 'No se pudieron cargar los registros:',
        save_from_app: 'Abre esta pantalla desde la aplicación para guardar registros.',
        invalid_date_format: 'La fecha no es válida. Usa el formato MM/DD/AAAA.',
        invalid_time_format: 'Hora inicial/final: usa formato hh:mm AM/PM (ej. 08:00 AM). Descanso: usa HH:MM.',
        end_after_start: 'La hora final debe ser posterior a la hora de inicio.',
        break_negative: 'El descanso no puede ser negativo.',
        break_greater_than_range: 'El descanso no puede ser mayor al tiempo entre inicio y final.',
        save_record_error: 'No se pudo guardar el registro.',
        save_record_saving: 'Guardando...',
        project_name_empty: 'El nombre del proyecto no puede estar vacío.',
        open_from_app_projects: 'Abre esta pantalla desde la aplicación para crear proyectos.',
        confirm_delete_record: '¿Eliminar este registro? Esta acción no se puede deshacer.',
        delete_record_title: 'Eliminar registro',
        modal_user_title: '¿Cómo te llamas?',
        modal_user_name: 'Tu nombre',
        modal_user_help: 'Así te saludaré en el dashboard.',
        modal_user_save: 'Guardar',
        settings_title: 'Configuración',
        settings_change_name: 'Cambiar nombre',
        modal_cancel: 'Cancelar',
        edit_project_name: 'Editar nombre del proyecto',
        edit_project_name_title: 'Editar nombre del proyecto',
        edit_project_name_save: 'Guardar',
        project_name_updated: 'Nombre del proyecto actualizado'
      },
      en: {
        title_dashboard: 'Time Tracking - Dashboard',
        title_project: 'Time Tracking - Project Details',
        nav_dashboard: 'Dashboard',
        greeting_morning: 'Good morning',
        greeting_afternoon: 'Good afternoon',
        greeting_night: 'Good night',
        btn_new_project: 'New project',
        section_my_projects: 'My projects',
        filter_placeholder: 'Filter projects...',
        modal_create_title: 'Create new project',
        modal_project_name: 'Project name',
        modal_required: 'Required',
        modal_project_help: 'Choose a clear and descriptive name.',
        modal_cancel: 'Cancel',
        modal_create: 'Create project',
        back_to_dashboard: '← Back to dashboard',
        breadcrumb_dashboard: 'Dashboard',
        project_loading: 'Loading…',
        project_not_found: 'Project not found',
        total_time_invested: 'Total time invested',
        export_pdf: 'Export to PDF',
        export_downloaded: 'Downloaded',
        add_record: '+ Add record',
        import_tekla_history: 'Import Tekla Save History',
        importing_tekla: 'Importing...',
        tekla_modal_title: 'Select users to import',
        tekla_modal_desc: 'Multiple users were detected in the file. Select which ones to import.',
        tekla_modal_import: 'Import',
        tekla_modal_all_users: 'All',
        tekla_modal_no_users: 'No named users were detected in the file.',
        tekla_user_dates: 'dates',
        tekla_user_entries: 'entries',
        search_placeholder: 'Search remarks or dates...',
        table_date: 'Date',
        select_all_records: 'Select all',
        table_start: 'Start',
        table_finish: 'Finish',
        table_off: 'Time Off',
        table_invested: 'Time Invested',
        table_remarks: 'Remarks',
        formula_text: 'Calculation formula:',
        formula_calc: 'Time Invested = Hour Finish − Hour Start − Time Off',
        new_row_remarks_placeholder: 'What have you worked on today? Describe the task...',
        view_details: 'View details',
        created_on: 'Created on',
        time_invested_label: 'Time invested',
        no_projects_all: 'No projects yet. Create the first one with "New project".',
        no_projects_filter: 'No projects match "{q}".',
        open_from_app_projects: 'Open this screen from the application to see your projects.',
        load_projects_error: 'Could not load projects:',
        no_records_all: 'No records yet for this project.',
        no_records_filter: 'No records match your search.',
        open_from_app_records: 'Open this screen from the application to see records.',
        select_project_from_dashboard: 'Select a project from the dashboard.',
        project_no_longer_exists: 'This project no longer exists. Go back to the dashboard.',
        load_records_error: 'Could not load records:',
        save_from_app: 'Open this screen from the application to save records.',
        invalid_date_format: 'Invalid date. Use MM/DD/YYYY format.',
        invalid_time_format: 'Start/end time: use hh:mm AM/PM (e.g. 08:00 AM). Break: use HH:MM.',
        end_after_start: 'End time must be after start time.',
        break_negative: 'Break time cannot be negative.',
        break_greater_than_range: 'Break time cannot be greater than time between start and end.',
        save_record_error: 'Could not save the record.',
        save_record_saving: 'Saving...',
        project_name_empty: 'Project name cannot be empty.',
        open_from_app_projects: 'Open this screen from the application to create projects.',
        table_actions: 'Actions',
        confirm_delete_record: 'Delete this record? This action cannot be undone.',
        delete_record_title: 'Delete record',
        modal_user_title: "What's your name?",
        modal_user_name: 'Your name',
        modal_user_help: "I'll greet you on the dashboard.",
        modal_user_save: 'Save',
        settings_title: 'Settings',
        settings_change_name: 'Change name',
        modal_cancel: 'Cancel',
        edit_project_name: 'Edit project name',
        edit_project_name_title: 'Edit project name',
        edit_project_name_save: 'Save',
        project_name_updated: 'Project name updated'
      }
    };

    function getLang() {
      try { return localStorage.getItem('tt-lang') || 'es'; } catch (e) { return 'es'; }
    }

    function t(key, vars) {
      const lang = getLang();
      let str = (I18N[lang] && I18N[lang][key]) || (I18N.es[key] || key);
      if (vars) {
        Object.keys(vars).forEach(function (k) {
          str = str.replace('{' + k + '}', vars[k]);
        });
      }
      return str;
    }

    function applyI18n() {
      const lang = getLang();
      try { document.documentElement.lang = lang; } catch (e) {}
      const sel = document.getElementById('lang-selector');
      if (sel) sel.value = lang;

      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        if (key && t(key)) el.textContent = t(key);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && t(key)) el.setAttribute('placeholder', t(key));
      });
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-title');
        if (key && t(key)) el.setAttribute('title', t(key));
      });

      // Refrescar textos del modal usuario si está visible
      const userModal2 = document.getElementById('user-modal');
      if (userModal2 && userModal2.style.display !== 'none') {
        const userHelp = document.getElementById('user-help');
        if (userHelp) {
          try { userHelp.textContent = (typeof t === 'function') ? t('modal_user_help') : userHelp.textContent; } catch (e) {}
        }
        const userSubmit = document.getElementById('btn-submit-user');
        if (userSubmit) {
          try { userSubmit.textContent = (typeof t === 'function') ? t('modal_user_save') : userSubmit.textContent; } catch (e) {}
        }
        const userCancel = document.getElementById('btn-cancel-user');
        if (userCancel) {
          try { userCancel.textContent = (typeof t === 'function') ? t('modal_cancel') : userCancel.textContent; } catch (e) {}
        }
      }

      // Refrescar textos del modal editar proyecto si está visible
      const projectEditModal2 = document.getElementById('project-edit-modal');
      if (projectEditModal2 && projectEditModal2.style.display !== 'none') {
        const btnSubmitProjectEdit2 = document.getElementById('btn-submit-project-edit');
        if (btnSubmitProjectEdit2) {
          try { btnSubmitProjectEdit2.textContent = (typeof t === 'function') ? t('edit_project_name_save') : btnSubmitProjectEdit2.textContent; } catch (e) {}
        }
        const btnCancelProjectEdit2 = document.getElementById('btn-cancel-project-edit');
        if (btnCancelProjectEdit2) {
          try { btnCancelProjectEdit2.textContent = (typeof t === 'function') ? t('modal_cancel') : btnCancelProjectEdit2.textContent; } catch (e) {}
        }
      }

      const title = document.querySelector('title');
      if (title) {
        if (document.getElementById('project-rows')) {
          title.textContent = t('title_project');
        } else {
          title.textContent = t('title_dashboard');
        }
      }
    }

    (function initI18n() {
      try {
        const lang = getLang();
        document.documentElement.lang = lang;
        const sel = document.getElementById('lang-selector');
        if (sel) {
          sel.value = lang;
          sel.addEventListener('change', function () {
            try { localStorage.setItem('tt-lang', sel.value); } catch (e) {}
            location.reload();
          });
        }
      } catch (e) {}
    })();

    function getTheme() {
        try { return localStorage.getItem('tt-theme') || 'light'; } catch (e) { return 'light'; }
    }

    function applyTheme(theme) {
        const t = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
        const cb = document.getElementById('theme-toggle');
        if (cb) cb.checked = (t === 'dark');
    }

    (function initTheme() {
        try {
            const theme = getTheme();
            applyTheme(theme);
            const cb = document.getElementById('theme-toggle');
            if (cb) {
                cb.addEventListener('change', function () {
                    const next = cb.checked ? 'dark' : 'light';
                    try { localStorage.setItem('tt-theme', next); } catch (e) { }
                    applyTheme(next);
                    // Sin recarga, se aplica en caliente
                });
            }
        } catch (e) { }
    })();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyI18n);
    } else {
      applyI18n();
    }

    // ===== index.html: proyectos reales =====
    (function initProyectosReales() {
      const grid = document.getElementById('projects-grid');
      if (!grid) return;

      const contador = document.getElementById('project-count');
      const saludo = document.getElementById('hero-greeting');
      const filtro = document.querySelector('.tt-filter-input');
      const COLORES = ['indigo', 'blue', 'greenAndroid', 'violet', 'red', 'yellow', 'green', 'black','orange', 'gray', 'greenlight', 'bluelight', 'yellowlight'];

      let proyectosCache = [];

      function el(tag, clase, texto) {
        const nodo = document.createElement(tag);
        if (clase) nodo.className = clase;
        if (texto !== undefined && texto !== null) nodo.textContent = texto;
        return nodo;
      }

      function mostrarAviso(mensaje) {
        grid.textContent = '';
        const aviso = el('div', 'tt-project-card', mensaje);
        aviso.setAttribute('style', 'grid-column: 1 / -1; align-items: center; justify-content: center; text-align: center; color: var(--color-text-muted);');
        grid.appendChild(aviso);
      }

      function pintarTarjetas(proyectos) {
        grid.textContent = '';

        if (proyectos.length === 0) {
          const textoFiltro = filtro ? (filtro.value || '').trim() : '';
          if (textoFiltro) {
            mostrarAviso(t('no_projects_filter', { q: textoFiltro }));
          } else {
            mostrarAviso(t('no_projects_all'));
          }
          return;
        }

        const mayor = Math.max.apply(null, proyectos.map(function (p) {
          return p.totalMinutos;
        }).concat([1]));

        proyectos.forEach(function (proyecto, indice) {
          const tarjeta = el('div', 'tt-project-card');

          const arriba = el('div', 'tt-project-card-top');
          const info = el('div', 'tt-project-info');
          const nombreWrap = el('div');
          nombreWrap.style.display = 'flex';
          nombreWrap.style.alignItems = 'center';
          nombreWrap.style.gap = '8px';
          const h3Nombre = el('h3', '', proyecto.nombre);
          nombreWrap.appendChild(h3Nombre);
          const btnEditarProyecto = document.createElement('button');
          btnEditarProyecto.type = 'button';
          btnEditarProyecto.className = 'tt-icon-btn';
          btnEditarProyecto.style.width = '28px';
          btnEditarProyecto.style.height = '28px';
          btnEditarProyecto.title = (typeof t === 'function') ? t('edit_project_name') : 'Editar nombre del proyecto';
          btnEditarProyecto.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
          btnEditarProyecto.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof abrirModalEditarProyecto === 'function') {
              abrirModalEditarProyecto(proyecto);
            }
          });
          nombreWrap.appendChild(btnEditarProyecto);
          info.appendChild(nombreWrap);
          info.appendChild(el('span', '', t('created_on') + ' ' + proyecto.creado));
          arriba.appendChild(info);

          const metrica = el('div', 'tt-project-metric');
          const linea = el('div', 'tt-metric-label-val');
          linea.appendChild(el('span', 'tt-metric-label', t('time_invested_label')));
          linea.appendChild(el('span', 'tt-metric-val tt-mono', proyecto.totalTexto));
          metrica.appendChild(linea);

          const pista = el('div', 'tt-progress-track');
          const relleno = el('div', 'tt-progress-fill ' + COLORES[indice % COLORES.length]);
          relleno.style.width = Math.round((proyecto.totalMinutos / mayor) * 100) + '%';
          pista.appendChild(relleno);
          metrica.appendChild(pista);

          const enlace = el('a', 'tt-project-link', t('view_details'));
          enlace.href = 'registroProyecto.html?project=' + encodeURIComponent(proyecto.id);
          enlace.addEventListener('click', function () {
            try {
              sessionStorage.setItem('tt-proyecto-seleccionado', JSON.stringify(proyecto));
            } catch (e) {}
          });

          tarjeta.appendChild(arriba);
          tarjeta.appendChild(metrica);
          tarjeta.appendChild(enlace);
          grid.appendChild(tarjeta);
        });
      }

      // Configuración
      const btnSettings = document.getElementById('btn-settings');
      const settingsMenu = document.getElementById('settings-menu');
      const btnChangeName = document.getElementById('btn-change-name');
      if (btnSettings && settingsMenu) {
        btnSettings.addEventListener('click', function(e){
          e.stopPropagation();
          settingsMenu.style.display = settingsMenu.style.display === 'flex' ? 'none' : 'flex';
        });
        document.addEventListener('click', function(){
          settingsMenu.style.display = 'none';
        });
        settingsMenu.addEventListener('click', function(e){ e.stopPropagation(); });
      }
      if (btnChangeName) {
        btnChangeName.addEventListener('click', function(){
          if (settingsMenu) settingsMenu.style.display = 'none';
          setUserError('');
          if (userInput) userInput.value = '';
          if (window.tt && tt.disponible && tt.disponible() && typeof tt.usuario.obtener === 'function') {
            tt.usuario.obtener()
              .then(function(res){
                if (userInput && res && res.nombre) {
                  userInput.value = String(res.nombre);
                }
                mostrarModalUsuario(true);
              })
              .catch(function(){
                mostrarModalUsuario(true);
              });
          } else {
            mostrarModalUsuario(true);
          }
        });
      }

      // Modal editar proyecto
      const projectEditModal = document.getElementById('project-edit-modal');
      const projectEditForm = document.getElementById('project-edit-form');
      const projectEditInput = document.getElementById('project-edit-input');
      const projectEditHelp = document.getElementById('project-edit-help');
      const btnCancelProjectEdit = document.getElementById('btn-cancel-project-edit');
      const btnSubmitProjectEdit = document.getElementById('btn-submit-project-edit');
      let proyectoEditando = null;

      function setProjectEditError(msg) {
        if (!projectEditHelp) return;
        if (msg) {
          projectEditHelp.textContent = msg;
          projectEditHelp.style.color = 'var(--color-danger-text)';
        } else {
          projectEditHelp.textContent = '';
          projectEditHelp.style.color = '';
        }
      }

      function abrirModalEditarProyecto(proyecto) {
        if (!projectEditModal) return;
        proyectoEditando = proyecto;
        setProjectEditError('');
        if (projectEditInput) {
          projectEditInput.value = proyecto && proyecto.nombre ? proyecto.nombre : '';
        }
        projectEditModal.style.display = 'flex';
        setTimeout(function(){ if (projectEditInput) { projectEditInput.focus(); projectEditInput.select(); } }, 50);
      }
      window.abrirModalEditarProyecto = abrirModalEditarProyecto;

      function cerrarModalEditarProyecto() {
        if (!projectEditModal) return;
        projectEditModal.style.display = 'none';
        proyectoEditando = null;
        setProjectEditError('');
        if (projectEditInput) projectEditInput.value = '';
      }

      if (btnCancelProjectEdit) {
        btnCancelProjectEdit.addEventListener('click', cerrarModalEditarProyecto);
      }
      if (projectEditModal) {
        projectEditModal.addEventListener('click', function(e){
          if (e.target === projectEditModal) cerrarModalEditarProyecto();
        });
      }
      window.addEventListener('keydown', function(e){
        if (e.key === 'Escape') {
          if (projectEditModal && projectEditModal.style.display === 'flex') {
            e.preventDefault();
            cerrarModalEditarProyecto();
          }
        }
      });

      if (projectEditForm) {
        projectEditForm.addEventListener('submit', function(e){
          e.preventDefault();
          if (!window.tt || !tt.disponible()) {
            setProjectEditError('Abre esta pantalla desde la aplicación para editar proyectos.');
            return;
          }
          if (!proyectoEditando || !proyectoEditando.id) {
            cerrarModalEditarProyecto();
            return;
          }
          if (!projectEditInput) return;
          const nombre = (projectEditInput.value || '').trim();
          if (nombre.length === 0) {
            try { setProjectEditError((typeof t === 'function') ? t('project_name_empty') : 'El nombre del proyecto no puede estar vacío.'); } catch (e) { setProjectEditError('El nombre del proyecto no puede estar vacío.'); }
            projectEditInput.focus();
            return;
          }
          setProjectEditError('');
          if (btnSubmitProjectEdit) {
            btnSubmitProjectEdit.disabled = true;
            btnSubmitProjectEdit.textContent = '...';
          }
          if (typeof tt.proyectos.editar === 'function') {
            tt.proyectos.editar(proyectoEditando.id, nombre)
              .then(function(){
                cerrarModalEditarProyecto();
                if (typeof tt.proyectos.listar === 'function') {
                  tt.proyectos.listar().then(function(proyectos){
                    proyectosCache = proyectos || [];
                    if (contador) contador.textContent = String(proyectosCache.length);
                    if (typeof aplicarFiltro === 'function') {
                      aplicarFiltro();
                    } else {
                      pintarTarjetas(proyectosCache);
                    }
                  }).catch(function(err){
                    alert(err && err.message ? err.message : 'Error al recargar');
                    location.reload();
                  });
                } else {
                  location.reload();
                }
              })
              .catch(function(err){
                setProjectEditError(err && err.message ? err.message : 'No se pudo actualizar el proyecto.');
              })
              .finally(function(){
                if (btnSubmitProjectEdit) {
                  btnSubmitProjectEdit.disabled = false;
                  try { btnSubmitProjectEdit.textContent = (typeof t === 'function') ? t('edit_project_name_save') : 'Guardar'; } catch (e) { btnSubmitProjectEdit.textContent = 'Guardar'; }
                }
              });
          } else {
            setProjectEditError('Función no disponible.');
            if (btnSubmitProjectEdit) {
              btnSubmitProjectEdit.disabled = false;
              try { btnSubmitProjectEdit.textContent = (typeof t === 'function') ? t('edit_project_name_save') : 'Guardar'; } catch (e) { btnSubmitProjectEdit.textContent = 'Guardar'; }
            }
          }
        });
      }

      function aplicarFiltro() {
        const texto = filtro ? (filtro.value || '').toLowerCase().trim() : '';
        if (!texto) {
          if (contador) contador.textContent = String(proyectosCache.length);
          pintarTarjetas(proyectosCache);
          return;
        }
        const filtrados = proyectosCache.filter(function (p) {
          return (p.nombre || '').toLowerCase().includes(texto);
        });
        if (contador) contador.textContent = String(filtrados.length);
        pintarTarjetas(filtrados);
      }

        function obtenerSaludo(nombre) {
            const hora = new Date().getHours();
            let prefijo;

            if (hora >= 6 && hora < 12) {
                prefijo = t('greeting_morning');
            } else if (hora >= 12 && hora < 20) {
                prefijo = t('greeting_afternoon');
            } else {
                prefijo = t('greeting_night');
            }

            return nombre ? prefijo + ', ' + nombre + '!' : prefijo + '!';
        }

      if (filtro) {
        filtro.addEventListener('input', aplicarFiltro);
      }

      if (!window.tt || !tt.disponible()) {
        mostrarAviso(t('open_from_app_projects'));
        return;
      }

      // Modal primer uso / cambio de nombre
      const userModal = document.getElementById('user-modal');
      const userForm = document.getElementById('user-form');
      const userInput = document.getElementById('user-name-input');
      const userHelp = document.getElementById('user-help');
      const userSubmit = document.getElementById('btn-submit-user');
      const btnCancelUser = document.getElementById('btn-cancel-user');
      let userEditMode = false; // true = edición desde configuración

      function setUserError(msg) {
        if (!userHelp) return;
        if (msg) {
          userHelp.textContent = msg;
          userHelp.style.color = 'var(--color-danger-text)';
        } else {
          try { userHelp.textContent = (typeof t === 'function') ? t('modal_user_help') : 'Así te saludaré en el dashboard.'; } catch (e) { userHelp.textContent = 'Así te saludaré en el dashboard.'; }
          userHelp.style.color = '';
        }
      }

      function mostrarModalUsuario(editMode) {
        if (!userModal) return;
        userEditMode = !!editMode;
        if (btnCancelUser) {
          btnCancelUser.style.display = userEditMode ? 'inline-flex' : 'none';
        }
        userModal.style.display = 'flex';
        setTimeout(function(){ if (userInput) { userInput.focus(); userInput.select(); } }, 50);
      }

      function ocultarModalUsuario() {
        if (!userModal) return;
        userModal.style.display = 'none';
        userEditMode = false;
        if (btnCancelUser) btnCancelUser.style.display = 'none';
        if (userInput) userInput.value = '';
        setUserError('');
      }

      if (btnCancelUser) {
        btnCancelUser.addEventListener('click', function(){
          if (userEditMode) {
            ocultarModalUsuario();
          }
        });
      }

      if (userModal) {
        userModal.addEventListener('click', function(e){
          if (e.target === userModal && userEditMode) {
            ocultarModalUsuario();
          }
        });
      }

      window.addEventListener('keydown', function(e){
        if (e.key === 'Escape') {
          if (userModal && userModal.style.display === 'flex' && userEditMode) {
            e.preventDefault();
            ocultarModalUsuario();
          }
        }
      });

      if (userForm) {
        userForm.addEventListener('submit', function(e){
          e.preventDefault();
          if (!window.tt || !tt.disponible()) return;
          const nombre = (userInput && userInput.value ? userInput.value : '').trim();
          if (nombre.length === 0) {
            setUserError((typeof t === 'function') ? t('project_name_empty') : 'El nombre no puede estar vacío.');
            if (userInput) userInput.focus();
            return;
          }
          setUserError('');
          if (userSubmit) { userSubmit.disabled = true; userSubmit.textContent = '...'; }
          tt.usuario.guardar(nombre)
            .then(function(res){
              ocultarModalUsuario();
              if (saludo) {
                try { saludo.textContent = obtenerSaludo(res && res.nombre ? res.nombre : nombre); } catch(e) { saludo.textContent = obtenerSaludo(res && res.nombre ? res.nombre : nombre); }
              }
            })
            .catch(function(err){
              setUserError(err && err.message ? err.message : 'Error al guardar');
            })
            .finally(function(){
              if (userSubmit) { userSubmit.disabled = false; try { userSubmit.textContent = (typeof t === 'function') ? t('modal_user_save') : 'Guardar'; } catch(e) { userSubmit.textContent = 'Guardar'; } }
            });
        });
      }

      Promise.all([tt.proyectos.listar(), tt.usuario.obtener()])
        .then(function (resultados) {
          const proyectos = resultados[0] || [];
          const usuario = resultados[1] || {};

          proyectosCache = proyectos;

          if (contador) contador.textContent = String(proyectos.length);
          const nombreUsr = usuario && usuario.nombre ? String(usuario.nombre).trim() : '';
          if (nombreUsr.length === 0) {
            if (typeof mostrarModalUsuario === 'function') mostrarModalUsuario(false);
            if (saludo) {
              try { saludo.textContent = obtenerSaludo(''); } catch(e) { saludo.textContent = '¡Buenos días!'; }
            }
          } else {
            if (saludo) {
              try { saludo.textContent = obtenerSaludo(nombreUsr); } catch(e) {}
            }
          }

          pintarTarjetas(proyectos);
        })
        .catch(function (error) {
          mostrarAviso(t('load_projects_error') + ' ' + error.message);
        });
    })();

// ===== registroProyecto.html: registros reales =====
    (function initDetalleProyecto() {
      const cuerpo = document.getElementById('project-rows');
      if (!cuerpo) return;

      const titulo = document.getElementById('project-title');
      const miga = document.getElementById('project-breadcrumb-name');
      const total = document.getElementById('project-total');
      
      let proyectoTotalMinutos = 0;
      const seleccionadosSet = new Set();
      
      // Pintado instantáneo desde sessionStorage
      try {
        const cache = sessionStorage.getItem('tt-proyecto-seleccionado');
        if (cache) {
          const p = JSON.parse(cache);
          const idUrl = Number(new URLSearchParams(window.location.search).get('project'));
          if (p && (!Number.isInteger(idUrl) || p.id === idUrl)) {
            if (titulo && p.nombre) titulo.textContent = p.nombre;
            if (miga && p.nombre) miga.textContent = p.nombre;
            if (total && p.totalTexto) {
              total.textContent = p.totalTexto;
            }
            if (typeof p.totalMinutos === 'number') {
              proyectoTotalMinutos = p.totalMinutos;
            }
          }
        }
      } catch (e) {}
      
      const btnAdd = document.getElementById('addRecordBtn');
      const inputFecha = document.getElementById('newRowDate');
      const inputInicio = document.getElementById('newRowStart');
      const inputFinal = document.getElementById('newRowFinish');
      const inputDescanso = document.getElementById('newRowOff');
      const inputObserv = document.getElementById('newRowRemarks');
      const calcDisplay = document.getElementById('calculatedLiveTime');
      const buscadorRegistros = document.querySelector('.tt-search-input');
      
      let registrosCache = [];
      let filaEditando = null;
      let datosOriginalesFila = null;

      function el(tag, clase, texto) {
        const nodo = document.createElement(tag);
        if (clase) nodo.className = clase;
        if (texto !== undefined && texto !== null) nodo.textContent = texto;
        return nodo;
      }

      function pintarTotal(minutos) {
        if (!total) return;
        const netos = minutos > 0 ? minutos : 0;
        total.textContent = '';
        total.appendChild(document.createTextNode(String(Math.floor(netos / 60))));
        total.appendChild(el('span', '', ' h '));
        total.appendChild(document.createTextNode(String(netos % 60).padStart(2, '0')));
        total.appendChild(el('span', '', ' min'));
      }

      // Borra las filas de datos; la primera fila es siempre la de captura.
      function limpiarFilas() {
        while (cuerpo.rows.length > 1) cuerpo.deleteRow(1);
      }

      function actualizarTotalSeleccionado() {
        if (!total) return;
        if (!seleccionadosSet || seleccionadosSet.size === 0) {
          pintarTotal(proyectoTotalMinutos);
          const selectAll = document.getElementById('tt-select-all');
          if (selectAll) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
          }
          return;
        }
        let suma = 0;
        const checks = cuerpo ? cuerpo.querySelectorAll('.tt-row-check:checked') : [];
        checks.forEach(function (chk) {
          const v = parseInt(chk.getAttribute('data-minutos') || '0', 10);
          if (!isNaN(v)) suma += v;
        });
        if (suma <= 0) {
          pintarTotal(proyectoTotalMinutos);
          const selectAll = document.getElementById('tt-select-all');
          if (selectAll) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
          }
          return;
        }
        total.textContent = '';
        total.appendChild(document.createTextNode(String(Math.floor(suma / 60))));
        total.appendChild(el('span', '', ' h '));
        total.appendChild(document.createTextNode(String(suma % 60).padStart(2, '0')));
        total.appendChild(el('span', '', ' min'));
        const selectAll = document.getElementById('tt-select-all');
        if (selectAll) {
          const visibles = cuerpo ? cuerpo.querySelectorAll('.tt-row-check') : [];
          if (visibles.length > 0 && checks.length === visibles.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
          } else if (checks.length > 0) {
            selectAll.checked = false;
            selectAll.indeterminate = true;
          } else {
            selectAll.checked = false;
            selectAll.indeterminate = false;
          }
        }
      }

      function mostrarSinRegistros(mensaje) {
        const fila = el('tr');
        const celda = el('td', '', mensaje);
        celda.colSpan = 8;
        celda.setAttribute('style', 'text-align: center; color: var(--color-text-muted);');
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
      }

      function parseHoraMin(valor) {
        if (!valor) return NaN;
        var t = String(valor).trim();
        var m = t.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
        if (m) {
          var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
          var ap = m[3].toUpperCase();
          if (h < 1 || h > 12 || min < 0 || min > 59) return NaN;
          if (ap === 'AM') h = (h === 12) ? 0 : h;
          else h = (h === 12) ? 12 : h + 12;
          return h * 60 + min;
        }
        var d = t.match(/^(\d{1,2}):(\d{2})$/);
        if (d) {
          var hh = parseInt(d[1], 10), mm = parseInt(d[2], 10);
          if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return NaN;
          return hh * 60 + mm;
        }
        return NaN;
      }

      function parseMin(hm) {
        var v = parseHoraMin(hm);
        return isNaN(v) ? 0 : v;
      }

      function formatearMinAHm(min) {
        if (min < 0) min = 0;
        return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0') + ' h';
      }

      function cancelarEdicion() {
        if (filaEditando && datosOriginalesFila) {
          filaEditando.innerHTML = datosOriginalesFila.html;
          // Reasignar listeners
          habilitarEdicionEnFila(filaEditando, datosOriginalesFila.id, datosOriginalesFila.fecha, datosOriginalesFila.inicio, datosOriginalesFila.final, datosOriginalesFila.descanso, datosOriginalesFila.obs);
        }
        filaEditando = null;
        datosOriginalesFila = null;
      }

      function habilitarEdicionEnFila(fila, id, fecha, inicio, final, descanso, obs) {
        fila.style.cursor = 'pointer';
        fila.addEventListener('click', function editarFila(e) {
          if (filaEditando && filaEditando !== fila) {
            cancelarEdicion();
          }
          if (filaEditando === fila) return;
          if (e.target && e.target.tagName === 'INPUT') return;

          // Guardar estado original
          datosOriginalesFila = {
            html: fila.innerHTML,
            id: id,
            fecha: fecha,
            inicio: inicio,
            final: final,
            descanso: descanso,
            obs: obs
          };
          filaEditando = fila;

          // Preservar la celda del checkbox
          var celdaCheckOriginal = null;
          if (fila.cells && fila.cells.length > 0) {
            celdaCheckOriginal = fila.cells[0].cloneNode(true);
            // Deshabilitar checkbox durante edición
            var chkEdit = celdaCheckOriginal.querySelector('.tt-row-check');
            if (chkEdit) {
              chkEdit.disabled = true;
            }
          }

          fila.innerHTML = '';
          if (celdaCheckOriginal) {
            fila.appendChild(celdaCheckOriginal);
          } else {
            fila.appendChild(el('td'));
          }

          // Fecha
          var tdFecha = el('td');
          var inpFecha = document.createElement('input');
          inpFecha.type = 'text';
          inpFecha.className = 'tt-input-text tt-mono';
          inpFecha.style.width = '100%';
          inpFecha.style.minWidth = '130px';
          inpFecha.style.boxSizing = 'border-box';
          inpFecha.value = fecha;
          tdFecha.appendChild(inpFecha);
          fila.appendChild(tdFecha);

          // Inicio
          var tdIni = el('td');
          var inpIni = document.createElement('input');
          inpIni.type = 'text';
          inpIni.className = 'tt-input-text tt-mono';
          inpIni.style.width = '100%';
          inpIni.style.minWidth = '120px';
          inpIni.style.boxSizing = 'border-box';
          inpIni.value = inicio;
          tdIni.appendChild(inpIni);
          fila.appendChild(tdIni);

          // Final
          var tdFin = el('td');
          var inpFin = document.createElement('input');
          inpFin.type = 'text';
          inpFin.className = 'tt-input-text tt-mono';
          inpFin.style.width = '100%';
          inpFin.style.minWidth = '120px';
          inpFin.style.boxSizing = 'border-box';
          inpFin.value = final;
          tdFin.appendChild(inpFin);
          fila.appendChild(tdFin);

          // Descanso
          var tdDes = el('td');
          var inpDes = document.createElement('input');
          inpDes.type = 'text';
          inpDes.className = 'tt-input-text tt-mono';
          inpDes.style.width = '100%';
          inpDes.style.minWidth = '90px';
          inpDes.style.boxSizing = 'border-box';
          inpDes.value = descanso;
          tdDes.appendChild(inpDes);
          fila.appendChild(tdDes);

          // Total
          var tdTot = el('td');
          var spanTot = el('span', 'tt-invested-badge tt-mono', '00:00 h');
          tdTot.appendChild(spanTot);
          fila.appendChild(tdTot);

          // Observaciones
          var tdObs = el('td');
          var inpObs = document.createElement('input');
          inpObs.type = 'text';
          inpObs.className = 'tt-input-text';
          inpObs.style.width = '100%';
          inpObs.style.minWidth = '200px';
          inpObs.value = (obs === '—' || obs === null) ? '' : obs;
          tdObs.appendChild(inpObs);
          fila.appendChild(tdObs);

          // Acciones (vacío en modo edición)
          var tdAccionesEdit = el('td');
          tdAccionesEdit.style.textAlign = 'center';
          fila.appendChild(tdAccionesEdit);

          function actualizarTotalFila() {
            var mi = parseMin(inpIni.value), mf = parseMin(inpFin.value), md = parseMin(inpDes.value);
            var nt = mf - mi - md;
            if (nt < 0) nt = 0;
            spanTot.textContent = formatearMinAHm(nt);
          }

          inpIni.addEventListener('input', actualizarTotalFila);
          inpFin.addEventListener('input', actualizarTotalFila);
          inpDes.addEventListener('input', actualizarTotalFila);
          actualizarTotalFila();

          function guardar() {
            if (!window.tt || !tt.disponible()) {
              alert(t('save_from_app'));
              cancelarEdicion();
              return;
            }

            var fechaVal = (inpFecha.value || '').trim();
            var iniVal = (inpIni.value || '').trim();
            var finVal = (inpFin.value || '').trim();
            var desVal = (inpDes.value || '').trim();
            var obsVal = inpObs.value || '';

            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaVal)) {
              alert(t('invalid_date_format'));
              inpFecha.focus();
              return;
            }
            var mIni2 = parseHoraMin(iniVal), mFin2 = parseHoraMin(finVal), mDes2 = parseHoraMin(desVal);
            if (isNaN(mIni2) || isNaN(mFin2) || isNaN(mDes2)) {
              alert(t('invalid_time_format'));
              return;
            }
            if (mFin2 <= mIni2) {
              alert(t('end_after_start'));
              inpFin.focus();
              return;
            }
            if (mDes2 < 0) {
              alert(t('break_negative'));
              inpDes.focus();
              return;
            }
            if (mDes2 > (mFin2 - mIni2)) {
              alert(t('break_greater_than_range'));
              inpDes.focus();
              return;
            }

            tt.registros.editar({
              id: id,
              fecha: fechaVal,
              inicio: iniVal,
              final: finVal,
              descanso: desVal,
              observaciones: obsVal
            })
              .then(function () {
                filaEditando = null;
                datosOriginalesFila = null;
                return recargar();
              })
              .catch(function (err) {
                alert(err && err.message ? err.message : t('save_record_error'));
                inpIni.focus();
              });
          }

          inpObs.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              guardar();
            }
            if (ev.key === 'Escape') {
              ev.preventDefault();
              cancelarEdicion();
            }
          });

          var inputs = [inpFecha, inpIni, inpFin, inpDes, inpObs];
          inputs.forEach(function (inp) {
            inp.addEventListener('keydown', function (ev) {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                guardar();
              }
              if (ev.key === 'Escape') {
                ev.preventDefault();
                cancelarEdicion();
              }
            });
          });

          inpFecha.focus();
        });
      }

      function pintarRegistros(registros) {
        limpiarFilas();

        if (registros.length === 0) {
          const textoFiltro = buscadorRegistros ? (buscadorRegistros.value || '').trim() : '';
          if (textoFiltro) {
            mostrarSinRegistros(t('no_records_filter'));
          } else {
            mostrarSinRegistros(t('no_records_all'));
          }
          actualizarTotalSeleccionado();
          return;
        }

        registros.forEach(function (registro) {
          const fila = el('tr');

          const celdaCheck = el('td');
          celdaCheck.style.textAlign = 'center';
          const chk = document.createElement('input');
          chk.type = 'checkbox';
          chk.className = 'tt-row-check';
          chk.setAttribute('data-minutos', String(registro.totalMinutos || 0));
          chk.setAttribute('data-id', String(registro.id));
          if (seleccionadosSet && seleccionadosSet.has(registro.id)) {
            chk.checked = true;
          }
          chk.addEventListener('click', function (e) {
            e.stopPropagation();
            if (chk.checked) {
              seleccionadosSet.add(registro.id);
            } else {
              seleccionadosSet.delete(registro.id);
            }
            actualizarTotalSeleccionado();
          });
          celdaCheck.appendChild(chk);
          fila.appendChild(celdaCheck);

          const celdaFecha = el('td');
          const envoltura = el('span');
          envoltura.setAttribute('style', 'display:flex; align-items:center; gap:8px;');
          envoltura.appendChild(el('span', 'tt-mono', registro.fecha));
          celdaFecha.appendChild(envoltura);
          fila.appendChild(celdaFecha);

          fila.appendChild(el('td', 'tt-mono', registro.inicio));
          fila.appendChild(el('td', 'tt-mono', registro.final));
          fila.appendChild(el('td', 'tt-mono', registro.descanso));

          const celdaTotal = el('td');
          celdaTotal.appendChild(el('span', 'tt-invested-badge tt-mono', registro.totalTexto));
          fila.appendChild(celdaTotal);

          const celdaObservaciones = el('td');
          celdaObservaciones.appendChild(el('span', '', registro.observaciones || '—'));
          fila.appendChild(celdaObservaciones);

          const celdaAcciones = el('td');
          celdaAcciones.style.textAlign = 'center';
          const btnEliminar = el('button', 'tt-btn', '🗑');
          btnEliminar.type = 'button';
          btnEliminar.title = typeof t === 'function' ? t('delete_record_title') : 'Eliminar registro';
          btnEliminar.style.padding = '4px 8px';
          btnEliminar.style.fontSize = '14px';
          btnEliminar.style.color = 'var(--color-danger-text, #dc2626)';
          btnEliminar.style.borderColor = 'rgba(220, 38, 38, 0.4)';
          btnEliminar.addEventListener('mouseenter', function () {
            btnEliminar.style.background = 'rgba(220, 38, 38, 0.08)';
          });
          btnEliminar.addEventListener('mouseleave', function () {
            btnEliminar.style.background = '';
          });
          btnEliminar.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!window.tt || !tt.disponible()) {
              alert('La eliminación solo funciona dentro de la aplicación.');
              return;
            }
            if (!confirm(typeof t === 'function' ? t('confirm_delete_record') : '¿Eliminar este registro? Esta acción no se puede deshacer.')) {
              return;
            }
            btnEliminar.disabled = true;
            btnEliminar.textContent = '...';
            if (seleccionadosSet) seleccionadosSet.delete(registro.id);
            tt.registros.eliminar(registro.id)
              .then(function () {
                recargar();
              })
              .catch(function (err) {
                alert(err && err.message ? err.message : 'Error al eliminar el registro');
                btnEliminar.disabled = false;
                btnEliminar.textContent = '🗑';
              });
          });
          celdaAcciones.appendChild(btnEliminar);
          fila.appendChild(celdaAcciones);

          cuerpo.appendChild(fila);
          habilitarEdicionEnFila(fila, registro.id, registro.fecha, registro.inicio, registro.final, registro.descanso, registro.observaciones || '');
        });
        actualizarTotalSeleccionado();
      }

      function aplicarFiltroRegistros() {
        const texto = buscadorRegistros ? (buscadorRegistros.value || '').toLowerCase().trim() : '';
        if (!texto) {
          pintarRegistros(registrosCache);
          return;
        }
        const filtrados = registrosCache.filter(function (r) {
          const fecha = (r.fecha || '').toLowerCase();
          const obs = (r.observaciones || '').toLowerCase();
          return fecha.indexOf(texto) !== -1 || obs.indexOf(texto) !== -1;
        });
        pintarRegistros(filtrados);
      }

      if (buscadorRegistros) {
        buscadorRegistros.addEventListener('input', aplicarFiltroRegistros);
      }

      const selectAll = document.getElementById('tt-select-all');
      if (selectAll) {
        selectAll.addEventListener('change', function () {
          const checked = selectAll.checked;
          if (checked) selectAll.indeterminate = false;
          const checks = cuerpo ? cuerpo.querySelectorAll('.tt-row-check') : [];
          checks.forEach(function (chk) {
            chk.checked = checked;
            const rid = parseInt(chk.getAttribute('data-id') || '0', 10);
            if (rid) {
              if (checked) {
                seleccionadosSet.add(rid);
              } else {
                seleccionadosSet.delete(rid);
              }
            }
          });
          actualizarTotalSeleccionado();
        });
      }

      function fechaHoyISO() {
        const hoy = new Date();
        return String(hoy.getMonth() + 1).padStart(2, '0') + '/' +
               String(hoy.getDate()).padStart(2, '0') + '/' +
               hoy.getFullYear();
      }

      function resetFilaCaptura() {
        if (inputFecha) inputFecha.value = fechaHoyISO();
        if (inputInicio) inputInicio.value = '08:00 AM';
        if (inputFinal) inputFinal.value = '05:00 PM';
        if (inputDescanso) inputDescanso.value = '00:00';
        if (inputObserv) inputObserv.value = '';
        if (inputDescanso) inputDescanso.dispatchEvent(new Event('input', { bubbles: true }));
        if (calcDisplay) calcDisplay.textContent = '09:00 h';
      }

      // Fila de captura: fecha de hoy y total recalculado.
      if (inputFecha && !inputFecha.value) {
        inputFecha.value = fechaHoyISO();
      }
      if (inputInicio && !inputInicio.value) inputInicio.value = '08:00 AM';
      if (inputFinal && !inputFinal.value) inputFinal.value = '05:00 PM';
      if (inputDescanso && !inputDescanso.value) inputDescanso.value = '00:00';

      if (inputDescanso) inputDescanso.dispatchEvent(new Event('input', { bubbles: true }));
      if (!inputDescanso && calcDisplay && inputInicio && inputFinal) {
        // Forzar cálculo por si falla el otro IIFE
        var ni = parseMin(inputInicio.value), nf = parseMin(inputFinal.value), nd = 0;
        var nt = nf - ni - nd; if(nt<0) nt=0;
        calcDisplay.textContent = String(Math.floor(nt/60)).padStart(2,'0') + ':' + String(nt%60).padStart(2,'0') + ' h';
      }

      if (!window.tt || !tt.disponible()) {
        limpiarFilas();
        mostrarSinRegistros(t('open_from_app_records'));
        return;
      }

      const id = Number(new URLSearchParams(window.location.search).get('project'));
      if (!Number.isInteger(id) || id <= 0) {
        if (titulo) titulo.textContent = t('project_not_found');
        limpiarFilas();
        mostrarSinRegistros(t('select_project_from_dashboard'));
        return;
      }

      function recargar() {
        return Promise.all([tt.proyectos.listar(), tt.registros.listar(id)])
          .then(function (resultados) {
            const proyectos = resultados[0] || [];
            const proyecto = proyectos.filter(function (p) { return p.id === id; })[0];

            if (!proyecto) {
              if (titulo) titulo.textContent = t('project_not_found');
              limpiarFilas();
              mostrarSinRegistros(t('project_no_longer_exists'));
              if (seleccionadosSet) seleccionadosSet.clear();
              proyectoTotalMinutos = 0;
              pintarTotal(0);
              const selectAll = document.getElementById('tt-select-all');
              if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
              return;
            }

            if (titulo) titulo.textContent = proyecto.nombre;
            if (miga) miga.textContent = proyecto.nombre;
            document.title = 'TimeTrack - ' + proyecto.nombre;

            if (typeof proyecto.totalMinutos === 'number') {
              proyectoTotalMinutos = proyecto.totalMinutos;
            }
            pintarTotal(proyecto.totalMinutos);
            registrosCache = resultados[1] || [];
            if (typeof aplicarFiltroRegistros === 'function') {
              aplicarFiltroRegistros();
            } else {
              pintarRegistros(registrosCache);
            }
          });
      }

      recargar()
        .catch(function (error) {
          limpiarFilas();
          mostrarSinRegistros(t('load_records_error') + ' ' + error.message);
        });

      if (btnAdd) {
        btnAdd.addEventListener('click', function (e) {
          e.preventDefault();

          if (!window.tt || !tt.disponible()) {
            alert(t('save_from_app'));
            return;
          }

          if (!inputFecha || !inputInicio || !inputFinal) return;

          const fechaVal = (inputFecha.value || '').trim();
          const inicioVal = (inputInicio.value || '').trim();
          const finalVal = (inputFinal.value || '').trim();
          const descansoVal = inputDescanso ? (inputDescanso.value || '').trim() : '00:00';
          const obsVal = inputObserv ? (inputObserv.value || '') : '';

          // Validaciones básicas
          if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaVal)) {
            alert('La fecha no es válida. Usa el formato MM/DD/AAAA.');
            inputFecha.focus();
            return;
          }

          var mIni = parseHoraMin(inicioVal), mFin = parseHoraMin(finalVal), mDes = parseHoraMin(descansoVal);
          if (isNaN(mIni) || isNaN(mFin) || isNaN(mDes)) {
            alert(t('invalid_time_format'));
            return;
          }
          if (mFin <= mIni) {
            alert(t('end_after_start'));
            inputFinal.focus();
            return;
          }
          if (mDes < 0) {
            alert(t('break_negative'));
            inputDescanso.focus();
            return;
          }
          if (mDes > (mFin - mIni)) {
            alert(t('break_greater_than_range'));
            inputDescanso.focus();
            return;
          }

          var textoOriginal = btnAdd.textContent;
          btnAdd.disabled = true;
          btnAdd.textContent = t('save_record_saving');

          tt.registros.crear({
            idProyecto: id,
            fecha: fechaVal,
            inicio: inicioVal,
            final: finalVal,
            descanso: descansoVal,
            observaciones: obsVal
          })
            .then(function () {
              return recargar();
            })
            .then(function () {
              resetFilaCaptura();
              if (inputObserv) {
                inputObserv.focus();
              }
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : t('save_record_error'));
            })
            .finally(function () {
              btnAdd.disabled = false;
              btnAdd.textContent = textoOriginal;
            });
        });
      }
    })();
