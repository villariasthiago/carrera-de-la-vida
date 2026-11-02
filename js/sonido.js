/* La Carrera de la Vida — sonidos sintetizados (sin archivos, sin voces) */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};
  var ctx = null, master = null;
  var activo = true;
  try { activo = localStorage.getItem('cv-sonido') !== 'no'; } catch (e) { /* sin storage */ }

  function asegurar() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // Una nota suave con envolvente
  function nota(f, t0, dur, tipo, vol, fFin) {
    var c = asegurar(); if (!c || !activo) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(f, c.currentTime + t0);
    if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, c.currentTime + t0 + dur);
    var v = vol || 0.25;
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(v, c.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(master);
    o.start(c.currentTime + t0);
    o.stop(c.currentTime + t0 + dur + 0.05);
  }
  function ruido(t0, dur, vol, desde, hasta) {
    var c = asegurar(); if (!c || !activo) return;
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(desde || 800, c.currentTime + t0);
    f.frequency.exponentialRampToValueAtTime(hasta || 3000, c.currentTime + t0 + dur);
    f.Q.value = 1.2;
    var g = c.createGain(); g.gain.value = vol || 0.2;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(c.currentTime + t0);
  }

  var S = {
    tick: function () { nota(1500, 0, 0.035, 'triangle', 0.12); },
    paso: function (i) { nota(520 + (i % 4) * 40, 0, 0.09, 'sine', 0.16, 760 + (i % 4) * 40); },
    clic: function () { nota(660, 0, 0.06, 'sine', 0.12, 880); },
    moneda: function () { nota(988, 0, 0.09, 'square', 0.07); nota(1319, 0.08, 0.22, 'square', 0.07); },
    caja: function () { // día de pago
      nota(784, 0, 0.1, 'triangle', 0.18); nota(988, 0.09, 0.1, 'triangle', 0.18);
      nota(1175, 0.18, 0.1, 'triangle', 0.18); nota(1568, 0.27, 0.35, 'triangle', 0.16);
      ruido(0.27, 0.25, 0.06, 4000, 8000);
    },
    paga: function () { nota(523, 0, 0.12, 'triangle', 0.16, 440); nota(392, 0.1, 0.22, 'triangle', 0.14, 330); },
    carta: function () { ruido(0, 0.22, 0.18, 600, 3500); nota(880, 0.12, 0.12, 'sine', 0.08); },
    vida: function () { nota(1047, 0, 0.12, 'sine', 0.16); nota(1319, 0.1, 0.12, 'sine', 0.16); nota(1760, 0.2, 0.3, 'sine', 0.14); },
    alto: function () { nota(330, 0, 0.16, 'square', 0.07); nota(262, 0.17, 0.26, 'square', 0.07); },
    error: function () { nota(220, 0, 0.18, 'sawtooth', 0.05); },
    festejo: function () {
      var n = [523, 659, 784, 1047, 784, 1047, 1319];
      n.forEach(function (f, i) { nota(f, i * 0.09, i === n.length - 1 ? 0.5 : 0.14, 'triangle', 0.16); });
      ruido(0.6, 0.4, 0.05, 5000, 9000);
    },
    bebe: function () {
      [1319, 1568, 1760, 2093].forEach(function (f, i) { nota(f, i * 0.12, 0.22, 'sine', 0.13); });
    },
    boda: function () {
      [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { nota(f, i * 0.16, 0.3, 'sine', 0.15); nota(f / 2, i * 0.16, 0.3, 'triangle', 0.06); });
    },
    turno: function () { nota(784, 0, 0.1, 'sine', 0.12); nota(1047, 0.09, 0.18, 'sine', 0.12); },
    trabada: function () { ruido(0, 0.35, 0.18, 200, 600); nota(150, 0, 0.3, 'sawtooth', 0.05, 90); },
    victoria: function () {
      var m = [523, 523, 523, 659, 784, 659, 784, 1047];
      var d = [0, .14, .28, .42, .62, .9, 1.04, 1.24];
      m.forEach(function (f, i) { nota(f, d[i], i === m.length - 1 ? 0.8 : 0.16, 'triangle', 0.17); nota(f / 2, d[i], 0.16, 'sine', 0.08); });
    },
    motor: function () { nota(110, 0, 0.35, 'sawtooth', 0.025, 180); }
  };

  CV.Sonido = {
    tocar: function (n, a) { if (!activo) return; try { if (S[n]) S[n](a); } catch (e) { /* nada */ } },
    activo: function () { return activo; },
    alternar: function () {
      activo = !activo;
      try { localStorage.setItem('cv-sonido', activo ? 'si' : 'no'); } catch (e) { /* nada */ }
      if (activo) { asegurar(); S.clic(); }
      return activo;
    },
    desbloquear: function () { asegurar(); }
  };
})(window);
