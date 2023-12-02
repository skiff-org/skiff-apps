import { ActionType, DisplayPictureData } from 'skiff-graphql';

import { SystemLabel, UserLabelFolder } from '../../../utils/label';

import { ConditionComparator, ConditionType, FilterChipDropdown } from './Filters.constants';

export interface Condition {
  id: string;
  type: ConditionType;
  comparator: ConditionComparator;
  value: ConditionValue | undefined;
  openDropdown?: FilterChipDropdown;
  isNew?: boolean;
}

export type ConditionValue = ContactConditionValue | string;

/**
 * For address condition types (From and To), the set value is an object where
 *   label = display name of the contact (or email address if there is no display name)
 *   value = email address of the contact (or the user-entered string)
 *   displayPictureData = contact photo
 */
export interface ContactConditionValue {
  label: string;
  value: string;
  displayPictureData?: DisplayPictureData;
}

/** You can either move thread to a folder or a system label */
export type MoveToType = UserLabelFolder | SystemLabel;

export interface Action {
  type: ActionType;
  value: string | undefined;
}

export interface Filter {
  id: string;
  conditions: Condition[];
  actions: Action[];
  shouldORFilters: boolean;
  name?: string;
}

export interface FilterTypeOption {
  label: string;
  value: string;
}

export const isContactConditionValue = (value?: ConditionValue): value is ContactConditionValue => {
  return typeof value !== 'string' && !!value?.value;
};

export const isAddressType = (type: ConditionType) => type === ConditionType.From || type === ConditionType.To;
