import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import { themeNames } from 'nightwatch-ui';
import React, { FC, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { isIOS, isMobile, isSafari } from 'react-device-detect';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { rewriteCSSAttribute, rewriteHTMLAttribute, getResourceProxyURL, useTheme } from 'skiff-front-utils';
import { contentAsDataUrl } from 'skiff-front-utils';
import { isDesktopApp } from 'skiff-front-utils';
import styled from 'styled-components';

import { useDrafts } from '../../../hooks/useDrafts';
import { MailboxEmailInfo } from '../../../models/email';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { ClientAttachment, ClientLocalAttachment, hasContent } from '../../Attachments';
import { getEmailBody } from '../../MailEditor/mailEditorUtils';

import {
  addQuotesContainer,
  displayCidImage,
  ElementMark,
  queryMarkedElements,
  overrideIFrameElementClick,
  setCidImages,
  setMailtoLinks,
  lightenDarkText,
  handleTransactionalMail
} from './mailModifyUtils';
import LazyPinchZoom from './PinchZoom/LazyPinchZoom';

const StylediFrame = React.memo(
  styled.iframe`
    width: 100%;
    height: 62px;
    transition: height 0.2s;
    border: 0;
  `
);

export interface MailViewProps {
  email: MailboxEmailInfo;
  attachments: ClientAttachment[];
}

const ALLOWED_PX_INTERVAL = 10;
export const MAIL_CONTENT_CONTAINER_ID = 'mail-content-container';
export const MAIL_CONTENT_CONTAINER_DATA_TEST = 'mail-content-container';

const MailHTMLView: FC<MailViewProps> = ({ email, attachments }) => {
  const [iframeState, setIframeState] = useState('init');
  // Iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Email content container
  const iframeRootDivRef = useRef<HTMLDivElement>();
  // Last iframe height - helps with avoiding infinty height for mail with 100% height elements
  const prevHeightRef = useRef<number>(0);
  // Show previues content state, default to hiding previous content
  const [showQuotes, setShowQuotes] = useState(true);

  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { composeNewDraft } = useDrafts();

  const originUrl: URL = new URL(window.location.origin);
  const resourceProxyURL = getResourceProxyURL(new URL(window.location.origin));
  const resourceProxyCspString = resourceProxyURL.origin.toString() + resourceProxyURL.pathname.toString();
  const csp = `default-src 'none'; img-src blob: data: ${resourceProxyCspString}; style-src 'unsafe-inline'; script-src 'none'`;

  const getIframeHtml = (content: string, extraBodyStyle = '') =>
    `
  <!DOCTYPE html>
  <html>
    <head>
      <base target="_blank" />
      <meta http-equiv='Content-Security-Policy' content="${csp}">
      <meta name="viewport" content="width=device-width">
    </head>

    <body style="line-height: 1.25;font-family: 'Skiff Sans Text', system-ui, sans-serif;margin: 0px;white-space: normal;overflow: auto hidden;${extraBodyStyle}">
      <div id="${MAIL_CONTENT_CONTAINER_ID}" data-test=${MAIL_CONTENT_CONTAINER_DATA_TEST}>
        <div style="display: flex !important; width: 100% !important;">
          <div style="width: 100% !important;padding-bottom:10px !important;overflow-wrap: anywhere;-webkit-font-smoothing: antialiased;">
            ${content}
          </div>
        </div>
      </div>
    </body>
  </html>
`;

  // Create Iframe document to render mail
  const iframeSrcDoc = useMemo(() => {
    const extraStyle = theme === 'light' ? 'color: var(--text-primary);' : ''; // When on light mode add color

    const bodyContent = getEmailBody(email);

    const dom = new DOMParser().parseFromString(bodyContent, 'text/html');
    // Rewrite all src attributes if they are a full url
    rewriteHTMLAttribute(dom, '', 'src', originUrl);
    rewriteHTMLAttribute(dom, 'img', 'href', originUrl);
    rewriteHTMLAttribute(dom, 'img', 'srcset', originUrl);
    rewriteHTMLAttribute(dom, 'image', 'href', originUrl);
    rewriteHTMLAttribute(dom, 'image', 'xlink\\:href', originUrl);
    rewriteHTMLAttribute(dom, 'table', 'background', originUrl);
    rewriteHTMLAttribute(dom, 'td', 'background', originUrl);
    rewriteHTMLAttribute(dom, 'video', 'poster', originUrl);
    // Rewrite all url() in inline styles
    rewriteCSSAttribute(dom, originUrl);

    const sanitizedContent = DOMPurify.sanitize(dom.documentElement.outerHTML);

    return getIframeHtml(sanitizedContent, extraStyle);
  }, [email.id]);

  const currentIframeDoc = iframeRef.current?.contentDocument;

  // Show/Hide previues content by showQuotes
  useEffect(() => {
    if (currentIframeDoc) {
      const [quote] = queryMarkedElements(currentIframeDoc, ElementMark.LastEmailQuote);
      if (quote) {
        const [quoteButton] = queryMarkedElements(currentIframeDoc, ElementMark.QuoteToggleButton)!;

        quoteButton.innerText = `${showQuotes ? 'Show' : 'Hide'} previous content`;
        quote.hidden = showQuotes;
      }
    }
  }, [showQuotes, currentIframeDoc]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !document.fonts) return;

    const loadFonts = async () => {
      // Waiting for document fonts
      await document.fonts.ready;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const fonts = [...document.fonts.keys()];
      await Promise.allSettled(
        fonts.map(async (font: FontFace) => {
          // Waiting for font to load
          await font.load();
          // Adding loaded font to iframe
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          doc.fonts.add(font);
        })
      );
    };
    void loadFonts();
  }, [iframeSrcDoc]);

  // Update iframe html with generated mail doc add styles by theme
  // After rendering add skemail interaction + handle inline images
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;

    if (!doc) {
      return;
    }
    doc?.open();
    doc?.write(iframeSrcDoc);
    doc?.close();

    iframeRootDivRef.current = doc?.getElementById(MAIL_CONTENT_CONTAINER_ID) as HTMLDivElement;

    const themeColor = themeNames[theme];
    Object.keys(themeColor).forEach((key) => {
      doc?.body.style.setProperty(key, themeColor[key]);
    });

    if (theme === 'dark') {
      lightenDarkText(doc);
    }

    setCidImages(doc);
    setMailtoLinks(doc, (address) => {
      composeNewDraft();
      dispatch(skemailModalReducer.actions.directMessageCompose({ address }));
    });

    addQuotesContainer(
      doc,
      () => {
        setShowQuotes((oldState) => !oldState);
      },
      false
    );

    handleTransactionalMail(iframeRootDivRef.current);

    setIframeState('done');
  }, [iframeSrcDoc, theme]);

  // Load inline images and add onclick event for opening preview
  useEffect(() => {
    if (currentIframeDoc && iframeState === 'done') {
      queryMarkedElements(currentIframeDoc, ElementMark.PreviewImg).forEach((imgEl) => {
        const cid = imgEl.dataset.cid;
        const initialAttachmentIndex = attachments.findIndex((attachment) => {
          const { contentID, content } = attachment as ClientLocalAttachment;
          return hasContent(attachment) && contentID === `<${cid}>` && content;
        });

        if (initialAttachmentIndex !== -1) {
          const attachment = attachments[initialAttachmentIndex] as ClientLocalAttachment;
          const displayImage = contentAsDataUrl(attachment.content, attachment.contentType);
          displayCidImage(imgEl as HTMLImageElement, displayImage);
          overrideIFrameElementClick(imgEl, () =>
            dispatch(
              skemailModalReducer.actions.setOpenModal({
                type: ModalType.AttachmentPreview,
                attachments,
                initialAttachmentIndex
              })
            )
          );
        }
      });
    }
  }, [attachments, currentIframeDoc, iframeState]);

  // Check if iframe inner scroll is bigger then iframe height, if so increase iframe height to fit
  const debouncedSetIframeHeight = useCallback(
    debounce(() => {
      if (!iframeRef || !iframeRef.current) {
        return;
      }

      const emailContentRoot = iframeRef.current?.contentWindow?.document.getElementById(MAIL_CONTENT_CONTAINER_ID);
      const prevHeight = prevHeightRef.current;
      const height = emailContentRoot?.scrollHeight;

      if (!emailContentRoot || height === undefined) {
        return;
      }

      const heightIsOutOfBoudaries =
        height && (height > prevHeight + ALLOWED_PX_INTERVAL || height < prevHeight - ALLOWED_PX_INTERVAL);

      if (heightIsOutOfBoudaries) {
        prevHeightRef.current = height;
        iframeRef.current.style.height = `${height}px`;
      }
    }, 150),
    []
  );

  // Add observer on inner element height, and call debouncedSetIframeHeight
  // For emails with images it will make sure iframe have the right size whem images loaded and content height changed
  useEffect(() => {
    if (iframeState !== 'done') {
      return;
    }

    // We're ready set some height
    debouncedSetIframeHeight();

    const iframeRootDiv = iframeRef.current?.contentWindow?.document.getElementById(
      MAIL_CONTENT_CONTAINER_ID
    ) as HTMLDivElement;

    const resizeObserver = new ResizeObserver(() => {
      debouncedSetIframeHeight();
    });

    // Only checks iframe root div widths changes (window resize or inner resize when column mailbox layout is set)
    resizeObserver.observe(iframeRootDiv);

    return () => {
      resizeObserver.disconnect();
      debouncedSetIframeHeight.cancel();
    };
  }, [iframeState]);

  useEffect(() => {
    if (iframeState === 'done') {
      setIframeState('init');
    }
  }, [email.id, theme]);

  return (
    <StylediFrame
      allowFullScreen={false}
      csp={csp}
      data-test='message-content-iframe'
      frameBorder='0'
      ref={iframeRef}
      sandbox={`allow-same-origin allow-popups allow-popups-to-escape-sandbox ${
        isSafari || isIOS || isDesktopApp() ? 'allow-scripts' : ''
      }`}
      srcDoc='<html></html>'
    >
      {/*
        To add pinch to zoom we create a portal that inserts the PinchZoom component into the iframe's body
        We then pass the iframe's content document into the PinchZooms components props who then uses it to move the
        MAIL_CONTENT_CONTAINER_ID div into the pinch component (this only happens on mobile, on desktop nothing changes)
       */}
      {iframeRef.current?.contentDocument &&
        createPortal(
          <LazyPinchZoom contentDocument={iframeRef.current.contentDocument} enabled={isMobile} />,
          iframeRef.current.contentDocument.body
        )}
    </StylediFrame>
  );
};

export default MailHTMLView;
