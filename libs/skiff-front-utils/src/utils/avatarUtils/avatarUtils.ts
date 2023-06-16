import axios from 'axios';
import Resizer from 'react-image-file-resizer';

import {
  PROFILE_PICTURE_MAX_HEIGHT,
  PROFILE_PICTURE_MAX_WIDTH,
  PROFILE_PICTURE_MIN_HEIGHT,
  PROFILE_PICTURE_MIN_WIDTH
} from './avatarUtils.constants';

export const uploadFileToS3 = async (writeUrl: string, uploadedFile: File) => {
  const config = {
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-amz-acl': 'public-read',
      'Cache-Control': 'max-age=365000000,immutable'
    }
  };
  // upload file to s3
  const resizeFile = (file: File) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        PROFILE_PICTURE_MAX_WIDTH,
        PROFILE_PICTURE_MAX_HEIGHT,
        'WEBP',
        PROFILE_PICTURE_MIN_WIDTH,
        PROFILE_PICTURE_MIN_HEIGHT,
        (uri) => {
          resolve(uri);
        },
        'blob'
      );
    });
  const image = await resizeFile(uploadedFile);
  const uploadResponse = await axios.put(writeUrl, image, config);
  if (uploadResponse.status !== 200) {
    throw new Error('Upload failed');
  }
};
