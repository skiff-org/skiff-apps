import {
  TitleActionSection,
  getDateContent,
  useRequiredCurrentUserData,
  useTimedRerender,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

/**
 * Displays the last time the user has marked/unmarked another user as verified
 */
function LastVerifiedDate() {
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);
  const [hourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);

  useTimedRerender(60_000, false); // updates every minute

  const userData = useRequiredCurrentUserData();
  // Get last
  const lastVerified = userData?.privateDocumentData?.verifiedKeys?.lastVerifiedDate;
  const date: string = getDateContent(lastVerified || '', dateFormat, hourFormat, 'relative', false);
  const label = lastVerified
    ? `The last time you verified another Skiff user's identity was ${date}`
    : 'You have not verified another Skiff users identity';

  return <TitleActionSection subtitle={label} title='Last verification time' />;
}

export default LastVerifiedDate;
