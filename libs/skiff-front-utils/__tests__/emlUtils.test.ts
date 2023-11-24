import { getUnsubscribeLinks } from '../src';

export const generateEML = (listUnsubscribeHeader?: string, html?: string) => `MIME-Version: 1.0
From: sender@skiff.com
To: recipient@skiff.com
Subject: Test Email with Unsubscribe Header
${listUnsubscribeHeader ? `List-Unsubscribe: <${listUnsubscribeHeader}>` : ''}

${html ? html : ''}`;

describe('getUnsubscribeLinks', () => {
  it('parses out mailto unsubscribe info from the EML headers', () => {
    const listUnsubscribeHeaderValue = 'mailto:unsubscribe@example.com?subject=Unsubscribe%20Me';
    const rawMimeContent = generateEML(listUnsubscribeHeaderValue);
    const result = getUnsubscribeLinks(rawMimeContent, undefined);
    expect(result).toEqual({
      mailto: {
        address: 'unsubscribe@example.com',
        subject: 'Unsubscribe Me'
      },
      httpLink: undefined
    });
  });

  it('parses out redirect link unsubscribe info from the EML headers', () => {
    const listUnsubscribeHeaderValue = 'https://www.unsubscribeLink.com';
    const rawMimeContent = generateEML(listUnsubscribeHeaderValue);
    const result = getUnsubscribeLinks(rawMimeContent, undefined);
    expect(result).toEqual({
      mailto: undefined,
      httpLink: listUnsubscribeHeaderValue
    });
  });

  it('parses out redirect link unsubscribe info from the anchor tag', () => {
    const redirectLink = 'https://www.link.com';
    const html = `<p>This is a test email. <a href='${redirectLink}'>Unsubscribe</a></p>`;
    const rawMimeContent = generateEML(undefined, html);
    const result = getUnsubscribeLinks(rawMimeContent, html);
    expect(result).toEqual({
      mailto: undefined,
      httpLink: redirectLink
    });
  });

  it('parses out redirect link from anchor tag with href containing "unsubscribe"', () => {
    const redirectLink = 'https://www.link.com/unsubscribe';
    const html = `<p>This is a test email. Click <a href='${redirectLink}'>here</a> to manage notifications</p>`;
    const rawMimeContent = generateEML(undefined, html);
    const result = getUnsubscribeLinks(rawMimeContent, html);
    expect(result).toEqual({
      mailto: undefined,
      httpLink: redirectLink
    });
  });

  it('parses out redirect link from nearest anchor tag', () => {
    const redirectLink = 'https://www.link.com';
    const html = `<p>This is a test email. To unsubscribe, click here [<a href='${redirectLink}'>here</a>].</p>`;
    const rawMimeContent = generateEML(undefined, html);
    const result = getUnsubscribeLinks(rawMimeContent, html);
    expect(result).toEqual({
      mailto: undefined,
      httpLink: redirectLink
    });
  });
});
