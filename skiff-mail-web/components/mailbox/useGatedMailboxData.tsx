import { useEffect, useState } from 'react';
import { MailboxQuery } from 'skiff-mail-graphql';

/**
 * This hook allows us to not show newly fetched data until animation is complete
 * this is used on pull to refresh and prevent seeing newly fetched mails before fetched
 * animation is complete
 * @param _data most recent mailbox data
 * @param locked whether to update mailbox data or not
 * @returns mailbox data
 */
export default function useGatedMailboxData(_data: MailboxQuery | undefined, locked?: boolean) {
  const [data, setData] = useState<MailboxQuery | undefined>(_data);

  useEffect(() => {
    if (locked) return;
    setData(_data);
  }, [_data, locked]);

  return data;
}
