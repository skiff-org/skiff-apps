import { ApolloProvider } from '@apollo/client';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import client from '../src/apollo/client';
import ContactActionDropdown from '../src/components/Thread/ContactDetails/ContactActionDropdown';
import { skemailDraftsReducer } from '../src/redux/reducers/draftsReducer';
import { skemailModalReducer } from '../src/redux/reducers/modalReducer';
import {
  ETHERSCAN_ADDRESS_LOOKUP_URL,
  SOLANA_LOOKUP_URL,
  ETHERSCAN_ENS_LOOKUP_URL
} from '../src/utils/walletUtils/walletUtils.constants';

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));
jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useToast: () => ({ enqueueToast: jest.fn(), closeToast: jest.fn() })
  };
});
jest.mock('../src/hooks/useDrafts', () => ({
  useDrafts: () => ({
    composeNewDraft: jest.fn()
  })
}));
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ mailboxLabel: 'inbox' })
}));
jest.mock('../src/hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    activeThreadID: 'threadID'
  })
}));

const originalOpen = window.open;

export const createStore = () =>
  configureStore({
    reducer: {
      mobileDrawer: skemailModalReducer.reducer,
      draft: skemailDraftsReducer.reducer
    }
  });

describe('ContactActionDropdown', () => {
  // TODO: Move wrapper setup to util file https://redux.js.org/usage/writing-tests
  const wrapper = ({ children }) => (
    <Provider store={createStore()}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  beforeEach(() => {
    window.open = jest.fn();
  });

  afterEach(() => {
    // Cleanup
    window.open = originalOpen;
  });

  it('renders direct message and copy address options', () => {
    // If you change name, update the regex below
    const sender = { address: 'address', name: 'name' };

    render(
      <ApolloProvider client={client}>
        <ContactActionDropdown
          address={sender}
          buttonRef={React.createRef<HTMLDivElement>()}
          setShowActionDropdown={jest.fn()}
          show
        />
      </ApolloProvider>,
      { wrapper }
    );

    expect(screen.getByText(/email name/i)).toBeInTheDocument();
    expect(screen.getByText(/copy address/i)).toBeInTheDocument();
  });

  it('does not render lookup wallet options for non wallet addresses', () => {
    const sender = { address: 'address', name: 'name' };

    render(
      <ApolloProvider client={client}>
        <ContactActionDropdown
          address={sender}
          buttonRef={React.createRef<HTMLDivElement>()}
          setShowActionDropdown={jest.fn()}
          show
        />
      </ApolloProvider>,
      { wrapper }
    );

    expect(screen.queryByText(/view on etherscan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/view on solana/i)).not.toBeInTheDocument();
  });

  it('renders all options for ethereum address contact', async () => {
    const ethAddress = `0x${'a'.padStart(40, 'a')}`;
    // If you change name, update the regex below
    const sender = { address: ethAddress, name: 'name' };
    const setShowActionDropdown = jest.fn();

    render(
      <ApolloProvider client={client}>
        <ContactActionDropdown
          address={sender}
          buttonRef={React.createRef<HTMLDivElement>()}
          setShowActionDropdown={setShowActionDropdown}
          show
        />
      </ApolloProvider>,
      { wrapper }
    );

    expect(screen.getByText(/email name/i)).toBeInTheDocument();
    expect(screen.getByText(/copy address/i)).toBeInTheDocument();

    // Check that there is a "View on etherscan" option and click on it
    await userEvent.click(screen.getByText(/view on etherscan/i));
    const etherscanLink = `${ETHERSCAN_ADDRESS_LOOKUP_URL}${ethAddress}`;
    expect(window.open).toBeCalledWith(etherscanLink, '_blank');
    // dropdown should close
    expect(setShowActionDropdown).toBeCalledWith(false);
  });

  it('renders all options for solana address contact', async () => {
    const solAddress = `${'A'.padStart(44, 'A')}`;
    // If you change name, update the regex below
    const sender = { address: solAddress, name: 'name' };

    render(
      <ApolloProvider client={client}>
        <ContactActionDropdown
          address={sender}
          buttonRef={React.createRef<HTMLDivElement>()}
          setShowActionDropdown={jest.fn()}
          show
        />
      </ApolloProvider>,
      { wrapper }
    );

    expect(screen.getByText(/email name/i)).toBeInTheDocument();
    expect(screen.getByText(/copy address/i)).toBeInTheDocument();

    // Check that there is a "View on etherscan" option and click on it
    await userEvent.click(screen.getByText(/view on solana/i));
    const solanaLink = `${SOLANA_LOOKUP_URL}${solAddress}`;
    expect(window.open).toBeCalledWith(solanaLink, '_blank');
  });

  it('renders all options for ENS contact', async () => {
    const ensName = 'test.eth';
    // If you change name, update the regex below
    const sender = { address: `${ensName}@skiff.town`, name: 'Test ENS' };

    render(
      <ApolloProvider client={client}>
        <ContactActionDropdown
          address={sender}
          buttonRef={React.createRef<HTMLDivElement>()}
          setShowActionDropdown={jest.fn()}
          show
        />
      </ApolloProvider>,
      { wrapper }
    );

    expect(screen.getByText(/email Test ENS/i)).toBeInTheDocument();
    expect(screen.getByText(/copy address/i)).toBeInTheDocument();

    // Check that there is a "View on etherscan" option and click on it
    await userEvent.click(screen.getByText(/view on etherscan/i));
    const etherscanLink = `${ETHERSCAN_ENS_LOOKUP_URL}${ensName}`;
    expect(window.open).toBeCalledWith(etherscanLink, '_blank');
  });
});
