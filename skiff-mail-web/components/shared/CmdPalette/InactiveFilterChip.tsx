import { Chip, Icons } from 'nightwatch-ui';

import { SearchFilter, getIconFromFilterValue } from '../../../utils/searchWorkerUtils';

interface Props {
  filter: SearchFilter;
  applyFilter: (filter: SearchFilter) => void;
}

export const InactiveFilterChip = ({ filter, applyFilter }: Props) => {
  const chipIcon = getIconFromFilterValue(filter.filter.filterValue);
  return (
    <Chip
      color='white'
      label={filter.subject}
      onClick={() => {
        applyFilter(filter);
      }}
      startIcon={<Icons color='white' icon={chipIcon} size='small' />}
      themeMode='dark'
      typographyType='label'
    />
  );
};
