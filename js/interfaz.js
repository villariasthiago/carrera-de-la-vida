/* La Carrera de la Vida — interfaz de juego: panel, cartas, animaciones de eventos */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var fmt = function (n) { return CV.fmt(n); };

  var opts = {};            // { esLocal(p), enviar(acc), manejaBots, alSalir, modo }
  var estado = null;        // último estado completo recibido
  var vista = null;         // copia que se va actualizando mientras se reproducen eventos
  var cola = Promise.resolve();
  var reproduciendo = 0;
  var enviado = false;
  var botTimer = null;
  var vel = 1;
  var modalAbierto = null;  // tipo de modal abierto
  var ultimoPend = '';

  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ================= Avisos, banners, confeti ================= */
  function aviso(txt, tono) {
    var cont = $('#avisos');
    var a = h('<div class="aviso ' + (tono || 'info') + '">' + esc(txt) + '</div>');
    cont.appendChild(a);
    while (cont.children.length > 3) cont.removeChild(cont.firstChild);
    setTimeout(function () { a.classList.add('sale'); setTimeout(function () { a.remove(); }, 400); }, 3800 * Math.max(vel, 0.7));
  }
  function banner(ico, tit, sub, color, dur) {
    var b = $('#banner');
    b.innerHTML = '<div class="b-caja" style="--bc:' + (color || '#F39A4A') + '"><div class="b-ico">' + ico + '</div><div class="b-tit">' + esc(tit) + '</div>' + (sub ? '<div class="b-sub">' + esc(sub) + '</div>' : '') + '</div>';
    b.classList.remove('ver'); void b.offsetWidth;
    b.style.animationDuration = ((dur || 1600) / 1000) + 's';
    b.classList.add('ver');
  }
  var confeti = (function () {
    var cv, cx, parts = [], corriendo = false;
    var cols = ['#F6A35B', '#5AA9E6', '#5DBB7E', '#E46C9C', '#F2C230', '#8B6CC9', '#FFFFFF'];
    function lanzar(n, x, y) {
      cv = cv || $('#confeti'); cx = cx || cv.getContext('2d');
      cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
      x = x === undefined ? innerWidth / 2 : x; y = y === undefined ? innerHeight * 0.4 : y;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: 4 + Math.random() * 5, c: cols[i % cols.length], g: Math.random() * 6, vr: Math.random() * 0.3 - 0.15, vida: 0, f: Math.random() < 0.5 });
      }
      if (!corriendo) { corriendo = true; requestAnimationFrame(paso); }
    }
    function paso() {
      cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      cx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(function (p) { return p.vida < 160 && p.y < innerHeight + 30; });
      parts.forEach(function (p) {
        p.vida++; p.vy += 0.25; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.g += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.g);
        cx.globalAlpha = Math.max(0, 1 - p.vida / 160);
        cx.fillStyle = p.c;
        if (p.f) cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { cx.beginPath(); cx.arc(0, 0, p.r * 0.7, 0, 7); cx.fill(); }
        cx.restore();
      });
      if (parts.length) requestAnimationFrame(paso);
      else { corriendo = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    return lanzar;
  })();
  function flotar(texto, x, y, mas) {
    var f = h('<div class="flota ' + (mas ? 'mas' : 'menos') + '">' + esc(texto) + '</div>');
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1600);
  }

  /* ================= Cartas (HTML) ================= */
  function gradiente(cols) {
    var hx = cols.map(function (c) { return CV.COLORES[c].hex; });
    return hx.length > 1 ? 'linear-gradient(135deg,' + hx.join(',') + ')' : hx[0];
  }
  function cartaCarrera(id, extra) {
    var c = CV.carrera(id);
    return '<div class="carta' + (extra ? ' elegible' : '') + '" data-id="' + id + '">' +
      '<div class="carta-cab" style="background:' + gradiente(c.colores) + '"><div class="cc-tipo">Carrera</div><div class="cc-ico">' + c.icono + '</div><div class="cc-nom">' + esc(c.nombre) + '</div></div>' +
      '<div class="franjas">' + c.colores.map(function (k) { return '<i style="background:' + CV.COLORES[k].hex + '"></i>'; }).join('') + '</div>' +
      '<div class="carta-cuerpo">' + (c.titulo ? '<span class="titulo-req">🎓 Requiere título</span>' : '') +
      '<div><b>Sueldo de color:</b> ' + c.colores.map(function (k) { return CV.COLORES[k].nombre; }).join(' o ') + '</div>' +
      '<div><b>Especial:</b> ' + esc(c.especial) + '</div>' + (extra || '') + '</div></div>';
  }
  function cartaSueldo(id) {
    var s = CV.sueldo(id);
    return '<div class="carta"><div class="carta-cab" style="background:' + CV.COLORES[s.color].hex + '"><div class="cc-tipo">Tarjeta de sueldo</div><div class="cc-ico">' + (s.color === 'amarillo' ? '⭐' : '💵') + '</div><div class="cc-nom">' + CV.COLORES[s.color].nombre + '</div></div>' +
      '<div class="carta-cuerpo"><div>Cobrás en cada Día de pago:</div><div class="monto">' + fmt(s.monto) + '</div><div>Impuestos: <b>' + fmt(s.impuesto) + '</b></div></div></div>';
  }
  function cartaCasa(id, extra) {
    var c = CV.casa(id);
    return '<div class="carta casa' + (extra ? ' elegible' : '') + '" data-id="' + id + '">' +
      '<div class="carta-cab" style="background:' + c.tono + ';color:#3C3456"><div class="cc-tipo">Título de propiedad</div><div class="cc-ico">' + c.icono + '</div><div class="cc-nom">' + esc(c.nombre) + '</div></div>' +
      '<div class="carta-cuerpo"><div>Precio: <b>' + fmt(c.precio) + '</b></div><div>Seguro: <b>' + fmt(c.seguro) + '</b></div>' +
      '<div>Si la vendés, según la ruleta:</div><div class="tabla-venta"><span>1 a 3<b>' + fmt(c.venta[0]) + '</b></span><span>4 a 7<b>' + fmt(c.venta[1]) + '</b></span><span>8 a 10<b>' + fmt(c.venta[2]) + '</b></span></div>' +
      (extra || '') + '</div></div>';
  }
  function cartaSimple(ico, tipo, nom, color, cuerpo) {
    return '<div class="carta"><div class="carta-cab" style="background:' + color + '"><div class="cc-tipo">' + tipo + '</div><div class="cc-ico">' + ico + '</div><div class="cc-nom">' + esc(nom) + '</div></div><div class="carta-cuerpo">' + (cuerpo || '') + '</div></div>';
  }
  function htmlCarta(ev) {
    switch (ev.tipo) {
      case 'carrera': return cartaCarrera(ev.id);
      case 'verano': return cartaSimple(CV.carrera(ev.id).icono, 'Trabajo de verano', CV.carrera(ev.id).nombre, gradiente(CV.carrera(ev.id).colores), 'Cobrás sus casillas de Trabajo.');
      case 'sueldo': return cartaSueldo(ev.id);
      case 'casa': return cartaCasa(ev.id);
      case 'accion': return cartaSimple('📈', 'Valores de la bolsa', 'Acción N.º ' + ev.id, '#8B6CC9', 'Cada vez que alguien saque un <b>' + ev.id + '</b>, cobrás $10.000.');
      case 'seguroAuto': return cartaSimple('🚗', 'Póliza', 'Seguro de auto', '#4FA3D9', 'Tu auto queda protegido contra choques y robos.');
      case 'seguroCasa': return cartaSimple('🛡️', 'Póliza', 'Seguro de casa', '#5DBB7E', 'Tu casa queda protegida contra tormentas e inundaciones.');
    }
    return '';
  }
  function mostrarCartaVolando(html) {
    var r = $('#tablero-vp').getBoundingClientRect();
    var c = h('<div class="carta-mini">' + html + '</div>');
    c.style.left = (r.left + r.width / 2 - 90) + 'px';
    c.style.top = (r.top + Math.max(60, r.height / 2 - 160)) + 'px';
    document.body.appendChild(c);
    var car = c.querySelector('.carta');
    if (car) car.style.animationDuration = (2.1 * Math.max(vel, 0.7)) + 's';
    setTimeout(function () { c.remove(); }, 2300 * Math.max(vel, 0.7));
  }

  /* ================= Modal ================= */
  function abrirModal(html, tipo, clase) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal ' + (clase || '') + '">' + html + '</div>';
    m.classList.add('ver');
    m.setAttribute('aria-hidden', 'false');
    modalAbierto = tipo || 'info';
    var x = m.querySelector('[data-cerrar]');
    if (x) x.addEventListener('click', cerrarModal);
    return m.firstChild;
  }
  function cerrarTipo(tipos) { if (modalAbierto && tipos.indexOf(modalAbierto) >= 0) cerrarModal(); }
  function cerrarModal() {
    var m = $('#modal');
    m.classList.remove('ver');
    m.setAttribute('aria-hidden', 'true');
    m.innerHTML = '';
    modalAbierto = null;
  }

  /* ================= Panel de jugadores ================= */
  function nombreCorto(p) { return (vista || estado).jugadores[p].nombre; }
  function renderJugadores(s) {
    var cont = $('#jugadores');
    var turnoDe = s.pend && s.pend.who !== undefined ? s.pend.who : -1;
    var orden = s.orden.length ? s.orden : s.jugadores.map(function (j, i) { return i; });
    cont.innerHTML = '';
    orden.forEach(function (p) {
      var j = s.jugadores[p];
      var chips = [];
      if (j.carrera) {
        var c = CV.carrera(j.carrera);
        chips.push('<span class="chip c-car" style="--cc:' + CV.COLORES[c.colores[0]].hex + '">' + c.icono + ' ' + esc(c.nombre.split(' ')[0]) + '</span>');
      } else if (j.pos && j.pos.charAt(0) === 'u') chips.push('<span class="chip">🎓 Estudiando</span>');
      if (j.verano) chips.push('<span class="chip">☀️ ' + CV.carrera(j.verano).icono + '</span>');
      if (j.sueldo) chips.push('<span class="chip">💵 ' + fmt(CV.sueldo(j.sueldo).monto) + '</span>');
      if (j.casa) chips.push('<span class="chip">' + CV.casa(j.casa).icono + (j.seguroCasa ? ' 🛡️' : '') + '</span>');
      if (j.seguroAuto) chips.push('<span class="chip c-ok">🚗🛡️</span>');
      if (j.acciones.length) chips.push('<span class="chip">📈 ' + j.acciones.join(', ') + '</span>');
      if (j.prestamos) chips.push('<span class="chip c-deuda">🏦 ' + j.prestamos + ' × $20k</span>');
      chips.push('<span class="chip c-vida">💖 ' + j.vida.length + '</span>');
      var fam = '<span class="jug-familia">' + (j.pareja ? '<i style="background:#C9B6EE"></i>' : '') + j.hijos.map(function (x) { return '<i style="background:' + (x === 'f' ? '#F7A1C4' : '#7FC3EE') + '"></i>'; }).join('') + '</span>';
      var estadoTxt = j.jubilado ? (j.jubilado === 'valle' ? ' <small>🌳 jubilado/a</small>' : ' <small>💎 jubilado/a</small>') : (j.bot ? ' <small>🤖</small>' : '');
      var d = h('<div class="jug' + (p === turnoDe ? ' activo' : '') + (j.jubilado ? ' jubilado' : '') + '" style="--c:' + j.color + '" data-p="' + p + '">' +
        '<div class="jug-cab"><div class="jug-nom">' + esc(j.nombre) + estadoTxt + '</div>' + fam + '<div class="jug-plata' + (j.dinero < 0 ? ' baja' : '') + '" data-plata="' + p + '">' + fmt(j.dinero) + '</div></div>' +
        '<div class="jug-chips">' + chips.join('') + '</div></div>');
      d.addEventListener('click', function () { detalleJugador(p); });
      cont.appendChild(d);
    });
  }
  function animarPlata(p, desde, hasta) {
    var e = document.querySelector('[data-plata="' + p + '"]');
    if (!e) return;
    var t0 = performance.now(), dur = 700;
    function f(ahora) {
      var t = Math.min(1, (ahora - t0) / dur);
      var v = desde + (hasta - desde) * (1 - Math.pow(1 - t, 3));
      e.textContent = fmt(Math.round(v / 1000) * 1000);
      e.classList.toggle('baja', v < 0);
      if (t < 1) requestAnimationFrame(f); else e.textContent = fmt(hasta);
    }
    requestAnimationFrame(f);
  }
  function posTarjeta(p) {
    var e = document.querySelector('.jug[data-p="' + p + '"] .jug-plata');
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  }
  function detalleJugador(p) {
    var s = vista || estado, j = s.jugadores[p];
    var cartas = [];
    if (j.carrera) cartas.push(cartaCarrera(j.carrera));
    if (j.sueldo) cartas.push(cartaSueldo(j.sueldo));
    if (j.casa) cartas.push(cartaCasa(j.casa));
    j.acciones.forEach(function (n) { cartas.push(htmlCarta({ tipo: 'accion', id: n })); });
    if (j.seguroAuto) cartas.push(htmlCarta({ tipo: 'seguroAuto' }));
    if (j.seguroCasa) cartas.push(htmlCarta({ tipo: 'seguroCasa' }));
    var info = '<p class="sub">Plata: <b>' + fmt(j.dinero) + '</b> · Préstamos: <b>' + j.prestamos + '</b> (devolvés ' + fmt(j.prestamos * CV.DEVOLUCION) + ') · Fichas de Vida: <b>' + j.vida.length + '</b> (valor secreto)' +
      (j.titulo ? ' · 🎓 Con título' : '') + (j.verano ? ' · Trabajo de verano: ' + CV.carrera(j.verano).nombre : '') + '</p>';
    abrirModal('<button class="ico cerrar" data-cerrar>✕</button><h3 style="color:' + j.color + '">' + esc(j.nombre) + '</h3>' + info +
      '<div class="cartas">' + (cartas.join('') || '<p class="sub">Todavía no tiene cartas.</p>') + '</div>', 'detalle', 'ancho');
  }

  /* ================= Barra superior y acciones ================= */
  var QUE = {
    orden: 'gira para ver quién arranca', inicio: 'elige cómo empezar', turno: 'está por girar', girarDeNuevo: 'vuelve a girar',
    girarVenta: 'gira para vender su casa', bifurcacion: 'elige un camino', elegirCarrera: 'elige una carrera', elegirCasa: 'mira casas',
    venderCasa: 'decide si vende su casa', escuela: 'piensa en la escuela nocturna', cambioSueldo: 'piensa si cambia su sueldo', jubilacion: 'elige dónde jubilarse'
  };
  function renderBarra(s) {
    var b = $('#barra-turno');
    if (!s.pend || s.pend.tipo === 'fin') { b.innerHTML = '<span class="chip-turno">🏆 ¡Partida terminada!</span>'; return; }
    var j = s.jugadores[s.pend.who];
    b.innerHTML = '<span class="chip-turno"><span class="punto" style="background:' + j.color + '"></span>' + esc(j.nombre) + ' ' + (QUE[s.pend.tipo] || '') + '</span>';
  }
  function puedeActuar(s) {
    return s && s.pend && s.pend.tipo !== 'fin' && opts.esLocal(s.pend.who) && !s.jugadores[s.pend.who].bot && !enviado && !reproduciendo;
  }
  function enviar(acc) {
    if (enviado) return;
    enviado = true;
    CV.Sonido.tocar('clic');
    CV.Ruleta.lista(false);
    renderAcciones(estado);
    opts.enviar(acc);
    // Si en 8 segundos no llegó respuesta (problema de red), habilitar de nuevo
    setTimeout(function () { if (enviado && !reproduciendo) { enviado = false; renderAcciones(estado); } }, 8000);
  }

  function boton(txt, clase, fn, deshab) {
    var b = h('<button class="btn ' + (clase || 'b-blanco') + '"' + (deshab ? ' disabled' : '') + '>' + txt + '</button>');
    b.addEventListener('click', fn);
    return b;
  }
  function renderAcciones(s) {
    var cont = $('#acciones');
    cont.innerHTML = '';
    CV.Tablero.marcarCarriles(false);
    if (!s || !s.pend) return;
    var pd = s.pend;
    if (reproduciendo) {
      CV.Ruleta.lista(false);
      cont.appendChild(h('<div class="acc-espera">🎬 Mirá lo que pasa <span class="puntitos"><span></span><span></span><span></span></span></div>'));
      return;
    }
    if (pd.tipo === 'fin') {
      cont.appendChild(h('<div class="acc-titulo">🏆 ¡Terminó la partida!</div>'));
      cont.appendChild(boton('Ver resultados', 'b-naranja', function () { mostrarFinal(s); }));
      return;
    }
    var j = s.jugadores[pd.who], p = pd.who;
    cont.appendChild(h('<div class="acc-titulo"><span class="punto" style="background:' + j.color + '"></span><span>' + esc(j.nombre) + (puedeActuar(s) || (opts.esLocal(p) && !j.bot) ? '' : ' ' + (QUE[pd.tipo] || '')) + '</span></div>'));

    if (!puedeActuar(s)) {
      CV.Ruleta.lista(false);
      var quien = j.bot ? 'La compu está pensando' : (opts.esLocal(p) ? 'Un momento' : 'Esperando a ' + j.nombre);
      if (reproduciendo || enviado) quien = 'Mirá lo que pasa';
      cont.appendChild(h('<div class="acc-espera">' + esc(quien) + ' <span class="puntitos"><span></span><span></span><span></span></span></div>'));
      return;
    }
    if (CV.Ayuda.tips[pd.tipo]) cont.appendChild(h('<div class="acc-tip">💡 ' + esc(CV.Ayuda.tips[pd.tipo]) + '</div>'));
    var btns = h('<div class="acc-btns"></div>');
    cont.appendChild(btns);
    var girarFn = function () { enviar({ who: p, a: 'girar' }); };

    switch (pd.tipo) {
      case 'orden':
      case 'girarDeNuevo':
      case 'girarVenta':
        btns.appendChild(boton(pd.tipo === 'girarVenta' ? '🎡 Girar para vender' : (pd.tipo === 'girarDeNuevo' ? '🎡 ¡Girá de nuevo!' : '🎡 Girar la ruleta'), 'grande b-naranja', girarFn));
        CV.Ruleta.lista(true);
        if (pd.tipo === 'girarVenta' && j.casa) {
          var cs = CV.casa(j.casa);
          btns.appendChild(h('<div class="acc-tip">' + cs.icono + ' ' + esc(cs.nombre) + ': 1-3 → ' + fmt(cs.venta[0]) + ' · 4-7 → ' + fmt(cs.venta[1]) + ' · 8-10 → ' + fmt(cs.venta[2]) + '</div>'));
        }
        break;
      case 'turno':
        var o = CV.Motor.opcionesTurno(s, p);
        btns.appendChild(boton('🎡 Girar la ruleta', 'grande b-naranja', girarFn));
        CV.Ruleta.lista(true);
        var ex = h('<div class="acc-extras"></div>');
        cont.appendChild(ex);
        if (!j.seguroAuto) ex.appendChild(boton('🚗 Seguro de auto<small>' + fmt(CV.SEGURO_AUTO) + '</small>', 'b-blanco', function () { enviar({ who: p, a: 'seguroAuto' }); }, !o.seguroAuto));
        if (j.casa && !j.seguroCasa) ex.appendChild(boton('🛡️ Seguro de casa<small>' + fmt(CV.casa(j.casa).seguro) + '</small>', 'b-blanco', function () { enviar({ who: p, a: 'seguroCasa' }); }, !o.seguroCasa));
        if (!j.acciones.length) ex.appendChild(boton('📈 Comprar acción<small>' + fmt(CV.PRECIO_ACCION) + '</small>', 'b-blanco', function () { elegirAccion(s, p); }, !o.accion));
        ex.appendChild(boton('🏦 Pedir préstamo<small>+' + fmt(CV.PRESTAMO) + '</small>', 'b-blanco', function () { enviar({ who: p, a: 'prestamo', n: 1 }); }));
        if (j.prestamos) ex.appendChild(boton('✅ Devolver préstamo<small>-' + fmt(CV.DEVOLUCION) + '</small>', 'b-blanco', function () { enviar({ who: p, a: 'devolver' }); }, !o.devolver));
        if (o.atleta) ex.appendChild(boton('⭐ Canjear 4 fichas<small>Sueldo estrella</small>', 'b-violeta', function () { enviar({ who: p, a: 'atleta' }); }));
        break;
      case 'inicio':
        btns.appendChild(boton('Elegir cómo empezar', 'grande b-naranja', function () { modalInicio(s, p); }));
        modalInicio(s, p);
        break;
      case 'bifurcacion':
        btns.classList.add('dos');
        btns.appendChild(boton('👨‍👩‍👧 Familia', 'b-rosa b-violeta', function () { enviar({ who: p, id: 'f0' }); }));
        btns.appendChild(boton('⚡ Riesgo', 'b-naranja', function () { enviar({ who: p, id: 'r0' }); }));
        CV.Tablero.marcarCarriles(true);
        break;
      case 'elegirCarrera':
        btns.appendChild(boton('Ver carreras', 'grande b-naranja', function () { modalCarreras(s, p); }));
        modalCarreras(s, p);
        break;
      case 'elegirCasa':
        btns.appendChild(boton('Ver casas', 'grande b-naranja', function () { modalCasas(s, p); }));
        modalCasas(s, p);
        break;
      case 'venderCasa':
        var c = CV.casa(j.casa);
        cont.insertBefore(h('<div class="acc-tip">' + c.icono + ' ' + esc(c.nombre) + ' (la pagaste ' + fmt(c.precio) + '). Venta: ' + fmt(c.venta[0]) + ' / ' + fmt(c.venta[1]) + ' / ' + fmt(c.venta[2]) + '</div>'), btns);
        btns.classList.add('dos');
        btns.appendChild(boton('🏷️ Vender', 'b-naranja', function () { enviar({ who: p, si: true }); }));
        btns.appendChild(boton('🏠 Me la quedo', 'b-blanco', function () { enviar({ who: p, si: false }); }));
        break;
      case 'escuela':
        btns.classList.add('dos');
        btns.appendChild(boton('🌙 Ir (' + fmt(CV.ESCUELA_NOCTURNA) + ')', 'b-azul', function () { enviar({ who: p, si: true }); }));
        btns.appendChild(boton('No, gracias', 'b-blanco', function () { enviar({ who: p, si: false }); }));
        break;
      case 'cambioSueldo':
        btns.appendChild(boton('🔄 Ver sueldos', 'grande b-azul', function () { modalCambio(s, p); }));
        btns.appendChild(boton('Me quedo con el mío', 'b-blanco', function () { enviar({ who: p, con: null }); }));
        modalCambio(s, p);
        break;
      case 'jubilacion':
        btns.appendChild(boton('Elegir dónde jubilarme', 'grande b-naranja', function () { modalJubilacion(s, p); }));
        modalJubilacion(s, p);
        break;
    }
  }

  /* ================= Modales de decisión ================= */
  function modalInicio(s, p) {
    var m = abrirModal('<h3>¿Cómo empezás tu vida, ' + esc(s.jugadores[p].nombre) + '?</h3><p class="sub">' + esc(CV.Ayuda.tips.inicio) + '</p>' +
      '<div class="opciones-grandes">' +
      '<button class="op-grande" data-op="uni" style="--bg:#EFE8FF"><span class="og-ico">🎓</span><span class="og-tit">Ir a la universidad</span><span class="og-txt">Pedís $100.000 prestados. Al terminar elegís entre 3 carreras (incluso las que piden título).</span></button>' +
      '<button class="op-grande" data-op="carrera" style="--bg:#FFF0DF"><span class="og-ico">💼</span><span class="og-tit">Empezar a trabajar</span><span class="og-txt">Sin deudas y más rápido. Te toca una carrera sin título y un sueldo al azar.</span></button>' +
      '</div>', 'inicio');
    m.querySelectorAll('[data-op]').forEach(function (b) {
      b.addEventListener('click', function () { cerrarModal(); enviar({ who: p, op: b.getAttribute('data-op') }); });
    });
  }
  function modalCarreras(s, p) {
    var pd = s.pend;
    var html = '<h3>' + (pd.motivo === 'escuela' ? 'Escuela nocturna: ¿cambiás de carrera?' : '¡Buscando empleo! Elegí tu carrera') + '</h3><p class="sub">' + esc(CV.Ayuda.tips.elegirCarrera) + '</p><div class="cartas">' +
      pd.opciones.map(function (id) { return cartaCarrera(id, '<div class="botones-carta"><button class="btn b-naranja" data-id="' + id + '">Elegir</button></div>'); }).join('') + '</div>';
    if (pd.motivo === 'escuela') html += '<div class="modal-pie"><button class="btn b-blanco" data-id="">Me quedo con mi carrera</button></div>';
    var m = abrirModal(html, 'carreras', 'ancho');
    m.querySelectorAll('button[data-id]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); cerrarModal(); enviar({ who: p, id: b.getAttribute('data-id') || null }); });
    });
  }
  function modalCasas(s, p) {
    var pd = s.pend, j = s.jugadores[p];
    var html = '<h3>🏠 ¿Comprás una casa?</h3><p class="sub">Tenés ' + fmt(j.dinero) + '. ' + esc(CV.Ayuda.tips.elegirCasa) + '</p><div class="cartas">' +
      pd.opciones.map(function (id) {
        var c = CV.casa(id);
        var falta = c.precio > j.dinero ? '<div style="color:#C24740">Te faltan ' + fmt(c.precio - j.dinero) + ' (se piden préstamos)</div>' : '';
        return cartaCasa(id, falta + '<div class="botones-carta"><button class="btn b-naranja" data-id="' + id + '" data-seg="0">Comprar</button><button class="btn b-verde" data-id="' + id + '" data-seg="1">Comprar + seguro (' + fmt(c.seguro) + ')</button></div>');
      }).join('') + '</div><div class="modal-pie"><button class="btn b-blanco" data-no>No compro ninguna</button></div>';
    var m = abrirModal(html, 'casas', 'ancho');
    m.querySelectorAll('button[data-id]').forEach(function (b) {
      b.addEventListener('click', function () { cerrarModal(); enviar({ who: p, id: b.getAttribute('data-id'), seguro: b.getAttribute('data-seg') === '1' }); });
    });
    m.querySelector('[data-no]').addEventListener('click', function () { cerrarModal(); enviar({ who: p, id: null }); });
  }
  function modalCambio(s, p) {
    var j = s.jugadores[p];
    var lista = s.jugadores.map(function (o, i) {
      if (i === p || !o.sueldo || o.jubilado) return '';
      return '<button data-con="' + i + '"><span class="punto" style="background:' + o.color + '"></span><span>' + esc(o.nombre) + '</span><span>' + fmt(CV.sueldo(o.sueldo).monto) + '</span></button>';
    }).join('');
    var m = abrirModal('<button class="ico cerrar" data-cerrar>✕</button><h3>🔄 Cambio de sueldo</h3><p class="sub">Tu sueldo: <b>' + fmt(CV.sueldo(j.sueldo).monto) + '</b>. ' + esc(CV.Ayuda.tips.cambioSueldo) + '</p><div class="lista-jug">' + lista + '</div><div class="modal-pie"><button class="btn b-blanco" data-no>Me quedo con el mío</button></div>', 'cambio');
    m.querySelectorAll('[data-con]').forEach(function (b) {
      b.addEventListener('click', function () { cerrarModal(); enviar({ who: p, con: +b.getAttribute('data-con') }); });
    });
    m.querySelector('[data-no]').addEventListener('click', function () { cerrarModal(); enviar({ who: p, con: null }); });
  }
  function modalJubilacion(s, p) {
    var m = abrirModal('<h3>🌅 ¡Llegó la jubilación!</h3><p class="sub">Tenés ' + fmt(s.jugadores[p].dinero) + '. ¿Dónde vas a vivir?</p>' +
      '<div class="opciones-grandes">' +
      '<button class="op-grande" data-op="valle" style="--bg:#E3F5E9"><span class="og-ico">🌳</span><span class="og-tit">Valle Tranquilo</span><span class="og-txt">Ganás 1 ficha de Vida ya mismo y tus fichas quedan a salvo: nadie te las puede sacar.</span></button>' +
      '<button class="op-grande" data-op="lomas" style="--bg:#FFF2C9"><span class="og-ico">💎</span><span class="og-tit">Lomas Millonarias</span><span class="og-txt">Si al final sos quien más plata tiene en Lomas, te llevás las 4 fichas de Vida que hay ahí. Pero tus fichas no están seguras.</span></button>' +
      '</div>', 'jubilacion');
    m.querySelectorAll('[data-op]').forEach(function (b) {
      b.addEventListener('click', function () { cerrarModal(); enviar({ who: p, op: b.getAttribute('data-op') }); });
    });
  }
  function elegirAccion(s, p) {
    var botones = '';
    for (var n = 1; n <= 10; n++) botones += '<button data-n="' + n + '"' + (s.mazos.acciones.indexOf(n) < 0 ? ' disabled' : '') + '>' + n + '</button>';
    var m = abrirModal('<button class="ico cerrar" data-cerrar>✕</button><h3>📈 Comprar una acción</h3><p class="sub">Cuesta ' + fmt(CV.PRECIO_ACCION) + '. Elegí un número: cada vez que cualquier jugador lo saque en la ruleta, cobrás $10.000. Los números grises ya tienen dueño.</p><div class="grilla-acciones">' + botones + '</div>', 'accion');
    m.querySelectorAll('[data-n]').forEach(function (b) {
      b.addEventListener('click', function () { cerrarModal(); enviar({ who: p, a: 'accion', n: +b.getAttribute('data-n') }); });
    });
  }

  /* ================= Reproducción de eventos ================= */
  function cartelCasilla(id) {
    var c = CV.CASILLAS[id], e = $('#cartel-casilla');
    e.innerHTML = '<div class="cc-ico" style="background:' + CV.Tablero.colorCasilla(c) + '">' + CV.Tablero.iconoCasilla(c) + '</div><div><div class="cc-tit">' + esc(CV.ETIQUETAS[c.t] || '') + '</div><div class="cc-txt">' + esc(c.txt) + '</div></div>';
    e.classList.add('ver');
    clearTimeout(cartelCasilla.t);
    cartelCasilla.t = setTimeout(function () { e.classList.remove('ver'); }, 3200 * Math.max(vel, 0.7));
  }
  function fichaVuela(p) {
    var a = CV.Tablero.pantallaDeAuto(p), b = posTarjeta(p);
    if (!a || !b) return;
    var f = h('<div class="ficha-vida ficha-vuela">💖</div>');
    f.style.left = (a.x - 35) + 'px'; f.style.top = (a.y - 35) + 'px';
    document.body.appendChild(f);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      f.style.left = (b.x - 35) + 'px'; f.style.top = (b.y - 20) + 'px'; f.style.transform = 'scale(.45)'; f.style.opacity = '0';
    }); });
    setTimeout(function () { f.remove(); }, 1300);
  }

  async function reproducirEvento(ev, nuevo) {
    var V = vista;
    switch (ev.k) {
      case 'turno':
        CV.Tablero.activo(ev.p);
        CV.Tablero.seguirJugador(ev.p);
        renderBarra(nuevo);
        CV.Sonido.tocar('turno');
        if (opts.modo !== 'online' && !V.jugadores[ev.p].bot && Object.keys(V.jugadores).length > 1) {
          banner('🚗', 'Turno de ' + V.jugadores[ev.p].nombre, '', V.jugadores[ev.p].color, 1300);
          await esperar(700 * vel);
        } else await esperar(250 * vel);
        break;
      case 'giro':
        CV.Ruleta.lista(false);
        await CV.Ruleta.girar(ev.v, { vel: vel, trabada: ev.trabada });
        break;
      case 'mover':
        await CV.Tablero.moverAuto(V, ev.p, ev.camino, vel);
        V.jugadores[ev.p].pos = ev.camino[ev.camino.length - 1];
        break;
      case 'casilla':
        cartelCasilla(ev.id);
        CV.Sonido.tocar(CV.ROJAS[CV.CASILLAS[ev.id].t] ? 'alto' : 'clic');
        await esperar(900 * vel);
        break;
      case 'dinero':
        var antes = V.jugadores[ev.p].dinero;
        V.jugadores[ev.p].dinero += ev.d;
        animarPlata(ev.p, antes, V.jugadores[ev.p].dinero);
        var pt = posTarjeta(ev.p);
        if (pt) flotar((ev.d > 0 ? '+' : '') + fmt(ev.d), pt.x, pt.y, ev.d > 0);
        var pa = CV.Tablero.pantallaDeAuto(ev.p);
        if (pa && Math.abs(ev.d) >= 5000) flotar((ev.d > 0 ? '+' : '') + fmt(ev.d), pa.x, pa.y - 30, ev.d > 0);
        CV.Sonido.tocar(ev.d > 0 ? 'moneda' : 'paga');
        await esperar(450 * vel);
        break;
      case 'diaPago':
        CV.Sonido.tocar('caja');
        if (ev.pasando) aviso('💵 ' + V.jugadores[ev.p].nombre + ' pasó por un Día de pago: +' + fmt(ev.monto), 'bien');
        else banner('💵', '¡Día de pago!', V.jugadores[ev.p].nombre + ' cobra ' + fmt(ev.monto), '#3E9A5F', 1500);
        await esperar((ev.pasando ? 300 : 800) * vel);
        break;
      case 'vida':
        V.jugadores[ev.p].vida.push('?');
        fichaVuela(ev.p);
        CV.Sonido.tocar('vida');
        if (ev.de !== undefined) aviso('💖 ' + V.jugadores[ev.p].nombre + ' le sacó una ficha de Vida a ' + V.jugadores[ev.de].nombre + '.', 'info');
        await esperar(750 * vel);
        break;
      case 'familia':
        var jj = V.jugadores[ev.p];
        if (ev.tipo === 'pareja') { jj.pareja = true; banner('💍', '¡Casamiento!', '¡Felicitaciones, ' + jj.nombre + '!', '#C04F7E', 2000); CV.Sonido.tocar('boda'); confeti(140); }
        else {
          if (ev.tipo === 'nena') jj.hijos.push('f'); else if (ev.tipo === 'nene') jj.hijos.push('m'); else { jj.hijos.push('f'); jj.hijos.push('m'); }
          banner(ev.tipo === 'mellizos' ? '👶👶' : (ev.tipo === 'nena' ? '👧' : '👦'), ev.tipo === 'mellizos' ? '¡Llegaron mellizos!' : (ev.tipo === 'nena' ? '¡Llegó una bebita!' : '¡Llegó un bebito!'), jj.nombre + ' agranda la familia', '#4FA3D9', 1900);
          CV.Sonido.tocar('bebe'); confeti(80);
        }
        CV.Tablero.sincronizar(V);
        await esperar(1300 * vel);
        break;
      case 'carta':
        mostrarCartaVolando(htmlCarta(ev));
        CV.Sonido.tocar('carta');
        await esperar(1500 * vel);
        break;
      case 'prestamo':
        aviso('🏦 ' + V.jugadores[ev.p].nombre + (ev.auto ? ' no tenía suficiente y pidió ' : ' pidió ') + ev.n + (ev.n > 1 ? ' préstamos' : ' préstamo') + ' (' + fmt(ev.n * CV.PRESTAMO) + ').', ev.auto ? 'mal' : 'info');
        V.jugadores[ev.p].prestamos += ev.n;
        var a1 = V.jugadores[ev.p].dinero;
        V.jugadores[ev.p].dinero += ev.n * CV.PRESTAMO;
        animarPlata(ev.p, a1, V.jugadores[ev.p].dinero);
        CV.Sonido.tocar('moneda');
        await esperar(500 * vel);
        break;
      case 'aviso':
        aviso(ev.txt, ev.tono);
        await esperar(500 * vel);
        break;
      case 'festejo':
        var icos = { estrella: '⭐', casa: '🏡', jubilado: '🌅' };
        banner(icos[ev.tipo] || '🎉', ev.txt, '', ev.tipo === 'estrella' ? '#C08A12' : '#F39A4A', 1800);
        CV.Sonido.tocar('festejo'); confeti(ev.tipo === 'casa' ? 70 : 130);
        await esperar(1200 * vel);
        break;
      case 'venta':
        var hc = CV.casa(ev.casa);
        banner('🏷️', 'Vendió ' + hc.nombre, fmt(ev.monto) + (ev.ganancia >= 0 ? ' (ganó ' + fmt(ev.ganancia) + ')' : ' (perdió ' + fmt(-ev.ganancia) + ')'), ev.ganancia >= 0 ? '#3E9A5F' : '#BE443E', 1700);
        await esperar(900 * vel);
        break;
      case 'cambio':
        CV.Sonido.tocar('carta');
        await esperar(300 * vel);
        break;
      case 'jubilado':
        V.jugadores[ev.p].jubilado = ev.donde;
        await CV.Tablero.deslizarAuto(ev.p, CV.Tablero.lugarDe(V, ev.p), vel);
        break;
      case 'fin':
        break;
    }
  }

  function mostrarEstado(nuevo, eventos) {
    cola = cola.then(async function () {
      reproduciendo++;
      enviado = false;
      if (!vista) vista = JSON.parse(JSON.stringify(nuevo));
      renderAcciones(nuevo);
      cerrarTipo(['inicio', 'carreras', 'casas', 'cambio', 'jubilacion', 'accion']);
      try {
        for (var i = 0; i < (eventos || []).length; i++) {
          await reproducirEvento(eventos[i], nuevo);
        }
      } catch (e) { console.error(e); }
      reproduciendo--;
      estado = nuevo;
      vista = JSON.parse(JSON.stringify(nuevo));
      renderTodo();
      if (eventos && eventos.some(function (e) { return e.k === 'fin'; })) {
        await esperar(600);
        mostrarFinal(nuevo);
      }
    });
    return cola;
  }

  function renderTodo() {
    var s = estado;
    CV.Tablero.sincronizar(s);
    renderJugadores(s);
    renderBarra(s);
    if (s.pend && s.pend.who !== undefined) CV.Tablero.activo(s.pend.who);
    var clave = JSON.stringify(s.pend) + s.nTurno;
    if (modalAbierto && ['inicio', 'carreras', 'casas', 'cambio', 'jubilacion', 'accion'].indexOf(modalAbierto) >= 0 && clave !== ultimoPend) cerrarModal();
    ultimoPend = clave;
    renderAcciones(s);
    renderHistorial(s);
    programarBot();
  }
  function renderHistorial(s) {
    var ol = $('#historial-lista');
    ol.innerHTML = s.log.slice(-60).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
  }
  function programarBot() {
    clearTimeout(botTimer);
    var s = estado;
    if (!opts.manejaBots || !s.pend || s.pend.tipo === 'fin') return;
    var j = s.jugadores[s.pend.who];
    if (!j || !j.bot) return;
    var clave = s.nTurno + ':' + JSON.stringify(s.pend);
    botTimer = setTimeout(function () {
      if (estado !== s || reproduciendo) return;
      var acc = CV.Bot.decidir(s);
      if (acc && clave === s.nTurno + ':' + JSON.stringify(s.pend)) opts.enviarBot(acc);
    }, 750 * vel);
  }

  /* ================= Final ================= */
  function mostrarFinal(s) {
    if (!s.resultado) return;
    var filas = s.resultado.map(function (r, i) {
      var j = s.jugadores[r.p];
      var fichas = r.fichas.map(function (idx, k) {
        var f = CV.FICHAS_VIDA[idx];
        return '<span style="animation-delay:' + (0.5 + i * 0.3 + k * 0.08).toFixed(2) + 's">' + esc(f.texto) + ': ' + fmt(f.valor) + '</span>';
      }).join('');
      return '<div class="final-fila' + (i === 0 ? ' primero' : '') + '" style="animation-delay:' + (i * 0.25) + 's">' +
        '<div class="pos">' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</div>' +
        '<div><div style="font-weight:800;font-size:18px;color:' + j.color + '">' + esc(j.nombre) + ' <small style="color:#7B7494">' + (j.jubilado === 'lomas' ? '💎 Lomas Millonarias' : '🌳 Valle Tranquilo') + '</small></div>' +
        '<div class="det">Plata: ' + fmt(r.dinero) + ' · ' + r.fichas.length + ' fichas de Vida: ' + fmt(r.valorFichas) + '</div><div class="fichas-reveladas">' + fichas + '</div></div>' +
        '<div class="tot">' + fmt(r.total) + '</div></div>';
    }).join('');
    var gan = s.jugadores[s.resultado[0].p];
    var m = abrirModal('<h3>🏆 ¡Ganó ' + esc(gan.nombre) + '!</h3><p class="sub">Se dieron vuelta las fichas de Vida y se sumó todo. Así terminó la carrera:</p><div class="final-podio">' + filas + '</div>' +
      '<div class="modal-pie"><button class="btn b-naranja" data-otra>🔁 Jugar otra vez</button><button class="btn b-blanco" data-ver>Ver el tablero</button><button class="btn b-blanco" data-salir>Volver al inicio</button></div>', 'final', 'ancho');
    CV.Sonido.tocar('victoria');
    confeti(220);
    setTimeout(function () { confeti(160, innerWidth * 0.25, innerHeight * 0.3); }, 700);
    setTimeout(function () { confeti(160, innerWidth * 0.75, innerHeight * 0.3); }, 1300);
    m.querySelector('[data-otra]').addEventListener('click', function () { cerrarModal(); if (opts.otraVez) opts.otraVez(); });
    m.querySelector('[data-ver]').addEventListener('click', function () { cerrarModal(); CV.Tablero.verTodo(); });
    m.querySelector('[data-salir]').addEventListener('click', function () { cerrarModal(); if (opts.alSalir) opts.alSalir(); });
    if (!opts.otraVez) m.querySelector('[data-otra]').remove();
  }

  /* ================= Tocar casillas ================= */
  function tipCasilla(id, e) {
    var c = CV.CASILLAS[id];
    document.querySelectorAll('.tip-casilla').forEach(function (t) { t.remove(); });
    var t = h('<div class="tip-casilla"><b>' + CV.Tablero.iconoCasilla(c) + ' ' + esc(CV.ETIQUETAS[c.t]) + '</b>' + esc(c.txt) + '<div style="margin-top:6px;font-size:13px">' + esc(CV.Ayuda.casilla[c.t] || '') + '</div></div>');
    document.body.appendChild(t);
    var x = Math.min(innerWidth - 270, Math.max(8, e.clientX - 130)), y = e.clientY + 18;
    if (y + 160 > innerHeight) y = e.clientY - 170;
    t.style.left = x + 'px'; t.style.top = y + 'px';
    setTimeout(function () { t.remove(); }, 4500);
    document.addEventListener('pointerdown', function quitar() { t.remove(); document.removeEventListener('pointerdown', quitar); }, { once: true });
  }

  /* ================= Guía rápida y reglamento ================= */
  function guia() {
    var i = 0, slides = CV.Ayuda.guia;
    var m = abrirModal('<button class="ico cerrar" data-cerrar>✕</button><div id="guia-cont"></div><div class="guia-puntos" id="guia-puntos"></div><div class="modal-pie"><button class="btn b-blanco" id="g-ant">← Anterior</button><button class="btn b-naranja" id="g-sig">Siguiente →</button></div>', 'guia');
    function pintar() {
      var sl = slides[i];
      var ley = sl.leyenda ? '<div class="leyenda">' + CV.Ayuda.leyenda.map(function (l) { return '<div><i style="background:' + l[0] + '">' + l[1] + '</i>' + esc(l[2]) + '</div>'; }).join('') + '</div>' : '';
      $('#guia-cont').innerHTML = '<div class="guia-slide" style="animation:aparecer .35s ease"><div class="g-ico">' + sl.ico + '</div><h4>' + esc(sl.tit) + '</h4><p>' + esc(sl.txt) + '</p>' + ley + '</div>';
      $('#guia-puntos').innerHTML = slides.map(function (x, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('');
      $('#g-ant').disabled = i === 0;
      $('#g-sig').textContent = i === slides.length - 1 ? '¡A jugar!' : 'Siguiente →';
    }
    m.querySelector('#g-ant').addEventListener('click', function () { if (i > 0) { i--; pintar(); CV.Sonido.tocar('clic'); } });
    m.querySelector('#g-sig').addEventListener('click', function () { if (i < slides.length - 1) { i++; pintar(); CV.Sonido.tocar('clic'); } else cerrarModal(); });
    pintar();
    try { localStorage.setItem('cv-guia-vista', '1'); } catch (e) { /* nada */ }
  }
  function reglamento() {
    abrirModal('<button class="ico cerrar" data-cerrar>✕</button><h3>📖 Reglamento</h3><p class="sub"><a href="reglamento.html" target="_blank" rel="noopener">Abrir en una pestaña nueva</a></p><iframe src="reglamento.html" title="Reglamento"></iframe>', 'reglamento', 'ancho');
  }

  /* ================= API ================= */
  CV.UI = {
    iniciar: function (o, s) {
      opts = o;
      vel = o.vel || 1;
      cerrarModal();
      estado = s; vista = JSON.parse(JSON.stringify(s));
      cola = Promise.resolve(); reproduciendo = 0; enviado = false;
      clearTimeout(botTimer);
      CV.Tablero.crear($('#tablero-vp'), $('#tablero-mundo'), tipCasilla);
      CV.Tablero.crearAutos(s);
      CV.Ruleta.init($('#ruleta'), function () {
        if (puedeActuar(estado) && ['turno', 'orden', 'girarDeNuevo', 'girarVenta'].indexOf(estado.pend.tipo) >= 0) enviar({ who: estado.pend.who, a: 'girar' });
      });
      $('#historial-lista').innerHTML = '';
      renderTodo();
      if (s.pend && s.pend.who !== undefined) setTimeout(function () { CV.Tablero.seguirJugador(s.pend.who); }, 400);
      if (s.fase === 'fin') setTimeout(function () { mostrarFinal(s); }, 500);
    },
    mostrarEstado: mostrarEstado,
    estado: function () { return estado; },
    aviso: aviso,
    abrirModal: abrirModal,
    cerrarModal: cerrarModal,
    guia: guia,
    reglamento: reglamento,
    setVel: function (v) { vel = v; },
    errorAccion: function (msg) { enviado = false; CV.Sonido.tocar('error'); aviso(msg, 'mal'); renderAcciones(estado); },
    detener: function () { clearTimeout(botTimer); opts = { esLocal: function () { return false; }, enviar: function () {} }; }
  };
})(window);
