import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';
import Typography, { TypographySize } from '../Typography';

import { CodeInputProps, CodeInputType } from './CodeInput.types';
import { isValid, padEnd } from './CodeInput.utils';

const CodeInputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const CodeInputField = styled.input<{
  $active: boolean;
  $codeLength: number;
  $error: boolean;
  $type: CodeInputType;
  $forceTheme?: ThemeMode;
}>`
  width: ${(props) => `calc(100% / ${props.$codeLength})`};
  max-width: 60px;
  aspect-ratio: 1.1;

  outline: none;
  text-align: center;
  box-sizing: border-box;
  border-radius: 12px;
  ${(props) => !props.$active && 'pointer-events: none;'}
  background: ${(props) => getThemedColor('var(--bg-field-default)', props.$forceTheme)};
  border: ${(props) => {
    let color = 'transparent'; // Prevents a layout shift
    if (props.$active) color = 'var(--border-active)';
    if (props.$error) color = 'var(--border-destructive)';
    return `1px solid ${getThemedColor(color, props.$forceTheme)};`;
  }}

  // H4 text
  font-family: 'Skiff Sans Text', sans-serif;
  font-size: 19px;
  line-height: 130%;
  color: ${(props) => getThemedColor('var(--text-secondary)', props.$forceTheme)};
  -moz-appearance: textfield;

  ${(props) =>
    props.$type === CodeInputType.NUMBER &&
    css`
      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
    `}
`;

/** A component that renders a set of square text fields for either numeric or text code inputs. */
const CodeInput = (
  {
    className,
    codeLength,
    dataTest,
    error,
    forceTheme,
    isSubmitting,
    style,
    type = CodeInputType.NUMBER,
    value,
    onChange,
    onSubmit
  }: CodeInputProps,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const endIndex = codeLength - 1;
  // Carries the cursor index, which is always one index ahead of the last entered value
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(
    !!value.length ? (value.length > endIndex ? endIndex : value.length) : 0
  );
  // Contains references to all TextField inputs
  const inputRef = useRef<HTMLInputElement[]>([]);
  // Padded code values
  const codeValues: string[] = padEnd(value, codeLength);

  // Moves the cursor and calls onChange on the new code values if they are valid
  const onUpdate = (newValues: string) => {
    const allAreValid = newValues.split('').every((char) => isValid(type, char));
    // Do nothing if there are invalid values
    if (!allAreValid) return;

    // Cursor index cannot go beyond the last field
    const newIndex = newValues.length > endIndex ? endIndex : newValues.length;
    setFocusedFieldIndex(newIndex);
    onChange(newValues);
  };

  // Deletes last entry
  const onDelete = () => {
    // Can't go beyond first entry
    if (focusedFieldIndex === 0) return;

    // Since the cursor index is always one index ahead of the last entered value,
    // we delete the last entry by clearing the value in the index that precedes the cursor index
    const prevIndex = focusedFieldIndex - 1;
    const newValues = codeValues;
    newValues.splice(prevIndex, 1, '');
    onUpdate(newValues.join(''));
  };

  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    // Get pasted values
    const pastedValues = e.clipboardData.getData('text/plain').split('');
    // Filter out invalid characters
    const validPastedValues = pastedValues.filter((char) => isValid(type, char));

    let newValues = codeValues;
    // Add pasted values to the existing code values
    newValues.splice(index, validPastedValues.length, ...validPastedValues);
    // Trim to maximal code length
    newValues = newValues.slice(0, codeLength);
    onUpdate(newValues.join(''));
  };

  // onChange is necessary to detect auto-filled codes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Concatenate the input to the existing code values
    const newValue = codeValues.join('') + e.target.value;
    // Trim to maximal code length
    const trimmedValue = newValue.substring(0, codeLength);
    onUpdate(trimmedValue);
  };

  // We add isSubmitting as a dependency since it disables the input fields so we would need to refocus
  useEffect(() => {
    inputRef.current[focusedFieldIndex]?.focus();
  }, [focusedFieldIndex, isSubmitting]);

  return (
    <div className={className} ref={ref} style={style}>
      <CodeInputContainer>
        {codeValues.map((val: string, index: number) => (
          <CodeInputField
            type={type}
            inputMode={type === CodeInputType.NUMBER ? 'numeric' : 'text'}
            autoFocus={index === focusedFieldIndex}
            value={val}
            onBlur={() => inputRef.current[focusedFieldIndex]?.focus()}
            onChange={handleChange}
            // Backspace only works with onKeyDown
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Backspace') onDelete();
            }}
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                void onSubmit();
              }
            }}
            onPaste={(e: React.ClipboardEvent) => {
              e.preventDefault();
              e.stopPropagation();
              handlePaste(e, index);
            }}
            ref={(innerRef: HTMLInputElement) => (inputRef.current[index] = innerRef)}
            data-test={dataTest}
            key={index}
            disabled={isSubmitting}
            $active={index === focusedFieldIndex}
            $codeLength={codeLength}
            $error={!!error}
            $forceTheme={forceTheme}
            $type={type}
          />
        ))}
      </CodeInputContainer>
      {!!error && typeof error === 'string' && (
        <Typography forceTheme={forceTheme} color='destructive' size={TypographySize.SMALL} wrap>
          {error}
        </Typography>
      )}
    </div>
  );
};

export default React.forwardRef<HTMLDivElement, CodeInputProps>(CodeInput);
