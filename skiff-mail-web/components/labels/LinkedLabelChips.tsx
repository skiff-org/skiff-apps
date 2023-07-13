import Link from 'next/link';
import { ChipSize } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../constants/mailbox.constants';
import { UserLabelAlias, UserLabelPlain, getURLFromLabel, getUrlFromUserLabelAndThreadID } from '../../utils/label';

import { LabelChip } from './LabelChip';

interface LinkedLabelChipsProps {
  userLabels: (UserLabelPlain | UserLabelAlias)[];
  threadID: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipSize;
  deletable?: boolean;
}

export const LinkedLabelChips: React.FC<LinkedLabelChipsProps> = ({
  userLabels,
  threadID,
  onClick,
  deletable,
  size
}: LinkedLabelChipsProps) => {
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`, { noSsr: true });

  return (
    <>
      {userLabels.map((userLabel) => {
        const { name, variant, value } = userLabel;

        // clicking on the chip should
        // - redirect to label/alias inbox on mobile
        // - redirect to label/alias inbox with opened thread on desktop if in split inbox view
        //   do not open thread if in full view mode or if in compact mode (ie screen size is too small for split view)
        const mobileUrl = getURLFromLabel(userLabel);
        const desktopUrl =
          threadFormat === ThreadDisplayFormat.Full || isCompact
            ? getURLFromLabel(userLabel)
            : getUrlFromUserLabelAndThreadID(name, threadID, variant);

        return (
          <Link href={isMobile ? mobileUrl : desktopUrl} key={value} passHref>
            <LabelChip
              // alias labels are not allowed to be deleted manually
              deletable={variant === UserLabelVariant.Alias ? false : deletable}
              onClick={onClick}
              size={size}
              userLabel={userLabel}
            />
          </Link>
        );
      })}
    </>
  );
};
