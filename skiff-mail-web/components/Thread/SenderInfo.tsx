import { Typography, Icon, IconButton, Icons } from 'nightwatch-ui';
import { useCallback } from 'react';
import { UserAvatar, useToast, copyToClipboardWebAndMobile } from 'skiff-front-utils';
import { DisplayPictureData } from 'skiff-graphql';
import styled from 'styled-components';

import { isSkiffAddress } from '../../utils/userUtils';
const Container = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 18px;
  padding: 0 4px;
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const AlignRight = styled.div`
  margin-left: auto;
`;

const Background = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: absolute;
  transform: translate(50%, 50%);
  bottom: 0;
  right: 0;
  background-color: var(--bg-l3-solid);
  z-index: 99;
`;

const ShieldContainer = styled.div<{ $disabled: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: ${(props) => (!props.$disabled ? '#30a55033' : 'rgba(0,0,0,0.06)')};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  border: 1px solid var(--bg-l3-solid);
  transform: translate(50%, 50%);
  bottom: 0;
  right: 0;
  z-index: 999;
`;

interface SenderInfoProps {
  emailAlias: string;
  displayName: string;
  displayPicturData: DisplayPictureData;
}

export const SenderInfo = ({ emailAlias, displayName, displayPicturData }: SenderInfoProps) => {
  const { enqueueToast } = useToast();
  const isSecured = isSkiffAddress(emailAlias);

  const copyToClipboard = useCallback(() => {
    copyToClipboardWebAndMobile(emailAlias);
    enqueueToast({
      body: `Email alias copied.`,
      icon: Icon.Copy
    });
  }, [emailAlias, enqueueToast]);

  return (
    <Container>
      <AvatarContainer>
        <UserAvatar
          displayPictureData={displayPicturData}
          label={displayName}
          style={{ width: '30px', height: '30px' }}
        />
        {isSecured && (
          <>
            <Background />
            <ShieldContainer $disabled={false}>
              <Icons color='green' icon={Icon.ShieldCheck} size='xsmall' />
            </ShieldContainer>
          </>
        )}
        {!isSecured && (
          <>
            <Background />
            <ShieldContainer $disabled={true}>
              <Icons disabled icon={Icon.Lock} size='xsmall' />
            </ShieldContainer>
          </>
        )}
      </AvatarContainer>
      <NameContainer>
        <Typography type='heading'>{displayName}</Typography>
        <Typography color='disabled' level={3}>
          {emailAlias}
        </Typography>
      </NameContainer>
      <AlignRight>
        <IconButton color='disabled' icon={Icon.Copy} onClick={copyToClipboard} />
      </AlignRight>
    </Container>
  );
};
