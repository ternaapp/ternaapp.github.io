/* Terna · js/inicio.js
   Inicio (diseno.md 0.26 §6): la última corrida, cómo viene el período, qué hay para hacer y, debajo, el tablero: las empresas
   que seguís y los puestos que buscás, tu lista hoy y semana a semana. Pedido de Francisco del 07/11/2026 ("más dashboard").
   Todo se cuenta en el navegador con lo que la página puede leer (cero tokens): mi_resumen(p_desde) para lo de arriba y, una
   vez por semana de las últimas ocho, para "Semana a semana" (así esta semana da lo mismo que "Cómo viene"); mis_avisos con las
   columnas que usa Avisos, contadas con las reglas de `js/lista.js` (lo que dice Inicio es lo que muestra Avisos al tocarlo);
   y preferencias, que desde 0034 traen las empresas que seguís (sin la columna, el tablero va sin "Empresas que seguís" ni "Seguir").
   Desde el rediseño B2 «Sello» (opciones-v3/PLAN-WEB.md §3.1) cambia solo el dibujo: arriba, en carpetas, lo que te toca a vos (B2
   lo llamaba «Los tres de hoy»; ver lineaHoy); el tablero pasa de tarjetas a secciones con filas, cifras y plegables; y la cuenta de
   lo que te toca va al muelle y al carril. Las lecturas son las mismas. */
'use strict';

Terna.pagina('inicio', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const I = T.inicio;
  const sb = ctx.sb;
  const cont = document.getElementById('inicio');
  const PERIODOS = ['semana', 'mes', 'todo'];
  let periodo = Terna.leerLocal('inicio.periodo', 'semana');
  if (!PERIODOS.includes(periodo)) periodo = 'semana';
  const num = (x) => Number(x || 0);
  const pct = (x, max) => (max > 0 ? Math.round((x / max) * 1000) / 10 : 0);
  const conCuenta = (el, x) => { el.style.setProperty('--cuenta', String(x)); return el; };

  const parar = Terna.cargando(cont);
  // La fila entera de preferencias (trae lo de cada migración aplicada) y las postulaciones a mano (diseno.md 0.25 §1.36).
  const [rPref, rAMano] = await Promise.all([
    sb.from('preferencias').select('*').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.from('mis_avisos').select('match_id, puesto, match, interes, pedido_en, estado_postulacion, modalidad, alcance, nivel, jornada')
      .eq('estado_postulacion', 'a_mano').neq('interes', 'no_me_interesa'),
  ]);
  const prefs = rPref.data || { umbral: 70, paquetes_por_dia: 3 };
  const paquetesDia = prefs.paquetes_por_dia || 3;
  const piso = (ctx.config && ctx.config.piso_match) || 50;
  // "Para hacer a mano" cuenta solo lo que Terna te sugiere (Aviso.sugerida); si alguna lectura falla, el número de mi_resumen.
  const criterioAMano = Aviso.criterio(rPref.data, piso);
  const aManoSugeridas = rPref.error || !rPref.data || rAMano.error ? null : (rAMano.data || []).filter((a) => Aviso.sugerida(a, criterioAMano)).length;

  function desde() {
    const hoy = Terna.hoy();
    if (periodo === 'semana') return Terna.sumarDias(hoy, -6);
    if (periodo === 'mes') return Terna.sumarDias(hoy, -29);
    return null;
  }

  /* ---------- Lo de arriba: la corrida, cómo viene y qué hay para hacer ---------- */
  const corrida = h('div', { class: 'inicio-corrida' });
  const seg = h('div', { id: 'periodo', class: 'segmentado', role: 'radiogroup', 'aria-label': I.periodo });
  for (const p of PERIODOS) {
    seg.append(h('label', null,
      h('input', { type: 'radio', name: 'periodo', value: p, checked: p === periodo, onchange: () => { periodo = p; Terna.guardarLocal('inicio.periodo', p); recargarPeriodo(); } }),
      h('span', { text: I.periodos[p] })));
  }
  const cifras = h('div', { class: 'como-viene-cifras' });
  const comoViene = h('section', { class: 'tablero-seccion como-viene', 'aria-labelledby': 'h-como-viene' },
    h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-como-viene', text: I.comoViene }), seg), cifras);
  const queHay = h('section', { class: 'tablero-seccion que-hay', 'aria-labelledby': 'h-que-hay' });
  // Qué hay para hacer va primero: en el celular arriba de todo (revisión de UX: "qué le toca" en la primera pantalla); en escritorio,
  // a la derecha de Cómo viene, por la grilla.
  const tablero = h('div', { class: 'tablero' }, queHay, comoViene);

  function lineaCorrida(r) {
    Terna.vaciar(corrida);
    if (!r.ultima_corrida_fecha) { corrida.append(h('p', { text: I.noCorrio })); return; }
    if (r.ultima_corrida_terminada_en) {
      const dias = Terna.diasEntre(r.ultima_corrida_fecha, Terna.hoy());
      const hora = Terna.hora(r.ultima_corrida_terminada_en);
      corrida.append(h('p', { text: dias === 0 ? I.corrioHoy(hora) : dias === 1 ? I.corrioAyer(hora) : I.corrioEl(Terna.fechaCorta(r.ultima_corrida_fecha), hora) }));
    }
    const res = r.ultima_corrida_resultado;
    if (res && res !== 'armados') {
      const t = I.resultado[res];
      const texto = typeof t === 'function' ? (res === 'sin_umbral' ? t(r.umbral_actual) : t(paquetesDia)) : t;
      if (texto) corrida.append(h('p', { text: texto }));
    }
  }

  // Cómo viene (diseno.md 0.26 §10.14; desde 0.33, sin Entrevistas): las cuatro cifras en filas. Solo la primera lleva barra, porque es la única que es una parte de
  // un todo: lo que pasó tu umbral, en tinta, de lo que llegó, con el gris. Las otras cuentan lo que pasó en el período y no son un
  // embudo (un paquete de hoy puede ser de un aviso de la semana pasada): con barras se leían como "6 de 17" (revisión de UX).
  function dibujarCifras(r) {
    const C = I.cifras;
    const total = num(r.avisos_nuevos);
    const sobre = num(r.sobre_umbral);
    const filas = [
      { clave: 'nuevos', valor: sobre, resto: Math.max(0, total - sobre), etiqueta: C.nuevos, nota: C.total(total) },
      { clave: 'armados', valor: num(r.paquetes_armados), etiqueta: C.armados },
      { clave: 'enviadas', valor: num(r.enviadas), etiqueta: C.enviadas },
      { clave: 'a-mano', valor: num(r.postulados_a_mano), etiqueta: C.aMano },
    ];
    const max = Math.max(1, total, sobre);
    const dl = h('dl', { class: 'cifras etapas' });
    for (const f of filas) {
      const barra = f.clave !== 'nuevos' ? null : h('dd', { class: 'etapa-barra', 'aria-hidden': 'true' },
        f.valor ? conCuenta(h('span', { class: 'etapa-relleno' }), pct(f.valor, max)) : null,
        f.resto ? conCuenta(h('span', { class: 'etapa-resto' }), pct(f.resto, max)) : null);
      dl.append(h('div', { class: 'etapa', dataset: { etapa: f.clave } },
        h('dt', { class: 'cifra-etiqueta', text: f.etiqueta }),
        h('dd', { class: 'cifra-numero', text: Terna.numero(f.valor) }),
        barra,
        f.nota ? h('dd', { class: 'cifra-nota num', text: f.nota }) : null));
    }
    Terna.vaciar(cifras).append(dl);
  }

  // "3 postulaciones para hacer a mano": la cifra, grande, y el resto. El texto queda igual (el banco lo compara entero).
  function conCifra(texto) {
    const m = /^(\d[\d.]*)(\s[\s\S]*)$/.exec(texto);
    return m ? [h('b', { class: 'num', text: m[1] }), m[2]] : texto;
  }
  // Lo que te toca lleva el ícono en ámbar (fila-toca); lo que espera a Terna (en cola) va apagado, sin link.
  function filaPendiente(href, iconoId, texto) {
    if (!href) return h('div', { class: 'fila fila-info' }, icono(iconoId, 'icono-l'), h('span', null, conCifra(texto)));
    return h('a', { class: 'fila fila-toca', href }, icono(iconoId, 'icono-l'), h('span', null, conCifra(texto)), icono('i-adelante', 'i-adelante'));
  }
  function dibujarQueHay(r) {
    Terna.vaciar(queHay).append(h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-que-hay', text: I.queHay })));
    if (ctx.faltantes.length) {
      queHay.append(h('div', { class: 'vacio' },
        h('p', { text: T.bandas.incompleto(Terna.listaFaltantes(ctx.faltantes)) }),
        h('a', { class: 'btn', href: 'perfil.html' }, T.bandas.completar)));
    } else {
      const filas = [];
      const cuantasAMano = aManoSugeridas === null ? num(r.a_mano_pendientes) : aManoSugeridas;
      if (cuantasAMano) filas.push(filaPendiente('postulaciones.html#a-mano', 'i-a-mano', I.aMano(cuantasAMano)));
      if (num(r.para_revisar)) filas.push(filaPendiente('postulaciones.html#para-revisar', 'i-revisar', I.paraRevisar(num(r.para_revisar))));
      if (num(r.por_decidir)) filas.push(filaPendiente('avisos.html?interes=por_decidir', 'i-por-decidir', I.porDecidir(num(r.por_decidir))));
      // Los avisos sin texto ya no son algo que te toca (brand.md 0.23 §6.3): los busca Terna y, si no puede, Francisco. Hasta 0.22,
      // "{n} avisos sin texto", con el link a Avisos, para pegarlos.
      if (num(r.en_cola)) filas.push(filaPendiente(null, 'i-pedido', I.enCola(num(r.en_cola))));
      if (filas.length) queHay.append(h('div', { class: 'filas' }, filas));
      else queHay.append(h('p', { class: 'nada-pendiente', text: I.nadaPendiente }));
    }
    queHay.append(h('p', { class: 'suave umbral-linea' }, I.umbralActual(r.umbral_actual), ' ', h('a', { href: 'preferencias.html', text: T.comun.pestanas.preferencias })));
  }

  /* La pregunta de las cuentas (diseno.md 0.29 §6, 1b; brand.md 0.16 §6.3; datos.md 0.32, 0036): una tarjeta a todo el ancho,
     arriba de Qué hay para hacer, solo mientras la pregunta no tiene respuesta y "Terna postula por vos" está en Sí. "Terna postula
     por vos" viene en Sí, así que casi nadie pasa por su interruptor en Preferencias: Inicio es donde todos llegan. Es la pregunta
     de Preferencias, corta. Al responder escribe en el acto, la tarjeta se va y queda una línea hasta la próxima visita.
     A quién se le muestra y la cuenta del último mes, en js/cuentas.js. */
  function preguntaCuentas() {
    const p = rPref.data;
    if (!Cuentas.seOfrecen(ctx.usuario, p) || !Cuentas.sinResponder(p) || p.postular_sola === false) return null;
    const C = I.cuentas;
    const R = T.preferencias.cuentas;
    const numero = h('strong', { id: 'pregunta-cuentas-numero', hidden: true });
    // Desde B2 es un pozo (una regla fina arriba, sin caja) y los dos botones son secundarios: el primario de la pantalla es la
    // acción de la primera carpeta de arriba (PLAN-WEB.md §3.1).
    const bSi = h('button', { class: 'btn', type: 'button', text: R.si });
    const bNo = h('button', { class: 'btn', type: 'button', text: R.no });
    const sec = h('section', { class: 'pozo pregunta-cuentas', id: 'pregunta-cuentas', 'aria-labelledby': 'h-cuentas' },
      h('h2', { id: 'h-cuentas', text: C.titulo }),
      h('p', null, C.texto, ' ', numero),
      h('div', { class: 'pregunta-cuentas-botones' }, bSi, bNo, h('a', { href: 'preferencias.html#postulacion', text: C.saber })));
    async function responder(valor) {
      if (bSi.getAttribute('aria-disabled') === 'true') return;
      for (const b of [bSi, bNo]) b.setAttribute('aria-disabled', 'true');
      const e = await Cuentas.responder(sb, ctx.usuario.id, valor);
      if (e) {
        for (const b of [bSi, bNo]) b.removeAttribute('aria-disabled');
        if (!Terna.siSesionVencida(e)) Terna.avisoBreve(T.errores.guardar, { error: true });
        return;
      }
      p.crear_cuentas = valor;
      // La tarjeta se va y el foco queda en la línea que dice que quedó, para que no se pierda ni quede sin anunciar.
      const listo = h('p', { class: 'pregunta-listo', id: 'pregunta-cuentas-listo', tabindex: '-1', text: C.listo });
      sec.replaceWith(listo);
      listo.focus();
    }
    bSi.addEventListener('click', () => responder(true));
    bNo.addEventListener('click', () => responder(false));
    Cuentas.leerAMano(sb).then((x) => {
      const cuantas = x.error ? 0 : Cuentas.delUltimoMes(x.data, p);
      if (cuantas) { numero.textContent = C.ultimoMes(cuantas); numero.hidden = false; }
    }, () => {});
    return sec;
  }

  // Cambiar el período rehace solo "Cómo viene"; lo anterior queda a media luz mientras llega lo nuevo, sin saltos.
  async function recargarPeriodo() {
    cifras.classList.add('recargando');
    const { data, error } = await sb.rpc('mi_resumen', { p_desde: desde() });
    cifras.classList.remove('recargando');
    if (error) { Terna.avisoBreve(Terna.textoError(error), { error: true }); return; }
    dibujarCifras((Array.isArray(data) ? data[0] : data) || {});
  }

  /* ---------- El tablero ---------- */
  // Lo justo para contar (unas veinte columnas, sin notas, razones ni evaluación), de a mil.
  const COLUMNAS = 'match_id, puesto, empresa, match, interes, estado_paquete, estado_postulacion, pedido_en, creado_en, nuevo, modalidad, alcance, nivel, jornada, '
    + 'postulacion, ats_formulario, url, url_postulacion, fuente, texto_origen, tiene_texto';
  async function leerAvisos() {
    const armar = (cols) => () => sb.from('mis_avisos').select(cols).order('match_id');
    const r = await Lista.leerTodo(armar(COLUMNAS + ', linkedin_postulacion'));
    // Sin 0031 no hay linkedin_postulacion: se pide sin ella (Aviso.donde lo resuelve como antes).
    if (r.error && /linkedin_postulacion/.test(String(r.error.message || ''))) return Lista.leerTodo(armar(COLUMNAS));
    return r;
  }
  const esNuevo = (a) => a.nuevo === true;
  const porMatch = (x, y) => (num(y.match) - num(x.match)) || String(y.creado_en || '').localeCompare(String(x.creado_en || ''));

  // Desde B2 las secciones del tablero no son tarjetas: un título, y filas de 56 px separadas por reglas finas.
  function cabeceraTarjeta(id, titulo, editar) {
    return h('div', { class: 'tablero-cabecera' }, h('h2', { id, text: titulo }),
      editar ? h('a', { class: 'btn btn-texto btn-chico', href: editar.href, 'aria-label': editar.accesible, text: editar.texto }) : null);
  }
  function vacio(texto, ayuda, boton) {
    return h('div', { class: 'tablero-vacio' }, h('p', { text: texto }), h('p', { class: 'suave', text: ayuda }),
      h('a', { class: 'btn', href: boton.href }, icono('i-agregar'), boton.texto));
  }
  // Un aviso en una línea: el match en Lexend, como en la lengüeta, el puesto y la empresa; abre su ficha en Avisos.
  function avisoMini(a) {
    return h('li', null, h('a', { class: 'aviso-mini fila', href: 'avisos.html#aviso-' + a.match_id },
      h('span', { class: 'aviso-mini-match', 'aria-hidden': 'true', text: a.match === null || a.match === undefined ? '—' : String(a.match) }),
      h('span', { class: 'aviso-mini-texto fila-texto' }, h('span', { class: 'aviso-mini-puesto fila-nombre', text: a.puesto }),
        h('span', { class: 'aviso-mini-empresa fila-linea', text: a.empresa || '' })),
      a.match === null || a.match === undefined ? null : oculto(', ' + T.avisos.matchAccesible(a.match)),
      icono('i-adelante', 'i-adelante')));
  }
  // Una fila de la lista de lo tuyo: el nombre, la cuenta, una línea más y, si hay avisos, el link a Avisos filtrado.
  function filaTuya(clase, nombre, cuenta, linea, href, derecha) {
    const texto = h('span', { class: 'tuya-texto fila-texto' }, h('span', { class: 'tuya-nombre fila-nombre', text: nombre }),
      h('span', { class: 'tuya-cuenta fila-linea', text: cuenta }), linea ? h('span', { class: 'tuya-linea fila-linea', text: linea }) : null);
    return h('li', { class: clase }, href
      ? h('a', { class: 'tuya fila', href }, texto, derecha, icono('i-adelante', 'i-adelante'))
      : h('div', { class: 'tuya fila fila-info' }, texto, derecha));
  }

  // Empresas que seguís (brand.md 0.13 §6.3): primero lo nuevo de la última corrida ("se abrieron dos avisos en tu empresa; son estos
  // dos"), después cada empresa con lo que tiene en tu lista y qué hace Terna con ella.
  function tarjetaEmpresas(L, enLista, seguidas) {
    const E = I.empresas;
    const sec = h('section', { class: 'tablero-seccion seguidas', 'aria-labelledby': 'h-empresas' },
      cabeceraTarjeta('h-empresas', E.titulo, seguidas.filas.length ? { href: 'preferencias.html#empresas', texto: E.editar, accesible: E.editarAccesible } : null));
    if (!seguidas.filas.length) {
      sec.append(vacio(E.vacio, E.vacioAyuda, { href: 'preferencias.html#empresas', texto: E.seguir }));
      return sec;
    }
    const deAlguna = (a) => seguidas.filas.some((f) => L.esLaEmpresa(a, f.nombre));
    // Lo nuevo primero ("se abrieron dos avisos en tu empresa; son estos dos"), después cada empresa con lo que tiene en tu lista.
    const nuevos = enLista.filter((a) => esNuevo(a) && deAlguna(a)).sort(porMatch);
    if (nuevos.length) sec.append(h('p', { class: 'tablero-destacado', text: E.nuevos(nuevos.length) }), h('ul', { class: 'avisos-mini filas', role: 'list' }, nuevos.slice(0, 3).map(avisoMini)));
    const ul = h('ul', { class: 'tuyas filas', role: 'list' });
    for (const f of seguidas.filas) {
      const deEsta = enLista.filter((a) => L.esLaEmpresa(a, f.nombre));
      const k = deEsta.filter(esNuevo).length;
      const cuenta = E.enLista(deEsta.length) + (k ? ', ' + E.nuevosCorto(k) : '');
      ul.append(filaTuya('seguida', f.nombre, cuenta, null, deEsta.length ? 'avisos.html?empresa=' + encodeURIComponent(f.nombre) : null, null));
    }
    sec.append(ul);
    if (prefs.priorizar_empresas === false) sec.append(h('p', { class: 'suave tablero-nota', text: E.apagado }));
    return sec;
  }

  // Puestos que buscás: cada puesto con lo que tiene en tu lista, lo nuevo y su mejor match.
  function tarjetaPuestos(L, enLista) {
    const P = I.puestos;
    const puestos = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim());
    const sec = h('section', { class: 'tablero-seccion buscados', 'aria-labelledby': 'h-puestos' },
      cabeceraTarjeta('h-puestos', P.titulo, puestos.length ? { href: 'preferencias.html#puestos', texto: P.editar, accesible: P.editarAccesible } : null));
    if (!puestos.length) {
      sec.append(vacio(P.vacio, P.vacioAyuda, { href: 'preferencias.html#puestos', texto: P.escribir }));
      return sec;
    }
    const ul = h('ul', { class: 'tuyas filas', role: 'list' });
    for (const p of puestos) {
      const deEste = enLista.filter((a) => L.esElPuesto(a, p));
      const k = deEste.filter(esNuevo).length;
      const mejor = deEste.reduce((m, a) => Math.max(m, num(a.match)), 0);
      const derecha = deEste.length && mejor ? h('span', { class: 'tuya-match' }, h('span', { class: 'tuya-match-numero', text: String(mejor) }), h('span', { class: 'tuya-match-etiqueta', text: P.mejor })) : null;
      ul.append(filaTuya('buscado', p, I.empresas.enLista(deEste.length) + (k ? ', ' + I.empresas.nuevosCorto(k) : ''), null,
        deEste.length ? 'avisos.html?puesto=' + encodeURIComponent(p) : null, derecha));
    }
    sec.append(ul);
    if (prefs.priorizar_puestos === false) sec.append(h('p', { class: 'suave tablero-nota', text: P.apagado }));
    return sec;
  }

  // Una lista de barras: el nombre, la cantidad y una barra de la escala del panel. `fila.href` la hace link a Avisos filtrado;
  // `fila.partes` parte la barra en lo que cuenta (oscuro) y lo que no (gris); `fila.fuera` la apaga entera.
  function barras(filas, opciones) {
    const max = Math.max(1, ...filas.map((f) => f.valor));
    const ul = h('ul', { class: 'barras', role: 'list' });
    for (const f of filas) {
      const partes = f.partes || [f.valor, 0];
      const barra = h('span', { class: 'barra-pista', 'aria-hidden': 'true' },
        partes[0] ? conCuenta(h('span', { class: 'barra-relleno' }), pct(partes[0], max)) : null,
        partes[1] ? conCuenta(h('span', { class: 'barra-resto' }), pct(partes[1], max)) : null);
      const cuerpo = [h('span', { class: 'barra-nombre' }, f.icono ? icono(f.icono, 'icono-16') : null, h('span', { text: f.nombre })),
        h('span', { class: 'barra-cuenta' }, h('span', { class: 'num', text: Terna.numero(f.valor) }), f.pct ? h('span', { class: 'barra-pct num', text: f.pct }) : null), barra];
      const li = h('li', { class: 'barra-fila' + (f.fuera ? ' fuera' : '') + (f.accion ? ' con-accion' : ''), dataset: { nombre: f.nombre } },
        f.href ? h('a', { class: 'barra-link con-chevron', href: f.href }, cuerpo, icono('i-adelante', 'i-adelante')) : h('div', { class: 'barra-link' }, cuerpo), f.accion || null);
      if (f.marcaDespues) ul.append(li, f.marcaDespues); else ul.append(li);
    }
    if (opciones && opciones.etiqueta) ul.setAttribute('aria-label', opciones.etiqueta);
    return ul;
  }
  // Desde B2 cada panel es un plegable entre reglas finas (PLAN-WEB.md §3.1), abierto en los dos tamaños: "Seguir" queda a la vista.
  function panel(titulo, id, contenido, pie) {
    return h('details', { class: 'tablero-panel plegable plegable-pozo', open: true, 'aria-labelledby': id },
      h('summary', null, h('span', { class: 'plegable-titulo' }, h('h3', { id, class: 'tablero-panel-titulo', text: titulo })), icono('i-chevron')),
      h('div', { class: 'plegable-cuerpo' }, contenido, pie || null));
  }

  // Tu lista hoy (diseno.md 0.26 §6): sin período, porque cada fila lleva a Avisos y Avisos no filtra por fecha de llegada.
  function seccionLista(L, avisos, enLista, seguidas, alSeguir) {
    const LI = I.lista;
    const sec = h('section', { class: 'tablero-seccion tu-lista', 'aria-labelledby': 'h-tu-lista' },
      h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-tu-lista', text: LI.titulo })),
      h('p', { class: 'suave tablero-intro', text: LI.intro }));
    const paneles = h('div', { class: 'tablero-paneles' });
    // Por match: también lo que no llega al umbral, desde el piso (como la guía del umbral de Preferencias).
    const conMatch = avisos.filter((a) => a.match !== null && a.match !== undefined && a.match >= piso && a.interes !== 'no_me_interesa' && Aviso.pasaBusqueda(a, L.busqueda));
    if (!enLista.length && !conMatch.length) {
      sec.append(h('p', { class: 'nada-pendiente', text: LI.vacia }));
      return sec;
    }
    const G = T.preferencias.guiaUmbral;
    const u = L.umbral;
    const franjas = [90, 80, 70, 60, 50].map((d, i, todas) => ({ desde: i === 4 ? Math.min(d, piso) : d, hasta: i === 0 ? 100 : todas[i - 1] - 1, nombre: G.franjas[d].nombre }));
    const filasF = franjas.map((f) => {
      const de = conMatch.filter((a) => a.match >= f.desde && a.match <= f.hasta);
      const llegan = de.filter((a) => a.match >= u).length;
      return { nombre: f.nombre, valor: de.length, partes: [llegan, de.length - llegan], fuera: f.hasta < u, f };
    });
    // La marca del umbral va debajo de la franja donde cae (o de la última que llega entera).
    const iMarca = filasF.findIndex((x) => x.f.desde <= u);
    if (iMarca >= 0) filasF[iMarca].marcaDespues = h('li', { class: 'franjas-umbral' }, h('span', { class: 'umbral-pastilla num', text: G.marca(u) }));
    paneles.append(panel(LI.franjas, 'h-franjas', barras(filasF, { etiqueta: LI.franjas }),
      h('p', { class: 'tablero-nota' }, h('span', { class: 'suave', text: LI.franjasNota(piso) + ' ' }), h('a', { href: 'preferencias.html#busqueda', text: LI.cambiarUmbral }))));

    // Dónde se postula: cada fila lleva a Avisos con ese filtro.
    if (enLista.length) {
      const porDonde = new Map();
      for (const a of enLista) { const c = Aviso.donde(a, prefs).clave; porDonde.set(c, (porDonde.get(c) || 0) + 1); }
      const deTotal = (x) => LI.porcentaje(Math.round((x / enLista.length) * 100));
      const filasD = Aviso.DONDES.filter((c) => porDonde.get(c)).map((c) => ({ nombre: T.avisos.dondeFiltro[c], valor: porDonde.get(c), pct: deTotal(porDonde.get(c)), href: 'avisos.html?donde=' + c }));
      paneles.append(panel(LI.donde, 'h-donde', barras(filasD, { etiqueta: LI.donde })));

      // Empresas con más avisos: las cinco primeras, con "Seguir" en un toque si todavía no la seguís (y hay lugar).
      const grupos = new Map();
      for (const a of enLista) {
        const clave = Empresas.palabras(a.empresa).join(' ');
        if (!clave) continue;
        const g = grupos.get(clave) || { n: 0, nombres: new Map() };
        g.n += 1;
        g.nombres.set(a.empresa, (g.nombres.get(a.empresa) || 0) + 1);
        grupos.set(clave, g);
      }
      // Cada fila cuenta lo mismo que muestra Avisos al tocarla (el filtro Empresa exacto, con la regla del motor). Dos grupos que
      // la regla junta ("Banco Santander" y "Santander") son una sola fila: la del grupo más grande.
      const usados = new Set();
      const top = [];
      for (const g of Array.from(grupos.values()).sort((x, y) => y.n - x.n)) {
        const nombre = Array.from(g.nombres.entries()).sort((x, y) => y[1] - x[1])[0][0];
        const ids = enLista.filter((a) => L.esLaEmpresa(a, nombre)).map((a) => a.match_id);
        if (!ids.length || ids.some((id) => usados.has(id))) continue;
        ids.forEach((id) => usados.add(id));
        const mejor = enLista.filter((a) => L.esLaEmpresa(a, nombre)).reduce((m, a) => Math.max(m, num(a.match)), 0);
        top.push({ nombre, n: ids.length, mejor });
      }
      // A igual cantidad, la de mejor match: el orden dice algo aunque empaten (revisión de UX).
      top.sort((x, y) => (y.n - x.n) || (y.mejor - x.mejor) || x.nombre.localeCompare(y.nombre, 'es')).splice(5);
      if (top.length) {
        const max = (ctx.config && ctx.config.max_empresas_seguidas) || 10;
        const filasE = top.map((g) => {
          const yaLaSigue = seguidas.filas.some((f) => Empresas.misma(g.nombre, f.nombre) || Empresas.misma(f.nombre, g.nombre));
          let accion = null;
          if (seguidas.hay && yaLaSigue) accion = h('span', { class: 'chip-texto la-seguis' }, icono('i-tilde', 'icono-14'), h('span', { text: LI.laSeguis }));
          else if (seguidas.hay && seguidas.filas.length < max) {
            accion = h('button', { type: 'button', class: 'btn btn-fila', 'aria-label': LI.seguirAccesible(g.nombre), onclick: (ev) => alSeguir(g.nombre, ev.currentTarget) },
              icono('i-agregar', 'icono-16'), LI.seguir);
          }
          return { nombre: g.nombre, valor: g.n, pct: deTotal(g.n), href: 'avisos.html?empresa=' + encodeURIComponent(g.nombre), accion };
        });
        paneles.append(panel(LI.empresasTop, 'h-empresas-top', barras(filasE, { etiqueta: LI.empresasTop })));
      }
    }
    sec.append(paneles);
    return sec;
  }

  // Semana a semana: ocho llamadas a mi_resumen, una desde el comienzo de cada semana (de siete días, hasta hoy); cada semana es la
  // resta de dos seguidas. Mosaicos con la cifra de esta semana y ocho columnas (la última, esta semana, en tinta) y su tabla.
  async function seccionSemanas() {
    const S = I.semanas;
    const C = I.cifras;
    // Desde B2, un plegable al pie de "Cómo viene" (PLAN-WEB.md §3.1): abierto desde 768 px, cerrado en el celular.
    const sec = h('details', { class: 'plegable semanas', open: Terna.anchoEscritorio.matches, 'aria-labelledby': 'h-semanas' });
    const hoy = Terna.hoy();
    const desdes = Array.from({ length: 8 }, (_, k) => Terna.sumarDias(hoy, -6 - 7 * k));
    const rs = await Promise.all(desdes.map((d) => sb.rpc('mi_resumen', { p_desde: d })));
    if (rs.some((r) => r.error)) return null;
    const acum = rs.map((r) => (Array.isArray(r.data) ? r.data[0] : r.data) || {});
    const SERIES = [['sobre_umbral', C.nuevos], ['paquetes_armados', C.armados], ['enviadas', C.enviadas], ['postulados_a_mano', C.aMano]];
    // De la más vieja (índice 0) a esta semana (7).
    const semanas = desdes.map((d, k) => ({ desde: d, hasta: k === 0 ? hoy : Terna.sumarDias(d, 6) })).reverse();
    const rango = (s) => S.rango(Terna.fechaCorta(s.desde), Terna.fechaCorta(s.hasta));
    const valores = SERIES.map(([campo]) => desdes.map((_, k) => Math.max(0, num(acum[k][campo]) - (k ? num(acum[k - 1][campo]) : 0))).reverse());

    const mosaicos = h('ul', { class: 'semanas-mosaicos', role: 'list' });
    SERIES.forEach(([campo, nombre], i) => {
      const v = valores[i];
      const max = Math.max(5, ...v);  // un piso: con 1 la columna no se llena como con 11 (revisión de UX)
      const dato = h('span', { class: 'semana-dato', 'aria-hidden': 'true', hidden: true });
      const columnas = h('span', { class: 'semana-columnas', 'aria-hidden': 'true' });
      v.forEach((x, j) => {
        const col = h('span', { class: 'semana-col' + (j === 7 ? ' actual' : ''), dataset: { i: String(j) } }, x ? conCuenta(h('span', { class: 'semana-barra' }), pct(x, max)) : null);
        const mostrar = () => {
          dato.textContent = S.valor(j === 7 ? S.estaSemana : rango(semanas[j]), x);
          dato.hidden = false;
          dato.style.setProperty('--x', String(Math.round(((j + 0.5) / 8) * 1000) / 10));
        };
        col.addEventListener('pointerenter', mostrar);
        col.addEventListener('pointerdown', mostrar);
        col.addEventListener('pointerleave', () => { dato.hidden = true; });
        columnas.append(col);
      });
      mosaicos.append(h('li', { class: 'semana-mosaico', dataset: { serie: campo } },
        h('span', { class: 'semana-nombre', text: nombre }),
        h('span', { class: 'semana-valor' }, h('span', { class: 'semana-numero', text: Terna.numero(v[7]) }), h('span', { class: 'semana-cuando', text: S.anterior(v[6]) })),
        h('span', { class: 'semana-grafico' }, columnas, dato)));
    });
    // La tabla: lo mismo, con cada número escrito (la versión para teclado y lector de pantalla), de esta semana para atrás.
    const tabla = h('div', { class: 'tabla-caja semanas-tabla', hidden: true, tabindex: '0', role: 'region', 'aria-label': S.tabla },
      h('table', { class: 'tabla' },
        h('caption', { class: 'oculto-visual', text: S.titulo }),
        h('thead', null, h('tr', null, h('th', { scope: 'col', text: S.semana }), SERIES.map(([, nombre]) => h('th', { scope: 'col', class: 'der', text: nombre })))),
        h('tbody', null, semanas.map((s, j) => j).reverse().map((j) => h('tr', null,
          h('th', { scope: 'row', text: j === 7 ? S.estaSemana : rango(semanas[j]) }),
          valores.map((v) => h('td', { class: 'der num', text: Terna.numero(v[j]) })))))));
    // El botón dice lo que hace ("Ver como tabla" / "Ver como gráfico"), sin aria-pressed: con los dos, el lector decía "Ver como
    // gráfico, presionado".
    const cambiar = h('button', { type: 'button', class: 'btn btn-texto btn-chico', text: S.verTabla, onclick: () => {
      const verTabla = tabla.hidden;
      tabla.hidden = !verTabla;
      mosaicos.hidden = verTabla;
      cambiar.textContent = verTabla ? S.verGrafico : S.verTabla;
    } });
    sec.append(h('summary', null, h('span', { class: 'plegable-titulo' }, h('h3', { id: 'h-semanas', text: S.titulo })), icono('i-chevron')),
      h('div', { class: 'plegable-cuerpo' }, h('div', { class: 'semanas-cuerpo' }, mosaicos, tabla),
        h('div', { class: 'semanas-pie' }, h('p', { class: 'suave tablero-intro', text: S.intro }), cambiar)));
    return sec;
  }

  // Así funciona: un plegable cerrado al final, en los dos tamaños (hasta B2 se escondía en el celular).
  function asiFunciona() {
    return h('details', { class: 'plegable asi-funciona', 'aria-labelledby': 'h-asi' },
      h('summary', null, h('span', { class: 'plegable-titulo' }, h('h2', { id: 'h-asi', text: I.asiFunciona })), icono('i-chevron')),
      h('div', { class: 'plegable-cuerpo' },
        h('p', { text: I.asi1 }),
        h('p', null, I.asi2a, h('a', { href: 'postulaciones.html', text: T.comun.pestanas.postulaciones }), I.asi2b),
        h('p', { class: 'suave', text: I.asi3 })));
  }

  /* ---------- Lo que te toca, en carpetas (PLAN-WEB.md §3.1, «Los tres de hoy») ----------
     B2 abría Inicio con los paquetes de la última corrida. Para saber cuáles son hace falta `armado_en`, y la lectura de Inicio no
     lo trae (ni la ubicación, ni los links del CV y la carta): no se amplía. Lo que sí se puede decir con lo que ya se lee es qué
     te toca a vos ahora, y eso va arriba, con un título que lo dice ("3 te tocan a vos"): las mismas postulaciones que Postulaciones
     pone primero en Por postular (a mano, para revisar o con el paquete armado; con "Tu umbral" marcada), en su orden y hasta tres.
     La primera, con su acción si es a mano; cada carpeta abre su ficha en Postulaciones. */
  const MAX_HOY = 3;
  const URGENCIA = { a_mano: 0, para_revisar: 1, pendiente: 2 };
  const matchDe = (a) => (a.match === null || a.match === undefined ? -1 : Number(a.match));
  function teTocan(lista) {
    const sugerida = (a) => !rPref.data || Aviso.sugerida(a, criterioAMano);
    const toca = (a) => a.estado_postulacion === 'para_revisar'
      || ((a.estado_postulacion === 'a_mano' || (a.estado_postulacion === 'pendiente' && a.estado_paquete === 'armado')) && sugerida(a));
    return lista.filter((a) => a.interes !== 'no_me_interesa' && toca(a))
      .sort((x, y) => (matchDe(y) - matchDe(x)) || (URGENCIA[x.estado_postulacion] - URGENCIA[y.estado_postulacion])
        || String(y.creado_en || '').localeCompare(String(x.creado_en || '')));
  }
  // Los atributos de la carpeta, con la pieza de Aviso.atributos: la lectura no trae la ubicación, así que el lugar va solo si es del
  // exterior (en vez de un "local" genérico donde Postulaciones dice la ciudad).
  function atributosHoy(a) {
    const partes = [];
    if (a.alcance === 'exterior') partes.push(['i-exterior', T.avisos.alcanceMin.exterior]);
    if (a.modalidad) partes.push(['i-' + a.modalidad, T.avisos.modalidadMin[a.modalidad]]);
    if (!partes.length) return null;
    const nodo = h('span', { class: 'atributos' });
    partes.forEach(([ic, tx], i) => {
      if (i) nodo.append(h('span', { 'aria-hidden': 'true', text: '·' }), oculto(', '));
      nodo.append(h('span', { class: 'atributo' }, icono(ic, 'icono-16'), h('span', { text: tx })));
    });
    return nodo;
  }
  // Una carpeta: la lengüeta y el puesto llevan a la ficha en Postulaciones (donde están el CV, la carta y "Marcar postulado"). La
  // línea dice dónde se postula (a mano) o qué falta (para revisar, o el paquete armado). La primera, si es a mano, abre el aviso:
  // es el primario de la pantalla.
  function carpetaHoy(a, primera) {
    const href = 'postulaciones.html#postulacion-' + a.match_id;
    const L = T.postulaciones.lineaCorta;
    const linea = a.estado_postulacion === 'para_revisar' ? h('p', { class: 'traba', text: L.para_revisar })
      : a.estado_postulacion === 'pendiente' ? h('p', { class: 'traba', text: L.pendiente }) : Aviso.lineaDonde(a, prefs);
    const abrir = primera && a.estado_postulacion !== 'para_revisar';
    return h('li', { class: 'carpeta' + (primera ? '' : ' carpeta-compacta') },
      h('div', { class: 'carpeta-cabeza' }, Aviso.lengueta(a, prefs.umbral, { href }), Aviso.marbete(a)),
      h('div', { class: 'carpeta-cuerpo' },
        h('a', { class: 'puesto', href }, h('span', { class: 'puesto-texto', text: a.puesto }), icono('i-adelante', 'puesto-flecha')),
        a.empresa ? h('span', { class: 'empresa', text: a.empresa }) : null,
        atributosHoy(a),
        linea,
        abrir ? h('div', { class: 'carpeta-acciones' }, Aviso.abrirAviso(a, 'btn btn-primario', prefs)) : null));
  }
  // La sección: mientras llega la lectura, carpetas de relleno con el alto de una real (lo de abajo no salta); sin nada que te
  // toque, no existe.
  const hoyTitulo = h('h2', { id: 'h-hoy' });
  const hoyLista = h('ol', { class: 'carpetas hoy' });
  const secHoy = h('section', { class: 'hoy-seccion', id: 'hoy', 'aria-labelledby': 'h-hoy' },
    h('div', { class: 'tablero-cabecera' }, hoyTitulo,
      h('a', { class: 'btn btn-texto btn-chico', href: 'postulaciones.html#por-postular', text: T.avisos.ficha.verEnPostulaciones })),
    hoyLista);
  // El título, sin cifra (revisión del 20/11, P2-2): con la cifra, "15 te tocan a vos" arriba y 12 + 2 en "Qué hay para hacer", que no
  // cuenta lo que tiene el paquete armado y espera que decidas. La cifra queda en el muelle y en Postulaciones. Mientras
  // T.inicio.tocanTitulo («Te tocan a vos», propuesta) no esté en js/textos.js, va el texto de antes.
  const tituloHoy = (n) => T.inicio.tocanTitulo || T.postulaciones.partes.tocan(n);
  function rellenoHoy(n) {
    hoyTitulo.textContent = tituloHoy(n);
    secHoy.setAttribute('aria-busy', 'true');
    Terna.vaciar(hoyLista).append(...Array.from({ length: Math.min(MAX_HOY, n) }, (_, i) => h('li', { class: 'carpeta carpeta-relleno' + (i ? ' carpeta-compacta' : ''), 'aria-hidden': 'true' },
      h('div', { class: 'carpeta-cabeza' }, h('span', { class: 'lengueta' })), h('div', { class: 'carpeta-cuerpo' }))));
  }
  function dibujarHoy(lista) {
    secHoy.removeAttribute('aria-busy');
    if (!lista.length) { secHoy.remove(); return; }
    hoyTitulo.textContent = tituloHoy(lista.length);
    Terna.vaciar(hoyLista).append(...lista.slice(0, MAX_HOY).map((a, i) => carpetaHoy(a, i === 0)));
  }

  // Lo de arriba primero (una llamada); el tablero llega después sin mover lo que ya está.
  // Con el resumen llega cuánto hay para buscar (0045; busqueda.md 0.2 §4.6): tres números de la base. Si la función no está o
  // falla, Inicio queda como antes, sin el renglón.
  const [rResumen, rBusqueda] = await Promise.all([sb.rpc('mi_resumen', { p_desde: desde() }), sb.rpc('avisos_abiertos_resumen')]);
  parar();
  if (rResumen.error) { Terna.errorDeCarga(cont, rResumen.error); return; }
  Terna.vaciar(cont);
  const r = (Array.isArray(rResumen.data) ? rResumen.data[0] : rResumen.data) || {};
  lineaCorrida(r);
  dibujarCifras(r);
  dibujarQueHay(r);
  cont.append(corrida);
  const hayPara = !rBusqueda.error && rBusqueda.data && num(rBusqueda.data.avisos) > 0 ? rBusqueda.data : null;
  if (hayPara) {
    cont.append(h('p', { class: 'inicio-busqueda' }, icono('i-buscar', 'icono-16'),
      h('span', { text: T.busqueda.enInicio(num(hayPara.avisos), num(hayPara.semana)) }),
      h('a', { href: 'busqueda.html', text: T.busqueda.enInicioLink })));
  }
  // Lo que te toca, con lo que ya se sabe (los números de "Qué hay para hacer"): la cuenta del muelle y del carril y, si hay algo,
  // el lugar de las carpetas. Cuando llega la lectura de mis_avisos se dibujan y la cuenta pasa a la de las carpetas, que es la
  // misma que da Postulaciones (suma lo que tiene el paquete armado y espera que decidas).
  const tocanAntes = (aManoSugeridas === null ? num(r.a_mano_pendientes) : aManoSugeridas) + num(r.para_revisar);
  Terna.cuentaToca(tocanAntes);
  // Con el perfil incompleto, "Qué hay para hacer" (que entonces solo dice eso, con Completar perfil) va primero, antes que las
  // carpetas: Terna no busca hasta que lo completes, y en las otras páginas es la banda de arriba (revisión final del 20/11).
  if (ctx.faltantes.length) cont.append(queHay);
  if (tocanAntes) { rellenoHoy(tocanAntes); cont.append(secHoy); }
  const tarjetaCuentas = preguntaCuentas();
  if (tarjetaCuentas) cont.append(tarjetaCuentas);
  cont.append(tablero);

  const seguidas = Lista.seguidasDe(rPref.data);
  const [rA, secSemanas] = await Promise.all([leerAvisos(), seccionSemanas()]);
  if (rA.error) { secHoy.remove(); tablero.append(h('p', { class: 'suave tablero-error', text: Terna.textoError(rA.error) })); return; }
  const avisos = rA.data || [];
  const tocan = teTocan(avisos);
  Terna.cuentaToca(tocan.length);
  if (tocan.length && !secHoy.isConnected) (tarjetaCuentas && tarjetaCuentas.isConnected ? tarjetaCuentas : tablero).before(secHoy);
  dibujarHoy(tocan);
  const lugares = {};
  function dibujarTablero() {
    const L = Lista.crear(avisos, { prefs, piso, seguidas: seguidas.filas });
    const enLista = avisos.filter(L.enLista);
    const nuevos = {
      seguidas: seguidas.hay ? tarjetaEmpresas(L, enLista, seguidas) : null,
      buscados: tarjetaPuestos(L, enLista),
      lista: seccionLista(L, avisos, enLista, seguidas, seguir),
    };
    for (const k of Object.keys(nuevos)) {
      if (lugares[k]) lugares[k].replaceWith(nuevos[k] || h('div', { hidden: true }));
      else tablero.append(nuevos[k] || h('div', { hidden: true }));
      lugares[k] = nuevos[k] || null;
    }
  }
  dibujarTablero();
  if (secSemanas) comoViene.append(secSemanas);
  tablero.append(asiFunciona());

  // Seguir una empresa desde "Empresas con más avisos": una fila nueva al final de tu lista, con Deshacer.
  // La lista vive en preferencias (0034): se escribe entera, con el nombre al final; Deshacer la vuelve a dejar como estaba.
  async function guardarSeguidas(nombres) {
    const r = await sb.from('preferencias').update({ empresas_seguidas: nombres }).eq('usuario_id', ctx.usuario.id).select('empresas_seguidas').single();
    if (r.error) return r.error;
    prefs.empresas_seguidas = r.data.empresas_seguidas || [];
    const nueva = Lista.seguidasDe(prefs);
    seguidas.nombres = nueva.nombres;
    seguidas.filas = nueva.filas;
    dibujarTablero();
    return null;
  }
  async function seguir(nombre, boton) {
    if (boton.getAttribute('aria-disabled') === 'true') return;
    boton.setAttribute('aria-disabled', 'true');
    const antes = seguidas.nombres.slice();
    const error = await guardarSeguidas([...antes, nombre]);
    if (error) { boton.removeAttribute('aria-disabled'); Terna.avisoBreve(Terna.textoError(error), { error: true }); return; }
    // El botón ya no está: el foco se queda en la misma fila, en su link (revisión de UX: ir al título dejaba al lector 1.500 px arriba).
    const fila = Array.from(document.querySelectorAll('.tu-lista .barra-fila')).find((li) => li.dataset.nombre === nombre);
    const foco = fila && fila.querySelector('a.barra-link');
    if (foco) foco.focus();
    Terna.avisoBreve(I.lista.siguiendo(nombre), { deshacer: async () => {
      const e2 = await guardarSeguidas(antes);
      if (e2) { Terna.avisoBreve(Terna.textoError(e2), { error: true }); return; }
      Terna.avisoBreve(I.lista.dejaste(nombre));
    } });
  }
});
