import { Button, Dialog, DialogTypes, ThemeMode, Typography } from 'nightwatch-ui';
import React, { Suspense } from 'react';
import styled from 'styled-components';

const QrCode = React.lazy(() => import('./QrCode'));

interface QrCodeModalProps {
  title: string;
  description: string;
  link: string;
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  buttonProps?: { label: string; onClick: () => void };
  secondaryTextProps?: { label: string; onClick: () => void };
}

const Spacer = styled.div`
  height: 16px;
`;

const ButtonContainer = styled.div`
  width: 100%;
`;

const SecondaryTextContainer = styled.div`
  margin: 4px 0;
  align-self: center;
`;

const QRContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  place-content: center;
  margin-top: 24px;
`;

const QrCodeModal: React.FC<QrCodeModalProps> = ({
  title,
  description,
  link,
  open,
  onClose,
  theme,
  buttonProps,
  secondaryTextProps
}) => {
  return (
    <Dialog
      customContent
      description={description}
      hideCloseButton
      onClose={onClose}
      open={open}
      title={title}
      type={DialogTypes.Promotional}
    >
      <Suspense fallback={null}>
        <QRContainer>
          <QrCode link={link} theme={theme} />
        </QRContainer>
      </Suspense>
      <Spacer />
      {buttonProps && (
        <>
          <ButtonContainer>
            <Button fullWidth onClick={buttonProps.onClick}>
              {buttonProps.label}
            </Button>
          </ButtonContainer>
          {secondaryTextProps && (
            <SecondaryTextContainer>
              <Typography color='secondary' onClick={secondaryTextProps?.onClick}>
                {secondaryTextProps.label}
              </Typography>
            </SecondaryTextContainer>
          )}
        </>
      )}
    </Dialog>
  );
};

export default QrCodeModal;
