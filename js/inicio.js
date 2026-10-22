/* Terna · js/inicio.js
   Inicio (diseno.md §6): la última corrida, cinco cifras del período, qué hay para hacer y el umbral.
   Lee mi_resumen(p_desde) y, para "Ya se armaron tus {3} paquetes", preferencias.paquetes_por_dia (datos.md §14). */
'use strict';

Terna.pagina('inicio', async (ctx) => {
  const { h, icono } = Terna;
  const cont = document.getElementById('inicio');
  const PERIODOS = ['semana', 'mes', 'todo'];
  let periodo = Terna.leerLocal('inicio.periodo', 'semana');
  if (!PERIODOS.includes(periodo)) periodo = 'semana';

  const seg = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': T.inicio.periodo });
  for (const p of PERIODOS) {
    seg.append(h('label', null,
      h('input', { type: 'radio', name: 'periodo', value: p, checked: p === periodo, onchange: () => { periodo = p; Terna.guardarLocal('inicio.periodo', p); cargar(); } }),
      h('span', { text: T.inicio.periodos[p] })));
  }
  document.getElementById('periodo').append(seg);

  const parar = Terna.cargando(cont);
  const pref = await ctx.sb.from('preferencias').select('paquetes_por_dia').eq('usuario_id', ctx.usuario.id).maybeSingle();
  const paquetesDia = (pref.data && pref.data.paquetes_por_dia) || 3;

  function desde() {
    const hoy = Terna.hoy();
    if (periodo === 'semana') return Terna.sumarDias(hoy, -6);
    if (periodo === 'mes') return hoy.slice(0, 8) + '01';
    return null;
  }

  let primera = true;
  async function cargar() {
    const { data, error } = await ctx.sb.rpc('mi_resumen', { p_desde: desde() });
    if (primera) parar();
    if (error) { Terna.errorDeCarga(cont, error); return; }
    const r = (Array.isArray(data) ? data[0] : data) || {};
    dibujar(r);
    primera = false;
  }

  function lineaCorrida(r) {
    const nodo = h('div', { class: 'inicio-corrida' });
    if (!r.ultima_corrida_fecha) { nodo.append(h('p', { text: T.inicio.noCorrio })); return nodo; }
    if (r.ultima_corrida_terminada_en) {
      const dias = Terna.diasEntre(r.ultima_corrida_fecha, Terna.hoy());
      const hora = Terna.hora(r.ultima_corrida_terminada_en);
      nodo.append(h('p', { text: dias === 0 ? T.inicio.corrioHoy(hora) : dias === 1 ? T.inicio.corrioAyer(hora) : T.inicio.corrioEl(Terna.fechaCorta(r.ultima_corrida_fecha), hora) }));
    }
    const res = r.ultima_corrida_resultado;
    if (res && res !== 'armados') {
      const t = T.inicio.resultado[res];
      const texto = typeof t === 'function' ? (res === 'sin_umbral' ? t(r.umbral_actual) : t(paquetesDia)) : t;
      if (texto) nodo.append(h('p', { text: texto }));
    }
    return nodo;
  }

  function cifra(numero, etiqueta, nota) {
    return h('li', { class: 'cifra' },
      h('div', { class: 'cifra-numero', text: Terna.numero(Number(numero || 0)) }),
      h('div', { class: 'cifra-etiqueta', text: etiqueta }),
      nota ? h('div', { class: 'cifra-nota num', text: nota }) : null);
  }

  function filaPendiente(href, iconoId, texto) {
    if (!href) return h('div', { class: 'fila fila-info' }, icono(iconoId), h('span', { text: texto }));
    return h('a', { class: 'fila', href }, icono(iconoId), h('span', { text: texto }), icono('i-adelante', 'i-adelante'));
  }

  function dibujar(r) {
    Terna.vaciar(cont);
    cont.append(lineaCorrida(r));
    const C = T.inicio.cifras;
    cont.append(h('ul', { class: 'tarjeta cifras', 'aria-label': T.inicio.comoViene, role: 'list' },
      cifra(r.sobre_umbral, C.nuevos, C.total(Number(r.avisos_nuevos || 0))),
      cifra(r.paquetes_armados, C.armados),
      cifra(r.enviadas, C.enviadas),
      cifra(r.postulados_a_mano, C.aMano),
      cifra(r.entrevistas, C.entrevistas)));

    const que = h('section', { class: 'seccion', 'aria-labelledby': 'h-que-hay' }, h('h2', { id: 'h-que-hay', text: T.inicio.queHay }));
    if (ctx.faltantes.length) {
      que.append(h('div', { class: 'vacio' },
        h('p', { text: T.bandas.incompleto(Terna.listaFaltantes(ctx.faltantes)) }),
        h('a', { class: 'btn', href: 'perfil.html' }, T.bandas.completar)));
    } else {
      const filas = [];
      const n = (x) => Number(x || 0);
      if (n(r.a_mano_pendientes)) filas.push(filaPendiente('postulaciones.html#a-mano', 'i-a-mano', T.inicio.aMano(n(r.a_mano_pendientes))));
      if (n(r.para_revisar)) filas.push(filaPendiente('postulaciones.html#para-revisar', 'i-revisar', T.inicio.paraRevisar(n(r.para_revisar))));
      if (n(r.por_decidir)) filas.push(filaPendiente('avisos.html?interes=por_decidir', 'i-por-decidir', T.inicio.porDecidir(n(r.por_decidir))));
      if (n(r.sin_texto)) filas.push(filaPendiente('avisos.html?paquete=sin_texto', 'i-sin-texto', T.inicio.sinTexto(n(r.sin_texto))));
      if (n(r.en_cola)) filas.push(filaPendiente(null, 'i-pedido', T.inicio.enCola(n(r.en_cola))));
      if (filas.length) que.append(h('div', { class: 'tarjeta tarjeta-plana' }, filas));
      else que.append(h('p', { text: T.inicio.nadaPendiente }));
    }
    que.append(h('p', { class: 'suave umbral-linea' }, T.inicio.umbralActual(r.umbral_actual), ' ', h('a', { href: 'preferencias.html', text: T.comun.pestanas.preferencias })));

    const asi = h('section', { class: 'tarjeta asi-funciona', 'aria-labelledby': 'h-asi' },
      h('h2', { id: 'h-asi', class: 'tarjeta-titulo', text: T.inicio.asiFunciona }),
      h('p', { text: T.inicio.asi1 }),
      h('p', null, T.inicio.asi2a, h('a', { href: 'postulaciones.html', text: T.comun.pestanas.postulaciones }), T.inicio.asi2b),
      h('p', { class: 'suave', text: T.inicio.asi3 }));
    cont.append(h('div', { class: 'inicio-cols' }, que, asi));
  }

  await cargar();
});
