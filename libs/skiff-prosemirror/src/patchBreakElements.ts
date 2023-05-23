export default function patchBreakElements(doc: Document): void {
  // This is a workaround to handle HTML converted from DraftJS that
  // `<div><span><br /></span><div>` becomes `<p><br /><br /></p>`.
  // Block with single `<br />` inside should be collapsed into `<p />`.
  const selector = 'div > span:only-child > br:only-child';
  Array.from(doc.querySelectorAll(selector)).forEach(patchBreakElement);
}

function patchBreakElement(brElement: Element): void {
  const { ownerDocument, parentElement } = brElement;

  if (!ownerDocument || !parentElement) {
    return;
  }

  const div = brElement.parentElement && brElement.parentElement.parentElement;

  if (!div) {
    return;
  }

  const pp = ownerDocument.createElement('p');
  div.parentElement?.replaceChild(pp, div);
}
