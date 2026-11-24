/* Terna · js/contratar.js
   Terna para contratar (contratar.md 0.1; 0055): la página de quien contrata, una empresa o una persona que busca a alguien. Publica
   avisos (que Francisco revisa antes de abrir), ve las postulaciones que le llegan con el contacto, el CV y la carta del paquete, y las
   personas que ajustan y aceptan propuestas, sin su nombre ni dónde trabajan. Una cuenta puede tener varias personas en su equipo.
   - Su propio cliente de Supabase, con la sesión en localStorage bajo su propia clave ('terna-contratar'): no se mezcla con la de la
     web de quien busca trabajo, aunque sea la misma cuenta de Auth. No usa Terna.pagina (exige una fila en `usuarios`, que una
     cuenta que solo contrata no tiene); de comun.js toma solo las piezas.
   - Lee y escribe solo por las funciones `contrata_*` de la base, que deciden quién ve qué (RLS sin políticas en las tablas).
   - Todo dato se escribe con textContent (Terna.h): los avisos y los perfiles son texto de terceros.
   - Los textos son de js/contratar-textos.js (contratar.md §8). */
'use strict';

(function () {
  const { h, icono, vaciar } = Terna;
  const C = window.TC;
  const SECCIONES = ['avisos', 'publicar', 'equipo', 'cuenta'];
  const PISO_DESCRIPCION = 150;
  const MAX_DESCRIPCION = 6000;
  const MAX_REQUISITOS = 3000;

  const sb = window.supabase.createClient(Terna.CONFIG.url, Terna.CONFIG.clave, {
    auth: { storageKey: 'terna-contratar', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' },
  });

  const estado = { seccion: 'avisos', avisoId: null, editarId: null, cuentas: [], cuenta: null, avisos: [] };
  let raiz, sub, cabecera;

  /* ---------- Errores ---------- */
  class Barrera extends Error {}
  const mensaje = (e) => String((e && (e.message || e.code)) || '');
  function clave(e, mapa) {
    const m = mensaje(e);
    for (const k of Object.keys(mapa || {})) if (m.includes(k)) return mapa[k];
    for (const k of Object.keys(C.errores)) if (m.includes(k)) return C.errores[k];
    return null;
  }
  const textoDe = (e, mapa) => clave(e, mapa) || C.errores.generico;
  async function llamar(nombre, args) {
    const { data, error } = await sb.rpc(nombre, args || {});
    if (!error) return data;
    if (error.code === 'PGRST202' || error.code === '42883' || /Could not find the function/i.test(mensaje(error))) {
      const e = new Error('falta_0055'); e.falta0055 = true; throw e;
    }
    if (Terna.esErrorDeSesion(error)) { await sb.auth.signOut({ scope: 'local' }); pantallaEntrar(); throw new Barrera(mensaje(error)); }
    if (mensaje(error).includes('contrata_no_autorizado')) { await despuesDeEntrar(); throw new Barrera(mensaje(error)); }
    throw error;
  }
  function errorEn(cont, e, reintentar) {
    if (e instanceof Barrera) return;
    console.error('[Terna contratar]', e && e.name, e && (e.code || ''), e && e.message);
    vaciar(cont);
    cont.append(h('div', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'),
      h('span', { text: e && e.falta0055 ? C.comun.falta0055 : C.comun.errorCarga }),
      e && e.falta0055 ? null : h('button', { class: 'btn', type: 'button', onclick: reintentar }, C.comun.reintentar)));
  }

  /* ---------- Piezas ---------- */
  function campo(id, etiqueta, control, ayuda) {
    const error = h('p', { class: 'campo-error', id: id + '-error', role: 'alert' });
    control.id = id;
    control.setAttribute('aria-describedby', (ayuda ? id + '-ayuda ' : '') + id + '-error');
    return { nodo: h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), control,
      ayuda ? h('p', { class: 'campo-ayuda', id: id + '-ayuda', text: ayuda }) : null, error), error, control };
  }
  function marcar(c, texto) {
    c.error.textContent = texto || '';
    if (texto) { c.control.setAttribute('aria-invalid', 'true'); c.control.focus(); } else c.control.removeAttribute('aria-invalid');
  }
  function seleccion(opciones, actual) {
    const s = h('select', { class: 'control' });
    for (const [v, t] of opciones) s.append(h('option', { value: v, selected: String(v) === String(actual ?? '') }, t));
    return s;
  }
  const num = (x) => (x === null || x === undefined ? null : Terna.numero(Number(x)));
  function meta(...partes) {
    const p = h('p', { class: 'op-meta' });
    partes.filter((x) => x !== null && x !== undefined && x !== '').forEach((x, i) => {
      if (i) p.append(h('span', { 'aria-hidden': 'true', text: ' · ' }));
      p.append(x instanceof Node ? x : h('span', { text: String(x) }));
    });
    return p;
  }
  function chipEstado(e) {
    const clase = { abierta: 'chip-accion', en_revision: 'chip-espera', pausada: 'chip-espera', borrador: 'chip-espera', rechazada: 'chip-error',
      cerrada: 'chip-espera', vencida: 'chip-espera' }[e] || 'chip-espera';
    const ic = { abierta: 'i-tilde', rechazada: 'i-alerta', en_revision: 'i-revisar' }[e] || 'i-pedido';
    return h('span', { class: 'chip ' + clase }, icono(ic, 'icono-14'), C.estados[e] || e);
  }
  function encabezado(titulo, intro, ...extra) {
    const t = h('h1', { class: 'titulo op-titulo', tabindex: '-1', text: titulo });
    return h('div', { class: 'op-encabezado' },
      h('div', { class: 'op-encabezado-fila' }, t,
        h('div', { class: 'op-actualizar' }, h('span', { class: 'suave', text: C.comun.leido(Terna.hora(new Date())) }),
          h('button', { class: 'btn btn-chico', type: 'button', onclick: cargar }, C.comun.actualizar))),
      intro ? h('p', { class: 'intro', text: intro }) : null, ...extra);
  }
  // Un link a un archivo de la postulación (CV o carta), firmado con la sesión de esta página por 5 minutos.
  function linkFirmado(ruta, texto) {
    const a = h('a', { class: 'btn btn-chico', href: '#', target: '_blank', rel: 'noopener noreferrer' }, icono('i-cv', 'icono-14'), texto);
    let firmadoEn = 0;
    const firmar = async () => {
      const { data, error } = await sb.storage.from('documentos').createSignedUrl(ruta, 300);
      if (error || !data) throw error || new Error('sin_url');
      a.setAttribute('href', data.signedUrl);
      firmadoEn = Date.now();
      return data.signedUrl;
    };
    a.addEventListener('click', (e) => {
      if (firmadoEn && Date.now() - firmadoEn < 240000) return;
      e.preventDefault();
      const ventana = window.open('', '_blank');
      if (ventana) ventana.opener = null;
      firmar().then((url) => { if (ventana) ventana.location.replace(url); else window.open(url, '_blank', 'noopener'); })
        .catch(() => { if (ventana) ventana.close(); Terna.avisoBreve(C.errores.generico, { error: true }); });
    });
    firmar().catch(() => { /* se vuelve a firmar al tocarlo */ });
    return a;
  }
  const cuentaActual = () => estado.cuenta || {};
  const esDueno = () => cuentaActual().rol === 'dueno';
  const puedeEscribir = () => cuentaActual().estado === 'activa' && cuentaActual().contrata_abierto !== false;

  /* ---------- Encabezado ---------- */
  function dibujarCabecera(conSesion) {
    vaciar(cabecera);
    let selector = null;
    if (conSesion && estado.cuentas.length > 1) {
      const s = seleccion(estado.cuentas.map((c) => [c.cuenta_id, c.nombre]), cuentaActual().cuenta_id);
      s.setAttribute('aria-label', C.cuentaElegir);
      s.classList.add('co-cuenta');
      s.addEventListener('change', () => {
        estado.cuenta = estado.cuentas.find((c) => c.cuenta_id === s.value) || estado.cuentas[0];
        Terna.guardarLocal('contratar.cuenta', estado.cuenta.cuenta_id);
        ir('avisos');
      });
      selector = s;
    }
    cabecera.append(h('div', { class: 'op-barra' },
      // El logo «terna jobs» es el de la web (Terna.logo; propuesta LOGOS, brand.md §5.3). Sin sesión lleva a la landing, como el de
      // Entrar: es la vuelta para quien llegó sin cuenta (FEEDBACK-LANDING P2-8).
      h('a', { class: 'logo', href: conSesion ? 'contratar.html' : 'bienvenida.html', 'aria-label': C.documento }, Terna.logo()),
      h('span', { class: 'op-marca', text: C.marca }),
      conSesion && estado.cuentas.length === 1 ? h('span', { class: 'co-nombre-cuenta', text: cuentaActual().nombre }) : selector,
      h('div', { class: 'op-cuenta' }, Terna.botonTema('btn-barra'),
        // En el celular, Salir queda en su ícono (css/ops.css): el nombre sigue en el span, para el lector de pantalla, y en el title.
        conSesion ? h('button', { class: 'btn btn-texto btn-barra op-salir', type: 'button', title: C.entrar.salir, onclick: salir },
          icono('i-salir'), h('span', { class: 'op-salir-texto', text: C.entrar.salir })) : null)));
  }
  async function salir() {
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual se sale */ }
    estado.cuentas = []; estado.cuenta = null;
    pantallaEntrar();
  }
  function tarjetaAcceso(titulo, ...hijos) {
    vaciar(sub);
    sub.hidden = true;
    vaciar(raiz);
    const t = h('h1', { class: 'titulo op-acceso-titulo', tabindex: '-1', text: titulo });
    raiz.append(h('section', { class: 'tarjeta op-acceso' }, t, ...hijos));
    t.focus();
  }

  /* ---------- Entrar ---------- */
  function formularioEntrar(mailFijo, alEntrar) {
    const mail = campo(Terna.idUnico('co-mail'), C.entrar.mail, h('input', { class: 'control', type: 'email', autocomplete: 'username', required: true,
      spellcheck: 'false', value: mailFijo || '', readOnly: !!mailFijo }));
    const contra = campo(Terna.idUnico('co-clave'), C.entrar.contrasena, h('input', { class: 'control', type: 'password', autocomplete: 'current-password', required: true }));
    const boton = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.entrar.boton);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, mail.nodo, contra.nodo, boton,
      h('p', { class: 'campo-ayuda', text: C.entrar.olvido }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      marcar(mail, ''); marcar(contra, '');
      const m = mail.control.value.trim();
      const c = contra.control.value;
      if (!m || !c) { marcar(m ? contra : mail, C.entrar.errorCompletar); return; }
      boton.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: m, password: c });
      boton.disabled = false;
      if (error) { marcar(contra, /invalid/i.test(mensaje(error)) ? C.entrar.errorCredenciales : C.entrar.falla); return; }
      await alEntrar();
    });
    return form;
  }
  // Debajo del formulario, cómo se pide la invitación (FEEDBACK-LANDING P2-8, el mismo patrón que «Cómo conseguir una invitación» de
  // Entrar): el link a «Cómo se entra» de la landing, donde está la manera de pedirla (escribirle a Francisco por LinkedIn;
  // QUIENES-SOMOS §4). Después de una regla fina, el renglón de quien busca trabajo (PLAN-LANDING §5.3): solo acá, no en la pantalla
  // de una invitación, donde la persona vino a otra cosa.
  function pantallaEntrar() {
    dibujarCabecera(false);
    document.title = C.documento;
    tarjetaAcceso(C.entrar.titulo, h('p', { class: 'acceso-descripcion', text: C.entrar.intro }), formularioEntrar(null, despuesDeEntrar),
      h('p', { class: 'co-link' }, h('a', { href: 'bienvenida.html#pedir', text: C.entrar.comoSeEntra })),
      h('p', { class: 'co-otro' }, C.entrar.buscasPregunta, ' ', h('a', { href: 'entrar.html', text: C.entrar.buscasLink })));
  }
  async function sinCuenta() {
    dibujarCabecera(true);
    tarjetaAcceso(C.entrar.titulo, h('p', { class: 'banda', role: 'status' }, icono('i-alerta'), h('span', { text: C.entrar.sinCuenta })),
      h('button', { class: 'btn', type: 'button', onclick: salir }, C.entrar.salir));
  }

  /* ---------- La invitación ---------- */
  async function pantallaInvitacion(token) {
    dibujarCabecera(false);
    let inv = null;
    try {
      const { data, error } = await sb.rpc('contrata_leer_invitacion', { p_token: token });
      if (error) throw error;
      inv = (data || [])[0] || null;
    } catch (e) {
      errorEn(raiz, e, () => pantallaInvitacion(token));
      return;
    }
    const volverAEntrar = h('button', { class: 'btn', type: 'button', onclick: pantallaEntrar }, C.entrar.boton);
    if (!inv) { tarjetaAcceso(C.entrar.titulo, h('p', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'), h('span', { text: C.invitacion.noExiste }))); return; }
    if (inv.invitacion_estado !== 'pendiente') {
      tarjetaAcceso(C.entrar.titulo, h('p', { class: 'banda', role: 'status' }, icono('i-alerta'),
        h('span', { text: inv.invitacion_estado === 'usada' ? C.invitacion.usada : C.invitacion.vencida })), volverAEntrar);
      return;
    }
    const titulo = inv.invitacion_tipo === 'miembro' ? C.invitacion.tituloMiembro(inv.cuenta_nombre) : C.invitacion.titulo(inv.cuenta_nombre);
    const aceptar = async () => {
      try {
        await llamar('contrata_aceptar_invitacion', { p_token: token });
        Terna.avisoBreve(C.invitacion.aceptada);
        await despuesDeEntrar();
      } catch (e) {
        if (e instanceof Barrera) return;
        const m = mensaje(e);
        Terna.avisoBreve(m.includes('otro_mail') ? C.invitacion.otroMail : m.includes('usada') ? C.invitacion.usada
          : m.includes('vencida') ? C.invitacion.vencida : C.errores.generico, { error: true });
      }
    };
    const { data: s } = await sb.auth.getSession();
    const sesionMail = s && s.session && String(s.session.user.email || '').toLowerCase();
    if (sesionMail && sesionMail === inv.invitacion_mail) {
      tarjetaAcceso(titulo, h('p', { class: 'acceso-descripcion', text: C.invitacion.intro }),
        h('p', { class: 'campo-ayuda', text: C.invitacion.paraMail(inv.invitacion_mail) }),
        h('button', { class: 'btn btn-primario btn-ancho', type: 'button', onclick: aceptar }, C.invitacion.aceptar));
      return;
    }
    if (sesionMail) await sb.auth.signOut({ scope: 'local' });

    const nombre = campo('co-nombre', C.invitacion.nombre, h('input', { class: 'control', type: 'text', autocomplete: 'name', maxlength: '80' }));
    const contra = campo('co-nueva', C.invitacion.contrasena, h('input', { class: 'control', type: 'password', autocomplete: 'new-password', minlength: '8' }), C.invitacion.contrasenaAyuda);
    const repetir = campo('co-repetir', C.invitacion.repetir, h('input', { class: 'control', type: 'password', autocomplete: 'new-password', minlength: '8' }));
    const boton = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.invitacion.crear);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, nombre.nodo, contra.nodo, repetir.nodo, boton);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [nombre, contra, repetir].forEach((c) => marcar(c, ''));
      if (contra.control.value.length < 8) { marcar(contra, C.invitacion.corta); return; }
      if (contra.control.value !== repetir.control.value) { marcar(repetir, C.invitacion.noCoinciden); return; }
      boton.disabled = true;
      const r = await sb.auth.signUp({ email: inv.invitacion_mail, password: contra.control.value,
        options: { data: { token_contrata: token, nombre: nombre.control.value.trim() } } });
      if (r.error) {
        boton.disabled = false;
        marcar(contra, /registered|already/i.test(mensaje(r.error)) ? C.invitacion.yaExiste : textoDe(r.error));
        return;
      }
      if (!r.data || !r.data.session) await sb.auth.signInWithPassword({ email: inv.invitacion_mail, password: contra.control.value });
      boton.disabled = false;
      history.replaceState(null, '', 'contratar.html#avisos');
      await despuesDeEntrar();
    });
    const yaTengo = h('div', { class: 'co-ya-tengo', hidden: true },
      h('p', { class: 'campo-ayuda', text: C.invitacion.yaTengoAyuda }),
      formularioEntrar(inv.invitacion_mail, aceptar));
    const abrirYaTengo = h('button', { class: 'btn btn-texto', type: 'button', 'aria-expanded': 'false', onclick: () => {
      yaTengo.hidden = !yaTengo.hidden;
      abrirYaTengo.setAttribute('aria-expanded', String(!yaTengo.hidden));
      form.hidden = !yaTengo.hidden;
    } }, C.invitacion.yaTengo);
    tarjetaAcceso(titulo, h('p', { class: 'acceso-descripcion', text: C.invitacion.intro }),
      h('p', { class: 'campo-ayuda', text: C.invitacion.paraMail(inv.invitacion_mail) }), form, abrirYaTengo, yaTengo);
  }

  /* ---------- Después de entrar ---------- */
  async function despuesDeEntrar() {
    const { data: s } = await sb.auth.getSession();
    if (!s || !s.session) { pantallaEntrar(); return; }
    let cuentas;
    try {
      const { data, error } = await sb.rpc('contrata_mis_cuentas');
      if (error) {
        if (error.code === 'PGRST202' || /Could not find the function/i.test(mensaje(error))) { const e = new Error('falta_0055'); e.falta0055 = true; throw e; }
        throw error;
      }
      cuentas = data || [];
    } catch (e) {
      dibujarCabecera(true);
      errorEn(raiz, e, despuesDeEntrar);
      return;
    }
    if (!cuentas.length) { estado.cuentas = []; await sinCuenta(); return; }
    estado.cuentas = cuentas;
    const guardada = Terna.leerLocal('contratar.cuenta', null);
    estado.cuenta = cuentas.find((c) => c.cuenta_id === (estado.cuenta && estado.cuenta.cuenta_id)) || cuentas.find((c) => c.cuenta_id === guardada) || cuentas[0];
    portal();
  }

  /* ---------- El portal ---------- */
  function leerHash() {
    const x = location.hash.slice(1);
    estado.avisoId = null; estado.editarId = null;
    if (x.startsWith('aviso=')) { estado.seccion = 'avisos'; estado.avisoId = x.slice(6); return; }
    if (x.startsWith('publicar=')) { estado.seccion = 'publicar'; estado.editarId = x.slice(9); return; }
    estado.seccion = SECCIONES.includes(x) ? x : 'avisos';
  }
  function portal() {
    dibujarCabecera(true);
    document.title = C.documento;
    sub.hidden = false;
    dibujarSub();
    cargar();
  }
  function dibujarSub() {
    vaciar(sub);
    for (const s of SECCIONES) {
      sub.append(h('a', { href: '#' + s, 'aria-current': s === estado.seccion ? 'true' : null, onclick: (e) => { e.preventDefault(); ir(s); } }, C.secciones[s]));
    }
  }
  function ir(s, extra) {
    history.replaceState(null, '', '#' + s + (extra ? '=' + extra : ''));
    leerHash();
    if (s === 'aviso') { estado.seccion = 'avisos'; estado.avisoId = extra; }
    dibujarSub();
    cargar().then(() => { const t = raiz.querySelector('h1'); if (t) t.focus(); });
  }
  function bandaDeLaCuenta() {
    const c = cuentaActual();
    if (c.estado === 'pausada') return h('p', { class: 'banda banda-error', role: 'status' }, icono('i-alerta'), h('span', { text: C.comun.cuentaPausada }));
    if (c.contrata_abierto === false) return h('p', { class: 'banda', role: 'status' }, icono('i-alerta'), h('span', { text: C.comun.cerrado }));
    // Sin nada que decir, un fragmento vacío: `append(null)` escribiría «null» en la página.
    return document.createDocumentFragment();
  }
  async function cargar() {
    const quitar = Terna.cargando(raiz);
    try {
      if (estado.seccion === 'avisos' && estado.avisoId) await detalle(estado.avisoId);
      else if (estado.seccion === 'avisos') await avisos();
      else if (estado.seccion === 'publicar') await publicar(estado.editarId);
      else if (estado.seccion === 'equipo') await equipo();
      else await cuenta();
    } catch (e) {
      errorEn(raiz, e, cargar);
    } finally {
      quitar();
    }
  }
  async function leerAvisos() {
    estado.avisos = (await llamar('contrata_avisos', { p_cuenta: cuentaActual().cuenta_id })) || [];
    return estado.avisos;
  }

  /* ---------- Avisos ---------- */
  const conteo = (x, piso) => (x === null || x === undefined ? C.comun.menosDe(piso) : num(x));
  function lineaAviso(a) {
    const partes = [C.modalidades[a.modalidad], a.ubicacion];
    if (a.estado === 'abierta') partes.push(C.avisos.abiertoHace(a.dias_abierta || 0), a.vence_el ? C.avisos.venceEl(Terna.fechaLarga(a.vence_el)) : null);
    else if (a.estado === 'vencida' && a.vence_el) partes.push(C.avisos.vencioEl(Terna.fechaLarga(a.vence_el)));
    else if (a.estado === 'cerrada' && a.cerrada_en) partes.push(C.avisos.cerradoEl(Terna.fechaLarga(a.cerrada_en)));
    return meta(...partes);
  }
  async function accion(a, cual) {
    const textos = { pausar: [C.avisos.pausarTitulo, C.avisos.pausarTexto, C.avisos.pausar, C.avisos.hechoPausar],
      cerrar: [C.avisos.cerrarTitulo, C.avisos.cerrarTexto, C.avisos.cerrar, C.avisos.hechoCerrar] };
    let motivo = null;
    if (textos[cual]) {
      let selector = null;
      const cuerpo = [h('p', { text: textos[cual][1] })];
      if (cual === 'cerrar') {
        selector = seleccion(Object.entries(C.avisos.cerrarMotivos), 'cubierto');
        cuerpo.push(campo('co-motivo-cierre', C.avisos.cerrarMotivo, selector).nodo);
      }
      const ok = await Terna.confirmar({ titulo: textos[cual][0], cuerpo: h('div', null, ...cuerpo), si: textos[cual][2], destructivo: cual === 'cerrar' });
      if (!ok) return;
      motivo = selector ? selector.value : null;
    }
    try {
      if (cual === 'publicar') {
        const r = await llamar('contrata_publicar', { p_publicacion: a.id });
        Terna.avisoBreve(r === 'abierta' ? C.avisos.hechoAbierto : C.avisos.hechoRevision);
      } else {
        const acc = { reanudar: 'reanudar', renovar: 'renovar', pausar: 'pausar', cerrar: 'cerrar' }[cual];
        await llamar('contrata_cambiar_estado', { p_publicacion: a.id, p_accion: acc, p_motivo: motivo });
        Terna.avisoBreve({ reanudar: C.avisos.hechoReanudar, renovar: C.avisos.hechoRenovar, pausar: C.avisos.hechoPausar, cerrar: C.avisos.hechoCerrar }[cual]);
      }
    } catch (e) {
      if (!(e instanceof Barrera)) Terna.avisoBreve(textoDe(e), { error: true });
    }
    await cargar();
  }
  function botonesAviso(a, enDetalle) {
    const b = [];
    const boton = (texto, fn, primario) => h('button', { class: 'btn btn-chico' + (primario ? ' btn-primario' : ''), type: 'button', onclick: fn }, texto);
    if (!enDetalle && ['abierta', 'pausada', 'cerrada', 'vencida'].includes(a.estado)) b.push(boton(C.avisos.ver, () => ir('aviso', a.id), true));
    if (puedeEscribir()) {
      if (['borrador', 'rechazada'].includes(a.estado)) {
        b.push(boton(C.avisos.editar, () => ir('publicar', a.id), true));
        b.push(boton(cuentaActual().de_confianza ? C.avisos.publicar : C.avisos.enviarRevision, () => accion(a, 'publicar')));
      }
      if (['abierta', 'en_revision', 'pausada'].includes(a.estado)) b.push(boton(C.avisos.editar, () => ir('publicar', a.id)));
      if (a.estado === 'abierta') { b.push(boton(C.avisos.renovar, () => accion(a, 'renovar'))); b.push(boton(C.avisos.pausar, () => accion(a, 'pausar'))); }
      if (a.estado === 'pausada') b.push(boton(C.avisos.reanudar, () => accion(a, 'reanudar')));
      if (a.estado === 'vencida') b.push(boton(C.avisos.renovar, () => accion(a, 'renovar'), true));
      if (a.estado !== 'cerrada') b.push(boton(C.avisos.cerrar, () => accion(a, 'cerrar')));
    }
    return b.length ? h('div', { class: 'botones op-acciones' }, ...b) : null;
  }
  async function avisos() {
    const lista = await leerAvisos();
    vaciar(raiz);
    const c = cuentaActual();
    const abiertos = lista.filter((a) => ['abierta', 'en_revision'].includes(a.estado)).length;
    const max = c.avisos_max || 3;
    const nuevo = puedeEscribir() ? h('button', { class: 'btn btn-primario', type: 'button', onclick: () => ir('publicar') }, icono('i-agregar'), C.avisos.nuevo) : null;
    raiz.append(encabezado(C.avisos.titulo, C.avisos.intro), bandaDeLaCuenta(),
      h('div', { class: 'co-fila' }, nuevo, h('p', { class: 'suave', text: abiertos >= max ? C.avisos.sinCupo(max) : C.avisos.cupo(abiertos, max) })));
    if (!lista.length) { raiz.append(h('p', { class: 'vacio', text: C.avisos.vacio })); return; }
    const cont = h('div', { class: 'op-tarjetas' });
    for (const a of lista) {
      const piso = a.piso_conteo || 3;
      const notas = [];
      if (a.estado === 'en_revision') notas.push(h('p', { class: 'op-linea suave', text: C.avisos.enRevision }));
      if (a.estado === 'rechazada') notas.push(h('p', { class: 'op-linea', text: C.avisos.rechazado(a.revision_motivo) }));
      if (['abierta', 'pausada', 'cerrada', 'vencida'].includes(a.estado)) {
        notas.push(h('p', { class: 'op-linea' }, h('strong', { text: C.avisos.postulaciones(a.postulaciones, a.postulaciones_nuevas) }),
          h('span', { class: 'suave', text: ' · ' + C.aviso.mostrado + ': ' + conteo(a.mostrada, piso) })));
      }
      cont.append(h('article', { class: 'tarjeta op-tarjeta co-aviso' + (a.estado === 'abierta' ? ' op-bien' : a.estado === 'rechazada' ? ' op-roto' : '') },
        h('div', { class: 'op-cabeza' }, chipEstado(a.estado), h('h2', { class: 'tarjeta-titulo', text: a.puesto })),
        lineaAviso(a), ...notas, botonesAviso(a, false)));
    }
    raiz.append(cont);
  }

  /* ---------- Un aviso ---------- */
  function cifra(etiqueta, valor, ayuda) {
    return h('div', { class: 'co-cifra' }, h('p', { class: 'cifra-numero', text: valor }), h('p', { class: 'co-cifra-etiqueta', text: etiqueta }),
      ayuda ? h('p', { class: 'campo-ayuda', text: ayuda }) : null);
  }
  async function detalle(id) {
    const lista = await leerAvisos();
    const a = lista.find((x) => x.id === id);
    if (!a) { ir('avisos'); return; }
    const [recibidas, recomendados] = await Promise.all([
      llamar('contrata_candidaturas', { p_publicacion: a.id }),
      a.estado === 'abierta' ? llamar('contrata_recomendados', { p_publicacion: a.id }) : Promise.resolve([]),
    ]);
    vaciar(raiz);
    const piso = a.piso_conteo || 3;
    const volver = h('button', { class: 'btn btn-texto', type: 'button', onclick: () => ir('avisos') }, icono('i-volver'), C.aviso.volver);
    raiz.append(volver, encabezado(a.puesto, null, h('div', { class: 'op-cabeza' }, chipEstado(a.estado)), lineaAviso(a)), bandaDeLaCuenta(), botonesAviso(a, true));

    const cifras = h('div', { class: 'co-cifras' },
      cifra(C.aviso.postulaciones, num(a.postulaciones)),
      cifra(C.aviso.mostrado, conteo(a.mostrada, piso)),
      cifra(C.aviso.vistas, conteo(a.vistas, piso)),
      cifra(C.aviso.match80, conteo(a.match_80, piso)),
      cifra(C.aviso.match70, conteo(a.match_70, piso)),
      cifra(C.aviso.recomendables, num(a.recomendables)));
    raiz.append(h('section', { class: 'tarjeta op-tarjeta', 'aria-labelledby': 'co-cifras-t' },
      h('h2', { class: 'op-subtitulo', id: 'co-cifras-t', text: C.aviso.cifras }), cifras,
      h('p', { class: 'campo-ayuda', text: C.aviso.propuestas(a.propuestas_enviadas, a.propuestas_aceptadas) }),
      h('p', { class: 'campo-ayuda', text: C.aviso.cifrasIntro(piso) }), h('p', { class: 'campo-ayuda', text: C.aviso.match })));

    // Las postulaciones recibidas.
    const sec = h('section', { class: 'op-tarjetas', 'aria-labelledby': 'co-recibidas-t' },
      h('h2', { class: 'op-subtitulo', id: 'co-recibidas-t', text: C.aviso.recibidas + ' (' + num((recibidas || []).length) + ')' }),
      h('p', { class: 'intro', text: C.aviso.recibidasIntro }));
    if (!(recibidas || []).length) sec.append(h('p', { class: 'vacio', text: C.aviso.recibidasVacio }));
    for (const k of recibidas || []) sec.append(tarjetaRecibida(k));
    raiz.append(sec);

    // Las personas que ajustan.
    const rec = h('section', { class: 'op-tarjetas', 'aria-labelledby': 'co-rec-t' },
      h('h2', { class: 'op-subtitulo', id: 'co-rec-t', text: C.aviso.recomendados }), h('p', { class: 'intro', text: C.aviso.recomendadosIntro }));
    if (a.estado !== 'abierta') rec.append(h('p', { class: 'vacio', text: C.aviso.recomendadosCerrado }));
    else if (!(recomendados || []).length) rec.append(h('p', { class: 'vacio', text: C.aviso.recomendadosVacio }));
    for (const r of recomendados || []) rec.append(tarjetaRecomendada(a, r));
    raiz.append(rec);

    // El texto del aviso, plegado.
    const cuerpo = h('div', { class: 'co-texto', hidden: true }, h('p', { class: 'co-parrafos', text: a.descripcion }),
      a.requisitos ? h('p', { class: 'co-parrafos', text: a.requisitos }) : null);
    const plegar = h('button', { class: 'btn btn-texto op-plegar', type: 'button', 'aria-expanded': 'false', onclick: () => {
      cuerpo.hidden = !cuerpo.hidden; plegar.setAttribute('aria-expanded', String(!cuerpo.hidden));
    } }, C.aviso.textoVer);
    raiz.append(h('section', { class: 'tarjeta op-tarjeta' }, h('h2', { class: 'op-subtitulo', text: C.aviso.texto }), plegar, cuerpo));
  }
  function tarjetaRecibida(k) {
    const nombre = [k.nombre, k.apellido].filter(Boolean).join(' ') || k.mail;
    const contactos = [];
    // El mail y el teléfono no pasan por Terna.urlExterna (solo http y https): se arman acá, con su forma comprobada.
    if (k.mail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(k.mail)) contactos.push(h('a', { class: 'btn btn-chico', href: 'mailto:' + k.mail }, icono('i-sobre', 'icono-14'), C.aviso.escribir));
    if (k.telefono && /^[+0-9 ()-]{6,30}$/.test(k.telefono)) contactos.push(h('a', { class: 'btn btn-chico', href: 'tel:' + k.telefono.replace(/[^+0-9]/g, '') }, C.aviso.llamar));
    const li = k.linkedin ? Terna.urlExterna(/^https?:\/\//i.test(k.linkedin) ? k.linkedin : 'https://www.linkedin.com/in/' + k.linkedin.replace(/^\/+/, '')) : null;
    if (li) contactos.push(h('a', { class: 'btn btn-chico', href: li, target: '_blank', rel: 'noopener noreferrer' }, C.aviso.linkedin));
    const archivos = k.archivos_vigentes && k.cv_path
      ? [linkFirmado(k.cv_path, C.aviso.cv), k.carta_path ? linkFirmado(k.carta_path, C.aviso.carta) : null]
      : [h('p', { class: 'campo-ayuda', text: C.aviso.sinArchivos })];
    const est = seleccion(Object.entries(C.aviso.estadoCandidatura), k.estado);
    est.setAttribute('aria-label', C.aviso.marcar + ': ' + nombre);
    est.addEventListener('change', async () => {
      try { await llamar('contrata_marcar_candidatura', { p_candidatura: k.id, p_estado: est.value }); Terna.avisoBreve(C.comun.guardado); }
      catch (e) { if (!(e instanceof Barrera)) Terna.avisoBreve(textoDe(e), { error: true }); }
    });
    return h('article', { class: 'tarjeta op-tarjeta co-recibida' },
      h('div', { class: 'op-cabeza' }, h('span', { class: 'co-lengueta', text: String(k.match ?? '—') }), h('h3', { class: 'tarjeta-titulo', text: nombre })),
      meta(C.aviso.recibidaEl(Terna.fechaLarga(k.recibida_en)), C.aviso.origen[k.origen], k.ciudad, k.mail, k.telefono),
      k.salario_monto ? h('p', { class: 'op-linea', text: C.aviso.salario(k.salario_monto, k.salario_moneda || '', C.periodos[k.salario_periodo] || '') }) : null,
      h('div', { class: 'botones op-acciones' }, ...contactos, ...archivos),
      h('div', { class: 'co-marcar' }, h('label', { class: 'campo-ayuda', text: C.aviso.marcar }), est));
  }
  function tarjetaRecomendada(a, r) {
    const idiomas = (r.idiomas || []).map((i) => i.idioma + (i.nivel ? ' ' + String(i.nivel).toUpperCase().replace('NATIVO', 'nativo') : '')).join(', ');
    const modalidades = (r.modalidades || []).map((m) => C.modalidades[m]).filter(Boolean).join(', ');
    const cumple = (r.requisitos_cumple || []).slice(0, 5);
    let accionNodo;
    if (r.propuesta_estado === 'enviada') accionNodo = h('span', { class: 'chip chip-espera' }, icono('i-pedido', 'icono-14'), C.aviso.propuesta);
    else if (r.propuesta_estado === 'aceptada') accionNodo = h('span', { class: 'chip chip-accion' }, icono('i-tilde', 'icono-14'), C.aviso.propuestaAceptada);
    else if (r.propuesta_estado === 'rechazada') accionNodo = h('span', { class: 'chip chip-espera' }, C.aviso.propuestaRechazada);
    else if (puedeEscribir()) {
      accionNodo = h('button', { class: 'btn btn-primario btn-chico', type: 'button', onclick: async () => {
        const ok = await Terna.confirmar({ titulo: C.aviso.proponerTitulo, texto: C.aviso.proponerTexto, si: C.aviso.proponer });
        if (!ok) return;
        try { await llamar('contrata_proponer', { p_publicacion: a.id, p_match: r.match_id }); Terna.avisoBreve(C.aviso.hechoProponer); }
        catch (e) { if (!(e instanceof Barrera)) Terna.avisoBreve(textoDe(e), { error: true }); }
        await cargar();
      } }, C.aviso.proponer);
    }
    return h('article', { class: 'tarjeta op-tarjeta co-recomendada' },
      h('div', { class: 'op-cabeza' }, h('span', { class: 'co-lengueta', text: String(r.match) }), h('h3', { class: 'tarjeta-titulo', text: r.titulo || r.seudonimo }),
        r.titulo ? h('span', { class: 'op-persona', text: r.seudonimo }) : null),
      meta(r.anios !== null && r.anios !== undefined ? C.aviso.anios(r.anios) : null, r.ciudad, idiomas, modalidades ? C.aviso.prefiere + ': ' + modalidades : null),
      r.conteo && r.conteo.total ? h('p', { class: 'op-linea', text: C.aviso.cumpleCuenta(r.conteo.cumple, r.conteo.total) }) : null,
      cumple.length ? h('ul', { class: 'co-cumple', 'aria-label': C.aviso.cumple }, ...cumple.map((t) => h('li', { text: t }))) : null,
      accionNodo ? h('div', { class: 'botones op-acciones' }, accionNodo) : null);
  }

  /* ---------- Publicar o editar ---------- */
  async function publicar(id) {
    let a = null;
    if (id) { a = (await leerAvisos()).find((x) => x.id === id) || null; if (!a) { ir('avisos'); return; } }
    vaciar(raiz);
    const soloTexto = !!a && ['abierta', 'en_revision', 'pausada'].includes(a.estado);
    raiz.append(encabezado(a ? C.publicar.tituloEditar : C.publicar.tituloNuevo, C.publicar.intro), bandaDeLaCuenta());
    if (!puedeEscribir()) return;
    if (soloTexto) raiz.append(h('p', { class: 'banda', role: 'status' }, icono('i-alerta'), h('span', { text: C.publicar.soloTexto })));

    const puesto = campo('co-puesto', C.publicar.puesto, h('input', { class: 'control', type: 'text', maxlength: '120', value: a ? a.puesto : '', disabled: soloTexto }), C.publicar.puestoAyuda);
    const contadorD = h('p', { class: 'campo-ayuda co-contador', 'aria-live': 'polite' });
    const desc = campo('co-desc', C.publicar.descripcion, h('textarea', { class: 'control', rows: '10', maxlength: String(MAX_DESCRIPCION) }), C.publicar.descripcionAyuda);
    desc.control.value = a ? a.descripcion : '';
    const contar = () => { contadorD.textContent = C.publicar.contador(desc.control.value.trim().length, MAX_DESCRIPCION); };
    desc.control.addEventListener('input', contar); contar();
    desc.nodo.append(contadorD);
    const req = campo('co-req', C.publicar.requisitos, h('textarea', { class: 'control', rows: '5', maxlength: String(MAX_REQUISITOS) }), C.publicar.requisitosAyuda);
    req.control.value = a && a.requisitos ? a.requisitos : '';
    const ubic = campo('co-ubic', C.publicar.ubicacion, h('input', { class: 'control', type: 'text', maxlength: '120', value: a ? a.ubicacion : '', disabled: soloTexto }), C.publicar.ubicacionAyuda);
    const modalidad = campo('co-modalidad', C.publicar.modalidad, seleccion(Object.entries(C.modalidades), a ? a.modalidad : 'presencial'));
    const jornada = campo('co-jornada', C.publicar.jornada, seleccion([['', C.publicar.jornadaSin], ...Object.entries(C.jornadas)], a ? a.jornada || '' : ''));
    const nivel = campo('co-nivel', C.publicar.nivel, seleccion([['', C.publicar.nivelSin], ...Object.entries(C.niveles)], a ? a.nivel || '' : ''));
    const idioma = campo('co-idioma', C.publicar.idioma, seleccion(Object.entries(C.idiomas), a ? a.idioma : 'es'));
    [modalidad, jornada, nivel, idioma].forEach((c) => { c.control.disabled = soloTexto; });
    const smin = campo('co-smin', C.publicar.desde, h('input', { class: 'control control-corto', type: 'number', min: '0', step: '1', inputmode: 'numeric', value: a && a.salario_min !== null ? String(Number(a.salario_min)) : '' }));
    const smax = campo('co-smax', C.publicar.hasta, h('input', { class: 'control control-corto', type: 'number', min: '0', step: '1', inputmode: 'numeric', value: a && a.salario_max !== null ? String(Number(a.salario_max)) : '' }));
    const moneda = campo('co-moneda', C.publicar.moneda, seleccion([['ARS', 'ARS'], ['USD', 'USD']], a ? a.salario_moneda || 'ARS' : 'ARS'));
    const periodo = campo('co-periodo', C.publicar.periodo, seleccion(Object.entries(C.periodos), a ? a.salario_periodo || 'mensual' : 'mensual'));
    const salario = h('fieldset', { class: 'campo co-salario' }, h('legend', { text: C.publicar.salario }),
      h('p', { class: 'campo-ayuda', text: C.publicar.salarioAyuda }), h('div', { class: 'co-grilla' }, smin.nodo, smax.nodo, moneda.nodo, periodo.nodo));
    const errorGeneral = h('p', { class: 'campo-error', role: 'alert' });

    const confianza = !!cuentaActual().de_confianza;
    const bGuardar = h('button', { class: 'btn', type: 'button' }, soloTexto ? C.publicar.guardarCambios : C.publicar.guardar);
    const bEnviar = soloTexto ? null : h('button', { class: 'btn btn-primario', type: 'submit' }, confianza ? C.publicar.enviarConfianza : C.publicar.enviar);
    const form = h('form', { class: 'formulario-angosto co-form', novalidate: true },
      puesto.nodo, h('div', { class: 'co-grilla' }, modalidad.nodo, ubic.nodo, jornada.nodo, nivel.nodo, idioma.nodo), desc.nodo, req.nodo, salario,
      errorGeneral, h('div', { class: 'botones' }, bGuardar, bEnviar));
    const marcarError = (e) => {
      const m = mensaje(e);
      const mapa = [['contrata_puesto', puesto], ['contrata_descripcion', desc], ['contrata_requisitos', req], ['contrata_ubicacion', ubic],
        ['contrata_modalidad', modalidad], ['contrata_salario', smin]];
      const texto = textoDe(e, C.publicar.errores);
      if (m.includes('contrata_texto_con_contacto')) { marcar(desc, texto); return; }
      for (const [k, c] of mapa) if (m.includes(k)) { marcar(c, texto); return; }
      errorGeneral.textContent = texto;
    };
    const guardar = async (yPublicar) => {
      [puesto, desc, req, ubic, modalidad, smin].forEach((c) => marcar(c, ''));
      errorGeneral.textContent = '';
      if (!soloTexto && puesto.control.value.trim().length < 3) { marcar(puesto, C.publicar.errores.contrata_puesto_invalido); return; }
      const largo = desc.control.value.trim().length;
      if (largo < PISO_DESCRIPCION || largo > MAX_DESCRIPCION) { marcar(desc, C.publicar.errores.contrata_descripcion_invalida); return; }
      const datos = { puesto: puesto.control.value.trim(), descripcion: desc.control.value.trim(), requisitos: req.control.value.trim(),
        ubicacion: ubic.control.value.trim(), modalidad: modalidad.control.value, jornada: jornada.control.value, nivel: nivel.control.value,
        idioma: idioma.control.value, salario_min: smin.control.value, salario_max: smax.control.value,
        salario_moneda: smin.control.value || smax.control.value ? moneda.control.value : '', salario_periodo: smin.control.value || smax.control.value ? periodo.control.value : '' };
      bGuardar.disabled = true; if (bEnviar) bEnviar.disabled = true;
      try {
        const nuevoId = await llamar('contrata_guardar_publicacion', { p_cuenta: cuentaActual().cuenta_id, p_publicacion: a ? a.id : null, p_datos: datos });
        if (yPublicar) {
          const r = await llamar('contrata_publicar', { p_publicacion: nuevoId });
          Terna.avisoBreve(r === 'abierta' ? C.avisos.hechoAbierto : C.avisos.hechoRevision);
          ir('avisos');
        } else {
          Terna.avisoBreve(soloTexto ? C.comun.guardado : C.publicar.guardadoBorrador);
          if (!a) { history.replaceState(null, '', '#publicar=' + nuevoId); estado.editarId = nuevoId; }
          await cargar();
        }
      } catch (e) {
        if (!(e instanceof Barrera)) marcarError(e);
      } finally {
        bGuardar.disabled = false; if (bEnviar) bEnviar.disabled = false;
      }
    };
    bGuardar.addEventListener('click', () => guardar(false));
    form.addEventListener('submit', (e) => { e.preventDefault(); guardar(true); });
    raiz.append(h('section', { class: 'tarjeta op-tarjeta' }, form));
  }

  /* ---------- Equipo ---------- */
  async function equipo() {
    const c = cuentaActual();
    const filas = (await llamar('contrata_equipo', { p_cuenta: c.cuenta_id })) || [];
    vaciar(raiz);
    raiz.append(encabezado(C.equipo.titulo, C.equipo.intro), bandaDeLaCuenta());
    const lista = h('div', { class: 'op-tarjetas' });
    const errorDe = (e) => textoDe(e, C.equipo.errores);
    for (const f of filas) {
      const botones = [];
      if (esDueno() && f.tipo === 'miembro' && !f.es_vos) {
        botones.push(h('button', { class: 'btn btn-chico', type: 'button', onclick: async () => {
          try { await llamar('contrata_cambiar_miembro', { p_cuenta: c.cuenta_id, p_miembro: f.id, p_accion: f.rol === 'dueno' ? 'hacer_miembro' : 'hacer_dueno' }); Terna.avisoBreve(C.equipo.hecho); }
          catch (e) { if (!(e instanceof Barrera)) Terna.avisoBreve(errorDe(e), { error: true }); }
          await cargar();
        } }, f.rol === 'dueno' ? C.equipo.hacerMiembro : C.equipo.hacerDueno));
        botones.push(h('button', { class: 'btn btn-chico', type: 'button', onclick: async () => {
          const ok = await Terna.confirmar({ titulo: C.equipo.quitarTitulo(f.mail), texto: C.equipo.quitarTexto, si: C.equipo.quitar, destructivo: true });
          if (!ok) return;
          try { await llamar('contrata_cambiar_miembro', { p_cuenta: c.cuenta_id, p_miembro: f.id, p_accion: 'quitar' }); Terna.avisoBreve(C.equipo.hecho); }
          catch (e) { if (!(e instanceof Barrera)) Terna.avisoBreve(errorDe(e), { error: true }); }
          await cargar();
        } }, C.equipo.quitar));
      }
      if (esDueno() && f.tipo === 'invitacion') {
        botones.push(h('button', { class: 'btn btn-chico', type: 'button', onclick: async () => {
          try { await llamar('contrata_cancelar_invitacion', { p_cuenta: c.cuenta_id, p_invitacion: f.id }); Terna.avisoBreve(C.equipo.hecho); }
          catch (e) { if (!(e instanceof Barrera)) Terna.avisoBreve(errorDe(e), { error: true }); }
          await cargar();
        } }, C.equipo.cancelar));
      }
      lista.append(h('article', { class: 'tarjeta op-tarjeta' },
        h('div', { class: 'op-cabeza' }, h('h2', { class: 'tarjeta-titulo', text: f.mail }), f.es_vos ? h('span', { class: 'suave', text: C.equipo.vos }) : null),
        meta(f.tipo === 'invitacion' ? C.equipo.pendiente(Terna.fechaLarga(f.vence_en)) : (f.rol === 'dueno' ? C.equipo.dueno : C.equipo.miembro)),
        botones.length ? h('div', { class: 'botones op-acciones' }, ...botones) : null));
    }
    raiz.append(lista, h('p', { class: 'suave', text: C.equipo.cupo(filas.length, 5) }));
    if (!esDueno() || !puedeEscribir()) return;
    const mail = campo('co-invitar', C.equipo.mail, h('input', { class: 'control', type: 'email', autocomplete: 'off', spellcheck: 'false' }));
    const boton = h('button', { class: 'btn btn-primario', type: 'submit' }, C.equipo.invitarBoton);
    const resultado = h('div', { class: 'co-link-caja', 'aria-live': 'polite' });
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, mail.nodo, boton, resultado);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      marcar(mail, '');
      vaciar(resultado);
      boton.disabled = true;
      try {
        const r = await llamar('contrata_invitar_miembro', { p_cuenta: c.cuenta_id, p_mail: mail.control.value.trim() });
        const link = location.origin + location.pathname + '#invitacion=' + r.token;
        const codigo = h('code', { class: 'op-clave', text: link });
        resultado.append(h('p', { class: 'campo-ayuda', text: C.equipo.link }), codigo,
          h('button', { class: 'btn btn-chico', type: 'button', onclick: () => Terna.copiar(link, codigo) }, C.equipo.copiar));
        mail.control.value = '';
      } catch (err) {
        if (!(err instanceof Barrera)) marcar(mail, errorDe(err));
      } finally {
        boton.disabled = false;
      }
    });
    raiz.append(h('section', { class: 'tarjeta op-tarjeta' }, h('h2', { class: 'op-subtitulo', text: C.equipo.invitar }), form));
  }

  /* ---------- Cuenta ---------- */
  async function cuenta() {
    const c = cuentaActual();
    vaciar(raiz);
    raiz.append(encabezado(C.cuenta.titulo, C.cuenta.intro), bandaDeLaCuenta(), meta(C.cuenta.tipo[c.tipo] || c.tipo));
    const nombre = campo('co-cuenta-nombre', C.cuenta.nombre, h('input', { class: 'control', type: 'text', maxlength: '80', value: c.nombre || '', disabled: !esDueno() }),
      c.tipo === 'particular' ? C.cuenta.nombreAyudaParticular : null);
    const otros = campo('co-cuenta-otros', C.cuenta.otros, h('textarea', { class: 'control', rows: '4', disabled: !esDueno() }), C.cuenta.otrosAyuda);
    otros.control.value = (c.otros_nombres || []).join('\n');
    const boton = h('button', { class: 'btn btn-primario', type: 'submit', disabled: !esDueno() || !puedeEscribir() }, C.comun.guardar);
    const form = h('form', { class: 'formulario-angosto', novalidate: true }, nombre.nodo, otros.nodo,
      esDueno() ? boton : h('p', { class: 'campo-ayuda', text: C.cuenta.soloDueno }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      marcar(nombre, ''); marcar(otros, '');
      const lista = otros.control.value.split('\n').map((x) => x.trim()).filter(Boolean);
      boton.disabled = true;
      try {
        await llamar('contrata_editar_cuenta', { p_cuenta: c.cuenta_id, p_nombre: nombre.control.value.trim(), p_otros_nombres: lista });
        Terna.avisoBreve(C.comun.guardado);
        await despuesDeEntrar();
      } catch (err) {
        if (!(err instanceof Barrera)) {
          const m = mensaje(err);
          marcar(m.includes('otros') ? otros : nombre, textoDe(err, C.cuenta.errores));
        }
      } finally {
        boton.disabled = false;
      }
    });
    raiz.append(h('section', { class: 'tarjeta op-tarjeta' }, form));
  }

  /* ---------- Arranque ---------- */
  async function arrancar() {
    cabecera = document.getElementById('barra-ops');
    raiz = document.getElementById('contratar');
    sub = document.getElementById('subpestanas');
    if (Terna.dibujarPie) { try { Terna.dibujarPie(); } catch (e) { /* el pie es opcional */ } }
    const m = /(?:^#|&)invitacion=([a-f0-9]{32})/.exec(Terna.hashInicial || '');
    if (m) {
      history.replaceState(null, '', location.pathname);
      await pantallaInvitacion(m[1]);
      return;
    }
    leerHash();
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) { pantallaEntrar(); return; }
    await despuesDeEntrar();
  }
  window.addEventListener('hashchange', () => {
    if (/invitacion=/.test(location.hash)) { location.reload(); return; }
    if (estado.cuenta) { leerHash(); dibujarSub(); cargar(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
