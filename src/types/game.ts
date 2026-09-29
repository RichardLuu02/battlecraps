export type Column = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type RowNumber = 1 | 2 | 3 | 4 | 5 | 6;

/** A board location such as "A1" or "F6". */
export type Coordinate = string;

export type Orientation = 'horizontal' | 'vertical';

export type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine';

export type Phase = 'placement' | 'betting' | 'playing' | 'gameover';

export type ShotOutcome = 'hit' | 'miss' | 'already-hit';

export interface Ship {
  id: ShipId;
  name: string;
  length: number;
  orientation: Orientation;
  /** Occupied cells, ordered from the anchor (top/left) outward. Empty = not placed. */
  coordinates: Coordinate[];
  hits: Coordinate[];
  firstHit: boolean;
  /** Locked in permanently at the moment of discovery. */
  firstHitPayout: number;
}

export interface Roll {
  letter: Column | null;
  number: RowNumber | null;
  coordinate: Coordinate | null;
}

export interface ShotResult {
  id: number;
  letter: Column;
  number: RowNumber;
  coordinate: Coordinate;
  outcome: ShotOutcome;
  shipId: ShipId | null;
  shipName: string | null;
  payout: number;
  /** True when this shot was the first hit on its ship. */
  discovered: boolean;
  /** True when this shot hit the final unhit section of its ship. */
  sunk: boolean;
  missilesAfter: number;
  reserveAfter: number;
}

export interface GameState {
  phase: Phase;
  bet: number;
  balance: number;
  missiles: number;
  reserve: number;
  payout: number;
  ships: Ship[];
  shots: ShotResult[];
  /** Unique ship coordinates that have been hit. */
  hits: Coordinate[];
  /** Unique water coordinates that have been struck. */
  misses: Coordinate[];
  lastRoll: Roll;
  lastShot: ShotResult | null;
  rolling: boolean;
  gameOver: boolean;
  fleetDestroyed: boolean;
}

export type GameAction =
  | { type: 'PLACE_SHIP'; shipId: ShipId; anchor: Coordinate; orientation: Orientation }
  | { type: 'ROTATE_SHIP'; shipId: ShipId }
  | { type: 'REMOVE_SHIP'; shipId: ShipId }
  | { type: 'RANDOMIZE_FLEET' }
  | { type: 'CLEAR_BOARD' }
  | { type: 'READY' }
  | { type: 'SET_BET'; amount: number }
  | { type: 'START_ROLL' }
  | { type: 'RESOLVE_SHOT'; letter: Column; number: RowNumber }
  | { type: 'PLAY_AGAIN' }
  | { type: 'REFILL_BALANCE' };
