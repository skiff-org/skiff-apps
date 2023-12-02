import { compile } from 'html-to-text';
import { useEffect, useRef, useState } from 'react';
import { isIOS, isMobile } from 'react-device-detect';
import { decryptDatagramV2, decryptSessionKey } from 'skiff-crypto';
import {
  AttachmentMetadataDatagram,
  EmailFragment,
  MailSubjectDatagram,
  MailTextDatagram,
  MailHtmlDatagram,
  MailboxWithContentDocument,
  MailboxWithContentQuery,
  MailboxWithContentQueryVariables,
  ThreadFragment,
  useGetSearchIndexProgressLazyQuery
} from 'skiff-front-graphql';
import { IndexedSkemail, createWorkerizedSkemailSearchIndex } from 'skiff-front-search';
import { requireCurrentUserData, useCurrentUserData, useGetFF } from 'skiff-front-utils';
import { SearchIndexProgress, MailboxCursor, UpdatedAtField, AscDesc } from 'skiff-graphql';
import { sleep, IndexThreadContentUpdatedAtFlag } from 'skiff-utils';

import client from '../apollo/client';
import { SKIFF_BLOCKQUOTE_CLASSNAME } from '../components/MailEditor/Blockquote/Blockquote';
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

// compile html parser options for more performant repeated use
const htmlToPlainText = compile({
  selectors: [
    // ignore all links, only process internal text of anchor tags
    { selector: 'a', options: { ignoreHref: true } },
    // ignore images and src links
    { selector: 'img', format: 'skip' },
    // ignore everything below "Show previous content" on multi-email threads;
    // otherwise, each email contains all previous email text and results in duplicate search results
    { selector: `.${SKIFF_BLOCKQUOTE_CLASSNAME}`, format: 'skip' }
  ]
});

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
  const plainText = decryptDatagramV2(MailTextDatagram, sessionKey, email.encryptedText.encryptedData).body.text || '';
  const html = decryptDatagramV2(MailHtmlDatagram, sessionKey, email.encryptedHtml.encryptedData).body.html || '';
  // ensure we cover pure-html emails and parse emails to ignore content irrelevant to search, such as links, images,
  // and previous emails nested under "Show previous content"
  const text = html ? htmlToPlainText(html) : plainText;
  const subject =
    decryptDatagramV2(MailSubjectDatagram, sessionKey, email.encryptedSubject.encryptedData).body.subject || '';
  const attachments = email.attachmentMetadata.map((attachment) => {
    return {
      attachmentID: attachment.attachmentID,
      ...decryptDatagramV2(AttachmentMetadataDatagram, sessionKey, attachment.encryptedData.encryptedData).body
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
        // we conceptualize email's 'createdAt' as 'updatedAt' even though it won't change, to conform to assumptions of search logic
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
const indexSkemails = async (currentUserID: string, indexOnThreadContentUpdatedAt?: boolean) => {
  // return if current user data hasn't loaded
  if (!currentUserID) {
    return;
  }

  // The search index contains the dates of the newest and oldest of indexed thread. From there we need to go in both direction:
  // - get threads older than oldestThreadUpdatedAt in updatedAt desc order (going from most recent to oldest)
  //     : happens if we did not finished the full indexation last browsing session
  // - get thread more recent than mostRecentThreadUpdatedAt in updatedAt asc order (going from oldest to most recent)
  //     : happens if there have been new skemails since we last indexed
  const indexInDirection = async (direction: 'asc' | 'desc') => {
    let cursor: MailboxCursor | undefined;
    const isDescending = direction === 'desc';

    while (true) {
      const threadUpdatedAtCutoff = (await worker?.searchIndex.metadata)?.[
        isDescending ? 'oldestThreadUpdatedAt' : 'newestThreadUpdatedAt'
      ];

      const paginateWithCursor = !!cursor && indexOnThreadContentUpdatedAt;

      const { data } = await client.query<MailboxWithContentQuery, MailboxWithContentQueryVariables>({
        query: MailboxWithContentDocument,
        variables: {
          request: {
            limit: SEARCH_PAGINATION_LIMIT,
            lastUpdatedDate: threadUpdatedAtCutoff && !paginateWithCursor ? new Date(threadUpdatedAtCutoff) : undefined,
            // using 'threadContentUpdatedAt' to describe the bounds of the index ensures we cover two edge cases
            // relating to threads whose 'emailsUpdatedAt' date is *earlier* than their time of creation:
            // 1. if a user imports new mail, and some of the imported threads have a most-recent email
            // whose 'createdAt' date falls within the timespan that the index has already covered, we would miss it
            // 2. if we merge two threads together, the newly created thread could be exposed to the same edge case
            updatedAtField: indexOnThreadContentUpdatedAt ? UpdatedAtField.ThreadContentUpdatedAt : undefined,
            updatedAtOrderDirection: isDescending ? AscDesc.Desc : AscDesc.Asc,
            noExcludedLabel: true,
            // following the first query, we use a cursor, because it's possible that more than SEARCH_PAGINATION_LIMIT
            // threads have the same 'threadContentUpdatedAt' date (e.g. when an import happens, all imported threads will have the same date),
            // meaning that if we did not use the cursor, we could loop through the same page of threads repeatedly
            cursor: paginateWithCursor ? cursor : undefined
          }
        },
        fetchPolicy: 'no-cache'
      });
      if (!data.mailbox?.threads) {
        break;
      }
      const { threads, pageInfo } = data.mailbox;
      await addThreadsToSearchIndex(threads);

      const metadata = await worker?.searchIndex?.metadata;
      await worker?.searchIndex.setMetadata({
        newestThreadUpdatedAt: Math.max(
          metadata?.newestThreadUpdatedAt || 0,
          ...threads.map((t) => {
            const newestDateCandidate = indexOnThreadContentUpdatedAt ? t.threadContentUpdatedAt : t.emailsUpdatedAt;
            return newestDateCandidate instanceof Date ? newestDateCandidate.getTime() : newestDateCandidate;
          })
        ),
        oldestThreadUpdatedAt: Math.min(
          metadata?.oldestThreadUpdatedAt || Infinity,
          ...threads.map((t) => {
            const oldestDateCandidate = indexOnThreadContentUpdatedAt ? t.threadContentUpdatedAt : t.emailsUpdatedAt;
            return oldestDateCandidate instanceof Date ? oldestDateCandidate.getTime() : oldestDateCandidate;
          })
        )
      });
      await worker?.searchIndex.save();

      if (!pageInfo.hasNextPage) {
        break;
      }
      // set the cursor for subsequent loops
      cursor = pageInfo.cursor
        ? {
            threadID: pageInfo.cursor.threadID,
            date: pageInfo.cursor.date
          }
        : undefined;
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
  const indexOnThreadContentUpdatedAt = useGetFF<IndexThreadContentUpdatedAtFlag>('indexThreadContentUpdatedAt');

  const draftRef = useRef<typeof draftThreads>(draftThreads); // used to always keep the latest version of draftThread for addThreadsToSearchIndex
  draftRef.current = draftThreads;

  useEffect(() => {
    if (!userData?.userID) return;
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
        await indexSkemails(userData.userID, indexOnThreadContentUpdatedAt);
        await sleep(SEARCH_INDEX_SKEMAILS_INTERVAL_MS);
      }
    };
    void setup();

    return () => {
      stopped = true;
      void worker?.terminate();
      worker = null;
    };
  }, [userData?.userID, userData?.publicKey, userData?.privateUserData.privateKey, indexOnThreadContentUpdatedAt]);
}

// how often we check for changes in index progress
const INDEX_PROGRESS_UPDATE_INTERVAL = 3000; //ms

interface SearchIndexProgressWithError {
  progress?: SearchIndexProgress;
  progressRetrievalError?: boolean;
}

export function useGetSearchIndexProgress(): SearchIndexProgressWithError {
  // initialize both progress and error as undefined
  const [searchIndexProgress, setSearchIndexProgress] = useState<SearchIndexProgressWithError>({});
  // check progress until the index is confirmed to be complete
  const [shouldGetProgress, setShouldGetProgress] = useState<boolean>(true);
  const [getSearchIndexProgress] = useGetSearchIndexProgressLazyQuery();

  const stopQueryingOnError = (e: unknown) => {
    // this is non-critical logic whose failure does not need to be communicated to the user,
    // so if it fails, we stop querying and report the error to the caller
    setSearchIndexProgress({ progressRetrievalError: true });
    setShouldGetProgress(false);
    console.error('Error in retrieving search index progress', e);
  };

  useEffect(() => {
    if (!shouldGetProgress) return;
    const updateProgress = async () => {
      try {
        const metadata = await worker?.searchIndex.metadata;
        if (!metadata?.newestThreadUpdatedAt || !metadata.oldestThreadUpdatedAt) return;
        const { oldestThreadUpdatedAt, newestThreadUpdatedAt } = metadata;
        const { data, error } = await getSearchIndexProgress({
          variables: {
            request: {
              oldestThreadUpdatedAtInIndex: new Date(oldestThreadUpdatedAt),
              newestThreadUpdatedAtInIndex: new Date(newestThreadUpdatedAt)
            }
          }
        });
        if (error) {
          stopQueryingOnError(error.message);
          return;
        }
        if (!data?.searchIndexProgress) return;
        const { numIndexableThreads, numThreadsIndexed, isIndexComplete } = data.searchIndexProgress;
        // stop getting the progress after the index is complete
        if (isIndexComplete) setShouldGetProgress(false);
        setSearchIndexProgress({ progress: { numIndexableThreads, numThreadsIndexed, isIndexComplete } });
      } catch (e) {
        stopQueryingOnError(e);
      }
    };

    void updateProgress();

    // check the search worker on an interval to see if the newest and oldest threads have changed
    const interval = setInterval(() => void updateProgress(), INDEX_PROGRESS_UPDATE_INTERVAL);

    // clear the interval on cleanup
    return () => clearInterval(interval);
  }, [shouldGetProgress, getSearchIndexProgress]);

  return searchIndexProgress;
}
