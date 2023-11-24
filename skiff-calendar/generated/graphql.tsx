import * as Types from 'skiff-graphql';
export * from 'skiff-graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetEmailsWithUnreadIcsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetEmailsWithUnreadIcsQuery = { __typename?: 'Query', emailsWithUnreadICS2: { __typename?: 'EmailsWithUnreadICSResponse', hasMore: boolean, emails: Array<{ __typename?: 'Email', id: string, from: { __typename?: 'AddressObject', address: string }, attachmentMetadata: Array<{ __typename?: 'EncryptedAttachmentMetadata', attachmentID: string, encryptedData: { __typename?: 'EncryptedDataOutput', encryptedData: string } }>, encryptedSessionKey: { __typename?: 'EncryptedSessionKeyOutput', encryptedSessionKey: string, encryptedBy: { key: string } } }> } };

export type CalendarAttachmentFragment = { __typename?: 'Attachment', attachmentID: string, downloadLink: string, encryptedSessionKey: { __typename?: 'EncryptedSessionKeyOutput', encryptedSessionKey: string, encryptedBy: { key: string } } };

export type GetAttachmentsQueryVariables = Types.Exact<{
  ids: Array<Types.InputMaybe<Types.Scalars['String']>> | Types.InputMaybe<Types.Scalars['String']>;
}>;


export type GetAttachmentsQuery = { __typename?: 'Query', attachments?: Array<{ __typename?: 'Attachment', attachmentID: string, downloadLink: string, encryptedSessionKey: { __typename?: 'EncryptedSessionKeyOutput', encryptedSessionKey: string, encryptedBy: { key: string } } } | null> | null };

export type MarkEmailAsReadIcsMutationVariables = Types.Exact<{
  request: Types.MarkEmailAsReadIcsRequest;
}>;


export type MarkEmailAsReadIcsMutation = { __typename?: 'Mutation', markEmailAsReadICS?: any | null };

export type SendMessageMutationVariables = Types.Exact<{
  request: Types.SendEmailRequest;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage?: { __typename?: 'SendEmailResponse', messageID: string, threadID: string } | null };

export type DecryptionServicePublicKeyQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DecryptionServicePublicKeyQuery = { __typename?: 'Query', decryptionServicePublicKey?: { key: string } | null };

export type PulledCalendarEventsFragment = { __typename?: 'CalendarEvent', creatorCalendarID: string, calendarEventID: string, parentEventID: string, externalID: string, startDate: number, endDate: number, sequence: number, updatedAt: number, encryptedContent: string, encryptedSessionKey: string, encryptedByKey: string, externalCreator?: string | null, deleted: boolean, recurrenceDate?: number | null, parentRecurrenceID?: string | null, encryptedPreferences?: string | null, encryptedPreferencesSessionKey?: string | null, internalAttendeeList: Array<{ __typename?: 'InternalAttendee', permission: Types.AttendeePermission, status: Types.AttendeeStatus, calendarID: string, displayName?: string | null, email: string, optional: boolean, updatedAt: number, deleted: boolean, encryptedSessionKey: string, encryptedByKey: string }>, lastUpdateKeyMap?: { __typename?: 'LastUpdateKeyMap', deleted?: number | null, endDate?: number | null, parentRecurrenceID?: number | null, recurrenceDate?: number | null, recurrenceRule?: number | null, sequence?: number | null, startDate?: number | null } | null, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: Types.RecurrenceFrequency, interval?: number | null, count?: number | null, until?: number | null, byDays?: Array<Types.RecurrenceDay> | null, startDate: number, excludeDates: Array<number>, timezone?: string | null, isAllDay?: boolean | null } | null, reminders?: Array<{ __typename?: 'EventReminder', reminderID: string, timeUnit: Types.EventReminderTimeUnit, type: Types.EventReminderType, timeValue: number, timeForAllDay?: string | null }> | null };

export type GetPublicKeyForCalendarQueryVariables = Types.Exact<{
  calendarID: Types.Scalars['String'];
}>;


export type GetPublicKeyForCalendarQuery = { __typename?: 'Query', calendar: { __typename?: 'Calendar', publicKey: string } };

export type SyncMutationVariables = Types.Exact<{
  request: Types.SyncRequest;
}>;


export type SyncMutation = { __typename?: 'Mutation', sync?: { __typename?: 'SyncResponse', checkpoint?: number | null, state: Types.SyncState, events: Array<{ __typename?: 'CalendarEvent', creatorCalendarID: string, calendarEventID: string, parentEventID: string, externalID: string, startDate: number, endDate: number, sequence: number, updatedAt: number, encryptedContent: string, encryptedSessionKey: string, encryptedByKey: string, externalCreator?: string | null, deleted: boolean, recurrenceDate?: number | null, parentRecurrenceID?: string | null, encryptedPreferences?: string | null, encryptedPreferencesSessionKey?: string | null, internalAttendeeList: Array<{ __typename?: 'InternalAttendee', permission: Types.AttendeePermission, status: Types.AttendeeStatus, calendarID: string, displayName?: string | null, email: string, optional: boolean, updatedAt: number, deleted: boolean, encryptedSessionKey: string, encryptedByKey: string }>, lastUpdateKeyMap?: { __typename?: 'LastUpdateKeyMap', deleted?: number | null, endDate?: number | null, parentRecurrenceID?: number | null, recurrenceDate?: number | null, recurrenceRule?: number | null, sequence?: number | null, startDate?: number | null } | null, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: Types.RecurrenceFrequency, interval?: number | null, count?: number | null, until?: number | null, byDays?: Array<Types.RecurrenceDay> | null, startDate: number, excludeDates: Array<number>, timezone?: string | null, isAllDay?: boolean | null } | null, reminders?: Array<{ __typename?: 'EventReminder', reminderID: string, timeUnit: Types.EventReminderTimeUnit, type: Types.EventReminderType, timeValue: number, timeForAllDay?: string | null }> | null } | null> } | null };

export type Sync2MutationVariables = Types.Exact<{
  request: Types.SyncRequest2;
}>;


export type Sync2Mutation = { __typename?: 'Mutation', sync2?: { __typename?: 'SyncResponse', checkpoint?: number | null, state: Types.SyncState, events: Array<{ __typename?: 'CalendarEvent', creatorCalendarID: string, calendarEventID: string, parentEventID: string, externalID: string, startDate: number, endDate: number, sequence: number, updatedAt: number, encryptedContent: string, encryptedSessionKey: string, encryptedByKey: string, externalCreator?: string | null, deleted: boolean, recurrenceDate?: number | null, parentRecurrenceID?: string | null, encryptedPreferences?: string | null, encryptedPreferencesSessionKey?: string | null, internalAttendeeList: Array<{ __typename?: 'InternalAttendee', permission: Types.AttendeePermission, status: Types.AttendeeStatus, calendarID: string, displayName?: string | null, email: string, optional: boolean, updatedAt: number, deleted: boolean, encryptedSessionKey: string, encryptedByKey: string }>, lastUpdateKeyMap?: { __typename?: 'LastUpdateKeyMap', deleted?: number | null, endDate?: number | null, parentRecurrenceID?: number | null, recurrenceDate?: number | null, recurrenceRule?: number | null, sequence?: number | null, startDate?: number | null } | null, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: Types.RecurrenceFrequency, interval?: number | null, count?: number | null, until?: number | null, byDays?: Array<Types.RecurrenceDay> | null, startDate: number, excludeDates: Array<number>, timezone?: string | null, isAllDay?: boolean | null } | null, reminders?: Array<{ __typename?: 'EventReminder', reminderID: string, timeUnit: Types.EventReminderTimeUnit, type: Types.EventReminderType, timeValue: number, timeForAllDay?: string | null }> | null } | null> } | null };

export type GetEventsAroundDateQueryVariables = Types.Exact<{
  request: Types.EventAroundDateInput;
}>;


export type GetEventsAroundDateQuery = { __typename?: 'Query', eventsAroundDate: Array<{ __typename?: 'CalendarEvent', creatorCalendarID: string, calendarEventID: string, parentEventID: string, externalID: string, startDate: number, endDate: number, sequence: number, updatedAt: number, encryptedContent: string, encryptedSessionKey: string, encryptedByKey: string, externalCreator?: string | null, deleted: boolean, recurrenceDate?: number | null, parentRecurrenceID?: string | null, encryptedPreferences?: string | null, encryptedPreferencesSessionKey?: string | null, internalAttendeeList: Array<{ __typename?: 'InternalAttendee', permission: Types.AttendeePermission, status: Types.AttendeeStatus, calendarID: string, displayName?: string | null, email: string, optional: boolean, updatedAt: number, deleted: boolean, encryptedSessionKey: string, encryptedByKey: string }>, lastUpdateKeyMap?: { __typename?: 'LastUpdateKeyMap', deleted?: number | null, endDate?: number | null, parentRecurrenceID?: number | null, recurrenceDate?: number | null, recurrenceRule?: number | null, sequence?: number | null, startDate?: number | null } | null, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: Types.RecurrenceFrequency, interval?: number | null, count?: number | null, until?: number | null, byDays?: Array<Types.RecurrenceDay> | null, startDate: number, excludeDates: Array<number>, timezone?: string | null, isAllDay?: boolean | null } | null, reminders?: Array<{ __typename?: 'EventReminder', reminderID: string, timeUnit: Types.EventReminderTimeUnit, type: Types.EventReminderType, timeValue: number, timeForAllDay?: string | null }> | null }> };

export type GetEventsQueryVariables = Types.Exact<{
  request: Types.EventsInput;
}>;


export type GetEventsQuery = { __typename?: 'Query', events: Array<{ __typename?: 'CalendarEvent', creatorCalendarID: string, calendarEventID: string, parentEventID: string, externalID: string, startDate: number, endDate: number, sequence: number, updatedAt: number, encryptedContent: string, encryptedSessionKey: string, encryptedByKey: string, externalCreator?: string | null, deleted: boolean, recurrenceDate?: number | null, parentRecurrenceID?: string | null, encryptedPreferences?: string | null, encryptedPreferencesSessionKey?: string | null, internalAttendeeList: Array<{ __typename?: 'InternalAttendee', permission: Types.AttendeePermission, status: Types.AttendeeStatus, calendarID: string, displayName?: string | null, email: string, optional: boolean, updatedAt: number, deleted: boolean, encryptedSessionKey: string, encryptedByKey: string }>, lastUpdateKeyMap?: { __typename?: 'LastUpdateKeyMap', deleted?: number | null, endDate?: number | null, parentRecurrenceID?: number | null, recurrenceDate?: number | null, recurrenceRule?: number | null, sequence?: number | null, startDate?: number | null } | null, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: Types.RecurrenceFrequency, interval?: number | null, count?: number | null, until?: number | null, byDays?: Array<Types.RecurrenceDay> | null, startDate: number, excludeDates: Array<number>, timezone?: string | null, isAllDay?: boolean | null } | null, reminders?: Array<{ __typename?: 'EventReminder', reminderID: string, timeUnit: Types.EventReminderTimeUnit, type: Types.EventReminderType, timeValue: number, timeForAllDay?: string | null }> | null }> };

export type CreateCalendarUserMutationVariables = Types.Exact<{
  request: Types.CreateCalendarUserRequest;
}>;


export type CreateCalendarUserMutation = { __typename?: 'Mutation', createCalendarUser?: any | null };

export type GetUsersProfileDataQueryVariables = Types.Exact<{
  request: Types.GetUsersRequest;
}>;


export type GetUsersProfileDataQuery = { __typename?: 'Query', users?: Array<{ __typename?: 'User', userID: string, username: string, publicKey: { key: string }, signingPublicKey: string, publicData: { __typename?: 'PublicData', displayName?: string | null, displayPictureData?: { __typename?: 'DisplayPictureData', profileAccentColor?: string | null, profileCustomURI?: string | null, profileIcon?: string | null } | null }, primaryCalendar?: { __typename?: 'Calendar', calendarID: string } | null, calendars?: Array<{ __typename?: 'UserCalendar', calendarID: string, publicKey: string, encryptedPrivateKey?: string | null, encryptedByKey: string }> | null }> | null };

export type UserFromEmailAliasFragment = { __typename?: 'User', userID: string, primaryCalendar?: { __typename?: 'Calendar', calendarID: string, publicKey: string } | null };

export type UsersFromEmailAliasQueryVariables = Types.Exact<{
  emailAliases: Array<Types.Scalars['String']> | Types.Scalars['String'];
}>;


export type UsersFromEmailAliasQuery = { __typename?: 'Query', usersFromEmailAlias: Array<{ __typename?: 'User', userID: string, primaryCalendar?: { __typename?: 'Calendar', calendarID: string, publicKey: string } | null } | null> };

export type UserProfileDataWithCalendarsFragment = { __typename?: 'User', userID: string, username: string, publicKey: { key: string }, signingPublicKey: string, publicData: { __typename?: 'PublicData', displayName?: string | null, displayPictureData?: { __typename?: 'DisplayPictureData', profileAccentColor?: string | null, profileCustomURI?: string | null, profileIcon?: string | null } | null }, primaryCalendar?: { __typename?: 'Calendar', calendarID: string } | null, calendars?: Array<{ __typename?: 'UserCalendar', calendarID: string, publicKey: string, encryptedPrivateKey?: string | null, encryptedByKey: string }> | null };

export type CurrentUserQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'User', userID: string, username: string, publicKey: { key: string }, signingPublicKey: string, publicData: { __typename?: 'PublicData', displayName?: string | null, displayPictureData?: { __typename?: 'DisplayPictureData', profileAccentColor?: string | null, profileCustomURI?: string | null, profileIcon?: string | null } | null }, primaryCalendar?: { __typename?: 'Calendar', calendarID: string } | null, calendars?: Array<{ __typename?: 'UserCalendar', calendarID: string, publicKey: string, encryptedPrivateKey?: string | null, encryptedByKey: string }> | null } | null };

export type UnsetCalendarPushTokenMutationVariables = Types.Exact<{
  request: Types.UnsetCalendarPushTokenRequest;
}>;


export type UnsetCalendarPushTokenMutation = { __typename?: 'Mutation', unsetCalendarPushToken?: any | null };

export type SetCalendarPushTokenMutationVariables = Types.Exact<{
  request: Types.SetCalendarPushTokenRequest;
}>;


export type SetCalendarPushTokenMutation = { __typename?: 'Mutation', setCalendarPushToken?: any | null };

export const CalendarAttachmentFragmentDoc = /*#__PURE__*/ gql`
    fragment CalendarAttachment on Attachment {
  attachmentID
  downloadLink
  encryptedSessionKey {
    encryptedSessionKey
    encryptedBy
  }
}
    `;
export const PulledCalendarEventsFragmentDoc = /*#__PURE__*/ gql`
    fragment PulledCalendarEvents on CalendarEvent {
  creatorCalendarID
  calendarEventID
  parentEventID
  externalID
  startDate
  endDate
  sequence
  updatedAt
  encryptedContent
  encryptedSessionKey
  encryptedByKey
  externalCreator
  internalAttendeeList {
    permission
    status
    calendarID
    displayName
    email
    optional
    updatedAt
    deleted
    encryptedSessionKey
    encryptedByKey
  }
  deleted
  lastUpdateKeyMap {
    deleted
    endDate
    parentRecurrenceID
    recurrenceDate
    recurrenceRule
    sequence
    startDate
  }
  recurrenceDate
  parentRecurrenceID
  recurrenceRule {
    frequency
    interval
    count
    until
    byDays
    startDate
    excludeDates
    timezone
    isAllDay
  }
  encryptedPreferences
  encryptedPreferencesSessionKey
  reminders {
    reminderID
    timeUnit
    type
    timeValue
    timeForAllDay
  }
}
    `;
export const UserFromEmailAliasFragmentDoc = /*#__PURE__*/ gql`
    fragment UserFromEmailAlias on User {
  userID
  primaryCalendar {
    calendarID
    publicKey
  }
}
    `;
export const UserProfileDataWithCalendarsFragmentDoc = /*#__PURE__*/ gql`
    fragment UserProfileDataWithCalendars on User {
  userID
  username
  publicData {
    displayName
    displayPictureData {
      profileAccentColor
      profileCustomURI
      profileIcon
    }
  }
  publicKey
  signingPublicKey
  primaryCalendar {
    calendarID
  }
  calendars {
    calendarID
    publicKey
    encryptedPrivateKey
    encryptedByKey
  }
}
    `;
export const GetEmailsWithUnreadIcsDocument = /*#__PURE__*/ gql`
    query getEmailsWithUnreadICS {
  emailsWithUnreadICS2 {
    emails {
      id
      from {
        address
      }
      attachmentMetadata {
        attachmentID
        encryptedData {
          encryptedData
        }
      }
      encryptedSessionKey {
        encryptedSessionKey
        encryptedBy
      }
    }
    hasMore
  }
}
    `;

/**
 * __useGetEmailsWithUnreadIcsQuery__
 *
 * To run a query within a React component, call `useGetEmailsWithUnreadIcsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEmailsWithUnreadIcsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEmailsWithUnreadIcsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetEmailsWithUnreadIcsQuery(baseOptions?: Apollo.QueryHookOptions<GetEmailsWithUnreadIcsQuery, GetEmailsWithUnreadIcsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEmailsWithUnreadIcsQuery, GetEmailsWithUnreadIcsQueryVariables>(GetEmailsWithUnreadIcsDocument, options);
      }
export function useGetEmailsWithUnreadIcsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEmailsWithUnreadIcsQuery, GetEmailsWithUnreadIcsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEmailsWithUnreadIcsQuery, GetEmailsWithUnreadIcsQueryVariables>(GetEmailsWithUnreadIcsDocument, options);
        }
export type GetEmailsWithUnreadIcsQueryHookResult = ReturnType<typeof useGetEmailsWithUnreadIcsQuery>;
export type GetEmailsWithUnreadIcsLazyQueryHookResult = ReturnType<typeof useGetEmailsWithUnreadIcsLazyQuery>;
export type GetEmailsWithUnreadIcsQueryResult = Apollo.QueryResult<GetEmailsWithUnreadIcsQuery, GetEmailsWithUnreadIcsQueryVariables>;
export const GetAttachmentsDocument = /*#__PURE__*/ gql`
    query getAttachments($ids: [String]!) {
  attachments(ids: $ids) {
    ...CalendarAttachment
  }
}
    ${CalendarAttachmentFragmentDoc}`;

/**
 * __useGetAttachmentsQuery__
 *
 * To run a query within a React component, call `useGetAttachmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAttachmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAttachmentsQuery({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useGetAttachmentsQuery(baseOptions: Apollo.QueryHookOptions<GetAttachmentsQuery, GetAttachmentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAttachmentsQuery, GetAttachmentsQueryVariables>(GetAttachmentsDocument, options);
      }
export function useGetAttachmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAttachmentsQuery, GetAttachmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAttachmentsQuery, GetAttachmentsQueryVariables>(GetAttachmentsDocument, options);
        }
export type GetAttachmentsQueryHookResult = ReturnType<typeof useGetAttachmentsQuery>;
export type GetAttachmentsLazyQueryHookResult = ReturnType<typeof useGetAttachmentsLazyQuery>;
export type GetAttachmentsQueryResult = Apollo.QueryResult<GetAttachmentsQuery, GetAttachmentsQueryVariables>;
export const MarkEmailAsReadIcsDocument = /*#__PURE__*/ gql`
    mutation markEmailAsReadICS($request: MarkEmailAsReadICSRequest!) {
  markEmailAsReadICS(request: $request)
}
    `;
export type MarkEmailAsReadIcsMutationFn = Apollo.MutationFunction<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>;

/**
 * __useMarkEmailAsReadIcsMutation__
 *
 * To run a mutation, you first call `useMarkEmailAsReadIcsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkEmailAsReadIcsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markEmailAsReadIcsMutation, { data, loading, error }] = useMarkEmailAsReadIcsMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useMarkEmailAsReadIcsMutation(baseOptions?: Apollo.MutationHookOptions<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>(MarkEmailAsReadIcsDocument, options);
      }
export type MarkEmailAsReadIcsMutationHookResult = ReturnType<typeof useMarkEmailAsReadIcsMutation>;
export type MarkEmailAsReadIcsMutationResult = Apollo.MutationResult<MarkEmailAsReadIcsMutation>;
export type MarkEmailAsReadIcsMutationOptions = Apollo.BaseMutationOptions<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>;
export const SendMessageDocument = /*#__PURE__*/ gql`
    mutation sendMessage($request: SendEmailRequest!) {
  sendMessage(message: $request) {
    messageID
    threadID
  }
}
    `;
export type SendMessageMutationFn = Apollo.MutationFunction<SendMessageMutation, SendMessageMutationVariables>;

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useSendMessageMutation(baseOptions?: Apollo.MutationHookOptions<SendMessageMutation, SendMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendMessageMutation, SendMessageMutationVariables>(SendMessageDocument, options);
      }
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationResult = Apollo.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = Apollo.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const DecryptionServicePublicKeyDocument = /*#__PURE__*/ gql`
    query decryptionServicePublicKey {
  decryptionServicePublicKey
}
    `;

/**
 * __useDecryptionServicePublicKeyQuery__
 *
 * To run a query within a React component, call `useDecryptionServicePublicKeyQuery` and pass it any options that fit your needs.
 * When your component renders, `useDecryptionServicePublicKeyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDecryptionServicePublicKeyQuery({
 *   variables: {
 *   },
 * });
 */
export function useDecryptionServicePublicKeyQuery(baseOptions?: Apollo.QueryHookOptions<DecryptionServicePublicKeyQuery, DecryptionServicePublicKeyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DecryptionServicePublicKeyQuery, DecryptionServicePublicKeyQueryVariables>(DecryptionServicePublicKeyDocument, options);
      }
export function useDecryptionServicePublicKeyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DecryptionServicePublicKeyQuery, DecryptionServicePublicKeyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DecryptionServicePublicKeyQuery, DecryptionServicePublicKeyQueryVariables>(DecryptionServicePublicKeyDocument, options);
        }
export type DecryptionServicePublicKeyQueryHookResult = ReturnType<typeof useDecryptionServicePublicKeyQuery>;
export type DecryptionServicePublicKeyLazyQueryHookResult = ReturnType<typeof useDecryptionServicePublicKeyLazyQuery>;
export type DecryptionServicePublicKeyQueryResult = Apollo.QueryResult<DecryptionServicePublicKeyQuery, DecryptionServicePublicKeyQueryVariables>;
export const GetPublicKeyForCalendarDocument = /*#__PURE__*/ gql`
    query getPublicKeyForCalendar($calendarID: String!) {
  calendar(calendarID: $calendarID) {
    publicKey
  }
}
    `;

/**
 * __useGetPublicKeyForCalendarQuery__
 *
 * To run a query within a React component, call `useGetPublicKeyForCalendarQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPublicKeyForCalendarQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPublicKeyForCalendarQuery({
 *   variables: {
 *      calendarID: // value for 'calendarID'
 *   },
 * });
 */
export function useGetPublicKeyForCalendarQuery(baseOptions: Apollo.QueryHookOptions<GetPublicKeyForCalendarQuery, GetPublicKeyForCalendarQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPublicKeyForCalendarQuery, GetPublicKeyForCalendarQueryVariables>(GetPublicKeyForCalendarDocument, options);
      }
export function useGetPublicKeyForCalendarLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPublicKeyForCalendarQuery, GetPublicKeyForCalendarQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPublicKeyForCalendarQuery, GetPublicKeyForCalendarQueryVariables>(GetPublicKeyForCalendarDocument, options);
        }
export type GetPublicKeyForCalendarQueryHookResult = ReturnType<typeof useGetPublicKeyForCalendarQuery>;
export type GetPublicKeyForCalendarLazyQueryHookResult = ReturnType<typeof useGetPublicKeyForCalendarLazyQuery>;
export type GetPublicKeyForCalendarQueryResult = Apollo.QueryResult<GetPublicKeyForCalendarQuery, GetPublicKeyForCalendarQueryVariables>;
export const SyncDocument = /*#__PURE__*/ gql`
    mutation sync($request: SyncRequest!) {
  sync(request: $request) {
    checkpoint
    events {
      ...PulledCalendarEvents
    }
    state
  }
}
    ${PulledCalendarEventsFragmentDoc}`;
export type SyncMutationFn = Apollo.MutationFunction<SyncMutation, SyncMutationVariables>;

/**
 * __useSyncMutation__
 *
 * To run a mutation, you first call `useSyncMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSyncMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [syncMutation, { data, loading, error }] = useSyncMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useSyncMutation(baseOptions?: Apollo.MutationHookOptions<SyncMutation, SyncMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SyncMutation, SyncMutationVariables>(SyncDocument, options);
      }
export type SyncMutationHookResult = ReturnType<typeof useSyncMutation>;
export type SyncMutationResult = Apollo.MutationResult<SyncMutation>;
export type SyncMutationOptions = Apollo.BaseMutationOptions<SyncMutation, SyncMutationVariables>;
export const Sync2Document = /*#__PURE__*/ gql`
    mutation sync2($request: SyncRequest2!) {
  sync2(request: $request) {
    checkpoint
    events {
      ...PulledCalendarEvents
    }
    state
  }
}
    ${PulledCalendarEventsFragmentDoc}`;
export type Sync2MutationFn = Apollo.MutationFunction<Sync2Mutation, Sync2MutationVariables>;

/**
 * __useSync2Mutation__
 *
 * To run a mutation, you first call `useSync2Mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSync2Mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sync2Mutation, { data, loading, error }] = useSync2Mutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useSync2Mutation(baseOptions?: Apollo.MutationHookOptions<Sync2Mutation, Sync2MutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<Sync2Mutation, Sync2MutationVariables>(Sync2Document, options);
      }
export type Sync2MutationHookResult = ReturnType<typeof useSync2Mutation>;
export type Sync2MutationResult = Apollo.MutationResult<Sync2Mutation>;
export type Sync2MutationOptions = Apollo.BaseMutationOptions<Sync2Mutation, Sync2MutationVariables>;
export const GetEventsAroundDateDocument = /*#__PURE__*/ gql`
    query getEventsAroundDate($request: EventAroundDateInput!) {
  eventsAroundDate(request: $request) {
    ...PulledCalendarEvents
  }
}
    ${PulledCalendarEventsFragmentDoc}`;

/**
 * __useGetEventsAroundDateQuery__
 *
 * To run a query within a React component, call `useGetEventsAroundDateQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEventsAroundDateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEventsAroundDateQuery({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useGetEventsAroundDateQuery(baseOptions: Apollo.QueryHookOptions<GetEventsAroundDateQuery, GetEventsAroundDateQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEventsAroundDateQuery, GetEventsAroundDateQueryVariables>(GetEventsAroundDateDocument, options);
      }
export function useGetEventsAroundDateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEventsAroundDateQuery, GetEventsAroundDateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEventsAroundDateQuery, GetEventsAroundDateQueryVariables>(GetEventsAroundDateDocument, options);
        }
export type GetEventsAroundDateQueryHookResult = ReturnType<typeof useGetEventsAroundDateQuery>;
export type GetEventsAroundDateLazyQueryHookResult = ReturnType<typeof useGetEventsAroundDateLazyQuery>;
export type GetEventsAroundDateQueryResult = Apollo.QueryResult<GetEventsAroundDateQuery, GetEventsAroundDateQueryVariables>;
export const GetEventsDocument = /*#__PURE__*/ gql`
    query getEvents($request: EventsInput!) {
  events(request: $request) {
    ...PulledCalendarEvents
  }
}
    ${PulledCalendarEventsFragmentDoc}`;

/**
 * __useGetEventsQuery__
 *
 * To run a query within a React component, call `useGetEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEventsQuery({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useGetEventsQuery(baseOptions: Apollo.QueryHookOptions<GetEventsQuery, GetEventsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument, options);
      }
export function useGetEventsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEventsQuery, GetEventsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument, options);
        }
export type GetEventsQueryHookResult = ReturnType<typeof useGetEventsQuery>;
export type GetEventsLazyQueryHookResult = ReturnType<typeof useGetEventsLazyQuery>;
export type GetEventsQueryResult = Apollo.QueryResult<GetEventsQuery, GetEventsQueryVariables>;
export const CreateCalendarUserDocument = /*#__PURE__*/ gql`
    mutation createCalendarUser($request: CreateCalendarUserRequest!) {
  createCalendarUser(request: $request)
}
    `;
export type CreateCalendarUserMutationFn = Apollo.MutationFunction<CreateCalendarUserMutation, CreateCalendarUserMutationVariables>;

/**
 * __useCreateCalendarUserMutation__
 *
 * To run a mutation, you first call `useCreateCalendarUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCalendarUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCalendarUserMutation, { data, loading, error }] = useCreateCalendarUserMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useCreateCalendarUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateCalendarUserMutation, CreateCalendarUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCalendarUserMutation, CreateCalendarUserMutationVariables>(CreateCalendarUserDocument, options);
      }
export type CreateCalendarUserMutationHookResult = ReturnType<typeof useCreateCalendarUserMutation>;
export type CreateCalendarUserMutationResult = Apollo.MutationResult<CreateCalendarUserMutation>;
export type CreateCalendarUserMutationOptions = Apollo.BaseMutationOptions<CreateCalendarUserMutation, CreateCalendarUserMutationVariables>;
export const GetUsersProfileDataDocument = /*#__PURE__*/ gql`
    query getUsersProfileData($request: GetUsersRequest!) {
  users(request: $request) {
    ...UserProfileDataWithCalendars
  }
}
    ${UserProfileDataWithCalendarsFragmentDoc}`;

/**
 * __useGetUsersProfileDataQuery__
 *
 * To run a query within a React component, call `useGetUsersProfileDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersProfileDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersProfileDataQuery({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useGetUsersProfileDataQuery(baseOptions: Apollo.QueryHookOptions<GetUsersProfileDataQuery, GetUsersProfileDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUsersProfileDataQuery, GetUsersProfileDataQueryVariables>(GetUsersProfileDataDocument, options);
      }
export function useGetUsersProfileDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUsersProfileDataQuery, GetUsersProfileDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUsersProfileDataQuery, GetUsersProfileDataQueryVariables>(GetUsersProfileDataDocument, options);
        }
export type GetUsersProfileDataQueryHookResult = ReturnType<typeof useGetUsersProfileDataQuery>;
export type GetUsersProfileDataLazyQueryHookResult = ReturnType<typeof useGetUsersProfileDataLazyQuery>;
export type GetUsersProfileDataQueryResult = Apollo.QueryResult<GetUsersProfileDataQuery, GetUsersProfileDataQueryVariables>;
export const UsersFromEmailAliasDocument = /*#__PURE__*/ gql`
    query usersFromEmailAlias($emailAliases: [String!]!) {
  usersFromEmailAlias(emailAliases: $emailAliases) {
    ...UserFromEmailAlias
  }
}
    ${UserFromEmailAliasFragmentDoc}`;

/**
 * __useUsersFromEmailAliasQuery__
 *
 * To run a query within a React component, call `useUsersFromEmailAliasQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersFromEmailAliasQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersFromEmailAliasQuery({
 *   variables: {
 *      emailAliases: // value for 'emailAliases'
 *   },
 * });
 */
export function useUsersFromEmailAliasQuery(baseOptions: Apollo.QueryHookOptions<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>(UsersFromEmailAliasDocument, options);
      }
export function useUsersFromEmailAliasLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>(UsersFromEmailAliasDocument, options);
        }
export type UsersFromEmailAliasQueryHookResult = ReturnType<typeof useUsersFromEmailAliasQuery>;
export type UsersFromEmailAliasLazyQueryHookResult = ReturnType<typeof useUsersFromEmailAliasLazyQuery>;
export type UsersFromEmailAliasQueryResult = Apollo.QueryResult<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>;
export const CurrentUserDocument = /*#__PURE__*/ gql`
    query currentUser {
  currentUser {
    ...UserProfileDataWithCalendars
  }
}
    ${UserProfileDataWithCalendarsFragmentDoc}`;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const UnsetCalendarPushTokenDocument = /*#__PURE__*/ gql`
    mutation unsetCalendarPushToken($request: UnsetCalendarPushTokenRequest!) {
  unsetCalendarPushToken(request: $request)
}
    `;
export type UnsetCalendarPushTokenMutationFn = Apollo.MutationFunction<UnsetCalendarPushTokenMutation, UnsetCalendarPushTokenMutationVariables>;

/**
 * __useUnsetCalendarPushTokenMutation__
 *
 * To run a mutation, you first call `useUnsetCalendarPushTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnsetCalendarPushTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unsetCalendarPushTokenMutation, { data, loading, error }] = useUnsetCalendarPushTokenMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useUnsetCalendarPushTokenMutation(baseOptions?: Apollo.MutationHookOptions<UnsetCalendarPushTokenMutation, UnsetCalendarPushTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UnsetCalendarPushTokenMutation, UnsetCalendarPushTokenMutationVariables>(UnsetCalendarPushTokenDocument, options);
      }
export type UnsetCalendarPushTokenMutationHookResult = ReturnType<typeof useUnsetCalendarPushTokenMutation>;
export type UnsetCalendarPushTokenMutationResult = Apollo.MutationResult<UnsetCalendarPushTokenMutation>;
export type UnsetCalendarPushTokenMutationOptions = Apollo.BaseMutationOptions<UnsetCalendarPushTokenMutation, UnsetCalendarPushTokenMutationVariables>;
export const SetCalendarPushTokenDocument = /*#__PURE__*/ gql`
    mutation setCalendarPushToken($request: SetCalendarPushTokenRequest!) {
  setCalendarPushToken(request: $request)
}
    `;
export type SetCalendarPushTokenMutationFn = Apollo.MutationFunction<SetCalendarPushTokenMutation, SetCalendarPushTokenMutationVariables>;

/**
 * __useSetCalendarPushTokenMutation__
 *
 * To run a mutation, you first call `useSetCalendarPushTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetCalendarPushTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setCalendarPushTokenMutation, { data, loading, error }] = useSetCalendarPushTokenMutation({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useSetCalendarPushTokenMutation(baseOptions?: Apollo.MutationHookOptions<SetCalendarPushTokenMutation, SetCalendarPushTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetCalendarPushTokenMutation, SetCalendarPushTokenMutationVariables>(SetCalendarPushTokenDocument, options);
      }
export type SetCalendarPushTokenMutationHookResult = ReturnType<typeof useSetCalendarPushTokenMutation>;
export type SetCalendarPushTokenMutationResult = Apollo.MutationResult<SetCalendarPushTokenMutation>;
export type SetCalendarPushTokenMutationOptions = Apollo.BaseMutationOptions<SetCalendarPushTokenMutation, SetCalendarPushTokenMutationVariables>;