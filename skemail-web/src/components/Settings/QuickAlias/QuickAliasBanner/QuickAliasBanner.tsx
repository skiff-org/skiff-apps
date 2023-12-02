import { Button, Size, ThemeMode, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useState } from 'react';
import { useGetUserQuickAliasDomainsQuery } from 'skiff-front-graphql';
import { useMediaQuery } from 'skiff-front-utils';
import styled from 'styled-components';

import QuickAliasModal from '../QuickAliasModal/QuickAliasModal';

import AddAliasIllustration from './AddAliasIllustration';

// prevent layout shift following onboarding
const FixedHeightContainer = styled.div`
  min-height: 26px;
`;

const BannerBackdrop = styled.div`
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-emphasis);
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  border-radius: 12px;
  padding: 20px;
  min-height: 150px;
`;

const TextContainer = styled.div<{ $isCompact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: ${({ $isCompact }) => ($isCompact ? '50%' : '100%')};
`;

const COMPACT_ILLUSTRATION_BREAKPOINT = 1120;

export default function QuickAliasBanner() {
  const { data, loading } = useGetUserQuickAliasDomainsQuery();
  const quickAliasDomains = data?.currentUser?.anonymousSubdomains || [];

  const [open, setOpen] = useState(false);
  const openDomainSetup = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const isCompact = useMediaQuery(`(min-width:${COMPACT_ILLUSTRATION_BREAKPOINT}px)`, { noSsr: true });

  if (loading || (quickAliasDomains.length > 0 && !open)) {
    return (
      <FixedHeightContainer>
        {!loading && (
          <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            Quick Aliases
          </Typography>
        )}
      </FixedHeightContainer>
    );
  }

  return (
    <BannerBackdrop>
      <AddAliasIllustration />
      <TextContainer $isCompact={isCompact}>
        <Typography forceTheme={ThemeMode.DARK} size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM} wrap>
          Email protection, when and where you need it
        </Typography>
        <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} wrap>
          Choose a unique domain name and create on-demand aliases when you sign up for new services — online or off.
        </Typography>
      </TextContainer>
      <Button forceTheme={ThemeMode.DARK} onClick={openDomainSetup} size={Size.SMALL}>
        Get started
      </Button>
      <QuickAliasModal onClose={onClose} open={open} />
    </BannerBackdrop>
  );
}
