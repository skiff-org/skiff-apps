import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { SnackbarProvider } from 'notistack';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { ThreadMessageCell } from '../src/components/mailbox/MessageCell/ThreadMessageCell';
import { COMPACT_MAILBOX_BREAKPOINT } from '../src/constants/mailbox.constants';
import { reducer } from '../src/redux/reducers';

import { MOCK_THREAD } from './mocks/mockThread';
import { MOCK_USER } from './mocks/mockUser';

const senderName = 'test sender';
const subject = 'test subject';
const message =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. In aliquam sem fringilla ut morbi tincidunt. Tincidunt lobortis feugiat vivamus at augue eget arcu dictum varius. Quis commodo odio aenean sed. Platea dictumst vestibulum rhoncus est pellentesque elit ullamcorper dignissim. Massa ultricies mi quis hendrerit dolor magna eget est lorem.';

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: jest.fn()
}));
jest.mock('../src/context/RouterLabelContext', () => ({
  useRouterLabelContext: () => ({
    value: 'inbox'
  })
}));

const formatTime = (date: Date) => {
  return dayjs(date).isToday() ? `${dayjs(date).format('h:mm A')}` : dayjs(date).format('MM/DD/YY');
};

jest.mock('../src/components/mailbox/MessageCell/MessageCell.utils', () => ({
  renderSendersWithQueryMatch: jest.fn().mockImplementation((text: string) => <>{text}</>),
  useCellDate: jest.fn().mockImplementation((date: Date) => formatTime(date)),
  renderTextWithQueryMatch: jest.fn().mockImplementation((text: string) => <>{text}</>),
  renderScheduledSendLink: jest.fn()
}));

describe('ThreadMessageCell', () => {
  beforeEach(() => {
    saveCurrentUserData(MOCK_USER);
  });

  const wrapper = ({ children }) => (
    <Provider store={configureStore({ reducer })}>
      <MockedProvider>
        <SnackbarProvider maxSnack={7}>
          <DndProvider backend={HTML5Backend}>{children}</DndProvider>
        </SnackbarProvider>
      </MockedProvider>
    </Provider>
  );

  it('displays all the message info', () => {
    render(
      <ThreadMessageCell
        active
        addresses={[]}
        displayNames={[senderName]}
        facepileNames={[senderName]}
        hasAttachment
        label={SystemLabels.Inbox}
        listWidth={COMPACT_MAILBOX_BREAKPOINT}
        message={message}
        onClick={() => {}}
        onSelectToggle={() => {}}
        selected
        subject={subject}
        thread={MOCK_THREAD}
        userLabels={[]}
        walletAliasesWithName={[]}
      />,
      { wrapper }
    );

    const date = MOCK_THREAD.emailsUpdatedAt;
    expect(screen.getByText(senderName)).toBeVisible();
    expect(screen.getByText(subject)).toBeVisible();
    expect(screen.getByText(message.slice(0, 10), { exact: false })).toBeVisible();
    expect(screen.getByText(formatTime(date))).toBeVisible();
    expect(screen.getByTestId('message-cell-attachment-icon')).toBeVisible();
  });

  it('hides the attachment icon if no attachments', () => {
    render(
      <ThreadMessageCell
        active
        addresses={[]}
        displayNames={[senderName]}
        facepileNames={[senderName]}
        hasAttachment={false}
        label={SystemLabels.Inbox}
        listWidth={COMPACT_MAILBOX_BREAKPOINT}
        message={message}
        onClick={() => {}}
        onSelectToggle={() => {}}
        selected
        subject={subject}
        thread={MOCK_THREAD}
        userLabels={[]}
        walletAliasesWithName={[]}
      />,
      { wrapper }
    );
    expect(screen.queryByTestId('message-cell-attachment-icon')).toBeNull();
  });
});
