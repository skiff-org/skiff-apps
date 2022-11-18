import { isString } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { getLabelFromPathParams } from '../utils/label';

// Get current label from path params
export const useCurrentLabel = () => {
  const router = useRouter();
  const { hash } = window.location;
  const initialUserLabel = hash.length ? decodeURIComponent(hash.slice(1)) : null;
  const [userLabel, setUserLabel] = useState(initialUserLabel);

  // Update userLabel when hash changes
  useEffect(() => {
    const onHashChangeStart = (url: string) => {
      const labelFromHash = decodeURIComponent(url.slice(url.indexOf('#') + 1));
      setUserLabel(labelFromHash);
    };

    router.events.on('hashChangeStart', onHashChangeStart);

    return () => {
      router.events.off('hashChangeStart', onHashChangeStart);
    };
  }, [router.events]);

  if (isString(router.query.systemLabel)) {
    const label = getLabelFromPathParams(router.query.systemLabel);
    if (label) return label;
  }

  if (userLabel) {
    return userLabel;
  }

  return null;
};
