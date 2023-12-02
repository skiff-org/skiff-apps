import { useGetAllCurrentUserContactsQuery } from 'skiff-front-graphql';
import { contactToAddressObject } from 'skiff-front-utils';
import { trimAndLowercase } from 'skiff-utils';

import { SearchItemType, UserSearchResult } from './searchTypes';

// used for searching through contact list when the user selects the "USER" category
export const useUserSearch = () => {
  const { data: contactsData } = useGetAllCurrentUserContactsQuery({
    onError: (error) => {
      console.error(`Failed to retrieve User's contact list`, JSON.stringify(error, null, 2));
    }
  });

  const contactList = contactsData?.allContacts?.map(contactToAddressObject) ?? [];

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
