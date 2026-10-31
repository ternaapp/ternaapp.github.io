/* Terna · js/postulaciones.js
   Postulaciones (diseno.md §8): todo lo que tiene paquete, por etapa; el recorrido; la ficha con la traba, la captura,
   el paquete y lo que Terna respondió; y los botones de cada etapa (brand.md §6.5).
   Escribe con un upsert de { match_id, usuario_id, estado } (el disparador valida la transición) y marcar_interes.
   Deshacer: la base no deja volver de postulado a a mano ni de en cola a para revisar o a mano (datos.md §5.13), así
   que las cuatro acciones con "Deshacer" se escriben cuando el aviso breve se va (6 s); si la página se cierra antes,
   se mandan igual con fetch keepalive. */
'use strict';

Terna.pagina('postulaciones', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const lista = document.getElementById('lista');
  const cajaFiltros = document.getElementById('filtros');
  const cuenta = document.getElementById('cuenta');
  const etapasCelular = document.getElementById('etapas-celular');
  const carril = document.getElementById('carril');
  const COLUMNAS = 'match_id, aviso_id, puesto, empresa, ubicacion, pais, modalidad, alcance, url, url_postulacion, fuente, postulacion, dudoso, publicado_en, visto_en, tiene_texto, texto_origen, match, razones, requisitos_faltantes, interes, estado_paquete, pedido_en, creado_en, nuevo, paquete_id, paquete_idioma, armado_en, cv_path, carta_path, salario_monto, salario_moneda, salario_periodo, salario_motivo, notas, estado_postulacion, motivo_a_mano, traba_detalle, intentos, en_cola_en, enviada_en, postulado_en, entrevista_en, respuestas, captura_path, captura_en, confirmacion_texto, nivel, jornada';

  const parar = Terna.cargando(lista);
  const [rA, rP, rB] = await Promise.all([
    sb.from('mis_avisos').select(COLUMNAS).or('paquete_id.not.is.null,estado_postulacion.neq.pendiente').neq('interes', 'no_me_interesa'),
    sb.from('preferencias').select('umbral, salario_modo, modalidades, alcance, niveles, jornadas').eq('usuario_id', uid).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo'),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rB.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  let postulaciones = rA.data || [];
  const porId = new Map(postulaciones.map((a) => [a.match_id, a]));
  const prefs = rP.data || { umbral: 70, salario_modo: 'sugerir' };
  const umbral = prefs.umbral;
  const piso = config.piso_match || 50;
  const conMinimo = new Set((rB.data || []).filter((p) => p.bajo_minimo === true).map((p) => p.match_id));
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);
  const maxIntentos = config.max_reintentos_postulacion || 3;
  // Lo que quedó fuera de las preferencias de búsqueda del momento no se esconde acá (es lo que la persona ya tiene), pero
  // la ficha lo dice: Terna no lo postula por su cuenta (diseno.md 0.11 §8.5; pipeline.md 0.3.15 §4.12).
  const busquedaPrefs = Aviso.busquedaDe(prefs);

  /* ---------- Etapas (§8.2) ---------- */
  const ETAPAS = ['todas', 'a_mano', 'para_revisar', 'en_cola', 'enviada', 'postulado', 'entrevista'];
  const URGENCIA = { a_mano: 0, para_revisar: 1, en_cola: 2, enviada: 3, postulado: 4, entrevista: 5, pendiente: 6 };
  const HASH = { a_mano: 'a-mano', para_revisar: 'para-revisar', en_cola: 'en-cola', enviada: 'enviadas', postulado: 'postuladas', entrevista: 'entrevistas', todas: 'todas' };
  const DE_HASH = Object.fromEntries(Object.entries(HASH).map(([k, v]) => [v, k]));
  const PUNTO = { a_mano: 'punto-mano', para_revisar: 'punto-espera', en_cola: 'punto-espera', enviada: 'punto-azul', postulado: 'punto-azul', entrevista: 'punto-entrevista', todas: '' };
  let etapa = 'todas';
  const fechaEtapa = (a) => ({ enviada: a.enviada_en, postulado: a.postulado_en, entrevista: a.entrevista_en, en_cola: a.en_cola_en, a_mano: a.captura_en || a.armado_en || a.creado_en })[a.estado_postulacion] || a.armado_en || a.creado_en;

  /* ---------- Filtros (diseno.md 0.13 §8.1): la barra de Avisos, sin Interés ni Postulación ----------
     Un botón por filtro con su valor, siempre a la vista; cada uno abre su hoja (celular) o su panel (escritorio) y se
     aplica al tocar. Interés no va (acá todo interesa) y Postulación tampoco: las etapas ya son ese filtro. Arrancan en
     todo, no en las preferencias: acá está lo que la persona ya tiene, y lo que quedó fuera de sus preferencias no se
     esconde (diseno.md 0.11 §8.5). Lo cambiado se marca como en Avisos y se recuerda en el navegador. */
  const PAQUETES = ['todos', 'armado', 'sin_armar', 'pedido', 'no_se_pudo_armar', 'sin_texto', 'por_puntuar'];
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const CLAVES = ['modalidad', 'alcance', 'nivel', 'jornada', 'match', 'paquete'];
  const TODOS = Aviso.TODOS_BUSQUEDA;
  const inicial = () => ({ modalidad: null, alcance: null, nivel: null, jornada: null, matchMin: piso, paquete: 'todos' });
  const mismos = (x, y) => x.length === y.length && x.every((v) => y.includes(v));
  // Una lista que deja pasar todo se guarda como null ("todas"); una vacía o rara, también.
  const deLista = (v, todos) => { if (!Array.isArray(v)) return null; const l = todos.filter((x) => v.includes(x)); return l.length && l.length < todos.length ? l : null; };
  function validos(f) {
    const r = inicial();
    if (!f || typeof f !== 'object') return r;
    // Los filtros guardados antes de la barra traían Postulación (ahora son las etapas) y [] para "todas": se leen igual.
    for (const k of BUSQUEDA) r[k] = deLista(f[k], TODOS[k]);
    if (PAQUETES.includes(f.paquete)) r.paquete = f.paquete;
    if (Number.isInteger(f.matchMin)) r.matchMin = Math.max(piso, Math.min(100, f.matchMin));
    return r;
  }
  let filtros = validos(Terna.leerLocal('postulaciones.filtros', null));
  const guardarFiltros = () => Terna.guardarLocal('postulaciones.filtros', Object.assign({ v: 2 }, filtros));
  const efectiva = (k) => filtros[k] || TODOS[k];
  function pasaFiltros(a) {
    if (filtros.paquete !== 'todos' && Aviso.estadoPaquete(a) !== filtros.paquete) return false;
    if (!Aviso.pasaBusqueda(a, { modalidad: efectiva('modalidad'), alcance: efectiva('alcance'), nivel: efectiva('nivel'), jornada: efectiva('jornada') })) return false;
    if (a.match !== null && a.match !== undefined && a.match < filtros.matchMin) return false;
    return true;
  }
  function cambiado(k) {
    if (BUSQUEDA.includes(k)) return filtros[k] !== null;
    if (k === 'match') return filtros.matchMin !== piso;
    return filtros.paquete !== 'todos';
  }
  const algoCambiado = () => CLAVES.some(cambiado);
  function nombreDe(k, v) {
    if (k === 'nivel') return T.preferencias.nivel[v];
    if (k === 'jornada') return T.preferencias.jornada[v];
    return T.avisos[k][v];
  }
  // Los mismos resúmenes que Avisos: "Remoto", "Remoto y Híbrido", "sin Pasantía", "3 de 6", "Todas".
  function resumen(k) {
    const F = T.avisos.filtros;
    if (k === 'match') return filtros.matchMin === piso ? F.todos : F.matchResumen(filtros.matchMin);
    if (k === 'paquete') return filtros.paquete === 'todos' ? F.todos : T.avisos.paquete[filtros.paquete];
    const l = efectiva(k);
    const todos = TODOS[k];
    if (l.length === todos.length) return F.todosDe[k];
    if (l.length === 1) return nombreDe(k, l[0]);
    if (l.length === 2) return F.yY(nombreDe(k, l[0]), nombreDe(k, l[1]));
    if (todos.length > 3 && l.length === todos.length - 1) return F.sin(nombreDe(k, todos.find((x) => !l.includes(x))));
    return F.nDe(l.length, todos.length);
  }
  function limpiarFiltros() { filtros = inicial(); guardarFiltros(); dibujar(); }
  const filtradas = () => postulaciones.filter(pasaFiltros);
  function enEtapa(lista, e) { return e === 'todas' ? lista : lista.filter((a) => a.estado_postulacion === e); }
  // diseno.md 0.3.1 §8: por match de mayor a menor (sin match, al final); a igual match, por urgencia y las más nuevas primero.
  const matchDe = (a) => (a.match === null || a.match === undefined ? -1 : Number(a.match));
  function ordenar(lista) {
    return lista.slice().sort((a, b) => (matchDe(b) - matchDe(a))
      || (URGENCIA[a.estado_postulacion] - URGENCIA[b.estado_postulacion])
      || String(fechaEtapa(b) || '').localeCompare(String(fechaEtapa(a) || '')));
  }

  /* ---------- Dibujo ---------- */
  function dibujar() { dibujarEtapas(); actualizarBarra(); dibujarLista(); }
  function dibujarEtapas() {
    const base = filtradas();
    const cantidad = (e) => enEtapa(base, e).length;
    Terna.vaciar(etapasCelular);
    const grupo = h('div', { class: 'pildoras', role: 'radiogroup', 'aria-label': T.postulaciones.etapa });
    const orden = ['todas', 'a_mano', 'para_revisar', 'en_cola', 'enviada', 'postulado', 'entrevista'];
    for (const e of orden) {
      const input = h('input', { type: 'radio', name: 'etapa', value: e, checked: etapa === e, onchange: () => cambiarEtapa(e) });
      grupo.append(h('label', { class: 'pildora' }, input, h('span', null, h('b', { class: 'num', text: String(cantidad(e)) }), ' ', T.postulaciones.etapas[e])));
    }
    etapasCelular.append(h('div', { class: 'pildoras-caja' }, grupo));
    Terna.vaciar(carril);
    for (const e of orden) {
      carril.append(h('a', { href: '#' + HASH[e], 'aria-current': etapa === e ? 'true' : null, onclick: (ev) => { ev.preventDefault(); cambiarEtapa(e); } },
        h('span', { class: 'punto ' + (PUNTO[e] || ''), 'aria-hidden': 'true' }), h('span', { text: T.postulaciones.etapas[e] }), h('span', { class: 'n', text: String(cantidad(e)) })));
    }
    carril.append(h('p', { class: 'carril-pie' }, T.inicio.umbralActual(umbral), ' ', h('a', { href: 'preferencias.html', text: T.comun.pestanas.preferencias })));
  }
  function cambiarEtapa(e) {
    etapa = e;
    if (!Terna.hojaAbierta()) history.replaceState(null, '', '#' + HASH[e]);
    dibujarEtapas();
    dibujarLista();
  }
  // La barra se arma una sola vez y se actualiza en el lugar: así el foco vuelve al mismo botón al cerrar su filtro.
  const botones = {};
  const estadoFiltros = h('div', { class: 'filtros-estado', hidden: true });
  function armarBarra() {
    const F = T.avisos.filtros;
    const barra = h('div', { class: 'filtros-barra', role: 'group', 'aria-label': F.barra });
    for (const k of CLAVES) {
      const b = h('button', { class: 'filtro-boton', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', dataset: { filtro: k } },
        h('span', { class: 'filtro-nombre', text: F.nombres[k] + ':' }), ' ', h('span', { class: 'filtro-valor' }),
        h('span', { class: 'oculto-visual filtro-cambiado' }), icono('i-chevron', 'icono-16'));
      b.addEventListener('click', () => abrirFiltro(k, b));
      botones[k] = b;
      barra.append(b);
    }
    estadoFiltros.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => { limpiarFiltros(); botones[CLAVES[0]].focus(); } },
      icono('i-deshacer', 'icono-16'), F.limpiarFiltros));
    cajaFiltros.append(h('div', { class: 'filtros-caja' }, barra), estadoFiltros);
  }
  function actualizarBarra() {
    const F = T.avisos.filtros;
    for (const k of CLAVES) {
      const b = botones[k];
      b.querySelector('.filtro-valor').textContent = resumen(k);
      b.querySelector('.filtro-cambiado').textContent = cambiado(k) ? F.cambiadoAccesible : '';
      b.classList.toggle('cambiado', cambiado(k));
    }
    const enfocado = estadoFiltros.contains(document.activeElement);
    estadoFiltros.hidden = !algoCambiado();
    if (enfocado && estadoFiltros.hidden) botones[CLAVES[0]].focus();
  }
  function dibujarLista() {
    Terna.vaciar(lista);
    const vis = ordenar(enEtapa(filtradas(), etapa));
    cuenta.textContent = postulaciones.length ? T.postulaciones.cuenta(vis.length) : '';
    if (!postulaciones.length) { lista.append(h('p', { class: 'vacio', text: T.postulaciones.vacio })); return; }
    if (!vis.length) {
      if (etapa !== 'todas' && enEtapa(postulaciones, etapa).length === 0) { lista.append(h('p', { class: 'vacio', text: T.postulaciones.vacioEtapa[etapa] })); return; }
      lista.append(h('div', { class: 'vacio' }, h('p', { text: T.postulaciones.vacioFiltros }),
        h('button', { class: 'btn', type: 'button', onclick: () => { limpiarFiltros(); botones[CLAVES[0]].focus(); } }, T.avisos.filtros.limpiarFiltros)));
      return;
    }
    if (Terna.anchoEscritorio.matches) lista.append(tabla(vis));
    else lista.append(h('ul', { class: 'lista-postulaciones', role: 'list' }, vis.map((a) => h('li', null, filaCelular(a)))));
    marcarElegida();
  }
  function etiquetaEtapa(a) {
    if (a.estado_postulacion === 'pendiente') return T.avisos.postulacion.pendiente;
    return T.avisos.postulacion[a.estado_postulacion];
  }
  // La etapa en palabras para la fila: el nombre y la fecha; la traba de "a mano" va abajo.
  function lineaCorta(a) {
    const e = a.estado_postulacion;
    const f = { enviada: a.enviada_en, postulado: a.postulado_en, entrevista: a.entrevista_en }[e];
    if (e === 'pendiente') return T.postulaciones.linea.pendiente;
    return etiquetaEtapa(a) + (f ? ', ' + Terna.relativa(f) : '');
  }
  function filaCelular(a) {
    const boton = h('button', { class: 'fila-postulacion', type: 'button', dataset: { match: a.match_id, control: 'abrir' }, onclick: () => abrirFicha(a, boton) },
      Aviso.bloqueMatch(a, umbral, false, true),
      h('span', { class: 'fila-postulacion-datos' },
        h('span', { class: 'aviso-puesto', text: a.puesto }),
        h('span', { class: 'atributos' }, a.empresa ? [h('span', { text: a.empresa }), h('span', { 'aria-hidden': 'true', text: '·' }), oculto(', ')] : null,
          h('span', { text: Aviso.lugar(a) }), a.modalidad ? [h('span', { 'aria-hidden': 'true', text: '·' }), oculto(', '), h('span', { text: T.avisos.modalidadMin[a.modalidad] })] : null),
        h('span', { class: 'linea-etapa' }, Aviso.recorrido(a), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a)) + '. '),
          h('span', { class: 'etapa-texto ' + Aviso.claseEtapa(a), text: lineaCorta(a) })),
        a.estado_postulacion === 'a_mano' ? h('span', { class: 'traba', text: Aviso.traba(a, config) }) : null),
      icono('i-adelante', 'i-adelante'));
    return boton;
  }
  function tabla(vis) {
    const C = T.postulaciones.columnas;
    return h('div', { class: 'tabla-caja tabla-postulaciones' }, h('table', { class: 'tabla' },
      h('thead', null, h('tr', null, [C.match, C.puesto, C.empresa, C.recorrido, C.etapa, C.fecha, C.aviso].map((t, i) => h('th', { scope: 'col', class: [i === 0 ? 'der' : null, i === 2 ? 'col-empresa' : null, i === 5 ? 'col-fecha' : null].filter(Boolean).join(' ') || null, text: t })))),
      h('tbody', null, vis.map(filaTabla))));
  }
  function filaTabla(a) {
    const llega = Aviso.llega(a, umbral);
    const linea = Aviso.lineaEtapa(a, config);
    const tr = h('tr', { tabindex: '0', dataset: { match: a.match_id, control: 'abrir' } },
      h('td', { class: 'tabla-match' + (llega || a.match === null ? '' : ' bajo') }, h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, llega))),
      h('td', null, h('div', { class: 'aviso-puesto', text: a.puesto }), h('div', { class: 'atributos' },
        a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null, Aviso.lugar(a), a.modalidad ? ' · ' + T.avisos.modalidadMin[a.modalidad] : '')),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', null, Aviso.recorrido(a), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a))),
        h('div', { class: 'etapa-texto ' + Aviso.claseEtapa(a), 'aria-hidden': 'true', text: etiquetaEtapa(a) })),
      h('td', null, linea ? h('div', { class: 'traba', text: linea }) : null),
      h('td', { class: 'num sin-corte col-fecha', text: Terna.relativa(fechaEtapa(a)) }),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: a.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
    tr.addEventListener('click', (e) => { if (!e.target.closest('a, button')) abrirFicha(a, tr); });
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) { e.preventDefault(); abrirFicha(a, tr); } });
    return tr;
  }

  /* ---------- Un filtro: hoja en celular, panel debajo de su botón en escritorio (como en Avisos) ----------
     Se aplica al tocar, con la lista a la vista detrás; "Listo" (o la cruz, o Esc) cierra y devuelve el foco al botón. */
  function opcion(tipo, nombre, valor, texto, elegido, iconoId) {
    return h('label', { class: 'chip-opcion chip-opcion-form' }, h('input', { type: tipo, name: nombre, value: valor, checked: elegido }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), iconoId ? icono(iconoId) : null, texto));
  }
  const ICONOS = { modalidad: (v) => 'i-' + v, alcance: (v) => 'i-' + v };
  function aplicarFiltro() { guardarFiltros(); dibujar(); }
  function cuerpoFiltro(k) {
    const F = T.avisos.filtros;
    const cuerpo = h('div', { class: 'formulario filtro-cuerpo' });
    if (BUSQUEDA.includes(k)) {
      const aviso = h('p', { class: 'campo-error', role: 'alert' });
      const grupo = h('div', { class: 'chips' }, TODOS[k].map((v) => opcion('checkbox', k, v, nombreDe(k, v), efectiva(k).includes(v), ICONOS[k] ? ICONOS[k](v) : null)));
      grupo.addEventListener('change', (e) => {
        const marcados = Array.from(grupo.querySelectorAll('input:checked')).map((x) => x.value);
        if (!marcados.length) { e.target.checked = true; aviso.textContent = F.alMenosUna; return; }
        aviso.textContent = '';
        filtros[k] = mismos(marcados, TODOS[k]) ? null : marcados;
        aplicarFiltro();
      });
      cuerpo.append(h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: F.nombres[k] }), grupo), aviso);
      if (F.sinDato[k]) cuerpo.append(h('p', { class: 'campo-ayuda', text: F.sinDato[k] }));
    } else if (k === 'paquete') {
      const grupo = h('div', { class: 'chips' }, PAQUETES.map((v) => opcion('radio', k, v, v === 'todos' ? F.todos : T.avisos.paquete[v], filtros.paquete === v)));
      grupo.addEventListener('change', (e) => { filtros.paquete = e.target.value; aplicarFiltro(); });
      cuerpo.append(h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: F.nombres[k] }), grupo));
    } else {
      const idRango = Terna.idUnico('match');
      const rango = h('input', { type: 'range', id: idRango, name: 'match', min: String(piso), max: '100', step: '1', value: String(filtros.matchMin) });
      const valor = h('output', { class: 'umbral-valor', for: idRango, text: String(filtros.matchMin) });
      rango.addEventListener('input', () => { valor.textContent = rango.value; });
      rango.addEventListener('change', () => { filtros.matchMin = Number(rango.value); aplicarFiltro(); });
      cuerpo.append(h('div', { class: 'campo' },
        h('div', { class: 'interruptor-fila' }, h('label', { class: 'campo-etiqueta', for: idRango, text: F.matchMinimo }), valor), rango));
    }
    return cuerpo;
  }
  function abrirFiltro(k, boton) {
    const F = T.avisos.filtros;
    boton.setAttribute('aria-expanded', 'true');
    Terna.abrirHoja({ titulo: F.nombres[k], cuerpo: cuerpoFiltro(k), panel: boton, origen: boton,
      alCerrar: () => boton.setAttribute('aria-expanded', 'false'),
      acciones: h('div', { class: 'botones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => Terna.cerrarHoja(true) }, F.listo)) });
  }

  /* ---------- Escribir una etapa ---------- */
  const CAMPOS = ['estado_postulacion', 'postulado_en', 'entrevista_en', 'en_cola_en', 'motivo_a_mano', 'interes'];
  const foto = (a) => Object.fromEntries(CAMPOS.map((k) => [k, a[k]]));
  const restaurar = (a, f) => Object.assign(a, f);
  function aplicarLocal(a, nuevo) {
    const ahora = new Date().toISOString();
    a.estado_postulacion = nuevo;
    if (nuevo === 'postulado') { a.postulado_en = a.postulado_en || ahora; a.entrevista_en = null; }
    if (nuevo === 'entrevista') { a.postulado_en = a.postulado_en || ahora; a.entrevista_en = a.entrevista_en || ahora; }
    if (nuevo === 'en_cola') a.en_cola_en = ahora;
    if (nuevo === 'pendiente') { a.postulado_en = null; a.entrevista_en = null; a.en_cola_en = null; }
    if (nuevo === 'a_mano') a.motivo_a_mano = 'elegido_por_usuario';
  }
  async function escribir(a, nuevo) {
    const { error } = await sb.from('postulaciones').upsert({ match_id: a.match_id, usuario_id: uid, estado: nuevo }, { onConflict: 'match_id' });
    return error;
  }
  function avisarError(error) {
    if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true, icono: 'i-alerta' });
  }
  function actualizarVista(a) {
    dibujarEtapas();
    dibujarLista();
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
  }
  // Después de Deshacer: el foco vuelve al botón con el mismo texto que el que se tocó (si sigue estando), o al primero.
  function enfocarFicha(a, etiqueta) {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) {
      const controles = [...abierta.el.querySelectorAll('.hoja-acciones button, .hoja-acciones a')];
      const destino = controles.find((c) => etiqueta && c.textContent.trim() === etiqueta) || controles[0];
      if (destino) { destino.focus(); return; }
    }
    const n = lista.querySelector('[data-match="' + a.match_id + '"]');
    if (n) n.focus(); else Terna.devolverFoco(null);
  }
  // Sin Deshacer: se escribe en el acto.
  async function enElActo(a, nuevo, texto) {
    Terna.cerrarBreve(true);
    const antes = foto(a);
    aplicarLocal(a, nuevo);
    actualizarVista(a);
    const error = await escribir(a, nuevo);
    if (error) { restaurar(a, antes); actualizarVista(a); avisarError(error); return; }
    Terna.avisoBreve(texto);
  }
  // Con Deshacer: se escribe cuando el aviso breve se va, o antes si hace falta.
  let pendiente = null;
  async function confirmar(p) {
    if (p.hecho) return;
    p.hecho = true;
    if (pendiente === p) pendiente = null;
    const error = await escribir(p.a, p.nuevo);
    if (error) { restaurar(p.a, p.antes); actualizarVista(p.a); avisarError(error); }
  }
  function conDeshacer(a, nuevo, texto) {
    const etiqueta = document.activeElement ? document.activeElement.textContent.trim() : null;
    Terna.cerrarBreve(true);
    const p = { a, nuevo, antes: foto(a), hecho: false };
    aplicarLocal(a, nuevo);
    actualizarVista(a);
    pendiente = p;
    Terna.avisoBreve(texto, {
      deshacer: () => { if (p.hecho) return; p.hecho = true; if (pendiente === p) pendiente = null; restaurar(a, p.antes); actualizarVista(a); enfocarFicha(a, etiqueta); },
      alVencer: () => confirmar(p),
    });
  }
  function mandarAntesDeIrse() {
    const p = pendiente;
    if (!p || p.hecho) return;
    p.hecho = true;
    pendiente = null;
    const t = Terna.token();
    if (!t) return;
    try {
      fetch(Terna.CONFIG.url + '/rest/v1/postulaciones?on_conflict=match_id', {
        method: 'POST', keepalive: true,
        headers: { apikey: Terna.CONFIG.clave, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ match_id: p.a.match_id, usuario_id: uid, estado: p.nuevo }),
      }).catch(() => {});
    } catch (e) { /* nada más para hacer */ }
  }
  window.addEventListener('pagehide', mandarAntesDeIrse);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { mandarAntesDeIrse(); Terna.cerrarBreve(false); } });

  // "No me interesa" saca la postulación de la lista (marcar_interes también deshace "en cola" y "para revisar").
  async function noMeInteresa(a, deshaciendo) {
    Terna.cerrarBreve(true);
    const valor = deshaciendo ? 'me_interesa' : 'no_me_interesa';
    const { error } = await sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: valor });
    if (error) { avisarError(error); return; }
    a.interes = valor;
    if (valor === 'no_me_interesa') {
      if (a.estado_postulacion === 'en_cola' || a.estado_postulacion === 'para_revisar') a.estado_postulacion = 'pendiente';
      postulaciones = postulaciones.filter((x) => x !== a);
      Terna.cerrarHoja(true);
      dibujar();
      Terna.avisoBreve(T.postulaciones.hecho.noInteresa, { icono: 'i-no-interesa', deshacer: () => noMeInteresa(a, true) });
    } else {
      if (!postulaciones.includes(a)) postulaciones.push(a);
      dibujar();
      const n = lista.querySelector('[data-match="' + a.match_id + '"]');
      if (n) n.focus(); else Terna.devolverFoco(null);
    }
  }
  async function volverAProbar(a) {
    if (a.motivo_a_mano === 'confirmacion_incierta') {
      const P = T.postulaciones.confirmarProbar;
      const si = await Terna.confirmar({ titulo: P.titulo, texto: P.texto, si: P.si, no: P.no });
      if (!si) return;
    }
    conDeshacer(a, 'en_cola', T.postulaciones.hecho.probar((a.intentos || 0) + 1, maxIntentos));
  }

  /* ---------- Ficha de la postulación (§8.5) ---------- */
  function cabeceraFicha(a, idTitulo) {
    return h('div', { class: 'ficha-cabecera' },
      h('div', null, h('h2', { class: 'ficha-titulo', id: idTitulo, text: a.puesto }),
        a.empresa ? h('p', { class: 'ficha-empresa', text: a.empresa }) : null, Aviso.atributos(a, { fuente: true, tag: 'p' })),
      Aviso.bloqueMatch(a, umbral, true));
  }
  function seccionEtapa(a) {
    const sec = h('section', { class: 'ficha-seccion' });
    const chip = a.estado_postulacion === 'pendiente' ? h('span', { class: 'chip-texto', text: T.avisos.postulacion.pendiente }) : Aviso.chipPostulacion(a);
    sec.append(h('div', { class: 'chips' }, chip), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a))));
    const linea = Aviso.lineaEtapa(a, config);
    if (linea) sec.append(h('p', { text: linea }));
    if (a.estado_postulacion === 'a_mano') {
      sec.append(h('p', { text: T.postulaciones.linea.todoListo }));
      const link = linkTraba(a);
      if (link) sec.append(h('p', null, link));
    }
    if (a.estado_postulacion === 'enviada' && a.confirmacion_texto) sec.append(h('blockquote', { class: 'suave', text: a.confirmacion_texto }));
    if (a.captura_path) sec.append(captura(a));
    const et = Aviso.etiquetas(a, bajoMinimo(a), true, Aviso.motivosFuera(a, busquedaPrefs));
    if (et) sec.append(et);
    return sec;
  }
  // Dónde se destraba (brand.md 0.4.8 §6.5): el motor deja en respuestas.traba qué campo frenó la postulación. Un dato de
  // Mi perfil lleva a Mi perfil; DNI, CUIL o fecha de nacimiento, a Datos para formularios (desde 0.4.8 Terna los escribe si
  // están cargados); lo demás, a las respuestas para formularios de Preferencias, como hasta ahora.
  const CAMPOS_PERFIL = { empresa_actual: 'experiencia', telefono: 'datos', linkedin: 'datos', sitio: 'datos', promedio: 'estudios', dni: 'formularios' };
  // Lo que Terna no tiene en ningún lado (un archivo que no es el CV ni la carta): no hay dónde completarlo, así que no va link
  // (pipeline.md 0.3.19 §4.12). Desde 0020 el promedio y el portfolio se cargan en Mi perfil, y la nacionalidad en Preferencias.
  const CAMPOS_SIN_LINK = { archivo: true };
  function campoTraba(a) { return a.respuestas && a.respuestas.traba ? a.respuestas.traba.campo || null : null; }
  function linkTraba(a) {
    if (a.motivo_a_mano !== 'pregunta_sin_respuesta') return null;
    const campo = campoTraba(a);
    if (CAMPOS_SIN_LINK[campo]) return null;
    if (CAMPOS_PERFIL[campo]) return h('a', { href: 'perfil.html#' + CAMPOS_PERFIL[campo], text: T.postulaciones.completarPerfil });
    return h('a', { href: 'preferencias.html#respuestas', text: T.postulaciones.completarRespuestas });
  }
  function captura(a) {
    const caja = h('div', { class: 'ficha-seccion' });
    const img = h('img', { alt: T.postulaciones.capturaAlt(etiquetaEtapa(a)), loading: 'lazy' });
    const marco = h('div', { class: 'captura' }, img);
    const link = Terna.linkFirmado(a.captura_path, null, h('a', null, icono('i-captura', 'icono-16'), ' ', T.postulaciones.verCaptura));
    caja.append(marco, h('p', null, link));
    Terna.urlFirmada(a.captura_path).then((url) => { img.src = url; })
      .catch(() => { Terna.vaciar(caja); caja.append(h('p', { class: 'campo-error', text: T.errores.archivo })); });
    return caja;
  }
  function seccionPaquete(a) {
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: T.avisos.ficha.paquete }));
    if (a.paquete_id) sec.append(Aviso.fichasPaquete(a));
    else sec.append(h('p', { text: a.estado_paquete === 'pedido' ? T.avisos.ficha.loArma : a.estado_paquete === 'no_se_pudo_armar' ? T.avisos.ficha.noSePudo : T.avisos.ficha.sinDocs }));
    return sec;
  }
  function seccionRespuestas(a) {
    const campos = a.respuestas && Array.isArray(a.respuestas.campos) ? a.respuestas.campos.slice(0, 20) : [];
    if (!campos.length) return null;
    const dl = h('dl', { class: 'respuestas' });
    for (const c of campos) {
      // brand.md 0.4.9 §6.5: una pregunta cerrada que Terna contestó que no (el perfil no muestra con qué decir que sí) se marca
      // para que la persona la mire antes de "Enviar".
      const nota = c.revisar === true && a.estado_postulacion === 'para_revisar' ? h('p', { class: 'campo-ayuda', text: T.postulaciones.revisarRespuesta }) : null;
      dl.append(h('div', null, h('dt', { text: c.etiqueta || '' }), h('dd', { text: c.valor ? c.valor : T.postulaciones.sinRespuesta }), nota));
    }
    const texto = campos.map((c) => (c.etiqueta || '') + ': ' + (c.valor || T.postulaciones.sinRespuesta)).join('\n');
    return h('section', { class: 'ficha-seccion' },
      h('div', { class: 'interruptor-fila' }, h('h3', { text: a.estado_postulacion === 'para_revisar' ? T.postulaciones.vaAResponder : T.postulaciones.respondio }),
        h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => Terna.copiar(texto, dl) }, icono('i-pegar'), T.postulaciones.copiarRespuestas)),
      dl);
  }
  function cuerpoFicha(a) {
    return [Aviso.recorridoGrande(a), seccionEtapa(a), seccionPaquete(a), seccionRespuestas(a), ...Aviso.razones(a, true)];
  }
  function accionesFicha(a) {
    const B = T.postulaciones.botones;
    const H = T.postulaciones.hecho;
    const b = (texto, iconoId, fn, clase) => h('button', { class: clase || 'btn', type: 'button', onclick: fn }, iconoId ? icono(iconoId) : null, texto);
    const noInteresa = b(B.noMeInteresa, null, () => noMeInteresa(a), 'btn btn-texto');
    const cont = h('div', { class: 'botones' });
    const notas = [];
    switch (a.estado_postulacion) {
      case 'a_mano':
        cont.append(Aviso.abrirAviso(a), b(B.marcarPostulado, 'i-enviada', () => conDeshacer(a, 'postulado', H.postulado)));
        if (Aviso.puedeVolverAProbar(a, config)) {
          cont.append(b(B.volverAProbar, 'i-probar', () => volverAProbar(a)));
          if (a.motivo_a_mano === 'requiere_cuenta') notas.push(h('p', { class: 'campo-ayuda', text: T.postulaciones.seVaATrabar }));
        }
        cont.append(noInteresa);
        break;
      case 'para_revisar':
        cont.append(b(B.enviar, 'i-enviar', () => conDeshacer(a, 'en_cola', H.aprobada), 'btn btn-primario'),
          b(B.postularYo, 'i-a-mano', () => enElActo(a, 'a_mano', H.aMano)), noInteresa);
        break;
      case 'en_cola':
        cont.append(Aviso.abrirAviso(a), b(B.cancelarEnvio, null, () => enElActo(a, 'pendiente', H.cancelado)), noInteresa);
        break;
      case 'enviada':
        cont.append(Aviso.abrirAviso(a), b(B.marcarEntrevista, 'i-entrevista', () => conDeshacer(a, 'entrevista', H.entrevista)), noInteresa);
        break;
      case 'postulado':
        cont.append(b(B.marcarEntrevista, 'i-entrevista', () => conDeshacer(a, 'entrevista', H.entrevista), 'btn btn-primario'),
          b(B.volverAPendiente, null, () => enElActo(a, 'pendiente', H.pendiente)), noInteresa);
        break;
      case 'entrevista':
        cont.append(b(B.volverAPendiente, null, () => enElActo(a, 'pendiente', H.pendiente), 'btn btn-primario'), noInteresa);
        break;
      default:
        cont.append(Aviso.abrirAviso(a), b(B.marcarPostulado, 'i-enviada', () => conDeshacer(a, 'postulado', H.postulado)), noInteresa);
    }
    return [cont, notas];
  }
  function marcarElegida() {
    const abierta = Terna.hojaAbierta();
    for (const tr of lista.querySelectorAll('tr.elegida')) tr.classList.remove('elegida');
    if (abierta && abierta.clave) {
      const tr = lista.querySelector('tr[data-match="' + abierta.clave + '"]');
      if (tr) tr.classList.add('elegida');
    }
  }
  function abrirFicha(a, origen, desdeHash) {
    // Una sola entrada de historial por ficha: si ya hay una abierta, se reemplaza (así "atrás" o cerrar no reabre la anterior).
    if (!desdeHash && location.hash !== '#postulacion-' + a.match_id) {
      if (history.state && history.state.ficha && /^#postulacion-/.test(location.hash)) history.replaceState({ ficha: a.match_id }, '', '#postulacion-' + a.match_id);
      else history.pushState({ ficha: a.match_id }, '', '#postulacion-' + a.match_id);
    }
    const idTitulo = Terna.idUnico('ficha');
    Terna.abrirHoja({ cabecera: cabeceraFicha(a, idTitulo), idTitulo, cuerpo: cuerpoFicha(a), acciones: accionesFicha(a), enLinea: true,
      origen: origen || lista.querySelector('[data-match="' + a.match_id + '"]'), clave: a.match_id,
      alCerrar: (porUsuario) => { marcarElegida(); if (porUsuario) limpiarHash(); } });
    marcarElegida();
  }
  function limpiarHash() {
    if (!/^#postulacion-/.test(location.hash)) return;
    if (history.state && history.state.ficha) history.back();
    else history.replaceState(null, '', location.pathname + '#' + HASH[etapa]);
  }
  function sincronizarHash() {
    const m = /^#postulacion-([0-9a-f-]{36})$/i.exec(location.hash);
    const abierta = Terna.hojaAbierta();
    if (m) {
      const a = porId.get(m[1]);
      if (a && (!abierta || abierta.clave !== a.match_id)) abrirFicha(a, null, true);
      return;
    }
    if (abierta && abierta.clave) Terna.cerrarHoja(false);
    const e = DE_HASH[(location.hash || '').slice(1)];
    if (e && e !== etapa) { etapa = e; dibujarEtapas(); dibujarLista(); }
  }
  window.addEventListener('popstate', sincronizarHash);
  document.addEventListener('terna:cambio-diseno', () => dibujarLista());
  document.addEventListener('terna:cambio-ancho', () => {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) { Terna.cerrarHoja(false); abrirFicha(porId.get(abierta.clave), null, true); }
  });

  const e0 = DE_HASH[(location.hash || '').slice(1)];
  if (e0) etapa = e0;
  armarBarra();
  dibujar();
  sincronizarHash();
});
