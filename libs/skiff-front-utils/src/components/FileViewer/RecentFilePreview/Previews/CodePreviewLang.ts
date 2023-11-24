export enum CodeBlockLanguages {
  javascript = 'javascript',
  typescript = 'typescript',
  python = 'python',
  cpp = 'cpp',
  java = 'java',
  css = 'css',
  html = 'markup',
  json = 'json',
  bash = 'bash',
  sql = 'sql',
  go = 'go',
  ruby = 'ruby',
  php = 'php',
  swift = 'swift',
  kotlin = 'kotlin',
  rust = 'rust',
  csharp = 'csharp',
  scala = 'scala',
  perl = 'perl',
  objectivec = 'objectivec',
  lua = 'lua',
  r = 'r',
  matlab = 'matlab',
  powershell = 'powershell',
  dart = 'dart'
}

export const mimeTypeToLanguageMap = {
  // For JavaScript
  'application/javascript': CodeBlockLanguages.javascript,
  'text/javascript': CodeBlockLanguages.javascript,

  // For TypeScript
  'application/typescript': CodeBlockLanguages.typescript,
  'text/typescript': CodeBlockLanguages.typescript,
  'video/mp2t': CodeBlockLanguages.typescript,

  // For Python
  'text/x-python': CodeBlockLanguages.python,
  'text/x-python-script': CodeBlockLanguages.python,
  'application/x-python': CodeBlockLanguages.python,

  // For Java
  'text/x-java-source': CodeBlockLanguages.java,
  'text/x-java': CodeBlockLanguages.java,
  'application/java': CodeBlockLanguages.java,
  'application/x-java-class': CodeBlockLanguages.java,
  'application/x-java-vm': CodeBlockLanguages.java,
  'application/x-java-archive': CodeBlockLanguages.java,
  'application/x-jar': CodeBlockLanguages.java,

  // For Ruby
  'text/x-ruby': CodeBlockLanguages.ruby,
  'application/x-ruby': CodeBlockLanguages.ruby,

  // For PHP
  'text/x-php': CodeBlockLanguages.php,
  'application/x-httpd-php': CodeBlockLanguages.php,

  // For C++
  'text/x-c': CodeBlockLanguages.cpp,
  'text/x-c++src': CodeBlockLanguages.cpp,
  'text/x-c++hdr': CodeBlockLanguages.cpp,

  // For C#
  'text/x-csharp': CodeBlockLanguages.csharp,

  // For Go
  'text/x-go': CodeBlockLanguages.go,

  // For Swift
  'text/x-swift': CodeBlockLanguages.swift,

  // For Kotlin
  'text/x-kotlin': CodeBlockLanguages.kotlin,

  // For Rust
  'text/rust': CodeBlockLanguages.rust,
  'application/rust': CodeBlockLanguages.rust,

  // For Lua
  'text/x-lua': CodeBlockLanguages.lua,

  // For Perl
  'text/x-perl': CodeBlockLanguages.perl,
  'application/x-perl': CodeBlockLanguages.perl,

  // For Scala
  'text/x-scala': CodeBlockLanguages.scala,

  // For Bash
  'text/x-shellscript': CodeBlockLanguages.bash,

  // For Powershell
  'text/x-powershell': CodeBlockLanguages.powershell,

  // For Css
  'text/css': CodeBlockLanguages.css,

  'text/html': CodeBlockLanguages.html,
  'application/json': CodeBlockLanguages.json,
  'application/x-bash': CodeBlockLanguages.bash,
  'application/sql': CodeBlockLanguages.sql,
  'text/x-rust': CodeBlockLanguages.rust,
  'text/x-objectivec': CodeBlockLanguages.objectivec,
  'text/x-rsrc': CodeBlockLanguages.r,
  'text/matlab': CodeBlockLanguages.matlab,
  'application/x-powershell': CodeBlockLanguages.powershell,
  'application/dart': CodeBlockLanguages.dart
};

export function getLanguageFromMimeType(mimeType: string): CodeBlockLanguages | null {
  return mimeTypeToLanguageMap[mimeType as keyof typeof mimeTypeToLanguageMap] || null;
}
