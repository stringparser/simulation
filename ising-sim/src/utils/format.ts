export function formatNumber(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

export function formatFixed(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function formatDimensions(dimensions: readonly number[]): string {
  return dimensions.join("×");
}
