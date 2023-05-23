import type { Rect } from './rects';
import { isCollapsed } from './rects';

export type PositionHandler = (anchorRect?: Rect | null, bodyRect?: Rect | null) => Rect;
export function atAnchorBottomLeft(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x;
    rect.y = anchorRect.y + anchorRect.h + 5;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.x + bodyRect.w > viewportWidth) {
      rect.x = viewportWidth - bodyRect.w - 10;
    }

    if (rect.y + bodyRect.h > viewportHeight) {
      rect.y = Math.max(anchorRect.y - bodyRect.h - 5, 2);
    }
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorBottomLeftOverflow(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x + 302;
    rect.y = anchorRect.y + anchorRect.h;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.x + bodyRect.w > viewportWidth) {
      rect.x = viewportWidth - bodyRect.w - 10;
    }

    if (rect.y - 320 < 0) {
      rect.y = anchorRect.y + 120;
    } else if (rect.y + 320 > viewportHeight) {
      rect.y = anchorRect.y - bodyRect.h - 40;
    }
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorBottomCenter(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = Math.max(anchorRect.x - (bodyRect.w - anchorRect.w) / 2, 10);
    rect.y = anchorRect.y + anchorRect.h;
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorRight(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x + anchorRect.w + 1;
    rect.y = anchorRect.y;
    const viewportWidth = window.innerWidth;

    if (rect.x + bodyRect.w > viewportWidth) {
      rect.x = Math.max(2, anchorRect.x - bodyRect.w);
    }
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atViewportCenter(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (bodyRect) {
    rect.x = (window.innerWidth - bodyRect.w) / 2;
    rect.y = (window.innerHeight - bodyRect.h) / 2;
  }

  if (!bodyRect || isCollapsed(bodyRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorTopRight(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x + anchorRect.w + 1 - bodyRect.w;
    rect.y = anchorRect.y;
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorTopCenter(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x + (anchorRect.w - bodyRect.w) / 2;
    rect.y = anchorRect.y;
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
export function atAnchorTopCenterOverflow(anchorRect?: Rect | null, bodyRect?: Rect | null): Rect {
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };

  if (anchorRect && bodyRect) {
    rect.x = anchorRect.x + (anchorRect.w - bodyRect.w) / 2;
    rect.y = anchorRect.y;
    const viewportWidth = window.innerWidth;

    if (rect.x + 400 > viewportWidth) {
      rect.x = viewportWidth - 220;
    }
  }

  if (!anchorRect || isCollapsed(anchorRect)) {
    rect.x = -10000;
  }

  return rect;
}
