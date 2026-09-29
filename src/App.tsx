import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Column, Coordinate, Orientation, RowNumber, ShipId } from './types/game';
import { canShoot, createInitialState, gameReducer, MIN_BET } from './game/gameLogic';
import { coordinateToPosition, isValidPlacement, toCoordinate } from './game/board';
import { isPlaced, placeShip, rotateShip } from './game/ships';
import { rollDice } from './game/dice';
import { playSound, setMuted } from './audio/sound';
import { useShipDrag } from './hooks/useShipDrag';
import { Header } from './components/Header';
import { ShipPlacement } from './components/ShipPlacement';
import { FleetStatus } from './components/FleetStatus';
import { GameBoard } from './components/GameBoard';
import { DicePanel } from './components/DicePanel';
import { MissileCounter } from './components/MissileCounter';
import { PayoutPanel } from './components/PayoutPanel';
import { GameStatus } from './components/GameStatus';
import type { ShotStage } from './components/GameStatus';
import { BettingPanel } from './components/BettingPanel';
import { GameOverModal } from './components/GameOverModal';
import { ShipGraphic } from './components/Ship';
import { AnimatedNumber } from './components/AnimatedNumber';

const DICE_ROLL_MS = 1000;
const MISSILE_FLIGHT_MS = 550;
const GAME_OVER_DELAY_MS = 1700;

const BANNERS: Record<string, string> = {
  placement: 'Deploy your fleet — 4 ships, no overlaps, fully on the grid.',
  betting: 'Fleet locked. Choose your wager, then roll to fire.',
  playing: 'A hit returns your missile to reserve. A miss costs one.',
  gameover: 'Board revealed.',
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());
  const [selectedShipId, setSelectedShipId] = useState<ShipId | null>('carrier');
  const [diceRolling, setDiceRolling] = useState(false);
  const [dice, setDice] = useState<{ letter: Column; number: RowNumber } | null>(null);
  const [incoming, setIncoming] = useState<Coordinate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);

  const placing = state.phase === 'placement';

  const schedule = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const flash = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
    playSound('invalid');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ── Placement ────────────────────────────────────────────────

  const tryPlace = (shipId: ShipId, anchor: Coordinate, orientation: Orientation) => {
    const next = placeShip(state.ships, shipId, anchor, orientation);
    if (!next) {
      flash('Invalid placement — ships must stay on the board and cannot overlap.');
      return;
    }
    const wasUnplaced = !isPlaced(state.ships.find((s) => s.id === shipId)!);
    dispatch({ type: 'PLACE_SHIP', shipId, anchor, orientation });
    playSound('place');
    // After deploying a new ship, move on to the next one still in the dock.
    setSelectedShipId(wasUnplaced ? next.find((s) => !isPlaced(s))?.id ?? null : shipId);
  };

  const { drag, beginDrag, rotateDrag } = useShipDrag({
    ships: state.ships,
    enabled: placing,
    boardRef,
    onDrop: tryPlace,
    onInvalidDrop: () => flash('That spot is off the board or overlaps another ship.'),
    onClick: (id) => {
      playSound('click');
      setSelectedShipId((prev) => (prev === id ? null : id));
    },
  });

  const handleRotate = () => {
    if (!selectedShipId) return;
    if (!rotateShip(state.ships, selectedShipId)) {
      flash('Not enough room to rotate there.');
      return;
    }
    dispatch({ type: 'ROTATE_SHIP', shipId: selectedShipId });
    playSound('click');
  };

  const handleNudge = (dc: number, dr: number) => {
    const ship = state.ships.find((s) => s.id === selectedShipId);
    if (!ship || !isPlaced(ship)) return;
    const { col, row } = coordinateToPosition(ship.coordinates[0]);
    const anchor = col + dc >= 0 && row + dr >= 0 ? toCoordinate(col + dc, row + dr) : null;
    if (!anchor || !isValidPlacement(state.ships, ship.id, anchor, ship.orientation)) {
      playSound('invalid');
      return;
    }
    dispatch({ type: 'PLACE_SHIP', shipId: ship.id, anchor, orientation: ship.orientation });
    playSound('click');
  };

  const handleCellClick = (coordinate: Coordinate) => {
    if (!placing || !selectedShipId) return;
    const ship = state.ships.find((s) => s.id === selectedShipId)!;
    tryPlace(ship.id, coordinate, ship.orientation);
  };

  const handleReady = () => {
    dispatch({ type: 'READY' });
    setSelectedShipId(null);
    playSound('place');
  };

  // ── Shooting ─────────────────────────────────────────────────

  const handleShoot = () => {
    if (busyRef.current || !canShoot(state)) return;
    busyRef.current = true;
    const roll = rollDice();

    dispatch({ type: 'START_ROLL' });
    setDiceRolling(true);
    playSound('roll');

    schedule(DICE_ROLL_MS, () => {
      setDiceRolling(false);
      setDice({ letter: roll.letter, number: roll.number });
      setIncoming(roll.coordinate);
      playSound('launch');
    });
    schedule(DICE_ROLL_MS + MISSILE_FLIGHT_MS, () => {
      setIncoming(null);
      dispatch({ type: 'RESOLVE_SHOT', letter: roll.letter, number: roll.number });
      busyRef.current = false;
    });
  };

  // Impact sounds + delayed game-over screen, driven by the resolved shot.
  const lastShotId = state.lastShot?.id;
  useEffect(() => {
    const shot = state.lastShot;
    if (!shot) return;
    if (shot.outcome === 'hit') {
      playSound('explosion');
      schedule(300, () => playSound('coin'));
    } else {
      playSound(shot.outcome === 'miss' ? 'splash' : 'invalid');
    }
    if (state.gameOver) {
      schedule(GAME_OVER_DELAY_MS, () => {
        setShowModal(true);
        playSound(state.fleetDestroyed || state.payout > state.bet ? 'win' : 'lose');
      });
    }
  }, [lastShotId]);

  const handlePlayAgain = () => {
    dispatch({ type: 'PLAY_AGAIN' });
    setShowModal(false);
    setDice(null);
    setSelectedShipId(null);
    playSound('click');
  };

  // ── Keyboard ─────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const onButton = e.target instanceof HTMLButtonElement;
      if (placing) {
        const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (e.key === 'r' || e.key === 'R') {
          if (!rotateDrag()) handleRotate();
        } else if (moves[e.key] && selectedShipId) {
          e.preventDefault();
          handleNudge(...moves[e.key]);
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShipId) {
          dispatch({ type: 'REMOVE_SHIP', shipId: selectedShipId });
        } else if (e.key === 'Escape') {
          setSelectedShipId(null);
        }
      } else if ((e.key === ' ' || e.key === 'Enter') && !onButton && !showModal) {
        e.preventDefault();
        if (state.phase === 'gameover') handlePlayAgain();
        else handleShoot();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  // ── Render ───────────────────────────────────────────────────

  const stage: ShotStage = diceRolling ? 'rolling' : incoming ? 'inbound' : 'idle';
  const shootEnabled = canShoot(state) && !busyRef.current;
  const dragShip = drag ? state.ships.find((s) => s.id === drag.shipId) : undefined;

  return (
    <div className="app">
      <Ambient />
      <Header
        balance={state.balance}
        muted={muted}
        canRefill={state.balance < MIN_BET && state.phase !== 'playing'}
        onToggleMute={toggleMute}
        onRefill={() => dispatch({ type: 'REFILL_BALANCE' })}
      />

      <main className="table">
        <aside className="col col-left">
          {placing ? (
            <ShipPlacement
              ships={state.ships}
              selectedShipId={selectedShipId}
              draggingShipId={drag?.shipId ?? null}
              onSelect={(id) => {
                playSound('click');
                setSelectedShipId((prev) => (prev === id ? null : id));
              }}
              onDockPointerDown={(id, e) => beginDrag(id, e, true)}
              onRemove={(id) => {
                dispatch({ type: 'REMOVE_SHIP', shipId: id });
                setSelectedShipId(id);
              }}
              onRotate={handleRotate}
              onRandomize={() => {
                dispatch({ type: 'RANDOMIZE_FLEET' });
                setSelectedShipId(null);
                playSound('place');
              }}
              onClear={() => {
                dispatch({ type: 'CLEAR_BOARD' });
                setSelectedShipId('carrier');
              }}
              onReady={handleReady}
            />
          ) : (
            <>
              <FleetStatus ships={state.ships} bet={state.bet} revealed={state.phase === 'gameover'} />
              <GameStatus shot={state.lastShot} stage={stage} inboundTarget={incoming} shots={state.shots} />
            </>
          )}
        </aside>

        <section className="col col-center">
          <div className={`phase-banner phase-banner--${state.phase}`}>
            <span className="phase-tag">{state.phase === 'gameover' ? (state.fleetDestroyed ? 'Victory' : 'Game Over') : state.phase}</span>
            {BANNERS[state.phase]}
          </div>
          <GameBoard
            state={state}
            boardRef={boardRef}
            selectedShipId={selectedShipId}
            drag={drag}
            incoming={incoming}
            onShipPointerDown={(id, e) => {
              const ship = state.ships.find((s) => s.id === id)!;
              beginDrag(id, e, ship.orientation === 'horizontal');
            }}
            onCellClick={handleCellClick}
          />
        </section>

        <aside className="col col-right">
          <DicePanel letter={dice?.letter ?? null} number={dice?.number ?? null} rolling={diceRolling} />
          <MissileCounter missiles={state.missiles} reserve={state.reserve} />
          <PayoutPanel state={state} />
        </aside>
      </main>

      <footer className="control-bar">
        <BettingPanel
          bet={state.bet}
          balance={state.balance}
          editable={state.phase === 'betting'}
          locked={state.phase === 'playing' || state.phase === 'gameover'}
          onChange={(amount) => {
            dispatch({ type: 'SET_BET', amount });
            playSound('click');
          }}
        />
        <div className="bar-payout">
          <span className="bar-label">Payout</span>
          <strong>
            <AnimatedNumber value={state.payout} prefix="$" />
          </strong>
        </div>
        {state.phase === 'gameover' ? (
          <button type="button" className="btn btn-shoot" onClick={handlePlayAgain}>
            Play Again
          </button>
        ) : (
          <button type="button" className="btn btn-shoot" onClick={handleShoot} disabled={!shootEnabled}>
            {placing ? 'Place fleet · press Ready' : state.rolling ? 'Firing…' : 'Roll Dice & Shoot'}
          </button>
        )}
      </footer>

      {drag && dragShip && (
        <div
          className={`drag-preview ${drag.anchor ? 'is-over-board' : ''}`}
          style={{
            left: drag.x - (drag.orientation === 'horizontal' ? drag.grabIndex + 0.5 : 0.5) * drag.cellSize,
            top: drag.y - (drag.orientation === 'vertical' ? drag.grabIndex + 0.5 : 0.5) * drag.cellSize,
            width: (drag.orientation === 'horizontal' ? drag.length : 1) * drag.cellSize,
            height: (drag.orientation === 'vertical' ? drag.length : 1) * drag.cellSize,
          }}
        >
          <ShipGraphic id={dragShip.id} length={dragShip.length} orientation={drag.orientation} />
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && <GameOverModal state={state} onPlayAgain={handlePlayAgain} onViewBoard={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

/** Rising bubbles and light rays behind the table. */
function Ambient() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 9,
        duration: 9 + Math.random() * 14,
        delay: -Math.random() * 20,
      })),
    [],
  );
  return (
    <div className="ambient" aria-hidden="true">
      <div className="rays" />
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bubble"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  );
}
