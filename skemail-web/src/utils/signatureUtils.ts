import DOMPurify from 'dompurify';

export const sanitizeSignature = (signature: string, hideOnQuickAlias: boolean) => {
  if (hideOnQuickAlias) return ''; // prevent user signature leakage if sending from a Quick Alias
  // if signature starts with an html tag like <table> or <p> then don't put a paragraph in beginning
  const signatureStartsWithPOrTable = signature.startsWith('<p>') || signature.startsWith('<table>');
  const startTag = signatureStartsWithPOrTable ? '' : '<p>';
  const endTag = signatureStartsWithPOrTable ? '' : '</p>';
  const sanitized = DOMPurify.sanitize(
    `${startTag}${signature
      .split('\n')
      .map((line, i, arr) => `${line}${i < arr.length - 1 ? '<br>' : ''}`)
      .reduce((a, b) => a + b)}${endTag}`,
    {
      ALLOWED_TAGS: [
        'p',
        'br',
        'a',
        'li',
        'ol',
        'ul',
        'strong',
        'em',
        'u',
        'img',
        'mark',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'span',
        'caption',
        'col',
        'colgroup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'tr'
      ]
    }
  );
  return sanitized;
};
