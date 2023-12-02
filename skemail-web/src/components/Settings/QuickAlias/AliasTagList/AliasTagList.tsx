import { Dialog, Size } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import {
  useGetUserQuickAliasDomainsQuery,
  useSubscriptionPlan,
  useGetNumUserDeactivatedQuickAliasDomainsQuery
} from 'skiff-front-graphql';
import { TitleActionSection } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { getMaxInactiveQuickAliasSubdomains, getMaxQuickAliasSubdomains } from 'skiff-utils';
import styled from 'styled-components';

import AddTagModalActivated from '../AddTagModal/Activated/AddTagModalActivated';
import AddTagModalCreate from '../AddTagModal/Create/AddTagModalCreate';
import QuickAliasModal from '../QuickAliasModal/QuickAliasModal';
import { QuickAliasOnboardingStep } from '../QuickAliasModal/QuickAliasModal.constants';
import { QuickAliasPaywallModal } from '../QuickAliasPaywallModal/QuickAliasPaywallModal';

import { AliasTagRow } from './AliasTagRow';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  align-items: center;
`;

const TagContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FixedHeightContainer = styled.div`
  min-height: 24px;
`;

export const AliasTagList: React.FC = () => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [subdomain, setSubdomain] = useState('');
  const [openPaywallModal, setOpenPaywallModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);

  const { data, loading: domainsLoading } = useGetUserQuickAliasDomainsQuery();
  const quickAliasDomains = data?.currentUser?.anonymousSubdomains || [];
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const currentTier = getTierNameFromSubscriptionPlan(activeSubscription);
  const maxQuickAliasSubdomains = getMaxQuickAliasSubdomains(currentTier);
  const maxInactiveSubdomains = getMaxInactiveQuickAliasSubdomains(currentTier);

  const {
    data: numDeactivatedSubdomainsData,
    loading: numDeactivatedSubdomainsLoading,
    refetch: refetchNumDeactivatedSubdomains
  } = useGetNumUserDeactivatedQuickAliasDomainsQuery();
  const numDeactivatedSubdomains = numDeactivatedSubdomainsData?.currentUser?.numDeactivatedAnonymousSubdomains ?? 0;
  const remainingDeletions = Math.max(maxInactiveSubdomains - numDeactivatedSubdomains, 0);

  const domainDataLoading = domainsLoading || numDeactivatedSubdomainsLoading;

  const onClose = () => {
    setOpen(false);
  };

  const goNext = () => {
    setCurrentStepIdx(currentStepIdx + 1);
  };

  const goBack = () => {
    setCurrentStepIdx(currentStepIdx - 1);
  };

  useEffect(() => {
    return () => {
      setCurrentStepIdx(0);
      setSubdomain('');
    };
  }, [open]);

  const STEPS = [
    <AddTagModalCreate
      key='create'
      onBack={onClose}
      onNext={goNext}
      setSubdomain={setSubdomain}
      subdomain={subdomain}
    />,
    <AddTagModalActivated
      key='activated'
      onBack={goBack}
      onNext={() => setTutorialModalOpen(true)}
      subdomain={subdomain}
    />
  ];
  const currentStep = STEPS[currentStepIdx];

  if (!domainsLoading && quickAliasDomains.length === 0) {
    return null;
  }
  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: () => {
              if (quickAliasDomains.length < maxQuickAliasSubdomains) {
                setOpen(true);
              } else {
                setOpenPaywallModal(true);
              }
            },
            label: 'Add',
            type: 'button'
          }
        ]}
        subtitle={`Quickly create email aliases by entering in <anything>@${
          quickAliasDomains[0]?.domain || '<your domain>'
        }.`}
        title='Domains'
      />
      <TagContainer>
        {domainDataLoading ? (
          // optimistically leave space for a domain, since this setting is meant to show post-onboarding
          <FixedHeightContainer />
        ) : (
          quickAliasDomains.map((domain) => (
            <AliasTagRow
              domain={domain}
              key={domain.domain}
              refetchNumInactiveSubdomains={() => void refetchNumDeactivatedSubdomains()}
              remainingDeletions={remainingDeletions}
            />
          ))
        )}
      </TagContainer>
      <Dialog customContent hideCloseButton noPadding onClose={onClose} open={open} size={Size.MEDIUM}>
        <Container>{currentStep}</Container>
      </Dialog>
      <QuickAliasPaywallModal open={openPaywallModal} setOpen={setOpenPaywallModal} />
      <QuickAliasModal
        firstStep={QuickAliasOnboardingStep.TUTORIAL}
        onClose={() => {
          onClose();
          setTutorialModalOpen(false);
        }}
        open={tutorialModalOpen}
        quickAliasDomain={subdomain}
      />
    </>
  );
};
