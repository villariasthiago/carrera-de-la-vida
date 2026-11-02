/* La Carrera de la Vida — datos del juego (tablero, cartas, fichas) */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};

  /* ---------- Colores de carrera / sueldo ---------- */
  CV.COLORES = {
    violeta: { nombre: 'Violeta', hex: '#8B6CC9' },
    celeste: { nombre: 'Celeste', hex: '#4FA3D9' },
    verde: { nombre: 'Verde', hex: '#4CAF7A' },
    naranja: { nombre: 'Naranja', hex: '#EE8A3C' },
    rosa: { nombre: 'Rosa', hex: '#E46C9C' },
    amarillo: { nombre: 'Amarillo (estrella)', hex: '#EDBE2C' }
  };

  /* ---------- Carreras ---------- */
  CV.CARRERAS = [
    { id: 'doctor', nombre: 'Doctor/a', icono: '🩺', titulo: true, colores: ['violeta'],
      especial: 'Cobrás cada vez que alguien cae en una casilla de Trabajo de Doctor/a.' },
    { id: 'contador', nombre: 'Contador/a', icono: '🧮', titulo: true, colores: ['violeta', 'celeste'],
      especial: 'Vencimiento de impuestos: cada vez que alguien cae en esa casilla, te paga sus impuestos a vos.' },
    { id: 'consultor', nombre: 'Consultor/a en Computación', icono: '💻', titulo: true, colores: ['celeste'],
      especial: 'Soporte técnico: si la ruleta de otro jugador se traba, cobrás $50.000 por arreglarla.' },
    { id: 'maestro', nombre: 'Maestro/a', icono: '📚', titulo: true, colores: ['celeste', 'verde'],
      especial: 'Trabajo de verano: cuando todos tienen carrera, sacás una segunda carrera. No cobrás sueldo por ella, pero sí sus casillas de Trabajo.' },
    { id: 'policia', nombre: 'Oficial de Policía', icono: '🚓', titulo: false, colores: ['naranja', 'verde'],
      especial: 'Control de velocidad: cada rival que saca un 10 en la ruleta te paga $10.000.' },
    { id: 'vendedor', nombre: 'Vendedor/a', icono: '🛍️', titulo: false, colores: ['naranja', 'rosa'],
      especial: 'Comisión: cada vez que un rival compra una acción o un seguro, te llevás $5.000 de lo que paga.' },
    { id: 'comediante', nombre: 'Comediante', icono: '🎤', titulo: false, colores: ['rosa'],
      especial: 'Tu gran oportunidad: si salen dos 8, dos 9 o dos 10 seguidos (de cualquier jugador), cambiás tu sueldo por uno amarillo de estrella.' },
    { id: 'atleta', nombre: 'Atleta', icono: '⚽', titulo: false, colores: ['verde', 'rosa'],
      especial: 'Llegás a las grandes ligas: al empezar tu turno podés canjear 4 fichas de Vida por un sueldo amarillo de estrella.' },
    { id: 'artista', nombre: 'Artista', icono: '🎨', titulo: false, colores: ['naranja'],
      especial: '¡Vendiste un cuadro! Cada rival que saca un 1 en la ruleta te compra una obra por $10.000.' }
  ];
  CV.carrera = function (id) {
    for (var i = 0; i < CV.CARRERAS.length; i++) if (CV.CARRERAS[i].id === id) return CV.CARRERAS[i];
    return null;
  };

  /* ---------- Tarjetas de sueldo ---------- */
  CV.SUELDOS = [
    { id: 's1', color: 'violeta', monto: 100000, impuesto: 45000 },
    { id: 's2', color: 'violeta', monto: 90000, impuesto: 40000 },
    { id: 's3', color: 'violeta', monto: 80000, impuesto: 35000 },
    { id: 's4', color: 'celeste', monto: 80000, impuesto: 35000 },
    { id: 's5', color: 'celeste', monto: 70000, impuesto: 30000 },
    { id: 's6', color: 'celeste', monto: 60000, impuesto: 25000 },
    { id: 's7', color: 'verde', monto: 60000, impuesto: 25000 },
    { id: 's8', color: 'verde', monto: 50000, impuesto: 20000 },
    { id: 's9', color: 'verde', monto: 40000, impuesto: 15000 },
    { id: 's10', color: 'naranja', monto: 50000, impuesto: 20000 },
    { id: 's11', color: 'naranja', monto: 40000, impuesto: 15000 },
    { id: 's12', color: 'naranja', monto: 30000, impuesto: 10000 },
    { id: 's13', color: 'rosa', monto: 50000, impuesto: 20000 },
    { id: 's14', color: 'rosa', monto: 40000, impuesto: 15000 },
    { id: 's15', color: 'rosa', monto: 30000, impuesto: 10000 },
    { id: 's16', color: 'amarillo', monto: 120000, impuesto: 50000 },
    { id: 's17', color: 'amarillo', monto: 100000, impuesto: 45000 }
  ];
  CV.sueldo = function (id) {
    for (var i = 0; i < CV.SUELDOS.length; i++) if (CV.SUELDOS[i].id === id) return CV.SUELDOS[i];
    return null;
  };

  /* ---------- Títulos de propiedad ---------- */
  // venta: [ruleta 1-3, ruleta 4-7, ruleta 8-10]
  CV.CASAS = [
    { id: 'h1', nombre: 'Monoambiente moderno', icono: '🏢', precio: 60000, seguro: 15000, venta: [50000, 70000, 90000], tono: '#9CC9E8' },
    { id: 'h2', nombre: 'Casita con jardín', icono: '🏡', precio: 100000, seguro: 25000, venta: [90000, 120000, 150000], tono: '#A8D8A0' },
    { id: 'h3', nombre: 'Cabaña en la montaña', icono: '🛖', precio: 120000, seguro: 30000, venta: [100000, 140000, 190000], tono: '#D9B48A' },
    { id: 'h4', nombre: 'Casa de campo', icono: '🌾', precio: 140000, seguro: 35000, venta: [120000, 160000, 210000], tono: '#E8D58A' },
    { id: 'h5', nombre: 'Loft de diseño', icono: '🏙️', precio: 160000, seguro: 40000, venta: [140000, 190000, 240000], tono: '#C4B5E6' },
    { id: 'h6', nombre: 'Casa de playa', icono: '🏖️', precio: 180000, seguro: 45000, venta: [150000, 210000, 270000], tono: '#F4CFA0' },
    { id: 'h7', nombre: 'Casona victoriana', icono: '🏰', precio: 200000, seguro: 50000, venta: [180000, 225000, 300000], tono: '#E8A9C4' },
    { id: 'h8', nombre: 'Mansión con pileta', icono: '🏛️', precio: 260000, seguro: 65000, venta: [220000, 300000, 400000], tono: '#9FDCD3' }
  ];
  CV.casa = function (id) {
    for (var i = 0; i < CV.CASAS.length; i++) if (CV.CASAS[i].id === id) return CV.CASAS[i];
    return null;
  };

  /* ---------- Acciones (valores de la bolsa) ---------- */
  CV.PRECIO_ACCION = 50000;
  CV.COBRO_ACCION = 10000;
  CV.SEGURO_AUTO = 10000;
  CV.PRESTAMO = 20000;
  CV.DEVOLUCION = 25000;
  CV.DINERO_INICIAL = 10000;
  CV.PRESTAMOS_UNIVERSIDAD = 5; // 5 x $20.000 = $100.000
  CV.ESCUELA_NOCTURNA = 20000;

  /* ---------- Fichas de Vida ---------- */
  CV.FICHAS_VIDA = [
    [50000, 'Plantaste un árbol en la plaza del barrio'],
    [50000, 'Adoptaste un perro del refugio'],
    [50000, 'Aprendiste a tocar la guitarra'],
    [50000, 'Corriste tu primera maratón'],
    [50000, 'Donaste sangre en el hospital'],
    [50000, 'Ayudaste en el comedor del barrio'],
    [50000, 'Armaste una huerta en el patio'],
    [50000, 'Visitaste a tus abuelos todos los domingos'],
    [100000, 'Escribiste un libro de cuentos'],
    [100000, 'Juntaste fondos para la escuela'],
    [100000, 'Aprendiste un idioma nuevo'],
    [100000, 'Cruzaste la cordillera en bici'],
    [100000, 'Organizaste la limpieza del río'],
    [100000, 'Inventaste un juguete que se vende muy bien'],
    [100000, 'Fuiste voluntario/a en una ONG'],
    [150000, 'Ganaste un premio de fotografía'],
    [150000, 'Fundaste una biblioteca popular'],
    [150000, 'Salvaste una especie en peligro'],
    [150000, 'Diste clases gratis a chicos del barrio'],
    [150000, 'Restauraste un cine histórico'],
    [200000, 'Descubriste la cura del resfrío'],
    [200000, 'Te eligieron Vecino/a del Año'],
    [200000, 'Construiste un hospital de campaña'],
    [250000, 'Ganaste el Premio Nobel de la Paz'],
    [250000, 'Viajaste a la Luna']
  ].map(function (f, i) { return { id: 'v' + (i + 1), valor: f[0], texto: f[1] }; });

  /* ---------- Tablero ---------- */
  // Tipos de casilla:
  //  pago, cobra, paga, trabajo, impuestos, vida, bebe, casarse, casa, vendecasa,
  //  empleo, jubilacion, despedido, crisis, escuela, cambiosueldo, subebolsa,
  //  desplome, seguroauto, segurocasa, inicioCarrera, inicioUni
  function C(t, txt, x) { var o = x || {}; o.t = t; o.txt = txt; return o; }
  function pago() { return C('pago', 'Día de pago: cobrás tu sueldo.'); }
  function cobra(txt, m) { return C('cobra', txt, { monto: m }); }
  function paga(txt, m) { return C('paga', txt, { monto: m }); }
  function trab(car, txt, m) { return C('trabajo', txt, { carrera: car, monto: m }); }
  function vida(txt) { return C('vida', txt); }
  function imp() { return C('impuestos', 'Vencimiento de impuestos: pagá los impuestos de tu tarjeta de sueldo.'); }

  CV.SEGMENTOS = [
    { id: 'car', nombre: 'Empezá tu carrera', siguiente: ['m'], casillas: [
      C('inicioCarrera', 'Empezá tu carrera: sacás una carrera (sin título) y un sueldo.'),
      cobra('Conseguiste un trabajo de verano. Cobrá $5.000.', 5000),
      vida('Ayudás a tus vecinos con la mudanza.'),
      paga('Te comprás ropa para la entrevista. Pagá $5.000.', 5000),
      pago(),
      paga('Te comprás un celular nuevo. Pagá $5.000.', 5000),
      trab('vendedor', 'Te tienta una oferta en el shopping. Pagá $5.000.', 5000)
    ] },
    { id: 'u', nombre: 'Universidad', siguiente: ['m'], casillas: [
      C('inicioUni', 'Empezá la universidad: pedís $100.000 prestados al banco para pagar los estudios.'),
      paga('Comprás los libros de primer año. Pagá $5.000.', 5000),
      vida('Hacés amigos para toda la vida.'),
      paga('Te mudás a una pensión cerca de la facu. Pagá $5.000.', 5000),
      vida('Te eligen delegado/a del curso.'),
      pago(),
      cobra('Ganás una beca. Cobrá $20.000.', 20000),
      paga('Viaje de egresados. Pagá $10.000.', 10000),
      vida('Hacés un intercambio en el exterior.'),
      cobra('Ganás un concurso de ideas. Cobrá $10.000.', 10000),
      C('empleo', '¡ALTO! Buscando empleo: elegís una de 3 carreras y sacás tu sueldo.')
    ] },
    { id: 'm', nombre: 'La vida', siguiente: ['f', 'r'], casillas: [
      pago(),
      paga('Alquilás tu primer departamento. Pagá $5.000.', 5000),
      trab('doctor', 'Te esguinzás jugando al fútbol. Pagá $5.000.', 5000),
      vida('Te sumás a un coro.'),
      cobra('Ganás un concurso de cocina. Cobrá $10.000.', 10000),
      imp(),
      trab('atleta', 'Te anotás en clases de tenis. Pagá $5.000.', 5000),
      C('cambiosueldo', 'Opcional: cambiá tu tarjeta de sueldo con la de cualquier jugador.'),
      pago(),
      paga('Se rompe la heladera. Pagá $10.000.', 10000),
      trab('artista', 'Comprás un cuadro para el living. Pagá $10.000.', 10000),
      vida('Rescatás un gatito de un árbol.'),
      C('seguroauto', 'Choque leve en la ruta. Si no tenés seguro de auto, pagá $10.000.', { monto: 10000 }),
      cobra('¡Ganás la maratón! Cobrá $10.000.', 10000),
      C('casarse', '¡ALTO! Te casás: sumás tu pareja al auto y una ficha de Vida.'),
      trab('comediante', 'Vas a ver un show de stand-up. Pagá $5.000.', 5000),
      vida('Luna de miel en la Patagonia.'),
      pago(),
      trab('maestro', 'Tomás clases de idioma. Pagá $10.000.', 10000),
      C('subebolsa', '¡Sube el mercado de valores! Tomá una acción gratis.'),
      trab('consultor', 'Se te cuelga la compu. Pagá $10.000.', 10000),
      C('escuela', 'Opcional — Escuela nocturna: pagá $20.000 y podés cambiar de carrera (ya tenés título).', { monto: 20000 }),
      C('bebe', '¡Tenés una bebita! Sumala al auto y tomá una ficha de Vida.', { hijos: ['f'] }),
      imp(),
      pago(),
      C('casa', '¡ALTO! Comprá una casa: sacás 2 títulos de propiedad y elegís si comprar uno.'),
      vida('Día de la ecología: plantás un árbol.'),
      trab('policia', 'Te multan por estacionar mal. Pagá $5.000.', 5000),
      C('bebe', '¡Tenés un bebito! Sumalo al auto y tomá una ficha de Vida.', { hijos: ['m'] }),
      paga('Pintás la casa por dentro. Pagá $10.000.', 10000),
      C('segurocasa', 'Una tormenta te vuela el techo. Si tenés casa sin seguro, pagá $40.000.', { monto: 40000 }),
      pago(),
      cobra('Ganás el sorteo del club. Cobrá $20.000.', 20000),
      trab('maestro', 'Clases de apoyo para los chicos. Pagá $10.000.', 10000),
      vida('Devolvés una billetera que encontraste.'),
      C('despedido', '¡Te despidieron! Empezás una nueva carrera.'),
      trab('vendedor', 'Te comprás un auto nuevo. Pagá $15.000.', 15000),
      C('bebe', '¡Tenés mellizos! Sumalos al auto y tomá una ficha de Vida.', { hijos: ['f', 'm'] }),
      pago(),
      C('desplome', 'Se desploma la bolsa. Devolvé una acción (si tenés).'),
      trab('doctor', 'Accidente esquiando. Pagá $10.000.', 10000),
      vida('Organizás la fiesta del barrio.'),
      C('cambiosueldo', 'Opcional: cambiá tu tarjeta de sueldo con la de cualquier jugador.'),
      trab('policia', 'Exceso de velocidad en la autopista. Pagá $10.000.', 10000),
      imp(),
      pago(),
      trab('atleta', 'Entradas para la final del campeonato. Pagá $15.000.', 15000),
      vida('Corrés una carrera solidaria.'),
      cobra('Vendés tu colección de figuritas. Cobrá $20.000.', 20000),
      trab('artista', 'Encargás un mural para tu casa. Pagá $15.000.', 15000)
    ] },
    { id: 'f', nombre: 'Camino de la familia', siguiente: ['n'], casillas: [
      C('bebe', '¡Tenés una bebita! Sumala al auto y tomá una ficha de Vida.', { hijos: ['f'] }),
      vida('Vacaciones familiares en la costa.'),
      paga('Útiles escolares para todos. Pagá $10.000.', 10000),
      pago(),
      vida('Acto escolar: tu hija es la abanderada.'),
      trab('maestro', 'Viaje de estudios de los chicos. Pagá $15.000.', 15000),
      C('bebe', '¡Tenés un bebito! Sumalo al auto y tomá una ficha de Vida.', { hijos: ['m'] }),
      vida('Adoptás un perro.'),
      trab('comediante', 'Contratás un mago para el cumpleaños. Pagá $15.000.', 15000),
      pago(),
      vida('Asado con toda la familia.'),
      trab('doctor', 'Varicela en toda la casa. Pagá $10.000.', 10000),
      cobra('La abuela te deja una herencia. Cobrá $40.000.', 40000)
    ] },
    { id: 'r', nombre: 'Camino del riesgo', siguiente: ['n'], casillas: [
      C('subebolsa', '¡Sube el mercado de valores! Tomá una acción gratis.'),
      cobra('Tu emprendimiento despega. Cobrá $50.000.', 50000),
      paga('Una inversión sale mal. Pagá $40.000.', 40000),
      pago(),
      trab('consultor', 'Tu empresa necesita soporte técnico. Pagá $20.000.', 20000),
      cobra('Vendés tu aplicación. Cobrá $80.000.', 80000),
      C('desplome', 'Se desploma la bolsa. Devolvé una acción (si tenés).'),
      paga('Te hackean la cuenta. Pagá $30.000.', 30000),
      vida('Hacés cumbre en el Aconcagua.')
    ] },
    { id: 'n', nombre: 'La madurez', siguiente: [], casillas: [
      pago(),
      C('vendecasa', '¡ALTO! Podés vender tu casa y/o comprar una nueva.'),
      trab('comediante', 'Vas al festival de humor. Pagá $10.000.', 10000),
      vida('Aprendés a bailar tango.'),
      C('crisis', '¡Crisis de la mediana edad! Empezás una nueva carrera.'),
      imp(),
      pago(),
      C('seguroauto', 'Te roban el auto. Si no tenés seguro de auto, pagá $25.000.', { monto: 25000 }),
      cobra('Ganás un concurso de preguntas en la tele. Cobrá $50.000.', 50000),
      trab('policia', 'Te cruzás un semáforo en rojo. Pagá $15.000.', 15000),
      vida('Volvés a estudiar a los 50.'),
      C('escuela', 'Opcional — Escuela nocturna: pagá $20.000 y podés cambiar de carrera (ya tenés título).', { monto: 20000 }),
      pago(),
      C('segurocasa', 'Se inunda el barrio. Si tenés casa sin seguro, pagá $60.000.', { monto: 60000 }),
      trab('vendedor', 'Renovás todos los muebles. Pagá $20.000.', 20000),
      vida('Tus hijos se reciben.'),
      cobra('Escribís un libro que es un éxito. Cobrá $40.000.', 40000),
      imp(),
      pago(),
      trab('artista', 'Comprás una escultura. Pagá $20.000.', 20000),
      vida('¡Llega tu primer nieto!'),
      trab('atleta', 'Clases de golf. Pagá $20.000.', 20000),
      vida('Donás tu biblioteca a la escuela del barrio.'),
      trab('doctor', 'Chequeo médico completo. Pagá $20.000.', 20000),
      pago(),
      cobra('Vendés tu colección de discos. Cobrá $30.000.', 30000),
      trab('consultor', 'Te comprás una tablet nueva. Pagá $15.000.', 15000),
      vida('Te hacen una fiesta sorpresa.'),
      pago(),
      C('jubilacion', '¡ALTO! Te jubilás: devolvés préstamos, vendés tu casa y elegís dónde vivir.')
    ] }
  ];

  CV.ROJAS = { empleo: 1, casarse: 1, casa: 1, vendecasa: 1, jubilacion: 1 };

  // Construir el mapa de casillas
  CV.CASILLAS = {};
  CV.SEGMENTOS.forEach(function (seg) {
    seg.casillas.forEach(function (c, i) {
      c.id = seg.id + i;
      c.seg = seg.id;
      c.idx = i;
      var sig;
      if (i < seg.casillas.length - 1) sig = [seg.id + (i + 1)];
      else sig = seg.siguiente.map(function (s) { return s + '0'; });
      c.sig = sig;
      CV.CASILLAS[c.id] = c;
    });
  });

  CV.ETIQUETAS = {
    pago: 'Día de pago', cobra: 'Cobrás', paga: 'Pagás', trabajo: 'Trabajo', impuestos: 'Impuestos',
    vida: 'Vida', bebe: 'Bebé', casarse: 'Casamiento', casa: 'Comprar casa', vendecasa: 'Vender / comprar casa',
    empleo: 'Buscando empleo', jubilacion: 'Jubilación', despedido: 'Despido', crisis: 'Crisis',
    escuela: 'Escuela nocturna', cambiosueldo: 'Cambio de sueldo', subebolsa: 'Sube la bolsa',
    desplome: 'Baja la bolsa', seguroauto: 'Auto', segurocasa: 'Casa', inicioCarrera: 'Carrera', inicioUni: 'Universidad'
  };

  CV.COLORES_AUTO = [
    { id: 'rojo', nombre: 'Frutilla', hex: '#E25A5A' },
    { id: 'azul', nombre: 'Cielo', hex: '#3E8FD8' },
    { id: 'verde', nombre: 'Menta', hex: '#3FAE73' },
    { id: 'amarillo', nombre: 'Girasol', hex: '#E9B323' },
    { id: 'violeta', nombre: 'Lavanda', hex: '#8C67CF' },
    { id: 'naranja', nombre: 'Mandarina', hex: '#EE8236' }
  ];

  CV.fmt = function (n) {
    var neg = n < 0; n = Math.abs(Math.round(n));
    var s = String(n), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (neg ? '-$' : '$') + s + out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
