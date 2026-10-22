/* Terna · js/iconos.js
   El set de íconos de diseno.md §11.2 (más los de 0.3: foco, hablar, preguntar, viejo, bajo-minimo, subir,
   sin-conexion), como sprite de <symbol> que se inserta al principio del <body>. Trazo, sin relleno, currentColor.
   Cada uso: <svg class="icono"><use href="#i-avisos"/></svg>, con aria-hidden cuando acompaña texto. */
'use strict';

(function () {
  const P = (d) => '<path d="' + d + '"/>';
  const S = {
    'i-inicio': '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    'i-avisos': P('M4 6h16M4 12h16M4 18h10'),
    'i-postulaciones': '<rect x="6" y="4" width="12" height="17" rx="2"/>' + P('M9 4V2h6v2M9 13l2 2 4-4'),
    'i-perfil': '<circle cx="12" cy="8" r="4"/>' + P('M4 21c0-4 3.6-7 8-7s8 3 8 7'),
    'i-preferencias': P('M4 7h10M18 7h2M4 17h4M12 17h8') + '<circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    'i-sobre': '<rect x="3" y="5" width="18" height="14" rx="2"/>' + P('M3 7l9 6 9-6'),
    'i-admin': P('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'),
    'i-salir': P('M9 21H5V3h4M16 17l5-5-5-5M21 12H9'),
    'i-abrir': P('M7 17L17 7M8 7h9v9'),
    'i-descargar': P('M12 4v12M7 11l5 5 5-5M5 20h14'),
    'i-subir': P('M12 16V4M7 9l5-5 5 5M4 20h16'),
    'i-cv': P('M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6'),
    'i-notas': P('M5 4h14v16H5zM8 9h8M8 13h8M8 17h5'),
    'i-salario': '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    'i-filtrar': P('M3 5h18l-7 8v6l-4-2v-4z'),
    'i-ordenar': P('M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3'),
    'i-local': P('M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z') + '<circle cx="12" cy="10" r="2.5"/>',
    'i-exterior': '<circle cx="12" cy="12" r="9"/>' + P('M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18'),
    'i-remoto': P('M3 11l9-7 9 7M5 10v10h14V10'),
    'i-hibrido': P('M2 12l6-5 6 5M4 11v9h8v-9M14 4h8v16h-8zM17 8h2M17 12h2M17 16h2'),
    'i-presencial': '<rect x="5" y="3" width="14" height="18"/>' + P('M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3'),
    'i-tilde': P('M5 12l4 4L19 6'),
    'i-no-interesa': '<circle cx="12" cy="12" r="9"/>' + P('M9 12h6'),
    'i-por-decidir': '<circle cx="12" cy="12" r="9"/>' + P('M12 8v5M12 16h.01'),
    'i-armado': '<circle cx="12" cy="12" r="9"/>' + P('M8 12l3 3 5-6'),
    'i-pedido': '<circle cx="12" cy="12" r="9"/>' + P('M12 7v5l3 2'),
    'i-sin-armar': '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>',
    'i-alerta': P('M12 3l10 18H2zM12 10v4M12 18h.01'),
    'i-sin-texto': '<rect x="6" y="4" width="12" height="17" rx="2"/>' + P('M9 4V2h6v2M12 15v-1c1.5 0 2-.8 2-2a2 2 0 0 0-4 0M12 18h.01'),
    'i-enviada': P('M21 3L10 14M21 3l-7 18-4-7-7-4z'),
    'i-a-mano': P('M4 20h4l10-10-4-4L4 16zM13 7l4 4'),
    'i-revisar': P('M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z') + '<circle cx="12" cy="12" r="3"/>',
    'i-entrevista': '<rect x="3" y="5" width="18" height="16" rx="2"/>' + P('M3 10h18M8 3v4M16 3v4'),
    'i-probar': P('M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5'),
    'i-enviar': P('M5 12h14M13 6l6 6-6 6'),
    'i-captura': '<rect x="3" y="5" width="18" height="14" rx="2"/>' + P('M3 15l5-5 4 4 3-3 6 6M16 9h.01'),
    'i-pegar': '<rect x="9" y="9" width="11" height="11" rx="2"/>' + P('M5 15V5h10'),
    'i-chevron': P('M6 9l6 6 6-6'),
    'i-adelante': P('M9 6l6 6-6 6'),
    'i-volver': P('M19 12H5M12 19l-7-7 7-7'),
    'i-cerrar': P('M6 6l12 12M18 6L6 18'),
    'i-quitar': P('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'),
    'i-agregar': P('M12 5v14M5 12h14'),
    'i-pausar': P('M8 5v14M16 5v14'),
    'i-reanudar': P('M7 4l12 8-12 8z'),
    'i-deshacer': P('M4 10h10a5 5 0 0 1 0 10H9M4 10l4-4M4 10l4 4'),
    // 0.3: notas para la entrevista y etiquetas del aviso (mock "Propuestas 0.3", aprobadas el 22/10/2026)
    'i-foco': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    'i-hablar': P('M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
    'i-preguntar': '<circle cx="12" cy="12" r="9"/>' + P('M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2.2-2.5 4M12 17h.01'),
    'i-viejo': P('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2'),
    'i-bajo-minimo': P('M3 7l6 6 4-4 8 8M21 11v6h-6'),
    'i-sin-conexion': P('M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01M3 3l18 18'),
  };
  const marca = '<path d="M3 6h18M3 12h12M3 18h7"/>';

  let simbolos = '';
  for (const id in S) simbolos += '<symbol id="' + id + '" viewBox="0 0 24 24">' + S[id] + '</symbol>';
  simbolos += '<symbol id="i-marca" viewBox="0 0 24 24">' + marca + '</symbol>';

  function insertar() {
    if (document.getElementById('sprite-iconos')) return;
    const div = document.createElement('div');
    div.id = 'sprite-iconos';
    div.className = 'sprite';
    // Texto fijo de este archivo (sin datos): es el único innerHTML de la web.
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + simbolos + '</svg>';
    document.body.prepend(div);
  }
  if (document.body) insertar(); else document.addEventListener('DOMContentLoaded', insertar);
})();
