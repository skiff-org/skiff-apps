import { ATTRIBUTE_INDENT, convertMarginLeftToIndentValue } from './ParagraphNodeSpec';

export default function patchParagraphElements(doc: Document): void {
  Array.from(doc.querySelectorAll('p')).forEach(patchParagraphElement);
}

function patchParagraphElement(pElement: HTMLElement): void {
  const { marginLeft } = pElement.style;

  if (marginLeft) {
    const indent = convertMarginLeftToIndentValue(marginLeft);

    if (indent) {
      pElement.setAttribute(ATTRIBUTE_INDENT, String(indent));
    }
  }
}
