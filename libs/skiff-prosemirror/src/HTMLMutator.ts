import nullthrows from 'nullthrows';

import uuid from './ui/uuid'; // Utility Class that allows developer to insert HTML snippets then updates
// document's innerHTML accordingly.

export default class HTMLMutator {
  _doc: Document;

  _htmls: Map<string, string>;

  constructor(doc: Document) {
    this._doc = doc;
    this._htmls = new Map();
  }

  insertHTMLBefore(html: string, el: Element): HTMLMutator {
    return this._insertHTML(html, 'before', el);
  }

  insertHTMLAfter(html: string, el: Element): HTMLMutator {
    return this._insertHTML(html, 'after', el);
  }

  execute(): void {
    const doc = this._doc;
    const root = nullthrows(doc.body || doc.documentElement);
    let newHtml = root.innerHTML;

    this._htmls.forEach((html, token) => {
      newHtml = newHtml.replace(token, html);
    });

    // eslint-disable-next-line no-unsanitized/property
    root.innerHTML = newHtml;
  }

  _insertHTML(html: string, position: 'before' | 'after', el: Element): HTMLMutator {
    if (el.ownerDocument !== this._doc) {
      throw new Error('element does not belong to the document');
    }

    // This does not insert the HTML into the document directly.
    // Instead, this inserts a comment token that can be replaced by the HTML
    // later.
    const token = `\u200b_HTMLMutator_token_${uuid()}_\u200b`;

    const node = this._doc.createComment(token);

    const parentElement = nullthrows(el.parentElement);

    if (position === 'before') {
      parentElement.insertBefore(node, el);
    } else if (position === 'after') {
      parentElement.insertBefore(node, el.nextSibling);
    } else {
      throw new Error(`Invalid position ${position}`);
    }

    this._htmls.set(`<!--${token}-->`, html);

    return this;
  }
}
