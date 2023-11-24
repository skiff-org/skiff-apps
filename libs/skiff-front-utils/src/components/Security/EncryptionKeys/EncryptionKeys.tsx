import partition from 'lodash/partition';
import { Icon, IconText, Icons, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import styled from 'styled-components';

import { useGetPgpInfoQuery } from 'skiff-front-graphql';
import { PgpInfo, PgpKeyStatus } from 'skiff-graphql';
import { TitleActionSection } from '../../Settings';
import EncryptionKeyRow from './EncryptionKeyRow';

const KeyContainer = styled.div<{ $clickable?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--border-tertiary);
  padding: 8px 0px;
  padding-bottom: 0px;
  box-sizing: border-box;
  gap: 16px;
  min-height: 44px;
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};
`;

const Keys = styled.div`
  display: flex;
  flex-direction: column;
`;

const Spacer = styled.div`
  width: 24px;
`;

const HeaderRow = styled.div`
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-tertiary);
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 1fr minmax(auto, max-content);
  grid-gap: 72px;
  align-items: flex-start;
  box-sizing: border-box;
`;

const SectionHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  justify-content: space-between;
  padding: 8px 12px;
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
`;

const KeyHeader = styled.div`
  display: flex;
  padding: 0px 8px;
  align-items: center;
  justify-content: space-between;
`;

const COLUMNS = ['Address', 'Fingerprint ID', 'Key type', 'Date added'];
/**
 * Allows users to view their pgp encryption keys in account settings
 */
function EncryptionKeys() {
  const { data: pgpKeyData, loading: pgpKeyDataLoading } = useGetPgpInfoQuery({
    variables: { emailAlias: '', allKeys: true }
  });
  const pgpKeys = pgpKeyData?.pgpInfo as PgpInfo[];
  const [activeKeys, disabledKeys] = partition(pgpKeys, (key) => key.status === PgpKeyStatus.Enabled);

  const [expand, setExpand] = useState(false);

  const toggleExpand = () => {
    setExpand(!expand);
  };
  return (
    <>
      <TitleActionSection subtitle='PGP encryption keys across all addresses' title='Encryption keys' />

      {!pgpKeyDataLoading && (
        <KeyContainer $clickable={!expand} onClick={!expand ? toggleExpand : undefined}>
          <KeyHeader>
            <>
              <IconText
                label={pluralize('active key', activeKeys.length, true)}
                startIcon={<Icons color='secondary' icon={Icon.Key} />}
                weight={TypographyWeight.REGULAR}
              />
              <IconText
                onClick={toggleExpand}
                startIcon={
                  <Icons color='disabled' icon={expand ? Icon.ChevronUp : Icon.ChevronRight} size={Size.SMALL} />
                }
              />
            </>
          </KeyHeader>
          {expand && (
            <Keys>
              <HeaderRow>
                {COLUMNS.map((header) => (
                  <Typography key={header} color='disabled' mono size={TypographySize.CAPTION} uppercase>
                    {header}
                  </Typography>
                ))}
                <Spacer />
              </HeaderRow>
              {activeKeys.map((key: PgpInfo) => {
                return <EncryptionKeyRow key={key.encryptionKeyID} pgpKey={key} />;
              })}
              {disabledKeys.length > 0 && (
                <>
                  <SectionHeader>
                    <Typography color='secondary' selectable={false}>
                      Disabled keys
                    </Typography>
                  </SectionHeader>
                  {disabledKeys.map((key: PgpInfo) => {
                    return <EncryptionKeyRow key={key.encryptionKeyID} pgpKey={key} />;
                  })}
                </>
              )}
            </Keys>
          )}
        </KeyContainer>
      )}
    </>
  );
}

export default EncryptionKeys;
