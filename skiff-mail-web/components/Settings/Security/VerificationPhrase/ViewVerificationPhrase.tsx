import { Icon, Typography } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { generateVerificationPhraseFromSigningKey } from 'skiff-crypto';
import { TitleActionSection, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';

const PhraseField = styled.div`
  background: var(--bg-field-default);
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  border-radius: 12px;
  width: 116px;
`;

const PhrasesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 140px);
  grid-auto-flow: row dense;
  column-gap: 12px;
  row-gap: 12px;
`;

/**
 * Allows users to view their verification phrase in account settings
 */
function ViewVerificationPhrase() {
  const userData = useRequiredCurrentUserData();
  // Store fetched verification phrase in state
  const [verificationPhrase, setVerificationPhrase] = useState('');
  const { enqueueToast } = useToast();

  const copyText = (e: React.MouseEvent) => {
    e?.stopPropagation();
    void navigator.clipboard.writeText(verificationPhrase);
    enqueueToast({
      body: 'Verification phrase copied',
      icon: Icon.Copy
    });
  };

  useEffect(() => {
    // Called when modal is triggered
    const fetchVerificationPhrase = async () => {
      const generatedVerificationPhrase = await generateVerificationPhraseFromSigningKey(userData.signingPublicKey);
      setVerificationPhrase(generatedVerificationPhrase);
    };
    void fetchVerificationPhrase();
  }, [userData.signingPublicKey]);

  const verificationPhrases = verificationPhrase.split(' ');

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: copyText,
            label: 'Copy',
            type: 'button'
          }
        ]}
        subtitle='Other Skiff users can use your verification phrase to verify your identity.'
        title='Verification phrase'
      />
      <PhrasesContainer>
        {verificationPhrases.map((phrase) => {
          return (
            <PhraseField key={phrase}>
              <Typography color='secondary'>{phrase}</Typography>
            </PhraseField>
          );
        })}
      </PhrasesContainer>
    </>
  );
}

export default ViewVerificationPhrase;
