import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { REMOVE_SCROLLBAR_CSS } from '../../styles';
import { FilledVariant, Size } from '../../types';
import Dropdown from '../Dropdown';
import { Icon } from '../Icons';
import IconText from '../IconText/IconText';
import { InputField } from '../InputField';
import { TypographyWeight } from '../Typography';

import { SelectProps } from './Select.types';

const ScrollContainer = styled.div<{ $maxHeight?: number | string }>`
  width: 100%;
  overflow-y: auto;
  ${({ $maxHeight }) => $maxHeight && `max-height: ${typeof $maxHeight === 'string' ? $maxHeight : `${$maxHeight}px`};`}
  ${REMOVE_SCROLLBAR_CSS}
`;

const SelectContainer = styled.div<{ $width?: number | string }>`
  ${({ $width }) => $width && `width: ${typeof $width === 'string' ? $width : `${$width}px`};`}
`;

export default function Select({
  children,
  onChange,
  dataTest,
  disabled,
  forceTheme,
  ghostColor,
  maxHeight,
  placeholder,
  searchProps,
  size = Size.LARGE,
  value,
  width,
  variant = FilledVariant.UNFILLED,
  ...dropdownProps
}: SelectProps) {
  // Whether the dropdown is visible or not
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);

  const { enableSearch, customSearchValidator } = searchProps || {};

  const endIcon = isMenuOpen ? Icon.ChevronUp : Icon.ChevronDown;
  const typographyWeight = TypographyWeight.REGULAR;

  // To get dropdown anchor
  const selectTriggerRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const selectedLabel = children.find((child) => value === child.props.value)?.props.label;

  // Search through menu items by value and by label
  const filteredChildren = !enableSearch
    ? children
    : children.filter((child) => {
        if (!searchValue.length) return true;

        if (!!customSearchValidator && child.props.value && customSearchValidator(child.props.value, searchValue)) {
          return true;
        }

        const childValue = child.props.value?.toLowerCase();
        const childLabel = typeof child.props.label === 'string' ? child.props.label.toLowerCase() : undefined;
        const comparableSearchValue = searchValue.toLowerCase();

        return (
          (!!childValue && childValue.includes(comparableSearchValue)) ||
          (!!childLabel && childLabel.includes(comparableSearchValue))
        );
      });

  const openMenu = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Highlight active item on opening the dropdown
    const activeIndex = children.findIndex((child) => child.props.value === value);
    if (activeIndex !== -1 && activeIndex !== highlightedIdx) setHighlightedIdx(activeIndex);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    // Reset search value on closing the dropdown
    if (!!searchValue.length) setSearchValue('');
    setIsMenuOpen(false);
  };

  const renderDisabledField = () => (
    <IconText
      forceTheme={forceTheme}
      dataTest={dataTest}
      disabled
      label={selectedLabel ?? placeholder}
      size={size}
      weight={typographyWeight}
    />
  );

  const renderEnabledField = () =>
    variant === FilledVariant.FILLED ? (
      // Filled field
      <InputField
        active={isMenuOpen}
        // Disabled because the input field is only used to display the selected value
        disabled
        dataTest={dataTest}
        endAdornment={endIcon}
        onClick={openMenu}
        placeholder={placeholder}
        ref={selectTriggerRef}
        value={typeof selectedLabel === 'string' ? selectedLabel : ''}
        size={size}
        forceTheme={forceTheme}
      />
    ) : (
      // Ghost field
      <IconText
        forceTheme={forceTheme}
        ref={selectTriggerRef}
        dataTest={dataTest}
        onClick={openMenu}
        label={selectedLabel ?? placeholder}
        endIcon={endIcon}
        size={size}
        weight={typographyWeight}
        color={ghostColor}
      />
    );

  const renderSelectItems = () =>
    filteredChildren.map((child, index) => {
      return React.cloneElement(child, {
        active: value === child.props.value,
        highlight: highlightedIdx === index,
        key: typeof child.props.label === 'string' ? child.props.label : child.props.value,
        onClick: async (e?: React.MouseEvent<HTMLDivElement>) => {
          e?.stopPropagation();
          // If the child has its own onClick function passed, then it is not a normal select item
          // and we should run onClick without running onChange
          if (!!child.props.onClick) await child.props.onClick(e);
          else if (!!child.props.value) onChange(child.props.value);
          closeMenu();
        },
        onHover: () => setHighlightedIdx(index)
      });
    });

  return (
    <SelectContainer $width={width}>
      {/* Field */}
      {disabled ? renderDisabledField() : renderEnabledField()}
      {/* Option menu */}
      <Dropdown
        portal
        buttonRef={selectTriggerRef}
        setShowDropdown={(isOpen: boolean) => {
          if (!isOpen) closeMenu();
        }}
        showDropdown={isMenuOpen}
        // only add a gap for filled Select components.
        // Ghost Selects visually do not need the extra space above the dropdown options
        gapFromAnchor={variant === FilledVariant.FILLED ? 4 : undefined}
        keyboardNavControls={{
          idx: highlightedIdx,
          setIdx: setHighlightedIdx,
          numItems: filteredChildren.length
        }}
        inputField={
          enableSearch ? <InputField onChange={(e) => setSearchValue(e.target.value)} value={searchValue} /> : undefined
        }
        {...dropdownProps}
      >
        <ScrollContainer $maxHeight={maxHeight}>{renderSelectItems()}</ScrollContainer>
      </Dropdown>
    </SelectContainer>
  );
}
