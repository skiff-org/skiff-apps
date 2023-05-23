export default function clamp(min: number, val: number, max: number): number {
  if (val < min) {
    return min;
  }

  if (val > max) {
    return max;
  }

  return val;
}
