import { Icon as NWIcon } from 'nightwatch-ui';
import { bytesToHumanReadable } from 'skiff-utils';

import { VIDEO_UNSUPPORTED_FORMATS } from '../components/FileViewer/RecentFilePreview/Previews/VideoPreview';

export const IMAGE_MIME_TYPES = ['image/gif', 'image/jpeg', 'image/png'];

export enum FileTypes {
  Image = 'Image',
  Zip = 'Zip',
  Ebook = 'Ebook',
  Video = 'Video',
  Icon = 'Svg',
  Sound = 'Sound',
  Code = 'Code',
  Sheet = 'Sheet',
  Word = 'Word',
  Text = 'Text',
  Calendar = 'Calendar',
  PresentPlay = 'Presentation',
  Chart = 'Chart',
  Pdf = 'Pdf',
  MarkDown = 'Markdown',
  PostScript = 'PostScript',
  Unknown = 'Unknown'
}

const isValidFileType = (fileType: string): fileType is FileTypes =>
  Object.values(FileTypes).includes(fileType as FileTypes);

export type FileTypesMap<S> = { [T in FileTypes]: S };

export const MIMETypes: FileTypesMap<string[]> = {
  [FileTypes.Image]: [
    'image/apng',
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/webp'
  ],
  [FileTypes.Zip]: [
    'application/octet-stream',
    'application/x-bzip',
    'application/x-bzip2',
    'application/gzip',
    'application/java-archive',
    'application/vnd.apple.installer+xml',
    'application/ogg',
    'application/vnd.rar',
    'application/x-tar',
    'application/vnd.visio',
    'application/zip',
    'application/x-7z-compressed',
    'application/x-apple-diskimage',
    'application/x-msdownload'
  ],
  [FileTypes.Icon]: ['image/svg+xml', 'image/vnd.microsoft.icon'],
  [FileTypes.Ebook]: ['application/vnd.amazon.ebook', 'application/epub+zip'],
  [FileTypes.Video]: [
    'video/x-msvideo',
    'video/mp4',
    'video/x-m4v',
    'video/mpeg',
    'video/ogg',
    'video/mp2t',
    'video/webm',
    'video/3gpp',
    'video/3gpp2',
    'video/quicktime'
  ],
  [FileTypes.Sound]: [
    'audio/aac',
    'application/x-cdf',
    'audio/midi',
    'audio/x-midi',
    'audio/mpeg',
    'audio/ogg',
    'audio/opus',
    'audio/wav',
    'audio/webm',
    'audio/3gpp',
    'audio/3gpp2'
  ],
  [FileTypes.Code]: [
    'application/x-csh',
    'text/css',
    'text/html',
    'text/javascript',
    'application/json',
    'application/ld+json',
    'text/javascript',
    'application/x-sh',
    'application/x-shockwave-flash',
    'application/xhtml+xml',
    'application/xml',
    'text/xml',
    'application/vnd.mozilla.xul+xml'
  ],
  [FileTypes.Sheet]: [
    'text/csv',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  [FileTypes.Word]: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  [FileTypes.Text]: ['application/vnd.ms-fontobject', 'font/otf', 'font/ttf', 'font/woff', 'font/woff2'],
  [FileTypes.Calendar]: ['text/calendar'],
  [FileTypes.PresentPlay]: ['application/vnd.oasis.opendocument.presentation'],
  [FileTypes.Chart]: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  [FileTypes.Pdf]: ['application/pdf'],
  [FileTypes.MarkDown]: ['text/markdown', 'text/x-markdown'],
  [FileTypes.PostScript]: ['application/postscript'],
  [FileTypes.Unknown]: []
};

export const getFileTypeFromMimeType = (mimeType: string): FileTypes => {
  const [type] = Object.entries(MIMETypes).find(([_, mimeStrings]) => mimeStrings.includes(mimeType)) ?? [
    FileTypes.Unknown
  ];

  if (!isValidFileType(type)) return FileTypes.Unknown;

  return type;
};

export const fileTypeMatcher = <T>(
  mimeTypeString: string,
  map: Partial<FileTypesMap<T>> & { [FileTypes.Unknown]: T }
): T => {
  const fileType = getFileTypeFromMimeType(mimeTypeString);

  if (VIDEO_UNSUPPORTED_FORMATS.includes(mimeTypeString)) {
    return map[FileTypes.Unknown];
  }

  return map[fileType] || map[FileTypes.Unknown];
};

export const getIconFromMIMEType = (type: string): NWIcon =>
  fileTypeMatcher(type, {
    [FileTypes.Image]: NWIcon.Image,
    [FileTypes.Zip]: NWIcon.Zip,
    [FileTypes.Icon]: NWIcon.Smile,
    [FileTypes.Ebook]: NWIcon.Book,
    [FileTypes.Video]: NWIcon.Video,
    [FileTypes.Sound]: NWIcon.Sound,
    [FileTypes.Code]: NWIcon.CodeBlock,
    [FileTypes.Sheet]: NWIcon.Table,
    [FileTypes.Word]: NWIcon.Word,
    [FileTypes.Text]: NWIcon.Text,
    [FileTypes.Calendar]: NWIcon.Calendar,
    [FileTypes.PresentPlay]: NWIcon.PresentPlay,
    [FileTypes.Chart]: NWIcon.PieChart,
    [FileTypes.Pdf]: NWIcon.Pdf,
    [FileTypes.MarkDown]: NWIcon.Markdown,
    [FileTypes.Unknown]: NWIcon.File
  });

/**
 * Used to render helper text for UI that need to show what file extensions are accepted.
 */
export const fileMimeTypesAndExtensionsReverseLookup: Record<string, string[] | undefined> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['DOCX'],
  'text/markdown': ['MD'],
  'text/plain': ['txt', 'MD', 'pem'],
  'text/html': ['html'],
  'text/css': ['css'],
  'text/csv': ['csv'],
  'text/xml': ['xml'],
  'image/gif': ['gif'],
  'image/jpeg': ['jpeg', 'jpg'],
  'image/jpg': ['jpg', 'jpeg'],
  'application/x-javascript': ['js'],
  'application/atom+xml': ['atom'],
  'application/rss+xml': ['rss'],
  'text/mathml': ['mml'],
  'text/vnd.sun.j2me.app-descriptor': ['jad'],
  'text/vnd.wap.wml': ['wml'],
  'text/x-component': ['htc'],
  'image/png': ['png'],
  'image/tiff': ['tiff', 'tif'],
  'image/vnd.wap.wbmp': ['wbmp'],
  'image/x-icon': ['ico'],
  'image/x-jng': ['jng'],
  'image/x-ms-bmp': ['bmp'],
  'image/heif': ['heic'],
  'image/svg+xml': ['svg'],
  'image/webp': ['webp'],
  'application/java-archive': ['jar'],
  'application/mac-binhex40': ['hqx'],
  'application/msword': ['doc'],
  'application/pdf': ['pdf'],
  'application/pgp-signature': ['gpg'],
  'application/postscript': ['ps', 'ai', 'eps'],
  'application/rtf': ['rtf'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.ms-powerpoint': ['ppt', 'pptx'],
  'application/vnd.wap.wmlc': ['wmlc'],
  'application/vnd.google-earth.kml+xml': ['kml'],
  'application/vnd.google-earth.kmz': ['kmz'],
  'application/vnd.google-apps.spreadsheet': ['sheet'],
  'application/vnd.google-apps.form': ['form'],
  'application/vnd.google-apps.document': ['doc'],
  'application/vnd.google-apps.presentation': ['slide'],
  'application/x-iwork-keynote-sffkey': ['key'],
  'application/vnd.google-apps.drawing': ['draw'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['ppt', 'pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/x-7z-compressed': ['7z'],
  'application/x-cocoa': ['cco'],
  'application/x-java-archive-diff': ['jardiff'],
  'application/x-java-jnlp-file': ['jnlp'],
  'application/x-makeself': ['run'],
  'application/x-pem-file': ['pem'],
  'application/x-perl': ['pl', 'pm'],
  'application/x-pilot': ['prc'],
  'application/x-rar-compressed': ['rar'],
  'application/x-redhat-package-manager': ['rpm'],
  'application/x-sea': ['sea'],
  'application/x-shockwave-flash': ['swf'],
  'application/x-stuffit': ['sit'],
  'application/x-tcl': ['tcl'],
  'application/x-x509-ca-cert': ['der', 'pem'],
  'application/x-xpinstall': ['xpi'],
  'application/xhtml+xml': ['xhtml'],
  'application/zip': ['zip'],
  'audio/midi': ['mid'],
  'audio/mpeg': ['mp3'],
  'audio/ogg': ['ogg'],
  'audio/x-realaudio': ['ra'],
  'video/3gpp': ['3gpp'],
  'video/mpeg': ['mpeg'],
  'video/quicktime': ['mov'],
  'video/x-flv': ['flv'],
  'video/x-mng': ['mng'],
  'video/x-ms-asf': ['asx'],
  'video/x-ms-wmv': ['wmv'],
  'video/x-msvideo': ['avi'],
  'video/x-m4v': ['m4v'],
  'video/mp4': ['mp4', 'm4v']
};

/**
 * Converts a data URL into a File
 * @param {string} dataURL - string in form data:<mime-type>,<data> type
 * @returns resulting File object
 */
export const dataURLtoFile = (dataURL: string) => {
  const [prefix, encodedData] = dataURL.split(',');
  const mimeType = prefix.match(/:(.*?);/)?.[1];
  const decodedData = window.atob(encodedData);
  const u8arr = new Uint8Array(decodedData.length);
  let n = decodedData.length;
  while (n--) {
    u8arr[n] = decodedData.charCodeAt(n);
  }
  return new File([u8arr], '', { type: mimeType });
};

const isFile = (file: File | null): file is File => file !== null;

export const convertFileListToArray = (files: FileList): File[] =>
  [...Array(files.length).keys()].map((index) => files.item(index)).filter(isFile);

export const formatTypeSize = (fileType: string, fileSize?: number) =>
  `${(fileMimeTypesAndExtensionsReverseLookup[fileType]?.[0] || 'File').toUpperCase()}${
    fileSize ? ` / ${bytesToHumanReadable(fileSize)}` : ''
  }`;
