import { css } from 'styled-components';

export const TimeDateFieldContainer = css`
  width: 100%;
`;

export const TimeDateInputFieldWrapper = css<{ $unfilled?: boolean }>`
  padding-bottom: ${({ $unfilled }) => ($unfilled ? '0' : '4px')};
`;
