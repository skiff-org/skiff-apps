import {
  CustomCircularProgress,
  Icon,
  Icons,
  IconText,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { getIconFromMIMEType } from 'skiff-front-utils';
import { bytesToHumanReadable } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';

import { AttachmentStates, ClientAttachment } from './types';
import { inProgress, isFailedAttachment } from './typeUtils';

const AttachmentsContainer = styled.div<{ $fitHeight: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;

  // set max height of 200px if fitHeight is false
  ${({ $fitHeight }) => !$fitHeight && 'max-height: 200px;'}

  overflow-y: auto;
  padding: 12px 16px;
  ${isMobile &&
  css`
    overflow: hidden;
    padding: 0 16px env(safe-area-inset-bottom, 0px);
  `};
`;

const TopSection = styled.div<{ $showBorder: boolean }>`
  display: flex;
  align-items: center;
  border-top: ${({ $showBorder }) => ($showBorder ? '1px solid var(--border-tertiary)' : 'none')};
  padding-top: ${({ $showBorder }) => ($showBorder ? '12px' : '0px')};
  gap: 4px;
`;

const CombinedActionContainer = styled.div`
  display: flex;
  align-items: center;
`;

const EndActionSection = styled.div<{ $failed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-direction: column;
  background: ${({ $failed }) => `var(${$failed ? '--bg-overlay-destructive' : '--bg-overlay-tertiary'})`};
  border: 1px solid ${({ $failed }) => `var(${$failed ? '--border-destructive' : '--border-tertiary'})`};
  border-radius: 0px 8px 8px 0px;
  width: 30px;
  height: 30px;
  border-left: 1px solid transparent;
  box-sizing: border-box;
`;

const MarginLeft = styled.div`
  margin-left: 4px;
`;

const AttachmentsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  ${isMobile &&
  `
    flex-direction: column;
    flex-wrap: initial;
    overflow-x: auto;
  `}
`;

const Dropshadow = styled.div`
  filter: drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.1)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.06));
`;

export const AttachmentsDataTest = {
  attachmentContainer: 'attachment-container'
};

interface AttachmentContainerProps {
  buttonsWidth: number;
  failed?: boolean;
}

const AttachmentContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  box-sizing: border-box;
  gap: 8px;
  user-select: none;

  // set background to destructive if failed otherwise bg overlay tertiary
  background: ${(props: AttachmentContainerProps) =>
    `var(${props.failed ? '--bg-overlay-destructive' : '--bg-overlay-tertiary'})`};
  border: 1px solid
    ${(props: AttachmentContainerProps) => `var(${props.failed ? '--border-destructive' : '--border-tertiary'})`};
  border-radius: 8px 0px 0px 8px;

  width: fit-content;
  box-sizing: border-box;

  transition: background-color 150ms;

  cursor: pointer;

  ${isMobile &&
  css`
    /* justify-content: space-between; */
    width: 100%;
  `}
`;

const TextContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;
  max-width: ${isMobile ? '220px' : '100%'};
`;

interface AttachmentsProps {
  attachments: ClientAttachment[];
  attachmentSizeExceeded?: boolean;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDownloadAll?: () => void;
  isDownloadingAttachments?: boolean;
  onDrop?: React.DragEventHandler;
}

const Attachments: FC<AttachmentsProps> = ({
  attachments,
  attachmentSizeExceeded,
  onDelete,
  onDownload,
  onDownloadAll,
  isDownloadingAttachments = false,
  onDrop
}) => {
  const filteredAttachments = attachments.filter((attachment) => !attachment.inline || !attachment.contentID);

  const dispatch = useDispatch();

  if (attachments.length <= 0) return null;

  const numberOfPassedActions = (onDelete ? 1 : 0) + (onDownload ? 1 : 0);

  const attachmentsCount = filteredAttachments.reduce(
    (counts, attachment) => {
      if (isFailedAttachment(attachment)) {
        return { ...counts, error: counts.error + 1 };
      }
      if (attachment.state === AttachmentStates.LocalUploading) {
        return { ...counts, uploading: counts.uploading + 1 };
      }
      return { ...counts, success: counts.success + 1 };
    },
    { success: 0, error: 0, uploading: 0 }
  );

  const notInCompose = !!onDownload;
  return (
    <AttachmentsContainer $fitHeight={notInCompose} onDrop={onDrop}>
      <TopSection $showBorder={notInCompose && !isMobile}>
        {filteredAttachments.length > 1 && !attachmentSizeExceeded && !isMobile && (
          <IconText
            color='secondary'
            disabled={isDownloadingAttachments}
            endIcon={onDownloadAll ? Icon.Download : undefined}
            label={`${filteredAttachments.length} attachments ${
              attachmentsCount.uploading > 0 ? `(${attachmentsCount.uploading} uploading)` : ''
            } ${attachmentsCount.error > 0 && !attachmentsCount.uploading ? `(${attachmentsCount.error} failed)` : ''}`}
            onClick={onDownloadAll ? onDownloadAll : undefined}
            tooltip={onDownloadAll ? (isDownloadingAttachments ? 'Downloading...' : 'Download all') : undefined}
            weight={TypographyWeight.REGULAR}
          />
        )}
      </TopSection>
      <AttachmentsList>
        {!attachmentSizeExceeded &&
          filteredAttachments.map((attachment, index) => {
            // if in progress show percent -> 10 MB / 15 MB
            const uploadSize = inProgress(attachment)
              ? `${bytesToHumanReadable(attachment.size * (attachment.progress / 100))} / ${bytesToHumanReadable(
                  attachment.size
                )}`
              : bytesToHumanReadable(attachment.size);
            const attachmentFailed = isFailedAttachment(attachment);

            // abbreviate attachmentname if it's too long to fit in the container.
            // abbreviation is in the middle of the text.
            const attachmentName =
              attachment.name.length > 20
                ? `${attachment.name.slice(0, 10)}...${attachment.name.slice(-10)}`
                : attachment.name;

            return (
              <CombinedActionContainer key={attachment.id}>
                <AttachmentContainer
                  buttonsWidth={35 * numberOfPassedActions}
                  data-test={AttachmentsDataTest.attachmentContainer}
                  failed={isFailedAttachment(attachment)}
                  key={index}
                  onClick={() => {
                    dispatch(
                      skemailModalReducer.actions.setOpenModal({
                        type: ModalType.AttachmentPreview,
                        attachments,
                        /**
                         * The AttachmentsPreview contains also the inline attachments at the start,
                         * The Attachment component only shows the non-inline attachment -> filteredAttachments
                         * We nee to "pad" the index with the amount of inline attachments to open the preview in the correct one
                         */
                        initialAttachmentIndex: index + (attachments.length - filteredAttachments.length)
                      })
                    );
                  }}
                >
                  <Dropshadow>
                    <Icons
                      color={attachmentFailed ? 'destructive' : 'link'}
                      icon={attachmentFailed ? Icon.Warning : getIconFromMIMEType(attachment.contentType)}
                      size={Size.MEDIUM}
                    />
                  </Dropshadow>
                  <TextContainer>
                    <Typography
                      color={attachmentFailed ? 'destructive' : 'secondary'}
                      minWidth={isMobile ? '240px' : undefined}
                    >
                      {attachmentName}
                    </Typography>
                    <Typography color='disabled' minWidth='fit-content' mono size={TypographySize.SMALL} uppercase>
                      {attachmentFailed ? attachment.error : `${uploadSize}`}
                    </Typography>
                  </TextContainer>
                  {attachment.state === AttachmentStates.LocalUploading && (
                    <MarginLeft>
                      <CustomCircularProgress
                        color='disabled'
                        dataTest='attachment-upload-loader'
                        progress={attachment.progress}
                        size={Size.SMALL}
                      />
                    </MarginLeft>
                  )}
                </AttachmentContainer>
                {attachment.state !== AttachmentStates.LocalUploading && (
                  <EndActionSection
                    $failed={isFailedAttachment(attachment)}
                    onClick={() => {
                      if (!!onDownload) {
                        onDownload(attachment.id);
                      } else if (!!onDelete) {
                        onDelete(attachment.id);
                      }
                    }}
                  >
                    {onDownload && <Icons color='secondary' icon={Icon.Download} size={Size.SMALL} />}
                    {onDelete && <Icons color='secondary' icon={Icon.Close} size={Size.SMALL} />}
                  </EndActionSection>
                )}
              </CombinedActionContainer>
            );
          })}
      </AttachmentsList>
    </AttachmentsContainer>
  );
};

export default Attachments;
