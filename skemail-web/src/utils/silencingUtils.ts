import pluralize from 'pluralize';
import {
  GetSilenceSenderSuggestionsDocument,
  GetSilencedSendersDocument,
  GetThreadFromIdDocument,
  UnsilenceMultipleEmailAddressesDocument,
  UnsilenceMultipleEmailAddressesMutation,
  UnsilenceMultipleEmailAddressesMutationVariables
} from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION, useToast } from 'skiff-front-utils';
import { SilenceSenderBulkSuggestion, SilencedDomainAggregation, WorkspaceEventType } from 'skiff-graphql';

import client from '../apollo/client';

import { storeWorkspaceEvent } from './userUtils';

type EnqueueToast = ReturnType<typeof useToast>['enqueueToast'];

export const unsilenceSenders = async (
  addresses: Array<string>,
  enqueueToast: EnqueueToast,
  cleanUp?: () => void,
  isMarkNotNoise?: boolean,
  activeThreadID?: string
) => {
  try {
    await client.mutate<UnsilenceMultipleEmailAddressesMutation, UnsilenceMultipleEmailAddressesMutationVariables>({
      mutation: UnsilenceMultipleEmailAddressesDocument,
      variables: {
        request: {
          emailAddressesToUnsilence: addresses
        }
      },
      refetchQueries: [
        { query: GetSilenceSenderSuggestionsDocument },
        { query: GetSilencedSendersDocument },
        { query: GetThreadFromIdDocument, variables: { threadID: activeThreadID || '' } }
      ]
    });
    void storeWorkspaceEvent(
      isMarkNotNoise ? WorkspaceEventType.MarkNotNoise : WorkspaceEventType.MarkUnsilence,
      `${addresses.length}`,
      DEFAULT_WORKSPACE_EVENT_VERSION
    );
    enqueueToast({
      title: `${pluralize('sender', addresses.length, true)} ${!isMarkNotNoise ? 'unsilenced' : 'marked as not noise'}`,
      body: `You will always receive emails from
      ${addresses.length === 1 ? addresses[0] || 'this address' : 'these addresses'}.`
    });
    // Take any clean up actions needed after unsilencing the sender
    cleanUp?.();
  } catch (error) {
    enqueueToast({
      title: `Failed to ${!isMarkNotNoise ? 'unsilence' : 'mark'} sender${!isMarkNotNoise ? '' : 's as not noise'}`,
      body: `Failed to ${!isMarkNotNoise ? 'unsilence' : 'mark'} sender${
        !isMarkNotNoise ? '' : ' as not noise'
      }. Please try again later.`
    });
  }
};

export const getTotalEmailsAndSenders = (
  silenceSenderSuggestions: SilencedDomainAggregation[],
  silenceSenderIndividuals: SilenceSenderBulkSuggestion[]
): {
  totalEmails: number;
  totalSenders: number;
  totalBytes: number;
} => {
  let totalEmails = 0;
  let totalSenders = 0;
  let totalBytes = 0;

  for (const suggestion of silenceSenderSuggestions) {
    totalEmails += suggestion.senders.reduce((acc, sender) => acc + sender.messageCount, 0);
    totalSenders += suggestion.senders.length;
    totalBytes += suggestion.senders.reduce((acc, sender) => acc + (sender?.totalBytes || 0), 0);
  }

  for (const individual of silenceSenderIndividuals) {
    totalEmails += individual.messageCount;
    totalSenders += 1;
    totalBytes += individual.totalBytes || 0;
  }

  return { totalEmails, totalSenders, totalBytes };
};
