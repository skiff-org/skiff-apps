import partition from 'lodash/partition';
import {
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconText,
  InputField,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useEffect, useRef, useState } from 'react';
import {
  FullAliasInfo,
  useGetFullAliasInfoQuery,
  useGetUserQuickAliasDomainsQuery,
  useGetUserQuickAliasesQuery,
  useUpdateEmailAliasSendReceiveEnabledStateMutation,
  useUpdateQuickAliasActiveStateMutation
} from 'skiff-front-graphql';
import {
  Checkbox,
  ConfirmModal,
  TitleActionSection,
  compareAlphabetically,
  simpleSubStringSearchFilter,
  useAsyncHcaptcha,
  useToast
} from 'skiff-front-utils';
import styled from 'styled-components';

import { QUICK_ALIAS_POLL_INTERVAL, QuickAliasSortLabels } from './QuickAlias.constants';
import { QuickAliasSortLabel, QuickAliasSortMode } from './QuickAlias.types';
import QuickAliasEmpty from './QuickAliasEmpty';
import QuickAliasListRow from './QuickAliasListRow';

const ALIAS_ROW_HEIGHT = 56;

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

const AliasListTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-tertiary);
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-tertiary);
`;
const CheckboxLabel = styled.div`
  gap: 12px;
  display: flex;
  align-items: center;
`;

const ListSection = styled.div<{ $isEmpty?: boolean; $isLoading?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: ${(props) => (props.$isEmpty ? 24 : 0)}px;
  box-sizing: border-box;
  gap: ${(props) => (props.$isLoading ? 4 : 0)}px;
`;

const TableActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailAliasRow = styled.div<{ $isLastRow?: boolean; $selected?: boolean }>`
  display: flex;
  height: ${ALIAS_ROW_HEIGHT}px;
  cursor: pointer;
  padding: 12px;
  box-sizing: border-box;
  align-items: center;
  border-bottom: 1px solid var(--border-tertiary);
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : '')};
  :hover {
    background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'var(--bg-overlay-quaternary);')};
  }
  justify-content: space-between;
`;

const SearchBarEndAdornment = styled.div``;

interface QuickAliasListProps {
  selectedQuickAlias: FullAliasInfo | undefined;
  setSelectedQuickAlias: (alias: FullAliasInfo) => void;
}

const QuickAliasList: React.FC<QuickAliasListProps> = ({
  selectedQuickAlias,
  setSelectedQuickAlias
}: QuickAliasListProps) => {
  const sortRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLInputElement>(null);
  const [openSortDropdown, setOpenSortDropdown] = useState(false);
  const [checkedAliases, setCheckedAliases] = useState<Record<string, boolean> | null>(null);
  const [searchString, setSearchString] = useState('');
  const [searchEndAdornmentHover, setSearchEndAdornmentHover] = useState(false);
  const [showDeleteAlias, setShowDeleteAlias] = useState<boolean>(false);
  const [showDisableAlias, setShowDisableAlias] = useState<boolean>(false);
  const { data: quickAliasData, refetch } = useGetUserQuickAliasesQuery({
    pollInterval: QUICK_ALIAS_POLL_INTERVAL
  });
  const { data: listData, loading: listLoading } = useGetFullAliasInfoQuery();
  const quickAliases = quickAliasData?.currentUser?.quickAliases?.map((alias) => alias.alias) || [];

  const { enqueueToast } = useToast();
  const [updateQuickAliasActiveState] = useUpdateQuickAliasActiveStateMutation();
  const { data: domainData } = useGetUserQuickAliasDomainsQuery();

  const [updateEmailAliasSendReceiveEnabledState] = useUpdateEmailAliasSendReceiveEnabledStateMutation();
  const [hcaptchaToken, setHcaptchaToken] = useState<string>('');

  const { requestHcaptchaToken } = useAsyncHcaptcha(true);

  useEffect(() => {
    // get a token to send later when sending a message
    const getHcaptchaToken = async () => {
      try {
        const token = await requestHcaptchaToken();
        setHcaptchaToken(token);
      } catch (error) {
        console.error('Failed to get hcaptcha token', error);
      }
    };
    if (!hcaptchaToken) {
      void getHcaptchaToken();
    }
  }, [hcaptchaToken, requestHcaptchaToken]);

  const [sortMode, setSortMode] = useState<QuickAliasSortMode | null>(null);
  const activeSortOption: QuickAliasSortLabel | undefined = sortMode ? QuickAliasSortLabels[sortMode] : undefined;
  const fallbackSortOption = QuickAliasSortLabels[QuickAliasSortMode.AlphabeticalAscend];

  const noQuickAliases = !quickAliases.length && !listLoading;
  const areAllSelected =
    !!checkedAliases && !!quickAliases && !quickAliases.some((quickAlias) => !checkedAliases[quickAlias]);
  const anySelected = !!checkedAliases && Object.values(checkedAliases).some((value) => value);
  const someSelected = !areAllSelected && anySelected;

  const onSelectAll = () => {
    setCheckedAliases((prevCheckedAliases) => {
      if (!prevCheckedAliases || !areAllSelected) {
        return quickAliases.reduce((checkedData, alias) => ({ ...checkedData, [alias]: !someSelected }), {});
      }
      return null;
    });
  };

  const onSelectAlias = (quickAlias: string) => {
    setCheckedAliases((prevCheckedAliases) => {
      return { ...prevCheckedAliases, [quickAlias]: !prevCheckedAliases?.[quickAlias] };
    });
  };

  useEffect(() => {
    void refetch();
  }, []);

  const searchStringFilteredAliases = simpleSubStringSearchFilter(quickAliases, searchString);

  const quickAliasInfoArray: FullAliasInfo[] = searchStringFilteredAliases.map((alias) => {
    const dataForAlias = listData?.fullAliasInfo?.find((aliasInfo) => aliasInfo.emailAlias === alias);
    return {
      createdAt: new Date(), // fallback date if alias not found
      ...dataForAlias,
      emailAlias: alias,
      isDisabled:
        quickAliasData?.currentUser?.quickAliases?.find((quickAlias) => quickAlias.alias === alias)
          ?.isSendingAndReceivingEnabled === false
    };
  });

  const sortAlphabetically = (unsortedAliases: FullAliasInfo[], descending?: boolean) => {
    return [...unsortedAliases].sort((a, b) => {
      const nameA = a.displayName || a.emailAlias;
      const nameB = b.displayName || b.emailAlias;
      const comparison = compareAlphabetically(nameA, nameB);
      return descending ? -comparison : comparison;
    });
  };

  const sortDate = (unsortedAliases: FullAliasInfo[], descending?: boolean) => {
    return [...unsortedAliases].sort((a, b) => {
      const dateA = typeof a.createdAt === 'number' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'number' ? new Date(b.createdAt) : b.createdAt;
      const comparison = dateA.getTime() - dateB.getTime();
      return descending ? -comparison : comparison;
    });
  };

  const sortAliases = (unsortedAliases: FullAliasInfo[]) => {
    switch (sortMode) {
      case QuickAliasSortMode.AlphabeticalDescend:
        return sortAlphabetically(unsortedAliases, true);
      case QuickAliasSortMode.DateAscend:
        return sortDate(unsortedAliases);
      default:
        return sortAlphabetically(unsortedAliases);
    }
  };

  const selectedAliasesStates = checkedAliases
    ? Object.keys(checkedAliases)
        .filter((alias) => checkedAliases[alias])
        .map((alias) => {
          const aliasInfo = quickAliasInfoArray?.find((info) => info.emailAlias === alias);
          return aliasInfo?.isDisabled || false;
        })
    : [];

  const allSelectedDisabled = selectedAliasesStates.every((state) => state);
  const allSelectedEnabled = selectedAliasesStates.every((state) => !state);
  const isMixedState = !allSelectedDisabled && !allSelectedEnabled;

  const disableAlias = async (enable?: boolean) => {
    if (!checkedAliases) {
      return;
    }

    const selectedAliases = Object.keys(checkedAliases).filter((alias) => checkedAliases[alias]);

    // Map over all selected aliases and return an array of promises
    const promises = selectedAliases.map((alias) =>
      updateEmailAliasSendReceiveEnabledState({
        variables: {
          request: {
            emailAlias: alias,
            enabled: enable ?? false
          }
        }
      }).catch(() => {
        enqueueToast({
          title: `Failed to ${enable ? 'enable' : 'disable'} ${alias || 'Quick Alias'}`,
          body: 'Please try again later.'
        });
      })
    );

    // Wait for all promises to resolve or reject
    await Promise.all(promises);
    if (selectedAliases.length > 1) {
      enqueueToast({
        title: `Successfully ${enable ? 'enabled' : 'disabled'} ${selectedAliases.length} aliases.`
      });
    } else {
      enqueueToast({
        title: `Successfully ${enable ? 'enabled' : 'disabled'} ${selectedAliases[0] || 'Quick Alias'}`
      });
    }
    setShowDisableAlias(false);
    void refetch();
  };

  const deleteAlias = async () => {
    if (!checkedAliases) {
      return;
    }

    const selectedAliases = Object.keys(checkedAliases).filter((alias) => checkedAliases[alias]);

    // Map over all selected aliases and return an array of promises
    const promises = selectedAliases.map((alias) => {
      const userDomainID = domainData?.currentUser?.anonymousSubdomains?.find(
        (domain) => domain.domain === alias.split('@')[1]
      )?.domainID;
      if (!userDomainID) return;
      updateQuickAliasActiveState({
        variables: {
          request: {
            emailAlias: alias,
            captchaToken: hcaptchaToken,
            userDomainID,
            isActive: false
          }
        }
      }).catch(() => {
        enqueueToast({
          title: `Failed to delete ${alias || 'Quick Alias'}`,
          body: 'Please try again later.'
        });
      });
    });

    // Wait for all promises to resolve or reject
    await Promise.all(promises);
    if (selectedAliases.length > 1) {
      enqueueToast({
        title: `Successfully deleted ${selectedAliases.length} aliases.`
      });
    } else {
      enqueueToast({
        title: `Successfully deleted${selectedAliases[0] || 'Quick Alias'}`
      });
    }
    setShowDeleteAlias(false);
    void refetch();
  };

  const sortedAliases = sortAliases(quickAliasInfoArray);
  const [sortedActiveAliases, sortedDisabledAliases] = partition(sortedAliases, (alias) => !alias.isDisabled);
  const numChecked = !!checkedAliases ? Object.values(checkedAliases).filter((checked) => !!checked).length : 0;
  return (
    <>
      <TitleActionSection
        subtitle='Create just-in-time email aliases whenever a service asks for your address.'
        title='Aliases' //called merely "aliases" here to avoid repetition with setting title
      />
      <InputField
        autoFocus
        endAdornment={
          searchString ? (
            <SearchBarEndAdornment
              onMouseLeave={() => setSearchEndAdornmentHover(false)}
              onMouseOver={() => setSearchEndAdornmentHover(true)}
            >
              <Typography color={searchEndAdornmentHover ? 'primary' : 'secondary'} onClick={() => setSearchString('')}>
                Clear
              </Typography>
            </SearchBarEndAdornment>
          ) : undefined
        }
        innerRef={searchBarRef}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchString(e.target.value);
        }}
        placeholder='Search for aliases'
        value={searchString}
      />
      <AliasListTable>
        <TableHeader>
          <CheckboxLabel>
            <Checkbox
              checked={areAllSelected}
              indeterminate={someSelected}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
            />
            {!anySelected && (
              <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase>
                Name
              </Typography>
            )}
            {anySelected && (
              <TableActions>
                <IconText
                  color='secondary'
                  disabled={isMixedState}
                  onClick={() => {
                    setShowDisableAlias(true);
                  }}
                  startIcon={allSelectedDisabled ? Icon.CheckCircle : Icon.Remove}
                />
                <IconText
                  color='destructive'
                  onClick={() => {
                    setShowDeleteAlias(true);
                  }}
                  startIcon={Icon.Trash}
                />
              </TableActions>
            )}
          </CheckboxLabel>
          <IconText
            endIcon={Icon.ChevronDown}
            label={activeSortOption?.label || 'Sort by'}
            onClick={() => {
              setOpenSortDropdown((prev) => !prev);
            }}
            ref={sortRef}
            variant={FilledVariant.FILLED}
            weight={TypographyWeight.REGULAR}
          />
          <Dropdown
            buttonRef={sortRef}
            gapFromAnchor={6}
            portal
            setShowDropdown={setOpenSortDropdown}
            showDropdown={openSortDropdown}
            width={225}
          >
            {Object.keys(QuickAliasSortLabels).map((option) => {
              const sortOption = QuickAliasSortLabels[option as QuickAliasSortMode];
              return (
                <DropdownItem
                  active={
                    sortOption.label === activeSortOption?.label ||
                    (!activeSortOption && sortOption.label === fallbackSortOption.label)
                  }
                  icon={sortOption.icon}
                  key={sortOption.key}
                  label={sortOption.label}
                  onClick={() => {
                    setOpenSortDropdown(false);
                    setSortMode(option as QuickAliasSortMode);
                  }}
                />
              );
            })}
          </Dropdown>
        </TableHeader>
        <ListSection $isEmpty={noQuickAliases} $isLoading={listLoading}>
          {noQuickAliases && <QuickAliasEmpty />}
          {listLoading && <></>}
          {!noQuickAliases && (
            <>
              {sortedActiveAliases.length > 0 &&
                sortedActiveAliases.map((aliasData, index) => {
                  return (
                    <QuickAliasListRow
                      isChecked={!!checkedAliases?.[aliasData.emailAlias]}
                      isLast={index === sortedActiveAliases.length - 1}
                      isSelected={selectedQuickAlias?.emailAlias === aliasData.emailAlias}
                      key={aliasData.emailAlias}
                      onSelectAlias={onSelectAlias}
                      quickAlias={aliasData}
                      setSelectedQuickAlias={setSelectedQuickAlias}
                    />
                  );
                })}
              {sortedDisabledAliases.length > 0 && (
                <>
                  <SectionHeader>
                    <Typography color='secondary' selectable={false}>
                      Disabled Quick Aliases
                    </Typography>
                  </SectionHeader>
                  {sortedDisabledAliases.map((aliasData, index) => {
                    return (
                      <>
                        <QuickAliasListRow
                          isChecked={!!checkedAliases?.[aliasData.emailAlias]}
                          isLast={index === sortedDisabledAliases.length - 1}
                          isSelected={selectedQuickAlias?.emailAlias === aliasData.emailAlias}
                          key={aliasData.emailAlias}
                          onSelectAlias={onSelectAlias}
                          quickAlias={aliasData}
                          setSelectedQuickAlias={setSelectedQuickAlias}
                        />
                      </>
                    );
                  })}
                </>
              )}
              {/** If this array is empty and user has Quick Aliases, then nothing matched the search filter */}
              {!quickAliasInfoArray.length && (
                <EmailAliasRow>
                  <Typography color='secondary'>No aliases match that search</Typography>
                </EmailAliasRow>
              )}
            </>
          )}
        </ListSection>
      </AliasListTable>
      <ConfirmModal
        confirmName='Delete'
        description='This cannot be undone.'
        destructive
        onClose={() => setShowDeleteAlias(false)}
        onConfirm={deleteAlias}
        open={showDeleteAlias}
        title={`Delete ${pluralize('Quick Alias', numChecked)}?`}
      />
      <ConfirmModal
        confirmName={allSelectedDisabled ? 'Enable' : 'Disable'}
        description={
          allSelectedDisabled
            ? `Re-enable ${pluralize('these aliases', numChecked)} to receive emails from ${pluralize(
                'them',
                numChecked
              )} again.`
            : `You will not receive any emails from ${pluralize(
                'these aliases',
                numChecked
              )}. You can re-enable in settings anytime.`
        }
        destructive={!allSelectedDisabled}
        onClose={() => setShowDisableAlias(false)}
        onConfirm={async () => {
          await disableAlias(allSelectedDisabled);
          void refetch();
        }}
        open={showDisableAlias}
        title={`${allSelectedDisabled ? 'Enable' : 'Disable'} ${pluralize('Quick Alias', numChecked)}?`}
      />
    </>
  );
};

export default QuickAliasList;
