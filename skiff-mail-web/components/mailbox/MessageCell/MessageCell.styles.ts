import { themeNames, CorrectedColorSelect, ThemeMode } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { MULT_SELECT_TRANSITION_DURATION, swipeTransition } from './constants';
import { getMultiSelectCellTransition } from './utils';

export const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  height: 24px;
  gap: 6px;
  margin-right: -6px;
`;

export const EmailInfo = styled.div`
  display: flex;
  order: 3;
  margin-left: auto;
  align-items: center;
  gap: 16px;

  ${isMobile
    ? `
      grid-column: 3;
      grid-row: 1;
      margin-top: 4px;
    `
    : undefined}
`;

export const AnimatedCheckbox = styled.div<{ show: boolean }>`
  position: absolute;
  ${isMobile
    ? `
      margin-left: 18px;
      margin-top: 18px;
    `
    : ''}
  ${(props) => {
    // Open
    if (props.show) {
      return `
        transition: ${MULT_SELECT_TRANSITION_DURATION / 2 + 'ms'};
        transform: translateX(0);
        opacity: 1;
      `;
    }
    // Close
    return `
    transition: ${MULT_SELECT_TRANSITION_DURATION / 4 + 'ms'};
        transform: translateX(-100%);
        opacity: 0; width: 0px;
    `;
  }}
`;

export const MobilePreviewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  z-index: 1;
`;

export const PaperClip = styled.div`
  margin-top: -6px;
  margin-right: -4px;
`;

export const StartBlock = styled.div`
  width: 16vw;
  min-width: 16vw;
  > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0;
`;

export const MobilePreviewRow = styled.div<{ multiSelectOpen: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 0px;
  gap: 24px;
  box-sizing: border-box;
  width: 100%;
  max-width: calc(100vw - ${(props) => (props.multiSelectOpen ? '136px' : '96px')});
  justify-content: space-between;
`;

export const MobileRightActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
`;

export const NumThreadBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;

  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  background: var(--bg-field-default);
  justify-content: center;
  border-radius: 8px;
`;

export const MessageCellContainer = styled.div<{
  active: boolean;
  hover: boolean;
  read: boolean;
  isDarkMode: boolean;
}>`
  display: flex;
  align-items: center;
  height: 56px;
  padding: 12px 20px;
  box-sizing: border-box;
  flex-wrap: nowrap;
  // TODO DARK MODE
  border-bottom: 1px solid var(--border-tertiary);

  & ${ActionsContainer} {
    opacity: 0;
  }
  & ${EmailInfo} {
    display: inherit;
  }
  // active
  ${(props) =>
    props.active &&
    css`
      background: var(--border-tertiary) !important;
    `}
  // unread
  ${(props) =>
    !props.read &&
    css`
      background: ${props.isDarkMode ? 'var(--bg-l3-solid)' : 'var(--bg-l2-solid)'};
    `}
  // read
  ${(props) =>
    props.hover &&
    props.read &&
    css`
      background: var(--border-tertiary);
    `}
  ${(props) =>
    props.hover &&
    css`
      cursor: pointer;
      & ${ActionsContainer} {
        opacity: 1;
        pointer-events: default;
      }
    `}
  ${(props) =>
    props.hover &&
    !props.read &&
    css`
      border-bottom: 1px solid var(--border-primary);
    `}
`;

export const EmailContentTop = styled.div<{ $hide?: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  place-content: flex-end;
  display: ${(props) => (props.$hide ? 'none' : '')};
`;

export const EmailContent = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  margin: -2px 0px;
  min-width: 0px;
  margin-right: 16px;
  align-items: center;
  overflow: hidden;
`;

export const LabelsContainer = styled.div<{ $hide?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  display: ${(props) => (props.$hide ? 'none' : '')};
`;

export const UnreadIndicatorWrapper = styled.div`
  width: 10px;
  height: 8px;
  margin-left: 4px;
`;

export const UnreadMobileIndicatorWrapper = styled.div`
  margin: 0px 4px;
`;

export const AvatarContainer = styled.div<{ hide: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 42px;
  flex-shrink: 0;
  cursor: pointer;
  visibility: ${(props) => (props.hide ? 'hidden' : 'visible')};
`;

export const UnreadIndicator = styled.div<{
  $read: boolean;
  $cellTransition: boolean;
  $forceTheme?: ThemeMode;
}>`
  width: 8px;
  height: 8px;
  background: rgb(
    ${(props) =>
      !!props.$forceTheme && props.$forceTheme === ThemeMode.DARK
        ? themeNames.dark['--orange-500']
        : themeNames.light['--orange-500']}
  );
  border-radius: 24px;
  flex-shrink: 0;
  opacity: ${(props) => (props.$read ? 0 : 1)};
  ${(props) => (!isMobile ? getMultiSelectCellTransition(props.$cellTransition) : undefined)};
`;

export const EmailSender = styled.div<{ isCompact?: boolean }>`
  display: flex;
  ${isMobile
    ? `
      width: 100%;
      margin: 0 0px;
    `
    : '  width: 100%'}
`;

export const MobileMessageCellContainer = styled.div<{ multiSelectOpen?: boolean; read: boolean; isDarkMode: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-tertiary);
  gap: 16px;
  height: 100%;
  ${(props) =>
    !props.read &&
    css`
      background: ${props.isDarkMode ? 'var(--bg-l3-solid)' : 'var(--bg-l2-solid)'};
    `}
  ${(props) =>
    props.multiSelectOpen &&
    css`
      margin-left: auto;
      padding: 12px 18px 12px 32px;
      width: 94%;
    `}
  user-select: none;
`;

export const MobileCheckBoxWrapper = styled.div<{ read: boolean; isDarkMode: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;
  height: 100%;
  align-items: flex-start;
  ${(props) =>
    !props.read &&
    css`
      background: ${props.isDarkMode ? 'var(--bg-l3-solid)' : 'var(--bg-l2-solid)'};
    `}
  &.hasTransition {
    transition: ${swipeTransition};
  }
`;

export const MobileAvatarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 4px;
`;

export const ContentPreview = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const EmailBlock = styled.div<{ isCompact?: boolean; transition: boolean }>`
  display: flex;
  width: 100%;
  gap: ${(props) => (props.isCompact ? '0px' : '12px')};
  ${isMobile
    ? `
      align-items: flex-start;
    `
    : 'align-items: center;'}
  overflow: hidden;
  flex-direction: ${(props) => (props.isCompact ? 'column' : 'row')};

  ${(props) => getMultiSelectCellTransition(props.transition)}
`;

export const EmailSubjectAndBody = styled.div<{ isMobile?: boolean }>`
  display: flex;
  overflow: hidden;
  flex-direction: ${(props) => (props.isMobile ? 'column' : 'row')};
`;

export interface SwipeBoxProps {
  $forceColor: keyof typeof CorrectedColorSelect;
}

export const MobileLeftSwipeBox = styled.div<SwipeBoxProps>`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: center;
  height: 100%;
  position: absolute;
  left: 0;
  background: ${(props) => props.$forceColor};
  flex: 0;
  z-index: -1;
  overflow: hidden;
  width: 100%;
  padding-right: 30px;
  box-sizing: border-box;
`;

export const MobileRightSwipeBox = styled.div<SwipeBoxProps>`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  height: 100%;
  width: 100%;
  right: 0;
  position: absolute;
  flex: 0;
  background: ${(props) => props.$forceColor};
  z-index: 1;
  overflow: hidden;
  padding-left: 30px;
  box-sizing: border-box;
`;

export const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
`;

export const LargeIconTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
