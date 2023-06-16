import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import uniq from 'lodash/uniq';
import { useEffect, useState } from 'react';
import {
  CurrentUserEmailAliasesDocument,
  CurrentUserEmailAliasesQuery,
  CurrentUserEmailAliasesQueryVariables,
  GetBonfidaNamesDocument,
  GetBonfidaNamesQuery,
  GetBonfidaNamesQueryVariables,
  GetEnsNameDocument,
  GetEnsNameQuery,
  GetEnsNameQueryVariables,
  GetIcnsNameDocument,
  GetIcnsNameQuery,
  GetIcnsNameQueryVariables,
  useCurrentUserEmailAliasesQuery,
  useGetBonfidaNamesLazyQuery,
  useGetEnsNameLazyQuery,
  useGetIcnsNameLazyQuery
} from 'skiff-front-graphql';
import { getJunoAddress, isCosmosHubAddress, isSolanaAddress } from 'skiff-utils';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

/**
 * For each email alias, if it's a ethereum address,
 * add the ENS domain associated with it as an alias.
 * If it's a Cosmos hub address, add the Juno address
 * associated with it.
 * Check Cosmos before Solana because some Cosmos addresses
 * could be interpreted as valid Solana addresses.
 * @param receivedEmailAliases
 * @param ensName
 * @param dotCosmosName
 * @param dotJunoName
 * @param solNames
 * @returns
 */
export const generateWalletAliases = (
  email: string,
  ensName?: string | null,
  dotCosmosName?: string | null,
  dotJunoName?: string | null,
  solNames?: string[]
) => {
  const generatedAliases: string[] = [];

  const [alias, mailDomain] = email.split('@');
  if (isEthereumAddress(alias)) {
    if (!ensName) return;
    const ensEmailAlias = `${ensName}@${mailDomain}`;
    if (!generatedAliases.includes(ensEmailAlias)) {
      generatedAliases.push(ensEmailAlias);
    }
  } else if (isCosmosHubAddress(alias)) {
    const junoAddress = getJunoAddress(alias);
    const junoEmailAlias = `${junoAddress}@${mailDomain}`;
    if (!generatedAliases.includes(junoEmailAlias)) {
      generatedAliases.push(junoEmailAlias);
    }
    // Resolve ICNS names
    if (dotCosmosName) {
      generatedAliases.push(`${dotCosmosName}@${mailDomain}`);
    }
    if (dotJunoName) {
      generatedAliases.push(`${dotJunoName}@${mailDomain}`);
    }
  } else if (isSolanaAddress(alias)) {
    if (!solNames) return;
    const solNameAliases = solNames.map((solName) => `${solName}@${mailDomain}`);
    solNameAliases.forEach((solNameAlias) => {
      if (!generatedAliases.includes(solNameAlias)) {
        generatedAliases.push(solNameAlias);
      }
    });
  }
  return generatedAliases;
};

export const getAllAliasesForCurrentUser = async (client: ApolloClient<NormalizedCacheObject>) => {
  const emailAliasesData = await client.query<CurrentUserEmailAliasesQuery, CurrentUserEmailAliasesQueryVariables>({
    query: CurrentUserEmailAliasesDocument,
    fetchPolicy: 'network-only' // make sure we don't get old values from the cache
  });
  const receivedEmailAliases = emailAliasesData.data.currentUser?.emailAliases || [];

  const generatedAliases: string[] = [];
  await Promise.all(
    receivedEmailAliases.map(async (email) => {
      const [alias] = email.split('@');

      let ensName: string | null | undefined;
      let dotCosmosName: string | null | undefined;
      let dotJunoName: string | null | undefined;
      let solNames: string[] | undefined;

      if (isEthereumAddress(alias)) {
        const { data: ensData } = await client.query<GetEnsNameQuery, GetEnsNameQueryVariables>({
          query: GetEnsNameDocument,
          variables: { ethereumAddress: alias },
          fetchPolicy: 'cache-first'
        });
        ensName = ensData?.getENSName;
      } else if (isCosmosHubAddress(alias)) {
        const { data: cosmosHubIcnsResult } = await client.query<GetIcnsNameQuery, GetIcnsNameQueryVariables>({
          query: GetIcnsNameDocument,
          variables: { cosmosAddress: alias },
          fetchPolicy: 'cache-first'
        });
        dotCosmosName = cosmosHubIcnsResult?.getICNSName;

        const junoAddress = getJunoAddress(alias);
        const { data: junoIcnsResult } = await client.query<GetIcnsNameQuery, GetIcnsNameQueryVariables>({
          query: GetIcnsNameDocument,
          variables: { cosmosAddress: junoAddress },
          fetchPolicy: 'cache-first'
        });
        dotJunoName = junoIcnsResult?.getICNSName;
      } else if (isSolanaAddress(alias)) {
        const { data: bonfidaData } = await client.query<GetBonfidaNamesQuery, GetBonfidaNamesQueryVariables>({
          query: GetBonfidaNamesDocument,
          variables: { solanaAddress: alias },
          fetchPolicy: 'cache-first'
        });
        solNames = bonfidaData?.getBonfidaNames;
      }

      const generatedAlias = generateWalletAliases(email, ensName, dotCosmosName, dotJunoName, solNames);
      generatedAliases.push(...(generatedAlias || []));
    })
  );

  return uniq([...generatedAliases, ...receivedEmailAliases]);
};

const useCurrentUserEmailAliases = () => {
  const { data } = useCurrentUserEmailAliasesQuery();
  const receivedEmailAliases = data?.currentUser?.emailAliases;
  const [emailAliases, setEmailAliases] = useState<string[]>(receivedEmailAliases ?? []);
  // Ensure cache-first network policies so we're not making unnecessary network requests
  const [getBonfidaQuery] = useGetBonfidaNamesLazyQuery({
    fetchPolicy: 'cache-first'
  });
  const [getENSQuery] = useGetEnsNameLazyQuery({
    fetchPolicy: 'cache-first'
  });
  const [getICNSQuery] = useGetIcnsNameLazyQuery({
    fetchPolicy: 'cache-first'
  });

  useEffect(() => {
    async function fetchAliases() {
      if (!receivedEmailAliases) {
        return;
      }
      const generatedAliases: string[] = [];
      await Promise.all(
        receivedEmailAliases.map(async (email) => {
          try {
            const [alias] = email.split('@');

            let ensName: string | null | undefined;
            let dotCosmosName: string | null | undefined;
            let dotJunoName: string | null | undefined;
            let solNames: string[] | undefined;
            if (isEthereumAddress(alias)) {
              const { data: ensData } = await getENSQuery({ variables: { ethereumAddress: alias } });
              ensName = ensData?.getENSName;
            } else if (isCosmosHubAddress(alias)) {
              const { data: cosmosHubIcnsResult } = await getICNSQuery({ variables: { cosmosAddress: alias } });
              dotCosmosName = cosmosHubIcnsResult?.getICNSName;
              const junoAddress = getJunoAddress(alias);
              const { data: junoIcnsResult } = await getICNSQuery({ variables: { cosmosAddress: junoAddress } });
              dotJunoName = junoIcnsResult?.getICNSName;
            } else if (isSolanaAddress(alias)) {
              const { data: bonfidaData } = await getBonfidaQuery({ variables: { solanaAddress: alias } });
              solNames = bonfidaData?.getBonfidaNames;
            }
            const generatedAlias = generateWalletAliases(email, ensName, dotCosmosName, dotJunoName, solNames);
            generatedAliases.push(...(generatedAlias || []));
          } catch (e) {
            console.error(`Error when processing alias ${email}:`, e);
          }
        })
      );
      setEmailAliases(uniq([...generatedAliases, ...receivedEmailAliases]));
    }
    void fetchAliases();
  }, [receivedEmailAliases, getBonfidaQuery, getENSQuery, getICNSQuery]);

  return emailAliases;
};

export default useCurrentUserEmailAliases;
