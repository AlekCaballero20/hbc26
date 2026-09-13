/**
 * Los tres tableros están verificados con un solver de fuerza bruta y su
 * solución óptima es de 11, 16 y 33 movimientos respectivamente. Ese es el
 * orden: la curva sube, no salta.
 */
const LEVELS = [
  [
    "#######",
    "#     #",
    "# $ $ #",
    "#  @  #",
    "# . . #",
    "#     #",
    "#######"
  ],
  [
    "######",
    "#    #",
    "# #@ #",
    "# $* #",
    "# .* #",
    "#    #",
    "######"
  ],
  [
    "#####-",
    "# .#-",
    "#  ###",
    "#*@  #",
    "#  $ #",
    "#  ###",
    "#####-"
  ]
];

const DIRECTIONS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1]
};

export const meta = {
  id: "sokoban",
  title: "Mover sin arrepentirse",
  genre: "Planeación",
  skin: "sokoban",
  milestones: 3,
  blurb: "Empuja cada estrella hasta su hueco. Solo puedes empujar, nunca halar. Desliza el dedo o usa las flechas.",
  solvedText: "Tres tableros y ninguna estrella atrapada en una esquina.",
  hints: [
    "Regla de oro: una estrella pegada a una pared ya no se puede mover en paralelo a esa pared. Una estrella en una esquina está muerta.",
    "Piensa al revés: mira el hueco de destino y pregúntate desde qué lado tendrías que empujar para llegar ahí.",
    "El botón «Deshacer» no es trampa, es el juego. Sokoban se juega probando y retrocediendo."
  ]
};

export function mount({ root, api, store }) {
  root.innerHTML = "";

  const frame = document.createElement("div");
  frame.className = "soko__frame";

  const board = document.createElement("div");
  board.className = "soko__board";
  frame.appendChild(board);

  const pad = document.createElement("div");
  pad.className = "soko__pad";
  ["up", "left", "down", "right"].forEach((direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `soko__key soko__key--${direction}`;
    button.textContent = { up: "▲", down: "▼", left: "◀", right: "▶" }[direction];
    button.setAttribute("aria-label", direction);
    button.addEventListener("click", () => move(direction));
    pad.appendChild(button);
  });

  root.append(frame, pad);

  let levelIndex = 0;
  let state = null;
  let history = [];

  const saved = store.load();
  if (saved && typeof saved.levelIndex === "number") levelIndex = Math.min(saved.levelIndex, LEVELS.length - 1);

  const undoButton = api.addTool("Deshacer", undo);

  function loadLevel(index) {
    const rows = LEVELS[index];
    const width = Math.max(...rows.map((row) => row.length));
    const walls = new Set();
    const goals = new Set();
    const boxes = new Set();
    let player = 0;

    rows.forEach((row, rowIndex) => {
      for (let column = 0; column < width; column += 1) {
        const key = rowIndex * width + column;
        const glyph = row[column] || "-";
        if (glyph === "#") walls.add(key);
        if (glyph === "-") walls.add(key);
        if (glyph === "." || glyph === "*" || glyph === "+") goals.add(key);
        if (glyph === "$" || glyph === "*") boxes.add(key);
        if (glyph === "@" || glyph === "+") player = key;
      }
    });

    state = { width, height: rows.length, walls, goals, boxes, player, outside: rows };
    history = [];
    render();
  }

  function snapshot() {
    return { boxes: new Set(state.boxes), player: state.player };
  }

  function undo() {
    if (!history.length || api.solved) return;
    const previous = history.pop();
    state.boxes = previous.boxes;
    state.player = previous.player;
    render();
    api.setStatus("Un paso atrás. Sigue siendo progreso.", "hint");
  }

  function move(direction) {
    if (api.solved || !state) return;

    const [dRow, dColumn] = DIRECTIONS[direction];
    const step = dRow * state.width + dColumn;
    const next = state.player + step;
    const beyond = next + step;

    if (state.walls.has(next)) {
      api.nudge("Ahí hay pared. La terquedad no atraviesa concreto.", board);
      return;
    }

    const before = snapshot();

    if (state.boxes.has(next)) {
      if (state.walls.has(beyond) || state.boxes.has(beyond)) {
        api.nudge("Esa estrella no tiene hacia dónde ir. Busca otro ángulo.", board);
        return;
      }
      state.boxes.delete(next);
      state.boxes.add(beyond);
    }

    history.push(before);
    state.player = next;
    render();
    checkLevel();
  }

  function checkLevel() {
    const placed = [...state.boxes].filter((box) => state.goals.has(box)).length;
    api.setMeter((levelIndex + placed / state.goals.size) / LEVELS.length);

    if (placed !== state.goals.size) {
      api.setStatus(`Tablero ${levelIndex + 1}/${LEVELS.length} · ${placed}/${state.goals.size} estrellas en su hueco.`, "neutral");
      return;
    }

    levelIndex += 1;
    store.save({ levelIndex });

    if (levelIndex >= LEVELS.length) {
      store.clear();
      api.solve("Tres tableros limpios. Pensar antes de empujar: se puede.");
      return;
    }

    api.milestone(`Tablero resuelto. Va el ${levelIndex + 1} de ${LEVELS.length}.`);
    loadLevel(levelIndex);
  }

  function render() {
    board.style.setProperty("--soko-cols", String(state.width));
    board.innerHTML = "";

    for (let row = 0; row < state.height; row += 1) {
      for (let column = 0; column < state.width; column += 1) {
        const key = row * state.width + column;
        const glyph = state.outside[row][column] || "-";
        const cell = document.createElement("div");
        cell.className = "soko__cell";

        if (glyph === "-" || glyph === undefined) cell.classList.add("is-void");
        else if (state.walls.has(key)) cell.classList.add("is-wall");
        else cell.classList.add("is-floor");

        if (state.goals.has(key)) cell.classList.add("is-goal");
        if (state.boxes.has(key)) {
          cell.classList.add("is-box");
          if (state.goals.has(key)) cell.classList.add("is-box-home");
          cell.textContent = "★";
        }
        if (state.player === key) {
          cell.classList.add("is-player");
          cell.textContent = "💜";
        }

        board.appendChild(cell);
      }
    }
  }

  let swipeStart = null;

  function onPointerDown(event) {
    swipeStart = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  }

  function onKeyDown(event) {
    const map = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right"
    };
    const direction = map[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  }

  board.addEventListener("pointerdown", onPointerDown);
  board.addEventListener("pointerup", onPointerUp);
  document.addEventListener("keydown", onKeyDown);

  api.onReset(() => {
    loadLevel(levelIndex);
    api.setStatus("Tablero reiniciado. Las estrellas vuelven a su sitio original.", "neutral");
  });

  loadLevel(levelIndex);
  checkLevel();

  return {
    destroy() {
      board.removeEventListener("pointerdown", onPointerDown);
      board.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keydown", onKeyDown);
      undoButton.remove();
    }
  };
}
