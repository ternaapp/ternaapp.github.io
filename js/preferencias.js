/* Terna · js/preferencias.js
   Preferencias (diseno.md 0.20 §9.3 y §10.17; brand.md 0.7.1 §6.7; datos.md 0.24, 0019, 0026 y 0028): las columnas de preferencias (con "Qué buscás", 0015, y las palabras clave, 0026), la guía del umbral (con los avisos propios de mis_avisos) y
   las alertas por mail (la dirección, cada portal con su última alerta y el link a su guía en alertas.html).
   Desde PLAN-PREFERENCIAS (opciones-v3/PLAN-PREFERENCIAS.md, decisiones del 23/11/2026) va ordenada por herramienta, en el orden del
   muelle y del proceso (busca, arma, postula), con cuatro bloques:
   - Empleos (#empleos; alias #busqueda): Puestos que buscás, Empresas que seguís y dos subtemas, Filtros (nivel, jornada,
     modalidades, alcance) y Alertas por mail, en su versión corta (D4; los pasos y el reenvío quedan en alertas.html).
   - Paquetes (#paquetes): Armar paquetes, el umbral (#umbral; D1: decide desde dónde Terna trabaja sola, no qué ves), Me interesa
     por defecto y el subtema Documentos (idioma, palabras clave, CV IDEAL, salario).
   - Postulaciones (#postulaciones; alias #postulacion): Terna postula por vos, Revisar antes de enviar, ¿Terna crea cuentas por vos?
     y tres subtemas: Respuestas para formularios (#formularios; alias #respuestas: las cinco de js/respuestas.js, que volvieron de
     Mi perfil por D2, más viajar y el secundario), Datos para formularios (#datos-formularios: DNI, CUIL, nacimiento, dirección,
     portfolio, GitHub y analítico, de js/formularios.js, que volvieron de Mi perfil por D5) y Preguntas voluntarias
     (discapacidad y «Sobre vos», que escriben en el acto).
   - Quién te ve (#contratar; D3, hasta acá «Para quien contrata»).
   Lo esencial de cada bloque va primero y sin título propio (h3); lo que afina, en subtemas con franja (h4). Con «Terna postula por
   vos» en No, los tres subtemas no se apagan (D6): una línea dice que hoy Terna no los usa. Con «Armar paquetes» en No, arriba de
   Postulaciones una línea lo dice, y el lomo lo repite.
   Desde 0028 los paquetes por día son siempre 3: no hay qué elegir y la ayuda de Armar paquetes dice cuántos arma y en qué orden.
   Desplegables en celular y carril desde 768 px, con Terna.porBloques (comun.js), igual que Mi perfil; los ítems se arman con
   Terna.piezas, las mismas piezas que usa Mi perfil.
   "Guardar preferencias" escribe todo; las palabras clave (0026; datos.md 0.23; brand.md 0.6 §6.7), solo si cambiaron en la
   página, así una pestaña abierta antes no las pisa. Desde PLAN-PREFERENCIAS (§8.3) escribe además, cada cosa solo si cambió
   respecto de lo leído al entrar y en este orden: las cinco respuestas para formularios en la misma fila de preferencias;
   perfiles.portfolio y github; los datos cifrados (guardar_datos_formularios) y la dirección (guardar_direccion o
   borrar_direccion). Si una falla, se frena ahí y la banda lleva a su campo. El analítico y «Borrar dirección» escriben en el
   acto, como en Mi perfil. Desde FEEDBACK-PREFERENCIAS (23/11/2026, P1-1), mientras haya algo sin guardar una línea lo dice al
   lado del botón y salir de la página pide confirmar; los links a otra parte de esta página van con Terna.porBloques › ir() (P2-2). Sin cambios en la base: las mismas tablas, columnas, funciones y ruta de Storage. Desde 0027 (datos.md 0.22; brand.md 0.5.4 §6.7; diseno.md 0.18
   §9.3), "Priorizar mis puestos" va debajo de "Puestos que buscás" y solo con algún puesto escrito; sin la columna no se muestra
   y vale Sí, como en el motor. La regla de qué aviso es de tus puestos está en js/puestos.js.
   Desde diseno.md 0.27 (§1.38; brand.md 0.14 §6.7), "Salario" va en Paquetes, al final: es una de las cuatro partes del paquete
   (CV, carta, notas y salario) y no filtra avisos; hasta 0.26 era el último ítem de Búsqueda. Lee y escribe lo mismo.
   Desde diseno.md 0.29 (§9.3; brand.md 0.16 §6.7; datos.md 0.32, 0036), "¿Terna crea cuentas por vos?" va en Postulación, justo
   debajo de "Terna postula por vos" y solo con su Sí: una pregunta que escribe en el acto, con la contraseña de los sitios y la
   lista de sitios donde Terna creó una cuenta. A quién se le muestra y la cuenta del último mes, en js/cuentas.js.
   Desde diseno.md 0.36 (§9.3; brand.md 0.24 §6.7; datos.md 0.35, 0039), "¿Tenés una discapacidad?": Sí, No o Prefiero no responder,
   para los formularios que lo preguntan. Escribe en el acto, cifrada, con guardar_discapacidad; sin la 0039 la pregunta no se
   muestra. Desde PLAN-PREFERENCIAS va con «Sobre vos» en Preguntas voluntarias; «Tu secundario» (matemática y lengua en la escala de
   esos formularios y cómo lo sabés) y «¿Podés viajar por trabajo, también al exterior?», que sí se guardan con "Guardar
   preferencias", van en Respuestas para formularios. */
'use strict';

// Tu cuenta está en Mi perfil desde 0.19: el link de antes (preferencias.html#cuenta) lleva ahí, antes de armar nada. Desde
// PLAN-PREFERENCIAS #respuestas ya no se va: las respuestas para formularios volvieron a esta página (D2) y es un alias de
// #formularios. Mi perfil nunca redirige a #cuenta ni a #respuestas, así que entre las dos páginas no hay vuelta (§3.1).
if (location.hash === '#cuenta') location.replace('perfil.html#cuenta');

Terna.pagina('preferencias', async (ctx) => {
  const { h, icono } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const uid = ctx.usuario.id;
  const P = T.preferencias;
  const raiz = document.getElementById('preferencias');
  const NIVELES = ['pasantia', 'junior', 'semi_senior', 'senior', 'lider', 'director'];
  const JORNADAS = ['completa', 'parcial'];
  const MAX_PUESTOS = 10;
  const MAX_LARGO_PUESTO = 60;
  const MAX_CLAVES = 15;
  const MAX_LARGO_CLAVE = 40;

  // La intro, en una oración (T.preferencias.intro): el texto es el de T, no el que trae el .html.
  const intro = document.querySelector('#contenido > p.intro');
  if (intro) intro.textContent = P.intro;

  const parar = Terna.cargando(raiz);
  const [lectura, lecturaAlertas, lecturaAvisos, lecturaDiscapacidad, lecturaAuto, lecturaPerfil, lecturaAnalitico, lecturaEstudios] = await Promise.all([
    // La fila entera (la persona puede leer todas sus columnas): desde 0026 trae también las palabras clave, y sin la migración
    // no falla ni deja un error en la consola; la página anda igual, sin ese ítem (datos.md 0.21 §14).
    sb.from('preferencias').select('*').eq('usuario_id', uid).maybeSingle(),
    sb.from('alertas_mail').select('portal, recibido_en, procesado_en, avisos_detectados').eq('usuario_id', uid).order('procesado_en', { ascending: false }).limit(200),
    // La guía del umbral (diseno.md 0.15 §9.3; datos.md 0.21.2 §14): el match de los avisos propios; la vista trae solo los
    // visibles y RLS, solo los de la persona. Se cuenta en el navegador. Si la lectura falla, la guía va sin cuentas.
    sb.from('mis_avisos').select('match, interes, creado_en, puesto, empresa').limit(1000),
    // 0039: la respuesta a «¿Tenés una discapacidad?», descifrada para la persona de la sesión. Si la función no está (la base sin la
    // 0039) o la lectura falla, la pregunta no se muestra: no se ofrece algo que no se puede guardar.
    sb.rpc('leer_discapacidad'),
    // 0049: la autoidentificación, descifrada para la persona de la sesión. Sin la 0049 o si la lectura falla, no se muestra.
    sb.rpc('leer_autoidentificacion'),
    // Desde PLAN-PREFERENCIAS (D5; §8.3), lo de Datos para formularios que antes leía Mi perfil: el portfolio y, con la 0049, el GitHub
    // (sin la columna, la lectura de antes y el campo no se muestra); el analítico (si falla, el ítem no se muestra); y, de solo
    // lectura, el título, el tipo y el promedio de cada estudio (D7: el promedio se ve acá y se cambia en Mi perfil › Estudios).
    // El DNI, el CUIL, la fecha de nacimiento y la dirección no van acá: se descifran recién al acercarse (js/formularios.js).
    (async () => {
      const r = await sb.from('perfiles').select('portfolio, github').eq('usuario_id', uid).maybeSingle();
      return r.error && (r.error.code === '42703' || /github/.test(r.error.message || '')) ? sb.from('perfiles').select('portfolio').eq('usuario_id', uid).maybeSingle() : r;
    })(),
    sb.rpc('analitico'),
    sb.from('estudios').select('titulo, nivel, promedio').eq('usuario_id', uid).order('orden'),
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
  const conIdeal = Object.prototype.hasOwnProperty.call(data, 'cv_ideal');
  const conClaves = Object.prototype.hasOwnProperty.call(data, 'palabras_clave');
  const conAviso = Object.prototype.hasOwnProperty.call(data, 'palabras_clave_aviso');
  // 0027: "Priorizar mis puestos". Sin la columna, el interruptor no aparece y la guía cuenta como con Sí (el default del motor).
  const conPriorizar = Object.prototype.hasOwnProperty.call(data, 'priorizar_puestos');
  // 0039: el secundario y viajar (para los formularios que lo preguntan). Sin las columnas, los dos ítems no se muestran.
  const conSecundario = Object.prototype.hasOwnProperty.call(data, 'secundario_matematica');
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
  // Si config ofrece un solo número, el tope es el mismo para todos y la ayuda de Armar paquetes lo dice (FEEDBACK-PREFERENCIAS
  // P2-6: quien buscaba «cuántos por día» no encontraba el control y no sabía que no lo hay).
  const opcionesPaquetes = config.paquetes_por_dia_opciones;
  const topeVariable = Array.isArray(opcionesPaquetes) && new Set(opcionesPaquetes).size > 1;
  const bloques = Terna.porBloques({ raiz, cabecera: document.getElementById('cabecera'), nombre: T.comun.pestanas.preferencias });
  // Los lomos que dependen de otro bloque (Postulaciones dice si Armar paquetes está en No) se repintan recién con los bloques armados.
  let montado = false;

  /* ---------- Piezas (comun.js: las mismas de Mi perfil; diseno.md 0.19 §10.17) ---------- */
  // Lo esencial de cada bloque va sin subtema, con título <h3> (PLAN-PREFERENCIAS §2.1 y §6).
  const { id, interruptor, conInterruptor } = Terna.piezas({ prefijo: 'pref', nivel: 'h3' });
  // Lo de los subtemas (Filtros, Alertas por mail, Documentos, Respuestas para formularios), con título <h4> (diseno.md 0.20 §9.3).
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
  // Al lado del umbral, de «Me interesa por defecto» y de «Armar paquetes», el link a su tema de Cómo funciona (PLAN-UX §3.5),
  // al final de la ayuda: la ayuda dice qué hace el interruptor y el tema cuenta el resto. Los tres se llaman igual, así que
  // cada uno lleva el título de su ítem como descripción, para el lector de pantalla.
  const linkComo = (tema, idTitulo) => h('a', { class: 'ayuda-como', href: 'como-funciona.html#' + tema, 'aria-describedby': idTitulo, text: P.comoFunciona });
  function conComo(sub, tema) {
    const ayuda = sub.querySelector(':scope > .campo-ayuda');
    (ayuda || sub).append(' ', linkComo(tema, sub.dataset.titulo));
    return sub;
  }

  /* ---------- El umbral (con su guía; desde PLAN-PREFERENCIAS en Paquetes, D1), modalidades y alcance (Empleos › Filtros) ---------- */
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
        // La franja donde cae el umbral, marcada como una opción elegida (PLAN-WEB.md §3.5): ni buena ni mala, la tuya.
        x.tr.classList.toggle('con-umbral', x.f.desde <= u && u <= x.f.hasta);
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
  const idTituloUmbral = id('umbral-t');
  // El nombre del ítem es un título <h3>, como los de al lado (FEEDBACK-PREFERENCIAS P3-3: era un <label> y la lista de títulos
  // saltaba de «Armar paquetes» a «Me interesa por defecto»); el deslizador toma su nombre de él.
  rango.setAttribute('aria-labelledby', idTituloUmbral);
  const sUmbral = h('div', { class: 'subbloque' },
    h('div', { class: 'interruptor-fila' }, h('h3', { class: 'tarjeta-titulo', id: idTituloUmbral, text: P.umbral }), valorUmbral),
    guia.arriba, rango, guia.resumen,
    h('p', { class: 'campo-ayuda' }, P.umbralAyuda(config.piso_match || 50), ' ', linkComo('match', idTituloUmbral)), error('err-umbral'));
  sUmbral.dataset.titulo = idTituloUmbral;

  const idMod = id('mod');
  const sMod = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idMod, 'aria-describedby': 'ayuda-mod err-mod' }, h('h4', { id: idMod, class: 'tarjeta-titulo', text: P.modalidades }));
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
     vacía al final para el siguiente, hasta 10 (desde el 17/11/2026; 0048); los que tienen texto son los que Terna busca. Enter pasa a la casilla
     siguiente; Borrar en una casilla vacía vuelve a la anterior; una casilla vacía en el medio se va al salir de ella. */
  const idPue = id('puestos');
  const listaPue = h('ol', { class: 'puestos' });
  const cuentaPue = h('span', { class: 'puestos-cuenta num' });
  // Con las diez casillas llenas, una línea de más (brand.md 0.30 §6.7): la 10, como la de Messi.
  const llenosPue = h('p', { class: 'campo-nota puestos-llenos', hidden: true, text: P.puestosLlenos });
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
    llenosPue.hidden = v.puestos_objetivo.length < MAX_PUESTOS;
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
    listaPue, llenosPue, h('p', { class: 'campo-ayuda', id: 'ayuda-puestos', text: P.puestosAyuda }), error('err-puestos'), sPri);
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
  // Un grupo de casillas en chips, como Modalidades: al menos una. Van en Empleos › Filtros, con título <h4>.
  function grupoChips(titulo, clave, valores, etiquetas, ayuda, idErr) {
    const idT = id('t');
    const idAyuda = id('ayuda');
    const s = h('div', { class: 'subbloque', role: 'group', 'aria-labelledby': idT, 'aria-describedby': idAyuda + ' ' + idErr }, h('h4', { id: idT, class: 'tarjeta-titulo', text: titulo }));
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

  const sAlc = enTema.grupoRadios(P.alcance, 'alcance', [['local', P.local, P.localAyuda], ['exterior', P.exterior, P.exteriorAyuda], ['ambos', P.ambos]], v.alcance, (x) => { v.alcance = x; });

  /* ---------- Paquetes (PLAN-PREFERENCIAS §2.2; antes «Paquetes y postulación», diseno.md 0.20 §9.3) ----------
     Lo esencial, en el orden en que se lee: Armar paquetes (la llave) → el umbral (¿de cuáles?) → Me interesa por defecto (¿sin
     preguntarte?). Después, el subtema Documentos: idioma, palabras clave, CV IDEAL y salario. Postular y revisar son su propio
     bloque, Postulaciones. */
  const sInt = conComo(conInterruptor(P.interesDefecto, P.interesDefectoAyuda, v.interes_por_defecto, (x) => { v.interes_por_defecto = x; }), 'paquetes');
  const sIdeal = conIdeal ? enTema.conInterruptor(P.cvIdeal, P.cvIdealAyuda, v.cv_ideal === true, (x) => { v.cv_ideal = x; }) : null;
  const sArm = conComo(conInterruptor(P.armar, P.armarAyuda(defectoPaquetes, topeVariable), v.armar_paquetes, (x) => { v.armar_paquetes = x; atenuar(); }), 'paquetes');
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
  /* Salario (diseno.md 0.27 §1.38 y §9.3; brand.md 0.14 §6.7): el último ítem de Paquetes › Documentos, como el salario es la
     última de las cuatro fichas del paquete (CV, Carta, Notas, Salario; diseno.md §10.12). Es lo único que sirve a Paquetes y a
     Postulaciones sin ser «quién sos» (PLAN-PREFERENCIAS §8.1): queda acá, donde nace el número, y Postulaciones › Respuestas para
     formularios lo nombra con un link (#salario). Hasta 0.26, al final de Búsqueda; no se atenúa con Armar paquetes en No, como el
     idioma y las palabras clave. Su error sigue siendo #err-sal y marca este bloque. */
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
  /* ---------- Postulaciones: lo esencial (PLAN-PREFERENCIAS §2.2) ----------
     Terna postula por vos y Revisar antes de enviar, que se leen juntos; después, la pregunta de las cuentas, solo con el Sí. La
     ayuda de postular se acortó: el link «Cómo funciona» (#postular) cuenta el resto. */
  const sPos = conComo(conInterruptor(P.postularSola, P.postularSolaAyuda, v.postular_sola, (x) => {
    const antes = v.postular_sola;
    v.postular_sola = x;
    atenuar();
    // Al pasar de No a Sí la pregunta de las cuentas aparece debajo y recibe el foco; con No no se muestra (diseno.md 0.29 §9.3).
    if (cuentas) cuentas.mostrar(x, x && !antes);
  }), 'postular');
  const sRev = conInterruptor(P.revisar, P.revisarAyuda, v.revisar_antes_de_enviar, (x) => { v.revisar_antes_de_enviar = x; });
  // Mientras está atenuado, dice por qué (FEEDBACK-PREFERENCIAS P2-5; plan A8): sin esto, quien apagaba «Terna postula por vos» para
  // revisar antes veía «Revisar antes de enviar» en gris, lo contrario de lo que quería.
  const notaRevisar = h('p', { class: 'campo-nota revisar-no-aplica', hidden: true, text: P.revisarSinPostular });
  sRev.append(notaRevisar);

  /* ---------- ¿Terna crea cuentas por vos? (diseno.md 0.29 §9.3; brand.md 0.16 §6.7; datos.md 0.32, 0036) ----------
     No es un interruptor suelto sino una pregunta con su contexto: nace sin respuesta (ninguno de los dos marcado, y eso es No),
     escribe en el acto como Pausar mi cuenta, y no espera a "Guardar preferencias". Con Sí, debajo: la contraseña de los sitios,
     que se pide recién cuando ese bloque está por verse y vive solo en su campo, y los sitios donde Terna creó una cuenta. */
  function preguntaCuentas() {
    const C = P.cuentas;
    // Desde PLAN-PREFERENCIAS es parte de lo esencial de Postulaciones (sin subtema): su título es un <h3>, como los interruptores.
    const titulo = h('h3', { id: 'cuentas-titulo', class: 'tarjeta-titulo', tabindex: '-1', text: C.titulo });
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
      // El estado de cada sitio es un chip (PLAN-WEB.md §3.5): creada y confirmada están hechas; "ya tenías una cuenta" te pide
      // algo a vos; "no se pudo", falló. El "· " queda en el texto (el banco lo lee así) y el CSS lo cambia por aire.
      const ESTILO_SITIO = { creada: ['chip-listo', 'i-tilde'], confirmada: ['chip-listo', 'i-tilde'], ya_existia: ['chip-toca', 'i-por-decidir'], fallo: ['chip-error', 'i-alerta'] };
      for (const s of sitios) {
        const [clase, iconoId] = ESTILO_SITIO[s.estado] || ['chip-suave', null];
        listaSitios.append(h('li', null, h('span', { class: 'sitio-nombre', text: s.sitio }),
          h('span', { class: 'sitio-estado chip ' + clase }, h('span', { class: 'sitio-punto', 'aria-hidden': 'true', text: '· ' }),
            iconoId ? icono(iconoId) : null, h('span', { text: estadoSitio(s) }))));
      }
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

  /* ---------- ¿Tenés una discapacidad? (diseno.md 0.36 §9.3; brand.md 0.24 §6.7; datos.md 0.35, 0039) ----------
     Francisco, 12/11/2026: algunos formularios lo preguntan (la autoidentificación de los de EE. UU.) y, sin respuesta, Terna elige
     «Prefiero no responder». Tres radios que escriben en el acto, como la pregunta de las cuentas: Sí y No se guardan cifrados;
     «Prefiero no responder» saca la respuesta. Debajo, plegado, qué cuenta como discapacidad según ese formulario. Nunca se pregunta
     cuál. Desde PLAN-PREFERENCIAS va en Preguntas voluntarias, que dice una vez el porqué y lo del cifrado, y no se apaga con
     "Terna postula por vos" en No (D6): una línea arriba dice que hoy Terna no la usa. */
  function preguntaDiscapacidad(inicial) {
    const D = P.discapacidad;
    const idT = 'discapacidad-titulo';
    const err = h('p', { class: 'campo-error', id: 'err-discapacidad', role: 'alert' });
    let valor = inicial === 'si' || inicial === 'no' ? inicial : 'no_responder';
    const radio = (val, texto) => h('label', { class: 'casilla' },
      h('input', { type: 'radio', name: 'discapacidad', value: val, checked: valor === val, 'aria-describedby': 'err-discapacidad', onchange: () => responder(val) }),
      h('span', { text: texto }));
    const opciones = h('div', { class: 'opciones' }, radio('no_responder', D.noResponder), radio('no', D.no), radio('si', D.si));
    // Qué cuenta como discapacidad, plegado con <details> (nativo: teclado y lector de pantalla sin código, y no se confunde con el
    // botón que pliega el bloque, que es el único .plegable-boton de cada bloque).
    // Con la forma de los plegables de la web (details.plegable, PLAN-WEB.md §2.11): el chevrón a la derecha y una regla arriba y abajo.
    const referencia = h('details', { class: 'plegable plegable-pozo discapacidad-referencia', id: 'discapacidad-referencia' },
      h('summary', null, h('span', { text: D.queCuenta }), icono('i-chevron')),
      h('div', { class: 'seccion' }, h('p', { text: D.definicion }), h('ul', null, D.lista.map((x) => h('li', { text: x }))),
        h('p', { class: 'campo-ayuda', text: D.confidencial })));
    async function responder(val) {
      const antes = valor;
      err.textContent = '';
      const inputs = Array.from(opciones.querySelectorAll('input'));
      inputs.forEach((x) => { x.disabled = true; });
      const { error: e } = await sb.rpc('guardar_discapacidad', { p_respuesta: val });
      inputs.forEach((x) => { x.disabled = nodo.classList.contains('atenuado'); });
      if (e) {
        // No se escribió: los botones vuelven a como estaban y el error queda junto a ellos.
        inputs.forEach((x) => { x.checked = x.value === antes; });
        if (!Terna.siSesionVencida(e)) { err.textContent = T.errores.guardar; bloques.marcarErrores(); }
        return;
      }
      valor = val;
      Terna.avisoBreve(T.comun.guardado);
    }
    const nodo = h('div', { class: 'subbloque discapacidad', id: 'discapacidad', role: 'group', 'aria-labelledby': idT },
      h('h4', { id: idT, class: 'tarjeta-titulo', text: D.titulo }), h('p', { class: 'campo-ayuda', text: D.queHace }),
      opciones, err, referencia);
    nodo.dataset.titulo = idT;
    return nodo;
  }
  const sDisc = lecturaDiscapacidad.error ? null : preguntaDiscapacidad(lecturaDiscapacidad.data);

  /* ---------- Sobre vos, para los formularios (diseno.md 0.43 §9.3; brand.md 0.35 §6.7; datos.md 0.41, 0049) ----------
     Francisco, 17/11/2026: género, pronombres, si es hispano o latino, raza y si es veterano de EE. UU., que los formularios preguntan
     y Terna contestaba siempre «Prefiero no responder». Una lista por pregunta, que nace en «Prefiero no responder» y escribe en el
     acto todo el conjunto (guardar_autoidentificacion), como la discapacidad, y va con ella en Preguntas voluntarias. */
  function preguntaAutoidentificacion(inicial) {
    const A = P.autoidentificacion;
    const idT = 'autoidentificacion-titulo';
    const err = h('p', { class: 'campo-error', id: 'err-autoidentificacion', role: 'alert' });
    const valores = {};
    const base = inicial && typeof inicial === 'object' ? inicial : {};
    A.preguntas.forEach(([clave, , opciones]) => { valores[clave] = opciones.some(([val]) => val === base[clave]) ? base[clave] : ''; });
    const listas = A.preguntas.map(([clave, etiqueta, opciones, ayuda]) => {
      const idC = 'autoidentificacion-' + clave;
      const idA = idC + '-ayuda';
      const sel = h('select', Object.assign({ class: 'control', id: idC }, ayuda ? { 'aria-describedby': idA + ' err-autoidentificacion' } : { 'aria-describedby': 'err-autoidentificacion' }),
        h('option', { value: '', text: A.noResponder }), opciones.map(([val, texto]) => h('option', { value: val, text: texto, selected: valores[clave] === val })));
      sel.addEventListener('change', () => guardar(clave, sel));
      return h('div', { class: 'campo' }, h('label', { for: idC, text: etiqueta }), sel, ayuda ? h('p', { class: 'campo-ayuda', id: idA, text: ayuda }) : null);
    });
    async function guardar(clave, sel) {
      const antes = valores[clave];
      valores[clave] = sel.value;
      err.textContent = '';
      const datos = {};
      Object.keys(valores).forEach((k) => { if (valores[k]) datos[k] = valores[k]; });
      sel.disabled = true;
      const { error: e } = await sb.rpc('guardar_autoidentificacion', { p_datos: datos });
      sel.disabled = nodo.classList.contains('atenuado');
      if (e) {
        // No se escribió: la lista vuelve a como estaba y el error queda junto a las preguntas.
        valores[clave] = antes;
        sel.value = antes;
        if (!Terna.siSesionVencida(e)) { err.textContent = T.errores.guardar; bloques.marcarErrores(); }
        return;
      }
      Terna.avisoBreve(T.comun.guardado);
    }
    const nodo = h('div', { class: 'subbloque autoidentificacion', id: 'autoidentificacion', role: 'group', 'aria-labelledby': idT },
      h('h4', { id: idT, class: 'tarjeta-titulo', text: A.titulo }), h('p', { class: 'campo-ayuda', text: A.queHace }),
      listas, err);
    nodo.dataset.titulo = idT;
    return nodo;
  }
  const sAuto = lecturaAuto.error ? null : preguntaAutoidentificacion(lecturaAuto.data);

  /* ---------- Tu secundario y viajar (brand.md 0.24 §6.7; diseno.md 0.36 §9.3; datos.md 0.35, 0039) ----------
     Francisco, 12/11/2026, 20:59: lo que piden formularios como los de Canonical y Terna no tenía. Dos listas con la escala de esos
     formularios y la evidencia en palabras de la persona (Terna la pega tal cual), y si puede viajar. Se guardan con "Guardar
     preferencias", como el resto de la página; sin responder, Terna no contesta esas preguntas. Desde PLAN-PREFERENCIAS van en
     Postulaciones › Respuestas para formularios: viajar entre Mudanza y Consentimientos, el secundario al final (#secundario). */
  let sSec = null;
  let sViaje = null;
  if (conSecundario) {
    const S = P.secundario;
    const lista = (clave, etiqueta) => {
      const idC = enTema.id(clave);
      const sel = h('select', { class: 'control', id: idC },
        h('option', { value: '', text: S.sinResponder }), S.escala.map(([val, texto]) => h('option', { value: val, text: texto, selected: v[clave] === val })));
      sel.addEventListener('change', () => { v[clave] = sel.value || null; });
      return h('div', { class: 'campo' }, h('label', { for: idC, text: etiqueta }), sel);
    };
    const idEv = enTema.id('evidencia');
    const evidencia = h('textarea', { class: 'control', id: idEv, maxlength: '600', rows: '3', 'aria-describedby': idEv + '-ayuda' });
    evidencia.value = v.secundario_evidencia || '';
    evidencia.addEventListener('input', () => { v.secundario_evidencia = evidencia.value; });
    sSec = enTema.item(S.titulo, h('p', { class: 'campo-ayuda', text: S.ayuda }),
      lista('secundario_matematica', S.matematica), lista('secundario_lengua', S.lengua),
      h('div', { class: 'campo' }, h('label', { for: idEv, text: S.evidencia }), evidencia, h('p', { class: 'campo-ayuda', id: idEv + '-ayuda', text: S.evidenciaAyuda })));
    const V = P.viajar;
    sViaje = enTema.grupoRadios(V.titulo, 'viajar', [['si', V.si], ['no', V.no]], v.viajar === true ? 'si' : (v.viajar === false ? 'no' : ''), (x) => { v.viajar = x === 'si'; });
    sViaje.append(h('p', { class: 'campo-ayuda', text: V.ayuda }));
  }

  /* ---------- Respuestas y datos para formularios (PLAN-PREFERENCIAS D2 y D5, §2.2 y §8) ----------
     Lo que Terna contesta, escribe o adjunta cuando un formulario lo pide. Hasta PLAN-PREFERENCIAS las cinco respuestas de
     js/respuestas.js y los datos de js/formularios.js estaban en Mi perfil; son los mismos módulos, montados acá, con los mismos ids.
     Un error de cualquiera de los dos abre Postulaciones (celular) y marca su renglón (carril). */
  const alMarcar = (el) => { if (el.textContent) bloques.abrirDe(el); bloques.marcarErrores(); };
  const resp = Respuestas.montar({ fila: data, piezas: Terna.piezas({ prefijo: 'resp', nivel: 'h4' }), alMarcar });
  // Se escriben solo si cambiaron respecto de lo leído al entrar: así una pestaña de Mi perfil vieja (que las escribía hasta
  // PLAN-PREFERENCIAS) y esta no se pisan (§6, riesgos).
  let respOriginal = JSON.stringify(resp.columnas());
  const df = DatosFormularios.montar({
    sb, uid, usuario: ctx.usuario, config,
    perfil: lecturaPerfil.error ? null : (lecturaPerfil.data || {}),
    analitico: lecturaAnalitico.error ? undefined : lecturaAnalitico.data,
    estudios: lecturaEstudios.error ? null : (lecturaEstudios.data || []),
    piezas: enTema, alMarcar,
    // «Borrar dirección» escribe en el acto: lo que quedaba sin guardar de la dirección ya no cuenta.
    alGuardar: () => actualizarCambios(),
  });

  /* Los avisos de dependencia (PLAN-PREFERENCIAS §4.3; resuelven A8): hasta acá, con Armar paquetes o Terna postula por vos en No,
     los ítems de abajo se apagaban sin decir por qué. Una línea con ícono, como la de Paquetes › Por armar con Armar en No. */
  function avisoDependencia(clase, iconoId, ...texto) {
    return h('p', { class: 'aviso-dependencia ' + clase, hidden: true }, icono(iconoId, 'icono-16'), h('span', null, texto));
  }
  /* Un link a otra parte de esta página («Cambiarlo», «Ver salario»): va con Terna.porBloques › ir() desde su click y no espera el
     hashchange, que no llega si el hash ya es ese (FEEDBACK-PREFERENCIAS P2-2: en el celular andaban una sola vez). El href queda,
     para abrirlo en otra pestaña. */
  const linkAca = (hash, texto) => h('a', { href: '#' + hash, text: texto, onclick: (e) => { if (bloques.ir(hash)) e.preventDefault(); } });
  const avisoArmar = avisoDependencia('aviso-armar', 'i-alerta', P.sinArmar + ' ', linkAca('paquetes', P.sinArmarLink));
  const avisosPostular = [];
  const avisoPostular = (texto) => { const a = avisoDependencia('aviso-postular', 'i-a-mano', texto); avisosPostular.push(a); return a; };

  // Respuestas para formularios: de lo que más preguntan a lo que menos. Viajar entra entre Mudanza y Consentimientos; el secundario,
  // al final. Debajo, el salario, que vive en Paquetes (§8.1).
  const [sAut, sNac, sDisp, sMud, sCons] = resp.nodos;
  const temaRespuestas = Terna.subtema(T.respuestas.titulo, T.respuestas.intro, avisoPostular(P.sinPostular),
    sAut, sNac, sDisp, sMud, sViaje, sCons, sSec,
    h('p', { class: 'campo-ayuda salario-en-paquetes' }, P.salarioEnPaquetes, ' ', linkAca('salario', P.salarioEnPaquetesLink)));
  const temaDatos = Terna.subtema(P.temas.datosFormularios, P.datosFormulariosIntro, avisoPostular(P.sinPostularDatos), df.nodos);
  // Preguntas voluntarias: las dos que se guardan cifradas y al elegir, sin esperar al botón (A12). El porqué y el cifrado, una vez.
  const temaVoluntarias = sDisc || sAuto ? Terna.subtema(P.temas.voluntarias, P.voluntariasIntro,
    h('p', { class: 'campo-ayuda', text: P.voluntariasCifrado }), avisoPostular(P.sinPostular), sDisc, sAuto) : null;

  /* ---------- Empleos › Filtros y Paquetes › Documentos ---------- */
  const temaFiltros = Terna.subtema(P.temas.filtros, null, sNiv, sJor, sMod, sAlc);
  // CV IDEAL va después de las palabras clave (§4.4): es el que más cambia el CV y se lee mejor con ellas a la vista.
  const temaDocumentos = Terna.subtema(P.temas.documentos, null, [sIdi, sAvisoCla, sCla, sIdeal, sSal].filter(Boolean));

  // Atenuar (diseno.md §9.3): el ítem sigue visible y legible; sus controles quedan inactivos hasta que vuelva a aplicar. Desde
  // PLAN-PREFERENCIAS (D6) se atenúan solo las llaves de Postulaciones; las respuestas, los datos y las preguntas voluntarias se
  // pueden completar igual (cargar un dato no hace daño), con una línea que dice que hoy Terna no los usa.
  function atenuar() {
    const poner = (sec, off) => {
      sec.classList.toggle('atenuado', off);
      sec.querySelectorAll('input, select, textarea, button[role="switch"]').forEach((x) => { x.disabled = off; });
    };
    poner(sPos, !v.armar_paquetes);
    // La pregunta de las cuentas se atenúa con "Terna postula por vos": sin paquetes Terna no postula.
    if (cuentas) {
      cuentas.nodo.classList.toggle('atenuado', !v.armar_paquetes);
      cuentas.nodo.querySelectorAll('input[type="radio"]').forEach((x) => { x.disabled = !v.armar_paquetes; });
    }
    poner(sRev, !v.postular_sola || !v.armar_paquetes);
    notaRevisar.hidden = !sRev.classList.contains('atenuado');
    avisoArmar.hidden = !!v.armar_paquetes;
    avisosPostular.forEach((a) => { a.hidden = v.postular_sola !== false; });
    // La línea y la cuenta de la guía del umbral dicen qué hace Terna para arriba (diseno.md 0.15 §9.3).
    guia.actualizar();
    // El lomo de Postulaciones dice si Armar paquetes está en No, aunque el bloque esté cerrado.
    if (montado) bloques.resumir('postulaciones');
  }
  atenuar();

  /* ---------- Empleos › Alertas por mail, la versión corta (PLAN-PREFERENCIAS D4, §2.4; diseno.md 0.12 §9.3) ----------
     Las alertas son una fuente: de dónde saca Terna los empleos. Queda lo vivo (la dirección y cada portal con su última alerta);
     los tres pasos y el reenvío automático están en alertas.html#como-funciona, adonde lleva el link. */
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
    // "Llegaron mails, pero sin avisos" te pide algo (avisarle a Francisco): lleva el ícono de lo que te toca, no solo otro color.
    return h('li', null, h('a', { class: 'portal', href: 'alertas.html#' + guia },
      h('span', { class: 'portal-nombre', text: nombre }),
      e ? h('span', { class: 'portal-estado' + (e.revisar ? ' revisar' : '') }, e.revisar ? icono('i-por-decidir', 'icono-16') : null, h('span', { text: e.texto })) : null,
      h('span', { class: 'portal-ir' }, h('span', { text: P.comoCrearla }), icono('i-adelante', 'icono-16'))));
  };
  const temaAlertas = Terna.subtema(P.alertas, null,
    h('p', { text: dueno ? P.alertasIntroDueno : P.alertasIntro }),
    dueno ? null : h('div', { class: 'direccion' }, code, h('button', { class: 'btn', type: 'button', onclick: () => Terna.copiar(direccion, code) }, icono('i-pegar'), P.copiarDireccion)),
    enTema.item(P.portalesTitulo, h('ul', { class: 'portales' }, P.portales.map(filaPortal)), alertas ? h('p', { class: 'campo-ayuda', text: P.portalesAyuda }) : null),
    h('p', null, h('a', { class: 'guia-ir', href: 'alertas.html#como-funciona' }, h('span', { text: dueno ? P.alertasGuiaDueno : P.alertasGuia }), icono('i-adelante', 'icono-16'))),
    h('p', { class: 'campo-ayuda', text: dueno ? P.alertasNotaDueno : P.alertasNota }));

  /* ---------- Guardar ---------- */
  const banda = h('div', { class: 'banda banda-error', role: 'alert', tabindex: '-1', hidden: true });
  const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'button', 'aria-describedby': 'pref-sin-guardar' }, P.guardar);

  /* ---------- Lo que no se guardó (FEEDBACK-PREFERENCIAS P1-1) ----------
     Desde PLAN-PREFERENCIAS la página guarda datos que se escriben a mano (DNI, dirección, portfolio) y tiene salidas en medio del
     formulario (el promedio a Mi perfil, las guías de alertas, los «Cómo funciona»). Mientras algo sea distinto de lo leído al
     entrar o de lo último guardado, al lado de «Guardar preferencias» una línea lo dice y salir de la página pide confirmar (el
     diálogo es el del navegador, sin texto propio). El aviso de salida se pone solo mientras hay cambios y se saca al guardar o al
     volver todo a como estaba: con él puesto, el navegador no guarda la página para «Atrás». Lo que escribe en el acto (la pregunta
     de las cuentas, las preguntas voluntarias, el analítico, «Borrar dirección») no cuenta, y los links a otra parte de esta página
     no salen de ella. */
  const sinGuardar = h('p', { class: 'estado-guardado sin-guardar', id: 'pref-sin-guardar', role: 'status' });
  // Lo que «Guardar preferencias» mandaría a preferencias, con la forma con que lo manda: dos estados que se guardan igual (marcar
  // y desmarcar una modalidad, borrar lo escrito) dan la misma huella.
  function huellaFila() {
    const nulo = (x) => (x === undefined || x === '' ? null : x);
    const numero = (x) => (x === undefined || x === null || x === '' ? null : Number(x));
    return JSON.stringify([
      Number(v.umbral), MODALIDADES.filter((m) => v.modalidades.includes(m)), v.alcance, v.salario_modo,
      v.salario_modo === 'rango' ? [numero(v.salario_min), numero(v.salario_max), nulo(v.salario_moneda)] : null,
      v.idioma_documentos, !!v.armar_paquetes, !!v.interes_por_defecto, !!v.postular_sola, !!v.revisar_antes_de_enviar,
      leerPuestos(), NIVELES.filter((x) => v.niveles.includes(x)), JORNADAS.filter((x) => v.jornadas.includes(x)),
      conIdeal ? v.cv_ideal === true : null, conClaves ? huellaClaves() : null, conPriorizar ? !!v.priorizar_puestos : null,
      conSecundario ? [nulo(v.secundario_matematica), nulo(v.secundario_lengua), String(v.secundario_evidencia || '').trim().slice(0, 600) || null,
        v.viajar === true ? true : (v.viajar === false ? false : null)] : null,
      conEmpresas ? [leerEmpresas(), !!v.priorizar_empresas] : null,
      conContratar ? [!!v.visible_para_contratar, leerNoMostrar()] : null,
      resp.columnas(),
    ]);
  }
  let filaGuardada = null;  // la huella de lo que hay en la base; null hasta que la página termina de armarse
  let conAvisoDeSalida = false;
  const alSalir = (e) => { e.preventDefault(); e.returnValue = ''; };
  const hayCambios = () => filaGuardada !== null && (huellaFila() !== filaGuardada || df.cambio());
  function actualizarCambios() {
    const hay = hayCambios();
    const texto = hay ? P.sinGuardar : '';
    if (sinGuardar.textContent !== texto) sinGuardar.textContent = texto;
    if (hay === conAvisoDeSalida) return;
    conAvisoDeSalida = hay;
    if (hay) addEventListener('beforeunload', alSalir); else removeEventListener('beforeunload', alSalir);
  }
  // Cada control escribe en `v` en su propio evento, que corre antes de que este llegue a la raíz.
  ['input', 'change', 'click'].forEach((tipo) => raiz.addEventListener(tipo, actualizarCambios));
  /* La banda lleva, debajo, el primer error como link (revisión 2, P1-1): "Modalidades: Elegí al menos una." abre su bloque y
     pone el foco en su primer control. En el celular el ítem quedaba varias pantallas más abajo. Es navegación dentro de la
     página: el texto es el del error y el título de su ítem, y el foco sigue yendo primero a la banda. */
  function linkAlError(err) {
    const descrito = raiz.querySelector('[aria-describedby~="' + err.id + '"]');
    const item = err.closest('.subbloque');
    const destino = descrito && descrito.matches('input, select, textarea') ? descrito
      : (descrito || item || err).querySelector('input:not([type=hidden]):not([readonly]), select, textarea');
    const titulo = item && (item.querySelector(':scope > .tarjeta-titulo, :scope > .interruptor-fila > .tarjeta-titulo, :scope > h3, :scope > h4'));
    const nombre = ((titulo && titulo.textContent) || '').trim();
    const a = h('a', { class: 'banda-ir', href: '#' + err.id }, (nombre ? nombre + ': ' : '') + err.textContent.trim());
    a.addEventListener('click', (e) => {
      e.preventDefault();
      bloques.abrirDe(err);
      bloques.irAlPrimerError();
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
    if (conContratar) {
      const lista = leerNoMostrar();
      if (lista.length > MAX_NO_MOSTRAR || lista.some((x) => x.length > 80)) { marcar('err-no-mostrar', PC.noMostrarError(MAX_NO_MOSTRAR)); ok = false; }
    }
    // Las respuestas (los días de disponibilidad) y los datos para formularios (DNI, CUIL, dirección): cada módulo marca lo suyo.
    if (!resp.validar()) ok = false;
    if (!df.validar()) ok = false;
    if (!ok) { mostrarBanda(T.errores.guardarCampos); return; }
    bGuardar.setAttribute('aria-disabled', 'true');
    const fila = {
      umbral: v.umbral, modalidades: v.modalidades, alcance: v.alcance,
      salario_modo: v.salario_modo,
      salario_min: v.salario_modo === 'rango' ? v.salario_min : null,
      salario_max: v.salario_modo === 'rango' ? v.salario_max : null,
      salario_moneda: v.salario_modo === 'rango' ? v.salario_moneda : null,
      // Sin paquetes_por_dia (0028: siempre 3).
      idioma_documentos: v.idioma_documentos, armar_paquetes: v.armar_paquetes,
      interes_por_defecto: v.interes_por_defecto, postular_sola: v.postular_sola, revisar_antes_de_enviar: v.revisar_antes_de_enviar,
      puestos_objetivo: v.puestos_objetivo, niveles: v.niveles, jornadas: v.jornadas,
    };
    if (conIdeal && v.cv_ideal !== data.cv_ideal) fila.cv_ideal = v.cv_ideal === true;
    const clavesCambiaron = conClaves && huellaClaves() !== clavesGuardadas;
    if (clavesCambiaron) {
      fila.palabras_clave = v.palabras_clave;
      fila.usar_palabras_clave = !!v.usar_palabras_clave;
      if (conAviso) fila.palabras_clave_aviso = !!v.palabras_clave_aviso;
    }
    if (conPriorizar) fila.priorizar_puestos = !!v.priorizar_puestos;
    if (conSecundario) {
      fila.secundario_matematica = v.secundario_matematica || null;
      fila.secundario_lengua = v.secundario_lengua || null;
      fila.secundario_evidencia = String(v.secundario_evidencia || '').trim().slice(0, 600) || null;
      fila.viajar = v.viajar === true ? true : (v.viajar === false ? false : null);
    }
    if (conEmpresas) {
      fila.empresas_seguidas = v.empresas_seguidas;
      fila.priorizar_empresas = !!v.priorizar_empresas;
    }
    if (conContratar) {
      fila.visible_para_contratar = !!v.visible_para_contratar;
      fila.no_mostrarme_a = leerNoMostrar();
    }
    // Las cinco respuestas para formularios (autorizacion_trabajo, disponibilidad, mudanza, nacionalidad, aceptar_consentimientos),
    // con los mismos textos y valores que escribía Mi perfil, solo si cambiaron (PLAN-PREFERENCIAS §8.3).
    const columnasResp = resp.columnas();
    const respCambiaron = JSON.stringify(columnasResp) !== respOriginal;
    if (respCambiaron) Object.assign(fila, columnasResp);
    // Lo que sale ahora: si mientras tanto la persona sigue escribiendo, eso queda como cambio sin guardar.
    const huellaEnviada = huellaFila();
    const { error: e } = await sb.from('preferencias').update(fila).eq('usuario_id', uid);
    if (e) {
      bGuardar.removeAttribute('aria-disabled');
      if (Terna.siSesionVencida(e)) return;
      const clave = String(e.message || '').trim();
      const destino = { umbral_fuera_de_rango: 'err-umbral', modalidades_vacias: 'err-mod', salario_incompleto: 'err-sal', salario_rango_invalido: 'err-sal',
        niveles_vacios: 'err-niv', jornadas_vacias: 'err-jor', puestos_demasiados: 'err-puestos', puesto_largo: 'err-puestos',
        palabras_clave_demasiadas: 'err-claves', palabra_clave_larga: 'err-claves',
        empresas_demasiadas: 'err-empresas', empresa_nombre_invalido: 'err-empresas' }[clave];
      if (destino) { marcar(destino, Terna.textoError(e)); mostrarBanda(T.errores.guardarCampos); } else mostrarBanda(T.errores.guardar);
      return;
    }
    if (conIdeal) data.cv_ideal = v.cv_ideal;
    if (clavesCambiaron) clavesGuardadas = huellaClaves();
    if (respCambiaron) respOriginal = JSON.stringify(columnasResp);
    filaGuardada = huellaEnviada;
    // Después, lo de Datos para formularios que cambió: portfolio y GitHub, la identificación y la dirección, en ese orden. Si una
    // escritura falla, se frena ahí (lo de antes ya quedó escrito) y el error va a su campo; lo que no se escribió sigue contando
    // como cambio sin guardar.
    try {
      await df.guardar();
    } catch (e2) {
      bGuardar.removeAttribute('aria-disabled');
      actualizarCambios();
      if (Terna.siSesionVencida(e2)) return;
      // Las preferencias ya se escribieron: la banda no dice «No se pudo guardar» si lo que falló es un dato marcado (P3-8).
      mostrarBanda(df.error(e2) ? P.guardadoAMedias : T.errores.guardar);
      return;
    }
    bGuardar.removeAttribute('aria-disabled');
    actualizarCambios();
    Terna.avisoBreve(P.guardado);
  });

  /* ---------- Quién te ve (hasta PLAN-PREFERENCIAS «Para quien contrata», D3; contratar.md §6.3; datos.md 0.44, 0055) ----------
     Apagado por defecto. Con Sí, quien publica avisos en Terna te ve en «Personas que ajustan» de sus avisos, sin tu nombre ni dónde
     trabajás, y te puede proponer postular. Nunca te ve la empresa donde trabajás hoy, ni las que pongas en la lista. Se guarda con
     «Guardar preferencias», como los demás interruptores. Sin la 0055, el bloque no aparece. */
  const conContratar = Object.prototype.hasOwnProperty.call(data, 'visible_para_contratar');
  const MAX_NO_MOSTRAR = 10;
  let cContratar = null;
  const enContratar = Terna.piezas({ prefijo: 'con', nivel: 'h3' });
  const PC = T.preferencias.contratar;
  let textoNoMostrar = null;
  if (conContratar) {
    v.visible_para_contratar = data.visible_para_contratar === true;
    v.no_mostrarme_a = (data.no_mostrarme_a || []).slice();
    const que = h('ul', { class: 'campo-ayuda' }, ...PC.queVen.map((t) => h('li', { text: t })));
    const sVisible = enContratar.conInterruptor(PC.visible, PC.visibleAyuda, v.visible_para_contratar, (x) => { v.visible_para_contratar = x; });
    sVisible.append(h('p', { class: 'campo-ayuda', text: PC.queVenTitulo }), que, h('p', { class: 'campo-ayuda', text: PC.reconocer }));
    const idNo = enContratar.id('no-mostrar');
    textoNoMostrar = h('textarea', { class: 'control', id: idNo, rows: '3', 'aria-describedby': 'ayuda-no-mostrar err-no-mostrar' });
    textoNoMostrar.value = v.no_mostrarme_a.join('\n');
    textoNoMostrar.addEventListener('input', () => limpiar('err-no-mostrar'));
    const sNo = enContratar.item(PC.noMostrar, h('div', { class: 'campo' }, h('label', { class: 'oculto-visual', for: idNo, text: PC.noMostrar }), textoNoMostrar,
      h('p', { class: 'campo-ayuda', id: 'ayuda-no-mostrar', text: PC.noMostrarAyuda }), error('err-no-mostrar')));
    cContratar = [sVisible, sNo];
  }
  const leerNoMostrar = () => (textoNoMostrar ? textoNoMostrar.value.split('\n').map((x) => x.trim()).filter(Boolean) : []);

  /* ---------- Página (PLAN-PREFERENCIAS §2.2, §2.7 y §3) ---------- */
  Terna.vaciar(raiz);
  // El lomo de cada bloque cerrado dice qué hay adentro, con lo que la persona eligió (PLAN-WEB.md §2.12; PLAN-PREFERENCIAS §4.2).
  const siNo = (x) => (x ? T.comun.si : T.comun.no);
  const MODALIDADES = ['remoto', 'hibrido', 'presencial'];
  // Arriba de cada bloque, una oración que dice qué decide.
  const bajada = (k) => h('p', { class: 'bloque-bajada', text: P.bajada[k] });
  /* Saltos a los subtemas, en el celular (revisión 2, P2-5 y P2-6; generalizados a los tres bloques en PLAN-PREFERENCIAS §2.7): en
     escritorio están en el carril. Navegación dentro de la página: el hash pasa a ser el del subtema y el foco va a su título, con
     Terna.porBloques › ir(), la misma de «Cambiarlo» y «Ver salario» (FEEDBACK-PREFERENCIAS P2-2 y P2-3). */
  function salto(texto, hash) {
    const a = h('a', { class: 'salto', href: '#' + hash }, h('span', { text: texto }), icono('i-abajo', 'icono-16'));
    a.addEventListener('click', (e) => { if (bloques.ir(hash)) e.preventDefault(); });
    return a;
  }
  const saltos = (lista) => h('div', { class: 'saltos saltos-celular' }, lista.filter((x) => x[1]).map(([texto, , hash]) => salto(texto, hash)));
  // Un ancla puede caer en un ítem que hoy no se ve (la pregunta de las cuentas con «Terna postula por vos» en No, la dirección que
  // no se pudo leer): entonces cae en el ítem de al lado, que sí se ve.
  const visible = (nodo, otro) => (nodo && !nodo.hidden ? nodo : otro);

  // 1. Empleos: qué busca Terna y de dónde lo saca. #busqueda, el nombre de antes, lo abre igual.
  bloques.bloque('empleos', P.grupos.empleos, [bajada('empleos'),
    saltos([[P.temas.filtros, temaFiltros, 'filtros'], [P.alertas, temaAlertas, 'alertas']]),
    sPue, sEmp, temaFiltros, temaAlertas].filter(Boolean), {
    alias: ['busqueda'],
    temas: [
      { hash: 'puestos', titulo: P.puestos, nodo: sPue },
      sEmp ? { hash: 'empresas', titulo: P.empresas.titulo, nodo: sEmp } : null,
      { hash: 'filtros', titulo: P.temas.filtros, nodo: temaFiltros },
      { hash: 'alertas', titulo: P.alertas, nodo: temaAlertas },
    ].filter(Boolean),
    // Con las tres modalidades, solo los puestos: en el celular el lomo se cortaba (FEEDBACK-PREFERENCIAS P3-5).
    resumen: () => {
      const mods = MODALIDADES.filter((m) => v.modalidades.includes(m));
      return P.lomo.empleos(v.puestos_objetivo, mods.map((m) => T.avisos.modalidad[m]), mods.length === MODALIDADES.length);
    },
  });
  // 2. Paquetes: Armar, el umbral (#umbral, el que llaman los «Cambiar el umbral») y Me interesa por defecto; después, Documentos.
  //    #palabras-clave (la ficha del paquete) y #salario (Respuestas para formularios) bajan a su ítem, sin renglón en el carril.
  bloques.bloque('paquetes', P.grupos.paquetes, [bajada('paquetes'), saltos([[P.temas.documentos, temaDocumentos, 'documentos']]),
    sArm, sUmbral, sInt, temaDocumentos], {
    temas: [
      { hash: 'umbral', titulo: P.umbral, nodo: sUmbral },
      { hash: 'documentos', titulo: P.temas.documentos, nodo: temaDocumentos },
      { hash: 'palabras-clave', enCarril: false, nodo: sCla || sAvisoCla || temaDocumentos },
      { hash: 'salario', enCarril: false, nodo: sSal },
    ],
    resumen: () => P.lomo.paquetes(siNo(v.armar_paquetes), v.umbral),
  });
  // 3. Postulaciones: postular, revisar y la pregunta de las cuentas; después, los tres subtemas. #postulacion, el subtema de antes,
  //    lo abre igual; #respuestas (el «Completar respuestas para formularios» de antes) baja a Respuestas para formularios.
  bloques.bloque('postulaciones', P.grupos.postulaciones, [bajada('postulaciones'), avisoArmar,
    saltos([[T.respuestas.titulo, temaRespuestas, 'formularios'], [P.temas.datosFormularios, temaDatos, 'datos-formularios'], [P.temas.voluntarias, temaVoluntarias, 'voluntarias']]),
    sPos, sRev, cuentas ? cuentas.nodo : null, temaRespuestas, temaDatos, temaVoluntarias].filter(Boolean), {
    alias: ['postulacion'],
    // Sin IntersectionObserver, la identificación y la dirección se descifran al abrir el bloque (js/formularios.js).
    alAbrir: df.alAbrir || undefined,
    temas: [
      { hash: 'formularios', alias: ['respuestas'], titulo: T.respuestas.titulo, nodo: temaRespuestas },
      { hash: 'datos-formularios', titulo: P.temas.datosFormularios, nodo: temaDatos },
      temaVoluntarias ? { hash: 'voluntarias', titulo: P.temas.voluntarias, nodo: temaVoluntarias } : null,
      { hash: 'cuentas', enCarril: false, get nodo() { return visible(cuentas && cuentas.nodo, sPos); } },
      { hash: 'secundario', enCarril: false, nodo: sSec || temaRespuestas },
      { hash: 'identificacion', enCarril: false, nodo: df.anclas.identificacion },
      { hash: 'direccion', enCarril: false, get nodo() { return visible(df.anclas.direccion, df.anclas.identificacion); } },
      { hash: 'analitico', enCarril: false, nodo: df.anclas.analitico || temaDatos },
      { hash: 'discapacidad', enCarril: false, nodo: sDisc || temaVoluntarias || temaRespuestas },
      { hash: 'autoidentificacion', enCarril: false, nodo: sAuto || temaVoluntarias || temaRespuestas },
    ].filter(Boolean),
    // Con «Terna postula por vos» en No, el lomo no dice nada de Revisar antes, que no aplica (FEEDBACK-PREFERENCIAS P2-5).
    resumen: () => (!v.armar_paquetes ? P.lomo.sinArmar
      : P.lomo.postulaciones(siNo(v.postular_sola), v.postular_sola ? siNo(v.revisar_antes_de_enviar) : null)),
  });
  // 4. Quién te ve (con la 0055).
  if (cContratar) bloques.bloque('contratar', PC.titulo, cContratar, { resumen: () => P.lomo.contratar(siNo(v.visible_para_contratar)) });
  // Al lado de «Guardar preferencias», la línea de los cambios sin guardar (arriba de él en el celular, a su izquierda en escritorio).
  bloques.montar({ arriba: [banda], guardar: h('div', { class: 'guardar-fijo' }, sinGuardar, bGuardar) });
  montado = true;
  // Desde acá, lo que hay en la base es lo que se ve: lo que cambie después es un cambio sin guardar.
  filaGuardada = huellaFila();
  actualizarCambios();
});
