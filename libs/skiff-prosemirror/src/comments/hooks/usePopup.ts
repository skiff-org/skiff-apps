import { useOnClickOutside } from '@skiff-org/skiff-ui';
import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { freezeAll } from '../../utils/scrollController';

const usePopup = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useOnClickOutside(
    ref,
    () => {
      setOpen(false);
    },
    undefined,
    undefined,
    undefined,
    isMobile
  );

  useEffect(() => {
    if (!open) return;
    const enableScroll = freezeAll();
    return enableScroll;
  }, [open]);

  return { ref, open, setOpen };
};
export default usePopup;
