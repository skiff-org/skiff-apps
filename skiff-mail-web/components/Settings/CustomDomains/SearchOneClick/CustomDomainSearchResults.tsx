import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import range from 'lodash/range';
import uniq from 'lodash/uniq';
import { Alignment, ThemeMode, Typography } from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { useGetDomainSuggestionsLazyQuery, useCheckIfDomainsAvailableLazyQuery } from 'skiff-front-graphql';
import { useGetOrganizationQuery } from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  Illustration,
  Illustrations,
  splitEmailToAliasAndDomain,
  useDefaultEmailAlias,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import {
  domainRegex,
  sanitizeDomain,
  EXAMPLE_CUSTOM_DOMAIN,
  MinimumCustomDomainPriceFeatureFlag,
  CustomDomainPriceExperimentGroup
} from 'skiff-utils';
import styled from 'styled-components';

import { storeWorkspaceEvent } from '../../../../utils/userUtils';

import {
  CustomDomainSearchRow,
  CustomDomainSearchRowProps,
  LoadingCustomDomainSearchRow
} from './CustomDomainSearchRow';

const NUMBER_ROWS_SHOWN = 10;
const ROW_HEIGHT_IN_PX = 72;

const Container = styled(motion.ul)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  overflow: hidden;

  width: 100%;
  max-height: 812px;
  padding: 8px;
  margin: 0;
  background: var(--bg-emphasis);

  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-l3);
`;

const CenteredWrapper = styled(motion.div)`
  width: 100%;
  height: ${ROW_HEIGHT_IN_PX * NUMBER_ROWS_SHOWN}px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CenteredContent = styled.div`
  width: 384px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface CustomDomainSearchResultsProps {
  searchQuery: string;
}

const CustomDomainSearchResults: React.FC<CustomDomainSearchResultsProps> = ({ searchQuery }) => {
  const [getDomainSuggestions] = useGetDomainSuggestionsLazyQuery();
  const [checkIfDomainsAvailable] = useCheckIfDomainsAvailableLazyQuery();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CustomDomainSearchRowProps['domainResult'][]>();
  const user = useRequiredCurrentUserData();
  const { userID, rootOrgID, publicData } = user;
  const { data: org } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const featureFlags = useFlags();
  const hasMinimumCustomDomainPrice = featureFlags.minimumCustomDomainPrice as MinimumCustomDomainPriceFeatureFlag;

  const getSearchDomain = () => {
    let searchDomain = searchQuery;
    // Suggest workspace name or display name
    const { alias } = splitEmailToAliasAndDomain(defaultEmailAlias);

    if (!searchDomain) {
      searchDomain = org?.organization.name || publicData?.displayName || alias || '';
    }

    if (!searchDomain) {
      return EXAMPLE_CUSTOM_DOMAIN;
    }

    const searchDomainLower = sanitizeDomain(searchDomain.toLowerCase()); //strip out invalid characters
    const isValidDomain = domainRegex.test(searchDomainLower);
    if (isValidDomain) {
      return searchDomainLower;
    }
    return `${searchDomainLower}.com`;
  };
  const searchDomain = getSearchDomain();

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const { data: domainSuggestionsQueryData } = await getDomainSuggestions({
          variables: {
            domain: searchDomain,
            limit: 20
          }
        });

        const suggestions = domainSuggestionsQueryData?.getDomainSuggestions.domains ?? [];
        const domainsQuery = [searchDomain, ...suggestions];
        const { data: domainsAvailableQueryData } = await checkIfDomainsAvailable({
          variables: {
            domains: uniq(domainsQuery)
          }
        });
        const domainResults = domainsAvailableQueryData?.checkIfDomainsAvailable.domains ?? [];
        const filteredResults = domainResults.filter(({ available, domain }) => available || domain === searchDomain);
        setResults(filteredResults);
        if (!!filteredResults.length) {
          void storeWorkspaceEvent(
            WorkspaceEventType.CustomDomainSuggestionsShown,
            hasMinimumCustomDomainPrice
              ? CustomDomainPriceExperimentGroup.TREATMENT
              : CustomDomainPriceExperimentGroup.CONTROL,
            DEFAULT_WORKSPACE_EVENT_VERSION
          );
        }
      } catch (e) {
        setResults([]);
      }
      setLoading(false);
    }
    if (searchDomain) {
      void fetchResults();
    } else {
      setResults([]);
    }
  }, [searchDomain, getDomainSuggestions, checkIfDomainsAvailable, hasMinimumCustomDomainPrice]);

  if (loading) {
    return (
      <Container>
        {range(NUMBER_ROWS_SHOWN).map((i) => (
          <LoadingCustomDomainSearchRow key={`loading-custom-domain-row-${i}`} />
        ))}
      </Container>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <AnimateSharedLayout>
      <Container layout transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        {range(NUMBER_ROWS_SHOWN).map((i) => {
          const domainResult = results[i];
          return (
            <AnimatePresence key={`custom-domain-search-result=${i}`}>
              {domainResult && <CustomDomainSearchRow domainResult={domainResult} />}
            </AnimatePresence>
          );
        })}
        {!results.length && (
          <AnimatePresence>
            <CenteredWrapper
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              layout
              transition={{ duration: 0.2 }}
            >
              <CenteredContent>
                {!searchQuery ? (
                  <Illustration illustration={Illustrations.CustomizeProfile} />
                ) : (
                  <Illustration illustration={Illustrations.NoResultsFound} />
                )}
                <Typography align={Alignment.CENTER} forceTheme={ThemeMode.DARK}>
                  {!searchQuery ? 'Customize your profile' : 'No results found'}
                </Typography>
                <Typography align={Alignment.CENTER} color='secondary' forceTheme={ThemeMode.DARK} wrap>
                  {!searchQuery
                    ? 'To get domain suggestions relevant to you, update your personal display name or workspace title.'
                    : `Sorry, we couldn’t find any available domains matching ${searchQuery}.`}
                </Typography>
              </CenteredContent>
            </CenteredWrapper>
          </AnimatePresence>
        )}
      </Container>
    </AnimateSharedLayout>
  );
};

export default CustomDomainSearchResults;
