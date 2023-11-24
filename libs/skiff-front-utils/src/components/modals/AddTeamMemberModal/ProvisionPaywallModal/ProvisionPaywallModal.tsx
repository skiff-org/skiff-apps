import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  MonoTag,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React from 'react';
import { TierName } from 'skiff-utils';
import styled from 'styled-components';

import { useSubscriptionPlan } from 'skiff-front-graphql';
import { SubscriptionPlan } from 'skiff-graphql';
import { useCurrentOrganization } from '../../../../hooks';
import DottedGrid from '../../../DottedGrid';
import NameMarquee from '../../../NameMarquee';
import { SettingsPage, TabPage } from '../../../Settings';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0px;
  height: 100%;
  width: 100%;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 4px;
  height: 100%;
  width: 100%;
`;

const CenterSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 12px;
  gap: 12px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
`;

const MarqueeContainer = styled.div`
  width: 100%;
  overflow: hidden;
  background: var(--bg-overlay-tertiary);
  height: 174px;
  border-radius: 12px 12px 0px 0px;
`;
const ButtonSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  padding-top: 0px;
  height: 100%;
  width: 100%;
  align-items: center;
  box-sizing: border-box;
`;

const StyledDottedGrid = styled(DottedGrid)`
  z-index: -1;
`;

const StyledMarquee = styled(NameMarquee)`
  transform: scale(0.6) translate(-588px, -40px);
  margin-top: 0px;
`;

interface ProvisionPaywallModalProps {
  onClose: () => void;
  maxCollaborators: number;
  currentTier: TierName;
  openSettings: (page: SettingsPage) => void;
}

export const ProvisionPaywallModal: React.FC<ProvisionPaywallModalProps> = ({
  onClose,
  maxCollaborators,
  openSettings
}: ProvisionPaywallModalProps) => {
  const onPaywallUpgradeClicked = () => {
    onClose();
    openSettings({
      indices: { tab: TabPage.Plans }
    });
  };
  const {
    loading: subscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const isUserOnFreeTier = !subscriptionLoading && activeSubscription === SubscriptionPlan.Free;

  const { data: orgData } = useCurrentOrganization();

  const organization = orgData?.organization;

  const allOrgMembers = organization?.everyoneTeam?.rootDocument?.collaborators ?? [];

  const PILL_ROW_ONE = [
    allOrgMembers[0]?.user.username || 'stealth@skiff.com',
    null,
    allOrgMembers[1]?.user.username || 'fox@skiff.com'
  ];
  const PILL_ROW_TWO = [null, allOrgMembers[2]?.user.username || 'me@skiff.com', null];
  const PILL_ROW_THREE = [
    allOrgMembers[3]?.user.username || 'tomato@skiff.com',
    null,
    allOrgMembers[4]?.user.username || 'ahab@skiff.com'
  ];

  const pills = [PILL_ROW_ONE, PILL_ROW_TWO, PILL_ROW_THREE];
  return (
    <Dialog customContent hideCloseButton noPadding onClose={onClose} open size={Size.MEDIUM}>
      <Container>
        <MarqueeContainer>
          <StyledDottedGrid noAnimation height={174} hideMotionLine left={0} top={0} />
          <StyledMarquee pillColor='var(--bg-l2-solid)' pills={pills} hideSubdomain margin='0px 0px 0px 180px' />
        </MarqueeContainer>
        <CenterSection>
          <MonoTag
            color='secondary'
            label={`${maxCollaborators} of ${maxCollaborators} ${pluralize('collaborator', maxCollaborators)} added`}
          />
          <Title>
            <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM} wrap>
              Ready to grow your team?
            </Typography>
            <Typography color='secondary' size={TypographySize.MEDIUM} wrap>
              {`On Skiff, every new teammate is entitled to their own storage allowance, email addresses and more. Upgrade
              to a flexible ${isUserOnFreeTier ? 'Essential, Pro, or Business' : 'Business'} plan to unlock ${
                isUserOnFreeTier ? 'more' : 'unlimited'
              } collaborators${isUserOnFreeTier ? '' : 'on a per-seat basis'}.`}
            </Typography>
          </Title>
        </CenterSection>
        <ButtonSection>
          <ButtonGroup>
            <ButtonGroupItem key='upgrade' label='Upgrade' onClick={onPaywallUpgradeClicked} />
            <ButtonGroupItem key='not-now' label='Not now' onClick={onClose} />
          </ButtonGroup>
        </ButtonSection>
      </Container>
    </Dialog>
  );
};
