/* La Carrera de la Vida — jugador automático ("la compu") */
(function (root) {
  'use strict';
  var CV = root.CV = root.CV || {};

  function azar() { return Math.random(); }
  function sueldoMonto(j) { return j.sueldo ? CV.sueldo(j.sueldo).monto : 0; }

  // Devuelve la próxima acción que tomaría la compu en el estado actual
  function decidir(s) {
    var pd = s.pend, p = pd.who, j = s.jugadores[p];
    switch (pd.tipo) {
      case 'orden':
      case 'girarDeNuevo':
      case 'girarVenta':
        return { who: p, a: 'girar' };
      case 'inicio':
        return { who: p, op: azar() < 0.55 ? 'uni' : 'carrera' };
      case 'turno':
        var o = CV.Motor.opcionesTurno(s, p);
        if (o.atleta) return { who: p, a: 'atleta' };
        if (o.devolver && j.dinero >= 90000) return { who: p, a: 'devolver' };
        if (o.seguroAuto && j.dinero >= 40000 && azar() < 0.7) return { who: p, a: 'seguroAuto' };
        if (o.seguroCasa && j.dinero >= CV.casa(j.casa).seguro + 30000) return { who: p, a: 'seguroCasa' };
        if (o.accion && j.dinero >= 130000 && azar() < 0.6) {
          var n = s.mazos.acciones[Math.floor(azar() * s.mazos.acciones.length)];
          return { who: p, a: 'accion', n: n };
        }
        return { who: p, a: 'girar' };
      case 'bifurcacion':
        return { who: p, id: (j.vida.length < 4 || azar() < 0.4) ? pd.opciones[0] : pd.opciones[1] };
      case 'elegirCarrera':
        var mejor = pd.opciones.slice().sort(function (a, b) {
          return puntaje(b) - puntaje(a);
        })[0];
        if (pd.motivo === 'escuela' && sueldoMonto(j) >= 70000) return { who: p, id: null };
        return { who: p, id: mejor };
      case 'elegirCasa':
        var plata = j.dinero;
        var ops = pd.opciones.map(CV.casa).sort(function (a, b) {
          return (b.venta[1] - b.precio) - (a.venta[1] - a.precio);
        });
        var c = ops.filter(function (h) { return h.precio <= plata + 80000; })[0];
        if (!c) c = ops.slice().sort(function (a, b) { return a.precio - b.precio; })[0];
        if (j.prestamos > 6 && azar() < 0.6) return { who: p, id: null };
        return { who: p, id: c.id, seguro: (plata - c.precio) > c.seguro + 20000 };
      case 'venderCasa':
        return { who: p, si: azar() < 0.45 };
      case 'escuela':
        return { who: p, si: sueldoMonto(j) <= 50000 && j.dinero > 40000 };
      case 'cambioSueldo':
        var yo = sueldoMonto(j), mejorJ = null, max = yo;
        s.jugadores.forEach(function (o2, i) {
          if (i !== p && !o2.jubilado && sueldoMonto(o2) > max) { max = sueldoMonto(o2); mejorJ = i; }
        });
        return { who: p, con: mejorJ };
      case 'jubilacion':
        var maxOtros = 0;
        s.jugadores.forEach(function (o3, i) { if (i !== p) maxOtros = Math.max(maxOtros, o3.dinero); });
        return { who: p, op: (j.dinero > maxOtros * 1.1 && j.dinero > 600000) ? 'lomas' : 'valle' };
    }
    return null;
  }
  function puntaje(cid) {
    var c = CV.carrera(cid);
    var base = { violeta: 90, celeste: 70, verde: 50, naranja: 40, rosa: 40 };
    var m = 0;
    c.colores.forEach(function (col) { m = Math.max(m, base[col] || 0); });
    return m + Math.random() * 15;
  }

  CV.Bot = { decidir: decidir };
})(typeof window !== 'undefined' ? window : globalThis);
