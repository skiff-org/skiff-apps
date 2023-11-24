import { browserName, browserVersion, isAndroid, isIOS, osName } from 'react-device-detect';

import { isReactNativeDesktopApp, isWindowsDesktopApp } from './mobileUtils';

// get tokens for Zendesk upload
export async function getFeedbackTokens(supportingFiles: File[]) {
  const zendeskUploadTokens: Array<string> = [];
  const res = await Promise.allSettled(
    supportingFiles?.map(async (file) => {
      const resp = (await (
        await fetch(`https://skiff.zendesk.com/api/v2/uploads?filename=${file.name}`, {
          method: 'POST',
          body: file
        })
      ).json()) as { upload: { token: string } };
      if (resp?.upload?.token) {
        return resp.upload.token;
      }
      throw new Error('Failed to receive upload token from Zendesk');
    })
  );
  res.forEach((r) => {
    if (r.status === 'fulfilled') {
      zendeskUploadTokens.push(r.value);
    }
  });
  return zendeskUploadTokens;
}

export const getFeedbackPlatformString = () => {
  let description = '';
  // Check for desktop apps first.
  if (isWindowsDesktopApp()) {
    description = 'Windows desktop app';
  } else if (isReactNativeDesktopApp()) {
    description = 'Mac desktop app';
  } else {
    // iOS specifics
    if (isIOS) {
      description = `iOS mobile web browser - ${browserName} v${browserVersion}`;
    }
    // Android specifics
    else if (isAndroid) {
      description = `Android mobile web browser - ${browserName} v${browserVersion}`;
    } else {
      description = `Operating System: ${osName}; Browser: ${browserName} v${browserVersion}`;
    }
  }

  return description;
};
