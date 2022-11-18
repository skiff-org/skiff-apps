import { Icon, IconButton, Icons, Tooltip } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { useGetThreadFromIdQuery } from 'skiff-mail-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useCurrentUserEmailAliases } from '../../../hooks/useCurrentUserEmailAliases';
import { useDefaultEmailAlias } from '../../../hooks/useDefaultEmailAlias';
import { useDrafts } from '../../../hooks/useDrafts';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { useUserSignature } from '../../../hooks/useUserSignature';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { handleMarkAsReadUnreadClick } from '../../../utils/mailboxUtils';
import { LabelDropdown } from '../../labels/LabelDropdown';
import { ThreadNavigationIDs } from '../Thread.types';

const ThreadToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ReplyActions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Separator = styled.div`
  background: var(--border-secondary);
  margin: 0px 8px;
  width: 1.5px;
  height: 20px;
  border-radius: 10px;
`;

const LockContainer = styled.div<{ $isSkiffSender: boolean }>`
  background: ${(props) => (props.$isSkiffSender ? 'var(--accent-green-secondary)' : 'var(--bg-field-default)')};
  padding: 6px;
  border-radius: 8px;
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
  emailRefs,
  setActiveThreadAndEmail,
  nextThreadAndEmail,
  prevThreadAndEmail,
  isSkiffSender
}: ThreadActionsProps) => {
  const { data } = useGetThreadFromIdQuery({ variables: { threadID } });
  const emails = data?.userThread?.emails ?? [];
  const email = emails[emails.length - 1];
  const thread = data?.userThread;
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const isDrafts = label === SystemLabels.Drafts;
  const isDraftsOrSent = isDrafts || label === SystemLabels.Sent;
  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;
  const [defaultEmailAlias] = useDefaultEmailAlias();

  const moveToDropdownRef = useRef<HTMLDivElement>(null);
  const [moveToDropdownOpen, setMoveToDropdownOpen] = useState(false);

  const { moveThreads, archiveThreads, setActiveThreadID, trashThreads, deleteThreads } = useThreadActions();
  const { composeNewDraft } = useDrafts();
  const { activeThreadLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);
  const setLabelsDropdown = (open?: boolean) =>
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen(open));

  // Redux actions
  const dispatch = useDispatch();
  const emailAliases = useCurrentUserEmailAliases();
  const userSignature = useUserSignature();

  const reply = () => {
    composeNewDraft();
    if (thread) {
      dispatch(
        skemailModalReducer.actions.replyCompose({
          email,
          thread,
          emailAliases,
          defaultEmailAlias,
          signature: userSignature
        })
      );
    }
    //Scroll to latest email
    const lastEmailRef = emailRefs[email.id];
    if (lastEmailRef?.current) {
      lastEmailRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const replyAll = () => {
    composeNewDraft();
    if (thread) {
      dispatch(
        skemailModalReducer.actions.replyAllCompose({
          email,
          thread,
          emailAliases,
          defaultEmailAlias,
          signature: userSignature
        })
      );
    }
  };

  const forward = () => {
    composeNewDraft();
    if (thread) {
      dispatch(skemailModalReducer.actions.forwardCompose({ email, emailAliases, defaultEmailAlias }));
    }
  };

  const setActiveMessage = (threadAndEmail: ThreadNavigationIDs) => {
    if (setActiveThreadAndEmail) {
      setActiveThreadAndEmail(threadAndEmail);
    } else {
      setActiveThreadID({ threadID: threadAndEmail.threadID });
    }
    if (thread && !thread.attributes.read) void handleMarkAsReadUnreadClick([thread], true);
  };

  const prev = () => {
    if (!!prevThreadAndEmail) {
      setActiveMessage(prevThreadAndEmail);
    }
  };

  const next = () => {
    if (!!nextThreadAndEmail) {
      setActiveMessage(nextThreadAndEmail);
    }
  };

  return (
    <ThreadToolbar>
      <Toolbar>
        {!isDrafts && (
          <>
            {true && (
              <>
                <IconButton color='secondary' icon={Icon.Close} onClick={onClose} />
                <Separator />
              </>
            )}
            <IconButton
              color='secondary'
              disabled={!prevThreadAndEmail}
              icon={Icon.ArrowUp}
              onClick={prev}
              size='small'
              tooltip='Move up'
              type='filled'
            />
            <IconButton
              color='secondary'
              disabled={!nextThreadAndEmail}
              icon={Icon.ArrowDown}
              onClick={next}
              size='small'
              tooltip='Move down'
              type='filled'
            />
            <Separator />
            <div>
              <IconButton
                color='secondary'
                hideTooltip={activeThreadLabelsDropdownOpen}
                icon={Icon.Tag}
                onClick={() => setLabelsDropdown()}
                ref={labelDropdownRef}
                tooltip={{ title: 'Labels', shortcut: 'L' }}
              />
              <LabelDropdown
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
                <IconButton
                  color='secondary'
                  hideTooltip={moveToDropdownOpen}
                  icon={Icon.FolderArrow}
                  onClick={() => setMoveToDropdownOpen(true)}
                  ref={moveToDropdownRef}
                  tooltip='Move to'
                />
                <LabelDropdown
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
            {isTrash && (
              <IconButton
                color='secondary'
                icon={Icon.Trash}
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteThreads([threadID]);
                }}
                tooltip='Permanently delete'
              />
            )}
            {![SystemLabels.Spam, SystemLabels.ScheduleSend].includes(label as SystemLabels) && (
              <IconButton
                color='secondary'
                icon={Icon.Spam}
                onClick={() => {
                  void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
                }}
                tooltip='Report spam'
              />
            )}
            {label === SystemLabels.Spam && (
              <IconButton
                color='secondary'
                icon={Icon.MoveMailbox}
                onClick={() => {
                  void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                }}
                tooltip='Not spam'
              />
            )}
          </>
        )}
        {!isArchive && !isTrash && !isDraftsOrSent && (
          <IconButton
            color='secondary'
            icon={Icon.Archive}
            onClick={(e) => {
              e.stopPropagation();
              void archiveThreads([threadID]);
            }}
            tooltip={{ title: 'Archive', shortcut: 'E' }}
          />
        )}
        {!isArchive && !isTrash && (
          <IconButton
            color='secondary'
            dataTest={ThreadActionsDataTest.moveToTrashIcon}
            icon={Icon.Trash}
            onClick={(e) => {
              e.stopPropagation();
              void trashThreads([threadID], isDrafts);
            }}
            tooltip={{ title: 'Trash', shortcut: '#' }}
          />
        )}
        {(isTrash || isArchive) && (
          <IconButton
            color='secondary'
            dataTest={ThreadActionsDataTest.undoTrashIcon}
            icon={Icon.MoveMailbox}
            onClick={(e) => {
              e.stopPropagation();
              // undo trash or archive
              void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
            }}
            tooltip={{ title: 'Move to inbox', shortcut: 'Z' }}
          />
        )}
        <Separator />
        {isSkiffSender !== undefined && (
          <Tooltip label={isSkiffSender ? 'Thread is end-to-end encrypted' : 'Thread is encrypted'}>
            <LockContainer $isSkiffSender={isSkiffSender}>
              <Icons
                color={isSkiffSender ? 'green' : 'primary'}
                icon={isSkiffSender ? Icon.ShieldCheck : Icon.Lock}
                size='small'
              />
            </LockContainer>
          </Tooltip>
        )}
      </Toolbar>
      <ReplyActions>
        <IconButton icon={Icon.Reply} onClick={reply} size='small' tooltip='Reply' type='filled' />
        <IconButton
          color='secondary'
          icon={Icon.ReplyAll}
          onClick={replyAll}
          size='small'
          tooltip='Reply all'
          type='filled'
        />
        <IconButton
          color='secondary'
          icon={Icon.ForwardEmail}
          onClick={forward}
          size='small'
          tooltip='Forward'
          type='filled'
        />
      </ReplyActions>
    </ThreadToolbar>
  );
};
