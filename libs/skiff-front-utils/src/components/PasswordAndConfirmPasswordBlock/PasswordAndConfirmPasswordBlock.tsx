import { Icon, InputField, InputType } from '@skiff-org/skiff-ui';
import React, { useRef, useState } from 'react';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';

import InputFieldEndAction from '../InputFieldEndAction';

import PasswordStrengthIndicatorLoader from './PasswordStrengthIndicatorLoader';

const PasswordInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

interface PasswordAndConfirmPasswordBlockProps {
  // The user's password
  password: string;
  setPassword: (password: string) => void;
  // value of the confirm password textbox
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  // shows when there's an error during login
  loginError: string;
  setLoginError: (loginError: string) => void;
  onEnterKeyPress: (e: React.KeyboardEvent) => void;
  setStrongPassword: (strongPassword: boolean) => void;
  passwordLabel?: string;
  autoFocus?: boolean;
  hideForm?: boolean;
  hideStrengthBar?: boolean;
}

/**
 * Component shows TextFields for entering a password and confirming the password
 */
export default function PasswordAndConfirmPasswordBlock(props: PasswordAndConfirmPasswordBlockProps) {
  const {
    autoFocus,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loginError,
    setLoginError,
    onEnterKeyPress,
    setStrongPassword,
    passwordLabel,
    hideForm,
    hideStrengthBar
  } = props;
  // determines whether or not to show the user's password in text
  const [showPassword, setShowPassword] = useState(false);

  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const passwordStrengthIndicator = (
    <PasswordStrengthIndicatorLoader
      key='strength-indicator'
      password={password}
      setStrongPassword={setStrongPassword}
    />
  );

  const showPasswordButton = (
    <InputFieldEndAction
      icon={showPassword ? Icon.EyeSlash : Icon.Eye}
      onClick={() => setShowPassword(!showPassword)}
      tooltip={showPassword ? 'Hide password' : 'Show password'}
    />
  );

  const innerFields = (
    <div>
      <PasswordInputContainer>
        <InputField
          autoComplete='new-password' // https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands/
          autoFocus={autoFocus}
          dataTest='confirm-password-input'
          endAdornment={[...insertIf(!hideStrengthBar, passwordStrengthIndicator), showPasswordButton]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (!!loginError) setLoginError('');
            setPassword(e.target.value);
          }}
          onKeyPress={(e: React.KeyboardEvent) => {
            // pressing enter moves focus to the next field
            if (e.key === 'Enter') confirmPasswordInputRef.current?.focus();
          }}
          placeholder={passwordLabel || 'Password'}
          type={showPassword ? InputType.DEFAULT : InputType.PASSWORD}
          value={password}
        />
        <InputField
          autoComplete='new-password' // https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands/
          dataTest='second-confirm-password-input'
          endAdornment={showPasswordButton}
          errorMsg={loginError}
          innerRef={confirmPasswordInputRef}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (!!loginError) setLoginError('');
            setConfirmPassword(e.target.value);
          }}
          onKeyPress={onEnterKeyPress}
          placeholder='Confirm password'
          type={showPassword ? InputType.DEFAULT : InputType.PASSWORD}
          value={confirmPassword}
        />
      </PasswordInputContainer>
    </div>
  );

  // for 1p when parent is already a form
  if (hideForm) {
    return innerFields;
  }

  return (
    <form style={{ width: '100%' }}>
      {/* needed for 1password auto-fill */}
      {innerFields}
    </form>
  );
}
