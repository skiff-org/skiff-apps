import { Icon, Icons, Size, ThemeMode, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import React, { FC, useEffect, useRef } from 'react';
import { DisplayPictureData } from 'skiff-graphql';
import styled from 'styled-components';

import { copyToClipboardWebAndMobile } from '../../utils';

import UserAvatar from './UserAvatar';

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const ActionItem = styled.div`
  transition: background 0.3s;
  &:active {
    background: var(--bg-cell-active);
  }
`;

const ActionLabel = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 200px;
  column-gap: 6px;
`;

const DisplayNameContainer = styled.div`
  padding: 4px 0px;
`;

const animateProfileSectionFadeOutOnScroll = (
  profileSectionElement: HTMLElement | null,
  progress: number,
  transition = 50
) => {
  if (!profileSectionElement) return;

  profileSectionElement.style.transform = `scale(calc(1 - ${progress}))`;
  profileSectionElement.style.opacity = `${1 - progress}`;
  profileSectionElement.style.transition = `${transition}ms`;
};

export interface MobileAvatarProps {
  onCopy: () => void;
  displayName: string;
  theme: ThemeMode;
  displayPictureData?: DisplayPictureData | null;
  userFullAddress: string;
  username: string;
  scrollContainerID: string;
}

const MobileAvatar: FC<MobileAvatarProps> = ({
  onCopy,
  displayName,
  displayPictureData,
  userFullAddress,
  theme,
  username,
  scrollContainerID
}) => {
  const avatarRef = useRef<HTMLDivElement>(null);

  const copyText = (e: React.MouseEvent) => {
    e?.stopPropagation();
    copyToClipboardWebAndMobile(userFullAddress);
    onCopy();
  };

  const profileScrollAniamtionListener = (event: any) => {
    if (!event || !avatarRef.current) return;
    const { scrollTop } = event.target;
    const profileSectionHeight = avatarRef.current.scrollHeight * 2;

    const progress = Math.max(Math.min(scrollTop / profileSectionHeight, 1), 0);
    animateProfileSectionFadeOutOnScroll(avatarRef.current, progress);
  };

  useEffect(() => {
    const settingsPaper = document.getElementById(scrollContainerID);
    if (!settingsPaper) return;

    settingsPaper.addEventListener('scroll', profileScrollAniamtionListener);

    return () => settingsPaper.removeEventListener('scroll', profileScrollAniamtionListener);
  }, []);

  return (
    <ProfileSection>
      <AvatarWrapper ref={avatarRef}>
        <UserAvatar
          displayPictureData={displayPictureData}
          forceTheme={theme}
          label={username}
          rounded
          size={Size.X_LARGE}
        />
      </AvatarWrapper>
      <DisplayNameContainer>
        <Typography
          mono
          uppercase
          dataTest='settings-drawer-display-name'
          selectable={false}
          size={TypographySize.H4}
          weight={TypographyWeight.BOLD}
        >
          {displayName}
        </Typography>
      </DisplayNameContainer>
      <ActionItem onClick={copyText}>
        <ActionLabel>
          <Typography
            mono
            uppercase
            color='secondary'
            dataTest='settings-drawer-full-address'
            forceTheme={theme}
            selectable={false}
          >
            {userFullAddress}
          </Typography>
          <Icons color='secondary' forceTheme={theme} icon={Icon.Copy} size={Size.SMALL} />
        </ActionLabel>
      </ActionItem>
    </ProfileSection>
  );
};

export default MobileAvatar;
