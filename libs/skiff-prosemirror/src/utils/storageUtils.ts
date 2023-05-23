import { EditorState } from 'prosemirror-state';
import { StorageTypes } from 'skiff-utils';

import { getCustomState } from '../skiffEditorCustomStatePlugin';

// Key for local storage for document specific data -> skiff:<docID>:<StorageType>
export const getDocStorageKey = (docID: string, type: StorageTypes): string => `skiff:${docID}:${type}`;

export const getDocId = (state: EditorState): string | undefined => {
  try {
    const customState = getCustomState(state);
    return customState.docID;
  } catch (error) {
    // TODO - consider refactor to get docID
    const { pathname } = window.location;
    const split = pathname.split('/');
    if (split.length < 3) {
      throw new Error('Could not get docID');
    }
    const docID = split[2];
    return docID;
  }
};

/**
 * getDocNodeItem, setDocNodeItem and deleteOldDocState
 * are utility functions meant to clean the local-storage
 * and save all the same doc data in the same local-storage item
 * Also saves for each sub-item a timestamp, to clean the local-storage when there is no usage in the data
 *
 * lets say we have 30 toggle items in a document instead of creating 30 local-storage items
 * will create single item skiff:<docID>:toggleNodes
 * with a map: {
 *  <nodeId>: {value: ..., timestamp: ...},
 *  <nodeId>: {value: ..., timestamp: ...},
 *  ...
 * }
 */

/**
 * Given itemKey will return the value from local-doc-storage.
 * Updates the timestamp to now, to indicate usage,
 * if no value return defaultValue and sets the storage value to it
 */
export function getDocNodeItem<T>(docID: string, storageType: StorageTypes, itemKey: string, defaultValue: T): T {
  const itemsMap = JSON.parse(localStorage.getItem(getDocStorageKey(docID, storageType)) || '{}');
  if (!itemsMap[itemKey]) itemsMap[itemKey] = { value: defaultValue };
  itemsMap[itemKey].timestamp = Date.now();
  localStorage.setItem(getDocStorageKey(docID, storageType), JSON.stringify(itemsMap));
  return itemsMap[itemKey].value;
}

/**
 * Given itemKey will set its value inside the local-doc-storage object.
 * Updates the timestamp to now, to indicate usage,
 */
export function setDocNodeItem<T>(docID: string, storageType: StorageTypes, itemKey: string, value: T) {
  const itemsMap = JSON.parse(localStorage.getItem(getDocStorageKey(docID, storageType)) || '{}');
  itemsMap[itemKey] = {
    value: value,
    timestamp: Date.now()
  };
  localStorage.setItem(getDocStorageKey(docID, storageType), JSON.stringify(itemsMap));
  return itemsMap[itemKey].value;
}

/**
 * Cleans all the "old" items in the local-doc-storage object for the StorageType
 */
export function deleteOldDocStates(docID: string, storageType: StorageTypes, maxAge: number): void {
  const itemsMap = JSON.parse(localStorage.getItem(getDocStorageKey(docID, storageType)) || '{}');
  for (const itemKey in itemsMap) {
    if (Date.now() - itemsMap[itemKey].timestamp > maxAge) delete itemsMap[itemKey];
  }
  localStorage.setItem(getDocStorageKey(docID, storageType), JSON.stringify(itemsMap));
}
