import type { Ship } from '../types/game';
import { maxShipPayout, shipEarnings } from '../game/payout';
import { isSunk } from '../game/ships';

export function FleetStatus({ ships, bet, revealed }: { ships: Ship[]; bet: number; revealed: boolean }) {
  return (
    <section className="panel fleet-panel">
      <h2 className="panel-title">Fleet</h2>
      <ul className="fleet-list">
        {ships.map((ship) => {
          const sunk = isSunk(ship);
          const status = sunk ? 'Destroyed' : ship.firstHit ? 'Discovered' : revealed ? 'Undetected' : 'Hidden';
          return (
            <li key={ship.id} className={`fleet-item ${ship.firstHit ? 'is-discovered' : ''} ${sunk ? 'is-sunk' : ''}`}>
              <div className="fleet-row">
                <span className="fleet-name">{ship.name}</span>
                <span className="fleet-status">{status}</span>
              </div>
              <div className="fleet-pips" aria-label={`${ship.hits.length} of ${ship.length} sections hit`}>
                {Array.from({ length: ship.length }, (_, i) => (
                  <i key={i} className={i < ship.hits.length ? 'is-hit' : ''} />
                ))}
              </div>
              <div className="fleet-row fleet-money">
                <span className="earned">${shipEarnings(ship, bet).toLocaleString()}</span>
                <span className="max">max ${maxShipPayout(ship.length, bet).toLocaleString()}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="panel-hint">
        First hit pays <strong>remaining sections × 3 × bet</strong>. Each further hit pays <strong>1 × bet</strong>.
      </p>
    </section>
  );
}
