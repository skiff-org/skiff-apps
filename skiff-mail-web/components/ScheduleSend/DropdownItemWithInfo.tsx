import { ThemeMode, themeNames, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import { FC } from 'react';
import styled from 'styled-components';

interface DropdownItemWithInfoProps {
  info: string;
  label: string;
  onClick: () => void;
}

const DropdownItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px;
  height: 50px;
  width: 100%;
  border-radius: 8px;
  flex: none;
  box-sizing: border-box;
  align-self: stretch;
  flex-grow: 0;
  margin: 0px 0px;
  :hover {
    background: ${themeNames.dark['--bg-cell-hover']};
  }
`;

const DropdownItemWithInfo: FC<DropdownItemWithInfoProps> = ({ label, info, onClick }) => {
  return (
    <DropdownItem onClick={onClick}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          mono
          uppercase
          forceTheme={ThemeMode.DARK}
          size={TypographySize.SMALL}
          weight={TypographyWeight.BOLD}
        >
          {label}
        </Typography>
        <Typography
          mono
          uppercase
          color='secondary'
          forceTheme={ThemeMode.DARK}
          size={TypographySize.SMALL}
          weight={TypographyWeight.REGULAR}
        >
          {info}
        </Typography>
      </div>
    </DropdownItem>
  );
};

export default DropdownItemWithInfo;
