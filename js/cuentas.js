/* Terna · js/cuentas.js
   "Terna crea cuentas por vos" y la dirección (diseno.md 0.29 §6, §9.2 y §9.3; brand.md 0.16 §6.3, §6.6 y §6.7; datos.md 0.32, 0036):
   lo que comparten Inicio, Preferencias y Mi perfil.
   - A quién se le muestra. Todo esto se publica junto con el lector de Workday del motor (pipeline.md §4.12). Mientras ese lector
     está apagado para la corrida diaria (terna-motor, datos/workday.json › corrida), lo ve solo el admin, que es quien corre el
     ensayo: a los demás no se les ofrece algo que Terna todavía no hace. Al prender el lector, PARA_TODOS pasa a true en el mismo
     cambio. Es solo qué se muestra: lo que cada quien puede leer y escribir lo decide la base (RLS y las funciones de 0036).
   - Cuántas postulaciones quedaron a mano en el último mes porque el sitio de la empresa pide una cuenta: las que Avisos y
     Postulaciones muestran como "A mano en el sitio (pide cuenta)" (Aviso.donde), para que el número sea el que la persona ve.
   - Responder la pregunta, que escribe en el acto. */
'use strict';

window.Cuentas = (function () {
  const PARA_TODOS = false;
  // "El último mes": 30 días con hoy, como "Mes" de Cómo viene en Inicio.
  const DIAS = 30;
  // Lo que Aviso.donde mira de mis_avisos, y las fechas.
  const COLUMNAS = 'estado_postulacion, interes, postulacion, ats_formulario, url, url_postulacion, fuente, linkedin_postulacion, texto_origen, armado_en, creado_en';

  function abiertas(usuario) { return PARA_TODOS || (!!usuario && usuario.rol === 'admin'); }
  // Con la columna de 0036: sin ella, las pantallas no muestran nada de esto (datos.md 0.32 §14).
  function seOfrecen(usuario, prefs) { return abiertas(usuario) && !!prefs && Object.prototype.hasOwnProperty.call(prefs, 'crear_cuentas'); }
  // Sin valor hasta que la persona responde, y sin valor es No.
  function sinResponder(prefs) { return !!prefs && (prefs.crear_cuentas === null || prefs.crear_cuentas === undefined); }

  function leerAMano(sb) {
    return sb.from('mis_avisos').select(COLUMNAS).eq('estado_postulacion', 'a_mano').neq('interes', 'no_me_interesa');
  }
  // Si la lectura falló o la página no trae js/aviso.js, no hay número: la pregunta va sin él.
  function delUltimoMes(filas, prefs) {
    if (!Array.isArray(filas) || typeof Aviso === 'undefined') return 0;
    const desde = Terna.sumarDias(Terna.hoy(), -(DIAS - 1));
    return filas.filter((a) => {
      if (a.estado_postulacion !== 'a_mano' || a.interes === 'no_me_interesa') return false;
      const d = Aviso.donde(a, prefs);
      if (d.clave !== 'empresa' || !d.cuenta) return false;
      // La postulación nace con el paquete: su fecha es la del armado; sin archivos vigentes, la del match.
      const fecha = a.armado_en || a.creado_en;
      return !!fecha && Terna.aFechaLocal(fecha) >= desde;
    }).length;
  }

  // null si quedó escrito; si no, el error.
  async function responder(sb, usuarioId, valor) {
    const { error } = await sb.from('preferencias').update({ crear_cuentas: valor === true }).eq('usuario_id', usuarioId);
    return error || null;
  }

  return { abiertas, seOfrecen, sinResponder, leerAMano, delUltimoMes, responder };
})();
