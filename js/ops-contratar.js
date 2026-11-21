/* Terna · js/ops-contratar.js
   Operación › Contratar (contratar.md 0.1 §7; datos.md 0.44, 0055): lo que Francisco hace con Terna para contratar. Tres vistas:
   Para revisar (cada aviso antes de que se publique, salvo las cuentas de confianza, y los que alguien marcó «algo está mal»),
   Cuentas (pausar, activar, de confianza) e Invitar (el link para crear una cuenta y las invitaciones). Lee y escribe solo por las
   funciones ops_contrata_*, que empiezan con ops_exigir(): sin el segundo paso no anda. Nunca muestra datos de quienes postulan.
   Los textos son los de TO.contratar (js/ops-textos.js). */
'use strict';

window.OpsContratar = function (api) {
  const { h, icono, vaciar } = Terna;
  const C = window.TO.contratar;

  // `der`: los índices de las columnas con números, alineadas a la derecha.
  const tabla = (nombre, cabeza, filas, der) => h('div', { class: 'tabla-caja', tabindex: '0', role: 'region', 'aria-label': nombre }, h('table', { class: 'tabla op-tabla' },
    h('thead', null, h('tr', null, cabeza.map((t, i) => h('th', { scope: 'col', class: der && der.includes(i) ? 'der' : null }, t || Terna.oculto('—'))))),
    h('tbody', null, filas)));
  const td = (texto, der) => h('td', { class: der ? 'der num' : null, text: texto === null || texto === undefined || texto === '' ? '—' : String(texto) });
  const num = (x) => Terna.numero(Number(x || 0));
  const fallo = (error) => { if (!api.esBarrera(error)) Terna.avisoBreve(Terna.textoError(error), { error: true }); };

  /* ---------- Para revisar ---------- */
  async function revisar(cont) {
    const { data, error } = await api.rpc('ops_contrata_por_revisar');
    if (error) { api.errorEn(cont, error, () => revisar(cont)); return; }
    const R = C.revisar;
    vaciar(cont);
    const filas = data || [];
    if (!filas.length) { cont.append(h('p', { class: 'vacio', text: R.vacio })); return; }
    const lista = h('div', { class: 'empresas-lista' });
    filas.forEach((p, i) => lista.append(tarjetaRevisar(p, i, cont)));
    cont.append(lista);
  }
  function tarjetaRevisar(p, i, cont) {
    const R = C.revisar;
    const id = 'revisar-' + i;
    const denuncias = Number(p.denuncias) || 0;
    const chip = p.estado === 'en_revision'
      ? h('span', { class: 'chip chip-espera' }, icono('i-por-decidir', 'icono-14'), h('span', { text: R.enRevision }))
      : h('span', { class: 'chip chip-error' }, icono('i-alerta', 'icono-14'), h('span', { text: R.conDenuncias(denuncias) }));
    const meta = [R.de(p.cuenta, p.cuenta_tipo), p.ubicacion, p.modalidad, p.nivel, p.jornada, p.idioma,
      p.salario_min || p.salario_max ? [p.salario_moneda, p.salario_min, p.salario_max ? '– ' + p.salario_max : null, p.salario_periodo].filter(Boolean).join(' ') : null,
      R.cuando(Terna.fechaCorta(p.actualizada_en))].filter(Boolean).join(' · ');
    const partes = [
      h('div', { class: 'caso-cabeza' }, chip, h('h2', { class: 'tarjeta-titulo', id: id + '-titulo', tabindex: '-1', text: p.puesto })),
      h('p', { class: 'empresa-meta', text: meta }),
      h('h3', { text: R.descripcion }), h('p', { class: 'caso-texto', text: p.descripcion || '—' }),
    ];
    if (p.requisitos) partes.push(h('h3', { text: R.requisitos }), h('p', { class: 'caso-texto', text: p.requisitos }));
    const motivos = Array.isArray(p.motivos) ? p.motivos : [];
    if (motivos.length) partes.push(h('h3', { text: R.motivos }), h('ul', { class: 'caso-texto' }, motivos.map((m) => h('li', { text: m }))));
    const b = (texto, clase, fn) => h('button', { class: clase, type: 'button', onclick: fn }, texto);
    const botones = h('div', { class: 'botones op-acciones' });
    if (p.estado === 'en_revision') {
      botones.append(b(R.aprobar, 'btn btn-primario', () => accion(p, 'aprobar', null, cont)),
        b(R.rechazar, 'btn btn-destructivo-texto', () => conMotivo(p, 'rechazar', R.rechazarTitulo, cont)));
    } else {
      if (p.estado === 'abierta') botones.append(b(R.pausar, 'btn', () => conMotivo(p, 'pausar', R.pausarTitulo, cont)));
      if (['abierta', 'pausada'].includes(p.estado)) botones.append(b(R.rechazar, 'btn btn-destructivo-texto', () => conMotivo(p, 'rechazar', R.rechazarTitulo, cont)));
      botones.append(b(R.descartar, 'btn btn-texto', () => accion(p, 'descartar_denuncias', null, cont)));
    }
    partes.push(botones);
    return h('section', { class: 'tarjeta empresa caso', 'aria-labelledby': id + '-titulo' }, partes);
  }
  async function conMotivo(p, accionClave, titulo, cont) {
    const R = C.revisar;
    const idM = Terna.idUnico('motivo');
    const texto = h('textarea', { class: 'control', id: idM, rows: '3', maxlength: '300', 'aria-describedby': idM + '-ayuda' });
    const origen = document.activeElement;
    let si = false;
    const bNo = h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, T.comun.cancelar);
    const bSi = h('button', { class: 'btn btn-destructivo', type: 'button', onclick: () => { si = true; dlg.close(); } }, accionClave === 'pausar' ? R.pausar : R.rechazar);
    const dlg = Terna.dialogo({ titulo, clase: 'dialogo-confirmar', botones: [bNo, bSi],
      cuerpo: [h('p', { class: 'dialogo-aviso', text: p.puesto + ' · ' + p.cuenta }),
        h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: idM, text: R.motivo }), texto, h('p', { class: 'campo-ayuda', id: idM + '-ayuda', text: R.motivoAyuda }))] });
    dlg.addEventListener('close', () => {
      Terna.devolverFoco(origen);
      if (si) accion(p, accionClave, texto.value.trim() || null, cont);
    });
    dlg.showModal();
    texto.focus();
  }
  async function accion(p, accionClave, motivo, cont) {
    const { data, error } = await api.rpc('ops_contrata_revisar', { p_publicacion: p.id, p_accion: accionClave, p_motivo: motivo });
    if (error) { fallo(error); return; }
    const R = C.revisar;
    Terna.avisoBreve(R.hecho[data] || R.hecho.otro);
    await revisar(cont);
  }

  /* ---------- Cuentas ---------- */
  async function cuentas(cont) {
    const { data, error } = await api.rpc('ops_contrata_cuentas');
    if (error) { api.errorEn(cont, error, () => cuentas(cont)); return; }
    const K = C.cuentas;
    vaciar(cont);
    const filas = data || [];
    if (!filas.length) { cont.append(h('p', { class: 'vacio', text: K.vacio })); return; }
    const cuerpo = filas.map((c) => {
      const b = (texto, clase, fn) => h('button', { class: 'btn btn-chico ' + clase, type: 'button', onclick: fn }, texto);
      const acciones = h('td', null, h('div', { class: 'botones op-acciones' },
        c.estado === 'activa' ? b(K.pausar, 'btn-destructivo-texto', () => pausar(c, cont)) : b(K.activar, '', () => cambiarCuenta(c, 'activar', cont)),
        c.de_confianza ? b(K.noConfiar, 'btn-texto', () => cambiarCuenta(c, 'confianza_no', cont)) : b(K.confiar, 'btn-texto', () => cambiarCuenta(c, 'confianza_si', cont))));
      return h('tr', null,
        h('th', { scope: 'row' }, h('span', { text: c.nombre }), c.de_confianza ? h('span', { class: 'chip chip-accion', title: K.confianzaAyuda, text: K.confianza }) : null),
        td(K.tipo[c.tipo] || c.tipo), h('td', null, h('span', { class: 'chip ' + (c.estado === 'activa' ? '' : 'chip-espera'), text: K.estado[c.estado] || c.estado })),
        td(num(c.miembros), true), td(num(c.abiertas), true), td(num(c.en_revision), true), td(num(c.cerradas), true),
        td(num(c.postulaciones), true), td(num(c.propuestas), true), td(num(c.denuncias), true), acciones);
    });
    cont.append(tabla(C.vistas.cuentas, K.cols, cuerpo, [3, 4, 5, 6, 7, 8, 9]));
  }
  async function pausar(c, cont) {
    const K = C.cuentas;
    const si = await Terna.confirmar({ titulo: K.pausarTitulo(c.nombre), texto: K.pausarTexto, si: K.pausar, destructivo: true });
    if (si) await cambiarCuenta(c, 'pausar', cont);
  }
  async function cambiarCuenta(c, accionClave, cont) {
    const { error } = await api.rpc('ops_contrata_cuenta', { p_cuenta: c.id, p_accion: accionClave });
    if (error) { fallo(error); return; }
    Terna.avisoBreve(C.cuentas.hecho);
    await cuentas(cont);
  }

  /* ---------- Invitar ---------- */
  async function invitar(cont) {
    const I = C.invitar;
    vaciar(cont);
    const idMail = Terna.idUnico('cmail');
    const idNombre = Terna.idUnico('cnombre');
    const mail = h('input', { class: 'control', id: idMail, type: 'email', autocomplete: 'off', maxlength: '254', 'aria-describedby': idMail + '-error' });
    const nombre = h('input', { class: 'control', id: idNombre, type: 'text', autocomplete: 'off', maxlength: '80', 'aria-describedby': idNombre + '-error' });
    const errMail = h('p', { class: 'campo-error', id: idMail + '-error' });
    const errNombre = h('p', { class: 'campo-error', id: idNombre + '-error' });
    const errTipo = h('p', { class: 'campo-error', id: 'ctipo-error' });
    const grupo = Terna.idUnico('ctipo');
    const tipos = h('div', { class: 'opciones' }, Object.entries(I.tipos).map(([v, t]) => h('label', { class: 'casilla' },
      h('input', { type: 'radio', name: grupo, value: v, checked: v === 'empresa' }), h('span', { text: t }))));
    const resultado = h('div', { class: 'co-link-resultado', 'aria-live': 'polite' });
    const bCrear = h('button', { class: 'btn btn-primario', type: 'submit' }, icono('i-agregar'), I.crear);
    const limpiar = () => { for (const e of [errMail, errNombre, errTipo]) e.textContent = ''; for (const c of [mail, nombre]) c.removeAttribute('aria-invalid'); };
    const form = h('form', { class: 'tarjeta seccion', novalidate: true, 'aria-labelledby': 'h-cinvitar' },
      h('h2', { class: 'tarjeta-titulo', id: 'h-cinvitar', text: I.titulo }), h('p', { class: 'campo-ayuda', text: I.ayuda }),
      h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: idMail, text: I.mail }), mail, errMail),
      h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: idNombre, text: I.nombre }), nombre, errNombre),
      h('fieldset', { class: 'campo' }, h('legend', { class: 'campo-etiqueta', text: I.tipo }), tipos, errTipo),
      h('div', { class: 'botones' }, bCrear), resultado);
    form.addEventListener('input', limpiar);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiar();
      const vMail = mail.value.trim().toLowerCase();
      const vNombre = nombre.value.trim();
      const elegido = tipos.querySelector('input:checked');
      let ok = true;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vMail)) { errMail.textContent = I.errores.mail; mail.setAttribute('aria-invalid', 'true'); ok = false; }
      if (vNombre.length < 2 || vNombre.length > 80) { errNombre.textContent = I.errores.nombre; nombre.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!elegido) { errTipo.textContent = I.errores.tipo; ok = false; }
      if (!ok) { (mail.getAttribute('aria-invalid') ? mail : nombre).focus(); return; }
      bCrear.setAttribute('aria-disabled', 'true');
      const { data, error } = await api.rpc('ops_contrata_invitar', { p_mail: vMail, p_nombre: vNombre, p_tipo: elegido.value });
      bCrear.removeAttribute('aria-disabled');
      if (error) {
        const m = String(error.message || '');
        if (m === 'mail_invalido') { errMail.textContent = I.errores.mail; mail.focus(); return; }
        if (m === 'mail_con_invitacion') { errMail.textContent = I.errores.yaInvitado; mail.focus(); return; }
        if (m === 'contrata_nombre_invalido') { errNombre.textContent = I.errores.nombre; nombre.focus(); return; }
        fallo(error);
        return;
      }
      const link = new URL('contratar.html', location.href).href.split('#')[0] + '#invitacion=' + data.token;
      const campoLink = h('input', { class: 'control co-link', type: 'text', readonly: true, value: link, 'aria-label': I.link });
      vaciar(resultado);
      resultado.append(h('h3', { text: I.link }), campoLink, h('p', { class: 'campo-ayuda', text: I.linkAyuda(Terna.fechaCorta(data.vence_en)) }),
        h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(link) }, I.copiar)));
      campoLink.focus();
      campoLink.select();
      mail.value = '';
      nombre.value = '';
      await listaInvitaciones(listaCont);
    });
    const listaCont = h('div', { class: 'op-lista' });
    cont.append(form, h('h2', { class: 'tarjeta-titulo', text: I.abiertas }), listaCont);
    await listaInvitaciones(listaCont);
  }
  async function listaInvitaciones(cont) {
    const { data, error } = await api.rpc('ops_contrata_invitaciones');
    if (error) { api.errorEn(cont, error, () => listaInvitaciones(cont)); return; }
    const I = C.invitar;
    vaciar(cont);
    const filas = data || [];
    if (!filas.length) { cont.append(h('p', { class: 'vacio', text: I.vacio })); return; }
    cont.append(tabla(I.abiertas, I.cols, filas.map((x) => h('tr', null,
      td(x.mail), td(x.cuenta), h('td', null, h('span', { class: 'chip', text: I.estados[x.estado] || x.estado })),
      td(Terna.fechaCorta(x.creada_en)), td(Terna.fechaCorta(x.vence_en)),
      h('td', null, x.estado === 'pendiente' ? h('button', { class: 'btn btn-chico btn-texto', type: 'button', onclick: async () => {
        const { error: e } = await api.rpc('ops_contrata_cancelar_invitacion', { p_invitacion: x.id });
        if (e) { fallo(e); return; }
        await listaInvitaciones(cont);
      } }, I.cancelar) : null)))));
  }

  return { revisar, cuentas, invitar };
};
