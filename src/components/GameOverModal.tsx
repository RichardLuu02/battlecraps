import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import { AnimatedNumber } from './AnimatedNumber';

interface GameOverModalProps {
  state: GameState;
  onPlayAgain: () => void;
  onViewBoard: () => void;
}

export function GameOverModal({ state, onPlayAgain, onViewBoard }: GameOverModalProps) {
  const playRef = useRef<HTMLButtonElement>(null);
  const hits = state.shots.filter((s) => s.outcome === 'hit').length;
  const misses = state.shots.length - hits;
  const discovered = state.ships.filter((s) => s.firstHit).length;
  const net = state.payout - state.bet;
  const won = state.fleetDestroyed;

  useEffect(() => playRef.current?.focus(), []);

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className={`modal ${won ? 'modal--win' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameover-title"
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <h2 id="gameover-title" className="modal-title">
          {won ? 'Fleet Destroyed!' : 'Game Over'}
        </h2>
        {won && <p className="modal-sub">All ships have been hit.</p>}

        <div className="modal-payout">
          <span>Total Payout</span>
          <strong>
            <AnimatedNumber value={state.payout} prefix="$" duration={1.2} />
          </strong>
          <em className={net >= 0 ? 'is-up' : 'is-down'}>
            {net >= 0 ? '+' : '−'}${Math.abs(net).toLocaleString()} net
          </em>
        </div>

        <dl className="modal-stats">
          <div>
            <dt>Bet</dt>
            <dd>${state.bet.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Hits</dt>
            <dd>{hits}</dd>
          </div>
          <div>
            <dt>Misses</dt>
            <dd>{misses}</dd>
          </div>
          <div>
            <dt>Ships Discovered</dt>
            <dd>{discovered} / 4</dd>
          </div>
        </dl>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onViewBoard}>
            View Board
          </button>
          <button ref={playRef} type="button" className="btn btn-shoot" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
