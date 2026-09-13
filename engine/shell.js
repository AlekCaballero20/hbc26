/**
 * Carcasa compartida de los puzzles.
 *
 * La diferencia clave con la versión vieja: la recompensa está desacoplada de
 * la mecánica. El puzzle no entrega "una palabra por acierto"; declara cuántos
 * hitos tiene y llama a `milestone()` cuando le da la gana. Así un puzzle puede
 * ser un solo reto grande en vez de ocho repeticiones de lo mismo.
 */
export function createShell(host, { meta, words, onReveal, onSolved }) {
  const milestoneCount = Math.max(1, meta.milestones || 1);
  const hints = meta.hints || [];

  host.textContent = "";
  host.className = `pz pz--${meta.skin || meta.id}`;

  const header = el("header", "pz__header");
  const titleBlock = el("div", "pz__titles");
  const genre = el("span", "pz__genre", meta.genre || "Reto");
  const title = el("h4", "pz__title", meta.title);
  titleBlock.append(genre, title);
  const timer = el("span", "pz__timer", "00:00");
  header.append(titleBlock, timer);

  const blurb = el("p", "pz__blurb", meta.blurb || "");

  const meterWrap = el("div", "pz__meter");
  const meterFill = el("div", "pz__meter-fill");
  meterWrap.appendChild(meterFill);

  const pips = el("div", "pz__pips");
  const pipNodes = [];
  for (let index = 0; index < milestoneCount; index += 1) {
    const pip = el("span", "pz__pip");
    pipNodes.push(pip);
    pips.appendChild(pip);
  }

  const status = el("p", "pz__status", "Tómate un segundo para leer el tablero antes de tocar.");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const stage = el("div", "pz__stage");

  const tools = el("div", "pz__tools");
  const hintButton = toolButton("Pista");
  const resetButton = toolButton("Reiniciar");
  tools.append(hintButton, resetButton);

  host.append(header, blurb, meterWrap, pips, status, stage, tools);

  let awarded = 0;
  let reachedMilestones = 0;
  let hintsUsed = 0;
  let solved = false;
  let startedAt = Date.now();
  let hintHandler = null;
  let resetHandler = null;

  const timerId = setInterval(tick, 1000);
  tick();

  function tick() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    timer.textContent = `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function setStatus(message, tone = "neutral") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function setMeter(fraction) {
    const clamped = Math.max(0, Math.min(1, fraction || 0));
    meterFill.style.width = `${Math.round(clamped * 100)}%`;
  }

  function awardUpTo(target) {
    while (awarded < target && awarded < words.length) {
      onReveal(words[awarded]);
      awarded += 1;
    }
  }

  function markSolved(message) {
    if (solved) return;
    solved = true;
    clearInterval(timerId);
    reachedMilestones = milestoneCount;
    pipNodes.forEach((pip) => pip.classList.add("is-on"));
    awardUpTo(words.length);
    setMeter(1);
    host.classList.add("is-solved");
    setStatus(message || meta.solvedText || "Resuelto. La etapa se abre.", "success");
    burst(host);
    onSolved(words);
  }

  hintButton.addEventListener("click", () => {
    if (solved) return;

    if (hintHandler) {
      const custom = hintHandler(hintsUsed);
      hintsUsed += 1;
      if (custom) setStatus(custom, "hint");
      host.classList.add("is-hinting");
      setTimeout(() => host.classList.remove("is-hinting"), 500);
      return;
    }

    if (!hints.length) return;
    setStatus(hints[Math.min(hintsUsed, hints.length - 1)], "hint");
    hintsUsed += 1;
    host.classList.add("is-hinting");
    setTimeout(() => host.classList.remove("is-hinting"), 500);
  });

  resetButton.addEventListener("click", () => {
    if (solved) return;
    startedAt = Date.now();
    setStatus("Reto reiniciado. Las palabras ya reveladas se quedan contigo.", "neutral");
    if (resetHandler) resetHandler();
  });

  const api = {
    stage,
    get solved() {
      return solved;
    },
    get hintsUsed() {
      return hintsUsed;
    },
    setStatus,
    setMeter,

    /** Avanza un hito y libera el pedazo de mensaje que le corresponde. */
    milestone(message) {
      if (solved) return;
      reachedMilestones = Math.min(milestoneCount, reachedMilestones + 1);
      pipNodes[reachedMilestones - 1]?.classList.add("is-on");
      awardUpTo(Math.round((words.length * reachedMilestones) / milestoneCount));
      setMeter(reachedMilestones / milestoneCount);
      if (message) setStatus(message, "success");
      if (reachedMilestones >= milestoneCount) markSolved(message);
    },

    solve: markSolved,

    nudge(message, element) {
      if (message) setStatus(message, "error");
      if (element) {
        element.classList.add("is-wrong");
        setTimeout(() => element.classList.remove("is-wrong"), 460);
      }
    },

    onHint(handler) {
      hintHandler = handler;
    },

    onReset(handler) {
      resetHandler = handler;
    },

    addTool(label, onClick) {
      const button = toolButton(label);
      button.addEventListener("click", onClick);
      tools.insertBefore(button, resetButton);
      return button;
    },

    /** Restaura una partida ya ganada sin volver a jugarla. */
    restoreSolved(message) {
      markSolved(message);
    },

    destroy() {
      clearInterval(timerId);
    }
  };

  return api;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function toolButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pz__tool";
  button.textContent = label;
  return button;
}

function burst(host) {
  const symbols = ["✦", "💜", "★", "♥"];

  for (let index = 0; index < 14; index += 1) {
    const particle = document.createElement("span");
    particle.className = "pz__spark";
    particle.textContent = symbols[index % symbols.length];
    particle.style.left = `${Math.random() * 84 + 8}%`;
    particle.style.top = `${Math.random() * 60 + 20}%`;
    particle.style.animationDelay = `${Math.random() * 0.3}s`;
    host.appendChild(particle);
    setTimeout(() => particle.remove(), 1600);
  }
}
