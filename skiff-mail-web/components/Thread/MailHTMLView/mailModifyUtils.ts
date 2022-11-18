import { themeNames } from 'nightwatch-ui';
import { isHardToRead, HSLToRGB, RGBToHSL, RGBValue, rgbaToRgb } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';

import { b64ToImageUrl } from '../../MailEditor/Image/utils';

interface DarkElement {
  element: Element;
  color: RGBValue;
}

const DARK_MODE_RGB = { r: 20, g: 20, b: 20 };
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const DEFAULT_COMPUTED_COLOR = 'rgb(0, 0, 0)';
const MARK_POSTFIX = 'skiffmarkup';

export enum ElementMark {
  LastEmailQuote = 'last-email-quote',
  QuoteToggleButton = 'show-last-container',
  PreviewImg = 'preview-img'
}

export const queryMarkedElements = (dom: Document | HTMLElement, mark: ElementMark): HTMLElement[] =>
  Array.from(dom.querySelectorAll(`[data-${MARK_POSTFIX}='${mark}']`));

const markElement = (elem: HTMLElement, mark: ElementMark) => (elem.dataset[MARK_POSTFIX] = mark);

const getQuotes = (dom: Document): HTMLElement | null => {
  const selectors = [
    'blockquote[data-skiff-mail]', // Skiff
    'div.gmail_quote', // 1st Gmail
    // 'div.3D"gmail_quote"', // 2nd Gmail
    'blockquote.protonmail_quote', // Proton
    'blockquote.tutanota_quote', // Tutanota
    'div.yahoo_quoted', // Yahoo
    'div[id="3D\\"divRplyFwdMsg\\""]' // Outlook
  ];

  return dom.querySelector(selectors.join(', '));
};

export const addQuotesContainer = (dom: Document, onClick, showQuotes = false) => {
  const quote = getQuotes(dom);
  if (!quote) return;

  markElement(quote, ElementMark.LastEmailQuote);

  quote.classList.add('ProseMirror');

  const button = dom.createElement('a');

  button.innerText = `${showQuotes ? 'Hide' : 'Show'} previous content`;
  button.style.color = `var(--text-link, ${themeNames.light['--text-link']})`;
  button.style.cursor = 'pointer';
  button.style.textDecoration = 'none';
  button.style.backgroundColor = 'var(--background-color)';
  button.onclick = onClick;

  markElement(button, ElementMark.QuoteToggleButton);

  quote.hidden = !showQuotes;

  quote.parentElement?.insertBefore(button, quote);
};

export const displayCidImage = (imgEl: HTMLImageElement, base64Content: string) => {
  const cid = imgEl.dataset.cid;
  if (!cid) throw new Error('CID not found');

  imgEl.dataset.progress = '100';
  // Render the image as a data URI
  imgEl.src = b64ToImageUrl(base64Content);
  imgEl.style.display = 'block';
  imgEl.style.cursor = 'pointer';
};

export const setCidImages = async (dom: Document) => {
  dom.querySelectorAll('img[src^="cid:"]').forEach((el) => {
    const imgEl = el as HTMLImageElement;
    const cid = imgEl.src.substring('cid:'.length);
    imgEl.dataset.cid = cid;

    markElement(imgEl, ElementMark.PreviewImg);
    // Initially hide image until attachment is ready
    imgEl.style.display = 'none';
    imgEl.src = '';
  });
};

export const overrideIFrameElementClick = (el: HTMLElement, listener: (e: MouseEvent) => void) => {
  el.onclick = (e) => {
    e.preventDefault();
    listener(e);
  };
};

export const setMailtoLinks = (dom: Document, onClick: (address: string) => void) => {
  const mailToElements = dom.querySelectorAll('a[href^="mailto:"]');

  // Listen to clicks on mailto links to compose new draft instead of opening in default mail client
  mailToElements.forEach((el) => {
    const linkEl = el as HTMLLinkElement;
    let url: URL | null = null;
    try {
      url = new URL(linkEl.href);
    } catch (e) {
      return;
    }
    const mailAddress = url.pathname;
    overrideIFrameElementClick(linkEl, () => onClick(mailAddress));
  });
};

// Handle tables on transactional mail
export const handleTransactionalMail = (rootContentDiv: Element) => {
  const CONTAINER_WIDTH = rootContentDiv.clientWidth;

  // change fixed tables sizes greater than container width to full width
  Array.from(rootContentDiv.querySelectorAll('table')).forEach((table) => {
    // Fix table color
    table.style.color = table.style.color || 'unset';

    if (isMobile) {
      if (parseInt(table.width) > CONTAINER_WIDTH || parseInt(table.style.width) > CONTAINER_WIDTH) {
        table.width = '100%';
        table.style.width = '100% ';
      }
    }
  });

  if (!isMobile) return;

  // make all images resizable on mobile, for now, like described in: https://www.cerberusemail.com/components#h-H2_9
  Array.from(rootContentDiv.querySelectorAll('img')).forEach((image) => {
    if (
      parseInt(image.style.minWidth) > CONTAINER_WIDTH ||
      image.width > CONTAINER_WIDTH ||
      parseInt(image.style.width) > CONTAINER_WIDTH
    ) {
      image.style.minWidth = 'unset';
      image.style.width = '100%';
      if (!image.style.maxWidth) {
        image.style.maxWidth = image.width.toString();
      }
      image.width = 0;
    }

    if (parseInt(window.getComputedStyle(image).width) > CONTAINER_WIDTH) {
      image.style.width = '100%';
    }
  });
};

const isTextNode = (node: Node) => {
  return node.nodeType === Node.TEXT_NODE;
};

const hasBackground = (elem: Element) => {
  const background = window.getComputedStyle(elem).backgroundColor;
  return background && background !== TRANSPARENT && background !== DEFAULT_COMPUTED_COLOR;
};

/**
 * Return if anchor has custom color
 */
const anchorWithCustomColorFilter = (element: Element) => {
  const BLACKLIST = ['rgb(199, 64, 37)']; // Filter out var(--text-link)
  if (element.tagName !== 'A') return false;
  const color = window.getComputedStyle(element).color;
  return BLACKLIST.includes(color);
};

export const getColorRGBValues = (color: string) => {
  try {
    if (color.includes('rgba')) {
      // Color is rgba
      const values = color
        .replace(/[^\d.,]/g, '')
        .split(',')
        .map((s) => Number(s));
      return rgbaToRgb(values[0], values[1], values[2], values[3], DARK_MODE_RGB);
    } else if (color.includes('rgb')) {
      // Color is rgb
      const values = color
        .replace(/[^\d,]/g, '')
        .split(',')
        .map((s) => Number(s));
      return {
        r: values[0],
        g: values[1],
        b: values[2]
      };
    }
  } catch (error) {
    console.warn('Failed to get rgb values', error);
    return null;
  }
  console.warn('Unknown color', color);
  return null;
};

// Returns nearest easy to see color
const getVisibleColor = (rgb: RGBValue) => {
  const LIGHTNESS_THRESHOLD = 10; // Anything under this threshold will become white
  const SATURATION_THRESHOLD = 5; // Anything under this threshold will become white
  const LIGHTNESS_INCREMENT = 10; // Amount to increment lightness
  const MAX_TRIES = 10; // Safe guard to not loop forever
  let count = 0;
  // Make color lighter until it is easy to read
  do {
    const [h, s, l] = RGBToHSL(rgb.r, rgb.g, rgb.b);
    // If saturation or lightness is under threshold (meaning we want it to simply be white) return primary color
    if (LIGHTNESS_THRESHOLD > l || SATURATION_THRESHOLD > s) {
      return document.body.style.getPropertyValue('--text-primary');
    }
    rgb = HSLToRGB(h, s, l + LIGHTNESS_INCREMENT);
    count++;
  } while (count < MAX_TRIES && isHardToRead(rgb, DARK_MODE_RGB));
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

/**
 * Recursively get all dark hard to read elements
 */
const darkTextNodes = (elem: HTMLElement, elements: DarkElement[]) => {
  if (hasBackground(elem)) return elements; // If the element has custom background stop looking in that branch
  // If the element has text node children, check if it is dark
  const color = window.getComputedStyle(elem).color;
  // Get rgb values from rgb or rgba string
  const rgb = getColorRGBValues(color);
  if (rgb && isHardToRead(rgb, DARK_MODE_RGB)) {
    if (!anchorWithCustomColorFilter(elem)) {
      // If it is dark add it to elements array
      elements.push({ element: elem, color: rgb });
    }
  }
  // Set child color styles to initial because we only want to change the styles for the text nodes
  Array.from(elem.children).forEach((child) => {
    // We want to check if the style is already set in-order to not override a custom color
    if (window.getComputedStyle(child as HTMLElement).color === DEFAULT_COMPUTED_COLOR)
      (child as HTMLElement).style.color = 'initial';
    // Continue on non text node children
    if (!isTextNode(child)) {
      darkTextNodes(child as HTMLElement, elements);
    }
  });
  return elements;
};

/**
 * Returns an array of elements deemed dark
 */
const queryDarkTextElements = (dom: Document) => {
  return darkTextNodes(dom.body, []);
};

// When on dark mode make dark text white
export const lightenDarkText = (dom: Document) => {
  // Get elements with black text and that do not have background set
  // Elements with custom background are probably fit for dark mode
  const elements = queryDarkTextElements(dom);
  // Add color
  elements.forEach(({ element, color }) => {
    (element as HTMLElement).style.color = getVisibleColor(color); // The only attribute that we change is color
  });
};
