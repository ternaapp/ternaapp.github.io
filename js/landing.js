/* Terna · js/landing.js · la landing pública (bienvenida.html; opciones-v3/PLAN-LANDING.md §8)
   La página viene entera en su HTML, con los textos escritos (y en T.landing, que el banco compara). Este script le suma lo que solo
   existe con JavaScript: el logo común (Terna.logo), el sol o la luna, «Ir a Inicio» con la sesión de la persona abierta, el diálogo
   «¿Dónde querés entrar?» y los links de contacto. No escribe textos propios, no lee config, no llama a ninguna función de la base y
   no guarda nada salvo la marca de sesión. Sin window.Terna (falló supabase-js o comun.js) no hace nada: los textos están, el logo
   está escrito en el HTML, cada «Entrar» lleva a entrar.html y faltan solo el botón del modo y el link a LinkedIn. */
'use strict';

(function () {
  if (!window.Terna) return;
  const ID_DIALOGO = 'donde-entrar';

  // 1. El logo común y el sol o la luna (un solo .btn-tema en la página, como pide el banco). El HTML trae el logo escrito, para
  // cuando no hay JavaScript (FEEDBACK-LANDING P3-10); acá se reemplaza por el de Terna.logo, que es el que manda.
  function cascara() {
    const logo = document.getElementById('ld-logo');
    if (logo) logo.replaceChildren(...Terna.logo());
    const acciones = document.querySelector('.ld-acciones');
    if (acciones && !acciones.querySelector('.btn-tema')) acciones.prepend(Terna.botonTema('btn-barra'));
  }

  // 2. Con la sesión de la persona abierta, el «Entrar» de la barra pasa a «Ir a Inicio» y no abre el diálogo (los otros
  // sí, por si quiere entrar del lado de quien contrata), y lo del título que es para quien no tiene cuenta (data-sin-sesion:
  // «Cómo conseguir una invitación», «Ya tengo cuenta» y la nota) se oculta (FEEDBACK-LANDING P3-10). Escribe la marca
  // terna.sesion, la que mira js/puerta.js en la raíz. Si getSession falla, queda todo como sin sesión.
  async function sesion() {
    let abierta = null;
    try {
      const { data } = await Terna.sb.auth.getSession();
      abierta = data && data.session;
    } catch (e) {
      return;
    }
    if (!abierta) return;
    try { localStorage.setItem('terna.sesion', '1'); } catch (e) { /* sin almacenamiento */ }
    for (const el of document.querySelectorAll('[data-sin-sesion]')) el.hidden = true;
    const entrar = document.querySelector('.ld-barra [data-abre="' + ID_DIALOGO + '"]');
    if (!entrar || !window.T || !T.landing) return;
    entrar.textContent = T.landing.barra.irAInicio;
    entrar.setAttribute('href', 'index.html');
    entrar.setAttribute('data-t', 'landing.barra.irAInicio');
    entrar.removeAttribute('data-abre');
  }

  // 3. El diálogo. Lo abre todo [data-abre="donde-entrar"] (en el HTML, links a entrar.html: sin este script, navegan). Un clic con
  // una tecla modificadora (abrir en otra pestaña) sigue siendo un link. El foco arranca en «Busco trabajo»; Esc cierra (nativo),
  // la cruz y el clic fuera del recuadro también; al cerrar, el foco vuelve a lo que lo abrió.
  function dialogo() {
    const dlg = document.getElementById(ID_DIALOGO);
    if (!dlg || typeof dlg.showModal !== 'function') return;
    let origen = null;
    document.addEventListener('click', (e) => {
      const abre = e.target instanceof Element ? e.target.closest('[data-abre="' + ID_DIALOGO + '"]') : null;
      if (!abre || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (dlg.open) return;
      origen = abre;
      dlg.showModal();
      const primera = dlg.querySelector('.ld-opcion');
      if (primera) primera.focus();
    });
    // Fuera del recuadro: el clic cae en el <dialog> (su fondo), pero también cae ahí el que toca su relleno; se mira la posición.
    dlg.addEventListener('click', (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    const cerrar = dlg.querySelector('.ld-donde-cerrar');
    if (cerrar) cerrar.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => {
      const volver = origen;
      origen = null;
      Terna.devolverFoco(volver);
    });
  }

  // 4. El contacto (decisión D4): solo el LinkedIn de Francisco. Si T.landing.contacto.linkedin es una dirección http o https, los
  // links a LinkedIn (data-linkedin, sin href en el HTML) la reciben con rel="noopener", todo lo que lleva data-contacto se
  // muestra (también «Cómo pedir una invitación para contratar», que va a #pedir) y lo que lleva data-sin-contacto (la línea
  // pedir.sinContacto, FEEDBACK-LANDING P1-2) se oculta. Vacía, no se toca nada: queda lo que dice el HTML.
  function contacto() {
    if (!window.T || !T.landing || !T.landing.contacto) return;
    const url = Terna.urlExterna(T.landing.contacto.linkedin);
    if (!url) return;
    for (const a of document.querySelectorAll('a[data-linkedin]')) {
      a.setAttribute('href', url);
      a.setAttribute('rel', 'noopener');
    }
    for (const el of document.querySelectorAll('[data-contacto]')) el.hidden = false;
    for (const el of document.querySelectorAll('[data-sin-contacto]')) el.hidden = true;
  }

  function armar() {
    cascara();
    dialogo();
    contacto();
    sesion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
})();
