import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import type { ShotResult } from '../types/game';
import { coordinateToPosition } from '../game/board';
import { cellBox } from './cellBox';

/** One-shot impact effects (explosion, splash, floating text) for the latest shot. */
export function BoardEffects({ shot }: { shot: ShotResult | null }) {
  return (
    <div className="effects-layer" aria-hidden="true">
      <AnimatePresence>
        {shot && (
          <motion.div
            key={shot.id}
            className={`impact impact--${shot.outcome}`}
            style={cellBox(coordinateToPosition(shot.coordinate))}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            {shot.outcome === 'hit' ? <Explosion /> : <Splash />}
            <motion.div
              className={`float-text float-text--${shot.outcome}`}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: '-130%', opacity: [0, 1, 1, 0], scale: 1 }}
              transition={{ duration: 1.8, times: [0, 0.1, 0.75, 1], ease: 'easeOut' }}
            >
              {shot.outcome === 'hit' ? `+$${shot.payout.toLocaleString()}` : shot.outcome === 'miss' ? 'MISS' : 'ALREADY HIT'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Explosion() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 70 + Math.random() * 90;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 4 + Math.random() * 6, delay: Math.random() * 0.08 };
      }),
    [],
  );
  return (
    <>
      <motion.span
        className="blast-flash"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      <motion.span
        className="blast-ring"
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 3.4, opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="spark"
          style={{ width: s.size, height: s.size }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: `${s.x}%`, y: `${s.y}%`, opacity: 0 }}
          transition={{ duration: 0.8, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        className="smoke"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.8, opacity: [0, 0.6, 0], y: '-40%' }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
    </>
  );
}

function Splash() {
  const drops = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = -Math.PI / 2 + ((i / 9) - 0.5) * 2.2;
        const dist = 50 + Math.random() * 60;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
      }),
    [],
  );
  return (
    <>
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          key={delay}
          className="splash-ring"
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      ))}
      {drops.map((d, i) => (
        <motion.span
          key={i}
          className="droplet"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: `${d.x}%`, y: [`0%`, `${d.y}%`, `${d.y * 0.3}%`], opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}
