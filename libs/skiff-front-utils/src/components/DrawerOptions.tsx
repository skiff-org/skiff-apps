import styled from 'styled-components';

export const DrawerOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DrawerBlocksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  gap: 8px;
`;

export const DrawerOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: flex-end;
  width: 100%;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;

  .dropdownItem {
    // remove right/left padding
    padding: 8px 0;
  }
`;
