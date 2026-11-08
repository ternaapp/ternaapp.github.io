/* Terna · js/inicio.js
   Inicio (diseno.md 0.26 §6): la última corrida, cómo viene el período, qué hay para hacer y, debajo, el tablero: las empresas
   que seguís y los puestos que buscás, tu lista hoy y semana a semana. Pedido de Francisco del 07/11/2026 ("más dashboard").
   Todo se cuenta en el navegador con lo que la página puede leer (cero tokens): mi_resumen(p_desde) para lo de arriba y, una
   vez por semana de las últimas ocho, para "Semana a semana" (así esta semana da lo mismo que "Cómo viene"); mis_avisos con las
   columnas que usa Avisos, contadas con las reglas de `js/lista.js` (lo que dice Inicio es lo que muestra Avisos al tocarlo);
   y preferencias, que desde 0034 traen las empresas que seguís (sin la columna, el tablero va sin "Empresas que seguís" ni "Seguir"). */
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
    if (periodo === 'mes') return hoy.slice(0, 8) + '01';
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
  const cifras = h('div', { class: 'tarjeta como-viene-tarjeta' });
  const comoViene = h('section', { class: 'tablero-seccion como-viene', 'aria-labelledby': 'h-como-viene' },
    h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-como-viene', text: I.comoViene }), seg), cifras);
  const queHay = h('section', { class: 'tablero-seccion que-hay', 'aria-labelledby': 'h-que-hay' });
  const tablero = h('div', { class: 'tablero' }, comoViene, queHay);

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

  // Cómo viene (diseno.md 0.26 §10.14): las cinco cifras como trazos que se angostan, como los tres de la marca. Una sola escala;
  // la primera lleva en gris lo que llegó y no pasó tu umbral ("17 en total"). Las barras son decorativas: el número va escrito.
  function dibujarCifras(r) {
    const C = I.cifras;
    const total = num(r.avisos_nuevos);
    const sobre = num(r.sobre_umbral);
    const filas = [
      { clave: 'nuevos', valor: sobre, resto: Math.max(0, total - sobre), etiqueta: C.nuevos, nota: C.total(total) },
      { clave: 'armados', valor: num(r.paquetes_armados), etiqueta: C.armados },
      { clave: 'enviadas', valor: num(r.enviadas), etiqueta: C.enviadas },
      { clave: 'a-mano', valor: num(r.postulados_a_mano), etiqueta: C.aMano },
      { clave: 'entrevistas', valor: num(r.entrevistas), etiqueta: C.entrevistas },
    ];
    const max = Math.max(1, ...filas.map((f) => f.valor + (f.resto || 0)));
    const dl = h('dl', { class: 'cifras etapas' });
    for (const f of filas) {
      const barra = h('dd', { class: 'etapa-barra', 'aria-hidden': 'true' },
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

  function filaPendiente(href, iconoId, texto) {
    if (!href) return h('div', { class: 'fila fila-info' }, icono(iconoId), h('span', { text: texto }));
    return h('a', { class: 'fila', href }, icono(iconoId), h('span', { text: texto }), icono('i-adelante', 'i-adelante'));
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
      if (num(r.sin_texto)) filas.push(filaPendiente('avisos.html?paquete=sin_texto', 'i-sin-texto', I.sinTexto(num(r.sin_texto))));
      if (num(r.en_cola)) filas.push(filaPendiente(null, 'i-pedido', I.enCola(num(r.en_cola))));
      if (filas.length) queHay.append(h('div', { class: 'tarjeta tarjeta-plana' }, filas));
      else queHay.append(h('p', { class: 'tarjeta nada-pendiente', text: I.nadaPendiente }));
    }
    queHay.append(h('p', { class: 'suave umbral-linea' }, I.umbralActual(r.umbral_actual), ' ', h('a', { href: 'preferencias.html', text: T.comun.pestanas.preferencias })));
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

  function cabeceraTarjeta(id, titulo, editar) {
    return h('div', { class: 'tablero-cabecera' }, h('h2', { id, class: 'tarjeta-titulo', text: titulo }),
      editar ? h('a', { class: 'btn btn-texto btn-chico', href: editar.href, 'aria-label': editar.accesible, text: editar.texto }) : null);
  }
  function vacio(texto, ayuda, boton) {
    return h('div', { class: 'tablero-vacio' }, h('p', { text: texto }), h('p', { class: 'suave', text: ayuda }),
      h('a', { class: 'btn', href: boton.href }, icono('i-agregar'), boton.texto));
  }
  // Un aviso en una línea: el match en Bitter, el puesto y la empresa; abre su ficha en Avisos.
  function avisoMini(a) {
    return h('li', null, h('a', { class: 'aviso-mini', href: 'avisos.html#aviso-' + a.match_id },
      h('span', { class: 'aviso-mini-match', 'aria-hidden': 'true', text: a.match === null || a.match === undefined ? '—' : String(a.match) }),
      h('span', { class: 'aviso-mini-texto' }, h('span', { class: 'aviso-mini-puesto', text: a.puesto }), h('span', { class: 'aviso-mini-empresa', text: a.empresa || '' })),
      a.match === null || a.match === undefined ? null : oculto(', ' + T.avisos.matchAccesible(a.match)),
      icono('i-adelante', 'i-adelante')));
  }
  // Una fila de la lista de lo tuyo: el nombre, la cuenta, una línea más y, si hay avisos, el link a Avisos filtrado.
  function filaTuya(clase, nombre, cuenta, linea, href, derecha) {
    const texto = h('span', { class: 'tuya-texto' }, h('span', { class: 'tuya-nombre', text: nombre }), h('span', { class: 'tuya-cuenta', text: cuenta }),
      linea ? h('span', { class: 'tuya-linea', text: linea }) : null);
    return h('li', { class: clase }, href
      ? h('a', { class: 'tuya', href }, texto, derecha, icono('i-adelante', 'i-adelante'))
      : h('div', { class: 'tuya' }, texto, derecha));
  }

  // Empresas que seguís (brand.md 0.13 §6.3): primero lo nuevo de la última corrida ("se abrieron dos avisos en tu empresa; son estos
  // dos"), después cada empresa con lo que tiene en tu lista y qué hace Terna con ella.
  function tarjetaEmpresas(L, enLista, seguidas) {
    const E = I.empresas;
    const sec = h('section', { class: 'tarjeta tablero-tarjeta seguidas', 'aria-labelledby': 'h-empresas' },
      cabeceraTarjeta('h-empresas', E.titulo, seguidas.filas.length ? { href: 'preferencias.html#empresas', texto: E.editar, accesible: E.editarAccesible } : null));
    if (!seguidas.filas.length) {
      sec.append(vacio(E.vacio, E.vacioAyuda, { href: 'preferencias.html#empresas', texto: E.seguir }));
      return sec;
    }
    const deAlguna = (a) => seguidas.filas.some((f) => L.esLaEmpresa(a, f.nombre));
    // Lo nuevo primero ("se abrieron dos avisos en tu empresa; son estos dos"), después cada empresa con lo que tiene en tu lista.
    const nuevos = enLista.filter((a) => esNuevo(a) && deAlguna(a)).sort(porMatch);
    if (nuevos.length) sec.append(h('p', { class: 'tablero-destacado', text: E.nuevos(nuevos.length) }), h('ul', { class: 'avisos-mini', role: 'list' }, nuevos.slice(0, 3).map(avisoMini)));
    const ul = h('ul', { class: 'tuyas', role: 'list' });
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
    const sec = h('section', { class: 'tarjeta tablero-tarjeta buscados', 'aria-labelledby': 'h-puestos' },
      cabeceraTarjeta('h-puestos', P.titulo, puestos.length ? { href: 'preferencias.html#puestos', texto: P.editar, accesible: P.editarAccesible } : null));
    if (!puestos.length) {
      sec.append(vacio(P.vacio, P.vacioAyuda, { href: 'preferencias.html#puestos', texto: P.escribir }));
      return sec;
    }
    const ul = h('ul', { class: 'tuyas', role: 'list' });
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
      const li = h('li', { class: 'barra-fila' + (f.fuera ? ' fuera' : '') + (f.accion ? ' con-accion' : '') },
        f.href ? h('a', { class: 'barra-link', href: f.href }, cuerpo) : h('div', { class: 'barra-link' }, cuerpo), f.accion || null);
      if (f.marcaDespues) ul.append(li, f.marcaDespues); else ul.append(li);
    }
    if (opciones && opciones.etiqueta) ul.setAttribute('aria-label', opciones.etiqueta);
    return ul;
  }
  function panel(titulo, id, contenido, pie) {
    return h('section', { class: 'tablero-panel', 'aria-labelledby': id }, h('h3', { id, class: 'tablero-panel-titulo', text: titulo }), contenido, pie || null);
  }

  // Tu lista hoy (diseno.md 0.26 §6): sin período, porque cada fila lleva a Avisos y Avisos no filtra por fecha de llegada.
  function seccionLista(L, avisos, enLista, seguidas, alSeguir) {
    const LI = I.lista;
    const sec = h('section', { class: 'tablero-seccion tu-lista', 'aria-labelledby': 'h-tu-lista' },
      h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-tu-lista', text: LI.titulo })),
      h('p', { class: 'suave tablero-intro', text: LI.intro }));
    const paneles = h('div', { class: 'tarjeta tablero-paneles' });
    // Por match: también lo que no llega al umbral, desde el piso (como la guía del umbral de Preferencias).
    const conMatch = avisos.filter((a) => a.match !== null && a.match !== undefined && a.match >= piso && a.interes !== 'no_me_interesa' && Aviso.pasaBusqueda(a, L.busqueda));
    if (!enLista.length && !conMatch.length) {
      sec.append(h('p', { class: 'tarjeta nada-pendiente', text: LI.vacia }));
      return sec;
    }
    const G = T.preferencias.guiaUmbral;
    const u = L.umbral;
    const franjas = [90, 80, 70, 60, 50].map((d, i, todas) => ({ desde: i === 4 ? Math.min(d, piso) : d, hasta: i === 0 ? 100 : todas[i - 1] - 1, nombre: G.franjas[d].nombre }));
    const filasF = franjas.map((f) => {
      const de = conMatch.filter((a) => a.match >= f.desde && a.match <= f.hasta);
      const llegan = de.filter((a) => a.match >= u).length;
      return { nombre: f.nombre, valor: de.length, partes: [llegan, de.length - llegan], fuera: llegan === 0, f };
    });
    // La marca del umbral va debajo de la franja donde cae (o de la última que llega entera).
    const iMarca = filasF.findIndex((x) => x.f.desde <= u);
    if (iMarca >= 0) filasF[iMarca].marcaDespues = h('li', { class: 'franjas-umbral', 'aria-hidden': 'true' }, h('span', { class: 'umbral-pastilla num', text: G.marca(u) }));
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
        top.push({ nombre, n: ids.length });
      }
      top.sort((x, y) => y.n - x.n).splice(5);
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
    const sec = h('section', { class: 'tablero-seccion semanas', 'aria-labelledby': 'h-semanas' });
    const hoy = Terna.hoy();
    const desdes = Array.from({ length: 8 }, (_, k) => Terna.sumarDias(hoy, -6 - 7 * k));
    const rs = await Promise.all(desdes.map((d) => sb.rpc('mi_resumen', { p_desde: d })));
    if (rs.some((r) => r.error)) return null;
    const acum = rs.map((r) => (Array.isArray(r.data) ? r.data[0] : r.data) || {});
    const SERIES = [['sobre_umbral', C.nuevos], ['paquetes_armados', C.armados], ['enviadas', C.enviadas], ['postulados_a_mano', C.aMano], ['entrevistas', C.entrevistas]];
    // De la más vieja (índice 0) a esta semana (7).
    const semanas = desdes.map((d, k) => ({ desde: d, hasta: k === 0 ? hoy : Terna.sumarDias(d, 6) })).reverse();
    const rango = (s) => S.rango(Terna.fechaCorta(s.desde), Terna.fechaCorta(s.hasta));
    const valores = SERIES.map(([campo]) => desdes.map((_, k) => Math.max(0, num(acum[k][campo]) - (k ? num(acum[k - 1][campo]) : 0))).reverse());

    const mosaicos = h('ul', { class: 'semanas-mosaicos', role: 'list' });
    SERIES.forEach(([campo, nombre], i) => {
      const v = valores[i];
      const max = Math.max(1, ...v);
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
        h('span', { class: 'semana-valor' }, h('span', { class: 'semana-numero', text: Terna.numero(v[7]) }), h('span', { class: 'semana-cuando', text: S.estaSemana })),
        h('span', { class: 'semana-grafico' }, columnas, dato)));
    });
    // La tabla: lo mismo, con cada número escrito (la versión para teclado y lector de pantalla), de esta semana para atrás.
    const tabla = h('div', { class: 'tabla-caja semanas-tabla', hidden: true },
      h('table', { class: 'tabla' },
        h('caption', { class: 'oculto-visual', text: S.titulo }),
        h('thead', null, h('tr', null, h('th', { scope: 'col', text: S.semana }), SERIES.map(([, nombre]) => h('th', { scope: 'col', class: 'der', text: nombre })))),
        h('tbody', null, semanas.map((s, j) => j).reverse().map((j) => h('tr', null,
          h('th', { scope: 'row', text: j === 7 ? S.estaSemana : rango(semanas[j]) }),
          valores.map((v) => h('td', { class: 'der num', text: Terna.numero(v[j]) })))))));
    const cambiar = h('button', { type: 'button', class: 'btn btn-texto btn-chico', 'aria-pressed': 'false', text: S.verTabla, onclick: () => {
      const verTabla = tabla.hidden;
      tabla.hidden = !verTabla;
      mosaicos.hidden = verTabla;
      cambiar.setAttribute('aria-pressed', verTabla ? 'true' : 'false');
      cambiar.textContent = verTabla ? S.verGrafico : S.verTabla;
    } });
    sec.append(h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-semanas', text: S.titulo }), cambiar),
      h('p', { class: 'suave tablero-intro', text: S.intro }), h('div', { class: 'tarjeta semanas-tarjeta' }, mosaicos, tabla));
    return sec;
  }

  function asiFunciona() {
    return h('section', { class: 'tarjeta asi-funciona', 'aria-labelledby': 'h-asi' },
      h('h2', { id: 'h-asi', class: 'tarjeta-titulo', text: I.asiFunciona }),
      h('p', { text: I.asi1 }),
      h('p', null, I.asi2a, h('a', { href: 'postulaciones.html', text: T.comun.pestanas.postulaciones }), I.asi2b),
      h('p', { class: 'suave', text: I.asi3 }));
  }

  // Lo de arriba primero (una llamada); el tablero llega después sin mover lo que ya está.
  const [rResumen] = await Promise.all([sb.rpc('mi_resumen', { p_desde: desde() })]);
  parar();
  if (rResumen.error) { Terna.errorDeCarga(cont, rResumen.error); return; }
  Terna.vaciar(cont);
  const r = (Array.isArray(rResumen.data) ? rResumen.data[0] : rResumen.data) || {};
  lineaCorrida(r);
  dibujarCifras(r);
  dibujarQueHay(r);
  cont.append(corrida, tablero);

  const seguidas = Lista.seguidasDe(rPref.data);
  const [rA, secSemanas] = await Promise.all([leerAvisos(), seccionSemanas()]);
  if (rA.error) { tablero.append(h('p', { class: 'suave tablero-error', text: Terna.textoError(rA.error) })); return; }
  const avisos = rA.data || [];
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
  if (secSemanas) tablero.append(secSemanas);
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
    // El botón ya no está: el foco va al título de "Empresas que seguís", donde aparece la empresa nueva.
    const foco = document.getElementById('h-empresas');
    if (foco) { foco.setAttribute('tabindex', '-1'); foco.focus(); }
    Terna.avisoBreve(I.lista.siguiendo(nombre), { deshacer: async () => {
      const e2 = await guardarSeguidas(antes);
      if (e2) { Terna.avisoBreve(Terna.textoError(e2), { error: true }); return; }
      Terna.avisoBreve(I.lista.dejaste(nombre));
    } });
  }
});
