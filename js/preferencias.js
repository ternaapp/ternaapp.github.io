/* Terna · js/preferencias.js
   Preferencias (diseno.md §9.3; brand.md §6.7): las dieciséis columnas de preferencias en el orden de diseno.md, las
   alertas de LinkedIn, pausar la cuenta (escribe en el acto) y el texto para borrarla. "Guardar preferencias" escribe todo. */
'use strict';

Terna.pagina('preferencias', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.preferencias;
  const raiz = document.getElementById('preferencias');
  const COLUMNAS = 'umbral, modalidades, alcance, salario_modo, salario_min, salario_max, salario_moneda, idioma_documentos, armar_paquetes, paquetes_por_dia, interes_por_defecto, postular_sola, revisar_antes_de_enviar, autorizacion_trabajo, disponibilidad, mudanza';

  const parar = Terna.cargando(raiz);
  const lectura = await sb.from('preferencias').select(COLUMNAS).eq('usuario_id', uid).maybeSingle();
  parar();
  const data = lectura.data;
  if (lectura.error || !data) { Terna.errorDeCarga(raiz, lectura.error); return; }
  const v = Object.assign({}, data, { modalidades: (data.modalidades || []).slice() });
  const umbralMin = config.umbral_min || 50;
  const umbralMax = config.umbral_max || 95;
  const opcionesPaquetes = config.paquetes_por_dia_opciones || [3, 5];
  const defectoPaquetes = config.paquetes_por_dia_default || 3;

  /* ---------- Piezas ---------- */
  let n = 0;
  const id = (x) => 'pref-' + x + '-' + (n += 1);
  function tarjeta(titulo, ...cuerpo) {
    const idT = id('t');
    const s = h('section', { class: 'tarjeta seccion', 'aria-labelledby': idT }, h('h2', { id: idT, class: 'tarjeta-titulo', text: titulo }), cuerpo);
    s.dataset.titulo = idT;
    return s;
  }
  // Un grupo de radios en una tarjeta: role="group" con su título, en vez de fieldset (la leyenda pisaría el borde).
  function grupoRadios(titulo, nombre, opciones, valor, alCambiar) {
    const idT = id('g');
    const ops = h('div', { class: 'opciones' });
    const fs = h('section', { class: 'tarjeta seccion', role: 'group', 'aria-labelledby': idT }, h('h2', { id: idT, class: 'tarjeta-titulo', text: titulo }), ops);
    for (const [val, texto, ayuda] of opciones) {
      ops.append(h('label', { class: 'casilla' }, h('input', { type: 'radio', name: nombre, value: String(val), checked: String(valor) === String(val), onchange: () => alCambiar(val) }),
        h('span', null, texto, ayuda ? h('small', { text: ayuda }) : null)));
    }
    return fs;
  }
  function interruptor(seccionNodo, valor, alCambiar) {
    const estado = h('span', { 'aria-hidden': 'true', text: valor ? P.si : P.no });
    const b = h('button', { class: 'interruptor', type: 'button', role: 'switch', 'aria-checked': String(!!valor), 'aria-labelledby': seccionNodo.dataset.titulo },
      estado, h('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }));
    b.addEventListener('click', () => {
      const nuevo = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(nuevo));
      estado.textContent = nuevo ? P.si : P.no;
      alCambiar(nuevo);
    });
    return b;
  }
  function conInterruptor(titulo, ayuda, valor, alCambiar) {
    const s = tarjeta(titulo);
    const titular = s.firstChild;
    const fila = h('div', { class: 'interruptor-fila' });
    s.replaceChild(fila, titular);
    fila.append(titular, interruptor(s, valor, alCambiar));
    if (ayuda) s.append(h('p', { class: 'campo-ayuda', text: ayuda }));
    return s;
  }
  const error = (idE) => h('p', { class: 'campo-error', id: idE, role: 'alert' });

  /* ---------- 1. Umbral ---------- */
  const idUmbral = id('umbral');
  const valorUmbral = h('output', { class: 'umbral-valor', for: idUmbral, text: String(v.umbral) });
  const rango = h('input', { type: 'range', id: idUmbral, min: String(umbralMin), max: String(umbralMax), step: '1', value: String(v.umbral) });
  rango.addEventListener('input', () => { v.umbral = Number(rango.value); valorUmbral.textContent = rango.value; });
  const sUmbral = h('section', { class: 'tarjeta seccion' },
    h('div', { class: 'interruptor-fila' }, h('label', { class: 'tarjeta-titulo', for: idUmbral, text: P.umbral }), valorUmbral),
    rango, h('p', { class: 'campo-ayuda', text: P.umbralAyuda(config.piso_match || 50) }), error('err-umbral'));

  /* ---------- 2. Modalidades ---------- */
  const idMod = id('mod');
  const sMod = h('section', { class: 'tarjeta seccion', role: 'group', 'aria-labelledby': idMod, 'aria-describedby': 'ayuda-mod err-mod' }, h('h2', { id: idMod, class: 'tarjeta-titulo', text: P.modalidades }));
  const chipsMod = h('div', { class: 'chips' });
  for (const m of ['remoto', 'hibrido', 'presencial']) {
    const input = h('input', { type: 'checkbox', value: m, checked: v.modalidades.includes(m) });
    input.addEventListener('change', () => {
      v.modalidades = input.checked ? Array.from(new Set(v.modalidades.concat(m))) : v.modalidades.filter((x) => x !== m);
      document.getElementById('err-mod').textContent = '';
    });
    chipsMod.append(h('label', { class: 'chip-opcion chip-opcion-form' }, input,
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), icono('i-' + m), T.avisos.modalidad[m])));
  }
  sMod.append(chipsMod, h('p', { class: 'campo-ayuda', id: 'ayuda-mod', text: P.alMenosUna }), error('err-mod'));

  /* ---------- 3. Alcance ---------- */
  const sAlc = grupoRadios(P.alcance, 'alcance', [['local', P.local, P.localAyuda], ['exterior', P.exterior, P.exteriorAyuda], ['ambos', P.ambos]], v.alcance, (x) => { v.alcance = x; });

  /* ---------- 4. Salario ---------- */
  const sSal = grupoRadios(P.salario, 'salario', [['sugerir', P.sugerir], ['rango', P.rango]], v.salario_modo, (x) => { v.salario_modo = x; camposRango.hidden = x !== 'rango'; });
  const numeroCampo = (clave, etiqueta) => {
    const idC = id(clave);
    const input = h('input', { class: 'control num', id: idC, type: 'number', min: '0', step: '1', inputmode: 'numeric', value: v[clave] === null || v[clave] === undefined ? '' : String(Number(v[clave])), 'aria-describedby': 'err-sal' });
    input.addEventListener('input', () => { v[clave] = input.value === '' ? null : Number(input.value); document.getElementById('err-sal').textContent = ''; });
    return h('div', { class: 'campo' }, h('label', { for: idC, text: etiqueta }), input);
  };
  const idMoneda = id('moneda');
  const moneda = h('select', { class: 'control', id: idMoneda, 'aria-describedby': 'err-sal' },
    h('option', { value: '', text: '' }), ['ARS', 'USD'].map((m) => h('option', { value: m, text: m, selected: v.salario_moneda === m })));
  moneda.addEventListener('change', () => { v.salario_moneda = moneda.value || null; document.getElementById('err-sal').textContent = ''; });
  const camposRango = h('div', { class: 'seccion', hidden: v.salario_modo !== 'rango' },
    h('div', { class: 'dos' }, numeroCampo('salario_min', P.minimo), numeroCampo('salario_max', P.maximo)),
    h('div', { class: 'campo' }, h('label', { for: idMoneda, text: P.moneda }), moneda));
  sSal.append(camposRango, h('p', { class: 'campo-ayuda', text: P.salarioAyuda }), error('err-sal'));

  /* ---------- 5. Idioma de los documentos ---------- */
  const sIdi = grupoRadios(P.idiomaDocs, 'idioma', [['aviso', P.idiomaAviso], ['espanol', P.idiomaEspanol]], v.idioma_documentos, (x) => { v.idioma_documentos = x; });

  /* ---------- 6 a 10. Interés, armar, paquetes, postular, revisar ---------- */
  const sInt = conInterruptor(P.interesDefecto, P.interesDefectoAyuda, v.interes_por_defecto, (x) => { v.interes_por_defecto = x; });
  const sPaq = grupoRadios(P.paquetesDia, 'paquetes', opcionesPaquetes.map((x) => [x, x === defectoPaquetes ? P.recomendado(x) : String(x)]), v.paquetes_por_dia, (x) => { v.paquetes_por_dia = Number(x); });
  sPaq.append(h('p', { class: 'campo-ayuda', text: P.paquetesAyuda }), error('err-paq'));
  const sPos = conInterruptor(P.postularSola, P.postularSolaAyuda, v.postular_sola, (x) => { v.postular_sola = x; atenuar(); });
  const sRev = conInterruptor(P.revisar, P.revisarAyuda, v.revisar_antes_de_enviar, (x) => { v.revisar_antes_de_enviar = x; });
  const sArm = conInterruptor(P.armar, P.armarAyuda, v.armar_paquetes, (x) => { v.armar_paquetes = x; atenuar(); });
  // Atenuar (diseno.md §9.3): la sección sigue visible y legible; sus controles quedan inactivos hasta que vuelva a aplicar.
  function atenuar() {
    const poner = (sec, off) => {
      sec.classList.toggle('atenuado', off);
      sec.querySelectorAll('input, button[role="switch"]').forEach((x) => { x.disabled = off; });
    };
    poner(sPaq, !v.armar_paquetes);
    poner(sPos, !v.armar_paquetes);
    poner(sRev, !v.postular_sola || !v.armar_paquetes);
  }
  atenuar();

  /* ---------- 11. Respuestas para formularios ---------- */
  const idAut = id('aut');
  const idDisp = id('disp');
  const aut = h('textarea', { class: 'control', id: idAut, rows: '3', maxlength: '300', 'aria-describedby': idAut + '-ayuda' });
  aut.value = v.autorizacion_trabajo || '';
  aut.addEventListener('input', () => { v.autorizacion_trabajo = aut.value; });
  const disp = h('input', { class: 'control', id: idDisp, type: 'text', maxlength: '120', value: v.disponibilidad || '', 'aria-describedby': idDisp + '-ayuda' });
  disp.addEventListener('input', () => { v.disponibilidad = disp.value; });
  const sResp = tarjeta(P.respuestas,
    h('p', { class: 'campo-ayuda', text: P.respuestasIntro }),
    h('div', { class: 'campo' }, h('label', { for: idAut, text: P.autorizacion }), aut, h('p', { class: 'campo-ayuda', id: idAut + '-ayuda', text: P.autorizacionAyuda })),
    h('div', { class: 'campo' }, h('label', { for: idDisp, text: P.disponibilidad }), disp, h('p', { class: 'campo-ayuda', id: idDisp + '-ayuda', text: P.disponibilidadAyuda })));
  sResp.id = 'respuestas';
  const idMud = id('mud');
  const mudTit = h('span', { id: idMud, class: 'campo-etiqueta', text: P.mudanza });
  const mud = interruptor({ dataset: { titulo: idMud } }, v.mudanza, (x) => { v.mudanza = x; });
  sResp.append(h('div', { class: 'interruptor-fila' }, mudTit, mud));

  /* ---------- 12. Alertas de LinkedIn ---------- */
  const direccion = String(config.alertas_mail_patron || '').replace('{codigo}', ctx.usuario.codigo_alertas || '');
  const code = h('code', { text: direccion });
  const sAlertas = tarjeta(P.alertas,
    h('p', { text: P.alertasIntro }),
    h('div', { class: 'direccion' }, code, h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(direccion, code) }, icono('i-pegar'), P.copiarDireccion)),
    h('ol', { class: 'pasos' }, P.alertasPasos.map((x) => h('li', { text: x }))),
    h('p', { class: 'campo-ayuda', text: P.alertasNota }));

  /* ---------- 13 y 14. Pausar y borrar ---------- */
  const bPausa = h('button', { class: 'btn', type: 'button' });
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
  const sPausa = tarjeta(P.pausar, h('p', { text: P.pausarTexto }), h('div', null, bPausa));
  const sBorrar = tarjeta(P.borrar, h('p', { text: P.borrarTexto }));

  /* ---------- Guardar ---------- */
  const banda = h('div', { class: 'banda banda-error', role: 'alert', tabindex: '-1', hidden: true });
  const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'button' }, P.guardar);
  function mostrarBanda(texto) { Terna.vaciar(banda); banda.append(icono('i-alerta'), h('span', { text: texto })); banda.hidden = false; banda.focus(); }
  function marcar(idE, texto) { const e = document.getElementById(idE); if (e) e.textContent = texto; }
  bGuardar.addEventListener('click', async () => {
    banda.hidden = true;
    ['err-umbral', 'err-mod', 'err-sal', 'err-paq'].forEach((x) => marcar(x, ''));
    let ok = true;
    if (!v.modalidades.length) { marcar('err-mod', T.errores.modalidades); ok = false; }
    if (v.salario_modo === 'rango') {
      if (v.salario_min === null || v.salario_max === null || !v.salario_moneda) { marcar('err-sal', T.errores.salarioIncompleto); ok = false; }
      else if (v.salario_min > v.salario_max) { marcar('err-sal', T.errores.minimoMayor); ok = false; }
    }
    if (!ok) { mostrarBanda(T.errores.guardarCampos); return; }
    bGuardar.setAttribute('aria-disabled', 'true');
    const fila = {
      umbral: v.umbral, modalidades: v.modalidades, alcance: v.alcance,
      salario_modo: v.salario_modo,
      salario_min: v.salario_modo === 'rango' ? v.salario_min : null,
      salario_max: v.salario_modo === 'rango' ? v.salario_max : null,
      salario_moneda: v.salario_modo === 'rango' ? v.salario_moneda : null,
      idioma_documentos: v.idioma_documentos, armar_paquetes: v.armar_paquetes, paquetes_por_dia: v.paquetes_por_dia,
      interes_por_defecto: v.interes_por_defecto, postular_sola: v.postular_sola, revisar_antes_de_enviar: v.revisar_antes_de_enviar,
      autorizacion_trabajo: String(v.autorizacion_trabajo || '').trim() || null, disponibilidad: String(v.disponibilidad || '').trim() || null, mudanza: !!v.mudanza,
    };
    const { error: e } = await sb.from('preferencias').update(fila).eq('usuario_id', uid);
    bGuardar.removeAttribute('aria-disabled');
    if (e) {
      if (Terna.siSesionVencida(e)) return;
      const clave = String(e.message || '').trim();
      const destino = { umbral_fuera_de_rango: 'err-umbral', modalidades_vacias: 'err-mod', salario_incompleto: 'err-sal', salario_rango_invalido: 'err-sal', paquetes_por_dia_invalido: 'err-paq' }[clave];
      if (destino) { marcar(destino, Terna.textoError(e)); mostrarBanda(T.errores.guardarCampos); } else mostrarBanda(T.errores.guardar);
      return;
    }
    Terna.avisoBreve(P.guardado);
  });

  Terna.vaciar(raiz);
  raiz.append(banda, sUmbral, sMod, sAlc, sSal, sIdi, sInt, sArm, sPaq, sPos, sRev, sResp, sAlertas, sPausa, sBorrar,
    h('div', { class: 'guardar-fijo' }, bGuardar));
  if (location.hash === '#respuestas') sResp.scrollIntoView();
});
