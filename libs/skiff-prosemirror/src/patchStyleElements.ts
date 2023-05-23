import stable from 'stable';

import toCSSColor from './ui/toCSSColor';
import toCSSLineSpacing from './ui/toCSSLineSpacing';

const LIST_ITEM_PSEUDO_ELEMENT_BEFORE = /li:+before/;
const NODE_NAME_SELECTOR = /^[a-zA-Z]+\d*$/;
const PSEUDO_ELEMENT_ANY = /:+[a-z]+/;
//  Assume these className from Google doc has less specificity.
const WEAK_CLASS_SELECTOR = /\.title/;
type SelectorTextToCSSText = {
  afterContent?: string | null;
  beforeContent?: string | null;
  cssText: string;
  selectorText: string;
};
export const ATTRIBUTE_CSS_BEFORE_CONTENT = 'data-attribute-css-before-content'; // Node name only selector has less priority, we'll handle it
// separately

export default function patchStyleElements(doc: Document): void {
  const els = Array.from(doc.querySelectorAll('style'));

  if (!els.length) {
    return;
  }

  const selectorTextToCSSTexts: SelectorTextToCSSText[] = [];
  els.forEach((styleEl) => {
    const { sheet } = styleEl;

    if (!sheet) {
      // TODO: Find out why the browser does not support this.
      console.error('styleEl.sheet undefined', styleEl);
      return;
    }

    const { cssRules } = sheet;

    if (!cssRules) {
      // TODO: Find out why the browser does not support this.
      console.error('sheet.cssRules undefined', sheet);
      return;
    }

    Array.from(cssRules).forEach((rule) => {
      const selectorText = rule instanceof CSSStyleRule ? String(rule.selectorText) : '';

      if (!selectorText) {
        // This could be `CSSImportRule.` created by @import().
        // ignore it.
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!rule.styleMap) {
        // TODO: Find out why the browser does not support this.
        console.error('rule.styleMap undefined', rule);
        return;
      }

      let cssText = '';
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      rule.styleMap.forEach((cssStyleValue: CSSStyleDeclaration, key: string) => {
        let cssStyleValueStr = String(cssStyleValue);

        // e.g. rules['color'] = 'red'.
        if (key === 'color') {
          const color = toCSSColor(cssStyleValueStr);

          if (!color) {
            return;
          }
        } else if (key === 'background-color') {
          const color = toCSSColor(cssStyleValueStr);

          if (!color) {
            return;
          }
        } else if (key === 'line-height') {
          cssStyleValueStr = toCSSLineSpacing(cssStyleValueStr);
        }

        if (cssStyleValueStr) {
          cssText += `${key}: ${cssStyleValueStr};`;
        }
      });

      if (selectorText.indexOf(',') > -1) {
        selectorText.split(/\s*,\s*/).forEach((st) => {
          buildSelectorTextToCSSText(selectorTextToCSSTexts, st, cssText);
        });
      } else {
        buildSelectorTextToCSSText(selectorTextToCSSTexts, selectorText, cssText);
      }
    });
  });
  // Sort selector by
  stable(selectorTextToCSSTexts, sortBySpecificity)
    .reduce(buildElementToCSSTexts.bind(null, doc), new Map())
    .forEach(applyInlineStyleSheetCSSTexts);
}

function buildElementToCSSTexts(
  doc: Document,
  elementToCSSTexts: Map<HTMLElement, Array<string>>,
  bag: SelectorTextToCSSText
): Map<HTMLElement, Array<string>> {
  const { selectorText, cssText, beforeContent } = bag;
  const els = Array.from(doc.querySelectorAll(selectorText));
  els.forEach((el) => {
    if (!(el instanceof HTMLElement) || !el.style) {
      return;
    }

    if (cssText) {
      const cssTexts = elementToCSSTexts.get(el) || [];
      cssTexts.push(cssText);
      elementToCSSTexts.set(el, cssTexts);
    }

    if (beforeContent) {
      // This simply adds the custom attribute 'data-before-content' to element,
      // developer must handle his attribute via NodeSpec separately if needed.
      el.setAttribute(ATTRIBUTE_CSS_BEFORE_CONTENT, beforeContent);
    }
  });
  return elementToCSSTexts;
}

function sortBySpecificity(one: SelectorTextToCSSText, two: SelectorTextToCSSText): number {
  // This is just the naive implementation of sorting selectors by css
  // specificity.
  // 1. NodeName selectors has less priority.
  let aa = NODE_NAME_SELECTOR.test(one.selectorText);
  let bb = NODE_NAME_SELECTOR.test(two.selectorText);

  if (aa && !bb) {
    return -1;
  }

  if (!aa && bb) {
    return 1;
  }

  // Assume both are className selector.
  // Assume these className from Google doc has less specificity.
  aa = WEAK_CLASS_SELECTOR.test(one.selectorText);
  bb = WEAK_CLASS_SELECTOR.test(two.selectorText);

  if (aa && !bb) {
    return -1;
  }

  if (!aa && bb) {
    return 1;
  }

  return 0;
}

function buildSelectorTextToCSSText(result: Array<SelectorTextToCSSText>, selectorText: string, cssText: string): void {
  let afterContent;
  let beforeContent;

  if (LIST_ITEM_PSEUDO_ELEMENT_BEFORE.test(selectorText)) {
    // Workaround to extract the list style content from HTML generated by
    // Google.
    // This converts `content:"\0025a0  "` to `\0025a0`
    beforeContent = cssText.replace(/^content:\s*"\s*/, '').replace(/";*$/, '');
    selectorText = selectorText.replace(/:+before/, '');
    cssText = '';
  } else if (PSEUDO_ELEMENT_ANY.test(selectorText)) {
    // TODO: Handle this later.
    return;
  }

  result.push({
    selectorText,
    cssText,
    afterContent,
    beforeContent
  });
}

function applyInlineStyleSheetCSSTexts(cssTexts: Array<string>, el: HTMLElement): void {
  if (cssTexts.length) {
    el.style.cssText = `${cssTexts.join(';')};${el.style.cssText}`;
  }
}
