import { useEffect, useState } from 'react';
import { models } from 'skiff-front-graphql';
import { formatEmailAddress, formatName, useDefaultEmailAlias } from 'skiff-front-utils';

export const useUsernameFromUser = (user: Pick<models.User, 'userID' | 'username'>) => {
  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (defaultEmailAlias && email !== defaultEmailAlias) {
      setEmail(defaultEmailAlias);
    }
  }, [defaultEmailAlias]);

  const formattedUsername = email ? formatEmailAddress(email) : formatName(user.username);
  return { username: email || user.username, formattedUsername };
};
