import type { Ship } from '../types/game';

import { SHIP_DEFINITIONS } from './ships';

export const HIT_MULTIPLIER = 3;

/**
 * Payout for a new, unique hit on `ship`.
 *
 * `ship` represents the state BEFORE the new hit.
 *
 * First hit:
 *   $0
 *
 * Every subsequent hit:
 *   3 × bet
 *
 * Example with a $5 bet:
 *   Hit 1 → $0
 *   Hit 2 → $15
 *   Hit 3 → $15
 *   Hit 4 → $15
 *   Hit 5 → $15
 */
export function calculatePayout(ship: Ship, bet: number): number {
  // First hit pays nothing.
  if (ship.hits.length === 0) {
    return 0;
  }

  // Every hit after the first pays 3x the bet.
  return HIT_MULTIPLIER * bet;
}

/**
 * Maximum payout for completely hitting a ship.
 *
 * The first hit pays $0.
 * Every remaining section pays 3x the bet.
 *
 * Example:
 *   5-section ship, $5 bet
 *
 *   (5 - 1) × 3 × $5 = $60
 */
export function maxShipPayout(length: number, bet: number): number {
  if (length <= 1) {
    return 0;
  }

  return (length - 1) * HIT_MULTIPLIER * bet;
}

/**
 * Maximum payout if every ship in the fleet is completely destroyed.
 */
export function maxFleetPayout(bet: number): number {
  return SHIP_DEFINITIONS.reduce(
    (sum, ship) => sum + maxShipPayout(ship.length, bet),
    0
  );
}

/**
 * Running total earned from a ship so far.
 *
 * First hit:
 *   $0
 *
 * Every subsequent hit:
 *   3 × bet
 */
export function shipEarnings(ship: Ship, bet: number): number {
  const additionalHits = Math.max(0, ship.hits.length - 1);

  return additionalHits * HIT_MULTIPLIER * bet;
}
