import { useEffect, useState } from 'react';
import { formatEmailAddress, formatName } from 'skiff-front-utils';
import { models } from 'skiff-mail-graphql';

import { useDefaultEmailAlias } from './useDefaultEmailAlias';

export const useUsernameFromUser = (user: Pick<models.User, 'username'>) => {
  const [defaultEmailAlias] = useDefaultEmailAlias();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (defaultEmailAlias && email !== defaultEmailAlias) {
      setEmail(defaultEmailAlias);
    }
  }, [defaultEmailAlias]);

  const formattedUsername = email ? formatEmailAddress(email) : formatName(user.username);
  return { username: email || user.username, formattedUsername };
};
