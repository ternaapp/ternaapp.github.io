/* Terna · js/comun.js
   Lo que usan todas las páginas: el cliente de Supabase, la sesión y sus redirecciones, la cáscara (la barra, que desde 64rem es
   el carril, el muelle del celular y la hoja de Cuenta), las bandas, los avisos breves, la hoja/cajón de las fichas, los
   diálogos y el formato de fechas y números. Sin framework. Los datos de una persona nunca se escriben como HTML: todo va por
   textContent (función h). La forma de la cáscara es la de B2 «Sello» (opciones-v3/PLAN-WEB.md §2.1). */
'use strict';

window.Terna = (function () {
  const CONFIG = {
    url: 'https://dgkroxrgprpsxrjyfepn.supabase.co',
    clave: 'sb_publishable_Oav7O3oFq_bjUkTmNWWhTQ_gqwKmUk1', // pública: la protección es la RLS de la base
    smtp: true, // SMTP de Gmail configurado en Supabase el 29/10/2026 (qa.md §7.1, paso 4); con false, "Olvidé mi contraseña" muestra el texto para escribirle a Francisco (brand.md §6.2)
    zona: 'America/Argentina/Buenos_Aires',
    bucket: 'documentos',
  };
  // Desde PLAN-UX §2.1 (21/11/2026) busqueda.html es «Empleos» y avisos.html es «Paquetes»: los archivos y las claves no cambian,
  // cambian los nombres (T.comun.pestanas). Cómo funciona es la página 13 (como-funciona.html; su nombre es T.comun.pestanas.comoFunciona).
  const PAGINAS = {
    inicio: 'index.html', busqueda: 'busqueda.html', avisos: 'avisos.html', postulaciones: 'postulaciones.html', perfil: 'perfil.html',
    preferencias: 'preferencias.html', invitaciones: 'invitaciones.html', alertas: 'alertas.html', como: 'como-funciona.html',
  };
  // Desde operacion.md 0.2 (20/11/2026) no hay pestaña ni página de Admin: quien administra Terna es una persona más en esta web
  // y lo de admin vive en ops.html, con su sesión y el segundo paso (0054).
  // Páginas sin pestaña propia: marcan la de la sección a la que pertenecen (las guías de alertas son de Preferencias).
  const PESTANA_DE = { alertas: 'preferencias' };
  const ICONOS_PESTANAS = {
    inicio: 'i-inicio', busqueda: 'i-buscar', avisos: 'i-paquete', postulaciones: 'i-postulaciones', perfil: 'i-perfil',
    preferencias: 'i-preferencias', invitaciones: 'i-sobre', como: 'i-preguntar',
  };
  // La clave del texto de una pestaña, cuando no es la de la página.
  const TEXTO_PESTANA = { como: 'comoFunciona' };
  function nombrePestana(clave) { return T.comun.pestanas[TEXTO_PESTANA[clave] || clave]; }
  // El muelle del celular (PLAN-UX §2.1): cuatro destinos, en el orden del recorrido de un aviso. Desde PLAN-UX Empleos está en el
  // muelle y marca lo suyo (hasta ahí se entraba desde Avisos y quedaba marcado Avisos); Cuenta pasó a la barra de arriba, a la
  // izquierda del sol o la luna, y lo de la cuenta se entra desde su hoja.
  const MUELLE = ['inicio', 'busqueda', 'avisos', 'postulaciones'];
  const DE_CUENTA = new Set(['perfil', 'preferencias', 'invitaciones', 'alertas', 'como']);
  const CLAVE_TOCAN = 'terna.tocan';
  const CLAVE_PAQUETES = 'terna.paquetes';
  const SVG = 'http://www.w3.org/2000/svg';

  // El hash antes de que supabase-js lo lea y lo limpie (link de cambio de contraseña: #...&type=recovery).
  const hashInicial = location.hash;
  const sb = window.supabase.createClient(CONFIG.url, CONFIG.clave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });

  const estado = { pagina: null, sesion: null, usuario: null, perfil: null, faltantes: [], config: null, saliendo: false, descargando: false };
  // Al irse de la página, los pedidos en vuelo se cortan: eso no es un error para mostrar.
  addEventListener('pagehide', () => { estado.descargando = true; });
  addEventListener('pageshow', () => { estado.descargando = false; });

  /* ---------- DOM ---------- */
  const PROPIEDADES = new Set(['checked', 'value', 'disabled', 'hidden', 'selected', 'readOnly', 'required', 'multiple', 'indeterminate']);
  function h(tag, props, ...hijos) {
    const el = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'css') for (const c of Object.keys(v)) el.style.setProperty(c, v[c]);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (PROPIEDADES.has(k)) el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    agregar(el, hijos);
    return el;
  }
  function agregar(el, hijos) {
    for (const hijo of hijos.flat(Infinity)) {
      if (hijo === null || hijo === undefined || hijo === false) continue;
      el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    }
    return el;
  }
  function vaciar(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }
  function icono(id, clase) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'icono' + (clase ? ' ' + clase : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }
  function oculto(texto) { return h('span', { class: 'oculto-visual', text: texto }); }
  let contadorId = 0;
  function idUnico(prefijo) { contadorId += 1; return (prefijo || 'id') + '-' + contadorId; }

  /* ---------- Formato (America/Argentina/Buenos_Aires) ---------- */
  const fFecha = new Intl.DateTimeFormat('es-AR', { timeZone: CONFIG.zona, day: 'numeric', month: 'numeric' });
  const fFechaLarga = new Intl.DateTimeFormat('es-AR', { timeZone: CONFIG.zona, day: 'numeric', month: 'numeric', year: 'numeric' });
  const fHora = new Intl.DateTimeFormat('es-AR', { timeZone: CONFIG.zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const fISO = new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.zona, year: 'numeric', month: '2-digit', day: '2-digit' });
  const fNumero = new Intl.NumberFormat('es-AR');
  const fDecimal = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Una fecha sola ('2026-10-22') es del calendario local; un instante (timestamptz) se pasa a Buenos Aires.
  const esSoloFecha = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
  function aFechaLocal(x) { return esSoloFecha(x) ? x : fISO.format(new Date(x)); }
  function hoy() { return fISO.format(new Date()); }
  function sumarDias(fecha, dias) {
    const d = new Date(fecha + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
  }
  function diasEntre(desde, hasta) {
    return Math.round((Date.parse(hasta + 'T12:00:00Z') - Date.parse(desde + 'T12:00:00Z')) / 86400000);
  }
  function fechaCorta(x) {
    if (!x) return '';
    if (esSoloFecha(x)) { const [, m, d] = x.split('-'); return Number(d) + '/' + Number(m); }
    return fFecha.format(new Date(x));
  }
  function fechaLarga(x) {
    if (!x) return '';
    if (esSoloFecha(x)) { const [a, m, d] = x.split('-'); return Number(d) + '/' + Number(m) + '/' + a; }
    return fFechaLarga.format(new Date(x));
  }
  function hora(x) { return x ? fHora.format(new Date(x)) : ''; }
  // "hoy", "ayer", "hace {n} días"; lo futuro (o lo que no se sabe), como fecha corta.
  function relativa(x) {
    if (!x) return '';
    const d = diasEntre(aFechaLocal(x), hoy());
    if (d === 0) return T.avisos.hoy;
    if (d === 1) return T.avisos.ayer;
    if (d > 1) return T.avisos.haceDias(d);
    return fechaCorta(x);
  }
  function numero(x) { return x === null || x === undefined ? '' : fNumero.format(x); }
  function decimal(x) { return x === null || x === undefined ? '' : fDecimal.format(x); }

  /* ---------- Almacenamiento local (solo comodidades: filtros, período) ---------- */
  function leerLocal(clave, defecto) {
    try { const v = window.localStorage.getItem('terna.' + clave); return v === null ? defecto : JSON.parse(v); } catch (e) { return defecto; }
  }
  function guardarLocal(clave, valor) {
    try { window.localStorage.setItem('terna.' + clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  /* ---------- Errores ---------- */
  function esErrorDeSesion(error) {
    if (!error) return false;
    const msg = String(error.message || '');
    return error.status === 401 || error.code === 'PGRST301' || error.code === 'PGRST303' || /JWT/i.test(msg);
  }
  function textoError(error) {
    if (!error) return T.errores.general;
    if (esErrorDeSesion(error)) return T.errores.sesion;
    return T.errorDeClave(String(error.message || '').trim(), estado.config);
  }
  function siSesionVencida(error) {
    if (esErrorDeSesion(error)) { irAEntrar('sesion'); return true; }
    return false;
  }

  /* ---------- Navegación y sesión ---------- */
  function paginaActual() {
    const archivo = location.pathname.split('/').pop() || 'index.html';
    return Object.values(PAGINAS).includes(archivo) ? archivo : 'index.html';
  }
  function irAEntrar(motivo) {
    if (estado.saliendo) return;
    estado.saliendo = true;
    const q = new URLSearchParams();
    const volver = paginaActual() + (/^#[a-z0-9-]+$/i.test(location.hash) ? location.hash : '');
    if (volver !== 'index.html') q.set('volver', volver);
    if (motivo) q.set('motivo', motivo);
    const s = q.toString();
    location.replace('entrar.html' + (s ? '?' + s : ''));
  }
  // Solo deja volver a una página propia, con un hash simple.
  function volverValido(valor) {
    return /^(index|busqueda|avisos|postulaciones|perfil|preferencias|invitaciones|alertas|como-funciona)\.html(#[a-z0-9-]+)?$/i.test(valor || '') ? valor : 'index.html';
  }
  async function salir() {
    estado.saliendo = true;
    try { sessionStorage.removeItem(CLAVE_TOCAN); sessionStorage.removeItem(CLAVE_PAQUETES); } catch (e) { /* sin almacenamiento */ }
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual se sale */ }
    location.replace('entrar.html');
  }
  sb.auth.onAuthStateChange((evento, sesion) => {
    if (sesion) estado.sesion = sesion;
    if (evento === 'SIGNED_OUT' && estado.usuario && !estado.saliendo) irAEntrar('sesion');
  });
  function token() { return estado.sesion ? estado.sesion.access_token : null; }

  /* ---------- La cáscara: barra (carril desde 64rem), muelle y hoja de Cuenta (PLAN-WEB.md §2.1) ---------- */
  // El logo: los tres trazos en línea (no por el sprite), para que cada uno tome su tinta: sello, medio y lila.
  function marca(clase) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'icono logo-marca' + (clase ? ' ' + clase : ''));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const [c, d] of [['trazo-1', 'M3 6h18'], ['trazo-2', 'M3 12h12'], ['trazo-3', 'M3 18h7']]) {
      const trazo = document.createElementNS(SVG, 'path');
      trazo.setAttribute('class', c);
      trazo.setAttribute('d', d);
      svg.appendChild(trazo);
    }
    return svg;
  }
  // Un solo DOM para la barra del celular y el carril de escritorio: el CSS decide qué se ve. .pestanas tiene como hijos solo los
  // links (ocho desde PLAN-UX §2.1, los mismos para todos) y en #barra hay un solo .btn-tema (el banco lo controla).
  function dibujarBarra(pagina) {
    const cont = document.getElementById('barra');
    if (!cont) return;
    vaciar(cont);
    const nav = h('nav', { class: 'pestanas', 'aria-label': T.comun.navegacion });
    // Desde busqueda.md 0.1 (16/11/2026), Búsqueda (desde PLAN-UX, Empleos) va segunda: de lo más ancho (todo lo abierto) a lo tuyo
    // (Paquetes) y a lo que se postula. Desde PLAN-UX §2.1, Cómo funciona cierra lo de la cuenta.
    for (const clave of ['inicio', 'busqueda', 'avisos', 'postulaciones', 'perfil', 'preferencias', 'invitaciones', 'como']) nav.append(pestana(clave, pagina));
    const nombre = h('span', { class: 'cuenta-nombre', id: 'cuenta-nombre' });
    const barra = h('div', { class: 'barra' },
      h('a', { class: 'logo', href: 'index.html', 'aria-label': T.comun.logo },
        marca(), h('span', { class: 'logo-palabra', 'aria-hidden': 'true', text: 'terna' })),
      nav,
      h('div', { class: 'cuenta' }, nombre, botonCuenta(pagina), botonTema('btn-barra'),
        h('button', { class: 'btn btn-texto btn-barra btn-salir', type: 'button', onclick: salir }, icono('i-salir'), T.comun.salir)));
    cont.append(barra);
    pintarCuentas();
  }
  /* El botón de Cuenta de la barra del celular (PLAN-UX §2.1): el ícono de la persona, a la izquierda del sol o la luna, que abre la
     hoja de Cuenta. Lleva el punto ámbar cuando al perfil le falta algo (pintarCuentas), como el chip «Falta» del carril; desde
     64rem no se ve, porque el carril tiene todo. data-destino="cuenta" es el que tenía en el muelle. */
  function botonCuenta(pagina) {
    return h('button', { class: 'btn btn-texto btn-barra btn-cuenta', id: 'btn-cuenta', type: 'button', 'aria-haspopup': 'dialog',
      'aria-current': DE_CUENTA.has(pagina) ? 'true' : null, title: T.comun.cuentaAccesible, dataset: { destino: 'cuenta' },
      onclick: (e) => abrirCuenta(e.currentTarget) },
    h('span', { class: 'persona-pastilla' }, icono('i-perfil')), h('span', { class: 'oculto-visual', text: T.comun.cuentaAccesible }));
  }
  /* El sol o la luna (diseno.md 0.30 §10.19): muestra el modo al que pasa y lo dice en su nombre. El modo lo guarda y lo
     aplica js/tema.js; acá solo está el botón, que se repinta cuando el modo cambia (por este botón, por otra pestaña o
     porque cambió el dispositivo). */
  function pintarTema(b) {
    const oscuro = !!window.TernaTema && window.TernaTema.actual() === 'oscuro';
    const nombre = oscuro ? T.comun.tema.aClaro : T.comun.tema.aOscuro;
    vaciar(b);
    b.append(icono(oscuro ? 'i-sol' : 'i-luna'));
    b.setAttribute('aria-label', nombre);
    b.setAttribute('title', nombre);
  }
  function botonTema(clase) {
    const b = h('button', { class: 'btn btn-texto btn-tema' + (clase ? ' ' + clase : ''), type: 'button',
      onclick: () => { if (window.TernaTema) window.TernaTema.alternar(); } });
    pintarTema(b);
    return b;
  }
  document.addEventListener('terna:tema', () => { for (const b of document.querySelectorAll('.btn-tema')) pintarTema(b); });
  // aria-current: 'page' en la página propia; 'true' en la sección dueña (las guías de alertas marcan Preferencias).
  function actualDe(clave, pagina) { return clave === pagina ? 'page' : (clave === PESTANA_DE[pagina] ? 'true' : null); }
  function pestana(clave, pagina) {
    return h('a', { class: 'pestana', href: PAGINAS[clave], 'aria-current': actualDe(clave, pagina), dataset: { pestana: clave } },
      icono(ICONOS_PESTANAS[clave]), h('span', { text: nombrePestana(clave) }));
  }
  function completarBarra() {
    const nombre = document.getElementById('cuenta-nombre');
    if (nombre) nombre.textContent = nombrePersona();
    pintarCuentas();
  }
  function nombrePersona() { return (estado.perfil && estado.perfil.nombre) || (estado.usuario && estado.usuario.mail) || ''; }

  // El muelle (celular, hasta 64rem): Inicio, Empleos, Paquetes y Postulaciones, al final del <body> (lo último del orden de foco).
  // Cada destino marca solo lo suyo; lo de la cuenta lo marca el botón de Cuenta de la barra. Sus links no llevan la clase pestana.
  // Desde PLAN-UX §2.1 Cuenta no está acá: subió a la barra (botonCuenta).
  function dibujarMuelle(pagina) {
    const viejo = document.getElementById('muelle');
    if (viejo) viejo.remove();
    const destino = (clave) => h('a', { class: 'muelle-destino', href: PAGINAS[clave], 'aria-current': clave === pagina ? 'page' : null, dataset: { destino: clave } },
      h('span', { class: 'muelle-pastilla' }, icono(ICONOS_PESTANAS[clave])), h('span', { class: 'muelle-nombre', text: nombrePestana(clave) }));
    document.body.append(h('nav', { class: 'muelle', id: 'muelle', 'aria-label': T.comun.navegacion }, MUELLE.map(destino)));
    pintarCuentas();
  }
  // La hoja de Cuenta: las secciones que no van en el muelle, quién sos y Salir. El modo no se repite: está en la barra.
  // Desde PLAN-UX §3.5 suma la fila «Cómo funciona», después de Invitaciones.
  function abrirCuenta(origen) {
    const fila = (clave, extra) => h('a', { class: 'menu-fila', href: PAGINAS[clave], 'aria-current': actualDe(clave, estado.pagina) },
      icono(ICONOS_PESTANAS[clave]), h('span', null, nombrePestana(clave), extra || null), icono('i-adelante'));
    const falta = estado.faltantes.length
      ? h('small', null, icono('i-por-decidir', 'icono-14'), T.perfil.falta(listaFaltantes(estado.faltantes))) : null;
    const filas = [fila('perfil', falta), fila('preferencias'), fila('invitaciones'), fila('como')];
    const persona = nombrePersona();
    abrirHoja({ titulo: T.comun.cuenta, clase: 'hoja-chica', origen,
      cuerpo: h('div', { class: 'filas menu' }, filas, h('hr', { class: 'menu-separador' }),
        persona ? h('p', { class: 'menu-persona', text: persona }) : null,
        h('button', { class: 'menu-fila', type: 'button', onclick: salir }, icono('i-salir'), h('span', { text: T.comun.salir }))) });
  }

  /* Lo que te toca, en el muelle y en el carril (PLAN-WEB.md §2.1): el número lo conocen Inicio (mi_resumen) y Postulaciones (su
     lista), que lo pasan con Terna.cuentaToca(n); las demás páginas muestran el último de la sesión. Con 0 o sin dato, nada.
     «Falta» en Mi perfil sale de estado.faltantes. Los números se agregan solo cuando hay algo: el texto de una pestaña sin
     nada para hacer sigue siendo su nombre. */
  function leerTocan() {
    try {
      const n = Number(sessionStorage.getItem(CLAVE_TOCAN));
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    } catch (e) {
      return 0;
    }
  }
  function cuentaToca(n) {
    const x = Number(n);
    const valor = Number.isFinite(x) && x > 0 ? Math.round(x) : 0;
    try {
      if (valor) sessionStorage.setItem(CLAVE_TOCAN, String(valor));
      else sessionStorage.removeItem(CLAVE_TOCAN);
    } catch (e) { /* sin almacenamiento: vale hasta que se cambie de página */ }
    pintarCuentas(valor);
  }
  /* Las cuentas de Paquetes (PLAN-UX §2.1; decisión D3): dos señales, dos colores. Lila, los paquetes nuevos (armados desde la última
     visita a Paquetes › Armados: no te piden nada); ámbar, los avisos por decidir (te tocan). Con la misma memoria de sesión que lo
     que te toca: Inicio y Paquetes las pasan con Terna.cuentaPaquetes y las demás páginas muestran las últimas. */
  const numeroValido = (x) => { const v = Number(x); return Number.isFinite(v) && v > 0 ? Math.round(v) : 0; };
  function leerPaquetes() {
    try {
      const v = JSON.parse(sessionStorage.getItem(CLAVE_PAQUETES) || 'null') || {};
      return { nuevos: numeroValido(v.nuevos), porDecidir: numeroValido(v.porDecidir) };
    } catch (e) {
      return { nuevos: 0, porDecidir: 0 };
    }
  }
  // cuentaPaquetes({ nuevos, porDecidir }): guarda y pinta las dos cuentas de Paquetes en el muelle y el carril. Lo que no se pasa
  // (undefined) queda como estaba; 0 o null lo saca. Devuelve las dos cuentas como quedaron.
  let paquetesSinMemoria = null;
  function cuentaPaquetes(cuentas) {
    const c = cuentas || {};
    const antes = paquetesSinMemoria || leerPaquetes();
    const valor = {
      nuevos: c.nuevos === undefined ? antes.nuevos : numeroValido(c.nuevos),
      porDecidir: c.porDecidir === undefined ? antes.porDecidir : numeroValido(c.porDecidir),
    };
    try {
      if (valor.nuevos || valor.porDecidir) sessionStorage.setItem(CLAVE_PAQUETES, JSON.stringify(valor));
      else sessionStorage.removeItem(CLAVE_PAQUETES);
      paquetesSinMemoria = null;
    } catch (e) { paquetesSinMemoria = valor; /* sin almacenamiento: vale hasta que se cambie de página */ }
    pintarCuentas(undefined, valor);
    return valor;
  }
  function quitarCuentas(nodo) { if (nodo) for (const x of nodo.querySelectorAll('.cuenta-toca, .cuenta-nuevos, .cuenta-toca-texto, .chip-carril, .muelle-cuentas, .cuenta-punto')) x.remove(); }
  // Lo que se pinta en una pestaña del carril y en un destino del muelle: los números (aria-hidden) y su texto para el lector de
  // pantalla. En el muelle los números van juntos, arriba a la derecha de la pastilla (.muelle-cuentas).
  function ponerCuentas(clave, numeros, texto) {
    const lista = numeros.filter(([n]) => n > 0);
    const p = document.querySelector('.pestana[data-pestana="' + clave + '"]');
    const m = document.querySelector('.muelle-destino[data-destino="' + clave + '"]');
    quitarCuentas(p);
    quitarCuentas(m);
    if (!lista.length) return;
    const numero = ([n, clase]) => h('span', { class: clase, 'aria-hidden': 'true', text: fNumero.format(n) });
    if (p) p.append(...lista.map(numero), h('span', { class: 'oculto-visual cuenta-toca-texto', text: texto }));
    if (m) {
      m.querySelector('.muelle-pastilla').append(h('span', { class: 'muelle-cuentas', 'aria-hidden': 'true' }, lista.map(numero)));
      m.append(h('span', { class: 'oculto-visual cuenta-toca-texto', text: texto }));
    }
  }
  function pintarCuentas(forzado, forzadoPaquetes) {
    const n = forzado === undefined ? leerTocan() : forzado;
    ponerCuentas('postulaciones', [[n, 'cuenta-toca']], ', ' + T.postulaciones.partes.tocan(n));
    const q = forzadoPaquetes || paquetesSinMemoria || leerPaquetes();
    ponerCuentas('avisos', [[q.porDecidir, 'cuenta-toca'], [q.nuevos, 'cuenta-nuevos']],
      (q.nuevos ? T.comun.paquetesNuevos(q.nuevos) : '') + (q.porDecidir ? T.comun.porDecidirCuenta(q.porDecidir) : ''));
    // «Falta» en Mi perfil: el chip en el carril y el punto ámbar en el botón de Cuenta de la barra.
    const faltaTexto = estado.faltantes.length ? ', ' + T.perfil.falta(listaFaltantes(estado.faltantes)) : '';
    const pPerfil = document.querySelector('.pestana[data-pestana="perfil"]');
    quitarCuentas(pPerfil);
    if (pPerfil && faltaTexto) {
      pPerfil.append(h('span', { class: 'chip chip-toca chip-carril', 'aria-hidden': 'true' }, icono('i-por-decidir', 'icono-14'), T.perfil.faltaCorto),
        h('span', { class: 'oculto-visual cuenta-toca-texto', text: faltaTexto }));
    }
    const bCuenta = document.getElementById('btn-cuenta');
    quitarCuentas(bCuenta);
    if (bCuenta && faltaTexto) bCuenta.append(h('span', { class: 'cuenta-punto', 'aria-hidden': 'true' }), h('span', { class: 'oculto-visual cuenta-toca-texto', text: faltaTexto }));
  }
  // El pie: desde PLAN-UX §3.5 el lema y la línea de privacidad salen de las páginas con sesión y quedan en Entrar, Crear cuenta y
  // Contraseña, que los traen en su HTML. Con sesión no dibuja nada (el <footer class="pie"> vacío no ocupa lugar: css/terna.css).
  // Queda exportada por si una página sin sesión la usa.
  function dibujarPie() {
    if (estado.pagina) return;
    const pie = document.querySelector('.pie');
    if (pie && !pie.firstChild) pie.append(h('p', null, T.comun.pie1, h('br'), T.comun.pie2));
  }

  /* ---------- Bandas (§10.10): una por vez; sin conexión, pausada, perfil incompleto ---------- */
  function bandas() {
    const cont = document.getElementById('bandas');
    if (!cont) return;
    vaciar(cont);
    if (!navigator.onLine) {
      cont.append(h('div', { class: 'banda banda-error' }, icono('i-sin-conexion'), h('span', { text: T.bandas.sinConexion })));
      return;
    }
    if (!estado.usuario) return;
    if (estado.usuario.estado === 'pausado') {
      cont.append(h('div', { class: 'banda' }, icono('i-pausar'), h('span', { text: T.bandas.pausada }),
        h('button', { class: 'btn', type: 'button', onclick: (e) => cambiarEstadoCuenta('activo', e.currentTarget) }, T.bandas.reanudar)));
      return;
    }
    // En Inicio el mismo texto va en el contenido (brand.md §6.11) y en Mi perfil está el indicador: ahí no hay banda.
    if (estado.faltantes.length && estado.pagina !== 'perfil' && estado.pagina !== 'inicio') {
      cont.append(h('div', { class: 'banda' }, icono('i-por-decidir'), h('span', { text: T.bandas.incompleto(listaFaltantes(estado.faltantes)) }),
        h('a', { class: 'btn', href: 'perfil.html' }, T.bandas.completar)));
    }
  }
  function listaFaltantes(faltantes) {
    const partes = faltantes.map((f) => T.faltantes[f]).filter(Boolean);
    if (partes.length <= 1) return partes.join('');
    return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
  }
  async function cambiarEstadoCuenta(nuevo, boton) {
    if (boton) boton.setAttribute('aria-disabled', 'true');
    const { error } = await sb.from('usuarios').update({ estado: nuevo }).eq('id', estado.usuario.id);
    if (boton) boton.removeAttribute('aria-disabled');
    if (error) { if (!siSesionVencida(error)) avisoBreve(T.errores.guardar, { error: true }); return false; }
    estado.usuario.estado = nuevo;
    bandas();
    document.dispatchEvent(new CustomEvent('terna:estado-cuenta', { detail: nuevo }));
    return true;
  }
  window.addEventListener('online', bandas);
  window.addEventListener('offline', bandas);

  /* ---------- Avisos breves (§10.9): 3 s, 6 s con Deshacer; se pausan con el foco o el mouse ---------- */
  let breve = null;
  function contenedorCuerpo() {
    let c = document.getElementById('avisos-breves');
    if (!c) {
      c = h('div', { id: 'avisos-breves', class: 'avisos-breves', role: 'status', 'aria-live': 'polite' });
      document.body.append(c);
    }
    return c;
  }
  // Con una hoja modal abierta, lo de afuera queda inerte y debajo: el aviso breve va adentro de la hoja, arriba de sus botones.
  function contenedorBreves() {
    if (fichaAbierta && !fichaAbierta.linea && fichaAbierta.el.open) {
      const c = fichaAbierta.el.querySelector(':scope > .avisos-breves');
      if (c) return c;
    }
    return contenedorCuerpo();
  }
  // opciones: deshacer (función), alVencer (función que corre cuando el aviso se va sin Deshacer), error, icono, accion, link
  function avisoBreve(texto, opciones) {
    opciones = opciones || {};
    cerrarBreve(true);
    const cont = contenedorBreves();
    const iconoBreve = opciones.icono || (opciones.error ? 'i-alerta' : null);
    const caja = h('div', { class: 'aviso-breve' + (opciones.error ? ' aviso-breve-error' : '') },
      iconoBreve ? icono(iconoBreve) : null, h('span', { text: texto }));
    // Con una segunda acción (`accion: { texto, alHacer }`, el "Decir por qué" de "No me interesa"; diseno.md 0.14 §10.9), o con
    // un link (`link: { texto, href, etiqueta }`, el «Ver» de Pedir en Empleos: adonde quedó lo pedido; FEEDBACK-UX P2-1), dura
    // 8 segundos: hay dos cosas para elegir.
    const actual = { caja, opciones, timer: null, restante: opciones.accion || opciones.link ? 8000 : (opciones.deshacer || opciones.error ? 6000 : 3000), inicio: 0 };
    // "Deshacer" no deja que corra alVencer (lo que el aviso iba a escribir al irse); la segunda acción sí, porque no deshace.
    const boton = (contenido, fn, vence) => h('button', { type: 'button', onclick: () => {
      clearTimeout(actual.timer);
      breve = null;
      caja.remove();
      if (vence && opciones.alVencer) opciones.alVencer();
      fn();
    } }, contenido);
    if (opciones.accion) caja.append(boton([opciones.accion.texto], opciones.accion.alHacer, true));
    // El link no deshace: como la segunda acción, deja que corra alVencer antes de irse.
    if (opciones.link) {
      const ir = h('a', { href: opciones.link.href, 'aria-label': opciones.link.etiqueta || null, text: opciones.link.texto });
      ir.addEventListener('click', () => { clearTimeout(actual.timer); if (breve === actual) breve = null; if (opciones.alVencer) opciones.alVencer(); });
      caja.append(ir);
    }
    if (opciones.deshacer) caja.append(boton([icono('i-deshacer', 'icono-16'), T.comun.deshacer], opciones.deshacer, false));
    const arrancar = () => { actual.inicio = Date.now(); actual.timer = setTimeout(() => { if (breve === actual) cerrarBreve(true); }, actual.restante); };
    const pausar = () => { clearTimeout(actual.timer); actual.restante = Math.max(1500, actual.restante - (Date.now() - actual.inicio)); };
    caja.addEventListener('mouseenter', pausar);
    caja.addEventListener('mouseleave', arrancar);
    caja.addEventListener('focusin', pausar);
    caja.addEventListener('focusout', arrancar);
    breve = actual;
    cont.append(caja);
    arrancar();
  }
  // vencer = true: el aviso se va como si hubiera pasado su tiempo (corre alVencer).
  function cerrarBreve(vencer) {
    if (!breve) return;
    const b = breve;
    breve = null;
    clearTimeout(b.timer);
    b.caja.remove();
    if (vencer && b.opciones.alVencer) b.opciones.alVencer();
  }

  /* ---------- Cargando y errores de carga ---------- */
  function cargando(cont) {
    vaciar(cont);
    const caja = h('div', { class: 'cargando', role: 'status' }, h('p', { text: T.comun.cargando }));
    cont.append(caja);
    const t = setTimeout(() => {
      vaciar(caja);
      caja.append(h('p', { text: T.comun.sigueCargando }),
        h('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, T.comun.probarDeNuevo));
    }, 8000);
    return () => clearTimeout(t);
  }
  function errorDeCarga(cont, error) {
    if (estado.descargando || siSesionVencida(error)) return;
    // Para diagnosticar desde la consola del navegador: el tipo y el mensaje, nunca datos de la persona.
    console.error('[Terna]', error && error.name, error && (error.code || ''), error && error.message);
    vaciar(cont);
    cont.append(h('div', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'), h('span', { text: T.errores.general }),
      h('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, T.comun.probarDeNuevo)));
  }

  /* ---------- Diálogos (§10.8) ---------- */
  function dialogo({ titulo, cuerpo, botones, clase }) {
    const idTitulo = idUnico('dlg');
    const dlg = h('dialog', { class: 'dialogo' + (clase ? ' ' + clase : ''), 'aria-labelledby': idTitulo },
      h('h2', { id: idTitulo, text: titulo }), cuerpo, h('div', { class: 'botones' }, botones));
    dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('fuera'); });
    document.body.append(dlg);
    return dlg;
  }
  // Confirmación: devuelve true o false. El foco arranca en el botón que no hace nada (Cancelar). `cuerpo` (nodos) en lugar de
  // `texto` para una confirmación con más de un párrafo o con algo para elegir (Pedir paquete y No me interesa, diseno.md 0.21 §10.8).
  function confirmar({ titulo, texto, cuerpo, si, no, destructivo, clase }) {
    return new Promise((resolver) => {
      const origen = document.activeElement;
      let respuesta = false;
      const bNo = h('button', { class: 'btn', type: 'button', autofocus: true, onclick: () => dlg.close() }, no || T.comun.cancelar);
      const bSi = h('button', { class: 'btn ' + (destructivo ? 'btn-destructivo' : 'btn-primario'), type: 'button', onclick: () => { respuesta = true; dlg.close(); } }, si);
      const dlg = dialogo({ titulo, cuerpo: cuerpo || h('p', { text: texto }), botones: [bNo, bSi], clase });
      dlg.addEventListener('close', () => { devolverFoco(origen); resolver(respuesta); });
      dlg.showModal();
      bNo.focus();
    });
  }
  // Un control oculto (display: none) no toma el foco: entonces va al contenido.
  function devolverFoco(el) {
    if (el && el.isConnected && typeof el.focus === 'function' && (el.getClientRects().length || el === document.activeElement)) el.focus();
    else { const m = document.getElementById('contenido'); if (m) m.focus(); }
  }

  /* ---------- Hoja inferior, diálogo, panel y cajón (§10.7; PLAN-WEB.md §2.4) ----------
     Un solo componente: en celular, hoja desde abajo; de 768 a 1439, diálogo centrado (el panel de un filtro, anclado a su
     botón); desde 1440, si la página tiene lugar (opción enLinea y un contenedor .cajon-linea), cajón en línea, no modal.
     Hasta el rediseño B2 el cajón en línea empezaba en 1200: con el carril de 232 px, 1440 deja la misma caja. */
  const anchoLinea = window.matchMedia('(min-width: 1440px)');
  const anchoEscritorio = window.matchMedia('(min-width: 768px)');
  let fichaAbierta = null;

  // diseno.md 0.7 §10.7: la cruz va afuera del marco, siempre visible (no se va al bajar); la cabecera (el título, o el
  // puesto, la empresa y el match de una ficha) baja junto con el cuerpo, así queda más lugar; las acciones quedan fijas abajo.
  // La cruz va primera: es el primer control que toma el foco al abrir la hoja.
  function armarHoja({ titulo, cuerpo, acciones, cabecera, idTitulo }) {
    const id = idTitulo || idUnico('hoja');
    const cerrar = h('button', { class: 'hoja-cerrar', type: 'button', 'aria-label': T.comun.cerrar, onclick: () => cerrarHoja(true) }, icono('i-cerrar'));
    const marco = h('div', { class: 'hoja-marco' },
      h('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      h('div', { class: 'hoja-desplazable' },
        h('div', { class: 'hoja-cabecera' }, cabecera || h('h2', { id, text: titulo })),
        h('div', { class: 'hoja-cuerpo' }, cuerpo)),
      acciones ? h('div', { class: 'hoja-acciones' }, acciones) : null);
    return { partes: [cerrar, marco], idTitulo: id };
  }

  // opciones: titulo | cabecera (nodo) + idTitulo, cuerpo, acciones, enLinea (bool), panel (nodo ancla), alCerrar, origen, clave,
  // clase (una clase más para el <dialog>: 'hoja-chica' es el diálogo de 440 px, el de Cuenta).
  // `origen` puede ser una función: se pregunta al cerrar adónde vuelve el foco (un filtro que redibuja la tabla mientras está
  // abierto cambia el botón de su encabezado por otro igual; diseno.md 0.21 §10.18).
  function abrirHoja(opciones) {
    cerrarHoja(false);
    const origen = opciones.origen || document.activeElement;
    const armado = armarHoja(opciones);
    const linea = opciones.enLinea && anchoLinea.matches ? document.querySelector('.cajon-linea') : null;
    let el;
    if (linea) {
      vaciar(linea);
      linea.setAttribute('aria-labelledby', armado.idTitulo);
      agregar(linea, armado.partes);
      linea.hidden = false;
      if (linea.parentElement) linea.parentElement.classList.add('abierto');
      el = linea;
      const foco = linea.querySelector('h2') || linea;
      foco.setAttribute('tabindex', '-1');
      foco.focus({ preventScroll: true });
    } else {
      el = h('dialog', { class: 'hoja' + (opciones.panel && anchoEscritorio.matches ? ' panel' : '') + (opciones.clase ? ' ' + opciones.clase : ''), 'aria-labelledby': armado.idTitulo }, armado.partes,
        h('div', { class: 'avisos-breves en-hoja', role: 'status', 'aria-live': 'polite' }));
      el.addEventListener('click', (e) => { if (e.target === el) cerrarHoja(true); });
      el.addEventListener('cancel', (e) => { e.preventDefault(); cerrarHoja(true); });
      document.body.append(el);
      if (opciones.panel && anchoEscritorio.matches) {
        const r = opciones.panel.getBoundingClientRect();
        // 30 px más abajo que su botón: la cruz va sobre la esquina y no tiene que tapar el botón. Alineado con el borde
        // izquierdo del botón si entra (los de una barra de filtros, diseno.md 0.13 §10.7); si no, con el derecho.
        // Desde diseno.md 0.21, un botón bajo en la pantalla (el encabezado de una tabla, con los próximos paquetes arriba)
        // abre el panel hacia arriba si abajo no le quedan 400 px y arriba tiene más lugar.
        const abajo = window.innerHeight - r.bottom - 30 - 16;
        const encima = r.top - 12 - 16 - 30;
        if (abajo < 400 && encima > abajo) {
          el.style.setProperty('top', 'auto');
          el.style.setProperty('bottom', Math.round(window.innerHeight - r.top + 12) + 'px');
          el.style.setProperty('max-height', Math.max(240, encima) + 'px');
          el.classList.add('arriba');
        } else {
          const arriba = Math.round(r.bottom + 30);
          el.style.setProperty('top', arriba + 'px');
          el.style.setProperty('max-height', Math.max(240, window.innerHeight - arriba - 16) + 'px');
        }
        const izquierda = r.left + 360 <= window.innerWidth - 24 ? r.left : r.right - 360;
        el.style.setProperty('left', Math.round(Math.max(16, Math.min(izquierda, window.innerWidth - 384))) + 'px');
      }
      el.showModal();
      document.documentElement.style.setProperty('overflow', 'hidden');
      const barra = el.querySelector('.hoja-acciones');
      el.style.setProperty('--alto-acciones', (barra ? barra.offsetHeight : 0) + 'px');
    }
    fichaAbierta = { el, linea: !!linea, origen, alCerrar: opciones.alCerrar, clave: opciones.clave || null };
    desplazableEnfocable(el.querySelector('.hoja-desplazable'));
    if (linea) {
      ajustarLinea();
      // Lo que el cajón tiene arriba puede cambiar de alto con él abierto: se vuelve a medir (ajustarLinea).
      if (vigiaLinea) {
        vigiaLinea.disconnect();
        const principal = document.getElementById('contenido');
        if (linea.parentElement) vigiaLinea.observe(linea.parentElement);
        if (principal) vigiaLinea.observe(principal);
      }
    }
    return el;
  }
  // porUsuario: true cuando la cierra la persona (cruz, Esc, fuera); avisa a la página para que limpie el hash.
  function cerrarHoja(porUsuario) {
    if (!fichaAbierta) return;
    const f = fichaAbierta;
    fichaAbierta = null;
    if (f.linea) {
      if (vigiaLinea) vigiaLinea.disconnect();
      vaciar(f.el); f.el.hidden = true; if (f.el.parentElement) f.el.parentElement.classList.remove('abierto');
    } else {
      // Un aviso breve que estaba en la hoja (con su Deshacer) pasa a la página antes de que la hoja se vaya.
      if (breve && f.el.contains(breve.caja)) contenedorCuerpo().append(breve.caja);
      if (f.el.open) f.el.close();
      f.el.remove();
      document.documentElement.style.removeProperty('overflow');
    }
    if (f.alCerrar) f.alCerrar(porUsuario);
    if (porUsuario) devolverFoco(typeof f.origen === 'function' ? f.origen() : f.origen);
  }
  function hojaAbierta() { return fichaAbierta; }
  function reemplazarCuerpoHoja(cuerpo, acciones) {
    if (!fichaAbierta) return;
    const c = fichaAbierta.el.querySelector('.hoja-cuerpo');
    const d = fichaAbierta.el.querySelector('.hoja-desplazable');
    if (c) { const scroll = d ? d.scrollTop : 0; vaciar(c); agregar(c, [cuerpo]); if (d) d.scrollTop = scroll; }
    const a = fichaAbierta.el.querySelector('.hoja-acciones');
    if (a && acciones) { vaciar(a); agregar(a, [acciones]); }
    desplazableEnfocable(d);
  }
  // El cuerpo que se desplaza tiene que poder moverse con el teclado (WCAG 2.1.1; axe, scrollable-region-focusable): si adentro no
  // hay nada que tome el foco, la región misma lo toma. Pasa con la ficha de un aviso sin texto, que desde brand.md 0.23 no tiene
  // "Pegar el texto del aviso" ni otro control; las demás fichas tienen sus botones y no suman una parada.
  const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function desplazableEnfocable(d) {
    if (!d) return;
    if (d.querySelector(ENFOCABLES)) d.removeAttribute('tabindex');
    else d.setAttribute('tabindex', '0');
  }
  // Cajón en línea: el alto es el que queda de pantalla debajo de donde se pega (80 px), menos lo que la página tiene
  // después de la lista (el pie). Así entra entero entre la barra y el final de la página: con pocas filas la página no
  // se alarga por el cajón, y con muchas, al llegar al final, el contenedor no lo empuja hacia arriba ni se lleva la
  // cruz (diseno.md 0.7 §10.7).
  // Desde diseno.md 0.32, además, nunca más alto que lo que se ve (Francisco, 12/11/2026: "se me entrecorta… ver aviso en la
  // empresa… o hacer clic en no me interesa"). Con la página arriba el cajón todavía no llegó a donde se pega: empieza donde
  // empieza la lista, debajo del título y de los filtros, y con el alto de arriba se salía de la pantalla por abajo, con sus
  // botones cortados. Ahora termina a 16 px del borde de abajo y crece a medida que la página baja, hasta el alto de siempre.
  // Se mide al abrir, al cambiar el tamaño de la ventana, al desplazar la página y cuando cambia de alto lo que tiene arriba
  // (la barra de filtros, que al abrirse el cajón suma botones y puede pasar a dos renglones).
  function ajustarLinea() {
    if (!fichaAbierta || !fichaAbierta.linea) return;
    const aside = fichaAbierta.el;
    const marco = aside.querySelector('.hoja-marco');
    const pie = document.querySelector('.pie');
    if (!marco || !aside.parentElement) return;
    const pegado = parseFloat(getComputedStyle(aside).top) || 80;
    const cont = aside.parentElement.getBoundingClientRect();
    // Sin pie a la vista (desde PLAN-UX §3.5 el de las páginas con sesión está vacío y no se dibuja), lo de después es el margen.
    const conPie = pie && pie.getClientRects().length > 0;
    const despues = Math.max(16, (conPie ? pie.getBoundingClientRect().bottom : cont.bottom) - cont.bottom);
    const yaPegado = Math.max(320, window.innerHeight - pegado - despues);
    const aLaVista = window.innerHeight - Math.max(pegado, cont.top) - 16;
    const alto = Math.round(Math.max(240, Math.min(yaPegado, aLaVista))) + 'px';
    if (marco.style.getPropertyValue('max-height') !== alto) marco.style.setProperty('max-height', alto);
  }
  // Una sola medida por cuadro, y solo con un cajón en línea abierto.
  let ajustePedido = false;
  function pedirAjuste() {
    if (ajustePedido || !fichaAbierta || !fichaAbierta.linea) return;
    ajustePedido = true;
    requestAnimationFrame(() => { ajustePedido = false; ajustarLinea(); });
  }
  addEventListener('resize', pedirAjuste);
  addEventListener('scroll', pedirAjuste, { passive: true });
  const vigiaLinea = 'ResizeObserver' in window ? new ResizeObserver(pedirAjuste) : null;
  // Si cambia el ancho con una ficha abierta, la página la vuelve a abrir en el modo que corresponde.
  anchoLinea.addEventListener('change', () => { if (fichaAbierta) document.dispatchEvent(new CustomEvent('terna:cambio-ancho')); });
  anchoEscritorio.addEventListener('change', () => document.dispatchEvent(new CustomEvent('terna:cambio-diseno')));

  /* ---------- Copiar ---------- */
  async function copiar(texto, nodo) {
    try {
      await navigator.clipboard.writeText(texto);
      avisoBreve(T.comun.copiado);
    } catch (e) {
      if (nodo) {
        const rango = document.createRange();
        rango.selectNodeContents(nodo);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
      }
      avisoBreve(T.comun.copiarFallo);
    }
  }

  /* ---------- Links a otros sitios ---------- */
  // La URL de un aviso (o cualquier dato que termine en un href): solo http o https. Con otra cosa (javascript:, data:…)
  // devuelve null y h() no pone el href (informe de seguridad del 06/11/2026, H8; la CSP ya frenaba javascript:).
  function urlExterna(valor) {
    const texto = String(valor || '').trim();
    try {
      const u = new URL(texto);
      return u.protocol === 'https:' || u.protocol === 'http:' ? texto : null;
    } catch (e) {
      return null;
    }
  }

  /* ---------- Archivos ---------- */
  function nombreDescarga(tipo, idioma) {
    const base = [estado.perfil && estado.perfil.nombre, estado.perfil && estado.perfil.apellido].filter(Boolean).join(' ');
    const limpio = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const sufijo = idioma === 'en' ? (tipo === 'cv' ? 'Resume' : 'Cover-Letter') : (tipo === 'cv' ? 'CV' : 'Carta');
    return (limpio ? limpio + '-' : '') + sufijo + '.pdf';
  }
  async function urlFirmada(ruta, descarga) {
    const { data, error } = await sb.storage.from(CONFIG.bucket).createSignedUrl(ruta, 3600, descarga ? { download: descarga } : undefined);
    if (error || !data) throw error || new Error('sin_url');
    return data.signedUrl;
  }
  // Un link a un archivo privado: se firma al dibujarse (URL de 60 minutos) y el navegador lo abre como cualquier link.
  // Si al tocarlo la firma todavía no está o ya es vieja, se abre la pestaña en el acto (si no, iOS la bloquea) y se le
  // pone la URL nueva cuando llega; si no se puede firmar, se cierra y avisa.
  // `opciones.alTocar` (desde PLAN-UX §8, P0.4): no lo firma al dibujarse sino al tocarlo, por el mismo camino de una firma vieja. Para
  // las filas de documentos de una lista (Aviso.filaDocumentos), donde firmar cada CV y cada carta al dibujar serían decenas de pedidos.
  const VIGENCIA_LINK_MS = 50 * 60 * 1000;
  function linkFirmado(ruta, descarga, nodo, opciones) {
    nodo.setAttribute('target', '_blank');
    nodo.setAttribute('rel', 'noopener noreferrer');
    nodo.setAttribute('href', '#');
    let firmadoEn = 0;
    const firmar = () => urlFirmada(ruta, descarga).then((url) => { nodo.setAttribute('href', url); firmadoEn = Date.now(); return url; });
    nodo.addEventListener('click', (e) => {
      if (firmadoEn && Date.now() - firmadoEn < VIGENCIA_LINK_MS) return;
      e.preventDefault();
      const ventana = window.open('', '_blank');
      if (ventana) ventana.opener = null;
      firmar().then((url) => { if (ventana) ventana.location.replace(url); else window.open(url, '_blank', 'noopener'); })
        .catch(() => { if (ventana) ventana.close(); avisoBreve(T.errores.archivo, { error: true }); });
    });
    if (!(opciones && opciones.alTocar)) firmar().catch(() => { /* se reintenta al tocarlo */ });
    return nodo;
  }

  /* ---------- Config ---------- */
  const COLUMNAS_CONFIG = 'umbral_min, umbral_max, umbral_default, piso_match, paquetes_por_dia_opciones, paquetes_por_dia_default, invitaciones_abiertas, invitaciones_cupo, invitaciones_dias, max_reintentos_postulacion, max_empresas_seguidas, max_texto_pegado_chars, min_texto_pegado_chars, max_experiencias, max_estudios, max_idiomas, cv_max_mb, retencion_no_interesa_dias, alertas_mail_patron';
  async function leerConfig() {
    if (estado.config) return estado.config;
    const { data, error } = await sb.from('config').select(COLUMNAS_CONFIG).eq('id', 1).maybeSingle();
    if (error) throw error;
    estado.config = data || {};
    return estado.config;
  }

  /* ---------- Piezas de las páginas por bloques (Preferencias y Mi perfil; diseno.md 0.19 §10.17) ----------
     Un ítem con su título, radios nativos, un grupo de radios, una pregunta (un grupo con etiqueta, no un título), un
     interruptor y un ítem con interruptor. Cada página pide las suyas con su prefijo de id y el nivel del título del ítem:
     h3 en un bloque (Preferencias, Mi perfil › Tu cuenta) y h4 dentro de un subtema (Mi perfil › Datos). */
  function piezas({ prefijo, nivel }) {
    const etiqueta = nivel || 'h3';
    let n = 0;
    const id = (x) => prefijo + '-' + x + '-' + (n += 1);
    function item(titulo, ...cuerpo) {
      const idT = id('t');
      const s = h('div', { class: 'subbloque' }, h(etiqueta, { id: idT, class: 'tarjeta-titulo', text: titulo }), cuerpo);
      s.dataset.titulo = idT;
      return s;
    }
    // Radios nativos: [valor, texto, ayuda].
    const radios = (nombre, opciones, valor, alCambiar) => h('div', { class: 'opciones' }, opciones.map(([val, texto, ayuda]) => h('label', { class: 'casilla' },
      h('input', { type: 'radio', name: nombre, value: String(val), checked: String(valor) === String(val), onchange: () => alCambiar(val) }),
      h('span', null, texto, ayuda ? h('small', { text: ayuda }) : null))));
    // Un grupo de radios: role="group" con su título, en vez de fieldset (la leyenda pisaría el borde).
    function grupoRadios(titulo, nombre, opciones, valor, alCambiar) {
      const idT = id('g');
      return h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idT }, h(etiqueta, { id: idT, class: 'tarjeta-titulo', text: titulo }), radios(nombre, opciones, valor, alCambiar));
    }
    // Una pregunta dentro de un ítem: role="group" con una etiqueta (no un título).
    function pregunta(texto, ...cuerpo) {
      const idT = id('q');
      return h('div', { class: 'campo', role: 'group', 'aria-labelledby': idT }, h('span', { id: idT, class: 'campo-etiqueta', text: texto }), cuerpo);
    }
    function interruptor(seccionNodo, valor, alCambiar) {
      const estadoTexto = h('span', { 'aria-hidden': 'true', text: valor ? T.comun.si : T.comun.no });
      const b = h('button', { class: 'interruptor', type: 'button', role: 'switch', 'aria-checked': String(!!valor), 'aria-labelledby': seccionNodo.dataset.titulo },
        estadoTexto, h('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }));
      b.addEventListener('click', () => {
        const nuevo = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', String(nuevo));
        estadoTexto.textContent = nuevo ? T.comun.si : T.comun.no;
        alCambiar(nuevo);
      });
      return b;
    }
    function conInterruptor(titulo, ayuda, valor, alCambiar) {
      const s = item(titulo);
      const titular = s.firstChild;
      const fila = h('div', { class: 'interruptor-fila' });
      s.replaceChild(fila, titular);
      fila.append(titular, interruptor(s, valor, alCambiar));
      if (ayuda) s.append(h('p', { class: 'campo-ayuda', text: ayuda }));
      return s;
    }
    return { id, item, radios, grupoRadios, pregunta, interruptor, conInterruptor };
  }

  /* Un subtema dentro de un bloque (Mi perfil › Datos y CV; diseno.md 0.19 §10.17): cuando un bloque junta temas distintos,
     cada uno empieza con una franja que corta la tarjeta de lado a lado, con su título y, si hace falta, una ayuda. Es un div
     con su h3 y no una <section> con nombre: el bloque ya es una región, y una región por subtema llenaría la lista de regiones
     del lector de pantalla; adentro se navega por títulos. */
  function subtema(titulo, intro, ...cuerpo) {
    return h('div', { class: 'subtema' },
      h('h3', { class: 'subtema-titulo', id: idUnico('tema'), text: titulo }),
      intro ? h('p', { class: 'campo-ayuda', text: intro }) : null, cuerpo);
  }

  /* ---------- Página por bloques: Mi perfil y Preferencias (diseno.md 0.6 §10.17; PLAN-WEB.md §2.12) ----------
     Hasta 767 px cada bloque es un desplegable, cerrado salvo los de `abiertos`. Desde 768 px (modo carril), un carril a
     la izquierda elige el bloque y a la derecha se ve ese bloque entero. El bloque abierto o elegido va en la URL.
     El grupo de "Guardar" va al final del formulario, fijo abajo, en celular, y a la derecha de la cabecera fija desde
     768. Cada bloque se arma una sola vez: el modo solo cambia qué se oculta, así lo escrito nunca se pierde.
     Desde 0.19 un bloque puede traer subtemas (`temas`: [{ hash, titulo, nodo, alias }]): en el carril van debajo de su
     bloque, más chicos, y llevan a ese subtema; su hash (o un alias, como #formularios de antes) abre el bloque y baja
     hasta él, al entrar y cuando el hash cambia en la misma página.
     Desde el rediseño B2 cada bloque es una carpeta: la lengüeta lila lleva su nombre (y su cuenta) y, al lado, un marbete
     con «Falta» o el error (`estado`, `marcarErrores`); cerrado, el lomo dice qué hay adentro (`resumen`, una función que
     devuelve un texto con lo que la persona cargó, o nada). La lógica no cambia. */
  function porBloques({ raiz, cabecera, nombre, abiertos }) {
    const escritorio = window.matchMedia('(min-width: 768px)');
    const conCarril = window.matchMedia('(min-width: 1024px)');
    const B = {};
    const orden = [];
    const abiertosAlEntrar = abiertos || new Set();
    let modoCarril = false;
    let elegido = null;
    let grupoGuardar = null;
    const carril = h('nav', { class: 'carril carril-bloques', 'aria-label': nombre });

    // El h2 lleva el botón del desplegable (celular) y la misma lengüeta sin botón (modo carril); el CSS muestra una.
    // alAbrir corre cada vez que el bloque se abre o se elige; cuenta, si está, pone la cantidad en la lengüeta y en el carril.
    function bloque(clave, titulo, cuerpo, opciones) {
      const o = opciones || {};
      const idT = 'h-' + clave;
      const idPanel = 'panel-' + (o.hash || clave);
      const p = { hash: o.hash || clave, abierta: abiertosAlEntrar.has(clave), alAbrir: o.alAbrir, cuenta: o.cuenta, resumen: o.resumen, estado: null, error: null };
      p.panel = h('div', { class: 'seccion carpeta-cuerpo bloque-cuerpo', id: idPanel, hidden: !p.abierta }, cuerpo);
      p.nLengueta = p.cuenta ? h('span', { class: 'n' }) : null;
      p.nFijo = p.cuenta ? h('span', { class: 'n' }) : null;
      p.marbete = h('span', { class: 'marbete', hidden: true });
      p.marbeteFijo = h('span', { class: 'marbete', hidden: true });
      p.resumenNodo = h('span', { class: 'bloque-resumen' });
      p.boton = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': String(p.abierta), 'aria-controls': idPanel },
        h('span', { class: 'carpeta-cabeza' },
          h('span', { class: 'lengueta bloque-lengueta' }, h('span', { class: 'tarjeta-titulo', id: idT, text: titulo }), p.nLengueta),
          p.marbete),
        h('span', { class: 'bloque-lomo' }, p.resumenNodo, icono('i-chevron')));
      p.boton.addEventListener('click', () => plegar(clave, !p.abierta));
      p.seccion = h('section', { class: 'tarjeta seccion bloque' + (p.abierta ? ' bloque-abierto' : ''), 'aria-labelledby': idT, dataset: { plegable: clave } },
        h('h2', { class: 'plegable-titulo' }, p.boton,
          h('span', { class: 'titulo-fijo carpeta-cabeza' },
            h('span', { class: 'lengueta bloque-lengueta' }, h('span', { class: 'tarjeta-titulo', text: titulo }), p.nFijo), p.marbeteFijo)),
        p.panel);
      p.n = p.cuenta ? h('span', { class: 'n' }) : null;
      p.alerta = icono('i-alerta', 'icono-16 carril-alerta');
      p.alerta.setAttribute('hidden', ''); // un <svg> no tiene la propiedad hidden: va el atributo
      p.chip = h('span', { class: 'chip chip-toca chip-carril', hidden: true });
      p.link = h('a', { href: '#' + p.hash, onclick: (e) => { e.preventDefault(); elegir(clave, true); } }, h('span', { text: titulo }), p.alerta, p.chip, p.n);
      p.temas = (o.temas || []).filter((t) => t && t.nodo);
      p.subLinks = p.temas.map((t) => h('a', { class: 'carril-sub', href: '#' + t.hash, onclick: (e) => { e.preventDefault(); irATema(clave, t); } }, h('span', { text: t.titulo })));
      B[clave] = p;
      orden.push(clave);
      return p.seccion;
    }
    // Lo que hay adentro, para el lomo de un bloque cerrado: lo pide cada vez que se cierra y cuando cambian las cuentas.
    function resumir(k) {
      const p = B[k];
      let texto = '';
      if (p.resumen) { try { texto = String(p.resumen() || '').trim(); } catch (e) { texto = ''; } }
      if (p.resumenNodo.textContent !== texto) p.resumenNodo.textContent = texto;
    }
    // El marbete del bloque: el error manda sobre «Falta». En el carril, un chip con «Falta» y el triángulo del error.
    function pintarMarbete(k) {
      const p = B[k];
      const e = p.error ? { tipo: 'error', texto: p.error } : p.estado;
      for (const m of [p.marbete, p.marbeteFijo]) {
        vaciar(m);
        m.className = 'marbete' + (e ? ' marbete-' + e.tipo : '');
        m.hidden = !e;
        if (e) m.append(icono(e.tipo === 'error' ? 'i-alerta' : 'i-por-decidir'), h('span', { class: 'marbete-texto', text: e.texto }));
      }
      const falta = p.estado && p.estado.tipo === 'toca' ? p.estado.texto : '';
      p.chip.textContent = falta;
      p.chip.hidden = !falta;
    }
    // estado(clave, 'toca', T.perfil.faltaCorto) pone el marbete; estado(clave, null) lo saca.
    function estadoBloque(k, tipo, texto) {
      if (!B[k]) return;
      B[k].estado = tipo ? { tipo, texto: texto || '' } : null;
      pintarMarbete(k);
    }
    // Un subtema: su bloque abierto (celular) o elegido (carril), y la página baja hasta él.
    function irATema(k, t) {
      if (modoCarril) { if (elegido !== k) elegir(k); } else plegar(k, true);
      elegido = k;
      history.replaceState(null, '', '#' + t.hash);
      t.nodo.scrollIntoView({ block: 'start' });
    }
    // El hash puede ser de un bloque o de un subtema (o un alias de uno).
    function resolver(hash) {
      if (!hash) return null;
      const k = orden.find((x) => B[x].hash === hash);
      if (k) return { k, tema: null };
      for (const x of orden) {
        const t = B[x].temas.find((y) => y.hash === hash || (y.alias || []).includes(hash));
        if (t) return { k: x, tema: t };
      }
      return null;
    }
    function irAlHash() {
      const r = resolver(location.hash.slice(1));
      if (!r) return;
      if (r.tema) { irATema(r.k, r.tema); return; }
      if (modoCarril) elegir(r.k, true);
      else { plegar(r.k, true); B[r.k].seccion.scrollIntoView({ block: 'start' }); }
    }
    function plegar(k, abrir) {
      const p = B[k];
      p.abierta = abrir;
      if (modoCarril) return;
      p.boton.setAttribute('aria-expanded', String(abrir));
      p.panel.hidden = !abrir;
      p.seccion.classList.toggle('bloque-abierto', abrir);
      if (!abrir) resumir(k);
      if (abrir && p.alAbrir) p.alAbrir();
    }
    function elegir(k, desdeCarril) {
      elegido = k;
      if (!modoCarril) return;
      for (const x of orden) {
        B[x].seccion.hidden = x !== k;
        B[x].link.setAttribute('aria-current', x === k ? 'true' : 'false');
      }
      if (B[k].alAbrir) B[k].alAbrir();
      if (desdeCarril) {
        history.replaceState(null, '', '#' + B[k].hash);
        const s = B[k].seccion;
        if (s.getBoundingClientRect().top < parseFloat(document.documentElement.style.scrollPaddingTop || '0')) s.scrollIntoView({ block: 'start' });
      }
    }
    // Un campo con error: en celular abre su bloque; en modo carril lo marca, e irAlPrimerError muestra el primero.
    function abrirDe(el) {
      const s = el && el.closest('section[data-plegable]');
      if (s && B[s.dataset.plegable] && !modoCarril) plegar(s.dataset.plegable, true);
    }
    const primerError = (k) => Array.from(B[k].seccion.querySelectorAll('.campo-error')).map((e) => e.textContent.trim()).find(Boolean) || null;
    const conError = (k) => !!primerError(k);
    function marcarErrores() {
      for (const k of orden) {
        const error = primerError(k);
        B[k].alerta.toggleAttribute('hidden', !error);
        if (B[k].error !== error) { B[k].error = error; pintarMarbete(k); }
      }
    }
    function irAlPrimerError() {
      const k = orden.find(conError);
      if (k && modoCarril && k !== elegido) elegir(k, true);
    }
    function actualizarCuentas() {
      for (const k of orden) {
        const p = B[k];
        if (p.n) {
          const n = String(p.cuenta());
          p.n.textContent = n;
          p.nLengueta.textContent = n;
          p.nFijo.textContent = n;
        }
        resumir(k);
      }
      marcarErrores();
    }

    // La cabecera queda fija (en el celular, debajo de la barra; desde 1024, arriba de todo): el carril y el desplazamiento al foco
    // se corren su alto (por CSSOM, que la CSP permite).
    const topeCabecera = () => parseFloat(getComputedStyle(cabecera).top) || 0;
    const cabeceraFija = () => getComputedStyle(cabecera).position === 'sticky';
    function medirCabecera() {
      const doc = document.documentElement.style;
      if (!cabeceraFija()) { doc.removeProperty('scroll-padding-top'); carril.style.removeProperty('top'); return; }
      const abajo = topeCabecera() + cabecera.offsetHeight;
      doc.setProperty('scroll-padding-top', (abajo + 12) + 'px');
      if (modoCarril) carril.style.setProperty('top', (abajo + 16) + 'px');
      else carril.style.removeProperty('top');
    }
    function marcarPegada() { cabecera.classList.toggle('pegada', cabeceraFija() && cabecera.getBoundingClientRect().top <= topeCabecera() + 0.5); }
    function aplicarModo() {
      modoCarril = escritorio.matches;
      raiz.classList.toggle('modo-carril', modoCarril);
      if (grupoGuardar) { if (modoCarril) cabecera.append(grupoGuardar); else raiz.append(grupoGuardar); }
      for (const k of orden) {
        const p = B[k];
        p.seccion.hidden = false;
        p.panel.hidden = modoCarril ? false : !p.abierta;
        p.boton.setAttribute('aria-expanded', String(p.abierta));
        p.seccion.classList.toggle('bloque-abierto', modoCarril || p.abierta);
      }
      if (modoCarril && elegido) elegir(elegido);
      medirCabecera();
      marcarPegada();
    }
    // Arma la página: lo de arriba (la banda), el carril y los bloques (más lo que va debajo), y el grupo de Guardar.
    // Bloque inicial: el de la URL; si no, el primero de `abiertos`; si no, el primero.
    function montar({ arriba, debajo, guardar }) {
      grupoGuardar = guardar || null;
      carril.append(...orden.flatMap((k) => [B[k].link].concat(B[k].subLinks)));
      actualizarCuentas();
      raiz.append(...(arriba || []),
        h('div', { class: 'bloques-cuerpo' }, carril, h('div', { class: 'seccion bloques-lista' }, orden.map((k) => B[k].seccion), debajo || null)));
      if (grupoGuardar) raiz.append(grupoGuardar);
      const desdeUrl = resolver(location.hash.slice(1));
      elegido = (desdeUrl && desdeUrl.k) || orden.find((k) => abiertosAlEntrar.has(k)) || orden[0];
      aplicarModo();
      if (desdeUrl && desdeUrl.tema) irATema(desdeUrl.k, desdeUrl.tema);
      else if (desdeUrl && !modoCarril) { plegar(desdeUrl.k, true); B[desdeUrl.k].seccion.scrollIntoView({ block: 'start' }); }
      escritorio.addEventListener('change', aplicarModo);
      conCarril.addEventListener('change', () => { medirCabecera(); marcarPegada(); });
      if (window.ResizeObserver) new ResizeObserver(medirCabecera).observe(cabecera);
      addEventListener('scroll', marcarPegada, { passive: true });
      addEventListener('hashchange', irAlHash);
    }
    return { bloque, montar, abrirDe, marcarErrores, irAlPrimerError, actualizarCuentas, estado: estadoBloque, resumir };
  }

  /* ---------- Arranque de una página con sesión ---------- */
  async function iniciar(pagina, opciones) {
    opciones = opciones || {};
    estado.pagina = pagina;
    document.title = T.comun.titulo(nombrePestana(pagina));
    dibujarBarra(pagina);
    dibujarMuelle(pagina);
    dibujarPie();
    contenedorBreves();
    bandas();
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) { irAEntrar(); return null; }
    estado.sesion = data.session;
    const uid = data.session.user.id;
    let u, p, f, c;
    try {
      [u, p, f, c] = await Promise.all([
        sb.from('usuarios').select('id, mail, rol, estado, codigo_alertas').eq('id', uid).maybeSingle(),
        sb.from('perfiles').select('nombre, apellido').eq('usuario_id', uid).maybeSingle(),
        sb.rpc('perfil_faltantes'),
        leerConfig().then((d) => ({ data: d }), (e) => ({ error: e })),
      ]);
    } catch (e) {
      errorDeCarga(document.getElementById('contenido'), e);
      return null;
    }
    const error = u.error || p.error || f.error || c.error;
    if (error) { errorDeCarga(document.getElementById('contenido'), error); return null; }
    if (!u.data) {
      // La cuenta ya no existe (la borró Francisco): la sesión que quedó no sirve.
      estado.saliendo = true;
      await sb.auth.signOut({ scope: 'local' });
      location.replace('entrar.html');
      return null;
    }
    estado.usuario = u.data;
    estado.perfil = p.data || { nombre: null, apellido: null };
    estado.faltantes = f.data || [];
    completarBarra();
    bandas();
    return { sb, usuario: estado.usuario, perfil: estado.perfil, faltantes: estado.faltantes, config: estado.config };
  }
  // Una página que se rompe al armarse suele ser una mezcla de archivos de dos publicaciones: GitHub Pages deja que el
  // navegador guarde cada uno 10 minutos (31/10/2026, Preferencias nueva con textos.js viejo). Se recarga sola, como mucho
  // una vez cada dos minutos: el HTML se vuelve a pedir y, con los sellos ?v= de sus archivos (herramientas/sellar.py),
  // trae la versión publicada de cada uno. Si vuelve a fallar, queda el error de siempre (qa.md 0.5.14, observación 59).
  function recargarUnaVez() {
    try {
      const ultima = Number(sessionStorage.getItem('terna.recarga')) || 0;
      if (Date.now() - ultima < 120000) return false;
      sessionStorage.setItem('terna.recarga', String(Date.now()));
    } catch (e) {
      return false;
    }
    location.reload();
    return true;
  }
  function pagina(nombre, fn, opciones) {
    const correr = async () => {
      const ctx = await iniciar(nombre, opciones);
      if (ctx) {
        try {
          await fn(ctx);
        } catch (e) {
          if (!recargarUnaVez()) errorDeCarga(document.getElementById('contenido'), e);
        }
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
  }
  // La dirección de Terna de la persona (config.alertas_mail_patron con su codigo_alertas) y si es la dueña del buzón: su
  // mail es el del patrón sin el alias (buzon+terna-{codigo}@gmail.com → buzon@gmail.com). Es la
  // misma regla del motor (fuentes/alertas_mail.py: usuarios.mail == TERNA_IMAP_USUARIO). Gmail no deja reenviarse a uno
  // mismo, así que la dueña no reenvía: etiqueta sus alertas en su Gmail (arquitectura.md §7.8; brand.md 0.4.17 §6.7.1).
  function alertasMail(config, usuario) {
    const patron = String((config && config.alertas_mail_patron) || '');
    const direccion = patron.replace('{codigo}', (usuario && usuario.codigo_alertas) || '');
    const buzon = patron.includes('+') ? patron.replace(/\+[^@]*@/, '@').trim().toLowerCase() : '';
    const mail = String((usuario && usuario.mail) || '').trim().toLowerCase();
    return { direccion, dueno: Boolean(buzon) && mail === buzon };
  }
  function actualizarFaltantes(lista) { estado.faltantes = lista || []; bandas(); pintarCuentas(); }
  function actualizarPerfil(datos) { Object.assign(estado.perfil, datos); completarBarra(); }

  return {
    CONFIG, sb, estado, hashInicial, h, agregar, vaciar, icono, oculto, idUnico,
    hoy, sumarDias, diasEntre, aFechaLocal, fechaCorta, fechaLarga, hora, relativa, numero, decimal,
    leerLocal, guardarLocal, textoError, siSesionVencida, esErrorDeSesion,
    irAEntrar, volverValido, salir, token, dibujarPie, botonTema, listaFaltantes, cambiarEstadoCuenta, bandas,
    marca, dibujarMuelle, abrirCuenta, cuentaToca, cuentaPaquetes, nombrePestana,
    avisoBreve, cerrarBreve, cargando, errorDeCarga, dialogo, confirmar, devolverFoco,
    abrirHoja, cerrarHoja, hojaAbierta, reemplazarCuerpoHoja, anchoLinea, anchoEscritorio,
    copiar, urlExterna, nombreDescarga, urlFirmada, linkFirmado, leerConfig, pagina, actualizarFaltantes, actualizarPerfil, porBloques,
    piezas, subtema, alertasMail,
  };
})();
