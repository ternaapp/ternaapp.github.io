/* Terna · js/invitaciones.js
   Invitaciones (brand.md §6.8): el cupo, la invitación nueva con el mensaje listo para copiar (§6.13) y la lista con
   "Copiar link" y "Cancelar invitación". Lee mis_invitaciones y config; escribe con crear_invitacion y cancelar_invitacion. */
'use strict';

Terna.pagina('invitaciones', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const I = T.invitaciones;
  const raiz = document.getElementById('invitaciones');
  const cupo = config.invitaciones_cupo || 0;
  const dias = config.invitaciones_dias || 7;
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  const linkDe = (token) => base + 'crear-cuenta.html?token=' + encodeURIComponent(token);
  let invitaciones = [];
  let recien = null;

  async function cargar() {
    const { data, error } = await sb.from('mis_invitaciones').select('id, mail, token, estado, creada_en, vence_en, usada_en').order('creada_en', { ascending: false });
    if (error) { Terna.errorDeCarga(raiz, error); return false; }
    invitaciones = data || [];
    return true;
  }
  const ocupadas = () => invitaciones.filter((i) => i.estado === 'usada' || i.estado === 'pendiente').length;

  function formulario() {
    const idMail = 'mail-invitacion';
    const input = h('input', { class: 'control', id: idMail, type: 'email', autocomplete: 'off', inputmode: 'email', maxlength: '254', 'aria-describedby': idMail + '-ayuda ' + idMail + '-error' });
    const err = h('p', { class: 'campo-error', id: idMail + '-error', role: 'alert' });
    const bCrear = h('button', { class: 'btn btn-primario', type: 'submit' }, icono('i-sobre'), I.crear);
    const form = h('form', { class: 'formulario', novalidate: true },
      h('div', { class: 'campo' }, h('label', { for: idMail, text: I.mailPersona }), input, h('p', { class: 'campo-ayuda', id: idMail + '-ayuda', text: I.mailAyuda }), err),
      h('div', null, bCrear));
    input.addEventListener('input', () => { err.textContent = ''; input.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mail = input.value.trim().toLowerCase();
      const problema = !mail ? T.errores.completa : (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) ? T.errores.mailInvalido : null);
      if (problema) { err.textContent = problema; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      bCrear.setAttribute('aria-disabled', 'true');
      const { data, error } = await sb.rpc('crear_invitacion', { p_mail: mail });
      bCrear.removeAttribute('aria-disabled');
      if (error) {
        if (Terna.siSesionVencida(error)) return;
        err.textContent = Terna.textoError(error);
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      recien = (Array.isArray(data) ? data[0] : data) || null;
      await cargar();
      dibujar();
      const caja = document.getElementById('invitacion-creada');
      if (caja) caja.focus();
    });
    return h('section', { class: 'tarjeta seccion', 'aria-labelledby': 'h-nueva' }, h('h2', { id: 'h-nueva', class: 'tarjeta-titulo', text: I.nueva }), form);
  }

  function creada(inv) {
    const link = linkDe(inv.token);
    const mensaje = I.mensaje(link, dias);
    const texto = h('p', { class: 'mensaje-invitacion', text: mensaje });
    return h('section', { class: 'tarjeta seccion', id: 'invitacion-creada', tabindex: '-1', 'aria-label': inv.mail },
      texto,
      h('div', { class: 'botones' },
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => Terna.copiar(mensaje, texto) }, icono('i-pegar'), I.copiarMensaje),
        h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(link, texto) }, icono('i-pegar'), I.copiarLink)),
      h('p', { class: 'campo-ayuda', text: I.mandalo }));
  }

  function lineaFechas(inv) {
    const partes = [I.creada(Terna.fechaCorta(inv.creada_en))];
    if (inv.estado === 'pendiente') partes.push(I.vence(Terna.fechaCorta(inv.vence_en)));
    if (inv.estado === 'usada' && inv.usada_en) partes.push(I.usada(Terna.fechaCorta(inv.usada_en)));
    if (inv.estado === 'vencida') partes.push(I.vencio(Terna.fechaCorta(inv.vence_en)));
    return partes.join(' · ');
  }
  function lista() {
    if (!invitaciones.length) return h('p', { class: 'suave', text: I.vacio });
    return h('ul', { class: 'tarjeta tarjeta-plana lista-invitaciones', role: 'list' }, invitaciones.map((inv) => {
      const li = h('li', { class: 'invitacion' },
        h('div', { class: 'invitacion-cabecera' }, h('strong', { text: inv.mail }), h('span', { class: 'chip', text: I.estados[inv.estado] || inv.estado })),
        h('p', { class: 'campo-ayuda', text: lineaFechas(inv) }));
      if (inv.estado === 'pendiente') {
        li.append(h('div', { class: 'botones' },
          h('button', { class: 'btn btn-texto', type: 'button', onclick: () => Terna.copiar(linkDe(inv.token)) }, icono('i-pegar'), I.copiarLink),
          h('button', { class: 'btn btn-destructivo-texto', type: 'button', onclick: (e) => cancelar(inv, e.currentTarget) }, I.cancelar)));
      }
      return li;
    }));
  }
  async function cancelar(inv) {
    const si = await Terna.confirmar({ titulo: I.cancelarTitulo(inv.mail), texto: I.cancelarTexto, si: I.cancelar, no: T.comun.volver, destructivo: true });
    if (!si) return;
    const { error } = await sb.rpc('cancelar_invitacion', { p_id: inv.id });
    if (error) { if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true }); return; }
    if (recien && recien.id === inv.id) recien = null;
    await cargar();
    dibujar();
    Terna.avisoBreve(T.comun.guardado);
    Terna.devolverFoco(null);
  }

  function dibujar() {
    Terna.vaciar(raiz);
    const quedan = Math.max(0, cupo - ocupadas());
    raiz.append(h('p', { class: 'intro', text: I.intro(quedan, cupo, dias) }));
    if (!config.invitaciones_abiertas) raiz.append(h('p', { class: 'vacio', text: I.cerradas }));
    else if (quedan <= 0) raiz.append(h('p', { class: 'vacio', text: I.sinCupo }));
    else raiz.append(formulario());
    if (recien) raiz.append(creada(recien));
    raiz.append(lista());
  }

  const parar = Terna.cargando(raiz);
  const ok = await cargar();
  parar();
  if (ok) dibujar();
});
