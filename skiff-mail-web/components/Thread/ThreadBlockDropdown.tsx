import DOMPurify from 'dompurify';
import { Dropdown, DropdownItem, DropdownSubmenu, Icon } from 'nightwatch-ui';
import React, { RefObject } from 'react';
import { isMobile } from 'react-device-detect';

import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { getRawMime } from '../../utils/eml';

import { MAIL_HTML_IFRAME } from './MailHTMLView/MailHTMLView';
import { MobileMoreThreadOptionsDrawer } from './MobileMoreThreadOptionsDrawer';
import { ThreadBlockOptions } from './Thread.types';
import { useThreadOptions } from './useThreadOptions';

type ThreadBlockDropdownProps = {
  thread: MailboxThreadInfo;
  email: MailboxEmailInfo;
  open: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
  setOpen: (open: boolean) => void;
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
  currentLabel,
  defaultEmailAlias,
  emailAliases
}: ThreadBlockDropdownProps) => {
  const options = useThreadOptions(thread, email, currentLabel, defaultEmailAlias, emailAliases, setOpen);

  if (!options) return null;

  if (!isMobile && email.encryptedRawMimeUrl) {
    options.threadOptions.push({
      label: 'Download EML',
      icon: Icon.Download,
      onClick: () => {
        const { encryptedRawMimeUrl, decryptedSessionKey } = email;
        if (!encryptedRawMimeUrl || !decryptedSessionKey) {
          console.error('missing encryptedRawMimeUrl or decryptedSessionKey fields');
          return;
        }
        const runDownload = async () => {
          const rawMime = await getRawMime(encryptedRawMimeUrl, decryptedSessionKey);
          if (!rawMime) return;

          const linkElem = document.createElement('a');
          linkElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(rawMime));
          linkElem.setAttribute('download', `${email.decryptedSubject ?? 'email'}.eml`);
          linkElem.style.display = 'none';
          document.body.appendChild(linkElem);
          linkElem.click();
          document.body.removeChild(linkElem);
        };
        void runDownload();
      }
    });
    options.threadOptions.push({
      label: 'Print email',
      icon: Icon.Printer,
      onClick: () => {
        const iframe = document.getElementById(MAIL_HTML_IFRAME) as HTMLIFrameElement;
        const shadowIframe = document.createElement('iframe');
        document.body.appendChild(shadowIframe);
        shadowIframe?.contentWindow?.document.write(
          DOMPurify.sanitize(iframe?.contentDocument?.documentElement?.innerHTML ?? '')
        );
        shadowIframe.setAttribute(
          'sandbox',
          'allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals'
        );

        const ifrWindow = shadowIframe?.contentWindow;
        const ifrDoc = shadowIframe?.contentDocument;
        if (!ifrDoc) return;
        const elemTo = ifrDoc.createElement('div');
        // set text content to thread subject and sender
        elemTo.textContent = `${email.to.map((to) => `${to.name ?? ''} <${to.address}>`).join(', ')} `;
        elemTo.style.color = 'var(--text-secondary)';
        elemTo.style.fontWeight = '300';
        elemTo.style.fontSize = '13px';
        elemTo.style.marginBottom = '32px';
        elemTo.classList.add('printOnly');

        // add elem before iframe
        ifrDoc.body.insertBefore(elemTo, ifrDoc.body.firstChild);
        const elemFrom = ifrDoc.createElement('div');
        // set text content to thread subject and sender
        elemFrom.textContent = `${email.from.name ?? ''} <${email.from.address ?? ''}>`;
        elemFrom.style.color = 'var(--text-secondary)';
        elemFrom.style.fontWeight = '300';
        elemFrom.style.fontSize = '13px';
        elemFrom.classList.add('printOnly');
        // add elem before iframe
        ifrDoc.body.insertBefore(elemFrom, ifrDoc.body.firstChild);
        const subject = ifrDoc.createElement('div');

        // set text content to thread subject and sender
        subject.textContent = `${email.decryptedSubject ?? 'No subject'}`;
        subject.style.fontSize = '15px';
        subject.classList.add('printOnly');
        subject.id = 'printOnly';
        // add elem before iframe
        ifrDoc.body.insertBefore(subject, ifrDoc.body.firstChild);
        if (!ifrWindow) return;
        ifrWindow.focus(); // focus on contentWindow is needed on some browsers
        ifrWindow.print();
        // remove elem from iframe
        ifrDoc.body.removeChild(elemTo);
        ifrDoc.body.removeChild(elemFrom);
        ifrDoc.body.removeChild(subject);
        document.body.removeChild(shadowIframe);
      }
    });
  }

  // Maps options to dropdown items, recursively adding suboptions
  const optionToItem = (option: ThreadBlockOptions) => {
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
          option.onClick?.(e);
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
  return (
    <Dropdown buttonRef={buttonRef} gapFromAnchor={8} portal setShowDropdown={setOpen} showDropdown={open}>
      {options.threadOptions.map(optionToItem)}
    </Dropdown>
  );
};
