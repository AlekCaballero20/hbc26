import { clearAllPuzzleState, mountPuzzle, puzzleMeta } from "./engine/index.js";
import { createSongPlayer } from "./engine/player.js";
import { sfx } from "./engine/sfx.js";

const STORAGE_KEY = "cumpleCata8Progress";
const SECRET_PIN = "0808";
const UNLOCKED_KEY = "hbc_unlocked";
const SFX_KEY = "hbc_sfx_muted";
const TOTAL_WORDS = 8;

/**
 * Pistas del reto "Sopa de recuerdos" (etapa 3).
 * Salen de RECUERDOS.md. La palabra se busca sin tildes y en mayúscula, entre
 * 3 y 11 letras. Verificado: las 6 caben en la cuadrícula con la semilla de
 * la etapa 3.
 */
const memoryWords = [
  { word: "VIERA", clue: "Donde nos conocimos, cuando todavía era solo un salón de clase." },
  { word: "PIANO", clue: "El primer instrumento que estudiamos juntos, antes de atrevernos a cantar." },
  { word: "ONCES", clue: "La costumbre que empezó con un sándwich que me llevabas a clase." },
  { word: "KUTY", clue: "La cafetería de Castilla donde siempre se nos iba la tarde." },
  { word: "SHEERAN", clue: "El apellido del primero de todos nuestros conciertos." },
  { word: "MUSICALA", clue: "Lo que empezamos a construir juntos en el tercer año." }
];

const stages = [
  {
    id: 1,
    title: "La primera pista",
    songTitle: "Arriésgate Conmigo",
    audio: "./assets/audio/Arriesgate Conmigo.mp3",
    image: "./assets/img/etapa-1.jpg",
    puzzle: "jigsaw",
    description:
      "El inicio del viaje. Una canción, una pista y la primera velita por apagar.",
    note:
      "La primera puerta del regalo: una canción para entrar sin pensarlo tanto.",
    words: ["Cata", "eres", "mi", "forma", "favorita", "de", "volver", "aquí"]
  },
  {
    id: 2,
    title: "Lo que empezó a sonar",
    songTitle: "Nuestro Secreto",
    audio: "./assets/audio/Nuestro Secreto.mp3",
    image: "./assets/img/etapa-2.jpg",
    puzzle: "flow",
    description:
      "Una etapa para recordar lo que se volvió música sin pedir permiso.",
    note:
      "Una canción para eso que solo ustedes entienden sin tener que explicarlo.",
    words: ["Ocho", "años", "y", "sigo", "eligiendo", "tu", "risa", "primero"]
  },
  {
    id: 3,
    title: "Nuestro idioma secreto",
    songTitle: "Puede Que Sí",
    audio: "./assets/audio/Puede Que Si.mp3",
    image: "./assets/img/etapa-3.jpg",
    puzzle: "wordsearch",
    memoryWords,
    description:
      "Hay cosas que solo ustedes entienden. Esta etapa existe por eso.",
    note:
      "Una respuesta medio tímida, medio segura, pero con todo el corazón puesto.",
    words: ["Contigo", "hasta", "el", "caos", "aprendió", "a", "sonar", "bonito"]
  },
  {
    id: 4,
    title: "La casa que inventamos",
    songTitle: "Seguiré Siendo un Desconocido",
    audio: "./assets/audio/Seguire Siendo un Desconocido.mp3",
    image: "./assets/img/etapa-4.jpg",
    puzzle: "sokoban",
    description:
      "No siempre es un lugar. A veces casa es una persona haciendo café, música o planes imposibles.",
    note:
      "Una canción para seguir descubriéndose, incluso después de tantos años.",
    words: ["Donde", "estás", "tú", "algo", "en", "mí", "descansa", "mejor"]
  },
  {
    id: 5,
    title: "La canción del medio",
    songTitle: "Stop Being You",
    audio: "./assets/audio/Stop Being You.mp3",
    image: "./assets/img/etapa-5.jpg",
    puzzle: "nonogram",
    description:
      "La mitad del camino. Suficiente para mirar atrás y saber que valió la pena.",
    note:
      "La mitad del camino también puede sonar a pregunta, espejo y verdad.",
    words: ["Gracias", "por", "quedarte", "cuando", "todo", "era", "menos", "claro"]
  },
  {
    id: 6,
    title: "Lo que seguimos creando",
    songTitle: "Sweet Dreams Honey",
    audio: "./assets/audio/Sweet Dreams Honey.mp3",
    image: "./assets/img/etapa-6.jpg",
    puzzle: "earworm",
    description:
      "Una etapa para todo lo que han construido: ideas, proyectos, canciones, versiones nuevas de ustedes.",
    note:
      "Una pausa suave en medio del regalo, como decir: descansa, sigo aquí.",
    words: ["Crear", "contigo", "es", "mi", "manera", "más", "honesta", "de amar"]
  },
  {
    id: 7,
    title: "Antes del último ocho",
    songTitle: "Tengo Miedo De Extrañarte",
    audio: "./assets/audio/Tengo Miedo De Extranarte.mp3",
    image: "./assets/img/etapa-7.jpg",
    puzzle: "slide",
    description:
      "La penúltima puerta. Casi se abre la carta final, qué drama tan bien administrado.",
    note:
      "La penúltima canción guarda esa parte vulnerable que también hace bonito el amor.",
    words: ["Si", "la", "vida", "gira", "que", "me", "encuentre", "contigo"]
  },
  {
    id: 8,
    title: "Siempre tú",
    songTitle: "Todo Va A Estar Bien",
    audio: "./assets/audio/Todo Va A Estar Bien.mp3",
    image: "./assets/img/etapa-8.jpg",
    puzzle: "constellation",
    description:
      "La última etapa. La que abre la carta final de cumpleaños.",
    note:
      "La última puerta cierra con una promesa sencilla: todo va a estar bien.",
    words: ["Feliz", "cumpleaños", "amor", "mi", "canción", "favorita", "eres", "tú"]
  }
];

// El reto de oído musical necesita las ocho canciones como catálogo de opciones.
const songLibrary = stages.map((stage) => ({ title: stage.songTitle, audio: stage.audio }));

const finalMessage = `
Cata:

Feliz cumpleaños, amor.

Este regalo existe porque ocho años contigo no caben en una sola canción.
Tampoco caben en una carta, ni en una página, ni en todas las veces que intento
decirte lo mucho que has cambiado mi vida.

Gracias por caminar conmigo, por crear conmigo, por soñar conmigo y por seguir
siendo esa persona que vuelve más bonita incluso la parte rara del mundo.

Ocho años después, sigo sintiendo que encontrarte fue una de esas cosas que la
vida hace bien cuando por fin se concentra.

Te amo.

Alek
`;

const elements = {
  pinScreen: document.getElementById("pinScreen"),
  pinDots: document.getElementById("pinDots"),
  pinError: document.getElementById("pinError"),
  pinKeys: document.querySelectorAll(".pin-key"),
  appShell: document.getElementById("appShell"),
  hero: document.getElementById("hero"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  progressPanel: document.getElementById("progressPanel"),
  progressNumber: document.getElementById("progressNumber"),
  journey: document.getElementById("journey"),
  stageGrid: document.getElementById("stageGrid"),
  finalCard: document.getElementById("finalCard"),
  finalLock: document.getElementById("finalLock"),
  finalTitle: document.getElementById("final-title"),
  finalText: document.getElementById("finalText"),
  openFinalBtn: document.getElementById("openFinalBtn"),
  closingBtn: document.getElementById("closingBtn"),
  closingScreen: document.getElementById("closingScreen"),
  rereadBtn: document.getElementById("rereadBtn"),
  stageModal: document.getElementById("stageModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  backToMapBtn: document.getElementById("backToMapBtn"),
  modalEyebrow: document.getElementById("modalEyebrow"),
  modalTitle: document.getElementById("modalTitle"),
  modalDescription: document.getElementById("modalDescription"),
  stageImage: document.getElementById("stageImage"),
  songTitle: document.getElementById("songTitle"),
  songNote: document.getElementById("songNote"),
  songPlayer: document.getElementById("songPlayer"),
  sfxToggleBtn: document.getElementById("sfxToggleBtn"),
  gameTitle: document.getElementById("gameTitle"),
  gameCounter: document.getElementById("gameCounter"),
  puzzleHost: document.getElementById("puzzleHost"),
  revealedWords: document.getElementById("revealedWords"),
  completeStageBtn: document.getElementById("completeStageBtn")
};

let completedStages = loadProgress();
let currentStage = null;
let currentGameWords = [];
let pinInput = "";
let toastTimer = null;
let activeGameCleanup = null;
let isTypewriting = false;

const songPlayer = createSongPlayer(elements.songPlayer);

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completedStages));
}

function isStageComplete(stageId) {
  return completedStages.includes(stageId);
}

function isStageAvailable(stageId) {
  return stageId === 1 || isStageComplete(stageId - 1);
}

function unlockApp(skipAnimation = false) {
  sessionStorage.setItem(UNLOCKED_KEY, "true");
  elements.appShell.classList.remove("hidden");
  elements.appShell.classList.add("app-shell--visible");

  if (skipAnimation) {
    elements.pinScreen.classList.add("hidden");
    return;
  }

  elements.pinScreen.classList.add("is-leaving");
  setTimeout(() => {
    elements.pinScreen.classList.add("hidden");
  }, 400);
}

function updatePinDots() {
  [...elements.pinDots.children].forEach((dot, index) => {
    dot.classList.toggle("is-active", index < pinInput.length);
  });
}

function clearPin() {
  pinInput = "";
  updatePinDots();
}

function showPinError() {
  sfx.error();
  elements.pinError.classList.remove("hidden");
  elements.pinDots.classList.add("is-wrong");

  setTimeout(() => {
    elements.pinError.classList.add("hidden");
    elements.pinDots.classList.remove("is-wrong");
    clearPin();
  }, 1500);
}

function checkPin() {
  if (pinInput.length !== SECRET_PIN.length) return;

  if (pinInput === SECRET_PIN) {
    // Un respiro entre acertar y entrar: los puntos se ponen dorados y suena
    // el arpegio. Entrar de golpe se sentía brusco después de teclear.
    sfx.unlock();
    elements.pinDots.classList.add("is-correct");
    setTimeout(unlockApp, 620);
    return;
  }

  showPinError();
}

function handlePinInput(value) {
  if (pinInput.length >= SECRET_PIN.length) return;
  sfx.key();
  pinInput += value;
  updatePinDots();

  if (pinInput.length === SECRET_PIN.length) {
    setTimeout(checkPin, 140);
  }
}

function setupPinScreen() {
  if (sessionStorage.getItem(UNLOCKED_KEY) === "true") {
    unlockApp(true);
    return;
  }

  elements.pinKeys.forEach((key) => {
    key.addEventListener("click", () => {
      // El primer toque es también el gesto que habilita WebAudio.
      sfx.warmup();
      pressKey(key);

      const value = key.dataset.pinValue;
      const action = key.dataset.pinAction;

      if (value) handlePinInput(value);
      if (action === "delete") {
        sfx.key();
        pinInput = pinInput.slice(0, -1);
        updatePinDots();
      }
      if (action === "submit") checkPin();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (elements.pinScreen.classList.contains("hidden")) return;

    // Escribir con teclado físico ilumina la tecla correspondiente en pantalla.
    const mirrored = [...elements.pinKeys].find((key) => key.dataset.pinValue === event.key);
    if (mirrored) pressKey(mirrored);

    if (/^[0-9]$/.test(event.key)) handlePinInput(event.key);
    if (event.key === "Backspace") {
      pinInput = pinInput.slice(0, -1);
      updatePinDots();
    }
    if (event.key === "Enter") checkPin();
  });
}

function pressKey(key) {
  key.classList.add("is-pressed");
  setTimeout(() => key.classList.remove("is-pressed"), 130);
}

/** Interruptor de efectos de sonido, recordado entre visitas. */
function setupSfxToggle() {
  const stored = localStorage.getItem(SFX_KEY) === "true";
  applySfxState(stored);

  elements.sfxToggleBtn?.addEventListener("click", () => {
    const next = !sfx.muted;
    applySfxState(next);
    localStorage.setItem(SFX_KEY, String(next));
    if (!next) sfx.reveal(2);
  });
}

function applySfxState(isMuted) {
  sfx.setMuted(isMuted);
  const button = elements.sfxToggleBtn;
  if (!button) return;

  button.setAttribute("aria-pressed", String(isMuted));
  button.setAttribute(
    "aria-label",
    isMuted ? "Activar los efectos de sonido" : "Silenciar los efectos de sonido"
  );
  button.querySelector(".sfx-toggle__icon").textContent = isMuted ? "🔇" : "🔊";
}

let stagesRenderedOnce = false;

function renderStages() {
  elements.stageGrid.innerHTML = "";
  // La entrada escalonada es un gesto de bienvenida: solo la primera vez. En
  // los re-render posteriores volvería a barrer las 8 tarjetas y cansa.
  const stagger = !stagesRenderedOnce;
  stagesRenderedOnce = true;

  stages.forEach((stage, index) => {
    const isComplete = isStageComplete(stage.id);
    const isAvailable = isStageAvailable(stage.id);
    // La primera etapa disponible sin resolver es "la siguiente": se le pone
    // el brillo que cruza la tarjeta para que no haya que leer para saber
    // dónde continuar.
    const isNext = isAvailable && !isComplete;
    const status = isComplete
      ? "✓ Desbloqueada"
      : isAvailable
        ? "🔓 Disponible"
        : "🔒 Bloqueada";

    const card = document.createElement("button");
    card.type = "button";
    card.className = `stage-card ${isComplete ? "is-complete" : ""} ${!isAvailable ? "is-locked" : ""} ${isNext ? "is-next" : ""}`;
    card.dataset.number = stage.id;
    card.dataset.stageId = stage.id;
    card.style.setProperty("--card-index", String(stagger ? index : 0));
    if (!stagger) card.classList.add("no-intro");
    card.setAttribute(
      "aria-label",
      isAvailable ? `Abrir etapa ${stage.id}: ${stage.title}` : "Etapa bloqueada"
    );

    const meta = puzzleMeta(stage.puzzle);

    card.innerHTML = `
      <div>
        <span class="stage-card__number">${stage.id}</span>
        <h3>${stage.title}</h3>
        <p>${stage.description}</p>
        ${isAvailable ? `<span class="stage-card__genre">${meta.genre}</span>` : ""}
      </div>
      <span class="stage-card__status">${status}</span>
    `;

    card.addEventListener("click", () => {
      if (!isAvailable) {
        sfx.locked();
        card.classList.remove("is-shaking");
        void card.offsetWidth; // reinicia la animación si se toca varias veces
        card.classList.add("is-shaking");
        showToast("Primero termina la etapa anterior ✦");
        return;
      }

      openStage(stage.id);
    });

    elements.stageGrid.appendChild(card);
  });
}

function updateProgressUi({ animate = false } = {}) {
  const completed = completedStages.length;
  const progressPercent = Math.round((completed / stages.length) * 100);

  elements.progressNumber.textContent = `${completed}/8`;
  document.documentElement.style.setProperty("--progress", `${progressPercent}%`);

  if (animate) {
    const ring = elements.progressPanel.querySelector(".progress-ring");
    ring?.classList.add("is-growing");
    setTimeout(() => ring?.classList.remove("is-growing"), 900);
  }

  const allDone = completed === stages.length;

  elements.finalLock.textContent = allDone ? "💌" : "🔒";
  elements.finalTitle.textContent = allDone ? "La carta está lista" : "La carta todavía está cerrada";
  elements.finalText.textContent = allDone
    ? "Completaste las 8 etapas. Ahora sí, el mensaje final puede abrirse."
    : "Completa las 8 etapas para abrir el mensaje especial de cumpleaños.";

  elements.openFinalBtn.classList.toggle("hidden", !allDone);
}

function showJourney() {
  elements.hero.classList.add("hidden");
  elements.progressPanel.classList.remove("hidden");
  elements.journey.classList.remove("hidden");
  elements.finalCard.classList.remove("hidden");

  renderStages();
  updateProgressUi();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetProgress() {
  const confirmed = confirm(
    "¿Seguro que quieres reiniciar el progreso? Esto vuelve a cerrar todas las etapas."
  );

  if (!confirmed) return;

  completedStages = [];
  saveProgress();
  clearAllPuzzleState();
  renderStages();
  updateProgressUi();
}

function openStage(stageId) {
  if (!isStageAvailable(stageId)) {
    showToast("Primero termina la etapa anterior ✦");
    return;
  }

  currentStage = stages.find((stage) => stage.id === stageId);

  if (!currentStage) return;

  elements.modalEyebrow.textContent = `Etapa ${currentStage.id} de 8`;
  elements.modalTitle.textContent = currentStage.title;
  elements.modalDescription.textContent = currentStage.description;
  elements.songTitle.textContent = currentStage.songTitle;
  elements.songNote.textContent = currentStage.note;
  elements.gameTitle.textContent = isStageComplete(currentStage.id)
    ? "Ya desbloqueaste este mensaje"
    : "Se revela mientras resuelves el reto";

  if (currentStage.image) {
    // La foto entra desenfocada y se enfoca al cargar, así no hay salto de
    // layout ni el parpadeo feo del src anterior.
    elements.stageImage.classList.add("is-loading");
    elements.stageImage.onerror = () => {
      elements.stageImage.style.display = "none";
    };
    elements.stageImage.onload = () => {
      elements.stageImage.classList.remove("is-loading");
    };
    elements.stageImage.src = currentStage.image;
    elements.stageImage.alt = currentStage.title;
    elements.stageImage.style.display = "block";
    if (elements.stageImage.complete) elements.stageImage.classList.remove("is-loading");
  } else {
    elements.stageImage.removeAttribute("src");
    elements.stageImage.alt = "";
    elements.stageImage.style.display = "none";
  }

  // La canción arranca sola al abrir la etapa. Única excepción: el reto de
  // oído musical, donde tener una de las ocho sonando de fondo sería tanto
  // una pista como una interferencia.
  songPlayer.load({
    src: currentStage.audio,
    title: currentStage.songTitle,
    autoplay: currentStage.puzzle !== "earworm"
  });

  setupMiniGame(currentStage);

  if (isStageComplete(currentStage.id)) {
    elements.completeStageBtn.disabled = false;
    elements.completeStageBtn.textContent = "Etapa completada";
  } else {
    elements.completeStageBtn.disabled = true;
    elements.completeStageBtn.textContent = "Completar etapa";
  }

  elements.stageModal.showModal();
}

function closeModal() {
  cleanupMiniGame();
  songPlayer.stop();

  // El cierre también se anima: sin esto la tarjeta desaparece de golpe
  // mientras la canción todavía está haciendo su fade.
  elements.stageModal.classList.add("is-closing");
  setTimeout(() => {
    elements.stageModal.classList.remove("is-closing");
    elements.stageModal.close();
  }, 220);
}

function setupMiniGame(stage) {
  cleanupMiniGame();
  elements.puzzleHost.innerHTML = "";
  elements.revealedWords.innerHTML = "";

  const completed = isStageComplete(stage.id);
  currentGameWords = completed ? [...stage.words] : [];
  renderRevealedWords();

  activeGameCleanup = mountPuzzle({
    host: elements.puzzleHost,
    stage: { ...stage, songLibrary },
    alreadyComplete: completed,
    onReveal: revealWord,
    onSolved: (words) => {
      currentGameWords = [...words];
      renderRevealedWords();
      if (!completed) sfx.success();
      elements.gameTitle.textContent = "Mensaje completo";
      elements.completeStageBtn.disabled = false;
      elements.completeStageBtn.textContent = completed ? "Etapa completada" : "Guardar etapa";
    }
  });
}

function cleanupMiniGame() {
  if (typeof activeGameCleanup === "function") {
    activeGameCleanup();
    activeGameCleanup = null;
  }
}

function revealWord(word) {
  if (currentGameWords.length >= TOTAL_WORDS) return;

  currentGameWords.push(word);
  renderRevealedWords({ freshIndex: currentGameWords.length - 1 });
  sfx.reveal(currentGameWords.length - 1);

  // Ojo: aquí NO se desmonta el puzzle. El shell avisa por onSolved cuando
  // de verdad terminó; desmontarlo en la última palabra lo mataba a mitad
  // de su propia animación de victoria.
  if (currentGameWords.length === TOTAL_WORDS) {
    elements.completeStageBtn.disabled = false;
    elements.completeStageBtn.textContent = isStageComplete(currentStage.id)
      ? "Etapa completada"
      : "Guardar etapa";
  }
}

function renderRevealedWords({ freshIndex = -1 } = {}) {
  elements.revealedWords.innerHTML = "";

  currentGameWords.forEach((word, index) => {
    const pill = document.createElement("span");
    pill.className = `revealed-word ${index === freshIndex ? "is-fresh" : ""}`;
    pill.textContent = word;
    elements.revealedWords.appendChild(pill);
  });

  updateGameCounter({ bump: freshIndex >= 0 });
}

function updateGameCounter({ bump = false } = {}) {
  const counter = elements.gameCounter;
  counter.textContent = `${currentGameWords.length}/8`;
  counter.classList.toggle("is-full", currentGameWords.length >= TOTAL_WORDS);

  if (!bump) return;
  counter.classList.add("is-bumping");
  setTimeout(() => counter.classList.remove("is-bumping"), 300);
}

function completeCurrentStage() {
  if (!currentStage) return;

  const stage = currentStage;
  const isFirstTime = !isStageComplete(stage.id);

  if (isFirstTime) {
    completedStages.push(stage.id);
    completedStages.sort((a, b) => a - b);
    saveProgress();
  }

  renderStages();
  updateProgressUi({ animate: isFirstTime });
  closeModal();

  if (isFirstTime) {
    sfx.success();
    // Se lee la frase completa una vez, en grande. Es el único momento donde
    // el mensaje de la etapa deja de verse como pastillas sueltas.
    showStageCheer(stage, () => {
      highlightCompletedCard(stage.id);
      goToNextStep();
    });
    return;
  }

  setTimeout(goToNextStep, 120);
}

function goToNextStep() {
  if (completedStages.length === stages.length) {
    elements.finalCard.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const next = stages.find((stage) => !isStageComplete(stage.id));
  if (!next) return;

  const card = elements.stageGrid.querySelector(`[data-stage-id="${next.id}"]`);
  card?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function highlightCompletedCard(stageId) {
  const card = elements.stageGrid.querySelector(`[data-stage-id="${stageId}"]`);
  if (!card) return;
  card.classList.add("just-completed");
  setTimeout(() => card.classList.remove("just-completed"), 800);
}

/** Overlay de celebración: la frase de la etapa palabra por palabra. */
function showStageCheer(stage, onDone) {
  const overlay = document.createElement("div");
  overlay.className = "stage-cheer";

  const words = stage.words
    .map((word, index) => `<span style="--word-index:${index}">${escapeHtml(word)}</span>`)
    .join(" ");

  overlay.innerHTML = `
    <div class="stage-cheer__inner">
      <span class="stage-cheer__badge">Etapa ${stage.id} completada</span>
      <p class="stage-cheer__phrase">${words}</p>
      <p class="stage-cheer__hint">Toca para continuar</p>
    </div>
  `;

  document.body.appendChild(overlay);
  // setTimeout y no requestAnimationFrame: si la pestaña no está compositando
  // (pantalla apagada, app en segundo plano) el rAF no dispara y la
  // celebración se quedaría invisible bloqueando el paso a la siguiente etapa.
  setTimeout(() => {
    overlay.classList.add("is-visible");
    overlay.style.pointerEvents = "auto";
  }, 20);

  floatHearts(overlay);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(autoTimer);
    overlay.classList.remove("is-visible");
    setTimeout(() => {
      overlay.remove();
      onDone?.();
    }, 450);
  };

  overlay.addEventListener("click", close);
  // Se cierra sola por si nadie toca, pero da tiempo de leer la frase entera.
  const autoTimer = setTimeout(close, 1200 + stage.words.length * 90 + 2200);
}

function floatHearts(host) {
  const symbols = ["💜", "✦", "★", "💫"];

  for (let index = 0; index < 14; index += 1) {
    const heart = document.createElement("span");
    heart.className = "cheer-heart";
    heart.textContent = symbols[index % symbols.length];
    heart.style.left = `${Math.random() * 90 + 5}%`;
    heart.style.animationDelay = `${Math.random() * 1.4}s`;
    heart.style.fontSize = `${Math.random() * 0.9 + 1.1}rem`;
    host.appendChild(heart);
  }
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("is-hiding");
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("is-hiding");
    toast.classList.remove("is-visible");
  }, 2500);
}

function openFinalMessage() {
  if (isTypewriting) return;
  isTypewriting = true;
  sfx.unlock();
  elements.openFinalBtn.classList.add("hidden");
  elements.closingBtn.classList.add("hidden");

  const overlay = document.createElement("div");
  overlay.id = "letterOverlay";
  overlay.innerHTML = `<span class="letter-overlay__emoji">💌</span>`;
  document.body.appendChild(overlay);

  // Mismo motivo que en showClosingScreen: con rAF el sobre puede no aparecer.
  setTimeout(() => overlay.classList.add("is-visible"), 20);

  const emoji = overlay.querySelector(".letter-overlay__emoji");

  setTimeout(() => {
    emoji.classList.add("is-shaking");
  }, 1200);

  setTimeout(() => {
    emoji.classList.add("is-disappearing");
  }, 1600);

  setTimeout(() => {
    overlay.classList.remove("is-visible");
    overlay.classList.add("is-hiding");

    setTimeout(() => {
      overlay.remove();
      startTypewriter(finalMessage.trim());
    }, 400);
  }, 2000);
}

function startTypewriter(text) {
  elements.finalLock.textContent = "💜";
  elements.finalTitle.textContent = "Feliz cumpleaños, Cata";
  elements.finalText.classList.add("typewriter-text");
  elements.finalText.innerHTML = `<span class="typewriter-cursor">|</span>`;

  // La carta tarda ~25 s en escribirse. Es bonito la primera vez, pero hay que
  // poder saltarlo: si toca la carta (o pulsa una tecla) aparece completa.
  elements.finalText.classList.add("is-skippable");

  let index = 0;
  let interval = null;

  const finish = () => {
    if (!isTypewriting) return;
    clearInterval(interval);
    elements.finalText.classList.remove("is-skippable");
    elements.finalText.textContent = text;
    isTypewriting = false;
    launchFinalParticles();
    elements.closingBtn.classList.remove("hidden");
    elements.closingBtn.classList.add("is-visible");
    elements.finalText.removeEventListener("click", finish);
    document.removeEventListener("keydown", onKey);
  };

  const onKey = (event) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
  };

  elements.finalText.addEventListener("click", finish);
  document.addEventListener("keydown", onKey);

  interval = setInterval(() => {
    index += 1;
    elements.finalText.innerHTML = `${escapeHtml(text.slice(0, index))}<span class="typewriter-cursor">|</span>`;
    if (index >= text.length) finish();
  }, 30);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function launchFinalParticles() {
  const particles = ["💜", "✦", "⭐"];

  for (let index = 0; index < 12; index += 1) {
    const particle = document.createElement("span");
    particle.className = "final-particle";
    particle.textContent = particles[index % particles.length];
    particle.style.left = `${Math.random() * 88 + 6}%`;
    particle.style.top = `${Math.random() * 72 + 14}%`;
    particle.style.animationDelay = `${Math.random() * 0.35}s`;
    elements.finalCard.appendChild(particle);

    setTimeout(() => particle.remove(), 2400);
  }
}

/** Vuelve a mostrar la carta ya escrita, sin la ceremonia del sobre. */
function rereadLetter() {
  elements.closingScreen.classList.remove("is-visible");
  elements.closingScreen.classList.add("hidden");
  elements.closingBtn.style.display = "";
  elements.closingBtn.classList.remove("hidden");
  elements.closingBtn.classList.add("is-visible");

  elements.finalLock.textContent = "💜";
  elements.finalTitle.textContent = "Feliz cumpleaños, Cata";
  elements.finalText.classList.add("typewriter-text");
  elements.finalText.textContent = finalMessage.trim();
  elements.openFinalBtn.classList.add("hidden");

  elements.finalCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showClosingScreen() {
  elements.closingBtn.style.display = "none";
  elements.closingScreen.classList.remove("hidden");

  // setTimeout y no requestAnimationFrame, por lo mismo que en showStageCheer:
  // si la pestaña no está compositando (pantalla apagada, app en segundo plano)
  // el rAF no dispara, y sin .is-visible esta pantalla se queda en opacity:0.
  // Es la última pantalla del regalo: no puede quedarse en blanco.
  setTimeout(() => {
    elements.closingScreen.classList.add("is-visible");
    elements.closingScreen.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 20);
}

elements.startBtn.addEventListener("click", () => {
  // Si el PIN venía recordado de la sesión, este es el primer gesto real.
  sfx.warmup();
  showJourney();
});
elements.resetBtn.addEventListener("click", resetProgress);
elements.closeModalBtn.addEventListener("click", closeModal);
elements.backToMapBtn.addEventListener("click", closeModal);
elements.completeStageBtn.addEventListener("click", completeCurrentStage);
elements.openFinalBtn.addEventListener("click", openFinalMessage);
elements.closingBtn.addEventListener("click", showClosingScreen);

elements.rereadBtn?.addEventListener("click", rereadLetter);

// Cerrar tocando fuera de la tarjeta. Dos trampas que hay que esquivar:
//
// 1. `event.target.closest(".modal-card")` no sirve: puzzles como el
//    deslizante reconstruyen su tablero DENTRO del handler del click, así que
//    cuando el evento llega hasta aquí la casilla tocada ya no está en el DOM,
//    `closest()` devuelve null y la etapa se cerraba en cada movimiento.
//    En un <dialog>, un toque en el fondo llega con target === el propio
//    dialog, así que comparar por identidad es exacto y no depende del DOM.
//
// 2. Arrastrar una pieza y soltarla fuera de la tarjeta (fácil en el
//    rompecabezas) también generaba un click con target === dialog. Por eso
//    solo cierra si el gesto TAMBIÉN empezó en el fondo.
let pressStartedOnBackdrop = false;

elements.stageModal.addEventListener("pointerdown", (event) => {
  pressStartedOnBackdrop = event.target === elements.stageModal;
});

elements.stageModal.addEventListener("click", (event) => {
  const onBackdrop = pressStartedOnBackdrop && event.target === elements.stageModal;
  pressStartedOnBackdrop = false;
  if (onBackdrop) closeModal();
});

// El <dialog> cierra solo con Escape, saltándose la animación de salida y el
// fade de la canción. Se intercepta para que Escape pase por closeModal().
elements.stageModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal();
});

setupSfxToggle();
setupPinScreen();

// Volver a abrir el regalo a medio camino no debería exigir pasar otra vez por
// la portada: si ya hay etapas resueltas, se entra directo al mapa.
if (completedStages.length > 0) showJourney();
