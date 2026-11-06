/* Terna · js/preferencias.js
   Preferencias (diseno.md 0.15 §9.3 y §10.17; brand.md 0.5.1 §6.7; datos.md 0.21.2, 0016, 0019 y 0026): las columnas de preferencias (con "Qué buscás", 0015, y las palabras clave, 0026), la guía del umbral (con los avisos propios de mis_avisos), las
   alertas por mail (la dirección, cada portal con su última alerta y el link a su guía en alertas.html), pausar la cuenta
   (escribe en el acto) y el texto para borrarla, en cinco bloques: Búsqueda, Paquetes y postulación, Respuestas para
   formularios (con opciones y defaults desde 0016), Alertas por mail y Tu cuenta.
   Desplegables en celular y carril desde 768 px, con Terna.porBloques (comun.js), igual que Mi perfil.
   "Guardar preferencias" escribe todo; las palabras clave (0026; datos.md 0.23; brand.md 0.6 §6.7), solo si cambiaron en la
   página, así una pestaña abierta antes no las pisa. Desde 0027 (datos.md 0.22; brand.md 0.5.4 §6.7; diseno.md 0.18
   §9.3), "Priorizar mis puestos" va debajo de "Puestos que buscás" y solo con algún puesto escrito; sin la columna no se muestra
   y vale Sí, como en el motor. La regla de qué aviso es de tus puestos está en js/puestos.js. */
'use strict';

Terna.pagina('preferencias', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.preferencias;
  const raiz = document.getElementById('preferencias');
  const NIVELES = ['pasantia', 'junior', 'semi_senior', 'senior', 'lider', 'director'];
  const JORNADAS = ['completa', 'parcial'];
  const MAX_PUESTOS = 8;
  const MAX_LARGO_PUESTO = 60;
  const MAX_DIAS = 365;
  const MAX_CLAVES = 15;
  const MAX_LARGO_CLAVE = 40;

  const parar = Terna.cargando(raiz);
  const [lectura, lecturaAlertas, lecturaAvisos] = await Promise.all([
    // La fila entera (la persona puede leer todas sus columnas): desde 0026 trae también las palabras clave, y sin la migración
    // no falla ni deja un error en la consola; la página anda igual, sin ese ítem (datos.md 0.21 §14).
    sb.from('preferencias').select('*').eq('usuario_id', uid).maybeSingle(),
    sb.from('alertas_mail').select('portal, recibido_en, procesado_en, avisos_detectados').eq('usuario_id', uid).order('procesado_en', { ascending: false }).limit(200),
    // La guía del umbral (diseno.md 0.15 §9.3; datos.md 0.21.2 §14): el match de los avisos propios; la vista trae solo los
    // visibles y RLS, solo los de la persona. Se cuenta en el navegador. Si la lectura falla, la guía va sin cuentas.
    sb.from('mis_avisos').select('match, interes, creado_en, puesto').limit(1000),
  ]);
  parar();
  // Las alertas que llegaron (0019; la retención las borra a los 7 días). Si no se pueden leer, los portales van sin estado.
  const alertas = lecturaAlertas.error ? null : (lecturaAlertas.data || []);
  // Los avisos que cuentan para la guía: con match y sin "No me interesa" (los que se ven en Avisos con un número).
  const avisosGuia = lecturaAvisos.error ? null
    : (lecturaAvisos.data || []).filter((a) => a.match !== null && a.match !== undefined && a.interes !== 'no_me_interesa')
      .map((a) => ({ match: Number(a.match), creado: Date.parse(a.creado_en) || 0, puesto: a.puesto || '' }));
  const data = lectura.data;
  if (lectura.error || !data) { Terna.errorDeCarga(raiz, lectura.error); return; }
  const conClaves = Object.prototype.hasOwnProperty.call(data, 'palabras_clave');
  const conAviso = Object.prototype.hasOwnProperty.call(data, 'palabras_clave_aviso');
  // 0027: "Priorizar mis puestos". Sin la columna, el interruptor no aparece y la guía cuenta como con Sí (el default del motor).
  const conPriorizar = Object.prototype.hasOwnProperty.call(data, 'priorizar_puestos');
  const v = Object.assign({}, data, {
    modalidades: (data.modalidades || []).slice(),
    niveles: (data.niveles || NIVELES).slice(),
    jornadas: (data.jornadas || JORNADAS).slice(),
    puestos_objetivo: (data.puestos_objetivo || []).slice(),
    palabras_clave: conClaves ? (data.palabras_clave || []).slice() : [],
    usar_palabras_clave: conClaves ? !!data.usar_palabras_clave : false,
    palabras_clave_aviso: conAviso ? data.palabras_clave_aviso !== false : true,
    priorizar_puestos: conPriorizar ? data.priorizar_puestos !== false : true,
  });
  const huellaClaves = () => JSON.stringify([v.palabras_clave, !!v.usar_palabras_clave, !!v.palabras_clave_aviso]);
  let clavesGuardadas = huellaClaves();
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

  /* ---------- Búsqueda: umbral (con su guía), modalidades, alcance y salario ---------- */
  /* La guía del umbral (diseno.md 0.15 §9.3; brand.md 0.5.1 §6.7). Arriba del deslizador, el cuadro de cinco franjas con lo que
     suele haber en cada una según match.v2 y cuántos avisos de la lista caen ahí, y la línea del umbral; debajo, la cuenta de lo
     que llega con el número elegido, que es la descripción del deslizador. Cambia con el deslizador, con los botones de las
     franjas (ponen su número y llevan el foco al deslizador) y con Armar paquetes, Paquetes por día y Terna postula por vos. */
  function guiaUmbral(fijar) {
    const G = P.guiaUmbral;
    const piso = config.piso_match || 50;
    // Las franjas de match.v2 (datos/match.json del motor): la vecina topa en 79, un requisito que no cumplís en 69, el nivel
    // muy lejos en 55 y dos requisitos en 54; debajo del piso no se muestra nada. De arriba abajo, como se leen.
    const franjas = [90, 80, 70, 60, 50].map((desde, i, todas) => ({ desde, hasta: i === 0 ? 100 : todas[i - 1] - 1 }));
    const lista = avisosGuia ? avisosGuia.filter((a) => a.match >= piso) : null;
    const conCuenta = !!(lista && lista.length);
    const hace14 = Date.now() - 14 * 24 * 3600 * 1000;
    const filas = franjas.map((f) => {
      const t = G.franjas[f.desde];
      const usar = Math.max(umbralMin, Math.min(umbralMax, f.desde));
      const boton = h('button', { type: 'button', class: 'franja-boton', onclick: () => fijar(usar) },
        t.nombre, h('span', { class: 'oculto-visual', text: G.usar(usar) }));
      const estado = h('span', { class: 'franja-estado' });
      const total = conCuenta ? lista.filter((a) => a.match >= f.desde && a.match <= f.hasta).length : 0;
      const numero = h('span', { class: 'franja-numero num', 'aria-hidden': 'true' });
      const accesible = h('span', { class: 'oculto-visual' });
      const relleno = h('span');
      const tr = h('tr', null, h('th', { scope: 'row' }, boton, estado), h('td', { class: 'franja-que', text: t.que }),
        conCuenta ? h('td', { class: 'franja-lista' }, numero, accesible, h('span', { class: 'franja-barra', 'aria-hidden': 'true' }, relleno)) : null);
      return { f, total, tr, estado, numero, accesible, relleno };
    });
    const mayor = Math.max(1, ...filas.map((x) => x.total));
    // La barra, como la del match (--cuenta por CSSOM: la CSP no deja estilos en línea): la franja contra la que tiene más avisos.
    filas.forEach((x) => x.relleno.style.setProperty('--cuenta', String(Math.round((100 * x.total) / mayor))));
    const pastilla = h('span', { class: 'umbral-pastilla num' });
    const marcaTexto = h('span');
    const marca = h('tr', { class: 'umbral-marca' }, h('td', { colspan: conCuenta ? '3' : '2' }, h('div', { class: 'umbral-linea' }, pastilla, marcaTexto)));
    const tabla = h('table', { class: 'umbral-tabla' + (conCuenta ? '' : ' sin-cuenta') },
      h('caption', { text: G.titulo }),
      h('thead', null, h('tr', null,
        h('th', { scope: 'col', text: G.columnas.franja }), h('th', { scope: 'col', text: G.columnas.que }),
        conCuenta ? h('th', { scope: 'col', class: 'der', text: G.columnas.lista }) : null)),
      h('tbody', null, filas.map((x) => x.tr)));
    const arriba = h('div', { class: 'umbral-guia' },
      h('p', { class: 'umbral-intro', text: G.intro(config.umbral_default || 70) }), tabla, h('p', { class: 'campo-ayuda', text: G.nota(piso) }));
    const resumen = h('p', { class: 'umbral-resumen', id: id('umbral-resumen') });
    // Los avisos de la lista que son de tus puestos (brand.md 0.5.4 §6.7), recalculados solo cuando cambian los puestos.
    let tuyos = { clave: null, cuales: new Set() };
    function deTusPuestos() {
      const puestos = v.priorizar_puestos ? v.puestos_objetivo : [];
      const clave = JSON.stringify(puestos);
      if (tuyos.clave !== clave) {
        tuyos = { clave, cuales: new Set(puestos.length && lista ? lista.filter((a) => Puestos.buscado(a.puesto, puestos)) : []) };
      }
      return tuyos.cuales;
    }
    function actualizar() {
      const u = Number(v.umbral);
      let ultima = null;
      for (const x of filas) {
        const entra = x.f.desde >= u;
        const parcial = !entra && x.f.hasta >= u;
        x.tr.classList.toggle('fuera', !entra && !parcial);
        // Para el lector de pantalla, cada franja dice si entra; la del umbral lo dice a la vista: "desde 75".
        x.estado.classList.toggle('oculto-visual', !parcial);
        x.estado.textContent = parcial ? G.desde(u) : (entra ? G.entran : G.noEntran);
        if (conCuenta) {
          const k = parcial ? lista.filter((a) => a.match >= u && a.match <= x.f.hasta).length : x.total;
          x.numero.textContent = parcial ? G.cuentaParcial(k, x.total) : G.cuenta(x.total);
          x.accesible.textContent = parcial ? G.cuentaParcialAccesible(k, x.total, u) : G.cuentaAccesible(x.total);
        }
        if (entra || parcial) ultima = x.tr;
      }
      // La línea va debajo de la última franja que entra (el umbral va de 50 a 95: siempre entra alguna).
      if (ultima && ultima.nextElementSibling !== marca) ultima.after(marca);
      pastilla.textContent = G.marca(u);
      marcaTexto.textContent = !v.armar_paquetes ? '' : (v.postular_sola === false ? G.marcaArma : G.marcaArmaPostula);
      resumen.hidden = !lista;
      if (!lista) { resumen.textContent = ''; return; }
      if (!lista.length) { resumen.textContent = G.sinLista; return; }
      const llegan = lista.filter((a) => a.match >= u);
      const partes = [G.llegan(u, llegan.length, lista.length)];
      const mios = deTusPuestos();
      const ademas = mios.size ? lista.filter((a) => a.match < u && mios.has(a)).length : 0;
      if (ademas) partes.push(G.puestos(ademas));
      if (llegan.length || ademas) partes.push(v.armar_paquetes ? G.arma(v.paquetes_por_dia || defectoPaquetes) : T.inicio.resultado.armar_no);
      partes.push(G.semanas(llegan.filter((a) => a.creado >= hace14).length, u));
      resumen.textContent = partes.join(' ');
    }
    return { arriba, resumen, actualizar };
  }

  const idUmbral = id('umbral');
  const valorUmbral = h('output', { class: 'umbral-valor', for: idUmbral, text: String(v.umbral) });
  const rango = h('input', { type: 'range', id: idUmbral, min: String(umbralMin), max: String(umbralMax), step: '1', value: String(v.umbral) });
  const guia = guiaUmbral((u) => {
    rango.value = String(u);
    v.umbral = u;
    valorUmbral.textContent = String(u);
    guia.actualizar();
    limpiar('err-umbral');
    rango.focus();
  });
  rango.setAttribute('aria-describedby', guia.resumen.id);
  rango.addEventListener('input', () => { v.umbral = Number(rango.value); valorUmbral.textContent = rango.value; guia.actualizar(); limpiar('err-umbral'); });
  const sUmbral = h('div', { class: 'subbloque' },
    h('div', { class: 'interruptor-fila' }, h('label', { class: 'tarjeta-titulo', for: idUmbral, text: P.umbral }), valorUmbral),
    guia.arriba, rango, guia.resumen, h('p', { class: 'campo-ayuda', text: P.umbralAyuda(config.piso_match || 50) }), error('err-umbral'));

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
    verPriorizar();
    guia.actualizar();
  }
  /* Priorizar mis puestos (0027; brand.md 0.5.4 §6.7; diseno.md 0.18 §9.3): el interruptor, en Sí por defecto, solo con algún
     puesto escrito (aparece y se va mientras se escribe o se borra; el valor se conserva). Con Sí, debajo, los puestos muy
     generales para priorizar ("Analista"). Mueve también la cuenta de la guía del umbral. */
  const idPri = id('priorizar');
  const idPriAyuda = id('priorizar-ayuda');
  const generales = h('p', { class: 'campo-nota', hidden: true });
  const sPri = conPriorizar ? h('div', { class: 'seccion priorizar', dataset: { titulo: idPri } }) : null;
  if (sPri) {
    const boton = interruptor(sPri, v.priorizar_puestos, (x) => { v.priorizar_puestos = x; verPriorizar(); guia.actualizar(); });
    boton.setAttribute('aria-describedby', idPriAyuda);
    sPri.append(h('div', { class: 'interruptor-fila' }, h('span', { id: idPri, class: 'campo-etiqueta', text: P.priorizar }), boton),
      h('p', { class: 'campo-ayuda', id: idPriAyuda, text: P.priorizarAyuda(config.piso_match || 50) }), generales);
  }
  function verPriorizar() {
    if (!sPri) return;
    const hay = v.puestos_objetivo.length > 0;
    sPri.hidden = !hay;
    const muy = hay && v.priorizar_puestos ? v.puestos_objetivo.filter((x) => Puestos.general(x)) : [];
    generales.hidden = !muy.length;
    generales.textContent = muy.length ? P.puestosGenerales(muy) : '';
  }
  v.puestos_objetivo.slice(0, MAX_PUESTOS).forEach((x) => listaPue.append(filaPuesto(x)));
  ordenarPuestos();
  const sPue = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idPue },
    h('div', { class: 'interruptor-fila' }, h('h3', { id: idPue, class: 'tarjeta-titulo', text: P.puestos }), cuentaPue),
    listaPue, h('p', { class: 'campo-ayuda', id: 'ayuda-puestos', text: P.puestosAyuda }), error('err-puestos'), sPri);
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
  const sPaq = grupoRadios(P.paquetesDia, 'paquetes', opcionesPaquetes.map((x) => [x, x === defectoPaquetes ? P.recomendado(x) : String(x)]), v.paquetes_por_dia, (x) => { v.paquetes_por_dia = Number(x); limpiar('err-paq'); guia.actualizar(); });
  sPaq.append(h('p', { class: 'campo-ayuda', text: P.paquetesAyuda }), error('err-paq'));
  const sIdi = grupoRadios(P.idiomaDocs, 'idioma', [['aviso', P.idiomaAviso], ['espanol', P.idiomaEspanol]], v.idioma_documentos, (x) => { v.idioma_documentos = x; });
  /* Palabras clave, a la vista (brand.md 0.6 §6.7; datos.md 0.23, 0026; cv-ats.md 0.5 §3.7). Dos interruptores:
     - "Palabras clave del aviso", en Sí por defecto: en cada CV, Terna pone en Habilidades las del aviso que el perfil respalda.
     - "Palabras clave personalizadas (recomendado)", en No por defecto. En No, una línea que invita a ponerlo en Sí; en Sí, las
       recomendadas (las que el motor calcula cada mañana, preferencias.palabras_clave_sugeridas: la persona marca las que sabe
       usar y pasan a su lista) y la lista, una casilla por palabra como "Puestos que buscás", numeradas y hasta 15, con una
       casilla vacía al final. Marcar una recomendada la suma a la lista y quitarla de la lista la desmarca.
     Sin botón "Sumar" en la ficha del paquete (Francisco, 05/11/2026): lo que la persona sabe se marca acá una vez y va solo. */
  const clave = (x) => String(x || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const sugeridas = conClaves && data.palabras_clave_sugeridas && typeof data.palabras_clave_sugeridas === 'object' ? data.palabras_clave_sugeridas : {};
  const recomendadas = (Array.isArray(sugeridas.palabras) ? sugeridas.palabras : [])
    .filter((x) => x && typeof x.texto === 'string' && x.texto.trim()).slice(0, MAX_CLAVES);
  const listaCla = h('ol', { class: 'puestos claves' });
  const cuentaCla = h('span', { class: 'puestos-cuenta num' });
  const filasCla = () => Array.from(listaCla.children);
  function leerClaves() {
    const vistos = new Set();
    return filasCla().map((li) => inputDe(li).value.trim().replace(/\s+/g, ' ')).filter((x) => {
      const k = x.toLowerCase();
      if (!x || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  }
  function filaClave(valor) {
    const input = h('input', { class: 'control', type: 'text', maxlength: String(MAX_LARGO_CLAVE), autocomplete: 'off', spellcheck: 'false',
      value: valor || '', 'aria-describedby': 'ayuda-claves err-claves' });
    const quitar = h('button', { type: 'button' }, icono('i-cerrar'));
    const numero = h('span', { class: 'puesto-numero num', 'aria-hidden': 'true' });
    const li = h('li', { class: 'puesto' }, numero, h('div', { class: 'control-con-boton' }, input, quitar));
    input.addEventListener('input', () => { ordenarClaves(); limpiar('err-claves'); });
    input.addEventListener('keydown', (e) => {
      const filas = filasCla();
      const i = filas.indexOf(li);
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filas[i + 1]) inputDe(filas[i + 1]).focus();
      } else if (e.key === 'Backspace' && !input.value && i > 0) {
        e.preventDefault();
        const anterior = inputDe(filas[i - 1]);
        if (i < filas.length - 1) { li.remove(); ordenarClaves(); }
        anterior.focus();
        anterior.setSelectionRange(anterior.value.length, anterior.value.length);
      }
    });
    input.addEventListener('blur', () => {
      if (!input.value.trim() && li.nextElementSibling && li.isConnected) { input.value = ''; li.remove(); ordenarClaves(); }
    });
    quitar.addEventListener('click', () => {
      const siguiente = li.nextElementSibling || li.previousElementSibling;
      li.remove();
      ordenarClaves();
      inputDe(siguiente && siguiente.isConnected ? siguiente : filasCla()[filasCla().length - 1]).focus();
      limpiar('err-claves');
    });
    return li;
  }
  function ordenarClaves() {
    let filas = filasCla();
    const ultima = filas[filas.length - 1];
    if (filas.length < MAX_CLAVES && (!ultima || inputDe(ultima).value.trim())) listaCla.append(filaClave(''));
    filas = filasCla();
    filas.forEach((li, i) => {
      const input = inputDe(li);
      const texto = input.value.trim();
      const vacia = !texto && i === filas.length - 1;
      li.querySelector('.puesto-numero').textContent = (i + 1) + '.';
      li.classList.toggle('puesto-nuevo', vacia);
      input.setAttribute('aria-label', P.palabraClave(i + 1));
      input.placeholder = vacia ? (i === 0 ? P.palabraClavePrimera : P.palabraClaveOtra) : '';
      const quitar = li.querySelector('button');
      quitar.hidden = !texto;
      quitar.setAttribute('aria-label', P.quitarPalabraClave(texto || P.palabraClave(i + 1)));
    });
    v.palabras_clave = leerClaves();
    cuentaCla.textContent = P.puestosCuenta(v.palabras_clave.length, MAX_CLAVES);
    marcarRecomendadas();
  }
  // Las recomendadas: un chip de opción por palabra, con cuántos avisos la piden; marcado si ya está en la lista.
  const casillasRec = [];
  function marcarRecomendadas() {
    const enLista = new Set(v.palabras_clave.map(clave));
    casillasRec.forEach((c) => { c.checked = enLista.has(clave(c.value)); });
  }
  function agregarClave(texto) {
    const filas = filasCla();
    const ultima = filas[filas.length - 1];
    const fila = filaClave(texto);
    if (ultima && !inputDe(ultima).value.trim()) listaCla.insertBefore(fila, ultima); else listaCla.append(fila);
    ordenarClaves();
  }
  function quitarClave(texto) {
    filasCla().filter((li) => clave(inputDe(li).value) === clave(texto)).forEach((li) => li.remove());
    ordenarClaves();
  }
  const chipsRec = h('div', { class: 'chips' }, recomendadas.map((r) => {
    const input = h('input', { type: 'checkbox', value: r.texto.trim() });
    casillasRec.push(input);
    input.addEventListener('change', () => {
      limpiar('err-claves');
      if (!input.checked) { quitarClave(input.value); return; }
      if (v.palabras_clave.length >= MAX_CLAVES) { input.checked = false; marcar('err-claves', T.errores.palabrasClaveDemasiadas(MAX_CLAVES)); return; }
      agregarClave(input.value);
    });
    return h('label', { class: 'chip-opcion chip-opcion-form' }, input, h('span', { class: 'chip-opcion-cara' },
      h('span', { class: 'marca' }, icono('i-tilde')), r.texto.trim(), h('span', { class: 'chip-opcion-cuenta num', text: P.recomendadaAvisos(Number(r.avisos) || 0) })));
  }));
  v.palabras_clave.slice(0, MAX_CLAVES).forEach((x) => listaCla.append(filaClave(x)));
  ordenarClaves();
  const idRec = id('rec');
  const fechaRec = sugeridas.calculadas_en ? Terna.fechaCorta(String(sugeridas.calculadas_en)) : '';
  const subRec = h('div', { class: 'seccion', role: 'group', 'aria-labelledby': idRec },
    h('span', { id: idRec, class: 'campo-etiqueta', text: P.recomendadasTitulo }),
    recomendadas.length
      ? [h('p', { class: 'campo-ayuda', text: P.recomendadasAyuda }), chipsRec,
        fechaRec ? h('p', { class: 'campo-ayuda', text: P.recomendadasFecha(fechaRec, Number(sugeridas.avisos) || 0) }) : null]
      : h('p', { class: 'campo-ayuda', text: sugeridas.calculadas_en ? P.recomendadasNinguna : P.recomendadasVacio }));
  const idCla = id('claves');
  const subCla = h('div', { class: 'seccion', role: 'group', 'aria-labelledby': idCla },
    h('div', { class: 'interruptor-fila' }, h('span', { id: idCla, class: 'campo-etiqueta', text: P.palabrasClaveLista }), cuentaCla),
    listaCla, h('p', { class: 'campo-ayuda', id: 'ayuda-claves', text: P.palabrasClaveListaAyuda }), error('err-claves'));
  const apagadoCla = h('p', { class: 'campo-ayuda', text: P.palabrasClaveApagado(recomendadas.length) });
  // En No, la lista y las recomendadas no se muestran (no se borran: vuelven al ponerlo en Sí).
  function verPersonalizadas() {
    apagadoCla.hidden = !!v.usar_palabras_clave;
    subRec.hidden = !v.usar_palabras_clave;
    subCla.hidden = !v.usar_palabras_clave;
  }
  const sAvisoCla = conAviso ? conInterruptor(P.clavesAviso, P.clavesAvisoAyuda, v.palabras_clave_aviso, (x) => { v.palabras_clave_aviso = x; }) : null;
  const sCla = conClaves ? conInterruptor(P.recomendado(P.palabrasClave), P.palabrasClaveAyuda, v.usar_palabras_clave,
    (x) => { v.usar_palabras_clave = x; verPersonalizadas(); limpiar('err-claves'); }) : null;
  if (sCla) { sCla.append(apagadoCla, subRec, subCla); verPersonalizadas(); }
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
    // La línea y la cuenta de la guía del umbral dicen qué hace Terna para arriba (diseno.md 0.15 §9.3).
    guia.actualizar();
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
  // La dueña del buzón no tiene a quién reenviar (Gmail no deja reenviarse a uno mismo): sin dirección, con su filtro.
  const { direccion, dueno } = Terna.alertasMail(config, ctx.usuario);
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
    dueno ? null : h('div', { class: 'direccion' }, code, h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(direccion, code) }, icono('i-pegar'), P.copiarDireccion)),
    h('ol', { class: 'pasos' }, (dueno ? P.alertasPasosDueno : P.alertasPasos).map((x) => h('li', { text: x }))),
    item(P.portalesTitulo, h('ul', { class: 'portales' }, P.portales.map(filaPortal)), alertas ? h('p', { class: 'campo-ayuda', text: P.portalesAyuda }) : null),
    item(dueno ? P.reenvioTituloDueno : P.reenvioTitulo, h('p', { class: 'campo-ayuda', text: dueno ? P.reenvioAyudaDueno : P.reenvioAyuda }),
      h('div', { class: 'guias-correo' }, (dueno ? P.guiasCorreoDueno : P.guiasCorreo).map(linkGuia))),
    h('p', { class: 'campo-ayuda', text: dueno ? P.alertasNotaDueno : P.alertasNota }),
  ].filter(Boolean);

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
    ['err-umbral', 'err-mod', 'err-sal', 'err-paq', 'err-puestos', 'err-niv', 'err-jor', 'err-disp', 'err-claves'].forEach((x) => marcar(x, ''));
    let ok = true;
    v.puestos_objetivo = leerPuestos();
    if (v.puestos_objetivo.length > MAX_PUESTOS) { marcar('err-puestos', T.errores.puestosDemasiados(MAX_PUESTOS)); ok = false; }
    else if (v.puestos_objetivo.some((x) => x.length > MAX_LARGO_PUESTO)) { marcar('err-puestos', T.errores.puestoLargo(MAX_LARGO_PUESTO)); ok = false; }
    if (conClaves) {
      v.palabras_clave = leerClaves();
      if (v.palabras_clave.length > MAX_CLAVES) { marcar('err-claves', T.errores.palabrasClaveDemasiadas(MAX_CLAVES)); ok = false; }
      else if (v.palabras_clave.some((x) => x.length > MAX_LARGO_CLAVE)) { marcar('err-claves', T.errores.palabraClaveLarga(MAX_LARGO_CLAVE)); ok = false; }
    }
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
    const clavesCambiaron = conClaves && huellaClaves() !== clavesGuardadas;
    if (clavesCambiaron) {
      fila.palabras_clave = v.palabras_clave;
      fila.usar_palabras_clave = !!v.usar_palabras_clave;
      if (conAviso) fila.palabras_clave_aviso = !!v.palabras_clave_aviso;
    }
    if (conPriorizar) fila.priorizar_puestos = !!v.priorizar_puestos;
    const { error: e } = await sb.from('preferencias').update(fila).eq('usuario_id', uid);
    bGuardar.removeAttribute('aria-disabled');
    if (e) {
      if (Terna.siSesionVencida(e)) return;
      const clave = String(e.message || '').trim();
      const destino = { umbral_fuera_de_rango: 'err-umbral', modalidades_vacias: 'err-mod', salario_incompleto: 'err-sal', salario_rango_invalido: 'err-sal', paquetes_por_dia_invalido: 'err-paq',
        niveles_vacios: 'err-niv', jornadas_vacias: 'err-jor', puestos_demasiados: 'err-puestos', puesto_largo: 'err-puestos',
        palabras_clave_demasiadas: 'err-claves', palabra_clave_larga: 'err-claves' }[clave];
      if (destino) { marcar(destino, Terna.textoError(e)); mostrarBanda(T.errores.guardarCampos); } else mostrarBanda(T.errores.guardar);
      return;
    }
    if (clavesCambiaron) clavesGuardadas = huellaClaves();
    Terna.avisoBreve(P.guardado);
  });

  /* ---------- Página ---------- */
  Terna.vaciar(raiz);
  bloques.bloque('busqueda', P.grupos.busqueda, [sPue, sNiv, sJor, sMod, sAlc, sUmbral, sSal]);
  bloques.bloque('paquetes', P.grupos.paquetes, [sInt, sArm, sPaq, sIdi, sAvisoCla, sCla, sPos, sRev].filter(Boolean));
  bloques.bloque('respuestas', P.respuestas, cResp);
  bloques.bloque('alertas', P.alertas, cAlertas);
  bloques.bloque('cuenta', P.grupos.cuenta, [sPausa, sBorrar]);
  bloques.montar({ arriba: [banda], guardar: h('div', { class: 'guardar-fijo' }, bGuardar) });
});
