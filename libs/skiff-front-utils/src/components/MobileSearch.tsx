import { InputField, Typography } from '@skiff-org/skiff-ui';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div<{ $showBorder?: boolean }>`
  padding: 16px 0px;
  border-bottom: ;
  border-bottom: ${({ $showBorder }) => ($showBorder ? ' 1px solid var(--border-tertiary)' : '')};

  display: flex;
  align-items: center;
  gap: 10px;
`;

interface MobileSearchProps {
  setSearchQuery: (query: string) => void;
  onCancel?: () => void;
  placeHolder?: string;
  disableCancelButton?: boolean;
  initialValue?: string;
  disabled?: boolean;
  activeLabel?: string;
  showBorder?: boolean;
}

export default function MobileSearch({
  setSearchQuery,
  onCancel,
  disableCancelButton = false,
  initialValue = '',
  placeHolder = 'Search messages...',
  disabled,
  activeLabel,
  showBorder = false
}: MobileSearchProps) {
  const [value, setValue] = useState<string>(initialValue);
  const handleChange = useCallback((val: string) => {
    setSearchQuery(val.toLowerCase());
  }, []);

  const debounceFn = useCallback(debounce(handleChange, 500), []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceFn(e.target.value);
  };

  const clearSearch = () => {
    setValue('');
    setSearchQuery('');
    if (onCancel) onCancel();
  };

  // make sure that search is cleared when user navigates from one label to another or back
  useEffect(() => {
    clearSearch();
  }, [activeLabel]);

  const blurOnEnterPress = (e: React.KeyboardEvent<any>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement) {
      e.target.blur();
    }
  };

  const showCancelButton = !!value && !disableCancelButton;

  return (
    <SearchContainer $showBorder={showBorder}>
      <InputField
        autoComplete='off'
        disabled={disabled}
        onChange={onChange}
        onKeyPress={blurOnEnterPress}
        placeholder={placeHolder}
        value={value}
      />
      {!!showCancelButton && (
        <Typography mono uppercase color='link' minWidth='fit-content' onClick={clearSearch}>
          Cancel
        </Typography>
      )}
    </SearchContainer>
  );
}
