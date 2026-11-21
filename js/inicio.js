/* Terna · js/inicio.js
   Inicio (PLAN-UX §3.1, 21/11/2026): qué te toca hoy y qué hizo Terna. De arriba hacia abajo:
   - la corrida, solo como excepción (nunca corrió, la última es de antes de ayer o terminó mal);
   - «Te toca a vos», una sola sección: las filas que llevan a cada pestaña y, debajo, hasta tres carpetas. Con el perfil
     incompleto, completarlo va primero;
   - «Lo último de Terna»: lo que armó y envió la última corrida (reemplaza el «Terna postuló por vos en N…» de Postulaciones,
     decisión D7) y lo que quedó en cola;
   - la entrada a Empleos; la pregunta de las cuentas (js/cuentas.js);
   - «Cómo viene», con «Semana a semana» y «Por match» plegados, y lo que priorizás: las empresas que seguís y los puestos.
   Para quien Terna todavía no corrió, en lugar de todo eso, «Para empezar». «Así funciona» pasó a como-funciona.html; «Tu lista
   hoy», «Dónde se postula», «Empresas con más avisos» (y su «Seguir», que pasó a Empleos) y el umbral salieron.
   Lecturas: preferencias, mi_resumen(p_desde) y avisos_abiertos_resumen, como antes; mis_avisos con las columnas de antes más
   armado_en y enviada_en (PLAN-UX §6.0 y §10), contadas con las reglas de js/lista.js (lo que dice Inicio es lo que muestra Paquetes
   al tocarlo); y «Semana a semana», ocho mi_resumen, recién cuando se abre. Todo se cuenta en el navegador: cero tokens. */
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
  const hoy = Terna.hoy();

  function desde() {
    if (periodo === 'semana') return Terna.sumarDias(hoy, -6);
    if (periodo === 'mes') return Terna.sumarDias(hoy, -29);
    return null;
  }

  // Lo justo para contar (sin notas, razones ni evaluación), de a mil. armado_en y enviada_en, para «Lo último de Terna».
  const COLUMNAS = 'match_id, puesto, empresa, match, interes, estado_paquete, estado_postulacion, pedido_en, creado_en, nuevo, modalidad, alcance, nivel, jornada, '
    + 'postulacion, ats_formulario, url, url_postulacion, fuente, texto_origen, tiene_texto, armado_en, enviada_en';
  async function leerAvisos() {
    const armar = (cols) => () => sb.from('mis_avisos').select(cols).order('match_id');
    const r = await Lista.leerTodo(armar(COLUMNAS + ', linkedin_postulacion'));
    // Sin 0031 no hay linkedin_postulacion: se pide sin ella (Aviso.donde lo resuelve como antes).
    if (r.error && /linkedin_postulacion/.test(String(r.error.message || ''))) return Lista.leerTodo(armar(COLUMNAS));
    return r;
  }

  // Todo junto: la página se dibuja una vez, sin carpetas de relleno ni secciones que se corren al llegar la segunda lectura.
  const parar = Terna.cargando(cont);
  const [rPref, rResumen, rBusqueda, rA] = await Promise.all([
    sb.from('preferencias').select('*').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.rpc('mi_resumen', { p_desde: desde() }),
    // Cuánto hay para buscar (0045; busqueda.md 0.2 §4.6). Si la función no está o falla, Inicio va sin la entrada a Empleos.
    sb.rpc('avisos_abiertos_resumen'),
    leerAvisos(),
  ]);
  parar();
  if (rResumen.error) { Terna.errorDeCarga(cont, rResumen.error); return; }
  Terna.vaciar(cont);
  const r = (Array.isArray(rResumen.data) ? rResumen.data[0] : rResumen.data) || {};
  const prefs = rPref.data || { umbral: 70, paquetes_por_dia: 3 };
  const paquetesDia = prefs.paquetes_por_dia || 3;
  const piso = (ctx.config && ctx.config.piso_match) || 50;
  const criterio = Aviso.criterio(rPref.data, piso);
  const avisos = rA.error ? null : (rA.data || []);
  const hayPara = !rBusqueda.error && rBusqueda.data && num(rBusqueda.data.avisos) > 0 ? rBusqueda.data : null;
  const fechaCorrida = r.ultima_corrida_fecha || null;

  /* ---------- La corrida, solo como excepción (PLAN-UX §2.4 y §3.1) ----------
     Que Terna corrió hoy o ayer es lo normal: decirlo todos los días no informa. Se dice si nunca corrió, si la última corrida es
     de antes de ayer o si terminó mal (tope general, no llegó a vos, error): explica por qué no hay nada nuevo. Los otros
     resultados (ningún aviso llegó a tu umbral, Armar paquetes en No…) van en «Lo último de Terna», si no se armó nada. */
  const FALLAS = ['tope_global', 'no_alcanzado', 'error'];
  const textoResultado = (res) => {
    const t = I.resultado[res];
    return typeof t === 'function' ? (res === 'sin_umbral' ? t(r.umbral_actual) : t(paquetesDia)) : t;
  };
  function lineaCorrida() {
    const lineas = [];
    if (!fechaCorrida) lineas.push(['i-pedido', I.noCorrio]);
    else {
      if (Terna.diasEntre(fechaCorrida, hoy) >= 2) lineas.push(['i-pedido', I.corrioEl(Terna.fechaCorta(fechaCorrida))]);
      if (FALLAS.includes(r.ultima_corrida_resultado)) lineas.push(['i-alerta', textoResultado(r.ultima_corrida_resultado)]);
    }
    if (!lineas.length) return null;
    return h('div', { class: 'inicio-corrida' }, lineas.map(([ic, texto]) => h('p', { class: ic === 'i-alerta' ? 'corrida-falla' : null },
      icono(ic, 'icono-16'), h('span', { text: texto }))));
  }

  /* ---------- Te toca a vos (PLAN-UX §3.1, punto 3) ----------
     Una sola sección: hasta tres filas con su número (cada una lleva a su pestaña) y, debajo, hasta dos carpetas para revisar. Lo que te toca
     es lo que Postulaciones cuenta en ámbar (para revisar, y a mano o con el paquete armado que Terna te sugiere, con la regla de
     Aviso.sugerida) y lo que Paquetes tiene por decidir. Las filas suman lo mismo que el número del muelle. */
  const URGENCIA = { para_revisar: 0, a_mano: 1, pendiente: 2 };
  const matchDe = (a) => (a.match === null || a.match === undefined ? -1 : Number(a.match));
  function teTocan(lista) {
    const sugerida = (a) => !rPref.data || Aviso.sugerida(a, criterio);
    const toca = (a) => a.estado_postulacion === 'para_revisar'
      || ((a.estado_postulacion === 'a_mano' || (a.estado_postulacion === 'pendiente' && a.estado_paquete === 'armado')) && sugerida(a));
    // Primero las para revisar, que se resuelven con un toque; después, por match.
    return lista.filter((a) => a.interes !== 'no_me_interesa' && toca(a))
      .sort((x, y) => (URGENCIA[x.estado_postulacion] - URGENCIA[y.estado_postulacion]) || (matchDe(y) - matchDe(x))
        || String(y.creado_en || '').localeCompare(String(x.creado_en || '')));
  }
  // "12 para postular a mano": la cifra, grande, y el resto. El texto queda igual (el banco lo compara entero).
  function conCifra(texto) {
    const m = /^(\d[\d.]*)(\s[\s\S]*)$/.exec(texto);
    return m ? [h('b', { class: 'num', text: m[1] }), m[2]] : texto;
  }
  // Lo que te toca lleva el ícono en ámbar (fila-toca); lo que espera a Terna (en cola) va apagado, sin link.
  function filaPendiente(href, iconoId, texto) {
    if (!href) return h('div', { class: 'fila fila-info' }, icono(iconoId, 'icono-l'), h('span', null, conCifra(texto)));
    return h('a', { class: 'fila fila-toca', href }, icono(iconoId, 'icono-l'), h('span', null, conCifra(texto)), icono('i-adelante', 'i-adelante'));
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
  // es el primario de la pantalla, salvo con el perfil incompleto, donde el primario es «Completar perfil».
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
        abrir ? h('div', { class: 'carpeta-acciones' }, Aviso.abrirAviso(a, ctx.faltantes.length ? 'btn' : 'btn btn-primario', prefs)) : null));
  }
  const MAX_CARPETAS = 2;
  // Con el perfil incompleto, completarlo va primero: Terna no busca hasta que lo completes (en las otras páginas es la banda de
  // arriba; en Inicio, esto).
  function incompleto() {
    return h('div', { class: 'inicio-incompleto' }, icono('i-por-decidir', 'icono-l'),
      h('p', { text: T.bandas.incompleto(Terna.listaFaltantes(ctx.faltantes)) }),
      h('a', { class: 'btn btn-primario', href: 'perfil.html' }, T.bandas.completar));
  }
  // `tocan`: lo que te toca, leído de mis_avisos; null si esa lectura falló (las cuentas, entonces, las de mi_resumen).
  function seccionToca(tocan) {
    const sec = h('section', { class: 'que-hay', 'aria-labelledby': 'h-que-hay' }, h('h2', { id: 'h-que-hay', text: I.tocanTitulo }));
    if (ctx.faltantes.length) sec.append(incompleto());
    const revisar = tocan ? tocan.filter((a) => a.estado_postulacion === 'para_revisar').length : num(r.para_revisar);
    const aMano = tocan ? tocan.length - revisar : num(r.a_mano_pendientes);
    const filas = [];
    if (revisar) filas.push(filaPendiente('postulaciones.html#para-revisar', 'i-revisar', I.paraRevisar(revisar)));
    if (aMano) filas.push(filaPendiente('postulaciones.html#a-mano', 'i-a-mano', I.aMano(aMano)));
    // Los avisos sin texto ya no son algo que te toca (brand.md 0.23 §6.3): los busca Terna y, si no puede, Francisco.
    if (porDecidir) filas.push(filaPendiente('avisos.html?interes=por_decidir', 'i-por-decidir', I.porDecidir(porDecidir)));
    if (filas.length) sec.append(h('div', { class: 'filas toca-filas' }, filas));
    else if (!ctx.faltantes.length) sec.append(h('p', { class: 'nada-pendiente', text: I.nadaPendiente }));
    // Debajo de las filas, solo las carpetas para revisar, que se resuelven con un toque; las de a mano quedan detrás de su fila, que
    // ya las cuenta (FEEDBACK-UX P2-8: así «Los paquetes de hoy» entra en la primera pantalla del celular).
    const carpetas = tocan ? tocan.filter((a) => a.estado_postulacion === 'para_revisar').slice(0, MAX_CARPETAS) : [];
    if (carpetas.length) {
      sec.append(h('ol', { class: 'carpetas hoy', id: 'hoy' }, carpetas.map((a, i) => carpetaHoy(a, i === 0))));
    }
    return sec;
  }

  /* ---------- Lo último de Terna (PLAN-UX §3.1, punto 4) ----------
     Lo que hizo Terna en la última corrida: los paquetes que armó y lo que envió ese día, cada uno con su marbete (Enviada por Terna,
     Para revisar, Para postular a mano) y su ficha en Paquetes. Si no armó nada, el porqué en una línea (si no es una falla, que ya
     está arriba). Y lo que quedó en cola para la próxima. */
  const MAX_ULTIMOS = 3;
  const deLaCorrida = (x) => !!x && Terna.aFechaLocal(x) === fechaCorrida;
  function ultimosDeLaCorrida() {
    if (!avisos || !fechaCorrida) return [];
    return avisos.filter((a) => a.interes !== 'no_me_interesa'
      && ((a.estado_paquete === 'armado' && deLaCorrida(a.armado_en)) || (a.estado_postulacion === 'enviada' && deLaCorrida(a.enviada_en))))
      .sort((x, y) => (matchDe(y) - matchDe(x)) || String(y.armado_en || '').localeCompare(String(x.armado_en || '')));
  }
  // El estado, con el ícono y el color del marbete pero en un chip: adentro de un link, sin la explicación oculta de T.chips (el
  // nombre del link sería un párrafo). Sin postulación todavía, «Pendiente», sin color.
  function estadoUltimo(a) {
    const e = Aviso.estadoDe(a);
    if (!e) return h('span', { class: 'chip-texto', text: T.avisos.postulacion.pendiente });
    return h('span', { class: 'chip chip-' + e.tipo }, icono(e.icono, 'icono-14'), h('span', { text: e.texto }));
  }
  function filaUltimo(a) {
    return h('li', null, h('a', { class: 'fila ultimo-fila', href: 'avisos.html#aviso-' + a.match_id },
      h('span', { class: 'fila-texto' }, h('span', { class: 'fila-nombre', text: a.puesto }),
        a.empresa ? h('span', { class: 'fila-linea', text: a.empresa }) : null),
      h('span', { class: 'ultimo-estado' }, estadoUltimo(a)),
      icono('i-adelante', 'i-adelante')));
  }
  function seccionUltimo(ultimos) {
    // «N en cola», salvo que todas ya estén a la vista en las filas, con su chip «En cola»: sería decir lo mismo dos veces.
    const filas = ultimos.slice(0, MAX_ULTIMOS);
    const enColaLista = avisos ? avisos.filter((a) => a.estado_postulacion === 'en_cola' && a.interes !== 'no_me_interesa') : null;
    const enCola = enColaLista ? (enColaLista.every((a) => filas.includes(a)) ? 0 : enColaLista.length) : num(r.en_cola);
    const res = r.ultima_corrida_resultado;
    const porQue = !ultimos.length && res && res !== 'armados' && !FALLAS.includes(res) ? textoResultado(res) : null;
    if (!ultimos.length && !porQue && !enCola) return null;
    const titulo = fechaCorrida === hoy ? I.hoy.titulo : I.hoy.tituloUltima;
    const sec = h('section', { class: 'ultimo', 'aria-labelledby': 'h-ultimo' },
      h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-ultimo', text: titulo }),
        ultimos.length ? h('a', { class: 'btn btn-texto btn-chico', href: 'avisos.html#armados', text: I.hoy.verPaquetes }) : null));
    if (filas.length) sec.append(h('ul', { class: 'filas ultimo-filas', role: 'list' }, filas.map(filaUltimo)));
    if (porQue) sec.append(h('p', { class: 'nada-pendiente', text: porQue }));
    if (enCola) sec.append(filaPendiente(null, 'i-pedido', I.enCola(enCola)));
    return sec;
  }

  /* ---------- La entrada a Empleos (PLAN-UX §3.1, punto 5) ---------- */
  function entradaEmpleos() {
    if (!hayPara) return null;
    return h('div', { class: 'inicio-busqueda' }, icono('i-buscar', 'icono-l'),
      h('p', { text: T.busqueda.enInicio(num(hayPara.avisos), num(hayPara.semana)) }),
      h('a', { class: 'btn', href: 'busqueda.html', text: T.busqueda.enInicioLink }));
  }

  /* La pregunta de las cuentas (diseno.md 0.29 §6, 1b; brand.md 0.16 §6.3; datos.md 0.32, 0036): una tarjeta a todo el ancho, solo
     mientras la pregunta no tiene respuesta y "Terna postula por vos" está en Sí. "Terna postula por vos" viene en Sí, así que casi
     nadie pasa por su interruptor en Preferencias: Inicio es donde todos llegan. Es la pregunta de Preferencias, corta. Al responder
     escribe en el acto, la tarjeta se va y queda una línea hasta la próxima visita. A quién se le muestra y la cuenta del último
     mes, en js/cuentas.js. */
  function preguntaCuentas() {
    const p = rPref.data;
    if (!Cuentas.seOfrecen(ctx.usuario, p) || !Cuentas.sinResponder(p) || p.postular_sola === false) return null;
    const C = I.cuentas;
    const R = T.preferencias.cuentas;
    const numero = h('strong', { id: 'pregunta-cuentas-numero', hidden: true });
    // Un pozo (una regla fina arriba, sin caja) y los dos botones secundarios: el primario de la pantalla es el de Te toca a vos.
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

  /* ---------- Cómo viene (diseno.md 0.26 §10.14; PLAN-UX §3.1, punto 7) ----------
     Las cuatro cifras del período. Solo la primera lleva nota: lo que pasó tu umbral, de lo que llegó. Las otras cuentan lo que
     pasó en el período y no son un embudo (un paquete de hoy puede ser de un aviso de la semana pasada). */
  const cifras = h('div', { class: 'como-viene-cifras' });
  function dibujarCifras(x) {
    const C = I.cifras;
    const total = num(x.avisos_nuevos);
    const filas = [
      { clave: 'nuevos', valor: num(x.sobre_umbral), etiqueta: C.nuevos, nota: C.total(total) },
      { clave: 'armados', valor: num(x.paquetes_armados), etiqueta: C.armados },
      { clave: 'enviadas', valor: num(x.enviadas), etiqueta: C.enviadas },
      { clave: 'a-mano', valor: num(x.postulados_a_mano), etiqueta: C.aMano },
    ];
    const dl = h('dl', { class: 'cifras etapas' });
    for (const f of filas) {
      dl.append(h('div', { class: 'etapa', dataset: { etapa: f.clave } },
        h('dt', { class: 'cifra-etiqueta', text: f.etiqueta }),
        h('dd', { class: 'cifra-numero', text: Terna.numero(f.valor) }),
        f.nota ? h('dd', { class: 'cifra-nota num', text: f.nota }) : null));
    }
    Terna.vaciar(cifras).append(dl);
  }
  // Cambiar el período rehace solo las cifras; lo anterior queda a media luz mientras llega lo nuevo, sin saltos.
  async function recargarPeriodo() {
    cifras.classList.add('recargando');
    const { data, error } = await sb.rpc('mi_resumen', { p_desde: desde() });
    cifras.classList.remove('recargando');
    if (error) { Terna.avisoBreve(Terna.textoError(error), { error: true }); return; }
    dibujarCifras((Array.isArray(data) ? data[0] : data) || {});
  }
  // Un plegable cerrado, entre reglas finas.
  function plegable(clase, id, titulo, cuerpo) {
    return h('details', { class: 'plegable ' + clase, 'aria-labelledby': id },
      h('summary', null, h('span', { class: 'plegable-titulo' }, h('h3', { id, text: titulo })), icono('i-chevron')), cuerpo);
  }

  // Una lista de barras: el nombre, la cantidad y una barra de la escala del panel. `fila.partes` parte la barra en lo que cuenta
  // (oscuro) y lo que no (gris); `fila.fuera` la apaga entera.
  function barras(filas, etiqueta) {
    const max = Math.max(1, ...filas.map((f) => f.valor));
    const ul = h('ul', { class: 'barras', role: 'list', 'aria-label': etiqueta });
    for (const f of filas) {
      const partes = f.partes || [f.valor, 0];
      const barra = h('span', { class: 'barra-pista', 'aria-hidden': 'true' },
        partes[0] ? conCuenta(h('span', { class: 'barra-relleno' }), pct(partes[0], max)) : null,
        partes[1] ? conCuenta(h('span', { class: 'barra-resto' }), pct(partes[1], max)) : null);
      ul.append(h('li', { class: 'barra-fila' + (f.fuera ? ' fuera' : ''), dataset: { nombre: f.nombre } },
        h('div', { class: 'barra-link' }, h('span', { class: 'barra-nombre' }, h('span', { text: f.nombre })),
          h('span', { class: 'barra-cuenta' }, h('span', { class: 'num', text: Terna.numero(f.valor) })), barra)));
      if (f.marcaDespues) ul.append(f.marcaDespues);
    }
    return ul;
  }
  // Por match (lo único que queda de «Tu lista hoy»): también lo que no llega al umbral, desde el piso (como la guía del umbral de
  // Preferencias), con la marca del umbral entre dos franjas. Sin avisos con match, no se dibuja.
  function plegablePorMatch(L) {
    const LI = I.lista;
    const conMatch = avisos.filter((a) => a.match !== null && a.match !== undefined && a.match >= piso && a.interes !== 'no_me_interesa' && Aviso.pasaBusqueda(a, L.busqueda));
    if (!conMatch.length) return null;
    const G = T.preferencias.guiaUmbral;
    const u = L.umbral;
    const franjas = [90, 80, 70, 60, 50].map((d, i, todas) => ({ desde: i === 4 ? Math.min(d, piso) : d, hasta: i === 0 ? 100 : todas[i - 1] - 1, nombre: G.franjas[d].nombre }));
    const filas = franjas.map((f) => {
      const de = conMatch.filter((a) => a.match >= f.desde && a.match <= f.hasta);
      const llegan = de.filter((a) => a.match >= u).length;
      return { nombre: f.nombre, valor: de.length, partes: [llegan, de.length - llegan], fuera: f.hasta < u, f };
    });
    // La marca del umbral va debajo de la franja donde cae (o de la última que llega entera).
    const iMarca = filas.findIndex((x) => x.f.desde <= u);
    if (iMarca >= 0) filas[iMarca].marcaDespues = h('li', { class: 'franjas-umbral' }, h('span', { class: 'umbral-pastilla num', text: G.marca(u) }));
    return plegable('por-match', 'h-franjas', LI.franjas, h('div', { class: 'plegable-cuerpo' }, barras(filas, LI.franjas),
      h('p', { class: 'tablero-nota' }, h('span', { class: 'suave', text: LI.franjasNota(piso) + ' ' }), h('a', { href: 'preferencias.html#busqueda', text: LI.cambiarUmbral }))));
  }

  // Semana a semana: ocho llamadas a mi_resumen, una desde el comienzo de cada semana (de siete días, hasta hoy); cada semana es la
  // resta de dos seguidas. Mosaicos con la cifra de esta semana y ocho columnas (la última, esta semana, en tinta) y su tabla. Está
  // plegado: las ocho llamadas se hacen recién al abrirlo, una vez.
  async function cuerpoSemanas() {
    const S = I.semanas;
    const C = I.cifras;
    const desdes = Array.from({ length: 8 }, (_, k) => Terna.sumarDias(hoy, -6 - 7 * k));
    const rs = await Promise.all(desdes.map((d) => sb.rpc('mi_resumen', { p_desde: d })));
    const conError = rs.find((x) => x.error);
    if (conError) return { error: conError.error };
    const acum = rs.map((x) => (Array.isArray(x.data) ? x.data[0] : x.data) || {});
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
    return { nodos: [h('div', { class: 'semanas-cuerpo' }, mosaicos, tabla),
      h('div', { class: 'semanas-pie' }, h('p', { class: 'suave tablero-intro', text: I.semanas.intro }), cambiar)] };
  }
  function plegableSemanas() {
    const cuerpo = h('div', { class: 'plegable-cuerpo' });
    const sec = plegable('semanas', 'h-semanas', I.semanas.titulo, cuerpo);
    let estado = 'sin_leer';
    sec.addEventListener('toggle', async () => {
      if (!sec.open || estado !== 'sin_leer') return;
      estado = 'leyendo';
      const parar2 = Terna.cargando(cuerpo);
      const x = await cuerpoSemanas();
      parar2();
      Terna.vaciar(cuerpo);
      if (x.error) {
        estado = 'sin_leer';  // al volver a abrirlo, lo intenta de nuevo
        cuerpo.append(h('p', { class: 'suave tablero-nota', text: Terna.textoError(x.error) }));
        return;
      }
      estado = 'leido';
      cuerpo.append(...x.nodos);
    });
    return sec;
  }
  function seccionComoViene(L) {
    const seg = h('div', { id: 'periodo', class: 'segmentado', role: 'radiogroup', 'aria-label': I.periodo });
    for (const p of PERIODOS) {
      seg.append(h('label', null,
        h('input', { type: 'radio', name: 'periodo', value: p, checked: p === periodo, onchange: () => { periodo = p; Terna.guardarLocal('inicio.periodo', p); recargarPeriodo(); } }),
        h('span', { text: I.periodos[p] })));
    }
    dibujarCifras(r);
    return h('section', { class: 'tablero-seccion como-viene', 'aria-labelledby': 'h-como-viene' },
      h('div', { class: 'tablero-cabecera' }, h('h2', { id: 'h-como-viene', text: I.comoViene }), seg), cifras,
      h('div', { class: 'como-viene-plegables' }, plegableSemanas(), L ? plegablePorMatch(L) : null));
  }

  /* ---------- Lo que priorizás (PLAN-UX §3.1, punto 8): las empresas que seguís y los puestos que buscás ---------- */
  const esNuevo = (a) => a.nuevo === true;
  function cabecera(id, titulo, editar) {
    return h('div', { class: 'tablero-cabecera' }, h('h2', { id, text: titulo }),
      editar ? h('a', { class: 'btn btn-texto btn-chico', href: editar.href, 'aria-label': editar.accesible, text: editar.texto }) : null);
  }
  function vacio(texto, ayuda, boton) {
    return h('div', { class: 'tablero-vacio' }, h('p', { text: texto }), h('p', { class: 'suave', text: ayuda }),
      h('a', { class: 'btn', href: boton.href }, icono('i-agregar'), boton.texto));
  }
  // Una fila de lo tuyo: el nombre, la cuenta y, si hay avisos, el link a Paquetes filtrado.
  function filaTuya(clase, nombre, cuenta, href, derecha) {
    const texto = h('span', { class: 'tuya-texto fila-texto' }, h('span', { class: 'tuya-nombre fila-nombre', text: nombre }),
      h('span', { class: 'tuya-cuenta fila-linea', text: cuenta }));
    return h('li', { class: clase }, href
      ? h('a', { class: 'tuya fila', href }, texto, derecha, icono('i-adelante', 'i-adelante'))
      : h('div', { class: 'tuya fila fila-info' }, texto, derecha));
  }
  const cuentaTuya = (deEsta) => {
    const k = deEsta.filter(esNuevo).length;
    return I.empresas.enLista(deEsta.length) + (k ? ', ' + I.empresas.nuevosCorto(k) : '');
  };
  // Cada empresa con lo que tiene en tu lista y lo nuevo (desde PLAN-UX, sin la lista de los nuevos arriba: cada fila ya lo dice).
  function seccionEmpresas(L, enLista, seguidas) {
    const E = I.empresas;
    const sec = h('section', { class: 'tablero-seccion seguidas', 'aria-labelledby': 'h-empresas' },
      cabecera('h-empresas', E.titulo, seguidas.filas.length ? { href: 'preferencias.html#empresas', texto: E.editar, accesible: E.editarAccesible } : null));
    if (!seguidas.filas.length) {
      sec.append(vacio(E.vacio, E.vacioAyuda, { href: 'preferencias.html#empresas', texto: E.seguir }));
      return sec;
    }
    const ul = h('ul', { class: 'tuyas filas', role: 'list' });
    for (const f of seguidas.filas) {
      const deEsta = enLista.filter((a) => L.esLaEmpresa(a, f.nombre));
      ul.append(filaTuya('seguida', f.nombre, cuentaTuya(deEsta), deEsta.length ? 'avisos.html?empresa=' + encodeURIComponent(f.nombre) : null, null));
    }
    sec.append(ul);
    if (prefs.priorizar_empresas === false) sec.append(h('p', { class: 'suave tablero-nota', text: E.apagado }));
    return sec;
  }
  // Cada puesto con lo que tiene en tu lista, lo nuevo y su mejor match.
  function seccionPuestos(L, enLista) {
    const P = I.puestos;
    const puestos = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim());
    const sec = h('section', { class: 'tablero-seccion buscados', 'aria-labelledby': 'h-puestos' },
      cabecera('h-puestos', P.titulo, puestos.length ? { href: 'preferencias.html#puestos', texto: P.editar, accesible: P.editarAccesible } : null));
    if (!puestos.length) {
      sec.append(vacio(P.vacio, P.vacioAyuda, { href: 'preferencias.html#puestos', texto: P.escribir }));
      return sec;
    }
    const ul = h('ul', { class: 'tuyas filas', role: 'list' });
    for (const p of puestos) {
      const deEste = enLista.filter((a) => L.esElPuesto(a, p));
      const mejor = deEste.reduce((m, a) => Math.max(m, num(a.match)), 0);
      const derecha = deEste.length && mejor ? h('span', { class: 'tuya-match' }, h('span', { class: 'tuya-match-numero', text: String(mejor) }), h('span', { class: 'tuya-match-etiqueta', text: P.mejor })) : null;
      ul.append(filaTuya('buscado', p, cuentaTuya(deEste), deEste.length ? 'avisos.html?puesto=' + encodeURIComponent(p) : null, derecha));
    }
    sec.append(ul);
    if (prefs.priorizar_puestos === false) sec.append(h('p', { class: 'suave tablero-nota', text: P.apagado }));
    return sec;
  }

  /* ---------- Para empezar (PLAN-UX §3.1): quien Terna todavía no corrió ----------
     En lugar de todo lo demás (cifras en cero y tableros vacíos), tres pasos con su estado y el link a Cómo funciona. */
  function paraEmpezar() {
    const E = I.empezar;
    // Con el perfil incompleto, el paso 1 dice también que Terna no busca hasta completarlo (FEEDBACK-UX P2-3 a).
    const falta = ctx.faltantes.length ? E.perfilFalta(Terna.listaFaltantes(ctx.faltantes)) : null;
    const paso = (href, texto, linea, hecho) => h('li', null, h('a', { class: 'fila empezar-paso' + (hecho ? ' hecho' : ''), href },
      h('span', { class: 'empezar-marca', 'aria-hidden': 'true' }, hecho ? icono('i-tilde', 'icono-16') : null),
      h('span', { class: 'fila-texto' }, h('span', { class: 'fila-nombre', text: texto }), linea ? h('span', { class: 'fila-linea', text: linea }) : null),
      icono('i-adelante', 'i-adelante')));
    return h('section', { class: 'empezar', 'aria-labelledby': 'h-empezar' },
      h('h2', { id: 'h-empezar', text: E.titulo }),
      h('ol', { class: 'filas empezar-pasos' },
        paso('perfil.html', E.perfil, falta || E.hecho, !falta),
        paso('preferencias.html', E.preferencias, E.preferenciasAyuda, false),
        paso('busqueda.html', E.empleos, hayPara ? T.busqueda.enInicio(num(hayPara.avisos), num(hayPara.semana)) : null, false)),
      h('a', { class: 'btn btn-texto empezar-como', href: 'como-funciona.html' }, icono('i-preguntar'), E.como));
  }

  /* ---------- La página ---------- */
  const tocan = avisos ? teTocan(avisos) : null;
  const seguidas = Lista.seguidasDe(rPref.data);
  const L = avisos ? Lista.crear(avisos, { prefs, piso, seguidas: seguidas.filas }) : null;
  // Lo que tenés por decidir: el grupo «Te toca decidir» de Paquetes › Por armar, con su regla (js/lista.js), para que la fila de
  // acá, el número ámbar y el grupo digan lo mismo. Sin esa lectura (o sin la regla), lo de mi_resumen.
  const porDecidir = L && L.grupoDe && L.enPaquetes
    ? avisos.filter((a) => L.enPaquetes(a) && L.grupoDe(a) === 'decidir').length : num(r.por_decidir);
  // Lo que te toca, en el muelle y en el carril: lo mismo que suman las filas de Te toca a vos que van a Postulaciones. Si la
  // lectura de mis_avisos falló, lo de mi_resumen.
  Terna.cuentaToca(tocan ? tocan.length : num(r.a_mano_pendientes) + num(r.para_revisar));
  // Las dos cuentas de Paquetes (decisión D3): en ámbar, lo que tenés por decidir; en lila, los paquetes nuevos: los de la última
  // corrida armados después de tu última visita a Paquetes › Armados (la guarda Paquetes en este navegador; PLAN-UX §6.3). Sin la
  // lectura de mis_avisos, la lila queda como estaba en la sesión.
  const nuevos = avisos && typeof Lista.paquetesNuevos === 'function' ? Lista.paquetesNuevos(avisos, fechaCorrida) : undefined;
  Terna.cuentaPaquetes({ nuevos, porDecidir });

  const corrida = lineaCorrida();
  if (corrida) cont.append(corrida);
  if (!fechaCorrida) {
    cont.append(paraEmpezar());
    return;
  }
  cont.append(seccionToca(tocan));
  const ultimo = seccionUltimo(ultimosDeLaCorrida());
  if (ultimo) cont.append(ultimo);
  const empleos = entradaEmpleos();
  if (empleos) cont.append(empleos);
  const tarjetaCuentas = preguntaCuentas();
  if (tarjetaCuentas) cont.append(tarjetaCuentas);

  const tablero = h('div', { class: 'tablero' });
  cont.append(tablero);
  if (!avisos) {
    tablero.append(seccionComoViene(null), h('p', { class: 'suave tablero-error', text: Terna.textoError(rA.error) }));
    return;
  }
  const enLista = avisos.filter(L.enLista);
  tablero.append(seccionComoViene(L));
  if (seguidas.hay) tablero.append(seccionEmpresas(L, enLista, seguidas));
  tablero.append(seccionPuestos(L, enLista));
});
