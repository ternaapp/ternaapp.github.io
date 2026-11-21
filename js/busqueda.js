/* Terna · js/busqueda.js
   Empleos (hasta el 21/11/2026, Búsqueda; el archivo sigue siendo busqueda.html: PLAN-UX.md §3.3, decisión D4).
   Búsqueda (busqueda.md 0.2; Francisco, 16/11/2026: «una tab exclusiva y dedicada a búsqueda… que el usuario tenga a disposición
   todas las búsquedas que están vigentes… que en vez de buscar trabajo en LinkedIn… busque trabajo dentro de nuestra plataforma»):
   todos los avisos abiertos de la base, no solo los que Terna eligió para la persona, con un buscador, filtros y "Pedir paquete"
   en cualquiera. Sin tokens: la lista la arma la base (avisos_abiertos, 0045) y la filtra el navegador; lo que se escribe se
   busca acá en el puesto, la empresa y el lugar, y en la base en la descripción (buscar_en_avisos, que devuelve ids: el texto
   del aviso no sale de la base). Pedir el paquete de un aviso que no estaba en la lista de la persona lo crea pedido
   (pedir_aviso); de ahí en más es un pedido como cualquiera: Tus pedidos en Paquetes, y la corrida lo puntúa, lo arma y,
   donde el formulario lo permite, lo postula.
   Lee avisos_abiertos(), preferencias (la fila entera), mis_avisos (solo los pedidos, para decir el lugar) y, desde PLAN-UX §6.0,
   perfiles.ciudad (para «Cerca»); escribe con pedir_aviso y cancelar_pedido y, desde PLAN-UX §6.0, preferencias.empresas_seguidas
   (Seguir a la empresa) y preferencias.puestos_objetivo (Sumar a mis puestos), con la misma política y los mismos topes que Inicio
   y Preferencias. Lo que ya decía Avisos se dice igual y sale de js/aviso.js, js/filtros.js y js/lista.js.
   La versión 0.2 sale de mirar la 0.1 como usuaria y como diseño (busqueda.md §8): lo escrito se busca por palabras enteras y
   en tres grupos (lo dice el puesto, la empresa o el lugar; lo nombra la descripción; tiene las palabras por separado, que va
   aparte), "Tu puesto" y "Empresa que seguís" sin pedir nada, el filtro Empresa para cientos de empresas, "Ver los avisos de
   esta empresa" en la ficha y menos renglones arriba de la lista.
   Desde el rediseño B2 «Sello» (opciones-v3/PLAN-WEB.md §3.7) cambia solo lo que se dibuja: casi todo son líneas sueltas (un aviso
   de Búsqueda no tiene paquete tuyo; el que no está en tu lista lleva la lupa donde iría el match), el que tiene paquete va en su
   carpeta, como en Avisos; lo escrito, en sus tres grupos con título; «Más filtros», y la ficha como carpeta.
   Desde PLAN-UX §3.3 y §3.3.1 (paquete P3): debajo del buscador, los atajos (filtros que ya existen, con nombre de persona: «Que no
   tengo» prendido de entrada), «Cerca» y «Jornada parcial», y los rubros por el nombre del puesto (js/rubros.js; un rubro sin avisos
   no se dibuja); en el celular, un solo botón «Filtrar»; en la ficha, Seguir a la empresa y Sumar a mis puestos (con Deshacer y los
   topes); el diálogo de pedir sin «Pasa a tus avisos»; y un vacío que dice la verdad cuando se busca un trabajo que no es de
   oficina. Sale el pie («Acá buscás vos…») y «Sin filtros: ves todo lo abierto». */
'use strict';

Terna.pagina('busqueda', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const B = T.busqueda;
  const F = T.avisos.filtros;
  const LI = T.inicio.lista;
  const lista = document.getElementById('lista');
  const herramientas = document.getElementById('herramientas');
  const cajaFiltros = document.getElementById('filtros');
  const cajaBuscador = document.getElementById('buscador');
  const cuenta = document.getElementById('cuenta');

  const parar = Terna.cargando(lista);
  const [rA, rP, rQ, rC] = await Promise.all([
    sb.rpc('avisos_abiertos'),
    sb.from('preferencias').select('*').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.from('mis_avisos').select('aviso_id, pedido_en, paquete_id').eq('estado_paquete', 'pedido'),
    // La ciudad del perfil, para «Cerca» (PLAN-UX §6.0). Si no se puede leer, la página anda igual, sin ese atajo.
    sb.from('perfiles').select('ciudad').eq('usuario_id', ctx.usuario.id).maybeSingle(),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rQ.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  // Sin la fila de preferencias (no debería pasar: la crea el alta) no hay dónde seguir una empresa ni sumar un puesto.
  const conFila = !!rP.data;
  const prefs = rP.data || { umbral: 70, interes_por_defecto: true, armar_paquetes: true, paquetes_por_dia: 3, salario_modo: 'sugerir' };
  const umbral = prefs.umbral || 70;
  const cupo = prefs.paquetes_por_dia || config.paquetes_por_dia_default || 3;
  const armar = prefs.armar_paquetes !== false;
  const ciudad = !rC.error && rC.data && typeof rC.data.ciudad === 'string' ? rC.data.ciudad.trim() : '';

  /* ---------- «Cerca» (PLAN-UX §3.3.1) ----------
     Por la ciudad de tu perfil dentro del texto del lugar del aviso: no hay distancias ni barrios, es «dice tu ciudad» o no. Con
     «Buenos Aires» (o CABA, o Capital Federal) cuenta cualquiera de los nombres de la ciudad: trae CABA entera, no tu barrio. */
  const sinSignos = (x) => Filtros.normal(x).replace(/[^a-z0-9]+/g, ' ').trim();
  const CABA = ['buenos aires', 'caba', 'c a b a', 'capital federal', 'ciudad autonoma de buenos aires', 'ciudad de buenos aires'];
  const ciudadSimple = sinSignos(ciudad);
  const nombresCerca = !ciudadSimple ? [] : CABA.includes(ciudadSimple) ? CABA : [ciudadSimple];
  const esCerca = (a) => {
    if (!nombresCerca.length || !a.ubicacion) return false;
    const lugar = ' ' + sinSignos(a.ubicacion) + ' ';
    return nombresCerca.some((x) => lugar.includes(' ' + x + ' '));
  };

  /* ---------- Los avisos ----------
     La base manda cada aviso sin sus nulos; acá se completan, con los nombres que usa js/aviso.js (los de mis_avisos), para que
     "Dónde se postula", los atributos y la confirmación de Pedir paquete sean los mismos que en Avisos. */
  const avisos = Array.isArray(rA.data) ? rA.data : [];
  const NULOS = ['empresa', 'ubicacion', 'modalidad', 'alcance', 'nivel', 'jornada', 'url_postulacion', 'ats_formulario', 'linkedin_postulacion', 'match_id', 'pedido_en', 'interes'];
  const RUBROS = window.Rubros ? Rubros.CLAVES : [];
  const porEmpresa = new Map();
  for (const a of avisos) {
    for (const k of NULOS) if (a[k] === undefined) a[k] = null;
    a.match = a.match === undefined ? null : a.match;
    a.tiene_texto = true;
    a.texto_origen = 'fuente';
    a.en_lista = a.en_lista === true;
    a.con_paquete = a.con_paquete === true;
    a.paquete_id = a.con_paquete ? a.match_id : null;
    a.estado_paquete = a.estado_paquete || 'sin_armar';
    a.estado_postulacion = a.estado_postulacion || 'pendiente';
    a.dudoso = a.dudoso === true;
    a.buscable = Filtros.normal([a.puesto, a.empresa, a.ubicacion].filter(Boolean).join(' '));
    // El rubro: el de la base cuando lo traiga (PLAN-UX §6.4) y, mientras tanto, por el nombre del puesto.
    a.rubro = RUBROS.includes(a.rubro) ? a.rubro : (window.Rubros ? Rubros.de(a.puesto) : null);
    a.cerca = esCerca(a);
    if (a.empresa) porEmpresa.set(a.empresa, (porEmpresa.get(a.empresa) || 0) + 1);
  }
  const porId = new Map(avisos.map((a) => [a.aviso_id, a]));
  const cuantasEmpresas = new Set(Array.from(porEmpresa.keys(), (e) => Filtros.normal(e))).size;
  // Los pedidos de la persona, en el orden en que Terna los arma: para decir en qué lugar queda el que pida acá.
  const pedidos = (rQ.data || []).filter((x) => !x.paquete_id).sort((x, y) => String(x.pedido_en || '').localeCompare(String(y.pedido_en || ''))).map((x) => x.aviso_id);

  /* ---------- Qué es cada aviso para la persona ---------- */
  const HECHAS = ['enviada', 'postulado', 'entrevista'];
  const LISTAS = ['fuera', 'en_lista', 'pedido', 'con_paquete', 'postulada', 'no_interesa'];
  function estadoDe(a) {
    if (HECHAS.includes(a.estado_postulacion)) return 'postulada';
    if (a.con_paquete) return 'con_paquete';
    if (a.en_lista && a.estado_paquete === 'pedido') return 'pedido';
    if (a.en_lista && a.interes === 'no_me_interesa') return 'no_interesa';
    return a.en_lista ? 'en_lista' : 'fuera';
  }
  // Los cuatro estados de PLAN-WEB.md §2.7: lo pedido espera (la tiene Terna, con el reloj); lo postulado está resuelto (con el
  // avión si lo mandó Terna, con el tilde si fue a mano); «Con paquete» es un dato del paquete, como «Armado»; estar en tus avisos
  // o no interesarte, un dato sin estado.
  const ESTILO_LISTA = { en_lista: ['chip-suave', 'i-avisos'], pedido: ['chip-espera', 'i-pedido'], con_paquete: ['chip-listo', 'i-tilde'], postulada: ['chip-resuelta', 'i-tilde'], no_interesa: ['chip-suave', 'i-no-interesa'] };
  // El chip dice qué es: «En tu cola», «Paquete pedido». Sin el match adentro (PLAN-WEB.md §2.7: el número nunca va sobre un
  // color de estado): va en la columna de la línea, en la lengüeta de la carpeta y de la ficha, y en la tabla al lado del chip.
  function chipLista(a) {
    const e = estadoDe(a);
    if (e === 'fuera') return null;
    const [clase, ic0] = ESTILO_LISTA[e];
    const ic = e === 'postulada' && a.estado_postulacion === 'enviada' ? 'i-enviada' : ic0;
    return Aviso.chip(clase, ic, B.lista[e]);
  }
  // Se puede pedir lo que no tiene paquete ni pedido (como en Avisos: lo que no se pudo armar espera una decisión, estado.md §5).
  const puedePedir = (a) => armar && a.estado_paquete === 'sin_armar' && !a.con_paquete && !HECHAS.includes(a.estado_postulacion);
  const lugarPedido = (a) => { const i = pedidos.indexOf(a.aviso_id); return i >= 0 ? i + 1 : 0; };

  /* ---------- Lo que se sabe sin pedir nada (busqueda.md §8, F5) ----------
     El match lo calcula Terna recién cuando el aviso entra en la lista de la persona. Antes, y sin costo, la página dice lo que
     sale de sus preferencias con las reglas del motor (js/puestos.js y js/empresas.js): si el título nombra uno de sus puestos y
     si la empresa es una que sigue; y, en la ficha, si el aviso queda fuera de sus preferencias de búsqueda.
     Desde PLAN-UX §3.3 son datos y no prioridad: «Tu puesto» y «Empresa que seguís» se ven aunque Priorizar esté en No (lo que
     cambia esa opción es el orden de Terna, no si el título nombra tu puesto). Un puesto muy general no cuenta, como en el motor. */
  const dePrefs = Aviso.busquedaDe(prefs);
  const MAX_PUESTOS = 10;          // como Preferencias (validar_preferencias, 0015)
  const MAX_LARGO_PUESTO = 60;
  const maxEmpresas = (config && config.max_empresas_seguidas) || 10;   // la base lo hace cumplir (0034)
  let seguidas = Lista.seguidasDe(rP.data);
  let misPuestos = [];
  const cachePuesto = new Map();
  const cacheEmpresa = new Map();
  function leerTuyo() {
    seguidas = Lista.seguidasDe(conFila ? prefs : null);
    misPuestos = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim() && !(window.Puestos && Puestos.general(x)));
    cachePuesto.clear();
    cacheEmpresa.clear();
  }
  leerTuyo();
  function tuPuesto(a) {
    if (!misPuestos.length || !window.Puestos) return null;
    if (!cachePuesto.has(a.aviso_id)) cachePuesto.set(a.aviso_id, Puestos.buscado(a.puesto, misPuestos));
    return cachePuesto.get(a.aviso_id);
  }
  function tuEmpresa(a) {
    if (!seguidas.filas.length || !a.empresa || !window.Empresas) return null;
    if (!cacheEmpresa.has(a.aviso_id)) cacheEmpresa.set(a.aviso_id, Empresas.seguida(a.empresa, seguidas.filas));
    return cacheEmpresa.get(a.aviso_id);
  }
  // Con Priorizar mis puestos (o mis empresas) en No, el chip sigue siendo un dato, pero Terna no los pone primero: la explicación lo
  // suma con la frase de Inicio (FEEDBACK-UX P2-4), y lo mismo la ayuda de Sumar a mis puestos y el aviso breve de Seguir.
  const priorizaPuestos = () => prefs.priorizar_puestos !== false;
  const priorizaEmpresas = () => prefs.priorizar_empresas !== false;
  const conApagado = (texto, prioriza, apagado) => (prioriza ? texto : texto + ' ' + apagado);
  const explicaPuesto = (p) => conApagado(B.tuPuestoExplicacion(p), priorizaPuestos(), T.inicio.puestos.apagado);
  const explicaEmpresa = (e) => conApagado(B.tuEmpresaExplicacion(e), priorizaEmpresas(), T.inicio.empresas.apagado);
  function chipsTuyos(a) {
    const chips = [];
    const puesto = tuPuesto(a);
    if (puesto) chips.push(h('span', { class: 'chip-texto tinta tu-puesto', title: explicaPuesto(puesto) }, icono('i-foco', 'icono-14'), h('span', { text: T.avisos.tuPuesto }), oculto(': ' + explicaPuesto(puesto))));
    const empresa = tuEmpresa(a);
    if (empresa) chips.push(h('span', { class: 'chip-texto tinta tu-empresa', title: explicaEmpresa(empresa) }, icono('i-empresa', 'icono-14'), h('span', { text: T.avisos.tuEmpresa }), oculto(': ' + explicaEmpresa(empresa))));
    return chips;
  }

  /* ---------- Lo que se recuerda ----------
     Mientras dura la pestaña del navegador (volver de Paquetes, recargar): lo escrito, los filtros, los atajos, el rubro y el orden.
     Al volver a entrar otro día, Empleos arranca como de entrada: un filtro olvidado en una página de búsqueda esconde justo lo que
     se viene a buscar. */
  const MEMORIA = 'terna.busqueda';
  function recordado() { try { return JSON.parse(window.sessionStorage.getItem(MEMORIA) || 'null'); } catch (e) { return null; } }
  function recordar() {
    try { window.sessionStorage.setItem(MEMORIA, JSON.stringify({ q, filtros, orden, extra, suspendido: noTengoSuspendido })); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  /* ---------- Filtros ----------
     "Dónde se postula" va primero: es lo que más cambia qué pasa después de pedir (donde postula Terna no hay nada más que hacer).
     Desde PLAN-UX §3.3 la página arranca con «Que no tengo» (el filtro En tu lista en «No están en tu lista»): se viene a buscar lo
     que no está en tu lista, y un toque lo apaga. A quien todavía no tiene nada, no le cambia nada: arranca sin filtros. */
  const BUSQUEDA = ['modalidad', 'alcance', 'nivel', 'jornada'];
  const TODOS = Aviso.TODOS_BUSQUEDA;
  const DONDES = Aviso.DONDES;
  const CLAVES = ['donde', 'modalidad', 'alcance', 'empresa', 'ubicacion', 'nivel', 'jornada', 'publicado', 'lista'];
  const ORDENES = ['nuevos', 'empresa', 'match'];
  const QUE_NO_TENGO = ['fuera'];
  const inicial = () => ({ empresa: null, ubicacion: '', modalidad: null, alcance: null, nivel: null, jornada: null, donde: null, publicado: null, lista: null });
  function validos(f) {
    const r = inicial();
    if (!f || typeof f !== 'object') return r;
    r.empresa = Filtros.listaValida(f.empresa, null);
    r.ubicacion = Filtros.textoValido(f.ubicacion);
    for (const k of BUSQUEDA) r[k] = Filtros.listaValida(f[k], TODOS[k]);
    r.donde = Filtros.listaValida(f.donde, DONDES);
    r.publicado = Filtros.fechaValida(f.publicado);
    r.lista = Filtros.listaValida(f.lista, LISTAS);
    return r;
  }
  // Lo que no es un filtro de la barra: los atajos de tus puestos, tus empresas y «Cerca», y el rubro.
  const extraInicial = () => ({ puestos: false, empresas: false, cerca: false, rubro: null });
  function extraValido(x) {
    const r = extraInicial();
    if (!x || typeof x !== 'object') return r;
    r.puestos = x.puestos === true;
    r.empresas = x.empresas === true;
    r.cerca = x.cerca === true;
    r.rubro = RUBROS.includes(x.rubro) ? x.rubro : null;
    return r;
  }
  const hayTuyos = avisos.some((a) => estadoDe(a) !== 'fuera');
  const memoria = recordado();
  let filtros = validos(memoria && memoria.filtros);
  if (!memoria && hayTuyos) filtros.lista = QUE_NO_TENGO.slice();
  let extra = extraValido(memoria && memoria.extra);
  let orden = memoria && ORDENES.includes(memoria.orden) ? memoria.orden : 'nuevos';
  let q = memoria ? Filtros.textoValido(memoria.q) : '';
  // «Que no tengo» se aparta mientras hay algo escrito (PLAN-UX §3.3: lo tuyo sigue apareciendo cuando se busca por nombre, con su
  // estado y adónde seguirlo) y vuelve al borrarlo. `noTengoSuspendido`: si está apartado por eso.
  let noTengoSuspendido = !!(memoria && memoria.suspendido === true);
  // Un link de otra página (Inicio, un mail): ?q= busca ese texto y ?empresa= filtra esa empresa, sobre la lista sin filtros.
  const parametros = new URLSearchParams(location.search);
  if (parametros.has('q') || parametros.has('empresa')) {
    filtros = inicial();
    extra = extraInicial();
    noTengoSuspendido = false;
    q = Filtros.textoValido(parametros.get('q') || '');
    const pedida = Filtros.normal(parametros.get('empresa'));
    if (pedida) {
      const nombres = Array.from(porEmpresa.keys()).filter((e) => Filtros.normal(e) === pedida);
      if (nombres.length) filtros.empresa = nombres; else q = Filtros.textoValido(parametros.get('empresa'));
    }
  }

  // Las preferencias de búsqueda de la persona, por si las quiere acá.
  const prefsComoFiltro = () => { const r = {}; for (const k of BUSQUEDA) r[k] = Filtros.listaValida(dePrefs[k], TODOS[k]); return r; };
  const hayPrefs = BUSQUEDA.some((k) => prefsComoFiltro()[k] !== null);
  const mismos = (x, y) => (x === null || y === null ? x === y : x.length === y.length && x.every((v) => y.includes(v)));
  const conPrefs = () => hayPrefs && BUSQUEDA.every((k) => mismos(filtros[k], prefsComoFiltro()[k]));

  const lugarDe = (a) => a.ubicacion || T.avisos.alcanceMin[a.alcance === 'exterior' ? 'exterior' : 'local'];
  // Algunas fuentes mandan como lugar la lista de países desde donde se puede trabajar (veinte o más, y cortada): en la tabla van
  // los dos primeros y «y otros lugares». El texto entero queda al pasar el mouse, y el filtro Ubicación busca en todo.
  function lugarCorto(a) {
    const todo = lugarDe(a);
    const partes = todo.split(',').map((x) => x.trim()).filter(Boolean);
    return partes.length > 4 ? B.variosLugares(partes.slice(0, 2).join(', ')) : todo;
  }
  const conModalidad = (a, lugar) => lugar + (a.modalidad ? ' · ' + T.avisos.modalidadMin[a.modalidad] : '');
  const tituloLugar = (a) => (lugarCorto(a) === lugarDe(a) ? null : lugarDe(a));
  function pasa(a, excepto) {
    if (excepto !== 'empresa' && filtros.empresa && !filtros.empresa.includes(a.empresa || '')) return false;
    if (excepto !== 'ubicacion' && !Filtros.contiene(lugarDe(a), filtros.ubicacion)) return false;
    // Como en Avisos: un aviso que no dice la modalidad, el nivel o la jornada aparece igual.
    const b = {};
    for (const k of BUSQUEDA) b[k] = excepto === k || !filtros[k] ? TODOS[k] : filtros[k];
    if (!Aviso.pasaBusqueda(a, b)) return false;
    if (excepto !== 'donde' && filtros.donde && !filtros.donde.includes(Aviso.donde(a, prefs).clave)) return false;
    if (excepto !== 'publicado' && !Filtros.pasaFecha(a.publicado_en, filtros.publicado)) return false;
    if (excepto !== 'lista' && filtros.lista && !filtros.lista.includes(estadoDe(a))) return false;
    if (excepto !== 'rubro' && extra.rubro && a.rubro !== extra.rubro) return false;
    if (excepto !== 'puestos' && extra.puestos && !tuPuesto(a)) return false;
    if (excepto !== 'empresas' && extra.empresas && !tuEmpresa(a)) return false;
    if (excepto !== 'cerca' && extra.cerca && !a.cerca) return false;
    return true;
  }
  function cambiado(k) { return k === 'ubicacion' ? Filtros.hayTexto(filtros.ubicacion) : filtros[k] !== null; }
  const extraCambiado = () => extra.puestos || extra.empresas || extra.cerca || !!extra.rubro;
  const algoCambiado = () => CLAVES.some(cambiado) || extraCambiado();
  const NOMBRES = { empresa: F.columnas.empresa, ubicacion: F.columnas.ubicacion, modalidad: F.nombres.modalidad, alcance: F.nombres.alcance, nivel: F.nombres.nivel,
    jornada: F.nombres.jornada, donde: T.avisos.columnas.donde, publicado: F.columnas.publicado, lista: B.filtros.lista };
  const nombreDe = (k, v) => (k === 'nivel' ? T.preferencias.nivel[v] : k === 'jornada' ? T.preferencias.jornada[v] : T.avisos[k][v]);
  function resumen(k) {
    if (k === 'empresa') return filtros.empresa ? (filtros.empresa.length === 1 ? filtros.empresa[0] : F.nDe(filtros.empresa.length, porEmpresa.size)) : B.filtros.todasEmpresas;
    if (k === 'ubicacion') return Filtros.resumenTexto(filtros.ubicacion, F.todosColumna.ubicacion);
    if (k === 'donde') return Filtros.resumenLista(filtros.donde, DONDES, (v) => T.avisos.dondeFiltro[v], F.todosColumna.donde);
    if (k === 'publicado') return Filtros.resumenFecha(filtros.publicado, F.todosColumna.publicado);
    if (k === 'lista') return Filtros.resumenLista(filtros.lista, LISTAS, (v) => B.listaFiltro[v], B.filtros.todosLista);
    return Filtros.resumenLista(filtros[k], TODOS[k], (v) => nombreDe(k, v), F.todosDe[k]);
  }

  /* ---------- Lo escrito ----------
     Hasta ocho palabras, sin importar mayúsculas ni tildes; las vacías ("de", "the") no cuentan. Tres grupos, del más preciso
     al menos (busqueda.md §8, F1: con "contiene", «power bi» traía 638 avisos de 2.271 y «excel», los que dicen «excellent»):
       1. el puesto, la empresa o el lugar tienen todas las palabras, cada una al principio de una palabra («analist» trae
          «analista»; una de dos letras, entera: «bi» no trae «mobile»);
       2. la descripción dice lo escrito tal cual (lo responde la base: `frase`);
       3. el aviso tiene todas las palabras, enteras, pero no juntas (`palabras`): va aparte, detrás de un botón, salvo que no
          haya nada en los otros dos. */
  const MIN_DESCRIPCION = 2;
  const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'o', 'a', 'un', 'una', 'para', 'por', 'con', 'the', 'of', 'and', 'or', 'for', 'in', 'to', 'at', 'on', 'an']);
  const fichas = (texto) => Filtros.normal(String(texto || '').slice(0, 80)).split(' ').slice(0, 8).map((p) => p.replace(/[^a-z0-9+#.]/g, '')).filter((p) => /[a-z0-9]/.test(p));
  const palabrasDe = (texto) => Array.from(new Set(fichas(texto).filter((p) => p.length >= 2 && !VACIAS.has(p))));
  const expresion = (p) => new RegExp((/^[a-z0-9]/.test(p) ? '(?:^|[^a-z0-9])' : '') + p.replace(/[+.#]/g, '\\$&') + (p.length === 2 && /[a-z0-9]$/.test(p) ? '(?![a-z0-9])' : ''));
  let palabras = palabrasDe(q);
  let directas = palabras.map(expresion);
  if (!palabras.length) noTengoSuspendido = false;
  let enDescripcion = null;   // { frase, palabras }: los ids que devolvió la base para lo escrito, o null si no se buscó
  let estadoDescripcion = 'nada';   // nada | corta | buscando | listo | error
  let verSueltas = false;
  const cacheDescripcion = new Map();
  let turno = 0;
  let espera = null;
  function coincide(a) {
    if (!palabras.length) return 1;
    if (directas.every((re) => re.test(a.buscable))) return 1;
    if (!enDescripcion) return 0;
    return enDescripcion.frase.has(a.aviso_id) ? 2 : enDescripcion.palabras.has(a.aviso_id) ? 3 : 0;
  }
  function buscarEnDescripciones() {
    clearTimeout(espera);
    turno += 1;
    const clave = fichas(q).join(' ');
    if (!palabras.length) { enDescripcion = null; estadoDescripcion = q.trim() ? 'corta' : 'nada'; return; }
    if (palabras.join('').length < MIN_DESCRIPCION) { enDescripcion = null; estadoDescripcion = 'corta'; return; }
    if (cacheDescripcion.has(clave)) { enDescripcion = cacheDescripcion.get(clave); estadoDescripcion = 'listo'; return; }
    enDescripcion = null;
    estadoDescripcion = 'buscando';
    const mio = turno;
    espera = setTimeout(async () => {
      const r = await sb.rpc('buscar_en_avisos', { p_texto: clave });
      if (mio !== turno) return;   // mientras tanto se escribió otra cosa
      const d = r.data;
      if (r.error || !d || !Array.isArray(d.frase) || !Array.isArray(d.palabras)) {
        if (r.error && Terna.siSesionVencida(r.error)) return;
        // Para diagnosticar desde la consola: el tipo y el mensaje, nunca lo que se buscó.
        if (r.error) console.error('[Terna]', r.error.name, r.error.code || '', r.error.message);
        estadoDescripcion = 'error';
      } else {
        enDescripcion = { frase: new Set(d.frase), palabras: new Set(d.palabras) };
        cacheDescripcion.set(clave, enDescripcion);
        estadoDescripcion = 'listo';
      }
      actualizarExplorar();
      dibujarLista();
    }, 350);
  }

  /* ---------- Los atajos (PLAN-UX §3.3, punto 3, y §3.3.1) ----------
     Filtros que ya existen, con nombre de persona: «Que no tengo» es En tu lista en «No están en tu lista»; «Postula Terna», Dónde
     se postula en Terna; «De esta semana», Publicado desde hace seis días; «Jornada parcial», Jornada en Parcial (y, como el filtro,
     deja pasar el aviso que no dice la jornada). Los que no tienen filtro en la barra (tus puestos, tus empresas y «Cerca») viven en
     `extra`. Un atajo que no cambia nada (ningún aviso lo cumple, o todos) no se dibuja, salvo que esté prendido. */
  const semana = () => ({ op: 'desde', fecha: Terna.sumarDias(Terna.hoy(), -6) });
  const ATAJOS = {
    noTengo: { texto: () => B.atajos.noTengo, puesto: () => mismos(filtros.lista, QUE_NO_TENGO), de: (a) => estadoDe(a) === 'fuera',
      poner: (si) => { filtros.lista = si ? QUE_NO_TENGO.slice() : null; noTengoSuspendido = false; } },
    puestos: { texto: () => B.atajos.puestos, puesto: () => extra.puestos, de: (a) => !!tuPuesto(a), poner: (si) => { extra.puestos = si; } },
    empresas: { texto: () => B.atajos.empresas, puesto: () => extra.empresas, de: (a) => !!tuEmpresa(a), poner: (si) => { extra.empresas = si; } },
    terna: { texto: () => B.atajos.terna, puesto: () => mismos(filtros.donde, ['terna']), de: (a) => Aviso.donde(a, prefs).clave === 'terna',
      poner: (si) => { filtros.donde = si ? ['terna'] : null; } },
    semana: { texto: () => B.atajos.semana, puesto: () => !!filtros.publicado && filtros.publicado.op === 'desde' && filtros.publicado.fecha === semana().fecha,
      de: (a) => Filtros.pasaFecha(a.publicado_en, semana()), poner: (si) => { filtros.publicado = si ? semana() : null; } },
    cerca: { texto: () => B.cercaTuyo(ciudad), puesto: () => extra.cerca, de: (a) => a.cerca, poner: (si) => { extra.cerca = si; } },
    parcial: { texto: () => B.parcial, puesto: () => mismos(filtros.jornada, ['parcial']), de: (a) => !a.jornada || a.jornada === 'parcial',
      poner: (si) => { filtros.jornada = si ? ['parcial'] : null; } },
  };
  // «Que no tengo» va primero: es el que está prendido de entrada, y en el celular la fila se desplaza de costado.
  const ORDEN_ATAJOS = ['noTengo', 'puestos', 'empresas', 'terna', 'semana', 'cerca', 'parcial'];
  const explorar = h('div', { class: 'explorar' });
  const refsAtajos = new Map();
  const refsRubros = new Map();
  let cajaRubros = null;
  // Un chip que se prende y se apaga: un botón con aria-pressed, con la cara de los chips de opción (el tilde, prendido).
  function chipAtajo(texto, alTocar, extraNodo) {
    const b = h('button', { class: 'chip-opcion-cara chip-atajo', type: 'button', 'aria-pressed': 'false' },
      h('span', { class: 'marca' }, icono('i-tilde')), h('span', { class: 'chip-atajo-texto', text: texto }), extraNodo || null);
    b.addEventListener('click', alTocar);
    return b;
  }
  function armarExplorar() {
    Terna.vaciar(explorar);
    refsAtajos.clear();
    refsRubros.clear();
    cajaRubros = null;
    const vale = (k) => { const n = avisos.filter(ATAJOS[k].de).length; return n > 0 && n < avisos.length; };
    const atajos = ORDEN_ATAJOS.filter((k) => ATAJOS[k].puesto() || ((k !== 'cerca' || nombresCerca.length) && vale(k)));
    if (atajos.length) {
      const fila = h('div', { class: 'explorar-fila atajos', role: 'group', 'aria-label': B.atajosNombre });
      for (const k of atajos) {
        const b = chipAtajo(ATAJOS[k].texto(), () => tocarAtajo(k));
        b.dataset.atajo = k;
        // La ciudad la escribe la persona: si es larga, el chip la corta y el texto entero queda al pasar el mouse.
        if (k === 'cerca') b.title = ATAJOS[k].texto();
        refsAtajos.set(k, b);
        fila.append(b);
      }
      explorar.append(fila);
    }
    // Los rubros con avisos (con todo lo abierto, no con los filtros puestos: así la fila no cambia mientras se filtra), de los que
    // más tienen a los que menos; «Otros» al final. Con uno solo no hay nada que elegir y la fila no va.
    const base = new Map();
    for (const a of avisos) if (a.rubro) base.set(a.rubro, (base.get(a.rubro) || 0) + 1);
    const rubros = RUBROS.filter((k) => base.get(k) > 0 || extra.rubro === k)
      .sort((x, y) => ((x === 'otros') - (y === 'otros')) || ((base.get(y) || 0) - (base.get(x) || 0)) || (RUBROS.indexOf(x) - RUBROS.indexOf(y)));
    if (rubros.length > 1) {
      const idTitulo = Terna.idUnico('rubros');
      const fila = h('div', { class: 'explorar-fila rubros-fila' });
      for (const k of rubros) {
        const n = h('span', { class: 'chip-opcion-cuenta num' });
        const b = chipAtajo(B.rubros.valores[k], () => tocarRubro(k), n);
        b.dataset.rubro = k;
        refsRubros.set(k, { b, n });
        fila.append(b);
      }
      cajaRubros = h('div', { class: 'rubros', role: 'group', 'aria-labelledby': idTitulo }, h('p', { class: 'rubros-titulo', id: idTitulo, text: B.rubros.titulo }), fila);
      explorar.append(cajaRubros);
    }
    actualizarExplorar();
    // En el celular cada fila se desplaza de costado: si lo prendido (recordado de antes) quedó fuera de la vista, la fila arranca en él.
    for (const filaChips of explorar.querySelectorAll('.explorar-fila')) {
      const prendido = filaChips.querySelector('[aria-pressed="true"]');
      if (!prendido || filaChips.scrollWidth <= filaChips.clientWidth) continue;
      const caja = filaChips.getBoundingClientRect();
      const chip = prendido.getBoundingClientRect();
      if (chip.right > caja.right) filaChips.scrollLeft += chip.left - caja.left - (parseFloat(getComputedStyle(filaChips).paddingLeft) || 0);
    }
  }
  // Prendido o apagado, y la cuenta de cada rubro con todo lo demás puesto (lo escrito, los filtros y los atajos). Un rubro que con
  // eso queda en 0 no se ve, salvo el elegido; si no queda ninguno, la fila se va con su título (FEEDBACK-UX P2-7).
  function actualizarExplorar() {
    for (const [k, b] of refsAtajos) b.setAttribute('aria-pressed', ATAJOS[k].puesto() ? 'true' : 'false');
    if (refsRubros.size) {
      const n = new Map();
      for (const a of avisos) if (pasa(a, 'rubro') && coincide(a)) n.set(a.rubro, (n.get(a.rubro) || 0) + 1);
      let quedan = 0;
      for (const [k, r] of refsRubros) {
        const elegido = extra.rubro === k;
        r.b.setAttribute('aria-pressed', elegido ? 'true' : 'false');
        r.n.textContent = Terna.numero(n.get(k) || 0);
        r.b.hidden = !elegido && !n.get(k);
        if (!r.b.hidden) quedan += 1;
      }
      if (cajaRubros) cajaRubros.hidden = !quedan;
    }
    explorar.hidden = !Array.from(explorar.children).some((c) => !c.hidden);
  }
  function tocarAtajo(k) { ATAJOS[k].poner(!ATAJOS[k].puesto()); aplicarFiltro(); }
  function tocarRubro(k) { extra.rubro = extra.rubro === k ? null : k; aplicarFiltro(); }

  // Buscar un trabajo que no es de oficina (un rubro elegido, o lo escrito que nombra uno: «docente», «mecánico»): Terna casi no
  // tiene, porque sus fuentes son sitios de empresas (PLAN-UX §6.4). El vacío y el final de la lista lo dicen, con la salida.
  function deOficio() {
    if (!window.Rubros) return false;
    if (extra.rubro && Rubros.NO_OFICINA.has(extra.rubro)) return true;
    return palabras.length > 0 && Rubros.NO_OFICINA.has(Rubros.de(q));
  }
  const lineaOficio = () => h('p', { class: 'suave linea-oficio' }, B.vacioRubro + ' ', h('a', { href: 'alertas.html', text: B.vacioRubroLink }));

  /* ---------- Orden ---------- */
  const desc = (x, y) => (x === y ? 0 : (x === null || x === undefined) ? 1 : (y === null || y === undefined) ? -1 : (x < y ? 1 : -1));
  const alfabetico = (x, y) => String(x || '').localeCompare(String(y || ''), 'es', { sensitivity: 'base' });
  function comparar(a, b) {
    // Con algo escrito, primero lo más preciso: el grupo 1, después el 2 y por último el 3.
    if (palabras.length && a.coincide !== b.coincide) return a.coincide - b.coincide;
    if (orden === 'empresa') return (a.empresa ? 0 : 1) - (b.empresa ? 0 : 1) || alfabetico(a.empresa, b.empresa) || alfabetico(a.puesto, b.puesto);
    if (orden === 'match') return desc(a.match, b.match) || desc(a.publicado_en, b.publicado_en) || alfabetico(a.puesto, b.puesto);
    return desc(a.publicado_en, b.publicado_en) || alfabetico(a.puesto, b.puesto);
  }
  // { vis, directos, descripcion, sueltas }: lo que se ve y cuántos hay en cada grupo con los filtros puestos.
  function visibles() {
    const todos = [];
    const n = [0, 0, 0, 0];
    for (const a of avisos) {
      if (!pasa(a)) continue;
      a.coincide = coincide(a);
      if (!a.coincide) continue;
      n[a.coincide] += 1;
      todos.push(a);
    }
    const conSueltas = verSueltas || n[1] + n[2] === 0;
    const vis = (conSueltas ? todos : todos.filter((a) => a.coincide < 3)).sort(comparar);
    return { vis, directos: n[1], descripcion: n[2], sueltas: n[3], conSueltas };
  }

  /* ---------- El buscador ---------- */
  const idCampo = Terna.idUnico('buscar');
  const campo = h('input', { type: 'search', class: 'control buscador-campo', id: idCampo, value: q, placeholder: B.buscador.ejemplo, autocomplete: 'off',
    spellcheck: 'false', enterkeyhint: 'search', maxlength: '80' });
  const borrar = h('button', { class: 'btn btn-texto buscador-borrar', type: 'button', 'aria-label': B.buscador.borrar, title: B.buscador.borrar, hidden: !q }, icono('i-cerrar'));
  const estadoBuscador = h('p', { class: 'buscador-estado', role: 'status' });
  let esperaTexto = null;
  function aplicarTexto() {
    clearTimeout(esperaTexto);
    const habia = palabras.length > 0;
    q = Filtros.textoValido(campo.value);
    palabras = palabrasDe(q);
    directas = palabras.map(expresion);
    // «Que no tengo» se aparta al empezar a escribir y vuelve al borrar lo escrito (si nadie tocó En tu lista mientras tanto).
    const hay = palabras.length > 0;
    if (!habia && hay && ATAJOS.noTengo.puesto()) { filtros.lista = null; noTengoSuspendido = true; }
    else if (habia && !hay && noTengoSuspendido) { if (filtros.lista === null) filtros.lista = QUE_NO_TENGO.slice(); noTengoSuspendido = false; }
    borrar.hidden = !campo.value;
    cuantos = PASO;
    verSueltas = false;
    buscarEnDescripciones();
    recordar();
    dibujar();
  }
  campo.addEventListener('input', () => { clearTimeout(esperaTexto); esperaTexto = setTimeout(aplicarTexto, 150); });
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); aplicarTexto(); } });
  borrar.addEventListener('click', () => { campo.value = ''; aplicarTexto(); campo.focus(); });
  function armarBuscador() {
    // El nombre del campo es para el lector de pantalla: a la vista ya lo dicen el título de la página, la lupa y el ejemplo.
    cajaBuscador.append(h('label', { class: 'oculto-visual', for: idCampo, text: B.buscador.etiqueta }),
      h('div', { class: 'buscador-caja' }, icono('i-buscar', 'buscador-icono'), campo, borrar), estadoBuscador);
    // Los atajos y los rubros van debajo del buscador (PLAN-UX §3.3, puntos 3 y 4).
    cajaBuscador.after(explorar);
  }
  function dibujarEstadoBuscador(r) {
    const teniaFoco = estadoBuscador.contains(document.activeElement);
    Terna.vaciar(estadoBuscador);
    estadoBuscador.classList.remove('oculto-visual');
    const decir = (texto) => estadoBuscador.append(h('span', { text: texto }));
    // Una sola letra, o solo palabras vacías ("de la"): no se busca nada todavía.
    if (!palabras.length || estadoDescripcion === 'corta') { if (q.trim()) decir(B.buscador.corta); return; }
    if (estadoDescripcion === 'buscando') { decir(B.buscador.buscando); return; }
    if (estadoDescripcion === 'error') {
      decir(B.buscador.error);
      estadoBuscador.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', onclick: () => { buscarEnDescripciones(); dibujarLista(); } }, T.comun.probarDeNuevo));
      return;
    }
    // Sin nada, el vacío de la lista ya lo dice a la vista: acá queda solo para el lector de pantalla (FEEDBACK-UX P2-7).
    if (r.directos + r.descripcion === 0 && !r.sueltas) { estadoBuscador.classList.add('oculto-visual'); decir(B.buscador.resultado(0, 0)); return; }
    if (r.directos + r.descripcion === 0) { decir(B.buscador.soloSueltas(r.sueltas)); return; }
    decir(B.buscador.resultado(r.directos, r.descripcion));
    if (r.sueltas) {
      const b = h('button', { class: 'btn btn-texto btn-chico', type: 'button', 'aria-pressed': verSueltas ? 'true' : 'false', dataset: { control: 'sueltas' },
        onclick: () => { verSueltas = !verSueltas; cuantos = PASO; dibujarLista(); } }, verSueltas ? B.buscador.sinSueltas : B.buscador.sueltas(r.sueltas));
      estadoBuscador.append(b);
      if (teniaFoco) b.focus();
    }
  }

  /* ---------- Orden y barra de filtros ---------- */
  function cambiarOrden(nuevo) {
    orden = nuevo;
    cuantos = PASO;
    recordar();
    const s = document.getElementById('orden');
    if (s) s.value = orden;
    dibujarLista();
  }
  function dibujarHerramientas() {
    Terna.vaciar(herramientas);
    const nombres = { nuevos: T.avisos.ordenNuevos, empresa: B.ordenEmpresa, match: B.ordenMatch };
    const sel = h('select', { class: 'control', id: 'orden' }, ORDENES.map((x) => h('option', { value: x, text: nombres[x], selected: orden === x })));
    sel.addEventListener('change', () => cambiarOrden(sel.value));
    herramientas.append(h('span', { class: 'orden' }, icono('i-ordenar', 'icono-16'), h('label', { for: 'orden', text: T.avisos.ordenarPor + ':' }), sel));
  }
  const botones = {};
  const ubicarFiltros = Filtros.ubicar({ botones, lista });
  // En el celular la barra vive en la hoja del botón único: si ningún filtro se ve, el foco va a ese botón.
  let unico = null;
  const primerFiltro = () => {
    const p = Filtros.primero({ botones, claves: CLAVES, lista });
    return !Filtros.seVe(p) && unico && Filtros.seVe(unico.boton) ? unico.boton : p;
  };
  const estadoFiltros = h('div', { class: 'filtros-estado' });
  // «Más filtros» (PLAN-WEB.md §2.8): desde 768 px quedan a la vista los cambiados y los primeros de la barra, hasta cuatro (y nunca
  // esconde uno solo: js/filtros.js).
  let barraFiltros = null;
  const repartirBarra = () => Filtros.masFiltros({ barra: barraFiltros, botones, claves: CLAVES, cambiado, aLaVista: 4 });
  function armarBarra() {
    const barra = h('div', { class: 'filtros-barra', role: 'group', 'aria-label': B.filtros.barra });
    for (const k of CLAVES) {
      const b = h('button', { class: 'filtro-boton', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', dataset: { filtro: k } },
        h('span', { class: 'filtro-nombre', text: NOMBRES[k] + ':' }), ' ', h('span', { class: 'filtro-valor' }),
        h('span', { class: 'oculto-visual filtro-cambiado' }), icono('i-chevron', 'icono-16'));
      b.addEventListener('click', () => abrirFiltro(k, b, false));
      botones[k] = b;
      barra.append(b);
    }
    const caja = h('div', { class: 'filtros-caja' }, barra);
    cajaFiltros.append(caja, estadoFiltros);
    barraFiltros = barra;
    repartirBarra();
    // En el celular (PLAN-UX §3.3, punto 5): un solo botón «Filtrar», con la cuenta de los filtros puestos, que abre la barra y su
    // estado en una hoja. El orden queda a la vista, al lado.
    unico = Filtros.botonUnico({ caja: cajaFiltros, nodos: [caja, estadoFiltros], cuenta: 0 });
  }
  function actualizarBarra() {
    for (const k of CLAVES) {
      const b = botones[k];
      b.querySelector('.filtro-valor').textContent = resumen(k);
      b.querySelector('.filtro-cambiado').textContent = cambiado(k) ? F.cambiadoAccesible : '';
      b.classList.toggle('cambiado', cambiado(k));
    }
    if (barraFiltros) repartirBarra();
    if (unico) unico.cuenta(CLAVES.filter(cambiado).length);
    const enfocado = estadoFiltros.contains(document.activeElement);
    Terna.vaciar(estadoFiltros);
    if (algoCambiado()) {
      if (conPrefs()) estadoFiltros.append(h('span', { text: B.filtros.conPreferencias }), ' ');
      estadoFiltros.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', dataset: { control: 'limpiar' }, onclick: () => { limpiarFiltros(); primerFiltro().focus(); } },
        icono('i-deshacer', 'icono-16'), B.filtros.limpiar));
    } else if (hayPrefs) {
      estadoFiltros.append(h('button', { class: 'btn btn-texto btn-chico', type: 'button', dataset: { control: 'preferencias' }, onclick: () => { usarPreferencias(); primerFiltro().focus(); } }, B.filtros.usarPreferencias));
    } else if (enfocado) primerFiltro().focus();
  }
  function aplicarFiltro() { cuantos = PASO; recordar(); dibujar(); }
  // Limpiar es todo: la barra, los atajos (también «Que no tengo») y el rubro.
  function limpiarFiltros() { filtros = inicial(); extra = extraInicial(); noTengoSuspendido = false; aplicarFiltro(); }
  function usarPreferencias() { Object.assign(filtros, prefsComoFiltro()); aplicarFiltro(); }

  /* ---------- Lista: tarjetas (celular) o tabla (escritorio), de a 50 ---------- */
  const PASO = 50;
  let cuantos = PASO;
  function dibujar() { actualizarBarra(); actualizarExplorar(); dibujarLista(); }
  function vacio() {
    if (!avisos.length) return h('div', { class: 'vacio' }, h('p', { text: B.vacioBase }));
    const oficio = deOficio();
    const partes = [h('p', { text: palabras.length ? B.vacioBusqueda(q.trim()) : B.vacioFiltros }), oficio ? lineaOficio() : h('p', { class: 'suave', text: B.vacioAyuda })];
    if (algoCambiado()) partes.push(h('button', { class: 'btn', type: 'button', onclick: () => { limpiarFiltros(); primerFiltro().focus(); } }, B.filtros.limpiar));
    if (palabras.length && !oficio) partes.push(h('p', { class: 'suave' }, B.queTiene + ' ' + conApagado(B.seguirEmpresa, priorizaEmpresas(), T.inicio.empresas.apagado) + ' ', h('a', { href: 'preferencias.html#empresas', text: B.irAPreferencias })));
    return h('div', { class: 'vacio' }, partes);
  }
  function dibujarLista(enfocarDesde) {
    Terna.vaciar(lista);
    const r = visibles();
    const vis = r.vis;
    const todo = vis.length === avisos.length && !palabras.length;
    // De cuántas empresas son va en su propio tramo: en el celular no entra en el renglón del título y se oculta (terna.css).
    Terna.vaciar(cuenta);
    if (avisos.length && todo) Terna.agregar(cuenta, [B.cuenta(avisos.length), cuantasEmpresas > 1 ? h('span', { class: 'cuenta-empresas', text: ' ' + B.cuentaEmpresas(cuantasEmpresas) }) : null]);
    else if (avisos.length) cuenta.textContent = B.cuentaDe(vis.length, avisos.length);
    dibujarEstadoBuscador(r);
    if (!vis.length) {
      // En escritorio la tabla sigue, vacía, con sus encabezados, que son los filtros de sus columnas (como en Avisos).
      const buscando = palabras.length && estadoDescripcion === 'buscando';
      const aviso = buscando ? h('div', { class: 'vacio', role: 'status' }, h('p', { text: B.buscador.buscando })) : vacio();
      lista.append(Terna.anchoEscritorio.matches && avisos.length ? tabla([], aviso) : aviso);
      ubicarFiltros();
      return;
    }
    const pagina = vis.slice(0, cuantos);
    // Con algo escrito y más de un grupo a la vista, cada grupo va con su título (como los grupos de Postulaciones): lo dice el
    // puesto, la empresa o el lugar; lo nombra la descripción; tiene las palabras por separado. Sin eso, una sola lista.
    const cuentas = [0, r.directos, r.descripcion, r.conSueltas ? r.sueltas : 0];
    const conTitulos = palabras.length > 0 && cuentas.filter((x) => x > 0).length > 1;
    const grupos = enGrupos(pagina, conTitulos);
    if (Terna.anchoEscritorio.matches) lista.append(tabla(pagina, null, conTitulos ? grupos.map((g) => Object.assign(g, { n: cuentas[g.g] })) : null));
    else {
      for (const g of grupos) {
        if (conTitulos) lista.append(tituloGrupo(g.g, cuentas[g.g]));
        lista.append(h('ul', { class: 'lista-tarjetas', role: 'list' }, g.items.map((a) => h('li', null, tarjeta(a)))));
      }
    }
    if (vis.length > pagina.length) {
      const quedan = Math.min(PASO, vis.length - pagina.length);
      lista.append(h('div', { class: 'mas-resultados' },
        h('p', { class: 'suave', text: B.mostrando(pagina.length, vis.length) }),
        h('button', { class: 'btn', type: 'button', dataset: { control: 'mas' }, onclick: () => { const desde = cuantos; cuantos += PASO; dibujarLista(desde); } }, B.mostrarMas(quedan))));
    }
    // Un trabajo que no es de oficina: aunque haya algunos, Terna tiene pocos; el final de la lista lo dice (PLAN-UX §3.3.1).
    if (deOficio()) lista.append(lineaOficio());
    ubicarFiltros();
    marcarElegida();
    if (enfocarDesde !== undefined) {
      const destino = lista.querySelectorAll('[data-aviso]')[enfocarDesde];
      if (destino) (destino.tagName === 'TR' ? destino : destino.querySelector('[data-control="abrir"]')).focus();
    }
  }

  // "Pedir paquete", con el puesto en el nombre accesible de la lista; en la ficha es el botón principal.
  function botonPedir(a, enFicha) {
    return h('button', { class: enFicha ? 'btn btn-primario btn-ancho' : 'btn btn-fila', type: 'button', dataset: { control: 'pedir' }, 'aria-label': enFicha ? null : T.avisos.pedirAccesible(a.puesto),
      onclick: () => pedir(a) }, T.avisos.pedirPaquete);
  }
  // Adónde seguirlo cuando ya es de la persona: lo postulado y lo que tiene paquete, en Postulaciones; lo demás, en Paquetes.
  function linkLista(a) {
    const e = estadoDe(a);
    if (e === 'fuera' || !a.match_id) return null;
    const post = e === 'postulada' || e === 'con_paquete';
    return h('a', { class: 'link-lista', href: (post ? 'postulaciones.html#postulacion-' : 'avisos.html#aviso-') + a.match_id, text: post ? B.verEnPostulaciones : B.verEnAvisos });
  }
  function lineaPedido(a) {
    const l = lugarPedido(a);
    if (!l) return null;
    const corridas = Math.ceil(l / cupo);
    return h('span', { class: 'pedido-lugar' }, h('span', { 'aria-hidden': 'true', text: T.avisos.pedidoLugar(l, corridas) }), oculto(T.avisos.pedidoLugarAccesible(l, corridas)));
  }
  // Por qué está en la lista un aviso que no dice lo escrito en el puesto, la empresa ni el lugar.
  function chipCoincide(a) {
    if (!palabras.length || a.coincide < 2) return null;
    return h('span', { class: 'chip-texto en-descripcion' }, icono('i-buscar', 'icono-14'), h('span', { text: a.coincide === 2 ? B.buscador.enDescripcion : B.buscador.porSeparado }));
  }
  const fechaDe = (a) => h('span', { class: 'fecha-aviso' }, Terna.relativa(a.publicado_en));
  function accion(a) {
    if (puedePedir(a)) return botonPedir(a, false);
    if (estadoDe(a) === 'pedido') return lineaPedido(a);
    return null;
  }

  /* Los grupos de lo escrito. `conTitulos`: si van separados (más de uno a la vista); si no, uno solo con todo. */
  function enGrupos(items, conTitulos) {
    if (!conTitulos) return [{ g: 1, items }];
    const grupos = [];
    for (const a of items) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.g === a.coincide) ultimo.items.push(a); else grupos.push({ g: a.coincide, items: [a] });
    }
    return grupos;
  }
  // El título de un grupo, con cuántos tiene (con los filtros puestos): T.busqueda.grupos, que ya dicen el número.
  function tituloGrupo(g, n) {
    const G = B.grupos;
    return h('h2', { class: 'grupo-titulo' }, ({ 1: G.directos, 2: G.descripcion, 3: G.sueltas })[g](n));
  }

  /* La lista del celular (PLAN-WEB.md §3.7): casi todo son líneas sueltas, porque un aviso de Empleos no tiene paquete tuyo. El que
     no está en tu lista no tiene match: su columna lleva la lupa. El que está en tu lista con el paquete armado va en su carpeta,
     con la lengüeta y el marbete, como en Paquetes. Un clic en cualquier lugar que no sea un control abre la ficha, como el puesto.
     Sin ningún .chip en un aviso que no está en tu lista: «nuevo», la lengüeta y el marbete no son chips. */
  function tarjeta(a) {
    const boton = h('button', { class: 'tarjeta-boton puesto', type: 'button', dataset: { control: 'abrir' }, onclick: () => abrirFicha(a, boton) },
      h('span', { class: 'aviso-puesto puesto-texto', text: a.puesto }), icono('i-adelante', 'puesto-flecha'));
    // En la carpeta el marbete ya dice la etapa: lo postulado no la repite en un chip.
    const marbete = a.con_paquete ? Aviso.marbete(a) : null;
    const marcas = [marbete && estadoDe(a) === 'postulada' ? null : chipLista(a), chipCoincide(a)].filter(Boolean);
    const chips = marcas.length ? h('div', { class: 'chips' }, marcas) : null;
    const tuyos = chipsTuyos(a);
    const pie = h('div', { class: 'tarjeta-pie' }, fechaDe(a), h('span', { class: 'acciones-tarjeta' }, linkLista(a), accion(a)));
    const donde = Aviso.lineaDonde(a, prefs);
    const etiquetas = Aviso.etiquetas(a, false, false, null);
    let art;
    if (a.con_paquete) {
      pie.classList.add('carpeta-acciones');
      art = h('article', { class: 'tarjeta-aviso carpeta', dataset: { aviso: a.aviso_id } },
        h('div', { class: 'carpeta-cabeza' }, Aviso.lengueta(a, umbral), marbete),
        h('div', { class: 'carpeta-cuerpo aviso-datos' }, boton,
          a.empresa ? h('span', { class: 'aviso-empresa empresa', text: a.empresa }) : null,
          h('div', { class: 'aviso-linea' }, Aviso.atributos(a, { sinFuente: true }), tuyos),
          donde, etiquetas, chips, pie));
    } else {
      const columna = estadoDe(a) === 'fuera'
        ? h('span', { class: 'linea-match linea-lupa' }, icono('i-buscar'))
        : Aviso.lengueta(a, umbral, { linea: true });
      art = h('article', { class: 'tarjeta-aviso linea', dataset: { aviso: a.aviso_id } }, columna,
        h('div', { class: 'linea-datos aviso-datos' }, boton,
          h('div', { class: 'linea-apoyo' }, a.empresa ? h('span', { class: 'aviso-empresa', text: a.empresa }) : null, Aviso.atributos(a, { sinFuente: true }), tuyos),
          donde, etiquetas, chips, pie));
    }
    art.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrirFicha(a, boton); });
    return art;
  }

  let filtroAbierto = null;
  // `grupos` ([{ g, n, items }]): con lo escrito, un cuerpo por grupo, cada uno con su título en una fila de encabezado.
  function tabla(vis, aviso, grupos) {
    const C = T.avisos.columnas;
    const th = (texto, clave, clase, sort) => Filtros.encabezado({ texto, clave, clase, activo: cambiado(clave), abierto: filtroAbierto === clave, sort,
      titulo: F.boton(NOMBRES[clave], resumen(clave)), alAbrir: (b) => abrirFiltro(clave, b, true) });
    const thead = h('thead', null, h('tr', null,
      h('th', { scope: 'col', class: 'col-puesto', text: C.puesto }), th(C.empresa, 'empresa', 'col-empresa'), th(C.ubicacion, 'ubicacion', 'col-ubicacion'),
      th(C.donde, 'donde', 'col-donde'), th(B.columnas.lista, 'lista', 'col-lista'), h('th', { scope: 'col', class: 'col-paquete', text: B.columnas.paquete }),
      th(C.publicado, 'publicado', 'col-publicado', orden === 'nuevos' ? 'descending' : 'none'),
      h('th', { scope: 'col', text: C.aviso })));
    let cuerpos;
    if (aviso) cuerpos = h('tbody', null, h('tr', null, h('td', { class: 'tabla-vacia', colspan: '8' }, aviso)));
    else if (grupos) {
      cuerpos = grupos.map((g) => h('tbody', null,
        h('tr', { class: 'grupo' }, h('th', { scope: 'rowgroup', colspan: '8' }, tituloGrupo(g.g, g.n))), g.items.map(fila)));
    } else cuerpos = h('tbody', null, vis.map(fila));
    return h('div', { class: 'tabla-caja tabla-busqueda' }, h('table', { class: 'tabla' }, thead, cuerpos));
  }
  // La celda «En tu lista»: el chip con qué es y, al lado y fuera de él, tu match (PLAN-WEB.md §2.7: el número nunca va sobre un
  // color de estado). La tabla de Empleos no tiene columna de match.
  function estadoEnLista(a) {
    const chip = chipLista(a);
    if (!chip || a.match === null) return chip;
    return h('span', { class: 'lista-estado' }, chip, h('span', { class: 'lista-match' + (Aviso.llega(a, umbral) ? '' : ' bajo') },
      h('span', { 'aria-hidden': 'true', text: String(a.match) }), oculto(T.avisos.matchAccesible(a.match, Aviso.llega(a, umbral)))));
  }
  // Lo que dicen las columnas que la tabla esconde cuando no le alcanza el ancho, debajo del puesto (como en Avisos).
  function lineaApoyo(a) {
    const d = Aviso.donde(a, prefs);
    return h('div', { class: 'atributos linea-apoyo' },
      a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null,
      h('span', { class: 'apoyo-lugar', title: tituloLugar(a), text: conModalidad(a, lugarCorto(a)) }),
      d.hecha ? null : h('span', { class: 'apoyo-donde', text: ' · ' + Aviso.textoDonde(d) }));
  }
  function fila(a) {
    const marcas = [chipsTuyos(a), chipCoincide(a)].flat().filter(Boolean);
    const tr = h('tr', { tabindex: '0', dataset: { aviso: a.aviso_id, control: 'abrir' } },
      h('td', { class: 'col-puesto' }, h('div', { class: 'aviso-puesto', text: a.puesto }), lineaApoyo(a), Aviso.etiquetas(a, false, false, null),
        marcas.length ? h('div', { class: 'chips linea-tuya' }, marcas) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-ubicacion' }, h('span', { class: 'atributos' }, icono(a.alcance === 'exterior' ? 'i-exterior' : 'i-local', 'icono-16'),
        h('span', { title: tituloLugar(a), text: conModalidad(a, lugarCorto(a)) }))),
      h('td', { class: 'col-donde' }, Aviso.celdaDonde(a, prefs)),
      h('td', { class: 'col-lista' }, h('div', { class: 'celda-paquete' }, estadoEnLista(a), linkLista(a))),
      h('td', { class: 'col-paquete' }, accion(a)),
      h('td', { class: 'col-publicado' }, fechaDe(a)),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: Terna.urlExterna(a.url), target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
    tr.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrirFicha(a, tr); });
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) { e.preventDefault(); abrirFicha(a, tr); } });
    return tr;
  }

  function nodoDe(a) { return lista.querySelector('[data-aviso="' + a.aviso_id + '"]'); }
  function enfocarAviso(a) {
    const n = nodoDe(a);
    if (n) (n.tagName === 'TR' ? n : n.querySelector('[data-control="abrir"]')).focus();
  }
  // Rehace la tarjeta o la fila de un aviso y devuelve el foco al mismo control (o al aviso, si el control ya no está).
  function refrescar(a) {
    const viejo = nodoDe(a);
    if (viejo) {
      const enfocado = viejo.contains(document.activeElement) ? (document.activeElement.dataset.control || 'abrir') : null;
      const nuevo = viejo.tagName === 'TR' ? fila(a) : tarjeta(a);
      viejo.replaceWith(nuevo);
      if (enfocado) (nuevo.dataset.control === enfocado ? nuevo : nuevo.querySelector('[data-control="' + enfocado + '"]') || nuevo.querySelector('[data-control="abrir"]') || nuevo).focus();
      marcarElegida();
    }
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.aviso_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
    actualizarBarra();
    actualizarExplorar();
  }

  /* ---------- Acciones ---------- */
  function avisarError(error) {
    if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true, icono: 'i-alerta' });
  }
  function quedaPedido(a, matchId) {
    if (matchId) a.match_id = matchId;
    a.estado_paquete = 'pedido';
    a.pedido_en = new Date().toISOString();
    a.interes = 'me_interesa';
    a.en_lista = true;
    if (!pedidos.includes(a.aviso_id)) pedidos.push(a.aviso_id);
  }
  // Pedir paquete: la misma confirmación que en Paquetes (en qué lugar queda, la regla y qué pasa después), con lo propio de pedirlo
  // desde acá cuando el aviso todavía no tiene tu match. Que pasa a tus avisos lo dice el aviso breve (PLAN-UX §3.3).
  async function pedir(a) {
    const lugar = pedidos.length + 1;
    const corridas = Math.ceil(lugar / cupo);
    const extraPedir = a.match === null ? [B.confirmar.sinMatch] : [];
    const si = await Aviso.confirmarPedir(a, { lugar, corridas, cupo, prefs, extra: extraPedir, incompleto: ctx.faltantes.length > 0 });
    if (!si) return;
    const { data, error } = await sb.rpc('pedir_aviso', { p_aviso_id: a.aviso_id });
    if (error) { avisarError(error); return; }
    quedaPedido(a, typeof data === 'string' ? data : null);
    refrescar(a);
    Terna.avisoBreve(B.pedidoBreve, { icono: 'i-pedido', link: { texto: B.pedidoVer, etiqueta: B.pedidoVerAccesible, href: 'avisos.html#proximos' },
      deshacer: () => cancelar(a, true) });
  }
  // Cancelar un pedido (desde la ficha o el Deshacer de Pedir). Sin pedido y sin número, el aviso vuelve a no estar en la lista.
  async function cancelar(a, deshaciendo) {
    const { error } = await sb.rpc('cancelar_pedido', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'sin_armar';
    a.pedido_en = null;
    if (a.match === null) a.en_lista = false;
    const i = pedidos.indexOf(a.aviso_id);
    if (i >= 0) pedidos.splice(i, 1);
    refrescar(a);
    if (deshaciendo) { enfocarAviso(a); return; }
    Terna.avisoBreve(T.avisos.pedidoCancelado, { icono: 'i-deshacer', deshacer: async () => {
      const r = await sb.rpc('pedir_aviso', { p_aviso_id: a.aviso_id });
      if (r.error) { avisarError(r.error); return; }
      quedaPedido(a, typeof r.data === 'string' ? r.data : null);
      refrescar(a);
      enfocarAviso(a);
    } });
  }

  /* ---------- Lo tuyo: seguir a la empresa y sumar el puesto (PLAN-UX §3.3, la ficha; §6.0) ----------
     Las dos escriben en la fila de preferencias de la persona, entera la lista, como Inicio y Preferencias (la misma política y los
     mismos topes: config.max_empresas_seguidas, que la base hace cumplir; 10 puestos de hasta 60 letras). Cada una se prende y se
     apaga desde la ficha, con un aviso breve y Deshacer, que vuelve a dejar la lista como estaba. Después, la lista y la ficha se
     rehacen: «Empresa que seguís» y «Tu puesto» aparecen (o se van) en cada aviso que corresponde. */
  let guardando = false;
  // Devuelve null si ya había una escritura en curso, o { error } (null si salió bien).
  async function guardarLista(campo, valor) {
    if (guardando) return null;
    guardando = true;
    const r = await sb.from('preferencias').update({ [campo]: valor }).eq('usuario_id', ctx.usuario.id).select(campo).single();
    guardando = false;
    if (r.error) return { error: r.error };
    prefs[campo] = (r.data && r.data[campo]) || [];
    leerTuyo();
    // Los atajos de tus puestos y tus empresas pueden aparecer o irse; la lista y la ficha, decir otra cosa.
    armarExplorar();
    dibujar();
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) {
      const a = porId.get(abierta.clave);
      Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
    }
    return { error: null };
  }
  // El foco, al control de la ficha abierta que se rehízo (el viejo ya no está).
  function enfocarEnFicha(control) {
    const b = document.querySelector('.hoja-cuerpo [data-control="' + control + '"]');
    if (b && Filtros.seVe(b)) b.focus();
  }

  async function seguir(a) {
    const antes = seguidas.nombres.slice();
    if (antes.length >= maxEmpresas) { Terna.avisoBreve(T.errores.empresasDemasiadas(maxEmpresas), { error: true, icono: 'i-alerta' }); return; }
    const r = await guardarLista('empresas_seguidas', [...antes, String(a.empresa).trim()]);
    if (!r) return;
    if (r.error) { avisarError(r.error); return; }
    enfocarEnFicha('seguir');
    Terna.avisoBreve(conApagado(LI.siguiendo(a.empresa), priorizaEmpresas(), T.inicio.empresas.apagado), { icono: 'i-tilde', deshacer: async () => {
      const r2 = await guardarLista('empresas_seguidas', antes);
      if (!r2) return;
      if (r2.error) { avisarError(r2.error); return; }
      enfocarEnFicha('seguir');
      Terna.avisoBreve(LI.dejaste(a.empresa));
    } });
  }
  // Dejar de seguirla: se va de tu lista con cualquier nombre que sea el de esta empresa (la regla del motor, js/empresas.js).
  async function dejarDeSeguir(a) {
    const antes = seguidas.nombres.slice();
    const r = await guardarLista('empresas_seguidas', antes.filter((x) => !Empresas.misma(a.empresa, x)));
    if (!r) return;
    if (r.error) { avisarError(r.error); return; }
    enfocarEnFicha('seguir');
    Terna.avisoBreve(LI.dejaste(a.empresa), { icono: 'i-deshacer', deshacer: async () => {
      const r2 = await guardarLista('empresas_seguidas', antes);
      if (!r2) return;
      if (r2.error) { avisarError(r2.error); return; }
      enfocarEnFicha('seguir');
      Terna.avisoBreve(LI.siguiendo(a.empresa));
    } });
  }

  // El título del aviso listo para ser un puesto (PLAN-UX §3.3: «Analista de datos»): sin lo que va entre paréntesis («(PRUEBA)»,
  // «(Sr)»), sin lo que sigue a « - » o « | » (el lugar, la empresa, la modalidad), sin las marcas de antigüedad del motor
  // (Puestos.MARCAS: «Jr», «Semi Senior») y sin un conector suelto en una punta. El motor compara por las palabras exactas del título
  // (pipeline.md §4.9, 3c): la persona lo puede corregir en el campo.
  function puestoLimpio(titulo) {
    const norm = (w) => String(w).normalize('NFKD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9&+#]/g, '');
    const base = String(titulo || '').replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').split(/\s+[-–—|·•]\s+|\s+\/\s+/)[0];
    const ps = base.split(/\s+/).filter((w) => norm(w));
    const salida = [];
    for (let i = 0; i < ps.length;) {
      const marca = window.Puestos ? Puestos.MARCAS.find((m) => m.every((x, j) => ps[i + j] && norm(ps[i + j]) === x)) : null;
      if (marca) i += marca.length; else { salida.push(ps[i]); i += 1; }
    }
    const conector = (w) => window.Puestos && Puestos.CONECTORES.has(norm(w));
    while (salida.length && conector(salida[salida.length - 1])) salida.pop();
    while (salida.length && conector(salida[0])) salida.shift();
    let r = salida.join(' ').replace(/[\s,;:.]+$/, '').trim();
    if (r.length > MAX_LARGO_PUESTO) {
      r = r.slice(0, MAX_LARGO_PUESTO);
      const corte = r.lastIndexOf(' ');
      if (corte > 20) r = r.slice(0, corte);
    }
    return r;
  }
  // Sumar a mis puestos: un diálogo chico con el título ya limpio en un campo, que avisa si es muy general o si ya hay diez.
  function sumarPuesto(a, origen) {
    const SP = B.sumarPuesto;
    const actuales = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim());
    const lleno = actuales.length >= MAX_PUESTOS;
    const bNo = h('button', { class: 'btn', type: 'button' }, lleno ? T.comun.cerrar : T.comun.cancelar);
    let campoPuesto = null;
    let nota = null;
    let bSi = null;
    let cuerpo;
    if (lleno) {
      cuerpo = [h('p', { text: SP.lleno(MAX_PUESTOS) }), h('p', null, h('a', { href: 'preferencias.html#puestos', text: B.irAPreferencias }))];
    } else {
      const idPuesto = Terna.idUnico('puesto');
      const idAyuda = Terna.idUnico('ayuda');
      const idNota = Terna.idUnico('nota');
      campoPuesto = h('input', { class: 'control', type: 'text', id: idPuesto, value: puestoLimpio(a.puesto), maxlength: String(MAX_LARGO_PUESTO),
        autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-describedby': idAyuda + ' ' + idNota });
      nota = h('p', { class: 'campo-error', id: idNota, 'aria-live': 'polite' });
      bSi = h('button', { class: 'btn btn-primario', type: 'button', dataset: { control: 'sumar-puesto-si' } }, B.ficha.sumarPuesto);
      // Con Priorizar mis puestos en No, la ayuda lo dice, con el link adonde se cambia (FEEDBACK-UX P2-4).
      const ayuda = h('p', { class: 'campo-ayuda', id: idAyuda }, SP.ayuda,
        priorizaPuestos() ? null : [' ' + T.inicio.puestos.apagado + ' ', h('a', { href: 'preferencias.html#puestos', text: B.ficha.cambiarlo })]);
      cuerpo = h('div', { class: 'formulario' }, h('div', { class: 'campo' },
        h('label', { class: 'campo-etiqueta', for: idPuesto, text: T.avisos.columnas.puesto }), campoPuesto, ayuda, nota));
      // Mientras se escribe: si es muy general, ya lo dice (el motor no lo usa: «Analista» solo está en casi todos los avisos).
      campoPuesto.addEventListener('input', () => { nota.textContent = window.Puestos && campoPuesto.value.trim() && Puestos.general(campoPuesto.value) ? SP.general : ''; });
      campoPuesto.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sumar(); } });
      bSi.addEventListener('click', () => sumar());
    }
    const dlg = Terna.dialogo({ titulo: SP.titulo, cuerpo, botones: [bNo, bSi].filter(Boolean), clase: 'dialogo-puesto' });
    let hecho = null;   // el puesto sumado, para dejar el foco en la ficha al cerrar
    bNo.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => {
      if (hecho) { enfocarEnFicha('sumar-puesto'); return; }
      Terna.devolverFoco(origen);
    });
    async function sumar() {
      if (bSi.getAttribute('aria-disabled') === 'true') return;
      const valor = campoPuesto.value.trim().replace(/\s+/g, ' ');
      const decir = (texto) => { nota.textContent = texto; campoPuesto.focus(); };
      if (!valor) { decir(SP.vacio); return; }
      if (window.Puestos && Puestos.general(valor)) { decir(SP.general); return; }
      if (valor.length > MAX_LARGO_PUESTO) { decir(T.errores.puestoLargo(MAX_LARGO_PUESTO)); return; }
      // Ya estaba (sin mirar mayúsculas, como Preferencias): no hay nada que escribir.
      const ya = actuales.find((x) => String(x).trim().toLowerCase() === valor.toLowerCase());
      if (ya) { hecho = ya; dlg.close(); Terna.avisoBreve(SP.hecho(String(ya).trim())); return; }
      bSi.setAttribute('aria-disabled', 'true');
      const r = await guardarLista('puestos_objetivo', [...actuales, valor]);
      bSi.removeAttribute('aria-disabled');
      if (!r) return;
      if (r.error) { if (!Terna.siSesionVencida(r.error)) decir(Terna.textoError(r.error)); return; }
      hecho = valor;
      dlg.close();
      Terna.avisoBreve(SP.hecho(valor), { icono: 'i-tilde', deshacer: async () => {
        const r2 = await guardarLista('puestos_objetivo', actuales);
        if (!r2) return;
        if (r2.error) { avisarError(r2.error); return; }
        enfocarEnFicha('sumar-puesto');
        Terna.avisoBreve(SP.sacado(valor));
      } });
    }
    dlg.showModal();
    if (campoPuesto) { campoPuesto.focus(); campoPuesto.setSelectionRange(campoPuesto.value.length, campoPuesto.value.length); } else bNo.focus();
  }
  // «Tu puesto», apretado de nuevo: el puesto que el título nombra sale de tu lista (con Deshacer).
  async function sacarPuesto(a, puesto) {
    const antes = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim());
    const r = await guardarLista('puestos_objetivo', antes.filter((x) => String(x).trim().toLowerCase() !== puesto.toLowerCase()));
    if (!r) return;
    if (r.error) { avisarError(r.error); return; }
    enfocarEnFicha('sumar-puesto');
    Terna.avisoBreve(B.sumarPuesto.sacado(puesto), { icono: 'i-deshacer', deshacer: async () => {
      const r2 = await guardarLista('puestos_objetivo', antes);
      if (!r2) return;
      if (r2.error) { avisarError(r2.error); return; }
      enfocarEnFicha('sumar-puesto');
      Terna.avisoBreve(B.sumarPuesto.hecho(puesto));
    } });
  }

  /* «Sumar a mis avisos» (PLAN-UX §6.1; decisión D5): que Terna te calcule el match de un aviso sin pedir el paquete. Queda escrito y
     apagado hasta que exista sumar_aviso en la base y el cambio del motor: el día que estén, se pasa a true y aparece en la ficha. */
  const SUMAR_A_MIS_AVISOS = false;
  const puedeSumar = (a) => SUMAR_A_MIS_AVISOS && estadoDe(a) === 'fuera' && a.match === null && !a.match_id;
  async function sumarAviso(a) {
    const { data, error } = await sb.rpc('sumar_aviso', { p_aviso_id: a.aviso_id });
    if (error) { avisarError(error); return; }
    if (typeof data === 'string') a.match_id = data;
    a.en_lista = true;
    a.interes = 'me_interesa';
    refrescar(a);
    Terna.avisoBreve(B.ficha.sumarAyuda, { icono: 'i-tilde' });
  }
  function seccionSumar(a) {
    if (!puedeSumar(a)) return null;
    return h('div', { class: 'ficha-sumar' }, h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'sumar-aviso' }, onclick: () => sumarAviso(a) },
      icono('i-agregar', 'icono-16'), B.ficha.sumar), h('p', { class: 'campo-ayuda', text: B.ficha.sumarAyuda }));
  }

  // Los dos botones de lo tuyo, que también dicen lo que Terna ya sabe: «Tu puesto» o «Sumar a mis puestos»; «La seguís» o «Seguir
  // a {empresa}». Cada uno es un botón que se aprieta (aria-pressed): apretado, dice lo que es y, para el lector de pantalla, por qué.
  function filaTuya(a) {
    if (!conFila) return null;
    const piezas = [];
    if (a.puesto) {
      const m = tuPuesto(a);
      const b = h('button', { class: 'btn btn-fila tuyo-boton', type: 'button', 'aria-pressed': m ? 'true' : 'false', dataset: { control: 'sumar-puesto' }, title: m ? explicaPuesto(m) : null },
        icono(m ? 'i-tilde' : 'i-agregar', 'icono-16'), m ? [h('span', { text: T.avisos.tuPuesto }), oculto(': ' + explicaPuesto(m))] : h('span', { text: B.ficha.sumarPuesto }));
      b.addEventListener('click', () => (m ? sacarPuesto(a, m) : sumarPuesto(a, b)));
      piezas.push(b);
    }
    if (seguidas.hay && a.empresa) {
      const s = tuEmpresa(a);
      const b = h('button', { class: 'btn btn-fila tuyo-boton', type: 'button', 'aria-pressed': s ? 'true' : 'false', dataset: { control: 'seguir' }, title: s ? explicaEmpresa(s) : null },
        icono(s ? 'i-tilde' : 'i-agregar', 'icono-16'), s ? [h('span', { text: LI.laSeguis }), oculto(': ' + explicaEmpresa(s))] : h('span', { text: B.ficha.seguir(a.empresa) }));
      b.addEventListener('click', () => (s ? dejarDeSeguir(a) : seguir(a)));
      piezas.push(b);
    }
    return piezas.length ? h('div', { class: 'botones ficha-tuyo' }, piezas) : null;
  }

  /* ---------- Filtros: cuerpo y apertura ---------- */
  function opcion(nombre, valor, texto, elegido, iconoId, n) {
    return h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: 'checkbox', name: nombre, value: valor, checked: elegido }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), iconoId ? icono(iconoId) : null, h('span', { text: texto }),
        n === undefined ? null : h('span', { class: 'chip-opcion-cuenta num', text: F.valores.cantidad(n) })));
  }
  const ICONOS = { modalidad: (v) => 'i-' + v, alcance: (v) => 'i-' + v };
  // Lo que deja ver un filtro junto con los demás y con lo escrito: de ahí salen las cuentas de sus opciones.
  const baseDe = (k) => avisos.filter((a) => pasa(a, k) && coincide(a));
  function opcionesDe(k, valores, texto, valorDe) {
    const base = baseDe(k);
    return valores.map((v) => ({ valor: v, texto: texto(v), n: base.filter((a) => valorDe(a) === v).length }));
  }
  // Empresa (busqueda.md §8, F7): con cientos de empresas, las casillas de todas no entran en el panel. Van "Todas", las
  // elegidas y las que más avisos tienen con los demás filtros y lo escrito; el resto se busca por nombre.
  const TOPE_EMPRESAS = 30;
  function cuerpoEmpresa() {
    const cuentas = new Map();
    for (const a of baseDe('empresa')) if (a.empresa) cuentas.set(a.empresa, (cuentas.get(a.empresa) || 0) + 1);
    const elegidas = new Set(filtros.empresa || []);
    const nombre = Terna.idUnico('empresas');
    const id = Terna.idUnico('buscar');
    const campoEmpresa = h('input', { type: 'search', class: 'control', id, autocomplete: 'off', spellcheck: 'false', dataset: { foco: 'filtro' } });
    const grupo = h('div', { class: 'chips' });
    const nota = h('p', { class: 'campo-ayuda' });
    function pintar() {
      const todas = Array.from(new Set([...elegidas, ...cuentas.keys()])).map((e) => [e, cuentas.get(e) || 0])
        .sort((x, y) => (elegidas.has(y[0]) - elegidas.has(x[0])) || (y[1] - x[1]) || alfabetico(x[0], y[0]));
      const candidatas = todas.filter(([e]) => elegidas.has(e) || Filtros.contiene(e, campoEmpresa.value));
      const muestra = candidatas.slice(0, Math.max(TOPE_EMPRESAS, elegidas.size));
      Terna.vaciar(grupo);
      const todasCasilla = opcion(nombre, '', B.filtros.todasEmpresas, elegidas.size === 0);
      todasCasilla.classList.add('chip-todos');
      Terna.agregar(grupo, [Filtros.hayTexto(campoEmpresa.value) ? null : todasCasilla, muestra.map(([e, n]) => opcion(nombre, e, e, elegidas.has(e), null, n))]);
      nota.textContent = !candidatas.length ? B.filtros.ningunaEmpresa : (candidatas.length > muestra.length ? B.filtros.masEmpresas(candidatas.length - muestra.length) : '');
    }
    grupo.addEventListener('change', (e) => {
      const v = e.target.value;
      if (v === '') elegidas.clear(); else if (elegidas.has(v)) elegidas.delete(v); else elegidas.add(v);
      filtros.empresa = Filtros.listaValida(Array.from(elegidas), null);
      aplicarFiltro();
      pintar();
      const otra = Array.from(grupo.querySelectorAll('input')).find((x) => x.value === v);
      if (otra) otra.focus();
    });
    campoEmpresa.addEventListener('input', pintar);
    // Esc cierra el panel, como en el resto (en un campo de búsqueda borraba lo escrito y el panel seguía abierto).
    campoEmpresa.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.isComposing) { e.preventDefault(); Terna.cerrarHoja(true); } });
    pintar();
    return h('div', { class: 'formulario filtro-cuerpo' },
      h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: id, text: B.filtros.buscarEmpresa }), campoEmpresa),
      h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: NOMBRES.empresa }), grupo), nota);
  }
  function cuerpoFiltro(k, desdeEncabezado) {
    if (k === 'empresa') return cuerpoEmpresa();
    if (k === 'ubicacion') return Filtros.cuerpoTexto({ valor: filtros.ubicacion, alCambiar: (v) => { filtros.ubicacion = v; aplicarFiltro(); } });
    if (k === 'publicado') {
      const cuerpo = Filtros.cuerpoFecha({ valor: filtros.publicado, alCambiar: (v) => { filtros.publicado = v; aplicarFiltro(); } });
      if (desdeEncabezado) cuerpo.prepend(Filtros.botonOrden(F.ordenar.nuevos, orden === 'nuevos', () => cambiarOrden('nuevos')));
      return cuerpo;
    }
    if (k === 'donde') {
      return Filtros.cuerpoValores({ nombre: NOMBRES.donde, opciones: opcionesDe('donde', DONDES, (v) => T.avisos.dondeFiltro[v], (a) => Aviso.donde(a, prefs).clave),
        elegidos: filtros.donde, todosTexto: F.todosColumna.donde, alCambiar: (v) => { filtros.donde = v; aplicarFiltro(); } });
    }
    if (k === 'lista') {
      // Tocar En tu lista a mano es decidir: «Que no tengo» ya no vuelve solo al borrar lo escrito.
      return Filtros.cuerpoValores({ nombre: NOMBRES.lista, opciones: opcionesDe('lista', LISTAS, (v) => B.listaFiltro[v], estadoDe),
        elegidos: filtros.lista, todosTexto: B.filtros.todosLista, alCambiar: (v) => { filtros.lista = v; noTengoSuspendido = false; aplicarFiltro(); } });
    }
    // Modalidad, Alcance, Nivel y Jornada: las opciones de Preferencias, con al menos una marcada; todas es "sin filtro".
    const cuerpo = h('div', { class: 'formulario filtro-cuerpo' });
    const aviso = h('p', { class: 'campo-error', role: 'alert' });
    const elegidos = filtros[k] || TODOS[k];
    const grupo = h('div', { class: 'chips' }, TODOS[k].map((v) => opcion(k, v, nombreDe(k, v), elegidos.includes(v), ICONOS[k] ? ICONOS[k](v) : null)));
    grupo.addEventListener('change', (e) => {
      const marcados = Array.from(grupo.querySelectorAll('input:checked')).map((x) => x.value);
      if (!marcados.length) { e.target.checked = true; aviso.textContent = F.alMenosUna; return; }
      aviso.textContent = '';
      filtros[k] = Filtros.listaValida(marcados, TODOS[k]);
      aplicarFiltro();
    });
    cuerpo.append(h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: NOMBRES[k] }), grupo), aviso);
    if (F.sinDato[k]) cuerpo.append(h('p', { class: 'campo-ayuda', text: F.sinDato[k] }));
    return cuerpo;
  }
  function abrirFiltro(k, boton, desdeEncabezado) {
    filtroAbierto = k;
    Filtros.abrir({ clave: k, titulo: NOMBRES[k], cuerpo: cuerpoFiltro(k, desdeEncabezado), boton,
      destino: () => {
        const th = lista.querySelector('th [data-filtro="' + k + '"]');
        if (desdeEncabezado) return Filtros.seVe(th) ? th : (Filtros.seVe(botones[k]) ? botones[k] : primerFiltro());
        return Filtros.seVe(botones[k]) ? botones[k] : (Filtros.seVe(th) ? th : primerFiltro());
      },
      alCerrar: () => { filtroAbierto = null; } });
  }

  /* ---------- Ficha del aviso ----------
     Lo que Terna sabe del aviso sin su texto (que se lee en el aviso original: arquitectura.md §7.6), qué es para la persona,
     dónde se postula y Pedir paquete. */
  // La cabecera es una carpeta (PLAN-WEB.md §3.7): la lengüeta con tu match y el marbete con la etapa. Si el aviso no está en tu
  // lista (o todavía no tiene match ni etapa), sin lengüeta ni marbete: el cuerpo de la carpeta solo. Aquí la lengüeta no es un
  // botón: Empleos no sabe por qué ajusta.
  function cabeceraFicha(a, idTitulo) {
    const sinLengueta = estadoDe(a) === 'fuera' || (a.match === null && !Aviso.estadoDe(a));
    return Aviso.cabezaFicha({ a, idTitulo, umbral, sinLengueta });
  }
  function seccionLista(a) {
    const E = B.ficha.estado;
    const e = estadoDe(a);
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: B.ficha.enTuLista }));
    if (e === 'fuera') sec.append(h('p', { text: a.match === null ? E.fuera : E.fueraConMatch(a.match) }));
    else if (e === 'pedido') {
      const l = lugarPedido(a);
      sec.append(h('p', { text: (l ? T.avisos.pedidoLugarAccesible(l, Math.ceil(l / cupo)) + '.' : T.avisos.ficha.loArma) + (a.match === null ? ' ' + E.pedidoSinMatch : '') }),
        h('div', { class: 'botones' }, h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'cancelar-pedido' }, onclick: () => cancelar(a) }, icono('i-cerrar', 'icono-16'), T.avisos.cancelarPedido)));
    } else if (e === 'en_lista') sec.append(h('p', { text: a.estado_paquete === 'no_se_pudo_armar' ? E.no_se_pudo : E.en_lista(a.match) }));
    else sec.append(h('p', { text: E[e] }));
    const link = linkLista(a);
    if (link) sec.append(h('p', null, link));
    if (!armar && e !== 'postulada' && e !== 'con_paquete') sec.append(h('p', { class: 'suave' }, B.ficha.armarNo + ' ', h('a', { href: 'preferencias.html#paquetes', text: B.ficha.cambiarlo })));
    const sumar = seccionSumar(a);
    if (sumar) sec.append(sumar);
    return sec;
  }
  function seccionDonde(a) {
    const d = Aviso.donde(a, prefs);
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: B.ficha.donde }), h('p', { class: 'donde-ficha' }, Aviso.etiquetaDonde(d)));
    if (!d.hecha) sec.append(h('p', { class: 'suave', text: Aviso.explicacionDonde(a, d, prefs) }));
    return sec;
  }
  // Todos los avisos abiertos de la empresa de este aviso: la lista sin nada escrito, sin atajos ni otros filtros, con esa empresa.
  function verEmpresa(a) {
    Terna.cerrarHoja(true);
    filtros = inicial();
    extra = extraInicial();
    noTengoSuspendido = false;
    filtros.empresa = [a.empresa];
    campo.value = '';
    aplicarTexto();
    window.scrollTo(0, 0);
    primerFiltro().focus();
  }
  function seccionDatos(a) {
    const D = B.ficha;
    const filas = [[D.modalidad, a.modalidad ? T.avisos.modalidad[a.modalidad] : null], [D.nivel, a.nivel ? T.preferencias.nivel[a.nivel] : null],
      [D.jornada, a.jornada ? T.preferencias.jornada[a.jornada] : null], [D.publicado, Terna.fechaCorta(a.publicado_en)], [D.fuente, a.fuente]].filter(([, v]) => v);
    const deLaEmpresa = a.empresa ? porEmpresa.get(a.empresa) || 0 : 0;
    const soloEsa = filtros.empresa && filtros.empresa.length === 1 && filtros.empresa[0] === a.empresa && !palabras.length && !extraCambiado();
    return h('section', { class: 'ficha-seccion' }, h('h3', { text: D.datos }),
      h('dl', { class: 'respuestas datos-aviso' }, filas.map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })))),
      h('p', { class: 'suave', text: Aviso.deTerna(a) ? D.fuenteNotaTerna : D.fuenteNota(a.fuente) }),
      deLaEmpresa > 1 && !soloEsa ? h('div', { class: 'botones' }, h('button', { class: 'btn btn-fila', type: 'button', dataset: { control: 'ver-empresa' }, onclick: () => verEmpresa(a) },
        icono('i-empresa', 'icono-16'), D.masDeEmpresa(deLaEmpresa, a.empresa))) : null);
  }
  function cuerpoFicha(a) {
    Aviso.registrarVista(a);  // un aviso publicado en Terna cuenta la vista (contratar.md 0.1 §5)
    // Con el marbete en la cabecera, lo postulado no repite la etapa en un chip (como en la carpeta de la lista). «Tu puesto» y
    // «Empresa que seguís» no van como chips: los dicen los dos botones de lo tuyo, que están justo debajo (filaTuya).
    const marbete = estadoDe(a) !== 'fuera' && !!Aviso.estadoDe(a);
    const chips = [marbete && estadoDe(a) === 'postulada' ? null : chipLista(a), chipCoincide(a), fechaDe(a)].filter(Boolean);
    // "Fuera de tus preferencias" va acá, explicado, y no en cada fila: en Empleos lo está buena parte de la lista.
    return [h('div', { class: 'chips' }, chips), filaTuya(a), Aviso.etiquetas(a, false, true, estadoDe(a) === 'fuera' || estadoDe(a) === 'en_lista' ? Aviso.motivosFuera(a, dePrefs) : null),
      seccionLista(a), seccionDonde(a), seccionDatos(a)];
  }
  function accionesFicha(a) {
    const pide = puedePedir(a);
    // Con "Pedir paquete" a la vista, es la acción principal y abrir el aviso pasa a segunda.
    return h('div', { class: 'botones' }, pide ? botonPedir(a, true) : null, Aviso.abrirAviso(a, pide ? 'btn btn-ancho' : null, prefs), Aviso.verAviso(a, prefs));
  }
  function marcarElegida() {
    const abierta = Terna.hojaAbierta();
    for (const tr of lista.querySelectorAll('tr.elegida')) tr.classList.remove('elegida');
    if (abierta && abierta.clave) {
      const tr = lista.querySelector('tr[data-aviso="' + abierta.clave + '"]');
      if (tr) tr.classList.add('elegida');
    }
  }
  function abrirFicha(a, origen, desdeHash) {
    // Una sola entrada de historial por ficha, como en Paquetes.
    if (!desdeHash && location.hash !== '#aviso-' + a.aviso_id) {
      if (history.state && history.state.ficha && /^#aviso-/.test(location.hash)) history.replaceState({ ficha: a.aviso_id }, '', '#aviso-' + a.aviso_id);
      else history.pushState({ ficha: a.aviso_id }, '', '#aviso-' + a.aviso_id);
    }
    const idTitulo = Terna.idUnico('ficha');
    Terna.abrirHoja({ cabecera: cabeceraFicha(a, idTitulo), idTitulo, cuerpo: cuerpoFicha(a), acciones: accionesFicha(a), enLinea: true,
      origen: origen || nodoDe(a), clave: a.aviso_id,
      alCerrar: (porUsuario) => { marcarElegida(); if (porUsuario) limpiarHash(); } });
    marcarElegida();
  }
  function limpiarHash() {
    if (!/^#aviso-/.test(location.hash)) return;
    if (history.state && history.state.ficha) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
  function sincronizarHash() {
    const m = /^#aviso-([0-9a-f-]{36})$/i.exec(location.hash);
    const abierta = Terna.hojaAbierta();
    if (m && porId.has(m[1])) {
      if (!abierta || abierta.clave !== m[1]) abrirFicha(porId.get(m[1]), null, true);
    } else if (abierta && abierta.clave) {
      Terna.cerrarHoja(false);
    }
  }
  window.addEventListener('popstate', sincronizarHash);
  document.addEventListener('terna:cambio-diseno', () => dibujarLista());
  document.addEventListener('terna:cambio-ancho', () => {
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave && porId.has(abierta.clave)) { Terna.cerrarHoja(false); abrirFicha(porId.get(abierta.clave), null, true); }
  });

  /* ---------- Arranque ---------- */
  armarBuscador();
  armarExplorar();
  dibujarHerramientas();
  armarBarra();
  buscarEnDescripciones();
  dibujar();
  sincronizarHash();
});
