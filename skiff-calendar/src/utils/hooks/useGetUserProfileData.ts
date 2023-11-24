import { AccentColor } from 'nightwatch-ui';

import { useGetUsersProfileDataQuery } from '../../../generated/graphql';
import { DEFAULT_EVENT_COLOR } from '../../constants';

interface UserProfilePublicData {
  profileColor: AccentColor;
  displayName?: string;
}

export const useGetUserProfileData = (userID: string): UserProfilePublicData => {
  const { data: profileData } = useGetUsersProfileDataQuery({
    variables: {
      request: {
        userIDs: [userID]
      }
    }
  });
  return {
    profileColor:
      (profileData?.users?.[0].publicData.displayPictureData?.profileAccentColor as AccentColor) || DEFAULT_EVENT_COLOR,
    displayName: profileData?.users?.[0].publicData.displayName ?? undefined
  };
};
