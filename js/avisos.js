/* Terna · js/avisos.js
   Avisos (diseno.md §7): la lista por match, la barra de filtros (que arranca en las preferencias de búsqueda del momento,
   diseno.md 0.11 §7.2), los filtros por columna (diseno.md 0.21 §7.2 y §10.18), el interés en el lugar, los próximos paquetes
   (diseno.md 0.21 §7.8), la ficha y el texto pegado.
   Lee mis_avisos, preferencias, paquetes (solo contenido→render→bajo_minimo y →terminos_faltantes), corridas_usuarios
   (si Terna ya corrió) y config; escribe con marcar_interes, pedir_paquete, cancelar_pedido, pegar_texto_aviso, desde 0025
   marcar_motivo_no_interesa (datos.md 0.20 §14) y desde 0029 ordenar_pedidos (datos.md 0.25 §14). Con 0025 lee además
   `evaluacion` (el veredicto y "Cómo se calcula") y `motivo_no_interesa`; sin ella, la página anda como antes
   (Aviso.leerConEvaluacion). Sin 0029, los próximos paquetes van sin Subir ni Bajar. De preferencias lee la fila entera.
   La ficha lista las palabras del aviso que el CV no tiene, sin botón: se suman en Preferencias (datos.md 0.23 §14; desde 0.23
   no hay sumar_palabra_clave). Desde 0027 trae priorizar_puestos (datos.md 0.22 §14; brand.md 0.5.4 §6.4; diseno.md
   0.18 §7): con algún puesto que cuente, los avisos de tus puestos (js/puestos.js, la regla del motor) llevan "Tu puesto", pasan
   el filtro Match desde el piso, deciden con el control de interés y se pueden ordenar primero. Sin la columna, vale Sí.
   Desde brand.md 0.8 "Pedir paquete" y "No me interesa" piden confirmación, y "Pedir" va en la columna Paquete. */
'use strict';

Terna.pagina('avisos', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const lista = document.getElementById('lista');
  const herramientas = document.getElementById('herramientas');
  const cajaFiltros = document.getElementById('filtros');
  const cajaProximos = document.getElementById('proximos');
  const cuenta = document.getElementById('cuenta');
  const COLUMNAS = 'match_id, aviso_id, puesto, empresa, ubicacion, pais, modalidad, alcance, url, fuente, postulacion, ats_formulario, dudoso, publicado_en, visto_en, tiene_texto, texto_origen, match, razones, requisitos_faltantes, interes, estado_paquete, pedido_en, creado_en, nuevo, paquete_id, paquete_idioma, cv_path, carta_path, salario_monto, salario_moneda, salario_periodo, salario_motivo, notas, estado_postulacion, motivo_a_mano, traba_detalle, intentos, en_cola_en, enviada_en, postulado_en, entrevista_en, nivel, jornada';

  const parar = Terna.cargando(lista);
  const [rA, rP, rB, rC] = await Promise.all([
    Aviso.leerConEvaluacion((cols) => sb.from('mis_avisos').select(cols), COLUMNAS),
    // La fila entera: trae lo de cada migración que esté aplicada (0027: priorizar_puestos), y sin ella no falla.
    sb.from('preferencias').select('*').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo, terminos_faltantes:contenido->render->terminos_faltantes'),
    sb.from('corridas_usuarios').select('fecha').eq('usuario_id', ctx.usuario.id).limit(1),
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
  const yaCorrio = (rC.data || []).length > 0;
  // Priorizar mis puestos (0027): sin la columna vale Sí, como en el motor. Solo cuentan los puestos que no son generales.
  const misPuestos = prefs.priorizar_puestos === false ? [] : (prefs.puestos_objetivo || []).filter((x) => x && !Puestos.general(x));
  const priorizar = misPuestos.length > 0;
  const puestoDe = new Map(priorizar
    ? avisos.filter((a) => a.match !== null && a.match >= piso).map((a) => [a.match_id, Puestos.buscado(a.puesto, misPuestos)]) : []);
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);

  /* ---------- Filtros y orden (diseno.md 0.11 §7.2; desde 0.21, también por columna) ----------
     Modalidad, Alcance, Nivel y Jornada arrancan en las preferencias de búsqueda del momento, y Match en el umbral: si la
     persona cambia sus preferencias, la lista las sigue en el acto, sin esperar la corrida. Un filtro de búsqueda que la persona
     cambió se recuerda en el navegador mientras sus preferencias sigan iguales (`huella`); si las cambia, vuelve a ellas.
     Los de columna (Puesto, Empresa, Ubicación, Publicado) y Paquete y Postulación, que desde 0.21 eligen varios, se recuerdan
     igual que Interés. En escritorio los de columna van en la barra solo cuando están puestos: el encabezado los abre. */
  const INTERESES = ['me_interesa', 'por_decidir', 'no_me_interesa'];
  const PAQUETES = ['armado', 'sin_armar', 'pedido', 'no_se_pudo_armar', 'sin_texto', 'por_puntuar'];
  const POSTULACIONES = ['pendiente', 'en_cola', 'para_revisar', 'enviada', 'a_mano', 'postulado', 'entrevista'];
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const DE_COLUMNA = ['puesto', 'empresa', 'ubicacion', 'publicado'];
  const CLAVES = ['modalidad', 'alcance', 'nivel', 'jornada', 'match', 'interes', 'paquete', 'postulacion', ...DE_COLUMNA];
  const TODOS = Object.assign({ interes: INTERESES }, Aviso.TODOS_BUSQUEDA);
  const busquedaPrefs = Aviso.busquedaDe(prefs);
  const huella = JSON.stringify([busquedaPrefs, umbral]);
  const INTERES_INICIAL = ['me_interesa', 'por_decidir'];
  const inicial = () => ({ modalidad: null, alcance: null, nivel: null, jornada: null, matchMin: null, bajoUmbral: false,
    interes: INTERES_INICIAL.slice(), paquete: null, postulacion: null, puesto: '', empresa: '', ubicacion: null, publicado: null });
  const mismos = (x, y) => x.length === y.length && x.every((v) => y.includes(v));
  const deLista = (v, todos) => { if (!Array.isArray(v)) return null; const l = todos.filter((x) => v.includes(x)); return l.length ? l : null; };
  // Un filtro de búsqueda igual a las preferencias se guarda como null: "según tus preferencias".
  const propio = (k, l) => (!l || mismos(l, busquedaPrefs[k]) ? null : l);
  // Hasta 0.21 Paquete y Postulación eran uno solo ('todos', 'armado'…): se leen como lista.
  const unoOVarios = (v, todos) => (Array.isArray(v) ? Filtros.listaValida(v, todos) : (todos.includes(v) ? [v] : null));
  function validos(f) {
    const r = inicial();
    if (!f || typeof f !== 'object') return r;
    r.interes = deLista(f.interes, INTERESES) || r.interes;
    r.paquete = unoOVarios(f.paquete, PAQUETES);
    r.postulacion = unoOVarios(f.postulacion, POSTULACIONES);
    r.puesto = Filtros.textoValido(f.puesto);
    r.empresa = Filtros.textoValido(f.empresa);
    r.ubicacion = Filtros.listaValida(f.ubicacion, null);
    r.publicado = Filtros.fechaValida(f.publicado);
    // Los filtros guardados antes de la barra (sin `v`) conservan el match: significaba lo mismo. Modalidad y Alcance
    // vacíos querían decir "todo"; ahora arrancan en las preferencias.
    const legado = !(f.v >= 2);
    if (legado || f.huella === huella) {
      r.matchMin = Number.isInteger(f.matchMin) ? f.matchMin : null;
      r.bajoUmbral = f.bajoUmbral === true;
    }
    if (!legado && f.huella === huella) for (const k of BUSQUEDA) r[k] = propio(k, deLista(f[k], TODOS[k]));
    return r;
  }
  const guardados = Terna.leerLocal('avisos.filtros', null);
  let filtros = validos(guardados);
  // Si las preferencias cambiaron, lo que la persona había cambiado sobre las de antes se olvida también en el navegador (si
  // no, al volver a las preferencias de antes reaparecería).
  if (guardados && guardados.huella !== huella) guardarFiltros();
  const q = new URLSearchParams(location.search);
  if (q.get('interes') === 'por_decidir') filtros = Object.assign(inicial(), { interes: ['por_decidir'] });
  if (q.get('paquete') === 'sin_texto') filtros = Object.assign(inicial(), { paquete: ['sin_texto'] });
  // El orden elegido se recuerda mientras "Priorizar mis puestos" siga igual (diseno.md 0.18 §7.2): al prenderlo, "Tus puestos
  // primero"; al apagarlo, lo que la persona había elegido. Hasta 0.18 se guardaba solo el texto del orden.
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
  function busqueda() { return { modalidad: efectiva('modalidad'), alcance: efectiva('alcance'), nivel: efectiva('nivel'), jornada: efectiva('jornada') }; }
  function minimo() {
    const m = filtros.matchMin === null ? umbral : filtros.matchMin;
    return filtros.bajoUmbral ? Math.max(piso, Math.min(m, 100)) : Math.max(m, umbral);
  }
  const fechaDe = (a) => a.publicado_en || a.visto_en;
  let busquedaHoy = busqueda();
  // `excepto`: todos los filtros menos ese (para contar las opciones de un filtro con lo que dejan pasar los demás).
  function pasa(a, excepto) {
    if (excepto !== 'interes' && !filtros.interes.includes(a.interes)) return false;
    if (excepto !== 'paquete' && filtros.paquete && !filtros.paquete.includes(Aviso.estadoPaquete(a))) return false;
    if (excepto !== 'postulacion' && filtros.postulacion && !filtros.postulacion.includes(a.estado_postulacion)) return false;
    if (!Aviso.pasaBusqueda(a, busquedaHoy)) return false;
    if (a.match !== null && a.match < minimo() && !esTuPuesto(a)) return false;
    if (excepto !== 'puesto' && !Filtros.contiene(a.puesto, filtros.puesto)) return false;
    if (excepto !== 'empresa' && !Filtros.contiene(a.empresa, filtros.empresa)) return false;
    if (excepto !== 'ubicacion' && filtros.ubicacion && !filtros.ubicacion.includes(Aviso.lugar(a))) return false;
    if (excepto !== 'publicado' && !Filtros.pasaFecha(fechaDe(a), filtros.publicado)) return false;
    return true;
  }
  // Fuera de las preferencias (no del filtro): Terna no lo decide sola; la tarjeta ofrece "Pedir" como bajo el umbral.
  const fuera = (a) => Aviso.motivosFuera(a, busquedaPrefs);
  // De tus puestos, como lo toma el motor (pipeline.md 0.4.15 §4.9 punto 3c): desde el piso, con interés y dentro de las preferencias.
  const esTuPuesto = (a) => !!puestoDe.get(a.match_id) && a.interes !== 'no_me_interesa' && !fuera(a).length;
  const decideSola = (a) => (Aviso.llega(a, umbral) || esTuPuesto(a)) && !fuera(a).length;
  function chipTuPuesto(a) {
    if (!esTuPuesto(a)) return null;
    const explicacion = T.avisos.tuPuestoExplicacion(puestoDe.get(a.match_id), Aviso.llega(a, umbral));
    return h('span', { class: 'chip-texto tinta tu-puesto', title: explicacion }, icono('i-foco', 'icono-14'), h('span', { text: T.avisos.tuPuesto }), oculto(': ' + explicacion));
  }
  const desc = (x, y) => (x === y ? 0 : (x === null || x === undefined) ? 1 : (y === null || y === undefined) ? -1 : (x < y ? 1 : -1));
  function comparar(a, b) {
    if (orden === 'nuevos') return desc(a.publicado_en, b.publicado_en) || desc(a.visto_en, b.visto_en);
    if (orden === 'puestos' && esTuPuesto(a) !== esTuPuesto(b)) return esTuPuesto(a) ? -1 : 1;
    return desc(a.match, b.match) || (a.dudoso === b.dudoso ? 0 : a.dudoso ? 1 : -1)
      || desc(a.publicado_en, b.publicado_en) || desc(a.creado_en, b.creado_en);
  }
  function visibles() { busquedaHoy = busqueda(); return avisos.filter((a) => pasa(a)).sort(comparar); }

  function cambiado(k) {
    if (BUSQUEDA.includes(k)) return filtros[k] !== null;
    if (k === 'match') return minimo() !== umbral;
    if (k === 'interes') return !mismos(filtros.interes, INTERES_INICIAL);
    if (k === 'puesto' || k === 'empresa') return Filtros.hayTexto(filtros[k]);
    return filtros[k] !== null;  // paquete, postulación, ubicación, publicado
  }
  const algoCambiado = () => CLAVES.some(cambiado);
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
    if (k === 'match') return priorizar ? F.matchResumenPuestos(minimo()) : F.matchResumen(minimo());
    if (k === 'paquete') return Filtros.resumenLista(filtros.paquete, PAQUETES, (v) => T.avisos.paquete[v], F.todos);
    if (k === 'postulacion') return Filtros.resumenLista(filtros.postulacion, POSTULACIONES, (v) => T.avisos.postulacion[v], F.todas);
    if (k === 'puesto' || k === 'empresa') return Filtros.resumenTexto(filtros[k], F.todosColumna[k]);
    if (k === 'ubicacion') return Filtros.resumenLista(filtros.ubicacion, todasUbicaciones(), (v) => v, F.todosColumna.ubicacion);
    if (k === 'publicado') return Filtros.resumenFecha(filtros.publicado, F.todosColumna.publicado);
    return resumenLista(k, k === 'interes' ? filtros.interes : efectiva(k));
  }
  function volverAPreferencias() { filtros = inicial(); guardarFiltros(); dibujar(); }

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
  const estadoFiltros = h('div', { class: 'filtros-estado' });
  function armarBarra() {
    const barra = h('div', { class: 'filtros-barra', role: 'group', 'aria-label': F.barra });
    for (const k of CLAVES) {
      const b = h('button', { class: 'filtro-boton' + (DE_COLUMNA.includes(k) ? ' de-columna' : ''), type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', dataset: { filtro: k } },
        h('span', { class: 'filtro-nombre', text: nombreFiltro(k) + ':' }), ' ', h('span', { class: 'filtro-valor' }),
        h('span', { class: 'oculto-visual filtro-cambiado' }), icono('i-chevron', 'icono-16'));
      b.addEventListener('click', () => abrirFiltro(k, b, false));
      botones[k] = b;
      barra.append(b);
    }
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
    Terna.vaciar(estadoFiltros);
    if (algoCambiado()) {
      const v = h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => { volverAPreferencias(); botones[CLAVES[0]].focus(); } },
        icono('i-deshacer', 'icono-16'), F.volverPreferencias);
      estadoFiltros.append(v);
    } else {
      estadoFiltros.append(h('span', { text: F.segunPreferencias }), ' ', h('a', { href: 'preferencias.html#busqueda', text: F.cambiarPreferencias }));
      if (enfocado) botones[CLAVES[0]].focus();
    }
  }

  /* ---------- Lista: tarjetas (celular) o tabla (escritorio) ---------- */
  function dibujar() { actualizarBarra(); dibujarLista(); }
  function dibujarLista() {
    Terna.vaciar(lista);
    const vis = visibles();
    cuenta.textContent = avisos.length ? T.avisos.cuenta(vis.length) : '';
    if (!avisos.length) {
      lista.append(h('div', { class: 'vacio' }, h('p', { text: yaCorrio ? T.avisos.vacioSinAvisos : T.avisos.vacioSinCorrida }),
        h('a', { class: 'btn', href: 'preferencias.html' }, T.avisos.revisarPreferencias)));
      return;
    }
    if (!vis.length) {
      if (algoCambiado()) {
        lista.append(h('div', { class: 'vacio' }, h('p', { text: T.avisos.vacioFiltros }),
          h('button', { class: 'btn', type: 'button', onclick: () => { volverAPreferencias(); botones[CLAVES[0]].focus(); } }, F.volverPreferencias)));
      } else {
        lista.append(h('div', { class: 'vacio' }, h('p', { text: T.avisos.vacioPreferencias }),
          h('a', { class: 'btn', href: 'preferencias.html#busqueda' }, T.avisos.revisarPreferencias)));
      }
      // Con la tabla vacía, los encabezados no están: si un filtro de columna dejó la lista vacía, se ve igual en la barra.
      return;
    }
    if (Terna.anchoEscritorio.matches) lista.append(tabla(vis));
    else lista.append(h('ul', { class: 'lista-tarjetas', role: 'list' }, vis.map((a) => h('li', null, tarjeta(a)))));
    marcarElegida();
  }

  function puedePedir(a) {
    return a.tiene_texto && prefs.armar_paquetes && a.estado_paquete === 'sin_armar' && !a.paquete_id && a.interes !== 'no_me_interesa';
  }
  // "Pedir" en la columna Paquete y en la tarjeta (corto, con el puesto en el nombre accesible); "Pedir paquete" en la ficha.
  function botonPedir(a, largo) {
    return h('button', { class: largo ? 'btn' : 'btn btn-fila', type: 'button', dataset: { control: 'pedir' }, 'aria-label': largo ? null : T.avisos.pedirAccesible(a.puesto),
      onclick: () => pedir(a) }, largo ? T.avisos.pedirPaquete : T.avisos.pedir);
  }
  function botonPegar(a, corto) {
    if (corto) {
      return h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'pegar' }, 'aria-label': T.avisos.pegarAccesible(a.puesto), onclick: () => pegarTexto(a) },
        icono('i-pegar', 'icono-16'), T.avisos.pegarCorto);
    }
    return h('button', { class: 'btn btn-ancho', type: 'button', dataset: { control: 'pegar' }, onclick: () => pegarTexto(a) }, icono('i-pegar'), T.avisos.ficha.pegar);
  }
  // El lugar de un pedido en los próximos paquetes, debajo del chip "Pedido": "2.º · próxima corrida".
  function lineaPedido(a) {
    const l = lugarDe(a);
    if (!l) return null;
    const corridas = Math.ceil(l / cupo);
    return h('span', { class: 'pedido-lugar' }, h('span', { 'aria-hidden': 'true', text: T.avisos.pedidoLugar(l, corridas) }), oculto(T.avisos.pedidoLugarAccesible(l, corridas)));
  }
  // Lo que se hace con el paquete, al lado de su chip (diseno.md 0.21 §7.3 y §7.6): Pedir debajo de "Sin armar", Pegar texto
  // debajo de "Sin texto", el lugar debajo de "Pedido". En la tarjeta del celular, "Pegar el texto" sigue siendo el botón ancho.
  function accionPaquete(a, enTabla) {
    if (a.estado_paquete === 'pedido' && !a.paquete_id) return lineaPedido(a);
    if (!a.tiene_texto) return enTabla ? botonPegar(a, true) : null;
    // Un texto pegado que Terna todavía no puntuó ("Por puntuar") no se pide: espera su match.
    if (Aviso.estadoPaquete(a) === 'sin_armar' && puedePedir(a)) return botonPedir(a, false);
    return null;
  }
  // La columna Interés: el control de interés para lo que Terna decide sola; para lo demás (bajo el umbral, fuera de las
  // preferencias, sin texto, por puntuar), "No me interesa", o "Me interesa" para volverlo. `donde` (tabla, tarjeta o ficha) da
  // a cada grupo de radios su nombre: la ficha abierta y la fila del mismo aviso no pueden compartirlo.
  function accionesAviso(a, donde) {
    if (a.tiene_texto && a.match !== null && decideSola(a)) return Aviso.controlInteres(a, ({ tabla: 'it-', tarjeta: 'ic-', ficha: 'if-' })[donde] + a.match_id, (v) => cambiarInteres(a, v));
    const cont = h('div', { class: 'acciones-tarjeta' });
    if (a.interes === 'no_me_interesa') {
      cont.append(h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'interes-si' }, onclick: () => cambiarInteres(a, 'me_interesa') }, icono('i-tilde', 'icono-16'), T.avisos.interes.me_interesa));
    } else {
      cont.append(h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'interes-no' }, 'aria-label': T.avisos.noMeInteresaAccesible(a.puesto),
        onclick: () => cambiarInteres(a, 'no_me_interesa') }, icono('i-no-interesa', 'icono-16'), T.avisos.interes.no_me_interesa));
    }
    return cont;
  }

  function tarjeta(a) {
    const art = h('article', { class: 'tarjeta tarjeta-aviso', dataset: { match: a.match_id } });
    const boton = h('button', { class: 'tarjeta-boton', type: 'button', dataset: { control: 'abrir' }, onclick: () => abrirFicha(a, boton) },
      h('span', { class: 'aviso-datos' },
        h('span', { class: 'aviso-puesto', text: a.puesto }),
        a.empresa ? h('span', { class: 'aviso-empresa', text: a.empresa }) : null,
        Aviso.atributos(a),
        Aviso.etiquetas(a, bajoMinimo(a), false, fuera(a))),
      Aviso.bloqueMatch(a, umbral));
    const bajo = a.match !== null && !Aviso.llega(a, umbral);
    const tuyo = chipTuPuesto(a);
    Terna.agregar(art, [boton,
      h('div', { class: 'chips' }, Aviso.chipInteres(a, config), Aviso.chipPaquete(a), accionPaquete(a, false), Aviso.chipPostulacion(a), Aviso.chipCalificacion(a),
        tuyo || (bajo ? h('span', { class: 'chip-texto', text: T.avisos.bajoUmbral }) : null), Aviso.fecha(a)),
      !a.tiene_texto ? botonPegar(a, false) : null,
      accionesAviso(a, 'tarjeta')]);
    return art;
  }

  // Los encabezados abren el filtro de su columna (diseno.md 0.21 §7.6 y §10.18); Match y Publicado además ordenan, desde su panel.
  let filtroAbierto = null;
  function tabla(vis) {
    const C = T.avisos.columnas;
    const th = (texto, clave, clase, sort) => Filtros.encabezado({ texto, clave, clase, activo: cambiado(clave), abierto: filtroAbierto === clave, sort,
      alAbrir: (b) => abrirFiltro(clave, b, true) });
    const thead = h('thead', null, h('tr', null,
      th(C.puesto, 'puesto', 'col-puesto'), th(C.empresa, 'empresa', 'col-empresa'), th(C.modalidad, 'modalidad', 'col-modalidad'),
      th(C.ubicacion, 'ubicacion', 'col-ubicacion'), th(C.match, 'match', 'der', orden === 'match' ? 'descending' : 'none'), th(C.paquete, 'paquete', 'col-paquete'),
      th(C.postulacion, 'postulacion', 'col-postulacion'), th(C.interes, 'interes', 'col-interes'), th(C.publicado, 'publicado', 'col-publicado', orden === 'nuevos' ? 'descending' : 'none'),
      h('th', { scope: 'col', text: C.aviso })));
    const tbody = h('tbody', null, vis.map(fila));
    return h('div', { class: 'tabla-caja tabla-avisos' }, h('table', { class: 'tabla' }, thead, tbody));
  }
  // Lo que dicen las columnas que la tabla esconde cuando no le alcanza el ancho (diseno.md 0.8 §7.6): empresa, lugar y
  // modalidad debajo del puesto, como en la fila de Postulaciones. Oculta mientras las columnas se ven.
  function lineaApoyo(a) {
    return h('div', { class: 'atributos linea-apoyo' },
      a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null,
      h('span', { text: Aviso.lugar(a) }), a.modalidad ? h('span', { text: ' · ' + T.avisos.modalidadMin[a.modalidad] }) : null);
  }
  function fila(a) {
    const bajo = a.match !== null && !Aviso.llega(a, umbral);
    const faltan = Aviso.chipCalificacion(a);
    const tuyo = chipTuPuesto(a);
    const tr = h('tr', { tabindex: '0', dataset: { match: a.match_id, control: 'abrir' } },
      h('td', { class: 'col-puesto' }, h('div', { class: 'aviso-puesto', text: a.puesto }), lineaApoyo(a), Aviso.etiquetas(a, bajoMinimo(a), false, fuera(a)), faltan ? h('div', null, faltan) : null,
        tuyo ? h('div', null, tuyo) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-modalidad' }, a.modalidad ? h('span', { class: 'atributos' }, icono('i-' + a.modalidad, 'icono-16'), T.avisos.modalidadMin[a.modalidad]) : null),
      h('td', { class: 'col-ubicacion' }, h('span', { class: 'atributos' }, icono(a.alcance === 'exterior' ? 'i-exterior' : 'i-local', 'icono-16'), Aviso.lugar(a))),
      h('td', { class: 'tabla-match' + (Aviso.llega(a, umbral) || a.match === null ? '' : ' bajo') },
        h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, Aviso.llega(a, umbral)))),
      h('td', { class: 'col-paquete' }, h('div', { class: 'celda-paquete' }, Aviso.chipPaquete(a), accionPaquete(a, true),
        bajo && !tuyo ? h('span', { class: 'chip-texto', text: T.avisos.bajoUmbral }) : null)),
      h('td', { class: 'col-postulacion' }, Aviso.chipInteres(a, config), Aviso.chipPostulacion(a)),
      h('td', { class: 'col-interes' }, accionesAviso(a, 'tabla')),
      h('td', { class: 'col-publicado' }, Aviso.fecha(a)),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: a.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
    tr.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrirFicha(a, tr); });
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) { e.preventDefault(); abrirFicha(a, tr); } });
    return tr;
  }

  function nodoDe(a) { return lista.querySelector('[data-match="' + a.match_id + '"]'); }
  // Rehace la tarjeta o la fila de un aviso y devuelve el foco al mismo control.
  function refrescar(a) {
    const viejo = nodoDe(a);
    if (viejo) {
      const enfocado = viejo.contains(document.activeElement) ? (document.activeElement.dataset.control || 'abrir') : null;
      const nuevo = viejo.tagName === 'TR' ? fila(a) : tarjeta(a);
      viejo.replaceWith(nuevo);
      if (enfocado) {
        const destino = nuevo.dataset.control === enfocado ? nuevo : nuevo.querySelector('[data-control="' + enfocado + '"]') || nuevo.querySelector('[data-control="abrir"]') || nuevo;
        destino.focus();
      }
      marcarElegida();
    }
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
  }
  // "No me interesa" saca la tarjeta con 150 ms y lleva el foco a la siguiente (o a la anterior si era la última).
  async function sacar(a) {
    const nodo = nodoDe(a);
    const filas = Array.from(lista.querySelectorAll('[data-match]'));
    const i = nodo ? filas.indexOf(nodo) : -1;
    const teniaFoco = nodo && nodo.contains(document.activeElement);
    if (nodo && nodo.classList.contains('tarjeta')) {
      nodo.classList.add('saliendo');
      await new Promise((r) => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150));
    }
    dibujar();
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
    if (teniaFoco) {
      const nuevas = Array.from(lista.querySelectorAll('[data-match]'));
      const destino = nuevas[Math.min(i, nuevas.length - 1)];
      if (destino) (destino.tagName === 'TR' ? destino : destino.querySelector('[data-control="abrir"]')).focus();
      else Terna.devolverFoco(null);
    }
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
    const estaba = pasa(a);
    const eraPedido = a.estado_paquete === 'pedido';
    const error = valor === 'no_me_interesa' ? await Aviso.marcarNoInteresa(a, motivo)
      : (await sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: valor })).error;
    if (error) { avisarError(error); volverInteres(a, anterior); return; }
    a.interes = valor;
    if (valor !== 'no_me_interesa') a.motivo_no_interesa = null;  // la base lo borra igual (0025, disparador)
    if (valor === 'no_me_interesa') {
      if (a.estado_paquete === 'pedido') { a.estado_paquete = 'sin_armar'; a.pedido_en = null; }
      if (a.estado_postulacion === 'en_cola' || a.estado_postulacion === 'para_revisar') a.estado_postulacion = 'pendiente';
    }
    const queda = pasa(a);
    if (eraPedido) refrescarPedidos();
    if (estaba && !queda) await sacar(a);
    else if (!estaba && queda) { dibujar(); }
    else refrescar(a);
    if (deshaciendo) {
      // El foco estaba en el aviso breve, que ya no existe: vuelve al aviso.
      const n = nodoDe(a);
      if (n) (n.tagName === 'TR' ? n : n.querySelector('[data-control="abrir"]')).focus();
    } else {
      Terna.avisoBreve(valor === 'no_me_interesa' ? T.avisos.noTeInteresa : T.avisos.teInteresa,
        { icono: valor === 'no_me_interesa' ? 'i-no-interesa' : 'i-tilde', deshacer: () => cambiarInteres(a, anterior, true) });
    }
  }
  // Si no se confirma o la base no lo guarda, el control de interés vuelve a como estaba sin rehacer la fila: rehacerla se
  // llevaba el foco (el diálogo lo devuelve a la opción que se tocó, que ya no estaba). En el grupo que tiene el foco, el foco
  // pasa a la opción marcada.
  function volverInteres(a, anterior) {
    const activo = document.activeElement;
    let foco = null;
    for (const pre of ['it-', 'ic-', 'if-']) {
      document.getElementsByName(pre + a.match_id).forEach((x) => {
        x.checked = x.value === anterior;
        if (x.checked && activo && activo.name === x.name) foco = x;
      });
    }
    if (foco) foco.focus();
  }
  // Pedir paquete: primero la confirmación, que dice en qué lugar queda y cuándo se arma (brand.md 0.8 §6.4).
  async function pedir(a) {
    const lugar = pedidosOrdenados().length + 1;
    const corridas = Math.ceil(lugar / cupo);
    const si = await Aviso.confirmarPedir(a, { lugar, corridas, cupo, prefs });
    if (!si) return;
    const { error } = await sb.rpc('pedir_paquete', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'pedido';
    a.pedido_en = new Date().toISOString();
    a.interes = 'me_interesa';
    a.motivo_no_interesa = null;
    refrescarPedidos();
    refrescar(a);
    Terna.avisoBreve(T.avisos.pedido(lugar, corridas), { icono: 'i-pedido', deshacer: () => cancelar(a, true) });
  }
  // Cancelar un pedido (desde los próximos paquetes, la ficha o el Deshacer de Pedir). Con Deshacer vuelve a su lugar.
  async function cancelar(a, deshaciendo) {
    const antes = pedidosOrdenados();
    const i = antes.indexOf(a);
    const { error } = await sb.rpc('cancelar_pedido', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'sin_armar';
    a.pedido_en = null;
    refrescarPedidos();
    refrescar(a);
    if (deshaciendo) { const n = nodoDe(a); if (n) (n.tagName === 'TR' ? n : n.querySelector('[data-control="abrir"]')).focus(); return; }
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
      refrescarPedidos();
      refrescar(a);
    } });
  }

  /* ---------- Próximos paquetes (diseno.md 0.21 §7.8; brand.md 0.8 §6.4; datos.md 0.25, 0029) ----------
     Lo que la persona pidió, en el orden en que el motor lo arma (pipeline.md §4.9 punto 3: por pedido_en), con cuándo se arma
     cada uno (3 por corrida) y Subir, Bajar y Cancelar pedido. No se muestran con nombre los que Terna elegiría sola: dependen
     de los avisos nuevos de esa mañana y de la prueba de los formularios, y sería prometer algo que puede no pasar. */
  // pedido_en llega de la base con microsegundos ("…:00.123456+00:00") y de la web con milisegundos ("…:00.123Z"): se compara
  // por instante, con los microsegundos que Date.parse no lee.
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
  // Los que Terna puede elegir sola (la misma cuenta que la selección del motor, sin lo que la web no ve: avisos cerrados, la
  // empresa de la semana y la prueba de los formularios).
  const candidatosSolos = () => avisos.filter((a) => a.interes === 'me_interesa' && a.tiene_texto && a.match !== null && a.estado_paquete === 'sin_armar'
    && !a.paquete_id && !fuera(a).length && (Aviso.llega(a, umbral) || esTuPuesto(a))).length;
  // ¿La base tiene 0029? Se pregunta una vez, con un orden vacío (no hace nada), y solo cuando hay dos pedidos o más.
  let conOrdenar = null;
  // Sin 0029 la función no está: PostgREST dice PGRST202 (404); si su caché todavía la tiene, Postgres dice 42883.
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
    Terna.vaciar(cajaProximos);
    cajaProximos.hidden = !pedidos.length;
    if (!pedidos.length) return;
    if (pedidos.length > 1 && conOrdenar === null) comprobarOrdenar().then((si) => { if (si) dibujarProximos(); });
    const ordenable = conOrdenar === true && pedidos.length > 1;
    const icBoton = (iconoId, etiqueta, control, a, desactivado, fn) => h('button', { class: 'btn btn-fila btn-icono', type: 'button', 'aria-label': etiqueta, title: etiqueta,
      'aria-disabled': desactivado ? 'true' : null, dataset: { pedido: a.match_id, control }, onclick: () => { if (!desactivado) fn(); } }, icono(iconoId, 'icono-16'));
    const items = pedidos.map((a, i) => {
      const corridas = Math.ceil((i + 1) / cupo);
      const abrir = h('button', { class: 'proximo-abrir', type: 'button', dataset: { pedido: a.match_id, control: 'abrir' }, onclick: () => abrirFicha(a, abrir) }, a.puesto);
      return h('li', { class: 'proximo', dataset: { pedido: a.match_id } },
        h('span', { class: 'proximo-lugar num', 'aria-hidden': 'true', text: String(i + 1) }),
        h('div', { class: 'proximo-datos' }, abrir,
          h('span', { class: 'proximo-detalle' }, a.empresa ? a.empresa + ' · ' : '', h('span', { class: 'proximo-cuando', text: prefs.armar_paquetes === false ? '' : P.cuando(corridas) }))),
        h('div', { class: 'proximo-acciones' },
          ordenable ? icBoton('i-arriba', P.subir(a.puesto), 'subir', a, i === 0, () => mover(a, -1)) : null,
          ordenable ? icBoton('i-abajo', P.bajar(a.puesto), 'bajar', a, i === pedidos.length - 1, () => mover(a, 1)) : null,
          icBoton('i-cerrar', P.cancelar(a.puesto), 'cancelar', a, false, () => cancelar(a))));
    });
    const libres = cupo - pedidos.length;
    let pie;
    if (prefs.armar_paquetes === false) pie = h('p', { class: 'proximos-pie' }, P.armarNo + ' ', h('a', { href: 'preferencias.html#paquetes', text: P.cambiarlo }));
    else if (libres > 0) pie = h('p', { class: 'proximos-pie', text: P.resto(candidatosSolos()) });
    else pie = h('p', { class: 'proximos-pie', text: P.lleno(pedidos.length, Math.ceil(pedidos.length / cupo)) });
    cajaProximos.append(
      h('h2', { class: 'tarjeta-titulo', id: 'proximos-titulo' }, P.titulo, ' ', h('span', { class: 'cuenta-avisos num', text: String(pedidos.length) })),
      h('p', { class: 'campo-ayuda', text: P.intro(cupo) }),
      h('ol', { class: 'proximos-lista', role: 'list' }, items),
      pie, anuncio);
    if (enfocar) {
      const b = cajaProximos.querySelector('[data-pedido="' + enfocar.id + '"][data-control="' + enfocar.control + '"]');
      if (b) b.focus();
    }
  }
  // Rehace la tarjeta de los próximos paquetes y las filas de los pedidos (su lugar cambia con cada pedido que entra o sale).
  function refrescarPedidos(enfocar) {
    dibujarProximos(enfocar);
    for (const a of avisos) if (a.estado_paquete === 'pedido' && nodoDe(a)) refrescar(a);
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
    refrescarPedidos({ id: a.match_id, control });
    if (ok) anuncio.textContent = T.avisos.proximos.movido(a.puesto, j + 1, pedidos.length);
  }
  // Si la base dice que los pedidos cambiaron (el motor armó uno, otra pestaña pidió o canceló), se vuelven a leer.
  async function releerPedidos() {
    const { data, error } = await sb.from('mis_avisos').select('match_id, estado_paquete, pedido_en, paquete_id');
    if (error || !data) return;
    for (const f of data) { const a = porId.get(f.match_id); if (a) Object.assign(a, f); }
  }

  function pegarTexto(a) {
    const origen = document.activeElement;
    const max = config.max_texto_pegado_chars || 20000;
    const min = config.min_texto_pegado_chars || 100;
    const idAyuda = Terna.idUnico('ayuda');
    const idCont = Terna.idUnico('cont');
    const idErr = Terna.idUnico('err');
    const area = h('textarea', { class: 'control', rows: '8', 'aria-describedby': idAyuda + ' ' + idCont + ' ' + idErr });
    const contador = h('p', { class: 'campo-ayuda num', id: idCont, text: T.avisos.contador(0, max) });
    const err = h('p', { class: 'campo-error', id: idErr, role: 'alert' });
    area.addEventListener('input', () => { contador.textContent = T.avisos.contador(area.value.length, max); });
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button' }, T.avisos.guardarTexto);
    const bCancelar = h('button', { class: 'btn', type: 'button' }, T.comun.cancelar);
    const dlg = Terna.dialogo({ titulo: T.avisos.pegarTitulo, cuerpo: [h('p', { class: 'campo-ayuda', id: idAyuda, text: T.avisos.pegarAyuda(a.fuente) }), area, contador, err], botones: [bCancelar, bGuardar] });
    area.setAttribute('aria-labelledby', dlg.getAttribute('aria-labelledby'));
    bCancelar.addEventListener('click', () => dlg.close());
    bGuardar.addEventListener('click', async () => {
      const texto = area.value.trim();
      let problema = null;
      if (!texto) problema = T.errores.completa;
      else if (texto.length < min) problema = T.errores.textoCorto;
      else if (texto.length > max) problema = T.errores.textoLargo(max);
      if (problema) { err.textContent = problema; area.setAttribute('aria-invalid', 'true'); area.focus(); return; }
      bGuardar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.rpc('pegar_texto_aviso', { p_match_id: a.match_id, p_texto: texto });
      bGuardar.removeAttribute('aria-disabled');
      if (error) { if (!Terna.siSesionVencida(error)) { err.textContent = Terna.textoError(error); area.setAttribute('aria-invalid', 'true'); } return; }
      dlg.close();
      Object.assign(a, { tiene_texto: true, texto_origen: 'usuario', match: null, razones: [], requisitos_faltantes: [] });
      refrescar(a);
      Terna.avisoBreve(T.avisos.textoGuardado);
    });
    dlg.addEventListener('close', () => Terna.devolverFoco(origen));
    dlg.showModal();
    area.focus();
  }

  /* ---------- Un filtro (§7.2): hoja en celular, panel debajo de su botón en escritorio ----------
     Se aplica al tocar, con la lista a la vista detrás; "Listo" (o la cruz, o Esc) cierra y devuelve el foco al botón. Lo abren
     los botones de la barra y, en la tabla, los encabezados (`desdeEncabezado`: el panel de Match y el de Publicado suman el orden). */
  function opcion(tipo, nombre, valor, texto, elegido, iconoId) {
    return h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: tipo, name: nombre, value: valor, checked: elegido }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), iconoId ? icono(iconoId) : null, texto));
  }
  const ICONOS = { modalidad: (v) => 'i-' + v, alcance: (v) => 'i-' + v };
  function aplicarFiltro() { guardarFiltros(); dibujar(); }
  // Las opciones de un filtro de valores, con cuántos avisos deja ver cada una junto con los demás filtros.
  function opcionesDe(k, valores, texto, valorDe) {
    busquedaHoy = busqueda();
    const base = avisos.filter((a) => pasa(a, k));
    return valores.map((v) => ({ valor: v, texto: texto(v), n: base.filter((a) => valorDe(a) === v).length }));
  }
  function cuerpoFiltro(k, desdeEncabezado) {
    if (k === 'puesto' || k === 'empresa') {
      return Filtros.cuerpoTexto({ valor: filtros[k], alCambiar: (v) => { filtros[k] = v; aplicarFiltro(); } });
    }
    if (k === 'publicado') {
      const cuerpo = Filtros.cuerpoFecha({ valor: filtros.publicado, alCambiar: (v) => { filtros.publicado = v; aplicarFiltro(); } });
      if (desdeEncabezado) cuerpo.prepend(Filtros.botonOrden(F.ordenar.nuevos, orden === 'nuevos', () => cambiarOrden('nuevos')));
      return cuerpo;
    }
    if (k === 'paquete' || k === 'postulacion' || k === 'ubicacion') {
      let opciones;
      if (k === 'ubicacion') {
        // Las que hay en la lista con los demás filtros, y las elegidas aunque ya no haya ninguna; de la más usada a la menos.
        busquedaHoy = busqueda();
        const base = avisos.filter((a) => pasa(a, 'ubicacion'));
        const valores = Array.from(new Set(base.map(Aviso.lugar).concat(filtros.ubicacion || [])));
        opciones = valores.map((v) => ({ valor: v, texto: v, n: base.filter((a) => Aviso.lugar(a) === v).length }))
          .sort((x, y) => (y.n - x.n) || x.texto.localeCompare(y.texto, 'es'));
      } else if (k === 'paquete') opciones = opcionesDe('paquete', PAQUETES, (v) => T.avisos.paquete[v], Aviso.estadoPaquete);
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
          if (k === 'match') { filtros.matchMin = null; filtros.bajoUmbral = false; } else filtros[k] = null;
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
      const idRango = Terna.idUnico('match');
      const rango = h('input', { type: 'range', id: idRango, name: 'match', min: String(filtros.bajoUmbral ? piso : umbral), max: '100', step: '1', value: String(minimo()) });
      const valor = h('output', { class: 'umbral-valor', for: idRango, text: String(minimo()) });
      const casilla = h('input', { type: 'checkbox', name: 'bajo', checked: filtros.bajoUmbral });
      const aplicarMatch = () => {
        filtros.bajoUmbral = casilla.checked;
        filtros.matchMin = !casilla.checked && Number(rango.value) === umbral ? null : Number(rango.value);
        aplicarFiltro();
        pintarPrefs();
      };
      rango.addEventListener('input', () => { valor.textContent = rango.value; });
      rango.addEventListener('change', aplicarMatch);
      casilla.addEventListener('change', () => {
        if (casilla.checked) { rango.min = String(piso); rango.value = String(piso); }
        else { rango.min = String(umbral); if (Number(rango.value) < umbral) rango.value = String(umbral); }
        valor.textContent = rango.value;
        aplicarMatch();
      });
      if (desdeEncabezado) cuerpo.append(Filtros.botonOrden(F.ordenar.match, orden === 'match', () => cambiarOrden('match')));
      cuerpo.append(h('div', { class: 'campo' },
        h('div', { class: 'interruptor-fila' }, h('label', { class: 'campo-etiqueta', for: idRango, text: F.matchMinimo }), valor),
        rango, h('label', { class: 'casilla' }, casilla, h('span', { text: F.mostrarBajo })),
        priorizar ? h('p', { class: 'campo-ayuda', text: F.matchPuestos(piso) }) : null));
    }
    pintarPrefs();
    cuerpo.append(prefsLinea);
    return cuerpo;
  }
  // Al cerrar, el foco vuelve al botón que abrió el filtro; si era un encabezado, al de la tabla de ahora (se rehízo); si era
  // un filtro de columna de la barra que se borró (en escritorio sale de la barra), a su encabezado o al primer filtro.
  const visible = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
  function abrirFiltro(k, boton, desdeEncabezado) {
    filtroAbierto = k;
    Filtros.abrir({ clave: k, titulo: nombreFiltro(k), cuerpo: cuerpoFiltro(k, desdeEncabezado), boton,
      destino: () => {
        const th = lista.querySelector('th [data-filtro="' + k + '"]');
        if (desdeEncabezado) return visible(th) ? th : (visible(botones[k]) ? botones[k] : botones[CLAVES[0]]);
        return visible(botones[k]) ? botones[k] : (visible(th) ? th : botones[CLAVES[0]]);
      },
      alCerrar: () => { filtroAbierto = null; } });
  }

  /* ---------- Ficha del aviso (§7.5) ---------- */
  function cabeceraFicha(a, idTitulo) {
    return h('div', { class: 'ficha-cabecera' },
      h('div', null, h('h2', { class: 'ficha-titulo', id: idTitulo, text: a.puesto }),
        a.empresa ? h('p', { class: 'ficha-empresa', text: a.empresa }) : null, Aviso.atributos(a, { fuente: true, tag: 'p' })),
      Aviso.bloqueMatch(a, umbral, true));
  }
  function seccionPaquete(a) {
    const FI = T.avisos.ficha;
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: FI.paquete }));
    if (a.paquete_id) { sec.append(Aviso.fichasPaquete(Object.assign({}, a, { terminos_faltantes: faltanPor.get(a.match_id) || [] }))); return sec; }
    const e = Aviso.estadoPaquete(a);
    if (e === 'sin_texto') sec.append(h('p', { text: FI.sinTexto }), botonPegar(a, false));
    else if (e === 'por_puntuar') sec.append(h('p', { text: FI.porPuntuar }));
    else if (e === 'pedido') {
      const l = lugarDe(a);
      sec.append(h('p', { text: l ? T.avisos.pedidoLugarAccesible(l, Math.ceil(l / cupo)) + '.' : FI.loArma }),
        h('div', { class: 'botones' }, h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'cancelar-pedido' }, onclick: () => cancelar(a) }, icono('i-cerrar', 'icono-16'), T.avisos.cancelarPedido)));
    } else if (e === 'no_se_pudo_armar') sec.append(h('p', { text: FI.noSePudo }));
    else if (!prefs.armar_paquetes) sec.append(h('p', { text: FI.armarNo }));
    else {
      sec.append(h('p', { text: FI.sinDocs }));
      if (puedePedir(a)) sec.append(h('div', { class: 'botones' }, botonPedir(a, true)));
    }
    return sec;
  }
  function cuerpoFicha(a) {
    const partes = [
      h('div', { class: 'chips' }, Aviso.chipInteres(a, config), Aviso.chipPaquete(a), Aviso.chipCalificacion(a), chipTuPuesto(a), Aviso.fecha(a)),
      Aviso.etiquetas(a, bajoMinimo(a), true, fuera(a)),
    ];
    if (a.match !== null && a.tiene_texto) partes.push(accionesAviso(a, 'ficha'));
    if (conMotivo && a.interes === 'no_me_interesa') partes.push(Aviso.lineaMotivo(a, () => refrescar(a)));
    partes.push(...Aviso.razones(a, false), seccionPaquete(a), Aviso.seccionPostulacion(a, config));
    return partes;
  }
  function accionesFicha(a) {
    const b = h('div', { class: 'botones' }, Aviso.abrirAviso(a));
    if (a.interes === 'me_interesa') {
      b.append(h('button', { class: 'btn btn-texto', type: 'button', onclick: () => cambiarInteres(a, 'no_me_interesa') }, T.avisos.interes.no_me_interesa));
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
  function abrirFicha(a, origen, desdeHash) {
    // Una sola entrada de historial por ficha: si ya hay una abierta, se reemplaza (así "atrás" o cerrar no reabre la anterior).
    if (!desdeHash && location.hash !== '#aviso-' + a.match_id) {
      if (history.state && history.state.ficha && /^#aviso-/.test(location.hash)) history.replaceState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
      else history.pushState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
    }
    const idTitulo = Terna.idUnico('ficha');
    Terna.abrirHoja({ cabecera: cabeceraFicha(a, idTitulo), idTitulo, cuerpo: cuerpoFicha(a), acciones: accionesFicha(a), enLinea: true,
      origen: origen || nodoDe(a), clave: a.match_id,
      alCerrar: (porUsuario) => { marcarElegida(); if (porUsuario) limpiarHash(); } });
    marcarElegida();
  }
  function limpiarHash() {
    if (!/^#aviso-/.test(location.hash)) return;
    if (history.state && history.state.ficha) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
  function sincronizarHash() {
    const m = /^#aviso-([0-9a-f-]{36})$/i.exec(location.hash);
    const abierta = Terna.hojaAbierta();
    if (m && porId.has(m[1])) {
      if (!abierta || abierta.clave !== m[1]) abrirFicha(porId.get(m[1]), null, true);
    } else if (abierta && abierta.clave) {
      Terna.cerrarHoja(false);
    }
  }
  window.addEventListener('popstate', sincronizarHash);
  document.addEventListener('terna:cambio-diseno', () => dibujarLista());
  document.addEventListener('terna:cambio-ancho', () => {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) { Terna.cerrarHoja(false); abrirFicha(porId.get(abierta.clave), null, true); }
  });

  dibujarHerramientas();
  armarBarra();
  dibujarProximos();
  dibujar();
  sincronizarHash();
});
