/* Terna · js/postulaciones.js
   Postulaciones (diseno.md §8): todo lo que tiene paquete, por etapa; el recorrido; desde diseno.md 0.16, el veredicto de
   requisitos en la fila y en su columna de la tabla; la ficha con la traba, la captura, el paquete y lo que Terna respondió;
   y los botones de cada etapa (brand.md §6.5).
   Escribe con un upsert de { match_id, usuario_id, estado } (el disparador valida la transición) y marcar_interes. La ficha
   lista las palabras del aviso que el CV no tiene, sin botón: se suman en Preferencias (datos.md 0.23 §14).
   Deshacer: la base no deja volver de postulado a a mano ni de en cola a para revisar o a mano (datos.md §5.13), así
   que las cuatro acciones con "Deshacer" se escriben cuando el aviso breve se va (6 s); si la página se cierra antes,
   se mandan igual con fetch keepalive.
   Desde diseno.md 0.21 cada encabezado de la tabla abre su filtro (js/filtros.js) y "No me interesa" pide confirmación, con el
   motivo opcional adentro (brand.md 0.8 §6.5). */
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
    Aviso.leerConEvaluacion((cols) => sb.from('mis_avisos').select(cols).or('paquete_id.not.is.null,estado_postulacion.neq.pendiente').neq('interes', 'no_me_interesa'), COLUMNAS),
    // La fila entera: trae lo de cada migración que esté aplicada (0027: priorizar_puestos), y sin ella no falla.
    sb.from('preferencias').select('*').eq('usuario_id', uid).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo, terminos_faltantes:contenido->render->terminos_faltantes'),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rB.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  let postulaciones = rA.data || [];
  const conMotivo = rA.conEvaluacion;  // 0025 aplicada: el veredicto, "Cómo se calcula" y "Decir por qué"
  const porId = new Map(postulaciones.map((a) => [a.match_id, a]));
  const prefs = rP.data || { umbral: 70, salario_modo: 'sugerir' };
  const umbral = prefs.umbral;
  // El piso de Avisos no esconde nada acá: lo que tiene paquete o una postulación sigue a la vista aunque un repuntaje lo baje
  // del piso (pipeline.md 0.4.10 §12), e Inicio lo cuenta en "para hacer a mano" (mi_resumen). Match arranca en 0, "Todos"
  // (diseno.md 0.24.3 §8.1). El piso solo sirve para leer los filtros guardados hasta `v: 3`, donde valía "Todos".
  const piso = config.piso_match || 50;
  const MATCH_TODOS = 0;
  // Lo que Terna te sugiere (diseno.md 0.25 §1.36 y §8.2): la regla de Aviso.sugerida, la misma de Inicio y con la que el motor
  // elige qué armar. Una postulación a mano que no llega a tu umbral, no es de tus puestos y no pediste va a "Bajo tu umbral",
  // no a "Para postular a mano" (Francisco, 07/11/2026: no tiene sentido que Terna sugiera postular a lo que no llega al umbral).
  const criterio = Aviso.criterio(prefs, piso);
  const conPuestos = criterio.puestos.length > 0;
  const etapaDe = (a) => (Aviso.bajoUmbral(a, criterio) ? 'bajo_umbral' : a.estado_postulacion);
  const conMinimo = new Set((rB.data || []).filter((p) => p.bajo_minimo === true).map((p) => p.match_id));
  // Palabras del aviso que el CV no tiene (cv-ats.md 0.4 §3.13): el motor las guarda en el paquete desde paquete.v3.
  const faltanPor = new Map((rB.data || []).filter((p) => Array.isArray(p.terminos_faltantes)).map((p) => [p.match_id, p.terminos_faltantes]));
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);
  const maxIntentos = config.max_reintentos_postulacion || 3;
  // Lo que quedó fuera de las preferencias de búsqueda del momento no se esconde acá (es lo que la persona ya tiene), pero
  // la ficha lo dice: Terna no lo postula por su cuenta (diseno.md 0.11 §8.5; pipeline.md 0.3.15 §4.12).
  const busquedaPrefs = Aviso.busquedaDe(prefs);

  /* ---------- Etapas (§8.2) ---------- */
  // Desde 0.25, "Bajo tu umbral" al final: se ve solo cuando tiene alguna (dibujarEtapas).
  const ETAPAS = ['todas', 'a_mano', 'para_revisar', 'en_cola', 'enviada', 'postulado', 'entrevista', 'bajo_umbral'];
  const URGENCIA = { a_mano: 0, para_revisar: 1, en_cola: 2, enviada: 3, postulado: 4, entrevista: 5, pendiente: 6 };
  const HASH = { a_mano: 'a-mano', para_revisar: 'para-revisar', en_cola: 'en-cola', enviada: 'enviadas', postulado: 'postuladas', entrevista: 'entrevistas', bajo_umbral: 'bajo-umbral', todas: 'todas' };
  const DE_HASH = Object.fromEntries(Object.entries(HASH).map(([k, v]) => [v, k]));
  const PUNTO = { a_mano: 'punto-mano', para_revisar: 'punto-espera', en_cola: 'punto-espera', enviada: 'punto-azul', postulado: 'punto-azul', entrevista: 'punto-entrevista', bajo_umbral: '', todas: '' };
  let etapa = 'todas';
  const fechaEtapa = (a) => ({ enviada: a.enviada_en, postulado: a.postulado_en, entrevista: a.entrevista_en, en_cola: a.en_cola_en, a_mano: a.captura_en || a.armado_en || a.creado_en })[a.estado_postulacion] || a.armado_en || a.creado_en;

  /* ---------- Filtros (diseno.md 0.13 §8.1): la barra de Avisos, sin Interés ni Postulación ----------
     Un botón por filtro con su valor, siempre a la vista; cada uno abre su hoja (celular) o su panel (escritorio) y se
     aplica al tocar. Interés no va (acá todo interesa) y Postulación tampoco: las etapas ya son ese filtro. Arrancan en
     todo, no en las preferencias: acá está lo que la persona ya tiene, y lo que quedó fuera de sus preferencias no se
     esconde (diseno.md 0.11 §8.5). Desde 0.24.3, Match tampoco esconde lo que bajó del piso: "Todos" es desde 0 (Francisco,
     07/11/2026: Inicio contaba más postulaciones para hacer a mano que las que se veían acá; las que faltaban eran las que el
     repuntaje dejó bajo el piso). Lo cambiado se marca como en Avisos y se recuerda en el navegador.
     Desde diseno.md 0.21, también por columna (Francisco, 06/11/2026: hizo clic en "Requisitos" para filtrar): Puesto, Empresa y
     Etapa con texto, Requisitos y Recorrido con lo que hay, Fecha con Desde, Hasta o El día. Recorrido elige etapas, varias a
     la vez, y se suma a la del carril. Desde 0.22 cada filtro está en un solo lugar: en el encabezado de su columna, si la tabla
     lo muestra, o en la barra (Modalidad, Alcance, Nivel, Jornada y Paquete, que no tienen columna; los de una columna que la
     tabla oculta por ancho; todos en el celular). */
  const PAQUETES = ['armado', 'sin_armar', 'pedido', 'no_se_pudo_armar', 'sin_texto', 'por_puntuar'];
  const REQUISITOS = ['cumple', 'a_confirmar', 'falta', 'sobra_nivel', 'falta_nivel', 'sin_dato'];
  const RECORRIDO = ['a_mano', 'para_revisar', 'en_cola', 'enviada', 'postulado', 'entrevista', 'pendiente'];
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const DE_COLUMNA = ['puesto', 'empresa', 'requisitos', 'recorrido', 'etapa', 'fecha'];
  const CLAVES = ['modalidad', 'alcance', 'nivel', 'jornada', 'match', 'paquete', ...DE_COLUMNA];
  const TODOS = Aviso.TODOS_BUSQUEDA;
  const inicial = () => ({ modalidad: null, alcance: null, nivel: null, jornada: null, matchMin: MATCH_TODOS, paquete: null,
    puesto: '', empresa: '', requisitos: null, recorrido: null, etapa: '', fecha: null });
  const mismos = (x, y) => x.length === y.length && x.every((v) => y.includes(v));
  // Una lista que deja pasar todo se guarda como null ("todas"); una vacía o rara, también.
  const deLista = (v, todos) => { if (!Array.isArray(v)) return null; const l = todos.filter((x) => v.includes(x)); return l.length && l.length < todos.length ? l : null; };
  function validos(f) {
    const r = inicial();
    if (!f || typeof f !== 'object') return r;
    // Los filtros guardados antes de la barra traían Postulación (ahora son las etapas) y [] para "todas": se leen igual.
    for (const k of BUSQUEDA) r[k] = deLista(f[k], TODOS[k]);
    // Hasta 0.21 Paquete era uno solo ('todos', 'armado'…): se lee como lista.
    r.paquete = Array.isArray(f.paquete) ? Filtros.listaValida(f.paquete, PAQUETES) : (PAQUETES.includes(f.paquete) ? [f.paquete] : null);
    // Hasta `v: 3` el deslizador empezaba en el piso y "Todos" se guardaba como el piso: se lee como Todos.
    if (Number.isInteger(f.matchMin)) {
      const deAntes = !(Number(f.v) >= 4);
      r.matchMin = deAntes && f.matchMin <= piso ? MATCH_TODOS : Math.max(MATCH_TODOS, Math.min(100, f.matchMin));
    }
    r.puesto = Filtros.textoValido(f.puesto);
    r.empresa = Filtros.textoValido(f.empresa);
    r.etapa = Filtros.textoValido(f.etapa);
    r.requisitos = Filtros.listaValida(f.requisitos, REQUISITOS);
    r.recorrido = Filtros.listaValida(f.recorrido, RECORRIDO);
    r.fecha = Filtros.fechaValida(f.fecha);
    return r;
  }
  let filtros = validos(Terna.leerLocal('postulaciones.filtros', null));
  const guardarFiltros = () => Terna.guardarLocal('postulaciones.filtros', Object.assign({ v: 4 }, filtros));
  const efectiva = (k) => filtros[k] || TODOS[k];
  // El veredicto de requisitos como categoría del filtro: el de match.v2 o, en un match de antes, "falta" si tenía faltantes.
  function categoriaRequisitos(a) {
    const ev = Aviso.evaluacion(a);
    if (ev) return ev.calificacion;
    return (a.requisitos_faltantes || []).length ? 'falta' : 'sin_dato';
  }
  // Lo que dice la columna Etapa (el nombre y la línea, con la traba): eso es lo que filtra el texto de Etapa.
  const textoEtapa = (a) => etiquetaEtapa(a) + ' ' + (Aviso.lineaEtapa(a, config) || '');
  // `excepto`: todos los filtros menos ese (para contar las opciones de un filtro con lo que dejan pasar los demás).
  function pasaFiltros(a, excepto) {
    if (excepto !== 'paquete' && filtros.paquete && !filtros.paquete.includes(Aviso.estadoPaquete(a))) return false;
    if (!Aviso.pasaBusqueda(a, { modalidad: efectiva('modalidad'), alcance: efectiva('alcance'), nivel: efectiva('nivel'), jornada: efectiva('jornada') })) return false;
    if (a.match !== null && a.match !== undefined && a.match < filtros.matchMin) return false;
    if (excepto !== 'puesto' && !Filtros.contiene(a.puesto, filtros.puesto)) return false;
    if (excepto !== 'empresa' && !Filtros.contiene(a.empresa, filtros.empresa)) return false;
    if (excepto !== 'requisitos' && filtros.requisitos && !filtros.requisitos.includes(categoriaRequisitos(a))) return false;
    if (excepto !== 'recorrido' && filtros.recorrido && !filtros.recorrido.includes(a.estado_postulacion)) return false;
    if (excepto !== 'etapa' && !Filtros.contiene(textoEtapa(a), filtros.etapa)) return false;
    if (excepto !== 'fecha' && !Filtros.pasaFecha(fechaEtapa(a), filtros.fecha)) return false;
    return true;
  }
  function cambiado(k) {
    if (BUSQUEDA.includes(k)) return filtros[k] !== null;
    if (k === 'match') return filtros.matchMin !== MATCH_TODOS;
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.hayTexto(filtros[k]);
    return filtros[k] !== null;  // paquete, requisitos, recorrido, fecha
  }
  const algoCambiado = () => CLAVES.some(cambiado);
  function nombreDe(k, v) {
    if (k === 'nivel') return T.preferencias.nivel[v];
    if (k === 'jornada') return T.preferencias.jornada[v];
    return T.avisos[k][v];
  }
  // Los mismos resúmenes que Avisos: "Remoto", "Remoto y Híbrido", "sin Pasantía", "3 de 6", "Todas".
  const F = T.avisos.filtros;
  const nombreFiltro = (k) => F.nombres[k] || F.columnas[k];
  function resumen(k) {
    if (k === 'match') return filtros.matchMin === MATCH_TODOS ? F.todos : F.matchResumen(filtros.matchMin);
    if (k === 'paquete') return Filtros.resumenLista(filtros.paquete, PAQUETES, (v) => T.avisos.paquete[v], F.todos);
    if (k === 'requisitos') return Filtros.resumenLista(filtros.requisitos, REQUISITOS, (v) => F.requisitos[v], F.todosColumna.requisitos);
    if (k === 'recorrido') return Filtros.resumenLista(filtros.recorrido, RECORRIDO, (v) => T.avisos.postulacion[v], F.todosColumna.recorrido);
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.resumenTexto(filtros[k], F.todosColumna[k]);
    if (k === 'fecha') return Filtros.resumenFecha(filtros.fecha, F.todosColumna.fecha);
    return Filtros.resumenLista(efectiva(k), TODOS[k], (v) => nombreDe(k, v), F.todosDe[k]);
  }
  function limpiarFiltros() { filtros = inicial(); guardarFiltros(); dibujar(); }
  const filtradas = () => postulaciones.filter((a) => pasaFiltros(a));
  function enEtapa(lista, e) { return e === 'todas' ? lista : lista.filter((a) => etapaDe(a) === e); }
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
    // "Bajo tu umbral" va solo si tiene alguna sin filtros (o es la elegida): para casi todos, casi siempre, estaría en 0.
    const hayBajo = etapa === 'bajo_umbral' || postulaciones.some((a) => etapaDe(a) === 'bajo_umbral');
    const orden = ETAPAS.filter((e) => e !== 'bajo_umbral' || hayBajo);
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
  const ubicarFiltros = Filtros.ubicar({ botones, lista });
  const primerFiltro = () => Filtros.primero({ botones, claves: CLAVES, lista });
  const estadoFiltros = h('div', { class: 'filtros-estado', hidden: true });
  function armarBarra() {
    const barra = h('div', { class: 'filtros-barra', role: 'group', 'aria-label': F.barra });
    for (const k of CLAVES) {
      const b = h('button', { class: 'filtro-boton', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', dataset: { filtro: k } },
        h('span', { class: 'filtro-nombre', text: nombreFiltro(k) + ':' }), ' ', h('span', { class: 'filtro-valor' }),
        h('span', { class: 'oculto-visual filtro-cambiado' }), icono('i-chevron', 'icono-16'));
      b.addEventListener('click', () => abrirFiltro(k, b, false));
      botones[k] = b;
      barra.append(b);
    }
    estadoFiltros.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => { limpiarFiltros(); primerFiltro().focus(); } },
      icono('i-deshacer', 'icono-16'), F.limpiarFiltros));
    cajaFiltros.append(h('div', { class: 'filtros-caja' }, barra), estadoFiltros);
  }
  function actualizarBarra() {
    for (const k of CLAVES) {
      const b = botones[k];
      b.querySelector('.filtro-valor').textContent = resumen(k);
      b.querySelector('.filtro-cambiado').textContent = cambiado(k) ? F.cambiadoAccesible : '';
      b.classList.toggle('cambiado', cambiado(k));
    }
    const enfocado = estadoFiltros.contains(document.activeElement);
    estadoFiltros.hidden = !algoCambiado();
    if (enfocado && estadoFiltros.hidden) primerFiltro().focus();
  }
  function dibujarLista() {
    Terna.vaciar(lista);
    const vis = ordenar(enEtapa(filtradas(), etapa));
    cuenta.textContent = postulaciones.length ? T.postulaciones.cuenta(vis.length) : '';
    if (!vis.length) {
      const vacio = !postulaciones.length ? h('p', { class: 'vacio', text: T.postulaciones.vacio })
        : etapa !== 'todas' && enEtapa(postulaciones, etapa).length === 0
          ? h('p', { class: 'vacio', text: T.postulaciones.vacioEtapa[etapa] })
          : h('div', { class: 'vacio' }, h('p', { text: T.postulaciones.vacioFiltros }),
            h('button', { class: 'btn', type: 'button', onclick: () => { limpiarFiltros(); primerFiltro().focus(); } }, T.avisos.filtros.limpiarFiltros));
      // En escritorio la lista es siempre la tabla, también vacía, con sus encabezados, que son los filtros de sus columnas
      // (diseno.md 0.22 §1.34 y §8.6).
      lista.append(Terna.anchoEscritorio.matches ? tabla([], vacio) : vacio);
      ubicarFiltros();
      return;
    }
    // En "Bajo tu umbral", arriba de la lista, por qué están ahí y qué hacer (brand.md 0.12 §6.5).
    if (etapa === 'bajo_umbral') lista.append(h('p', { class: 'etapa-nota', text: T.postulaciones.bajoUmbral.nota(umbral, conPuestos) }));
    if (Terna.anchoEscritorio.matches) lista.append(tabla(vis));
    else lista.append(h('ul', { class: 'lista-postulaciones', role: 'list' }, vis.map((a) => h('li', null, filaCelular(a)))));
    ubicarFiltros();
    marcarElegida();
  }
  // Por qué Terna te la sugiere aunque no llegue (o por qué no): "Tu puesto", como en Avisos, o "Bajo tu umbral" (diseno.md 0.25
  // §8.3, §8.5 y §8.6). `conExplicacion` en false: sin el texto oculto (la fila de celular es un botón, como el veredicto).
  function explicacionSugerencia(a) {
    const puesto = Aviso.tuPuesto(a, criterio);
    if (puesto) return T.avisos.tuPuestoExplicacion(puesto, Aviso.llega(a, umbral));
    return etapaDe(a) === 'bajo_umbral' ? T.postulaciones.bajoUmbral.explicacion(umbral, conPuestos) : null;
  }
  function chipSugerencia(a, conExplicacion) {
    const ex = explicacionSugerencia(a);
    if (!ex) return null;
    const tuyo = !!Aviso.tuPuesto(a, criterio);
    return h('span', { class: 'chip-texto' + (tuyo ? ' tinta tu-puesto' : ' bajo-umbral'), title: ex },
      tuyo ? icono('i-foco', 'icono-14') : null, h('span', { text: tuyo ? T.avisos.tuPuesto : T.avisos.bajoUmbral }),
      conExplicacion === false ? null : oculto(': ' + ex));
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
        lineaCalificacion(a), lineaSugerencia(a),
        h('span', { class: 'linea-etapa' }, Aviso.recorrido(a), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a)) + '. '),
          h('span', { class: 'etapa-texto ' + Aviso.claseEtapa(a), text: lineaCorta(a) })),
        a.estado_postulacion === 'a_mano' ? h('span', { class: 'traba', text: Aviso.traba(a, config) }) : null),
      icono('i-adelante', 'i-adelante'));
    return boton;
  }
  // El veredicto de requisitos (diseno.md 0.17 §8.3 y §8.6; brand.md 0.5.3 §6.5): en la fila de celular, una línea debajo de los
  // atributos; en la tabla, su columna, que se ve siempre: cuando la caja no alcanza se acomodan las demás.
  function lineaCalificacion(a) {
    const chip = Aviso.chipCalificacion(a, false);
    return chip ? h('span', { class: 'linea-calificacion' }, chip) : null;
  }
  function lineaSugerencia(a) {
    const chip = chipSugerencia(a, false);
    return chip ? h('span', { class: 'linea-calificacion linea-sugerencia' }, chip) : null;
  }
  // Cada encabezado abre el filtro de su columna (diseno.md 0.21 §8.6 y §10.18), salvo Aviso.
  let filtroAbierto = null;
  function tabla(vis, vacio) {
    const C = T.postulaciones.columnas;
    const columnas = [[C.match, 'match', 'der'], [C.puesto, 'puesto', 'col-puesto'], [C.empresa, 'empresa', 'col-empresa'], [C.requisitos, 'requisitos', 'col-requisitos'],
      [C.recorrido, 'recorrido', 'col-recorrido'], [C.etapa, 'etapa', 'col-etapa'], [C.fecha, 'fecha', 'col-fecha']];
    return h('div', { class: 'tabla-caja tabla-postulaciones' }, h('table', { class: 'tabla' },
      h('thead', null, h('tr', null, columnas.map(([texto, clave, clase]) => Filtros.encabezado({ texto, clave, clase, activo: cambiado(clave), abierto: filtroAbierto === clave,
        titulo: F.boton(nombreFiltro(clave), resumen(clave)), alAbrir: (b) => abrirFiltro(clave, b, true) })), h('th', { scope: 'col', text: C.aviso }))),
      // Sin filas, una sola celda con el aviso de vacío, debajo de los encabezados.
      vacio ? h('tbody', null, h('tr', null, h('td', { class: 'tabla-vacia', colspan: '8' }, vacio))) : h('tbody', null, vis.map(filaTabla))));
  }
  function filaTabla(a) {
    const llega = Aviso.llega(a, umbral);
    const linea = Aviso.lineaEtapa(a, config);
    const calificacion = Aviso.chipCalificacion(a);
    const sugerencia = chipSugerencia(a);  // "Tu puesto" o "Bajo tu umbral", debajo del puesto (diseno.md 0.25 §8.6)
    // El recorrido va en su columna y, cuando la caja no alcanza, arriba de la etapa (.apoyo-recorrido; diseno.md 0.17 §8.6).
    const recorrido = () => [Aviso.recorrido(a), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a))),
      h('div', { class: 'etapa-texto ' + Aviso.claseEtapa(a), 'aria-hidden': 'true', text: etiquetaEtapa(a) })];
    const tr = h('tr', { tabindex: '0', dataset: { match: a.match_id, control: 'abrir' } },
      h('td', { class: 'tabla-match' + (llega || a.match === null ? '' : ' bajo') }, h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, llega))),
      h('td', null, h('div', { class: 'aviso-puesto', text: a.puesto }), h('div', { class: 'atributos' },
        a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null, Aviso.lugar(a), a.modalidad ? ' · ' + T.avisos.modalidadMin[a.modalidad] : ''),
        sugerencia ? h('div', { class: 'linea-sugerencia' }, sugerencia) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-requisitos' }, calificacion),
      h('td', { class: 'col-recorrido' }, recorrido()),
      h('td', { class: 'col-etapa' }, h('div', { class: 'apoyo-recorrido' }, recorrido()), linea ? h('div', { class: 'traba', text: linea }) : null),
      h('td', { class: 'num sin-corte col-fecha', text: Terna.relativa(fechaEtapa(a)) }),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
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
  // Las opciones de un filtro de valores, con cuántas postulaciones deja ver cada una junto con los demás filtros y la etapa.
  function opcionesDe(k, valores, texto, valorDe) {
    const base = enEtapa(postulaciones.filter((a) => pasaFiltros(a, k)), etapa);
    return valores.map((v) => ({ valor: v, texto: texto(v), n: base.filter((a) => valorDe(a) === v).length }));
  }
  function cuerpoFiltro(k) {
    const cambiar = (v) => { filtros[k] = v; aplicarFiltro(); };
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.cuerpoTexto({ valor: filtros[k], alCambiar: cambiar });
    if (k === 'fecha') return Filtros.cuerpoFecha({ valor: filtros.fecha, alCambiar: cambiar });
    if (k === 'paquete' || k === 'requisitos' || k === 'recorrido') {
      const opciones = k === 'paquete' ? opcionesDe(k, PAQUETES, (v) => T.avisos.paquete[v], Aviso.estadoPaquete)
        : k === 'requisitos' ? opcionesDe(k, REQUISITOS, (v) => F.requisitos[v], categoriaRequisitos)
          : opcionesDe(k, RECORRIDO, (v) => T.avisos.postulacion[v], (a) => a.estado_postulacion);
      return Filtros.cuerpoValores({ nombre: nombreFiltro(k), opciones, elegidos: filtros[k], todosTexto: F.todosColumna[k], alCambiar: cambiar });
    }
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
    } else {
      const idRango = Terna.idUnico('match');
      const rango = h('input', { type: 'range', id: idRango, name: 'match', min: String(MATCH_TODOS), max: '100', step: '1', value: String(filtros.matchMin) });
      const valor = h('output', { class: 'umbral-valor', for: idRango, text: String(filtros.matchMin) });
      rango.addEventListener('input', () => { valor.textContent = rango.value; });
      rango.addEventListener('change', () => { filtros.matchMin = Number(rango.value); aplicarFiltro(); });
      cuerpo.append(h('div', { class: 'campo' },
        h('div', { class: 'interruptor-fila' }, h('label', { class: 'campo-etiqueta', for: idRango, text: F.matchMinimo }), valor), rango));
    }
    return cuerpo;
  }
  // Al cerrar, el foco vuelve al botón que abrió el filtro (el encabezado se rehace con cada cambio: se busca el de ahora); si su
  // lugar ya no se ve (la tabla ocultó o mostró la columna, diseno.md 0.22 §1.34), al otro lugar del filtro o al primer filtro.
  const visible = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
  function abrirFiltro(k, boton, desdeEncabezado) {
    filtroAbierto = k;
    Filtros.abrir({ clave: k, titulo: nombreFiltro(k), cuerpo: cuerpoFiltro(k), boton,
      destino: () => {
        const th = lista.querySelector('th [data-filtro="' + k + '"]');
        if (desdeEncabezado) return visible(th) ? th : (visible(botones[k]) ? botones[k] : primerFiltro());
        return visible(botones[k]) ? botones[k] : (visible(th) ? th : primerFiltro());
      },
      alCerrar: () => { filtroAbierto = null; } });
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

  // "No me interesa" saca la postulación de la lista (marcar_interes también deshace "en cola" y "para revisar"). Desde brand.md
  // 0.8 pide confirmación, con el motivo opcional adentro; Deshacer no.
  async function noMeInteresa(a, deshaciendo) {
    Terna.cerrarBreve(true);
    let motivo = null;
    if (!deshaciendo) {
      const r = await Aviso.confirmarNoInteresa(a, { config, conMotivo });
      if (!r.si) return;
      motivo = r.motivo;
    }
    const valor = deshaciendo ? 'me_interesa' : 'no_me_interesa';
    const error = deshaciendo ? (await sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: valor })).error : await Aviso.marcarNoInteresa(a, motivo);
    if (error) { avisarError(error); return; }
    a.interes = valor;
    if (valor !== 'no_me_interesa') a.motivo_no_interesa = null;
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
    sec.append(h('div', { class: 'chips' }, chip, chipSugerencia(a, false)), oculto(T.postulaciones.recorridoAccesible(etiquetaEtapa(a))));
    // Por qué Terna te la sugiere aunque no llegue a tu umbral, o por qué ya no (diseno.md 0.25 §8.5).
    const porQue = explicacionSugerencia(a);
    if (porQue) sec.append(h('p', { class: 'etapa-nota', text: porQue }));
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
  // Dónde se destraba (brand.md 0.7 §6.5): el motor deja en respuestas.traba qué campo frenó la postulación. Todo se completa en
  // Mi perfil (diseno.md 0.19 §9.2): un dato de contacto en Datos; DNI, CUIL o fecha de nacimiento en Identificación (desde
  // brand.md 0.4.8 Terna los escribe si están cargados); el analítico en CV; el promedio en Estudios; lo demás (autorización,
  // disponibilidad, nacionalidad, consentimientos…) en Respuestas para formularios, que hasta 0.18 estaba en Preferencias.
  const CAMPOS_PERFIL = { empresa_actual: 'experiencia', telefono: 'datos', linkedin: 'datos', sitio: 'datos', promedio: 'estudios', promedio_sin_opcion: 'estudios',
    analitico: 'analitico', dni: 'identificacion' };
  // Lo que Terna no tiene en ningún lado (un archivo que no es el CV ni la carta): no hay dónde completarlo, así que no va link
  // (pipeline.md 0.3.19 §4.12).
  const CAMPOS_SIN_LINK = { archivo: true };
  function campoTraba(a) { return a.respuestas && a.respuestas.traba ? a.respuestas.traba.campo || null : null; }
  function linkTraba(a) {
    if (a.motivo_a_mano !== 'pregunta_sin_respuesta') return null;
    const campo = campoTraba(a);
    if (CAMPOS_SIN_LINK[campo]) return null;
    if (CAMPOS_PERFIL[campo]) return h('a', { href: 'perfil.html#' + CAMPOS_PERFIL[campo], text: T.postulaciones.completarPerfil });
    return h('a', { href: 'perfil.html#respuestas', text: T.postulaciones.completarRespuestas });
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
    if (a.paquete_id) sec.append(Aviso.fichasPaquete(Object.assign({}, a, { terminos_faltantes: faltanPor.get(a.match_id) || [] })));
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
