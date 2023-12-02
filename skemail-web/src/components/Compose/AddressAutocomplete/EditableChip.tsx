import React from 'react';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

interface EditingChipProps {
  addresses: Array<AddressObject>;
  address: string;
  editingChipValue: string;
  setEditingChipValue: (value: string) => void;
  setEditingChipIndex: (value?: number) => void;
  setAddresses: (addresses: AddressObject[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  index: number;
}

const UnfilledInput = styled.input`
  outline: none;
  border: none;
  height: 30px;
  background: transparent;
  color: var(--text-primary);
  caret-color: var(--icon-link);
  font-family: Skiff Sans Text;
  font-weight: 380;
  font-size: 15px;
  line-height: 130%;
`;

const EditingChip: React.FC<EditingChipProps> = ({
  addresses,
  address,
  editingChipValue,
  setEditingChipValue,
  setEditingChipIndex,
  setAddresses,
  inputRef,
  index
}) => {
  const clearEditing = () => {
    setEditingChipIndex(undefined);
    setEditingChipValue('');
    inputRef.current?.focus();
  };

  const saveEdits = () => {
    if (!editingChipValue) {
      clearEditing();
      return;
    }
    setAddresses(
      addresses.map((curAddr, aIndex) => {
        if (curAddr.address === address && aIndex === index) {
          // Create a *new* object with changes
          return { ...curAddr, address: editingChipValue, name: undefined };
        } else {
          // No changes
          return curAddr;
        }
      })
    );
    clearEditing();
  };

  return (
    <UnfilledInput
      autoFocus
      onBlur={() => {
        saveEdits();
      }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) {
          setAddresses(addresses.filter((curAddr) => curAddr.address !== address));
          clearEditing();
          return;
        }
        e.target.size = e.target.value.length;
        setEditingChipValue(e.target.value);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
        e.target.size = e.target.value.length;
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          saveEdits();
        }
      }}
      spellCheck={false}
      type='text'
      value={editingChipValue || address}
    />
  );
};

export default EditingChip;
