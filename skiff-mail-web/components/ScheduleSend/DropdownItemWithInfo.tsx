import { themeNames, Typography } from 'nightwatch-ui';
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
        <Typography level={3} themeMode='dark' type='heading'>
          {label}
        </Typography>
        <Typography color='secondary' level={3} themeMode='dark' type='paragraph'>
          {info}
        </Typography>
      </div>
    </DropdownItem>
  );
};

export default DropdownItemWithInfo;
