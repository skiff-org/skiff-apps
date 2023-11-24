import { Icon, IconText, InputField, TextArea } from 'nightwatch-ui';
import { useState } from 'react';
import { Maybe, ValueLabel } from 'skiff-graphql';

import { ErrorState, FieldGroup, FieldItem, FieldType } from '../Contacts.types';

import MultipleContactFieldsInput from './MultipleContactFieldsInput';

interface FieldItemInputProps {
  item: FieldItem;
  fieldConfig: FieldGroup;
  value: string | ValueLabel[];
  nextRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement> | null;
  onCopy: ((description: string, value: Maybe<string> | undefined) => void) | undefined;
  handleFieldChange: (key: string, value: string | ValueLabel[]) => void;
  errors: ErrorState;
  autoFocus: boolean;
  refs: { [key: string]: React.RefObject<HTMLInputElement | HTMLTextAreaElement> };
}

const FieldItemInput = ({
  item,
  fieldConfig,
  value,
  nextRef,
  onCopy,
  handleFieldChange,
  errors,
  autoFocus,
  refs
}: FieldItemInputProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const commonProps = {
    key: item.key,
    error: fieldConfig.error,
    placeholder: item.placeholder,
    value
  };

  const handleOnChange = (key: string, newValue: string | ValueLabel[]) => {
    handleFieldChange(key, newValue);
  };

  const handleKeyPress = (evt: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (evt.key === 'Enter' && nextRef) {
      nextRef.current?.focus();
    }
  };

  if (item.type === FieldType.textarea) {
    return (
      <TextArea
        {...commonProps}
        innerRef={refs[item.key] as React.RefObject<HTMLTextAreaElement>}
        onChange={(e) => handleOnChange(item.key, e.target.value)}
        onKeyPress={handleKeyPress}
        value={typeof commonProps.value === 'string' ? commonProps.value : ''}
      />
    );
  } else if (item.type === FieldType.multipleInput && typeof value === 'object') {
    return (
      <MultipleContactFieldsInput
        autoFocus={autoFocus}
        fieldConfig={fieldConfig}
        handleFieldChange={(newValue: string | ValueLabel[]) => {
          handleFieldChange(item.key, newValue);
        }}
        innerRef={refs[item.key] as React.RefObject<HTMLInputElement>}
        isHovered={isHovered}
        labelPlaceholder={item.labelPlaceholder}
        moveToNextInput={handleKeyPress}
        onCopy={onCopy}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        placeholder={item.placeholder}
        values={value}
      />
    );
  } else {
    return (
      <InputField
        {...commonProps}
        autoFocus={autoFocus}
        endAdornment={
          value?.length > 0 && typeof value === 'string' && fieldConfig.copyable && !!onCopy && isHovered ? (
            <IconText onClick={() => onCopy(fieldConfig.label, value)} startIcon={Icon.Copy} />
          ) : undefined
        }
        error={item.key === 'emailAddress' ? errors?.email : undefined}
        innerRef={refs[item.key] as React.RefObject<HTMLInputElement>}
        onChange={(e) => handleOnChange(item.key, e.target.value)}
        onKeyPress={handleKeyPress}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        value={typeof commonProps.value === 'string' ? commonProps.value : ''}
      />
    );
  }
};

export default FieldItemInput;
