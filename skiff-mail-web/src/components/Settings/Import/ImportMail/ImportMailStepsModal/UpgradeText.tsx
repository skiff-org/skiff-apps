import { Typography, TypographySize } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

const UpgradeTextContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  ${isMobile &&
  css`
    gap: 4px;
    flex-direction: column;
    align-items: flex-start;
  `}
`;

const Description = styled(Typography)`
  font-variant-numeric: tabular-nums;
`;

interface UpgradeTextProps {
  text: string;
  openUpgradeModal: () => void;
}

export const UpgradeText: React.FC<UpgradeTextProps> = ({ text, openUpgradeModal }: UpgradeTextProps) => {
  return (
    <UpgradeTextContainer>
      <Description color='disabled' size={TypographySize.SMALL}>
        {text}
      </Description>
      <Typography color='link' onClick={openUpgradeModal} size={TypographySize.SMALL}>
        Upgrade for more
      </Typography>
    </UpgradeTextContainer>
  );
};
