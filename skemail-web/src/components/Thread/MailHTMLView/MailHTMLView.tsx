import DOMPurify from 'dompurify';
import debounce from 'lodash/debounce';
import { ThemeMode, themeNames } from 'nightwatch-ui';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isIOS, isMobile, isSafari } from 'react-device-detect';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import {
  contentAsDataUrl,
  getResourceProxyURL,
  isReactNativeDesktopApp,
  PLACEHOLDER_CONTENT_URL,
  proxyAttributes,
  rewriteCSSAttribute,
  useTheme,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
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
  handleTransactionalMail,
  lightenDarkText,
  overrideIFrameElementClick,
  queryMarkedElements,
  setCidImages,
  setMailtoLinks
} from './mailModifyUtils';
import LazyPinchZoom from './PinchZoom/LazyPinchZoom';

const StylediFrame = React.memo(
  styled.iframe`
    width: 100%;
    height: 62px;
    border: 0;
  `
);

export interface MailViewProps {
  email: MailboxEmailInfo;
  attachments: ClientAttachment[];
  shouldBlockRemoteContent: boolean;
}

const ALLOWED_PX_INTERVAL = 10;
export const MAIL_CONTENT_CONTAINER_ID = 'mail-content-container';
export const MAIL_CONTENT_CONTAINER_DATA_TEST = 'mail-content-container';
export const MAIL_HTML_IFRAME = 'mail-html-iframe';
export const MAIL_CONTENT_WRAPPER = 'mail-content-wrapper';

const MailHTMLView: FC<MailViewProps> = ({ email, attachments, shouldBlockRemoteContent }) => {
  const [iframeState, setIframeState] = useState('init');
  // Iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Email content container
  const iframeRootDivRef = useRef<HTMLDivElement>();
  // Last iframe height - helps with avoiding infinty height for mail with 100% height elements
  const prevHeightRef = useRef<number>(0);
  // Show previous content state, default to hiding previous content
  const [showQuotes, setShowQuotes] = useState(false);

  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { composeNewDraft } = useDrafts();

  // Preferred user setting for blocking remote content
  const [userBlockRemoteContent] = useUserPreference(StorageTypes.BLOCK_REMOTE_CONTENT);

  const resourceProxyURLForCSP = getResourceProxyURL(new URL(window.location.origin), shouldBlockRemoteContent);
  const resourceProxyCspString = resourceProxyURLForCSP.origin.toString() + resourceProxyURLForCSP.pathname.toString();
  const csp = `default-src 'none'; img-src ${
    window.location.origin + PLACEHOLDER_CONTENT_URL
  } blob: data: ${resourceProxyCspString}; style-src 'unsafe-inline'; script-src 'none';`;

  const getIframeHtml = (content: string, frameCsp: string, extraBodyStyle?: string) =>
    `
  <!DOCTYPE html>
  <html>
    <head>
      <base target="_blank" />
      <meta http-equiv='Content-Security-Policy' content="${frameCsp}">
      <meta name="viewport" content="width=device-width">
      <style>
        strong {
          font-weight: 560 !important;
        }
        @media print {
          .printOnly {
            display: block !important;
          }
        }
        .printOnly {
          display: none;
        }
      </style>
    </head>

    <body style="line-height: 1.25;font-family: 'Skiff Sans Text', system-ui, sans-serif;margin: 0px;padding: 0px;white-space: normal;overflow: auto hidden;${
      extraBodyStyle ?? ''
    }">
      <div id="${MAIL_CONTENT_CONTAINER_ID}" data-test=${MAIL_CONTENT_CONTAINER_DATA_TEST}>
        <div style="display: flex !important; width: 100% !important;">
          <div id="${MAIL_CONTENT_WRAPPER}" style="width: 100% !important;font-weight: 380;overflow-wrap: anywhere;-webkit-font-smoothing: antialiased;">
            ${content}
          </div>
        </div>
      </div>
    </body>
  </html>
`;
  // this key and useEffect are necessary when enabling remote content for the iframe to be fully rerendered
  const [iframeKey, setIframeKey] = useState(0);

  // Create Iframe document to render mail
  const iframeSrcDoc = useMemo(() => {
    const extraStyle = theme === ThemeMode.LIGHT ? 'color: var(--text-primary);' : ''; // When on light mode add color

    const bodyContent = getEmailBody(email);

    const dom = new DOMParser().parseFromString(bodyContent, 'text/html');
    proxyAttributes(dom, shouldBlockRemoteContent);
    const originUrl: URL = new URL(window.location.origin);
    rewriteCSSAttribute(dom, originUrl, shouldBlockRemoteContent);

    const sanitizedContent = DOMPurify.sanitize(dom.documentElement.outerHTML);

    return getIframeHtml(sanitizedContent, csp, extraStyle);
  }, [email.id, shouldBlockRemoteContent, csp, iframeKey]);

  const currentIframeDoc = iframeRef.current?.contentDocument;

  // Show/Hide previous content by showQuotes
  useEffect(() => {
    if (currentIframeDoc) {
      const [quote] = queryMarkedElements(currentIframeDoc, ElementMark.LastEmailQuote);
      if (quote) {
        quote.hidden = !showQuotes;

        const [quoteButton] = queryMarkedElements(currentIframeDoc, ElementMark.QuoteToggleButton);

        if (quoteButton) {
          quoteButton.innerText = `${showQuotes ? 'Hide' : 'Show'} previous content`;
        }
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const fonts = [...document.fonts.keys()];
      await Promise.allSettled(
        fonts.map(async (font: FontFace) => {
          // Waiting for font to load
          await font.load();
          // Adding loaded font to iframe
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
      doc?.body.style.setProperty(key, themeColor[key] ?? null);
    });

    const mailContentWrapper = doc.getElementById(MAIL_CONTENT_WRAPPER);
    const mailContentWrapperChildDivs = mailContentWrapper
      ? Array.from(mailContentWrapper.children).filter((child) => child.tagName === 'DIV')
      : [];
    if (mailContentWrapperChildDivs.length > 0) {
      const firstDiv = mailContentWrapperChildDivs[0];
      if (firstDiv) {
        const styleAttrs = firstDiv.getAttribute('style');
        // If any of the divs has height 100% remove it, as it prevents us from accurately
        // calculating the height of the email contents in the iframe
        if (styleAttrs?.includes('height: 100%')) {
          firstDiv.setAttribute('style', 'height: unset;');
        }

        // If the email only has one div and there is no height set, set it to auto
        if (mailContentWrapperChildDivs.length === 1 && styleAttrs && !styleAttrs.includes('height')) {
          firstDiv.setAttribute('style', 'height: auto;');
        }
      }
    }

    if (theme === ThemeMode.DARK) {
      lightenDarkText(doc);
    }

    void setCidImages(doc);
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
  }, [iframeSrcDoc, theme, iframeKey]);

  // Load inline images and add onclick event for opening preview
  useEffect(() => {
    if (shouldBlockRemoteContent) return;
    if (currentIframeDoc && iframeState === 'done') {
      queryMarkedElements(currentIframeDoc, ElementMark.PreviewImg).forEach((imgEl) => {
        const cid = imgEl.dataset.cid;
        const initialAttachmentIndex = attachments.findIndex((attachment) => {
          const { contentID, content } = attachment as ClientLocalAttachment;
          return hasContent(attachment) && contentID === `<${cid ?? ''}>` && content;
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
  }, [attachments, currentIframeDoc, iframeState, shouldBlockRemoteContent]);

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

      const heightIsOutOfBoundaries =
        height && (height > prevHeight + ALLOWED_PX_INTERVAL || height < prevHeight - ALLOWED_PX_INTERVAL);

      // Need to reset the height if we're enabling remote content
      if (heightIsOutOfBoundaries || !shouldBlockRemoteContent) {
        prevHeightRef.current = height;
        iframeRef.current.style.height = `${height}px`;
      }
    }, 150),
    [shouldBlockRemoteContent]
  );

  // Adjust iframe height when disabling/enabling remote content
  useEffect(() => {
    if (currentIframeDoc && iframeState === 'done') {
      // Adjust iframe height
      debouncedSetIframeHeight();
    }
  }, [attachments, currentIframeDoc, iframeState, shouldBlockRemoteContent, showQuotes, debouncedSetIframeHeight]);

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
    // CANNOT HAVE iframeState as a dependency, it will cause height adjustment to not work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id, theme]);

  useEffect(() => {
    if (shouldBlockRemoteContent) {
      return;
    }
    // if the user has userBlockRemoteContent set to false, we don't want to rerender the iframe
    if (!userBlockRemoteContent) {
      return;
    }
    const timeoutNum = setTimeout(() => {
      setIframeKey((prevKey) => prevKey + 1);
      debouncedSetIframeHeight();
      // let frame render and try height again
      setTimeout(() => {
        debouncedSetIframeHeight();
      }, 500);
    }, 100);
    return () => clearTimeout(timeoutNum);
  }, [shouldBlockRemoteContent]);

  return (
    <StylediFrame
      allowFullScreen={false}
      csp={csp}
      data-test='message-content-iframe'
      frameBorder='0'
      id={MAIL_HTML_IFRAME}
      key={iframeKey}
      ref={iframeRef}
      sandbox={`allow-same-origin allow-popups allow-popups-to-escape-sandbox ${
        isSafari || isIOS || isReactNativeDesktopApp() ? 'allow-scripts' : ''
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
