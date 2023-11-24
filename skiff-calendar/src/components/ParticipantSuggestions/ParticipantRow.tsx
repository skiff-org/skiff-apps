import {
  AccentColor,
  Color,
  Dropdown,
  DropdownItem,
  Icon,
  Icons,
  Size,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Typography,
  TypographySize,
  TypographyWeight,
  colors
} from 'nightwatch-ui';
import { RefObject, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { BrowserDesktopView, UserAvatar, useTheme } from 'skiff-front-utils';
import { AttendeePermission, AttendeeStatus } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { PARTICIPANT_OPTION_DROPDOWN } from '../../constants/calendar.constants';
import { EventAttendee } from '../../storage/models/event/types';

import { ParticipantRowAction } from './ParticipantsSuggestions.types';

const Container = styled.div<{ $inAutoComplete: boolean }>`
  display: flex;
  gap: 8px;
  text-overflow: ellipsis;
  overflow: hidden;
  align-items: center;
  padding: 2px 8px;
  height: 32px;

  ${({ $inAutoComplete }) =>
    $inAutoComplete &&
    css`
      padding: ${isMobile ? '12px 8px' : '0px 8px'};
      height: 32px;
    `}

  &:not(:last-child) {
    margin-bottom: 4px !important;
  }
`;

const TextContainer = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  text-overflow: ellipsis;
  overflow-x: hidden;
  ${(props) =>
    props.$fullWidth &&
    css`
      width: 100%;
    `}
`;

const MoreButton = styled.div`
  margin-left: auto;
  cursor: pointer;
`;

const NewTag = styled.div`
  background-color: rgb(${colors['--orange-500']});
  color: var(--text-always-white) !important;
  border-radius: 4px;
  text-transform: uppercase;
  padding: 2px 4px;
  box-sizing: border-box;
`;

const LineThroughText = styled.div<{ $isLineThough: boolean }>`
  ${(props) =>
    props.$isLineThough &&
    css`
      text-decoration: line-through;
    `}
`;

const RowContainer = styled.div<{ $isInline: boolean }>`
  ${(props) =>
    props.$isInline &&
    css`
      flex-direction: row;
      display: flex;
      gap: 4px;
    `}
`;

export enum AttendeeState {
  New,
  Existing,
  Removed
}
export enum ParticipantRowType {
  IsCompact,
  IsInline,
  ShowEmailTooltip
}

interface ParticipantRowProps {
  participant: EventAttendee;
  participantRowType: ParticipantRowType;
  actions?: ParticipantRowAction[];
  isCurrentUser?: boolean;
  isSelected?: boolean;
  isReadOnly?: boolean;
  // Used to show new / deleted participant in the saveDraftModal
  attendeeState?: AttendeeState;
  // Only passed for mobile
  onParticipantClick?: (participantID: string) => void;
  inAutoComplete?: boolean;
  containerRef?: RefObject<HTMLDivElement>;
}

export const ParticipantRow = ({
  participant,
  participantRowType,
  actions = [],
  isCurrentUser,
  isSelected,
  isReadOnly,
  attendeeState = AttendeeState.Existing,
  onParticipantClick,
  inAutoComplete,
  containerRef
}: ParticipantRowProps) => {
  const { theme } = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);

  const moreButtonRef = useRef<HTMLDivElement>(null);

  const { displayName, email, attendeeStatus, optional, permission } = participant;

  const participantName = displayName || email;
  const isOwner = permission === AttendeePermission.Owner;

  const setSelectedHover = (newState: boolean) => {
    // should only show hover when the participant is selected (not in the autocomplete paper)
    setIsHovering(!!isSelected && newState);
  };

  const getBadgeStatusColorAndIcon = (status: AttendeeStatus): { color: AccentColor; icon: Icon } | undefined => {
    switch (status) {
      case AttendeeStatus.Yes:
        return { color: 'green', icon: Icon.Check };
      case AttendeeStatus.Maybe:
        return { color: `yellow`, icon: Icon.Minus };
      case AttendeeStatus.No:
        return { color: 'red', icon: Icon.Close };
      default:
        return undefined;
    }
  };

  const renderSubtext = !!optional || isOwner;

  const getOptionalText = () => (isOwner ? ' (optional)' : 'Optional');

  const forceTheme = inAutoComplete && !isMobile ? ThemeMode.DARK : theme;
  const showMoreButton = isHovering || isActionsDropdownOpen || !!onParticipantClick;

  const { color: badgeColor, icon: badgeIcon } = getBadgeStatusColorAndIcon(attendeeStatus) || {};

  const renderParticipantName = (participantNameOrEmail: string, color?: Color) => (
    <Typography
      color={color}
      forceTheme={forceTheme}
      size={TypographySize.SMALL}
      weight={participantRowType === ParticipantRowType.IsCompact ? TypographyWeight.MEDIUM : undefined}
    >
      <LineThroughText $isLineThough={attendeeState === AttendeeState.Removed}>
        {participantNameOrEmail} {isCurrentUser && '(You)'}
      </LineThroughText>
    </Typography>
  );
  return (
    <>
      <Container
        $inAutoComplete={!!inAutoComplete}
        onClick={() => onParticipantClick?.(participant.id)}
        onMouseEnter={() => setSelectedHover(true)}
        onMouseLeave={() => setSelectedHover(false)}
        ref={containerRef}
      >
        <UserAvatar
          badgeColor={badgeColor}
          badgeIcon={badgeIcon}
          badgeSize={8}
          forceTheme={forceTheme}
          label={participantName}
          showBadge={attendeeStatus && attendeeStatus !== AttendeeStatus.Pending}
          size={isMobile && inAutoComplete ? Size.LARGE : Size.SMALL}
        />
        <TextContainer $fullWidth={participantRowType === ParticipantRowType.ShowEmailTooltip}>
          {participantRowType === ParticipantRowType.ShowEmailTooltip && (
            <>
              {participantName === email && <>{renderParticipantName(participantName)}</>}
              {participantName !== email && (
                <Tooltip placement={TooltipPlacement.BOTTOM_START}>
                  <TooltipContent>{email}</TooltipContent>
                  <TooltipTrigger>{renderParticipantName(participantName)}</TooltipTrigger>
                </Tooltip>
              )}
            </>
          )}
          {(participantRowType === ParticipantRowType.IsInline ||
            participantRowType === ParticipantRowType.IsCompact) && (
            <RowContainer $isInline={participantRowType === ParticipantRowType.IsInline}>
              {renderParticipantName(participantName)}
              {participantName !== email &&
                renderParticipantName(
                  email,
                  participantRowType === ParticipantRowType.IsCompact ? 'disabled' : 'secondary'
                )}
            </RowContainer>
          )}
          {isSelected && renderSubtext && (
            <Typography color='disabled' forceTheme={forceTheme} size={TypographySize.CAPTION}>
              <LineThroughText $isLineThough={attendeeState === AttendeeState.Removed}>{`${isOwner ? 'Organizer' : ''}${
                optional ? getOptionalText() : ''
              }`}</LineThroughText>
            </Typography>
          )}
        </TextContainer>
        {!isReadOnly && (
          <MoreButton ref={moreButtonRef}>
            {showMoreButton && (
              <Icons
                color='secondary'
                forceTheme={forceTheme}
                icon={Icon.OverflowH}
                onClick={() =>
                  !!onParticipantClick ? onParticipantClick(participant.id) : setIsActionsDropdownOpen(true)
                }
              />
            )}
          </MoreButton>
        )}
        {attendeeState === AttendeeState.New && isReadOnly && (
          <Typography forceTheme={forceTheme} size={TypographySize.CAPTION} weight={TypographyWeight.MEDIUM}>
            <NewTag>new</NewTag>
          </Typography>
        )}
      </Container>
      <BrowserDesktopView>
        <Dropdown
          buttonRef={moreButtonRef}
          className={PARTICIPANT_OPTION_DROPDOWN}
          portal
          setShowDropdown={setIsActionsDropdownOpen}
          showDropdown={isActionsDropdownOpen}
        >
          {actions.map(({ label, onClick, alert, key }) => (
            <DropdownItem
              color={alert ? 'destructive' : undefined}
              key={key}
              label={label}
              onClick={(e) => {
                void onClick(e); // Call onclick function
                setIsActionsDropdownOpen(false); // Close dropdown
              }}
            />
          ))}
        </Dropdown>
      </BrowserDesktopView>
    </>
  );
};
