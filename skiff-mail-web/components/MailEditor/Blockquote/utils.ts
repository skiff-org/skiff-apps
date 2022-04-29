import { stringToColor } from '../../../utils/color';

export const getBlockquoteDepth = (node: HTMLElement) => {
  let depth = 0;
  while (node.parentElement) {
    if (node.parentElement.tagName === 'BLOCKQUOTE') {
      depth++;
    }
    node = node.parentElement;
  }
  return depth;
};

const defaultLeftBorderColor = 'var(--accent-blue-primary)';
export const getLeftBorderColor = (sender: string) => stringToColor(sender)?.[0] ?? defaultLeftBorderColor;
