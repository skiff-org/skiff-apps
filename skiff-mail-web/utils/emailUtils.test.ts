import { parseEmailAddressesFromString } from './emailUtils';

jest.mock('email-regex', () => jest.fn());

describe('parseEmailAddressesFromString', () => {
  test('should return undefined when the input is an empty string', () => {
    const result = parseEmailAddressesFromString('');
    expect(result).toEqual([]);
  });

  test('should return undefined when the input does not contain any email addresses', () => {
    const result = parseEmailAddressesFromString('no email addresses');
    expect(result).toEqual([]);
  });

  test('should parse a single email address', () => {
    const input = 'test@skiff.com';
    const result = parseEmailAddressesFromString(input);
    expect(result).toEqual([input]);
  });

  test('should parse multiple email addresses separated by commas and whitespace', () => {
    const email1 = 'john@skiff.com';
    const email2 = 'jane@skiff.com';
    const email3 = 'jdoe@skiff.com';
    const input = `${email1}, ${email2} ${email3}`;
    const result = parseEmailAddressesFromString(input);
    expect(result).toEqual([email1, email2, email3]);
  });

  test('parses email with non word characters', () => {
    const input = 'test+email=skiff.com@test.skiff.com';
    const result = parseEmailAddressesFromString(input);
    expect(result).toEqual([input]);
  });

  test('parses email with hyphens in the email domain', () => {
    const input1 = 'test@skiff.email-company.com';
    const result1 = parseEmailAddressesFromString(input1);
    expect(result1).toEqual([input1]);

    const input2 = 'test@skiff.subdomains.email-company.com';
    const result2 = parseEmailAddressesFromString(input2);
    expect(result2).toEqual([input2]);
  });

  test('parses email with non word characters', () => {
    const email = 'test@skiff.com';
    const input = `Test User <${email}>`;
    const result = parseEmailAddressesFromString(input);
    expect(result).toEqual([email]);
  });
});
