// ==== NAVBAR: scroll suave + cierre en mobile + link activo ====
document.addEventListener('DOMContentLoaded', function () {
  
  const body = document.body;
  if (body.getAttribute('data-bs-spy') === 'scroll') {
    body.removeAttribute('data-bs-spy');
    body.removeAttribute('data-bs-target');
    body.removeAttribute('data-bs-offset');
    body.removeAttribute('data-bs-smooth-scroll');
  }

  // 2) Referencias básicas del navbar
  const navbar = document.getElementById('navbarOasis');
  const navbarCollapseEl = document.getElementById('navbarOasisContent');
  const navbarToggler = document.querySelector('#navbarOasis .navbar-toggler');
  const navLinks = document.querySelectorAll(
    '#navbarOasisContent .nav-link[href^="#"]'
  );
  const main = document.querySelector('main');

  // Altura base del navbar (con el menú cerrado)
  let navOffset = 0;

  function actualizarNavOffset() {
    if (!navbar) return;
    navOffset = navbar.offsetHeight || 0;
  }

  // Medimos al cargar y al cambiar el tamaño de la ventana
  actualizarNavOffset();
  window.addEventListener('resize', actualizarNavOffset);


  // 2b) Ajustar padding-top de <main> según la altura real del navbar
  function ajustarOffsetMain() {
    if (!navbar || !main) return;
    const navHeight = navbar.offsetHeight || 0;
    main.style.paddingTop = navHeight + 'px';
  }
  ajustarOffsetMain();
  window.addEventListener('resize', ajustarOffsetMain);

  // 3) Mapeo secciones <-> links
  const sections = [];
  navLinks.forEach(link => {
    const selector = link.getAttribute('href');
    if (!selector || !selector.startsWith('#')) return;

    const sectionEl = document.querySelector(selector);
    if (!sectionEl) return;

    sections.push({
      id: selector,
      section: sectionEl,
      link
    });
  });

  // 4) Instanciar el Collapse SIN togglear (para que NO se abra solo)
  let collapseInstance = null;
  if (navbarCollapseEl && typeof bootstrap !== 'undefined') {
    collapseInstance = bootstrap.Collapse.getOrCreateInstance(
      navbarCollapseEl,
      { toggle: false } // 👈 clave: no abrir al crear
    );

    // Forzamos estado cerrado al cargar
    navbarCollapseEl.classList.remove('show');
    if (navbarToggler) {
      navbarToggler.setAttribute('aria-expanded', 'false');
    }
  }

  // 5) Función para marcar el link activo (solo uno)
  function setActiveNav(id) {
    sections.forEach(item => {
      if (item.id === id) {
        item.link.classList.add('active');
        item.link.setAttribute('aria-current', 'page');
      } else {
        item.link.classList.remove('active');
        item.link.removeAttribute('aria-current');
      }
    });
  }

  // 6) Scroll suave a la sección + cierre del menú en mobile
  function scrollToSection(id) {
    const item = sections.find(s => s.id === id);
    if (!item || !navbar) return;

    const navbarHeight = navOffset || 0;

    // Posición objetivo: inicio de la sección justo debajo del nav
    const targetTop = item.section.offsetTop - navbarHeight;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });

    setActiveNav(id);

    // Cerrar hamburguesa en mobile si está abierta
    if (
      collapseInstance &&
      window.innerWidth < 992 &&
      navbarCollapseEl.classList.contains('show')
    ) {
      collapseInstance.hide();
    }
  }


  // 7) Click en links del menú
  navLinks.forEach(link => {
    link.addEventListener('click', function (event) {
      const id = this.getAttribute('href');
      if (!id || !id.startsWith('#')) return;

      const targetEl = document.querySelector(id);
      if (!targetEl) return;

      event.preventDefault();
      scrollToSection(id);
    });
  });

  // 8) Actualizar activo según scroll
  function handleScroll() {
    if (!sections.length || !navbar) return;

    const navbarHeight = navOffset || 0;
    const scrollPosition = window.pageYOffset + navbarHeight + 1;


    let currentId = sections[0].id; // por defecto Inicio

    sections.forEach(item => {
      const sectionTop = item.section.offsetTop;
      if (scrollPosition >= sectionTop) {
        currentId = item.id;
      }
    });

    setActiveNav(currentId);
  }

  // 9) Estado inicial (al cargar / si viene con #hash)
  if (sections.length) {
    const hasHash =
      window.location.hash &&
      sections.some(s => s.id === window.location.hash);

    const initialId = hasHash ? window.location.hash : sections[0].id;
    setActiveNav(initialId);
  }

  window.addEventListener('scroll', handleScroll);
  window.addEventListener('load', handleScroll);
  handleScroll();


  // ==== TOUR BOARD: paginación por regiones (mobile & tablet) ====
  (function () {
    const regions = document.querySelectorAll('.tour-region');
    const pagination = document.getElementById('tourPagination');
    if (!regions.length || !pagination) return;

    function getMode() {
      const w = window.innerWidth;
      if (w >= 992) return 'desktop'; // 4 columnas visibles sin paginación
      if (w >= 768) return 'tablet';  // 2 columnas por página
      return 'mobile';                // 1 columna por página
    }

    function getTotalPages(mode) {
      if (mode === 'mobile') return 4;  // 4 regiones, 1 por página
      if (mode === 'tablet') return 2;  // 2 columnas por página → 2 páginas
      return 1;                         // desktop: no usamos paginación real
    }

    let currentPage = 1;

    function updateView() {
      const mode = getMode();
      const total = getTotalPages(mode);

      // Desktop: mostramos todo y listo
      if (mode === 'desktop') {
        regions.forEach(region => region.classList.remove('d-none'));

        // Dejamos la paginación en un estado neutro (aunque no se ve por d-lg-none)
        const buttons = pagination.querySelectorAll('[data-tour-page]');
        buttons.forEach((btn, index) => {
          const li = btn.closest('.page-item');
          if (!li) return;
          li.classList.remove('d-none', 'active');
          btn.removeAttribute('aria-current');
        });
        return;
      }

      // Clamp de página actual según el modo
      if (currentPage < 1) currentPage = 1;
      if (currentPage > total) currentPage = total;

      // Mostrar/ocultar regiones según página & modo
      regions.forEach(region => {
        const pageAttr =
          mode === 'mobile' ? region.dataset.pageMobile : region.dataset.pageTablet;
        const regionPage = parseInt(pageAttr, 10);

        if (regionPage === currentPage) {
          region.classList.remove('d-none');
        } else {
          region.classList.add('d-none');
        }
      });

      // Actualizar UI de la paginación
      const buttons = pagination.querySelectorAll('[data-tour-page]');
      buttons.forEach(btn => {
        const li = btn.closest('.page-item');
        if (!li) return;
        const page = parseInt(btn.getAttribute('data-tour-page'), 10);

        // Mostrar/ocultar botones según el modo
        if (mode === 'mobile') {
          // mobile usa las 4 páginas
          li.classList.remove('d-none');
        } else if (mode === 'tablet') {
          // tablet sólo usa páginas 1 y 2
          if (page > 2) {
            li.classList.add('d-none');
          } else {
            li.classList.remove('d-none');
          }
        }

        // Estado activo
        if (page === currentPage) {
          li.classList.add('active');
          btn.setAttribute('aria-current', 'page');
        } else {
          li.classList.remove('active');
          btn.removeAttribute('aria-current');
        }
      });
    }

    // Click en los botones de paginación
    pagination.addEventListener('click', function (evt) {
      const btn = evt.target.closest('[data-tour-page]');
      if (!btn) return;
      evt.preventDefault();

      const page = parseInt(btn.getAttribute('data-tour-page'), 10);
      if (!isNaN(page)) {
        currentPage = page;
        updateView();
      }
    });

    // Al cambiar tamaño de pantalla, recalculamos modo/páginas
    window.addEventListener('resize', function () {
      updateView();
    });

    // Estado inicial
    updateView();
  })();


  // ==== FORMULARIO EXPERIENCIAS ====
  // ==== TOOLTIPS ====
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

  // ==== POPOVERS ====
  const popoverTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="popover"]')
  );
  popoverTriggerList.map(el => new bootstrap.Popover(el));

  // ==== ELEMENTOS DEL FORM ====
  const form = document.getElementById('experienciaForm');
  const progressBar = document.getElementById('expProgressBar');

  const alertSuccess = document.getElementById('expAlertSuccess');
  const alertError = document.getElementById('expAlertError');

  const inputNombre = document.getElementById('expNombre');
  const inputApellido = document.getElementById('expApellido');
  const inputMail = document.getElementById('expMail');

  // Fecha (dropdown + input oculto)
  const fechaHidden = document.getElementById('expFecha');
  const fechaBtn = document.getElementById('expFechaBtn');
  const fechaBtnText = document.getElementById('expFechaBtnText');
  const fechaItems = document.querySelectorAll('[data-role="fecha-item"]');
  const inputOtraFecha = document.getElementById('expOtraFecha');

  // Ubicación en estadio (dropdown + input oculto)
  const ubicacionHidden = document.getElementById('expUbicacionEstadio');
  const ubicacionBtn = document.getElementById('expUbicacionBtn');
  const ubicacionBtnText = document.getElementById('expUbicacionBtnText');
  const ubicacionItems = document.querySelectorAll('[data-role="ubicacion-item"]');

  // Canción favorita (dropdown + input oculto)
  const favHidden = document.getElementById('expCancionFavorita');
  const favBtn = document.getElementById('expCancionFavBtn');
  const favBtnText = document.getElementById('expCancionFavBtnText');
  const favItems = document.querySelectorAll('[data-role="fav-item"]');

  // Poll
  const radiosPoll = document.querySelectorAll('input[name="faltaCancion"]');
  const pollFeedback = document.getElementById('pollFeedback');

  // File input custom
  const fileInput = document.getElementById('expFotosReal');
  const fileBtn = document.getElementById('expFileBtn');
  const fileLabelText = document.getElementById('expFileLabelText');

  // Botón reset
  const resetBtn = document.getElementById('expResetBtn');

  // ==== DROPDOWN FECHA ====
  fechaItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.getAttribute('data-value');
      const label = this.textContent.trim();

      fechaHidden.value = value;
      fechaHidden.setCustomValidity('');
      fechaBtnText.textContent = label;
      fechaBtnText.classList.remove('text-muted');
      fechaBtn.classList.remove('is-invalid');

      // Mostrar/ocultar campo "Otra fecha"
      if (value === 'other') {
        inputOtraFecha.classList.remove('d-none');
        inputOtraFecha.required = true;
      } else {
        inputOtraFecha.classList.add('d-none');
        inputOtraFecha.required = false;
        inputOtraFecha.value = '';
      }

      actualizarProgreso();
    });
  });

  // ==== DROPDOWN UBICACIÓN EN ESTADIO ====
  ubicacionItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.getAttribute('data-value');
      const label = this.textContent.trim();

      ubicacionHidden.value = value;
      ubicacionHidden.setCustomValidity('');
      ubicacionBtnText.textContent = label;
      ubicacionBtnText.classList.remove('text-muted');
      ubicacionBtn.classList.remove('is-invalid');

      actualizarProgreso();
    });
  });

  // ==== DROPDOWN CANCIÓN FAVORITA ====
  favItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.getAttribute('data-value');
      const label = this.textContent.trim();

      favHidden.value = value;
      favHidden.setCustomValidity('');
      favBtnText.textContent = label;
      favBtnText.classList.remove('text-muted');
      favBtn.classList.remove('is-invalid');

      actualizarProgreso();
    });
  });

  // ==== FILE INPUT CUSTOM ====
  fileBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', function () {
    if (this.files.length > 2) {
      this.value = '';
      this.setCustomValidity('Solo podés subir hasta 2 imágenes.');
      fileLabelText.textContent =
        'Máximo 2 imágenes. Intentalo de nuevo.';
    } else {
      this.setCustomValidity('');
      if (this.files.length === 0) {
        fileLabelText.textContent = 'Ningún archivo seleccionado';
      } else if (this.files.length === 1) {
        fileLabelText.textContent = this.files[0].name;
      } else {
        fileLabelText.textContent =
          this.files.length + ' imágenes seleccionadas';
      }
    }
  });

  // ==== PROGRESO ====
  const camposProgreso = [inputNombre, inputApellido, inputMail];

  camposProgreso.forEach(campo => {
    campo.addEventListener('input', actualizarProgreso);
  });

  radiosPoll.forEach(radio => {
    radio.addEventListener('change', function () {
      pollFeedback.classList.add('d-none');
      actualizarProgreso();
    });
  });

  function actualizarProgreso() {
    // nombre, apellido, mail, fecha, ubicación, canción favorita, poll
    const total = 7;
    let completos = 0;

    if (inputNombre.value.trim() !== '') completos++;
    if (inputApellido.value.trim() !== '') completos++;
    if (inputMail.value.trim() !== '') completos++;

    if (
      fechaHidden.value &&
      (fechaHidden.value !== 'other' ||
        inputOtraFecha.value.trim() !== '')
    ) {
      completos++;
    }

    if (ubicacionHidden.value) completos++;

    if (favHidden.value) completos++;

    if (document.querySelector('input[name="faltaCancion"]:checked')) {
      completos++;
    }

    const porcentaje = Math.round((completos / total) * 100);
    progressBar.style.width = porcentaje + '%';
    progressBar.setAttribute('aria-valuenow', porcentaje);
    progressBar.textContent = porcentaje + '%';
  }

  // ==== SUBMIT ====
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    // Validación manual de dropdowns (fecha)
    if (!fechaHidden.value) {
      fechaHidden.setCustomValidity('Seleccioná una fecha.');
      fechaBtn.classList.add('is-invalid');
    } else if (
      fechaHidden.value === 'other' &&
      inputOtraFecha.value.trim() === ''
    ) {
      fechaHidden.setCustomValidity('Seleccioná una fecha.');
      fechaBtn.classList.add('is-invalid');
    } else {
      fechaHidden.setCustomValidity('');
      fechaBtn.classList.remove('is-invalid');
    }

    // Validación manual de dropdowns (canción favorita)
    if (!favHidden.value) {
      favHidden.setCustomValidity('Elegí una canción.');
      favBtn.classList.add('is-invalid');
    } else {
      favHidden.setCustomValidity('');
      favBtn.classList.remove('is-invalid');
    }

    // Validación manual de dropdowns (ubicación en estadio)
    if (!ubicacionHidden.value) {
      ubicacionHidden.setCustomValidity('Seleccioná tu ubicación en el estadio.');
      ubicacionBtn.classList.add('is-invalid');
    } else {
      ubicacionHidden.setCustomValidity('');
      ubicacionBtn.classList.remove('is-invalid');
    }

    // Poll feedback
    if (!document.querySelector('input[name="faltaCancion"]:checked')) {
      pollFeedback.classList.remove('d-none');
    } else {
      pollFeedback.classList.add('d-none');
    }

    // Ocultar alertas antes de validar
    [alertSuccess, alertError].forEach(a => {
      a.classList.add('d-none');
      a.classList.remove('show');
    });

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      alertError.classList.remove('d-none');
      alertError.classList.add('show');
    } else {
      form.classList.add('was-validated');
      // En este punto TODO es válido → enviamos el formulario a FormSubmit
      form.submit();
    }

    actualizarProgreso();
  });

  // ==== RESET MANUAL (botón “Limpiar formulario”) ====
  resetBtn.addEventListener('click', function () {
    form.reset();
    form.classList.remove('was-validated');
    [alertSuccess, alertError].forEach(a => {
      a.classList.add('d-none');
      a.classList.remove('show');
    });
    limpiarUI();
    actualizarProgreso();
  });

  function limpiarUI() {
    // dropdown fecha
    fechaHidden.value = '';
    fechaHidden.setCustomValidity('');
    fechaBtnText.textContent =
      'Elegí fecha de Latam u otra';
    fechaBtnText.classList.add('text-muted');
    fechaBtn.classList.remove('is-invalid');
    inputOtraFecha.classList.add('d-none');
    inputOtraFecha.required = false;
    inputOtraFecha.value = '';

    // dropdown ubicación en estadio
    ubicacionHidden.value = '';
    ubicacionHidden.setCustomValidity('');
    ubicacionBtnText.textContent = 'Elegí tu ubicación';
    ubicacionBtnText.classList.add('text-muted');
    ubicacionBtn.classList.remove('is-invalid');

    // dropdown canción favorita
    favHidden.value = '';
    favHidden.setCustomValidity('');
    favBtnText.textContent = 'Elegí una canción';
    favBtnText.classList.add('text-muted');
    favBtn.classList.remove('is-invalid');

    // poll
    radiosPoll.forEach(r => (r.checked = false));
    pollFeedback.classList.add('d-none');

    // file input
    fileInput.value = '';
    fileLabelText.textContent = 'Ningún archivo seleccionado';
  }

  // Iniciar barra en 0
  actualizarProgreso();
});