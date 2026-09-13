const ROUNDS = 6;
const CLIP_SECONDS = 7;
const OPTIONS = 4;

export const meta = {
  id: "earworm",
  title: "¿Cuál de las ocho es?",
  genre: "Oído musical",
  skin: "earworm",
  milestones: 3,
  blurb: "Suena un pedazo de una de las ocho canciones del regalo. Adivina cuál es. Seis rondas seguidas.",
  solvedText: "Seis de seis. Tienes las ocho metidas en la cabeza.",
  hints: [
    "Si el fragmento cae en un instrumental, fíjate en el tempo y en el tipo de batería antes que en la letra.",
    "Puedes darle a «Otra vez» las veces que quieras: no penaliza y suena desde un punto distinto.",
    "Descarta por eliminación: seguro hay al menos una opción de esas cuatro que sabes que no es."
  ]
};

export function mount({ root, api, rng, stage }) {
  root.innerHTML = "";

  const library = (stage.songLibrary || []).filter((song) => song && song.audio && song.title);

  if (library.length < OPTIONS) {
    root.innerHTML = `<p class="pz__replay">Este reto necesita las ocho canciones cargadas en <code>assets/audio/</code>. Revisa <code>songLibrary</code> en app.js.</p>`;
    api.setStatus("Faltan canciones para armar este reto.", "error");
    return { destroy() {} };
  }

  const player = new Audio();
  player.preload = "metadata";

  const display = document.createElement("div");
  display.className = "ear__display";
  const wave = document.createElement("div");
  wave.className = "ear__wave";
  for (let index = 0; index < 18; index += 1) {
    const bar = document.createElement("span");
    bar.style.animationDelay = `${index * 0.06}s`;
    wave.appendChild(bar);
  }
  const roundLabel = document.createElement("p");
  roundLabel.className = "ear__round";
  display.append(wave, roundLabel);

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "ear__play";
  playButton.textContent = "▶  Escuchar el fragmento";

  const choices = document.createElement("div");
  choices.className = "ear__choices";

  root.append(display, playButton, choices);

  let round = 0;
  let correctIndex = 0;
  let options = [];
  let stopTimer = null;
  let locked = false;
  let awarded = 0;

  playButton.addEventListener("click", playClip);

  function nextRound() {
    locked = false;
    correctIndex = rng.int(0, library.length - 1);

    const distractors = rng
      .shuffle(library.map((_, index) => index).filter((index) => index !== correctIndex))
      .slice(0, OPTIONS - 1);

    options = rng.shuffle([correctIndex, ...distractors]);

    roundLabel.textContent = `Ronda ${round + 1} de ${ROUNDS}`;
    player.src = library[correctIndex].audio;
    player.load();

    choices.innerHTML = "";
    options.forEach((songIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ear__choice";
      button.textContent = library[songIndex].title;
      button.addEventListener("click", () => answer(songIndex, button));
      choices.appendChild(button);
    });

    api.setStatus("Dale a escuchar y elige. Puedes repetirlo las veces que quieras.", "neutral");
  }

  function playClip() {
    clearTimeout(stopTimer);

    const duration = Number.isFinite(player.duration) && player.duration > CLIP_SECONDS + 20 ? player.duration : 90;
    const start = 15 + rng() * Math.max(1, duration - CLIP_SECONDS - 25);

    try {
      player.currentTime = start;
    } catch (error) {
      /* algunos navegadores aún no saben la duración; suena desde el inicio */
    }

    // Baja la canción de la etapa mientras suena el fragmento del reto.
    window.dispatchEvent(new CustomEvent("hbc:duck"));

    player.play().then(() => {
      display.classList.add("is-playing");
      playButton.textContent = "↻  Otra vez";
      stopTimer = setTimeout(stopClip, CLIP_SECONDS * 1000);
    }).catch(() => {
      window.dispatchEvent(new CustomEvent("hbc:unduck"));
      api.setStatus("El navegador bloqueó el audio. Toca «Escuchar» otra vez.", "error");
    });
  }

  function stopClip() {
    player.pause();
    display.classList.remove("is-playing");
    window.dispatchEvent(new CustomEvent("hbc:unduck"));
  }

  function answer(songIndex, button) {
    if (locked || api.solved) return;

    if (songIndex !== correctIndex) {
      api.nudge("Esa no era. Escucha otra vez y descarta.", button);
      button.classList.add("is-wrong-choice");
      button.disabled = true;
      return;
    }

    locked = true;
    stopClip();
    button.classList.add("is-right-choice");
    round += 1;
    api.setMeter(round / ROUNDS);

    if (round >= ROUNDS) {
      api.solve(`Seis de seis. "${library[correctIndex].title}" cerró la ronda.`);
      playButton.disabled = true;
      return;
    }

    const step = Math.min(meta.milestones - 1, Math.floor((round / ROUNDS) * meta.milestones));
    while (awarded < step) {
      awarded += 1;
      api.milestone(`Correcto: "${library[correctIndex].title}". Van ${round} de ${ROUNDS}.`);
    }

    api.setStatus(`Era "${library[correctIndex].title}". Siguiente ronda en un segundo.`, "success");
    playButton.textContent = "▶  Escuchar el fragmento";
    setTimeout(nextRound, 1100);
  }

  api.onReset(() => {
    round = 0;
    awarded = 0;
    api.setMeter(0);
    stopClip();
    playButton.disabled = false;
    playButton.textContent = "▶  Escuchar el fragmento";
    nextRound();
  });

  nextRound();

  return {
    destroy() {
      clearTimeout(stopTimer);
      player.pause();
      player.src = "";
      window.dispatchEvent(new CustomEvent("hbc:unduck"));
    }
  };
}
