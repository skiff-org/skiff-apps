import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { models, EMPTY_DOCUMENT_DATA } from 'skiff-front-graphql';
import { removeCurrentUserData, saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { MOCK_USER } from '../__mocks__/mockUser';
import { MailSidebar } from '../components/layout/MailSidebar';
import { DrawerProvider } from '../context/DrawerContext';
import { reducer } from '../redux/reducers';
import { isDefaultSidebarLabel, getSystemLabels } from '../utils/label';

const useRouter = jest.spyOn(require('next/router'), 'useRouter');
const mockRouterEvents = {
  events: { on: jest.fn(), off: jest.fn() }
};

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useRequiredCurrentUserData: jest.fn((): models.User => MOCK_USER),
    useCurrentUserData: jest.fn((): models.User => MOCK_USER),
    useCurrentUserEmailAliases: () => ['1@skiff.town']
  };
});

jest.mock('@uauth/js', () => jest.fn());

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
  afterEach(() => {
    useRouter.mockClear();
  });

  // TODO: Move wrapper setup to util file https://redux.js.org/usage/writing-tests
  const store = configureStore({ reducer });

  const wrapper = ({ children }) => (
    <Provider store={store}>
      <SnackbarProvider maxSnack={7}>
        <DrawerProvider>
          <DndProvider backend={HTML5Backend}>
            <MockedProvider>{children}</MockedProvider>
          </DndProvider>
        </DrawerProvider>
      </SnackbarProvider>
    </Provider>
  );

  it('renders all system labels and pages', () => {
    useRouter.mockImplementation(() => ({
      ...mockRouterEvents,
      pathname: '/',
      query: {}
    }));

    render(<MailSidebar />, { wrapper });
    getSystemLabels(false)
      .filter(isDefaultSidebarLabel)
      .forEach((label) => {
        expect(screen.getByText(label.name)).toBeInTheDocument();
      });

    expect(screen.getByText(/compose/i)).toBeInTheDocument();
    expect(screen.getByText(/search/i)).toBeInTheDocument();
  });

  it('marks label as active based on routing', () => {
    useRouter.mockImplementation(() => ({
      ...mockRouterEvents,
      pathname: '/',
      query: { label: SystemLabels.Inbox }
    }));
    render(<MailSidebar />, { wrapper });
    expect(screen.getByText('Inbox')).toHaveStyle(`
        background-color: var(--bg-cell-active);
      `);
  });
});
