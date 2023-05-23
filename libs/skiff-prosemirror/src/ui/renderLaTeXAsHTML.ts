import canUseCSSFont from './canUseCSSFont';
import injectStyleSheet from './injectStyleSheet';

const CSS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.1/katex.min.css';
const CSS_FONT = 'KaTeX_Main';

let injected = false;
export const injectSpreadsheet = async function () {
  if (injected) return;
  injected = true;
  const fontSupported = await canUseCSSFont(CSS_FONT);
  if (!fontSupported) {
    console.info('Add CSS from ', CSS_CDN_URL);
    injectStyleSheet(CSS_CDN_URL);
  }
};
