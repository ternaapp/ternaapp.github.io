/* Terna · js/empresas.js
   "Empresas que seguís" (brand.md 0.13 §6.4 y §6.7; diseno.md 0.26; datos.md 0.30, 0034): qué aviso es de una empresa que la persona
   sigue, con la misma regla que el motor (`seguidas.misma_empresa` y `seguidas.empresa_seguida`, pipeline.md 0.4.24 §4.19). Se
   compara el núcleo del nombre: la empresa normalizada como `normalizar.empresa_normalizada` (sin tildes, mayúsculas, sufijos legales
   ni signos; antes se pliegan ø, æ, œ, ß, ł y đ) sin las palabras de relleno del catálogo (datos/catalogo.json, `slug.relleno`), sin
   las de un dominio y sin letras sueltas. Son la misma si los núcleos coinciden sin espacios, o sin las palabras de tipo de empresa
   del principio ("Banco Santander" = "Santander"). Nunca "empieza con" (revisión del 07/11/2026: "Meta" no es "Meta Consultores").
   Un nombre general solo vale entero. El nombre del tablero de la empresa, cuando el motor lo encuentra, vale como alias. Las listas
   y las expresiones son copias de las del motor: el banco las compara y compara los resultados (qa.md W.38). */
'use strict';

window.Empresas = (function () {
  // normalizar.SUFIJOS_LEGALES, con el \b de Python (que mira letras de cualquier alfabeto) hecho con lookarounds.
  const SUFIJOS = /(?<![\p{L}\p{N}_])(s\.?a\.?|s\.?r\.?l\.?|s\.?a\.?s\.?|s\.?l\.?|inc\.?|llc\.?|ltd\.?|ltda\.?|corp\.?|corporation|gmbh|co\.?|company|limited|plc|ag|bv|b\.?v\.?|sa de cv|s\.?a\.? de c\.?v\.?)(?![\p{L}\p{N}_])/giu;
  const RELLENO = new Set([
    'argentina', 'arg', 'latam', 'latinoamerica', 'latin', 'america', 'sucursal', 'de', 'del', 'la', 'el', 'y', 'and', 'the',
    'group', 'grupo', 'inc', 'llc', 'ltd', 'sa', 'srl', 'co',
    'com', 'ar', 'net', 'io', 'org'
  ]);
  const GENERALES = new Set([
    'agencia', 'alimentos', 'bank', 'banco', 'compania', 'constructora', 'consultancy', 'consulting', 'consultora', 'consultores',
    'consultoria', 'digital', 'empresa', 'energia', 'energy', 'estudio', 'farmaceutica', 'financiera', 'financiero', 'foods', 'global', 'holding',
    'holdings', 'industrias', 'inmobiliaria', 'internacional', 'international', 'labs', 'laboratorio', 'laboratorios', 'logistica',
    'media', 'partners', 'seguros', 'services', 'servicios', 'sistemas', 'software', 'solutions', 'soluciones', 'studio', 'systems',
    'technologies', 'technology', 'tecnologia', 'tecnologias', 'transporte'
  ]);
  // Letras que NFKD no separa de su marca (seguidas._PLIEGUE).
  const PLIEGUE = { 'ø': 'o', 'Ø': 'O', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE', 'ß': 'ss', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D' };

  // datos.normalizar: sin tildes (NFKD sin marcas), en minúscula, sin espacios de más.
  function normalizar(texto) {
    return String(texto || '').normalize('NFKD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // normalizar.empresa_normalizada, con el pliegue antes.
  function normalizada(nombre) {
    let n = normalizar(String(nombre || '').replace(/[øØæÆœŒßłŁđĐ]/g, (c) => PLIEGUE[c]));
    if (!n) return '';
    n = n.replace(SUFIJOS, ' ');
    n = n.replace(/^\s*the\s+/u, '');
    n = n.replace(/[^\p{L}\p{N}_\s]/gu, ' ');
    return n.replace(/\s+/g, ' ').trim();
  }
  // 'Mercado Libre S.R.L. (Argentina)' → ['mercado', 'libre']
  function palabras(nombre) {
    const n = normalizada(nombre);
    if (!n) return [];
    const todas = n.split(' ');
    const utiles = todas.filter((p) => !RELLENO.has(p));
    const sinSueltas = utiles.filter((p) => p.length > 1);
    return sinSueltas.length ? sinSueltas : (utiles.length ? utiles : todas);
  }
  const esGeneral = (ps) => !ps.length || ps.every((p) => GENERALES.has(p) || p.length < 3);
  function general(nombre) { return esGeneral(palabras(nombre)); }
  // Entero y sin espacios y, si empieza con palabras de tipo de empresa y lo que sigue no es general, también sin ellas.
  function variantes(nombre) {
    const ps = palabras(nombre);
    const formas = new Set();
    if (!ps.length) return formas;
    formas.add(ps.join(''));
    let i = 0;
    while (i < ps.length - 1 && GENERALES.has(ps[i])) {
      i += 1;
      const resto = ps.slice(i);
      if (!esGeneral(resto)) formas.add(resto.join(''));
    }
    return formas;
  }
  function misma(empresaAviso, seguida, alias) {
    const a = variantes(empresaAviso);
    if (!a.size) return false;
    for (const nombre of [seguida, alias]) {
      if (!nombre || !String(nombre).trim()) continue;
      if (general(nombre)) {
        if (palabras(nombre).join('') === palabras(empresaAviso).join('')) return true;
      } else {
        for (const v of variantes(nombre)) if (a.has(v)) return true;
      }
    }
    return false;
  }
  // La empresa seguida que es la del aviso, como la escribió la persona (la de más palabras; a igual largo, la primera), o null.
  // `seguidas`: nombres, o filas { nombre, alias }.
  function seguida(empresaAviso, seguidas) {
    let mejor = null;
    let largo = -1;
    for (const s of seguidas || []) {
      const nombre = s && typeof s === 'object' ? s.nombre : s;
      const alias = s && typeof s === 'object' ? s.alias : null;
      if (!nombre || !String(nombre).trim()) continue;
      if (misma(empresaAviso, nombre, alias)) {
        const n = palabras(nombre).length;
        if (n > largo) { mejor = String(nombre).trim(); largo = n; }
      }
    }
    return mejor;
  }

  return { RELLENO, GENERALES, normalizada, palabras, general, variantes, misma, seguida };
})();
