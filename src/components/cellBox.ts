import type { CSSProperties } from 'react';
import { BOARD_SIZE } from '../game/board';
import type { Position } from '../game/board';

const pct = (n: number) => `${(n / BOARD_SIZE) * 100}%`;

/** Absolute-position box (in % of the board) for a span of cells. */
export function cellBox({ col, row }: Position, width = 1, height = 1): CSSProperties {
  return { left: pct(col), top: pct(row), width: pct(width), height: pct(height) };
}
