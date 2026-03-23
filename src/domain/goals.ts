import type { GoalType } from "./models";

export function isGoalType(value: string | null | undefined): value is GoalType {
  return (
    value === "atLeast" ||
    value === "exactly" ||
    value === "atMost" ||
    value === "distribution"
  );
}

export function getGoalLabel(goalType: GoalType): string {
  switch (goalType) {
    case "atLeast":
      return "Au moins";
    case "exactly":
      return "Exactement";
    case "atMost":
      return "Au plus";
    case "distribution":
      return "Distribution";
  }
}

export function matchesGoal(goalType: GoalType, total: number, target: number): boolean {
  switch (goalType) {
    case "exactly":
      return total === target;
    case "atLeast":
      return total >= target;
    case "atMost":
      return total <= target;
    case "distribution":
      return false;
  }
}
