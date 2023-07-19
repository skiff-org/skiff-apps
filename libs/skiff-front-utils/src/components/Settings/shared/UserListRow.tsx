import { Color, Icon, Icons, isValidIcon, Size, Typography, TypographySize } from '@skiff-org/skiff-ui';
import React, { ReactNode } from 'react';
import { isMobile } from 'react-device-detect';
import { DisplayPictureData } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { formatName } from '../../../utils';
import { UserAvatar } from '../../UserAvatar';

const ListItem = styled.div<{ $isLast: boolean; $hasOnClick: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20px 0px;

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
  border-bottom: ${(props) => (!props.$isLast ? '1px solid var(--border-tertiary)' : '')};
`;

const UsernameDisplayName = styled.span`
  display: flex;
  flex-direction: column;
  max-width: 75%;

  box-sizing: border-box;
`;

const AvatarName = styled.span`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 50%;
  ${isMobile &&
  css`
    width: 100%;
  `};
  ${!isMobile &&
  css`
    width: 50%;
  `}
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background: var(--bg-overlay-secondary);
  width: 32px;
  height: 32px;
  border-radius: 8px;
`;

interface UserListRowProps {
  displayName: string;
  isLast: boolean;
  subtitle?: string;
  subtitleColor?: Color;
  avatarDisplayData?: DisplayPictureData | Icon;
  dataTest?: string;
  onClick?: () => void;
  setIsHovering?: (isHovering: boolean) => void;
  children?: ReactNode;
}

const UserListRow: React.FC<UserListRowProps> = ({
  displayName,
  isLast,
  subtitle,
  subtitleColor,
  avatarDisplayData,
  dataTest,
  children,
  onClick,
  setIsHovering
}) => {
  const avatarIsIcon = typeof avatarDisplayData === 'string' && isValidIcon(avatarDisplayData);

  const formattedDisplayName = formatName(displayName);

  return (
    <ListItem
      $hasOnClick={!!onClick}
      $isLast={isLast}
      data-test={dataTest}
      onClick={onClick}
      onMouseOut={setIsHovering ? () => setIsHovering(false) : undefined}
      onMouseOver={setIsHovering ? () => setIsHovering(true) : undefined}
    >
      <AvatarName>
        {avatarIsIcon && (
          <IconContainer>
            <Icons color='secondary' icon={avatarDisplayData} size={Size.X_MEDIUM} />
          </IconContainer>
        )}
        {!avatarIsIcon && (
          <UserAvatar displayPictureData={avatarDisplayData} label={displayName} size={Size.X_MEDIUM} />
        )}
        <UsernameDisplayName>
          <Typography mono uppercase>
            {formattedDisplayName}
          </Typography>
          {!!subtitle && (
            <Typography mono uppercase color={subtitleColor ?? 'secondary'} size={TypographySize.SMALL}>
              {subtitle}
            </Typography>
          )}
        </UsernameDisplayName>
      </AvatarName>
      {children}
    </ListItem>
  );
};

export default UserListRow;
