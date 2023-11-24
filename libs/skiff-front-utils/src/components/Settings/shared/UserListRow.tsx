import { Color, Icon, Icons, Size, Typography, TypographySize, isValidIcon } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { DisplayPictureData } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { formatName } from '../../../utils';
import Checkbox from '../../Checkbox/Checkbox';
import { UserAvatar } from '../../UserAvatar';

const ListItem = styled.div<{
  $fullHeight?: boolean;
  $isLast?: boolean;
  $hasOnClick: boolean;
  $active: boolean;
  $hover: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  ${(props) => (props.$fullHeight ? 'padding: 0px 16px; height: 100%;' : 'padding: 12px 16px;')}

  border-bottom: ${(props) => (!props.$isLast ? '1px solid var(--border-tertiary)' : '')};

  ${(props) =>
    props.$hover &&
    !props.$active &&
    css`
      background: var(--bg-overlay-quaternary);
    `}

  ${(props) =>
    props.$active &&
    css`
      background: var(--bg-overlay-tertiary);
      :hover {
        background: var(--bg-overlay-tertiary);
      }
    `}


  ${isMobile &&
  css`
    gap: 16px;
    justify-content: space-between;
  `};
  ${!isMobile &&
  css`
    gap: 4px;
  `}

  cursor: ${(props) => (props.$hasOnClick ? 'pointer' : '')};
`;

const UsernameDisplayName = styled.span`
  display: flex;
  flex-direction: column;
  max-width: 75%;

  box-sizing: border-box;
`;

export const AvatarNameContainer = styled.span<{ $width?: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: ${({ $width }) => $width || '100%'};
  height: 100%;
`;

export const UserIconContainer = styled.div<{
  isBackground?: boolean;
  isFullRowHeight?: boolean;
  isPointerCursor?: boolean;
}>`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  ${({ isPointerCursor }) => isPointerCursor && 'cursor: pointer;'}
  ${({ isBackground }) => isBackground && 'background: var(--bg-overlay-secondary);'}
  width: 32px;
  height: ${({ isFullRowHeight }) => (isFullRowHeight ? '100%' : '32px')};
  border-radius: 8px;
`;

interface UserListRowProps {
  active: boolean;
  hover: boolean;
  displayName: string;
  isLast: boolean;
  isSelected?: boolean;
  subtitle?: string;
  subtitleColor?: Color;
  avatarDisplayData?: DisplayPictureData | Icon;
  dataTest?: string;
  onClick?: () => void;
  showCheckbox?: boolean;
  fullHeight?: boolean;
  width?: string;
  toggleSelectedContact?: (isShiftKey: boolean) => void;
}

const UserListRow: React.FC<UserListRowProps> = ({
  active,
  hover,
  displayName,
  isLast,
  isSelected,
  subtitle,
  subtitleColor,
  avatarDisplayData,
  dataTest,
  children,
  showCheckbox,
  fullHeight,
  width,
  onClick,
  toggleSelectedContact
}) => {
  const avatarIsIcon = typeof avatarDisplayData === 'string' && isValidIcon(avatarDisplayData);

  const formattedDisplayName = formatName(displayName);

  const onClickSelectContact = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.stopPropagation();
    if (toggleSelectedContact) {
      toggleSelectedContact(e.shiftKey);
    }
  };

  const AvatarIcon = avatarIsIcon ? (
    <UserIconContainer isBackground>
      <Icons color='secondary' icon={avatarDisplayData} size={Size.X_MEDIUM} />
    </UserIconContainer>
  ) : (
    <UserAvatar color='orange' displayPictureData={avatarDisplayData} label={displayName} size={Size.X_MEDIUM} />
  );

  return (
    <ListItem
      $active={active}
      $fullHeight={fullHeight}
      $hasOnClick={!!onClick}
      $hover={hover}
      $isLast={isLast}
      data-test={dataTest}
      onClick={onClick}
    >
      <AvatarNameContainer $width={width}>
        {!isMobile && showCheckbox && (
          <UserIconContainer isFullRowHeight isPointerCursor onClick={onClickSelectContact}>
            <Checkbox checked={isSelected} onClick={onClickSelectContact} />
          </UserIconContainer>
        )}
        {AvatarIcon}
        <UsernameDisplayName>
          <Typography>{formattedDisplayName}</Typography>
          {!!subtitle && (
            <Typography color={subtitleColor ?? 'secondary'} size={TypographySize.SMALL}>
              {subtitle}
            </Typography>
          )}
        </UsernameDisplayName>
      </AvatarNameContainer>
      {children}
    </ListItem>
  );
};

export default UserListRow;
