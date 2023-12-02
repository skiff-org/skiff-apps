import { requireCurrentUserData } from 'skiff-front-utils';
import { assertExists } from 'skiff-utils';

import { getCurrentCalendarMetadata } from '../../../apollo/currentCalendarMetadata';
import { toEncryptedDraft } from '../../../crypto/cryptoWebWorker';
import { queryEventsBetween, queryEventsCovering } from '../../../utils/queryUtils';
import { requireAllResolvedAndSplitAttendees } from '../../crypto/utils';
import { db } from '../../db/db';
import { EncryptedDraft } from '../../schemas/draft';

import { DecryptedDraftModel } from './DecryptedDraftModel';
import { DecryptedDraft } from './types';

/**
 * saves draft to the DB,
 * uses put because the user is only one who can editor the draft so the saved draft will always be the most updated version
 * @param draft
 * @returns
 */
export const saveDraft = async (draft: DecryptedDraft) => {
  assertExists(db, 'saveDraft: DB is closed');
  const calendarMetaData = await getCurrentCalendarMetadata();
  const userData = requireCurrentUserData();
  if (!calendarMetaData) return;

  const activeCalendarPrivateKey = calendarMetaData.getDecryptedCalendarPrivateKey(
    userData.privateUserData.privateKey,
    userData.publicKey
  );

  const attendeesForEncryption = requireAllResolvedAndSplitAttendees(draft.decryptedContent.attendees);

  const encryptedDraft = await toEncryptedDraft(
    draft,
    calendarMetaData.publicKey,
    activeCalendarPrivateKey,
    attendeesForEncryption
  );

  return db.transaction('rw!', db.events, db.drafts, db.calendarMetadata, async () => {
    assertExists(db, 'saveDraft: DB is closed');
    const dexieDraft = await db.drafts.put(encryptedDraft, encryptedDraft.parentEventID);
    if (!dexieDraft) {
      throw new Error(`Failed saving draft with id: ${encryptedDraft.parentEventID}`);
    }

    return dexieDraft;
  });
};

export const getDraftByID = async (parentEventID: string): Promise<DecryptedDraftModel | undefined> => {
  assertExists(db, 'getDraftByID: DB is closed');
  const dexieDraft = await db.drafts.get(parentEventID);

  if (!dexieDraft) return undefined;
  return DecryptedDraftModel.fromDexie(dexieDraft);
};

/**
 * Function that returns all drafts between 2 dates.
 * @param startDate start the search from date
 * @param endDate end the search on date
 * @returns List of all drafts as DecryptedDraft
 */
export const getDraftsBetween = async (startDate: number, endDate: number): Promise<DecryptedDraftModel[]> => {
  assertExists(db, 'getDraftsBetween: DB is closed');
  const dexieDrafts = await queryEventsBetween<EncryptedDraft>(db.drafts, startDate, endDate);

  const decryptedDrafts = await DecryptedDraftModel.fromManyDexie(dexieDrafts);
  return decryptedDrafts.filter((draft) => !draft.decryptedContent.isAllDay);
};

/**
 * Function that returns all all day drafts that are
 * overlapping with the provided range of dates.
 * @param startDate start the search from date
 * @param endDate end the search on date
 * @returns List of all all day drafts as DecryptedDraft
 */
export const getAllDayOverlappingDrafts = async (
  startDate: number,
  endDate: number
): Promise<DecryptedDraftModel[]> => {
  assertExists(db, 'getAllDayOverlappingDrafts: DB is closed');
  const betweenDrafts = await queryEventsBetween<EncryptedDraft>(db.drafts, startDate, endDate);
  const coveringDrafts = await queryEventsCovering<EncryptedDraft>(db.drafts, startDate, endDate);
  // this ordering is important since we want the multi day drafts first for the calculations
  const decryptedDrafts = await Promise.all(
    [...coveringDrafts, ...betweenDrafts].map((dexieDraft) => DecryptedDraftModel.fromDexie(dexieDraft))
  );

  return decryptedDrafts.filter((draft) => draft.decryptedContent.isAllDay);
};

/**
 * delete draft that matches the ID
 * @param draftID ID of draft to be delete
 */
export const deleteDraftByID = async (draftID: string): Promise<boolean> => {
  assertExists(db, 'deleteDraftByID: DB is closed');
  return db.transaction('rw!', db.events, db.drafts, db.calendarMetadata, async () => {
    assertExists(db, 'deleteDraftByID: DB is closed');
    await db.drafts.delete(draftID);

    return true;
  });
};

export const deleteAllDrafts = async (): Promise<void> => {
  assertExists(db, 'deleteAllRows: DB is closed');
  await db.drafts.clear();
};
