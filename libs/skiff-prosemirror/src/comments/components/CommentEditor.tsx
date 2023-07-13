import { sanitize } from 'dompurify';
import { Typography } from '@skiff-org/skiff-ui';
import { DOMSerializer, Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { MutableRefObject, useEffect, useMemo } from 'react';
import { useRef } from 'react';
import styled from 'styled-components';

import { ProsemirrorDocJson } from '../../Types';
import { EditorNodeViews } from '../comment.types';
import { setupPlugins } from '../CommentEditorPlugins';
import { schema } from '../CommentEditorSchema';

export const PreventOnChangeEvent = 'prevent-on-change';

const OldCommentContainer = styled.div`
  white-space: pre-line;
  line-break: normal;
`;

interface CommentViewerProps {
  content: ProsemirrorDocJson;
  oldComment: string; // Deprecated - in use only for old comments
}

// eslint-disable-next-line react/prop-types
export const CommentViewer = React.forwardRef<HTMLDivElement, CommentViewerProps>(({ content, oldComment }, ref) => {
  const html = useMemo(() => {
    if (!content) {
      return '';
    }
    const htmlFragment = DOMSerializer.fromSchema(schema).serializeFragment(Node.fromJSON(schema, content).content);
    const transferContainer = document.createElement('div');
    transferContainer.appendChild(htmlFragment);
    return sanitize(transferContainer.innerHTML);
  }, [content]);

  if (!content && oldComment) {
    return (
      <OldCommentContainer>
        <Typography wrap>{oldComment}</Typography>
      </OldCommentContainer>
    );
  }

  return <div ref={ref} className='ProseMirror' dangerouslySetInnerHTML={{ __html: html }}></div>;
});
CommentViewer.displayName = 'CommentViewer';

interface CommentEditorProps {
  initValue?: ProsemirrorDocJson;
  editorRef: MutableRefObject<EditorView | null>;
  onSubmit: (state: EditorState, dispatch: any) => boolean;
  onChange: () => void;
  onFocus: () => void;
  onBlur: () => void;
  nodeViews: EditorNodeViews;
}

export const CommentEditor = ({
  initValue,
  onSubmit,
  onChange,
  editorRef,
  nodeViews,
  onFocus,
  onBlur
}: CommentEditorProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorContainerRef.current) {
      return;
    }

    const view = new EditorView(editorContainerRef.current, {
      dispatchTransaction: (tr) => {
        view.updateState(view.state.apply(tr));

        if (tr.getMeta(PreventOnChangeEvent)) return;

        onChange();
      },
      state: EditorState.create({
        doc: initValue ? Node.fromJSON(schema, initValue) : schema.nodes.doc.createAndFill(),
        plugins: setupPlugins({ schema, onEnter: onSubmit })
      }),
      nodeViews
    });
    editorRef.current = view;
  }, []);

  return (
    <div
      ref={editorContainerRef}
      style={{ maxHeight: 100, overflow: 'auto', padding: '4px 15px' }}
      onFocus={onFocus}
      onBlur={onBlur}
    ></div>
  );
};
