import { useEffect } from 'react';

import client from '../apollo/client';
import { useCurrentUserData } from '../apollo/currentUser';
import {
  MailboxDocument,
  MailboxQuery,
  MailboxQueryVariables,
  SystemLabels,
  ThreadFragment
} from '../generated/graphql';
import { User } from '../models/user';
import { sleep } from '../utils/jsUtils';
import { isIndexedWithCurrentValues } from '../utils/searchUtils';
import { SearchFilter, SearchItemType, SearchSkemail } from '../utils/searchWorkerUtils';
import getGlobalWorker from '../utils/UtilsWorker/globalWorker';
import useDebouncedAsyncCallback from './useDebouncedCallback';

/**
 * This is the interface to the search worker from the 'client' side
 * That is from this thread, the main thread. Even though the worker exports its
 * own interface, above, we export our own simplified interface from this file.
 * Our methods, exported here, also perform functionality handled by this
 * thread, such as saving the search index to localStorage with every modifying
 * operation.
 */
export interface SearchWorkerClient {
  add: (searchResult: SearchSkemail) => Promise<void>;
  remove: (emailID: string) => Promise<void>;
  search: (query: string, filters?: SearchFilter[]) => Promise<SearchSkemail[]>;
}

interface State {
  currentUserID: string;
  searchWorkerClient: SearchWorkerClient;
}

// Instantiate the state
let state: State | null = null;

/**
 * Get an interface to the search worker
 * @return {SearchWorkerClient | undefined} an object that allows access to the search
 * worker, or undefined if the worker isn't initialized
 */
export function getSearchWorker(): SearchWorkerClient | undefined {
  return state?.searchWorkerClient;
}

/**
 * Utility function: Adds all emails in given threads to the search index
 *
 * @param {Array<ThreadFragment>} threads threads to add to the search index
 * @param {number} sleepTimeInMs time to sleep between adding emails to the index (for background indexing only)
 * Returns true if all skemails were updated and needed to be added, returns false some skemails were already successfully indexed
 */
export async function addThreadsToSearchIndex(threads: Array<ThreadFragment>, sleepTimeInMs?: number) {
  for (const thread of threads) {
    const { emails, attributes, threadID } = thread;
    for (const email of emails) {
      const { id, createdAt, decryptedSubject, decryptedText, to, cc, bcc, from } = email;
      // Search on parent threads system/user labels since messages don't have their own labels
      const { systemLabels, userLabels } = attributes;
      const searchMail = {
        id,
        threadID,
        itemType: SearchItemType.Skemail as const,
        content: decryptedText || '',
        createdAt: createdAt.getTime(),
        subject: decryptedSubject ?? '',
        to,
        cc,
        bcc,
        from,
        systemLabels,
        userLabels: userLabels.map((label) => label.labelName),
        read: attributes.read
      };
      // If we've hit skemails that are already successfully in the index, return false
      // Since skemails are returned in updated order, this means all subsequent skemails
      // are also correctly indexed
      if (isIndexedWithCurrentValues(searchMail)) {
        return false;
      }
      await state?.searchWorkerClient.add(searchMail);
    }
    if (sleepTimeInMs) await sleep(sleepTimeInMs);
  }
  // Return true if all provided skemails were out-of-date and reindexed
  return true;
}

/** Time to sleep per skemail background indexing */
const SLEEP_TIME_PER_SKEMAIL_MS = 100;
/** How often to run the reindexing method */
const SEARCH_INDEX_SKEMAILS_INTERVAL_MS = 1000 * 60 * 5; // * 60 * 5;
/** Pagination page size */
const SEARCH_PAGINATION_LIMIT = 50;

/**
 * Index inbox in search index.
 */
const indexSkemails = async (userData: User | null) => {
  if (!userData || !state) {
    return;
  }

  const indexSkemailsWithLabel = async (label: string) => {
    let cursor: string | null | undefined = null;
    // Paginate through skemails we reach the end or reach one that already is correctly indexed
    while (true) {
      console.log('Search index query', cursor);
      const res = await client.query<MailboxQuery, MailboxQueryVariables>({
        query: MailboxDocument,
        variables: { request: { limit: SEARCH_PAGINATION_LIMIT, cursor, label } }
      });
      if (!res.data.mailbox?.threads) {
        break;
      }
      const { threads, pageInfo } = res.data.mailbox;
      // addThreadsToSearchIndex returns false if any skemails were found to already be indexed correctly
      // If it returns true, all skemails were unindexed or stale
      await addThreadsToSearchIndex(threads, SLEEP_TIME_PER_SKEMAIL_MS);
      if (!pageInfo.hasNextPage) {
        break;
      }
      cursor = pageInfo.cursor;
    }
  };

  // index all threads with various labels; needed because inbox query
  // supports per-label selection
  await indexSkemailsWithLabel(SystemLabels.Inbox);
  await indexSkemailsWithLabel(SystemLabels.Sent);
  await indexSkemailsWithLabel(SystemLabels.Drafts);
  await indexSkemailsWithLabel(SystemLabels.Trash);
};

/**
 * This hook initializes a search worker for the current worker. When the user
 * logs out, it also tears down the worker
 */
export function useInitializeSearchWorker() {
  // if undefined, stops after initialization
  const userData = useCurrentUserData();

  const worker = getGlobalWorker();
  const searchWorkerClient: SearchWorkerClient = {
    add: async (searchResult: SearchSkemail) => worker.searchAdd(searchResult),
    remove: async (emailID: string) => worker.searchRemove(emailID),
    search: async (query: string, filters: SearchFilter[] = []) => worker.search(query, filters)
  };

  const [indexSkemailsDebounced] = useDebouncedAsyncCallback(indexSkemails, 100);

  useEffect(() => {
    if (!userData) return;
    const setup = async () => {
      if (!state || state.currentUserID === userData.userID) {
        await worker.searchSetup(userData);
        state = { currentUserID: userData.userID, searchWorkerClient };
      }
    };

    void setup();

    return () => {
      void worker.searchTeardown();
      state = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    // start indexing after 5s
    setTimeout(() => void indexSkemailsDebounced(userData), 5000);
    const indexStaleDocumentsTimeoutID = setInterval(() => {
      void indexSkemailsDebounced(userData);
    }, SEARCH_INDEX_SKEMAILS_INTERVAL_MS);
    return () => {
      clearInterval(indexStaleDocumentsTimeoutID);
    };
  }, [indexSkemailsDebounced, userData]);

  if (!userData) return;
}
