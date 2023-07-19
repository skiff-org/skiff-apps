import {
  Button,
  Dialog,
  DialogTypes,
  Icon,
  IconButton,
  Size,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { useFlags } from 'launchdarkly-react-client-sdk';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Illustration, Illustrations } from 'skiff-front-utils';
import { SubscriptionPlan } from 'skiff-graphql';
import { TrialOfferWithOneClickDomainFeatureFlag } from 'skiff-utils';
import styled from 'styled-components';

import { useSubscriptionPlan } from '../../../../utils/userUtils';

import CustomDomainSearchResults from './CustomDomainSearchResults';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  max-width: 800px;
  height: 100%;
  width: 100%;
  // For smaller screens, compress height
  @media (max-width: 1160px) {
    height: fit-content;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  height: 'fit-content';
  max-width: 440px;
`;

const LeftContents = styled.div`
  max-width: 440px;
`;

const RightContents = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 688px;
  align-items: center;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  height: 100%;
  width: 100%;
  padding: ${isMobile ? '3vw' : '6vw'};
  box-sizing: border-box;
  // For smaller screens, show vertically
  @media (max-width: 1160px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 50px;
    overflow-y: scroll;
  }
`;

const DescriptionWrapper = styled.div`
  height: 40px;
`;

const SearchBar = styled.div`
  display: flex;
  width: 440px;
  gap: 12px;
  margin-bottom: 12px;
`;

const NameInput = styled.input`
  flex: 1;
  width: 372px;
  height: 56px;

  border: none;
  outline: none;
  box-shadow: var(--inset-empty);

  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 14px;
  background: var(--bg-overlay-tertiary);

  font-size: 28px !important;
  font-weight: 560;
  font-family: 'Skiff Sans Text', sans-serif;
  line-height: 120%;
  letter-spacing: -0.02em;
  -webkit-font-smoothing: antialiased;

  color: var(--text-secondary);
  &:focus {
    color: var(--text-primary);
  }
  &::placeholder {
    color: var(--text-disabled);
  }
`;

const FreeTrialHighlight = styled.span`
  color: var(--text-link);
`;

const StyledIconButton = styled(IconButton)`
  aspect-ratio: 1;
  width: unset;
  height: 100%;
`;

interface SearchOneClickCustomDomainsProps {
  open: boolean;
  onClose: () => void;
}

const SearchOneClickCustomDomainsModal: React.FC<SearchOneClickCustomDomainsProps> = ({ open, onClose }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const featureFlags = useFlags();
  const hasFreeTrialWithOneClickDomainFF =
    featureFlags.freeTierOneClickCustomDomains as TrialOfferWithOneClickDomainFeatureFlag;
  const isEligibleForFreeTrial = activeSubscription === SubscriptionPlan.Free && hasFreeTrialWithOneClickDomainFF;

  return (
    <Dialog customContent onClose={onClose} open={open} type={DialogTypes.Fullscreen}>
      <Wrapper>
        <Container>
          <Header>
            <Illustration illustration={Illustrations.SkiffLockupIcon} style={{ marginBottom: '8px' }} />
            <Typography mono uppercase size={TypographySize.H3} weight={TypographyWeight.BOLD} wrap>
              Customize your email address with one click.
            </Typography>
            <DescriptionWrapper>
              <Typography mono uppercase color='secondary' wrap>
                {isEligibleForFreeTrial ? (
                  <>
                    Your first domain purchase includes <FreeTrialHighlight>60 days of Skiff Pro </FreeTrialHighlight>
                    ($20 value). Skiff Pro unlocks your custom domain, plus 100 GB storage, an extra-short email alias,
                    and more.
                  </>
                ) : (
                  <>
                    Choose the perfect domain and start using it immediately to send and receive email – no setup
                    required.
                  </>
                )}
              </Typography>
            </DescriptionWrapper>
          </Header>
          <LeftContents>
            <SearchBar>
              <NameInput
                autoFocus
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
                placeholder='Type a domain'
                value={searchInput}
              />
              <StyledIconButton icon={Icon.ArrowRight} onClick={() => setSearchQuery(searchInput)} size={Size.LARGE} />
            </SearchBar>
            <Button fullWidth onClick={onClose} type={Type.SECONDARY}>
              Back
            </Button>
          </LeftContents>
        </Container>
        <RightContents>
          <CustomDomainSearchResults searchQuery={searchQuery} />
        </RightContents>
      </Wrapper>
    </Dialog>
  );
};

export default SearchOneClickCustomDomainsModal;
