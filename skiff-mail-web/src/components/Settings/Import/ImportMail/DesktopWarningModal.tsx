import {
  Alignment,
  Button,
  Dialog,
  Icon,
  Icons,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { mailIcon } from 'skiff-front-utils';
import styled from 'styled-components';

const ILLUSTRATION_HEIGHT = 40;

const ButtonGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
`;

const IllustrationAndHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 12px;
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

export interface DesktopWarningModalModalProps {
  open: boolean;
  onClose: () => void;
  actionLabel: string;
  providerLabel: string;
  providerIcon: Icon;
}

export const DesktopWarningModal: React.FC<DesktopWarningModalModalProps> = ({
  open,
  onClose,
  actionLabel,
  providerLabel,
  providerIcon
}: DesktopWarningModalModalProps) => {
  return (
    <Dialog customContent hideCloseButton onClose={onClose} open={open} size={Size.MEDIUM}>
      <IllustrationAndHeader>
        <IllustrationContainer>
          <ExternalProviderIconContainer>
            <Icons color='source' icon={providerIcon} size={28} />
          </ExternalProviderIconContainer>
          <Icons color='disabled' icon={Icon.ArrowRight} size={Size.X_MEDIUM} />
          <MailIconContainer src={mailIcon} />
        </IllustrationContainer>
        <Header>
          <Typography align={Alignment.CENTER} size={TypographySize.H4} weight={TypographyWeight.MEDIUM} wrap>
            {actionLabel}
          </Typography>
          <Typography align={Alignment.CENTER} color='secondary' wrap>
            Access Skiff Mail through a web browser to import {providerLabel} messages.
          </Typography>
        </Header>
      </IllustrationAndHeader>
      <ButtonGroup>
        <Button
          fullWidth
          onClick={() => {
            onClose();
          }}
        >
          Close
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
