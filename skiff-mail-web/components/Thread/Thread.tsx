import { isEqual, last } from 'lodash';
import { Icon, Icons, Typography } from 'nightwatch-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useTheme } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useGetThreadFromIdQuery } from 'skiff-mail-graphql';
import styled from 'styled-components';

import { NO_SUBJECT_TEXT } from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useCurrentUserEmailAliases } from '../../hooks/useCurrentUserEmailAliases';
import { useDefaultEmailAlias } from '../../hooks/useDefaultEmailAlias';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxEmailInfo } from '../../models/email';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { getActiveSystemLabel, isUserLabel, userLabelFromGraphQL } from '../../utils/label';
import { updateThreadAsReadUnread } from '../../utils/mailboxUtils';
import { isSkiffAddress } from '../../utils/userUtils';
import { BOTTOM_NAVIGATION_HEIGHT, THREAD_BODY_ID } from '../mailbox/consts';

import ApplyUserLabelDrawer from './ApplyUserLabelDrawer';
import MoveThreadDrawer from './MoveThreadMobileDrawer';
import { ReplayDrawer } from './ReplayDrawer';
import ReportThreadBlockDrawer from './ReportThreadBlockDrawer';
import { ThreadNavigationIDs } from './Thread.types';
import ThreadBlock from './ThreadBlock';
import ThreadHeader from './ThreadHeader';
import { useThreadOptions } from './useThreadOptions';

const ThreadBody = styled.div`
  overflow-y: auto;
  height: 100%;
  ${!isMobile
    ? 'padding: 12px 24px 64px 24px;'
    : `
    padding: 0px 12px;
    background: var(--bg-l0-solid);
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
  box-shadow: ${(props) => (!props.isDarkMode ? 'var(--shadow-l1)' : '')};
  border: 1px solid ${(props) => (!props.isDarkMode ? 'transparent' : 'var(--border-secondary)')};
  background: var(--bg-l2-solid);
  transition: all 0.15s ease-in;
  &:hover {
    box-shadow: ${(props) => (!props.expanded ? 'var(--shadow-l2)' : 'var(--shadow-l1)')};
    background: ${(props) => (props.isDarkMode && !props.expanded ? 'var(--bg-l3-solid)' : 'var(--bg-l2-solid)')};
  }
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
};

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
  emailAliases
}: ThreadProps) {
  const { data, loading: isThreadDataLoading } = useGetThreadFromIdQuery({ variables: { threadID } });
  const emails = data?.userThread?.emails ?? [];
  const thread = data?.userThread || undefined;
  const attributes = data?.userThread?.attributes;
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const threadHeaderRef = useRef<HTMLDivElement>(null);
  const threadBodyRef = useRef<HTMLDivElement>(null);

  const emailRefs = emails.reduce((acc, val) => {
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
    !isMobile && emails.length > MAXIMUM_INITIAL_EMAILS_SHOWN && !(activeEmailID && activeEmailID in isExpanded);
  const [threadIsCollapsed, setThreadIsCollapsed] = useState(initialCollapsedState);
  const [threadHeaderHeight, setThreadHeaderHeight] = useState(0);

  const { value: labelFromRouter } = useRouterLabelContext() ?? {};
  const activeThreadSystemLabels = data?.userThread?.attributes.systemLabels ?? [];
  // labelFromRouter will be undefined for cases where a Thread is rendered
  // outside of the system label/user label mailboxes (ie in the full view search page)
  const activeThreadLabel = labelFromRouter ?? getActiveSystemLabel(activeThreadSystemLabels);

  const options = useThreadOptions(
    thread,
    emails[emails.length - 1],
    activeThreadLabel,
    onClose,
    defaultEmailAlias,
    emailAliases
  );

  // initialize empty array of customDomains, will update once query in useEffect returns
  const isSkiffInternal = emails.every(
    (email) =>
      isSkiffAddress(email.from.address) &&
      email.to.every((addr) => isSkiffAddress(addr.address)) &&
      email.cc.every((addr) => isSkiffAddress(addr.address)) &&
      email.bcc.every((addr) => isSkiffAddress(addr.address))
  );

  useEffect(() => {
    // If the active email ID changes, reset scroll/ expanded state so that the new
    // active email is opened
    setHasScrolled(false);
    setIsExpanded(initialIsExpanded);

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
    if (threadHeaderRef.current) {
      setThreadHeaderHeight(threadHeaderRef.current.getBoundingClientRect().height);
    }
  }, [threadHeaderRef.current]);

  useEffect(() => {
    // Prevent infinite loop from when ref changes
    if (hasScrolled) {
      return;
    }
    setTimeout(() => {
      if (threadBodyRef.current && !activeEmailID) {
        // If no email is active scroll the to beginning of the last email in thread
        const shrinkedThreadsHeight = emails
          .slice(0, -1)
          .reduce<number>((prev, curr) => prev + (emailRefs[curr.id]?.current?.getBoundingClientRect().height || 0), 0);
        if (shrinkedThreadsHeight) {
          threadBodyRef.current?.scrollBy({ top: shrinkedThreadsHeight, behavior: 'smooth' });
          setHasScrolled(true);
        }
      } else if (threadBodyRef.current && activeEmailID && emailRefs[activeEmailID]?.current && threadHeaderHeight) {
        const offsetTop = emailRefs[activeEmailID].current?.offsetTop ?? threadHeaderHeight;
        threadBodyRef.current.scrollTo({
          top: offsetTop - threadHeaderHeight,
          left: 0,
          behavior: 'smooth'
        });
        setIsExpanded((prev) => ({ ...prev, [activeEmailID]: true }));
        setHasScrolled(true);
      }
    }, 100);
  }, [activeEmailID, emailRefs, emails, hasScrolled, threadHeaderHeight]);

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
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(last(emails) as MailboxEmailInfo));
  }, [dispatch]);

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
  }, [emails, isExpanded]);

  const toggleExpanded = useCallback(
    (id: string) => {
      setIsExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [setIsExpanded]
  );

  const onThreadBlockClick = useCallback(
    (id: string, evt?: React.MouseEvent) => {
      evt?.stopPropagation();
      // On mobile do not collapse
      if (!isMobile || !isExpanded[id]) toggleExpanded(id);
    },
    [isExpanded, toggleExpanded]
  );

  if (!emails.length) {
    return null;
  }

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

  const renderThreadBlock = (email: MailboxEmailInfo, index: number) => {
    const numCollapsed = emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN;
    let divider = <ThreadSpacer height={index === 0 ? 0 : 16} />;
    if (threadIsCollapsed) {
      if (index > 0 && index <= emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN) {
        // If we're collapsed and the email should be hidden
        return null;
      }

      if (index === emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN + 1) {
        // When collapsed, divider is clickable and shows number of collapsed emails
        divider = (
          <ThreadCollapsedDivider
            expanded={!threadIsCollapsed}
            isDarkMode={theme === 'dark'}
            onClick={() => setThreadIsCollapsed(false)}
          >
            <Typography color='link' type='heading'>
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
        {data?.userThread && (
          <>
            {divider}
            <ThreadBlock
              currentLabel={activeThreadLabel}
              // Disable on last thread and on mobile disable click once expanded
              defaultEmailAlias={defaultEmailAlias}
              disableOnClick={index === emails.length - 1 || (isMobile && isExpanded[email.id])}
              email={email}
              emailAliases={emailAliases}
              expanded={isExpanded[email.id]}
              key={email.id}
              onClick={onThreadBlockClick}
              onClose={onClose}
              thread={data.userThread}
            />
          </>
        )}
      </>
    );
  };

  const scrollToTopOfThreadBody = () => threadBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <ThreadHeader
        currentLabel={activeThreadLabel}
        emailRefs={emailRefs}
        isExpanded={someBlocksAreExpanded}
        isSkiffSender={isSkiffInternal}
        nextThreadAndEmail={nextThreadAndEmail}
        onClick={isMobile ? scrollToTopOfThreadBody : undefined}
        onClose={onClose}
        onExpand={emails.length > 1 ? onExpand : undefined}
        prevThreadAndEmail={prevThreadAndEmail}
        ref={threadHeaderRef}
        schedualSendAt={
          attributes?.systemLabels.includes(SystemLabels.ScheduleSend) ? emails[0].scheduleSendAt : undefined
        }
        setActiveThreadAndEmail={setActiveThreadAndEmail}
        text={emails[0].decryptedSubject || NO_SUBJECT_TEXT}
        threadBodyRef={threadBodyRef}
        threadId={threadID}
        userLabels={(attributes?.userLabels ?? []).map(userLabelFromGraphQL).filter(isUserLabel)}
      />
      <ThreadBody id={THREAD_BODY_ID} ref={threadBodyRef}>
        {/* add spacing for header, to allow for glass effect */}
        <ThreadSpacer height={threadHeaderHeight} />
        {emails.map((email, index) => (
          <div key={`${email.id}-${isExpanded[email.id]}`} ref={emailRefs[email.id]}>
            {renderThreadBlock(email, index)}
          </div>
        ))}
      </ThreadBody>
      <MobileView>
        {options && <ReplayDrawer reportSubOptions={options.reportSubOptions} threadOptions={options.threadOptions} />}
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
  const [defaultEmailAlias] = useDefaultEmailAlias();
  const emailAliases = useCurrentUserEmailAliases();
  return <ThreadMemo {...props} defaultEmailAlias={defaultEmailAlias} emailAliases={emailAliases} />;
}
