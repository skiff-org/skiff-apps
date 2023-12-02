import { contentAsDataUrl, fileTypeMatcher, FileTypes } from 'skiff-front-utils';
import { NwContentType } from 'skiff-graphql';
import isURL from 'validator/lib/isURL';

import { ClientAttachment, hasContent } from '../components/Attachments';

export const getNwContentType = (mimeType: string): NwContentType =>
  fileTypeMatcher(mimeType, {
    [FileTypes.Pdf]: NwContentType.Pdf,
    [FileTypes.Unknown]: NwContentType.File
  });

const QUICKTIME_MIME = 'video/quicktime';
const MP4_MIME = 'video/mp4';

const toWorkingMIME = (type: string) => {
  switch (type) {
    case QUICKTIME_MIME:
      return MP4_MIME;
    default:
      return type;
  }
};

const getImageData = (attachment: ClientAttachment) => {
  if (!hasContent(attachment)) return '';
  if (isURL(attachment.content)) {
    return attachment.content;
  } else {
    return contentAsDataUrl(attachment.content, attachment.contentType);
  }
};

export const getPreviewDataByType = (attachment: ClientAttachment) => {
  if (!hasContent(attachment)) return '';

  const { content, contentType } = attachment;
  const dataUrl = contentAsDataUrl(content, toWorkingMIME(contentType));
  const data = fileTypeMatcher(attachment.contentType, {
    [FileTypes.Image]: getImageData(attachment),
    [FileTypes.Pdf]: dataUrl,
    [FileTypes.Video]: dataUrl,
    [FileTypes.Word]: dataUrl,
    [FileTypes.Unknown]: dataUrl
  });

  return data;
};
