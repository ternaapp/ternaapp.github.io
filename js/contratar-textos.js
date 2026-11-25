/* Terna · js/contratar-textos.js
   Los textos de Terna Jobs Empresas (contratar.html; hasta el 24/11/2026, «Terna para contratar»: PLAN-LADOS), copiados de
   contratar.md §8 (en terna-motor/docs). Viven aparte de
   js/textos.js, como los del portal operativo: son de una página que no ve quien busca trabajo. La voz es la de brand.md §4
   (sereno, honesto, concreto, voseo, sin «nosotros»). El código de contratar.js no escribe textos propios. */
'use strict';

window.TC = (function () {
  const n = (x) => Number(x || 0).toLocaleString('es-AR');
  const plural = (x, uno, varios) => (Number(x) === 1 ? uno : varios);
  return {
    // propuesta LOGOS (brand.md §1): el <title> y el nombre accesible del logo.
    // propuesta PLAN-LADOS (contratar.md §8.1; logos.md, «Regla del nombre»), 24/11: el lado de quien contrata se llama «Terna Jobs
    // Empresas» (D1): el <title> lleva el nombre del lado, como el de Entrar lleva «Terna Jobs», y la pastilla (.op-marca) al lado
    // del logo «terna jobs» dice «Empresas». Antes: documento «Contratar | Terna Jobs»; marca «Contratar».
    documento: 'Terna Jobs Empresas',
    marca: 'Empresas',

    entrar: {
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: la entrada dice en qué lado estás. Antes: «Terna para contratar».
      titulo: 'Entrar a Terna Jobs Empresas',
      // propuesta PLAN-LANDING-2 (contratar.md §8.1), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»). Antes terminaba
      // con «Se entra por invitación.».
      intro: 'Publicá tus avisos y recibí postulaciones de personas cuyo perfil ajusta con el puesto.',
      mail: 'Mail',
      contrasena: 'Contraseña',
      boton: 'Entrar',
      errorCredenciales: 'El mail o la contraseña no coinciden.',
      errorCompletar: 'Completá el mail y la contraseña.',
      falla: 'No se pudo. Probá de nuevo.',
      salir: 'Salir',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: sin nombrar a quien revisa ni decir «invitación» (D4). «Escribinos» va
      // solo en el contacto (la excepción de brand.md §4 que propone el plan). Antes: sinCuenta «Esta cuenta todavía no contrata en
      // Terna. Para publicar avisos hace falta una invitación de Francisco.»; olvido «Si te olvidaste la contraseña, escribile a
      // Francisco.».
      sinCuenta: 'Esta cuenta todavía no publica avisos en Terna. Para empezar, pedí tu cuenta de Terna Jobs Empresas.',
      // propuesta PLAN-LADOS (contratar.md §8.1), FEEDBACK-LADOS punto 9: «escribinos por LinkedIn» es un link (olvidoLink, a
      // T.landing.contacto.linkedin, como «Pedila por LinkedIn»); olvido arma la frase con ese link adentro. Antes (en esta misma
      // tanda): el texto entero, sin link, «Si te olvidaste la contraseña, escribinos por LinkedIn.».
      olvido: (link) => ['Si te olvidaste la contraseña, ', link, '.'],
      olvidoLink: 'escribinos por LinkedIn',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: la salida para quien llega sin cuenta desde «Publicar un aviso» de la
      // landing (D3), arriba de comoSeEntra. El link es sinCuentaLink, a T.landing.contacto.linkedin (con Terna.urlExterna, en otra
      // pestaña). Cuando exista el alta abierta de este lado, pasa a «Creá tu cuenta» y nada más cambia.
      sinCuentaPregunta: '¿Todavía no tenés cuenta?',
      sinCuentaLink: 'Pedila por LinkedIn',
      // propuesta FEEDBACK-LANDING P2-8 (contratar.md §8.1): arriba del renglón de quien busca trabajo, cómo se pide la invitación
      // para contratar; va a bienvenida.html#pedir, donde está el LinkedIn de Francisco. Desde QUIENES-SOMOS §4 va siempre: con la
      // dirección cargada ya no hay variante «sin contacto» (se fue sinContacto).
      // propuesta PLAN-LANDING-2 (contratar.md §8.1), 24/11: la web pública ya no dice «por invitación» (Francisco, «Sí, cambialos»). Antes: «Cómo pedir una
      // invitación para contratar», a bienvenida.html#pedir; ahora a la sección de quien contrata.
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: el nombre del lado (D1). Antes: «Cómo funciona Terna para contratar».
      comoSeEntra: 'Cómo funciona Terna Jobs Empresas',
      // propuesta PLAN-LANDING §4.13 (contratar.md §8.1): el renglón inverso al de Entrar, debajo del formulario. El link es la frase.
      buscasPregunta: '¿Buscás trabajo?',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: el nombre del otro lado. Antes: «Entrá a Terna».
      buscasLink: 'Entrá a Terna Jobs',
    },

    invitacion: {
      titulo: (cuenta) => 'Te invitaron a contratar con Terna como ' + cuenta,
      tituloMiembro: (cuenta) => 'Te invitaron al equipo de ' + cuenta,
      intro: 'Con esta cuenta publicás avisos, ves quién se postuló y a quién le ajusta el puesto. Lo que publiques lo ven las personas que usan Terna para buscar trabajo.',
      paraMail: (mail) => 'La invitación es para ' + mail + '.',
      nombre: 'Tu nombre',
      contrasena: 'Contraseña nueva',
      contrasenaAyuda: 'Al menos 8 caracteres.',
      repetir: 'Repetí la contraseña',
      crear: 'Crear la cuenta',
      yaTengo: 'Ya tengo una cuenta en Terna',
      yaTengoAyuda: 'Si ya usás Terna para buscar trabajo con este mail, entrá con esa contraseña: la misma cuenta sirve para las dos cosas.',
      aceptar: 'Aceptar la invitación',
      aceptada: 'Listo: ya podés publicar.',
      noCoinciden: 'Las contraseñas no coinciden.',
      corta: 'La contraseña tiene que tener al menos 8 caracteres.',
      noExiste: 'Este link de invitación no existe. Pedile uno nuevo a quien te invitó.',
      usada: 'Esta invitación ya se usó. Si es tuya, entrá con tu mail y tu contraseña.',
      vencida: 'Esta invitación venció. Pedile una nueva a quien te invitó.',
      otroMail: 'Esta invitación es para otro mail. Entrá con el mail al que llegó.',
      yaExiste: 'Ese mail ya tiene una cuenta en Terna: tocá «Ya tengo una cuenta en Terna».',
    },

    secciones: { avisos: 'Avisos', publicar: 'Publicar', equipo: 'Equipo', cuenta: 'Cuenta' },
    cuentaElegir: 'Cuenta',

    comun: {
      actualizar: 'Actualizar',
      leido: (hora) => 'Leído a las ' + hora + '.',
      volver: 'Volver a los avisos',
      cancelar: 'Cancelar',
      guardar: 'Guardar',
      guardado: 'Guardado.',
      sinDato: '—',
      menosDe: (piso) => 'menos de ' + n(piso),
      dias: (x) => n(x) + plural(x, ' día', ' días'),
      personas: (x) => n(x) + plural(x, ' persona', ' personas'),
      errorCarga: 'No se pudo cargar. Probá de nuevo.',
      reintentar: 'Probar de nuevo',
      falta0055: 'Falta aplicar la migración 0055 en la base: sin ella esta página no tiene datos.',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: «Terna» y no quien revisa (D4); el nombre del lado (D1). Antes:
      // cuentaPausada «Francisco pausó esta cuenta: tus avisos no se ven y no podés publicar. Escribile para saber por qué.»;
      // cerrado «Terna para contratar está cerrado por ahora: podés mirar, no publicar.».
      cuentaPausada: 'Terna pausó esta cuenta: tus avisos no se ven y no podés publicar. Escribinos para saber por qué.',
      cerrado: 'Terna Jobs Empresas está cerrado por ahora: podés mirar, no publicar.',
    },

    estados: {
      borrador: 'Borrador', en_revision: 'En revisión', abierta: 'Abierto', pausada: 'Pausado', cerrada: 'Cerrado', vencida: 'Vencido', rechazada: 'No se publicó',
    },
    modalidades: { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' },
    jornadas: { completa: 'Jornada completa', parcial: 'Jornada parcial' },
    niveles: { pasantia: 'Pasantía', junior: 'Junior', semi_senior: 'Semi senior', senior: 'Senior', lider: 'Líder', director: 'Dirección' },
    idiomas: { es: 'Español', en: 'Inglés' },
    periodos: { mensual: 'por mes', anual: 'por año' },

    avisos: {
      titulo: 'Tus avisos',
      intro: 'Cada aviso abierto lo ven las personas que usan Terna y a las que les ajusta. Terna lo revisa con su perfil una vez por día, a la mañana: los números de abajo cambian de un día al otro.',
      nuevo: 'Publicar un aviso',
      vacio: 'Todavía no publicaste avisos.',
      cupo: (a, max) => n(a) + ' de ' + n(max) + ' avisos abiertos o en revisión.',
      sinCupo: (max) => 'Llegaste a ' + n(max) + ' avisos abiertos o en revisión: cerrá o pausá uno para abrir otro.',
      abiertoHace: (d) => (Number(d) === 0 ? 'abierto hoy' : 'abierto hace ' + n(d) + plural(d, ' día', ' días')),
      venceEl: (f) => 'vence el ' + f,
      vencioEl: (f) => 'venció el ' + f,
      cerradoEl: (f) => 'cerrado el ' + f,
      postulaciones: (t, nuevas) => n(t) + plural(t, ' postulación', ' postulaciones') + (nuevas ? ' · ' + n(nuevas) + plural(nuevas, ' nueva', ' nuevas') : ''),
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: «Terna» y no quien revisa (D4). Antes: «Francisco lo revisa antes de
      // publicarlo. Te queda abierto apenas lo apruebe.».
      enRevision: 'Terna lo revisa antes de publicarlo. Te queda abierto apenas se apruebe.',
      rechazado: (motivo) => 'No se publicó' + (motivo ? ': ' + motivo : '.') + ' Cambialo y volvé a enviarlo.',
      ver: 'Ver',
      editar: 'Editar',
      publicar: 'Publicar',
      enviarRevision: 'Enviar a revisión',
      pausar: 'Pausar',
      reanudar: 'Volver a abrir',
      renovar: 'Renovar 30 días',
      cerrar: 'Cerrar',
      pausarTitulo: '¿Pausar el aviso?',
      pausarTexto: 'Deja de verse en Terna hasta que lo vuelvas a abrir. Las postulaciones que ya llegaron siguen acá.',
      cerrarTitulo: '¿Cerrar el aviso?',
      cerrarTexto: 'Deja de verse en Terna y no recibe más postulaciones. Las que llegaron siguen acá.',
      cerrarMotivo: 'Por qué lo cerrás',
      cerrarMotivos: { cubierto: 'Ya contraté a alguien', cancelado: 'Ya no busco', otro: 'Otro motivo' },
      hechoPausar: 'Listo: pausado.',
      hechoReanudar: 'Listo: abierto otra vez.',
      hechoRenovar: 'Listo: abierto 30 días más.',
      hechoCerrar: 'Listo: cerrado.',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11 (D4). Antes: «Listo: Francisco lo revisa antes de publicarlo.».
      hechoRevision: 'Listo: Terna lo revisa antes de publicarlo.',
      hechoAbierto: 'Listo: publicado. Terna lo cruza con los perfiles en la próxima corrida, a la mañana.',
    },

    aviso: {
      volver: 'Tus avisos',
      cifras: 'Cómo viene',
      cifrasIntro: (piso) => 'Cuántas personas: de 1 a ' + n(piso - 1) + ' dice «menos de ' + n(piso) + '», para que nadie se pueda reconocer por un número.',
      mostrado: 'Personas a las que les ajusta',
      mostradoAyuda: 'Terna lo puso en su lista porque pasa sus filtros (dónde, cómo, idioma) y lo puntuó con su perfil.',
      vistas: 'Lo abrieron',
      match90: 'Match de 90 o más',
      match80: 'Match de 80 o más',
      match70: 'Match de 70 o más',
      recomendables: 'Aceptan que les propongas postular',
      postulaciones: 'Postulaciones',
      propuestas: (e, a) => n(e) + plural(e, ' propuesta', ' propuestas') + ', ' + n(a) + plural(a, ' aceptada', ' aceptadas'),
      match: 'El match es el ajuste entre el perfil de la persona y tu aviso, de 0 a 100. No dice si va a ser una buena contratación.',
      texto: 'El aviso',
      textoVer: 'Ver el texto del aviso',
      recibidas: 'Postulaciones',
      recibidasIntro: 'Quien se postuló te deja su contacto, su CV y su carta para este aviso. Si retira la postulación, deja de verse acá.',
      recibidasVacio: 'Todavía no se postuló nadie.',
      origen: { automatica: 'La envió Terna por la persona', persona: 'La envió la persona', propuesta: 'Aceptó tu propuesta' },
      estadoCandidatura: { nueva: 'Nueva', vista: 'Vista', contactada: 'Contactada', descartada: 'Descartada' },
      marcar: 'Marcar como',
      cv: 'CV',
      carta: 'Carta',
      sinArchivos: 'El CV y la carta ya no están: Terna los guarda 60 días. Pedíselos por mail.',
      salario: (monto, moneda, periodo) => 'Salario que pide: ' + moneda + ' ' + n(monto) + (periodo ? ' ' + periodo : ''),
      recibidaEl: (f) => 'Recibida el ' + f,
      escribir: 'Escribir',
      llamar: 'Llamar',
      linkedin: 'LinkedIn',
      recomendados: 'Personas que ajustan',
      recomendadosIntro: 'Personas que aceptan que quien contrata les proponga postular, con match alto para este aviso. No ves su nombre ni dónde trabaja hasta que se postula.',
      recomendadosVacio: 'Por ahora nadie con match alto acepta propuestas para este aviso. Terna vuelve a mirar mañana.',
      recomendadosCerrado: 'Con el aviso cerrado, pausado o en revisión no hay propuestas.',
      anios: (x) => n(x) + plural(x, ' año', ' años') + ' de experiencia',
      cumple: 'Cumple de tu aviso',
      cumpleCuenta: (c, t) => 'Cumple ' + n(c) + ' de ' + n(t) + ' requisitos que Terna leyó en tu aviso',
      prefiere: 'Prefiere',
      proponer: 'Proponer que postule',
      propuesta: 'Propuesta enviada',
      propuestaAceptada: 'Aceptó: está en Postulaciones',
      propuestaRechazada: 'No le interesa',
      proponerTitulo: '¿Proponerle que postule?',
      proponerTexto: 'Terna le avisa en su lista que te interesa su perfil para este aviso. Si acepta, te llega su postulación con su contacto. Si no, no se entera nadie más.',
      hechoProponer: 'Listo: Terna se lo propone.',
      topePropuestas: 'Llegaste al tope de propuestas de este aviso por hoy.',
    },

    publicar: {
      tituloNuevo: 'Publicar un aviso',
      tituloEditar: 'Editar el aviso',
      intro: 'Escribí el aviso como lo leería alguien que busca trabajo. Sin links, mails ni teléfonos: el contacto llega por Terna cuando alguien se postula.',
      soloTexto: 'Con el aviso abierto, en revisión o pausado podés cambiar la descripción, los requisitos y el salario. Lo demás cambia a quién le llega: para eso, cerralo y publicá otro.',
      puesto: 'Puesto',
      puestoAyuda: 'Como se llama el trabajo: «Mecánico de motos», «Docente de inglés», «Analista contable».',
      descripcion: 'Descripción',
      descripcionAyuda: 'Qué hace, dónde, con quién, en qué horario. Entre 150 y 6.000 caracteres.',
      requisitos: 'Requisitos (opcional)',
      requisitosAyuda: 'Uno por línea. Terna los usa para el match: lo que pongas acá es lo que mira primero.',
      ubicacion: 'Dónde',
      ubicacionAyuda: 'La ciudad o el barrio. Si es remoto para todo el país, dejá «Argentina».',
      modalidad: 'Modalidad',
      jornada: 'Jornada',
      jornadaSin: 'Sin decir',
      nivel: 'Nivel',
      nivelSin: 'Sin decir',
      idioma: 'Idioma del aviso',
      salario: 'Salario (opcional)',
      salarioAyuda: 'Si lo ponés, lo ven las personas y Terna lo usa para sugerirles cuánto pedir.',
      desde: 'Desde',
      hasta: 'Hasta',
      moneda: 'Moneda',
      periodo: 'Período',
      contador: (x, max) => n(x) + ' de ' + n(max),
      guardar: 'Guardar borrador',
      guardarCambios: 'Guardar los cambios',
      enviar: 'Guardar y enviar a revisión',
      enviarConfianza: 'Guardar y publicar',
      guardadoBorrador: 'Guardado como borrador.',
      errores: {
        contrata_puesto_invalido: 'Escribí el puesto, entre 3 y 120 caracteres, sin links ni contactos.',
        contrata_descripcion_invalida: 'La descripción tiene que tener entre 150 y 6.000 caracteres.',
        contrata_requisitos_invalidos: 'Los requisitos pueden tener hasta 3.000 caracteres.',
        contrata_texto_con_contacto: 'Sacá los links, mails y teléfonos: el contacto llega por Terna cuando alguien se postula.',
        contrata_ubicacion_invalida: 'Escribí dónde es, sin links ni contactos.',
        contrata_modalidad_invalida: 'Elegí la modalidad.',
        contrata_salario_invalido: 'Revisá el salario: un número en «Desde» o «Hasta» (o los dos, con «Desde» menor), la moneda y el período.',
        contrata_sin_cupo_borradores: 'Tenés 10 borradores: publicá o cerrá alguno antes de empezar otro.',
      },
    },

    equipo: {
      titulo: 'Equipo',
      intro: 'Las personas que manejan esta cuenta. Todas ven los avisos, las postulaciones y las personas que ajustan. Invitar y quitar, solo quien es dueña o dueño.',
      dueno: 'Dueña o dueño',
      miembro: 'Miembro',
      vos: 'vos',
      pendiente: (f) => 'Invitación pendiente · vence el ' + f,
      invitar: 'Invitar a alguien',
      mail: 'Su mail',
      invitarBoton: 'Crear la invitación',
      link: 'Mandale este link. Vale 7 días y solo para ese mail.',
      copiar: 'Copiar el link',
      copiado: 'Copiado.',
      cancelar: 'Cancelar la invitación',
      quitar: 'Quitar del equipo',
      quitarTitulo: (mail) => '¿Quitar a ' + mail + ' del equipo?',
      quitarTexto: 'Deja de ver los avisos y las postulaciones de esta cuenta. Su cuenta de Terna sigue.',
      hacerDueno: 'Hacer dueña o dueño',
      hacerMiembro: 'Dejar como miembro',
      hecho: 'Listo.',
      cupo: (a, max) => n(a) + ' de ' + n(max) + ' lugares usados.',
      errores: {
        mail_invalido: 'Ese mail no parece válido.',
        mail_con_invitacion: 'Ese mail ya tiene una invitación pendiente.',
        contrata_ya_es_miembro: 'Esa persona ya está en el equipo.',
        contrata_sin_cupo_miembros: 'No quedan lugares en el equipo.',
        contrata_ultimo_dueno: 'La cuenta necesita al menos una dueña o un dueño.',
        contrata_solo_dueno: 'Eso lo hace quien es dueña o dueño de la cuenta.',
      },
    },

    cuenta: {
      titulo: 'Cuenta',
      intro: 'Cómo se llama la cuenta en los avisos. Las personas ven este nombre en cada aviso que publicás.',
      tipo: { empresa: 'Empresa', particular: 'Particular' },
      nombre: 'Nombre que se ve en los avisos',
      nombreAyudaParticular: 'Si publicás como particular, puede ser tu nombre o el de tu negocio. Va a Terna y a quienes buscan trabajo.',
      otros: 'Otros nombres de la empresa (opcional)',
      otrosAyuda: 'Uno por línea, hasta 5: la razón social, la marca. Terna no le muestra tus avisos como propuesta a quien hoy trabaja en una empresa con alguno de estos nombres.',
      soloDueno: 'Solo quien es dueña o dueño cambia el nombre.',
      errores: {
        contrata_nombre_invalido: 'El nombre tiene que tener entre 2 y 80 caracteres, sin links ni contactos.',
        contrata_otros_nombres_invalidos: 'Hasta 5 nombres, de 2 a 80 caracteres cada uno.',
      },
    },

    errores: {
      contrata_no_autorizado: 'Esta cuenta no puede hacer eso.',
      // propuesta PLAN-LADOS (contratar.md §8.1), 24/11: «Terna» y no quien revisa (D4); el nombre del lado (D1). Antes:
      // contrata_cuenta_pausada «Francisco pausó esta cuenta: no podés publicar ni cambiar avisos.»; contrata_cerrado «Terna para
      // contratar está cerrado por ahora.».
      contrata_cuenta_pausada: 'Terna pausó esta cuenta: no podés publicar ni cambiar avisos.',
      contrata_cerrado: 'Terna Jobs Empresas está cerrado por ahora.',
      contrata_sin_cupo_avisos: 'Llegaste al tope de avisos abiertos o en revisión: cerrá o pausá uno.',
      contrata_transicion_invalida: 'Ese aviso ya cambió: actualizá la página.',
      contrata_publicacion_no_existe: 'Ese aviso ya no existe.',
      contrata_publicacion_no_abierta: 'El aviso no está abierto.',
      contrata_persona_no_visible: 'Esa persona ya no está en la lista: puede que haya cambiado lo que acepta.',
      contrata_sin_cupo_propuestas: 'Llegaste al tope de propuestas de este aviso (5 por día, 20 en total).',
      contrata_candidatura_no_existe: 'Esa postulación ya no está: la persona la retiró.',
      generico: 'No se pudo. Probá de nuevo.',
    },
  };
})();
