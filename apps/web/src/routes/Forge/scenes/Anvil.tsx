import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AXES, CATALOGS, type AxisKey } from '@medalab/content';
import { Chips, asItems } from '../../../components/Chips';
import { RankList } from '../../../components/RankList';
import { duelState } from '../../../game/duels';
import { RANK_NOTE, dataQuestions, limitQuestions, rankQuestion } from '../../../game/referee';
import { useDraft } from '../../../store/draft';
import { useGame } from '../../../store/game';
import { AnvilMedal } from './art/AnvilMedal';
import { Referee, StageBar, StepScreen, WizardNav } from './Wizard';

const STAGES = ['Duelos', 'Jerarquía', 'Límite', 'Rasgo', 'Datos'];
const axis = (k: AxisKey) => AXES.find((a) => a.k === k)!;

/** Acto 2 · El Yunque, paso a paso: duelos de principios, jerarquía, límite, rasgo y datos. */
export function Anvil() {
  const { draft, set, moveRank, toggleData } = useDraft();
  const { anvilStep: step, setAnvilStep: setStep, duels, setDuels } = useGame();
  const navigate = useNavigate();
  const duel = duelState(duels);

  // Duelos ya completos al volver a la etapa 1 (p. ej. datos guardados): se pasa a la jerarquía.
  useEffect(() => {
    if (step === 0 && 'rank' in duel) setStep(1);
  }, [step, duel, setStep]);

  const decide = (firstWins: boolean) => {
    const next = [...duels, firstWins];
    setDuels(next);
    const s = duelState(next);
    if ('rank' in s) {
      set({ rank: s.rank });
      setStep(1);
    }
  };
  const undoDuel = () => setDuels(duels.slice(0, -1));
  const top = axis(draft.rank[0]).n;

  return (
    <div className="scene anvil wizard">
      <h2 className="act-stamp">Acto 2 · El Yunque</h2>
      <StageBar labels={STAGES} current={step} />
      <div className="grid g2 wizard-body">
        <div className="wizard-art">
          <AnvilMedal color={draft.color} limit={draft.limit} />
        </div>
        <div>
          {step === 0 && 'pair' in duel && (
            <StepScreen stepKey={`duel-${duel.n}`} title="Si chocan, ¿cuál gana?">
              <p className="hint">
                Los dos son buenos. Imagina una situación en la que tu robot no puede cumplir ambos.
                Elige el que debe ganar. <span className="duel-count">Duelo {duel.n}</span>
              </p>
              <div className="duel" role="group" aria-label={`Duelo ${duel.n}`}>
                {duel.pair.map((k, i) => (
                  <button
                    type="button"
                    key={k}
                    className="duel-card"
                    onClick={() => decide(i === 0)}
                  >
                    <b>{axis(k).n}</b>
                    <span>{axis(k).d}</span>
                  </button>
                ))}
                <span className="duel-vs" aria-hidden="true">
                  VS
                </span>
              </div>
            </StepScreen>
          )}

          {step === 1 && (
            <StepScreen stepKey="rank" title="Así quedó tu jerarquía">
              <p className="hint">
                Arriba está lo que gana cuando hay conflicto. Si algo no te convence, afínalo con
                las flechas o arrastrando desde el asa ⠿.
              </p>
              <RankList rank={draft.rank} onMove={moveRank} />
              <Referee questions={[rankQuestion(top, axis(draft.rank[1]).n), RANK_NOTE]} />
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setDuels([]);
                  setStep(0);
                }}
              >
                Repetir los duelos
              </button>
            </StepScreen>
          )}

          {step === 2 && (
            <StepScreen stepKey="limit" title="¿Qué es lo único que tu robot no hará nunca?">
              <p className="hint">
                Ni siquiera si su medafighter se lo ordena. Se graba en el borde de la medalla.
              </p>
              <textarea
                id="fLimit"
                aria-label="Límite infranqueable"
                placeholder="Ej. Nunca borrará un registro que documente daño a una persona."
                value={draft.limit}
                onChange={(e) => set({ limit: e.target.value })}
              />
              <Referee questions={limitQuestions(top)} />
            </StepScreen>
          )}

          {step === 3 && (
            <StepScreen stepKey="trait" title="¿Qué rasgo de carácter tiene tu robot?">
              <p className="hint">Es su forma de ser cuando actúa. Elige uno.</p>
              <Chips
                label="Rasgo de carácter"
                items={asItems(CATALOGS.traits)}
                isOn={(v) => v === draft.trait}
                onPick={(v) => set({ trait: v })}
              />
            </StepScreen>
          )}

          {step === 4 && (
            <StepScreen stepKey="data" title="¿Qué datos recoge tu robot?">
              <p className="hint">Puedes elegir varios, o «Ninguno».</p>
              <Chips
                label="Datos que recoge"
                items={asItems(CATALOGS.data)}
                isOn={(v) => draft.data.includes(v)}
                onPick={toggleData}
              />
              <label htmlFor="fRetention">¿Cuánto tiempo los conserva y para qué?</label>
              <input
                type="text"
                id="fRetention"
                placeholder="Ej. 30 días, solo para reportar incidentes; después se borra"
                value={draft.retention}
                onChange={(e) => set({ retention: e.target.value })}
              />
              {draft.data.length > 0 && <Referee questions={dataQuestions(draft.data)} />}
            </StepScreen>
          )}
        </div>
      </div>

      <WizardNav
        backLabel={step === 0 && duels.length === 0 ? 'Volver al taller' : 'Atrás'}
        onBack={() => {
          if (step === 0) return duels.length ? undoDuel() : navigate('/forja/1');
          if (step === 1) {
            undoDuel();
            return setStep(0);
          }
          setStep(step - 1);
        }}
        onNext={
          step === 0 ? undefined : step === 4 ? () => navigate('/forja/3') : () => setStep(step + 1)
        }
        nextLabel={step === 4 ? 'Salir a la ciudad' : 'Siguiente'}
        canNext={step !== 2 || draft.limit.trim() !== ''}
      />
    </div>
  );
}
