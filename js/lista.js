/* Terna · js/lista.js
   La lista de Avisos tal como se abre, sin filtros de la persona (diseno.md 0.26 §6 y §7.2): lo que cuentan Inicio y Avisos tiene
   que dar lo mismo (Francisco, 07/11/2026: "dice 29 postulaciones para hacer a mano pero me figuran 9"). Las dos páginas arman
   la lista con estas mismas reglas:
   - con interés (me interesa o por decidir), dentro de las preferencias de búsqueda y desde el umbral;
   - lo que la persona pidió entra siempre, aunque esté fuera de sus preferencias o debajo del umbral (busqueda.md 0.2 §4.5);
   - lo "tuyo" entra desde el piso: los avisos de tus puestos ("Priorizar mis puestos", 0027) y, desde 0034, los de las empresas
     que seguís ("Priorizar mis empresas"), como los toma el motor (pipeline.md 0.4.15 §4.9 punto 3c y 0.4.24 §4.19);
   - los links de Inicio cuentan y filtran con la regla del motor y nada más (`esLaEmpresa`, `esElPuesto`): "Dos" no trae
     "Veintidós" ni "Meta" trae "Metalúrgica". Avisos los recibe como filtro exacto (`?empresa=` y `?puesto=`); lo que la persona
     escribe en el filtro sigue buscando el texto contenido, más la misma regla (`deEmpresa`, `dePuesto`).
   Desde PLAN-UX §3.2 (21/11/2026) Avisos pasa a Paquetes, con dos pestañas: Armados (lo que tiene paquete, por fecha de armado) y
   Por armar (la cola: lo que te toca decidir, tus pedidos, lo que sigue Terna, lo que espera y lo que Terna no arma sola). Las reglas
   de cada pestaña y de cada grupo también viven acá (`pestanaDe`, `grupoDe`, `enPaquetes`), para que Inicio cuente lo mismo que
   muestra Paquetes; `enLista` sigue como estaba. Y la cuenta lila de paquetes nuevos (decisión D3; §6.3): lo armado desde la última
   visita a Armados, que se guarda en este navegador, con el día de la última corrida como piso (`paquetesNuevos`, `visitaArmados`). */
'use strict';

window.Lista = (function () {
  const INTERES_INICIAL = ['me_interesa', 'por_decidir'];
  // La pestaña de un aviso en Paquetes: lo armado y lo que no se pudo armar van a Armados; todo lo demás está por armar.
  const ARMADOS = ['armado', 'no_se_pudo_armar'];
  function pestanaDe(a) { return ARMADOS.includes(a.estado_paquete) ? 'armados' : 'por_armar'; }
  // Cuántos días hace que se armó (0: hoy, en Buenos Aires), o null si no se sabe (un paquete cuyos archivos ya vencieron).
  function diasDesdeArmado(a) {
    if (!a.armado_en) return null;
    const d = Terna.diasEntre(Terna.aFechaLocal(a.armado_en), Terna.hoy());
    return Number.isFinite(d) ? Math.max(0, d) : null;
  }

  // `seguidas`: las filas de empresas_seguidas ({ nombre, alias }) o sus nombres; vacío sin 0034. Lo tuyo sale de
  // `Aviso.criterio`, `Aviso.tuPuesto` y `Aviso.tuEmpresa`: la regla que usan también Postulaciones y el motor.
  function crear(avisos, { prefs, piso, seguidas }) {
    const criterio = Aviso.criterio(prefs, piso, seguidas);
    const umbral = criterio.umbral;
    const busqueda = criterio.busqueda;
    const puestos = (prefs.puestos_objetivo || []).filter((x) => x && String(x).trim());
    const filas = (seguidas || []).map((s) => (s && typeof s === 'object' ? s : { nombre: s, alias: null })).filter((f) => f.nombre && String(f.nombre).trim());
    const fuera = (a) => Aviso.motivosFuera(a, busqueda);
    const esTuPuesto = (a) => !!Aviso.tuPuesto(a, criterio);
    const esTuEmpresa = (a) => !!Aviso.tuEmpresa(a, criterio);
    const prioritario = (a) => esTuPuesto(a) || esTuEmpresa(a);
    const llegaOEsTuyo = (a, minimo) => a.match === null || a.match === undefined || a.match >= minimo || prioritario(a);
    // La lista con la que abre Avisos. Desde busqueda.md 0.2 (16/11/2026), lo que la persona pidió se ve siempre, aunque no llegue a
    // su umbral o quede fuera de sus preferencias: lo eligió ella (desde Búsqueda se pide cualquier aviso abierto), el motor lo arma
    // igual (pipeline.md §4.9) y, sin esto, un pedido hecho en Búsqueda no aparecía en la lista de Avisos.
    const pedido = (a) => !!a.pedido_en;
    const enLista = (a) => INTERES_INICIAL.includes(a.interes) && (pedido(a) || (Aviso.pasaBusqueda(a, busqueda) && llegaOEsTuyo(a, umbral)));
    const igual = (x, y) => Empresas.normalizada(x) === Empresas.normalizada(y);
    // La empresa con la regla del motor; si es una que seguís, también con el nombre de su tablero (el alias).
    function esLaEmpresa(a, texto) {
      if (!String(texto || '').trim()) return true;
      const f = filas.find((x) => igual(x.nombre, texto));
      return Empresas.misma(a.empresa, texto, f ? f.alias : null);
    }
    const esElPuesto = (a, texto) => !String(texto || '').trim() || !!Puestos.buscado(a.puesto, [texto]);
    const deEmpresa = (a, texto) => !String(texto || '').trim() || Filtros.contiene(a.empresa, texto) || esLaEmpresa(a, texto);
    const dePuesto = (a, texto) => !String(texto || '').trim() || Filtros.contiene(a.puesto, texto) || esElPuesto(a, texto);
    /* Paquetes (PLAN-UX §3.2). Lo que Terna arma sola, como lo toma el motor (pipeline.md §4.9): con texto y match, dentro de las
       preferencias y desde el umbral, o de tus puestos desde el piso. Lo de una empresa que seguís que no llega no lo arma sola. */
    const decideSola = (a) => !!a.tiene_texto && a.match !== null && a.match !== undefined && (Aviso.llega(a, umbral) || esTuPuesto(a)) && !fuera(a).length;
    // Lo que Paquetes muestra al abrir, sin filtros de la persona: todo lo que le interesa (o está por decidir), desde el piso. Las
    // preferencias y el umbral ya no esconden nada: ordenan (lo que no llega va al grupo plegado de Por armar; lo armado, a Armados).
    const enPaquetes = (a) => INTERES_INICIAL.includes(a.interes) && (a.match === null || a.match === undefined || a.match >= piso);
    // El grupo de un aviso dentro de su pestaña. Armados: no_se_pudo, hoy, semana (de 1 a 6 días), antes. Por armar: descartados
    // (No me interesa, solo con el filtro Interés), pedidos (Tus pedidos, #proximos), esperan (sin texto o sin match todavía),
    // decidir (por decidir y Terna lo armaría), sigue (Terna lo arma sola) y no_arma (bajo el umbral o fuera de las preferencias).
    function grupoDe(a) {
      if (pestanaDe(a) === 'armados') {
        if (a.estado_paquete === 'no_se_pudo_armar') return 'no_se_pudo';
        const d = diasDesdeArmado(a);
        return d === 0 ? 'hoy' : (d !== null && d < 7 ? 'semana' : 'antes');
      }
      if (a.interes === 'no_me_interesa') return 'descartados';
      if (a.estado_paquete === 'pedido' && !a.paquete_id) return 'pedidos';
      if (!a.tiene_texto || a.match === null || a.match === undefined) return 'esperan';
      if (!decideSola(a)) return 'no_arma';
      return a.interes === 'por_decidir' ? 'decidir' : 'sigue';
    }
    return { criterio, umbral, piso, busqueda, puestos, filas, misPuestos: criterio.puestos, misEmpresas: criterio.empresas, fuera,
      esTuPuesto, esTuEmpresa, prioritario, llegaOEsTuyo, pedido, enLista, esLaEmpresa, esElPuesto, deEmpresa, dePuesto,
      decideSola, enPaquetes, grupoDe, pestanaDe, diasDesdeArmado };
  }

  /* La cuenta lila de Paquetes (PLAN-UX §2.1 y §6.3; decisión D3): los paquetes armados desde la última visita a Armados. La visita
     se guarda en este navegador (en otro dispositivo vuelve a contar) y el piso es el día de la última corrida (`ultimaFecha`,
     'AAAA-MM-DD' de corridas_usuarios.fecha): nunca cuenta más que lo de esa corrida. Lo que no te interesa no cuenta. */
  const CLAVE_VISITA = 'paquetes.visitaArmados';
  function visitaArmados() { Terna.guardarLocal(CLAVE_VISITA, new Date().toISOString()); }
  function paquetesNuevos(avisos, ultimaFecha) {
    if (!ultimaFecha) return 0;
    const visita = Date.parse(String(Terna.leerLocal(CLAVE_VISITA, '') || '')) || 0;
    return (avisos || []).filter((a) => a.estado_paquete === 'armado' && a.armado_en && a.interes !== 'no_me_interesa'
      && Terna.aFechaLocal(a.armado_en) >= ultimaFecha && Date.parse(a.armado_en) > visita).length;
  }

  // Las empresas que sigue la persona (0034; datos.md 0.30): una lista de nombres en sus preferencias, como los puestos. La web
  // sabe que la migración está aplicada porque la fila de preferencias (que lee entera) trae la columna. { nombres, filas, hay }.
  function seguidasDe(prefs) {
    const hay = !!prefs && Object.prototype.hasOwnProperty.call(prefs, 'empresas_seguidas');
    const nombres = hay ? (prefs.empresas_seguidas || []).filter((x) => x && String(x).trim()) : [];
    return { nombres, filas: nombres.map((nombre) => ({ nombre, alias: null })), hay };
  }

  // Todas las filas, de a mil (PostgREST corta en mil sin avisar; qa.md §6): `armar()` devuelve la consulta, con su orden.
  async function leerTodo(armar, tam) {
    const paso = tam || 1000;
    const filas = [];
    for (let desde = 0; ; desde += paso) {
      const r = await armar().range(desde, desde + paso - 1);
      if (r.error) return { data: null, error: r.error };
      const parte = r.data || [];
      filas.push(...parte);
      if (parte.length < paso) return { data: filas, error: null };
    }
  }

  return { INTERES_INICIAL, crear, seguidasDe, leerTodo, pestanaDe, diasDesdeArmado, visitaArmados, paquetesNuevos };
})();
