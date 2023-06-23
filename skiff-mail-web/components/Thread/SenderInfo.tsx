import {
  Typography,
  Icon,
  IconButton,
  Icons,
  Size,
  ThemeMode,
  TypographyWeight,
  TypographySize
} from '@skiff-org/skiff-ui';
import { useCallback } from 'react';
import { UserAvatar, useToast, copyToClipboardWebAndMobile } from 'skiff-front-utils';
import { DisplayPictureData } from 'skiff-graphql';
import { isSkiffAddress } from 'skiff-utils';
import styled from 'styled-components';

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

const Background = styled.div<{ $forceTheme?: ThemeMode }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: absolute;
  transform: translate(50%, 50%);
  bottom: 0;
  right: 0;
  background-color: ${(props) => (props.$forceTheme === ThemeMode.DARK ? '#242424' : 'var(--bg-l3-solid)')};

  z-index: 99;
`;

const ShieldContainer = styled.div<{ $disabled: boolean; $forceTheme?: ThemeMode }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: ${(props) =>
    !props.$disabled
      ? '#30a55033'
      : props.$forceTheme === ThemeMode.DARK
      ? 'rgba(255,255,255,0.06)'
      : 'rgba(0,0,0,0.06)'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  border: 1px solid ${(props) => (props.$forceTheme === ThemeMode.DARK ? '#242424' : 'var(--bg-l3-solid)')};
  transform: translate(50%, 50%);
  bottom: 0;
  right: 0;
  z-index: 999;
`;

interface SenderInfoProps {
  emailAlias: string;
  displayName: string;
  displayPictureData: DisplayPictureData;
  forceTheme?: ThemeMode;
}

export const SenderInfo = ({ emailAlias, displayName, displayPictureData, forceTheme }: SenderInfoProps) => {
  const { enqueueToast } = useToast();
  const isSecured = isSkiffAddress(emailAlias);

  const copyToClipboard = useCallback(() => {
    copyToClipboardWebAndMobile(emailAlias);
    enqueueToast({
      title: 'Email alias copied',
      body: `${emailAlias} is now in your clipboard.`
    });
  }, [emailAlias, enqueueToast]);

  return (
    <Container>
      <AvatarContainer>
        <UserAvatar
          displayPictureData={displayPictureData}
          forceTheme={forceTheme}
          label={displayName}
          style={{ width: '30px', height: '30px' }}
        />
        {isSecured && (
          <>
            <Background $forceTheme={forceTheme} />
            <ShieldContainer $disabled={false} $forceTheme={forceTheme}>
              <Icons color='green' forceTheme={forceTheme} icon={Icon.ShieldCheck} size={Size.X_SMALL} />
            </ShieldContainer>
          </>
        )}
        {!isSecured && (
          <>
            <Background $forceTheme={forceTheme} />
            <ShieldContainer $disabled={true} $forceTheme={forceTheme}>
              <Icons disabled forceTheme={forceTheme} icon={Icon.Lock} size={Size.X_SMALL} />
            </ShieldContainer>
          </>
        )}
      </AvatarContainer>
      <NameContainer>
        <Typography forceTheme={forceTheme} weight={TypographyWeight.BOLD}>
          {displayName}
        </Typography>
        <Typography color='disabled' forceTheme={forceTheme} size={TypographySize.SMALL}>
          {emailAlias}
        </Typography>
      </NameContainer>
      <AlignRight>
        <IconButton forceTheme={forceTheme} icon={Icon.Copy} iconColor='disabled' onClick={copyToClipboard} />
      </AlignRight>
    </Container>
  );
};
