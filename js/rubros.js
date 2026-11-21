/* Terna · js/rubros.js
   Los rubros de Empleos, deducidos del nombre del puesto (PLAN-UX.md §3.3.1; decisión D6), mientras la base no traiga avisos.rubro
   (PLAN-UX §6.4: la misma lista de doce claves, que el motor pondría en «Normalizar» con un diccionario como este). Los nombres
   están en T.busqueda.rubros.valores.
   Cómo se decide: el título se compara sin tildes, sin mayúsculas y sin signos, como el buscador. Cada rubro tiene sus palabras;
   una palabra cuenta si el título tiene una que empieza así («contab» trae «contable» y «contabilidad»), y las que terminan en
   espacio, solo enteras («bi », «it », «ux »: «bi» no trae «bilingüe»). Gana la que aparece primero en el título («Analista de
   datos comerciales» es de datos; «Analista comercial», de ventas) y, si dos empiezan en el mismo lugar, la más larga («desarrollo
   de negocios» le gana a «desarroll», «maestranza» a «maestr», «seguridad informática» a «seguridad»).
   Es una aproximación y la pantalla lo dice («Por el nombre del puesto»): «Asistente», «Analista» u «Operaciones» no dicen el
   rubro, y lo que no se puede clasificar va a «Otros». */
'use strict';

window.Rubros = (function () {
  // El orden de T.busqueda.rubros.valores (y del campo que se propone al motor).
  const CLAVES = ['administracion', 'ventas', 'atencion', 'tecnologia', 'logistica', 'oficios', 'gastronomia', 'salud', 'educacion',
    'construccion', 'limpieza_seguridad', 'otros'];
  // Los que no son de oficina: para ellos, cuando hay poco o nada, Empleos dice por qué (T.busqueda.vacioRubro).
  const NO_OFICINA = new Set(['logistica', 'oficios', 'gastronomia', 'salud', 'educacion', 'construccion', 'limpieza_seguridad']);

  const PALABRAS = {
    administracion: [
      'administrativ', 'administracion', 'administrador', 'contab', 'contador', 'contadora', 'accounting', 'accountant', 'finanz', 'financ',
      'tesorer', 'treasury', 'cobranz', 'cuentas a pagar', 'cuentas por pagar', 'cuentas a cobrar', 'cuentas por cobrar', 'facturacion',
      'costos', 'impuest', 'tax ', 'auditor', 'audit', 'liquidacion de sueldos', 'sueldos', 'payroll', 'nomina', 'recursos humanos', 'rrhh',
      'rr hh', 'hr ', 'human resources', 'talent', 'seleccion de personal', 'reclut', 'recruit', 'control de gestion', 'controller',
      'controlling', 'planeamiento', 'planificacion', 'presupuest', 'budget', 'riesgo', 'risk', 'credit', 'banca', 'bancari', 'banking',
      'legal', 'abogad', 'juridic', 'lawyer', 'escriban', 'secretari', 'back office', 'compliance', 'inversiones', 'actuari',
    ],
    ventas: [
      'venta', 'vendedor', 'vendedora', 'comercial', 'comercio ', 'sales', 'account executive', 'account manager', 'ejecutivo de cuentas',
      'ejecutiva de cuentas', 'key account', 'kam ', 'business development', 'desarrollo de negocios', 'desarrollo comercial', 'desarrollador de negocios',
      'desarrolladora de negocios', 'desarrollador comercial', 'desarrolladora comercial', 'pricing',
      'marketing', 'mercadeo', 'brand', 'e commerce', 'ecommerce', 'retail', 'cajer', 'repositor', 'promotor', 'telemarket', 'televent',
      'preventista', 'inmobiliari', 'productor de seguros', 'productor asesor', 'productora asesora', 'visitador medico',
      'visitadora medica', 'encargado de local', 'encargada de local', 'tienda', 'growth', 'community manager', 'redes sociales',
      'publicidad', 'comunicacion', 'mercado ', 'market ', 'merchandis',
    ],
    atencion: [
      'atencion', 'atencion al cliente', 'atencion a clientes', 'atencion al publico', 'call center', 'contact center', 'customer success',
      'customer service', 'customer support', 'customer experience', 'customer care', 'experiencia del cliente', 'experiencia de cliente',
      'servicio al cliente', 'soporte al cliente', 'recepcionista', 'operador telefonico', 'operadora telefonica', 'teleoperador',
      'posventa', 'post venta', 'postventa', 'reclamos',
    ],
    tecnologia: [
      'datos', 'dato ', 'data ', 'database', 'bi ', 'business intelligence', 'inteligencia de negocios', 'business analyst', 'reporting',
      'analytics', 'analitica', 'desarroll', 'developer', 'programador', 'programadora', 'programacion', 'software', 'frontend', 'front end',
      'backend', 'back end', 'fullstack', 'full stack', 'devops', 'sre ', 'qa ', 'quality assurance', 'tester', 'testing', 'automation',
      'sistemas', 'it ', 'informatic', 'ux ', 'ui ', 'user experience', 'cloud', 'ciberseguridad', 'cybersecurity', 'seguridad informatica',
      'seguridad de la informacion', 'security', 'machine learning', 'ml ', 'ia ', 'ai ', 'inteligencia artificial', 'scientist',
      'cientifico de datos', 'cientifica de datos', 'calidad de datos', 'soporte tecnico', 'soporte it', 'mesa de ayuda', 'help desk',
      'helpdesk', 'service desk', 'funcional', 'product manager', 'product owner', 'product designer', 'producto ', 'scrum', 'agile',
      'sap ', 'salesforce', 'erp ', 'crm ', 'redes ', 'networking', 'administrador de sistemas', 'administrador de redes',
      'administrador de base', 'dba ', 'base de datos', 'web ', 'mobile', 'android', 'ios ', 'java', 'python', 'javascript', 'react',
      'tecnolog', 'technology', 'tech ', 'arquitecto de software', 'arquitecta de software', 'arquitecto de datos', 'arquitecta de datos',
      'arquitecto de soluciones', 'arquitecta de soluciones', 'arquitecto cloud', 'arquitecta cloud', 'arquitecto de sistemas',
      'arquitecta de sistemas', 'solution architect', 'solutions architect',
    ],
    logistica: [
      'logistic', 'supply chain', 'supply', 'abastecimiento', 'compras', 'comprador', 'compradora', 'procurement', 'purchasing', 'buyer',
      'comercio exterior', 'importacion', 'exportacion', 'aduana', 'despachante', 'deposito', 'almacen ', 'warehouse', 'inventario',
      'inventory', 'stock', 'picking', 'expedicion', 'distribucion', 'transporte', 'transport', 'chofer', 'conductor', 'conductora',
      'camioner', 'fletero', 'repartidor', 'repartidora', 'cadete', 'mensajer', 'motoquero', 'flota', 'autoelevador',
      'clarkista', 'operario de deposito', 'operaria de deposito', 'auxiliar de deposito', 'demand planner', 'planificacion de la demanda',
      'planner', 'ruteo', 'ultima milla', 'last mile', 'operador logistico',
    ],
    oficios: [
      'operari', 'operador de maquina', 'operadora de maquina', 'operador de produccion', 'operadora de produccion', 'mecanic', 'mechanic',
      'tornero', 'soldador', 'soldadura', 'carpinter', 'herrer', 'electromecanic', 'electronic', 'costurer', 'modista', 'textil',
      'confeccion', 'peluquer', 'estilista', 'barber', 'manicur', 'cosmetolog', 'esteticista', 'maquillador', 'carnicer', 'matricer',
      'fresador', 'produccion', 'production', 'planificacion de produccion', 'planta ', 'fabrica', 'manufactur', 'maquinista', 'envasad',
      'empaque', 'armador', 'ensamblador', 'montador', 'tapicer', 'zapater', 'joyer', 'cerrajer', 'jardiner', 'paisajis', 'vidrier',
      'imprenta', 'control de calidad', 'higiene y seguridad', 'seguridad e higiene', 'seguridad y salud',
    ],
    gastronomia: [
      'cocin', 'chef', 'ayudante de cocina', 'bacher', 'mozo', 'moza ', 'mozas', 'camarer', 'mesero', 'mesera', 'bartender', 'barman',
      'barista', 'pastel', 'panader', 'pizzer', 'parriller', 'sushiman', 'gastronom', 'restaurant', 'restoran', 'cafeteria', 'hotel',
      'housekeeping', 'mucama de hotel', 'conserje', 'concierge', 'recepcionista de hotel', 'front desk', 'room service', 'catering',
      'sommelier', 'maitre', 'steward', 'heladero', 'turismo', 'agente de viajes',
    ],
    salud: [
      'enfermer', 'nurse', 'medico', 'medica ', 'medicas', 'medicina', 'medical', 'odontolog', 'dentist', 'kinesiolog', 'fisioterap',
      'farmac', 'bioquimic', 'psicolog', 'nutricion', 'instrumentador', 'acompanante terapeutic', 'terapeut', 'cuidador', 'cuidadora',
      'geriatr', 'veterinari', 'fonoaudiolog', 'obstetr', 'partera', 'radiolog', 'laboratorio', 'paramedic', 'clinica', 'clinico',
      'hospital', 'sanatorio', 'salud', 'health', 'camillero', 'atencion medica', 'guardia medica',
    ],
    educacion: [
      'docent', 'profesor', 'profesora', 'maestr', 'preceptor', 'tutor', 'educador', 'educacion', 'education', 'ensenanza', 'teacher',
      'teaching', 'instructor', 'instructora', 'capacitador', 'pedagog', 'psicopedagog', 'bibliotecari', 'jardin de infantes',
      'nivel inicial', 'nivel primario', 'nivel secundario', 'catedra', 'escuela', 'colegio', 'cuidadora de ninos', 'cuidador de ninos',
      'ninera',
    ],
    construccion: [
      'albanil', 'construccion', 'construction', 'obra ', 'obras', 'jefe de obra', 'jefa de obra', 'capataz', 'sobrestante',
      'maestro mayor de obra', 'arquitect', 'ingeniero civil', 'ingeniera civil', 'plomer', 'gasista', 'electricista', 'pintor', 'pintora',
      'techista', 'durlock', 'instalador', 'instaladora', 'refrigeracion', 'aire acondicionado', 'climatizacion', 'mantenimiento',
      'maintenance', 'oficial albanil', 'ayudante de obra', 'topograf', 'agrimensor', 'cadista', 'facility', 'facilities', 'edilici',
    ],
    limpieza_seguridad: [
      'limpieza', 'limpiador', 'limpiadora', 'cleaning', 'mucam', 'maestranza', 'personal domestico', 'empleada domestica',
      'servicio domestico', 'casera', 'casero', 'portero', 'portera', 'encargado de edificio', 'encargada de edificio', 'vigilador',
      'vigiladora', 'vigilancia', 'seguridad ', 'security guard', 'guardia', 'guardian', 'sereno', 'custodi', 'control de acceso',
      'agente de seguridad', 'lavador', 'lavadero', 'fumigador', 'control de plagas', 'recolector',
    ],
  };

  // Como el buscador y js/puestos.js: sin tildes (NFKD sin marcas), en minúscula, sin signos y con un espacio a cada lado.
  function normalizar(texto) {
    return ' ' + String(texto || '').normalize('NFKD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }
  // Cada palabra, con su rubro, ya normalizada: ' contab' (empieza así) o ' bi ' (entera).
  const TODAS = [];
  for (const clave of Object.keys(PALABRAS)) {
    for (const p of PALABRAS[clave]) {
      const entera = / $/.test(p);
      const n = normalizar(p).trimEnd();
      TODAS.push({ clave, buscar: entera ? n + ' ' : n });
    }
  }

  // El rubro de un título de puesto (o de lo que se escribió en el buscador): una de las CLAVES; 'otros' si ninguna palabra lo dice.
  function de(titulo) {
    const t = normalizar(titulo);
    if (t.trim() === '') return 'otros';
    let mejor = null;
    let lugar = Infinity;
    let largo = 0;
    for (const x of TODAS) {
      const i = t.indexOf(x.buscar);
      if (i < 0) continue;
      if (i < lugar || (i === lugar && x.buscar.length > largo)) { mejor = x.clave; lugar = i; largo = x.buscar.length; }
    }
    return mejor || 'otros';
  }

  return { CLAVES, NO_OFICINA, de };
})();
