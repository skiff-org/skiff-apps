import isEqual from 'lodash/isEqual';
import last from 'lodash/last';
import partition from 'lodash/partition';
import {
  Button,
  DISPLAY_SCROLLBAR_CSS,
  Icon,
  IconButton,
  Icons,
  ThemeMode,
  Type,
  Typography,
  TypographyWeight
} from 'nightwatch-ui';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserView, MobileView, isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetThreadFromIdQuery, useIsCustomDomainQuery, useMarkThreadAsOpenedMutation } from 'skiff-front-graphql';
import {
  UnsubscribeInfo,
  WalletAliasWithName,
  dayjs,
  getUnsubscribeLinks,
  splitEmailToAliasAndDomain,
  useCurrentUserEmailAliases,
  useDefaultEmailAlias,
  useRequiredCurrentUserData,
  useTheme
} from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { UPDATES_EMAIL_ALIAS, getMailDomain } from 'skiff-utils';
import styled from 'styled-components';

import { NO_SUBJECT_TEXT } from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useGetRawMime } from '../../hooks/useGetRawMime';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUserLabelsToRenderAsChips } from '../../hooks/useUserLabelsToRenderAsChips';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { getScheduledSendAtDateForThread, updateThreadAsReadUnread } from '../../utils/mailboxUtils';
import { useAttachments } from '../Attachments';
import { BOTTOM_NAVIGATION_HEIGHT, THREAD_BODY_ID } from '../mailbox/consts';

import ApplyUserLabelDrawer from './ApplyUserLabelDrawer';
import MoveThreadDrawer from './MoveThreadMobileDrawer';
import { ReplyDrawer } from './ReplyDrawer';
import ReportThreadBlockDrawer from './ReportThreadBlockDrawer';
import { ThreadNavigationIDs } from './Thread.types';
import ThreadBlock from './ThreadBlock';
import ThreadHeader from './ThreadHeader';
import { TrashedEmailsBlock } from './TrashedEmailsBlock';
import { useThreadOptions } from './useThreadOptions';

const Compose = React.lazy(() => import('../Compose/Compose'));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ThreadBody = styled.div`
  ::-webkit-scrollbar-thumb {
    background: transparent;
  }
  overflow-y: auto;
  :hover {
    ${DISPLAY_SCROLLBAR_CSS}
  }
  height: 100%;
  ${!isMobile
    ? 'padding: 12px 24px 64px 24px;'
    : `
    padding: 0px;
    background: var(--bg-main-container);
    padding-bottom: calc(${BOTTOM_NAVIGATION_HEIGHT}px + 32px + env(safe-area-inset-bottom, 0px));
    height: unset;
    flex: 1;
  `}
`;

const ThreadSpacer = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
`;

const ThreadCollapsedDivider = styled.div<{ expanded: boolean; isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 12px 24px;
  border-radius: 8px;
  justify-content: space-between;
  margin: 16px 0px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-l2-solid);
  &:hover {
    box-shadow: var(--shadow-l1);
    background: ${(props) => (props.isDarkMode && !props.expanded ? 'var(--bg-l3-solid)' : 'var(--bg-l2-solid)')};
  }
`;

const MobileReplyContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
  padding: 32px 16px;
  box-sizing: border-box;
`;

const ReplyComposeContainer = styled.div`
  background: var(--bg-l2-solid);
  margin-top: 12px;
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
`;

const ThreadSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  height: 90vh;
  border-radius: 8px;
  background: var(--bg-l2-solid);
  border: 1px solid var(--border-secondary);
`;

// The maximum number of emails shown initially (rest are collapsed)
const MAXIMUM_INITIAL_EMAILS_SHOWN = 3;

type ThreadProps = {
  threadID: string;
  onClose: () => void;
  // defined if component is keeping track of the active thread and email itself instead of using route params
  // prop will take precedence over setting route params
  setActiveThreadAndEmail?: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  // defined if component is keeping track of the active email itself instead of using route params
  // prop will take precedence over setting route params
  emailID?: string;
  nextThreadAndEmail?: ThreadNavigationIDs;
  prevThreadAndEmail?: ThreadNavigationIDs;
  // Aliases
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
  walletAliasesWithName: WalletAliasWithName[];
};

const EMPTY_REPLY_HEIGHT = 440;

/**
 * Component for rendering a thread of emails.
 */
function Thread({
  threadID,
  onClose,
  setActiveThreadAndEmail,
  emailID,
  nextThreadAndEmail,
  prevThreadAndEmail,
  defaultEmailAlias,
  emailAliases,
  walletAliasesWithName
}: ThreadProps) {
  const { data, loading: isThreadDataLoading } = useGetThreadFromIdQuery({ variables: { threadID } });
  const threadDeletedAt = data?.userThread?.deletedAt ? dayjs(data.userThread.deletedAt) : undefined;
  const emailsFromQuery: ThreadViewEmailInfo[] = data?.userThread?.emails ?? [];
  const attributes = data?.userThread?.attributes;
  const userLabels = attributes?.userLabels ?? [];
  const labelsToRender = useUserLabelsToRenderAsChips(userLabels, true);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const userSignature = useUserSignature();
  const { replyComposeOpen } = useAppSelector((state) => state.modal);
  const { value: currentLabel } = useRouterLabelContext() ?? { value: SystemLabels.Inbox }; // fallback for when router label context is undefined, not expected when a thread is open
  const { emailAliases: currentUserEmailAliases, quickAliases } = useCurrentUserEmailAliases();
  const [attachedPublicKey, setAttachedPublicKey] = useState<string | undefined>(undefined);
  // Append the pending replies to the thread's emails. A pending reply is one that is not
  // yet in the cache (not yet polled from the server), but the user has sent the email.
  // We append it so that we can optimistically show the sent email on the thread before the next poll.
  const pendingReplies = useAppSelector((state) => state.mailbox.pendingReplies);
  const pendingRepliesForThread = pendingReplies.filter((reply) => reply.threadID === threadID);
  const emails = pendingRepliesForThread.reduce(
    (acc, reply) => {
      // Only add the pending reply to the emails list if it is not already there
      if (!acc.find((email) => email.id === reply.email.id)) return [...acc, reply.email];
      return acc;
    },
    [...emailsFromQuery]
  );
  // Update the thread with the updated emails
  const thread = useMemo(
    () => (data?.userThread ? { ...data.userThread, emails } : undefined),
    [data?.userThread, emails]
  );

  const firstEmail = emails[0];
  const rawMimeContentFirstEmail = useGetRawMime(firstEmail);

  const { getAttachedPublicKey } = useAttachments({
    metadata: firstEmail?.decryptedAttachmentMetadata
  });

  const isThreadOnlyInTrash =
    thread?.attributes.systemLabels.length === 1 && thread?.attributes.systemLabels.includes(SystemLabels.Trash);
  const [nonTrashedEmails, trashedEmails] = partition(emails, (email) => {
    // If the thread only contains trashed emails (it only has the TRASH system label)
    // or we are in the Trash mailbox, we want to show all emails normally so we treat
    // all emails as "non trash"
    if (isThreadOnlyInTrash || currentLabel === SystemLabels.Trash) return true;
    return !threadDeletedAt || dayjs(email.createdAt).isAfter(threadDeletedAt);
  });
  const isSending = useAppSelector((state) => state.modal.isSending);

  const { composeNewDraft } = useDrafts();

  const allThreadParticipantDomains: string[] = [
    ...new Set(
      nonTrashedEmails.flatMap(({ from, to, cc, bcc }) =>
        [from, ...to, ...cc, ...bcc].map(({ address }) => {
          const { domain } = splitEmailToAliasAndDomain(address);
          return domain;
        })
      )
    )
  ].sort();

  const isSkiffDomain = (domain: string) => {
    return domain === getMailDomain();
  };

  const allRecipientsAreSkiffDomain = allThreadParticipantDomains.every((domain) => isSkiffDomain(domain));
  // from address is 'updates@marketing.skiff.org' and there is 1 from and 1 to
  // also, make sure there is no encryptedRawMimeUrl to make sure it was sent internally by Skemailer
  const isInternalSkiffUpdate =
    firstEmail?.from?.address === UPDATES_EMAIL_ALIAS &&
    firstEmail?.to?.length === 1 &&
    !firstEmail?.encryptedRawMimeUrl;

  const { data: isCustomDomainData } = useIsCustomDomainQuery({
    variables: {
      domains: allThreadParticipantDomains.filter((domain) => !isSkiffDomain(domain))
    },
    skip: allRecipientsAreSkiffDomain
  });

  const isSkiffInternal = allRecipientsAreSkiffDomain || !!isCustomDomainData?.isCustomDomain || isInternalSkiffUpdate;

  const lastEmail = nonTrashedEmails[nonTrashedEmails.length - 1];
  const reply = React.useCallback(() => {
    if (!lastEmail) {
      console.error('Could not reply, no recent email found');
      return;
    }

    composeNewDraft();
    if (!thread) return;
    dispatch(
      skemailModalReducer.actions.replyCompose({
        email: lastEmail,
        thread,
        emailAliases,
        quickAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  }, [composeNewDraft, defaultEmailAlias, dispatch, lastEmail, emailAliases, quickAliases, thread, userSignature]);

  const replyAll = () => {
    if (!lastEmail) {
      console.error('Could not reply all, no recent email found');
      return;
    }

    composeNewDraft();
    if (!thread) return;
    dispatch(
      skemailModalReducer.actions.replyAllCompose({
        email: lastEmail,
        thread,
        emailAliases,
        quickAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const forward = () => {
    if (!lastEmail) {
      console.error('Could not forward, no recent email found');
      return;
    }

    composeNewDraft();
    if (!thread) return;
    dispatch(
      skemailModalReducer.actions.forwardCompose({
        email: lastEmail,
        emailAliases,
        quickAliases,
        defaultEmailAlias,
        thread
      })
    );
  };

  const emailRefs = nonTrashedEmails.reduce((acc, val) => {
    acc[val.id] = React.createRef<HTMLDivElement | null>();
    return acc;
  }, {} as Record<string, React.MutableRefObject<HTMLDivElement | null>>);

  const { activeEmailID: routeActiveEmailID } = useThreadActions();
  const activeEmailID = emailID || routeActiveEmailID;
  // Fill a Record<emailID, boolean> with false except for the id of the last email
  const initialIsExpanded = emails.reduce((acc, email) => {
    acc[email.id] = email.id === last(emails)?.id;
    return acc;
  }, {} as Record<string, boolean>);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>(initialIsExpanded);
  // So that we only scroll and expand on load
  const [hasScrolled, setHasScrolled] = useState(false);

  // Don't collapse if mobile, we have fewer than MAXIMUM_INITIAL_EMAILS_SHOWN emails, or activeEmailID is present
  const initialCollapsedState =
    !isMobile &&
    nonTrashedEmails.length > MAXIMUM_INITIAL_EMAILS_SHOWN &&
    !(activeEmailID && activeEmailID in isExpanded);

  const [threadIsCollapsed, setThreadIsCollapsed] = useState(initialCollapsedState);

  const [markThreadAsOpened] = useMarkThreadAsOpenedMutation();

  const options = useThreadOptions(
    thread,
    nonTrashedEmails[nonTrashedEmails.length - 1],
    currentLabel,
    defaultEmailAlias,
    emailAliases,
    quickAliases
  );

  useEffect(() => {
    if (thread?.threadID) {
      // 5 seconds after the thread loads, mark the thread as opened. We use this
      // information as part of determining whether to suggest a sender to silence or not
      const timer = setTimeout(() => {
        void markThreadAsOpened({
          variables: {
            request: {
              threadID: thread.threadID
            }
          }
        });
      }, 5000); // 5 seconds

      // Clear the timer if the component is closed before the 5-second delay
      return () => clearTimeout(timer);
    }
  }, [thread?.threadID]);

  useEffect(() => {
    // If the active email ID changes, reset scroll/ expanded state so that the new
    // active email is opened
    setHasScrolled(false);
    setIsExpanded(initialIsExpanded);

    if (replyComposeOpen.open && !replyComposeOpen.popOut) {
      // close reply compose when thread changes
      dispatch(skemailModalReducer.actions.closeReplyCompose());
    }

    // Only run when the active email ID has changed
    // Including initialIsExpanded will cause infinite rerenders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmailID]);

  useEffect(() => {
    // If a thread is opened, and the thread is unread (when opened from notification) mark it as read
    if (thread && !thread.attributes.read) {
      void updateThreadAsReadUnread([thread.threadID], true, thread.attributes.systemLabels);
    }
  }, [thread]);

  useEffect(() => {
    // Prevent infinite loop from when ref changes
    if (hasScrolled) {
      return;
    }
    setTimeout(() => {
      if (threadBodyRef.current && !activeEmailID) {
        // If no email is active scroll the to beginning of the last email in thread
        const shrinkedThreadsHeight = nonTrashedEmails
          .slice(0, -1)
          .reduce<number>((prev, curr) => prev + (emailRefs[curr.id]?.current?.getBoundingClientRect().height || 0), 0);
        if (shrinkedThreadsHeight) {
          threadBodyRef.current?.scrollBy({ top: shrinkedThreadsHeight, behavior: 'smooth' });
          setHasScrolled(true);
        }
      } else if (threadBodyRef.current && activeEmailID && emailRefs[activeEmailID]?.current) {
        const offsetTop = emailRefs[activeEmailID]?.current?.offsetTop;
        threadBodyRef.current.scrollTo({
          top: offsetTop,
          left: 0,
          behavior: 'smooth'
        });
        setIsExpanded((prev) => ({ ...prev, [activeEmailID]: true }));
        setHasScrolled(true);
      }
    }, 100);
  }, [activeEmailID, emailRefs, nonTrashedEmails, hasScrolled]);

  // scroll to bottom when opening a reply
  useEffect(() => {
    if (!replyComposeOpen.open) {
      return;
    }
    setTimeout(() => {
      if (threadBodyRef.current && replyRef.current) {
        // scroll to reply
        replyRef.current.scrollIntoView();
        const replyHeight = replyRef.current.getBoundingClientRect().height;
        // align to top based on height (if too short, e.g. reply, scroll to bottom)
        threadBodyRef.current.scrollBy(0, replyHeight > EMPTY_REPLY_HEIGHT ? -200 : 1000);
      }
    }, 100);
  }, [replyComposeOpen]);

  useEffect(() => {
    // Wait for thread from ID query to load
    if (isThreadDataLoading) return;
    // If thread does not exist set activeThreadID to undefined
    if (!data) {
      onClose();
    }
  }, [data, isThreadDataLoading]);

  // Set the first selected emails as the most recent
  useEffect(() => {
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(last(nonTrashedEmails) as MailboxEmailInfo));
  }, [dispatch, nonTrashedEmails]);

  // make sure that all incoming mails in the thread get default expanded value
  useEffect(() => {
    // If thread data has just finished loading, set is expanded to the initial values
    if (emails.length === 0) return; // If there are no emails return, otherwise get infinite loop (we get no emails when we have invalid thread id)
    if (!Object.values(isExpanded).length) {
      setIsExpanded(initialIsExpanded);
    } else {
      emails.forEach((email) => {
        // if it's a new email, the id will not be in isExpanded
        if (!(email.id in isExpanded)) {
          // set new incoming email as expanded
          setIsExpanded({
            ...isExpanded,
            [email.id]: true
          });
        }
      });
    }
  }, [emails, initialIsExpanded, isExpanded]);

  const toggleExpanded = useCallback(
    (id: string) => {
      setIsExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [setIsExpanded]
  );

  const onThreadBlockClick = useCallback(
    (id: string, evt?: React.MouseEvent) => {
      evt?.stopPropagation();
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  // Last block will always be expanded by default, so we check for > 1
  const someBlocksAreExpanded = Object.values(isExpanded).filter(Boolean).length > 1;

  const onExpand = () => {
    if (someBlocksAreExpanded) {
      setIsExpanded(initialIsExpanded);
    } else {
      setIsExpanded(
        emails.reduce((acc, val) => {
          acc[val.id] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  };

  const renderThreadBlock = (email: MailboxEmailInfo, index: number, unsubscribeInfo: UnsubscribeInfo | undefined) => {
    const numCollapsed = nonTrashedEmails.length - MAXIMUM_INITIAL_EMAILS_SHOWN;
    let divider = !isMobile ? <ThreadSpacer height={index === 0 ? 0 : 12} /> : <></>;
    if (threadIsCollapsed) {
      if (index > 0 && index <= nonTrashedEmails.length - MAXIMUM_INITIAL_EMAILS_SHOWN) {
        // If we're collapsed and the email should be hidden
        return null;
      }

      if (index === nonTrashedEmails.length - MAXIMUM_INITIAL_EMAILS_SHOWN + 1) {
        // When collapsed, divider is clickable and shows number of collapsed emails
        divider = (
          <ThreadCollapsedDivider
            expanded={!threadIsCollapsed}
            isDarkMode={theme === ThemeMode.DARK}
            onClick={() => setThreadIsCollapsed(false)}
          >
            <Typography color='link' weight={TypographyWeight.BOLD}>
              {numCollapsed} more {numCollapsed > 1 ? 'messages' : 'message'}
            </Typography>
            <Icons color='link' icon={Icon.ExpandV} />
          </ThreadCollapsedDivider>
        );
      }
    }

    return (
      <>
        {/* hide first divider to avoid overlap with header */}
        {thread && (
          <>
            {divider}
            <ThreadBlock
              currentLabel={currentLabel}
              defaultEmailAlias={defaultEmailAlias}
              // Disable on last thread and on mobile disable click once expanded
              disableOnClick={index === nonTrashedEmails.length - 1}
              email={email}
              emailAliases={emailAliases}
              expanded={!!isExpanded[email.id]}
              isTrashed={false}
              key={email.id}
              onClick={onThreadBlockClick}
              quickAliases={quickAliases}
              thread={thread}
              unsubscribeInfo={unsubscribeInfo}
            />
          </>
        )}
      </>
    );
  };

  const scrollToTopOfThreadBody = () => threadBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const scheduledSendAtDate = attributes?.systemLabels.includes(SystemLabels.ScheduleSend)
    ? getScheduledSendAtDateForThread(nonTrashedEmails)
    : undefined;

  const senderOfFirstEmail = firstEmail?.from.address;
  const allEmailsFromSameSender =
    !!senderOfFirstEmail && emails.every((email) => email.from.address === senderOfFirstEmail);

  // Look through all of the recipients of the first email and find
  // the address that belongs to the current user. If one is not found (ie the email
  // was auto-forwarded from Gmail), return the default email alias.
  const getCurrentUserRecipientAlias = () => {
    if (!firstEmail) return undefined;
    const firstEmailRecipients = [...firstEmail.to, ...firstEmail.cc, ...firstEmail.bcc];
    if (!firstEmailRecipients.length) return undefined;
    const currentUserRecipient = firstEmailRecipients.find((recipient) =>
      currentUserEmailAliases.includes(recipient.address)
    );
    return currentUserRecipient?.address || defaultEmailAlias;
  };
  const currentUserRecipientAliasOnFirstEmail = getCurrentUserRecipientAlias();

  const unsubscribeLinks =
    allEmailsFromSameSender && rawMimeContentFirstEmail && firstEmail?.decryptedHtml
      ? getUnsubscribeLinks(rawMimeContentFirstEmail, firstEmail?.decryptedHtml)
      : undefined;
  const unsubscribeInfo: UnsubscribeInfo | undefined =
    unsubscribeLinks && firstEmail && currentUserRecipientAliasOnFirstEmail
      ? {
          links: unsubscribeLinks,
          senderToUnsubscribeFrom: firstEmail.from.address,
          recipient: currentUserRecipientAliasOnFirstEmail
        }
      : undefined;

  useEffect(() => {
    const fetchPublicKey = async () => {
      const publicKey = await getAttachedPublicKey(firstEmail?.decryptedAttachmentMetadata);
      setAttachedPublicKey(publicKey);
    };
    void fetchPublicKey();
  }, [firstEmail]);

  return (
    <>
      <ThreadHeader
        attachedPublicKey={attachedPublicKey}
        currentLabel={currentLabel}
        emailRefs={emailRefs}
        isExpanded={someBlocksAreExpanded}
        isSkiffSender={isSkiffInternal}
        loading={!nonTrashedEmails.length}
        nextThreadAndEmail={nextThreadAndEmail}
        onClick={isMobile ? scrollToTopOfThreadBody : undefined}
        onClose={onClose}
        onExpand={emails.length > 1 ? onExpand : undefined}
        prevThreadAndEmail={prevThreadAndEmail}
        scheduledSendAt={scheduledSendAtDate ?? undefined}
        setActiveThreadAndEmail={setActiveThreadAndEmail}
        silenceSuggestion={
          thread?.senderToSilenceMessageCounter && thread?.senderToSilence
            ? {
                numMessages: thread.senderToSilenceMessageCounter,
                senderToSilence: thread.senderToSilence
              }
            : undefined
        }
        text={nonTrashedEmails[0]?.decryptedSubject || NO_SUBJECT_TEXT}
        threadBodyRef={threadBodyRef}
        threadId={threadID}
        unsubscribeInfo={unsubscribeInfo}
        userLabels={labelsToRender}
        walletAliasesWithName={walletAliasesWithName}
      />
      <ThreadBody id={THREAD_BODY_ID} ref={threadBodyRef}>
        {!nonTrashedEmails.length && <ThreadSkeleton />}
        {!!trashedEmails.length && thread && (
          <TrashedEmailsBlock
            currentLabel={currentLabel}
            defaultEmailAlias={defaultEmailAlias}
            emailAliases={emailAliases}
            isExpanded={isExpanded}
            onThreadBlockClick={onThreadBlockClick}
            quickAliases={quickAliases}
            thread={thread}
            trashedEmails={trashedEmails}
          />
        )}
        {nonTrashedEmails.map((email, index) => (
          <div key={`${email.id}-thread-block`} ref={emailRefs[email.id]}>
            {renderThreadBlock(email, index, unsubscribeInfo)}
          </div>
        ))}
        <BrowserView>
          {replyComposeOpen.open && !replyComposeOpen.popOut && !isSending && (
            <ReplyComposeContainer ref={replyRef}>
              <Suspense fallback={null}>
                <Compose />
              </Suspense>
            </ReplyComposeContainer>
          )}
        </BrowserView>
        <MobileView>
          <MobileReplyContainer>
            <Button fullWidth icon={Icon.Reply} onClick={reply}>
              Reply
            </Button>
            <div>
              <IconButton dataTest='mobile-reply-all' icon={Icon.ReplyAll} onClick={replyAll} type={Type.SECONDARY} />
            </div>
            <div>
              <IconButton dataTest='mobile-forward' icon={Icon.ForwardEmail} onClick={forward} type={Type.SECONDARY} />
            </div>
          </MobileReplyContainer>
        </MobileView>
      </ThreadBody>
      <MobileView>
        {options && <ReplyDrawer reportSubOptions={options.reportSubOptions} threadOptions={options.threadOptions} />}
        <MoveThreadDrawer threadID={threadID} />
        <ReportThreadBlockDrawer />
        <ApplyUserLabelDrawer currentSystemLabels={attributes?.systemLabels || []} threadID={threadID} />
      </MobileView>
    </>
  );
}

const ThreadMemo = React.memo(Thread, (prev, next) => {
  // Compare previous props with next to determine if to render or not
  // If any props are large we should remove from this function and find a better way to compare
  for (const key of Object.keys(prev)) {
    if (!isEqual(prev[key], next[key])) {
      return false; // should re-render component
    }
  }
  return true; // should not re-render component
});
export default function ThreadMemoWrapper(props: Omit<ThreadProps, 'defaultEmailAlias' | 'emailAliases'>) {
  const { userID } = useRequiredCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const { emailAliases } = useCurrentUserEmailAliases();
  return <ThreadMemo {...props} defaultEmailAlias={defaultEmailAlias} emailAliases={emailAliases} />;
}
