/* La Carrera de la Vida — textos de ayuda en el momento y guía rápida */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};

  CV.Ayuda = {
    // Consejo que aparece en el panel según lo que toca hacer
    tips: {
      orden: 'Todos giran una vez. Quien saque el número más alto arranca, y después se sigue en orden.',
      inicio: 'La universidad te endeuda ($100.000) y tarda más, pero después elegís entre 3 carreras con título y mejores sueldos. Trabajar directamente es más rápido, pero la carrera y el sueldo salen al azar.',
      turno: 'Antes de girar podés comprar seguros, una acción de la bolsa o manejar tus préstamos. Si no necesitás nada, ¡girá!',
      girarDeNuevo: 'Después de una casilla roja (ALTO) o de elegir tu camino de inicio, volvés a girar en el mismo turno.',
      girarVenta: 'El número que saques define en cuánto vendés la casa: 1 a 3 precio bajo, 4 a 7 precio medio, 8 a 10 precio alto.',
      bifurcacion: 'El Camino de la familia es más largo y da más fichas de Vida. El del riesgo es más corto, con premios y golpes de plata más grandes.',
      elegirCarrera: 'Cada carrera tiene un poder especial y cobra cuando otros caen en sus casillas de Trabajo. El sueldo va a salir de un color de tu carrera.',
      elegirCasa: 'Pagás el precio al banco (si no te alcanza, se piden préstamos solos). El seguro protege tu casa de tormentas e inundaciones. Al venderla, la ruleta decide el precio.',
      venderCasa: 'Si vendés, girás la ruleta para ver a cuánto. Después podés comprar otra casa. Si no vendés, te la quedás.',
      escuela: 'Pagás $20.000, obtenés título y sacás 2 carreras: podés elegir una o quedarte con la tuya.',
      cambioSueldo: 'Podés cambiar tu tarjeta de sueldo con la de otro jugador, aunque el color no coincida con tu carrera. Es opcional.',
      jubilacion: 'Valle Tranquilo: ganás una ficha de Vida y nadie te puede sacar fichas. Lomas Millonarias: si al final sos quien más plata tiene entre los que viven ahí, te llevás 4 fichas extra; pero te pueden robar fichas si se acaba la pila.'
    },

    casilla: {
      pago: 'Casilla verde. Cobrás tu sueldo al caer o al pasar por acá.',
      cobra: 'Casilla naranja: es obligatoria. Cobrás del banco.',
      paga: 'Casilla naranja: es obligatoria. Pagás al banco.',
      trabajo: 'Casilla de Trabajo: le pagás al jugador que tiene esa carrera. Si la tenés vos, no pagás. Si nadie la tiene, pagás al banco.',
      impuestos: 'Pagás los impuestos que dice tu tarjeta de sueldo. Se los pagás al Contador/a; si no hay, al banco.',
      vida: 'Casilla de Vida: tomás una ficha de Vida. Su valor es secreto hasta el final de la partida.',
      bebe: 'Sumás hijos al auto y tomás una ficha de Vida.',
      casarse: 'ALTO: frenás acá aunque te sobren pasos. Sumás tu pareja al auto, tomás una ficha de Vida y volvés a girar.',
      casa: 'ALTO: sacás 2 títulos de propiedad y elegís si comprar uno. Después volvés a girar.',
      vendecasa: 'ALTO: podés vender tu casa (la ruleta define el precio) y comprar otra. Después volvés a girar.',
      empleo: 'ALTO: al salir de la universidad elegís una de 3 carreras y sacás tu sueldo. Después volvés a girar.',
      jubilacion: 'ALTO final: devolvés los préstamos, vendés tu casa y elegís dónde jubilarte.',
      despedido: 'Perdés tu carrera y tu sueldo: sacás una carrera nueva al azar.',
      crisis: 'Perdés tu carrera y tu sueldo: sacás una carrera nueva al azar.',
      escuela: 'Casilla azul (opcional): pagás $20.000 y podés cambiar de carrera.',
      cambiosueldo: 'Casilla azul (opcional): podés cambiar tu sueldo con el de otro jugador.',
      subebolsa: 'Recibís una acción gratis, aunque ya tengas una.',
      desplome: 'Si tenés acciones, devolvés una.',
      seguroauto: 'Si tenés seguro de auto, no pagás nada.',
      segurocasa: 'Si tenés casa y no está asegurada, pagás. Si no tenés casa, no pasa nada.',
      inicioCarrera: 'Salida para quienes empiezan a trabajar sin estudiar.',
      inicioUni: 'Salida de la universidad: pedís $100.000 prestados para estudiar.'
    },

    guia: [
      { ico: '🏁', tit: '¿De qué se trata?', txt: 'Recorrés la vida en tu auto: estudiás o trabajás, te casás, tenés hijos, comprás una casa y te jubilás. Gana quien termine con más plata sumando sus fichas de Vida.' },
      { ico: '🎡', tit: 'Girá y avanzá', txt: 'En tu turno girás la ruleta (tocala o usá el botón) y tu auto avanza esa cantidad de casillas. Siempre para adelante: ¡como en la vida, no se puede volver el tiempo atrás!' },
      { ico: '🎨', tit: 'Los colores importan', txt: 'Cada color de casilla significa algo distinto:', leyenda: true },
      { ico: '💼', tit: 'Carreras y sueldos', txt: 'Tu carrera te da un poder especial y cobrás cada vez que alguien cae en una casilla de tu Trabajo. Tu sueldo lo cobrás en cada Día de pago, ¡también cuando pasás por encima!' },
      { ico: '💖', tit: 'Fichas de Vida', txt: 'Representan logros y buenas acciones. Valen entre $50.000 y $250.000, pero nadie sabe cuánto hasta el final. ¡Juntá todas las que puedas!' },
      { ico: '🏦', tit: 'Préstamos, seguros y acciones', txt: 'Al empezar tu turno podés pedir préstamos de $20.000 (devolvés $25.000), asegurar el auto y la casa, o comprar una acción: cada vez que alguien saca tu número, cobrás $10.000.' },
      { ico: '🌅', tit: 'La jubilación', txt: 'Al llegar al final elegís Valle Tranquilo (seguro) o Lomas Millonarias (arriesgado). Cuando todos se jubilan, se dan vuelta las fichas de Vida y se cuenta la plata. ¡Que gane el mejor!' },
      { ico: '👆', tit: 'Ayudas en el juego', txt: 'Tocá cualquier casilla del tablero para ver qué hace. Arrastrá para mover el tablero y pellizcá o usá ＋/－ para hacer zoom. El cartel amarillo del panel te dice qué conviene hacer en cada momento.' }
    ],

    leyenda: [
      ['#F6A35B', '💸', 'Naranja: obligatoria, hacés lo que dice'],
      ['#5AA9E6', '🔄', 'Azul: opcional, decidís vos'],
      ['#5DBB7E', '💵', 'Verde: Día de pago, cobrás tu sueldo'],
      ['#E2615A', '🛑', 'Roja (ALTO): frenás aunque te sobren pasos'],
      ['#F6A35B', '💖', 'Vida: tomás una ficha de Vida'],
      ['#F6A35B', '🩺', 'Trabajo: le pagás a quien tiene esa carrera']
    ]
  };
})(window);
