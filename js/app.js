/* La Carrera de la Vida — pantallas, partida local, contra la compu y online */
(function (root) {
  'use strict';
  var CV = root.CV;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var NOMBRES_BOT = ['Robi', 'Chispa', 'Tuerca', 'Pixel', 'Bit'];
  var CLAVE = 'cv-partida';

  var config = { modo: 'local', jugadores: [] };
  var partida = null;   // { modo, estado, vel, ... }
  var red = null;       // conexión online
  var sala = null;      // datos de la sala (anfitrión o invitado)

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ir(id) {
    $$('.pantalla').forEach(function (p) { p.classList.remove('activa'); });
    $('#p-' + id).classList.add('activa');
    CV.Sonido.tocar('clic');
  }
  function iconoSonido() {
    var t = CV.Sonido.activo() ? '🔊' : '🔇';
    $('#btn-sonido').textContent = t;
    $('#btn-sonido-inicio').textContent = t + ' Sonido';
  }

  /* ---------- Guardado ---------- */
  function guardar() {
    if (!partida) return;
    try {
      var g = { modo: partida.modo, estado: partida.estado, vel: partida.vel };
      if (partida.modo === 'host') { g.codigo = sala.codigo; g.asientos = sala.asientos; }
      localStorage.setItem(CLAVE, JSON.stringify(g));
    } catch (e) { /* sin espacio */ }
  }
  function cargado() {
    try { var g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.estado && g.estado.fase !== 'fin') return g; } catch (e) { /* nada */ }
    return null;
  }
  function borrarGuardado() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }
  function actualizarContinuar() {
    var g = cargado();
    var b = $('#btn-continuar');
    b.classList.toggle('oculto', !g);
    if (g) {
      var noms = g.estado.jugadores.map(function (j) { return j.nombre; }).join(', ');
      b.textContent = '⏯️ Continuar partida (' + noms + ')' + (g.modo === 'host' ? ' — online' : '');
    }
  }

  /* ---------- Configuración local / un jugador ---------- */
  function colorLibre(usados) {
    for (var i = 0; i < CV.COLORES_AUTO.length; i++) if (usados.indexOf(CV.COLORES_AUTO[i].hex) < 0) return CV.COLORES_AUTO[i].hex;
    return CV.COLORES_AUTO[0].hex;
  }
  function nuevoJugador(bot) {
    var usados = config.jugadores.map(function (j) { return j.color; });
    var nb = config.jugadores.filter(function (j) { return j.bot; }).length;
    var nh = config.jugadores.filter(function (j) { return !j.bot; }).length;
    return { nombre: bot ? NOMBRES_BOT[nb % NOMBRES_BOT.length] : 'Jugador ' + (nh + 1), color: colorLibre(usados), bot: !!bot };
  }
  function abrirConfig(modo) {
    config.modo = modo;
    var guardados = null;
    try { guardados = JSON.parse(localStorage.getItem('cv-config-' + modo)); } catch (e) { /* nada */ }
    if (guardados && guardados.length >= 2) config.jugadores = guardados;
    else if (modo === 'solo') { config.jugadores = []; config.jugadores.push(nuevoJugador(false)); config.jugadores[0].nombre = 'Vos'; config.jugadores.push(nuevoJugador(true)); }
    else { config.jugadores = []; config.jugadores.push(nuevoJugador(false)); config.jugadores.push(nuevoJugador(false)); }
    $('#config-titulo').textContent = modo === 'solo' ? 'Un jugador contra la compu' : 'Jugar en este dispositivo';
    $('#config-ayuda').textContent = modo === 'solo'
      ? 'Jugás contra 1 a 5 rivales manejados por la compu. Ideal para practicar.'
      : 'De 2 a 6 jugadores pasándose la tablet o la compu. También pueden sumar a la compu como rival.';
    $('#btn-agregar').classList.toggle('oculto', modo === 'solo');
    try { $('#chk-rapido').checked = localStorage.getItem('cv-rapido') === '1'; } catch (e) { /* nada */ }
    pintarConfig();
    ir('config');
  }
  function selectorColores(sel, usados, alElegir) {
    var d = document.createElement('div');
    d.className = 'selector-colores';
    CV.COLORES_AUTO.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.background = c.hex;
      b.title = c.nombre;
      if (c.hex === sel) b.classList.add('sel');
      else if (usados.indexOf(c.hex) >= 0) b.disabled = true;
      b.addEventListener('click', function () { alElegir(c.hex); });
      d.appendChild(b);
    });
    return d;
  }
  function autoMini(color) {
    return '<svg width="44" height="28" viewBox="-30 -18 60 36"><rect x="-28" y="-16" width="56" height="32" rx="13" fill="' + color + '" stroke="#fff" stroke-width="3"/><rect x="7" y="-12" width="11" height="24" rx="4" fill="#E6F4FF"/><circle cx="-1" cy="-6" r="4.5" fill="#fff"/></svg>';
  }
  function pintarConfig() {
    var cont = $('#config-jugadores');
    cont.innerHTML = '';
    config.jugadores.forEach(function (j, i) {
      var usados = config.jugadores.filter(function (o, k) { return k !== i; }).map(function (o) { return o.color; });
      var fila = document.createElement('div');
      fila.className = 'config-jug';
      fila.innerHTML = '<div class="auto-prev">' + autoMini(j.color) + '</div><div><div class="tipo">' + (j.bot ? '🤖 La compu' : '🧑 Persona') + '</div><input type="text" maxlength="14" value="' + esc(j.nombre) + '"></div>' +
        '<button class="quitar" title="Quitar">✕</button>';
      fila.querySelector('input').addEventListener('input', function (e) { j.nombre = e.target.value; });
      fila.querySelector('div:nth-child(2)').appendChild(selectorColores(j.color, usados, function (c) { j.color = c; pintarConfig(); }));
      var q = fila.querySelector('.quitar');
      var humanos = config.jugadores.filter(function (o) { return !o.bot; }).length;
      if (config.jugadores.length <= 2 || (!j.bot && humanos <= 1)) q.style.visibility = 'hidden';
      q.addEventListener('click', function () { config.jugadores.splice(i, 1); pintarConfig(); });
      cont.appendChild(fila);
    });
    var lleno = config.jugadores.length >= 6;
    $('#btn-agregar').disabled = lleno;
    $('#btn-agregar-bot').disabled = lleno;
  }
  function empezarLocal() {
    var js = config.jugadores.map(function (j, i) {
      return { nombre: (j.nombre || '').trim() || (j.bot ? NOMBRES_BOT[i % 5] : 'Jugador ' + (i + 1)), color: j.color, bot: j.bot };
    });
    try { localStorage.setItem('cv-config-' + config.modo, JSON.stringify(js)); } catch (e) { /* nada */ }
    var rapido = $('#chk-rapido').checked;
    try { localStorage.setItem('cv-rapido', rapido ? '1' : '0'); } catch (e) { /* nada */ }
    var s = CV.Motor.nuevaPartida({ jugadores: js });
    arrancarLocal({ modo: 'local', estado: s, vel: rapido ? 0.55 : 1 });
  }
  function arrancarLocal(g) {
    partida = { modo: 'local', estado: g.estado, vel: g.vel || 1 };
    guardar();
    ir('juego');
    $('#red-indicador').classList.add('oculto');
    CV.UI.iniciar({
      esLocal: function () { return true; },
      enviar: aplicarLocal,
      enviarBot: aplicarLocal,
      manejaBots: true,
      modo: 'local',
      vel: partida.vel,
      alSalir: salirAlInicio,
      otraVez: function () {
        var js = partida.estado.jugadores.map(function (j) { return { nombre: j.nombre, color: j.color, bot: j.bot }; });
        arrancarLocal({ estado: CV.Motor.nuevaPartida({ jugadores: js }), vel: partida.vel });
      }
    }, partida.estado);
    mostrarGuiaPrimeraVez();
  }
  function aplicarLocal(acc) {
    var r = CV.Motor.aplicar(partida.estado, acc);
    if (r.error) { CV.UI.errorAccion(r.error); return; }
    partida.estado = r.estado;
    if (r.estado.fase === 'fin') borrarGuardado(); else guardar();
    CV.UI.mostrarEstado(r.estado, r.eventos);
  }
  function mostrarGuiaPrimeraVez() {
    var vista = false;
    try { vista = localStorage.getItem('cv-guia-vista') === '1'; } catch (e) { /* nada */ }
    if (!vista) setTimeout(function () { CV.UI.guia(); }, 700);
  }
  function salirAlInicio() {
    CV.UI.detener();
    CV.UI.cerrarModal();
    if (red) { red.cerrar(); red = null; }
    partida = null; sala = null;
    actualizarContinuar();
    ir('inicio');
  }

  /* ---------- Online: pantalla de ingreso ---------- */
  var miColor = CV.COLORES_AUTO[0].hex;
  function pintarColoresOnline() {
    var c = $('#online-colores');
    c.innerHTML = '';
    var s = selectorColores(miColor, [], function (hex) { miColor = hex; try { localStorage.setItem('cv-color', hex); } catch (e) { /* nada */ } pintarColoresOnline(); });
    while (s.firstChild) c.appendChild(s.firstChild);
  }
  function abrirOnline() {
    try {
      $('#online-nombre').value = localStorage.getItem('cv-nombre') || '';
      miColor = localStorage.getItem('cv-color') || miColor;
      if (!$('#online-codigo').value) $('#online-codigo').value = localStorage.getItem('cv-ultima-sala') || '';
    } catch (e) { /* nada */ }
    pintarColoresOnline();
    estadoOnline('', false);
    ir('online');
  }
  function estadoOnline(t, err) { var e = $('#online-estado'); e.textContent = t; e.classList.toggle('error', !!err); }
  function miNombre() {
    var n = $('#online-nombre').value.trim();
    if (!n) { estadoOnline('Escribí tu nombre para que el otro sepa quién sos.', true); $('#online-nombre').focus(); return null; }
    try { localStorage.setItem('cv-nombre', n); } catch (e) { /* nada */ }
    return n;
  }

  /* ---------- Online: anfitrión ---------- */
  function crearSalaOnline(restaurar) {
    var nombre = restaurar ? null : miNombre();
    if (!restaurar && !nombre) return;
    estadoOnline('Creando la sala…');
    sala = {
      rol: 'host', codigo: restaurar ? restaurar.codigo : null,
      asientos: restaurar ? restaurar.asientos : [{ nombre: nombre, color: miColor, bot: false, cid: 'anfitrion', conectado: true }],
      empezada: !!restaurar
    };
    if (restaurar) sala.asientos.forEach(function (a) { a.conectado = a.cid === 'anfitrion' || a.bot; });
    red = CV.Red.crearSala({
      abierta: function (codigo) {
        sala.codigo = codigo;
        if (restaurar) {
          CV.UI.aviso('Sala ' + codigo + ' abierta de nuevo. Los demás pueden volver a entrar con el mismo código.', 'bien');
          return;
        }
        pintarSala();
        ir('sala');
      },
      mensaje: mensajeAnfitrion,
      desconexion: function (cid) {
        var a = buscarAsiento(cid);
        if (!a) return;
        if (!sala.empezada) { sala.asientos.splice(sala.asientos.indexOf(a), 1); pintarSala(); difundirSala(); }
        else { a.conectado = false; CV.UI.aviso('📡 ' + a.nombre + ' se desconectó. Puede volver a entrar con el código ' + sala.codigo + '.', 'mal'); }
      },
      error: function (msg) {
        if (sala && sala.empezada) CV.UI.aviso('📡 ' + msg, 'mal');
        else { estadoOnline(msg, true); var se = $('#sala-estado'); se.textContent = msg; se.classList.add('error'); }
      }
    }, restaurar ? restaurar.codigo : null);
    if (restaurar) arrancarHost(restaurar.estado, restaurar.vel);
  }
  function buscarAsiento(cid) {
    for (var i = 0; i < sala.asientos.length; i++) if (sala.asientos[i].cid === cid) return sala.asientos[i];
    return null;
  }
  function indiceAsiento(cid) {
    for (var i = 0; i < sala.asientos.length; i++) if (sala.asientos[i].cid === cid) return i;
    return -1;
  }
  function mensajeAnfitrion(cid, msg) {
    if (msg.t === 'hola') {
      var a = buscarAsiento(cid);
      if (sala.empezada) {
        if (!a) { red.enviarA(cid, { t: 'error', msg: 'La partida ya empezó. Pedile a quien creó la sala que arme una nueva.' }); return; }
        a.conectado = true;
        red.enviarA(cid, { t: 'inicio', estado: CV.Motor.estadoPublico(partida.estado), asiento: indiceAsiento(cid), vel: partida.vel });
        CV.UI.aviso('📡 ' + a.nombre + ' está conectado/a.', 'bien');
        return;
      }
      if (!a) {
        if (sala.asientos.length >= 6) { red.enviarA(cid, { t: 'error', msg: 'La sala está llena (máximo 6 jugadores).' }); return; }
        var usados = sala.asientos.map(function (x) { return x.color; });
        var col = usados.indexOf(msg.color) >= 0 ? colorLibre(usados) : msg.color;
        sala.asientos.push({ nombre: String(msg.nombre || 'Invitado').slice(0, 14), color: col, bot: false, cid: cid, conectado: true });
        CV.Sonido.tocar('turno');
      } else a.conectado = true;
      pintarSala(); difundirSala();
    } else if (msg.t === 'accion') {
      if (!sala.empezada || !partida) return;
      var idx = indiceAsiento(cid);
      if (!msg.acc || msg.acc.who !== idx) { red.enviarA(cid, { t: 'error', msg: 'No es tu turno.' }); return; }
      aplicarHost(msg.acc, cid);
    }
  }
  function difundirSala() {
    red.difundir(function (cid) {
      return { t: 'sala', codigo: sala.codigo, jugadores: sala.asientos.map(function (a) { return { nombre: a.nombre, color: a.color, bot: a.bot, vos: a.cid === cid }; }) };
    });
  }
  function pintarSala() {
    var esHost = sala.rol === 'host';
    $('#sala-codigo').textContent = sala.codigo || '-----';
    $('#sala-ayuda').textContent = esHost
      ? 'Pasale este código a quien quieras invitar. Cuando estén todos, tocá "Arrancar partida". Pueden ser de 2 a 6 jugadores.'
      : 'Ya estás en la sala. Cuando quien la creó arranque la partida, empieza el juego.';
    $('#sala-host-botones').classList.toggle('oculto', !esHost);
    $('#sala-empezar').classList.toggle('oculto', !esHost);
    var lista = esHost ? sala.asientos.map(function (a) { return { nombre: a.nombre, color: a.color, bot: a.bot, vos: a.cid === 'anfitrion', cid: a.cid }; }) : sala.jugadores;
    var ul = $('#sala-lista');
    ul.innerHTML = '';
    lista.forEach(function (j, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="punto" style="background:' + j.color + '"></span>' + esc(j.nombre) + (j.bot ? ' 🤖' : '') +
        '<small>' + (i === 0 ? 'crea la sala' : (j.bot ? 'la compu' : 'invitado/a')) + (j.vos ? ' · vos' : '') + '</small>';
      if (esHost && i > 0) {
        var b = document.createElement('button');
        b.textContent = '✕';
        b.title = 'Sacar de la sala';
        b.addEventListener('click', function () {
          if (!j.bot) red.enviarA(j.cid, { t: 'error', msg: 'Quien creó la sala te sacó de la partida.' });
          sala.asientos.splice(i, 1); pintarSala(); difundirSala();
        });
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
    if (esHost) {
      $('#sala-empezar').disabled = sala.asientos.length < 2;
      $('#sala-bot').disabled = sala.asientos.length >= 6;
      try { $('#sala-rapido').checked = localStorage.getItem('cv-rapido') === '1'; } catch (e) { /* nada */ }
    }
  }
  function empezarHost() {
    if (sala.asientos.length < 2) return;
    var rapido = $('#sala-rapido').checked;
    try { localStorage.setItem('cv-rapido', rapido ? '1' : '0'); } catch (e) { /* nada */ }
    var s = CV.Motor.nuevaPartida({ jugadores: sala.asientos.map(function (a) { return { nombre: a.nombre, color: a.color, bot: a.bot }; }) });
    sala.empezada = true;
    arrancarHost(s, rapido ? 0.55 : 1);
    red.difundir(function (cid) { return { t: 'inicio', estado: CV.Motor.estadoPublico(s), asiento: indiceAsiento(cid), vel: partida.vel }; });
  }
  function arrancarHost(s, v) {
    partida = { modo: 'host', estado: s, vel: v || 1 };
    guardar();
    ir('juego');
    $('#red-indicador').classList.remove('oculto', 'mal');
    var miAsiento = indiceAsiento('anfitrion');
    CV.UI.iniciar({
      esLocal: function (p) { return p === miAsiento; },
      enviar: function (acc) { aplicarHost(acc, 'anfitrion'); },
      enviarBot: function (acc) { aplicarHost(acc, null); },
      manejaBots: true,
      modo: 'online',
      vel: partida.vel,
      alSalir: salirAlInicio,
      otraVez: function () {
        var ns = CV.Motor.nuevaPartida({ jugadores: sala.asientos.map(function (a) { return { nombre: a.nombre, color: a.color, bot: a.bot }; }) });
        arrancarHost(ns, partida.vel);
        red.difundir(function (cid) { return { t: 'inicio', estado: CV.Motor.estadoPublico(ns), asiento: indiceAsiento(cid), vel: partida.vel }; });
      }
    }, s);
    mostrarGuiaPrimeraVez();
  }
  function aplicarHost(acc, cid) {
    var r = CV.Motor.aplicar(partida.estado, acc);
    if (r.error) {
      if (cid === 'anfitrion') CV.UI.errorAccion(r.error);
      else if (cid) red.enviarA(cid, { t: 'error', msg: r.error });
      return;
    }
    partida.estado = r.estado;
    if (r.estado.fase === 'fin') borrarGuardado(); else guardar();
    var pub = CV.Motor.estadoPublico(r.estado);
    red.difundir({ t: 'estado', estado: pub, eventos: r.eventos });
    CV.UI.mostrarEstado(r.estado, r.eventos);
  }

  /* ---------- Online: invitado ---------- */
  function unirseOnline() {
    var nombre = miNombre();
    if (!nombre) return;
    var codigo = $('#online-codigo').value.trim().toUpperCase();
    if (codigo.length !== 5) { estadoOnline('El código tiene 5 letras o números.', true); return; }
    try { localStorage.setItem('cv-ultima-sala', codigo); } catch (e) { /* nada */ }
    estadoOnline('Buscando la sala ' + codigo + '…');
    sala = { rol: 'invitado', codigo: codigo, jugadores: [], asiento: -1 };
    red = CV.Red.unirse(codigo, {
      datos: function () { return { nombre: nombre, color: miColor }; },
      estado: function (e) {
        var ind = $('#red-indicador');
        if (e === 'conectado') { ind.classList.remove('mal'); if (partida) CV.UI.aviso('📡 Conectado de nuevo.', 'bien'); }
        else { ind.classList.add('mal'); if (partida) CV.UI.aviso('📡 Se cortó la conexión. Reintentando…', 'mal'); else estadoOnline('Reconectando…', true); }
      },
      mensaje: function (msg) {
        if (msg.t === 'sala') {
          sala.jugadores = msg.jugadores;
          if (!partida) { pintarSala(); if (!$('#p-sala').classList.contains('activa')) ir('sala'); }
        } else if (msg.t === 'inicio') {
          sala.asiento = msg.asiento;
          partida = { modo: 'invitado', estado: msg.estado, vel: msg.vel || 1 };
          ir('juego');
          $('#red-indicador').classList.remove('oculto', 'mal');
          CV.UI.iniciar({
            esLocal: function (p) { return p === sala.asiento; },
            enviar: function (acc) { if (!red.enviar({ t: 'accion', acc: acc })) CV.UI.errorAccion('No hay conexión. Esperá a que se reconecte.'); },
            manejaBots: false,
            modo: 'online',
            vel: partida.vel,
            alSalir: salirAlInicio,
            otraVez: null
          }, msg.estado);
          mostrarGuiaPrimeraVez();
        } else if (msg.t === 'estado') {
          if (!partida) return;
          partida.estado = msg.estado;
          CV.UI.mostrarEstado(msg.estado, msg.eventos);
        } else if (msg.t === 'error') {
          if (partida) CV.UI.errorAccion(msg.msg);
          else { estadoOnline(msg.msg, true); ir('online'); }
        }
      },
      error: function (msg) {
        if (partida) CV.UI.aviso('📡 ' + msg, 'mal');
        else { estadoOnline(msg, true); if (red) { red.cerrar(); red = null; } }
      }
    });
  }

  /* ---------- Menú del juego ---------- */
  function menu() {
    var online = partida && partida.modo !== 'local';
    var m = CV.UI.abrirModal('<button class="ico cerrar" data-cerrar>✕</button><h3>☰ Menú</h3>' +
      (online && sala && sala.codigo ? '<p class="sub">Sala online: <b>' + esc(sala.codigo) + '</b>' + (partida.modo === 'host' ? ' — vos sos quien la creó: mantené esta pestaña abierta.' : '') + '</p>' : '<p class="sub">La partida se guarda sola en este dispositivo.</p>') +
      '<div class="acc-btns">' +
      '<button class="btn b-blanco" data-m="todo">🗺️ Ver todo el tablero</button>' +
      '<button class="btn b-blanco" data-m="vel">⚡ Animaciones: ' + (partida && partida.vel < 1 ? 'rápidas' : 'normales') + '</button>' +
      '<button class="btn b-blanco" data-m="guia">💡 Guía rápida</button>' +
      '<button class="btn b-blanco" data-m="reg">📖 Reglamento</button>' +
      '<button class="btn b-naranja" data-m="salir">🏠 ' + (partida && partida.modo === 'invitado' ? 'Salir de la sala' : 'Salir al inicio (queda guardada)') + '</button>' +
      (partida && partida.modo !== 'invitado' ? '<button class="btn b-rojo" data-m="borrar">🗑️ Abandonar y borrar esta partida</button>' : '') +
      '</div>', 'menu');
    m.querySelectorAll('[data-m]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-m');
        CV.UI.cerrarModal();
        if (k === 'todo') CV.Tablero.verTodo();
        else if (k === 'vel') { partida.vel = partida.vel < 1 ? 1 : 0.55; CV.UI.setVel(partida.vel); try { localStorage.setItem('cv-rapido', partida.vel < 1 ? '1' : '0'); } catch (e) { /* nada */ } guardar(); CV.UI.aviso('Animaciones ' + (partida.vel < 1 ? 'rápidas' : 'normales') + '.', 'info'); }
        else if (k === 'guia') CV.UI.guia();
        else if (k === 'reg') CV.UI.reglamento();
        else if (k === 'salir') salirAlInicio();
        else if (k === 'borrar') {
          if (confirm('¿Seguro que querés abandonar y borrar esta partida?')) { borrarGuardado(); salirAlInicio(); }
        }
      });
    });
  }

  /* ---------- Arranque ---------- */
  function init() {
    // Desbloquear audio con el primer toque
    document.addEventListener('pointerdown', function des() { CV.Sonido.desbloquear(); document.removeEventListener('pointerdown', des); });
    $$('[data-ir]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = b.getAttribute('data-ir');
        if (d === 'local' || d === 'solo') abrirConfig(d);
        else if (d === 'online') abrirOnline();
        else ir(d);
      });
    });
    $$('[data-accion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-accion');
        if (a === 'reglamento') CV.UI.reglamento();
        else if (a === 'guia') CV.UI.guia();
        else if (a === 'sonido') { CV.Sonido.alternar(); iconoSonido(); }
        else if (a === 'menu') menu();
      });
    });
    $('#btn-agregar').addEventListener('click', function () { if (config.jugadores.length < 6) { config.jugadores.push(nuevoJugador(false)); pintarConfig(); } });
    $('#btn-agregar-bot').addEventListener('click', function () { if (config.jugadores.length < 6) { config.jugadores.push(nuevoJugador(true)); pintarConfig(); } });
    $('#btn-empezar').addEventListener('click', empezarLocal);
    $('#btn-continuar').addEventListener('click', function () {
      var g = cargado();
      if (!g) return;
      if (g.modo === 'host') crearSalaOnline(g);
      else arrancarLocal(g);
    });
    $('#btn-crear-sala').addEventListener('click', function () { crearSalaOnline(null); });
    $('#btn-unirme').addEventListener('click', unirseOnline);
    $('#online-codigo').addEventListener('keydown', function (e) { if (e.key === 'Enter') unirseOnline(); });
    $('#sala-bot').addEventListener('click', function () {
      if (sala.asientos.length >= 6) return;
      var usados = sala.asientos.map(function (a) { return a.color; });
      var nb = sala.asientos.filter(function (a) { return a.bot; }).length;
      sala.asientos.push({ nombre: NOMBRES_BOT[nb % 5], color: colorLibre(usados), bot: true, cid: 'bot' + Date.now(), conectado: true });
      pintarSala(); difundirSala();
    });
    $('#sala-empezar').addEventListener('click', empezarHost);
    $('#sala-salir').addEventListener('click', function () { if (red) red.cerrar(); red = null; sala = null; ir('online'); });
    $('#btn-copiar').addEventListener('click', function () {
      var url = location.href.split('?')[0].split('#')[0] + '?sala=' + sala.codigo;
      var txt = '¡Vení a jugar La Carrera de la Vida conmigo! Entrá a ' + url + ' (o poné el código ' + sala.codigo + ' en "Jugar online").';
      var hecho = function () { CV.UI.aviso('Invitación copiada. ¡Mandásela por WhatsApp!', 'bien'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, function () { prompt('Copiá este texto:', txt); });
      else prompt('Copiá este texto:', txt);
    });
    $('#z-mas').addEventListener('click', function () { CV.Tablero.zoom(1.25); });
    $('#z-menos').addEventListener('click', function () { CV.Tablero.zoom(0.8); });
    $('#z-todo').addEventListener('click', function () { CV.Tablero.verTodo(); });
    $('#z-seguir').addEventListener('click', function () {
      var s = CV.UI.estado();
      if (s && s.pend && s.pend.who !== undefined) CV.Tablero.seguirJugador(s.pend.who);
    });
    window.addEventListener('beforeunload', function (e) {
      if (partida && partida.modo === 'host' && partida.estado.fase !== 'fin') { e.preventDefault(); e.returnValue = ''; }
    });
    iconoSonido();
    actualizarContinuar();
    // Invitación por enlace: ?sala=CODIGO
    var m = location.search.match(/[?&]sala=([A-Za-z0-9]{5})/);
    if (m) { abrirOnline(); $('#online-codigo').value = m[1].toUpperCase(); estadoOnline('Te invitaron a la sala ' + m[1].toUpperCase() + '. Poné tu nombre y tocá "Unirme".'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
