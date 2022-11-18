import { Icon } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

interface MailForwardingConfig {
  label: string;
  icon: Icon;
  instructions: React.ReactNode[];
}

export enum MailType {
  Gmail = 'Gmail',
  Outlook = 'Outlook'
}

const Bold = styled.span`
  font-weight: 520;
  width: fit-content;
  color: var(--text-secondary);
  padding: 0px 4px;
  background: var(--bg-field-default);
  border-radius: 4px;
  opacity: 0.8;
`;

export const MAIL_FORWARDING_CONFIGS: { [mailType in MailType]: MailForwardingConfig } = {
  [MailType.Gmail]: {
    label: 'Gmail',
    icon: Icon.Gmail,
    instructions: [
      <span key='settings'>
        In the top right, click <Bold>Settings</Bold> &gt; <Bold>See all settings</Bold>.
      </span>,
      <span key='tab'>
        Click the <Bold>Forwarding and POP/IMAP</Bold> tab.
      </span>,
      <span key='add-address'>
        Under &quot;Forwarding&quot;, click <Bold>Add a forwarding address</Bold>.
      </span>,
      <span key='enter-address'>
        Enter your Skiff email address and select <Bold>Next</Bold>.
      </span>,
      'A verification message will be sent to your Skiff address. Click the verification link in the message.',
      'Go back to the Gmail settings page and refresh the page.',
      <span key='tab-2'>
        Click the <Bold>Forwarding and POP/IMAP</Bold> tab.
      </span>,
      <span key='forward'>
        In the &quot;Forwarding&quot; section, select <Bold>Forward a copy of incoming mail to</Bold>.
      </span>,
      <span key='save'>
        Click <Bold>Save</Bold> at the bottom of the page.
      </span>
    ]
  },
  [MailType.Outlook]: {
    label: 'Outlook',
    icon: Icon.Outlook,
    instructions: [
      <span key='settings'>
        In the top right, click <Bold>Settings</Bold>.
      </span>,
      <span key='all-settings'>
        Select <Bold>View all Outlook settings</Bold> at the bottom of the Settings pane.
      </span>,
      <span key='tab'>
        Click the <Bold>Forwarding</Bold> tab on the left sidebar.
      </span>,
      <span key='enable'>
        In the &quot;Forwarding&quot; section, select <Bold>Enable forwarding</Bold>.
      </span>,
      'Enter your Skiff email address in the "Forward my email to" field.',
      <span key='save'>
        Click <Bold>Save</Bold> at the bottom of the screen.
      </span>
    ]
  }
};
