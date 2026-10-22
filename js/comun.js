/* Terna · js/comun.js
   Lo que usan todas las páginas: el cliente de Supabase, la sesión y sus redirecciones, el encabezado con las
   pestañas, las bandas, los avisos breves, la hoja/cajón de las fichas, los diálogos y el formato de fechas y números.
   Sin framework. Los datos de una persona nunca se escriben como HTML: todo va por textContent (función h). */
'use strict';

window.Terna = (function () {
  const CONFIG = {
    url: 'https://dgkroxrgprpsxrjyfepn.supabase.co',
    clave: 'sb_publishable_Oav7O3oFq_bjUkTmNWWhTQ_gqwKmUk1', // pública: la protección es la RLS de la base
    smtp: false, // brand.md §6.2: sin SMTP, "Olvidé mi contraseña" muestra el texto para escribirle a Francisco
    zona: 'America/Argentina/Buenos_Aires',
    bucket: 'documentos',
  };
  const PAGINAS = {
    inicio: 'index.html', avisos: 'avisos.html', postulaciones: 'postulaciones.html', perfil: 'perfil.html',
    preferencias: 'preferencias.html', invitaciones: 'invitaciones.html', admin: 'admin.html',
  };
  const ICONOS_PESTANAS = {
    inicio: 'i-inicio', avisos: 'i-avisos', postulaciones: 'i-postulaciones', perfil: 'i-perfil',
    preferencias: 'i-preferencias', invitaciones: 'i-sobre', admin: 'i-admin',
  };
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
    return /^(index|avisos|postulaciones|perfil|preferencias|invitaciones|admin)\.html(#[a-z0-9-]+)?$/i.test(valor || '') ? valor : 'index.html';
  }
  async function salir() {
    estado.saliendo = true;
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual se sale */ }
    location.replace('entrar.html');
  }
  sb.auth.onAuthStateChange((evento, sesion) => {
    if (sesion) estado.sesion = sesion;
    if (evento === 'SIGNED_OUT' && estado.usuario && !estado.saliendo) irAEntrar('sesion');
  });
  function token() { return estado.sesion ? estado.sesion.access_token : null; }

  /* ---------- Encabezado y pie ---------- */
  function dibujarBarra(pagina) {
    const cont = document.getElementById('barra');
    if (!cont) return;
    vaciar(cont);
    const nav = h('nav', { class: 'pestanas', 'aria-label': T.comun.navegacion });
    for (const clave of ['inicio', 'avisos', 'postulaciones', 'perfil', 'preferencias', 'invitaciones']) nav.append(pestana(clave, pagina));
    const nombre = h('span', { class: 'cuenta-nombre', id: 'cuenta-nombre' });
    const barra = h('div', { class: 'barra' },
      h('a', { class: 'logo', href: 'index.html', 'aria-label': T.comun.logo },
        icono('i-marca', 'logo-marca'), h('span', { class: 'logo-palabra', 'aria-hidden': 'true', text: 'terna' })),
      nav,
      h('div', { class: 'cuenta' }, nombre,
        h('button', { class: 'btn btn-texto btn-barra', type: 'button', onclick: salir }, icono('i-salir'), T.comun.salir)));
    cont.append(barra);
    centrarPestana(nav);
  }
  function pestana(clave, pagina) {
    return h('a', { class: 'pestana', href: PAGINAS[clave], 'aria-current': clave === pagina ? 'page' : null, dataset: { pestana: clave } },
      icono(ICONOS_PESTANAS[clave]), h('span', { text: T.comun.pestanas[clave] }));
  }
  function centrarPestana(nav) {
    const activa = nav.querySelector('[aria-current="page"]');
    if (!activa || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = Math.max(0, activa.offsetLeft - (nav.clientWidth - activa.offsetWidth) / 2);
  }
  function completarBarra() {
    const nav = document.querySelector('.pestanas');
    if (nav && estado.usuario.rol === 'admin' && !nav.querySelector('[data-pestana="admin"]')) {
      nav.append(pestana('admin', estado.pagina));
      centrarPestana(nav);
    }
    const nombre = document.getElementById('cuenta-nombre');
    if (nombre) nombre.textContent = (estado.perfil && estado.perfil.nombre) || estado.usuario.mail;
  }
  function dibujarPie() {
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
  // opciones: deshacer (función), alVencer (función que corre cuando el aviso se va sin Deshacer), error, icono
  function avisoBreve(texto, opciones) {
    opciones = opciones || {};
    cerrarBreve(true);
    const cont = contenedorBreves();
    const caja = h('div', { class: 'aviso-breve' + (opciones.error ? ' aviso-breve-error' : '') },
      opciones.icono ? icono(opciones.icono) : null, h('span', { text: texto }));
    const actual = { caja, opciones, timer: null, restante: opciones.deshacer ? 6000 : (opciones.error ? 6000 : 3000), inicio: 0 };
    if (opciones.deshacer) {
      caja.append(h('button', { type: 'button', onclick: () => {
        clearTimeout(actual.timer);
        breve = null;
        caja.remove();
        opciones.deshacer();
      } }, icono('i-deshacer', 'icono-16'), T.comun.deshacer));
    }
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
  // Confirmación: devuelve true o false. El foco arranca en el botón que no hace nada (Cancelar).
  function confirmar({ titulo, texto, si, no, destructivo }) {
    return new Promise((resolver) => {
      const origen = document.activeElement;
      let respuesta = false;
      const bNo = h('button', { class: 'btn', type: 'button', autofocus: true, onclick: () => dlg.close() }, no || T.comun.cancelar);
      const bSi = h('button', { class: 'btn ' + (destructivo ? 'btn-destructivo' : 'btn-primario'), type: 'button', onclick: () => { respuesta = true; dlg.close(); } }, si);
      const dlg = dialogo({ titulo, cuerpo: h('p', { text: texto }), botones: [bNo, bSi] });
      dlg.addEventListener('close', () => { devolverFoco(origen); resolver(respuesta); });
      dlg.showModal();
      bNo.focus();
    });
  }
  function devolverFoco(el) {
    if (el && el.isConnected && typeof el.focus === 'function') el.focus();
    else { const m = document.getElementById('contenido'); if (m) m.focus(); }
  }

  /* ---------- Hoja inferior, cajón y panel (§10.7) ----------
     Un solo componente: en celular, hoja desde abajo; de 768 a 1199, cajón superpuesto; desde 1200, si la página
     tiene lugar (opcion enLinea y un contenedor .cajon-linea), cajón en línea, no modal. */
  const anchoLinea = window.matchMedia('(min-width: 1200px)');
  const anchoEscritorio = window.matchMedia('(min-width: 768px)');
  let fichaAbierta = null;

  function armarHoja({ titulo, cuerpo, acciones, cabecera, idTitulo }) {
    const id = idTitulo || idUnico('hoja');
    const cab = h('div', { class: 'hoja-cabecera' },
      cabecera || h('h2', { id, text: titulo }),
      h('button', { class: 'hoja-cerrar', type: 'button', 'aria-label': T.comun.cerrar, onclick: () => cerrarHoja(true) }, icono('i-cerrar')));
    const partes = [h('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), cab, h('div', { class: 'hoja-cuerpo' }, cuerpo)];
    if (acciones) partes.push(h('div', { class: 'hoja-acciones' }, acciones));
    return { partes, idTitulo: id };
  }

  // opciones: titulo | cabecera (nodo) + idTitulo, cuerpo, acciones, enLinea (bool), panel (nodo ancla), alCerrar, origen, clave
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
      el = h('dialog', { class: 'hoja' + (opciones.panel && anchoEscritorio.matches ? ' panel' : ''), 'aria-labelledby': armado.idTitulo }, armado.partes,
        h('div', { class: 'avisos-breves en-hoja', role: 'status', 'aria-live': 'polite' }));
      el.addEventListener('click', (e) => { if (e.target === el) cerrarHoja(true); });
      el.addEventListener('cancel', (e) => { e.preventDefault(); cerrarHoja(true); });
      document.body.append(el);
      if (opciones.panel && anchoEscritorio.matches) {
        const r = opciones.panel.getBoundingClientRect();
        el.style.setProperty('top', Math.round(r.bottom + 8) + 'px');
        el.style.setProperty('left', Math.round(Math.max(16, Math.min(r.left, window.innerWidth - 376))) + 'px');
      }
      el.showModal();
      document.documentElement.style.setProperty('overflow', 'hidden');
      const barra = el.querySelector('.hoja-acciones');
      el.style.setProperty('--alto-acciones', (barra ? barra.offsetHeight : 0) + 'px');
    }
    fichaAbierta = { el, linea: !!linea, origen, alCerrar: opciones.alCerrar, clave: opciones.clave || null };
    return el;
  }
  // porUsuario: true cuando la cierra la persona (cruz, Esc, fuera); avisa a la página para que limpie el hash.
  function cerrarHoja(porUsuario) {
    if (!fichaAbierta) return;
    const f = fichaAbierta;
    fichaAbierta = null;
    if (f.linea) { vaciar(f.el); f.el.hidden = true; if (f.el.parentElement) f.el.parentElement.classList.remove('abierto'); }
    else {
      // Un aviso breve que estaba en la hoja (con su Deshacer) pasa a la página antes de que la hoja se vaya.
      if (breve && f.el.contains(breve.caja)) contenedorCuerpo().append(breve.caja);
      if (f.el.open) f.el.close();
      f.el.remove();
      document.documentElement.style.removeProperty('overflow');
    }
    if (f.alCerrar) f.alCerrar(porUsuario);
    if (porUsuario) devolverFoco(f.origen);
  }
  function hojaAbierta() { return fichaAbierta; }
  function reemplazarCuerpoHoja(cuerpo, acciones) {
    if (!fichaAbierta) return;
    const c = fichaAbierta.el.querySelector('.hoja-cuerpo');
    if (c) { const scroll = c.scrollTop; vaciar(c); agregar(c, [cuerpo]); c.scrollTop = scroll; }
    const a = fichaAbierta.el.querySelector('.hoja-acciones');
    if (a && acciones) { vaciar(a); agregar(a, [acciones]); }
  }
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
  const VIGENCIA_LINK_MS = 50 * 60 * 1000;
  function linkFirmado(ruta, descarga, nodo) {
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
    firmar().catch(() => { /* se reintenta al tocarlo */ });
    return nodo;
  }

  /* ---------- Config ---------- */
  const COLUMNAS_CONFIG = 'umbral_min, umbral_max, umbral_default, piso_match, paquetes_por_dia_opciones, paquetes_por_dia_default, invitaciones_abiertas, invitaciones_cupo, invitaciones_dias, max_reintentos_postulacion, max_texto_pegado_chars, min_texto_pegado_chars, max_experiencias, max_estudios, max_idiomas, cv_max_mb, retencion_no_interesa_dias, alertas_mail_patron';
  async function leerConfig() {
    if (estado.config) return estado.config;
    const { data, error } = await sb.from('config').select(COLUMNAS_CONFIG).eq('id', 1).maybeSingle();
    if (error) throw error;
    estado.config = data || {};
    return estado.config;
  }

  /* ---------- Arranque de una página con sesión ---------- */
  async function iniciar(pagina, opciones) {
    opciones = opciones || {};
    estado.pagina = pagina;
    document.title = T.comun.titulo(T.comun.pestanas[pagina]);
    dibujarBarra(pagina);
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
    if (opciones.admin && estado.usuario.rol !== 'admin') { location.replace('index.html'); return null; }
    completarBarra();
    bandas();
    return { sb, usuario: estado.usuario, perfil: estado.perfil, faltantes: estado.faltantes, config: estado.config };
  }
  function pagina(nombre, fn, opciones) {
    const correr = async () => {
      const ctx = await iniciar(nombre, opciones);
      if (ctx) {
        try { await fn(ctx); } catch (e) { errorDeCarga(document.getElementById('contenido'), e); }
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
  }
  function actualizarFaltantes(lista) { estado.faltantes = lista || []; bandas(); }
  function actualizarPerfil(datos) { Object.assign(estado.perfil, datos); completarBarra(); }

  return {
    CONFIG, sb, estado, hashInicial, h, agregar, vaciar, icono, oculto, idUnico,
    hoy, sumarDias, diasEntre, aFechaLocal, fechaCorta, fechaLarga, hora, relativa, numero, decimal,
    leerLocal, guardarLocal, textoError, siSesionVencida, esErrorDeSesion,
    irAEntrar, volverValido, salir, token, dibujarPie, listaFaltantes, cambiarEstadoCuenta, bandas,
    avisoBreve, cerrarBreve, cargando, errorDeCarga, dialogo, confirmar, devolverFoco,
    abrirHoja, cerrarHoja, hojaAbierta, reemplazarCuerpoHoja, anchoLinea, anchoEscritorio,
    copiar, nombreDescarga, urlFirmada, linkFirmado, leerConfig, pagina, actualizarFaltantes, actualizarPerfil,
  };
})();
