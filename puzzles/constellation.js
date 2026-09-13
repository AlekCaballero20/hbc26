/**
 * Trazo de una sola línea (camino euleriano). El grafo está elegido a mano
 * para que tenga exactamente dos vértices de grado impar: hay solución, pero
 * solo si se empieza por uno de esos dos. Ocho aristas, porque todo aquí son
 * ochos.
 */
const NODES = [
  { x: 0.5, y: 0.08, label: "" },
  { x: 0.1, y: 0.36, label: "" },
  { x: 0.9, y: 0.36, label: "" },
  { x: 0.14, y: 0.88, label: "" },
  { x: 0.86, y: 0.88, label: "" }
];

const EDGES = [
  [1, 2],
  [2, 4],
  [4, 3],
  [3, 1],
  [1, 0],
  [0, 2],
  [1, 4],
  [2, 3]
];

export const meta = {
  id: "constellation",
  title: "La constelación de un solo trazo",
  genre: "Grafos · trazo",
  skin: "constellation",
  milestones: 3,
  blurb: "Dibuja las ocho líneas sin levantar el dedo y sin repetir ninguna. Puedes pasar dos veces por una estrella, pero nunca por la misma línea.",
  solvedText: "Ocho líneas, un solo trazo, cero repeticiones.",
  hints: [
    "No todas las estrellas sirven para empezar. Cuenta cuántas líneas salen de cada una.",
    "Solo dos estrellas tienen un número impar de líneas. El trazo tiene que empezar en una de esas dos y terminar en la otra.",
    "Esas dos son las de abajo. Arranca por una esquina inferior y la figura sale sola."
  ]
};

export function mount({ root, api, store }) {
  root.innerHTML = "";

  const canvas = document.createElement("canvas");
  canvas.className = "cons__canvas";
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const used = new Set((store.load() || {}).used || []);
  let trail = (store.load() || {}).trail || [];
  let current = trail.length ? trail[trail.length - 1] : -1;
  let pointer = null;
  let awarded = 0;
  let frame = 0;
  let running = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function point(node) {
    const rect = canvas.getBoundingClientRect();
    const padding = 26;
    return {
      x: padding + NODES[node].x * (rect.width - padding * 2),
      y: padding + NODES[node].y * (rect.height - padding * 2)
    };
  }

  function nodeAt(clientX, clientY, radius = 30) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let index = 0; index < NODES.length; index += 1) {
      const position = point(index);
      if (Math.hypot(position.x - x, position.y - y) <= radius) return index;
    }
    return -1;
  }

  function edgeKey(a, b) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  function edgeExists(a, b) {
    return EDGES.some(([from, to]) => (from === a && to === b) || (from === b && to === a));
  }

  function handleDown(event) {
    if (api.solved) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const node = nodeAt(event.clientX, event.clientY);
    if (node < 0) return;

    if (current < 0) {
      current = node;
      trail = [node];
      api.setStatus("Trazo iniciado. Arrastra hacia otra estrella conectada.", "neutral");
    } else if (node !== current) {
      // Tocar otra estrella con el trazo ya empezado intenta avanzar hacia ella.
      tryAdvance(node);
    }

    pointer = { x: event.clientX, y: event.clientY };
  }

  function handleMove(event) {
    if (current < 0 || api.solved) return;
    event.preventDefault();
    pointer = { x: event.clientX, y: event.clientY };

    const node = nodeAt(event.clientX, event.clientY, 26);
    if (node >= 0 && node !== current) tryAdvance(node);
  }

  function handleUp() {
    pointer = null;
  }

  function tryAdvance(node) {
    if (!edgeExists(current, node)) return;

    const key = edgeKey(current, node);
    if (used.has(key)) {
      api.nudge("Esa línea ya la dibujaste. No se puede repetir ninguna.", canvas);
      return;
    }

    used.add(key);
    trail.push(node);
    current = node;
    store.save({ used: [...used], trail });
    evaluate();
  }

  function evaluate() {
    api.setMeter(used.size / EDGES.length);

    if (used.size === EDGES.length) {
      store.clear();
      api.solve("Ocho líneas de un solo trazo. Esa constelación no la dibuja cualquiera.");
      return;
    }

    const step = Math.min(meta.milestones - 1, Math.floor((used.size / EDGES.length) * meta.milestones));
    while (awarded < step) {
      awarded += 1;
      api.milestone(`${used.size} de ${EDGES.length} líneas trazadas.`);
    }

    const stuck = !NODES.some((_, node) => edgeExists(current, node) && !used.has(edgeKey(current, node)));
    if (stuck) {
      api.setStatus(`Te quedaste sin salida con ${used.size}/${EDGES.length} líneas. Reinicia y arranca por otra estrella.`, "error");
      return;
    }

    api.setStatus(`${used.size}/${EDGES.length} líneas. Sigue sin levantar el dedo.`, "neutral");
  }

  function draw() {
    if (!running) return;
    frame += 1;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    EDGES.forEach(([from, to]) => {
      const a = point(from);
      const b = point(to);
      const isUsed = used.has(edgeKey(from, to));

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = isUsed ? 4 : 1.5;
      ctx.setLineDash(isUsed ? [] : [5, 7]);
      ctx.strokeStyle = isUsed ? "rgba(255, 143, 199, 0.95)" : "rgba(255, 248, 251, 0.22)";
      if (isUsed) {
        ctx.shadowColor = "rgba(255, 95, 168, 0.85)";
        ctx.shadowBlur = 14;
      }
      ctx.stroke();
      ctx.restore();
    });

    if (current >= 0 && pointer) {
      const a = point(current);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(pointer.x - rect.left, pointer.y - rect.top);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = "rgba(118, 215, 255, 0.6)";
      ctx.stroke();
      ctx.restore();
    }

    NODES.forEach((_, index) => {
      const position = point(index);
      const isCurrent = index === current;
      const pulse = isCurrent ? 2 + Math.sin(frame / 12) * 1.6 : 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(position.x, position.y, 11 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? "#ffd36f" : "rgba(255, 248, 251, 0.9)";
      ctx.shadowColor = isCurrent ? "rgba(255, 211, 111, 0.9)" : "rgba(141, 107, 255, 0.7)";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();

      const degree = EDGES.filter(([from, to]) => from === index || to === index).length;
      const left = EDGES.filter(
        ([from, to]) => (from === index || to === index) && !used.has(edgeKey(from, to))
      ).length;

      ctx.save();
      ctx.fillStyle = "rgba(16, 8, 31, 0.92)";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(left || degree), position.x, position.y);
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointerdown", handleDown);
  canvas.addEventListener("pointermove", handleMove, { passive: false });
  canvas.addEventListener("pointerup", handleUp);
  canvas.addEventListener("pointercancel", handleUp);

  api.onReset(() => {
    used.clear();
    trail = [];
    current = -1;
    awarded = 0;
    store.clear();
    api.setMeter(0);
    api.setStatus("Trazo borrado. Piensa bien por cuál estrella empezar.", "neutral");
  });

  requestAnimationFrame(draw);
  if (used.size) evaluate();
  else api.setStatus("Toca una estrella para empezar el trazo. El número dice cuántas líneas le faltan.", "neutral");

  return {
    destroy() {
      running = false;
      observer.disconnect();
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
    }
  };
}
