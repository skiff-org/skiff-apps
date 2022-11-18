import { Typography, CustomCircularProgress } from 'nightwatch-ui';
import { useState } from 'react';
import { TitleActionSection, useLocalSetting } from 'skiff-front-utils';
import { CustomDomainRecord } from 'skiff-graphql';
import styled from 'styled-components';

import { useMaxCustomDomains } from '../../../../hooks/useMaxCustomDomains';

import ManageCustomDomainRow from './ManageCustomDomainRow';

const DomainsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  margin-top: 24px;
  width: 100%;
`;

interface ManageCustomDomainsProps {
  customDomains: CustomDomainRecord[] | undefined;
  loading: boolean;
  refetchCustomDomains: () => void;
}

const ManageCustomDomains: React.FC<ManageCustomDomainsProps> = ({
  loading,
  customDomains,
  refetchCustomDomains
}: ManageCustomDomainsProps) => {
  const [openDropdownID, setOpenDropdownID] = useState<string>();

  const [defaultCustomDomainAlias, setDefaultCustomDomainAlias] = useLocalSetting('defaultCustomDomainAlias');

  const { maxCustomDomains } = useMaxCustomDomains();

  const renderDomainsUsed = () =>
    !loading && maxCustomDomains !== undefined && !!customDomains?.length ? (
      <Typography color='disabled'>
        {customDomains?.length ?? 0}/{maxCustomDomains} domains used
      </Typography>
    ) : (
      <></>
    );

  return (
    <>
      <TitleActionSection
        actions={[
          {
            type: 'custom',
            content: renderDomainsUsed()
          }
        ]}
        subtitle='Manage your Skiff Mail custom domains'
        title='Manage domains'
      />
      {/* Default state: Renders custom domain rows */}
      {!loading && !!customDomains?.length && (
        <DomainsList>
          {customDomains?.map((customDomain) => (
            <ManageCustomDomainRow
              customDomain={customDomain}
              defaultCustomDomainAlias={defaultCustomDomainAlias}
              dropdownOpen={customDomain.domainID === openDropdownID}
              key={customDomain.domainID}
              refetchCustomDomains={refetchCustomDomains}
              setDefaultCustomDomainAlias={setDefaultCustomDomainAlias}
              setDropdownOpen={(open) => setOpenDropdownID(open ? customDomain.domainID : undefined)}
            />
          ))}
        </DomainsList>
      )}
      {/* Error state: Not loading, custom domains undefined */}
      {!loading && customDomains === undefined && (
        <Typography color='destructive'>Failed to load custom domains, please try again later.</Typography>
      )}
      {/* Loading state */}
      {loading && <CustomCircularProgress />}
    </>
  );
};

export default ManageCustomDomains;
