/* Terna · js/ops-admin.js
   Lo que era Admin (admin.html, hasta operacion.md 0.2; brand.md §6.9) dentro de Operación: Cuentas (con Borrar), Uso, Problemas
   por casos (problemas.md 0.1; 0042), Empresas por completar (0032 y 0035), Avisos sin texto (0038 y 0040), Invitaciones abiertas
   y Modelo de IA (0052). Francisco, 20/11/2026: «no quiero tener la página… de admin… quiero ser un usuario más». Desde la 0054 las
   funciones admin_* y la escritura de `config` piden el segundo paso (es_admin con aal2): solo andan con la sesión de ops.html.
   Mismas llamadas, mismos textos (T.admin, de brand.md) y mismos datos que la página de antes; lo que cambia es dónde se dibuja:
   cada parte recibe su contenedor. Los errores de sesión y del segundo paso los resuelve ops.js (api.rpc). */
'use strict';

window.OpsAdmin = function (api) {
  const { h, icono, vaciar } = Terna;
  const A = T.admin;
  let config = null;

  async function leerConfig() {
    const { data, error } = await api.sb.from('config').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    config = data || {};
    return config;
  }
  // La caja se desplaza a lo ancho en pantallas angostas: es enfocable para poder moverla con el teclado.
  const tabla = (nombre, cabeza, filas, pie) => h('div', { class: 'tabla-caja', tabindex: '0', role: 'region', 'aria-label': nombre }, h('table', { class: 'tabla op-tabla' },
    h('thead', null, h('tr', null, cabeza.map(([t, der, solo]) => h('th', { scope: 'col', class: der ? 'der' : null }, solo ? Terna.oculto(t) : t)))),
    h('tbody', null, filas), pie ? h('tfoot', null, pie) : null));
  const td = (texto, der) => h('td', { class: der ? 'der num' : null, text: texto === null || texto === undefined || texto === '' ? '—' : String(texto) });
  const fechaHora = (x) => (x ? Terna.fechaLarga(x) + ' ' + Terna.hora(x) : null);
  const fallo = (error) => { if (!api.esBarrera(error)) Terna.avisoBreve(T.errores.guardar, { error: true }); };

  /* ---------- Cuentas ---------- */
  async function usuarios(cont) {
    const { data, error } = await api.rpc('admin_usuarios');
    if (error) { api.errorEn(cont, error, () => usuarios(cont)); return; }
    const U = A.usuarios;
    const filas = (data || []).map((u) => h('tr', null,
      td(u.mail), td(Terna.fechaLarga(u.alta)), td(fechaHora(u.ultima_entrada)),
      h('td', null, h('span', { class: 'chip', text: A.estados[u.estado] || u.estado })),
      td(Terna.numero(Number(u.avisos_7d)), true), td(Terna.numero(Number(u.paquetes_7d)), true),
      h('td', null, u.rol === 'admin' ? null : h('button', { class: 'btn btn-destructivo-texto btn-chico', type: 'button', onclick: () => borrar(u, cont) }, icono('i-quitar'), U.borrar))));
    vaciar(cont);
    cont.append(tabla(A.secciones.usuarios, [[U.mail], [U.alta], [U.ultima], [U.estado], [U.avisos, true], [U.paquetes, true], [U.borrar, false, true]], filas));
  }
  async function borrar(u, cont) {
    const si = await Terna.confirmar({ titulo: A.borrarTitulo(u.mail), texto: A.borrarTexto, si: A.borrarUsuario, no: T.comun.cancelar, destructivo: true });
    if (!si) return;
    const { error } = await api.rpc('admin_borrar_usuario', { p_usuario: u.usuario_id });
    if (error) { if (!api.esBarrera(error)) Terna.avisoBreve(T.errores.borrarUsuario, { error: true }); return; }
    Terna.avisoBreve(A.borrado);
    await usuarios(cont);
    Terna.devolverFoco(null);
  }

  /* ---------- Uso ---------- */
  async function uso(cont, dias) {
    const { data, error } = await api.rpc('admin_uso_diario', { p_dias: dias });
    if (error) { api.errorEn(cont, error, () => uso(cont, dias)); return; }
    const U = A.uso;
    const filas = data || [];
    const suma = (k) => filas.reduce((s, f) => s + Number(f[k] || 0), 0);
    const cuerpo = filas.map((f) => h('tr', null,
      td(Terna.fechaCorta(f.fecha)), td(Terna.numero(Number(f.usuarios_corridos)), true), td(Terna.numero(Number(f.revisados)), true),
      td(Terna.numero(Number(f.puntuados)), true), td(Terna.numero(Number(f.paquetes)), true), td(Terna.numero(Number(f.enviadas)), true),
      td(Terna.numero(Number(f.a_mano)), true), td(Terna.numero(Number(f.tokens)), true), td(Terna.decimal(Number(f.usd_estimado)), true),
      td(f.tope_alcanzado ? U.alcanzado : U.no)));
    const pie = filas.length ? h('tr', null, td(U.total(dias)), td('', true), td(Terna.numero(suma('revisados')), true), td(Terna.numero(suma('puntuados')), true),
      td(Terna.numero(suma('paquetes')), true), td(Terna.numero(suma('enviadas')), true), td(Terna.numero(suma('a_mano')), true),
      td(Terna.numero(suma('tokens')), true), td(Terna.decimal(suma('usd_estimado')), true), td('')) : null;
    vaciar(cont);
    cont.append(tabla(A.secciones.uso, [[U.fecha], [U.usuarios, true], [U.revisados, true], [U.puntuados, true], [U.paquetes, true], [U.enviadas, true], [U.aMano, true], [U.tokens, true], [U.usd, true], [U.tope]], cuerpo, pie));
  }

  /* ---------- Invitaciones abiertas ---------- */
  async function invitaciones(cont) {
    if (!config) await leerConfig();
    const idT = 'h-inv-abiertas';
    const estadoTexto = h('span', { 'aria-hidden': 'true' });
    const b = h('button', { class: 'interruptor', type: 'button', role: 'switch', 'aria-labelledby': idT }, estadoTexto, h('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }));
    const pintar = () => { const v = !!config.invitaciones_abiertas; b.setAttribute('aria-checked', String(v)); estadoTexto.textContent = v ? T.comun.si : T.comun.no; };
    pintar();
    b.addEventListener('click', async () => {
      const nuevo = !config.invitaciones_abiertas;
      b.setAttribute('aria-disabled', 'true');
      const { error } = await api.escribirConfig({ invitaciones_abiertas: nuevo });
      b.removeAttribute('aria-disabled');
      if (error) { fallo(error); return; }
      config.invitaciones_abiertas = nuevo;
      pintar();
      Terna.avisoBreve(T.comun.guardado);
    });
    cont.append(h('section', { class: 'tarjeta seccion prefs' },
      h('div', { class: 'interruptor-fila' }, h('h2', { id: idT, class: 'tarjeta-titulo', text: A.invitacionesAbiertas }), b),
      h('p', { class: 'campo-ayuda', text: A.invitacionesAyuda })));
  }

  /* ---------- Problemas por casos (problemas.md 0.1 §5; 0042) ---------- */
  const ESTILO_CASO = { nuevo: 'chip-espera', volvio: 'chip-error', para_vos: 'chip-error', en_curso: 'chip-azul', arreglado: 'chip-accion', resuelto: '', esperado: '' };
  const ICONO_CASO = { nuevo: 'i-por-decidir', volvio: 'i-volver', para_vos: 'i-alerta', en_curso: 'i-revisar', arreglado: 'i-probar', resuelto: 'i-tilde', esperado: 'i-tilde' };
  const ABIERTOS = ['nuevo', 'para_vos', 'en_curso', 'arreglado'];
  const ACCIONES_CASO = {
    nuevo: ['arreglado', 'esperado', 'en_curso'],
    para_vos: ['arreglado', 'esperado', 'en_curso'],
    en_curso: ['arreglado', 'esperado', 'nuevo'],
    arreglado: ['resuelto', 'nuevo'],
    resuelto: ['nuevo'],
    esperado: ['nuevo'],
  };
  const estadoVisible = (c) => (c.estado === 'nuevo' && Number(c.volvio) > 0 ? 'volvio' : c.estado);
  let vistaCasos = Terna.leerLocal('ops.problemas.vista', 'abiertos') === 'cerrados' ? 'cerrados' : 'abiertos';

  async function problemas(cont) {
    const [rc, rr] = await Promise.all([api.rpc('admin_problemas_casos', { p_dias: 30 }), api.rpc('admin_ultima_revision')]);
    if (rc.error) { api.errorEn(cont, rc.error, () => problemas(cont)); return; }
    const casos = rc.data || [];
    const Pr = A.problemas;
    const abiertos = casos.filter((c) => ABIERTOS.includes(c.estado));
    const cerrados = casos.filter((c) => !ABIERTOS.includes(c.estado));
    vaciar(cont);
    cont.append(h('p', { class: 'seccion-intro', text: Pr.intro }), lineaRevision(rr.error ? null : (rr.data || [])[0]));
    const seg = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': A.secciones.problemas });
    for (const v of ['abiertos', 'cerrados']) {
      seg.append(h('label', null, h('input', { type: 'radio', name: 'problemas-vista', value: v, checked: vistaCasos === v,
        onchange: () => { vistaCasos = v; Terna.guardarLocal('ops.problemas.vista', v); dibujarLista(); } }),
      h('span', { text: Pr.vistas[v](v === 'abiertos' ? abiertos.length : cerrados.length) })));
    }
    const lista = h('div', { class: 'empresas-lista casos-lista' });
    cont.append(h('div', { class: 'herramientas' }, seg), lista);
    function dibujarLista() {
      vaciar(lista);
      const estos = vistaCasos === 'abiertos' ? abiertos : cerrados;
      if (!estos.length) { lista.append(h('p', { class: 'vacio', text: vistaCasos === 'abiertos' ? Pr.vacioAbiertos : Pr.vacioCerrados })); return; }
      estos.forEach((c, i) => lista.append(tarjetaCaso(c, i, cont)));
    }
    dibujarLista();
  }
  function lineaRevision(r) {
    const Pr = A.problemas;
    if (!r) return h('p', { class: 'campo-ayuda caso-revision', text: Pr.sinRevision });
    const vieja = Date.now() - Date.parse(r.creado_en) > 30 * 3600 * 1000;
    return h('div', { class: 'caso-revision' },
      h('p', { class: 'campo-ayuda', text: Pr.revision(Terna.fechaCorta(r.creado_en), Terna.hora(r.creado_en), r) + (vieja ? ' ' + Pr.revisionVieja : '') }),
      r.resumen ? h('p', { class: 'campo-ayuda caso-texto', text: r.resumen }) : null);
  }
  function tarjetaCaso(c, i, cont) {
    const Pr = A.problemas;
    const id = 'caso-' + i;
    const visible = estadoVisible(c);
    const explicacion = visible === 'arreglado' ? Pr.explicaciones.arreglado(Number(c.confirmar_corridas) || 3) : Pr.explicaciones[visible];
    const chip = h('span', { class: 'chip ' + (ESTILO_CASO[visible] || ''), title: explicacion },
      icono(ICONO_CASO[visible], 'icono-14'), h('span', { text: Pr.estados[visible] }), Terna.oculto(': ' + explicacion));
    const primera = Terna.fechaCorta(c.primera_en);
    const ultima = Terna.fechaCorta(c.ultima_en);
    const fuentes = (c.fuentes || []).join(', ');
    const meta = [A.pasos[c.paso] || c.paso, fuentes || null, Pr.veces(Number(c.ocurrencias)), Pr.cuando(primera, ultima),
      Number(c.usuarios) ? Pr.personas(Number(c.usuarios)) : null, Number(c.volvio) ? Pr.volvioVeces(Number(c.volvio)) : null].filter(Boolean).join(' · ');
    const partes = [
      h('div', { class: 'caso-cabeza' }, chip, h('h2', { class: 'tarjeta-titulo', id: id + '-titulo', tabindex: '-1', text: c.titulo || c.clave })),
      h('p', { class: 'empresa-meta', text: meta }),
    ];
    if (c.estado === 'para_vos' && c.que_hacer) {
      partes.push(h('div', { class: 'caso-que-hacer' }, h('h3', { text: Pr.queHacer }), h('p', { class: 'caso-texto', text: c.que_hacer })));
    }
    if (c.estado === 'arreglado') {
      const faltan = (Number(c.confirmar_corridas) || 3) - (Number(c.corridas_sin_volver) || 0);
      partes.push(h('p', { class: 'campo-ayuda', text: (c.commit_sha ? Pr.arreglo(c.commit_sha.slice(0, 7)) + ' ' : '') + Pr.confirma(faltan) }));
    }
    // El detalle: plegado y armado al abrirlo (las filas se piden recién ahí).
    const cuerpo = h('div', { class: 'caso-detalle', id: id + '-detalle', hidden: true });
    let armado = false;
    const boton = h('button', { class: 'plegable-boton caso-boton', type: 'button', 'aria-expanded': 'false', 'aria-controls': id + '-detalle',
      onclick: () => {
        const abrir = boton.getAttribute('aria-expanded') !== 'true';
        boton.setAttribute('aria-expanded', String(abrir));
        cuerpo.hidden = !abrir;
        if (abrir && !armado) { armado = true; armarDetalle(c, cuerpo, id, cont); }
      } }, h('span', { text: Pr.verDetalle }), icono('i-chevron'));
    partes.push(boton, cuerpo);
    return h('section', { class: 'tarjeta seccion empresa-tarjeta caso-tarjeta', 'aria-labelledby': id + '-titulo', dataset: { caso: c.caso_id, estado: visible } }, partes);
  }
  function armarDetalle(c, cuerpo, id, cont) {
    const Pr = A.problemas;
    if (c.ultimo_error) cuerpo.append(h('h3', { text: Pr.ultimoError }), h('p', { class: 'caso-error', text: c.ultimo_error }));
    if (c.diagnostico) cuerpo.append(h('h3', { text: Pr.diagnostico }), h('p', { class: 'caso-texto', text: c.diagnostico }));
    if (c.estado !== 'para_vos' && c.que_hacer) cuerpo.append(h('h3', { text: Pr.queHacer }), h('p', { class: 'caso-texto', text: c.que_hacer }));
    if (c.commit_sha && c.estado !== 'arreglado') cuerpo.append(h('p', { class: 'campo-ayuda', text: Pr.arreglo(c.commit_sha.slice(0, 7)) }));
    if (c.revisado_por && c.revisado_en) {
      cuerpo.append(h('p', { class: 'campo-ayuda', text: Pr.ultimoCambio(Pr.quien[c.revisado_por] || c.revisado_por, Terna.fechaCorta(c.revisado_en) + ' ' + Terna.hora(c.revisado_en)) }));
    }
    if (c.nota) cuerpo.append(h('h3', { text: Pr.nota }), h('p', { class: 'caso-texto', text: c.nota }));
    const area = h('textarea', { class: 'control', id: id + '-nota', rows: '2', maxlength: '500', 'aria-describedby': id + '-nota-ayuda ' + id + '-nota-error' });
    const error = h('p', { class: 'campo-error', id: id + '-nota-error' });
    area.addEventListener('input', () => { if (error.textContent) { error.textContent = ''; area.removeAttribute('aria-invalid'); } });
    const marcar = (texto) => { error.textContent = texto; area.setAttribute('aria-invalid', 'true'); area.focus(); };
    const cambiar = async (estado, boton) => {
      const nota = area.value.trim();
      if (nota.length > 500) { marcar(Pr.notaLarga); return; }
      if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(nota)) { marcar(Pr.notaConMail); return; }
      boton.disabled = true;
      const { error: err } = await api.rpc('admin_cambiar_caso', { p_caso: c.caso_id, p_estado: estado, p_nota: nota || null });
      boton.disabled = false;
      if (err) {
        if (api.esBarrera(err)) return;
        if (String(err.message || '').includes('nota_invalida')) { marcar(Pr.notaConMail); return; }
        Terna.avisoBreve(T.errores.guardar, { error: true });
        return;
      }
      Terna.avisoBreve(estado === c.estado ? T.comun.guardado : Pr.hechos[estado]);
      await problemas(cont);
      const t = cont.querySelector('[data-caso="' + c.caso_id + '"] h2') || cont.querySelector('.caso-tarjeta h2');
      if (t) t.focus();
    };
    const botones = (ACCIONES_CASO[c.estado] || []).map((estado, k) => {
      const b = h('button', { class: k === 0 ? 'btn btn-primario' : 'btn', type: 'button', onclick: () => cambiar(estado, b) }, Pr.acciones[estado]);
      return b;
    });
    const bNota = h('button', { class: 'btn btn-texto', type: 'button', onclick: () => cambiar(c.estado, bNota) }, Pr.acciones.nota);
    const bCopiar = h('button', { class: 'btn btn-texto', type: 'button', onclick: () => Terna.copiar(textoParaChat(c)) }, icono('i-pegar'), Pr.acciones.copiar);
    cuerpo.append(
      h('div', { class: 'campo' }, h('label', { for: id + '-nota', text: Pr.notaCampo }), area,
        h('p', { class: 'campo-ayuda', id: id + '-nota-ayuda', text: Pr.notaAyuda }), error),
      h('div', { class: 'botones' }, botones, bNota, bCopiar));
    const veces = h('div', { class: 'caso-veces' });
    cuerpo.append(h('h3', { text: Pr.lasVeces }), veces);
    vecesDe(c, veces);
  }
  async function vecesDe(c, cont) {
    const Pr = A.problemas;
    const parar = Terna.cargando(cont);
    const { data, error } = await api.rpc('admin_problemas_de_caso', { p_caso: c.caso_id });
    parar();
    if (error) { api.errorEn(cont, error, () => vecesDe(c, cont)); return; }
    vaciar(cont);
    const filas = data || [];
    if (!filas.length) { cont.append(h('p', { class: 'campo-ayuda', text: Pr.sinFilas })); return; }
    cont.append(h('div', { class: 'tabla-caja', tabindex: '0', role: 'region', 'aria-label': Pr.lasVeces }, h('table', { class: 'tabla' },
      h('thead', null, h('tr', null, [Pr.fecha, Pr.usuario, Pr.aviso, Pr.error, Pr.reintentos].map((t, k) => h('th', { scope: 'col', class: k === 4 ? 'der' : null, text: t })))),
      h('tbody', null, filas.map((p) => h('tr', null,
        td(Terna.fechaCorta(p.creado_en) + ' ' + Terna.hora(p.creado_en)), td(p.usuario_mail),
        td(p.aviso_puesto ? p.aviso_puesto + (p.aviso_empresa ? ' · ' + p.aviso_empresa : '') : p.fuente_id),
        td(p.error), td(Terna.numero(Number(p.reintentos)), true)))))));
  }
  // Lo que se pega en un chat: el caso sin mails ni nombres (problemas.md §6.3).
  function textoParaChat(c) {
    const Pr = A.problemas;
    return Pr.copia({
      id: c.caso_id,
      estado: Pr.estados[estadoVisible(c)],
      paso: A.pasos[c.paso] || c.paso,
      clave: c.clave,
      veces: Number(c.ocurrencias),
      cuando: Pr.cuando(Terna.fechaCorta(c.primera_en), Terna.fechaCorta(c.ultima_en)),
      fuentes: (c.fuentes || []).join(', '),
      personas: Number(c.usuarios) ? Pr.personas(Number(c.usuarios)) : '',
      error: c.ultimo_error,
      diagnostico: c.diagnostico,
      queHacer: c.que_hacer,
      commit: c.commit_sha,
      nota: c.nota,
    });
  }
  // Para la tarjeta de Hoy: cuántos casos esperan a Francisco.
  async function contarCasos() {
    const { data, error } = await api.rpc('admin_problemas_casos', { p_dias: 30 });
    if (error) return null;
    const casos = data || [];
    return { paraVos: casos.filter((c) => c.estado === 'para_vos').length, nuevos: casos.filter((c) => c.estado === 'nuevo').length };
  }

  /* ---------- Empresas por completar (brand.md 0.11 §6.9; datos.md 0.31, 0035) ---------- */
  async function completar(cont, foco) {
    const { data, error } = await api.rpc('admin_empresas_para_completar');
    if (error) { api.errorEn(cont, error, () => completar(cont)); return; }
    const empresas = data || [];
    const E = A.empresas;
    vaciar(cont);
    cont.append(h('p', { class: 'seccion-intro', text: E.intro }), h('p', { class: 'campo-ayuda', text: E.como }));
    if (!empresas.length) { cont.append(h('p', { class: 'vacio', text: E.vacio })); return; }
    const lista = h('div', { class: 'empresas-lista' });
    empresas.forEach((e, i) => lista.append(tarjetaEmpresa(e, i, cont)));
    cont.append(lista);
    const destino = foco !== undefined ? lista.querySelectorAll('.empresa-tarjeta h2')[Math.min(foco, empresas.length - 1)] : null;
    if (destino) destino.focus();
  }
  function tarjetaEmpresa(e, i, cont) {
    const E = A.empresas;
    const id = 'empresa-' + i;
    // El link del aviso de ejemplo sale de avisos.url: solo http y https (Terna.urlExterna; informe de seguridad, H8).
    const avisoUrl = Terna.urlExterna(e.aviso_url);
    const input = h('input', { class: 'control', id: id + '-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false',
      maxlength: '2048', placeholder: 'https://', 'aria-describedby': id + '-ayuda ' + id + '-error' });
    const error = h('p', { class: 'campo-error', id: id + '-error' });
    const marcar = (texto) => { error.textContent = texto; input.setAttribute('aria-invalid', 'true'); input.focus(); };
    input.addEventListener('input', () => { if (error.textContent) { error.textContent = ''; input.removeAttribute('aria-invalid'); } });
    const enviarA = (resultado, url) => api.rpc('admin_completar_empresa', { p_empresa: e.empresa, p_resultado: resultado,
      p_url: url, p_aviso: url ? e.aviso_id : null });
    const enviar = async (resultado, boton) => {
      const url = input.value.trim();
      if (resultado === 'url' && !/^https:\/\/[^\s/$.?#][^\s]*$/i.test(url)) { marcar(E.errorUrl); return; }
      boton.disabled = true;
      let hecho = resultado;
      let { error: err } = await enviarA(resultado, resultado === 'url' ? url : null);
      // 0035: el link de un portal de empleo se guarda igual: la empresa queda en "solo portales" y no vuelve a la lista.
      if (err && resultado === 'url' && String(err.message || '').includes('url_de_portal')) {
        hecho = 'portal';
        ({ error: err } = await enviarA('portal', url));
      }
      boton.disabled = false;
      if (err) {
        if (api.esBarrera(err)) return;
        const msg = String(err.message || '');
        if (msg.includes('url_de_linkedin')) { marcar(E.errorLinkedin); return; }
        if (msg.includes('url_invalida')) { marcar(E.errorUrl); return; }
        Terna.avisoBreve(T.errores.guardar, { error: true });
        return;
      }
      Terna.avisoBreve({ url: E.guardado, portal: E.portalHecho, sin_sitio: E.sinSitioHecho }[hecho] || E.omitida);
      await completar(cont, i);
    };
    // 0035: el aviso de ejemplo ya no está abierto. Lo cierra para todos; si falla, la lista se vuelve a leer igual.
    const cerrar = async (boton) => {
      boton.disabled = true;
      const { error: err } = await api.rpc('admin_cerrar_aviso', { p_aviso: e.aviso_id });
      boton.disabled = false;
      if (err) fallo(err); else Terna.avisoBreve(E.cerrado);
      if (!(err && api.esBarrera(err))) await completar(cont, i);
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
  async function contarCompletar() {
    const { data, error } = await api.rpc('admin_empresas_para_completar');
    return error ? null : (data || []).length;
  }

  /* ---------- Avisos sin texto (brand.md 0.26 §6.9; datos.md 0.34 y 0.36, 0038 y 0040) ---------- */
  async function sinTexto(cont, foco) {
    if (!config) await leerConfig();
    const { data, error } = await api.rpc('admin_avisos_sin_texto');
    if (error) { api.errorEn(cont, error, () => sinTexto(cont)); return; }
    const avisos = data || [];
    const V = A.avisos;
    vaciar(cont);
    cont.append(h('p', { class: 'seccion-intro', text: V.intro }), h('p', { class: 'campo-ayuda', text: V.como }));
    if (!avisos.length) { cont.append(h('p', { class: 'vacio', text: V.vacio })); return; }
    const lista = h('div', { class: 'empresas-lista' });
    avisos.forEach((a, i) => lista.append(tarjetaSinTexto(a, i, cont)));
    cont.append(lista);
    const destino = foco !== undefined ? lista.querySelectorAll('.aviso-sin-texto h2')[Math.min(foco, avisos.length - 1)] : null;
    if (destino) destino.focus();
  }
  function motivoSinTexto(a) {
    const M = A.avisos.motivos;
    if (a.motivo === 'intentos') return M.intentos(Number(a.pagina_intentos) || 0);
    if (a.motivo === 'espera') return M.espera(Math.max(1, Math.floor((Date.now() - Date.parse(a.visto_en)) / 86400000)));
    if (a.motivo === 'sin_lector') return M.sin_lector(a.fuente || '');
    return M[a.motivo] || '';
  }
  function tarjetaSinTexto(a, i, cont) {
    const V = A.avisos;
    const id = 'sin-texto-' + i;
    const max = config.max_texto_pegado_chars || 20000;
    const min = config.min_texto_pegado_chars || 100;
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
    const guardarTexto = async (boton) => {
      const texto = area.value.trim();
      if (!texto) { marcar(T.errores.completa); return; }
      if (texto.length < min) { marcar(T.errores.textoCorto); return; }
      if (texto.length > max) { marcar(T.errores.textoLargo(max)); return; }
      boton.disabled = true;
      const { error: err } = await api.rpc('admin_completar_texto', { p_aviso: a.aviso_id, p_texto: texto });
      boton.disabled = false;
      if (err) {
        if (api.esBarrera(err)) return;
        const msg = String(err.message || '');
        if (msg.includes('texto_corto')) { marcar(T.errores.textoCorto); return; }
        if (msg.includes('texto_largo')) { marcar(T.errores.textoLargo(max)); return; }
        // Mientras tanto Terna lo consiguió, nadie lo tiene ya en su lista o el aviso cerró: se dice y la lista se vuelve a leer.
        const aviso = msg.includes('aviso_con_texto') ? V.errorConTexto : msg.includes('aviso_sin_listas') ? V.errorSinListas
          : msg.includes('aviso_desconocido') ? V.errorCerrado : null;
        if (!aviso) { Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
        Terna.avisoBreve(aviso);
        await sinTexto(cont, i);
        return;
      }
      Terna.avisoBreve(V.guardado);
      await sinTexto(cont, i);
    };
    const cerrar = async (boton) => {
      boton.disabled = true;
      const { error: err } = await api.rpc('admin_cerrar_aviso', { p_aviso: a.aviso_id });
      boton.disabled = false;
      if (err) fallo(err); else Terna.avisoBreve(V.cerrado);
      if (!(err && api.esBarrera(err))) await sinTexto(cont, i);
    };
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button', onclick: () => guardarTexto(bGuardar) }, V.guardar);
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
  async function contarSinTexto() {
    const { data, error } = await api.rpc('admin_avisos_sin_texto');
    return error ? null : (data || []).length;
  }

  /* ---------- Modelo de IA (brand.md 0.38 §6.9; diseno.md 0.44 §9.9; 0052) ---------- */
  // Las opciones de cada ítem, en el orden en que se muestran. Los modelos locales son los de terna-motor datos/ia_local.json.
  const COLUMNAS_IA = ['ia_armar', 'ia_responder', 'ia_alcance', 'modelo_local'];
  const OPCIONES_IA = { ia_armar: ['nube', 'local'], ia_responder: ['nube', 'local'], ia_alcance: ['admin', 'todos'], modelo_local: ['qwen3.6-35b-a3b', 'qwen3.5-9b'] };
  async function ia(cont) {
    if (!config) await leerConfig();
    // Sin la 0052 la fila no trae las cuatro columnas: la sección no se dibuja.
    if (!COLUMNAS_IA.every((c) => c in config)) return false;
    const I = A.ia;
    const tarjeta = h('section', { class: 'tarjeta seccion prefs' });
    for (const col of COLUMNAS_IA) {
      const idT = 'h-ia-' + col;
      const idA = idT + '-ayuda';
      const seg = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-labelledby': idT, 'aria-describedby': idA });
      const opciones = OPCIONES_IA[col].includes(config[col]) ? OPCIONES_IA[col] : OPCIONES_IA[col].concat([config[col]]);
      for (const v of opciones) {
        seg.append(h('label', null, h('input', { type: 'radio', name: 'ia-' + col, value: v, checked: config[col] === v,
          onchange: () => guardarIa(col, v, seg) }), h('span', { text: I.opciones[v] || v })));
      }
      tarjeta.append(h('div', { class: 'campo' }, h('h2', { id: idT, class: 'tarjeta-titulo', text: I.items[col].titulo }),
        h('p', { class: 'campo-ayuda', id: idA, text: I.items[col].ayuda }), seg));
    }
    tarjeta.append(h('p', { class: 'campo-ayuda', text: I.pie }));
    cont.append(h('h2', { class: 'op-subtitulo', id: 'op-ia', text: A.secciones.ia }), h('p', { class: 'seccion-intro', text: I.intro }), tarjeta);
    return true;
  }
  async function guardarIa(col, valor, seg) {
    const antes = config[col];
    for (const r of seg.querySelectorAll('input')) r.disabled = true;
    const { error } = await api.escribirConfig({ [col]: valor });
    for (const r of seg.querySelectorAll('input')) r.disabled = false;
    if (error) {
      for (const r of seg.querySelectorAll('input')) r.checked = r.value === antes;
      fallo(error);
      return;
    }
    config[col] = valor;
    Terna.avisoBreve(T.comun.guardado);
  }

  return { usuarios, uso, invitaciones, problemas, contarCasos, completar, contarCompletar, sinTexto, contarSinTexto, ia, leerConfig };
};
