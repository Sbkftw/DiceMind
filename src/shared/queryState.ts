import { isGoalType } from "../domain/goals";
import type { DicePool, GoalType } from "../domain/models";
import { normalizeNonNegativeInteger } from "./number";

export type CalculatorQueryState = {
  pool: DicePool;
  goalType: GoalType;
  target: number;
};

export function readQueryState(): CalculatorQueryState | null {
  const params = new URLSearchParams(window.location.search);

  if (![...params.keys()].length) {
    return null;
  }

  return {
    pool: {
      novice: parseParam(params.get("n")),
      adept: parseParam(params.get("a")),
      master: parseParam(params.get("m"))
    },
    goalType: parseGoalType(params.get("goal")),
    target: parseParam(params.get("target"))
  };
}

export function writeQueryState(state: CalculatorQueryState) {
  const params = new URLSearchParams();
  params.set("n", `${state.pool.novice}`);
  params.set("a", `${state.pool.adept}`);
  params.set("m", `${state.pool.master}`);
  params.set("goal", state.goalType);
  params.set("target", `${state.target}`);

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function parseGoalType(value: string | null): GoalType {
  if (isGoalType(value)) {
    return value;
  }

  return "atLeast";
}

function parseParam(value: string | null): number {
  return normalizeNonNegativeInteger(Number(value));
}
