import convertToCSSPTValue from './convertToCSSPTValue';
import { DOC_ICON, DOC_TITLE } from './NodeNames';

export const LAYOUT = {
  DESKTOP_SCREEN_4_3: 'desktop_screen_4_3',
  DESKTOP_SCREEN_16_9: 'desktop_screen_16_9',
  US_LETTER_LANDSCAPE: 'us_letter_landscape',
  US_LETTER_PORTRAIT: 'us_letter_portrait',
  FULL_WIDTH: 'full_width',
  A4: 'a4',
  A4_LANDSCAPE: 'a4_landscape'
};
export const ATTRIBUTE_LAYOUT = 'data-layout';
export function getAttrs(el: HTMLElement): Record<string, any> {
  const attrs: Record<string, any> = {
    layout: null,
    width: null,
    padding: null
  };
  const { width, maxWidth, padding } = el.style || {};
  const ww = convertToCSSPTValue(width) || convertToCSSPTValue(maxWidth);
  const pp = convertToCSSPTValue(padding);

  if (ww) {
    // 1pt = 1/72in
    // letter size: 8.5in x 11inch
    const ptWidth = ww + pp * 2;
    const inWidth = ptWidth / 72;

    if (inWidth >= 11 && inWidth <= 11.5) {
      // Round up to letter size.
      attrs.layout = LAYOUT.US_LETTER_LANDSCAPE;
    } else if (inWidth >= 7 && inWidth <= 9) {
      // Round up to letter size.
      attrs.layout = LAYOUT.FULL_WIDTH;
    } else {
      attrs.width = ptWidth;

      if (pp) {
        attrs.padding = pp;
      }
    }
  }

  return attrs;
}
const DocNodeSpec = {
  attrs: {
    layout: {
      default: LAYOUT.FULL_WIDTH
    },
    padding: {
      default: null
    },
    width: {
      default: null
    }
  },
  content: `${DOC_ICON} ${DOC_TITLE} block+`
};
export default DocNodeSpec;
