import {
  Autocomplete,
  AutocompleteRenderGetTagProps,
  AutocompleteRenderOptionState,
  FilterOptionsState,
  List,
  Paper,
  TextField
} from '@mui/material';
import { Chip, ChipProps } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

type ChipType = React.ReactElement<ChipProps>;

const StyledPaper = styled(Paper)`
  background: var(--bg-l3-glass) !important;
  border: 1px solid var(--border-secondary) !important;
  box-sizing: border-box !important;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12) !important;
  backdrop-filter: blur(72px);
  width: 338px;
  border-radius: 12px !important;
`;

const StyledListbox = styled(List)`
  background: var(--bg-l3-glass) !important;
  border-radius: 12px !important;
  & li {
    padding: 2px 8px !important;
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
  getOptionLabel?: (option: T) => string;
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
    filterOptions
  } = props;

  const [inputValue, setInputValue] = useState<string>('');

  //Custom Listbox
  const CustomListbox = function (props) {
    return <StyledListbox {...props} />;
  };

  return (
    <Autocomplete
      // So that dropdown container background color updates based on theme
      PaperComponent={({ children }) => <StyledPaper>{children}</StyledPaper>}
      ListboxComponent={CustomListbox}
      autoHighlight
      clearIcon={false}
      clearOnBlur
      disablePortal
      filterOptions={filterOptions}
      freeSolo
      getLimitTagsText={(more) => <Chip label={`+${more} more`} type='tag' />}
      getOptionLabel={getOptionLabel}
      limitTags={2}
      multiple
      onBlur={() => {
        if (inputValue.length) {
          onChange((value as (string | T)[]).concat([inputValue]));
          setInputValue('');
        }
        if (onBlur) onBlur();
      }}
      onChange={(_e, newValue) => {
        setInputValue('');
        onChange(newValue as T[]);
      }}
      onFocus={onFocus}
      onKeyPress={(e) => {
        if (e.key === ' ' && inputValue.length) {
          e.preventDefault();
          e.stopPropagation();
          onChange((value as (string | T)[]).concat([inputValue]));
          setInputValue('');
        }
      }}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
          autoFocus={autoFocus}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
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
          color: 'var(--text-primary)'
        },
        ...style
      }}
      value={value}
    />
  );
}

export default ChipInput;
