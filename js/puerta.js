/* Terna · js/puerta.js · la puerta de la raíz (solo en index.html; opciones-v3/PLAN-LANDING.md §6.2, decisión D1 (a))
   El tercer script de index.html y, como js/tema.js, sin defer: corre antes de que se pinte Inicio. Si en este navegador no hay rastro
   de una sesión de la web (ni la marca terna.sesion, que escriben js/comun.js al abrir una página con sesión, js/cuenta.js al entrar
   y js/landing.js, ni la clave donde supabase-js guarda la sesión), manda a la landing, bienvenida.html. Con rastro sigue de largo:
   no decide si la sesión vale; si venció, Inicio manda a entrar.html como siempre (Terna.pagina → iniciar → irAEntrar). La marca
   está para no depender solo del nombre interno de esa clave. La sesión de quien solo contrata ('terna-contratar') no cuenta.
   Deja pasar solo lo que Inicio usa de verdad (FEEDBACK-LANDING P2-10): lo que Supabase pone al volver de un link (en el # o en
   el ?: access_token, type= o un error) y ?volver=. Cualquier otro parámetro (el fbclid de Facebook o Instagram, el utm_ de un
   correo) no es de Terna, y sin rastro de sesión la raíz igual va a la landing. */
'use strict';

(function () {
  try {
    const ls = window.localStorage;
    if (ls.getItem('terna.sesion') === '1') return;
    for (let i = 0; i < ls.length; i += 1) { if (/^sb-.+-auth-token$/.test(ls.key(i) || '')) return; }
  } catch (e) { /* sin almacenamiento no hay sesión guardada */ }
  const DE_SUPABASE = /(?:^|&)(?:access_token|type|error|error_code|error_description)=/;
  const hash = location.hash.replace(/^#/, '');
  const query = location.search.replace(/^\?/, '');
  if (DE_SUPABASE.test(hash) || DE_SUPABASE.test(query) || /(?:^|&)volver=/.test(query)) return;
  // Antes de irse, corta la carga de Inicio: lo que sigue del HTML no se pinta y sus scripts con defer no corren. Así no depende de
  // qué llega primero: si Inicio alcanzara a pedir la sesión antes de que cargue la landing, su irAEntrar le ganaría a este salto.
  try { window.stop(); } catch (e) { /* igual se va */ }
  location.replace('bienvenida.html');
})();
