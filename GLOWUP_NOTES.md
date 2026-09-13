# Historial de versiones de los minijuegos

## v6 · 13 de septiembre de 2026 — El día de publicarlo

Nada de mecánica nueva ni de rediseño. Lo que faltaba para que el regalo
aguantara el viaje hasta el celular de Cata.

### Contenido real

- **Las 8 fotos, completas.** Entraron `etapa-3` … `etapa-8` (fotos reales) y
  las dos ilustraciones pasaron de PNG a JPG. Se acabó el degradado de respaldo.
- **La sopa de recuerdos ya es de ustedes.** `memoryWords` pasó de las pistas
  genéricas de relleno a VIERA, PIANO, ONCES, KUTY, SHEERAN y MUSICALA, sacadas
  de `RECUERDOS.md`. Verificado que las 6 caben en la cuadrícula.
- **Tildes.** Los títulos de las canciones y las ocho notas de etapa estaban sin
  acentos. El peor caso decía «tantos anos» en vez de «tantos años».

### Peso: 76 MB → 25 MB

Importa porque si lo abre con datos, cada etapa le descargaba una canción entera.

- **Canciones**: de 320 kbps a 128 kbps estéreo. 60 MB → 23 MB, mismas
  duraciones, sin pérdida audible en un celular.
- **Fotos**: 15,7 MB → 1,2 MB (máx. 1400 px, JPEG calidad 82, EXIF aplicado y
  luego limpiado).
- Los originales quedan en `_originales/`, fuera de lo que se publica y con
  `.gitignore` para que no se suban.

### Recortes que enderezan dos puzzles

Las fotos se recortaron al aspecto que pide cada tablero, así que ya no se
estiran:

- `etapa-1.jpg` → 3:4, que es la forma del rompecabezas (3 columnas × 4 filas).
  Antes una foto apaisada se estiraba 2,4× a lo alto.
- `etapa-7.jpg` → 1:1, que es la forma del deslizante 4×4.

### Un bug de verdad, en la última pantalla

`showClosingScreen()` añadía la clase `.is-visible` dentro de un
`requestAnimationFrame`. Si la pestaña no está compositando en ese instante
(pantalla apagada, app en segundo plano, otra ventana encima) el rAF no dispara
y la pantalla final se queda en `opacity: 0`: en blanco. Justo la pantalla que
dice «Feliz cumpleaños, Cata».

Se cambió por `setTimeout`, que es la misma solución que ya llevaba
`showStageCheer` por este mismo motivo. Igual en el sobre de la carta.

### El nonograma: saber que vas bien

Probándolo en serio apareció el problema. El tablero está bien —un solver
exhaustivo confirma que tiene **exactamente una solución** y que es el corazón—
pero a mitad de camino no había forma de saberlo: con 58 de 70 casillas
pintadas seguías sin poder confirmar ni una sola fila, y la sensación era que
podías estar construyendo algo que tocaría borrar entero.

Le faltaba la única ayuda que tienen todos los nonogramas: **la pista de una
fila o columna se apaga y se tacha cuando lo pintado ya coincide con sus
números.** No señala errores, no adelanta nada, solo confirma lo que ya está
resuelto. Las ✕ no cuentan, solo lo pintado.

De paso, los números pasaron de 0.6rem a 0.68rem en celular. A 9 px el tachado
no se veía y los números costaban de leer, que era justo la otra mitad de la
queja.

---

### El bug que cerraba la etapa en cada movimiento

Mover una pieza del puzzle deslizante cerraba la etapa entera. La causa:
`slideAt()` llama a `render()`, que hace `board.innerHTML = ""` y reconstruye
las 16 casillas **mientras el evento `click` todavía está subiendo**. Cuando
ese click llegaba al `<dialog>`, la casilla tocada ya no existía en el DOM,
`event.target.closest(".modal-card")` devolvía `null`, y el handler de «tocar
fuera para cerrar» creía que el toque había sido en el fondo.

El mismo patrón estaba latente en sokoban (su tablero también se reconstruye
en el handler) y en el rompecabezas, donde además soltar una pieza fuera de la
tarjeta generaba un click con `target === dialog`.

Arreglado con la comprobación estándar de `<dialog>`: un toque en el fondo
llega con `target` === el propio dialog, así que comparar por identidad es
exacto y no depende de que el DOM siga en pie. Y solo cierra si el gesto
**también empezó** en el fondo, que es lo que evita el cierre accidental al
arrastrar.

---

### El enlace al compartirlo

- `og:image` apuntaba a una ruta relativa, y **WhatsApp las ignora**: la tarjeta
  salía vacía. Ahora hay una `assets/img/share.jpg` de 1200×630 hecha con los
  colores de la app (sin spoilers de fotos) y dos líneas marcadas `CAMBIAR` en
  `index.html` para poner la URL absoluta al publicar.
- El icono de «añadir a pantalla de inicio» era la foto de la etapa 1 en PNG de
  2 MB. Ahora es `icono-180.png`, la misma nota musical del favicon, 2 KB.

### Verificación hecha

Con servidor local a 375 px: los 8 puzzles montan sin errores de consola, las 8
fotos cargan con la orientación correcta, autoplay real con la duración leída,
las 6 pistas nuevas salen en la sopa, la carta se escribe y se salta, la
pantalla de cierre queda en `opacity: 1`, y sin desbordamiento horizontal.

En el sitio ya publicado se repitió la prueba: PIN, mapa, y cinco
movimientos seguidos del deslizante sin que la etapa se cierre.

El nonograma se verificó aparte: solver exhaustivo (1 sola solución, es el
corazón), y el tablero resuelto a mano desde el estado a medio hacer, viendo
tacharse las 10 pistas de fila y liberarse las 8 palabras.

---

## v5 · Agosto 2026 — Pulido final antes del regalo

Nada de mecánica. Son los detalles que solo se notan el día que otra persona
abre la app en su celular.

- **Icono propio** (SVG inline, sin archivos extra) para la pestaña y para
  cuando se guarde en la pantalla de inicio, más `theme-color`, meta de
  `apple-mobile-web-app` y tarjeta `og:` para que el enlace no se vea vacío al
  compartirlo por WhatsApp.
- **Cache-busting en todos los archivos** (`?v=20260830`). Antes solo `app.js`
  lo tenía, y con una versión vieja fija: si se corregía algo después de mandar
  el enlace, el navegador seguía sirviendo el JS anterior. **Al cambiar
  cualquier archivo hay que subir ese número en `index.html`.**
- **Reiniciar progreso dejó de ser un botón grande** junto a «Empezar el
  viaje». Era la única acción destructiva y tenía el mismo peso visual que la
  principal. Ahora es un enlace apagado debajo.
- **Escape cierra el modal por el camino correcto.** El `<dialog>` se cerraba
  solo con Escape, saltándose la animación de salida y el fade de la canción.
  Se intercepta el evento `cancel`.
- **La carta se puede saltar y releer.** Escribirse sola tarda ~25 s: ahora se
  completa tocándola (o con Enter/Espacio/Escape) y hay un botón «Leer la carta
  otra vez» en la pantalla de cierre.
- **Volver a medio camino entra directo al mapa** en vez de exigir pasar otra
  vez por la portada.
- **La fecha «Mayo 2026» salió de la pantalla de cierre.** Una fecha equivocada
  es de lo poco que puede estropear un regalo así; sin ella no envejece mal.
- **Código muerto fuera:** se borró la carpeta `games/` y se podaron 300 reglas
  de `styles.css` (64 KB → 26 KB), todas de los minijuegos viejos. Ninguna clase
  se construye dinámicamente, así que la poda se pudo hacer por análisis
  estático y se verificó después etapa por etapa.

### Verificación hecha

Con servidor local a 375 px: los 8 puzzles montan sin errores de consola (solo
los 404 conocidos de las fotos que faltan), sin desbordamiento horizontal,
Escape cerrando bien, carta saltable y releíble, y entrada directa al mapa con
progreso guardado.

---

## v4 · Agosto 2026 — Capa de pulido

No cambia ninguna mecánica: cambia cómo se *siente*. Todo lo nuevo vive en
`polish.css`, `engine/player.js` y `engine/sfx.js`, así que se puede quitar el
`<link>` de `polish.css` y la app sigue funcionando, solo más plana.

### Música

- **La canción arranca sola al abrir cada etapa**, con fade-in de ~900 ms.
  Funciona porque abrir una etapa siempre viene de un clic, que es el gesto que
  el navegador exige para permitir autoplay. Si aun así lo bloquea, el botón se
  pone a pulsar con el texto «Toca ▶ para escucharla» en vez de fallar callado.
- Al cerrar la etapa hace fade-out en vez de cortarse de golpe.
- **Ducking**: la etapa 6 (reto de oído) avisa por los eventos `hbc:duck` /
  `hbc:unduck` y la canción de fondo se baja mientras suena el fragmento. Esa
  etapa además no autoplaya, porque tener una de las ocho sonando sería a la
  vez pista e interferencia.
- Se reemplazó el `<audio controls>` nativo (se ve distinto en cada navegador)
  por un reproductor propio: play/pausa, ecualizador que solo se mueve cuando
  de verdad suena, barra de avance arrastrable y tiempos.

### Sonido y háptica de interfaz

`engine/sfx.js` sintetiza todo con WebAudio: cero archivos, cero peso. Teclas
del PIN, error, arpegio de acierto, desbloqueo. Las ocho palabras reveladas
suben por una pentatónica, así que resolver un puzzle suena a melodía. Vibración
donde el dispositivo la soporta. Hay un botón **Efectos** para silenciarlo y la
preferencia se recuerda.

### Visual

- Celebración al completar etapa: la frase de los ocho pedazos se lee entera,
  en grande, palabra por palabra. Es el único momento en que el mensaje deja de
  verse como pastillas sueltas.
- Anillo de progreso animado de verdad (`@property --progress`).
- Tarjetas: entrada escalonada la primera vez, brillo que cruza la siguiente
  etapa disponible, sacudida al tocar una bloqueada, destello al completar.
- Modal con entrada y salida animadas; foto de etapa que entra desenfocada.
- Palabra recién revelada con rebote y destello; contador que da un salto.
- PIN: tecla que se hunde (también con teclado físico) y puntos dorados antes
  de entrar.
- Anillos de foco visibles para teclado, y `prefers-reduced-motion` apaga todo
  lo decorativo sin que ningún estado deje de ser legible.

### Verificación hecha

Con servidor local, a 375 px y en escritorio: autoplay real (audio avanzando y
duración leída), fade y ducking, etapa 6 sin autoplay, celebración completa,
reapertura de etapa ya resuelta con 8/8 restaurado, tarjeta bloqueada, botón de
efectos persistido, sin desbordamiento horizontal y sin errores de consola
salvo los 404 ya conocidos de las fotos que faltan.

---

## v3 · Agosto 2026 — Motor de puzzles

Reestructuración completa. El diagnóstico fue que los juegos no fallaban por
estar mal programados, sino porque la arquitectura los obligaba a ser flojos.

### Los tres problemas de raíz

1. **`completeWithWords` acoplaba la recompensa a la mecánica.** Cada juego
   tenía que entregar exactamente 8 palabras, así que todos terminaban siendo
   *"repite lo mismo 8 veces"*. Ningún puzzle podía ser un solo reto grande.
2. **Sin capa de puntero.** Todo era una grilla de `<button>`, así que el "Flow"
   se tocaba casilla por casilla en vez de arrastrarse, y la "constelación" no
   se trazaba.
3. **Shell único.** Los 8 juegos se veían y se sentían idénticos por fuera.

### Lo que se hizo

- Motor nuevo en `engine/`: shell reutilizable pero con piel por puzzle, RNG con
  semilla, guardado de partidas, carga de fotos con respaldo y helpers de
  arrastre que funcionan igual con dedo y con mouse.
- Recompensa desacoplada: cada puzzle declara `milestones` y el shell reparte
  las 8 palabras. Un puzzle puede ser un solo reto grande.
- Ocho puzzles de géneros realmente distintos en `puzzles/`.
- `puzzles.css` aparte, todo bajo el prefijo `.pz`, sin tocar el CSS viejo.
- Mobile-first: se recupera el padding del modal en celular para que ninguna
  celda quede por debajo de ~22px.

### Verificación hecha

- Los 8 puzzles montan sin errores en consola.
- Reparto de hitos: `milestones: 3` → 3, 5, 8 palabras, sin duplicados y con un
  solo disparo de `onSolved`.
- Sokoban: los 3 niveles pasados por un solver BFS exhaustivo (11, 16 y 33
  movimientos óptimos). El orden se ajustó para que la curva suba.
- Constelación: grafo con exactamente 2 vértices de grado impar y 8 aristas.
- Flow: 30 semillas distintas, todas con 5 pares sobre 36 casillas.
- Arrastre real probado con eventos de puntero simulados en la sopa de letras y
  en el Flow (sopa: 6/6 palabras encontradas y etapa resuelta).
- Sin desbordamiento horizontal a 375px en ninguna etapa.

### Lo que NO se tocó

PIN, mapa de etapas, textos, canciones, carta final con typewriter, pantalla de
cierre y estética general. La carpeta `games/` quedó en el repo pero ya no está
conectada; se puede borrar.

---

## v2 · Junio 2026 — Glow up de minijuegos

Los minijuegos pasaron de botones decorados a retos con mecánica real,
inspirados en Lights Out, Flow, Mastermind, Minesweeper, Concentration, Simon y
dibujos de una línea. Buena intención, pero se estrelló contra el límite de la
arquitectura: cada juego seguía obligado a entregar 8 palabras, así que todos
quedaron fragmentados en 8 micro-niveles. Ese fue justamente el problema que
resolvió v3.

---

## v1 — Primera versión

Ocho minijuegos simples, uno por etapa, más decorativos que retadores.
