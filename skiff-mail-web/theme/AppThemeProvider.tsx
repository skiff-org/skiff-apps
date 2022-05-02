import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { themeNames } from '@skiff-org/skiff-ui';
import { useEffect, useState } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import { isOfTypeThemeName, ThemeContext, ThemeName } from '../context/ThemeContext';

const GlobalStyles = createGlobalStyle`
  body {
    font-family: 'Skiff Sans Text', sans-serif;
    margin: 0px;
    background: var(--bg-l1-solid);
  },
  .MuiTooltip-tooltip > * {
    font-family: 'Skiff Sans Text', sans-serif;
  }
  .MuiAutocomplete-root .MuiInput-root.MuiInputBase-sizeSmall .MuiInput-input {
    font-size: 15px;
    line-height: 1.33;
  }
  .MuiAutocomplete-root .MuiInput-root.MuiInputBase-sizeSmall .MuiInput-input::placeholder {
    color: var(--text-secondary);
    opacity: 1.0;
  }
  .MuiTooltip-tooltip {
    padding: 0px 12px !important;
    background: var(--bg-emphasis) !important;
    border-radius: 24px !important;
    font-family: 'Skiff Sans Text', sans-serif !important;
    font-size: 13px !important;
    line-height: 20px !important;
    color: var(--text-always-white) !important;
    max-width: none !important;
    backdrop-filter: blur(72px);
    -webkit-backdrop-filter: blur(72px);
  },
  .MuiBottomNavigationAction-label {
    font-size: 17px !important;
    line-height: 24px !important;
  }
`;
const fontTheme = createTheme({
  typography: {
    fontFamily: ['Skiff Sans Text', 'sans-serif'].join(',')
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--bg-scrim)'
        }
      }
    },
    // Name of the component
    MuiButtonBase: {
      // The properties to apply
      defaultProps: {
        disableRipple: true // No more ripple, on the whole application!
      }
    }
  }
});

export const THEME_LOCAL_STORAGE_KEY = 'THEME_MODE';

export const AppThemeProvider: React.FC = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('dark');

  const setTheme = (name: ThemeName) => {
    const themeColor = themeNames[name];
    Object.keys(themeColor).forEach((key) => {
      document.body.style.setProperty(key, themeColor[key as keyof typeof themeColor]);
    });
    setThemeName(name);
  };

  // Get theme from localStorage
  useEffect(() => {
    const storedThemeMode = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);
    if (!storedThemeMode) {
      const darkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeMode = darkOS ? 'dark' : 'light';
      setTheme(themeMode);
      localStorage.setItem(THEME_LOCAL_STORAGE_KEY, themeMode);
    } else if (isOfTypeThemeName(storedThemeMode)) {
      setTheme(storedThemeMode as ThemeName);
    } else {
      // default to light mode
      setTheme('light' as ThemeName);
    }
  }, []);

  // updated `theme` object will be defined by design system and used here
  return (
    <MUIThemeProvider theme={fontTheme}>
      <ThemeProvider theme={{}}>
        <ThemeContext.Provider value={{ theme: themeName, setTheme }}>
          <GlobalStyles />
          {children}
        </ThemeContext.Provider>
      </ThemeProvider>
    </MUIThemeProvider>
  );
};
