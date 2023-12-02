import { DocumentNode } from 'graphql';
import { graphql, GraphQLRequest, GraphQLVariables } from 'msw';
import { setupServer } from 'msw/node';
import {
  DecryptionServicePublicKeyDocument,
  CurrentUserEmailAliasesQuery,
  CurrentUserEmailAliasesQueryVariables,
  CurrentUserEmailAliasesDocument
} from 'skiff-front-graphql';
import { SyncState } from 'skiff-graphql';

import {
  Sync2Document,
  GetEmailsWithUnreadIcsQuery,
  GetEmailsWithUnreadIcsQueryVariables,
  GetEmailsWithUnreadIcsDocument,
  MarkEmailAsReadIcsMutation,
  MarkEmailAsReadIcsMutationVariables,
  MarkEmailAsReadIcsDocument,
  Sync2Mutation,
  Sync2MutationVariables,
  GetEventsQuery,
  GetEventsQueryVariables,
  GetEventsDocument,
  UsersFromEmailAliasQueryVariables,
  UsersFromEmailAliasDocument,
  UsersFromEmailAliasQuery
} from '../generated/graphql';

const routerMock = graphql.link('http://localhost:4000/graphql');

// Handler factories are functions that create / override mock request, helpfull when you need to mock difrent response from the backend during testing
const createHandlerFactory =
  <T extends Record<string, unknown>, Y extends GraphQLVariables>(doc: DocumentNode, mutation?: boolean) =>
  (response: T, spyRequest?: (req: GraphQLRequest<Y>) => void) =>
    routerMock[mutation ? 'mutation' : 'query']<T, Y>(doc, (req, res, ctx) => {
      if (spyRequest) {
        spyRequest(req);
      }
      return res(ctx.data(response));
    });

export const usersFromEmailAliasHandlerFactory = createHandlerFactory<
  UsersFromEmailAliasQuery,
  UsersFromEmailAliasQueryVariables
>(UsersFromEmailAliasDocument);
export const syncHandlerFactory = createHandlerFactory<Sync2Mutation, Sync2MutationVariables>(Sync2Document, true);

export const getEmailsWithUnreadIcsHandlerFactory = createHandlerFactory<
  GetEmailsWithUnreadIcsQuery,
  GetEmailsWithUnreadIcsQueryVariables
>(GetEmailsWithUnreadIcsDocument);

export const markEmailAsReadIcsHandlerFactory = createHandlerFactory<
  MarkEmailAsReadIcsMutation,
  MarkEmailAsReadIcsMutationVariables
>(MarkEmailAsReadIcsDocument, true);

export const currentUserAliasesFactory = createHandlerFactory<
  CurrentUserEmailAliasesQuery,
  CurrentUserEmailAliasesQueryVariables
>(CurrentUserEmailAliasesDocument);

export const getEventsFactory = createHandlerFactory<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument);

// Default handlers are good for most of the cases, for changing mocks please use handlerFactories
const defaultEmailWithUnreadIcsHandler = getEmailsWithUnreadIcsHandlerFactory({
  emailsWithUnreadICS2: { emails: [], hasMore: false }
});

const defaultSyncHandler = syncHandlerFactory({ sync2: { checkpoint: null, events: [], state: SyncState.Synced } });

const defaultDecryptionServicePublicKeyHandler = routerMock.query(
  DecryptionServicePublicKeyDocument,
  (_req, res, ctx) => {
    return res(ctx.data({ decryptionServicePublicKey: { key: 'uK6Q829DXc1ZEqEb+r6AN6tAkKTdOUTVerhPkgcgEGo=' } }));
  }
);

export const mswServer = setupServer(
  defaultEmailWithUnreadIcsHandler,
  defaultSyncHandler,
  defaultDecryptionServicePublicKeyHandler
);
