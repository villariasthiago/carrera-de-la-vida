/* La Carrera de la Vida — juego online entre navegadores (PeerJS / WebRTC)
   El navegador que crea la sala es el "anfitrión": aplica las reglas y le manda
   el estado a los demás. No hace falta servidor propio: PeerJS usa su servidor
   público gratuito solo para que los navegadores se encuentren. */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var PREFIJO = 'carrera-vida-ar-';
  var LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function nuevoCodigo() {
    var c = '';
    for (var i = 0; i < 5; i++) c += LETRAS.charAt(Math.floor(Math.random() * LETRAS.length));
    return c;
  }
  function idCliente() {
    var id;
    try { id = localStorage.getItem('cv-cliente'); } catch (e) { /* nada */ }
    if (!id) {
      id = 'c' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem('cv-cliente', id); } catch (e) { /* nada */ }
    }
    return id;
  }
  function hayPeer() { return typeof root.Peer === 'function'; }
  function textoError(err) {
    var t = err && err.type;
    if (t === 'peer-unavailable') return 'No encontramos esa sala. Revisá el código y que quien la creó tenga el juego abierto.';
    if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'No hay conexión con el servidor de salas. Revisá tu internet y probá de nuevo.';
    if (t === 'browser-incompatible') return 'Este navegador no permite jugar online. Probá con Chrome, Edge, Firefox o Safari actualizados.';
    if (t === 'unavailable-id') return 'Ese código ya está en uso.';
    return 'Problema de conexión' + (t ? ' (' + t + ')' : '') + '.';
  }

  /* ---------- Anfitrión ---------- */
  function crearSala(cb, codigoPrevio) {
    if (!hayPeer()) { cb.error('No se pudo cargar el módulo de juego online.'); return null; }
    var codigo = codigoPrevio || nuevoCodigo();
    var conexiones = {}; // idCliente -> conn
    var intentos = 0, cerrado = false;
    var peer;

    function abrir() {
      peer = new root.Peer(PREFIJO + codigo, { debug: 0 });
      peer.on('open', function () { cb.abierta(codigo); });
      peer.on('connection', function (conn) {
        var cid = null;
        conn.on('data', function (msg) {
          if (!msg || typeof msg !== 'object') return;
          if (msg.t === 'hola') {
            cid = String(msg.id || '').slice(0, 20);
            if (conexiones[cid] && conexiones[cid] !== conn) { try { conexiones[cid].close(); } catch (e) { /* nada */ } }
            conexiones[cid] = conn;
          }
          if (cid) cb.mensaje(cid, msg);
        });
        conn.on('close', function () {
          if (cid && conexiones[cid] === conn) { delete conexiones[cid]; cb.desconexion(cid); }
        });
        conn.on('error', function () { /* se maneja en close */ });
      });
      peer.on('disconnected', function () { if (!cerrado) setTimeout(function () { try { peer.reconnect(); } catch (e) { /* nada */ } }, 1500); });
      peer.on('error', function (err) {
        if (err.type === 'unavailable-id' && !codigoPrevio && intentos < 5) {
          intentos++; codigo = nuevoCodigo(); try { peer.destroy(); } catch (e) { /* nada */ }
          abrir(); return;
        }
        cb.error(textoError(err));
      });
    }
    abrir();
    return {
      codigo: function () { return codigo; },
      enviarA: function (cid, msg) { var c = conexiones[cid]; if (c && c.open) { try { c.send(msg); } catch (e) { /* nada */ } } },
      difundir: function (msgPara) {
        Object.keys(conexiones).forEach(function (cid) {
          var c = conexiones[cid];
          if (c && c.open) { try { c.send(typeof msgPara === 'function' ? msgPara(cid) : msgPara); } catch (e) { /* nada */ } }
        });
      },
      conectados: function () { return Object.keys(conexiones); },
      cerrar: function () { cerrado = true; try { peer.destroy(); } catch (e) { /* nada */ } }
    };
  }

  /* ---------- Invitado ---------- */
  function unirse(codigo, cb) {
    if (!hayPeer()) { cb.error('No se pudo cargar el módulo de juego online.'); return null; }
    codigo = String(codigo || '').toUpperCase().trim();
    var cid = idCliente();
    var peer = new root.Peer({ debug: 0 });
    var conn = null, cerrado = false, conectadoAlgunaVez = false, timerRe = null;

    function conectar() {
      if (cerrado) return;
      conn = peer.connect(PREFIJO + codigo, { reliable: true });
      conn.on('open', function () {
        conectadoAlgunaVez = true;
        cb.estado('conectado');
        conn.send({ t: 'hola', id: cid, nombre: cb.datos().nombre, color: cb.datos().color });
      });
      conn.on('data', function (msg) { if (msg && typeof msg === 'object') cb.mensaje(msg); });
      conn.on('close', function () { if (!cerrado) reintentar(); });
      conn.on('error', function () { /* se maneja en close */ });
    }
    function reintentar() {
      cb.estado('reconectando');
      clearTimeout(timerRe);
      timerRe = setTimeout(function () {
        if (peer.disconnected) { try { peer.reconnect(); } catch (e) { /* nada */ } }
        conectar();
      }, 2500);
    }
    peer.on('open', conectar);
    peer.on('disconnected', function () { if (!cerrado) setTimeout(function () { try { peer.reconnect(); } catch (e) { /* nada */ } }, 1500); });
    peer.on('error', function (err) {
      if (conectadoAlgunaVez && (err.type === 'peer-unavailable' || err.type === 'network')) { reintentar(); return; }
      cb.error(textoError(err));
    });
    return {
      enviar: function (msg) { if (conn && conn.open) { try { conn.send(msg); return true; } catch (e) { /* nada */ } } return false; },
      cerrar: function () { cerrado = true; clearTimeout(timerRe); try { peer.destroy(); } catch (e) { /* nada */ } }
    };
  }

  CV.Red = { crearSala: crearSala, unirse: unirse, idCliente: idCliente };
})(window);
