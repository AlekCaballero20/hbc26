const PREFIX = "hbc.puzzle";

export function createStore(stageId, puzzleId) {
  const key = `${PREFIX}.${stageId}.${puzzleId}`;

  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    },
    save(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* almacenamiento lleno o bloqueado: el juego sigue, solo no recuerda */
      }
    },
    clear() {
      localStorage.removeItem(key);
    }
  };
}

export function clearAllPuzzleState() {
  const doomed = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(PREFIX)) doomed.push(key);
  }

  doomed.forEach((key) => localStorage.removeItem(key));
}
