import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import { ApplyLabelsDocument } from 'skiff-front-graphql';
import { SystemLabels } from 'skiff-graphql';

import { MOCK_THREAD } from '../__mocks__/mockThread';
import { MailboxActions, MailboxActionsDataTest } from '../components/mailbox/MailboxActions/MailboxActions';
import { skemailHotKeysReducer } from '../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../redux/reducers/modalReducer';

jest.mock('../hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

jest.mock('../hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    moveThreads: jest.fn(),
    trashThreads: jest.fn()
  })
}));

const mockedRequests = [
  {
    request: {
      query: ApplyLabelsDocument,
      variables: { request: { threadIDs: MOCK_THREAD.threadID } }
    }
  }
];

export const createStore = () =>
  configureStore({
    reducer: {
      mailbox: skemailMailboxReducer.reducer,
      hotkeys: skemailHotKeysReducer.reducer,
      modal: skemailModalReducer.reducer
    },
    preloadedState: {
      mailbox: {
        selectedThreadIDs: [],
        filters: {},
        hoveredThreadID: '',
        hoveredThreadIndex: 0,
        renderedMailboxThreadsCount: 0,
        lastSelectedIndex: null,
        activeThread: {
          activeThreadID: undefined,
          activeEmailID: undefined
        },
        pendingReplies: []
      }
    }
  });

describe('MailboxActions', () => {
  it('renders Move to Trash option if not currently in Trash', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <MockedProvider mocks={mockedRequests}>
          <SnackbarProvider>
            <MailboxActions
              clearLastSelectedIndex={jest.fn()}
              label={SystemLabels.Inbox}
              onRefresh={jest.fn()}
              threads={[MOCK_THREAD]}
            />
          </SnackbarProvider>
        </MockedProvider>
      </Provider>
    );
    // option shown only after thread selected
    store.dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [MOCK_THREAD.threadID] }));
    expect(screen.getByTestId(MailboxActionsDataTest.moveToTrashIcon)).toBeInTheDocument();
  });

  it('renders undo trash option if currently in Trash', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <MockedProvider mocks={mockedRequests}>
          <SnackbarProvider>
            <MailboxActions
              clearLastSelectedIndex={jest.fn()}
              label={SystemLabels.Trash}
              onRefresh={jest.fn()}
              threads={[MOCK_THREAD]}
            />
          </SnackbarProvider>
        </MockedProvider>
      </Provider>
    );
    // option shown only after thread selected
    store.dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [MOCK_THREAD.threadID] }));
    expect(screen.getByTestId(MailboxActionsDataTest.undoTrashIcon)).toBeInTheDocument();
    expect(screen.queryByTestId(MailboxActionsDataTest.moveToTrashIcon)).not.toBeInTheDocument();
  });
});
