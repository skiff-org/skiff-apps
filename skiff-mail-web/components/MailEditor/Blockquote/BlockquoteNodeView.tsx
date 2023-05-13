import { BlockquoteOptions } from '@tiptap/extension-blockquote';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Typography } from 'nightwatch-ui';
import { TextSelection } from 'prosemirror-state';
import { hasParentNode } from 'prosemirror-utils';

import { Blockquote } from '../Extensions/EditorNodes';

import { getLeftBorderColor } from './utils';

/**
 * node view for the Blockquote node
 *
 * if its a "normal" blockquote display just the <blockquote> html tag
 * if its a email blockquote (quoting last mail content) add the Show/Hide option
 */

const BlockquoteNodeView = ({
  getPos,
  node,
  updateAttributes,
  extension,
  editor
}: NodeViewProps<BlockquoteOptions>) => {
  const { isMail, isOpen, sender } = node.attrs;
  const { disableToggle } = extension.options;

  const isIndentedMailQuote = hasParentNode((n) => n.type.name === Blockquote.name && n.attrs.isMail)(
    TextSelection.create(editor.view.state.doc, getPos())
  );

  const showToggle = isMail && !disableToggle && !isIndentedMailQuote;

  return (
    <NodeViewWrapper>
      {showToggle && (
        <Typography
          color='link'
          onClick={() => {
            updateAttributes({ isOpen: !isOpen });
          }}
        >
          {`${isOpen ? 'Hide' : 'Show'} previous content`}
        </Typography>
      )}
      {(!showToggle || isOpen) && (
        <blockquote style={{ borderLeft: `2px solid ${getLeftBorderColor(sender)}` }}>
          <NodeViewContent />
        </blockquote>
      )}
    </NodeViewWrapper>
  );
};

export default BlockquoteNodeView;
