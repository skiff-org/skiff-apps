import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { useEffect, useState } from 'react';
import { DocumentBaseFragment } from 'skiff-front-graphql';
import { DocumentDecryptedContents, NwContentType } from 'skiff-graphql';
import { mbToBytes } from 'skiff-utils';

import {
  DEFAULT_FILE_TYPE_LABEL,
  PreviewObject
} from '../components/FileViewer/RecentFilePreview/RecentFilePreview.types';
import { GenericDocument } from '../types/docSharing.types';
import { FileTypes, getDocumentBaseFromCache, getFileTypeFromMimeType } from '../utils';
import {
  FILE_DOCUMENT_TYPES,
  docHasContents,
  getFileDocFileTypeLabel,
  getFileDocMimeType,
  getFileDocSize,
  getGenericDocumentContents
} from '../utils/documentUtils/fileDocUtils';

import { useDocument } from './useDocument';
import { getMediaURL } from './useMediaURL';

const DEFAULT_PREVIEW: PreviewObject = {
  data: '',
  contentType: NwContentType.File,
  tooLargeForPreview: false,
  fileTypeLabel: DEFAULT_FILE_TYPE_LABEL,
  fileName: ''
};

const EMPTY_RESPONSE = { loading: false, error: undefined, preview: DEFAULT_PREVIEW, refetch: () => {} };

// Max preview file size
export const MAX_PREVIEW_FILE_SIZE = mbToBytes(15); // 15 MB

// Will contain DocumentBaseFragment if cached or full document
// Will only contain decryptedContents if full document is fetched
type CachedOrFullDocument = DocumentBaseFragment & { decryptedContents?: DocumentDecryptedContents };

interface FilePreviewRequest {
  docID: string;
  client: ApolloClient<NormalizedCacheObject>;
  // Include the data needed to render the preview image
  // IMPORTANT: This will make a fullDoc call, instead of using cached data
  includeFileData: boolean;
}

const DOC_TYPES_TO_PREVIEW = [NwContentType.File];
const FILE_TYPES_TO_PREVIEW = [FileTypes.Image, FileTypes.Icon, FileTypes.Video, FileTypes.Pdf];

/**
 * Returns a preview object for a given document ID
 * If the document is not a file, returns an empty preview object
 */
export function useFilePreview({ docID, client, includeFileData }: FilePreviewRequest): {
  preview: PreviewObject;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
} {
  const [preview, setPreview] = useState<PreviewObject>(DEFAULT_PREVIEW);

  const cachedDocumentInfo = getDocumentBaseFromCache(docID, client);

  const cachedDocType = cachedDocumentInfo?.documentType;
  const cachedMimeType = cachedDocumentInfo?.decryptedMetadata?.mimeType;
  const cachedFileType = getFileTypeFromMimeType(cachedMimeType ?? '');

  /**
   * To determine if we should fetch the full doc and load the preview, we check
   *   1. If the includeFileData arg is true
   *   2. If we can read the docType from the cached data, and it's a doc type that we preview
   *   3. If we can read the mimeType from the cached data, and it's a file type that we preview
   *
   * If any of these conditions are false, we will not fetch the full doc, and will only used the cached data
   */
  const shouldFetchFullDoc =
    includeFileData &&
    (!cachedDocType || DOC_TYPES_TO_PREVIEW.includes(cachedDocType)) &&
    (!cachedMimeType || FILE_TYPES_TO_PREVIEW.includes(cachedFileType));

  const { data, loading, error, refetch } = useDocument(shouldFetchFullDoc ? docID : false, client);

  const document: CachedOrFullDocument | null = data?.document ?? cachedDocumentInfo;

  const documentHasContents = document && docHasContents(document);

  const docContents: GenericDocument | undefined = documentHasContents
    ? getGenericDocumentContents(document)
    : undefined;

  const docSize: number | undefined = document ? getFileDocSize(document) : undefined;
  const docMimeType: string | undefined = document ? getFileDocMimeType(document) : undefined;
  const fileName = document?.decryptedMetadata.title ?? '';

  const docFileTypeLabel: string = document
    ? getFileDocFileTypeLabel(document) ?? DEFAULT_FILE_TYPE_LABEL
    : DEFAULT_FILE_TYPE_LABEL;

  const hasPassword = docContents?.hasPassword;
  const documentType = document?.documentType ?? NwContentType.File;

  // on mount and whenever known doc contents change, re-render preview
  useEffect(() => {
    const setDocPreview = async () => {
      const basePreview: PreviewObject = {
        ...preview,
        fileSizeBytes: docSize,
        mimeType: docMimeType,
        fileTypeLabel: docFileTypeLabel,
        fileName,
        contentType: documentType
      };

      if (!shouldFetchFullDoc) {
        setPreview(basePreview);
        return;
      }

      // If we downloaded the preview data
      if ((docSize || Math.max()) < MAX_PREVIEW_FILE_SIZE) {
        const fileData = documentHasContents ? (await getMediaURL(document)) ?? '' : '';

        if (hasPassword || !docContents) {
          // doc locked
          return;
        }

        setPreview({
          ...basePreview,
          data: fileData
        });
      } else {
        setPreview({
          ...basePreview,
          tooLargeForPreview: true
        });
      }
    };
    void setDocPreview();
    // IMPORTANT: Can't include "document" or "preview" as a dep, or else we'll have an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldFetchFullDoc,
    docMimeType,
    docSize,
    docFileTypeLabel,
    fileName,
    documentHasContents,
    docContents,
    hasPassword,
    documentType
  ]);

  if (!loading && document?.documentType && !FILE_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ...EMPTY_RESPONSE,
      preview: {
        ...DEFAULT_PREVIEW,
        contentType: document?.documentType ?? NwContentType.File,
        fileTypeLabel: docFileTypeLabel ?? DEFAULT_FILE_TYPE_LABEL
      }
    };
  }

  return {
    preview,
    loading,
    error,
    refetch: () => void refetch({ request: { docID } })
  };
}

export default useFilePreview;
