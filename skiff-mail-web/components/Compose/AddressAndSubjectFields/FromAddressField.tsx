import { DropdownItem, Select, Typography } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import styled from 'styled-components';

import { EmailFieldTypes } from '../Compose.constants';
import AddressField from './AddressField';

const FromAddressLabel = styled.div`
  padding-left: 13px;
  padding-bottom: 1px;
`;

interface FromAddressFieldProps {
  focusedField: EmailFieldTypes | null;
  emailAliases: string[];
  setFocusedField: (field: EmailFieldTypes | null) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const FromAddressField: React.FC<FromAddressFieldProps> = ({
  focusedField,
  emailAliases,
  setFocusedField,
  userEmail,
  setUserEmail
}) => {
  const [showUserAliasDropdown, setShowUserAliasDropdown] = useState(false);
  const [isUserAliasOptionsOpen, setIsUserAliasOptionsOpen] = useState(false);

  const updateDropdownAndFieldState = (state: boolean) => {
    setShowUserAliasDropdown(state);
    setIsUserAliasOptionsOpen(state);
    setFocusedField(null);
  };

  return (
    <AddressField field={EmailFieldTypes.FROM} focusedField={focusedField}>
      {!showUserAliasDropdown ? (
        <FromAddressLabel>
          <Typography color={focusedField === EmailFieldTypes.FROM ? 'primary' : 'secondary'} type='paragraph'>
            <div
              onMouseEnter={() => {
                // Only show the email alias dropdown if the user has multiple aliases
                if (emailAliases.length > 1) {
                  setShowUserAliasDropdown(true);
                  setFocusedField(EmailFieldTypes.FROM);
                }
              }}
            >
              {userEmail}
            </div>
          </Typography>
        </FromAddressLabel>
      ) : (
        <div
          onMouseLeave={() => {
            // Don't show the dropdown if the user moves their mouse away
            // and the dropdown options are not open
            if (!isUserAliasOptionsOpen) {
              setShowUserAliasDropdown(false);
              setFocusedField(null);
            }
          }}
        >
          <Select
            onChange={(selectedAlias) => {
              setUserEmail(selectedAlias);
              updateDropdownAndFieldState(false);
              setShowUserAliasDropdown(false);
            }}
            onToggleAddtlAction={(open: boolean) => {
              updateDropdownAndFieldState(open);
            }}
            portal
            size='medium'
            type='field'
            value={userEmail}
          >
            {emailAliases.map((alias) => (
              <DropdownItem key={alias} label={alias} value={alias} />
            ))}
          </Select>
        </div>
      )}
    </AddressField>
  );
};

export default FromAddressField;
