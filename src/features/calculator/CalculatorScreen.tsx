import { useEffect, useMemo, useRef, useState } from "react";
import { matchesGoal } from "../../domain/goals";
import { clampDieCount } from "../../domain/dice";
import { calculateResult } from "../../domain/probability";
import type { DicePool, DieType, GoalType } from "../../domain/models";
import { formatExpectedValue, formatPercent } from "../../shared/format";
import { normalizeNonNegativeInteger } from "../../shared/number";
import { readQueryState, writeQueryState } from "../../shared/queryState";
import { DEFAULT_POOL, DEFAULT_TARGET, DIE_LABELS, DIE_TYPES, GOAL_OPTIONS } from "./constants";
import { DieCounter } from "./DieCounter";
import { DistributionList } from "./DistributionList";
import { ScenarioList } from "./ScenarioList";
import {
  deletePreset,
  formatScenarioLabel,
  loadHistory,
  loadPresets,
  pushHistory,
  savePreset,
  type SavedScenario
} from "./storage";
import { TargetField } from "./TargetField";

type CalculatorState = {
  pool: DicePool;
  goalType: GoalType;
  target: number;
};

const HISTORY_RECORD_DELAY_MS = 250;
const SHARE_FEEDBACK_DURATION_MS = 1400;
const EMPTY_TARGET_INPUT = "";

export function CalculatorScreen() {
  const initialState = getInitialCalculatorState();
  const [pool, setPool] = useState<DicePool>(initialState.pool);
  const [goalType, setGoalType] = useState<GoalType>(initialState.goalType);
  const [target, setTarget] = useState<number>(initialState.target);
  const [targetInput, setTargetInput] = useState<string>(String(initialState.target));
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

  const distributionRows = useMemo(
    () =>
      Object.entries(result.distribution).map(([totalKey, probability]) => {
        const total = Number(totalKey);

        return {
          total,
          probability,
          isHighlighted: matchesGoal(goalType, total, target)
        };
      }),
    [goalType, result.distribution, target]
  );

  useEffect(() => {
    writeQueryState({ pool, goalType, target });
  }, [goalType, pool, target]);

  useEffect(() => {
    setTargetInput(String(target));
  }, [target]);

  useEffect(() => {
    if (!didRecordInitialHistory.current) {
      didRecordInitialHistory.current = true;
      setHistory(pushHistory({ pool, goalType, target }));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHistory(pushHistory({ pool, goalType, target }));
    }, HISTORY_RECORD_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [goalType, pool, target]);

  function updatePoolValue(dieType: DieType, nextValue: number) {
    setPool((currentPool) => ({
      ...currentPool,
      [dieType]: clampDieCount(nextValue)
    }));
  }

  function handleTargetChange(nextValue: string) {
    if (!/^\d*$/.test(nextValue)) {
      return;
    }

    setTargetInput(nextValue);
    setTarget(nextValue === EMPTY_TARGET_INPUT ? 0 : normalizeNonNegativeInteger(Number(nextValue)));
  }

  function commitTargetInput() {
    if (targetInput === EMPTY_TARGET_INPUT) {
      setTarget(0);
      setTargetInput("0");
    }
  }

  function adjustTarget(delta: number) {
    const nextTarget = Math.max(0, target + delta);
    setTarget(nextTarget);
    setTargetInput(String(nextTarget));
  }

  function applyScenario(entry: SavedScenario) {
    setPool(entry.pool);
    setGoalType(entry.goalType);
    setTarget(entry.target);
  }

  async function copyShareUrl() {
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showTemporaryFeedback("Lien copié");
    } catch {
      showTemporaryFeedback("Copie indisponible");
    }
  }

  function showTemporaryFeedback(message: string) {
    setShareFeedback(message);
    window.setTimeout(() => setShareFeedback(""), SHARE_FEEDBACK_DURATION_MS);
  }

  function resetCalculator() {
    setPool({ novice: 0, adept: 0, master: 0 });
    setGoalType("atLeast");
    setTarget(0);
  }

  function saveCurrentPreset() {
    const label = presetName.trim() || formatScenarioLabel(pool, goalType, target);
    setPresets(savePreset({ label, pool, goalType, target }));
    setPresetName("");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Valor &amp; Villainy: Minions of Mordak</p>
        <h1>Mordak Dice Odds</h1>
        <p className="hero-copy">
          Calcul exact des probabilités de hits, pensé pour une lecture rapide sur mobile.
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Pool de dés</h2>
          <div className="action-row">
            <button type="button" className="ghost-button" onClick={resetCalculator}>
              Reset
            </button>
            <button type="button" className="ghost-button" onClick={copyShareUrl}>
              Partager
            </button>
          </div>
        </header>

        <div className="counter-grid">
          {DIE_TYPES.map((dieType) => (
            <DieCounter
              key={dieType}
              dieType={dieType}
              label={DIE_LABELS[dieType]}
              value={pool[dieType]}
              onChange={(nextValue) => updatePoolValue(dieType, nextValue)}
            />
          ))}
        </div>

        <div className="quick-actions">
          {DIE_TYPES.map((dieType) => (
            <button
              key={dieType}
              type="button"
              className={`die-action die-action-${dieType}`}
              onClick={() => updatePoolValue(dieType, pool[dieType] + 1)}
            >
              +1 {DIE_LABELS[dieType]}
            </button>
          ))}
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

        <TargetField
          disabled={goalType === "distribution"}
          value={targetInput}
          onChange={handleTargetChange}
          onBlur={commitTargetInput}
          onAdjust={adjustTarget}
        />
      </section>

      <section className="panel result-panel">
        <header className="panel-header">
          <h2>Résultats</h2>
        </header>

        <div className="primary-result">
          <span>Probabilité</span>
          <strong>
            {result.probability === undefined
              ? "Distribution complète"
              : formatPercent(result.probability)}
          </strong>
        </div>

        <div className="stats-grid">
          <article>
            <span>Espérance</span>
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

        <DistributionList rows={distributionRows} />
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
          <button type="button" onClick={saveCurrentPreset}>
            Sauver
          </button>
        </div>

        {presets.length ? (
          <ScenarioList
            entries={presets}
            onApply={applyScenario}
            onDelete={(id) => setPresets(deletePreset(id))}
            secondaryText={(entry) =>
              formatScenarioLabel(entry.pool, entry.goalType, entry.target)
            }
          />
        ) : (
          <p className="empty-state">Sauvegarde ici tes configurations fréquentes.</p>
        )}
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Historique</h2>
          <span className="panel-meta">{history.length} derniers setups</span>
        </header>

        {history.length ? (
          <ScenarioList
            entries={history}
            onApply={applyScenario}
            secondaryText={(entry) => new Date(entry.updatedAt).toLocaleString("fr-BE")}
          />
        ) : (
          <p className="empty-state">Tes derniers calculs apparaîtront ici automatiquement.</p>
        )}
      </section>
    </main>
  );
}

function getInitialCalculatorState(): CalculatorState {
  const queryState = readQueryState();

  return {
    pool: queryState?.pool ?? DEFAULT_POOL,
    goalType: queryState?.goalType ?? "atLeast",
    target: queryState?.target ?? DEFAULT_TARGET
  };
}
