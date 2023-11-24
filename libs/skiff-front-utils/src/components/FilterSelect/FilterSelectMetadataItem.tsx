import { DropdownItem, Size, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import styled from 'styled-components';

const EndAdornment = styled.div`
  display: flex;
`;

interface FilterSelectMetadataItemProps {
  numActiveFilters: number;
  clearAllFilters: () => void;
}

export const FilterSelectMetadataItem: React.FC<FilterSelectMetadataItemProps> = ({
  numActiveFilters,
  clearAllFilters
}: FilterSelectMetadataItemProps) => {
  const [clearAllHover, setClearAllHover] = useState(false);
  const label = `${pluralize('filter', numActiveFilters, true)} applied`;

  const renderFilterInfoText = (text: string, isHovered?: boolean, onClick?: () => void) => (
    <Typography
      color={isHovered ? 'link' : 'secondary'}
      forceTheme={ThemeMode.DARK}
      mono
      onClick={onClick}
      size={TypographySize.CAPTION}
      uppercase
    >
      {text}
    </Typography>
  );

  return (
    <DropdownItem
      customLabel={renderFilterInfoText(label)}
      endElement={
        <EndAdornment onMouseLeave={() => setClearAllHover(false)} onMouseOver={() => setClearAllHover(true)}>
          {renderFilterInfoText('Clear all', clearAllHover, clearAllFilters)}
        </EndAdornment>
      }
      label={label}
      size={Size.MEDIUM}
    />
  );
};
