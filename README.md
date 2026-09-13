# Ocho canciones para Cata

App web sorpresa de cumpleaños para Cata. Ocho años, ocho canciones, ocho etapas,
ocho puzzles y una carta final que solo se abre al terminarlo todo.

Este README debe mantenerse actualizado porque la conversación puede borrarse
para conservar la sorpresa.

---

## Estado actual

**13 de septiembre de 2026 — listo para publicar (v6).**

Se completaron las 8 fotos, se personalizaron las pistas de la sopa de
recuerdos, se corrigieron las tildes de los títulos y las notas, el sitio bajó
de 76 MB a 25 MB y se arregló un bug que podía dejar la pantalla final en
blanco. Detalle en `GLOWUP_NOTES.md`.

> ⚠️ **Al editar cualquier archivo, sube el `?v=20260913c` en `index.html`.**
> Si no, el navegador de Cata puede seguir sirviendo la versión vieja.
>
> Ojo: el `?v=` solo cubre `app.js` y los CSS. Los módulos de `engine/` y
> `puzzles/` se importan sin versión, así que si los editas **después** de
> mandar el enlace, quien ya entró puede quedarse con los viejos. Lo más
> sencillo es no tocarlos una vez compartido.

**Agosto 2026 — pulido final (v5).**

Detalles de última milla: icono propio y metadatos para celular y para
compartir el enlace, cache-busting en todos los archivos, «Reiniciar progreso»
degradado a enlace discreto, Escape cerrando el modal por el camino correcto,
carta final saltable y releíble, y entrada directa al mapa si ya hay progreso.

**Agosto 2026 — capa de pulido (v4) sobre el motor de puzzles (v3).**

Lo último que se agregó: la canción de cada etapa **empieza a sonar sola al
abrir la etapa**, con fade-in y fade-out, sobre un reproductor propio en vez del
`<audio controls>` nativo; efectos de sonido y vibración sintetizados para el
PIN, los aciertos y los desbloqueos (con botón para silenciarlos); y una tanda
de animaciones: celebración con la frase completa al terminar cada etapa,
anillo de progreso animado, tarjetas con entrada escalonada y brillo en la
siguiente disponible. Detalle en `GLOWUP_NOTES.md`.

**Agosto 2026 — reestructuración del motor de puzzles.**

Los ocho minijuegos anteriores se reemplazaron por ocho puzzles de géneros
distintos, montados sobre un motor propio. Lo que se conservó intacto: pantalla
de PIN, mapa de etapas, textos, canciones, carta final con typewriter y la
estética general.

Código de acceso: `0808`.

---

## Por qué se reestructuró

La versión anterior tenía un problema de arquitectura, no de programación:

1. **El contrato de "8 palabras" era una camisa de fuerza.** `completeWithWords`
   obligaba a cada juego a entregar exactamente 8 recompensas, así que todo
   puzzle terminaba siendo *"haz lo mismo 8 veces"*: 8 tableros de Lights Out,
   8 checkpoints, 8 parejas. Ningún reto podía ser una sola solución grande.
2. **Todo era una grilla de `<button>`.** Sin capa de puntero ni canvas, los
   géneros que necesitan gesto (Flow, constelaciones) degeneraban en clics.
3. **Los 8 juegos compartían el mismo shell**, así que se sentían el mismo juego
   ocho veces aunque la mecánica cambiara.

La solución fue **desacoplar la recompensa de la mecánica**: ahora cada puzzle
declara cuántos *hitos* tiene y libera pedazos del mensaje cuando quiere.

---

## Estructura de archivos

```txt
HBC2026/
├── RECUERDOS.md        Los recuerdos reales, en bruto (fuente de los textos)
├── index.html          Estructura general (PIN, mapa, modal, carta)
├── app.js              Datos de etapas, progreso, carta final
├── styles.css          Estilos de la app (chrome general)
├── puzzles.css         Estilos del motor de puzzles (todo bajo .pz)
├── polish.css          Capa de pulido: reproductor, animaciones, foco
│
├── engine/
│   ├── index.js        Monta el puzzle de una etapa
│   ├── shell.js        Carcasa común: título, medidor, hitos, pistas, estado
│   ├── rng.js          Random con semilla (tableros deterministas por etapa)
│   ├── pointer.js      Helpers de arrastre unificado (mouse + dedo)
│   ├── store.js        Guardado de partidas a medio hacer
│   ├── player.js       Reproductor de la canción (autoplay, fades, ducking)
│   ├── sfx.js          Sonidos de interfaz sintetizados + vibración
│   └── media.js        Carga de fotos con respaldo generado si falta el archivo
│
├── puzzles/
│   ├── index.js         Registro de los 8 puzzles
│   ├── jigsaw.js        Rompecabezas de foto (arrastre e intercambio)
│   ├── flow.js          Numberlink / Flow con arrastre continuo
│   ├── wordsearch.js    Sopa de letras con pistas personales
│   ├── sokoban.js       Empujar estrellas a sus huecos
│   ├── nonogram.js      Picross 10×10 que dibuja un corazón
│   ├── earworm.js       Adivinar cuál de las 8 canciones suena
│   ├── slide.js         Puzzle deslizante 4×4 sobre una foto
│   └── constellation.js Trazo de una sola línea (camino euleriano)
│
├── assets/
│   ├── audio/          Las 8 canciones (.mp3, 128 kbps)
│   └── img/            etapa-1 … etapa-8, share.jpg, icono-180.png
│
└── _originales/        Fotos y canciones sin comprimir. NO se publica
    ├── audio/          (está en .gitignore)
    └── img/
```

---

## Los 8 puzzles

Cada etapa tiene un género distinto. La curva de dificultad sube hacia el medio
y afloja en la etapa 6 antes del tramo final.

| Etapa | Puzzle | Género | Qué hay que hacer |
|---|---|---|---|
| 1 | `jigsaw` | Espacial · arrastre | Rompecabezas de 12 piezas sobre una foto real. Se arrastra una pieza sobre otra para intercambiarlas. |
| 2 | `flow` | Ruteo · arrastre | Unir 5 pares de puntos arrastrando, sin cruzar caminos y **llenando el tablero completo**. |
| 3 | `wordsearch` | Verbal · personal | Sopa de letras 11×11 donde cada pista es un recuerdo de ustedes. |
| 4 | `sokoban` | Planeación | Tres tableros de empujar estrellas. Soluciones óptimas de 11, 16 y 33 movimientos. |
| 5 | `nonogram` | Lógica pura | Picross 10×10. El más difícil, a propósito, porque va en la mitad. |
| 6 | `earworm` | Oído musical | Suenan 7 segundos de una canción del regalo; hay que adivinar cuál. Seis rondas. |
| 7 | `slide` | Espacial · secuencia | Puzzle deslizante 4×4 sobre una foto. El barajado siempre es solucionable. |
| 8 | `constellation` | Grafos · trazo | Dibujar 8 líneas de un solo trazo sin repetir ninguna. Solo dos estrellas sirven para empezar. |

**Ningún tablero está puesto a ojo.** Todos son correctos por construcción o
verificados con solver:

- **Flow** genera un camino hamiltoniano aleatorio y lo corta en 5 tramos, así
  que siempre existe solución y siempre llena la grilla.
- **Sokoban**: los 3 niveles se verificaron con un solver BFS exhaustivo.
- **Slide**: se baraja aplicando movimientos legales desde el estado resuelto.
- **Constelación**: el grafo tiene exactamente 2 vértices de grado impar, que es
  justo la condición para que exista camino euleriano.

---

## Dónde está publicado

- Sitio: **https://alekcaballero20.github.io/hbc26/**
- Repo: https://github.com/AlekCaballero20/hbc26 (público, rama `main`, Pages
  sirviendo desde la raíz)

Para actualizarlo: `git add -A && git commit -m "..." && git push`. Pages
reconstruye solo en un minuto o dos. Acuérdate de subir el `?v=` de
`index.html` si cambiaste CSS o `app.js`.

---

## Cómo probarlo

Usa módulos ES, así que **no funciona abriendo `index.html` como archivo suelto**.
Necesita un servidor:

```bash
python -m http.server 8000
```

Y abrir `http://localhost:8000`.

Recomendación: probar en el celular real, o al menos en el modo responsive del
navegador a 375px de ancho, porque está diseñado mobile-first.

---

## Qué queda pendiente

Lo crítico ya está hecho. Lo que sigue es opcional y se puede hacer después de
haberlo regalado.

### 1. Los textos de las etapas

Las `description` y `note` de cada etapa en `app.js` siguen siendo genéricas, y
hablan de la pareja en tercera persona («lo que solo ustedes entienden») aunque
el resto de la app le habla a Cata de tú. Cuando `RECUERDOS.md` tenga los años
3 a 8, esos textos son lo siguiente que vale la pena cambiar por recuerdos
reales.

### 2. Antes de mandar el enlace (checklist)

- [x] Fotos `etapa-1` … `etapa-8` puestas en `assets/img/`.
- [x] `memoryWords` personalizadas en `app.js`.
- [x] Canciones comprimidas (60 MB → 23 MB) y fotos optimizadas (15,7 → 1,2 MB).
- [x] Tildes corregidas en títulos de canción y notas de etapa.
- [x] URL absoluta del sitio en `og:url` y `og:image` de `index.html`:
      `https://alekcaballero20.github.io/hbc26/`.
- [x] `_originales/` fuera del repo (está en `.gitignore`).
- [ ] Subir el `?v=` de `index.html` si se cambia algo después.
- [ ] Probar el recorrido completo en un celular real, no solo en responsive.
- [ ] Mandarle el código `0808` junto con el enlace: la app no lo dice en
      ninguna parte.

### 3. Limpieza — hecha (agosto 2026)

- La carpeta `games/` (versión vieja, ya desconectada) se borró.
- Se podaron 300 reglas muertas de `styles.css`, todo CSS de los minijuegos
  antiguos. El archivo pasó de 64 KB a 26 KB. Se verificó después que los 8
  puzzles y el chrome general se ven exactamente igual.

---

## Cómo funciona el motor (para futuro yo)

Un puzzle es un módulo que exporta `meta` y `mount`:

```js
export const meta = {
  id: "flow",
  title: "Los hilos que no se cruzan",
  genre: "Ruteo · arrastre",   // se muestra en el mapa y en el chip del puzzle
  skin: "flow",                // añade la clase .pz--flow
  milestones: 3,               // en cuántos pedazos se libera el mensaje
  blurb: "Instrucciones cortas.",
  hints: ["pista 1", "pista 2", "pista 3"]
};

export function mount({ root, api, rng, store, stage }) {
  // ...
  return { destroy() {} };
}
```

Lo que recibe:

- `root` — dónde dibujar. El shell (título, medidor, estado, botones) ya existe.
- `api` — `setStatus()`, `setMeter(0..1)`, `milestone()`, `solve()`, `nudge()`,
  `addTool()`, `onHint()`, `onReset()`.
- `rng` — random con semilla derivada de la etapa. Mismo tablero al recargar.
- `store` — `load()` / `save()` / `clear()` para partidas a medio hacer.
- `stage` — datos de la etapa: `words`, `image`, `songLibrary`, `memoryWords`.

**La clave del diseño:** el puzzle nunca decide qué palabra revelar. Llama a
`api.milestone()` cuando alcanza un hito y el shell reparte las 8 palabras
proporcionalmente. Con `milestones: 3` el reparto es 3 → 5 → 8. Con
`api.solve()` se entregan todas de una.

Para agregar un puzzle nuevo: crearlo en `puzzles/`, registrarlo en
`puzzles/index.js` y poner su `id` en el campo `puzzle` de la etapa en `app.js`.

---

## Progreso guardado

| Clave | Qué guarda |
|---|---|
| `cumpleCata8Progress` | Etapas completadas |
| `hbc_unlocked` (sessionStorage) | Si ya pasó el PIN en esta sesión |
| `hbc.puzzle.<etapa>.<puzzle>` | Partida a medio hacer de cada puzzle |
| `hbc_sfx_muted` | Si los efectos de sonido están silenciados |

El botón **Reiniciar progreso** borra las etapas y también todas las partidas a
medio hacer.

---

## Notas de privacidad

Como es sorpresa:

- No subir el proyecto público antes de tiempo.
- Si va a GitHub Pages, revisar que no queden textos incompletos.
- El PIN `0808` no es seguridad real, es ambientación. No pongas nada ahí que no
  quieras que se vea antes de tiempo.
