import { Divider, Icon, Icons, Size, Typography, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';

import { BaseCreditPrompt } from '../../constants';
import { SettingAction, TitleActionSection } from '../Settings';

export interface CreditPromptProps extends BaseCreditPrompt {
  // whether or not all credits have been earned (displays checkmark)
  complete: boolean;
  // i.e. open the referral model
  onActionClick: () => void;
}

const AmountBox = styled.div<{ $complete: boolean }>`
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  place-items: center;

  width: 42px;
  height: 42px;
  aspect-ratio: 1;

  background: ${(props) => (props.$complete ? 'var(--accent-green-secondary)' : 'var(--bg-l0-solid)')};
  border: 1px solid ${(props) => (props.$complete ? 'var(--accent-green-secondary)' : 'var(--border-secondary)')};
  border-radius: 8px;
`;

const CreditContainer = styled.div`
  display: flex;
  align-items: ${isMobile ? 'flex-start' : 'center'};
  gap: 16px;
`;

const CreditPrompt: React.FC<CreditPromptProps> = ({ action, amount, complete, description, onActionClick, hint }) => (
  <>
    <Divider />
    <CreditContainer onClick={isMobile ? onActionClick : undefined}>
      <AmountBox $complete={complete}>
        {isMobile && complete && <Icons color='green' icon={Icon.Check} size={Size.X_MEDIUM} />}
        {(!complete || !isMobile) && (
          <Typography color={isMobile && complete ? 'green' : 'secondary'} weight={TypographyWeight.MEDIUM}>
            ${amount}
          </Typography>
        )}
      </AmountBox>
      <TitleActionSection
        actions={
          isMobile
            ? undefined
            : [
                ...insertIf<SettingAction>(!complete, {
                  dataTest: `credit-${action}`,
                  onClick: onActionClick,
                  label: action,
                  type: 'button'
                }),
                ...insertIf<SettingAction>(complete, {
                  content: <Icons color='green' icon={Icon.Check} size={Size.X_MEDIUM} />,
                  type: 'custom'
                })
              ]
        }
        subtitle={hint}
        title={description}
      />
    </CreditContainer>
  </>
);

export default CreditPrompt;
