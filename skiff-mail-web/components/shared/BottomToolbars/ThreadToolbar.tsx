import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Icon } from '@skiff-org/skiff-ui';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import ToolbarButton from './ToolbarButton';
import { MailboxThreadInfo } from '../../../models/thread';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { SystemLabels } from '../../../generated/graphql';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
interface ThreadToolbarProps {
  onReplyClick: () => void;
  thread: MailboxThreadInfo;
}

export const ThreadToolbar = ({ onReplyClick, thread }: ThreadToolbarProps) => {
  const dispatch = useDispatch();
  const context = useRouterLabelContext();
  const { trashThreads } = useThreadActions();

  const openCompose = useCallback(() => dispatch(skemailModalReducer.actions.openCompose({})), []);
  const onTrashClick = useCallback(
    () => trashThreads([thread.threadID], context && context.value === SystemLabels.Drafts),
    []
  );
  const showShowMoveThread = useCallback(
    () => dispatch(skemailMobileDrawerReducer.actions.setShowMoveThreadDrawer(true)),
    []
  );

  return (
    <>
      <ToolbarButton icon={Icon.Trash} onClick={onTrashClick} />
      <ToolbarButton icon={Icon.FolderArrow} onClick={showShowMoveThread} />
      <ToolbarButton icon={Icon.Reply} onClick={onReplyClick} />
      <ToolbarButton icon={Icon.Compose} link onClick={openCompose} />
    </>
  );
};
