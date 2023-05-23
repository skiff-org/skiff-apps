import { ATTRIBUTE_BOOKMARK_ID, ATTRIBUTE_BOOKMARK_VISIBLE } from './BookmarkNodeSpec';

const BLOCK_NODE_NAME_PATTERN = /(P|H1|H2|H3|H4|H5|H6)/;
export default function patchAnchorElements(doc: Document): void {
  Array.from(doc.querySelectorAll('a[id]')).forEach(patchAnchorElement);
}

function patchAnchorElement(node: Element): void {
  const { id } = node;

  if (id && node.childElementCount === 0) {
    // This looks like a bookmark generated from Google Doc, will render
    // this as BookmarkNode.
    node.setAttribute(ATTRIBUTE_BOOKMARK_ID, id);
    // Google Doc always inject anchor links before <table />.
    //   <a id="t.3060ecccc199a88a1e4cc1252769f957b88f2207"></a>
    //   <a id="t.0"></a>
    //   <table class="c23">
    // and these anchor link should not be visible.
    const visible = node.id.indexOf('t.') !== 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    visible && node.setAttribute(ATTRIBUTE_BOOKMARK_VISIBLE, 'true');
  }

  const nextNode = node.nextElementSibling;

  if (!nextNode) {
    return;
  }

  // If this is next to a block element, make that block element the bookmark.
  if (BLOCK_NODE_NAME_PATTERN.test(nextNode.nodeName)) {
    nextNode.insertBefore(node, nextNode.firstChild);
  }
}
