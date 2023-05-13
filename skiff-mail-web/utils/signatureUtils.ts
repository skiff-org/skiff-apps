import DOMPurify from 'dompurify';

export const sanitizeSignature = (signature: string) => {
  const sanitized = DOMPurify.sanitize(
    `<p>${signature
      .split('\n')
      .map((line, i, arr) => `${line}${i < arr.length - 1 ? '<br>' : ''}`)
      .reduce((a, b) => a + b)}</p>`,
    {
      ALLOWED_TAGS: ['p', 'br', 'a', 'li', 'ol', 'ul', 'strong', 'em', 'u', 'img']
    }
  );
  return sanitized;
};
