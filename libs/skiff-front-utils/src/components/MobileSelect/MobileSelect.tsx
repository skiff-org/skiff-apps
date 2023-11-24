import { FilledVariant, Icon, IconText, InputField, Size, TypographyWeight } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import Drawer, { DrawerGroup } from '../Drawer';

import { MobileSelectProps } from './MobileSelect.types';

const SelectContainer = styled.div<{ $width?: number | string }>`
  ${({ $width }) => $width && `width: ${typeof $width === 'string' ? $width : `${$width}px`};`}
`;

export default function MobileSelect({
  children,
  onChange,
  dataTest,
  disabled,
  forceTheme,
  ghostColor,
  maxHeight,
  menuControls,
  placeholder,
  size = Size.LARGE,
  value,
  width,
  variant = FilledVariant.UNFILLED
}: MobileSelectProps) {
  // Whether the dropdown is visible or not
  const [menuOpen, setMenuOpen] = useState(false);
  const isOpen = menuControls?.isOpen || menuOpen;

  const endIcon = menuOpen ? Icon.ChevronUp : Icon.ChevronDown;
  const typographyWeight = TypographyWeight.REGULAR;

  // To get dropdown anchor
  const selectTriggerRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const selectedLabel = children.find((child) => value === child.props.value)?.props.label;

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!!menuControls) menuControls.setIsOpen(!isOpen);
    else setMenuOpen(!isOpen);
  };

  const renderDisabledField = () => (
    <IconText
      dataTest={dataTest}
      disabled
      forceTheme={forceTheme}
      label={selectedLabel ?? placeholder}
      size={size}
      weight={typographyWeight}
    />
  );

  const renderEnabledField = () =>
    variant === FilledVariant.FILLED ? (
      // Filled field
      <InputField
        active={menuOpen}
        dataTest={dataTest}
        // Disabled because the input field is only used to display the selected value
        disabled
        endAdornment={endIcon}
        forceTheme={forceTheme}
        onClick={toggleOpen}
        placeholder={placeholder}
        ref={selectTriggerRef}
        size={size}
        value={typeof selectedLabel === 'string' ? selectedLabel : ''}
      />
    ) : (
      // Ghost field
      <IconText
        color={ghostColor}
        dataTest={dataTest}
        endIcon={endIcon}
        forceTheme={forceTheme}
        label={selectedLabel ?? placeholder}
        onClick={toggleOpen}
        ref={selectTriggerRef}
        size={size}
        weight={typographyWeight}
      />
    );

  const renderSelectItems = () =>
    children.map((child) => {
      return React.cloneElement(child, {
        active: value === child.props.value,
        key: typeof child.props.label === 'string' ? child.props.label : child.props.value,
        onClick: async (e?: React.MouseEvent<HTMLDivElement>) => {
          e?.stopPropagation();
          // If the child has its own onClick function passed, then it is not a normal select item
          // and we should run onClick without running onChange
          if (!!child.props.onClick) await child.props.onClick(e);
          else if (!!child.props.value) onChange(child.props.value);
          toggleOpen();
        }
      });
    });

  return (
    <SelectContainer $width={width}>
      {/* Field */}
      {disabled ? renderDisabledField() : renderEnabledField()}
      {/* Option menu */}
      <Drawer hideDrawer={toggleOpen} maxHeight={maxHeight} show={isOpen}>
        <DrawerGroup>{renderSelectItems()}</DrawerGroup>
      </Drawer>
    </SelectContainer>
  );
}
