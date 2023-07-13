import { stringToColor } from '@skiff-org/skiff-ui';

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
export const getLeftBorderColor = (sender: string) =>
  sender ? stringToColor(sender)?.[0] ?? defaultLeftBorderColor : defaultLeftBorderColor;
