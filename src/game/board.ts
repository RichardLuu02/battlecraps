import type { Column, Coordinate, Orientation, RowNumber, Ship, ShipId } from '../types/game';

export const columns: Column[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const rows: RowNumber[] = [1, 2, 3, 4, 5, 6];
export const BOARD_SIZE = 6;

export interface Position {
  col: number;
  row: number;
}

export function toCoordinate(col: number, row: number): Coordinate {
  return `${columns[col]}${row + 1}`;
}

export function coordinateToPosition(coordinate: Coordinate): Position {
  return {
    col: columns.indexOf(coordinate[0] as Column),
    row: Number(coordinate.slice(1)) - 1,
  };
}

/** Row-major index 0–35 (A1 = 0, B1 = 1, …, F6 = 35). */
export function coordinateToIndex(coordinate: Coordinate): number {
  const { col, row } = coordinateToPosition(coordinate);
  return row * BOARD_SIZE + col;
}

export function indexToCoordinate(index: number): Coordinate {
  return toCoordinate(index % BOARD_SIZE, Math.floor(index / BOARD_SIZE));
}

export const ALL_COORDINATES: Coordinate[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) =>
  indexToCoordinate(i),
);

export function isOnBoard(col: number, row: number): boolean {
  return col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE;
}

/** Cell positions a ship would cover from an anchor position, including off-board ones. */
export function getShipPositions(anchor: Position, orientation: Orientation, length: number): Position[] {
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal' ? { col: anchor.col + i, row: anchor.row } : { col: anchor.col, row: anchor.row + i },
  );
}

/** Coordinates a ship would occupy, or null if any part falls off the board. */
export function getShipCoordinates(anchor: Coordinate, orientation: Orientation, length: number): Coordinate[] | null {
  const positions = getShipPositions(coordinateToPosition(anchor), orientation, length);
  if (!positions.every((p) => isOnBoard(p.col, p.row))) return null;
  return positions.map((p) => toCoordinate(p.col, p.row));
}

export function isValidPlacement(
  ships: Ship[],
  shipId: ShipId,
  anchor: Coordinate,
  orientation: Orientation,
): boolean {
  const ship = ships.find((s) => s.id === shipId);
  if (!ship) return false;
  const coords = getShipCoordinates(anchor, orientation, ship.length);
  if (!coords) return false;
  const occupied = new Set(ships.filter((s) => s.id !== shipId).flatMap((s) => s.coordinates));
  return coords.every((c) => !occupied.has(c));
}

export function getShipAtCoordinate(ships: Ship[], coordinate: Coordinate): Ship | undefined {
  return ships.find((s) => s.coordinates.includes(coordinate));
}

export function isCoordinateAlreadyHit(ships: Ship[], coordinate: Coordinate): boolean {
  return ships.some((s) => s.hits.includes(coordinate));
}
