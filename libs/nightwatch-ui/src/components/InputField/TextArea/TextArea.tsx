import React, { ForwardedRef, useEffect } from 'react';
import styled from 'styled-components';

import { Size, ThemeMode } from '../../../types';
import Icons, { IconColor } from '../../Icons';
import { TypographySize, TypographyWeight } from '../../Typography';
import { INPUT_FIELD_CONTAINER_CSS, INPUT_FIELD_CSS, START_ICON_CSS, WRAPPER_CSS } from '../InputField.styles';
import { InputFieldSize, InputFieldVariant } from '../InputField.types';
import SubText from '../SubText/SubText';

import { ICON_TEXT_TYPOGRAPHY_SIZE } from '../../IconText/IconText.constants';
import { TEXT_AREA_ID, VERTICAL_PADDING } from './TextArea.constants';
import { TextAreaProps } from './TextArea.types';

const Wrapper = styled.div`
  ${WRAPPER_CSS}
`;

const TextAreaContainer = styled.div`
  ${INPUT_FIELD_CONTAINER_CSS}
`;

const StartIcon = styled.div<{ $ghost: boolean; $size: InputFieldSize }>`
  ${START_ICON_CSS}
  justify-content: flex-start;
  padding-top: ${(props) => VERTICAL_PADDING[props.$size]}px;
`;

const StyledTextArea = styled.textarea<{
  $active: boolean;
  $error: boolean;
  $variant: InputFieldVariant;
  $size: InputFieldSize;
  $startIconExists: boolean;
  $weight: TypographyWeight;
  $borderRadius?: number;
  $caretColor?: IconColor;
  $forceTheme?: ThemeMode;
  $dynamicHeight: boolean;
  $typographySize?: TypographySize;
}>`
  padding-top: ${(props) => VERTICAL_PADDING[props.$size]}px;
  padding-bottom: ${(props) => VERTICAL_PADDING[props.$size]}px;
  border-radius: ${(props) => (props.$borderRadius ? props.$borderRadius : 8)}px !important;
  ${INPUT_FIELD_CSS};
`;

const TextArea = (
  {
    active,
    autoComplete,
    autoFocus,
    borderRadius,
    caretColor,
    className,
    dataTest,
    disabled = false,
    dynamicHeight = false,
    error,
    forceTheme,
    variant = InputFieldVariant.DEFAULT,
    helperText,
    icon,
    innerRef,
    placeholder = '',
    readOnly = false,
    rows = 3,
    size = Size.MEDIUM,
    style,
    value = '',
    weight = TypographyWeight.REGULAR,
    onBlur,
    onChange,
    onClick,
    onFocus,
    onKeyDown,
    onKeyPress
  }: TextAreaProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  useEffect(() => {
    if (!dynamicHeight) return;
    const textAreaElement = document.getElementById(TEXT_AREA_ID) as HTMLElement;
    // We need to reset the height momentarily to get the correct scrollHeight for the textarea
    textAreaElement.style.height = 'auto';
    // We then set the height directly, outside of the render loop
    // Trying to set this with state or a ref will product an incorrect value.
    textAreaElement.style.height = `${textAreaElement.scrollHeight}px`;
  }, [dynamicHeight, value]);

  const typographySize = ICON_TEXT_TYPOGRAPHY_SIZE[size];

  return (
    <Wrapper className={className} ref={ref} style={style} onClick={onClick}>
      <TextAreaContainer>
        {!!icon && (
          <StartIcon $ghost={variant === InputFieldVariant.GHOST} $size={size}>
            <Icons color='disabled' icon={icon} size={size} forceTheme={forceTheme} />
          </StartIcon>
        )}
        <StyledTextArea
          id={TEXT_AREA_ID}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onKeyDown={
            !!onKeyDown
              ? (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  e.stopPropagation();
                  onKeyDown(e);
                }
              : undefined
          }
          onBlur={onBlur}
          onFocus={onFocus}
          data-test={dataTest}
          ref={innerRef}
          disabled={disabled}
          readOnly={readOnly}
          $active={!!active}
          $dynamicHeight={dynamicHeight}
          $error={!!error}
          $size={size}
          $startIconExists={!!icon}
          $variant={variant}
          $forceTheme={forceTheme}
          $weight={weight}
          $caretColor={caretColor}
          $borderRadius={borderRadius}
          $typographySize={typographySize}
        />
      </TextAreaContainer>
      {typeof error === 'string' && (
        <SubText errorMsg={error} helperText={helperText} size={size} forceTheme={forceTheme} />
      )}
    </Wrapper>
  );
};

export default React.forwardRef<HTMLDivElement, TextAreaProps>(TextArea);
