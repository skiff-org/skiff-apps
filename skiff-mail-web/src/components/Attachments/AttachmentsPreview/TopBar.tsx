import {
  FilledVariant,
  Icon,
  IconButton,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight,
  getThemedColor
} from 'nightwatch-ui';
import { FC } from 'react';
import { contentAsDataUrl, isReactNativeDesktopApp } from 'skiff-front-utils';
import { Email, SystemLabels, UserThread } from 'skiff-graphql';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

import { useNavigate } from '../../../utils/navigation';
import { ClientAttachment } from '../types';
import { hasContent } from '../typeUtils';
import useAttachments from '../useAttachments';

const TopBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 8px 8px 16px;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  background: ${getThemedColor('var(--bg-l1-solid)', ThemeMode.DARK)};
  border-radius: 8px 8px 0px 0px;
  z-index: 9999;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.26);
`;

interface TopBarProps {
  attachment: ClientAttachment;
  closeModal: () => void;
  thread?: UserThread;
  email?: Email;
  onPrev?: () => void;
  onNext?: () => void;
}

const SUPPORTED_PRINT_BTN_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const TopBar: FC<TopBarProps> = ({ attachment, thread, email, onPrev, onNext, closeModal }) => {
  const { navigateToSystemLabel } = useNavigate();
  const { downloadAttachment } = useAttachments({ clientAttachments: [attachment] });

  const { threadID, attributes } = thread ?? {};
  const { id: attachmentID, contentType, name, size } = attachment;
  const { id: emailID, decryptedSubject } = email ?? {};
  const activeThreadQuery = { threadID: threadID ?? '', emailID: emailID ?? '' };

  const PrimaryText: React.FC = ({ children }) => (
    <Typography forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
      {children}
    </Typography>
  );

  const SecondaryText: React.FC = ({ children }) => (
    <Typography color='secondary' forceTheme={ThemeMode.DARK}>
      {children}
    </Typography>
  );

  const humanReadableSize = size ? bytesToHumanReadable(size) : '';
  // print button only enabled for PDFs currently
  const showPrint = SUPPORTED_PRINT_BTN_MIME_TYPES.includes(contentType) && !isReactNativeDesktopApp();

  return (
    <TopBarContainer>
      <PrimaryText>{name}</PrimaryText>
      <SecondaryText>{humanReadableSize}</SecondaryText>
      <VerticalDivider />
      {email && (
        <>
          <PrimaryText>{decryptedSubject}</PrimaryText>
          <SecondaryText>{email?.from.name ?? email?.from.address}</SecondaryText>
          {thread && (
            <IconButton
              forceTheme={ThemeMode.DARK}
              icon={Icon.ExternalLink}
              onClick={() =>
                navigateToSystemLabel(
                  attributes?.systemLabels[0] as SystemLabels,
                  activeThreadQuery.emailID || activeThreadQuery.threadID
                    ? `?${new URLSearchParams(activeThreadQuery).toString()}`
                    : undefined
                )
              }
              size={Size.SMALL}
              variant={FilledVariant.UNFILLED}
            />
          )}
          <VerticalDivider />
        </>
      )}
      <IconText
        color='primary'
        forceTheme={ThemeMode.DARK}
        onClick={(e) => {
          e?.stopPropagation();
          void downloadAttachment(attachmentID, contentType, name);
        }}
        startIcon={Icon.Download}
      />
      {showPrint && (
        <IconText
          color='primary'
          forceTheme={ThemeMode.DARK}
          onClick={(e) => {
            e?.stopPropagation();

            if (!hasContent(attachment)) {
              console.warn('No content found.');
              return;
            }

            let imgSrcSection = '';
            if (contentType === 'application/pdf') {
              const canvases = document.querySelectorAll('.react-pdf__Page__canvas') as unknown as HTMLCanvasElement[];
              if (canvases.length === 0) {
                console.warn('No canvas elements found.');
                return;
              }
              imgSrcSection = Array.from(canvases)
                .map((canvas) => {
                  const imageDataUrl = canvas.toDataURL();
                  return `<img src="${imageDataUrl}" style="width:100%; page-break-after: always;"/>`;
                })
                .join('');
            } else {
              imgSrcSection = `<img src="${contentAsDataUrl(
                attachment.content,
                attachment.contentType
              )}" style="width:100%;"/>`;
            }

            const shadowIframe = document.createElement('iframe');
            // add sandbox to prevent access to parent window
            shadowIframe.setAttribute('sandbox', 'allow-same-origin allow-modals allow-popups-to-escape-sandbox');

            const iframeSrcDoc = `
              <html>
                <head>
                  <title>Print PDF</title>
                </head>
                <body>
                  ${imgSrcSection}
                </body>
              </html>
            `;

            shadowIframe.srcdoc = iframeSrcDoc;
            document.body.appendChild(shadowIframe);

            setTimeout(() => {
              shadowIframe.contentWindow?.focus();
              shadowIframe.contentWindow?.print();
              document.body.removeChild(shadowIframe);
            }, 500);
          }}
          startIcon={Icon.Printer}
        />
      )}
      <iframe id='printFile' sandbox='allow-popups-to-escape-sandbox' style={{ display: 'none' }} title='print-frame' />
      <RightSection>
        {(!!onPrev || !!onNext) && (
          <>
            <IconButton
              disabled={!onPrev}
              forceTheme={ThemeMode.DARK}
              icon={Icon.Backward}
              onClick={(e) => {
                e.stopPropagation();
                if (onPrev) onPrev();
              }}
              variant={FilledVariant.UNFILLED}
            />
            <IconButton
              disabled={!onNext}
              forceTheme={ThemeMode.DARK}
              icon={Icon.Forward}
              onClick={(e) => {
                e.stopPropagation();
                if (onNext) onNext();
              }}
              variant={FilledVariant.UNFILLED}
            />
            <VerticalDivider />
          </>
        )}
        <IconButton
          forceTheme={ThemeMode.DARK}
          icon={Icon.Close}
          onClick={(e) => {
            e.stopPropagation();
            closeModal();
          }}
          variant={FilledVariant.UNFILLED}
        />
      </RightSection>
    </TopBarContainer>
  );
};

export default TopBar;
