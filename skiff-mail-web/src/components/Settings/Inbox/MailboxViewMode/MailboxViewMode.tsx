import React from 'react';
import { TitleActionSection, useUserPreference } from 'skiff-front-utils';
import { ThreadDisplayFormat } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

/**
 * Component for changing the mailbox view format.
 */
export const MailboxViewMode: React.FC = () => {
  const [threadFormat, setThreadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  const onThreadFormatChange = (value: string) => {
    setThreadFormat(value as ThreadDisplayFormat);
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onChange: onThreadFormatChange,
            value: threadFormat,
            type: 'select',
            items: [
              {
                label: 'Full view',
                value: ThreadDisplayFormat.Full
              },
              {
                label: 'Split view',
                value: ThreadDisplayFormat.Right
              }
            ]
          }
        ]}
        subtitle='Select a display format for viewing threads'
        title='Inbox format'
      />
    </>
  );
};
