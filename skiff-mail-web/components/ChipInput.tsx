import Autocomplete, { AutocompleteRenderGetTagProps, AutocompleteRenderOptionState } from '@mui/material/Autocomplete';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { FilterOptionsState } from '@mui/material/useAutocomplete';
import { Chip, ChipProps, Typography } from 'nightwatch-ui';
import React, { MutableRefObject, useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

type ChipType = React.ReactElement<ChipProps>;

const StyledPaper = styled(Paper)`
  background: var(--bg-l1-solid) !important;
  border: 1px solid var(--border-secondary) !important;
  box-sizing: border-box !important;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12) !important;
  min-width: 338px;
  max-width: 500px;
  border-radius: 12px !important;

  .MuiAutocomplete-option {
    border-radius: 8px;

    &.Mui-focused {
      background: var(--bg-cell-hover) !important;
    }

    &.Mui-focusVisible {
      background: var(--bg-cell-hover) !important;
    }
  }

  .MuiAutocomplete-listbox {
    border-radius: 12px;
    padding: 8px;

    li {
      padding: 2px 8px;
    }
  }
`;

const StyledMobilePaper = styled.div`
  margin-top: 8px;
  background: var(--bg-l3-solid);
  border: none;
  border-top: 1px solid var(--border-secondary);
  width: 100vw;
  height: 100vh;
  gap: 6px;
  transform: translateX(-10%);
  padding-top: 20px;
  .MuiAutocomplete-option {
    border-radius: 8px;
    margin: 0 16px;
    padding-top: 4px;
    padding-bottom: 4px;
    &.Mui-focused {
      background: var(--bg-cell-hover) !important;
    }

    &.Mui-focusVisible {
      background: var(--bg-cell-hover) !important;
    }
  }
  .MuiAutocomplete-listbox {
    max-height: 100vh;
  }
`;

interface ChipInputProps<T> {
  value: T[];
  // Since we use free solo, onChange handlers need to be able to convert a string to whatever other type we are using
  onChange: (newValue: (T | string)[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  options?: T[];
  autoFocus?: boolean;
  getOptionLabel?: (option: string | T) => string;
  // Custom render tags
  // Used for adding things like avatars and icons
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: T,
    state: AutocompleteRenderOptionState
  ) => React.ReactNode;
  renderTags?: (tags: T[], getTagProps: AutocompleteRenderGetTagProps) => ChipType[];
  // https://mui.com/material-ui/react-autocomplete/#custom-filter
  filterOptions?: (options: T[], state: FilterOptionsState<T>) => T[];
  style?: React.CSSProperties;
  handlePaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onInputChange?: (newInput: string) => void;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  // If this prop is true, options in value will be filtered out from the options list, preventing duplicate selections
  hideActive?: boolean;
}

function ChipInput<T>(props: ChipInputProps<T>) {
  const {
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    getOptionLabel,
    autoFocus,
    style,
    options = [],
    renderOption,
    renderTags,
    filterOptions,
    handlePaste,
    onInputChange,
    inputRef,
    hideActive = false
  } = props;

  const [inputValue, setInputValue] = useState<string>('');
  const handleInputChange = (newInputValue: string) => {
    if (onInputChange) {
      onInputChange(newInputValue);
    }
    setInputValue(newInputValue);
  };
  // Use ref here instead of state to prevent a re-render
  // Re-rendering the autocomplete component clears the arrow-key highlighting and resets selection
  const highlightedOption = useRef<T | null>(null);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const blurInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  const displayedOptions = hideActive ? options.filter((option) => !value.includes(option)) : options;
  return (
    <Autocomplete
      PaperComponent={({ children }) => {
        return !isMobile ? (
          <StyledPaper>{children}</StyledPaper>
        ) : (
          children && children[2] && !!inputValue && (
            <StyledMobilePaper>
              {/* the Paper component children are at the last of the children */}
              <Typography color='secondary' level={1} style={{ marginLeft: '16px' }}>
                People
              </Typography>
              {children}
            </StyledMobilePaper>
          )
        );
      }}
      autoHighlight
      clearIcon={false}
      clearOnBlur
      disablePortal
      filterOptions={filterOptions}
      freeSolo
      getLimitTagsText={(more) => <Chip label={`+${more} more`} />}
      getOptionLabel={getOptionLabel}
      limitTags={2}
      multiple
      onBlur={() => {
        if (inputValue.length) {
          onChange((value as (string | T)[]).concat([inputValue]));
          handleInputChange('');
        }
        if (onBlur) onBlur();
      }}
      onChange={(_e, newValue) => {
        if (onFocus) {
          focusInput();
          onFocus();
        }
        handleInputChange('');

        onChange(newValue as T[]);
      }}
      onFocus={onFocus}
      onHighlightChange={(_e, option) => {
        highlightedOption.current = option;
      }}
      onKeyDown={(e) => {
        // On tab, set currently highlighted option (if there is one)
        if (e.key === 'Tab' && highlightedOption.current && inputValue.length) {
          e.preventDefault();
          e.stopPropagation();
          onChange((value as (string | T)[]).concat([highlightedOption.current]));
          handleInputChange('');
        }
        // On space, create new chip with whatever is currently enter
        if (e.key === ' ' && inputValue.length) {
          e.preventDefault();
          e.stopPropagation();
          onChange((value as (string | T)[]).concat([inputValue]));
          handleInputChange('');
        }
      }}
      onPaste={
        handlePaste
          ? (e) => {
              handlePaste(e);
              handleInputChange('');
            }
          : undefined
      }
      options={displayedOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
          autoFocus={autoFocus}
          inputRef={inputRef}
          onChange={(e) => handleInputChange(e.target.value.trim())}
          onKeyDown={(e: React.KeyboardEvent) => {
            // Remove focus from field when Escape is pressed
            if (e.key === 'Escape') blurInput();
          }}
          placeholder={placeholder}
          ref={params.InputProps.ref}
          value={inputValue}
          variant='standard'
        />
      )}
      renderOption={renderOption}
      renderTags={renderTags}
      size='small'
      // So that text input color updates based on theme
      sx={{
        input: {
          marginTop: '2px',
          color: 'var(--text-primary)'
        },
        ...style
      }}
      value={value}
    />
  );
}

export default ChipInput;
