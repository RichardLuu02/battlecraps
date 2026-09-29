import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { Coordinate, GameState, Ship, ShipId } from '../types/game';
import { ALL_COORDINATES, BOARD_SIZE, columns, coordinateToPosition, rows } from '../game/board';
import type { DragInfo } from '../hooks/useShipDrag';
import { ShipGraphic } from './Ship';
import { BoardEffects } from './BoardEffects';
import { cellBox } from './cellBox';

interface GameBoardProps {
  state: GameState;
  boardRef: RefObject<HTMLDivElement>;
  selectedShipId: ShipId | null;
  drag: DragInfo | null;
  incoming: Coordinate | null;
  onShipPointerDown: (shipId: ShipId, e: ReactPointerEvent<HTMLElement>) => void;
  onCellClick: (coordinate: Coordinate) => void;
}


function shipBox(ship: Ship): CSSProperties {
  const anchor = coordinateToPosition(ship.coordinates[0]);
  return ship.orientation === 'horizontal' ? cellBox(anchor, ship.length, 1) : cellBox(anchor, 1, ship.length);
}

export function GameBoard({ state, boardRef, selectedShipId, drag, incoming, onShipPointerDown, onCellClick }: GameBoardProps) {
  const { phase, ships, hits, misses, lastRoll } = state;
  const placing = phase === 'placement';
  const ghostKeys = new Set(drag?.cells.map((c) => `${c.col},${c.row}`) ?? []);
  const target = incoming ?? (state.rolling ? null : lastRoll.coordinate);

  return (
    <div className={`board-frame phase-${phase}`}>
      <div className="board-labels board-labels--cols" aria-hidden="true">
        {columns.map((c) => (
          <span key={c} className={target?.[0] === c ? 'is-target' : undefined}>
            {c}
          </span>
        ))}
      </div>
      <div className="board-labels board-labels--rows" aria-hidden="true">
        {rows.map((r) => (
          <span key={r} className={target && Number(target.slice(1)) === r ? 'is-target' : undefined}>
            {r}
          </span>
        ))}
      </div>

      <div className="board" ref={boardRef} role="grid" aria-label="Battleship board">
        <div className="board-water" aria-hidden="true" />

        {ALL_COORDINATES.map((coord) => {
          const pos = coordinateToPosition(coord);
          const ghost = ghostKeys.has(`${pos.col},${pos.row}`);
          const cls = [
            'cell',
            ghost ? (drag!.valid ? 'cell--ghost-ok' : 'cell--ghost-bad') : '',
            placing && selectedShipId ? 'cell--pickable' : '',
            coord === target ? 'cell--target' : '',
          ].join(' ');
          return (
            <button
              key={coord}
              type="button"
              className={cls}
              style={cellBox(pos)}
              onClick={() => onCellClick(coord)}
              aria-label={coord}
              tabIndex={placing ? 0 : -1}
            >
              <span className="cell-id">{coord}</span>
            </button>
          );
        })}

        {/* off-board part of an invalid drag preview */}
        {drag?.cells
          .filter((c) => c.col < 0 || c.row < 0 || c.col >= BOARD_SIZE || c.row >= BOARD_SIZE)
          .map((c) => <div key={`${c.col},${c.row}`} className="ghost-outside" style={cellBox(c)} />)}

        {ships
          .filter((s) => s.coordinates.length > 0)
          .map((ship) => {
            const discovered = ship.firstHit;
            const cls = [
              'board-ship',
              `board-ship--${phase}`,
              discovered ? 'is-discovered' : '',
              ship.hits.length === ship.length ? 'is-sunk' : '',
              selectedShipId === ship.id ? 'is-selected' : '',
              drag?.shipId === ship.id ? 'is-dragging' : '',
            ].join(' ');
            return (
              <div
                key={ship.id}
                className={cls}
                style={shipBox(ship)}
                onPointerDown={placing ? (e) => onShipPointerDown(ship.id, e) : undefined}
                aria-label={`${ship.name} at ${ship.coordinates.join(', ')}`}
              >
                <ShipGraphic
                  id={ship.id}
                  length={ship.length}
                  orientation={ship.orientation}
                  damaged={ship.hits.map((h) => ship.coordinates.indexOf(h))}
                />
              </div>
            );
          })}

        {misses.map((coord) => (
          <div key={`miss-${coord}`} className="marker marker--miss" style={cellBox(coordinateToPosition(coord))}>
            <span />
          </div>
        ))}
        {hits.map((coord) => (
          <div key={`hit-${coord}`} className="marker marker--hit" style={cellBox(coordinateToPosition(coord))}>
            <span className="flame" />
          </div>
        ))}

        {target && (
          <div key={`t-${target}-${state.shots.length}`} className="crosshair" style={cellBox(coordinateToPosition(target))}>
            <i />
            <i />
            <i />
            <i />
          </div>
        )}

        <AnimatePresence>
          {incoming && (
            <motion.div
              key={`inbound-${incoming}`}
              className="inbound"
              style={cellBox(coordinateToPosition(incoming))}
              initial={{ y: '-420%', opacity: 0, scale: 1.6 }}
              animate={{ y: '0%', opacity: 1, scale: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.55, 0, 0.9, 0.4] }}
            >
              <MissileShape />
            </motion.div>
          )}
        </AnimatePresence>

        <BoardEffects shot={state.lastShot} />
      </div>
    </div>
  );
}

/** Missile pointing down (nose at the bottom). Rotate 180° for an upright icon. */
export function MissileShape() {
  return (
    <svg viewBox="0 0 24 64" className="missile-shape" aria-hidden="true">
      <path d="M8 2 Q 12 -2 16 2 L 15 10 L 9 10 Z" fill="#ffb347" opacity="0.85" />
      <path d="M8 10 L 2 3 L 2 16 L 8 20 Z M16 10 L 22 3 L 22 16 L 16 20 Z" fill="#c0392b" />
      <rect x="7.5" y="8" width="9" height="40" rx="2" fill="#dfe8f1" stroke="#6c7f94" strokeWidth="1" />
      <rect x="7.5" y="30" width="9" height="4" fill="#ff3d3d" />
      <path d="M7.5 46 Q 12 64 16.5 46 Z" fill="#ff3d3d" />
    </svg>
  );
}
