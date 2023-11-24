import { Maybe, ValueLabel } from 'skiff-graphql';

import FieldItemInput from './components/FieldItemInput';
import { ContactWithoutTypename, ErrorState, FieldGroup, FieldLabel, FieldType } from './Contacts.types';
import { getValueFromContactOrDecryptedData } from './Contacts.utils';
import ContactUserProfileSectionRow from './ContactUserProfileSectionRow';

export function renderFieldGroup(
  fieldConfig: FieldGroup,
  pendingContact: ContactWithoutTypename,
  refs: { [key: string]: React.RefObject<HTMLInputElement | HTMLTextAreaElement> },
  onCopy: ((description: string, value: Maybe<string> | undefined) => void) | undefined,
  handleOnChange: (key: string, value: string | ValueLabel[]) => void,
  birthdayRow: JSX.Element,
  pgpRow: JSX.Element | null,
  fields: FieldGroup[],
  fieldIndex = 0,
  errors: ErrorState,
  autoFocus: boolean
) {
  const isMultipleFields = fieldConfig.items.findIndex((item) => item.type === FieldType.multipleInput) > -1;
  const onAddNewEntryToField = () => {
    if (!isMultipleFields) return;
    const key = fieldConfig.items[0].key;
    const value = getValueFromContactOrDecryptedData(fieldConfig.items[0].key, pendingContact);
    const cloneValue = [...(value as ValueLabel[]), { value: '', label: '' }];
    handleOnChange(key, cloneValue);
  };
  const isBirthdayRow = fieldConfig.label === FieldLabel.Birthday;
  const isPgpRow = fieldConfig.label === FieldLabel.PgpKey;
  if (isPgpRow && !pgpRow) return null;
  return (
    <ContactUserProfileSectionRow
      isE2EE={fieldConfig?.isE2EE}
      label={fieldConfig.label}
      onAdd={isMultipleFields ? onAddNewEntryToField : undefined}
    >
      {isBirthdayRow && birthdayRow}
      {isPgpRow && pgpRow}
      {!isPgpRow &&
        !isBirthdayRow &&
        fieldConfig.items.map((item, itemIndex) => {
          const nextItemKey =
            itemIndex < fieldConfig.items?.length - 1
              ? fieldConfig?.items[itemIndex + 1]?.key
              : fields[fieldIndex + 1]?.items[0]?.key;
          const nextRef = nextItemKey ? refs[nextItemKey] : null;
          const value = getValueFromContactOrDecryptedData(item.key, pendingContact);
          return (
            <FieldItemInput
              autoFocus={autoFocus}
              errors={errors}
              fieldConfig={fieldConfig}
              handleFieldChange={handleOnChange}
              item={item}
              key={item.key}
              nextRef={nextRef}
              onCopy={onCopy}
              refs={refs}
              value={value}
            />
          );
        })}
    </ContactUserProfileSectionRow>
  );
}
