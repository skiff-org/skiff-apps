import { Dropdown, DropdownItem, FilledVariant, Icon, IconText, Size, TypographyWeight } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { AddressObject, SystemLabels, ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { FULL_VIEW_BREAKPOINT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { BlockUnblockSenderType, ModalType } from '../../../redux/reducers/modalTypes';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { MoveToLabelDropdown } from '../../labels/MoveToLabelDropdown';
import { Separator } from '../../shared/headerStyles';
import { ConfirmSilencingModal } from '../../shared/Silencing';
import TooltipWithShortcut from '../../shared/TooltipWithShortcut/TooltipWithShortcut';
import { ThreadNavigationIDs } from '../Thread.types';

import ThreadEncryptionBadge from './ThreadEncryptionBadge';

const ThreadToolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  box-sizing: border-box;
  height: 48px; // set to align with search bar end adornment
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
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
  // The action to take if you can unsubscribe from the thread
  onUnsubscribe: (() => void) | undefined;
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
  onUnsubscribe,
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
  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;
  const isImported = label === SystemLabels.Imports;
  const isScheduleSend = label === SystemLabels.ScheduleSend;
  // need noSsr in useMediaQuery to avoid the first render returning isCompact as false
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`, { noSsr: true });
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  const { markThreadsAsReadUnread } = useMarkAsReadUnread();

  const moveToDropdownRef = useRef<HTMLDivElement>(null);
  const [moveToDropdownOpen, setMoveToDropdownOpen] = useState(false);

  const moreButtonRef = useRef<HTMLDivElement>(null);
  // Dropdown that includes secondary thread actions (ie mark as spam, silence sender)
  const [moreOptionsDropdownOpen, setMoreOptionsDropdownOpen] = useState(false);

  const [confirmSilencingModalOpen, setConfirmSilencingModalOpen] = useState(false);

  const { moveThreads, archiveThreads, setActiveThreadID, trashThreads, deleteThreads } = useThreadActions();
  const { activeThreadLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);

  // Redux actions
  const dispatch = useDispatch();
  const openBlockUnblockSenderModal = (from: AddressObject, action: BlockUnblockSenderType) => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BlockUnblockSender, from, action }));
  };
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

  // We only show silencing as a thread action if the thread's senderToSilence value is defined
  // The thread's senderToSilence value is defined if there is one sender (excluding yourself) on the thread
  const showSilencing = !!thread?.senderToSilence;
  const isSenderBlocked = thread?.emails[0]?.from?.blocked;

  return (
    <ThreadToolbar>
      <Toolbar>
        <LeftButtons>
          {!isDrafts && (
            <>
              <IconText
                color='secondary'
                onClick={onClose}
                startIcon={isCompact || threadFormat === ThreadDisplayFormat.Full ? Icon.ArrowLeft : Icon.Close}
              />
              <Separator />
              <IconText
                disabled={!prevThreadAndEmail}
                onClick={selectPreviousThread}
                size={Size.SMALL}
                startIcon={Icon.Backward}
                tooltip='Previous email'
                variant={FilledVariant.FILLED}
              />
              <IconText
                disabled={!nextThreadAndEmail}
                onClick={selectNextThread}
                size={Size.SMALL}
                startIcon={Icon.Forward}
                tooltip='Next email'
                variant={FilledVariant.FILLED}
              />
            </>
          )}
        </LeftButtons>
        <RightButtons>
          {onUnsubscribe && (
            <>
              <IconText
                color='secondary'
                label='Unsubscribe'
                onClick={onUnsubscribe}
                variant={FilledVariant.FILLED}
                weight={TypographyWeight.REGULAR}
              />
              <Separator />
            </>
          )}
          {isSkiffSender !== undefined && !loading && (
            <>
              <ThreadEncryptionBadge isSkiffSender={isSkiffSender} sender={thread?.emails[0]?.from.address} />
              <Separator />
            </>
          )}
          <div>
            <IconText
              onClick={() => setLabelsDropdown()}
              ref={labelDropdownRef}
              startIcon={Icon.Tag}
              tooltip={<TooltipWithShortcut label='Labels' shortcut='L' />}
              variant={FilledVariant.FILLED}
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
                onClick={() => setMoveToDropdownOpen(true)}
                ref={moveToDropdownRef}
                startIcon={Icon.FolderArrow}
                tooltip='Move to'
                variant={FilledVariant.FILLED}
              />
              <MoveToLabelDropdown
                buttonRef={moveToDropdownRef}
                currentSystemLabels={[label]}
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
              onClick={(e) => {
                e?.stopPropagation();
                // undo trash or archive
                void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
              }}
              startIcon={Icon.MoveMailbox}
              tooltip={<TooltipWithShortcut label='Move to inbox' shortcut='Z' />}
              variant={FilledVariant.FILLED}
            />
          )}
          {label === SystemLabels.Spam && (
            <>
              <IconText
                onClick={() => {
                  void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                }}
                startIcon={Icon.MoveMailbox}
                tooltip='Not spam'
                variant={FilledVariant.FILLED}
              />
              {showSilencing && (
                <IconText
                  onClick={() => {
                    setConfirmSilencingModalOpen(true);
                  }}
                  startIcon={Icon.EnvelopeSilence}
                  tooltip='Silence sender'
                  variant={FilledVariant.FILLED}
                />
              )}
            </>
          )}
          {!isArchive && !isTrash && !isDrafts && !isImported && !isScheduleSend && (
            <IconText
              onClick={(e) => {
                e?.stopPropagation();
                void archiveThreads([threadID], false);
              }}
              startIcon={Icon.Archive}
              tooltip={<TooltipWithShortcut label='Archive' shortcut='E' />}
              variant={FilledVariant.FILLED}
            />
          )}
          {![SystemLabels.Spam, SystemLabels.ScheduleSend].includes(label as SystemLabels) && (
            <>
              <IconText
                onClick={() => {
                  if (showSilencing) {
                    setMoreOptionsDropdownOpen(true);
                    return;
                  }
                  void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
                }}
                ref={moreButtonRef}
                startIcon={showSilencing ? Icon.OverflowH : Icon.Spam}
                tooltip={!showSilencing ? 'Report spam' : undefined}
                variant={FilledVariant.FILLED}
              />
              <Dropdown
                buttonRef={moreButtonRef}
                gapFromAnchor={12}
                portal
                setShowDropdown={setMoreOptionsDropdownOpen}
                showDropdown={moreOptionsDropdownOpen}
              >
                <DropdownItem
                  icon={Icon.Spam}
                  label='Report spam'
                  onClick={() => {
                    void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
                    setMoreOptionsDropdownOpen(false);
                  }}
                />
                <DropdownItem
                  icon={Icon.SoundSlash}
                  label={isSenderBlocked ? 'Unsilence sender' : 'Silence sender'}
                  onClick={(e) => {
                    e?.stopPropagation();
                    if (isSenderBlocked) {
                      if (!thread.emails[0]?.from) return;
                      openBlockUnblockSenderModal(
                        thread.emails[0].from,
                        isSenderBlocked ? BlockUnblockSenderType.Unblock : BlockUnblockSenderType.Block
                      );
                    } else {
                      setConfirmSilencingModalOpen(true);
                    }
                    setMoreOptionsDropdownOpen(false);
                  }}
                />
              </Dropdown>
            </>
          )}
          {!isTrash && !isScheduleSend && (
            <IconText
              color='destructive'
              dataTest={ThreadActionsDataTest.moveToTrashIcon}
              onClick={(e) => {
                e?.stopPropagation();
                void trashThreads([threadID], isDrafts, false, label);
              }}
              startIcon={Icon.Trash}
              tooltip={<TooltipWithShortcut label='Trash' shortcut='#' />}
              variant={FilledVariant.FILLED}
            />
          )}
          {isScheduleSend && (
            <IconText
              color='destructive'
              dataTest={ThreadActionsDataTest.moveToTrashIcon}
              label='Cancel send'
              onClick={(e) => {
                e?.stopPropagation();
                dispatch(
                  skemailModalReducer.actions.setOpenModal({
                    type: ModalType.UnSendMessage,
                    // we pass only the ID since 'activeThread' doesn't have the message body;
                    // and UnSendMessage will retrieve full thread from the ID
                    threadID: threadID
                  })
                );
              }}
              tooltip={<TooltipWithShortcut label='Trash' shortcut='#' />}
              variant={FilledVariant.FILLED}
            />
          )}
          {isTrash && (
            <IconText
              color='destructive'
              onClick={(e) => {
                e?.stopPropagation();
                void deleteThreads([threadID], false);
              }}
              startIcon={Icon.Trash}
              tooltip='Permanently delete'
              variant={FilledVariant.FILLED}
            />
          )}
        </RightButtons>
        <ConfirmSilencingModal
          addressesToSilence={thread?.senderToSilence ? [thread.senderToSilence] : []}
          onClose={() => {
            setConfirmSilencingModalOpen(false);
          }}
          open={confirmSilencingModalOpen}
        />
      </Toolbar>
    </ThreadToolbar>
  );
};
