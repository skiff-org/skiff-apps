export enum EmailFieldTypes {
  TO = 'To',
  CC = 'Cc',
  BCC = 'Bcc',
  SUBJECT = 'Subject',
  FROM = 'From',
  BODY = 'Body'
}

export const SENDER_PUBLIC_KEY_FILENAME = 'public_key.asc';

export const PGP_CONTENT_TYPES = ["application/pgp-encrypted",
  "application/pgp-signature", "application/pgp-keys"];

export const PGP_EXTENSIONS = ["pgp", "gpg", "asc"];
