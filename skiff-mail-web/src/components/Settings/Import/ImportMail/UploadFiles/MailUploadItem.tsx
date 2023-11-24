import {
  CircularProgress,
  Icon,
  Icons,
  IconText,
  Size,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Typography
} from 'nightwatch-ui';
import { useState } from 'react';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

import { UploadStatus } from './UploadFiles.constants';
import { FileUploadItem } from './UploadFiles.types';

const MailUploadItemContainer = styled.div<{ $destructive: boolean }>`
  display: flex;
  padding: 16px 12px;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  border: 1px solid ${({ $destructive }) => ($destructive ? 'var(--border-destructive)' : 'var(--border-tertiary)')};
  background: ${({ $destructive }) =>
    $destructive ? 'var(--bg-overlay-destructive)' : 'var(--bg-overlay-quaternary)'};
  box-sizing: border-box;
  width: 100%;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  border-radius: 4px;
  background: var(--bg-l3-solid);
  padding: 4px;
  box-sizing: border-box;
  box-shadow: var(--secondary-button-border);
`;

const FileName = styled(Typography)`
  flex: 1 0 0;
`;
interface MailUploadItemProps {
  uploadItem: FileUploadItem;
  removeUploadItem: (uploadItem: FileUploadItem) => void;
}

export const MailUploadItem: React.FC<MailUploadItemProps> = ({
  uploadItem,
  removeUploadItem
}: MailUploadItemProps) => {
  const { file, progress, status } = uploadItem;
  const { name: fileName, size: fileSize } = file;
  const [isHovering, setIsHovering] = useState(false);

  const getEndElement = () => {
    switch (status) {
      case UploadStatus.UPLOADING:
        return (
          <>
            <Typography color='secondary'>{(progress * 100).toFixed(0)}%</Typography>
            <CircularProgress progress={progress * 100} size={Size.SMALL} />
          </>
        );
      case UploadStatus.COMPLETE:
        return (
          <>
            {!isHovering && (
              <>
                <Typography color='secondary'>{bytesToHumanReadable(fileSize)}</Typography>
                <Icons color='green' icon={Icon.CheckCircle} />
              </>
            )}
            {isHovering && (
              <>
                <IconText onClick={() => removeUploadItem(uploadItem)} startIcon={Icon.Close} />
              </>
            )}
          </>
        );
      case UploadStatus.FAILED:
        return (
          // Opened on hover of the entire row to make it more likely the user sees the error
          // by increasing the area it will open on, and removing the delay
          <Tooltip open={isHovering}>
            <TooltipContent>Failed to upload</TooltipContent>
            <TooltipTrigger>
              <Icons color='destructive' icon={Icon.Warning} />
            </TooltipTrigger>
          </Tooltip>
        );
      default:
        return <CircularProgress size={Size.SMALL} spinner />;
    }
  };

  const uploadFailed = status === UploadStatus.FAILED;

  return (
    <MailUploadItemContainer
      $destructive={uploadFailed}
      onMouseLeave={() => setIsHovering(false)}
      onMouseOver={() => setIsHovering(true)}
    >
      <IconContainer>
        <Icons color={uploadFailed ? 'destructive' : 'secondary'} icon={Icon.Envelope} />
      </IconContainer>
      <FileName color={uploadFailed ? 'destructive' : 'primary'}>{fileName}</FileName>
      {getEndElement()}
    </MailUploadItemContainer>
  );
};
