import Link from 'next/link';
import { Avatar, Chip, ChipProps, Icon, Icons, Size } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../constants/mailbox.constants';
import { UserLabelAlias, UserLabelPlain, getURLFromLabel, getUrlFromUserLabelAndThreadID } from '../../utils/label';

interface LabelChipsProps {
  userLabels: (UserLabelPlain | UserLabelAlias)[];
  threadID: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipProps['size'];
}

export const LabelChips: React.FC<LabelChipsProps> = ({ userLabels, threadID, onClick, size }: LabelChipsProps) => {
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`, { noSsr: true });

  return (
    <>
      {userLabels.map((userLabel) => {
        // clicking on the chip should
        // - redirect to label/alias inbox on mobile
        // - redirect to label/alias inbox with opened thread on desktop if in split inbox view
        //   do not open thread if in full view mode or if in compact mode (ie screen size is too small for split view)
        const mobileUrl = getURLFromLabel(userLabel);
        const desktopUrl =
          threadFormat === ThreadDisplayFormat.Full || isCompact
            ? getURLFromLabel(userLabel)
            : getUrlFromUserLabelAndThreadID(userLabel.name, threadID, userLabel.variant);

        const startIcon =
          userLabel.variant === UserLabelVariant.Alias ? (
            <Avatar label={userLabel.name} rounded size={Size.X_SMALL} />
          ) : (
            <Icons color={userLabel.color} icon={Icon.Dot} />
          );

        return (
          <Link href={isMobile ? mobileUrl : desktopUrl} key={userLabel.value} passHref>
            <Chip key={userLabel.value} label={userLabel.name} onClick={onClick} size={size} startIcon={startIcon} />
          </Link>
        );
      })}
    </>
  );
};