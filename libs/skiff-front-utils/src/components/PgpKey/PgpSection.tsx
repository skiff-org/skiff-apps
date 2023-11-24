import partition from 'lodash/partition';
import { CircularProgress, Icon, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useEffect } from 'react';
import { PgpPublicKey, fetchWKDKey, readArmoredPublicKey } from 'skiff-crypto-v2';
import { PgpInfo, useGetPgpInfoQuery } from 'skiff-front-graphql';
import { PgpKeyStatus } from 'skiff-graphql';
import styled from 'styled-components';
import { useImportKey } from '../../hooks/pgp/useImportKey';
import { getBaseProxyURL, getEnvironment } from '../../utils';
import DisabledKeyRow from './DisabledKeyRow';
import { openImportPgpKeyDialog } from './Pgp.utils';
import PgpKeyTable from './PgpKeyTable';
import { HeaderContainer } from './PgpSection.constants';

const PgpContainer = styled.div<{ $clickable: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 8px;
  gap: 12px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-l2-solid);
  width: 100%;
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};
  :hover {
    background: ${(props) => (props.$clickable ? 'var(--bg-overlay-tertiary)' : '')};
  }
`;

interface PgpSectionProps {
  address: string;
  openGenerateModal?: () => void;
  ownKey?: boolean;
}

const WKD_PROVIDERS = ['proton', 'pm.me', 'posteo', 'mailfence'];

const PgpSection: React.FC<PgpSectionProps> = ({ address, ownKey, openGenerateModal }) => {
  const [loadingWkd, setLoadingWkd] = React.useState(false);
  const [pgpPublicKey, setPgpPublicKey] = React.useState<PgpPublicKey | null>(null);

  const {
    data: pgpKeyData,
    loading: pgpKeyDataLoading,
    refetch
  } = useGetPgpInfoQuery({
    variables: { emailAlias: address, allKeys: true }
  });
  const pgpKeys = pgpKeyData?.pgpInfo as PgpInfo[];
  const [activeKeys, disabledKeys] = partition(pgpKeys, (key) => key.status === PgpKeyStatus.Enabled);
  const activeKey = activeKeys[0]; // should only be one active key

  // TODO also query WKD (if just proton)
  const { importKey } = useImportKey();

  const onContainerClick = () => {
    if (!openGenerateModal) {
      openImportPgpKeyDialog(address, ownKey || false, !!activeKey, importKey, refetch);
    } else {
      // generate key
      openGenerateModal();
    }
  };

  const isWKDAddress = WKD_PROVIDERS.some((provider) => address.split('@').at(1)?.includes(provider) ?? false);

  useEffect(() => {
    let isCancelled = false; // This flag will indicate if the effect has been re-invoked with a new address
    const currentAddress = address; // Store the current address when the fetch is initiated

    setPgpPublicKey(null);
    const fetchWkdKey = async () => {
      const originUrl = new URL(window.location.origin);
      try {
        setLoadingWkd(true);
        const wkdKey = await fetchWKDKey(
          address,
          getEnvironment(originUrl) === 'local'
            ? new URL('https://resource-proxy.skiff.town')
            : getBaseProxyURL(originUrl)
        );
        if (!isCancelled && currentAddress === address && wkdKey) {
          setPgpPublicKey(wkdKey);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingWkd(false);
      }
    };

    const fetchPgpPublicKey = async (pgpKey: PgpInfo) => {
      const activePublicKey = await readArmoredPublicKey(pgpKey.publicKey);
      if (!isCancelled && currentAddress === address) {
        setPgpPublicKey(activePublicKey);
      }
    };

    if (pgpKeyDataLoading) return;
    if (activeKey) {
      // if skiff pgp key found, set its public key
      void fetchPgpPublicKey(activeKey);
    } else if (isWKDAddress) {
      // otherwise, try to fetch via WKD
      void fetchWkdKey();
    }
    // When the address changes, set isCancelled to true to ignore any ongoing fetches
    return () => {
      isCancelled = true;
    };
  }, [address, pgpKeyDataLoading, activeKey, isWKDAddress]);

  const loading = pgpKeyDataLoading || loadingWkd;
  const onClick = !pgpPublicKey && !loading ? onContainerClick : undefined;
  return (
    <>
      <PgpContainer onClick={onClick} $clickable={!!onClick}>
        {!pgpPublicKey && !loading && (
          <HeaderContainer>
            <IconText
              label={
                !openGenerateModal ? `Import PGP ${ownKey ? 'secret' : 'public'} key (.asc or .ggp)` : 'Generate key'
              }
              color='secondary'
              size={Size.SMALL}
              weight={TypographyWeight.REGULAR}
              startIcon={Icon.Plus}
            />
          </HeaderContainer>
        )}
        {loading && (
          <HeaderContainer>
            <CircularProgress size={Size.SMALL} spinner />
            <Typography color='secondary' size={TypographySize.SMALL}>
              Searching for matching PGP key
            </Typography>
          </HeaderContainer>
        )}
        {pgpPublicKey && !loading && (
          <PgpKeyTable
            ownKey={ownKey}
            activePublicKey={pgpPublicKey}
            isSkiffManagedKey={!!activeKey}
            address={address}
          />
        )}
      </PgpContainer>
      {!loading && disabledKeys.length > 0 && (
        <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>{`Disabled ${pluralize(
          'key',
          disabledKeys.length
        )}`}</Typography>
      )}
      {!loading &&
        disabledKeys.map((disabledKey) => <DisabledKeyRow key={disabledKey.encryptionKeyID} pgpKey={disabledKey} />)}
    </>
  );
};

export default PgpSection;
