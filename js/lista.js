/* Terna · js/lista.js
   La lista de Avisos tal como se abre, sin filtros de la persona (diseno.md 0.26 §6 y §7.2): lo que cuentan Inicio y Avisos tiene
   que dar lo mismo (Francisco, 07/11/2026: "dice 29 postulaciones para hacer a mano pero me figuran 9"). Las dos páginas arman
   la lista con estas mismas reglas:
   - con interés (me interesa o por decidir), dentro de las preferencias de búsqueda y desde el umbral;
   - lo "tuyo" entra desde el piso: los avisos de tus puestos ("Priorizar mis puestos", 0027) y, desde 0034, los de las empresas
     que seguís ("Priorizar mis empresas"), como los toma el motor (pipeline.md 0.4.15 §4.9 punto 3c y 0.4.24 §4.19);
   - los links de Inicio cuentan y filtran con la regla del motor y nada más (`esLaEmpresa`, `esElPuesto`): "Dos" no trae
     "Veintidós" ni "Meta" trae "Metalúrgica". Avisos los recibe como filtro exacto (`?empresa=` y `?puesto=`); lo que la persona
     escribe en el filtro sigue buscando el texto contenido, más la misma regla (`deEmpresa`, `dePuesto`). */
'use strict';

window.Lista = (function () {
  const INTERES_INICIAL = ['me_interesa', 'por_decidir'];

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
    // La lista con la que abre Avisos.
    const enLista = (a) => INTERES_INICIAL.includes(a.interes) && Aviso.pasaBusqueda(a, busqueda) && llegaOEsTuyo(a, umbral);
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
    return { criterio, umbral, piso, busqueda, puestos, filas, misPuestos: criterio.puestos, misEmpresas: criterio.empresas, fuera,
      esTuPuesto, esTuEmpresa, prioritario, llegaOEsTuyo, enLista, esLaEmpresa, esElPuesto, deEmpresa, dePuesto };
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

  return { INTERES_INICIAL, crear, seguidasDe, leerTodo };
})();
