import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Ship, ShipId } from '../types/game';
import { allShipsPlaced, isPlaced } from '../game/ships';
import { ShipGraphic } from './Ship';

interface ShipPlacementProps {
  ships: Ship[];
  selectedShipId: ShipId | null;
  draggingShipId: ShipId | null;
  onSelect: (shipId: ShipId) => void;
  onDockPointerDown: (shipId: ShipId, e: ReactPointerEvent<HTMLElement>) => void;
  onRemove: (shipId: ShipId) => void;
  onRotate: () => void;
  onRandomize: () => void;
  onClear: () => void;
  onReady: () => void;
}

export function ShipPlacement({
  ships,
  selectedShipId,
  draggingShipId,
  onSelect,
  onDockPointerDown,
  onRemove,
  onRotate,
  onRandomize,
  onClear,
  onReady,
}: ShipPlacementProps) {
  const placedCount = ships.filter(isPlaced).length;
  const ready = allShipsPlaced(ships);
  const selected = ships.find((s) => s.id === selectedShipId);

  return (
    <section className="panel placement-panel">
      <h2 className="panel-title">Place Your Ships</h2>
      <p className="panel-hint">
        Drag onto the grid, or select a ship and tap a cell. <kbd>R</kbd> rotates, arrows nudge.
      </p>

      <ul className="dock">
        {ships.map((ship) => {
          const placed = isPlaced(ship);
          return (
            <li
              key={ship.id}
              className={`dock-item ${placed ? 'is-placed' : ''} ${selectedShipId === ship.id ? 'is-selected' : ''} ${
                draggingShipId === ship.id ? 'is-dragging' : ''
              }`}
            >
              <button type="button" className="dock-select" onClick={() => onSelect(ship.id)}>
                <span className="dock-name">{ship.name}</span>
                <span className="dock-len">[{ship.length}]</span>
                <span className="dock-orient" title={ship.orientation}>
                  {ship.orientation === 'horizontal' ? '↔' : '↕'}
                </span>
                {placed && <span className="dock-check">✓</span>}
              </button>
              <div
                className="dock-ship"
                style={{ aspectRatio: `${ship.length} / 1`, width: `${(ship.length / 5) * 100}%` }}
                onPointerDown={(e) => onDockPointerDown(ship.id, e)}
                title="Drag onto the board"
              >
                <ShipGraphic id={ship.id} length={ship.length} orientation="horizontal" />
              </div>
              {placed && (
                <button type="button" className="dock-remove" onClick={() => onRemove(ship.id)} aria-label={`Remove ${ship.name}`}>
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="placement-actions">
        <button type="button" className="btn btn-ghost" onClick={onRotate} disabled={!selected}>
          ⟳ Rotate{selected ? ` ${selected.name}` : ''}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRandomize}>
          Randomize Fleet
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClear} disabled={placedCount === 0}>
          ✕ Clear Board
        </button>
        <button type="button" className={`btn btn-ready ${ready ? 'is-ready' : ''}`} onClick={onReady} disabled={!ready}>
          {ready ? 'Ready ▸' : `Ready (${placedCount}/4 placed)`}
        </button>
      </div>
    </section>
  );
}
