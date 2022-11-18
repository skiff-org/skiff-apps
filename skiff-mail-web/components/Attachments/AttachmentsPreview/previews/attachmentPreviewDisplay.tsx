import { ProgressSizes } from 'nightwatch-ui';
import { isAndroid } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  getIconFromMIMEType,
  MIMETypes,
  FilePreviewDisplay,
  PreviewSize,
  isMobileApp,
  sendRNWebviewMsg,
  contentAsBase64
} from 'skiff-front-utils';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { getNwContentType, getPreviewDataByType } from '../../../../utils/attachmentsPreview';
import { ClientAttachment } from '../../types';
import { errorAttachment, hasContent, inProgress } from '../../typeUtils';

import { InnerContainer } from './Containers';

export interface PreviewProps {
  refetch: () => void;
  progressSize: ProgressSizes;
  tryToOpenProtectedPdf?: boolean;
}

const AttachmentPreviewDisplay = ({
  attachment,
  previewProps
}: {
  attachment: ClientAttachment;
  previewProps: PreviewProps;
}) => {
  const dispatch = useDispatch();
  if (hasContent(attachment)) {
    // open natively when on mobile app -- disabled on android ( works on Galaxy Note 10 fails on Pixel 2 )
    if (isMobileApp() && !isAndroid) {
      // Check if content type is known
      const knownType = Object.values(MIMETypes).find((val) => val.includes(attachment.contentType));
      // Inline attachments have file signature at start of content,
      // in-order to preview the content we need to remove this
      const base64Data = contentAsBase64(attachment.content);
      if (knownType) {
        sendRNWebviewMsg('previewFile', {
          type: attachment.contentType,
          filename: attachment.name,
          base64Data
        });
        dispatch(skemailModalReducer.actions.setOpenModal());
      }
    }
  }

  const contentTypeFromMimeType = getNwContentType(attachment.contentType);

  const Preview = (
    <FilePreviewDisplay
      error={errorAttachment(attachment) ? attachment.error : undefined}
      fileProps={{
        data: getPreviewDataByType(attachment),
        contentType: contentTypeFromMimeType,
        mimeType: attachment.contentType,
        fileName: attachment.name,
        tryToOpenProtectedPdf: previewProps.tryToOpenProtectedPdf
      }}
      placeholderIcon={getIconFromMIMEType(attachment.contentType)}
      progress={inProgress(attachment) ? attachment.progress : undefined}
      progressSize={previewProps.progressSize}
      refetch={previewProps.refetch}
      size={PreviewSize.Large}
    />
  );

  return <InnerContainer>{Preview}</InnerContainer>;
};

export default AttachmentPreviewDisplay;
