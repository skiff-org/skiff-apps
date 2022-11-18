import { Icon, IconButton, Icons, Typography, CustomCircularProgress } from 'nightwatch-ui';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { getIconFromMIMEType, readableFileSize } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { MESSAGE_MAX_SIZE_IN_MB } from '../MailEditor/Plugins/MessageSizePlugin';

import { AttachmentStates, ClientAttachment } from './types';
import { inProgress, isFailedAttachment } from './typeUtils';

const AttachmentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  max-height: 200px;
  overflow-y: auto;
  padding: 0px 50px 0px 0px;

  ${isMobile &&
  css`
    overflow: hidden;
    padding: 0 0 env(safe-area-inset-bottom, 0px);
  `}
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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

export const AttachmentsDataTest = {
  attachmentContainer: 'attachment-container'
};

interface AttachmentContainerProps {
  buttonsWidth: number;
  failed?: boolean;
}

const AttachmentContainer = styled.div`
  display: flex;
  gap: 8px;
  display: flex;
  align-items: flex-start;
  padding: 4px;

  border: 1px solid
    ${(props: AttachmentContainerProps) => `var(${props.failed ? '--border-destructive' : '--border-secondary'})`};
  border-radius: 8px;
  width: fit-content;
  box-sizing: border-box;

  transition: background-color 150ms;

  cursor: pointer;
  :hover {
    background-color: var(--bg-cell-hover);
  }

  ${isMobile &&
  css`
    justify-content: space-between;
    width: 100%;
  `}
`;

const IconTextContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const TextContainer = styled.div`
  display: flex;
  max-width: ${isMobile ? '220px' : '100px'};
  flex-direction: column;
`;

const IconContainer = styled.div`
  background: red;
  width: 46px;
  height: 46px;
  justify-content: center;
  background: var(--bg-field-hover);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface AttachmentsProps {
  attachments: ClientAttachment[];
  attachmentsSize?: number;
  attachmentSizeExceeded?: boolean;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDownloadAll?: () => void;
  isDownloadingAttachments?: boolean;
  onDrop?: React.DragEventHandler;
}

const Attachments: FC<AttachmentsProps> = ({
  attachments,
  attachmentsSize,
  attachmentSizeExceeded,
  onDelete,
  onDownload,
  onDownloadAll,
  isDownloadingAttachments = false,
  onDrop
}) => {
  const filteredAttachments = attachments.filter((attachment) => !attachment.inline);

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

  return (
    <AttachmentsContainer onDrop={onDrop}>
      <TopBar>
        {filteredAttachments.length > 0 && !attachmentSizeExceeded && (
          <Typography color='secondary'>
            {filteredAttachments.length === 1
              ? '1 attachment'
              : `${filteredAttachments.length} attachments ${
                  attachmentsCount.error !== 0 || attachmentsCount.uploading !== 0
                    ? `(${attachmentsCount.uploading} Uploading, ${attachmentsCount.error} Failed)`
                    : ''
                }`}
          </Typography>
        )}
        {attachmentSizeExceeded && attachmentsSize && (
          <Typography color='destructive'>Cannot upload files larger than {MESSAGE_MAX_SIZE_IN_MB}MB</Typography>
        )}
        {filteredAttachments.length > 0 && onDownloadAll && !isMobile && (
          <IconButton
            color='secondary'
            disabled={isDownloadingAttachments}
            icon={Icon.Download}
            onClick={onDownloadAll}
            tooltip={isDownloadingAttachments ? 'Downloading...' : 'Download all'}
          />
        )}
      </TopBar>
      <AttachmentsList>
        {!attachmentSizeExceeded &&
          filteredAttachments.map((attachment, index) => {
            // if in progress show percent -> 10 MB / 15 MB
            const uploadSize = inProgress(attachment)
              ? `${readableFileSize(attachment.size * (attachment.progress / 100))} / ${readableFileSize(
                  attachment.size
                )}`
              : readableFileSize(attachment.size);

            return (
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
                <IconTextContainer>
                  <IconContainer>
                    <Icons icon={getIconFromMIMEType(attachment.contentType)} size='large' />
                  </IconContainer>
                  <TextContainer>
                    <Typography>{attachment.name}</Typography>
                    <Typography color='secondary'>
                      {isFailedAttachment(attachment) ? attachment.error : `${uploadSize} ${attachment.contentType}`}
                    </Typography>
                  </TextContainer>
                </IconTextContainer>
                {attachment.state === AttachmentStates.LocalUploading ? (
                  <CustomCircularProgress dataTest='attachment-upload-loader' progress={attachment.progress} />
                ) : (
                  <>
                    {onDownload && !isMobile && (
                      <IconButton
                        icon={Icon.Download}
                        onClick={(e) => {
                          e.stopPropagation(); // Stop propagation to not open the attachment preview
                          onDownload(attachment.id);
                        }}
                        tooltip='Download'
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        icon={Icon.Trash}
                        onClick={(e) => {
                          e.stopPropagation(); // Stop propagation to not open the attachment preview
                          onDelete(attachment.id);
                        }}
                        tooltip='Remove'
                      />
                    )}
                  </>
                )}
              </AttachmentContainer>
            );
          })}
      </AttachmentsList>
    </AttachmentsContainer>
  );
};

export default Attachments;
