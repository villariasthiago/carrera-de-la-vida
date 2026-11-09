<div align="center">

# 🚗 La Carrera de la Vida

### Juego de mesa para jugar en el navegador, con la tablet, contra la compu u online

<br>

<a href="https://villariasthiago.github.io/carrera-de-la-vida/">
  <img src="https://img.shields.io/badge/%E2%96%B6%20%20JUGAR%20AHORA-2%20a%206%20jugadores-f39a4a?style=for-the-badge&labelColor=3c3456" alt="Jugar ahora" height="56">
</a>

<br><br>

🔗 **[villariasthiago.github.io/carrera-de-la-vida](https://villariasthiago.github.io/carrera-de-la-vida/)**

**👆 Hacé click y jugá, sin instalar nada 👆**

<br>

![modo](https://img.shields.io/badge/modo-en%20tablet-4fa3d9?style=flat-square)
![modo](https://img.shields.io/badge/modo-contra%20la%20compu-5dbb7e?style=flat-square)
![modo](https://img.shields.io/badge/modo-online-f39a4a?style=flat-square)
![jugadores](https://img.shields.io/badge/jugadores-2%20a%206-dc7a2b?style=flat-square)
![idioma](https://img.shields.io/badge/idioma-español-7b7494?style=flat-square)

</div>

---

## ✨ ¿Qué es?

Una versión propia del clásico juego de la vida: se elige una carrera, se cobra sueldo, se compra casa y se juntan fichas de Vida mientras el auto recorre un tablero ilustrado.

- Tablero con animaciones suaves, ruleta, cartas que se dan vuelta, confeti y sonidos (sin voces).
- De 2 a 6 jugadores, con rivales manejados por la compu.
- Todo en español rioplatense, con reglamento completo y ayudas en el momento.
- Se guarda solo: si cerrás la pestaña, podés continuar después.

## 🎮 Cómo jugar

| Modo | Para qué |
|---|---|
| 🧑‍🤝‍🧑 **Jugar en este dispositivo** | 2 a 6 personas pasándose la tablet o la compu. |
| 🌐 **Jugar online** | Uno toca **Crear sala** y le pasa el código de 5 letras (o el enlace con **Copiar invitación**). El otro entra a la misma página, toca **Jugar online**, pone el código y **Unirme**. |
| 🤖 **Un jugador** | Vos contra 1 a 5 rivales de la compu. |

- Tocá la ruleta o el botón **Girar** para jugar tu turno.
- Tocá cualquier casilla del tablero para ver qué hace.
- Arrastrá para mover el tablero; pellizcá o usá ＋ / － para el zoom; 🗺️ muestra todo; 🎯 sigue al auto del turno.
- El cartel amarillo 💡 del panel explica cada decisión. El botón 📖 abre el reglamento y 💡 de arriba la guía rápida.
- Tocá la tarjeta de un jugador para ver sus cartas.

El reglamento completo está en [REGLAMENTO.md](REGLAMENTO.md) y dentro del juego.

## 🌐 Sobre el juego online

GitHub Pages solo sirve archivos: no puede correr un servidor. Por eso el juego online funciona **de navegador a navegador** (WebRTC) usando [PeerJS](https://peerjs.com/):

- El navegador de quien crea la sala hace de "anfitrión": aplica las reglas y le manda la partida a los demás. **Tiene que quedar abierto** mientras juegan (si se cierra, se puede retomar con **Continuar partida** y la misma sala vuelve a abrirse con el mismo código).
- Para que los navegadores se encuentren se usa el **servidor público y gratuito de PeerJS** (`0.peerjs.com`). No necesita cuenta ni configuración, pero es un servicio externo: si algún día está caído, el modo online no conecta (los modos de tablet y contra la compu siguen funcionando).
- La librería PeerJS (licencia MIT) está incluida en `js/vendor/`, así que no depende de un CDN.
- En algunas redes muy restringidas (algunas oficinas o datos móviles) la conexión directa puede fallar. En casa, con wifi común, funciona normalmente.
- Si alguien se desconecta, vuelve a entrar con el mismo código y recupera su lugar.

## 📁 Archivos

```
index.html          Página del juego
reglamento.html     Reglamento para ver dentro del juego
REGLAMENTO.md       Reglamento completo (para leer en GitHub)
css/estilos.css     Estilos y animaciones
img/icono.svg       Ícono
js/datos.js         Tablero, carreras, sueldos, casas y fichas de Vida
js/motor.js         Reglas del juego (estado y acciones)
js/bot.js           Jugador automático
js/tablero.js       Tablero ilustrado, autos y cámara
js/ruleta.js        Ruleta animada
js/sonido.js        Sonidos sintetizados
js/ayuda.js         Ayudas y guía rápida
js/interfaz.js      Panel, cartas, ventanas y animaciones
js/red.js           Conexión online
js/app.js           Pantallas y modos de juego
js/vendor/          PeerJS (MIT)
```

## ✏️ Para personalizar

- **Casillas, montos y textos**: `js/datos.js` (sección `CV.SEGMENTOS`).
- **Carreras, sueldos, casas y fichas de Vida**: también en `js/datos.js`.
- **Colores**: variables al principio de `css/estilos.css`.

---

Proyecto personal sin fines de lucro, inspirado en el clásico juego de mesa "El Juego de la Vida". Las ilustraciones, textos de casillas y fichas son propios de esta versión.

<details>
<summary>🚀 Cómo publicarlo en GitHub Pages</summary>

1. Creá un repositorio nuevo en GitHub (por ejemplo `carrera-de-la-vida`).
2. Subí **todos los archivos y carpetas** tal cual están (`index.html`, `reglamento.html`, `css/`, `js/`, `img/`, etc.). Podés arrastrarlos en la web de GitHub con **Add file → Upload files**.
3. Entrá a **Settings → Pages**.
4. En **Build and deployment → Source** elegí **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guardá.
5. Esperá uno o dos minutos. El juego queda en `https://TU-USUARIO.github.io/carrera-de-la-vida/`.

No hace falta instalar nada ni compilar: son archivos estáticos.

</details>

---

## 👋 Más proyectos

<div align="center">

<a href="https://villariasthiago.github.io/e-portfolio/#inicio">
  <img src="https://img.shields.io/badge/%F0%9F%8C%90%20%20Mi%20portafolio-ver%20otros%20proyectos-46e3c9?style=for-the-badge&labelColor=8f7bff" alt="Mi portafolio">
</a>

</div>
