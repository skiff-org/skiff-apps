import { Typography, DropdownItem, Size, IconText, Icon, ThemeMode } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { PopulatedMailboxSearchFilterChip } from '../../../utils/search/searchTypes';

import { getLabelPrefixForSearchFilter } from './MailboxSearch.utils';

const HighlightText = styled.span`
  color: var(--text-always-white);
`;

const OverflowFilterTypogrpahy = styled.div`
  width: fit-content;
  max-width: 100%;
`;
interface OverflowSearchFilterProps {
  filter: PopulatedMailboxSearchFilterChip;
  removeFilter: () => void;
}

export const OverflowSearchFilter: React.FC<OverflowSearchFilterProps> = ({
  filter,
  removeFilter
}: OverflowSearchFilterProps) => {
  const { label } = filter;
  const prefix = getLabelPrefixForSearchFilter(filter.type, true);

  return (
    <DropdownItem
      customLabel={
        <OverflowFilterTypogrpahy>
          <Typography color='secondary' forceTheme={ThemeMode.DARK}>
            {prefix}&nbsp;
            <HighlightText>{label}</HighlightText>
          </Typography>
        </OverflowFilterTypogrpahy>
      }
      endElement={
        <IconText forceTheme={ThemeMode.DARK} onClick={removeFilter} size={Size.SMALL} startIcon={Icon.Close} />
      }
      key={label}
      label={label}
      size={Size.LARGE}
      value={label}
    />
  );
};
