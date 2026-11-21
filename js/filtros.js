/* Terna · js/filtros.js
   Los filtros por columna de Avisos y Postulaciones (diseno.md 0.21 §10.18; brand.md 0.8 §6.4 y §6.5): Francisco hizo clic
   en el encabezado "Requisitos" para filtrar y no pasó nada (06/11/2026). Cada encabezado de la tabla es un botón que abre su
   filtro con el panel de siempre (Terna.abrirHoja), y los mismos filtros van en la barra.
   Tres tipos, además de los que ya tenía la barra:
     · texto: "contiene", sin importar mayúsculas ni tildes; con varias palabras, todas (Puesto, Empresa, Etapa);
     · valores: casillas con lo que hay y cuántos, y "Todos" primero (Paquete, Postulación, Requisitos, Recorrido, Ubicación);
     · fecha: Desde, Hasta o El día (Publicado, Fecha).
   Cada cuerpo llama a alCambiar con el valor nuevo en el acto, como la barra: la lista se actualiza detrás.
   Desde el rediseño B2 (opciones-v3/PLAN-WEB.md §2.8), «Más filtros»: desde 768 px la barra muestra los cambiados y los primeros
   hasta completar cuatro, y el resto se abre con un botón al final (Filtros.masFiltros). */
'use strict';

window.Filtros = (function () {
  const { h, icono, oculto } = Terna;
  const F = () => T.avisos.filtros;

  /* ---------- Valores ---------- */
  // Para comparar: minúsculas, sin tildes y con espacios simples.
  function normal(x) {
    return String(x === null || x === undefined ? '' : x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }
  // ¿El texto tiene todas las palabras de la búsqueda? Una búsqueda vacía deja pasar todo.
  function contiene(texto, busqueda) {
    const palabras = normal(busqueda).split(' ').filter(Boolean);
    if (!palabras.length) return true;
    const t = normal(texto);
    return palabras.every((p) => t.includes(p));
  }
  const textoValido = (x) => (typeof x === 'string' ? x.slice(0, 80) : '');
  const hayTexto = (x) => normal(x) !== '';
  // Una lista de valores elegidos: null es "todos". Con `todos`, solo los que existen; sin él (Ubicación), cualquier texto.
  function listaValida(v, todos) {
    if (!Array.isArray(v)) return null;
    const l = todos ? todos.filter((x) => v.includes(x)) : v.filter((x) => typeof x === 'string' && x).slice(0, 60);
    return l.length && !(todos && l.length === todos.length) ? l : null;
  }
  // Una fecha: { op: 'desde' | 'hasta' | 'el', fecha: 'AAAA-MM-DD' } o null.
  const OPS = ['desde', 'hasta', 'el'];
  function fechaValida(f) {
    return f && typeof f === 'object' && OPS.includes(f.op) && /^\d{4}-\d{2}-\d{2}$/.test(String(f.fecha)) ? { op: f.op, fecha: f.fecha } : null;
  }
  // Con fecha local de Buenos Aires (Terna.aFechaLocal); sin fecha, no pasa un filtro de fecha.
  function pasaFecha(x, f) {
    if (!f) return true;
    if (!x) return false;
    const d = Terna.aFechaLocal(x);
    return f.op === 'desde' ? d >= f.fecha : f.op === 'hasta' ? d <= f.fecha : d === f.fecha;
  }

  /* ---------- Lo que dice el botón de la barra ---------- */
  // "Remoto", "Remoto y Híbrido", "sin Pasantía", "3 de 6"; con todo, el texto de "todos" de ese filtro.
  function resumenLista(l, todos, nombre, todosTexto) {
    if (!l || l.length === todos.length) return todosTexto;
    if (l.length === 1) return nombre(l[0]);
    if (l.length === 2) return F().yY(nombre(l[0]), nombre(l[1]));
    if (todos.length > 3 && l.length === todos.length - 1) return F().sin(nombre(todos.find((x) => !l.includes(x))));
    return F().nDe(l.length, todos.length);
  }
  const resumenTexto = (x, todosTexto) => (hayTexto(x) ? F().texto.valor(x.trim()) : todosTexto);
  const resumenFecha = (f, todosTexto) => (f ? F().fecha.resumen[f.op](Terna.fechaCorta(f.fecha)) : todosTexto);

  /* ---------- Cuerpos (dentro de la hoja o del panel) ---------- */
  // Texto: el campo, que filtra mientras se escribe (con una pausa corta); Enter y Esc cierran el panel con lo escrito. En un
  // campo de búsqueda Esc borraba el texto (y el filtro) y dejaba el panel abierto (06/11/2026, en el banco de pruebas).
  function cuerpoTexto({ valor, alCambiar }) {
    const T2 = F().texto;
    const id = Terna.idUnico('texto');
    const idAyuda = Terna.idUnico('ayuda');
    const campo = h('input', { type: 'search', class: 'control', id, value: valor || '', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': idAyuda, dataset: { foco: 'filtro' } });
    let espera = null;
    campo.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => alCambiar(textoValido(campo.value)), 150); });
    campo.addEventListener('keydown', (e) => {
      if (e.isComposing || (e.key !== 'Enter' && e.key !== 'Escape')) return;
      e.preventDefault();
      clearTimeout(espera);
      alCambiar(textoValido(campo.value));
      Terna.cerrarHoja(true);
    });
    return h('div', { class: 'formulario filtro-cuerpo' },
      h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: id, text: T2.etiqueta }), campo,
        h('p', { class: 'campo-ayuda', id: idAyuda, text: T2.ayuda })));
  }

  // Valores: "Todos" y una casilla por valor, con cuántos hay (`n`). Ninguno elegido es "Todos"; elegir uno lo deja solo a él;
  // elegirlos todos vuelve a "Todos". Con muchos valores (Ubicación), un buscador arriba que achica la lista.
  function cuerpoValores({ nombre, opciones, elegidos, todosTexto, alCambiar, buscador }) {
    const V = F().valores;
    let actual = elegidos ? elegidos.slice() : null;
    const nombreGrupo = Terna.idUnico('valores');
    const casilla = (valor, texto, n) => h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: 'checkbox', name: nombreGrupo, value: valor }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), h('span', { text: texto }),
        n === null || n === undefined ? null : h('span', { class: 'chip-opcion-cuenta num', text: V.cantidad(n) })));
    const todos = casilla('', todosTexto, null);
    todos.classList.add('chip-todos');
    const items = opciones.map((o) => casilla(o.valor, o.texto, o.n));
    const grupo = h('div', { class: 'chips' }, todos, items);
    const pintar = () => {
      todos.querySelector('input').checked = !actual;
      items.forEach((it, i) => { it.querySelector('input').checked = !!actual && actual.includes(opciones[i].valor); });
    };
    pintar();
    grupo.addEventListener('change', (e) => {
      const v = e.target.value;
      if (v === '') actual = null;
      else {
        const l = actual ? actual.slice() : [];
        const i = l.indexOf(v);
        if (i >= 0) l.splice(i, 1); else l.push(v);
        actual = l.length && l.length < opciones.length ? opciones.map((o) => o.valor).filter((x) => l.includes(x)) : null;
      }
      pintar();
      alCambiar(actual);
    });
    const partes = [];
    if (buscador && opciones.length > 8) {
      const id = Terna.idUnico('buscar');
      const nada = h('p', { class: 'campo-ayuda', hidden: true, text: V.ninguno });
      const campo = h('input', { type: 'search', class: 'control', id, autocomplete: 'off', spellcheck: 'false' });
      // Esc cierra el panel, como en el resto (en un campo de búsqueda borraba lo escrito y el panel seguía abierto).
      campo.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.isComposing) { e.preventDefault(); Terna.cerrarHoja(true); } });
      campo.addEventListener('input', () => {
        let visibles = 0;
        items.forEach((it, i) => { const ve = contiene(opciones[i].texto, campo.value); it.hidden = !ve; if (ve) visibles += 1; });
        nada.hidden = visibles > 0;
      });
      partes.push(h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: id, text: V.buscar }), campo), nada);
    }
    partes.push(h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: nombre }), grupo));
    return h('div', { class: 'formulario filtro-cuerpo' }, partes);
  }

  // Fecha: Desde, Hasta o El día, y la fecha. Se aplica al cambiar cualquiera de los dos; sin fecha no filtra.
  function cuerpoFecha({ valor, alCambiar }) {
    const FF = F().fecha;
    let op = valor ? valor.op : 'desde';
    const nombreOps = Terna.idUnico('op');
    const ops = h('div', { class: 'chips' }, OPS.map((o) => h('label', { class: 'chip-opcion chip-opcion-form' },
      h('input', { type: 'radio', name: nombreOps, value: o, checked: op === o }),
      h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), FF.op[o]))));
    const id = Terna.idUnico('fecha');
    const idAyuda = Terna.idUnico('ayuda');
    const campo = h('input', { type: 'date', class: 'control control-fecha', id, value: valor ? valor.fecha : '', 'aria-describedby': idAyuda });
    const borrar = h('button', { class: 'btn btn-texto btn-chico', type: 'button', hidden: !valor }, icono('i-deshacer', 'icono-16'), FF.borrar);
    const aplicar = () => {
      const f = fechaValida({ op, fecha: campo.value });
      borrar.hidden = !f;
      alCambiar(f);
    };
    ops.addEventListener('change', (e) => { op = e.target.value; aplicar(); });
    campo.addEventListener('change', aplicar);
    borrar.addEventListener('click', () => { campo.value = ''; aplicar(); campo.focus(); });
    return h('div', { class: 'formulario filtro-cuerpo' },
      h('fieldset', { class: 'campo' }, h('legend', { class: 'oculto-visual', text: FF.comparar }), ops),
      h('div', { class: 'campo' }, h('label', { class: 'campo-etiqueta', for: id, text: FF.etiqueta }), campo,
        h('p', { class: 'campo-ayuda', id: idAyuda, text: FF.ayuda })),
      h('div', null, borrar));
  }

  // El orden, arriba del filtro de Match y de Publicado en Avisos: un botón que ordena por esa columna (aria-pressed).
  function botonOrden(texto, activo, alOrdenar) {
    return h('div', { class: 'filtro-orden' },
      h('button', { class: 'btn btn-fila', type: 'button', 'aria-pressed': activo ? 'true' : 'false', onclick: (e) => { alOrdenar(); e.currentTarget.setAttribute('aria-pressed', 'true'); } },
        icono(activo ? 'i-tilde' : 'i-ordenar', 'icono-16'), texto));
  }

  /* ---------- El encabezado de una columna ---------- */
  // Un botón con el nombre y la flecha; con un filtro puesto, como un botón cambiado de la barra (fondo, punto y ", filtrado").
  // `titulo` es lo que diría su botón de la barra ("Modalidad: Remoto"): desde diseno.md 0.22 el filtro está en un solo lugar,
  // y el encabezado lo muestra al pasar el mouse.
  function encabezado({ texto, clave, clase, activo, abierto, sort, titulo, alAbrir }) {
    const b = h('button', { type: 'button', class: 'th-filtro' + (activo ? ' cambiado' : ''), 'aria-haspopup': 'dialog', 'aria-expanded': abierto ? 'true' : 'false', title: titulo || null, dataset: { filtro: clave } },
      h('span', { text: texto }), activo ? oculto(F().filtradoAccesible) : null, icono('i-chevron', 'icono-14'));
    b.addEventListener('click', () => alAbrir(b));
    return h('th', { scope: 'col', class: clase || null, 'aria-sort': sort || null }, b);
  }

  /* ---------- Cada filtro en un solo lugar (diseno.md 0.22 §10.18) ----------
     Francisco, 06/11/2026: "quiero que solo estén los filtros en la tabla. si no existe filtro en la tabla, dejalo arriba… no
     quiero duplicados". Si la tabla muestra el encabezado de su columna, el filtro está ahí y su botón de la barra se oculta
     (`.en-tabla`); si no (no tiene columna, la tabla la oculta por ancho, por ejemplo con el cajón abierto, o no hay tabla, como en
     el celular), va en la barra. `ubicar` devuelve la función que lo decide: la página la llama cada vez que dibuja la lista, y un
     ResizeObserver de la lista, cada vez que la tabla cambia de ancho. */
  const seVe = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
  function ubicar({ botones, lista }) {
    const actualizar = () => {
      for (const [k, b] of Object.entries(botones)) b.classList.toggle('en-tabla', seVe(lista.querySelector('th [data-filtro="' + k + '"]')));
      // Lo que pasó al encabezado no cuenta para «Más filtros»: la barra se vuelve a repartir.
      const mas = MAS_POR_BOTONES.get(botones);
      if (mas) repartir(mas);
    };
    if ('ResizeObserver' in window) new ResizeObserver(actualizar).observe(lista);
    return actualizar;
  }
  // El primer filtro a la vista, para dejar el foco después de "Volver a mis preferencias" o "Limpiar filtros": el primero de la
  // barra que se ve o, si no hay ninguno, el primer encabezado de la tabla.
  function primero({ botones, claves, lista }) {
    return claves.map((k) => botones[k]).find(seVe) || lista.querySelector('th [data-filtro]') || botones[claves[0]];
  }

  // Abre un filtro en la hoja (celular) o en el panel debajo de su botón (escritorio). `destino()` dice adónde vuelve el foco al
  // cerrar: el botón puede haberse rehecho (la tabla se redibuja con cada cambio) o haberse ocultado (el filtro cambia de lugar
  // cuando la tabla muestra u oculta su columna).
  function abrir({ clave, titulo, cuerpo, boton, destino, alCerrar }) {
    // Un filtro escondido detrás de «Más filtros» que se abre desde otro lado (un vacío): la barra se abre sola.
    if (boton && boton.dataset.masOculto === '1') abrirMas(boton.closest('.filtros-barra'));
    // Un filtro que se abre desde la hoja del botón único (celular): al cerrarlo, se vuelve a esa hoja, con el foco en el filtro.
    const unico = unicoDe(boton);
    const origen = unico ? () => { unico.abrir(); return destino ? destino() : boton; } : (destino || boton);
    boton.setAttribute('aria-expanded', 'true');
    Terna.abrirHoja({ titulo, cuerpo, panel: boton, origen,
      alCerrar: (porUsuario) => {
        for (const b of document.querySelectorAll('[aria-expanded="true"][data-filtro="' + clave + '"]')) b.setAttribute('aria-expanded', 'false');
        if (alCerrar) alCerrar(porUsuario);
      },
      acciones: h('div', { class: 'botones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => Terna.cerrarHoja(true) }, F().listo)) });
    // Un filtro que se escribe arranca con el foco en su campo.
    const campo = document.querySelector('dialog.hoja[open] [data-foco="filtro"]');
    if (campo) campo.focus();
  }

  /* ---------- «Más filtros» (PLAN-WEB.md §2.8) ----------
     Desde 768 px quedan a la vista los filtros cambiados y, después, los primeros de la barra hasta completar `aLaVista` (4); el
     resto lleva `hidden` hasta que se abre con el botón del final de la barra, que dice cuántos hay (si el resto es uno solo, queda
     a la vista y el botón no aparece). Lo que Filtros.ubicar mandó al
     encabezado de su columna no cuenta. En el celular van todos, en la fila que se desplaza, y el botón no aparece. Abierto o
     cerrado no se guarda. La página la llama al armar la barra y cada vez que la actualiza; el DOM de la barra no cambia. */
  const MAS_POR_BARRA = new WeakMap();
  const MAS_POR_BOTONES = new WeakMap();
  const MAS_TODAS = new Set();
  function cambiadoDe(m, k) {
    const c = m.cambiado;
    if (typeof c === 'function') return !!c(k);
    if (c && typeof c.has === 'function') return c.has(k);
    return Array.isArray(c) && c.includes(k);
  }
  function repartir(m) {
    if (!m.botones) return;
    const lista = (m.claves || []).map((k) => [k, m.botones[k]]).filter(([, b]) => b);
    const enfocado = document.activeElement;
    for (const [, b] of lista) if (b.dataset.masOculto === '1') { b.hidden = false; delete b.dataset.masOculto; }
    if (!Terna.anchoEscritorio.matches) { m.boton.hidden = true; m.boton.setAttribute('aria-expanded', 'false'); return; }
    const candidatos = lista.filter(([, b]) => !b.classList.contains('en-tabla'));
    const vista = new Set(candidatos.filter(([k]) => cambiadoDe(m, k)).map(([k]) => k));
    for (const [k] of candidatos) { if (vista.size >= m.aLaVista) break; vista.add(k); }
    let extra = candidatos.filter(([k]) => !vista.has(k));
    // «Más filtros» para esconder uno solo no ahorra lugar: ese filtro queda a la vista y el botón no aparece.
    if (extra.length === 1) extra = [];
    if (!m.abierto) for (const [, b] of extra) { b.hidden = true; b.dataset.masOculto = '1'; }
    m.boton.hidden = !extra.length;
    m.boton.setAttribute('aria-expanded', String(m.abierto && extra.length > 0));
    m.num.textContent = String(extra.length);
    m.cuenta.textContent = extra.length ? ': ' + F().masFiltrosCuenta(extra.length) : '';
    // Si el foco estaba en un filtro que se escondió, pasa al botón.
    if (enfocado && enfocado.dataset && enfocado.dataset.masOculto === '1' && !m.boton.hidden) m.boton.focus();
  }
  function abrirMas(barra) {
    const m = barra && MAS_POR_BARRA.get(barra);
    if (m && !m.abierto) { m.abierto = true; repartir(m); }
  }
  // { barra, botones, claves, cambiado, aLaVista }: `cambiado` es una función (clave → bool), un Set o una lista de claves.
  // La primera vez agrega button.filtro-boton.mas-filtros al final de la barra; las siguientes vuelven a repartir con lo de ahora.
  function masFiltros({ barra, botones, claves, cambiado, aLaVista }) {
    let m = MAS_POR_BARRA.get(barra);
    if (!m) {
      if (!barra.id) barra.id = Terna.idUnico('filtros');
      const num = h('span', { class: 'num', 'aria-hidden': 'true' });
      const cuenta = h('span', { class: 'oculto-visual' });
      const boton = h('button', { class: 'filtro-boton mas-filtros', type: 'button', 'aria-expanded': 'false', 'aria-controls': barra.id, hidden: true },
        h('span', { class: 'mas-filtros-texto', text: F().masFiltros }), num, cuenta, icono('i-chevron', 'icono-16'));
      m = { barra, boton, num, cuenta, abierto: false };
      boton.addEventListener('click', () => { m.abierto = !m.abierto; repartir(m); });
      barra.append(boton);
      MAS_POR_BARRA.set(barra, m);
      MAS_TODAS.add(m);
    }
    Object.assign(m, { botones, claves, cambiado, aLaVista: aLaVista || 4 });
    MAS_POR_BOTONES.set(botones, m);
    repartir(m);
    return { boton: m.boton, abrir: () => abrirMas(barra), repartir: () => repartir(m) };
  }
  Terna.anchoEscritorio.addEventListener('change', () => { for (const m of MAS_TODAS) repartir(m); });

  /* ---------- El botón único de filtros del celular (PLAN-UX §3.2 a §3.4 y §8, P0.4) ----------
     Hasta 47,99rem la fila de quince filtros que se desplazaba de costado se va: queda un solo botón «Filtrar», con la cuenta de los
     filtros puestos, que abre una hoja con todo lo que la página le pasa (la barra, el estado de los filtros, el orden). Los nodos se
     mudan a la hoja mientras está abierta y vuelven a su lugar al cerrarla, así cada filtro sigue siendo el mismo botón, con su
     estado y sus eventos (y con Filtros.masFiltros y Filtros.ubicar como siempre). Un filtro que se abre desde esa hoja abre su
     propia hoja encima (Filtros.abrir) y, al cerrarse, vuelve a la de los filtros con el foco en él. Desde 48rem el botón no se ve,
     la hoja se cierra sola y los nodos se quedan donde estaban: la barra de escritorio no cambia. */
  const UNICOS = new Set();
  function unicoDe(boton) {
    for (const u of UNICOS) if (u.abierta && u.cuerpo.contains(boton)) return u;
    return null;
  }
  // botonUnico({ caja, nodos, cuenta }) → { boton, cuenta(n), abrir(), cerrar() }. `caja`: dónde va el botón (al principio); `nodos`:
  // lo que va en la hoja, en orden (la .filtros-caja, el .filtros-estado, el #herramientas con el orden…), que en el celular deja de
  // verse en la página (clase filtros-movil); `cuenta`: cuántos filtros hay puestos (0: sin número). cuenta(n) la cambia.
  function botonUnico({ caja, nodos, cuenta }) {
    const num = h('span', { class: 'num', 'aria-hidden': 'true', hidden: true });
    const boton = h('button', { class: 'filtro-boton filtros-unico', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
      icono('i-filtrar', 'icono-16'), h('span', { class: 'filtro-valor', text: T.avisos.filtrar }), num);
    const cuerpo = h('div', { class: 'filtros-hoja' });
    const lista = (nodos || []).filter(Boolean);
    for (const n of lista) n.classList.add('filtros-movil');
    const lugares = new Map();
    const u = { cuerpo, abierta: false };
    function pintar(n) {
      const x = Number(n) || 0;
      num.textContent = x ? String(x) : '';
      num.hidden = !x;
      if (x) boton.setAttribute('aria-label', T.avisos.filtrarCon(x)); else boton.removeAttribute('aria-label');
    }
    function devolver() {
      for (const n of lista) {
        const marca = lugares.get(n);
        if (marca && marca.parentNode) { marca.parentNode.replaceChild(n, marca); }
      }
      lugares.clear();
    }
    u.abrir = function () {
      if (u.abierta) return;
      for (const n of lista) {
        if (!n.parentNode) continue;
        const marca = document.createComment('filtros');
        n.parentNode.replaceChild(marca, n);
        lugares.set(n, marca);
        cuerpo.append(n);
      }
      u.abierta = true;
      boton.setAttribute('aria-expanded', 'true');
      Terna.abrirHoja({ titulo: F().barra, cuerpo, origen: boton,
        alCerrar: () => { u.abierta = false; boton.setAttribute('aria-expanded', 'false'); devolver(); },
        acciones: h('div', { class: 'botones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => Terna.cerrarHoja(true) }, F().listo)) });
    };
    u.cerrar = () => { if (u.abierta) Terna.cerrarHoja(true); };
    boton.addEventListener('click', () => u.abrir());
    if (caja) caja.prepend(boton);
    pintar(cuenta);
    UNICOS.add(u);
    return { boton, cuenta: pintar, abrir: u.abrir, cerrar: u.cerrar };
  }
  // Al pasar a 48rem con la hoja abierta, se cierra: lo de adentro vuelve a la página, donde ya se ve.
  Terna.anchoEscritorio.addEventListener('change', () => {
    if (!Terna.anchoEscritorio.matches) return;
    for (const u of UNICOS) if (u.abierta) Terna.cerrarHoja(false);
  });

  return {
    normal, contiene, textoValido, hayTexto, listaValida, fechaValida, pasaFecha,
    resumenLista, resumenTexto, resumenFecha,
    cuerpoTexto, cuerpoValores, cuerpoFecha, botonOrden, encabezado, abrir, ubicar, primero, seVe, masFiltros, botonUnico,
  };
})();
