export enum SkemailStorageTypes {
  DRAFT_MESSAGE = 'DraftMessage',
  SEARCH_INDEX = 'MailSearchIndex',
  SESSION_CACHE = 'sessionCache', // shared with editor
  DEFAULT_ALIAS = 'DefaultAlias'
}

export const getStorageKey = (type: SkemailStorageTypes): string => `skiff:${type}`;
