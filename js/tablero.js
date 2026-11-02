/* La Carrera de la Vida — tablero ilustrado (SVG), autos y cámara */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var NS = 'http://www.w3.org/2000/svg';
  var W = 2000, H = 1560;

  // Recorridos de cada tramo del camino (coordenadas del tablero)
  var RUTAS = {
    car: 'M 205 380 L 800 380',
    u: 'M 150 300 C 150 170 230 125 350 125 L 700 125 C 800 125 840 190 840 300',
    m: 'M 845 380 L 1760 380 C 1915 380 1915 660 1760 660 L 240 660 C 85 660 85 940 240 940 L 640 940',
    f: 'M 640 940 C 700 940 700 1105 800 1105 L 1360 1105 C 1460 1105 1460 940 1520 940',
    r: 'M 640 940 L 1520 940',
    n: 'M 1520 940 L 1760 940 C 1915 940 1915 1240 1760 1240 L 390 1240'
  };
  var RETIRO = {
    valle: { x: 170, y: 1440, nombre: 'Valle Tranquilo' },
    lomas: { x: 650, y: 1450, nombre: 'Lomas Millonarias' }
  };
  var PLAZA = { x: 105, y: 380 };

  var COL = {
    naranja: '#F6A35B', naranjaO: '#D9823A',
    azul: '#5AA9E6', azulO: '#3B88C4',
    verde: '#5DBB7E', verdeO: '#3F9A5F',
    rojo: '#E2615A', rojoO: '#BE443E',
    violeta: '#9B7FD4', violetaO: '#7A5DB8'
  };
  var ICONOS = {
    pago: '💵', cobra: '💰', paga: '💸', impuestos: '🧾', vida: '💖', casarse: '💍', casa: '🏠', vendecasa: '🏘️',
    empleo: '💼', jubilacion: '🌅', despedido: '📦', crisis: '🌀', escuela: '🌙', cambiosueldo: '🔄',
    subebolsa: '📈', desplome: '📉', seguroauto: '🚗', segurocasa: '⛈️', inicioCarrera: '💼', inicioUni: '🎓'
  };

  var svg, capaAutos, vp, mundo;
  var pos = {};             // id de casilla -> {x, y, ang}
  var autos = [];           // elementos <g> de cada auto
  var autoPos = [];         // {x, y, ang} actual de cada auto
  var cam = { x: W / 2, y: H / 2, z: 0.4 }, camObj = { x: W / 2, y: H / 2, z: 0.4 };
  var camAnimando = false, siguiendo = -1, gestosListos = false;
  var onCasilla = null;

  function el(tag, at, padre) {
    var e = document.createElementNS(NS, tag);
    if (at) for (var k in at) e.setAttribute(k, at[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  function txt(padre, x, y, s, at) {
    var o = { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central' };
    for (var k in at) o[k] = at[k];
    var t = el('text', o, padre); t.textContent = s; return t;
  }

  /* ---------- Decoración ---------- */
  function arbol(g, x, y, s, tono) {
    s = s || 1;
    var a = el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')' }, g);
    el('ellipse', { cx: 2, cy: 26, rx: 20, ry: 6, fill: 'rgba(60,90,40,.18)' }, a);
    el('rect', { x: -4, y: 6, width: 8, height: 20, rx: 3, fill: '#A97B52' }, a);
    el('circle', { cx: 0, cy: -6, r: 20, fill: tono || '#6DBE6A' }, a);
    el('circle', { cx: -10, cy: 4, r: 13, fill: tono || '#6DBE6A' }, a);
    el('circle', { cx: 11, cy: 3, r: 14, fill: tono || '#6DBE6A' }, a);
    el('circle', { cx: -6, cy: -12, r: 8, fill: '#fff', opacity: .22 }, a);
  }
  function pino(g, x, y, s) {
    var a = el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')' }, g);
    el('ellipse', { cx: 2, cy: 24, rx: 15, ry: 5, fill: 'rgba(60,90,40,.18)' }, a);
    el('rect', { x: -3, y: 12, width: 6, height: 12, fill: '#9B6E46' }, a);
    el('path', { d: 'M0 -30 L18 0 L8 0 L22 16 L-22 16 L-8 0 L-18 0 Z', fill: '#4FA86B' }, a);
  }
  function flores(g, x, y, n, sem) {
    var cols = ['#F28DB2', '#F6C54B', '#FFFFFF', '#B79AE8', '#F4A06A'];
    for (var i = 0; i < n; i++) {
      var a = (i * 2.39996 + sem) % (Math.PI * 2), r = 6 + (i * 7) % 34;
      el('circle', { cx: (x + Math.cos(a) * r).toFixed(1), cy: (y + Math.sin(a) * r * 0.6).toFixed(1), r: 3.2, fill: cols[(i + sem) % cols.length] }, g);
    }
  }
  function nube(g, x, y, s) {
    var a = el('g', { class: 'nube-svg', style: 'animation-duration:' + (40 + (x % 30)) + 's' }, g);
    var b = el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')', opacity: .85 }, a);
    el('ellipse', { cx: 0, cy: 10, rx: 70, ry: 22, fill: '#fff' }, b);
    el('circle', { cx: -25, cy: 0, r: 26, fill: '#fff' }, b);
    el('circle', { cx: 12, cy: -8, r: 32, fill: '#fff' }, b);
    el('circle', { cx: 42, cy: 6, r: 20, fill: '#fff' }, b);
  }
  function montana(g, x, y, w, h, tono) {
    var a = el('g', {}, g);
    el('path', { d: 'M' + (x - w / 2) + ' ' + y + ' L' + x + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + ' Z', fill: tono }, a);
    el('path', { d: 'M' + x + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + ' L' + (x + w * 0.1) + ' ' + y + ' Z', fill: '#000', opacity: .08 }, a);
    var sx = w * 0.17, sy = h * 0.3;
    el('path', { d: 'M' + (x - sx) + ' ' + (y - h + sy) + ' L' + x + ' ' + (y - h) + ' L' + (x + sx) + ' ' + (y - h + sy) +
      ' L' + (x + sx * 0.4) + ' ' + (y - h + sy * 0.8) + ' L' + (x - sx * 0.1) + ' ' + (y - h + sy * 1.05) + ' L' + (x - sx * 0.5) + ' ' + (y - h + sy * 0.8) + ' Z', fill: '#fff' }, a);
  }
  function edificio(g, x, y, tipo) {
    var a = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, g);
    el('ellipse', { cx: 6, cy: 4, rx: 62, ry: 12, fill: 'rgba(60,90,40,.16)' }, a);
    if (tipo === 'uni') {
      el('rect', { x: -60, y: -60, width: 120, height: 62, rx: 6, fill: '#F7E9D2' }, a);
      el('path', { d: 'M-70 -58 L0 -98 L70 -58 Z', fill: '#C97A5A' }, a);
      for (var i = 0; i < 5; i++) el('rect', { x: -48 + i * 22, y: -52, width: 9, height: 46, rx: 3, fill: '#fff' }, a);
      el('rect', { x: -12, y: -26, width: 24, height: 28, rx: 10, fill: '#8B6CC9' }, a);
      txt(a, 0, -72, '🎓', { 'font-size': 20 });
    } else if (tipo === 'oficina') {
      el('rect', { x: -30, y: -110, width: 60, height: 112, rx: 6, fill: '#9CC9E8' }, a);
      el('rect', { x: 30, y: -70, width: 40, height: 72, rx: 6, fill: '#B9D9EF' }, a);
      for (var r = 0; r < 6; r++) for (var c = 0; c < 3; c++) el('rect', { x: -22 + c * 16, y: -100 + r * 16, width: 10, height: 9, rx: 2, fill: '#fff', opacity: .8 }, a);
      for (var r2 = 0; r2 < 3; r2++) el('rect', { x: 38, y: -60 + r2 * 18, width: 24, height: 9, rx: 2, fill: '#fff', opacity: .8 }, a);
    } else if (tipo === 'iglesia') {
      el('rect', { x: -38, y: -56, width: 76, height: 58, rx: 6, fill: '#FFFDF7' }, a);
      el('path', { d: 'M-46 -54 L0 -90 L46 -54 Z', fill: '#E8A9C4' }, a);
      el('rect', { x: -10, y: -118, width: 20, height: 40, fill: '#FFFDF7' }, a);
      el('path', { d: 'M-14 -116 L0 -136 L14 -116 Z', fill: '#E8A9C4' }, a);
      el('rect', { x: -12, y: -24, width: 24, height: 26, rx: 12, fill: '#C79AB0' }, a);
      txt(a, 0, -40, '💍', { 'font-size': 16 });
    } else if (tipo === 'banco') {
      el('rect', { x: -56, y: -56, width: 112, height: 58, fill: '#EEE6D8' }, a);
      el('path', { d: 'M-64 -54 L0 -86 L64 -54 Z', fill: '#B9A27E' }, a);
      for (var b = 0; b < 4; b++) el('rect', { x: -44 + b * 26, y: -50, width: 12, height: 50, fill: '#fff' }, a);
      txt(a, 0, -66, '🏦', { 'font-size': 18 });
    } else if (tipo === 'casa') {
      el('rect', { x: -40, y: -46, width: 80, height: 48, rx: 4, fill: '#FFE3C2' }, a);
      el('path', { d: 'M-50 -42 L0 -80 L50 -42 Z', fill: '#E2615A' }, a);
      el('rect', { x: -10, y: -24, width: 20, height: 26, rx: 3, fill: '#A97B52' }, a);
      el('rect', { x: -32, y: -34, width: 16, height: 14, rx: 2, fill: '#BFE2F7' }, a);
      el('rect', { x: 16, y: -34, width: 16, height: 14, rx: 2, fill: '#BFE2F7' }, a);
    } else if (tipo === 'hospital') {
      el('rect', { x: -52, y: -70, width: 104, height: 72, rx: 6, fill: '#FFFFFF' }, a);
      el('rect', { x: -10, y: -62, width: 20, height: 34, rx: 4, fill: '#E2615A' }, a);
      el('rect', { x: -22, y: -50, width: 44, height: 10, rx: 4, fill: '#E2615A' }, a);
      for (var h = 0; h < 4; h++) el('rect', { x: -44 + h * 24, y: -20, width: 14, height: 12, rx: 2, fill: '#BFE2F7' }, a);
    } else if (tipo === 'escuela') {
      el('rect', { x: -50, y: -52, width: 100, height: 54, rx: 5, fill: '#FFF0B8' }, a);
      el('path', { d: 'M-58 -50 L0 -78 L58 -50 Z', fill: '#5DBB7E' }, a);
      el('rect', { x: -2, y: -102, width: 3, height: 30, fill: '#7B7494' }, a);
      el('path', { d: 'M1 -102 L24 -96 L1 -90 Z', fill: '#4FA3D9' }, a);
      for (var e2 = 0; e2 < 3; e2++) el('rect', { x: -40 + e2 * 30, y: -36, width: 20, height: 16, rx: 2, fill: '#BFE2F7' }, a);
    }
  }
  function cartel(g, x, y, texto, color, tam) {
    tam = tam || 18;
    var a = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, g);
    var w = texto.length * tam * 0.56 + 26;
    el('rect', { x: -2, y: 0, width: 4, height: 34, fill: '#A97B52' }, a);
    el('rect', { x: -w / 2, y: -tam - 12, width: w, height: tam + 18, rx: 10, fill: '#fff', stroke: color, 'stroke-width': 3 }, a);
    txt(a, 0, -tam / 2 - 3, texto, { 'font-family': 'Baloo 2, Nunito, sans-serif', 'font-weight': 800, 'font-size': tam, fill: color });
    return a;
  }

  function dibujarFondo(g) {
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'gPasto', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#DDF0C6' }, lg);
    el('stop', { offset: '1', 'stop-color': '#C6E5AA' }, lg);
    var lgA = el('linearGradient', { id: 'gAgua', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#A9DDF5' }, lgA);
    el('stop', { offset: '1', 'stop-color': '#7CC4EA' }, lgA);

    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gPasto)' }, g);
    // manchones de pasto
    [[300, 520, 260, 70], [1100, 520, 300, 80], [700, 820, 340, 70], [1500, 820, 260, 60], [1150, 1400, 420, 90], [1700, 1420, 260, 80], [520, 260, 210, 60]].forEach(function (m) {
      el('ellipse', { cx: m[0], cy: m[1], rx: m[2], ry: m[3], fill: '#B7DC98', opacity: .5 }, g);
    });
    // montañas
    montana(g, 1250, 290, 300, 210, '#B7A9D9');
    montana(g, 1470, 300, 380, 270, '#A897D0');
    montana(g, 1700, 290, 300, 200, '#BBADDD');
    pino(g, 1110, 300, 1.1); pino(g, 1160, 312, 0.9); pino(g, 1840, 300, 1.1); pino(g, 1880, 290, 0.9);
    // río y lago
    el('path', { d: 'M1470 230 C 1450 290 1520 320 1490 380 C 1460 440 1520 470 1470 520', fill: 'none', stroke: '#8CCFF0', 'stroke-width': 36, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: 1420, cy: 545, rx: 160, ry: 62, fill: 'url(#gAgua)', stroke: '#fff', 'stroke-width': 5 }, g);
    el('ellipse', { cx: 1380, cy: 532, rx: 70, ry: 10, fill: '#fff', opacity: .5, class: 'agua-brillo' }, g);
    txt(g, 1520, 552, '🦆', { 'font-size': 22 });
    // lago grande abajo
    el('path', { d: 'M1000 1360 C 1080 1310 1330 1320 1420 1370 C 1500 1420 1430 1520 1260 1520 C 1080 1520 930 1430 1000 1360 Z', fill: 'url(#gAgua)', stroke: '#fff', 'stroke-width': 6 }, g);
    el('ellipse', { cx: 1200, cy: 1410, rx: 110, ry: 12, fill: '#fff', opacity: .45, class: 'agua-brillo' }, g);
    txt(g, 1300, 1450, '⛵', { 'font-size': 34 });
    // edificios
    edificio(g, 520, 285, 'uni');
    edificio(g, 470, 560, 'oficina');
    edificio(g, 1745, 560, 'iglesia');
    edificio(g, 900, 560, 'banco');
    edificio(g, 1070, 850, 'casa');
    edificio(g, 1080, 1060, 'escuela');
    edificio(g, 1620, 1105, 'hospital');
    // árboles
    [[720, 255, .9], [250, 545, .9], [650, 560, 1.1], [1150, 600, .8], [1640, 520, .9], [380, 830, 1], [560, 850, .8],
      [1350, 830, 1], [1660, 820, .9], [180, 1070, 1.1], [330, 1080, .9], [880, 1360, 1], [1580, 1380, 1.1], [1820, 1360, .9],
      [1900, 1480, 1], [1780, 760, .8], [60, 560, .9], [60, 800, .9], [1950, 1050, .9], [1960, 200, 1], [880, 230, .8], [1050, 210, .9]
    ].forEach(function (t, i) { arbol(g, t[0], t[1], t[2], ['#6DBE6A', '#7CC77A', '#5CB16A', '#8FCB6E'][i % 4]); });
    [[340, 520], [760, 820], [1250, 800], [960, 1190], [1450, 1180], [250, 1180], [1700, 1500], [600, 210], [1200, 1180]].forEach(function (f, i) { flores(g, f[0], f[1], 14, i * 3); });
    // plaza de largada
    el('circle', { cx: PLAZA.x, cy: PLAZA.y, r: 88, fill: '#F7EBD6', stroke: '#fff', 'stroke-width': 6 }, g);
    el('circle', { cx: PLAZA.x, cy: PLAZA.y, r: 70, fill: 'none', stroke: '#EAD7B5', 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
    // nubes
    nube(g, 260, 60, 1); nube(g, 1100, 70, 1.2); nube(g, 1780, 110, .9); nube(g, 820, 1520, 1);
  }

  function dibujarRutas(g) {
    // borde, asfalto claro y línea central
    Object.keys(RUTAS).forEach(function (k) {
      el('path', { d: RUTAS[k], fill: 'none', stroke: '#E3CFA9', 'stroke-width': 92, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    });
    Object.keys(RUTAS).forEach(function (k) {
      el('path', { d: RUTAS[k], fill: 'none', stroke: '#F6EAD3', 'stroke-width': 80, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    });
    // caminos a la jubilación
    el('path', { d: 'M390 1240 C 300 1300 230 1340 190 1400', fill: 'none', stroke: '#F6EAD3', 'stroke-width': 44, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M390 1240 C 470 1300 560 1340 620 1410', fill: 'none', stroke: '#F6EAD3', 'stroke-width': 44, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M390 1240 C 300 1300 230 1340 190 1400', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '10 12' }, g);
    el('path', { d: 'M390 1240 C 470 1300 560 1340 620 1410', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '10 12' }, g);
    // puente sobre el río
    el('rect', { x: 1418, y: 328, width: 110, height: 104, rx: 10, fill: '#D9B48A', stroke: '#fff', 'stroke-width': 4 }, g);
    for (var i = 0; i < 6; i++) el('rect', { x: 1424 + i * 17, y: 334, width: 11, height: 92, rx: 3, fill: '#C9A074' }, g);
    // carriles de la bifurcación (se resaltan al elegir)
    el('path', { d: RUTAS.f, fill: 'none', stroke: '#F28DB2', 'stroke-width': 86, opacity: 0, 'stroke-linecap': 'round', id: 'carril-f' }, g);
    el('path', { d: RUTAS.r, fill: 'none', stroke: '#F6A35B', 'stroke-width': 86, opacity: 0, 'stroke-linecap': 'round', id: 'carril-r' }, g);
  }

  function zonasRetiro(g) {
    var v = RETIRO.valle, l = RETIRO.lomas;
    el('ellipse', { cx: v.x, cy: v.y + 10, rx: 150, ry: 80, fill: '#CFEBC0', stroke: '#fff', 'stroke-width': 6 }, g);
    for (var i = 0; i < 5; i++) arbol(g, v.x - 120 + i * 60, v.y + 60 + (i % 2) * 14, .7, '#6DBE6A');
    cartel(g, v.x, v.y - 70, '🌳 Valle Tranquilo', '#3E9A5F', 20);
    el('ellipse', { cx: l.x, cy: l.y + 10, rx: 170, ry: 82, fill: '#FFF0C2', stroke: '#fff', 'stroke-width': 6 }, g);
    el('path', { d: 'M' + (l.x + 90) + ' ' + (l.y + 30) + ' l40 -50 l40 50 Z', fill: '#E8D58A' }, g);
    txt(g, l.x + 130, l.y + 52, '🏛️', { 'font-size': 26 });
    cartel(g, l.x, l.y - 74, '💎 Lomas Millonarias', '#C08A12', 20);
    // pila de fichas de Lomas
    var pf = el('g', { id: 'pila-lomas', transform: 'translate(' + (l.x - 130) + ' ' + (l.y + 40) + ')' }, g);
    for (var k = 0; k < 4; k++) {
      el('circle', { cx: k * 4, cy: -k * 5, r: 20, fill: '#E46C9C', stroke: '#fff', 'stroke-width': 3 }, pf);
    }
    txt(pf, 12, -16, '💖', { 'font-size': 16 });
  }

  function dibujarCasillas(g, capaCart) {
    var medidor = el('path', { d: '', fill: 'none' }, svg);
    CV.SEGMENTOS.forEach(function (seg) {
      medidor.setAttribute('d', RUTAS[seg.id]);
      var L = medidor.getTotalLength(), n = seg.casillas.length;
      seg.casillas.forEach(function (c, i) {
        var l = (seg.id === 'f' || seg.id === 'r') ? L * (i + 1) / (n + 1) : L * (i + 0.5) / n;
        var p = medidor.getPointAtLength(l);
        var p2 = medidor.getPointAtLength(Math.min(L, l + 2)), p1 = medidor.getPointAtLength(Math.max(0, l - 2));
        pos[c.id] = { x: p.x, y: p.y, ang: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI };
      });
    });
    medidor.remove();

    Object.keys(CV.CASILLAS).forEach(function (id) {
      var c = CV.CASILLAS[id], p = pos[id];
      var gg = el('g', { class: 'casilla-g', 'data-id': id, transform: 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')' }, g);
      var roja = !!CV.ROJAS[c.t];
      var color, oscuro;
      if (roja) { color = COL.rojo; oscuro = COL.rojoO; }
      else if (c.t === 'pago') { color = COL.verde; oscuro = COL.verdeO; }
      else if (c.t === 'escuela' || c.t === 'cambiosueldo') { color = COL.azul; oscuro = COL.azulO; }
      else if (c.t === 'inicioCarrera' || c.t === 'inicioUni') { color = COL.violeta; oscuro = COL.violetaO; }
      else { color = COL.naranja; oscuro = COL.naranjaO; }
      el('circle', { r: 44, class: 'resalte', fill: 'none', stroke: '#fff', 'stroke-width': 8 }, gg);
      if (roja) {
        var pts = [];
        for (var k = 0; k < 8; k++) { var a = (k * 45 + 22.5) * Math.PI / 180; pts.push((38 * Math.cos(a)).toFixed(1) + ',' + (38 * Math.sin(a)).toFixed(1)); }
        var sombra = pts.map(function (q) { var xy = q.split(','); return xy[0] + ',' + (+xy[1] + 5); });
        el('polygon', { points: sombra.join(' '), fill: oscuro }, gg);
        el('polygon', { points: pts.join(' '), fill: color, stroke: '#fff', 'stroke-width': 4 }, gg);
        txt(gg, 0, -9, ICONOS[c.t], { 'font-size': 26 });
        txt(gg, 0, 19, 'ALTO', { 'font-family': 'Baloo 2, Nunito, sans-serif', 'font-weight': 800, 'font-size': 14, fill: '#fff', 'letter-spacing': 1 });
      } else {
        el('rect', { x: -29, y: -25, width: 58, height: 58, rx: 15, fill: oscuro }, gg);
        el('rect', { x: -29, y: -29, width: 58, height: 58, rx: 15, fill: color, stroke: '#fff', 'stroke-width': 3.5 }, gg);
        var ico = c.t === 'trabajo' ? CV.carrera(c.carrera).icono : (c.t === 'bebe' ? (c.hijos.length > 1 ? '👶' : (c.hijos[0] === 'f' ? '👧' : '👦')) : ICONOS[c.t]);
        txt(gg, 0, -7, ico, { 'font-size': 23 });
        var etq = '';
        if (c.t === 'pago') etq = 'PAGO';
        else if (c.monto && c.t !== 'escuela') etq = (c.t === 'cobra' ? '+' : '') + CV.fmt(c.monto).replace('.000', 'k').replace('$', '$');
        else if (c.t === 'vida' || c.t === 'bebe') etq = 'VIDA';
        else if (c.t === 'impuestos') etq = 'IMPUESTOS';
        else if (c.t === 'escuela') etq = '$20k';
        else if (c.t === 'cambiosueldo') etq = 'SUELDO';
        else if (c.t === 'subebolsa') etq = 'SUBE';
        else if (c.t === 'desplome') etq = 'BAJA';
        else if (c.t === 'despedido') etq = 'DESPIDO';
        else if (c.t === 'crisis') etq = 'CRISIS';
        else if (c.t === 'inicioCarrera') etq = 'TRABAJO';
        else if (c.t === 'inicioUni') etq = 'FACU';
        txt(gg, 0, 17, etq, { 'font-family': 'Nunito, sans-serif', 'font-weight': 800, 'font-size': etq.length > 7 ? 8.2 : (etq.length > 5 ? 9.6 : 11.5), fill: '#fff' });
        if (c.t === 'trabajo') {
          var car = CV.carrera(c.carrera);
          el('circle', { cx: 23, cy: -23, r: 8, fill: CV.COLORES[car.colores[0]].hex, stroke: '#fff', 'stroke-width': 2.5 }, gg);
        }
      }
      gg.addEventListener('click', function (e) { if (onCasilla) onCasilla(id, e); });
    });

    // Carteles
    cartel(capaCart, 330, 300, '🎓 Universidad', '#7A5DB8', 17);
    cartel(capaCart, 470, 455, '💼 A trabajar', '#7A5DB8', 17);
    cartel(capaCart, 105, 510, '🏁 Largada', '#E2615A', 20);
    cartel(capaCart, 560, 1050, '👨‍👩‍👧 Familia', '#C04F7E', 17);
    cartel(capaCart, 880, 852, '⚡ Riesgo', '#D9823A', 17);
    cartel(capaCart, 390, 1160, '🌅 Jubilación', '#BE443E', 17);
  }

  /* ---------- Autos ---------- */
  function crearAuto(color) {
    var g = el('g', { class: 'auto' });
    var cuerpo = el('g', { class: 'auto-cuerpo' }, g);
    el('ellipse', { cx: 3, cy: 6, rx: 30, ry: 16, fill: 'rgba(40,30,20,.22)' }, cuerpo);
    [[-19, -19], [10, -19], [-19, 15], [10, 15]].forEach(function (r) {
      el('rect', { x: r[0], y: r[1], width: 12, height: 5, rx: 2, fill: '#4A4458' }, cuerpo);
    });
    el('rect', { x: -28, y: -16, width: 56, height: 32, rx: 13, fill: color, stroke: '#fff', 'stroke-width': 3 }, cuerpo);
    el('rect', { x: 7, y: -12, width: 11, height: 24, rx: 4, fill: '#E6F4FF', opacity: .95 }, cuerpo);
    el('circle', { cx: 25, cy: -9, r: 3, fill: '#FFF2B0' }, cuerpo);
    el('circle', { cx: 25, cy: 9, r: 3, fill: '#FFF2B0' }, cuerpo);
    el('g', { class: 'clavijas' }, cuerpo);
    var anillo = el('circle', { r: 40, fill: 'none', stroke: color, 'stroke-width': 5, opacity: 0, class: 'anillo' }, g);
    anillo.style.transition = 'opacity .4s';
    return g;
  }
  function clavijas(p, j) {
    var g = autos[p] && autos[p].querySelector('.clavijas');
    if (!g) return;
    g.innerHTML = '';
    var gente = [{ c: '#FFFFFF' }];
    if (j.pareja) gente.push({ c: '#C9B6EE' });
    j.hijos.forEach(function (h) { gente.push({ c: h === 'f' ? '#F7A1C4' : '#7FC3EE' }); });
    var lugares = [[-1, -6.5], [-1, 6.5], [-11, -6.5], [-11, 6.5], [-21, -6.5], [-21, 6.5]];
    gente.slice(0, 6).forEach(function (q, i) {
      el('circle', { cx: lugares[i][0], cy: lugares[i][1], r: 4.6, fill: q.c, stroke: 'rgba(0,0,0,.18)', 'stroke-width': 1.2 }, g);
    });
    if (gente.length > 6) txt(g, -10, 0, '+' + (gente.length - 6), { 'font-size': 9, 'font-weight': 800, fill: '#fff' });
  }
  function ponerAuto(p, x, y, ang) {
    autoPos[p] = { x: x, y: y, ang: ang };
    autos[p].setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
  }
  function lugarDe(s, p) {
    var j = s.jugadores[p];
    if (j.jubilado) {
      var r = RETIRO[j.jubilado], k = 0;
      for (var i = 0; i < p; i++) if (s.jugadores[i].jubilado === j.jubilado) k++;
      return { x: r.x - 70 + (k % 3) * 70, y: r.y + 4 + Math.floor(k / 3) * 40, ang: 0 };
    }
    if (j.pos === null) {
      var a = (p / s.jugadores.length) * Math.PI * 2 - Math.PI / 2;
      return { x: PLAZA.x + Math.cos(a) * 46, y: PLAZA.y + Math.sin(a) * 46, ang: 0 };
    }
    var q = pos[j.pos], mismo = [];
    s.jugadores.forEach(function (o, i) { if (!o.jubilado && o.pos === j.pos) mismo.push(i); });
    var idx = mismo.indexOf(p), off = (idx - (mismo.length - 1) / 2) * 22;
    var rad = (q.ang + 90) * Math.PI / 180;
    return { x: q.x + Math.cos(rad) * off, y: q.y + Math.sin(rad) * off, ang: angAuto(q.ang) };
  }
  function angAuto(a) { return a; }

  function sincronizar(s) {
    s.jugadores.forEach(function (j, p) {
      if (!autos[p]) return;
      var l = lugarDe(s, p);
      ponerAuto(p, l.x, l.y, l.ang);
      clavijas(p, j);
    });
  }
  function activo(p) {
    autos.forEach(function (a, i) {
      var an = a.querySelector('.anillo');
      an.setAttribute('opacity', i === p ? '.55' : '0');
      if (i === p) capaAutos.appendChild(a);
    });
  }

  function suav(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function difAng(a, b) { var d = ((b - a) % 360 + 540) % 360 - 180; return d; }

  // Anima el auto por las casillas del camino
  function moverAuto(s, p, camino, vel) {
    vel = vel || 1;
    return new Promise(function (ok) {
      var i = 0;
      capaAutos.appendChild(autos[p]);
      siguiendo = p;
      function salto() {
        if (i >= camino.length) { siguiendo = -1; ok(); return; }
        var desde = autoPos[p];
        var q = pos[camino[i]];
        var hacia = { x: q.x, y: q.y };
        var angObj = Math.atan2(hacia.y - desde.y, hacia.x - desde.x) * 180 / Math.PI;
        if (Math.hypot(hacia.x - desde.x, hacia.y - desde.y) < 2) angObj = q.ang;
        var dur = 300 * vel, t0 = performance.now();
        var cuerpo = autos[p].querySelector('.auto-cuerpo');
        CV.Sonido.tocar('paso', i);
        function frame(ahora) {
          var t = Math.min(1, (ahora - t0) / dur), e = suav(t);
          var x = desde.x + (hacia.x - desde.x) * e, y = desde.y + (hacia.y - desde.y) * e;
          var ang = desde.ang + difAng(desde.ang, angObj) * Math.min(1, t * 2.2);
          ponerAuto(p, x, y, ang);
          var sc = 1 + Math.sin(t * Math.PI) * 0.14;
          cuerpo.setAttribute('transform', 'scale(' + sc.toFixed(3) + ')');
          enfocar(x, y, null, true);
          if (t < 1) requestAnimationFrame(frame);
          else { autoPos[p].ang = ang; i++; salto(); }
        }
        requestAnimationFrame(frame);
      }
      salto();
    });
  }
  // Movimiento libre (a la plaza de jubilación)
  function deslizarAuto(p, destino, vel) {
    return new Promise(function (ok) {
      var desde = autoPos[p], t0 = performance.now(), dur = 900 * (vel || 1);
      function frame(ahora) {
        var t = Math.min(1, (ahora - t0) / dur), e = suav(t);
        var x = desde.x + (destino.x - desde.x) * e, y = desde.y + (destino.y - desde.y) * e;
        ponerAuto(p, x, y, desde.ang + difAng(desde.ang, 0) * e);
        enfocar(x, y, null, true);
        if (t < 1) requestAnimationFrame(frame); else ok();
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Cámara ---------- */
  function zFit() {
    var r = vp.getBoundingClientRect();
    return Math.min(r.width / W, r.height / H) * 0.98;
  }
  function zSeguir() {
    var r = vp.getBoundingClientRect();
    return Math.max(zFit() * 1.9, Math.min(1, Math.min(r.width, r.height) / 900));
  }
  function limitar(c) {
    var r = vp.getBoundingClientRect();
    var zMin = zFit() * 0.9, zMax = 2.2;
    c.z = Math.max(zMin, Math.min(zMax, c.z));
    var mx = r.width / 2 / c.z, my = r.height / 2 / c.z;
    if (W * c.z <= r.width) c.x = W / 2; else c.x = Math.max(mx - 60, Math.min(W - mx + 60, c.x));
    if (H * c.z <= r.height) c.y = H / 2; else c.y = Math.max(my - 60, Math.min(H - my + 60, c.y));
  }
  function aplicarCam() {
    var r = vp.getBoundingClientRect();
    var tx = r.width / 2 - cam.x * cam.z, ty = r.height / 2 - cam.y * cam.z;
    mundo.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + cam.z.toFixed(4) + ')';
  }
  function bucleCam() {
    if (camAnimando) return;
    camAnimando = true;
    function f() {
      var k = 0.14;
      cam.x += (camObj.x - cam.x) * k; cam.y += (camObj.y - cam.y) * k; cam.z += (camObj.z - cam.z) * k;
      aplicarCam();
      if (Math.abs(camObj.x - cam.x) > 0.3 || Math.abs(camObj.y - cam.y) > 0.3 || Math.abs(camObj.z - cam.z) > 0.0005) requestAnimationFrame(f);
      else { cam.x = camObj.x; cam.y = camObj.y; cam.z = camObj.z; aplicarCam(); camAnimando = false; }
    }
    requestAnimationFrame(f);
  }
  function enfocar(x, y, z, suave) {
    camObj.x = x; camObj.y = y;
    if (z) camObj.z = z;
    else if (camObj.z < zSeguir() * 0.8) camObj.z = zSeguir();
    limitar(camObj);
    if (suave === false) { cam.x = camObj.x; cam.y = camObj.y; cam.z = camObj.z; aplicarCam(); }
    else bucleCam();
  }
  function verTodo(inst) {
    camObj.x = W / 2; camObj.y = H / 2; camObj.z = zFit();
    if (inst) { cam.x = camObj.x; cam.y = camObj.y; cam.z = camObj.z; aplicarCam(); } else bucleCam();
  }
  function seguirJugador(p, z) {
    if (!autoPos[p]) return;
    enfocar(autoPos[p].x, autoPos[p].y, z || zSeguir());
  }
  function zoom(f, cx, cy) {
    var r = vp.getBoundingClientRect();
    if (cx === undefined) { cx = r.width / 2; cy = r.height / 2; }
    // punto del tablero bajo el cursor
    var bx = cam.x + (cx - r.width / 2) / cam.z, by = cam.y + (cy - r.height / 2) / cam.z;
    var nz = Math.max(zFit() * 0.9, Math.min(2.2, cam.z * f));
    cam.z = nz;
    cam.x = bx - (cx - r.width / 2) / nz; cam.y = by - (cy - r.height / 2) / nz;
    limitar(cam);
    camObj.x = cam.x; camObj.y = cam.y; camObj.z = cam.z;
    aplicarCam();
  }

  function gestos() {
    var punteros = {}, ultimo = null, distIni = 0, zIni = 0, movido = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zoom-botones')) return;
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      vp.setPointerCapture(e.pointerId);
      movido = 0;
      var ids = Object.keys(punteros);
      if (ids.length === 2) {
        var a = punteros[ids[0]], b = punteros[ids[1]];
        distIni = Math.hypot(a.x - b.x, a.y - b.y); zIni = cam.z;
      }
      ultimo = { x: e.clientX, y: e.clientY };
    });
    vp.addEventListener('pointermove', function (e) {
      if (!punteros[e.pointerId]) return;
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(punteros);
      if (ids.length === 2) {
        var a = punteros[ids[0]], b = punteros[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        var r = vp.getBoundingClientRect();
        zoom((zIni * d / distIni) / cam.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        movido += 10;
      } else if (ultimo) {
        var dx = e.clientX - ultimo.x, dy = e.clientY - ultimo.y;
        movido += Math.abs(dx) + Math.abs(dy);
        cam.x -= dx / cam.z; cam.y -= dy / cam.z;
        limitar(cam);
        camObj.x = cam.x; camObj.y = cam.y; camObj.z = cam.z;
        aplicarCam();
        ultimo = { x: e.clientX, y: e.clientY };
      }
    });
    function fin(e) {
      delete punteros[e.pointerId];
      var ids = Object.keys(punteros);
      ultimo = ids.length ? { x: punteros[ids[0]].x, y: punteros[ids[0]].y } : null;
    }
    vp.addEventListener('pointerup', fin);
    vp.addEventListener('pointercancel', fin);
    vp.addEventListener('click', function (e) { if (movido > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
    vp.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = vp.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    window.addEventListener('resize', function () { limitar(camObj); limitar(cam); aplicarCam(); });
  }

  /* ---------- Creación ---------- */
  function crear(vpEl, mundoEl, alTocarCasilla) {
    vp = vpEl; mundo = mundoEl; onCasilla = alTocarCasilla;
    mundo.innerHTML = '';
    svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'font-family': 'Nunito, sans-serif' });
    mundo.appendChild(svg);
    var fondo = el('g', {}, svg);
    dibujarFondo(fondo);
    var rutas = el('g', {}, svg);
    dibujarRutas(rutas);
    zonasRetiro(el('g', {}, svg));
    var casillas = el('g', {}, svg);
    var carteles = el('g', {}, svg);
    dibujarCasillas(casillas, carteles);
    capaAutos = el('g', {}, svg);
    if (!gestosListos) { gestos(); gestosListos = true; }
    verTodo(true);
  }
  function crearAutos(s) {
    capaAutos.innerHTML = '';
    autos = []; autoPos = [];
    s.jugadores.forEach(function (j, p) {
      var a = crearAuto(j.color);
      capaAutos.appendChild(a);
      autos[p] = a;
    });
    sincronizar(s);
  }
  function marcarCarriles(si) {
    ['carril-f', 'carril-r'].forEach(function (id) {
      var e = svg.getElementById ? svg.getElementById(id) : document.getElementById(id);
      if (!e) return;
      e.setAttribute('opacity', si ? '.55' : '0');
      e.classList.toggle('carril-opcion', !!si);
    });
    if (si) enfocar(1080, 1000, zFit() * 1.6);
  }
  function marcarCasilla(id, si) {
    var g = svg.querySelector('.casilla-g[data-id="' + id + '"]');
    if (g) g.classList.toggle('destino', !!si);
  }
  function pantallaDe(x, y) {
    var r = vp.getBoundingClientRect();
    return { x: r.left + r.width / 2 + (x - cam.x) * cam.z, y: r.top + r.height / 2 + (y - cam.y) * cam.z };
  }

  CV.Tablero = {
    crear: crear,
    crearAutos: crearAutos,
    sincronizar: sincronizar,
    moverAuto: moverAuto,
    deslizarAuto: deslizarAuto,
    lugarDe: lugarDe,
    activo: activo,
    verTodo: verTodo,
    seguirJugador: seguirJugador,
    enfocar: enfocar,
    zoom: zoom,
    marcarCarriles: marcarCarriles,
    marcarCasilla: marcarCasilla,
    clavijas: clavijas,
    pantallaDeAuto: function (p) { var a = autoPos[p]; return a ? pantallaDe(a.x, a.y) : null; },
    pos: pos,
    iconos: ICONOS,
    colorCasilla: function (c) {
      if (CV.ROJAS[c.t]) return COL.rojo;
      if (c.t === 'pago') return COL.verde;
      if (c.t === 'escuela' || c.t === 'cambiosueldo') return COL.azul;
      if (c.t === 'inicioCarrera' || c.t === 'inicioUni') return COL.violeta;
      return COL.naranja;
    },
    iconoCasilla: function (c) {
      if (c.t === 'trabajo') return CV.carrera(c.carrera).icono;
      if (c.t === 'bebe') return c.hijos.length > 1 ? '👶' : (c.hijos[0] === 'f' ? '👧' : '👦');
      return ICONOS[c.t];
    }
  };
})(window);
