/* Terna · js/filtros.js
   Los filtros por columna de Avisos y Postulaciones (diseno.md 0.21 §10.18; brand.md 0.8 §6.4 y §6.5): Francisco hizo clic
   en el encabezado "Requisitos" para filtrar y no pasó nada (06/11/2026). Cada encabezado de la tabla es un botón que abre su
   filtro con el panel de siempre (Terna.abrirHoja), y los mismos filtros van en la barra.
   Tres tipos, además de los que ya tenía la barra:
     · texto: "contiene", sin importar mayúsculas ni tildes; con varias palabras, todas (Puesto, Empresa, Etapa);
     · valores: casillas con lo que hay y cuántos, y "Todos" primero (Paquete, Postulación, Requisitos, Recorrido, Ubicación);
     · fecha: Desde, Hasta o El día (Publicado, Fecha).
   Cada cuerpo llama a alCambiar con el valor nuevo en el acto, como la barra: la lista se actualiza detrás. */
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
    boton.setAttribute('aria-expanded', 'true');
    Terna.abrirHoja({ titulo, cuerpo, panel: boton, origen: destino || boton,
      alCerrar: (porUsuario) => {
        for (const b of document.querySelectorAll('[aria-expanded="true"][data-filtro="' + clave + '"]')) b.setAttribute('aria-expanded', 'false');
        if (alCerrar) alCerrar(porUsuario);
      },
      acciones: h('div', { class: 'botones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => Terna.cerrarHoja(true) }, F().listo)) });
    // Un filtro que se escribe arranca con el foco en su campo.
    const campo = document.querySelector('dialog.hoja[open] [data-foco="filtro"]');
    if (campo) campo.focus();
  }

  return {
    normal, contiene, textoValido, hayTexto, listaValida, fechaValida, pasaFecha,
    resumenLista, resumenTexto, resumenFecha,
    cuerpoTexto, cuerpoValores, cuerpoFecha, botonOrden, encabezado, abrir, ubicar, primero, seVe,
  };
})();
