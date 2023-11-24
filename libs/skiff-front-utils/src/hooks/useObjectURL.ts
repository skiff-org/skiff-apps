import { useEffect, useState } from 'react';

const ALLOWED_IMAGE_TYPES = [
  'application/octet-stream', // Octet-stream is required to paste images from clipboard
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Hook to get the object URL of a media object -- memoization and garbage collection included
 * @returns {object} getter, setter, and object URL
 */
export default function useObjectURL() {
  const [object, setObject] = useState<File | Blob | MediaSource | null>(null);
  const [objectURL, setObjectURL] = useState<string | null>(null);

  useEffect(() => {
    if (!object) {
      return;
    }

    if ('type' in object && !ALLOWED_IMAGE_TYPES.includes(object.type)) {
      throw new Error(`Unsupported image type "${object.type}".`);
    }

    const createdObjectURL = URL.createObjectURL(object);
    setObjectURL(createdObjectURL);

    // Free up previous object URL on change
    return () => {
      URL.revokeObjectURL(createdObjectURL);
      setObjectURL(null);
    };
  }, [object]);

  return {
    object,
    setObject,
    objectURL
  };
}
