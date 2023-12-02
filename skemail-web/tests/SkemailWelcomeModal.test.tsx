import { MockedProvider } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { ConnectWalletModalDataTest } from '../src/components/modals/ConnectWalletModal/ConnectWalletModal';
import SkemailWelcomeModal from '../src/components/modals/SkemailWelcomeModal';
import { initialSkemailDialogState, skemailModalReducer } from '../src/redux/reducers/modalReducer';
import { ModalType } from '../src/redux/reducers/modalTypes';

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
      publicKey: {
        key: 'key',
        signature: 'signature'
      },
      signingPublicKey: 'signingPublicKey'
    })
  };
});

const mockEnqueueSnackbar = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('notistack', () => ({
  ...jest.requireActual('notistack'),
  useSnackbar: () => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    enqueueSnackbar: () => mockEnqueueSnackbar()
  })
}));

export const createStore = () =>
  configureStore({
    reducer: {
      modal: skemailModalReducer.reducer
    },
    preloadedState: {
      modal: { ...initialSkemailDialogState, openModal: { type: ModalType.SkemailWelcome } }
    }
  });

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const originalEthereum = (window as any).ethereum;

describe('SkemailWelcomeModal', () => {
  afterEach(() => {
    // Cleanup
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    (window as any).ethereum = originalEthereum;
  });

  it('renders connect wallet button if a wallet extension is detected', () => {
    // mock non null ethereum object to mimic having an ethereum wallet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (window as any).ethereum = {};
    render(
      <MockedProvider>
        <Provider store={createStore()}>
          <SkemailWelcomeModal />
        </Provider>
      </MockedProvider>
    );

    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('renders connect wallet modal once connect wallet button is clicked', async () => {
    // mock non null ethereum object to mimic having an ethereum wallet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (window as any).ethereum = {};
    render(
      <MockedProvider>
        <Provider store={createStore()}>
          <SkemailWelcomeModal />
        </Provider>
      </MockedProvider>
    );

    await userEvent.click(screen.getByText(/connect wallet/i));
    // check that connect wallet option buttons (ie metamask) is rendered
    expect(screen.getByText(/metamask/i)).toBeInTheDocument();
  });

  it('can go back to welcome modal from connect wallet modal', async () => {
    // mock non null ethereum object to mimic having an ethereum wallet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (window as any).ethereum = {};
    render(
      <MockedProvider>
        <Provider store={createStore()}>
          <SkemailWelcomeModal />
        </Provider>
      </MockedProvider>
    );

    await userEvent.click(screen.getByText(/connect wallet/i));
    // welcome modal should not be rendered
    expect(screen.queryByText(/Welcome to Skiff Mail/i)).not.toBeInTheDocument();
    // click the back button from the connect wallet modal
    const backButton = screen.getByTestId(ConnectWalletModalDataTest.backBtn);
    await userEvent.click(backButton);
    // check that the welcome modal is rendered again
    expect(screen.getByText(/Welcome to Skiff Mail/i)).toBeInTheDocument();
  });
});
