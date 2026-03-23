import { getGoalLabel } from "../../domain/goals";
import type { DicePool, DieType, GoalType } from "../../domain/models";

export const DEFAULT_POOL: DicePool = {
  novice: 2,
  adept: 1,
  master: 1
};

export const DEFAULT_TARGET = 4;

export const DIE_TYPES: DieType[] = ["novice", "adept", "master"];

export const DIE_LABELS: Record<DieType, string> = {
  novice: "Novice",
  adept: "Adept",
  master: "Master"
};

const GOAL_TYPES: GoalType[] = ["atLeast", "exactly", "atMost", "distribution"];

export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  ...GOAL_TYPES
].map((goalType) => ({
  value: goalType,
  label: getGoalLabel(goalType)
}));
