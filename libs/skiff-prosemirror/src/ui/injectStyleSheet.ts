const addedElements = new Map();

function createElement(tag: string, attrs: Record<string, any>): Element {
  const el: any = document.createElement(tag);
  Object.keys(attrs).forEach((key) => {
    if (key === 'className') {
      el[key] = attrs[key];
    } else {
      el.setAttribute(key, attrs[key]);
    }
  });
  return el;
}

export default function injectStyleSheet(urlStr: string): void {
  if (addedElements.has(urlStr)) {
    return;
  }
  if (!urlStr.startsWith('https://')) {
    return;
  }

  const el = createElement('link', {
    crossorigin: 'anonymous',
    href: urlStr,
    rel: 'stylesheet'
  });
  addedElements.set(urlStr, el);
  const root = document.head || document.documentElement || document.body;
  root?.appendChild(el);
}
