import { AutocompleteRenderGetTagProps, createFilterOptions } from '@mui/material';
import { Chip } from '@skiff-org/skiff-ui';
import { isString } from 'lodash';

import { AddressObject, useGetUserContactListQuery } from '../../../generated/graphql';
import ChipInput from '../../ChipInput';
import { EmailFieldTypes } from '../Compose.constants';
import AddressField from './AddressField';
import AddressOptionRow from './AddressOptionRow';

interface RecipientFieldProps {
  field: EmailFieldTypes;
  focusedField: EmailFieldTypes | null;
  setAddresses: (addresses: AddressObject[]) => void;
  addresses: AddressObject[];
  userID: string;
  onFocus: (field: EmailFieldTypes) => void;
  onBlur: () => void;
  additionalButtons?: React.ReactNode;
  dataTest?: string;
}

/*
 * Component for rendering a recipient field, ie To, Cc, Bcc
 */
const RecipientField: React.FC<RecipientFieldProps> = ({
  field,
  focusedField,
  setAddresses,
  addresses,
  userID,
  onFocus,
  onBlur,
  additionalButtons,
  dataTest
}) => {
  // Get contact list
  const { data } = useGetUserContactListQuery({
    variables: {
      request: {
        userID
      }
    }
  });
  const contactOptions = data?.user?.contactList ?? [];
  const emailAddresses = addresses.map((addr) => addr.address);
  // Only show addresses that have not yet been added to the field
  const filteredContactOptions = contactOptions.filter((contact) => !emailAddresses.includes(contact.address));

  const renderOption = (props, option: AddressObject) => (
    // Need list prop so that index logic works correctly
    <li {...props} key={option.address} style={{ backgroundColor: 'var(--bg-l1-solid)' }}>
      <AddressOptionRow address={option} />
    </li>
  );

  const renderTags = (tags: Array<AddressObject>, getTagProps: AutocompleteRenderGetTagProps) =>
    tags.map(({ address, name }, index) => {
      const { className, key, onDelete } = getTagProps({ index });
      return (
        <div className={className} key={key}>
          <Chip label={name || address} onDelete={onDelete} type='input' />
        </div>
      );
    });

  // If one of the new values is a plain string and not an object from the contact list, convert it into the address obj
  const toAddressObjects = (values: Array<string | AddressObject>) =>
    values.reduce((acc, val) => {
      if (isString(val)) {
        const addrs: AddressObject[] = val.split(' ').map((address) => ({ address }));
        return [...acc, ...addrs];
      } else {
        return [...acc, val];
      }
    }, [] as AddressObject[]);

  const addressInputPlaceholder = 'Search and add people';

  return (
    <>
      <AddressField dataTest={dataTest} field={field} focusedField={focusedField}>
        <ChipInput
          autoFocus={focusedField === field}
          // https://mui.com/material-ui/react-autocomplete/#custom-filter
          filterOptions={createFilterOptions({
            trim: true,
            stringify: (option) => `${option.name ?? ''} ${option.address}`
          })}
          getOptionLabel={(option: AddressObject) => option.name ?? option.address}
          onBlur={onBlur}
          onChange={(value) => setAddresses(toAddressObjects(value))}
          onFocus={() => onFocus(field)}
          options={filteredContactOptions}
          placeholder={addresses.length === 0 ? addressInputPlaceholder : undefined}
          renderOption={renderOption}
          renderTags={renderTags}
          style={{ width: '100%' }}
          value={addresses}
        />
        {additionalButtons}
      </AddressField>
    </>
  );
};

export default RecipientField;
