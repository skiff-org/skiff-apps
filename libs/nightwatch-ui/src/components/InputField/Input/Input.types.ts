import { MouseEventHandler } from 'react';

import { Icon } from '../../Icons';
import { InputFieldProps } from '../InputField.types';

export enum InputType {
  /** Normal text input */
  DEFAULT = 'default',
  /** Opens email keyboard for email input */
  EMAIL = 'email',
  /** Opens numeric keyboard and only allows inputs of type number  */
  NUMBER = 'number',
  /** Hides text for password input */
  PASSWORD = 'password'
}

export interface InputProps extends InputFieldProps {
  /** endAdornment component */
  endAdornment?: Icon | React.ReactNode | React.ReactNode[];
  /** Ref passed to inner input component */
  innerRef?: React.Ref<HTMLInputElement>;
  /** Whether the field is a readOnly field */
  readOnly?: boolean;
  /** Input type */
  type?: InputType;
  /** onBlur event */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** onChange event */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** onFocus event */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** onKeyDown event */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** onKeyPress event */
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** onPaste event */
  onPaste?: React.ClipboardEventHandler<HTMLInputElement> | ((e?: React.ClipboardEvent<HTMLDivElement>) => void);
  onMouseEnter?: MouseEventHandler<HTMLInputElement>;
  onMouseLeave?: MouseEventHandler<HTMLInputElement>;
}

export type InputComponent = React.ReactElement<InputProps>;
