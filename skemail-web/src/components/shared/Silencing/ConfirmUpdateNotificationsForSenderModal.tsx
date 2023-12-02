import { ApolloCache, NormalizedCacheObject } from '@apollo/client';
import pluralize from 'pluralize';
import {
  GetSilenceSenderSuggestionsDocument,
  GetSilencedSendersDocument,
  ThreadWithoutContentFragment,
  ThreadWithoutContentFragmentDoc,
  useMuteNotificationForSenderMutation,
  useUnmuteNotificationForSenderMutation
} from 'skiff-front-graphql';
import { ConfirmModal, useToast } from 'skiff-front-utils';

export enum NotificationsForSenderState {
  ON = 'On',
  OFF = 'Off'
}

interface ConfirmUpdateNotificationsForSenderModalProps {
  confirmHideNotificationsOpen: boolean;
  setConfirmHideNotificationsOpen: (open: boolean) => void;
  emailAddresses: string[];
  state: NotificationsForSenderState;
  threadID?: string;
  closeBanner?: () => void;
}

export const ConfirmUpdateNotificationsForSenderModal: React.FC<ConfirmUpdateNotificationsForSenderModalProps> = ({
  confirmHideNotificationsOpen,
  setConfirmHideNotificationsOpen,
  emailAddresses,
  state,
  threadID,
  closeBanner
}: ConfirmUpdateNotificationsForSenderModalProps) => {
  const { enqueueToast } = useToast();

  const [muteNotificationsForSender, { loading: muteNotificationsLoading }] = useMuteNotificationForSenderMutation();
  const [unmuteNotificationsForSender, { loading: unmuteNotificationsLoading }] =
    useUnmuteNotificationForSenderMutation();

  const turnNotificationsOff = state === NotificationsForSenderState.OFF;

  const updateNotificationsMutedStateInCache = (cache: ApolloCache<NormalizedCacheObject>, updatedState: boolean) => {
    if (!threadID) return;
    const cacheID = cache.identify({ __typename: 'UserThread', threadID });
    cache.updateFragment<ThreadWithoutContentFragment>(
      { id: cacheID, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' },
      (existing) => {
        if (!existing) return null;
        return {
          ...existing,
          emails: existing.emails.map((email) => ({
            ...email,
            notificationsTurnedOffForSender: updatedState
          }))
        };
      }
    );
  };

  const turnOffNotifications = async (sendersToMute: string[]) => {
    try {
      await muteNotificationsForSender({
        variables: {
          request: {
            emailAddresses: sendersToMute
          }
        },
        refetchQueries: [{ query: GetSilenceSenderSuggestionsDocument }, { query: GetSilencedSendersDocument }],
        update: (cache: ApolloCache<NormalizedCacheObject>) => {
          updateNotificationsMutedStateInCache(cache, true);
        }
      });
      enqueueToast({
        title: 'Notifications turned off',
        body: 'You will no longer receive notifications for emails from the sender'
      });
      closeBanner?.();
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Failed to turn off notifications',
        body: 'Could not turn off notifications for sender. Please try again later.'
      });
    }
  };

  const turnOnNotifications = async (sendersToMute: string[]) => {
    try {
      await unmuteNotificationsForSender({
        variables: {
          request: {
            emailAddresses: sendersToMute
          }
        },
        update: (cache: ApolloCache<NormalizedCacheObject>) => {
          updateNotificationsMutedStateInCache(cache, false);
        }
      });
      enqueueToast({
        title: 'Notifications turned on',
        body: 'You will start receiving notifications for emails from the sender'
      });
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Failed to turn on notifications',
        body: 'Could not turn on notifications for sender. Please try again later.'
      });
    }
  };

  return (
    <ConfirmModal
      confirmName={turnNotificationsOff ? 'Turn off' : 'Turn on'}
      description={`You will ${
        turnNotificationsOff ? 'no longer receive' : 'start receiving'
      } notifications for emails from ${
        emailAddresses.length === 1
          ? emailAddresses[0] || 'this address'
          : pluralize('address', emailAddresses.length, true)
      }.`}
      destructive
      loading={unmuteNotificationsLoading || muteNotificationsLoading}
      onClose={(e?: React.MouseEvent) => {
        e?.stopPropagation();
        setConfirmHideNotificationsOpen(false);
      }}
      onConfirm={async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (turnNotificationsOff) {
          await turnOffNotifications(emailAddresses);
        } else {
          await turnOnNotifications(emailAddresses);
        }
        setConfirmHideNotificationsOpen(false);
      }}
      open={confirmHideNotificationsOpen}
      title={`${turnNotificationsOff ? 'Turn off' : 'Turn on'} notifications`}
    />
  );
};
