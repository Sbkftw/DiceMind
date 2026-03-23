import type { DicePool, DieType, Distribution } from "./models";
import { normalizeNonNegativeInteger } from "../shared/number";

export const MAX_DICE_PER_TYPE = 30;

export const DIE_DISTRIBUTIONS: Record<DieType, Distribution> = {
  novice: {
    0: 0.5,
    1: 0.5
  },
  adept: {
    0: 1 / 6,
    1: 4 / 6,
    2: 1 / 6
  },
  master: {
    1: 0.5,
    2: 0.5
  }
};

export const DIE_EXPECTED_VALUE: Record<DieType, number> = {
  novice: 0.5,
  adept: 1,
  master: 1.5
};

export function clampDieCount(value: number): number {
  return Math.min(MAX_DICE_PER_TYPE, normalizeNonNegativeInteger(value));
}

export function normalizePool(pool: DicePool): DicePool {
  return {
    novice: clampDieCount(pool.novice),
    adept: clampDieCount(pool.adept),
    master: clampDieCount(pool.master)
  };
}

export function getPoolExpectedValue(pool: DicePool): number {
  return (
    pool.novice * DIE_EXPECTED_VALUE.novice +
    pool.adept * DIE_EXPECTED_VALUE.adept +
    pool.master * DIE_EXPECTED_VALUE.master
  );
}

export function getPoolMinValue(pool: DicePool): number {
  return pool.master;
}

export function getPoolMaxValue(pool: DicePool): number {
  return pool.novice + pool.adept * 2 + pool.master * 2;
}
