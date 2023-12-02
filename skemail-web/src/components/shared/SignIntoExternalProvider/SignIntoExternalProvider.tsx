import {
  Alignment,
  Button,
  Dialog,
  Icon,
  Icons,
  Size,
  ThemeMode,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { Drawer, mailIcon } from 'skiff-front-utils';
import styled from 'styled-components';

const ILLUSTRATION_HEIGHT = 40;

const DrawerContentContainer = styled.div`
  padding: 0 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  ${isMobile && 'padding-top: 12px;'}
`;

const IllustrationAndHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 12px ${isMobile && '0'};
  box-sizing: border-box;
`;

const IllustrationContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  height: ${ILLUSTRATION_HEIGHT}px;
  align-items: center;
  gap: 10px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const ExternalProviderIconContainer = styled.div`
  height: ${ILLUSTRATION_HEIGHT}px;
  width: ${ILLUSTRATION_HEIGHT}px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-l3-solid);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-sizing: border-box;
`;

const MailIconContainer = styled.img`
  height: ${ILLUSTRATION_HEIGHT}px;
  width: ${ILLUSTRATION_HEIGHT}px;
`;

export interface SignIntoExternalProviderModalProps {
  open: boolean;
  onClose: () => void;
  authButton: React.ReactNode;
  actionLabel: string;
  providerLabel: string;
  providerIcon: Icon;
}

export const SignIntoExternalProvider: React.FC<SignIntoExternalProviderModalProps> = ({
  open,
  onClose,
  authButton,
  actionLabel,
  providerLabel,
  providerIcon
}: SignIntoExternalProviderModalProps) => {
  const renderSignInContent = () => (
    <>
      <IllustrationAndHeader>
        {!isMobile && (
          <IllustrationContainer>
            <ExternalProviderIconContainer>
              <Icons color='source' icon={providerIcon} size={28} />
            </ExternalProviderIconContainer>
            <Icons color='disabled' icon={Icon.ArrowRight} size={Size.X_MEDIUM} />
            <MailIconContainer src={mailIcon} />
          </IllustrationContainer>
        )}
        <Header>
          <Typography
            align={Alignment.CENTER}
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            size={TypographySize.H4}
            weight={TypographyWeight.MEDIUM}
            wrap
          >
            {actionLabel}
          </Typography>
          <Typography
            align={Alignment.CENTER}
            color='secondary'
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            size={isMobile ? TypographySize.LARGE : TypographySize.MEDIUM}
            wrap
          >
            You will be directed to sign in with {providerLabel}
          </Typography>
        </Header>
      </IllustrationAndHeader>
      <ButtonGroup>
        {authButton}
        <Button
          forceTheme={isMobile ? ThemeMode.DARK : undefined}
          fullWidth
          onClick={() => void onClose()}
          size={isMobile ? Size.LARGE : undefined}
          type={Type.SECONDARY}
        >
          Cancel
        </Button>
      </ButtonGroup>
    </>
  );

  return isMobile ? (
    <Drawer hideDrawer={() => void onClose()} show={open}>
      <DrawerContentContainer>{renderSignInContent()}</DrawerContentContainer>
    </Drawer>
  ) : (
    <Dialog customContent hideCloseButton onClose={onClose} open={open} size={Size.MEDIUM}>
      {renderSignInContent()}
    </Dialog>
  );
};
