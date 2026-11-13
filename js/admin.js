/* Terna · js/admin.js
   Admin (brand.md §6.9), solo Francisco: Usuarios (con Borrar), Invitaciones (abrir o cerrar), Uso, Problemas y, desde
   brand.md 0.11, Empresas: las que ni el motor ni la búsqueda web diaria ubicaron, para que pegue dónde se postula (datos.md 0.28,
   0032; desde 0.31, 0035, también un portal y "Ya no está abierto") y, desde brand.md 0.23, Avisos sin texto: los de alertas que
   Terna intentó leer tres veces sin conseguir el texto, para que pegue el texto (datos.md 0.34 y 0.36, 0038 y 0040). La pausa del
   motor no está acá. Lee y escribe solo por las funciones admin_* y config.invitaciones_abiertas (datos.md §14).
   Pensada primero para escritorio: en celular las tablas se desplazan. */
'use strict';

Terna.pagina('admin', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const A = T.admin;
  const raiz = document.getElementById('admin');
  const sub = document.getElementById('subpestanas');
  const SECCIONES = ['usuarios', 'invitaciones', 'uso', 'problemas', 'empresas', 'avisos'];
  let seccion = SECCIONES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'uso';
  const dias = { uso: Terna.leerLocal('admin.uso', 7) === 30 ? 30 : 7, problemas: Terna.leerLocal('admin.problemas', 7) === 30 ? 30 : 7 };
  let sinVer = 0;
  // Empresas (0032) y Avisos sin texto (0038): sin la migración la función no existe y la subpestaña no se muestra.
  let empresas = null;
  let sinTexto = null;

  async function contarSinVer() {
    const { data } = await sb.rpc('admin_problemas', { p_dias: 30 });
    sinVer = (data || []).filter((p) => !p.visto_en).length;
  }
  async function leerEmpresas() {
    const { data, error } = await sb.rpc('admin_empresas_para_completar');
    empresas = error ? null : (data || []);
    return error;
  }
  async function leerSinTexto() {
    const { data, error } = await sb.rpc('admin_avisos_sin_texto');
    sinTexto = error ? null : (data || []);
    return error;
  }
  function chipDe(s) {
    if (s === 'problemas' && sinVer) return A.sinVer(sinVer);
    if (s === 'empresas' && empresas && empresas.length) return A.empresas.porCompletar(empresas.length);
    if (s === 'avisos' && sinTexto && sinTexto.length) return A.avisos.porCompletar(sinTexto.length);
    return null;
  }
  function dibujarSub() {
    Terna.vaciar(sub);
    for (const s of SECCIONES) {
      if (s === 'empresas' && empresas === null) continue;
      if (s === 'avisos' && sinTexto === null) continue;
      const chip = chipDe(s);
      sub.append(h('a', { href: '#' + s, 'aria-current': s === seccion ? 'true' : null, onclick: (e) => { e.preventDefault(); ir(s); } },
        A.secciones[s], chip ? h('span', { class: 'chip chip-espera', text: chip }) : null));
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
    const pintar = () => { const v = !!ctx.config.invitaciones_abiertas; b.setAttribute('aria-checked', String(v)); estado.textContent = v ? T.comun.si : T.comun.no; };
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

  /* ---------- Empresas (brand.md 0.11 §6.9; diseno.md 0.24 §9.6; desde brand.md 0.15 y diseno.md 0.28, datos.md 0.31, 0035) ----------
     Una tarjeta por empresa: cuántos avisos abiertos tiene, qué dijo la búsqueda web, un aviso de ejemplo para abrirlo con la
     cuenta de Francisco y tocar "Postularse", y el link donde se postula. La base valida (https; un portal de empleo se anota como
     portal) y el motor lo verifica en la corrida siguiente antes de usarlo. La lista ya viene sin los avisos Easy Apply ni los de
     LinkedIn por leer; "Ya no está abierto" cierra el aviso de ejemplo. */
  async function empresasSeccion(foco) {
    const error = await leerEmpresas();
    dibujarSub();
    if (error) { Terna.errorDeCarga(raiz, error); return; }
    const E = A.empresas;
    Terna.vaciar(raiz);
    raiz.append(h('p', { class: 'seccion-intro', text: E.intro }), h('p', { class: 'campo-ayuda', text: E.como }));
    if (!empresas.length) { raiz.append(h('p', { class: 'vacio', text: E.vacio })); return; }
    const lista = h('div', { class: 'empresas-lista' });
    empresas.forEach((e, i) => lista.append(tarjetaEmpresa(e, i)));
    raiz.append(lista);
    const destino = foco !== undefined ? lista.querySelectorAll('.empresa-tarjeta h2')[Math.min(foco, empresas.length - 1)] : null;
    if (destino) destino.focus();
  }
  function tarjetaEmpresa(e, i) {
    const E = A.empresas;
    const id = 'empresa-' + i;
    // El link del aviso de ejemplo sale de avisos.url: solo http y https (Terna.urlExterna; informe de seguridad, H8).
    const avisoUrl = Terna.urlExterna(e.aviso_url);
    const input = h('input', { class: 'control', id: id + '-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false',
      maxlength: '2048', placeholder: 'https://', 'aria-describedby': id + '-ayuda ' + id + '-error' });
    const error = h('p', { class: 'campo-error', id: id + '-error' });
    const marcar = (texto) => { error.textContent = texto; input.setAttribute('aria-invalid', 'true'); input.focus(); };
    input.addEventListener('input', () => { if (error.textContent) { error.textContent = ''; input.removeAttribute('aria-invalid'); } });
    const completar = (resultado, url) => sb.rpc('admin_completar_empresa', { p_empresa: e.empresa, p_resultado: resultado,
      p_url: url, p_aviso: url ? e.aviso_id : null });
    const enviar = async (resultado, boton) => {
      const url = input.value.trim();
      if (resultado === 'url' && !/^https:\/\/[^\s/$.?#][^\s]*$/i.test(url)) { marcar(E.errorUrl); return; }
      boton.disabled = true;
      let hecho = resultado;
      let { error: err } = await completar(resultado, resultado === 'url' ? url : null);
      // 0035: el link de un portal de empleo se guarda igual: la empresa queda en "solo portales" y no vuelve a la lista. La base
      // decide qué es un portal (es_portal_de_empleo) y rechaza uno de LinkedIn, que casi siempre es el del aviso mismo.
      if (err && resultado === 'url' && String(err.message || '').includes('url_de_portal')) {
        hecho = 'portal';
        ({ error: err } = await completar('portal', url));
      }
      boton.disabled = false;
      if (err) {
        if (Terna.siSesionVencida(err)) return;
        const msg = String(err.message || '');
        if (msg.includes('url_de_linkedin')) { marcar(E.errorLinkedin); return; }
        if (msg.includes('url_invalida')) { marcar(E.errorUrl); return; }
        Terna.avisoBreve(T.errores.guardar, { error: true });
        return;
      }
      Terna.avisoBreve({ url: E.guardado, portal: E.portalHecho, sin_sitio: E.sinSitioHecho }[hecho] || E.omitida);
      await empresasSeccion(i);
    };
    // 0035: el aviso de ejemplo ya no está abierto. Lo cierra para todos, como el motor cuando la página de LinkedIn lo dice; si
    // falla (el motor lo cerró mientras tanto), la lista se vuelve a leer igual.
    const cerrar = async (boton) => {
      boton.disabled = true;
      const { error: err } = await sb.rpc('admin_cerrar_aviso', { p_aviso: e.aviso_id });
      boton.disabled = false;
      if (err) {
        if (Terna.siSesionVencida(err)) return;
        Terna.avisoBreve(T.errores.guardar, { error: true });
      } else {
        Terna.avisoBreve(E.cerrado);
      }
      await empresasSeccion(i);
    };
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button', onclick: () => enviar('url', bGuardar) }, E.guardar);
    const bSinSitio = h('button', { class: 'btn', type: 'button', onclick: () => enviar('sin_sitio', bSinSitio) }, E.sinSitio);
    const bCerrar = h('button', { class: 'btn', type: 'button', 'aria-label': E.cerrarAccesible(e.puesto || ''), onclick: () => cerrar(bCerrar) }, E.cerrar);
    const bOmitir = h('button', { class: 'btn btn-texto', type: 'button', onclick: () => enviar('omitir', bOmitir) }, E.omitir);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); enviar('url', bGuardar); } });
    const titulo = h('h2', { class: 'tarjeta-titulo', id: id + '-titulo', tabindex: '-1', text: e.nombre || e.empresa });
    return h('section', { class: 'tarjeta seccion empresa-tarjeta', 'aria-labelledby': id + '-titulo' },
      titulo,
      h('p', { class: 'empresa-meta' }, h('span', { text: E.avisos(Number(e.avisos_abiertos) || 0) }), h('span', { 'aria-hidden': 'true', text: ' · ' }),
        h('span', { text: E.estados[e.estado] || '' })),
      e.nota ? h('p', { class: 'campo-ayuda', text: e.nota }) : null,
      h('p', { class: 'empresa-ejemplo' }, h('span', { text: E.ejemplo(e.puesto || '') + ' ' }),
        avisoUrl ? h('a', { href: avisoUrl, target: '_blank', rel: 'noopener noreferrer', 'aria-label': E.abrirAccesible(e.fuente || 'LinkedIn') },
          E.abrir(e.fuente || 'LinkedIn'), icono('i-abrir', 'icono-16')) : null),
      e.linkedin_postulacion === 'externa' ? h('p', { class: 'campo-ayuda', text: E.lleva }) : null,
      h('div', { class: 'campo' }, h('label', { for: id + '-link', text: E.link }), input, h('p', { class: 'campo-ayuda', id: id + '-ayuda', text: E.linkAyuda }), error),
      h('div', { class: 'botones' }, bGuardar, bSinSitio, bCerrar, bOmitir));
  }

  /* ---------- Avisos sin texto (brand.md 0.26 §6.9; diseno.md 0.38 §9.7; datos.md 0.34 y 0.36, 0038 y 0040) ----------
     Francisco, 12/11/2026: si Terna no consigue el texto de un aviso, "Fran lo va a sacar por vos"; desde 0040 (22:12), solo cuando
     Terna intentó leer su página tres veces y no pudo (hasta 0040 también la página que no existía, los días de espera, la lectura
     apagada y otro portal: con una base sin 0040 se siguen viendo). Una tarjeta por aviso de alerta que alguien tiene en su lista:
     lo público del aviso, por qué Terna no lo consiguió, el link para abrirlo
     y el texto, que va al match de quien lo tiene (nunca se ve de quién es). Terna lo puntúa en la corrida siguiente, primero, como
     lo que pegaba la persona hasta brand.md 0.22. "Ya no está abierto" lo cierra, como en Empresas. */
  async function avisosSeccion(foco) {
    const error = await leerSinTexto();
    dibujarSub();
    if (error) { Terna.errorDeCarga(raiz, error); return; }
    const V = A.avisos;
    Terna.vaciar(raiz);
    raiz.append(h('p', { class: 'seccion-intro', text: V.intro }), h('p', { class: 'campo-ayuda', text: V.como }));
    if (!sinTexto.length) { raiz.append(h('p', { class: 'vacio', text: V.vacio })); return; }
    const lista = h('div', { class: 'empresas-lista' });
    sinTexto.forEach((a, i) => lista.append(tarjetaSinTexto(a, i)));
    raiz.append(lista);
    const destino = foco !== undefined ? lista.querySelectorAll('.aviso-sin-texto h2')[Math.min(foco, sinTexto.length - 1)] : null;
    if (destino) destino.focus();
  }
  function motivoSinTexto(a) {
    const M = A.avisos.motivos;
    if (a.motivo === 'intentos') return M.intentos(Number(a.pagina_intentos) || 0);
    if (a.motivo === 'espera') return M.espera(Math.max(1, Math.floor((Date.now() - Date.parse(a.visto_en)) / 86400000)));
    if (a.motivo === 'sin_lector') return M.sin_lector(a.fuente || '');
    return M[a.motivo] || '';
  }
  function tarjetaSinTexto(a, i) {
    const V = A.avisos;
    const id = 'sin-texto-' + i;
    const max = ctx.config.max_texto_pegado_chars || 20000;
    const min = ctx.config.min_texto_pegado_chars || 100;
    // El link sale de avisos.url: solo http y https (Terna.urlExterna; informe de seguridad, H8).
    const avisoUrl = Terna.urlExterna(a.url);
    const area = h('textarea', { class: 'control', id: id + '-texto', rows: '8', spellcheck: 'false', 'aria-describedby': id + '-ayuda ' + id + '-cont ' + id + '-error' });
    const contador = h('p', { class: 'campo-ayuda num', id: id + '-cont', text: V.contador(0, max) });
    const error = h('p', { class: 'campo-error', id: id + '-error', role: 'alert' });
    const marcar = (texto) => { error.textContent = texto; area.setAttribute('aria-invalid', 'true'); area.focus(); };
    area.addEventListener('input', () => {
      contador.textContent = V.contador(area.value.length, max);
      if (error.textContent) { error.textContent = ''; area.removeAttribute('aria-invalid'); }
    });
    const guardar = async (boton) => {
      const texto = area.value.trim();
      if (!texto) { marcar(T.errores.completa); return; }
      if (texto.length < min) { marcar(T.errores.textoCorto); return; }
      if (texto.length > max) { marcar(T.errores.textoLargo(max)); return; }
      boton.disabled = true;
      const { error: err } = await sb.rpc('admin_completar_texto', { p_aviso: a.aviso_id, p_texto: texto });
      boton.disabled = false;
      if (err) {
        if (Terna.siSesionVencida(err)) return;
        const msg = String(err.message || '');
        if (msg.includes('texto_corto')) { marcar(T.errores.textoCorto); return; }
        if (msg.includes('texto_largo')) { marcar(T.errores.textoLargo(max)); return; }
        // Mientras tanto Terna lo consiguió, nadie lo tiene ya en su lista o el aviso cerró: se dice y la lista se vuelve a leer.
        const aviso = msg.includes('aviso_con_texto') ? V.errorConTexto : msg.includes('aviso_sin_listas') ? V.errorSinListas
          : msg.includes('aviso_desconocido') ? V.errorCerrado : null;
        if (!aviso) { Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
        Terna.avisoBreve(aviso);
        await avisosSeccion(i);
        return;
      }
      Terna.avisoBreve(V.guardado);
      await avisosSeccion(i);
    };
    const cerrar = async (boton) => {
      boton.disabled = true;
      const { error: err } = await sb.rpc('admin_cerrar_aviso', { p_aviso: a.aviso_id });
      boton.disabled = false;
      if (err) {
        if (Terna.siSesionVencida(err)) return;
        Terna.avisoBreve(T.errores.guardar, { error: true });
      } else {
        Terna.avisoBreve(V.cerrado);
      }
      await avisosSeccion(i);
    };
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button', onclick: () => guardar(bGuardar) }, V.guardar);
    const bCerrar = h('button', { class: 'btn', type: 'button', 'aria-label': V.cerrarAccesible(a.puesto || ''), onclick: () => cerrar(bCerrar) }, V.cerrar);
    const meta = [a.empresa, a.ubicacion, a.fuente ? V.alerta(a.fuente) : null].filter(Boolean).join(' · ');
    return h('section', { class: 'tarjeta seccion empresa-tarjeta aviso-sin-texto', 'aria-labelledby': id + '-titulo', dataset: { aviso: a.aviso_id } },
      h('h2', { class: 'tarjeta-titulo', id: id + '-titulo', tabindex: '-1', text: a.puesto || '' }),
      meta ? h('p', { class: 'empresa-meta', text: meta }) : null,
      h('p', { class: 'empresa-ejemplo' }, h('span', { text: motivoSinTexto(a) + ' ' }),
        avisoUrl ? h('a', { href: avisoUrl, target: '_blank', rel: 'noopener noreferrer', 'aria-label': V.abrirAccesible(a.fuente || 'LinkedIn') },
          V.abrir(a.fuente || 'LinkedIn'), icono('i-abrir', 'icono-16')) : null),
      a.sale_el ? h('p', { class: 'campo-ayuda', text: V.sale(Terna.fechaCorta(a.sale_el)) }) : null,
      h('div', { class: 'campo' }, h('label', { for: id + '-texto', text: V.texto }), area,
        h('p', { class: 'campo-ayuda', id: id + '-ayuda', text: V.textoAyuda }), contador, error),
      h('div', { class: 'botones' }, bGuardar, bCerrar));
  }

  async function cargar() {
    const parar = Terna.cargando(raiz);
    try {
      if (seccion === 'usuarios') await usuarios();
      else if (seccion === 'invitaciones') invitaciones();
      else if (seccion === 'uso') await uso();
      else if (seccion === 'empresas') await empresasSeccion();
      else if (seccion === 'avisos') await avisosSeccion();
      else await problemas();
    } finally { parar(); }
  }

  await Promise.all([contarSinVer(), leerEmpresas(), leerSinTexto()]);
  if ((seccion === 'empresas' && empresas === null) || (seccion === 'avisos' && sinTexto === null)) seccion = 'uso';
  dibujarSub();
  await cargar();
}, { admin: true });
