import { Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
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

const HoverContainer = styled.div`
  border-radius: 6px;
  padding: 4px 8px;
  &:hover {
    cursor: pointer;
    background: var(--bg-overlay-destructive);
  }
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
          color='red'
          size={TypographySize.SMALL}
          weight={TypographyWeight.MEDIUM}
        >{`${errorCount} DNS record ${pluralize('error', errorCount)}`}</Typography>
        <HoverContainer onClick={onCTAClick}>
          <Typography color='red' size={TypographySize.SMALL}>
            Resolve
          </Typography>
        </HoverContainer>
      </Banner>
    </BannerContainer>
  );
};

export default DomainVerificationErrorBanner;
