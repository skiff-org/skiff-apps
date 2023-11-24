import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { abbreviateWalletAddress } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { assertExists } from '../../../libs/skiff-utils/src';
import ThreadBlock, { ThreadBlockDataTest } from '../src/components/Thread/ThreadBlock';
import * as useCurrentLabel from '../src/hooks/useCurrentLabel';
import { skemailDraftsReducer } from '../src/redux/reducers/draftsReducer';
import { skemailModalReducer } from '../src/redux/reducers/modalReducer';
import { ETHERSCAN_ADDRESS_LOOKUP_URL, SOLANA_LOOKUP_URL } from '../src/utils/walletUtils/walletUtils.constants';

import { MOCK_EMAIL } from './mocks/mockEmail';
import { MOCK_THREAD } from './mocks/mockThread';

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));
jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useToast: () => ({ enqueueToast: jest.fn(), closeToast: jest.fn() }),
    useRequiredCurrentUserData: () => ({
      userID: 'id',
      privateUserData: {
        privateKey: 'privateKey'
      }
    })
  };
});
jest.mock('../src/hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    trashThreads: jest.fn(),
    setActiveThreadID: jest.fn()
  })
}));
jest.mock('../src/hooks/useDrafts', () => ({
  useDrafts: () => ({
    composeNewDraft: jest.fn()
  })
}));

const mockEmail = {
  ...MOCK_EMAIL,
  decryptedAttachmentMetadata: [],
  attachmentMetadata: []
};
const ethAddress = `0x${'a'.padStart(40, 'a')}`;
const solAddress = `${'A'.padStart(44, 'A')}`;

const originalOpen = window.open;

export const createStore = () =>
  configureStore({
    reducer: {
      mobileDrawer: skemailModalReducer.reducer,
      draft: skemailDraftsReducer.reducer
    }
  });

describe('ThreadBlock', () => {
  // TODO: Move wrapper setup to util file https://redux.js.org/usage/writing-tests
  const wrapper = ({ children }) => (
    <Provider store={createStore()}>
      <MockedProvider>{children}</MockedProvider>
    </Provider>
  );

  beforeEach(() => {
    window.open = jest.fn();
  });

  afterEach(() => {
    // Cleanup
    window.open = originalOpen;
  });

  it('renders abbreviated eth address for sender with display name', async () => {
    jest
      .spyOn(useCurrentLabel, 'useCurrentLabel')
      .mockImplementation(() => ({ label: SystemLabels.Drafts, userLabelVariant: null }));

    const abbreviatedWalletAddress = abbreviateWalletAddress(ethAddress, 12, 12);
    const sender = { address: `${ethAddress}@skiff.town`, name: 'Test Eth' };
    const email = { ...mockEmail, from: sender };
    render(
      <ThreadBlock
        currentLabel={SystemLabels.Inbox}
        defaultEmailAlias={undefined}
        disableOnClick={true}
        email={email}
        emailAliases={[]}
        expanded={true}
        isTrashed={false}
        key={email.id}
        onClick={() => {}}
        quickAliases={[]}
        thread={{
          ...MOCK_THREAD,
          attributes: {
            ...MOCK_THREAD.attributes,
            systemLabels: [SystemLabels.Inbox]
          }
        }}
        unsubscribeInfo={undefined}
      />,
      { wrapper }
    );
    const walletBlock = screen.getAllByTestId(ThreadBlockDataTest.threadBlock)[0];

    assertExists(walletBlock);
    expect(within(walletBlock).getByText(abbreviatedWalletAddress)).toBeInTheDocument();
    const walletLinkButton = screen.getAllByTestId(ThreadBlockDataTest.externalLinkBtn)[0];

    assertExists(walletLinkButton);
    await userEvent.click(walletLinkButton);
    const etherscanLink = `${ETHERSCAN_ADDRESS_LOOKUP_URL}${ethAddress}`;
    expect(window.open).toBeCalledWith(etherscanLink, '_blank');
  });

  it('renders abbreviated sol address for sender with display name', async () => {
    const abbreviatedWalletAddress = abbreviateWalletAddress(solAddress, 12, 12);
    const sender = { address: `${solAddress}@skiff.town`, name: 'Test Eth' };
    const email = { ...mockEmail, from: sender };
    render(
      <ThreadBlock
        currentLabel={SystemLabels.Inbox}
        defaultEmailAlias={undefined}
        disableOnClick={true}
        email={email}
        emailAliases={[]}
        expanded={true}
        isTrashed={false}
        key={email.id}
        onClick={() => {}}
        quickAliases={[]}
        thread={{
          ...MOCK_THREAD,
          attributes: {
            ...MOCK_THREAD.attributes,
            systemLabels: [SystemLabels.Inbox]
          }
        }}
        unsubscribeInfo={undefined}
      />,
      { wrapper }
    );

    const walletBlock = screen.getAllByTestId(ThreadBlockDataTest.threadBlock)[0];
    assertExists(walletBlock);
    expect(within(walletBlock).getByText(abbreviatedWalletAddress)).toBeInTheDocument();
    const walletLinkButton = screen.getAllByTestId(ThreadBlockDataTest.externalLinkBtn)[0];
    assertExists(walletLinkButton);
    await userEvent.click(walletLinkButton);
    const solanaLink = `${SOLANA_LOOKUP_URL}${solAddress}`;
    expect(window.open).toBeCalledWith(solanaLink, '_blank');
  });

  it('renders abbreviated eth address for sender without display name', async () => {
    const abbreviatedWalletAddress = abbreviateWalletAddress(ethAddress, 12, 12);
    const sender = { address: `${ethAddress}@skiff.town` };
    const email = { ...mockEmail, from: sender };
    render(
      <ThreadBlock
        currentLabel={SystemLabels.Inbox}
        defaultEmailAlias={undefined}
        disableOnClick={true}
        email={email}
        emailAliases={[]}
        expanded={true}
        isTrashed={false}
        key={email.id}
        onClick={() => {}}
        quickAliases={[]}
        thread={{
          ...MOCK_THREAD,
          attributes: {
            ...MOCK_THREAD.attributes,
            systemLabels: [SystemLabels.Inbox]
          }
        }}
        unsubscribeInfo={undefined}
      />,
      { wrapper }
    );

    const walletBlock = screen.getAllByTestId(ThreadBlockDataTest.threadBlock)[0];
    assertExists(walletBlock);
    expect(within(walletBlock).getByText(abbreviatedWalletAddress)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId(ThreadBlockDataTest.externalLinkBtn));
    const etherscanLink = `${ETHERSCAN_ADDRESS_LOOKUP_URL}${ethAddress}`;
    expect(window.open).toBeCalledWith(etherscanLink, '_blank');
  });

  it('renders abbreviated sol address for sender without display name', async () => {
    const abbreviatedWalletAddress = abbreviateWalletAddress(solAddress, 12, 12);
    const sender = { address: `${solAddress}@skiff.town` };
    const email = { ...mockEmail, from: sender };
    render(
      <ThreadBlock
        currentLabel={SystemLabels.Inbox}
        defaultEmailAlias={undefined}
        disableOnClick={true}
        email={email}
        emailAliases={[]}
        expanded={true}
        isTrashed={false}
        key={email.id}
        onClick={() => {}}
        quickAliases={[]}
        thread={{
          ...MOCK_THREAD,
          attributes: {
            ...MOCK_THREAD.attributes,
            systemLabels: [SystemLabels.Inbox]
          }
        }}
        unsubscribeInfo={undefined}
      />,
      { wrapper }
    );

    const walletBlock = screen.getAllByTestId(ThreadBlockDataTest.threadBlock)[0];
    assertExists(walletBlock);
    expect(within(walletBlock).getByText(abbreviatedWalletAddress)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId(ThreadBlockDataTest.externalLinkBtn));
    const solanaLink = `${SOLANA_LOOKUP_URL}${solAddress}`;
    expect(window.open).toBeCalledWith(solanaLink, '_blank');
  });
});
