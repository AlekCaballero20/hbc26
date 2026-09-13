const SIZE = 10;

// El dibujo escondido es un corazón. No es sutil, pero funciona.
const SOLUTION = [
  "0110000110",
  "1111001111",
  "1111111111",
  "1111111111",
  "1111111111",
  "0111111110",
  "0111111110",
  "0011111100",
  "0001111000",
  "0000110000"
].map((row) => row.split("").map(Number));

export const meta = {
  id: "nonogram",
  title: "El dibujo que hay que deducir",
  genre: "Lógica pura",
  skin: "nonogram",
  milestones: 3,
  blurb: "Los números dicen cuántas casillas seguidas se pintan en cada fila y columna. Deduce el dibujo. Pintar al azar no sirve: hay que estar exacta.",
  solvedText: "Ahí estaba el dibujo, escondido en los números.",
  hints: [
    "Empieza por las filas y columnas con los números más grandes: una fila de 10 en un tablero de 10 se pinta entera sin pensar.",
    "Truco clásico: si una fila tiene un bloque de 8 en 10 casillas, las 6 del centro van pintadas sí o sí, empiece donde empiece.",
    "Usa el modo «Marcar ✕» para descartar. Saber dónde NO va resuelve más rápido que adivinar dónde sí."
  ]
};

const rowClues = SOLUTION.map(runsOf);
const columnClues = Array.from({ length: SIZE }, (_, column) => runsOf(SOLUTION.map((row) => row[column])));
const targetCount = SOLUTION.flat().filter(Boolean).length;

export function mount({ root, api, store }) {
  root.innerHTML = "";

  // 0 = vacío, 1 = pintado, 2 = descartado con ✕
  const grid = new Array(SIZE * SIZE).fill(0);
  let markMode = false;
  let painting = null;
  let bestScore = 0;

  const saved = store.load();
  if (saved && Array.isArray(saved.grid) && saved.grid.length === grid.length) {
    saved.grid.forEach((value, index) => {
      grid[index] = value;
    });
  }

  const wrap = document.createElement("div");
  wrap.className = "nono";
  wrap.style.setProperty("--nono-size", String(SIZE));

  const corner = document.createElement("div");
  corner.className = "nono__corner";

  const topClues = document.createElement("div");
  topClues.className = "nono__clues nono__clues--top";
  const topClueNodes = columnClues.map((clue) => {
    const box = document.createElement("div");
    box.className = "nono__clue";
    box.textContent = clue.join("\n");
    topClues.appendChild(box);
    return box;
  });

  const sideClues = document.createElement("div");
  sideClues.className = "nono__clues nono__clues--side";
  const sideClueNodes = rowClues.map((clue) => {
    const box = document.createElement("div");
    box.className = "nono__clue";
    box.textContent = clue.join(" ");
    sideClues.appendChild(box);
    return box;
  });

  const board = document.createElement("div");
  board.className = "nono__board";

  const cells = grid.map((_, index) => {
    const cell = document.createElement("div");
    cell.className = "nono__cell";
    if (index % SIZE === 4) cell.classList.add("is-fifth-left");
    if (Math.floor(index / SIZE) === 4) cell.classList.add("is-fifth-top");
    board.appendChild(cell);
    return cell;
  });

  wrap.append(corner, topClues, sideClues, board);
  root.appendChild(wrap);

  const modeButton = api.addTool("Modo: Pintar", () => {
    markMode = !markMode;
    modeButton.textContent = markMode ? "Modo: Marcar ✕" : "Modo: Pintar";
    modeButton.classList.toggle("is-active", markMode);
    api.setStatus(markMode ? "Modo marcar: cada toque descarta una casilla." : "Modo pintar: cada toque rellena una casilla.", "hint");
  });

  board.addEventListener("pointerdown", (event) => {
    if (api.solved) return;
    const index = cellAt(event);
    if (index < 0) return;

    event.preventDefault();
    board.setPointerCapture(event.pointerId);

    const target = markMode ? 2 : 1;
    painting = grid[index] === target ? 0 : target;
    apply(index);
  });

  board.addEventListener("pointermove", (event) => {
    if (painting === null) return;
    event.preventDefault();
    const index = cellAt(event);
    if (index >= 0) apply(index);
  }, { passive: false });

  const stopPainting = () => {
    if (painting === null) return;
    painting = null;
    store.save({ grid });
    evaluate();
  };

  board.addEventListener("pointerup", stopPainting);
  board.addEventListener("pointercancel", stopPainting);

  function cellAt(event) {
    const rect = board.getBoundingClientRect();
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    if (column < 0 || column >= SIZE || row < 0 || row >= SIZE) return -1;
    return row * SIZE + column;
  }

  function apply(index) {
    if (grid[index] === painting) return;
    grid[index] = painting;
    paint(index);
    refreshClues();
  }

  function paint(index) {
    const cell = cells[index];
    cell.classList.toggle("is-filled", grid[index] === 1);
    cell.classList.toggle("is-marked", grid[index] === 2);
    cell.textContent = grid[index] === 2 ? "✕" : "";
  }

  /**
   * Apaga la pista de toda fila o columna cuyas casillas pintadas ya coinciden
   * exactamente con sus números. No señala errores ni adelanta nada: solo
   * confirma lo que ya está resuelto, que es lo que deja seguir sin miedo a
   * tener que borrarlo todo al final. Las ✕ no cuentan, solo lo pintado.
   */
  function refreshClues() {
    for (let index = 0; index < SIZE; index += 1) {
      const row = [];
      const column = [];

      for (let step = 0; step < SIZE; step += 1) {
        row.push(grid[index * SIZE + step] === 1 ? 1 : 0);
        column.push(grid[step * SIZE + index] === 1 ? 1 : 0);
      }

      sideClueNodes[index].classList.toggle("is-done", sameRuns(runsOf(row), rowClues[index]));
      topClueNodes[index].classList.toggle("is-done", sameRuns(runsOf(column), columnClues[index]));
    }
  }

  function evaluate() {
    let correct = 0;
    let wrong = 0;

    grid.forEach((value, index) => {
      const expected = SOLUTION[Math.floor(index / SIZE)][index % SIZE];
      if (value === 1 && expected === 1) correct += 1;
      if (value === 1 && expected === 0) wrong += 1;
    });

    if (correct === targetCount && wrong === 0) {
      store.clear();
      board.classList.add("is-complete");
      api.solve("Un corazón. Sí, ya sé. Pero lo dedujiste tú, así que vale doble.");
      return;
    }

    const score = Math.max(0, correct - wrong * 2) / targetCount;
    api.setMeter(score);

    if (score > bestScore) {
      const previousStep = Math.min(meta.milestones - 1, Math.floor(bestScore * meta.milestones));
      bestScore = score;
      const step = Math.min(meta.milestones - 1, Math.floor(bestScore * meta.milestones));
      for (let index = previousStep; index < step; index += 1) {
        api.milestone("Vas bien. El dibujo empieza a tener forma y se libera parte del mensaje.");
      }
    }

    if (wrong > 0) {
      api.setStatus(`Hay ${wrong} casilla${wrong === 1 ? "" : "s"} pintada${wrong === 1 ? "" : "s"} de más. Revisa los números de las filas.`, "error");
      return;
    }

    api.setStatus(`${correct}/${targetCount} casillas correctas y ninguna de sobra. Así se hace.`, "neutral");
  }

  api.onReset(() => {
    grid.fill(0);
    bestScore = 0;
    cells.forEach((_, index) => paint(index));
    refreshClues();
    store.clear();
    api.setMeter(0);
  });

  grid.forEach((_, index) => paint(index));
  refreshClues();
  evaluate();

  return {
    destroy() {
      modeButton.remove();
    }
  };
}

function runsOf(line) {
  const runs = [];
  let current = 0;

  line.forEach((value) => {
    if (value) {
      current += 1;
      return;
    }
    if (current) runs.push(current);
    current = 0;
  });

  if (current) runs.push(current);
  return runs.length ? runs : [0];
}

function sameRuns(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
