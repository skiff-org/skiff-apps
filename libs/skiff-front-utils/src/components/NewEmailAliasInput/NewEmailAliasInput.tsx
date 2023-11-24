import {
  Button,
  DropdownItem,
  FilledVariant,
  Icon,
  InputField,
  InputFieldSize,
  Size,
  ThemeMode,
  Typography
} from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ALIAS_MAXIMUM_LENGTH, MAIL_DOMAIN } from '../../utils';
import { getEndAdornment } from '../../utils/emailUtils';
import { ConfirmModal } from '../modals';
import SelectField from '../SelectField/SelectField';

import { checkValidEmailAlias } from './NewEmailAliasInput.utils';

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
  setPreSubmitError: (error?: string) => void;
  setPostSubmitError: (error?: string) => void;
  setAlias: (alias: string) => void;
  newAlias: string;
  username: string;
  confirmModalControls?: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
  };
  customDomains?: string[];
  dataTest?: string;
  disabled?: boolean;
  disableSkiffDomain?: boolean;
  disableCustomDomains?: boolean;
  helperText?: string;
  hideAddAliasButton?: boolean;
  isAddingAlias?: boolean;
  isWalletAlias?: boolean;
  postSubmitError?: string;
  preSubmitError?: string;
  showDesktop?: boolean;
  size?: InputFieldSize;
  selectedCustomDomain?: string;
  customPlaceholder?: string;
  icon?: Icon;
  autoFocus?: boolean;
  addAlias?: () => Promise<void> | void;
  onEnter?: (e: React.KeyboardEvent) => void;
  setCustomDomain?: (value: string | undefined) => void;
  forceTheme?: ThemeMode;
}

export const NewEmailAliasInput: React.FC<NewEmailAliasInputProps> = ({
  size,
  helperText,
  hideAddAliasButton,
  dataTest,
  setPreSubmitError,
  setPostSubmitError,
  setAlias,
  newAlias,
  username,
  confirmModalControls,
  customDomains = [],
  isAddingAlias,
  isWalletAlias,
  postSubmitError,
  preSubmitError,
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
  const defaultMailDomain = getEndAdornment(username);
  const [mailDomain, setMailDomain] = useState(defaultMailDomain);
  const availableDomains = disableSkiffDomain ? customDomains : [defaultMailDomain, ...customDomains];
  const showMultipleDomains = disableCustomDomains ? false : availableDomains.length > 1;
  const getLongestDomain = (domains: string[]) => domains.reduce((a, b) => (a.length > b.length ? a : b), '');
  const domainSelectWidth = Math.min(
    MAX_DOMAIN_SELECT_WIDTH,
    Math.max(MIN_DOMAIN_SELECT_WIDTH, getLongestDomain(availableDomains).length * DOMAIN_LENGTH_SCALE_FACTOR)
  );
  const showAddAliasButton = !!addAlias && !hideAddAliasButton;

  const openConfirmModal = () => {
    if (!!confirmModalControls) confirmModalControls.setIsOpen(true);
    else setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    if (!!confirmModalControls) confirmModalControls.setIsOpen(false);
    else setIsConfirmModalOpen(false);
  };

  // Opens the confirm modal if no errors exist
  const handleAddAliasClick = () => {
    if (!preSubmitError && !postSubmitError) openConfirmModal();
    else if (preSubmitError) setPostSubmitError(preSubmitError);
  };

  const onConfirmAddAlias = async () => {
    await addAlias?.();
    closeConfirmModal();
  };

  useEffect(() => {
    setPreSubmitError(undefined);
    setPostSubmitError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailDomain]);

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
              <Typography forceTheme={forceTheme}>
                {disableSkiffDomain ? `@${customDomains[0]}` : defaultMailDomain}
              </Typography>
            )
          }
          // Higher priority is given to post-submit errors
          error={postSubmitError ?? preSubmitError}
          forceTheme={forceTheme}
          helperText={helperText}
          icon={icon}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const alias = value.slice(0, ALIAS_MAXIMUM_LENGTH + 1);
            if (mailDomain.replace('@', '') === MAIL_DOMAIN) {
              // check email alias with unsliced value so that "too long" error is rendered
              checkValidEmailAlias(value, setPreSubmitError, setPostSubmitError);
            }
            setAlias(alias);
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
          <SelectField
            forceTheme={forceTheme}
            onChange={(value: string) => {
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
          </SelectField>
        )}
      </NewEmailAliasInputContainer>
      {showAddAliasButton && (
        <div>
          <Button disabled={isAddingAlias} forceTheme={forceTheme} onClick={handleAddAliasClick}>
            Add
          </Button>
        </div>
      )}
      <ConfirmModal
        confirmName='Add address'
        description='You will be able to send and receive mail at this address.'
        forceTheme={forceTheme}
        onClose={closeConfirmModal}
        onConfirm={onConfirmAddAlias}
        open={isConfirmModalOpen || !!confirmModalControls?.isOpen}
        title={`Add ${newAlias}@${selectedCustomDomain || 'skiff.com'}`}
      />
    </AddAliasContainer>
  );
};
