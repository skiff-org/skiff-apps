import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Provider } from 'react-redux';
import { saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { ThreadBlockDropdown } from '../src/components/Thread/ThreadBlockDropdown';
import { skemailMobileDrawerReducer } from '../src/redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../src/redux/reducers/modalReducer';

import { MOCK_EMAIL } from './mocks/mockEmail';
import { MOCK_THREAD } from './mocks/mockThread';
import { MOCK_USER } from './mocks/mockUser';

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useCurrentUserEmailAliases: () => ({ emailAliases: ['1@skiff.town'], walletAliasesWithName: [], quickAliases: [] })
  };
});

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

jest.mock('../src/hooks/useDrafts', () => ({
  useDrafts: () => ({
    composeNewDraft: jest.fn()
  })
}));

jest.mock('../src/context/RouterLabelContext', () => ({
  useRouterLabelContext: () => ({
    value: 'inbox'
  })
}));

jest.mock('../src/hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    moveThreads: jest.fn(),
    trashThreads: jest.fn()
  })
}));

export const createStore = () =>
  configureStore({
    reducer: {
      mailbox: skemailModalReducer.reducer,
      mobileDrawer: skemailMobileDrawerReducer.reducer
    }
  });

describe('ThreadBlockDropdown', () => {
  beforeEach(() => {
    saveCurrentUserData(MOCK_USER);
  });
  it('renders Move to Trash option if thread is not currently in Trash', () => {
    render(
      <MockedProvider>
        <Provider store={createStore()}>
          <SnackbarProvider>
            <ThreadBlockDropdown
              buttonRef={React.createRef<HTMLDivElement | null>()}
              currentLabel={SystemLabels.Inbox}
              defaultEmailAlias={undefined}
              email={MOCK_EMAIL}
              emailAliases={[]}
              open
              quickAliases={[]}
              setOpen={jest.fn()}
              thread={{
                ...MOCK_THREAD,
                attributes: {
                  ...MOCK_THREAD.attributes,
                  systemLabels: [SystemLabels.Inbox]
                }
              }}
              unsubscribeInfo={undefined}
            />
          </SnackbarProvider>
        </Provider>
      </MockedProvider>
    );

    expect(screen.getByText(/^Trash$/i)).toBeInTheDocument();
    expect(screen.queryByText(/move to inbox/i)).not.toBeInTheDocument();
  });

  it('renders undo trash option if thread is currently in Trash', () => {
    render(
      <MockedProvider>
        <Provider store={createStore()}>
          <SnackbarProvider>
            <ThreadBlockDropdown
              buttonRef={React.createRef<HTMLDivElement | null>()}
              currentLabel={SystemLabels.Trash}
              defaultEmailAlias={undefined}
              email={MOCK_EMAIL}
              emailAliases={[]}
              open
              quickAliases={[]}
              setOpen={jest.fn()}
              thread={{
                ...MOCK_THREAD,
                attributes: {
                  ...MOCK_THREAD.attributes,
                  systemLabels: [SystemLabels.Trash]
                }
              }}
              unsubscribeInfo={undefined}
            />
          </SnackbarProvider>
        </Provider>
      </MockedProvider>
    );

    expect(screen.getByText(/move to inbox/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Trash$/i)).not.toBeInTheDocument();
  });
});
