import { MonoTag } from 'nightwatch-ui';
import { FC, memo, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDrop } from 'react-dnd';
import { IsCustomDomainDocument, IsCustomDomainQuery, IsCustomDomainQueryVariables } from 'skiff-front-graphql';
import { AddressObjectWithDisplayPicture, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { isSkiffAddress } from 'skiff-utils';
import styled, { css } from 'styled-components';
import client from '../../../apollo/client';

import { toAddressObjects } from '../../../utils/composeUtils';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { resolveENSName } from '../../../utils/userUtils';
import AddressAutocomplete from '../AddressAutocomplete/AddressAutocomplete';
import { EmailFieldTypes } from '../Compose.constants';

import AddressField from './AddressField';

// matches bracketed address (e.g. jasong@gmail.com from Jason Ginsberg <jasong@gmail.com>)
const BRACKET_EMAIL_REGEX = /[\w.-]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,30}(\.[a-zA-Z]{2,30})*/g;

const NUM_CONTACTS_TO_RENDER = 20;

const ChipInputWrapper = styled.div`
  width: 100%;
`;

const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: text;
`;

interface RecipientFieldProps {
  field: EmailFieldTypes;
  focusedField: EmailFieldTypes | null;
  addresses: AddressObject[];
  contactList: AddressObjectWithDisplayPicture[];
  setAddresses: (addresses: AddressObject[]) => void;
  onFocus: (field: EmailFieldTypes) => void;
  onBlur?: () => void;
  onDrop: (draggedAddressChip: AddressObject, fromFieldType: EmailFieldTypes, toFieldType: EmailFieldTypes) => void;
  additionalButtons?: React.ReactNode;
  dataTest?: string;
}

const TagContainer = styled.div`
  min-height: 20px;
  // prevent layout shift
  padding-left: 10px;
  padding-top: 1px;
  margin-right: 0px;
`;

const FIELD_ID = 'recipient-field';

const DEFAULT_MAX_WIDTH = 500;
const MaxWidthFieldContainer = styled.div<{ $maxWidth: number }>`
  max-width: ${({ $maxWidth }) => $maxWidth || DEFAULT_MAX_WIDTH}px;
  overflow: hidden;
  display: flex;
  white-space: nowrap;
  font-family: Skiff Sans Text;
  font-weight: 380;
  font-size: 15px;
  line-height: 130%;
`;

const OverflowContainer = styled.div`
  ${isMobile &&
  css`
    overflow: auto;
  `};
`;

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
  onDrop,
  onBlur,
  additionalButtons,
  dataTest
}) => {
  const [contactOptionsToRender, setContactOptionsToRender] = useState<AddressObjectWithDisplayPicture[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [numCommas, setNumCommas] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [skiffInternalAddressMap] = useState<Map<string, boolean>>(new Map());
  const [maxFieldWidth, setMaxFieldWidth] = useState(DEFAULT_MAX_WIDTH);

  const isFocused = focusedField === field;
  const isFromFieldFocused = focusedField === EmailFieldTypes.FROM;
  const emailAddresses = addresses.map((addr) => addr.address);

  // Only show addresses that have not yet been added to the field
  const filteredContactList = contactList
    .filter((contact) => contact.address.includes(inputValue) || contact.name?.includes(inputValue))
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
    // Using full contact list as dep causes infinite loop, can add memo to it but that'd be more expensive than the small computation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, filteredContactList.length]);

  useEffect(() => {
    const getSkiffInternal = async (emailAddressList: string[]) => {
      await Promise.allSettled(
        emailAddressList.map(async (emailAddress) => {
          const isSkiffInternal = isSkiffAddress(emailAddress);
          const { domain } = splitEmailToAliasAndDomain(emailAddress);
          if (isSkiffInternal) {
            skiffInternalAddressMap.set(emailAddress, isSkiffInternal);
          } else {
            const isSkiffCustomDomainResponse = await client.query<IsCustomDomainQuery, IsCustomDomainQueryVariables>({
              query: IsCustomDomainDocument,
              variables: {
                domains: domain
              }
            });
            skiffInternalAddressMap.set(emailAddress, isSkiffCustomDomainResponse.data.isCustomDomain);
          }
        })
      );
    };
    void getSkiffInternal(emailAddresses);
  }, [emailAddresses, skiffInternalAddressMap]);

  const [, dropRef] = useDrop({
    accept: DNDItemTypes.MAIL_CHIP,
    drop: (item: ComposeAddressChipData) => {
      onDrop(item.addr, item.field, field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  const addressInputPlaceholder = 'Recipients';

  const getPastedValues = (e: React.ClipboardEvent) => {
    return e.clipboardData.getData('text/plain');
  };

  const handlePaste = (e?: React.ClipboardEvent<HTMLDivElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!e) return;
    try {
      const pastedValue = getPastedValues(e);
      const parsedValues = pastedValue.match(BRACKET_EMAIL_REGEX);

      const pastedEmails = parsedValues?.map((value) => value.trim());
      if (!!pastedEmails && pastedEmails.length > 0) {
        setAddresses(toAddressObjects(pastedEmails).concat(addresses));
      }
    } catch (e) {
      console.error('Error parsing pasted emails', e);
    }
  };

  const tagsToText = (tags: Array<AddressObject>) => {
    const tagNames = tags.map((tag) => {
      const { address, name } = tag;
      return name || address;
    });

    return `${tagNames.join(', ')}`;
  };

  useEffect(() => {
    const updateWidth = () => {
      // convert vw to pixels
      const maxWidth = Math.min(Math.max((window.innerWidth * 45) / 100, 624), (window.innerWidth * 90) / 100);
      setMaxFieldWidth(maxWidth);
    };
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function countCommas(element: HTMLElement | null) {
    const text = element?.firstChild?.nodeValue;
    if (!text) return 0;
    let r = 0;

    element.removeChild(element.firstChild);
    for (let i = 0; i < text.length; i++) {
      const newNode = document.createElement('span');
      newNode.style.fontFamily = 'Skiff Sans Text';
      newNode.style.fontWeight = '380';
      newNode.style.whiteSpace = 'pre';
      newNode.style.fontSize = '15';
      newNode.style.userSelect = 'none';
      newNode.style.lineHeight = '130%';
      const char = text.charAt(i);
      newNode.appendChild(document.createTextNode(char));
      element.appendChild(newNode);

      if (newNode.offsetLeft <= maxFieldWidth && char === ',') {
        r++;
      }
    }
    return r;
  }

  useEffect(() => {
    if (!isFocused) {
      const type: HTMLElement | null = document.getElementById(`${field}-${FIELD_ID}`);
      const countedCommas = countCommas(type);
      setNumCommas(countedCommas);
    }
  }, [addresses.length, isFocused, isFromFieldFocused]);

  const showField = addresses.length > 0 || field === EmailFieldTypes.BCC || field === EmailFieldTypes.CC;

  return (
    <>
      <OverflowContainer ref={dropRef}>
        <AddressField
          additionalButtons={additionalButtons}
          dataTest={dataTest}
          field={field}
          isFocused={isFocused}
          moveButtons={addresses.length > 0 && isFocused && !!additionalButtons}
          showField={showField}
          onClick={() => {
            inputRef.current?.focus();
          }}
        >
          {!isFocused && addresses.length > 0 && (
            <InputWrapper onClick={() => onFocus(field)}>
              <MaxWidthFieldContainer $maxWidth={maxFieldWidth} data-test={FIELD_ID} id={`${field}-${FIELD_ID}`}>
                {tagsToText(addresses)}
              </MaxWidthFieldContainer>
              <TagContainer>
                {addresses.length - numCommas - 1 > 0 && (
                  <MonoTag
                    bgColor='var(--bg-overlay-tertiary)'
                    label={`${addresses.length - numCommas - 1} more`}
                    textColor='secondary'
                  />
                )}
              </TagContainer>
            </InputWrapper>
          )}
          {(isFocused || addresses.length === 0) && (
            <ChipInputWrapper>
              <AddressAutocomplete
                addresses={addresses}
                field={field}
                inputValue={inputValue}
                isFocused={isFocused}
                onBlur={onBlur ? () => onBlur() : undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                onChipDelete={(removeIndex: number) =>
                  setAddresses(addresses.filter((_option, index) => index !== removeIndex))
                }
                onFocus={() => onFocus(field)}
                onPaste={handlePaste}
                inputRef={inputRef}
                options={contactOptionsToRender}
                placeholder={addresses.length === 0 ? addressInputPlaceholder : undefined}
                setAddresses={setAddresses}
                setInputValue={setInputValue}
                skiffInternalAddressMap={skiffInternalAddressMap}
              />
            </ChipInputWrapper>
          )}
        </AddressField>
      </OverflowContainer>
    </>
  );
};

export default memo(RecipientField);
