import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHIP_END_ICON_DATA_TEST } from 'nightwatch-ui';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {
  DecryptionServicePublicKeyDocument,
  EncryptedMessageData,
  GetCurrentUserEmailAliasesDocument,
  SendMessageDocument,
  SendMessageMutationVariables
} from 'skiff-front-graphql';
import { SystemLabels } from 'skiff-graphql';

import { AttachmentsDataTest } from '../src/components/Attachments/Attachments';
import Compose, { ComposeDataTest } from '../src/components/Compose/Compose';
import * as useCurrentLabel from '../src/hooks/useCurrentLabel';
import { initialSkemailDraftsState, skemailDraftsReducer } from '../src/redux/reducers/draftsReducer';
import {
  PopulateComposeContent,
  initialSkemailDialogState,
  skemailModalReducer
} from '../src/redux/reducers/modalReducer';

import { MOCK_USER } from './mocks/mockUser';

jest.mock('email-regex', () => jest.fn());

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../src/utils/userUtils', () => ({
  ...jest.requireActual('../src/utils/userUtils'),
  getUserProfileFromID: () => ({
    data: {
      user: MOCK_USER
    }
  })
}));

jest.mock('../src/hooks/useUserSignature', () => ({
  useUserSignature: jest.fn()
}));

const mockEncryptedMessageData: EncryptedMessageData = {
  encryptedSubject: {
    encryptedData: ''
  },
  encryptedText: {
    encryptedData: ''
  },
  encryptedTextAsHtml: {
    encryptedData: ''
  },
  encryptedHtml: {
    encryptedData: ''
  },
  encryptedTextSnippet: {
    encryptedData: ''
  },
  encryptedAttachments: [
    {
      encryptedContent: {
        encryptedFile: ''
      },
      encryptedMetadata: {
        encryptedData: ''
      }
    }
  ],
  fromAddressWithEncryptedKey: {
    address: ''
  },
  toAddressesWithEncryptedKeys: [],
  ccAddressesWithEncryptedKeys: [],
  bccAddressesWithEncryptedKeys: []
};

jest.mock('skiff-front-graphql', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-graphql');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    encryptMessage: () => mockEncryptedMessageData
  };
});

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useToast: () => ({ enqueueToast: jest.fn(), closeToast: jest.fn() }),
    useCurrentUserEmailAliases: () => ({
      emailAliases: ['alias@skiff.com'],
      walletAliasesWithName: [],
      quickAliases: []
    }),
    useRequiredCurrentUserData: () => ({
      userID: 'id',
      privateUserData: {
        privateKey: 'privateKey'
      }
    }),
    useGetAllContactsWithOrgMembers: () => ({
      contactsWithOrgMembers: [],
      refetch: jest.fn()
    })
  };
});

jest.mock('../src/context/RouterLabelContext', () => ({
  useRouterLabelContext: () => ({
    value: 'inbox'
  })
}));

jest.mock('../src/hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    trashThreads: jest.fn()
  })
}));

jest.mock('../src/components/Settings/useSettings', () => ({
  useSettings: () => jest.fn()
}));

export const createStore = (populateComposeContent: PopulateComposeContent) =>
  configureStore({
    reducer: {
      modal: skemailModalReducer.reducer,
      mobileDrawer: skemailModalReducer.reducer,
      draft: skemailDraftsReducer.reducer
    },
    preloadedState: {
      modal: { ...initialSkemailDialogState, populateComposeContent },
      draft: initialSkemailDraftsState
    }
  });

describe('Compose', () => {
  it('can add and persist Cc addresses', async () => {
    jest
      .spyOn(useCurrentLabel, 'useCurrentLabel')
      .mockImplementation(() => ({ label: SystemLabels.Drafts, userLabelVariant: null }));
    const testCcEmail = 'test@skiff.com';
    const toName = 'Test';

    const populateComposeContent: PopulateComposeContent = {
      subject: '',
      toAddresses: [{ address: 'test@skiff.com', name: toName }],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: 'thisisfrom@skiff.com'
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );
    await act(async () => {
      // Open Cc input field, hidden on default as we are composing a new
      // message and there are no stored Cc addresses
      const ccButton = screen.getByTestId(ComposeDataTest.showCcButton);
      await userEvent.click(ccButton);

      // Type in the test Cc email in the Cc input
      const ccField = screen.getByTestId(ComposeDataTest.ccField);
      const ccInput = within(ccField).getByPlaceholderText(/Recipients/i);
      await userEvent.type(ccInput, `${testCcEmail}{enter}`);
      // Close the Cc field by clicking to subject
      await userEvent.click(screen.getByTestId(ComposeDataTest.subjectField));
      // Check that Cc field is still rendered
      expect(screen.queryByTestId(ComposeDataTest.ccField)).toBeInTheDocument();
    });
  });

  it('can add and persist Bcc addresses', async () => {
    const testBccEmail = 'test@skiff.com';
    const toName = 'Test';

    const populateComposeContent: PopulateComposeContent = {
      subject: '',
      toAddresses: [{ address: 'test@skiff.com', name: toName }],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: 'thisisfrom@skiff.com'
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );
    await act(async () => {
      // Open Bcc input field, hidden on default as we are composing a new
      // message and there are no stored Bcc addresses
      const bccButton = screen.getByTestId(ComposeDataTest.showBccButton);
      await userEvent.click(bccButton);

      // Type in the test Bcc email in the Bcc input
      const bccField = screen.getByTestId(ComposeDataTest.bccField);
      const bccInput = within(bccField).getByPlaceholderText(/Recipients/i);
      await userEvent.type(bccInput, `${testBccEmail}{enter}`);

      // Close the Bcc field by clicking to subject
      await userEvent.click(screen.getByTestId(ComposeDataTest.subjectField));

      // Check that Bcc field is still rendered
      expect(screen.queryByTestId(ComposeDataTest.bccField)).toBeInTheDocument();
    });
  });

  it('can change draft To field', async () => {
    const toName = 'Test';

    const populateComposeContent: PopulateComposeContent = {
      subject: '',
      toAddresses: [{ address: 'test@skiff.com', name: toName }],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: ''
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );

    // To field should have the saved To address
    const toField = screen.getByTestId(ComposeDataTest.toField);
    expect(within(toField).getByText(toName)).toBeInTheDocument();
    // Delete the existing To address
    await act(async () => {
      await userEvent.click(within(toField).getByTestId(CHIP_END_ICON_DATA_TEST));
    });
    expect(within(toField).queryByText(toName)).not.toBeInTheDocument();
    // Add a new To Address
    const toInput = within(toField).getByPlaceholderText(/Recipients/i);
    const newToAddress = 'newTest@skiff.com';
    await act(async () => {
      await userEvent.type(toInput, `${newToAddress}{enter}`);
    });
    await waitFor(() => expect(within(toField).getByText(newToAddress)).toBeInTheDocument());
  });

  it('can change draft subject field', async () => {
    const subject = 'Subject';

    const populateComposeContent: PopulateComposeContent = {
      subject: subject,
      toAddresses: [],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: ''
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );

    // Subject field should have the saved draft subject
    const subjectField = screen.getByTestId(ComposeDataTest.subjectField);
    const subjectInput = within(subjectField).getByPlaceholderText(/Subject/i);
    expect(subjectInput).toHaveAttribute('value', subject);
    // Append 'test' to the subject and check that the subject field has updated
    const subjectSuffix = ' test';
    await act(async () => {
      await userEvent.type(subjectInput, subjectSuffix);
    });
    await waitFor(() => expect(subjectInput).toHaveAttribute('value', `${subject}${subjectSuffix}`));
  });

  it('draft cc and bcc fields should be hidden if empty', async () => {
    const populateComposeContent: PopulateComposeContent = {
      subject: '',
      toAddresses: [{ address: 'test@skiff.com', name: 'test name' }],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: ''
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );
    await act(async () => {
      // Cc field should be empty
      const ccButton = screen.getByTestId(ComposeDataTest.showCcButton);
      await userEvent.click(ccButton);
      const ccField = screen.getByTestId(ComposeDataTest.ccField);
      const ccInput = within(ccField).getByPlaceholderText(/Recipients/i);
      expect(ccInput).toHaveAttribute('value', '');

      // Bcc field should be empty
      const bccButton = screen.getByTestId(ComposeDataTest.showBccButton);
      await userEvent.click(bccButton);
      const bccField = screen.getByTestId(ComposeDataTest.bccField);
      const bccInput = within(bccField).getByPlaceholderText(/Recipients/i);
      expect(bccInput).toHaveAttribute('value', '');
    });
  });

  it('sends a message to hybrid list of skiff and non-skiff users', async () => {
    const populateComposeContent: PopulateComposeContent = {
      subject: '',
      toAddresses: [
        { address: '1@skiff.com', name: 'Skiff 1' },
        { address: '2@skiff.com', name: 'Skiff 2' },
        { address: '1@gmail.com', name: 'Gmail 1' }
      ],
      ccAddresses: [
        { address: '3@skiff.com', name: 'Skiff 3' },
        { address: '2@gmail.com', name: 'Gmail 2' }
      ],
      bccAddresses: [
        { address: '4@skiff.com', name: 'Skiff 4' },
        { address: '1@protonmail.com', name: 'Protom 1' }
      ],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: undefined
    };

    const mockSendMessageVariables: SendMessageMutationVariables = {
      request: {
        from: mockEncryptedMessageData.fromAddressWithEncryptedKey,
        to: mockEncryptedMessageData.toAddressesWithEncryptedKeys,
        cc: mockEncryptedMessageData.ccAddressesWithEncryptedKeys,
        bcc: mockEncryptedMessageData.bccAddressesWithEncryptedKeys,
        attachments: mockEncryptedMessageData.encryptedAttachments,
        encryptedHtml: mockEncryptedMessageData.encryptedHtml,
        encryptedText: mockEncryptedMessageData.encryptedText,
        encryptedTextAsHtml: mockEncryptedMessageData.encryptedTextAsHtml,
        encryptedSubject: mockEncryptedMessageData.encryptedSubject,
        encryptedTextSnippet: mockEncryptedMessageData.encryptedTextSnippet,
        rawSubject: '',
        captchaToken: ''
      }
    };

    const sendMessageMock: MockedResponse = {
      request: {
        query: SendMessageDocument,
        variables: mockSendMessageVariables
      },
      // Mock function to test that we called this mutation.
      // https://jkettmann.com/testing-apollo-how-to-test-if-a-mutation-was-called-with-mockedprovider
      newData: jest.fn(() => ({ data: { sendMessage: {} } }))
    };

    const getCurrentUserEmailAliasesMock: MockedResponse = {
      request: {
        query: GetCurrentUserEmailAliasesDocument,
        variables: {}
      },
      result: {
        data: {
          currentUser: {
            userID: 'id',
            emailAliases: ['5@skiff.com', 'alias@skiff.com']
          }
        }
      }
    };

    const decryptionServicePublicKeyMock: MockedResponse = {
      request: {
        query: DecryptionServicePublicKeyDocument,
        variables: {}
      },
      result: {
        data: { decryptionServicePublicKey: 'key' }
      }
    };

    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider mocks={[sendMessageMock, getCurrentUserEmailAliasesMock, decryptionServicePublicKeyMock]}>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );

    const sendButton = screen.getByTestId(ComposeDataTest.sendButton);
    await act(async () => {
      await userEvent.click(sendButton);
    });
    await waitFor(() => expect(sendMessageMock.newData).toHaveBeenCalledTimes(1));
  });

  it('Can add attachment', async () => {
    const populateComposeContent: PopulateComposeContent = {
      subject: 'Attachments mail',
      toAddresses: [{ address: 'test@skiff.com', name: 'test' }],
      ccAddresses: [],
      bccAddresses: [],
      messageBody: '',
      replyEmailID: undefined,
      replyThread: undefined,
      attachmentMetadata: [],
      fromAddress: 'thisisfrom@skiff.com'
    };
    render(
      <Provider store={createStore(populateComposeContent)}>
        <MockedProvider>
          <DndProvider backend={HTML5Backend}>
            <Compose />
          </DndProvider>
        </MockedProvider>
      </Provider>
    );

    const testFile = new File([new ArrayBuffer(100)], 'test.txt');

    const attachmentsInput = screen.getByTestId(ComposeDataTest.attachmentsInput);
    await act(async () => {
      await userEvent.upload(attachmentsInput, testFile);
    });

    const attachmentsContainers = await screen.findAllByTestId(AttachmentsDataTest.attachmentContainer);
    await waitFor(() => {
      expect(attachmentsContainers.some((attachmentContainer) => within(attachmentContainer).getByText(testFile.name)));
    });
  });
});
