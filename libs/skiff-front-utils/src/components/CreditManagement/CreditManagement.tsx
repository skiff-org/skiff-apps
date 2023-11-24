import { Button, Typography } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { useCurrentUserIsOrgAdmin } from '../../hooks';
import { isMobileApp, isReactNativeDesktopApp } from '../../utils';
import { TitleActionSection } from '../Settings';

import CreditPrompt, { CreditPromptProps } from './CreditPrompt';
interface CreditManagementProps {
  creditPrompts: CreditPromptProps[];
  currentCreditCents: number;
  loading: boolean;
  openPlansTab: () => void;
}

const CreditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CreditManagement: React.FC<CreditManagementProps> = ({
  creditPrompts,
  currentCreditCents,
  loading,
  openPlansTab
}) => {
  const isCurrentUserOrgAdmin = useCurrentUserIsOrgAdmin();
  const currentCreditsInDollars = currentCreditCents / 100;

  const renderContents = () => {
    if (currentCreditCents <= 0) {
      return <Typography color='secondary'>Earn Skiff credits by completing different tasks</Typography>;
    }

    const shopForPlansButton = (
      <Button fullWidth={isMobile} onClick={openPlansTab}>
        Shop plans
      </Button>
    );

    return (
      <TitleActionSection
        actions={
          isCurrentUserOrgAdmin && !isReactNativeDesktopApp()
            ? [
                {
                  content: shopForPlansButton,
                  type: 'custom'
                }
              ]
            : undefined
        }
        subtitle={`You've earned $${currentCreditsInDollars} of Skiff credit.${
          isCurrentUserOrgAdmin
            ? ' Credit applies automatically to purchases and renewals for Pro and Business plans.'
            : ''
        }`}
      />
    );
  };

  return (
    <>
      {!isMobileApp() && renderContents()}
      {/* Wait until loading is complete to correctly populate the credit values */}
      {!loading && (
        <CreditContainer>
          {creditPrompts.map((prompt) => (
            <CreditPrompt key={`credits-prompt-${prompt.action}-${prompt.description}`} {...prompt} />
          ))}
        </CreditContainer>
      )}
    </>
  );
};

export default CreditManagement;
