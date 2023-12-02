import styled from 'styled-components';

export const SearchInputField = styled.div`
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
`;

export const DropdownBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 4px;
  padding: 8px 4px;
  height: 100%;
  overflow: hidden;
  :hover {
    overflow: auto;
  }
`;

export const DropdownFooter = styled.div`
  width: 100%;
  padding: 16px 4px;
  box-sizing: border-box;
`;
