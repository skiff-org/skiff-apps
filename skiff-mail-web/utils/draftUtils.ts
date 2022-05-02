import * as IDB from 'idb-keyval';

import { User } from '../models/user';
import { DraftContentDatagram, DraftInfo } from './crypto/draftDatagram';
import {
  decryptSymmetric,
  encryptSymmetric,
  generateSymmetricKey,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from './crypto/v1/utils';
import { getStorageKey, SkemailStorageTypes } from './storageUtils';
import { filterExists } from './typeUtils';

interface IDBDraftData {
  encryptedKey: string;
  encryptedDraft: string;
}

export const getDraftIDBKey = (userID: string, draftID: string) =>
  `${getStorageKey(SkemailStorageTypes.DRAFT_MESSAGE)}:${userID}:${draftID}`;

export const saveDraftToIDB = async (draftInfo: DraftInfo, userData: User) => {
  const {
    publicKey,
    privateUserData: { privateKey }
  } = userData;

  const draftSymmetricKey = generateSymmetricKey();
  const encryptedDraft = encryptSymmetric(draftInfo, draftSymmetricKey, DraftContentDatagram);
  const encryptedKey = stringEncryptAsymmetric(privateKey, publicKey, draftSymmetricKey);
  const IDBkey = getDraftIDBKey(userData.userID, draftInfo.draftID);
  const draftData: IDBDraftData = {
    encryptedKey,
    encryptedDraft
  };
  await IDB.set(IDBkey, JSON.stringify(draftData));
};

export const getUserDrafts = async (userData: User) => {
  const { userID } = userData;
  const keys = await IDB.keys();
  const draftKeys = keys.filter((key) => {
    try {
      return (key as string).startsWith(`${getStorageKey(SkemailStorageTypes.DRAFT_MESSAGE)}:${userID}`);
    } catch (error) {
      return false;
    }
  });
  const {
    publicKey,
    privateUserData: { privateKey }
  } = userData;
  const encryptedDrafts: Array<string> = await Promise.all(
    draftKeys.map(async (key) => IDB.get(key)).filter(filterExists)
  );
  try {
    const parsedDrafts: Array<IDBDraftData> = encryptedDrafts.map((encryptedDraft) => JSON.parse(encryptedDraft));
    const decryptedDraftInfo = parsedDrafts.map((encryptedDraftInfo) => {
      try {
        const { encryptedKey, encryptedDraft } = encryptedDraftInfo;
        const symmetricKey = stringDecryptAsymmetric(privateKey, publicKey, encryptedKey);
        const draftInfo = decryptSymmetric(encryptedDraft, symmetricKey, DraftContentDatagram);
        return draftInfo;
      } catch (error) {
        console.error(error);
      }
    });
    const draftThreads = decryptedDraftInfo.filter(filterExists);
    return draftThreads;
  } catch (error) {
    console.error(error);
    return [];
  }
};
