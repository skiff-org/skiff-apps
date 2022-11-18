import { Icon, Icons, Typography } from 'nightwatch-ui';
import React from 'react';
import { TitleActionSection } from 'skiff-front-utils';
import styled from 'styled-components';

import useLocalSetting, { ThreadDisplayFormat } from '../../../../hooks/useLocalSetting';

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
  const [threadFormat, setThreadFormat] = useLocalSetting('threadFormat');

  const rightModeOnClick = () => setThreadFormat(ThreadDisplayFormat.Right);
  const fullModeOnClick = () => setThreadFormat(ThreadDisplayFormat.Full);

  return (
    <>
      <TitleActionSection subtitle='Select a display format for viewing threads.' title='Inbox format' />
      <ViewRow key='right-mode' onClick={rightModeOnClick}>
        <Typography type='paragraph'>Split view</Typography>
        <Icons icon={threadFormat === ThreadDisplayFormat.Right ? Icon.RadioFilled : Icon.RadioEmpty} />
      </ViewRow>
      <ViewRow key='full-mode' onClick={fullModeOnClick}>
        <Typography type='paragraph'>Full view</Typography>
        <Icons icon={threadFormat === ThreadDisplayFormat.Full ? Icon.RadioFilled : Icon.RadioEmpty} />
      </ViewRow>
    </>
  );
};
