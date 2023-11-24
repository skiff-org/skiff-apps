import { PermissionLevel, Document } from 'skiff-graphql';

export type DocumentWithDecryptedContents = Pick<Document, 'decryptedContents' | 'decryptedMetadata'>;

/**
 * Interface for a rich text document. Includes actual document data, as well as
 * other security features (hasPassword / watermark) and import/export data.
 */
export interface RichTextDocument {
  documentData: string;
  hasPassword: boolean;
  watermark: string;
}

/**
 * Interface for PDF file document. Includes boolean to indicate password presence.
 */
export interface PDFDocument {
  documentData: string;
  hasPassword: boolean;
  uploadedToCache?: boolean; // if true, documentData is an object reference to cache
}

/**
 * Interface for a single decrypted chunk.
 */
export interface DecryptedDocumentChunk {
  chunkNumber: number;
  chunkData: GenericDocument;
}

/**
 * Interface for an inline cache element stored in rich text in skiff-prosemirror document or PDF.
 */
export interface InlineCacheElemData {
  cacheID: string;
  url: string;
  cacheDataKey: string;
  ipfsPath?: string;
}

/**
 * Interface for Generic document. Includes boolean to indicate password presence.
 */
export interface GenericDocument {
  documentData: string;
  hasPassword: boolean;
  uploadedToCache?: boolean; // if true, documentData is an object reference to cache
  fileType?: string;
  size?: number;
  // File slices for large files.
  cacheSlices?: string[];
}

export type ChunkData = RichTextDocument | PDFDocument | GenericDocument;

/** Parent keys claim interface for sessionKey and document's privateHierarchicalKey */
export interface ParentKeysClaim {
  sessionKey: string;
  privateHierarchicalKey: string;
}

export interface ClientPermissionEntry {
  permissionLevel: PermissionLevel;
  expiryDate?: Date | null;
  userID: string;
}

export const isChunkData = (chunk: Record<any, any> | undefined): chunk is ChunkData => {
  return (chunk as ChunkData | undefined)?.documentData !== undefined;
};

export const isGenericDocument = (doc: ChunkData): doc is GenericDocument => {
  return (doc as GenericDocument | undefined)?.fileType !== undefined;
};

export const getChunkData = (document: DocumentWithDecryptedContents): ChunkData | undefined => {
  const docChunkData = isChunkData(document.decryptedContents.contentsArr[0]?.chunkData)
    ? document.decryptedContents.contentsArr[0]?.chunkData
    : undefined;

  return docChunkData;
};
