/* Terna · js/como-funciona.js
   Cómo funciona (PLAN-UX.md §4; brand.md §6.14, propuesta): la página 13, con sesión y con la cáscara de siempre. Se llega desde la
   hoja de Cuenta, el carril, «Para empezar» de Inicio y los links «Cómo funciona» de Preferencias, Paquetes y Postulaciones, cada
   uno a su tema (#match, #paquetes, #pedir, #postular, #fuentes; también #en-una-frase, #el-dia, #lo-que-manejas y #preguntas).
   Es la página por bloques de Mi perfil, Preferencias y las Guías (Terna.porBloques): en el celular, un tema plegable por bloque,
   abierto el primero; desde 768 px, el índice de temas a la izquierda y el tema elegido a la derecha. El tema va en la URL.
   Los textos son T.como, con las piezas de T.guias más la tabla y las preguntas. Ningún número va escrito en este archivo: los
   paquetes por día, el piso del match, el umbral de la persona y los días de «No me interesa» salen de config (la cáscara ya la
   leyó) y de preferencias (umbral y paquetes_por_dia, la misma lectura que hacen Paquetes y Empleos). Solo lee. */
'use strict';

Terna.pagina('como', async (ctx) => {
  const { h, icono } = Terna;
  const C = T.como;
  const raiz = document.getElementById('como');
  const cabecera = document.getElementById('cabecera');
  const config = ctx.config || {};

  const parar = Terna.cargando(raiz);
  const { data: prefs, error } = await ctx.sb.from('preferencias').select('umbral, paquetes_por_dia').eq('usuario_id', ctx.usuario.id).maybeSingle();
  parar();
  if (error) { Terna.errorDeCarga(raiz, error); return; }
  // Los números de los temas. Sin la fila de preferencias (una cuenta a medio crear), los de fábrica de config.
  const p = prefs || {};
  const x = {
    cupo: Number(p.paquetes_por_dia || config.paquetes_por_dia_default),
    piso: Number(config.piso_match),
    umbral: Number(p.umbral !== null && p.umbral !== undefined ? p.umbral : config.umbral_default),
    dias: Number(config.retencion_no_interesa_dias),
  };
  // Un número que falta no se inventa: mejor el error de carga que un tema que diga «hasta NaN paquetes».
  if (!Object.values(x).every((n) => Number.isFinite(n) && n > 0)) { Terna.errorDeCarga(raiz, new Error('config incompleta')); return; }

  // "*así*" → <strong>: todo con nodos de texto, nunca innerHTML (como en las Guías).
  const marcado = (texto) => String(texto).split('*').map((parte, i) => (i % 2 ? h('strong', { text: parte }) : document.createTextNode(parte)));
  const sinMarcas = (texto) => String(texto).replace(/\*/g, '');
  // Un link adonde se hace lo que el tema cuenta: un botón de texto, con la flecha como un ícono aparte.
  const ir = (texto, href) => h('a', { class: 'como-ir', href }, h('span', { text: texto }), icono('i-adelante', 'icono-16'));

  // «Si querés… / Andá a…»: una tabla de verdad, de dos columnas también en el celular (cada renglón es corto). Lo que querés es
  // el encabezado de su fila; adónde ir, un link cuando hay adónde (sin flecha: toda la columna es «andá a»).
  function tabla(columnas, filas) {
    return h('table', { class: 'como-tabla' },
      h('thead', null, h('tr', null, columnas.map((c) => h('th', { scope: 'col', text: c })))),
      h('tbody', null, filas.map(([quiero, donde, href]) => h('tr', null,
        h('th', { scope: 'row', text: quiero }),
        h('td', null, href ? h('a', { class: 'como-destino', href, text: donde }) : h('span', { class: 'como-donde', text: donde }))))));
  }
  // Una pregunta corta: la pregunta como título del tema y la respuesta debajo; con href, la respuesta es el link.
  const pregunta = (q, respuesta, href) => h('div', { class: 'como-pregunta' },
    h('h3', { class: 'como-pregunta-titulo', text: q }),
    href ? h('p', null, ir(respuesta, href)) : h('p', null, marcado(respuesta)));

  const PIEZAS = {
    p: (texto) => h('p', null, marcado(texto)),
    lista: (items) => h('ul', { class: 'pasos como-lista' }, items.map((y) => h('li', null, marcado(y)))),
    pasos: (items) => h('ol', { class: 'pasos como-pasos' }, items.map((y) => h('li', null, marcado(y)))),
    link: (texto, href) => h('p', { class: 'como-link' }, ir(texto, href)),
    tabla,
    pregunta,
  };

  // El lomo de un tema cerrado (celular) dice qué hay adentro, con los textos del tema: los pasos por su palabra en negrita
  // («Busca · Filtra · Puntúa…»), la tabla por lo que querés, las preguntas por sus preguntas; si no, el primer renglón.
  function resumen(piezas) {
    const pasos = piezas.find(([tipo]) => tipo === 'pasos');
    if (pasos) {
      const cabezas = pasos[1].map((y) => (/^\*([^*]+)\*/.exec(y) || [])[1]).filter(Boolean);
      if (cabezas.length === pasos[1].length) return cabezas.join(' · ');
    }
    const t = piezas.find(([tipo]) => tipo === 'tabla');
    if (t) return t[2].map(([quiero]) => quiero).join(' · ');
    const preguntas = piezas.filter(([tipo]) => tipo === 'pregunta');
    if (preguntas.length) return preguntas.map(([, q]) => q).join(' ');
    const primero = piezas.find(([tipo]) => tipo === 'p' || tipo === 'lista');
    return primero ? sinMarcas(Array.isArray(primero[1]) ? primero[1][0] : primero[1]) : '';
  }

  Terna.vaciar(raiz);
  const bloques = Terna.porBloques({ raiz, cabecera, nombre: C.carril, abiertos: new Set([C.temas[0].clave]) });
  for (const tema of C.temas) {
    const piezas = tema.piezas(x);
    const cuerpo = h('div', { class: 'como' }, piezas.map(([tipo, ...resto]) => PIEZAS[tipo](...resto)));
    bloques.bloque(tema.clave, tema.titulo, cuerpo, { resumen: () => resumen(piezas) });
  }
  bloques.montar({});
});
