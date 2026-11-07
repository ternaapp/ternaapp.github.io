/* Terna · js/no-enmarcar.js
   Terna no se muestra dentro del marco de otro sitio (clickjacking; informe de seguridad del 06/11/2026, H2). GitHub Pages
   no deja mandar X-Frame-Options ni frame-ancestors, y frame-ancestors no vale en la CSP por <meta>: lo hace este script,
   el primero de cada página, sin dependencias, antes que supabase-js y que comun.js. Si la página de arriba es de otro
   sitio, oculta esta entera y trata de salir del marco; un marco del mismo sitio (una página de Terna dentro de otra, como
   las que usan las pruebas para ver anchos) se deja, como haría frame-ancestors 'self'. Todo lo que se puede tocar en Terna
   lo arma JavaScript, así que un marco que no deja correr scripts tampoco muestra nada útil. El estilo va por CSSOM: la CSP
   no deja estilos en línea. */
'use strict';

(function () {
  let ajeno = true;
  try {
    // Leer la dirección de la página de arriba falla (SecurityError) cuando es de otro sitio.
    ajeno = window.top !== window.self && window.top.location.origin !== window.location.origin;
  } catch (e) {
    ajeno = true;
  }
  if (!ajeno) return;
  document.documentElement.style.setProperty('display', 'none', 'important');
  try { window.top.location.replace(window.location.href); } catch (e) { /* el navegador no deja salir del marco: queda oculta */ }
})();
