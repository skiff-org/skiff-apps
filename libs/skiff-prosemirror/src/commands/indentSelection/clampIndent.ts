export const MIN_INDENT_LEVEL = 0;
export const MAX_INDENT_LEVEL = 7;

export function clampIndent(indent: number) {
  return Math.min(Math.max(indent, MIN_INDENT_LEVEL), MAX_INDENT_LEVEL);
}
