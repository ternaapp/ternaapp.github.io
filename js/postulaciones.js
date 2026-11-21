/* Terna · js/postulaciones.js
   Postulaciones (PLAN-UX §3.4; hasta ahí, diseno.md 0.33 §8): el envío de lo que ya tiene paquete, en tres pestañas (PLAN-UX §2.2):
   - Postuladas: lo que envió Terna y lo que la persona marcó (enviada y postulado), la más nueva primero. Es la de entrada, siempre
     (decisión D1, 21/11/2026): los links y el número del muelle llegan a su pestaña con el hash.
   - Postula Terna: lo que tiene Terna en marcha, en dos grupos, para revisar (te toca confirmar: la tarjeta lleva «Revisar») y en
     cola (espera la próxima corrida); al final, un renglón que lleva a lo que Terna va a armar y postular en Paquetes (PLAN-UX §6.0:
     una lectura más de mis_avisos, con otro filtro). Va a estar vacía muchos días: su vacío lo explica.
   - A mano: a mano y el paquete armado sin postular, por match; la tarjeta lleva «Abrir aviso» y «Marcar postulado» (con Deshacer,
     como la ficha). "Tu umbral" (brand.md 0.21 §6.5) va solo acá, con su explicación detrás de un «?».
   Cada número vive una vez, en su pestaña o en su grupo (PLAN-UX §0): salen la cuenta del título, el renglón «Terna postuló por vos
   en N…» (decisión D7; lo que hizo Terna se cuenta en Inicio) y las partes de debajo de las pestañas. La cuenta de lo que te toca
   (para revisar y A mano) va al muelle y al carril con Terna.cuentaToca.
   En cada fila, por qué está en tu lista y en qué etapa; el veredicto de requisitos; la ficha con la traba, la captura, el paquete y lo
   que Terna respondió (en una postulada, con el paquete y las notas primero: es adonde se vuelve para preparar la entrevista). Desde
   PLAN-UX §3.4 la ficha es más corta: sin el recorrido de cuatro puntos, «Terna lo intentó N veces» solo si quedó a mano o si fueron
   dos o más, y en una a mano el CV y la carta arriba y abajo solo las notas y el salario.
   Escribe con un upsert de { match_id, usuario_id, estado } (el disparador valida la transición) y marcar_interes. La ficha
   lista las palabras del aviso que el CV no tiene, sin botón: se suman en Preferencias (datos.md 0.23 §14).
   Deshacer: la base no deja volver de postulado a a mano ni de en cola a para revisar o a mano (datos.md §5.13), así
   que las acciones con "Deshacer" se escriben cuando el aviso breve se va (6 s); si la página se cierra antes,
   se mandan igual con fetch keepalive.
   Cada encabezado de la tabla abre su filtro (js/filtros.js; diseno.md 0.21) y en el celular los filtros van detrás de un solo botón
   (Filtros.botonUnico); "No me interesa" va chico, al pie de la ficha, y pide confirmación con el motivo opcional adentro (brand.md
   0.8 §6.5). */
'use strict';

Terna.pagina('postulaciones', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const lista = document.getElementById('lista');
  const cajaFiltros = document.getElementById('filtros');
  const cajaVistas = document.getElementById('vistas');
  const COLUMNAS = 'match_id, aviso_id, puesto, empresa, ubicacion, pais, modalidad, alcance, url, url_postulacion, fuente, postulacion, dudoso, publicado_en, visto_en, tiene_texto, texto_origen, match, razones, requisitos_faltantes, interes, estado_paquete, pedido_en, creado_en, nuevo, paquete_id, paquete_idioma, armado_en, cv_path, carta_path, salario_monto, salario_moneda, salario_periodo, salario_motivo, notas, estado_postulacion, motivo_a_mano, traba_detalle, intentos, en_cola_en, enviada_en, postulado_en, entrevista_en, respuestas, captura_path, captura_en, confirmacion_texto, nivel, jornada';
  // Lo que todavía no tiene paquete y Terna va a armar (PLAN-UX §6.0 y §10): lo pedido y lo que está en «Me interesa». Solo lo que
  // piden la regla de lo sugerido (Aviso.sugerida) y la de dónde se postula (Aviso.postulable), sin el texto ni la evaluación.
  const COLUMNAS_COLA = 'match_id, puesto, match, interes, estado_paquete, estado_postulacion, pedido_en, tiene_texto, modalidad, alcance, nivel, jornada, postulacion, ats_formulario';

  const parar = Terna.cargando(lista);
  const [rA, rP, rB, rC] = await Promise.all([
    Aviso.leerConEvaluacion((cols) => sb.from('mis_avisos').select(cols).or('paquete_id.not.is.null,estado_postulacion.neq.pendiente').neq('interes', 'no_me_interesa'), COLUMNAS),
    // La fila entera: trae lo de cada migración que esté aplicada (0027: priorizar_puestos), y sin ella no falla.
    sb.from('preferencias').select('*').eq('usuario_id', uid).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo, terminos_faltantes:contenido->render->terminos_faltantes'),
    sb.from('mis_avisos').select(COLUMNAS_COLA).is('paquete_id', null).or('pedido_en.not.is.null,interes.eq.me_interesa'),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rB.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  let postulaciones = rA.data || [];
  const conMotivo = rA.conEvaluacion;  // 0025 aplicada: el veredicto, "Cómo se calcula" y "Decir por qué"
  const porId = new Map(postulaciones.map((a) => [a.match_id, a]));
  const prefs = rP.data || { umbral: 70, salario_modo: 'sugerir' };
  const umbral = prefs.umbral;
  // El filtro Match arranca en 0, "Todos" (diseno.md 0.24.3 §8.1): lo ya postulado y lo que Terna tiene en marcha se ve aunque un
  // repuntaje lo baje del piso (pipeline.md 0.4.10 §12). El piso sirve para leer los filtros guardados hasta `v: 3`, donde valía
  // "Todos", y, desde 0.33, para lo que quedó a mano y Terna ya no sugiere: debajo del piso no se muestra (más abajo).
  const piso = config.piso_match || 50;
  const MATCH_TODOS = 0;
  // Lo que Terna te sugiere (diseno.md 0.25 §1.36): la regla de Aviso.sugerida, la misma de Inicio y con la que el motor elige qué
  // armar: lo que pediste, lo que llega a tu umbral y lo de tus puestos.
  const criterio = Aviso.criterio(prefs, piso);
  const conPuestos = criterio.puestos.length > 0;
  const conMinimo = new Set((rB.data || []).filter((p) => p.bajo_minimo === true).map((p) => p.match_id));
  // Palabras del aviso que el CV no tiene (cv-ats.md 0.4 §3.13): el motor las guarda en el paquete desde paquete.v3.
  const faltanPor = new Map((rB.data || []).filter((p) => Array.isArray(p.terminos_faltantes)).map((p) => [p.match_id, p.terminos_faltantes]));
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);
  // Lo que quedó fuera de las preferencias de búsqueda del momento no se esconde acá (es lo que la persona ya tiene), pero
  // la ficha lo dice: Terna no lo postula por su cuenta (diseno.md 0.11 §8.5; pipeline.md 0.3.15 §4.12).
  const busquedaPrefs = Aviso.busquedaDe(prefs);

  /* ---------- Lo próximo que Terna va a armar y postular (PLAN-UX §2.4, punto 2, y §3.4) ----------
     El renglón del final de Postula Terna: lo que está en Paquetes › Por armar, Terna arma sola o porque lo pediste («Tus pedidos» y
     «Después sigue Terna», PLAN-UX §3.2) y después postula ella (un formulario de los cuatro ATS, con «Terna postula por vos» en Sí).
     Lo por decidir, lo que espera texto o número sin pedido y lo que Terna no arma sola no cuenta: todavía no es de Terna. Si la
     lectura falla, el renglón no se dibuja; la página sigue igual. */
  const armaYPostula = prefs.armar_paquetes !== false && prefs.postular_sola !== false;
  const sinPostular = (a) => !a.estado_postulacion || a.estado_postulacion === 'pendiente';
  const tieneMatch = (a) => a.match !== null && a.match !== undefined;
  const loArmaTerna = (a) => (a.pedido_en ? a.estado_paquete === 'pedido'
    : a.interes === 'me_interesa' && a.estado_paquete === 'sin_armar' && a.tiene_texto && tieneMatch(a) && Aviso.pasaBusqueda(a, busquedaPrefs) && Aviso.sugerida(a, criterio));
  const loProximo = !armaYPostula || rC.error ? 0 : (rC.data || []).filter((a) => sinPostular(a) && Aviso.postulable(a) && loArmaTerna(a)).length;

  /* ---------- Las tres pestañas y "Tu umbral" (PLAN-UX §2.2 y §3.4; brand.md 0.21 §6.5) ----------
     "Tu umbral" (Francisco, 12/11/2026: "las de abajo de 50 ni siquiera quiero que figuren en ningún lado… un botón que esté cliqueado
     como tu umbral y si lo desactivas te aparecen todas"): lo que quedó a mano, o con el paquete armado, y Terna ya no sugiere
     (subiste el umbral o un repuntaje lo bajó) se ve solo sin la casilla y desde el piso; debajo del piso, nunca. Lo ya postulado y
     lo que Terna tiene en marcha se ve siempre: se mandó, o se está por mandar, en nombre de la persona. Por eso la casilla va solo
     en A mano: es la única pestaña que cambia. */
  const VISTAS = ['postuladas', 'terna', 'a_mano'];
  const URGENCIA = { a_mano: 0, para_revisar: 1, en_cola: 2, enviada: 3, postulado: 4, pendiente: 5 };
  const HASH = { postuladas: 'postuladas', terna: 'postula-terna', a_mano: 'a-mano' };
  // Los hash de siempre (los de las etapas hasta 0.32 y los de las dos pestañas de antes), que siguen en los links de Inicio, del
  // muelle y en lo que alguien haya guardado (tabla de PLAN-UX §3.4). «#por-postular» y «#todas» eran la pestaña de lo que falta:
  // caen en A mano si tiene algo y, si no, en Postula Terna (más abajo, en leerHash).
  const DE_HASH = { postuladas: 'postuladas', enviadas: 'postuladas', entrevistas: 'postuladas',
    'postula-terna': 'terna', 'para-revisar': 'terna', 'en-cola': 'terna', 'a-mano': 'a_mano', 'bajo-umbral': 'a_mano' };
  const DE_HASH_LO_QUE_FALTA = new Set(['por-postular', 'todas']);
  let vista = 'postuladas';
  let soloSugeridas = true;
  const hecha = (a) => a.estado_postulacion === 'enviada' || a.estado_postulacion === 'postulado';
  const enMarcha = (a) => a.estado_postulacion === 'en_cola' || a.estado_postulacion === 'para_revisar';
  const vistaDe = (a) => (hecha(a) ? 'postuladas' : (enMarcha(a) ? 'terna' : 'a_mano'));
  const bajoPiso = (a) => a.match !== null && a.match !== undefined && a.match < piso;
  // Quedó a mano (o con el paquete armado) y Terna ya no la sugiere.
  const quedo = (a) => !hecha(a) && !enMarcha(a) && !Aviso.sugerida(a, criterio);
  const seVe = (a) => !quedo(a) || (!soloSugeridas && !bajoPiso(a));
  // Lo que la página puede mostrar: con todo lo que quedó debajo del piso, es como si no hubiera nada.
  const mostrables = () => postulaciones.filter((a) => !quedo(a) || !bajoPiso(a));
  const fechaEtapa = (a) => ({ enviada: a.enviada_en, postulado: a.postulado_en, en_cola: a.en_cola_en, a_mano: a.captura_en || a.armado_en || a.creado_en })[a.estado_postulacion] || a.armado_en || a.creado_en;

  /* ---------- Por qué está en tu lista (brand.md 0.21 §6.5; diseno.md 0.33 §8.6) ----------
     Una sola por postulación: la pediste, es de tus puestos, llega a tu umbral o no llega. Sin match, nada. */
  const POR_QUE = ['pedida', 'tu_puesto', 'sobre_umbral', 'bajo_umbral'];
  function porQue(a) {
    if (a.pedido_en) return 'pedida';
    if (Aviso.tuPuesto(a, criterio)) return 'tu_puesto';
    if (a.match === null || a.match === undefined) return null;
    return Aviso.llega(a, umbral) ? 'sobre_umbral' : 'bajo_umbral';
  }
  function explicacionPorQue(a, k) {
    const P = T.postulaciones.porQue;
    if (k === 'pedida') return P.pedida;
    if (k === 'tu_puesto') return T.avisos.tuPuestoExplicacion(Aviso.tuPuesto(a, criterio), Aviso.llega(a, umbral));
    if (k === 'sobre_umbral') return P.sobreUmbral(umbral);
    return (hecha(a) || enMarcha(a) ? P.bajoUmbralHecha : P.bajoUmbral)(umbral, conPuestos);
  }
  // `conExplicacion` en false: sin el texto oculto (la fila de celular es un botón, como el veredicto).
  function chipPorQue(a, conExplicacion) {
    const k = porQue(a);
    if (!k) return null;
    const ex = explicacionPorQue(a, k);
    const iconoId = k === 'tu_puesto' ? 'i-foco' : (k === 'pedida' ? 'i-pedido' : null);
    return h('span', { class: 'chip-texto por-que' + (k === 'bajo_umbral' ? ' bajo-umbral' : ' tinta') + (k === 'tu_puesto' ? ' tu-puesto' : ''), title: ex, dataset: { porque: k } },
      iconoId ? icono(iconoId, 'icono-14') : null, h('span', { text: T.postulaciones.porQue.valores[k] }), conExplicacion === false ? null : oculto(': ' + ex));
  }

  /* ---------- Filtros (diseno.md 0.13 §8.1): la barra de Avisos, sin Interés ni Postulación ----------
     Un botón por filtro con su valor; cada uno abre su hoja (celular) o su panel (escritorio) y se aplica al tocar. Interés no va
     (acá todo interesa) y Postulación tampoco: las pestañas y los grupos ya son ese filtro. Arrancan en todo, no en las preferencias:
     acá está lo que la persona ya tiene, y lo que quedó fuera de sus preferencias no se esconde (diseno.md 0.11 §8.5). Desde 0.24.3,
     Match tampoco esconde lo que bajó del piso: "Todos" es desde 0 (Francisco, 07/11/2026: Inicio contaba más postulaciones para
     hacer a mano que las que se veían acá). Lo cambiado se marca como en Avisos y se recuerda en el navegador.
     Desde diseno.md 0.21, también por columna: Puesto, Empresa y Etapa con texto, Requisitos y Por qué con lo que hay, Fecha con Desde,
     Hasta o El día. Cada filtro está en un solo lugar: en el encabezado de su columna, si la tabla lo muestra, o en la barra. Desde
     PLAN-UX §3.4, en el celular la barra entera va detrás de un solo botón, «Filtrar», con la cuenta de los que están puestos. */
  const PAQUETES = ['armado', 'sin_armar', 'pedido', 'no_se_pudo_armar', 'sin_texto', 'por_puntuar'];
  const REQUISITOS = ['cumple', 'a_confirmar', 'falta', 'sobra_nivel', 'falta_nivel', 'sin_dato'];
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const DE_COLUMNA = ['puesto', 'empresa', 'porque', 'requisitos', 'etapa', 'fecha'];
  const CLAVES = ['modalidad', 'alcance', 'nivel', 'jornada', 'match', 'paquete', ...DE_COLUMNA];
  const TODOS = Aviso.TODOS_BUSQUEDA;
  const inicial = () => ({ modalidad: null, alcance: null, nivel: null, jornada: null, matchMin: MATCH_TODOS, paquete: null,
    puesto: '', empresa: '', porque: null, requisitos: null, etapa: '', fecha: null });
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
    r.porque = Filtros.listaValida(f.porque, POR_QUE);
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
    if (excepto !== 'porque' && filtros.porque && !filtros.porque.includes(porQue(a))) return false;
    if (excepto !== 'etapa' && !Filtros.contiene(textoEtapa(a), filtros.etapa)) return false;
    if (excepto !== 'fecha' && !Filtros.pasaFecha(fechaEtapa(a), filtros.fecha)) return false;
    return true;
  }
  function cambiado(k) {
    if (BUSQUEDA.includes(k)) return filtros[k] !== null;
    if (k === 'match') return filtros.matchMin !== MATCH_TODOS;
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.hayTexto(filtros[k]);
    return filtros[k] !== null;  // paquete, requisitos, porque, fecha
  }
  const algoCambiado = () => CLAVES.some(cambiado);
  function nombreDe(k, v) {
    if (k === 'nivel') return T.preferencias.nivel[v];
    if (k === 'jornada') return T.preferencias.jornada[v];
    return T.avisos[k][v];
  }
  // Los mismos resúmenes que Avisos: "Remoto", "Remoto y Híbrido", "sin Pasantía", "3 de 6", "Todas".
  const F = T.avisos.filtros;
  const nombreFiltro = (k) => (k === 'porque' ? T.postulaciones.porQue.nombre : F.nombres[k] || F.columnas[k]);
  function resumen(k) {
    if (k === 'match') return filtros.matchMin === MATCH_TODOS ? F.todos : F.matchResumen(filtros.matchMin);
    if (k === 'paquete') return Filtros.resumenLista(filtros.paquete, PAQUETES, (v) => T.avisos.paquete[v], F.todos);
    if (k === 'requisitos') return Filtros.resumenLista(filtros.requisitos, REQUISITOS, (v) => F.requisitos[v], F.todosColumna.requisitos);
    if (k === 'porque') return Filtros.resumenLista(filtros.porque, POR_QUE, (v) => T.postulaciones.porQue.valores[v], T.postulaciones.porQue.todos);
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.resumenTexto(filtros[k], F.todosColumna[k]);
    if (k === 'fecha') return Filtros.resumenFecha(filtros.fecha, F.todosColumna.fecha);
    return Filtros.resumenLista(efectiva(k), TODOS[k], (v) => nombreDe(k, v), F.todosDe[k]);
  }
  function limpiarFiltros() { filtros = inicial(); guardarFiltros(); dibujar(); }
  // Lo que se ve con "Tu umbral" como esté y, de eso, lo que dejan pasar los filtros; y cada pestaña de una lista.
  const visibles = () => postulaciones.filter(seVe);
  const filtradas = () => visibles().filter((a) => pasaFiltros(a));
  const enVista = (l, v) => l.filter((a) => vistaDe(a) === v);
  // Postula Terna y A mano, por match de mayor a menor (diseno.md 0.3.1 §8; sin match, al final); a igual match, por urgencia y las
  // más nuevas primero. Postuladas, la más nueva primero (PLAN-UX §3.4): es lo que ya pasó, y se vuelve por lo último.
  const matchDe = (a) => (a.match === null || a.match === undefined ? -1 : Number(a.match));
  const masNueva = (a, b) => String(fechaEtapa(b) || '').localeCompare(String(fechaEtapa(a) || ''));
  function ordenar(l, v) {
    if (v === 'postuladas') return l.slice().sort((a, b) => masNueva(a, b) || (matchDe(b) - matchDe(a)));
    return l.slice().sort((a, b) => (matchDe(b) - matchDe(a)) || (URGENCIA[a.estado_postulacion] - URGENCIA[b.estado_postulacion]) || masNueva(a, b));
  }

  /* ---------- Dibujo ---------- */
  function dibujar() { actualizarVistas(); actualizarBarra(); dibujarLista(); }
  // Las pestañas, "Tu umbral" y la nota de Postuladas se arman una sola vez y se actualizan en el lugar, como la barra: así el foco se
  // queda en la pestaña que se eligió con las flechas. Las pestañas son las de dos renglones (Aviso.pestanas): el nombre arriba y el
  // número abajo, para que las tres entren a 320 px.
  let pestanas = null;
  let casillaUmbral = null;
  let notaUmbral = null;
  let cajaUmbral = null;
  let ayudaUmbral = null;
  let botonAyuda = null;
  let notaPostuladas = null;
  function armarVistas() {
    pestanas = Aviso.pestanas({ nombre: T.postulaciones.mostrar, elegida: vista, alCambiar: cambiarVista,
      opciones: VISTAS.map((v) => ({ valor: v, texto: T.postulaciones.vistas[v], n: 0 })) });
    cajaVistas.append(h('div', { class: 'vistas-caja' }, pestanas.nodo));
    // "Tu umbral": la casilla y, detrás de un «?», lo que muestra marcada o sin marcar (PLAN-UX §3.4; hasta acá, dos renglones fijos).
    // La explicación queda además en el title de la casilla y es su descripción para el lector de pantalla.
    const U = T.postulaciones.tuUmbral;
    const explicacion = U.explicacion(piso, conPuestos);
    const idAyuda = Terna.idUnico('umbral');
    casillaUmbral = h('input', { type: 'checkbox', name: 'tu-umbral', checked: soloSugeridas, 'aria-describedby': idAyuda });
    casillaUmbral.addEventListener('change', () => { soloSugeridas = casillaUmbral.checked; dibujar(); });
    // La explicación va en su propio renglón, a todo el ancho, debajo de la línea (en el celular, la casilla comparte la suya con
    // «Filtrar» y al lado no entraba).
    ayudaUmbral = h('p', { class: 'tu-umbral-ayuda', id: idAyuda, hidden: true, text: explicacion });
    botonAyuda = h('button', { class: 'btn btn-texto btn-icono tu-umbral-pregunta', type: 'button', title: U.ayudaAccesible,
      'aria-label': U.ayudaAccesible, 'aria-expanded': 'false', 'aria-controls': idAyuda }, icono('i-preguntar'));
    botonAyuda.addEventListener('click', () => {
      botonAyuda.setAttribute('aria-expanded', String(botonAyuda.getAttribute('aria-expanded') !== 'true'));
      mostrarAyuda();
    });
    notaUmbral = h('span', { class: 'tu-umbral-nota', role: 'status' });
    cajaUmbral = h('div', { class: 'tu-umbral-caja' },
      h('label', { class: 'chip-opcion chip-opcion-form tu-umbral', title: explicacion }, casillaUmbral,
        h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), U.etiqueta(umbral))),
      botonAyuda, notaUmbral);
    // En Postuladas, una línea corta arriba de la lista: para qué sirve volver (PLAN-UX §3.4).
    notaPostuladas = h('p', { class: 'etapa-nota', text: T.postulaciones.postuladasNota });
    document.querySelector('.post-principal .con-cajon').before(h('div', { class: 'linea-vista' }, notaPostuladas, cajaUmbral), ayudaUmbral);
  }
  // La explicación de "Tu umbral" se ve abierta con su «?» y solo donde está la casilla.
  function mostrarAyuda() { ayudaUmbral.hidden = cajaUmbral.hidden || botonAyuda.getAttribute('aria-expanded') !== 'true'; }
  function actualizarVistas() {
    const base = filtradas();
    const hay = mostrables().length > 0;
    const n = Object.fromEntries(VISTAS.map((v) => [v, enVista(base, v)]));
    const revisar = n.terna.filter((a) => a.estado_postulacion === 'para_revisar').length;
    pestanas.elegir(vista);
    pestanas.poner('postuladas', { n: n.postuladas.length });
    // En ámbar, lo que te toca (PLAN-UX §3.4): todo A mano y, dentro de Postula Terna, lo que está para revisar. Si en Postula Terna
    // todo es para revisar, su número va en ámbar; si también hay en cola, el número queda en tinta y lo para revisar va en el punto.
    pestanas.poner('terna', { n: n.terna.length, toca: revisar > 0 && revisar === n.terna.length,
      punto: revisar > 0 && revisar < n.terna.length ? revisar : 0, puntoTexto: T.postulaciones.paraRevisarCuenta(revisar) });
    pestanas.poner('a_mano', { n: n.a_mano.length, toca: n.a_mano.length > 0 });
    // Lo que te toca, en el muelle y en el carril (PLAN-WEB.md §2.1): para revisar y A mano, contados al entrar, con "Tu umbral"
    // marcada y sin filtros, así no cambia con cada filtro ni con la casilla. Inicio pasa el mismo número.
    Terna.cuentaToca(postulaciones.filter((a) => a.estado_postulacion === 'para_revisar' || (vistaDe(a) === 'a_mano' && !quedo(a))).length);
    // Sin nada todavía, ni filtros ni casilla (PLAN-UX §3.2: no se dibujan si la lista está vacía porque todavía no hay nada).
    cajaFiltros.hidden = !hay;
    cajaUmbral.hidden = vista !== 'a_mano' || !hay;
    mostrarAyuda();
    notaPostuladas.hidden = vista !== 'postuladas' || n.postuladas.length === 0;
    // Cuántas quedaron entre el piso y tu umbral, con los filtros puestos: lo que la casilla esconde o deja ver.
    const U = T.postulaciones.tuUmbral;
    const k = postulaciones.filter((a) => quedo(a) && !bajoPiso(a) && pasaFiltros(a)).length;
    casillaUmbral.checked = soloSugeridas;
    notaUmbral.textContent = !k ? '' : (soloSugeridas ? U.hayMas(k) : U.vesTambien(k));
  }
  function cambiarVista(v) {
    vista = v;
    if (!Terna.hojaAbierta()) history.replaceState(null, '', '#' + HASH[v]);
    actualizarVistas();
    dibujarLista();
  }
  // La barra se arma una sola vez y se actualiza en el lugar: así el foco vuelve al mismo botón al cerrar su filtro.
  const botones = {};
  const ubicarFiltros = Filtros.ubicar({ botones, lista });
  const estadoFiltros = h('div', { class: 'filtros-estado', hidden: true });
  // «Más filtros» (PLAN-WEB.md §2.8), desde 768 px. Con la tabla entera la barra lleva cinco (Modalidad, Alcance, Nivel, Jornada y
  // Paquete, que no tienen columna): quedan los cinco a la vista y el botón aparece recién cuando la tabla manda a la barra los de
  // una columna que esconde (Empresa, Por qué).
  let masFiltros = null;
  // El botón único del celular (Filtros.botonUnico): la barra y el estado van a su hoja; en la página queda «Filtrar».
  let unico = null;
  // El primer filtro a la vista; en el celular, el botón único (los de la barra están en su hoja).
  const primerFiltro = () => (!Terna.anchoEscritorio.matches && unico && !unico.boton.closest('[hidden]') ? unico.boton : Filtros.primero({ botones, claves: CLAVES, lista }));
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
    const cajaBarra = h('div', { class: 'filtros-caja' }, barra);
    cajaFiltros.append(cajaBarra, estadoFiltros);
    masFiltros = Filtros.masFiltros({ barra, botones, claves: CLAVES, cambiado, aLaVista: 5 });
    unico = Filtros.botonUnico({ caja: cajaFiltros, nodos: [cajaBarra, estadoFiltros], cuenta: CLAVES.filter(cambiado).length });
  }
  function actualizarBarra() {
    for (const k of CLAVES) {
      const b = botones[k];
      b.querySelector('.filtro-valor').textContent = resumen(k);
      b.querySelector('.filtro-cambiado').textContent = cambiado(k) ? F.cambiadoAccesible : '';
      b.classList.toggle('cambiado', cambiado(k));
    }
    if (masFiltros) masFiltros.repartir();
    if (unico) unico.cuenta(CLAVES.filter(cambiado).length);
    const enfocado = estadoFiltros.contains(document.activeElement);
    estadoFiltros.hidden = !algoCambiado();
    if (enfocado && estadoFiltros.hidden) primerFiltro().focus();
  }

  /* ---------- Los vacíos (PLAN-UX §3.4) ---------- */
  // El renglón del final de Postula Terna: lo próximo que Terna va a armar y postular, con el link a Paquetes filtrado a «Postula
  // Terna» (avisos.html?donde=terna). Sin nada que Terna vaya a armar y postular, no se dibuja. Sin número (FEEDBACK-UX P2-5): lo
  // que cuenta loProximo no es ninguno de los grupos que el link muestra.
  function lineaProximos() {
    if (!loProximo) return null;
    return h('p', { class: 'proximos-terna' }, T.postulaciones.proximos + ' ',
      h('a', { href: 'avisos.html?donde=terna', text: T.postulaciones.proximosLink }), '.');
  }
  // Una pestaña vacía con algo en otra (la persona nueva entra en Postuladas): el botón lleva a la que tiene, con su nombre; A mano
  // primero, que es lo que te toca. Postula Terna vacía explica por qué, en vez de parecer rota, y lleva a Paquetes.
  function vacioVista() {
    const texto = h('p', { text: T.postulaciones.vacioVista[vista] });
    if (vista === 'terna') return h('div', { class: 'vacio' }, texto, lineaProximos());
    const otra = vista === 'postuladas' ? ['a_mano', 'terna'].find((v) => enVista(visibles(), v).length) : null;
    if (!otra) return h('div', { class: 'vacio' }, texto);
    return h('div', { class: 'vacio' }, texto, h('button', { class: 'btn', type: 'button',
      onclick: () => { cambiarVista(otra); pestanas.radios[otra].focus(); } }, T.postulaciones.vistas[otra]));
  }
  /* Postula Terna va en dos grupos (PLAN-UX §3.4): para revisar (te toca confirmar; en ámbar) y en cola (espera la próxima corrida;
     con el reloj), cada uno con su cuenta y su ayuda, y adentro en el orden de siempre. Un grupo vacío no se dibuja; Postuladas y A
     mano van sin grupos. Devuelve [{ clave, texto, ayuda, tono, lista }]. */
  function grupos(vis) {
    if (vista !== 'terna') return [{ clave: null, lista: vis }];
    const G = T.postulaciones.grupos;
    return [
      { clave: 'para_revisar', texto: G.revisar, ayuda: G.revisarAyuda, tono: 'toca', lista: vis.filter((a) => a.estado_postulacion === 'para_revisar') },
      { clave: 'en_cola', texto: G.cola, ayuda: G.colaAyuda, tono: 'espera', lista: vis.filter((a) => a.estado_postulacion === 'en_cola') },
    ].filter((g) => g.lista.length);
  }
  const tituloDeGrupo = (g, nivel) => Aviso.tituloGrupo({ texto: g.texto, n: g.lista.length, tono: g.tono, ayuda: g.ayuda, nivel });
  function listaCelular(vis) {
    const ul = (l) => h('ul', { class: 'lista-postulaciones carpetas', role: 'list' }, l.map((a) => h('li', null, tarjeta(a))));
    return grupos(vis).map((g) => {
      if (!g.texto) return ul(g.lista);
      const cabeza = tituloDeGrupo(g);
      return h('section', { class: 'grupo', dataset: { grupo: g.clave }, 'aria-labelledby': cabeza.querySelector('.grupo-titulo').id }, cabeza, ul(g.lista));
    });
  }
  function dibujarLista() {
    Terna.vaciar(lista);
    // El marbete y el chip resueltos van calmos en Postuladas, donde todo está resuelto (PLAN-WEB.md §2.7).
    lista.dataset.vista = vista;
    const todas = filtradas();
    const vis = ordenar(enVista(todas, vista), vista);
    const hay = mostrables().length > 0;
    if (!vis.length) {
      const vacio = !hay && vista !== 'terna' ? h('p', { class: 'vacio', text: T.postulaciones.vacio })
        : enVista(visibles(), vista).length === 0
          ? vacioVista()
          : h('div', { class: 'vacio' }, h('p', { text: T.postulaciones.vacioFiltros }),
            h('button', { class: 'btn', type: 'button', onclick: () => { limpiarFiltros(); primerFiltro().focus(); } }, T.avisos.filtros.limpiarFiltros));
      // En escritorio la lista es siempre la tabla, también vacía, con sus encabezados, que son los filtros de sus columnas
      // (diseno.md 0.22 §1.34 y §8.6). Sin nada todavía, el vacío solo.
      lista.append(Terna.anchoEscritorio.matches && hay ? tabla([], vacio) : vacio);
      ubicarFiltros();
      return;
    }
    if (Terna.anchoEscritorio.matches) lista.append(tabla(vis));
    else lista.append(...listaCelular(vis));
    if (vista === 'terna') { const l = lineaProximos(); if (l) lista.append(l); }
    ubicarFiltros();
    marcarElegida();
  }
  function etiquetaEtapa(a) { return T.avisos.postulacion[a.estado_postulacion] || T.avisos.postulacion.pendiente; }
  // El chip de la etapa (brand.md §6.10). `conExplicacion` en false: sin el texto oculto (la fila de celular es un botón).
  function chipEtapa(a, conExplicacion) {
    const estilo = Aviso.ESTILO_POSTULACION[a.estado_postulacion];
    if (!estilo) return h('span', { class: 'chip-texto', text: T.avisos.postulacion.pendiente });
    return conExplicacion === false ? Aviso.chip(estilo[0], estilo[1], etiquetaEtapa(a)) : Aviso.chipPostulacion(a);
  }
  // La fila del celular (§8.3), una carpeta (PLAN-WEB.md §3.3): arriba la lengüeta con el match y el marbete con la etapa; en el cuerpo
  // el puesto, la empresa, los atributos, por qué está en tu lista, el veredicto y la línea de la etapa. Es un solo botón que abre la
  // ficha: la lengüeta va como texto, no como otro botón. `.linea-etapa` envuelve todo (el banco busca ahí el chip de la etapa y el de
  // por qué). Una pendiente no tiene marbete: su "Pendiente" va en el cuerpo. El id del puesto describe los botones de la tarjeta.
  // En Postula Terna la carpeta va sin la línea de la etapa: la dice la ayuda de su grupo («Terna completó el formulario…», «Terna la
  // envía en la próxima corrida»), una vez por grupo y no una por carpeta.
  function filaCelular(a, idPuesto) {
    const linea = enMarcha(a) ? null : Aviso.lineaCorta(a, config);
    const marbete = Aviso.marbete(a, { chip: true });
    const boton = h('button', { class: 'fila-postulacion carpeta', type: 'button', dataset: { match: a.match_id, control: 'abrir', etapa: a.estado_postulacion }, onclick: () => abrirFicha(a, boton) },
      h('span', { class: 'linea-etapa' },
        h('span', { class: 'carpeta-cabeza' }, Aviso.lengueta(a, umbral), marbete ? [oculto(', '), marbete] : null),
        h('span', { class: 'carpeta-cuerpo fila-postulacion-datos' }, oculto(', '),
          h('span', { class: 'fila-postulacion-puesto' }, h('span', { class: 'aviso-puesto puesto-texto', id: idPuesto || null, text: a.puesto }), icono('i-adelante', 'puesto-flecha')),
          a.empresa ? [oculto(', '), h('span', { class: 'empresa', text: a.empresa })] : null,
          oculto(', '), Aviso.atributos(a, { sinFuente: true }),
          h('span', { class: 'fila-postulacion-chips' }, marbete ? null : chipEtapa(a, false), chipPorQue(a, false), lineaCalificacion(a)),
          linea ? h('span', { class: 'traba', text: linea }) : null)));
    return boton;
  }
  /* La tarjeta del celular: la carpeta y, si hay algo para hacer desde la lista (PLAN-UX §2.3 y §3.4), su pie con los botones, que
     sigue el gris de la carpeta. En A mano, «Abrir aviso» (adonde se postula) y «Marcar postulado» (con Deshacer, como en la ficha);
     en una para revisar, «Revisar», que abre la ficha en lo que Terna va a responder (Enviar y Postular yo siguen en su pie). En la
     lista hay muchos botones iguales: cada uno lleva el puesto como descripción para el lector de pantalla. */
  function tarjeta(a) {
    const idPuesto = Terna.idUnico('puesto');
    const boton = filaCelular(a, idPuesto);
    const acciones = accionesLista(a, idPuesto, false);
    if (!acciones.length) return boton;
    return h('div', { class: 'tarjeta-postulacion' }, boton,
      h('div', { class: 'carpeta-cuerpo tarjeta-pie' }, h('div', { class: 'carpeta-acciones' }, acciones)));
  }
  // Los botones de una postulación en la lista: en el pie de la tarjeta, o en la fila de la tabla (`chico`: debajo de la etapa, sin
  // «Abrir aviso», que en la tabla es el link de su última columna).
  function accionesLista(a, idPuesto, chico) {
    const B = T.postulaciones.botones;
    const e = a.estado_postulacion;
    const boton = (texto, iconoId, control, fn) => {
      const b = h('button', { class: chico ? 'btn btn-chico boton-fila' : 'btn', type: 'button', 'aria-describedby': idPuesto, dataset: { control } },
        icono(iconoId), h('span', { text: texto }));
      b.addEventListener('click', () => fn(b));
      return b;
    };
    if (e === 'para_revisar') return [boton(B.revisar, 'i-revisar', 'revisar', (b) => revisar(a, b))];
    if (e !== 'a_mano' && e !== 'pendiente') return [];
    const marcar = boton(B.marcarPostulado, 'i-tilde', 'marcar-postulado', () => desdeLaLista(a, () => conDeshacer(a, 'postulado', T.postulaciones.hecho.postulado)));
    if (chico) return [marcar];
    const abrir = Aviso.abrirAviso(a, 'btn', prefs);
    abrir.setAttribute('aria-describedby', idPuesto);
    return [abrir, marcar];
  }
  // Una acción desde la lista que saca la postulación de su pestaña (Marcar postulado): el foco pasa a la que quedó en su lugar, o a la
  // pestaña si la lista quedó vacía, en vez de perderse con el botón. Deshacer la devuelve y el foco vuelve a ella (enfocarFicha).
  const filasDeLaLista = () => [...lista.querySelectorAll('button.fila-postulacion[data-match], tr[data-match]')];
  function desdeLaLista(a, fn) {
    const i = filasDeLaLista().findIndex((x) => x.dataset.match === a.match_id);
    fn();
    if (Terna.hojaAbierta()) return;
    const ahora = filasDeLaLista();
    if (ahora.some((x) => x.dataset.match === a.match_id)) return;
    const destino = ahora[Math.min(Math.max(i, 0), ahora.length - 1)] || pestanas.radios[vista];
    if (destino) destino.focus();
  }
  // «Revisar»: la ficha, abierta en lo que Terna va a responder.
  function revisar(a, origen) {
    abrirFicha(a, origen);
    const nodo = fichaRespuestas;
    if (nodo && nodo.isConnected) requestAnimationFrame(() => Aviso.bajarA(nodo));
  }
  // El veredicto de requisitos (diseno.md 0.17 §8.3 y §8.6; brand.md 0.5.3 §6.5): en la fila de celular, una línea debajo de los
  // atributos; en la tabla, su columna, que se ve siempre: cuando la caja no alcanza se acomodan las demás.
  function lineaCalificacion(a) {
    const chip = Aviso.chipCalificacion(a, false);
    return chip ? h('span', { class: 'linea-calificacion' }, chip) : null;
  }
  // Cada encabezado abre el filtro de su columna (diseno.md 0.21 §8.6 y §10.18), salvo Aviso.
  let filtroAbierto = null;
  function tabla(vis, vacio) {
    const C = T.postulaciones.columnas;
    const columnas = [[C.match, 'match', 'der'], [C.puesto, 'puesto', 'col-puesto'], [C.empresa, 'empresa', 'col-empresa'], [C.porque, 'porque', 'col-porque'],
      [C.requisitos, 'requisitos', 'col-requisitos'], [C.etapa, 'etapa', 'col-etapa'], [C.fecha, 'fecha', 'col-fecha']];
    return h('div', { class: 'tabla-caja tabla-postulaciones' }, h('table', { class: 'tabla' },
      h('thead', null, h('tr', null, columnas.map(([texto, clave, clase]) => Filtros.encabezado({ texto, clave, clase, activo: cambiado(clave), abierto: filtroAbierto === clave,
        titulo: F.boton(nombreFiltro(clave), resumen(clave)), alAbrir: (b) => abrirFiltro(clave, b, true) })), h('th', { scope: 'col', text: C.aviso }))),
      // Sin filas, una sola celda con el aviso de vacío, debajo de los encabezados. En Postula Terna, un cuerpo por grupo, con su
      // título y su ayuda en la primera fila; las filas de datos no cambian.
      vacio ? h('tbody', null, h('tr', null, h('td', { class: 'tabla-vacia', colspan: '8' }, vacio)))
        : grupos(vis).map((g) => h('tbody', { dataset: g.clave ? { grupo: g.clave } : null },
          g.texto ? h('tr', { class: 'grupo' }, h('th', { scope: 'rowgroup', colspan: '8' }, tituloDeGrupo(g, 'span'))) : null, g.lista.map(filaTabla)))));
  }
  function filaTabla(a) {
    const llega = Aviso.llega(a, umbral);
    const linea = Aviso.lineaCorta(a, config);
    const calificacion = Aviso.chipCalificacion(a);
    const idPuesto = Terna.idUnico('puesto');
    const acciones = accionesLista(a, idPuesto, true);
    const tr = h('tr', { tabindex: '0', dataset: { match: a.match_id, control: 'abrir', etapa: a.estado_postulacion } },
      h('td', { class: 'tabla-match' + (llega || a.match === null ? '' : ' bajo') }, h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, llega))),
      h('td', null, h('div', { class: 'aviso-puesto', id: idPuesto, text: a.puesto }), h('div', { class: 'atributos' },
        a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null, Aviso.lugar(a), a.modalidad ? ' · ' + T.avisos.modalidadMin[a.modalidad] : ''),
        // Cuando la caja no alcanza para la columna, "Por qué" baja acá (.apoyo-porque; diseno.md 0.33 §8.6).
        porQue(a) ? h('div', { class: 'linea-sugerencia apoyo-porque' }, chipPorQue(a)) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-porque' }, chipPorQue(a)),
      h('td', { class: 'col-requisitos' }, calificacion),
      // La etapa y, debajo, lo que se hace desde la fila (Revisar, o Marcar postulado en A mano): la acción al lado del estado que resuelve.
      h('td', { class: 'col-etapa' }, h('div', { class: 'etapa-chip' }, chipEtapa(a)), linea ? h('div', { class: 'traba', text: linea }) : null,
        acciones.length ? h('div', { class: 'etapa-acciones' }, acciones) : null),
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
  // Las opciones de un filtro de valores, con cuántas postulaciones deja ver cada una junto con los demás filtros, en la pestaña.
  function opcionesDe(k, valores, texto, valorDe) {
    const base = enVista(visibles().filter((a) => pasaFiltros(a, k)), vista);
    return valores.map((v) => ({ valor: v, texto: texto(v), n: base.filter((a) => valorDe(a) === v).length }));
  }
  function cuerpoFiltro(k) {
    const cambiar = (v) => { filtros[k] = v; aplicarFiltro(); };
    if (k === 'puesto' || k === 'empresa' || k === 'etapa') return Filtros.cuerpoTexto({ valor: filtros[k], alCambiar: cambiar });
    if (k === 'fecha') return Filtros.cuerpoFecha({ valor: filtros.fecha, alCambiar: cambiar });
    if (k === 'paquete' || k === 'requisitos' || k === 'porque') {
      const opciones = k === 'paquete' ? opcionesDe(k, PAQUETES, (v) => T.avisos.paquete[v], Aviso.estadoPaquete)
        : k === 'requisitos' ? opcionesDe(k, REQUISITOS, (v) => F.requisitos[v], categoriaRequisitos)
          : opcionesDe(k, POR_QUE, (v) => T.postulaciones.porQue.valores[v], porQue);
      return Filtros.cuerpoValores({ nombre: nombreFiltro(k), opciones, elegidos: filtros[k], todosTexto: k === 'porque' ? T.postulaciones.porQue.todos : F.todosColumna[k], alCambiar: cambiar });
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
  const CAMPOS = ['estado_postulacion', 'postulado_en', 'en_cola_en', 'motivo_a_mano', 'interes'];
  const foto = (a) => Object.fromEntries(CAMPOS.map((k) => [k, a[k]]));
  const restaurar = (a, f) => Object.assign(a, f);
  function aplicarLocal(a, nuevo) {
    const ahora = new Date().toISOString();
    a.estado_postulacion = nuevo;
    if (nuevo === 'postulado') a.postulado_en = a.postulado_en || ahora;
    if (nuevo === 'en_cola') a.en_cola_en = ahora;
    if (nuevo === 'pendiente') { a.postulado_en = null; a.en_cola_en = null; }
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
    actualizarVistas();
    dibujarLista();
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) { Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a)); marbeteFicha(abierta.el, a); }
  }
  // La cabecera de la ficha no se rehace: su marbete cambia en el lugar, así pasa de un color al otro (220 ms, solo el color) y el
  // foco y el desplazamiento no se mueven. Una pendiente no tiene marbete.
  function marbeteFicha(el, a) {
    const cabeza = el.querySelector('.hoja-cabecera .carpeta-cabeza');
    if (!cabeza) return;
    const viejo = cabeza.querySelector('.marbete');
    const nuevo = Aviso.marbete(a, { explicacion: true });
    if (viejo && nuevo) {
      viejo.className = nuevo.className;
      if (nuevo.title) viejo.title = nuevo.title; else viejo.removeAttribute('title');
      viejo.replaceChildren(...nuevo.childNodes);
    } else if (viejo) viejo.remove();
    else if (nuevo) cabeza.append(nuevo);
  }
  // Después de Deshacer: el foco vuelve al botón con el mismo texto que el que se tocó (si sigue estando), o al primero; sin ficha
  // abierta, a la postulación en la lista.
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

  /* ---------- Ficha de la postulación (§8.5) ----------
     La cabecera es una carpeta (Aviso.cabezaFicha): la lengüeta grande, que baja a «Por qué ajusta», y el marbete de la etapa, que
     es donde se dice el estado (una vez: PLAN-UX §3.4). El cuerpo empieza con los saltos: Paquete, Por qué ajusta y Requisitos. Desde
     PLAN-UX §3.4, sin el recorrido de cuatro puntos: en una postulada los cuatro estaban hechos y no decía nada que el marbete no
     dijera. El pie (las acciones) queda como estaba, con «No me interesa» chico. */
  // La sección «Por qué ajusta» de la ficha abierta (o la de requisitos, si no hay razones): adonde baja la lengüeta.
  let fichaPorQue = null;
  // La sección de lo que Terna va a responder (o respondió) de la ficha abierta: adonde lleva «Revisar».
  let fichaRespuestas = null;
  // Una sección plegada se abre al llegar a ella por un salto o por la lengüeta (con el botón de siempre, así queda su aria-expanded).
  function desplegar(sec) {
    const b = sec && sec.querySelector(':scope > .plegable-boton[aria-expanded="false"]');
    if (b) b.click();
  }
  function alPorQue() {
    const nodo = fichaPorQue;
    if (!nodo || !nodo.isConnected) return;
    const salto = nodo.id ? document.querySelector('.separador[aria-controls="' + nodo.id + '"]') : null;
    if (salto) { salto.click(); return; }
    desplegar(nodo);
    Aviso.bajarA(nodo);
  }
  // El CV y la carta de una postulación a mano, a la vista debajo de "Todo está listo" (PLAN-WEB.md §3.3). Abrir el aviso y marcar
  // postulado son los botones del pie, que en el celular queda justo debajo (revisión del 20/11, P1-3). Pasan el toque a los links del
  // paquete, que no piden otra firma; desde PLAN-UX §3.4 esos dos quedan escondidos (en el paquete de abajo, solo notas y salario).
  function docsAMano(a, paquete) {
    const docs = paquete ? [...paquete.querySelectorAll('.fichas-paquete a.ficha-doc')] : [];
    if (docs.length < 2) return null;
    const doc = (origen, texto) => {
      const l = h('a', { class: 'btn', href: origen.getAttribute('href') || '#', target: '_blank', rel: 'noopener noreferrer' }, icono('i-descargar'), texto);
      new MutationObserver(() => l.setAttribute('href', origen.getAttribute('href') || '#')).observe(origen, { attributes: true, attributeFilter: ['href'] });
      l.addEventListener('click', (e) => { e.preventDefault(); origen.click(); });
      return l;
    };
    const par = h('div', { class: 'par-docs docs-a-mano' }, doc(docs[0], T.avisos.ficha.cvPdf), doc(docs[1], T.avisos.ficha.cartaPdf));
    docs[0].hidden = true;
    docs[1].hidden = true;
    return par;
  }
  // `conCaptura` en false: la captura va más abajo (la ficha de una postulada). `paquete`: la sección del paquete, para el CV y la carta.
  function seccionEtapa(a, conCaptura, paquete) {
    const sec = h('section', { class: 'ficha-seccion' });
    // El chip de la etapa queda para el lector de pantalla y para el banco: a la vista, el estado lo dice el marbete de la cabecera.
    sec.append(h('div', { class: 'chips' }, chipEtapa(a), chipPorQue(a, false)));
    // Por qué está en tu lista, cuando no es lo de siempre: es de tus puestos, la pediste o quedó bajo tu umbral (diseno.md 0.33 §8.5).
    const k = porQue(a);
    if (k && k !== 'sobre_umbral') sec.append(h('p', { class: 'etapa-nota', text: explicacionPorQue(a, k) }));
    const linea = Aviso.lineaEtapa(a, config);
    // Cuántas veces lo intentó Terna (brand.md 0.28 §6.5; Francisco, 13/11/2026: «que los cuente en algún lado y diga la cantidad
    // de veces que lleva intentando»). Desde PLAN-UX §3.4, solo cuando sirve: si quedó a mano, o si fueron dos o más (en una enviada
    // al primer intento, «Terna lo intentó 1 vez» no decía nada). Cada intento después del primero lo pide Francisco desde Operación.
    const intentos = Number(a.intentos) || 0;
    const conIntentos = intentos > 0 && (a.estado_postulacion === 'a_mano' || intentos >= 2);
    // Cuando la línea de la etapa es la de los intentos ("Terna ya lo intentó 3 veces."), decía lo mismo que la de abajo ("Terna lo
    // intentó 3 veces."), una sobre otra (revisión del 20/11, P2-11): queda una sola, la de los intentos, en tinta.
    const repetida = conIntentos && linea === T.postulaciones.trabas.intentos_agotados(intentos);
    if (linea && !repetida) sec.append(h('p', { text: linea }));
    if (conIntentos) sec.append(h('p', { class: (repetida ? '' : 'suave ') + 'intentos', text: T.postulaciones.intentos(intentos) }));
    if (a.estado_postulacion === 'a_mano') {
      sec.append(h('p', { text: T.postulaciones.linea.todoListo }));
      const link = linkTraba(a);
      if (link) sec.append(h('p', null, link));
      const docs = docsAMano(a, paquete);
      if (docs) sec.append(docs);
    }
    if (a.estado_postulacion === 'enviada' && a.confirmacion_texto) sec.append(h('blockquote', { class: 'suave', text: a.confirmacion_texto }));
    if (a.captura_path && conCaptura !== false) sec.append(captura(a));
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
  // Desde brand.md 0.24 (0039): el secundario, su evidencia y viajar se completan en Preferencias › Postulación.
  const CAMPOS_PREFERENCIAS = { secundario_matematica: true, secundario_lengua: true, secundario_evidencia: true, viajar: true };
  function campoTraba(a) { return a.respuestas && a.respuestas.traba ? a.respuestas.traba.campo || null : null; }
  function linkTraba(a) {
    if (a.motivo_a_mano !== 'pregunta_sin_respuesta') return null;
    const campo = campoTraba(a);
    if (CAMPOS_SIN_LINK[campo]) return null;
    if (CAMPOS_PERFIL[campo]) return h('a', { href: 'perfil.html#' + CAMPOS_PERFIL[campo], text: T.postulaciones.completarPerfil });
    if (CAMPOS_PREFERENCIAS[campo]) return h('a', { href: 'preferencias.html#postulacion', text: T.postulaciones.completarPreferencias });
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
  function seccionPaquete(a, notasAbiertas) {
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: T.avisos.ficha.paquete }));
    if (a.paquete_id) sec.append(Aviso.fichasPaquete(Object.assign({}, a, { terminos_faltantes: faltanPor.get(a.match_id) || [] }), { notasAbiertas }));
    else sec.append(h('p', { text: a.estado_paquete === 'pedido' ? T.avisos.ficha.loArma : a.estado_paquete === 'no_se_pudo_armar' ? T.avisos.ficha.noSePudo : T.avisos.ficha.sinDocs }));
    return sec;
  }
  function seccionRespuestas(a) {
    const campos = a.respuestas && Array.isArray(a.respuestas.campos) ? a.respuestas.campos.slice(0, 20) : [];
    if (!campos.length) return null;
    const dl = h('dl', { class: 'respuestas' });
    for (const c of campos) {
      // brand.md 0.4.9 §6.5: una pregunta cerrada que Terna contestó que no (el perfil no muestra con qué decir que sí) se marca
      // para que la persona la mire antes de "Enviar". Una declaración suya (sus palabras, sin IA) no lleva nota: desde brand.md
      // 0.25 Terna la responde que sí y envía, y lo dice la ayuda de "Aceptar los consentimientos".
      const nota = c.revisar === true && a.estado_postulacion === 'para_revisar' ? h('p', { class: 'campo-ayuda', text: T.postulaciones.revisarRespuesta }) : null;
      dl.append(h('div', null, h('dt', { text: c.etiqueta || '' }), h('dd', { text: c.valor ? c.valor : T.postulaciones.sinRespuesta }), nota));
    }
    const texto = campos.map((c) => (c.etiqueta || '') + ': ' + (c.valor || T.postulaciones.sinRespuesta)).join('\n');
    return h('section', { class: 'ficha-seccion seccion-respuestas' },
      h('div', { class: 'interruptor-fila' }, h('h3', { text: a.estado_postulacion === 'para_revisar' ? T.postulaciones.vaAResponder : T.postulaciones.respondio }),
        h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => Terna.copiar(texto, dl) }, icono('i-pegar'), T.postulaciones.copiarRespuestas)),
      dl);
  }
  // El texto del aviso, en una postulada (brand.md 0.22 §6.5; diseno.md 0.34 §8.5; Francisco, 12/11/2026: «lo que vos creas mejor y
  // implementa»): plegado, y traído recién al abrirlo, de avisos.texto (lo que leyó Terna) o de matches.texto_pegado (lo que pegó la
  // persona hasta brand.md 0.22 o, desde 0.23, Francisco desde Admin; datos.md 0.34, 0038), que RLS deja leer a quien tiene el match
  // (datos.md 0.33.5 §14). Sirve para preparar la entrevista aunque el link ya no abra. Es dato, no instrucción: va con textContent,
  // sin links.
  function seccionTextoAviso(a) {
    if (!a.tiene_texto) return null;
    const X = T.postulaciones.textoAviso;
    const delUsuario = a.texto_origen === 'usuario';
    const cuerpo = h('div', { class: 'ficha-seccion-cuerpo', id: Terna.idUnico('pleg') });
    cuerpo.hidden = true;
    let traido = false;
    async function traer() {
      traido = true;
      cuerpo.replaceChildren(h('p', { class: 'suave', role: 'status', text: T.comun.cargando }));
      const r = delUsuario
        ? await sb.from('matches').select('texto_pegado').eq('id', a.match_id).maybeSingle()
        : await sb.from('avisos').select('texto').eq('id', a.aviso_id).maybeSingle();
      if (r.error) {
        traido = false;
        // Para diagnosticar desde la consola: el tipo y el mensaje, nunca el texto.
        console.error('[Terna]', r.error.name, r.error.code || '', r.error.message);
        cuerpo.replaceChildren(
          h('div', { class: 'banda banda-error', role: 'alert' }, icono('i-alerta'), h('span', { text: X.error })),
          h('button', { class: 'btn btn-chico', type: 'button', onclick: traer }, T.comun.probarDeNuevo));
        return;
      }
      const texto = String((r.data && (delUsuario ? r.data.texto_pegado : r.data.texto)) || '').trim();
      cuerpo.replaceChildren(
        h('p', { class: 'suave', text: delUsuario ? X.ayudaUsuario : X.ayudaFuente }),
        texto ? h('div', { class: 'texto-aviso', text: texto }) : h('p', { text: X.vacio }));
    }
    const boton = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': 'false', 'aria-controls': cuerpo.id,
      onclick: () => {
        const abrir = boton.getAttribute('aria-expanded') !== 'true';
        boton.setAttribute('aria-expanded', String(abrir));
        cuerpo.hidden = !abrir;
        if (abrir && !traido) traer();
      } }, h('span', { text: X.titulo }), icono('i-chevron'));
    return h('section', { class: 'ficha-seccion seccion-texto-aviso' }, boton, cuerpo);
  }
  // Una postulada es adonde se vuelve si llaman para una entrevista (brand.md 0.21 §6.5; Francisco, 12/11/2026: "entra, se fija y ve
  // el paquete que le armó específico para esa entrevista"): después de la etapa, el paquete con las notas abiertas; el texto del
  // aviso, plegado (desde diseno.md 0.34); lo que Terna respondió y, al final, la captura.
  // Arriba de todo, los saltos (Aviso.saltos): uno por sección que exista, y la que estaba plegada se abre al llegar.
  function cuerpoFicha(a) {
    const paquete = seccionPaquete(a, hecha(a));
    const razones = Aviso.razones(a, true);
    const tituloDe = (s) => { const t = s.querySelector(':scope > .plegable-boton > span, :scope > h3'); return t ? t.textContent : ''; };
    const porQueSec = razones.find((s) => tituloDe(s) === T.avisos.ficha.porQue) || null;
    const requisitos = razones.find((s) => tituloDe(s) === T.avisos.ficha.requisitos) || null;
    fichaPorQue = porQueSec || requisitos;
    const secciones = [{ nodo: paquete, texto: T.avisos.columnas.paquete }, { nodo: porQueSec, texto: T.avisos.ficha.porQue },
      { nodo: requisitos, texto: T.avisos.ficha.requisitos }].filter((x) => x.nodo);
    const tira = Aviso.saltos(secciones);
    if (tira) tira.querySelectorAll('.separador').forEach((b, i) => b.addEventListener('click', () => desplegar(secciones[i].nodo)));
    const respuestas = seccionRespuestas(a);
    fichaRespuestas = respuestas;
    if (hecha(a)) {
      return [tira, seccionEtapa(a, false), paquete, seccionTextoAviso(a), respuestas, a.captura_path ? captura(a) : null, ...razones];
    }
    return [tira, seccionEtapa(a, true, paquete), paquete, respuestas, ...razones];
  }
  function accionesFicha(a) {
    const B = T.postulaciones.botones;
    const H = T.postulaciones.hecho;
    const b = (texto, iconoId, fn, clase) => h('button', { class: clase || 'btn', type: 'button', onclick: fn }, iconoId ? icono(iconoId) : null, texto);
    // «No me interesa», chico, al pie de toda ficha (PLAN-UX §2.3).
    const noInteresa = Aviso.interes(a, { forma: 'chico', alCambiar: () => noMeInteresa(a) });
    const cont = h('div', { class: 'botones' });
    const notas = [];
    switch (a.estado_postulacion) {
      case 'a_mano':
        // Desde operacion.md 0.2 (0054; Francisco, 20/11/2026): «Volver a probar» es de Operación. La persona ve la traba como
        // siempre y le queda postular a mano; la falla le llega a Francisco, que la vuelve a probar desde ops.html.
        cont.append(Aviso.abrirAviso(a, null, prefs), b(B.marcarPostulado, 'i-tilde', () => conDeshacer(a, 'postulado', H.postulado)), noInteresa);
        break;
      case 'para_revisar':
        cont.append(b(B.enviar, 'i-enviar', () => conDeshacer(a, 'en_cola', H.aprobada), 'btn btn-primario'),
          b(B.postularYo, 'i-a-mano', () => enElActo(a, 'a_mano', H.aMano)), noInteresa);
        break;
      // En cola, enviada o postulada no queda nada para hacer afuera: "Abrir aviso" va como secundario (PLAN-WEB.md §3.2; revisión
      // del 20/11, P2-4). Mismo link, misma acción.
      case 'en_cola':
        cont.append(Aviso.abrirAviso(a, 'btn btn-ancho', prefs), b(B.cancelarEnvio, null, () => enElActo(a, 'pendiente', H.cancelado)), noInteresa);
        break;
      case 'enviada':
        cont.append(Aviso.abrirAviso(a, 'btn btn-ancho', prefs), noInteresa);
        break;
      case 'postulado':
        cont.append(Aviso.abrirAviso(a, 'btn btn-ancho', prefs), b(B.volverAPendiente, null, () => enElActo(a, 'pendiente', H.pendiente)), noInteresa);
        break;
      default:
        cont.append(Aviso.abrirAviso(a, null, prefs), b(B.marcarPostulado, 'i-tilde', () => conDeshacer(a, 'postulado', H.postulado)), noInteresa);
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
    // Al cerrar, el foco vuelve a lo que la abrió; si la lista se redibujó mientras tanto (se envió, se marcó), a la postulación.
    const volver = () => (origen && origen.isConnected ? origen : lista.querySelector('[data-match="' + a.match_id + '"]'));
    Terna.abrirHoja({ cabecera: Aviso.cabezaFicha({ a, idTitulo, umbral, alPorQue }), idTitulo, cuerpo: cuerpoFicha(a), acciones: accionesFicha(a), enLinea: true,
      origen: volver, clave: a.match_id,
      alCerrar: (porUsuario) => { marcarElegida(); if (porUsuario) limpiarHash(); } });
    marcarElegida();
  }
  function limpiarHash() {
    if (!/^#postulacion-/.test(location.hash)) return;
    if (history.state && history.state.ficha) history.back();
    else history.replaceState(null, '', location.pathname + '#' + HASH[vista]);
  }
  // El hash dice la pestaña (tabla de PLAN-UX §3.4); "#bajo-umbral", la etapa de antes, además llega con "Tu umbral" sin marcar; y
  // el de una ficha (el link "Ver en Postulaciones" de Paquetes) llega a la pestaña de esa postulación, con su ficha. Sin hash, la
  // pestaña no cambia: al entrar es Postuladas (D1). Devuelve si cambió algo.
  function leerHash() {
    const hash = (location.hash || '').slice(1);
    let cambio = false;
    const elegir = (v) => { if (v !== vista) { vista = v; cambio = true; } };
    const destildar = () => { if (soloSugeridas) { soloSugeridas = false; cambio = true; } };
    if (hash === 'bajo-umbral') destildar();
    if (DE_HASH[hash]) elegir(DE_HASH[hash]);
    if (DE_HASH_LO_QUE_FALTA.has(hash)) elegir(enVista(visibles(), 'a_mano').length ? 'a_mano' : 'terna');
    const m = /^postulacion-([0-9a-f-]{36})$/i.exec(hash);
    const a = m ? porId.get(m[1]) : null;
    if (a && !(quedo(a) && bajoPiso(a))) {
      elegir(vistaDe(a));
      if (quedo(a)) destildar();
    }
    return cambio;
  }
  function sincronizarHash() {
    const m = /^#postulacion-([0-9a-f-]{36})$/i.exec(location.hash);
    const abierta = Terna.hojaAbierta();
    if (m) {
      const a = porId.get(m[1]);
      // Lo que quedó debajo del piso no se muestra en ningún lado: tampoco con el link de su ficha. La de otra pestaña (un link a la
      // ficha sin volver a cargar la página) llega a su pestaña, como al entrar.
      if (a && !(quedo(a) && bajoPiso(a)) && (!abierta || abierta.clave !== a.match_id)) {
        if (leerHash()) dibujar();
        abrirFicha(a, null, true);
      }
      return;
    }
    if (abierta && abierta.clave) Terna.cerrarHoja(false);
    if (leerHash()) dibujar();
  }
  window.addEventListener('popstate', sincronizarHash);
  document.addEventListener('terna:cambio-diseno', () => dibujarLista());
  document.addEventListener('terna:cambio-ancho', () => {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) { Terna.cerrarHoja(false); abrirFicha(porId.get(abierta.clave), null, true); }
  });

  leerHash();
  armarVistas();
  armarBarra();
  dibujar();
  sincronizarHash();
});
