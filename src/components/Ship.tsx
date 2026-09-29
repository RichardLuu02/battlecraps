import { useId } from 'react';
import type { Orientation, ShipId } from '../types/game';

interface ShipGraphicProps {
  id: ShipId;
  length: number;
  orientation: Orientation;
  /** Segment indices (0 = anchor end) that have been hit. */
  damaged?: number[];
}

/** Metallic top-down warship drawn in a horizontal frame (length×100 by 100), rotated for vertical ships. */
export function ShipGraphic({ id, length, orientation, damaged = [] }: ShipGraphicProps) {
  const uid = useId().replace(/:/g, '');
  const W = length * 100;
  const sub = id === 'submarine';

  const hull = sub
    ? `M 20 50 Q 20 30 60 30 L ${W - 60} 30 Q ${W - 8} 34 ${W - 8} 50 Q ${W - 8} 66 ${W - 60} 70 L 60 70 Q 20 70 20 50 Z`
    : `M 12 50 Q 14 20 42 20 L ${W - 90} 20 Q ${W - 20} 26 ${W - 6} 50 Q ${W - 20} 74 ${W - 90} 80 L 42 80 Q 14 80 12 50 Z`;

  const vertical = orientation === 'vertical';

  return (
    <svg
      className="ship-svg"
      viewBox={vertical ? `0 0 100 ${W}` : `0 0 ${W} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`hull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6e3" />
          <stop offset="0.35" stopColor="#8195ab" />
          <stop offset="0.7" stopColor="#4b5d73" />
          <stop offset="1" stopColor="#233042" />
        </linearGradient>
        <linearGradient id={`deck-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8298" />
          <stop offset="1" stopColor="#3b4b5f" />
        </linearGradient>
        <radialGradient id={`scorch-${uid}`}>
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#ff4d1a" stopOpacity="0.8" />
          <stop offset="0.65" stopColor="#1b0d08" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0b0706" stopOpacity="0.2" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={hull} />
        </clipPath>
      </defs>

      <g transform={vertical ? 'translate(100,0) rotate(90)' : undefined}>
        {/* wake */}
        <path d={hull} fill="none" stroke="rgba(180,240,255,0.25)" strokeWidth="10" />
        <path d={hull} fill={`url(#hull-${uid})`} stroke="#0d1621" strokeWidth="3" />

        <g clipPath={`url(#clip-${uid})`}>
          {id === 'carrier' && (
            <>
              <rect x="30" y="26" width={W - 110} height="48" fill={`url(#deck-${uid})`} />
              <line x1="40" y1="50" x2={W - 90} y2="50" stroke="#e8f4ff" strokeWidth="2.5" strokeDasharray="16 12" opacity="0.8" />
              <line x1="60" y1="32" x2={W * 0.55} y2="44" stroke="#ffd35c" strokeWidth="1.5" opacity="0.6" />
              <rect x={W * 0.58} y="20" width="44" height="16" rx="3" fill="#2a3848" stroke="#9fb2c6" strokeWidth="1.5" />
              <circle cx={W * 0.58 + 22} cy="28" r="4" fill="#29e3ff" opacity="0.8" />
            </>
          )}

          {id === 'battleship' && (
            <>
              <Turret x={75} flip />
              <Turret x={160} flip />
              <rect x={W * 0.44} y="34" width="90" height="32" rx="6" fill="#3a4a5e" stroke="#9fb2c6" strokeWidth="1.5" />
              <rect x={W * 0.44 + 20} y="41" width="46" height="18" rx="4" fill="#56687e" />
              <circle cx={W * 0.44 + 43} cy="50" r="5" fill="#29e3ff" opacity="0.7" />
              <Turret x={W - 110} />
            </>
          )}

          {id === 'cruiser' && (
            <>
              <Turret x={70} small flip />
              <rect x={W * 0.38} y="36" width="80" height="28" rx="6" fill="#3a4a5e" stroke="#9fb2c6" strokeWidth="1.5" />
              <circle cx={W * 0.38 + 26} cy="50" r="7" fill="#56687e" stroke="#9fb2c6" strokeWidth="1" />
              <circle cx={W * 0.38 + 56} cy="50" r="4" fill="#29e3ff" opacity="0.7" />
              <Turret x={W - 100} small />
            </>
          )}

          {sub && (
            <>
              <line x1="50" y1="50" x2={W - 40} y2="50" stroke="#9fb2c6" strokeWidth="1.5" opacity="0.5" />
              <rect x={W * 0.42} y="38" width="56" height="24" rx="12" fill="#2d3b4c" stroke="#9fb2c6" strokeWidth="1.5" />
              <circle cx={W * 0.42 + 28} cy="50" r="4" fill="#29e3ff" opacity="0.8" />
              <path d={`M 26 50 L 8 38 L 8 62 Z`} fill="#3b4b5f" />
            </>
          )}

          {/* panel seams */}
          {Array.from({ length: length - 1 }, (_, i) => (
            <line key={i} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2="100" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
          ))}

          {damaged.map((i) => (
            <g key={i}>
              <rect x={i * 100} y="0" width="100" height="100" fill={`url(#scorch-${uid})`} />
              <path
                d={`M ${i * 100 + 30} 30 L ${i * 100 + 48} 52 L ${i * 100 + 40} 60 L ${i * 100 + 70} 76 M ${i * 100 + 50} 50 L ${i * 100 + 72} 36`}
                stroke="#120a06"
                strokeWidth="3"
                fill="none"
              />
            </g>
          ))}
        </g>

        {/* specular highlight */}
        <path d={hull} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" transform="translate(0,-2)" />
      </g>
    </svg>
  );
}

function Turret({ x, small = false, flip = false }: { x: number; small?: boolean; flip?: boolean }) {
  const r = small ? 11 : 14;
  const bx = flip ? x - 34 : x;
  return (
    <g>
      <rect x={bx} y={50 - (small ? 7 : 9)} width="34" height="3.5" fill="#1f2a37" />
      <rect x={bx} y={50 + (small ? 3.5 : 5.5)} width="34" height="3.5" fill="#1f2a37" />
      <circle cx={x} cy="50" r={r} fill="#56687e" stroke="#1b2633" strokeWidth="2" />
      <circle cx={x - 3} cy="47" r={r * 0.4} fill="rgba(255,255,255,0.25)" />
    </g>
  );
}
