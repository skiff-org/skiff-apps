import { ApolloProvider } from '@apollo/client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageOnlyThemeMode, ThemeMode } from 'nightwatch-ui';
import { AppThemeProvider, THEME_LOCAL_STORAGE_KEY, ThemeSelectSettings, SelectBoxDataTest } from 'skiff-front-utils';

import client from '../src/apollo/client';

jest.mock('../src/utils/userUtils', () => ({
  storeWorkspaceEvent: jest.fn()
}));

beforeEach(() => {
  localStorage.setItem(THEME_LOCAL_STORAGE_KEY, ThemeMode.LIGHT);
});

// matches media returning true, means system will go to dark mode
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: true,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

describe('MobileAppearanceDrawer', () => {
  it('current theme is selected', () => {
    render(
      <ApolloProvider client={client}>
        <AppThemeProvider>
          <ThemeSelectSettings />
        </AppThemeProvider>
      </ApolloProvider>
    );
    // current theme is light
    const lightThemeButton = screen.getByTestId(SelectBoxDataTest.LIGHT_THEME_SELECT);
    expect(within(lightThemeButton).getByTestId(SelectBoxDataTest.CHECKED_ID)).toBeVisible();

    // dark option should not be selected
    const darkThemeButton = screen.getByTestId(SelectBoxDataTest.DARK_THEME_SELECT);
    expect(within(darkThemeButton).getByTestId(SelectBoxDataTest.UNCHECKED_ID)).toBeVisible();

    // system option should not be selected
    const systemThemeButton = screen.getByTestId(SelectBoxDataTest.SYSTEM_THEME_SELECT);
    expect(within(systemThemeButton).getByTestId(SelectBoxDataTest.UNCHECKED_ID)).toBeVisible();
  });

  it('selecting dark mode sets the theme to "dark"', async () => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, ThemeMode.LIGHT);

    render(
      <ApolloProvider client={client}>
        <AppThemeProvider>
          <ThemeSelectSettings />
        </AppThemeProvider>
      </ApolloProvider>
    );

    const darkThemeButton = screen.getByText('Dark');
    await userEvent.click(darkThemeButton);
    // dark option should be selected
    expect(localStorage.getItem(THEME_LOCAL_STORAGE_KEY)).toEqual(ThemeMode.DARK);
  });

  it('selecting light mode sets the theme to "light"', async () => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, ThemeMode.DARK);

    render(
      <ApolloProvider client={client}>
        <AppThemeProvider>
          <ThemeSelectSettings />
        </AppThemeProvider>
      </ApolloProvider>
    );

    const lightThemeButton = screen.getByText('Light');
    await userEvent.click(lightThemeButton);
    // light option should be selected
    expect(localStorage.getItem(THEME_LOCAL_STORAGE_KEY)).toEqual(ThemeMode.LIGHT);
  });

  it('selecting system mode sets the theme to "system"', async () => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, ThemeMode.DARK);

    render(
      <ApolloProvider client={client}>
        <AppThemeProvider>
          <ThemeSelectSettings />
        </AppThemeProvider>
      </ApolloProvider>
    );

    const systemThemeButton = screen.getByText('System');
    await userEvent.click(systemThemeButton);
    // system option should be selected
    expect(localStorage.getItem(THEME_LOCAL_STORAGE_KEY)).toEqual(StorageOnlyThemeMode.SYSTEM);
  });
});
