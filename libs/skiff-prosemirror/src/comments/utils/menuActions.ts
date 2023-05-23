import { Icon, IconProps } from 'nightwatch-ui';
import { MarkType } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { Dispatch } from 'react';

import { AnchorTypes, createDeepLinkUrl } from '../../utils/deeplink';
import { activeThreadKey } from '../comment.types';

import { checkIfAnonymousComment, checkIfUserIsCommentCreator, removeCommentByIds } from './comment';
import {
  checkIfOnlySingleComment,
  checkIfResolved,
  checkIfThreadUnreadById,
  findThreadNodes,
  getThreadAttrsById,
  markThreadUnreadById,
  removeThreadById,
  toggleResolvedById
} from './thread';

export enum EnabledStates {
  Visible = 'visible',
  Hidden = 'hidden'
}
export interface Actions {
  [actionLabel: string]: { action: () => void; enabled: () => EnabledStates; icon?: IconProps['icon'] };
}

const copyThreadLink = (triggerToast: (icon: Icon) => void, threadId: string) => () => {
  const url = createDeepLinkUrl(AnchorTypes.Comment, threadId);
  void navigator.clipboard.writeText(url).then(() => {
    triggerToast(Icon.Link);
  });
};

const editComment = (startEditing: () => void) => () => {
  startEditing();
};

const deleteComment =
  (view: EditorView, threadId: string, commentMarkType: MarkType, commentId: string, setConfirmState: Dispatch<any>) =>
  () => {
    const threadNodes = findThreadNodes(view.state.doc, commentMarkType, threadId);
    setConfirmState((s: any) => ({
      ...s,
      ...{
        open: true,
        confirmName: 'Delete',
        title: 'Are you sure ?',
        description: 'Would you like to delete this comment?',
        onCancel: (e: any) => {
          setConfirmState((s: any) => ({ ...s, open: false }));
          const { tr } = view.state;
          tr.setMeta(activeThreadKey, {
            from: threadNodes[0].pos,
            to: threadNodes[0].pos + threadNodes[0].node.nodeSize - 1,
            id: [threadId]
          });
          view.dispatch(tr);
        },
        onConfirm: () => {
          setConfirmState((s: any) => ({ ...s, open: false }));
          removeCommentByIds(view, threadId, commentId, commentMarkType);
        },
        destructive: true
      }
    }));
  };

const deleteThread =
  (view: EditorView, threadId: string, commentMarkType: MarkType, setConfirmState: Dispatch<any>) => () => {
    const threadNodes = findThreadNodes(view.state.doc, commentMarkType, threadId);
    setConfirmState((s: any) => ({
      ...s,
      ...{
        open: true,
        confirmName: 'Delete',
        title: 'Are you sure ?',
        description: 'Would you like to delete this thread?',
        onCancel: (e: any) => {
          setConfirmState((s: any) => ({ ...s, open: false }));
          const { tr } = view.state;
          tr.setMeta(activeThreadKey, {
            from: threadNodes[0].pos,
            to: threadNodes[0].pos + threadNodes[0].node.nodeSize - 1,
            id: [threadId]
          });
          view.dispatch(tr);
        },
        onConfirm: () => {
          removeThreadById(view, threadId, commentMarkType);
          setConfirmState((s: any) => ({ ...s, open: false }));
        },
        destructive: true
      }
    }));
  };

const VisibleHidden = (show: boolean) => (show ? EnabledStates.Visible : EnabledStates.Hidden);

export const threadMenuActions = (
  view: EditorView,
  commentMarkType: MarkType,
  threadId: string,
  triggerToast: (icon: Icon) => void,
  setConfirmState: React.Dispatch<React.SetStateAction<any>>,
  anonymous: boolean
): Actions => ({
  'Copy link': {
    action: copyThreadLink(triggerToast, threadId),
    enabled: () => VisibleHidden(!checkIfResolved(view, threadId, commentMarkType)),
    icon: Icon.Link
  },
  'Mark as unread': {
    action: () => markThreadUnreadById(view, threadId, commentMarkType),
    enabled: () =>
      VisibleHidden(
        !anonymous &&
          !checkIfThreadUnreadById(view, threadId, commentMarkType) &&
          !getThreadAttrsById(view.state.doc, commentMarkType, threadId)?.resolved
      ),
    icon: Icon.Eye
  },
  'Delete thread': {
    action: deleteThread(view, threadId, commentMarkType, setConfirmState),
    enabled: () => {
      const firstThreadCommentAttr = getThreadAttrsById(view.state.doc, commentMarkType, threadId)?.thread[0].id || '';
      return VisibleHidden(
        // Allow thread delete if you are the creator
        checkIfUserIsCommentCreator(view, threadId, firstThreadCommentAttr, commentMarkType) ||
          // Allow thread delete if if created by anonymous
          checkIfAnonymousComment(view, threadId, firstThreadCommentAttr, commentMarkType)
      );
    },
    icon: Icon.Remove
  },
  'Re-open thread': {
    action: () => {
      toggleResolvedById(view, threadId, commentMarkType);
    },
    enabled: () => VisibleHidden(!anonymous && checkIfResolved(view, threadId, commentMarkType)),
    icon: Icon.CheckCircle
  }
});

export const commentMenuActions = (
  view: EditorView,
  commentMarkType: MarkType,
  threadId: string,
  commentId: string,
  startEditing: () => void,
  triggerToast: (icon: Icon) => void,
  setConfirmState: React.Dispatch<React.SetStateAction<any>>,
  anonymous: boolean
): Actions => ({
  'Copy link': {
    action: copyThreadLink(triggerToast, threadId),
    enabled: () => VisibleHidden(!checkIfResolved(view, threadId, commentMarkType)),
    icon: Icon.Link
  },
  'Edit comment': {
    action: editComment(startEditing),
    enabled: () => VisibleHidden(!anonymous && checkIfUserIsCommentCreator(view, threadId, commentId, commentMarkType)),
    icon: Icon.Edit
  },
  'Delete comment': {
    action: deleteComment(view, threadId, commentMarkType, commentId, setConfirmState),
    enabled: () =>
      VisibleHidden(
        // If only single comment cant delete comment, must delete entire thread
        !checkIfOnlySingleComment(view, threadId, commentMarkType) &&
          // Allow delete if comment creator or comment created by anonymous user
          (checkIfUserIsCommentCreator(view, threadId, commentId, commentMarkType) ||
            checkIfAnonymousComment(view, threadId, commentId, commentMarkType))
      ),
    icon: Icon.Remove
  }
});
