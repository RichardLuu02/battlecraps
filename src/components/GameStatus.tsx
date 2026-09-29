import { AnimatePresence, motion } from 'framer-motion';
import type { ShotResult } from '../types/game';

export type ShotStage = 'idle' | 'rolling' | 'inbound';

interface GameStatusProps {
  shot: ShotResult | null;
  stage: ShotStage;
  inboundTarget: string | null;
  shots: ShotResult[];
}

interface Step {
  text: string;
  tone?: 'hit' | 'miss' | 'money' | 'info' | 'warn';
}

function stepsFor(shot: ShotResult): Step[] {
  const steps: Step[] = [
    { text: `${shot.letter} + ${shot.number}` },
    { text: `TARGET ${shot.coordinate}`, tone: 'info' },
  ];
  if (shot.outcome === 'hit') {
    steps.push({ text: 'HIT!', tone: 'hit' });
    if (shot.discovered) steps.push({ text: `${shot.shipName} discovered`, tone: 'info' });
    if (shot.sunk) steps.push({ text: `${shot.shipName} destroyed`, tone: 'hit' });
    steps.push({ text: `+$${shot.payout.toLocaleString()}`, tone: 'money' });
    steps.push({ text: 'Missile returned to reserve · RESERVE +1', tone: 'info' });
  } else if (shot.outcome === 'already-hit') {
    steps.push({ text: 'ALREADY HIT', tone: 'warn' });
    steps.push({ text: 'No payout · -1 MISSILE', tone: 'miss' });
  } else {
    steps.push({ text: 'MISS', tone: 'miss' });
    steps.push({ text: '-1 MISSILE', tone: 'miss' });
  }
  steps.push({ text: `Missiles remain: ${shot.missilesAfter}` });
  return steps;
}

export function GameStatus({ shot, stage, inboundTarget, shots }: GameStatusProps) {
  return (
    <section className="panel status-panel">
      <h2 className="panel-title">Last Roll</h2>
      <div className="status-body" aria-live="polite">
        <AnimatePresence mode="wait">
          {stage === 'rolling' ? (
            <motion.p key="rolling" className="status-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Dice rolling…
            </motion.p>
          ) : stage === 'inbound' ? (
            <motion.p key="inbound" className="status-pending is-inbound" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Target locked: <strong>{inboundTarget}</strong> — missile inbound
            </motion.p>
          ) : shot ? (
            <motion.ol key={`shot-${shot.id}`} className="status-steps" exit={{ opacity: 0 }}>
              {stepsFor(shot).map((step, i) => (
                <motion.li
                  key={i}
                  className={step.tone ? `tone-${step.tone}` : undefined}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                >
                  {step.text}
                </motion.li>
              ))}
            </motion.ol>
          ) : (
            <motion.p key="empty" className="status-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              No shots fired yet.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {shots.length > 0 && (
        <div className="shot-history" aria-label="Shot history">
          {shots.map((s) => (
            <span key={s.id} className={`shot-chip shot-chip--${s.outcome}`} title={`${s.coordinate}: ${s.outcome}`}>
              {s.coordinate}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
