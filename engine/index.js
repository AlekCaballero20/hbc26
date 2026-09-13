import { createShell } from "./shell.js";
import { createRng } from "./rng.js";
import { createStore } from "./store.js";
import { puzzles } from "../puzzles/index.js";

export { clearAllPuzzleState } from "./store.js";

export function puzzleMeta(puzzleId) {
  return (puzzles[puzzleId] || puzzles.jigsaw).meta;
}

export function mountPuzzle({ host, stage, alreadyComplete, onReveal, onSolved }) {
  const module = puzzles[stage.puzzle] || puzzles.jigsaw;

  const shell = createShell(host, {
    meta: module.meta,
    words: stage.words,
    onReveal,
    onSolved
  });

  if (alreadyComplete) {
    shell.stage.innerHTML = `<p class="pz__replay">Ya resolviste este reto. El mensaje de la etapa sigue abajo.</p>`;
    shell.restoreSolved("Etapa ya resuelta. Puedes seguir al mapa cuando quieras.");
    return () => shell.destroy();
  }

  const instance = module.mount({
    root: shell.stage,
    api: shell,
    rng: createRng(`${stage.id}:${module.meta.id}`),
    store: createStore(stage.id, module.meta.id),
    stage
  });

  return () => {
    if (instance && typeof instance.destroy === "function") instance.destroy();
    shell.destroy();
  };
}
