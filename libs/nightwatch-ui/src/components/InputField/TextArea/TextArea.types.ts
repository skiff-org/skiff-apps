import { InputFieldProps } from '../InputField.types';

export interface TextAreaProps extends InputFieldProps {
  /** Ref passed to inner text area component */
  innerRef?: React.Ref<HTMLTextAreaElement>;
  /** Number of rows displayed */
  rows?: number;
  /** Expand height of the field based on the text length  */
  dynamicHeight?: boolean;
  /** onBlur event */
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** onChange event */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** onFocus event */
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** onKeyDown event */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** onKeyPress event */
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export type TextAreaComponent = React.ReactElement<TextAreaProps>;
