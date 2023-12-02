import { SearchResult } from 'minisearch';
import { AddressObject, DecryptedAttachment, NwContentType } from 'skiff-graphql';

export interface IndexedItemBase {
  id: string;
  updatedAt: number;
}

export interface IndexedDocument extends IndexedItemBase {
  title: string;
  content: string;
  contentType: NwContentType;
}

export type MiniSearchResultBase = Pick<SearchResult, 'terms' | 'score' | 'match'> & IndexedItemBase;

export interface IndexedSkemail extends IndexedItemBase {
  threadID: string;
  subject: string;
  content: string;
  toAddresses: string[];
  to: AddressObject[];
  ccAddresses: string[];
  cc: AddressObject[];
  bccAddresses: string[];
  bcc: AddressObject[];
  fromAddress: string;
  from: AddressObject;
  systemLabels: string[];
  userLabels: string[];
  read: boolean;
  attachments: DecryptedAttachment[] | null | undefined;
}

export type SkemailMiniSearchResult = MiniSearchResultBase & Pick<IndexedSkemail, 'threadID'>;
export type EditorMiniSearchResult = MiniSearchResultBase & Pick<IndexedDocument, 'title' | 'contentType'>;
export type MiniSearchResult = SkemailMiniSearchResult | EditorMiniSearchResult;

export enum SearchClient {
  SKEMAIL = 'skemail',
  EDITOR = 'editor'
}

export interface DateRangeFilter {
  daysAgo: number; // for computing preset ranges on the fly; custom ranges will be added soon
}

export const skemailSearchIndexIDBKey = (userID: string) => `skiff:skemailSearchIndex:${userID}`;
export const editorSearchIndexIDBKey = (userID: string) => `skiff:editorSearchIndex:${userID}`;
