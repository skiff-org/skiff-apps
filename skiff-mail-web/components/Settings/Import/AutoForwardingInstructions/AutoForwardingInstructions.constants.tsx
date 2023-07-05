import { Icon } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

interface MailForwardingConfig {
  label: string;
  icon: Icon;
  instructions: { key: string; value: React.ReactNode }[];
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
      {
        key: 'settings',
        value: (
          <span>
            In the top right, click <Bold>Settings</Bold> &gt; <Bold>See all settings</Bold>.
          </span>
        )
      },
      {
        key: 'tab',
        value: (
          <span>
            Click the <Bold>Forwarding and POP/IMAP</Bold> tab.
          </span>
        )
      },
      {
        key: 'add-address',
        value: (
          <span>
            Under &quot;Forwarding&quot;, click <Bold>Add a forwarding address</Bold>.
          </span>
        )
      },
      {
        key: 'enter-skiff-address',
        value: (
          <span>
            Enter your Skiff email address and select <Bold>Next</Bold>.
          </span>
        )
      },
      {
        key: 'verify',
        value: 'A verification message will be sent to your Skiff address. Click the verification link in the message.'
      },
      {
        key: 'refresh',
        value: 'Go back to the Gmail settings page and refresh the page.'
      },
      {
        key: 'tab-2',
        value: (
          <span>
            Click the <Bold>Forwarding and POP/IMAP</Bold> tab.
          </span>
        )
      },
      {
        key: 'forward',
        value: (
          <span>
            In the &quot;Forwarding&quot; section, select <Bold>Forward a copy of incoming mail to</Bold>.
          </span>
        )
      },
      {
        key: 'save',
        value: (
          <span>
            Click <Bold>Save</Bold> at the bottom of the page.
          </span>
        )
      }
    ]
  },
  [MailType.Outlook]: {
    label: 'Outlook',
    icon: Icon.Envelope,
    instructions: [
      {
        key: 'settings',
        value: (
          <span>
            In the top right, click <Bold>Settings</Bold>.
          </span>
        )
      },
      {
        key: 'all-settings',
        value: (
          <span>
            Select <Bold>View all Outlook settings</Bold> at the bottom of the Settings pane.
          </span>
        )
      },
      {
        key: 'tab',
        value: (
          <span>
            Click the <Bold>Forwarding</Bold> tab on the left sidebar.
          </span>
        )
      },
      {
        key: 'enable',
        value: (
          <span>
            In the &quot;Forwarding&quot; section, select <Bold>Enable forwarding</Bold>.
          </span>
        )
      },
      {
        key: 'enter-skiff-address',
        value: 'Enter your Skiff email address in the "Forward my email to" field.'
      },
      {
        key: 'save',
        value: (
          <span>
            Click <Bold>Save</Bold> at the bottom of the screen.
          </span>
        )
      }
    ]
  }
};
