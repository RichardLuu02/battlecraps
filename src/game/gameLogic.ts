import type { Column, GameAction, GameState, RowNumber, ShotResult } from '../types/game';
import { getShipAtCoordinate } from './board';
import { calculatePayout } from './payout';
import {
  allShipsPlaced,
  createFleet,
  isSunk,
  placeShip,
  randomizeFleet,
  removeShip,
  repairFleet,
  rotateShip,
} from './ships';

export const STARTING_MISSILES = 5;
export const STARTING_BALANCE = 1000;
export const MIN_BET = 1;
export const MAX_BET = 500;
export const QUICK_BETS = [1, 5, 10, 25, 50, 100];
export const BET_STEPS = [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500];

export function createInitialState(balance = STARTING_BALANCE): GameState {
  return {
    phase: 'placement',
    bet: Math.min(10, balance),
    balance,
    missiles: STARTING_MISSILES,
    reserve: 0,
    payout: 0,
    ships: createFleet(),
    shots: [],
    hits: [],
    misses: [],
    lastRoll: { letter: null, number: null, coordinate: null },
    lastShot: null,
    rolling: false,
    gameOver: false,
    fleetDestroyed: false,
  };
}

export function clampBet(amount: number, balance: number): number {
  const max = Math.max(MIN_BET, Math.min(MAX_BET, balance));
  return Math.min(max, Math.max(MIN_BET, Math.round(amount)));
}

export function nextBetStep(bet: number, direction: 1 | -1): number {
  if (direction === 1) return BET_STEPS.find((s) => s > bet) ?? MAX_BET;
  return [...BET_STEPS].reverse().find((s) => s < bet) ?? MIN_BET;
}

export function canShoot(state: GameState): boolean {
  return (
    (state.phase === 'betting' || state.phase === 'playing') &&
    !state.rolling &&
    state.missiles > 0 &&
    (state.phase === 'playing' || (state.bet >= MIN_BET && state.bet <= state.balance))
  );
}

/** Applies one shot at letter+number. Pure: returns the next state. */
export function resolveShot(state: GameState, letter: Column, number: RowNumber): GameState {
  const coordinate = `${letter}${number}`;
  const ship = getShipAtCoordinate(state.ships, coordinate);

  let outcome: ShotResult['outcome'] = 'miss';
  let payout = 0;
  let discovered = false;
  let sunk = false;
  let ships = state.ships;

  if (ship && ship.hits.includes(coordinate)) {
    outcome = 'already-hit';
  } else if (ship) {
    outcome = 'hit';
    payout = calculatePayout(ship, state.bet);
    discovered = !ship.firstHit;
    const updated = {
      ...ship,
      hits: [...ship.hits, coordinate],
      firstHit: true,
      firstHitPayout: discovered ? payout : ship.firstHitPayout,
    };
    sunk = isSunk(updated);
    ships = state.ships.map((s) => (s.id === ship.id ? updated : s));
  }

  const isHit = outcome === 'hit';
  // A hit returns the missile to the reserve; misses and repeat hits consume it.
  const missiles = isHit ? state.missiles : state.missiles - 1;
  const reserve = isHit ? state.reserve + 1 : state.reserve;
  const totalPayout = state.payout + payout;
  const fleetDestroyed = ships.every(isSunk);
  const gameOver = missiles <= 0 || fleetDestroyed;

  const shot: ShotResult = {
    id: state.shots.length + 1,
    letter,
    number,
    coordinate,
    outcome,
    shipId: ship?.id ?? null,
    shipName: ship?.name ?? null,
    payout,
    discovered,
    sunk,
    missilesAfter: missiles,
    reserveAfter: reserve,
  };

  return {
    ...state,
    phase: gameOver ? 'gameover' : 'playing',
    ships,
    missiles,
    reserve,
    payout: totalPayout,
    // Winnings are paid out to the balance when the round ends.
    balance: gameOver ? state.balance + totalPayout : state.balance,
    shots: [...state.shots, shot],
    hits: isHit ? [...state.hits, coordinate] : state.hits,
    misses: outcome === 'miss' && !state.misses.includes(coordinate) ? [...state.misses, coordinate] : state.misses,
    lastRoll: { letter, number, coordinate },
    lastShot: shot,
    rolling: false,
    gameOver,
    fleetDestroyed,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const placing = state.phase === 'placement';

  switch (action.type) {
    case 'PLACE_SHIP': {
      if (!placing) return state;
      const ships = placeShip(state.ships, action.shipId, action.anchor, action.orientation);
      return ships ? { ...state, ships } : state;
    }
    case 'ROTATE_SHIP': {
      if (!placing) return state;
      const ships = rotateShip(state.ships, action.shipId);
      return ships ? { ...state, ships } : state;
    }
    case 'REMOVE_SHIP':
      return placing ? { ...state, ships: removeShip(state.ships, action.shipId) } : state;
    case 'RANDOMIZE_FLEET':
      return placing ? { ...state, ships: randomizeFleet() } : state;
    case 'CLEAR_BOARD':
      return placing ? { ...state, ships: createFleet() } : state;
    case 'READY':
      return placing && allShipsPlaced(state.ships) ? { ...state, phase: 'betting' } : state;
    case 'SET_BET':
      if (state.phase !== 'placement' && state.phase !== 'betting') return state;
      return { ...state, bet: clampBet(action.amount, state.balance) };
    case 'START_ROLL': {
      if (!canShoot(state)) return state;
      // The wager is taken when the first missile is fired, then locked for the round.
      if (state.phase === 'betting') {
        return { ...state, phase: 'playing', balance: state.balance - state.bet, rolling: true };
      }
      return { ...state, rolling: true };
    }
    case 'RESOLVE_SHOT':
      return state.rolling ? resolveShot(state, action.letter, action.number) : state;
    case 'PLAY_AGAIN': {
      if (state.phase !== 'gameover') return state;
      const fresh = createInitialState(state.balance);
      return { ...fresh, ships: repairFleet(state.ships), bet: clampBet(state.bet, state.balance) };
    }
    case 'REFILL_BALANCE':
      if (state.phase === 'playing') return state;
      return { ...state, balance: STARTING_BALANCE, bet: clampBet(state.bet, STARTING_BALANCE) };
  }
}
