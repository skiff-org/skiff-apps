import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import noop from 'lodash/noop';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import { GetAttachmentsDocument, GetThreadFromIdDocument, ThreadFragment } from 'skiff-front-graphql';
import { saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import Thread from '../src/components/Thread';
import { ThreadBlockDataTest } from '../src/components/Thread/ThreadBlock';
import { RouterLabelContext } from '../src/context/RouterLabelContext';
import { reducer } from '../src/redux/reducers';
import { LABEL_TO_SYSTEM_LABEL } from '../src/utils/label';

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

jest.mock('../src/hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    activeEmailID: 'emailID'
  })
}));
jest.mock('../src/utils/mailboxUtils', () => ({
  updateThreadAsReadUnread: () => Promise.resolve()
}));
window.HTMLElement.prototype.getBoundingClientRect = () => {
  return {
    bottom: 0,
    height: 10, // greater than zero so that the thread blocks render
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  };
};

// Mocked Thread
const body1 = '<p>test1</p>';
const body2 = '<p>test2</p>';
const sender1 = { address: '1@skiff.town', name: 'Satoshi Nakamoto' };
const sender2 = { address: '2@skiff.town', name: 'Kanye West' };
const mockThread: ThreadFragment = {
  ...MOCK_THREAD,
  emails: [
    {
      ...MOCK_EMAIL,
      id: '1',
      from: sender1,
      decryptedText: body1,
      decryptedAttachmentMetadata: [],
      attachmentMetadata: []
    },
    {
      ...MOCK_EMAIL,
      id: '2',
      from: sender2,
      decryptedText: body2,
      decryptedAttachmentMetadata: [],
      attachmentMetadata: []
    }
  ]
};

// Mocked Apollo requests
const mockedRequests = [
  {
    request: {
      query: GetThreadFromIdDocument,
      variables: {
        threadID: mockThread.threadID
      }
    },
    result: {
      data: { userThread: mockThread }
    }
  },
  {
    request: {
      query: GetAttachmentsDocument,
      variables: {
        ids: []
      }
    },
    result: {
      data: { attachments: [] }
    }
  }
];

describe('Thread', () => {
  // TODO: Move wrapper setup to util file https://redux.js.org/usage/writing-tests
  const store = configureStore({ reducer });
  const wrapper = ({ children }) => (
    <Provider store={store}>
      <MockedProvider
        addTypename={false}
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={mockedRequests}
      >
        <SnackbarProvider maxSnack={7}>
          <RouterLabelContext.Provider value={LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox]}>
            {children}
          </RouterLabelContext.Provider>
        </SnackbarProvider>
      </MockedProvider>
    </Provider>
  );

  beforeEach(() => {
    saveCurrentUserData(MOCK_USER);
  });

  it('displays all thread info', async () => {
    render(<Thread onClose={noop} threadID={mockThread.threadID} walletAliasesWithName={[]} />, { wrapper });

    await waitFor(() => {
      // Two emails in thread, only the most recent one is expanded
      expect(screen.getAllByTestId(ThreadBlockDataTest.threadBlock)).toHaveLength(mockThread.emails.length);
      expect(screen.getAllByTestId(ThreadBlockDataTest.threadBlockExpanded)).toHaveLength(1);

      // Shows senders for both emails
      expect(screen.getByText(sender1.name)).toBeInTheDocument();
      expect(screen.getByText(sender2.name)).toBeInTheDocument();

      // Renders email body
      expect(screen.getByTestId(ThreadBlockDataTest.emailBody)).toBeInTheDocument();
    });
  });
});
