import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import { GetNumUnreadDocument, GetNumUnreadQuery, GetNumUnreadQueryVariables, SystemLabels } from '../graphql';

import { createAliasClientGivenID } from './profileData';

export const getNumUnreadForUser = async (routerURI: string, userID: string) => {
  try {
    const client = createAliasClientGivenID(routerURI, userID);
    const res = await client.query<GetNumUnreadQuery, GetNumUnreadQueryVariables>({
      query: GetNumUnreadDocument,
      context: {
        headers: {
          [SKIFF_USERID_HEADER_NAME]: userID
        }
      },
      variables: { label: SystemLabels.Inbox },
      fetchPolicy: 'network-only'
    });
    const numUnread = res?.data?.unread;
    return numUnread;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
