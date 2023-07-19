import { ThemeMode, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

type SectionHeaderProps = {
  sectionName: string;
  theme: ThemeMode;
  isFirstSectionHeader?: boolean;
  showEssential?: boolean;
};

const SectionHeaderRow = styled.div<{ theme: ThemeMode; showEssential?: boolean; isFirstSectionHeader?: boolean }>`
  display: flex;
  padding-top: ${(props) => (props.isFirstSectionHeader ? '16px' : '48px')};
  height: 24px;
  &:nth-child(${(props) => (props.showEssential ? '5n-2' : '4n-1')}) {
    background: ${(props) => (props.theme === ThemeMode.LIGHT ? 'var(--bg-l0-solid)' : 'var(--bg-l1-solid)')};
`;

/**
 * Label that separates sections of multiple features
 * (e.g. Mail and Pages features)
 */
function FeatureTableSectionHeader({ sectionName, theme, showEssential, isFirstSectionHeader }: SectionHeaderProps) {
  // when showing the Essential plan, there are five columns in the table; otherwise 4
  const numComponents = showEssential ? 5 : 4;
  return (
    <>
      {Array.from({ length: numComponents }, (_, i) => (
        <SectionHeaderRow
          isFirstSectionHeader={isFirstSectionHeader}
          key={`section-header-${sectionName}-${i}`}
          showEssential={showEssential}
          theme={theme}
        >
          {/* only the first column in the grid has copy */}
          {i === 0 && (
            <Typography mono uppercase size={TypographySize.MEDIUM} weight={TypographyWeight.MEDIUM}>
              {sectionName}
            </Typography>
          )}
        </SectionHeaderRow>
      ))}
    </>
  );
}

export default FeatureTableSectionHeader;
