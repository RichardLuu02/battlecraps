import { AnimatedNumber } from './AnimatedNumber';

interface HeaderProps {
  balance: number;
  muted: boolean;
  canRefill: boolean;
  onToggleMute: () => void;
  onRefill: () => void;
}

export function Header({ balance, muted, canRefill, onToggleMute, onRefill }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ⚓
        </span>
        <div>
          <h1 className="brand-title">
            Battleship <span>Bubble Craps</span>
          </h1>
          <p className="brand-sub">Roll the coordinates · Sink the fleet · Collect the payout</p>
        </div>
      </div>
      <div className="header-right">
        <div className="balance">
          <span>Balance</span>
          <strong>
            <AnimatedNumber value={balance} prefix="$" />
          </strong>
        </div>
        {canRefill && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRefill}>
            Refill $1,000
          </button>
        )}
        <button type="button" className="icon-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
