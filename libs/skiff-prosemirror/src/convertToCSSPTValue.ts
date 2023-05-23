import { FONT_PX_SIZES } from './ui/FontSizeCommandMenuButton';

const SIZE_PATTERN = /([\d.]+)(px|pt)/i;

export const PT_TO_PX_RATIO = 1.33;
export default function convertToCSSPXValue(styleValue: string): number {
  const matches = styleValue.match(SIZE_PATTERN);

  if (!matches) {
    return 0;
  }

  let value = parseFloat(matches[1]);
  const unit = matches[2];

  if (!value || !unit) {
    return 0;
  }

  if (unit === 'pt') {
    value *= PT_TO_PX_RATIO;
  }

  return value;
}
export function toClosestFontPxSize(styleValue: string): number {
  const originalPXValue = convertToCSSPXValue(styleValue);

  if (FONT_PX_SIZES.includes(originalPXValue)) {
    return originalPXValue;
  }

  return FONT_PX_SIZES.reduce(
    (prev, curr) => (Math.abs(curr - originalPXValue) < Math.abs(prev - originalPXValue) ? curr : prev),
    Number.NEGATIVE_INFINITY
  );
}
