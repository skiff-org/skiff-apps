import { DropdownItem, Size, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import { isWalletAddress } from 'skiff-utils';
import styled from 'styled-components';

import { AddressObjectWithDisplayPicture } from '../../types';
import { abbreviateWalletAddress, createAbbreviatedWalletEmail, splitEmailToAliasAndDomain } from '../../utils';
import { UserAvatar } from '../UserAvatar';

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

interface ContactsDropdownItemProps {
  contact: AddressObjectWithDisplayPicture;
  onClick: (contact: AddressObjectWithDisplayPicture, label?: string) => void;
  active?: boolean;
  highlight?: boolean;
  theme?: ThemeMode;
  onHover?: () => void;
}

interface ContactsDropdownItemsProps {
  contactOptions: AddressObjectWithDisplayPicture[];
  onClick: (contact: AddressObjectWithDisplayPicture, label?: string) => void;
  setHighlightedIdx: React.Dispatch<React.SetStateAction<number>>;
  theme?: ThemeMode;
  isOptionActive?: (contact: AddressObjectWithDisplayPicture, label: string) => boolean;
  highlightedIdx?: number;
}

export const ContactsDropdownItem: React.FC<ContactsDropdownItemProps> = ({
  contact,
  active,
  onClick,
  highlight,
  onHover,
  theme
}: ContactsDropdownItemProps) => {
  const { name, address, displayPictureData } = contact;
  const label = name ?? address;
  const { alias, domain } = splitEmailToAliasAndDomain(address);
  const displayEmail = isWalletAddress(alias) ? createAbbreviatedWalletEmail(alias, domain) : address;
  const displayName = name && isWalletAddress(name) ? abbreviateWalletAddress(name) : name || displayEmail;

  return (
    <DropdownItem
      active={active}
      customLabel={
        <ContactInfo>
          <Typography forceTheme={theme} size={TypographySize.SMALL}>
            {displayName}
          </Typography>
          <Typography color={displayName ? 'secondary' : 'primary'} forceTheme={theme} size={TypographySize.SMALL}>
            {displayEmail}
          </Typography>
        </ContactInfo>
      }
      highlight={highlight}
      key={label}
      label={label}
      onClick={() => onClick(contact, label)}
      onHover={onHover}
      size={Size.LARGE}
      startElement={
        <UserAvatar displayPictureData={displayPictureData} forceTheme={theme} label={label} size={Size.X_MEDIUM} />
      }
      value={label}
    />
  );
};

export const ContactsDropdownItems: React.FC<ContactsDropdownItemsProps> = ({
  contactOptions,
  isOptionActive,
  onClick,
  highlightedIdx,
  setHighlightedIdx,
  theme
}: ContactsDropdownItemsProps) => {
  return (
    <>
      {contactOptions?.map((contact, index) => {
        const { name, address } = contact;
        const label = name ?? address;
        const active = isOptionActive ? isOptionActive(contact, label) : undefined;
        return (
          <ContactsDropdownItem
            active={active}
            contact={contact}
            highlight={highlightedIdx === index}
            key={contact.address}
            onClick={onClick}
            onHover={() => setHighlightedIdx(index)}
            theme={theme}
          />
        );
      })}
    </>
  );
};
