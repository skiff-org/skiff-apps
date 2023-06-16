import noop from 'lodash/noop';
import { LocalStorageThemeMode, StorageOnlyThemeMode, ThemeMode, themeNames } from 'nightwatch-ui';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider, createGlobalStyle } from 'styled-components';

import { sendRNWebviewMsg } from '../utils/mobileUtils';

export const THEME_SELECT_VERSION = '0.1.0';

// validate type (necessary if older theme still stored in local storage)
export function isOfTypeThemeName(keyInput: LocalStorageThemeMode) {
  return keyInput === ThemeMode.LIGHT || keyInput === ThemeMode.DARK;
}

type ThemeContextType = {
  // displayed theme
  theme: ThemeMode;
  // theme in local storage
  storedTheme: LocalStorageThemeMode;
  // update theme in local storage
  setStoredTheme: (name: LocalStorageThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: ThemeMode.LIGHT,
  storedTheme: StorageOnlyThemeMode.SYSTEM,
  setStoredTheme: noop
});

export const useTheme = () => useContext(ThemeContext);

export const THEME_LOCAL_STORAGE_KEY = 'THEME_MODE';

const GlobalStyles = createGlobalStyle`
  body {
    font-family: 'Skiff Sans Text', sans-serif;
    -webkit-font-smoothing: antialiased;
    font-smoothing: antialiased;
  }
`;
export const AppThemeProvider: React.FC = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeMode>(ThemeMode.DARK);
  const [storedThemeState, setStoredThemeState] = useState<LocalStorageThemeMode>(StorageOnlyThemeMode.SYSTEM);

  let darkSystemThemeMediaQuery: MediaQueryList | undefined;
  if (typeof window !== 'undefined') {
    darkSystemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  const updateRootData = (theme: ThemeMode) => {
    const themeColor = themeNames[theme];
    Object.keys(themeColor).forEach((key) => {
      document.body.style.setProperty(key, themeColor[key]);
    });
    sendRNWebviewMsg('theme', { theme });
  };

  const updateThemeName = useCallback(
    (name: LocalStorageThemeMode, darkSystemThemeMediaQuery?: MediaQueryList) => {
      setStoredThemeState(name);
      // if name is light or dark, set it to theme
      if (isOfTypeThemeName(name)) {
        setThemeName(name as ThemeMode);
        updateRootData(name as ThemeMode);
      } else if (darkSystemThemeMediaQuery !== undefined) {
        // otherwise parse the system theme
        const themeMode = darkSystemThemeMediaQuery.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
        setThemeName(themeMode);
        updateRootData(themeMode);
      }
    },
    [darkSystemThemeMediaQuery]
  );

  const setStoredTheme = (name: LocalStorageThemeMode) => {
    // update local storage
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, name);
    updateThemeName(name, darkSystemThemeMediaQuery);
  };

  // Get theme from localStorage when app loads
  useEffect(() => {
    // if nothing stored default to system
    const storedThemeMode = (localStorage.getItem(THEME_LOCAL_STORAGE_KEY) as ThemeMode) || StorageOnlyThemeMode.SYSTEM;
    updateThemeName(storedThemeMode, darkSystemThemeMediaQuery);
  }, []);

  // Listen to live system changes
  useEffect(() => {
    if (storedThemeState !== StorageOnlyThemeMode.SYSTEM || darkSystemThemeMediaQuery === undefined) return;
    const updateSystemTheme = () => updateThemeName(StorageOnlyThemeMode.SYSTEM, darkSystemThemeMediaQuery);
    darkSystemThemeMediaQuery.addEventListener('change', updateSystemTheme);
    return () => {
      if (darkSystemThemeMediaQuery === undefined) return;
      darkSystemThemeMediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, [storedThemeState, darkSystemThemeMediaQuery, updateThemeName]);

  // updated `theme` object will be defined by design system and used here
  return (
    <ThemeProvider theme={{}}>
      <ThemeContext.Provider value={{ theme: themeName, setStoredTheme, storedTheme: storedThemeState }}>
        <GlobalStyles />
        {children}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};
