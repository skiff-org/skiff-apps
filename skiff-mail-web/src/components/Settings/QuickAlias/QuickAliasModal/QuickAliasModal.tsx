import { Dialog, Size } from 'nightwatch-ui';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

import { JoyrideStepID, skemailJoyrideReducer } from '../../../../redux/reducers/joyrideReducer';
import { useNavigate } from '../../../../utils/navigation';
import { useSettings } from '../../useSettings';

import { STEPS, QuickAliasOnboardingStep } from './QuickAliasModal.constants';
import QuickAliasCreateSubdomain from './Steps/Initial/Create/QuickAliasCreateSubdomain';
import QuickAliasSplash from './Steps/Initial/Splash/QuickAliasSplash';
import QuickAliasTutorial from './Steps/Initial/Tutorial/QuickAliasTutorial';

const StyledDialog = styled(Dialog)`
  background: var(--bg-l0-solid) !important;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  width: 70vw !important;
  height: 78vh !important;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  align-items: center;
`;

interface QuickAliasModalProps {
  open: boolean;
  onClose: () => void;
  firstStep?: QuickAliasOnboardingStep;
  quickAliasDomain?: string;
}

export default function QuickAliasModal({ open, onClose, firstStep, quickAliasDomain }: QuickAliasModalProps) {
  const [currentStep, setCurrentStep] = useState(firstStep ?? QuickAliasOnboardingStep.SPLASH);
  const [subdomain, setSubdomain] = useState(quickAliasDomain ?? '');

  const onCloseAndCleanUp = () => {
    onClose();
    setCurrentStep(QuickAliasOnboardingStep.SPLASH);
    setSubdomain('');
  };

  const dispatch = useDispatch();
  const { navigateToSystemLabel } = useNavigate();
  const { closeSettings } = useSettings();

  const goNext = () => {
    const currIdx = STEPS.indexOf(currentStep);
    if (currIdx < 0) return;
    const nextStep = STEPS[currIdx + 1];
    if (nextStep) setCurrentStep(nextStep);
  };

  const goToMailbox = () => {
    onCloseAndCleanUp();
    closeSettings();
    dispatch(skemailJoyrideReducer.actions.setJoyrideStep(JoyrideStepID.FILTER_BY_ALIAS));
    navigateToSystemLabel(SystemLabels.QuickAliases);
  };

  useEffect(() => {
    if (quickAliasDomain) {
      setSubdomain(quickAliasDomain);
    }
  }, [quickAliasDomain]);

  const steps: Record<QuickAliasOnboardingStep, React.ReactElement> = {
    [QuickAliasOnboardingStep.SPLASH]: <QuickAliasSplash key='splash' onNext={goNext} />,
    [QuickAliasOnboardingStep.SUBDOMAIN]: (
      <QuickAliasCreateSubdomain
        key='subdomain'
        onClose={onCloseAndCleanUp}
        onNext={goNext}
        setSubdomain={setSubdomain}
        subdomain={subdomain}
      />
    ),
    [QuickAliasOnboardingStep.TUTORIAL]: (
      <QuickAliasTutorial key='tutorial' onClose={onCloseAndCleanUp} onNext={goToMailbox} subdomain={subdomain} />
    )
  };

  const step = steps[currentStep];

  return (
    <StyledDialog customContent hideCloseButton noPadding onClose={onCloseAndCleanUp} open={open} size={Size.X_LARGE}>
      <Container>{step}</Container>
    </StyledDialog>
  );
}
