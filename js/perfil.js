/* Terna · js/perfil.js
   Mi perfil (diseno.md 0.5 §9.1 y §9.2; brand.md §6.6): datos, CV original, perfil estructurado, datos para formularios,
   experiencia, estudios e idiomas, en ese orden también en primer uso. En celular cada bloque es un desplegable (cerrado,
   salvo los que tienen algo que falta) y "Guardar" va fijo abajo. Desde 768 px: carril a la izquierda, el bloque elegido
   a la derecha y "Guardar" arriba a la derecha en la cabecera fija. Un error al guardar muestra su bloque.
   Un "Guardar" para la página; el CV se sube en el acto y el perfil estructurado tiene su propio "Guardar". */
'use strict';

Terna.pagina('perfil', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.perfil;
  const raiz = document.getElementById('perfil');
  const indicador = document.getElementById('indicador');
  const primerUso = new URLSearchParams(location.search).get('bienvenida') === '1';
  const MAX = { exp: config.max_experiencias || 15, est: config.max_estudios || 15, idi: config.max_idiomas || 10, cvMb: config.cv_max_mb || 5 };
  const RUTA_CV = uid + '/cv-original.pdf';
  const anioHoy = Number(Terna.hoy().slice(0, 4));
  const mesHoy = Terna.hoy().slice(0, 7);

  const parar = Terna.cargando(raiz);
  const [rP, rE, rS, rI, rC] = await Promise.all([
    sb.from('perfiles').select('nombre, apellido, telefono, ciudad, linkedin, perfil_estructurado, perfil_estructurado_en, cv_original_leido_en').eq('usuario_id', uid).maybeSingle(),
    sb.from('experiencias').select('id, puesto, empresa, desde, hasta, actual, descripcion, orden').eq('usuario_id', uid).order('orden').order('desde', { ascending: false }),
    sb.from('estudios').select('id, titulo, institucion, anio, estado, orden').eq('usuario_id', uid).order('orden'),
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
    est: (rS.data || []).map((e) => Object.assign({ clave: nuevaClave() }, e)),
    idi: (rI.data || []).map((e) => Object.assign({ clave: nuevaClave() }, e)),
  };
  let originales = foto();
  let estructurado = perfil.perfil_estructurado || null;
  let cv = (Array.isArray(rC.data) ? rC.data[0] : rC.data) || null;
  let leidoEn = perfil.cv_original_leido_en || null;
  let faltantes = ctx.faltantes.slice();
  const formularios = { cargado: false, dni: '', cuil: '', fecha: '', original: null };

  function foto() {
    const limpiar = (o, campos) => campos.map((k) => o[k] === undefined ? null : o[k]);
    return {
      datos: JSON.stringify(datos),
      exp: new Map(listas.exp.filter((e) => e.id).map((e, i) => [e.id, JSON.stringify(limpiar(e, ['puesto', 'empresa', 'desde', 'hasta', 'actual', 'descripcion']).concat(i))])),
      est: new Map(listas.est.filter((e) => e.id).map((e, i) => [e.id, JSON.stringify(limpiar(e, ['titulo', 'institucion', 'anio', 'estado']).concat(i))])),
      idi: new Map(listas.idi.filter((e) => e.id).map((e) => [e.id, JSON.stringify(limpiar(e, ['idioma', 'nivel']))])),
    };
  }

  /* ---------- Piezas de formulario ---------- */
  function campo({ id, etiqueta, valor, ayuda, max, tipo, autocomplete, readonly, inputmode, alCambiar, area, list }) {
    const idAyuda = ayuda ? id + '-ayuda' : null;
    const idError = id + '-error';
    const props = { class: 'control', id, value: valor === null || valor === undefined ? '' : String(valor), maxlength: max ? String(max) : null,
      autocomplete: autocomplete || null, readOnly: !!readonly, inputmode: inputmode || null, list: list || null,
      'aria-describedby': [idAyuda, idError].filter(Boolean).join(' ') };
    const control = area ? h('textarea', Object.assign(props, { rows: '4' })) : h('input', Object.assign(props, { type: tipo || 'text' }));
    if (area) control.value = props.value;
    if (alCambiar) control.addEventListener('input', () => { alCambiar(control.value); limpiarError(id); });
    return h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), control,
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

  /* ---------- Indicador ---------- */
  function dibujarIndicador() {
    Terna.vaciar(indicador);
    indicador.className = 'indicador ' + (faltantes.length ? 'falta' : 'completo');
    indicador.append(icono(faltantes.length ? 'i-por-decidir' : 'i-armado', 'icono-18'),
      faltantes.length ? P.falta(Terna.listaFaltantes(faltantes)) : P.completo);
  }

  /* ---------- Bloques (diseno.md 0.5 §9.2) ----------
     Hasta 767 px cada bloque es un desplegable: arrancan cerrados salvo los que tienen algo que falta.
     Desde 768 px, el carril de la izquierda elige un bloque y a la derecha se ve ese bloque entero (modo carril).
     El bloque es el mismo en los dos modos: solo cambia qué se oculta. La URL lleva el bloque (#experiencia). */
  const HASH = { datos: 'datos', cv: 'cv', estr: 'estructurado', form: 'formularios', exp: 'experiencia', est: 'estudios', idi: 'idiomas' };
  const CUENTA = { exp: () => listas.exp.length, est: () => listas.est.length, idi: () => listas.idi.length };
  const escritorio = window.matchMedia('(min-width: 768px)');
  const abiertosAlEntrar = new Set();
  if (faltantes.includes('nombre') || faltantes.includes('ciudad')) abiertosAlEntrar.add('datos');
  if (faltantes.includes('experiencia')) { abiertosAlEntrar.add('exp'); abiertosAlEntrar.add('est'); }
  if (faltantes.includes('idioma')) abiertosAlEntrar.add('idi');
  const plegables = {};
  const orden = [];
  let modoCarril = false;
  let elegido = null;
  const carril = h('nav', { class: 'carril carril-perfil', 'aria-label': T.comun.pestanas.perfil });

  // El h2 lleva el botón del desplegable (celular) y el mismo título sin botón (modo carril); el CSS muestra uno.
  // alAbrir corre cada vez que el bloque se abre o se elige (Datos para formularios lo usa para descifrar recién ahí).
  function seccion(claveSec, titulo, cuerpo, alAbrir) {
    const id = 'h-' + claveSec;
    const idPanel = 'panel-' + HASH[claveSec];
    const p = { abierta: abiertosAlEntrar.has(claveSec), alAbrir };
    p.panel = h('div', { class: 'seccion', id: idPanel, hidden: !p.abierta }, cuerpo);
    p.boton = h('button', { class: 'plegable-boton', type: 'button', 'aria-expanded': String(p.abierta), 'aria-controls': idPanel },
      h('span', { class: 'tarjeta-titulo', id, text: titulo }), icono('i-chevron'));
    p.boton.addEventListener('click', () => plegar(claveSec, !p.abierta));
    p.seccion = h('section', { class: 'tarjeta seccion', 'aria-labelledby': id, dataset: { plegable: claveSec } },
      h('h2', { class: 'plegable-titulo' }, p.boton, h('span', { class: 'tarjeta-titulo titulo-fijo', text: titulo })), p.panel);
    p.n = CUENTA[claveSec] ? h('span', { class: 'n' }) : null;
    p.alerta = icono('i-alerta', 'icono-16 carril-alerta');
    p.alerta.setAttribute('hidden', ''); // un <svg> no tiene la propiedad hidden: va el atributo
    p.link = h('a', { href: '#' + HASH[claveSec], onclick: (e) => { e.preventDefault(); elegir(claveSec, true); } },
      h('span', { text: titulo }), p.alerta, p.n);
    plegables[claveSec] = p;
    orden.push(claveSec);
    return p.seccion;
  }
  function plegar(k, abrir) {
    const p = plegables[k];
    p.abierta = abrir;
    if (modoCarril) return;
    p.boton.setAttribute('aria-expanded', String(abrir));
    p.panel.hidden = !abrir;
    if (abrir && p.alAbrir) p.alAbrir();
  }
  function elegir(k, desdeCarril) {
    elegido = k;
    if (!modoCarril) return;
    for (const x of orden) {
      plegables[x].seccion.hidden = x !== k;
      plegables[x].link.setAttribute('aria-current', x === k ? 'true' : 'false');
    }
    if (plegables[k].alAbrir) plegables[k].alAbrir();
    if (desdeCarril) {
      history.replaceState(null, '', '#' + HASH[k]);
      const s = plegables[k].seccion;
      if (s.getBoundingClientRect().top < parseFloat(document.documentElement.style.scrollPaddingTop || '0')) s.scrollIntoView({ block: 'start' });
    }
  }
  function abrirSeccionDe(el) {
    const s = el && el.closest('section[data-plegable]');
    if (s && plegables[s.dataset.plegable] && !modoCarril) plegar(s.dataset.plegable, true);
  }
  const conError = (k) => Array.from(plegables[k].seccion.querySelectorAll('.campo-error')).some((e) => e.textContent);
  // En modo carril se ve un bloque por vez: el carril marca los que tienen errores y se muestra el primero.
  function marcarCarril() { for (const k of orden) plegables[k].alerta.toggleAttribute('hidden', !conError(k)); }
  function irAlPrimerError() {
    const k = orden.find(conError);
    if (k && modoCarril && k !== elegido) elegir(k, true);
  }
  function actualizarCuentas() {
    for (const k of orden) if (plegables[k].n) plegables[k].n.textContent = String(CUENTA[k]());
    marcarCarril();
  }

  function bloqueDatos() {
    const c = (k, etiqueta, extra) => campo(Object.assign({ id: 'dato-' + k, etiqueta, valor: datos[k], alCambiar: (v) => { datos[k] = v; } }, extra));
    return seccion('datos', P.datos, [
      h('div', { class: 'dos' }, c('nombre', P.nombre, { max: 80, autocomplete: 'given-name' }), c('apellido', P.apellido, { max: 80, autocomplete: 'family-name' })),
      campo({ id: 'dato-mail', etiqueta: P.mail, valor: ctx.usuario.mail, ayuda: P.mailAyuda, readonly: true, tipo: 'email', autocomplete: 'email' }),
      c('ciudad', P.ciudad, { max: 80, autocomplete: 'address-level2', ayuda: P.ciudadAyuda }),
      h('div', { class: 'dos dos-apilable' }, c('telefono', P.telefono, { max: 30, tipo: 'tel', autocomplete: 'tel' }), c('linkedin', P.linkedin, { max: 200, tipo: 'url', autocomplete: 'url', inputmode: 'url' }))]);
  }

  function enfocar(id) { const el = document.getElementById(id); if (el) el.focus(); }
  function moverEn(lista, i, d) { const j = i + d; if (j < 0 || j >= lista.length) return; [lista[i], lista[j]] = [lista[j], lista[i]]; }

  function bloqueExperiencia() {
    const cont = h('div', { class: 'seccion', id: 'lista-exp' });
    const dibujarLista = (foco) => {
      Terna.vaciar(cont);
      if (!listas.exp.length) cont.append(h('p', { class: 'suave', text: P.sinExperiencia }));
      listas.exp.forEach((e, i) => {
        const p = 'exp-' + e.clave;
        const b = h('div', { class: 'bloque-lista' });
        b.append(
          h('div', { class: 'dos' },
            campo({ id: p + '-puesto', etiqueta: P.puesto, valor: e.puesto, max: 120, alCambiar: (v) => { e.puesto = v; } }),
            campo({ id: p + '-empresa', etiqueta: P.empresa, valor: e.empresa, max: 120, alCambiar: (v) => { e.empresa = v; } })),
          h('div', { class: 'dos dos-apilable' },
            mesAnio({ id: p + '-desde', etiqueta: P.desde, valor: e.desde, alCambiar: (v) => { e.desde = v; } }),
            mesAnio({ id: p + '-hasta', etiqueta: P.hasta, valor: e.actual ? null : e.hasta, deshabilitado: e.actual, alCambiar: (v) => { e.hasta = v; } })),
          h('label', { class: 'casilla' }, h('input', { type: 'checkbox', id: p + '-actual', checked: !!e.actual, onchange: (ev) => { e.actual = ev.target.checked; if (e.actual) e.hasta = null; dibujarLista(p + '-actual'); } }), h('span', { text: P.actual })),
          campo({ id: p + '-descripcion', etiqueta: P.queHiciste, valor: e.descripcion, max: 2000, area: true, ayuda: P.queHicisteAyuda, alCambiar: (v) => { e.descripcion = v; } }),
          h('div', { class: 'botones' },
            boton(P.quitar, 'i-quitar', () => { listas.exp.splice(i, 1); dibujarLista(listas.exp[i] ? 'exp-' + listas.exp[i].clave + '-puesto' : 'agregar-exp'); }, 'btn btn-texto', { id: p + '-quitar' }),
            boton(P.subir, null, () => { if (i > 0) { moverEn(listas.exp, i, -1); dibujarLista(p + '-subir'); } }, 'btn btn-texto', { id: p + '-subir', 'aria-disabled': i === 0 ? 'true' : null }),
            boton(P.bajar, null, () => { if (i < listas.exp.length - 1) { moverEn(listas.exp, i, 1); dibujarLista(p + '-bajar'); } }, 'btn btn-texto', { id: p + '-bajar', 'aria-disabled': i === listas.exp.length - 1 ? 'true' : null })));
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

  function bloqueEstudios() {
    const cont = h('div', { class: 'seccion' });
    const dibujarLista = (foco) => {
      Terna.vaciar(cont);
      if (!listas.est.length) cont.append(h('p', { class: 'suave', text: P.sinEstudios }));
      listas.est.forEach((e, i) => {
        const p = 'est-' + e.clave;
        cont.append(h('div', { class: 'bloque-lista' },
          campo({ id: p + '-titulo', etiqueta: P.titulo_, valor: e.titulo, max: 160, ayuda: P.tituloAyuda, alCambiar: (v) => { e.titulo = v; } }),
          campo({ id: p + '-institucion', etiqueta: P.institucion, valor: e.institucion, max: 160, alCambiar: (v) => { e.institucion = v; } }),
          h('div', { class: 'dos' },
            campo({ id: p + '-anio', etiqueta: P.anio, valor: e.anio, tipo: 'number', inputmode: 'numeric', ayuda: P.anioAyuda, alCambiar: (v) => { e.anio = v; } }),
            seleccion({ id: p + '-estado', etiqueta: P.estado, valor: e.estado || 'terminado', opciones: [['terminado', P.terminado], ['en_curso', P.enCurso]], alCambiar: (v) => { e.estado = v; } })),
          h('div', { class: 'botones' }, boton(P.quitar, 'i-quitar', () => { listas.est.splice(i, 1); dibujarLista(listas.est[i] ? 'est-' + listas.est[i].clave + '-titulo' : 'agregar-est'); }))));
      });
      if (listas.est.length < MAX.est) {
        cont.append(h('div', null, boton(P.agregarEstudio, 'i-agregar', () => {
          const e = { clave: nuevaClave(), id: null, titulo: '', institucion: '', anio: null, estado: 'terminado' };
          listas.est.push(e);
          dibujarLista('est-' + e.clave + '-titulo');
        }, 'btn', { id: 'agregar-est' })));
      } else cont.append(h('p', { class: 'campo-ayuda', text: P.topeEstudios(MAX.est) }));
      actualizarCuentas();
      if (foco) enfocar(foco);
    };
    dibujarLista();
    return seccion('est', P.estudios, cont);
  }

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

  /* ---------- CV original ---------- */
  function bloqueCv() {
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
    return seccion('cv', P.cv, cont);
  }

  /* ---------- Perfil estructurado: lo que Terna lee (cuatro partes editables) ---------- */
  function bloqueEstructurado() {
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
    return seccion('estr', P.estructurado, cont);
  }

  /* ---------- Datos para formularios (se descifran solo al abrir el bloque) ---------- */
  function bloqueFormularios() {
    const campos = h('div', { class: 'seccion' });
    let pidiendo = false;
    const cargar = async () => {
      if (formularios.cargado || pidiendo) return;
      pidiendo = true;
      const parar2 = Terna.cargando(campos);
      const { data, error } = await sb.rpc('leer_datos_formularios');
      parar2();
      pidiendo = false;
      if (error) { Terna.errorDeCarga(campos, error); return; }
      const fila = (Array.isArray(data) ? data[0] : data) || {};
      Object.assign(formularios, { cargado: true, dni: fila.dni || '', cuil: fila.cuil || '', fecha: fila.fecha_nacimiento || '' });
      formularios.original = JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]);
      Terna.vaciar(campos);
      campos.append(
        h('div', { class: 'dos' },
          campo({ id: 'form-dni', etiqueta: P.dni, valor: formularios.dni, max: 10, inputmode: 'numeric', autocomplete: 'off', alCambiar: (x) => { formularios.dni = x; } }),
          campo({ id: 'form-cuil', etiqueta: P.cuil, valor: formularios.cuil, max: 13, inputmode: 'numeric', autocomplete: 'off', alCambiar: (x) => { formularios.cuil = x; } })),
        campo({ id: 'form-fecha', etiqueta: P.nacimiento, valor: formularios.fecha, tipo: 'date', autocomplete: 'bday', alCambiar: (x) => { formularios.fecha = x; } }));
    };
    return seccion('form', P.formularios, [h('p', { class: 'campo-ayuda', text: P.formulariosAyuda }), campos], cargar);
  }

  /* ---------- Guardar ---------- */
  const banda = h('div', { class: 'banda banda-error', role: 'alert', tabindex: '-1', hidden: true });
  const estadoGuardado = h('p', { class: 'estado-guardado', role: 'status' });
  const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'button' }, T.comun.guardar);
  function mostrarBanda(texto) {
    Terna.vaciar(banda);
    banda.append(icono('i-alerta'), h('span', { text: texto }));
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
    if (formularios.cargado) {
      const dni = formularios.dni.replace(/\D/g, '');
      if (dni && !/^\d{7,8}$/.test(dni)) { marcarError('form-dni', T.errores.dni); ok = false; }
      const cuil = formularios.cuil.replace(/\D/g, '');
      if (cuil && !/^\d{11}$/.test(cuil)) { marcarError('form-cuil', T.errores.cuil); ok = false; }
    }
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
      // 1. Datos
      if (JSON.stringify(datos) !== originales.datos) {
        const v = (x) => (String(x || '').trim() || null);
        const { error } = await sb.from('perfiles').update({ nombre: v(datos.nombre), apellido: v(datos.apellido), telefono: v(datos.telefono), ciudad: v(datos.ciudad), linkedin: v(datos.linkedin) }).eq('usuario_id', uid);
        if (error) throw error;
        Terna.actualizarPerfil({ nombre: v(datos.nombre), apellido: v(datos.apellido) });
      }
      // 2. Listas: primero lo que se quitó (por los topes), después lo que cambió y al final lo nuevo.
      await guardarLista('experiencias', listas.exp, originales.exp, (e, i) => ({ puesto: e.puesto.trim(), empresa: e.empresa.trim(), desde: e.desde, hasta: e.actual ? null : e.hasta, actual: !!e.actual, descripcion: (e.descripcion || '').trim() || null, orden: i }),
        (e, i) => JSON.stringify([e.puesto, e.empresa, e.desde, e.actual ? null : e.hasta, !!e.actual, e.descripcion || ''].concat(i)), 'exp');
      await guardarLista('estudios', listas.est, originales.est, (e, i) => ({ titulo: e.titulo.trim(), institucion: e.institucion.trim(), anio: e.anio === '' || e.anio === null || e.anio === undefined ? null : Number(e.anio), estado: e.estado || 'terminado', orden: i }),
        (e, i) => JSON.stringify([e.titulo, e.institucion, e.anio === '' || e.anio === undefined ? null : (e.anio === null ? null : Number(e.anio)), e.estado || 'terminado'].concat(i)), 'est');
      await guardarLista('idiomas', listas.idi, originales.idi, (e) => ({ idioma: e.idioma.trim(), nivel: e.nivel }),
        (e) => JSON.stringify([e.idioma, e.nivel]), 'idi');
      // 3. Datos para formularios, solo si se abrieron y cambiaron.
      if (formularios.cargado && JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]) !== formularios.original) {
        const { error } = await sb.rpc('guardar_datos_formularios', { p_dni: formularios.dni || null, p_cuil: formularios.cuil || null, p_fecha_nacimiento: formularios.fecha || null });
        if (error) throw Object.assign(error, { _campo: true });
        formularios.original = JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]);
      }
    } catch (error) {
      bGuardar.removeAttribute('aria-disabled');
      if (Terna.siSesionVencida(error)) return;
      const claveError = String(error.message || '').trim();
      const campoForm = { dni_invalido: 'form-dni', cuil_invalido: 'form-cuil', fecha_nacimiento_invalida: 'form-fecha' }[claveError];
      if (campoForm) { marcarError(campoForm, Terna.textoError(error)); mostrarBanda(T.errores.guardarCampos); return; }
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
      Terna.vaciar(estadoGuardado);
      estadoGuardado.append(T.perfil.guardadoBusca + ' ', h('a', { href: 'preferencias.html#respuestas', text: P.revisarPrefs }));
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
  dibujarIndicador();
  Terna.vaciar(raiz);
  const cabecera = document.getElementById('cabecera');
  const grupoGuardar = h('div', { class: 'guardar-fijo' }, estadoGuardado, bGuardar);
  const bloques = [bloqueDatos(), bloqueCv(), estructurado ? bloqueEstructurado() : null, bloqueFormularios(),
    bloqueExperiencia(), bloqueEstudios(), bloqueIdiomas()];
  carril.append(...orden.map((k) => plegables[k].link));
  actualizarCuentas();
  raiz.append(banda,
    h('div', { class: 'perfil-cuerpo' }, carril,
      h('div', { class: 'seccion perfil-bloques' }, bloques, h('p', { class: 'campo-ayuda', text: P.privacidad }))),
    grupoGuardar);

  // Desde 768 px la cabecera queda fija con Guardar a la derecha: el carril y el desplazamiento al foco se corren su alto.
  const topeCabecera = () => parseFloat(getComputedStyle(cabecera).top) || 0;
  function medirCabecera() {
    const raizDoc = document.documentElement.style;
    if (!modoCarril) { raizDoc.removeProperty('scroll-padding-top'); carril.style.removeProperty('top'); return; }
    const abajo = topeCabecera() + cabecera.offsetHeight;
    raizDoc.setProperty('scroll-padding-top', (abajo + 12) + 'px');
    carril.style.setProperty('top', (abajo + 16) + 'px');
  }
  function marcarPegada() { cabecera.classList.toggle('pegada', modoCarril && cabecera.getBoundingClientRect().top <= topeCabecera() + 0.5); }
  function aplicarModo() {
    modoCarril = escritorio.matches;
    raiz.classList.toggle('modo-carril', modoCarril);
    if (modoCarril) cabecera.append(grupoGuardar); else raiz.append(grupoGuardar);
    for (const k of orden) {
      const p = plegables[k];
      p.seccion.hidden = false;
      p.panel.hidden = modoCarril ? false : !p.abierta;
      p.boton.setAttribute('aria-expanded', String(p.abierta));
    }
    if (modoCarril) elegir(elegido);
    medirCabecera();
    marcarPegada();
  }
  // Bloque inicial: el de la URL; si no, el primero con algo que falta; si no, Datos.
  const desdeUrl = orden.find((k) => HASH[k] === location.hash.slice(1));
  elegido = desdeUrl || orden.find((k) => abiertosAlEntrar.has(k)) || 'datos';
  aplicarModo();
  if (desdeUrl && !modoCarril) { plegar(desdeUrl, true); plegables[desdeUrl].seccion.scrollIntoView({ block: 'start' }); }
  escritorio.addEventListener('change', aplicarModo);
  if (window.ResizeObserver) new ResizeObserver(medirCabecera).observe(cabecera);
  addEventListener('scroll', marcarPegada, { passive: true });
});
