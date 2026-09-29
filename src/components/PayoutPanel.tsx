import type { GameState } from '../types/game';
import { AnimatedNumber } from './AnimatedNumber';

export function PayoutPanel({ state }: { state: GameState }) {
  const hitCount = state.shots.filter((s) => s.outcome === 'hit').length;
  const missCount = state.shots.length - hitCount;

  const stats: Array<{ label: string; value: number; money?: boolean; tone?: string }> = [
    { label: 'Bet', value: state.bet, money: true },
    { label: 'Payout', value: state.payout, money: true, tone: 'green' },
    { label: 'Missiles', value: state.missiles },
    { label: 'Reserve', value: state.reserve, tone: 'cyan' },
    { label: 'Hits', value: hitCount, tone: 'orange' },
    { label: 'Misses', value: missCount },
  ];

  return (
    <section className="panel stats-panel">
      <h2 className="panel-title">Game Info</h2>
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.tone ? `stat--${s.tone}` : ''}`}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">
              <AnimatedNumber value={s.value} prefix={s.money ? '$' : ''} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
