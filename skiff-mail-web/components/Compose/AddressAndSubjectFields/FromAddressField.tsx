import { Icon, DropdownItem, Drawer, IconText, Dropdown, Avatar } from 'nightwatch-ui';
import { FC, memo, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  createAbbreviatedWalletEmail,
  createEmail,
  isWalletAddress,
  useTheme,
  splitEmailToAliasAndDomain,
  useLocalSetting,
  DrawerOption,
  DrawerOptions
} from 'skiff-front-utils';
import { CustomDomainRecord } from 'skiff-graphql';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-mail-graphql';
import { CustomDomainStatus } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { EmailFieldTypes } from '../Compose.constants';

import AddressField from './AddressField';

const FromAddressLabel = styled.div`
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  max-width: ${isMobile ? '78vw' : undefined};
  &:hover {
    background: var(--bg-cell-hover);
  }
`;

// width is a percentage

interface FromAddressFieldProps {
  focusedField: EmailFieldTypes | null;
  emailAliases: string[];
  userEmail: string;
  setUserEmail: (email: string) => void;
  setCustomDomainAlias: (customDomain: string) => void;
  setFocusedField: (field: EmailFieldTypes | null) => void;
}

const FromAddressField: FC<FromAddressFieldProps> = ({
  focusedField,
  emailAliases,
  userEmail,
  setUserEmail,
  setCustomDomainAlias,
  setFocusedField
}) => {
  const [showUserAliasDropdown, setShowUserAliasDropdown] = useState(false);
  const [isUserAliasOptionsOpen, setIsUserAliasOptionsOpen] = useState(false);
  const showAliasDrawer = useAppSelector((state) => state.mobileDrawer.showAliasDrawer);
  const fromSelectRef = useRef<HTMLDivElement>(null);

  // Fetch users custom domains
  const { data: customDomainsData } = useGetCurrentUserCustomDomainsQuery();
  const customDomains: Pick<CustomDomainRecord, 'domain' | 'domainID'>[] =
    customDomainsData?.getCurrentUserCustomDomains.domains.filter(
      (domain) => domain.verificationStatus === CustomDomainStatus.VERIFIED
    ) ?? [];

  const [defaultCustomDomainAlias] = useLocalSetting('defaultCustomDomainAlias');

  // If a default custom domain exists, let's start with it
  useEffect(() => {
    const defaultCustomAlias = emailAliases.find((alias) => alias === defaultCustomDomainAlias);

    if (defaultCustomAlias) {
      setCustomDomainAlias(defaultCustomAlias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCustomDomainAlias, emailAliases, customDomains.length, setCustomDomainAlias]);

  const dispatch = useDispatch();

  const { theme: currentTheme } = useTheme();

  if (!emailAliases.length) {
    console.error('No email aliases given for the From address field.');
    return null;
  }

  const updateDropdownAndFieldState = (state: boolean) => {
    setShowUserAliasDropdown(state);
    setIsUserAliasOptionsOpen(state);
    setFocusedField(null);
  };

  const getAliasDisplayText = (email: string) => {
    const [alias, mailDomain] = splitEmailToAliasAndDomain(email);
    if (isWalletAddress(alias)) {
      return createAbbreviatedWalletEmail(alias, mailDomain);
    }
    return createEmail(alias, mailDomain);
  };

  const aliasDisplayLabels = emailAliases.map((alias) => getAliasDisplayText(alias));

  // Return the approx width percentage of the email alias dropdown
  // depending on the length of the longest alias

  const selectAlias = (selectedAlias: string) => {
    setUserEmail(selectedAlias);
    updateDropdownAndFieldState(false);
    setShowUserAliasDropdown(false);
  };

  return (
    <AddressField field={EmailFieldTypes.FROM} focusedField={focusedField}>
      <FromAddressLabel
        data-test='from-field'
        onMouseEnter={() => {
          if (isMobile) return;
          // Only show the email alias dropdown if the user has multiple aliases
          if (emailAliases.length > 1) {
            setFocusedField(EmailFieldTypes.FROM);
          }
        }}
        onMouseLeave={() => {
          if (!isUserAliasOptionsOpen) {
            // setShowUserAliasDropdown(false);
            setFocusedField(null);
          }
        }}
        ref={fromSelectRef}
      >
        <IconText
          color={focusedField === EmailFieldTypes.FROM ? 'primary' : 'secondary'}
          endIcon={Icon.ChevronDown}
          label={getAliasDisplayText(userEmail)}
          onClick={() => {
            if (emailAliases.length > 1) {
              if (isMobile) {
                dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(true));
              } else {
                setShowUserAliasDropdown(true);
              }
              setFocusedField(EmailFieldTypes.FROM);
            }
          }}
          type='paragraph'
        />
      </FromAddressLabel>
      <Dropdown
        buttonRef={fromSelectRef}
        className='labelItemDropdown'
        hasSubmenu
        maxHeight={200}
        portal
        setShowDropdown={setShowUserAliasDropdown}
        showDropdown={showUserAliasDropdown}
      >
        {emailAliases.map((alias, index) => (
          <DropdownItem
            active={alias === userEmail}
            icon={<Avatar label={alias} size='small' />}
            key={alias}
            label={aliasDisplayLabels[index]}
            onClick={() => selectAlias(alias)}
            value={alias}
          />
        ))}
      </Dropdown>
      {isMobile && (
        <Drawer
          hideDrawer={() => {
            dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(false));
          }}
          show={showAliasDrawer}
          title='Choose Alias'
        >
          <DrawerOptions>
            {emailAliases.map((alias, index) => (
              <DrawerOption key={index}>
                <DropdownItem
                  label={aliasDisplayLabels[index]}
                  onClick={() => {
                    setUserEmail(alias);
                    dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(false));
                  }}
                  themeMode={currentTheme}
                />
              </DrawerOption>
            ))}
          </DrawerOptions>
        </Drawer>
      )}
    </AddressField>
  );
};

export default memo(FromAddressField);
