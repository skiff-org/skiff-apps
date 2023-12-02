import { BlockquoteOptions } from '@tiptap/extension-blockquote';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Typography } from 'nightwatch-ui';
import { TextSelection } from 'prosemirror-state';
import { hasParentNode } from 'prosemirror-utils';
import styled from 'styled-components';

import { BLOCKQUOTE_NAME } from './Blockquote.constants';
import { getLeftBorderColor } from './utils';

const StyledBlockquote = styled.blockquote<{ $hidden: boolean; $leftBorderColor: string }>`
  border-left: ${({ $leftBorderColor }) => `2px solid ${$leftBorderColor}`};
  display: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
`;

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
  const { isMail, isOpen, sender } = node.attrs as { isMail: boolean; isOpen: boolean; sender: string };
  const { disableToggle } = extension.options;

  const isIndentedMailQuote = hasParentNode((n) => n.type.name === BLOCKQUOTE_NAME && (n.attrs.isMail as boolean))(
    TextSelection.create(editor.view.state.doc, getPos())
  );

  const showToggle = isMail && !disableToggle && !isIndentedMailQuote;
  const leftBorderColor = getLeftBorderColor(sender);

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
      <StyledBlockquote $hidden={showToggle && !isOpen} $leftBorderColor={leftBorderColor}>
        <NodeViewContent />
      </StyledBlockquote>
    </NodeViewWrapper>
  );
};

export default BlockquoteNodeView;
