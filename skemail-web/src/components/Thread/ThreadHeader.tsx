import dayjs from 'dayjs';
import uniq from 'lodash/uniq';
import {
  Chip,
  FilledVariant,
  Icon,
  IconText,
  Icons,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { ForwardedRef, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { UnsubscribeInfo, WalletAliasWithName, useGetFF, useLocalSetting, useUserPreference } from 'skiff-front-utils';
import { PgpFlag, StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { skemailHotKeysReducer } from '../../redux/reducers/hotkeysReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { UserLabelAlias, UserLabelPlain, UserLabelQuickAlias } from '../../utils/label';
import { LinkedLabelChips } from '../labels/LinkedLabelChips';
import { MoveToLabelDropdown } from '../labels/MoveToLabelDropdown';
import { THREAD_HEADER_BACKGROUND_ID } from '../mailbox/consts';

import { ConfirmUnsubscribe, openRedirectLink } from './ConfirmUnsubscribe';
import MobileThreadHeaderTitle from './MobileThreadHeader';
import { SilencingBanner } from './SilencingBanner';
import { ThreadNavigationIDs } from './Thread.types';
import { ThreadActions } from './ThreadActions/ThreadActions';
import { TrustPgpBanner } from './TrustPgpBanner';

const ThreadHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: ${isMobile ? 'var(--bg-l3-solid)' : 'var(--bg-main-container)'} !important;
  border-bottom: 1px solid var(--border-tertiary);

  z-index: 9;
  width: 100%;

  ${isMobile
    ? `
    padding: 0px 12px 12px 12px;
    `
    : `
    /* Space on the right of the thread header for the scrollbar */
    width: calc(100% - 9px);

  `}
`;

const LabelsContainer = styled.div<{ hasLabels?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: -1;
  box-sizing: border-box;
  ${(props) =>
    !isMobile &&
    css`
      padding: 0px 16px;
      margin-bottom: ${props.hasLabels ? '12px' : undefined};
    `}
  ${isMobile &&
  css`
    margin-top: 8px;
    padding-left: 16px;
    overflow-x: auto;
  `}
  overflow-y: hidden;
`;

const ThreadTitleContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  border-top: 1px solid var(--border-tertiary);
  padding: 15px 16px; // custom padding to align with message cell when search bar open
  box-sizing: border-box;
  min-height: 56px;
`;

const TitleChip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 998;
  width: 100%;
`;

const ThreadTitleActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const AddButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  aspect-ratio: 1;
  background: var(--bg-overlay-tertiary);
  border-radius: 100px;
  cursor: pointer;
  :hover {
    background: var(--bg-overlay-secondary);
  }
`;

export const ThreadHeaderDataTest = {
  bottomDrawerCloseButton: 'bottom-drawer-close-button'
};

type ThreadHeaderProps = {
  onClose: () => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  emailRefs: Record<string, React.MutableRefObject<HTMLDivElement | null>>;
  walletAliasesWithName: WalletAliasWithName[];
  threadId: string;
  // If applicable to the thread, the unsubscribe data including the mailto or redirect links
  unsubscribeInfo: UnsubscribeInfo | undefined;
  text?: string | null; // GraphQL
  isExpanded?: boolean;
  onExpand?: () => void;
  attachedPublicKey?: string;
  userLabels?: Array<UserLabelPlain | UserLabelAlias | UserLabelQuickAlias>;
  onClick?: () => void;
  isSkiffSender?: boolean;
  threadBodyRef?: React.RefObject<HTMLDivElement>;
  scheduledSendAt?: Date;
  // defined if component is keeping track of the active thread and email itself instead of using route params
  setActiveThreadAndEmail?: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  nextThreadAndEmail?: ThreadNavigationIDs;
  prevThreadAndEmail?: ThreadNavigationIDs;
  loading?: boolean;
  silenceSuggestion?: {
    numMessages: number;
    senderToSilence: string;
  };
};

const ThreadHeader = (
  {
    onClose,
    isExpanded,
    onExpand,
    text,
    attachedPublicKey,
    userLabels,
    onClick,
    isSkiffSender,
    threadId,
    threadBodyRef,
    scheduledSendAt,
    setActiveThreadAndEmail,
    currentLabel,
    nextThreadAndEmail,
    prevThreadAndEmail,
    emailRefs,
    loading,
    walletAliasesWithName,
    silenceSuggestion,
    unsubscribeInfo
  }: ThreadHeaderProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const activeThread = useGetCachedThreads([threadId])[0];
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const hasPgpFlag = useGetFF<PgpFlag>('pgp');

  const [unsubscribeRedirectOpen, setUnsubscribeRedirectOpen] = useState(false);
  const [labelsDropdown, setLabelsDropdown] = useState(false);
  const setHeaderLabelsDropdown = (open?: boolean) => {
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen(open));
  };

  const [confirmUnsubscribeRedirect] = useUserPreference(StorageTypes.CONFIRM_UNSUBSCRIBE_REDIRECT);

  // All threadIDs in which we do not want to show the silence suggestion, even
  // if the sender is one we suggest you silence. We only hide the suggestion
  // if you have closed the banner.
  const [threadIDsToHideSilencing, setThreadIDsToHideSilencing] = useLocalSetting(
    StorageTypes.THREAD_IDS_TO_HIDE_SILENCE_SUGGESTION
  );

  const showSilenceSuggestion = !isMobile && !threadIDsToHideSilencing.includes(threadId);
  // make sure only one label drodpown open at a time
  useEffect(() => {
    if (labelsDropdown) {
      setHeaderLabelsDropdown(false);
    }
  }, [labelsDropdown]);

  const hasUserLabels = userLabels && userLabels.length > 0;
  const renderLabels = () => (
    <LabelsContainer hasLabels={hasUserLabels || !!scheduledSendAt}>
      {hasUserLabels && (
        <>
          <AddButton onClick={() => setLabelsDropdown(true)} ref={labelDropdownRef}>
            <Icons color='secondary' icon={Icon.Plus} />
          </AddButton>
          <MoveToLabelDropdown
            buttonRef={labelDropdownRef}
            currentSystemLabels={[currentLabel]}
            onClose={() => {
              setLabelsDropdown(false);
            }}
            open={labelsDropdown}
            threadID={threadId}
          />
        </>
      )}
      {hasUserLabels && (
        <LinkedLabelChips
          deletable
          size={Size.SMALL}
          threadID={threadId}
          userLabels={userLabels}
          walletAliasesWithName={walletAliasesWithName}
        />
      )}
      {scheduledSendAt && (
        <Chip
          color='secondary'
          icon={<Icons color='orange' icon={Icon.Clock} />}
          key='schedule'
          label={dayjs(scheduledSendAt).format('ddd, MMM D [at] h:mm A')}
          onDelete={() => {
            if (!activeThread) return;
            dispatch(
              skemailModalReducer.actions.setOpenModal({
                type: ModalType.UnSendMessage,
                // we pass only the ID since 'activeThread' doesn't have the message body;
                // and UnSendMessage will retrieve full thread from the ID
                threadID: activeThread.threadID
              })
            );
          }}
          size={Size.SMALL}
          variant={FilledVariant.UNFILLED}
        />
      )}
    </LabelsContainer>
  );

  return (
    <ThreadHeaderContainer id={THREAD_HEADER_BACKGROUND_ID} onClick={onClick} ref={ref}>
      {!isMobile ? (
        <ThreadTitleActionsContainer>
          <ThreadActions
            emailRefs={emailRefs}
            isSkiffSender={isSkiffSender}
            label={currentLabel}
            loading={loading}
            nextThreadAndEmail={nextThreadAndEmail}
            onClose={onClose}
            onUnsubscribe={
              unsubscribeInfo
                ? () => {
                    // If there is an http redirect link, check to see if we should open
                    // the confirm modal or not. If not, open the redirect link automatically.
                    if (unsubscribeInfo.links.httpLink) {
                      if (confirmUnsubscribeRedirect) {
                        setUnsubscribeRedirectOpen(true);
                      } else {
                        openRedirectLink(unsubscribeInfo.links.httpLink);
                      }
                    }
                    // Otherwise, there is a mailto link for unsubscribing, in which we always
                    // prompt to confirm.
                    else {
                      setUnsubscribeRedirectOpen(true);
                    }
                  }
                : undefined
            }
            prevThreadAndEmail={prevThreadAndEmail}
            setActiveThreadAndEmail={setActiveThreadAndEmail}
            threadID={threadId}
          />
          <ThreadTitleContainer>
            <TitleChip>
              <Typography size={TypographySize.H3} weight={TypographyWeight.MEDIUM} wrap>
                {loading ? '' : text}
              </Typography>
            </TitleChip>
            <HeaderButtonsGroup>
              {onExpand && (
                <IconText
                  onClick={onExpand}
                  size={Size.SMALL}
                  startIcon={isExpanded ? Icon.CollapseV : Icon.ExpandV}
                  tooltip={isExpanded ? 'Collapse' : 'Expand'}
                  variant={FilledVariant.FILLED}
                />
              )}
            </HeaderButtonsGroup>
          </ThreadTitleContainer>
        </ThreadTitleActionsContainer>
      ) : (
        <MobileThreadHeaderTitle
          hasUserLabels={hasUserLabels}
          nextThreadID={nextThreadAndEmail?.threadID}
          onClose={onClose}
          prevThreadID={prevThreadAndEmail?.threadID}
          text={text}
          threadBodyRef={threadBodyRef}
        />
      )}
      {renderLabels()}
      {silenceSuggestion && showSilenceSuggestion && (
        <SilencingBanner
          numMessages={silenceSuggestion.numMessages}
          onClose={() => {
            // After you close the banner, do not show the silencing suggestion again on that thread
            setThreadIDsToHideSilencing(uniq([...threadIDsToHideSilencing, threadId]));
          }}
          senderAlias={silenceSuggestion.senderToSilence}
          threadID={threadId}
        />
      )}
      {!!attachedPublicKey && hasPgpFlag && <TrustPgpBanner pgpKey={attachedPublicKey} />}
      {unsubscribeInfo && (
        <ConfirmUnsubscribe
          addressToUnsubFrom={unsubscribeInfo.senderToUnsubscribeFrom}
          onClose={() => {
            setUnsubscribeRedirectOpen(false);
          }}
          open={unsubscribeRedirectOpen}
          recipientAddress={unsubscribeInfo.recipient}
          unsubscribeLinks={unsubscribeInfo.links}
        />
      )}
    </ThreadHeaderContainer>
  );
};

export default React.forwardRef<HTMLDivElement, ThreadHeaderProps>(ThreadHeader);
