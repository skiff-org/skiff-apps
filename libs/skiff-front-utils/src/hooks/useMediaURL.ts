import { useState, useEffect } from 'react';

import { DocumentWithDecryptedContents } from '../types';
import { getGenericDocumentContents } from '../utils';

import { getFullFile } from './largeFileUtils';

/**
 * Hook to get base64 src data from a genric file
 * @param {Document} document - document object
 */

export const getMediaURL = async (document?: DocumentWithDecryptedContents) => {
  if (!document) return null;

  const genericDocumentContents = getGenericDocumentContents(document);

  if (!genericDocumentContents) {
    return null;
  }

  const { documentData, uploadedToCache } = genericDocumentContents;

  if (uploadedToCache) {
    // cache key is downloadedContents
    const updatedContents = await getFullFile(genericDocumentContents, document.decryptedMetadata.mimeType);
    return URL.createObjectURL(updatedContents);
  } else {
    return documentData;
  }
};

function useMediaURL(document?: DocumentWithDecryptedContents) {
  // Stores base64 representation of image once fetched
  const [base64src, setBase64src] = useState('');

  useEffect(() => {
    const getBase64src = async () => {
      const newBase64src = await getMediaURL(document);
      setBase64src(newBase64src ?? '');
    };
    void getBase64src();
  }, [document]);

  return base64src;
}

export default useMediaURL;
