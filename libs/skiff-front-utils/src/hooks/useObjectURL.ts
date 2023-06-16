import { useEffect, useState } from 'react';

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
