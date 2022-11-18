import Link from 'next/link';
import { Chip, Icon, IconButton, Icons, Typography } from 'nightwatch-ui';
import React, { ForwardedRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useDate } from '../../hooks/useDate';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { getUrlFromUserLabelAndThreadID, UserLabel } from '../../utils/label';
import { THREAD_HEADER_BACKGROUND_ID } from '../mailbox/consts';

import MobileThreadHeaderTitle from './MobileThreadHeader';
import { ThreadNavigationIDs } from './Thread.types';
import { ThreadActions } from './ThreadActions/ThreadActions';

const ThreadHeaderContainer = styled.div<{ height?: number }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: absolute;
  background: var(--bg-main-container);
  border-bottom: 1px solid var(--border-tertiary);

  @supports (backdrop-filter: blur(72px)) {
    backdrop-filter: blur(72px);
    background: ${isMobile ? 'var(--bg-l0-glass)' : 'var(--bg-main-container)'} !important;
  }
  @supports (-webkit-backdrop-filter: blur(72px)) {
    -webkit-backdrop-filter: blur(72px);
    background: ${isMobile ? 'var(--bg-l0-glass)' : 'var(--bg-main-container)'} !important;
  }
  z-index: 9;
  width: 100%;
  ${(props) => {
    if (props.height && isMobile) {
      return `height: ${props.height}px;`;
    }
  }}
  ${isMobile
    ? `
    padding: 0px 12px 12px 12px;
    `
    : `
    /* Space on the right of the thread header for the scrollbar */
    width: calc(100% - 9px);
    padding: 16px 15px 0px 24px;
  `}
`;

const LabelsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: -1;
  margin-top: ${!isMobile ? '8px' : undefined};
  margin-bottom: ${!isMobile ? '6px' : undefined};
  padding-left: ${isMobile ? '16px' : undefined};
  overflow-y: hidden;
  ${isMobile ? 'overflow-x: auto;' : ''};
`;

const ThreadTitleContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const TitleChip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 998;
`;

const ThreadTitleActionsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 8px;
  margin-top: -4px;
`;

export const ThreadHeaderDataTest = {
  bottomDrawerCloseButton: 'bottom-drawer-close-button'
};

type ThreadHeaderProps = {
  onClose: () => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  emailRefs: Record<string, React.MutableRefObject<HTMLDivElement | null>>;
  text?: string | null; // GraphQL
  isExpanded?: boolean;
  onExpand?: () => void;
  userLabels?: Array<UserLabel>;
  onClick?: () => void;
  isSkiffSender?: boolean;
  threadBodyRef?: React.RefObject<HTMLDivElement>;
  threadId: string;
  schedualSendAt?: Date;
  // defined if component is keeping track of the active thread and email itself instead of using route params
  setActiveThreadAndEmail?: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  nextThreadAndEmail?: ThreadNavigationIDs;
  prevThreadAndEmail?: ThreadNavigationIDs;
};

const ThreadHeader = (
  {
    onClose,
    isExpanded,
    onExpand,
    text,
    userLabels,
    onClick,
    isSkiffSender,
    threadId,
    threadBodyRef,
    schedualSendAt,
    setActiveThreadAndEmail,
    currentLabel,
    nextThreadAndEmail,
    prevThreadAndEmail,
    emailRefs
  }: ThreadHeaderProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const { getTimeAndDate } = useDate();
  const activeThread = useGetCachedThreads([threadId])[0];

  const dispatch = useDispatch();
  const hasUserLabels = userLabels && userLabels.length > 0;
  const renderLabels = () => (
    <LabelsContainer>
      {hasUserLabels &&
        userLabels.map((userLabel) => {
          const encodedLabelName = encodeURIComponent(userLabel.name.toLowerCase());
          // clicking on the label should
          // - redirect to label inbox on mobile
          // - redirect to label inbox with opened thread on desktop
          const mobileUrl = `/label#${encodedLabelName}`;
          const desktopUrl = getUrlFromUserLabelAndThreadID(userLabel.name, threadId);
          return (
            <Link href={isMobile ? mobileUrl : desktopUrl} key={userLabel.value} passHref>
              <Chip
                key={userLabel.value}
                label={userLabel.name}
                startIcon={<Icons color={userLabel.color} icon={Icon.Dot} />}
              />
            </Link>
          );
        })}
      {schedualSendAt && (
        <Chip
          endIcon={
            <Icons
              icon={Icon.Close}
              onClick={() => {
                if (!activeThread) return;
                dispatch(
                  skemailModalReducer.actions.setOpenModal({ type: ModalType.UnSendMessage, thread: activeThread })
                );
              }}
            />
          }
          key='schedule'
          label={`Scheduled - ${getTimeAndDate(schedualSendAt)}`}
          startIcon={Icon.Clock}
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
            nextThreadAndEmail={nextThreadAndEmail}
            onClose={onClose}
            prevThreadAndEmail={prevThreadAndEmail}
            setActiveThreadAndEmail={setActiveThreadAndEmail}
            threadID={threadId}
          />
          <ThreadTitleContainer>
            <TitleChip>
              <Typography level={0} type='label' wrap>
                {text}
              </Typography>
            </TitleChip>
            <HeaderButtonsGroup>
              {onExpand && (
                <IconButton
                  icon={isExpanded ? Icon.CollapseV : Icon.ExpandV}
                  onClick={onExpand}
                  size='small'
                  tooltip={isExpanded ? 'Collapse' : 'Expand'}
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
    </ThreadHeaderContainer>
  );
};

export default React.forwardRef<HTMLDivElement, ThreadHeaderProps>(ThreadHeader);
