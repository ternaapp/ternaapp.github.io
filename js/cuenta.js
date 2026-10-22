/* Terna · js/cuenta.js
   Las tres páginas sin sesión (brand.md §6.2): Entrar, Crear tu cuenta (con el token del link de invitación) y
   Cambiar la contraseña (sin SMTP, el texto para escribirle a Francisco). El alta: leer_invitacion antes de signUp. */
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
  function banda(texto, error) {
    return h('div', { class: 'banda' + (error ? ' banda-error' : ''), role: error ? 'alert' : 'status', tabindex: '-1' }, icono(error ? 'i-alerta' : 'i-por-decidir'), h('span', { text: texto }));
  }
  const mailValido = (m) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);
  function errorAuth(error) {
    const st = error && error.status;
    const code = error && error.code;
    if (st === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') return E.intentos;
    if (code === 'invalid_credentials' || code === 'user_banned' || (st === 400 && /invalid login/i.test(error.message || ''))) return E.credenciales;
    return E.general;
  }

  /* ---------- Entrar ---------- */
  async function entrar() {
    const q = new URLSearchParams(location.search);
    const volver = Terna.volverValido(q.get('volver'));
    // Si se llegó por sesión vencida, la sesión que quedó guardada no sirve: se borra (si no, volvería y daría vueltas).
    if (q.get('motivo') === 'sesion') { try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* igual */ } }
    const { data } = await sb.auth.getSession();
    if (data && data.session) { location.replace(volver); return; }
    const cont = raiz();
    const avisos = h('div');
    if (q.get('motivo') === 'sesion') avisos.append(banda(E.sesion, true));
    const bEntrar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.entrar);
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('h1', { class: 'titulo', text: C.entrarTitulo }), avisos,
      campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', autocomplete: 'username', max: 254 }),
      campo({ id: 'contrasena', etiqueta: C.contrasena, tipo: 'password', autocomplete: 'current-password', contrasena: true }),
      bEntrar,
      h('p', null, h('a', { href: 'contrasena.html', text: C.olvide })),
      h('p', { class: 'acceso-descripcion', text: C.porInvitacion }),
      h('p', { class: 'acceso-descripcion', text: T.descripcionLarga }));
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
      location.replace(volver);
    });
    cont.append(form);
  }

  /* ---------- Crear tu cuenta ---------- */
  async function crearCuenta() {
    document.title = C.crearTitulo + ' | Terna';
    const cont = raiz();
    const token = new URLSearchParams(location.search).get('token') || '';
    const titulo = h('h1', { class: 'titulo', text: C.crearTitulo });
    const fin = (texto) => { cont.append(titulo, banda(texto, true)); };
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

    const avisos = h('div');
    const bCrear = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.crear);
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('div', null, titulo, inv.invitador_nombre ? h('p', { text: C.teInvito(inv.invitador_nombre) }) : null),
      avisos,
      campo({ id: 'nombre', etiqueta: C.nombre, autocomplete: 'given-name', max: 80 }),
      campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', valor: inv.invitacion_mail, readonly: true, ayuda: C.mailInvitacion, autocomplete: 'username' }),
      campo({ id: 'contrasena', etiqueta: C.contrasena, tipo: 'password', autocomplete: 'new-password', ayuda: C.contrasenaAyuda, contrasena: true }),
      bCrear,
      h('p', { class: 'acceso-descripcion', text: C.crearNota }));
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
      location.replace('perfil.html?bienvenida=1');
    });
    cont.append(form);
  }

  /* ---------- Cambiar la contraseña ---------- */
  async function contrasena() {
    document.title = C.cambiarTitulo + ' | Terna';
    const cont = raiz();
    const hash = new URLSearchParams(Terna.hashInicial.slice(1));
    if (hash.get('error_code') === 'otp_expired' || hash.get('error') === 'access_denied') {
      cont.append(h('h1', { class: 'titulo', text: C.cambiarTitulo }), banda(E.linkVencido, true), h('p', null, h('a', { href: 'contrasena.html', text: C.mandarLink })));
      return;
    }
    if (hash.get('type') === 'recovery') { await nuevaContrasena(cont); return; }
    if (!Terna.CONFIG.smtp) {
      cont.append(h('h1', { class: 'titulo', text: C.cambiarTitulo }), h('p', { text: C.sinSmtp }),
        h('p', null, h('a', { class: 'btn', href: 'entrar.html' }, icono('i-volver'), T.comun.volver)));
      return;
    }
    const resultado = h('div', { role: 'status' });
    const bMandar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.mandarLink);
    const form = h('form', { class: 'acceso-form', novalidate: true },
      h('h1', { class: 'titulo', text: C.cambiarTitulo }), campo({ id: 'mail', etiqueta: C.mail, tipo: 'email', autocomplete: 'username', max: 254 }), bMandar, resultado,
      h('p', null, h('a', { href: 'entrar.html', text: T.comun.volver })));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mail = document.getElementById('mail').value.trim();
      if (!mail) { errorCampo('mail', E.completa); return; }
      if (!mailValido(mail)) { errorCampo('mail', E.mailInvalido); return; }
      bMandar.setAttribute('aria-disabled', 'true');
      const { error } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname });
      bMandar.removeAttribute('aria-disabled');
      Terna.vaciar(resultado);
      resultado.append(error && (error.status === 429) ? banda(E.intentos, true) : banda(C.linkMandado, false));
    });
    cont.append(form);
  }
  async function nuevaContrasena(cont) {
    const bGuardar = h('button', { class: 'btn btn-primario btn-ancho', type: 'submit' }, C.guardarContrasena);
    const avisos = h('div');
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
      cont.append(h('h1', { class: 'titulo', text: C.nuevaTitulo }), banda(C.contrasenaGuardada, false), h('p', null, h('a', { class: 'btn btn-primario', href: 'entrar.html' }, C.entrar)));
    });
    cont.append(form);
  }

  function correr() {
    if (archivo === 'crear-cuenta.html') crearCuenta();
    else if (archivo === 'contrasena.html') contrasena();
    else entrar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
})();
