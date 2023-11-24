import { Alignment, Button, Type, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import styled from 'styled-components';

import { QuickAliasTutorialState } from '../../Settings/QuickAlias/QuickAliasModal/QuickAliasModal.constants';

const Container = styled.div`
  display: flex;
  padding: 20px;
  border-radius: 12px;
  background: var(--bg-l2-solid);
  width: 254px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  box-shadow: var(--shadow-l3);
  border: 1px solid var(--border-secondary);
  margin-top: -20px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const QuickAliasJoyrideTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  primaryProps,
  tooltipProps,
  size,
  isLastStep
}: TooltipRenderProps) => {
  const primaryOnClick = (e: React.MouseEvent<HTMLElement>) => primaryProps.onClick(e);
  // this joyride continues the onboarding steps in settings
  const numPreviousSteps = Object.keys(QuickAliasTutorialState).length / 2; // keys and values included so halve
  const stepNumber = index + numPreviousSteps + 1;
  const numSteps = size + numPreviousSteps;
  return (
    <Container {...tooltipProps}>
      <TextContainer>
        {step.title && (
          <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            {step.title}
          </Typography>
        )}
        {step.content && (
          <Typography align={Alignment.LEFT} color='secondary' wrap>
            {step.content}
          </Typography>
        )}
      </TextContainer>
      <ButtonContainer>
        <Typography color='disabled' size={TypographySize.SMALL}>{`${stepNumber} of ${numSteps}`}</Typography>
        <Button
          onClick={(e) => {
            e?.stopPropagation();
            primaryOnClick(e as React.MouseEvent<HTMLElement>);
          }}
          type={isLastStep ? Type.PRIMARY : Type.SECONDARY}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </ButtonContainer>
    </Container>
  );
};
