/* Terna · js/aviso.js
   Las piezas de un aviso que comparten Avisos y Postulaciones (diseno.md §7.3 a §7.5, §8.3 a §8.5, §10.2,
   §10.12 y §10.13): chips, atributos, match, etiquetas, control de interés, paquete con sus cuatro fichas y sus dos
   desplegables (notas y "Ver por qué"), recorrido de cinco puntos y la línea de cada etapa. */
'use strict';

window.Aviso = (function () {
  const { h, icono, oculto } = Terna;

  /* ---------- Estados ---------- */
  // Lo que muestra el chip del paquete: el texto manda sobre el estado del paquete.
  function estadoPaquete(a) {
    if (!a.tiene_texto) return 'sin_texto';
    if (a.match === null && a.texto_origen === 'usuario') return 'por_puntuar';
    return a.estado_paquete;
  }
  const ESTILO_PAQUETE = {
    armado: ['chip-accion', 'i-armado'], sin_armar: ['', 'i-sin-armar'], pedido: ['chip-espera', 'i-pedido'],
    no_se_pudo_armar: ['chip-error', 'i-alerta'], sin_texto: ['chip-espera', 'i-sin-texto'], por_puntuar: ['chip-espera', 'i-pedido'],
  };
  const ESTILO_POSTULACION = {
    en_cola: ['chip-espera', 'i-pedido', 'etapa-espera'], para_revisar: ['chip-espera', 'i-revisar', 'etapa-espera'],
    enviada: ['chip-azul', 'i-enviada', 'etapa-azul'], a_mano: ['chip-espera', 'i-a-mano', 'etapa-espera'],
    postulado: ['chip-azul', 'i-enviada', 'etapa-azul'], entrevista: ['chip-accion', 'i-entrevista', 'etapa-accion'],
  };
  function llega(a, umbral) { return a.match !== null && a.match !== undefined && a.match >= umbral; }

  /* ---------- Chips y etiquetas ---------- */
  function chip(clase, iconoId, texto, explicacion) {
    return h('span', { class: 'chip' + (clase ? ' ' + clase : ''), title: explicacion || null },
      icono(iconoId, 'icono-14'), h('span', { text: texto }), explicacion ? oculto(': ' + explicacion) : null);
  }
  function chipPaquete(a) {
    const e = estadoPaquete(a);
    const [c, i] = ESTILO_PAQUETE[e] || ESTILO_PAQUETE.sin_armar;
    return chip(c, i, T.avisos.paquete[e], T.chips[e]);
  }
  function chipPostulacion(a) {
    const e = a.estado_postulacion;
    if (!ESTILO_POSTULACION[e]) return h('span', { class: 'chip-texto', title: T.chips.pendiente, text: T.avisos.postulacion.pendiente });
    const [c, i] = ESTILO_POSTULACION[e];
    return chip(c, i, T.avisos.postulacion[e], T.chips[e]);
  }
  function chipInteres(a, config) {
    if (a.interes === 'por_decidir') return chip('chip-espera', 'i-por-decidir', T.avisos.interes.por_decidir, T.chips.por_decidir);
    if (a.interes === 'no_me_interesa') {
      return chip('chip-suave', 'i-no-interesa', T.avisos.interes.no_me_interesa, T.chips.no_me_interesa((config && config.retencion_no_interesa_dias) || 30));
    }
    return null;
  }
  function chipFaltan(a) {
    const n = (a.requisitos_faltantes || []).length;
    if (!n) return null;
    return h('span', { class: 'chip-texto tinta' }, icono('i-alerta', 'icono-14'), n === 1 ? T.avisos.faltaUno : T.avisos.faltan(n));
  }

  /* ---------- El veredicto de requisitos (match.v2; brand.md 0.4.19 §6.4 y §6.10; datos.md 0.20, 0025) ----------
     `evaluacion` es cómo calculó Terna el match: la función, el nivel, las habilidades, cada requisito con su estado, los
     puntos, el tope y el veredicto. Un match de match.v1 (o una base sin 0025) no la tiene y se muestra como antes. */
  function evaluacion(a) {
    const ev = a && a.evaluacion;
    return ev && typeof ev === 'object' && ev.version === 'match.v2' && T.avisos.calificacion[ev.calificacion] ? ev : null;
  }
  const ICONO_CALIFICACION = { cumple: 'i-tilde', a_confirmar: 'i-preguntar', falta: 'i-alerta', sobra_nivel: 'i-nivel-bajo', falta_nivel: 'i-nivel-alto' };
  function textoCalificacion(ev) {
    const C = T.avisos.calificacion;
    const conteo = ev.conteo || {};
    if (ev.calificacion === 'falta') return C.falta(Math.max(1, Number(conteo.no_cumple) || 0));
    if (ev.calificacion === 'a_confirmar') return C.a_confirmar(Math.max(1, Number(conteo.no_figura) || 0));
    return C[ev.calificacion];
  }
  // En la tarjeta, la fila y la ficha, al lado de los chips: texto con su ícono, sin fondo (brand.md §5.1: un requisito que
  // falta no lleva color). "Cumplís los requisitos" va en tinta suave; lo demás, en tinta. Con `conExplicacion` en false va
  // sin la explicación oculta: la fila de Postulaciones en celular es un botón y todo su texto es su nombre (diseno.md 0.16 §8.3).
  function chipCalificacion(a, conExplicacion = true) {
    const ev = evaluacion(a);
    if (!ev) return chipFaltan(a);
    const explicacion = T.chips[ev.calificacion];
    return h('span', { class: 'chip-texto calificacion' + (ev.calificacion === 'cumple' ? '' : ' tinta'), title: explicacion, dataset: { calificacion: ev.calificacion } },
      icono(ICONO_CALIFICACION[ev.calificacion], 'icono-14'), h('span', { text: textoCalificacion(ev) }), conExplicacion ? oculto(': ' + explicacion) : null);
  }
  function fecha(a) {
    return h('span', { class: 'fecha-aviso' }, Terna.relativa(a.publicado_en || a.visto_en),
      a.nuevo ? [' · ', h('b', { text: T.avisos.nuevo })] : null);
  }
  // Las etiquetas del aviso (brand.md §6.10): en la lista, cortas con tooltip; en la ficha, con su explicación. `fuera` es
  // la lista de lo que no entra en las preferencias de búsqueda (motivosFuera), o null.
  function etiquetas(a, bajoMinimo, explicadas, fuera) {
    const lista = [];
    if (a.dudoso) lista.push(['i-viejo', T.avisos.viejo, T.avisos.viejoExplicacion, T.avisos.viejoAccesible]);
    if (bajoMinimo) lista.push(['i-bajo-minimo', T.avisos.bajoMinimo, T.avisos.bajoMinimoExplicacion, null]);
    if (fuera && fuera.length) {
      const m = fuera.join(', ');
      lista.push(['i-filtrar', T.avisos.fuera, T.avisos.fueraExplicacion(m), T.avisos.fueraAccesible(m)]);
    }
    if (!lista.length) return null;
    if (explicadas) {
      return h('div', { class: 'etiquetas' }, lista.map(([ic, tx, ex]) =>
        h('div', { class: 'etiqueta-explicada' }, h('span', { class: 'etiqueta' }, icono(ic), tx), h('p', { text: ex }))));
    }
    return h('span', { class: 'etiquetas' }, lista.map(([ic, tx, ex, acc]) =>
      h('span', { class: 'etiqueta', title: ex }, icono(ic), h('span', { 'aria-hidden': acc ? 'true' : null, text: tx }), acc ? oculto(acc) : null)));
  }

  /* ---------- Preferencias de búsqueda (diseno.md 0.11 §7.2; datos.md 0.12, 0018) ----------
     Lo mismo que el motor (filtros.pasa_preferencias), con las preferencias del momento: un aviso sin modalidad, nivel o
     jornada pasa siempre; uno sin alcance cuenta como local. El área de la ciudad no se mira acá: lo local ya entró a la
     lista por estar en el área de la persona. */
  const MODALIDADES = ['remoto', 'hibrido', 'presencial'];
  const ALCANCES = ['local', 'exterior'];
  const NIVELES = ['pasantia', 'junior', 'semi_senior', 'senior', 'lider', 'director'];
  const JORNADAS = ['completa', 'parcial'];
  const TODOS_BUSQUEDA = { modalidad: MODALIDADES, alcance: ALCANCES, nivel: NIVELES, jornada: JORNADAS };
  // Lo que dejan pasar las preferencias, por dimensión. Una lista vacía o rara vale "todo" (la base no deja guardarla).
  function busquedaDe(prefs) {
    const p = prefs || {};
    const lista = (v, todos) => { const l = Array.isArray(v) ? todos.filter((x) => v.includes(x)) : []; return l.length ? l : todos.slice(); };
    return {
      modalidad: lista(p.modalidades, MODALIDADES),
      alcance: p.alcance === 'local' || p.alcance === 'exterior' ? [p.alcance] : ALCANCES.slice(),
      nivel: lista(p.niveles, NIVELES),
      jornada: lista(p.jornadas, JORNADAS),
    };
  }
  const alcanceDe = (a) => (a.alcance === 'exterior' ? 'exterior' : 'local');
  function pasaBusqueda(a, b) {
    return (!a.modalidad || b.modalidad.includes(a.modalidad)) && b.alcance.includes(alcanceDe(a))
      && (!a.nivel || b.nivel.includes(a.nivel)) && (!a.jornada || b.jornada.includes(a.jornada));
  }
  // Lo que no entra, en palabras ("híbrido", "pasantía"), para la etiqueta "Fuera de tus preferencias". Solo cuenta para un
  // aviso que Terna decidiría solo: con la postulación pendiente y sin un pedido de la persona (pedido_en); lo pedido, lo
  // que está en marcha y lo hecho siguen su curso (pipeline.md 0.3.15 §4.9 y §4.12).
  function motivosFuera(a, b) {
    if (a.pedido_en || (a.estado_postulacion && a.estado_postulacion !== 'pendiente')) return [];
    const m = [];
    if (a.modalidad && !b.modalidad.includes(a.modalidad)) m.push(T.avisos.modalidadMin[a.modalidad]);
    if (!b.alcance.includes(alcanceDe(a))) m.push(T.avisos.alcanceMin[alcanceDe(a)]);
    if (a.nivel && !b.nivel.includes(a.nivel)) m.push(T.avisos.nivelMin[a.nivel]);
    if (a.jornada && !b.jornada.includes(a.jornada)) m.push(T.avisos.jornadaMin[a.jornada]);
    return m;
  }

  /* ---------- Tus puestos y lo que Terna te sugiere (diseno.md 0.25 §1.36 y §8.2) ----------
     Una sola regla para Avisos, Postulaciones e Inicio, la misma con que el motor elige qué armar (pipeline.md 0.4.15 §4.9:
     lo pedido, lo que llega al umbral y, con "Priorizar mis puestos", los de tus puestos desde el piso). `criterio` junta lo que
     hace falta de las preferencias del momento; el puesto de cada aviso se calcula una vez (el título no cambia en la página). */
  // `seguidas` (desde 0034): las empresas que sigue la persona, como filas { nombre, alias } o nombres.
  function criterio(prefs, piso, seguidas) {
    const p = prefs || {};
    const P = window.Puestos;
    // Priorizar mis puestos (0027): sin la columna vale Sí, como en el motor. Un puesto muy general no cuenta.
    const puestos = !P || p.priorizar_puestos === false ? [] : (p.puestos_objetivo || []).filter((x) => x && !P.general(x));
    // Priorizar mis empresas (0034), igual: sin la columna vale Sí.
    const filas = (seguidas || []).map((s) => (s && typeof s === 'object' ? s : { nombre: s, alias: null })).filter((f) => f.nombre && String(f.nombre).trim());
    const empresas = !window.Empresas || p.priorizar_empresas === false ? [] : filas;
    return { umbral: p.umbral, piso, puestos, empresas, busqueda: busquedaDe(p), cache: new Map(), cacheEmpresas: new Map() };
  }
  // El puesto de la persona que el título tiene entero, como lo escribió, o null: desde el piso, con interés y, si Terna lo
  // decidiría sola (pendiente y sin pedido), dentro de las preferencias.
  function tuPuesto(a, c) {
    if (!c.puestos.length || a.match === null || a.match === undefined || a.match < c.piso) return null;
    if (a.interes === 'no_me_interesa' || motivosFuera(a, c.busqueda).length) return null;
    if (!c.cache.has(a.match_id)) c.cache.set(a.match_id, Puestos.buscado(a.puesto, c.puestos));
    return c.cache.get(a.match_id);
  }
  // La empresa que la persona sigue y es la del aviso, como la escribió, o null (diseno.md 0.26 §7.3): desde el piso, con interés
  // y dentro de las preferencias, como tu puesto. En la versión 1 solo se ve y va primero: Terna no la arma sola debajo del umbral
  // (por eso no entra en `sugerida`).
  function tuEmpresa(a, c) {
    if (!c.empresas || !c.empresas.length || a.match === null || a.match === undefined || a.match < c.piso) return null;
    if (a.interes === 'no_me_interesa' || motivosFuera(a, c.busqueda).length) return null;
    if (!c.cacheEmpresas.has(a.match_id)) c.cacheEmpresas.set(a.match_id, Empresas.seguida(a.empresa, c.empresas));
    return c.cacheEmpresas.get(a.match_id);
  }
  // Lo que Terna te sugiere: lo pediste, llega a tu umbral o es de tus puestos. Una postulación a mano que no, quedó así
  // después de armarse (subiste el umbral o un repuntaje la bajó): Inicio no la cuenta y Postulaciones la pone en "Bajo tu umbral".
  function sugerida(a, c) {
    return !!a.pedido_en || a.match === null || a.match === undefined || a.match >= c.umbral || !!tuPuesto(a, c);
  }
  function bajoUmbral(a, c) { return a.estado_postulacion === 'a_mano' && !sugerida(a, c); }

  /* ---------- Atributos, match ---------- */
  // Los portales que entran por alertas reenviadas (arquitectura.md §7.8): su nombre va en los atributos, porque el aviso
  // se abre y se postula ahí, con la cuenta de la persona.
  const DE_ALERTAS = new Set(['LinkedIn', 'Indeed', 'Bumeran', 'Zonajobs', 'Computrabajo']);
  function lugar(a) { return a.alcance === 'exterior' ? T.avisos.alcanceMin.exterior : (a.ubicacion || T.avisos.alcanceMin.local); }
  // `fuente`: de dónde vino el aviso (la ficha); `donde`: dónde se postula (la tarjeta del celular, desde diseno.md 0.23).
  function atributos(a, opciones) {
    opciones = opciones || {};
    const partes = [[a.alcance === 'exterior' ? 'i-exterior' : 'i-local', lugar(a)]];
    if (a.modalidad) partes.push(['i-' + a.modalidad, T.avisos.modalidadMin[a.modalidad]]);
    if (!opciones.sinFuente && (opciones.fuente || DE_ALERTAS.has(a.fuente))) partes.push([null, DE_ALERTAS.has(a.fuente) ? T.avisos.deAlerta(a.fuente) : a.fuente]);
    const nodo = h(opciones.tag || 'span', { class: 'atributos' });
    partes.forEach(([ic, tx], i) => {
      if (i) nodo.append(h('span', { 'aria-hidden': 'true', text: '·' }), oculto(', '));
      if (ic) nodo.append(icono(ic, 'icono-16'));
      nodo.append(h('span', { text: tx }));
    });
    return nodo;
  }
  // `solo`: el número sin barra ni palabra (filas de Postulaciones, diseno.md §8.3).
  function bloqueMatch(a, umbral, grande, solo) {
    const sinMatch = a.match === null || a.match === undefined;
    const ok = llega(a, umbral);
    const cont = h('span', { class: 'match' + (ok ? '' : ' match-bajo') + (grande ? ' match-grande' : '') + (solo ? ' match-solo' : ''), title: T.chips.match });
    cont.append(h('span', { class: 'match-numero', 'aria-hidden': 'true', text: sinMatch ? '—' : String(a.match) }));
    if (!solo) {
      cont.append(h('span', { class: 'match-barra', 'aria-hidden': 'true', css: { '--match': String(sinMatch ? 0 : a.match) } }, h('span')),
        h('span', { class: 'match-palabra', 'aria-hidden': 'true', text: T.avisos.matchPalabra }));
    }
    cont.append(oculto(sinMatch ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, ok)));
    return cont;
  }

  /* ---------- Interés (§7.4) ---------- */
  function controlInteres(a, nombre, alCambiar) {
    const fs = h('fieldset', { class: 'interes' }, h('legend', { class: 'oculto-visual', text: T.avisos.interesGrupo(a.puesto) }));
    for (const valor of ['me_interesa', 'no_me_interesa']) {
      const input = h('input', { type: 'radio', name: nombre, value: valor, checked: a.interes === valor, dataset: { control: 'interes-' + valor },
        onchange: () => alCambiar(valor) });
      fs.append(h('label', { class: 'chip-opcion' + (valor === 'no_me_interesa' ? ' chip-opcion-no' : '') }, input,
        h('span', { class: 'chip-opcion-cara' }, icono(valor === 'me_interesa' ? 'i-tilde' : 'i-no-interesa'), T.avisos.interes[valor])));
    }
    return fs;
  }

  /* ---------- Paquete (§10.12) ---------- */
  function parsearNotas(texto) {
    const defs = T.avisos.notasBloques;
    const titulos = defs.map((d) => d.titulo);
    const encontrados = new Map();
    let actual = null;
    for (const cruda of String(texto || '').split(/\r?\n/)) {
      const linea = cruda.trim();
      if (!linea) continue;
      const i = titulos.indexOf(linea);
      if (i >= 0) { actual = []; encontrados.set(i, actual); continue; }
      if (actual) actual.push(linea.replace(/^[-•]\s*/, ''));
    }
    return defs.map((def, i) => ({ def, lineas: (encontrados.get(i) || []).filter((l) => l && l !== T.avisos.notasVacio) }));
  }
  // Las notas en sus cinco bloques (cv-ats.md §7.1) y "Copiar notas" (diseno.md §7.5), que copia el texto tal cual.
  // Los íconos de los cinco bloques llevan nombre accesible (brand.md 0.3 §6.4); los demás acompañan texto y son decorativos.
  function iconoConNombre(id, nombre) {
    const svg = icono(id);
    svg.removeAttribute('aria-hidden');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', nombre);
    return svg;
  }
  function panelNotas(texto, id) {
    const panel = h('div', { class: 'panel-paquete', id, hidden: true, role: 'region', 'aria-label': T.avisos.ficha.notasLargo });
    for (const b of parsearNotas(texto)) {
      panel.append(h('div', { class: 'nota-bloque' },
        h('h4', null, iconoConNombre(b.def.icono, b.def.nombre), h('span', { text: b.def.titulo })),
        b.lineas.length ? h('ul', null, b.lineas.map((l) => h('li', { text: l }))) : h('p', { text: T.avisos.notasVacio })));
    }
    // Sin botón de copiar en v1 (brand.md 0.3 §6.4).
    return panel;
  }
  function textoSalario(a) {
    if (a.salario_monto === null || a.salario_monto === undefined) return T.avisos.ficha.salarioSinDatos;
    return T.avisos.ficha.salario(Terna.numero(Number(a.salario_monto)), a.salario_moneda, a.salario_periodo);
  }
  /* Palabras del aviso que el CV no tiene (brand.md 0.6 §6.4; cv-ats.md 0.5 §3.13): las que el motor guardó en
     contenido.render.terminos_faltantes porque el perfil no las respalda. Se listan, sin botón: Terna no suma sola una palabra que
     la persona no confirmó, y desde 0.6 tampoco hay "Sumar" (Francisco, 05/11/2026). La que sabe usar, la suma en Preferencias ›
     Palabras clave personalizadas, donde están además las recomendadas; desde ahí va sola en los próximos CV. */
  function palabrasFaltantes(a) {
    const lista = (a.terminos_faltantes || []).filter((x) => typeof x === 'string' && x.trim()).slice(0, 8);
    if (!lista.length) return null;
    const F = T.avisos.ficha;
    const idT = Terna.idUnico('faltan');
    return h('div', { class: 'seccion', role: 'group', 'aria-labelledby': idT },
      h('p', { class: 'campo-etiqueta', id: idT, text: F.faltanTitulo }),
      h('div', { class: 'chips' }, lista.map((termino) => h('span', { class: 'chip chip-suave', text: termino }))),
      h('p', { class: 'campo-ayuda' }, F.faltanAyuda + ' ', h('a', { href: 'preferencias.html#paquetes', text: F.faltanLink })));
  }

  // Las cuatro fichas: CV y Carta son links firmados (se descargan con el nombre de cv-ats.md §3.12);
  // Notas y Salario despliegan su texto debajo, uno a la vez, y arrancan cerrados (decisión 9 del chat 8).
  function fichasPaquete(a) {
    const idioma = a.paquete_idioma === 'en' ? 'en' : 'es';
    const idiomaTxt = T.avisos.ficha.idiomas[idioma];
    const idNotas = Terna.idUnico('notas');
    const idSalario = Terna.idUnico('salario');
    const cv = Terna.linkFirmado(a.cv_path, Terna.nombreDescarga('cv', idioma),
      h('a', { class: 'ficha-doc' }, icono('i-cv'), h('strong', { text: T.avisos.ficha.cv }), h('span', { text: T.avisos.ficha.pdfIdioma(idiomaTxt) })));
    const carta = Terna.linkFirmado(a.carta_path, Terna.nombreDescarga('carta', idioma),
      h('a', { class: 'ficha-doc' }, icono('i-sobre'), h('strong', { text: T.avisos.ficha.carta }), h('span', { text: T.avisos.ficha.pdfIdioma(idiomaTxt) })));
    const sinMonto = a.salario_monto === null || a.salario_monto === undefined;
    const tituloSalario = sinMonto ? T.avisos.ficha.sinDatos : T.avisos.ficha.salarioCorto(Terna.numero(Number(a.salario_monto)), a.salario_moneda);
    const subSalario = sinMonto ? T.avisos.ficha.verPorQue
      : (a.salario_periodo === 'anual' ? T.avisos.ficha.porAnio : T.avisos.ficha.porMes) + ' · ' + T.avisos.ficha.verPorQue;
    const bNotas = h('button', { class: 'ficha-doc', type: 'button', 'aria-expanded': 'false', 'aria-controls': idNotas },
      icono('i-notas'), h('strong', { text: T.avisos.ficha.notas }), h('span', { text: T.avisos.ficha.notasSub }));
    const bSalario = h('button', { class: 'ficha-doc', type: 'button', 'aria-expanded': 'false', 'aria-controls': idSalario },
      icono('i-salario'), oculto(textoSalario(a) + '. '), h('strong', { class: 'num', 'aria-hidden': 'true', text: tituloSalario }), h('span', { text: subSalario }));
    const pNotas = panelNotas(a.notas, idNotas);
    const pSalario = h('div', { class: 'panel-paquete', id: idSalario, hidden: true, role: 'region', 'aria-label': T.avisos.ficha.verPorQue },
      h('p', { class: 'num', text: textoSalario(a) + '.' }), a.salario_motivo ? h('p', { text: a.salario_motivo }) : null);
    const alternar = (boton, panel, otroBoton, otroPanel) => {
      const abrir = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', String(abrir));
      panel.hidden = !abrir;
      if (abrir) { otroBoton.setAttribute('aria-expanded', 'false'); otroPanel.hidden = true; }
    };
    bNotas.addEventListener('click', () => alternar(bNotas, pNotas, bSalario, pSalario));
    bSalario.addEventListener('click', () => alternar(bSalario, pSalario, bNotas, pNotas));
    return h('div', { class: 'ficha-seccion' },
      h('div', { class: 'fichas-paquete' }, cv, carta, a.notas ? bNotas : null, bSalario),
      pNotas, pSalario,
      h('p', { class: 'suave', text: T.avisos.ficha.idiomaDocs(idiomaTxt) }),
      palabrasFaltantes(a));
  }

  /* ---------- Recorrido (§10.13) ---------- */
  function puntos(a) {
    const e = a.estado_postulacion;
    const p = [
      'punto-tinta',
      a.interes === 'me_interesa' ? 'punto-tinta' : '',
      a.paquete_id ? 'punto-accion' : (a.estado_paquete === 'pedido' ? 'punto-espera' : ''),
      (e === 'enviada' || e === 'postulado' || e === 'entrevista') ? 'punto-azul'
        : (e === 'en_cola' || e === 'para_revisar') ? 'punto-espera' : (e === 'a_mano' ? 'punto-mano' : ''),
      e === 'entrevista' ? 'punto-entrevista' : '',
    ];
    const lleno = (c) => c === 'punto-tinta' || c === 'punto-accion' || c === 'punto-azul' || c === 'punto-entrevista';
    const tramos = [0, 1, 2, 3].map((i) => (lleno(p[i]) && lleno(p[i + 1]) ? ({ 'punto-tinta': 'tramo-tinta', 'punto-accion': 'tramo-accion', 'punto-azul': 'tramo-azul' })[p[i]] || '' : ''));
    return { p, tramos };
  }
  function recorrido(a) {
    const { p, tramos } = puntos(a);
    const nodo = h('span', { class: 'recorrido', 'aria-hidden': 'true' });
    p.forEach((c, i) => {
      if (i) nodo.append(h('span', { class: 'tramo ' + tramos[i - 1] }));
      nodo.append(h('span', { class: 'punto ' + c }));
    });
    return nodo;
  }
  function recorridoGrande(a) {
    const { p, tramos } = puntos(a);
    const etiquetas = T.postulaciones.recorrido;
    return h('div', { class: 'recorrido-grande', 'aria-hidden': 'true' }, p.map((c, i) =>
      h('div', { class: 'recorrido-paso' },
        h('div', { class: 'recorrido-pista' }, h('i', { class: i === 0 ? 'nada' : tramos[i - 1] }), h('span', { class: 'punto ' + c }), h('i', { class: i === 4 ? 'nada' : tramos[i] })),
        h('small', { text: etiquetas[i] }))));
  }

  /* ---------- Etapa y su línea (brand.md §6.5) ---------- */
  function traba(a, config) {
    const M = T.postulaciones.trabas;
    if (a.motivo_a_mano === 'elegido_por_usuario') return M.elegido_por_usuario;
    if (a.traba_detalle) return a.traba_detalle;
    const m = M[a.motivo_a_mano] || M.error;
    if (typeof m !== 'function') return m;
    return a.motivo_a_mano === 'no_postulable' ? m(a.fuente) : m((config && config.max_reintentos_postulacion) || 3);
  }
  function lineaEtapa(a, config) {
    const L = T.postulaciones.linea;
    switch (a.estado_postulacion) {
      case 'en_cola': return L.en_cola;
      case 'para_revisar': return L.para_revisar;
      case 'enviada': return L.enviada(Terna.fechaCorta(a.enviada_en), Terna.hora(a.enviada_en));
      case 'postulado': return L.postulado(Terna.fechaCorta(a.postulado_en));
      case 'entrevista': return L.entrevista(Terna.fechaCorta(a.entrevista_en));
      case 'a_mano': return traba(a, config);
      default: return a.paquete_id ? L.pendiente : '';
    }
  }
  function claseEtapa(a) { return (ESTILO_POSTULACION[a.estado_postulacion] || [null, null, 'etapa-suave'])[2]; }
  function puedeVolverAProbar(a, config) {
    return a.estado_postulacion === 'a_mano' && a.postulacion === 'formulario' && (a.intentos || 0) < ((config && config.max_reintentos_postulacion) || 3);
  }
  // La sección "Postulación" de la ficha del aviso: dónde se postula (diseno.md 0.23 §7.5), chip, línea y el link a la ficha de la
  // postulación.
  function seccionPostulacion(a, config, prefs) {
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: T.avisos.ficha.postulacion }));
    const d = donde(a, prefs);
    // Dónde se postula, como respuesta: las palabras en negrita y, mientras no hay una etapa que lo explique, por qué (con la
    // postulación a mano el motivo es la línea de la etapa; lo postulado no lo repite).
    if (!d.hecha) sec.append(h('p', { class: 'donde-ficha' }, etiquetaDonde(d)));
    if (!d.hecha && a.estado_postulacion !== 'a_mano') sec.append(h('p', { class: 'suave', text: explicacionDonde(a, d, prefs) }));
    const hay = a.estado_postulacion !== 'pendiente' || a.paquete_id;
    if (!hay) return sec;
    sec.append(h('div', { class: 'chips' }, chipPostulacion(a)));
    const linea = lineaEtapa(a, config);
    if (linea) sec.append(h('p', { text: linea }));
    if (a.estado_postulacion === 'a_mano') sec.append(h('p', { text: T.postulaciones.linea.todoListo }));
    sec.append(h('p', null, h('a', { href: 'postulaciones.html#postulacion-' + a.match_id, text: T.avisos.ficha.verEnPostulaciones })));
    return sec;
  }
  // "Por qué ajusta" y lo que falta. Con match.v2, "Requisitos del aviso" (cada requisito con su estado, y el veredicto en
  // palabras) y "Cómo se calcula", plegado; con match.v1, "No cumplís" o "No cumplís o no figura", como hasta 0.4.18.
  function razones(a, plegadas) {
    const lista = [];
    if ((a.razones || []).length) {
      lista.push(seccionLista(T.avisos.ficha.porQue, a.razones, 'i-tilde', plegadas));
    }
    const ev = evaluacion(a);
    if (ev) {
      lista.push(seccionRequisitos(ev, plegadas));
      const calculo = seccionCalculo(a, ev);
      if (calculo) lista.push(calculo);
      return lista;
    }
    const faltan = a.requisitos_faltantes || [];
    if (faltan.length) {
      const noFigura = faltan.some((r) => /\(no figura en tu perfil\)\s*$/.test(r));
      lista.push(seccionLista(noFigura ? T.avisos.ficha.noCumplisONoFigura : T.avisos.ficha.noCumplis, faltan, 'i-alerta', plegadas));
    }
    return lista;
  }
  // Una sección de la ficha, abierta (con su título) o plegable (el título es el botón).
  function seccion(titulo, contenido, plegada, clase) {
    const cuerpo = h('div', { class: 'ficha-seccion-cuerpo' + (clase ? ' ' + clase : '') }, contenido);
    if (!plegada) return h('section', { class: 'ficha-seccion' }, h('h3', { text: titulo }), cuerpo);
    const id = Terna.idUnico('pleg');
    cuerpo.id = id;
    cuerpo.hidden = true;
    const boton = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': 'false', 'aria-controls': id,
      onclick: () => { const abrir = boton.getAttribute('aria-expanded') !== 'true'; boton.setAttribute('aria-expanded', String(abrir)); cuerpo.hidden = !abrir; } },
    h('span', { text: titulo }), icono('i-chevron'));
    return h('section', { class: 'ficha-seccion' }, boton, cuerpo);
  }
  function listaIconos(items, iconoId) {
    return h('ul', { class: 'lista-iconos' }, items.map((t) => h('li', null, icono(iconoId, iconoId === 'i-tilde' ? 'i-tilde' : ''), h('span', { text: t }))));
  }
  function seccionLista(titulo, items, iconoId, plegada) {
    return seccion(titulo, listaIconos(items, iconoId), plegada);
  }
  function seccionRequisitos(ev, plegada) {
    const F = T.avisos.ficha;
    const reqs = (Array.isArray(ev.requisitos) ? ev.requisitos : []).filter((r) => r && r.texto);
    const de = (estado) => reqs.filter((r) => r.estado === estado).map((r) => String(r.texto));
    const conteo = ev.conteo || {};
    const V = F.veredicto;
    let frase;
    if (ev.calificacion === 'falta') frase = V.falta(Math.max(1, Number(conteo.no_cumple) || 0));
    else if (ev.calificacion === 'a_confirmar') frase = V.a_confirmar(Math.max(1, Number(conteo.no_figura) || 0));
    else if (ev.calificacion === 'cumple') frase = reqs.length ? V.cumple : V.cumpleSinRequisitos;
    else frase = V[ev.calificacion];
    const partes = [h('p', { class: 'veredicto' }, icono(ICONO_CALIFICACION[ev.calificacion], 'icono-16'), h('span', { text: frase }))];
    const grupo = (titulo, items, iconoId, extra) => (items.length
      ? h('div', { class: 'requisitos-grupo' }, h('h4', { text: titulo }), listaIconos(items, iconoId), extra || null) : null);
    partes.push(
      grupo(F.reqNoCumplis, de('no_cumple'), 'i-alerta'),
      grupo(F.reqNoFigura, de('no_figura'), 'i-preguntar',
        h('p', { class: 'suave' }, F.reqNoFiguraAyuda + ' ', h('a', { href: 'perfil.html', text: F.completarPerfil }))),
      grupo(F.reqCumplis, de('cumple'), 'i-tilde'));
    return seccion(F.requisitos, partes, plegada, 'requisitos');
  }
  // "Cómo se calcula" (siempre plegado): las cuatro partes con sus puntos, la suma, el tope si lo hubo y qué es el match.
  // Los máximos los trae la evaluación (matches.evaluacion.maximos): la web no copia la rúbrica del motor.
  function seccionCalculo(a, ev) {
    const F = T.avisos.ficha;
    const p = ev.puntos || {};
    const max = ev.maximos || {};
    if (a.match === null || a.match === undefined) return null;
    const hab = ev.habilidades || {};
    const filas = [
      ['funcion', F.calculoFuncion[ev.funcion]],
      ['nivel', F.calculoNivel[ev.nivel]],
      ['habilidades', F.calculoHabilidades(Number(hab.tiene) || 0, Number(hab.pedidas) || 0)],
      ['requisitos', F.calculoRequisitos(ev.conteo || {})],
    ].filter(([, texto]) => texto);
    const dl = h('dl', { class: 'calculo' }, filas.map(([k, texto]) => {
      const tiene = Number.isFinite(Number(p[k]));
      const conMax = tiene && Number.isFinite(Number(max[k]));
      return h('div', null, h('dt', { text: texto }),
        h('dd', { class: 'num' }, tiene ? h('span', { 'aria-hidden': 'true', text: conMax ? F.puntosDe(p[k], max[k]) : String(p[k]) }) : null,
          tiene ? oculto(conMax ? F.puntosAccesible(p[k], max[k]) : String(p[k])) : null));
    }));
    const contenido = [dl];
    if (Number.isFinite(Number(ev.suma))) contenido.push(h('p', { class: 'num', text: F.calculoSuma(ev.suma) }));
    if (ev.tope && F.topes[ev.tope.motivo] && Number.isFinite(Number(ev.tope.valor))) contenido.push(h('p', { class: 'num', text: F.calculoTope(ev.tope.valor, F.topes[ev.tope.motivo]) }));
    contenido.push(h('p', { class: 'suave', text: F.calculoMatch(a.match) }));
    return seccion(F.calculo, contenido, true, 'calculo-cuerpo');
  }

  /* ---------- Por qué no te interesa (brand.md 0.4.19 §6.4; datos.md 0.20, marcar_motivo_no_interesa) ----------
     Opcional, después de "No me interesa": un diálogo con los siete motivos. Lo cuenta `python -m terna calibracion`, sin
     datos de nadie, para medir si el match acierta. `alGuardar(motivo)` corre después de guardar. */
  const MOTIVOS = ['otra_funcion', 'sobra_nivel', 'falta_nivel', 'requisitos', 'condiciones', 'empresa', 'otro'];
  function pedirMotivo(a, alGuardar) {
    const M = T.avisos.motivo;
    const origen = document.activeElement;
    const nombre = Terna.idUnico('motivo');
    const idAyuda = Terna.idUnico('ayuda');
    const err = h('p', { class: 'campo-error', role: 'alert' });
    const opciones = h('div', { class: 'opciones' }, MOTIVOS.map((m) => h('label', { class: 'casilla' },
      h('input', { type: 'radio', name: nombre, value: m, checked: a.motivo_no_interesa === m }), h('span', { text: M.opciones[m] }))));
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button' }, T.comun.guardar);
    const bCancelar = h('button', { class: 'btn', type: 'button' }, T.comun.cancelar);
    const grupo = h('fieldset', { class: 'campo', 'aria-describedby': idAyuda }, opciones);
    const dlg = Terna.dialogo({ titulo: M.titulo, cuerpo: [h('p', { class: 'campo-ayuda', id: idAyuda, text: M.ayuda }), grupo, err], botones: [bCancelar, bGuardar], clase: 'dialogo-motivo' });
    grupo.setAttribute('aria-labelledby', dlg.getAttribute('aria-labelledby'));
    let guardado = null;
    bCancelar.addEventListener('click', () => dlg.close());
    bGuardar.addEventListener('click', async () => {
      const elegido = opciones.querySelector('input:checked');
      if (!elegido) { err.textContent = M.elegi; opciones.querySelector('input').focus(); return; }
      bGuardar.setAttribute('aria-disabled', 'true');
      const { error } = await Terna.sb.rpc('marcar_motivo_no_interesa', { p_match_id: a.match_id, p_motivo: elegido.value });
      bGuardar.removeAttribute('aria-disabled');
      if (error) { if (!Terna.siSesionVencida(error)) err.textContent = Terna.textoError(error); return; }
      a.motivo_no_interesa = elegido.value;
      guardado = elegido.value;
      dlg.close();
    });
    dlg.addEventListener('close', () => {
      if (guardado && alGuardar) alGuardar(guardado);
      // El foco vuelve a lo que abrió el diálogo; si ya no está (la ficha se rehízo, o era el aviso breve), al motivo de la
      // ficha abierta, o al contenido.
      const destino = origen && origen !== document.body && origen.isConnected ? origen : document.querySelector('[data-control="motivo"]');
      Terna.devolverFoco(destino);
      if (guardado) Terna.avisoBreve(T.comun.guardado);
    });
    dlg.showModal();
    (opciones.querySelector('input:checked') || opciones.querySelector('input')).focus();
  }
  // En la ficha de un aviso que no te interesa: el motivo, con "Cambiar", o "Decir por qué no te interesa".
  function lineaMotivo(a, alGuardar) {
    const M = T.avisos.motivo;
    const abrir = () => pedirMotivo(a, alGuardar);
    if (a.motivo_no_interesa && M.opciones[a.motivo_no_interesa]) {
      return h('p', { class: 'motivo-linea' }, h('span', { text: M.linea(M.opciones[a.motivo_no_interesa]) + ' ' }),
        h('button', { class: 'btn btn-texto btn-chico', type: 'button', dataset: { control: 'motivo' }, onclick: abrir }, M.cambiar));
    }
    return h('p', { class: 'motivo-linea' }, h('button', { class: 'btn btn-texto btn-chico', type: 'button', dataset: { control: 'motivo' }, onclick: abrir }, M.decirLargo));
  }
  /* ---------- Confirmaciones (brand.md 0.8 §6.4 y §8; diseno.md 0.21 §10.8) ----------
     Francisco, 06/11/2026: "es importante que cuando apretás cualquiera de esos te pida confirmación" (Pedir paquete y No me
     interesa). Cada diálogo nombra el aviso y dice qué va a pasar; el foco arranca en Cancelar. Después sigue el aviso breve con
     Deshacer, como siempre. */
  const ATS_POSTULABLES = ['greenhouse', 'lever', 'ashby', 'workable'];
  // Terna puede postular sola en este aviso: formulario abierto de uno de los cuatro ATS (la misma regla que seleccion.postulable).
  function postulable(a) { return a.postulacion === 'formulario' && ATS_POSTULABLES.includes(a.ats_formulario); }

  /* ---------- Dónde se postula (brand.md 0.10 §6.4; diseno.md 0.23 §7.5 y §7.6; datos.md 0.27, 0031) ----------
     Francisco, 06/11/2026: "que diga Easy Apply de LinkedIn, o una columna nueva que diga dónde se debe aplicar". Sale de lo que la
     vista ya traía (postulacion, ats_formulario, url, url_postulacion, fuente) y, desde 0031, de linkedin_postulacion: lo que dice la
     página pública del aviso de LinkedIn. Cinco respuestas: Postula Terna (un formulario de los cuatro ATS), y a mano: Easy Apply de
     LinkedIn, el sitio de la empresa (otro formulario, con o sin cuenta) o un portal de empleo (con la cuenta de la persona); y
     LinkedIn, a confirmar, mientras Terna no leyó la página del aviso. */
  const DONDES = ['terna', 'easy_apply', 'empresa', 'portal', 'confirmar'];
  const PORTALES = [['linkedin.com', 'LinkedIn'], ['lnkd.in', 'LinkedIn'], ['indeed.com', 'Indeed'], ['indeed.com.ar', 'Indeed'], ['bumeran.com.ar', 'Bumeran'],
    ['bumeran.com', 'Bumeran'], ['zonajobs.com.ar', 'Zonajobs'], ['zonajobs.com', 'Zonajobs'], ['computrabajo.com', 'Computrabajo'],
    ['computrabajo.com.ar', 'Computrabajo'], ['getonbrd.com', 'Get on Board'], ['glassdoor.com', 'Glassdoor'], ['glassdoor.com.ar', 'Glassdoor']];
  const FUENTES_PORTAL = new Set([...DE_ALERTAS, 'Get on Board']);
  function hostDe(u) {
    try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function portalDe(u) {
    const host = hostDe(u);
    const p = PORTALES.find(([dominio]) => host === dominio || host.endsWith('.' + dominio));
    return p ? p[1] : null;
  }
  // Lo que ya está postulado: la tarjeta y la ficha no dicen dónde (lo dice la etapa) y la celda de la tabla lo dice apagado.
  const HECHAS = new Set(['enviada', 'postulado', 'entrevista']);
  // { clave, nombre (del portal), url (adónde se postula, si no es la página del aviso), cuenta (el sitio pide cuenta),
  //   viaLinkedin, ternaNo / ternaNoPudo (Terna sabe completarlo pero lo hace la persona), hecha }.
  // Revisión de usuaria del 06/11/2026 (diseno.md 0.23 §1.35): "Terna puede postular" al lado de "Para postular a mano" se
  // contradecía; con "Terna postula por vos" en No o con la postulación a mano, el formulario de Terna lo completa la persona.
  function donde(a, prefs) {
    const u = a.url_postulacion;
    const otro = !!u && !!hostDe(u) && hostDe(u) !== hostDe(a.url);
    const hecha = HECHAS.has(a.estado_postulacion);
    if (postulable(a)) {
      const no = !!prefs && prefs.postular_sola === false;
      if (!hecha && (no || a.estado_postulacion === 'a_mano')) return { clave: 'empresa', url: otro ? u : null, ternaNo: no, ternaNoPudo: !no, hecha };
      return { clave: 'terna', url: otro ? u : null, hecha };
    }
    if (a.linkedin_postulacion === 'easy_apply') return { clave: 'easy_apply', url: null, hecha };
    if (otro) {
      const p = portalDe(u);
      return p ? { clave: 'portal', nombre: p, url: u, hecha } : { clave: 'empresa', url: u, cuenta: a.postulacion === 'requiere_cuenta', hecha };
    }
    if (a.linkedin_postulacion === 'externa') return { clave: 'empresa', url: null, viaLinkedin: true, hecha };
    // LinkedIn sin leer: Terna lee su página en las próximas corridas. Sin 0031 no se sabe; si el texto vino de la página, ya se leyó.
    if (a.fuente === 'LinkedIn' && !a.linkedin_postulacion && a.texto_origen !== 'fuente') return { clave: 'confirmar', url: null, hecha };
    if (FUENTES_PORTAL.has(a.fuente)) return { clave: 'portal', nombre: a.fuente, url: null, hecha };
    return { clave: 'empresa', url: null, cuenta: a.postulacion === 'requiere_cuenta', hecha };
  }
  function textoDonde(d) {
    const D = T.avisos.donde;
    if (d.clave === 'portal') return D.portal(d.nombre);
    return d.clave === 'empresa' && d.cuenta ? D.empresaCuenta : D[d.clave];
  }
  // La explicación de la ficha y del título de la celda: quién lo hace, dónde y, si es a mano, por qué.
  function explicacionDonde(a, d, prefs) {
    const E = T.avisos.dondeExplicacion;
    switch (d.clave) {
      case 'terna': return prefs && prefs.revisar_antes_de_enviar ? E.ternaRevisa : E.terna;
      case 'easy_apply': return E.easy_apply;
      case 'confirmar': return E.confirmar(!a.tiene_texto);
      case 'portal': return d.nombre === 'LinkedIn' && !d.url ? E.linkedin : E.portal(d.nombre);
      default:
        if (d.ternaNo) return E.ternaNo;
        if (d.ternaNoPudo) return E.ternaNoPudo;
        if (d.viaLinkedin) return E.empresaViaLinkedin;
        return d.cuenta ? E.empresaCuenta : E.empresa;
    }
  }
  // Ícono: el avión de "Enviada por Terna" si postula Terna, el lápiz de "Para postular a mano" si lo hacés vos, la pregunta si
  // falta saberlo. El tono lo pone el CSS: lo de Terna y lo hecho, apagados; lo que te toca, en tinta.
  const ICONO_DONDE = { terna: 'i-enviada', easy_apply: 'i-a-mano', empresa: 'i-a-mano', portal: 'i-a-mano', confirmar: 'i-preguntar' };
  function etiquetaDonde(d, clase) {
    return h('span', { class: 'donde donde-' + d.clave + (d.hecha ? ' donde-hecha' : '') + (clase ? ' ' + clase : '') },
      icono(ICONO_DONDE[d.clave], 'icono-16'), h('span', { text: textoDonde(d) }));
  }
  // La celda de la tabla de Avisos: las palabras cortas y, en el título, la explicación.
  function celdaDonde(a, prefs) {
    const d = donde(a, prefs);
    const cont = etiquetaDonde(d);
    cont.title = explicacionDonde(a, d, prefs);
    return cont;
  }
  // La línea propia de la tarjeta del celular, debajo de los atributos; nada si ya está postulado.
  function lineaDonde(a, prefs) {
    const d = donde(a, prefs);
    return d.hecha ? null : etiquetaDonde(d, 'donde-linea');
  }
  const lineaAviso = (a) => h('p', { class: 'dialogo-aviso', text: a.puesto + (a.empresa ? ' · ' + a.empresa : '') });

  // Pedir paquete: en qué lugar de los próximos paquetes queda y cuándo se arma; si después Terna postula, también. true o false.
  function confirmarPedir(a, { lugar, corridas, cupo, prefs }) {
    const C = T.avisos.confirmarPedir;
    const sola = !prefs || prefs.postular_sola !== false;
    const postula = sola && postulable(a) ? (prefs && prefs.revisar_antes_de_enviar ? C.revisa : C.postula) : null;
    return Terna.confirmar({ titulo: C.titulo, si: C.si, clase: 'dialogo-confirmar',
      cuerpo: [lineaAviso(a), h('p', { text: C.lugar(lugar, corridas, cupo) }), h('p', { class: 'suave', text: C.regla(cupo) }), postula ? h('p', { text: postula }) : null] });
  }

  // No me interesa: qué deja de hacer Terna, qué se cancela y cuándo se borra; con 0025, el motivo opcional en el mismo diálogo
  // (hasta brand.md 0.7 se pedía después, con "Decir por qué" en el aviso breve). Devuelve { si, motivo }.
  async function confirmarNoInteresa(a, { config, conMotivo }) {
    const C = T.avisos.confirmarNoInteresa;
    const M = T.avisos.motivo;
    const dias = (config && config.retencion_no_interesa_dias) || 30;
    const e = a.estado_postulacion;
    const conDocs = !!a.paquete_id || (!!e && e !== 'pendiente');
    const cuerpo = [lineaAviso(a), h('p', { text: conDocs ? C.conDocs(dias) : C.texto(dias) })];
    if (a.estado_paquete === 'pedido') cuerpo.push(h('p', { text: C.pedido }));
    if (e === 'en_cola' || e === 'para_revisar') cuerpo.push(h('p', { text: C[e] }));
    if (e === 'enviada' || e === 'postulado' || e === 'entrevista') cuerpo.push(h('p', { text: C.enviada }));
    let opciones = null;
    if (conMotivo) {
      const nombre = Terna.idUnico('motivo');
      opciones = h('div', { class: 'opciones' }, MOTIVOS.map((m) => h('label', { class: 'casilla' },
        h('input', { type: 'radio', name: nombre, value: m, checked: a.motivo_no_interesa === m }), h('span', { text: M.opciones[m] }))));
      cuerpo.push(h('fieldset', { class: 'campo motivo-opcional' }, h('legend', { class: 'campo-etiqueta', text: C.motivo }), opciones));
    }
    const si = await Terna.confirmar({ titulo: C.titulo, si: C.si, cuerpo, clase: 'dialogo-confirmar' });
    const elegido = si && opciones ? opciones.querySelector('input:checked') : null;
    return { si, motivo: elegido ? elegido.value : null };
  }
  // Marca No me interesa y, si se eligió, el motivo (la base pide primero el interés: motivo_sin_no_interesa). Devuelve el error.
  async function marcarNoInteresa(a, motivo) {
    const r = await Terna.sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: 'no_me_interesa' });
    if (r.error) return r.error;
    if (motivo) {
      const r2 = await Terna.sb.rpc('marcar_motivo_no_interesa', { p_match_id: a.match_id, p_motivo: motivo });
      if (!r2.error) a.motivo_no_interesa = motivo;
    }
    return null;
  }

  // El botón de la ficha va adonde se postula: el sitio de la empresa o el portal cuando el aviso lleva ahí (diseno.md 0.23 §7.5);
  // si no, a la página del aviso. `verAviso` es el link a la página del aviso cuando el botón va a otro lado. Las dos URL son
  // datos que salen de Terna: solo http y https (Terna.urlExterna; informe de seguridad del 06/11/2026, H8). Si la del
  // formulario no sirve, el botón va a la página del aviso, como cuando no hay.
  function abrirAviso(a, clase, prefs) {
    const d = donde(a, prefs);
    const destino = Terna.urlExterna(d.url);
    const clases = clase || 'btn btn-primario btn-ancho';
    if (destino && d.clave === 'empresa') {
      return h('a', { class: clases, href: destino, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnEmpresaAccesible },
        T.avisos.abrirEnEmpresa, icono('i-abrir'));
    }
    if (destino && d.clave === 'portal') {
      return h('a', { class: clases, href: destino, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(d.nombre) },
        T.avisos.abrirEn(d.nombre), icono('i-abrir'));
    }
    return h('a', { class: clases, href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer',
      'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, T.avisos.abrirEn(a.fuente), icono('i-abrir'));
  }
  function verAviso(a, prefs) {
    const d = donde(a, prefs);
    if (!Terna.urlExterna(d.url) || (d.clave !== 'empresa' && d.clave !== 'portal')) return null;
    return h('a', { class: 'btn btn-texto', href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) },
      T.avisos.verEnFuente(a.fuente), icono('i-abrir', 'icono-16'));
  }

  /* ---------- Leer mis_avisos con las columnas de 0025 y 0031, o sin ellas ----------
     Mientras el proyecto no tenga una migración, pedir sus columnas da 42703 (la columna no existe): se vuelve a pedir sin las de
     la última (0031: `linkedin_postulacion`) y, si tampoco, sin las de 0025 (`evaluacion`, `motivo_no_interesa`), y la página anda
     con lo que haya: sin Easy Apply, sin veredicto ni motivo. `armar(columnas)` devuelve la consulta. */
  const COLUMNAS_0025 = 'evaluacion, motivo_no_interesa';
  const COLUMNAS_0031 = 'linkedin_postulacion';
  function faltaColumna(error) {
    const texto = String((error && (error.message || '')) || '') + ' ' + String((error && error.details) || '');
    return Boolean(error) && (error.code === '42703' || error.code === 'PGRST204' || /does not exist|Could not find/i.test(texto));
  }
  async function leerConEvaluacion(armar, columnas) {
    const intentos = [columnas + ', ' + COLUMNAS_0025 + ', ' + COLUMNAS_0031, columnas + ', ' + COLUMNAS_0025, columnas];
    for (let i = 0; i < intentos.length; i++) {
      const r = await armar(intentos[i]);
      if (!r.error) return { data: r.data, error: null, conEvaluacion: i < 2, conDonde: i === 0 };
      if (!faltaColumna(r.error) || i === intentos.length - 1) return { data: null, error: r.error, conEvaluacion: false, conDonde: false };
    }
    return { data: null, error: null, conEvaluacion: false, conDonde: false };
  }

  return {
    estadoPaquete, llega, chip, chipPaquete, chipPostulacion, chipInteres, chipFaltan, fecha, etiquetas,
    evaluacion, chipCalificacion, pedirMotivo, lineaMotivo, MOTIVOS, leerConEvaluacion,
    MODALIDADES, ALCANCES, NIVELES, JORNADAS, TODOS_BUSQUEDA, busquedaDe, pasaBusqueda, motivosFuera,
    criterio, tuPuesto, tuEmpresa, sugerida, bajoUmbral,
    lugar, atributos, bloqueMatch, controlInteres, fichasPaquete, parsearNotas, textoSalario,
    recorrido, recorridoGrande, traba, lineaEtapa, claseEtapa, puedeVolverAProbar, seccionPostulacion, razones, abrirAviso, verAviso,
    ESTILO_POSTULACION, postulable, confirmarPedir, confirmarNoInteresa, marcarNoInteresa,
    DONDES, donde, textoDonde, explicacionDonde, celdaDonde, etiquetaDonde, lineaDonde,
  };
})();
