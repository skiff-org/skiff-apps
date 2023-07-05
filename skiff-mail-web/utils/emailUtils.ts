import emailRegex from 'email-regex';
import isEmail from 'validator/lib/isEmail';

// matches bracketed address (e.g. Jason Ginsberg <jasong@gmail.com>)
// Senders from Gmail follow this format
const BRACKET_EMAIL_REGEX = /(.*?)\s*<*(?<email>[^>\s,:;]*)/g;

export const parseEmailAddressesFromString = (value: string) => {
  const parsedValues = value.matchAll(BRACKET_EMAIL_REGEX);
  const parsedEmailAddresses: string[] = [];
  for (const match of parsedValues) {
    const parsedEmail = match.groups?.email;
    if (parsedEmail && isEmail(parsedEmail)) {
      parsedEmailAddresses.push(parsedEmail);
    } else {
      // If our regex did not match any emails, try using the email-regex library
      const matchedEmail = value.match(emailRegex());
      const emails = matchedEmail?.map((val) => val.trim()).filter((val) => isEmail(val));
      if (emails?.length) parsedEmailAddresses.concat(emails);
    }
  }
  return parsedEmailAddresses;
};
