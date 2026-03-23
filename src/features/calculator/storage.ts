import { isGoalType } from "../../domain/goals";
import { clampDieCount } from "../../domain/dice";
import type { DicePool, GoalType } from "../../domain/models";
import { normalizeNonNegativeInteger } from "../../shared/number";

export type SavedScenario = {
  id: string;
  label: string;
  pool: DicePool;
  goalType: GoalType;
  target: number;
  updatedAt: string;
};

const PRESETS_KEY = "dice-mind:presets";
const HISTORY_KEY = "dice-mind:history";
const MAX_HISTORY_ITEMS = 8;
const MAX_PRESET_ITEMS = 12;

export function loadPresets(): SavedScenario[] {
  return loadCollection(PRESETS_KEY);
}

export function savePreset(entry: Omit<SavedScenario, "id" | "updatedAt">): SavedScenario[] {
  const nextPreset: SavedScenario = {
    ...entry,
    id: createId(),
    updatedAt: new Date().toISOString()
  };

  const nextCollection = [nextPreset, ...loadPresets()].slice(0, MAX_PRESET_ITEMS);
  writeCollection(PRESETS_KEY, nextCollection);
  return nextCollection;
}

export function deletePreset(id: string): SavedScenario[] {
  const nextCollection = loadPresets().filter((preset) => preset.id !== id);
  writeCollection(PRESETS_KEY, nextCollection);
  return nextCollection;
}

export function loadHistory(): SavedScenario[] {
  return loadCollection(HISTORY_KEY);
}

export function pushHistory(entry: Omit<SavedScenario, "id" | "updatedAt" | "label">): SavedScenario[] {
  const normalizedEntry = {
    pool: normalizePool(entry.pool),
    goalType: entry.goalType,
    target: normalizeNonNegativeInteger(entry.target)
  };

  const nextItem: SavedScenario = {
    ...normalizedEntry,
    id: createId(),
    label: formatScenarioLabel(normalizedEntry.pool, normalizedEntry.goalType, normalizedEntry.target),
    updatedAt: new Date().toISOString()
  };

  const filtered = loadHistory().filter((item) => !isSameScenario(item, nextItem));
  const nextCollection = [nextItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
  writeCollection(HISTORY_KEY, nextCollection);
  return nextCollection;
}

export function formatScenarioLabel(pool: DicePool, goalType: GoalType, target: number): string {
  const parts = [`N${pool.novice}`, `A${pool.adept}`, `M${pool.master}`];
  const goalLabel =
    goalType === "atLeast"
      ? `>= ${target}`
      : goalType === "exactly"
        ? `= ${target}`
        : goalType === "atMost"
          ? `<= ${target}`
          : "distribution";

  return `${parts.join(" / ")} | ${goalLabel}`;
}

function loadCollection(key: string): SavedScenario[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => sanitizeScenario(item))
      .filter((item): item is SavedScenario => item !== null);
  } catch {
    return [];
  }
}

function writeCollection(key: string, collection: SavedScenario[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(collection));
}

function sanitizeScenario(value: unknown): SavedScenario | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SavedScenario>;
  if (!candidate.pool || typeof candidate.goalType !== "string") {
    return null;
  }

  const pool = normalizePool(candidate.pool);
  const goalType = sanitizeGoalType(candidate.goalType);
  const target = normalizeNonNegativeInteger(Number(candidate.target ?? 0));

  return {
    id: typeof candidate.id === "string" ? candidate.id : createId(),
    label:
      typeof candidate.label === "string" && candidate.label.trim()
        ? candidate.label.trim()
        : formatScenarioLabel(pool, goalType, target),
    pool,
    goalType,
    target,
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : new Date().toISOString()
  };
}

function sanitizeGoalType(value: string): GoalType {
  if (isGoalType(value)) {
    return value;
  }

  return "atLeast";
}

function normalizePool(pool: DicePool): DicePool {
  return {
    novice: clampDieCount(pool.novice),
    adept: clampDieCount(pool.adept),
    master: clampDieCount(pool.master)
  };
}

function isSameScenario(left: Pick<SavedScenario, "pool" | "goalType" | "target">, right: Pick<SavedScenario, "pool" | "goalType" | "target">): boolean {
  return (
    left.pool.novice === right.pool.novice &&
    left.pool.adept === right.pool.adept &&
    left.pool.master === right.pool.master &&
    left.goalType === right.goalType &&
    left.target === right.target
  );
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
