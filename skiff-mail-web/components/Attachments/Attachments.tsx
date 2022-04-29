import { Icon, IconButton, IconText, Typography } from '@skiff-org/skiff-ui';
import { FC } from 'react';
import styled from 'styled-components';

import { getIconFromMIMEType, readableFileSize } from '../../utils/readFile';
import CustomCircularProgress from '../CustomCircularProgress';
import { MESSAGE_MAX_SIZE } from '../MailEditor/Plugins/MessageSizePlugin';
import { LocalAttachment, RemoteAttachment } from './types';
import { isFailedAttachment, isInProgress, isRemoteAttachment } from './typeUtils';

const AttachmentsContainer = styled.div`
  padding: 10px 0px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  max-height: 200px;
  overflow-y: auto;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const AttachmentsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

interface AttachmentContainerProps {
  buttonsWidth: number;
  failed?: boolean;
}
const AttachmentContainer = styled.div`
  display: grid;
  align-items: center;
  gap: 5px;
  grid-template-columns: ${(props: AttachmentContainerProps) =>
    `calc(100% - ${props.buttonsWidth}px) ${props.buttonsWidth}px`};
  grid-template-rows: 1fr 1fr;

  border: 1px solid
    ${(props: AttachmentContainerProps) => `var(${props.failed ? '--border-destructive' : '--border-secondary'})`};
  border-radius: 8px;
  padding: 7px 20px;
  min-width: 200px;
  max-width: 250px;
  box-sizing: border-box;

  position: relative;
`;

const ButtonsContainer = styled.div`
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
`;

const WithLeftPadding = styled.div`
  padding-left: 24px;
`;

interface AttachmentsProps {
  attachments: (LocalAttachment | RemoteAttachment)[];
  attachmentsSize?: number;
  attachmentSizeExceeded?: boolean;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownloadAll?: () => void;
  isDownloadingAttachments?: boolean;
}

const Attachments: FC<AttachmentsProps> = ({
  attachments,
  attachmentsSize,
  attachmentSizeExceeded,
  onDelete,
  onDownload,
  onDownloadAll,
  isDownloadingAttachments = false
}) => {
  const filteredAttachments = attachments.filter((attachment) => !attachment.inline);

  if (attachments.length <= 0) return null;

  const numberOfPassedActions = (onDelete ? 1 : 0) + (onDownload ? 1 : 0);

  const attachmentsCount = filteredAttachments.reduce(
    (counts, attachment) => {
      if (isFailedAttachment(attachment)) {
        return { ...counts, error: counts.error + 1 };
      }
      if (isInProgress(attachment)) {
        return { ...counts, uploading: counts.uploading + 1 };
      }
      return { ...counts, success: counts.success + 1 };
    },
    { success: 0, error: 0, uploading: 0 }
  );

  return (
    <AttachmentsContainer>
      <TopBar>
        {filteredAttachments.length > 0 && (
          <Typography color='secondary' type='paragraph'>
            {filteredAttachments.length === 1
              ? '1 Attachment'
              : `${filteredAttachments.length} Attachments ${
                  attachmentsCount.error !== 0 || attachmentsCount.uploading !== 0
                    ? `(${attachmentsCount.uploading} Uploading, ${attachmentsCount.error} Failed)`
                    : ''
                }`}
          </Typography>
        )}
        {attachmentSizeExceeded && attachmentsSize && (
          <Typography color='destructive'>
            Exceeds the max size by {readableFileSize(attachmentsSize - MESSAGE_MAX_SIZE)}
          </Typography>
        )}
        {filteredAttachments.length > 0 && onDownloadAll && (
          <IconButton
            disabled={isDownloadingAttachments}
            icon={Icon.Download}
            onClick={onDownloadAll}
            tooltip={isDownloadingAttachments ? 'Downloading...' : 'Download all'}
          />
        )}
      </TopBar>
      <AttachmentsList>
        {filteredAttachments.map((attachment, index) => {
          // if in progress show percent -> 10 MB / 15 MB
          const uploadSize = isInProgress(attachment)
            ? `${readableFileSize(attachment.size * (attachment.progress / 100))} / ${readableFileSize(
                attachment.size
              )}`
            : readableFileSize(attachment.size);

          return (
            <AttachmentContainer
              buttonsWidth={35 * numberOfPassedActions}
              failed={isFailedAttachment(attachment)}
              key={index}
            >
              <IconText label={attachment.name} startIcon={getIconFromMIMEType(attachment.contentType)} />
              <WithLeftPadding>
                <Typography color='secondary' type='paragraph'>
                  {isFailedAttachment(attachment) ? attachment.error : `${uploadSize} ${attachment.contentType}`}
                </Typography>
              </WithLeftPadding>
              <ButtonsContainer>
                {isInProgress(attachment) ? (
                  <CustomCircularProgress progress={attachment.progress} />
                ) : (
                  <>
                    {onDownload && isRemoteAttachment(attachment) && (
                      <IconButton icon={Icon.Download} onClick={() => onDownload(attachment.id)} tooltip='Download' />
                    )}
                    {onDelete && (
                      <IconButton icon={Icon.Trash} onClick={() => onDelete(attachment.id)} tooltip='Remove' />
                    )}{' '}
                  </>
                )}
              </ButtonsContainer>
            </AttachmentContainer>
          );
        })}
      </AttachmentsList>
    </AttachmentsContainer>
  );
};

export default Attachments;
