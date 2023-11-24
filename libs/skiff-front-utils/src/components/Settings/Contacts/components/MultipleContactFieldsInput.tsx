import { Icon, IconText, InputField, InputProps } from 'nightwatch-ui';
import { useRef } from 'react';
import { Maybe, ValueLabel } from 'skiff-graphql';
import styled from 'styled-components';

import { FieldGroup } from '../Contacts.types';

const MultipleFieldsColumn = styled.div`
  display: flex;
  width: 100%;
  gap: 4px;
  flex-direction: column;
  box-sizing: border-box;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

interface MultipleContactFieldsInputProps extends InputProps {
  values: ValueLabel[];
  fieldConfig: FieldGroup;
  handleFieldChange: (newValue: string | ValueLabel[]) => void;
  moveToNextInput: (evt: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCopy: ((description: string, value: Maybe<string> | undefined) => void) | undefined;
  innerRef: React.MutableRefObject<HTMLInputElement | null>; // defined here again because ts shows error. ts doesn't see its type
  isHovered?: boolean;
  labelPlaceholder?: string;
}

const MultipleContactFieldsInput = ({
  values,
  handleFieldChange,
  moveToNextInput,
  fieldConfig,
  onCopy,
  innerRef,
  isHovered,
  labelPlaceholder,
  ...inputProps
}: MultipleContactFieldsInputProps) => {
  const valueRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onValueInputKeyPress = (evt: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    if (evt.key === 'Enter') {
      labelRefs.current[index]?.focus();
    }
  };

  const onLabelKeyPress = (evt: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    if (evt.key === 'Enter') {
      if (index < values.length - 1) {
        valueRefs.current[index + 1]?.focus();
      } else {
        moveToNextInput(evt);
      }
    }
  };

  const handleMultipleFieldsOnChange = (index: number, newValue: ValueLabel) => {
    const cloneValue = [...values];
    cloneValue[index] = newValue;
    handleFieldChange(cloneValue);
  };

  const onDeleteEntryFromField = (index: number) => {
    const cloneValue = [...values];
    cloneValue.splice(index, 1);
    handleFieldChange(cloneValue);
  };
  return (
    <MultipleFieldsColumn>
      {values.map(({ value, label }, index) => (
        <NameRow key={index}>
          <InputField
            {...inputProps}
            endAdornment={
              value?.length > 0 && typeof value === 'string' && fieldConfig.copyable && !!onCopy && isHovered ? (
                <IconText onClick={() => onCopy(fieldConfig.label, value)} startIcon={Icon.Copy} />
              ) : undefined
            }
            innerRef={(el) => {
              if (index === 0) {
                innerRef.current = el;
              } else {
                valueRefs.current[index] = el;
              }
            }}
            onChange={(e) => {
              handleMultipleFieldsOnChange(index, { value: e.target.value, label });
            }}
            onKeyPress={(e) => onValueInputKeyPress(e, index)}
            value={value}
          />
          <InputField
            autoFocus={false}
            innerRef={(el) => (labelRefs.current[index] = el)}
            onChange={(e) => {
              handleMultipleFieldsOnChange(index, { value, label: e.target.value });
            }}
            onKeyPress={(e) => onLabelKeyPress(e, index)}
            placeholder={labelPlaceholder}
            value={label}
          />
          <IconText
            onClick={() => {
              onDeleteEntryFromField(index);
            }}
            startIcon={Icon.Close}
          />
        </NameRow>
      ))}
    </MultipleFieldsColumn>
  );
};

export default MultipleContactFieldsInput;
