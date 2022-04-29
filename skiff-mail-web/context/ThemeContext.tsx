import { noop } from 'lodash';
import { createContext, useContext } from 'react';

export type ThemeName = 'light' | 'dark';

// validate type (necessary if older theme still stored in local storage)
export function isOfTypeThemeName(keyInput: string): keyInput is ThemeName {
  return ['light', 'dark'].includes(keyInput);
}

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
};

export const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: noop });

export const useTheme = () => useContext(ThemeContext);
