# 🚗 La Carrera de la Vida

Juego de mesa de la carrera de la vida para jugar en el navegador: en una tablet o compu compartida, contra la compu u online, cada uno desde su casa.

- Tablero ilustrado con animaciones suaves, ruleta, cartas que se dan vuelta, confeti y sonidos (sin voces).
- De 2 a 6 jugadores, con rivales manejados por la compu.
- Todo en español rioplatense, con reglamento completo y ayudas en el momento.
- Se guarda solo: si cerrás la pestaña, podés continuar después.

## 🚀 Cómo publicarlo en GitHub Pages

1. Creá un repositorio nuevo en GitHub (por ejemplo `carrera-de-la-vida`).
2. Subí **todos los archivos y carpetas** tal cual están (`index.html`, `reglamento.html`, `css/`, `js/`, `img/`, etc.). Podés arrastrarlos en la web de GitHub con **Add file → Upload files**.
3. Entrá a **Settings → Pages**.
4. En **Build and deployment → Source** elegí **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guardá.
5. Esperá uno o dos minutos. El juego queda en `https://TU-USUARIO.github.io/carrera-de-la-vida/`.

No hace falta instalar nada ni compilar: son archivos estáticos.

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
