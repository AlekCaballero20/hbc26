const SIZE = 6;
const TOTAL = SIZE * SIZE;
const PAIRS = 5;
const COLORS = ["#ff5fa8", "#76d7ff", "#ffd36f", "#8d6bff", "#7df0b8"];

export const meta = {
  id: "flow",
  title: "Los hilos que no se cruzan",
  genre: "Ruteo · arrastre",
  skin: "flow",
  milestones: 3,
  blurb: "Une cada par de puntos del mismo color arrastrando el dedo. Los caminos no pueden cruzarse y no puede quedar ninguna casilla vacía.",
  solvedText: "Todos los hilos conectados y ni una casilla suelta.",
  hints: [
    "La regla que casi todo el mundo olvida: no basta con conectar, hay que llenar el tablero completo.",
    "Empieza por los pares que están en el borde o en una esquina. Casi siempre tienen una sola ruta razonable.",
    "Si un color deja una casilla aislada con un solo vecino libre, ese camino está mal. Deshazlo y bordea en vez de cortar."
  ]
};

export function mount({ root, api, rng, store }) {
  root.innerHTML = "";

  const board = document.createElement("div");
  board.className = "flow__board";
  root.appendChild(board);

  const cells = [];
  for (let index = 0; index < TOTAL; index += 1) {
    const cell = document.createElement("div");
    cell.className = "flow__cell";
    cell.dataset.index = String(index);
    cells.push(cell);
    board.appendChild(cell);
  }

  const layout = buildLayout(rng);
  const paths = layout.endpoints.map(() => []);
  let activeColor = -1;
  let bestPairs = 0;

  const saved = store.load();
  if (saved && saved.seedTag === layout.seedTag && Array.isArray(saved.paths)) {
    saved.paths.forEach((path, index) => {
      if (Array.isArray(path)) paths[index] = [...path];
    });
  }

  board.addEventListener("pointerdown", handleDown);
  board.addEventListener("pointermove", handleMove, { passive: false });
  board.addEventListener("pointerup", handleUp);
  board.addEventListener("pointercancel", handleUp);

  function cellAt(event) {
    const rect = board.getBoundingClientRect();
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    if (column < 0 || column >= SIZE || row < 0 || row >= SIZE) return -1;
    return row * SIZE + column;
  }

  function ownerOf(index) {
    for (let color = 0; color < paths.length; color += 1) {
      if (paths[color].includes(index)) return color;
    }
    return -1;
  }

  function endpointColor(index) {
    return layout.endpoints.findIndex((pair) => pair.includes(index));
  }

  function handleDown(event) {
    if (api.solved) return;
    const index = cellAt(event);
    if (index < 0) return;

    event.preventDefault();
    board.setPointerCapture(event.pointerId);

    const asEndpoint = endpointColor(index);
    const asPath = ownerOf(index);

    if (asEndpoint >= 0) {
      activeColor = asEndpoint;
      // Reempezar desde el extremo tocado borra la ruta anterior de ese color.
      paths[activeColor] = [index];
    } else if (asPath >= 0) {
      // Retomar una ruta a medio hacer desde donde se tocó.
      activeColor = asPath;
      paths[activeColor] = paths[activeColor].slice(0, paths[activeColor].indexOf(index) + 1);
    } else {
      return;
    }

    render();
  }

  function handleMove(event) {
    if (activeColor < 0) return;
    event.preventDefault();

    const index = cellAt(event);
    if (index < 0) return;

    const path = paths[activeColor];
    const head = path[path.length - 1];
    if (index === head) return;

    const backtrackAt = path.indexOf(index);
    if (backtrackAt >= 0) {
      path.length = backtrackAt + 1;
      render();
      return;
    }

    if (!adjacent(head, index)) return;

    const otherEndpoint = endpointColor(index);
    if (otherEndpoint >= 0 && otherEndpoint !== activeColor) return;

    const occupant = ownerOf(index);
    if (occupant >= 0 && occupant !== activeColor) {
      // Pasar por encima de otro color lo corta en ese punto, como en Flow.
      paths[occupant] = paths[occupant].slice(0, paths[occupant].indexOf(index));
    }

    path.push(index);

    if (otherEndpoint === activeColor && index !== path[0]) {
      activeColor = -1;
      render();
      evaluate();
      return;
    }

    render();
  }

  function handleUp() {
    if (activeColor < 0) return;
    activeColor = -1;
    render();
    evaluate();
  }

  function isConnected(color) {
    const path = paths[color];
    if (path.length < 2) return false;
    const [a, b] = layout.endpoints[color];
    const first = path[0];
    const last = path[path.length - 1];
    return (first === a && last === b) || (first === b && last === a);
  }

  function evaluate() {
    store.save({ seedTag: layout.seedTag, paths });

    const connected = paths.map((_, color) => isConnected(color));
    const done = connected.filter(Boolean).length;
    const filled = new Set(paths.flat()).size;

    api.setMeter((done / PAIRS) * 0.7 + (filled / TOTAL) * 0.3);

    if (done === PAIRS && filled === TOTAL) {
      store.clear();
      api.solve("Cinco hilos, cero cruces, cero huecos.");
      return;
    }

    if (done > bestPairs) {
      const previous = bestPairs;
      bestPairs = done;
      const target = Math.min(meta.milestones - 1, Math.floor((bestPairs / PAIRS) * meta.milestones));
      const reached = Math.min(meta.milestones - 1, Math.floor((previous / PAIRS) * meta.milestones));
      for (let step = reached; step < target; step += 1) {
        api.milestone(`${done} de ${PAIRS} hilos conectados. Cae un pedazo del mensaje.`);
      }
    }

    if (done === PAIRS && filled < TOTAL) {
      api.setStatus(`Todos conectados, pero quedan ${TOTAL - filled} casillas vacías. En este juego eso todavía no cuenta.`, "hint");
      return;
    }

    api.setStatus(`${done}/${PAIRS} hilos · ${filled}/${TOTAL} casillas ocupadas.`, "neutral");
  }

  function render() {
    cells.forEach((cell, index) => {
      cell.className = "flow__cell";
      cell.innerHTML = "";
      cell.style.removeProperty("--flow-color");

      const color = endpointColor(index);
      const owner = ownerOf(index);
      const shown = color >= 0 ? color : owner;

      if (shown < 0) return;

      cell.style.setProperty("--flow-color", COLORS[shown]);

      if (color >= 0) {
        cell.classList.add("is-endpoint");
        const dot = document.createElement("span");
        dot.className = "flow__dot";
        cell.appendChild(dot);
      }

      if (owner >= 0) {
        cell.classList.add("is-path");
        const path = paths[owner];
        const position = path.indexOf(index);
        [path[position - 1], path[position + 1]].forEach((neighbor) => {
          if (neighbor === undefined) return;
          const link = document.createElement("span");
          link.className = `flow__link flow__link--${direction(index, neighbor)}`;
          cell.appendChild(link);
        });
        if (position === path.length - 1 && color < 0) cell.classList.add("is-head");
      }
    });
  }

  api.onReset(() => {
    paths.forEach((_, color) => {
      paths[color] = [];
    });
    bestPairs = 0;
    store.clear();
    render();
    api.setMeter(0);
  });

  render();
  evaluate();

  return {
    destroy() {
      board.removeEventListener("pointerdown", handleDown);
      board.removeEventListener("pointermove", handleMove);
      board.removeEventListener("pointerup", handleUp);
      board.removeEventListener("pointercancel", handleUp);
    }
  };
}

function adjacent(a, b) {
  const rowA = Math.floor(a / SIZE);
  const rowB = Math.floor(b / SIZE);
  return Math.abs(rowA - rowB) + Math.abs((a % SIZE) - (b % SIZE)) === 1;
}

function direction(from, to) {
  if (to === from - SIZE) return "up";
  if (to === from + SIZE) return "down";
  if (to === from - 1) return "left";
  return "right";
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

/**
 * Recorremos todo el tablero con un camino hamiltoniano aleatorio y luego lo
 * cortamos en cinco tramos. Cada tramo es, por construcción, un camino válido,
 * así que el tablero siempre tiene solución y además llena todas las casillas.
 */
function buildLayout(rng) {
  const walk = hamiltonianWalk(rng) || snakeWalk();
  const cuts = splitPoints(rng);
  const endpoints = [];

  for (let pair = 0; pair < PAIRS; pair += 1) {
    const from = cuts[pair];
    const to = cuts[pair + 1] - 1;
    endpoints.push([walk[from], walk[to]]);
  }

  return { endpoints, seedTag: walk.slice(0, 6).join("-") };
}

function splitPoints(rng) {
  const base = Math.floor(TOTAL / PAIRS);
  const points = [0];
  let cursor = 0;

  for (let pair = 0; pair < PAIRS - 1; pair += 1) {
    const remaining = PAIRS - pair - 1;
    const jitter = rng.int(-1, 1);
    const length = Math.max(3, Math.min(base + jitter, TOTAL - cursor - remaining * 3));
    cursor += length;
    points.push(cursor);
  }

  points.push(TOTAL);
  return points;
}

function hamiltonianWalk(rng) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const visited = new Array(TOTAL).fill(false);
    const path = [];
    let steps = 0;

    const found = (function walk(cell) {
      steps += 1;
      if (steps > 20000) return false;

      visited[cell] = true;
      path.push(cell);
      if (path.length === TOTAL) return true;

      const options = rng
        .shuffle(neighborsOf(cell).filter((next) => !visited[next]))
        .sort((a, b) => freeDegree(a, visited) - freeDegree(b, visited));

      for (const next of options) {
        if (walk(next)) return true;
      }

      visited[cell] = false;
      path.pop();
      return false;
    })(rng.int(0, TOTAL - 1));

    if (found) return path;
  }

  return null;
}

function freeDegree(index, visited) {
  return neighborsOf(index).filter((next) => !visited[next]).length;
}

function snakeWalk() {
  const path = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let step = 0; step < SIZE; step += 1) {
      const column = row % 2 === 0 ? step : SIZE - 1 - step;
      path.push(row * SIZE + column);
    }
  }
  return path;
}
