import { useFlags } from 'launchdarkly-react-client-sdk';
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
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { SubscriptionPlan } from 'skiff-graphql';
import { FreeTierCustomDomainsFeatureFlag } from 'skiff-utils';
import styled from 'styled-components';

import Illustration, { Illustrations } from '../../../../svgs/Illustration';
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

const SkiffLogo = styled(Illustration)`
  margin-bottom: 8px;
`;

const FreeTrialHighlight = styled.span`
  color: var(--text-link);
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
  const hasFreeTierOneClickCustomDomainsFF =
    featureFlags.freeTierOneClickCustomDomains as FreeTierCustomDomainsFeatureFlag;
  const isEligibleForFreeTrial = activeSubscription === SubscriptionPlan.Free && hasFreeTierOneClickCustomDomainsFF;

  return (
    <Dialog customContent onClose={onClose} open={open} type={DialogTypes.Fullscreen}>
      <Wrapper>
        <Container>
          <Header>
            <SkiffLogo illustration={Illustrations.SkiffLockupIcon} scale={1} />
            <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD} wrap>
              Customize your email address with one click.
            </Typography>
            <DescriptionWrapper>
              <Typography color='secondary' wrap>
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
              <IconButton
                filled
                fullHeight
                icon={Icon.ArrowRight}
                onClick={() => setSearchQuery(searchInput)}
                size={Size.LARGE}
              />
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
