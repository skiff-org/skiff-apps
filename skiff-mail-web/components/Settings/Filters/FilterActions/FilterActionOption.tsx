import { Typography, IconText, Icon, TypographyWeight } from 'nightwatch-ui';
import { RefObject } from 'react';
import styled from 'styled-components';

const FilterActionOptionRowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface FilterActionOptionProps {
  label: string;
  onClick: () => void;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  selectedOption?: string;
}

export const FilterActionOption: React.FC<FilterActionOptionProps> = ({
  label,
  onClick,
  buttonRef,
  selectedOption
}: FilterActionOptionProps) => {
  return (
    <FilterActionOptionRowContainer>
      <Typography>{label}</Typography>
      <IconText
        endIcon={Icon.ChevronDown}
        label={selectedOption ?? 'None'}
        onClick={onClick}
        ref={buttonRef}
        weight={TypographyWeight.REGULAR}
      />
    </FilterActionOptionRowContainer>
  );
};
