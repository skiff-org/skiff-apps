import { CircularProgress, Icon, IconText, Size, Tabs, Type, Typography, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import { useSpamListsQuery } from 'skiff-front-graphql';
import { TitleActionSection } from 'skiff-front-utils';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { UserType } from './SpamLists.consts';
import { SpamListsRow } from './SpamListsRow';

const SenderTable = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SenderTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const ReviewTable = styled.div<{ $clickable?: boolean }>`
  width: 100%;
  display: flex;
  gap: 8px;
  flex-direction: column;
  box-sizing: border-box;

  background: var(--bg-overlay-quaternary);
  border: 1px solid var(--border-secondary);

  border-radius: 8px;
  ${(props) =>
    props.$clickable &&
    `
    cursor: pointer;
    :hover {
      background: var(--bg-overlay-tertiary);
    }
  `}
`;

const TitleExpand = styled.div`
  width: 100%;
  justify-content: space-between;
  align-items: center;
  display: flex;
  padding: 12px;
  box-sizing: border-box;
`;

const OrangeText = styled.span`
  color: var(--text-link);
`;

export const SpamLists = () => {
  const [tableExpanded, setTableExpanded] = useState(false);
  const [userType, setUserType] = useState<UserType>(UserType.SPAM);

  const { data: spamListData, loading } = useSpamListsQuery();
  const { spamUsers, allowedUsers } = spamListData || {};

  const getListFromUserType = (userType: UserType): Array<string> | undefined => {
    switch (userType) {
      case UserType.SPAM:
        return spamUsers;
      case UserType.ALLOWED:
        return allowedUsers;
      default:
        return undefined;
    }
  };

  const toggleExpand = () => setTableExpanded(!tableExpanded);

  const list = getListFromUserType(userType) || [];

  const tabs = (
    <Tabs
      size={Size.SMALL}
      tabs={Object.values(UserType).map((userTypeTab) => ({
        label: upperCaseFirstLetter(userTypeTab),
        onClick: () => setUserType(userTypeTab),
        active: userType === userTypeTab
      }))}
    />
  );

  return (
    <>
      <TitleActionSection
        actions={[
          {
            content: tabs,
            type: 'custom'
          }
        ]}
        subtitle='Spam and allowed senders'
        title='Sender lists'
      />
      <ReviewTable
        $clickable={!tableExpanded && list.length > 0}
        onClick={tableExpanded || list.length === 0 ? undefined : toggleExpand}
      >
        <TitleExpand>
          <Typography color={Type.SECONDARY} selectable={false} weight={TypographyWeight.MEDIUM}>
            <OrangeText>{list.length}</OrangeText>&nbsp;
            {`${upperCaseFirstLetter(userType)} ${pluralize('sender', list.length)}`}
          </Typography>
          {list.length > 0 && (
            <IconText onClick={toggleExpand} startIcon={tableExpanded ? Icon.ChevronUp : Icon.ChevronRight} />
          )}
        </TitleExpand>
        {tableExpanded && (
          <SenderTableContainer>
            <SenderTable>
              {loading && (
                <LoadingContainer>
                  <CircularProgress size={Size.MEDIUM} spinner />
                </LoadingContainer>
              )}
              {!loading && (
                <>
                  {list.map((sender, index) => {
                    const isLast = index === list.length - 1;
                    return <SpamListsRow isLast={isLast} key={sender} sender={sender} userType={userType} />;
                  })}
                </>
              )}
            </SenderTable>
          </SenderTableContainer>
        )}
      </ReviewTable>
    </>
  );
};
