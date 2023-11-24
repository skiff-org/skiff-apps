import { Icon, Icons, Typography, TypographyProps } from 'nightwatch-ui';
import React from 'react';
import { ForwardedRef } from 'react';
import styled from 'styled-components';

const SenderDisplayNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

interface SenderDisplayNameProps extends TypographyProps {
  notificationsMuted?: boolean;
  isVerified?: boolean;
  isSilenced?: boolean;
}

const SenderDisplayName = (
  { children, isVerified, isSilenced, notificationsMuted, ...typographyProps }: SenderDisplayNameProps,
  ref: ForwardedRef<HTMLDivElement>
) => (
  <SenderDisplayNameContainer ref={ref}>
    <Typography {...typographyProps}>{children}</Typography>
    {isVerified && <Icons color='link' icon={Icon.VerifiedCheck} size={20} tooltip='Skiff official' tooltipDelay={0} />}
    {isSilenced && <Icons color='disabled' icon={Icon.SoundSlash} tooltip='Silenced sender' />}
    {notificationsMuted && <Icons color='disabled' icon={Icon.BellSlash} tooltip='Notifications turned off' />}
  </SenderDisplayNameContainer>
);

export default React.forwardRef<HTMLDivElement, SenderDisplayNameProps>(SenderDisplayName);
