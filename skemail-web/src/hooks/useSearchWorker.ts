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

let worker = null;

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
function decryptEmailContent(email) {
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

function getDraftContent(draft) {
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

async function addThreadsToSearchIndex(threads) {
  for (const thread of threads) {
    const { emails, attributes, threadID } = thread;
    for (const email of emails) {
      const decryptedContent = 'encryptedText' in email ? decryptEmailContent(email) : getDraftContent(email);
      const { systemLabels, userLabels } = attributes;
      const { to, cc, bcc, from, createdAt, id } = email;
      const searchMail = {
        id,
        threadID,
        content: isMobile ? '' : decryptedContent.text || '',
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
const indexSkemails = async (currentUserID, indexOnThreadContentUpdatedAt) => {
  if (!currentUserID) {
    return;
  }

  const indexInDirection = async (direction) => {
    let cursor;
    const isDescending = direction === 'desc';

    while (true) {
      const threadUpdatedAtCutoff = (await worker?.searchIndex.metadata)?.[
        isDescending ? 'oldestThreadUpdatedAt' : 'newestThreadUpdatedAt'
      ];

      const paginateWithCursor = !!cursor && indexOnThreadContentUpdatedAt;

      const { data } = await client.query({
        query: MailboxWithContentDocument,
        variables: {
          request: {
            limit: SEARCH_PAGINATION_LIMIT,
            lastUpdatedDate: threadUpdatedAtCutoff && !paginateWithCursor ? new Date(threadUpdatedAtCutoff) : undefined,
            updatedAtField: indexOnThreadContentUpdatedAt ? UpdatedAtField.ThreadContentUpdatedAt : undefined,
            updatedAtOrderDirection: isDescending ? AscDesc.Desc : AscDesc.Asc,
            noExcludedLabel: true,
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
  const userData = useCurrentUserData();
  const { draftThreads } = useDrafts();
  const indexOnThreadContentUpdatedAt = useGetFF<IndexThreadContentUpdatedAtFlag>('indexThreadContentUpdatedAt');

  const draftRef = useRef(draftThreads); // Removed type annotation
  draftRef.current = draftThreads;

  useEffect(() => {
    if (!userData?.userID) return;
    let stopped = false;

    const setup = async () => {
      worker = await createWorkerizedSkemailSearchIndex(userData.userID, {
        privateKey: userData.privateUserData.privateKey,
        publicKey: userData.publicKey.key
      });
      if (stopped) {
        worker.terminate();
        worker = null;
      }
      while (!stopped) {
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
  const [searchIndexProgress, setSearchIndexProgress] = useState<SearchIndexProgressWithError>({});
  const [shouldGetProgress, setShouldGetProgress] = useState<boolean>(true);
  const [getSearchIndexProgress] = useGetSearchIndexProgressLazyQuery();

  const stopQueryingOnError = (e) => {
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
        if (isIndexComplete) setShouldGetProgress(false);
        setSearchIndexProgress({ progress: { numIndexableThreads, numThreadsIndexed, isIndexComplete } });
      } catch (e) {
        stopQueryingOnError(e);
      }
    };

    void updateProgress();

    const interval = setInterval(() => void updateProgress(), INDEX_PROGRESS_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [shouldGetProgress, getSearchIndexProgress]);

  return searchIndexProgress;
}
