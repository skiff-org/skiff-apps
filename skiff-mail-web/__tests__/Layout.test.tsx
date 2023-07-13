import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {
  CreateOrUpdateDraftDocument,
  EMPTY_DOCUMENT_DATA,
  GetAllDraftsDocument,
  GetCreditsDocument,
  GetCurrentUserEmailAliasesDocument,
  GetLastViewedReferralCreditDocument,
  MailboxDocument,
  UserLabelsDocument,
  models
} from 'skiff-front-graphql';
import { removeCurrentUserData, saveCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { ComposeDataTest } from '../components/Compose/Compose';
import { ComposeHeaderDataTest } from '../components/Compose/ComposeHeader';
import { Layout } from '../components/layout/Layout';
import { SidebarDataTest } from '../components/layout/MailSidebar';
import { DEFAULT_MAILBOX_LIMIT } from '../constants/mailbox.constants';
import * as useCurrentLabel from '../hooks/useCurrentLabel';
import SystemLabelMailbox from '../pages/[systemLabel]';
import store from '../redux/store/reduxStore';

jest.mock('email-regex', () => jest.fn());
jest.mock('@uauth/js', () => jest.fn());
jest.mock('idb-keyval', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));
jest.mock(
  'react-virtualized-auto-sizer',
  () =>
    ({ children }: any) =>
      children({ height: 600, width: 600 })
);
jest.mock('../utils/draftUtils', () => ({
  ...jest.requireActual('../utils/draftUtils'),
  getUserDrafts: jest.fn().mockResolvedValue([]),
  getDraftSaveData: jest.fn().mockResolvedValue({})
}));
jest.mock('../hooks/useSearchWorker', () => ({
  getSearchWorker: jest.fn(),
  useInitializeSearchWorker: jest.fn()
}));

// see https://stackoverflow.com/questions/46906948/how-to-unit-test-next-js-dynamic-components
// make sure dynamic components are loaded synchronously
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dynamicModule = jest.requireActual('next/dynamic');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const dynamicActualComp = dynamicModule.default;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const RequiredComponent = dynamicActualComp(props[0]);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    RequiredComponent.preload ? RequiredComponent.preload() : RequiredComponent.render.preload();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return RequiredComponent;
  }
}));

const router = {
  route: '/',
  pathname: '',
  query: '',
  asPath: '',
  push: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn()
  },
  beforePopState: jest.fn(() => null),
  prefetch: jest.fn(() => null)
};

jest.mock('next/router', () => ({
  useRouter() {
    return router;
  }
}));
jest.mock('../hooks/useFetchCurrentUser', () => () => ({
  isLoading: false,
  isLoggedIn: true
}));

jest.mock('../utils/mailFiltering/mailFiltering', () => ({
  runClientSideMailFilters: jest.fn()
}));

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useToast: () => ({ enqueueToast: jest.fn(), closeToast: jest.fn() }),
    useCheckoutResultToast: jest.fn(),
    useCurrentUserEmailAliases: () => ['1@skiff.town'],
    useRequiredCurrentUserData: () => ({
      userID: 'id',
      username: '1@skiff.com',
      privateUserData: {
        privateKey: 'privateKey'
      }
    }),
    useSyncSavedAccount: () => {},
    useCurrentUserData: () => ({
      userID: 'id',
      username: '1@skiff.com',
      privateUserData: {
        privateKey: 'privateKey'
      }
    }),
    useContactsSettings: () => []
  };
});

jest.mock('skiff-front-graphql', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-graphql');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    useUserProfile: () => ({
      publicData: {
        displayName: 'one'
      }
    })
  };
});
jest.mock('../hooks/useThreadActions', () => ({
  useThreadActions: () => ({
    trashThreads: jest.fn(),
    setActiveThreadID: jest.fn()
  })
}));

jest.mock('../svgs/empty-inbox.svg', () => jest.fn().mockReturnValue(null));
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../utils/userUtils', () => ({
  ...jest.requireActual('../utils/userUtils'),
  storeWorkspaceEvent: jest.fn()
}));

const getMailboxQueryMock: MockedResponse = {
  request: {
    query: MailboxDocument,
    variables: {
      request: {
        label: SystemLabels.Drafts,
        cursor: null,
        limit: DEFAULT_MAILBOX_LIMIT,
        polling: true,
        filters: {},
        platformInfo: {
          // for some reason, isMobile and isIos are expected as ''
          isMobile: '',
          isIos: '',
          isAndroid: false,
          isMacOs: false,
          isReactNative: false,
          isSkiffWindowsDesktop: false
        },
        isAliasInbox: false,
        clientsideFiltersApplied: true
      }
    }
  },
  result: {
    data: {
      mailbox: {
        threads: [],
        pageInfo: {
          cursor: null,
          hasNextPage: false
        }
      }
    }
  }
};

const getCurrentUserEmailAliasesQueryMock: MockedResponse = {
  request: {
    query: GetCurrentUserEmailAliasesDocument,
    variables: {}
  },
  result: {
    data: {
      currentUser: {
        userID: 'id',
        emailAliases: ['1@skiff.com']
      }
    }
  }
};

const getAllDraftsResponse: MockedResponse = {
  request: {
    query: GetAllDraftsDocument,
    variables: {}
  },
  result: {
    data: {
      allDrafts: []
    }
  }
};

const upsertDraftResponse: MockedResponse = {
  request: {
    query: CreateOrUpdateDraftDocument,
    variables: {
      request: {}
    }
  },
  result: {
    data: {
      upsertDraft: true
    }
  }
};

const userLabelsQueryMock: MockedResponse = {
  request: {
    query: UserLabelsDocument,
    variables: {}
  },
  result: {
    data: {
      userLabels: []
    }
  }
};

const getCreditsQueryMock: MockedResponse = {
  request: {
    query: GetCreditsDocument,
    variables: {
      request: {
        entityID: 'id',
        entityType: 'USER',
        include: ['CREDITS_FROM_REFERRALS']
      }
    }
  },
  result: {
    data: {
      credits: {
        credits: [
          {
            info: 'CREDITS_FROM_REFERRALS',
            count: 4,
            amount: {
              cents: 0,
              skemailStorageBytes: 4000000000,
              editorStorageBytes: 4000000000
            }
          }
        ]
      }
    }
  }
};

const getLastViewedReferralCreditQueryMock: MockedResponse = {
  request: {
    query: GetLastViewedReferralCreditDocument,
    variables: {}
  },
  result: {
    data: {
      lastViewedReferralCredit: {
        count: 0,
        amount: {
          cents: 0,
          skemailStorageBytes: '0',
          editorStorageBytes: '0'
        }
      }
    }
  }
};

const mocks = [
  getMailboxQueryMock,
  getCurrentUserEmailAliasesQueryMock,
  userLabelsQueryMock,
  getCreditsQueryMock,
  getLastViewedReferralCreditQueryMock,
  getAllDraftsResponse,
  upsertDraftResponse
];

describe('Layout', () => {
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

  it('opens and closes compose properly', async () => {
    jest
      .spyOn(useCurrentLabel, 'useCurrentLabel')
      .mockImplementation(() => ({ label: SystemLabels.Inbox, userLabelVariant: null }));

    render(
      <Suspense fallback={null}>
        <Provider store={store}>
          <MockedProvider mocks={mocks}>
            <DndProvider backend={HTML5Backend}>
              <Layout>
                <SystemLabelMailbox />
              </Layout>
            </DndProvider>
          </MockedProvider>
        </Provider>
      </Suspense>
    );

    // Open compose and test components are there
    const composeButton = screen.getByTestId(SidebarDataTest.openComposeButton);
    await act(async () => {
      await userEvent.click(composeButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId(ComposeDataTest.sendButton)).toBeInTheDocument();
      expect(screen.getByTestId(ComposeDataTest.subjectField)).toBeInTheDocument();
      expect(screen.getByTestId(ComposeDataTest.toField)).toBeInTheDocument();
      expect(screen.getByTestId(ComposeDataTest.showCcButton)).toBeInTheDocument();
      expect(screen.getByTestId(ComposeDataTest.showBccButton)).toBeInTheDocument();
    });

    // Close compose and test components are not there
    const closeComposeButton = screen.getByTestId(ComposeHeaderDataTest.closeButton);
    await act(async () => {
      await userEvent.click(closeComposeButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId(ComposeDataTest.sendButton)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.subjectField)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.toField)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.ccField)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.bccField)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.showCcButton)).not.toBeInTheDocument();
      expect(screen.queryByTestId(ComposeDataTest.showBccButton)).not.toBeInTheDocument();
    });
  });

  it('creates, saves, and re-opens draft', async () => {
    jest
      .spyOn(useCurrentLabel, 'useCurrentLabel')
      .mockImplementation(() => ({ label: SystemLabels.Drafts, userLabelVariant: null }));

    act(() => {
      render(
        <Provider store={store}>
          <MockedProvider mocks={mocks}>
            <DndProvider backend={HTML5Backend}>
              <Layout>
                <SystemLabelMailbox />
              </Layout>
            </DndProvider>
          </MockedProvider>
        </Provider>
      );
    });
    const composeButton = screen.getByTestId(SidebarDataTest.openComposeButton);
    await act(async () => {
      await userEvent.click(composeButton);
    });

    const toField = screen.getByTestId(ComposeDataTest.toField);
    const toInput = within(toField).getByPlaceholderText(/Recipients/i);
    const subjectField = screen.getByTestId(ComposeDataTest.subjectField);
    const subjectInput = within(subjectField).getByPlaceholderText(/Subject/i);
    const closeComposeButton = screen.getByTestId(ComposeHeaderDataTest.closeButton);

    await act(async () => {
      await userEvent.type(toInput, '2@skiff.com{enter}');
      await userEvent.type(subjectInput, 'test subject{tab}');
      // wait for a second before closing so draft content saves
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await userEvent.click(closeComposeButton);
    });

    // Click on message cell to edit draft
    const messageCell = await screen.findByText(/test subject/i);
    await act(async () => {
      await userEvent.click(messageCell);
    });

    // Verify that draft info is saved
    const newSubjectField = await screen.findByTestId(ComposeDataTest.subjectField);
    const newSubjectInput = within(newSubjectField).getByPlaceholderText(/Subject/i);
    expect(newSubjectInput).toHaveAttribute('value', 'test subject');
    const newToField = screen.getByTestId(ComposeDataTest.toField);
    expect(within(newToField).getByText('2')).toBeInTheDocument();
  });
});
