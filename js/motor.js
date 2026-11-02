/* La Carrera de la Vida — motor de reglas (sin interfaz).
   El estado es un objeto JSON plano: se puede guardar y mandar por la red.
   aplicar(estado, accion) -> { estado, eventos } */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var CAS = CV.CASILLAS;

  /* ---------- Azar con semilla (guardada en el estado) ---------- */
  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rint(s, n) { return Math.floor(rnd(s) * n); }
  function mezclar(s, arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rint(s, i + 1), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function sacarAlAzar(s, arr) { return arr.splice(rint(s, arr.length), 1)[0]; }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- Creación de partida ---------- */
  function nuevaPartida(cfg) {
    var s = {
      v: 1,
      rng: (cfg.semilla >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0),
      fase: 'orden',
      jugadores: [],
      orden: [],
      turno: 0,
      nTurno: 0,
      mazos: {},
      lomas: [],
      vidaMapa: {},
      ultimosGiros: [],
      log: [],
      pend: null,
      resultado: null
    };
    cfg.jugadores.forEach(function (j, i) {
      s.jugadores.push({
        nombre: j.nombre, color: j.color, bot: !!j.bot,
        dinero: CV.DINERO_INICIAL, prestamos: 0,
        carrera: null, sueldo: null, titulo: false, verano: null,
        casa: null, seguroCasa: false, seguroAuto: false,
        acciones: [], vida: [], pareja: false, hijos: [],
        pos: null, jubilado: null, tiro: null
      });
    });
    s.mazos.carreras = CV.CARRERAS.map(function (c) { return c.id; });
    s.mazos.sueldos = CV.SUELDOS.map(function (c) { return c.id; });
    s.mazos.casas = CV.CASAS.map(function (c) { return c.id; });
    s.mazos.acciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // Fichas de Vida: claves opacas para que nadie vea el valor hasta el final
    var fichas = mezclar(s, CV.FICHAS_VIDA.map(function (f, i) { return i; }));
    var claves = [];
    fichas.forEach(function (idx) {
      var k = 'k' + Math.floor(rnd(s) * 1e9).toString(36) + idx.toString(36);
      s.vidaMapa[k] = idx;
      claves.push(k);
    });
    s.lomas = claves.splice(0, 4);
    s.mazos.vida = claves;
    s.pend = { tipo: 'orden', who: 0 };
    log(s, '¡Empieza la partida! Cada jugador gira la ruleta para ver quién arranca.');
    return s;
  }

  /* ---------- Utilidades ---------- */
  function log(s, txt) {
    s.log.push(txt);
    if (s.log.length > 80) s.log.shift();
  }
  function nom(s, p) { return s.jugadores[p].nombre; }
  function activos(s) {
    var r = [];
    s.jugadores.forEach(function (j, i) { if (!j.jubilado) r.push(i); });
    return r;
  }
  function titular(s, carreraId) {
    for (var i = 0; i < s.jugadores.length; i++) {
      var j = s.jugadores[i];
      if (!j.jubilado && j.carrera === carreraId) return i;
    }
    return -1;
  }
  function titularVerano(s, carreraId) {
    for (var i = 0; i < s.jugadores.length; i++) {
      var j = s.jugadores[i];
      if (!j.jubilado && j.verano === carreraId) return i;
    }
    return -1;
  }
  function sueldoDe(j) { return j.sueldo ? CV.sueldo(j.sueldo) : null; }

  function cobrar(s, p, monto, motivo, ev) {
    if (monto <= 0) return;
    s.jugadores[p].dinero += monto;
    ev.push({ k: 'dinero', p: p, d: monto, motivo: motivo });
  }
  function pedirPrestamos(s, p, n, ev, auto) {
    if (n <= 0) return;
    var j = s.jugadores[p];
    j.prestamos += n;
    j.dinero += n * CV.PRESTAMO;
    ev.push({ k: 'prestamo', p: p, n: n, auto: !!auto });
    log(s, nom(s, p) + (auto ? ' no tenía suficiente y pidió ' : ' pidió ') + n + (n === 1 ? ' préstamo' : ' préstamos') + ' (' + CV.fmt(n * CV.PRESTAMO) + ').');
  }
  // Paga; si no alcanza, pide préstamos automáticamente (salvo sinPrestamo)
  function pagar(s, p, monto, a, motivo, ev, sinPrestamo) {
    if (monto <= 0) return;
    var j = s.jugadores[p];
    if (!sinPrestamo && j.dinero < monto) {
      pedirPrestamos(s, p, Math.ceil((monto - j.dinero) / CV.PRESTAMO), ev, true);
    }
    j.dinero -= monto;
    ev.push({ k: 'dinero', p: p, d: -monto, motivo: motivo, a: (a === null || a === undefined) ? -1 : a });
    if (a !== null && a !== undefined && a >= 0) {
      s.jugadores[a].dinero += monto;
      ev.push({ k: 'dinero', p: a, d: monto, motivo: motivo, de: p });
    }
  }
  function comision(s, comprador, ev) {
    var v = titular(s, 'vendedor');
    if (v >= 0 && v !== comprador) {
      s.jugadores[v].dinero += 5000;
      ev.push({ k: 'dinero', p: v, d: 5000, motivo: 'Comisión de venta' });
      ev.push({ k: 'aviso', p: v, tono: 'bien', txt: nom(s, v) + ' (Vendedor/a) se lleva $5.000 de comisión.' });
      log(s, nom(s, v) + ' cobró $5.000 de comisión.');
    }
  }

  /* ---------- Fichas de Vida ---------- */
  function tomarVida(s, p, ev, motivo) {
    var j = s.jugadores[p];
    if (s.mazos.vida.length) {
      var k = s.mazos.vida.pop();
      j.vida.push(k);
      ev.push({ k: 'vida', p: p, motivo: motivo || '' });
      log(s, nom(s, p) + ' tomó una ficha de Vida.');
      return;
    }
    // Se acabó la pila: se roba a un rival (no a quien vive en Valle Tranquilo)
    var cand = [], max = 0;
    s.jugadores.forEach(function (o, i) {
      if (i !== p && o.vida.length && o.jubilado !== 'valle') {
        if (o.vida.length > max) { max = o.vida.length; cand = [i]; }
        else if (o.vida.length === max) cand.push(i);
      }
    });
    if (!cand.length) {
      ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'No quedan fichas de Vida para tomar.' });
      return;
    }
    var de = cand[rint(s, cand.length)];
    var o = s.jugadores[de];
    var kk = o.vida.splice(rint(s, o.vida.length), 1)[0];
    j.vida.push(kk);
    ev.push({ k: 'vida', p: p, de: de, motivo: motivo || '' });
    log(s, 'Se acabó la pila: ' + nom(s, p) + ' le sacó una ficha de Vida a ' + nom(s, de) + '.');
  }

  /* ---------- Carreras y sueldos ---------- */
  function puedeTener(j, cid) { return j.titulo || !CV.carrera(cid).titulo; }
  function sacarCarreras(s, p, n, ignorarTitulo) {
    var j = s.jugadores[p];
    var pool = s.mazos.carreras.filter(function (c) { return ignorarTitulo || puedeTener(j, c); });
    if (!pool.length) pool = s.mazos.carreras.slice();
    mezclar(s, pool);
    return pool.slice(0, n);
  }
  function tomarCarrera(s, p, cid, ev) {
    var j = s.jugadores[p];
    var i = s.mazos.carreras.indexOf(cid);
    if (i >= 0) s.mazos.carreras.splice(i, 1);
    if (j.carrera) s.mazos.carreras.push(j.carrera);
    j.carrera = cid;
    ev.push({ k: 'carta', p: p, tipo: 'carrera', id: cid });
    log(s, nom(s, p) + ' ahora es ' + CV.carrera(cid).nombre + '.');
  }
  function sacarSueldo(s, p, ev) {
    var j = s.jugadores[p];
    var car = CV.carrera(j.carrera);
    if (j.sueldo) { s.mazos.sueldos.push(j.sueldo); j.sueldo = null; }
    var mazo = mezclar(s, s.mazos.sueldos.slice());
    var descartes = [], elegido = null;
    for (var i = 0; i < mazo.length; i++) {
      var su = CV.sueldo(mazo[i]);
      if (car.colores.indexOf(su.color) >= 0) { elegido = mazo[i]; break; }
      if (su.color !== 'amarillo') descartes.push(mazo[i]);
    }
    if (!elegido) {
      var resto = mazo.filter(function (id) { return CV.sueldo(id).color !== 'amarillo'; });
      if (resto.length) elegido = resto[0];
    }
    if (!elegido) return;
    s.mazos.sueldos.splice(s.mazos.sueldos.indexOf(elegido), 1);
    j.sueldo = elegido;
    ev.push({ k: 'carta', p: p, tipo: 'sueldo', id: elegido, descartes: descartes.slice(0, 4) });
    log(s, nom(s, p) + ' sacó un sueldo de ' + CV.fmt(CV.sueldo(elegido).monto) + '.');
  }
  function sueldoEstrella(s, p, ev, motivo) {
    var j = s.jugadores[p];
    if (j.sueldo && CV.sueldo(j.sueldo).color === 'amarillo') return false;
    var am = s.mazos.sueldos.filter(function (id) { return CV.sueldo(id).color === 'amarillo'; });
    am.sort(function (a, b) { return CV.sueldo(b).monto - CV.sueldo(a).monto; });
    if (am.length) {
      s.mazos.sueldos.splice(s.mazos.sueldos.indexOf(am[0]), 1);
      if (j.sueldo) s.mazos.sueldos.push(j.sueldo);
      j.sueldo = am[0];
    } else {
      // Intercambio con quien tenga un sueldo amarillo
      var otro = -1;
      s.jugadores.forEach(function (o, i) {
        if (i !== p && otro < 0 && o.sueldo && CV.sueldo(o.sueldo).color === 'amarillo') otro = i;
      });
      if (otro < 0) return false;
      var t = s.jugadores[otro].sueldo;
      s.jugadores[otro].sueldo = j.sueldo;
      j.sueldo = t;
      ev.push({ k: 'aviso', p: otro, tono: 'mal', txt: nom(s, otro) + ' tuvo que darle su sueldo de estrella a ' + nom(s, p) + '.' });
    }
    ev.push({ k: 'carta', p: p, tipo: 'sueldo', id: j.sueldo, estrella: true });
    ev.push({ k: 'festejo', p: p, tipo: 'estrella', txt: motivo });
    log(s, nom(s, p) + ': ' + motivo + ' Sueldo nuevo: ' + CV.fmt(CV.sueldo(j.sueldo).monto) + '.');
    return true;
  }
  function nuevaCarreraAlAzar(s, p, ev) {
    var j = s.jugadores[p];
    if (j.carrera) { s.mazos.carreras.push(j.carrera); j.carrera = null; }
    var op = sacarCarreras(s, p, 1);
    tomarCarrera(s, p, op[0], ev);
    sacarSueldo(s, p, ev);
  }

  /* ---------- Ruleta ---------- */
  function girar(s, p, motivo, ev) {
    var j = s.jugadores[p];
    if (motivo !== 'orden') {
      var cons = titular(s, 'consultor');
      if (cons >= 0 && cons !== p && rnd(s) < 0.06) {
        var falso = 1 + rint(s, 10);
        ev.push({ k: 'giro', p: p, v: falso, trabada: true });
        s.jugadores[cons].dinero += 50000;
        ev.push({ k: 'aviso', p: cons, tono: 'bien', txt: '¡La ruleta se trabó! ' + nom(s, cons) + ' (Consultor/a) la arregla y cobra $50.000. ' + nom(s, p) + ' vuelve a girar.' });
        ev.push({ k: 'dinero', p: cons, d: 50000, motivo: 'Soporte técnico' });
        log(s, 'La ruleta se trabó: ' + nom(s, cons) + ' cobró $50.000 por arreglarla.');
      }
    }
    var v = 1 + rint(s, 10);
    ev.push({ k: 'giro', p: p, v: v });
    if (motivo === 'orden') return v;

    // Acciones de la bolsa: cobran todos los que tengan ese número
    s.jugadores.forEach(function (o, i) {
      if (o.acciones.indexOf(v) >= 0) {
        o.dinero += CV.COBRO_ACCION;
        ev.push({ k: 'dinero', p: i, d: CV.COBRO_ACCION, motivo: 'Acción N.º ' + v });
        ev.push({ k: 'aviso', p: i, tono: 'bien', txt: '¡Salió el ' + v + '! ' + nom(s, i) + ' cobra $10.000 por su acción.' });
      }
    });
    // Policía: el 10 es exceso de velocidad
    if (v === 10 && motivo === 'mover') {
      var pol = titular(s, 'policia');
      if (pol >= 0 && pol !== p) {
        ev.push({ k: 'aviso', p: p, tono: 'mal', txt: '¡Exceso de velocidad! ' + nom(s, p) + ' le paga $10.000 a ' + nom(s, pol) + ' (Policía).' });
        pagar(s, p, 10000, pol, 'Multa por velocidad', ev);
      }
    }
    // Artista: el 1 compra un cuadro
    if (v === 1) {
      var art = titular(s, 'artista');
      if (art >= 0 && art !== p) {
        ev.push({ k: 'aviso', p: p, tono: 'info', txt: '¡Salió el 1! ' + nom(s, p) + ' le compra una obra a ' + nom(s, art) + ' (Artista) por $10.000.' });
        pagar(s, p, 10000, art, 'Compra de una obra', ev);
      }
    }
    // Comediante: dos 8, 9 o 10 seguidos
    s.ultimosGiros.push(v);
    if (s.ultimosGiros.length > 2) s.ultimosGiros.shift();
    if (s.ultimosGiros.length === 2 && s.ultimosGiros[0] === s.ultimosGiros[1] && v >= 8) {
      var com = titular(s, 'comediante');
      if (com >= 0) {
        if (sueldoEstrella(s, com, ev, '¡Dos ' + v + ' seguidos: llegó su gran oportunidad!')) s.ultimosGiros = [];
      }
    }
    return v;
  }

  /* ---------- Movimiento ---------- */
  function ocupada(s, p, id) {
    for (var i = 0; i < s.jugadores.length; i++) {
      if (i !== p && s.jugadores[i].pos === id && !s.jugadores[i].jubilado) return true;
    }
    return false;
  }
  function diaDePago(s, p, ev, pasando) {
    var su = sueldoDe(s.jugadores[p]);
    if (!su) {
      ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'Día de pago, pero ' + nom(s, p) + ' todavía no tiene sueldo.' });
      return;
    }
    ev.push({ k: 'diaPago', p: p, monto: su.monto, pasando: !!pasando });
    cobrar(s, p, su.monto, 'Día de pago', ev);
    log(s, nom(s, p) + ' cobró su sueldo: ' + CV.fmt(su.monto) + '.');
  }
  function mover(s, p, pasos, ev, forzado) {
    var j = s.jugadores[p];
    var camino = [];
    function volcar() { if (camino.length) { ev.push({ k: 'mover', p: p, camino: camino }); camino = []; } }
    while (pasos > 0) {
      var c = CAS[j.pos];
      var sig;
      if (forzado) { sig = [forzado]; forzado = null; }
      else sig = c.sig;
      if (!sig.length) break;
      if (sig.length > 1) {
        volcar();
        s.pend = { tipo: 'bifurcacion', who: p, pasos: pasos, opciones: sig.slice() };
        return;
      }
      j.pos = sig[0];
      pasos--;
      camino.push(j.pos);
      var nc = CAS[j.pos];
      if (CV.ROJAS[nc.t]) { pasos = 0; break; }
      if (pasos > 0 && nc.t === 'pago') { volcar(); diaDePago(s, p, ev, true); }
      if (pasos === 0 && ocupada(s, p, j.pos) && nc.sig.length) {
        pasos = 1;
        if (nc.t === 'pago') { volcar(); diaDePago(s, p, ev, true); }
        ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'Casilla ocupada: avanzás a la siguiente libre.' });
      }
    }
    volcar();
    aterrizar(s, p, ev);
  }

  /* ---------- Qué pasa en cada casilla ---------- */
  function aterrizar(s, p, ev) {
    var j = s.jugadores[p];
    var c = CAS[j.pos];
    ev.push({ k: 'casilla', p: p, id: c.id });
    var aSel, d;
    switch (c.t) {
      case 'pago':
        diaDePago(s, p, ev, false); break;
      case 'cobra':
        cobrar(s, p, c.monto, c.txt, ev); log(s, nom(s, p) + ': ' + c.txt); break;
      case 'paga':
        pagar(s, p, c.monto, null, c.txt, ev); log(s, nom(s, p) + ': ' + c.txt); break;
      case 'trabajo':
        var due = titular(s, c.carrera);
        if (due < 0) due = titularVerano(s, c.carrera);
        if (due === p) {
          ev.push({ k: 'aviso', p: p, tono: 'bien', txt: 'Es una casilla de tu propio trabajo: no pagás nada.' });
          log(s, nom(s, p) + ' cayó en su propia casilla de Trabajo.');
        } else if (due >= 0) {
          pagar(s, p, c.monto, due, c.txt, ev);
          log(s, nom(s, p) + ' le pagó ' + CV.fmt(c.monto) + ' a ' + nom(s, due) + ' (' + CV.carrera(c.carrera).nombre + ').');
        } else {
          pagar(s, p, c.monto, null, c.txt, ev);
          log(s, nom(s, p) + ' le pagó ' + CV.fmt(c.monto) + ' al banco (nadie es ' + CV.carrera(c.carrera).nombre + ').');
        }
        break;
      case 'impuestos':
        var su = sueldoDe(j);
        if (!su) { ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'Sin sueldo no hay impuestos para pagar.' }); break; }
        var cont = titular(s, 'contador');
        if (cont === p) {
          ev.push({ k: 'aviso', p: p, tono: 'bien', txt: 'Sos Contador/a: no pagás impuestos.' });
        } else {
          pagar(s, p, su.impuesto, cont >= 0 ? cont : null, 'Vencimiento de impuestos', ev);
          log(s, nom(s, p) + ' pagó ' + CV.fmt(su.impuesto) + ' de impuestos' + (cont >= 0 ? ' a ' + nom(s, cont) + '.' : ' al banco.'));
        }
        break;
      case 'vida':
        tomarVida(s, p, ev, c.txt); break;
      case 'bebe':
        c.hijos.forEach(function (h) { j.hijos.push(h); });
        ev.push({ k: 'familia', p: p, tipo: c.hijos.length > 1 ? 'mellizos' : (c.hijos[0] === 'f' ? 'nena' : 'nene') });
        log(s, nom(s, p) + ': ' + c.txt.split('!')[0] + '!');
        tomarVida(s, p, ev, c.txt);
        break;
      case 'casarse':
        if (!j.pareja) {
          j.pareja = true;
          ev.push({ k: 'familia', p: p, tipo: 'pareja' });
          log(s, '¡' + nom(s, p) + ' se casó!');
        }
        tomarVida(s, p, ev, 'Casamiento');
        break;
      case 'casa':
        if (j.casa) {
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'Ya tenés casa. No se pueden tener dos al mismo tiempo.' });
        } else {
          s.pend = { tipo: 'elegirCasa', who: p, opciones: sacarCasas(s, 2), motivo: 'casa' };
          return;
        }
        break;
      case 'vendecasa':
        if (j.casa) { s.pend = { tipo: 'venderCasa', who: p }; return; }
        s.pend = { tipo: 'elegirCasa', who: p, opciones: sacarCasas(s, 2), motivo: 'vendecasa' };
        return;
      case 'empleo':
        j.titulo = true;
        s.pend = { tipo: 'elegirCarrera', who: p, opciones: sacarCarreras(s, p, 3), motivo: 'empleo' };
        return;
      case 'jubilacion':
        jubilar(s, p, ev); return;
      case 'despedido':
      case 'crisis':
        ev.push({ k: 'aviso', p: p, tono: 'mal', txt: c.t === 'despedido' ? '¡Te despidieron! Toca empezar de nuevo.' : '¡Crisis de la mediana edad! Cambiás de carrera.' });
        nuevaCarreraAlAzar(s, p, ev);
        break;
      case 'escuela':
        if (j.carrera) { s.pend = { tipo: 'escuela', who: p }; return; }
        break;
      case 'cambiosueldo':
        if (j.sueldo && s.jugadores.some(function (o, i) { return i !== p && o.sueldo && !o.jubilado; })) {
          s.pend = { tipo: 'cambioSueldo', who: p }; return;
        }
        ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'No hay con quién cambiar el sueldo.' });
        break;
      case 'subebolsa':
        if (s.mazos.acciones.length) {
          aSel = sacarAlAzar(s, s.mazos.acciones);
          j.acciones.push(aSel);
          ev.push({ k: 'carta', p: p, tipo: 'accion', id: aSel });
          log(s, nom(s, p) + ' recibió gratis la acción N.º ' + aSel + '.');
        } else ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'No quedan acciones en la pila.' });
        break;
      case 'desplome':
        if (j.acciones.length) {
          aSel = j.acciones.pop();
          s.mazos.acciones.push(aSel);
          ev.push({ k: 'aviso', p: p, tono: 'mal', txt: 'Perdiste la acción N.º ' + aSel + '.' });
          log(s, nom(s, p) + ' perdió la acción N.º ' + aSel + ' en el desplome.');
        } else ev.push({ k: 'aviso', p: p, tono: 'bien', txt: 'No tenías acciones: el desplome no te afecta.' });
        break;
      case 'seguroauto':
        if (j.seguroAuto) {
          ev.push({ k: 'aviso', p: p, tono: 'bien', txt: '¡Tu seguro de auto te cubrió! No pagás nada.' });
        } else {
          pagar(s, p, c.monto, null, c.txt, ev);
          log(s, nom(s, p) + ' pagó ' + CV.fmt(c.monto) + ' por no tener seguro de auto.');
        }
        break;
      case 'segurocasa':
        if (!j.casa) ev.push({ k: 'aviso', p: p, tono: 'bien', txt: 'No tenés casa: no te afecta.' });
        else if (j.seguroCasa) ev.push({ k: 'aviso', p: p, tono: 'bien', txt: '¡El seguro de tu casa te cubrió!' });
        else {
          pagar(s, p, c.monto, null, c.txt, ev);
          log(s, nom(s, p) + ' pagó ' + CV.fmt(c.monto) + ' por no tener seguro de casa.');
        }
        break;
    }
    finCasilla(s, p, ev);
  }

  function finCasilla(s, p, ev) {
    var j = s.jugadores[p];
    if (j.jubilado) { finTurno(s, ev); return; }
    var c = CAS[j.pos];
    if (CV.ROJAS[c.t] || c.t === 'inicioCarrera' || c.t === 'inicioUni') {
      s.pend = { tipo: 'girarDeNuevo', who: p };
    } else finTurno(s, ev);
  }

  function sacarCasas(s, n) {
    var m = mezclar(s, s.mazos.casas.slice());
    return m.slice(0, n);
  }

  function venderCasa(s, p, v, ev) {
    var j = s.jugadores[p];
    var h = CV.casa(j.casa);
    var idx = v <= 3 ? 0 : (v <= 7 ? 1 : 2);
    var monto = h.venta[idx];
    s.mazos.casas.push(j.casa);
    j.casa = null; j.seguroCasa = false;
    ev.push({ k: 'venta', p: p, casa: h.id, monto: monto, giro: v, ganancia: monto - h.precio });
    cobrar(s, p, monto, 'Venta de ' + h.nombre, ev);
    log(s, nom(s, p) + ' vendió su ' + h.nombre + ' en ' + CV.fmt(monto) + '.');
  }

  /* ---------- Jubilación ---------- */
  function jubilar(s, p, ev) {
    var j = s.jugadores[p];
    if (j.prestamos > 0) {
      var tot = j.prestamos * CV.DEVOLUCION;
      ev.push({ k: 'aviso', p: p, tono: 'info', txt: 'Al jubilarte devolvés tus ' + j.prestamos + ' préstamos: ' + CV.fmt(tot) + '.' });
      pagar(s, p, tot, null, 'Devolución de préstamos', ev, true);
      log(s, nom(s, p) + ' devolvió ' + j.prestamos + ' préstamos (' + CV.fmt(tot) + ').');
      j.prestamos = 0;
    }
    if (j.casa) { s.pend = { tipo: 'girarVenta', who: p, motivo: 'jubilacion' }; return; }
    s.pend = { tipo: 'jubilacion', who: p };
  }

  function finTurno(s, ev) {
    var n = s.orden.length;
    for (var k = 1; k <= n; k++) {
      var t = (s.turno + k) % n;
      var p = s.orden[t];
      if (!s.jugadores[p].jubilado) {
        s.turno = t;
        s.nTurno++;
        empezarTurno(s, p, ev);
        return;
      }
    }
    terminarPartida(s, ev);
  }

  function empezarTurno(s, p, ev) {
    var j = s.jugadores[p];
    ev.push({ k: 'turno', p: p });
    if (j.pos === null) { s.pend = { tipo: 'inicio', who: p }; return; }
    // Maestro/a: trabajo de verano
    if (j.carrera === 'maestro' && !j.verano) {
      var todos = activos(s).every(function (i) { return s.jugadores[i].carrera; });
      if (todos && s.mazos.carreras.length) {
        var c = sacarAlAzar(s, s.mazos.carreras);
        j.verano = c;
        ev.push({ k: 'carta', p: p, tipo: 'verano', id: c });
        log(s, nom(s, p) + ' consiguió un trabajo de verano como ' + CV.carrera(c).nombre + '.');
      }
    }
    s.pend = { tipo: 'turno', who: p };
  }

  function terminarPartida(s, ev) {
    s.fase = 'fin';
    // Lomas Millonarias: el más rico se lleva las 4 fichas
    var lomas = [];
    s.jugadores.forEach(function (j, i) { if (j.jubilado === 'lomas') lomas.push(i); });
    if (lomas.length && s.lomas.length) {
      var max = Math.max.apply(null, lomas.map(function (i) { return s.jugadores[i].dinero; }));
      var gan = lomas.filter(function (i) { return s.jugadores[i].dinero === max; });
      var k = 0;
      while (s.lomas.length) { s.jugadores[gan[k % gan.length]].vida.push(s.lomas.pop()); k++; }
      ev.push({ k: 'aviso', p: gan[0], tono: 'bien', txt: (gan.length > 1 ? 'Empate en Lomas Millonarias: se reparten' : nom(s, gan[0]) + ' es quien más plata tiene en Lomas Millonarias y se lleva') + ' las 4 fichas de Vida.' });
    }
    var res = s.jugadores.map(function (j, i) {
      var fichas = j.vida.map(function (k) { return s.vidaMapa[k]; });
      var vv = fichas.reduce(function (a, idx) { return a + CV.FICHAS_VIDA[idx].valor; }, 0);
      return { p: i, dinero: j.dinero, fichas: fichas, valorFichas: vv, total: j.dinero + vv };
    });
    res.sort(function (a, b) { return b.total - a.total; });
    s.resultado = res;
    s.pend = { tipo: 'fin' };
    ev.push({ k: 'fin' });
    log(s, '¡Terminó la partida! Ganó ' + nom(s, res[0].p) + ' con ' + CV.fmt(res[0].total) + '.');
  }

  /* ---------- Acciones disponibles ---------- */
  function opcionesTurno(s, p) {
    var j = s.jugadores[p], o = {};
    o.seguroAuto = !j.seguroAuto && j.dinero >= CV.SEGURO_AUTO;
    o.seguroCasa = !!j.casa && !j.seguroCasa && j.dinero >= CV.casa(j.casa).seguro;
    o.accion = j.acciones.length === 0 && s.mazos.acciones.length > 0 && j.dinero >= CV.PRECIO_ACCION;
    o.devolver = j.prestamos > 0 && j.dinero >= CV.DEVOLUCION;
    o.prestamo = true;
    o.atleta = j.carrera === 'atleta' && j.vida.length >= 4 && !(j.sueldo && CV.sueldo(j.sueldo).color === 'amarillo');
    return o;
  }

  /* ---------- Aplicar una acción ---------- */
  function aplicar(estado, acc) {
    var s = clonar(estado);
    var ev = [];
    var pd = s.pend;
    if (!pd || pd.tipo === 'fin') return { estado: estado, eventos: [], error: 'La partida terminó.' };
    if (acc.who !== pd.who) return { estado: estado, eventos: [], error: 'No es tu turno.' };
    var p = pd.who, j = s.jugadores[p];
    var err = null;

    switch (pd.tipo) {
      case 'orden':
        if (acc.a !== 'girar') { err = 'Acción inválida'; break; }
        var v = girar(s, p, 'orden', ev);
        j.tiro = v;
        log(s, nom(s, p) + ' sacó un ' + v + '.');
        if (p + 1 < s.jugadores.length) { s.pend = { tipo: 'orden', who: p + 1 }; break; }
        var mejor = 0;
        s.jugadores.forEach(function (o, i) { if (o.tiro > s.jugadores[mejor].tiro) mejor = i; });
        s.orden = [];
        for (var i = 0; i < s.jugadores.length; i++) s.orden.push((mejor + i) % s.jugadores.length);
        s.fase = 'juego';
        s.turno = 0;
        ev.push({ k: 'aviso', p: mejor, tono: 'bien', txt: '¡' + nom(s, mejor) + ' sacó el número más alto y arranca!' });
        log(s, 'Arranca ' + nom(s, mejor) + '.');
        empezarTurno(s, mejor, ev);
        break;

      case 'inicio':
        if (acc.op === 'uni') {
          j.pos = 'u0';
          ev.push({ k: 'mover', p: p, camino: ['u0'] });
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' va a la universidad: pide $100.000 prestados para estudiar.' });
          pedirPrestamos(s, p, CV.PRESTAMOS_UNIVERSIDAD, ev, false);
          s.pend = { tipo: 'girarDeNuevo', who: p };
        } else if (acc.op === 'carrera') {
          j.pos = 'car0';
          ev.push({ k: 'mover', p: p, camino: ['car0'] });
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' empieza a trabajar directamente.' });
          var c0 = sacarCarreras(s, p, 1);
          tomarCarrera(s, p, c0[0], ev);
          sacarSueldo(s, p, ev);
          s.pend = { tipo: 'girarDeNuevo', who: p };
        } else err = 'Elegí carrera o universidad';
        break;

      case 'turno':
        var op = opcionesTurno(s, p);
        if (acc.a === 'girar') {
          var g = girar(s, p, 'mover', ev);
          s.pend = null;
          mover(s, p, g, ev);
        } else if (acc.a === 'seguroAuto' && op.seguroAuto) {
          pagar(s, p, CV.SEGURO_AUTO, null, 'Seguro de auto', ev, true);
          j.seguroAuto = true;
          comision(s, p, ev);
          ev.push({ k: 'carta', p: p, tipo: 'seguroAuto' });
          log(s, nom(s, p) + ' compró un seguro de auto.');
        } else if (acc.a === 'seguroCasa' && op.seguroCasa) {
          pagar(s, p, CV.casa(j.casa).seguro, null, 'Seguro de casa', ev, true);
          j.seguroCasa = true;
          comision(s, p, ev);
          ev.push({ k: 'carta', p: p, tipo: 'seguroCasa' });
          log(s, nom(s, p) + ' aseguró su casa.');
        } else if (acc.a === 'accion' && op.accion && s.mazos.acciones.indexOf(acc.n) >= 0) {
          pagar(s, p, CV.PRECIO_ACCION, null, 'Compra de acción', ev, true);
          s.mazos.acciones.splice(s.mazos.acciones.indexOf(acc.n), 1);
          j.acciones.push(acc.n);
          comision(s, p, ev);
          ev.push({ k: 'carta', p: p, tipo: 'accion', id: acc.n });
          log(s, nom(s, p) + ' compró la acción N.º ' + acc.n + '.');
        } else if (acc.a === 'prestamo') {
          pedirPrestamos(s, p, Math.max(1, Math.min(10, acc.n || 1)), ev, false);
        } else if (acc.a === 'devolver' && op.devolver) {
          j.prestamos--;
          pagar(s, p, CV.DEVOLUCION, null, 'Devolución de préstamo', ev, true);
          log(s, nom(s, p) + ' devolvió un préstamo.');
        } else if (acc.a === 'atleta' && op.atleta) {
          for (var q = 0; q < 4; q++) {
            var kk = j.vida.pop();
            s.mazos.vida.splice(rint(s, s.mazos.vida.length + 1), 0, kk);
          }
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' devuelve 4 fichas de Vida.' });
          sueldoEstrella(s, p, ev, '¡Llegó a las grandes ligas!');
        } else err = 'Esa opción no está disponible ahora.';
        break;

      case 'girarDeNuevo':
        if (acc.a !== 'girar') { err = 'Tenés que girar'; break; }
        var g2 = girar(s, p, 'mover', ev);
        s.pend = null;
        mover(s, p, g2, ev);
        break;

      case 'bifurcacion':
        if (pd.opciones.indexOf(acc.id) < 0) { err = 'Elegí un camino'; break; }
        log(s, nom(s, p) + ' eligió el ' + (acc.id === 'f0' ? 'Camino de la familia' : 'Camino del riesgo') + '.');
        s.pend = null;
        mover(s, p, pd.pasos, ev, acc.id);
        break;

      case 'elegirCarrera':
        if (pd.opciones.indexOf(acc.id) < 0) {
          if (pd.motivo === 'escuela' && acc.id === null) {
            ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' se queda con su carrera.' });
            s.pend = null; finCasilla(s, p, ev); break;
          }
          err = 'Elegí una carrera'; break;
        }
        s.pend = null;
        tomarCarrera(s, p, acc.id, ev);
        sacarSueldo(s, p, ev);
        finCasilla(s, p, ev);
        break;

      case 'elegirCasa':
        if (acc.id === null) {
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' decidió no comprar casa por ahora.' });
          s.pend = null; finCasilla(s, p, ev); break;
        }
        if (pd.opciones.indexOf(acc.id) < 0 || j.casa) { err = 'Elegí una casa'; break; }
        var h = CV.casa(acc.id);
        s.pend = null;
        pagar(s, p, h.precio, null, 'Compra: ' + h.nombre, ev);
        s.mazos.casas.splice(s.mazos.casas.indexOf(h.id), 1);
        j.casa = h.id;
        ev.push({ k: 'carta', p: p, tipo: 'casa', id: h.id });
        ev.push({ k: 'festejo', p: p, tipo: 'casa', txt: '¡' + nom(s, p) + ' compró ' + h.nombre + '!' });
        log(s, nom(s, p) + ' compró ' + h.nombre + ' por ' + CV.fmt(h.precio) + '.');
        if (acc.seguro) {
          pagar(s, p, h.seguro, null, 'Seguro de casa', ev);
          j.seguroCasa = true;
          comision(s, p, ev);
          ev.push({ k: 'carta', p: p, tipo: 'seguroCasa' });
          log(s, nom(s, p) + ' aseguró su casa.');
        }
        finCasilla(s, p, ev);
        break;

      case 'venderCasa':
        if (acc.si) { s.pend = { tipo: 'girarVenta', who: p, motivo: 'vendecasa' }; break; }
        ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' se queda con su casa.' });
        s.pend = null; finCasilla(s, p, ev);
        break;

      case 'girarVenta':
        if (acc.a !== 'girar') { err = 'Girá la ruleta'; break; }
        var gv = girar(s, p, 'venta', ev);
        venderCasa(s, p, gv, ev);
        if (pd.motivo === 'jubilacion') s.pend = { tipo: 'jubilacion', who: p };
        else s.pend = { tipo: 'elegirCasa', who: p, opciones: sacarCasas(s, 2), motivo: 'vendecasa' };
        break;

      case 'escuela':
        if (!acc.si) {
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' prefiere no ir a la escuela nocturna.' });
          s.pend = null; finCasilla(s, p, ev); break;
        }
        pagar(s, p, CV.ESCUELA_NOCTURNA, null, 'Escuela nocturna', ev);
        j.titulo = true;
        log(s, nom(s, p) + ' fue a la escuela nocturna.');
        var ops = sacarCarreras(s, p, 2);
        if (!ops.length) { s.pend = null; finCasilla(s, p, ev); break; }
        s.pend = { tipo: 'elegirCarrera', who: p, opciones: ops, motivo: 'escuela' };
        break;

      case 'cambioSueldo':
        if (acc.con === null || acc.con === undefined) {
          ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' se queda con su sueldo.' });
          s.pend = null; finCasilla(s, p, ev); break;
        }
        var o2 = s.jugadores[acc.con];
        if (!o2 || acc.con === p || !o2.sueldo || o2.jubilado) { err = 'Elegí un jugador con sueldo'; break; }
        var tmp = o2.sueldo; o2.sueldo = j.sueldo; j.sueldo = tmp;
        ev.push({ k: 'cambio', p: p, con: acc.con });
        ev.push({ k: 'aviso', p: p, tono: 'info', txt: nom(s, p) + ' cambió su sueldo con ' + nom(s, acc.con) + ': ahora cobra ' + CV.fmt(CV.sueldo(j.sueldo).monto) + '.' });
        log(s, nom(s, p) + ' le cambió el sueldo a ' + nom(s, acc.con) + '.');
        s.pend = null; finCasilla(s, p, ev);
        break;

      case 'jubilacion':
        if (acc.op !== 'valle' && acc.op !== 'lomas') { err = 'Elegí dónde jubilarte'; break; }
        j.jubilado = acc.op; // sus cartas quedan fuera del juego
        ev.push({ k: 'jubilado', p: p, donde: acc.op });
        ev.push({ k: 'festejo', p: p, tipo: 'jubilado', txt: '¡' + nom(s, p) + ' se jubiló en ' + (acc.op === 'valle' ? 'Valle Tranquilo' : 'Lomas Millonarias') + '!' });
        log(s, nom(s, p) + ' se jubiló en ' + (acc.op === 'valle' ? 'Valle Tranquilo' : 'Lomas Millonarias') + '.');
        if (acc.op === 'valle') tomarVida(s, p, ev, 'Jubilación en Valle Tranquilo');
        s.pend = null;
        finTurno(s, ev);
        break;

      default:
        err = 'Estado desconocido';
    }
    if (err) return { estado: estado, eventos: [], error: err };
    return { estado: s, eventos: ev };
  }

  /* ---------- Estado para un invitado (oculta las fichas) ---------- */
  function estadoPublico(s) {
    var c = clonar(s);
    if (c.fase !== 'fin') c.vidaMapa = {};
    return c;
  }

  CV.Motor = {
    nuevaPartida: nuevaPartida,
    aplicar: aplicar,
    opcionesTurno: opcionesTurno,
    estadoPublico: estadoPublico,
    titular: titular,
    activos: activos
  };
})(typeof window !== 'undefined' ? window : globalThis);
