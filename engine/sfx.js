/**
 * Sonidos y háptica de interfaz.
 *
 * Todo se sintetiza con WebAudio: cero archivos extra, cero peso, y nunca
 * pelea con la música de la etapa porque son blips de menos de medio segundo
 * a volumen bajo. El contexto se crea perezosamente en el primer gesto real
 * del usuario (tocar el PIN), que es justo lo que exigen los navegadores.
 */

const prefersQuiet = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

let ctx = null;
let master = null;
let muted = false;

function ensureContext() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.09;
    master.connect(ctx.destination);
  } catch (error) {
    ctx = null;
  }

  return ctx;
}

/**
 * Un tono simple con envolvente. `type` cambia el color: los senos suenan a
 * campanita y los triangulares a tecla.
 */
function tone({ freq, duration = 0.14, type = "sine", gain = 1, delay = 0, slideTo = null }) {
  const audio = ensureContext();
  if (!audio || muted) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const env = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);

  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function buzz(pattern) {
  if (prefersQuiet()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch (error) {
    /* el navegador no soporta vibración; no pasa nada */
  }
}

export const sfx = {
  /** Se llama en el primer gesto para que el contexto quede listo. */
  warmup() {
    ensureContext();
  },

  setMuted(value) {
    muted = Boolean(value);
  },

  get muted() {
    return muted;
  },

  /** Tecla del PIN. */
  key() {
    tone({ freq: 520, duration: 0.07, type: "triangle", gain: 0.5 });
    buzz(8);
  },

  /** Error: dos golpes graves. */
  error() {
    tone({ freq: 220, duration: 0.13, type: "sawtooth", gain: 0.35 });
    tone({ freq: 165, duration: 0.18, type: "sawtooth", gain: 0.35, delay: 0.11 });
    buzz([26, 60, 26]);
  },

  /** Acierto pequeño: una palabra revelada. */
  reveal(index = 0) {
    // Sube por una pentatónica para que ocho palabras seguidas suenen a melodía.
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    tone({ freq: scale[index % scale.length], duration: 0.22, type: "sine", gain: 0.7 });
    buzz(12);
  },

  /** Hito o etapa resuelta: arpegio corto. */
  success() {
    [659.25, 830.61, 987.77].forEach((freq, index) => {
      tone({ freq, duration: 0.26, type: "sine", gain: 0.65, delay: index * 0.075 });
    });
    buzz([14, 40, 22]);
  },

  /** Desbloqueo del PIN / apertura de la carta. */
  unlock() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      tone({ freq, duration: 0.34, type: "sine", gain: 0.6, delay: index * 0.09 });
    });
    buzz([18, 50, 18, 50, 34]);
  },

  /** Puerta cerrada: etapa bloqueada. */
  locked() {
    tone({ freq: 300, duration: 0.1, type: "square", gain: 0.28, slideTo: 180 });
    buzz([12, 40, 12]);
  }
};
