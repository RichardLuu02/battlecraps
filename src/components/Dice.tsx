import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { rollLetter, rollNumber } from '../game/dice';

interface DiceProps {
  kind: 'letter' | 'number';
  value: string | number | null;
  rolling: boolean;
}

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function Dice({ kind, value, rolling }: DiceProps) {
  const [face, setFace] = useState<string | number | null>(value);

  // While rolling, flicker through random faces; the real result is only shown once revealed.
  useEffect(() => {
    if (!rolling) {
      setFace(value);
      return;
    }
    const tick = () => setFace(kind === 'letter' ? rollLetter() : rollNumber());
    tick();
    const id = window.setInterval(tick, 300);
    return () => window.clearInterval(id);
  }, [rolling, value, kind]);

  return (
    <div className={`die-wrap ${rolling ? 'is-rolling' : ''}`}>
      <motion.div
        className={`die die--${kind}`}
        animate={
          rolling
            ? { rotate: [0, -24, 18, -12, 26, 0], y: [0, -22, 0, -12, 0], scale: [1, 1.06, 0.96, 1.04, 1] }
            : { rotate: 0, y: 0, scale: 1 }
        }
        transition={rolling ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 400, damping: 14 }}
      >
        <motion.div
          key={rolling ? 'rolling' : `v-${value}`}
          className="die-face"
          initial={rolling ? false : { scale: 1.5, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          {face === null ? (
            <span className="die-blank">?</span>
          ) : kind === 'letter' ? (
            <span className="die-letter">{face}</span>
          ) : (
            <span className="die-pips" aria-label={String(face)}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className={PIPS[face as number]?.includes(i) ? 'on' : ''} />
              ))}
            </span>
          )}
        </motion.div>
      </motion.div>
      <div className="die-shadow" />
    </div>
  );
}
