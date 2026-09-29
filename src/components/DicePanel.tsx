import { AnimatePresence, motion } from 'framer-motion';
import type { Column, RowNumber } from '../types/game';
import { Dice } from './Dice';

interface DicePanelProps {
  letter: Column | null;
  number: RowNumber | null;
  rolling: boolean;
}

export function DicePanel({ letter, number, rolling }: DicePanelProps) {
  const target = !rolling && letter && number ? `${letter}${number}` : null;

  return (
    <section className="panel dice-panel">
      <h2 className="panel-title">Dice</h2>
      <div className="dice-row">
        <div className="die-slot">
          <Dice kind="letter" value={letter} rolling={rolling} />
          <span className="die-label">Letter</span>
        </div>
        <span className="dice-plus">+</span>
        <div className="die-slot">
          <Dice kind="number" value={number} rolling={rolling} />
          <span className="die-label">Number</span>
        </div>
      </div>
      <div className="target-readout">
        <span className="target-label">Target</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={rolling ? 'rolling' : target ?? 'none'}
            className={`target-value ${rolling ? 'is-rolling' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {rolling ? 'ROLLING…' : target ?? '— —'}
          </motion.span>
        </AnimatePresence>
      </div>
    </section>
  );
}
