import { FilledVariant, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useState } from 'react';
import styled from 'styled-components';

import { TrustPgpKeyModal } from './TrustPgpKeyModal/TrustPgpKeyModal';

const BannerContainer = styled.div`
  display: flex;
  padding: 12px;
  justify-content: space-between;
  border-radius: 8px;
  background: var(--bg-overlay-quaternary);
  border: 1px solid var(--border-tertiary);
  margin: 12px 16px;
  align-items: center;
`;

interface TrustPgpBannerProps {
  pgpKey: string;
}

export const TrustPgpBanner: React.FC<TrustPgpBannerProps> = ({ pgpKey }: TrustPgpBannerProps) => {
  const [confirmTrustKey, setConfirmTrustKey] = useState(false);

  const onClose = () => setConfirmTrustKey(false);

  return (
    <>
      <BannerContainer>
        <Typography color='secondary' size={TypographySize.SMALL} wrap>
          This message includes an unknown public key for this sender.
        </Typography>
        <IconText
          color='secondary'
          label='Trust key'
          onClick={() => {
            setConfirmTrustKey(true);
          }}
          size={Size.SMALL}
          variant={FilledVariant.FILLED}
          weight={TypographyWeight.REGULAR}
        />
      </BannerContainer>
      <TrustPgpKeyModal onClose={onClose} open={confirmTrustKey} pgpKey={pgpKey} />
    </>
  );
};
