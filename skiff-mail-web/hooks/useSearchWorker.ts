import { useEffect, useRef } from 'react';
import { isIOS, isMobile } from 'react-device-detect';
import { decryptDatagram, decryptSessionKey } from 'skiff-crypto-v2';
import { IndexedSkemail, createWorkerizedSkemailSearchIndex } from 'skiff-front-search';
import { AscDesc } from 'skiff-graphql';
import { MailboxDocument, MailboxQuery, MailboxQueryVariables } from 'skiff-mail-graphql';
import { MailSubjectDatagram, MailTextDatagram } from 'skiff-mail-graphql';
import { models } from 'skiff-mail-graphql';
import { sleep } from 'skiff-utils';

import client from '../apollo/client';
import { requireCurrentUserData, useCurrentUserData } from '../apollo/currentUser';

import { useDrafts } from './useDrafts';

let worker: Awaited<ReturnType<typeof createWorkerizedSkemailSearchIndex>> | null = null;
export const getSearchWorker = () => worker?.searchIndex;

/** Time to sleep per skemail background indexing */
const SLEEP_TIME_PER_PAGE_MS = isMobile && isIOS ? 3000 : 100;
/** How often to run the reindexing method */
const SEARCH_INDEX_SKEMAILS_INTERVAL_MS = 1000 * 60 * 5; // * 60 * 5;
/** Pagination page size */
const SEARCH_PAGINATION_LIMIT = isMobile && isIOS ? 10 : 50;

/**
 * Utility function: Adds all emails in given threads to the search index
 *
 * @param {Array<MailboxThreadInfo>} threads threads to add to the search index
 */
async function addThreadsToSearchIndex(threads: Array<any>) {
  for (const thread of threads) {
    const { emails, attributes, threadID } = thread;
    for (const email of emails) {
      const { id, createdAt, to, cc, bcc, from, encryptedSessionKey } = email;
      const currentUser = requireCurrentUserData();

      // Search on parent threads system/user labels since messages don't have their own labels
      const { systemLabels, userLabels } = attributes;
      const { privateKey } = currentUser.privateUserData;
      const sessionKey = decryptSessionKey(
        encryptedSessionKey?.encryptedSessionKey,
        privateKey,
        encryptedSessionKey?.encryptedBy
      );

      const searchMail: IndexedSkemail = {
        id,
        threadID,
        content: isIOS
          ? ''
          : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            decryptDatagram(MailTextDatagram, sessionKey, email.encryptedText.encryptedData).body.text || '',
        createdAt,
        updatedAt: createdAt,
        subject:
          decryptDatagram(MailSubjectDatagram, sessionKey, email.encryptedSubject.encryptedData).body.subject || '',
        to,
        toAddresses: to.map((toAddress) => toAddress.address),
        cc,
        ccAddresses: cc.map((ccAddress) => ccAddress.address),
        bcc,
        bccAddresses: bcc.map((bccAddress) => bccAddress.address),
        from,
        fromAddress: from.address,
        systemLabels,
        userLabels: userLabels.map((label) => label.labelName),
        read: attributes.read,
        attachments: email.decryptedAttachmentMetadata
      };
      if (!worker) {
        return;
      }
      await worker.searchIndex?.add(searchMail);
    }
  }
}

/**
 * Index inbox in search index.
 */
const indexSkemails = async (userData: models.User) => {
  if (!userData) {
    return;
  }

  // The search index contains the dates of the newest and oldest of indexed thread. From there we need to go in both direction:
  // - get threads older than oldestThreadUpdatedAt in updatedAt desc order (going from most recent to oldest)
  //     : happens if we did not finished the full indexation last browsing session
  // - get thread more recent than mostRecentThreadUpdatedAt in updatedAt asc order (going from oldest to most recent)
  //     : happens if there have been new skemails since we last indexed
  const indexInDirection = async (direction: 'asc' | 'desc') => {
    while (true) {
      const threadUpdatedAtCutoff = (await worker?.searchIndex.metadata)?.[
        direction === 'desc' ? 'oldestThreadUpdatedAt' : 'newestThreadUpdatedAt'
      ];

      const res = await client.query<MailboxQuery, MailboxQueryVariables>({
        query: MailboxDocument,
        variables: {
          request: {
            limit: SEARCH_PAGINATION_LIMIT,
            [direction === 'desc' ? 'emailsUpdatedBeforeDate' : 'emailsUpdatedAfterDate']: threadUpdatedAtCutoff
              ? new Date(threadUpdatedAtCutoff)
              : undefined,
            updatedAtOrderDirection: direction === 'desc' ? AscDesc.Desc : AscDesc.Asc,
            noExcludedLabel: true
          }
        },
        fetchPolicy: 'no-cache'
      });
      if (!res.data.mailbox?.threads) {
        break;
      }
      const { threads, pageInfo } = res.data.mailbox;
      await addThreadsToSearchIndex(threads);

      const metadata = await worker?.searchIndex?.metadata;
      await worker?.searchIndex.setMetadata({
        newestThreadUpdatedAt: Math.max(metadata?.newestThreadUpdatedAt || 0, ...threads.map((t) => t.emailsUpdatedAt)),
        oldestThreadUpdatedAt: Math.min(
          metadata?.oldestThreadUpdatedAt || Infinity,
          ...threads.map((t) => t.emailsUpdatedAt)
        )
      });

      if (!pageInfo.hasNextPage) {
        break;
      }
      await sleep(SLEEP_TIME_PER_PAGE_MS);
    }
  };

  await indexInDirection('desc');
  await indexInDirection('asc');
};

/**
 * This hook initializes a search worker for the current worker. When the user
 * logs out, it also tears down the worker
 */
export function useInitializeSearchWorker() {
  // if undefined, stops after initialization
  const userData = useCurrentUserData();
  const { draftThreads } = useDrafts();
  const draftRef = useRef<typeof draftThreads>(draftThreads); // used to always keep the latest version of draftThread for addThreadsToSearchIndex
  draftRef.current = draftThreads;

  useEffect(() => {
    if (!userData) return;
    let stopped = false; // used to stop setup() if the effect unloads while setup is still running

    const setup = async () => {
      worker = await createWorkerizedSkemailSearchIndex(userData.userID, {
        privateKey: userData.privateUserData.privateKey,
        publicKey: userData.publicKey.key
      });
      if (stopped) {
        // can happen if useEffect teardown function has been called before createWorkerizedSkemailSearchIndex returned
        worker.terminate();
        worker = null;
      }
      while (!stopped) {
        if (draftThreads) {
          await addThreadsToSearchIndex(draftThreads);
        }
        await indexSkemails(userData);
        await sleep(SEARCH_INDEX_SKEMAILS_INTERVAL_MS);
      }
    };
    void setup();

    return () => {
      stopped = true;
      void worker?.terminate();
      worker = null;
    };
  }, [userData?.userID, userData?.publicKey, userData?.privateUserData.privateKey]);
}
