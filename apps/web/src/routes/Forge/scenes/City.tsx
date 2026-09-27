import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AXES, CIRCUITS, type AxisKey, type CircuitKey } from '@medalab/content';
import { CORPORATION, placeOf } from '../../../game/city';
import { cityState, type PlaceState } from '../../../game/progress';
import { useDraft } from '../../../store/draft';
import { useGame } from '../../../store/game';
import { toast } from '../../../store/toast';
import { useFinishForge } from '../useFinishForge';
import { MiniMedal } from './art/MiniMedal';
import { CityMap } from './CityMap';
import { Encounter } from './Encounter';
import { useDialog } from './useDialog';

/** Acto 3 · Ciudad 2045: los 10 dilemas como encuentros en el mapa. */
export function City() {
  const draft = useDraft((s) => s.draft);
  const { location, lastVisited, seenUnlocks, goTo, toMap, markSeen } = useGame();
  const finish = useFinishForge();
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ axis: AxisKey; at: number } | null>(null);
  const [gate, setGate] = useState(false);

  const city = cityState(draft);
  const home = city.district;
  const unlockKey = `unlock:${home.key}`;
  const showUnlock = home.status !== 'locked' && !seenUnlocks.includes(unlockKey);
  const here: PlaceState | null =
    location === 'core'
      ? city.plaza
      : location === home.key && home.status !== 'locked'
        ? home
        : null;
  const encounter = open
    ? [...city.plaza.encounters, ...home.encounters].find((e) => e.dilemma.id === open)
    : undefined;

  const visit = (key: CircuitKey) => {
    if (key === 'core') return goTo('core');
    if (key !== home.key) return toast(`El circuito ${CIRCUITS[key].n} se abre más adelante.`);
    if (home.status === 'locked')
      return toast(
        `Resuelve los encuentros de la plaza para abrir el circuito ${CIRCUITS[key].n}.`,
      );
    goTo(key);
  };
  const visitCorporation = () =>
    city.corporationOpen
      ? setGate(true)
      : toast(`Resuelve los ${city.total} encuentros para entrar a la ${CORPORATION.name}.`);
  const closeEncounter = (axis: AxisKey | null) => {
    setOpen(null);
    if (axis) setFlash({ axis, at: Date.now() });
  };

  return (
    <div className="scene city">
      <span className="act-stamp">Acto 3 · Ciudad 2045</span>
      <header className="city-hud">
        <b>{draft.name}</b>
        <span>
          Encuentros {city.solved}/{city.total}
        </span>
        <MiniMedal
          color={draft.color}
          flash={flash ? AXES.find((a) => a.k === flash.axis)!.n : null}
          flashKey={flash?.at}
        />
      </header>

      <CityMap
        state={city}
        at={location ?? lastVisited}
        robot={draft}
        onVisit={visit}
        onCorporation={visitCorporation}
      />

      {here ? (
        <PlacePanel place={here} onOpen={setOpen} />
      ) : (
        <p className="hint" style={{ textAlign: 'center' }}>
          Toca un lugar del mapa para ir con tu robot.
        </p>
      )}

      <nav className="city-nav" aria-label="Forja">
        <button type="button" className="btn small alt" onClick={toMap}>
          Mapa
        </button>
        <button type="button" className="btn small alt" onClick={() => navigate('/forja/1')}>
          Taller
        </button>
        <button type="button" className="btn small alt" onClick={() => navigate('/forja/2')}>
          Yunque
        </button>
      </nav>

      {encounter && (
        <Encounter
          dilemma={encounter.dilemma}
          index={encounter.index}
          total={city.total}
          onClose={closeEncounter}
        />
      )}
      {!encounter && showUnlock && (
        <UnlockBanner
          place={home}
          onEnter={() => {
            markSeen(unlockKey);
            goTo(home.key);
          }}
          onLater={() => markSeen(unlockKey)}
        />
      )}
      {gate && <CorporationGate onEnter={finish} onCancel={() => setGate(false)} />}
    </div>
  );
}

function PlacePanel({ place, onOpen }: { place: PlaceState; onOpen: (id: string) => void }) {
  const p = placeOf(place.key);
  const title = place.key === 'core' ? `Plaza ${p.name}` : `Circuito ${p.name}`;
  return (
    <div className="sheet place-panel">
      <h3>{title}</h3>
      <div className="lore">
        <p>{p.description}</p>
      </div>
      <ul className="encounters">
        {place.encounters.map((e) => (
          <li key={e.dilemma.id}>
            <button
              type="button"
              className={e.solved ? 'encounter-btn done' : 'encounter-btn'}
              onClick={() => onOpen(e.dilemma.id)}
            >
              <span>
                {e.index + 1}. {e.dilemma.t}
              </span>
              <span className="tag">{e.solved ? 'Resuelto' : 'Pendiente'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnlockBanner(props: { place: PlaceState; onEnter: () => void; onLater: () => void }) {
  const p = placeOf(props.place.key);
  const dialogRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  useDialog(dialogRef, props.onLater, enterRef);
  return (
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        className="sheet unlock"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
      >
        <span className="stamp">¡Nuevo circuito!</span>
        <h2 id="unlock-title">Se abrió el circuito {p.name}</h2>
        <div className="lore">
          <p>{p.description}</p>
        </div>
        <div className="row">
          <button ref={enterRef} type="button" className="btn" onClick={props.onEnter}>
            Entrar al circuito
          </button>
          <button type="button" className="btn alt" onClick={props.onLater}>
            Después
          </button>
        </div>
      </div>
    </div>
  );
}

function CorporationGate({ onEnter, onCancel }: { onEnter: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  useDialog(dialogRef, onCancel, enterRef);
  return (
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        className="sheet gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
      >
        <span className="stamp">{CORPORATION.name}</span>
        <h2 id="gate-title">¿Grabar la medalla?</h2>
        <p>Al entrar, la medalla se graba con tus respuestas y ya no podrás cambiarlas.</p>
        <div className="row">
          <button ref={enterRef} type="button" className="btn" onClick={onEnter}>
            Grabar la medalla
          </button>
          <button type="button" className="btn alt" onClick={onCancel}>
            Todavía no
          </button>
        </div>
      </div>
    </div>
  );
}
