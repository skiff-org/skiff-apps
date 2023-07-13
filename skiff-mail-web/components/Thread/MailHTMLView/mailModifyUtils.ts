import { themeNames } from '@skiff-org/skiff-ui';
import { isHardToRead, HSLToRGB, RGBToHSL, RGBValue, rgbaToRgb } from '@skiff-org/skiff-ui';
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

const getNumberFromPixelString = (str: string) => {
  return Number(str.replace('px', ''));
};

const getPixelStringFromNumber = (num: number) => `${num}px`;

const getStringWithoutSpaces = (str: string) => str.trim().replace(/&nbsp;/g, '');
/**
 * Since we will never be able to cover all cases i'm keeping
 * a documentation of all known problems this function addresses.
 * 1. Standalone images bigger than the width of the container
 * 2. Multiple elements in the same cell that their combined width is bigger
 *  than the width of the container.
 * 3. Assigning min-width on tables that's bigger than the width of the container.
 * 4. Removing min width and max width from elements that are not the table.
 * 5. Images with text will be aligned as columns.
 * 6. weird text tags (code) will no longer spread longer then container width.
 * 7. removing all empty tables.
 */
// Handle tables on transactional mail
export const handleTransactionalMail = (rootContentDiv: HTMLElement) => {
  const CONTAINER_WIDTH = rootContentDiv.clientWidth;
  const MAX_MOBILE_PADDING = 20;
  Array.from(rootContentDiv.querySelectorAll<HTMLElement>('code,span')).forEach((el) => {
    if (el.getBoundingClientRect().width > CONTAINER_WIDTH) {
      el.style.width = getPixelStringFromNumber(CONTAINER_WIDTH);
      el.style.minWidth = 'unset';
      el.style.maxWidth = getPixelStringFromNumber(CONTAINER_WIDTH);
      el.style.paddingLeft = '0';
      el.style.paddingRight = '0';
      el.style.whiteSpace = 'pre-wrap';
      el.style.wordBreak = 'break-all';
    }
  });

  Array.from(rootContentDiv.getElementsByTagName('table')).forEach((table) => {
    // Fix table color
    table.style.color = table.style.color || 'unset';
    if (isMobile) {
      if (parseInt(table.width) > CONTAINER_WIDTH || parseInt(table.style.width) > CONTAINER_WIDTH) {
        table.width = String(CONTAINER_WIDTH);
        table.style.width = '100%';
        table.style.minWidth = '100%';
        table.style.maxWidth = '100%';
        table.style.removeProperty('text-align');
        table.style.removeProperty('margin');
        table.removeAttribute('align');
      }

      let longestRowLength = 0;
      Array.from(table.rows).forEach((currentRow) => {
        if (currentRow.cells.length > longestRowLength) {
          longestRowLength = currentRow.cells.length;
        }
      });
      Array.from(table.rows).forEach((currentRow) => {
        currentRow.setAttribute('row-len', String(longestRowLength));
      });
    }
  });

  if (!isMobile) return;

  Array.from(rootContentDiv.getElementsByTagName('tr')).forEach((currentRow) => {
    const cellsThatAreNext = currentRow.cells;
    // gets the length of only the containers with content

    if (getStringWithoutSpaces(currentRow.innerHTML) === '') {
      currentRow.remove();
      return;
    }

    // if no content remove div
    Array.from(cellsThatAreNext).forEach((cell) => {
      const allNonImageElements = cell.querySelectorAll<HTMLElement>(':not(img)');
      const emptyElements = Array.from(allNonImageElements).filter((el) => {
        return getStringWithoutSpaces(el.textContent || '') === '' && el.querySelectorAll('img').length === 0;
      });
      emptyElements.forEach((empty) => {
        empty.remove();
      });
    });

    const realLength =
      // only for apple receipts because they are height of 46
      currentRow.getAttribute('height') === '46'
        ? Number(currentRow.getAttribute('row-len'))
        : Array.from(cellsThatAreNext).filter(
            (cell) =>
              getStringWithoutSpaces(cell.innerHTML) !== '' && getStringWithoutSpaces(cell.textContent || '') !== ''
          ).length;
    let isBlock = false;
    Array.from(cellsThatAreNext).forEach((cell) => {
      // if an image is present in the cell
      // make it take all available space in a row.
      if (getStringWithoutSpaces(cell.innerHTML) === '') {
        cell.remove();
      }
      cell.style.boxSizing = 'border-box';
      if (cell.querySelectorAll('img').length > 0) {
        const imagesCountInCell = cell.querySelectorAll('img').length;
        cell.style.display = 'block';
        isBlock = true;
        cell.style.maxWidth = getPixelStringFromNumber(
          CONTAINER_WIDTH / (imagesCountInCell > 1 || realLength < 1 ? 1 : realLength)
        );
      } else {
        if (isBlock) {
          cell.style.display = 'block';
          isBlock = false;
        }
        // if no image, scale it down based on the amount of other elements in the cell

        cell.style.minWidth = 'unset';
        cell.style.maxWidth = getPixelStringFromNumber(CONTAINER_WIDTH / realLength);
        cell.style.boxSizing = 'border-box';
        cell.removeAttribute('rowSpan');
        cell.removeAttribute('colSpan');
        cell.style.removeProperty('margin');
        cell.removeAttribute('align');
      }

      // some cells have big padding which effects the readability of the mail
      // if the padding is bigger then the MAX_MOBILE_PADDING scale it down.
      if (
        getNumberFromPixelString(window.getComputedStyle(cell).paddingLeft) >= MAX_MOBILE_PADDING ||
        getNumberFromPixelString(window.getComputedStyle(cell).paddingRight) >= MAX_MOBILE_PADDING
      ) {
        cell.style.paddingLeft = getPixelStringFromNumber(MAX_MOBILE_PADDING);
        cell.style.paddingRight = getPixelStringFromNumber(MAX_MOBILE_PADDING);
      }
      // scale images and other containers down when more then one image is in the same cell
      const cellItems = Array.from(cell.children).filter((el) => el.tagName === 'CENTER');
      Array.from(cellItems).forEach((cellItem) => {
        const htmlCellItem = cellItem as HTMLElement;
        htmlCellItem.style.minWidth = 'unset';
        htmlCellItem.style.maxWidth = getPixelStringFromNumber(CONTAINER_WIDTH / cellItems.length);
        htmlCellItem.style.width = `${100 / cellItems.length}%`;
      });
    });
  });

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

export const hasBackground = (elem: Element) => {
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

      if (values[0] === undefined || values[1] === undefined || values[2] === undefined || values[3] === undefined)
        throw new Error();

      return rgbaToRgb(values[0], values[1], values[2], values[3], DARK_MODE_RGB);
    } else if (color.includes('rgb')) {
      // Color is rgb
      const values = color
        .replace(/[^\d,]/g, '')
        .split(',')
        .map((s) => Number(s));

      if (values[0] === undefined || values[1] === undefined || values[2] === undefined) throw new Error();

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
    if (h === undefined || s === undefined || l === undefined) return '';

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
const darkTextNodes = (elem: HTMLElement, elements: DarkElement[], dom: HTMLElement) => {
  if (hasBackground(elem)) {
    return elements; // If the element has custom background stop looking in that branch
  }
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
      darkTextNodes(child as HTMLElement, elements, dom);
    }
  });
  return elements;
};

/**
 * Returns an array of elements deemed dark
 */
const queryDarkTextElements = (dom: Document) => {
  return darkTextNodes(dom.body, [], dom.body);
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
