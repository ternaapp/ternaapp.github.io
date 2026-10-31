/* Terna · js/preferencias.js
   Preferencias (diseno.md 0.12 §9.3 y §10.17; brand.md 0.4.11 §6.7; datos.md 0.13, 0016 y 0019): las diecinueve columnas de preferencias (con "Qué buscás", 0015), las
   alertas por mail (la dirección, cada portal con su última alerta y el link a su guía en alertas.html), pausar la cuenta
   (escribe en el acto) y el texto para borrarla, en cinco bloques: Búsqueda, Paquetes y postulación, Respuestas para
   formularios (con opciones y defaults desde 0016), Alertas por mail y Tu cuenta.
   Desplegables en celular y carril desde 768 px, con Terna.porBloques (comun.js), igual que Mi perfil.
   "Guardar preferencias" escribe todo. */
'use strict';

Terna.pagina('preferencias', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.preferencias;
  const raiz = document.getElementById('preferencias');
  const COLUMNAS = 'umbral, modalidades, alcance, salario_modo, salario_min, salario_max, salario_moneda, idioma_documentos, armar_paquetes, paquetes_por_dia, interes_por_defecto, postular_sola, revisar_antes_de_enviar, autorizacion_trabajo, disponibilidad, mudanza, nacionalidad, aceptar_consentimientos, puestos_objetivo, niveles, jornadas';
  const NIVELES = ['pasantia', 'junior', 'semi_senior', 'senior', 'lider', 'director'];
  const JORNADAS = ['completa', 'parcial'];
  const MAX_PUESTOS = 8;
  const MAX_LARGO_PUESTO = 60;
  const MAX_DIAS = 365;

  const parar = Terna.cargando(raiz);
  const [lectura, lecturaAlertas] = await Promise.all([
    sb.from('preferencias').select(COLUMNAS).eq('usuario_id', uid).maybeSingle(),
    sb.from('alertas_mail').select('portal, recibido_en, procesado_en, avisos_detectados').eq('usuario_id', uid).order('procesado_en', { ascending: false }).limit(200),
  ]);
  parar();
  // Las alertas que llegaron (0019; la retención las borra a los 7 días). Si no se pueden leer, los portales van sin estado.
  const alertas = lecturaAlertas.error ? null : (lecturaAlertas.data || []);
  const data = lectura.data;
  if (lectura.error || !data) { Terna.errorDeCarga(raiz, lectura.error); return; }
  const v = Object.assign({}, data, {
    modalidades: (data.modalidades || []).slice(),
    niveles: (data.niveles || NIVELES).slice(),
    jornadas: (data.jornadas || JORNADAS).slice(),
    puestos_objetivo: (data.puestos_objetivo || []).slice(),
  });
  const umbralMin = config.umbral_min || 50;
  const umbralMax = config.umbral_max || 95;
  const opcionesPaquetes = config.paquetes_por_dia_opciones || [3, 5];
  const defectoPaquetes = config.paquetes_por_dia_default || 3;
  const bloques = Terna.porBloques({ raiz, cabecera: document.getElementById('cabecera'), nombre: T.comun.pestanas.preferencias });

  /* ---------- Piezas ---------- */
  let n = 0;
  const id = (x) => 'pref-' + x + '-' + (n += 1);
  // Un ítem dentro de un bloque: su título es un h3 (el h2 es el del bloque).
  function item(titulo, ...cuerpo) {
    const idT = id('t');
    const s = h('div', { class: 'subbloque' }, h('h3', { id: idT, class: 'tarjeta-titulo', text: titulo }), cuerpo);
    s.dataset.titulo = idT;
    return s;
  }
  // Radios nativos: [valor, texto, ayuda].
  const radios = (nombre, opciones, valor, alCambiar) => h('div', { class: 'opciones' }, opciones.map(([val, texto, ayuda]) => h('label', { class: 'casilla' },
    h('input', { type: 'radio', name: nombre, value: String(val), checked: String(valor) === String(val), onchange: () => alCambiar(val) }),
    h('span', null, texto, ayuda ? h('small', { text: ayuda }) : null))));
  // Un grupo de radios: role="group" con su título, en vez de fieldset (la leyenda pisaría el borde).
  function grupoRadios(titulo, nombre, opciones, valor, alCambiar) {
    const idT = id('g');
    return h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idT }, h('h3', { id: idT, class: 'tarjeta-titulo', text: titulo }), radios(nombre, opciones, valor, alCambiar));
  }
  // Una pregunta dentro de un ítem: role="group" con una etiqueta (no un h3).
  function pregunta(etiqueta, ...cuerpo) {
    const idT = id('q');
    return h('div', { class: 'campo', role: 'group', 'aria-labelledby': idT }, h('span', { id: idT, class: 'campo-etiqueta', text: etiqueta }), cuerpo);
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
    const s = item(titulo);
    const titular = s.firstChild;
    const fila = h('div', { class: 'interruptor-fila' });
    s.replaceChild(fila, titular);
    fila.append(titular, interruptor(s, valor, alCambiar));
    if (ayuda) s.append(h('p', { class: 'campo-ayuda', text: ayuda }));
    return s;
  }
  const error = (idE) => h('p', { class: 'campo-error', id: idE, role: 'alert' });
  // Marcar o limpiar un error también abre su bloque (celular) y actualiza las marcas del carril (escritorio).
  function marcar(idE, texto) {
    const e = document.getElementById(idE);
    if (!e) return;
    e.textContent = texto;
    if (texto) bloques.abrirDe(e);
    bloques.marcarErrores();
  }
  const limpiar = (idE) => { const e = document.getElementById(idE); if (e && e.textContent) marcar(idE, ''); };

  /* ---------- Búsqueda: umbral, modalidades, alcance y salario ---------- */
  const idUmbral = id('umbral');
  const valorUmbral = h('output', { class: 'umbral-valor', for: idUmbral, text: String(v.umbral) });
  const rango = h('input', { type: 'range', id: idUmbral, min: String(umbralMin), max: String(umbralMax), step: '1', value: String(v.umbral) });
  rango.addEventListener('input', () => { v.umbral = Number(rango.value); valorUmbral.textContent = rango.value; limpiar('err-umbral'); });
  const sUmbral = h('div', { class: 'subbloque' },
    h('div', { class: 'interruptor-fila' }, h('label', { class: 'tarjeta-titulo', for: idUmbral, text: P.umbral }), valorUmbral),
    rango, h('p', { class: 'campo-ayuda', text: P.umbralAyuda(config.piso_match || 50) }), error('err-umbral'));

  const idMod = id('mod');
  const sMod = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idMod, 'aria-describedby': 'ayuda-mod err-mod' }, h('h3', { id: idMod, class: 'tarjeta-titulo', text: P.modalidades }));
  const chipsMod = h('div', { class: 'chips' });
  for (const m of ['remoto', 'hibrido', 'presencial']) {
    const input = h('input', { type: 'checkbox', value: m, checked: v.modalidades.includes(m) });
    input.addEventListener('change', () => {
      v.modalidades = input.checked ? Array.from(new Set(v.modalidades.concat(m))) : v.modalidades.filter((x) => x !== m);
      limpiar('err-mod');
    });
    chipsMod.append(h('label', { class: 'chip-opcion chip-opcion-form' }, input,
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), icono('i-' + m), T.avisos.modalidad[m])));
  }
  sMod.append(chipsMod, h('p', { class: 'campo-ayuda', id: 'ayuda-mod', text: P.alMenosUna }), error('err-mod'));

  /* ---------- Qué buscás: puestos (0015), nivel y jornada ----------
     Puestos (diseno.md 0.10 §9.3): una lista numerada con una casilla por puesto. Se ven los cargados y una casilla
     vacía al final para el siguiente, hasta 8; los que tienen texto son los que Terna busca. Enter pasa a la casilla
     siguiente; Borrar en una casilla vacía vuelve a la anterior; una casilla vacía en el medio se va al salir de ella. */
  const idPue = id('puestos');
  const listaPue = h('ol', { class: 'puestos' });
  const cuentaPue = h('span', { class: 'puestos-cuenta num' });
  const filasPue = () => Array.from(listaPue.children);
  const inputDe = (li) => li.querySelector('input');
  // Igual que validar_preferencias (0015): sin espacios de más, sin vacíos y sin repetidos (sin mirar mayúsculas), en orden.
  function leerPuestos() {
    const vistos = new Set();
    return filasPue().map((li) => inputDe(li).value.trim()).filter((x) => {
      const k = x.toLowerCase();
      if (!x || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  }
  function filaPuesto(valor) {
    const input = h('input', { class: 'control', type: 'text', maxlength: String(MAX_LARGO_PUESTO), autocomplete: 'off', spellcheck: 'false',
      value: valor || '', 'aria-describedby': 'ayuda-puestos err-puestos' });
    const quitar = h('button', { type: 'button' }, icono('i-cerrar'));
    const numero = h('span', { class: 'puesto-numero num', 'aria-hidden': 'true' });
    const li = h('li', { class: 'puesto' }, numero, h('div', { class: 'control-con-boton' }, input, quitar));
    input.addEventListener('input', () => { ordenarPuestos(); limpiar('err-puestos'); });
    input.addEventListener('keydown', (e) => {
      const filas = filasPue();
      const i = filas.indexOf(li);
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filas[i + 1]) inputDe(filas[i + 1]).focus();
      } else if (e.key === 'Backspace' && !input.value && i > 0) {
        e.preventDefault();
        const anterior = inputDe(filas[i - 1]);
        if (i < filas.length - 1) { li.remove(); ordenarPuestos(); }
        anterior.focus();
        anterior.setSelectionRange(anterior.value.length, anterior.value.length);
      }
    });
    input.addEventListener('blur', () => {
      if (!input.value.trim() && li.nextElementSibling && li.isConnected) { input.value = ''; li.remove(); ordenarPuestos(); }
    });
    quitar.addEventListener('click', () => {
      const siguiente = li.nextElementSibling || li.previousElementSibling;
      li.remove();
      ordenarPuestos();
      inputDe(siguiente && siguiente.isConnected ? siguiente : filasPue()[filasPue().length - 1]).focus();
      limpiar('err-puestos');
    });
    return li;
  }
  // Numera, deja una sola casilla vacía al final (si hay lugar), muestra "Quitar" solo donde hay texto y cuenta.
  function ordenarPuestos() {
    let filas = filasPue();
    const ultima = filas[filas.length - 1];
    if (filas.length < MAX_PUESTOS && (!ultima || inputDe(ultima).value.trim())) listaPue.append(filaPuesto(''));
    filas = filasPue();
    filas.forEach((li, i) => {
      const input = inputDe(li);
      const texto = input.value.trim();
      const vacia = !texto && i === filas.length - 1;
      li.querySelector('.puesto-numero').textContent = (i + 1) + '.';
      li.classList.toggle('puesto-nuevo', vacia);
      input.setAttribute('aria-label', P.puesto(i + 1));
      input.placeholder = vacia ? (i === 0 ? P.puestoPrimero : P.puestoOtro) : '';
      const quitar = li.querySelector('button');
      quitar.hidden = !texto;
      quitar.setAttribute('aria-label', P.quitarPuesto(texto || P.puesto(i + 1)));
    });
    v.puestos_objetivo = leerPuestos();
    cuentaPue.textContent = P.puestosCuenta(v.puestos_objetivo.length, MAX_PUESTOS);
  }
  v.puestos_objetivo.slice(0, MAX_PUESTOS).forEach((x) => listaPue.append(filaPuesto(x)));
  ordenarPuestos();
  const sPue = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idPue },
    h('div', { class: 'interruptor-fila' }, h('h3', { id: idPue, class: 'tarjeta-titulo', text: P.puestos }), cuentaPue),
    listaPue, h('p', { class: 'campo-ayuda', id: 'ayuda-puestos', text: P.puestosAyuda }), error('err-puestos'));
  // Un grupo de casillas en chips, como Modalidades: al menos una.
  function grupoChips(titulo, clave, valores, etiquetas, ayuda, idErr) {
    const idT = id('t');
    const idAyuda = id('ayuda');
    const s = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idT, 'aria-describedby': idAyuda + ' ' + idErr }, h('h3', { id: idT, class: 'tarjeta-titulo', text: titulo }));
    const chips = h('div', { class: 'chips' });
    for (const x of valores) {
      const input = h('input', { type: 'checkbox', value: x, checked: v[clave].includes(x) });
      input.addEventListener('change', () => {
        v[clave] = input.checked ? valores.filter((y) => y === x || v[clave].includes(y)) : v[clave].filter((y) => y !== x);
        limpiar(idErr);
      });
      chips.append(h('label', { class: 'chip-opcion chip-opcion-form' }, input,
        h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), etiquetas[x])));
    }
    s.append(chips, h('p', { class: 'campo-ayuda', id: idAyuda, text: ayuda }), error(idErr));
    return s;
  }
  const sNiv = grupoChips(P.niveles, 'niveles', NIVELES, P.nivel, P.nivelesAyuda, 'err-niv');
  const sJor = grupoChips(P.jornadas, 'jornadas', JORNADAS, P.jornada, P.jornadasAyuda, 'err-jor');

  const sAlc = grupoRadios(P.alcance, 'alcance', [['local', P.local, P.localAyuda], ['exterior', P.exterior, P.exteriorAyuda], ['ambos', P.ambos]], v.alcance, (x) => { v.alcance = x; });

  const sSal = grupoRadios(P.salario, 'salario', [['sugerir', P.sugerir], ['rango', P.rango]], v.salario_modo, (x) => { v.salario_modo = x; camposRango.hidden = x !== 'rango'; limpiar('err-sal'); });
  const numeroCampo = (clave, etiqueta) => {
    const idC = id(clave);
    const input = h('input', { class: 'control num', id: idC, type: 'number', min: '0', step: '1', inputmode: 'numeric', value: v[clave] === null || v[clave] === undefined ? '' : String(Number(v[clave])), 'aria-describedby': 'err-sal' });
    input.addEventListener('input', () => { v[clave] = input.value === '' ? null : Number(input.value); limpiar('err-sal'); });
    return h('div', { class: 'campo' }, h('label', { for: idC, text: etiqueta }), input);
  };
  const idMoneda = id('moneda');
  const moneda = h('select', { class: 'control', id: idMoneda, 'aria-describedby': 'err-sal' },
    h('option', { value: '', text: '' }), ['ARS', 'USD'].map((m) => h('option', { value: m, text: m, selected: v.salario_moneda === m })));
  moneda.addEventListener('change', () => { v.salario_moneda = moneda.value || null; limpiar('err-sal'); });
  const camposRango = h('div', { class: 'seccion', hidden: v.salario_modo !== 'rango' },
    h('div', { class: 'dos' }, numeroCampo('salario_min', P.minimo), numeroCampo('salario_max', P.maximo)),
    h('div', { class: 'campo' }, h('label', { for: idMoneda, text: P.moneda }), moneda));
  sSal.append(camposRango, h('p', { class: 'campo-ayuda', text: P.salarioAyuda }), error('err-sal'));

  /* ---------- Paquetes y postulación: interés, armar, paquetes, idioma, postular, revisar ---------- */
  const sInt = conInterruptor(P.interesDefecto, P.interesDefectoAyuda, v.interes_por_defecto, (x) => { v.interes_por_defecto = x; });
  const sArm = conInterruptor(P.armar, P.armarAyuda, v.armar_paquetes, (x) => { v.armar_paquetes = x; atenuar(); });
  const sPaq = grupoRadios(P.paquetesDia, 'paquetes', opcionesPaquetes.map((x) => [x, x === defectoPaquetes ? P.recomendado(x) : String(x)]), v.paquetes_por_dia, (x) => { v.paquetes_por_dia = Number(x); limpiar('err-paq'); });
  sPaq.append(h('p', { class: 'campo-ayuda', text: P.paquetesAyuda }), error('err-paq'));
  const sIdi = grupoRadios(P.idiomaDocs, 'idioma', [['aviso', P.idiomaAviso], ['espanol', P.idiomaEspanol]], v.idioma_documentos, (x) => { v.idioma_documentos = x; });
  const sPos = conInterruptor(P.postularSola, P.postularSolaAyuda, v.postular_sola, (x) => { v.postular_sola = x; atenuar(); });
  const sRev = conInterruptor(P.revisar, P.revisarAyuda, v.revisar_antes_de_enviar, (x) => { v.revisar_antes_de_enviar = x; });
  // Atenuar (diseno.md §9.3): el ítem sigue visible y legible; sus controles quedan inactivos hasta que vuelva a aplicar.
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

  /* ---------- Respuestas para formularios (el título es el del bloque; brand.md 0.4.6 §6.7, datos.md §5.6) ----------
     Las opciones se guardan en los mismos textos que el motor ya lee (pipeline.md §4.12): "Argentina: sí. Italia: sí.
     Otros países: solo remoto, sin visa." e "inmediata" o "30 días". Lo que no entra en esas opciones va con tus palabras. */
  const F = P.formato;
  const PAISES = Object.keys(P.paises);
  const aut = { argentina: true, otros: 'remoto', paises: [], propias: false, texto: '' };
  const armarAut = () => [F.pais(P.argentina, aut.argentina)]
    .concat(PAISES.filter((c) => aut.paises.includes(c)).map((c) => F.pais(P.paises[c], true)), aut.otros === 'visa' ? F.visa : F.remoto).join(' ');
  // Al entrar: si el texto guardado es exactamente el que armarían unas opciones, se muestran esas opciones;
  // si es otro (o está vacío, que es "no respondas esa pregunta"), queda con tus palabras, tal cual.
  (function leerAut(t) {
    aut.argentina = !t.startsWith(F.pais(P.argentina, false));
    aut.otros = t.endsWith(F.visa) ? 'visa' : 'remoto';
    aut.paises = PAISES.filter((c) => t.includes(F.pais(P.paises[c], true)));
    if (!t || armarAut() !== t) { aut.propias = true; aut.texto = t; }
  }(String(v.autorizacion_trabajo || '').trim()));

  const vistaAut = h('p', { class: 'campo-ayuda', 'aria-live': 'polite' });
  const chipsPaises = h('div', { class: 'chips' }, PAISES.map((c) => {
    const input = h('input', { type: 'checkbox', value: c, checked: aut.paises.includes(c) });
    input.addEventListener('change', () => { aut.paises = PAISES.filter((y) => (y === c ? input.checked : aut.paises.includes(y))); verAut(); });
    return h('label', { class: 'chip-opcion chip-opcion-form' }, input, h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), P.paises[c]));
  }));
  const idAyudaPaises = id('ayuda');
  const qPaises = pregunta(P.autPaises, chipsPaises, h('p', { class: 'campo-ayuda', id: idAyudaPaises, text: P.autPaisesAyuda }));
  qPaises.setAttribute('aria-describedby', idAyudaPaises);
  const opcionesAut = h('div', { class: 'seccion' },
    pregunta(P.autArgentina, radios('aut-argentina', [[true, P.si], [false, P.no]], aut.argentina, (x) => { aut.argentina = x; verAut(); })),
    pregunta(P.autOtros, radios('aut-otros', [['remoto', P.autRemoto, P.autRemotoAyuda], ['visa', P.autVisa]], aut.otros, (x) => { aut.otros = x; verAut(); })),
    qPaises, vistaAut);
  const idTexto = id('aut-texto');
  const textoAut = h('textarea', { class: 'control', id: idTexto, rows: '3', maxlength: '300', 'aria-describedby': idTexto + '-ayuda' });
  textoAut.value = aut.texto;
  textoAut.addEventListener('input', () => { aut.texto = textoAut.value; });
  const campoTexto = h('div', { class: 'campo' }, h('label', { for: idTexto, text: P.autTexto }), textoAut, h('p', { class: 'campo-ayuda', id: idTexto + '-ayuda', text: P.autTextoAyuda }));
  // Al pasar a tus palabras, el texto arranca con lo que armaban las opciones, para corregirlo en vez de escribirlo de cero.
  let armadoAlPasar = null;
  const casPropias = h('input', { type: 'checkbox', checked: aut.propias });
  casPropias.addEventListener('change', () => {
    aut.propias = casPropias.checked;
    if (aut.propias && (!aut.texto.trim() || aut.texto === armadoAlPasar)) { armadoAlPasar = armarAut(); aut.texto = armadoAlPasar; textoAut.value = aut.texto; }
    verAut();
  });
  function verAut() {
    opcionesAut.hidden = aut.propias;
    campoTexto.hidden = !aut.propias;
    vistaAut.textContent = P.autVista(armarAut());
  }
  verAut();
  const sAut = item(P.autorizacion, opcionesAut, h('label', { class: 'casilla' }, casPropias, h('span', { text: P.autPropias })), campoTexto);

  // Disponibilidad: inmediata (default) o en unos días; un texto viejo que no sea ninguno de los dos pide la cantidad.
  const disp = (function leerDisp(t) {
    if (!t || t === F.inmediata) return { modo: 'inmediata', dias: null };
    const m = /^(\d{1,3}) d[ií]as?$/.exec(t);
    return { modo: 'dias', dias: m ? Number(m[1]) : null };
  }(String(v.disponibilidad || '').trim().toLowerCase()));
  const idDias = id('dias');
  const inDias = h('input', { class: 'control control-corto num', id: idDias, type: 'number', min: '1', max: String(MAX_DIAS), step: '1', inputmode: 'numeric',
    value: disp.dias === null ? '' : String(disp.dias), 'aria-describedby': idDias + '-ayuda err-disp' });
  inDias.addEventListener('input', () => { disp.dias = inDias.value === '' ? null : Number(inDias.value); limpiar('err-disp'); });
  const campoDias = h('div', { class: 'campo anidado', hidden: disp.modo !== 'dias' },
    h('label', { for: idDias, text: P.dispCantidad }), inDias, h('p', { class: 'campo-ayuda', id: idDias + '-ayuda', text: P.dispCantidadAyuda }));
  const sDisp = grupoRadios(P.disponibilidad, 'disponibilidad', [['inmediata', P.dispInmediata], ['dias', P.dispDias]], disp.modo,
    (x) => { disp.modo = x; campoDias.hidden = x !== 'dias'; limpiar('err-disp'); });
  sDisp.append(campoDias, error('err-disp'));

  const sMud = conInterruptor(P.mudanza, P.mudanzaAyuda, v.mudanza, (x) => { v.mudanza = x; });
  // 0020: la nacionalidad, que pidieron formularios reales de Greenhouse (31/10/2026). Texto corto; el motor la busca entre las
  // opciones por país o gentilicio.
  const inNac = h('input', { class: 'control', id: 'pref-nacionalidad', type: 'text', maxlength: '60', autocomplete: 'off',
    value: v.nacionalidad || '', 'aria-describedby': 'pref-nacionalidad-ayuda' });
  inNac.addEventListener('input', () => { v.nacionalidad = inNac.value; });
  const sNac = h('div', { class: 'campo' }, h('label', { for: 'pref-nacionalidad', text: P.nacionalidad }), inNac,
    h('p', { class: 'campo-ayuda', id: 'pref-nacionalidad-ayuda', text: P.nacionalidadAyuda }));
  // 0021: las casillas de consentimiento obligatorias (Sí por defecto, como hacía el motor desde pipeline.md 0.3.8).
  const sCons = conInterruptor(P.consentimientos, P.consentimientosAyuda, v.aceptar_consentimientos !== false, (x) => { v.aceptar_consentimientos = x; });
  const cResp = [h('p', { class: 'campo-ayuda', text: P.respuestasIntro }), sAut, sDisp, sMud, sNac, sCons];

  /* ---------- Alertas por mail (el título es el del bloque; diseno.md 0.12 §9.3) ---------- */
  const direccion = String(config.alertas_mail_patron || '').replace('{codigo}', ctx.usuario.codigo_alertas || '');
  const code = h('code', { text: direccion });
  // Por portal: la última alerta con avisos; si solo llegaron mails sin avisos, que la persona le avise a Francisco.
  function estadoPortal(clave) {
    if (!alertas) return null;
    const propias = alertas.filter((a) => a.portal === clave);
    const conAvisos = propias.find((a) => a.avisos_detectados > 0);
    if (conAvisos) return { texto: P.alertaUltima(Terna.fechaCorta(conAvisos.recibido_en || conAvisos.procesado_en), conAvisos.avisos_detectados), revisar: false };
    if (propias.length) return { texto: P.alertaSinAvisos, revisar: true };
    return { texto: P.alertaNinguna, revisar: false };
  }
  const filaPortal = ([clave, nombre, guia]) => {
    const e = estadoPortal(clave);
    return h('li', null, h('a', { class: 'portal', href: 'alertas.html#' + guia },
      h('span', { class: 'portal-nombre', text: nombre }),
      e ? h('span', { class: 'portal-estado' + (e.revisar ? ' revisar' : ''), text: e.texto }) : null,
      h('span', { class: 'portal-ir' }, h('span', { text: P.comoCrearla }), icono('i-adelante', 'icono-16'))));
  };
  const linkGuia = ([texto, guia]) => h('a', { class: 'btn', href: 'alertas.html#' + guia }, h('span', { text: texto }), icono('i-adelante', 'icono-16'));
  const cAlertas = [
    h('p', { text: P.alertasIntro }),
    h('div', { class: 'direccion' }, code, h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(direccion, code) }, icono('i-pegar'), P.copiarDireccion)),
    h('ol', { class: 'pasos' }, P.alertasPasos.map((x) => h('li', { text: x }))),
    item(P.portalesTitulo, h('ul', { class: 'portales' }, P.portales.map(filaPortal)), alertas ? h('p', { class: 'campo-ayuda', text: P.portalesAyuda }) : null),
    item(P.reenvioTitulo, h('p', { class: 'campo-ayuda', text: P.reenvioAyuda }), h('div', { class: 'guias-correo' }, P.guiasCorreo.map(linkGuia))),
    h('p', { class: 'campo-ayuda', text: P.alertasNota }),
  ];

  /* ---------- Tu cuenta: pausar (escribe en el acto) y borrar ---------- */
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
  const sPausa = item(P.pausar, h('p', { text: P.pausarTexto }), h('div', null, bPausa));
  const sBorrar = item(P.borrar, h('p', { text: P.borrarTexto }));

  /* ---------- Guardar ---------- */
  const banda = h('div', { class: 'banda banda-error', role: 'alert', tabindex: '-1', hidden: true });
  const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'button' }, P.guardar);
  function mostrarBanda(texto) {
    Terna.vaciar(banda);
    banda.append(icono('i-alerta'), h('span', { text: texto }));
    banda.hidden = false;
    bloques.irAlPrimerError();
    banda.focus();
  }
  bGuardar.addEventListener('click', async () => {
    banda.hidden = true;
    ['err-umbral', 'err-mod', 'err-sal', 'err-paq', 'err-puestos', 'err-niv', 'err-jor', 'err-disp'].forEach((x) => marcar(x, ''));
    let ok = true;
    v.puestos_objetivo = leerPuestos();
    if (v.puestos_objetivo.length > MAX_PUESTOS) { marcar('err-puestos', T.errores.puestosDemasiados(MAX_PUESTOS)); ok = false; }
    else if (v.puestos_objetivo.some((x) => x.length > MAX_LARGO_PUESTO)) { marcar('err-puestos', T.errores.puestoLargo(MAX_LARGO_PUESTO)); ok = false; }
    if (!v.niveles.length) { marcar('err-niv', T.errores.niveles); ok = false; }
    if (!v.jornadas.length) { marcar('err-jor', T.errores.jornadas); ok = false; }
    if (!v.modalidades.length) { marcar('err-mod', T.errores.modalidades); ok = false; }
    if (v.salario_modo === 'rango') {
      if (v.salario_min === null || v.salario_max === null || !v.salario_moneda) { marcar('err-sal', T.errores.salarioIncompleto); ok = false; }
      else if (v.salario_min > v.salario_max) { marcar('err-sal', T.errores.minimoMayor); ok = false; }
    }
    if (disp.modo === 'dias' && !(Number.isInteger(disp.dias) && disp.dias >= 1 && disp.dias <= MAX_DIAS)) { marcar('err-disp', T.errores.dias(1, MAX_DIAS)); ok = false; }
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
      autorizacion_trabajo: aut.propias ? (aut.texto.trim() || null) : armarAut(),
      disponibilidad: disp.modo === 'dias' ? F.dias(disp.dias) : F.inmediata,
      mudanza: !!v.mudanza,
      nacionalidad: (String(v.nacionalidad || '').trim().slice(0, 60)) || null,
      aceptar_consentimientos: v.aceptar_consentimientos !== false,
      puestos_objetivo: v.puestos_objetivo, niveles: v.niveles, jornadas: v.jornadas,
    };
    const { error: e } = await sb.from('preferencias').update(fila).eq('usuario_id', uid);
    bGuardar.removeAttribute('aria-disabled');
    if (e) {
      if (Terna.siSesionVencida(e)) return;
      const clave = String(e.message || '').trim();
      const destino = { umbral_fuera_de_rango: 'err-umbral', modalidades_vacias: 'err-mod', salario_incompleto: 'err-sal', salario_rango_invalido: 'err-sal', paquetes_por_dia_invalido: 'err-paq',
        niveles_vacios: 'err-niv', jornadas_vacias: 'err-jor', puestos_demasiados: 'err-puestos', puesto_largo: 'err-puestos' }[clave];
      if (destino) { marcar(destino, Terna.textoError(e)); mostrarBanda(T.errores.guardarCampos); } else mostrarBanda(T.errores.guardar);
      return;
    }
    Terna.avisoBreve(P.guardado);
  });

  /* ---------- Página ---------- */
  Terna.vaciar(raiz);
  bloques.bloque('busqueda', P.grupos.busqueda, [sPue, sNiv, sJor, sMod, sAlc, sUmbral, sSal]);
  bloques.bloque('paquetes', P.grupos.paquetes, [sInt, sArm, sPaq, sIdi, sPos, sRev]);
  bloques.bloque('respuestas', P.respuestas, cResp);
  bloques.bloque('alertas', P.alertas, cAlertas);
  bloques.bloque('cuenta', P.grupos.cuenta, [sPausa, sBorrar]);
  bloques.montar({ arriba: [banda], guardar: h('div', { class: 'guardar-fijo' }, bGuardar) });
});
