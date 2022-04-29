import { Chip, Icon, IconButton, Icons, Typography } from '@skiff-org/skiff-ui';
import React, { ForwardedRef } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { UserLabel } from '../../utils/label';
import { THREAD_HEADER_HEIGHT, THREAD_HEADER_HEIGHT_LABELS } from './constants';
import MobileThreadHeaderTitle from './MobileThreadHeader';

const ThreadHeaderContainer = styled.div<{ height?: number }>`
  display: flex;
  flex-direction: column;
  padding: 24px 24px 12px 24px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-secondary);
  position: absolute;
  @supports (backdrop-filter: blur(72px)) {
    backdrop-filter: blur(72px);
    background: var(--bg-l1-glass);
  }
  @supports (-webkit-backdrop-filter: blur(72px)) {
    -webkit-backdrop-filter: blur(72px);
    background: var(--bg-l1-glass);
  }
  // firefox fallback
  @supports not (backdrop-filter: blur(72px)) {
    background: var(--bg-l1-solid);
  }
  border-radius: 12px 12px 0px 0px;
  z-index: 9999;

  ${isMobile
    ? `
    padding: 6px 24px 12px 24px;
    gap: 12px;
    height: fit-content;
    width: 100%;
    `
    : 'width: 678px;'}
  ${(props) => {
    if (props.height && isMobile) {
      return `height: ${props.height}px;`;
    }
  }}
`;

const LabelsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ThreadTitleContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
`;

type ThreadHeaderProps = {
  onClose: () => void;
  text?: string | null; // GraphQL
  isExpanded?: boolean;
  onExpand?: () => void;
  userLabels?: Array<UserLabel>;
  onClick?: () => void;
};

const ThreadHeader = (
  { onClose, isExpanded, onExpand, text, userLabels, onClick }: ThreadHeaderProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const hasUserLabels = userLabels && userLabels.length > 0;

  return (
    <ThreadHeaderContainer
      height={isMobile && hasUserLabels ? THREAD_HEADER_HEIGHT_LABELS : THREAD_HEADER_HEIGHT}
      onClick={onClick}
      ref={ref}
    >
      {!isMobile ? (
        <ThreadTitleContainer>
          <Typography level={0}>{text}</Typography>
          <HeaderButtonsGroup>
            {onExpand && (
              <IconButton
                icon={isExpanded ? Icon.CollapseV : Icon.ExpandV}
                onClick={onExpand}
                tooltip={isExpanded ? 'Collapse' : 'Expand'}
              />
            )}
            <IconButton dataTest='bottom-drawer-close-button' icon={Icon.Close} onClick={onClose} tooltip='Close' />
          </HeaderButtonsGroup>
        </ThreadTitleContainer>
      ) : (
        <MobileThreadHeaderTitle hasUserLabels={hasUserLabels} onClose={onClose} text={text} />
      )}
      {userLabels && (
        <LabelsContainer>
          {userLabels.map((userLabel) => (
            <Chip
              key={userLabel.value}
              label={userLabel.name}
              startIcon={<Icons color={userLabel.color} icon={Icon.Dot} />}
              type='tag'
            />
          ))}
        </LabelsContainer>
      )}
    </ThreadHeaderContainer>
  );
};

export default React.forwardRef<HTMLDivElement, ThreadHeaderProps>(ThreadHeader);
