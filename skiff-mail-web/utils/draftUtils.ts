import {
  generateSymmetricKey,
  decryptSymmetric,
  encryptSymmetric,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from '@skiff-org/skiff-crypto';
import {
  Draft,
  models,
  DraftContentDatagram,
  DraftInfo,
  GetAllDraftsDocument,
  GetAllDraftsQuery,
  GetAllDraftsQueryVariables
} from 'skiff-front-graphql';
import { assert, filterExists, getStorageKey, StorageTypes } from 'skiff-utils';

import client from '../apollo/client';

export const getDraftIDBKey = (userID: string, draftID: string) =>
  `${getStorageKey(StorageTypes.DRAFT_MESSAGE)}:${userID}:${draftID}`;

export const getDraftSaveData = (draftInfo: DraftInfo, userData: models.User) => {
  const {
    publicKey,
    privateUserData: { privateKey }
  } = userData;

  const draftSymmetricKey = generateSymmetricKey();
  const encryptedDraft = encryptSymmetric(draftInfo, draftSymmetricKey, DraftContentDatagram);
  const encryptedKey = stringEncryptAsymmetric(privateKey, publicKey, draftSymmetricKey);
  const draftData: Draft = {
    draftID: draftInfo.draftID,
    encryptedKey,
    encryptedDraft
  };
  return draftData;
};

const decryptDraftData = (encryptedKey: string, encryptedDraft: string, userData: models.User) => {
  const {
    publicKey,
    privateUserData: { privateKey }
  } = userData;
  try {
    const symmetricKey = stringDecryptAsymmetric(privateKey, publicKey, encryptedKey);
    const draftInfo = decryptSymmetric(encryptedDraft, symmetricKey, DraftContentDatagram);
    return draftInfo;
  } catch (error) {
    console.error(error);
  }
};

function assertIsEncryptedDraftData(
  draftData: any
): asserts draftData is { encryptedKey: string; encryptedDraft: string } {
  assert(!!draftData && typeof draftData === 'object');
  assert('encryptedKey' in draftData && 'encryptedDraft' in draftData);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert(typeof draftData.encryptedKey === 'string' && typeof draftData.encryptedDraft === 'string');
}

export const parseAndDecryptDraft = (rawEncryptedDraft: string, userData: models.User) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const encryptedDraftInfo = JSON.parse(rawEncryptedDraft);
    assertIsEncryptedDraftData(encryptedDraftInfo);
    const { encryptedKey, encryptedDraft } = encryptedDraftInfo;
    return decryptDraftData(encryptedKey, encryptedDraft, userData);
  } catch (error) {
    console.error(error);
  }
};

export const getUserDrafts = async (userData: models.User) => {
  const draftThreads: Array<DraftInfo> = [];
  const { data, errors } = await client.query<GetAllDraftsQuery, GetAllDraftsQueryVariables>({
    query: GetAllDraftsDocument,
    errorPolicy: 'all'
  });

  if (errors) {
    console.error('Error fetching drafts', errors);
  }

  if (data) {
    const decryptedRemoteDrafts = data.allDrafts.map((draftData) =>
      decryptDraftData(draftData.encryptedKey, draftData.encryptedDraft, userData)
    );
    draftThreads.push(...decryptedRemoteDrafts.filter(filterExists));
  }

  return draftThreads;
};
