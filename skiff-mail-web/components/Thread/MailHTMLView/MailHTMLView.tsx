import { Icon, IconText } from '@skiff-org/skiff-ui';
import DOMPurify from 'dompurify';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { MailboxEmailInfo } from '../../../models/email';
import { useDownloadAttachments } from '../../Attachments';
import { b64ToImageUrl } from '../../MailEditor/Image/utils';
import { getEmailBody } from '../../MailEditor/mailEditorUtils';
import { findInjectedNodeInIframe, findInjectedNodesInIframe, InjectedIDs, injectIDs } from './injectIDs';

const StylediFrame = styled.iframe<{ mailHeight: number }>`
  width: 100%;
  height: ${(props) => props.mailHeight + 30}px;
  border: 0;
`;
export interface MailViewProps {
  email: MailboxEmailInfo;
}

const MailHTMLView: FC<MailViewProps> = ({ email }) => {
  // should leave this out of 'iframeStyleSheet' useMemo
  const styleSheetsRules = Array.from(document.getElementsByTagName('style')).map(({ innerText }) => innerText);

  // style to add to iframe
  const iframeStyleSheet = useMemo(() => {
    const fontColorRule = `:root {color: var(--text-primary)}`;
    const rootStyleRule = `:root {${document.body.getAttribute('style')}}`;
    const sanitizedStyles = [...styleSheetsRules, rootStyleRule, fontColorRule].map((rules) =>
      DOMPurify.sanitize(rules)
    );

    return sanitizedStyles.join('\n');
  }, [styleSheetsRules]);

  const { inlineAttachments } = useDownloadAttachments(email.decryptedAttachmentMetadata);

  // iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // ref to div rendering the email inside the iframe
  const [emailDivRef, setEmailDivRef] = useState<HTMLDivElement | null>(null);

  const [lastEmailHidden, setLastEmailHidden] = useState(true);

  // node inside iframe document to render mail
  const [mountNode, setMountNode] = useState<HTMLElement | undefined>();

  useEffect(() => {
    const documentBody = iframeRef.current?.contentWindow?.document?.body;
    setMountNode(documentBody);
    documentBody?.setAttribute('style', 'overflow-y: hidden');
  }, [iframeRef]);

  // dom purified email content set inside iframe
  const purifiedContent = useMemo(() => {
    const bodyContent = getEmailBody(email);
    const sanitized = DOMPurify.sanitize(bodyContent);
    const withInjectedIDs = injectIDs(sanitized);
    return withInjectedIDs;
  }, [email]);

  const showPreviousContainer = findInjectedNodeInIframe(iframeRef, InjectedIDs.ShowPreviousContainer);
  const lastEmailQuote = findInjectedNodeInIframe(iframeRef, InjectedIDs.LastEmailQuote) as HTMLElement;
  const cidImages = findInjectedNodesInIframe(iframeRef, InjectedIDs.CIDImage) as HTMLElement[];

  useEffect(() => {
    if (lastEmailQuote) lastEmailQuote.style.display = lastEmailHidden ? 'none' : 'block';
  }, [lastEmailHidden, lastEmailQuote]);

  const [mailHeight, setMailHeight] = useState(0);

  useEffect(() => {
    (cidImages || []).forEach((image) => {
      const src = image.getAttribute('src');
      if (!src) return;
      const cid = src.match(/cid:(.*)/)?.[1];
      if (!cid) return;

      // find the inlineAttachments with the matching CID
      const content = inlineAttachments[`<${cid}>`];
      if (!content) return;

      if (!content.startsWith('data') || !content.includes('base64')) return;

      void b64ToImageUrl(content).then((url) => {
        image.setAttribute('src', url);
      });
    });
  }, [cidImages, inlineAttachments]);

  useEffect(() => {
    if (!emailDivRef) return;

    setMailHeight((oldHeight) => emailDivRef?.scrollHeight || oldHeight);
    const observer = new MutationObserver(() => {
      setTimeout((oldHeight) => setMailHeight(emailDivRef?.scrollHeight || oldHeight));
    });

    observer.observe(emailDivRef, {
      subtree: true,
      childList: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, [emailDivRef, lastEmailHidden]);

  return (
    <StylediFrame
      mailHeight={mailHeight}
      ref={iframeRef}
      sandbox='allow-same-origin allow-popups allow-popups-to-escape-sandbox'
      seamless
    >
      {mountNode && createPortal(<style>{iframeStyleSheet}</style>, mountNode)}
      {mountNode &&
        createPortal(
          <div>
            {/* links open in new tab */}
            <base target='_blank' />
            <div
              className='ProseMirror'
              dangerouslySetInnerHTML={{ __html: purifiedContent }}
              ref={setEmailDivRef}
              style={{ fontFamily: "'Skiff Sans Text'" }}
            />
          </div>,
          mountNode
        )}
      {showPreviousContainer &&
        lastEmailQuote &&
        createPortal(
          <IconText
            color='link'
            endIcon={lastEmailHidden ? Icon.ChevronDown : Icon.ChevronUp}
            label={`${lastEmailHidden ? 'Show' : 'Hide'} previous content`}
            onClick={() => {
              setLastEmailHidden((hidden) => !hidden);
            }}
            type='label'
          />,
          showPreviousContainer
        )}
    </StylediFrame>
  );
};

export default MailHTMLView;
