import { Icon, IconText, Typography, TypographySize } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  ThreadWithoutContentFragment,
  ThreadWithoutContentFragmentDoc,
  useRemoveLabelsMutation
} from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { ModifyLabelsActions } from '../../utils/label';

import ThreadBlock from './ThreadBlock';

const Container = styled.div<{ $expanded: boolean }>`
  display: flex;
  ${({ $expanded }) => `padding: 8px 16px ${$expanded ? '16' : '8'}px 16px;`}
  flex-direction: column;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  background: rgba(255, 143, 143, 0.06);
  ${isMobile
    ? css`
        border-top: 1px solid var(--border-destructive);
        border-bottom: 1px solid var(--border-destructive);
      `
    : css`
        border-radius: 8px;
        border: 1px solid var(--border-destructive);
        margin-bottom: 12px;
      `}
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

const Buttons = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 2px;
  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  box-shadow: var(--shadow-l3);
  border-radius: 6px;
`;

const Emails = styled.div`
  display: flex;
  align-items: center;
  align-self: stretch;
  ${!isMobile && 'gap: 12px;'}
  flex-direction: column;
`;

interface TrashedEmailsBlockProps {
  trashedEmails: ThreadViewEmailInfo[];
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
  quickAliases: string[];
  thread: ThreadDetailInfo;
  currentLabel: string;
  onThreadBlockClick: (id: string, evt?: React.MouseEvent) => void;
  isExpanded: Record<string, boolean>;
}

export const TrashedEmailsBlock: React.FC<TrashedEmailsBlockProps> = ({
  trashedEmails,
  defaultEmailAlias,
  emailAliases,
  quickAliases,
  thread,
  currentLabel,
  onThreadBlockClick,
  isExpanded
}: TrashedEmailsBlockProps) => {
  const { enqueueToast } = useToast();
  const [removeLabels] = useRemoveLabelsMutation();

  const [expanded, setExpanded] = useState(false);

  const restoreTrashedEmails = async () => {
    try {
      await removeLabels({
        variables: {
          request: {
            threadIDs: [thread.threadID],
            systemLabels: [SystemLabels.Trash]
          }
        },
        optimisticResponse: {
          [ModifyLabelsActions.REMOVE]: {
            updatedThreads: [
              {
                threadID: thread.threadID,
                userLabels: thread.attributes.userLabels,
                systemLabels: thread.attributes.systemLabels as SystemLabels[],
                __typename: 'UpdatedThreadLabels'
              }
            ],
            __typename: 'ModifyLabelsResponse'
          }
        },
        update: (cache, response) => {
          const updatedThreads = response.data?.removeLabels?.updatedThreads;
          if (updatedThreads?.length !== 1 || !updatedThreads[0]) return;

          const cacheID = cache.identify({ __typename: 'UserThread', threadID: updatedThreads[0].threadID });
          cache.updateFragment<ThreadWithoutContentFragment>(
            { id: cacheID, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' },
            (existing) => {
              if (!existing) return null;
              return {
                ...existing,
                attributes: {
                  ...existing.attributes,
                  // Remove Trash system label
                  systemLabels: existing.attributes.systemLabels.filter((label) => label !== SystemLabels.Trash)
                },
                // Clear deletedAt
                deletedAt: null
              };
            }
          );
        }
      });
      enqueueToast({
        title: 'Messages restored',
        body: `Moved ${pluralize('message', trashedEmails.length)} out of Trash`
      });
    } catch (e) {
      console.error(e);
      enqueueToast({
        title: 'Move failed',
        body: `Could not move messages out of Trash. Please try again.`
      });
    }
  };

  return (
    <Container $expanded={expanded}>
      <Header>
        <Typography color='destructive' mono size={TypographySize.SMALL} uppercase>
          {pluralize('trashed message', trashedEmails.length, true)}
        </Typography>
        <Buttons>
          {expanded && (
            <IconText
              color='secondary'
              onClick={restoreTrashedEmails}
              startIcon={Icon.MoveMailbox}
              tooltip='Restore all'
            />
          )}
          <IconText
            color='secondary'
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
            startIcon={expanded ? Icon.CollapseV : Icon.ExpandV}
          />
        </Buttons>
      </Header>
      {expanded && !!trashedEmails.length && (
        <Emails>
          {trashedEmails.map((email) => (
            <ThreadBlock
              currentLabel={currentLabel}
              defaultEmailAlias={defaultEmailAlias}
              disableOnClick={false}
              email={email}
              emailAliases={emailAliases}
              expanded={!!isExpanded[email.id]}
              isTrashed
              key={email.id}
              onClick={onThreadBlockClick}
              quickAliases={quickAliases}
              renderThreadActions={false}
              thread={thread}
              unsubscribeInfo={undefined}
            />
          ))}
        </Emails>
      )}
    </Container>
  );
};
