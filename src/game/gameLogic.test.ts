import { describe, expect, it } from 'vitest';
import type { GameState } from '../types/game';
import { getShipCoordinates, isValidPlacement } from './board';
import { rollLetter, rollNumber } from './dice';
import { createInitialState, gameReducer, resolveShot } from './gameLogic';
import { maxFleetPayout } from './payout';
import { createFleet, placeShip, randomizeFleet, rotateShip } from './ships';

/** Carrier A1–E1, Battleship A2–D2, Cruiser A3–C3, Submarine A4–C4, bet $10, first shot fired. */
function playingState(): GameState {
  let ships = createFleet();
  ships = placeShip(ships, 'carrier', 'A1', 'horizontal')!;
  ships = placeShip(ships, 'battleship', 'A2', 'horizontal')!;
  ships = placeShip(ships, 'cruiser', 'A3', 'horizontal')!;
  ships = placeShip(ships, 'submarine', 'A4', 'horizontal')!;
  let state: GameState = { ...createInitialState(), ships };
  state = gameReducer(state, { type: 'READY' });
  state = gameReducer(state, { type: 'SET_BET', amount: 10 });
  return gameReducer(state, { type: 'START_ROLL' });
}

function shoot(state: GameState, coord: string): GameState {
  const rolling = { ...state, rolling: true };
  return resolveShot(rolling, coord[0] as 'A', Number(coord.slice(1)) as 1);
}

describe('board', () => {
  it('rejects off-board and overlapping placements', () => {
    const ships = placeShip(createFleet(), 'carrier', 'A1', 'horizontal')!;
    expect(getShipCoordinates('C1', 'horizontal', 5)).toBeNull();
    expect(isValidPlacement(ships, 'battleship', 'B1', 'vertical')).toBe(false);
    expect(isValidPlacement(ships, 'battleship', 'B2', 'vertical')).toBe(true);
  });

  it('rotation slides a ship back onto the board', () => {
    const ships = placeShip(createFleet(), 'carrier', 'A5', 'horizontal')!;
    const rotated = rotateShip(ships, 'carrier')!;
    expect(rotated[0].coordinates).toEqual(['A2', 'A3', 'A4', 'A5', 'A6']);
  });

  it('randomizes a complete, non-overlapping fleet', () => {
    for (let i = 0; i < 50; i++) {
      const fleet = randomizeFleet();
      const cells = fleet.flatMap((s) => s.coordinates);
      expect(cells).toHaveLength(15);
      expect(new Set(cells).size).toBe(15);
    }
  });
});

describe('dice', () => {
  it('covers every face', () => {
    const letters = new Set<string>();
    const numbers = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      letters.add(rollLetter());
      numbers.add(rollNumber());
    }
    expect([...letters].sort().join('')).toBe('ABCDEF');
    expect([...numbers].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('shots and payouts', () => {
  it('deducts the bet on the first shot', () => {
    expect(playingState().balance).toBe(990);
  });

  it('pays the full carrier sequence at $10: 120 + 4 × 10 = 160', () => {
    let s = playingState();
    s = shoot(s, 'C1');
    expect(s.lastShot).toMatchObject({ outcome: 'hit', payout: 120, discovered: true });
    expect(s.missiles).toBe(5);
    expect(s.reserve).toBe(1);
    for (const c of ['A1', 'B1', 'D1', 'E1']) {
      s = shoot(s, c);
      expect(s.lastShot!.payout).toBe(10);
    }
    expect(s.lastShot!.sunk).toBe(true);
    expect(s.payout).toBe(160);
    expect(s.ships[0].firstHitPayout).toBe(120);
  });

  it('misses and repeat hits consume a missile with no payout', () => {
    let s = playingState();
    s = shoot(s, 'F6');
    expect(s.lastShot!.outcome).toBe('miss');
    expect(s.missiles).toBe(4);
    s = shoot(s, 'A3');
    expect(s.payout).toBe(60);
    s = shoot(s, 'A3');
    expect(s.lastShot).toMatchObject({ outcome: 'already-hit', payout: 0 });
    expect(s.missiles).toBe(3);
    expect(s.hits).toEqual(['A3']);
  });

  it('ends the game at zero missiles and credits the payout', () => {
    let s = playingState();
    s = shoot(s, 'A2'); // +90
    for (const c of ['F6', 'F5', 'F4', 'F3', 'F2']) s = shoot(s, c);
    expect(s.gameOver).toBe(true);
    expect(s.phase).toBe('gameover');
    expect(s.balance).toBe(990 + 90);
  });

  it('destroying the fleet pays the $440 maximum', () => {
    let s = playingState();
    for (const ship of s.ships) for (const c of ship.coordinates) s = shoot(s, c);
    expect(s.fleetDestroyed).toBe(true);
    expect(s.payout).toBe(440);
    expect(maxFleetPayout(10)).toBe(440);
  });
});
