/**
 * Reproductor de la canción de cada etapa.
 *
 * Reemplaza al `<audio controls>` nativo (que se ve distinto en cada navegador
 * y rompe la estética) por uno propio con:
 *
 * - Autoplay con fade-in al abrir la etapa. Funciona porque abrir una etapa
 *   siempre viene de un clic, así que el navegador ya considera que hubo gesto.
 *   Si aun así lo bloquea, el botón se pone en modo "tócame" en vez de fallar
 *   en silencio.
 * - Fade-out al cerrar, para que no se corte de golpe.
 * - Ducking: el reto de oído musical (etapa 6) baja esta canción mientras
 *   suena su fragmento, avisando por los eventos `hbc:duck` / `hbc:unduck`.
 */

const FADE_MS = 900;
const DUCK_VOLUME = 0.0;

export function createSongPlayer(container) {
  const audio = new Audio();
  audio.preload = "metadata";
  audio.loop = true;
  audio.volume = 0;

  container.textContent = "";
  container.className = "player";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "player__toggle";
  toggle.setAttribute("aria-label", "Reproducir o pausar la canción");
  toggle.innerHTML = `<span class="player__icon" aria-hidden="true"></span>`;

  const body = document.createElement("div");
  body.className = "player__body";

  const eq = document.createElement("div");
  eq.className = "player__eq";
  eq.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 5; index += 1) {
    const bar = document.createElement("span");
    bar.style.animationDelay = `${index * 0.13}s`;
    eq.appendChild(bar);
  }

  const label = document.createElement("p");
  label.className = "player__label";
  label.textContent = "Cargando la canción…";

  const scrub = document.createElement("input");
  scrub.type = "range";
  scrub.className = "player__scrub";
  scrub.min = "0";
  scrub.max = "1000";
  scrub.value = "0";
  scrub.step = "1";
  scrub.setAttribute("aria-label", "Avanzar la canción");

  const times = document.createElement("div");
  times.className = "player__times";
  const nowText = document.createElement("span");
  nowText.textContent = "0:00";
  const endText = document.createElement("span");
  endText.textContent = "0:00";
  times.append(nowText, endText);

  const top = document.createElement("div");
  top.className = "player__top";
  top.append(eq, label);

  body.append(top, scrub, times);
  container.append(toggle, body);

  let fadeTimer = null;
  let scrubbing = false;
  let targetVolume = 1;
  let ducked = false;

  function fadeTo(value, ms = FADE_MS, onDone) {
    clearInterval(fadeTimer);
    const from = audio.volume;
    const delta = value - from;
    if (Math.abs(delta) < 0.001) {
      audio.volume = value;
      onDone?.();
      return;
    }

    const steps = Math.max(1, Math.round(ms / 40));
    let step = 0;

    fadeTimer = setInterval(() => {
      step += 1;
      // easing suave para que el fade no se sienta lineal y mecánico
      const t = step / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      audio.volume = Math.min(1, Math.max(0, from + delta * eased));

      if (step >= steps) {
        clearInterval(fadeTimer);
        audio.volume = Math.min(1, Math.max(0, value));
        onDone?.();
      }
    }, 40);
  }

  function setPlayingUi(isPlaying) {
    container.classList.toggle("is-playing", isPlaying);
    toggle.setAttribute("aria-pressed", String(isPlaying));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  }

  function syncProgress() {
    if (scrubbing) return;
    const { currentTime, duration } = audio;
    nowText.textContent = formatTime(currentTime);
    if (Number.isFinite(duration) && duration > 0) {
      scrub.value = String(Math.round((currentTime / duration) * 1000));
      container.style.setProperty("--played", `${(currentTime / duration) * 100}%`);
    }
  }

  function attemptPlay(fade = true) {
    return audio
      .play()
      .then(() => {
        container.classList.remove("needs-gesture");
        setPlayingUi(true);
        if (fade) fadeTo(ducked ? DUCK_VOLUME : targetVolume);
        else audio.volume = ducked ? DUCK_VOLUME : targetVolume;
      })
      .catch(() => {
        // El navegador bloqueó el autoplay: lo convertimos en invitación.
        container.classList.add("needs-gesture");
        setPlayingUi(false);
        label.textContent = "Toca ▶ para escucharla";
      });
  }

  audio.addEventListener("timeupdate", syncProgress);
  audio.addEventListener("loadedmetadata", () => {
    endText.textContent = formatTime(audio.duration);
    syncProgress();
  });
  audio.addEventListener("play", () => setPlayingUi(true));
  audio.addEventListener("pause", () => setPlayingUi(false));
  audio.addEventListener("error", () => {
    label.textContent = "No se pudo cargar el audio de esta etapa.";
    container.classList.add("is-broken");
  });

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      attemptPlay();
      return;
    }
    fadeTo(0, 320, () => audio.pause());
  });

  scrub.addEventListener("pointerdown", () => {
    scrubbing = true;
  });

  scrub.addEventListener("input", () => {
    const fraction = Number(scrub.value) / 1000;
    container.style.setProperty("--played", `${fraction * 100}%`);
    if (Number.isFinite(audio.duration)) {
      nowText.textContent = formatTime(audio.duration * fraction);
    }
  });

  function commitScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = audio.duration * (Number(scrub.value) / 1000);
    }
  }

  scrub.addEventListener("change", commitScrub);
  scrub.addEventListener("pointerup", commitScrub);
  scrub.addEventListener("pointercancel", commitScrub);

  function onDuck() {
    ducked = true;
    if (!audio.paused) fadeTo(DUCK_VOLUME, 280);
  }

  function onUnduck() {
    ducked = false;
    if (!audio.paused) fadeTo(targetVolume, 520);
  }

  window.addEventListener("hbc:duck", onDuck);
  window.addEventListener("hbc:unduck", onUnduck);

  return {
    /** Carga la canción de la etapa y, si `autoplay`, arranca con fade-in. */
    load({ src, title, autoplay = true, volume = 1 }) {
      clearInterval(fadeTimer);
      targetVolume = volume;
      container.classList.remove("is-broken", "needs-gesture");
      label.textContent = title || "Canción de la etapa";
      nowText.textContent = "0:00";
      endText.textContent = "0:00";
      scrub.value = "0";
      container.style.setProperty("--played", "0%");

      audio.volume = 0;
      audio.src = src;
      audio.load();

      if (autoplay) return attemptPlay();

      setPlayingUi(false);
      return Promise.resolve();
    },

    /** Baja el volumen y pausa. Se usa al cerrar la etapa. */
    stop() {
      if (audio.paused) {
        clearInterval(fadeTimer);
        audio.volume = 0;
        return;
      }
      fadeTo(0, 420, () => audio.pause());
    },

    get playing() {
      return !audio.paused;
    },

    destroy() {
      clearInterval(fadeTimer);
      window.removeEventListener("hbc:duck", onDuck);
      window.removeEventListener("hbc:unduck", onUnduck);
      audio.pause();
      audio.src = "";
    }
  };
}
