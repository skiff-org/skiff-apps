import OrderedMap from 'orderedmap';
import { NodeSpec, Schema } from 'prosemirror-model';

import DocNodeSpec from './DocNodeSpec';
import EditorMarks from './EditorMarks';
import EditorNodes from './EditorNodes';
import { DOC } from './NodeNames';

const EditorSchema = new Schema({
  nodes: EditorNodes,
  marks: EditorMarks
});

// schema that dont force special nodes as title, icon, description.
// this nodes we probably wont have match when importing files from external sources.
// they are still in the schema just not required
export const LooseSchema = new Schema({
  nodes: (EditorSchema.spec.nodes as OrderedMap<NodeSpec>).update(DOC, { ...DocNodeSpec, content: 'block+' }),
  marks: EditorSchema.spec.marks
});
export default EditorSchema;
