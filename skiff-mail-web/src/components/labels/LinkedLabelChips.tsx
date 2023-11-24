import { ChipSize } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { WalletAliasWithName, useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { FULL_VIEW_BREAKPOINT } from '../../constants/mailbox.constants';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import {
  UserLabelAlias,
  UserLabelPlain,
  UserLabelQuickAlias,
  getURLFromLabel,
  getUrlFromUserLabelAndThreadID
} from '../../utils/label';
import { useNavigate } from '../../utils/navigation';

import { LabelChip } from './LabelChip';

interface LinkedLabelChipsProps {
  userLabels: (UserLabelPlain | UserLabelAlias | UserLabelQuickAlias)[];
  threadID: string;
  walletAliasesWithName: WalletAliasWithName[];
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipSize;
  deletable?: boolean;
}

export const LinkedLabelChips: React.FC<LinkedLabelChipsProps> = ({
  userLabels,
  threadID,
  walletAliasesWithName,
  onClick,
  deletable,
  size
}: LinkedLabelChipsProps) => {
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`, { noSsr: true });
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const { setActiveThreadID } = useThreadActions();

  return (
    <>
      {userLabels.map((userLabel) => {
        const { name, variant, value } = userLabel;

        const isQuickAlias = variant === UserLabelVariant.QuickAlias;
        const shouldSetActiveThread = threadFormat !== ThreadDisplayFormat.Full && !isCompact && !isMobile;

        // clicking on the chip should
        // - redirect to label/alias inbox on mobile
        // - redirect to label/alias inbox with opened thread on desktop if in split inbox view
        //   do not open thread if in full view mode or if in compact mode (ie screen size is too small for split view)
        const mobileUrl = getURLFromLabel(userLabel);
        const desktopUrl = shouldSetActiveThread
          ? getUrlFromUserLabelAndThreadID(name, threadID, variant)
          : getURLFromLabel(userLabel);
        return isQuickAlias ? ( // for quick aliases, navigate to system label and set appropriate filter
          <LabelChip
            onClick={(e: React.MouseEvent) => {
              if (onClick) onClick(e);
              if (!isMobile) {
                // filtering not yet supported on mobile
                dispatch(
                  skemailMailboxReducer.actions.toggleQuickAliasSelect({
                    quickAlias: name,
                    selected: true
                  })
                );
              }
              navigateToSystemLabel(SystemLabels.QuickAliases);
              if (shouldSetActiveThread) {
                setActiveThreadID({ threadID }, true);
              }
            }}
            size={size}
            userLabel={userLabel}
            walletAliasesWithName={walletAliasesWithName}
          />
        ) : (
          <Link key={value} to={isMobile ? mobileUrl : desktopUrl}>
            <LabelChip
              // alias labels are not allowed to be deleted manually
              deletable={variant === UserLabelVariant.Alias ? false : deletable}
              onClick={onClick}
              size={size}
              userLabel={userLabel}
              walletAliasesWithName={walletAliasesWithName}
            />
          </Link>
        );
      })}
    </>
  );
};
