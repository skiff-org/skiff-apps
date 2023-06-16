import { ThemeMode } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

export type FeatureTableColumnEndProps = {
  theme: ThemeMode;
  isTop?: boolean;
  showEssential?: boolean;
};

/**
 * Creates the rounded ends of the highlight
 * column placed on the 'Popular' tier. Four divs correspond
 * to four grid columns.
 */

const ColumnEnd = styled.div<{ theme: ThemeMode; isTop?: boolean; showEssential?: boolean }>`
  &:nth-child(${(props) => (props.showEssential ? '5n-2' : '4n-1')}) {
    background: ${(props) => (props.theme === ThemeMode.LIGHT ? 'var(--bg-l0-solid)' : 'var(--bg-l1-solid)')};
    height: 24px;
    border-radius: ${(props) => (props.isTop ? '12px 12px 0 0' : '0 0 12px 12px')};
`;

const FeatureTableColumnEnd = ({ isTop, theme, showEssential }: FeatureTableColumnEndProps) => {
  // when showing the Essential plan, there are five columns in the table; otherwise 4
  const numComponents = showEssential ? 5 : 4;
  return (
    <>
      {Array.from({ length: numComponents }, (_, i) => (
        <ColumnEnd isTop={isTop} key={`column-end-${i}`} showEssential={showEssential} theme={theme} />
      ))}
    </>
  );
};
export default FeatureTableColumnEnd;
