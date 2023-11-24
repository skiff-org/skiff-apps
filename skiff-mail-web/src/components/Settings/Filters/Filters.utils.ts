import { generateSymmetricKey } from 'skiff-crypto';
import { decryptDatagramV2, decryptSessionKey, encryptDatagramV2, encryptSessionKey } from 'skiff-crypto';
import { AddressObjectWithDisplayPicture, requireCurrentUserData } from 'skiff-front-utils';
import {
  CreateMailFilterInput,
  FilterActionInput,
  MailFilterInput,
  ActionType as ActionTypeGraphQL,
  FilterType as FilterTypeGraphQL,
  FilterField as FilterFieldGraphQL,
  MailFilter as MailFilterGraphQL,
  MailFilterField as MailFilterFieldGraphQL
} from 'skiff-graphql';
import { filterExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { UserLabelPlain, isFolder } from '../../../utils/label';

import { ConditionComparator, ConditionType, ENCRYPTED_CONDITION_TYPES_TO_DATAGRAM } from './Filters.constants';
import {
  MoveToType,
  Condition,
  Action,
  Filter,
  isAddressType,
  ConditionValue,
  isContactConditionValue
} from './Filters.types';

export const createConditionID = () => {
  return v4();
};

export const getAvailableConditionTypes = () => {
  return Object.values(ConditionType);
};

const conditionTypeToGraphQLFilterType = (conditionType: ConditionType) => {
  switch (conditionType) {
    case ConditionType.To:
      return FilterTypeGraphQL.Recipient;
    case ConditionType.From:
      return FilterTypeGraphQL.From;
    case ConditionType.Body:
      return FilterTypeGraphQL.Body;
    case ConditionType.Subject:
      return FilterTypeGraphQL.Subject;
    default:
      return undefined;
  }
};

const encryptConditionValue = (conditionType: ConditionType, conditionValue: string, sessionKey: string) => {
  const datagram = ENCRYPTED_CONDITION_TYPES_TO_DATAGRAM[conditionType];
  // If there is no datagram, we assume that this condition type does not need to be decrypted
  if (!datagram) return undefined;
  return encryptDatagramV2(datagram, {}, { text: conditionValue }, sessionKey).encryptedData;
};

/**
 * Converts the given condition value into a string (serializedData) that
 * is then given to the request to create/update mail filers.
 */
const getSerializedDataFromConditionValue = (
  conditionValue: ConditionValue | undefined,
  conditionType: ConditionType,
  sessionKey: string
) => {
  const value = isContactConditionValue(conditionValue) ? conditionValue.value : conditionValue;

  const encryptedSerializedData = value ? encryptConditionValue(conditionType, value, sessionKey) : undefined;

  // Either return the encrypted version of serializedData (if applicable) or the original string
  // We encrypt subject and body condition values
  return encryptedSerializedData ?? value;
};

export const createCreateMailFilterInput = (
  conditions: Condition[],
  shouldORFilters: boolean,
  moveToOption?: MoveToType,
  labels?: UserLabelPlain[],
  markAsRead?: boolean,
  skipNotifications?: boolean,
  name?: string
): CreateMailFilterInput | undefined => {
  if (!conditions.length || (!moveToOption && !labels?.length && !markAsRead)) {
    console.error('Cannot create the CreateMailFilterInput without conditions and at least one action.');
    return;
  }

  // Create keys for encryption
  const currentUser = requireCurrentUserData();
  const decryptedSessionKey = generateSymmetricKey();
  const { encryptedKey: encryptedSessionKey, encryptedBy } = encryptSessionKey(
    decryptedSessionKey,
    currentUser.privateUserData.privateKey,
    currentUser.publicKey,
    currentUser.publicKey
  );

  // Create actions
  // Apply labels
  const moveToLabelsActions: FilterActionInput[] | undefined = labels?.map((label) => ({
    actionType: ActionTypeGraphQL.ApplyLabel,
    serializedData: label.value
  }));
  // Move to folder/system label
  const moveToAction: FilterActionInput | undefined = moveToOption
    ? {
        actionType: isFolder(moveToOption) ? ActionTypeGraphQL.ApplyLabel : ActionTypeGraphQL.ApplySystemLabel,
        serializedData: moveToOption.value
      }
    : undefined;
  // Mark as read/unread
  const markAsReadAction: FilterActionInput | undefined = markAsRead
    ? {
        actionType: ActionTypeGraphQL.MarkAsRead
      }
    : undefined;

  // Skip notifications
  const skipNotificationsAction: FilterActionInput | undefined = skipNotifications
    ? {
        actionType: ActionTypeGraphQL.DontNotify
      }
    : undefined;
  // Combine all actions
  const actions: FilterActionInput[] = [...(moveToLabelsActions ?? [])];
  if (moveToAction) actions.push(moveToAction);
  if (markAsReadAction) actions.push(markAsReadAction);
  if (skipNotificationsAction) actions.push(skipNotificationsAction);

  // Create filter from conditions
  const subFilter: MailFilterInput[] = conditions
    .map((condition) => {
      if (!condition.value) return;
      const serializedValue = getSerializedDataFromConditionValue(condition.value, condition.type, decryptedSessionKey);
      const conditionTypeAsFilterType = conditionTypeToGraphQLFilterType(condition.type);
      if (!conditionTypeAsFilterType) {
        console.error('Unsupported condition type', condition.type);
        return;
      }
      if (condition.comparator === ConditionComparator.IsNot) {
        return {
          filterType: FilterTypeGraphQL.Not,
          subFilter: [
            {
              filterType: conditionTypeAsFilterType,
              serializedData: serializedValue
            }
          ]
        };
      }
      if (condition.comparator === ConditionComparator.Has) {
        return {
          filterType: conditionTypeAsFilterType,
          filterField: FilterFieldGraphQL.Contains,
          serializedData: serializedValue
        };
      }
      // "Is" case
      return {
        filterType: conditionTypeAsFilterType,
        serializedData: serializedValue
      };
    })
    .filter(filterExists);

  if (!subFilter.length) {
    console.error('Cannot create a filter without any valid conditions.');
    return;
  }

  const filter: MailFilterInput = {
    filterType: shouldORFilters ? FilterTypeGraphQL.Or : FilterTypeGraphQL.And,
    subFilter
  };

  return {
    actions,
    filter,
    name,
    encryptedSessionKey,
    encryptedByKey: encryptedBy.key
  };
};

const graphQLFilterTypeToConditionType = (filterType: FilterTypeGraphQL) => {
  switch (filterType) {
    case FilterTypeGraphQL.Recipient:
      return ConditionType.To;
    case FilterTypeGraphQL.From:
      return ConditionType.From;
    case FilterTypeGraphQL.Body:
      return ConditionType.Body;
    case FilterTypeGraphQL.Subject:
      return ConditionType.Subject;
  }
};

const decryptSerializedData = (conditionType: ConditionType, serializedData: string, decryptedSessionKey?: string) => {
  const datagram = ENCRYPTED_CONDITION_TYPES_TO_DATAGRAM[conditionType];
  // If there is no datagram, we assume that this condition type does not need to be decrypted
  if (!datagram) return undefined;
  if (!decryptedSessionKey) throw new Error(`Could not decrypt condition: ${conditionType}}`);
  return decryptDatagramV2(datagram, decryptedSessionKey, serializedData).body.text;
};

/**
 * Converts the given serializedData that is received from the GraphQL
 * mail filter into a condition value.
 * @throws {Error}
 */
const getConditionValueFromSerializedData = (
  serializedData: string,
  conditionType: ConditionType,
  contacts: AddressObjectWithDisplayPicture[],
  clientside: boolean,
  decryptedSessionKey?: string
): ConditionValue => {
  if (clientside && !decryptedSessionKey) {
    throw new Error('Could not decrypt condition for client side filter.');
  }

  if (isAddressType(conditionType)) {
    // To/From type
    const targetContact = contacts.find((contact) => contact.address === serializedData);
    if (targetContact) {
      // Return contact object if there is a matching contact
      return {
        label: targetContact.name ?? targetContact.address,
        value: targetContact.address,
        displayPictureData: targetContact.displayPictureData
      };
    }
    // Not a saved contact, return the string value
    return serializedData;
  }

  return decryptSerializedData(conditionType, serializedData, decryptedSessionKey) ?? serializedData;
};

/**
 * Exported for testing
 * Given a GraphQL mail filter, parses the conditions
 * @throws {Error}
 */
export const conditionsFromFilterGraphQL = (
  graphQLFilter: MailFilterFieldGraphQL,
  clientside: boolean,
  contacts: AddressObjectWithDisplayPicture[],
  decryptedSessionKey?: string,
  customComparator?: ConditionComparator
): Condition[] => {
  const { subFilter } = graphQLFilter;
  const conditions: Condition[] = [];

  subFilter?.forEach((filter) => {
    const { filterType, filterField, serializedData } = filter;
    // Get comparator
    let comparator = customComparator ?? ConditionComparator.Is;
    if (filterField === FilterFieldGraphQL.Contains) {
      comparator = ConditionComparator.Has;
    } else if (filterType === FilterTypeGraphQL.Not) {
      // NOT filters are nested within the sub filter
      conditions.push(
        ...conditionsFromFilterGraphQL(filter, clientside, contacts, decryptedSessionKey, ConditionComparator.IsNot)
      );
      return;
    }

    // Get condition type
    const conditionType = graphQLFilterTypeToConditionType(filterType);
    if (!conditionType) return;

    // Get value
    const value =
      getConditionValueFromSerializedData(
        serializedData ?? '',
        conditionType,
        contacts,
        clientside,
        decryptedSessionKey
      ) || undefined;
    // Add the condition
    conditions.push({
      id: createConditionID(),
      type: conditionType,
      comparator,
      value
    });
  });

  return conditions;
};

export const filterFromGraphQL = (
  graphqlFilter: MailFilterGraphQL,
  contacts: AddressObjectWithDisplayPicture[]
): Filter | undefined => {
  const {
    actions: graphQLActions,
    filter: graphQLFilter,
    mailFilterID,
    name,
    encryptedSessionKey,
    encryptedByKey,
    clientside
  } = graphqlFilter;
  try {
    // Convert actions
    const actions = graphQLActions.map(
      (action): Action => ({
        type: action.actionType,
        value: action.serializedData || undefined
      })
    );
    if (!actions.length) {
      throw new Error('No actions could be parsed for this filter');
    }

    // Convert conditions
    // Get key for decryption
    const currentUser = requireCurrentUserData();
    const { privateKey } = currentUser.privateUserData;
    // Check for keys if it's a client side filter. Client side filters must have keys
    // in order to decrypt the conditions.
    const hasKeys = encryptedSessionKey && encryptedByKey;
    if (!hasKeys && clientside) {
      throw new Error('Sessions keys needed to decrypt client side filters.');
    }
    const decryptedSessionKey =
      clientside && hasKeys ? decryptSessionKey(encryptedSessionKey, privateKey, { key: encryptedByKey }) : undefined;

    const conditions = conditionsFromFilterGraphQL(graphQLFilter, clientside, contacts, decryptedSessionKey);
    const { filterType } = graphQLFilter;
    if (!conditions.length) {
      throw new Error('No conditions could be parsed for this filter.');
    }

    return {
      id: mailFilterID,
      actions,
      conditions,
      shouldORFilters: filterType === FilterTypeGraphQL.Or,
      name: name ?? undefined
    };
  } catch (error) {
    console.error(error, `Filter ID: ${mailFilterID}`);
    return undefined;
  }
};
