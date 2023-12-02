import dayjs, { ManipulateType } from 'dayjs';
import uniq from 'lodash/uniq';
import { EventUpdateType, RecurrenceFrequency } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { RECURRENCE_DAYS_ORDERED } from '../../components/EventInfo/Recurrence/constants';
import { DAY_UNIT, MONTH_UNIT, WEEK_UNIT, YEAR_UNIT } from '../../constants/time.constants';
import { db } from '../../storage/db/db';
import { CalendarMetadataDB } from '../../storage/models/CalendarMetadata';
import { getDraftByID, saveDraft } from '../../storage/models/draft/modelUtils';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { getEventByID, saveContent } from '../../storage/models/event/modelUtils';
import { DecryptedEvent } from '../../storage/models/event/types';
import { getDraftIfExistOrEvent } from '../eventUtils';
import { queryAllEventRecurrences, queryAllEventRecurrencesAfter } from '../queryUtils';

import { getRecurrenceParent } from './utils';

const FrequencyToDayjsUnit: { [frequency in RecurrenceFrequency]?: ManipulateType } = {
  [RecurrenceFrequency.Daily]: DAY_UNIT,
  [RecurrenceFrequency.Weekly]: WEEK_UNIT,
  [RecurrenceFrequency.Monthly]: MONTH_UNIT,
  [RecurrenceFrequency.Yearly]: YEAR_UNIT
};
/**
 * check if there is active draft for the event.
 * Update the draft with the event recurrence details
 * @param event
 * @returns
 */
const updateDraftWithEventRecurrenceIfExists = async (event: DecryptedEventModel) => {
  const draft = await getDraftByID(event.parentEventID);

  if (!draft) return;
  const { recurrenceDate, recurrenceRule, parentRecurrenceID } = event.plainContent;
  draft.updateWithPartialDetails({
    plainContent: {
      recurrenceDate,
      recurrenceRule,
      parentRecurrenceID
    }
  });

  await saveDraft(draft);
};

/**
 * add recurrence rule to event and and initialize the fields a parent should not have
 * @param event
 * @param rule
 */
const addRecurrenceRuleToParentEvent = (event: DecryptedEvent, rule: RecurrenceRule) => {
  event.plainContent.recurrenceRule = rule;
  // if event has recurrence rule that means he is the parent event.
  // in that case the `parentRecurrenceID` should be undefined, and the `recurrenceDate` should be 0
  event.plainContent.parentRecurrenceID = undefined;
  event.plainContent.recurrenceDate = 0;

  return event;
};

/**
 * calculate the new "until" field for a parent event for a given border date
 * @param untilDate
 * @param parenOriginalRule
 * @returns
 */
const calcUntilForParent = (untilDate: number, parenOriginalRule: RecurrenceRule) => {
  // in case the rule is defined by days we want to subtract only one day and not a whole week
  const frequencyToSubtract = parenOriginalRule.byDays ? DAY_UNIT : FrequencyToDayjsUnit[parenOriginalRule.frequency];
  return dayjs(untilDate).subtract(1, frequencyToSubtract).valueOf();
};

export type RecurringActionCallBack = (
  instance: DecryptedEventModel,
  singleEvent: boolean,
  isEvent?: boolean // Not a virtualized one
) => DecryptedEventModel | Promise<DecryptedEventModel>;

/**
 * perform an action on one instance of recurring event.
 * assuming the eventID passed is for an event that is part of recurrence
 * - if there is already separate instance for this recurrence - apply the changes on him
 * - if not - create an instance for him and  apply the changes on the new instance
 * @param selectedEventID
 * @param action
 * @returns
 */
export const performOnSingleRecurrence = async (
  selectedEventID: string,
  action: RecurringActionCallBack
): Promise<boolean> => {
  let updatedEvent: DecryptedEventModel;
  try {
    // Check if selected recurrence already exists
    const instance = await getEventByID(selectedEventID);

    // Instance already exists, perform the action on him
    if (instance) {
      const isChild = instance.plainContent.parentRecurrenceID;

      // if the instance is not the parent event we can just perform the action on him
      if (isChild) {
        updatedEvent = await action(instance, true);
      } else {
        // if it is the parent event - we need to create a new instance for him and perform the action on the new instance
        const id = v4();
        const newParentInstance = await DecryptedEventModel.fromDecryptedEventWithoutKeys({
          ...instance,
          parentEventID: id,
          externalID: instance.externalID,
          plainContent: {
            ...instance.plainContent,
            recurrenceRule: instance.plainContent.recurrenceRule,
            parentRecurrenceID: instance.parentEventID,
            recurrenceDate: instance.plainContent.startDate
          }
        });
        updatedEvent = await action(newParentInstance, true);
      }
    } else {
      // if theres no instance for this event try to get his draft
      const draft = await getDraftByID(selectedEventID);
      // if no draft we can't perform the action
      if (!draft) throw new Error(`Can't perform action on ${selectedEventID} - no draft found`);

      const calendarMetadata = await CalendarMetadataDB.getMetadata();
      if (!calendarMetadata) throw new Error(`Can't perform action on ${selectedEventID} - no calendar found`);

      // create instance from the draft
      const newInstance = DecryptedEventModel.fromDecryptedDraft(draft);

      // preform the action in the new instance
      updatedEvent = await action(newInstance, true);
    }
    await saveContent(updatedEvent);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 *
 * @param selectedEventID
 * @param action  - the action should only modify the passed instance without saving
 * @returns
 */
export const performOnAllRecurrences = async (
  selectedEventID: string,
  action: RecurringActionCallBack
): Promise<(true | Error)[]> => {
  assertExists(db, 'performOnAllRecurrences db is closed');
  const parentEvent = await getRecurrenceParent(selectedEventID);

  // Handle parent event
  try {
    // perform the action on the instance
    const updatedEvent = await action(parentEvent, true, true);
    await saveContent(updatedEvent);
  } catch (err) {
    console.error('Failed updating recurring event instance', err);
    throw new Error('Failed updating recurring event instance', { cause: err });
  }

  // Fetch all recurrences
  const allRecurrences = await queryAllEventRecurrences(db.events, parentEvent.parentEventID);

  const allRecurrenceModels = await Promise.all(
    allRecurrences.map((recurrence) => DecryptedEventModel.fromDexie(recurrence))
  );

  // change parentRecurrenceID to all instances after recurrenceDate to match the new parentRecurrenceID of the modified event
  const response = (
    await Promise.allSettled(
      allRecurrenceModels.map(async (event) => {
        try {
          // perform the action on the instance
          const updatedEvent = await action(event, false);
          await saveContent(updatedEvent);
          return true;
        } catch (err) {
          console.error('Failed updating recurring event instance', err);
          return new Error('Failed updating recurring event instance', { cause: err });
        }
      })
    )
  ).map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return new Error(result.reason as string);
    }
  });

  return response;
};

/**
 *
 * @param selectedEventID
 * @param action - the action should only modify the passed instance without saving
 * @returns
 */
export const performOnSingleAndFuture = async (
  selectedEventID: string,
  action: RecurringActionCallBack
): Promise<(true | Error)[]> => {
  const recurrenceInstance = await getDraftIfExistOrEvent(selectedEventID);
  assertExists(recurrenceInstance, 'No draft or event for' + selectedEventID);

  // assuming parentRecurrenceID is defined because it's not possible to do `single and future` on the parent
  const parentRecurrenceID = recurrenceInstance.plainContent.parentRecurrenceID;
  assertExists(parentRecurrenceID, 'No parentRecurrenceID for' + selectedEventID);

  const recurrenceDate = recurrenceInstance.plainContent.recurrenceDate;

  // get the parent instance if exists
  const parentRecurrence = await getEventByID(parentRecurrenceID);
  // if theres no parent event or no recurrence rule - throw
  if (!parentRecurrence || !parentRecurrence.plainContent.recurrenceRule) {
    throw new Error('Unable to save draft: No recurrence rule in DB');
  }

  const parentRule = parentRecurrence.plainContent.recurrenceRule;

  // perform the action on the event, update the instance with the new recurrence rule and perform the action
  // ** important to do this before updating the parent rule, incase the parent will get deleted **

  const allOldRecurrencesDates = parentRecurrence.plainContent.recurrenceRule
    .getAllDates()
    .map((date) => date.getTime());
  const allNewRecurrencesDates = allOldRecurrencesDates.slice(
    0,
    allOldRecurrencesDates.findIndex((date) => date === recurrenceDate)
  );

  await performOnSingleRecurrence(selectedEventID, async (event) => {
    const updatedEvent = await action(event, true);

    // create new rule for the future events, make sure to use the updated startDate from the instance after the action
    const newStartDate = updatedEvent.plainContent.startDate;
    const newByDayForInstance = RECURRENCE_DAYS_ORDERED[dayjs.utc(newStartDate).day()];
    const oldByDayForInstance =
      RECURRENCE_DAYS_ORDERED[dayjs.utc(recurrenceInstance.plainContent.recurrenceDate).day()];
    /**
     * If there are multiple byDays in the parent rule, remove the one of the old recurring instance
     * before it was updated and replay it with the new one
     * for example:
     *  - old byDays: Monday, Tuesday
     *  - move the recurring event that is on a Tuesday to Wednesday
     *  - update byDays to now be Monday, Wednesday
     */
    const newByDays = parentRule.byDays
      ? uniq([...parentRule.byDays.filter((day) => day !== oldByDayForInstance), newByDayForInstance])
      : undefined;
    const newParentRecurrenceRule = new RecurrenceRule({
      ...parentRule,
      byDays: newByDays,
      startDate: newStartDate,
      // make sure to decrease the events before this one if end count is specified
      count: parentRule.count ? parentRule.count - parentRule.getDateCount(new Date(recurrenceDate)) : undefined
    });
    allNewRecurrencesDates.push(...newParentRecurrenceRule.getAllDates().map((date) => date.getTime()));

    // then override the rule with the updated rule
    addRecurrenceRuleToParentEvent(updatedEvent, newParentRecurrenceRule);
    updatedEvent.addToUpdateType([EventUpdateType.Content]);

    // make sure that if more `single and future` actions will be done on this draft,
    // in won't try to update the rule again from the parent
    await updateDraftWithEventRecurrenceIfExists(updatedEvent);

    return updatedEvent;
  });

  assertExists(db, 'performOnSingleAndFuture db is closed');

  const recurrenceAfterNewParent = await queryAllEventRecurrencesAfter(db.events, parentRecurrenceID, recurrenceDate);

  // change parentRecurrenceID to all instances after recurrenceDate to match the new parentRecurrenceID of the modified event
  const response = (
    await Promise.allSettled(
      recurrenceAfterNewParent.map(async (instance) => {
        try {
          const event = await DecryptedEventModel.fromDexie(instance);

          // update the instance to point on his new parent
          event.plainContent.parentRecurrenceID = selectedEventID;
          const recurrenceIndex = allOldRecurrencesDates.indexOf(event.plainContent.recurrenceDate);
          event.plainContent.recurrenceDate = allNewRecurrencesDates[recurrenceIndex] || 0;

          // perform the action on the instance
          const updatedEvent = await action(event, false);
          await saveContent(updatedEvent);
          return true;
        } catch (err) {
          console.error('Failed updating recurring event instance', err);
          return new Error('Failed updating recurring event instance', { cause: err });
        }
      })
    )
  ).map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return new Error(result.reason as string);
    }
  });

  // change the parent rule to reach until the current recurrence
  const newRule = new RecurrenceRule({
    ...parentRule,
    until: calcUntilForParent(recurrenceDate, parentRule),
    count: undefined // override count to use until
  });

  // update the parent with the new rule that excludes events after `recurrenceDate`
  // saving the parent at the end to prevent updating the instances before detaching him from the parent
  parentRecurrence.plainContent.recurrenceRule = newRule;
  parentRecurrence.addToUpdateType([EventUpdateType.Content]);
  await saveContent(parentRecurrence);

  return response;
};
