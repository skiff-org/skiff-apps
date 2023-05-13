import { Chip, Icon, IconText, Icons, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { ForwardedRef, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled, { css } from 'styled-components';

import { useDate } from '../../hooks/useDate';
import { skemailHotKeysReducer } from '../../redux/reducers/hotkeysReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { UserLabelAlias, UserLabelPlain } from '../../utils/label';
import { LinkedLabelChips } from '../labels/LinkedLabelChips';
import { MoveToLabelDropdown } from '../labels/MoveToLabelDropdown';
import { THREAD_HEADER_BACKGROUND_ID } from '../mailbox/consts';

import MobileThreadHeaderTitle from './MobileThreadHeader';
import { ThreadNavigationIDs } from './Thread.types';
import { ThreadActions } from './ThreadActions/ThreadActions';

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
  padding: 12px 16px;
  box-sizing: border-box;
  min-height: 56px;
`;

const TitleChip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 998;
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
  text?: string | null; // GraphQL
  isExpanded?: boolean;
  onExpand?: () => void;
  userLabels?: Array<UserLabelPlain | UserLabelAlias>;
  onClick?: () => void;
  isSkiffSender?: boolean;
  threadBodyRef?: React.RefObject<HTMLDivElement>;
  threadId: string;
  scheduledSendAt?: Date;
  // defined if component is keeping track of the active thread and email itself instead of using route params
  setActiveThreadAndEmail?: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  nextThreadAndEmail?: ThreadNavigationIDs;
  prevThreadAndEmail?: ThreadNavigationIDs;
  loading?: boolean;
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
    scheduledSendAt,
    setActiveThreadAndEmail,
    currentLabel,
    nextThreadAndEmail,
    prevThreadAndEmail,
    emailRefs,
    loading
  }: ThreadHeaderProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const { getTimeAndDate } = useDate();
  const activeThread = useGetCachedThreads([threadId])[0];
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [labelsDropdown, setLabelsDropdown] = useState(false);
  const setHeaderLabelsDropdown = (open?: boolean) => {
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen(open));
  };

  // make sure only one label drodpown open at a time
  useEffect(() => {
    if (labelsDropdown) {
      setHeaderLabelsDropdown(false);
    }
  }, [labelsDropdown]);

  const hasUserLabels = userLabels && userLabels.length > 0;
  const renderLabels = () => (
    <LabelsContainer hasLabels={hasUserLabels}>
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
      {hasUserLabels && <LinkedLabelChips deletable size={Size.SMALL} threadID={threadId} userLabels={userLabels} />}
      {scheduledSendAt && (
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
          label={`Scheduled - ${getTimeAndDate(scheduledSendAt)}`}
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
            loading={loading}
            nextThreadAndEmail={nextThreadAndEmail}
            onClose={onClose}
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
                  filled
                  onClick={onExpand}
                  size={Size.SMALL}
                  startIcon={isExpanded ? Icon.CollapseV : Icon.ExpandV}
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
