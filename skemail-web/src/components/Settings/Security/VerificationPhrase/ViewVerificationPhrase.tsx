import { Icon, Typography } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { generateVerificationPhraseFromSigningKey } from 'skiff-crypto';
import { TitleActionSection, useToast, useRequiredCurrentUserData } from 'skiff-front-utils';
import styled from 'styled-components';

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
  width: 100%;
  box-sizing: border-box;
`;

const PhrasesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  grid-auto-flow: row dense;
  grid-template-rows: 1fr min-content;
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
    enqueueToast({ title: 'Verification phrase copied' });
  };

  useEffect(() => {
    // Called when modal is triggered
    const fetchVerificationPhrase = () => {
      const generatedVerificationPhrase = generateVerificationPhraseFromSigningKey(userData.signingPublicKey);
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
            type: 'button',
            icon: Icon.Copy
          }
        ]}
        subtitle='Other Skiff users can use your verification phrase to verify your identity'
        title={isMobile ? '' : 'Verification phrase'}
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
