import { stagePicture } from "../engine/media.js";

const SIZE = 4;
const TOTAL = SIZE * SIZE;
const BLANK = TOTAL - 1;

export const meta = {
  id: "slide",
  title: "Quince piezas y un hueco",
  genre: "Espacial · secuencia",
  skin: "slide",
  milestones: 3,
  blurb: "Solo puedes mover la pieza que toca el hueco. Toca una pieza de la misma fila o columna y toda la hilera se corre. Reconstruye la foto.",
  solvedText: "Quince piezas de vuelta en su sitio.",
  hints: [
    "Resuelve por partes: primero la fila de arriba completa, y ya no la vuelvas a tocar. Después la segunda fila. Al final te queda un 2×2 fácil.",
    "Para colocar la última pieza de una fila, ponla debajo de su lugar y luego rota el 2×2 de esa esquina. Intentar meterla directo te desarma la fila.",
    "Si la foto te confunde, activa «Ver números»: los números dicen exactamente a dónde va cada pieza."
  ]
};

export function mount({ root, api, rng, store, stage }) {
  root.innerHTML = "";

  const board = document.createElement("div");
  board.className = "slide__board";
  root.appendChild(board);

  let order = [];
  let moves = 0;
  let bestCorrect = 0;
  let awarded = 0;
  let destroyed = false;

  const numbersButton = api.addTool("Ver números", () => {
    board.classList.toggle("show-numbers");
    numbersButton.classList.toggle("is-active", board.classList.contains("show-numbers"));
  });

  stagePicture(stage.image, `slide-${stage.id}`).then((picture) => {
    if (destroyed) return;
    const url = picture.tagName === "CANVAS" ? picture.toDataURL("image/png") : picture.src;
    board.style.setProperty("--slide-image", `url("${url}")`);

    const saved = store.load();
    order = saved && Array.isArray(saved.order) && saved.order.length === TOTAL ? saved.order : shuffled();
    moves = (saved && saved.moves) || 0;
    render();
    evaluate(false);
  });

  /** Barajamos con movimientos legales: así el tablero siempre tiene solución. */
  function shuffled() {
    const tiles = [...Array(TOTAL).keys()];
    let blank = BLANK;

    for (let step = 0; step < 400; step += 1) {
      const options = neighborsOf(blank);
      const pick = options[rng.int(0, options.length - 1)];
      [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
      blank = pick;
    }

    return tiles.every((tile, index) => tile === index) ? shuffled() : tiles;
  }

  function render() {
    board.innerHTML = "";

    order.forEach((tile, position) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `slide__tile ${tile === BLANK ? "is-blank" : ""} ${tile === position ? "is-home" : ""}`;

      if (tile !== BLANK) {
        const column = tile % SIZE;
        const row = Math.floor(tile / SIZE);
        cell.style.backgroundImage = "var(--slide-image)";
        cell.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;
        cell.style.backgroundPosition = `${(column / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`;
        const label = document.createElement("span");
        label.className = "slide__num";
        label.textContent = String(tile + 1);
        cell.appendChild(label);
      }

      cell.addEventListener("click", () => slideAt(position));
      board.appendChild(cell);
    });
  }

  function slideAt(position) {
    if (api.solved) return;

    const blank = order.indexOf(BLANK);
    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    const blankRow = Math.floor(blank / SIZE);
    const blankColumn = blank % SIZE;

    if (row !== blankRow && column !== blankColumn) {
      api.nudge("Esa pieza no está en la fila ni en la columna del hueco.", board.children[position]);
      return;
    }
    if (position === blank) return;

    // Corre toda la hilera entre la pieza tocada y el hueco.
    const step = row === blankRow ? Math.sign(column - blankColumn) : Math.sign(row - blankRow) * SIZE;
    let cursor = blank;

    while (cursor !== position) {
      const next = cursor + step;
      [order[cursor], order[next]] = [order[next], order[cursor]];
      cursor = next;
      moves += 1;
    }

    store.save({ order, moves });
    render();
    evaluate(true);
  }

  function evaluate(interactive) {
    const correct = order.filter((tile, index) => tile === index).length;
    api.setMeter(correct / TOTAL);

    if (order.every((tile, index) => tile === index)) {
      store.clear();
      board.classList.add("is-complete");
      api.solve(`Foto reconstruida en ${moves} movimientos.`);
      return;
    }

    if (correct > bestCorrect) {
      bestCorrect = correct;
      const step = Math.min(meta.milestones - 1, Math.floor((bestCorrect / TOTAL) * meta.milestones));
      while (awarded < step) {
        awarded += 1;
        api.milestone(`${correct} de ${TOTAL} piezas en su lugar. Cae un pedazo del mensaje.`);
      }
      return;
    }

    if (interactive) api.setStatus(`${correct}/${TOTAL} piezas en su lugar · ${moves} movimientos.`, "neutral");
  }

  api.onReset(() => {
    order = shuffled();
    moves = 0;
    bestCorrect = 0;
    awarded = 0;
    store.save({ order, moves });
    render();
    evaluate(false);
  });

  return {
    destroy() {
      destroyed = true;
      numbersButton.remove();
    }
  };
}

function neighborsOf(index) {
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  const list = [];
  if (row > 0) list.push(index - SIZE);
  if (row < SIZE - 1) list.push(index + SIZE);
  if (column > 0) list.push(index - 1);
  if (column < SIZE - 1) list.push(index + 1);
  return list;
}
