import { describe, expect, it } from "vitest";
import { calculateDistribution, calculateResult } from "./probability";

describe("probability engine", () => {
  it("returns 50% for one novice die at least 1", () => {
    const result = calculateResult({
      pool: { novice: 1, adept: 0, master: 0 },
      goalType: "atLeast",
      target: 1
    });

    expect(result.probability).toBe(0.5);
  });

  it("returns 4/6 for one adept die exactly 1", () => {
    const result = calculateResult({
      pool: { novice: 0, adept: 1, master: 0 },
      goalType: "exactly",
      target: 1
    });

    expect(result.probability).toBeCloseTo(4 / 6, 10);
  });

  it("returns 100% for one master die at least 1", () => {
    const result = calculateResult({
      pool: { novice: 0, adept: 0, master: 1 },
      goalType: "atLeast",
      target: 1
    });

    expect(result.probability).toBe(1);
  });

  it("returns the expected distribution for two novice dice", () => {
    const distribution = calculateDistribution({
      novice: 2,
      adept: 0,
      master: 0
    });

    expect(distribution).toEqual({
      0: 0.25,
      1: 0.5,
      2: 0.25
    });
  });

  it("handles an empty pool as a guaranteed total of 0", () => {
    const result = calculateResult({
      pool: { novice: 0, adept: 0, master: 0 },
      goalType: "distribution"
    });

    expect(result.distribution).toEqual({ 0: 1 });
    expect(result.minValue).toBe(0);
    expect(result.maxValue).toBe(0);
    expect(result.expectedValue).toBe(0);
    expect(result.probability).toBeUndefined();
  });
});
