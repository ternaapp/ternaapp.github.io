/* Terna · js/textos.js
   Los textos de la web, copiados de brand.md (0.8) y el mapa de claves de error de datos.md §11.
   El código los usa tal cual; si un texto cambia, cambia en brand.md primero y después acá. */
'use strict';

window.T = (function () {
  const n = (x) => new Intl.NumberFormat('es-AR').format(x);
  const plural = (cant, uno, varios) => (cant === 1 ? uno : varios);
  // El lema y la descripción corta, en un solo lugar: los usa también la landing (T.landing: el título, el pie y la descripción).
  // propuesta PLAN-LADOS (brand.md §2), 24/11, Francisco («da una impresión de que hace poco… va más por otro lado»): el lema es la
  // misión. Antes: «Pocos avisos, bien armados.».
  const LEMA = 'Que buscar trabajo no sea un trabajo.';
  // propuesta LOGOS (brand.md §1): la regla del nombre. «Terna Jobs» donde el producto se presenta (el <title>, la descripción,
  // la primera mención en Entrar, la invitación, el nombre accesible del logo); «Terna» a secas en las frases donde hace algo o
  // es un lugar («Terna postula por vos», «Publicado en Terna»); «terna jobs», en minúscula y dos colores, solo en el logo.
  const DESCRIPCION_CORTA = 'Terna Jobs: avisos de trabajo que ajustan con tu perfil, con el CV y la carta ya armados, y la postulación hecha donde se puede.';

  return {
    // propuesta LOGOS (brand.md §1): el nombre del producto. Es el aria-label del logo que Entrar, Crear cuenta, Contraseña y la
    // landing traen escrito en su HTML.
    marca: 'Terna Jobs',
    lema: LEMA,
    descripcionCorta: DESCRIPCION_CORTA,
    // propuesta LOGOS (brand.md §1): la primera mención es la presentación; la segunda, Terna que busca, sigue «Terna».
    // propuesta PLAN-LANDING-2 (brand.md §6.2), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»).
    // Antes: «Terna Jobs es una web privada, por invitación. Cargás tu perfil una vez y, …».
    descripcionLarga: 'Con Terna Jobs cargás tu perfil una vez y, todos los días, Terna busca avisos de trabajo nuevos, se queda con los que ajustan con vos, arma para los mejores el CV, la carta de presentación, un salario sugerido y notas para la entrevista, y postula por vos donde el formulario lo permite. Lo que no puede hacer te lo deja listo para hacerlo a mano. Vos entrás cuando querés, mirás cómo viene y marcás qué te interesa y qué postulaste vos.',

    comun: {
      irAlContenido: 'Ir al contenido',
      // propuesta LOGOS (brand.md §1): el nombre accesible del logo de la barra y del carril.
      logo: 'Terna Jobs, ir a Inicio',
      // propuesta PLAN-UX §5.1 (brand.md §6.1): Búsqueda pasa a «Empleos» y Avisos a «Paquetes» (decisión D4 de PLAN-UX §10; los
      // archivos y las claves no cambian), y nace «Cómo funciona», la página 13, en la hoja de Cuenta y en el carril.
      pestanas: { inicio: 'Inicio', busqueda: 'Empleos', avisos: 'Paquetes', postulaciones: 'Postulaciones', perfil: 'Mi perfil', preferencias: 'Preferencias', invitaciones: 'Invitaciones', admin: 'Admin', alertas: 'Guías de alertas', comoFunciona: 'Cómo funciona' },
      navegacion: 'Secciones',
      // propuesta PLAN-WEB §4.1 (brand.md §6.1): el título de la hoja de Cuenta. Desde PLAN-UX §2.1 ya no es un destino del muelle:
      // es el botón de la persona en la barra de arriba del celular.
      cuenta: 'Cuenta',
      // propuesta PLAN-UX §5.1 (brand.md §6.1): el nombre del botón de Cuenta de la barra, que es solo un ícono.
      cuentaAccesible: 'Tu cuenta',
      // propuesta PLAN-UX §5.1 (brand.md §6.1): lo que dicen las cuentas de Paquetes en el muelle y el carril, para el lector de
      // pantalla (lila, los paquetes nuevos; ámbar, los avisos por decidir: decisión D3).
      paquetesNuevos: (x) => (x === 1 ? ', 1 paquete nuevo' : ', ' + n(x) + ' paquetes nuevos'),
      porDecidirCuenta: (x) => (x === 1 ? ', 1 por decidir' : ', ' + n(x) + ' por decidir'),
      salir: 'Salir',
      // El botón del sol o la luna (brand.md 0.17 §6.1): su nombre dice a qué modo pasa.
      tema: { aOscuro: 'Pasar a modo oscuro', aClaro: 'Pasar a modo claro' },
      guardar: 'Guardar', cancelar: 'Cancelar', cerrar: 'Cerrar', volver: 'Volver', probarDeNuevo: 'Probar de nuevo',
      entendido: 'Entendido', deshacer: 'Deshacer', copiar: 'Copiar',
      // El estado de un interruptor (Preferencias y Mi perfil; diseno.md §10.6).
      si: 'Sí', no: 'No',
      guardado: 'Guardado.',
      copiado: 'Copiado.',
      copiarFallo: 'Seleccioná el texto y copialo.',
      cargando: 'Cargando…',
      sigueCargando: 'Sigue cargando. Si no aparece nada, probá de nuevo.',
      // propuesta PLAN-UX §5.1 (brand.md §2): el lema y la línea de privacidad salen del pie de las páginas con sesión
      // (Terna.dibujarPie ya no dibuja nada) y quedan en Entrar, Crear cuenta y Contraseña, que los traen escritos en su HTML.
      // Sin uso en el código mientras tanto.
      // propuesta PLAN-LADOS (brand.md §2), 24/11: el lema es la misión. Antes: «Pocos avisos, bien armados.».
      pie1: 'Que buscar trabajo no sea un trabajo.',
      // propuesta PLAN-LANDING-2 (brand.md §6.2), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»). Antes: «Web privada, por invitación. Tus datos solo los
      // ves vos.».
      pie2: 'Tus datos solo los ves vos.',
      // propuesta LOGOS (brand.md §1): el <title> de cada página («Preferencias | Terna Jobs»). Lo usan también Crear cuenta y
      // Contraseña (js/cuenta.js).
      titulo: (pestana) => pestana + ' | Terna Jobs',
    },

    bandas: {
      pausada: 'Tu cuenta está pausada. Terna no busca avisos, no arma documentos ni postula hasta que la reanudes.',
      reanudar: 'Reanudar cuenta',
      incompleto: (falta) => 'Terna todavía no busca avisos para vos: falta ' + falta + '.',
      completar: 'Completar perfil',
      sinConexion: 'Sin conexión. Lo que ves puede estar desactualizado.',
    },
    faltantes: { nombre: 'el nombre', ciudad: 'la ciudad', experiencia: 'un trabajo o un estudio', idioma: 'un idioma' },

    cuenta: {
      // propuesta LOGOS (brand.md §1 y §6.2): la primera mención en la pantalla de Entrar.
      entrarTitulo: 'Entrar a Terna Jobs',
      mail: 'Mail', contrasena: 'Contraseña',
      mostrar: 'Mostrar contraseña', ocultar: 'Ocultar contraseña',
      entrar: 'Entrar',
      olvide: 'Olvidé mi contraseña',
      sinSmtp: 'Por ahora, para cambiar la contraseña escribile a Francisco.',
      // propuesta PLAN-LANDING-2 (brand.md §6.2), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»).
      // Antes porInvitacion: «Terna es por invitación. Si no tenés cuenta, pedile una invitación a alguien que ya la use.».
      sinCuenta: '¿Todavía no tenés cuenta?',
      crearTitulo: 'Crear tu cuenta',
      // propuesta LOGOS (brand.md §1 y §6.2): quien recibe la invitación oye el nombre por primera vez.
      teInvito: (nombre) => nombre + ' te invitó a Terna Jobs.',
      nombre: 'Nombre',
      mailInvitacion: 'Es el mail de tu invitación.',
      contrasenaAyuda: 'Al menos 8 caracteres',
      crear: 'Crear cuenta',
      crearNota: 'Terna guarda tu perfil y tus documentos para armar postulaciones. Solo los ves vos.',
      cuentaCreada: 'Cuenta creada. Ahora cargá tu perfil.',
      // Elegir el modo, una vez, después de Crear cuenta (brand.md 0.17 §6.2).
      modoTitulo: '¿Cómo querés ver Terna?',
      // propuesta PLAN-WEB §4.1 (brand.md §6.2): que el paso del modo diga que es el segundo y el último (FEEDBACK-2, textos).
      modoUltimo: 'Último paso.',
      // propuesta PLAN-WEB §4.1 (brand.md §6.2): sin "de arriba", porque en escritorio el botón va abajo, en el carril.
      modoAyuda: 'Lo podés cambiar cuando quieras con el sol o la luna.',
      modoGrupo: 'Modo',
      modoDispositivo: 'Igual que tu dispositivo',
      modoDispositivoAhora: (oscuro) => (oscuro ? 'Ahora está en oscuro.' : 'Ahora está en claro.'),
      modoClaro: 'Claro',
      modoOscuro: 'Oscuro',
      modoSeguir: 'Seguir',
      cambiarTitulo: 'Cambiar la contraseña',
      mandarLink: 'Mandar el link',
      linkMandado: 'Si ese mail tiene cuenta, te llega un link para cambiar la contraseña. Fijate también en correo no deseado.',
      nuevaTitulo: 'Nueva contraseña',
      nueva: 'Contraseña nueva', repetila: 'Repetila',
      guardarContrasena: 'Guardar contraseña',
      contrasenaGuardada: 'Contraseña guardada. Ya podés entrar.',
      // propuesta PLAN-LANDING §4.13 (brand.md §6.2): los renglones nuevos de Entrar, debajo de la nota de la invitación (los
      // dibuja js/cuenta.js, paquete L1). El link es la frase entera, sin «entrá acá». comoSeEntra lleva a bienvenida.html#pedir.
      contratasPregunta: '¿Contratás?',
      // propuesta PLAN-LADOS (brand.md §6.2), 24/11: el lado de quien contrata se llama «Terna Jobs Empresas» (D1). Antes:
      // «Publicá tu aviso en Terna para contratar». Sigue yendo a contratar.html.
      contratasLink: 'Publicá tu aviso en Terna Jobs Empresas',
      // propuesta PLAN-LANDING-2 (brand.md §6.2), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»).
      // Antes comoSeEntra: «Cómo conseguir una invitación», a bienvenida.html#pedir; ahora va a los planes.
      verPlanes: 'Ver los planes',
    },

    inicio: {
      titulo: 'Inicio',
      periodo: 'Período',
      // Desde brand.md 0.13: días corridos (revisión de UX del 07/11/2026: del 1 al 7 de cada mes "Esta semana" y "Este mes" daban
      // lo mismo y el control parecía roto). Las claves siguen siendo las de antes, así el período guardado se respeta.
      periodos: { semana: '7 días', mes: '30 días', todo: 'Desde el inicio' },
      // propuesta PLAN-UX §5.2 (brand.md §6.3): la corrida se dice solo como excepción. «Corrió hoy» y «corrió ayer» salieron; de
      // antes de ayer, «La última corrida fue el {f}.»; sin corrida, «…a la mañana.».
      corrioEl: (f) => 'La última corrida fue el ' + f + '.',
      noCorrio: 'Terna todavía no corrió para vos. Corre una vez por día, a la mañana.',
      resultado: {
        sin_umbral: (u) => 'Ningún aviso llegó a tu umbral (' + u + ').',
        limite_usuario: (p) => 'Ya se armaron tus ' + p + ' paquetes del día.',
        tope_global: 'Terna paró antes de llegar a vos por el tope general. Mañana sigue.',
        no_alcanzado: 'Terna no llegó a vos en la última corrida. Mañana sigue.',
        sin_avisos: 'No apareció ningún aviso que ajuste con tu perfil.',
        armar_no: 'Armar paquetes está en No. Terna solo busca y puntúa.',
        error: 'Terna no pudo terminar tu corrida. Mañana sigue.',
      },
      comoViene: 'Cómo viene',
      cifras: { nuevos: 'Avisos nuevos sobre tu umbral', total: (x) => n(x) + ' en total', armados: 'Paquetes armados', enviadas: 'Enviadas por Terna', aMano: 'Postuladas a mano' },
      // propuesta PLAN-UX §5.2 (brand.md §6.3): las filas de «Te toca a vos», más cortas.
      aMano: (x) => plural(x, '1 para postular a mano', n(x) + ' para postular a mano'),
      paraRevisar: (x) => plural(x, '1 para revisar y enviar', n(x) + ' para revisar y enviar'),
      porDecidir: (x) => plural(x, '1 aviso por decidir', n(x) + ' avisos por decidir'),
      // propuesta PLAN-WEB §4.1 (brand.md §6.3): el título de lo que te toca, sin cifra (FEEDBACK-1 P2-2: «15 te tocan a vos» arriba
      // contradecía las filas de «Qué hay para hacer», que suman otra cosa; la cifra ya está en el muelle y en Postulaciones).
      // propuesta PLAN-UX §5.2 (brand.md §6.3): en singular, porque es una sola sección.
      tocanTitulo: 'Te toca a vos',
      // propuesta PLAN-WEB §4.1 (brand.md §6.3): el título de «Los tres de hoy», los paquetes de la última corrida.
      // propuesta PLAN-UX §5.2 (brand.md §6.3): en uso en «Lo último de Terna», sin la variante «Los tres de hoy».
      hoy: {
        titulo: 'Los paquetes de hoy',
        tituloUltima: 'Los de la última corrida',
        verPaquetes: 'Ver en Paquetes',
        // propuesta PLAN-INICIO (brand.md §6.3), 25/11: el link al lado de «Armar paquetes está en No…» en «Lo último de Terna»
        // (preferencias.html#paquetes). Con «Ningún aviso llegó a tu umbral», el link es lista.cambiarUmbral.
        cambiarArmar: 'Cambiar en Preferencias',
      },
      // propuesta PLAN-UX §5.2 (brand.md §6.3): el mismo texto, dentro de «Lo último de Terna».
      enCola: (x) => (x === 1 ? '1' : n(x)) + ' en cola: Terna postula en la próxima corrida',
      nadaPendiente: 'Nada pendiente. Terna sigue sola.',
      // propuesta PLAN-UX §5.2 (brand.md §6.3): sale de Inicio (el umbral está en «Cómo viene» › Por match); la sigue usando
      // Paquetes, en la ayuda del filtro Match (js/avisos.js).
      umbralActual: (u) => 'Umbral actual: ' + u + '.',
      // propuesta PLAN-UX §5.2 (brand.md §6.3): «Para empezar», en lugar de todo lo demás, para quien Terna todavía no corrió.
      empezar: {
        titulo: 'Para empezar',
        perfil: 'Completá tu perfil',
        preferencias: 'Revisá tus preferencias',
        empleos: 'Mientras tanto, mirá los empleos abiertos',
        como: 'Cómo funciona Terna',
        // propuesta PLAN-UX §3.1 (brand.md §6.3): el estado de cada paso. El del perfil es «Falta: …» (T.perfil.falta) o esto; el de
        // Preferencias dice qué revisar; el de Empleos, cuántos hay (T.busqueda.enInicio).
        hecho: 'Hecho',
        // propuesta PLAN-UX (brand.md §6.3), FEEDBACK-UX P2-3 (a): el «Falta: …» del paso 1 (T.perfil.falta) dice además que sin eso
        // Terna no busca. Hasta acá: «Falta: la ciudad, un trabajo o un estudio y un idioma.»
        perfilFalta: (lista) => 'Falta: ' + lista + '. Terna empieza a buscar cuando lo completes.',
        preferenciasAyuda: 'Tu umbral, los puestos que buscás y la modalidad.',
      },
      // La pregunta de las cuentas (brand.md 0.16 §6.3; diseno.md 0.29 §6, 1b): una tarjeta (desde PLAN-UX §3.1, debajo de la entrada
      // a Empleos), solo mientras no tiene respuesta y "Terna postula por vos" está en Sí. Los botones son los de la pregunta de
      // Preferencias.
      cuentas: {
        titulo: '¿Terna crea cuentas por vos?',
        texto: 'Muchas empresas grandes (las que usan Workday, SuccessFactors u Oracle) piden crear una cuenta en su sitio para postular. Si querés, Terna la crea con tu mail y postula por vos.',
        ultimoMes: (x) => plural(x, 'En el último mes te quedó 1 postulación a mano por eso.', 'En el último mes te quedaron ' + n(x) + ' postulaciones a mano por eso.'),
        saber: 'Qué conviene saber',
        // propuesta PLAN-PREFERENCIAS (brand.md §6.3): el bloque se llama Postulaciones. Antes: «…en Preferencias › Postulación.»
        listo: 'Listo. Lo cambiás cuando quieras en Preferencias › Postulaciones.',
      },
      // propuesta PLAN-UX §5.2 (brand.md §6.3): «Así funciona» salió de Inicio; su contenido, ampliado, es la página Cómo funciona
      // (T.como), con el link «Cómo funciona Terna» de «Para empezar».
      // El tablero (brand.md 0.13 §6.3; diseno.md 0.26 §6): pedido de Francisco del 07/11/2026, "más dashboard". Todo se cuenta en
      // el navegador con lo que la página ya puede leer: cero tokens.
      empresas: {
        titulo: 'Empresas que seguís',
        editar: 'Editar', editarAccesible: 'Editar las empresas que seguís',
        // "Nuevo" es lo mismo que en Paquetes: llegó en la última corrida (mis_avisos.nuevo).
        // propuesta PLAN-UX §5.2 (brand.md §6.3): salió la lista de arriba de las empresas (queda el «N nuevos» de cada una, nuevosCorto).
        // propuesta PLAN-UX (brand.md §6.3), FEEDBACK-UX P2-6: «en Paquetes», adonde lleva el link de la fila (también la de Puestos).
        // Hasta acá: «Ningún aviso en tu lista» / «1 aviso en tu lista» / «N avisos en tu lista».
        enLista: (x) => (x === 0 ? 'Ninguno en Paquetes' : n(x) + ' en Paquetes'),
        nuevosCorto: (x) => plural(x, '1 nuevo', n(x) + ' nuevos'),
        vacio: 'Todavía no seguís ninguna empresa.',
        vacioAyuda: 'Escribí las que te interesan y Terna marca sus avisos cuando llegan, aunque no lleguen a tu umbral.',
        seguir: 'Seguir una empresa',
        apagado: 'Priorizar mis empresas está en No: ves sus avisos solo si llegan a tu umbral.',
      },
      puestos: {
        titulo: 'Puestos que buscás',
        editar: 'Editar', editarAccesible: 'Editar los puestos que buscás',
        mejor: 'Mejor match',
        vacio: 'Todavía no escribiste los puestos que buscás.',
        vacioAyuda: 'Con ellos, Terna pone primero los avisos de esos puestos.',
        escribir: 'Escribir puestos',
        apagado: 'Priorizar mis puestos está en No: Terna los cuenta, pero no los pone primero.',
      },
      // propuesta PLAN-UX §5.2 (brand.md §6.3): «Tu lista hoy» salió de Inicio con su intro, «Dónde se postula», «Empresas con más
      // avisos» y el vacío. Queda «Por match» (franjas), plegado en «Cómo viene»; seguir, seguirAccesible, laSeguis, siguiendo y
      // dejaste pasan a la ficha de Empleos.
      lista: {
        franjas: 'Por match',
        franjasNota: (piso) => 'Cuenta también los que no llegan a tu umbral, desde ' + piso + '.',
        cambiarUmbral: 'Cambiar el umbral',
        seguir: 'Seguir', seguirAccesible: (e) => 'Seguir ' + e,
        laSeguis: 'La seguís',
        siguiendo: (e) => 'Ahora seguís a ' + e + '.',
        dejaste: (e) => 'Dejaste de seguir a ' + e + '.',
      },
      semanas: {
        titulo: 'Semana a semana',
        intro: 'Las últimas 8 semanas, de 7 días cada una. La barra oscura es la de ahora.',
        estaSemana: 'Esta semana',
        anterior: (x) => n(x) + ' la semana anterior',
        verTabla: 'Ver como tabla', verGrafico: 'Ver como gráfico',
        tabla: 'Semana a semana, en tabla',
        semana: 'Semana',
        rango: (d1, d2) => d1 + ' al ' + d2,
        valor: (rango, x) => rango + ': ' + n(x),
      },
    },

    avisos: {
      // propuesta PLAN-UX §5.3 (brand.md §6.4): la página es «Paquetes» (decisión D4) y la cuenta sale del título (`cuenta`, «1 aviso /
      // N avisos», la sacó P2).
      titulo: 'Paquetes',
      // propuesta PLAN-UX §5.3 (brand.md §6.4): en uso en el botón único de filtros del celular (Filtros.botonUnico).
      filtrar: 'Filtrar',
      filtrarCon: (x) => 'Filtrar (' + x + ')',
      ordenarPor: 'Ordenar por',
      ordenMatch: 'Match', ordenNuevos: 'Más nuevos',
      // Priorizar mis puestos (brand.md 0.5.4 §6.4; diseno.md 0.18 §7.2 y §7.3; datos.md 0.22, 0027)
      ordenPuestos: 'Tus puestos primero',
      // Desde 0034, las empresas que seguís (brand.md 0.13 §6.4): el chip; el orden no cambia (sus paquetes van por match).
      // "Empresa que seguís" y no "Tu empresa", que se lee como dónde trabajás (revisión de UX del 07/11/2026). Debajo del umbral Terna no
      // la arma sola (versión 1): la explicación lo dice.
      tuEmpresa: 'Empresa que seguís',
      tuEmpresaExplicacion: (empresa, llega) => 'Es de una empresa que seguís ("' + empresa + '").'
        + (llega ? ' Terna le arma el paquete por su match, como a los demás.' : ' No llega a tu umbral: Terna no le arma el paquete sola. Si te interesa, pedilo.'),
      tuPuesto: 'Tu puesto',
      tuPuestoExplicacion: (puesto, llega) => 'Está en tus puestos ("' + puesto + '"). Terna lo pone primero para el paquete y la postulación'
        + (llega ? '.' : ', aunque no llegue a tu umbral.'),
      filtros: {
        interes: 'Interés', paquete: 'Paquete', postulacion: 'Postulación', modalidad: 'Modalidad', alcance: 'Alcance',
        matchMinimo: 'Match mínimo', matchMinimoChip: (x) => 'Match mínimo: ' + x,
        // Match elige entre tres según el umbral (brand.md 0.20 §6.4; diseno.md 0.32 §7.2; Francisco, 12/11/2026: un filtro para
        // "Bajo tu umbral"): los que llegan, los que quedan debajo o todos (`mostrarBajo`: hasta brand.md 0.19, la casilla
        // "Mostrar también los que no llegan a mi umbral"). Con "Bajo mi umbral", el botón dice "Bajo tu umbral"
        // (T.avisos.bajoUmbral), como cada aviso de esa lista; si además se subió el mínimo, "60 a 69".
        mostrarGrupo: 'Mostrar',
        mostrarLlegan: 'Llegan a mi umbral',
        mostrarSoloBajo: 'Bajo mi umbral',
        mostrarBajo: 'Todos',
        matchResumenSolo: (desde, hasta) => (desde === hasta ? String(desde) : desde + ' a ' + hasta),
        aplicar: 'Aplicar filtros', limpiar: 'Limpiar', limpiarFiltros: 'Limpiar filtros',
        quitar: (x) => 'Quitar el filtro ' + x,
        todos: 'Todos', todas: 'Todas',
        // La barra de filtros de Avisos (brand.md 0.4.10 §6.4): un botón por filtro, que arranca en las preferencias.
        barra: 'Filtros',
        nombres: { modalidad: 'Modalidad', alcance: 'Alcance', nivel: 'Nivel', jornada: 'Jornada', match: 'Match', interes: 'Interés', paquete: 'Paquete', postulacion: 'Postulación', donde: 'Dónde se postula', prioridad: 'Prioridad' },
        boton: (nombre, valor) => nombre + ': ' + valor,
        todosDe: { modalidad: 'Todas', alcance: 'Ambos', nivel: 'Todos', jornada: 'Ambas', interes: 'Todos' },
        yY: (x, y) => x + ' y ' + y,
        sin: (x) => 'sin ' + x,
        nDe: (x, total) => x + ' de ' + total,
        matchResumen: (x) => x + ' o más',
        matchResumenPuestos: (x) => x + ' o más y tus puestos',
        matchPuestos: (piso) => 'Tus puestos se ven desde ' + piso + ', aunque no lleguen a este número.',
        matchResumenTuyos: (x, puestos, empresas) => x + ' o más y ' + (puestos && empresas ? 'lo tuyo' : empresas ? 'tus empresas' : 'tus puestos'),
        matchTuyos: (piso, puestos, empresas) => (puestos && empresas ? 'Tus puestos y los avisos de tus empresas' : empresas ? 'Los avisos de tus empresas' : 'Tus puestos')
          + ' se ven desde ' + piso + ', aunque no lleguen a este número.',
        cambiadoAccesible: ', cambiado',
        segunPreferencias: 'Según tus preferencias.',
        cambiarPreferencias: 'Cambiarlas',
        volverPreferencias: 'Volver a mis preferencias',
        enPreferencias: (x) => 'En tus preferencias: ' + x + '.',
        usarPreferencias: 'Usar mis preferencias',
        alMenosUna: 'Dejá al menos una opción marcada.',
        sinDato: {
          modalidad: 'Si un aviso no dice la modalidad, aparece igual.',
          nivel: 'Si un aviso no dice el nivel, aparece igual.',
          jornada: 'Si un aviso no dice la jornada, aparece igual.',
        },
        listo: 'Listo',
        // propuesta PLAN-WEB §4.1 (brand.md §6.4): «Más filtros», desde 768 px, en Avisos, Búsqueda y Postulaciones; a la vista va
        // solo el número, y la cuenta entera es para el lector de pantalla.
        masFiltros: 'Más filtros',
        masFiltrosCuenta: (x) => plural(x, '1 filtro más', n(x) + ' filtros más'),
        // Filtros por columna (brand.md 0.8 §6.4 y §6.5; diseno.md 0.21 §10.18): cada encabezado de la tabla abre el suyo.
        columnas: {
          puesto: 'Puesto', empresa: 'Empresa', ubicacion: 'Ubicación', publicado: 'Publicado',
          requisitos: 'Requisitos', recorrido: 'Recorrido', etapa: 'Etapa', fecha: 'Fecha',
        },
        todosColumna: { puesto: 'Todos', empresa: 'Todas', ubicacion: 'Todas', publicado: 'Todos', requisitos: 'Todos', recorrido: 'Todas', etapa: 'Todas', fecha: 'Todas', paquete: 'Todos', postulacion: 'Todas', donde: 'Todos', prioridad: 'Todas' },
        filtradoAccesible: ', filtrado',
        texto: {
          etiqueta: 'Contiene',
          ayuda: 'Sin importar mayúsculas ni tildes. Con varias palabras, muestra los que tienen todas.',
          valor: (x) => '"' + x + '"',
        },
        valores: {
          cantidad: (x) => '(' + x + ')',
          buscar: 'Buscar',
          ninguno: 'Ninguno coincide.',
        },
        fecha: {
          comparar: 'Comparar',
          op: { desde: 'Desde', hasta: 'Hasta', el: 'El día' },
          etiqueta: 'Fecha',
          ayuda: 'Desde y Hasta incluyen el día que elegís.',
          borrar: 'Borrar la fecha',
          resumen: { desde: (f) => 'desde el ' + f, hasta: (f) => 'hasta el ' + f, el: (f) => 'el ' + f },
        },
        requisitos: {
          cumple: 'Cumplís los requisitos', a_confirmar: 'Requisitos a confirmar', falta: 'Faltan requisitos',
          sobra_nivel: 'Nivel más bajo que el tuyo', falta_nivel: 'Nivel más alto que el tuyo', sin_dato: 'Sin veredicto',
        },
        // Prioridad, en Avisos (brand.md 0.20 §6.4; diseno.md 0.32 §1.40; Francisco, 12/11/2026: un filtro para "Tu puesto", con
        // el nombre que eligió): lo que la persona le pidió a Terna que priorice. Los dos primeros son los chips del aviso.
        prioridad: { tu_puesto: 'Tu puesto', empresa: 'Empresa que seguís', demas: 'Los demás' },
        // propuesta PLAN-PREFERENCIAS (brand.md §6.4): Búsqueda pasó a Empleos. Antes: «…en Preferencias › Búsqueda: …».
        prioridadAyuda: (puestos, empresas) => 'Es lo que le pediste a Terna que priorice en Preferencias › Empleos: '
          + (puestos && empresas ? 'tus puestos y las empresas que seguís' : empresas ? 'las empresas que seguís' : 'tus puestos') + '.',
        ordenar: { match: 'Ordenar por match', nuevos: 'Ordenar por más nuevos' },
      },
      interes: { me_interesa: 'Me interesa', por_decidir: 'Por decidir', no_me_interesa: 'No me interesa' },
      interesGrupo: (puesto) => 'Interés en ' + puesto,
      paquete: { sin_armar: 'Sin armar', pedido: 'Pedido', armado: 'Armado', no_se_pudo_armar: 'No se pudo armar', sin_texto: 'Sin texto', por_puntuar: 'Por puntuar' },
      postulacion: { pendiente: 'Pendiente', en_cola: 'En cola', para_revisar: 'Para revisar', enviada: 'Enviada por Terna', a_mano: 'Para postular a mano', postulado: 'Postulada a mano' },
      modalidad: { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' },
      modalidadMin: { remoto: 'remoto', hibrido: 'híbrido', presencial: 'presencial' },
      alcance: { local: 'Local', exterior: 'Exterior' },
      alcanceMin: { local: 'local', exterior: 'exterior' },
      nivelMin: { pasantia: 'pasantía', junior: 'junior', semi_senior: 'semi senior', senior: 'senior', lider: 'líder o gerente', director: 'director' },
      jornadaMin: { completa: 'jornada completa', parcial: 'jornada parcial' },
      fuera: 'Fuera de tus preferencias',
      fueraAccesible: (m) => 'Fuera de tus preferencias: ' + m,
      fueraExplicacion: (m) => 'No entra en tus preferencias de búsqueda (' + m + '). Terna no lo arma ni lo postula por su cuenta; si pedís el paquete, sí.',
      faltaUno: 'Falta un requisito',
      faltan: (x) => 'Faltan ' + x + ' requisitos',
      // El veredicto de requisitos al lado del match (brand.md 0.4.19 §6.4 y §6.10; match.v2, datos.md 0.20, 0025). Hasta
      // match.v1 iba "Falta un requisito" / "Faltan {n} requisitos" con todo lo de requisitos_faltantes.
      calificacion: {
        cumple: 'Cumplís los requisitos',
        a_confirmar: (x) => (x === 1 ? 'Un requisito a confirmar' : x + ' requisitos a confirmar'),
        falta: (x) => (x === 1 ? 'Falta un requisito' : 'Faltan ' + x + ' requisitos'),
        sobra_nivel: 'Nivel más bajo que el tuyo',
        falta_nivel: 'Nivel más alto que el tuyo',
      },
      // "No me interesa" con motivo (brand.md 0.4.19 §6.4): opcional, después de marcarlo.
      motivo: {
        decir: 'Decir por qué',
        decirLargo: 'Decir por qué no te interesa',
        cambiar: 'Cambiar',
        titulo: '¿Por qué no te interesa?',
        ayuda: 'Es opcional. Terna lo usa para medir si el match acierta; no cambia nada de este aviso.',
        opciones: {
          otra_funcion: 'No es mi trabajo',
          sobra_nivel: 'Es de un nivel más bajo que el mío',
          falta_nivel: 'Es de un nivel más alto que el mío',
          requisitos: 'Piden algo que no tengo',
          condiciones: 'Ubicación, modalidad, horario o sueldo',
          empresa: 'La empresa o el rubro',
          otro: 'Otro motivo',
        },
        elegi: 'Elegí un motivo.',
        linea: (m) => 'Por qué no te interesa: ' + m + '.',
      },
      hoy: 'hoy', ayer: 'ayer', haceDias: (x) => 'hace ' + x + ' días',
      nuevo: 'nuevo',
      matchAccesible: (m, llega) => 'Match ' + m + ' de 100, ' + (llega ? 'llega a tu umbral' : 'no llega a tu umbral'),
      sinMatch: 'Sin match todavía',
      matchPalabra: 'match',
      // propuesta PLAN-UX §5.3 (brand.md §6.4): sale el cartel «por decidir» de Avisos con su botón (`porDecidir.ver`,
      // `porDecidir.verAccesible`; lo sacó P2): pasa a ser el grupo «Te toca decidir» y el punto de la pestaña Por armar.
      bajoUmbral: 'Bajo tu umbral',
      viejo: 'Aviso viejo o republicado',
      viejoAccesible: 'Aviso viejo o republicado: puede que ya no esté vigente',
      viejoExplicacion: 'Tiene más de 45 días, se volvió a publicar varias veces o no dice la empresa. Puede que ya no esté vigente. El match no cambia.',
      bajoMinimo: 'Paga menos que tu mínimo',
      bajoMinimoExplicacion: 'El aviso o el mercado pagan menos de lo que pedís. El salario sugerido es tu mínimo; vos decidís si postulás igual.',
      columnas: { puesto: 'Puesto', empresa: 'Empresa', modalidad: 'Modalidad', ubicacion: 'Ubicación', match: 'Match', paquete: 'Paquete', postulacion: 'Postulación', donde: 'Dónde se postula', interes: 'Interés', publicado: 'Publicado', aviso: 'Aviso' },
      abrirEn: (fuente) => 'Abrir aviso en ' + fuente,
      // propuesta PLAN-PANTALLAS (brand.md §6.4), 25/11: «Abrir aviso» en una lista (Postulaciones › A mano), al lado de «Marcar
      // postulado»; el sitio sigue en el nombre accesible (abrirEnAccesible, abrirEnEmpresaAccesible) y en la ficha.
      abrirCorto: 'Abrir aviso',
      abrirEnAccesible: (fuente) => 'Abrir aviso en ' + fuente + ', abre en otra pestaña',
      // Dónde se postula (brand.md 0.10 §6.4; diseno.md 0.23 §7.6; Francisco, 06/11/2026): Terna, Easy Apply de LinkedIn, el sitio de
      // la empresa o un portal de empleo. La palabra corta va en la columna, la tarjeta y el filtro; la explicación, en la ficha.
      // Dónde se postula (brand.md 0.10 §6.4): quién postula y dónde, en pocas palabras; la primera dice si lo hace Terna o vos.
      donde: {
        terna: 'Postula Terna',
        easy_apply: 'A mano en LinkedIn (Easy Apply)',
        empresa: 'A mano en el sitio de la empresa',
        empresaCuenta: 'A mano en el sitio (pide cuenta)',
        portal: (nombre) => 'A mano en ' + nombre,
        confirmar: 'LinkedIn, a confirmar',
        // Un aviso que alguien publicó en Terna para contratar (contratar.md 0.1 §8.2; datos.md 0.44, 0055).
        enTernaVos: 'A mano, desde Terna',
      },
      dondeFiltro: { terna: 'Postula Terna', easy_apply: 'A mano en LinkedIn (Easy Apply)', empresa: 'A mano en el sitio de la empresa', portal: 'A mano en un portal de empleo', confirmar: 'LinkedIn, a confirmar' },
      dondeExplicacion: {
        terna: 'La empresa usa un formulario que Terna sabe completar: cuando arma el paquete, Terna postula sola.',
        ternaRevisa: 'La empresa usa un formulario que Terna sabe completar: cuando arma el paquete, lo llena y espera que lo revises en Postulaciones para enviarlo.',
        ternaNo: 'Terna sabe completar este formulario, pero "Terna postula por vos" está en No: lo hacés vos en el sitio de la empresa. Se cambia en Preferencias.',
        ternaNoPudo: 'Terna intentó postular y no pudo (el motivo está en la postulación): lo hacés vos en el sitio de la empresa.',
        easy_apply: 'Se postula desde tu cuenta de LinkedIn, con Easy Apply (Solicitud sencilla). Terna no usa tus cuentas: lo hacés vos, en un par de minutos.',
        empresa: 'Se postula en el sitio de la empresa, en un formulario que Terna todavía no sabe completar: lo hacés vos.',
        // propuesta PLAN-UX (brand.md §6.10): desde que Terna crea cuentas por vos (js/cuentas.js, PARA_TODOS en true) ya no es cierto
        // que «no crea ni usa cuentas». Hasta acá: «…Terna no crea ni usa cuentas: lo hacés vos.»
        // propuesta PLAN-PREFERENCIAS (brand.md §6.10): el bloque se llama Postulaciones. Antes: «…en Preferencias › Postulación.»
        empresaCuenta: 'El sitio de la empresa pide crear una cuenta para postular, y esta Terna no la crea: lo hacés vos. Terna crea cuentas solo en algunos sitios y si se lo pediste en Preferencias › Postulaciones.',
        empresaViaLinkedin: 'El botón "Postularse" del aviso en LinkedIn lleva al sitio de la empresa, y ahí Terna no encontró un formulario que sepa completar: lo hacés vos.',
        // Desde brand.md 0.23 sin "Si no querés esperar, pegá el texto.": la persona ya no pega textos.
        confirmar: 'Terna todavía no leyó la página del aviso en LinkedIn. La lee en las próximas corridas (una por día): trae el texto y te dice si se postula con Easy Apply o en el sitio de la empresa.',
        linkedin: 'Se postula desde el aviso en LinkedIn: su página no dice si es con Easy Apply o en el sitio de la empresa. Lo ves al abrirlo.',
        portal: (nombre) => 'Se postula con tu cuenta de ' + nombre + '. Terna no usa tus cuentas: lo hacés vos.',
        // Los avisos publicados en Terna (contratar.md 0.1 §8.2): no hay formulario, la postulación le llega a quien lo publicó.
        enTerna: 'Lo publicaron en Terna: cuando arma el paquete, Terna le manda tu postulación a quien lo publicó, sin formularios.',
        enTernaRevisa: 'Lo publicaron en Terna: cuando arma el paquete, Terna espera que lo revises en Postulaciones y, al enviarlo, le llega a quien lo publicó.',
        enTernaVos: 'Lo publicaron en Terna. Con «Terna postula por vos» en No, lo mandás vos con «Postular en Terna», en la ficha del aviso.',
      },
      abrirEnEmpresa: 'Abrir aviso en el sitio de la empresa',
      abrirEnEmpresaAccesible: 'Abrir aviso en el sitio de la empresa, abre en otra pestaña',
      verEnFuente: (fuente) => 'Ver el aviso en ' + fuente,
      deAlerta: (fuente) => 'alerta de ' + fuente,
      noTeInteresa: 'No te interesa. Terna no arma ni postula este aviso.',
      teInteresa: 'Te interesa. Terna lo toma en la próxima corrida.',
      pedirPaquete: 'Pedir paquete',
      // Desde brand.md 0.8 "Pedir" va en la columna Paquete, debajo de "Sin armar", y pide confirmación (Francisco, 06/11/2026).
      pedir: 'Pedir',
      pedirAccesible: (puesto) => 'Pedir el paquete de ' + puesto,
      // Debajo de "Sin texto" (brand.md 0.23 §6.4; Francisco, 12/11/2026: "que muestre sin texto en cola para evaluar… no quiero que
      // tenga el usuario final el permiso para pegar el texto"): quién lo está buscando. Hasta 0.22, el botón "Pegar texto".
      sinTextoLinea: { buscando: 'Terna lo busca', admin: 'Lo busca Francisco' },
      // El nombre del grupo de las pestañas de Paquetes, para el lector de pantalla (hasta PLAN-UX, de la franja Todos / Esta semana).
      mostrar: 'Mostrar',
      // propuesta PLAN-UX §5.3 (brand.md §6.4): las dos pestañas de Paquetes, Armados y Por armar (PLAN-UX §2.2). Con la franja Todos /
      // Esta semana salieron (P2) `vistas.todos` y `vistas.semana`, `vistaSemanaExplicacion`, `partes` («N con paquete · N sin paquete
      // · N sin texto»), `mes` («En los últimos 30 días llegaron N.»), `vacioSemana` y `verTodos`.
      vistas: { armados: 'Armados', por_armar: 'Por armar' },
      // propuesta PLAN-UX §5.3 (brand.md §6.4): los grupos de las dos pestañas (PLAN-UX §3.2). En Armados, por fecha de armado y,
      // arriba, lo que no se pudo armar; en Por armar, lo que te toca decidir, tus pedidos, lo que sigue Terna, lo que espera y,
      // plegado, lo que Terna no arma sola.
      grupos: {
        hoy: 'Hoy',
        semana: 'Esta semana',
        antes: 'Antes',
        noSePudo: 'No se pudo armar',
        // agregado por P0 (PLAN-UX §3.2: «rojo, "Terna lo reintenta mañana"»): la ayuda del grupo.
        noSePudoAyuda: 'Terna lo reintenta mañana.',
        decidir: 'Te toca decidir',
        decidirAyuda: 'Terna espera tu marca para armarlos.',
        pedidos: 'Tus pedidos',
        sigue: 'Después sigue Terna',
        // propuesta PLAN-UX (brand.md §6.4), FEEDBACK-UX P3-1: la ayuda da una razón, no promete una lista. Hasta acá: «Más o menos
        // en este orden: Terna arma uno por empresa por día y antes prueba cada formulario.»
        sigueAyuda: 'El orden es aproximado: Terna arma uno por empresa por día y antes prueba cada formulario.',
        esperan: 'Esperan',
        noArma: (x) => plural(x, 'Ver 1 que Terna no arma sola', 'Ver ' + n(x) + ' que Terna no arma sola'),
      },
      // propuesta PLAN-UX §5.3 (brand.md §6.4): cuándo se armó, al pie de cada carpeta de Armados.
      armadoEl: (f, dias) => (dias === 0 ? 'Armado hoy' : dias === 1 ? 'Armado ayer' : 'Armado el ' + f),
      // agregado por P2 (PLAN-UX §3.2): el nombre accesible de «Ver en Postulaciones» al pie de cada carpeta de Armados (en una lista
      // hay muchos; lo visible es T.avisos.ficha.verEnPostulaciones).
      verEnPostulacionesAccesible: (puesto) => 'Ver ' + puesto + ' en Postulaciones',
      // agregado por P0 (PLAN-UX §3.2 y §8, P0.4: la fila de documentos de una carpeta): lo visible son los nombres de la ficha
      // (T.avisos.ficha.cv, carta, notas y salarioCorto); el nombre accesible suma el puesto, porque en una lista hay muchos «CV».
      docs: {
        grupo: (puesto) => 'Documentos de ' + puesto,
        cv: (puesto) => 'CV de ' + puesto,
        carta: (puesto) => 'Carta de ' + puesto,
        notas: (puesto) => 'Notas para la entrevista de ' + puesto,
      },
      noMeInteresaAccesible: (puesto) => 'No me interesa ' + puesto,
      // Hasta brand.md 0.7 decía "Pedido. Terna lo arma en la próxima corrida y usa uno de tus {3} paquetes del día."
      pedido: (lugar, corridas) => (corridas <= 1 ? 'Pedido. Terna lo arma en la próxima corrida.'
        : 'Pedido. Va ' + lugar + '.º: Terna lo arma dentro de ' + corridas + ' corridas.'),
      // propuesta PLAN-UX (brand.md §6.4), FEEDBACK-UX P2-3 (c): con el perfil incompleto Terna no corre, así que no hay «próxima
      // corrida» que prometer (el par de confirmarPedir.lugarIncompleto).
      pedidoIncompleto: 'Pedido. Terna lo arma cuando completes tu perfil.',
      pedidoLugar: (lugar, corridas) => lugar + '.º · ' + (corridas <= 1 ? 'próxima corrida' : 'en ' + corridas + ' corridas'),
      // propuesta PLAN-UX §5.3 (brand.md §6.4): «Próximos paquetes» pasa a «Tus pedidos» en todos los textos que la nombran.
      pedidoLugarAccesible: (lugar, corridas) => 'Lugar ' + lugar + ' de tus pedidos: ' + (corridas <= 1 ? 'Terna lo arma en la próxima corrida' : 'Terna lo arma dentro de ' + corridas + ' corridas'),
      cancelarPedido: 'Cancelar pedido',
      pedidoCancelado: 'Pedido cancelado.',
      confirmarPedir: {
        titulo: 'Pedir el paquete',
        si: 'Pedir paquete',
        // propuesta PLAN-UX §5.3 y §5.4 (brand.md §6.4): «tus pedidos» en lugar de «tus próximos paquetes», y la regla en una oración
        // corta (el diálogo pasa de cinco renglones a tres).
        lugar: (lugar, corridas, cupo) => (corridas <= 1
          ? (lugar === 1 ? 'Va primero en tus pedidos: Terna lo arma en la próxima corrida.' : 'Va ' + lugar + '.º en tus pedidos: Terna lo arma en la próxima corrida.')
          : 'Va ' + lugar + '.º en tus pedidos. Terna arma ' + cupo + ' por día, así que lo arma dentro de ' + corridas + ' corridas.'),
        // propuesta PLAN-UX (brand.md §6.4 y §6.3.1), FEEDBACK-UX P2-3 (c): el primer renglón con el perfil incompleto. Hasta acá
        // decía, también entonces, «…Terna lo arma en la próxima corrida.»
        lugarIncompleto: (lugar) => (lugar === 1 ? 'Va primero en tus pedidos.' : 'Va ' + lugar + '.º en tus pedidos.') + ' Terna lo arma cuando completes tu perfil.',
        regla: (cupo) => 'Usa uno de tus ' + cupo + ' paquetes de ese día y va antes que lo que Terna elige sola.',
        postula: 'Después, si el formulario lo permite, Terna postula por vos.',
        revisa: 'Después, si el formulario lo permite, Terna lo llena y te lo deja para revisar antes de enviar.',
      },
      confirmarNoInteresa: {
        titulo: 'No me interesa',
        si: 'No me interesa',
        // propuesta PLAN-UX §5.3 (brand.md §6.4): «en Paquetes» por el nombre nuevo de la página.
        texto: (dias) => 'Terna no arma ni postula este aviso y lo saca de tu lista. Durante ' + dias + ' días lo ves en Paquetes, con el filtro Interés, y podés volver atrás; después se borra.',
        conDocs: (dias) => 'Terna no arma ni postula este aviso y lo saca de tu lista. Durante ' + dias + ' días lo ves en Paquetes, con el filtro Interés, y podés volver atrás; después se borra, con sus documentos y lo que Terna respondió.',
        pedido: 'También se cancela el pedido de su paquete.',
        en_cola: 'También se cancela el envío que estaba en cola.',
        para_revisar: 'También se cancela la postulación que esperaba tu revisión.',
        enviada: 'Lo que ya se envió queda en el empleador.',
        motivo: 'Por qué (opcional)',
      },
      // Próximos paquetes (brand.md 0.8 §6.4; diseno.md 0.21 §7.8; datos.md 0.25, 0029): la cola de lo que la persona pidió.
      // propuesta PLAN-UX §5.3 (brand.md §6.4): «Tus pedidos», dentro de Paquetes › Por armar y arriba también en el celular (el id
      // #proximos no cambia).
      proximos: {
        titulo: 'Tus pedidos',
        intro: (cupo) => 'Terna arma ' + cupo + ' por día y empieza por acá.',
        cuando: (corridas) => (corridas <= 1 ? 'Próxima corrida' : 'En ' + corridas + ' corridas'),
        subir: (puesto) => 'Subir ' + puesto,
        bajar: (puesto) => 'Bajar ' + puesto,
        cancelar: (puesto) => 'Cancelar el pedido de ' + puesto,
        movido: (puesto, lugar, total) => puesto + ': lugar ' + lugar + ' de ' + total + '.',
        resto: (n) => (n === 0 ? 'Si queda lugar, Terna no tiene otro aviso para armar: ninguno más de los que te interesan llega a tu umbral.'
          : n === 1 ? 'Si queda lugar, Terna sigue sola con el otro aviso que te interesa y llega a tu umbral.'
            : 'Si queda lugar, Terna sigue sola con los ' + n + ' avisos que te interesan y llegan a tu umbral, del mayor match para abajo.'),
        lleno: (pedidos, corridas) => (corridas <= 1 ? 'Con ' + pedidos + ' pedidos, la próxima corrida arma solo lo que pediste.'
          : 'Con ' + pedidos + ' pedidos, las próximas ' + corridas + ' corridas arman solo lo que pediste.'),
        armarNo: 'Armar paquetes está en No: Terna no arma nada, tampoco lo que pediste.',
        cambiarlo: 'Cambiarlo',
        // propuesta PLAN-UX (brand.md §6.4): Por armar sin nada que Terna vaya a armar y sin pedidos (visto con datos reales el 21/11:
        // todo caía en «Ver N que Terna no arma sola», sin decir por qué).
        nadaSola: (u) => 'Ninguno de estos lo arma Terna sola: quedan debajo de tu umbral (' + u + ') o fuera de tus preferencias. Podés pedir el que quieras.',
        cambiarUmbral: 'Cambiar el umbral',
      },
      ficha: {
        match: (m) => 'Match ' + m,
        porQue: 'Por qué ajusta',
        noCumplis: 'No cumplís',
        noCumplisONoFigura: 'No cumplís o no figura',
        // match.v2 (brand.md 0.4.19 §6.4): los requisitos con su estado y "Cómo se calcula".
        requisitos: 'Requisitos del aviso',
        veredicto: {
          cumple: 'Tu perfil muestra lo que el aviso pide como excluyente.',
          cumpleSinRequisitos: 'El aviso no pide requisitos excluyentes.',
          a_confirmar: (x) => (x === 1 ? 'Tu perfil no menciona uno de los requisitos excluyentes.' : 'Tu perfil no menciona ' + x + ' de los requisitos excluyentes.'),
          falta: (x) => (x === 1 ? 'Según tu perfil, no cumplís un requisito excluyente.' : 'Según tu perfil, no cumplís ' + x + ' requisitos excluyentes.'),
          sobra_nivel: 'El puesto es de un nivel bastante más bajo que el tuyo.',
          falta_nivel: 'El puesto es de un nivel bastante más alto que el tuyo.',
        },
        reqCumplis: 'Cumplís',
        reqNoCumplis: 'No cumplís',
        reqNoFigura: 'Tu perfil no lo menciona',
        reqNoFiguraAyuda: 'Terna no dice que no lo tengas: tu perfil no lo menciona. Si lo tenés, sumalo a Mi perfil.',
        completarPerfil: 'Completar Mi perfil',
        calculo: 'Cómo se calcula',
        calculoFuncion: { misma: 'Función: la tuya', vecina: 'Función: parecida a la tuya', otra: 'Función: otra' },
        calculoNivel: {
          acorde: 'Nivel: el tuyo', por_encima: 'Nivel: un poco más bajo que el tuyo', muy_por_encima: 'Nivel: bastante más bajo que el tuyo',
          por_debajo: 'Nivel: un poco más alto que el tuyo', muy_por_debajo: 'Nivel: bastante más alto que el tuyo',
        },
        calculoHabilidades: (tiene, pedidas) => (pedidas ? 'Habilidades del oficio: tenés ' + tiene + ' de ' + pedidas : 'Habilidades del oficio: el aviso no nombra ninguna'),
        calculoRequisitos: (c) => {
          const p = [];
          if (c.cumple) p.push('cumplís ' + c.cumple);
          if (c.no_cumple) p.push('no cumplís ' + c.no_cumple);
          if (c.no_figura) p.push(c.no_figura + ' a confirmar');
          return 'Requisitos excluyentes: ' + (p.length ? p.join(', ') : 'el aviso no pide');
        },
        puntosDe: (p, max) => p + ' de ' + max,
        puntosAccesible: (p, max) => p + ' puntos de ' + max,
        calculoSuma: (s) => 'Suma: ' + s + '.',
        calculoTope: (v, motivo) => 'Tope: ' + v + ', porque ' + motivo + '.',
        topes: {
          funcion_otra: 'es de otra función', funcion_vecina: 'la función es parecida a la tuya, no la misma',
          nivel_extremo: 'el nivel del puesto está muy lejos del tuyo', falta_uno: 'no cumplís un requisito excluyente',
          faltan_dos: 'no cumplís dos requisitos excluyentes o más', idioma_ausente: 'pide un idioma que tu perfil no tiene',
        },
        calculoMatch: (m) => 'Match ' + m + ': el ajuste entre tu perfil y el aviso, de 0 a 100. No es la probabilidad de que te llamen.',
        paquete: 'Paquete',
        cv: 'CV', cvPdf: 'CV (PDF)', carta: 'Carta', cartaPdf: 'Carta (PDF)',
        notas: 'Notas', notasLargo: 'Notas para la entrevista', notasSub: 'para la entrevista',
        pdfIdioma: (idioma) => 'PDF · ' + idioma,
        salario: (monto, moneda, periodo) => 'Salario sugerido: ' + monto + ' ' + moneda + (periodo === 'anual' ? ' por año' : ' por mes'),
        salarioSinDatos: 'Salario sugerido: sin datos',
        salarioCorto: (monto, moneda) => monto + ' ' + moneda,
        sinDatos: 'Sin datos',
        porMes: 'por mes', porAnio: 'por año',
        verPorQue: 'Ver por qué',
        idiomaDocs: (idioma) => 'Idioma de los documentos: ' + idioma + '.',
        idiomas: { es: 'español', en: 'inglés' },
        // Palabras del aviso que el CV no pudo nombrar (brand.md 0.6 §6.4; cv-ats.md 0.5 §3.13). Sin botón "Sumar" desde 0.6.
        faltanTitulo: 'Palabras del aviso que tu CV no tiene',
        faltanAyuda: 'Tu perfil no las menciona, así que Terna no las puso. Si sabés usar alguna, sumala a tus palabras clave personalizadas: desde ahí va sola en tus próximos CV.',
        faltanLink: 'Ir a mis palabras clave',
        sinDocs: 'Todavía no hay documentos para este aviso.',
        // propuesta PLAN-UX §5.3 (brand.md §6.4): «tus pedidos» en lugar de «tus próximos paquetes».
        loArma: 'Lo pediste. Terna lo arma antes que los que elige sola, en el orden de tus pedidos.',
        noSePudo: 'No se pudo armar el paquete. Terna lo reintenta mañana.',
        armarNo: 'Armar paquetes está en No.',
        postulacion: 'Postulación',
        donde: 'Dónde se postula',
        verEnPostulaciones: 'Ver en Postulaciones',
        // Desde brand.md 0.23 la persona no pega el texto: lo busca Terna y, si no lo consigue, Francisco. Hasta 0.22, "Terna no
        // tiene el texto de este aviso. Pegalo y lo puntúa en la próxima corrida." con el botón "Pegar el texto del aviso".
        sinTexto: {
          buscando: 'Terna todavía no tiene el texto de este aviso. Lo busca sola en las próximas corridas y, cuando lo consigue, lo puntúa. No tenés que hacer nada.',
          admin: 'Terna no pudo conseguir el texto de este aviso, así que lo busca Francisco a mano. Cuando lo cargue, Terna lo puntúa en la corrida siguiente. Si en unos días no aparece, el aviso sale de tu lista.',
        },
        porPuntuar: 'Terna ya tiene el texto de este aviso y lo puntúa en la próxima corrida.',
      },
      notasBloques: [
        { titulo: 'Dónde poner el foco', icono: 'i-foco', nombre: 'foco' },
        { titulo: 'De qué hablar', icono: 'i-hablar', nombre: 'hablar' },
        { titulo: 'Qué evitar o cómo manejar lo que falta', icono: 'i-alerta', nombre: 'evitar' },
        { titulo: 'Preguntas para hacer', icono: 'i-preguntar', nombre: 'preguntar' },
        { titulo: 'Salario', icono: 'i-salario', nombre: 'salario' },
      ],
      notasVacio: 'Nada para marcar en este aviso.',
      // propuesta PLAN-UX §5.3 (brand.md §6.4): los vacíos de las dos pestañas de Paquetes. vacioSinCorrida es el de Por armar
      // antes de la primera corrida.
      vacioSinCorrida: 'Todavía no hay nada por armar. Terna corre una vez por día; lo primero aparece después de la próxima corrida.',
      // propuesta PLAN-UX (brand.md §6.4), FEEDBACK-UX P2-3 (b): el mismo vacío con el perfil incompleto, con «Completar perfil»
      // (T.bandas.completar) en lugar de «Revisar preferencias»: Terna no corre hasta que esté completo.
      vacioIncompleto: 'Todavía no hay nada por armar. Terna corre una vez por día, cuando tu perfil está completo.',
      vacioArmados: (cupo) => 'Todavía no hay paquetes armados. Terna arma hasta ' + cupo + ' por día; mirá lo que viene en Por armar.',
      vacioPorArmar: 'Nada en cola. Terna arma lo próximo que llegue a tu umbral.',
      vacioSinAvisos: 'Hoy no apareció ningún aviso que ajuste con tu perfil. Mañana se vuelve a buscar. Si querés ver más, podés bajar el umbral o sumar modalidades.',
      vacioFiltros: 'Ningún aviso coincide con estos filtros.',
      vacioPreferencias: 'Ningún aviso entra en tus preferencias de búsqueda. Podés abrir uno de los filtros de arriba o cambiar tus preferencias.',
      revisarPreferencias: 'Revisar preferencias',
    },

    // Búsqueda (busqueda.md 0.2 §5; Francisco, 16/11/2026: «una tab exclusiva y dedicada a búsqueda… que en vez de buscar trabajo
    // en LinkedIn… busque trabajo dentro de nuestra plataforma»): todos los avisos abiertos de la base, para buscar a mano y pedir
    // el paquete de cualquiera. Lo que ya decía Avisos (Pedir paquete, Dónde se postula, los filtros) se dice igual y sale de ahí.
    // 0.2 es la segunda versión, después de la revisión como usuaria y como diseño (busqueda.md §8).
    busqueda: {
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): la página es «Empleos» (decisión D4); el archivo sigue siendo busqueda.html.
      titulo: 'Empleos',
      cuenta: (x) => plural(x, '1 aviso abierto', n(x) + ' avisos abiertos'),
      cuentaEmpresas: (x) => 'de ' + n(x) + ' empresas',
      cuentaDe: (x, total) => n(x) + ' de ' + n(total) + ' avisos abiertos',
      // Sin bajada desde 0.3 (busqueda.md §8, la revisión con las skills de diseño): el buscador va primero, debajo del título. Qué
      // es la lista lo dicen la cuenta y el estado de los filtros; qué hace Terna con un pedido, la confirmación y la ficha; y la
      // diferencia con Avisos, el pie.
      buscador: {
        etiqueta: 'Buscar en los avisos',
        ejemplo: 'Puesto, empresa, lugar o palabra',
        borrar: 'Borrar la búsqueda',
        buscando: 'Buscando en las descripciones…',
        // Lo que se encontró con lo escrito y los filtros puestos: por el puesto, la empresa o el lugar, y además en la descripción.
        // Desde 0.3, un solo verbo, el de los vacíos («Ningún aviso abierto coincide con…»): coincidir.
        resultado: (directos, descripcion) => (directos + descripcion === 0 ? 'Ningún aviso coincide.'
          : descripcion === 0 ? plural(directos, '1 aviso coincide', n(directos) + ' avisos coinciden') + ' en el puesto, la empresa o el lugar.'
            : directos === 0 ? plural(descripcion, '1 aviso coincide', n(descripcion) + ' avisos coinciden') + ' en la descripción.'
              : plural(directos, '1 aviso coincide', n(directos) + ' avisos coinciden') + ' en el puesto, la empresa o el lugar, y '
                + n(descripcion) + ' más en la descripción.'),
        // Los que tienen las palabras, pero no juntas: aparte, para no tapar lo que sí dice lo que se escribió (busqueda.md §8, F1).
        sueltas: (x) => plural(x, 'Ver 1 más que tiene esas palabras por separado', 'Ver ' + n(x) + ' más que tienen esas palabras por separado'),
        sinSueltas: 'Ocultar los que tienen las palabras por separado',
        soloSueltas: (x) => 'Ningún aviso lo tiene escrito así. ' + plural(x, 'Hay 1 que tiene esas palabras por separado.', 'Hay ' + n(x) + ' que tienen esas palabras por separado.'),
        corta: 'Escribí dos letras o más.',
        error: 'No se pudo buscar en las descripciones: ves lo que coincide por puesto, empresa o lugar.',
        enDescripcion: 'Coincide en la descripción',
        porSeparado: 'Tiene las palabras por separado',
      },
      // propuesta PLAN-WEB §4.1 (brand.md §6.3.1): el título de cada uno de los tres grupos de lo escrito, con su cuenta (con los
      // filtros puestos), cuando hay más de uno a la vista.
      grupos: {
        directos: (x) => plural(x, '1 coincide en el puesto, la empresa o el lugar', n(x) + ' coinciden en el puesto, la empresa o el lugar'),
        descripcion: (x) => plural(x, '1 coincide en la descripción', n(x) + ' coinciden en la descripción'),
        sueltas: (x) => plural(x, '1 tiene las palabras por separado', n(x) + ' tienen las palabras por separado'),
      },
      filtros: {
        barra: 'Filtros',
        // propuesta PLAN-UX (brand.md §6.3.1), FEEDBACK-UX P2-6: el filtro lleva el nombre de su columna (columnas.lista). Hasta acá,
        // «En tu lista».
        lista: 'Estado',
        todosLista: 'Todos',
        // propuesta PLAN-UX §5.4 (brand.md §6.3.1): sale (lo saca P3); la clave queda sin uso.
        sinFiltros: 'Sin filtros: ves todo lo abierto.',
        conPreferencias: 'Con tus preferencias de búsqueda.',
        usarPreferencias: 'Usar mis preferencias',
        limpiar: 'Limpiar filtros',
        todasEmpresas: 'Todas',
        // Empresa: son cientos, así que el filtro muestra las que más avisos tienen y busca el resto por nombre.
        buscarEmpresa: 'Buscar una empresa',
        masEmpresas: (x) => 'Y ' + n(x) + ' más: escribí el nombre para encontrarlas.',
        ningunaEmpresa: 'Ninguna empresa con avisos abiertos se llama así.',
        elegidas: 'Elegidas',
      },
      // Qué es cada aviso para la persona: nada todavía, uno de sus avisos, un paquete pedido, uno armado o una postulación hecha.
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): «En tu cola» en lugar de «En tus avisos» (ya no hay una página Avisos).
      // propuesta PLAN-UX (brand.md §6.3.1), FEEDBACK-UX P2-6: un solo nombre para lo tuyo («tu lista», «tu cola» y «tus avisos» eran
      // lo mismo). Hasta acá: lista.fuera «No está en tu lista», listaFiltro.fuera «No están en tu lista» (ahora el nombre del
      // atajo, «Que no tengo») y columnas.lista «En tu lista».
      lista: { fuera: 'No lo tenés', en_lista: 'En tu cola', pedido: 'Paquete pedido', con_paquete: 'Con paquete', postulada: 'Postulada', no_interesa: 'No te interesa' },
      listaFiltro: { fuera: 'Que no tengo', en_lista: 'En tu cola', pedido: 'Paquete pedido', con_paquete: 'Con paquete', postulada: 'Postuladas', no_interesa: 'No te interesan' },
      listaConMatch: (estado, m) => estado + ' · ' + m,
      listaConMatchAccesible: (estado, m) => estado + ', match ' + m,
      ordenEmpresa: 'Empresa (A a Z)',
      ordenMatch: 'Tu match',
      columnas: { lista: 'Estado', paquete: 'Paquete' },
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): por el nombre nuevo de la página.
      verEnAvisos: 'Ver en Paquetes',
      verEnPostulaciones: 'Ver en Postulaciones',
      mostrarMas: (x) => 'Mostrar ' + n(x) + ' más',
      mostrando: (x, total) => 'Mostrando ' + n(x) + ' de ' + n(total) + '.',
      // El lugar de algunos avisos es una lista larga de países: en la tabla, los dos primeros y esto (brand.md 0.29 §6.3.1).
      variosLugares: (primeros) => primeros + ' y otros lugares',
      // Lo que se sabe sin pedir nada (busqueda.md §8, F5): el título nombra uno de tus puestos, o la empresa es una que seguís.
      tuPuestoExplicacion: (puesto) => 'El título nombra uno de tus puestos ("' + puesto + '").',
      tuEmpresaExplicacion: (empresa) => 'Es de una empresa que seguís ("' + empresa + '").',
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): el diálogo de Pedir paquete en tres renglones. pasaALista («Pasa a tus avisos: lo
      // seguís en Paquetes, en Tus pedidos.») salió (FEEDBACK-UX P2-6: no se usaba): lo dice el aviso breve, pedidoBreve.
      confirmar: {
        sinMatch: 'Todavía no tiene tu match: Terna lo calcula antes de armar.',
      },
      // agregado por P0 (PLAN-UX §5.4 lo cita: «lo dice el aviso breve: "Pedido. Lo seguís en Paquetes."»): el aviso breve después
      // de pedir desde Empleos.
      // propuesta PLAN-UX (brand.md §6.3.1), FEEDBACK-UX P2-1: dice en qué pestaña quedó (Paquetes abre en Armados) y suma «Ver»,
      // que lleva a Tus pedidos (avisos.html#proximos). Hasta acá: «Pedido. Lo seguís en Paquetes.», solo con Deshacer.
      pedidoBreve: 'Pedido. Está en Paquetes › Por armar.',
      pedidoVer: 'Ver',
      pedidoVerAccesible: 'Ver tus pedidos en Paquetes › Por armar',
      ficha: {
        // propuesta PLAN-UX (brand.md §6.3.1), FEEDBACK-UX P2-6: el título de la sección y sus estados nombran Paquetes, adonde lleva
        // su link. Hasta acá: enTuLista «En tu lista»; estado.en_lista «Está en tus avisos…»; fueraConMatch «…no lo dejó en tu
        // lista…»; no_interesa «…vuelve a tus avisos.»; sumar «Sumar a mis avisos».
        enTuLista: 'Para vos',
        donde: 'Dónde se postula',
        datos: 'Datos del aviso',
        nivel: 'Nivel', jornada: 'Jornada', modalidad: 'Modalidad', publicado: 'Publicado', fuente: 'Fuente',
        fuenteNota: (fuente) => 'Terna lo leyó en ' + fuente + '. El texto completo está en el aviso original.',
        // Un aviso publicado en Terna para contratar (contratar.md 0.1 §8.2): no tiene un original afuera.
        fuenteNotaTerna: 'Lo publicaron en Terna, para contratar: no tiene página afuera. Pedí el paquete para postular.',
        masDeEmpresa: (x, empresa) => 'Ver los ' + n(x) + ' avisos abiertos de ' + empresa,
        estado: {
          // propuesta PLAN-UX §5.4 (brand.md §6.3.1): más cortos; el armado está en Paquetes.
          fuera: 'Terna no lo eligió para vos. Si pedís el paquete, calcula tu match y lo arma.',
          fueraConMatch: (m) => 'Terna ya lo puntuó para vos (match ' + m + ') y no lo dejó en Paquetes. Si pedís el paquete, lo arma igual.',
          en_lista: (m) => (m === null ? 'Está en Paquetes › Por armar.' : 'Está en Paquetes › Por armar, con match ' + m + '.'),
          pedidoSinMatch: 'Antes de armarlo, Terna calcula tu match.',
          con_paquete: 'Ya tiene el paquete armado: está en Paquetes.',
          postulada: 'Ya está postulada. La seguís en Postulaciones.',
          no_interesa: 'Lo marcaste "No me interesa". Si pedís el paquete, vuelve a Paquetes.',
          no_se_pudo: 'Terna no pudo armar el paquete. Podés volver a pedirlo.',
        },
        armarNo: 'Armar paquetes está en No: Terna no arma nada, tampoco lo que pidas acá.',
        cambiarlo: 'Cambiarlo en Preferencias',
        // propuesta PLAN-UX §5.4 (brand.md §6.3.1): seguir a la empresa y sumar el puesto desde la ficha. «La seguís», el aviso breve
        // y Deshacer son los de Inicio (T.inicio.lista.laSeguis, siguiendo, dejaste).
        seguir: (empresa) => 'Seguir a ' + empresa,
        sumarPuesto: 'Sumar a mis puestos',
        // propuesta PLAN-UX §5.4 (brand.md §6.3.1), con §6.1: escrito y apagado hasta que exista sumar_aviso en la base (decisión D5).
        sumar: 'Sumar a Paquetes',
        sumarAyuda: 'Terna calcula tu match en la próxima corrida. No usa ninguno de tus paquetes.',
      },
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): el diálogo chico de «Sumar a mis puestos», con el título del aviso en un campo.
      sumarPuesto: {
        titulo: 'Sumar a tus puestos',
        ayuda: 'Terna pone primero los avisos que tengan estas palabras en el título. Dejá solo el nombre del puesto.',
        general: 'Es muy general: está en casi todos los avisos. Sumale una palabra.',
        lleno: (max) => 'Ya tenés ' + max + ' puestos. Sacá uno en Preferencias.',
        hecho: (puesto) => '«' + puesto + '» está en tus puestos.',
        // agregado por P3 (PLAN-UX §3.3, la ficha): el campo vacío al tocar Sumar, y el aviso breve de Deshacer o de sacar el puesto
        // desde «Tu puesto» (el par de T.inicio.lista.dejaste para las empresas).
        vacio: 'Escribí el nombre del puesto.',
        sacado: (puesto) => '«' + puesto + '» ya no está en tus puestos.',
      },
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): los atajos, una fila de chips que se prenden y se apagan («Que no tengo», prendido
      // de entrada).
      atajos: { puestos: 'Mis puestos', empresas: 'Empresas que sigo', terna: 'Postula Terna', semana: 'De esta semana', noTengo: 'Que no tengo' },
      // agregado por P3: el nombre de la fila de atajos para el lector de pantalla (a la vista no lleva título).
      atajosNombre: 'Atajos',
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1; decisión D6): los rubros, deducidos del título del puesto (js/rubros.js). Un rubro sin
      // avisos no se dibuja. Las claves son las del campo avisos.rubro que se propone al motor (PLAN-UX §6.4).
      rubros: {
        titulo: 'Por el nombre del puesto',
        // propuesta PLAN-PANTALLAS (brand.md §6.3.1), 25/11: los rubros se pliegan detrás de un chip, primero en la fila de atajos;
        // con uno elegido, el chip lo dice.
        boton: 'Rubros',
        elegido: (rubro) => 'Rubro: ' + rubro,
        valores: {
          administracion: 'Administración y finanzas', ventas: 'Ventas y comercio', atencion: 'Atención al cliente',
          tecnologia: 'Tecnología y datos', logistica: 'Logística y transporte', oficios: 'Producción y oficios',
          gastronomia: 'Gastronomía y hotelería', salud: 'Salud', educacion: 'Educación', construccion: 'Construcción y mantenimiento',
          limpieza_seguridad: 'Limpieza y seguridad', otros: 'Otros',
        },
      },
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): «Cerca», por la ciudad de tu perfil, y la jornada parcial.
      cercaTuyo: (ciudad) => 'Cerca: ' + ciudad,
      parcial: 'Jornada parcial',
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): el vacío de un rubro o de un oficio, que dice la verdad y ofrece la salida.
      vacioRubro: 'Terna todavía lee sobre todo sitios de empresas: de esto tiene poco o nada. Si te llegan alertas de Bumeran, Computrabajo, Zonajobs o Indeed, reenviáselas a Terna y entran a Paquetes.',
      vacioRubroLink: 'Cómo reenviar alertas',
      vacioBase: 'Terna todavía no tiene avisos abiertos. Busca todos los días: volvé después de la próxima corrida.',
      vacioBusqueda: (q) => 'Ningún aviso abierto coincide con "' + q + '".',
      vacioFiltros: 'Ningún aviso abierto coincide con estos filtros.',
      vacioAyuda: 'Probá con otra palabra o con menos filtros. Terna suma avisos todos los días.',
      // Francisco, 16/11/2026, buscó los avisos de una empresa cuyo sitio Terna todavía no lee: que la página lo diga (§8, F2).
      queTiene: 'Terna muestra los avisos de los sitios que sabe leer: de algunas empresas todavía no tiene ninguno, o tiene pocos.',
      // propuesta PLAN-UX §5.4 (brand.md §6.3.1): desde la ficha de Empleos se sigue a la empresa (ficha.seguir).
      seguirEmpresa: 'Si buscás una empresa en particular, seguila: Terna prioriza sus avisos cuando los encuentra.',
      irAPreferencias: 'Ir a Preferencias',
      // En Inicio (busqueda.md §4.6): cuánto hay para buscar, con el link. Sin la cuenta de empresas desde 0.3: la base y la página
      // no juntan igual dos nombres de la misma empresa (652 y 653 el 17/11/2026) y dos números distintos para lo mismo confunden.
      // propuesta PLAN-UX §5.2 (brand.md §6.3): la entrada a Empleos de Inicio, una fila con ícono y el botón (también el de
      // Paquetes, #ir-busqueda).
      enInicio: (avisos, semana) => plural(avisos, '1 empleo abierto', n(avisos) + ' empleos abiertos')
        + (semana > 0 ? ', ' + n(semana) + ' de esta semana' : ''),
      enInicioLink: 'Buscar en Empleos',
      // En Avisos, debajo de la lista (busqueda.md §4.6): qué diferencia hay entre las dos pestañas, con el link.
      // propuesta PLAN-UX §5.3 (brand.md §6.4): el renglón de cierre de Paquetes › Por armar; el link dice «Empleos».
      enAvisos: '¿Buscás otro? Todo lo abierto está en',
    },

    // Los avisos que alguien publicó en Terna para contratar, en la ficha de la persona (contratar.md 0.1 §5 y §8.2; datos.md 0.44, 0055).
    terna: {
      titulo: 'Publicado en Terna',
      quien: { empresa: 'Lo publicó una empresa, en Terna.', persona: 'Lo publicó en Terna una persona que contrata.' },
      queVe: 'Si postulás, quien lo publicó ve tu nombre, tu mail, tu teléfono, tu LinkedIn, tu CV y tu carta de este paquete y tu salario pretendido.',
      postular: 'Postular en Terna',
      postularAccesible: (puesto) => 'Postular en Terna a ' + puesto,
      enTerna: 'Se postula desde Terna.',
      sinPaquete: 'Para postular hace falta el paquete de este aviso. Cuando Terna lo arma, postula por vos si «Terna postula por vos» está en Sí; si no, lo mandás desde acá.',
      confirmar: { titulo: '¿Postular en Terna?', si: 'Postular', texto: 'Tu postulación le llega en el momento, con el CV y la carta de este paquete.' },
      hecho: 'Listo: tu postulación llegó.',
      recibida: (fecha) => 'Tu postulación llegó el ' + fecha + '.',
      retirar: 'Retirar mi postulación',
      confirmarRetirar: { titulo: '¿Retirar tu postulación?', si: 'Retirar', texto: 'Quien publicó el aviso deja de ver tu postulación y tus datos. Podés volver a postular mientras el aviso esté abierto.' },
      retirada: 'Retiraste tu postulación.',
      retiradaEl: (fecha) => 'Retiraste tu postulación el ' + fecha + '. Podés volver a postular mientras el aviso esté abierto.',
      volver: 'Volver a postular',
      cerrada: 'Este aviso ya no recibe postulaciones.',
      propuesta: (fecha) => 'Quien publicó este aviso vio tu perfil, sin tu nombre ni tus datos, y el ' + fecha + ' te propuso postular.',
      propuestaSi: 'Postular',
      propuestaNo: 'No, gracias',
      propuestaPostulada: 'Listo: tu postulación llegó.',
      propuestaPedida: 'Listo. Terna arma el paquete de este aviso y postula apenas esté.',
      propuestaRechazada: 'Listo. No le decimos por qué.',
      propuestaAceptada: 'Aceptaste la propuesta de postular.',
      propuestaDijisteNo: 'Le dijiste que no a la propuesta de postular.',
      denunciar: 'Avisar que algo está mal',
      denunciado: 'Ya nos avisaste de este aviso. Francisco lo revisa.',
      dialogoDenunciar: { titulo: '¿Qué está mal en este aviso?', si: 'Avisar', etiqueta: 'Contanos qué pasa',
        ayuda: 'Por ejemplo: pide plata, no parece un trabajo real o pide datos que no hacen falta. Lo lee Francisco.',
        error: 'Escribí entre 3 y 500 letras.' },
      denunciaEnviada: 'Gracias por avisar. Francisco lo revisa.',
      // La tarjeta de Inicio: las propuestas sin responder.
      inicio: {
        titulo: (x) => (x === 1 ? 'Te propusieron postular' : 'Te propusieron postular en ' + n(x) + ' avisos'),
        texto: 'Quien publicó estos avisos en Terna vio tu perfil, sin tu nombre, y te propone postular. Decidís vos.',
        ver: 'Ver la propuesta',
        verAccesible: (puesto) => 'Ver la propuesta para ' + puesto,
      },
    },

    postulaciones: {
      titulo: 'Postulaciones',
      // propuesta PLAN-UX §5.5 (brand.md §6.5): la cuenta salió del título (`cuenta`, «N postulaciones»: cada número vive en su pestaña).
      // El nombre del grupo de pestañas, para el lector de pantalla.
      mostrar: 'Mostrar',
      // propuesta PLAN-UX §5.5 (brand.md §6.5): tres pestañas, Postuladas · Postula Terna · A mano (PLAN-UX §2.2 y §10); hasta acá, Por
      // postular y Postuladas.
      vistas: { postuladas: 'Postuladas', terna: 'Postula Terna', a_mano: 'A mano' },
      // propuesta PLAN-UX §5.5 (brand.md §6.5): lo para revisar dentro de Postula Terna, en el punto ámbar de su pestaña, para el lector
      // de pantalla (como T.comun.porDecidirCuenta en Paquetes).
      paraRevisarCuenta: (x) => ', ' + n(x) + ' para revisar',
      // propuesta PLAN-UX §5.5 (brand.md §6.5): los grupos de Postula Terna, con su ayuda (las dos ayudas las agrega P0: PLAN-UX §3.4
      // las cita y §5.5 no las lista).
      grupos: {
        revisar: 'Para revisar',
        revisarAyuda: 'Terna completó el formulario. Mirá las respuestas y tocá Enviar.',
        cola: 'En cola',
        colaAyuda: 'Terna la envía en la próxima corrida.',
      },
      // propuesta PLAN-UX §5.5 (brand.md §6.5): el renglón del final de Postula Terna, con el link a Paquetes (avisos.html?donde=terna).
      // propuesta PLAN-UX (brand.md §6.5), FEEDBACK-UX P2-5: sin el número, que no coincidía con ninguno de los grupos de Por armar
      // (sumaba tus pedidos y lo que sigue Terna). Hasta acá: «Lo próximo que Terna va a armar y postular: {x} en Paquetes.»
      proximos: 'Lo próximo que Terna va a armar y postular está en',
      proximosLink: 'Paquetes › Por armar',
      // propuesta PLAN-UX §5.5 (brand.md §6.5): las partes salieron de debajo de las pestañas (`terna`, `enviadas`, `aMano`); `tocan`
      // sigue, en el muelle y el carril (js/comun.js) y en Inicio.
      partes: {
        tocan: (x) => plural(x, '1 te toca a vos', n(x) + ' te tocan a vos'),
      },
      // propuesta PLAN-UX §5.5 (brand.md §6.5; decisión D7): salió `resumenTerna`, «Terna postuló por vos en N. No pudo en M…», que
      // Operación había sumado arriba de las pestañas el 20/11 (brand.md 0.39): con tres pestañas sus números están a la vista, y lo
      // que hizo Terna por vos se cuenta en Inicio. Se le avisa a ese chat en estado.md.
      // propuesta PLAN-UX §5.5 (brand.md §6.5): más corta.
      postuladasNota: 'Si te llaman, abrila: están el CV, la carta y lo que Terna respondió.',
      // "Tu umbral" (brand.md 0.21 §6.5): marcada, A mano (hasta PLAN-UX §3.4, Por postular) muestra solo lo que Terna te sugiere; sin
      // marcar, también lo que quedó a mano entre el piso y tu umbral. Debajo del piso, eso no se ve en ningún lado.
      tuUmbral: {
        etiqueta: (u) => 'Tu umbral: ' + u,
        // propuesta PLAN-UX §5.5 (brand.md §6.5): el mismo texto, detrás de un «?» (ayudaAccesible es su nombre; lo agrega P0).
        ayudaAccesible: 'Qué muestra Tu umbral',
        explicacion: (piso, conPuestos) => 'Marcada, ves lo que llega a tu umbral' + (conPuestos ? ', lo de tus puestos' : '') + ' y lo que pediste. Sin marcar, también lo que quedó entre '
          + piso + ' y tu umbral.',
        hayMas: (x) => plural(x, '1 más bajo tu umbral.', n(x) + ' más bajo tu umbral.'),
        vesTambien: (x) => 'Ves también ' + n(x) + ' bajo tu umbral: Terna no te sugiere postularte.',
      },
      // "Por qué" (brand.md 0.21 §6.5): por qué esa postulación está en tu lista. "Tu puesto" lleva la explicación de Avisos
      // (T.avisos.tuPuestoExplicacion).
      porQue: {
        nombre: 'Por qué', todos: 'Todos',
        valores: { pedida: 'La pediste', tu_puesto: 'Tu puesto', sobre_umbral: 'Sobre tu umbral', bajo_umbral: 'Bajo tu umbral' },
        pedida: 'Pediste el paquete de este aviso.',
        sobreUmbral: (u) => 'Llega a tu umbral (' + u + ').',
        bajoUmbral: (u, conPuestos) => 'No llega a tu umbral (' + u + ')' + (conPuestos ? ' ni es de tus puestos' : '') + ': Terna no te sugiere postularte. El paquete sigue listo si igual querés.',
        bajoUmbralHecha: (u, conPuestos) => 'Hoy no llega a tu umbral (' + u + ')' + (conPuestos ? ' ni es de tus puestos' : '') + ': el match se volvió a calcular o cambiaste el umbral después.',
      },
      // Desde brand.md 0.21, cuatro puntos, sin Entrevista, y solo en la ficha.
      // propuesta PLAN-UX §5.5 (brand.md §6.5): el recorrido salió de la ficha, con `recorrido` y `recorridoAccesible`.
      linea: {
        en_cola: 'En cola. Terna postula en la próxima corrida.',
        // brand.md 0.24 §6.5 (Francisco, 12/11/2026: «dejemos en claro que está todo hecho y que solo como usuario final tenés que
        // darle a confirmar»). Hasta 0.23: "Para revisar. Terna llenó el formulario; mirá las respuestas y decidí."
        para_revisar: 'Para revisar. Terna completó todo el formulario: solo falta que lo confirmes. Mirá las respuestas y tocá Enviar.',
        enviada: (f, h) => 'Enviada por Terna el ' + f + ' a las ' + h + '.',
        postulado: (f) => 'Postulada a mano el ' + f + '.',
        pendiente: 'Paquete armado.',
        todoListo: 'Todo está listo: el link, el CV y la carta.',
      },
      // La línea corta, debajo del chip de la etapa en la tabla y en la fila: la misma, sin el nombre de la etapa adelante.
      lineaCorta: {
        en_cola: 'Terna postula en la próxima corrida.',
        para_revisar: 'Terna completó todo el formulario: solo falta que lo confirmes.',
        enviada: (f, h) => 'El ' + f + ' a las ' + h + '.',
        postulado: (f) => 'La marcaste el ' + f + '.',
        pendiente: 'Paquete armado.',
      },
      trabas: {
        no_postulable: (fuente) => 'Terna no postula en ' + fuente + '.',
        postular_sola_no: 'Terna postula por vos está en No.',
        captcha: 'Terna no pudo postular: el sitio pide un captcha.',
        requiere_cuenta: 'Terna no pudo postular: el sitio pide crear una cuenta o entrar.',
        pregunta_sin_respuesta: 'Terna no pudo postular: el formulario pregunta algo que tu perfil no responde.',
        formulario_desconocido: 'Terna no pudo postular: el formulario tiene campos que no conoce.',
        archivo_rechazado: 'Terna no pudo postular: el sitio no aceptó el CV o la carta.',
        confirmacion_incierta: 'Terna envió el formulario pero no encontró la confirmación. Revisá en el sitio si llegó antes de postularla a mano.',
        intentos_agotados: (x) => 'Terna ya lo intentó ' + x + ' veces.',
        error: 'Terna no pudo postular: el sitio no respondió.',
        elegido_por_usuario: 'Elegiste postular vos.',
      },
      completarRespuestas: 'Completar respuestas para formularios',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.5): lleva a donde está el campo (secundario, viajar, portfolio, analítico, DNI).
      // Antes: «Completar Preferencias».
      completarPreferencias: 'Completar en Preferencias',
      completarPerfil: 'Completar Mi perfil',
      // Cuántas veces lo intentó Terna, en la ficha (brand.md 0.28 §6.5).
      intentos: (n) => 'Terna lo intentó ' + n + (n === 1 ? ' vez.' : ' veces.'),
      botones: {
        // propuesta PLAN-UX §5.5 (brand.md §6.5): Revisar, en la tarjeta de una para revisar.
        revisar: 'Revisar',
        marcarPostulado: 'Marcar postulado', noMeInteresa: 'No me interesa',
        enviar: 'Enviar', postularYo: 'Postular yo', cancelarEnvio: 'Cancelar envío',
        volverAPendiente: 'Volver a pendiente',
      },
      hecho: {
        postulado: 'Postulado.',
        pendiente: 'Pendiente.',
        aprobada: 'Aprobada. Terna la envía en la próxima corrida.',
        aMano: 'Queda para hacer a mano.',
        cancelado: 'Cancelado. Queda pendiente.',
        noInteresa: 'No te interesa. Terna no sigue con este aviso.',
      },
      // El texto del aviso, en la ficha de una postulada (brand.md 0.22 §6.5): plegado, y traído recién al abrirlo.
      textoAviso: {
        titulo: 'El texto del aviso',
        ayudaFuente: 'Lo que decía el aviso cuando Terna lo leyó. Te sirve para preparar la entrevista aunque ya no esté publicado.',
        // Desde brand.md 0.23: el que no vino de la fuente lo pegó la persona (hasta 0.22) o Francisco.
        ayudaUsuario: 'El texto del aviso que Terna tiene guardado para vos. Te sirve para preparar la entrevista aunque ya no esté publicado.',
        vacio: 'Terna no tiene guardado el texto de este aviso.',
        error: 'No se pudo traer el texto del aviso. Probá de nuevo.',
      },
      respondio: 'Lo que Terna respondió',
      vaAResponder: 'Lo que Terna va a responder',
      copiarRespuestas: 'Copiar respuestas',
      sinRespuesta: 'Sin respuesta.',
      revisarRespuesta: 'Terna contestó que no porque tu perfil no lo muestra. Si es que sí, tocá "Postular yo" y respondé vos, o sumalo a Mi perfil.',
      verCaptura: 'Ver captura',
      capturaAlt: (etapa) => 'Captura del intento de postular: ' + etapa,
      vacio: 'Todavía no hay postulaciones. Aparecen cuando Terna arma el primer paquete.',
      vacioFiltros: 'Ninguna postulación coincide con estos filtros.',
      // propuesta PLAN-UX §5.5 (brand.md §6.5): los vacíos de las tres pestañas (el de Por postular salió con su pestaña).
      vacioVista: {
        postuladas: 'Todavía no hay ninguna postulada. Acá quedan las que envía Terna y las que marcás como postuladas.',
        terna: 'Terna no tiene ninguna en marcha. Cuando arma un paquete donde puede postular, lo envía en la misma corrida.',
        a_mano: 'Nada para postular a mano.',
      },
      columnas: { match: 'Match', puesto: 'Puesto', empresa: 'Empresa', porque: 'Por qué', requisitos: 'Requisitos', etapa: 'Etapa', fecha: 'Fecha', aviso: 'Aviso' },
    },

    perfil: {
      titulo: 'Mi perfil',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.6): Mi perfil es lo mínimo (D2). Antes: «Con este perfil Terna elige avisos, arma
      // tus documentos y responde formularios.»
      intro: 'Quién sos y lo que va en tu CV. Lo demás se configura en Preferencias.',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.6): nuevo, debajo de la intro mientras falte algo (perfil_faltantes).
      // propuesta PLAN-PREFERENCIAS (brand.md §6.6), FEEDBACK-PREFERENCIAS P2-7: no repite la lista (el indicador ya dice qué falta, y
      // a quien le falta solo un idioma le listaba cuatro cosas) y dice lo que nadie decía: lo demás es opcional. La revisión proponía
      // «Con eso Terna ya puede buscar. Lo demás de esta página es opcional.», pero la línea va debajo de la intro, no del indicador:
      // «Con eso» señalaba la intro, y la intro ya termina en «Lo demás se configura en Preferencias.». Antes: «Para empezar hacen falta
      // tu nombre, tu ciudad, una experiencia o un estudio y un idioma.»
      minimo: 'Cuando completes lo que falta, Terna ya puede buscar; el resto de esta página es opcional.',
      // propuesta PLAN-PREFERENCIAS §4.6 y §8.2 (brand.md §6.6): la marca chica y gris de lo opcional que queda (teléfono, LinkedIn,
      // promedio), siempre con las mismas palabras. Reemplaza al «(opcional)» que llevaban esas etiquetas.
      opcional: 'Opcional',
      enTuCv: 'Va en tu CV.',
      completo: 'Perfil completo.',
      falta: (lista) => 'Falta: ' + lista + '.',
      // propuesta PLAN-WEB §4.1 (brand.md §6.6): el marbete de un bloque de Mi perfil y el chip de Mi perfil en el carril.
      faltaCorto: 'Falta',
      // Los bloques (brand.md 0.7 §6.6; diseno.md 0.19 §9.2). Desde PLAN-PREFERENCIAS (D2 y D5, 23/11/2026) Datos va sin subtemas (lo
      // de Contacto) y CV junta el CV original y el perfil estructurado; Identificación, Dirección, Portfolio, GitHub, Analítico y
      // Respuestas para formularios pasaron a Preferencias › Postulaciones (js/formularios.js, js/respuestas.js), que usa estas
      // mismas claves de T.perfil (renombrarlas es una limpieza posterior, §4.6).
      datos: 'Datos',
      contacto: 'Contacto',
      nombre: 'Nombre', apellido: 'Apellido', mail: 'Mail', mailAyuda: 'Es el de tu cuenta. Va en tus postulaciones.',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.6): sin «(opcional)», que pasa a la marca Opcional. Antes: «Teléfono (opcional)»,
      // «LinkedIn (opcional)».
      telefono: 'Teléfono', ciudad: 'Ciudad',
      ciudadAyuda: 'Terna busca en tu ciudad y alrededores; si ponés Buenos Aires, incluye CABA y el Gran Buenos Aires.',
      linkedin: 'LinkedIn',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.6): nuevos, al final de Datos.
      // propuesta PLAN-PREFERENCIAS (brand.md §6.6), FEEDBACK-PREFERENCIAS P1-2: la línea sube arriba de todo, debajo de la intro y fuera
      // de los bloques (al final de Datos, cerrado en el celular, no la veía quien seguía una traba vieja: «Cargalo en Mi perfil ›
      // Identificación»), con dos links: las respuestas (#formularios) y los datos, que caen en el DNI (#identificacion). Antes: «Las
      // respuestas y los datos para formularios (DNI, dirección, portfolio, analítico) están en Preferencias › Postulaciones.» + «Ir a
      // Preferencias › Postulaciones».
      datosEnPreferencias: (respuestas, datos) => ['Lo que Terna usa solo para postular está en Preferencias › Postulaciones: ', respuestas, ' y ', datos, '.'],
      datosEnPreferenciasLink: 'Respuestas para formularios',
      datosEnPreferenciasDatos: 'DNI, dirección, portfolio y analítico',
      // propuesta PLAN-PREFERENCIAS §4.6: en Preferencias › Postulaciones › Datos para formularios, donde todo es opcional (lo dice la
      // intro del subtema una vez). Antes: «Portfolio o sitio propio (opcional)», «GitHub (opcional)».
      portfolio: 'Portfolio o sitio propio', portfolioAyuda: 'Un link a tu trabajo. Terna lo usa solo si un formulario lo pide.',
      // 0049 (brand.md 0.35 §6.6): el GitHub, al lado del portfolio.
      github: 'GitHub', githubAyuda: 'Terna lo pone cuando un formulario pide tu GitHub, o un sitio y no cargaste portfolio.',
      // Experiencia laboral (brand.md 0.7 §6.6): cada trabajo en su propia caja, con un título que dice cuál es.
      experiencia: 'Experiencia laboral',
      puesto: 'Puesto', empresa: 'Empresa', desde: 'Desde', hasta: 'Hasta', mes: 'Mes', anio: 'Año', actual: 'Trabajo actual',
      queHiciste: 'Qué hiciste',
      queHicisteAyuda: 'Tareas y resultados, en tus palabras. Poné números cuando los tengas: Terna solo usa los que vos cargás, y los redacta para cada aviso.',
      agregarExperiencia: 'Agregar trabajo', quitar: 'Quitar', subir: 'Subir', bajar: 'Bajar',
      sinExperiencia: 'Todavía no cargaste ningún trabajo.',
      topeExperiencias: (x) => 'Hasta ' + x + ' trabajos.',
      // El título de cada caja: "1. Puesto · Empresa", con lo que haya escrito; vacía, "1. Trabajo nuevo".
      tituloItem: (n, a, b, nuevo) => {
        const x = String(a || '').trim();
        const y = String(b || '').trim();
        return n + '. ' + (x && y ? x + ' · ' + y : x || y || nuevo);
      },
      trabajoNuevo: 'Trabajo nuevo',
      estudioNuevo: 'Estudio nuevo',
      estudios: 'Estudios y cursos',
      titulo_: 'Título o curso', institucion: 'Institución', estado: 'Estado', terminado: 'Terminado', enCurso: 'En curso',
      tituloAyuda: 'El nombre completo, como figura en el título o el certificado: Licenciatura en…, Maestría en…, Curso de…. El secundario no hace falta si tenés otro estudio.',
      // 0022 (brand.md 0.4.15): el tipo de cada estudio; el promedio es solo de una carrera.
      // Claves propias (tipoEstudio…): "nivel" y "niveles" son las de Idiomas, más abajo; con el mismo nombre, Idiomas las pisaba.
      tipoEstudio: 'Tipo',
      tipoEstudioAyuda: 'Un curso o una certificación no cuentan como título universitario ni llevan promedio.',
      tiposEstudio: { grado:'Carrera de grado (licenciatura, ingeniería…)', posgrado: 'Posgrado (maestría, MBA, especialización, doctorado)', terciario: 'Terciario (tecnicatura, profesorado)', curso: 'Curso o certificación', secundario: 'Secundario' },
      anioAyuda: 'El año en que terminaste. Si está en curso, el año en que esperás terminar.',
      // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.6): con la marca Opcional y sin «como figura en tu analítico» (el analítico ya no
      // está en Mi perfil). Antes: «Promedio (opcional)» / «Como figura en tu analítico, con la escala: 8,5/10 o 3,4/4. No va en el CV:
      // Terna lo usa solo si un formulario lo pide.»
      promedio: 'Promedio', promedioAyuda: 'Con la escala: 8,5/10 o 3,4/4. No va en el CV: Terna lo usa solo si un formulario lo pide.',
      agregarEstudio: 'Agregar estudio', sinEstudios: 'Todavía no cargaste estudios.',
      topeEstudios: (x) => 'Hasta ' + x + ' estudios.',
      idiomas: 'Idiomas', idioma: 'Idioma', nivel: 'Nivel', nativo: 'Nativo',
      agregarIdioma: 'Agregar idioma', sinIdiomas: 'Todavía no cargaste idiomas.',
      topeIdiomas: (x) => 'Hasta ' + x + ' idiomas.',
      cvBloque: 'CV',
      cv: 'CV original',
      subirCv: (mb) => 'Subir CV (PDF, hasta ' + mb + ' MB)',
      cvAyuda: 'Opcional. Si lo subís, Terna lo lee una vez y completa tu perfil con más detalle. No lo manda a nadie tal cual. Lo que va al CV de cada aviso sale de las experiencias y los estudios que cargás acá, no del archivo.',
      cvCargado: (f) => 'CV cargado el ' + f + '.',
      ver: 'Ver', reemplazar: 'Reemplazar',
      cvPendiente: 'Terna lo lee en la próxima corrida y arma tu perfil estructurado.',
      subiendo: 'Subiendo…',
      sinCv: 'Todavía no subiste tu CV.',
      // 0021 (brand.md 0.4.14): el analítico, que pidió obligatorio un formulario real. Desde PLAN-PREFERENCIAS (D5), en Preferencias ›
      // Postulaciones › Datos para formularios; propuesta §4.6: sin «(opcional)». Antes: «Analítico (opcional)».
      analitico: 'Analítico',
      analiticoAyuda: 'El certificado con las materias y notas de tu carrera, en PDF. Terna lo adjunta solo si un formulario lo pide; no lo lee ni lo manda a nadie más.',
      analiticoCargado: (f) => 'Analítico cargado el ' + f + '.',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P3-4: nuevos, el nombre accesible de «Ver», «Reemplazar» y
      // «Quitar» del analítico (con lector de pantalla se oía «Ver» a secas). Empiezan con el texto a la vista.
      analiticoAccesible: { ver: 'Ver el analítico', reemplazar: 'Reemplazar el analítico', quitar: 'Quitar el analítico' },
      sinAnalitico: 'Todavía no subiste tu analítico.',
      subirAnalitico: (mb) => 'Subir analítico (PDF, hasta ' + mb + ' MB)',
      estructurado: 'Perfil estructurado',
      estructuradoIntro: 'Esto es lo que Terna lee. Se arma solo desde tu CV y tus datos; podés corregirlo.',
      estructuradoAyuda: 'Si subís un CV nuevo, Terna lo vuelve a armar y pisa tus correcciones.',
      editar: 'Editar',
      tituloActual: 'Título actual', resumen: 'Resumen', habilidades: 'Habilidades', certificaciones: 'Certificaciones',
      unaPorLinea: 'Una por línea.',
      topeHabilidades: (x) => 'Hasta ' + x + ' habilidades.',
      topeCertificaciones: (x) => 'Hasta ' + x + ' certificaciones.',
      // Hasta 0.6 de brand.md, el bloque "Datos para formularios"; de 0.7 a PLAN-PREFERENCIAS, el subtema Identificación de Mi perfil ›
      // Datos; desde PLAN-PREFERENCIAS (D5), un ítem de Preferencias › Postulaciones › Datos para formularios.
      identificacion: 'Identificación',
      dni: 'DNI', cuil: 'CUIL', nacimiento: 'Fecha de nacimiento',
      // propuesta PLAN-PREFERENCIAS §4.6 («nunca van en el CV» sube a la intro del subtema). Antes: «Opcionales. Nunca van en el CV. Si
      // un formulario los pide, Terna los escribe; si no los cargaste, esa postulación queda para hacer a mano. Se guardan cifrados.»
      identificacionAyuda: 'Si un formulario los pide, Terna los escribe; si no están, esa postulación queda a mano. Se guardan cifrados.',
      // Dirección (brand.md 0.19 §6.6; datos.md 0.32 §5.4b, 0036): debajo de la fecha de nacimiento, cifrada como el DNI. Las
      // provincias, con el nombre con que las guarda la base (provincia_normalizada): la Ciudad y Buenos Aires primero.
      // propuesta PLAN-PREFERENCIAS §4.6. Antes: «Dirección (opcional)» / «Algunos formularios, como los de Workday, la piden para
      // postular. Nunca va en el CV. Si un formulario la pide, Terna la escribe; si no la cargaste, esa postulación queda para hacer a
      // mano. Se guarda cifrada.»
      direccion: 'Dirección',
      direccionAyuda: 'Algunos formularios, como los de Workday, la piden. Si no está, esa postulación queda a mano. Se guarda cifrada.',
      calle: 'Calle y número', calleEjemplo: 'Av. Corrientes 1234, 5.º B',
      codigoPostal: 'Código postal', codigoPostalEjemplo: '1414 o C1414ABC',
      provincia: 'Provincia', provinciaVacia: 'Elegí una provincia',
      provincias: ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
        'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
        'Tierra del Fuego', 'Tucumán'],
      borrarDireccion: 'Borrar dirección',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-1: nuevo, debajo de «Borrar dirección», que borra al tocar
      // mientras el resto de la dirección espera al botón. La revisión decía «…sin esperar a Guardar.»: el botón se llama «Guardar
      // preferencias».
      borrarDireccionAyuda: 'Se borra al tocar, sin esperar a «Guardar preferencias».',
      // Tu cuenta (desde brand.md 0.7 en Mi perfil; hasta 0.6, en Preferencias).
      cuenta: 'Tu cuenta',
      pausar: 'Pausar mi cuenta',
      pausarTexto: 'Mientras esté pausada, Terna no busca avisos, no arma documentos ni postula. Tus datos quedan.',
      pausarCuenta: 'Pausar cuenta', reanudarCuenta: 'Reanudar cuenta',
      borrar: 'Borrar la cuenta',
      borrarTexto: 'Para borrar tu cuenta y todo lo tuyo, escribile a Francisco. Se borra en el día. Lo que ya recibió un empleador queda en el empleador.',
      // Desde brand.md 0.39 (operacion.md 0.2; Francisco, 20/11/2026): ve cómo salieron postulaciones y paquetes, y la captura de las fallas.
      privacidad: 'Tus datos y tus documentos los ves vos sola o solo. Francisco administra Terna: ve la lista de cuentas y el uso y, para arreglar lo que falla, cómo salieron tus postulaciones y tus paquetes (el puesto, la empresa, el error del sitio y, cuando Terna no pudo postular, la captura de esa página, que puede mostrar lo que Terna llenó). Fuera de eso no ve tu perfil, tu CV, tu carta ni tus respuestas desde la web; como operador del servicio tiene acceso técnico a la base, como cualquier administrador de un sistema. Para puntuar, armar y responder, Terna manda tu perfil y el texto del aviso a un proveedor externo que, según sus términos, no usa esos datos para entrenar.',
      guardadoBusca: 'Guardado. Terna empieza a buscar en la próxima corrida.',
      revisarPrefs: 'Revisar preferencias (opcional)',
      meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      niveles: { a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2', nativo: 'Nativo' },
      idiomasSugeridos: ['español', 'inglés', 'portugués', 'italiano', 'francés', 'alemán', 'chino', 'japonés'],
    },

    // Respuestas para formularios (js/respuestas.js; brand.md 0.7 §6.6, datos.md §5.6). Hasta 0.6 eran un bloque de Preferencias; de
    // 0.7 a PLAN-PREFERENCIAS, un subtema de Mi perfil › Datos; desde PLAN-PREFERENCIAS (D2, 23/11/2026), un subtema de Preferencias ›
    // Postulaciones, junto con secundario y viajar. Opciones y defaults desde brand.md 0.4.6 (datos.md 0.10, 0016).
    respuestas: {
      titulo: 'Respuestas para formularios',
      // propuesta PLAN-PREFERENCIAS §4.4 (brand.md §6.7). Antes: «Lo que Terna responde cuando un formulario pregunta si podés trabajar
      // en un país, cuándo podés empezar o si te mudarías. Van solo al empleador del aviso en que postula.»
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-1: qué guarda el botón (al lado, las preguntas voluntarias
      // se guardan al elegir). En singular, como el resto de la intro («Lo que Terna contesta… Va…») y como Datos para formularios; la
      // revisión decía «Se guardan». Antes: «Lo que Terna contesta cuando un formulario lo pregunta. Va solo al empleador del aviso en
      // que postula. Sin respuesta, Terna deja esa pregunta para vos.»
      intro: 'Lo que Terna contesta cuando un formulario lo pregunta. Va solo al empleador del aviso en que postula. Sin respuesta, Terna deja esa pregunta para vos. Se guarda con «Guardar preferencias».',
      autorizacion: 'Autorización para trabajar',
      argentina: 'Argentina',
      autArgentina: '¿Podés trabajar en Argentina?',
      autOtros: '¿Y en otros países?',
      autRemoto: 'Solo remoto desde Argentina', autRemotoAyuda: 'Sin visa ni patrocinio de la empresa.',
      autVisa: 'Necesitaría que me tramiten la visa',
      autPaises: 'Países donde ya podés trabajar sin visa (opcional)',
      autPaisesAyuda: 'Marcá solo los países donde hoy podés trabajar sin hacer ningún trámite.',
      paises: { DE: 'Alemania', BR: 'Brasil', CA: 'Canadá', CL: 'Chile', ES: 'España', US: 'Estados Unidos', FR: 'Francia', IT: 'Italia', MX: 'México', PT: 'Portugal', GB: 'Reino Unido', UY: 'Uruguay' },
      autVista: (x) => 'Terna lo anota así: "' + x + '"',
      autPropias: 'Prefiero escribirlo con mis palabras',
      autTexto: 'Tu respuesta',
      autTextoAyuda: 'Si lo dejás vacío, Terna no responde esa pregunta y esas postulaciones te quedan a mano.',
      // 0020: la nacionalidad, que pidieron formularios reales de Greenhouse.
      nacionalidad: 'Nacionalidad (opcional)', nacionalidadAyuda: 'Por ejemplo, argentina. Terna la responde solo si un formulario la pregunta.',
      disponibilidad: 'Disponibilidad',
      dispInmediata: 'Inmediata', dispDias: 'En unos días',
      dispCantidad: 'Cantidad de días',
      dispCantidadAyuda: 'Por ejemplo, 15 o 30 si tenés que avisar en tu trabajo actual.',
      mudanza: 'Mudanza', mudanzaAyuda: 'Lo que Terna responde si un formulario pregunta si te mudarías por el trabajo.',
      // 0021 (brand.md 0.4.14); la segunda oración, desde brand.md 0.25 (Francisco, 12/11/2026, 22:06): la declaración de usar solo
      // tus palabras se responde que sí y se envía (pipeline.md 0.4.37 §4.12).
      consentimientos: 'Aceptar los consentimientos',
      consentimientosAyuda: 'Terna marca que sí en las casillas de consentimiento de los formularios: la política de privacidad del empleador, que use tus respuestas demográficas, que te contacte por otras búsquedas, por SMS o WhatsApp, y sus novedades. También dice que sí cuando un formulario te pide declarar que escribiste todo con tus palabras, aunque tu CV, tu carta y algunas respuestas los escribe Terna: si la empresa lo nota, puede descartar la postulación. Si lo apagás, no marca ninguna, y las postulaciones que piden una obligatoria te quedan a mano.',
      // Los textos que se guardan y que el motor lee (datos.md §5.6, pipeline.md §4.12): no son textos de pantalla, son el formato.
      formato: {
        pais: (pais, si) => pais + ': ' + (si ? 'sí' : 'no') + '.',
        remoto: 'Otros países: solo remoto, sin visa.',
        visa: 'Otros países: necesitaría que me tramiten la visa.',
        inmediata: 'inmediata',
        dias: (n) => n + (n === 1 ? ' día' : ' días'),
      },
    },

    preferencias: {
      titulo: 'Preferencias',
      // propuesta PLAN-PREFERENCIAS §4.1 (brand.md §6.7). Antes: «Lo que Terna usa para filtrar, armar y postular. Se aplica desde la
      // próxima corrida.»
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-8: a quien recién empieza, nada le decía que puede no
      // tocar nada. Antes: «Cómo querés que Terna busque, arme y postule. Se aplica desde la próxima corrida.»
      intro: 'Cómo querés que Terna busque, arme y postule. Todo tiene un valor de arranque: cambiá solo lo que quieras. Se aplica desde la próxima corrida.',
      // Los bloques de la página, uno por herramienta y en el orden del muelle (propuesta PLAN-PREFERENCIAS §4.1, brand.md §6.7): Empleos,
      // Paquetes, Postulaciones y Quién te ve (T.preferencias.contratar.titulo). Antes: Búsqueda (grupos.busqueda), Paquetes y
      // postulación (grupos.paquetes) y Alertas por mail, que ahora es un subtema de Empleos. Respuestas para formularios volvió de Mi
      // perfil a Postulaciones (D2); Tu cuenta sigue en Mi perfil (T.perfil.cuenta).
      grupos: { empleos: 'Empleos', paquetes: 'Paquetes', postulaciones: 'Postulaciones' },
      // Los subtemas, con franja (propuesta PLAN-PREFERENCIAS §4.1). Antes: los dos de Paquetes y postulación (Paquetes / Postulación),
      // que ahora son bloques. Alertas por mail usa T.preferencias.alertas y Respuestas para formularios, T.respuestas.titulo.
      temas: { filtros: 'Filtros', documentos: 'Documentos', datosFormularios: 'Datos para formularios', voluntarias: 'Preguntas voluntarias' },
      // propuesta PLAN-PREFERENCIAS §4.1: una oración arriba de cada bloque, que dice qué decide.
      bajada: {
        empleos: 'Qué empleos busca Terna para vos y de dónde los saca.',
        paquetes: 'Para qué empleos arma el paquete y cómo lo escribe.',
        postulaciones: 'Cómo postula Terna y qué contesta en los formularios.',
      },
      // propuesta PLAN-PREFERENCIAS §4.2: el lomo de cada bloque cerrado. Antes: «Tu umbral: 70 · puestos» (Búsqueda), «Armar paquetes: Sí
      // · Terna postula por vos: Sí» (Paquetes y postulación) y la última alerta (Alertas por mail).
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P3-5 y P2-5: con las tres modalidades (`todas`), solo los
      // puestos, porque a 390 px el lomo se cortaba (la revisión daba a elegir entre esto y «Todas las modalidades», que también se
      // cortaba); con «Terna postula por vos» en No (`revisa` sin valor), solo «Postula: No». Antes: las tres modalidades por nombre
      // («… · Remoto, Híbrido, Presencial») y siempre «Postula: No · Revisás antes: Sí».
      lomo: {
        empleos: (puestos, modalidades, todas) => (puestos.length ? puestos.slice(0, 2).join(', ') + (puestos.length > 2 ? ' +' + (puestos.length - 2) : '') : 'Sin puestos')
          + (!todas && modalidades.length ? ' · ' + modalidades.join(', ') : ''),
        paquetes: (arma, umbral) => 'Arma: ' + arma + ' · Umbral ' + umbral,
        postulaciones: (postula, revisa) => 'Postula: ' + postula + (revisa ? ' · Revisás antes: ' + revisa : ''),
        sinArmar: 'Terna no postula: Armar paquetes está en No',
        contratar: (visible) => 'Visible para quien contrata: ' + visible,
      },
      // propuesta PLAN-PREFERENCIAS §4.3: los avisos de dependencia, que dicen por qué algo no aplica (hasta acá se apagaba sin decirlo).
      sinArmar: 'Armar paquetes está en No: Terna no postula.',
      sinArmarLink: 'Cambiarlo',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-5: «Hoy está en No» no tenía sujeto, y en el celular el
      // interruptor queda varias pantallas más arriba. Antes: «Terna usa estas respuestas cuando postula por vos. Hoy está en No.»
      sinPostular: '«Terna postula por vos» está en No: hoy Terna no usa estas respuestas. Podés completarlas igual.',
      // agregado al implementar PLAN-PREFERENCIAS (D6: «las respuestas y los datos no se apagan: una línea avisa que hoy Terna no los
      // usa»): la misma línea para Datos para formularios, que no son respuestas.
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-5, como sinPostular. Antes: «Terna usa estos datos cuando
      // postula por vos. Hoy está en No.»
      sinPostularDatos: '«Terna postula por vos» está en No: hoy Terna no usa estos datos. Podés completarlos igual.',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-5 (plan A8): nuevo, debajo de «Revisar antes de enviar»
      // mientras está atenuado, que hasta acá se ponía gris sin decir por qué.
      revisarSinPostular: 'No aplica: Terna no postula por vos.',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P1-1: nuevo, al lado de «Guardar preferencias» mientras haya
      // algo distinto de lo guardado (salir de la página, además, pide confirmar con el diálogo del navegador).
      sinGuardar: 'Hay cambios sin guardar.',
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P3-8: nuevo, en la banda cuando la fila de preferencias se
      // escribió y falló un dato marcado de Datos para formularios (DNI, CUIL, dirección). Antes, T.errores.guardarCampos: «No se pudo
      // guardar. Revisá los campos marcados.», aunque la mitad había quedado escrita.
      guardadoAMedias: 'Tus preferencias se guardaron, pero no los datos marcados.',
      // propuesta PLAN-PREFERENCIAS §4.6 (D5): Postulaciones › Datos para formularios.
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-1: qué espera al botón y qué se guarda en el acto. Antes:
      // «Lo que Terna escribe o adjunta cuando un formulario lo pide. Todo es opcional y nunca va en tu CV.»
      datosFormulariosIntro: 'Lo que Terna escribe o adjunta cuando un formulario lo pide. Todo es opcional y nunca va en tu CV. Se guarda con «Guardar preferencias»; el analítico, al subirlo.',
      promedioEnPerfil: (carrera, promedio) => (promedio ? 'Promedio de ' + carrera + ': ' + promedio + '.' : 'No cargaste el promedio de ' + carrera + '.'),
      promedioEnPerfilLink: 'Cambiarlo en Mi perfil › Estudios',
      // propuesta PLAN-PREFERENCIAS §4.6 y §8.1: al final de Respuestas para formularios; el salario queda en Paquetes › Documentos.
      salarioEnPaquetes: 'Si un formulario pregunta el salario, Terna responde con el de Preferencias › Paquetes.',
      salarioEnPaquetesLink: 'Ver salario',
      // propuesta PLAN-PREFERENCIAS §4.4: Preguntas voluntarias. La frase común de discapacidad y «Sobre vos» sube una vez al subtema.
      voluntariasIntro: 'Las hacen algunos formularios, sobre todo de empresas de Estados Unidos. Responder es voluntario: sin respuesta, Terna elige «Prefiero no responder».',
      voluntariasCifrado: 'Se guardan cifradas, como tu DNI, al elegir. Nunca van a tu CV ni a tu carta.',
      umbral: 'Umbral de match',
      // propuesta PLAN-PREFERENCIAS §4.4 (brand.md §6.7): el umbral es desde dónde Terna trabaja sola, también al enviar (pipeline 0.5.26).
      // Antes: «Terna arma paquetes y postula solo en avisos que lleguen a este número, salvo los de tus puestos si los priorizás. Los
      // que quedan entre {50} y tu umbral igual aparecen en Paquetes › Por armar, y podés pedirlo.»
      umbralAyuda: (min) => 'Desde este número Terna arma y postula sola. Entre ' + min + ' y tu umbral los empleos igual aparecen en Paquetes › Por armar: si pedís uno, Terna lo arma y espera tu OK para enviarlo.',
      // propuesta PLAN-UX §5.6 (brand.md §6.7): el link al tema de Cómo funciona, al lado de «Me interesa por defecto», «Tu umbral» y
      // «Armar paquetes».
      comoFunciona: 'Cómo funciona',
      // La guía del umbral (brand.md 0.5.1 §6.7; diseno.md 0.15 §9.3): las franjas siguen la rúbrica de match.v2.
      guiaUmbral: {
        intro: (defecto) => 'Cuanto más alto, menos avisos y más parecidos a tu trabajo. Si dudás, ' + defecto + '.',
        titulo: 'Qué suele haber en cada franja',
        columnas: { franja: 'Match', que: 'Qué suele ser', lista: 'En tu lista' },
        franjas: {
          90: { nombre: '90 o más', que: 'Tu mismo trabajo, de tu nivel, y cumplís casi todo lo que piden.' },
          80: { nombre: '80 a 89', que: 'Tu mismo trabajo, con algo que tu perfil no menciona.' },
          70: { nombre: '70 a 79', que: 'Un trabajo parecido al tuyo en el que cumplís casi todo.' },
          60: { nombre: '60 a 69', que: 'Parecido al tuyo pero con huecos, o el tuyo con un requisito que no cumplís.' },
          50: { nombre: '50 a 59', que: 'Algo importante queda lejos: el nivel, o dos requisitos que no cumplís.' },
        },
        usar: (u) => ', usar ' + u,
        entran: ', entran', noEntran: ', no entran',
        desde: (u) => 'desde ' + u,
        cuenta: (x) => n(x),
        cuentaParcial: (k, total) => n(k) + ' de ' + n(total),
        cuentaAccesible: (x) => (x === 0 ? 'Ningún aviso de tu lista' : x === 1 ? '1 aviso de tu lista' : n(x) + ' avisos de tu lista'),
        cuentaParcialAccesible: (k, total, u) => n(k) + ' de ' + n(total) + ' avisos de tu lista llegan a ' + u,
        marca: (u) => 'Tu umbral: ' + u,
        marcaArmaPostula: 'Para arriba, Terna arma y postula.',
        marcaArma: 'Para arriba, Terna arma el paquete.',
        nota: (piso) => 'Tu trabajo: el de tu experiencia reciente o el de un puesto que buscás. Parecido: la misma área con otro foco. Debajo de ' + piso + ' Terna no los muestra: casi siempre son de otro oficio. Tocá una franja para usar su número.',
        llegan: (u, k, total) => {
          if (total === 1) return 'Con ' + u + ', tu único aviso ' + (k ? 'llega.' : 'no llega.');
          if (k === 0) return 'Con ' + u + ', no llega ninguno de tus ' + n(total) + ' avisos.';
          return 'Con ' + u + ', ' + plural(k, 'llega 1', 'llegan ' + n(k)) + ' de tus ' + n(total) + ' avisos.';
        },
        // Con Priorizar mis puestos (brand.md 0.5.4 §6.7): los de tus puestos que no llegan y Terna toma igual.
        puestos: (k) => (k === 1 ? 'Por Priorizar mis puestos, Terna toma además 1 de tus puestos que no llega.'
          : 'Por Priorizar mis puestos, Terna toma además ' + n(k) + ' de tus puestos que no llegan.'),
        arma: (p) => 'Terna arma hasta ' + p + ' por día entre los que todavía no tienen paquete.',
        semanas: (k, u) => (k === 0 ? 'En las últimas dos semanas no llegó ninguno nuevo con ' + u + ' o más.'
          : k === 1 ? 'En las últimas dos semanas llegó 1 nuevo con ' + u + ' o más.'
            : 'En las últimas dos semanas llegaron ' + n(k) + ' nuevos con ' + u + ' o más.'),
        sinLista: 'Cuando Terna corra para vos, acá vas a ver cuántos de tus avisos llegan a cada número.',
      },
      modalidades: 'Modalidades', alMenosUna: 'Al menos una.',
      // Qué buscás (brand.md 0.4.5 §6.7; datos.md 0.9, 0015)
      puestos: 'Puestos que buscás',
      // Una casilla por puesto, numeradas (brand.md 0.4.7 §6.7; diseno.md 0.10 §9.3)
      // propuesta PLAN-PREFERENCIAS §4.4. Antes: «Uno por casilla, hasta 10. Terna pone primero los avisos de estos puestos y de puestos
      // parecidos. Aunque no cargues ninguno, también busca los que se parecen a tu título y a tus experiencias.»
      puestosAyuda: 'Uno por casilla, hasta 10. Terna pone primero los empleos de estos puestos y los parecidos. Sin ninguno, busca por tu título y tus experiencias.',
      puestosCuenta: (n, max) => n + ' de ' + max,
      puestosLlenos: 'Diez de diez, como la camiseta de Messi.',
      puesto: (n) => 'Puesto ' + n,
      puestoPrimero: 'Por ejemplo, Sales Operations',
      puestoOtro: 'Agregar otro puesto',
      quitarPuesto: (x) => 'Quitar ' + x,
      // Empresas que seguís (brand.md 0.13 §6.7; diseno.md 0.26 §9.3; datos.md 0.30, 0034): dentro de Búsqueda, debajo de los puestos,
      // con la misma forma. Solo nombres: Terna no las busca (Francisco, 07/11/2026).
      empresas: {
        titulo: 'Empresas que seguís',
        cuenta: (n, max) => n + ' de ' + max,
        ayuda: 'Una por casilla, hasta 10. Escribí el nombre completo; no importan mayúsculas, tildes ni "S.A.". Terna marca sus avisos cuando llegan por las fuentes que ya lee; no sale a buscarlos.',
        // Debajo de cada casilla: si el nombre ya encuentra algo en tus avisos (con la regla del motor).
        coincide: (x) => (x === 0 ? 'Todavía ningún aviso con ese nombre.' : x === 1 ? 'Coincide con 1 de tus avisos.' : 'Coincide con ' + n(x) + ' de tus avisos.'),
        empresa: (n) => 'Empresa ' + n,
        empresaPrimera: 'Por ejemplo, Mercado Libre',
        empresaOtra: 'Agregar otra empresa',
        quitar: (x) => 'Quitar ' + x,
        general: (e) => '"' + e + '" es muy general: solo cuentan los avisos de una empresa que se llame exactamente así.',
        priorizar: 'Priorizar mis empresas',
        priorizarAyuda: (piso) => 'En Sí, sus avisos se ven aunque no lleguen a tu umbral (desde ' + piso + ') y Terna los puntúa primero. '
          + 'Los paquetes siguen igual: los 3 del día, de mayor a menor match, primero lo que pediste. Si te interesa uno, pedí el paquete.',
      },
      // Priorizar mis puestos (brand.md 0.5.4 §6.7; datos.md 0.22, 0027): solo con algún puesto escrito; en Sí por defecto.
      priorizar: 'Priorizar mis puestos',
      priorizarAyuda: (piso) => 'En Sí, Terna arma y postula primero los avisos de estos puestos, aunque no lleguen a tu umbral (desde ' + piso + '). '
        + 'Cuenta cuando el título del aviso tiene el puesto entero, como lo escribiste. Siguen tus paquetes por día: si estos avisos los llenan, '
        + 'los demás esperan. Lo que no quieras, como pasantías, sacalo en Nivel de los puestos.',
      puestosGenerales: (lista) => {
        const q = lista.map((x) => '"' + x + '"');
        const nombres = q.length === 1 ? q[0] : q.slice(0, -1).join(', ') + ' y ' + q[q.length - 1];
        return 'Para priorizar, ' + nombres + (q.length === 1 ? ' es muy general: sumale el área.' : ' son muy generales: sumales el área.');
      },
      niveles: 'Nivel de los puestos',
      nivel: { pasantia: 'Pasantía', junior: 'Junior', semi_senior: 'Semi Senior', senior: 'Senior', lider: 'Líder o gerente', director: 'Director' },
      nivelesAyuda: 'Destildá los que no quieras. Si un aviso no dice el nivel, igual te aparece.',
      jornadas: 'Jornada',
      jornada: { completa: 'Completa', parcial: 'Parcial' },
      jornadasAyuda: 'Si un aviso no dice la jornada, igual te aparece.',
      alcance: 'Alcance', local: 'Local', localAyuda: 'Tu ciudad y alrededores', exterior: 'Exterior', exteriorAyuda: 'Remoto para el exterior', ambos: 'Ambos',
      salario: 'Salario', sugerir: 'Que lo sugiera Terna', rango: 'Entre un mínimo y un máximo', minimo: 'Mínimo', maximo: 'Máximo', moneda: 'Moneda',
      // Desde brand.md 0.14 (Francisco, 07/11/2026): el máximo es tope, como dice cv-ats.md 0.2.7 §6.4 y hace el motor (salario.py).
      // Hasta 0.13 decía "Tu máximo no recorta: si un aviso paga más, la sugerencia es la del aviso.", que no era cierto.
      salarioAyuda: 'Terna sugiere un salario por aviso y explica por qué. Nunca sugiere menos que tu mínimo ni más que tu máximo: si un aviso paga menos, te lo marca, y si paga más, lo dice al explicar el salario. Si un formulario lo pregunta, responde con ese salario o con tu rango.',
      idiomaDocs: 'Idioma de los documentos', idiomaAviso: 'El del aviso; si no está claro, inglés', idiomaEspanol: 'Siempre español',
      // Palabras clave a la vista (brand.md 0.6 §6.7; datos.md 0.23, 0026): las del aviso arrancan en Sí; las personalizadas, en No
      // y recomendadas, con las 15 que calcula el motor cada mañana.
      clavesAviso: 'Palabras clave del aviso',
      clavesAvisoAyuda: 'En Sí, en cada CV Terna pone en Habilidades las palabras del aviso que tu perfil respalda, escritas como las escribe el aviso: "Demand planning" si tu perfil dice "planificación de la demanda". Nunca una que tu perfil no tenga. En No, Habilidades va con tus palabras.',
      palabrasClave: 'Palabras clave personalizadas',
      palabrasClaveAyuda: 'Herramientas o métodos que sabés usar y tu perfil no dice. En Sí, cuentan como parte de tu perfil y van en Habilidades de los CV cuyo aviso las pide, a la vista: Terna nunca esconde texto en un CV. Sumá solo lo que sabés hacer: te lo pueden preguntar en la entrevista.',
      palabrasClaveApagado: (n) => (n > 1 ? 'Ponelo en Sí y elegí entre las ' + n + ' palabras que más piden tus avisos y tu perfil no dice.'
        : n === 1 ? 'Ponelo en Sí y mirá la palabra que más piden tus avisos y tu perfil no dice.'
          : 'Ponelo en Sí para sumar las tuyas. Terna además te recomienda las que más piden tus avisos y tu perfil no dice.'),
      recomendadasTitulo: 'Recomendadas para vos',
      recomendadasAyuda: 'Las que más piden tus avisos de los últimos 30 días y tu perfil no dice. Pesan más los avisos de match alto, los de tus puestos y los que las ponen como requisito. Marcá solo las que sabés usar: pasan a tus palabras clave.',
      recomendadaAvisos: (n) => (n === 1 ? '1 aviso' : n + ' avisos'),
      recomendadasFecha: (fecha, n) => 'Calculadas el ' + fecha + ' con ' + (n === 1 ? '1 aviso' : n + ' avisos') + '. Terna las vuelve a calcular cada mañana.',
      recomendadasVacio: 'Todavía no hay recomendadas. Terna las calcula cada mañana con tus avisos de los últimos 30 días.',
      recomendadasNinguna: 'Hoy tus avisos no piden nada que tu perfil no diga. Terna las vuelve a calcular cada mañana.',
      palabrasClaveLista: 'Tus palabras clave',
      palabrasClaveListaAyuda: 'Una por casilla, hasta 15, de hasta 40 letras. Las que marcás arriba también aparecen acá.',
      palabraClave: (n) => 'Palabra clave ' + n,
      palabraClavePrimera: 'Por ejemplo, Salesforce',
      palabraClaveOtra: 'Agregar otra palabra',
      quitarPalabraClave: (x) => 'Quitar ' + x,
      interesDefecto: 'Me interesa por defecto',
      // propuesta PLAN-PREFERENCIAS §4.4. Antes: «En Sí, todo aviso que llega a tu umbral te interesa hasta que digas lo contrario, y
      // Terna arma y postula sola. En No, decidís aviso por aviso y Terna espera tu marca.»
      interesDefectoAyuda: 'En Sí, todo lo que llega a tu umbral cuenta como «Me interesa» y Terna avanza sola. En No, Terna espera tu marca aviso por aviso.',
      // Desde brand.md 0.7 los paquetes por día son siempre 3 (config.paquetes_por_dia_opciones = {3}, 0028): no hay qué elegir, y la
      // ayuda de Armar paquetes dice cuántos arma y en qué orden (seleccion.py, pipeline.md §4.9). Desde brand.md 0.30 (17/11/2026) no
      // dice «y no más de una vez por semana a la misma empresa»: la regla salió (pipeline.md 0.5.10).
      cvIdeal: 'CV IDEAL',
      cvIdealAyuda: 'Integra palabras clave del aviso en el resumen, las experiencias y los grupos de habilidades existentes, conservando las habilidades y palabras clave del CV estándar. Puede incorporar términos sin respaldo en tu perfil. Revisá el contenido antes de usarlo. No garantiza superar todos los filtros ni recibir una entrevista. Se aplica a los próximos paquetes.',
      armar: 'Armar paquetes',
      // propuesta PLAN-PREFERENCIAS §4.4 (57 → 30 palabras). Antes: «En Sí, Terna arma {3} paquetes por día, del aviso de mayor match
      // para abajo. Se adelantan los que pediste, los de tus puestos si los priorizás y, si Terna postula por vos, los que puede postular
      // sola. Terna postula como máximo a esos {3}. En No, solo busca y puntúa avisos.»
      // propuesta PLAN-PREFERENCIAS (brand.md §6.7), FEEDBACK-PREFERENCIAS P2-6: dice que el tope no se elige (quien buscaba «cuántos por
      // día» no encontraba el control). {n} sale de config (paquetes_por_dia_default) y el paréntesis va mientras config ofrezca un solo
      // número (`variable` en false: 0028, {3}). Antes: «En Sí, Terna arma hasta {3} paquetes por día: primero lo que pediste, después tus
      // puestos y después el resto, por match. En No, solo busca y puntúa.»
      armarAyuda: (n, variable) => 'En Sí, Terna arma hasta ' + n + ' paquetes por día' + (variable ? '' : ' (el tope es el mismo para todos)')
        + ': primero lo que pediste, después tus puestos y después el resto, por match. En No, solo busca y puntúa.',
      recomendado: (x) => x + ' (recomendado)',
      postularSola: 'Terna postula por vos',
      // propuesta PLAN-UX (brand.md §6.7), FEEDBACK-UX P1-2: «Nunca entra con cuentas tuyas» era falso para quien responde Sí a la
      // pregunta de las cuentas, que va justo debajo. Hasta acá: «Nunca entra con cuentas tuyas, nunca resuelve captchas…».
      // propuesta PLAN-PREFERENCIAS §4.4 (85 → 52 palabras; el link «Cómo funciona», a #postular, cuenta el resto). Antes: «Terna postula
      // sola en los avisos que te interesan y cuyo formulario es público y conocido. Llena el formulario con tu perfil, sube tu CV y tu
      // carta y responde las preguntas con lo que tu perfil dice. Nunca entra con tus cuentas de LinkedIn ni de los portales, nunca
      // resuelve captchas y nunca inventa una respuesta. Lo que no puede hacer te lo deja listo para hacerlo a mano. Cada envío queda
      // guardado con las respuestas y una captura.»
      postularSolaAyuda: 'En Sí, Terna llena y envía el formulario donde es público y conocido, con tu perfil, tu CV y tu carta. Nunca entra con tus cuentas de LinkedIn ni de los portales, no resuelve captchas y no inventa respuestas. Lo que no puede, te lo deja listo para hacerlo a mano. Cada envío queda guardado.',
      cobertura: (x) => 'De cada 10 avisos, Terna puede postular en ' + x + '.',
      // "¿Terna crea cuentas por vos?" (brand.md 0.16 §6.7; diseno.md 0.29 §9.3; datos.md 0.32, 0036): justo debajo de "Terna
      // postula por vos" y solo con ese Sí. Una pregunta con su contexto, que nace sin respuesta: sin un Sí, Terna no crea nada.
      cuentas: {
        titulo: '¿Terna crea cuentas por vos?',
        porQue: 'Muchas empresas grandes (las que usan Workday, SuccessFactors u Oracle) piden crear una cuenta en su sitio para postular. Hoy esas postulaciones te quedan para hacer a mano.',
        ultimoMes: (x) => plural(x, 'En el último mes fue 1.', 'En el último mes fueron ' + n(x) + '.'),
        queHace: 'Si decís que sí, Terna crea la cuenta con tu mail y una contraseña que genera para esos sitios, la misma en todos, y postula por vos. La contraseña la ves acá.',
        saber: 'Algunas empresas mandan un mail para confirmar la cuenta: te explicamos cómo dejar que Terna lo vea sin darle tu correo. La empresa podría bloquear la cuenta si detecta que la creó un programa. Lo cambiás cuando quieras, y las cuentas que Terna creó siguen siendo tuyas.',
        // brand.md 0.18 §6.7 y §9 (propuesta: falta el OK de Francisco al texto): mientras no exista la guía de los mails, esta línea lo dice.
        guiaEnCamino: 'La guía para que Terna vea esos mails está en camino. Hasta que esté, si una empresa manda uno, confirmás la cuenta desde tu correo y esa postulación la hacés vos; las siguientes en ese sitio, Terna entra con la cuenta.',
        si: 'Sí, creá las cuentas',
        no: 'No, las hago yo',
        contrasena: 'Tu contraseña para esos sitios',
        ver: 'Ver', ocultar: 'Ocultar', copiar: 'Copiar', copiada: 'Copiada.',
        contrasenaAyuda: 'Es solo para estos sitios: no es la de Terna ni la de tu mail. Si la cambiás en un sitio, cambiala solo ahí.',
        sitios: 'Sitios donde Terna creó una cuenta',
        estado: { creada: (fecha) => 'Creada el ' + fecha, confirmada: 'Confirmada', ya_existia: 'Ya tenías una cuenta: Terna no entró', fallo: 'No se pudo crear' },
        ninguna: 'Todavía ninguna.',
      },
      // «Para quien contrata» (contratar.md 0.1 §6.3 y §8.3; datos.md 0.44, 0055): nace en No. Con Sí, quien publica un aviso en
      // Terna te ve entre las personas que ajustan, sin tu nombre ni dónde trabajás, y te puede proponer postular.
      contratar: {
        // propuesta PLAN-PREFERENCIAS §4.1 (D3): el bloque es para vos, no para quien contrata. Antes: «Para quien contrata».
        titulo: 'Quién te ve',
        visible: 'Que me encuentren quienes contratan en Terna',
        visibleAyuda: 'Hay personas y empresas que publican sus avisos en Terna. Con Sí, si ajustás bien con uno, quien lo publicó te ve en una lista, sin tu nombre, y te puede proponer postular. Postular es siempre decisión tuya: nadie ve tu nombre ni tus datos hasta que postulás.',
        queVenTitulo: 'Lo que ve de vos, sin que postules:',
        queVen: ['Un código en lugar de tu nombre (por ejemplo, C-4F2A9).', 'El título de tu perfil, tus años de experiencia, tu ciudad y tus idiomas.',
          'Las modalidades que buscás y qué requisitos del aviso cumplís.'],
        reconocer: 'No ve tu nombre, tu mail, tu teléfono, tu LinkedIn, dónde trabajás ni tu CV. Igual, en un lugar chico alguien te podría reconocer por lo que ve: tenelo en cuenta.',
        noMostrar: 'Empresas que no te tienen que ver',
        noMostrarAyuda: 'Una por línea, hasta 10. Terna ya te oculta de la empresa donde trabajás hoy (la de tu experiencia actual) y de quien contrata con un mail de la misma empresa que el tuyo.',
        noMostrarError: (max) => 'Hasta ' + max + ' empresas, de hasta 80 letras cada una.',
      },
      // «¿Tenés una discapacidad?» (brand.md 0.24 §6.7; diseno.md 0.36 §9.3; datos.md 0.35, 0039): Francisco, 12/11/2026. Para los
      // formularios que lo preguntan (la autoidentificación de los de EE. UU., CC-305). Nace en «Prefiero no responder», que es lo que
      // Terna elegía siempre; escribe en el acto y se guarda cifrada. Nunca se pregunta cuál. La lista es la del formulario CC-305.
      // propuesta PLAN-PREFERENCIAS §4.4: el «por qué» y lo del cifrado suben una vez a Preguntas voluntarias (voluntariasIntro,
      // voluntariasCifrado). Antes: porQue «Algunos formularios, sobre todo de empresas de Estados Unidos, preguntan si tenés una
      // discapacidad. Responder es voluntario: si no lo hacés, Terna elige «Prefiero no responder».» y queHace «Terna usa tu respuesta
      // solo para contestar esa pregunta, en los formularios que la hacen. Se guarda cifrada, como tu DNI, y nunca va a tu CV ni a tu
      // carta. Terna no te pregunta cuál.»
      discapacidad: {
        titulo: '¿Tenés una discapacidad?',
        queHace: 'Terna no te pregunta cuál.',
        noResponder: 'Prefiero no responder',
        no: 'No',
        si: 'Sí',
        queCuenta: 'Qué cuenta como discapacidad',
        definicion: 'Según el formulario que usan las empresas de Estados Unidos, una discapacidad es una condición que limita de forma importante una o más actividades principales de la vida. Si la tenés o la tuviste alguna vez, cuenta. Incluye, entre otras:',
        lista: [
          'Trastorno por consumo de alcohol u otras sustancias (sin consumo ilegal actual de drogas)',
          'Trastorno autoinmune, por ejemplo lupus, fibromialgia, artritis reumatoidea o VIH/sida',
          'Ceguera o baja visión',
          'Cáncer, actual o pasado',
          'Enfermedad cardiovascular o del corazón',
          'Celiaquía',
          'Parálisis cerebral',
          'Sordera o dificultad grave para oír',
          'Diabetes',
          'Desfiguración, por ejemplo por quemaduras, heridas, accidentes o trastornos congénitos',
          'Epilepsia u otro trastorno convulsivo',
          'Trastornos gastrointestinales, por ejemplo enfermedad de Crohn o síndrome de intestino irritable',
          'Discapacidad intelectual o del desarrollo',
          'Condiciones de salud mental, por ejemplo depresión, trastorno bipolar, trastorno de ansiedad, esquizofrenia o TEPT',
          'Pérdida total o parcial de extremidades',
          'Movilidad reducida, con silla de ruedas, scooter, andador, órtesis u otros apoyos',
          'Condiciones del sistema nervioso, por ejemplo migraña, enfermedad de Parkinson o esclerosis múltiple',
          'Neurodivergencia, por ejemplo TDAH, trastorno del espectro autista, dislexia, dispraxia u otras dificultades de aprendizaje',
          'Parálisis parcial o total, de cualquier causa',
          'Condiciones pulmonares o respiratorias, por ejemplo tuberculosis, asma o enfisema',
          'Baja estatura (enanismo)',
          'Lesión cerebral traumática',
        ],
        confidencial: 'Ese formulario dice que responder es voluntario y confidencial, y que quien decide la contratación no ve tu respuesta.',
      },
      // «Sobre vos, para los formularios» (brand.md 0.35 §6.7; diseno.md 0.43 §9.3; datos.md 0.41, 0049): Francisco, 17/11/2026,
      // con ASAPP y Canonical: la autoidentificación voluntaria de los formularios (sobre todo de EE. UU.), que Terna contestaba siempre
      // «Prefiero no responder» porque no la tenía. Cada pregunta nace en «Prefiero no responder», escribe en el acto y se guarda cifrada.
      // propuesta PLAN-PREFERENCIAS §4.4, como en discapacidad. Antes: porQue «Algunos formularios, sobre todo de empresas de Estados
      // Unidos, preguntan tu género, tu origen o si sos veterano. Responder es voluntario: si dejás «Prefiero no responder», Terna elige
      // esa opción.» y queHace «Terna usa tus respuestas solo para contestar esas preguntas y elige la opción del formulario que diga lo
      // mismo; si ninguna lo dice, «Prefiero no responder». Se guardan cifradas, como tu DNI, y nunca van a tu CV ni a tu carta.»
      autoidentificacion: {
        titulo: 'Sobre vos, para los formularios',
        queHace: 'Terna elige la opción del formulario que diga lo mismo.',
        noResponder: 'Prefiero no responder',
        preguntas: [
          ['genero', 'Género', [['hombre', 'Hombre'], ['mujer', 'Mujer'], ['no_binario', 'No binario']]],
          ['pronombres', 'Pronombres', [['el', 'Él (he/him)'], ['ella', 'Ella (she/her)'], ['elle', 'Elle (they/them)']]],
          ['hispano', '¿Sos hispano o latino?', [['si', 'Sí'], ['no', 'No']], 'En los formularios de Estados Unidos, «hispano o latino» es tener origen en América Latina o España, sin importar la raza. Si naciste o tu familia es de Argentina, es Sí.'],
          ['raza', 'Raza', [['blanca', 'Blanca'], ['negra', 'Negra o afrodescendiente'], ['asiatica', 'Asiática'], ['indigena_americana', 'Indígena de América'], ['isla_pacifico', 'Nativa de Hawái u otras islas del Pacífico'], ['dos_o_mas', 'Dos o más']], 'Se usa cuando el formulario pregunta la raza aparte. Si en la misma lista está «Hispanic or Latino», Terna elige esa si respondiste Sí arriba.'],
          ['veterano', '¿Sos veterano de las Fuerzas Armadas de Estados Unidos?', [['no', 'No'], ['si', 'Sí']], 'Solo cuenta el servicio en las Fuerzas Armadas de Estados Unidos. El servicio militar en Argentina u otro país es No.'],
        ],
      },
      // Tu secundario y viajar (brand.md 0.24 §6.7; datos.md 0.35, 0039): Francisco, 12/11/2026, 20:59, para los formularios que lo
      // preguntan (los de Canonical, con su misma escala). Se guardan con "Guardar preferencias"; sin respuesta, Terna no contesta esas
      // preguntas y la postulación queda a mano diciendo dónde se cargan.
      secundario: {
        titulo: 'Tu secundario',
        ayuda: 'Algunas empresas preguntan cómo te fue en el secundario. Terna elige en su lista la opción que diga lo mismo que vos y no inventa ninguna.',
        matematica: '¿Cómo te fue en matemática?',
        lengua: '¿Y en lengua?',
        sinResponder: 'Sin responder',
        escala: [['no_recuerdo', 'No me acuerdo'], ['no_fuerte', 'No era mi fuerte'], ['top50', 'Entre el 50 % mejor de mi escuela'], ['top20', 'Entre el 20 % mejor de mi escuela'],
          ['top10', 'Entre el 10 % mejor de mi escuela'], ['top5', 'Entre el 5 % mejor de mi escuela'], ['top1_region', 'Entre el 1 % mejor de mi región'],
          ['top01_region', 'Entre el 0,1 % mejor de mi región'], ['top001_region', 'Entre el 0,01 % mejor de mi región']],
        evidencia: '¿Cómo lo sabés? (opcional)',
        evidenciaAyuda: 'Tu promedio, un ranking, un premio o el resultado de un examen. Escribilo con tus palabras: Terna lo pega tal cual cuando el formulario lo pide.',
      },
      viajar: {
        titulo: '¿Podés viajar por trabajo, también al exterior?',
        ayuda: 'Algunas empresas piden reunirse en persona unas veces por año, en otro país. Terna usa tu respuesta en las preguntas de sí o no sobre viajar.',
        si: 'Sí',
        no: 'No',
      },
      revisar: 'Revisar antes de enviar',
      // propuesta PLAN-PREFERENCIAS §4.4 (dice lo de 0.5.26: debajo del umbral, Terna espera siempre). Antes: «En Sí, Terna llena el
      // formulario y espera que lo apruebes desde Postulaciones. Se envía en la corrida siguiente.»
      revisarAyuda: 'En Sí, Terna llena el formulario y espera tu OK en Postulaciones; lo envía en la corrida siguiente. Lo que está debajo de tu umbral espera tu OK siempre.',
      // Alertas por mail (brand.md 0.4.11 §6.7): desde PLAN-PREFERENCIAS (D4), un subtema de Empleos, más corto: la dirección, los cinco
      // portales con su estado y un link a las guías de alertas.html, que tienen los pasos y el reenvío.
      alertas: 'Alertas por mail',
      // propuesta PLAN-PREFERENCIAS §4.5. Antes: «Para que Terna vea las alertas de empleo de LinkedIn, Bumeran, Zonajobs, Computrabajo e
      // Indeed sin entrar con tu cuenta a esos sitios.» La dueña del buzón (Terna.alertasMail) no reenvía: su intro no dice a qué dirección.
      alertasIntro: 'Terna también lee las alertas de empleo que te mandan los portales, sin entrar con tu cuenta. Se las reenviás a esta dirección:',
      alertasIntroDueno: 'Terna también lee las alertas de empleo que te mandan los portales, sin entrar con tu cuenta.',
      copiarDireccion: 'Copiar dirección',
      // propuesta PLAN-PREFERENCIAS §4.5: salen de Preferencias los tres pasos (alertasPasos, alertasPasosDueno) y el ítem «Reenvío
      // automático» con sus tres botones (reenvioTitulo, reenvioAyuda, guiasCorreo y sus …Dueno): quedan en alertas.html#como-funciona,
      // adonde lleva este link.
      alertasGuia: 'Cómo armar el reenvío',
      alertasGuiaDueno: 'Cómo armar el filtro',
      portalesTitulo: 'Portales',
      // [portal en alertas_mail, nombre, guía en alertas.html]
      portales: [['linkedin', 'LinkedIn', 'linkedin'], ['bumeran', 'Bumeran', 'bumeran'], ['zonajobs', 'Zonajobs', 'zonajobs'], ['computrabajo', 'Computrabajo', 'computrabajo'], ['indeed', 'Indeed', 'indeed']],
      comoCrearla: 'Cómo crearla',
      alertaUltima: (fecha, n) => 'Última alerta: ' + fecha + ' · ' + n + (n === 1 ? ' aviso' : ' avisos'),
      alertaSinAvisos: 'Llegaron mails, pero sin avisos. Si eran alertas, avisale a Francisco.',
      alertaNinguna: 'Sin alertas en los últimos 7 días',
      portalesAyuda: 'Lo que Terna recibió en los últimos 7 días. Se actualiza en cada corrida.',
      // propuesta PLAN-PREFERENCIAS §4.5 (dónde llegan ya lo cuenta la guía, en «Tu dirección de Terna»). Antes: «Reenviá solo las
      // alertas, nunca todo tu correo. Las que reenviás llegan a una casilla de Gmail de Francisco, en una carpeta aparte que Terna lee
      // para sacar los avisos, y se borran a los 7 días.»
      alertasNota: 'Reenviá solo las alertas, nunca todo tu correo. Se borran a los 7 días.',
      alertasNotaDueno: 'Terna lee solo los mails de tu Gmail que tienen la etiqueta Terna/Alertas. Ponésela solo a las alertas.',
      guardar: 'Guardar preferencias',
      guardado: 'Guardado. Se aplica desde la próxima corrida.',
    },

    // Guías de alertas (alertas.html; brand.md 0.4.17 §6.7.1). "*así*" va en negrita: el nombre de un botón o un menú tal
    // como se ve en pantalla (puede variar un poco según la versión del sitio). Cada sección es un bloque con su hash.
    guias: {
      carril: 'Guías',
      volver: 'Volver a Preferencias',
      copiarDireccion: 'Copiar dirección',
      copiarRemitentes: 'Copiar remitentes',
      copiar: 'Copiar',
      // Los remitentes de las alertas de LinkedIn e Indeed vistos en mails reales (31/10/2026), como los pide el campo "De"
      // de un filtro de Gmail. Tienen que coincidir con terna-motor/datos/alertas_mail.json. Los de Bumeran, Zonajobs y
      // Computrabajo no se conocen todavía: para esos, el filtro se arma desde un mail de alerta.
      remitentes: 'jobalerts-noreply@linkedin.com OR donotreply@jobalert.indeed.com OR donotreply@match.indeed.com OR alert@indeed.com',
      remitentesLista: ['jobalerts-noreply@linkedin.com', 'donotreply@jobalert.indeed.com', 'donotreply@match.indeed.com', 'alert@indeed.com'],
      tusPuestos: 'Tus puestos en Terna. Creá una alerta por cada uno, con las mismas palabras:',
      puestosAyuda: 'Si un puesto tiene otro nombre en inglés (Sales Analyst, Demand Planner), sumá una alerta más con ese nombre.',
      cambiarPuestos: 'Cambiar en Preferencias',
      sinPuestos: 'Todavía no cargaste los puestos que buscás.',
      cargarPuestos: 'Cargalos en Preferencias',
      secciones: [
        // Las piezas con un tercer elemento se muestran solo a quien no es ('resto') o a quien es ('dueno') la dueña del
        // buzón de Terna (Terna.alertasMail): Gmail no la deja reenviarse a sí misma, así que etiqueta sus alertas.
        // propuesta PLAN-UX §5.6 (brand.md §6.7.1): «Cómo funcionan las alertas», para no chocar con la página Cómo funciona (la clave
        // y el hash no cambian); el paso 3, sin el relato de los tres intentos y de Francisco, y «aparecen en Paquetes › Por armar».
        { clave: 'como-funciona', titulo: 'Cómo funcionan las alertas', piezas: [
          ['p', 'Los portales de empleo te mandan por mail los avisos nuevos de lo que buscás. Si esos mails le llegan a Terna, Terna los lee cada mañana, sin entrar con tu cuenta a los portales, y suma los avisos a tu lista.'],
          ['pasos', [
            '*Creá las alertas* en los portales que uses: una por cada puesto que buscás, diaria y por mail.',
            '*Armá en tu correo* una carpeta para las alertas y un filtro que se las reenvía solo a tu dirección de Terna. Se hace una vez, desde una computadora.',
            '*Listo.* Al día siguiente de cada alerta, sus avisos aparecen en Paquetes › Por armar. Terna busca el texto completo de cada uno, sin entrar con ninguna cuenta, para darte el match.',
          ], 'resto'],
          ['pasos', [
            '*Creá las alertas* en los portales que uses: una por cada puesto que buscás, diaria y por mail.',
            '*Armá en tu Gmail* un filtro que les ponga a tus alertas la etiqueta *Terna/Alertas*. Se hace una vez, desde una computadora.',
            '*Listo.* Al día siguiente de cada alerta, sus avisos aparecen en Paquetes › Por armar. Terna busca el texto completo de cada uno, sin entrar con ninguna cuenta, para darte el match.',
          ], 'dueno'],
          ['subtitulo', 'Tu dirección de Terna', 'resto'],
          ['p', 'Es la dirección de mail a la que le mandás tus alertas. Es solo tuya: por ella Terna sabe que esas alertas son tuyas. Lleva el nombre de Francisco porque llega a una casilla de Gmail suya, en una etiqueta aparte que lee Terna.', 'resto'],
          ['direccion', null, 'resto'],
          ['nota', 'La vas a pegar en el filtro de tu correo, o al reenviar una alerta a mano. Mandale ahí solo las alertas, nunca todo tu correo.', 'resto'],
          ['subtitulo', 'Tu Gmail es la casilla de Terna', 'dueno'],
          ['p', 'Las alertas de todos llegan a tu Gmail, así que las tuyas no hace falta reenviarlas: Terna toma como tuyas las que te llegan a vos con la etiqueta *Terna/Alertas*. Tu dirección de Terna no te sirve: Gmail no deja reenviarse a uno mismo.', 'dueno'],
          ['subtitulo', 'Qué buscar'],
          ['puestos'],
          ['subtitulo', 'Lo que Terna no hace'],
          ['lista', [
            'Entrar a tus cuentas de los portales ni pedirte sus contraseñas.',
            'Abrir los links de los mails: algunos abren tu cuenta sin pedir contraseña. Terna guarda solo el link limpio del aviso.',
            'Leer otros mails tuyos: solo lo que llega a tu dirección de Terna.',
          ], 'resto'],
          ['lista', [
            'Entrar a tus cuentas de los portales ni pedirte sus contraseñas.',
            'Abrir los links de los mails: algunos abren tu cuenta sin pedir contraseña. Terna guarda solo el link limpio del aviso.',
            'Leer otros mails tuyos: solo los que tienen la etiqueta *Terna/Alertas*.',
          ], 'dueno'],
          ['subtitulo', 'Las guías'],
          ['indice', [
            ['Crear la alerta en LinkedIn', '#linkedin'], ['Crear la alerta en Bumeran', '#bumeran'], ['Crear la alerta en Zonajobs', '#zonajobs'],
            ['Crear la alerta en Computrabajo', '#computrabajo'], ['Crear la alerta en Indeed', '#indeed'],
            ['Reenviarlas solas desde Gmail', '#gmail'], ['Reenviarlas solas desde Outlook o Hotmail', '#outlook'], ['Reenviar una a mano, desde el celular', '#a-mano'],
          ], 'resto'],
          ['indice', [
            ['Crear la alerta en LinkedIn', '#linkedin'], ['Crear la alerta en Bumeran', '#bumeran'], ['Crear la alerta en Zonajobs', '#zonajobs'],
            ['Crear la alerta en Computrabajo', '#computrabajo'], ['Crear la alerta en Indeed', '#indeed'],
            ['Etiquetarlas solas en Gmail', '#gmail'], ['Etiquetar una a mano, desde el celular', '#a-mano'],
          ], 'dueno'],
        ] },
        { clave: 'linkedin', titulo: 'LinkedIn', piezas: [
          ['p', 'Desde la app o desde linkedin.com, con tu cuenta. Si ya tenés alertas, revisá en el paso 5 que lleguen por mail.'],
          ['pasos', [
            'Tocá *Empleos* y buscá un puesto, con la ubicación: por ejemplo *Buenos Aires y alrededores* o *Argentina*.',
            'Si querés, ajustá los filtros de arriba: *Modalidad* (presencial, híbrido, remoto), *Nivel de experiencia*, *Tipo de empleo*.',
            'Activá la alerta de esa búsqueda: en la computadora, el interruptor de alerta que está arriba de los resultados; en la app, el interruptor para recibir alertas de empleo de esta búsqueda.',
            'Repetí con cada puesto que buscás: una alerta por puesto.',
            'Para que lleguen por mail: *Empleos* > *Preferencias* > *Alertas de empleo*. En cada alerta, elegí que llegue *Diariamente* y por *Correo electrónico* (o por correo y notificación).',
          ]],
          ['nota', 'LinkedIn manda las alertas desde *jobalerts-noreply@linkedin.com*. Los mails de tus postulaciones vienen de otra dirección y no hace falta reenviarlos.'],
          ['ir', ['Después: reenviarlas solas desde Gmail', '#gmail'], 'resto'],
          ['ir', ['Después: etiquetarlas solas en Gmail', '#gmail'], 'dueno'],
        ] },
        { clave: 'bumeran', titulo: 'Bumeran', piezas: [
          ['p', 'En bumeran.com.ar o en su app, con tu cuenta de postulante (si no tenés, creala con tu mail).'],
          ['pasos', [
            'Buscá un puesto y elegí la zona (por ejemplo, Capital Federal o GBA).',
            'Si querés, filtrá por modalidad o por área.',
            'En los resultados, buscá la opción para crear una alerta con esa búsqueda (suele tener una campanita) y elegí recibirla por mail.',
            'Repetí con cada puesto que buscás.',
            'Cuando te llegue la primera alerta, armá el filtro de tu correo desde ese mail (las guías de Gmail y Outlook dicen cómo).',
          ]],
          ['nota', 'Bumeran no publica cómo se llaman sus botones, así que pueden decir algo un poco distinto. También avisa en la app; para Terna sirve la del mail.'],
          ['cuidado', 'Armá el filtro desde un mail de *alerta*, no desde uno de tu cuenta: Bumeran también manda por mail códigos para entrar, y esos no tienen que llegar a Terna.'],
        ] },
        { clave: 'zonajobs', titulo: 'Zonajobs', piezas: [
          ['p', 'Zonajobs es de la misma empresa que Bumeran y funciona igual: en zonajobs.com.ar, con tu cuenta.'],
          ['pasos', [
            'Buscá un puesto y elegí la zona.',
            'En los resultados, creá la alerta con esa búsqueda y elegí recibirla por mail.',
            'Repetí con cada puesto que buscás.',
            'Cuando te llegue la primera alerta, armá el filtro de tu correo desde ese mail.',
          ]],
          ['nota', 'Muchos avisos están en los dos sitios. Si usás los dos, Terna junta los repetidos y te muestra cada aviso una vez.'],
        ] },
        { clave: 'computrabajo', titulo: 'Computrabajo', piezas: [
          ['p', 'En ar.computrabajo.com o en su app.'],
          ['pasos', [
            'Buscá un puesto y elegí el lugar.',
            'En los resultados aparece el recuadro *¿Te avisamos si hay nuevas ofertas?*: completalo con tu mail y activá la alerta.',
            'Si Computrabajo te manda un mail para confirmar la alerta, confirmala.',
            'Repetí con cada puesto que buscás.',
            'Cuando te llegue la primera alerta, armá el filtro de tu correo desde ese mail.',
          ]],
          ['nota', 'Para darla de baja, al pie de cada alerta hay un link para cancelar la suscripción.'],
        ] },
        { clave: 'indeed', titulo: 'Indeed', piezas: [
          ['p', 'En ar.indeed.com, con tu cuenta (si no tenés, la creás con tu mail).'],
          ['pasos', [
            'Escribí el puesto y la ubicación (una ciudad, una zona o *remoto*) y tocá *Buscar*.',
            'Al pie de la primera página de resultados, escribí tu mail y tocá *Activar*. Si aparece una ventana, confirmá tu mail y tocá *Activar* otra vez.',
            'Repetí con cada puesto que buscás.',
            'Para elegir la frecuencia: *Configuración* > *Configuración de comunicaciones* > *Email* > *Alertas de empleos y empresas*, y el lápiz de cada alerta. Elegí *Diaria*.',
          ]],
          ['nota', 'Indeed manda dos tipos de mail con avisos, y Terna lee los dos: las alertas de tus búsquedas y los de *empleo compatible* (uno por mail, según tu perfil). Sus remitentes están en el atajo de la guía de Gmail.'],
          ['cuidado', 'Indeed también manda por mail códigos para entrar a tu cuenta (desde *login@indeed.com*). Nunca armes el filtro con todo lo que llega de Indeed: solo con los remitentes de las alertas.'],
        ] },
        { clave: 'gmail', titulo: 'Gmail', piezas: [
          ['p', 'Se hace una sola vez, desde una computadora y en gmail.com: la app del celular no deja crear filtros ni reenvíos. Son tres partes: una etiqueta donde guardar las alertas, tu dirección de Terna como dirección de reenvío y un filtro que hace todo solo. La segunda necesita que Francisco confirme algo desde su correo; mientras tanto podés armar la tercera y sumarle el reenvío después.', 'resto'],
          ['p', 'Tu Gmail es la casilla donde Terna lee las alertas de todos, así que vos no reenviás nada: Gmail no deja reenviarse a uno mismo (por eso, si probaste agregar tu dirección de Terna, te dijo que no es válida). Alcanza con un filtro que les ponga a tus alertas la etiqueta que lee Terna, *Terna/Alertas*. Se hace una sola vez, desde una computadora y en gmail.com.', 'dueno'],
          ['subtitulo', '1. La etiqueta (así llama Gmail a las carpetas)', 'resto'],
          ['pasos', [
            'En la columna de la izquierda, bajá hasta *Etiquetas* y tocá el *+* que está a su derecha.',
            'Escribí *Alertas de empleo* y tocá *Crear*.',
          ], 'resto'],
          ['subtitulo', '2. Tu dirección de Terna como dirección de reenvío', 'resto'],
          ['p', 'Gmail solo reenvía a direcciones que antes agregaste y que aceptaron recibir tus mails. La que tenés que agregar es tu dirección de Terna. Copiala antes de empezar:', 'resto'],
          ['direccion', null, 'resto'],
          ['pasos', [
            'Arriba a la derecha, tocá el engranaje (*Configuración*) y después *Ver toda la configuración*.',
            'En las pestañas de arriba, entrá a *Reenvío y correo POP/IMAP*.',
            'Tocá *Agregar una dirección de reenvío*. En la ventana que se abre, pegá la dirección que copiaste y tocá *Siguiente*.',
            'Gmail te muestra la dirección para que la revises: tocá *Continuar* y después *Aceptar*.',
            'Gmail le manda un mail a esa dirección para que confirme. Ese mail le llega a Francisco, no a vos: *avisale que la agregaste*, así la confirma desde su correo.',
            'Cuando te diga que está confirmada, volvé a esta pestaña y recargá la página. No cambies nada más ahí.',
          ], 'resto'],
          ['cuidado', 'En esta pestaña tiene que quedar elegido *Inhabilitar el reenvío*. Nunca elijas *Reenviar una copia del correo entrante a*: eso le manda a Terna todo tu correo. Terna solo necesita las alertas, y de elegirlas se encarga el filtro de la parte 3.', 'resto'],
          ['subtitulo', '3. El filtro, que elige las alertas y se las reenvía a Terna', 'resto'],
          ['subtitulo', 'El filtro, desde un mail de alerta', 'dueno'],
          ['p', 'Se arma desde un mail de alerta que ya te haya llegado: así Gmail copia el remitente exacto del portal. Si todavía no te llegó ninguna, esperá a la primera, o usá el atajo de más abajo para LinkedIn e Indeed.'],
          ['pasos', [
            'Abrí un mail de alerta del portal (por ejemplo, una alerta de LinkedIn).',
            'Arriba del mail, tocá los tres puntos (*Más*) y elegí *Filtrar mensajes como estos*. Gmail completa *De* con el remitente de la alerta.',
            'Tocá *Crear filtro*. Aparece la lista de lo que el filtro puede hacer con esos mails.',
            'Si no querés ver las alertas en tu bandeja de entrada, tildá *Omitir Recibidos (Archivarlo)*.',
            'Tildá *Aplicar la etiqueta* y elegí *Alertas de empleo*.',
            'Tildá *Reenviarlo a* y elegí tu dirección de Terna. Si no aparece, Francisco todavía no confirmó la parte 2: seguí sin esto y sumale el reenvío después (abajo dice cómo).',
            'Tildá *Aplicar el filtro también a las conversaciones que coinciden*, para que las alertas que ya tenés vayan a la etiqueta, y tocá *Crear filtro*.',
            'Repetí desde una alerta de cada portal que uses.',
          ], 'resto'],
          ['pasos', [
            'Abrí un mail de alerta del portal (por ejemplo, una alerta de LinkedIn).',
            'Arriba del mail, tocá los tres puntos (*Más*) y elegí *Filtrar mensajes como estos*. Gmail completa *De* con el remitente de la alerta.',
            'Tocá *Crear filtro*. Aparece la lista de lo que el filtro puede hacer con esos mails.',
            'Si no querés ver las alertas en tu bandeja de entrada, tildá *Omitir Recibidos (Archivarlo)*.',
            'Tildá *Aplicar la etiqueta* y elegí *Terna/Alertas*. No tildes *Reenviarlo a*.',
            'Tildá *Aplicar el filtro también a las conversaciones que coinciden* y tocá *Crear filtro*. Así Terna lee también las alertas de los últimos 7 días que ya tenías.',
            'Repetí desde una alerta de cada portal que uses.',
          ], 'dueno'],
          ['cuidado', 'Armá el filtro solo desde mails de *alertas*, no desde mails de tu cuenta del portal (códigos para entrar, postulaciones): esos no tienen que llegar a Terna.', 'resto'],
          ['cuidado', 'La etiqueta tiene que ser *Terna/Alertas*: es la única que Terna lee. Y armá el filtro solo desde mails de *alertas*, no desde mails de tu cuenta del portal (códigos para entrar, postulaciones).', 'dueno'],
          ['subtitulo', 'Atajo para LinkedIn e Indeed'],
          ['p', 'Un solo filtro para los dos, sin esperar una alerta: en la barra de búsqueda de Gmail tocá el ícono de la derecha (*Mostrar opciones de búsqueda*), pegá esto en *De*, tocá *Crear filtro* y seguí desde el paso 4.'],
          ['remitentes'],
          ['nota', 'El filtro reenvía las alertas que lleguen desde ahora; las que ya tenías quedan en la etiqueta, pero no se reenvían. Durante una semana Gmail muestra arriba un aviso de que estás reenviando parte de tu correo: es normal.', 'resto'],
          ['subtitulo', 'Para sumarle el reenvío a un filtro que ya armaste', 'resto'],
          ['pasos', [
            'Engranaje (*Configuración*) > *Ver toda la configuración* > pestaña *Filtros y direcciones bloqueadas*.',
            'En el filtro de las alertas, tocá *Editar* y después *Continuar*.',
            'Tildá *Reenviarlo a*, elegí tu dirección de Terna y tocá *Actualizar filtro*.',
          ], 'resto'],
          ['cuidado', 'En *Filtros y direcciones bloqueadas* ya hay un filtro con *deliveredto:terna*: es el que pone en *Terna/Alertas* las alertas que te reenvían los demás. No lo cambies ni lo borres.', 'dueno'],
        ] },
        { clave: 'outlook', titulo: 'Outlook o Hotmail', piezas: [
          ['p', 'Se hace una sola vez, desde una computadora y en outlook.com (sirve para cuentas de Hotmail, Outlook y Live): la app del celular no deja crear reglas. Son dos partes, una carpeta y una regla, y no hace falta que nadie confirme nada.', 'resto'],
          ['subtitulo', '1. Una carpeta para las alertas', 'resto'],
          ['pasos', [
            'En la columna de la izquierda, hacé clic con el botón derecho sobre tu cuenta (tu dirección de mail) y elegí *Crear nueva carpeta*.',
            'Escribí *Alertas de empleo* y apretá Enter.',
          ], 'resto'],
          ['subtitulo', '2. La regla, que elige las alertas y se las manda a Terna', 'resto'],
          ['p', 'Se arma desde un mail de alerta que ya te haya llegado: así Outlook copia el remitente exacto del portal. Vas a necesitar tu dirección de Terna; copiala antes de empezar:', 'resto'],
          ['direccion', null, 'resto'],
          ['pasos', [
            'Abrí un mail de alerta del portal (por ejemplo, una alerta de LinkedIn).',
            'Arriba del mail, tocá los tres puntos (*Más acciones*) > *Acciones avanzadas* > *Crear regla*.',
            'Elegí la carpeta *Alertas de empleo* y tocá *Más opciones*. La condición *De* ya tiene el remitente de la alerta.',
            'Tocá *Agregar otra acción*, elegí *Redirigir a* y pegá la dirección que copiaste. Es *Redirigir*, no *Reenviar*: así le llega a Terna tal como la mandó el portal.',
            'Tildá *Detener el procesamiento de más reglas* y tocá *Guardar*.',
            'Repetí desde una alerta de cada portal que uses.',
          ], 'resto'],
          ['cuidado', 'Armá la regla solo desde mails de *alertas*, no desde mails de tu cuenta del portal (códigos para entrar, postulaciones): esos no tienen que llegar a Terna.', 'resto'],
          ['subtitulo', 'Los remitentes de las alertas de LinkedIn e Indeed', 'resto'],
          ['p', 'Para revisar la regla, o para armarla desde *Configuración* > *Correo* > *Reglas* > *Agregar nueva regla*, con la condición *De* y estas direcciones, una por una:', 'resto'],
          ['remitentesLista', null, 'resto'],
          ['nota', 'Si Outlook te pide verificar tu cuenta para reenviar (por ejemplo, con un código por SMS), hacelo: es una protección de Microsoft. La regla actúa sobre los mails que lleguen desde ahora.', 'resto'],
          ['cuidado', 'En *Configuración* > *Correo* > *Reenvío* dejá apagado *Habilitar reenvío*: eso le manda a Terna todo tu correo. Terna solo necesita las alertas, y de eso se encarga la regla.', 'resto'],
          ['p', 'Tus alertas llegan a tu Gmail, que es la casilla de Terna: esta guía no te hace falta.', 'dueno'],
          ['ir', ['Ir a la guía de Gmail', '#gmail'], 'dueno'],
        ] },
        { clave: 'a-mano', titulo: 'A mano, desde el celular', piezas: [
          ['p', 'Si todavía no armaste el filtro, o para una alerta suelta, reenviala vos desde la app de tu correo. Primero copiá tu dirección de Terna:', 'resto'],
          ['direccion', null, 'resto'],
          ['pasos', [
            'Abrí el mail de la alerta.',
            'Tocá *Reenviar*: en Gmail está abajo del mail; en Outlook, en los tres puntos o en la flecha.',
            'En *Para*, pegá la dirección que copiaste y enviá. No hace falta escribir nada.',
          ], 'resto'],
          ['nota', 'Reenviala entera, sin borrar partes: Terna busca los avisos en el texto del mail. Sus avisos aparecen al día siguiente.', 'resto'],
          ['p', 'Si todavía no armaste el filtro, o para una alerta suelta, ponele vos la etiqueta desde la app de Gmail.', 'dueno'],
          ['pasos', [
            'En la lista de mails, mantené presionada la alerta hasta que quede elegida.',
            'Arriba a la derecha, tocá los tres puntos y elegí *Etiquetar como* (en iPhone, *Etiquetas*).',
            'Tildá *Terna/Alertas* y tocá *Aceptar* (en iPhone, *Hecho*).',
          ], 'dueno'],
          ['nota', 'Sus avisos aparecen al día siguiente.', 'dueno'],
        ] },
        // agregado por P0 (el mismo cambio de PLAN-UX §3.5, brand.md §6.7.1): «en Paquetes dicen Sin texto», por el nombre nuevo.
        { clave: 'si-no-aparecen', titulo: 'Si no ves los avisos', piezas: [
          ['lista', [
            '*Terna lee las alertas una vez por día*, a la mañana: lo que llega hoy aparece mañana.',
            // propuesta PLAN-PREFERENCIAS §4.6 (brand.md §6.7.1): Alertas por mail es un subtema de Empleos. Antes: «En Preferencias, …».
            'En Preferencias › Empleos, *Alertas por mail* dice para cada portal cuándo llegó su última alerta. Si dice *Sin alertas en los últimos 7 días*, fijate que la alerta llegue a tu etiqueta o carpeta *Alertas de empleo* y que el filtro o la regla tenga tu dirección de Terna.',
            'En Gmail, si *Reenviarlo a* no muestra tu dirección de Terna, falta que Francisco confirme la parte 2: avisale.',
            'Si dice *Llegaron mails, pero sin avisos*, avisale a Francisco: puede ser que el portal haya cambiado la forma de sus mails.',
            'Los avisos de una alerta llegan sin el texto completo. Terna lo busca en la página de empleos de la empresa y, en los de LinkedIn, en la página pública del aviso; mientras tanto, en Paquetes dicen *Sin texto*. Si intenta leer la página de LinkedIn tres veces y no puede, lo busca Francisco a mano.',
            'Para dejar de mandarle alertas a Terna, borrá el filtro (Gmail: *Filtros y direcciones bloqueadas*) o la regla (Outlook: *Reglas*), o la alerta en el portal.',
          ], 'resto'],
          ['lista', [
            '*Terna lee las alertas una vez por día*, a la mañana: lo que llega hoy aparece mañana.',
            // propuesta PLAN-PREFERENCIAS §4.6, ídem. Antes: «En Preferencias, *Alertas por mail* dice…».
            'En Preferencias › Empleos, *Alertas por mail* dice para cada portal cuándo llegó su última alerta. Si dice *Sin alertas en los últimos 7 días*, fijate en tu Gmail que la alerta tenga la etiqueta *Terna/Alertas*.',
            'Si dice *Llegaron mails, pero sin avisos*, puede ser que el portal haya cambiado la forma de sus mails y haya que ajustar cómo Terna los lee.',
            'Los avisos de una alerta llegan sin el texto completo. Terna lo busca en la página de empleos de la empresa y, en los de LinkedIn, en la página pública del aviso; mientras tanto, en Paquetes dicen *Sin texto*. Si intenta leer la página de LinkedIn tres veces y no puede, lo busca Francisco a mano.',
            'Para que Terna deje de leer tus alertas, borrá el filtro (*Filtros y direcciones bloqueadas*) o la alerta en el portal.',
          ], 'dueno'],
          ['ir', ['Ver mis portales en Preferencias', 'preferencias.html#alertas']],
        ] },
      ],
    },
    // propuesta PLAN-UX §5.7 (brand.md, sección nueva §6.14): la página Cómo funciona (PLAN-UX §4), que arma P5 con Terna.porBloques.
    // Cada tema tiene su clave, que es su hash (#match, #paquetes, #pedir, #postular y #fuentes llegan desde Preferencias, Paquetes y
    // Postulaciones), su título y sus piezas, como T.guias: ['p', texto], ['lista', [...]], ['pasos', [...]], ['tabla', encabezados,
    // filas: [si querés, andá a, href o null]], ['link', texto, href] y ['pregunta', pregunta, respuesta, href opcional]. "*así*" marca
    // en negrita. Ningún número va escrito: las piezas son una función de x = { cupo, piso, umbral, dias } (los paquetes por día de
    // la persona o config.paquetes_por_dia_default, config.piso_match, preferencias.umbral y config.retencion_no_interesa_dias).
    como: {
      titulo: 'Cómo funciona',
      // agregado por P5: el nombre del índice de temas (el carril de la página por bloques), para el lector de pantalla.
      carril: 'Temas',
      temas: [
        { clave: 'en-una-frase', titulo: 'En una frase', piezas: () => [
          ['p', 'Cargás tu perfil una vez. Todos los días Terna busca empleos, se queda con los que ajustan con vos, te arma los documentos para los mejores y postula donde puede. Lo que no puede, te lo deja listo.'],
        ] },
        { clave: 'el-dia', titulo: 'El día de Terna', piezas: (x) => [
          ['p', 'Una vez por día, a la mañana temprano:'],
          ['pasos', [
            '*Busca*: trae los avisos nuevos de los sitios que sabe leer (todos quedan en *Empleos*).',
            // propuesta PLAN-UX (brand.md §6.14), FEEDBACK-UX P3-8: también el idioma (pipeline.md §4.5, 4).
            '*Filtra*: deja los que entran en tus preferencias (modalidad, nivel, jornada, zona e idioma).',
            '*Puntúa*: a los que más se parecen a tu perfil les calcula el *match*.',
            '*Arma*: para los mejores, hasta ' + x.cupo + ' *paquetes*.',
            '*Postula*: donde el formulario es público y lo conoce.',
          ]],
          ['p', 'Lo que cambies hoy vale desde la corrida de mañana.'],
        ] },
        { clave: 'match', titulo: 'El match y tu umbral', piezas: (x) => [
          ['lista', [
            'El match va de 0 a 100 y mide cuánto ajusta tu perfil con el aviso. No es la probabilidad de que te llamen.',
            'Por debajo de ' + x.piso + ' el aviso ni se muestra.',
            '*Tu umbral* (hoy: ' + x.umbral + ') es desde dónde Terna trabaja sola: arma el paquete y postula solo en los avisos que llegan.',
            // P5: «si los priorizás», como lo hace el motor (pipeline.md §4.9, 3c: solo con Priorizar mis puestos en Sí, el default)
            // y como lo dice T.preferencias.umbralAyuda.
            'Dos excepciones: los avisos de *tus puestos*, si los priorizás, entran desde ' + x.piso + ', y lo que *pedís* entra siempre.',
          ]],
          // propuesta PLAN-PREFERENCIAS §4.6 y §3.2: el umbral está en Paquetes y el link cae en él. Antes: «Se cambia en Preferencias ›
          // Búsqueda.», a #busqueda.
          ['link', 'Se cambia en Preferencias › Paquetes.', 'preferencias.html#umbral'],
        ] },
        { clave: 'paquetes', titulo: 'Los paquetes', piezas: (x) => [
          ['lista', [
            'Un paquete es: tu CV adaptado a ese aviso, la carta, un salario sugerido y notas para la entrevista.',
            // propuesta PLAN-UX (brand.md §6.14), FEEDBACK-UX P3-8: el orden como lo hace el motor (pipeline.md §4.9, 3 y 3c). Hasta
            // acá: «…lo que pediste; tus puestos; el resto por match, y primero donde puede postular sola.»
            'Terna arma hasta *' + x.cupo + ' por día*, en este orden: lo que pediste; tus puestos; el resto. En cada grupo, primero donde Terna puede postular sola (si se lo permitís) y después por match. Uno por empresa por día.',
            'Arma solo lo que está en *Me interesa*. Con «Me interesa por defecto» en Sí, es todo lo que llega a tu umbral hasta que digas que no. En No, Terna espera tu marca aviso por aviso.',
            'Lo que viene está en Paquetes › Por armar; lo hecho, en Armados.',
          ]],
          // agregado por P5 (PLAN-UX §8 P5: los links adonde se actúa): Por armar y el interruptor de Preferencias que nombra (como
          // «Se cambia en Preferencias › Paquetes.» del match).
          ['link', 'Ver Paquetes › Por armar', 'avisos.html#por-armar'],
          ['link', '«Me interesa por defecto» se cambia en Preferencias › Paquetes.', 'preferencias.html#paquetes'],
        ] },
        { clave: 'pedir', titulo: 'Pedir un paquete', piezas: (x) => [
          ['lista', [
            'En *Empleos* o en *Por armar*, «Pedir paquete» hace que Terna lo arme aunque no llegue a tu umbral o quede fuera de tus preferencias.',
            'Va antes que lo que Terna elige sola y usa uno de los ' + x.cupo + ' de ese día. Si pedís ' + (2 * x.cupo) + ', durante dos días Terna arma solo lo tuyo.',
            'Si el aviso no tenía match, Terna lo calcula primero.',
            'En «Tus pedidos» lo subís, lo bajás o lo cancelás.',
          ]],
          // agregado por P5: adonde se pide (Empleos, con el texto del botón de Paquetes) y adonde están tus pedidos.
          ['link', 'Buscar en Empleos', 'busqueda.html'],
          ['link', 'Ver tus pedidos en Por armar', 'avisos.html#por-armar'],
        ] },
        { clave: 'postular', titulo: 'Postular: Terna o vos', piezas: () => [
          ['lista', [
            '*Postula Terna* donde la empresa usa un formulario público que Terna sabe completar. Lo hace en la misma corrida en que arma el paquete: llena con tu perfil, sube el CV y la carta y responde con lo que tu perfil dice.',
            'Con «Revisar antes de enviar» en Sí, lo deja listo y espera que toques Enviar.',
            // propuesta PLAN-UX (brand.md §6.14), FEEDBACK-UX P1-2: con js/cuentas.js PARA_TODOS en true, Terna crea cuentas y entra
            // con ellas para quien le dijo que sí. Hasta acá: «Terna nunca entra con tus cuentas, nunca resuelve un captcha…» y, en
            // A mano, «…portales de empleo, sitios que piden cuenta, o un formulario…».
            'Terna nunca entra con tus cuentas de LinkedIn ni de los portales, nunca resuelve un captcha y nunca inventa una respuesta. Lo intenta una vez.',
            // propuesta PLAN-PREFERENCIAS (brand.md §6.14): Postulaciones. Antes: «…en Preferencias › Postulación. Si no, queda a mano.»
            'Donde el sitio de la empresa pide crear una cuenta, Terna la crea con tu mail y postula solo si le dijiste que sí en Preferencias › Postulaciones. Si no, queda a mano.',
            '*A mano* queda todo lo demás: Easy Apply de LinkedIn, portales de empleo, sitios que piden cuenta si no le pediste a Terna que las cree, o un formulario donde Terna se trabó. Tenés el link, el CV y la carta; cuando postulás, lo marcás.',
          ]],
          // agregado por P5: adonde está lo que te toca postular a mano.
          ['link', 'Ver Postulaciones › A mano', 'postulaciones.html#a-mano'],
        ] },
        { clave: 'lo-que-manejas', titulo: 'Lo que manejás vos', piezas: (x) => [
          ['tabla', ['Si querés…', 'Andá a…'], [
            // propuesta PLAN-PREFERENCIAS §4.6 y §3.2: los bloques nuevos, y cada link a su ítem. Antes: «Preferencias › Búsqueda (…)» y
            // «Tu umbral», los dos a #busqueda; «Preferencias › Postulación», a #postulacion.
            ['Que Terna busque otra cosa', 'Preferencias › Empleos (puestos, modalidad, nivel, jornada, zona)', 'preferencias.html#empleos'],
            ['Más o menos avisos', 'Tu umbral, en Preferencias › Paquetes', 'preferencias.html#umbral'],
            ['Decidir aviso por aviso', '«Me interesa por defecto» en No', 'preferencias.html#paquetes'],
            ['Que no postule sola, o revisar antes', 'Preferencias › Postulaciones', 'preferencias.html#postulaciones'],
            // propuesta PLAN-UX (brand.md §6.14), FEEDBACK-UX P1-2: fila nueva.
            ['Que Terna cree cuentas en los sitios de las empresas', 'Preferencias › Postulaciones', 'preferencias.html#cuentas'],
            ['Un empleo puntual', 'Empleos › Pedir paquete', 'busqueda.html'],
            ['Priorizar una empresa o un puesto', 'Seguila o sumalo desde el aviso', 'busqueda.html'],
            ['Sacar un aviso', 'No me interesa (lo ves ' + x.dias + ' días por si te arrepentís)', null],
            ['Frenar todo', 'Pausar la cuenta', 'perfil.html#cuenta'],
          ]],
        ] },
        { clave: 'fuentes', titulo: 'De dónde salen los empleos', piezas: () => [
          ['p', 'Terna lee los sitios de empleo de muchas empresas y algunos buscadores de trabajo remoto. Por eso hoy hay sobre todo trabajo de oficina y de tecnología.'],
          ['p', 'Lo de portales como Bumeran, Computrabajo, Zonajobs, Indeed o LinkedIn entra si le reenviás tus alertas.'],
          ['link', 'Cómo reenviar alertas', 'alertas.html'],
          ['p', 'Si buscás una empresa y no aparece, es que Terna todavía no lee su sitio.'],
        ] },
        { clave: 'preguntas', titulo: 'Preguntas cortas', piezas: (x) => [
          ['pregunta', '¿Por qué hoy no hay paquetes?', 'Porque ningún aviso llegó a tu umbral, porque ya se armaron los ' + x.cupo + ' del día o porque Armar paquetes está en No.'],
          ['pregunta', '¿Por qué quedó a mano?', 'Lo dice cada postulación, en Postulaciones › A mano.'],
          ['pregunta', '¿Puedo pedir más de ' + x.cupo + ' por día?', 'No: lo que pidas de más se arma en los días siguientes, en tu orden.'],
          ['pregunta', '¿Quién ve mis datos?', 'Lo explica Mi perfil › Tu cuenta.', 'perfil.html#cuenta'],
        ] },
      ],
    },

    // propuesta PLAN-LANDING (brand.md §6.15): la landing pública, bienvenida.html (opciones-v3/PLAN-LANDING.md §4, decisiones
    // del 23/11/2026). Los textos van escritos en el HTML, para que se vean sin JavaScript, en Google y al compartir, y también
    // acá, que sigue siendo la verdad: cada elemento lleva su clave en data-t (con índice: data-t="landing.precios.planes.2.precio")
    // y el banco compara uno por uno. js/landing.js no escribe textos, salvo «Ir a Inicio» con la sesión abierta. Lo que lleva
    // [completar: …] o [confirmar: …] espera a Francisco y no va al HTML (paquete L5). Las frases dicen «Terna»: se revisan cuando
    // esté la regla del nombre «terna jobs» (decisión D11), igual que el <title>, og:site_name, og:title e imagenAlt.
    // propuesta PLAN-LANDING-2 (brand.md §6.15): la landing más corta (opciones-v3/PLAN-LANDING-2.md §2, 24/11/2026). Se fueron
    // «Lo que Terna no hace» (limites) y «Tus datos» (datos), la nota y el ejemplo con leyenda del título, la frase de cierre de
    // «Cómo funciona», los límites y la nota honesta de quien contrata, y todo lo provisorio de Precios (hoy, cuando, todavía).
    // Ninguna frase nombra una cantidad de paquetes fuera de la tabla de precios. Cada pieza se saca borrando su bloque del HTML,
    // su objeto acá y sus reglas del CSS (PLAN-LANDING-2 §9).
    landing: {
      // propuesta LOGOS (brand.md §1): el <title>, og:site_name, og:title y la descripción de la imagen dicen «Terna Jobs»; las
      // frases de la página, donde Terna busca, arma y postula, siguen «Terna».
      // propuesta PLAN-COMPARTIR (brand.md §6.15; plan-landing.md §7.3), 24/11: en la vista previa de un link cada pieza dice una cosa
      // distinta (la imagen, el símbolo; el título, la promesa; la descripción, lo que hace por vos; el dominio y og:site_name, el
      // nombre). descripcion es la de Google (<meta name="description"> de bienvenida.html e index.html) y deja de ser
      // DESCRIPCION_CORTA (que siguen las otras trece páginas); compartirTitulo y compartirDescripcion son og:title y og:description;
      // imagenAlt, el og:image:alt de img/compartir-2.png. titulo, el <title> de la landing, más corto (Google corta cerca de 60).
      // Antes: titulo «Terna Jobs: avisos que ajustan con tu perfil, con el CV y la carta armados»; descripcion DESCRIPCION_CORTA (y
      // og:description igual; og:title «Terna Jobs»); imagenAlt «El logo de Terna Jobs y el lema: pocos avisos, bien armados.».
      meta: {
        titulo: 'Terna Jobs: avisos que ajustan con tu perfil y el CV ya armado',
        descripcion: 'Terna busca los avisos de trabajo que ajustan con tu perfil, arma para cada uno un CV que te ayuda a pasar los filtros ATS y postula por vos donde se puede.',
        compartirTitulo: 'Que buscar trabajo no sea un trabajo.',
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11: como la bajada, dice que Terna busca los avisos que ajustan con tu perfil; el
        // «por vos» pasa a «postula», donde pesa. Queda igual a descripcion, pero sigue siendo otra clave (son dos piezas que pueden
        // separarse). Antes: «Terna busca los avisos por vos, arma para cada uno un CV que te ayuda a pasar los filtros ATS y postula
        // donde se puede.».
        compartirDescripcion: 'Terna busca los avisos que ajustan con tu perfil, arma para cada uno un CV que te ayuda a pasar los filtros ATS y postula por vos donde se puede.',
        imagenAlt: 'Tres trazos lila, cada uno más corto que el anterior, sobre fondo violeta: el símbolo de Terna Jobs.',
      },
      barra: {
        // El nombre accesible del nav de las secciones (desde 768 px).
        secciones: 'Secciones de la página',
        como: 'Cómo funciona',
        // propuesta PLAN-LADOS (brand.md §6.15), 24/11: el nombre corto del lado de quien contrata (D1); sigue bajando a #contratar.
        // Antes: «Para contratar».
        contratar: 'Empresas',
        precios: 'Precios',
        // propuesta QUIENES-SOMOS (brand.md §4): el cuarto link, a #somos. Reemplaza a «Quién la hizo», que nunca se dibujó.
        somos: 'Quiénes somos',
        entrar: 'Entrar',
        // El «Entrar» de la barra con la sesión de la persona abierta (js/landing.js; va a index.html).
        irAInicio: 'Ir a Inicio',
      },
      hero: {
        // El lema es el título de la landing (decisión D10); desde PLAN-LADOS (24/11), la misión.
        titulo: LEMA,
        // propuesta PLAN-LANDING-2 (brand.md §6.15): D1, la bajada 1 (la misión primero y, en una frase, qué hace; la misión vuelve
        // en «Quiénes somos», como eco). Antes: «Cargás tu perfil una vez. Cada mañana Terna busca avisos, se queda con los que
        // ajustan con vos y te arma el CV y la carta para cada uno, hasta tres por día. Donde el formulario lo permite, postula por
        // vos. Donde no, te deja todo listo.»
        // propuesta PLAN-LADOS (brand.md §2), 24/11, Francisco: sin la misión adelante, que ahora es el título; el CV nombra los
        // filtros ATS. Antes: «Que buscar trabajo no sea un trabajo. Terna busca los avisos, arma tu CV para cada uno y postula por vos donde se puede.».
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («no sé si corresponde aclarar… lo del match»): el match se nombra
        // como beneficio (Terna se queda con los avisos que ajustan con vos) y no como mecanismo (el número de 0 a 100 queda en el
        // paso «Terna busca» y en las lengüetas del dibujo); en dos frases, para que se lea de un vistazo. Antes: «Terna busca los
        // avisos, arma para cada uno un CV pensado para pasar los filtros ATS y postula por vos automáticamente donde se puede.».
        bajada: 'Terna busca los avisos que ajustan con tu perfil. Para cada uno arma un CV pensado para pasar los filtros ATS y postula por vos automáticamente donde se puede.',
        // propuesta PLAN-LANDING-2 (brand.md §6.15): D4 de Francisco (24/11): la landing se presenta como si el alta fuera por
        // suscripción; ningún texto visible habla de invitaciones. El primario del título baja a #precios. Antes: «Cómo conseguir una
        // invitación» (y, en la primera versión de este plan, «Pedir una invitación», a #pedir).
        // propuesta PLAN-LANDING-2 (brand.md §6.15), FEEDBACK-LANDING-2 punto 8: el primario del título es «Probar 7 días», el botón
        // del plan Prueba (en el HTML lleva data-t="landing.precios.planes.0.boton": el texto está una sola vez), y «Ver planes» pasa
        // a secundario. verPlanes es también el del cierre (#pedir) y el del diálogo «¿Dónde querés entrar?».
        verPlanes: 'Ver planes',
        yaTengo: 'Ya tengo cuenta',
        // FEEDBACK-LANDING P3-9: el atajo de quien contrata; baja a #contratar.
        contratas: '¿Contratás? Mirá cómo publicar un aviso',
        // propuesta PLAN-LANDING-2 (brand.md §6.15): la leyenda de las tres carpetas, solo para el lector de pantalla (figcaption
        // .oculto-visual). Reemplaza a «Ejemplo» y «Un día de ejemplo: tres paquetes armados, dos enviados por Terna y uno para
        // mandar a mano.», que se fueron con la nota «Hoy se entra por invitación y no se cobra.».
        ejemploAccesible: 'Ejemplo de paquetes armados por Terna.',
        // Las tres carpetas del ejemplo, con datos de ejemplo (ninguna empresa ni persona real). El marbete es el texto de
        // T.avisos.postulacion[estado] y la palabra debajo del número es T.avisos.matchPalabra: el HTML los referencia
        // (data-t="avisos.postulacion.enviada"), no los copia. Son tres porque Terna es una terna, no porque se nombre un tope.
        // FEEDBACK-LANDING P3-6: la clase de empresa y no «Empresa de ejemplo»; siguen sin ser empresas reales.
        // El punto medio va entre espacios que no parten ( ; &nbsp; en el HTML): así no queda colgando al final de un renglón.
        // propuesta PLAN-LANDING-2 (brand.md §6.15): sin la nota de abajo de cada carpeta (nota).
        ejemplo: [
          { match: '91', estado: 'enviada', puesto: 'Analista de datos', empresa: 'Una fintech · Remoto' },
          { match: '84', estado: 'enviada', puesto: 'Analista de negocio', empresa: 'Una consultora · Híbrido, Buenos Aires' },
          { match: '78', estado: 'a_mano', puesto: 'Analista de operaciones', empresa: 'Una empresa de logística · Presencial, Córdoba' },
        ],
      },
      // propuesta PLAN-LANDING-2 (brand.md §6.15): cuatro pasos que se abren de a uno (js/landing.js, pasos()). Sin bajada y sin
      // la frase de cierre (formas: «Podés dejar que Terna haga todo sola, o decidir vos, aviso por aviso, qué te interesa.»).
      // Ninguno nombra una cantidad. El nombre accesible del botón de cada paso es su título: no hay clave aparte.
      // Antes: «Cargás tu perfil, una vez», «Terna busca todos los días», «Arma hasta tres paquetes», «Postula donde puede».
      // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («tiene esos cuatro pilares: un solo lugar donde encontrás
      // toda la data de trabajos… te va diciendo si sos bueno o no para este trabajo… paquetes especializados en explotar tus
      // cualidades al máximo… el postulado automático, donde no tenés que preocuparte»; «no quiero que vayas tan técnico»): las
      // cuatro carpetas son lo que hace Terna y lo que hace la persona («Cargás tu CV») pasa a la bajada. El match tiene su carpeta
      // (dibujo .ld-il-match: el número y los requisitos con su estado), como en Precios. Sin «calibrando, cada vez mejor»: la
      // calibración que hay es general y a mano (motor/terna/calibracion.py), no aprende de cada persona. Las alertas de otros
      // portales salen de acá (no entraban sin pisar el dibujo en escritorio) y van a la ayuda de la primera fila de Precios. El
      // paso 3 pierde «filtros ATS», que ya dicen la bajada del título y «Qué trae un paquete». Antes: sin bajada; pasos «Cargás
      // tu CV» («Terna arma tu perfil con lo que dice. Vos elegís qué puestos buscás, dónde y con qué modalidad.»), «Terna busca»
      // («Cada mañana trae los avisos nuevos y le pone a cada uno un match de 0 a 100 con tu perfil.»), «Arma tus paquetes» («Para
      // cada aviso que mejor ajusta: un CV pensado para pasar los filtros ATS y todo lo que hace falta para postular.») y
      // «Postula por vos» (igual).
      como: {
        titulo: 'Cómo funciona',
        bajada: 'Cargás tu CV y elegís qué buscás. Del resto se ocupa Terna.',
        pasos: [
          // «Los ves todos juntos» y no «a un solo lugar» ni «todos los avisos»: promete comodidad sobre lo que Terna trae, no
          // cobertura total (la base tira a empresas medianas y grandes, tecnología y remoto).
          { titulo: 'Busca los avisos', texto: 'Cada mañana trae los avisos nuevos de cientos de empresas. Los ves todos juntos, sin entrar sitio por sitio.' },
          // «Por qué ajusta» y los requisitos con su estado son los de la ficha del aviso (match.v2; T.avisos).
          { titulo: 'Te dice cuánto ajustás', texto: 'Le pone a cada aviso un match de 0 a 100 y te muestra por qué: qué requisitos cumplís y cuáles te faltan.' },
          { titulo: 'Arma tus paquetes', texto: 'Para los avisos que mejor ajustan: un CV para ese aviso con tu experiencia real y todo lo que hace falta para postular.' },
          // «Postula por vos» es la forma de brand.md («Terna postula por vos»); el límite va en la segunda frase.
          { titulo: 'Postula por vos', texto: 'Donde el formulario lo permite, lo completa y lo envía. Donde no, te deja todo listo para que lo mandes vos.' },
        ],
      },
      // propuesta PLAN-LANDING-2 (brand.md §6.15): más corta; los títulos de los cuatro documentos, iguales. Antes, la bajada: «Un
      // paquete es todo lo que hace falta para postular a un aviso.».
      // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («paquetes especializados en explotar tus cualidades al
      // máximo… dándote una mano en base a lo que vos tenés»): la bajada lo dice sin prometer de más (redaccion-cv.md: nada
      // inventado). Antes: «Todo lo que hace falta para postular a un aviso.».
      paquete: {
        titulo: 'Qué trae un paquete',
        bajada: 'Cada paquete muestra lo mejor de tu experiencia para ese aviso. Sin inventar nada.',
        // propuesta PLAN-LANDING-2 (brand.md §6.15), 24/11, Francisco: el CV destaca los filtros ATS («que te ayuda a pasar los famosos
        // filtros ATS… utiliza las palabras clave»); la carta pierde «en el idioma del aviso» para no alargar los dos; las notas
        // nombran las preguntas que te pueden hacer (el bloque «Lo que te pueden preguntar» de cv-ats.md 0.7 §7). Antes: «Con tu
        // experiencia real y las palabras del aviso.», «Corta, sobre ese puesto, en el idioma del aviso.» y «Qué mirar de la empresa,
        // por si te llaman.».
        items: [
          { titulo: 'CV para ese aviso', texto: 'Te ayuda a pasar los famosos «filtros ATS» (usa las palabras clave del aviso).' },
          { titulo: 'Carta de presentación', texto: 'Corta, sobre ese puesto y esa empresa.' },
          { titulo: 'Salario sugerido', texto: 'Un número para cuando te lo pregunten.' },
          { titulo: 'Notas para la entrevista', texto: 'Qué preparar y las preguntas que te pueden hacer, con su respuesta.' },
        ],
      },
      // propuesta PLAN-LANDING-2 (brand.md §6.15): más corta y sin limites («Hoy publicar no tiene costo. Hasta 3 avisos abiertos
      // por cuenta, …») ni honesto («Terna recién empieza de este lado: …»), pedido 11. Que publicar no cuesta lo dice Precios, en la
      // franja «Si contratás». Antes, la bajada: «Si buscás a alguien para tu empresa, tu taller o tu escuela, podés publicar el
      // aviso en Terna.»; los pasos, «Terna se lo muestra a quien ajusta» y textos más largos.
      // propuesta PLAN-LADOS (brand.md §6.15), 24/11: la sección vende (fácil, rápido, completo) sin nombrar a quien revisa ni la
      // revisión, que se dice adentro, al enviar el aviso (TC.avisos.enRevision). El título es el nombre del lado, «Terna Jobs
      // Empresas» (D1); el id de la sección y el de su título no cambian. Antes: titulo «Para quien contrata»; bajada «Publicá tu
      // aviso en Terna y recibí postulaciones completas.»; pasos «Publicás el aviso» / «Francisco, que lidera Terna, lo revisa antes
      // de que salga.» (FEEDBACK-LANDING P2-9 y QUIENES-SOMOS), «Cada persona lo ve con su match: cuánto ajusta su perfil con el
      // puesto, de 0 a 100.» y «Con el contacto, un CV y una carta escritos para tu aviso, y el salario que pretende.».
      contratar: {
        titulo: 'Terna Jobs Empresas',
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11: la bajada era los títulos de los pasos 1 y 3 casi palabra por palabra;
        // ahora dice lo que distingue a Terna (gratis y te acerca a quien ajusta). Antes: «Para tu empresa, tu comercio o tu
        // escuela: publicá un aviso en minutos y recibí postulaciones completas.».
        bajada: 'Para tu empresa, tu comercio o tu escuela: publicá un aviso gratis y Terna te acerca a las personas que ajustan con el puesto.',
        // «Publicás en minutos» es lo que tarda cargarlo, no que sale al instante (lo revisa Terna). «Sin costo» es lo mismo que
        // dice la franja «Si contratás» de Precios; si no va acá, se borran esas dos palabras y nada más.
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco (del paso 3: «suena muy raro cómo está dicho»): el paso 2
        // pierde «No salís a buscar a nadie.», que contradecía proponer (que es justamente ir a buscar); el paso 3 dice qué trae
        // cada postulación con un verbo y «el salario que pide» (como la pantalla, TC.aviso.salario). Antes, el texto del paso 3:
        // «El contacto, un CV y una carta escritos para tu aviso, y el salario que pretende. Todo en un lugar.».
        pasos: [
          { titulo: 'Publicás en minutos', texto: 'Un formulario corto: el puesto, qué buscás y qué ofrecés. Sin costo.' },
          { titulo: 'Llega a quien ajusta', texto: 'Terna se lo muestra a quienes buscan un puesto así, con su match: cuánto ajusta su perfil con tu aviso.' },
          { titulo: 'Recibís postulaciones completas', texto: 'Cada una trae un CV y una carta escritos para tu aviso, el salario que pide la persona y cómo contactarla. Todas en un mismo lugar.' },
        ],
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («no se entiende nada esa frase… menos va a entender una
        // persona totalmente externa»): la lista «Personas que ajustan» de cada aviso (TC.aviso.recomendados; 0055), dicha desde el
        // beneficio y como un extra después de los tres pasos, sin «quien eligió que la encuentren» ni «Decide ella» (la decisión
        // de la persona la dice «si acepta»). «Si hay» porque la lista puede estar vacía en un aviso nuevo. proponerEntrada va en
        // negrita (strong.ld-proponer-entrada) y proponer, a continuación, en el mismo párrafo. Antes, proponer: «También le podés
        // proponer postular a quien eligió que la encuentren. Decide ella.».
        proponerEntrada: '¿No querés esperar?',
        proponer: 'Si hay personas que ajustan y todavía no se postularon, Terna te las muestra sin su nombre. Le proponés postular a quien te interese y, si acepta, te llega su postulación.',
        // propuesta PLAN-LADOS (brand.md §6.15), 24/11: el único botón de la sección, un link (a.btn-primario) a contratar.html,
        // sin pasar por el diálogo. Antes (PLAN-LANDING-2, D4): un <button data-accion="publicar"> sin efecto, al lado de «Entrar a
        // Terna para contratar» (entrar, a contratar.html), que se fue.
        publicar: 'Publicar un aviso',
      },
      // propuesta PLAN-LANDING-2 (brand.md §6.15): Precios como versión final (pedidos 12 y 13): una tabla que compara los cuatro
      // planes de menor a mayor, con el precio de lista tachado y el de lanzamiento (D2: el tachado es el precio que rige cuando
      // termina el lanzamiento; 40 % menos: $19.200 de $32.000 es 40 % justo, $8.000 de $13.500 es 40,7 %). Se fueron hoyTitulo,
      // hoy, cuando, planesTitulo, todavia, todaviaAccesible, los items de cada plan (pasan a filas) y contrata.precio, periodo e
      // items («Sin costo», «por ahora»). Antes, la bajada: «Así van a ser los planes. Ninguno se puede contratar todavía. …».
      // Ningún documento define el precio de lista ni el descuento: es propuesta (monetizacion.md no existe en docs/).
      precios: {
        titulo: 'Precios',
        bajada: 'Elegí según cuánto estés buscando.',
        // El <caption> de la tabla, solo para el lector de pantalla.
        tablaTitulo: 'Qué incluye cada plan',
        // propuesta PLAN-LADOS (brand.md §6.15), 24/11, Francisco: hasta 768 ya no hay selector de plan (se ven los cuatro, apilados,
        // con los mismos textos de acá), así que se fue elegir, su nombre accesible. Antes: elegir «Elegí un plan».
        descuento: '40 % menos',
        // propuesta PLAN-LANDING-2 (brand.md §6.15), FEEDBACK-LANDING-2 punto 6: el chip arriba de la columna destacada (Búsqueda
        // activa), que dice por qué está destacada. Alternativa que dio la revisión: «Trae todo».
        recomendado: 'El más completo',
        // Antes del precio tachado y del de lanzamiento, solo para el lector de pantalla.
        listaAccesible: 'Precio de lista:',
        precioAccesible: 'Precio de lanzamiento:',
        // Las celdas de sí, no y pronto (filas[n].valores 'si', 'no', 'pronto'): a la vista, el tilde, la raya y la marca «Pronto»;
        // en el HTML esas celdas llevan el data-t de si, no o pronto, no el del valor.
        si: 'Incluido',
        no: 'No incluido',
        // Lo que Terna todavía no hace: la marca de «Espera», con el reloj. Desde PLAN-LADOS 0.3 (25/11) ninguna fila la usa
        // (era la de «Te avisa al instante»); queda para la próxima cosa que se anuncie antes de existir.
        pronto: 'Pronto',
        // Los planes, en un solo lugar: ningún número de precios está escrito en otra clave ni en el CSS. Para cambiar un precio
        // se cambia acá y en el elemento de bienvenida.html que lleva esa clave (el banco avisa si quedan distintos). Los montos,
        // con el signo pegado y el punto de miles, sin decimales. Gratis, «sin vencimiento»: lo confirmó Francisco el 24/11
        // (FEEDBACK-LANDING P2-5). lista: el precio tachado (D2).
        // propuesta PLAN-LANDING-2 (brand.md §6.15): D4 de Francisco (24/11): boton, el de cada plan, en la cabeza de su columna. Es
        // un <button> con data-plan (la clave) y data-accion="suscribir", que por ahora no hace nada: los medios de pago y adónde
        // lleva se construyen después.
        planes: [
          { clave: 'prueba', nombre: 'Prueba', precio: '$0', periodo: '7 días, una sola vez', boton: 'Probar 7 días' },
          { clave: 'gratis', nombre: 'Gratis', precio: '$0', periodo: 'sin vencimiento', boton: 'Empezar gratis' },
          { clave: 'radar', nombre: 'Radar', lista: '$13.500', precio: '$8.000', periodo: 'por mes', boton: 'Suscribirme' },
          // propuesta PLAN-LADOS (brand.md §6.15), 24/11, Francisco («si ponés el precio de 19.200 al mes como final, poné el
          // equivalente en semanas…; si no, no pongas el semanal»): sin precio semanal aparte, que no cerraba (4 × $8.000 no es
          // $19.200); en su lugar, sin tachado, lo que da el mensual por semana ($19.200 / 4). Antes: otroLista «$13.500» (tachado) y
          // otro «o $8.000 por semana».
          { clave: 'activa', nombre: 'Búsqueda activa', lista: '$32.000', precio: '$19.200', periodo: 'por mes', equivale: 'Equivale a $4.800 por semana.', boton: 'Suscribirme' },
        ],
        // Qué incluye cada plan: una fila por cosa, un valor por plan en el orden de planes (un texto, o 'si', 'no', 'pronto').
        // D3: ningún documento dice estas celdas y las dedujo el plan; Francisco las confirma o las corrige una por una: la búsqueda
        // de todos los días de Radar y Búsqueda activa; «Te avisa al instante» en Prueba, Radar y Búsqueda activa y no en Gratis; que
        // Gratis y Radar no incluyen que Terna postule.
        // propuesta PLAN-LANDING-2 (brand.md §6.15), FEEDBACK-LANDING-2: «Te avisa al instante» queda (lo decidió Francisco) y pasa a
        // la última fila (punto 3, opción B), así la tabla cierra con lo que todavía no está; el valor de Prueba en Paquetes dice en
        // cuánto tiempo (punto 12; antes: «3»).
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («hay otra ventaja que no está escrita… el acceso a la
        // plataforma… las búsquedas son en múltiples bases de datos»; «el porcentaje del match… algo aparte de búsqueda de
        // avisos»): «Búsqueda de avisos con match» se parte en dos y la tabla sigue el orden del producto (avisos, match, paquetes,
        // postular, avisar), no el de lo que más cambia entre planes. La fila nueva es Empleos (busqueda.html), el piso de todos
        // los planes: dice «cientos de empresas» y no una cifra, ni «todos los avisos», ni el nombre de ningún portal (LinkedIn,
        // Bumeran, Zonajobs, Computrabajo e Indeed entran solo por las alertas que reenvía la persona: arquitectura.md §7.4 y
        // §7.8; fuentes.md §6); D3 sigue: «sí» en los cuatro lo dedujo el plan. En el HTML, el ícono de la fila nueva es el de
        // Empleos (i-buscar) y el del match, i-foco. Antes: Paquetes, «Búsqueda de avisos con match» (sin ayuda), Terna postula por
        // vos y Te avisa al instante.
        // propuesta PLAN-LADOS 0.3 (brand.md §6.15), 25/11, Francisco («un texto muy largo… resumilo… como el de Match»; «Te avisa
        // al instante… yo haría un tick, no haría el pronto… notificación de cuando tenés un nuevo match, de cuando te postularon,
        // de no pudimos postular… notificaciones algo más generales… que el usuario gratis solamente tenga acceso a la plataforma»):
        // la ayuda de la primera fila, del largo de la del match; «Te avisa al instante» pasa a «Notificaciones», con tilde y no
        // «Pronto» en Prueba, Radar y Búsqueda activa, y raya en Gratis. OJO: hoy Terna no manda notificaciones (brand.md, «Terna
        // no manda notificaciones ni mails por la corrida»; vision.md 0.7 §6: la app y el mail, para después): el tilde las promete
        // y tienen que existir antes de que se pueda contratar un plan. Antes: la ayuda de la fila 0, «Todos en un solo lugar:
        // Terna los lee cada día en sus sitios de empleo y suma las alertas de otros portales que le reenviás.»; la fila 4, «Te
        // avisa al instante» («Cuando publica una empresa que seguís o aparece un match alto.»; pronto, no, pronto, pronto).
        filas: [
          { rotulo: 'Avisos de cientos de empresas', ayuda: 'En un solo lugar: Terna los busca cada día.', valores: ['si', 'si', 'si', 'si'] },
          { rotulo: 'Match con tu perfil', ayuda: 'De 0 a 100: cuánto ajusta cada aviso nuevo con vos.', valores: ['Todos los días', '2 veces por semana', 'Todos los días', 'Todos los días'] },
          { rotulo: 'Paquetes', valores: ['3 en los 7 días', '1 por mes', '4 por mes', '1 por día'] },
          { rotulo: 'Terna postula por vos', ayuda: 'Donde el formulario lo permite.', valores: ['si', 'no', 'no', 'si'] },
          { rotulo: 'Notificaciones', ayuda: 'Avisos nuevos, matches altos y tus postulaciones.', valores: ['si', 'no', 'si', 'si'] },
        ],
        // Los paquetes sueltos no son un plan: van en una franja debajo de la tabla. D3: que se suman también a Gratis lo dedujo el
        // plan. boton (D4 de Francisco): data-plan="sueltos" y data-accion="comprar", sin efecto por ahora.
        sueltos: { nombre: 'Paquetes sueltos', texto: '5 paquetes, sin plan. Se suman a cualquiera.', lista: '$13.500', precio: '$8.000', periodo: 'una vez', boton: 'Comprar' },
        // La franja de quien contrata (contratar.md §11.9); link baja a #contratar.
        contrata: { titulo: 'Si contratás', texto: 'Publicar avisos y recibir postulaciones no tiene costo.', link: 'Ver cómo publicar' },
        // FEEDBACK-LANDING P2-5: «Precios finales» (sin IVA aparte, A3) espera a que se sepa cómo factura Terna. D2: la segunda
        // frase dice qué es el tachado; si hay una fecha para el fin del lanzamiento, se suma acá. Antes: «Precios en pesos.». Sin
        // «Pronto: todavía no está disponible.» (24/11, la landing como versión final: «Pronto» se explica solo).
        pie: 'Precios en pesos. El precio tachado es el de lista: el que rige cuando termine el lanzamiento.',
      },
      // propuesta QUIENES-SOMOS (brand.md §4): «Quiénes somos» (opciones-v3/QUIENES-SOMOS.md §2, para brand.md §6.15), entre
      // Precios y el cierre (#pedir). Habla Francisco: en singular cuando habla de él y en plural cuando habla de quienes hacen Terna,
      // sin decir cuántos son ni nombrar la inteligencia artificial (D3: «la tecnología que hay hoy»). La misión no reemplaza al
      // lema: va acá y como primera frase de la bajada del título. Decisiones de Francisco del 24/11: el rol «Fundador» debajo del
      // nombre, y la mención de su novia y «estuvimos mucho tiempo buscando» como están (D4).
      // propuesta PLAN-LANDING-2 (brand.md §6.15): la misión en un bloque violeta, la historia en tres momentos (antes, cuatro
      // párrafos en historia.parrafos) y la ficha con una cita (antes, dos párrafos en lider.parrafos). Es el texto de Francisco,
      // aprobado el 24/11: si quiere cambiar una palabra, se cambia en la clave; la forma no depende del largo.
      somos: {
        titulo: 'Quiénes somos',
        // La misión (p.ld-mision-frase, grande, sin ser un título) y lo que la explica. Antes, la bajada: «Las empresas tienen cada
        // vez más herramientas para elegir a quién llamar. Quien busca trabajo sigue haciendo todo a mano: una cuenta en cada sitio,
        // un CV distinto para cada aviso. Terna es esa herramienta, del lado de quien busca.»
        // propuesta PLAN-LADOS (brand.md §2), 24/11, Francisco: el bloque violeta no repite la misión, que ahora es el título y el lema.
        // Antes: frase «Que buscar trabajo no sea un trabajo.»; bajada «Terna es la herramienta del lado de quien busca.».
        mision: {
          frase: 'Del lado de quien busca.',
          // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («Terna es la de quien busca trabajo… siento que está muy
          // recortada»; «como Terna es la herramienta de la persona que busca trabajo»): con el sustantivo, en espejo con la frase de
          // las empresas. Antes: «… Terna es la de quien busca trabajo.».
          bajada: 'Las empresas tienen cada vez más herramientas para elegir a quién llamar. Terna es la herramienta de quien busca trabajo.',
        },
        // Una línea de tiempo: cada momento con su ícono en el HTML (la casa, la vuelta, el paquete).
        historia: {
          titulo: 'De dónde salió',
          momentos: [
            { titulo: 'Empezó en casa', texto: 'Mi novia se quedó sin trabajo y estuvimos mucho tiempo buscando.' },
            { titulo: 'Siempre lo mismo', texto: 'Una cuenta en cada sitio, los mismos datos otra vez, un CV para cada aviso.' },
            { titulo: 'Armamos algo nuevo', texto: 'Con la tecnología que hay hoy y que hace unos años no existía. Eso es Terna.' },
          ],
        },
        // La ficha (article.ld-lider), con la foto. Su nombre completo va solo acá; en el resto de la página, «Francisco».
        lider: {
          titulo: 'Quién lidera Terna',
          nombre: 'Juan Francisco Pérez Russo',
          // Debajo del nombre (p.ld-lider-rol). Lo decidió Francisco el 24/11 (D1 de QUIENES-SOMOS: «Fundador»; el título de la
          // ficha sigue «Quién lidera Terna»). Si se vacía, se borra también su línea de bienvenida.html: vacía, no hay elemento
          // con esta clave.
          rol: 'Fundador',
          // propuesta PLAN-LADOS (brand.md §6.15), 24/11, Francisco («no hace falta ese texto… algo más general, como cualquier duda,
          // hablame… más humano, empático, pero no de que yo voy a manejar todo esto»): un solo renglón. Antes: «Reviso cada aviso
          // antes de que salga. Si algo no anda, me escribís a mí.».
          cita: '¿Tenés alguna duda? Con gusto te respondo.',
          // El link de contacto.linkedin. propuesta PLAN-LADOS, 24/11: a la vista, en primera persona, como la cita; su nombre
          // accesible suma linkedinAccesible (un <span class="oculto-visual"> dentro del link), para que siga diciendo de quién es el
          // LinkedIn. Antes: «Francisco en LinkedIn» (el link del pie sigue así: pie.linkedin).
          linkedin: 'Escribime por LinkedIn',
          linkedinAccesible: '(el LinkedIn de Francisco)',
          // El alt de la foto (img/francisco-perez-russo.jpg, 640 × 800, 4:5). En bienvenida.html va escrito en el alt del <img>,
          // que lleva data-t-alt con esta clave (no data-t: el texto de un <img> es su alt).
          fotoAlt: 'Juan Francisco Pérez Russo.',
        },
      },
      // propuesta PLAN-LANDING-2 (brand.md §6.15): D4 de Francisco (24/11): la sección #pedir («Cómo se entra») pasa a ser el cierre
      // de la página y deja de hablar de invitaciones. Conserva el id #pedir porque Entrar (js/cuenta.js) y Terna para contratar
      // (js/contratar.js) llevan ahí. FEEDBACK-LANDING-2 punto 8: centrado, con el mismo par que el título («Probar 7 días», que es
      // precios.planes.0.boton, y «Ver planes», que es hero.verPlanes y sube a #precios); entrar abre el diálogo; escribir va a
      // contacto.linkedin. Antes:
      // titulo «Cómo se entra», bajada «Terna es por invitación.», las tarjetas conocido («Pedísela a alguien que ya usa Terna»)
      // y escribir («Escribile a Francisco»), linkedin «Escribirle por LinkedIn» y espera «[confirmar: Entra poca gente por vez, así
      // que la respuesta puede tardar unos días.]».
      pedir: {
        titulo: 'Empezá hoy',
        bajada: 'Elegí un plan y cargá tu CV. Terna se encarga del resto.',
        yaTengo: '¿Ya tenés cuenta?',
        entrar: 'Entrar',
        dudas: '¿Tenés dudas?',
        escribir: 'Escribile a Francisco',
      },
      // propuesta PLAN-LADOS (brand.md §6.15), 24/11, Francisco («abajo a la derecha… algo como Probar 7 días… o Ver planes… que se
      // active si bajás mucho, a partir de cómo funciona»): el llamado fijo (aside.ld-fijo, fuera de main). Desde FEEDBACK-LADOS
      // punto 2, solo hasta 1024 y una sola vez: una barra de un renglón con texto y un botón, «Ver planes» (hero.verPlanes, a
      // #precios), que aparece cuando terminó «Cómo funciona» y se va al llegar a Empresas; después de ver Precios no vuelve
      // (js/landing.js, fijo()); sin JavaScript no aparece. etiqueta es su nombre accesible (un <span hidden> al que apunta
      // aria-labelledby).
      fijo: {
        etiqueta: 'Planes',
        // propuesta PLAN-LADOS (brand.md §6.15), FEEDBACK-LADOS punto 2: corto, para un renglón junto al botón. Antes (en esta misma
        // tanda, sin publicar): «Probá Terna 7 días sin costo.».
        texto: '7 días de prueba sin costo.',
      },
      // El único contacto de la landing (decisión D4): el LinkedIn de Francisco, sin mail ni mailto:. propuesta QUIENES-SOMOS
      // (brand.md §4), §4: con la dirección cargada no hay variante «sin contacto». Los links a LinkedIn de bienvenida.html
      // (data-linkedin: la ficha de «Quiénes somos», «¿Tenés dudas?» del cierre y el pie) llevan esta dirección escrita en su href, con
      // rel="noopener", para que anden sin JavaScript; el banco compara cada href con esta constante. Cambiarla es cambiar esta
      // línea y esos tres href, y sellar.
      contacto: { linkedin: 'https://www.linkedin.com/in/francisco-perez-russo/' },
      // El diálogo «¿Dónde querés entrar?» de «Entrar» (PLAN-LANDING §5.1). El botón de cerrar usa T.comun.cerrar.
      donde: {
        titulo: '¿Dónde querés entrar?',
        // propuesta PLAN-LADOS (brand.md §6.15), 24/11: «Publico avisos» repite la palabra del botón de la sección («Contrato» se
        // leía también como sustantivo). Antes: contrata.titulo «Contrato»; contrata.texto «Tus avisos publicados y las
        // postulaciones que recibiste.».
        // propuesta PLAN-DIALOGO (brand.md §6.15), 24/11: lo grande de cada tarjeta es el nombre del lado y debajo va lo que hacés.
        // Antes (PLAN-LADOS): sin nombre ni rótulo; persona.texto «Terna Jobs: tu Inicio, tus paquetes y tus postulaciones.»;
        // contrata.texto «Terna Jobs Empresas: tus avisos y las postulaciones que recibiste.».
        persona: { nombre: 'Terna Jobs', titulo: 'Busco trabajo', texto: 'Tu Inicio, tus paquetes y tus postulaciones.' },
        contrata: { nombre: 'Terna Jobs', rotulo: 'Empresas', titulo: 'Publico avisos', texto: 'Tus avisos y las postulaciones que recibiste.' },
        // propuesta PLAN-LADOS 0.2 (brand.md §6.15), 25/11, Francisco («no hace falta para nada poner esa frase»): se fue nota, «Si
        // usás Terna para las dos cosas, es el mismo mail y la misma contraseña.» (p.ld-donde-nota). Lo dice, donde hace falta, la
        // ayuda de crear la cuenta en contratar.html (TC.invitacion.yaTengoAyuda).
        // propuesta PLAN-LANDING-2 (brand.md §6.15), FEEDBACK-LANDING-2 punto 8: la salida para quien no tiene cuenta, debajo de las
        // dos opciones; el link es hero.verPlanes, cierra el diálogo y baja a #precios.
        sinCuenta: '¿No tenés cuenta?',
        // propuesta PLAN-LADOS (brand.md §6.15), FEEDBACK-LADOS punto 6: el renglón de quien publica avisos, debajo del anterior; el
        // link cierra el diálogo y baja a #contratar, como «Ver planes». Nuevo.
        publicasPregunta: '¿Publicás avisos?',
        publicasLink: 'Conocé Terna Jobs Empresas',
      },
      pie: {
        lema: LEMA,
        // propuesta QUIENES-SOMOS (brand.md §4): el primer link del pie, a #somos.
        somos: 'Quiénes somos',
        entrar: 'Entrar',
        // propuesta PLAN-LADOS (brand.md §6.15), 24/11: el nombre del lado de quien contrata (D1), a contratar.html. Antes: «Terna
        // para contratar».
        contratar: 'Terna Jobs Empresas',
        linkedin: 'Francisco en LinkedIn',
        // Abierto: no va al HTML hasta que Francisco lo complete.
        hecha: '[completar: una línea de quién es Terna hoy, por ejemplo «Terna la hace Francisco [apellido], en [ciudad]». Cuando exista la sociedad, va su nombre.]',
      },
    },

    invitaciones: {
      titulo: 'Invitaciones',
      intro: (quedan, cupo, dias) => 'Te quedan ' + quedan + ' de ' + cupo + '. Cada invitación vale ' + dias + ' días.',
      nueva: 'Nueva invitación',
      mailPersona: 'Mail de la persona', mailAyuda: 'El link solo funciona con ese mail.',
      crear: 'Crear invitación',
      // propuesta LOGOS (brand.md §1 y §6.13): el mensaje de invitación presenta el producto con su nombre completo.
      // propuesta PLAN-LANDING-2 (brand.md §6.13; PLAN-LANDING-2 §11.1): sin «gratis», ahora que la landing presenta precios
      // vigentes. Antes: «… Cargás tu perfil una vez y después entrás cuando querés. Es gratis y solo por invitación. Creá tu cuenta
      // acá: …».
      mensaje: (link, dias) => 'Hola, te invito a Terna Jobs. Es una web privada que busca avisos de trabajo que ajusten con tu perfil, te deja armados el CV y la carta para cada uno y postula por vos donde puede. Cargás tu perfil una vez y después entrás cuando querés. Es solo por invitación. Creá tu cuenta acá: ' + link + '. El link vale ' + dias + ' días.',
      copiarMensaje: 'Copiar mensaje', copiarLink: 'Copiar link',
      mandalo: 'Mandalo por WhatsApp o por donde quieras.',
      estados: { pendiente: 'Pendiente', usada: 'Usada', vencida: 'Vencida' },
      creada: (f) => 'Creada el ' + f,
      vence: (f) => 'vence el ' + f,
      usada: (f) => 'usada el ' + f,
      vencio: (f) => 'venció el ' + f,
      cancelar: 'Cancelar invitación',
      cancelarTitulo: (mail) => 'Cancelar la invitación a ' + mail,
      cancelarTexto: 'Recupera el cupo. El link deja de funcionar.',
      vacio: 'Todavía no invitaste a nadie.',
      sinCupo: 'No te quedan invitaciones.',
      cerradas: 'Las invitaciones están cerradas por ahora.',
    },

    admin: {
      titulo: 'Admin',
      secciones: { usuarios: 'Usuarios', invitaciones: 'Invitaciones', uso: 'Uso', problemas: 'Problemas', empresas: 'Empresas', avisos: 'Avisos sin texto', ia: 'Modelo de IA' },
      sinVer: (x) => x + ' sin ver',
      usuarios: { mail: 'Mail', alta: 'Alta', ultima: 'Última entrada', estado: 'Estado', avisos: 'Avisos (7 días)', paquetes: 'Paquetes (7 días)', borrar: 'Borrar' },
      estados: { activo: 'Activo', pausado: 'Pausado' },
      borrarTitulo: (mail) => 'Borrar a ' + mail,
      borrarTexto: 'Se borra su perfil, sus avisos, sus paquetes, sus postulaciones y sus archivos. No se puede deshacer.',
      borrarUsuario: 'Borrar usuario',
      borrado: 'Usuario borrado.',
      invitacionesAbiertas: 'Invitaciones abiertas',
      // propuesta PLAN-WEB §4.1 (brand.md §6.9; FEEDBACK-2, textos): con la forma de las otras ayudas de un interruptor («En Sí, …»).
      // Hasta ahora: 'Cerradas: nadie puede crear invitaciones nuevas. Las pendientes siguen valiendo hasta que venzan.'
      invitacionesAyuda: 'En No, nadie puede crear invitaciones nuevas. Las pendientes siguen valiendo hasta que venzan.',
      dias: { 7: 'Últimos 7 días', 30: 'Últimos 30 días' },
      uso: { fecha: 'Fecha', usuarios: 'Usuarios corridos', revisados: 'Avisos revisados', puntuados: 'Puntuados', paquetes: 'Paquetes', enviadas: 'Enviadas', aMano: 'A mano', tokens: 'Tokens', usd: 'US$ est.', tope: 'Tope', alcanzado: 'Alcanzado', no: 'No', total: (d) => d + ' días' },
      // Admin › Problemas. Las primeras ocho claves son la tabla de antes, que se ve con una base sin 0042. Lo demás, los casos con
      // seguimiento y la revisión diaria (problemas.md 0.1 §6; Francisco, 13/11/2026: «algo automático que entre, chequee y lo haga…
      // déjame marcar algo como solucionado… algún tipo de seguimiento»).
      problemas: {
        fecha: 'Fecha', usuario: 'Usuario', aviso: 'Aviso', paso: 'Paso', error: 'Error', reintentos: 'Reintentos', marcar: 'Marcar todos como vistos', vacio: (d) => 'Sin problemas en los últimos ' + d + ' días.',
        chipParaVos: (x) => x + ' para vos',
        chipNuevos: (x) => x + ' sin revisar',
        intro: 'Cada falla del motor que se repite es un caso. La revisión diaria los mira cada mañana, después de la corrida: cierra lo que ya está arreglado o es esperable, arregla lo chico del motor y te deja acá lo que necesita de vos.',
        revision: (f, h, r) => 'La revisión diaria pasó el ' + f + ' a las ' + h + ': revisó ' + n(r.revisados) + ', cerró ' + n(r.cerrados) + ', arregló ' + n(r.arreglados) + ' y te dejó ' + n(r.para_vos) + '.',
        revisionVieja: 'Hace más de un día que no pasa: mirá la tarea programada «Terna · Revisar problemas (diaria)».',
        sinRevision: 'La revisión diaria todavía no pasó.',
        vistas: { abiertos: (x) => 'Abiertos (' + n(x) + ')', cerrados: (x) => 'Cerrados (' + n(x) + ')' },
        vacioAbiertos: 'No hay problemas abiertos.',
        vacioCerrados: 'No se cerró ningún problema en los últimos 30 días.',
        estados: { nuevo: 'Nuevo', volvio: 'Volvió', para_vos: 'Para vos', en_curso: 'En curso', arreglado: 'Arreglado', resuelto: 'Resuelto', esperado: 'Esperado' },
        explicaciones: {
          nuevo: 'Nadie lo revisó todavía. La revisión diaria lo mira en su próxima pasada.',
          volvio: 'Se había dado por arreglado o resuelto y volvió a pasar. La revisión diaria lo mira en su próxima pasada.',
          para_vos: 'Necesita algo que solo vos podés hacer o decidir.',
          en_curso: 'Lo está viendo alguien: vos o un chat. La revisión diaria no lo toca.',
          arreglado: (x) => 'Ya tiene un arreglo. Terna lo da por resuelto si no vuelve a pasar en ' + n(x) + ' corridas.',
          resuelto: 'No volvió a pasar.',
          esperado: 'Pasa por cómo funciona Terna o por una fuente, y no hace falta hacer nada. Si vuelve a pasar, no se reabre.',
        },
        veces: (x) => (x === 1 ? '1 vez' : n(x) + ' veces'),
        cuando: (a, b) => (a === b ? 'el ' + a : 'del ' + a + ' al ' + b),
        personas: (x) => (x === 1 ? '1 persona' : n(x) + ' personas'),
        volvioVeces: (x) => (x === 1 ? 'volvió 1 vez' : 'volvió ' + n(x) + ' veces'),
        queHacer: 'Qué hacer',
        diagnostico: 'Qué pasó',
        ultimoError: 'Último error',
        arreglo: (c) => 'Arreglo: commit ' + c + '.',
        confirma: (x) => (x <= 0 ? 'Terna lo da por resuelto en la próxima revisión.' : x === 1 ? 'Se da por resuelto si no vuelve a pasar en la próxima corrida.' : 'Se da por resuelto si no vuelve a pasar en ' + n(x) + ' corridas más.'),
        quien: { revision: 'la revisión diaria', chat: 'un chat', francisco: 'vos', terna: 'Terna' },
        ultimoCambio: (quien, f) => 'Último cambio: ' + quien + ', ' + f + '.',
        nota: 'Tu nota',
        verDetalle: 'Detalle y acciones',
        notaCampo: 'Nota (opcional)',
        notaAyuda: 'Lo que hiciste o lo que la revisión diaria tiene que tener en cuenta. Sin datos de personas.',
        notaLarga: 'La nota es demasiado larga (hasta 500 caracteres).',
        notaConMail: 'La nota no puede llevar un mail.',
        acciones: { arreglado: 'Ya está arreglado', esperado: 'Es esperado', en_curso: 'Lo tomo', resuelto: 'Dar por resuelto', nuevo: 'Reabrir', nota: 'Guardar nota', copiar: 'Copiar para un chat' },
        hechos: {
          arreglado: 'Listo: Terna lo da por resuelto si no vuelve a pasar.',
          esperado: 'Listo: queda como esperado.',
          en_curso: 'Listo: queda en curso. La revisión diaria no lo toca.',
          resuelto: 'Listo: resuelto.',
          nuevo: 'Listo: lo mira la revisión diaria en su próxima pasada.',
        },
        lasVeces: 'Cuándo pasó',
        sinFilas: 'Las filas de este caso ya se borraron (se guardan 90 días).',
        // Lo que copia "Copiar para un chat": sin mails ni nombres; el chat lo trabaja como dice problemas.md §7.
        copia: (c) => [
          'Caso de Admin › Problemas de Terna. Revisalo y arreglalo como dice problemas.md §7 (el método de la revisión); al terminar, dejá lo que hiciste en el caso con public.registrar_revision_caso y "por": "chat".',
          'Caso: ' + c.id,
          'Estado: ' + c.estado,
          'Paso: ' + c.paso + ' · clave: ' + c.clave,
          'Veces: ' + c.veces + ' (' + c.cuando + ')' + (c.fuentes ? ' · fuentes: ' + c.fuentes : '') + (c.personas ? ' · ' + c.personas : ''),
          c.error ? 'Último error: ' + c.error : null,
          c.diagnostico ? 'Qué pasó (la revisión): ' + c.diagnostico : null,
          c.queHacer ? 'Qué hacer: ' + c.queHacer : null,
          c.commit ? 'Commit del arreglo: ' + c.commit : null,
          c.nota ? 'Nota de Francisco: ' + c.nota : null,
        ].filter(Boolean).join('\n'),
      },
      pasos: { buscar: 'Buscar', alertas: 'Alertas', leer_cv: 'Leer CV', puntuar: 'Puntuar', armar: 'Armar', responder: 'Responder', postular: 'Postular', subir: 'Subir', retencion: 'Retención', borrar: 'Borrar' },
      // Admin › Empresas (brand.md 0.11 §6.9; datos.md 0.28, 0032): lo que ni el motor ni la búsqueda web diaria encontraron.
      // Desde brand.md 0.15 (datos.md 0.31, 0035): sin Easy Apply ni avisos por leer, "Ya no está abierto" y el link de un portal;
      // desde brand.md 0.16, tampoco las empresas que la búsqueda solo encontró en portales (y sale su estado).
      empresas: {
        porCompletar: (x) => x + ' por completar',
        intro: 'Empresas de avisos que llegan por alertas y que Terna no pudo ubicar: ni el motor ni la búsqueda diaria encontraron dónde publican sus búsquedas. Lo que cargues sirve para todos los avisos que vengan de esa empresa. No cuentan las empresas que la búsqueda solo encontró en portales de empleo, ni los avisos Easy Apply ni los de LinkedIn cuya página Terna todavía no leyó.',
        como: 'Abrí el aviso con tu cuenta, tocá "Postularse" y copiá el link de la página a la que te lleva, aunque sea de un portal de empleo. Si el aviso ya cerró, tocá "Ya no está abierto".',
        vacio: 'No hay empresas para completar.',
        avisos: (x) => (x === 1 ? '1 aviso abierto' : x + ' avisos abiertos'),
        estados: {
          no_encontrado: 'La búsqueda no la encontró.',
          error: 'La búsqueda falló tres veces.',
          encontrado: 'El link que encontró la búsqueda no anduvo.',
        },
        ejemplo: (puesto) => 'Aviso de ejemplo: ' + puesto,
        abrir: (fuente) => 'Abrir el aviso en ' + fuente,
        abrirAccesible: (fuente) => 'Abrir el aviso en ' + fuente + ', abre en otra pestaña',
        lleva: 'En LinkedIn, su botón "Postularse" lleva al sitio de la empresa.',
        link: 'Link donde se postula',
        linkAyuda: 'El del aviso o el de la página de empleos de la empresa, con https://. Si es de un portal de empleo, Terna lo anota y no te la vuelve a mostrar.',
        guardar: 'Guardar',
        sinSitio: 'No tiene página propia',
        cerrar: 'Ya no está abierto',
        cerrarAccesible: (puesto) => 'Ya no está abierto: ' + puesto,
        omitir: 'Omitir',
        guardado: 'Guardado. Terna lo verifica en la próxima corrida.',
        portalHecho: 'Listo: se postula en un portal de empleo. Terna deja de buscarla.',
        sinSitioHecho: 'Listo: Terna deja de buscarla.',
        cerrado: 'Listo: Terna da el aviso por cerrado.',
        omitida: 'Omitida.',
        errorUrl: 'Pegá un link que empiece con https://.',
        errorLinkedin: 'Ese link es de LinkedIn. Tocá "Postularse" en el aviso y pegá el de la página a la que te lleva. Si es Easy Apply, tocá "No tiene página propia".',
      },
      // Admin › Avisos sin texto (brand.md 0.26 §6.9; diseno.md 0.38 §9.7; datos.md 0.34 y 0.36, 0038 y 0040; Francisco, 12/11/2026:
      // si Terna no consigue el texto, "Fran lo va a sacar por vos"; desde 0040, «solo… si llevan más de 3 intentos sin obtener la
      // data»): los avisos de alertas que Terna intentó leer tres veces sin conseguir el texto, para que pegue el texto.
      avisos: {
        porCompletar: (x) => x + ' por completar',
        intro: 'Avisos que llegaron por alertas y cuyo texto Terna no pudo conseguir: sin el texto no tienen match ni paquete. Aparecen cuando Terna intentó leer su página tres veces y no pudo. Lo que pegues va a quien tiene el aviso en su lista; acá no se ve de quién es.',
        como: 'Abrí el aviso, copiá la descripción completa (qué se hace, qué piden, los requisitos) y pegala en su tarjeta. Si ya no está publicado, tocá "Ya no está abierto".',
        vacio: 'No hay avisos para completar.',
        alerta: (fuente) => 'alerta de ' + fuente,
        // Desde 0040 la base devuelve solo 'intentos'; los otros cuatro quedan para una base sin 0040 (brand.md 0.26 §6.9: hasta 0.25).
        motivos: {
          no_existe: 'La página del aviso en LinkedIn no existe.',
          intentos: (x) => 'Terna intentó leer su página ' + x + ' veces y no pudo.',
          espera: (x) => (x === 1 ? 'Llegó hace 1 día y Terna todavía no pudo leer su página.' : 'Llegó hace ' + x + ' días y Terna todavía no pudo leer su página.'),
          lectura_apagada: 'La lectura de las páginas de LinkedIn está apagada.',
          sin_lector: (fuente) => 'Terna no abre las páginas de ' + fuente + '.',
        },
        sale: (f) => 'Si nadie lo completa, sale de la lista el ' + f + '.',
        abrir: (fuente) => 'Abrir el aviso en ' + fuente,
        abrirAccesible: (fuente) => 'Abrir el aviso en ' + fuente + ', abre en otra pestaña',
        texto: 'Texto del aviso',
        textoAyuda: 'La descripción completa, como está en el aviso. Terna lo puntúa en la próxima corrida para quien lo tiene en su lista.',
        contador: (x, max) => n(x) + ' / ' + n(max),
        guardar: 'Guardar texto',
        cerrar: 'Ya no está abierto',
        cerrarAccesible: (puesto) => 'Ya no está abierto: ' + puesto,
        guardado: 'Guardado. Terna lo puntúa en la próxima corrida.',
        cerrado: 'Listo: Terna da el aviso por cerrado.',
        errorConTexto: 'Este aviso ya tiene texto: Terna lo consiguió mientras tanto.',
        errorSinListas: 'Ya nadie tiene este aviso en su lista: no hace falta completarlo.',
        errorCerrado: 'Este aviso ya cerró.',
      },
      // Admin › Modelo de IA (brand.md 0.38 §6.9; diseno.md 0.44 §9.9; 0052; Francisco, 19/11/2026: «que dentro de la configuración a
      // un lado se pueda seleccionar si el modelo cloud o el modelo local»): quién escribe los paquetes y las respuestas.
      ia: {
        intro: 'Quién escribe los paquetes y las respuestas de los formularios: Claude, en la nube, o el modelo local, que corre en Fenix. El local no cuesta nada por paquete, tarda más y todavía está a prueba. Si no arranca o no logra un paquete, Terna sigue con Claude.',
        items: {
          ia_armar: { titulo: 'Paquetes', ayuda: 'El CV, la carta, el salario y las notas.' },
          ia_responder: { titulo: 'Respuestas de los formularios', ayuda: 'Las preguntas abiertas de cada formulario. Se escriben con el formulario abierto: en local tardan minutos en lugar de segundos.' },
          ia_alcance: { titulo: 'Para quién', ayuda: 'Solo para mí: el modelo local escribe solo lo tuyo, para probarlo, y las demás personas siguen con Claude.' },
          modelo_local: { titulo: 'Modelo local', ayuda: 'Tiene que estar instalado en Fenix (fenix\\ia-local.bat).' },
        },
        opciones: {
          nube: 'Nube (Claude)', local: 'Local (Fenix)', admin: 'Solo para mí', todos: 'Para todos',
          'qwen3.6-35b-a3b': 'Qwen3.6 35B (el principal)', 'qwen3.5-9b': 'Qwen3.5 9B (más liviano)',
        },
        pie: 'Los cambios valen desde la próxima corrida.',
      },
    },

    // brand.md §6.10: cada chip lleva su explicación como texto accesible y como tooltip.
    chips: {
      match: 'Ajuste entre tu perfil y el aviso, de 0 a 100. No es la probabilidad de que te llamen.',
      por_decidir: 'Todavía no dijiste si te interesa. Terna espera.',
      no_me_interesa: (dias) => 'Lo marcaste. Terna no arma ni postula; se borra a los ' + dias + ' días.',
      sin_armar: 'Todavía no hay documentos para este aviso.',
      // Hasta brand.md 0.7, "Terna lo arma en la próxima corrida.": desde 0.8 hay una cola y puede ir más atrás.
      // agregado por P0 (el mismo cambio de PLAN-UX §5.3, brand.md §6.10): «tus pedidos» en lugar de «tus próximos paquetes».
      pedido: 'Lo pediste. Terna lo arma antes que los que elige sola, en el orden de tus pedidos.',
      armado: 'CV, carta, salario y notas listos.',
      no_se_pudo_armar: 'Falló al armarlo. Terna lo reintenta mañana.',
      // Desde brand.md 0.23 (la persona ya no pega textos): hasta 0.22, "Terna no tiene el texto de este aviso. Pegalo para que lo
      // puntúe." y "Pegaste el texto. Terna lo puntúa en la próxima corrida."
      sin_texto: 'Terna todavía no tiene el texto de este aviso. Lo busca en las próximas corridas y, cuando lo consigue, lo puntúa.',
      sin_texto_admin: 'Terna no pudo conseguir el texto de este aviso. Lo busca Francisco a mano; cuando lo cargue, Terna lo puntúa.',
      por_puntuar: 'Terna ya tiene el texto de este aviso. Lo puntúa en la próxima corrida.',
      pendiente: 'Todavía no hay postulación.',
      en_cola: 'Terna postula en la próxima corrida.',
      para_revisar: 'Terna completó todo el formulario y espera que lo confirmes.',
      enviada: 'Terna envió el formulario y el sitio lo confirmó.',
      a_mano: 'Terna no pudo o no corresponde. Todo está listo para que postules vos.',
      postulado: 'Marcaste que postulaste.',
      // El veredicto de requisitos (brand.md 0.4.19 §6.10).
      cumple: 'Tu perfil muestra lo que el aviso pide como excluyente, y el nivel del puesto es cercano al tuyo.',
      a_confirmar: 'El aviso pide algo que tu perfil no menciona. Si lo tenés, sumalo a Mi perfil.',
      falta: 'El aviso pide algo que, según tu perfil, no tenés.',
      sobra_nivel: 'El puesto es de un nivel bastante más bajo que el tuyo: te sobra experiencia para lo que pide.',
      falta_nivel: 'El puesto es de un nivel bastante más alto que el tuyo: pide más experiencia que la que tenés.',
    },

    errores: {
      // Empresas que seguís (datos.md 0.30 §11, 0034).
      empresasDemasiadas: (max) => 'Hasta ' + max + ' empresas. Para sumar otra, quitá una.',
      empresaNombre: 'Cada empresa, de 2 a 80 caracteres.',
      // Los avisos publicados en Terna (datos.md 0.44 §11, 0055).
      ternaCerrado: 'Este aviso ya no recibe postulaciones.',
      ternaPropio: 'Este aviso lo publicaste vos (o tu equipo).',
      ternaSinPaquete: 'Para postular hace falta el paquete de este aviso.',
      ternaYaRecibida: 'Tu postulación ya llegó.',
      ternaNoExiste: 'Terna no encontró eso. Recargá la página.',
      ternaDenuncia: 'Escribí entre 3 y 500 letras.',
      completa: 'Completá este campo.',
      mailInvalido: 'Ese mail no parece válido.',
      contrasenaCorta: 'La contraseña tiene que tener al menos 8 caracteres.',
      noCoinciden: 'Las contraseñas no coinciden.',
      fechaFutura: 'La fecha de inicio no puede ser futura.',
      fechaFinAnterior: 'La fecha de fin no puede ser anterior a la de inicio.',
      minimoMayor: 'El mínimo no puede ser mayor que el máximo.',
      salarioIncompleto: 'Completá mínimo, máximo y moneda.',
      modalidades: 'Elegí al menos una modalidad.',
      niveles: 'Elegí al menos un nivel.',
      jornadas: 'Elegí al menos una jornada.',
      puestosDemasiados: (x) => 'Hasta ' + x + ' puestos.',
      puestoLargo: (x) => 'Cada puesto, hasta ' + x + ' letras.',
      palabrasClaveDemasiadas: (x) => 'Hasta ' + x + ' palabras clave.',
      palabraClaveLarga: (x) => 'Cada palabra clave, hasta ' + x + ' letras.',
      dias: (a, b) => 'Poné una cantidad de días entre ' + a + ' y ' + b + '.',
      umbral: (a, b) => 'El umbral va de ' + a + ' a ' + b + '.',
      // Desde 0028 la lista es una sola opción, {3}: "Paquetes por día: 3." (con más de una, "3 o 5").
      paquetes: (lista) => 'Paquetes por día: ' + (lista.length > 1 ? lista.slice(0, -1).join(', ') + ' o ' + lista[lista.length - 1] : lista[0]) + '.',
      dni: 'Ese DNI no parece válido.', cuil: 'Ese CUIL no parece válido.', nacimiento: 'Esa fecha de nacimiento no parece válida.',
      direccionIncompleta: 'Completá calle y número, código postal y provincia, o dejá los tres vacíos.',
      calle: 'Escribí la calle y el número, de 3 a 120 caracteres.',
      codigoPostal: 'El código postal tiene 4 números (1425) o una letra, 4 números y 3 letras (C1425ABC).',
      provincia: 'Elegí la provincia de la lista.',
      credenciales: 'Mail o contraseña incorrectos.',
      sesion: 'Tu sesión venció. Entrá de nuevo.',
      intentos: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
      linkVencido: 'El link para cambiar la contraseña venció. Pedí uno nuevo.',
      invUsada: 'Esta invitación ya se usó.',
      invVencida: 'Esta invitación venció. Pedile una nueva a quien te invitó.',
      invNoExiste: 'Esta invitación no existe. Revisá el link.',
      invOtroMail: 'Esta invitación es para otro mail.',
      sinCupo: 'No te quedan invitaciones.',
      mailConInvitacion: 'Ese mail ya tiene una invitación pendiente.',
      mailConCuenta: 'Ese mail ya tiene cuenta.',
      cerradas: 'Las invitaciones están cerradas por ahora.',
      cvArchivo: (mb) => 'El CV tiene que ser un PDF de hasta ' + mb + ' MB.',
      cvSubir: 'No se pudo subir el CV. Probá de nuevo.',
      analiticoSubir: 'No se pudo subir el analítico. Probá de nuevo.',
      archivo: 'No se pudo abrir el archivo. Probá de nuevo en un rato.',
      textoCorto: 'El texto es muy corto para ser un aviso.',
      textoLargo: (max) => 'El texto es demasiado largo (hasta ' + n(max) + ' caracteres).',
      conTexto: 'Este aviso ya tiene texto.',
      // Desde brand.md 0.23; hasta 0.22, "Primero pegá el texto del aviso."
      sinTexto: 'Terna todavía no tiene el texto de este aviso.',
      yaArmado: 'Este aviso ya tiene paquete.',
      yaPedido: 'Ya está pedido.',
      // 0045 (busqueda.md 0.1 §6): el aviso se cerró, o ya no se puede pedir, entre que la persona lo vio en Búsqueda y lo pidió.
      avisoNoDisponible: 'Ese aviso ya no está abierto. Actualizá la página para ver los que siguen.',
      armarNo: 'Armar paquetes está en No.',
      enviada: 'Terna ya envió esta postulación; no se puede volver atrás.',
      noPostulable: 'Terna no puede postular en este sitio. Hacelo vos: todo está listo.',
      agotados: (x) => 'Terna ya lo intentó ' + x + ' veces. Hacelo vos: todo está listo.',
      // 0054 (brand.md 0.39): la persona ya no vuelve a probar; si una página vieja lo intenta, la base lo rechaza con esta clave.
      reintento: 'Esta la vuelve a probar Francisco. Si querés, postulala a mano: todo está listo.',
      guardar: 'No se pudo guardar. Probá de nuevo.',
      guardarCampos: 'No se pudo guardar. Revisá los campos marcados.',
      marcar: 'No se pudo marcar. Probá de nuevo.',
      motivoSinNoInteresa: 'Primero marcá No me interesa.',
      // agregado por P0 (el mismo cambio de PLAN-UX §5.3, brand.md §11): «Tus pedidos» en lugar de «Tus próximos paquetes».
      pedidosCambiaron: 'Tus pedidos cambiaron mientras tanto. Ya ves cómo están ahora.',
      general: 'Algo falló del lado de Terna. Probá de nuevo; si sigue, avisale a Francisco.',
      borrarUsuario: 'No se pudo borrar el usuario. Probá de nuevo.',
      limiteExperiencias: (x) => 'Hasta ' + x + ' trabajos.',
      limiteEstudios: (x) => 'Hasta ' + x + ' estudios.',
      limiteIdiomas: (x) => 'Hasta ' + x + ' idiomas.',
    },

    // datos.md §11: clave que levanta la base → texto. Las que dependen de config reciben los valores en `c`.
    errorDeClave(clave, c) {
      const e = this.errores;
      c = c || {};
      const mapa = {
        invitaciones_cerradas: e.cerradas, sin_cupo: e.sinCupo, mail_invalido: e.mailInvalido,
        mail_con_invitacion: e.mailConInvitacion, mail_con_cuenta: e.mailConCuenta,
        invitacion_no_existe: e.invNoExiste, invitacion_usada: e.invUsada, invitacion_vencida: e.invVencida,
        invitacion_otro_mail: e.invOtroMail,
        fecha_fin_anterior: e.fechaFinAnterior, fecha_futura: e.fechaFutura,
        salario_rango_invalido: e.minimoMayor, salario_incompleto: e.salarioIncompleto,
        modalidades_vacias: e.modalidades,
        niveles_vacios: e.niveles, jornadas_vacias: e.jornadas,
        puestos_demasiados: e.puestosDemasiados(10), puesto_largo: e.puestoLargo(60),
        palabras_clave_demasiadas: e.palabrasClaveDemasiadas(15), palabra_clave_larga: e.palabraClaveLarga(40),
        umbral_fuera_de_rango: e.umbral(c.umbral_min || 50, c.umbral_max || 95),
        paquetes_por_dia_invalido: e.paquetes(c.paquetes_por_dia_opciones && c.paquetes_por_dia_opciones.length ? c.paquetes_por_dia_opciones : [3]),
        limite_experiencias: e.limiteExperiencias(c.max_experiencias || 15),
        limite_estudios: e.limiteEstudios(c.max_estudios || 15),
        limite_idiomas: e.limiteIdiomas(c.max_idiomas || 10),
        texto_corto: e.textoCorto, texto_largo: e.textoLargo(c.max_texto_pegado_chars || 20000),
        aviso_con_texto: e.conTexto, aviso_sin_texto: e.sinTexto,
        paquete_ya_armado: e.yaArmado, paquete_ya_pedido: e.yaPedido, armar_desactivado: e.armarNo,
        aviso_no_disponible: e.avisoNoDisponible,
        dni_invalido: e.dni, cuil_invalido: e.cuil, fecha_nacimiento_invalida: e.nacimiento,
        direccion_incompleta: e.direccionIncompleta, calle_invalida: e.calle, codigo_postal_invalido: e.codigoPostal, provincia_invalida: e.provincia,
        interes_invalido: e.marcar, transicion_invalida: e.marcar, motivo_sin_no_interesa: e.motivoSinNoInteresa,
        pedidos_cambiaron: e.pedidosCambiaron,
        postulacion_enviada: e.enviada, no_postulable: e.noPostulable,
        intentos_agotados: e.agotados(c.max_reintentos_postulacion || 3), reintento_en_operacion: e.reintento,
        no_se_puede_borrar_admin: e.borrarUsuario, usuario_no_existe: e.borrarUsuario,
        empresas_demasiadas: e.empresasDemasiadas(c.max_empresas_seguidas || 10), empresa_nombre_invalido: e.empresaNombre,
        contrata_publicacion_no_abierta: e.ternaCerrado, contrata_cerrado: e.ternaCerrado, no_es_de_terna: e.ternaNoExiste,
        aviso_propio: e.ternaPropio, postulacion_sin_paquete: e.ternaSinPaquete, postulacion_ya_recibida: e.ternaYaRecibida,
        postulacion_no_existe: e.ternaNoExiste, propuesta_no_existe: e.ternaNoExiste, denuncia_invalida: e.ternaDenuncia,
      };
      return mapa[clave] || e.general;
    },
  };
})();
