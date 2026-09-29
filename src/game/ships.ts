import type { Coordinate, Orientation, Ship, ShipId } from '../types/game';
import { BOARD_SIZE, coordinateToPosition, isValidPlacement, toCoordinate } from './board';

export const SHIP_DEFINITIONS: ReadonlyArray<{ id: ShipId; name: string; length: number }> = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
];

export const TOTAL_SHIP_SECTIONS = SHIP_DEFINITIONS.reduce((sum, s) => sum + s.length, 0);

export function createFleet(): Ship[] {
  return SHIP_DEFINITIONS.map((def) => ({
    ...def,
    orientation: 'horizontal',
    coordinates: [],
    hits: [],
    firstHit: false,
    firstHitPayout: 0,
  }));
}

export function isPlaced(ship: Ship): boolean {
  return ship.coordinates.length === ship.length;
}

export function allShipsPlaced(ships: Ship[]): boolean {
  return ships.every(isPlaced);
}

export function isSunk(ship: Ship): boolean {
  return ship.hits.length >= ship.length;
}

/** Returns the updated fleet, or null if the placement is invalid. */
export function placeShip(ships: Ship[], shipId: ShipId, anchor: Coordinate, orientation: Orientation): Ship[] | null {
  if (!isValidPlacement(ships, shipId, anchor, orientation)) return null;
  return ships.map((s) => {
    if (s.id !== shipId) return s;
    const { col, row } = coordinateToPosition(anchor);
    const coordinates = Array.from({ length: s.length }, (_, i) =>
      orientation === 'horizontal' ? toCoordinate(col + i, row) : toCoordinate(col, row + i),
    );
    return { ...s, orientation, coordinates };
  });
}

/**
 * Rotates a ship about its anchor. If it no longer fits, slides it back along
 * the new axis to the nearest valid spot. Unplaced ships just flip orientation.
 */
export function rotateShip(ships: Ship[], shipId: ShipId): Ship[] | null {
  const ship = ships.find((s) => s.id === shipId);
  if (!ship) return null;
  const orientation: Orientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  if (!isPlaced(ship)) return ships.map((s) => (s.id === shipId ? { ...s, orientation } : s));

  const { col, row } = coordinateToPosition(ship.coordinates[0]);
  for (let shift = 0; shift < ship.length; shift++) {
    const c = orientation === 'horizontal' ? col - shift : col;
    const r = orientation === 'vertical' ? row - shift : row;
    if (c < 0 || r < 0) break;
    const result = placeShip(ships, shipId, toCoordinate(c, r), orientation);
    if (result) return result;
  }
  return null;
}

export function removeShip(ships: Ship[], shipId: ShipId): Ship[] {
  return ships.map((s) => (s.id === shipId ? { ...s, coordinates: [] } : s));
}

export function randomizeFleet(rng: () => number = Math.random): Ship[] {
  // A 6×6 board with 15 sections almost always resolves in a few tries; retry the whole fleet if boxed in.
  for (let attempt = 0; attempt < 200; attempt++) {
    let fleet = createFleet();
    let ok = true;
    for (const def of SHIP_DEFINITIONS) {
      const options: Array<{ anchor: Coordinate; orientation: Orientation }> = [];
      for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const anchor = toCoordinate(c, r);
            if (isValidPlacement(fleet, def.id, anchor, orientation)) options.push({ anchor, orientation });
          }
        }
      }
      if (options.length === 0) {
        ok = false;
        break;
      }
      const pick = options[Math.floor(rng() * options.length)];
      fleet = placeShip(fleet, def.id, pick.anchor, pick.orientation)!;
    }
    if (ok) return fleet;
  }
  throw new Error('Unable to randomize fleet');
}

/** Keeps positions but clears all battle damage (for a new round). */
export function repairFleet(ships: Ship[]): Ship[] {
  return ships.map((s) => ({ ...s, hits: [], firstHit: false, firstHitPayout: 0 }));
}
