import {
  DIE_DISTRIBUTIONS,
  getPoolExpectedValue,
  getPoolMaxValue,
  getPoolMinValue,
  normalizePool
} from "./dice";
import type {
  CalculationRequest,
  CalculationResult,
  DicePool,
  Distribution,
  DieType
} from "./models";

const DIE_ORDER: DieType[] = ["novice", "adept", "master"];

export function convolveDistributions(
  left: Distribution,
  right: Distribution
): Distribution {
  const next: Distribution = {};

  for (const [leftTotalKey, leftProbability] of Object.entries(left)) {
    const leftTotal = Number(leftTotalKey);

    for (const [rightTotalKey, rightProbability] of Object.entries(right)) {
      const rightTotal = Number(rightTotalKey);
      const total = leftTotal + rightTotal;
      next[total] = (next[total] ?? 0) + leftProbability * rightProbability;
    }
  }

  return sortDistribution(next);
}

export function calculateDistribution(pool: DicePool): Distribution {
  const normalizedPool = normalizePool(pool);
  let distribution: Distribution = { 0: 1 };

  for (const dieType of DIE_ORDER) {
    const count = normalizedPool[dieType];

    for (let index = 0; index < count; index += 1) {
      distribution = convolveDistributions(distribution, DIE_DISTRIBUTIONS[dieType]);
    }
  }

  return distribution;
}

export function sumProbabilityByGoal(
  distribution: Distribution,
  goalType: CalculationRequest["goalType"],
  target = 0
): number | undefined {
  if (goalType === "distribution") {
    return undefined;
  }

  let totalProbability = 0;

  for (const [totalKey, probability] of Object.entries(distribution)) {
    const total = Number(totalKey);

    if (goalType === "exactly" && total === target) {
      totalProbability += probability;
    }

    if (goalType === "atLeast" && total >= target) {
      totalProbability += probability;
    }

    if (goalType === "atMost" && total <= target) {
      totalProbability += probability;
    }
  }

  return totalProbability;
}

export function calculateResult(request: CalculationRequest): CalculationResult {
  const pool = normalizePool(request.pool);
  const distribution = calculateDistribution(pool);

  return {
    probability: sumProbabilityByGoal(distribution, request.goalType, request.target ?? 0),
    distribution,
    expectedValue: getPoolExpectedValue(pool),
    minValue: getPoolMinValue(pool),
    maxValue: getPoolMaxValue(pool)
  };
}

export function sortDistribution(distribution: Distribution): Distribution {
  return Object.fromEntries(
    Object.entries(distribution).sort(
      ([leftTotal], [rightTotal]) => Number(leftTotal) - Number(rightTotal)
    )
  );
}
