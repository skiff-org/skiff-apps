import styled from 'styled-components';

export const DrawerOptions = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
`;

export const DrawerOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: flex-end;
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  cursor: pointer;
  &:active {
    background: var(--bg-scrim);
  }
`;
