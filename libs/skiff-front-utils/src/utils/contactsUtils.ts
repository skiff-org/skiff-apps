// This file is used to share methods between apollo & components to avoid dependency cycles

import isEmpty from 'lodash/isEmpty';
import { ValueLabel } from 'skiff-graphql';

export const getInitialDecryptedMultipleFieldsValue = (
  multipleFieldsValue: ValueLabel[] | undefined | null,
  oldSingleValue?: string
) => {
  const fallbackValue: ValueLabel[] = [{ value: oldSingleValue ?? '', label: '' }];
  if (!multipleFieldsValue) {
    return fallbackValue;
  }
  let initialDecryptedMultipleFieldsValue = multipleFieldsValue.filter(({ value }) => !!value);
  if (isEmpty(initialDecryptedMultipleFieldsValue)) {
    initialDecryptedMultipleFieldsValue = fallbackValue;
  }
  return initialDecryptedMultipleFieldsValue;
};
