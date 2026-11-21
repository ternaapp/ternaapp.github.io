/* Terna · js/avisos.js
   Paquetes (avisos.html; hasta PLAN-UX, «Avisos», diseno.md §7): lo que Terna te arma, en dos pestañas (PLAN-UX §3.2 y §10, 21/11/2026).
   - Armados, la de entrada: todo lo que tiene paquete (decisión D2), por cuándo se armó (Hoy, Esta semana, Antes; arriba, en rojo, lo
     que no se pudo armar). Cada carpeta trae su fila de documentos (CV, Carta, Notas, salario), cuándo se armó y «Ver en
     Postulaciones». Acá se miran los documentos: no hay control de interés, ni «Marcar postulado», ni «Enviar» (se postula en
     Postulaciones, PLAN-UX §2.4 punto 4).
   - Por armar: la cola que se maneja. Te toca decidir (el único lugar con Me interesa y No me interesa), Tus pedidos (#proximos, el
     «Próximos paquetes» de antes, con Subir, Bajar y Cancelar y, encima, el cupo), Después sigue Terna (más o menos en el orden del
     motor), Esperan (sin texto o sin match) y, plegado, lo que Terna no arma sola (bajo tu umbral o fuera de tus preferencias), con
     Pedir paquete. Cada fila dice dónde se postula.
   Cada número una sola vez, en su pestaña o en su grupo: salen la cuenta del título, las partes, «En los últimos 30 días» y la franja
   Todos / Esta semana. Las preferencias de búsqueda y el umbral ya no esconden: ordenan (js/lista.js, grupoDe); lo que la persona
   cambia en los filtros, sí filtra. La ficha va en dos órdenes: en Armados, el paquete primero; en Por armar, por qué ajusta.
   Lee mis_avisos (desde PLAN-UX también armado_en, que ya leen Postulaciones y js/cuentas.js), preferencias (la fila entera),
   paquetes (solo contenido→render→bajo_minimo y →terminos_faltantes), corridas_usuarios (la última fecha) y config; escribe con
   marcar_interes, marcar_motivo_no_interesa (0025), pedir_paquete, cancelar_pedido y ordenar_pedidos (0029), como antes. Sin 0025
   la página anda sin motivo; sin 0029, Tus pedidos va sin Subir ni Bajar (Aviso.leerConEvaluacion, comprobarOrdenar).
   Las cuentas del muelle y del carril van con Terna.cuentaPaquetes (decisión D3): lila, los paquetes nuevos desde la última visita a
   Armados (Lista.paquetesNuevos); ámbar, lo que te toca decidir. */
'use strict';

Terna.pagina('avisos', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const lista = document.getElementById('lista');
  const herramientas = document.getElementById('herramientas');
  const cajaFiltros = document.getElementById('filtros');
  const cajaProximos = document.getElementById('proximos');
  const cajaVistas = document.getElementById('vistas');
  const irBusqueda = document.getElementById('ir-busqueda');
  const contenido = document.getElementById('contenido');
  const COLUMNAS = 'match_id, aviso_id, puesto, empresa, ubicacion, pais, modalidad, alcance, url, url_postulacion, fuente, postulacion, ats_formulario, dudoso, publicado_en, visto_en, tiene_texto, texto_origen, match, razones, requisitos_faltantes, interes, estado_paquete, pedido_en, creado_en, nuevo, paquete_id, paquete_idioma, armado_en, cv_path, carta_path, salario_monto, salario_moneda, salario_periodo, salario_motivo, notas, estado_postulacion, motivo_a_mano, traba_detalle, intentos, en_cola_en, enviada_en, postulado_en, entrevista_en, nivel, jornada';

  lista.classList.add('lista-paquetes');
  const parar = Terna.cargando(lista);
  const [rA, rP, rB, rC] = await Promise.all([
    Aviso.leerConEvaluacion((cols) => sb.from('mis_avisos').select(cols), COLUMNAS),
    // La fila entera: trae lo de cada migración que esté aplicada (0027: priorizar_puestos), y sin ella no falla.
    sb.from('preferencias').select('*').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo, terminos_faltantes:contenido->render->terminos_faltantes'),
    // La última corrida: si Terna ya corrió y, desde PLAN-UX §6.3, el piso de los paquetes nuevos.
    sb.from('corridas_usuarios').select('fecha').eq('usuario_id', ctx.usuario.id).order('fecha', { ascending: false }).limit(1),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rB.error || rC.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  const avisos = rA.data || [];
  const conMotivo = rA.conEvaluacion;  // 0025 aplicada: se puede decir por qué no interesa
  const porId = new Map(avisos.map((a) => [a.match_id, a]));
  const prefs = rP.data || { umbral: 70, interes_por_defecto: true, armar_paquetes: true, paquetes_por_dia: 3, salario_modo: 'sugerir' };
  const umbral = prefs.umbral;
  const piso = config.piso_match || 50;
  // Paquetes por corrida: siempre 3 desde 0028 (datos.md 0.24); el cupo del día lo comparten las corridas de ese día.
  const cupo = prefs.paquetes_por_dia || config.paquetes_por_dia_default || 3;
  const conMinimo = new Set((rB.data || []).filter((p) => p.bajo_minimo === true).map((p) => p.match_id));
  // Palabras del aviso que el CV no tiene (cv-ats.md 0.4 §3.13): el motor las guarda en el paquete desde paquete.v3.
  const faltanPor = new Map((rB.data || []).filter((p) => Array.isArray(p.terminos_faltantes)).map((p) => [p.match_id, p.terminos_faltantes]));
  const ultimaCorrida = (rC.data || [])[0] ? rC.data[0].fecha : null;
  const yaCorrio = !!ultimaCorrida;
  // Lo tuyo (tus puestos, 0027, y las empresas que seguís, 0034) con la regla del motor, la misma que usa Inicio para contar; y desde
  // PLAN-UX, la pestaña y el grupo de cada aviso (js/lista.js).
  const seguidas = Lista.seguidasDe(rP.data);
  const loTuyo = Lista.crear(avisos, { prefs, piso, seguidas: seguidas.filas });
  const criterio = loTuyo.criterio;
  const grupoDe = loTuyo.grupoDe;
  const pestanaDe = Lista.pestanaDe;
  // El orden "Tus puestos primero" es solo de los puestos: los avisos de las empresas que seguís van por match (Francisco, 07/11/2026).
  const priorizar = criterio.puestos.length > 0;
  const conTuyos = criterio.puestos.length > 0 || criterio.empresas.length > 0;
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);

  /* ---------- Filtros y orden (diseno.md 0.11 §7.2; desde 0.21, también por columna) ----------
     Los filtros son los de antes y valen para las dos pestañas, menos dos: Paquete es solo de Por armar (lo armado es la otra
     pestaña) y Postulación solo de Armados (lo que está por armar no tiene postulación). Modalidad, Alcance, Nivel y Jornada muestran
     las preferencias de búsqueda del momento y Match el umbral, pero desde PLAN-UX §3.2 no esconden nada mientras la persona no los
     cambie: lo que queda fuera de las preferencias o debajo del umbral va al grupo plegado «Ver N que Terna no arma sola» (y lo
     armado, a Armados, que muestra todo). Un filtro cambiado se recuerda en el navegador mientras las preferencias sigan iguales
     (`huella`); si cambian, vuelve a ellas. En el celular todo va en la hoja del botón único «Filtrar» (Filtros.botonUnico). */
  const INTERESES = ['me_interesa', 'por_decidir', 'no_me_interesa'];
  // Paquete, en Por armar: lo armado está en la otra pestaña y lo pedido en Tus pedidos.
  const PAQUETES = ['sin_armar', 'sin_texto', 'por_puntuar'];
  const POSTULACIONES = ['pendiente', 'en_cola', 'para_revisar', 'enviada', 'a_mano', 'postulado'];
  const DONDES = Aviso.DONDES;  // diseno.md 0.23 §7.6: Postula Terna; a mano en LinkedIn, en el sitio de la empresa o en un portal; LinkedIn, a confirmar
  const REQUISITOS = Aviso.REQUISITOS;
  const PRIORIDADES = [...(criterio.puestos.length ? ['tu_puesto'] : []), ...(criterio.empresas.length ? ['empresa'] : []), 'demas'];
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const DE_COLUMNA = ['puesto', 'empresa', 'ubicacion', 'publicado'];
  const CLAVES = ['modalidad', 'alcance', 'nivel', 'jornada', 'match', 'requisitos', ...(conTuyos ? ['prioridad'] : []), 'interes', 'paquete', 'postulacion', 'donde', ...DE_COLUMNA];
  const CLAVES_DE = { armados: CLAVES.filter((k) => k !== 'paquete'), por_armar: CLAVES.filter((k) => k !== 'postulacion') };
  const aplica = (k, p) => CLAVES_DE[p].includes(k);
  const TODOS = Object.assign({ interes: INTERESES }, Aviso.TODOS_BUSQUEDA);
  const busquedaPrefs = Aviso.busquedaDe(prefs);
  const huella = JSON.stringify([busquedaPrefs, umbral]);
  const INTERES_INICIAL = ['me_interesa', 'por_decidir'];
  const inicial = () => ({ modalidad: null, alcance: null, nivel: null, jornada: null, matchMin: null, bajoUmbral: false, soloBajo: false,
    requisitos: null, prioridad: null,
    interes: INTERES_INICIAL.slice(), paquete: null, postulacion: null, donde: null, puesto: '', empresa: '', ubicacion: null, publicado: null,
    puestoExacto: false, empresaExacta: false });
  const mismos = (x, y) => x.length === y.length && x.every((v) => y.includes(v));
  const deLista = (v, todos) => { if (!Array.isArray(v)) return null; const l = todos.filter((x) => v.includes(x)); return l.length ? l : null; };
  // Un filtro de búsqueda igual a las preferencias se guarda como null: "según tus preferencias".
  const propio = (k, l) => (!l || mismos(l, busquedaPrefs[k]) ? null : l);
  // Hasta 0.21 Paquete y Postulación eran uno solo ('todos', 'armado'…): se leen como lista. Un valor que ya no está (Armado,
  // Pedido, No se pudo armar, desde PLAN-UX) no cuenta.
  const unoOVarios = (v, todos) => (Array.isArray(v) ? Filtros.listaValida(v, todos) : (todos.includes(v) ? [v] : null));
  function validos(f) {
    const r = inicial();
    if (!f || typeof f !== 'object') return r;
    r.interes = deLista(f.interes, INTERESES) || r.interes;
    r.paquete = unoOVarios(f.paquete, PAQUETES);
    r.postulacion = unoOVarios(f.postulacion, POSTULACIONES);
    r.donde = Filtros.listaValida(f.donde, DONDES);
    r.requisitos = Filtros.listaValida(f.requisitos, REQUISITOS);
    // Una prioridad guardada que ya no existe (la persona dejó de seguir empresas o apagó "Priorizar mis puestos") no cuenta.
    r.prioridad = conTuyos ? Filtros.listaValida(f.prioridad, PRIORIDADES) : null;
    r.puesto = Filtros.textoValido(f.puesto);
    r.empresa = Filtros.textoValido(f.empresa);
    // Desde un link de Inicio (diseno.md 0.26 §6), Puesto y Empresa son exactos: la regla del motor, sin el texto contenido.
    r.puestoExacto = f.puestoExacto === true && !!r.puesto;
    r.empresaExacta = f.empresaExacta === true && !!r.empresa;
    r.ubicacion = Filtros.listaValida(f.ubicacion, null);
    r.publicado = Filtros.fechaValida(f.publicado);
    // Los filtros guardados antes de la barra (sin `v`) conservan el match: significaba lo mismo.
    const legado = !(f.v >= 2);
    if (legado || f.huella === huella) {
      r.matchMin = Number.isInteger(f.matchMin) ? f.matchMin : null;
      r.soloBajo = f.soloBajo === true;
      r.bajoUmbral = f.bajoUmbral === true && !r.soloBajo;
    }
    if (!legado && f.huella === huella) for (const k of BUSQUEDA) r[k] = propio(k, deLista(f[k], TODOS[k]));
    return r;
  }
  const guardados = Terna.leerLocal('avisos.filtros', null);
  let filtros = validos(guardados);
  // Si las preferencias cambiaron, lo que la persona había cambiado sobre las de antes se olvida también en el navegador.
  if (guardados && guardados.huella !== huella) guardarFiltros();
  const q = new URLSearchParams(location.search);
  if (q.get('interes') === 'por_decidir') filtros = Object.assign(inicial(), { interes: ['por_decidir'] });
  if (q.get('paquete') === 'sin_texto') filtros = Object.assign(inicial(), { paquete: ['sin_texto'] });
  // Los links de Inicio (diseno.md 0.26 §6): una empresa, un puesto o dónde se postula, sobre la lista de entrada.
  if (q.get('empresa')) filtros = Object.assign(inicial(), { empresa: Filtros.textoValido(q.get('empresa')), empresaExacta: true });
  if (q.get('puesto')) filtros = Object.assign(inicial(), { puesto: Filtros.textoValido(q.get('puesto')), puestoExacto: true });
  if (DONDES.includes(q.get('donde'))) filtros = Object.assign(inicial(), { donde: [q.get('donde')] });
  // El orden elegido se recuerda mientras "Priorizar mis puestos" siga igual (diseno.md 0.18 §7.2). Desde PLAN-UX ordena Por armar;
  // Armados va siempre por cuándo se armó.
  const ORDENES = priorizar ? ['puestos', 'match', 'nuevos'] : ['match', 'nuevos'];
  function ordenInicial() {
    const g = Terna.leerLocal('avisos.orden', null);
    const elegido = typeof g === 'string' ? { orden: g, priorizar: false } : (g && typeof g === 'object' ? g : null);
    const valido = !!elegido && ORDENES.includes(elegido.orden);
    if (valido && elegido.priorizar === priorizar) return elegido.orden;
    if (priorizar) return 'puestos';
    return valido ? elegido.orden : 'match';
  }
  let orden = ordenInicial();
  function guardarOrden() { Terna.guardarLocal('avisos.orden', { orden, priorizar }); }
  function guardarFiltros() { Terna.guardarLocal('avisos.filtros', Object.assign({ v: 3, huella }, filtros)); }

  const efectiva = (k) => filtros[k] || busquedaPrefs[k];
  // Lo que filtra de la búsqueda: solo lo que la persona cambió acá (lo que dejó en sus preferencias no esconde nada).
  function busquedaElegida() { const b = {}; for (const k of BUSQUEDA) b[k] = filtros[k] || TODOS[k]; return b; }
  // Match según el umbral (diseno.md 0.32 §7.2): los que llegan, también los que no llegan, o solo los que no llegan. `topeBajo` es
  // el match más alto que no llega al umbral.
  const modoUmbral = () => (filtros.soloBajo ? 'solo' : filtros.bajoUmbral ? 'tambien' : 'llegan');
  const topeBajo = Math.max(piso, umbral - 1);
  function minimo() {
    if (filtros.soloBajo) return Math.max(piso, Math.min(filtros.matchMin === null ? piso : filtros.matchMin, topeBajo));
    const m = filtros.matchMin === null ? umbral : filtros.matchMin;
    return filtros.bajoUmbral ? Math.max(piso, Math.min(m, 100)) : Math.max(m, umbral);
  }
  // Un aviso sin match se ve siempre, salvo cuando se piden solo los que no llegan. Sin tocar Match se ve todo desde el piso (lo que
  // no llega va plegado); con Match cambiado, la regla de antes: lo tuyo desde el piso y lo pedido mientras no se suba el mínimo.
  function pasaMatch(a) {
    if (a.match === null || a.match === undefined) return !filtros.soloBajo;
    if (!cambiado('match')) return a.match >= piso;
    if (filtros.soloBajo) return a.match >= minimo() && a.match < umbral;
    return a.match >= minimo() || loTuyo.prioritario(a) || (loTuyo.pedido(a) && filtros.matchMin === null);
  }
  // Prioridad: un aviso puede ser de tus puestos y de una empresa que seguís a la vez; "Los demás" son los que no son ni lo uno ni lo otro.
  const enPrioridad = (a, v) => (v === 'tu_puesto' ? loTuyo.esTuPuesto(a) : v === 'empresa' ? loTuyo.esTuEmpresa(a) : !loTuyo.prioritario(a));
  const fechaDe = (a) => a.publicado_en || a.visto_en;
  let busquedaHoy = busquedaElegida();
  // `excepto`: todos los filtros menos ese (para contar las opciones de un filtro con lo que dejan pasar los demás). Un filtro que no
  // es de la pestaña del aviso no lo toca.
  function pasa(a, excepto) {
    const p = pestanaDe(a);
    const usa = (k) => excepto !== k && aplica(k, p);
    if (usa('interes') && !filtros.interes.includes(a.interes)) return false;
    if (usa('paquete') && filtros.paquete && !filtros.paquete.includes(Aviso.estadoPaquete(a))) return false;
    if (usa('postulacion') && filtros.postulacion && !filtros.postulacion.includes(a.estado_postulacion)) return false;
    if (usa('donde') && filtros.donde && !filtros.donde.includes(Aviso.donde(a, prefs).clave)) return false;
    if (!Aviso.pasaBusqueda(a, busquedaHoy)) return false;
    if (!pasaMatch(a)) return false;
    if (excepto !== 'requisitos' && filtros.requisitos && !filtros.requisitos.includes(Aviso.categoriaRequisitos(a))) return false;
    if (excepto !== 'prioridad' && filtros.prioridad && !filtros.prioridad.some((v) => enPrioridad(a, v))) return false;
    if (excepto !== 'puesto' && !(filtros.puestoExacto ? loTuyo.esElPuesto(a, filtros.puesto) : loTuyo.dePuesto(a, filtros.puesto))) return false;
    if (excepto !== 'empresa' && !(filtros.empresaExacta ? loTuyo.esLaEmpresa(a, filtros.empresa) : loTuyo.deEmpresa(a, filtros.empresa))) return false;
    if (excepto !== 'ubicacion' && filtros.ubicacion && !filtros.ubicacion.includes(Aviso.lugar(a))) return false;
    if (excepto !== 'publicado' && !Filtros.pasaFecha(fechaDe(a), filtros.publicado)) return false;
    return true;
  }
  // Fuera de las preferencias (no del filtro): Terna no lo decide sola; va a «Ver N que Terna no arma sola», con Pedir paquete.
  const fuera = (a) => Aviso.motivosFuera(a, busquedaPrefs);
  const esTuPuesto = (a) => !!Aviso.tuPuesto(a, criterio);
  const bajo = (a) => a.match !== null && a.match !== undefined && !Aviso.llega(a, umbral);
  function chipTuPuesto(a) {
    // "Tu puesto" y, desde 0034, "Empresa que seguís" (brand.md 0.13 §6.4): null, un chip o los dos.
    const chips = [];
    if (esTuPuesto(a)) {
      const explicacion = T.avisos.tuPuestoExplicacion(Aviso.tuPuesto(a, criterio), Aviso.llega(a, umbral));
      chips.push(h('span', { class: 'chip-texto tinta tu-puesto', title: explicacion }, icono('i-foco', 'icono-14'), h('span', { text: T.avisos.tuPuesto }), oculto(': ' + explicacion)));
    }
    const empresa = Aviso.tuEmpresa(a, criterio);
    if (empresa) {
      const explicacion = T.avisos.tuEmpresaExplicacion(empresa, Aviso.llega(a, umbral));
      chips.push(h('span', { class: 'chip-texto tinta tu-empresa', title: explicacion }, icono('i-empresa', 'icono-14'), h('span', { text: T.avisos.tuEmpresa }), oculto(': ' + explicacion)));
    }
    return chips.length ? (chips.length === 1 ? chips[0] : chips) : null;
  }
  const desc = (x, y) => (x === y ? 0 : (x === null || x === undefined) ? 1 : (y === null || y === undefined) ? -1 : (x < y ? 1 : -1));
  function comparar(a, b) {
    if (orden === 'nuevos') return desc(a.publicado_en, b.publicado_en) || desc(a.visto_en, b.visto_en);
    if (orden === 'puestos' && esTuPuesto(a) !== esTuPuesto(b)) return esTuPuesto(a) ? -1 : 1;
    return desc(a.match, b.match) || (a.dudoso === b.dudoso ? 0 : a.dudoso ? 1 : -1)
      || desc(a.publicado_en, b.publicado_en) || desc(a.creado_en, b.creado_en);
  }
  // «Después sigue Terna», como elige el motor hasta donde la web lo sabe (pipeline.md §4.9): tus puestos primero (si los priorizás y
  // el orden es ese), después donde postula Terna (si «Terna postula por vos» está en Sí), después por match. Con «Más nuevos», por fecha.
  const postulaTerna = (a) => prefs.postular_sola !== false && Aviso.donde(a, prefs).clave === 'terna';
  function compararSigue(a, b) {
    if (orden === 'nuevos') return comparar(a, b);
    if (orden === 'puestos' && esTuPuesto(a) !== esTuPuesto(b)) return esTuPuesto(a) ? -1 : 1;
    if (postulaTerna(a) !== postulaTerna(b)) return postulaTerna(a) ? -1 : 1;
    return desc(a.match, b.match) || desc(a.publicado_en, b.publicado_en) || desc(a.creado_en, b.creado_en);
  }
  // Armados: lo de hoy primero, por cuándo se armó; lo que no se sabe (archivos vencidos), al final.
  const instanteArmado = (a) => (a.armado_en ? Date.parse(a.armado_en) || 0 : 0);
  const compararArmado = (a, b) => (instanteArmado(b) - instanteArmado(a)) || desc(a.match, b.match);
  const COMPARAR = { no_se_pudo: compararArmado, hoy: compararArmado, semana: compararArmado, antes: compararArmado, sigue: compararSigue };

  function cambiado(k) {
    if (BUSQUEDA.includes(k)) return filtros[k] !== null;
    if (k === 'match') return filtros.soloBajo || minimo() !== umbral;
    if (k === 'interes') return !mismos(filtros.interes, INTERES_INICIAL);
    if (k === 'puesto' || k === 'empresa') return Filtros.hayTexto(filtros[k]);
    return filtros[k] !== null;  // requisitos, prioridad, paquete, postulación, dónde se postula, ubicación, publicado
  }
  const clavesHoy = () => CLAVES_DE[pestana];
  const algoCambiado = () => clavesHoy().some(cambiado);
  const F = T.avisos.filtros;
  const nombreFiltro = (k) => F.nombres[k] || F.columnas[k];
  function nombreDe(k, v) {
    if (k === 'nivel') return T.preferencias.nivel[v];
    if (k === 'jornada') return T.preferencias.jornada[v];
    return T.avisos[k][v];
  }
  // "Remoto", "Remoto y Híbrido", "sin Pasantía", "3 de 6", "Todas".
  function resumenLista(k, l) { return Filtros.resumenLista(l, TODOS[k], (v) => nombreDe(k, v), F.todosDe[k]); }
  const todasUbicaciones = () => Array.from(new Set(avisos.map(Aviso.lugar))).sort((x, y) => x.localeCompare(y, 'es'));
  function resumen(k) {
    if (k === 'match') {
      if (filtros.soloBajo) return minimo() <= piso ? T.avisos.bajoUmbral : F.matchResumenSolo(minimo(), topeBajo);
      return conTuyos ? F.matchResumenTuyos(minimo(), criterio.puestos.length > 0, criterio.empresas.length > 0) : F.matchResumen(minimo());
    }
    if (k === 'requisitos') return Filtros.resumenLista(filtros.requisitos, REQUISITOS, (v) => F.requisitos[v], F.todosColumna.requisitos);
    if (k === 'prioridad') return Filtros.resumenLista(filtros.prioridad, PRIORIDADES, (v) => F.prioridad[v], F.todosColumna.prioridad);
    if (k === 'paquete') return Filtros.resumenLista(filtros.paquete, PAQUETES, (v) => T.avisos.paquete[v], F.todos);
    if (k === 'postulacion') return Filtros.resumenLista(filtros.postulacion, POSTULACIONES, (v) => T.avisos.postulacion[v], F.todas);
    if (k === 'donde') return Filtros.resumenLista(filtros.donde, DONDES, (v) => T.avisos.dondeFiltro[v], F.todosColumna.donde);
    if (k === 'puesto' || k === 'empresa') return Filtros.resumenTexto(filtros[k], F.todosColumna[k]);
    if (k === 'ubicacion') return Filtros.resumenLista(filtros.ubicacion, todasUbicaciones(), (v) => v, F.todosColumna.ubicacion);
    if (k === 'publicado') return Filtros.resumenFecha(filtros.publicado, F.todosColumna.publicado);
    return resumenLista(k, k === 'interes' ? filtros.interes : efectiva(k));
  }
  function volverAPreferencias() { filtros = inicial(); guardarFiltros(); dibujar(); }

  /* ---------- Las dos pestañas (PLAN-UX §2.2 y §3.2; Aviso.pestanas) ----------
     Armados y Por armar, cada una con su número (lo que dejan ver los filtros; en Por armar, más tus pedidos). Si hay algo para decidir,
     Por armar lleva además el punto ámbar con su cuenta. La elegida va en el hash (#armados, #por-armar), como en Postulaciones. */
  const V = T.avisos.vistas;
  const HASH = { armados: 'armados', por_armar: 'por-armar' };
  // #proximos (Tus pedidos, el link de Cómo funciona) abre Por armar y baja hasta ahí.
  const DE_HASH = { armados: 'armados', 'por-armar': 'por_armar', proximos: 'por_armar' };
  let pestana = 'armados';
  let pestanas = null;
  function armarPestanas() {
    pestanas = Aviso.pestanas({ nombre: T.avisos.mostrar, elegida: pestana, alCambiar: cambiarPestana,
      opciones: [{ valor: 'armados', texto: V.armados, n: 0 }, { valor: 'por_armar', texto: V.por_armar, n: 0 }] });
    cajaVistas.append(pestanas.nodo);
  }
  function actualizarPestanas(r) {
    cajaVistas.hidden = !avisos.length;
    const decidir = r.por_armar.filter((a) => grupoDe(a) === 'decidir').length;
    pestanas.poner('armados', { n: r.armados.length });
    pestanas.poner('por_armar', { n: r.por_armar.length + r.pedidos.length, punto: decidir, puntoTexto: decidir ? T.comun.porDecidirCuenta(decidir) : '' });
    pestanas.elegir(pestana);
  }
  function cambiarPestana(v) {
    if (v === pestana) return;
    pestana = v;
    if (!Terna.hojaAbierta()) history.replaceState(null, '', location.pathname + location.search + '#' + HASH[v]);
    if (pestana === 'armados') Lista.visitaArmados();
    dibujar();
  }
  // Las cuentas de Paquetes en el muelle y el carril (decisión D3): lila, los paquetes nuevos desde la última visita a Armados (con la
  // última corrida como piso); ámbar, lo que te toca decidir, sin los filtros de la persona.
  function contarPaquetes() {
    // La misma cuenta que hace Inicio (js/inicio.js): lo de Paquetes al abrir (enPaquetes) que está en Te toca decidir.
    Terna.cuentaPaquetes({ nuevos: Lista.paquetesNuevos(avisos, ultimaCorrida), porDecidir: avisos.filter((a) => loTuyo.enPaquetes(a) && grupoDe(a) === 'decidir').length });
  }

  /* ---------- Orden y barra de filtros ---------- */
  function cambiarOrden(nuevo) {
    orden = nuevo;
    guardarOrden();
    const s = document.getElementById('orden');
    if (s) s.value = orden;
    dibujarLista();
  }
  function dibujarHerramientas() {
    Terna.vaciar(herramientas);
    const nombres = { puestos: T.avisos.ordenPuestos, match: T.avisos.ordenMatch, nuevos: T.avisos.ordenNuevos };
    const sel = h('select', { class: 'control', id: 'orden' }, ORDENES.map((x) => h('option', { value: x, text: nombres[x], selected: orden === x })));
    sel.addEventListener('change', () => { orden = sel.value; guardarOrden(); dibujarLista(); });
    herramientas.append(h('span', { class: 'orden' }, icono('i-ordenar', 'icono-16'), h('label', { for: 'orden', text: T.avisos.ordenarPor + ':' }), sel));
  }
  // Los botones se arman una sola vez y se actualizan en el lugar: así el foco vuelve al mismo botón al cerrar su filtro.
  const botones = {};
  const ubicarFiltros = Filtros.ubicar({ botones, lista });
  const primerFiltro = () => Filtros.primero({ botones, claves: clavesHoy(), lista });
  const estadoFiltros = h('div', { class: 'filtros-estado' });
  let barraFiltros = null;
  let controles = null;
  let unico = null;
  // «Más filtros» (PLAN-WEB.md §2.8): desde 768 px quedan a la vista los cambiados y los primeros de la barra, hasta cuatro.
  const repartirBarra = () => Filtros.masFiltros({ barra: barraFiltros, botones, claves: clavesHoy(), cambiado, aLaVista: 4 });
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
    const caja = h('div', { class: 'filtros-caja' }, barra);
    cajaFiltros.append(caja, estadoFiltros);
    // El orden va con los filtros, al lado de la lista que ordena: debajo de la barra, a la derecha del estado de los filtros.
    controles = h('div', { class: 'controles-lista' });
    cajaFiltros.before(controles);
    controles.append(cajaFiltros, herramientas);
    barraFiltros = barra;
    // En el celular, un solo botón «Filtrar» con la cuenta de los filtros puestos, que abre la hoja con la barra, el estado y el orden.
    unico = Filtros.botonUnico({ caja: controles, nodos: [caja, estadoFiltros, herramientas], cuenta: 0 });
  }
  function actualizarBarra() {
    const claves = clavesHoy();
    for (const k of CLAVES) {
      const b = botones[k];
      // Un filtro que no es de esta pestaña no se ve (y «Más filtros» no lo cuenta).
      if (!claves.includes(k)) { b.hidden = true; delete b.dataset.masOculto; continue; }
      if (b.dataset.masOculto !== '1') b.hidden = false;
      b.querySelector('.filtro-valor').textContent = resumen(k);
      b.querySelector('.filtro-cambiado').textContent = cambiado(k) ? F.cambiadoAccesible : '';
      b.classList.toggle('cambiado', cambiado(k));
    }
    if (barraFiltros) repartirBarra();
    if (unico) unico.cuenta(claves.filter(cambiado).length);
    // Armados va siempre por cuándo se armó: el orden es de Por armar.
    herramientas.hidden = pestana === 'armados';
    const enfocado = estadoFiltros.contains(document.activeElement);
    Terna.vaciar(estadoFiltros);
    if (algoCambiado()) {
      const v = h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => { volverAPreferencias(); primerFiltro().focus(); } },
        icono('i-deshacer', 'icono-16'), F.volverPreferencias);
      estadoFiltros.append(v);
    } else {
      estadoFiltros.append(h('span', { text: F.segunPreferencias }), ' ', h('a', { href: 'preferencias.html#busqueda', text: F.cambiarPreferencias }));
      if (enfocado) primerFiltro().focus();
    }
  }

  /* ---------- La lista: grupos, carpetas y líneas (celular) o la tabla con sus filas de grupo (escritorio) ---------- */
  const G = T.avisos.grupos;
  const ORDEN_GRUPOS = { armados: ['no_se_pudo', 'hoy', 'semana', 'antes'], por_armar: ['decidir', 'sigue', 'esperan', 'descartados', 'no_arma'] };
  // Lo que cada pestaña deja ver con los filtros. Lo pedido va aparte (Tus pedidos), sin filtros: es una cola que se ordena entera.
  function porPestana() {
    busquedaHoy = busquedaElegida();
    const r = { armados: [], por_armar: [], pedidos: pedidosOrdenados() };
    for (const a of avisos) if (grupoDe(a) !== 'pedidos' && pasa(a)) r[pestanaDe(a)].push(a);
    return r;
  }
  function agrupar(l) {
    const por = new Map();
    for (const a of l) { const g = grupoDe(a); if (!por.has(g)) por.set(g, []); por.get(g).push(a); }
    return ORDEN_GRUPOS[pestana].filter((g) => por.has(g)).map((g) => [g, por.get(g).sort(COMPARAR[g] || comparar)]);
  }
  function cabezaGrupo(g, n) {
    const d = {
      no_se_pudo: { texto: G.noSePudo, tono: 'error', ayuda: G.noSePudoAyuda },
      hoy: { texto: G.hoy }, semana: { texto: G.semana }, antes: { texto: G.antes },
      decidir: { texto: G.decidir, tono: 'toca', ayuda: G.decidirAyuda },
      sigue: { texto: G.sigue, ayuda: orden === 'nuevos' ? null : G.sigueAyuda },
      esperan: { texto: G.esperan, tono: 'espera' },
      descartados: { texto: T.avisos.interes.no_me_interesa },
    }[g];
    return Aviso.tituloGrupo(Object.assign({ n }, d));
  }
  // El grupo plegado de Por armar: «Ver N que Terna no arma sola». Abierto o cerrado no se guarda; con Match en «Bajo mi umbral» (todo
  // lo que se ve es de este grupo) arranca abierto.
  let noArmaAbierto = false;
  function botonNoArma(n, controla, alAlternar) {
    const abierto = noArmaAbierto || filtros.soloBajo;
    const b = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': String(abierto), 'aria-controls': controla, dataset: { control: 'no-arma' } },
      h('span', { text: G.noArma(n) }), icono('i-chevron'));
    b.addEventListener('click', () => {
      noArmaAbierto = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(noArmaAbierto));
      alAlternar(noArmaAbierto);
    });
    return h('h2', { class: 'grupo-plegable' }, b);
  }
  const ulDe = (filas) => h('ul', { class: 'lista-tarjetas', role: 'list' }, filas.map((a) => h('li', null, tarjeta(a))));
  function gruposCelular(grupos) {
    return grupos.map(([g, filas]) => {
      if (g === 'no_arma') {
        const ul = ulDe(filas);
        ul.id = Terna.idUnico('no-arma');
        ul.hidden = !(noArmaAbierto || filtros.soloBajo);
        return h('section', { class: 'grupo-lista grupo-plegado', dataset: { grupo: g } }, botonNoArma(filas.length, ul.id, (abierto) => { ul.hidden = !abierto; }), ul);
      }
      const cabeza = cabezaGrupo(g, filas.length);
      return h('section', { class: 'grupo-lista', dataset: { grupo: g }, 'aria-labelledby': cabeza.querySelector('.grupo-titulo').id }, cabeza, ulDe(filas));
    });
  }

  // Los vacíos de cada pestaña (PLAN-UX §3.2), o null si hay algo para ver.
  function vacioDe(r) {
    const A = T.avisos;
    if (r[pestana].length) return null;
    if (algoCambiado()) {
      return h('div', { class: 'vacio' }, h('p', { text: A.vacioFiltros }),
        h('button', { class: 'btn', type: 'button', onclick: () => { volverAPreferencias(); primerFiltro().focus(); } }, F.volverPreferencias));
    }
    if (pestana === 'armados') {
      const hayCola = avisos.some((a) => pestanaDe(a) === 'por_armar' && loTuyo.enPaquetes(a));
      return h('div', { class: 'vacio' }, h('p', { text: A.vacioArmados(cupo) }),
        hayCola ? h('button', { class: 'btn', type: 'button', onclick: () => { cambiarPestana('por_armar'); pestanas.radios.por_armar.focus(); } }, V.por_armar) : null);
    }
    // Por armar con pedidos y nada más: Tus pedidos ya lo dice.
    if (r.pedidos.length) return null;
    return h('div', { class: 'vacio' }, h('p', { text: ctx.faltantes.length ? A.vacioIncompleto : yaCorrio ? A.vacioPorArmar : A.vacioSinCorrida }));
  }
  const arribaProximos = cajaProximos.parentElement;
  const cierre = h('p', { class: 'avisos-busqueda', hidden: true });
  function dibujar() { actualizarBarra(); dibujarLista(); }
  function dibujarLista() {
    const r = porPestana();
    actualizarPestanas(r);
    contarPaquetes();
    Terna.vaciar(lista);
    if (controles) controles.hidden = !avisos.length;
    cierre.hidden = !avisos.length || pestana !== 'por_armar';
    if (!avisos.length) {
      // Todavía no hay nada (persona nueva, o ningún aviso le ajusta): sin pestañas, sin filtros, un solo vacío. Con el perfil
      // incompleto, Terna no corre: lo que hay que hacer es completarlo (FEEDBACK-UX P2-3 b).
      arribaProximos.append(cajaProximos);
      dibujarProximos();
      const incompleto = ctx.faltantes.length > 0;
      lista.append(h('div', { class: 'vacio' }, h('p', { text: incompleto ? T.avisos.vacioIncompleto : yaCorrio ? T.avisos.vacioSinAvisos : T.avisos.vacioSinCorrida }),
        incompleto ? h('a', { class: 'btn', href: 'perfil.html' }, T.bandas.completar) : h('a', { class: 'btn', href: 'preferencias.html' }, T.avisos.revisarPreferencias)));
      return;
    }
    const grupos = agrupar(r[pestana]);
    const vacio = vacioDe(r);
    const escritorio = Terna.anchoEscritorio.matches;
    // Con «Armar paquetes» en No, Terna no arma nada: lo primero de Por armar.
    if (pestana === 'por_armar' && prefs.armar_paquetes === false) {
      lista.append(h('p', { class: 'armar-no' }, icono('i-alerta', 'icono-16'), h('span', null, T.avisos.proximos.armarNo + ' ', h('a', { href: 'preferencias.html#paquetes', text: T.avisos.proximos.cambiarlo }))));
    } else if (pestana === 'por_armar' && !r.pedidos.length && grupos.length && grupos.every(([g]) => g === 'no_arma' || g === 'descartados') && !algoCambiado()) {
      // Nada que Terna vaya a armar sola y nada pedido: todo cae en el plegado «Ver N que Terna no arma sola». Sin esta línea la
      // pestaña mostraba un número grande y un plegable cerrado, sin decir por qué (con datos reales, 21/11/2026).
      lista.append(h('p', { class: 'armar-no' }, icono('i-pedido', 'icono-16'), h('span', null, T.avisos.proximos.nadaSola(umbral) + ' ', h('a', { href: 'preferencias.html#busqueda', text: T.avisos.proximos.cambiarUmbral }))));
    }
    // Tus pedidos: en escritorio, arriba a la derecha de las pestañas; en el celular, dentro de Por armar, después de lo que te toca
    // decidir y antes de lo demás (PLAN-UX §3.2). Se mueve el elemento: así el orden del foco es el de la pantalla.
    if (escritorio || pestana !== 'por_armar') {
      if (cajaProximos.parentElement !== arribaProximos) arribaProximos.append(cajaProximos);
    }
    if (escritorio) {
      // En escritorio la lista es siempre la tabla, también vacía, con sus encabezados, que son los filtros de sus columnas (diseno.md
      // 0.22 §1.34); sin un vacío que decir (Por armar con solo pedidos), no hay tabla.
      if (grupos.length || vacio) lista.append(tabla(grupos, vacio));
    } else {
      const partes = gruposCelular(grupos);
      if (pestana === 'por_armar') partes.splice(grupos.length && grupos[0][0] === 'decidir' ? 1 : 0, 0, cajaProximos);
      Terna.agregar(lista, partes);
      if (vacio) lista.append(vacio);
    }
    dibujarProximos();
    ubicarFiltros();
    marcarElegida();
  }

  function puedePedir(a) {
    return a.tiene_texto && prefs.armar_paquetes && a.estado_paquete === 'sin_armar' && !a.paquete_id && a.interes !== 'no_me_interesa';
  }
  // "Pedir" en lo que sigue Terna (corto, con el puesto en el nombre accesible); "Pedir paquete" en lo que Terna no arma sola y en la ficha.
  function botonPedir(a, largo, enFicha) {
    return h('button', { class: enFicha ? 'btn' : 'btn btn-fila', type: 'button', dataset: { control: 'pedir' }, 'aria-label': enFicha ? null : T.avisos.pedirAccesible(a.puesto),
      onclick: () => pedir(a) }, largo ? T.avisos.pedirPaquete : T.avisos.pedir);
  }
  // Debajo de "Sin texto" (brand.md 0.23 §6.4; diseno.md 0.35 §7.3): quién lo busca, Terna o, si Terna ya no lo espera, Francisco.
  const quienBusca = (a) => (a.texto_estado === 'admin' ? 'admin' : 'buscando');
  function lineaSinTexto(a) {
    return h('span', { class: 'sin-texto-linea', dataset: { busca: quienBusca(a) }, text: T.avisos.sinTextoLinea[quienBusca(a)] });
  }
  // Lo que espera: «Sin texto» (con quién lo busca) o «Por puntuar» (tiene texto y todavía no tiene tu match).
  function chipEspera(a) {
    if (!a.tiene_texto) return [Aviso.chipPaquete(a), lineaSinTexto(a)];
    return Aviso.chipPaquete(Object.assign({}, a, { texto_origen: 'usuario' }));
  }
  const chipBajo = () => h('span', { class: 'chip-texto', text: T.avisos.bajoUmbral });
  // Lo que se hace con el paquete en Por armar (la columna Paquete de la tabla): Pedir en lo que sigue Terna y en lo que no arma sola;
  // en lo que espera, su chip.
  function accionPaquete(a) {
    const g = grupoDe(a);
    if (g === 'esperan') return chipEspera(a);
    const marca = g === 'no_arma' && bajo(a) && !esTuPuesto(a) ? chipBajo() : null;
    if ((g === 'sigue' || g === 'no_arma') && puedePedir(a)) return [marca, botonPedir(a, g === 'no_arma')];
    return marca;
  }
  // El interés en Por armar (PLAN-UX §2.3): los dos botones solo en lo que te toca decidir; «No me interesa» chico en lo que sigue y en
  // lo que Terna no arma sola; «Me interesa» para volver lo que no te interesa. `donde` (tabla, tarjeta o ficha) da a cada grupo de
  // radios su nombre: la ficha abierta y la fila del mismo aviso no pueden compartirlo.
  const PREFIJO = { tabla: 'it-', tarjeta: 'ic-', ficha: 'if-' };
  function accionInteres(a, donde) {
    const g = grupoDe(a);
    if (g === 'decidir') return Aviso.interes(a, { forma: 'dos', nombre: PREFIJO[donde] + a.match_id, alCambiar: (v) => cambiarInteres(a, v) });
    if (g === 'descartados') {
      return h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'interes-si' }, onclick: () => cambiarInteres(a, 'me_interesa') },
        icono('i-tilde', 'icono-16'), T.avisos.interes.me_interesa);
    }
    if (g === 'sigue' || g === 'no_arma') return Aviso.interes(a, { forma: 'chico', alCambiar: (v) => cambiarInteres(a, v) });
    return null;
  }
  // Abajo de cada carpeta de Armados: cuándo se armó y adónde se postula (Postulaciones lista lo que tiene paquete o postulación y te interesa).
  function lineaArmado(a) {
    const d = Lista.diasDesdeArmado(a);
    return d === null ? null : h('span', { class: 'armado-el', text: T.avisos.armadoEl(Terna.fechaCorta(a.armado_en), d) });
  }
  const enPostulaciones = (a) => (!!a.paquete_id || a.estado_postulacion !== 'pendiente') && a.interes !== 'no_me_interesa';
  function linkPostulaciones(a) {
    if (!enPostulaciones(a)) return null;
    return h('a', { class: 'link-lista', href: 'postulaciones.html#postulacion-' + a.match_id, 'aria-label': T.avisos.verEnPostulacionesAccesible(a.puesto),
      dataset: { control: 'postulaciones' } }, T.avisos.ficha.verEnPostulaciones);
  }
  // La fila de documentos: CV y Carta se bajan; Notas y el salario abren la ficha con ese panel desplegado.
  const docOpciones = { alNotas: (a, b) => abrirFicha(a, b, false, 'notas'), alSalario: (a, b) => abrirFicha(a, b, false, 'salario') };

  /* La lista del celular: en Armados, carpetas (la lengüeta con el match, el marbete con la postulación, los documentos, cuándo se
     armó y «Ver en Postulaciones»); en Por armar, líneas sueltas (el match en una columna de 44 px; lo que te toca decidir, en ámbar
     lavado), con dónde se postula y sus acciones. La lengüeta (o el match) abre la ficha en «Por qué ajusta»; el puesto, arriba; un
     clic en cualquier otro lugar del aviso que no sea un control, también. */
  function tarjeta(a) {
    const g = grupoDe(a);
    const armado = a.estado_paquete === 'armado';
    const boton = h('button', { class: 'tarjeta-boton puesto', type: 'button', dataset: { control: 'abrir' }, onclick: () => abrirFicha(a, boton) },
      h('span', { class: 'aviso-puesto puesto-texto', text: a.puesto }), Aviso.nuevo(a), icono('i-adelante', 'puesto-flecha'));
    const conPorQue = a.match !== null && a.match !== undefined;
    const match = Aviso.lengueta(a, umbral, { linea: !armado, alTocar: conPorQue ? () => abrirFicha(a, match, false, 'porque') : null });
    const tuyo = chipTuPuesto(a);
    let art;
    if (armado) {
      const interes = Aviso.chipInteres(a, config);
      art = h('article', { class: 'tarjeta-aviso carpeta', dataset: { match: a.match_id } },
        h('div', { class: 'carpeta-cabeza' }, match, Aviso.marbete(a)),
        h('div', { class: 'carpeta-cuerpo aviso-datos' }, boton,
          a.empresa ? h('span', { class: 'aviso-empresa empresa', text: a.empresa }) : null,
          h('div', { class: 'aviso-linea' }, Aviso.atributos(a, { sinFuente: true }), tuyo),
          Aviso.etiquetas(a, bajoMinimo(a), false, null), interes ? h('div', { class: 'chips' }, interes) : null,
          Aviso.filaDocumentos(a, docOpciones),
          h('div', { class: 'carpeta-pie' }, lineaArmado(a), linkPostulaciones(a))));
    } else {
      const chips = h('div', { class: 'chips' }, g === 'esperan' ? chipEspera(a) : null,
        g === 'no_arma' && bajo(a) && !tuyo ? chipBajo() : null, Aviso.chipCalificacion(a));
      let acciones = null;
      const interes = accionInteres(a, 'tarjeta');
      if (g === 'decidir') { acciones = interes; acciones.classList.add('linea-acciones'); }
      else if (interes) acciones = h('div', { class: 'acciones-tarjeta linea-acciones' }, (g === 'sigue' || g === 'no_arma') && puedePedir(a) ? botonPedir(a, g === 'no_arma') : null, interes);
      art = h('article', { class: 'tarjeta-aviso linea' + (g === 'decidir' ? ' toca-fila' : ''), dataset: { match: a.match_id } },
        match,
        h('div', { class: 'linea-datos aviso-datos' }, boton,
          h('div', { class: 'linea-apoyo' }, a.empresa ? h('span', { class: 'aviso-empresa', text: a.empresa }) : null, Aviso.atributos(a, { sinFuente: true }), tuyo),
          Aviso.lineaDonde(a, prefs), Aviso.etiquetas(a, bajoMinimo(a), false, fuera(a)),
          h('div', { class: 'linea-pie' }, chips, Aviso.fechaSola(a)),
          acciones));
    }
    art.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select, fieldset')) abrirFicha(a, boton); });
    return art;
  }

  // La tabla de escritorio: los grupos son filas de grupo (tr.grupo), cada uno en su tbody. Los encabezados abren el filtro de su
  // columna (diseno.md 0.21 §7.6 y §10.18); en Por armar, Match y Publicado además ordenan, desde su panel. Las columnas cambian con
  // la pestaña: Armados tiene los documentos y la postulación; Por armar, el paquete (Pedir), dónde se postula y el interés.
  let filtroAbierto = null;
  function tabla(grupos, vacio) {
    const C = T.avisos.columnas;
    const armados = pestana === 'armados';
    const th = (texto, clave, clase, sort) => Filtros.encabezado({ texto, clave, clase, activo: cambiado(clave), abierto: filtroAbierto === clave, sort: armados ? null : sort,
      titulo: F.boton(nombreFiltro(clave), resumen(clave)), alAbrir: (b) => abrirFiltro(clave, b, true) });
    const solo = (texto, clase) => h('th', { scope: 'col', class: clase || null, text: texto });
    const cols = [th(C.puesto, 'puesto', 'col-puesto'), th(C.empresa, 'empresa', 'col-empresa'), th(C.modalidad, 'modalidad', 'col-modalidad'),
      th(C.ubicacion, 'ubicacion', 'col-ubicacion'), th(C.match, 'match', 'der', orden === 'match' ? 'descending' : 'none')];
    if (armados) cols.push(solo(C.paquete, 'col-docs'), th(C.postulacion, 'postulacion', 'col-postulacion'));
    else cols.push(th(C.paquete, 'paquete', 'col-paquete'), th(C.donde, 'donde', 'col-donde'), th(C.interes, 'interes', 'col-interes'));
    cols.push(th(C.publicado, 'publicado', 'col-publicado', orden === 'nuevos' ? 'descending' : 'none'), solo(C.aviso));
    const n = String(cols.length);
    let cuerpos;
    // Sin filas (los filtros no dejan ver ninguna), una sola celda con el aviso de vacío, debajo de los encabezados.
    if (vacio) cuerpos = [h('tbody', null, h('tr', null, h('td', { class: 'tabla-vacia', colspan: n }, vacio)))];
    else {
      cuerpos = grupos.flatMap(([g, filas]) => {
        if (g === 'no_arma') {
          const cuerpo = h('tbody', { id: Terna.idUnico('no-arma'), hidden: !(noArmaAbierto || filtros.soloBajo), dataset: { grupo: g } }, filas.map(fila));
          return [h('tbody', { class: 'grupo-plegado' }, h('tr', { class: 'grupo' }, h('td', { colspan: n }, botonNoArma(filas.length, cuerpo.id, (abierto) => { cuerpo.hidden = !abierto; })))), cuerpo];
        }
        return [h('tbody', { dataset: { grupo: g } }, h('tr', { class: 'grupo' }, h('th', { scope: 'rowgroup', colspan: n }, cabezaGrupo(g, filas.length))), filas.map(fila))];
      });
    }
    return h('div', { class: 'tabla-caja tabla-avisos' + (armados ? ' tabla-armados' : ' tabla-por-armar') }, h('table', { class: 'tabla' }, h('thead', null, h('tr', null, cols)), cuerpos));
  }
  // Lo que dicen las columnas que la tabla esconde cuando no le alcanza el ancho (diseno.md 0.8 §7.6): empresa, lugar y modalidad
  // debajo del puesto y, desde 0.23, dónde se postula: en Armados solo si te toca a vos; en Por armar, siempre (cada fila dice dónde
  // se postula, PLAN-UX §3.2). Oculta mientras las columnas se ven.
  function lineaApoyo(a) {
    const d = Aviso.donde(a, prefs);
    const conDonde = !d.hecha && (d.clave !== 'terna' || pestanaDe(a) === 'por_armar');
    return h('div', { class: 'atributos linea-apoyo' },
      a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null,
      h('span', { text: Aviso.lugar(a) }), a.modalidad ? h('span', { text: ' · ' + T.avisos.modalidadMin[a.modalidad] }) : null,
      conDonde ? h('span', { class: 'apoyo-donde', text: ' · ' + Aviso.textoDonde(d) }) : null);
  }
  function fila(a) {
    const g = grupoDe(a);
    const armados = pestanaDe(a) === 'armados';
    const faltan = Aviso.chipCalificacion(a);
    const tuyo = chipTuPuesto(a);
    const tr = h('tr', { class: g === 'decidir' ? 'toca-fila' : null, tabindex: '0', dataset: { match: a.match_id, control: 'abrir' } },
      h('td', { class: 'col-puesto' }, h('div', { class: 'puesto-linea' }, h('span', { class: 'aviso-puesto', text: a.puesto }), Aviso.nuevo(a)),
        lineaApoyo(a), Aviso.etiquetas(a, bajoMinimo(a), false, armados ? null : fuera(a)), faltan ? h('div', null, faltan) : null,
        tuyo ? h('div', { class: 'linea-tuya' }, tuyo) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-modalidad' }, a.modalidad ? h('span', { class: 'atributos' }, icono('i-' + a.modalidad, 'icono-16'), T.avisos.modalidadMin[a.modalidad]) : null),
      h('td', { class: 'col-ubicacion' }, h('span', { class: 'atributos' }, icono(a.alcance === 'exterior' ? 'i-exterior' : 'i-local', 'icono-16'), Aviso.lugar(a))),
      h('td', { class: 'tabla-match' + (Aviso.llega(a, umbral) || a.match === null ? '' : ' bajo') },
        h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, Aviso.llega(a, umbral)))),
      armados ? h('td', { class: 'col-docs' }, h('div', { class: 'celda-docs' }, Aviso.filaDocumentos(a, docOpciones), lineaArmado(a))) : null,
      armados ? h('td', { class: 'col-postulacion' }, h('div', { class: 'celda-paquete' },
        a.estado_paquete === 'armado' ? Aviso.chipPostulacion(a) : null, Aviso.chipInteres(a, config), linkPostulaciones(a))) : null,
      armados ? null : h('td', { class: 'col-paquete' }, h('div', { class: 'celda-paquete' }, accionPaquete(a))),
      armados ? null : h('td', { class: 'col-donde' }, Aviso.celdaDonde(a, prefs)),
      armados ? null : h('td', { class: 'col-interes' }, accionInteres(a, 'tabla')),
      h('td', { class: 'col-publicado' }, Aviso.fechaSola(a)),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
    tr.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrirFicha(a, tr); });
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) { e.preventDefault(); abrirFicha(a, tr); } });
    return tr;
  }

  /* ---------- Después de escribir: rehacer y dejar el foco donde corresponde ---------- */
  function nodoDe(a) { return lista.querySelector('[data-match="' + a.match_id + '"]'); }
  const seVe = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
  const filasVisibles = () => Array.from(lista.querySelectorAll('[data-match]')).filter(seVe);
  // El foco en un aviso de la lista: en su control `control` si lo tiene; si no, en lo que abre su ficha.
  function enfocarAviso(nodo, control) {
    if (!seVe(nodo)) return false;
    const abrir = nodo.tagName === 'TR' ? nodo : nodo.querySelector('[data-control="abrir"]');
    const destino = (control && control !== 'abrir' && nodo.querySelector('[data-control="' + control + '"]')) || abrir || nodo;
    destino.focus();
    return true;
  }
  // Lo que hay que saber antes de una escritura: si el foco estaba en el aviso (y en qué control), su lugar entre los que se ven, su
  // grupo y si el foco estaba en la ficha abierta.
  function focoAntes(a) {
    const nodo = nodoDe(a);
    const activo = document.activeElement;
    const abierta = Terna.hojaAbierta();
    return { tenia: !!nodo && nodo.contains(activo), control: activo && activo.dataset ? activo.dataset.control || null : null,
      i: nodo ? filasVisibles().indexOf(nodo) : -1, grupo: grupoDe(a), enHoja: !!abierta && abierta.el.contains(activo) };
  }
  // La ficha abierta de ese aviso se rehace en el lugar; si el foco estaba en ella y su control ya no está, pasa al que lo reemplaza
  // (Pedir ↔ Cancelar pedido, No me interesa ↔ Me interesa) o a la cruz.
  const ALTERNO = { pedir: 'cancelar-pedido', 'cancelar-pedido': 'pedir', 'interes-no_me_interesa': 'interes-si', 'interes-si': 'interes-no_me_interesa', 'interes-me_interesa': 'interes-no_me_interesa' };
  function refrescarFicha(a, antes) {
    const abierta = Terna.hojaAbierta();
    if (!abierta || abierta.clave !== a.match_id) return;
    Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
    if (antes && antes.enHoja && !abierta.el.contains(document.activeElement)) {
      const buscar = (c) => (c ? abierta.el.querySelector('[data-control="' + c + '"]') : null);
      const x = buscar(antes.control) || buscar(ALTERNO[antes.control]) || abierta.el.querySelector('.hoja-cerrar');
      if (x) x.focus();
    }
  }
  // Un aviso publicado en Terna (contratar.md 0.1 §5): después de postular, retirar, responder o avisar, se rehace en el lugar.
  Aviso.alCambiarTerna((a) => refrescar(a));
  // Rehace una fila sola (el motivo de No me interesa cambió): mismo grupo, mismo lugar.
  function refrescar(a) {
    const viejo = nodoDe(a);
    if (viejo) {
      const control = viejo.contains(document.activeElement) ? (document.activeElement.dataset.control || 'abrir') : null;
      const nuevo = viejo.tagName === 'TR' ? fila(a) : tarjeta(a);
      viejo.replaceWith(nuevo);
      if (control) enfocarAviso(nuevo, control);
      marcarElegida();
    }
    refrescarFicha(a);
  }
  // Después de una escritura se rehace la página (las pestañas, los grupos y Tus pedidos cuentan otra cosa). Si el aviso sigue en su
  // grupo, el foco vuelve a su mismo control; si se fue (a otro grupo, a otra pestaña, a Tus pedidos o fuera de los filtros), la
  // tarjeta se va con un fundido corto y el foco pasa al aviso que quedó en su lugar. Con `alAviso` (un Deshacer: el foco estaba en el
  // aviso breve, que ya no existe), al aviso.
  async function rehacer(a, antes, opciones) {
    const o = opciones || {};
    const viejo = nodoDe(a);
    const seFue = grupoDe(a) !== antes.grupo || grupoDe(a) === 'pedidos' || !pasa(a);
    if (seFue && antes.tenia && viejo && viejo.tagName === 'ARTICLE') {
      viejo.classList.add('saliendo');
      await new Promise((r) => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150));
    }
    dibujar();
    refrescarFicha(a, antes);
    if (o.alAviso) {
      // Con la ficha de ese aviso abierta encima (el aviso breve estaba en ella), el foco se queda en la ficha.
      const abierta = Terna.hojaAbierta();
      if (abierta && !abierta.linea && abierta.clave === a.match_id) {
        const x = abierta.el.querySelector('.hoja-cuerpo .interes input:checked') || abierta.el.querySelector('.hoja-cuerpo .interes input')
          || abierta.el.querySelector('.hoja-acciones [data-control^="interes"]')
          || abierta.el.querySelector('.hoja-cerrar');
        if (x) x.focus();
        return;
      }
      if (!enfocarAviso(nodoDe(a), 'abrir')) Terna.devolverFoco(null);
      return;
    }
    if (!antes.tenia) return;
    const nuevo = nodoDe(a);
    if (!seFue && enfocarAviso(nuevo, antes.control)) return;
    const filas = filasVisibles().filter((n) => n !== nuevo);
    if (!enfocarAviso(filas[Math.min(Math.max(antes.i, 0), filas.length - 1)], 'abrir')) Terna.devolverFoco(null);
  }

  /* ---------- Acciones ---------- */
  function avisarError(error) {
    if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true, icono: 'i-alerta' });
  }
  // "No me interesa" pide confirmación (brand.md 0.8 §6.4), con el motivo opcional adentro; "Me interesa" y Deshacer, no.
  async function cambiarInteres(a, valor, deshaciendo) {
    const anterior = a.interes;
    if (valor === anterior) return;
    let motivo = null;
    if (valor === 'no_me_interesa' && !deshaciendo) {
      const r = await Aviso.confirmarNoInteresa(a, { config, conMotivo });
      if (!r.si) { volverInteres(a, anterior); return; }
      motivo = r.motivo;
    }
    const antes = focoAntes(a);
    const error = valor === 'no_me_interesa' ? await Aviso.marcarNoInteresa(a, motivo)
      : (await sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: valor })).error;
    if (error) { avisarError(error); volverInteres(a, anterior); return; }
    a.interes = valor;
    if (valor !== 'no_me_interesa') a.motivo_no_interesa = null;  // la base lo borra igual (0025, disparador)
    if (valor === 'no_me_interesa') {
      if (a.estado_paquete === 'pedido') { a.estado_paquete = 'sin_armar'; a.pedido_en = null; }
      if (a.estado_postulacion === 'en_cola' || a.estado_postulacion === 'para_revisar') a.estado_postulacion = 'pendiente';
    }
    await rehacer(a, antes, { alAviso: deshaciendo });
    if (!deshaciendo) {
      Terna.avisoBreve(valor === 'no_me_interesa' ? T.avisos.noTeInteresa : T.avisos.teInteresa,
        { icono: valor === 'no_me_interesa' ? 'i-no-interesa' : 'i-tilde', deshacer: () => cambiarInteres(a, anterior, true) });
    }
  }
  // Si no se confirma o la base no lo guarda, el control de interés vuelve a como estaba sin rehacer la fila (rehacerla se llevaba el
  // foco). En el grupo que tiene el foco, el foco pasa a la opción marcada.
  function volverInteres(a, anterior) {
    const activo = document.activeElement;
    let foco = null;
    for (const pre of Object.values(PREFIJO)) {
      document.getElementsByName(pre + a.match_id).forEach((x) => {
        x.checked = x.value === anterior;
        if (x.checked && activo && activo.name === x.name) foco = x;
      });
    }
    if (foco) foco.focus();
  }
  // Pedir paquete: primero la confirmación, que dice en qué lugar de tus pedidos queda y cuándo se arma (brand.md 0.8 §6.4). El
  // aviso pasa a Tus pedidos.
  async function pedir(a) {
    const lugar = pedidosOrdenados().length + 1;
    const corridas = Math.ceil(lugar / cupo);
    const incompleto = ctx.faltantes.length > 0;
    const si = await Aviso.confirmarPedir(a, { lugar, corridas, cupo, prefs, incompleto });
    if (!si) return;
    const antes = focoAntes(a);
    const { error } = await sb.rpc('pedir_paquete', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'pedido';
    a.pedido_en = new Date().toISOString();
    a.interes = 'me_interesa';
    a.motivo_no_interesa = null;
    await rehacer(a, antes);
    Terna.avisoBreve(incompleto ? T.avisos.pedidoIncompleto : T.avisos.pedido(lugar, corridas), { icono: 'i-pedido', deshacer: () => cancelar(a, true) });
  }
  // Cancelar un pedido (desde Tus pedidos, la ficha o el Deshacer de Pedir): vuelve a su grupo de Por armar. Desde Tus pedidos, el
  // foco pasa al pedido que quedó en su lugar (o al aviso, si no queda ninguno). Con Deshacer vuelve a su lugar en la cola.
  async function cancelar(a, deshaciendo) {
    const antesPedidos = pedidosOrdenados();
    const i = antesPedidos.indexOf(a);
    const desdeProximos = cajaProximos.contains(document.activeElement);
    const antes = focoAntes(a);
    const { error } = await sb.rpc('cancelar_pedido', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'sin_armar';
    a.pedido_en = null;
    await rehacer(a, antes, { alAviso: deshaciendo });
    if (deshaciendo) return;
    if (desdeProximos) {
      const resto = pedidosOrdenados();
      const otro = resto[Math.min(Math.max(i, 0), resto.length - 1)];
      const b = otro ? cajaProximos.querySelector('[data-pedido="' + otro.match_id + '"][data-control="cancelar"]') : null;
      if (b) b.focus();
      else if (!enfocarAviso(nodoDe(a), 'abrir')) Terna.devolverFoco(null);
    }
    Terna.avisoBreve(T.avisos.pedidoCancelado, { icono: 'i-deshacer', deshacer: async () => {
      const r = await sb.rpc('pedir_paquete', { p_match_id: a.match_id });
      if (r.error) { avisarError(r.error); return; }
      a.estado_paquete = 'pedido';
      a.pedido_en = new Date().toISOString();
      a.interes = 'me_interesa';
      // Vuelve a su lugar: pedir lo deja último; con 0029, se ordena como estaba.
      const ahora = pedidosOrdenados();
      if (i >= 0 && i < ahora.length - 1 && await comprobarOrdenar()) {
        const nuevo = ahora.filter((x) => x !== a);
        nuevo.splice(i, 0, a);
        await ordenar(nuevo);
      }
      dibujar();
      refrescarFicha(a);
      const abierta = Terna.hojaAbierta();
      const b = abierta && !abierta.linea && abierta.clave === a.match_id ? abierta.el.querySelector('[data-control="cancelar-pedido"]')
        : cajaProximos.querySelector('[data-pedido="' + a.match_id + '"][data-control="abrir"]');
      if (seVe(b)) b.focus(); else Terna.devolverFoco(null);
    } });
  }

  /* ---------- Tus pedidos (#proximos; el «Próximos paquetes» de diseno.md 0.21 §7.8; brand.md 0.8 §6.4; datos.md 0.25, 0029) ----------
     Lo que la persona pidió, en el orden en que el motor lo arma (pipeline.md §4.9 punto 3: por pedido_en), con cuándo se arma cada uno
     (3 por corrida) y Subir, Bajar y Cancelar pedido. Encima, el cupo y, si los pedidos llenan la próxima corrida, la consecuencia.
     Es de Por armar: en Armados no se ve. */
  // pedido_en llega de la base con microsegundos y de la web con milisegundos: se compara por instante.
  function instante(x) {
    if (!x) return Number.MAX_SAFE_INTEGER;
    const m = /\.(\d+)/.exec(x);
    return Date.parse(x) * 1000 + (m ? Number((m[1] + '000000').slice(3, 6)) : 0);
  }
  function pedidosOrdenados() {
    return avisos.filter((a) => a.estado_paquete === 'pedido' && !a.paquete_id)
      .sort((x, y) => (instante(x.pedido_en) - instante(y.pedido_en)) || x.match_id.localeCompare(y.match_id));
  }
  function lugarDe(a) { const i = pedidosOrdenados().indexOf(a); return i >= 0 ? i + 1 : 0; }
  // ¿La base tiene 0029? Se pregunta una vez, con un orden vacío (no hace nada), y solo cuando hay dos pedidos o más.
  let conOrdenar = null;
  const faltaFuncion = (error) => !!error && (error.code === 'PGRST202' || error.code === '42883' || error.status === 404
    || /Could not find the function|function .* does not exist/i.test(String(error.message || '')));
  async function comprobarOrdenar() {
    if (conOrdenar !== null) return conOrdenar;
    const { error } = await sb.rpc('ordenar_pedidos', { p_orden: [] });
    conOrdenar = !faltaFuncion(error);
    return conOrdenar;
  }
  const anuncio = h('p', { class: 'oculto-visual', role: 'status', 'aria-live': 'polite' });
  function dibujarProximos(enfocar) {
    const P = T.avisos.proximos;
    const pedidos = pedidosOrdenados();
    // Si el foco estaba adentro (por ejemplo, la segunda vuelta de cuando se sabe si hay 0029), vuelve al mismo lugar.
    const activo = cajaProximos.contains(document.activeElement) ? document.activeElement : null;
    const titulo = !!activo && activo.classList.contains('grupo-titulo');
    if (!enfocar && activo && activo.dataset.pedido) enfocar = { id: activo.dataset.pedido, control: activo.dataset.control };
    Terna.vaciar(cajaProximos);
    cajaProximos.hidden = !pedidos.length || pestana !== 'por_armar' || !avisos.length;
    if (!pedidos.length) return;
    if (pedidos.length > 1 && conOrdenar === null) comprobarOrdenar().then((si) => { if (si) dibujarProximos(); });
    const ordenable = conOrdenar === true && pedidos.length > 1;
    const icBoton = (iconoId, etiqueta, control, a, desactivado, fn) => h('button', { class: 'btn btn-fila btn-icono', type: 'button', 'aria-label': etiqueta, title: etiqueta,
      'aria-disabled': desactivado ? 'true' : null, dataset: { pedido: a.match_id, control }, onclick: () => { if (!desactivado) fn(); } }, icono(iconoId, 'icono-16'));
    const items = pedidos.map((a, i) => {
      const corridas = Math.ceil((i + 1) / cupo);
      const abrir = h('button', { class: 'proximo-abrir puesto', type: 'button', dataset: { pedido: a.match_id, control: 'abrir' }, onclick: () => abrirFicha(a, abrir) },
        h('span', { class: 'puesto-texto', text: a.puesto }), icono('i-adelante', 'puesto-flecha'));
      // Cuándo se arma es espera (la tiene Terna): en tinta suave, con el reloj.
      const cuando = prefs.armar_paquetes === false ? '' : P.cuando(corridas);
      return h('li', { class: 'proximo', dataset: { pedido: a.match_id } },
        h('span', { class: 'proximo-lugar num', 'aria-hidden': 'true', text: String(i + 1) }),
        h('div', { class: 'proximo-datos' }, abrir,
          h('span', { class: 'proximo-detalle' }, a.empresa ? [h('span', { class: 'proximo-empresa', text: a.empresa }), cuando ? oculto(', ') : null] : null,
            h('span', { class: 'proximo-cuando' }, cuando ? icono('i-pedido', 'icono-14') : null, cuando))),
        h('div', { class: 'proximo-acciones' },
          ordenable ? icBoton('i-arriba', P.subir(a.puesto), 'subir', a, i === 0, () => mover(a, -1)) : null,
          ordenable ? icBoton('i-abajo', P.bajar(a.puesto), 'bajar', a, i === pedidos.length - 1, () => mover(a, 1)) : null,
          icBoton('i-cerrar', P.cancelar(a.puesto), 'cancelar', a, false, () => cancelar(a))));
    });
    // La consecuencia de pedir, arriba de la cola (PLAN-UX §2.4 punto 8): con los pedidos que llenan la próxima corrida, Terna no elige
    // nada sola. Con «Armar paquetes» en No lo dice el renglón de arriba de Por armar.
    const lleno = prefs.armar_paquetes !== false && pedidos.length >= cupo
      ? h('p', { class: 'proximos-aviso', text: P.lleno(pedidos.length, Math.ceil(pedidos.length / cupo)) }) : null;
    // Con Terna.agregar y no con el append del DOM: `lleno` puede ser null, y el append nativo lo escribe como texto («null»).
    Terna.agregar(cajaProximos, [Aviso.tituloGrupo({ texto: G.pedidos, n: pedidos.length, id: 'proximos-titulo', ayuda: P.intro(cupo) }), lleno,
      h('ol', { class: 'proximos-lista', role: 'list' }, items), anuncio]);
    if (enfocar) {
      const b = cajaProximos.querySelector('[data-pedido="' + enfocar.id + '"][data-control="' + enfocar.control + '"]');
      if (b) b.focus();
    } else if (titulo) enfocarTituloProximos();
  }
  function enfocarTituloProximos() {
    const t = cajaProximos.querySelector('.grupo-titulo');
    if (!t) return;
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }
  // Escribe el orden nuevo (0029) y lo refleja acá como la base: cada pedido toma, en el orden nuevo, una de las mismas fechas.
  async function ordenar(nuevo) {
    const fechas = nuevo.map((x) => x.pedido_en).sort((x, y) => instante(x) - instante(y));
    const antes = new Map(nuevo.map((x) => [x, x.pedido_en]));
    nuevo.forEach((x, i) => { x.pedido_en = fechas[i]; });
    const { error } = await sb.rpc('ordenar_pedidos', { p_orden: nuevo.map((x) => x.match_id) });
    if (!error) return true;
    for (const [x, f] of antes) x.pedido_en = f;
    if (String(error.message || '').includes('pedidos_cambiaron')) await releerPedidos();
    avisarError(error);
    return false;
  }
  async function mover(a, paso) {
    const pedidos = pedidosOrdenados();
    const i = pedidos.indexOf(a);
    const j = i + paso;
    if (i < 0 || j < 0 || j >= pedidos.length) return;
    const nuevo = pedidos.slice();
    nuevo.splice(i, 1);
    nuevo.splice(j, 0, a);
    const control = paso < 0 ? 'subir' : 'bajar';
    const ok = await ordenar(nuevo);
    dibujarProximos({ id: a.match_id, control });
    const abierta = Terna.hojaAbierta();
    if (abierta && porId.has(abierta.clave) && porId.get(abierta.clave).estado_paquete === 'pedido') refrescarFicha(porId.get(abierta.clave));
    if (ok) anuncio.textContent = T.avisos.proximos.movido(a.puesto, j + 1, pedidos.length);
  }
  // Si la base dice que los pedidos cambiaron (el motor armó uno, otra pestaña pidió o canceló), se vuelven a leer.
  async function releerPedidos() {
    const { data, error } = await sb.from('mis_avisos').select('match_id, estado_paquete, pedido_en, paquete_id');
    if (error || !data) return;
    for (const f of data) { const a = porId.get(f.match_id); if (a) Object.assign(a, f); }
  }
  // #proximos (el link de Cómo funciona): baja hasta Tus pedidos, con el foco en su título.
  function irAProximos() {
    if (cajaProximos.hidden) return;
    enfocarTituloProximos();
    cajaProximos.scrollIntoView({ block: 'start' });
  }

  /* ---------- Un filtro (§7.2): hoja en celular, panel debajo de su botón en escritorio ----------
     Se aplica al tocar, con la lista a la vista detrás; "Listo" (o la cruz, o Esc) cierra y devuelve el foco al botón. Lo abren los
     botones de la barra y, en la tabla, los encabezados (`desdeEncabezado`: en Por armar, el panel de Match y el de Publicado suman el
     orden). Las cuentas de cada opción son las de la pestaña elegida. */
  function opcion(tipo, nombre, valor, texto, elegido, iconoId) {
    return h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: tipo, name: nombre, value: valor, checked: elegido }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), iconoId ? icono(iconoId) : null, texto));
  }
  const ICONOS = { modalidad: (v) => 'i-' + v, alcance: (v) => 'i-' + v };
  function aplicarFiltro() { guardarFiltros(); dibujar(); }
  // Lo de la pestaña elegida que dejan ver los demás filtros (sin Tus pedidos, que no se filtra).
  function baseDe(k) {
    busquedaHoy = busquedaElegida();
    return avisos.filter((a) => pestanaDe(a) === pestana && grupoDe(a) !== 'pedidos' && pasa(a, k));
  }
  // Las opciones de un filtro de valores, con cuántos avisos deja ver cada una junto con los demás filtros.
  function opcionesDe(k, valores, texto, valorDe) {
    const base = baseDe(k);
    return valores.map((v) => ({ valor: v, texto: texto(v), n: base.filter((a) => valorDe(a) === v).length }));
  }
  function cuerpoFiltro(k, desdeEncabezado) {
    const conOrden = desdeEncabezado && pestana === 'por_armar';
    if (k === 'puesto' || k === 'empresa') {
      return Filtros.cuerpoTexto({ valor: filtros[k], alCambiar: (v) => { filtros[k] = v; filtros.puestoExacto = filtros.puestoExacto && k !== 'puesto'; filtros.empresaExacta = filtros.empresaExacta && k !== 'empresa'; aplicarFiltro(); } });
    }
    if (k === 'publicado') {
      const cuerpo = Filtros.cuerpoFecha({ valor: filtros.publicado, alCambiar: (v) => { filtros.publicado = v; aplicarFiltro(); } });
      if (conOrden) cuerpo.prepend(Filtros.botonOrden(F.ordenar.nuevos, orden === 'nuevos', () => cambiarOrden('nuevos')));
      return cuerpo;
    }
    if (k === 'prioridad') {
      const base = baseDe('prioridad');
      const opciones = PRIORIDADES.map((v) => ({ valor: v, texto: F.prioridad[v], n: base.filter((a) => enPrioridad(a, v)).length }));
      const cuerpo = Filtros.cuerpoValores({ nombre: nombreFiltro(k), opciones, elegidos: filtros.prioridad, todosTexto: F.todosColumna.prioridad,
        alCambiar: (v) => { filtros.prioridad = v; aplicarFiltro(); } });
      cuerpo.append(h('p', { class: 'campo-ayuda', text: F.prioridadAyuda(criterio.puestos.length > 0, criterio.empresas.length > 0) }));
      return cuerpo;
    }
    if (k === 'paquete' || k === 'postulacion' || k === 'donde' || k === 'ubicacion' || k === 'requisitos') {
      let opciones;
      if (k === 'ubicacion') {
        // Las que hay en la lista con los demás filtros, y las elegidas aunque ya no haya ninguna; de la más usada a la menos.
        const base = baseDe('ubicacion');
        const valores = Array.from(new Set(base.map(Aviso.lugar).concat(filtros.ubicacion || [])));
        opciones = valores.map((v) => ({ valor: v, texto: v, n: base.filter((a) => Aviso.lugar(a) === v).length }))
          .sort((x, y) => (y.n - x.n) || x.texto.localeCompare(y.texto, 'es'));
      } else if (k === 'paquete') opciones = opcionesDe('paquete', PAQUETES, (v) => T.avisos.paquete[v], Aviso.estadoPaquete);
      else if (k === 'donde') opciones = opcionesDe('donde', DONDES, (v) => T.avisos.dondeFiltro[v], (a) => Aviso.donde(a, prefs).clave);
      else if (k === 'requisitos') opciones = opcionesDe('requisitos', REQUISITOS, (v) => F.requisitos[v], Aviso.categoriaRequisitos);
      else opciones = opcionesDe('postulacion', POSTULACIONES, (v) => T.avisos.postulacion[v], (a) => a.estado_postulacion);
      return Filtros.cuerpoValores({ nombre: nombreFiltro(k), opciones, elegidos: filtros[k], todosTexto: F.todosColumna[k], buscador: k === 'ubicacion',
        alCambiar: (v) => { filtros[k] = v; aplicarFiltro(); } });
    }
    const cuerpo = h('div', { class: 'formulario filtro-cuerpo' });
    const aviso = h('p', { class: 'campo-error', role: 'alert' });
    const prefsLinea = h('div', { class: 'filtro-prefs' });
    function pintarPrefs() {
      Terna.vaciar(prefsLinea);
      if (!BUSQUEDA.includes(k) && k !== 'match') return;
      prefsLinea.append(h('p', { class: 'campo-ayuda', text: k === 'match' ? T.inicio.umbralActual(umbral) : F.enPreferencias(resumenLista(k, busquedaPrefs[k])) }));
      if (cambiado(k)) {
        prefsLinea.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => {
          if (k === 'match') { filtros.matchMin = null; filtros.bajoUmbral = false; filtros.soloBajo = false; } else filtros[k] = null;
          aplicarFiltro();
          Terna.reemplazarCuerpoHoja(cuerpoFiltro(k, desdeEncabezado));
          const primero = document.querySelector('dialog.hoja[open] .filtro-cuerpo input');
          if (primero) primero.focus();
        } }, icono('i-deshacer', 'icono-16'), F.usarPreferencias));
      }
    }
    if (BUSQUEDA.includes(k) || k === 'interes') {
      const elegidos = k === 'interes' ? filtros.interes : efectiva(k);
      const grupo = h('div', { class: 'chips' }, TODOS[k].map((v) => opcion('checkbox', k, v, nombreDe(k, v), elegidos.includes(v), ICONOS[k] ? ICONOS[k](v) : null)));
      grupo.addEventListener('change', (e) => {
        const marcados = Array.from(grupo.querySelectorAll('input:checked')).map((x) => x.value);
        if (!marcados.length) { e.target.checked = true; aviso.textContent = F.alMenosUna; return; }
        aviso.textContent = '';
        if (k === 'interes') filtros.interes = marcados; else filtros[k] = propio(k, marcados);
        aplicarFiltro();
        pintarPrefs();
      });
      cuerpo.append(h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: F.nombres[k] }), grupo), aviso);
      if (F.sinDato[k]) cuerpo.append(h('p', { class: 'campo-ayuda', text: F.sinDato[k] }));
    } else {
      // Match: primero qué avisos según el umbral (los que llegan, los que quedan debajo o todos) y debajo el mínimo, que se mueve dentro
      // de lo que cada opción deja ver (diseno.md 0.32 §7.2).
      const idRango = Terna.idUnico('match');
      const limites = () => ({ llegan: [umbral, 100], tambien: [piso, 100], solo: [piso, topeBajo] })[modoUmbral()];
      const rango = h('input', { type: 'range', id: idRango, name: 'match', min: String(limites()[0]), max: String(limites()[1]), step: '1', value: String(minimo()) });
      const valor = h('output', { class: 'umbral-valor', for: idRango, text: String(minimo()) });
      const nombreModos = Terna.idUnico('mostrar');
      const opcionModo = (modo, texto) => opcion('radio', nombreModos, modo, texto, modoUmbral() === modo);
      // Con el umbral en el piso no queda ningún aviso debajo: no hay qué elegir.
      const modos = umbral <= piso ? null : h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: F.mostrarGrupo }),
        h('div', { class: 'chips chips-modos' }, opcionModo('llegan', F.mostrarLlegan), opcionModo('solo', F.mostrarSoloBajo), opcionModo('tambien', F.mostrarBajo)));
      // "Lo tuyo se ve desde el piso" no dice nada cuando se ven solo los que no llegan: todo se ve desde el piso.
      const ayudaTuyos = conTuyos ? h('p', { class: 'campo-ayuda', hidden: filtros.soloBajo, text: F.matchTuyos(piso, criterio.puestos.length > 0, criterio.empresas.length > 0) }) : null;
      const aplicarMatch = () => {
        const v = Number(rango.value);
        filtros.matchMin = modoUmbral() === 'llegan' && v === umbral ? null : v;
        aplicarFiltro();
        pintarPrefs();
      };
      rango.addEventListener('input', () => { valor.textContent = rango.value; });
      rango.addEventListener('change', aplicarMatch);
      if (modos) modos.addEventListener('change', (e) => {
        const modo = e.target.value;
        filtros.bajoUmbral = modo === 'tambien';
        filtros.soloBajo = modo === 'solo';
        const [min, max] = limites();
        const antes = Number(rango.value);
        rango.min = String(min);
        rango.max = String(max);
        // Al pasar a ver los que no llegan, el mínimo baja al piso; al volver a los que llegan, sube al umbral si estaba debajo.
        rango.value = String(modo === 'llegan' ? Math.max(antes, umbral) : piso);
        valor.textContent = rango.value;
        if (ayudaTuyos) ayudaTuyos.hidden = filtros.soloBajo;
        aplicarMatch();
      });
      if (conOrden) cuerpo.append(Filtros.botonOrden(F.ordenar.match, orden === 'match', () => cambiarOrden('match')));
      Terna.agregar(cuerpo, [modos, h('div', { class: 'campo' },
        h('div', { class: 'interruptor-fila' }, h('label', { class: 'campo-etiqueta', for: idRango, text: F.matchMinimo }), valor),
        rango, ayudaTuyos)]);
    }
    pintarPrefs();
    cuerpo.append(prefsLinea);
    return cuerpo;
  }
  // Al cerrar, el foco vuelve al botón que abrió el filtro; si era un encabezado, al de la tabla de ahora (se rehízo); si su lugar ya
  // no se ve (la tabla ocultó o mostró la columna, diseno.md 0.22 §1.34), al otro lugar del filtro o al primer filtro.
  function abrirFiltro(k, boton, desdeEncabezado) {
    filtroAbierto = k;
    Filtros.abrir({ clave: k, titulo: nombreFiltro(k), cuerpo: cuerpoFiltro(k, desdeEncabezado), boton,
      destino: () => {
        const th = lista.querySelector('th [data-filtro="' + k + '"]');
        if (desdeEncabezado) return seVe(th) ? th : (seVe(botones[k]) ? botones[k] : primerFiltro());
        return seVe(botones[k]) ? botones[k] : (seVe(th) ? th : primerFiltro());
      },
      alCerrar: () => { filtroAbierto = null; } });
  }

  /* ---------- La ficha del aviso (§7.5), en dos órdenes (PLAN-UX §3.2) ----------
     La cabecera es una carpeta: la lengüeta grande, que baja a «Por qué ajusta», y el marbete con la postulación (el estado se dice
     ahí una vez). En Armados, el paquete primero (documentos, notas, salario, idioma, palabras que faltan), después por qué ajusta y al
     final una sola línea de cómo va la postulación con «Ver en Postulaciones»; al pie, «Abrir aviso» y «No me interesa». En Por
     armar, por qué ajusta primero, los dos botones de interés solo si te toca decidir, el paquete (con Pedir paquete) y dónde se
     postula; al pie, «Abrir aviso» y «No me interesa». */
  let fichaPorQue = null;
  function cabeceraFicha(a, idTitulo) {
    return Aviso.cabezaFicha({ a, idTitulo, umbral, alPorQue: fichaPorQue ? () => Aviso.bajarA(fichaPorQue) : null });
  }
  function seccionPaquete(a) {
    const FI = T.avisos.ficha;
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: FI.paquete }));
    if (a.paquete_id) { sec.append(Aviso.fichasPaquete(Object.assign({}, a, { terminos_faltantes: faltanPor.get(a.match_id) || [] }))); return sec; }
    const e = Aviso.estadoPaquete(a);
    if (e === 'sin_texto') sec.append(h('p', { text: FI.sinTexto[quienBusca(a)] }));
    else if (e === 'por_puntuar') sec.append(h('p', { text: FI.porPuntuar }));
    else if (e === 'pedido') {
      const l = lugarDe(a);
      sec.append(h('p', { text: l ? T.avisos.pedidoLugarAccesible(l, Math.ceil(l / cupo)) + '.' : FI.loArma }),
        h('div', { class: 'botones' }, h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'cancelar-pedido' }, onclick: () => cancelar(a) }, icono('i-cerrar', 'icono-16'), T.avisos.cancelarPedido)));
    } else if (e === 'no_se_pudo_armar') sec.append(h('p', { text: FI.noSePudo }));
    else if (!prefs.armar_paquetes) sec.append(h('p', { text: FI.armarNo }));
    else {
      sec.append(h('p', { text: FI.sinDocs }));
      if (puedePedir(a)) sec.append(h('div', { class: 'botones' }, botonPedir(a, true, true)));
    }
    return sec;
  }
  // Armados: cómo va la postulación en una línea (la del marbete, sin repetir su chip) y el link a su ficha en Postulaciones.
  function lineaEstado(a) {
    const texto = Aviso.lineaEtapa(a, config);
    const link = enPostulaciones(a) ? h('a', { href: 'postulaciones.html#postulacion-' + a.match_id, text: T.avisos.ficha.verEnPostulaciones }) : null;
    if (!texto && !link) return null;
    return h('section', { class: 'ficha-seccion ficha-estado' }, h('h3', { text: T.avisos.ficha.postulacion }), h('p', null, texto ? texto + ' ' : null, link));
  }
  function cuerpoFicha(a) {
    const FI = T.avisos.ficha;
    const enArmados = pestanaDe(a) === 'armados';
    const razones = Aviso.razones(a, false);
    const porQue = (a.razones || []).length ? razones[0] : null;
    const requisitos = razones.find((s) => s.querySelector('.ficha-seccion-cuerpo.requisitos')) || null;
    const paquete = seccionPaquete(a);
    fichaPorQue = porQue || requisitos;
    const chips = h('div', { class: 'chips' }, Aviso.chipInteres(a, config), enArmados ? null : Aviso.chipPaquete(a), Aviso.chipCalificacion(a), chipTuPuesto(a), Aviso.fecha(a));
    const etiquetas = Aviso.etiquetas(a, bajoMinimo(a), true, enArmados ? null : fuera(a));
    const motivo = conMotivo && a.interes === 'no_me_interesa' ? Aviso.lineaMotivo(a, () => refrescar(a)) : null;
    if (enArmados) {
      return [Aviso.saltos([{ nodo: paquete, texto: T.avisos.columnas.paquete }, { nodo: porQue, texto: FI.porQue }, { nodo: requisitos, texto: FI.requisitos }]),
        chips, etiquetas, motivo, paquete, ...razones, Aviso.seccionTerna(a), lineaEstado(a)];
    }
    const decidir = grupoDe(a) === 'decidir' ? accionInteres(a, 'ficha') : null;
    return [Aviso.saltos([{ nodo: porQue, texto: FI.porQue }, { nodo: requisitos, texto: FI.requisitos }, { nodo: paquete, texto: T.avisos.columnas.paquete }]),
      chips, etiquetas, decidir, motivo, ...razones, paquete, Aviso.seccionTerna(a), Aviso.seccionPostulacion(a, config, prefs)];
  }
  // «Abrir aviso en …» es el primario solo cuando hay algo para hacer afuera: con la postulación enviada, postulada o en cola de Terna,
  // va como secundario. «No me interesa» va al pie, salvo en lo que te toca decidir (los dos botones están en el cuerpo); lo que no te
  // interesa lleva «Me interesa» para volverlo.
  const POSTULACION_HECHA = ['en_cola', 'enviada', 'postulado'];
  function accionesFicha(a) {
    const afuera = POSTULACION_HECHA.includes(a.estado_postulacion) ? 'btn btn-ancho' : null;
    const b = h('div', { class: 'botones' }, Aviso.abrirAviso(a, afuera, prefs), Aviso.verAviso(a, prefs));
    if (a.interes === 'no_me_interesa') {
      b.append(h('button', { class: 'btn btn-texto', type: 'button', dataset: { control: 'interes-si' }, onclick: () => cambiarInteres(a, 'me_interesa') }, T.avisos.interes.me_interesa));
    } else if (grupoDe(a) !== 'decidir') {
      b.append(h('button', { class: 'btn btn-texto', type: 'button', dataset: { control: 'interes-no_me_interesa' }, onclick: () => cambiarInteres(a, 'no_me_interesa') }, T.avisos.interes.no_me_interesa));
    }
    return b;
  }
  function marcarElegida() {
    const abierta = Terna.hojaAbierta();
    for (const tr of lista.querySelectorAll('tr.elegida')) tr.classList.remove('elegida');
    if (abierta && abierta.clave) {
      const tr = lista.querySelector('tr[data-match="' + abierta.clave + '"]');
      if (tr) tr.classList.add('elegida');
    }
  }
  // `seccion`: 'porque' (la lengüeta de una carpeta o el match de una línea) baja hasta «Por qué ajusta»; 'notas' y 'salario' (la fila
  // de documentos de una carpeta) despliegan ese panel del paquete y bajan hasta él.
  function abrirFicha(a, origen, desdeHash, seccion) {
    // Una sola entrada de historial por ficha: si ya hay una abierta, se reemplaza (así "atrás" o cerrar no reabre la anterior).
    if (!desdeHash && location.hash !== '#aviso-' + a.match_id) {
      if (history.state && history.state.ficha && /^#aviso-/.test(location.hash)) history.replaceState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
      else history.pushState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
    }
    const idTitulo = Terna.idUnico('ficha');
    // El cuerpo primero: dice si hay «Por qué ajusta», y con eso la lengüeta de la cabecera es un botón o no.
    const cuerpo = cuerpoFicha(a);
    // Al cerrar, el foco vuelve a lo que la abrió; si la lista se rehízo mientras estaba abierta, al mismo aviso en la lista nueva.
    const primero = origen || null;
    const volver = () => {
      if (primero && primero.isConnected) return primero;
      const n = nodoDe(a);
      return n ? (n.tagName === 'TR' ? n : n.querySelector('[data-control="abrir"]')) : null;
    };
    Terna.abrirHoja({ cabecera: cabeceraFicha(a, idTitulo), idTitulo, cuerpo, acciones: accionesFicha(a), enLinea: true,
      origen: volver, clave: a.match_id,
      alCerrar: (porUsuario) => { marcarElegida(); if (porUsuario) limpiarHash(); } });
    marcarElegida();
    if (seccion === 'porque' && fichaPorQue) Aviso.bajarA(fichaPorQue);
    if (seccion === 'notas' || seccion === 'salario') {
      const abierta = Terna.hojaAbierta();
      const b = abierta ? abierta.el.querySelector('.fichas-paquete [aria-controls^="' + seccion + '-"]') : null;
      if (b) {
        b.click();
        Aviso.bajarA(document.getElementById(b.getAttribute('aria-controls')));
      }
    }
  }
  function limpiarHash() {
    if (!/^#aviso-/.test(location.hash)) return;
    if (history.state && history.state.ficha) history.back();
    else history.replaceState(null, '', location.pathname + location.search + '#' + HASH[pestana]);
  }

  /* ---------- Los links de entrada (PLAN-UX §3.2) ----------
     nada: Armados (si está vacía y hay cola, Por armar) · ?interes=por_decidir y ?paquete=sin_texto: Por armar, con ese filtro ·
     ?empresa=, ?puesto=, ?donde=: la pestaña donde hay resultados (si hay en las dos, Por armar) · #aviso-<id>: la pestaña de ese aviso,
     con su ficha · #armados, #por-armar: esa pestaña · #proximos: Por armar, en Tus pedidos. */
  function pestanaInicial() {
    const hash = (location.hash || '').slice(1);
    const m = /^aviso-([0-9a-f-]{36})$/i.exec(hash);
    if (m && porId.has(m[1])) return pestanaDe(porId.get(m[1]));
    if (DE_HASH[hash]) return DE_HASH[hash];
    if (q.get('interes') === 'por_decidir' || q.get('paquete') === 'sin_texto') return 'por_armar';
    const r = porPestana();
    const enCola = r.por_armar.length + r.pedidos.filter((a) => pasa(a)).length;
    if (q.get('empresa') || q.get('puesto') || DONDES.includes(q.get('donde'))) return enCola || !r.armados.length ? 'por_armar' : 'armados';
    return !r.armados.length && (r.por_armar.length || r.pedidos.length) ? 'por_armar' : 'armados';
  }
  function sincronizarHash() {
    const hash = (location.hash || '').slice(1);
    const m = /^aviso-([0-9a-f-]{36})$/i.exec(hash);
    const abierta = Terna.hojaAbierta();
    if (m && porId.has(m[1])) {
      const a = porId.get(m[1]);
      if (pestanaDe(a) !== pestana) { pestana = pestanaDe(a); if (pestana === 'armados') Lista.visitaArmados(); dibujar(); }
      if (!abierta || abierta.clave !== a.match_id) abrirFicha(a, null, true);
      return;
    }
    if (abierta && abierta.clave) Terna.cerrarHoja(false);
    if (DE_HASH[hash] && DE_HASH[hash] !== pestana) {
      pestana = DE_HASH[hash];
      if (pestana === 'armados') Lista.visitaArmados();
      dibujar();
    }
    if (hash === 'proximos') irAProximos();
  }
  window.addEventListener('popstate', sincronizarHash);
  document.addEventListener('terna:cambio-diseno', () => dibujarLista());
  document.addEventListener('terna:cambio-ancho', () => {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) { Terna.cerrarHoja(false); abrirFicha(porId.get(abierta.clave), null, true); }
  });

  // Al final de Por armar, adónde ir a buscar otro (busqueda.md 0.2 §4.6; PLAN-UX §3.2 punto 6).
  if (contenido && T.busqueda) {
    cierre.append(T.busqueda.enAvisos + ' ', h('a', { href: 'busqueda.html', text: T.comun.pestanas.busqueda }), '.');
    contenido.append(cierre);
  }
  // Arriba, al lado del título, la puerta a Empleos.
  if (irBusqueda && T.busqueda) {
    Terna.agregar(irBusqueda, [icono('i-buscar', 'icono-16'), T.busqueda.enInicioLink]);
    irBusqueda.hidden = false;
  }

  pestana = pestanaInicial();
  if (pestana === 'armados') Lista.visitaArmados();
  dibujarHerramientas();
  armarPestanas();
  armarBarra();
  dibujar();
  sincronizarHash();
});
