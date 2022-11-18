import axios from 'axios';
import { Dropdown, DropdownItem, DropdownSubmenu, Icon } from 'nightwatch-ui';
import React, { RefObject } from 'react';
import { isMobile } from 'react-device-detect';
import { decryptDatagram } from 'skiff-crypto-v2';
import { UserFeature } from 'skiff-graphql';
import { RawMimeDatagram } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useFeatureTag } from '../../hooks/useUserTags';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';

import { MobileMoreThreadOptionsDrawer } from './MobileMoreThreadOptionsDrawer';
import { useThreadOptions } from './useThreadOptions';

type ThreadBlockDropdownProps = {
  thread: MailboxThreadInfo;
  email: MailboxEmailInfo;
  open: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  // Aliases
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
};

export const ThreadBlockDropdown = ({
  thread,
  email,
  open,
  buttonRef,
  setOpen,
  onClose,
  currentLabel,
  defaultEmailAlias,
  emailAliases
}: ThreadBlockDropdownProps) => {
  const { userID } = useRequiredCurrentUserData();
  const { value: shouldLogMime } = useFeatureTag(userID, UserFeature.LogMime);
  const options = useThreadOptions(thread, email, currentLabel, onClose, defaultEmailAlias, emailAliases);
  if (!options) return null;
  // For debugging purposes
  if (shouldLogMime) {
    options.threadOptions.push({
      label: 'Log raw MIME',
      icon: Icon.Inbox,
      onClick: async () => {
        const { id, encryptedRawMimeUrl, decryptedSessionKey } = email;
        if (!encryptedRawMimeUrl || !decryptedSessionKey) {
          console.error('missing encryptedRawMimeUrl or decryptedSessionKey fields');
          return;
        }
        const { data } = await axios.get(encryptedRawMimeUrl);
        const { rawMime } = decryptDatagram(RawMimeDatagram, decryptedSessionKey, data).body;
        console.log({ id, rawMime });
      }
    });
  }

  // Maps options to dropdown items, recursively adding suboptions
  const optionToItem = (option) => {
    if (option.customComponent) {
      return option.customComponent;
    }
    if (option.subOptions) {
      return (
        <DropdownSubmenu icon={option.icon} key={option.label} label={option.label}>
          {option.subOptions.map(optionToItem)}
        </DropdownSubmenu>
      );
    }
    return (
      <DropdownItem
        dataTest={option.label}
        icon={option.icon}
        key={option.label}
        label={option.label}
        onClick={(e?: React.MouseEvent) => {
          option.onClick(e);
          setOpen(false);
        }}
      />
    );
  };

  if (isMobile) {
    return (
      <MobileMoreThreadOptionsDrawer
        emailID={email.id}
        reportSubOptions={options.reportSubOptions}
        threadOptions={options.threadOptions}
      />
    );
  }

  return open ? (
    <Dropdown buttonRef={buttonRef} hasSubmenu portal setShowDropdown={setOpen}>
      {options.threadOptions.map(optionToItem)}
    </Dropdown>
  ) : null;
};
