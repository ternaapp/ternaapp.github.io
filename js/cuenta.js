/* Terna · js/cuenta.js
   Las tres páginas sin sesión (brand.md §6.2): Entrar, Crear tu cuenta (con el token del link de invitación) y
   Cambiar la contraseña (sin SMTP, el texto para escribirle a Francisco). El alta: leer_invitacion antes de signUp.
   Desde el rediseño B2 «Sello» (opciones-v3/PLAN-WEB.md §3.10 a §3.12), lo de cada página va en la carpeta de las tres
   lengüetas; lo que la acompaña (quién te invitó, la nota de la invitación, la vuelta a Entrar) va afuera, en #cuenta. */
'use strict';

(function () {
  const { h, icono, sb } = Terna;
  const C = T.cuenta;
  const E = T.errores;
  const archivo = location.pathname.split('/').pop() || 'entrar.html';
  const raiz = () => document.getElementById('cuenta');

  function campo({ id, etiqueta, tipo, valor, autocomplete, ayuda, readonly, max, contrasena }) {
    const idAyuda = ayuda ? id + '-ayuda' : null;
    const input = h('input', { class: 'control', id, name: id, type: tipo || 'text', value: valor || '', autocomplete: autocomplete || null,
      readOnly: !!readonly, maxlength: max ? String(max) : null, 'aria-describedby': [idAyuda, id + '-error'].filter(Boolean).join(' ') });
    let control = input;
    if (contrasena) {
      const ver = h('button', { type: 'button', 'aria-label': C.mostrar, 'aria-pressed': 'false' }, icono('i-revisar'));
      ver.addEventListener('click', () => {
        const mostrar = input.type === 'password';
        input.type = mostrar ? 'text' : 'password';
        ver.setAttribute('aria-label', mostrar ? C.ocultar : C.mostrar);
        ver.setAttribute('aria-pressed', String(mostrar));
      });
      control = h('div', { class: 'control-con-boton' }, input, ver);
    }
    input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); const e = document.getElementById(id + '-error'); if (e) e.textContent = ''; });
    return h('div', { class: 'campo' }, h('label', { for: id, text: etiqueta }), control,
      ayuda ? h('p', { class: 'campo-ayuda', id: idAyuda, text: ayuda }) : null, h('p', { class: 'campo-error', id: id + '-error' }));
  }
  function errorCampo(id, texto) {
    const e = document.getElementById(id + '-error');
    if (e) e.textContent = texto;
    const i = document.getElementById(id);
    if (i) { i.setAttribute('aria-invalid', 'true'); i.focus(); }
  }
  // `iconoId`: el de una banda que no es un error (por defecto, el círculo de aviso).
  function banda(texto, error, iconoId) {
    return h('div', { class: 'banda' + (error ? ' banda-error' : ''), role: error ? 'alert' : 'status', tabindex: '-1' }, icono(error ? 'i-alerta' : (iconoId || 'i-por-decidir')), h('span', { text: texto }));
  }
  /* La carpeta de las páginas sin sesión (PLAN-WEB.md §3.10): tres lengüetas en las tres tintas del logo (sello, medio, lila),
     que no son pestañas (aria-hidden), y el cuerpo con lo que va adentro. */
  function carpeta(...hijos) {
    return h('div', { class: 'carpeta acceso-carpeta' },
      h('div', { class: 'tres-lenguetas', 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
      h('div', { class: 'carpeta-cuerpo' }, hijos));
  }
  // Debajo de la carpeta, la vuelta a Entrar, como texto (Contraseña).
  const volverAEntrar = () => h('p', { class: 'acceso-volver' }, h('a', { href: 'entrar.html' }, icono('i-volver'), h('span', { text: T.comun.volver })));
  const mailValido = (m) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);
  function errorAuth(error) {
    const st = error && error.status;
    const code = error && error.code;
    if (st === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') return E.intentos;
    if (code === 'invalid_credentials' || code === 'user_banned' || (st === 400 && /invalid login/i.test(error.message || ''))) return E.credenciales;
    return E.general;
  }

  /* ---------- Elegir el modo, una vez, después de Crear cuenta (diseno.md 0.30 §9.1) ----------
     Tres opciones; la primera, la del dispositivo, viene marcada. Cada una se ve en el acto. "Seguir" deja fija la elegida en
     este navegador (o ninguna, si es la del dispositivo) y entra a Mi perfil. La marca de sessionStorage es para que recargar
     esta pantalla no muestre el error de la invitación ya usada. */
  const PASO_MODO = 'terna.alta.modo';
  const marcaModo = (poner) => { try { if (poner) sessionStorage.setItem(PASO_MODO, '1'); else sessionStorage.removeItem(PASO_MODO); } catch (e) { /* sin almacenamiento */ } };
  const hayMarcaModo = () => { try { return sessionStorage.getItem(PASO_MODO) === '1'; } catch (e) { return false; } };
  function elegirModo(cont) {
    const tema = window.TernaTema;
    const seguir = () => { marcaModo(false); location.replace('perfil.html?bienvenida=1'); };
    if (!tema) { seguir(); return; }
    marcaModo(true);
    Terna.vaciar(cont);
    const opcion = (valor, iconoId, texto, ayuda) => {
      const input = h('input', { type: 'radio', name: 'modo', value: valor, checked: (tema.elegido() || 'dispositivo') === valor });
      input.addEventListener('change', () => { if (input.checked) tema.elegir(valor); });
      return h('label', { class: 'modo' }, input, icono(iconoId),
        h('span', { class: 'modo-texto' }, h('span', { text: texto }), ayuda ? h('small', { text: ayuda }) : null));
    };
    const titulo = h('h1', { class: 'titulo', tabindex: '-1', text: C.modoTitulo });
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('div', { class: 'acceso-encabezado' }, titulo, h('p', { class: 'acceso-ayuda', text: C.modoAyuda })),
      h('fieldset', { class: 'modos' }, h('legend', { class: 'oculto-visual', text: C.modoGrupo }),
        opcion('dispositivo', 'i-dispositivo', C.modoDispositivo, C.modoDispositivoAhora(tema.delDispositivo() === 'oscuro')),
        opcion('claro', 'i-sol', C.modoClaro),
        opcion('oscuro', 'i-luna', C.modoOscuro)),
      h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.modoSeguir));
    form.addEventListener('submit', (e) => { e.preventDefault(); seguir(); });
    // En la misma carpeta que el formulario de la cuenta: cambia lo de adentro, no la página.
    cont.append(carpeta(form));
    titulo.focus();
  }

  /* ---------- Entrar ---------- */
  async function entrar() {
    const q = new URLSearchParams(location.search);
    const volver = Terna.volverValido(q.get('volver'));
    // Si se llegó por sesión vencida, la sesión que quedó guardada no sirve: se borra (si no, volvería y daría vueltas).
    if (q.get('motivo') === 'sesion') { try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual */ } }
    const { data } = await sb.auth.getSession();
    // Con la sesión abierta, la marca que mira js/puerta.js va antes de salir hacia la raíz (PLAN-LANDING §6.2): así la puerta no
    // depende solo del nombre de la clave de supabase-js.
    if (data && data.session) { Terna.guardarMarcaSesion(true); location.replace(volver); return; }
    const cont = raiz();
    // La descripción va fuera del formulario (PLAN-WEB.md §3.10): en escritorio, en la columna del logo; en el celular, al final.
    const descripcion = document.getElementById('descripcion');
    if (descripcion) descripcion.textContent = T.descripcionLarga;
    const avisos = h('div', { class: 'acceso-avisos' });
    if (q.get('motivo') === 'sesion') avisos.append(banda(E.sesion, true));
    const bEntrar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.entrar);
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('h1', { class: 'titulo', text: C.entrarTitulo }), avisos,
      campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', autocomplete: 'username', max: 254 }),
      campo({ id: 'contrasena', etiqueta: C.contrasena, tipo: 'password', autocomplete: 'current-password', contrasena: true }),
      bEntrar,
      h('p', { class: 'acceso-olvide' }, h('a', { href: 'contrasena.html', text: C.olvide })));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mail = document.getElementById('mail').value.trim();
      const clave = document.getElementById('contrasena').value;
      if (!mail) { errorCampo('mail', E.completa); return; }
      if (!mailValido(mail)) { errorCampo('mail', E.mailInvalido); return; }
      if (!clave) { errorCampo('contrasena', E.completa); return; }
      bEntrar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.auth.signInWithPassword({ email: mail, password: clave });
      bEntrar.removeAttribute('aria-disabled');
      if (error) {
        Terna.vaciar(avisos);
        const b = banda(errorAuth(error), true);
        avisos.append(b);
        b.focus();
        return;
      }
      Terna.guardarMarcaSesion(true);
      location.replace(volver);
    });
    // Debajo del formulario (PLAN-LANDING §5.2; desde PLAN-LANDING-2, sin invitaciones): quien no tiene cuenta va a los planes de
    // la landing y, después de una regla fina, el renglón de quien contrata. El link es la frase entera.
    // FEEDBACK-LADOS punto 7 (24/11): la pregunta y el link en un renglón, como en contratar.html y como el de quien contrata.
    cont.append(carpeta(form),
      h('p', { class: 'acceso-nota acceso-sin-cuenta' }, C.sinCuenta, ' ', h('a', { href: 'bienvenida.html#precios', text: C.verPlanes })),
      h('p', { class: 'acceso-otro' }, C.contratasPregunta, ' ', h('a', { href: 'contratar.html', text: C.contratasLink })));
  }

  /* ---------- Crear tu cuenta ---------- */
  async function crearCuenta() {
    document.title = T.comun.titulo(C.crearTitulo);
    const cont = raiz();
    // El código llega después de # (crear-cuenta.html#token=…; informe de seguridad del 06/11/2026, H1) o, en los links
    // anteriores, con ?token=. Se lee de los dos lados y la barra se limpia en el acto, antes de consultar nada.
    const token = new URLSearchParams(Terna.hashInicial.slice(1)).get('token') || new URLSearchParams(location.search).get('token') || '';
    if (location.search || location.hash) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* igual sigue */ } }
    // Un link nuevo pegado en esta misma pestaña cambia solo lo que va después de # y el navegador no vuelve a cargar la
    // página: se recarga a mano para leerlo (el salto "Ir al contenido" también cambia el #, pero sin token, y no recarga).
    window.addEventListener('hashchange', () => { if (/(?:^#|&)token=/.test(location.hash)) location.reload(); });
    // Recargó en el paso de elegir el modo, con la cuenta ya creada y la sesión abierta: vuelve a ese paso.
    if (!token && hayMarcaModo()) {
      const { data: s } = await sb.auth.getSession();
      if (s && s.session) { elegirModo(cont); return; }
      marcaModo(false);
    }
    const titulo = h('h1', { class: 'titulo', text: C.crearTitulo });
    // Lo que corta el alta (invitación usada, vencida, que no existe, o un error): en la carpeta, con la salida a Entrar.
    const fin = (texto) => { cont.append(carpeta(titulo, banda(texto, true), h('a', { class: 'btn btn-ancho', href: 'entrar.html' }, C.entrar))); };
    if (!/^[a-f0-9]{32}$/.test(token)) { fin(E.invNoExiste); return; }
    const parar = Terna.cargando(cont);
    const { data, error } = await sb.rpc('leer_invitacion', { p_token: token });
    parar();
    Terna.vaciar(cont);
    if (error) { fin(E.general); return; }
    const inv = (Array.isArray(data) ? data[0] : data) || null;
    if (!inv) { fin(E.invNoExiste); return; }
    if (inv.invitacion_estado === 'usada') { fin(E.invUsada); return; }
    if (inv.invitacion_estado !== 'pendiente') { fin(E.invVencida); return; }

    const avisos = h('div', { class: 'acceso-avisos' });
    const bCrear = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.crear);
    const form = h('form', { class: 'acceso-form', novalidate: true },
      titulo,
      avisos,
      campo({ id: 'nombre', etiqueta: C.nombre, autocomplete: 'given-name', max: 80 }),
      campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', valor: inv.invitacion_mail, readonly: true, ayuda: C.mailInvitacion, autocomplete: 'username' }),
      campo({ id: 'contrasena', etiqueta: C.contrasena, tipo: 'password', autocomplete: 'new-password', ayuda: C.contrasenaAyuda, contrasena: true }),
      bCrear);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const clave = document.getElementById('contrasena').value;
      if (!nombre) { errorCampo('nombre', E.completa); return; }
      if (clave.length < 8) { errorCampo('contrasena', E.contrasenaCorta); return; }
      bCrear.setAttribute('aria-disabled', 'true');
      const r = await sb.auth.signUp({ email: inv.invitacion_mail, password: clave, options: { data: { token, nombre } } });
      bCrear.removeAttribute('aria-disabled');
      if (r.error || !r.data || !r.data.session) {
        const code = r.error && r.error.code;
        if (code === 'weak_password') { errorCampo('contrasena', E.contrasenaCorta); return; }
        Terna.vaciar(avisos);
        const b = banda(code === 'user_already_exists' ? E.mailConCuenta : (r.error ? errorAuth(r.error) : E.general), true);
        avisos.append(b);
        b.focus();
        return;
      }
      elegirModo(cont);
    });
    // Quién te invitó va arriba de la carpeta, fuera de ella; la nota de privacidad, debajo (PLAN-WEB.md §3.11).
    if (inv.invitador_nombre) cont.append(h('p', { class: 'acceso-invito', text: C.teInvito(inv.invitador_nombre) }));
    cont.append(carpeta(form), h('p', { class: 'acceso-nota', text: C.crearNota }));
  }

  /* ---------- Cambiar la contraseña ---------- */
  async function contrasena() {
    document.title = T.comun.titulo(C.cambiarTitulo);
    const cont = raiz();
    const hash = new URLSearchParams(Terna.hashInicial.slice(1));
    if (hash.get('error_code') === 'otp_expired' || hash.get('error') === 'access_denied') {
      cont.append(carpeta(h('h1', { class: 'titulo', text: C.cambiarTitulo }), banda(E.linkVencido, true),
        h('a', { class: 'btn btn-primario btn-ancho', href: 'contrasena.html' }, C.mandarLink)), volverAEntrar());
      return;
    }
    if (hash.get('type') === 'recovery') { await nuevaContrasena(cont); return; }
    if (!Terna.CONFIG.smtp) {
      cont.append(carpeta(h('h1', { class: 'titulo', text: C.cambiarTitulo }), h('p', { class: 'acceso-texto', text: C.sinSmtp })), volverAEntrar());
      return;
    }
    const resultado = h('div', { class: 'acceso-avisos', role: 'status' });
    const bMandar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.mandarLink);
    const tituloMandar = h('h1', { class: 'titulo', text: C.cambiarTitulo });
    const form = h('form', { class: 'acceso-form', novalidate: true },
      tituloMandar, campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', autocomplete: 'username', max: 254 }), bMandar, resultado);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mail = document.getElementById('mail').value.trim();
      if (!mail) { errorCampo('mail', E.completa); return; }
      if (!mailValido(mail)) { errorCampo('mail', E.mailInvalido); return; }
      bMandar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname });
      bMandar.removeAttribute('aria-disabled');
      Terna.vaciar(resultado);
      if (error && (error.status === 429)) { resultado.append(banda(E.intentos, true)); return; }
      // Mandado: en la misma carpeta, el formulario deja lugar a la confirmación (PLAN-WEB.md §3.12).
      for (const n of [...form.children]) if (n !== tituloMandar && n !== resultado) n.remove();
      const listo = banda(C.linkMandado, false, 'i-sobre');
      resultado.append(listo);
      listo.focus();
    });
    cont.append(carpeta(form), volverAEntrar());
  }
  async function nuevaContrasena(cont) {
    const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.guardarContrasena);
    const avisos = h('div', { class: 'acceso-avisos' });
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('h1', { class: 'titulo', text: C.nuevaTitulo }), avisos,
      campo({ id: 'nueva', etiqueta: C.nueva, tipo: 'password', autocomplete: 'new-password', ayuda: C.contrasenaAyuda, contrasena: true }),
      campo({ id: 'repetida', etiqueta: C.repetila, tipo: 'password', autocomplete: 'new-password', contrasena: true }),
      bGuardar);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const a = document.getElementById('nueva').value;
      const b = document.getElementById('repetida').value;
      if (a.length < 8) { errorCampo('nueva', E.contrasenaCorta); return; }
      if (a !== b) { errorCampo('repetida', E.noCoinciden); return; }
      bGuardar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.auth.updateUser({ password: a });
      bGuardar.removeAttribute('aria-disabled');
      Terna.vaciar(avisos);
      if (error) { const bb = banda(error.code === 'weak_password' ? E.contrasenaCorta : E.linkVencido, true); avisos.append(bb); bb.focus(); return; }
      await sb.auth.signOut({ scope: 'local' });
      Terna.vaciar(cont);
      cont.append(carpeta(h('h1', { class: 'titulo', text: C.nuevaTitulo }), banda(C.contrasenaGuardada, false, 'i-tilde'),
        h('a', { class: 'btn btn-primario btn-ancho', href: 'entrar.html' }, C.entrar)));
    });
    cont.append(carpeta(form), volverAEntrar());
  }

  function correr() {
    const acceso = document.querySelector('.acceso');
    // El sol o la luna, arriba a la derecha: el mismo botón de la barra (uno solo en la página).
    if (acceso && window.TernaTema) acceso.prepend(Terna.botonTema('btn-barra btn-acceso-tema'));
    if (archivo === 'crear-cuenta.html') crearCuenta();
    else if (archivo === 'contrasena.html') contrasena();
    else entrar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
})();
