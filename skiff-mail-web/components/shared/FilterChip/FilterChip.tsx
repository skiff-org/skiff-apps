import { Chip, Icons, IconColor, Size, ThemeMode, TypographyWeight } from '@skiff-org/skiff-ui';
import React from 'react';
import { formatEmailAddress, getAddressTooltipLabel, useGetFF, UserAvatar } from 'skiff-front-utils';
import { AddressObject, UserLabel } from 'skiff-graphql';
import { GmailImportImprovementsFlag, upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';
import { SearchFilter, SearchFilterType, getIconFromFilter, FilterByType } from '../../../utils/searchWorkerUtils';

interface FilterChipProps {
  searchFilter: SearchFilter;
  userLabels: UserLabel[];
  onDelete?: () => void;
  formatLabel?: boolean;
  prefix?: string;
  noBorder?: boolean;
}

const InChipPrefixText = styled.span`
  font-weight: 380;
`;

const FilterChip: React.FC<FilterChipProps> = ({
  searchFilter,
  userLabels,
  onDelete,
  formatLabel,
  prefix,
  noBorder
}) => {
  const hasGmailImportImprovementsFF = useGetFF<GmailImportImprovementsFlag>('gmailImportImprovements');

  const { subject, filter } = searchFilter;
  const { filterType, filterValue } = filter;
  const isAddressFilter = filterType === SearchFilterType.FromAddress || filterType === SearchFilterType.ToAddress;
  const isUserLabelOrFolderFilter =
    filterType === SearchFilterType.UserLabel ||
    (filterType === SearchFilterType.Category &&
      (filterValue === FilterByType.Folders || filterValue === FilterByType.Labels));
  const displayPictureData = useDisplayPictureDataFromAddress(filterValue as AddressObject);
  const getStartIcon = () => {
    const { icon, color } = getIconFromFilter(filter, userLabels, hasGmailImportImprovementsFF);
    return <Icons color={(color as IconColor) ?? 'white'} icon={icon} size={Size.SMALL} />;
  };
  const emailAddress = formatLabel ? formatEmailAddress(subject) : subject;
  const applyPrefix = (label: string) => (
    //Label text will render as 'label' type Typography and prefix text will override with 'paragraph' type
    <>
      <InChipPrefixText>{`${prefix ?? ''} `}</InChipPrefixText>
      <span>{label}</span>
    </>
  );
  const getChipLabel = () => {
    if (isAddressFilter) {
      return prefix ? applyPrefix(emailAddress) : emailAddress;
    } else if (isUserLabelOrFolderFilter) {
      return prefix ? applyPrefix(subject) : subject;
    } else {
      return prefix ? applyPrefix(upperCaseFirstLetter(subject)) : upperCaseFirstLetter(subject);
    }
  };
  return (
    <Chip
      avatar={
        isAddressFilter ? (
          <UserAvatar displayPictureData={displayPictureData} forceTheme={ThemeMode.DARK} label={subject} />
        ) : undefined
      }
      color='white'
      forceTheme={ThemeMode.DARK}
      icon={isAddressFilter ? undefined : getStartIcon()}
      key={subject}
      label={getChipLabel()}
      noBorder={noBorder}
      onDelete={onDelete}
      size={Size.SMALL}
      tooltip={isAddressFilter && formatLabel ? getAddressTooltipLabel(subject) : undefined}
      typographyWeight={TypographyWeight.MEDIUM}
    />
  );
};

export default FilterChip;
