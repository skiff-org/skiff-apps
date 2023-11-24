// Encrypted Event <- Dexie schema

import { EncryptedDataOutput } from 'skiff-graphql';

import { EventPlainContent, EventLocalMetadata, InternalAttendee } from '../models/event/types';

export type EncryptedEvent = {
  // IDs
  externalID: string;
  parentEventID: string;

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
} & Omit<EventPlainContent, 'recurrenceRule'> &
  EventLocalMetadata;
