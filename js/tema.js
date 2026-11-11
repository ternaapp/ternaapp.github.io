/* Terna · js/tema.js
   Modo claro u oscuro (brand.md 0.17 §5.5; diseno.md 0.30 §12.6). Por defecto, el del dispositivo (prefers-color-scheme);
   si la persona eligió uno con el sol o la luna, o al crear su cuenta, vale ese, guardado en este navegador y nada más
   (localStorage 'terna.tema' = 'claro' u 'oscuro'; sin clave, el del dispositivo). No viaja a la base ni a ningún lado.
   Va en el <head>, sin defer y después de la etiqueta de js/no-enmarcar.js: tiene que poner data-tema en <html> antes de
   que se pinte la página, para que quien eligió oscuro no vea un fogonazo claro. No depende de nada. */
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
  function aplicar() {
    const t = actual();
    if (raiz.getAttribute('data-tema') === t) return;
    raiz.setAttribute('data-tema', t);
    document.dispatchEvent(new CustomEvent('terna:tema', { detail: t }));
  }
  /* 'claro' u 'oscuro' lo deja fijo en este navegador; cualquier otra cosa vuelve al del dispositivo. */
  function elegir(t) {
    try {
      if (t === 'claro' || t === 'oscuro') window.localStorage.setItem(CLAVE, t);
      else window.localStorage.removeItem(CLAVE);
    } catch (e) { /* sin almacenamiento: vale hasta que se cierre la página */
      raiz.setAttribute('data-tema', t === 'claro' || t === 'oscuro' ? t : delDispositivo());
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
