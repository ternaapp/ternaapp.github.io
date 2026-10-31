/* Terna · js/alertas.js
   Guías de alertas (brand.md 0.4.11 §6.7.1; diseno.md 0.12 §9.4): cómo crear alertas de empleo en cada portal y cómo hacer
   que el correo se las reenvíe solo a Terna. Página por bloques como Preferencias (desplegables en celular, carril desde
   768 px; Terna.porBloques): cada guía es un bloque con su hash (#linkedin, #gmail…), así Preferencias lleva directo a la
   que hace falta. Solo lee: la dirección (encabezado) y preferencias.puestos_objetivo, para sugerir qué buscar.
   Los textos son T.guias: "*así*" marca en negrita el nombre de un botón o un menú tal como se ve en pantalla. */
'use strict';

Terna.pagina('alertas', async (ctx) => {
  const { h, icono } = Terna;
  const G = T.guias;
  const raiz = document.getElementById('guias');
  const cabecera = document.getElementById('cabecera');
  const direccion = String(ctx.config.alertas_mail_patron || '').replace('{codigo}', ctx.usuario.codigo_alertas || '');

  const { data: prefs, error } = await ctx.sb.from('preferencias').select('puestos_objetivo').eq('usuario_id', ctx.usuario.id).maybeSingle();
  if (error) {
    if (!Terna.siSesionVencida(error)) Terna.errorDeCarga(raiz, error);
    return;
  }
  const puestos = ((prefs && prefs.puestos_objetivo) || []).filter(Boolean);

  // "*Configuración*" → <strong>: todo con nodos de texto, nunca innerHTML.
  function marcado(texto) {
    return String(texto).split('*').map((parte, i) => (i % 2 ? h('strong', { text: parte }) : document.createTextNode(parte)));
  }
  function copiable(valor, etiqueta) {
    const code = h('code', { text: valor });
    return h('div', { class: 'direccion' }, code,
      h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(valor, code) }, icono('i-pegar'), etiqueta));
  }
  function puestosSugeridos() {
    if (!puestos.length) {
      return h('p', { class: 'campo-ayuda' }, G.sinPuestos, ' ', h('a', { href: 'preferencias.html#busqueda', text: G.cargarPuestos }));
    }
    return h('div', { class: 'guia-puestos' },
      h('p', { text: G.tusPuestos }),
      h('ul', { class: 'chips-puestos' }, puestos.map((x) => h('li', { class: 'chip', text: x }))),
      h('p', { class: 'campo-ayuda' }, G.puestosAyuda, ' ', h('a', { href: 'preferencias.html#busqueda', text: G.cambiarPuestos })));
  }
  const PIEZAS = {
    p: (x) => h('p', null, marcado(x)),
    pasos: (x) => h('ol', { class: 'pasos guia-pasos' }, x.map((paso) => h('li', null, marcado(paso)))),
    lista: (x) => h('ul', { class: 'pasos guia-lista' }, x.map((y) => h('li', null, marcado(y)))),
    nota: (x) => h('p', { class: 'campo-ayuda' }, marcado(x)),
    cuidado: (x) => h('div', { class: 'guia-cuidado' }, icono('i-alerta'), h('p', null, marcado(x))),
    subtitulo: (x) => h('h3', { class: 'tarjeta-titulo guia-subtitulo', text: x }),
    direccion: () => copiable(direccion, G.copiarDireccion),
    remitentes: () => copiable(G.remitentes, G.copiarRemitentes),
    // Outlook pide los remitentes de a uno: la lista, cada uno con su botón de copiar.
    remitentesLista: () => h('ul', { class: 'remitentes' }, G.remitentesLista.map((r) => h('li', null, copiable(r, G.copiar)))),
    indice: (x) => h('ul', { class: 'guia-indice' }, x.map(([texto, href]) => h('li', null, h('a', { class: 'guia-ir', href }, h('span', { text: texto }), icono('i-adelante', 'icono-16'))))),
    puestos: () => puestosSugeridos(),
    // [texto, href]: un link a otra guía de esta página (#gmail) o a otra página de Terna.
    ir: ([texto, href]) => h('p', null, h('a', { class: 'guia-ir', href }, h('span', { text: texto }), icono('i-adelante', 'icono-16'))),
  };

  cabecera.append(h('a', { class: 'btn btn-texto guia-volver', href: 'preferencias.html#alertas' }, icono('i-volver'), G.volver));
  const bloques = Terna.porBloques({ raiz, cabecera, nombre: G.carril, abiertos: new Set(['como-funciona']) });
  for (const s of G.secciones) {
    bloques.bloque(s.clave, s.titulo, h('div', { class: 'guia' }, s.piezas.map(([tipo, valor]) => PIEZAS[tipo](valor))));
  }
  bloques.montar({});

  // Un link a otra guía de la misma página (#gmail): en celular abre ese desplegable; desde 768, lo elige en el carril.
  raiz.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const destino = raiz.querySelector('.carril-bloques a[href="' + a.getAttribute('href') + '"]');
    if (!destino) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    if (window.matchMedia('(min-width: 768px)').matches) {
      destino.click();
      return;
    }
    const seccion = document.getElementById('panel-' + a.getAttribute('href').slice(1)).closest('section');
    const boton = seccion.querySelector('.plegable-boton');
    if (boton.getAttribute('aria-expanded') !== 'true') boton.click();
    seccion.scrollIntoView({ block: 'start' });
    boton.focus({ preventScroll: true });
  });
});
