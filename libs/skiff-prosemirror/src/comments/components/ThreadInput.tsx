import { Divider, Icon, IconButton, ThemeMode, Type, Typography, useOnClickOutside } from '@skiff-org/skiff-ui';
import { Node } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import { MARK_LINK } from '../../MarkNames';
import EditorMentionsMenu from '../../mentionsMenu/EditorMentionsMenu';
import {
  InviteMentionType,
  MentionMenuState,
  MentionMetaTypes,
  mentionsKey,
  UserMentionType
} from '../../mentionsMenu/utils';
import { MENTION, TEXT } from '../../NodeNames';
import sanitizeURL from '../../sanitizeURL';
import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import { ProsemirrorDocJson } from '../../Types';
import { freezeAll } from '../../utils/scrollController';
import { EditorNodeViews } from '../comment.types';
import { schema } from '../CommentEditorSchema';
import usePopup from '../hooks/usePopup';
import { CommentsPositionEmitter } from '../utils/FloatingThreads';

import { BodyPopup, positionBodyPopupAccordingToSelection } from './BodyPopup';
import { CommentEditor, PreventOnChangeEvent } from './CommentEditor';
import { COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import { EmojiPopup } from './EmojiPopup';

const MENTIONS_POP_SIZE = { height: 220, width: 250 };
const EMOJI_POP_SIZE = { height: 355, width: 302 };
const POP_THRESHOLD = 20;
const POP_OFFSET = {
  top: 35, // line height + 5px
  left: 0
};

const DividerContainer = styled.div<{ $hidden: boolean }>`
  align-self: center;
  ${(props) => props.$hidden && 'display: none;'}
`;

interface ThreadInputProps {
  onAddComment: (content: ProsemirrorDocJson, textContent: string) => string | null;
  startingValue?: ProsemirrorDocJson;
  active: boolean;
  theme: ThemeMode;
  firstComment?: boolean;
  state: EditorState;
  comentEditorNodeViews: EditorNodeViews;
  onChange: (content: ProsemirrorDocJson | null) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export const ThreadInput: FC<ThreadInputProps> = ({
  onAddComment,
  startingValue,
  active,
  theme,
  firstComment = false,
  state,
  onChange,
  comentEditorNodeViews,
  onFocus,
  onBlur
}) => {
  const [isTyping, setIsTyping] = useState<boolean>(!!startingValue);
  const editorRef = useRef<EditorView | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLDivElement>(null);
  const mentionsMenuRef = useRef<HTMLDivElement>(null);
  const [openReactionUpwards, setOpenReactionUpwards] = useState(false);
  const [mentionMenuPluginState, setMentionMenuPluginState] = useState<MentionMenuState | null>();
  const { onMention } = getCustomState(state);

  const { ref: reactionPickerRef, open: emojiPickerOpen, setOpen: setEmojiPickerOpen } = usePopup();

  const textContent = useCallback((doc: Node) => doc.textContent.trim(), []);
  const emptyEditor = useCallback(
    (ref: RefObject<EditorView>) => !ref.current || ref.current.state.doc.nodeSize <= 4,
    []
  );

  useEffect(() => {
    if (!mentionMenuPluginState || !mentionMenuPluginState.open) return;

    setIsTyping(true);
    return freezeAll();
  }, [mentionMenuPluginState]);

  const [commentTextContent, setCommentTextContent] = useState(
    startingValue ? textContent(Node.fromJSON(schema, startingValue)) : ''
  );

  useOnClickOutside(
    inputContainerRef,
    () => {
      if (commentTextContent === '') setIsTyping(false);
    },
    undefined,
    undefined,
    undefined,
    isMobile
  );

  useOnClickOutside(
    mentionsMenuRef,
    () => {
      if (!editorRef.current) return;
      const tr = editorRef.current.state.tr;
      tr.setMeta(mentionsKey, { type: MentionMetaTypes.close });
      editorRef.current?.dispatch(tr);
    },
    undefined,
    undefined,
    undefined,
    isMobile
  );

  const sendMentionEvents = useCallback(
    (commentState: EditorState, threadID: string) => {
      const userMentionsNodes: Node[] = [];
      commentState.doc.descendants((node) => {
        if (
          (node.type.name === MENTION && node.attrs.type === UserMentionType) ||
          node.attrs.type === InviteMentionType
        ) {
          userMentionsNodes.push(node);
          return false;
        }
        return true;
      });

      userMentionsNodes.forEach((mention) => {
        // we pass here the thread id as the nodeID so the deeplink will be connected to the comment
        if (mention.attrs.type === InviteMentionType) {
          // no action for invite yet
          return;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          void onMention(mention.attrs.id, threadID, true);
        }
      });
    },
    [onMention]
  );

  const submitComment = useCallback(
    (commentState: EditorState, dispatch: (tr: Transaction) => void): boolean => {
      if (commentState.doc.nodeSize <= 4) return false; //Empty
      const newTr = commentState.tr;
      let newState = commentState;
      const lastChild = commentState.doc.content.lastChild?.content?.lastChild;
      const candidate = lastChild?.textContent.trim() || '';
      // We add URL when the last childNode is a text node without any marks and its content is a URL
      // without this, if the user clicks submit without pressing enter or space the link won't be a href
      if (lastChild?.type.name === TEXT && lastChild.marks.length === 0 && isURL(candidate)) {
        const linkTr = newTr.addMark(
          newState.doc.nodeSize - lastChild.textContent.length - 3,
          newState.doc.nodeSize - 3,
          newState.schema.marks[MARK_LINK].create({
            href: sanitizeURL(candidate)
          })
        );
        newState = newState.apply(linkTr);
      }
      // Add content as new comment
      const threadID = onAddComment(newState.doc.toJSON(), textContent(newState.doc));
      if (threadID) sendMentionEvents(newState, threadID);
      // Clear the current state
      newTr.deleteRange(0, newState.doc.nodeSize - 2);
      newTr.setMeta(PreventOnChangeEvent, true);

      dispatch(newTr);

      setCommentTextContent('');

      if (editorRef.current) editorRef.current.focus();
      // update on submit
      setTimeout(() => CommentsPositionEmitter.emit('position-comments'), 0);

      return true;
    },
    [onAddComment, sendMentionEvents, textContent]
  );

  // update on content change - to catch the input expand
  useEffect(() => {
    CommentsPositionEmitter.emit('position-comments');
  }, [commentTextContent]);

  useEffect(() => {
    if (active && editorRef.current) editorRef.current.focus();
  }, [active]);

  useEffect(() => {
    CommentsPositionEmitter.emit('position-comments');
  }, [isTyping]);

  useEffect(() => {
    if (editorRef.current) editorRef.current.focus();
  }, [startingValue]);

  useEffect(() => {
    const desiredTop = reactionButtonRef.current?.getBoundingClientRect().top;
    setOpenReactionUpwards((desiredTop || 0) + 360 > window.outerHeight);
  }, []);

  const handleInputClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // prevent focus when emoji popup is clicked
    if ((e.target as HTMLElement).closest(`.${COMMENT_REACTIONS_CLASS_NAME}`)) return;

    setIsTyping(true);

    if (editorRef.current) editorRef.current.focus();

    //CommentsPositionEmitter.emit('position-comments');
    e.stopPropagation();
  }, []);

  const hideBottomBar = !(isTyping || !emptyEditor(editorRef)) || isMobile;

  const mentionsPopupCoords = positionBodyPopupAccordingToSelection(
    editorRef.current,
    MENTIONS_POP_SIZE,
    POP_THRESHOLD,
    POP_OFFSET
  );
  const emojiPopupCoords = positionBodyPopupAccordingToSelection(
    editorRef.current,
    EMOJI_POP_SIZE,
    POP_THRESHOLD,
    POP_OFFSET
  );

  return (
    <div className='comments-input-cont' onClick={handleInputClick} ref={inputContainerRef}>
      <div className='comments-input-inner-container'>
        <BodyPopup {...emojiPopupCoords}>
          <div ref={reactionPickerRef}>
            <EmojiPopup
              open={emojiPickerOpen}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              onSelect={({ native }) => {
                if (!editorRef.current) return;

                const {
                  dispatch,
                  state: { tr }
                } = editorRef.current;

                tr.insertText(`${native} `, editorRef.current.state.selection.from);
                dispatch(tr);

                setEmojiPickerOpen(false);
                if (editorRef.current) editorRef.current.focus();
              }}
              style={{
                zIndex: 2,
                position: 'absolute',
                transform: openReactionUpwards ? 'translateY(-100%)' : ''
              }}
              theme={theme}
            />
          </div>
        </BodyPopup>
        <CommentEditor
          editorRef={editorRef}
          initValue={startingValue}
          onSubmit={(editorState: EditorState, dispatch: (tr: Transaction) => void) => {
            if (!mentionMenuPluginState?.open) return submitComment(editorState, dispatch);
            return false;
          }}
          onChange={() => {
            if (!editorRef.current) return;
            setCommentTextContent(textContent(editorRef.current?.state.doc));
            const mentionMenuPluginState = editorRef.current
              ? mentionsKey.getState(editorRef.current?.state)
              : undefined;
            setMentionMenuPluginState(mentionMenuPluginState);
            if (!emptyEditor(editorRef)) onChange(editorRef.current?.state.doc.toJSON() || null);
            else onChange(null);
          }}
          nodeViews={comentEditorNodeViews}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {!isTyping && emptyEditor(editorRef) && (
          <div
            style={{
              position: 'absolute',
              left: 17,
              top: 9
            }}
          >
            <Typography mono uppercase color='secondary'>
              {firstComment ? 'Add a comment' : 'Reply'}
            </Typography>
          </div>
        )}
        {mentionMenuPluginState?.open && editorRef.current && (
          <EditorMentionsMenu
            ref={mentionsMenuRef}
            mentionMenuState={mentionMenuPluginState}
            view={editorRef.current}
            customState={getCustomState(state)}
          />
        )}
        <DividerContainer $hidden={hideBottomBar}>
          <Divider width='310px' />
        </DividerContainer>
        <div className='comment-input-bottom-bar' style={{ position: 'relative' }}>
          <div style={{ display: hideBottomBar ? 'none' : 'flex' }}>
            <IconButton
              onClick={() => {
                if (!editorRef.current) return;
                const tr = editorRef.current.state.tr;
                tr.setMeta(mentionsKey, { type: MentionMetaTypes.open });
                editorRef.current?.dispatch(tr);
              }}
              icon={Icon.At}
              type={Type.SECONDARY}
            />
            <div ref={reactionButtonRef}>
              <IconButton
                onClick={() => {
                  setEmojiPickerOpen(true);
                }}
                icon={Icon.SmilePlus}
                type={Type.SECONDARY}
              />
            </div>
          </div>
          <div
            className='comment-input-send-btn'
            style={
              hideBottomBar
                ? {
                    position: 'absolute',
                    right: 4,
                    top: 0,
                    transform: 'translateY(-100%)'
                  }
                : {}
            }
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                if (!editorRef.current) return;
                submitComment(editorRef.current.state, editorRef.current.dispatch);
              }}
              icon={Icon.Send}
              filled
              disabled={emptyEditor(editorRef)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
