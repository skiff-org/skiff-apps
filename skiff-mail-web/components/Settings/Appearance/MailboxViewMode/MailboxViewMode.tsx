import { Typography } from 'nightwatch-ui';
import React from 'react';
import { RadioCheckbox, TitleActionSection, useUserPreference } from 'skiff-front-utils';
import { ThreadDisplayFormat } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

const ViewRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  border-radius: 8px;
  box-sizing: border-box;
`;

/**
 * Component for changing the mailbox view format.
 */
export const MailboxViewMode: React.FC = () => {
  const [threadFormat, setThreadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  const rightModeOnClick = () => setThreadFormat(ThreadDisplayFormat.Right);
  const fullModeOnClick = () => setThreadFormat(ThreadDisplayFormat.Full);

  return (
    <>
      <TitleActionSection subtitle='Select a display format for viewing threads' title='Inbox format' />
      <ViewRow key='right-mode' onClick={rightModeOnClick}>
        <Typography>Split view</Typography>
        <RadioCheckbox checked={threadFormat === ThreadDisplayFormat.Right} />
      </ViewRow>
      <ViewRow key='full-mode' onClick={fullModeOnClick}>
        <Typography>Full view</Typography>
        <RadioCheckbox checked={threadFormat === ThreadDisplayFormat.Full} />
      </ViewRow>
    </>
  );
};
