import { Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import pluralize from 'pluralize';
import styled from 'styled-components';

const BannerContainer = styled.div`
  padding: 0 8px 8px 8px;
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  background: var(--accent-red-secondary);
  border-radius: 8px;
  padding: 0 12px;
`;

interface DomainVerificationErrorBannerProps {
  errorCount: number;
  onCTAClick: () => void;
}

const DomainVerificationErrorBanner: React.FC<DomainVerificationErrorBannerProps> = ({
  errorCount,
  onCTAClick
}: DomainVerificationErrorBannerProps) => {
  return (
    <BannerContainer>
      <Banner>
        <Typography
          mono
          uppercase
          color='red'
          size={TypographySize.SMALL}
          weight={TypographyWeight.MEDIUM}
        >{`${errorCount} DNS record ${pluralize('error', errorCount)}`}</Typography>
        <Typography mono uppercase color='red' onClick={onCTAClick} size={TypographySize.SMALL}>
          Resolve
        </Typography>
      </Banner>
    </BannerContainer>
  );
};

export default DomainVerificationErrorBanner;
