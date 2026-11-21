/* Terna · js/aviso.js
   Las piezas de un aviso que comparten Avisos y Postulaciones (diseno.md §7.3 a §7.5, §8.3 a §8.5, §10.2,
   §10.12 y §10.13): chips, atributos, match, etiquetas, control de interés, paquete con sus cuatro fichas y sus dos
   desplegables (notas y "Ver por qué"), recorrido de cuatro tramos y la línea de cada etapa.
   Desde el rediseño B2 «Sello» (opciones-v3/PLAN-WEB.md §2.5 a §2.9), también la carpeta: la lengüeta con el match, el marbete
   con el estado, «nuevo», la fecha sola, la cabecera de la ficha y sus saltos. Las funciones de antes siguen, con la misma firma.
   Desde PLAN-UX §8, P0.4 (21/11/2026), también las pestañas de dos renglones, el título de grupo con su cuenta, el interés en sus
   dos formas y la fila de documentos de una carpeta (al final del archivo). */
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
  // Los cuatro estados (PLAN-WEB.md §2.7): te toca (chip-toca), espera (chip-espera, con el reloj), resuelta (chip-resuelta) y
  // falló (chip-error). «Armado» es un dato del paquete (chip-listo, con el tilde); «Sin armar», un dato sin estado (chip-suave).
  const ESTILO_PAQUETE = {
    armado: ['chip-listo', 'i-tilde'], sin_armar: ['chip-suave', 'i-sin-armar'], pedido: ['chip-espera', 'i-pedido'],
    no_se_pudo_armar: ['chip-error', 'i-alerta'], sin_texto: ['chip-espera', 'i-sin-texto'], por_puntuar: ['chip-espera', 'i-pedido'],
  };
  // «Postulada a mano» lleva el tilde: el avión queda para lo que manda Terna.
  const ESTILO_POSTULACION = {
    en_cola: ['chip-espera', 'i-pedido'], para_revisar: ['chip-toca', 'i-revisar'],
    enviada: ['chip-resuelta', 'i-enviada'], a_mano: ['chip-toca', 'i-a-mano'],
    postulado: ['chip-resuelta', 'i-tilde'],
  };
  // El estado que sube al marbete de una carpeta: el de la postulación (lo del paquete va en la línea suelta).
  const MARBETE = { a_mano: 'toca', para_revisar: 'toca', en_cola: 'espera', enviada: 'resuelta', postulado: 'resuelta' };
  function llega(a, umbral) { return a.match !== null && a.match !== undefined && a.match >= umbral; }

  /* ---------- Chips y etiquetas ---------- */
  function chip(clase, iconoId, texto, explicacion) {
    return h('span', { class: 'chip' + (clase ? ' ' + clase : ''), title: explicacion || null },
      icono(iconoId, 'icono-14'), h('span', { text: texto }), explicacion ? oculto(': ' + explicacion) : null);
  }
  // "Sin texto" dice quién lo busca (brand.md 0.23 §6.10; datos.md 0.34, 0038): Terna o, si Terna ya no lo espera, Francisco.
  function chipPaquete(a) {
    const e = estadoPaquete(a);
    const [c, i] = ESTILO_PAQUETE[e] || ESTILO_PAQUETE.sin_armar;
    return chip(c, i, T.avisos.paquete[e], e === 'sin_texto' && a.texto_estado === 'admin' ? T.chips.sin_texto_admin : T.chips[e]);
  }
  function chipPostulacion(a) {
    const e = a.estado_postulacion;
    if (!ESTILO_POSTULACION[e]) return h('span', { class: 'chip-texto', title: T.chips.pendiente, text: T.avisos.postulacion.pendiente });
    const [c, i] = ESTILO_POSTULACION[e];
    return chip(c, i, T.avisos.postulacion[e], T.chips[e]);
  }
  function chipInteres(a, config) {
    if (a.interes === 'por_decidir') return chip('chip-toca', 'i-por-decidir', T.avisos.interes.por_decidir, T.chips.por_decidir);
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
  // El veredicto como valor del filtro Requisitos de Avisos (desde diseno.md 0.32 §7.2), con la regla del de Postulaciones
  // (diseno.md 0.21 §8.1; `postulaciones.js` tiene su copia): el de match.v2 o, en un match de antes, "falta" si tenía
  // faltantes; sin evaluación ni faltantes (un match de antes que cumplía todo, un aviso sin texto o por puntuar), "sin_dato",
  // que el filtro llama "Sin veredicto".
  const REQUISITOS = ['cumple', 'a_confirmar', 'falta', 'sobra_nivel', 'falta_nivel', 'sin_dato'];
  function categoriaRequisitos(a) {
    const ev = evaluacion(a);
    if (ev) return ev.calificacion;
    return (a.requisitos_faltantes || []).length ? 'falta' : 'sin_dato';
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
  // después de armarse (subiste el umbral o un repuntaje la bajó): Inicio no la cuenta y Postulaciones la muestra solo sin
  // "Tu umbral", desde el piso (diseno.md 0.33 §1.41; hasta 0.32, en la etapa "Bajo tu umbral").
  function sugerida(a, c) {
    return !!a.pedido_en || a.match === null || a.match === undefined || a.match >= c.umbral || !!tuPuesto(a, c);
  }

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
    // Cada parte, con su ícono, va en su .atributo: así el ícono no se separa de su texto al partir el renglón. Los puntos medios
    // quedan en el texto (el banco lo lee) y el CSS los cambia por aire.
    const nodo = h(opciones.tag || 'span', { class: 'atributos' });
    partes.forEach(([ic, tx], i) => {
      if (i) nodo.append(h('span', { 'aria-hidden': 'true', text: '·' }), oculto(', '));
      nodo.append(h('span', { class: 'atributo' }, ic ? icono(ic, 'icono-16') : null, h('span', { text: tx })));
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
  // Notas y Salario despliegan su texto debajo, uno a la vez, y arrancan cerrados (decisión 9 del chat 8). Desde brand.md 0.21, con
  // `notasAbiertas`, las notas arrancan abiertas: la ficha de una postulada, que es adonde se vuelve para preparar la entrevista.
  function fichasPaquete(a, opciones) {
    const idioma = a.paquete_idioma === 'en' ? 'en' : 'es';
    const idiomaTxt = T.avisos.ficha.idiomas[idioma];
    const idNotas = Terna.idUnico('notas');
    const idSalario = Terna.idUnico('salario');
    const cv = Terna.linkFirmado(a.cv_path, Terna.nombreDescarga('cv', idioma),
      h('a', { class: 'ficha-doc' }, icono('i-cv'), h('strong', { text: T.avisos.ficha.cv }), h('span', { text: T.avisos.ficha.pdfIdioma(idiomaTxt) }), icono('i-descargar', 'ficha-doc-fin')));
    const carta = Terna.linkFirmado(a.carta_path, Terna.nombreDescarga('carta', idioma),
      h('a', { class: 'ficha-doc' }, icono('i-sobre'), h('strong', { text: T.avisos.ficha.carta }), h('span', { text: T.avisos.ficha.pdfIdioma(idiomaTxt) }), icono('i-descargar', 'ficha-doc-fin')));
    const sinMonto = a.salario_monto === null || a.salario_monto === undefined;
    const tituloSalario = sinMonto ? T.avisos.ficha.sinDatos : T.avisos.ficha.salarioCorto(Terna.numero(Number(a.salario_monto)), a.salario_moneda);
    const subSalario = sinMonto ? T.avisos.ficha.verPorQue
      : (a.salario_periodo === 'anual' ? T.avisos.ficha.porAnio : T.avisos.ficha.porMes) + ' · ' + T.avisos.ficha.verPorQue;
    const bNotas = h('button', { class: 'ficha-doc', type: 'button', 'aria-expanded': 'false', 'aria-controls': idNotas },
      icono('i-notas'), h('strong', { text: T.avisos.ficha.notas }), h('span', { text: T.avisos.ficha.notasSub }), icono('i-chevron', 'ficha-doc-fin'));
    const bSalario = h('button', { class: 'ficha-doc', type: 'button', 'aria-expanded': 'false', 'aria-controls': idSalario },
      icono('i-salario'), oculto(textoSalario(a) + '. '), h('strong', { class: 'num', 'aria-hidden': 'true', text: tituloSalario }), h('span', { text: subSalario }), icono('i-chevron', 'ficha-doc-fin'));
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
    if (opciones && opciones.notasAbiertas && a.notas) { bNotas.setAttribute('aria-expanded', 'true'); pNotas.hidden = false; }
    return h('div', { class: 'ficha-seccion' },
      h('div', { class: 'fichas-paquete' }, cv, carta, a.notas ? bNotas : null, bSalario),
      pNotas, pSalario,
      h('p', { class: 'suave', text: T.avisos.ficha.idiomaDocs(idiomaTxt) }),
      palabrasFaltantes(a));
  }

  /* ---------- Recorrido (§10.13) ----------
     Desde diseno.md 0.33, cuatro puntos (Encontrado, Me interesa, Paquete, Enviada o Postulada), sin Entrevista, y solo en la ficha. */
  function puntos(a) {
    const e = a.estado_postulacion;
    const p = [
      'punto-tinta',
      a.interes === 'me_interesa' ? 'punto-tinta' : '',
      a.paquete_id ? 'punto-accion' : (a.estado_paquete === 'pedido' ? 'punto-espera' : ''),
      (e === 'enviada' || e === 'postulado') ? 'punto-azul'
        : (e === 'en_cola' || e === 'para_revisar') ? 'punto-espera' : (e === 'a_mano' ? 'punto-mano' : ''),
    ];
    const lleno = (c) => c === 'punto-tinta' || c === 'punto-accion' || c === 'punto-azul';
    const tramos = [0, 1, 2].map((i) => (lleno(p[i]) && lleno(p[i + 1]) ? ({ 'punto-tinta': 'tramo-tinta', 'punto-accion': 'tramo-accion', 'punto-azul': 'tramo-azul' })[p[i]] || '' : ''));
    return { p, tramos };
  }
  /* ---------- Etapa y su línea (brand.md §6.5) ---------- */
  function traba(a, config) {
    const M = T.postulaciones.trabas;
    if (a.motivo_a_mano === 'elegido_por_usuario') return M.elegido_por_usuario;
    if (a.traba_detalle) return a.traba_detalle;
    const m = M[a.motivo_a_mano] || M.error;
    if (typeof m !== 'function') return m;
    return a.motivo_a_mano === 'no_postulable' ? m(a.fuente) : m(Number(a.intentos) || (config && config.max_reintentos_postulacion) || 3);
  }
  function lineaEtapa(a, config) {
    const L = T.postulaciones.linea;
    switch (a.estado_postulacion) {
      case 'en_cola': return L.en_cola;
      case 'para_revisar': return L.para_revisar;
      case 'enviada': return L.enviada(Terna.fechaCorta(a.enviada_en), Terna.hora(a.enviada_en));
      case 'postulado': return L.postulado(Terna.fechaCorta(a.postulado_en));
      case 'a_mano': return traba(a, config);
      default: return a.paquete_id ? L.pendiente : '';
    }
  }
  // La línea corta, debajo del chip de la etapa en la tabla y en la fila de Postulaciones (brand.md 0.21 §6.5): la misma, sin el
  // nombre de la etapa adelante.
  function lineaCorta(a, config) {
    const L = T.postulaciones.lineaCorta;
    switch (a.estado_postulacion) {
      case 'en_cola': return L.en_cola;
      case 'para_revisar': return L.para_revisar;
      case 'enviada': return L.enviada(Terna.fechaCorta(a.enviada_en), Terna.hora(a.enviada_en));
      case 'postulado': return L.postulado(Terna.fechaCorta(a.postulado_en));
      case 'a_mano': return traba(a, config);
      default: return a.paquete_id ? L.pendiente : '';
    }
  }
  // Sin tope de intentos desde 0041 (datos.md 0.37; Francisco, 13/11/2026: «sacale el límite de 3 intentos»): `max_reintentos_postulacion`
  // en null. Si la base vuelve a tener un número, el tope rige otra vez, igual que en la base y en el motor.
  function topeIntentos(config) {
    const n = config ? config.max_reintentos_postulacion : null;
    return n === null || n === undefined ? null : Number(n);
  }
  // En todas las postulaciones a mano, no solo las de formulario (0043; Francisco, 16/11/2026: «quiero que todas tengan disponibles
  // el volver a probar»), menos Easy Apply de LinkedIn (0044; 18:02: «menos los "easy apply" de linkedin»). El motor vuelve a evaluar lo que entra en cola y deja a mano lo que sigue sin formulario conocido.
  function puedeVolverAProbar(a, config) {
    const tope = topeIntentos(config);
    return a.estado_postulacion === 'a_mano' && a.linkedin_postulacion !== 'easy_apply' && (tope === null || (a.intentos || 0) < tope);
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
  // Terna puede postular sola en este aviso: formulario abierto de uno de los cuatro ATS (la misma regla que seleccion.postulable),
  // o un aviso publicado en Terna, que no tiene formulario: la postulación le llega a quien lo publicó (contratar.md 0.1 §5; 0055).
  const deTerna = (a) => a.ats_formulario === 'terna';
  function postulable(a) { return a.postulacion === 'formulario' && (ATS_POSTULABLES.includes(a.ats_formulario) || deTerna(a)); }

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
      // Publicado en Terna: sin «Terna postula por vos» lo manda la persona desde la ficha, en Terna; el filtro lo cuenta a mano.
      if (deTerna(a)) return !hecha && (no || a.estado_postulacion === 'a_mano') ? { clave: 'empresa', enTerna: true, url: null, hecha } : { clave: 'terna', enTerna: true, url: null, hecha };
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
    if (d.enTerna && d.clave === 'empresa') return D.enTernaVos;
    return d.clave === 'empresa' && d.cuenta ? D.empresaCuenta : D[d.clave];
  }
  // La explicación de la ficha y del título de la celda: quién lo hace, dónde y, si es a mano, por qué.
  function explicacionDonde(a, d, prefs) {
    const E = T.avisos.dondeExplicacion;
    if (d.enTerna) return d.clave === 'empresa' ? E.enTernaVos : prefs && prefs.revisar_antes_de_enviar ? E.enTernaRevisa : E.enTerna;
    switch (d.clave) {
      case 'terna': return prefs && prefs.revisar_antes_de_enviar ? E.ternaRevisa : E.terna;
      case 'easy_apply': return E.easy_apply;
      case 'confirmar': return E.confirmar;
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
  // `extra`: renglones propios de quien lo pide (Búsqueda dice que el aviso todavía no tiene match y que pasa a tus avisos;
  // busqueda.md 0.1 §5).
  // `incompleto`: el perfil no está completo y Terna no corre; el primer renglón no promete una corrida (FEEDBACK-UX P2-3 c).
  function confirmarPedir(a, { lugar, corridas, cupo, prefs, extra, incompleto }) {
    const C = T.avisos.confirmarPedir;
    const sola = !prefs || prefs.postular_sola !== false;
    const postula = sola && postulable(a) ? (prefs && prefs.revisar_antes_de_enviar ? C.revisa : C.postula) : null;
    return Terna.confirmar({ titulo: C.titulo, si: C.si, clase: 'dialogo-confirmar',
      cuerpo: [lineaAviso(a), h('p', { text: incompleto ? C.lugarIncompleto(lugar) : C.lugar(lugar, corridas, cupo) }), ...(extra || []).map((x) => h('p', { text: x })),
        h('p', { class: 'suave', text: C.regla(cupo) }), postula ? h('p', { text: postula }) : null] });
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
    if (deTerna(a)) return botonTerna(a, clase);
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
    if (deTerna(a)) return null;
    const d = donde(a, prefs);
    if (!Terna.urlExterna(d.url) || (d.clave !== 'empresa' && d.clave !== 'portal')) return null;
    return h('a', { class: 'btn btn-texto', href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) },
      T.avisos.verEnFuente(a.fuente), icono('i-abrir', 'icono-16'));
  }

  /* ---------- Leer mis_avisos con las columnas de 0025, 0031 y 0038, o sin ellas ----------
     Mientras el proyecto no tenga una migración, pedir sus columnas da 42703 (la columna no existe): se vuelve a pedir sin las de
     la última (0038: `texto_estado`; 0031: `linkedin_postulacion`) y, si tampoco, sin las de 0025 (`evaluacion`,
     `motivo_no_interesa`), y la página anda con lo que haya: sin quién busca el texto (todo "Terna lo busca"), sin Easy Apply,
     sin veredicto ni motivo. `armar(columnas)` devuelve la consulta. */
  const COLUMNAS_0025 = 'evaluacion, motivo_no_interesa';
  const COLUMNAS_0031 = 'linkedin_postulacion';
  const COLUMNAS_0038 = 'texto_estado';
  function faltaColumna(error) {
    const texto = String((error && (error.message || '')) || '') + ' ' + String((error && error.details) || '');
    return Boolean(error) && (error.code === '42703' || error.code === 'PGRST204' || /does not exist|Could not find/i.test(texto));
  }
  // Desde brand.md 0.21 la web no tiene la etapa Entrevista ("Marcar entrevista" salió): una postulación que quedó marcada así se ve
  // como lo que es, postulada: por Terna si la envió, a mano si no. La base no cambia (datos.md §5.13): desde `entrevista` se puede
  // volver a pendiente, como desde `postulado`.
  function sinEntrevista(filas) {
    for (const a of filas || []) if (a.estado_postulacion === 'entrevista') a.estado_postulacion = a.enviada_en ? 'enviada' : 'postulado';
    return filas;
  }
  async function leerConEvaluacion(armar, columnas) {
    const intentos = [columnas + ', ' + COLUMNAS_0025 + ', ' + COLUMNAS_0031 + ', ' + COLUMNAS_0038, columnas + ', ' + COLUMNAS_0025 + ', ' + COLUMNAS_0031,
      columnas + ', ' + COLUMNAS_0025, columnas];
    for (let i = 0; i < intentos.length; i++) {
      const r = await armar(intentos[i]);
      if (!r.error) return { data: sinEntrevista(r.data), error: null, conEvaluacion: i < 3, conDonde: i < 2, conTextoEstado: i === 0 };
      if (!faltaColumna(r.error) || i === intentos.length - 1) return { data: null, error: r.error, conEvaluacion: false, conDonde: false, conTextoEstado: false };
    }
    return { data: null, error: null, conEvaluacion: false, conDonde: false, conTextoEstado: false };
  }

  /* ---------- La carpeta (PLAN-WEB.md §2.5 y §2.9) ----------
     La lengüeta es de Terna: lila siempre, con el match; es la puerta a «Por qué ajusta». El marbete lleva el estado de la
     postulación, con su ícono y su nombre; no es un botón. El número nunca va sobre un color de estado. */
  // opciones: alTocar (función: un button.lengueta[data-control=porque]), href (un a.lengueta), grande (la de la ficha), linea (la
  // columna de 44 px de una línea suelta: la misma pieza con la clase linea-match en vez de lengueta, sin fondo).
  // Sin alTocar ni href, un span (por ejemplo, adentro del botón de una fila de Postulaciones).
  function lengueta(a, umbral, opciones) {
    const o = opciones || {};
    const sinMatch = a.match === null || a.match === undefined;
    const ok = llega(a, umbral);
    const clase = (o.linea ? 'linea-match' : 'lengueta') + (ok ? '' : ' bajo') + (o.grande ? ' lengueta-grande' : '');
    const nombre = sinMatch ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, ok);
    const hijos = [
      h('span', { class: 'lengueta-numero', 'aria-hidden': 'true', text: sinMatch ? '—' : String(a.match) }),
      h('span', { class: 'lengueta-palabra', 'aria-hidden': 'true', text: T.avisos.matchPalabra }),
    ];
    if (o.alTocar) {
      return h('button', { class: clase, type: 'button', title: T.chips.match, dataset: { control: 'porque' }, onclick: o.alTocar },
        hijos, oculto(nombre + '. ' + T.avisos.ficha.verPorQue));
    }
    if (o.href) return h('a', { class: clase, href: o.href, title: T.chips.match }, hijos, oculto(nombre + '. ' + T.avisos.ficha.verPorQue));
    return h('span', { class: clase, title: T.chips.match }, hijos, oculto(nombre));
  }
  // { tipo: 'toca' | 'espera' | 'resuelta', icono, texto } o null (pendiente, o sin postulación).
  function estadoDe(a) {
    const e = a && a.estado_postulacion;
    if (!MARBETE[e] || !ESTILO_POSTULACION[e]) return null;
    return { tipo: MARBETE[e], icono: ESTILO_POSTULACION[e][1], texto: T.avisos.postulacion[e] };
  }
  // El marbete de la etapa, o null. `chip`: suma la clase chip (Postulaciones, por el banco). `explicacion`: suma el texto oculto
  // de T.chips, como chipPostulacion (no adentro de un botón, cuyo texto entero es su nombre).
  function marbete(a, opciones) {
    const e = estadoDe(a);
    if (!e) return null;
    const o = opciones || {};
    const explicacion = T.chips[a.estado_postulacion];
    return h('span', { class: 'marbete marbete-' + e.tipo + (o.chip ? ' chip' : ''), title: explicacion || null },
      icono(e.icono), h('span', { class: 'marbete-texto', text: e.texto }), o.explicacion && explicacion ? oculto(': ' + explicacion) : null);
  }
  // «nuevo», al lado del puesto: una marca de texto (no un .chip: el banco cuenta los chips de una tarjeta).
  function nuevo(a) { return a && a.nuevo ? h('b', { class: 'nuevo', text: T.avisos.nuevo }) : null; }
  // La fecha relativa, sin «nuevo».
  function fechaSola(a) { return h('span', { class: 'fecha', text: Terna.relativa(a.publicado_en || a.visto_en) }); }
  // La cabecera de una ficha (va en .hoja-cabecera): la ficha es una carpeta, con la lengüeta grande (un botón que baja a «Por qué
  // ajusta», con `alPorQue`) y el marbete. `sinLengueta`: un aviso que no está en tu lista (Búsqueda), el cuerpo solo.
  function cabezaFicha({ a, idTitulo, umbral, alPorQue, sinLengueta }) {
    const leng = sinLengueta ? null : lengueta(a, umbral, { grande: true, alTocar: alPorQue });
    const marb = sinLengueta ? null : marbete(a, { explicacion: true });
    return h('div', { class: 'ficha-cabecera ficha-carpeta' },
      leng || marb ? h('div', { class: 'carpeta-cabeza chips' }, leng, marb) : null,
      h('div', { class: 'carpeta-cuerpo' + (leng || marb ? '' : ' sola') },
        h('h2', { class: 'ficha-titulo', id: idTitulo, text: a.puesto }),
        a.empresa ? h('p', { class: 'ficha-empresa', text: a.empresa }) : null,
        atributos(a, { fuente: true, tag: 'p' })));
  }
  // Baja hasta una sección de la ficha (dentro de su hoja o su cajón) y le pasa el foco, sin moverla otra vez. En una hoja
  // (<dialog>) se desplaza solo .hoja-desplazable, hasta donde llega: con scrollIntoView, si la sección no llegaba arriba (el cuerpo
  // ya estaba al final) se corría también el <dialog>, que tiene overflow: hidden, y la cabecera, los saltos y la cruz quedaban
  // afuera. Respeta el scroll-margin-top de la sección (lo que mide la tira de saltos pegada). En el cajón en línea, como siempre.
  function bajarA(nodo) {
    if (!nodo) return;
    const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const caja = nodo.closest('dialog .hoja-desplazable');
    if (caja) {
      const margen = parseFloat(getComputedStyle(nodo).scrollMarginTop) || 0;
      const y = caja.scrollTop + nodo.getBoundingClientRect().top - caja.getBoundingClientRect().top - margen;
      caja.scrollTo({ top: Math.max(0, Math.round(y)), behavior: quieto ? 'auto' : 'smooth' });
    } else nodo.scrollIntoView({ block: 'start', behavior: quieto ? 'auto' : 'smooth' });
    if (!nodo.hasAttribute('tabindex')) nodo.setAttribute('tabindex', '-1');
    nodo.focus({ preventScroll: true });
  }
  // Los saltos de la ficha: una tira con un botón por sección ({ nodo, texto }), que baja hasta ella; todo queda a la vista. Son
  // botones y no links: el hash de la página es de la ficha (#aviso-…, #postulacion-…). Con menos de dos secciones, nada.
  function saltos(secciones) {
    const lista = (secciones || []).filter((x) => x && x.nodo && x.texto);
    if (lista.length < 2) return null;
    const botones = lista.map((x) => {
      if (!x.nodo.id) x.nodo.id = Terna.idUnico('seccion');
      const b = h('button', { class: 'separador', type: 'button', 'aria-controls': x.nodo.id, text: x.texto });
      b.addEventListener('click', () => {
        for (const o of botones) o.removeAttribute('aria-current');
        b.setAttribute('aria-current', 'true');
        bajarA(x.nodo);
      });
      return b;
    });
    return h('div', { class: 'separadores-lista', role: 'group', 'aria-label': T.comun.navegacion }, botones);
  }

  /* ---------- Las piezas comunes de PLAN-UX §8, P0.4 (21/11/2026) ----------
     Para Inicio (P1), Paquetes (P2), Empleos (P3) y Postulaciones (P4): las pestañas de dos renglones, el título de un grupo con su
     cuenta, el control de interés en sus dos formas y la fila de documentos de una carpeta. Sus estilos, en css/terna.css §11b. */

  // pestanas({ nombre, opciones, elegida, alCambiar }) → { nodo, elegir(valor), poner(valor, datos), radios }. Las pestañas de dos
  // renglones (el nombre arriba, el número abajo) para dos o tres opciones: un radiogroup de label.vista[data-vista] con su radio,
  // .vista-titulo y .vista-n, como las vistas de antes (el banco las lee). `nombre`: el del grupo, para el lector de pantalla.
  // `opciones`: [{ valor, texto, n, toca, punto, puntoTexto }]; `n`, el número (null: sin número); `toca`, el número en la pastilla
  // ámbar (lo que te toca); `punto`, un número ámbar chico en la esquina (por ejemplo, los «por decidir» dentro de Por armar) y
  // `puntoTexto`, lo que dice para el lector de pantalla (T.comun.porDecidirCuenta(n)). alCambiar(valor) corre al elegir otra; las
  // flechas del teclado van de una a otra, como en todo grupo de radios. `poner` cambia en el lugar lo de una opción (n, toca, punto,
  // puntoTexto), así el foco no se pierde.
  function pestanas({ nombre, opciones, elegida, alCambiar }) {
    const nombreRadios = Terna.idUnico('vista');
    const grupo = h('div', { class: 'vistas vistas-pestanas' + (opciones.length === 3 ? ' vistas-3' : ''), role: 'radiogroup', 'aria-label': nombre });
    const refs = {};
    for (const o of opciones) {
      const input = h('input', { type: 'radio', name: nombreRadios, value: o.valor, checked: o.valor === elegida });
      input.addEventListener('change', () => { if (input.checked && alCambiar) alCambiar(o.valor); });
      const numero = h('b', { class: 'num vista-n' });
      const punto = h('span', { class: 'vista-punto', 'aria-hidden': 'true', hidden: true }, h('span', { class: 'cuenta-toca' }));
      const puntoTexto = h('span', { class: 'oculto-visual' });
      refs[o.valor] = { input, numero, punto, puntoTexto };
      grupo.append(h('label', { class: 'vista', dataset: { vista: o.valor } }, input,
        h('span', { class: 'vista-cara' }, h('span', { class: 'vista-titulo' }, h('span', { class: 'vista-nombre', text: o.texto }), ' ', numero), punto, puntoTexto)));
      poner(o.valor, o);
    }
    function poner(valor, datos) {
      const r = refs[valor];
      if (!r) return;
      const d = datos || {};
      if (d.n !== undefined) {
        r.numero.textContent = d.n === null ? '' : Terna.numero(d.n);
        r.numero.hidden = d.n === null;
        // El punto va a la derecha del número: la mitad de su ancho, por la cantidad de cifras (por CSSOM, que la CSP permite).
        r.punto.style.setProperty('--medio-n', Math.max(14, (r.numero.textContent.length * 12 + 8) / 2) + 'px');
      }
      if (d.toca !== undefined) r.numero.classList.toggle('toca', !!d.toca);
      if (d.punto !== undefined) {
        const p = Number(d.punto) || 0;
        r.punto.hidden = !p;
        r.punto.firstChild.textContent = p ? Terna.numero(p) : '';
        if (!p) r.puntoTexto.textContent = '';
      }
      if (d.puntoTexto !== undefined) r.puntoTexto.textContent = r.punto.hidden ? '' : (d.puntoTexto || '');
    }
    function elegir(valor) { for (const [v, r] of Object.entries(refs)) r.input.checked = v === valor; }
    return { nodo: grupo, elegir, poner, radios: Object.fromEntries(Object.entries(refs).map(([v, r]) => [v, r.input])) };
  }

  // tituloGrupo({ texto, n, tono, ayuda, nivel, id }) → div.grupo-cabeza. El título de un grupo de una lista con su cuenta: «Hoy · 3»,
  // «Te toca decidir · 2» (`n` null o undefined: sin número). `tono`: 'toca' (ámbar, con su ícono), 'error' (rojo, con el triángulo),
  // 'espera' (el reloj) o nada. `ayuda`: un renglón debajo. `nivel`: la etiqueta del título ('h2' si no se dice). `id`: el del
  // título, para un aria-labelledby (si no, uno nuevo; queda en .titulo.id).
  const ICONO_GRUPO = { toca: 'i-por-decidir', error: 'i-alerta', espera: 'i-pedido' };
  function tituloGrupo({ texto, n, tono, ayuda, nivel, id }) {
    const conNumero = n !== null && n !== undefined;
    // El nombre accesible, entero: el h2 es flex y, sin esto, el lector lee «Después sigue Terna : 3» (FEEDBACK-UX P3-1).
    const titulo = h(nivel || 'h2', { class: 'grupo-titulo' + (tono ? ' grupo-' + tono : ''), id: id || Terna.idUnico('grupo'), 'aria-label': conNumero ? texto + ': ' + Terna.numero(n) : null },
      ICONO_GRUPO[tono] ? icono(ICONO_GRUPO[tono]) : null, h('span', { text: texto }),
      conNumero ? [h('span', { class: 'grupo-punto', 'aria-hidden': 'true', text: '·' }), oculto(': '), h('span', { class: 'num', text: Terna.numero(n) })] : null);
    return h('div', { class: 'grupo-cabeza' }, titulo, ayuda ? h('p', { class: 'grupo-ayuda', text: ayuda }) : null);
  }

  // interes(a, { forma, nombre, alCambiar }) → el control de interés en sus dos formas (PLAN-UX §2.3). forma 'dos' (la de siempre):
  // Me interesa y No me interesa, como radios (controlInteres; `nombre`, el del grupo de radios). forma 'chico': solo «No me
  // interesa», un botón chico para cada fila de Por armar, con el nombre del puesto para el lector de pantalla. Las dos llevan
  // data-control="interes-…" (el banco lo busca). alCambiar(valor, nodo) corre con el valor elegido ('me_interesa' o
  // 'no_me_interesa'); la confirmación (confirmarNoInteresa) y la escritura (marcarNoInteresa) las hace la página.
  function interes(a, { forma, nombre, alCambiar }) {
    if (forma !== 'chico') return controlInteres(a, nombre || Terna.idUnico('interes'), (valor) => alCambiar(valor, null));
    const b = h('button', { class: 'btn btn-fila interes-chico', type: 'button', 'aria-label': T.avisos.noMeInteresaAccesible(a.puesto),
      dataset: { control: 'interes-no_me_interesa' } }, icono('i-no-interesa'), T.avisos.interes.no_me_interesa);
    b.addEventListener('click', () => alCambiar('no_me_interesa', b));
    return b;
  }

  // filaDocumentos(a, { alNotas, alSalario }) → div.docs-fila o null (sin paquete). La fila de documentos de una carpeta de Armados
  // (PLAN-UX §3.2): CV y Carta son links firmados que se firman al tocarlos (Terna.linkFirmado con alTocar: una lista entera no pide
  // decenas de firmas al dibujarse) y se descargan con el nombre de cv-ats.md §3.12; Notas es un botón, solo si hay notas y la
  // página pasa alNotas(a, boton) (por ejemplo, abrir la ficha en el paquete); el salario sugerido es un dato, o un botón con
  // alSalario(a, boton). Cada pieza nombra el puesto para el lector de pantalla: en una lista hay muchos «CV».
  function filaDocumentos(a, opciones) {
    if (!a || (!a.cv_path && !a.carta_path)) return null;
    const o = opciones || {};
    const D = T.avisos.docs;
    const F = T.avisos.ficha;
    const idioma = a.paquete_idioma === 'en' ? 'en' : 'es';
    const doc = (ruta, tipo, iconoId, texto, nombre) => (ruta
      ? Terna.linkFirmado(ruta, Terna.nombreDescarga(tipo, idioma),
        h('a', { class: 'btn btn-fila', 'aria-label': nombre, dataset: { doc: tipo } }, icono(iconoId), texto), { alTocar: true })
      : null);
    const piezas = [doc(a.cv_path, 'cv', 'i-cv', F.cv, D.cv(a.puesto)), doc(a.carta_path, 'carta', 'i-sobre', F.carta, D.carta(a.puesto))];
    if (a.notas && o.alNotas) {
      const b = h('button', { class: 'btn btn-fila', type: 'button', 'aria-label': D.notas(a.puesto), dataset: { doc: 'notas' } }, icono('i-notas'), F.notas);
      b.addEventListener('click', () => o.alNotas(a, b));
      piezas.push(b);
    }
    if (a.salario_monto !== null && a.salario_monto !== undefined) {
      const cara = [icono('i-salario'), h('span', { 'aria-hidden': 'true', text: F.salarioCorto(Terna.numero(Number(a.salario_monto)), a.salario_moneda) }), oculto(textoSalario(a))];
      if (o.alSalario) {
        const b = h('button', { class: 'btn btn-fila', type: 'button', dataset: { doc: 'salario' } }, cara);
        b.addEventListener('click', () => o.alSalario(a, b));
        piezas.push(b);
      } else piezas.push(h('span', { class: 'docs-salario', dataset: { doc: 'salario' } }, cara));
    }
    return h('div', { class: 'docs-fila', role: 'group', 'aria-label': D.grupo(a.puesto) }, piezas);
  }

  /* ---------- Publicado en Terna (contratar.md 0.1 §5 y §6.2; brand.md 0.27 §6.4; datos.md 0.44, 0055) ----------
     Un aviso que alguien publicó en Terna para contratar no tiene página afuera ni formulario: la postulación le llega a quien lo
     publicó, con el CV y la carta del paquete, y ahí ve los datos de contacto. Con «Terna postula por vos» en Sí la manda el motor
     cuando arma el paquete; si no, la persona, con «Postular en Terna». La ficha suma una sección: quién lo publicó, la propuesta de
     postular si se la hicieron, la postulación (con «Retirar») y «Avisar que algo está mal». Abrir la ficha cuenta como una vista
     (registrar_vista, una por persona y aviso). Después de un cambio, la página vuelve a leer: por defecto recarga (la ficha se
     reabre sola desde el hash); Avisos rehace la ficha en el lugar (alCambiarTerna). Sin 0055 la función no existe y no se ve nada. */
  let ternaDatos = null;
  let ternaAlCambiar = () => location.reload();
  function alCambiarTerna(fn) { ternaAlCambiar = fn; }
  function datosTerna(fresco) {
    if (!ternaDatos || fresco) {
      ternaDatos = Terna.sb.rpc('mis_avisos_terna').then(({ data, error }) => {
        const m = new Map();
        if (!error) for (const x of data || []) m.set(x.match_id, x);
        return m;
      }, () => new Map());
    }
    return ternaDatos;
  }
  const vistos = new Set();
  function registrarVista(a) {
    if (!deTerna(a) || !a.aviso_id || vistos.has(a.aviso_id)) return;
    vistos.add(a.aviso_id);
    Terna.sb.rpc('registrar_vista', { p_aviso: a.aviso_id }).then(() => {}, () => {});
  }
  async function cambioTerna(a, texto) {
    datosTerna(true);
    if (texto) Terna.avisoBreve(texto, { icono: 'i-tilde' });
    ternaAlCambiar(a);
  }
  function errorTerna(error) {
    if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true });
  }
  // El botón principal: «Postular en Terna» cuando hay paquete y todavía no salió; si no, una línea que dice cómo se postula.
  const TERNA_HECHAS = new Set(['enviada', 'postulado', 'entrevista', 'en_cola', 'para_revisar']);
  function botonTerna(a, clase) {
    const TT = T.terna;
    if (!a.match_id || !a.paquete_id || TERNA_HECHAS.has(a.estado_postulacion)) return h('span', { class: 'suave terna-nota', text: TT.enTerna });
    return h('button', { class: clase || 'btn btn-primario btn-ancho', type: 'button', dataset: { control: 'postular-terna' },
      'aria-label': TT.postularAccesible(a.puesto), onclick: (e) => postularEnTerna(a, e.currentTarget) }, icono('i-enviar'), TT.postular);
  }
  async function postularEnTerna(a, boton) {
    const C = T.terna.confirmar;
    const si = await Terna.confirmar({ titulo: C.titulo, si: C.si, clase: 'dialogo-confirmar',
      cuerpo: [lineaAviso(a), h('p', { text: C.texto }), h('p', { text: T.terna.queVe })] });
    if (!si) return;
    if (boton) boton.setAttribute('aria-disabled', 'true');
    const { error } = await Terna.sb.rpc('postular_en_terna', { p_match: a.match_id });
    if (boton) boton.removeAttribute('aria-disabled');
    if (error) { errorTerna(error); return; }
    a.estado_postulacion = 'postulado';
    a.postulado_en = new Date().toISOString();
    cambioTerna(a, T.terna.hecho);
  }
  async function retirarDeTerna(a) {
    const C = T.terna.confirmarRetirar;
    const si = await Terna.confirmar({ titulo: C.titulo, si: C.si, destructivo: true, clase: 'dialogo-confirmar', cuerpo: [lineaAviso(a), h('p', { text: C.texto })] });
    if (!si) return;
    const { error } = await Terna.sb.rpc('retirar_postulacion_terna', { p_match: a.match_id });
    if (error) { errorTerna(error); return; }
    cambioTerna(a, T.terna.retirada);
  }
  async function responderPropuesta(a, x, acepta) {
    if (acepta) {
      const C = T.terna.confirmar;
      const si = await Terna.confirmar({ titulo: C.titulo, si: C.si, clase: 'dialogo-confirmar',
        cuerpo: [lineaAviso(a), h('p', { text: a.paquete_id ? C.texto : T.terna.propuestaPedida }), h('p', { text: T.terna.queVe })] });
      if (!si) return;
    }
    const { data, error } = await Terna.sb.rpc('responder_propuesta', { p_propuesta: x.propuesta_id, p_acepta: acepta });
    if (error) { errorTerna(error); return; }
    const TT = T.terna;
    if (data === 'postulada') { a.estado_postulacion = 'postulado'; a.postulado_en = new Date().toISOString(); }
    if (data === 'pedida') a.estado_paquete = 'pedido';
    cambioTerna(a, data === 'postulada' ? TT.propuestaPostulada : data === 'pedida' ? TT.propuestaPedida : TT.propuestaRechazada);
  }
  function denunciarTerna(a) {
    const D = T.terna.dialogoDenunciar;
    const id = Terna.idUnico('denuncia');
    const texto = h('textarea', { class: 'control', id, rows: '4', maxlength: '500', 'aria-describedby': id + '-ayuda ' + id + '-error' });
    const err = h('p', { class: 'campo-error', id: id + '-error' });
    const origen = document.activeElement;
    const bNo = h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, T.comun.cancelar);
    const bSi = h('button', { class: 'btn btn-primario', type: 'button', onclick: async () => {
      const motivo = texto.value.trim();
      if (motivo.length < 3 || motivo.length > 500) { err.textContent = D.error; texto.setAttribute('aria-invalid', 'true'); texto.focus(); return; }
      bSi.setAttribute('aria-disabled', 'true');
      const { error } = await Terna.sb.rpc('denunciar_aviso', { p_aviso: a.aviso_id, p_motivo: motivo });
      bSi.removeAttribute('aria-disabled');
      if (error) { err.textContent = Terna.textoError(error); return; }
      dlg.close();
      cambioTerna(a, T.terna.denunciaEnviada);
    } }, D.si);
    const dlg = Terna.dialogo({ titulo: D.titulo, clase: 'dialogo-confirmar', botones: [bNo, bSi],
      cuerpo: [lineaAviso(a), h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: id, text: D.etiqueta }), texto,
        h('p', { class: 'campo-ayuda', id: id + '-ayuda', text: D.ayuda }), err)] });
    texto.addEventListener('input', () => { err.textContent = ''; texto.removeAttribute('aria-invalid'); });
    dlg.addEventListener('close', () => Terna.devolverFoco(origen));
    dlg.showModal();
    texto.focus();
  }
  // La sección de la ficha: se arma vacía y se completa cuando llega mis_avisos_terna. null si el aviso no es de Terna.
  function seccionTerna(a) {
    if (!deTerna(a)) return null;
    registrarVista(a);
    const TT = T.terna;
    const cuerpo = h('div', { class: 'ficha-seccion-cuerpo terna-cuerpo' }, h('p', { class: 'suave', text: T.comun.cargando || '…' }));
    const sec = h('section', { class: 'ficha-seccion ficha-terna' }, h('h3', { text: TT.titulo }), cuerpo);
    datosTerna().then((mapa) => {
      Terna.vaciar(cuerpo);
      const x = mapa.get(a.match_id);
      if (!x) { cuerpo.append(h('p', { text: TT.enTerna })); return; }
      cuerpo.append(h('p', { text: TT.quien[x.cuenta_tipo === 'persona' ? 'persona' : 'empresa'] }));
      const botones = h('div', { class: 'botones' });
      const recibida = x.recibida_en && !x.retirada_en;
      if (x.propuesta_estado === 'enviada' && !recibida) {
        cuerpo.append(h('p', { class: 'terna-propuesta', text: TT.propuesta(Terna.fechaCorta(x.propuesta_en)) }));
        if (x.publicacion_abierta) {
          botones.append(h('button', { class: 'btn btn-primario', type: 'button', dataset: { control: 'propuesta-si' }, onclick: () => responderPropuesta(a, x, true) }, icono('i-enviar'), TT.propuestaSi),
            h('button', { class: 'btn', type: 'button', dataset: { control: 'propuesta-no' }, onclick: () => responderPropuesta(a, x, false) }, TT.propuestaNo));
        }
      } else if (x.propuesta_estado === 'aceptada' && !recibida) cuerpo.append(h('p', { text: TT.propuestaAceptada }));
      else if (x.propuesta_estado === 'rechazada') cuerpo.append(h('p', { class: 'suave', text: TT.propuestaDijisteNo }));
      if (recibida) {
        cuerpo.append(h('p', { text: TT.recibida(Terna.fechaCorta(x.recibida_en)) }));
        botones.append(h('button', { class: 'btn', type: 'button', dataset: { control: 'retirar-terna' }, onclick: () => retirarDeTerna(a) }, TT.retirar));
      } else if (x.retirada_en) {
        cuerpo.append(h('p', { text: TT.retiradaEl(Terna.fechaCorta(x.retirada_en)) }));
        if (x.publicacion_abierta && a.paquete_id) botones.append(h('button', { class: 'btn', type: 'button', onclick: (e) => postularEnTerna(a, e.currentTarget) }, TT.volver));
      } else if (!x.publicacion_abierta) cuerpo.append(h('p', { text: TT.cerrada }));
      else if (!a.paquete_id && x.propuesta_estado !== 'enviada') cuerpo.append(h('p', { text: TT.sinPaquete }));
      if (!recibida && x.publicacion_abierta) cuerpo.append(h('p', { class: 'campo-ayuda', text: TT.queVe }));
      if (x.denunciado) cuerpo.append(h('p', { class: 'suave', text: TT.denunciado }));
      else botones.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', dataset: { control: 'denunciar' }, onclick: () => denunciarTerna(a) }, icono('i-alerta', 'icono-16'), TT.denunciar));
      if (botones.childNodes.length) cuerpo.append(botones);
    });
    return sec;
  }
  // Las propuestas sin responder, para la tarjeta de Inicio: [{ match_id, aviso_id, propuesta_en }].
  async function propuestasTerna() {
    const mapa = await datosTerna();
    return [...mapa.values()].filter((x) => x.propuesta_estado === 'enviada' && x.publicacion_abierta && !(x.recibida_en && !x.retirada_en));
  }

  return {
    pestanas, tituloGrupo, interes, filaDocumentos,
    lengueta, estadoDe, marbete, nuevo, fechaSola, cabezaFicha, saltos, bajarA,
    estadoPaquete, llega, chip, chipPaquete, chipPostulacion, chipInteres, chipFaltan, fecha, etiquetas,
    evaluacion, chipCalificacion, REQUISITOS, categoriaRequisitos, pedirMotivo, lineaMotivo, MOTIVOS, leerConEvaluacion,
    MODALIDADES, ALCANCES, NIVELES, JORNADAS, TODOS_BUSQUEDA, busquedaDe, pasaBusqueda, motivosFuera,
    criterio, tuPuesto, tuEmpresa, sugerida,
    lugar, atributos, bloqueMatch, controlInteres, fichasPaquete, parsearNotas, textoSalario,
    traba, lineaEtapa, lineaCorta, topeIntentos, puedeVolverAProbar, seccionPostulacion, razones, abrirAviso, verAviso,
    ESTILO_POSTULACION, postulable, confirmarPedir, confirmarNoInteresa, marcarNoInteresa,
    DONDES, donde, textoDonde, explicacionDonde, celdaDonde, etiquetaDonde, lineaDonde,
    deTerna, seccionTerna, alCambiarTerna, datosTerna, propuestasTerna, registrarVista,
  };
})();
