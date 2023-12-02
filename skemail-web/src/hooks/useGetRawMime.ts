import { useState, useEffect } from 'react';
import { getRawMime } from 'skiff-front-utils';

import { ThreadViewEmailInfo } from '../models/email';

export const useGetRawMime = (email: ThreadViewEmailInfo | undefined) => {
  const [rawMimeContent, setRawMimeContent] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!email) return;

    const getMime = async () => {
      if (!email.encryptedRawMimeUrl || !email.decryptedSessionKey) {
        return;
      }
      try {
        const rawMime = await getRawMime(email.encryptedRawMimeUrl, email.decryptedSessionKey);
        if (rawMime) {
          setRawMimeContent(rawMime);
        }
      } catch (error) {
        console.error('Could not get raw MIME of the email', error);
      }
    };
    void getMime();
  }, [email?.encryptedRawMimeUrl, email?.decryptedSessionKey, email]);

  return rawMimeContent;
};
