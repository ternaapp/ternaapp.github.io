/* Terna · js/tema.js
   Modo claro u oscuro (brand.md 0.17 §5.5; diseno.md 0.30 §12.6). Por defecto, el del dispositivo (prefers-color-scheme);
   si la persona eligió uno con el sol o la luna, o al crear su cuenta, vale ese, guardado en este navegador y nada más
   (localStorage 'terna.tema' = 'claro' u 'oscuro'; sin clave, el del dispositivo). No viaja a la base ni a ningún lado.
   Va en el <head>, sin defer y después de la etiqueta de js/no-enmarcar.js: tiene que poner data-tema en <html> antes de
   que se pinte la página, para que quien eligió oscuro no vea un fogonazo claro. No depende de nada.
   Desde el rediseño B2 (opciones-v3/PLAN-WEB.md §1.5) pone además data-mode ('dark' o 'light'), que es lo que lee el CSS, y
   pisa el content de las dos <meta name="theme-color"> con el papel del modo elegido (están antes en el <head>). data-tema,
   'terna.tema', window.TernaTema y el evento terna:tema siguen igual: los leen el JS y el banco de pruebas. */
'use strict';

(function () {
  const CLAVE = 'terna.tema';
  const raiz = document.documentElement;
  const medio = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function elegido() {
    try {
      const v = window.localStorage.getItem(CLAVE);
      return v === 'claro' || v === 'oscuro' ? v : null;
    } catch (e) {
      return null;
    }
  }
  function delDispositivo() { return medio && medio.matches ? 'oscuro' : 'claro'; }
  function actual() { return elegido() || delDispositivo(); }
  // El papel de cada modo, para la barra del navegador (los mismos de --color-paper en css/terna.css).
  const PAPEL = { claro: '#f8f7fa', oscuro: '#0e0e13' };
  function marcar(t) {
    raiz.setAttribute('data-tema', t);
    raiz.setAttribute('data-mode', t === 'oscuro' ? 'dark' : 'light');
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.setAttribute('content', PAPEL[t] || PAPEL.claro);
  }
  function aplicar() {
    const t = actual();
    // data-mode tiene que quedar puesto también la primera vez, aunque data-tema ya esté.
    if (raiz.getAttribute('data-tema') === t && raiz.hasAttribute('data-mode')) return;
    const cambio = raiz.getAttribute('data-tema') !== t;
    marcar(t);
    if (cambio) document.dispatchEvent(new CustomEvent('terna:tema', { detail: t }));
  }
  /* 'claro' u 'oscuro' lo deja fijo en este navegador; cualquier otra cosa vuelve al del dispositivo. */
  function elegir(t) {
    try {
      if (t === 'claro' || t === 'oscuro') window.localStorage.setItem(CLAVE, t);
      else window.localStorage.removeItem(CLAVE);
    } catch (e) { /* sin almacenamiento: vale hasta que se cierre la página */
      marcar(t === 'claro' || t === 'oscuro' ? t : delDispositivo());
      document.dispatchEvent(new CustomEvent('terna:tema', { detail: raiz.getAttribute('data-tema') }));
      return;
    }
    aplicar();
  }
  function alternar() { elegir(raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro'); }

  if (medio) {
    if (medio.addEventListener) medio.addEventListener('change', aplicar);
    else if (medio.addListener) medio.addListener(aplicar);
  }
  // Otra pestaña de Terna cambió el modo: esta lo sigue.
  window.addEventListener('storage', (e) => { if (e.key === CLAVE || e.key === null) aplicar(); });
  aplicar();

  window.TernaTema = { actual: () => raiz.getAttribute('data-tema') || actual(), elegido, delDispositivo, elegir, alternar };
})();
