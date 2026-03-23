import { useEffect, useMemo, useRef, useState } from "react";
import { clampDieCount } from "../../domain/dice";
import { calculateResult } from "../../domain/probability";
import type { DicePool, GoalType } from "../../domain/models";
import { formatExpectedValue, formatPercent } from "../../shared/format";
import { readQueryState, writeQueryState } from "../../shared/queryState";
import {
  deletePreset,
  formatScenarioLabel,
  loadHistory,
  loadPresets,
  pushHistory,
  savePreset,
  type SavedScenario
} from "./storage";

const DEFAULT_POOL: DicePool = {
  novice: 2,
  adept: 1,
  master: 1
};

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "atLeast", label: "Au moins" },
  { value: "exactly", label: "Exactement" },
  { value: "atMost", label: "Au plus" },
  { value: "distribution", label: "Distribution" }
];

type DieCounterProps = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
};

function DieCounter({ label, value, onChange }: DieCounterProps) {
  return (
    <div className="counter-card">
      <div>
        <div className="counter-label">{label}</div>
        <div className="counter-value">{value}</div>
      </div>
      <div className="stepper">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>
          -
        </button>
        <button type="button" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function CalculatorScreen() {
  const [pool, setPool] = useState<DicePool>(() => readQueryState()?.pool ?? DEFAULT_POOL);
  const [goalType, setGoalType] = useState<GoalType>(
    () => readQueryState()?.goalType ?? "atLeast"
  );
  const [target, setTarget] = useState<number>(() => readQueryState()?.target ?? 4);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<SavedScenario[]>(() => loadPresets());
  const [history, setHistory] = useState<SavedScenario[]>(() => loadHistory());
  const [shareFeedback, setShareFeedback] = useState("");
  const didRecordInitialHistory = useRef(false);

  const result = useMemo(
    () =>
      calculateResult({
        pool,
        goalType,
        target
      }),
    [goalType, pool, target]
  );

  useEffect(() => {
    writeQueryState({ pool, goalType, target });
  }, [goalType, pool, target]);

  useEffect(() => {
    if (!didRecordInitialHistory.current) {
      didRecordInitialHistory.current = true;
      setHistory(pushHistory({ pool, goalType, target }));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHistory(pushHistory({ pool, goalType, target }));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [goalType, pool, target]);

  const highlightedRows = Object.entries(result.distribution).map(([totalKey, probability]) => {
    const total = Number(totalKey);
    const isHighlighted =
      goalType === "exactly"
        ? total === target
        : goalType === "atLeast"
          ? total >= target
          : goalType === "atMost"
            ? total <= target
            : false;

    return {
      total,
      probability,
      isHighlighted
    };
  });

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Valor &amp; Villainy: Minions of Mordak</p>
        <h1>Mordak Dice Odds</h1>
        <p className="hero-copy">
          Calcul exact des probabilites de hits, pense pour une lecture rapide sur mobile.
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Pool de des</h2>
          <div className="action-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setPool({ novice: 0, adept: 0, master: 0 });
                setGoalType("atLeast");
                setTarget(0);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={async () => {
                const shareUrl = window.location.href;

                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setShareFeedback("Lien copie");
                  window.setTimeout(() => setShareFeedback(""), 1400);
                } catch {
                  setShareFeedback("Copie indisponible");
                  window.setTimeout(() => setShareFeedback(""), 1400);
                }
              }}
            >
              Partager
            </button>
          </div>
        </header>

        <div className="counter-grid">
          <DieCounter
            label="Novice"
            value={pool.novice}
            onChange={(novice) =>
              setPool((current) => ({ ...current, novice: clampDieCount(novice) }))
            }
          />
          <DieCounter
            label="Adept"
            value={pool.adept}
            onChange={(adept) =>
              setPool((current) => ({ ...current, adept: clampDieCount(adept) }))
            }
          />
          <DieCounter
            label="Master"
            value={pool.master}
            onChange={(master) =>
              setPool((current) => ({ ...current, master: clampDieCount(master) }))
            }
          />
        </div>

        <div className="quick-actions">
          <button
            type="button"
            onClick={() =>
              setPool((current) => ({
                ...current,
                novice: clampDieCount(current.novice + 1)
              }))
            }
          >
            +1 Novice
          </button>
          <button
            type="button"
            onClick={() =>
              setPool((current) => ({
                ...current,
                adept: clampDieCount(current.adept + 1)
              }))
            }
          >
            +1 Adept
          </button>
          <button
            type="button"
            onClick={() =>
              setPool((current) => ({
                ...current,
                master: clampDieCount(current.master + 1)
              }))
            }
          >
            +1 Master
          </button>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Objectif</h2>
        </header>

        <div className="segmented-control" role="tablist" aria-label="Type de calcul">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === goalType ? "is-active" : ""}
              onClick={() => setGoalType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Valeur cible</span>
          <input
            type="number"
            min={0}
            step={1}
            value={target}
            onChange={(event) =>
              setTarget(Math.max(0, Math.trunc(Number(event.target.value) || 0)))
            }
            disabled={goalType === "distribution"}
          />
        </label>
      </section>

      <section className="panel result-panel">
        <header className="panel-header">
          <h2>Résultats</h2>
        </header>

        <div className="primary-result">
          <span>Probabilite</span>
          <strong>
            {result.probability === undefined ? "Distribution complete" : formatPercent(result.probability)}
          </strong>
        </div>

        <div className="stats-grid">
          <article>
            <span>Esperance</span>
            <strong>{formatExpectedValue(result.expectedValue)}</strong>
          </article>
          <article>
            <span>Min</span>
            <strong>{result.minValue}</strong>
          </article>
          <article>
            <span>Max</span>
            <strong>{result.maxValue}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Distribution</h2>
        </header>

        <div className="distribution-list">
          {highlightedRows.map((row) => (
            <div
              key={row.total}
              className={`distribution-row${row.isHighlighted ? " is-highlighted" : ""}`}
            >
              <span className="distribution-total">{row.total}</span>
              <div className="distribution-bar-shell" aria-hidden="true">
                <div
                  className="distribution-bar"
                  style={{ width: `${row.probability * 100}%` }}
                />
              </div>
              <span className="distribution-probability">{formatPercent(row.probability)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Presets</h2>
          <span className="panel-meta">{shareFeedback || `${presets.length} sauvegardes`}</span>
        </header>

        <div className="preset-form">
          <input
            type="text"
            maxLength={32}
            placeholder={formatScenarioLabel(pool, goalType, target)}
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              const label = presetName.trim() || formatScenarioLabel(pool, goalType, target);
              setPresets(savePreset({ label, pool, goalType, target }));
              setPresetName("");
            }}
          >
            Sauver
          </button>
        </div>

        {presets.length ? (
          <div className="saved-list">
            {presets.map((preset) => (
              <article key={preset.id} className="saved-item">
                <button
                  type="button"
                  className="saved-apply"
                  onClick={() => {
                    setPool(preset.pool);
                    setGoalType(preset.goalType);
                    setTarget(preset.target);
                  }}
                >
                  <strong>{preset.label}</strong>
                  <span>{formatScenarioLabel(preset.pool, preset.goalType, preset.target)}</span>
                </button>
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={() => setPresets(deletePreset(preset.id))}
                  aria-label={`Supprimer ${preset.label}`}
                >
                  Suppr.
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Sauvegarde ici tes configurations frequentes.</p>
        )}
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Historique</h2>
          <span className="panel-meta">{history.length} derniers setups</span>
        </header>

        {history.length ? (
          <div className="saved-list">
            {history.map((entry) => (
              <article key={entry.id} className="saved-item">
                <button
                  type="button"
                  className="saved-apply"
                  onClick={() => {
                    setPool(entry.pool);
                    setGoalType(entry.goalType);
                    setTarget(entry.target);
                  }}
                >
                  <strong>{entry.label}</strong>
                  <span>{new Date(entry.updatedAt).toLocaleString("fr-BE")}</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Tes derniers calculs apparaitront ici automatiquement.</p>
        )}
      </section>
    </main>
  );
}
