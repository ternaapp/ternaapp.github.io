/* Terna · js/avisos.js
   Avisos (diseno.md §7): la lista por match, los filtros, el interés en el lugar, la ficha y el texto pegado.
   Lee mis_avisos, preferencias, paquetes (solo contenido→render→bajo_minimo), corridas_usuarios (si Terna ya corrió)
   y config; escribe con marcar_interes, pedir_paquete, cancelar_pedido y pegar_texto_aviso (datos.md §14). */
'use strict';

Terna.pagina('avisos', async (ctx) => {
  const { h, icono, oculto } = Terna;
  const sb = ctx.sb;
  const config = ctx.config;
  const lista = document.getElementById('lista');
  const herramientas = document.getElementById('herramientas');
  const chipsFiltros = document.getElementById('chips-filtros');
  const cuenta = document.getElementById('cuenta');
  const COLUMNAS = 'match_id, aviso_id, puesto, empresa, ubicacion, pais, modalidad, alcance, url, fuente, postulacion, dudoso, publicado_en, visto_en, tiene_texto, texto_origen, match, razones, requisitos_faltantes, interes, estado_paquete, pedido_en, creado_en, nuevo, paquete_id, paquete_idioma, cv_path, carta_path, salario_monto, salario_moneda, salario_periodo, salario_motivo, notas, estado_postulacion, motivo_a_mano, traba_detalle, intentos, en_cola_en, enviada_en, postulado_en, entrevista_en';

  const parar = Terna.cargando(lista);
  const [rA, rP, rB, rC] = await Promise.all([
    sb.from('mis_avisos').select(COLUMNAS),
    sb.from('preferencias').select('umbral, interes_por_defecto, armar_paquetes, paquetes_por_dia, salario_modo').eq('usuario_id', ctx.usuario.id).maybeSingle(),
    sb.from('paquetes').select('match_id, bajo_minimo:contenido->render->bajo_minimo'),
    sb.from('corridas_usuarios').select('fecha').eq('usuario_id', ctx.usuario.id).limit(1),
  ]);
  parar();
  const errorCarga = rA.error || rP.error || rB.error || rC.error;
  if (errorCarga) { Terna.errorDeCarga(lista, errorCarga); return; }

  const avisos = rA.data || [];
  const porId = new Map(avisos.map((a) => [a.match_id, a]));
  const prefs = rP.data || { umbral: 70, interes_por_defecto: true, armar_paquetes: true, paquetes_por_dia: 3, salario_modo: 'sugerir' };
  const umbral = prefs.umbral;
  const piso = config.piso_match || 50;
  const conMinimo = new Set((rB.data || []).filter((p) => p.bajo_minimo === true).map((p) => p.match_id));
  const yaCorrio = (rC.data || []).length > 0;
  const bajoMinimo = (a) => prefs.salario_modo === 'rango' && !!a.paquete_id && conMinimo.has(a.match_id);

  /* ---------- Filtros y orden (§7.2) ---------- */
  const INTERESES = ['me_interesa', 'por_decidir', 'no_me_interesa'];
  const PAQUETES = ['todos', 'armado', 'sin_armar', 'pedido', 'no_se_pudo_armar', 'sin_texto', 'por_puntuar'];
  const POSTULACIONES = ['todas', 'pendiente', 'en_cola', 'para_revisar', 'enviada', 'a_mano', 'postulado', 'entrevista'];
  const MODALIDADES = ['remoto', 'hibrido', 'presencial'];
  const ALCANCES = ['local', 'exterior'];
  const inicial = () => ({ interes: ['me_interesa', 'por_decidir'], paquete: 'todos', postulacion: 'todas', modalidad: [], alcance: [], matchMin: null, bajoUmbral: false });
  function validos(f) {
    const d = inicial();
    if (!f || typeof f !== 'object') return d;
    return {
      interes: Array.isArray(f.interes) ? f.interes.filter((x) => INTERESES.includes(x)) : d.interes,
      paquete: PAQUETES.includes(f.paquete) ? f.paquete : d.paquete,
      postulacion: POSTULACIONES.includes(f.postulacion) ? f.postulacion : d.postulacion,
      modalidad: Array.isArray(f.modalidad) ? f.modalidad.filter((x) => MODALIDADES.includes(x)) : [],
      alcance: Array.isArray(f.alcance) ? f.alcance.filter((x) => ALCANCES.includes(x)) : [],
      matchMin: Number.isInteger(f.matchMin) ? f.matchMin : null,
      bajoUmbral: f.bajoUmbral === true,
    };
  }
  let filtros = validos(Terna.leerLocal('avisos.filtros', null));
  const q = new URLSearchParams(location.search);
  if (q.get('interes') === 'por_decidir') filtros = Object.assign(inicial(), { interes: ['por_decidir'] });
  if (q.get('paquete') === 'sin_texto') filtros = Object.assign(inicial(), { paquete: 'sin_texto' });
  let orden = Terna.leerLocal('avisos.orden', 'match') === 'nuevos' ? 'nuevos' : 'match';

  function minimo() {
    const m = filtros.matchMin === null ? umbral : filtros.matchMin;
    return filtros.bajoUmbral ? Math.max(piso, Math.min(m, 100)) : Math.max(m, umbral);
  }
  function pasa(a) {
    if (!filtros.interes.includes(a.interes)) return false;
    if (filtros.paquete !== 'todos' && Aviso.estadoPaquete(a) !== filtros.paquete) return false;
    if (filtros.postulacion !== 'todas' && a.estado_postulacion !== filtros.postulacion) return false;
    if (filtros.modalidad.length && !filtros.modalidad.includes(a.modalidad)) return false;
    if (filtros.alcance.length && !filtros.alcance.includes(a.alcance)) return false;
    if (a.match !== null && a.match < minimo()) return false;
    return true;
  }
  const desc = (x, y) => (x === y ? 0 : (x === null || x === undefined) ? 1 : (y === null || y === undefined) ? -1 : (x < y ? 1 : -1));
  function comparar(a, b) {
    if (orden === 'nuevos') return desc(a.publicado_en, b.publicado_en) || desc(a.visto_en, b.visto_en);
    return desc(a.match, b.match) || (a.dudoso === b.dudoso ? 0 : a.dudoso ? 1 : -1)
      || desc(a.publicado_en, b.publicado_en) || desc(a.creado_en, b.creado_en);
  }
  function visibles() { return avisos.filter(pasa).sort(comparar); }
  function chipsActivos() {
    const F = T.avisos.filtros;
    const lista = [];
    const defI = inicial().interes;
    const mismoInteres = filtros.interes.length === defI.length && defI.every((x) => filtros.interes.includes(x));
    if (!mismoInteres) for (const v of filtros.interes) lista.push([T.avisos.interes[v], () => { filtros.interes = filtros.interes.filter((x) => x !== v); if (!filtros.interes.length) filtros.interes = inicial().interes; }]);
    if (filtros.paquete !== 'todos') lista.push([T.avisos.paquete[filtros.paquete], () => { filtros.paquete = 'todos'; }]);
    if (filtros.postulacion !== 'todas') lista.push([T.avisos.postulacion[filtros.postulacion], () => { filtros.postulacion = 'todas'; }]);
    for (const v of filtros.modalidad) lista.push([T.avisos.modalidad[v], () => { filtros.modalidad = filtros.modalidad.filter((x) => x !== v); }]);
    for (const v of filtros.alcance) lista.push([T.avisos.alcance[v], () => { filtros.alcance = filtros.alcance.filter((x) => x !== v); }]);
    if (minimo() !== umbral) lista.push([F.matchMinimoChip(minimo()), () => { filtros.matchMin = null; filtros.bajoUmbral = false; }]);
    return lista;
  }
  function guardarFiltros() { Terna.guardarLocal('avisos.filtros', filtros); }

  /* ---------- Herramientas y chips de filtros ---------- */
  function dibujarHerramientas() {
    Terna.vaciar(herramientas);
    const n = chipsActivos().length;
    const bFiltrar = h('button', { class: 'btn btn-barra', type: 'button', 'aria-haspopup': 'dialog', onclick: () => abrirFiltros(bFiltrar) },
      icono('i-filtrar'), n ? T.avisos.filtrarCon(n) : T.avisos.filtrar);
    const sel = h('select', { class: 'control', id: 'orden' },
      h('option', { value: 'match', text: T.avisos.ordenMatch, selected: orden === 'match' }),
      h('option', { value: 'nuevos', text: T.avisos.ordenNuevos, selected: orden === 'nuevos' }));
    sel.addEventListener('change', () => { orden = sel.value; Terna.guardarLocal('avisos.orden', orden); dibujarLista(); });
    herramientas.append(bFiltrar, h('span', { class: 'orden' }, icono('i-ordenar', 'icono-16'), h('label', { for: 'orden', text: T.avisos.ordenarPor + ':' }), sel));
    Terna.vaciar(chipsFiltros);
    for (const [texto, quitar] of chipsActivos()) {
      chipsFiltros.append(h('span', { class: 'chip chip-filtro' }, h('span', { text: texto }),
        h('button', { type: 'button', 'aria-label': T.avisos.filtros.quitar(texto), onclick: () => { quitar(); guardarFiltros(); dibujar(); herramientas.querySelector('button').focus(); } }, icono('i-cerrar', 'icono-14'))));
    }
  }

  /* ---------- Lista: tarjetas (celular) o tabla (escritorio) ---------- */
  function dibujar() { dibujarHerramientas(); dibujarLista(); }
  function dibujarLista() {
    Terna.vaciar(lista);
    const vis = visibles();
    cuenta.textContent = avisos.length ? T.avisos.cuenta(vis.length) : '';
    if (!avisos.length) {
      lista.append(h('div', { class: 'vacio' }, h('p', { text: yaCorrio ? T.avisos.vacioSinAvisos : T.avisos.vacioSinCorrida }),
        h('a', { class: 'btn', href: 'preferencias.html' }, T.avisos.revisarPreferencias)));
      return;
    }
    if (!vis.length) {
      lista.append(h('div', { class: 'vacio' }, h('p', { text: T.avisos.vacioFiltros }),
        h('button', { class: 'btn', type: 'button', onclick: () => { filtros = inicial(); guardarFiltros(); dibujar(); } }, T.avisos.filtros.limpiarFiltros)));
      return;
    }
    if (Terna.anchoEscritorio.matches) lista.append(tabla(vis));
    else lista.append(h('ul', { class: 'lista-tarjetas', role: 'list' }, vis.map((a) => h('li', null, tarjeta(a)))));
    marcarElegida();
  }

  function puedePedir(a) {
    return a.tiene_texto && prefs.armar_paquetes && a.estado_paquete === 'sin_armar' && !a.paquete_id && a.interes !== 'no_me_interesa';
  }
  function botonPedir(a, clase) {
    return h('button', { class: clase || 'btn', type: 'button', dataset: { control: 'pedir' }, onclick: () => pedir(a) }, T.avisos.pedirPaquete);
  }
  function botonPegar(a, clase) {
    return h('button', { class: clase || 'btn btn-ancho', type: 'button', dataset: { control: 'pegar' }, onclick: () => pegarTexto(a) }, icono('i-pegar'), T.avisos.ficha.pegar);
  }
  // Bajo el umbral: "Pedir paquete" (que implica interés) y "No me interesa"; con "No me interesa" puesto, "Me interesa" para volverlo.
  function accionesBajo(a, enTabla) {
    const clase = 'btn btn-texto' + (enTabla ? ' btn-chico' : '');
    const cont = h('div', { class: 'acciones-tarjeta' });
    if (a.interes === 'no_me_interesa') {
      cont.append(h('button', { class: clase, type: 'button', dataset: { control: 'interes-si' }, onclick: () => cambiarInteres(a, 'me_interesa') }, icono('i-tilde'), T.avisos.interes.me_interesa));
      return cont;
    }
    if (puedePedir(a)) cont.append(botonPedir(a, clase));
    cont.append(h('button', { class: clase, type: 'button', dataset: { control: 'interes-no' }, onclick: () => cambiarInteres(a, 'no_me_interesa') }, icono('i-no-interesa'), T.avisos.interes.no_me_interesa));
    return cont;
  }
  function accionesAviso(a, enTabla) {
    if (!a.tiene_texto) return botonPegar(a, enTabla ? 'btn btn-texto btn-chico' : null);
    if (a.match === null) return null;
    if (Aviso.llega(a, umbral)) return Aviso.controlInteres(a, (enTabla ? 'it-' : 'ic-') + a.match_id, (v) => cambiarInteres(a, v));
    return accionesBajo(a, enTabla);
  }

  function tarjeta(a) {
    const art = h('article', { class: 'tarjeta tarjeta-aviso', dataset: { match: a.match_id } });
    const boton = h('button', { class: 'tarjeta-boton', type: 'button', dataset: { control: 'abrir' }, onclick: () => abrirFicha(a, boton) },
      h('span', { class: 'aviso-datos' },
        h('span', { class: 'aviso-puesto', text: a.puesto }),
        a.empresa ? h('span', { class: 'aviso-empresa', text: a.empresa }) : null,
        Aviso.atributos(a),
        Aviso.etiquetas(a, bajoMinimo(a))),
      Aviso.bloqueMatch(a, umbral));
    const bajo = a.match !== null && !Aviso.llega(a, umbral);
    Terna.agregar(art, [boton,
      h('div', { class: 'chips' }, Aviso.chipInteres(a, config), Aviso.chipPaquete(a), Aviso.chipPostulacion(a), Aviso.chipFaltan(a),
        bajo ? h('span', { class: 'chip-texto', text: T.avisos.bajoUmbral }) : null, Aviso.fecha(a)),
      accionesAviso(a, false)]);
    return art;
  }

  function tabla(vis) {
    const C = T.avisos.columnas;
    const ordenable = (texto, clave) => {
      const activo = orden === clave;
      const th = h('th', { scope: 'col', class: clave === 'match' ? 'der' : null, 'aria-sort': activo ? 'descending' : 'none' },
        h('button', { type: 'button', onclick: () => { orden = clave; Terna.guardarLocal('avisos.orden', orden); dibujar(); } }, texto, activo ? icono('i-chevron', 'icono-14') : null));
      return th;
    };
    const publicado = ordenable(C.publicado, 'nuevos');
    publicado.classList.add('col-publicado');
    const thead = h('thead', null, h('tr', null,
      h('th', { scope: 'col', text: C.puesto }), h('th', { scope: 'col', class: 'col-empresa', text: C.empresa }), h('th', { scope: 'col', class: 'col-modalidad', text: C.modalidad }),
      h('th', { scope: 'col', class: 'col-ubicacion', text: C.ubicacion }), ordenable(C.match, 'match'), h('th', { scope: 'col', text: C.paquete }),
      h('th', { scope: 'col', text: C.postulacion }), h('th', { scope: 'col', class: 'col-interes', text: C.interes }), publicado,
      h('th', { scope: 'col', text: C.aviso })));
    const tbody = h('tbody', null, vis.map(fila));
    return h('div', { class: 'tabla-caja tabla-avisos' }, h('table', { class: 'tabla' }, thead, tbody));
  }
  // Lo que dicen las columnas que la tabla esconde cuando no le alcanza el ancho (diseno.md 0.8 §7.6): empresa, lugar y
  // modalidad debajo del puesto, como en la fila de Postulaciones. Oculta mientras las columnas se ven.
  function lineaApoyo(a) {
    return h('div', { class: 'atributos linea-apoyo' },
      a.empresa ? h('span', { class: 'apoyo-empresa', text: a.empresa + ' · ' }) : null,
      h('span', { text: Aviso.lugar(a) }), a.modalidad ? h('span', { text: ' · ' + T.avisos.modalidadMin[a.modalidad] }) : null);
  }
  function fila(a) {
    const bajo = a.match !== null && !Aviso.llega(a, umbral);
    const faltan = Aviso.chipFaltan(a);
    const tr = h('tr', { tabindex: '0', dataset: { match: a.match_id, control: 'abrir' } },
      h('td', null, h('div', { class: 'aviso-puesto', text: a.puesto }), lineaApoyo(a), Aviso.etiquetas(a, bajoMinimo(a)), faltan ? h('div', null, faltan) : null),
      h('td', { class: 'col-empresa', text: a.empresa || '' }),
      h('td', { class: 'col-modalidad' }, a.modalidad ? h('span', { class: 'atributos' }, icono('i-' + a.modalidad, 'icono-16'), T.avisos.modalidadMin[a.modalidad]) : null),
      h('td', { class: 'col-ubicacion' }, h('span', { class: 'atributos' }, icono(a.alcance === 'exterior' ? 'i-exterior' : 'i-local', 'icono-16'), Aviso.lugar(a))),
      h('td', { class: 'tabla-match' + (Aviso.llega(a, umbral) || a.match === null ? '' : ' bajo') },
        h('span', { 'aria-hidden': 'true', text: a.match === null ? '—' : String(a.match) }),
        oculto(a.match === null ? T.avisos.sinMatch : T.avisos.matchAccesible(a.match, Aviso.llega(a, umbral)))),
      h('td', null, Aviso.chipPaquete(a), bajo ? h('div', { class: 'chip-texto', text: T.avisos.bajoUmbral }) : null),
      h('td', null, Aviso.chipInteres(a, config), Aviso.chipPostulacion(a)),
      h('td', { class: 'col-interes' }, accionesAviso(a, true)),
      h('td', { class: 'col-publicado' }, Aviso.fecha(a)),
      h('td', null, h('a', { class: 'btn btn-texto btn-chico', href: a.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.avisos.abrirEnAccesible(a.fuente) }, icono('i-abrir'))));
    tr.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrirFicha(a, tr); });
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) { e.preventDefault(); abrirFicha(a, tr); } });
    return tr;
  }

  function nodoDe(a) { return lista.querySelector('[data-match="' + a.match_id + '"]'); }
  // Rehace la tarjeta o la fila de un aviso y devuelve el foco al mismo control.
  function refrescar(a) {
    const viejo = nodoDe(a);
    if (viejo) {
      const enfocado = viejo.contains(document.activeElement) ? (document.activeElement.dataset.control || 'abrir') : null;
      const nuevo = viejo.tagName === 'TR' ? fila(a) : tarjeta(a);
      viejo.replaceWith(nuevo);
      if (enfocado) {
        const destino = nuevo.dataset.control === enfocado ? nuevo : nuevo.querySelector('[data-control="' + enfocado + '"]') || nuevo.querySelector('[data-control="abrir"]') || nuevo;
        destino.focus();
      }
      marcarElegida();
    }
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
  }
  // "No me interesa" saca la tarjeta con 150 ms y lleva el foco a la siguiente (o a la anterior si era la última).
  async function sacar(a) {
    const nodo = nodoDe(a);
    const filas = Array.from(lista.querySelectorAll('[data-match]'));
    const i = nodo ? filas.indexOf(nodo) : -1;
    const teniaFoco = nodo && nodo.contains(document.activeElement);
    if (nodo && nodo.classList.contains('tarjeta')) {
      nodo.classList.add('saliendo');
      await new Promise((r) => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150));
    }
    dibujar();
    const abierta = Terna.hojaAbierta();
    if (abierta && abierta.clave === a.match_id) Terna.reemplazarCuerpoHoja(cuerpoFicha(a), accionesFicha(a));
    if (teniaFoco) {
      const nuevas = Array.from(lista.querySelectorAll('[data-match]'));
      const destino = nuevas[Math.min(i, nuevas.length - 1)];
      if (destino) (destino.tagName === 'TR' ? destino : destino.querySelector('[data-control="abrir"]')).focus();
      else Terna.devolverFoco(null);
    }
  }

  /* ---------- Acciones ---------- */
  function avisarError(error) {
    if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true, icono: 'i-alerta' });
  }
  async function cambiarInteres(a, valor, deshaciendo) {
    const anterior = a.interes;
    if (valor === anterior) return;
    const estaba = pasa(a);
    const { error } = await sb.rpc('marcar_interes', { p_match_id: a.match_id, p_interes: valor });
    if (error) { avisarError(error); refrescar(a); return; }
    a.interes = valor;
    if (valor === 'no_me_interesa') {
      if (a.estado_paquete === 'pedido') a.estado_paquete = 'sin_armar';
      if (a.estado_postulacion === 'en_cola' || a.estado_postulacion === 'para_revisar') a.estado_postulacion = 'pendiente';
    }
    const queda = pasa(a);
    if (estaba && !queda) await sacar(a);
    else if (!estaba && queda) { dibujar(); }
    else refrescar(a);
    if (deshaciendo) {
      // El foco estaba en el aviso breve, que ya no existe: vuelve al aviso.
      const n = nodoDe(a);
      if (n) (n.tagName === 'TR' ? n : n.querySelector('[data-control="abrir"]')).focus();
    } else {
      Terna.avisoBreve(valor === 'no_me_interesa' ? T.avisos.noTeInteresa : T.avisos.teInteresa,
        { icono: valor === 'no_me_interesa' ? 'i-no-interesa' : 'i-tilde', deshacer: () => cambiarInteres(a, anterior, true) });
    }
  }
  async function pedir(a) {
    const { error } = await sb.rpc('pedir_paquete', { p_match_id: a.match_id });
    if (error) { avisarError(error); return; }
    a.estado_paquete = 'pedido';
    a.interes = 'me_interesa';
    refrescar(a);
    Terna.avisoBreve(T.avisos.pedido(prefs.paquetes_por_dia), { icono: 'i-pedido', deshacer: async () => {
      const r = await sb.rpc('cancelar_pedido', { p_match_id: a.match_id });
      if (r.error) { avisarError(r.error); return; }
      a.estado_paquete = 'sin_armar';
      refrescar(a);
    } });
  }
  function pegarTexto(a) {
    const origen = document.activeElement;
    const max = config.max_texto_pegado_chars || 20000;
    const min = config.min_texto_pegado_chars || 100;
    const idAyuda = Terna.idUnico('ayuda');
    const idCont = Terna.idUnico('cont');
    const idErr = Terna.idUnico('err');
    const area = h('textarea', { class: 'control', rows: '8', 'aria-describedby': idAyuda + ' ' + idCont + ' ' + idErr });
    const contador = h('p', { class: 'campo-ayuda num', id: idCont, text: T.avisos.contador(0, max) });
    const err = h('p', { class: 'campo-error', id: idErr, role: 'alert' });
    area.addEventListener('input', () => { contador.textContent = T.avisos.contador(area.value.length, max); });
    const bGuardar = h('button', { class: 'btn btn-primario', type: 'button' }, T.avisos.guardarTexto);
    const bCancelar = h('button', { class: 'btn', type: 'button' }, T.comun.cancelar);
    const dlg = Terna.dialogo({ titulo: T.avisos.pegarTitulo, cuerpo: [h('p', { class: 'campo-ayuda', id: idAyuda, text: T.avisos.pegarAyuda }), area, contador, err], botones: [bCancelar, bGuardar] });
    area.setAttribute('aria-labelledby', dlg.getAttribute('aria-labelledby'));
    bCancelar.addEventListener('click', () => dlg.close());
    bGuardar.addEventListener('click', async () => {
      const texto = area.value.trim();
      let problema = null;
      if (!texto) problema = T.errores.completa;
      else if (texto.length < min) problema = T.errores.textoCorto;
      else if (texto.length > max) problema = T.errores.textoLargo(max);
      if (problema) { err.textContent = problema; area.setAttribute('aria-invalid', 'true'); area.focus(); return; }
      bGuardar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.rpc('pegar_texto_aviso', { p_match_id: a.match_id, p_texto: texto });
      bGuardar.removeAttribute('aria-disabled');
      if (error) { if (!Terna.siSesionVencida(error)) { err.textContent = Terna.textoError(error); area.setAttribute('aria-invalid', 'true'); } return; }
      dlg.close();
      Object.assign(a, { tiene_texto: true, texto_origen: 'usuario', match: null, razones: [], requisitos_faltantes: [] });
      refrescar(a);
      Terna.avisoBreve(T.avisos.textoGuardado);
    });
    dlg.addEventListener('close', () => Terna.devolverFoco(origen));
    dlg.showModal();
    area.focus();
  }

  /* ---------- Filtros (§7.2): hoja en celular, panel en escritorio ---------- */
  function opcion(tipo, nombre, valor, texto, elegido, iconoId) {
    return h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: tipo, name: nombre, value: valor, checked: elegido }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), iconoId ? icono(iconoId) : null, texto));
  }
  function grupo(titulo, opciones) {
    return h('fieldset', { class: 'campo' }, h('legend', { text: titulo }), h('div', { class: 'chips' }, opciones));
  }
  function abrirFiltros(boton) {
    const F = T.avisos.filtros;
    const form = h('form', { class: 'formulario', novalidate: true });
    form.append(
      grupo(F.interes, INTERESES.map((v) => opcion('checkbox', 'interes', v, T.avisos.interes[v], filtros.interes.includes(v)))),
      grupo(F.paquete, PAQUETES.map((v) => opcion('radio', 'paquete', v, v === 'todos' ? F.todos : T.avisos.paquete[v], filtros.paquete === v))),
      grupo(F.postulacion, POSTULACIONES.map((v) => opcion('radio', 'postulacion', v, v === 'todas' ? F.todas : T.avisos.postulacion[v], filtros.postulacion === v))),
      grupo(F.modalidad, MODALIDADES.map((v) => opcion('checkbox', 'modalidad', v, T.avisos.modalidad[v], filtros.modalidad.includes(v), 'i-' + v))),
      grupo(F.alcance, ALCANCES.map((v) => opcion('checkbox', 'alcance', v, T.avisos.alcance[v], filtros.alcance.includes(v), 'i-' + v))));
    const idRango = Terna.idUnico('match');
    const rango = h('input', { type: 'range', id: idRango, name: 'match', min: String(filtros.bajoUmbral ? piso : umbral), max: '100', step: '1', value: String(minimo()) });
    const valor = h('output', { class: 'umbral-valor', for: idRango, text: String(minimo()) });
    const casilla = h('input', { type: 'checkbox', name: 'bajo', checked: filtros.bajoUmbral });
    rango.addEventListener('input', () => { valor.textContent = rango.value; });
    casilla.addEventListener('change', () => {
      if (casilla.checked) { rango.min = String(piso); rango.value = String(piso); }
      else { rango.min = String(umbral); if (Number(rango.value) < umbral) rango.value = String(umbral); }
      valor.textContent = rango.value;
    });
    form.append(h('div', { class: 'campo' },
      h('div', { class: 'interruptor-fila' }, h('label', { class: 'campo-etiqueta', for: idRango, text: F.matchMinimo }), valor),
      rango, h('label', { class: 'casilla' }, casilla, h('span', { text: F.mostrarBajo }))));
    const aplicar = () => {
      const d = new FormData(form);
      filtros = validos({
        interes: d.getAll('interes'), paquete: d.get('paquete'), postulacion: d.get('postulacion'),
        modalidad: d.getAll('modalidad'), alcance: d.getAll('alcance'),
        matchMin: Number(rango.value), bajoUmbral: casilla.checked,
      });
      if (!filtros.bajoUmbral && filtros.matchMin === umbral) filtros.matchMin = null;
      guardarFiltros();
      Terna.cerrarHoja(true);
      dibujar();
    };
    const limpiar = () => { filtros = inicial(); guardarFiltros(); Terna.cerrarHoja(true); dibujar(); };
    form.addEventListener('submit', (e) => { e.preventDefault(); aplicar(); });
    Terna.abrirHoja({ titulo: T.avisos.filtrar, cuerpo: form, panel: boton, origen: boton,
      acciones: h('div', { class: 'botones' },
        h('button', { class: 'btn btn-primario', type: 'button', onclick: aplicar }, F.aplicar),
        h('button', { class: 'btn', type: 'button', onclick: limpiar }, F.limpiar)) });
  }

  /* ---------- Ficha del aviso (§7.5) ---------- */
  function cabeceraFicha(a, idTitulo) {
    return h('div', { class: 'ficha-cabecera' },
      h('div', null, h('h2', { class: 'ficha-titulo', id: idTitulo, text: a.puesto }),
        a.empresa ? h('p', { class: 'ficha-empresa', text: a.empresa }) : null, Aviso.atributos(a, { fuente: true, tag: 'p' })),
      Aviso.bloqueMatch(a, umbral, true));
  }
  function seccionPaquete(a) {
    const F = T.avisos.ficha;
    const sec = h('section', { class: 'ficha-seccion' }, h('h3', { text: F.paquete }));
    if (a.paquete_id) { sec.append(Aviso.fichasPaquete(a)); return sec; }
    const e = Aviso.estadoPaquete(a);
    if (e === 'sin_texto') sec.append(h('p', { text: F.sinTexto }), botonPegar(a, 'btn'));
    else if (e === 'por_puntuar') sec.append(h('p', { text: F.porPuntuar }));
    else if (e === 'pedido') sec.append(h('p', { text: F.loArma }));
    else if (e === 'no_se_pudo_armar') sec.append(h('p', { text: F.noSePudo }));
    else if (!prefs.armar_paquetes) sec.append(h('p', { text: F.armarNo }));
    else {
      sec.append(h('p', { text: F.sinDocs }));
      if (puedePedir(a) && Aviso.llega(a, umbral)) sec.append(botonPedir(a));
    }
    return sec;
  }
  function cuerpoFicha(a) {
    const partes = [
      h('div', { class: 'chips' }, Aviso.chipInteres(a, config), Aviso.chipPaquete(a), Aviso.chipFaltan(a), Aviso.fecha(a)),
      Aviso.etiquetas(a, bajoMinimo(a), true),
    ];
    if (a.match !== null && a.tiene_texto) {
      partes.push(Aviso.llega(a, umbral) ? Aviso.controlInteres(a, 'if-' + a.match_id, (v) => cambiarInteres(a, v)) : accionesBajo(a, false));
    }
    partes.push(...Aviso.razones(a, false), seccionPaquete(a), Aviso.seccionPostulacion(a, config));
    return partes;
  }
  function accionesFicha(a) {
    const b = h('div', { class: 'botones' }, Aviso.abrirAviso(a));
    if (a.interes === 'me_interesa') {
      b.append(h('button', { class: 'btn btn-texto', type: 'button', onclick: () => cambiarInteres(a, 'no_me_interesa') }, T.avisos.interes.no_me_interesa));
    }
    return b;
  }
  function marcarElegida() {
    const abierta = Terna.hojaAbierta();
    for (const tr of lista.querySelectorAll('tr.elegida')) tr.classList.remove('elegida');
    if (abierta && abierta.clave) {
      const tr = lista.querySelector('tr[data-match="' + abierta.clave + '"]');
      if (tr) tr.classList.add('elegida');
    }
  }
  function abrirFicha(a, origen, desdeHash) {
    // Una sola entrada de historial por ficha: si ya hay una abierta, se reemplaza (así "atrás" o cerrar no reabre la anterior).
    if (!desdeHash && location.hash !== '#aviso-' + a.match_id) {
      if (history.state && history.state.ficha && /^#aviso-/.test(location.hash)) history.replaceState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
      else history.pushState({ ficha: a.match_id }, '', '#aviso-' + a.match_id);
    }
    const idTitulo = Terna.idUnico('ficha');
    Terna.abrirHoja({ cabecera: cabeceraFicha(a, idTitulo), idTitulo, cuerpo: cuerpoFicha(a), acciones: accionesFicha(a), enLinea: true,
      origen: origen || nodoDe(a), clave: a.match_id,
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

  dibujar();
  sincronizarHash();
});
