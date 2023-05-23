import { Schema } from 'prosemirror-model';
import { EditorState, Plugin } from 'prosemirror-state';

import convertFromDOMElement from './convertFromDOMElement';
import normalizeHTML from './normalizeHTML';

export default function convertFromHTML(
  html: string,
  schema?: Schema | null,
  plugins?: Array<Plugin> | null
): EditorState {
  const root = document.createElement('html');
  const newHTML = normalizeHTML(html);
  // eslint-disable-next-line no-unsanitized/property
  root.innerHTML = newHTML;
  return convertFromDOMElement(root, schema, plugins);
}
