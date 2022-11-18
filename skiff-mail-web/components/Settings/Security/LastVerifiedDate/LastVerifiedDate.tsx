import React from 'react';
import { getDateContent, TitleActionSection, useLocalSetting, useTimedRerender } from 'skiff-front-utils';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';

/**
 * Displays the last time the user has marked/unmarked another user as verified
 */
function LastVerifiedDate() {
  const [dateFormat] = useLocalSetting('dateFormat');
  const [hourFormat] = useLocalSetting('hourFormat');

  useTimedRerender(60_000, false); // updates every minute

  const userData = useRequiredCurrentUserData();
  // Get last
  const lastVerified = userData?.privateDocumentData?.verifiedKeys?.lastVerifiedDate;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const date: string = getDateContent(lastVerified || '', dateFormat, hourFormat, 'relative');
  const label = lastVerified
    ? `The last time you verified another Skiff user's identity was ${date}.`
    : 'You have not verified another Skiff users identity.';

  return <TitleActionSection subtitle={label} title='Last verification time' />;
}

export default LastVerifiedDate;
