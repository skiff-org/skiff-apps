import { useEffect, useState } from 'react';
import { formatEmailAddress, formatName, useDefaultEmailAlias } from 'skiff-front-utils';

import { User } from '../../../generated/graphql';

export const useUsernameFromUser = (user: Pick<User, 'userID' | 'username'>) => {
  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);
  const [email, setEmail] = useState(defaultEmailAlias ?? '');

  useEffect(() => {
    if (defaultEmailAlias && email !== defaultEmailAlias) {
      setEmail(defaultEmailAlias);
    }
  }, [defaultEmailAlias]);

  const formattedUsername = email ? formatEmailAddress(email) : formatName(user.username);
  return { username: email || user.username, formattedUsername };
};
