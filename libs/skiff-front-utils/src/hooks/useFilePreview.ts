import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { DocumentBaseFragment } from 'skiff-front-graphql';
import { DocumentDecryptedContents, NwContentType } from 'skiff-graphql';
import { mbToBytes } from 'skiff-utils';

import {
  DEFAULT_FILE_TYPE_LABEL,
  PreviewObject
} from '../components/FileViewer/RecentFilePreview/RecentFilePreview.types';
import { GenericDocument } from '../types';
import {
  FILE_DOCUMENT_TYPES,
  FileTypes,
  createAndUpdateThumbnail,
  docHasContents,
  getDocumentBaseFromCache,
  getFileDocFileTypeLabel,
  getFileDocMimeType,
  getFileDocSize,
  getFileTypeFromMimeType,
  getGenericDocumentContents
} from '../utils';

import { useDocument } from './useDocument';
import { getMediaURL } from './useMediaURL';

const DEFAULT_PREVIEW: PreviewObject = {
  data: '',
  contentType: NwContentType.File,
  tooLargeForPreview: false,
  fileTypeLabel: DEFAULT_FILE_TYPE_LABEL,
  fileName: ''
};

const EMPTY_PREVIEW_RESPONSE = { loading: false, error: undefined, preview: DEFAULT_PREVIEW, refetch: () => { } };
// Max preview file size
export const MAX_PREVIEW_FILE_SIZE = mbToBytes(200); // 200 MB

// Will contain DocumentBaseFragment if cached or full document
// Will only contain decryptedContents if full document is fetched
type CachedOrFullDocument = DocumentBaseFragment & {
  decryptedContents?: DocumentDecryptedContents;
  decryptedThumbnail?: string;
};

interface FilePreviewRequest {
  docID: string;
  client: ApolloClient<NormalizedCacheObject>;
  // Include the data needed to render the preview image
  // IMPORTANT: This will make a fullDoc call, instead of using cached data
  includeFileData: boolean;
  getThumbnail?: boolean;
}

const DOC_TYPES_TO_SHOW_THUMBNAIL: NwContentType[] = [NwContentType.File];
const FILE_TYPES_TO_SHOW_THUMBNAIL = [FileTypes.Image];

const DOC_TYPES_TO_PREVIEW = [NwContentType.File, NwContentType.Pdf];
const FILE_TYPES_TO_PREVIEW = [
  FileTypes.Image,
  FileTypes.Icon,
  FileTypes.Video,
  FileTypes.Pdf,
  FileTypes.Word,
  FileTypes.Code,
  FileTypes.Sheet,
  FileTypes.Sound,
  FileTypes.MarkDown,
  FileTypes.Text
];

const decideShouldFetchFullDoc = (
  includeFileData: boolean,
  cachedDocumentInfo: DocumentBaseFragment | null,
  checkThumbnail: boolean
): boolean => {
  const cachedDocType = cachedDocumentInfo?.documentType;
  const cachedMimeType = cachedDocumentInfo?.decryptedMetadata?.mimeType;
  const cachedFileType = getFileTypeFromMimeType(cachedMimeType ?? '');
  const supportedDocTypesList = checkThumbnail ? DOC_TYPES_TO_SHOW_THUMBNAIL : DOC_TYPES_TO_PREVIEW;
  const supportedFileTypesList = checkThumbnail ? FILE_TYPES_TO_SHOW_THUMBNAIL : FILE_TYPES_TO_PREVIEW;

  return (
    includeFileData &&
    (!cachedDocType || supportedDocTypesList.includes(cachedDocType)) &&
    (!cachedMimeType || supportedFileTypesList.includes(cachedFileType))
  );
};

/**
 * Returns a preview object for a given document ID
 * If the document is not a file, returns an empty preview object
 */
export function useFilePreview({ docID, client, includeFileData, getThumbnail = false }: FilePreviewRequest): {
  preview: PreviewObject;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
} {
  const [preview, setPreview] = useState<PreviewObject>(DEFAULT_PREVIEW);
  const loadedDocID = useRef<string | null>(null); // The id of the doc that that preview data contains

  const cachedDocumentInfo = getDocumentBaseFromCache(docID, client);

  const shouldFetchFullDoc = decideShouldFetchFullDoc(includeFileData, cachedDocumentInfo, getThumbnail);
  const { data, loading, error, refetch } = useDocument(shouldFetchFullDoc ? docID : false, client);

  const document: CachedOrFullDocument | null = data?.document ?? cachedDocumentInfo;

  const documentHasContents = document && docHasContents(document);

  const docContents: GenericDocument | undefined = documentHasContents
    ? getGenericDocumentContents(document)
    : undefined;

  // shared
  const docSize = document ? getFileDocSize(document) : undefined;
  const docMimeType = document ? getFileDocMimeType(document) : undefined;
  const fileName = document?.decryptedMetadata.title ?? '';
  const docFileTypeLabel = document
    ? getFileDocFileTypeLabel(document) ?? DEFAULT_FILE_TYPE_LABEL
    : DEFAULT_FILE_TYPE_LABEL;
  const documentType = document?.documentType ?? NwContentType.File;

  // thumbnail specific
  const docFileType = getFileTypeFromMimeType(docMimeType ?? '');
  const supportsThumbnail = FILE_TYPES_TO_SHOW_THUMBNAIL.includes(docFileType);
  const thumbnailData = document?.decryptedThumbnail ?? undefined;
  const shouldCreateThumbnail = supportsThumbnail && !thumbnailData;

  // full doc preview specific
  const hasPassword = docContents?.hasPassword;

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
        loadedDocID.current = docID;
        setPreview(basePreview);
        return;
      }

      if (!shouldCreateThumbnail && getThumbnail) {
        loadedDocID.current = docID;
        setPreview({
          ...basePreview,
          data: thumbnailData ?? basePreview.data
        });
        return;
      }

      // If we downloaded the preview data
      if ((docSize || Math.max()) < MAX_PREVIEW_FILE_SIZE) {
        const fileData = documentHasContents ? (await getMediaURL(document)) ?? '' : '';

        if (hasPassword || !docContents) {
          // doc locked
          return;
        }

        loadedDocID.current = docID;
        setPreview({
          ...basePreview,
          data: fileData
        });

        if (shouldCreateThumbnail && getThumbnail) {
          try {
            await createAndUpdateThumbnail(fileData, client, docID, docMimeType);
          } catch (err) {
            console.warn('could not create thumbnail');
          }
        }
      } else {
        loadedDocID.current = docID;
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
    documentType,
    hasPassword,
    shouldCreateThumbnail
  ]);

  if (!loading && document?.documentType && !FILE_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ...EMPTY_PREVIEW_RESPONSE,
      preview: {
        ...DEFAULT_PREVIEW,
        contentType: document.documentType,
        fileTypeLabel: docFileTypeLabel
      }
    };
  }

  return {
    preview,
    loading: loading || loadedDocID.current !== docID, // If the docID used in preview is not the same as current docID, then preview is still loading
    error,
    refetch: () => void refetch({ request: { docID } })
  };
}

export default useFilePreview;
