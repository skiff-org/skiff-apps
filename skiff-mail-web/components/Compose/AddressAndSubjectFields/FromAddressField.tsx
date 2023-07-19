import { Drawer, Dropdown, DropdownItem, Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-front-graphql';
import {
  createAbbreviatedWalletEmail,
  createEmail,
  DrawerOption,
  DrawerOptions,
  SettingValue,
  splitEmailToAliasAndDomain,
  TabPage,
  useDefaultEmailAlias,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { CustomDomainRecord } from 'skiff-graphql';
import { CustomDomainStatus, isWalletAddress } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { useSettings } from '../../Settings/useSettings';
import { EmailFieldTypes } from '../Compose.constants';

import AddressField from './AddressField';

const FromAddressLabel = styled.div<{ $isFocused: boolean }>`
  padding: 4px;
  border-radius: 4px;
  gap: 6px;
  display: flex;
  align-items: center;
  // prevent layout shift
  margin-top: ${({ $isFocused }) => ($isFocused ? 1.5 : 0)};
  max-width: ${isMobile ? '78vw' : undefined};
  cursor: pointer;
  &:hover {
    background: var(--bg-overlay-tertiary);
  }
`;

const FieldHeight = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
`;

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
  // Index of the alias hovered over in the alias dropdown
  const [hoveredAliasIndex, setHoveredAliasIndex] = useState<number | undefined>(
    emailAliases.findIndex((alias) => alias === userEmail)
  );
  // Whether the alias dropdown is opened or closed
  const [showUserAliasDropdown, setShowUserAliasDropdown] = useState(false);
  // Whether the alias drawer is opened or closed
  const showAliasDrawer = useAppSelector((state) => state.mobileDrawer.showAliasDrawer);
  const fromSelectRef = useRef<HTMLDivElement>(null);

  const { userID: currentUserID } = useRequiredCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(currentUserID);

  // Fetch users custom domains
  const { data: customDomainsData } = useGetCurrentUserCustomDomainsQuery();
  const customDomains: Pick<CustomDomainRecord, 'domain' | 'domainID'>[] =
    customDomainsData?.getCurrentUserCustomDomains.domains.filter(
      (domain) => domain.verificationStatus === CustomDomainStatus.VERIFIED
    ) ?? [];

  // Whether the field is focused
  // Focusing / unfocusing the field opens / closes the alias dropdown
  const isFocused = focusedField === EmailFieldTypes.FROM;

  const dispatch = useDispatch();
  const openDrawer = () => dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(true));
  const closeDrawer = useCallback(
    () => dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(false)),
    [dispatch]
  );

  const { openSettings } = useSettings();

  const onSelectAlias = useCallback(
    (selectedAlias: string) => {
      if (selectedAlias !== userEmail) setUserEmail(selectedAlias);
      if (isMobile) closeDrawer();
      else {
        // Move on to the next field when the user selects an email
        setFocusedField(EmailFieldTypes.SUBJECT);
      }
    },
    [closeDrawer, setFocusedField, setUserEmail, userEmail]
  );

  // Arrow keys navigate through the alias dropdown
  // Enter submits the selected alias
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showUserAliasDropdown) return;
      if (e.key === 'Enter' && hoveredAliasIndex !== undefined) {
        const selectedAlias = emailAliases[hoveredAliasIndex];
        onSelectAlias(selectedAlias ?? '');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedField(EmailFieldTypes.BODY);
      }
    },
    [showUserAliasDropdown, hoveredAliasIndex, emailAliases, onSelectAlias, setFocusedField]
  );

  // Only enable keyboard listener for desktop
  useEffect(() => {
    if (isMobile) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // If a default custom domain exists, let's start with it
  useEffect(() => {
    const defaultCustomAlias = emailAliases.find((alias) => alias === defaultEmailAlias);
    if (defaultCustomAlias) setCustomDomainAlias(defaultCustomAlias);
  }, [defaultEmailAlias, emailAliases, customDomains.length, setCustomDomainAlias]);

  // Open / close alias dropdown when the field is focused / unfocused
  useEffect(() => {
    if (isFocused) setShowUserAliasDropdown(true);
    else setShowUserAliasDropdown(false);
  }, [emailAliases.length, isFocused]);

  if (!emailAliases.length) {
    console.error('No email aliases given for the From address field.');
    return null;
  }

  const getAliasDisplayText = (email: string) => {
    const { alias, domain: mailDomain } = splitEmailToAliasAndDomain(email);
    if (isWalletAddress(alias)) {
      return createAbbreviatedWalletEmail(alias, mailDomain);
    }
    return createEmail(alias, mailDomain);
  };

  const aliasDisplayLabels = emailAliases.map((alias) => getAliasDisplayText(alias));

  const focusAndOpenDropdown = () => {
    if (isMobile) openDrawer();
    else setFocusedField(EmailFieldTypes.FROM);
  };

  const renderAddAliasOption = () => (
    <DropdownItem
      icon={Icon.Plus}
      key='add-alias'
      label='Add alias'
      onClick={() => {
        if (isMobile) closeDrawer();
        else setFocusedField(null);
        openSettings({ tab: TabPage.Aliases, setting: SettingValue.AddEmailAlias });
      }}
      onHover={() => setHoveredAliasIndex(undefined)}
    />
  );

  return (
    <AddressField field={EmailFieldTypes.FROM} isFocused={isFocused} showField>
      <FieldHeight>
        <FromAddressLabel
          $isFocused={isFocused}
          data-test='from-field'
          onClick={focusAndOpenDropdown}
          ref={fromSelectRef}
        >
          <Typography mono uppercase>
            {getAliasDisplayText(userEmail)}
          </Typography>
          <Icons color='disabled' icon={Icon.ChevronDown} />
        </FromAddressLabel>
      </FieldHeight>
      <Dropdown
        buttonRef={fromSelectRef}
        highlightedIdx={hoveredAliasIndex}
        maxHeight={200}
        numChildren={emailAliases.length}
        portal
        setHighlightedIdx={setHoveredAliasIndex}
        setShowDropdown={() => setFocusedField(null)}
        showDropdown={showUserAliasDropdown}
      >
        {emailAliases.map((alias, index) => (
          <DropdownItem
            active={alias === userEmail}
            highlight={hoveredAliasIndex !== undefined ? hoveredAliasIndex === index : undefined}
            key={alias}
            label={aliasDisplayLabels[index]}
            onClick={() => onSelectAlias(alias)}
            onHover={() => setHoveredAliasIndex(index)}
            value={alias}
          />
        ))}
        {renderAddAliasOption()}
      </Dropdown>
      {isMobile && (
        <Drawer hideDrawer={closeDrawer} show={showAliasDrawer} title='Choose Alias'>
          <DrawerOptions>
            {emailAliases.map((alias, index) => (
              <DrawerOption key={index}>
                <DropdownItem label={aliasDisplayLabels[index]} onClick={() => onSelectAlias(alias)} />
              </DrawerOption>
            ))}
            {renderAddAliasOption()}
          </DrawerOptions>
        </Drawer>
      )}
    </AddressField>
  );
};

export default memo(FromAddressField);
