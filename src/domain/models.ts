export type DieType = "novice" | "adept" | "master";

export type DicePool = {
  novice: number;
  adept: number;
  master: number;
};

export type GoalType = "atLeast" | "exactly" | "atMost" | "distribution";

export type Distribution = Record<number, number>;

export type CalculationRequest = {
  pool: DicePool;
  goalType: GoalType;
  target?: number;
};

export type CalculationResult = {
  probability?: number;
  distribution: Distribution;
  expectedValue: number;
  minValue: number;
  maxValue: number;
};
