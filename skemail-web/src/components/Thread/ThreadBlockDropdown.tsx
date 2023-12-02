import DOMPurify from 'dompurify';
import { Dropdown, DropdownItem, DropdownSubmenu, Icon } from 'nightwatch-ui';
import React, { RefObject, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  getCurrentUserData,
  isMobileApp,
  isReactNativeDesktopApp,
  isWindowsDesktopApp,
  sendRNWebviewMsg,
  getRawMime,
  UnsubscribeInfo
} from 'skiff-front-utils';

import { useGetRawMime } from '../../hooks/useGetRawMime';
import { ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { createExportableEML } from '../../utils/exportEml';
import { ConfirmSilencingModal } from '../shared/Silencing';

import { ConfirmUnsubscribe } from './ConfirmUnsubscribe';
import { EmailHeaderDialog } from './EmailHeaderDialog';
import { MAIL_HTML_IFRAME } from './MailHTMLView/MailHTMLView';
import { MobileMoreThreadOptionsDrawer } from './MobileMoreThreadOptionsDrawer';
import { ThreadBlockOptions } from './Thread.types';
import { useThreadOptions } from './useThreadOptions';

type ThreadBlockDropdownProps = {
  thread: ThreadDetailInfo;
  email: ThreadViewEmailInfo;
  open: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
  setOpen: (open: boolean) => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  // Aliases
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
  quickAliases: string[];
  // If applicable to the thread, the unsubscribe data including the mailto or redirect links
  unsubscribeInfo: UnsubscribeInfo | undefined;
};

export const ThreadBlockDropdown = ({
  thread,
  email,
  open,
  buttonRef,
  setOpen,
  currentLabel,
  defaultEmailAlias,
  emailAliases,
  quickAliases,
  unsubscribeInfo
}: ThreadBlockDropdownProps) => {
  const [headerDialogOpen, setHeaderDialogOpen] = useState(false);
  const [confirmSilencingModalOpen, setConfirmSilencingModalOpen] = useState(false);
  const [unsubscribeRedirectOpen, setUnsubscribeRedirectOpen] = useState(false);

  const options = useThreadOptions(
    thread,
    email,
    currentLabel,
    defaultEmailAlias,
    emailAliases,
    quickAliases,
    setOpen,
    setConfirmSilencingModalOpen
  );

  const rawMimeContent = useGetRawMime(email);

  if (!options) return null;

  const subjectTrimmed =
    email.decryptedSubject && email.decryptedSubject?.trim().length > 0 ? email.decryptedSubject?.trim() : undefined;
  const filename = `${subjectTrimmed ?? 'email'}.eml`;
  const { encryptedRawMimeUrl, decryptedSessionKey } = email;

  const runDownloadMime = async () => {
    if (!encryptedRawMimeUrl || !decryptedSessionKey) {
      return;
    }
    const rawMime = await getRawMime(encryptedRawMimeUrl, decryptedSessionKey);
    if (!rawMime) return;

    if (isReactNativeDesktopApp()) {
      // on macOS app, we need to send the file to the native side to save it
      const fullContent = 'data:text/plain;charset=utf-8,' + rawMime;
      sendRNWebviewMsg('saveFile', {
        base64Data: Buffer.from(fullContent).toString('base64'),
        type: 'message/rfc822',
        filename
      });
    } else {
      const linkElem = document.createElement('a');
      linkElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(rawMime));
      linkElem.setAttribute('download', filename);
      linkElem.style.display = 'none';
      document.body.appendChild(linkElem);
      linkElem.click();
      document.body.removeChild(linkElem);
    }
  };

  if (!isMobileApp()) {
    if (email.encryptedRawMimeUrl) {
      options.threadOptions.push({
        label: 'View headers',
        icon: Icon.Eye,
        onClick: () => {
          setHeaderDialogOpen(true);
        }
      });
    }
    options.threadOptions.push({
      label: 'Download EML',
      icon: Icon.Download,
      onClick: () => {
        if (email.encryptedRawMimeUrl) {
          void runDownloadMime();
          return;
        }
        const userData = getCurrentUserData();
        if (!userData) {
          return;
        }
        const downloadEmlFile = async () => {
          const emlFile = (await createExportableEML(userData, email)) as string;
          if (emlFile) {
            if (isReactNativeDesktopApp()) {
              // on macOS app, we need to send the file to the native side to save it
              const fullContent = 'data:text/plain;charset=utf-8,' + emlFile;
              sendRNWebviewMsg('saveFile', {
                base64Data: Buffer.from(fullContent).toString('base64'),
                type: 'message/rfc822',
                filename
              });
            } else {
              const linkElem = document.createElement('a');
              linkElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(emlFile));
              linkElem.setAttribute('download', filename);
              linkElem.style.display = 'none';
              document.body.appendChild(linkElem);
              linkElem.click();
              document.body.removeChild(linkElem);
            }
          } else {
            console.error('Error creating EML file');
          }
        };
        void downloadEmlFile();
      }
    });
    if (!isReactNativeDesktopApp() && !isWindowsDesktopApp()) {
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

      if (unsubscribeInfo) {
        options.threadOptions.push({
          label: 'Unsubscribe',
          icon: Icon.MegaphoneSlash,
          onClick: () => {
            setUnsubscribeRedirectOpen(true);
          }
        });
      }
    }
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
      <>
        <MobileMoreThreadOptionsDrawer
          emailID={email.id}
          reportSubOptions={options.reportSubOptions}
          threadOptions={options.threadOptions}
        />
        {unsubscribeInfo && (
          <ConfirmUnsubscribe
            addressToUnsubFrom={unsubscribeInfo.senderToUnsubscribeFrom}
            onClose={() => {
              setUnsubscribeRedirectOpen(false);
            }}
            open={unsubscribeRedirectOpen}
            recipientAddress={unsubscribeInfo.recipient}
            unsubscribeLinks={unsubscribeInfo.links}
          />
        )}
      </>
    );
  }
  return (
    <>
      <Dropdown buttonRef={buttonRef} gapFromAnchor={8} portal setShowDropdown={setOpen} showDropdown={open}>
        {options.threadOptions.map(optionToItem)}
      </Dropdown>
      <EmailHeaderDialog
        open={headerDialogOpen}
        rawMimeContent={rawMimeContent || ''}
        runDownloadMime={runDownloadMime}
        setOpen={setHeaderDialogOpen}
      />
      <ConfirmSilencingModal
        addressesToSilence={[email.from.address]}
        onClose={() => {
          setConfirmSilencingModalOpen(false);
        }}
        open={confirmSilencingModalOpen}
      />
    </>
  );
};
