import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from 'nightwatch-ui';
import { useEffect, useState } from 'react';

import { getProgressViewText } from '../MailboxProgress/MailboxProgress.constants';
import { Progress } from '../MailboxProgress/MailboxProgress.types';
import MailboxProgressItem from '../MailboxProgress/MailboxProgressItem';

import {
  importProgressCopy,
  SWITCH_PROGRESS_STATE_DURATION,
  suggestingSendersToSilenceCopy
} from './ImportProgress.constants';

interface ImportProgressItemProps {
  width: number;
  numProcessed: number;
}

export const MAIL_PROGRESS_ITEM_HEIGHT = 74;

export const ImportProgressItem: React.FC<ImportProgressItemProps> = ({
  width,
  numProcessed
}: ImportProgressItemProps) => {
  const [showSuggestingNoisySendersProgress, setShowSuggestingNoisySendersProgress] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSuggestingNoisySendersProgress((prev) => !prev);
    }, SWITCH_PROGRESS_STATE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const progress: Progress = { numProcessed };

  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        animate={{ opacity: 1, transition: { duration: 1 } }}
        exit={{ opacity: 0.5 }}
        initial={{ opacity: 0.5 }}
        key={showSuggestingNoisySendersProgress ? 'suggesting-noisy-senders' : 'import-in-progress'}
      >
        {/**
         * Only show import in progress banner if imports are complete. We still render
         * this component even if the imports are complete but the silencing suggestions
         * job is still running.
         */}
        {!showSuggestingNoisySendersProgress && (
          <MailboxProgressItem
            description={getProgressViewText(importProgressCopy.title, importProgressCopy.description)}
            progress={progress}
            width={width}
          />
        )}
        {showSuggestingNoisySendersProgress && (
          <MailboxProgressItem
            description={getProgressViewText(
              suggestingSendersToSilenceCopy.title,
              suggestingSendersToSilenceCopy.description
            )}
            icon={Icon.SoundSlash}
            iconBgColor='none'
            iconColor='link'
            progress={progress}
            width={width}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
