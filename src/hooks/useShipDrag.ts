import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { Coordinate, Orientation, Ship, ShipId } from '../types/game';
import { BOARD_SIZE, getShipPositions, isOnBoard, isValidPlacement, toCoordinate } from '../game/board';
import type { Position } from '../game/board';

export interface DragInfo {
  shipId: ShipId;
  length: number;
  orientation: Orientation;
  /** Which segment of the ship is under the pointer. */
  grabIndex: number;
  x: number;
  y: number;
  cellSize: number;
  moved: boolean;
  anchor: Coordinate | null;
  cells: Position[];
  valid: boolean;
}

interface Options {
  ships: Ship[];
  enabled: boolean;
  boardRef: RefObject<HTMLDivElement>;
  onDrop: (shipId: ShipId, anchor: Coordinate, orientation: Orientation) => void;
  onInvalidDrop: () => void;
  onClick: (shipId: ShipId) => void;
}

const DRAG_THRESHOLD = 5;

/** Pointer-based drag & drop (mouse + touch) of ships from the dock or board onto the grid. */
export function useShipDrag({ ships, enabled, boardRef, onDrop, onInvalidDrop, onClick }: Options) {
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const latest = useRef({ ships, onDrop, onInvalidDrop, onClick });
  latest.current = { ships, onDrop, onInvalidDrop, onClick };

  const update = (next: DragInfo | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const locate = useCallback(
    (info: DragInfo, x: number, y: number): DragInfo => {
      const rect = boardRef.current?.getBoundingClientRect();
      const base = { ...info, x, y, anchor: null, cells: [], valid: false };
      if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return base;

      const size = rect.width / BOARD_SIZE;
      const col = Math.min(BOARD_SIZE - 1, Math.floor((x - rect.left) / size));
      const row = Math.min(BOARD_SIZE - 1, Math.floor((y - rect.top) / size));
      const anchor =
        info.orientation === 'horizontal' ? { col: col - info.grabIndex, row } : { col, row: row - info.grabIndex };
      const cells = getShipPositions(anchor, info.orientation, info.length);
      const onBoard = cells.every((c) => isOnBoard(c.col, c.row));
      const anchorCoord = onBoard ? toCoordinate(anchor.col, anchor.row) : null;
      const valid = !!anchorCoord && isValidPlacement(latest.current.ships, info.shipId, anchorCoord, info.orientation);
      return { ...base, cellSize: size, anchor: anchorCoord, cells, valid };
    },
    [boardRef],
  );

  const handleMove = useCallback(
    (e: PointerEvent) => {
      const info = dragRef.current;
      if (!info) return;
      const moved = info.moved || Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > DRAG_THRESHOLD;
      update(locate({ ...info, moved }, e.clientX, e.clientY));
    },
    [locate],
  );

  const handleUp = useCallback(() => {
    const info = dragRef.current;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    window.removeEventListener('pointercancel', handleUp);
    update(null);
    if (!info) return;
    if (!info.moved) latest.current.onClick(info.shipId);
    else if (info.valid && info.anchor) latest.current.onDrop(info.shipId, info.anchor, info.orientation);
    else if (info.cells.length) latest.current.onInvalidDrop();
  }, [handleMove]);

  /**
   * Begin a potential drag. `horizontalElement` says how the grabbed element is laid out,
   * which determines which segment the pointer is over.
   */
  const beginDrag = useCallback(
    (shipId: ShipId, e: ReactPointerEvent<HTMLElement>, horizontalElement: boolean) => {
      if (!enabled || e.button !== 0) return;
      const ship = latest.current.ships.find((s) => s.id === shipId);
      if (!ship) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const fraction = horizontalElement ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height;
      const grabIndex = Math.max(0, Math.min(ship.length - 1, Math.floor(fraction * ship.length)));
      const boardRect = boardRef.current?.getBoundingClientRect();

      start.current = { x: e.clientX, y: e.clientY };
      update({
        shipId,
        length: ship.length,
        orientation: ship.orientation,
        grabIndex,
        x: e.clientX,
        y: e.clientY,
        cellSize: boardRect ? boardRect.width / BOARD_SIZE : 60,
        moved: false,
        anchor: null,
        cells: [],
        valid: false,
      });
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [enabled, boardRef, handleMove, handleUp],
  );

  /** Flip the orientation of the ship being dragged (R key mid-drag). */
  const rotateDrag = useCallback(() => {
    const info = dragRef.current;
    if (!info) return false;
    const orientation: Orientation = info.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    update(locate({ ...info, orientation }, info.x, info.y));
    return true;
  }, [locate]);

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    },
    [handleMove, handleUp],
  );

  return { drag: drag?.moved ? drag : null, pendingShipId: drag?.shipId ?? null, beginDrag, rotateDrag };
}
