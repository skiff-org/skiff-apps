/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react/display-name */
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import {
  DocumentCollaboratorInfoFragment,
  EditOrganizationDocument,
  EMPTY_DOCUMENT_DATA,
  GetDocumentBaseDocument,
  GetOrganizationDocument,
  GetOrganizationMembersDocument,
  models
} from 'skiff-front-graphql';
import { PermissionLevel } from 'skiff-graphql';

import { removeCurrentUserData, saveCurrentUserData } from '../../../apollo';

import OrganizationMemberList from './OrganizationMemberList';
import OrganizationName from './OrganizationName';

const mockEveryoneTeamID = 'everyoneTeamID';
const orgID = 'mockOrgID';
const orgName = 'mockOrgName';
const orgNamePlaceholder = 'Nightwatch Inc.';
const orgRootDocID = 'mockOrgRootDocID';
const everyoneTeamDocID = 'mockEveryoneTeamDocID';
const collaborators: DocumentCollaboratorInfoFragment[] = [
  {
    user: { userID: 'userID1', username: 'username1', publicData: { displayName: 'displayname1' } },
    permissionLevel: PermissionLevel.Admin,
    sourceDocID: orgRootDocID
  },
  {
    user: { userID: 'userID2', username: 'username2', publicData: { displayName: 'displayname2' } },
    permissionLevel: PermissionLevel.Editor,
    sourceDocID: everyoneTeamDocID
  }
];

const mockQuery = jest.fn();
const mockClient = jest.fn(() => ({
  query: mockQuery
})) as unknown as ApolloClient<NormalizedCacheObject>;

const mockOpenSettings = jest.fn();

jest.mock('../../ReactPdf');

const GET_ORG_MOCK = {
  request: {
    query: GetOrganizationDocument,
    variables: { id: orgID }
  },
  result: {
    data: {
      organization: {
        orgID,
        orgName,
        orgRootDocID,
        everyoneTeam: {
          teamID: mockEveryoneTeamID,
          rootDocument: {
            collaborators,
            currentUserPermissionLevel: collaborators[0].permissionLevel,
            invites: [{ docID: everyoneTeamDocID, email: 'pending1', permissionLevel: PermissionLevel.Editor }]
          }
        }
      }
    }
  }
};

describe('OrganizationMemberList', () => {
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
    saveCurrentUserData({ ...mockUser, rootOrgID: orgID });
  });

  afterAll(() => {
    removeCurrentUserData();
  });

  it('renders all members of the organization', async () => {
    render(
      <MockedProvider
        addTypename={false}
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={[
          {
            request: {
              query: GetOrganizationMembersDocument,
              variables: { id: orgID }
            },
            result: {
              data: {
                organization: {
                  orgID,
                  name: orgName,
                  rootDocID: orgRootDocID,
                  everyoneTeam: {
                    teamID: mockEveryoneTeamID,
                    rootDocument: { collaborators, currentUserPermissionLevel: collaborators[0].permissionLevel }
                  }
                }
              }
            }
          },
          GET_ORG_MOCK
        ]}
      >
        <SnackbarProvider>
          <OrganizationMemberList client={mockClient} openSettings={mockOpenSettings} />
        </SnackbarProvider>
      </MockedProvider>
    );
    expect(await screen.findByPlaceholderText(orgNamePlaceholder)).toBeVisible();
    expect(await screen.findByText('username1')).toBeVisible();
    expect(await screen.findByText('username2')).toBeVisible();
  });

  it('shows pending members of the organization', async () => {
    render(
      <MockedProvider
        addTypename={false}
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={[
          {
            request: {
              query: GetOrganizationMembersDocument,
              variables: { id: orgID }
            },
            result: {
              data: {
                organization: {
                  orgID,
                  name: orgName,
                  rootDocID: orgRootDocID,
                  everyoneTeam: {
                    teamID: mockEveryoneTeamID,
                    rootDocument: {
                      collaborators,
                      currentUserPermissionLevel: collaborators[0].permissionLevel,
                      invites: [
                        { docID: everyoneTeamDocID, email: 'pending1', permissionLevel: PermissionLevel.Editor }
                      ]
                    }
                  }
                }
              }
            }
          },
          GET_ORG_MOCK
        ]}
      >
        <SnackbarProvider>
          <OrganizationMemberList client={mockClient} openSettings={mockOpenSettings} />
        </SnackbarProvider>
      </MockedProvider>
    );
    expect(await screen.findAllByText('pending1')).toHaveLength(1);
    expect(await screen.findByTestId('pending-user-options')).toBeVisible();
    expect(await screen.findByText(/editor/i)).toBeVisible();
  });

  // TODO: Fix
  it.skip('allows the admin of the org to edit the org name', async () => {
    const updatedOrgName = 'mockUpdatedOrgName';

    render(
      <MockedProvider
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={[
          {
            request: {
              query: GetOrganizationMembersDocument,
              variables: { id: orgID }
            },
            result: {
              data: {
                organization: {
                  orgID,
                  name: orgName,
                  rootDocID: orgRootDocID,
                  everyoneTeam: {
                    teamID: mockEveryoneTeamID,
                    rootDocument: {
                      collaborators,
                      currentUserPermissionLevel: collaborators[0].permissionLevel,
                      invites: [
                        { docID: everyoneTeamDocID, email: 'pending1', permissionLevel: PermissionLevel.Editor }
                      ]
                    }
                  }
                }
              }
            }
          },
          GET_ORG_MOCK,
          {
            request: {
              query: EditOrganizationDocument,
              variables: { request: { orgID, name: `${orgName}${updatedOrgName}` } }
            },
            result: {
              data: {
                editOrganization: {
                  organization: { orgID, name: `${orgName}${updatedOrgName}` }
                }
              }
            }
          }
        ]}
      >
        <SnackbarProvider>
          <OrganizationMemberList client={mockClient} openSettings={mockOpenSettings} />
        </SnackbarProvider>
      </MockedProvider>
    );

    const input = await screen.findByTestId<HTMLInputElement>('edit-org-name-input');
    await waitFor(() => expect(input.value).toBe(orgName), { timeout: 4000 });

    expect(screen.getByPlaceholderText(orgNamePlaceholder)).toBeVisible();
    userEvent.type(input, updatedOrgName);
    userEvent.type(input, '{enter}');
    await screen.findByText(updatedOrgName);
    // Should now be two elements with the org text: input and displayed name
    expect(screen.queryAllByText(updatedOrgName)).toHaveLength(2);
  });

  it("doesn't allow the user to edit the org name if they do not have access to the org root doc", async () => {
    render(
      <MockedProvider
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={[
          {
            request: {
              query: GetOrganizationMembersDocument,
              variables: { id: orgID }
            },
            result: {
              data: {
                organization: {
                  orgID,
                  name: orgName,
                  rootDocID: orgRootDocID,
                  everyoneTeam: {
                    teamID: mockEveryoneTeamID,
                    rootDocument: {
                      collaborators,
                      currentUserPermissionLevel: collaborators[1].permissionLevel,
                      invites: [
                        { docID: everyoneTeamDocID, email: 'pending1', permissionLevel: PermissionLevel.Editor }
                      ]
                    }
                  }
                }
              }
            }
          },
          GET_ORG_MOCK
        ]}
      >
        <OrganizationName />
      </MockedProvider>
    );
    expect(await screen.findByPlaceholderText(orgNamePlaceholder)).toBeVisible();
    expect(screen.queryByTestId('edit-org-name-input')).toBeDisabled();
  });

  it('allows users to invite other people to the organization', async () => {
    render(
      <MockedProvider
        defaultOptions={{ query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } }}
        mocks={[
          {
            request: {
              query: GetOrganizationMembersDocument,
              variables: { id: orgID }
            },
            result: {
              data: {
                organization: {
                  orgID,
                  name: orgName,
                  rootDocID: orgRootDocID,
                  everyoneTeam: {
                    teamID: mockEveryoneTeamID,
                    rootDocument: {
                      collaborators,
                      currentUserPermissionLevel: collaborators[0].permissionLevel,
                      invites: [
                        { docID: everyoneTeamDocID, email: 'pending1', permissionLevel: PermissionLevel.Editor }
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            request: {
              query: GetDocumentBaseDocument,
              variables: { request: { docID: orgRootDocID } }
            },
            result: { data: undefined }
          },
          GET_ORG_MOCK
        ]}
      >
        <SnackbarProvider>
          <OrganizationMemberList client={mockClient} openSettings={mockOpenSettings} />
        </SnackbarProvider>
      </MockedProvider>
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const inviteButton = await screen.findByText('Add members');
    userEvent.click(inviteButton);
    expect(await screen.findByTestId('workspace-invite-modal')).toBeInTheDocument();
  });
});
