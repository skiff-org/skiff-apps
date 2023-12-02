import { GraphQLRequest } from 'msw';

import { SyncMutationVariables, SyncState } from '../../generated/graphql';
import { sync } from '../../src/storage/useSync';
import { mswServer, syncHandlerFactory } from '../mockServer';

export const responseWhenClientSynced = (checkpoint: number) => ({
  sync2: {
    checkpoint: checkpoint + 500,
    events: [],
    state: SyncState.Synced
  }
});

export const validateClientIsSynced = async (checkpoint: number) => {
  const secondSyncRequestSpy = jest.fn<
    (req: GraphQLRequest<SyncMutationVariables>) => void,
    [GraphQLRequest<SyncMutationVariables>]
  >();
  const secondSyncMock = syncHandlerFactory(responseWhenClientSynced(checkpoint), secondSyncRequestSpy);
  mswServer.use(secondSyncMock);
  // Trigger sync after adding event locally
  await sync(null);

  const secondSyncMutationRequest = secondSyncRequestSpy.mock.calls[0][0].variables?.request?.events?.length as
    | number
    | undefined;
  expect(secondSyncMutationRequest).toBe(0);
};
