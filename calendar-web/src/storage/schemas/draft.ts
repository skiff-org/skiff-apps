import { EncryptedDataOutput } from 'skiff-graphql';

import { DraftLocalMetadata, DraftPlainContent } from '../models/draft/types';
import { InternalAttendee } from '../models/event/types';

/**
 * Keeping almost the same structure as `EncryptedEvent`, only without `EventLocalMetadata` and `externalID`
 */
export type EncryptedDraft = {
  // IDs
  parentEventID: string;
  externalID: string;

  internalAttendees: InternalAttendee[];
  // Content
  encryptedContent: EncryptedDataOutput;
  encryptedSessionKey: string;
  encryptedByKey: string;
  // Preferences
  encryptedPreferences?: string | null;
  encryptedPreferencesSessionKey?: string | null;

  // We are overriding the recurrenceRule to be string, because we need the data stored in the DB to be serializable
  recurrenceRule?: string | null;
} & Omit<DraftPlainContent, 'recurrenceRule'> &
  DraftLocalMetadata;
