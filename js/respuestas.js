/* Terna · js/respuestas.js
   Respuestas para formularios (diseno.md 0.19 §9.2; brand.md 0.7 §6.6; datos.md §5.6): autorización para trabajar,
   nacionalidad, disponibilidad, mudanza y consentimientos. Son columnas de `preferencias` que el motor lee cuando llena un
   formulario (pipeline.md §4.12). Desde 0.19 son un subtema de Mi perfil › Datos y se guardan con su "Guardar" (perfil.js);
   hasta 0.18 eran un bloque de Preferencias.
   Las opciones se guardan en los textos que el motor ya lee: "Argentina: sí. Italia: sí. Otros países: solo remoto, sin visa."
   e "inmediata" o "30 días". Lo que no entra en esas opciones va con tus palabras, y un texto guardado que no es exactamente
   el de unas opciones se muestra tal cual: la página nunca reescribe lo que la persona escribió. */
'use strict';

window.Respuestas = (function () {
  const MAX_DIAS = 365;

  // fila: las cinco columnas de preferencias. piezas: Terna.piezas de Mi perfil (títulos h4, dentro del subtema).
  // alMarcar(el): un error se escribió o se borró en `el` (perfil.js abre su bloque y marca el carril).
  function montar({ fila, piezas, alMarcar }) {
    const { h, icono } = Terna;
    const R = T.respuestas;
    const F = R.formato;
    const { id, item, radios, grupoRadios, pregunta, conInterruptor } = piezas;
    const PAISES = Object.keys(R.paises);
    const v = { mudanza: !!fila.mudanza, nacionalidad: fila.nacionalidad || '', consentimientos: fila.aceptar_consentimientos !== false };

    /* Autorización para trabajar: dos preguntas y los países donde ya puede trabajar sin visa, o con sus palabras. */
    const aut = { argentina: true, otros: 'remoto', paises: [], propias: false, texto: '' };
    const armarAut = () => [F.pais(R.argentina, aut.argentina)]
      .concat(PAISES.filter((c) => aut.paises.includes(c)).map((c) => F.pais(R.paises[c], true)), aut.otros === 'visa' ? F.visa : F.remoto).join(' ');
    // Al entrar: si el texto guardado es exactamente el que armarían unas opciones, se muestran esas opciones;
    // si es otro (o está vacío, que es "no respondas esa pregunta"), queda con tus palabras, tal cual.
    (function leerAut(t) {
      aut.argentina = !t.startsWith(F.pais(R.argentina, false));
      aut.otros = t.endsWith(F.visa) ? 'visa' : 'remoto';
      aut.paises = PAISES.filter((c) => t.includes(F.pais(R.paises[c], true)));
      if (!t || armarAut() !== t) { aut.propias = true; aut.texto = t; }
    }(String(fila.autorizacion_trabajo || '').trim()));

    const vistaAut = h('p', { class: 'campo-ayuda', 'aria-live': 'polite' });
    const chipsPaises = h('div', { class: 'chips' }, PAISES.map((c) => {
      const input = h('input', { type: 'checkbox', value: c, checked: aut.paises.includes(c) });
      input.addEventListener('change', () => { aut.paises = PAISES.filter((y) => (y === c ? input.checked : aut.paises.includes(y))); verAut(); });
      return h('label', { class: 'chip-opcion chip-opcion-form' }, input, h('span', { class: 'chip-opcion-cara' }, h('span', { class: 'marca' }, icono('i-tilde')), R.paises[c]));
    }));
    const idAyudaPaises = id('ayuda');
    const qPaises = pregunta(R.autPaises, chipsPaises, h('p', { class: 'campo-ayuda', id: idAyudaPaises, text: R.autPaisesAyuda }));
    qPaises.setAttribute('aria-describedby', idAyudaPaises);
    const opcionesAut = h('div', { class: 'seccion' },
      pregunta(R.autArgentina, radios('aut-argentina', [[true, T.comun.si], [false, T.comun.no]], aut.argentina, (x) => { aut.argentina = x; verAut(); })),
      pregunta(R.autOtros, radios('aut-otros', [['remoto', R.autRemoto, R.autRemotoAyuda], ['visa', R.autVisa]], aut.otros, (x) => { aut.otros = x; verAut(); })),
      qPaises, vistaAut);
    const idTexto = id('aut-texto');
    const textoAut = h('textarea', { class: 'control', id: idTexto, rows: '3', maxlength: '300', 'aria-describedby': idTexto + '-ayuda' });
    textoAut.value = aut.texto;
    textoAut.addEventListener('input', () => { aut.texto = textoAut.value; });
    const campoTexto = h('div', { class: 'campo' }, h('label', { for: idTexto, text: R.autTexto }), textoAut, h('p', { class: 'campo-ayuda', id: idTexto + '-ayuda', text: R.autTextoAyuda }));
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
      vistaAut.textContent = R.autVista(armarAut());
    }
    verAut();
    const sAut = item(R.autorizacion, opcionesAut, h('label', { class: 'casilla' }, casPropias, h('span', { text: R.autPropias })), campoTexto);

    /* Nacionalidad (0020): texto corto; el motor la busca entre las opciones del formulario por país o gentilicio. Va al lado de
       la autorización, que es donde la preguntan los formularios. */
    const inNac = h('input', { class: 'control', id: 'resp-nacionalidad', type: 'text', maxlength: '60', autocomplete: 'off',
      value: v.nacionalidad, 'aria-describedby': 'resp-nacionalidad-ayuda' });
    inNac.addEventListener('input', () => { v.nacionalidad = inNac.value; });
    const sNac = h('div', { class: 'subbloque' }, h('label', { for: 'resp-nacionalidad', class: 'tarjeta-titulo', text: R.nacionalidad }), inNac,
      h('p', { class: 'campo-ayuda', id: 'resp-nacionalidad-ayuda', text: R.nacionalidadAyuda }));

    /* Disponibilidad: inmediata (default) o en unos días; un texto viejo que no sea ninguno de los dos pide la cantidad. */
    const disp = (function leerDisp(t) {
      if (!t || t === F.inmediata) return { modo: 'inmediata', dias: null };
      const m = /^(\d{1,3}) d[ií]as?$/.exec(t);
      return { modo: 'dias', dias: m ? Number(m[1]) : null };
    }(String(fila.disponibilidad || '').trim().toLowerCase()));
    const errDisp = h('p', { class: 'campo-error', id: 'err-disp', role: 'alert' });
    const marcar = (texto) => { errDisp.textContent = texto; alMarcar(errDisp); };
    const limpiar = () => { if (errDisp.textContent) marcar(''); };
    const idDias = id('dias');
    const inDias = h('input', { class: 'control control-corto num', id: idDias, type: 'number', min: '1', max: String(MAX_DIAS), step: '1', inputmode: 'numeric',
      value: disp.dias === null ? '' : String(disp.dias), 'aria-describedby': idDias + '-ayuda err-disp' });
    inDias.addEventListener('input', () => { disp.dias = inDias.value === '' ? null : Number(inDias.value); limpiar(); });
    const campoDias = h('div', { class: 'campo anidado', hidden: disp.modo !== 'dias' },
      h('label', { for: idDias, text: R.dispCantidad }), inDias, h('p', { class: 'campo-ayuda', id: idDias + '-ayuda', text: R.dispCantidadAyuda }));
    const sDisp = grupoRadios(R.disponibilidad, 'disponibilidad', [['inmediata', R.dispInmediata], ['dias', R.dispDias]], disp.modo,
      (x) => { disp.modo = x; campoDias.hidden = x !== 'dias'; limpiar(); });
    sDisp.append(campoDias, errDisp);

    const sMud = conInterruptor(R.mudanza, R.mudanzaAyuda, v.mudanza, (x) => { v.mudanza = x; });
    // 0021: las casillas de consentimiento obligatorias (Sí por defecto, como hacía el motor desde pipeline.md 0.3.8).
    const sCons = conInterruptor(R.consentimientos, R.consentimientosAyuda, v.consentimientos, (x) => { v.consentimientos = x; });

    // Lo que se guarda: los mismos textos y valores que escribía Preferencias hasta 0.18.
    function columnas() {
      return {
        autorizacion_trabajo: aut.propias ? (aut.texto.trim() || null) : armarAut(),
        disponibilidad: disp.modo === 'dias' ? F.dias(disp.dias) : F.inmediata,
        mudanza: !!v.mudanza,
        nacionalidad: (String(v.nacionalidad || '').trim().slice(0, 60)) || null,
        aceptar_consentimientos: v.consentimientos !== false,
      };
    }
    function validar() {
      if (disp.modo === 'dias' && !(Number.isInteger(disp.dias) && disp.dias >= 1 && disp.dias <= MAX_DIAS)) { marcar(T.errores.dias(1, MAX_DIAS)); return false; }
      limpiar();
      return true;
    }
    return { nodos: [sAut, sNac, sDisp, sMud, sCons], columnas, validar };
  }

  return { montar };
}());
