/* Terna · js/ops.js
   El portal operativo (operacion.md 0.1; 0053): una página aparte de la web de usuario, solo para quien administra Terna, con su
   propia sesión y un segundo paso (un código de una app de códigos) que exige la base, no este archivo. Muestra la operación de
   todos (fuentes, sitios, directorio, postulaciones, paquetes, corridas, costos) y deja sumar una empresa al directorio y activar o
   desactivar un sitio. Nunca CV, carta, respuestas, perfil ni salario: la base no los devuelve.
   Desde operacion.md 0.2 (0054; Francisco, 20/11/2026: «yo sea un usuario más… dentro de operaciones me lleguen todas las
   fallas… lo de volver a probar lo voy a manejar yo dentro de operaciones»): Fallas, con todas las veces que Terna no pudo
   postular por alguien, su captura y «Volver a probar», que la persona ya no tiene; y lo que era Admin (Problemas, Personas,
   Ajustes, Empresas por completar y Avisos sin texto), que dibuja js/ops-admin.js.
   - La sesión vive en sessionStorage, con su propia clave ('terna-ops'): muere al cerrar la pestaña y no la ve otra pestaña, ni
     siquiera de Terna. No usa Terna.pagina (eso arma la sesión común de la web y redirige); de comun.js toma solo las piezas.
   - Todo dato se escribe con textContent (Terna.h) y todo link que sale de Terna pasa por Terna.urlExterna: el portal dibuja texto
     de terceros (puestos, empresas, errores de sitios).
   - Los textos son de js/ops-textos.js (operacion.md §6). */
'use strict';

(function () {
  const { h, icono, vaciar } = Terna;
  const O = window.TO;
  const SECCIONES = ['hoy', 'fallas', 'busqueda', 'postulaciones', 'paquetes', 'problemas', 'personas', 'contratar', 'corridas', 'ajustes', 'registro'];
  const FRESCO_S = 12 * 3600 - 120; // la base pide un código de las últimas 12 horas (ops_exigir)

  /* ---------- La sesión propia del portal ---------- */
  const almacen = {
    getItem(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    setItem(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento: dura lo que la página */ } },
    removeItem(k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* nada */ } },
  };
  const sb = window.supabase.createClient(Terna.CONFIG.url, Terna.CONFIG.clave, {
    auth: { storage: almacen, storageKey: 'terna-ops', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' },
  });

  const estado = {
    seccion: SECCIONES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'hoy',
    ventana: { postulaciones: leer('ventana.postulaciones', 7), paquetes: leer('ventana.paquetes', 7), corridas: leer('ventana.corridas', 7),
      fallas: leer('ventana.fallas', 30), uso: leer('ventana.uso', 7) },
    fallas: { estado: 'abiertas', motivo: null, sitio: null, buscar: '' },
    personas: leer('personas.vista', 'usuarios'),
    contratar: leer('contratar.vista', 'revisar'),
    busqueda: leer('busqueda.vista', 'sitios'),
    sitios: { filtro: 'problemas', fuente: '', buscar: '' },
    directorio: { filtro: 'pendientes', buscar: '' },
    postulaciones: { estado: 'a_mano', motivo: null, ats: null },
    paquetes: { fallas: false },
    corridas: leer('corridas.vista', 'corridas'),
    detalleDeTodos: false,
  };
  function leer(clave, defecto) { return Terna.leerLocal('ops.' + clave, defecto); }
  function guardar(clave, valor) { Terna.guardarLocal('ops.' + clave, valor); }

  let raiz, sub, cabecera;

  /* ---------- Errores de la base ---------- */
  class Barrera extends Error {}
  function mensaje(error) { return String((error && (error.message || error.code)) || ''); }
  // Llama a una función ops_* y devuelve sus datos; lo que pide entrar de nuevo lo resuelve acá.
  async function llamar(nombre, args) {
    const { data, error } = await sb.rpc(nombre, args || {});
    if (!error) return data;
    const m = mensaje(error);
    if (m.includes('falta_segundo_factor') || m.includes('segundo_factor_vencido')) {
      await pantallaCodigo(m.includes('vencido'));
      throw new Barrera(m);
    }
    if (m.includes('no_autorizado')) { await noAdmin(); throw new Barrera(m); }
    if (error.code === 'PGRST202' || error.code === '42883' || /Could not find the function/i.test(m)) {
      const e = new Error('falta_0053');
      e.falta0053 = true;
      throw e;
    }
    if (Terna.esErrorDeSesion(error)) { await sb.auth.signOut({ scope: 'local' }); pantallaEntrar(); throw new Barrera(m); }
    throw error;
  }
  function errorEn(cont, error, reintentar) {
    if (error instanceof Barrera || (error && error.barrera)) return;
    console.error('[Terna ops]', error && error.name, error && (error.code || ''), error && error.message);
    vaciar(cont);
    cont.append(h('div', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'),
      h('span', { text: error && error.falta0053 ? O.falta0053 : O.errorCarga }),
      error && error.falta0053 ? null : h('button', { class: 'btn', type: 'button', onclick: reintentar }, O.reintentar)));
  }

  // Lo de Admin (js/ops-admin.js) llama a las funciones admin_* y escribe config: desde la 0054 piden el segundo paso y, si
  // falta o venció, dicen `no_autorizado` (no `falta_segundo_factor`). Acá se resuelve: se vuelve a mirar la sesión y, si
  // el código venció, se pide uno nuevo. Dos `no_autorizado` seguidos con la sesión en orden quieren decir que no es admin.
  let ultimaBarrera = 0;
  async function esBarreraDe(error) {
    const m = mensaje(error);
    if (m.includes('falta_segundo_factor') || m.includes('segundo_factor_vencido')) { await pantallaCodigo(m.includes('vencido')); return true; }
    if (m.includes('no_autorizado')) {
      if (Date.now() - ultimaBarrera < 10000) await noAdmin(); else { ultimaBarrera = Date.now(); await despuesDeEntrar(); }
      return true;
    }
    if (Terna.esErrorDeSesion(error)) { await sb.auth.signOut({ scope: 'local' }); pantallaEntrar(); return true; }
    return false;
  }
  const api = {
    sb,
    async rpc(nombre, args) {
      const r = await sb.rpc(nombre, args || {});
      if (r.error && await esBarreraDe(r.error)) r.error.barrera = true;
      return r;
    },
    esBarrera: (e) => !!(e && (e.barrera || e instanceof Barrera)),
    errorEn: (cont, e, reintentar) => errorEn(cont, e, reintentar),
    // Con la sesión sin el segundo paso la base no da error: la política de config no deja cambiar nada. Por eso se pide la fila.
    async escribirConfig(cambios) {
      const r = await sb.from('config').update(cambios).eq('id', 1).select('id');
      if (r.error) { if (await esBarreraDe(r.error)) r.error.barrera = true; return r; }
      if (!(r.data || []).length) { const e = new Error('no_autorizado'); await esBarreraDe(e); e.barrera = true; return { data: null, error: e }; }
      return r;
    },
  };
  const admin = window.OpsAdmin(api);
  // Terna para contratar (contratar.md 0.1 §7; 0055): js/ops-contratar.js. Sin ese archivo, la sección no se ofrece.
  const contrata = window.OpsContratar ? window.OpsContratar(api) : null;

  /* ---------- Encabezado propio ---------- */
  function dibujarCabecera(conSesion) {
    vaciar(cabecera);
    cabecera.append(h('div', { class: 'op-barra' },
      // El logo «terna jobs» es el de la web (Terna.logo; propuesta LOGOS, brand.md §5.3).
      h('a', { class: 'logo', href: 'ops.html', 'aria-label': O.documento }, Terna.logo()),
      h('span', { class: 'op-marca', text: O.marca }),
      h('div', { class: 'op-cuenta' }, Terna.botonTema('btn-barra'),
        // En el celular, Salir queda en su ícono (css/ops.css): el nombre sigue en el span, para el lector de pantalla, y en el title.
        conSesion ? h('button', { class: 'btn btn-texto btn-barra op-salir', type: 'button', title: O.entrar.salir, onclick: salir },
          icono('i-salir'), h('span', { class: 'op-salir-texto', text: O.entrar.salir })) : null)));
  }
  async function salir() {
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual se sale */ }
    pantallaEntrar();
  }

  /* ---------- Entrar: mail y contraseña, después el código ---------- */
  function tarjetaAcceso(titulo, ...hijos) {
    vaciar(sub);
    sub.hidden = true;
    vaciar(raiz);
    const t = h('h1', { class: 'titulo op-acceso-titulo', tabindex: '-1', text: titulo });
    raiz.append(h('section', { class: 'tarjeta op-acceso' }, t, ...hijos));
    t.focus();
    return t;
  }
  function campo(id, etiqueta, control, ayuda) {
    const error = h('p', { class: 'campo-error', id: id + '-error', role: 'alert' });
    control.id = id;
    control.setAttribute('aria-describedby', (ayuda ? id + '-ayuda ' : '') + id + '-error');
    return { nodo: h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), control,
      ayuda ? h('p', { class: 'campo-ayuda', id: id + '-ayuda', text: ayuda }) : null, error), error, control };
  }
  function marcar(c, texto) {
    c.error.textContent = texto;
    if (texto) { c.control.setAttribute('aria-invalid', 'true'); c.control.focus(); } else c.control.removeAttribute('aria-invalid');
  }

  function pantallaEntrar() {
    dibujarCabecera(false);
    document.title = O.documento;
    const mail = campo('op-mail', O.entrar.mail, h('input', { class: 'control', type: 'email', autocomplete: 'username', required: true, spellcheck: 'false' }));
    const clave = campo('op-clave', O.entrar.contrasena, h('input', { class: 'control', type: 'password', autocomplete: 'current-password', required: true }));
    const boton = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, O.entrar.boton);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, mail.nodo, clave.nodo, boton);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      marcar(mail, ''); marcar(clave, '');
      const m = mail.control.value.trim();
      const c = clave.control.value;
      if (!m || !c) { marcar(m ? clave : mail, O.entrar.errorCompletar); return; }
      boton.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: m, password: c });
      boton.disabled = false;
      if (error) { marcar(clave, /invalid/i.test(mensaje(error)) ? O.entrar.errorCredenciales : O.entrar.falla); return; }
      await despuesDeEntrar();
    });
    tarjetaAcceso(O.entrar.titulo, h('p', { class: 'acceso-descripcion', text: O.entrar.intro }), form);
  }

  async function noAdmin() {
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* nada */ }
    dibujarCabecera(false);
    tarjetaAcceso(O.entrar.titulo, h('p', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'), h('span', { text: O.entrar.noAdmin })),
      h('button', { class: 'btn', type: 'button', onclick: pantallaEntrar }, O.entrar.boton));
  }

  function totpFresco(metodos) {
    const ahora = Date.now() / 1000;
    return (metodos || []).some((m) => m && m.method === 'totp' && ahora - Number(m.timestamp) < FRESCO_S);
  }

  async function despuesDeEntrar() {
    const { data: s } = await sb.auth.getSession();
    if (!s || !s.session) { pantallaEntrar(); return; }
    const uid = s.session.user.id;
    const u = await sb.from('usuarios').select('rol').eq('id', uid).maybeSingle();
    if (u.error) { errorEn(raiz, u.error, despuesDeEntrar); return; }
    if (!u.data || u.data.rol !== 'admin') { await noAdmin(); return; }
    const nivel = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    const lista = await sb.auth.mfa.listFactors();
    if (nivel.error || lista.error) { errorEn(raiz, nivel.error || lista.error, despuesDeEntrar); return; }
    const verificados = (lista.data && lista.data.totp) || [];
    if (nivel.data.currentLevel === 'aal2' && totpFresco(nivel.data.currentAuthenticationMethods)) { portal(); return; }
    if (verificados.length) { await pantallaCodigo(nivel.data.currentLevel === 'aal2'); return; }
    await pantallaActivar(false);
  }

  async function pantallaCodigo(vencido) {
    dibujarCabecera(true);
    const lista = await sb.auth.mfa.listFactors();
    const factores = (lista.data && lista.data.totp) || [];
    if (!factores.length) { await pantallaActivar(false); return; }
    const codigo = campo('op-codigo', O.entrar.codigo, h('input', { class: 'control control-corto op-codigo', type: 'text', inputmode: 'numeric',
      autocomplete: 'one-time-code', maxlength: '6', pattern: '[0-9]{6}', spellcheck: 'false' }));
    let elegido = factores[0].id;
    let selector = null;
    if (factores.length > 1) {
      const grupo = h('div', { class: 'opciones', role: 'radiogroup', 'aria-label': O.entrar.cualApp });
      factores.forEach((f, i) => grupo.append(h('label', { class: 'casilla' },
        h('input', { type: 'radio', name: 'op-factor', value: f.id, checked: i === 0, onchange: () => { elegido = f.id; } }),
        h('span', { text: O.registro.factor(f.friendly_name, Terna.fechaLarga(f.created_at)) }))));
      selector = h('fieldset', { class: 'campo' }, h('legend', { text: O.entrar.cualApp }), grupo);
    }
    const boton = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, O.entrar.codigoBoton);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, selector, codigo.nodo, boton);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = codigo.control.value.replace(/\s+/g, '');
      if (!/^[0-9]{6}$/.test(v)) { marcar(codigo, O.entrar.codigoFormato); return; }
      boton.disabled = true;
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: elegido, code: v });
      boton.disabled = false;
      if (error) { codigo.control.value = ''; marcar(codigo, O.entrar.codigoError); return; }
      portal();
    });
    tarjetaAcceso(O.entrar.codigoTitulo, h('p', { class: 'acceso-descripcion', text: vencido ? O.entrar.vencido : O.entrar.codigoIntro }), form);
    codigo.control.focus();
  }

  // El QR que devuelve Supabase es una imagen data: que la CSP no deja mostrar. Se lee como XML (no corre nada) y se copian solo
  // los rectángulos y los trazos, con números, a un SVG propio; si no se puede, queda la clave en texto y el link.
  function qrPropio(dataUri) {
    try {
      const texto = String(dataUri || '').replace(/^data:image\/svg\+xml;[^,]*,/, '');
      if (!texto.startsWith('<')) return null;
      const doc = new DOMParser().parseFromString(texto, 'image/svg+xml');
      const origen = doc.documentElement;
      if (!origen || origen.nodeName.toLowerCase() !== 'svg') return null;
      const NS = 'http://www.w3.org/2000/svg';
      const num = /^-?[0-9.]+$/;
      const svg = document.createElementNS(NS, 'svg');
      const vb = origen.getAttribute('viewBox');
      const w = origen.getAttribute('width');
      const alto = origen.getAttribute('height');
      if (vb && /^[0-9.\s-]+$/.test(vb)) svg.setAttribute('viewBox', vb);
      else if (num.test(w || '') && num.test(alto || '')) svg.setAttribute('viewBox', '0 0 ' + w + ' ' + alto);
      else return null;
      svg.setAttribute('class', 'op-qr');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', O.entrar.qrAccesible);
      const fondo = document.createElementNS(NS, 'rect');
      fondo.setAttribute('width', '100%'); fondo.setAttribute('height', '100%'); fondo.setAttribute('class', 'op-qr-fondo');
      svg.append(fondo);
      let marcas = 0;
      for (const el of origen.querySelectorAll('rect, path')) {
        const tipo = el.nodeName.toLowerCase();
        const relleno = String(el.getAttribute('fill') || el.getAttribute('style') || '').toLowerCase();
        if (/white|#fff\b|#ffffff/.test(relleno)) continue;
        const nuevo = document.createElementNS(NS, tipo);
        if (tipo === 'rect') {
          const ok = ['x', 'y', 'width', 'height'].every((a) => { const v = el.getAttribute(a) || '0'; if (!num.test(v)) return false; nuevo.setAttribute(a, v); return true; });
          if (!ok) continue;
          if (num.test(w || '') && el.getAttribute('width') === w && el.getAttribute('height') === alto) continue; // el fondo
        } else {
          const d = el.getAttribute('d') || '';
          if (!/^[MmLlHhVvZz0-9.,\s-]+$/.test(d)) continue;
          nuevo.setAttribute('d', d);
        }
        nuevo.setAttribute('class', 'op-qr-punto');
        svg.append(nuevo);
        marcas += 1;
      }
      return marcas ? svg : null;
    } catch (e) {
      return null;
    }
  }

  // Activar el segundo paso (o sumar otra app, con `otra`): un factor sin verificar que quedó a medias se da de baja antes.
  async function pantallaActivar(otra) {
    dibujarCabecera(true);
    const lista = await sb.auth.mfa.listFactors();
    if (lista.error) { errorEn(raiz, lista.error, () => pantallaActivar(otra)); return; }
    for (const f of (lista.data.all || []).filter((x) => x.factor_type === 'totp' && x.status !== 'verified')) {
      await sb.auth.mfa.unenroll({ factorId: f.id });
    }
    const alta = await sb.auth.mfa.enroll({ factorType: 'totp', issuer: 'Terna', friendlyName: O.entrar.nombreFactor(new Date().toISOString().slice(0, 16).replace('T', ' ')) });
    if (alta.error || !alta.data) {
      tarjetaAcceso(O.entrar.activarTitulo, h('p', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'), h('span', { text: O.entrar.falla })),
        h('button', { class: 'btn', type: 'button', onclick: () => pantallaActivar(otra) }, O.reintentar));
      return;
    }
    const totp = alta.data.totp || {};
    const qr = qrPropio(totp.qr_code);
    const claveTexto = h('code', { class: 'op-clave', text: String(totp.secret || '').replace(/(.{4})/g, '$1 ').trim() });
    const uri = /^otpauth:\/\//.test(String(totp.uri || '')) ? totp.uri : null;
    const codigo = campo('op-codigo-nuevo', O.entrar.codigo, h('input', { class: 'control control-corto op-codigo', type: 'text', inputmode: 'numeric',
      autocomplete: 'one-time-code', maxlength: '6', pattern: '[0-9]{6}', spellcheck: 'false' }));
    const boton = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, O.entrar.activarBoton);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, codigo.nodo, boton);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = codigo.control.value.replace(/\s+/g, '');
      if (!/^[0-9]{6}$/.test(v)) { marcar(codigo, O.entrar.codigoFormato); return; }
      boton.disabled = true;
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: alta.data.id, code: v });
      boton.disabled = false;
      if (error) { codigo.control.value = ''; marcar(codigo, O.entrar.codigoError); return; }
      if (otra) Terna.avisoBreve(O.registro.factorSumado);
      if (otra) { estado.seccion = 'registro'; history.replaceState(null, '', '#registro'); }
      portal();
    });
    tarjetaAcceso(O.entrar.activarTitulo,
      h('p', { class: 'acceso-descripcion', text: O.entrar.activarIntro }),
      qr ? h('div', { class: 'op-qr-caja' }, h('p', { class: 'campo-ayuda', text: O.entrar.activarQr }), qr) : null,
      uri ? h('p', { class: 'campo-ayuda' }, h('span', { text: O.entrar.activarLink + ' ' }),
        h('a', { href: uri, class: 'op-link' }, O.entrar.abrirApp)) : null,
      h('div', { class: 'op-clave-caja' }, h('p', { class: 'campo-ayuda', text: O.entrar.activarClave }), claveTexto,
        h('button', { class: 'btn btn-chico', type: 'button', onclick: () => Terna.copiar(String(totp.secret || ''), claveTexto) }, O.entrar.copiarClave)),
      form,
      otra ? null : h('p', { class: 'campo-ayuda', text: O.entrar.activarConsejo }));
  }

  /* ---------- El portal ---------- */
  async function portal() {
    dibujarCabecera(true);
    document.title = O.documento;
    sub.hidden = false;
    dibujarSub();
    await cargar();
  }
  function dibujarSub() {
    vaciar(sub);
    for (const s of SECCIONES) {
      sub.append(h('a', { href: '#' + s, 'aria-current': s === estado.seccion ? 'true' : null, onclick: (e) => { e.preventDefault(); ir(s); } }, O.secciones[s]));
    }
  }
  function ir(s) {
    estado.seccion = s;
    history.replaceState(null, '', '#' + s);
    dibujarSub();
    cargar().then(() => { const t = raiz.querySelector('h1'); if (t) t.focus(); });
  }
  async function cargar() {
    const quitar = Terna.cargando(raiz);
    try {
      if (estado.seccion === 'hoy') await hoy();
      else if (estado.seccion === 'fallas') await fallas();
      else if (estado.seccion === 'busqueda') await busqueda();
      else if (estado.seccion === 'postulaciones') await postulaciones();
      else if (estado.seccion === 'paquetes') await paquetes();
      else if (estado.seccion === 'problemas') await problemas();
      else if (estado.seccion === 'personas') await personas();
      else if (estado.seccion === 'contratar') await contratar();
      else if (estado.seccion === 'corridas') await corridas();
      else if (estado.seccion === 'ajustes') await ajustes();
      else await registro();
    } catch (e) {
      errorEn(raiz, e, cargar);
    } finally {
      quitar();
    }
  }
  // El título de cada sección, con «Actualizar» y la hora de la lectura.
  function encabezado(titulo, intro) {
    const t = h('h1', { class: 'titulo op-titulo', tabindex: '-1', text: titulo });
    return h('div', { class: 'op-encabezado' },
      h('div', { class: 'op-encabezado-fila' }, t,
        h('div', { class: 'op-actualizar' }, h('span', { class: 'suave', text: O.comun.leido(Terna.hora(new Date())) }),
          h('button', { class: 'btn btn-chico', type: 'button', onclick: cargar }, O.comun.actualizar))),
      intro ? h('p', { class: 'intro', text: intro }) : null);
  }
  function segmentado(nombre, opciones, actual, alCambiar) {
    const seg = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': nombre });
    const id = Terna.idUnico('seg');
    for (const [valor, texto] of opciones) {
      seg.append(h('label', null, h('input', { type: 'radio', name: id, value: String(valor), checked: String(actual) === String(valor),
        onchange: () => alCambiar(valor) }), h('span', { text: texto })));
    }
    return seg;
  }
  function selectorVentana(clave, opciones) {
    return segmentado(O.comun.ventanaNombre, (opciones || [1, 7, 30]).map((d) => [d, O.comun.ventana[d]]), estado.ventana[clave], (d) => {
      estado.ventana[clave] = Number(d);
      guardar('ventana.' + clave, Number(d));
      cargar();
    });
  }
  const tabla = (nombre, cabeza, filas, numericas) => h('div', { class: 'tabla-caja', tabindex: '0', role: 'region', 'aria-label': nombre },
    h('table', { class: 'tabla op-tabla' },
      h('thead', null, h('tr', null, cabeza.map((t, i) => h('th', { scope: 'col', class: numericas && numericas.includes(i) ? 'der' : null }, t || Terna.oculto(nombre))))),
      h('tbody', null, filas)));
  const celda = (valor, der) => h('td', { class: der ? 'der num' : null, text: valor === null || valor === undefined || valor === '' ? O.comun.sinDato : String(valor) });
  const num = (x) => (x === null || x === undefined ? null : Terna.numero(Number(x)));
  const fechaHora = (x) => (x ? Terna.fechaLarga(x) + ' ' + Terna.hora(x) : null);
  const pct = (x) => (x === null || x === undefined ? null : Math.round(Number(x) * 100) + ' %');
  function chipGravedad(g) {
    const clase = { roto: 'chip-error', mirar: 'chip-espera', bien: 'chip-accion' }[g];
    const ic = { roto: 'i-alerta', mirar: 'i-revisar', bien: 'i-tilde' }[g];
    return h('span', { class: 'chip ' + clase }, icono(ic, 'icono-14'), O.gravedad[g]);
  }
  function link(url, texto) {
    const u = Terna.urlExterna(url);
    return u ? h('a', { href: u, target: '_blank', rel: 'noopener noreferrer', class: 'op-link' }, texto, icono('i-abrir', 'icono-14')) : null;
  }
  function meta(...partes) {
    const p = h('p', { class: 'op-meta' });
    partes.filter((x) => x !== null && x !== undefined && x !== '').forEach((x, i) => {
      if (i) p.append(h('span', { 'aria-hidden': 'true', text: ' · ' }));
      p.append(x instanceof Node ? x : h('span', { text: String(x) }));
    });
    return p;
  }
  // «Detalle»: un botón que abre lo demás, armado recién al abrir.
  function plegable(armar, texto) {
    const id = Terna.idUnico('det');
    const cuerpo = h('div', { class: 'op-detalle', id, hidden: true });
    let armado = false;
    const b = h('button', { class: 'btn btn-texto btn-chico op-plegar', type: 'button', 'aria-expanded': 'false', 'aria-controls': id }, texto || O.comun.detalle, icono('i-chevron', 'icono-16'));
    b.addEventListener('click', () => {
      const abrir = cuerpo.hidden;
      if (abrir && !armado) { armar(cuerpo); armado = true; }
      cuerpo.hidden = !abrir;
      b.setAttribute('aria-expanded', String(abrir));
    });
    return [b, cuerpo];
  }
  const errorMono = (texto) => (texto ? h('pre', { class: 'caso-error op-error', text: texto }) : null);
  const corto = (id) => String(id || '').slice(0, 8);

  /* ---------- Hoy ---------- */
  async function hoy() {
    const [e, fa, casos, completarN, sinTextoN] = await Promise.all([llamar('ops_estado'), llamar('ops_fallas_resumen', { p_dias: 30 }),
      admin.contarCasos(), admin.contarCompletar(), admin.contarSinTexto()]);
    estado.detalleDeTodos = !!(e.ajustes && e.ajustes.detalle_de_todos);
    const H = O.hoy;
    const tarjetas = [];
    const mo = e.motor || {};
    const uc = mo.ultima_completa;
    {
      const lineas = [];
      let g = 'bien';
      if (mo.pausado) { g = 'roto'; lineas.push(H.motor.pausado(mo.pausado_motivo)); }
      if (uc && uc.estado === 'fallida') { g = 'roto'; lineas.push(H.motor.fallida); }
      if (!uc) { g = 'roto'; lineas.push(H.motor.nunca); } else if (Number(mo.horas_desde_completa) > 30) { g = 'roto'; lineas.push(H.motor.sinCompleta(mo.horas_desde_completa)); }
      if (uc && uc.tope_alcanzado) { if (g === 'bien') g = 'mirar'; lineas.push(H.motor.tope); }
      if (uc) lineas.push(H.motor.ultima(Terna.fechaLarga(uc.iniciada_en), Terna.hora(uc.iniciada_en), uc.duracion_s ? O.comun.minutos(uc.duracion_s) : null));
      if (uc && uc.error) lineas.push(uc.error);
      if (mo.version) lineas.push(H.motor.version(mo.version));
      tarjetas.push({ g, titulo: H.motor.titulo, cifra: uc ? Terna.fechaCorta(uc.iniciada_en) : null, etiqueta: null, lineas, ir: H.motor.ir, destino: () => ir('corridas') });
    }
    {
      const f = e.fuentes || {};
      const lineas = [];
      let g = 'bien';
      if (Number(f.con_error)) { g = 'roto'; lineas.push(H.fuentes.conError(f.con_error, (f.ids_con_error || []).join(', '))); }
      if (Number(f.sin_leer_36h)) { if (g === 'bien') g = 'mirar'; lineas.push(H.fuentes.sinLeer(f.sin_leer_36h)); }
      if (g === 'bien') lineas.push(H.fuentes.bien(f.activas));
      tarjetas.push({ g, titulo: H.fuentes.titulo, cifra: num(f.activas), etiqueta: H.fuentes.etiqueta(f.activas), lineas, ir: H.fuentes.ir,
        destino: () => { estado.busqueda = 'fuentes'; guardar('busqueda.vista', 'fuentes'); ir('busqueda'); } });
    }
    {
      const s = e.sitios || {};
      const malos = Number(s.con_error) + Number(s.desactivados_motor) + Number(s.sin_leer_3d);
      tarjetas.push({ g: malos ? 'mirar' : 'bien', titulo: H.sitios.titulo, cifra: num(s.activos), etiqueta: H.sitios.etiqueta(s.activos),
        lineas: [malos ? H.sitios.linea(s.con_error, s.desactivados_motor, s.sin_leer_3d) : H.sitios.bien], ir: H.sitios.ir,
        destino: () => { estado.busqueda = 'sitios'; estado.sitios.filtro = 'problemas'; guardar('busqueda.vista', 'sitios'); ir('busqueda'); } });
    }
    {
      const p = (e.postulaciones || {}).h24 || {};
      const d7 = (e.postulaciones || {}).d7 || {};
      let g = 'bien';
      const lineas = [H.postulaciones.linea(p.enviadas, p.a_mano, p.en_cola)];
      if (Number(p.error)) { g = 'roto'; lineas.push(H.postulaciones.errores(p.error)); } else if (Number(p.a_mano) > Number(p.enviadas)) g = 'mirar';
      const base7 = Number(d7.enviadas) + Number(d7.a_mano_tecnicas);
      if (base7) lineas.push(H.postulaciones.tasa(pct(Number(d7.enviadas) / base7)));
      tarjetas.push({ g, titulo: H.postulaciones.titulo, cifra: num(p.enviadas), etiqueta: H.postulaciones.etiqueta(p.enviadas), lineas, ir: H.postulaciones.ir,
        destino: () => { estado.postulaciones = { estado: 'a_mano', motivo: null, ats: null }; estado.ventana.postulaciones = 1; ir('postulaciones'); } });
    }
    {
      const p = (e.paquetes || {}).h24 || {};
      const d7 = (e.paquetes || {}).d7 || {};
      const g = Number(p.no_se_pudo) ? 'roto' : Number(p.errores_armar) ? 'mirar' : 'bien';
      const lineas = [H.paquetes.linea(p.armados, p.no_se_pudo, p.errores_armar)];
      if (Number(d7.armados)) lineas.push(H.paquetes.porPaquete(O.comun.usd(Number(d7.usd_armar) / Number(d7.armados))));
      tarjetas.push({ g, titulo: H.paquetes.titulo, cifra: num(p.armados), etiqueta: H.paquetes.etiqueta(p.armados), lineas, ir: H.paquetes.ir,
        destino: () => { estado.paquetes.fallas = true; estado.ventana.paquetes = 7; ir('paquetes'); } });
    }
    {
      const pr = e.problemas;
      if (pr) {
        const g = Number(pr.para_vos) ? 'roto' : Number(pr.nuevos) ? 'mirar' : 'bien';
        tarjetas.push({ g, titulo: H.problemas.titulo, cifra: num(pr.para_vos), etiqueta: H.problemas.etiqueta,
          lineas: [H.problemas.linea(pr.para_vos, pr.nuevos, pr.en_curso, pr.arreglados)], ir: H.problemas.ir, destino: () => ir('problemas') });
      } else if (casos) {
        tarjetas.push({ g: casos.paraVos ? 'roto' : casos.nuevos ? 'mirar' : 'bien', titulo: H.problemas.titulo, cifra: num(casos.paraVos), etiqueta: H.problemas.etiqueta,
          lineas: [H.problemas.linea(casos.paraVos, casos.nuevos, 0, 0)], ir: H.problemas.ir, destino: () => ir('problemas') });
      }
    }
    {
      // Las fallas de postulación de todos (0054): las nuevas desde la última vez que las marcaste vistas.
      const nuevas = Number(fa.nuevas) || 0;
      const abiertas = Number(fa.abiertas) || 0;
      tarjetas.push({ g: nuevas ? 'mirar' : 'bien', titulo: H.fallas.titulo, cifra: num(nuevas), etiqueta: H.fallas.etiqueta(nuevas),
        lineas: [nuevas || abiertas ? H.fallas.linea(nuevas, abiertas, fa.personas) : H.fallas.bien], ir: H.fallas.ir,
        destino: () => { estado.fallas = { estado: nuevas ? 'todas' : 'abiertas', motivo: null, sitio: null, buscar: '' }; ir('fallas'); } });
    }
    if (completarN !== null || sinTextoN !== null) {
      const ce = Number(completarN) || 0;
      const st = Number(sinTextoN) || 0;
      tarjetas.push({ g: ce || st ? 'mirar' : 'bien', titulo: H.completar.titulo, cifra: num(ce + st), etiqueta: H.completar.etiqueta(ce + st),
        lineas: [ce || st ? H.completar.linea(ce, st) : H.completar.bien], ir: H.completar.ir,
        destino: () => { const v = !ce && st ? 'sinTexto' : 'completar'; estado.busqueda = v; guardar('busqueda.vista', v); ir('busqueda'); } });
    }
    {
      const c = e.costo || {};
      const tope = Number(c.tope_usd_dia) || 0;
      const hoyUsd = Number(c.usd_hoy) || 0;
      const g = tope && hoyUsd >= tope ? 'roto' : tope && hoyUsd >= 0.8 * tope ? 'mirar' : 'bien';
      tarjetas.push({ g, titulo: H.costo.titulo, cifra: O.comun.usd(hoyUsd), etiqueta: H.costo.etiqueta,
        lineas: [H.costo.linea(O.comun.usd(hoyUsd), O.comun.usd(tope), O.comun.usd(c.usd_7d))], ir: H.costo.ir,
        destino: () => { estado.corridas = 'costos'; guardar('corridas.vista', 'costos'); ir('corridas'); } });
    }
    {
      const pe = e.personas || {};
      const lineas = [H.capacidad.personas(pe.activas, pe.pausadas)];
      let g = 'bien';
      if (uc && Number(uc.usuarios_no_alcanzados)) { g = 'roto'; lineas.push(H.capacidad.noAlcanzadas(uc.usuarios_no_alcanzados)); }
      const max = Number(mo.max_duracion_min) || 0;
      if (uc && uc.duracion_s && max) {
        lineas.push(H.capacidad.duracion(O.comun.minutos(uc.duracion_s), max));
        if (g === 'bien' && Number(uc.duracion_s) >= 0.8 * max * 60) g = 'mirar';
      }
      tarjetas.push({ g, titulo: H.capacidad.titulo, cifra: num(pe.activas), etiqueta: H.capacidad.etiqueta(pe.activas), lineas, ir: H.capacidad.ir, destino: () => ir('corridas') });
    }
    // Terna para contratar (contratar.md 0.1 §7): los avisos que esperan tu revisión o que alguien marcó, solo si hay.
    if (contrata) {
      const rc = await api.rpc('ops_contrata_por_revisar');
      const pc = rc.error ? [] : rc.data || [];
      if (pc.length) {
        const HC = O.contratar.hoy;
        const enRev = pc.filter((x) => x.estado === 'en_revision').length;
        tarjetas.push({ g: 'mirar', titulo: HC.titulo, cifra: num(pc.length), etiqueta: HC.etiqueta(pc.length),
          lineas: [enRev ? HC.enRevision(enRev) : null, pc.length - enRev ? HC.marcados(pc.length - enRev) : null].filter(Boolean), ir: HC.ir, destino: () => { estado.contratar = 'revisar'; ir('contratar'); } });
      }
    }
    const orden = { roto: 0, mirar: 1, bien: 2 };
    tarjetas.sort((a, b) => orden[a.g] - orden[b.g]);
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.hoy, H.intro));
    if (tarjetas.every((t) => t.g === 'bien')) {
      raiz.append(h('p', { class: 'op-todo-bien', role: 'status' }, icono('i-tilde'), h('span', { text: H.todoBien })));
    }
    const lista = h('div', { class: 'op-tarjetas op-hoy' });
    tarjetas.forEach((t, i) => {
      const idT = 'hoy-' + i;
      const accion = t.href ? h('a', { class: 'op-ir', href: t.href }, t.ir, icono('i-adelante', 'icono-16'))
        : h('button', { class: 'btn btn-texto btn-chico op-ir', type: 'button', onclick: t.destino }, t.ir, icono('i-adelante', 'icono-16'));
      lista.append(h('section', { class: 'tarjeta op-tarjeta op-' + t.g, 'aria-labelledby': idT },
        h('div', { class: 'op-cabeza' }, chipGravedad(t.g), h('h2', { class: 'tarjeta-titulo', id: idT, text: t.titulo })),
        t.cifra !== null && t.cifra !== undefined ? h('p', { class: 'op-cifra' }, h('span', { class: 'cifra-numero num', text: t.cifra }),
          t.etiqueta ? h('span', { class: 'suave', text: ' ' + t.etiqueta }) : null) : null,
        t.lineas.map((l) => h('p', { class: 'op-linea', text: l })),
        accion));
    });
    raiz.append(lista, h('p', { class: 'campo-ayuda op-pie', text: estado.detalleDeTodos ? H.interruptorPrendido : H.interruptorApagado }));
  }

  /* ---------- Búsqueda: fuentes, sitios y directorio ---------- */
  async function busqueda() {
    const B = O.busqueda;
    const vista = ['fuentes', 'sitios', 'directorio', 'completar', 'sinTexto'].includes(estado.busqueda) ? estado.busqueda : 'sitios';
    const cont = h('div', { class: 'op-lista' });
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.busqueda, B.intro),
      h('div', { class: 'herramientas' }, segmentado(B.vistasNombre, Object.entries(B.vistas), vista, (v) => { estado.busqueda = v; guardar('busqueda.vista', v); cargar(); })),
      cont);
    if (vista === 'fuentes') await fuentes(cont);
    else if (vista === 'sitios') await sitios(cont);
    else if (vista === 'completar') await admin.completar(cont);
    else if (vista === 'sinTexto') await admin.sinTexto(cont);
    else await directorio(cont);
  }

  async function fuentes(cont) {
    const F = O.busqueda.fuentes;
    const datos = await llamar('ops_fuentes');
    if (!datos.length) { cont.append(h('p', { class: 'vacio', text: F.vacio })); return; }
    const filas = datos.map((f) => h('tr', { class: f.activa && f.ultimo_error ? 'op-fila-error' : null },
      h('th', { scope: 'row', text: f.nombre || f.id }), celda(f.tipo), celda(f.activa ? F.si : F.no),
      celda(f.ultima_lectura_en ? Terna.relativa(f.ultima_lectura_en) + ' ' + Terna.hora(f.ultima_lectura_en) : F.nunca),
      celda(num(f.avisos_activos), true), celda(num(f.nuevos_7d), true), celda(num(f.cerrados_7d), true),
      celda(num(f.sitios_activos), true), celda(num(f.sitios_con_error), true),
      h('td', { class: 'op-celda-error', text: f.ultimo_error || O.comun.sinDato })));
    cont.append(tabla(O.busqueda.vistas.fuentes, F.cols, filas, [4, 5, 6, 7, 8]));
  }

  function estadoSitio(s) {
    const E = O.busqueda.sitios.estados;
    if (s.activa) return s.ultimo_error ? ['chip-error', E.con_error] : ['chip-accion', E.activo];
    if (s.desactivada_por === 'motor') return ['chip-espera', E.motor];
    if (s.desactivada_por === 'admin') return ['', E.admin];
    return ['', E.otro];
  }
  async function sitios(cont, desde, lista) {
    const S = O.busqueda.sitios;
    const f = estado.sitios;
    if (!desde) {
      const buscar = h('input', { class: 'control op-buscar', type: 'search', 'aria-label': S.buscar, placeholder: S.buscar, value: f.buscar, spellcheck: 'false' });
      let espera = null;
      buscar.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => { f.buscar = buscar.value.trim(); recargar(); }, 300); });
      const sistemas = ['', 'greenhouse', 'lever', 'ashby', 'workable', 'workday', 'successfactors', 'oracle', 'smartrecruiters', 'eightfold', 'jibe', 'avature'];
      const sel = h('select', { class: 'control op-select', 'aria-label': S.sistema, onchange: (e) => { f.fuente = e.target.value; recargar(); } },
        sistemas.map((s) => h('option', { value: s, selected: f.fuente === s, text: s || S.sistemaTodos })));
      cont.append(h('div', { class: 'op-filtros' },
        segmentado(S.filtrosNombre, Object.entries(S.filtros), f.filtro, (v) => { f.filtro = v; recargar(); }),
        h('label', { class: 'op-filtro-campo' }, h('span', { class: 'campo-ayuda', text: S.sistema }), sel), buscar));
      lista = h('div', { class: 'op-tarjetas' });
      cont.append(lista);
    }
    const recargar = () => { const l = cont.querySelector('.op-tarjetas'); vaciar(l); const m = cont.querySelector('.mas-resultados'); if (m) m.remove(); sitios(cont, 0, l).catch((e) => errorEn(l, e)); };
    const datos = await llamar('ops_sitios', { p_filtro: f.filtro, p_fuente: f.fuente || null, p_buscar: f.buscar || null, p_limite: 50, p_desde: desde || 0 });
    if (!desde && !datos.length) { lista.append(h('p', { class: 'vacio', text: f.filtro === 'problemas' && !f.buscar && !f.fuente ? S.vacioProblemas : S.vacio })); return; }
    datos.forEach((s) => lista.append(tarjetaSitio(s)));
    const total = datos.length ? Number(datos[0].total) : 0;
    const vistos = (desde || 0) + datos.length;
    const pie = cont.querySelector('.mas-resultados');
    if (pie) pie.remove();
    if (vistos < total) {
      cont.append(h('div', { class: 'mas-resultados' }, h('span', { class: 'suave', text: O.comun.deN(vistos, total) }),
        h('button', { class: 'btn', type: 'button', onclick: (e) => { e.currentTarget.disabled = true; sitios(cont, vistos, lista).catch((x) => errorEn(lista, x)); } }, O.comun.verMas)));
    }
  }
  function tarjetaSitio(s) {
    const S = O.busqueda.sitios;
    const [clase, texto] = estadoSitio(s);
    const idT = 'sitio-' + s.id;
    const t = h('section', { class: 'tarjeta op-item', 'aria-labelledby': idT });
    const boton = h('button', { class: 'btn btn-chico', type: 'button' }, s.activa ? S.desactivar : S.activar);
    boton.addEventListener('click', async () => {
      if (s.activa) {
        const si = await Terna.confirmar({ titulo: S.desactivarTitulo(s.empresa), texto: S.desactivarTexto, si: S.desactivar, no: T.comun.cancelar });
        if (!si) return;
      }
      boton.disabled = true;
      try {
        await llamar('ops_sitio_activar', { p_sitio: s.id, p_activa: !s.activa });
        Terna.avisoBreve(s.activa ? S.desactivado : S.activado);
        s.activa = !s.activa;
        if (s.activa) { s.desactivada_por = null; s.ultimo_error = null; s.lecturas_vacias = 0; } else { s.desactivada_por = 'admin'; s.desactivada_en = new Date().toISOString(); }
        const nueva = tarjetaSitio(s);
        t.replaceWith(nueva);
        const b = nueva.querySelector('.op-acciones .btn');
        if (b) b.focus();
      } catch (e) {
        boton.disabled = false;
        if (!(e instanceof Barrera)) Terna.avisoBreve(T.errores.guardar, { error: true });
      }
    });
    Terna.agregar(t, [
      h('div', { class: 'op-cabeza' }, h('span', { class: 'chip ' + clase, text: texto }), h('h2', { class: 'tarjeta-titulo', id: idT, text: s.empresa })),
      meta(s.fuente_id + ' / ' + s.slug, S.avisos(s.avisos_total, s.avisos_utiles),
        s.ultima_lectura_en ? S.leido(Terna.relativa(s.ultima_lectura_en)) : S.nunca,
        Number(s.lecturas_vacias) ? S.vacias(s.lecturas_vacias) : null,
        !s.activa && s.desactivada_en ? S.desactivadoEl(Terna.fechaLarga(s.desactivada_en)) : null,
        S.origen[s.origen] || s.origen),
      errorMono(s.ultimo_error),
      h('div', { class: 'botones op-acciones' }, link(s.url_portal, O.comun.abrirSitio), boton,
        h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => Terna.copiar(textoSitio(s)) }, O.comun.copiarChat))]);
    return t;
  }
  function textoSitio(s) {
    return ['Terna · Operación · sitio de una empresa',
      'empresa: ' + s.empresa + ' · sistema: ' + s.fuente_id + ' · slug: ' + s.slug,
      'link: ' + (s.url_portal || '—'),
      'activo: ' + (s.activa ? 'sí' : 'no' + (s.desactivada_por ? ' (por ' + s.desactivada_por + ')' : '')) + ' · última lectura: ' + (fechaHora(s.ultima_lectura_en) || 'nunca'),
      'avisos: ' + (s.avisos_total ?? '—') + ' · útiles: ' + (s.avisos_utiles ?? '—') + ' · lecturas vacías: ' + (s.lecturas_vacias ?? 0),
      s.ultimo_error ? 'error: ' + s.ultimo_error : null].filter(Boolean).join('\n');
  }

  async function directorio(cont, desde, lista) {
    const D = O.busqueda.directorio;
    const f = estado.directorio;
    if (!desde) {
      const buscar = h('input', { class: 'control op-buscar', type: 'search', 'aria-label': D.buscar, placeholder: D.buscar, value: f.buscar, spellcheck: 'false' });
      let espera = null;
      buscar.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => { f.buscar = buscar.value.trim(); recargar(); }, 300); });
      cont.append(h('div', { class: 'op-filtros' },
        h('button', { class: 'btn btn-primario', type: 'button', onclick: (e) => dialogoSumar(e.currentTarget, recargar) }, icono('i-agregar'), D.sumar),
        segmentado(D.filtrosNombre, Object.entries(D.filtros), f.filtro, (v) => { f.filtro = v; recargar(); }), buscar));
      lista = h('div', { class: 'op-tarjetas' });
      cont.append(lista);
    }
    const recargar = () => { const l = cont.querySelector('.op-tarjetas'); vaciar(l); const m = cont.querySelector('.mas-resultados'); if (m) m.remove(); directorio(cont, 0, l).catch((e) => errorEn(l, e)); };
    const datos = await llamar('ops_directorio', { p_filtro: f.filtro, p_buscar: f.buscar || null, p_limite: 50, p_desde: desde || 0 });
    if (!desde && !datos.length) { lista.append(h('p', { class: 'vacio', text: D.vacio })); return; }
    datos.forEach((d) => lista.append(tarjetaEmpresa(d)));
    const total = datos.length ? Number(datos[0].total) : 0;
    const vistos = (desde || 0) + datos.length;
    const pie = cont.querySelector('.mas-resultados');
    if (pie) pie.remove();
    if (vistos < total) {
      cont.append(h('div', { class: 'mas-resultados' }, h('span', { class: 'suave', text: O.comun.deN(vistos, total) }),
        h('button', { class: 'btn', type: 'button', onclick: (e) => { e.currentTarget.disabled = true; directorio(cont, vistos, lista).catch((x) => errorEn(lista, x)); } }, O.comun.verMas)));
    }
  }
  function tarjetaEmpresa(d) {
    const D = O.busqueda.directorio;
    const ver = d.verificacion || 'ninguna';
    const clase = { ok: 'chip-accion', ninguna: 'chip-espera', portal: 'chip-error', no_responde: 'chip-error', no_coincide: 'chip-error' }[ver] || '';
    const idT = 'emp-' + Terna.idUnico('d');
    return h('section', { class: 'tarjeta op-item', 'aria-labelledby': idT },
      h('div', { class: 'op-cabeza' }, h('span', { class: 'chip ' + clase, text: D.verificacion[ver] || ver }),
        h('h2', { class: 'tarjeta-titulo', id: idT, text: d.nombre || d.empresa })),
      meta(D.estados[d.estado] || d.estado, d.sistema ? D.sistemaDe(d.sistema) : null, D.avisos(d.avisos_abiertos),
        D.cargo(D.origen[d.origen] || d.origen), d.verificado_en ? D.verificadaEl(Terna.fechaLarga(d.verificado_en)) : null,
        d.tablero_fuente && d.tablero_slug ? D.tablero(d.tablero_fuente, d.tablero_slug) : null),
      d.nota ? h('p', { class: 'campo-ayuda', text: d.nota }) : null,
      h('div', { class: 'botones op-acciones' }, link(d.empleos_url, O.comun.abrirSitio), d.carreras_url && d.carreras_url !== d.empleos_url ? link(d.carreras_url, d.carreras_url.replace(/^https?:\/\//, '').slice(0, 40)) : null));
  }
  function dialogoSumar(origen, alTerminar) {
    const D = O.busqueda.directorio.dialogo;
    const nombre = campo('op-emp-nombre', D.nombre, h('input', { class: 'control', type: 'text', maxlength: '200', autocomplete: 'off' }));
    const url = campo('op-emp-url', D.link, h('input', { class: 'control', type: 'url', maxlength: '2048', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://' }), D.linkAyuda);
    const nota = campo('op-emp-nota', D.nota, h('textarea', { class: 'control', rows: '2', maxlength: '300' }), D.notaAyuda);
    const bNo = h('button', { class: 'btn', type: 'button' }, T.comun.cancelar);
    const bSi = h('button', { class: 'btn btn-primario', type: 'submit', form: 'op-form-emp' }, D.guardar);
    const form = h('form', { id: 'op-form-emp', class: 'formulario-angosto', novalidate: true }, nombre.nodo, url.nodo, nota.nodo);
    const dlg = Terna.dialogo({ titulo: D.titulo, cuerpo: form, botones: [bNo, bSi] });
    bNo.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => Terna.devolverFoco(origen));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [nombre, url, nota].forEach((c) => marcar(c, ''));
      const n = nombre.control.value.trim();
      const u = url.control.value.trim();
      const t = nota.control.value.trim();
      if (!n) { marcar(nombre, D.errorNombre); return; }
      const clave = window.Empresas ? Empresas.normalizada(n) : n.toLowerCase();
      if (!clave) { marcar(nombre, D.errorEmpresa); return; }
      if (!/^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{2,5})?(\/\S*)?$/.test(u)) { marcar(url, D.errorUrl); return; }
      if (t.length > 300 || /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t)) { marcar(nota, D.errorNota); return; }
      bSi.disabled = true;
      try {
        const r = await llamar('ops_sumar_empresa', { p_nombre: n, p_empresa: clave, p_url: u, p_nota: t || null });
        dlg.close();
        Terna.avisoBreve(r && r.ya_estaba ? D.actualizada : D.hecha);
        estado.directorio.filtro = 'tuyas';
        estado.directorio.buscar = '';
        if (alTerminar) cargar();
      } catch (err) {
        bSi.disabled = false;
        if (err instanceof Barrera) { dlg.close(); return; }
        const m = mensaje(err);
        if (m.includes('url_de_portal')) marcar(url, D.errorPortal);
        else if (m.includes('url_invalida')) marcar(url, D.errorUrl);
        else if (m.includes('nota_invalida')) marcar(nota, D.errorNota);
        else if (m.includes('empresa_invalida') || m.includes('nombre_invalido')) marcar(nombre, D.errorEmpresa);
        else Terna.avisoBreve(T.errores.guardar, { error: true });
      }
    });
    dlg.showModal();
    nombre.control.focus();
  }

  /* ---------- Postulaciones ---------- */
  const textoMotivo = (m) => O.postulaciones.motivos[m || ''] || m || O.postulaciones.motivos[''];
  async function postulaciones() {
    const P = O.postulaciones;
    const dias = estado.ventana.postulaciones;
    const r = await llamar('ops_postulaciones_resumen', { p_dias: dias });
    const e = await llamar('ops_estado');
    estado.detalleDeTodos = !!(e.ajustes && e.ajustes.detalle_de_todos);
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.postulaciones, P.intro), h('div', { class: 'herramientas' }, selectorVentana('postulaciones')));
    const pe = r.por_estado || {};
    const cifras = h('dl', { class: 'op-cifras' });
    for (const k of ['enviada', 'a_mano', 'en_cola', 'para_revisar', 'postulado']) {
      cifras.append(h('div', { class: 'op-cifra-caja' }, h('dt', { class: 'suave', text: P.estados[k] }), h('dd', { class: 'cifra-numero num', text: num(pe[k] || 0) })));
    }
    raiz.append(h('section', { class: 'tarjeta op-resumen' }, cifras,
      h('p', { class: 'op-linea', text: r.tasa_automatica === null || r.tasa_automatica === undefined ? P.tasaNada : P.tasa(pct(r.tasa_automatica)) }),
      h('p', { class: 'campo-ayuda', text: P.totales(r.total, r.personas) })));
    const verMotivo = (m) => { estado.postulaciones = { estado: 'a_mano', motivo: m, ats: null }; dibujarLista(); };
    const grupos = h('div', { class: 'op-grupos' });
    grupos.append(grupo(P.porMotivo, P.porMotivoCols, (r.por_motivo || []).map((x) => h('tr', null,
      h('th', { scope: 'row' }, h('button', { class: 'btn-enlace', type: 'button', 'aria-label': P.verLas(textoMotivo(x.motivo)), onclick: () => verMotivo(x.motivo) }, textoMotivo(x.motivo))),
      celda(num(x.n), true), celda(num(x.personas), true))), [1, 2]));
    grupos.append(grupo(P.porAts, P.porAtsCols, (r.por_ats || []).map((x) => h('tr', null,
      h('th', { scope: 'row', text: x.ats }), celda(num(x.enviadas), true), celda(num(x.a_mano), true), celda(num(x.tecnicas), true), celda(num(x.personas), true))), [1, 2, 3, 4]));
    grupos.append(grupo(P.porSitio, P.porSitioCols, (r.por_sitio || []).map((x) => h('tr', null,
      h('th', { scope: 'row', text: x.sitio }), celda(num(x.enviadas), true), celda(num(x.a_mano), true))), [1, 2]));
    grupos.append(grupo(P.porEmpresa, P.porEmpresaCols, (r.por_empresa || []).map((x) => h('tr', null,
      h('th', { scope: 'row', text: x.empresa }), celda(num(x.enviadas), true), celda(num(x.a_mano), true))), [1, 2]));
    raiz.append(grupos);
    const listaCaja = h('section', { class: 'op-seccion', 'aria-labelledby': 'op-pos-lista' });
    raiz.append(listaCaja);
    async function dibujarLista() {
      vaciar(listaCaja);
      const f = estado.postulaciones;
      Terna.agregar(listaCaja, [h('h2', { class: 'op-subtitulo', id: 'op-pos-lista', tabindex: '-1', text: P.lista }),
        estado.detalleDeTodos ? null : h('p', { class: 'campo-ayuda', text: P.soloTuyas }),
        h('div', { class: 'op-filtros' },
          segmentado(P.filtroEstado, ['a_mano', 'enviada', 'en_cola', 'para_revisar'].map((k) => [k, P.estados[k]]), f.estado,
            (v) => { estado.postulaciones = { estado: v, motivo: null, ats: null }; dibujarLista(); }),
          f.motivo !== null && f.motivo !== undefined ? h('span', { class: 'chip chip-filtro' }, P.filtroMotivo(textoMotivo(f.motivo)),
            h('button', { type: 'button', 'aria-label': P.quitarFiltro, onclick: () => { f.motivo = null; dibujarLista(); } }, icono('i-cerrar', 'icono-14'))) : null)]);
      const lista = h('div', { class: 'op-tarjetas' });
      listaCaja.append(lista);
      await masPostulaciones(lista, listaCaja, null);
    }
    await dibujarLista();
  }
  function grupo(titulo, cols, filas, numericas) {
    return h('section', { class: 'op-grupo' }, h('h2', { class: 'op-subtitulo', text: titulo }),
      filas.length ? tabla(titulo, cols, filas, numericas) : h('p', { class: 'campo-ayuda', text: O.postulaciones.sinTabla }));
  }
  async function masPostulaciones(lista, caja, antes) {
    const P = O.postulaciones;
    const f = estado.postulaciones;
    const datos = await llamar('ops_postulaciones', { p_dias: estado.ventana.postulaciones, p_estado: f.estado, p_motivo: f.motivo ?? null,
      p_ats: f.ats || null, p_limite: 50, p_antes: antes });
    const pie = caja.querySelector('.mas-resultados');
    if (pie) pie.remove();
    if (!antes && !datos.length) { lista.append(h('p', { class: 'vacio', text: P.vacio })); return; }
    datos.forEach((x) => lista.append(tarjetaPostulacion(x)));
    const total = datos.length ? Number(datos[0].total) : 0;
    const vistos = lista.querySelectorAll('.op-item').length;
    if (vistos < total && datos.length) {
      const ultimo = datos[datos.length - 1].actualizado_en;
      caja.append(h('div', { class: 'mas-resultados' }, h('span', { class: 'suave', text: O.comun.deN(vistos, total) }),
        h('button', { class: 'btn', type: 'button', onclick: (e) => { e.currentTarget.disabled = true; masPostulaciones(lista, caja, ultimo).catch((x) => errorEn(lista, x)); } }, O.comun.verMas)));
    }
  }
  function tarjetaPostulacion(x) {
    const P = O.postulaciones;
    const idT = 'pos-' + x.match_id;
    const chip = x.estado === 'a_mano' ? h('span', { class: 'chip ' + (['error', 'confirmacion_incierta'].includes(x.motivo_a_mano) ? 'chip-error' : 'chip-espera'), text: textoMotivo(x.motivo_a_mano) })
      : h('span', { class: 'chip ' + (x.estado === 'enviada' ? 'chip-azul' : ''), text: P.estado1[x.estado] || x.estado });
    const quien = h('span', { class: 'op-persona', text: x.persona + (x.es_mia ? ' (' + P.tuya + ')' : '') });
    const [bDet, det] = plegable((cuerpo) => {
      const paquete = x.paquete_modelo || x.paquete_version ? P.paqueteLinea(x.paquete_modelo, x.paquete_idioma, x.paquete_version, x.paquete_armado_en ? Terna.fechaLarga(x.paquete_armado_en) : null) : null;
      const resultado = h('p', { class: 'op-linea', role: 'status' });
      const bQuien = x.es_mia ? null : h('button', { class: 'btn btn-texto btn-chico', type: 'button' }, P.verQuien);
      if (bQuien) {
        bQuien.addEventListener('click', async () => {
          const si = await Terna.confirmar({ titulo: P.verQuienTitulo(x.persona), texto: P.verQuienTexto, si: P.verQuienSi, no: T.comun.cancelar });
          if (!si) return;
          try {
            const mail = await llamar('ops_persona', { p_seudonimo: x.persona });
            resultado.textContent = P.quienEs(x.persona, mail);
          } catch (e) {
            if (!(e instanceof Barrera)) Terna.avisoBreve(O.entrar.falla, { error: true });
          }
        });
      }
      Terna.agregar(cuerpo, [
        x.traba_detalle ? h('div', null, h('h3', { text: P.dondeSeTrabo }), h('p', { class: 'caso-texto', text: x.traba_detalle })) : null,
        x.ultimo_error ? h('div', null, h('h3', { text: O.comun.errorTecnico }), errorMono(x.ultimo_error)) : null,
        paquete ? h('div', null, h('h3', { text: P.paquete }), h('p', { class: 'op-linea', text: paquete })) : null,
        x.tiene_captura ? h('p', { class: 'campo-ayuda', text: P.captura }) : null,
        h('div', { class: 'botones op-acciones' }, link(x.url, O.comun.abrirAviso), x.url_postulacion && x.url_postulacion !== x.url ? link(x.url_postulacion, O.comun.abrirFormulario) : null,
          h('button', { class: 'btn btn-chico', type: 'button', onclick: () => Terna.copiar(textoPostulacion(x)) }, O.comun.copiarChat), bQuien),
        resultado]);
    });
    const bProbar = x.estado === 'a_mano' && x.motivo_a_mano !== 'elegido_por_usuario'
      ? h('button', { class: 'btn btn-chico', type: 'button' }, icono('i-probar'), O.volverAProbar.boton) : null;
    if (bProbar) bProbar.addEventListener('click', () => volverAProbar({ match_id: x.match_id, motivo: x.motivo_a_mano }, bProbar, cargar));
    return h('section', { class: 'tarjeta op-item', 'aria-labelledby': idT },
      h('div', { class: 'op-cabeza' }, chip, h('h2', { class: 'tarjeta-titulo', id: idT, text: [x.puesto, x.empresa].filter(Boolean).join(' · ') })),
      meta(quien, x.ats || x.sitio, x.intentos ? O.comun.intentos(x.intentos) : null, Terna.relativa(x.actualizado_en) + ' ' + Terna.hora(x.actualizado_en)),
      bProbar ? h('div', { class: 'botones op-acciones' }, bProbar) : null,
      bDet, det);
  }
  function textoPostulacion(x) {
    const C = O.postulaciones.copiar;
    const paquete = x.paquete_modelo ? [x.paquete_modelo, x.paquete_idioma, x.paquete_version].filter(Boolean).join(' · ') : null;
    return [C.titulo, C.match(corto(x.match_id), x.persona), C.aviso(x.puesto, x.empresa, x.fuente_id),
      C.links(x.url, x.url_postulacion), C.estado(x.estado, x.ats, x.motivo_a_mano, x.intentos || 0, fechaHora(x.actualizado_en)),
      x.traba_detalle ? C.trabo(x.traba_detalle) : null, x.ultimo_error ? C.error(x.ultimo_error) : null, paquete ? C.paquete(paquete) : null,
      C.probar(corto(x.match_id))].filter(Boolean).join('\n');
  }

  /* ---------- Paquetes ---------- */
  async function paquetes() {
    const K = O.paquetes;
    const dias = estado.ventana.paquetes;
    const r = await llamar('ops_paquetes_resumen', { p_dias: dias });
    const e = await llamar('ops_estado');
    estado.detalleDeTodos = !!(e.ajustes && e.ajustes.detalle_de_todos);
    const a = r.armar || {};
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.paquetes, K.intro), h('div', { class: 'herramientas' }, selectorVentana('paquetes')));
    const cifras = h('dl', { class: 'op-cifras' });
    const par = (t, v) => cifras.append(h('div', { class: 'op-cifra-caja' }, h('dt', { class: 'suave', text: t }), h('dd', { class: 'cifra-numero num', text: v })));
    par(K.cifras.armados, num(r.armados));
    par(K.cifras.noSePudo, num(r.no_se_pudo_armar));
    par(K.cifras.porPaquete, a.usd_por_paquete === null || a.usd_por_paquete === undefined ? O.comun.sinDato : O.comun.usd(a.usd_por_paquete));
    par(K.cifras.llamadas, num(a.llamadas));
    par(K.cifras.errores, num(a.errores));
    par(K.cifras.reintentos, num(a.reintentos));
    raiz.append(h('section', { class: 'tarjeta op-resumen' }, cifras,
      h('p', { class: 'campo-ayuda', text: K.cifras.tokens + ': ' + [a.tokens_entrada_medio, a.tokens_salida_medio, a.tokens_cache_medio].map((x) => num(x) || O.comun.sinDato).join(' · ') }),
      h('p', { class: 'campo-ayuda', text: K.cifras.duracion + ': ' + [a.duracion_p50_ms, a.duracion_p95_ms].map((x) => (x === null || x === undefined ? O.comun.sinDato : O.comun.segundos(Math.round(Number(x) / 1000)))).join(' · ') })));
    const grupos = h('div', { class: 'op-grupos' });
    const filasN = (lista, k) => (lista || []).map((x) => h('tr', null, h('th', { scope: 'row', text: x[k] }), celda(num(x.n), true)));
    grupos.append(grupo(K.porModelo, [K.porModelo, K.colsN[1]], filasN(r.por_modelo, 'modelo'), [1]),
      grupo(K.porVersion, [K.porVersion, K.colsN[1]], filasN(r.por_version, 'version'), [1]),
      grupo(K.porIdioma, [K.porIdioma, K.colsN[1]], filasN(r.por_idioma, 'idioma'), [1]));
    raiz.append(grupos);
    const caja = h('section', { class: 'op-seccion' });
    raiz.append(caja);
    const dibujar = async () => {
      vaciar(caja);
      Terna.agregar(caja, [estado.detalleDeTodos ? null : h('p', { class: 'campo-ayuda', text: K.soloTuyos }),
        h('div', { class: 'op-filtros' }, segmentado(K.vistasNombre, Object.entries(K.vistas), estado.paquetes.fallas ? 'fallas' : 'todos',
          (v) => { estado.paquetes.fallas = v === 'fallas'; dibujar(); }))]);
      const lista = h('div', { class: 'op-tarjetas' });
      caja.append(lista);
      await masPaquetes(lista, caja, null);
    };
    await dibujar();
  }
  async function masPaquetes(lista, caja, antes) {
    const K = O.paquetes;
    const datos = await llamar('ops_paquetes', { p_dias: estado.ventana.paquetes, p_solo_fallas: estado.paquetes.fallas, p_limite: 50, p_antes: antes });
    const pie = caja.querySelector('.mas-resultados');
    if (pie) pie.remove();
    if (!antes && !datos.length) { lista.append(h('p', { class: 'vacio', text: estado.paquetes.fallas ? K.vacioFallas : K.vacio })); return; }
    datos.forEach((x) => lista.append(tarjetaPaquete(x)));
    const total = datos.length ? Number(datos[0].total) : 0;
    const vistos = lista.querySelectorAll('.op-item').length;
    if (vistos < total && datos.length) {
      const ultimo = datos[datos.length - 1].cuando;
      caja.append(h('div', { class: 'mas-resultados' }, h('span', { class: 'suave', text: O.comun.deN(vistos, total) }),
        h('button', { class: 'btn', type: 'button', onclick: (e) => { e.currentTarget.disabled = true; masPaquetes(lista, caja, ultimo).catch((x) => errorEn(lista, x)); } }, O.comun.verMas)));
    }
  }
  function tarjetaPaquete(x) {
    const K = O.paquetes;
    const idT = 'paq-' + x.match_id;
    const falla = x.estado_paquete === 'no_se_pudo_armar';
    const texto = [K.copiar.titulo, 'match: ' + corto(x.match_id) + ' · persona: ' + x.persona,
      'aviso: ' + [x.puesto, x.empresa].filter(Boolean).join(' · '), 'link: ' + (x.url || '—'),
      'estado: ' + x.estado_paquete + ' · intentos: ' + (x.intentos_paquete ?? 0) + ' · ' + (fechaHora(x.cuando) || ''),
      'modelo: ' + (x.modelo || '—') + ' · idioma: ' + (x.idioma || '—') + ' · versión: ' + (x.contenido_version || '—'),
      'llamadas de armar: ' + (x.llamadas || 0) + ' · con error: ' + (x.errores || 0) + ' · reintentos: ' + (x.reintentos || 0) + ' · US$ ' + (x.usd ?? 0),
      K.copiar.probar(corto(x.match_id))].join('\n');
    return h('section', { class: 'tarjeta op-item', 'aria-labelledby': idT },
      h('div', { class: 'op-cabeza' }, h('span', { class: 'chip ' + (falla ? 'chip-error' : 'chip-accion'), text: K.estados[x.estado_paquete] || x.estado_paquete }),
        h('h2', { class: 'tarjeta-titulo', id: idT, text: [x.puesto, x.empresa].filter(Boolean).join(' · ') })),
      meta(h('span', { class: 'op-persona', text: x.persona + (x.es_mio ? ' (' + K.tuyo + ')' : '') }), x.idioma, x.modelo, x.contenido_version,
        Terna.relativa(x.cuando) + ' ' + Terna.hora(x.cuando)),
      meta(K.meta.llamadas(x.llamadas || 0), Number(x.errores) ? K.meta.errores(x.errores) : null, O.comun.usd(x.usd),
        x.tokens_entrada ? K.meta.tokens(x.tokens_entrada, x.tokens_salida) : null,
        x.contenido_chars ? K.meta.chars(x.contenido_chars) : null,
        x.armado_en ? (x.archivos_vigentes ? K.meta.vigentes : K.meta.vencidos) : null),
      h('div', { class: 'botones op-acciones' }, link(x.url, O.comun.abrirAviso),
        h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => Terna.copiar(texto) }, O.comun.copiarChat)));
  }

  /* ---------- Corridas y costos ---------- */
  async function corridas() {
    const C = O.corridas;
    const vista = estado.corridas === 'costos' ? 'costos' : 'corridas';
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.corridas, vista === 'costos' ? C.costosIntro : C.intro),
      h('div', { class: 'herramientas' },
        segmentado(C.vistasNombre, Object.entries(C.vistas), vista, (v) => { estado.corridas = v; guardar('corridas.vista', v); cargar(); }),
        selectorVentana('corridas', [7, 30])));
    const cont = h('div', { class: 'op-lista' });
    raiz.append(cont);
    if (vista === 'costos') { await costos(cont); return; }
    const datos = await llamar('ops_corridas', { p_dias: estado.ventana.corridas, p_limite: 200 });
    if (!datos.length) { cont.append(h('p', { class: 'vacio', text: C.vacio })); return; }
    const detalle = h('div', { class: 'op-corrida-detalle' });
    const filas = datos.map((r) => {
      const personas = Object.values(r.resultados || {}).reduce((s, v) => s + Number(v), 0);
      const b = personas ? h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: (e) => verCorrida(r, detalle, e.currentTarget) }, C.porPersona) : null;
      return h('tr', { class: r.estado === 'fallida' ? 'op-fila-error' : null },
        h('th', { scope: 'row', text: fechaHora(r.iniciada_en) }), celda(C.tipos[r.tipo] || r.tipo), celda(C.estados[r.estado] || r.estado),
        celda(O.comun.segundos(r.duracion_s), true), celda(r.version_motor), celda(num(r.avisos_traidos), true), celda(num(r.avisos_nuevos), true),
        celda(num(r.revisados), true), celda(num(r.puntuados), true), celda(num(r.paquetes), true), celda(num(r.enviadas), true), celda(num(r.a_mano), true),
        celda(r.usd_estimado === null || r.usd_estimado === undefined ? null : Terna.decimal(Number(r.usd_estimado)), true), celda(num(personas), true),
        h('td', null, b));
    });
    cont.append(tabla(C.vistas.corridas, C.cols, filas, [3, 5, 6, 7, 8, 9, 10, 11, 12, 13]), detalle);
    const errores = datos.filter((r) => r.error);
    if (errores.length) {
      cont.append(h('section', { class: 'op-grupo' }, h('h2', { class: 'op-subtitulo', text: C.error }),
        errores.slice(0, 10).map((r) => h('div', { class: 'tarjeta op-item' }, h('p', { class: 'op-meta', text: fechaHora(r.iniciada_en) + ' · ' + (C.tipos[r.tipo] || r.tipo) }), errorMono(r.error)))));
    }
  }
  async function verCorrida(r, caja, boton) {
    const C = O.corridas;
    vaciar(caja);
    const datos = await llamar('ops_corrida', { p_corrida: r.id }).catch((e) => { errorEn(caja, e, () => verCorrida(r, caja, boton)); return null; });
    if (!datos) return;
    const t = h('h2', { class: 'op-subtitulo', tabindex: '-1', text: C.porPersonaDe(fechaHora(r.iniciada_en)) });
    if (!datos.length) { caja.append(t, h('p', { class: 'campo-ayuda', text: C.sinPersonas })); t.focus(); return; }
    const filas = datos.map((p) => {
      const desc = ['desc_alcance', 'desc_modalidad', 'desc_idioma', 'desc_antiguedad', 'desc_visto', 'desc_nivel', 'desc_jornada'].reduce((s, k) => s + Number(p[k] || 0), 0);
      return h('tr', null, h('th', { scope: 'row', text: p.persona + (p.es_mia ? ' (' + O.postulaciones.tuya + ')' : '') }),
        celda(C.resultados[p.resultado] || p.resultado), celda(num(p.revisados), true), celda(num(p.puntuados), true), celda(num(p.sobre_umbral), true),
        celda(num(p.armados), true), celda(num(p.enviadas), true), celda(num(p.a_mano), true), celda(num(desc), true),
        celda(p.usd_estimado === null || p.usd_estimado === undefined ? null : Terna.decimal(Number(p.usd_estimado)), true), celda(O.comun.segundos(p.duracion_s), true));
    });
    caja.append(t, tabla(C.porPersona, C.colsPersona, filas, [2, 3, 4, 5, 6, 7, 8, 9, 10]));
    t.focus();
  }
  async function costos(cont) {
    const C = O.corridas;
    const datos = await llamar('ops_costos', { p_dias: estado.ventana.corridas });
    if (!datos.length) { cont.append(h('p', { class: 'vacio', text: C.vacioCostos })); return; }
    const filas = [];
    let dia = null;
    let suma = 0;
    const cerrarDia = () => { if (dia !== null) filas.push(h('tr', { class: 'op-fila-total' }, h('th', { scope: 'row', text: Terna.fechaLarga(dia) }), celda(C.totalDia), celda(''), celda(''), celda(''), celda(''), celda(''), celda(''), celda(Terna.decimal(suma), true))); };
    for (const c of datos) {
      if (c.dia !== dia) { cerrarDia(); dia = c.dia; suma = 0; }
      suma += Number(c.usd || 0);
      filas.push(h('tr', null, h('th', { scope: 'row', text: Terna.fechaCorta(c.dia) }), celda(c.paso), celda(c.modelo), celda(num(c.llamadas), true), celda(num(c.errores), true),
        celda(num(c.tokens_entrada), true), celda(num(c.tokens_salida), true), celda(num(c.tokens_cache_leida), true), celda(Terna.decimal(Number(c.usd || 0)), true)));
    }
    cerrarDia();
    cont.append(tabla(C.vistas.costos, C.colsCostos, filas, [3, 4, 5, 6, 7, 8]));
  }

  /* ---------- Registro y apps de códigos ---------- */
  async function registro() {
    const R = O.registro;
    const datos = await llamar('ops_registro', { p_dias: 90, p_limite: 300 });
    const lista = await sb.auth.mfa.listFactors();
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.registro, R.intro));
    if (!datos.length) raiz.append(h('p', { class: 'vacio', text: R.vacio }));
    else {
      const detalleDe = (d) => {
        if (!d) return null;
        return Object.entries(d).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => k + ': ' + (typeof v === 'object' ? JSON.stringify(v) : v)).join(' · ');
      };
      raiz.append(tabla(O.secciones.registro, R.cols, datos.map((x) => h('tr', null, h('th', { scope: 'row', text: fechaHora(x.creado_en) }),
        celda(R.acciones[x.accion] || x.accion), celda(x.objeto), h('td', { class: 'op-celda-error', text: detalleDe(x.detalle) || O.comun.sinDato })))));
    }
    const factores = (lista.data && lista.data.totp) || [];
    raiz.append(h('section', { class: 'tarjeta seccion op-factores', 'aria-labelledby': 'op-factores' },
      h('h2', { class: 'tarjeta-titulo', id: 'op-factores', text: R.factoresTitulo }),
      h('p', { class: 'campo-ayuda', text: R.factoresIntro }),
      h('ul', { class: 'op-factores-lista' }, factores.map((f) => h('li', { text: R.factor(f.friendly_name, Terna.fechaLarga(f.created_at)) }))),
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'button', onclick: () => pantallaActivar(true) }, icono('i-agregar'), R.sumarFactor)),
      h('p', { class: 'campo-ayuda', text: R.perdiste })));
  }

  /* ---------- Volver a probar (0054: solo desde acá) ---------- */
  async function volverAProbar(x, boton, alTerminar) {
    const V = O.volverAProbar;
    const incierta = x.motivo === 'confirmacion_incierta';
    const si = await Terna.confirmar({ titulo: V.titulo, texto: incierta ? V.incierta : V.texto, si: V.si, no: T.comun.cancelar });
    if (!si) return;
    boton.disabled = true;
    try {
      await llamar('ops_volver_a_probar', { p_match: x.match_id });
      Terna.avisoBreve(V.hecho);
      if (alTerminar) await alTerminar();
    } catch (e) {
      boton.disabled = false;
      if (e instanceof Barrera) return;
      const m = mensaje(e);
      Terna.avisoBreve(m.includes('no_postulable') ? V.noPostulable : m.includes('transicion_invalida') ? V.yaNo : O.entrar.falla, { error: true });
    }
  }
  function botonQuien(persona, resultado) {
    const P = O.postulaciones;
    const b = h('button', { class: 'btn btn-texto btn-chico', type: 'button' }, P.verQuien);
    b.addEventListener('click', async () => {
      const si = await Terna.confirmar({ titulo: P.verQuienTitulo(persona), texto: P.verQuienTexto, si: P.verQuienSi, no: T.comun.cancelar });
      if (!si) return;
      try {
        const mail = await llamar('ops_persona', { p_seudonimo: persona });
        resultado.textContent = P.quienEs(persona, mail);
      } catch (e) {
        if (!(e instanceof Barrera)) Terna.avisoBreve(O.entrar.falla, { error: true });
      }
    });
    return b;
  }

  /* ---------- Fallas (operacion.md 0.2 §5; 0054) ----------
     Cada vez que Terna dejó una postulación a mano, de cualquier persona. Arriba, las cifras y los grupos (por motivo, por
     sitio y por la forma del detalle) para ver qué arreglar primero; abajo, una por una, con lo que pasó después, la captura
     y «Volver a probar». Nunca se borran: la persona sigue viendo la suya en Postulaciones y le queda «Postular a mano». */
  async function fallas() {
    const F = O.fallas;
    const r = await llamar('ops_fallas_resumen', { p_dias: estado.ventana.fallas });
    estado.detalleDeTodos = !!r.detalle_de_todos;
    vaciar(raiz);
    const bVistas = h('button', { class: 'btn btn-chico', type: 'button' }, icono('i-tilde'), F.marcarVistas);
    bVistas.addEventListener('click', async () => {
      bVistas.disabled = true;
      try { await llamar('ops_marcar_fallas_vistas'); Terna.avisoBreve(F.marcadas); await cargar(); } catch (e) { bVistas.disabled = false; if (!(e instanceof Barrera)) Terna.avisoBreve(O.entrar.falla, { error: true }); }
    });
    raiz.append(encabezado(O.secciones.fallas, F.intro), h('div', { class: 'herramientas' }, selectorVentana('fallas', [7, 30, 90]), Number(r.nuevas) ? bVistas : null));
    const cifras = h('dl', { class: 'op-cifras' });
    for (const k of ['nuevas', 'abiertas', 'resueltas_a_mano', 'descartadas', 'reintentadas', 'enviadas_despues', 'personas']) {
      cifras.append(h('div', { class: 'op-cifra-caja' }, h('dt', { class: 'suave', text: F.cifras[k] }), h('dd', { class: 'cifra-numero num', text: num(r[k] || 0) })));
    }
    raiz.append(h('section', { class: 'tarjeta op-resumen' }, cifras,
      h('p', { class: 'campo-ayuda', text: r.vistas_hasta ? F.vistasDesde(fechaHora(r.vistas_hasta)) : F.nuncaVistas })));
    const filtrar = (cambio) => { Object.assign(estado.fallas, cambio); dibujarLista().then(() => { const t = document.getElementById('op-fallas-lista'); if (t) t.focus(); }); };
    const grupos = h('div', { class: 'op-grupos' });
    grupos.append(grupo(F.porMotivo, F.porMotivoCols, (r.por_motivo || []).map((x) => h('tr', null,
      h('th', { scope: 'row' }, h('button', { class: 'btn-enlace', type: 'button', 'aria-label': F.verLas(textoMotivo(x.motivo)), onclick: () => filtrar({ motivo: x.motivo, estado: 'todas' }) }, textoMotivo(x.motivo))),
      celda(num(x.n), true), celda(num(x.abiertas), true), celda(num(x.resueltas_a_mano), true), celda(num(x.reintentadas), true),
      celda(num(x.enviadas_despues), true), celda(num(x.personas), true))), [1, 2, 3, 4, 5, 6]));
    grupos.append(grupo(F.porSitio, F.porSitioCols, (r.por_sitio || []).map((x) => h('tr', null,
      h('th', { scope: 'row' }, h('button', { class: 'btn-enlace', type: 'button', 'aria-label': F.verLas(x.sitio), onclick: () => filtrar({ sitio: x.sitio, estado: 'todas' }) }, x.sitio)),
      celda(x.ats), celda(num(x.n), true), celda(num(x.personas), true))), [2, 3]));
    raiz.append(grupos);
    raiz.append(h('section', { class: 'op-grupo' }, h('h2', { class: 'op-subtitulo', text: F.porPatron }), h('p', { class: 'campo-ayuda', text: F.porPatronIntro }),
      (r.por_patron || []).length ? tabla(F.porPatron, F.porPatronCols, (r.por_patron || []).map((x) => h('tr', null,
        h('th', { scope: 'row', text: textoMotivo(x.motivo) }), h('td', { class: 'op-celda-error', text: x.ejemplo || x.patron }),
        celda(num(x.n), true), celda(num(x.personas), true))), [2, 3]) : h('p', { class: 'campo-ayuda', text: O.postulaciones.sinTabla })));
    const listaCaja = h('section', { class: 'op-seccion', 'aria-labelledby': 'op-fallas-lista' });
    raiz.append(listaCaja);
    let cargadas = [];
    async function dibujarLista() {
      vaciar(listaCaja);
      cargadas = [];
      const f = estado.fallas;
      const buscar = h('input', { class: 'control op-buscar', type: 'search', 'aria-label': F.buscar, placeholder: F.buscar, value: f.buscar || '', spellcheck: 'false' });
      let espera = null;
      buscar.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => { f.buscar = buscar.value.trim(); recargarLista(); }, 400); });
      const quitar = (k) => h('button', { type: 'button', 'aria-label': O.postulaciones.quitarFiltro, onclick: () => { f[k] = null; dibujarLista(); } }, icono('i-cerrar', 'icono-14'));
      const bCopiar = h('button', { class: 'btn btn-chico', type: 'button', onclick: () => Terna.copiar(planilla(cargadas)) }, icono('i-pegar'), F.copiarLista);
      Terna.agregar(listaCaja, [h('h2', { class: 'op-subtitulo', id: 'op-fallas-lista', tabindex: '-1', text: F.lista }),
        estado.detalleDeTodos ? null : h('p', { class: 'campo-ayuda', text: F.soloTuyas }),
        h('div', { class: 'op-filtros' },
          segmentado(F.filtroEstado, Object.entries(F.estados), f.estado, (v) => { f.estado = v; dibujarLista(); }),
          f.motivo ? h('span', { class: 'chip chip-filtro' }, O.postulaciones.filtroMotivo(textoMotivo(f.motivo)), quitar('motivo')) : null,
          f.sitio ? h('span', { class: 'chip chip-filtro' }, F.filtroSitio(f.sitio), quitar('sitio')) : null),
        h('div', { class: 'op-filtros' }, buscar, bCopiar)]);
      const lista = h('div', { class: 'op-tarjetas' });
      listaCaja.append(lista);
      await masFallas(lista, null);
    }
    async function recargarLista() {
      const lista = listaCaja.querySelector('.op-tarjetas');
      vaciar(lista);
      cargadas = [];
      const pie = listaCaja.querySelector('.mas-resultados');
      if (pie) pie.remove();
      await masFallas(lista, null).catch((e) => errorEn(lista, e));
    }
    async function masFallas(lista, antes) {
      const f = estado.fallas;
      const datos = await llamar('ops_fallas', { p_dias: estado.ventana.fallas, p_estado: f.estado, p_motivo: f.motivo || null, p_sitio: f.sitio || null,
        p_buscar: f.buscar || null, p_limite: 50, p_antes: antes });
      const pie = listaCaja.querySelector('.mas-resultados');
      if (pie) pie.remove();
      if (!antes && !datos.length) { lista.append(h('p', { class: 'vacio', text: F.vacio })); return; }
      cargadas = cargadas.concat(datos);
      datos.forEach((x) => lista.append(tarjetaFalla(x, cargar)));
      const total = datos.length ? Number(datos[0].total) : 0;
      if (cargadas.length < total && datos.length) {
        const ultimo = datos[datos.length - 1].creado_en;
        listaCaja.append(h('div', { class: 'mas-resultados' }, h('span', { class: 'suave', text: O.comun.deN(cargadas.length, total) }),
          h('button', { class: 'btn', type: 'button', onclick: (e) => { e.currentTarget.disabled = true; masFallas(lista, ultimo).catch((x) => errorEn(lista, x)); } }, O.comun.verMas)));
      }
    }
    await dibujarLista();
  }
  function tarjetaFalla(x, recargar) {
    const F = O.fallas;
    const idT = 'falla-' + x.id;
    const chip = h('span', { class: 'chip ' + (['error', 'confirmacion_incierta'].includes(x.motivo) ? 'chip-error' : 'chip-espera'), text: textoMotivo(x.motivo) });
    const marcas = [];
    if (x.es_nueva) marcas.push(h('span', { class: 'chip chip-azul', text: F.nueva }));
    if (x.resuelta_a_mano_en) marcas.push(h('span', { class: 'chip chip-accion' }, icono('i-tilde', 'icono-14'), F.resuelta(Terna.fechaCorta(x.resuelta_a_mano_en))));
    if (x.descartada_en) marcas.push(h('span', { class: 'chip', text: F.descartada(Terna.fechaCorta(x.descartada_en)) }));
    if (x.reintentada_en) marcas.push(h('span', { class: 'chip' }, icono('i-probar', 'icono-14'), F.reintentada(Terna.fechaCorta(x.reintentada_en))));
    if (x.enviada_despues_en) marcas.push(h('span', { class: 'chip chip-accion' }, icono('i-enviada', 'icono-14'), F.enviada(Terna.fechaCorta(x.enviada_despues_en))));
    const quien = h('span', { class: 'op-persona', text: x.persona + (x.es_mia ? ' (' + O.postulaciones.tuya + ')' : '') });
    const bProbar = x.puede_volver_a_probar ? h('button', { class: 'btn btn-chico', type: 'button' }, icono('i-probar'), O.volverAProbar.boton) : null;
    if (bProbar) bProbar.addEventListener('click', () => volverAProbar({ match_id: x.match_id, motivo: x.motivo }, bProbar, recargar));
    const [bDet, det] = plegable((cuerpo) => {
      const resultado = h('p', { class: 'op-linea', role: 'status' });
      const caja = h('div', { class: 'op-captura' });
      const bCaptura = x.tiene_captura ? h('button', { class: 'btn btn-chico', type: 'button' }, F.verCaptura) : null;
      if (bCaptura) bCaptura.addEventListener('click', () => verCaptura(x, caja, bCaptura));
      Terna.agregar(cuerpo, [
        x.detalle ? h('div', null, h('h3', { text: O.postulaciones.dondeSeTrabo }), h('p', { class: 'caso-texto', text: x.detalle })) : null,
        x.ultimo_error ? h('div', null, h('h3', { text: O.comun.errorTecnico }), errorMono(x.ultimo_error)) : null,
        x.estado_actual ? h('p', { class: 'op-linea', text: F.ahora(O.postulaciones.estado1[x.estado_actual] || x.estado_actual) }) : null,
        h('div', { class: 'botones op-acciones' }, link(x.url, O.comun.abrirAviso), bCaptura,
          h('button', { class: 'btn btn-chico', type: 'button', onclick: () => Terna.copiar(textoFalla(x)) }, O.comun.copiarChat),
          x.es_mia ? null : botonQuien(x.persona, resultado)),
        caja, resultado]);
    });
    return h('section', { class: 'tarjeta op-item op-falla', 'aria-labelledby': idT, dataset: { falla: x.id } },
      h('div', { class: 'op-cabeza' }, chip, h('h2', { class: 'tarjeta-titulo', id: idT, text: [x.puesto, x.empresa].filter(Boolean).join(' · ') || F.sinPuesto })),
      marcas.length ? h('div', { class: 'chips' }, marcas) : null,
      meta(quien, [x.sitio, x.ats].filter(Boolean).join(' · ') || null, x.intentos ? O.comun.intentos(x.intentos) : null, Terna.relativa(x.creado_en) + ' ' + Terna.hora(x.creado_en)),
      bProbar ? h('div', { class: 'botones op-acciones' }, bProbar) : null,
      bDet, det);
  }
  // La captura es de la persona: la base la deja firmar solo con el segundo paso y el interruptor prendido, y lo anota.
  async function verCaptura(x, caja, boton) {
    const F = O.fallas;
    boton.disabled = true;
    const noEsta = () => { vaciar(caja); caja.append(h('p', { class: 'campo-ayuda', text: F.capturaNo })); };
    try {
      const ruta = await llamar('ops_falla_captura', { p_falla: x.id });
      const { data, error } = await sb.storage.from(Terna.CONFIG.bucket).createSignedUrl(ruta, 300);
      if (error || !data || !data.signedUrl) throw error || new Error('sin_url');
      vaciar(caja);
      const img = h('img', { class: 'op-captura-img', src: data.signedUrl, alt: F.capturaAlt([x.puesto, x.empresa].filter(Boolean).join(' · ')) });
      img.addEventListener('error', noEsta);
      caja.append(img, h('p', { class: 'campo-ayuda', text: F.capturaNota }));
      boton.hidden = true;
    } catch (e) {
      boton.disabled = false;
      if (e instanceof Barrera) return;
      noEsta();
    }
  }
  function textoFalla(x) {
    const C = O.fallas.copiar;
    const despues = [x.resuelta_a_mano_en ? C.resuelta(fechaHora(x.resuelta_a_mano_en)) : null, x.descartada_en ? C.descartada(fechaHora(x.descartada_en)) : null,
      x.reintentada_en ? C.reintentada(fechaHora(x.reintentada_en)) : null, x.enviada_despues_en ? C.enviada(fechaHora(x.enviada_despues_en)) : null].filter(Boolean);
    return [C.titulo, C.falla(corto(x.id), x.persona, corto(x.match_id)), C.aviso(x.puesto, x.empresa, x.fuente_id),
      C.sitio(x.sitio, x.ats, x.url), C.motivo(x.motivo, x.intentos || 0, fechaHora(x.creado_en), x.estado_actual),
      x.detalle ? C.trabo(x.detalle) : null, x.ultimo_error ? C.error(x.ultimo_error) : null, despues.length ? C.despues(despues.join(' · ')) : null,
      x.match_id ? O.postulaciones.copiar.probar(corto(x.match_id)) : null].filter(Boolean).join('\n');
  }
  // «Copiar la lista»: una fila por falla, separada por tabulaciones, para pegar en una planilla y agrupar a mano.
  function planilla(filas) {
    const F = O.fallas;
    const limpio = (v) => (v === null || v === undefined ? '' : String(v).replace(/[\t\r\n]+/g, ' ').trim());
    const lineas = [F.planillaCols.join('\t')].concat(filas.map((x) => [fechaHora(x.creado_en), x.persona, x.puesto, x.empresa, x.sitio, x.ats,
      textoMotivo(x.motivo), x.intentos, x.detalle, x.ultimo_error, fechaHora(x.resuelta_a_mano_en), fechaHora(x.descartada_en),
      fechaHora(x.reintentada_en), fechaHora(x.enviada_despues_en), O.postulaciones.estado1[x.estado_actual] || x.estado_actual].map(limpio).join('\t')));
    return lineas.join('\n');
  }

  /* ---------- Problemas, Personas y Ajustes: lo que era Admin (js/ops-admin.js) ---------- */
  async function problemas() {
    const cont = h('div', { class: 'op-lista op-admin' });
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.problemas, null), cont);
    await admin.problemas(cont);
  }
  async function personas() {
    const P = O.personas;
    const vista = estado.personas === 'uso' ? 'uso' : 'usuarios';
    const cont = h('div', { class: 'op-lista op-admin' });
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.personas, P.intro),
      h('div', { class: 'herramientas' }, segmentado(P.vistasNombre, Object.entries(P.vistas), vista, (v) => { estado.personas = v; guardar('personas.vista', v); cargar(); }),
        vista === 'uso' ? selectorVentana('uso', [7, 30]) : null),
      cont);
    if (vista === 'uso') await admin.uso(cont, estado.ventana.uso); else await admin.usuarios(cont);
  }
  async function contratar() {
    const V = O.contratar;
    const vista = Object.keys(V.vistas).includes(estado.contratar) ? estado.contratar : 'revisar';
    const cont = h('div', { class: 'op-lista op-admin op-contratar' });
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.contratar, V.intro),
      h('div', { class: 'herramientas' }, segmentado(V.vistasNombre, Object.entries(V.vistas), vista, (v) => { estado.contratar = v; guardar('contratar.vista', v); cargar(); })),
      cont);
    if (!contrata) return;
    await contrata[vista](cont);
  }
  async function ajustes() {
    const cont = h('div', { class: 'op-lista op-admin' });
    vaciar(raiz);
    raiz.append(encabezado(O.secciones.ajustes, O.ajustes.intro), cont);
    await admin.leerConfig();
    await admin.invitaciones(cont);
    await admin.ia(cont);
  }

  /* ---------- Arranque ---------- */
  async function arrancar() {
    cabecera = document.getElementById('barra-ops');
    raiz = document.getElementById('ops');
    sub = document.getElementById('subpestanas');
    document.title = O.documento;
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) { pantallaEntrar(); return; }
    await despuesDeEntrar();
  }
  window.addEventListener('hashchange', () => {
    const s = location.hash.slice(1);
    if (SECCIONES.includes(s) && s !== estado.seccion && !sub.hidden) ir(s);
  });
  const correr = () => arrancar().catch((e) => errorEn(document.getElementById('ops'), e, () => location.reload()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
})();
