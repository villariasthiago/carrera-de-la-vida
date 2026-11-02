/* La Carrera de la Vida — ruleta animada */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var NS = 'http://www.w3.org/2000/svg';
  var COLORES = ['#F6A35B', '#5AA9E6', '#5DBB7E', '#E46C9C', '#F2C230', '#8B6CC9', '#F28C7C', '#4FC1C0', '#A7C957', '#EFA0C8'];
  var cont, rueda, numEl, giro = 0, girando = false, alClic = null;

  function el(tag, at, padre) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) e.setAttribute(k, at[k]);
    if (padre) padre.appendChild(e);
    return e;
  }

  function init(contenedor, onClic) {
    cont = contenedor; alClic = onClic;
    cont.innerHTML = '';
    var svg = el('svg', { viewBox: '-110 -118 220 228' }, cont);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: 'rBrillo', cx: '40%', cy: '35%', r: '70%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.55' }, gr);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }, gr);
    var sh = el('filter', { id: 'rSombra', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feDropShadow', { dx: '0', dy: '4', stdDeviation: '4', 'flood-color': '#7a5a30', 'flood-opacity': '.25' }, sh);

    el('circle', { cx: 0, cy: 0, r: 104, fill: '#fff', filter: 'url(#rSombra)' }, svg);
    rueda = el('g', {}, svg);
    for (var i = 0; i < 10; i++) {
      var a0 = (i * 36 - 18 - 90) * Math.PI / 180, a1 = (i * 36 + 18 - 90) * Math.PI / 180;
      var r = 96;
      var d = 'M0 0 L' + (r * Math.cos(a0)).toFixed(2) + ' ' + (r * Math.sin(a0)).toFixed(2) +
        ' A' + r + ' ' + r + ' 0 0 1 ' + (r * Math.cos(a1)).toFixed(2) + ' ' + (r * Math.sin(a1)).toFixed(2) + ' Z';
      el('path', { d: d, fill: COLORES[i], stroke: '#fff', 'stroke-width': 2.5 }, rueda);
      var am = (i * 36 - 90) * Math.PI / 180;
      var t = el('text', {
        x: (70 * Math.cos(am)).toFixed(2), y: (70 * Math.sin(am)).toFixed(2), 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-family': 'Baloo 2, Nunito, sans-serif', 'font-weight': 800, 'font-size': 22, fill: '#fff',
        transform: 'rotate(' + (i * 36) + ' ' + (70 * Math.cos(am)).toFixed(2) + ' ' + (70 * Math.sin(am)).toFixed(2) + ')',
        style: 'paint-order:stroke;stroke:rgba(0,0,0,.12);stroke-width:3px'
      }, rueda);
      t.textContent = String(i + 1);
      // clavijas
      el('circle', { cx: (95 * Math.cos(a0)).toFixed(2), cy: (95 * Math.sin(a0)).toFixed(2), r: 3, fill: '#fff' }, rueda);
    }
    el('circle', { cx: 0, cy: 0, r: 96, fill: 'url(#rBrillo)', 'pointer-events': 'none' }, svg);
    el('circle', { cx: 0, cy: 0, r: 22, fill: '#fff', stroke: '#F3E2C4', 'stroke-width': 4 }, svg);
    var tx = el('text', { x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 18 }, svg);
    tx.textContent = '🚗';
    // flecha
    el('path', { d: 'M-13 -114 L13 -114 L0 -90 Z', fill: '#E2615A', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round', filter: 'url(#rSombra)' }, svg);
    numEl = document.createElement('div');
    numEl.className = 'numero-grande';
    cont.appendChild(numEl);
    svg.addEventListener('click', function () { if (!girando && alClic) alClic(); });
    poner(giro);
  }

  function poner(g) { rueda.setAttribute('transform', 'rotate(' + g.toFixed(2) + ')'); }
  function sector(g) { return Math.floor((((-g + 18) % 360) + 360) % 360 / 36); }

  // Gira hasta que quede el valor v bajo la flecha. Devuelve una promesa.
  function girar(v, opc) {
    opc = opc || {};
    var vel = opc.vel || 1;
    numEl.classList.remove('ver');
    cont.classList.remove('lista');
    return new Promise(function (ok) {
      girando = true;
      var ini = giro;
      var base = -(v - 1) * 36 + (Math.random() * 20 - 10);
      var vueltas = opc.trabada ? 2 : (3 + Math.floor(Math.random() * 2));
      var fin = ini + vueltas * 360 + ((((base - ini) % 360) + 360) % 360);
      var dur = (opc.trabada ? 1500 : 2700) * vel;
      var t0 = performance.now(), ultimo = sector(ini);
      function paso(ahora) {
        var t = Math.min(1, (ahora - t0) / dur);
        var e = opc.trabada ? (1 - Math.pow(1 - t, 2)) : (1 - Math.pow(1 - t, 4));
        giro = ini + (fin - ini) * e;
        poner(giro);
        var s = sector(giro);
        if (s !== ultimo) { ultimo = s; CV.Sonido.tocar('tick'); }
        if (t < 1) requestAnimationFrame(paso);
        else {
          giro = giro % 360;
          poner(giro);
          girando = false;
          if (opc.trabada) {
            cont.classList.add('trabada');
            CV.Sonido.tocar('trabada');
            setTimeout(function () { cont.classList.remove('trabada'); ok(); }, 1000);
          } else {
            numEl.textContent = v;
            numEl.style.background = COLORES[v - 1];
            numEl.classList.add('ver');
            CV.Sonido.tocar('clic');
            setTimeout(ok, 650 * vel);
          }
        }
      }
      requestAnimationFrame(paso);
    });
  }

  CV.Ruleta = {
    init: init,
    girar: girar,
    lista: function (si) { if (cont) { cont.classList.toggle('lista', !!si); if (si) numEl.classList.remove('ver'); } },
    ocultarNumero: function () { if (numEl) numEl.classList.remove('ver'); },
    girando: function () { return girando; },
    colores: COLORES
  };
})(window);
