import { makeVar, useReactiveVar } from '@apollo/client';

import { SyncInnerState } from './useSync.types';

export const SYNCED_STATE = { syncing: false, intervalSync: false };
export const syncing = makeVar<SyncInnerState>(SYNCED_STATE);
export const setSyncing = (value: SyncInnerState) => {
  syncing(value);
};

const readingUnreadICS = makeVar<boolean>(false);
export const setReadingUnreadICS = (value: boolean) => readingUnreadICS(value);
export const useReadingUnreadICS = () => useReactiveVar(readingUnreadICS);
