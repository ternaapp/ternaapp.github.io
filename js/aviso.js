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
  // que está en marcha y lo hecho siguen su curso (pipeline.md 0.3.14 §4.9 y §4.12).
  function motivosFuera(a, b) {
    if (a.pedido_en || (a.estado_postulacion && a.estado_postulacion !== 'pendiente')) return [];
    const m = [];
    if (a.modalidad && !b.modalidad.includes(a.modalidad)) m.push(T.avisos.modalidadMin[a.modalidad]);
    if (!b.alcance.includes(alcanceDe(a))) m.push(T.avisos.alcanceMin[alcanceDe(a)]);
    if (a.nivel && !b.nivel.includes(a.nivel)) m.push(T.avisos.nivelMin[a.nivel]);
    if (a.jornada && !b.jornada.includes(a.jornada)) m.push(T.avisos.jornadaMin[a.jornada]);
    return m;
  }

  /* ---------- Atributos, match ---------- */
  function lugar(a) { return a.alcance === 'exterior' ? T.avisos.alcanceMin.exterior : (a.ubicacion || T.avisos.alcanceMin.local); }
  function atributos(a, opciones) {
    opciones = opciones || {};
    const partes = [[a.alcance === 'exterior' ? 'i-exterior' : 'i-local', lugar(a)]];
    if (a.modalidad) partes.push(['i-' + a.modalidad, T.avisos.modalidadMin[a.modalidad]]);
    if (opciones.fuente || a.fuente === 'LinkedIn') partes.push([null, a.fuente]);
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
      h('p', { class: 'suave', text: T.avisos.ficha.idiomaDocs(idiomaTxt) }));
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
  // La sección "Postulación" de la ficha del aviso: chip, línea y el link a la ficha de la postulación.
  function seccionPostulacion(a, config) {
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: T.avisos.ficha.postulacion }));
    const hay = a.estado_postulacion !== 'pendiente' || a.paquete_id;
    if (!hay) { sec.append(h('p', { class: 'suave', text: T.avisos.postulacion.pendiente })); return sec; }
    sec.append(h('div', { class: 'chips' }, chipPostulacion(a)));
    const linea = lineaEtapa(a, config);
    if (linea) sec.append(h('p', { text: linea }));
    if (a.estado_postulacion === 'a_mano') sec.append(h('p', { text: T.postulaciones.linea.todoListo }));
    sec.append(h('p', null, h('a', { href: 'postulaciones.html#postulacion-' + a.match_id, text: T.avisos.ficha.verEnPostulaciones })));
    return sec;
  }
  function razones(a, plegadas) {
    const lista = [];
    if ((a.razones || []).length) {
      lista.push(seccionLista(T.avisos.ficha.porQue, a.razones, 'i-tilde', plegadas));
    }
    const faltan = a.requisitos_faltantes || [];
    if (faltan.length) {
      const noFigura = faltan.some((r) => /\(no figura en tu perfil\)\s*$/.test(r));
      lista.push(seccionLista(noFigura ? T.avisos.ficha.noCumplisONoFigura : T.avisos.ficha.noCumplis, faltan, 'i-alerta', plegadas));
    }
    return lista;
  }
  function seccionLista(titulo, items, iconoId, plegada) {
    const ul = h('ul', { class: 'lista-iconos' }, items.map((t) => h('li', null, icono(iconoId, iconoId === 'i-tilde' ? 'i-tilde' : ''), h('span', { text: t }))));
    if (!plegada) return h('section', { class: 'ficha-seccion' }, h('h3', { text: titulo }), ul);
    const id = Terna.idUnico('pleg');
    ul.id = id;
    ul.hidden = true;
    const boton = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': 'false', 'aria-controls': id,
      onclick: () => { const abrir = boton.getAttribute('aria-expanded') !== 'true'; boton.setAttribute('aria-expanded', String(abrir)); ul.hidden = !abrir; } },
    h('span', { text: titulo }), icono('i-chevron'));
    return h('section', { class: 'ficha-seccion' }, boton, ul);
  }
  function abrirAviso(a, clase) {
    return h('a', { class: clase || 'btn btn-primario btn-ancho', href: a.url, target: '_blank', rel: 'noopener noreferrer',
      'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, T.avisos.abrirEn(a.fuente), icono('i-abrir'));
  }

  return {
    estadoPaquete, llega, chip, chipPaquete, chipPostulacion, chipInteres, chipFaltan, fecha, etiquetas,
    MODALIDADES, ALCANCES, NIVELES, JORNADAS, TODOS_BUSQUEDA, busquedaDe, pasaBusqueda, motivosFuera,
    lugar, atributos, bloqueMatch, controlInteres, fichasPaquete, parsearNotas, textoSalario,
    recorrido, recorridoGrande, traba, lineaEtapa, claseEtapa, puedeVolverAProbar, seccionPostulacion, razones, abrirAviso,
    ESTILO_POSTULACION,
  };
})();
