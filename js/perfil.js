/* Terna · js/perfil.js
   Mi perfil (diseno.md 0.19 §9.1, §9.2 y §10.17; brand.md 0.7 §6.6): desde PLAN-PREFERENCIAS (D2 y D5, 23/11/2026) es lo mínimo,
   quién sos y lo que va escrito en tu CV; toda la configuración está en Preferencias. Seis bloques, en este orden, también en
   primer uso:
   - Datos, sin subtemas: nombre, apellido, mail, ciudad, y teléfono y LinkedIn (opcionales: van en la línea de contacto del CV).
     #contacto, el subtema de antes, abre este bloque. Arriba de todo, debajo de la intro y fuera de los bloques, una línea con los
     links a Preferencias › Postulaciones (FEEDBACK-PREFERENCIAS P1-2; hasta ahí iba al final de Datos).
   - CV, con el CV original y el perfil estructurado (si existe).
   - Experiencia laboral, Estudios y cursos (con el promedio de cada carrera, opcional; D7) e Idiomas: cada ítem en su caja.
   - Tu cuenta: pausar (escribe en el acto) y cómo borrarla.
   Se mudaron a Preferencias › Postulaciones: Respuestas para formularios (js/respuestas.js; D2), Identificación, Dirección,
   Portfolio, GitHub y Analítico (js/formularios.js; D5). Sus anclas de antes redirigen ahí (abajo). Esta página ya no lee ni
   escribe la tabla preferencias, perfiles.portfolio ni github, las funciones de identificación y dirección ni el analítico.
   En celular cada bloque es un desplegable (cerrado, salvo los que tienen algo que falta) y "Guardar" va fijo abajo. Desde
   768 px: carril a la izquierda, con los subtemas debajo de su bloque, el bloque elegido a la derecha y "Guardar" arriba a la
   derecha en la cabecera fija. Un error al guardar muestra su bloque.
   Un "Guardar" para la página (perfil y listas); el CV se sube en el acto, el perfil estructurado tiene su propio "Guardar" y
   pausar la cuenta escribe en el acto. */
'use strict';

/* Lo que se mudó a Preferencias (PLAN-PREFERENCIAS §3.1): los links de antes llevan ahí, antes de armar nada. Ninguno va a
   #respuestas ni a #cuenta, que el js/preferencias.js de antes mandaba de vuelta acá: si durante los diez minutos de caché se
   juntaran este archivo y aquel, no habría vuelta infinita (esos hashes el archivo viejo no los conoce y abre la página arriba). */
(function () {
  const MUDADAS = { respuestas: 'formularios', identificacion: 'identificacion', formularios: 'datos-formularios', analitico: 'analitico' };
  const destino = MUDADAS[location.hash.slice(1)];
  if (destino) location.replace('preferencias.html#' + destino);
}());

Terna.pagina('perfil', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.perfil;
  const raiz = document.getElementById('perfil');
  const indicador = document.getElementById('indicador');
  // La intro, en una oración (PLAN-UX §3.5; T.perfil.intro): el texto es el de T, no el que trae el .html.
  const intro = document.querySelector('#contenido > p.intro');
  if (intro) intro.textContent = P.intro;
  // Debajo de la intro, mientras falte algo: qué hace falta para empezar (PLAN-PREFERENCIAS §4.6). Lo pinta dibujarIndicador.
  const minimo = h('p', { class: 'campo-ayuda perfil-minimo', hidden: true, text: P.minimo });
  /* Y siempre, dónde quedó lo que se mudó (FEEDBACK-PREFERENCIAS P1-2): fuera de los bloques, a la vista también en el celular. Las
     postulaciones a mano de antes dicen «Cargalo en Mi perfil › Identificación» (el texto es del motor y queda escrito así): quien lo
     sigue llega acá y no encuentra Identificación. Dos links: las respuestas y los datos, que caen en el DNI. */
  const mudados = h('p', { class: 'campo-ayuda datos-en-preferencias' }, P.datosEnPreferencias(
    h('a', { href: 'preferencias.html#formularios', text: P.datosEnPreferenciasLink }),
    h('a', { href: 'preferencias.html#identificacion', text: P.datosEnPreferenciasDatos })));
  if (intro) intro.after(minimo, mudados);
  const primerUso = new URLSearchParams(location.search).get('bienvenida') === '1';
  const MAX = { exp: config.max_experiencias || 15, est: config.max_estudios || 15, idi: config.max_idiomas || 10, cvMb: config.cv_max_mb || 5 };
  const RUTA_CV = uid + '/cv-original.pdf';
  // 0022: el tipo de cada estudio. Sin elegir, el que dice el nombre, con las mismas palabras que usa el motor (datos/titulos.json,
  // datos/secundario.json) y las de posgrado y terciario.
  const NIVELES_ESTUDIO = ['grado', 'posgrado', 'terciario', 'curso', 'secundario'];
  const NIVELES_CARRERA = ['grado', 'posgrado', 'terciario'];
  const sinTildes = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function nivelDelNombre(titulo, institucion) {
    const t = sinTildes(titulo);
    if (/\b(curso|taller|bootcamp|workshop|seminario|capacitacion|certificado|certificacion|webinar|diplomatura|diploma|clases de|nanodegree|specialization|course)\b/.test(t)) return 'curso';
    if (/\b(maestria|master|magister|mba|doctorado|phd|especializacion|posgrado|postgrado)\b/.test(t)) return 'posgrado';
    if (/\b(tecnicatura|tecnico superior|profesorado|terciario)\b/.test(t)) return 'terciario';
    if (/(secundari|bachiller|polimodal|high ?school|liceo|nivel medio|educacion media|secondary school)/.test(t + ' ' + sinTildes(institucion))) return 'secundario';
    return 'grado';
  }
  const anioHoy = Number(Terna.hoy().slice(0, 4));
  const mesHoy = Terna.hoy().slice(0, 7);

  const parar = Terna.cargando(raiz);
  const [rP, rE, rS, rI, rC] = await Promise.all([
    // Sin portfolio ni GitHub desde PLAN-PREFERENCIAS (D5): los lee y los escribe Preferencias (js/formularios.js). Si quedaran en el
    // update de acá, Mi perfil los pisaría con el valor viejo.
    sb.from('perfiles').select('nombre, apellido, telefono, ciudad, linkedin, perfil_estructurado, perfil_estructurado_en, cv_original_leido_en').eq('usuario_id', uid).maybeSingle(),
    sb.from('experiencias').select('id, puesto, empresa, desde, hasta, actual, descripcion, orden').eq('usuario_id', uid).order('orden').order('desde', { ascending: false }),
    sb.from('estudios').select('id, titulo, institucion, anio, estado, promedio, nivel, orden').eq('usuario_id', uid).order('orden'),
    sb.from('idiomas').select('id, idioma, nivel').eq('usuario_id', uid).order('creado_en'),
    sb.rpc('cv_original'),
  ]);
  parar();
  const errorCarga = rP.error || rE.error || rS.error || rI.error || rC.error;
  if (errorCarga) { Terna.errorDeCarga(raiz, errorCarga); return; }
  if (primerUso) {
    history.replaceState(null, '', location.pathname + location.hash);
    Terna.avisoBreve(T.cuenta.cuentaCreada);
  }

  let clave = 0;
  const nuevaClave = () => 'n' + (clave += 1);
  const perfil = rP.data || {};
  const datos = { nombre: perfil.nombre || '', apellido: perfil.apellido || '', telefono: perfil.telefono || '', ciudad: perfil.ciudad || '', linkedin: perfil.linkedin || '' };
  const listas = {
    exp: (rE.data || []).map((e) => Object.assign({ clave: nuevaClave() }, e, { descripcion: e.descripcion || '' })),
    // 0022: sin tipo elegido, se propone el que dice el nombre (como lo deduce el motor); se guarda cuando la persona guarda.
    est: (rS.data || []).map((e) => Object.assign({ clave: nuevaClave() }, e, { promedio: e.promedio || '', nivel: e.nivel || nivelDelNombre(e.titulo, e.institucion) })),
    idi: (rI.data || []).map((e) => Object.assign({ clave: nuevaClave() }, e)),
  };
  let originales = foto();
  let estructurado = perfil.perfil_estructurado || null;
  let cv = (Array.isArray(rC.data) ? rC.data[0] : rC.data) || null;
  let leidoEn = perfil.cv_original_leido_en || null;
  let faltantes = ctx.faltantes.slice();

  function foto() {
    const limpiar = (o, campos) => campos.map((k) => o[k] === undefined ? null : o[k]);
    return {
      datos: JSON.stringify(datos),
      exp: new Map(listas.exp.filter((e) => e.id).map((e, i) => [e.id, JSON.stringify(limpiar(e, ['puesto', 'empresa', 'desde', 'hasta', 'actual', 'descripcion']).concat(i))])),
      est: new Map(listas.est.filter((e) => e.id).map((e, i) => [e.id, JSON.stringify(limpiar(e, ['titulo', 'institucion', 'anio', 'estado', 'promedio', 'nivel']).concat(i))])),
      idi: new Map(listas.idi.filter((e) => e.id).map((e) => [e.id, JSON.stringify(limpiar(e, ['idioma', 'nivel']))])),
    };
  }

  /* ---------- Piezas de formulario ---------- */
  // `opcional`: al lado de la etiqueta, la marca chica y gris «Opcional» (PLAN-PREFERENCIAS §8.2): teléfono, LinkedIn y promedio.
  function campo({ id, etiqueta, valor, ayuda, max, tipo, autocomplete, readonly, inputmode, alCambiar, area, list, ejemplo, opcional }) {
    const idAyuda = ayuda ? id + '-ayuda' : null;
    const idError = id + '-error';
    const props = { class: 'control', id, value: valor === null || valor === undefined ? '' : String(valor), maxlength: max ? String(max) : null,
      autocomplete: autocomplete || null, readOnly: !!readonly, inputmode: inputmode || null, list: list || null, placeholder: ejemplo || null,
      'aria-describedby': [idAyuda, idError].filter(Boolean).join(' ') };
    const control = area ? h('textarea', Object.assign(props, { rows: '4' })) : h('input', Object.assign(props, { type: tipo || 'text' }));
    if (area) control.value = props.value;
    if (alCambiar) control.addEventListener('input', () => { alCambiar(control.value); limpiarError(id); });
    return h('div', { class: 'campo' }, h('label', { for: id }, etiqueta, opcional ? [' ', h('span', { class: 'marca-opcional', text: P.opcional })] : null), control,
      ayuda ? h('p', { class: 'campo-ayuda', id: idAyuda, text: ayuda }) : null, h('p', { class: 'campo-error', id: idError }));
  }
  function seleccion({ id, etiqueta, valor, opciones, alCambiar, vacio }) {
    const sel = h('select', { class: 'control', id, 'aria-describedby': id + '-error' },
      vacio !== undefined ? h('option', { value: '', text: vacio }) : null,
      opciones.map(([v, t]) => h('option', { value: v, text: t, selected: String(valor || '') === String(v) })));
    sel.addEventListener('change', () => { alCambiar(sel.value); limpiarError(id); });
    return h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), sel, h('p', { class: 'campo-error', id: id + '-error' }));
  }
  const pad = (n) => String(n).padStart(2, '0');
  function mesAnio({ id, etiqueta, valor, alCambiar, deshabilitado }) {
    const [a, m] = valor ? valor.split('-') : ['', ''];
    const anios = [];
    for (let x = anioHoy; x >= 1960; x -= 1) anios.push(x);
    const selMes = h('select', { class: 'control', id: id + '-mes', 'aria-label': etiqueta + ', ' + P.mes.toLowerCase(), disabled: !!deshabilitado, 'aria-describedby': id + '-error' },
      h('option', { value: '', text: P.mes }), P.meses.map((n, i) => h('option', { value: pad(i + 1), text: n, selected: m === pad(i + 1) })));
    const selAnio = h('select', { class: 'control', id: id + '-anio', 'aria-label': etiqueta + ', ' + P.anio.toLowerCase(), disabled: !!deshabilitado, 'aria-describedby': id + '-error' },
      h('option', { value: '', text: P.anio }), anios.map((x) => h('option', { value: String(x), text: String(x), selected: a === String(x) })));
    const avisar = () => { alCambiar(selMes.value && selAnio.value ? selAnio.value + '-' + selMes.value + '-01' : (selMes.value || selAnio.value ? 'incompleta' : null)); limpiarError(id); };
    selMes.addEventListener('change', avisar);
    selAnio.addEventListener('change', avisar);
    return h('fieldset', { class: 'campo' }, h('legend', { text: etiqueta }), h('div', { class: 'mes-anio' }, selMes, selAnio), h('p', { class: 'campo-error', id: id + '-error' }));
  }
  function marcarError(id, texto) {
    const err = document.getElementById(id + '-error');
    if (err) { err.textContent = texto; abrirSeccionDe(err); }
    for (const el of [document.getElementById(id), document.getElementById(id + '-mes'), document.getElementById(id + '-anio')]) if (el) el.setAttribute('aria-invalid', 'true');
    marcarCarril();
  }
  function limpiarError(id) {
    const err = document.getElementById(id + '-error');
    if (err && err.textContent) { err.textContent = ''; marcarCarril(); }
    for (const el of [document.getElementById(id), document.getElementById(id + '-mes'), document.getElementById(id + '-anio')]) if (el) el.removeAttribute('aria-invalid');
  }
  function boton(texto, iconoId, fn, clase, extra) {
    return h('button', Object.assign({ class: clase || 'btn btn-texto', type: 'button', onclick: fn }, extra || {}), iconoId ? icono(iconoId) : null, texto);
  }

  /* ---------- Indicador ----------
     #indicador conserva su texto. Al lado, fuera de él, "Completar perfil" (secundario: el primario de la página es Guardar)
     abre o elige el bloque del primer faltante y baja hasta él; solo si falta algo. Cada bloque con un faltante lleva el
     marbete "Falta" (PLAN-WEB.md §3.4). Desde 768 px el botón va en la cabecera fija; en el celular, arriba de los bloques,
     para que la cabecera pegada no crezca. */
  const FALTA = { nombre: ['datos', 'dato-nombre'], ciudad: ['datos', 'dato-ciudad'], experiencia: ['exp', 'agregar-exp'], idioma: ['idi', 'agregar-idi'] };
  const conCarril = window.matchMedia('(min-width: 768px)');
  const bCompletar = h('button', { class: 'btn btn-chico completar-perfil', type: 'button', hidden: true, text: T.bandas.completar });
  bCompletar.addEventListener('click', irAlFaltante);
  function irAlFaltante() {
    const f = faltantes.find((x) => FALTA[x]);
    if (!f) return;
    const [k, idFoco] = FALTA[f];
    const s = raiz.querySelector('section[data-plegable="' + k + '"]');
    if (!s) return;
    if (conCarril.matches) {
      const a = raiz.querySelector('nav.carril-bloques a[href="#' + HASH[k] + '"]');
      if (a) a.click();
    } else {
      const b = s.querySelector('.plegable-boton');
      if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
    }
    s.scrollIntoView({ block: 'start' });
    // El campo que falta o, en una lista vacía, "Agregar…"; si no está (la lista llegó a su tope), el bloque ya está a la vista.
    const el = document.getElementById(idFoco) || s.querySelector('input:not([type=hidden]), select, textarea, button:not(.plegable-boton)');
    if (el) el.focus({ preventScroll: true });
  }
  function ubicarCompletar() {
    if (conCarril.matches) indicador.after(bCompletar);
    else raiz.insertBefore(bCompletar, raiz.querySelector('.bloques-cuerpo'));
  }
  function dibujarIndicador() {
    Terna.vaciar(indicador);
    indicador.className = 'indicador ' + (faltantes.length ? 'falta' : 'completo');
    indicador.append(icono(faltantes.length ? 'i-por-decidir' : 'i-armado', 'icono-18'),
      faltantes.length ? P.falta(Terna.listaFaltantes(faltantes)) : P.completo);
    bCompletar.hidden = !faltantes.some((x) => FALTA[x]);
    minimo.hidden = !faltantes.length;
    const conFalta = new Set(faltantes.filter((x) => FALTA[x]).map((x) => FALTA[x][0]));
    for (const k of ['datos', 'cv', 'exp', 'est', 'idi', 'cuenta']) bloques.estado(k, conFalta.has(k) ? 'toca' : null, P.faltaCorto);
  }

  /* ---------- Bloques (diseno.md 0.19 §9.2 y §10.17) ----------
     Desplegables en celular, carril desde 768 px: lo hace Terna.porBloques (comun.js), igual que en Preferencias.
     Arrancan abiertos (o elegido el primero) los bloques con algo que falta para el perfil completo. */
  const abiertosAlEntrar = new Set();
  if (faltantes.includes('nombre') || faltantes.includes('ciudad')) abiertosAlEntrar.add('datos');
  if (faltantes.includes('experiencia')) { abiertosAlEntrar.add('exp'); abiertosAlEntrar.add('est'); }
  if (faltantes.includes('idioma')) abiertosAlEntrar.add('idi');
  const bloques = Terna.porBloques({ raiz, cabecera: document.getElementById('cabecera'), nombre: T.comun.pestanas.perfil, abiertos: abiertosAlEntrar });
  // Los hash de los bloques; los de los subtemas van en cada uno (#cv-original, #estructurado). #contacto, el subtema de antes,
  // es un alias de Datos. #respuestas, #identificacion, #formularios y #analitico redirigen a Preferencias (arriba de todo).
  const HASH ={ datos: 'datos', cv: 'cv', exp: 'experiencia', est: 'estudios', idi: 'idiomas', cuenta: 'cuenta' };
  const CUENTA = { exp: () => listas.exp.length, est: () => listas.est.length, idi: () => listas.idi.length };
  // El lomo de un bloque cerrado dice qué hay adentro, con lo que la persona cargó (PLAN-WEB.md §2.12 y §3.4). Sin nada, el
  // vacío que el bloque ya dice adentro ("Todavía no subiste tu CV."): un lomo en blanco parecía roto y escondía el CV, que es
  // lo más útil para quien empieza (revisión 2, P2-1).
  const unidos = (xs, con) => xs.map((x) => String(x || '').trim()).filter(Boolean).join(con || ', ');
  const RESUMEN = {
    datos: () => unidos([unidos([datos.nombre, datos.apellido], ' '), datos.ciudad]),
    cv: () => (cv ? P.cvCargado(Terna.fechaLarga(cv.subido_en)) : P.sinCv),
    exp: () => unidos(listas.exp.map((e) => e.puesto)) || P.sinExperiencia,
    est: () => unidos(listas.est.map((e) => e.titulo)) || P.sinEstudios,
    idi: () => unidos(listas.idi.map((e) => e.idioma)) || P.sinIdiomas,
    cuenta: () => ctx.usuario.mail || '',
  };
  const seccion = (k, titulo, cuerpo, extra) => bloques.bloque(k, titulo, cuerpo, Object.assign({ hash: HASH[k], cuenta: CUENTA[k], resumen: RESUMEN[k] }, extra || {}));
  const abrirSeccionDe = (el) => bloques.abrirDe(el);
  const marcarCarril = () => bloques.marcarErrores();
  const irAlPrimerError = () => bloques.irAlPrimerError();
  const actualizarCuentas = () => bloques.actualizarCuentas();

  /* ---------- Datos: quién sos y cómo te contactan (PLAN-PREFERENCIAS §8.2) ----------
     Sin subtemas desde PLAN-PREFERENCIAS: Identificación (con la dirección) y Respuestas para formularios se mudaron a Preferencias ›
     Postulaciones, igual que Portfolio y GitHub. Teléfono y LinkedIn quedan porque van escritos en el CV: llevan la marca «Opcional».
     Dónde quedó lo demás lo dice la línea de arriba de todo, debajo de la intro (FEEDBACK-PREFERENCIAS P1-2). */
  function bloqueDatos() {
    const c = (k, etiqueta, extra) => campo(Object.assign({ id: 'dato-' + k, etiqueta, valor: datos[k], alCambiar: (v) => { datos[k] = v; } }, extra));
    return seccion('datos', P.datos, [
      h('div', { class: 'dos' }, c('nombre', P.nombre, { max: 80, autocomplete: 'given-name' }), c('apellido', P.apellido, { max: 80, autocomplete: 'family-name' })),
      campo({ id: 'dato-mail', etiqueta: P.mail, valor: ctx.usuario.mail, ayuda: P.mailAyuda, readonly: true, tipo: 'email', autocomplete: 'email' }),
      c('ciudad', P.ciudad, { max: 80, autocomplete: 'address-level2', ayuda: P.ciudadAyuda }),
      h('div', { class: 'dos dos-apilable' },
        c('telefono', P.telefono, { max: 30, tipo: 'tel', autocomplete: 'tel', opcional: true, ayuda: P.enTuCv }),
        c('linkedin', P.linkedin, { max: 200, tipo: 'url', autocomplete: 'url', inputmode: 'url', opcional: true, ayuda: P.enTuCv })),
    ], { alias: ['contacto'] });
  }

  function enfocar(id) { const el = document.getElementById(id); if (el) el.focus(); }
  function moverEn(lista, i, d) { const j = i + d; if (j < 0 || j >= lista.length) return; [lista[i], lista[j]] = [lista[j], lista[i]]; }
  // La caja de un ítem de lista (diseno.md 0.19 §10.17): un grupo con su título ("1. Puesto · Empresa"), que se actualiza al escribir.
  function caja(p, titulo, ...cuerpo) {
    const idT = p + '-cabeza';
    return h('div', { class: 'bloque-lista', role: 'group', 'aria-labelledby': idT }, h('h3', { class: 'bloque-lista-titulo', id: idT, text: titulo }), cuerpo);
  }

  /* ---------- Experiencia laboral ---------- */
  function bloqueExperiencia() {
    const cont = h('div', { class: 'seccion', id: 'lista-exp' });
    const dibujarLista = (foco) => {
      Terna.vaciar(cont);
      if (!listas.exp.length) cont.append(h('p', { class: 'suave', text: P.sinExperiencia }));
      listas.exp.forEach((e, i) => {
        const p = 'exp-' + e.clave;
        const ponerTitulo = () => { const t = document.getElementById(p + '-cabeza'); if (t) t.textContent = P.tituloItem(i + 1, e.puesto, e.empresa, P.trabajoNuevo); };
        // Puesto y empresa, apilados en un teléfono: lado a lado se cortaban (revisión 2, P1-3).
        const b = caja(p, P.tituloItem(i + 1, e.puesto, e.empresa, P.trabajoNuevo),
          h('div', { class: 'dos dos-apilable' },
            campo({ id: p + '-puesto', etiqueta: P.puesto, valor: e.puesto, max: 120, alCambiar: (v) => { e.puesto = v; ponerTitulo(); } }),
            campo({ id: p + '-empresa', etiqueta: P.empresa, valor: e.empresa, max: 120, alCambiar: (v) => { e.empresa = v; ponerTitulo(); } })),
          h('div', { class: 'dos dos-apilable' },
            mesAnio({ id: p + '-desde', etiqueta: P.desde, valor: e.desde, alCambiar: (v) => { e.desde = v; } }),
            mesAnio({ id: p + '-hasta', etiqueta: P.hasta, valor: e.actual ? null : e.hasta, deshabilitado: e.actual, alCambiar: (v) => { e.hasta = v; } })),
          h('label', { class: 'casilla' }, h('input', { type: 'checkbox', id: p + '-actual', checked: !!e.actual, onchange: (ev) => { e.actual = ev.target.checked; if (e.actual) e.hasta = null; dibujarLista(p + '-actual'); } }), h('span', { text: P.actual })),
          campo({ id: p + '-descripcion', etiqueta: P.queHiciste, valor: e.descripcion, max: 2000, area: true, ayuda: P.queHicisteAyuda, alCambiar: (v) => { e.descripcion = v; } }),
          h('div', { class: 'botones' },
            boton(P.quitar, 'i-quitar', () => { listas.exp.splice(i, 1); dibujarLista(listas.exp[i] ? 'exp-' + listas.exp[i].clave + '-puesto' : 'agregar-exp'); }, 'btn btn-texto', { id: p + '-quitar' }),
            boton(P.subir, 'i-arriba', () => { if (i > 0) { moverEn(listas.exp, i, -1); dibujarLista(p + '-subir'); } }, 'btn btn-texto mover', { id: p + '-subir', 'aria-disabled': i === 0 ? 'true' : null }),
            boton(P.bajar, 'i-abajo', () => { if (i < listas.exp.length - 1) { moverEn(listas.exp, i, 1); dibujarLista(p + '-bajar'); } }, 'btn btn-texto mover', { id: p + '-bajar', 'aria-disabled': i === listas.exp.length - 1 ? 'true' : null })));
        cont.append(b);
      });
      if (listas.exp.length < MAX.exp) {
        cont.append(h('div', null, boton(P.agregarExperiencia, 'i-agregar', () => {
          const e = { clave: nuevaClave(), id: null, puesto: '', empresa: '', desde: null, hasta: null, actual: false, descripcion: '' };
          listas.exp.push(e);
          dibujarLista('exp-' + e.clave + '-puesto');
        }, 'btn', { id: 'agregar-exp' })));
      } else cont.append(h('p', { class: 'campo-ayuda', text: P.topeExperiencias(MAX.exp) }));
      actualizarCuentas();
      if (foco) enfocar(foco);
    };
    dibujarLista();
    return seccion('exp', P.experiencia, cont);
  }

  /* ---------- Estudios y cursos ---------- */
  function bloqueEstudios() {
    const cont = h('div', { class: 'seccion' });
    const dibujarLista = (foco) => {
      Terna.vaciar(cont);
      if (!listas.est.length) cont.append(h('p', { class: 'suave', text: P.sinEstudios }));
      listas.est.forEach((e, i) => {
        const p = 'est-' + e.clave;
        const ponerTitulo = () => { const t = document.getElementById(p + '-cabeza'); if (t) t.textContent = P.tituloItem(i + 1, e.titulo, e.institucion, P.estudioNuevo); };
        // El promedio es de una carrera (0022): para un curso o el secundario no se muestra y no se guarda.
        // Sirve solo para formularios, pero es un campo de cada estudio: se queda acá, «Opcional» (PLAN-PREFERENCIAS D7), y
        // Preferencias › Postulaciones lo muestra de solo lectura.
        const promedio = campo({ id: p + '-promedio', etiqueta: P.promedio, valor: e.promedio, max: 20, ayuda: P.promedioAyuda, opcional: true, alCambiar: (v) => { e.promedio = v; } });
        const mostrarPromedio = () => { promedio.hidden = !NIVELES_CARRERA.includes(e.nivel); };
        mostrarPromedio();
        cont.append(caja(p, P.tituloItem(i + 1, e.titulo, e.institucion, P.estudioNuevo),
          seleccion({ id: p + '-nivel', etiqueta: P.tipoEstudio, valor: e.nivel, opciones: NIVELES_ESTUDIO.map((n) => [n, P.tiposEstudio[n]]),
            alCambiar: (v) => { e.nivel = v; mostrarPromedio(); } }),
          h('p', { class: 'campo-ayuda', text: P.tipoEstudioAyuda }),
          campo({ id: p + '-titulo', etiqueta: P.titulo_, valor: e.titulo, max: 160, ayuda: P.tituloAyuda, alCambiar: (v) => { e.titulo = v; ponerTitulo(); } }),
          campo({ id: p + '-institucion', etiqueta: P.institucion, valor: e.institucion, max: 160, alCambiar: (v) => { e.institucion = v; ponerTitulo(); } }),
          h('div', { class: 'dos dos-apilable' },
            campo({ id: p + '-anio', etiqueta: P.anio, valor: e.anio, tipo: 'number', inputmode: 'numeric', ayuda: P.anioAyuda, alCambiar: (v) => { e.anio = v; } }),
            seleccion({ id: p + '-estado', etiqueta: P.estado, valor: e.estado || 'terminado', opciones: [['terminado', P.terminado], ['en_curso', P.enCurso]], alCambiar: (v) => { e.estado = v; } })),
          promedio,
          h('div', { class: 'botones' }, boton(P.quitar, 'i-quitar', () => { listas.est.splice(i, 1); dibujarLista(listas.est[i] ? 'est-' + listas.est[i].clave + '-titulo' : 'agregar-est'); }))));
      });
      if (listas.est.length < MAX.est) {
        cont.append(h('div', null, boton(P.agregarEstudio, 'i-agregar', () => {
          const e = { clave: nuevaClave(), id: null, titulo: '', institucion: '', anio: null, estado: 'terminado', promedio: '', nivel: 'grado' };
          listas.est.push(e);
          dibujarLista('est-' + e.clave + '-nivel');
        }, 'btn', { id: 'agregar-est' })));
      } else cont.append(h('p', { class: 'campo-ayuda', text: P.topeEstudios(MAX.est) }));
      actualizarCuentas();
      if (foco) enfocar(foco);
    };
    dibujarLista();
    return seccion('est', P.estudios, cont);
  }

  /* ---------- Idiomas: cada uno en su caja, sin título (el idioma y el nivel ya lo dicen) ---------- */
  function bloqueIdiomas() {
    const cont = h('div', { class: 'seccion' });
    const sugeridos = h('datalist', { id: 'idiomas-sugeridos' }, P.idiomasSugeridos.map((x) => h('option', { value: x })));
    const niveles = Object.entries(P.niveles);
    const dibujarLista = (foco) => {
      Terna.vaciar(cont);
      cont.append(sugeridos);
      if (!listas.idi.length) cont.append(h('p', { class: 'suave', text: P.sinIdiomas }));
      listas.idi.forEach((e, i) => {
        const p = 'idi-' + e.clave;
        cont.append(h('div', { class: 'bloque-lista' },
          h('div', { class: 'dos' },
            campo({ id: p + '-idioma', etiqueta: P.idioma, valor: e.idioma, max: 40, list: 'idiomas-sugeridos', alCambiar: (v) => { e.idioma = v; } }),
            seleccion({ id: p + '-nivel', etiqueta: P.nivel, valor: e.nivel, opciones: niveles, vacio: '', alCambiar: (v) => { e.nivel = v; } })),
          h('div', { class: 'botones' }, boton(P.quitar, 'i-quitar', () => { listas.idi.splice(i, 1); dibujarLista(listas.idi[i] ? 'idi-' + listas.idi[i].clave + '-idioma' : 'agregar-idi'); }))));
      });
      if (listas.idi.length < MAX.idi) {
        cont.append(h('div', null, boton(P.agregarIdioma, 'i-agregar', () => {
          const e = { clave: nuevaClave(), id: null, idioma: '', nivel: '' };
          listas.idi.push(e);
          dibujarLista('idi-' + e.clave + '-idioma');
        }, 'btn', { id: 'agregar-idi' })));
      } else cont.append(h('p', { class: 'campo-ayuda', text: P.topeIdiomas(MAX.idi) }));
      actualizarCuentas();
      if (foco) enfocar(foco);
    };
    dibujarLista();
    return seccion('idi', P.idiomas, cont);
  }

  /* ---------- CV: el CV original y el perfil estructurado (si existe), uno debajo del otro ----------
     El analítico, que iba tercero, está en Preferencias › Postulaciones › Datos para formularios desde PLAN-PREFERENCIAS (D5). */
  function bloqueCv() {
    const original = Terna.subtema(P.cv, null, partesCv());
    const partes = [original];
    const temas = [{ hash: 'cv-original', titulo: P.cv, nodo: original }];
    if (estructurado) {
      const t = Terna.subtema(P.estructurado, null, partesEstructurado());
      partes.push(t);
      temas.push({ hash: 'estructurado', titulo: P.estructurado, nodo: t });
    }
    return seccion('cv', P.cvBloque, partes, { temas });
  }

  function partesCv() {
    const cont = h('div', { class: 'seccion' });
    const estado = h('p', { class: 'campo-ayuda', role: 'status' });
    const error = h('p', { class: 'campo-error', role: 'alert' });
    const archivo = h('input', { type: 'file', accept: 'application/pdf,.pdf', class: 'oculto-visual', tabindex: '-1', 'aria-hidden': 'true' });
    const elegir = () => { error.textContent = ''; archivo.click(); };
    archivo.addEventListener('change', async () => {
      const f = archivo.files && archivo.files[0];
      archivo.value = '';
      if (!f) return;
      const esPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      if (!esPdf || f.size > MAX.cvMb * 1048576) { error.textContent = T.errores.cvArchivo(MAX.cvMb); return; }
      estado.textContent = P.subiendo;
      const { error: e } = await sb.storage.from(Terna.CONFIG.bucket).upload(RUTA_CV, f, { upsert: true, contentType: 'application/pdf', cacheControl: '0' });
      estado.textContent = '';
      if (e) { if (!Terna.siSesionVencida(e)) error.textContent = T.errores.cvSubir; return; }
      const r = await sb.rpc('cv_original');
      cv = (Array.isArray(r.data) ? r.data[0] : r.data) || { subido_en: new Date().toISOString() };
      leidoEn = null;
      dibujar();
      Terna.avisoBreve(T.comun.guardado);
      enfocar('cv-ver');
    });
    const dibujar = () => {
      Terna.vaciar(cont);
      if (cv) {
        cont.append(h('p', { text: P.cvCargado(Terna.fechaLarga(cv.subido_en)) }),
          h('div', { class: 'botones' },
            Terna.linkFirmado(RUTA_CV, null, h('a', { class: 'btn btn-texto', id: 'cv-ver' }, icono('i-revisar'), P.ver)),
            boton(P.reemplazar, 'i-subir', elegir, 'btn btn-texto'),
            boton(P.quitar, 'i-quitar', async () => {
              const { error: e } = await sb.storage.from(Terna.CONFIG.bucket).remove([RUTA_CV]);
              if (e) { if (!Terna.siSesionVencida(e)) Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
              cv = null;
              dibujar();
              Terna.avisoBreve(T.comun.guardado);
              enfocar('cv-subir');
            }, 'btn btn-texto')));
        if (!leidoEn || (cv.subido_en && new Date(leidoEn) < new Date(cv.subido_en))) cont.append(h('p', { class: 'campo-ayuda', text: P.cvPendiente }));
      } else {
        cont.append(h('p', { class: 'suave', text: P.sinCv }),
          boton(P.subirCv(MAX.cvMb), 'i-subir', elegir, 'btn btn-ancho', { id: 'cv-subir' }));
      }
      cont.append(h('p', { class: 'campo-ayuda', text: P.cvAyuda }), estado, error, archivo);
    };
    dibujar();
    return cont;
  }

  /* Perfil estructurado: lo que Terna lee (cuatro partes editables). */
  function partesEstructurado() {
    const cont = h('div', { class: 'seccion' });
    const certNombre = (c) => (c && typeof c === 'object' ? c.nombre : c) || '';
    const lectura = () => {
      Terna.vaciar(cont);
      const e = estructurado || {};
      const fila = (t, v) => (v ? h('div', null, h('dt', { class: 'campo-etiqueta', text: t }), h('dd', { text: v })) : null);
      cont.append(h('p', { class: 'intro', text: P.estructuradoIntro }),
        h('dl', { class: 'respuestas' },
          fila(P.tituloActual, e.titulo_actual), fila(P.resumen, e.resumen_propio),
          fila(P.habilidades, (e.skills || []).join(', ')), fila(P.certificaciones, (e.certificaciones || []).map(certNombre).filter(Boolean).join(', '))),
        h('p', { class: 'campo-ayuda', text: P.estructuradoAyuda }),
        h('div', null, boton(P.editar, null, edicion, 'btn', { id: 'estr-editar' })));
    };
    const edicion = () => {
      Terna.vaciar(cont);
      const e = estructurado || {};
      const v = { titulo: e.titulo_actual || '', resumen: e.resumen_propio || '', skills: (e.skills || []).join('\n'), certs: (e.certificaciones || []).map(certNombre).join('\n') };
      const errBanda = h('p', { class: 'campo-error', role: 'alert' });
      cont.append(
        campo({ id: 'estr-titulo', etiqueta: P.tituloActual, valor: v.titulo, max: 90, alCambiar: (x) => { v.titulo = x; } }),
        campo({ id: 'estr-resumen', etiqueta: P.resumen, valor: v.resumen, max: 600, area: true, alCambiar: (x) => { v.resumen = x; } }),
        campo({ id: 'estr-skills', etiqueta: P.habilidades, valor: v.skills, area: true, ayuda: P.unaPorLinea, alCambiar: (x) => { v.skills = x; } }),
        campo({ id: 'estr-certs', etiqueta: P.certificaciones, valor: v.certs, area: true, ayuda: P.unaPorLinea, alCambiar: (x) => { v.certs = x; } }),
        errBanda,
        h('div', { class: 'botones' },
          boton(T.comun.guardar, null, async () => {
            const lineas = (t) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
            const skills = lineas(v.skills);
            const certs = lineas(v.certs);
            let ok = true;
            if (skills.length > 60) { marcarError('estr-skills', P.topeHabilidades(60)); ok = false; }
            else if (skills.some((x) => x.length > 40)) { marcarError('estr-skills', T.errores.guardarCampos); ok = false; }
            if (certs.length > 20) { marcarError('estr-certs', P.topeCertificaciones(20)); ok = false; }
            else if (certs.some((x) => x.length > 120)) { marcarError('estr-certs', T.errores.guardarCampos); ok = false; }
            if (!ok) { errBanda.textContent = T.errores.guardarCampos; return; }
            const previas = (estructurado && estructurado.certificaciones) || [];
            const nuevo = Object.assign({}, estructurado || {}, {
              titulo_actual: v.titulo.trim() || null,
              resumen_propio: v.resumen.trim() || null,
              skills,
              certificaciones: certs.map((n) => { const p = previas.find((c) => certNombre(c) === n); return p && typeof p === 'object' ? p : { nombre: n }; }),
            });
            const { error } = await sb.from('perfiles').update({ perfil_estructurado: nuevo }).eq('usuario_id', uid);
            if (error) { if (!Terna.siSesionVencida(error)) errBanda.textContent = T.errores.guardar; return; }
            estructurado = nuevo;
            lectura();
            Terna.avisoBreve(T.comun.guardado);
            enfocar('estr-editar');
          }, 'btn btn-primario'),
          boton(T.comun.cancelar, null, () => { lectura(); enfocar('estr-editar'); }, 'btn')));
      enfocar('estr-titulo');
    };
    lectura();
    return cont;
  }

  /* ---------- Tu cuenta: pausar (escribe en el acto) y borrar (hasta 0.18 en Preferencias) ---------- */
  function bloqueCuenta() {
    const pz = Terna.piezas({ prefijo: 'cuenta', nivel: 'h3' });
    const bPausa = h('button', { class: 'btn', type: 'button', id: 'pausar-cuenta' });
    function dibujarPausa() {
      Terna.vaciar(bPausa);
      const pausada = Terna.estado.usuario.estado === 'pausado';
      bPausa.append(icono(pausada ? 'i-reanudar' : 'i-pausar'), pausada ? P.reanudarCuenta : P.pausarCuenta);
    }
    bPausa.addEventListener('click', async () => {
      const pausada = Terna.estado.usuario.estado === 'pausado';
      if (await Terna.cambiarEstadoCuenta(pausada ? 'activo' : 'pausado', bPausa)) { dibujarPausa(); bPausa.focus(); }
    });
    document.addEventListener('terna:estado-cuenta', dibujarPausa);
    dibujarPausa();
    return seccion('cuenta', P.cuenta, [pz.item(P.pausar, h('p', { text: P.pausarTexto }), h('div', null, bPausa)), pz.item(P.borrar, h('p', { text: P.borrarTexto }))]);
  }

  /* ---------- Guardar ---------- */
  const banda = h('div', { class: 'banda banda-error', role: 'alert', tabindex: '-1', hidden: true });
  const estadoGuardado = h('p', { class: 'estado-guardado', role: 'status' });
  const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'button' }, T.comun.guardar);
  /* La banda lleva, debajo, el primer error como link (revisión 2, P1-1; como en B2): "Idioma: Completá este campo." abre su
     bloque y pone el foco en el campo. En el celular el campo quedaba dos o tres pantallas más abajo. Es navegación dentro de la
     página: el texto es el del error y el nombre del campo, y el foco sigue yendo primero a la banda. */
  function linkAlError(err) {
    const descrito = err.id ? raiz.querySelector('[aria-describedby~="' + err.id + '"]') : null;
    const zona = err.closest('.campo, .subbloque, .subtema, .seccion');
    const destino = descrito && descrito.matches('input, select, textarea') ? descrito
      : (descrito || zona || err).querySelector('input:not([type=hidden]):not([readonly]), select, textarea, button');
    const leyenda = err.closest('fieldset') && err.closest('fieldset').querySelector('legend');
    const titulo = err.closest('.subbloque') && err.closest('.subbloque').querySelector('h3, h4');
    const nombre = ((leyenda && leyenda.textContent) || (destino && destino.labels && destino.labels[0] && destino.labels[0].textContent)
      || (destino && destino.getAttribute('aria-label')) || (titulo && titulo.textContent) || '').trim();
    const a = h('a', { class: 'banda-ir', href: '#' + (err.id || '') }, (nombre ? nombre + ': ' : '') + err.textContent.trim());
    a.addEventListener('click', (e) => {
      e.preventDefault();
      abrirSeccionDe(err);
      irAlPrimerError();
      if (destino) destino.focus();
      else err.scrollIntoView({ block: 'center' });
    });
    return a;
  }
  function mostrarBanda(texto) {
    Terna.vaciar(banda);
    const err = Array.from(raiz.querySelectorAll('.campo-error')).find((e) => e.textContent.trim());
    banda.append(icono('i-alerta'), h('span', { class: 'banda-textos' }, h('span', { text: texto }), err ? linkAlError(err) : null));
    banda.hidden = false;
    irAlPrimerError();
    banda.focus();
  }

  function validar() {
    let ok = true;
    const req = (id, v) => { if (!String(v || '').trim()) { marcarError(id, T.errores.completa); ok = false; } };
    listas.exp.forEach((e) => {
      const p = 'exp-' + e.clave;
      req(p + '-puesto', e.puesto); req(p + '-empresa', e.empresa);
      if (!e.desde || e.desde === 'incompleta') { marcarError(p + '-desde', T.errores.completa); ok = false; }
      else if (e.desde.slice(0, 7) > mesHoy) { marcarError(p + '-desde', T.errores.fechaFutura); ok = false; }
      if (!e.actual) {
        if (!e.hasta || e.hasta === 'incompleta') { marcarError(p + '-hasta', T.errores.completa); ok = false; }
        else if (e.desde && e.desde !== 'incompleta' && e.hasta < e.desde) { marcarError(p + '-hasta', T.errores.fechaFinAnterior); ok = false; }
      }
    });
    listas.est.forEach((e) => {
      const p = 'est-' + e.clave;
      req(p + '-titulo', e.titulo); req(p + '-institucion', e.institucion);
      if (e.anio !== null && e.anio !== '' && e.anio !== undefined) {
        const n = Number(e.anio);
        if (!Number.isInteger(n) || n < 1950 || n > 2100) { marcarError(p + '-anio', T.errores.guardarCampos); ok = false; }
      }
    });
    const vistos = new Set();
    listas.idi.forEach((e) => {
      const p = 'idi-' + e.clave;
      req(p + '-idioma', e.idioma);
      if (!e.nivel) { marcarError(p + '-nivel', T.errores.completa); ok = false; }
      const k = String(e.idioma || '').trim().toLowerCase();
      if (k && vistos.has(k)) { marcarError(p + '-idioma', T.errores.guardarCampos); ok = false; }
      vistos.add(k);
    });
    return ok;
  }
  const ERROR_CAMPO = { fecha_futura: ['-desde', T.errores.fechaFutura], fecha_fin_anterior: ['-hasta', T.errores.fechaFinAnterior] };

  async function guardar() {
    banda.hidden = true;
    estadoGuardado.textContent = '';
    if (!validar()) { mostrarBanda(T.errores.guardarCampos); return; }
    bGuardar.setAttribute('aria-disabled', 'true');
    const eraIncompleto = faltantes.length > 0;
    try {
      // 1. Datos. Sin portfolio ni GitHub desde PLAN-PREFERENCIAS: los escribe Preferencias (js/formularios.js).
      if (JSON.stringify(datos) !== originales.datos) {
        const v = (x) => (String(x || '').trim() || null);
        const cambios = { nombre: v(datos.nombre), apellido: v(datos.apellido), telefono: v(datos.telefono), ciudad: v(datos.ciudad), linkedin: v(datos.linkedin) };
        const { error } = await sb.from('perfiles').update(cambios).eq('usuario_id', uid);
        if (error) throw error;
        Terna.actualizarPerfil({ nombre: v(datos.nombre), apellido: v(datos.apellido) });
      }
      // 2. Listas: primero lo que se quitó (por los topes), después lo que cambió y al final lo nuevo.
      await guardarLista('experiencias', listas.exp, originales.exp, (e, i) => ({ puesto: e.puesto.trim(), empresa: e.empresa.trim(), desde: e.desde, hasta: e.actual ? null : e.hasta, actual: !!e.actual, descripcion: (e.descripcion || '').trim() || null, orden: i }),
        (e, i) => JSON.stringify([e.puesto, e.empresa, e.desde, e.actual ? null : e.hasta, !!e.actual, e.descripcion || ''].concat(i)), 'exp');
      await guardarLista('estudios', listas.est, originales.est, (e, i) => ({ titulo: e.titulo.trim(), institucion: e.institucion.trim(), anio: e.anio === '' || e.anio === null || e.anio === undefined ? null : Number(e.anio), estado: e.estado || 'terminado',
        promedio: NIVELES_CARRERA.includes(e.nivel) ? (String(e.promedio || '').trim() || null) : null, nivel: e.nivel || null, orden: i }),
        (e, i) => JSON.stringify([e.titulo, e.institucion, e.anio === '' || e.anio === undefined ? null : (e.anio === null ? null : Number(e.anio)), e.estado || 'terminado', e.promedio || '', e.nivel || null].concat(i)), 'est');
      await guardarLista('idiomas', listas.idi, originales.idi, (e) => ({ idioma: e.idioma.trim(), nivel: e.nivel }),
        (e) => JSON.stringify([e.idioma, e.nivel]), 'idi');
    } catch (error) {
      bGuardar.removeAttribute('aria-disabled');
      if (Terna.siSesionVencida(error)) return;
      const claveError = String(error.message || '').trim();
      if (error._item && ERROR_CAMPO[claveError]) { marcarError(error._item + ERROR_CAMPO[claveError][0], ERROR_CAMPO[claveError][1]); mostrarBanda(T.errores.guardarCampos); return; }
      mostrarBanda(['limite_experiencias', 'limite_estudios', 'limite_idiomas'].includes(claveError) ? Terna.textoError(error) : T.errores.guardar);
      return;
    }
    originales = foto();
    marcarCarril();
    const r = await sb.rpc('perfil_faltantes');
    bGuardar.removeAttribute('aria-disabled');
    if (!r.error) { faltantes = r.data || []; Terna.actualizarFaltantes(faltantes); dibujarIndicador(); }
    if (eraIncompleto && !faltantes.length) {
      // Lo que queda para revisar, opcional, es qué busca Terna: Preferencias › Empleos (PLAN-PREFERENCIAS §3.2).
      Terna.vaciar(estadoGuardado);
      estadoGuardado.append(T.perfil.guardadoBusca + ' ', h('a', { href: 'preferencias.html#empleos', text: P.revisarPrefs }));
    } else {
      Terna.avisoBreve(T.comun.guardado);
    }
  }
  async function guardarLista(tabla, items, orig, fila, firma, prefijo) {
    const ids = new Set(items.filter((e) => e.id).map((e) => e.id));
    const quitar = Array.from(orig.keys()).filter((id) => !ids.has(id));
    if (quitar.length) {
      const { error } = await sb.from(tabla).delete().in('id', quitar);
      if (error) throw error;
    }
    for (let i = 0; i < items.length; i += 1) {
      const e = items[i];
      if (!e.id || orig.get(e.id) === firma(e, i)) continue;
      const { error } = await sb.from(tabla).update(fila(e, i)).eq('id', e.id);
      if (error) throw Object.assign(error, { _item: prefijo + '-' + e.clave });
    }
    for (let i = 0; i < items.length; i += 1) {
      const e = items[i];
      if (e.id) continue;
      const { data, error } = await sb.from(tabla).insert(Object.assign({ usuario_id: uid }, fila(e, i))).select('id').single();
      if (error) throw Object.assign(error, { _item: prefijo + '-' + e.clave });
      e.id = data.id;
    }
  }
  bGuardar.addEventListener('click', guardar);

  /* ---------- Página ---------- */
  Terna.vaciar(raiz);
  bloqueDatos(); bloqueCv(); bloqueExperiencia(); bloqueEstudios(); bloqueIdiomas(); bloqueCuenta();
  bloques.montar({ arriba: [banda], debajo: h('p', { class: 'campo-ayuda perfil-privacidad', text: P.privacidad }),
    guardar: h('div', { class: 'guardar-fijo' }, estadoGuardado, bGuardar) });
  dibujarIndicador();
  ubicarCompletar();
  conCarril.addEventListener('change', ubicarCompletar);
});
