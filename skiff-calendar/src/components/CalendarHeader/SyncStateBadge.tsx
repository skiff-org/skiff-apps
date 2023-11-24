import { Chip, Icon, Size } from 'nightwatch-ui';
import { useCallback } from 'react';

import { CalendarLocalSyncState, useSyncState } from '../../storage/useSync';

const badgesByState: {
  [state in Exclude<CalendarLocalSyncState, CalendarLocalSyncState.Synced>]: { icon: Icon; label: string };
} = {
  [CalendarLocalSyncState.Offline]: {
    icon: Icon.WifiSlash,
    label: 'Offline'
  },
  [CalendarLocalSyncState.Syncing]: {
    icon: Icon.Thunderstorm,
    label: 'Syncing'
  },
  [CalendarLocalSyncState.Error]: {
    icon: Icon.Warning,
    label: 'Error'
  }
};

export const SyncStateBadge = () => {
  const { state: syncState, error } = useSyncState();
  const copyErrorToClipboard = useCallback(async () => {
    if (!error) return;
    await navigator.clipboard.writeText(error);
  }, [error]);

  if (syncState === CalendarLocalSyncState.Synced) return null;

  const { icon, label } = badgesByState[syncState];

  const errorTooltip = (
    <div>
      Could not sync. Log out and log back in.
      {!!error && (
        <>
          <br /> Click to copy the error.
        </>
      )}
    </div>
  );

  return (
    <Chip
      color='secondary'
      icon={icon}
      label={label}
      onClick={!!error ? () => void copyErrorToClipboard() : undefined}
      size={Size.SMALL}
      tooltip={syncState === CalendarLocalSyncState.Error ? errorTooltip : undefined}
    />
  );
};

export default SyncStateBadge;
