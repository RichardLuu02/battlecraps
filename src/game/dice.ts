import type { Column, Coordinate, RowNumber } from '../types/game';
import { columns } from './board';

// Both dice are independent and uniform. Ship placement never influences a roll.

export function rollLetter(rng: () => number = Math.random): Column {
  return columns[Math.floor(rng() * 6)];
}

export function rollNumber(rng: () => number = Math.random): RowNumber {
  return (Math.floor(rng() * 6) + 1) as RowNumber;
}

export function rollDice(rng: () => number = Math.random): { letter: Column; number: RowNumber; coordinate: Coordinate } {
  const letter = rollLetter(rng);
  const number = rollNumber(rng);
  return { letter, number, coordinate: `${letter}${number}` };
}
