import { useCallback } from 'react';
import { Icon, IconText } from '../../../skiff-ui/src';

interface ThreadShowMoreButtonProps {
  threadRef: React.RefObject<HTMLDivElement>;
  limitHeight: boolean;
  setLimitHeight: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ThreadShowMoreButton({ threadRef, limitHeight, setLimitHeight }: ThreadShowMoreButtonProps) {
  const threadHeight = threadRef.current?.getBoundingClientRect().height;
  const showButton = threadHeight && threadHeight >= 320;

  const showMore = useCallback(() => {
    setLimitHeight(false);
  }, []);
  const showLess = useCallback(() => {
    setLimitHeight(true);
  }, []);

  if (!showButton) return null;

  if (limitHeight) {
    return <IconText label='Show more' endIcon={Icon.ChevronDown} color='orange' onClick={showMore} />;
  } else {
    return <IconText label='Show less' endIcon={Icon.ChevronUp} color='orange' onClick={showLess} />;
  }
}
