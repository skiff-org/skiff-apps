import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { Icon, IconText, Size, TypographyWeight } from '@skiff-org/skiff-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { MoveToLabelDropdown } from '../../labels/MoveToLabelDropdown';
import { ThreadNavigationIDs } from '../Thread.types';

const ThreadToolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  box-sizing: border-box;
  height: 60px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
`;

const Separator = styled.div`
  background: var(--border-tertiary);
  margin: 0px 4px;
  width: 2px;
  height: 20px;
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RightButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MarginRight = styled.div`
  width: 11px;
`;

const Spacer = styled.div`
  width: 90px;
  background: var(--cta-secondary-default);
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  height: 26px;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.02);
`;

export const ThreadActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  undoTrashIcon: 'undo-trash-icon'
};

interface ThreadActionsProps {
  // Label of the mailbox where the thread is rendered in
  label: string;
  // current threadID
  threadID: string;
  // close the thread
  onClose: () => void;
  // email refs
  emailRefs: Record<string, React.MutableRefObject<HTMLDivElement | null>>;
  // defined if component is keeping track of the active thread and email itself instead of using route params
  setActiveThreadAndEmail?: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  // next thread and email IDs
  nextThreadAndEmail?: ThreadNavigationIDs;
  // previous thread and email IDs
  prevThreadAndEmail?: ThreadNavigationIDs;
  // is skiff-to-skiff
  isSkiffSender?: boolean;
  loading?: boolean;
}

const SKIFF_WHITEPAPER = 'https://skiff.com/whitepaper';

/**
 * Thread Actions
 *
 * Component for rendering actions that modify items in a Thread (e.g. delete, move, mark as reads).
 *
 */
export const ThreadActions = ({
  label,
  threadID,
  onClose,
  setActiveThreadAndEmail,
  nextThreadAndEmail,
  prevThreadAndEmail,
  isSkiffSender,
  loading
}: ThreadActionsProps) => {
  const { data } = useGetThreadFromIdQuery({ variables: { threadID } });
  const thread = data?.userThread;
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const isDrafts = label === SystemLabels.Drafts;
  const isDraftsOrSent = isDrafts || label === SystemLabels.Sent;
  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;
  // need noSsr in useMediaQuery to avoid the first render returning isCompact as false
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`, { noSsr: true });
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  const { markThreadsAsReadUnread } = useMarkAsReadUnread();

  const moveToDropdownRef = useRef<HTMLDivElement>(null);
  const [moveToDropdownOpen, setMoveToDropdownOpen] = useState(false);

  const { moveThreads, archiveThreads, setActiveThreadID, trashThreads, deleteThreads } = useThreadActions();
  const { activeThreadLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);

  // Redux actions
  const dispatch = useDispatch();

  const setLabelsDropdown = (open?: boolean) => {
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen(open));
  };

  const setActiveMessage = (threadAndEmail: ThreadNavigationIDs) => {
    if (setActiveThreadAndEmail) {
      setActiveThreadAndEmail(threadAndEmail);
    } else {
      setActiveThreadID({ threadID: threadAndEmail.threadID });
    }
    if (thread && !thread.attributes.read) markThreadsAsReadUnread([thread], true);
  };

  const selectPreviousThread = () => {
    if (!!prevThreadAndEmail) {
      setActiveMessage(prevThreadAndEmail);
    }
  };

  const selectNextThread = () => {
    if (!!nextThreadAndEmail) {
      setActiveMessage(nextThreadAndEmail);
    }
  };

  // only clearActiveThreadID if there is no next thread
  const clearActiveThreadIDAfterAction = !nextThreadAndEmail;

  return (
    <ThreadToolbar>
      <Toolbar>
        <LeftButtons>
          {!isDrafts && (
            <>
              <IconText
                iconColor='secondary'
                onClick={onClose}
                startIcon={isCompact || threadFormat === ThreadDisplayFormat.Full ? Icon.ArrowLeft : Icon.Close}
              />
              <Separator />
              <IconText
                disabled={!prevThreadAndEmail}
                filled
                onClick={selectPreviousThread}
                size={Size.SMALL}
                startIcon={Icon.Backward}
                tooltip='Previous email'
              />
              <IconText
                disabled={!nextThreadAndEmail}
                filled
                onClick={selectNextThread}
                size={Size.SMALL}
                startIcon={Icon.Forward}
                tooltip='Next email'
              />
            </>
          )}
        </LeftButtons>
        <RightButtons>
          <div>
            <IconText
              filled
              onClick={() => setLabelsDropdown()}
              ref={labelDropdownRef}
              startIcon={Icon.Tag}
              tooltip={{ title: 'Labels', shortcut: 'L' }}
            />
            <MoveToLabelDropdown
              buttonRef={labelDropdownRef}
              currentSystemLabels={[label]}
              onClose={() => {
                setLabelsDropdown(false);
              }}
              open={activeThreadLabelsDropdownOpen}
              threadID={threadID}
            />
          </div>
          {label !== SystemLabels.ScheduleSend && (
            <div>
              <IconText
                filled
                onClick={() => setMoveToDropdownOpen(true)}
                ref={moveToDropdownRef}
                startIcon={Icon.FolderArrow}
                tooltip='Move to'
              />
              <MoveToLabelDropdown
                buttonRef={moveToDropdownRef}
                currentSystemLabels={[label]}
                nextThreadAndEmail={nextThreadAndEmail}
                onClose={() => {
                  setMoveToDropdownOpen(false);
                }}
                open={moveToDropdownOpen}
                threadID={threadID}
                variant={UserLabelVariant.Folder}
              />
            </div>
          )}
          {(isTrash || isArchive) && (
            <IconText
              dataTest={ThreadActionsDataTest.undoTrashIcon}
              filled
              onClick={(e) => {
                e?.stopPropagation();
                // undo trash or archive
                void moveThreads(
                  [threadID],
                  LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox],
                  [label],
                  clearActiveThreadIDAfterAction
                );
                selectNextThread();
              }}
              startIcon={Icon.MoveMailbox}
              tooltip={{ title: 'Move to inbox', shortcut: 'Z' }}
            />
          )}
          {![SystemLabels.Spam, SystemLabels.ScheduleSend].includes(label as SystemLabels) && (
            <IconText
              filled
              onClick={() => {
                void moveThreads(
                  [threadID],
                  LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam],
                  [label],
                  clearActiveThreadIDAfterAction
                );
                selectNextThread();
              }}
              startIcon={Icon.Spam}
              tooltip='Report spam'
            />
          )}
          {label === SystemLabels.Spam && (
            <IconText
              filled
              onClick={() => {
                void moveThreads(
                  [threadID],
                  LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox],
                  [label],
                  clearActiveThreadIDAfterAction
                );
                selectNextThread();
              }}
              startIcon={Icon.MoveMailbox}
              tooltip='Not spam'
            />
          )}
          {!isArchive && !isTrash && !isDraftsOrSent && (
            <IconText
              filled
              onClick={(e) => {
                e?.stopPropagation();
                void archiveThreads([threadID], false, clearActiveThreadIDAfterAction);
                selectNextThread();
              }}
              startIcon={Icon.Archive}
              tooltip={{ title: 'Archive', shortcut: 'E' }}
            />
          )}
          {!isTrash && (
            <IconText
              color='destructive'
              dataTest={ThreadActionsDataTest.moveToTrashIcon}
              filled
              onClick={(e) => {
                e?.stopPropagation();
                void trashThreads([threadID], isDrafts, false, clearActiveThreadIDAfterAction);
                selectNextThread();
              }}
              startIcon={Icon.Trash}
              tooltip={{ title: 'Trash', shortcut: '#' }}
            />
          )}
          {isTrash && (
            <IconText
              color='destructive'
              filled
              onClick={(e) => {
                e?.stopPropagation();
                void deleteThreads([threadID], false, clearActiveThreadIDAfterAction);
                selectNextThread();
              }}
              startIcon={Icon.Trash}
              tooltip='Permanently delete'
            />
          )}
          <Separator />
          {loading && <Spacer />}
          {isSkiffSender !== undefined && !loading && (
            <FloatingDelayGroup delay={{ open: 0, close: 200 }}>
              <IconText
                color={loading ? 'inverse' : isSkiffSender ? 'green' : 'primary'}
                filled
                iconColor={isSkiffSender ? 'green' : 'secondary'}
                label={isSkiffSender ? 'E2EE' : 'Secure'}
                onClick={() => window.open(SKIFF_WHITEPAPER, '_blank', 'noopener noreferrer')}
                startIcon={isSkiffSender ? Icon.ShieldCheck : Icon.Lock}
                tooltip={isSkiffSender ? 'Thread is end-to-end encrypted' : 'Thread is encrypted'}
                weight={TypographyWeight.REGULAR}
              />
              {isSkiffSender && (
                <>
                  {/* needed to prevent move folder dropdown from flashing */}
                  <MarginRight />
                </>
              )}
            </FloatingDelayGroup>
          )}
        </RightButtons>
      </Toolbar>
    </ThreadToolbar>
  );
};
