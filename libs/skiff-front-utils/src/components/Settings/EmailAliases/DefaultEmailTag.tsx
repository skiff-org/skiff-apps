import { colors, ThemeMode, Typography, TypographySize } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

import { useTheme } from '../../../theme/AppThemeProvider';

const DefaultTag = styled.div<{ $isDarkMode?: boolean }>`
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2px 5px;
  background: ${({ $isDarkMode }) =>
    $isDarkMode ? 'var(--accent-orange-secondary)' : `rgb(${colors['--orange-100']})`};
  box-shadow: var(--secondary-button-border);
  border-radius: 4px;
`;

const DefaultEmailTag: React.FC = () => {
  const { theme } = useTheme();
  return (
    <DefaultTag $isDarkMode={theme === ThemeMode.DARK}>
      <Typography mono uppercase color='link' size={TypographySize.SMALL}>
        DEFAULT
      </Typography>
    </DefaultTag>
  );
};

export default DefaultEmailTag;
