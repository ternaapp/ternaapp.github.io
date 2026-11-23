/* Terna · js/formularios.js
   Datos para formularios (PLAN-PREFERENCIAS D5, 23/11/2026; diseno.md §9.3; brand.md §6.7; datos.md §5.3, §5.4, §5.4b y §17.21):
   lo que Terna escribe o adjunta cuando un formulario lo pide y nunca va en el CV. Hasta PLAN-PREFERENCIAS vivía en Mi perfil
   (Datos › Identificación, la dirección debajo de ella, Portfolio y GitHub en Contacto, CV › Analítico); se mudó tal cual a
   Preferencias › Postulaciones, con los mismos ids, las mismas funciones de la base, la misma ruta en Storage y los mismos cuidados:
   - DNI, CUIL y fecha de nacimiento (datos_formularios) y la dirección (direcciones; solo para quien ve lo de las cuentas,
     Cuentas.abiertas) están cifrados y se leen solo por sus funciones. Se descifran recién cuando el ítem está por verse (a 200 px
     de la pantalla, con su bloque abierto o elegido), una sola vez por visita; sin IntersectionObserver, al abrir el bloque
     (alAbrir). Viven en sus campos y en el estado de este módulo: nunca en una variable global.
   - Portfolio y GitHub (perfiles.portfolio y, con la 0049, perfiles.github): el https:// se agrega si falta.
   - El analítico ({uid}/analitico.pdf en el bucket de documentos, 0021) se sube, se reemplaza y se quita en el acto, como el CV en
     Mi perfil. Debajo, de solo lectura, el promedio de cada carrera, que sigue en Mi perfil › Estudios (D7).
   Mismo patrón que js/respuestas.js y js/cuentas.js: montar() arma los nodos y Preferencias decide dónde van; validar() marca los
   errores del navegador; guardar() escribe solo lo que cambió (portfolio y GitHub, identificación, dirección, en ese orden) y lo
   llama «Guardar preferencias»; error(e) lleva al campo un error de la base. «Borrar dirección» y el analítico escriben en el acto. */
'use strict';

window.DatosFormularios = (function () {
  const NIVELES_CARRERA = ['grado', 'posgrado', 'terciario'];

  /* sb, uid y usuario: los de la sesión. config: cv_max_mb. perfil: la fila de perfiles con portfolio (y github con la 0049), o null
     si no se pudo leer (portfolio y GitHub no se muestran). analitico: lo que devolvió rpc('analitico'), o undefined si no se pudo
     leer (el ítem no se muestra). estudios: las filas (titulo, nivel, promedio) o null. piezas: Terna.piezas de nivel h4 (los ítems
     van dentro de un subtema). alMarcar(el): un error se escribió o se borró en `el` (Preferencias abre su bloque y marca el carril).
     alGuardar(): algo se escribió en el acto («Borrar dirección»), y Preferencias vuelve a mirar si quedan cambios sin guardar. */
  function montar({ sb, uid, usuario, config, perfil, analitico: analiticoLeido, estudios, piezas, alMarcar, alGuardar }) {
    const { h, icono } = Terna;
    const P = T.perfil;
    const MAX_MB = config.cv_max_mb || 5;
    const RUTA_ANALITICO = uid + '/analitico.pdf';  // 0021
    let analitico = analiticoLeido === undefined ? undefined : ((Array.isArray(analiticoLeido) ? analiticoLeido[0] : analiticoLeido) || null);
    const formularios = { cargado: false, dni: '', cuil: '', fecha: '', original: null };
    // La dirección (0036; brand.md 0.16 §6.6): calle y número, código postal y provincia, cifrados como el DNI. `guardada` dice si la
    // base tiene una, para mostrar "Borrar dirección". A quién se le muestra, en js/cuentas.js.
    const conDireccion = Cuentas.abiertas(usuario);
    const direccion = { cargada: false, calle: '', cp: '', provincia: '', original: null, guardada: false };
    const firmaDireccion = () => JSON.stringify([direccion.calle.trim(), direccion.cp.trim(), direccion.provincia]);
    // Como la guarda la base: la calle con los espacios juntados; el código postal sin espacios ni guiones y en mayúscula.
    const calleLimpia = () => direccion.calle.trim().replace(/\s+/g, ' ');
    const cpLimpio = () => direccion.cp.replace(/[\s-]/g, '').toUpperCase();
    // Portfolio y GitHub (0020, 0049): sin la columna github, el campo no se muestra.
    const conGithub = !!perfil && Object.prototype.hasOwnProperty.call(perfil, 'github');
    const links = perfil ? { portfolio: perfil.portfolio || '' } : null;
    if (links && conGithub) links.github = perfil.github || '';
    let linksOriginal = JSON.stringify(links);

    /* ---------- Piezas (las de js/perfil.js, con los mismos ids) ---------- */
    function campo({ id, etiqueta, valor, ayuda, max, tipo, autocomplete, inputmode, alCambiar, ejemplo }) {
      const idAyuda = ayuda ? id + '-ayuda' : null;
      const idError = id + '-error';
      const control = h('input', { class: 'control', id, type: tipo || 'text', value: valor === null || valor === undefined ? '' : String(valor),
        maxlength: max ? String(max) : null, autocomplete: autocomplete || null, inputmode: inputmode || null, placeholder: ejemplo || null,
        'aria-describedby': [idAyuda, idError].filter(Boolean).join(' ') });
      if (alCambiar) control.addEventListener('input', () => { alCambiar(control.value); limpiarError(id); });
      return h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), control,
        ayuda ? h('p', { class: 'campo-ayuda', id: idAyuda, text: ayuda }) : null, h('p', { class: 'campo-error', id: idError }));
    }
    function seleccion({ id, etiqueta, valor, opciones, alCambiar, vacio }) {
      const sel = h('select', { class: 'control', id, 'aria-describedby': id + '-error' },
        vacio !== undefined ? h('option', { value: '', text: vacio }) : null,
        opciones.map(([v, t]) => h('option', { value: v, text: t, selected: String(valor || '') === String(v) })));
      sel.addEventListener('change', () => { alCambiar(sel.value); limpiarError(id); });
      return h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), sel, h('p', { class: 'campo-error', id: id + '-error' }));
    }
    function boton(texto, iconoId, fn, clase, extra) {
      return h('button', Object.assign({ class: clase || 'btn btn-texto', type: 'button', onclick: fn }, extra || {}), iconoId ? icono(iconoId) : null, texto);
    }
    function marcarError(idC, texto) {
      const err = document.getElementById(idC + '-error');
      if (err) { err.textContent = texto; alMarcar(err); }
      const el = document.getElementById(idC);
      if (el) el.setAttribute('aria-invalid', 'true');
    }
    function limpiarError(idC) {
      const err = document.getElementById(idC + '-error');
      if (err && err.textContent) { err.textContent = ''; alMarcar(err); }
      const el = document.getElementById(idC);
      if (el) el.removeAttribute('aria-invalid');
    }
    function enfocar(idC) { const el = document.getElementById(idC); if (el) el.focus(); }
    // «Borrar dirección» y su ayuda se ven solo si la base tiene una dirección.
    function verBorrar(si) { ['dir-borrar', 'dir-borrar-ayuda'].forEach((x) => { const el = document.getElementById(x); if (el) el.hidden = !si; }); }

    /* ---------- Identificación y dirección: se descifran al acercarse ---------- */
    const camposId = h('div', { class: 'seccion' });
    const itemId = piezas.item(P.identificacion, h('p', { class: 'campo-ayuda', text: P.identificacionAyuda }), camposId);
    // La dirección es su propio ítem (con su ancla, #direccion), debajo de Identificación: el título y la ayuda se ven desde el
    // principio y los campos llegan con el resto. Si no se puede leer (sin 0036), el ítem se va.
    const camposDir = h('div', { class: 'seccion' });
    const itemDir = conDireccion ? piezas.item(P.direccion, h('p', { class: 'campo-ayuda', text: P.direccionAyuda }), camposDir) : null;
    let pidiendo = false;
    async function cargar() {
      if (formularios.cargado || pidiendo) return;
      pidiendo = true;
      const parar = Terna.cargando(camposId);
      const [{ data, error }, rDir] = await Promise.all([
        sb.rpc('leer_datos_formularios'),
        conDireccion ? sb.rpc('leer_direccion') : Promise.resolve(null),
      ]);
      parar();
      pidiendo = false;
      if (error) { Terna.errorDeCarga(camposId, error); return; }
      const fila = (Array.isArray(data) ? data[0] : data) || {};
      Object.assign(formularios, { cargado: true, dni: fila.dni || '', cuil: fila.cuil || '', fecha: fila.fecha_nacimiento || '' });
      formularios.original = JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]);
      Terna.vaciar(camposId);
      camposId.append(
        h('div', { class: 'dos' },
          campo({ id: 'form-dni', etiqueta: P.dni, valor: formularios.dni, max: 10, inputmode: 'numeric', autocomplete: 'off', alCambiar: (x) => { formularios.dni = x; } }),
          campo({ id: 'form-cuil', etiqueta: P.cuil, valor: formularios.cuil, max: 13, inputmode: 'numeric', autocomplete: 'off', alCambiar: (x) => { formularios.cuil = x; } })),
        campo({ id: 'form-fecha', etiqueta: P.nacimiento, valor: formularios.fecha, tipo: 'date', autocomplete: 'bday', alCambiar: (x) => { formularios.fecha = x; } }));
      if (itemDir) {
        if (rDir && !rDir.error) camposDir.append(...camposDireccion((Array.isArray(rDir.data) ? rDir.data[0] : rDir.data) || {}));
        else itemDir.hidden = true;
        // Quien llegó por #direccion la ve después de que Identificación creció arriba.
        if (location.hash === '#direccion' && !itemDir.hidden) itemDir.scrollIntoView({ block: 'start' });
      }
    }
    let alAbrir = null;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((vistos) => { if (vistos.some((x) => x.isIntersecting)) { io.disconnect(); cargar(); } }, { rootMargin: '200px 0px' });
      io.observe(itemId);
    } else alAbrir = cargar;

    /* Dirección (diseno.md 0.29; brand.md 0.16): tres campos que van juntos. Se guarda con «Guardar preferencias», solo si cambió;
       «Borrar dirección» la saca en el acto y aparece solo si hay una guardada. El error de los tres juntos va arriba de los tres;
       los otros, junto a su campo. */
    function camposDireccion(fila) {
      Object.assign(direccion, { cargada: true, calle: fila.calle || '', cp: fila.codigo_postal || '', provincia: fila.provincia || '' });
      direccion.original = firmaDireccion();
      direccion.guardada = !!(direccion.calle || direccion.cp || direccion.provincia);
      const alCambiar = (k) => (x) => { direccion[k] = x; limpiarError('dir'); };
      const bBorrar = boton(P.borrarDireccion, 'i-quitar', async () => {
        if (bBorrar.getAttribute('aria-disabled') === 'true') return;
        bBorrar.setAttribute('aria-disabled', 'true');
        const { error } = await sb.rpc('borrar_direccion');
        bBorrar.removeAttribute('aria-disabled');
        if (error) { if (!Terna.siSesionVencida(error)) Terna.avisoBreve(Terna.textoError(error), { error: true }); return; }
        Object.assign(direccion, { calle: '', cp: '', provincia: '', guardada: false });
        direccion.original = firmaDireccion();
        for (const idC of ['dir-calle', 'dir-cp', 'dir-provincia']) { document.getElementById(idC).value = ''; limpiarError(idC); }
        limpiarError('dir');
        verBorrar(false);
        enfocar('dir-calle');
        Terna.avisoBreve(T.comun.guardado);
        if (alGuardar) alGuardar();
      }, null, { id: 'dir-borrar', hidden: !direccion.guardada, 'aria-describedby': 'dir-borrar-ayuda' });
      // Debajo del botón, que borra sin esperar a «Guardar preferencias» (FEEDBACK-PREFERENCIAS P2-1): el resto de la dirección sí espera.
      const ayudaBorrar = h('p', { class: 'campo-ayuda', id: 'dir-borrar-ayuda', hidden: !direccion.guardada, text: P.borrarDireccionAyuda });
      return [
        h('p', { class: 'campo-error', id: 'dir-error' }),
        campo({ id: 'dir-calle', etiqueta: P.calle, valor: direccion.calle, max: 120, autocomplete: 'street-address', ejemplo: P.calleEjemplo, alCambiar: alCambiar('calle') }),
        h('div', { class: 'dos dos-apilable' },
          campo({ id: 'dir-cp', etiqueta: P.codigoPostal, valor: direccion.cp, max: 12, autocomplete: 'postal-code', inputmode: 'text', ejemplo: P.codigoPostalEjemplo, alCambiar: alCambiar('cp') }),
          seleccion({ id: 'dir-provincia', etiqueta: P.provincia, valor: direccion.provincia, opciones: P.provincias.map((x) => [x, x]), vacio: P.provinciaVacia, alCambiar: alCambiar('provincia') })),
        h('div', null, bBorrar, ayudaBorrar),
      ];
    }

    /* ---------- Portfolio y GitHub ---------- */
    let itemLinks = null;
    if (links) {
      const c = (k, etiqueta, ayuda) => campo({ id: 'dato-' + k, etiqueta, valor: links[k], max: 300, tipo: 'url', inputmode: 'url', ayuda, alCambiar: (x) => { links[k] = x; } });
      itemLinks = h('div', { class: 'subbloque' }, conGithub
        ? h('div', { class: 'dos dos-apilable' }, c('portfolio', P.portfolio, P.portfolioAyuda), c('github', P.github, P.githubAyuda))
        : c('portfolio', P.portfolio, P.portfolioAyuda));
    }

    /* ---------- Analítico (0021; brand.md 0.4.14): un PDF que Terna adjunta solo si un formulario lo pide ---------- */
    function partesAnalitico() {
      const cont = h('div', { class: 'seccion' });
      const estado = h('p', { class: 'campo-ayuda', role: 'status' });
      const error = h('p', { class: 'campo-error', role: 'alert' });
      const archivo = h('input', { type: 'file', accept: 'application/pdf,.pdf', class: 'oculto-visual', tabindex: '-1', 'aria-hidden': 'true' });
      const elegir = () => { error.textContent = ''; archivo.click(); };
      archivo.addEventListener('change', async () => {
        const f = archivo.files && archivo.files[0];
        archivo.value = '';
        if (!f) return;
        const esPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        if (!esPdf || f.size > MAX_MB * 1048576) { error.textContent = T.errores.cvArchivo(MAX_MB); return; }
        estado.textContent = P.subiendo;
        const { error: e } = await sb.storage.from(Terna.CONFIG.bucket).upload(RUTA_ANALITICO, f, { upsert: true, contentType: 'application/pdf', cacheControl: '0' });
        estado.textContent = '';
        if (e) { if (!Terna.siSesionVencida(e)) error.textContent = T.errores.analiticoSubir; return; }
        const r = await sb.rpc('analitico');
        analitico = (Array.isArray(r.data) ? r.data[0] : r.data) || { subido_en: new Date().toISOString() };
        dibujar();
        Terna.avisoBreve(T.comun.guardado);
        enfocar('analitico-ver');
      });
      const dibujar = () => {
        Terna.vaciar(cont);
        if (analitico) {
          // «Ver», «Reemplazar» y «Quitar» dicen de qué para el lector de pantalla (FEEDBACK-PREFERENCIAS P3-4).
          cont.append(h('p', { text: P.analiticoCargado(Terna.fechaLarga(analitico.subido_en)) }),
            h('div', { class: 'botones' },
              Terna.linkFirmado(RUTA_ANALITICO, null, h('a', { class: 'btn btn-texto', id: 'analitico-ver', 'aria-label': P.analiticoAccesible.ver }, icono('i-revisar'), P.ver)),
              boton(P.reemplazar, 'i-subir', elegir, 'btn btn-texto', { 'aria-label': P.analiticoAccesible.reemplazar }),
              boton(P.quitar, 'i-quitar', async () => {
                const { error: e } = await sb.storage.from(Terna.CONFIG.bucket).remove([RUTA_ANALITICO]);
                if (e) { if (!Terna.siSesionVencida(e)) Terna.avisoBreve(T.errores.guardar, { error: true }); return; }
                analitico = null;
                dibujar();
                Terna.avisoBreve(T.comun.guardado);
                enfocar('analitico-subir');
              }, 'btn btn-texto', { 'aria-label': P.analiticoAccesible.quitar })));
        } else {
          cont.append(h('p', { class: 'suave', text: P.sinAnalitico }),
            boton(P.subirAnalitico(MAX_MB), 'i-subir', elegir, 'btn btn-ancho', { id: 'analitico-subir' }));
        }
        cont.append(h('p', { class: 'campo-ayuda', text: P.analiticoAyuda }), estado, error, archivo);
      };
      dibujar();
      return cont;
    }
    // El promedio de cada carrera, de solo lectura (D7: es un campo de cada estudio y se cambia en Mi perfil › Estudios).
    function promedios() {
      const carreras = (estudios || []).filter((e) => e && String(e.titulo || '').trim() && (NIVELES_CARRERA.includes(e.nivel) || String(e.promedio || '').trim()));
      if (!carreras.length) return null;
      const PP = T.preferencias;
      return h('div', { class: 'promedios' },
        h('ul', { class: 'promedios-lista' }, carreras.map((e) => h('li', { text: PP.promedioEnPerfil(String(e.titulo).trim(), String(e.promedio || '').trim()) }))),
        h('p', null, h('a', { href: 'perfil.html#estudios', text: PP.promedioEnPerfilLink })));
    }
    const itemAna = analitico === undefined ? null : piezas.item(P.analitico, partesAnalitico(), promedios());

    /* ---------- Validar, guardar y los errores de la base ---------- */
    const CAMPOS = ['form-dni', 'form-cuil', 'form-fecha', 'dir', 'dir-calle', 'dir-cp', 'dir-provincia'];
    function validar() {
      CAMPOS.forEach(limpiarError);
      let ok = true;
      if (formularios.cargado) {
        const dni = formularios.dni.replace(/\D/g, '');
        if (dni && !/^\d{7,8}$/.test(dni)) { marcarError('form-dni', T.errores.dni); ok = false; }
        const cuil = formularios.cuil.replace(/\D/g, '');
        if (cuil && !/^\d{11}$/.test(cuil)) { marcarError('form-cuil', T.errores.cuil); ok = false; }
      }
      if (direccion.cargada) {
        // Los tres juntos o ninguno (los tres vacíos la sacan); la base valida lo mismo (datos.md 0.32 §5.4b).
        const calle = calleLimpia();
        const cp = cpLimpio();
        if (calle || cp || direccion.provincia) {
          if (!calle || !cp || !direccion.provincia) { marcarError('dir', T.errores.direccionIncompleta); ok = false; }
          else {
            if (calle.length < 3 || calle.length > 120) { marcarError('dir-calle', T.errores.calle); ok = false; }
            if (!/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/.test(cp)) { marcarError('dir-cp', T.errores.codigoPostal); ok = false; }
          }
        }
      }
      return ok;
    }
    // Lo que cambió, en este orden; si una escritura falla, tira su error (con _campo si es de un campo) y lo de después no se escribe.
    async function guardar() {
      // Portfolio y GitHub (perfiles), solo si cambiaron. 0020: se guarda como link; sin "https://" adelante, se lo agrega (la base
      // pide http o https). Solo esas dos columnas: lo demás de perfiles lo escribe Mi perfil.
      if (links && JSON.stringify(links) !== linksOriginal) {
        const v = (x) => (String(x || '').trim() || null);
        const link = (x) => { const s = v(x); return s && !/^https?:\/\//i.test(s) ? 'https://' + s : s; };
        const cambios = { portfolio: link(links.portfolio) };
        if (conGithub) cambios.github = link(links.github);   // 0049, como el portfolio
        const { error } = await sb.from('perfiles').update(cambios).eq('usuario_id', uid);
        if (error) throw error;
        linksOriginal = JSON.stringify(links);
      }
      // Identificación, solo si se descifró y cambió.
      if (formularios.cargado && JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]) !== formularios.original) {
        const { error } = await sb.rpc('guardar_datos_formularios', { p_dni: formularios.dni || null, p_cuil: formularios.cuil || null, p_fecha_nacimiento: formularios.fecha || null });
        if (error) throw Object.assign(error, { _campo: true });
        formularios.original = JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]);
      }
      // La dirección, solo si se descifró y cambió: los tres juntos, o ninguno para sacarla.
      if (direccion.cargada && firmaDireccion() !== direccion.original) {
        const calle = calleLimpia();
        const cp = cpLimpio();
        const vacia = !calle && !cp && !direccion.provincia;
        const { error } = vacia ? await sb.rpc('borrar_direccion')
          : await sb.rpc('guardar_direccion', { p_calle: calle, p_codigo_postal: cp, p_provincia: direccion.provincia });
        if (error) throw Object.assign(error, { _campo: true });
        // Quedan a la vista como se guardaron.
        Object.assign(direccion, { calle, cp, guardada: !vacia });
        direccion.original = firmaDireccion();
        const [iCalle, iCp] = ['dir-calle', 'dir-cp'].map((x) => document.getElementById(x));
        if (iCalle) iCalle.value = calle;
        if (iCp) iCp.value = cp;
        verBorrar(!vacia);
      }
    }
    /* Si algo de acá cambió y todavía no se guardó (FEEDBACK-PREFERENCIAS P1-1): lo mismo que mira guardar(), contra lo leído al
       entrar o lo último que se escribió. Lo que escribe en el acto (el analítico, «Borrar dirección») no cuenta: ya está guardado. */
    function cambio() {
      if (links && JSON.stringify(links) !== linksOriginal) return true;
      if (formularios.cargado && JSON.stringify([formularios.dni, formularios.cuil, formularios.fecha]) !== formularios.original) return true;
      return direccion.cargada && firmaDireccion() !== direccion.original;
    }
    // Un error de la base que es de un campo de acá: lo escribe junto al campo y devuelve true.
    const CAMPO_ERROR = { dni_invalido: 'form-dni', cuil_invalido: 'form-cuil', fecha_nacimiento_invalida: 'form-fecha',
      direccion_incompleta: 'dir', calle_invalida: 'dir-calle', codigo_postal_invalido: 'dir-cp', provincia_invalida: 'dir-provincia' };
    function error(e) {
      const campoError = CAMPO_ERROR[String((e && e.message) || '').trim()];
      if (!campoError) return false;
      marcarError(campoError, Terna.textoError(e));
      return true;
    }

    return { nodos: [itemId, itemDir, itemLinks, itemAna].filter(Boolean), anclas: { identificacion: itemId, direccion: itemDir, analitico: itemAna }, validar, guardar, cambio, error, alAbrir };
  }

  return { montar };
}());
