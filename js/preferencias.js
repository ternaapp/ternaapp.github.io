/* Terna · js/preferencias.js
   Preferencias (diseno.md 0.20 §9.3 y §10.17; brand.md 0.7.1 §6.7; datos.md 0.24, 0019, 0026 y 0028): las columnas de preferencias (con "Qué buscás", 0015, y las palabras clave, 0026), la guía del umbral (con los avisos propios de mis_avisos) y
   las alertas por mail (la dirección, cada portal con su última alerta y el link a su guía en alertas.html), en tres bloques:
   Búsqueda, Paquetes y postulación y Alertas por mail. Desde 0.20 Paquetes y postulación va en dos subtemas, Paquetes y
   Postulación, como Mi perfil › Datos. Desde 0.19 las respuestas para formularios y Tu cuenta están en Mi perfil
   (perfil.js, respuestas.js): sus hash de antes (#respuestas, #cuenta) llevan ahí, y esta página ya no escribe esas columnas.
   Desde 0028 los paquetes por día son siempre 3: no hay qué elegir y la ayuda de Armar paquetes dice cuántos arma y en qué orden.
   Desplegables en celular y carril desde 768 px, con Terna.porBloques (comun.js), igual que Mi perfil; los ítems se arman con
   Terna.piezas, las mismas piezas que usa Mi perfil.
   "Guardar preferencias" escribe todo; las palabras clave (0026; datos.md 0.23; brand.md 0.6 §6.7), solo si cambiaron en la
   página, así una pestaña abierta antes no las pisa. Desde 0027 (datos.md 0.22; brand.md 0.5.4 §6.7; diseno.md 0.18
   §9.3), "Priorizar mis puestos" va debajo de "Puestos que buscás" y solo con algún puesto escrito; sin la columna no se muestra
   y vale Sí, como en el motor. La regla de qué aviso es de tus puestos está en js/puestos.js.
   Desde diseno.md 0.27 (§1.38; brand.md 0.14 §6.7), "Salario" va en Paquetes, al final: es una de las cuatro partes del paquete
   (CV, carta, notas y salario) y no filtra avisos; hasta 0.26 era el último ítem de Búsqueda. Lee y escribe lo mismo.
   Desde diseno.md 0.29 (§9.3; brand.md 0.16 §6.7; datos.md 0.32, 0036), "¿Terna crea cuentas por vos?" va en Postulación, justo
   debajo de "Terna postula por vos" y solo con su Sí: una pregunta que escribe en el acto, con la contraseña de los sitios y la
   lista de sitios donde Terna creó una cuenta. A quién se le muestra y la cuenta del último mes, en js/cuentas.js. */
'use strict';

// Respuestas para formularios y Tu cuenta están en Mi perfil desde 0.19: los links de antes (preferencias.html#respuestas, el de
// "Completar respuestas para formularios" que guardó alguien, #cuenta) llevan ahí, antes de armar nada.
if (/^#(respuestas|cuenta)$/.test(location.hash)) location.replace('perfil.html' + location.hash);

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
    sb.from('mis_avisos').select('match, interes, creado_en, puesto, empresa').limit(1000),
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
  // Los paquetes por día (0028: siempre 3; config.paquetes_por_dia_opciones = {3}). Ya no se eligen: la ayuda de Armar paquetes
  // y la cuenta de la guía del umbral los dicen.
  const defectoPaquetes = config.paquetes_por_dia_default || 3;
  const bloques = Terna.porBloques({ raiz, cabecera: document.getElementById('cabecera'), nombre: T.comun.pestanas.preferencias });

  /* ---------- Piezas (comun.js: las mismas de Mi perfil; diseno.md 0.19 §10.17) ---------- */
  const { id, item, grupoRadios, interruptor, conInterruptor } = Terna.piezas({ prefijo: 'pref', nivel: 'h3' });
  // Las de Paquetes y postulación van dentro de un subtema, así que su título es un <h4> (diseno.md 0.20 §9.3).
  const enTema = Terna.piezas({ prefijo: 'paq', nivel: 'h4' });
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

  /* ---------- Búsqueda: umbral (con su guía), modalidades y alcance ---------- */
  /* La guía del umbral (diseno.md 0.15 §9.3; brand.md 0.5.1 §6.7). Arriba del deslizador, el cuadro de cinco franjas con lo que
     suele haber en cada una según match.v2 y cuántos avisos de la lista caen ahí, y la línea del umbral; debajo, la cuenta de lo
     que llega con el número elegido, que es la descripción del deslizador. Cambia con el deslizador, con los botones de las
     franjas (ponen su número y llevan el foco al deslizador) y con Armar paquetes y Terna postula por vos. */
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
      if (llegan.length || ademas) partes.push(v.armar_paquetes ? G.arma(defectoPaquetes) : T.inicio.resultado.armar_no);
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
  /* ---------- Empresas que seguís (0034; brand.md 0.13 §6.7; diseno.md 0.26 §9.3; datos.md 0.30) ----------
     Dentro de Búsqueda, debajo de los puestos y con la misma forma: una casilla por empresa, numeradas, hasta 10, y se guarda con
     "Guardar preferencias". Solo nombres (Francisco, 07/11/2026: sin links, "si no está, que se joda"): Terna no sale a buscarlas,
     marca sus avisos cuando llegan por sus fuentes. Al escribir sugiere las empresas de los avisos de la persona. Sin 0034 (sin la
     columna empresas_seguidas), no está. */
  const conEmpresas = Object.prototype.hasOwnProperty.call(data, 'empresas_seguidas');
  const MAX_EMPRESAS = 10;  // config.max_empresas_seguidas (0034); la base lo hace cumplir
  const MAX_LARGO_EMPRESA = 80;
  let sEmp = null;
  let leerEmpresas = () => [];
  if (conEmpresas) {
    const E = P.empresas;
    v.empresas_seguidas = (data.empresas_seguidas || []).slice();
    v.priorizar_empresas = data.priorizar_empresas !== false;
    const idEmp = id('empresas');
    const idLista = id('empresas-sugeridas');
    const listaEmp = h('ol', { class: 'puestos empresas' });
    const cuentaEmp = h('span', { class: 'puestos-cuenta num' });
    const generalesEmp = h('p', { class: 'campo-nota', hidden: true, role: 'status' });
    // Las empresas de los avisos de la persona (sin los que no le interesan), para decir debajo de cada casilla si el nombre ya encuentra
    // algo, con la regla del motor (revisión de UX: la persona no sabía si el nombre servía).
    const empresasAvisos = (lecturaAvisos.data || []).filter((a) => a.interes !== 'no_me_interesa').map((a) => a.empresa || '');
    const coincidencias = (nombre) => (window.Empresas ? empresasAvisos.filter((e) => Empresas.misma(e, nombre)).length : 0);
    const filasEmp = () => Array.from(listaEmp.children);
    // Igual que validar_empresas_seguidas (0034): sin espacios de más, sin vacías y sin repetidas (por el nombre simple), en orden.
    const simple = (x) => x.normalize('NFKD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    leerEmpresas = () => {
      const vistas = new Set();
      return filasEmp().map((li) => inputDe(li).value.trim().replace(/\s+/g, ' ')).filter((x) => {
        const k = simple(x);
        if (!x || !k || vistas.has(k)) return false;
        vistas.add(k);
        return true;
      });
    };
    // Las empresas de los avisos de la persona, para sugerir el nombre como aparece (un <datalist>: el navegador las filtra).
    const sugeridas = Array.from(new Set((lecturaAvisos.data || []).map((a) => (a.empresa || '').trim()).filter(Boolean))).sort((x, y) => x.localeCompare(y, 'es'));
    const datalist = h('datalist', { id: idLista }, sugeridas.slice(0, 300).map((e) => h('option', { value: e })));
    function filaEmpresa(valor) {
      const input = h('input', { class: 'control', type: 'text', maxlength: String(MAX_LARGO_EMPRESA), autocomplete: 'off', spellcheck: 'false',
        list: idLista, value: valor || '', 'aria-describedby': 'ayuda-empresas err-empresas' });
      const quitar = h('button', { type: 'button' }, icono('i-cerrar'));
      const numero = h('span', { class: 'puesto-numero num', 'aria-hidden': 'true' });
      const idCoincide = id('emp-coincide');
      const coincide = h('p', { class: 'empresa-coincide', id: idCoincide });
      input.setAttribute('aria-describedby', idCoincide + ' ayuda-empresas err-empresas');
      const li = h('li', { class: 'puesto' }, numero, h('div', { class: 'control-con-boton' }, input, quitar), coincide);
      input.addEventListener('input', () => { if (li === filasEmp()[filasEmp().length - 1] && input.value.trim()) ordenarEmpresas(); else contarEmpresas(); limpiar('err-empresas'); });
      input.addEventListener('keydown', (e) => {
        const filas = filasEmp();
        const i = filas.indexOf(li);
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filas[i + 1]) inputDe(filas[i + 1]).focus();
        } else if (e.key === 'Backspace' && !input.value && i > 0) {
          e.preventDefault();
          const anterior = inputDe(filas[i - 1]);
          if (i < filas.length - 1) { li.remove(); ordenarEmpresas(); }
          anterior.focus();
          anterior.setSelectionRange(anterior.value.length, anterior.value.length);
        }
      });
      input.addEventListener('blur', () => {
        if (!input.value.trim() && li.nextElementSibling && li.isConnected) { input.value = ''; li.remove(); ordenarEmpresas(); }
      });
      quitar.addEventListener('click', () => {
        const siguiente = li.nextElementSibling || li.previousElementSibling;
        li.remove();
        ordenarEmpresas();
        inputDe(siguiente && siguiente.isConnected ? siguiente : filasEmp()[filasEmp().length - 1]).focus();
        limpiar('err-empresas');
      });
      return li;
    }
    function contarEmpresas() {
      filasEmp().forEach((li) => {
        const texto = inputDe(li).value.trim();
        li.querySelector('.empresa-coincide').textContent = texto.length >= 2 ? E.coincide(coincidencias(texto)) : '';
      });
      v.empresas_seguidas = leerEmpresas();
      cuentaEmp.textContent = E.cuenta(v.empresas_seguidas.length, MAX_EMPRESAS);
      const muy = v.empresas_seguidas.filter((x) => window.Empresas && Empresas.general(x));
      generalesEmp.hidden = !muy.length;
      generalesEmp.textContent = muy.map((x) => E.general(x)).join(' ');
      sPriE.hidden = !v.empresas_seguidas.length;
    }
    // Numera, deja una sola casilla vacía al final (si hay lugar), muestra "Quitar" solo donde hay texto y cuenta.
    function ordenarEmpresas() {
      let filas = filasEmp();
      const ultima = filas[filas.length - 1];
      if (filas.length < MAX_EMPRESAS && (!ultima || inputDe(ultima).value.trim())) listaEmp.append(filaEmpresa(''));
      filas = filasEmp();
      filas.forEach((li, i) => {
        const input = inputDe(li);
        const texto = input.value.trim();
        const vacia = !texto && i === filas.length - 1;
        li.querySelector('.puesto-numero').textContent = (i + 1) + '.';
        li.classList.toggle('puesto-nuevo', vacia);
        input.setAttribute('aria-label', E.empresa(i + 1));
        input.placeholder = vacia ? (i === 0 ? E.empresaPrimera : E.empresaOtra) : '';
        const quitar = li.querySelector('button');
        quitar.hidden = !texto;
        quitar.setAttribute('aria-label', E.quitar(texto || E.empresa(i + 1)));
      });
      contarEmpresas();
    }
    const idPriE = id('priorizar-empresas');
    const idPriEA = id('priorizar-empresas-ayuda');
    const sPriE = h('div', { class: 'seccion priorizar priorizar-empresas', dataset: { titulo: idPriE } });
    const botonPriE = interruptor(sPriE, v.priorizar_empresas, (x) => { v.priorizar_empresas = x; });
    botonPriE.setAttribute('aria-describedby', idPriEA);
    sPriE.append(h('div', { class: 'interruptor-fila' }, h('span', { id: idPriE, class: 'campo-etiqueta', text: E.priorizar }), botonPriE),
      h('p', { class: 'campo-ayuda', id: idPriEA, text: E.priorizarAyuda(config.piso_match || 50) }));
    v.empresas_seguidas.slice(0, MAX_EMPRESAS).forEach((x) => listaEmp.append(filaEmpresa(x)));
    ordenarEmpresas();
    sEmp = h('div', { class: 'subbloque empresas-seguidas', role: 'group', 'aria-labelledby': idEmp },
      h('div', { class: 'interruptor-fila' }, h('h3', { id: idEmp, class: 'tarjeta-titulo', text: E.titulo }), cuentaEmp),
      listaEmp, datalist, h('p', { class: 'campo-ayuda', id: 'ayuda-empresas', text: E.ayuda }), generalesEmp, error('err-empresas'), sPriE);
  }
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

  /* ---------- Paquetes y postulación, en dos subtemas (diseno.md 0.20 §9.3; brand.md 0.7.1 §6.7) ----------
     Paquetes: qué avisos te interesan, armar (3 por día), el idioma, las palabras clave y, desde 0.27, el salario.
     Postulación: postular y revisar. */
  const sInt = enTema.conInterruptor(P.interesDefecto, P.interesDefectoAyuda, v.interes_por_defecto, (x) => { v.interes_por_defecto = x; });
  const sArm = enTema.conInterruptor(P.armar, P.armarAyuda(defectoPaquetes), v.armar_paquetes, (x) => { v.armar_paquetes = x; atenuar(); });
  const sIdi = enTema.grupoRadios(P.idiomaDocs, 'idioma', [['aviso', P.idiomaAviso], ['espanol', P.idiomaEspanol]], v.idioma_documentos, (x) => { v.idioma_documentos = x; });
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
  const sAvisoCla = conAviso ? enTema.conInterruptor(P.clavesAviso, P.clavesAvisoAyuda, v.palabras_clave_aviso, (x) => { v.palabras_clave_aviso = x; }) : null;
  const sCla = conClaves ? enTema.conInterruptor(P.recomendado(P.palabrasClave), P.palabrasClaveAyuda, v.usar_palabras_clave,
    (x) => { v.usar_palabras_clave = x; verPersonalizadas(); limpiar('err-claves'); }) : null;
  if (sCla) { sCla.append(apagadoCla, subRec, subCla); verPersonalizadas(); }
  /* Salario (diseno.md 0.27 §1.38 y §9.3; brand.md 0.14 §6.7): el último ítem de Paquetes, como el salario es la última de las
     cuatro fichas del paquete (CV, Carta, Notas, Salario; diseno.md §10.12), y justo antes de Postulación, porque su ayuda
     termina en lo que Terna responde en un formulario. Hasta 0.26, al final de Búsqueda; no se atenúa con Armar paquetes en No,
     como el idioma y las palabras clave. Su error sigue siendo #err-sal y ahora marca este bloque. */
  const sSal = enTema.grupoRadios(P.salario, 'salario', [['sugerir', P.sugerir], ['rango', P.rango]], v.salario_modo, (x) => { v.salario_modo = x; camposRango.hidden = x !== 'rango'; limpiar('err-sal'); });
  const numeroCampo = (clave, etiqueta) => {
    const idC = enTema.id(clave);
    const input = h('input', { class: 'control num', id: idC, type: 'number', min: '0', step: '1', inputmode: 'numeric', value: v[clave] === null || v[clave] === undefined ? '' : String(Number(v[clave])), 'aria-describedby': 'err-sal' });
    input.addEventListener('input', () => { v[clave] = input.value === '' ? null : Number(input.value); limpiar('err-sal'); });
    return h('div', { class: 'campo' }, h('label', { for: idC, text: etiqueta }), input);
  };
  const idMoneda = enTema.id('moneda');
  const moneda = h('select', { class: 'control', id: idMoneda, 'aria-describedby': 'err-sal' },
    h('option', { value: '', text: '' }), ['ARS', 'USD'].map((m) => h('option', { value: m, text: m, selected: v.salario_moneda === m })));
  moneda.addEventListener('change', () => { v.salario_moneda = moneda.value || null; limpiar('err-sal'); });
  const camposRango = h('div', { class: 'seccion', hidden: v.salario_modo !== 'rango' },
    h('div', { class: 'dos' }, numeroCampo('salario_min', P.minimo), numeroCampo('salario_max', P.maximo)),
    h('div', { class: 'campo' }, h('label', { for: idMoneda, text: P.moneda }), moneda));
  sSal.append(camposRango, h('p', { class: 'campo-ayuda', text: P.salarioAyuda }), error('err-sal'));
  const sPos = enTema.conInterruptor(P.postularSola, P.postularSolaAyuda, v.postular_sola, (x) => {
    const antes = v.postular_sola;
    v.postular_sola = x;
    atenuar();
    // Al pasar de No a Sí la pregunta de las cuentas aparece debajo y recibe el foco; con No no se muestra (diseno.md 0.29 §9.3).
    if (cuentas) cuentas.mostrar(x, x && !antes);
  });
  const sRev = enTema.conInterruptor(P.revisar, P.revisarAyuda, v.revisar_antes_de_enviar, (x) => { v.revisar_antes_de_enviar = x; });

  /* ---------- ¿Terna crea cuentas por vos? (diseno.md 0.29 §9.3; brand.md 0.16 §6.7; datos.md 0.32, 0036) ----------
     No es un interruptor suelto sino una pregunta con su contexto: nace sin respuesta (ninguno de los dos marcado, y eso es No),
     escribe en el acto como Pausar mi cuenta, y no espera a "Guardar preferencias". Con Sí, debajo: la contraseña de los sitios,
     que se pide recién cuando ese bloque está por verse y vive solo en su campo, y los sitios donde Terna creó una cuenta. */
  function preguntaCuentas() {
    const C = P.cuentas;
    const titulo = h('h4', { id: 'cuentas-titulo', class: 'tarjeta-titulo', tabindex: '-1', text: C.titulo });
    // El número del último mes llega después (una lectura aparte) y va en peso 700, pegado al primer párrafo.
    const numero = h('strong', { id: 'cuentas-numero', hidden: true });
    const err = h('p', { class: 'campo-error', id: 'err-cuentas', role: 'alert' });
    let valor = v.crear_cuentas === true ? 'si' : (v.crear_cuentas === false ? 'no' : '');
    const radio = (val, texto) => h('label', { class: 'casilla' },
      h('input', { type: 'radio', name: 'crear-cuentas', value: val, checked: valor === val, 'aria-describedby': 'err-cuentas', onchange: () => responder(val) }),
      h('span', { text: texto }));
    const opciones = h('div', { class: 'opciones' }, radio('si', C.si), radio('no', C.no));

    // La contraseña: tapada, de solo lectura, con "Ver" / "Ocultar" y "Copiar". No queda en ninguna variable: solo en el campo.
    const idClave = 'cuentas-contrasena';
    const campoClave = h('input', { class: 'control', id: idClave, type: 'password', readOnly: true, autocomplete: 'off', spellcheck: 'false',
      'aria-describedby': 'cuentas-contrasena-ayuda cuentas-contrasena-error' });
    const bVer = h('button', { class: 'btn', type: 'button', id: 'cuentas-ver', text: C.ver });
    const bCopiar = h('button', { class: 'btn', type: 'button', id: 'cuentas-copiar' }, icono('i-pegar'), C.copiar);
    const tapar = () => { campoClave.type = 'password'; bVer.textContent = C.ver; };
    bVer.addEventListener('click', () => {
      if (campoClave.type === 'password') { campoClave.type = 'text'; bVer.textContent = C.ocultar; } else tapar();
    });
    bCopiar.addEventListener('click', async () => {
      if (!campoClave.value) return;
      try {
        await navigator.clipboard.writeText(campoClave.value);
        Terna.avisoBreve(C.copiada);
      } catch (e) {
        // Sin permiso para el portapapeles: queda a la vista y seleccionada, para copiarla a mano.
        campoClave.type = 'text';
        bVer.textContent = C.ocultar;
        campoClave.focus();
        campoClave.select();
        Terna.avisoBreve(T.comun.copiarFallo);
      }
    });
    const errClave = h('p', { class: 'campo-error', id: 'cuentas-contrasena-error', role: 'alert' });
    const listaSitios = h('ul', { class: 'sitios', id: 'cuentas-sitios', 'aria-labelledby': 'cuentas-sitios-titulo' });
    const sinSitios = h('p', { class: 'suave', id: 'cuentas-sin-sitios', text: C.ninguna, hidden: true });
    const errSitios = h('p', { class: 'campo-error', id: 'cuentas-sitios-error', role: 'alert' });
    const detalle = h('div', { class: 'cuentas-detalle', id: 'cuentas-detalle', hidden: true },
      h('div', { class: 'campo' }, h('label', { for: idClave, text: C.contrasena }),
        h('div', { class: 'contrasena-sitios' }, campoClave, bVer, bCopiar),
        h('p', { class: 'campo-ayuda', id: 'cuentas-contrasena-ayuda', text: C.contrasenaAyuda }), errClave),
      h('div', { class: 'campo' }, h('span', { class: 'campo-etiqueta', id: 'cuentas-sitios-titulo', text: C.sitios }), listaSitios, sinSitios, errSitios));

    const estadoSitio = (s) => {
      const e = C.estado[s.estado];
      return typeof e === 'function' ? e(Terna.fechaCorta(s.creada_en)) : (e || '');
    };
    let pedido = false;
    let observador = null;
    async function pedirDetalle() {
      if (pedido) return;
      pedido = true;
      const [rClave, rSitios] = await Promise.all([
        sb.rpc('leer_contrasena_sitios'),
        sb.from('cuentas_sitios').select('sitio, estado, creada_en, confirmada_en').order('creada_en', { ascending: false }),
      ]);
      // Mientras llegaba, la persona pudo decir que no: entonces no se escribe nada.
      if (!pedido) return;
      if (rClave.error) { if (!Terna.siSesionVencida(rClave.error)) errClave.textContent = Terna.textoError(rClave.error); }
      else campoClave.value = typeof rClave.data === 'string' ? rClave.data : '';
      bVer.disabled = bCopiar.disabled = !campoClave.value;
      Terna.vaciar(listaSitios);
      // Si la lista no se pudo leer, lo dice: "Todavía ninguna" es solo cuando de verdad no hay.
      const sitios = rSitios.error ? [] : (rSitios.data || []);
      for (const s of sitios) listaSitios.append(h('li', null, h('span', { class: 'sitio-nombre', text: s.sitio }), h('span', { class: 'sitio-estado', text: '· ' + estadoSitio(s) })));
      listaSitios.hidden = !sitios.length;
      sinSitios.hidden = !!sitios.length || !!rSitios.error;
      errSitios.textContent = rSitios.error && !Terna.esErrorDeSesion(rSitios.error) ? Terna.textoError(rSitios.error) : '';
    }
    function verDetalle(ver) {
      detalle.hidden = !ver;
      if (observador) { observador.disconnect(); observador = null; }
      if (!ver) {
        // Con No (o con la pregunta oculta) la contraseña no queda en la página.
        pedido = false;
        campoClave.value = '';
        errClave.textContent = '';
        errSitios.textContent = '';
        tapar();
        return;
      }
      if (pedido) return;
      bVer.disabled = bCopiar.disabled = true;
      if ('IntersectionObserver' in window) {
        observador = new IntersectionObserver((vistos) => { if (vistos.some((x) => x.isIntersecting)) { observador.disconnect(); observador = null; pedirDetalle(); } }, { rootMargin: '200px 0px' });
        observador.observe(detalle);
      } else pedirDetalle();
    }

    async function responder(val) {
      const antes = valor;
      err.textContent = '';
      const inputs = Array.from(opciones.querySelectorAll('input'));
      inputs.forEach((x) => { x.disabled = true; });
      const e = await Cuentas.responder(sb, uid, val === 'si');
      inputs.forEach((x) => { x.disabled = nodo.classList.contains('atenuado'); });
      if (e) {
        // No se escribió: los botones vuelven a como estaban y el error queda junto a ellos.
        inputs.forEach((x) => { x.checked = x.value === antes; });
        if (!Terna.siSesionVencida(e)) { err.textContent = T.errores.guardar; bloques.marcarErrores(); }
        return;
      }
      valor = val;
      v.crear_cuentas = val === 'si';
      verDetalle(val === 'si' && !nodo.hidden);
      Terna.avisoBreve(T.comun.guardado);
    }

    const nodo = h('div', { class: 'subbloque cuentas', id: 'cuentas', role: 'group', 'aria-labelledby': 'cuentas-titulo', hidden: !v.postular_sola },
      titulo, h('p', null, C.porQue, ' ', numero), h('p', { text: C.queHace }), h('p', { text: C.saber }),
      h('p', { class: 'campo-ayuda', text: C.guiaEnCamino }), opciones, err, detalle);
    nodo.dataset.titulo = 'cuentas-titulo';

    // Con "Terna postula por vos" en No la pregunta no se muestra (no se atenúa: sin postular no hay nada que preguntar).
    function mostrar(si, conFoco) {
      nodo.hidden = !si;
      verDetalle(si && valor === 'si');
      if (si && conFoco) titulo.focus();
    }
    // El número del último mes, si lo hay: las postulaciones que hoy quedan a mano porque el sitio pide una cuenta.
    Cuentas.leerAMano(sb).then((r) => {
      const cuantas = r.error ? 0 : Cuentas.delUltimoMes(r.data, v);
      if (cuantas) { numero.textContent = C.ultimoMes(cuantas); numero.hidden = false; }
    }, () => {});
    verDetalle(!nodo.hidden && valor === 'si');
    return { nodo, mostrar };
  }
  const cuentas = Cuentas.seOfrecen(ctx.usuario, data) ? preguntaCuentas() : null;

  const temaPaquetes = Terna.subtema(P.temas.paquetes, null, [sInt, sArm, sIdi, sAvisoCla, sCla, sSal].filter(Boolean));
  const temaPostulacion = Terna.subtema(P.temas.postulacion, null, [sPos, cuentas ? cuentas.nodo : null, sRev].filter(Boolean));
  // Atenuar (diseno.md §9.3): el ítem sigue visible y legible; sus controles quedan inactivos hasta que vuelva a aplicar.
  function atenuar() {
    const poner = (sec, off) => {
      sec.classList.toggle('atenuado', off);
      sec.querySelectorAll('input, button[role="switch"]').forEach((x) => { x.disabled = off; });
    };
    poner(sPos, !v.armar_paquetes);
    // La pregunta de las cuentas se atenúa con "Terna postula por vos": sin paquetes Terna no postula.
    if (cuentas) {
      cuentas.nodo.classList.toggle('atenuado', !v.armar_paquetes);
      cuentas.nodo.querySelectorAll('input[type="radio"]').forEach((x) => { x.disabled = !v.armar_paquetes; });
    }
    poner(sRev, !v.postular_sola || !v.armar_paquetes);
    // La línea y la cuenta de la guía del umbral dicen qué hace Terna para arriba (diseno.md 0.15 §9.3).
    guia.actualizar();
  }
  atenuar();

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
    ['err-umbral', 'err-mod', 'err-sal', 'err-puestos', 'err-empresas', 'err-niv', 'err-jor', 'err-claves'].forEach((x) => marcar(x, ''));
    let ok = true;
    if (conEmpresas) {
      v.empresas_seguidas = leerEmpresas();
      if (v.empresas_seguidas.length > MAX_EMPRESAS) { marcar('err-empresas', T.errores.empresasDemasiadas(MAX_EMPRESAS)); ok = false; }
      else if (v.empresas_seguidas.some((x) => x.length < 2 || x.length > MAX_LARGO_EMPRESA)) { marcar('err-empresas', T.errores.empresaNombre); ok = false; }
    }
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
    if (!ok) { mostrarBanda(T.errores.guardarCampos); return; }
    bGuardar.setAttribute('aria-disabled', 'true');
    const fila = {
      umbral: v.umbral, modalidades: v.modalidades, alcance: v.alcance,
      salario_modo: v.salario_modo,
      salario_min: v.salario_modo === 'rango' ? v.salario_min : null,
      salario_max: v.salario_modo === 'rango' ? v.salario_max : null,
      salario_moneda: v.salario_modo === 'rango' ? v.salario_moneda : null,
      // Sin paquetes_por_dia (0028: siempre 3) ni las respuestas para formularios (las escribe Mi perfil desde 0.19).
      idioma_documentos: v.idioma_documentos, armar_paquetes: v.armar_paquetes,
      interes_por_defecto: v.interes_por_defecto, postular_sola: v.postular_sola, revisar_antes_de_enviar: v.revisar_antes_de_enviar,
      puestos_objetivo: v.puestos_objetivo, niveles: v.niveles, jornadas: v.jornadas,
    };
    const clavesCambiaron = conClaves && huellaClaves() !== clavesGuardadas;
    if (clavesCambiaron) {
      fila.palabras_clave = v.palabras_clave;
      fila.usar_palabras_clave = !!v.usar_palabras_clave;
      if (conAviso) fila.palabras_clave_aviso = !!v.palabras_clave_aviso;
    }
    if (conPriorizar) fila.priorizar_puestos = !!v.priorizar_puestos;
    if (conEmpresas) {
      fila.empresas_seguidas = v.empresas_seguidas;
      fila.priorizar_empresas = !!v.priorizar_empresas;
    }
    const { error: e } = await sb.from('preferencias').update(fila).eq('usuario_id', uid);
    bGuardar.removeAttribute('aria-disabled');
    if (e) {
      if (Terna.siSesionVencida(e)) return;
      const clave = String(e.message || '').trim();
      const destino = { umbral_fuera_de_rango: 'err-umbral', modalidades_vacias: 'err-mod', salario_incompleto: 'err-sal', salario_rango_invalido: 'err-sal',
        niveles_vacios: 'err-niv', jornadas_vacias: 'err-jor', puestos_demasiados: 'err-puestos', puesto_largo: 'err-puestos',
        palabras_clave_demasiadas: 'err-claves', palabra_clave_larga: 'err-claves',
        empresas_demasiadas: 'err-empresas', empresa_nombre_invalido: 'err-empresas' }[clave];
      if (destino) { marcar(destino, Terna.textoError(e)); mostrarBanda(T.errores.guardarCampos); } else mostrarBanda(T.errores.guardar);
      return;
    }
    if (clavesCambiaron) clavesGuardadas = huellaClaves();
    Terna.avisoBreve(P.guardado);
  });

  /* ---------- Página ---------- */
  Terna.vaciar(raiz);
  // Desde 0.26, con dos subtemas en el carril: los puestos y, con 0034, las empresas (#puestos y #empresas, los links de Inicio).
  bloques.bloque('busqueda', P.grupos.busqueda, [sPue, sEmp, sNiv, sJor, sMod, sAlc, sUmbral].filter(Boolean), { temas: [
    { hash: 'puestos', titulo: P.puestos, nodo: sPue },
    sEmp ? { hash: 'empresas', titulo: P.empresas.titulo, nodo: sEmp } : null,
  ].filter(Boolean) });
  // Paquetes es el principio del bloque: usa su mismo hash, así #paquetes (el link "Ir a mis palabras clave" de la ficha y los de
  // antes) sigue llevando al bloque, que arranca en él. Postulación tiene el suyo.
  bloques.bloque('paquetes', P.grupos.paquetes, [temaPaquetes, temaPostulacion], { temas: [
    { hash: 'paquetes', titulo: P.temas.paquetes, nodo: temaPaquetes },
    { hash: 'postulacion', titulo: P.temas.postulacion, nodo: temaPostulacion },
  ] });
  bloques.bloque('alertas', P.alertas, cAlertas);
  bloques.montar({ arriba: [banda], guardar: h('div', { class: 'guardar-fijo' }, bGuardar) });
});
