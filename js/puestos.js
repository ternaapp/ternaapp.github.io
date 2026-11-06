/* Terna · js/puestos.js
   "Priorizar mis puestos" (brand.md 0.5.4 §6.4 y §6.7; diseno.md 0.18 §7 y §9.3; datos.md 0.22, 0027): qué aviso es de tus
   puestos, con la misma regla que el motor (`que_buscas.puesto_buscado`, pipeline.md 0.4.15 §4.9 punto 3c) y las preferencias del
   momento. Un aviso es de tus puestos cuando su título tiene entero uno de los puestos que la persona escribió: sus palabras, en
   orden y seguidas, sin tildes ni mayúsculas, sin signos, sin las marcas de antigüedad y sin conectores. Un puesto hecho solo de
   palabras de tipo de rol ("Analista") no cuenta. Las tres listas son copias de las del motor (`que_buscas.marcas_de_nivel()`, que
   sale de datos/niveles_jornadas.json, `_VACIAS` y `CONECTORES`): el banco las compara y compara los resultados (qa.md W.27). */
'use strict';

window.Puestos = (function () {
  // Las marcas de antigüedad como palabras, de la más larga a la más corta ("semi senior" antes que "senior").
  const MARCAS = [
    ['entry', 'level'], ['mid', 'level'], ['mid', 'senior'], ['recien', 'graduada'], ['recien', 'graduado'],
    ['semi', 'senior'], ['intermediate'], ['jr'], ['junior'], ['principal'], ['semisenior'], ['senior'], ['sr'],
    ['ssr']
  ];
  // Las que nombran el tipo de rol en cualquier área: compartirlas no hace que dos puestos sean el mismo.
  const VACIAS = new Set([
    'americas', 'analista', 'analyst', 'and', 'area', 'argentina', 'asistente', 'assistant', 'associate', 'con',
    'consultant', 'consultor', 'consultora', 'coordinador', 'coordinadora', 'coordinator', 'de', 'del', 'director',
    'directora', 'ejecutiva', 'ejecutivo', 'en', 'engineer', 'equipo', 'especialista', 'executive', 'for', 'gerente',
    'head', 'ingeniera', 'ingeniero', 'intern', 'jefa', 'jefe', 'junior', 'las', 'latam', 'lead', 'lider', 'los',
    'manager', 'of', 'officer', 'para', 'por', 'principal', 'remote', 'remoto', 'representante', 'representative',
    'semi', 'senior', 'specialist', 'staff', 'team', 'the', 'to', 'trainee', 'una', 'uno', 'with', 'y'
  ]);
  // Las que no distinguen un puesto de otro cuando se compara el nombre entero: "Analista de Logística" = "Analista Logística".
  const CONECTORES = new Set([
    '&', '+', 'a', 'al', 'an', 'and', 'at', 'con', 'de', 'del', 'e', 'el', 'en', 'for', 'in', 'la', 'las', 'lo',
    'los', 'o', 'of', 'on', 'or', 'para', 'por', 'the', 'to', 'u', 'un', 'una', 'with', 'y'
  ]);
  const PALABRA = /[a-z0-9&+#]+/g;

  // Como datos.normalizar del motor: sin tildes (NFKD sin marcas) y en minúscula.
  function normalizar(texto) {
    return String(texto || '').normalize('NFKD').replace(/\p{Mn}/gu, '').toLowerCase();
  }
  function sinSecuencia(palabras, marca) {
    const salida = [];
    let i = 0;
    while (i < palabras.length) {
      if (marca.every((x, j) => palabras[i + j] === x)) i += marca.length;
      else { salida.push(palabras[i]); i += 1; }
    }
    return salida;
  }
  // 'Sr. Analista de Logística (PRUEBA)' → ['analista', 'logistica', 'prueba']
  function palabras(texto) {
    let lista = normalizar(texto).match(PALABRA) || [];
    for (const marca of MARCAS) lista = sinSecuencia(lista, marca);
    return lista.filter((p) => !CONECTORES.has(p));
  }
  const esGeneral = (lista) => !lista.some((p) => p.length >= 2 && !VACIAS.has(p));
  function general(puesto) { return esGeneral(palabras(puesto)); }
  // El puesto que el título tiene entero, como lo escribió la persona (el de más palabras; a igual largo, el primero), o null.
  function buscado(titulo, puestos) {
    const t = palabras(titulo);
    if (!t.length) return null;
    let mejor = null;
    let largo = 0;
    for (const p of puestos || []) {
      const f = palabras(p);
      if (f.length <= largo || esGeneral(f)) continue;
      for (let i = 0; i + f.length <= t.length; i += 1) {
        if (f.every((x, j) => t[i + j] === x)) { mejor = String(p).trim(); largo = f.length; break; }
      }
    }
    return mejor;
  }

  return { MARCAS, VACIAS, CONECTORES, palabras, general, buscado };
})();
