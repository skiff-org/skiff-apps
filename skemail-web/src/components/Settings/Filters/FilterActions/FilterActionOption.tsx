import { Typography, IconText, Icon, TypographyWeight, Toggle } from 'nightwatch-ui';
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
  buttonRef?: RefObject<HTMLDivElement> | undefined;
  selectedOption?: string | boolean;
  isToggle?: boolean;
}

export const FilterActionOption: React.FC<FilterActionOptionProps> = ({
  label,
  onClick,
  buttonRef,
  selectedOption,
  isToggle
}: FilterActionOptionProps) => {
  if (!buttonRef && !isToggle) return null;

  return (
    <FilterActionOptionRowContainer>
      <Typography>{label}</Typography>
      {buttonRef && (
        <IconText
          endIcon={Icon.ChevronDown}
          label={selectedOption ?? 'None'}
          onClick={onClick}
          ref={buttonRef}
          weight={TypographyWeight.REGULAR}
        />
      )}
      {isToggle && <Toggle checked={!!selectedOption} onChange={onClick} />}
    </FilterActionOptionRowContainer>
  );
};
