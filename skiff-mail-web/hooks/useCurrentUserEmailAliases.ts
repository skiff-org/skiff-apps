import { uniq } from 'lodash';
import { useEffect, useState } from 'react';
import {
  useGetBonfidaNamesLazyQuery,
  useGetCurrentUserEmailAliasesQuery,
  useGetEnsNameLazyQuery
} from 'skiff-mail-graphql';
import { isCosmosHubAddress, isSolanaAddress, getJunoAddress } from 'skiff-utils';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

export const useCurrentUserEmailAliases = () => {
  const { data } = useGetCurrentUserEmailAliasesQuery();
  const receivedEmailAliases = data?.currentUser?.emailAliases;
  const [emailAliases, setEmailAliases] = useState<string[]>(receivedEmailAliases ?? []);
  const [getBonfidaQuery] = useGetBonfidaNamesLazyQuery();
  const [getENSQuery] = useGetEnsNameLazyQuery();

  useEffect(() => {
    async function fetchAliases() {
      if (!receivedEmailAliases) {
        return;
      }
      // For each email alias, if it's a ethereum address,
      // add the ENS domain associated with it as an alias.
      // If it's a Cosmos hub address, add the Juno address
      // associated with it.
      const generatedAliases: string[] = [];
      await Promise.all(
        receivedEmailAliases.map(async (email) => {
          const [alias, mailDomain] = email.split('@');
          if (isEthereumAddress(alias)) {
            const { data: ensData } = await getENSQuery({ variables: { ethereumAddress: alias } });
            const ensName = ensData?.getENSName;
            if (!ensName) return;
            const ensEmailAlias = `${ensName}@${mailDomain}`;
            if (!generatedAliases.includes(ensEmailAlias)) {
              generatedAliases.push(ensEmailAlias);
            }
          }
          if (isSolanaAddress(alias)) {
            const { data: bonfidaData } = await getBonfidaQuery({ variables: { solanaAddress: alias } });
            const solNames = bonfidaData?.getBonfidaNames;
            if (!solNames) return;
            const solNameAliases = solNames.map((solName) => `${solName}@${mailDomain}`);
            solNameAliases.forEach((solNameAlias) => {
              if (!generatedAliases.includes(solNameAlias)) {
                generatedAliases.push(solNameAlias);
              }
            });
          }
          if (isCosmosHubAddress(alias)) {
            const junoAddress = getJunoAddress(alias);
            const junoEmailAlias = `${junoAddress}@${mailDomain}`;
            if (!generatedAliases.includes(junoEmailAlias)) {
              generatedAliases.push(junoEmailAlias);
            }
          }
        })
      );
      setEmailAliases(uniq([...generatedAliases, ...receivedEmailAliases]));
    }
    void fetchAliases();
  }, [receivedEmailAliases, getBonfidaQuery, getENSQuery]);

  return emailAliases;
};
