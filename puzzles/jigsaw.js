import { stagePicture } from "../engine/media.js";

const COLUMNS = 3;
const ROWS = 4;
const TOTAL = COLUMNS * ROWS;

export const meta = {
  id: "jigsaw",
  title: "La foto que no estaba completa",
  genre: "Espacial · arrastre",
  skin: "jigsaw",
  milestones: 3,
  blurb: "Arrastra una pieza sobre otra para intercambiarlas. Cuando la foto quede bien, la etapa se abre.",
  solvedText: "La foto volvió a su lugar.",
  hints: [
    "Empieza por las esquinas: son las piezas con menos vecinos posibles y las más fáciles de ubicar.",
    "Fíjate en las líneas que se cortan entre pieza y pieza. El borde de una tiene que continuar en la otra.",
    "Si te trabas, usa el botón «Ver original» un par de segundos y sigue por la fila de arriba."
  ]
};

export function mount({ root, api, rng, store, stage }) {
  root.innerHTML = "";

  const board = document.createElement("div");
  board.className = "jig__board";
  board.style.aspectRatio = `${COLUMNS} / ${ROWS}`;
  root.appendChild(board);

  const slots = [];
  let order = [];
  let dragging = null;
  let lastMilestone = 0;
  let destroyed = false;

  for (let index = 0; index < TOTAL; index += 1) {
    const slot = document.createElement("div");
    slot.className = "jig__slot";
    slot.dataset.slot = String(index);
    slots.push(slot);
    board.appendChild(slot);
  }

  const peek = api.addTool("Ver original", () => {
    board.classList.add("is-peeking");
    setTimeout(() => board.classList.remove("is-peeking"), 1400);
  });

  stagePicture(stage.image, `jigsaw-${stage.id}`).then((picture) => {
    if (destroyed) return;

    const url = picture.tagName === "CANVAS" ? picture.toDataURL("image/png") : picture.src;
    board.style.setProperty("--jig-image", `url("${url}")`);

    const saved = store.load();
    order = saved && saved.order && saved.order.length === TOTAL ? saved.order : scramble();
    render();
    api.setStatus("Doce piezas, un recuerdo. Arrastra una sobre otra para intercambiarlas.", "neutral");
    checkProgress(false);
  });

  function scramble() {
    let attempt;
    do {
      attempt = rng.shuffle([...Array(TOTAL).keys()]);
    } while (attempt.filter((piece, index) => piece === index).length > 2);
    return attempt;
  }

  function render() {
    slots.forEach((slot, slotIndex) => {
      slot.innerHTML = "";
      const pieceIndex = order[slotIndex];
      const piece = document.createElement("div");
      const column = pieceIndex % COLUMNS;
      const row = Math.floor(pieceIndex / COLUMNS);

      piece.className = `jig__piece ${pieceIndex === slotIndex ? "is-home" : ""}`;
      piece.style.backgroundImage = "var(--jig-image)";
      piece.style.backgroundSize = `${COLUMNS * 100}% ${ROWS * 100}%`;
      piece.style.backgroundPosition = `${(column / (COLUMNS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
      piece.dataset.piece = String(pieceIndex);
      piece.addEventListener("pointerdown", (event) => beginDrag(event, piece, slotIndex));
      slot.appendChild(piece);
    });
  }

  function beginDrag(event, piece, slotIndex) {
    if (api.solved || dragging) return;

    event.preventDefault();
    piece.setPointerCapture(event.pointerId);

    const rect = piece.getBoundingClientRect();
    dragging = {
      piece,
      slotIndex,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - rect.width / 2,
      offsetY: event.clientY - rect.top - rect.height / 2
    };

    piece.classList.add("is-dragging");
    piece.addEventListener("pointermove", moveDrag);
    piece.addEventListener("pointerup", endDrag);
    piece.addEventListener("pointercancel", endDrag);
    moveDrag(event);
  }

  function moveDrag(event) {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    event.preventDefault();

    const rect = dragging.piece.parentElement.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2 - dragging.offsetX;
    const dy = event.clientY - rect.top - rect.height / 2 - dragging.offsetY;
    dragging.piece.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
  }

  function endDrag(event) {
    if (!dragging || event.pointerId !== dragging.pointerId) return;

    const { piece, slotIndex } = dragging;
    piece.removeEventListener("pointermove", moveDrag);
    piece.removeEventListener("pointerup", endDrag);
    piece.removeEventListener("pointercancel", endDrag);
    piece.style.transform = "";
    piece.classList.remove("is-dragging");
    dragging = null;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const targetSlot = target && target.closest(".jig__slot");
    if (!targetSlot) return;

    const targetIndex = Number(targetSlot.dataset.slot);
    if (targetIndex === slotIndex) return;

    [order[slotIndex], order[targetIndex]] = [order[targetIndex], order[slotIndex]];
    store.save({ order });
    render();
    checkProgress(true);
  }

  function checkProgress(interactive) {
    const correct = order.filter((piece, index) => piece === index).length;
    api.setMeter(correct / TOTAL);

    if (correct === TOTAL) {
      board.classList.add("is-complete");
      store.clear();
      api.solve("La foto volvió a su lugar. Igual que ustedes, básicamente.");
      return;
    }

    const milestone = Math.min(meta.milestones - 1, Math.floor((correct / TOTAL) * meta.milestones));
    if (milestone > lastMilestone) {
      while (lastMilestone < milestone) {
        lastMilestone += 1;
        api.milestone(`${correct} de ${TOTAL} piezas en su sitio. Se libera un pedazo del mensaje.`);
      }
      return;
    }

    if (interactive) {
      api.setStatus(`${correct} de ${TOTAL} piezas en su sitio.`, correct > 0 ? "neutral" : "hint");
    }
  }

  api.onReset(() => {
    order = scramble();
    lastMilestone = 0;
    store.save({ order });
    render();
    checkProgress(false);
  });

  return {
    destroy() {
      destroyed = true;
      peek.remove();
    }
  };
}
