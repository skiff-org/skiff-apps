import { useEffect, useRef } from 'react';
import { isIOS, isMobile } from 'react-device-detect';
import { decryptDatagram, decryptSessionKey } from 'skiff-crypto-v2';
import {
  AttachmentMetadataDatagram,
  EmailFragment,
  MailboxWithContentDocument,
  MailboxWithContentQuery,
  MailboxWithContentQueryVariables,
  ThreadFragment
} from 'skiff-front-graphql';
import { MailSubjectDatagram, MailTextDatagram } from 'skiff-front-graphql';
import { models } from 'skiff-front-graphql';
import { IndexedSkemail, createWorkerizedSkemailSearchIndex } from 'skiff-front-search';
import { requireCurrentUserData, useCurrentUserData } from 'skiff-front-utils';
import { AscDesc } from 'skiff-graphql';
import { sleep } from 'skiff-utils';

import client from '../apollo/client';
import { ThreadViewEmailInfo } from '../models/email';
import { ThreadDetailInfo } from '../models/thread';

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

function decryptEmailContent(email: EmailFragment) {
  const currentUser = requireCurrentUserData();
  const { privateKey } = currentUser.privateUserData;

  const encryptedSessionKey = email.encryptedSessionKey;
  const sessionKey = decryptSessionKey(
    encryptedSessionKey?.encryptedSessionKey,
    privateKey,
    encryptedSessionKey?.encryptedBy
  );
  const text = decryptDatagram(MailTextDatagram, sessionKey, email.encryptedText.encryptedData).body.text || '';
  const subject =
    decryptDatagram(MailSubjectDatagram, sessionKey, email.encryptedSubject.encryptedData).body.subject || '';
  const attachments = email.attachmentMetadata.map((attachment) => {
    return {
      attachmentID: attachment.attachmentID,
      ...decryptDatagram(AttachmentMetadataDatagram, sessionKey, attachment.encryptedData.encryptedData).body
    };
  });

  return { text, subject, attachments };
}
function getDraftContent(draft: ThreadViewEmailInfo) {
  return {
    text: draft.decryptedText,
    subject: draft.decryptedSubject,
    attachments:
      draft.decryptedAttachmentMetadata?.map((a) => {
        return {
          ...a.decryptedMetadata,
          __typename: undefined,
          attachmentID: a.attachmentID
        };
      }) || []
  };
}

async function addThreadsToSearchIndex(threads: Array<ThreadFragment | ThreadDetailInfo>) {
  for (const thread of threads) {
    const { emails, attributes, threadID } = thread;
    for (const email of emails) {
      // Draft emails will already have decrypted data, but emails downloaded
      // will only have encrypted data (because no-cache is set and type policies are not run).
      const decryptedContent = 'encryptedText' in email ? decryptEmailContent(email) : getDraftContent(email);
      // Search on parent threads system/user labels since messages don't have their own labels
      const { systemLabels, userLabels } = attributes;
      const { to, cc, bcc, from, createdAt, id } = email;
      const searchMail: IndexedSkemail = {
        id,
        threadID,
        content: isMobile ? '' : decryptedContent.text || '',
        // Draft emails will already have a date object, but emails downloaded will have a number (because no-cache is set).
        createdAt: new Date(createdAt).getTime(),
        updatedAt: new Date(createdAt).getTime(),
        subject: decryptedContent.subject || '',
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
        attachments: decryptedContent.attachments
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

      const res = await client.query<MailboxWithContentQuery, MailboxWithContentQueryVariables>({
        query: MailboxWithContentDocument,
        variables: {
          request: {
            limit: SEARCH_PAGINATION_LIMIT,
            lastUpdatedDate: threadUpdatedAtCutoff ? new Date(threadUpdatedAtCutoff) : undefined,
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
        newestThreadUpdatedAt: Math.max(
          metadata?.newestThreadUpdatedAt || 0,
          ...threads.map((t) => (t.emailsUpdatedAt instanceof Date ? t.emailsUpdatedAt.getTime() : t.emailsUpdatedAt))
        ),
        oldestThreadUpdatedAt: Math.min(
          metadata?.oldestThreadUpdatedAt || Infinity,
          ...threads.map((t) => (t.emailsUpdatedAt instanceof Date ? t.emailsUpdatedAt.getTime() : t.emailsUpdatedAt))
        )
      });
      await worker?.searchIndex.save();

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
        // temporarily disable indexing of drafts
        // if (draftThreads) {
        //   await addThreadsToSearchIndex(draftThreads);
        // }
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
