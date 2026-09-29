import { QUICK_BETS, nextBetStep } from '../game/gameLogic';

interface BettingPanelProps {
  bet: number;
  balance: number;
  editable: boolean;
  locked: boolean;
  onChange: (amount: number) => void;
}

export function BettingPanel({ bet, balance, editable, locked, onChange }: BettingPanelProps) {
  return (
    <div className={`betting ${editable ? '' : 'is-disabled'}`}>
      <div className="bet-main">
        <span className="bar-label">{locked ? 'Bet · Locked' : 'Bet'}</span>
        <div className="bet-stepper">
          <button type="button" className="chip-btn" onClick={() => onChange(nextBetStep(bet, -1))} disabled={!editable || bet <= 1} aria-label="Decrease bet">
            −
          </button>
          <span className="bet-amount">${bet.toLocaleString()}</span>
          <button
            type="button"
            className="chip-btn"
            onClick={() => onChange(nextBetStep(bet, 1))}
            disabled={!editable || bet >= balance}
            aria-label="Increase bet"
          >
            +
          </button>
        </div>
      </div>
      <div className="quick-bets" role="group" aria-label="Quick bet">
        {QUICK_BETS.map((amount) => (
          <button
            key={amount}
            type="button"
            className={`casino-chip chip-${amount} ${bet === amount ? 'is-active' : ''}`}
            onClick={() => onChange(amount)}
            disabled={!editable || amount > balance}
          >
            ${amount}
          </button>
        ))}
      </div>
    </div>
  );
}
