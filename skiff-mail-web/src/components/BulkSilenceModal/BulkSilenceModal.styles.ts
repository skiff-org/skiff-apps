import styled from 'styled-components';

export const OneThirdCol = styled.div`
  width: 33%;
  display: flex;
  justify-content: flex-end;
  box-sizing: border-box;
  overflow: hidden;
`;

export const TwoThirdCol = styled.div<{ $paddingLeft?: number }>`
  width: ${({ $paddingLeft }) => `calc(66% - ${!!$paddingLeft ? 12 : 0}px)`};
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-left: ${({ $paddingLeft }) => $paddingLeft || 0}px;
  gap: 12px;
  box-sizing: border-box;
`;

export const CheckboxContainer = styled.div`
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

export const TitleSubtitle = styled.div`
  display: flex;
  flex-direction: column;
`;

export const IconContainer = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg-l2-solid);
  border: 1px solid var(--border-primary);
  border-bottom-width: 2px;
`;
