import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import {
  Chip,
  Dropdown,
  InputField,
  Portal,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ContactsDropdownItems, getAddrDisplayName, getAddressTooltipLabel } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';
import isEmail from 'validator/lib/isEmail';

import { getBadgeIcon, toAddressObjects } from '../../../utils/composeUtils';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { EmailFieldTypes } from '../Compose.constants';

import EditingChip from './EditableChip';

interface AddressAutocompleteProps {
  options: AddressObject[];
  addresses: Array<AddressObject>;
  inputValue: string;
  setInputValue: (value: string) => void;
  setAddresses: (addresses: AddressObject[]) => void;
  skiffInternalAddressMap: Map<string, boolean>;
  field: EmailFieldTypes;
  /** InputField onChange event */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** InputField onBlur event */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** InputField onFocus event */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPaste?: (e?: React.ClipboardEvent<HTMLDivElement>) => void;
  isFocused?: boolean;
  onChipDelete?: (index: number) => void;
  placeholder?: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

const AddressContainer = styled.div`
  opacity: 0.74;
`;

const InputChipContainer = styled.div<{ $empty: boolean }>`
  display: flex;
  gap: 8px;
  flex-flow: wrap;
  max-width: 100%;
  box-sizing: border-box;
  align-items: center;
  > div {
    width: ${(props) => (props.$empty ? '' : isMobile ? '' : 'fit-content !important')};
  }
`;

const MobileOptions = styled.div<{ $showField?: boolean }>`
  background: var(--bg-l3-solid);
  border: none;
  border-top: 1px solid var(--border-secondary);
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 999999999999999;
  position: absolute;
  left: 0px;
  top: 231px;
  padding: 0px 8px;
  box-sizing: border-box;
`;

const PaddedTypography = styled.div`
  padding: 16px 8px 0px 8px;
`;

const InputFieldContainer = styled.div<{ $empty: boolean }>`
  min-width: fit-content;
  width: ${(props) => (props.$empty ? '100%' : '')};
`;

const MAX_CHIP_TITLE_LEN = 28;

const abbreviateChipTitle = (title: string) => {
  const atIndex = title.indexOf('@');
  const endIndex = !!atIndex ? title.length - atIndex + 2 : 6;
  return `${title.slice(0, 5)}...${title.slice(-endIndex)}`;
};

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onChange,
  onBlur,
  inputValue,
  setInputValue,
  options,
  setAddresses,
  onPaste,
  skiffInternalAddressMap,
  isFocused,
  onChipDelete,
  placeholder,
  addresses,
  field,
  inputRef
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number | undefined>(0);
  const [editingChipValue, setEditingChipValue] = useState('');

  const [editingChipIndex, setEditingChipIndex] = useState<number | undefined>(undefined);

  const [draggedAddr, setDraggedAddr] = useState<AddressObject>();
  const [dragIsSkiffInternal, setDragIsSkiffInternal] = useState<boolean | undefined>();

  const [{ isDragging }, drag, preview] = useDrag({
    item: { addr: draggedAddr, icon: dragIsSkiffInternal, field: field },
    type: DNDItemTypes.MAIL_CHIP,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !isMobile && !!draggedAddr
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const addHighlightedOption = (option?: AddressObject) => {
    // if option is highlighted, add it
    if (highlightedIdx !== undefined && showDropdown && !!options[highlightedIdx]) {
      // add via on enter select
      const selectedOption = option || options[highlightedIdx];
      if (!!selectedOption) {
        setAddresses([...addresses, ...toAddressObjects([selectedOption])]);
      }
      setHighlightedIdx(0);
    } else {
      if (inputValue === '') return;
      setAddresses([...addresses, ...toAddressObjects([inputValue])]);
    }
    setInputValue('');
    if (isMobile) {
      setShowDropdown(false);
    }
  };

  const optionOnClick = (option: AddressObject) => {
    addHighlightedOption(option);
  };

  useEffect(() => {
    setShowDropdown(options.length > 0 && !!inputValue);
  }, [options, inputValue]);

  const onInputEnter = (e: React.KeyboardEvent<any>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      addHighlightedOption();
    }
  };

  const onInputDelete = (e: React.KeyboardEvent) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && inputValue === '' && addresses.length > 0) {
      // remove last element
      setAddresses(addresses.filter((_option, index) => index !== addresses.length - 1));
    }
  };

  const renderDropdownItems = () => {
    return (
      <ContactsDropdownItems
        contactOptions={options}
        highlightedIdx={highlightedIdx}
        onClick={(contact) => optionOnClick({ name: contact.name, address: contact.address })}
        setHighlightedIdx={setHighlightedIdx}
        theme={!isMobile ? ThemeMode.DARK : undefined}
      />
    );
  };

  const saveOnBlur = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    if (onBlur) onBlur(e);
    if (!!inputValue && options.length === 0) {
      setAddresses([...addresses, ...toAddressObjects([inputValue])]);
      setInputValue('');
    }
  };

  return (
    <>
      <InputChipContainer $empty={addresses.length === 0} ref={editingChipIndex === undefined ? drag : undefined}>
        {addresses
          .filter((option) => !!option?.address)
          .map((option, index) => {
            const { address, name } = option;
            const tooltipLabel = getAddressTooltipLabel(address);
            const { formattedDisplayName: fullChipLabel } = getAddrDisplayName(option);

            const maxChipLabelLength = isMobile ? 18 : 38;

            const chipLabel =
              fullChipLabel.length > maxChipLabelLength
                ? fullChipLabel.slice(0, maxChipLabelLength).concat('...')
                : fullChipLabel;

            const isSkiffInternal = skiffInternalAddressMap.get(address);
            const isEditingCurChip = editingChipIndex === index;
            const isValidEmail = isEmail(address);
            const fullTitle = name || address;
            const title = fullTitle.length > MAX_CHIP_TITLE_LEN ? abbreviateChipTitle(fullTitle) : fullTitle;

            return (
              <>
                {isEditingCurChip && (
                  <EditingChip
                    address={address}
                    addresses={addresses}
                    editingChipValue={editingChipValue}
                    index={index}
                    inputRef={inputRef}
                    setAddresses={setAddresses}
                    setEditingChipIndex={setEditingChipIndex}
                    setEditingChipValue={setEditingChipValue}
                  />
                )}
                {!isEditingCurChip && (
                  <div
                    onMouseDown={(event) => event.stopPropagation()}
                    onMouseEnter={() => {
                      setDragIsSkiffInternal(isSkiffInternal);
                      setDraggedAddr(option);
                    }}
                  >
                    <FloatingDelayGroup delay={{ open: 200, close: 200 }}>
                      <Chip
                        destructive={!isValidEmail}
                        key={address}
                        label={title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChipIndex(index);
                        }}
                        onDelete={() => {
                          if (onChipDelete) onChipDelete(index);
                        }}
                        startIcon={
                          <Tooltip>
                            <TooltipContent>
                              {isSkiffInternal !== undefined && !isDragging && (
                                <Typography
                                  forceTheme={ThemeMode.DARK}
                                  size={TypographySize.SMALL}
                                  weight={TypographyWeight.MEDIUM}
                                >
                                  {!isValidEmail
                                    ? 'Invalid email'
                                    : isSkiffInternal
                                    ? 'End-to-end encrypted'
                                    : 'Encrypted'}
                                </Typography>
                              )}
                              <AddressContainer>
                                <Typography
                                  color={!isValidEmail ? 'destructive' : undefined}
                                  forceTheme={ThemeMode.DARK}
                                  size={TypographySize.SMALL}
                                >
                                  {!!name ? address : tooltipLabel}
                                </Typography>
                              </AddressContainer>
                            </TooltipContent>
                            <TooltipTrigger>{getBadgeIcon(chipLabel, isSkiffInternal, !isValidEmail)}</TooltipTrigger>
                          </Tooltip>
                        }
                      />
                    </FloatingDelayGroup>
                  </div>
                )}
              </>
            );
          })}
        {!isMobile && (
          <Dropdown
            buttonRef={inputRef}
            gapFromAnchor={12}
            highlightedIdx={highlightedIdx}
            maxHeight={300}
            minWidth={240}
            numChildren={options.length}
            portal
            setHighlightedIdx={setHighlightedIdx}
            setShowDropdown={setShowDropdown}
            showDropdown={showDropdown}
          >
            {renderDropdownItems()}
          </Dropdown>
        )}
        <InputFieldContainer $empty={addresses.length === 0}>
          <InputField
            autoFocus={isFocused}
            caretColor='link'
            ghost
            innerRef={inputRef}
            onBlur={saveOnBlur}
            onChange={onChange}
            onKeyDown={onInputDelete}
            onKeyPress={onInputEnter}
            onPaste={onPaste}
            placeholder={placeholder}
            value={inputValue}
          />
        </InputFieldContainer>
      </InputChipContainer>
      {isMobile && showDropdown && (
        <Portal>
          <MobileOptions>
            <PaddedTypography>
              <Typography color='secondary' size={TypographySize.LARGE}>
                People
              </Typography>
            </PaddedTypography>
            {renderDropdownItems()}
          </MobileOptions>
        </Portal>
      )}
    </>
  );
};

export default AddressAutocomplete;
