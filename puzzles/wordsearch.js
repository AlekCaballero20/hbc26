const SIZE = 11;
const ALPHABET = "ABCDEFGHIJLMNOPRSTUVY";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1]
];

// Respaldo por si la etapa todavía no trae recuerdos personalizados.
const DEFAULT_ENTRIES = [
  { word: "SIEMPRE", clue: "Lo que respondes cuando pregunto hasta cuándo." },
  { word: "CANCION", clue: "Ocho de estas te trajeron hasta aquí." },
  { word: "CAFE", clue: "El ritual de las mañanas lentas." },
  { word: "RISA", clue: "Lo primero que elegí de ti." },
  { word: "OCHO", clue: "El número que lo ordena todo." },
  { word: "CASA", clue: "No siempre es un lugar." }
];

export const meta = {
  id: "wordsearch",
  title: "Sopa de recuerdos",
  genre: "Verbal · personal",
  skin: "wordsearch",
  milestones: 3,
  blurb: "Cada pista de abajo apunta a una palabra escondida en la sopa. Arrastra en línea recta (también en diagonal) para marcarla.",
  solvedText: "Todos los recuerdos encontrados.",
  hints: [
    "Las palabras pueden ir al derecho, al revés, hacia abajo, hacia arriba y en diagonal. Sí, en todas.",
    "Busca primero las letras raras: la Ñ, la X, la Y y las palabras largas se ven de lejos.",
    "Si una pista te tiene atorada, empieza por la primera letra de la respuesta que tú creas y ráspala por toda la cuadrícula."
  ]
};

export function mount({ root, api, rng, store, stage }) {
  root.innerHTML = "";

  const entries = (stage.memoryWords && stage.memoryWords.length ? stage.memoryWords : DEFAULT_ENTRIES)
    .map((entry) => ({ ...entry, word: normalize(entry.word) }))
    .filter((entry) => entry.word.length >= 3 && entry.word.length <= SIZE);

  const { letters, placements } = buildGrid(entries, rng);
  const found = new Set((store.load() || {}).found || []);

  const board = document.createElement("div");
  board.className = "wsearch__board";
  board.style.setProperty("--ws-size", String(SIZE));

  const cells = letters.map((letter, index) => {
    const cell = document.createElement("div");
    cell.className = "wsearch__cell";
    cell.textContent = letter;
    cell.dataset.index = String(index);
    board.appendChild(cell);
    return cell;
  });

  const list = document.createElement("ul");
  list.className = "wsearch__clues";
  const clueNodes = placements.map((placement) => {
    const item = document.createElement("li");
    item.className = "wsearch__clue";
    item.innerHTML = `<span class="wsearch__clue-text">${escapeHtml(placement.clue)}</span><span class="wsearch__clue-word">${placement.word.length} letras</span>`;
    list.appendChild(item);
    return item;
  });

  root.append(board, list);

  let selection = [];
  let dragging = false;
  let anchor = -1;
  let awarded = 0;

  board.addEventListener("pointerdown", (event) => {
    if (api.solved) return;
    const index = cellAt(event);
    if (index < 0) return;
    event.preventDefault();
    board.setPointerCapture(event.pointerId);
    dragging = true;
    anchor = index;
    selection = [index];
    paintSelection();
  });

  board.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    event.preventDefault();
    const index = cellAt(event);
    if (index < 0) return;
    selection = lineBetween(anchor, index);
    paintSelection();
  }, { passive: false });

  const finish = () => {
    if (!dragging) return;
    dragging = false;
    commit();
  };

  board.addEventListener("pointerup", finish);
  board.addEventListener("pointercancel", finish);

  function cellAt(event) {
    const rect = board.getBoundingClientRect();
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    if (column < 0 || column >= SIZE || row < 0 || row >= SIZE) return -1;
    return row * SIZE + column;
  }

  function lineBetween(from, to) {
    const rowA = Math.floor(from / SIZE);
    const columnA = from % SIZE;
    const rowB = Math.floor(to / SIZE);
    const columnB = to % SIZE;
    const dRow = Math.sign(rowB - rowA);
    const dColumn = Math.sign(columnB - columnA);
    const spanRow = Math.abs(rowB - rowA);
    const spanColumn = Math.abs(columnB - columnA);

    // Solo aceptamos rectas: horizontal, vertical o diagonal perfecta.
    if (spanRow !== 0 && spanColumn !== 0 && spanRow !== spanColumn) return [from];

    const length = Math.max(spanRow, spanColumn);
    const line = [];
    for (let step = 0; step <= length; step += 1) {
      line.push((rowA + dRow * step) * SIZE + (columnA + dColumn * step));
    }
    return line;
  }

  function paintSelection() {
    cells.forEach((cell, index) => cell.classList.toggle("is-selecting", selection.includes(index)));
  }

  function commit() {
    const text = selection.map((index) => letters[index]).join("");
    const reversed = [...text].reverse().join("");

    const hit = placements.find(
      (placement) => !found.has(placement.word) && (placement.word === text || placement.word === reversed)
    );

    cells.forEach((cell) => cell.classList.remove("is-selecting"));

    if (!hit) {
      if (selection.length > 2) api.nudge(`"${text}" no está en la lista. Sigue raspando.`, board);
      selection = [];
      return;
    }

    found.add(hit.word);
    hit.cells.forEach((index) => cells[index].classList.add("is-found"));
    clueNodes[placements.indexOf(hit)].classList.add("is-found");
    clueNodes[placements.indexOf(hit)].querySelector(".wsearch__clue-word").textContent = hit.word;
    selection = [];
    store.save({ found: [...found] });
    evaluate(hit.word);
  }

  function evaluate(justFound) {
    api.setMeter(found.size / placements.length);

    if (found.size === placements.length) {
      store.clear();
      api.solve("Todos los recuerdos encontrados. Estaban ahí desde el principio.");
      return;
    }

    const step = Math.min(meta.milestones, Math.floor((found.size / placements.length) * meta.milestones));
    while (awarded < step) {
      awarded += 1;
      api.milestone(`Encontraste "${justFound}". ${found.size}/${placements.length} recuerdos.`);
    }

    if (justFound) api.setStatus(`"${justFound}" encontrada. Van ${found.size} de ${placements.length}.`, "success");
  }

  api.onReset(() => {
    found.clear();
    awarded = 0;
    cells.forEach((cell) => cell.classList.remove("is-found"));
    clueNodes.forEach((node, index) => {
      node.classList.remove("is-found");
      node.querySelector(".wsearch__clue-word").textContent = `${placements[index].word.length} letras`;
    });
    store.clear();
    api.setMeter(0);
  });

  // Restaurar lo ya encontrado en una visita anterior.
  placements.forEach((placement, index) => {
    if (!found.has(placement.word)) return;
    placement.cells.forEach((cell) => cells[cell].classList.add("is-found"));
    clueNodes[index].classList.add("is-found");
    clueNodes[index].querySelector(".wsearch__clue-word").textContent = placement.word;
  });

  if (found.size) evaluate(null);
  else api.setStatus(`${placements.length} recuerdos escondidos. Lee las pistas de abajo.`, "neutral");

  return { destroy() {} };
}

function buildGrid(entries, rng) {
  const letters = new Array(SIZE * SIZE).fill(null);
  const placements = [];

  entries.forEach((entry) => {
    const spot = findSpot(letters, entry.word, rng);
    if (!spot) return;
    spot.forEach((index, position) => {
      letters[index] = entry.word[position];
    });
    placements.push({ ...entry, cells: spot });
  });

  for (let index = 0; index < letters.length; index += 1) {
    if (!letters[index]) letters[index] = ALPHABET[rng.int(0, ALPHABET.length - 1)];
  }

  return { letters, placements };
}

function findSpot(letters, word, rng) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const [dRow, dColumn] = rng.pick(DIRECTIONS);
    const row = rng.int(0, SIZE - 1);
    const column = rng.int(0, SIZE - 1);
    const endRow = row + dRow * (word.length - 1);
    const endColumn = column + dColumn * (word.length - 1);

    if (endRow < 0 || endRow >= SIZE || endColumn < 0 || endColumn >= SIZE) continue;

    const spot = [];
    let fits = true;

    for (let step = 0; step < word.length; step += 1) {
      const index = (row + dRow * step) * SIZE + (column + dColumn * step);
      const existing = letters[index];
      if (existing && existing !== word[step]) {
        fits = false;
        break;
      }
      spot.push(index);
    }

    if (fits) return spot;
  }

  return null;
}

function normalize(word) {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-ZñÑ]/g, "")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
