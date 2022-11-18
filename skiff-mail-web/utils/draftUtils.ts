import * as IDB from 'idb-keyval';
import {
  generateSymmetricKey,
  decryptSymmetric,
  encryptSymmetric,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from 'skiff-crypto';
import { getStorageKey, StorageTypes } from 'skiff-front-utils';
import { models } from 'skiff-mail-graphql';
import { DraftContentDatagram, DraftInfo } from 'skiff-mail-graphql';
import { filterExists } from 'skiff-utils';

interface IDBDraftData {
  encryptedKey: string;
  encryptedDraft: string;
}

export const getDraftIDBKey = (userID: string, draftID: string) =>
  `${getStorageKey(StorageTypes.DRAFT_MESSAGE)}:${userID}:${draftID}`;

export const saveDraftToIDB = async (draftInfo: DraftInfo, userData: models.User) => {
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

export const parseAndDecryptDraft = (rawEncryptedDraft: string, userData: models.User) => {
  const {
    publicKey,
    privateUserData: { privateKey }
  } = userData;
  try {
    const encryptedDraftInfo = JSON.parse(rawEncryptedDraft);
    const { encryptedKey, encryptedDraft } = encryptedDraftInfo;
    const symmetricKey = stringDecryptAsymmetric(privateKey, publicKey, encryptedKey);
    const draftInfo = decryptSymmetric(encryptedDraft, symmetricKey, DraftContentDatagram);
    return draftInfo;
  } catch (error) {
    console.error(error);
  }
};

export const getUserDrafts = async (userData: models.User) => {
  const { userID } = userData;
  const keys = await IDB.keys();
  const draftKeys = keys.filter((key) => {
    try {
      return (key as string).startsWith(`${getStorageKey(StorageTypes.DRAFT_MESSAGE)}:${userID}`);
    } catch (error) {
      return false;
    }
  });

  const encryptedDrafts: Array<string> = await Promise.all(
    draftKeys.map(async (key) => IDB.get(key)).filter(filterExists)
  );
  try {
    const decryptedDraftInfo = encryptedDrafts.map((encryptedDraftInfo) =>
      parseAndDecryptDraft(encryptedDraftInfo, userData)
    );
    const draftThreads = decryptedDraftInfo.filter(filterExists);
    return draftThreads;
  } catch (error) {
    console.error(error);
    return [];
  }
};
