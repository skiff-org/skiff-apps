export const ALIAS_MINIMUM_LENGTH = 6;
export const ALIAS_MAXIMUM_LENGTH = 30;

// Banned MIME content types are derived from banned file types that belong to the same class of content and possible scripting files
// application/octet-stream is the default to include binaries that do not fall into other content types
export const BANNED_CONTENT_TYPES = new Set<string>([
  'application/x-msdownload',
  // 'application/octet-stream', TODO: condition on PGP
  'audio/adpcm',
  'application/vnd.android.package-archive',
  'application/vnd.ms-cab-compressed',
  'application/vnd.ms-htmlhelp',
  'application/java-archive',
  'application/x-java-jnlp-file',
  'text/javascript'
]);

// Banned file types are derived from https://support.google.com/mail/answer/6590?hl=en#zippy=%2Cmessages-that-have-attachments
export const BANNED_FILE_EXTENSIONS = new Set<string>([
  '.ade',
  '.adp',
  '.apk',
  '.appx',
  '.appxbundle',
  '.bat',
  '.cab',
  '.chm',
  '.cmd',
  '.com',
  '.cpl',
  '.diagcab',
  '.diagcfg',
  '.diagpack',
  '.dll',
  '.dmg',
  '.ex',
  '.ex_',
  '.exe',
  '.hta',
  '.img',
  '.ins',
  '.iso',
  '.isp',
  '.jar',
  '.jnlp',
  '.js',
  '.jse',
  '.lib',
  '.lnk',
  '.mde',
  '.msc',
  '.msi',
  '.msix',
  '.msixbundle',
  '.msp',
  '.mst',
  '.nsh',
  '.pif',
  '.ps1',
  '.scr',
  '.sct',
  '.shb',
  '.sys',
  '.vb',
  '.vbe',
  '.vbs',
  '.vhd',
  '.vxd',
  '.wsc',
  '.wsf',
  '.wsh',
  '.xll'
]);
