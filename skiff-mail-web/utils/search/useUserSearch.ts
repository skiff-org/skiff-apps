import { useGetUserContactListQuery } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS, trimAndLowercase } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';

import { SearchItemType, UserSearchResult } from './searchTypes';

// used for searching through contact list when the user selects the "USER" category
export const useUserSearch = () => {
  const { userID } = useRequiredCurrentUserData();
  const { data, error } = useGetUserContactListQuery({
    variables: {
      request: { userID }
    },
    pollInterval: POLL_INTERVAL_IN_MS
  });

  if (error) {
    console.error(`Failed to retrieve User's contact list`, JSON.stringify(error, null, 2));
  }

  const contactList = data?.user?.contactList ?? [];

  const search = (searchString: string) => {
    const searchStr = trimAndLowercase(searchString);
    if (!searchStr) {
      return;
    }

    const results = contactList.filter(
      (val) => val.name?.toLowerCase().includes(searchStr) || val.address.toLowerCase().includes(searchStr)
    );
    const contacts: UserSearchResult[] = results.map((user) => ({
      type: SearchItemType.USER_RESULT,
      email: user.address,
      displayName: user.name ?? undefined
    }));
    return contacts;
  };

  return { search };
};
