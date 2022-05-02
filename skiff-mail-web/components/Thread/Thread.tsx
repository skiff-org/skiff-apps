import { Divider, Icon, IconText } from '@skiff-org/skiff-ui';
import { last } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { userLabelFromGraphQL } from '../../utils/label';
import { THREAD_HEADER_HEIGHT, THREAD_HEADER_HEIGHT_LABELS } from './constants';
import MoveThreadDrawer from './MoveThreadMobileDrawer';
import ReportThreadBlockDrawer from './ReportThreadBlockDrawer';
import ThreadBlock from './ThreadBlock';
import ThreadHeader from './ThreadHeader';

const ThreadBody = styled.div`
  overflow-y: auto;
  padding: 0px 24px;
  height: 100%;
  ${isMobile
    ? `
      height: calc(100vh - var(--toolbar-height));
      height: calc(100vh - var(--toolbar-height) - constant(sage-area-inset-bottom) - constant(safe-area-inset-top));
      height: calc(100vh - var(--toolbar-height) - env(safe-area-inset-bottom) - env(safe-area-inset-top));
    `
    : ''}
`;

const ThreadSpacer = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
`;

const MobileThreadSpacer = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
`;

const ThreadCollapsedDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`;

// The maximum number of emails shown initially (rest are collapsed)
const MAXIMUM_INITIAL_EMAILS_SHOWN = 3;

type ThreadProps = {
  thread: MailboxThreadInfo;
  onClose: () => void;
};

/**
 * Component for rendering a thread of emails.
 */
function Thread(props: ThreadProps) {
  const { thread, onClose } = props;
  const { emails, attributes } = thread;
  const dispatch = useDispatch();

  const threadBodyRef = useRef<HTMLDivElement>(null);
  const threadHeaderRef = useRef<HTMLDivElement>(null);

  const emailRefs = emails.reduce((acc, val) => {
    acc[val.id] = React.createRef<HTMLDivElement | null>();
    return acc;
  }, {} as Record<string, React.MutableRefObject<HTMLDivElement | null>>);

  const { activeEmailID } = useThreadActions();

  // Fill a Record<emailID, boolean> with false except for the id of the last email
  const initialIsExpanded = emails.reduce((acc, email) => {
    acc[email.id] = email.id === last(emails)?.id;
    return acc;
  }, {} as Record<string, boolean>);
  const [isExpanded, setExpanded] = useState<Record<string, boolean>>(initialIsExpanded);
  // So that we only scroll and expand on load
  const [hasScrolled, setHasScrolled] = useState(false);

  // Don't collapse if mobile, we have fewer than MAXIMUM_INITIAL_EMAILS_SHOWN emails, or activeEmailID is present
  const initialCollapsedState =
    !isMobile && emails.length > MAXIMUM_INITIAL_EMAILS_SHOWN && !(activeEmailID && activeEmailID in isExpanded);
  const [threadIsCollapsed, setThreadIsCollapsed] = useState(initialCollapsedState);

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
        threadBodyRef.current.scrollBy({ top: shrinkedThreadsHeight, behavior: 'smooth' });
      } else if (threadBodyRef.current && activeEmailID && activeEmailID in emailRefs) {
        setExpanded((prev) => ({ ...prev, [activeEmailID]: true }));
        emailRefs[activeEmailID].current?.scrollIntoView({ behavior: 'smooth' });
      }
      setHasScrolled(true);
    }, 100);
  }, [activeEmailID, emailRefs, hasScrolled]);

  // Set the first selected emails as the most recent
  useEffect(() => {
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(last(emails) as MailboxEmailInfo));
  }, []);

  // make sure that all incoming mails in the thread get default expanded value
  useEffect(() => {
    emails.forEach((email) => {
      // if its new email his expanded value will be undefined
      if (isExpanded[email.id] === undefined) {
        // set new incoming email as expanded
        setExpanded({
          ...isExpanded,
          [email.id]: true
        });
      }
    });
  }, [emails, isExpanded]);

  const hasLabels = useMemo(() => attributes.userLabels && attributes.userLabels.length > 0, []);

  if (!emails.length) {
    return null;
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Last block will always be expanded by default, so we check for > 1
  const someBlocksAreExpanded = Object.values(isExpanded).filter(Boolean).length > 1;

  const onExpand = () => {
    if (someBlocksAreExpanded) {
      setExpanded(initialIsExpanded);
    } else {
      setExpanded(
        emails.reduce((acc, val) => {
          acc[val.id] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  };

  const renderThreadBlock = (email, index) => {
    const numCollapsed = emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN;
    let divider = <Divider />;
    if (threadIsCollapsed) {
      if (index > 0 && index <= emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN) {
        // If we're collapsed and the email should be hidden
        return null;
      }

      if (index === emails.length - MAXIMUM_INITIAL_EMAILS_SHOWN + 1) {
        // When collapsed, divider is clickable and shows number of collapsed emails
        divider = (
          <ThreadCollapsedDivider onClick={() => setThreadIsCollapsed(false)}>
            <Divider length='short' />
            <IconText
              color='link'
              label={`${numCollapsed} more ${numCollapsed > 1 ? 'messages' : 'message'}`}
              startIcon={Icon.ExpandV}
            />
            <Divider length='short' />
          </ThreadCollapsedDivider>
        );
      }
    }

    return (
      <>
        {/* hide first divider to avoid overlap with header */}
        {index !== 0 && divider}
        <ThreadBlock
          disableOnClick={index === emails.length - 1}
          email={email}
          expanded={isExpanded[email.id]}
          key={email.id}
          onClick={(evt?: React.MouseEvent) => {
            evt?.stopPropagation();
            toggleExpanded(email.id);
          }}
          onClose={onClose}
          thread={thread}
        />
      </>
    );
  };

 const scrollToTopOfThreadBody = () => threadBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

 const threadHeaderHeight = threadHeaderRef.current?.getBoundingClientRect().height;

  return (
    <>
      <ThreadHeader
        ref={threadHeaderRef}
        isExpanded={someBlocksAreExpanded}
        onClick={isMobile ? scrollToTopOfThreadBody : undefined}
        onClose={onClose}
        onExpand={emails.length > 1 ? onExpand : undefined}
        text={emails[0].decryptedSubject}
        userLabels={attributes.userLabels.map(userLabelFromGraphQL)}
      />
      <ThreadBody ref={threadBodyRef}>
        {/* add spacing for header, to allow for glass effect */}
        {!isMobile && threadHeaderHeight && <ThreadSpacer height={threadHeaderHeight} />}
        {isMobile && <MobileThreadSpacer height={hasLabels ? THREAD_HEADER_HEIGHT_LABELS : THREAD_HEADER_HEIGHT} />}
        {emails.map((email, index) => (
          <div key={`${email.id}-${isExpanded[email.id]}`} ref={emailRefs[email.id]}>
            {renderThreadBlock(email, index)}
          </div>
        ))}
      </ThreadBody>
      <MobileView>
        <MoveThreadDrawer thread={thread} />
        <ReportThreadBlockDrawer />
      </MobileView>
    </>
  );
}

export default Thread;
