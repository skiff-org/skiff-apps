import uniqueId from 'lodash/uniqueId';
import React, { ForwardedRef, useEffect, useState } from 'react';
import styled from 'styled-components';

import { SIZE_HEIGHT } from '../../../constants';
import { Size, ThemeMode } from '../../../types';
import Icons, { Icon, IconColor } from '../../Icons';
import { TypographySize, TypographyWeight } from '../../Typography';
import { FILLED_HORIZONTAL_PADDING, INPUT_FIELD_GAP } from '../InputField.constants';
import { INPUT_FIELD_CONTAINER_CSS, INPUT_FIELD_CSS, START_ICON_CSS, WRAPPER_CSS } from '../InputField.styles';
import { InputFieldSize, InputFieldVariant } from '../InputField.types';
import SubText from '../SubText';

import { INPUT_SIZE_CSS } from './Input.styles';
import { InputProps, InputType } from './Input.types';

const Wrapper = styled.div`
  ${WRAPPER_CSS}
`;

const InputFieldContainer = styled.div`
  ${INPUT_FIELD_CONTAINER_CSS}
`;

const StartIcon = styled.div`
  ${START_ICON_CSS}
  justify-content: center;
`;

const EndAdornment = styled.div<{ $ghost: boolean }>`
  height: 100%;
  position: absolute;
  right: 0;

  display: flex;
  align-items: center;
  gap: ${INPUT_FIELD_GAP}px;

  box-sizing: border-box;
  padding-left: ${INPUT_FIELD_GAP}px;
  padding-right: ${(props) => (props.$ghost ? 0 : FILLED_HORIZONTAL_PADDING)}px;
`;

const StyledInput = styled.input<{
  $active: boolean;
  $error: boolean;
  $variant: InputFieldVariant;
  $readOnly: boolean;
  $size: InputFieldSize;
  $typographySize: TypographySize;
  $startIconExists: boolean;
  $weight: TypographyWeight;
  $borderRadius?: number;
  $caretColor?: IconColor;
  $forceTheme?: ThemeMode;
  $paddingRight?: number;
  $disabled?: boolean;
}>`
  height: ${(props) => SIZE_HEIGHT[props.$size]}px;

  // Custom border radius overrides default size-specific border radius
  ${(props) => props.$borderRadius && `border-radius: ${props.$borderRadius}px !important;`}
  pointer-events: ${(props) => (props.$disabled ? 'none' : 'auto')};

  ${INPUT_FIELD_CSS}
  ${INPUT_SIZE_CSS}
`;

const InputField = (
  {
    active,
    autoComplete,
    autoFocus,
    borderRadius,
    caretColor,
    className,
    dataTest,
    disabled = false,
    endAdornment,
    error,
    forceTheme,
    variant = InputFieldVariant.DEFAULT,
    helperText,
    icon,
    id,
    innerRef,
    placeholder = '',
    readOnly = false,
    size = Size.MEDIUM,
    style,
    type = InputType.DEFAULT,
    value = '',
    weight = TypographyWeight.REGULAR,
    typographySize,
    onBlur,
    onChange,
    onClick,
    onFocus,
    onKeyDown,
    onKeyPress,
    onPaste,
    onMouseEnter,
    onMouseLeave
  }: InputProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [endAdornmentId, setEndAdornmentId] = useState('');
  const [paddingRight, setPaddingRight] = useState<number | undefined>(undefined);

  const endAdornmentArray = !!endAdornment ? (!Array.isArray(endAdornment) ? [endAdornment] : endAdornment) : undefined;

  useEffect(() => {
    setEndAdornmentId(uniqueId('inputField-endAdornment'));
  }, []);

  useEffect(() => {
    if (!endAdornment) return;
    const endAdornmentElement = document.getElementById(endAdornmentId);
    const endAdornmentWidth = endAdornmentElement?.getBoundingClientRect().width ?? 0;
    setPaddingRight(endAdornmentWidth);
  }, [endAdornment, endAdornmentId]);

  const renderIcon = (el: Icon) => <Icons color='disabled' icon={el} size={size} forceTheme={forceTheme} />;

  const getTypographySize = () => {
    if (typographySize) return typographySize;
    switch (size) {
      case Size.X_SMALL:
        return TypographySize.CAPTION;
      case Size.SMALL:
        return TypographySize.SMALL;
      case Size.MEDIUM:
        return TypographySize.MEDIUM;
      case Size.LARGE:
        return TypographySize.LARGE;
    }
  };

  return (
    <Wrapper
      className={className}
      ref={ref}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <InputFieldContainer>
        {!!icon && <StartIcon $ghost={variant === InputFieldVariant.GHOST}>{renderIcon(icon)}</StartIcon>}
        <StyledInput
          id={id}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          onPaste={onPaste}
          ref={innerRef}
          data-test={dataTest}
          disabled={disabled}
          $disabled={disabled}
          $startIconExists={!!icon}
          $paddingRight={paddingRight}
          readOnly={readOnly}
          $active={!!active}
          $error={!!error}
          $size={size}
          $variant={variant}
          $forceTheme={forceTheme}
          $weight={weight}
          $caretColor={caretColor}
          $readOnly={readOnly}
          $borderRadius={borderRadius}
          $typographySize={getTypographySize()}
        />
        {!!endAdornmentArray && (
          <EndAdornment id={endAdornmentId} $ghost={variant === InputFieldVariant.GHOST}>
            {endAdornmentArray?.map((el: Icon | React.ReactNode) =>
              typeof el === 'string' ? renderIcon(el as Icon) : el
            )}
          </EndAdornment>
        )}
      </InputFieldContainer>
      {typeof error === 'string' && (
        <SubText errorMsg={error} helperText={helperText} size={size} forceTheme={forceTheme} />
      )}
    </Wrapper>
  );
};

export default React.forwardRef<HTMLDivElement, InputProps>(InputField);
