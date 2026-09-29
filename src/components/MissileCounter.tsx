import { AnimatePresence, motion } from 'framer-motion';
import { STARTING_MISSILES } from '../game/gameLogic';
import { MissileShape } from './GameBoard';

export function MissileCounter({ missiles, reserve }: { missiles: number; reserve: number }) {
  return (
    <section className="panel missile-panel">
      <h2 className="panel-title">Missiles</h2>
      <div className="missile-rack" aria-label={`${missiles} missiles remaining`}>
        {Array.from({ length: STARTING_MISSILES }, (_, i) => (
          <div key={i} className="missile-slot">
            <AnimatePresence>
              {i < missiles && (
                <motion.div
                  className="missile-icon"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -70, opacity: 0, scale: 0.6, transition: { duration: 0.45, ease: 'easeIn' } }}
                >
                  <MissileShape />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="missile-meta">
        <span>
          <strong className={missiles <= 1 ? 'is-low' : ''}>{missiles}</strong> remaining
        </span>
        <span className="reserve">
          Reserve
          <motion.strong key={reserve} initial={{ scale: 1.8, color: '#3dffa0' }} animate={{ scale: 1, color: '#e6f7ff' }}>
            {reserve}
          </motion.strong>
        </span>
      </div>
    </section>
  );
}
