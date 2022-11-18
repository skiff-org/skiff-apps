import { AutocompleteRenderGetTagProps, createFilterOptions } from '@mui/material/Autocomplete';
import { isString } from 'lodash';
import { Icon, Avatar, Chip, Typography } from 'nightwatch-ui';
import { FC, memo, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { getAddressTooltipLabel, getAddrDisplayName, formatEmailAddress } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { isSkiffAddress, resolveENSName } from '../../../utils/userUtils';
import ChipInput from '../../ChipInput';
import ContactRowOption from '../../ContactRowOption';
import { EmailFieldTypes } from '../Compose.constants';

import AddressField from './AddressField';

// matches bracketed address (e.g. jasong@gmail.com from Jason Ginsberg <jasong@gmail.com>)
const BRACKET_EMAIL_REGEX = /<([\w.!#$%&’*+\/=?^_`{|}~-]+@[\w-]+(?:\.[\w-]+)+)>/;

const NUM_CONTACTS_TO_RENDER = 20;

const ChipWrapper = styled.div`
  cursor: pointer;
`;

const ChipInputWrapper = styled.div`
  width: 100%;
`;

interface RecipientFieldProps {
  field: EmailFieldTypes;
  focusedField: EmailFieldTypes | null;
  addresses: AddressObject[];
  contactList: AddressObject[];
  setAddresses: (addresses: AddressObject[]) => void;
  onFocus: (field: EmailFieldTypes) => void;
  onBlur: () => void;
  onDrop: (draggedAddressChip: AddressObject, fromFieldType: EmailFieldTypes, toFieldType: EmailFieldTypes) => void;
  additionalButtons?: React.ReactNode;
  dataTest?: string;
}

const TooltipLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

export const getBadgeIcon = (isSkiffInternal) => {
  if (isSkiffInternal === undefined) {
    return undefined;
  } else {
    return isSkiffInternal ? (
      <Avatar color='green' icon={Icon.ShieldCheck} size='xsmall' />
    ) : (
      <Avatar disabled icon={Icon.Lock} size='xsmall' />
    );
  }
};

export interface ComposeAddressChipData {
  addr: AddressObject;
  icon: boolean | undefined;
  field: EmailFieldTypes;
}

/*
 * Component for rendering a recipient field, ie To, Cc, Bcc
 */
const RecipientField: FC<RecipientFieldProps> = ({
  field,
  focusedField,
  addresses,
  contactList,
  setAddresses,
  onFocus,
  onBlur,
  onDrop,
  additionalButtons,
  dataTest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [contactOptionsToRender, setContactOptionsToRender] = useState<AddressObject[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [skiffInternalAddressMap] = useState<Map<string, boolean>>(new Map());

  const emailAddresses = addresses.map((addr) => addr.address);
  // Only show addresses that have not yet been added to the field
  const filteredContactList = contactList
    .filter((contact) => contact.address.includes(inputValue))
    .filter((contact) => !emailAddresses.includes(contact.address))
    .slice(0, NUM_CONTACTS_TO_RENDER);

  useEffect(() => {
    const getContactOptionsToRender = async () => {
      const options = await Promise.all(
        filteredContactList.map(async (contact) => {
          const ensName = await resolveENSName(contact.address, contact.name);
          if (ensName) return { ...contact, name: ensName };
          return contact;
        })
      );
      setContactOptionsToRender(options);
    };
    void getContactOptionsToRender();
  }, [inputValue]);

  useEffect(() => {
    const getSkiffInternal = (emailAddressList: string[]) => {
      emailAddressList.map((emailAddress) => {
        // const isSkiffInternal = isSkiffAddress(emailAddress, customDomains);
        const isSkiffInternal = isSkiffAddress(emailAddress);

        skiffInternalAddressMap.set(emailAddress, isSkiffInternal);
      });
    };
    getSkiffInternal(emailAddresses);
  }, [emailAddresses, skiffInternalAddressMap]);

  const RenderOption = (props, option: AddressObject) => (
    // Need list prop so that index logic works correctly
    <li {...props} key={option.address}>
      <ContactRowOption address={option} />
    </li>
  );

  const [draggedAddr, setDraggedAddr] = useState<AddressObject>();
  const [dragIsSkiffInternal, setDragIsSkiffInternal] = useState<boolean | undefined>();

  const [{ isDragging }, drag, preview] = useDrag({
    item: { addr: draggedAddr, icon: dragIsSkiffInternal, field: field },
    type: DNDItemTypes.MAIL_CHIP,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !isMobile
  });

  const [, dropRef] = useDrop({
    accept: DNDItemTypes.MAIL_CHIP,
    drop: (item: ComposeAddressChipData) => {
      onDrop(item.addr, item.field, field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const renderTags = (tags: Array<AddressObject>, getTagProps: AutocompleteRenderGetTagProps) =>
    tags.map((addr, index) => {
      const { address, name } = addr;
      const { className, key, onDelete } = getTagProps({ index });
      const tooltipLabel = getAddressTooltipLabel(address);
      const { formattedDisplayName: chipLabel } = getAddrDisplayName(addr);
      const isSkiffInternal = skiffInternalAddressMap.get(address);

      return (
        <ChipWrapper
          className={className}
          key={key}
          onMouseDown={(event) => event.stopPropagation()}
          onMouseEnter={() => {
            setDragIsSkiffInternal(isSkiffInternal);
            setDraggedAddr(addr);
          }}
        >
          <Chip
            customTooltip={
              !isDragging ? (
                <TooltipLabel>
                  {isSkiffInternal !== undefined && (
                    <Typography level={3} themeMode='dark' type='label'>
                      {isSkiffInternal ? 'End-to-end encrypted' : 'Encrypted'}
                    </Typography>
                  )}
                  <Typography
                    color='secondary'
                    level={3}
                    style={{ color: 'rgba(255, 255, 255, 0.74)' }}
                    themeMode='dark'
                  >
                    {!!name ? address : tooltipLabel}
                  </Typography>
                </TooltipLabel>
              ) : undefined
            }
            label={chipLabel}
            // only show the tooltip if the user's display name
            // is the chip's label or if it's a wallet address
            onDelete={onDelete}
            startIcon={getBadgeIcon(isSkiffInternal)}
          />
        </ChipWrapper>
      );
    });

  // If one of the new values is a plain string and not an object from the contact list, convert it into the address obj
  const toAddressObjects = (values: Array<string | AddressObject>) =>
    values.reduce((acc, val) => {
      if (isString(val)) {
        const addrs: AddressObject[] = val.split(/\s+/).map((address) => {
          return {
            address: formatEmailAddress(address, false)
          };
        });
        return [...acc, ...addrs];
      } else {
        return [...acc, val];
      }
    }, [] as AddressObject[]);

  const addressInputPlaceholder = 'Search and add people';

  const getPastedValues = (e: React.ClipboardEvent) => {
    return e.clipboardData.getData('text/plain');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedValue = getPastedValues(e);
    const parsedValue = pastedValue.match(BRACKET_EMAIL_REGEX);
    if (!!parsedValue && parsedValue.length > 1) {
      const pastedEmail = parsedValue[1].trim();
      setAddresses(toAddressObjects([pastedEmail] as string[]).concat(addresses));
    } else {
      //trim in case of leading or trailing spaces in pastedValue
      setAddresses(toAddressObjects([pastedValue.trim()] as string[]).concat(addresses));
    }
  };

  useEffect(() => {
    if (focusedField === field) inputRef.current?.focus();
  }, [focusedField, field]);

  return (
    <div ref={dropRef}>
      <AddressField dataTest={dataTest} field={field} focusedField={focusedField}>
        <ChipInputWrapper ref={drag}>
          <ChipInput
            autoFocus={focusedField === field}
            // https://mui.com/material-ui/react-autocomplete/#custom-filter
            filterOptions={createFilterOptions({
              trim: true,
              stringify: (option) => `${option.name ?? ''} ${option.address}`
            })}
            getOptionLabel={(option: string | AddressObject) =>
              typeof option !== 'string' ? option.name ?? option.address : option
            }
            handlePaste={handlePaste}
            hideActive
            inputRef={inputRef}
            onBlur={onBlur}
            onChange={(value) => setAddresses(toAddressObjects(value))}
            onFocus={() => onFocus(field)}
            onInputChange={(newInputValue) => setInputValue(newInputValue)}
            options={contactOptionsToRender}
            placeholder={addresses.length === 0 ? addressInputPlaceholder : undefined}
            renderOption={RenderOption}
            renderTags={renderTags}
            style={{ width: '100%' }}
            value={addresses}
          />
        </ChipInputWrapper>
        {additionalButtons}
      </AddressField>
    </div>
  );
};

export default memo(RecipientField);
