import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { MOCK_EMAIL } from '../__mocks__/mockEmail';
import { MOCK_THREAD } from '../__mocks__/mockThread';
import { MOCK_USER } from '../__mocks__/mockUser';
import { ThreadBlockDropdown } from '../components/Thread/ThreadBlockDropdown';
import { skemailMobileDrawerReducer } from '../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../redux/reducers/modalReducer';

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useCurrentUserEmailAliases: () => ['1@skiff.town']
  };
});

jest.mock('../hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

jest.mock('../hooks/useDrafts', () => ({
  useDrafts: () => ({
    composeNewDraft: jest.fn()
  })
}));

jest.mock('../context/RouterLabelContext', () => ({
  useRouterLabelContext: () => ({
    value: 'inbox'
  })
}));

jest.mock('../hooks/useThreadActions', () => ({
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
          <ThreadBlockDropdown
            buttonRef={React.createRef<HTMLDivElement | null>()}
            currentLabel={SystemLabels.Inbox}
            defaultEmailAlias={undefined}
            email={MOCK_EMAIL}
            emailAliases={[]}
            open
            setOpen={jest.fn()}
            thread={{
              ...MOCK_THREAD,
              attributes: {
                ...MOCK_THREAD.attributes,
                systemLabels: [SystemLabels.Inbox]
              }
            }}
          />
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
          <ThreadBlockDropdown
            buttonRef={React.createRef<HTMLDivElement | null>()}
            currentLabel={SystemLabels.Trash}
            defaultEmailAlias={undefined}
            email={MOCK_EMAIL}
            emailAliases={[]}
            open
            setOpen={jest.fn()}
            thread={{
              ...MOCK_THREAD,
              attributes: {
                ...MOCK_THREAD.attributes,
                systemLabels: [SystemLabels.Trash]
              }
            }}
          />
        </Provider>
      </MockedProvider>
    );

    expect(screen.getByText(/move to inbox/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Trash$/i)).not.toBeInTheDocument();
  });
});
