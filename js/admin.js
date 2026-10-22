/* Terna · js/admin.js
   Admin (brand.md §6.9), solo Francisco: Usuarios (con Borrar), Invitaciones (abrir o cerrar), Uso y Problemas.
   Tres poderes y nada más; la pausa del motor no está acá. Lee y escribe solo por las funciones admin_* y
   config.invitaciones_abiertas (datos.md §14). Pensada primero para escritorio: en celular las tablas se desplazan. */
'use strict';

Terna.pagina('admin', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const A = T.admin;
  const raiz = document.getElementById('admin');
  const sub = document.getElementById('subpestanas');
  const SECCIONES = ['usuarios', 'invitaciones', 'uso', 'problemas'];
  let seccion = SECCIONES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'uso';
  const dias = { uso: Terna.leerLocal('admin.uso', 7) === 30 ? 30 : 7, problemas: Terna.leerLocal('admin.problemas', 7) === 30 ? 30 : 7 };
  let sinVer = 0;

  async function contarSinVer() {
    const { data } = await sb.rpc('admin_problemas', { p_dias: 30 });
    sinVer = (data || []).filter((p) => !p.visto_en).length;
  }
  function dibujarSub() {
    Terna.vaciar(sub);
    for (const s of SECCIONES) {
      sub.append(h('a', { href: '#' + s, 'aria-current': s === seccion ? 'true' : null, onclick: (e) => { e.preventDefault(); ir(s); } },
        A.secciones[s], s === 'problemas' && sinVer ? h('span', { class: 'chip chip-espera', text: A.sinVer(sinVer) }) : null));
    }
  }
  function ir(s) {
    seccion = s;
    history.replaceState(null, '', '#' + s);
    dibujarSub();
    cargar();
  }
  function selectorDias(clave) {
    const seg = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': A.secciones[clave] });
    for (const d of [7, 30]) {
      seg.append(h('label', null, h('input', { type: 'radio', name: 'dias-' + clave, value: String(d), checked: dias[clave] === d,
        onchange: () => { dias[clave] = d; Terna.guardarLocal('admin.' + clave, d); cargar(); } }), h('span', { text: A.dias[d] })));
    }
    return seg;
  }
  // La caja se desplaza a lo ancho en pantallas angostas: es enfocable para poder moverla con el teclado.
  const tabla = (cabeza, filas, pie) => h('div', { class: 'tabla-caja', tabindex: '0', role: 'region', 'aria-label': A.secciones[seccion] }, h('table', { class: 'tabla' },
    h('thead', null, h('tr', null, cabeza.map(([t, der, solo]) => h('th', { scope: 'col', class: der ? 'der' : null }, solo ? Terna.oculto(t) : t)))),
    h('tbody', null, filas), pie ? h('tfoot', null, pie) : null));
  const td = (texto, der) => h('td', { class: der ? 'der num' : null, text: texto === null || texto === undefined || texto === '' ? '—' : String(texto) });
  const fechaHora = (x) => (x ? Terna.fechaLarga(x) + ' ' + Terna.hora(x) : null);

  /* ---------- Usuarios ---------- */
  async function usuarios() {
    const { data, error } = await sb.rpc('admin_usuarios');
    if (error) { Terna.errorDeCarga(raiz, error); return; }
    const U = A.usuarios;
    const filas = (data || []).map((u) => h('tr', null,
      td(u.mail), td(Terna.fechaLarga(u.alta)), td(fechaHora(u.ultima_entrada)),
      h('td', null, h('span', { class: 'chip', text: A.estados[u.estado] || u.estado })),
      td(Terna.numero(Number(u.avisos_7d)), true), td(Terna.numero(Number(u.paquetes_7d)), true),
      h('td', null, u.rol === 'admin' ? null : h('button', { class: 'btn btn-destructivo-texto btn-chico', type: 'button', onclick: () => borrar(u) }, icono('i-quitar'), U.borrar))));
    Terna.vaciar(raiz);
    raiz.append(tabla([[U.mail], [U.alta], [U.ultima], [U.estado], [U.avisos, true], [U.paquetes, true], [U.borrar, false, true]], filas));
  }
  async function borrar(u) {
    const si = await Terna.confirmar({ titulo: A.borrarTitulo(u.mail), texto: A.borrarTexto, si: A.borrarUsuario, no: T.comun.cancelar, destructivo: true });
    if (!si) return;
    const { error } = await sb.rpc('admin_borrar_usuario', { p_usuario: u.usuario_id });
    if (error) { if (!Terna.siSesionVencida(error)) Terna.avisoBreve(T.errores.borrarUsuario, { error: true }); return; }
    Terna.avisoBreve(A.borrado);
    await usuarios();
    Terna.devolverFoco(null);
  }

  /* ---------- Invitaciones ---------- */
  function invitaciones() {
    Terna.vaciar(raiz);
    const idT = 'h-inv-abiertas';
    const estado = h('span', { 'aria-hidden': 'true' });
    const b = h('button', { class: 'interruptor', type: 'button', role: 'switch', 'aria-labelledby': idT }, estado, h('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }));
    const pintar = () => { const v = !!ctx.config.invitaciones_abiertas; b.setAttribute('aria-checked', String(v)); estado.textContent = v ? T.preferencias.si : T.preferencias.no; };
    pintar();
    b.addEventListener('click', async () => {
      const nuevo = !ctx.config.invitaciones_abiertas;
      b.setAttribute('aria-disabled', 'true');
      const { error } = await sb.from('config').update({ invitaciones_abiertas: nuevo }).eq('id', 1);
      b.removeAttribute('aria-disabled');
      if (error) { if (!Terna.siSesionVencida(error)) Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
      ctx.config.invitaciones_abiertas = nuevo;
      pintar();
      Terna.avisoBreve(T.comun.guardado);
    });
    raiz.append(h('section', { class: 'tarjeta seccion prefs' },
      h('div', { class: 'interruptor-fila' }, h('h2', { id: idT, class: 'tarjeta-titulo', text: A.invitacionesAbiertas }), b),
      h('p', { class: 'campo-ayuda', text: A.invitacionesAyuda })));
  }

  /* ---------- Uso ---------- */
  async function uso() {
    const { data, error } = await sb.rpc('admin_uso_diario', { p_dias: dias.uso });
    if (error) { Terna.errorDeCarga(raiz, error); return; }
    const U = A.uso;
    const filas = data || [];
    const suma = (k) => filas.reduce((s, f) => s + Number(f[k] || 0), 0);
    const cuerpo = filas.map((f) => h('tr', null,
      td(Terna.fechaCorta(f.fecha)), td(Terna.numero(Number(f.usuarios_corridos)), true), td(Terna.numero(Number(f.revisados)), true),
      td(Terna.numero(Number(f.puntuados)), true), td(Terna.numero(Number(f.paquetes)), true), td(Terna.numero(Number(f.enviadas)), true),
      td(Terna.numero(Number(f.a_mano)), true), td(Terna.numero(Number(f.tokens)), true), td(Terna.decimal(Number(f.usd_estimado)), true),
      td(f.tope_alcanzado ? U.alcanzado : U.no)));
    const pie = filas.length ? h('tr', null, td(U.total(dias.uso)), td('', true), td(Terna.numero(suma('revisados')), true), td(Terna.numero(suma('puntuados')), true),
      td(Terna.numero(suma('paquetes')), true), td(Terna.numero(suma('enviadas')), true), td(Terna.numero(suma('a_mano')), true),
      td(Terna.numero(suma('tokens')), true), td(Terna.decimal(suma('usd_estimado')), true), td('')) : null;
    Terna.vaciar(raiz);
    raiz.append(h('div', { class: 'herramientas' }, selectorDias('uso')),
      tabla([[U.fecha], [U.usuarios, true], [U.revisados, true], [U.puntuados, true], [U.paquetes, true], [U.enviadas, true], [U.aMano, true], [U.tokens, true], [U.usd, true], [U.tope]], cuerpo, pie));
  }

  /* ---------- Problemas ---------- */
  async function problemas() {
    const { data, error } = await sb.rpc('admin_problemas', { p_dias: dias.problemas });
    if (error) { Terna.errorDeCarga(raiz, error); return; }
    const Pr = A.problemas;
    const filas = data || [];
    Terna.vaciar(raiz);
    const bVistos = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const r = await sb.rpc('admin_marcar_problemas_vistos');
      if (r.error) { if (!Terna.siSesionVencida(r.error)) Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
      await contarSinVer();
      dibujarSub();
      await problemas();
      Terna.avisoBreve(T.comun.guardado);
    } }, icono('i-tilde'), Pr.marcar);
    raiz.append(h('div', { class: 'herramientas' }, selectorDias('problemas'), filas.some((p) => !p.visto_en) ? bVistos : null));
    if (!filas.length) { raiz.append(h('p', { class: 'vacio', text: Pr.vacio(dias.problemas) })); return; }
    raiz.append(tabla([[Pr.fecha], [Pr.usuario], [Pr.aviso], [Pr.paso], [Pr.error], [Pr.reintentos, true]], filas.map((p) => h('tr', { class: p.visto_en ? null : 'no-visto' },
      td(Terna.fechaCorta(p.creado_en) + ' ' + Terna.hora(p.creado_en)), td(p.usuario_mail),
      td(p.aviso_puesto ? p.aviso_puesto + (p.aviso_empresa ? ' · ' + p.aviso_empresa : '') : p.fuente_id),
      td(A.pasos[p.paso] || p.paso), td(p.error), td(Terna.numero(Number(p.reintentos)), true)))));
  }

  async function cargar() {
    const parar = Terna.cargando(raiz);
    try {
      if (seccion === 'usuarios') await usuarios();
      else if (seccion === 'invitaciones') invitaciones();
      else if (seccion === 'uso') await uso();
      else await problemas();
    } finally { parar(); }
  }

  await contarSinVer();
  dibujarSub();
  await cargar();
}, { admin: true });
