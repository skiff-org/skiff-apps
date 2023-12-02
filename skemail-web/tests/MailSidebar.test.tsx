import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { EMPTY_DOCUMENT_DATA, SystemLabels, models } from 'skiff-front-graphql';
import { removeCurrentUserData, saveCurrentUserData } from 'skiff-front-utils';

import MailSidebar from '../src/components/layout/MailSidebar';
import { DrawerProvider } from '../src/context/DrawerContext';
import { reducer } from '../src/redux/reducers';
import { SYSTEM_LABELS, isDefaultSidebarLabel } from '../src/utils/label';

import { MOCK_USER } from './mocks/mockUser';

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useRequiredCurrentUserData: jest.fn((): models.User => MOCK_USER),
    useCurrentUserData: jest.fn((): models.User => MOCK_USER),
    useCurrentUserEmailAliases: () => ({ emailAliases: ['1@skiff.town'], walletAliasesWithName: [], quickAliases: [] })
  };
});



// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/mail/inbox' })
}));

jest.mock('../src/hooks/useCurrentLabel', () => ({
  useCurrentLabel: () => ({ label: SystemLabels.Inbox, userLabelVariant: null })
}));

describe('Sidebar', () => {
  beforeAll(() => {
    const mockUser: models.User = {
      username: 'currentUsername',
      publicKey: {
        key: 'key'
      },
      signingPublicKey: 'key',
      passwordDerivedSecret: 'secret',
      privateUserData: {
        documentKey: '',
        privateKey: '',
        signingPrivateKey: ''
      },
      userID: 'currentUserID',
      publicData: {},
      privateDocumentData: EMPTY_DOCUMENT_DATA,
      rootOrgID: ''
    };
    saveCurrentUserData({ ...mockUser });
  });

  afterAll(() => {
    removeCurrentUserData();
  });

  // TODO: Move wrapper setup to util file https://redux.js.org/usage/writing-tests
  const store = configureStore({ reducer });

  const wrapper = ({ children }) => (
    <Provider store={store}>
      <SnackbarProvider maxSnack={7}>
        <DrawerProvider>
          <DndProvider backend={HTML5Backend}>
            <MockedProvider>
              <BrowserRouter>{children}</BrowserRouter>
            </MockedProvider>
          </DndProvider>
        </DrawerProvider>
      </SnackbarProvider>
    </Provider>
  );

  it('renders all system labels and pages', () => {
    render(<MailSidebar />, { wrapper });
    SYSTEM_LABELS.filter(isDefaultSidebarLabel).forEach((label) => {
      expect(screen.getByText(label.name)).toBeInTheDocument();
    });

    expect(screen.getByText(/compose/i)).toBeInTheDocument();
    expect(screen.getByText(/search/i)).toBeInTheDocument();
  });

  it('marks label as active based on routing', () => {
    render(<MailSidebar />, { wrapper });
    expect(screen.getByText('Inbox')).toHaveStyle(`
        background-color: var(--bg-cell-active);
      `);
  });
});
