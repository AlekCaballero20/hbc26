export function localPoint(element, event) {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    width: rect.width,
    height: rect.height
  };
}

export function onDrag(element, { onStart, onMove, onEnd, cursor = "grabbing" } = {}) {
  let activeId = null;
  let previousTouchAction = "";

  function handleDown(event) {
    if (activeId !== null || event.button > 0) return;

    activeId = event.pointerId;
    element.setPointerCapture(activeId);
    previousTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = "none";
    if (cursor) element.style.cursor = cursor;

    if (onStart && onStart(localPoint(element, event), event) === false) {
      release(event);
    }
  }

  function handleMove(event) {
    if (event.pointerId !== activeId) return;
    event.preventDefault();
    if (onMove) onMove(localPoint(element, event), event);
  }

  function handleUp(event) {
    if (event.pointerId !== activeId) return;
    if (onEnd) onEnd(localPoint(element, event), event);
    release(event);
  }

  function release(event) {
    if (activeId !== null && element.hasPointerCapture(activeId)) {
      element.releasePointerCapture(activeId);
    }
    activeId = null;
    document.body.style.touchAction = previousTouchAction;
    element.style.cursor = "";
    void event;
  }

  element.addEventListener("pointerdown", handleDown);
  element.addEventListener("pointermove", handleMove, { passive: false });
  element.addEventListener("pointerup", handleUp);
  element.addEventListener("pointercancel", handleUp);

  return () => {
    element.removeEventListener("pointerdown", handleDown);
    element.removeEventListener("pointermove", handleMove);
    element.removeEventListener("pointerup", handleUp);
    element.removeEventListener("pointercancel", handleUp);
  };
}

export function gridCellAt(point, columns, rows) {
  const column = Math.floor((point.x / point.width) * columns);
  const row = Math.floor((point.y / point.height) * rows);

  if (column < 0 || column >= columns || row < 0 || row >= rows) return null;

  return { column, row, index: row * columns + column };
}
