import {
  Button,
  DropdownItem,
  FilledVariant,
  Icon,
  InputField,
  InputFieldSize,
  Select,
  Size,
  ThemeMode,
  Typography
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { ALIAS_MAXIMUM_LENGTH, postSubmitAliasValidation, preSubmitAliasValidation } from '../../utils';
import { getEndAdornment } from '../../utils/emailUtils';
import { ConfirmModal } from '../modals';

const AddAliasContainer = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const NewEmailAliasInputContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 8px;
`;

const MIN_DOMAIN_SELECT_WIDTH = 156;
const MAX_DOMAIN_SELECT_WIDTH = 280;
// adjust the select width based on length of available domains
const DOMAIN_LENGTH_SCALE_FACTOR = 14;

export interface NewEmailAliasInputProps {
  didSubmit: boolean;
  postSubmitError: string;
  preSubmitError: string;
  setPreSubmitError: (error: string) => void;
  setPostSubmitError: (error: string) => void;
  setAlias: (alias: string) => void;
  setDidSubmit: (submitted: boolean) => void;
  newAlias: string;
  username: string;
  customDomains?: string[];
  dataTest?: string;
  disabled?: boolean;
  disableSkiffDomain?: boolean;
  disableCustomDomains?: boolean;
  helperText?: string;
  isAddingAlias?: boolean;
  isUdAlias?: boolean;
  isWalletAlias?: boolean;
  showDesktop?: boolean;
  size?: InputFieldSize;
  selectedCustomDomain?: string;
  customPlaceholder?: string;
  icon?: Icon;
  autoFocus?: boolean;
  addAlias?: () => void;
  onEnter?: (e: React.KeyboardEvent) => void;
  setCustomDomain?: (value: string | undefined) => void;
  forceTheme?: ThemeMode;
}

// Validates email alias syntax
export const checkValidEmailAlias = (
  emailAlias: string,
  setPreSubmitError: NewEmailAliasInputProps['setPreSubmitError'],
  setPostSubmitError: NewEmailAliasInputProps['setPostSubmitError']
) => {
  if (!emailAlias) {
    setPreSubmitError('');
    setPostSubmitError('');
    return false;
  }
  try {
    preSubmitAliasValidation(emailAlias);
    try {
      postSubmitAliasValidation(emailAlias);
    } catch (error: any) {
      setPreSubmitError('');
      setPostSubmitError(error.message);
      return false;
    }

    // clear all errors
    setPreSubmitError('');
    setPostSubmitError('');
    return true;
  } catch (error: any) {
    setPostSubmitError('');
    setPreSubmitError(error.message);
    return false;
  }
};

export const NewEmailAliasInput: React.FC<NewEmailAliasInputProps> = ({
  didSubmit,
  postSubmitError,
  preSubmitError,
  size,
  helperText,
  dataTest,
  setPreSubmitError,
  setPostSubmitError,
  setAlias,
  setDidSubmit,
  newAlias,
  username,
  customDomains = [],
  isAddingAlias,
  isWalletAlias,
  isUdAlias,
  disabled,
  selectedCustomDomain,
  disableSkiffDomain,
  customPlaceholder,
  disableCustomDomains,
  icon,
  autoFocus = true,
  addAlias,
  onEnter,
  setCustomDomain,
  forceTheme
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // show username is available if text field non empty and no errors
  const defaultMailDomain = getEndAdornment(!!isUdAlias, username);
  const [mailDomain, setMailDomain] = useState(defaultMailDomain);
  const availableDomains = disableSkiffDomain ? customDomains : [defaultMailDomain, ...customDomains];
  const showMultipleDomains = disableCustomDomains ? false : availableDomains.length > 1;
  const getLongestDomain = (domains: string[]) => domains.reduce((a, b) => (a.length > b.length ? a : b), '');
  const domainSelectWidth = Math.min(
    MAX_DOMAIN_SELECT_WIDTH,
    Math.max(MIN_DOMAIN_SELECT_WIDTH, getLongestDomain(availableDomains).length * DOMAIN_LENGTH_SCALE_FACTOR)
  );
  const showAddAliasButton = !!addAlias;

  // Opens the confirm modal if no errors exist
  const handleAddAliasClick = () => {
    setDidSubmit(true);
    if (preSubmitError || postSubmitError) {
      if (preSubmitError) setPostSubmitError(preSubmitError);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const onConfirmAddAlias = () => {
    addAlias?.();
    setIsConfirmModalOpen(false);
  };

  // Set custom domain to first available on load
  useEffect(() => {
    if (disableSkiffDomain && setCustomDomain) {
      setCustomDomain(customDomains[0]);
      setMailDomain(customDomains[0]);
    }
  }, [disableSkiffDomain, customDomains, setCustomDomain]);

  return (
    <AddAliasContainer>
      <NewEmailAliasInputContainer>
        <InputField
          autoFocus={autoFocus}
          dataTest={dataTest}
          disabled={disabled || isWalletAlias} // wallet aliases are pre-filled
          endAdornment={
            !showMultipleDomains && (
              <Typography forceTheme={isMobile ? forceTheme : undefined}>
                {disableSkiffDomain ? `@${customDomains[0]}` : defaultMailDomain}
              </Typography>
            )
          }
          errorMsg={(didSubmit ? postSubmitError : preSubmitError) || undefined}
          forceTheme={isMobile ? forceTheme : undefined}
          helperText={helperText}
          icon={icon}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const alias = value.slice(0, ALIAS_MAXIMUM_LENGTH + 1);
            // check email alias with unsliced value so that "too long" error is rendered
            checkValidEmailAlias(value, setPreSubmitError, setPostSubmitError);
            setAlias(alias);
            setDidSubmit(false);
          }}
          onKeyDown={(evt: React.KeyboardEvent) => {
            if (evt.key === 'Enter') {
              if (!!onEnter) onEnter(evt);
              else if (showAddAliasButton) handleAddAliasClick();
            }
          }}
          placeholder={customPlaceholder ?? 'New email address'}
          size={size}
          value={newAlias}
        />
        {showMultipleDomains && (
          <Select
            forceTheme={isMobile ? forceTheme : undefined}
            onChange={(value) => {
              setMailDomain(value);
              if (!setCustomDomain) return;
              if (value === defaultMailDomain) {
                setCustomDomain(undefined);
              } else {
                setCustomDomain(value);
              }
            }}
            size={Size.MEDIUM}
            value={mailDomain}
            variant={FilledVariant.FILLED}
            width={domainSelectWidth}
          >
            {availableDomains.map((item, index) => {
              const label = item === defaultMailDomain ? item : '@' + item;
              return (
                <DropdownItem
                  hideDivider={index === availableDomains.length - 1}
                  key={`new-email-alias-domain-${item}`}
                  label={label}
                  value={item}
                />
              );
            })}
          </Select>
        )}
      </NewEmailAliasInputContainer>
      {showAddAliasButton && (
        <div>
          <Button disabled={isAddingAlias} forceTheme={isMobile ? forceTheme : undefined} onClick={handleAddAliasClick}>
            Add
          </Button>
        </div>
      )}
      <ConfirmModal
        confirmName='Add alias'
        description='You will be able to send and receive mail at this alias.'
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmAddAlias}
        open={isConfirmModalOpen}
        title={`Add ${newAlias}@${selectedCustomDomain || 'skiff.com'}`}
      />
    </AddAliasContainer>
  );
};
