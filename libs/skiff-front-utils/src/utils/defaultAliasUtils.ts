import EventEmitter from 'eventemitter3';
import { getStorageKey, StorageTypes } from 'skiff-utils';

import { sendRNWebviewMsg } from './mobileUtils';

export const DefaultAliasEE = new EventEmitter<string>();

export const ALIAS_UPDATE_EVENT_NAME = 'aliasUpdate';

export const getDefaultEmailAliasKey = (userID: string) => `${getStorageKey(StorageTypes.DEFAULT_ALIAS)}:${userID}`;

export const getDefaultEmailAlias = (userID?: string): string => {
  if (!userID) return '';
  const localStorageKey = getDefaultEmailAliasKey(userID);
  const localStorageValue = localStorage.getItem(localStorageKey);
  return localStorageValue || '';
};

export const setDefaultEmailAlias = (userID: string | undefined, defaultEmailAlias: string) => {
  if (!userID) return;
  const localStorageKey = getDefaultEmailAliasKey(userID);
  localStorage.setItem(localStorageKey, defaultEmailAlias);
  DefaultAliasEE.emit(ALIAS_UPDATE_EVENT_NAME);
  sendRNWebviewMsg('defaultAliasChanged', { address: defaultEmailAlias });
};

/**
 * Used to initialize the default email alias on log-in if no default alias was set in local storage
 * @param {string} userID
 * @param {string[]} emailAliases
 * @returns {string} the default email alias
 */
export const initializeDefaultEmailAlias = (userID: string, emailAliases: string[]) => {
  if (!emailAliases.length) return '';

  const currDefaultEmailAlias = getDefaultEmailAlias(userID);
  const defaultEmailAliasExists = emailAliases.indexOf(currDefaultEmailAlias) !== -1;
  if (defaultEmailAliasExists) return currDefaultEmailAlias;

  const newDefaultEmailAlias = emailAliases[0];
  setDefaultEmailAlias(userID, newDefaultEmailAlias);
  return newDefaultEmailAlias;
};
