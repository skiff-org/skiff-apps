import { Dropdown } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

export const StyledDropdown = styled(Dropdown)`
  .surface.optionMenu {
    padding: 0px;
  }
`;

export const SearchInputField = styled.div`
  margin: 8px;
`;

export const DropdownBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 4px;
  padding: 8px 4px;
  height: 100%;
  overflow: auto;
`;

export const DropdownFooter = styled.div`
  padding: 8px 4px;
  width: 100%;
  box-sizing: border-box;
`;
