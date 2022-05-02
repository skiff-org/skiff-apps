export enum StorageTypes {
  SESSION_CACHE = 'sessionCache',
  FILE_TABLE_SORT_MODE = 'fileTableSort:mode',
  FILE_TABLE_SORT_ORDER = 'fileTableSort:order',
  SIDEPANEL_OPEN = 'sidepanelOpen',
  ORGANIZATION_EVERYONE_TEAM = 'organizationEveryoneTeam'
}

export const getStorageKey = (type: StorageTypes): string => `skiff:${type}`;

// store org everyone team ID (a docID) in local storage, or store 'mail'
export const storeRedirectInLocalStorage = (docIDOrMail: string | null | undefined) => {
  const localStorageKey = getStorageKey(StorageTypes.ORGANIZATION_EVERYONE_TEAM);
  if (docIDOrMail) {
    localStorage.setItem(localStorageKey, docIDOrMail);
  } else {
    localStorage.removeItem(localStorageKey);
  }
};

// read org everyone team ID from local storage
export const readOrgIDfromLocalStorage = () =>
  localStorage.getItem(getStorageKey(StorageTypes.ORGANIZATION_EVERYONE_TEAM));
