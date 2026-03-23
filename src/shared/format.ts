export function formatPercent(probability: number): string {
  return `${(probability * 100).toFixed(2)}%`;
}

export function formatExpectedValue(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
