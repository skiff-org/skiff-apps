import dayjs from 'dayjs';
import saveAs from 'file-saver';

import { isReactNativeDesktopApp, isMobileApp, sendRNWebviewMsg } from '../mobileUtils';

/**
 * Generate the local storage key used to store the browser recovery share.
 * @param {string} username - The username corresponding to the recovery share.
 * @returns {string} The local storage key corresponding to the user's recovery share.
 */
export function browserShareLocalStorageKey(username: string): string {
  // Browser share stores lowercased username
  const lowercaseUsername = username.toLowerCase();
  return `recoveryBrowserShare:${lowercaseUsername}`;
}

/**
 * After a modification to userData, store the recoveryBrowserShare within this browser's localStorage.
 * @param {string} username - Username.
 */
export function storeBrowserShare(username: string, share: string): void {
  const localStorageKey = browserShareLocalStorageKey(username);
  if (share) {
    localStorage.setItem(localStorageKey, share);
  } else {
    localStorage.removeItem(localStorageKey);
  }
}

/**
 * Retrieve the recoveryBrowserShare from this browser's localStorage.
 * @param {string} username - The username to look up.
 * @returns {string} The recoveryBrowserShare for this username, or empty if this
 *    user does not have a browser share entry in localStorage.
 */
export function readBrowserShareFromUsername(username: string): string {
  const localStorageKey = browserShareLocalStorageKey(username);

  const keyOrNull = localStorage.getItem(localStorageKey);
  if (keyOrNull === null) {
    return '';
  }
  return keyOrNull;
}

/**
 * Get recovery key PDF name from username.
 * @param {string} username - The username used in the pdf name.
 * @returns string
 */
export const getRecoveryPDFNameFromUsername: (username: string) => string = (username: string): string =>
  `${username.length ? username : '<username>'}_skiff_recovery_key.pdf`;

interface PDFOverlayText {
  /** overlay text string */
  text: string;
  /** x offset (inches) */
  x: number;
  /** font size (px) */
  fontSize: number;
  /** max width of text before line-break (inches) */
  maxLen: number;
}

/**
 * Exports keycode-containing PDF given the component's ID and a export filename. The overlay text
 * is rendered between 2 images generated from an HTML template, so it is selectable/copyable.
 * @param {string} filename - filename for the exported PDF file
 * @param {PDFOverlayText} overlayText - overlay text with position and sizing
 */
export async function exportRecoveryKeyToClient(
  title: string,
  keyName: string,
  skiffMailAddress: string | undefined,
  recoveryEmail: string | null | undefined,
  filename: string,
  overlayText: PDFOverlayText
) {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  // Set options
  const opt = {
    filename,
    margin: [1, 1, 1, 1],
    itemBottomMargin: 0.2,
    image: { type: 'jpeg' }
  };

  const pdf = new jsPDF({
    unit: 'in',
    format: 'letter',
    orientation: 'portrait'
  });

  // Note: Page size is in inches

  // acquire all measurements
  const pageSize = {
    width: pdf.internal.pageSize.getWidth() - opt.margin[1] - opt.margin[3],
    height: pdf.internal.pageSize.getHeight() - opt.margin[0] - opt.margin[2],
    ratio: 1
  };
  pageSize.ratio = pageSize.height / pageSize.width;
  let drawY = opt.margin[0];
  const { text, x, fontSize, maxLen } = overlayText;
  const font = await import('./skiffSans');
  const skiffSans = font.skiffSans;
  const fontMedium = await import('./skiffSansMedium');
  const skiffSansMedium = fontMedium.skiffSansMedium;
  // add the font to jsPDF
  pdf.addFileToVFS('Universal-Sans-Text-380.ttf', skiffSans);
  pdf.addFont('Universal-Sans-Text-380.ttf', 'Universal-Sans-Text-380', 'normal');
  pdf.addFileToVFS('Universal-Sans-Text-560.ttf', skiffSansMedium);
  pdf.addFont('Universal-Sans-Text-560.ttf', 'Universal-Sans-Text-560', 'normal');

  const newSplitText: string = pdf.splitTextToSize(text, maxLen) as string; // max width (inches)
  const overlayTextDimensions = pdf.getTextDimensions(newSplitText);

  pdf.setFont('Universal-Sans-Text-560');
  pdf.setFontSize(19);
  pdf.setTextColor('#000000');
  pdf.text(title, x, drawY);
  drawY += pageSize.height * 0.03;
  pdf.setFontSize(15);
  pdf.setFont('Universal-Sans-Text-380');
  pdf.setTextColor(110, 110, 110);
  pdf.text(`Created ${dayjs().format('MMM D, YYYY')} – Store in a secure place`, x, drawY);
  drawY += pageSize.height * 0.06;

  if (skiffMailAddress) {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('FORGOT PASSWORD?', x, drawY);
    pdf.setFontSize(13);
    pdf.setTextColor(139, 139, 139);
    pdf.setFont('Universal-Sans-Text-380');
    drawY += overlayTextDimensions.h / 4;
    pdf.text('1. Visit ', x, drawY);
    pdf.setTextColor(239, 90, 60);
    pdf.text('https://app.skiff.com', x + pdf.getTextWidth('1. visit '), drawY);
    pdf.setTextColor(139, 139, 139);
    drawY += overlayTextDimensions.h / 4;
    pdf.text('2. Click ', x, drawY);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.setTextColor(131, 131, 131);
    pdf.text('"Forgot password" ', x + pdf.getTextWidth('2. click '), drawY);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setTextColor(139, 139, 139);
    pdf.text('beneath the log in button', x + pdf.getTextWidth('2. click "Forgot password"   '), drawY);
    drawY += overlayTextDimensions.h / 4;
    pdf.text(`3. Enter your Skiff Mail address`, x, drawY);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.setTextColor(131, 131, 131);
    pdf.text(`"${skiffMailAddress}"`, x + pdf.getTextWidth('3. enter your Skiff Mail address'), drawY);
    pdf.setTextColor(139, 139, 139);
    pdf.setFont('Universal-Sans-Text-380');
    drawY += overlayTextDimensions.h / 4;
    pdf.text('4. Enter the', x, drawY);
    pdf.setTextColor(228, 90, 84);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('secret key ', x + pdf.getTextWidth('4. enter the '), drawY);
    pdf.setTextColor(139, 139, 139);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.text('at the bottom of this PDF', x + pdf.getTextWidth('4. enter the secret key   '), drawY);

    drawY += pageSize.height * 0.06;
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('ACCOUNT INFO', x, drawY);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setFontSize(15);
    pdf.setTextColor(139, 139, 139);
    drawY += pageSize.height * 0.06;
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setDrawColor(245, 245, 245);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(
      x,
      drawY - opt.itemBottomMargin,
      overlayTextDimensions.w,
      overlayTextDimensions.h + pageSize.height * 0.03,
      0.05,
      0.05,
      'FD'
    ); //Fill and Border

    pdf.setDrawColor(255, 255, 255);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(
      x + pageSize.width * 0.02,
      drawY - opt.itemBottomMargin + pageSize.height * 0.02,
      overlayTextDimensions.w - pageSize.width * 0.05,
      overlayTextDimensions.h / 4,
      0.02,
      0.02,
      'FD'
    ); //Fill and Border

    pdf.roundedRect(
      x + pageSize.width * 0.02,
      drawY - opt.itemBottomMargin + pageSize.height * 0.06 + overlayTextDimensions.h / 4,
      overlayTextDimensions.w - pageSize.width * 0.05,
      overlayTextDimensions.h / 4,
      0.02,
      0.02,
      'FD'
    ); //Fill and Border

    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('SKIFF MAIL ADDRESS', x + pageSize.width * 0.03, drawY + pageSize.height * 0.017);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.text(skiffMailAddress, x + pageSize.width * 0.3, drawY + pageSize.height * 0.017);

    pdf.setFontSize(11);
    pdf.setTextColor(139, 139, 139);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text(
      'RECOVERY ADDRESS',
      x + pageSize.width * 0.03,
      drawY + pageSize.height * 0.017 + overlayTextDimensions.h / 4 + pageSize.height * 0.04
    );
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.text(
      recoveryEmail || 'Not set',
      x + pageSize.width * 0.3,
      drawY + pageSize.height * 0.017 + overlayTextDimensions.h / 4 + pageSize.height * 0.04
    );

    drawY += overlayTextDimensions.h + opt.itemBottomMargin + pageSize.height * 0.03;

    drawY += pageSize.height * 0.04;
    pdf.setFontSize(fontSize);
    pdf.setTextColor(215, 40, 40);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text(keyName.toUpperCase(), x, drawY);
    drawY += pageSize.height * 0.06;
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setDrawColor(255, 228, 228);
    pdf.setFillColor(255, 228, 228);
    pdf.roundedRect(
      x,
      drawY - opt.itemBottomMargin,
      overlayTextDimensions.w,
      overlayTextDimensions.h,
      0.05,
      0.05,
      'FD'
    ); //Fill and Border

    // --> key code
    pdf.setFontSize(13);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.text(newSplitText, x + pageSize.width * 0.03, drawY + pageSize.height * 0.005);
    drawY += overlayTextDimensions.h + opt.itemBottomMargin + pageSize.height * 0.03;

    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('NEED HELP?', x, drawY);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setFontSize(15);
    pdf.setTextColor(139, 139, 139);
    drawY += pageSize.height * 0.03;
    pdf.text('Contact support@skiff.org', x, drawY);
  } else {
    // MFA backup case
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text(keyName.toUpperCase(), x, drawY);
    drawY += pageSize.height * 0.06;
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setDrawColor(245, 245, 245);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(x, drawY - opt.itemBottomMargin, pageSize.width, pageSize.height / 12, 0.05, 0.05, 'FD'); //Fill and Border

    // --> key code
    pdf.setFontSize(13);
    pdf.setLineHeightFactor(2.0);
    pdf.setFont('DiatypeMono-Regular');
    pdf.text(newSplitText, x + pageSize.width * 0.01, drawY + pageSize.height * 0.005);
    drawY += overlayTextDimensions.h + opt.itemBottomMargin + pageSize.height * 0.03;

    drawY += pageSize.height * 0.04;
    pdf.setLineHeightFactor(1.0);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('Universal-Sans-Text-560');
    pdf.text('NEED HELP?', x, drawY);
    pdf.setFont('Universal-Sans-Text-380');
    pdf.setFontSize(15);
    pdf.setTextColor(139, 139, 139);
    drawY += pageSize.height * 0.03;
    pdf.text('Contact support@skiff.org', x, drawY);
  }

  // render pdf & download
  const arraybuffer = pdf.output('arraybuffer');
  const blob = new Blob([arraybuffer], { type: 'application/octet-stream' });

  if (isMobileApp() || isReactNativeDesktopApp()) {
    const reader = new FileReader();
    reader.readAsBinaryString(blob);
    const base64Data = await new Promise((res) => {
      reader.onloadend = () => {
        res(reader.result);
      };
    });

    // On mobile app save file with RN
    sendRNWebviewMsg('saveFile', {
      base64Data,
      type: blob.type,
      filename,
      encoding: 'ascii'
    });
  } else {
    saveAs(blob, filename);
  }
  return false;
}
