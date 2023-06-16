import { Document, NwContentType } from 'skiff-graphql';
import { RecursivePartial, RecursivePartialExcept } from 'skiff-utils';

import {
  DocumentWithDecryptedContents,
  GenericDocument,
  getChunkData,
  isGenericDocument
} from '../../types/docSharing.types';
import { fileMimeTypesAndExtensionsReverseLookup } from '../fileUtils';

export type DocumentWithMetadata = RecursivePartialExcept<Document, 'decryptedMetadata' | 'docID' | 'documentType'>;

export const FILE_DOCUMENT_TYPES: NwContentType[] = [NwContentType.File, NwContentType.Pdf];

export const docHasContents = (document: RecursivePartial<Document>): document is DocumentWithDecryptedContents =>
  !!document.decryptedContents;

export const getGenericDocumentContents = (document: DocumentWithDecryptedContents): GenericDocument | undefined => {
  const docChunkData = getChunkData(document);

  const docContents = docChunkData && isGenericDocument(docChunkData) ? docChunkData : undefined;

  return docContents;
};

export const getFileDocMimeType = (document: DocumentWithMetadata): string | undefined => {
  const docMetadata = document.decryptedMetadata;
  const docContents = docHasContents(document) ? getGenericDocumentContents(document) : undefined;
  const docType = docMetadata.mimeType || docContents?.fileType;

  return docType;
};

export const getFileDocFileTypeLabel = (document: DocumentWithMetadata): string | undefined => {
  if (document.documentType === NwContentType.RichText) {
    return 'PAGE';
  }
  if (document.documentType === NwContentType.Folder) {
    return 'FOLDER';
  }

  const mimeType = getFileDocMimeType(document);
  const extensionLabel = fileMimeTypesAndExtensionsReverseLookup[mimeType ?? '']?.[0]?.toUpperCase();

  return extensionLabel || 'FILE';
};

export const getFileDocSize = (document: DocumentWithMetadata): number | undefined => {
  const docMetadata = document.decryptedMetadata;
  const docContents = docHasContents(document) ? getGenericDocumentContents(document) : undefined;

  const docSize = docMetadata.fileSizeBytes || docContents?.size;

  return docSize;
};
