import { Icon } from '@skiff-org/skiff-ui';

const isFile = (file: File | null): file is File => file !== null;

export const convertFileListToArray = (files: FileList): File[] =>
  [...Array(files.length).keys()].map((index) => files.item(index)).filter(isFile);

interface ReadResolveValue {
  file: File;
  content?: string;
}

interface ReadRejectValue {
  file: File;
  error: any;
}

export const readFile = (file: File, progress?: (event: ProgressEvent<FileReader>) => void) =>
  new Promise((resolve: (value: ReadResolveValue) => void, reject: (value: ReadRejectValue) => void) => {
    const reader = new FileReader();

    reader.addEventListener('progress', (event) => {
      progress?.(event);
    });

    reader.addEventListener('load', () => {
      const result = reader.result as ArrayBuffer;
      const resultStr = Buffer.from(result).toString('base64');
      resolve({ content: resultStr, file });
    });

    reader.addEventListener('error', (error) => {
      reject({ file, error });
    });

    reader.addEventListener('abort', (error) => {
      reject({ file, error });
    });

    reader.readAsArrayBuffer(file);
  });

const BIT_SIZES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const K_BIT_FACTOR = 1024;

export const readableFileSize = (size: number, decimalPrecision = 1): string =>
  ((sizesArray) => `${sizesArray.pop()} ${BIT_SIZES[sizesArray.length]}`)(
    [...Array(BIT_SIZES.length).keys()]
      .map(
        (factor) =>
          Math.round((size / Math.pow(K_BIT_FACTOR, factor)) * Math.pow(10, decimalPrecision)) /
          Math.pow(10, decimalPrecision)
      )
      .filter((num) => num !== 0)
  );

export const IMAGE_MIME_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
];

export function getIconFromMIMEType(type: string): Icon {
  switch (type) {
    // case 'application/octet-stream':
    // case 'application/x-bzip':
    // case 'application/x-bzip2':
    // case 'application/gzip':
    // case 'application/java-archive':
    // case 'application/vnd.apple.installer+xml':
    // case 'application/ogg':
    // case 'application/vnd.rar':
    // case 'application/x-tar':
    // case 'application/vnd.visio':
    // case 'application/zip':
    // case 'application/x-7z-compressed':
    // case 'application/x-apple-diskimage':
    // case 'application/x-msdownload':
    //   return Icon.Zip;
    case 'image/svg+xml':
    case 'image/vnd.microsoft.icon':
      return Icon.Smile;
    case 'application/vnd.amazon.ebook':
    case 'application/epub+zip':
      return Icon.Book;
    // case 'video/x-msvideo':
    // case 'video/mp4':
    // case 'video/mpeg':
    // case 'video/ogg':
    // case 'video/mp2t':
    // case 'video/webm':
    // case 'video/3gpp':
    // case 'video/3gpp2':
    // case 'video/quicktime':
    //   return Icon.Video;
    case 'application/rtf':
    case 'te':
      return Icon.File;
    case 'audio/aac':
    case 'application/x-cdf':
    case 'audio/midi':
    case 'audio/x-midi':
    case 'audio/mpeg':
    case 'audio/ogg':
    case 'audio/opus':
    case 'audio/wav':
    case 'audio/webm':
    case 'audio/3gpp':
    case 'audio/3gpp2':
      return Icon.Sound;
    case 'application/x-csh':
    case 'text/css':
    case 'text/html':
    case 'text/javascript':
    case 'application/json':
    case 'application/ld+json':
    case 'text/javascript':
    case 'application/x-sh':
    case 'application/x-shockwave-flash':
    case 'application/xhtml+xml':
    case 'application/xml':
    case 'text/xml':
    case 'application/vnd.mozilla.xul+xml':
      return Icon.CodeBlock;
    case 'text/csv':
    case 'application/vnd.oasis.opendocument.spreadsheet':
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return Icon.Table;
    case 'application/msword':
    // case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    //   return Icon.Word;
    case 'application/vnd.ms-fontobject':
    case 'font/otf':
    case 'font/ttf':
    case 'font/woff':
    case 'font/woff2':
      return Icon.Text;
    case 'text/calendar':
      return Icon.Calendar;
    case 'application/vnd.oasis.opendocument.presentation':
      return Icon.PresentPlay;
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return Icon.PieChart;
    case 'application/pdf':
      return Icon.Pdf;
    // case 'text/markdown':
    // case 'text/x-markdown':
    //   return Icon.Markdown;
    default:
      return Icon.File;
  }
}
