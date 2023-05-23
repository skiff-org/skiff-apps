import { Node } from 'prosemirror-model';

import { mdSerializer } from './markdownSerializer';

export default function SerializeToMarkdown(doc: Node): string {
  return mdSerializer.serialize(doc);
}
