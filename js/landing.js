/* Terna · js/landing.js · la landing pública (bienvenida.html; opciones-v3/PLAN-LANDING.md §8 y PLAN-LANDING-2.md §5.6)
   La página viene entera en su HTML, con los textos escritos (y en T.landing, que el banco compara), los links a LinkedIn con su
   dirección (QUIENES-SOMOS §4), los cuatro pasos abiertos y la tabla de precios completa. Este script le suma lo que solo existe
   con JavaScript:
   - siempre (no usan Terna ni T): los pasos de «Cómo funciona» que se abren de a uno (pasos), el selector de plan del celular
     (precios), la hoja del dibujo que sube con el mouse sobre un documento (documentos), el espía de la barra (espia) y lo que
     aparece al bajar (aparecer);
   - con window.Terna: el logo común (Terna.logo), el sol o la luna, «Ir a Inicio» con la sesión de la persona abierta y el diálogo
     «¿Dónde querés entrar?».
   No escribe textos propios (el selector copia el nombre de cada plan de su columna), no usa innerHTML ni pone estilos en línea:
   solo clases y atributos. No lee config, no llama a ninguna función de la base y no guarda nada salvo la marca de sesión. Sin
   window.Terna (falló supabase-js o comun.js), los textos y los links están, el logo está escrito en el HTML, cada «Entrar» lleva a
   entrar.html y falta solo el botón del modo. */
'use strict';

(function () {
  const ID_DIALOGO = 'donde-entrar';
  const SVG = 'http://www.w3.org/2000/svg';
  const consulta = (q) => (typeof window.matchMedia === 'function' ? window.matchMedia(q) : null);
  const MENOS_MOVIMIENTO = consulta('(prefers-reduced-motion: reduce)');
  const ESCRITORIO = consulta('(min-width: 64rem)');
  const PUNTERO = consulta('(hover: hover) and (pointer: fine)');
  const vale = (m) => !!(m && m.matches);

  // Un ícono del sprite (js/iconos.js), decorativo.
  function icono(id, clase) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'icono ' + clase);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  // 1. «Cómo funciona» (PLAN-LANDING-2 §5.1 y §5.2): en cada paso, el título pasa a ser un botón dentro de su h3 (se mueven los
  // nodos, no se copia texto), con aria-controls a su panel y aria-expanded. Uno abierto por vez. Hasta 1024, un acordeón: tocar
  // abre ese paso y cierra el otro, tocar el abierto lo cierra. Desde 1024, cuatro carpetas en fila: el clic, el foco y el mouse
  // quieto 90 ms abren; el único abierto no se cierra. Al cambiar de modo, si no hay ninguno abierto se abre el primero.
  function pasos() {
    const lista = document.getElementById('ld-pasos');
    if (!lista || lista.classList.contains('ld-vivo')) return;
    const todos = [];
    for (const li of lista.querySelectorAll(':scope > .ld-paso')) {
      const titulo = li.querySelector('.ld-paso-titulo');
      const panel = li.querySelector('.ld-paso-panel');
      if (!titulo || !panel || !panel.id) continue;
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ld-paso-boton';
      while (titulo.firstChild) boton.appendChild(titulo.firstChild);
      boton.appendChild(icono('i-chevron', 'ld-paso-chevron'));
      boton.setAttribute('aria-controls', panel.id);
      boton.setAttribute('aria-expanded', 'false');
      titulo.appendChild(boton);
      todos.push({ li, boton });
    }
    if (!todos.length) return;
    let abierto = -1;
    let espera = 0;
    function abrir(n) {
      abierto = n;
      todos.forEach((p, i) => {
        p.li.classList.toggle('activo', i === n);
        p.boton.setAttribute('aria-expanded', i === n ? 'true' : 'false');
      });
      if (n >= 0) lista.setAttribute('data-activo', String(n)); else lista.removeAttribute('data-activo');
    }
    todos.forEach((p, i) => {
      p.boton.addEventListener('click', () => {
        if (vale(ESCRITORIO)) { if (abierto !== i) abrir(i); } else abrir(abierto === i ? -1 : i);
      });
      // Desde 1024, el foco abre (no cambia el contexto: no mueve el foco ni la página).
      p.boton.addEventListener('focus', () => { if (vale(ESCRITORIO) && abierto !== i) abrir(i); });
      // Desde 1024 y con mouse: abre después de 90 ms quieto encima; al salir, queda abierto el último.
      const quieto = () => {
        clearTimeout(espera);
        if (!vale(ESCRITORIO) || !vale(PUNTERO) || abierto === i) return;
        espera = setTimeout(() => { if (vale(ESCRITORIO) && abierto !== i) abrir(i); }, 90);
      };
      p.li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') quieto(); });
      p.li.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') quieto(); });
      p.li.addEventListener('pointerleave', () => clearTimeout(espera));
    });
    lista.classList.add('ld-vivo');
    abrir(0);
    if (ESCRITORIO && typeof ESCRITORIO.addEventListener === 'function') {
      ESCRITORIO.addEventListener('change', () => { if (abierto < 0) abrir(0); });
    }
  }

  // 2. Precios en el celular (§5.5): un selector con los cuatro planes, antes de la tabla, y data-plan en la tabla; el CSS, hasta
  // 768, muestra la columna de los rótulos y la del plan elegido (desde 768 el selector no se ve y la tabla va entera). El texto de
  // cada botón es el nombre del plan de su columna; el nombre del grupo, el <span hidden> de precios.elegir. Arranca en el plan
  // destacado, Búsqueda activa, la que trae todo.
  function precios() {
    const marco = document.querySelector('.ld-tabla-marco');
    const tabla = marco && marco.querySelector('.ld-tabla');
    if (!tabla || tabla.hasAttribute('data-plan')) return;
    const cabezas = Array.from(tabla.querySelectorAll('thead th'));
    if (!cabezas.length) return;
    const grupo = document.createElement('div');
    grupo.className = 'ld-selector';
    grupo.setAttribute('role', 'group');
    if (document.getElementById('ld-elegir')) grupo.setAttribute('aria-labelledby', 'ld-elegir');
    const botones = cabezas.map((th, i) => {
      const nombre = th.querySelector('.ld-plan-nombre');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = nombre ? nombre.textContent : '';
      if (nombre && nombre.hasAttribute('data-t')) b.setAttribute('data-t', nombre.getAttribute('data-t'));
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => elegir(i));
      grupo.appendChild(b);
      return b;
    });
    function elegir(n) {
      tabla.setAttribute('data-plan', String(n));
      botones.forEach((b, i) => b.setAttribute('aria-pressed', i === n ? 'true' : 'false'));
    }
    marco.before(grupo);
    const destacado = cabezas.findIndex((th) => th.classList.contains('ld-plan-destacado'));
    elegir(destacado >= 0 ? destacado : cabezas.length - 1);
    // El marco es una parada de Tab solo cuando hay algo que deslizar (FEEDBACK-LANDING-2 punto 10): con el selector o desde 768
    // la tabla entra entera y el Tab no se detiene en una caja que no hace nada.
    const parada = () => {
      if (marco.scrollWidth > marco.clientWidth + 1) marco.setAttribute('tabindex', '0'); else marco.removeAttribute('tabindex');
    };
    // Se mira después de cada cambio de tamaño ya acomodado (ResizeObserver; el evento resize llega antes de que cambien los cortes).
    parada();
    if ('ResizeObserver' in window) {
      const obs = new ResizeObserver(parada);
      obs.observe(marco);
      obs.observe(tabla);
    } else {
      window.addEventListener('resize', () => requestAnimationFrame(parada));
    }
  }

  // 3. «Qué trae un paquete» (§5.3): con el mouse sobre un documento, su hoja del dibujo sube (data-doc-activo en el dibujo). Es un
  // adorno de puntero: no hay nada que enfocar ni estado que anunciar.
  function documentos() {
    const dibujo = document.querySelector('.ld-il-paquete');
    if (!dibujo) return;
    for (const doc of document.querySelectorAll('.ld-paquete .ld-doc[data-doc]')) {
      const n = doc.getAttribute('data-doc');
      doc.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dibujo.setAttribute('data-doc-activo', n); });
      doc.addEventListener('pointerleave', () => { if (dibujo.getAttribute('data-doc-activo') === n) dibujo.removeAttribute('data-doc-activo'); });
    }
  }

  // 4. El espía de la barra (§5.4): aria-current="true" en el link de la sección que cruza el medio de la pantalla; se lo saca a los
  // otros. Los links se ven desde 768. Si se saca una sección, el espía toma las que quedan.
  function espia() {
    if (!('IntersectionObserver' in window)) return;
    const links = Array.from(document.querySelectorAll('.ld-secciones a[href^="#"]'));
    const porSeccion = new Map();
    for (const a of links) {
      const seccion = document.getElementById(a.getAttribute('href').slice(1));
      if (seccion) porSeccion.set(seccion, a);
    }
    if (!porSeccion.size) return;
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const a = porSeccion.get(e.target);
        if (!a) continue;
        if (e.isIntersecting) {
          for (const otro of links) if (otro !== a) otro.removeAttribute('aria-current');
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current') === 'true') {
          a.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (const seccion of porSeccion.keys()) obs.observe(seccion);
  }

  // 5. Aparecer al bajar (§4.2): solo con IntersectionObserver y si la persona no pidió menos movimiento. Lo que al cargar está
  // debajo de la pantalla espera (ld-espera) y aparece al entrar (ld-visto); lo que ya está a la vista no se toca (sin parpadeo).
  // Cuando terminó de aparecer, vuelve a sus propias reglas (se le sacan las dos clases). Red de seguridad: a los 4 segundos, lo que
  // está en la pantalla y sigue esperando aparece.
  function aparecer() {
    if (vale(MENOS_MOVIMIENTO) || !('IntersectionObserver' in window)) return;
    const alto = () => window.innerHeight || document.documentElement.clientHeight;
    const esperan = Array.from(document.querySelectorAll('.ld-aparece')).filter((el) => el.getBoundingClientRect().top > alto());
    if (!esperan.length) return;
    let obs = null;
    const ver = (el) => {
      if (obs) obs.unobserve(el);
      if (!el.classList.contains('ld-espera') || el.classList.contains('ld-visto')) return;
      el.classList.add('ld-visto');
      setTimeout(() => el.classList.remove('ld-espera', 'ld-visto'), 1400);
    };
    obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) ver(e.target);
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    for (const el of esperan) {
      el.classList.add('ld-espera');
      obs.observe(el);
    }
    setTimeout(() => {
      for (const el of esperan) {
        if (!el.classList.contains('ld-espera')) continue;
        const r = el.getBoundingClientRect();
        if (r.top < alto() && r.bottom > 0) ver(el);
      }
    }, 4000);
  }

  // 6. El logo común y el sol o la luna (un solo .btn-tema en la página, como pide el banco). El HTML trae el logo escrito, para
  // cuando no hay JavaScript (FEEDBACK-LANDING P3-10); acá se reemplaza por el de Terna.logo, que es el que manda.
  function cascara() {
    const logo = document.getElementById('ld-logo');
    if (logo) logo.replaceChildren(...Terna.logo());
    const acciones = document.querySelector('.ld-acciones');
    if (acciones && !acciones.querySelector('.btn-tema')) acciones.prepend(Terna.botonTema('btn-barra'));
  }

  // 7. Con la sesión de la persona abierta, el «Entrar» de la barra pasa a «Ir a Inicio» y no abre el diálogo (los otros
  // sí, por si quiere entrar del lado de quien contrata), y lo que es para quien no tiene cuenta (data-sin-sesion: «Ya tengo
  // cuenta» del título) se oculta (FEEDBACK-LANDING P3-10). Escribe la marca terna.sesion, la que mira js/puerta.js en la raíz. Si
  // getSession falla, queda todo como sin sesión. También se oculta «¿No tenés cuenta? Ver planes» del diálogo. Los botones de los
  // planes, «Probar 7 días», «Comprar» y «Publicar un aviso» (data-accion) no tienen efecto todavía (D4 de PLAN-LANDING-2): este
  // script no los toca.
  async function sesion() {
    let abierta = null;
    try {
      const { data } = await Terna.sb.auth.getSession();
      abierta = data && data.session;
    } catch (e) {
      return;
    }
    if (!abierta) return;
    try { localStorage.setItem('terna.sesion', '1'); } catch (e) { /* sin almacenamiento */ }
    for (const el of document.querySelectorAll('[data-sin-sesion]')) el.hidden = true;
    const entrar = document.querySelector('.ld-barra [data-abre="' + ID_DIALOGO + '"]');
    if (!entrar || !window.T || !T.landing) return;
    entrar.textContent = T.landing.barra.irAInicio;
    entrar.setAttribute('href', 'index.html');
    entrar.setAttribute('data-t', 'landing.barra.irAInicio');
    entrar.removeAttribute('data-abre');
  }

  // 8. El diálogo. Lo abre todo [data-abre="donde-entrar"] (en el HTML, links a entrar.html: sin este script, navegan). Un clic con
  // una tecla modificadora (abrir en otra pestaña) sigue siendo un link. El foco arranca en «Busco trabajo»; Esc cierra (nativo),
  // la cruz y el clic fuera del recuadro también; al cerrar, el foco vuelve a lo que lo abrió. «¿No tenés cuenta? Ver planes»
  // (FEEDBACK-LANDING-2 punto 8) es un link a #precios: cierra el diálogo, el link sigue su camino y el foco queda en el título de
  // Precios, sin mover la página.
  function dialogo() {
    const dlg = document.getElementById(ID_DIALOGO);
    if (!dlg || typeof dlg.showModal !== 'function') return;
    let origen = null;
    let destino = null;
    document.addEventListener('click', (e) => {
      const abre = e.target instanceof Element ? e.target.closest('[data-abre="' + ID_DIALOGO + '"]') : null;
      if (!abre || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (dlg.open) return;
      origen = abre;
      dlg.showModal();
      const primera = dlg.querySelector('.ld-opcion');
      if (primera) primera.focus();
    });
    // Fuera del recuadro: el clic cae en el <dialog> (su fondo), pero también cae ahí el que toca su relleno; se mira la posición.
    dlg.addEventListener('click', (e) => {
      const salida = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (salida) {
        const seccion = document.getElementById(salida.getAttribute('href').slice(1));
        destino = seccion ? seccion.querySelector('h2') : null;
        dlg.close();
        return;
      }
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    const cerrar = dlg.querySelector('.ld-donde-cerrar');
    if (cerrar) cerrar.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => {
      const volver = origen;
      origen = null;
      if (destino) {
        const titulo = destino;
        destino = null;
        titulo.setAttribute('tabindex', '-1');
        titulo.focus({ preventScroll: true });
        return;
      }
      Terna.devolverFoco(volver);
    });
  }

  function armar() {
    // Primero lo que cambia el alto de la página (los pasos se pliegan, el selector entra), después lo que mide.
    pasos();
    precios();
    documentos();
    espia();
    aparecer();
    if (!window.Terna) return;
    cascara();
    dialogo();
    sesion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
})();
